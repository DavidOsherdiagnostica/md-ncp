/**
 * SOAP Documentation Prompt
 * Simple prompt to guide SOAP documentation workflow
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PromptMetadata } from "../types/mcp.js";

// Simple input - just encounter ID
const soapDocumentationArgsSchema = z.object({
  encounter_id: z.string().describe("Encounter ID to start SOAP documentation")
});

export type SoapDocumentationArgs = z.infer<typeof soapDocumentationArgsSchema>;

export function registerSoapDocumentationPrompt(server: McpServer): void {
  const promptName = "soap_documentation_workflow";
  
  const promptConfig: PromptMetadata = {
    title: "SOAP Documentation Workflow",
    description: `**Start SOAP Documentation Process**

This prompt guides you through structured clinical documentation using SOAP format.

**What you need:**
- Encounter ID

**What this does:**
- Guides systematic documentation of Subjective findings
- Helps record Objective clinical findings
- Assists with Assessment and differential diagnosis
- Creates comprehensive Plan with orders and follow-up
- Compiles complete SOAP note

**Next steps after using this prompt:**
1. Use \`document_subjective\` to capture patient's symptoms and history
2. Use \`document_objective\` to record vital signs and physical exam
3. Use \`document_assessment\` to create clinical assessment
4. Use \`document_plan\` to develop treatment plan
5. Use \`compile_soap_note\` to create final note

**Perfect for:** Progress notes, admission notes, discharge summaries, consultations`,
    argsSchema: soapDocumentationArgsSchema.shape,
  };

  const promptHandler = async (args: any, extra: any) => {
    return {
      messages: [
        {
          role: "assistant" as const,
          content: {
            type: "text" as const,
            text: `📋 **SOAP Documentation Workflow Started**

**Encounter ID:** ${args.encounter_id}

**Step 1: Document Subjective (S)**
Use the \`document_subjective\` tool to capture:
- Chief complaint in patient's own words
- History of present illness (OPQRST format)
- Review of systems
- Medication compliance
- Social history updates
- Functional status

**Step 2: Document Objective (O)**
Use the \`document_objective\` tool to record:
- Vital signs with normal ranges
- Physical examination findings
- Laboratory results with flags
- Imaging studies
- Other diagnostic results
- Abnormal findings and trends

**Step 3: Document Assessment (A)**
Use the \`document_assessment\` tool to create:
- Clinical summary (1-2 sentences)
- Primary diagnosis with confidence level
- Differential diagnoses (2-3 minimum)
- Problem list ranked by priority
- Risk stratification
- Clinical stability assessment

**Step 4: Document Plan (P)**
Use the \`document_plan\` tool to develop:
- Medication plan (continue/start/modify/discontinue)
- Diagnostic plan (labs, imaging, consultations)
- Monitoring plan (parameters, frequency, triggers)
- Patient education topics
- Disposition and follow-up

**Step 5: Compile Complete Note**
Use the \`compile_soap_note\` tool to create:
- Complete formatted SOAP note
- Quality checks and completeness
- Coding suggestions (ICD-10, CPT)
- Provider signature
- Addendum capability

**Documentation Tips:**
- Use patient's exact words for chief complaint
- Be specific with measurements and findings
- Include confidence levels for assessments
- Create actionable plans with clear timelines
- Ensure all sections are complete before signing

Ready to start? Use the \`document_subjective\` tool with encounter ID: ${args.encounter_id}`
          },
        },
      ],
      description: `SOAP documentation workflow initiated for encounter ${args.encounter_id}`,
      _meta: { encounter_id: args.encounter_id, workflow: "soap_documentation" },
    };
  };

  server.registerPrompt(promptName, promptConfig, promptHandler);
}
