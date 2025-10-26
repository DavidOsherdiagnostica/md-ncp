/**
 * Clinical Decision Support Prompt
 * Simple prompt to guide comprehensive clinical decision support workflow
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PromptMetadata } from "../types/mcp.js";

// Simple input - just patient ID
const clinicalDecisionArgsSchema = z.object({
  patient_id: z.string().describe("Patient ID for comprehensive clinical decision support")
});

export type ClinicalDecisionArgs = z.infer<typeof clinicalDecisionArgsSchema>;

export function registerClinicalDecisionPrompt(server: McpServer): void {
  const promptName = "clinical_decision_support_workflow";
  
  const promptConfig: PromptMetadata = {
    title: "Clinical Decision Support Workflow",
    description: `**Start Comprehensive Clinical Decision Support**

This prompt provides integrated decision support across multiple medical protocols.

**What you need:**
- Patient ID

**What this does:**
- Integrates multiple clinical protocols
- Provides comprehensive patient assessment
- Identifies cross-protocol alerts
- Prioritizes clinical actions
- Creates integrated care plan

**Next steps after using this prompt:**
1. Use \`clinical_decision_support\` for integrated assessment
2. Use \`audit_trail\` for quality assurance and tracking
3. Follow protocol-specific workflows as needed

**Perfect for:** Complex cases, multi-protocol workflows, quality assurance`,
    argsSchema: clinicalDecisionArgsSchema.shape,
  };

  const promptHandler = async (args: any, extra: any) => {
    return {
      messages: [
        {
          role: "assistant" as const,
          content: {
            type: "text" as const,
            text: `🎯 **Clinical Decision Support Workflow Started**

**Patient ID:** ${args.patient_id}

**Step 1: Integrated Assessment**
Use the \`clinical_decision_support\` tool for comprehensive analysis:
- **Medication Reconciliation:** Check for discrepancies and reconciliation needs
- **TDM Analysis:** Identify medications requiring therapeutic monitoring
- **Interaction Screening:** Screen all medications for interactions
- **SOAP Documentation:** Assess documentation completeness
- **Five Rights:** Verify medication administration safety
- **Cross-Protocol Alerts:** Identify conflicts or synergies between protocols

**Step 2: Prioritized Actions**
The system will provide:
- **Priority 1 (Immediate):** Critical safety issues requiring immediate attention
- **Priority 2 (Urgent):** Important issues within 24 hours
- **Priority 3 (Routine):** Standard follow-up and monitoring

**Step 3: Comprehensive Plan**
Create integrated care plan including:
- Medication management strategy
- Monitoring requirements
- Patient education needs
- Follow-up schedule
- Quality metrics

**Step 4: Audit and Quality**
Use the \`audit_trail\` tool to:
- Track all protocol activities
- Monitor quality metrics
- Ensure compliance
- Generate reports

**Integration Benefits:**
- **Holistic View:** See patient across all protocols
- **Conflict Resolution:** Identify and resolve protocol conflicts
- **Efficiency:** Streamlined workflow for complex cases
- **Safety:** Comprehensive safety checks
- **Quality:** Built-in audit and compliance

**Clinical Scenarios:**
- **New Admission:** MedRec → Interactions → SOAP → Five Rights
- **TDM Patient:** TDM → Interactions → SOAP → Monitoring
- **Complex Case:** All protocols → Integration → Comprehensive plan

Ready to start? Use the \`clinical_decision_support\` tool with patient ID: ${args.patient_id}`
          },
        },
      ],
      description: `Clinical decision support workflow initiated for patient ${args.patient_id}`,
      _meta: { patient_id: args.patient_id, workflow: "clinical_decision_support" },
    };
  };

  server.registerPrompt(promptName, promptConfig, promptHandler);
}
