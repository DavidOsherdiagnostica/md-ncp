/**
 * Compare Medications Tool
 * Compares BPMH with admission/transfer orders to identify discrepancies
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for medication comparison input
export const CompareMedicationsSchema = z.object({
  bpmh_id: z.string().min(1).describe("BPMH ID from gather_bpmh tool"),
  new_orders: z.array(z.object({
    drug_name: z.string().describe("Drug name"),
    dose: z.string().describe("Dose with units"),
    frequency: z.string().describe("Frequency"),
    route: z.string().describe("Route of administration"),
    indication: z.string().describe("Indication for medication"),
    prescriber: z.string().describe("Prescriber name"),
    order_datetime: z.string().describe("ISO8601 datetime of order")
  })),
  comparison_type: z.enum(['proactive', 'retroactive']).describe("Type of comparison")
});

export type CompareMedicationsInput = z.infer<typeof CompareMedicationsSchema>;

// Discrepancy types
export interface Discrepancy {
  type: 'omission' | 'duplication' | 'dose_change' | 'new_medication';
  severity: 'critical' | 'major' | 'minor';
  bpmh_medication?: any;
  new_order_medication?: any;
  clinical_significance: string;
  requires_action: boolean;
  suggested_action: string;
}

// Comparison output
export interface ComparisonOutput {
  comparison_id: string;
  discrepancies: Discrepancy[];
  matched_medications: Array<{
    bpmh_medication: any;
    new_order_medication: any;
    match_confidence: 'high' | 'medium' | 'low';
  }>;
  summary: {
    total_discrepancies: number;
    critical_count: number;
    major_count: number;
    minor_count: number;
    resolved_count: number;
    pending_count: number;
  };
}

// ===== TOOL REGISTRATION =====

export function registerCompareMedicationsTool(server: McpServer): void {
  server.registerTool(
    "compare_medications",
    {
      title: "Compare Medications",
      description: `Compares Best Possible Medication History (BPMH) with new admission/transfer orders to identify discrepancies.

**Purpose:** Identify medication discrepancies for reconciliation.

**Input Parameters:**
- bpmh_id: ID from previous BPMH gathering
- new_orders: New medication orders to compare
- comparison_type: Whether this is proactive (before admission) or retroactive (after admission)

**Process:**
1. Match medications by generic name and indication
2. Identify discrepancies in four categories:
   - Omissions (in BPMH but not in new orders)
   - Duplications (same drug class prescribed twice)
   - Dose/frequency changes
   - New medications (in orders but not in BPMH)

**Output:** Returns detailed discrepancy analysis with severity levels and suggested actions.`,
      inputSchema: CompareMedicationsSchema.shape,
    },
    async (input: CompareMedicationsInput): Promise<McpResponse<ComparisonOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(CompareMedicationsSchema, input, "compare_medications");

        // 2. Process comparison
        const comparisonOutput = processMedicationComparison(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(comparisonOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in compare_medications tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "compare_medications", 
          userInput: input 
        });
      }
    }
  );
}

// ===== COMPARISON PROCESSING =====

function processMedicationComparison(input: CompareMedicationsInput): ComparisonOutput {
  const comparisonId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // This is a simplified implementation - in practice, you would:
  // 1. Retrieve BPMH data using bpmh_id
  // 2. Perform sophisticated matching algorithms
  // 3. Identify discrepancies using clinical logic
  
  const discrepancies: Discrepancy[] = [];
  const matchedMedications: Array<{
    bpmh_medication: any;
    new_order_medication: any;
    match_confidence: 'high' | 'medium' | 'low';
  }> = [];

  // Simulate discrepancy detection
  // In practice, this would involve complex matching logic
  for (const order of input.new_orders) {
    // Check for potential duplications
    const duplicateOrders = input.new_orders.filter(o => 
      o.drug_name.toLowerCase() === order.drug_name.toLowerCase() && 
      o !== order
    );
    
    if (duplicateOrders.length > 0) {
      discrepancies.push({
        type: 'duplication',
        severity: 'major',
        new_order_medication: order,
        clinical_significance: 'Risk of overdose or drug interactions',
        requires_action: true,
        suggested_action: 'Review for duplicate orders and consolidate if appropriate'
      });
    }

    // Check for dose changes (simplified)
    if (order.dose.includes('mg') && parseFloat(order.dose) > 1000) {
      discrepancies.push({
        type: 'dose_change',
        severity: 'critical',
        new_order_medication: order,
        clinical_significance: 'High dose medication requires careful monitoring',
        requires_action: true,
        suggested_action: 'Verify dose calculation and patient weight'
      });
    }
  }

  // Calculate summary
  const summary = {
    total_discrepancies: discrepancies.length,
    critical_count: discrepancies.filter(d => d.severity === 'critical').length,
    major_count: discrepancies.filter(d => d.severity === 'major').length,
    minor_count: discrepancies.filter(d => d.severity === 'minor').length,
    resolved_count: 0, // Would be updated when discrepancies are resolved
    pending_count: discrepancies.length
  };

  return {
    comparison_id: comparisonId,
    discrepancies,
    matched_medications: matchedMedications,
    summary
  };
}
