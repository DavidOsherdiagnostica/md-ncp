/**
 * Assess Interaction Significance Tool
 * Detailed clinical assessment of specific drug interaction
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for interaction significance assessment input
export const AssessInteractionSignificanceSchema = z.object({
  interaction_id: z.string().min(1).describe("Interaction ID from screen_interactions tool"),
  patient_specific_factors: z.object({
    age: z.number().describe("Patient age in years"),
    comorbidities: z.array(z.string()).describe("List of patient comorbidities"),
    organ_function: z.object({
      renal_function: z.enum(['normal', 'mild_impairment', 'moderate_impairment', 'severe_impairment']).describe("Renal function status"),
      hepatic_function: z.enum(['normal', 'mild_impairment', 'moderate_impairment', 'severe_impairment']).describe("Hepatic function status"),
      cardiac_function: z.enum(['normal', 'mild_impairment', 'moderate_impairment', 'severe_impairment']).optional().describe("Cardiac function status")
    }),
    concurrent_medications: z.array(z.string()).describe("List of concurrent medications"),
    previous_adverse_reactions: z.array(z.string()).describe("Previous adverse drug reactions")
  }),
  clinical_context: z.object({
    indication_for_medications: z.array(z.string()).describe("Clinical indications for the medications"),
    treatment_duration: z.enum(['acute', 'chronic']).describe("Expected treatment duration"),
    treatment_goals: z.array(z.string()).describe("Treatment goals"),
    alternative_options_available: z.boolean().describe("Whether alternative medications are available")
  })
});

export type AssessInteractionSignificanceInput = z.infer<typeof AssessInteractionSignificanceSchema>;

// Interaction significance assessment output
export interface InteractionSignificanceOutput {
  assessment_id: string;
  patient_specific_risk: 'low' | 'moderate' | 'high' | 'very_high';
  probability_of_occurrence: 'unlikely' | 'possible' | 'probable' | 'highly_probable';
  potential_harm: {
    severity: 'minor' | 'moderate' | 'major' | 'life_threatening';
    reversibility: 'reversible' | 'partially_reversible' | 'irreversible';
    time_to_onset: string;
  };
  clinical_significance_score: number; // 0-10 scale
  requires_intervention: boolean;
  urgency: 'immediate' | 'within_24h' | 'routine';
  risk_factors: string[];
  protective_factors: string[];
  monitoring_recommendations: string[];
}

// ===== TOOL REGISTRATION =====

export function registerAssessInteractionSignificanceTool(server: McpServer): void {
  server.registerTool(
    "assess_interaction_significance",
    {
      title: "Assess Interaction Significance",
      description: `Provides detailed clinical assessment of specific drug interaction significance.

**Purpose:** Evaluate the clinical significance and risk of a specific drug interaction for a patient.

**Input Parameters:**
- interaction_id: ID from interaction screening
- patient_specific_factors: Patient demographics, comorbidities, organ function
- clinical_context: Treatment context and goals

**Process:**
1. Evaluate relevance to specific patient
2. Assess probability of occurrence
3. Estimate potential harm severity
4. Consider benefit-risk ratio
5. Review evidence base

**Output:** Returns detailed risk assessment with clinical significance score and recommendations.`,
      inputSchema: AssessInteractionSignificanceSchema.shape,
    },
    async (input: AssessInteractionSignificanceInput): Promise<McpResponse<InteractionSignificanceOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(AssessInteractionSignificanceSchema, input, "assess_interaction_significance");

        // 2. Process interaction significance assessment
        const significanceOutput = processInteractionSignificanceAssessment(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(significanceOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in assess_interaction_significance tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "assess_interaction_significance", 
          userInput: input 
        });
      }
    }
  );
}

// ===== INTERACTION SIGNIFICANCE ASSESSMENT PROCESSING =====

function processInteractionSignificanceAssessment(input: AssessInteractionSignificanceInput): InteractionSignificanceOutput {
  const assessmentId = `assess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Assess patient-specific risk factors
  const riskFactors = assessPatientRiskFactors(input);
  const protectiveFactors = assessProtectiveFactors(input);
  
  // Calculate patient-specific risk level
  const patientSpecificRisk = calculatePatientSpecificRisk(riskFactors, protectiveFactors);
  
  // Assess probability of occurrence
  const probabilityOfOccurrence = assessProbabilityOfOccurrence(input, riskFactors);
  
  // Estimate potential harm
  const potentialHarm = estimatePotentialHarm(input, riskFactors);
  
  // Calculate clinical significance score
  const clinicalSignificanceScore = calculateClinicalSignificanceScore(
    patientSpecificRisk,
    probabilityOfOccurrence,
    potentialHarm.severity
  );
  
  // Determine if intervention is required
  const requiresIntervention = determineInterventionRequirement(
    patientSpecificRisk,
    probabilityOfOccurrence,
    potentialHarm.severity
  );
  
  // Determine urgency
  const urgency = determineUrgency(requiresIntervention, potentialHarm.severity, input.clinical_context.treatment_duration);
  
  // Generate monitoring recommendations
  const monitoringRecommendations = generateMonitoringRecommendations(input, riskFactors, potentialHarm);
  
  return {
    assessment_id: assessmentId,
    patient_specific_risk: patientSpecificRisk,
    probability_of_occurrence: probabilityOfOccurrence,
    potential_harm: potentialHarm,
    clinical_significance_score: clinicalSignificanceScore,
    requires_intervention: requiresIntervention,
    urgency: urgency,
    risk_factors: riskFactors,
    protective_factors: protectiveFactors,
    monitoring_recommendations: monitoringRecommendations
  };
}

function assessPatientRiskFactors(input: AssessInteractionSignificanceInput): string[] {
  const riskFactors: string[] = [];
  
  // Age-related risk factors
  if (input.patient_specific_factors.age > 75) {
    riskFactors.push('Advanced age (>75 years)');
  } else if (input.patient_specific_factors.age < 18) {
    riskFactors.push('Pediatric patient');
  }
  
  // Organ function risk factors
  if (input.patient_specific_factors.organ_function.renal_function !== 'normal') {
    riskFactors.push(`Renal impairment (${input.patient_specific_factors.organ_function.renal_function})`);
  }
  
  if (input.patient_specific_factors.organ_function.hepatic_function !== 'normal') {
    riskFactors.push(`Hepatic impairment (${input.patient_specific_factors.organ_function.hepatic_function})`);
  }
  
  if (input.patient_specific_factors.organ_function.cardiac_function && 
      input.patient_specific_factors.organ_function.cardiac_function !== 'normal') {
    riskFactors.push(`Cardiac impairment (${input.patient_specific_factors.organ_function.cardiac_function})`);
  }
  
  // Comorbidity risk factors
  if (input.patient_specific_factors.comorbidities.length > 3) {
    riskFactors.push('Multiple comorbidities');
  }
  
  if (input.patient_specific_factors.comorbidities.some(c => 
    c.toLowerCase().includes('diabetes') || 
    c.toLowerCase().includes('hypertension') || 
    c.toLowerCase().includes('heart disease')
  )) {
    riskFactors.push('Cardiovascular comorbidities');
  }
  
  // Medication-related risk factors
  if (input.patient_specific_factors.concurrent_medications.length > 5) {
    riskFactors.push('Polypharmacy');
  }
  
  if (input.patient_specific_factors.previous_adverse_reactions.length > 0) {
    riskFactors.push('History of adverse drug reactions');
  }
  
  return riskFactors;
}

function assessProtectiveFactors(input: AssessInteractionSignificanceInput): string[] {
  const protectiveFactors: string[] = [];
  
  // Age-related protective factors
  if (input.patient_specific_factors.age >= 18 && input.patient_specific_factors.age <= 65) {
    protectiveFactors.push('Optimal age range (18-65 years)');
  }
  
  // Organ function protective factors
  if (input.patient_specific_factors.organ_function.renal_function === 'normal') {
    protectiveFactors.push('Normal renal function');
  }
  
  if (input.patient_specific_factors.organ_function.hepatic_function === 'normal') {
    protectiveFactors.push('Normal hepatic function');
  }
  
  // Treatment context protective factors
  if (input.clinical_context.alternative_options_available) {
    protectiveFactors.push('Alternative treatment options available');
  }
  
  if (input.clinical_context.treatment_duration === 'acute') {
    protectiveFactors.push('Short-term treatment reduces cumulative risk');
  }
  
  return protectiveFactors;
}

function calculatePatientSpecificRisk(riskFactors: string[], protectiveFactors: string[]): 'low' | 'moderate' | 'high' | 'very_high' {
  const riskScore = riskFactors.length - protectiveFactors.length;
  
  if (riskScore <= 0) return 'low';
  if (riskScore <= 2) return 'moderate';
  if (riskScore <= 4) return 'high';
  return 'very_high';
}

function assessProbabilityOfOccurrence(
  input: AssessInteractionSignificanceInput, 
  riskFactors: string[]
): 'unlikely' | 'possible' | 'probable' | 'highly_probable' {
  let probabilityScore = 0;
  
  // Base probability
  probabilityScore += 2; // Base interaction probability
  
  // Risk factor adjustments
  if (riskFactors.includes('Advanced age (>75 years)')) probabilityScore += 2;
  if (riskFactors.includes('Polypharmacy')) probabilityScore += 2;
  if (riskFactors.includes('Multiple comorbidities')) probabilityScore += 1;
  if (riskFactors.includes('History of adverse drug reactions')) probabilityScore += 2;
  
  // Organ function adjustments
  if (input.patient_specific_factors.organ_function.renal_function !== 'normal') probabilityScore += 1;
  if (input.patient_specific_factors.organ_function.hepatic_function !== 'normal') probabilityScore += 1;
  
  if (probabilityScore <= 2) return 'unlikely';
  if (probabilityScore <= 4) return 'possible';
  if (probabilityScore <= 6) return 'probable';
  return 'highly_probable';
}

function estimatePotentialHarm(
  input: AssessInteractionSignificanceInput,
  riskFactors: string[]
): {
  severity: 'minor' | 'moderate' | 'major' | 'life_threatening';
  reversibility: 'reversible' | 'partially_reversible' | 'irreversible';
  time_to_onset: string;
} {
  let severityScore = 0;
  
  // Base severity
  severityScore += 2;
  
  // Risk factor adjustments
  if (riskFactors.includes('Advanced age (>75 years)')) severityScore += 1;
  if (riskFactors.includes('Multiple comorbidities')) severityScore += 1;
  if (riskFactors.includes('Cardiovascular comorbidities')) severityScore += 2;
  if (riskFactors.includes('History of adverse drug reactions')) severityScore += 1;
  
  let severity: 'minor' | 'moderate' | 'major' | 'life_threatening';
  let reversibility: 'reversible' | 'partially_reversible' | 'irreversible';
  let timeToOnset: string;
  
  if (severityScore <= 2) {
    severity = 'minor';
    reversibility = 'reversible';
    timeToOnset = 'Within hours to days';
  } else if (severityScore <= 4) {
    severity = 'moderate';
    reversibility = 'reversible';
    timeToOnset = 'Within days to weeks';
  } else if (severityScore <= 6) {
    severity = 'major';
    reversibility = 'partially_reversible';
    timeToOnset = 'Within days to weeks';
  } else {
    severity = 'life_threatening';
    reversibility = 'irreversible';
    timeToOnset = 'Within hours to days';
  }
  
  return { severity, reversibility, time_to_onset: timeToOnset };
}

function calculateClinicalSignificanceScore(
  patientRisk: string,
  probability: string,
  harmSeverity: string
): number {
  let score = 0;
  
  // Patient risk scoring
  switch (patientRisk) {
    case 'low': score += 1; break;
    case 'moderate': score += 3; break;
    case 'high': score += 6; break;
    case 'very_high': score += 8; break;
  }
  
  // Probability scoring
  switch (probability) {
    case 'unlikely': score += 1; break;
    case 'possible': score += 3; break;
    case 'probable': score += 6; break;
    case 'highly_probable': score += 8; break;
  }
  
  // Harm severity scoring
  switch (harmSeverity) {
    case 'minor': score += 1; break;
    case 'moderate': score += 3; break;
    case 'major': score += 6; break;
    case 'life_threatening': score += 10; break;
  }
  
  // Normalize to 0-10 scale
  return Math.min(10, Math.round(score / 3));
}

function determineInterventionRequirement(
  patientRisk: string,
  probability: string,
  harmSeverity: string
): boolean {
  // Require intervention for high-risk scenarios
  return (
    patientRisk === 'high' || patientRisk === 'very_high' ||
    probability === 'probable' || probability === 'highly_probable' ||
    harmSeverity === 'major' || harmSeverity === 'life_threatening'
  );
}

function determineUrgency(
  requiresIntervention: boolean,
  harmSeverity: string,
  treatmentDuration: string
): 'immediate' | 'within_24h' | 'routine' {
  if (!requiresIntervention) return 'routine';
  
  if (harmSeverity === 'life_threatening') return 'immediate';
  if (harmSeverity === 'major') return 'within_24h';
  if (treatmentDuration === 'acute') return 'within_24h';
  
  return 'routine';
}

function generateMonitoringRecommendations(
  input: AssessInteractionSignificanceInput,
  riskFactors: string[],
  potentialHarm: { severity: string; reversibility: string; time_to_onset: string; }
): string[] {
  const recommendations: string[] = [];
  
  // General monitoring recommendations
  recommendations.push('Monitor for signs and symptoms of interaction');
  recommendations.push('Assess patient response to therapy');
  
  // Severity-specific recommendations
  if (potentialHarm.severity === 'life_threatening' || potentialHarm.severity === 'major') {
    recommendations.push('Frequent vital signs monitoring');
    recommendations.push('Consider hospitalization for close monitoring');
  }
  
  // Risk factor-specific recommendations
  if (riskFactors.includes('Advanced age (>75 years)')) {
    recommendations.push('Enhanced monitoring for elderly patients');
    recommendations.push('Assess for cognitive changes');
  }
  
  if (riskFactors.includes('Renal impairment')) {
    recommendations.push('Monitor renal function closely');
    recommendations.push('Assess for signs of drug accumulation');
  }
  
  if (riskFactors.includes('Hepatic impairment')) {
    recommendations.push('Monitor liver function tests');
    recommendations.push('Assess for signs of hepatotoxicity');
  }
  
  if (riskFactors.includes('Cardiovascular comorbidities')) {
    recommendations.push('Monitor cardiovascular parameters');
    recommendations.push('Assess for cardiac adverse effects');
  }
  
  // Time-based recommendations
  if (potentialHarm.time_to_onset.includes('hours')) {
    recommendations.push('Immediate monitoring required');
    recommendations.push('Daily assessment for first week');
  } else if (potentialHarm.time_to_onset.includes('days')) {
    recommendations.push('Weekly monitoring for first month');
  }
  
  return recommendations;
}
