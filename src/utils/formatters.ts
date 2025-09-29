/**
 * Generic Response formatting utilities for MCP Server
 * Transforms raw data into AI-friendly, contextualized formats
 */

import {
  McpSuccessResponse,
  McpErrorResponse,
} from '../types/mcp.js';
import { GenericError } from '../types/errors.js';
import { APP_CONFIG, MCP_SERVER_CONFIG } from '../config/appConfig.js';

// ===== CORE FORMATTING FUNCTIONS =====

/**
 * Creates standardized MCP success response
 * @param data The data to be included in the response.
 * @param metadata Additional metadata to include in the response.
 * @returns A structured McpSuccessResponse.
 */
export function createMcpSuccessResponse<T>(
  data: T,
  metadata: {
    totalResults?: number;
    queryTime?: number;
    additionalInfo?: Record<string, unknown>;
  } = {},
): McpSuccessResponse<T> {
  const queryTimeMs = metadata.queryTime || 0;

  return {
    success: true,
    data,
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    metadata: {
      total_results: metadata.totalResults || 0,
      query_time: `${queryTimeMs}ms`,
      data_source: APP_CONFIG.DEFAULT_DATA_SOURCE,
      last_updated: new Date().toISOString(),
      api_version: APP_CONFIG.API_VERSION,
      ...metadata.additionalInfo,
    },
    clinical_notes: generateClinicalNotes(data),
    warnings: generateResponseWarnings(data),
    next_suggested_actions: generateNextActions(data),
  };
}

/**
 * Creates standardized MCP error response
 * @param error The GenericError object.
 * @param partialData Optional. Any partial data obtained before the error occurred.
 * @returns A structured McpErrorResponse.
 */
export function createMcpErrorResponse(
  error: GenericError,
  partialData?: unknown,
): McpErrorResponse {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      severity: error.severity,
      type: error.type,
      timestamp: error.timestamp.toISOString(),
      suggestions: error.suggestions || [],
      details: error.details,
    },
    content: [{ type: 'text', text: error.message }],
    partial_data: partialData,
    recovery_actions: generateRecoveryActions(error),
  };
}

// ===== HELPER FUNCTIONS =====

/**
 * Formats date strings into a readable ISO format.
 * @param dateInput The date string or Date object to format.
 * @returns A formatted date string or null if invalid.
 */
export function formatDate(dateInput: string | Date | null): string | null {
  if (!dateInput) {
    return null;
  }
  try {
    const date = new Date(dateInput);
    return date.toISOString();
  } catch (e) {
    return null;
  }
}

/**
 * Generates generic clinical notes for response data.
 * Tools can override or enhance these notes.
 */
function generateClinicalNotes(data: unknown): string[] {
  return [
    'Information provided is for general reference.',
    'Always consult relevant experts for specific advice.',
  ];
}

/**
 * Generates generic warnings for response data.
 * Tools can override or enhance these warnings.
 */
function generateResponseWarnings(data: unknown): string[] {
  // Example: warn if data is empty
  if (data === null || (Array.isArray(data) && data.length === 0) || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return ['No data available for this request.'];
  }
  return [];
}

/**
 * Generates generic next suggested actions based on response data.
 * Tools can override or enhance these actions.
 */
function generateNextActions(
  data: unknown,
): Array<{ tool: string; reason: string; parameters_hint: string }> {
  const actions: Array<{ tool: string; reason: string; parameters_hint: string }> = [];

  // Example: suggest using a generic search tool if results are empty
  if (data === null || (Array.isArray(data) && data.length === 0)) {
    actions.push({
      tool: 'generic_search_tool', // Placeholder tool name
      reason: 'Try a broader or alternative search query',
      parameters_hint: 'query: "your new search term"',
    });
  }

  // Example: suggest checking configuration if an error related to it
  if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'object' && data.error !== null && 'type' in data.error && data.error.type === 'CONFIGURATION_ERROR') {
    actions.push({
      tool: 'check_configuration', // Placeholder tool name
      reason: 'Review server and API configuration settings',
      parameters_hint: 'config_file: "src/config/appConfig.ts"',
    });
  }

  return actions;
}

/**
 * Generates recovery actions for errors.
 */
function generateRecoveryActions(error: GenericError): string[] {
  const actions: string[] = [];

  if (error.isRecoverable()) {
    actions.push('Retry the operation with corrected parameters if applicable.');
    if (error.suggestions && error.suggestions.length > 0) {
      actions.push(...error.suggestions);
    } else {
      actions.push('Consider alternative approaches or refine input.');
    }
  } else {
    actions.push('The error is not directly recoverable; further investigation is needed.');
    if (error.suggestions && error.suggestions.length > 0) {
      actions.push(...error.suggestions);
    }
  }

  return actions;
}
