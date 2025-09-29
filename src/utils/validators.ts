/**
 * Generic input validation utilities for MCP Server
 * Validates and sanitizes user inputs
 */

import { z } from 'zod';
import { GenericError, ErrorType, ErrorSeverity } from '../types/errors.js';
import { MCP_SERVER_CONFIG } from '../config/appConfig.js';

// ===== BASIC VALIDATION SCHEMAS =====

export const PageIndexSchema = z
  .number()
  .int('Page index must be an integer')
  .min(1, 'Page index must start from 1') // Assuming 1-based indexing as a common default
  .max(1000, 'Page index too high');

// ===== VALIDATION FUNCTIONS =====

/**
 * Validates and normalizes page index (assuming 1-based indexing)
 */
export function validatePageIndex(input: number): number {
  try {
    return PageIndexSchema.parse(input);
  } catch (error) {
    throw new GenericError(ErrorType.INVALID_INPUT, `Invalid page index: ${input}`, {
      severity: ErrorSeverity.LOW,
      suggestions: ['Page numbering typically starts from 1, not 0', 'Use reasonable page numbers (e.g., < 1000)'],
      details: { input, minValue: 1 },
    });
  }
}

/**
 * Sanitizes a generic search query string.
 * @param query The input query string.
 * @returns A sanitized string.
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .substring(0, MCP_SERVER_CONFIG.RESPONSE_LIMITS.MAX_SEARCH_RESULTS) // Use a generic max length from config
    .replace(/[<>\"';&]/g, ''); // Remove potentially harmful characters
}

// ===== COMPLEX VALIDATION FUNCTIONS =====

/**
 * Validates tool input against a Zod schema and provides recovery suggestions.
 * This function is generic and should be used by individual tools.
 *
 * @param schema The Zod schema to validate against.
 * @param input The raw input received by the tool.
 * @param toolName The name of the tool for context in error messages.
 * @returns An object containing the validated data and any warnings.
 * @throws GenericError if validation fails.
 */
export function validateToolInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
  toolName: string,
): { data: T; warnings: string[] } {
  const warnings: string[] = [];

  try {
    const data = schema.parse(input);
    return { data, warnings };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('; ');

      throw new GenericError(
        ErrorType.INVALID_INPUT,
        `Invalid input for tool '${toolName}': ${details}`,
        {
          severity: ErrorSeverity.MEDIUM,
          suggestions: [
            "Check the required parameters for this tool",
            "Ensure all required fields are provided",
            "Verify data types match the expected schema",
            "Consult the tool's documentation for correct usage",
          ],
          details: {
            tool: toolName,
            errors: error.errors,
            input,
          },
        },
      );
    }

    throw error; // Re-throw other unexpected errors
  }
}
