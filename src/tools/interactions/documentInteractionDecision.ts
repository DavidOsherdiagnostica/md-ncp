/**
 * Document Interaction Decision Tool
 * Records clinical decision regarding interaction management
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for interaction decision documentation input
export const DocumentInteractionDecisionSchema = z.object({
  interaction_id: z.string().min(1).describe("Interaction ID from screening"),
  assessment_id: z.string().min(1).describe("Assessment ID from significance assessment"),
  decision_maker: z.string().min(1).describe("Provider ID who made the decision"),
  decision_datetime: z.string().describe("ISO8601 datetime when decision was made"),
  decision: z.object({
    action_taken: z.enum(['continue_as_is', 'modified_therapy', 'discontinued_drug', 'alternative_prescribed']).describe("Action taken for the interaction"),
    rationale: z.string().describe("Clinical rationale for the decision"),
    patient_informed: z.boolean().describe("Whether patient was informed of the decision"),
    patient_consent: z.boolean().describe("Whether patient consented to the decision"),
    monitoring_plan_implemented: z.boolean().describe("Whether monitoring plan was implemented")
  }),
  outcome_if_known: z.object({
    interaction_occurred: z.boolean().describe("Whether the interaction actually occurred"),
    severity_observed: z.string().optional().describe("Severity of observed interaction if it occurred"),
    management_effective: z.boolean().describe("Whether the management strategy was effective")
  }).optional().describe("Outcome information if available")
});

export type DocumentInteractionDecisionInput = z.infer<typeof DocumentInteractionDecisionSchema>;

// Interaction decision documentation output
export interface InteractionDecisionOutput {
  documentation_id: string;
  audit_trail: {
    decision_recorded: string;
    decision_by: string;
    modified_by: Array<{
      user_id: string;
      modification_datetime: string;
      modification_reason: string;
    }>;
    outcome_updates: Array<{
      update_datetime: string;
      outcome_description: string;
      updated_by: string;
    }>;
  };
  quality_metrics: {
    intervention_prevented_harm: boolean;
    appropriate_management: boolean;
    documentation_complete: boolean;
  };
  follow_up_required: {
    required: boolean;
    follow_up_date?: string;
    follow_up_actions: string[];
  };
  clinical_notes: string[];
  regulatory_compliance: {
    hipaa_compliant: boolean;
    audit_ready: boolean;
    retention_period: string;
  };
}

// ===== TOOL REGISTRATION =====

export function registerDocumentInteractionDecisionTool(server: McpServer): void {
  server.registerTool(
    "document_interaction_decision",
    {
      title: "Document Interaction Decision",
      description: `Records clinical decision regarding drug interaction management with audit trail.

**Purpose:** Document clinical decisions for drug interactions with complete audit trail and quality metrics.

**Input Parameters:**
- interaction_id: ID from interaction screening
- assessment_id: ID from significance assessment
- decision_maker: Provider who made the decision
- decision_datetime: When decision was made
- decision: Details of the decision and actions taken
- outcome_if_known: Outcome information if available

**Process:**
1. Record decision details with timestamp
2. Create audit trail for decision tracking
3. Assess quality metrics
4. Determine follow-up requirements
5. Ensure regulatory compliance

**Output:** Returns documentation record with audit trail and quality assessment.`,
      inputSchema: DocumentInteractionDecisionSchema.shape,
    },
    async (input: DocumentInteractionDecisionInput): Promise<McpResponse<InteractionDecisionOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(DocumentInteractionDecisionSchema, input, "document_interaction_decision");

        // 2. Process interaction decision documentation
        const documentationOutput = processInteractionDecisionDocumentation(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(documentationOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in document_interaction_decision tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "document_interaction_decision", 
          userInput: input 
        });
      }
    }
  );
}

// ===== INTERACTION DECISION DOCUMENTATION PROCESSING =====

function processInteractionDecisionDocumentation(input: DocumentInteractionDecisionInput): InteractionDecisionOutput {
  const documentationId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create audit trail
  const auditTrail = createAuditTrail(input);
  
  // Assess quality metrics
  const qualityMetrics = assessQualityMetrics(input);
  
  // Determine follow-up requirements
  const followUpRequired = determineFollowUpRequirements(input);
  
  // Generate clinical notes
  const clinicalNotes = generateClinicalNotes(input);
  
  // Assess regulatory compliance
  const regulatoryCompliance = assessRegulatoryCompliance(input);
  
  return {
    documentation_id: documentationId,
    audit_trail: auditTrail,
    quality_metrics: qualityMetrics,
    follow_up_required: followUpRequired,
    clinical_notes: clinicalNotes,
    regulatory_compliance: regulatoryCompliance
  };
}

function createAuditTrail(input: DocumentInteractionDecisionInput): {
  decision_recorded: string;
  decision_by: string;
  modified_by: Array<{
    user_id: string;
    modification_datetime: string;
    modification_reason: string;
  }>;
  outcome_updates: Array<{
    update_datetime: string;
    outcome_description: string;
    updated_by: string;
  }>;
} {
  const auditTrail = {
    decision_recorded: input.decision_datetime,
    decision_by: input.decision_maker,
    modified_by: [] as Array<{
      user_id: string;
      modification_datetime: string;
      modification_reason: string;
    }>,
    outcome_updates: [] as Array<{
      update_datetime: string;
      outcome_description: string;
      updated_by: string;
    }>
  };
  
  // Add outcome updates if available
  if (input.outcome_if_known) {
    auditTrail.outcome_updates.push({
      update_datetime: new Date().toISOString(),
      outcome_description: `Interaction occurred: ${input.outcome_if_known.interaction_occurred}, Severity: ${input.outcome_if_known.severity_observed || 'Unknown'}, Management effective: ${input.outcome_if_known.management_effective}`,
      updated_by: input.decision_maker
    });
  }
  
  return auditTrail;
}

function assessQualityMetrics(input: DocumentInteractionDecisionInput): {
  intervention_prevented_harm: boolean;
  appropriate_management: boolean;
  documentation_complete: boolean;
} {
  // Assess if intervention prevented harm
  const interventionPreventedHarm = (
    input.decision.action_taken !== 'continue_as_is' &&
    input.outcome_if_known?.interaction_occurred === false
  );
  
  // Assess if management was appropriate
  const appropriateManagement = (
    input.decision.action_taken !== 'continue_as_is' ||
    (input.decision.monitoring_plan_implemented && input.decision.patient_informed)
  );
  
  // Assess if documentation is complete
  const documentationComplete = (
    input.decision.rationale.length > 0 &&
    input.decision.patient_informed &&
    input.decision.monitoring_plan_implemented
  );
  
  return {
    intervention_prevented_harm: interventionPreventedHarm,
    appropriate_management: appropriateManagement,
    documentation_complete: documentationComplete
  };
}

function determineFollowUpRequirements(input: DocumentInteractionDecisionInput): {
  required: boolean;
  follow_up_date?: string;
  follow_up_actions: string[];
} {
  const followUpActions: string[] = [];
  let required = false;
  let followUpDate: string | undefined;
  
  // Determine if follow-up is required based on decision
  if (input.decision.action_taken === 'modified_therapy' || 
      input.decision.action_taken === 'alternative_prescribed') {
    required = true;
    followUpDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 1 week
    followUpActions.push('Assess therapeutic response to modified therapy');
    followUpActions.push('Monitor for adverse effects');
  }
  
  if (input.decision.monitoring_plan_implemented) {
    required = true;
    if (!followUpDate) {
      followUpDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(); // 2 weeks
    }
    followUpActions.push('Review monitoring results');
    followUpActions.push('Assess patient compliance with monitoring plan');
  }
  
  if (input.decision.action_taken === 'discontinued_drug') {
    required = true;
    followUpDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days
    followUpActions.push('Assess impact of drug discontinuation');
    followUpActions.push('Monitor for withdrawal effects');
  }
  
  return {
    required,
    ...(followUpDate && { follow_up_date: followUpDate }),
    follow_up_actions: followUpActions
  };
}

function generateClinicalNotes(input: DocumentInteractionDecisionInput): string[] {
  const notes: string[] = [];
  
  // Decision summary
  notes.push(`Drug interaction decision: ${input.decision.action_taken}`);
  notes.push(`Rationale: ${input.decision.rationale}`);
  
  // Patient involvement
  if (input.decision.patient_informed) {
    notes.push('Patient informed of interaction and management decision');
  }
  
  if (input.decision.patient_consent) {
    notes.push('Patient consented to management approach');
  }
  
  // Monitoring
  if (input.decision.monitoring_plan_implemented) {
    notes.push('Enhanced monitoring plan implemented for interaction management');
  }
  
  // Outcome information
  if (input.outcome_if_known) {
    notes.push(`Outcome: Interaction occurred: ${input.outcome_if_known.interaction_occurred}`);
    if (input.outcome_if_known.severity_observed) {
      notes.push(`Observed severity: ${input.outcome_if_known.severity_observed}`);
    }
    notes.push(`Management effectiveness: ${input.outcome_if_known.management_effective ? 'Effective' : 'Ineffective'}`);
  }
  
  return notes;
}

function assessRegulatoryCompliance(input: DocumentInteractionDecisionInput): {
  hipaa_compliant: boolean;
  audit_ready: boolean;
  retention_period: string;
} {
  // HIPAA compliance assessment
  const hipaaCompliant = (
    input.decision_maker.length > 0 &&
    input.decision_datetime.length > 0 &&
    input.decision.rationale.length > 0
  );
  
  // Audit readiness assessment
  const auditReady = (
    hipaaCompliant &&
    input.decision.patient_informed &&
    input.decision.monitoring_plan_implemented
  );
  
  // Determine retention period based on decision type
  let retentionPeriod = '7 years'; // Default retention period
  
  if (input.decision.action_taken === 'discontinued_drug' && 
      input.outcome_if_known?.interaction_occurred) {
    retentionPeriod = '10 years'; // Longer retention for adverse events
  }
  
  return {
    hipaa_compliant: hipaaCompliant,
    audit_ready: auditReady,
    retention_period: retentionPeriod
  };
}
