/**
 * Template Prompt
 * This is a generic template for an MCP prompt. Customize it for your specific needs.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PromptMetadata } from "../types/mcp.js"; // Corrected relative path

// MCP Prompts can only use string parameters - this is a limitation of the protocol
const genericPromptArgsSchema = z.object({
  // Define your prompt arguments here using z.string().describe(...)
  // Example:
  query: z.string().describe("The main query for the prompt."),
  // param2: z.string().optional().describe("Description of param2 (optional)"),
});

export type GenericPromptArgs = z.infer<typeof genericPromptArgsSchema>;

// ===== PROMPT REGISTRATION =====

export function registerTemplatePrompt(server: McpServer): void {
  const promptName = "template_prompt";
  const promptTemplate = "generic-prompt-template"; // A generic template string

  const promptConfig: PromptMetadata = {
    title: "Template Prompt",
    description: `This is a generic template prompt. You should replace this with your prompt's specific description.\n\n**Purpose:** To demonstrate how to create a simple prompt for the MCP server.\n\n**Input Parameters:**\n- query: (string) The main query for the prompt.\n\n**Output:** Returns a generic text message based on the input.\n\n**How to customize:**\n1.  Rename this file and the exported function (e.g., \`registerYourSpecificPrompt\`).\n2.  Update the \`title\`, \`description\`, and \`argsSchema\` to reflect your prompt's purpose and parameters.\n3.  Modify the \`handler\` function to implement your prompt's logic.\n`,
    argsSchema: genericPromptArgsSchema.shape, // Pass the shape here
  };

  const promptHandler = async (args: any, extra: any) => {
    // Implement your prompt logic here.
    // This function should generate messages for the AI based on the arguments.
    // Example:
    // const responseMessage = `You asked about ${args.query}. Here is some generic information.`;
    // return [{ type: 'text', text: responseMessage }];
    return {
      messages: [
        {
          role: "assistant" as const, // Or "user", depending on context
          content: {
            type: "text" as const,
            text: `Prompt 'template_prompt' executed with args: ${JSON.stringify(args)}`,
          },
        },
      ],
      description: `Executed with query: ${args.query || 'N/A'}`,
      _meta: { ...args, extraInfo: extra },
    };
  };

  server.registerPrompt(
    promptName,
    promptConfig,
    promptHandler
  );
}
