/**
 * Drug Interaction Prompt
 * Simple prompt to guide drug interaction screening workflow
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PromptMetadata } from "../types/mcp.js";

// Simple input - just medication list
const drugInteractionArgsSchema = z.object({
  medication_list: z.string().describe("Comma-separated list of medications to screen for interactions")
});

export type DrugInteractionArgs = z.infer<typeof drugInteractionArgsSchema>;

export function registerDrugInteractionPrompt(server: McpServer): void {
  const promptName = "drug_interaction_workflow";
  
  const promptConfig: PromptMetadata = {
    title: "Drug Interaction Screening Workflow",
    description: `**Start Drug Interaction Screening**

This prompt guides you through comprehensive drug interaction screening.

**What you need:**
- Medication list (comma-separated, e.g., "warfarin, aspirin, metformin")

**What this does:**
- Screens for drug-drug interactions
- Checks drug-condition interactions
- Identifies drug-food interactions
- Assesses clinical significance
- Provides management recommendations

**Next steps after using this prompt:**
1. Use \`screen_interactions\` to identify all potential interactions
2. Use \`assess_interaction_significance\` for detailed risk assessment
3. Use \`recommend_interaction_management\` for evidence-based strategies
4. Use \`document_interaction_decision\` to record clinical decisions

**Perfect for:** New prescriptions, medication reviews, polypharmacy management`,
    argsSchema: drugInteractionArgsSchema.shape,
  };

  const promptHandler = async (args: any, extra: any) => {
    return {
      messages: [
        {
          role: "assistant" as const,
          content: {
            type: "text" as const,
            text: `⚠️ **Drug Interaction Screening Workflow Started**

**Medications to Screen:** ${args.medication_list}

**Step 1: Comprehensive Screening**
Use the \`screen_interactions\` tool to identify:
- Drug-drug interactions (pharmacokinetic/pharmacodynamic)
- Drug-condition interactions
- Drug-food interactions
- Contraindications
- Severity levels (contraindicated/serious/moderate/minor)

**Step 2: Assess Clinical Significance**
Use the \`assess_interaction_significance\` tool for each interaction:
- Patient-specific risk factors
- Probability of occurrence
- Potential harm severity
- Benefit-risk ratio
- Evidence quality assessment

**Step 3: Management Recommendations**
Use the \`recommend_interaction_management\` tool for:
- Evidence-based management strategies
- Alternative medications
- Dose adjustments
- Monitoring plans
- Patient education points
- Specialist consultation needs

**Step 4: Document Decisions**
Use the \`document_interaction_decision\` tool to record:
- Clinical decision and rationale
- Patient informed consent
- Monitoring plan implementation
- Follow-up requirements
- Quality metrics

**Screening Categories:**
- **Contraindicated:** Avoid combination
- **Serious:** Monitor closely, consider alternatives
- **Moderate:** Adjust doses, monitor
- **Minor:** Monitor, patient education

**Clinical Tips:**
- Always consider patient-specific factors
- Prioritize serious interactions first
- Document all decisions with rationale
- Ensure patient understanding
- Plan appropriate monitoring

Ready to start? Use the \`screen_interactions\` tool with medications: ${args.medication_list}`
          },
        },
      ],
      description: `Drug interaction screening workflow initiated for medications: ${args.medication_list}`,
      _meta: { medication_list: args.medication_list, workflow: "drug_interaction_screening" },
    };
  };

  server.registerPrompt(promptName, promptConfig, promptHandler);
}
