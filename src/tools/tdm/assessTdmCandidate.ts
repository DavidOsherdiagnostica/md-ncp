/**
 * Assess TDM Candidate Tool
 * Determines if a medication requires Therapeutic Drug Monitoring (TDM)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for TDM candidate assessment input
export const AssessTdmCandidateSchema = z.object({
  patient_id: z.string().min(1).describe("Unique patient identifier"),
  medication: z.object({
    drug_name: z.string().describe("Name of the medication"),
    current_dose: z.string().describe("Current dose with units"),
    frequency: z.string().describe("Dosing frequency"),
    route: z.string().describe("Route of administration"),
    indication: z.string().describe("Clinical indication"),
    start_date: z.string().describe("ISO8601 date when medication started")
  }),
  patient_factors: z.object({
    age: z.number().describe("Patient age in years"),
    weight_kg: z.number().describe("Patient weight in kilograms"),
    organ_function: z.object({
      renal_function: z.object({
        creatinine: z.number().optional().describe("Serum creatinine in mg/dL"),
        egfr: z.number().optional().describe("eGFR in mL/min/1.73m²"),
        clearance: z.number().optional().describe("Creatinine clearance in mL/min")
      }),
      hepatic_function: z.object({
        ast: z.number().optional().describe("AST level"),
        alt: z.number().optional().describe("ALT level"),
        bilirubin: z.number().optional().describe("Total bilirubin"),
        child_pugh_score: z.enum(['A', 'B', 'C']).optional().describe("Child-Pugh score")
      })
    }),
    pregnancy_status: z.boolean().describe("Whether patient is pregnant"),
    concurrent_medications: z.array(z.string()).describe("List of concurrent medications")
  })
});

export type AssessTdmCandidateInput = z.infer<typeof AssessTdmCandidateSchema>;

// TDM assessment output
export interface TdmAssessmentOutput {
  tdm_indicated: boolean;
  indication_reasons: string[];
  drug_characteristics: {
    therapeutic_range: string;
    toxic_level: string;
    half_life: string;
    time_to_steady_state: string;
  };
  recommended_monitoring_frequency: string;
  initial_sample_timing: string;
  sample_type: 'trough' | 'peak' | 'random' | 'both';
  clinical_considerations: string[];
  risk_factors: string[];
}

// ===== TOOL REGISTRATION =====

export function registerAssessTdmCandidateTool(server: McpServer): void {
  server.registerTool(
    "assess_tdm_candidate",
    {
      title: "Assess TDM Candidate",
      description: `Determines if a medication requires Therapeutic Drug Monitoring (TDM) based on clinical criteria.

**Purpose:** Identify medications that require TDM for optimal dosing and safety.

**Input Parameters:**
- patient_id: Unique patient identifier
- medication: Current medication details
- patient_factors: Patient demographics and organ function

**Assessment Criteria:**
1. Narrow therapeutic index?
2. High pharmacokinetic variability?
3. Difficult to monitor target concentrations?
4. Known to cause therapeutic/adverse effects?
5. Serious consequences from toxicity/subtherapeutic levels?

**Output:** Returns TDM recommendation with monitoring parameters and clinical considerations.`,
      inputSchema: AssessTdmCandidateSchema.shape,
    },
    async (input: AssessTdmCandidateInput): Promise<McpResponse<TdmAssessmentOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(AssessTdmCandidateSchema, input, "assess_tdm_candidate");

        // 2. Process TDM assessment
        const tdmOutput = processTdmAssessment(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(tdmOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in assess_tdm_candidate tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "assess_tdm_candidate", 
          userInput: input 
        });
      }
    }
  );
}

// ===== TDM ASSESSMENT PROCESSING =====

function processTdmAssessment(input: AssessTdmCandidateInput): TdmAssessmentOutput {
  const drugName = input.medication.drug_name.toLowerCase();
  
  // TDM-indicated medications database (simplified)
  const tdmMedications = {
    'vancomycin': {
      therapeutic_range: '10-20 mg/L (trough)',
      toxic_level: '>20 mg/L',
      half_life: '4-8 hours',
      time_to_steady_state: '24-48 hours',
      monitoring_frequency: 'Every 2-3 days until stable',
      sample_type: 'trough' as const,
      risk_factors: ['renal impairment', 'obesity', 'critical illness']
    },
    'digoxin': {
      therapeutic_range: '0.8-2.0 ng/mL',
      toxic_level: '>2.0 ng/mL',
      half_life: '36 hours',
      time_to_steady_state: '5-7 days',
      monitoring_frequency: 'Weekly until stable',
      sample_type: 'trough' as const,
      risk_factors: ['renal impairment', 'elderly', 'hypokalemia']
    },
    'phenytoin': {
      therapeutic_range: '10-20 mg/L',
      toxic_level: '>20 mg/L',
      half_life: '22 hours',
      time_to_steady_state: '5-7 days',
      monitoring_frequency: 'Weekly until stable',
      sample_type: 'trough' as const,
      risk_factors: ['hepatic impairment', 'drug interactions', 'elderly']
    },
    'lithium': {
      therapeutic_range: '0.6-1.2 mEq/L',
      toxic_level: '>1.5 mEq/L',
      half_life: '24 hours',
      time_to_steady_state: '5-7 days',
      monitoring_frequency: 'Weekly until stable',
      sample_type: 'trough' as const,
      risk_factors: ['renal impairment', 'dehydration', 'drug interactions']
    }
  };

  const drugInfo = tdmMedications[drugName as keyof typeof tdmMedications];
  
  if (!drugInfo) {
    return {
      tdm_indicated: false,
      indication_reasons: ['Medication not typically requiring TDM'],
      drug_characteristics: {
        therapeutic_range: 'Not applicable',
        toxic_level: 'Not applicable',
        half_life: 'Not applicable',
        time_to_steady_state: 'Not applicable'
      },
      recommended_monitoring_frequency: 'Not applicable',
      initial_sample_timing: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      sample_type: 'random',
      clinical_considerations: ['Consider alternative monitoring methods'],
      risk_factors: []
    };
  }

  // Assess patient-specific risk factors
  const riskFactors = assessRiskFactors(input, drugInfo.risk_factors);
  
  // Determine TDM indication
  const tdmIndicated = drugInfo !== undefined;
  const indicationReasons = tdmIndicated ? [
    'Narrow therapeutic index',
    'High pharmacokinetic variability',
    'Serious consequences from toxicity',
    'Difficult to monitor clinical response'
  ] : ['Medication does not require TDM'];

  // Calculate initial sample timing
  const startDate = new Date(input.medication.start_date);
  const steadyStateParts = drugInfo.time_to_steady_state.split(' ');
  const steadyStateHours = parseFloat(steadyStateParts[0] || '24') * 24;
  const initialSampleTiming = new Date(startDate.getTime() + steadyStateHours * 60 * 60 * 1000).toISOString();

  return {
    tdm_indicated: tdmIndicated,
    indication_reasons: indicationReasons,
    drug_characteristics: {
      therapeutic_range: drugInfo.therapeutic_range,
      toxic_level: drugInfo.toxic_level,
      half_life: drugInfo.half_life,
      time_to_steady_state: drugInfo.time_to_steady_state
    },
    recommended_monitoring_frequency: drugInfo.monitoring_frequency,
    initial_sample_timing: initialSampleTiming,
    sample_type: drugInfo.sample_type,
    clinical_considerations: [
      'Monitor for signs of toxicity',
      'Consider drug interactions',
      'Adjust dosing based on organ function'
    ],
    risk_factors: riskFactors
  };
}

function assessRiskFactors(input: AssessTdmCandidateInput, drugRiskFactors: string[]): string[] {
  const patientRiskFactors: string[] = [];
  
  // Check renal function
  if (input.patient_factors.organ_function.renal_function.egfr && 
      input.patient_factors.organ_function.renal_function.egfr < 60) {
    patientRiskFactors.push('renal impairment');
  }
  
  // Check hepatic function
  if (input.patient_factors.organ_function.hepatic_function.child_pugh_score && 
      input.patient_factors.organ_function.hepatic_function.child_pugh_score !== 'A') {
    patientRiskFactors.push('hepatic impairment');
  }
  
  // Check age
  if (input.patient_factors.age > 65) {
    patientRiskFactors.push('elderly');
  }
  
  // Check concurrent medications
  if (input.patient_factors.concurrent_medications.length > 5) {
    patientRiskFactors.push('polypharmacy');
  }
  
  // Return intersection of drug risk factors and patient risk factors
  return drugRiskFactors.filter(factor => patientRiskFactors.includes(factor));
}
