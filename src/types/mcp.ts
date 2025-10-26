/**
 * Generic MCP-specific types for Server
 * Designed for AI consumption
 */

import { z } from 'zod';

// ===== GENERIC TOOL INPUT SCHEMAS =====
// Define your generic tool input schemas here. Example:
export const GenericToolInputSchema = z.object({
  query: z.string().min(1).describe('A generic query string for the tool.'),
  filters: z.record(z.string(), z.any()).optional().describe('Optional filters for the tool.'),
});

// ===== GENERIC PROMPT INPUT SCHEMAS =====
// Define your generic prompt input schemas here. Example:
export const GenericPromptInputSchema = z.object({
  text_input: z.string().min(1).describe('Generic text input for the prompt.'),
  options: z.record(z.string(), z.any()).optional().describe('Optional options for the prompt.'),
});

// ===== GENERIC TOOL INPUT TYPES =====
export type GenericToolInput = z.infer<typeof GenericToolInputSchema>;

// ===== GENERIC PROMPT INPUT TYPES =====
export type GenericPromptInput = z.infer<typeof GenericPromptInputSchema>;

// ===== MCP RESPONSE FORMATS =====

export interface McpSuccessResponse<T> {
  success: true;
  data: T;
  content: Array<
    { type: 'text'; text: string; } |
    { type: 'image'; data: string; mimeType: string; } |
    { type: 'resource'; resource: { uri: string; text: string; mimeType?: string; }; }
  >;
  metadata: {
    total_results: number;
    query_time: string;
    data_source: string; // Local processing data source
    last_updated: string;
    processing_version: string;
    // Add other generic metadata fields as needed
    [key: string]: unknown; // Allow additional metadata properties
  };
  clinical_notes: string[]; // Generic notes or insights for the AI
  warnings: string[]; // Generic warnings or cautions
  next_suggested_actions: Array<{
    tool: string;
    reason: string;
    parameters_hint: string;
  }>; // Generic suggestions for follow-up actions
  [key: string]: unknown; // Allow additional top-level properties
}

export interface McpErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    timestamp: string;
    suggestions: string[];
    details: Record<string, unknown> | undefined;
    // Removed clinical_context and clinical_safety
    recovery_info?: {
      is_recoverable: boolean;
      strategy: string; // Changed to string to allow more flexibility
      retry_delay_ms?: number;
    }; // Generic recovery information
    [key: string]: unknown; // Allow additional error properties
  };
  content: Array<
    { type: 'text'; text: string; } |
    { type: 'resource'; resource: { uri: string; text: string; mimeType?: string; }; }
  >;
  partial_data: unknown | undefined;
  recovery_actions: string[]; // Generic suggestions for recovery
  [key: string]: unknown; // Allow additional top-level properties
}

export type McpResponse<T> = McpSuccessResponse<T> | McpErrorResponse;

// ===== GENERIC PROMPT TYPES =====

// This interface defines the metadata for a generic MCP prompt.
// It will be used when registering prompts with the MCP server.
export interface PromptMetadata {
  title: string;
  description: string;
  argsSchema: z.ZodRawShape; // Corrected to ZodRawShape
  [key: string]: unknown; // Allow additional metadata properties
}

// ===== GENERIC RESOURCE TYPES =====

// This interface defines the metadata for a generic MCP resource.
// It will be used when registering resources with the MCP server.
export interface ResourceMetadata {
  title: string;
    description: string;
  schema: z.ZodSchema<any>; // Schema for the resource data
  [key: string]: unknown; // Allow additional metadata properties
}
