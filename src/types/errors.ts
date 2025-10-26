/**
 * Generic Error types for MCP Server
 * Centralized error handling
 */

export enum ErrorType {
  // Data Validation Errors
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Search Errors
  NO_RESULTS_FOUND = 'NO_RESULTS_FOUND',
  TOO_MANY_RESULTS = 'TOO_MANY_RESULTS',
  AMBIGUOUS_QUERY = 'AMBIGUOUS_QUERY',

  // Processing Errors
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  PROCESSING_TIMEOUT = 'PROCESSING_TIMEOUT',

  // System Errors
  CACHE_ERROR = 'CACHE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export enum ErrorSeverity {
  LOW = 'low', // Minor issues, suggestions available
  MEDIUM = 'medium', // Important warnings, user action needed
  HIGH = 'high', // Critical errors, unsafe to proceed
  CRITICAL = 'critical', // System failures, critical impact
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
}

export class GenericError extends Error implements McpError {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly code: string;
  public readonly details: Record<string, unknown> | undefined;
  public readonly timestamp: Date;
  public readonly correlationId: string | undefined;
  public readonly suggestions: string[] | undefined;

  constructor(
    type: ErrorType,
    message: string,
    options: {
      severity?: ErrorSeverity;
      details?: Record<string, unknown>;
      correlationId?: string;
      suggestions?: string[];
      cause?: Error;
    } = {},
  ) {
    super(message);
    this.name = 'GenericError';
    this.type = type;
    this.severity = options.severity ?? ErrorSeverity.MEDIUM;
    this.code = type;
    this.details = options.details ?? undefined;
    this.timestamp = new Date();
    this.correlationId = options.correlationId ?? undefined;
    this.suggestions = options.suggestions ?? undefined;

    if (options.cause) {
      this.cause = options.cause;
    }

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GenericError);
    }
  }

  /**
   * Creates a new GenericError instance with updated properties.
   * This is useful for modifying read-only properties like correlationId after initial creation.
   * @param updates An object containing the properties to update.
   * @returns A new GenericError instance with the merged properties.
   */
  public copyWith(updates: {
    type?: ErrorType;
    message?: string;
    severity?: ErrorSeverity;
    details?: Record<string, unknown>;
    correlationId?: string;
    suggestions?: string[];
    cause?: Error;
  }): GenericError {
    const newDetails = updates.details ? { ...this.details, ...updates.details } : this.details;

    return new GenericError(
      updates.type ?? this.type,
      updates.message ?? this.message,
      {
        severity: updates.severity ?? this.severity,
        ...(newDetails && { details: newDetails }),
        ...(updates.correlationId !== undefined ? { correlationId: updates.correlationId } : this.correlationId !== undefined ? { correlationId: this.correlationId } : {}),
        ...(updates.suggestions !== undefined ? { suggestions: updates.suggestions } : this.suggestions !== undefined ? { suggestions: this.suggestions } : {}),
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
      ErrorType.PROCESSING_ERROR,
    ];

    return recoverableTypes.includes(this.type);
  }
}
