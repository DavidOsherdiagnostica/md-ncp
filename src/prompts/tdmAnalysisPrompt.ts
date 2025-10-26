/**
 * TDM Analysis Prompt
 * Simple prompt to guide therapeutic drug monitoring workflow
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PromptMetadata } from "../types/mcp.js";

// Simple input - just drug name
const tdmAnalysisArgsSchema = z.object({
  drug_name: z.string().describe("Name of the medication for TDM analysis")
});

export type TdmAnalysisArgs = z.infer<typeof tdmAnalysisArgsSchema>;

export function registerTdmAnalysisPrompt(server: McpServer): void {
  const promptName = "tdm_analysis_workflow";
  
  const promptConfig: PromptMetadata = {
    title: "Therapeutic Drug Monitoring (TDM) Analysis",
    description: `**Start TDM Analysis Workflow**

This prompt guides you through therapeutic drug monitoring for a medication.

**What you need:**
- Drug name (e.g., "vancomycin", "digoxin", "phenytoin")

**What this does:**
- Assesses if medication requires TDM
- Calculates steady state timing
- Plans optimal sample collection
- Interprets TDM results
- Monitors trends over time

**Next steps after using this prompt:**
1. Use \`assess_tdm_candidate\` to determine if TDM is needed
2. Use \`calculate_steady_state\` to determine sampling timing
3. Use \`plan_sample_collection\` for collection instructions
4. Use \`interpret_tdm_result\` when results are available
5. Use \`monitor_tdm_trends\` for ongoing monitoring

**Perfect for:** Vancomycin, digoxin, antiepileptics, immunosuppressants`,
    argsSchema: tdmAnalysisArgsSchema.shape,
  };

  const promptHandler = async (args: any, extra: any) => {
    return {
      messages: [
        {
          role: "assistant" as const,
          content: {
            type: "text" as const,
            text: `💊 **TDM Analysis Workflow Started**

**Drug:** ${args.drug_name}

**Step 1: Assess TDM Need**
Use the \`assess_tdm_candidate\` tool to determine if this medication requires therapeutic drug monitoring:
- Check narrow therapeutic index
- Assess pharmacokinetic variability
- Consider patient factors (age, organ function)
- Evaluate clinical indication

**Step 2: Calculate Timing**
Use the \`calculate_steady_state\` tool to determine optimal sampling time:
- Calculate 4-5 half-lives from start
- Adjust for loading dose
- Consider organ impairment
- Account for drug interactions

**Step 3: Plan Collection**
Use the \`plan_sample_collection\` tool for detailed collection instructions:
- Trough: 0-60 minutes before next dose
- Peak: 1-2 hours post-dose (drug dependent)
- Ensure steady state reached
- Document timing requirements

**Step 4: Interpret Results**
Use the \`interpret_tdm_result\` tool when results are available:
- Compare to therapeutic range
- Assess clinical correlation
- Calculate dose adjustments
- Plan follow-up monitoring

**Step 5: Monitor Trends**
Use the \`monitor_tdm_trends\` tool for ongoing analysis:
- Track concentration trends
- Assess dose-response relationship
- Identify factors affecting levels
- Optimize dosing strategy

**Clinical Tips:**
- Always correlate with clinical response
- Consider drug interactions affecting metabolism
- Adjust for organ dysfunction
- Document all decisions with rationale

Ready to start? Use the \`assess_tdm_candidate\` tool for ${args.drug_name}`
          },
        },
      ],
      description: `TDM analysis workflow initiated for ${args.drug_name}`,
      _meta: { drug_name: args.drug_name, workflow: "tdm_analysis" },
    };
  };

  server.registerPrompt(promptName, promptConfig, promptHandler);
}
