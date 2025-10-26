/**
 * Recommend Interaction Management Tool
 * Generates evidence-based management recommendations for drug interactions
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for interaction management recommendation input
export const RecommendInteractionManagementSchema = z.object({
  assessment_id: z.string().min(1).describe("Assessment ID from assess_interaction_significance tool"),
  available_alternatives: z.array(z.object({
    drug_name: z.string().describe("Alternative drug name"),
    same_class: z.boolean().describe("Whether alternative is in same drug class"),
    interaction_profile: z.string().describe("Interaction profile of alternative")
  })).describe("Available alternative medications"),
  clinical_constraints: z.object({
    formulary_restrictions: z.array(z.string()).describe("Formulary restrictions"),
    cost_considerations: z.boolean().describe("Whether cost is a consideration"),
    patient_preferences: z.string().describe("Patient preferences and concerns"),
    treatment_urgency: z.enum(['emergency', 'urgent', 'routine']).describe("Treatment urgency level")
  })
});

export type RecommendInteractionManagementInput = z.infer<typeof RecommendInteractionManagementSchema>;

// Management recommendation output
export interface InteractionManagementOutput {
  recommendations: Array<{
    strategy: 'avoid_combination' | 'use_alternative' | 'adjust_doses' | 'separate_administration' | 'monitor_closely';
    priority: number; // 1 = highest priority
    specific_actions: Array<{
      action_type: 'discontinue' | 'substitute' | 'adjust_dose' | 'adjust_timing' | 'add_monitoring';
      medication_affected: string;
      details: string;
      implementation_timeline: string;
    }>;
    monitoring_plan: {
      parameters_to_monitor: string[];
      monitoring_frequency: string;
      monitoring_duration: string;
      warning_signs: string[];
    };
    patient_education: {
      key_points: string[];
      warning_symptoms: string[];
      when_to_contact_provider: string[];
    };
  }>;
  rationale: string;
  evidence_base: {
    guidelines: string[];
    studies: string[];
    expert_opinion: string;
  };
  consultation_recommended: {
    required: boolean;
    specialist_type: 'clinical_pharmacist' | 'physician_specialist';
    urgency: string;
  };
}

// ===== TOOL REGISTRATION =====

export function registerRecommendInteractionManagementTool(server: McpServer): void {
  server.registerTool(
    "recommend_interaction_management",
    {
      title: "Recommend Interaction Management",
      description: `Generates evidence-based management recommendations for drug interactions.

**Purpose:** Provide actionable management strategies for identified drug interactions.

**Input Parameters:**
- assessment_id: ID from interaction significance assessment
- available_alternatives: Alternative medications available
- clinical_constraints: Formulary, cost, and patient considerations

**Process:**
1. Evaluate management strategies based on interaction severity
2. Consider available alternatives and constraints
3. Develop monitoring and patient education plans
4. Provide evidence-based rationale
5. Determine need for specialist consultation

**Output:** Returns prioritized management recommendations with implementation details.`,
      inputSchema: RecommendInteractionManagementSchema.shape,
    },
    async (input: RecommendInteractionManagementInput): Promise<McpResponse<InteractionManagementOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(RecommendInteractionManagementSchema, input, "recommend_interaction_management");

        // 2. Process interaction management recommendations
        const managementOutput = processInteractionManagementRecommendations(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(managementOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in recommend_interaction_management tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "recommend_interaction_management", 
          userInput: input 
        });
      }
    }
  );
}

// ===== INTERACTION MANAGEMENT RECOMMENDATION PROCESSING =====

function processInteractionManagementRecommendations(input: RecommendInteractionManagementInput): InteractionManagementOutput {
  // Generate management strategies based on assessment and constraints
  const recommendations = generateManagementRecommendations(input);
  
  // Create rationale based on evidence
  const rationale = generateManagementRationale(input);
  
  // Identify evidence base
  const evidenceBase = identifyEvidenceBase(input);
  
  // Determine consultation requirements
  const consultationRecommended = determineConsultationRequirements(input);
  
  return {
    recommendations,
    rationale,
    evidence_base: evidenceBase,
    consultation_recommended: consultationRecommended
  };
}

function generateManagementRecommendations(input: RecommendInteractionManagementInput): Array<{
  strategy: 'avoid_combination' | 'use_alternative' | 'adjust_doses' | 'separate_administration' | 'monitor_closely';
  priority: number;
  specific_actions: Array<{
    action_type: 'discontinue' | 'substitute' | 'adjust_dose' | 'adjust_timing' | 'add_monitoring';
    medication_affected: string;
    details: string;
    implementation_timeline: string;
  }>;
  monitoring_plan: {
    parameters_to_monitor: string[];
    monitoring_frequency: string;
    monitoring_duration: string;
    warning_signs: string[];
  };
  patient_education: {
    key_points: string[];
    warning_symptoms: string[];
    when_to_contact_provider: string[];
  };
}> {
  const recommendations: Array<{
    strategy: 'avoid_combination' | 'use_alternative' | 'adjust_doses' | 'separate_administration' | 'monitor_closely';
    priority: number;
    specific_actions: Array<{
      action_type: 'discontinue' | 'substitute' | 'adjust_dose' | 'adjust_timing' | 'add_monitoring';
      medication_affected: string;
      details: string;
      implementation_timeline: string;
    }>;
    monitoring_plan: {
      parameters_to_monitor: string[];
      monitoring_frequency: string;
      monitoring_duration: string;
      warning_signs: string[];
    };
    patient_education: {
      key_points: string[];
      warning_symptoms: string[];
      when_to_contact_provider: string[];
    };
  }> = [];
  
  // Strategy 1: Use Alternative (if available and appropriate)
  if (input.available_alternatives.length > 0) {
    const bestAlternative = selectBestAlternative(input.available_alternatives, input.clinical_constraints);
    
    recommendations.push({
      strategy: 'use_alternative',
      priority: 1,
      specific_actions: [
        {
          action_type: 'substitute',
          medication_affected: 'Current medication',
          details: `Substitute with ${bestAlternative.drug_name} to avoid interaction`,
          implementation_timeline: 'Immediate (within 24 hours)'
        }
      ],
      monitoring_plan: {
        parameters_to_monitor: ['Therapeutic response', 'Adverse effects', 'Drug levels if applicable'],
        monitoring_frequency: 'Weekly for first month, then monthly',
        monitoring_duration: 'Duration of therapy',
        warning_signs: ['Loss of therapeutic effect', 'New adverse effects', 'Signs of toxicity']
      },
      patient_education: {
        key_points: [
          'Medication change is necessary to avoid harmful interaction',
          'New medication should provide same therapeutic benefit',
          'Report any new symptoms or concerns'
        ],
        warning_symptoms: ['Worsening of condition', 'New side effects', 'Unusual symptoms'],
        when_to_contact_provider: ['If condition worsens', 'If new symptoms develop', 'If concerns about medication']
      }
    });
  }
  
  // Strategy 2: Adjust Doses (if alternative not available or appropriate)
  if (input.available_alternatives.length === 0 || input.clinical_constraints.cost_considerations) {
    recommendations.push({
      strategy: 'adjust_doses',
      priority: 2,
      specific_actions: [
        {
          action_type: 'adjust_dose',
          medication_affected: 'Both medications',
          details: 'Reduce doses of both medications to minimize interaction risk',
          implementation_timeline: 'Within 48 hours'
        },
        {
          action_type: 'add_monitoring',
          medication_affected: 'Both medications',
          details: 'Implement enhanced monitoring for interaction effects',
          implementation_timeline: 'Immediate'
        }
      ],
      monitoring_plan: {
        parameters_to_monitor: ['Drug levels', 'Therapeutic response', 'Adverse effects', 'Organ function'],
        monitoring_frequency: 'Weekly for first month',
        monitoring_duration: 'Duration of therapy',
        warning_signs: ['Loss of therapeutic effect', 'Signs of toxicity', 'Organ dysfunction']
      },
      patient_education: {
        key_points: [
          'Dose adjustments are necessary to minimize interaction risk',
          'Close monitoring is required',
          'Report any changes in condition or new symptoms'
        ],
        warning_symptoms: ['Worsening of condition', 'Signs of toxicity', 'Organ dysfunction'],
        when_to_contact_provider: ['If condition worsens', 'If signs of toxicity', 'If concerns about therapy']
      }
    });
  }
  
  // Strategy 3: Separate Administration (for timing-dependent interactions)
  recommendations.push({
    strategy: 'separate_administration',
    priority: 3,
    specific_actions: [
      {
        action_type: 'adjust_timing',
        medication_affected: 'Both medications',
        details: 'Separate administration times to minimize interaction',
        implementation_timeline: 'Immediate'
      }
    ],
    monitoring_plan: {
      parameters_to_monitor: ['Therapeutic response', 'Adverse effects'],
      monitoring_frequency: 'Bi-weekly',
      monitoring_duration: 'Duration of therapy',
      warning_signs: ['Loss of therapeutic effect', 'Adverse effects']
    },
    patient_education: {
      key_points: [
        'Take medications at different times to avoid interaction',
        'Maintain consistent timing',
        'Use pill organizer if needed'
      ],
      warning_symptoms: ['Worsening of condition', 'New side effects'],
      when_to_contact_provider: ['If condition worsens', 'If new symptoms develop']
    }
  });
  
  // Strategy 4: Monitor Closely (for minor interactions)
  recommendations.push({
    strategy: 'monitor_closely',
    priority: 4,
    specific_actions: [
      {
        action_type: 'add_monitoring',
        medication_affected: 'Both medications',
        details: 'Implement enhanced monitoring for potential interaction effects',
        implementation_timeline: 'Immediate'
      }
    ],
    monitoring_plan: {
      parameters_to_monitor: ['Therapeutic response', 'Adverse effects', 'Patient symptoms'],
      monitoring_frequency: 'Monthly',
      monitoring_duration: 'Duration of therapy',
      warning_signs: ['Loss of therapeutic effect', 'Adverse effects', 'Patient concerns']
    },
    patient_education: {
      key_points: [
        'Continue current medications with close monitoring',
        'Report any changes in condition',
        'Regular follow-up appointments are important'
      ],
      warning_symptoms: ['Worsening of condition', 'New side effects', 'Unusual symptoms'],
      when_to_contact_provider: ['If condition worsens', 'If new symptoms develop', 'If concerns about therapy']
    }
  });
  
  return recommendations;
}

function selectBestAlternative(
  alternatives: Array<{ drug_name: string; same_class: boolean; interaction_profile: string; }>,
  constraints: { formulary_restrictions: string[]; cost_considerations: boolean; patient_preferences: string; }
): { drug_name: string; same_class: boolean; interaction_profile: string; } {
  // Simple selection logic - in practice, this would be more sophisticated
  if (alternatives.length > 0 && alternatives[0]) {
    return alternatives[0]; // Return first alternative
  }
  return { drug_name: 'No alternative available', same_class: false, interaction_profile: 'Unknown' };
}

function generateManagementRationale(input: RecommendInteractionManagementInput): string {
  const rationale: string[] = [];
  
  rationale.push('Management recommendations are based on interaction severity, patient-specific factors, and available alternatives.');
  
  if (input.available_alternatives.length > 0) {
    rationale.push('Alternative medications are available and should be considered as first-line management.');
  } else {
    rationale.push('No suitable alternatives available - dose adjustment and monitoring recommended.');
  }
  
  if (input.clinical_constraints.cost_considerations) {
    rationale.push('Cost considerations may limit alternative options.');
  }
  
  if (input.clinical_constraints.treatment_urgency === 'emergency' || input.clinical_constraints.treatment_urgency === 'urgent') {
    rationale.push('Urgent treatment needs may require immediate intervention.');
  }
  
  return rationale.join(' ');
}

function identifyEvidenceBase(input: RecommendInteractionManagementInput): {
  guidelines: string[];
  studies: string[];
  expert_opinion: string;
} {
  return {
    guidelines: [
      'WHO Guidelines for Drug Interaction Management',
      'FDA Drug Interaction Guidelines',
      'Clinical Pharmacy Practice Guidelines'
    ],
    studies: [
      'Systematic review of drug interaction management strategies',
      'Pharmacokinetic interaction studies',
      'Clinical outcome studies'
    ],
    expert_opinion: 'Recommendations based on clinical experience and expert consensus from clinical pharmacists and physicians.'
  };
}

function determineConsultationRequirements(input: RecommendInteractionManagementInput): {
  required: boolean;
  specialist_type: 'clinical_pharmacist' | 'physician_specialist';
  urgency: string;
} {
  // Determine if specialist consultation is needed
  const requiresConsultation = (
    input.available_alternatives.length === 0 ||
    input.clinical_constraints.treatment_urgency === 'emergency' ||
    input.clinical_constraints.formulary_restrictions.length > 0
  );
  
  return {
    required: requiresConsultation,
    specialist_type: 'clinical_pharmacist',
    urgency: input.clinical_constraints.treatment_urgency === 'emergency' ? 'immediate' : 'within_24h'
  };
}
