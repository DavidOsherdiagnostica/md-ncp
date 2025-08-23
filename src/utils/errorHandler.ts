/**
 * Centralized error handling for Israel Drugs MCP Server
 * Provides intelligent error recovery and clinical safety context
 */

import { IsraelDrugsError, ErrorType, ErrorSeverity } from '../types/errors.js';
import { McpErrorResponse } from '../types/mcp.js';
import { createMcpErrorResponse } from './formatters.js';
import { ERROR_CONFIG } from '../config/constants.js';

// ===== ERROR CLASSIFICATION =====

/**
 * Classifies an unknown error into appropriate IsraelDrugsError
 */
export function classifyError(error: unknown, context?: string): IsraelDrugsError {
  // If already an IsraelDrugsError, return as-is
  if (error instanceof IsraelDrugsError) {
    return error;
  }

  // Handle fetch/network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new IsraelDrugsError(
      ErrorType.API_CONNECTION_ERROR,
      ERROR_CONFIG.DEFAULT_ERROR_MESSAGES.CONNECTION_ERROR,
      {
        severity: ErrorSeverity.HIGH,
        suggestions: [
          'Check internet connection',
          'Verify Ministry of Health API is accessible',
          'Try again in a few moments',
        ],
        clinicalContext: 'Unable to access medical database - patient safety may be compromised',
        details: { originalError: String(error), context },
      },
    );
  }

  // Handle timeout errors
  if (error instanceof Error && error.name === 'TimeoutError') {
    return new IsraelDrugsError(
      ErrorType.API_TIMEOUT,
      ERROR_CONFIG.DEFAULT_ERROR_MESSAGES.TIMEOUT_ERROR,
      {
        severity: ErrorSeverity.MEDIUM,
        suggestions: [
          'Retry the request',
          'Try with more specific search criteria',
          'The medical database may be experiencing high load',
        ],
        details: { originalError: error.message, context },
      },
    );
  }

  // Handle HTTP response errors
  if (error instanceof Error && error.message.includes('HTTP')) {
    const statusMatch = error.message.match(/HTTP (\d+)/);
    const statusCode = statusMatch ? parseInt(statusMatch[1]!) : 0; // Added non-null assertion

    if (statusCode === 429) {
      return new IsraelDrugsError(
        ErrorType.API_RATE_LIMIT,
        ERROR_CONFIG.DEFAULT_ERROR_MESSAGES.RATE_LIMIT_ERROR,
        {
          severity: ErrorSeverity.MEDIUM,
          suggestions: [
            'Wait a moment before retrying',
            'Reduce request frequency',
            'Use cached data if available',
          ],
          details: { statusCode, context },
        },
      );
    }

    if (statusCode >= 500) {
      return new IsraelDrugsError(
        ErrorType.API_SERVER_ERROR,
        `Ministry of Health server error (${statusCode})`,
        {
          severity: ErrorSeverity.HIGH,
          suggestions: [
            'Try again later',
            'The medical database may be under maintenance',
            'Contact system administrator if problem persists',
          ],
          clinicalContext: 'Medical database temporarily unavailable',
          details: { statusCode, context },
        },
      );
    }

    return new IsraelDrugsError(
      ErrorType.API_INVALID_RESPONSE,
      `Unexpected API response (${statusCode})`,
      {
        severity: ErrorSeverity.MEDIUM,
        suggestions: [
          'Verify request parameters',
          'Check API documentation',
          'Try a different approach',
        ],
        details: { statusCode, context },
      },
    );
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return new IsraelDrugsError(
      ErrorType.API_INVALID_RESPONSE,
      ERROR_CONFIG.DEFAULT_ERROR_MESSAGES.INVALID_RESPONSE,
      {
        severity: ErrorSeverity.HIGH,
        suggestions: [
          'The medical database returned invalid data',
          'Try the request again',
          'Report this issue if it persists',
        ],
        clinicalContext: 'Data integrity issue with medical database',
        details: { originalError: error.message, context },
      },
    );
  }

  // Generic error fallback
  const errorMessage = error instanceof Error ? error.message : String(error);
  return new IsraelDrugsError(ErrorType.UNKNOWN_ERROR, `Unexpected error: ${errorMessage}`, {
    severity: ErrorSeverity.MEDIUM,
    suggestions: [
      'Try the request again',
      'Check input parameters',
      'Contact support if problem persists',
    ],
    details: { originalError: errorMessage, context },
  });
}

// ===== ERROR RECOVERY STRATEGIES =====

/**
 * Determines if an error is recoverable and suggests recovery actions
 */
export function analyzeErrorRecovery(error: IsraelDrugsError): {
  isRecoverable: boolean;
  recoveryStrategy: 'retry' | 'alternative' | 'user_action' | 'abort';
  suggestedActions: string[];
  retryDelay?: number;
} {
  const isRecoverable = error.isRecoverable();

  switch (error.type) {
    case ErrorType.API_TIMEOUT:
    case ErrorType.API_CONNECTION_ERROR:
      return {
        isRecoverable: true,
        recoveryStrategy: 'retry',
        suggestedActions: [
          'Retry the request after a short delay',
          'Check network connectivity',
          'Verify API endpoint availability',
        ],
        retryDelay: 2000,
      };

    case ErrorType.API_RATE_LIMIT:
      return {
        isRecoverable: true,
        recoveryStrategy: 'retry',
        suggestedActions: [
          'Wait before retrying (rate limit exceeded)',
          'Reduce request frequency',
          'Implement request queuing',
        ],
        retryDelay: 5000,
      };

    case ErrorType.NO_RESULTS_FOUND:
      return {
        isRecoverable: true,
        recoveryStrategy: 'alternative',
        suggestedActions: [
          "Try using 'suggest_drug_names' for spelling help",
          'Search by symptom instead of drug name',
          'Use broader search criteria',
          'Check for typos in search terms',
        ],
      };

    case ErrorType.AMBIGUOUS_QUERY:
      return {
        isRecoverable: true,
        recoveryStrategy: 'user_action',
        suggestedActions: [
          'Provide more specific search criteria',
          'Use exact drug names from suggestions',
          'Filter by administration route or therapeutic category',
        ],
      };

    case ErrorType.INVALID_INPUT:
    case ErrorType.INVALID_DRUG_REGISTRATION:
    case ErrorType.INVALID_ATC_CODE:
    case ErrorType.INVALID_SYMPTOM_CATEGORY:
      return {
        isRecoverable: true,
        recoveryStrategy: 'user_action',
        suggestedActions: [
          'Correct the input parameters',
          'Use validation tools to check format',
          'Refer to helper endpoints for valid values',
        ],
      };

    case ErrorType.DRUG_DISCONTINUED:
      return {
        isRecoverable: true,
        recoveryStrategy: 'alternative',
        suggestedActions: [
          'Search for active alternatives',
          "Use 'explore_generic_alternatives' with same active ingredient",
          'Consult healthcare provider for replacement options',
        ],
      };

    case ErrorType.PRESCRIPTION_REQUIRED:
      return {
        isRecoverable: true,
        recoveryStrategy: 'alternative',
        suggestedActions: [
          'Search for over-the-counter alternatives',
          'Filter search to show only OTC medications',
          'Consult healthcare provider for prescription',
        ],
      };

    case ErrorType.API_SERVER_ERROR:
    case ErrorType.API_INVALID_RESPONSE:
      return {
        isRecoverable: false,
        recoveryStrategy: 'abort',
        suggestedActions: [
          'Medical database is temporarily unavailable',
          'Try again later',
          'Use alternative information sources',
          'Contact system administrator',
        ],
      };

    default:
      return {
        isRecoverable: false,
        recoveryStrategy: 'abort',
        suggestedActions: [
          'Unknown error occurred',
          'Try a different approach',
          'Contact support with error details',
        ],
      };
  }
}

// ===== CLINICAL SAFETY ERROR HANDLING =====

/**
 * Handles errors with clinical safety implications
 */
export function handleClinicalSafetyError(error: IsraelDrugsError): {
  safetyLevel: 'low' | 'medium' | 'high' | 'critical';
  clinicalAction: string;
  patientGuidance: string;
  providerNotification: boolean;
} {
  if (error.isClinicalSafetyConcern()) {
    switch (error.type) {
      case ErrorType.DRUG_DISCONTINUED:
        return {
          safetyLevel: 'high',
          clinicalAction: 'Immediately stop using discontinued medication',
          patientGuidance: 'Contact your healthcare provider for alternative treatment',
          providerNotification: true,
        };

      case ErrorType.SAFETY_WARNING:
        return {
          safetyLevel: 'critical',
          clinicalAction: 'Review safety warnings before proceeding',
          patientGuidance: 'Do not use this medication without medical supervision',
          providerNotification: true,
        };

      case ErrorType.PRESCRIPTION_REQUIRED:
        return {
          safetyLevel: 'medium',
          clinicalAction: 'Medical evaluation required for this medication',
          patientGuidance: 'Schedule appointment with healthcare provider',
          providerNotification: false,
        };

      default:
        return {
          safetyLevel: 'medium',
          clinicalAction: 'Exercise caution due to incomplete information',
          patientGuidance: 'Verify medication information with healthcare provider',
          providerNotification: false,
        };
    }
  }

  return {
    safetyLevel: 'low',
    clinicalAction: 'Standard information validation recommended',
    patientGuidance: 'Use medication information as general reference only',
    providerNotification: false,
  };
}

// ===== ERROR CONTEXT ENHANCEMENT =====

/**
 * Enhances error with additional context for better AI understanding
 */
export function enhanceErrorContext(
  error: IsraelDrugsError,
  operationContext: {
    toolName?: string;
    userInput?: unknown; // Changed from Record<string, unknown>
    attemptNumber?: number;
    previousErrors?: string[];
  },
): IsraelDrugsError {
  const enhancedSuggestions = [...(error.suggestions || [])];
  const enhancedDetails = { ...error.details, ...operationContext };

  // Add tool-specific suggestions
  if (operationContext.toolName) {
    switch (operationContext.toolName) {
      case 'discover_drug_by_name':
        enhancedSuggestions.push(
          "Try 'suggest_drug_names' tool for spelling assistance",
          'Consider searching by symptom instead',
        );
        break;

      case 'find_drugs_for_symptom':
        enhancedSuggestions.push(
          "Use 'browse_available_symptoms' to see valid symptom categories",
          'Check symptom spelling and category matching',
        );
        break;

      case 'explore_generic_alternatives':
        enhancedSuggestions.push(
          'Verify ATC code format (4 characters only)',
          "Use 'explore_therapeutic_categories' for valid ATC codes",
        );
        break;
    }
  }

  // Add retry-specific suggestions
  if (operationContext.attemptNumber && operationContext.attemptNumber > 1) {
    enhancedSuggestions.push(
      `This is attempt ${operationContext.attemptNumber} - consider alternative approach`,
      'Multiple failures may indicate systematic issue',
    );
  }

  // Add pattern-based suggestions from previous errors
  if (operationContext.previousErrors && operationContext.previousErrors.length > 0) {
    enhancedSuggestions.push(
      'Previous errors suggest possible input format issues',
      'Consider using helper tools to validate input parameters',
    );
  }

  return new IsraelDrugsError(error.type, error.message, {
    severity: error.severity,
    suggestions: enhancedSuggestions,
    ...(error.clinicalContext && { clinicalContext: error.clinicalContext }), // Conditionally add clinicalContext
    details: enhancedDetails,
    ...(error.correlationId && { correlationId: error.correlationId }),
  });
}

// ===== ERROR RESPONSE FORMATTING =====

/**
 * Creates comprehensive error response for MCP
 */
export function createComprehensiveErrorResponse(
  error: IsraelDrugsError,
  partialData?: unknown,
  operationContext?: {
    toolName?: string;
    userInput?: unknown; // Changed from Record<string, unknown>
    attemptNumber?: number;
  },
): McpErrorResponse {
  // Enhance error with context
  const enhancedError = operationContext ? enhanceErrorContext(error, operationContext) : error;

  // Analyze recovery options
  const recoveryAnalysis = analyzeErrorRecovery(enhancedError);

  // Get clinical safety information
  const safetyInfo = handleClinicalSafetyError(enhancedError);

  // Create base error response
  const baseResponse = createMcpErrorResponse(enhancedError, partialData);

  // Enhance with recovery and safety information
  return {
    ...baseResponse,
    error: {
      ...baseResponse.error,
      clinical_safety: {
        level: safetyInfo.safetyLevel,
        action_required: safetyInfo.clinicalAction,
        patient_guidance: safetyInfo.patientGuidance,
        provider_notification: safetyInfo.providerNotification,
      },
      recovery_info: {
        is_recoverable: recoveryAnalysis.isRecoverable,
        strategy: recoveryAnalysis.recoveryStrategy,
        retry_delay_ms: recoveryAnalysis.retryDelay || 0,
      },
    },
    recovery_actions: recoveryAnalysis.suggestedActions,
  };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Logs error with appropriate level and context
 */
export function logError(error: IsraelDrugsError, context?: string): void {
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
export function shouldAlert(error: IsraelDrugsError): boolean {
  return (
    error.severity === ErrorSeverity.CRITICAL ||
    error.type === ErrorType.API_SERVER_ERROR ||
    error.isClinicalSafetyConcern()
  );
}

/**
 * Creates user-friendly error message for AI consumption
 */
export function createUserFriendlyMessage(error: IsraelDrugsError): string {
  const baseMessage = error.message;

  if (error.isClinicalSafetyConcern()) {
    return `MEDICAL SAFETY ALERT: ${baseMessage}. Please consult healthcare professionals.`;
  }

  if (error.isRecoverable()) {
    return `RECOVERABLE ERROR: ${baseMessage}. This can be resolved with the suggested actions.`;
  }

  return `ERROR: ${baseMessage}. Please try an alternative approach.`;
}
