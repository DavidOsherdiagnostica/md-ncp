// This file is a placeholder for generic MCP resources.
// When integrating with a new API, define your resources here.
// Example: therapeutic categories, administration routes, symptom hierarchies.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ResourceMetadata } from "../types/mcp.js"; // Corrected relative path

// Example Resource Interface
export interface GenericResourceItem {
  id: string;
  name: string;
  description?: string;
  [key: string]: unknown; // Add index signature
  // Add other relevant fields for your resource
}

// Example Resource Data (this would typically come from an external API or database)
export const GENERIC_RESOURCE_DATA: GenericResourceItem[] = [
  { id: '1', name: 'Category A', description: 'A generic category' },
  { id: '2', name: 'Category B', description: 'Another generic category' },
  { id: '3', name: 'Route X', description: 'Administration route X' },
];

// Define a Zod schema for your resource items
export const GenericResourceItemSchema = z.object({
  id: z.string().describe("Unique identifier for the resource item"),
  name: z.string().describe("Name of the resource item"),
  description: z.string().optional().describe("Optional description of the resource item"),
});

// Define a Zod schema for an array of resource items
export const GenericResourceArraySchema = z.array(GenericResourceItemSchema);

// ===== RESOURCE REGISTRATION =====

export function registerTemplateResource(server: McpServer): void {
  const resourceName = "template_resource";
  const resourceUri = "generic-resource-uri"; // A generic URI or template string

  const resourceConfig: ResourceMetadata = {
    title: "Template Resource",
    description: `This is a generic template resource. You should replace this with your resource's specific description.\n\n**Purpose:** To demonstrate how to register a static or dynamically fetched resource with the MCP server.\n\n**Data:** Provides generic categories and routes as examples.\n\n**How to customize:**\n1.  Rename this file and the exported function (e.g., \`registerYourSpecificResource\`).\n2.  Update the \`title\`, \`description\`, and \`schema\` to reflect your resource's content.\n3.  Modify the \`fetcher\` function to retrieve and filter your actual resource data (e.g., from an API, database, or a static file).\n`,
    schema: GenericResourceArraySchema, // Schema for an array of resource items
  };

  const resourceFetcher = async (uri: URL) => {
    // Extract query parameter from the URI if needed, or use the whole URI
    const query = uri.searchParams.get('query');
    let filteredData = GENERIC_RESOURCE_DATA;

    if (query) {
      const lowerCaseQuery = query.toLowerCase();
      filteredData = GENERIC_RESOURCE_DATA.filter(item =>
        item.name.toLowerCase().includes(lowerCaseQuery) ||
        (item.description && item.description.toLowerCase().includes(lowerCaseQuery))
      );
    }
    
    return { contents: filteredData.map(item => ({
      uri: `mcp://template-resource/${item.id}`,
      text: `ID: ${item.id}, Name: ${item.name}, Description: ${item.description || 'N/A'}`,
      blob: '',
      _meta: item, // Keep original item in _meta for full data
    })) };
  };

  server.registerResource(
    resourceName,
    resourceUri,
    resourceConfig,
    resourceFetcher
  );
}
