/**
 * [TOOL_NAME] Tool
 * [TOOL_DESCRIPTION_SHORT]
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../types/mcp.js"; // Corrected relative path
import { getApiClient } from "../services/apiClient.js"; // User corrected
import { getResponseFormatter } from "../services/responseFormatter.js"; // Corrected relative path
import { validateToolInput } from "../utils/validators.js"; // Corrected relative path
import { classifyError, createComprehensiveErrorResponse } from "../utils/errorHandler.js"; // Corrected relative path
import { APP_CONFIG } from "../config/appConfig.js"; // Corrected relative path

// Define the Zod schema for your tool's input
export const GenericToolSchema = z.object({
  // Define your tool's input parameters here
  // Example:
  query: z.string().describe("The main query for the tool."),
  filter_param: z.string().optional().describe("An optional filter parameter."),
});

// Define the TypeScript type for the tool's input
export type GenericToolInput = z.infer<typeof GenericToolSchema>;

// Define the TypeScript type for the tool's output (expected from your API)
// This should be replaced with a specific type from your API's type definitions (e.g., from src/types/api.ts)
type GenericApiResponse = any; // Placeholder for your API's response type

// Define the TypeScript type for the processed data that the MCP server will return
// This should be a generic representation of the data, optimized for AI consumption.
type GenericProcessedOutput = any; // Placeholder for the processed output type

// ===== TOOL REGISTRATION =====

export function registerTemplateTool(server: McpServer): void {
  server.registerTool(
    "template_tool", // Unique API name for the tool
    {
      title: "Template Tool",
      description: `This is a generic template tool. You should replace this with your tool's specific description.\n\n**Purpose:** To demonstrate how to integrate an external API with the MCP server.\n\n**Input Parameters:**\n- query: (string) The main query for the tool.\n- filter_param: (string, optional) An optional filter parameter.\n\n**Output:** Returns processed data from your external API.\n\n**How to customize:**\n1.  Rename this file and the exported function (e.g., \`registerYourSpecificTool\`).\n2.  Update the \`title\`, \`description\`, and \`inputSchema\` to reflect your tool's purpose and parameters.\n3.  Modify the \`handler\` function to make actual API calls using \`apiClient\` and process the responses.\n4.  Update \`GenericApiResponse\` and \`GenericProcessedOutput\` types with your specific API response and processed output types.\n`,
      inputSchema: GenericToolSchema.shape,
    },
    async (input: GenericToolInput): Promise<McpResponse<GenericProcessedOutput>> => {
      const startTime = Date.now();
      const apiClient = getApiClient();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input using the generic validator
        const { data: validatedInput } = validateToolInput(GenericToolSchema, input, "template_tool");

        // 2. Call your external API using the generic API client
        // Replace \'/your-api-endpoint\' and the request body with your actual API call
        const apiResponse: GenericApiResponse = await apiClient.performGenericApiCall(
          '/your-api-endpoint', // Replace with your actual API endpoint
          { ...validatedInput } // Map validatedInput to your API's request format
        );

        // 3. Process the API response into an AI-optimized format
        // This is where you would implement your specific data transformation logic.
        const processedOutput: GenericProcessedOutput = {
          // Example:
          // id: apiResponse.someId,
          // name: apiResponse.someName,
          // description: apiResponse.someDescription,
          // ...
          rawApiResponse: apiResponse, // Include raw response for debugging/transparency
        };

        // 4. Format the processed data into a standardized MCP success response
        return responseFormatter.formatGenericToolResponse(processedOutput, startTime);

      } catch (error) {
        // Centralized error handling
        const classifiedError = classifyError(error, `Error in template_tool tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { toolName: "template_tool", userInput: input });
      }
    }
  );
}

// ===== TOOL EXECUTION AND PROCESSING =====

// NOTE: For a generic template, we are simplifying the processing and enhancement functions.
// You should implement specific logic for your tool here.

function processToolData(rawData: GenericApiResponse, userInput: GenericToolInput): GenericProcessedOutput {
  // Implement your data processing and filtering logic here
  // This might involve:
  // - Extracting relevant fields from rawData
  // - Applying business logic or calculations
  // - Filtering based on userInput
  return rawData; // Placeholder - replace with actual processing
}

// ===== RESPONSE ENHANCEMENT =====

function enhanceToolResponse(
  baseResponse: McpResponse<GenericProcessedOutput>,
  userInput: GenericToolInput,
  validationWarnings: string[],
): McpResponse<GenericProcessedOutput> {
  // This function is kept minimal for a generic template.
  // Implement tool-specific enhancements here.
  const enhancedResponse = { ...baseResponse };

  if (baseResponse.success) {
    const successResponse = enhancedResponse as McpSuccessResponse<GenericProcessedOutput>;
    successResponse.warnings = [...(successResponse.warnings || []), ...validationWarnings];
    successResponse.clinical_notes = [
      ...(successResponse.clinical_notes || []),
      `Tool executed for query: ${userInput.query || 'N/A'}`,
    ];
    successResponse.next_suggested_actions = [
      ...(successResponse.next_suggested_actions || []),
      {
        tool: "template_tool",
        reason: "Consider refining your query or trying different parameters.",
        parameters_hint: "query: 'new search term', filter_param: 'new filter'",
      },
    ];
  }

  return enhancedResponse;
}
