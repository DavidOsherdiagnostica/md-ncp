/**
 * Document Assessment Tool
 * Generates clinical assessment and differential diagnosis
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for assessment documentation input
export const DocumentAssessmentSchema = z.object({
  encounter_id: z.string().min(1).describe("Unique encounter identifier"),
  subjective_section_id: z.string().min(1).describe("ID from subjective documentation"),
  objective_section_id: z.string().min(1).describe("ID from objective documentation"),
  patient_demographics: z.object({
    age: z.number().describe("Patient age in years"),
    sex: z.enum(['M', 'F', 'Other']).describe("Patient sex"),
    relevant_history: z.array(z.string()).describe("Relevant medical history")
  }),
  working_diagnosis: z.object({
    primary: z.string().describe("Primary diagnosis with ICD-10 code"),
    confidence: z.enum(['high', 'moderate', 'low']).describe("Confidence level in diagnosis"),
    clinical_stability: z.enum(['stable', 'unstable', 'critical']).describe("Clinical stability")
  }),
  differential_diagnoses: z.array(z.object({
    diagnosis: z.string().describe("Differential diagnosis"),
    probability: z.enum(['high', 'moderate', 'low']).describe("Probability of this diagnosis"),
    supporting_features: z.array(z.string()).describe("Features supporting this diagnosis"),
    against_features: z.array(z.string()).describe("Features against this diagnosis"),
    requires_rule_out: z.boolean().describe("Whether this diagnosis requires ruling out")
  })).min(1).describe("Differential diagnoses"),
  problem_list: z.array(z.object({
    problem: z.string().describe("Clinical problem"),
    status: z.enum(['active', 'stable', 'resolved']).describe("Problem status"),
    priority: z.number().min(1).max(5).describe("Priority level (1=highest)")
  })).describe("Current problem list")
});

export type DocumentAssessmentInput = z.infer<typeof DocumentAssessmentSchema>;

// Assessment documentation output
export interface AssessmentDocumentationOutput {
  assessment_section: {
    section_id: string;
    clinical_summary: string;
    narrative: string;
    structured_assessment: {
      working_diagnosis: any;
      differential_diagnoses: any[];
      problem_list: any[];
    };
    risk_stratification: {
      overall_risk: 'low' | 'moderate' | 'high' | 'critical';
      specific_risks: string[];
    };
    prognosis: string;
  };
}

// ===== TOOL REGISTRATION =====

export function registerDocumentAssessmentTool(server: McpServer): void {
  server.registerTool(
    "document_assessment",
    {
      title: "Document Assessment",
      description: `Generates clinical assessment and differential diagnosis based on subjective and objective findings.

**Purpose:** Create clinical assessment with differential diagnosis and risk stratification.

**Input Parameters:**
- encounter_id: Unique encounter identifier
- subjective_section_id: ID from subjective documentation
- objective_section_id: ID from objective documentation
- patient_demographics: Patient age, sex, and relevant history
- working_diagnosis: Primary diagnosis with confidence level
- differential_diagnoses: List of differential diagnoses
- problem_list: Current clinical problems

**Process:**
1. Synthesize S and O sections
2. Create 1-2 sentence clinical summary
3. State primary assessment with confidence level
4. List differential diagnoses (2-3 minimum for new/unclear presentations)
5. Rank problems by severity
6. State clinical stability

**Output:** Returns formatted assessment section with risk stratification and prognosis.`,
      inputSchema: DocumentAssessmentSchema.shape,
    },
    async (input: DocumentAssessmentInput): Promise<McpResponse<AssessmentDocumentationOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(DocumentAssessmentSchema, input, "document_assessment");

        // 2. Process assessment documentation
        const assessmentOutput = processAssessmentDocumentation(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(assessmentOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in document_assessment tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "document_assessment", 
          userInput: input 
        });
      }
    }
  );
}

// ===== ASSESSMENT DOCUMENTATION PROCESSING =====

function processAssessmentDocumentation(input: DocumentAssessmentInput): AssessmentDocumentationOutput {
  const sectionId = `assess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Generate clinical summary
  const clinicalSummary = generateClinicalSummary(input);
  
  // Generate narrative
  const narrative = generateAssessmentNarrative(input);
  
  // Create structured assessment
  const structuredAssessment = createStructuredAssessment(input);
  
  // Perform risk stratification
  const riskStratification = performRiskStratification(input);
  
  // Generate prognosis
  const prognosis = generatePrognosis(input);
  
  return {
    assessment_section: {
      section_id: sectionId,
      clinical_summary: clinicalSummary,
      narrative,
      structured_assessment: structuredAssessment,
      risk_stratification: riskStratification,
      prognosis
    }
  };
}

function generateClinicalSummary(input: DocumentAssessmentInput): string {
  const age = input.patient_demographics.age;
  const sex = input.patient_demographics.sex === 'M' ? 'male' : input.patient_demographics.sex === 'F' ? 'female' : 'patient';
  const primaryDiagnosis = input.working_diagnosis.primary;
  const stability = input.working_diagnosis.clinical_stability;
  
  return `${age}-year-old ${sex} with ${primaryDiagnosis}, currently ${stability}.`;
}

function generateAssessmentNarrative(input: DocumentAssessmentInput): string {
  const narrative: string[] = [];
  
  // Assessment
  narrative.push('Assessment:');
  narrative.push(`1. ${input.working_diagnosis.primary} (${input.working_diagnosis.confidence} confidence)`);
  
  // Differential diagnoses
  if (input.differential_diagnoses.length > 0) {
    narrative.push('');
    narrative.push('Differential Diagnoses:');
    for (let i = 0; i < input.differential_diagnoses.length; i++) {
      const diff = input.differential_diagnoses[i];
      if (!diff) continue;
      
      narrative.push(`${i + 2}. ${diff.diagnosis} (${diff.probability} probability)`);
      
      if (diff.supporting_features.length > 0) {
        narrative.push(`   Supporting: ${diff.supporting_features.join(', ')}`);
      }
      
      if (diff.against_features.length > 0) {
        narrative.push(`   Against: ${diff.against_features.join(', ')}`);
      }
      
      if (diff.requires_rule_out) {
        narrative.push(`   * Requires ruling out`);
      }
    }
  }
  
  // Problem list
  if (input.problem_list.length > 0) {
    narrative.push('');
    narrative.push('Problem List:');
    
    // Sort problems by priority
    const sortedProblems = input.problem_list.sort((a, b) => a.priority - b.priority);
    
    for (let i = 0; i < sortedProblems.length; i++) {
      const problem = sortedProblems[i];
      if (!problem) continue;
      narrative.push(`${i + 1}. ${problem.problem} (${problem.status}, Priority ${problem.priority})`);
    }
  }
  
  // Clinical stability
  narrative.push('');
  narrative.push(`Clinical Status: ${input.working_diagnosis.clinical_stability}`);
  
  return narrative.join('\n');
}

function createStructuredAssessment(input: DocumentAssessmentInput): {
  working_diagnosis: any;
  differential_diagnoses: any[];
  problem_list: any[];
} {
  return {
    working_diagnosis: input.working_diagnosis,
    differential_diagnoses: input.differential_diagnoses,
    problem_list: input.problem_list
  };
}

function performRiskStratification(input: DocumentAssessmentInput): {
  overall_risk: 'low' | 'moderate' | 'high' | 'critical';
  specific_risks: string[];
} {
  const specificRisks: string[] = [];
  let riskScore = 0;
  
  // Assess risk based on clinical stability
  switch (input.working_diagnosis.clinical_stability) {
    case 'critical':
      riskScore += 4;
      specificRisks.push('Critical clinical status');
      break;
    case 'unstable':
      riskScore += 3;
      specificRisks.push('Unstable clinical status');
      break;
    case 'stable':
      riskScore += 1;
      break;
  }
  
  // Assess risk based on confidence in diagnosis
  switch (input.working_diagnosis.confidence) {
    case 'low':
      riskScore += 2;
      specificRisks.push('Low confidence in diagnosis');
      break;
    case 'moderate':
      riskScore += 1;
      break;
    case 'high':
      // No additional risk
      break;
  }
  
  // Assess risk based on differential diagnoses requiring rule-out
  const highRiskDifferentials = input.differential_diagnoses.filter(diff => 
    diff.probability === 'high' && diff.requires_rule_out
  );
  
  if (highRiskDifferentials.length > 0) {
    riskScore += 2;
    specificRisks.push('High-risk differential diagnoses requiring rule-out');
  }
  
  // Assess risk based on problem list
  const highPriorityProblems = input.problem_list.filter(problem => 
    problem.priority <= 2 && problem.status === 'active'
  );
  
  if (highPriorityProblems.length > 0) {
    riskScore += 1;
    specificRisks.push('High-priority active problems');
  }
  
  // Determine overall risk level
  let overallRisk: 'low' | 'moderate' | 'high' | 'critical';
  if (riskScore >= 5) {
    overallRisk = 'critical';
  } else if (riskScore >= 3) {
    overallRisk = 'high';
  } else if (riskScore >= 2) {
    overallRisk = 'moderate';
  } else {
    overallRisk = 'low';
  }
  
  return {
    overall_risk: overallRisk,
    specific_risks: specificRisks
  };
}

function generatePrognosis(input: DocumentAssessmentInput): string {
  const stability = input.working_diagnosis.clinical_stability;
  const confidence = input.working_diagnosis.confidence;
  
  let prognosis = '';
  
  if (stability === 'critical') {
    prognosis = 'Guarded prognosis due to critical clinical status. Immediate intervention required.';
  } else if (stability === 'unstable') {
    prognosis = 'Prognosis depends on response to treatment and underlying condition severity.';
  } else if (stability === 'stable') {
    if (confidence === 'high') {
      prognosis = 'Good prognosis with appropriate treatment and monitoring.';
    } else if (confidence === 'moderate') {
      prognosis = 'Prognosis good with continued evaluation and treatment.';
    } else {
      prognosis = 'Prognosis uncertain pending further evaluation and diagnostic workup.';
    }
  }
  
  // Add specific considerations based on differential diagnoses
  const highRiskDifferentials = input.differential_diagnoses.filter(diff => 
    diff.probability === 'high' && diff.requires_rule_out
  );
  
  if (highRiskDifferentials.length > 0) {
    prognosis += ' Close monitoring required due to high-risk differential diagnoses.';
  }
  
  return prognosis;
}
