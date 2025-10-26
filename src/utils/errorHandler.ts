/**
 * Centralized error handling for Generic MCP Server
 * Provides intelligent error recovery and contextual information
 */

import { GenericError, ErrorType, ErrorSeverity } from '../types/errors.js';
import { McpErrorResponse } from '../types/mcp.js';
import { createMcpErrorResponse } from '../utils/formatters.js';
import { ERROR_CONFIG, PERFORMANCE_CONFIG } from '../config/appConfig.js';

// ===== ERROR CLASSIFICATION =====

/**
 * Classifies an unknown error into an appropriate GenericError
 */
export function classifyError(error: unknown, context?: string): GenericError {
  // If already a GenericError, return as-is
  if (error instanceof GenericError) {
    return error;
  }

  // Handle processing timeout errors
  if (error instanceof Error && error.name === 'TimeoutError') {
    return new GenericError(
      ErrorType.PROCESSING_TIMEOUT,
      ERROR_CONFIG.DEFAULT_ERROR_MESSAGES.TIMEOUT_ERROR,
      {
        severity: ErrorSeverity.MEDIUM,
        suggestions: [
          'Retry the processing',
          'The system may be experiencing high load',
        ],
        details: { originalError: error.message, context },
      },
    );
  }

  // Handle general processing errors
  if (error instanceof Error && error.message.includes('processing')) {
    return new GenericError(
      ErrorType.PROCESSING_ERROR,
      'Error occurred during local processing',
      {
        severity: ErrorSeverity.MEDIUM,
        suggestions: [
          'Retry the operation',
          'Check input parameters',
        ],
        details: { originalError: error.message, context },
      },
    );
  }

  // Generic error fallback
  const errorMessage = error instanceof Error ? error.message : String(error);
  return new GenericError(ErrorType.UNKNOWN_ERROR, `Unexpected error: ${errorMessage}`, {
    severity: ErrorSeverity.MEDIUM,
    suggestions: [
      'Try the request again',
      'Check input parameters',
      'Contact support if problem persists',
    ],
    details: { originalError: errorMessage, context },
  });
}

// ===== ERROR CONTEXT ENHANCEMENT =====

/**
 * Enhances error with additional context for better AI understanding
 * This function should be kept generic, without domain-specific suggestions.
 */
export function enhanceErrorContext(
  error: GenericError,
  operationContext: {
    toolName?: string;
    userInput?: unknown;
    attemptNumber?: number;
    previousErrors?: string[];
  },
): GenericError {
  const enhancedSuggestions = [...(error.suggestions || [])];
  const enhancedDetails = { ...error.details, ...operationContext };

  // Add retry-specific suggestions
  if (operationContext.attemptNumber && operationContext.attemptNumber > 1) {
    enhancedSuggestions.push(
      `This is attempt ${operationContext.attemptNumber} - consider alternative approach`,
      'Multiple failures may indicate a systematic issue with the API or logic',
    );
  }

  // Add pattern-based suggestions from previous errors (if generic enough)
  if (operationContext.previousErrors && operationContext.previousErrors.length > 0) {
    enhancedSuggestions.push(
      'Previous errors suggest possible input format issues or systemic problems',
      'Consider reviewing previous interactions or input carefully',
    );
  }

  return new GenericError(error.type, error.message, {
    severity: error.severity,
    suggestions: enhancedSuggestions,
    details: enhancedDetails,
    ...(error.correlationId && { correlationId: error.correlationId }),
  });
}

// ===== ERROR RESPONSE FORMATTING =====

/**
 * Creates comprehensive error response for MCP
 */
export function createComprehensiveErrorResponse(
  error: GenericError,
  partialData?: unknown,
  operationContext?: {
    toolName?: string;
    userInput?: unknown;
    attemptNumber?: number;
  },
): McpErrorResponse {
  // Enhance error with context
  const enhancedError = operationContext ? enhanceErrorContext(error, operationContext) : error;

  // Create base error response
  const baseResponse = createMcpErrorResponse(enhancedError, partialData);

  // Add generic recovery information
  const recoveryInfo = {
    is_recoverable: enhancedError.isRecoverable(), // Based on GenericError logic
    strategy: enhancedError.isRecoverable() ? 'retry' as const : 'abort' as const, // Explicitly cast to literal types
    retry_delay_ms: enhancedError.isRecoverable() ? 1000 : 0, // Use default retry delay
  };

  // Add generic safety information (can be expanded by specific implementations)
  const genericSafety = {
    level: 'low', // Default to low; specific tools can override
    action_required: 'Review the error and consider alternative actions.',
    patient_guidance: 'Contact support if the issue persists.',
    provider_notification: false,
  };

  // Enhance with recovery and safety information
  return {
    ...baseResponse,
    error: {
      ...baseResponse.error,
      clinical_safety: genericSafety, // Using generic safety
      recovery_info: recoveryInfo,
    },
    recovery_actions: enhancedError.suggestions || [], // Use enhanced error suggestions
  };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Logs error with appropriate level and context
 */
export function logError(error: GenericError, context?: string): void {
  const logLevel = getLogLevel(error.severity);
  const logMessage = `[${error.type}] ${error.message}`;
  const logData = {
    severity: error.severity,
    type: error.type,
    timestamp: error.timestamp.toISOString(),
    context,
    details: error.details,
    correlationId: error.correlationId,
  };

  switch (logLevel) {
    case 'error':
      // console.error(logMessage, logData);
      break;
    case 'warn':
      // console.warn(logMessage, logData);
      break;
    case 'info':
      // console.info(logMessage, logData);
      break;
    default:
      // console.log(logMessage, logData);
  }
}

/**
 * Maps error severity to log level
 */
function getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' | 'debug' {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.HIGH:
      return 'error';
    case ErrorSeverity.MEDIUM:
      return 'warn';
    case ErrorSeverity.LOW:
      return 'info';
    default:
      return 'debug';
  }
}

/**
 * Determines if error should trigger immediate alerting
 */
export function shouldAlert(error: GenericError): boolean {
  // Define generic alerting logic; specific implementations can extend this.
  return error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH;
}

/**
 * Creates user-friendly error message for AI consumption
 */
export function createUserFriendlyMessage(error: GenericError): string {
  const baseMessage = error.message;

  // Generic messages based on severity or recoverability
  if (error.isRecoverable()) {
    return `RECOVERABLE ERROR: ${baseMessage}. This issue might resolve with a retry or alternative action.`;
  }

  return `ERROR: ${baseMessage}. Please investigate or try an alternative approach.`;
}
