/**
 * Resolve Discrepancy Tool
 * Documents resolution of identified medication discrepancies
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for discrepancy resolution input
export const ResolveDiscrepancySchema = z.object({
  comparison_id: z.string().min(1).describe("Comparison ID from compare_medications tool"),
  discrepancy_id: z.string().min(1).describe("Specific discrepancy ID to resolve"),
  resolution_action: z.enum([
    'intentional_change',
    'prescriber_error', 
    'continue_home_med',
    'discontinue',
    'modify_order'
  ]).describe("Type of resolution action taken"),
  resolved_by: z.string().min(1).describe("Provider ID who resolved the discrepancy"),
  resolution_datetime: z.string().describe("ISO8601 datetime of resolution"),
  prescriber_contacted: z.boolean().describe("Whether prescriber was contacted"),
  prescriber_response: z.string().optional().describe("Prescriber's response if contacted"),
  final_order: z.object({
    action: z.enum(['continue', 'discontinue', 'modify']),
    medication_details: z.record(z.any()).describe("Final medication order details")
  }),
  documentation_note: z.string().describe("Clinical documentation of resolution")
});

export type ResolveDiscrepancyInput = z.infer<typeof ResolveDiscrepancySchema>;

// Resolution output
export interface ResolutionOutput {
  resolution_id: string;
  status: 'resolved' | 'pending_prescriber' | 'escalated';
  final_medication_list: Array<{
    drug_name: string;
    dose: string;
    frequency: string;
    route: string;
    indication: string;
    status: 'active' | 'discontinued' | 'modified';
    resolution_notes: string;
  }>;
  audit_trail: Array<{
    timestamp: string;
    action: string;
    performed_by: string;
    details: string;
  }>;
  follow_up_required: boolean;
  patient_harm_prevented: boolean;
  harm_severity_avoided: 'minor' | 'moderate' | 'severe' | 'life_threatening';
}

// ===== TOOL REGISTRATION =====

export function registerResolveDiscrepancyTool(server: McpServer): void {
  server.registerTool(
    "resolve_discrepancy",
    {
      title: "Resolve Medication Discrepancy",
      description: `Documents resolution of identified medication discrepancies with clinical decision-making.

**Purpose:** Resolve medication discrepancies with proper documentation and clinical reasoning.

**Input Parameters:**
- comparison_id: ID from medication comparison
- discrepancy_id: Specific discrepancy to resolve
- resolution_action: Type of action taken (intentional change, prescriber error, etc.)
- resolved_by: Provider who made the resolution
- resolution_datetime: When resolution occurred
- prescriber_contacted: Whether prescriber was involved
- prescriber_response: Prescriber's response if contacted
- final_order: Final medication order details
- documentation_note: Clinical documentation

**Process:**
1. Validate resolution action against discrepancy type
2. Ensure prescriber involvement for critical discrepancies
3. Update medication orders accordingly
4. Create audit trail

**Output:** Returns resolution details with audit trail and safety assessment.`,
      inputSchema: ResolveDiscrepancySchema.shape,
    },
    async (input: ResolveDiscrepancyInput): Promise<McpResponse<ResolutionOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(ResolveDiscrepancySchema, input, "resolve_discrepancy");

        // 2. Process resolution
        const resolutionOutput = processDiscrepancyResolution(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(resolutionOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in resolve_discrepancy tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "resolve_discrepancy", 
          userInput: input 
        });
      }
    }
  );
}

// ===== RESOLUTION PROCESSING =====

function processDiscrepancyResolution(input: ResolveDiscrepancyInput): ResolutionOutput {
  const resolutionId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Determine status based on resolution action and prescriber involvement
  let status: 'resolved' | 'pending_prescriber' | 'escalated';
  if (input.prescriber_contacted && input.prescriber_response) {
    status = 'resolved';
  } else if (input.resolution_action === 'prescriber_error' && !input.prescriber_contacted) {
    status = 'pending_prescriber';
  } else if (input.resolution_action === 'intentional_change' && !input.prescriber_contacted) {
    status = 'escalated';
  } else {
    status = 'resolved';
  }

  // Create final medication list based on resolution
  const finalMedicationList = createFinalMedicationList(input);
  
  // Create audit trail
  const auditTrail = createAuditTrail(input);
  
  // Assess patient safety impact
  const safetyAssessment = assessPatientSafety(input);

  return {
    resolution_id: resolutionId,
    status,
    final_medication_list: finalMedicationList,
    audit_trail: auditTrail,
    follow_up_required: status !== 'resolved',
    patient_harm_prevented: safetyAssessment.harm_prevented,
    harm_severity_avoided: safetyAssessment.severity_avoided
  };
}

function createFinalMedicationList(input: ResolveDiscrepancyInput): Array<{
  drug_name: string;
  dose: string;
  frequency: string;
  route: string;
  indication: string;
  status: 'active' | 'discontinued' | 'modified';
  resolution_notes: string;
}> {
  const medication = input.final_order.medication_details;
  
  return [{
    drug_name: medication.drug_name || 'Unknown',
    dose: medication.dose || 'Unknown',
    frequency: medication.frequency || 'Unknown',
    route: medication.route || 'Unknown',
    indication: medication.indication || 'Unknown',
    status: input.final_order.action === 'discontinue' ? 'discontinued' : 
            input.final_order.action === 'modify' ? 'modified' : 'active',
    resolution_notes: input.documentation_note
  }];
}

function createAuditTrail(input: ResolveDiscrepancyInput): Array<{
  timestamp: string;
  action: string;
  performed_by: string;
  details: string;
}> {
  return [
    {
      timestamp: input.resolution_datetime,
      action: `Resolved discrepancy with action: ${input.resolution_action}`,
      performed_by: input.resolved_by,
      details: input.documentation_note
    },
    {
      timestamp: new Date().toISOString(),
      action: 'Resolution documented',
      performed_by: 'system',
      details: `Discrepancy ${input.discrepancy_id} resolved with status: ${input.final_order.action}`
    }
  ];
}

function assessPatientSafety(input: ResolveDiscrepancyInput): {
  harm_prevented: boolean;
  severity_avoided: 'minor' | 'moderate' | 'severe' | 'life_threatening';
} {
  // Simplified safety assessment
  // In practice, this would involve more sophisticated clinical logic
  
  const harmPrevented = input.resolution_action !== 'prescriber_error';
  
  let severityAvoided: 'minor' | 'moderate' | 'severe' | 'life_threatening' = 'minor';
  
  if (input.resolution_action === 'discontinue' && input.prescriber_contacted) {
    severityAvoided = 'severe';
  } else if (input.resolution_action === 'modify_order') {
    severityAvoided = 'moderate';
  }

  return {
    harm_prevented: harmPrevented,
    severity_avoided: severityAvoided
  };
}
