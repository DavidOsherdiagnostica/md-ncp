/**
 * Error types for Israel Drugs MCP Server
 * Centralized error handling with clinical context
 */

export enum ErrorType {
  // API Related Errors
  API_CONNECTION_ERROR = 'API_CONNECTION_ERROR',
  API_TIMEOUT = 'API_TIMEOUT',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  API_INVALID_RESPONSE = 'API_INVALID_RESPONSE',
  API_SERVER_ERROR = 'API_SERVER_ERROR',

  // Data Validation Errors
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_DRUG_REGISTRATION = 'INVALID_DRUG_REGISTRATION',
  INVALID_SYMPTOM_CATEGORY = 'INVALID_SYMPTOM_CATEGORY',
  INVALID_ATC_CODE = 'INVALID_ATC_CODE',

  // Clinical Safety Errors
  DRUG_DISCONTINUED = 'DRUG_DISCONTINUED',
  PRESCRIPTION_REQUIRED = 'PRESCRIPTION_REQUIRED',
  SAFETY_WARNING = 'SAFETY_WARNING',

  // Search Errors
  NO_RESULTS_FOUND = 'NO_RESULTS_FOUND',
  TOO_MANY_RESULTS = 'TOO_MANY_RESULTS',
  AMBIGUOUS_QUERY = 'AMBIGUOUS_QUERY',

  // System Errors
  CACHE_ERROR = 'CACHE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export enum ErrorSeverity {
  LOW = 'low', // Minor issues, suggestions available
  MEDIUM = 'medium', // Important warnings, user action needed
  HIGH = 'high', // Critical errors, unsafe to proceed
  CRITICAL = 'critical', // System failures, medical safety concerns
}

export interface McpError extends Error {
  readonly type: ErrorType;
  readonly severity: ErrorSeverity;
  readonly code: string;
  readonly message: string;
  readonly details: Record<string, unknown> | undefined;
  readonly timestamp: Date;
  readonly correlationId: string | undefined;
  readonly suggestions: string[] | undefined;
  readonly clinicalContext: string | undefined;
}

export class IsraelDrugsError extends Error implements McpError {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly code: string;
  public readonly details: Record<string, unknown> | undefined;
  public readonly timestamp: Date;
  public readonly correlationId: string | undefined;
  public readonly suggestions: string[] | undefined;
  public readonly clinicalContext: string | undefined;

  constructor(
    type: ErrorType,
    message: string,
    options: {
      severity?: ErrorSeverity;
      details?: Record<string, unknown>;
      correlationId?: string;
      suggestions?: string[];
      clinicalContext?: string;
      cause?: Error;
    } = {},
  ) {
    super(message);
    this.name = 'IsraelDrugsError';
    this.type = type;
    this.severity = options.severity ?? ErrorSeverity.MEDIUM;
    this.code = type;
    this.details = options.details ?? undefined;
    this.timestamp = new Date();
    this.correlationId = options.correlationId ?? undefined;
    this.suggestions = options.suggestions ?? undefined;
    this.clinicalContext = options.clinicalContext ?? undefined;

    if (options.cause) {
      this.cause = options.cause;
    }

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, IsraelDrugsError);
    }
  }

  /**
   * Creates a new IsraelDrugsError instance with updated properties.
   * This is useful for modifying read-only properties like correlationId after initial creation.
   * @param updates An object containing the properties to update.
   * @returns A new IsraelDrugsError instance with the merged properties.
   */
  public copyWith(updates: {
    type?: ErrorType;
    message?: string;
    severity?: ErrorSeverity;
    details?: Record<string, unknown>;
    correlationId?: string;
    suggestions?: string[];
    clinicalContext?: string;
    cause?: Error;
  }): IsraelDrugsError {
    const newDetails = updates.details ? { ...this.details, ...updates.details } : this.details;

    return new IsraelDrugsError(
      updates.type ?? this.type,
      updates.message ?? this.message,
      {
        severity: updates.severity ?? this.severity,
        ...(newDetails && { details: newDetails }), // Conditionally add details
        ...(updates.correlationId !== undefined ? { correlationId: updates.correlationId } : this.correlationId !== undefined ? { correlationId: this.correlationId } : {}),
        ...(updates.suggestions !== undefined ? { suggestions: updates.suggestions } : this.suggestions !== undefined ? { suggestions: this.suggestions } : {}),
        ...(updates.clinicalContext !== undefined ? { clinicalContext: updates.clinicalContext } : this.clinicalContext !== undefined ? { clinicalContext: this.clinicalContext } : {}),
        cause: updates.cause ?? this.cause as Error,
      },
    );
  }

  /**
   * Convert error to JSON format suitable for MCP response
   */
  toMcpFormat(): {
    error: {
      code: string;
      message: string;
      severity: ErrorSeverity;
      type: ErrorType;
      timestamp: string;
      suggestions?: string[];
      clinical_context?: string;
      details?: Record<string, unknown>;
    };
  } {
    return {
      error: {
        code: this.code,
        message: this.message,
        severity: this.severity,
        type: this.type,
        timestamp: this.timestamp.toISOString(),
        ...(this.suggestions && { suggestions: this.suggestions }),
        ...(this.clinicalContext && { clinical_context: this.clinicalContext }),
        ...(this.details && { details: this.details }),
      },
    };
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(): boolean {
    const recoverableTypes = [
      ErrorType.NO_RESULTS_FOUND,
      ErrorType.AMBIGUOUS_QUERY,
      ErrorType.INVALID_INPUT,
      ErrorType.API_TIMEOUT,
      ErrorType.API_RATE_LIMIT,
    ];

    return recoverableTypes.includes(this.type);
  }

  /**
   * Check if error represents a clinical safety concern
   */
  isClinicalSafetyConcern(): boolean {
    return (
      this.severity === ErrorSeverity.HIGH ||
      this.severity === ErrorSeverity.CRITICAL ||
      [
        ErrorType.DRUG_DISCONTINUED,
        ErrorType.SAFETY_WARNING,
        ErrorType.PRESCRIPTION_REQUIRED,
      ].includes(this.type)
    );
  }
}
