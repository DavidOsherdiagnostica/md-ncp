/**
 * Medication Reconciliation Prompt
 * Simple prompt to guide medication reconciliation workflow
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PromptMetadata } from "../types/mcp.js";

// Simple input - just patient ID
const medicationReconciliationArgsSchema = z.object({
  patient_id: z.string().describe("Patient ID to start medication reconciliation process")
});

export type MedicationReconciliationArgs = z.infer<typeof medicationReconciliationArgsSchema>;

export function registerMedicationReconciliationPrompt(server: McpServer): void {
  const promptName = "medication_reconciliation_workflow";
  
  const promptConfig: PromptMetadata = {
    title: "Medication Reconciliation Workflow",
    description: `**Start Medication Reconciliation Process**

This prompt guides you through the complete medication reconciliation workflow for a patient.

**What you need:**
- Patient ID

**What this does:**
- Guides you to collect Best Possible Medication History (BPMH)
- Helps identify medication discrepancies
- Provides step-by-step reconciliation process
- Ensures WHO High 5s compliance

**Next steps after using this prompt:**
1. Use \`gather_bpmh\` tool to collect medication history
2. Use \`compare_medications\` tool to identify discrepancies  
3. Use \`resolve_discrepancy\` tool to address each issue

**Perfect for:** Hospital admissions, transfers, discharge planning`,
    argsSchema: medicationReconciliationArgsSchema.shape,
  };

  const promptHandler = async (args: any, extra: any) => {
    return {
      messages: [
        {
          role: "assistant" as const,
          content: {
            type: "text" as const,
            text: `🏥 **Medication Reconciliation Workflow Started**

**Patient ID:** ${args.patient_id}

**Step 1: Collect Medication History**
Use the \`gather_bpmh\` tool to collect the patient's complete medication history from multiple sources:
- Patient interview
- Medication bottles
- Pharmacy records
- Previous prescriptions
- Family/caregiver input

**Step 2: Identify Discrepancies** 
Use the \`compare_medications\` tool to compare BPMH with new admission/transfer orders:
- Omissions (medications in BPMH but not in orders)
- Duplications (same drug class prescribed twice)
- Dose/frequency changes
- New medications

**Step 3: Resolve Issues**
Use the \`resolve_discrepancy\` tool for each identified discrepancy:
- Contact prescriber if needed
- Document clinical reasoning
- Update medication orders
- Create audit trail

**Clinical Safety Reminders:**
- Always verify with 2+ sources when possible
- Document actual patient behavior vs prescribed regimen
- Prioritize critical discrepancies first
- Ensure patient understanding of changes

Ready to start? Use the \`gather_bpmh\` tool with patient ID: ${args.patient_id}`
          },
        },
      ],
      description: `Medication reconciliation workflow initiated for patient ${args.patient_id}`,
      _meta: { patient_id: args.patient_id, workflow: "medication_reconciliation" },
    };
  };

  server.registerPrompt(promptName, promptConfig, promptHandler);
}
