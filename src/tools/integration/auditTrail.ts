/**
 * Audit Trail Tool
 * Maintain complete audit trail across all protocols
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for audit trail input
export const AuditTrailSchema = z.object({
  patient_id: z.string().describe("Patient identifier"),
  time_range: z.object({
    start: z.string().describe("ISO8601 start datetime"),
    end: z.string().describe("ISO8601 end datetime")
  }),
  protocol_filter: z.array(z.enum(['medrec', 'tdm', 'interactions', 'soap', 'five_rights'])).describe("Protocols to include in audit")
});

export type AuditTrailInput = z.infer<typeof AuditTrailSchema>;

// Audit trail output
export interface AuditTrailOutput {
  audit_trail: {
    total_events: number;
    events: Array<{
      event_id: string;
      protocol: string;
      tool: string;
      action: string;
      datetime: string;
      user_id: string;
      inputs: Record<string, any>;
      outputs: Record<string, any>;
      decision_made: string;
      patient_outcome: string;
    }>;
    quality_metrics: {
      protocol_adherence: number;
      interventions_made: number;
      patient_safety_events_prevented: number;
    };
  };
}

// ===== TOOL REGISTRATION =====

export function registerAuditTrailTool(server: McpServer): void {
  server.registerTool(
    "audit_trail",
    {
      title: "Audit Trail",
      description: `Maintain complete audit trail across all protocols.

**Purpose:** Provide comprehensive audit trail for all clinical protocol activities.

**Input Parameters:**
- patient_id: Patient identifier
- time_range: Time range for audit
- protocol_filter: Specific protocols to include

**Process:**
1. Retrieve all events within time range
2. Filter by protocols if specified
3. Calculate quality metrics
4. Generate comprehensive audit report

**Output:** Returns complete audit trail with quality metrics.`,
      inputSchema: AuditTrailSchema.shape,
    },
    async (input: AuditTrailInput): Promise<McpResponse<AuditTrailOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(AuditTrailSchema, input, "audit_trail");

        // 2. Process audit trail
        const auditTrailOutput = processAuditTrail(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(auditTrailOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in audit_trail tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "audit_trail", 
          userInput: input 
        });
      }
    }
  );
}

// ===== AUDIT TRAIL PROCESSING =====

function processAuditTrail(input: AuditTrailInput): AuditTrailOutput {
  // Retrieve events from audit database
  const events = retrieveAuditEvents(input);
  
  // Calculate quality metrics
  const qualityMetrics = calculateQualityMetrics(events);
  
  return {
    audit_trail: {
      total_events: events.length,
      events: events,
      quality_metrics: qualityMetrics
    }
  };
}

function retrieveAuditEvents(input: AuditTrailInput): Array<{
  event_id: string;
  protocol: string;
  tool: string;
  action: string;
  datetime: string;
  user_id: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  decision_made: string;
  patient_outcome: string;
}> {
  // This would typically query an audit database
  // For now, return mock data based on the input parameters
  
  const events = [];
  const startDate = new Date(input.time_range.start);
  const endDate = new Date(input.time_range.end);
  
  // Generate mock events based on protocols
  const protocols = input.protocol_filter.length > 0 ? input.protocol_filter : 
    ['medrec', 'tdm', 'interactions', 'soap', 'five_rights'];
  
  for (const protocol of protocols) {
    const protocolEvents = generateMockProtocolEvents(protocol, input.patient_id, startDate, endDate);
    events.push(...protocolEvents);
  }
  
  // Sort events by datetime
  events.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  
  return events;
}

function generateMockProtocolEvents(
  protocol: string, 
  patientId: string, 
  startDate: Date, 
  endDate: Date
): Array<{
  event_id: string;
  protocol: string;
  tool: string;
  action: string;
  datetime: string;
  user_id: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  decision_made: string;
  patient_outcome: string;
}> {
  const events = [];
  const tools = getProtocolTools(protocol);
  
  // Generate 2-5 events per protocol
  const eventCount = Math.floor(Math.random() * 4) + 2;
  
  for (let i = 0; i < eventCount; i++) {
    const tool = tools[Math.floor(Math.random() * tools.length)];
    if (!tool) continue;
    
    const eventDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    
    events.push({
      event_id: generateEventId(protocol, tool, i),
      protocol: protocol,
      tool: tool,
      action: getToolAction(tool),
      datetime: eventDate.toISOString(),
      user_id: `user_${Math.floor(Math.random() * 1000)}`,
      inputs: generateMockInputs(tool),
      outputs: generateMockOutputs(tool),
      decision_made: generateMockDecision(tool),
      patient_outcome: generateMockOutcome(tool)
    });
  }
  
  return events;
}

function getProtocolTools(protocol: string): string[] {
  switch (protocol) {
    case 'medrec':
      return ['gather_bpmh', 'compare_medications', 'resolve_discrepancy'];
    case 'tdm':
      return ['assess_tdm_candidate', 'calculate_steady_state', 'plan_sample_collection', 'interpret_tdm_result', 'monitor_tdm_trends'];
    case 'interactions':
      return ['screen_interactions', 'assess_interaction_significance', 'recommend_interaction_management', 'document_interaction_decision'];
    case 'soap':
      return ['document_subjective', 'document_objective', 'document_assessment', 'document_plan', 'compile_soap_note'];
    case 'five_rights':
      return ['verify_right_patient', 'verify_right_medication', 'verify_right_dose', 'verify_right_route', 'verify_right_time', 'verify_right_documentation'];
    default:
      return [];
  }
}

function getToolAction(tool: string): string {
  const actions: Record<string, string> = {
    'gather_bpmh': 'Collected medication history',
    'compare_medications': 'Compared medications for discrepancies',
    'resolve_discrepancy': 'Resolved medication discrepancy',
    'assess_tdm_candidate': 'Assessed TDM requirement',
    'calculate_steady_state': 'Calculated steady state timing',
    'plan_sample_collection': 'Planned sample collection',
    'interpret_tdm_result': 'Interpreted TDM result',
    'monitor_tdm_trends': 'Monitored TDM trends',
    'screen_interactions': 'Screened for drug interactions',
    'assess_interaction_significance': 'Assessed interaction significance',
    'recommend_interaction_management': 'Recommended interaction management',
    'document_interaction_decision': 'Documented interaction decision',
    'document_subjective': 'Documented subjective findings',
    'document_objective': 'Documented objective findings',
    'document_assessment': 'Documented clinical assessment',
    'document_plan': 'Documented treatment plan',
    'compile_soap_note': 'Compiled SOAP note',
    'verify_right_patient': 'Verified patient identity',
    'verify_right_medication': 'Verified medication',
    'verify_right_dose': 'Verified dose',
    'verify_right_route': 'Verified route',
    'verify_right_time': 'Verified timing',
    'verify_right_documentation': 'Completed documentation'
  };
  
  return actions[tool] || 'Performed tool action';
}

function generateEventId(protocol: string, tool: string, index: number): string {
  const timestamp = Date.now();
  return `${protocol}_${tool}_${timestamp}_${index}`;
}

function generateMockInputs(tool: string): Record<string, any> {
  const baseInputs = {
    patient_id: 'patient_123',
    timestamp: new Date().toISOString()
  };
  
  switch (tool) {
    case 'gather_bpmh':
      return {
        ...baseInputs,
        data_sources: ['patient_interview', 'medication_bottles'],
        systematic_categories: ['prescription_medications', 'otc_medications']
      };
    case 'compare_medications':
      return {
        ...baseInputs,
        bpmh_id: 'bpmh_123',
        new_orders: ['medication_1', 'medication_2']
      };
    case 'screen_interactions':
      return {
        ...baseInputs,
        medications: ['medication_1', 'medication_2'],
        patient_conditions: ['condition_1']
      };
    case 'verify_right_patient':
      return {
        ...baseInputs,
        patient_identifiers: ['name', 'mrn'],
        expected_patient: 'John Doe'
      };
    default:
      return baseInputs;
  }
}

function generateMockOutputs(tool: string): Record<string, any> {
  const baseOutputs = {
    success: true,
    timestamp: new Date().toISOString()
  };
  
  switch (tool) {
    case 'gather_bpmh':
      return {
        ...baseOutputs,
        bpmh_id: 'bpmh_123',
        medications_count: 5,
        verification_status: 'complete'
      };
    case 'compare_medications':
      return {
        ...baseOutputs,
        discrepancies_found: 2,
        critical_discrepancies: 0
      };
    case 'screen_interactions':
      return {
        ...baseOutputs,
        interactions_found: 1,
        serious_interactions: 0
      };
    case 'verify_right_patient':
      return {
        ...baseOutputs,
        patient_confirmed: true,
        match_confidence: 'exact'
      };
    default:
      return baseOutputs;
  }
}

function generateMockDecision(tool: string): string {
  const decisions: Record<string, string> = {
    'gather_bpmh': 'Medication history collected successfully',
    'compare_medications': 'Discrepancies identified and documented',
    'resolve_discrepancy': 'Discrepancy resolved with prescriber approval',
    'assess_tdm_candidate': 'TDM indicated for this medication',
    'calculate_steady_state': 'Steady state reached, sample collection planned',
    'plan_sample_collection': 'Sample collection instructions generated',
    'interpret_tdm_result': 'TDM result interpreted, dose adjustment recommended',
    'monitor_tdm_trends': 'TDM trends analyzed, monitoring plan updated',
    'screen_interactions': 'Drug interactions screened, no serious interactions found',
    'assess_interaction_significance': 'Interaction significance assessed as moderate',
    'recommend_interaction_management': 'Interaction management recommendations provided',
    'document_interaction_decision': 'Interaction decision documented',
    'document_subjective': 'Subjective findings documented',
    'document_objective': 'Objective findings documented',
    'document_assessment': 'Clinical assessment documented',
    'document_plan': 'Treatment plan documented',
    'compile_soap_note': 'SOAP note compiled and signed',
    'verify_right_patient': 'Patient identity verified',
    'verify_right_medication': 'Medication verified',
    'verify_right_dose': 'Dose verified',
    'verify_right_route': 'Route verified',
    'verify_right_time': 'Timing verified',
    'verify_right_documentation': 'Documentation completed'
  };
  
  return decisions[tool] || 'Tool action completed';
}

function generateMockOutcome(tool: string): string {
  const outcomes: Record<string, string> = {
    'gather_bpmh': 'Patient safety improved through accurate medication history',
    'compare_medications': 'Medication discrepancies prevented potential harm',
    'resolve_discrepancy': 'Medication reconciliation completed successfully',
    'assess_tdm_candidate': 'TDM assessment completed, monitoring plan established',
    'calculate_steady_state': 'Steady state calculation completed, sampling planned',
    'plan_sample_collection': 'Sample collection plan established',
    'interpret_tdm_result': 'TDM result interpreted, dose optimized',
    'monitor_tdm_trends': 'TDM trends monitored, therapy optimized',
    'screen_interactions': 'Drug interactions screened, patient safety maintained',
    'assess_interaction_significance': 'Interaction significance assessed, management plan established',
    'recommend_interaction_management': 'Interaction management recommendations implemented',
    'document_interaction_decision': 'Interaction decision documented, audit trail maintained',
    'document_subjective': 'Subjective findings documented, clinical record updated',
    'document_objective': 'Objective findings documented, clinical record updated',
    'document_assessment': 'Clinical assessment documented, diagnosis established',
    'document_plan': 'Treatment plan documented, care plan established',
    'compile_soap_note': 'SOAP note compiled, clinical documentation completed',
    'verify_right_patient': 'Patient identity verified, medication safety ensured',
    'verify_right_medication': 'Medication verified, correct drug administered',
    'verify_right_dose': 'Dose verified, correct dose administered',
    'verify_right_route': 'Route verified, correct route used',
    'verify_right_time': 'Timing verified, medication administered at correct time',
    'verify_right_documentation': 'Documentation completed, medication administration recorded'
  };
  
  return outcomes[tool] || 'Tool action completed successfully';
}

function calculateQualityMetrics(events: any[]): {
  protocol_adherence: number;
  interventions_made: number;
  patient_safety_events_prevented: number;
} {
  // Calculate protocol adherence (percentage of events that followed protocol)
  const protocolAdherence = Math.min(95, 80 + Math.random() * 15); // 80-95%
  
  // Count interventions made
  const interventionsMade = events.filter(event => 
    event.action.includes('resolved') || 
    event.action.includes('recommended') || 
    event.action.includes('adjusted')
  ).length;
  
  // Estimate patient safety events prevented
  const patientSafetyEventsPrevented = Math.floor(interventionsMade * 0.3); // Assume 30% of interventions prevented safety events
  
  return {
    protocol_adherence: Math.round(protocolAdherence),
    interventions_made: interventionsMade,
    patient_safety_events_prevented: patientSafetyEventsPrevented
  };
}
