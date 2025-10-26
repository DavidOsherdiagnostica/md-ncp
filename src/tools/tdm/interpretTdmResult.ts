/**
 * Interpret TDM Result Tool
 * Analyzes TDM result and recommends dose adjustments
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for TDM result interpretation input
export const InterpretTdmResultSchema = z.object({
  patient_id: z.string().min(1).describe("Unique patient identifier"),
  drug_name: z.string().describe("Name of the medication"),
  measured_concentration: z.number().describe("Measured drug concentration with units"),
  sample_datetime: z.string().describe("ISO8601 datetime when sample was collected"),
  sample_type: z.enum(['trough', 'peak', 'random']).describe("Type of sample collected"),
  collection_plan_id: z.string().optional().describe("ID from plan_sample_collection tool"),
  actual_dose_time: z.string().describe("ISO8601 datetime when dose was actually given"),
  actual_collection_time: z.string().describe("ISO8601 datetime when sample was actually collected"),
  current_dosing_regimen: z.object({
    dose: z.string().describe("Current dose with units"),
    frequency: z.string().describe("Current dosing frequency"),
    route: z.string().describe("Route of administration")
  }),
  therapeutic_range: z.object({
    lower_limit: z.number().describe("Lower limit of therapeutic range"),
    upper_limit: z.number().describe("Upper limit of therapeutic range"),
    units: z.string().describe("Units of measurement")
  }),
  clinical_response: z.object({
    therapeutic_effect: z.enum(['none', 'partial', 'adequate', 'excessive']).describe("Observed therapeutic effect"),
    adverse_effects: z.array(z.string()).describe("List of adverse effects observed"),
    signs_of_toxicity: z.array(z.string()).describe("Signs of toxicity if any")
  })
});

export type InterpretTdmResultInput = z.infer<typeof InterpretTdmResultSchema>;

// TDM interpretation output
export interface TdmInterpretationOutput {
  interpretation: {
    level_status: 'subtherapeutic' | 'therapeutic' | 'supratherapeutic' | 'toxic';
    clinical_significance: string;
    timing_appropriate: boolean;
    timing_impact_on_interpretation: string;
  };
  dose_recommendation: {
    action: 'maintain' | 'increase' | 'decrease' | 'discontinue' | 'consult_specialist';
    new_dose?: string;
    new_frequency?: string;
    rationale: string;
    expected_new_level?: number;
  };
  follow_up_plan: {
    repeat_tdm: boolean;
    repeat_timing?: string;
    clinical_monitoring: string[];
    laboratory_monitoring: string[];
  };
  alerts: string[];
}

// ===== TOOL REGISTRATION =====

export function registerInterpretTdmResultTool(server: McpServer): void {
  server.registerTool(
    "interpret_tdm_result",
    {
      title: "Interpret TDM Result",
      description: `Analyzes TDM result and provides clinical interpretation with dose adjustment recommendations.

**Purpose:** Provide clinical interpretation of TDM results with actionable recommendations.

**Input Parameters:**
- patient_id: Unique patient identifier
- drug_name: Name of the medication
- measured_concentration: Measured drug level
- sample_datetime: When sample was collected
- sample_type: Type of sample (trough, peak, random)
- actual_dose_time: When dose was actually given
- actual_collection_time: When sample was actually collected
- current_dosing_regimen: Current dosing details
- therapeutic_range: Therapeutic range for the drug
- clinical_response: Observed clinical effects

**Process:**
1. Validate sample timing accuracy
2. Compare result to therapeutic range
3. Assess clinical correlation
4. Calculate dose adjustment if needed
5. Consider pharmacokinetic parameters

**Output:** Returns interpretation with dose recommendations and follow-up plan.`,
      inputSchema: InterpretTdmResultSchema.shape,
    },
    async (input: InterpretTdmResultInput): Promise<McpResponse<TdmInterpretationOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(InterpretTdmResultSchema, input, "interpret_tdm_result");

        // 2. Process TDM interpretation
        const interpretationOutput = processTdmInterpretation(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(interpretationOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in interpret_tdm_result tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "interpret_tdm_result", 
          userInput: input 
        });
      }
    }
  );
}

// ===== TDM INTERPRETATION PROCESSING =====

function processTdmInterpretation(input: InterpretTdmResultInput): TdmInterpretationOutput {
  // Assess timing appropriateness
  const timingAssessment = assessSampleTiming(input);
  
  // Determine level status
  const levelStatus = determineLevelStatus(input.measured_concentration, input.therapeutic_range);
  
  // Generate clinical significance
  const clinicalSignificance = generateClinicalSignificance(levelStatus, input.clinical_response);
  
  // Calculate dose recommendation
  const doseRecommendation = calculateDoseRecommendation(input, levelStatus);
  
  // Create follow-up plan
  const followUpPlan = createFollowUpPlan(input, levelStatus);
  
  // Generate alerts
  const alerts = generateAlerts(input, levelStatus);
  
  return {
    interpretation: {
      level_status: levelStatus,
      clinical_significance: clinicalSignificance,
      timing_appropriate: timingAssessment.appropriate,
      timing_impact_on_interpretation: timingAssessment.impact
    },
    dose_recommendation: doseRecommendation,
    follow_up_plan: followUpPlan,
    alerts: alerts
  };
}

function assessSampleTiming(input: InterpretTdmResultInput): {
  appropriate: boolean;
  impact: string;
} {
  const doseTime = new Date(input.actual_dose_time);
  const collectionTime = new Date(input.actual_collection_time);
  const timeDifference = (collectionTime.getTime() - doseTime.getTime()) / (1000 * 60); // minutes
  
  let appropriate = true;
  let impact = '';
  
  if (input.sample_type === 'trough') {
    // Trough should be 0-60 minutes before next dose
    if (timeDifference < -60 || timeDifference > 0) {
      appropriate = false;
      impact = 'Trough sample timing inappropriate - may not represent true trough level';
    }
  } else if (input.sample_type === 'peak') {
    // Peak timing depends on route
    if (input.current_dosing_regimen.route === 'oral') {
      if (timeDifference < 60 || timeDifference > 180) {
        appropriate = false;
        impact = 'Peak sample timing inappropriate for oral medication - may not represent true peak';
      }
    } else if (input.current_dosing_regimen.route.includes('iv')) {
      if (timeDifference < 60 || timeDifference > 180) {
        appropriate = false;
        impact = 'Peak sample timing inappropriate for IV medication - may not represent true peak';
      }
    }
  }
  
  return { appropriate, impact };
}

function determineLevelStatus(concentration: number, therapeuticRange: {
  lower_limit: number;
  upper_limit: number;
  units: string;
}): 'subtherapeutic' | 'therapeutic' | 'supratherapeutic' | 'toxic' {
  if (concentration < therapeuticRange.lower_limit) {
    return 'subtherapeutic';
  } else if (concentration <= therapeuticRange.upper_limit) {
    return 'therapeutic';
  } else if (concentration <= therapeuticRange.upper_limit * 1.5) {
    return 'supratherapeutic';
  } else {
    return 'toxic';
  }
}

function generateClinicalSignificance(
  levelStatus: string, 
  clinicalResponse: {
    therapeutic_effect: string;
    adverse_effects: string[];
    signs_of_toxicity: string[];
  }
): string {
  const significance: string[] = [];
  
  if (levelStatus === 'subtherapeutic') {
    significance.push('Drug level below therapeutic range');
    if (clinicalResponse.therapeutic_effect === 'none' || clinicalResponse.therapeutic_effect === 'partial') {
      significance.push('Inadequate therapeutic response correlates with subtherapeutic level');
    }
  } else if (levelStatus === 'therapeutic') {
    significance.push('Drug level within therapeutic range');
    if (clinicalResponse.therapeutic_effect === 'adequate') {
      significance.push('Therapeutic level correlates with adequate clinical response');
    }
  } else if (levelStatus === 'supratherapeutic') {
    significance.push('Drug level above therapeutic range');
    if (clinicalResponse.adverse_effects.length > 0) {
      significance.push('Elevated level may be contributing to adverse effects');
    }
  } else if (levelStatus === 'toxic') {
    significance.push('Drug level in toxic range');
    if (clinicalResponse.signs_of_toxicity.length > 0) {
      significance.push('Toxic level correlates with signs of toxicity');
    }
  }
  
  return significance.join('. ');
}

function calculateDoseRecommendation(
  input: InterpretTdmResultInput, 
  levelStatus: string
): {
  action: 'maintain' | 'increase' | 'decrease' | 'discontinue' | 'consult_specialist';
  new_dose?: string;
  new_frequency?: string;
  rationale: string;
  expected_new_level?: number;
} {
  const currentDose = parseFloat(input.current_dosing_regimen.dose);
  
  switch (levelStatus) {
    case 'subtherapeutic':
      if (input.clinical_response.therapeutic_effect === 'none' || input.clinical_response.therapeutic_effect === 'partial') {
        const newDose = Math.round(currentDose * 1.25 * 100) / 100; // 25% increase
        return {
          action: 'increase',
          new_dose: `${newDose} mg`,
          rationale: 'Subtherapeutic level with inadequate response - increase dose by 25%',
          expected_new_level: input.measured_concentration * 1.25
        };
      } else {
        return {
          action: 'maintain',
          rationale: 'Subtherapeutic level but adequate clinical response - maintain current dose'
        };
      }
      
    case 'therapeutic':
      return {
        action: 'maintain',
        rationale: 'Therapeutic level with appropriate clinical response - maintain current dose'
      };
      
    case 'supratherapeutic':
      if (input.clinical_response.adverse_effects.length > 0) {
        const newDose = Math.round(currentDose * 0.8 * 100) / 100; // 20% decrease
        return {
          action: 'decrease',
          new_dose: `${newDose} mg`,
          rationale: 'Supratherapeutic level with adverse effects - decrease dose by 20%',
          expected_new_level: input.measured_concentration * 0.8
        };
      } else {
        return {
          action: 'maintain',
          rationale: 'Supratherapeutic level but no adverse effects - monitor closely and maintain dose'
        };
      }
      
    case 'toxic':
      if (input.clinical_response.signs_of_toxicity.length > 0) {
        return {
          action: 'discontinue',
          rationale: 'Toxic level with signs of toxicity - discontinue medication immediately'
        };
      } else {
        const newDose = Math.round(currentDose * 0.5 * 100) / 100; // 50% decrease
        return {
          action: 'decrease',
          new_dose: `${newDose} mg`,
          rationale: 'Toxic level - decrease dose by 50% and monitor closely',
          expected_new_level: input.measured_concentration * 0.5
        };
      }
      
    default:
      return {
        action: 'consult_specialist',
        rationale: 'Complex clinical scenario - consult clinical pharmacist or specialist'
      };
  }
}

function createFollowUpPlan(
  input: InterpretTdmResultInput, 
  levelStatus: string
): {
  repeat_tdm: boolean;
  repeat_timing?: string;
  clinical_monitoring: string[];
  laboratory_monitoring: string[];
} {
  const clinicalMonitoring: string[] = [];
  const laboratoryMonitoring: string[] = [];
  let repeatTdm = false;
  let repeatTiming: string | undefined;
  
  if (levelStatus === 'subtherapeutic' || levelStatus === 'supratherapeutic' || levelStatus === 'toxic') {
    repeatTdm = true;
    repeatTiming = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days
  }
  
  // Clinical monitoring based on drug and level status
  if (input.drug_name.toLowerCase().includes('vancomycin')) {
    clinicalMonitoring.push('Monitor for signs of nephrotoxicity');
    clinicalMonitoring.push('Monitor for signs of ototoxicity');
    laboratoryMonitoring.push('Serum creatinine daily');
    laboratoryMonitoring.push('BUN daily');
  }
  
  if (input.drug_name.toLowerCase().includes('digoxin')) {
    clinicalMonitoring.push('Monitor heart rate and rhythm');
    clinicalMonitoring.push('Monitor for signs of digoxin toxicity');
    laboratoryMonitoring.push('Serum potassium');
    laboratoryMonitoring.push('Serum magnesium');
  }
  
  if (levelStatus === 'toxic') {
    clinicalMonitoring.push('Monitor vital signs closely');
    clinicalMonitoring.push('Assess for signs of organ toxicity');
    laboratoryMonitoring.push('Comprehensive metabolic panel');
    laboratoryMonitoring.push('Liver function tests');
  }
  
  return {
    repeat_tdm: repeatTdm,
    ...(repeatTiming && { repeat_timing: repeatTiming }),
    clinical_monitoring: clinicalMonitoring,
    laboratory_monitoring: laboratoryMonitoring
  };
}

function generateAlerts(input: InterpretTdmResultInput, levelStatus: string): string[] {
  const alerts: string[] = [];
  
  if (levelStatus === 'toxic') {
    alerts.push('URGENT: Toxic drug level detected - immediate intervention required');
    alerts.push('Consider holding next dose and reassessing');
  }
  
  if (levelStatus === 'supratherapeutic' && input.clinical_response.adverse_effects.length > 0) {
    alerts.push('Elevated drug level with adverse effects - consider dose reduction');
  }
  
  if (levelStatus === 'subtherapeutic' && input.clinical_response.therapeutic_effect === 'none') {
    alerts.push('Subtherapeutic level with no therapeutic effect - consider dose increase');
  }
  
  return alerts;
}
