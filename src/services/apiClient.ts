import fetch from 'node-fetch';
import { GenericError, ErrorType, ErrorSeverity } from '../types/errors.js';
import { APP_CONFIG, REQUEST_CONFIG } from '../config/appConfig.js';
import { classifyError, logError } from '../utils/errorHandler.js';

// ===== API CLIENT CLASS =====

export class GenericApiClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor() {
    this.baseUrl = APP_CONFIG.API_BASE_URL;
    this.timeout = REQUEST_CONFIG.TIMEOUT_MS;
    this.maxRetries = REQUEST_CONFIG.RETRY_ATTEMPTS;
    this.retryDelay = REQUEST_CONFIG.RETRY_DELAY_MS;
  }

  // ===== CORE HTTP METHODS =====

  /**
   * Makes a POST request to the API with retry logic
   * This method is generic and can be used for any API call.
   */
  private async makeRequest<T>(
    endpoint: string,
    body: Record<string, unknown>,
    attemptNumber = 1,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const correlationId = this.generateCorrelationId();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: REQUEST_CONFIG.HEADERS,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();

      if (!responseText.trim()) {
        throw new GenericError(ErrorType.API_INVALID_RESPONSE, 'API returned empty response', {
          severity: ErrorSeverity.HIGH,
          correlationId,
          details: { endpoint, body },
        });
      }

      try {
        return JSON.parse(responseText) as T;
      } catch (parseError) {
        throw new GenericError(ErrorType.API_INVALID_RESPONSE, 'API returned invalid JSON', {
          severity: ErrorSeverity.HIGH,
          correlationId,
          details: { endpoint, body, responseText: responseText.substring(0, 200) },
        });
      }
    } catch (error) {
      const classifiedError = classifyError(error, `${endpoint} - attempt ${attemptNumber}`);
      const errorWithCorrelationId = classifiedError.copyWith({ correlationId });

      logError(errorWithCorrelationId, `API request to ${endpoint}`);

      if (attemptNumber < this.maxRetries && this.shouldRetry(errorWithCorrelationId)) {
        await this.delay(this.retryDelay * attemptNumber);
        return this.makeRequest<T>(endpoint, body, attemptNumber + 1);
      }

      throw errorWithCorrelationId;
    }
  }

  /**
   * Perform a generic API call to a specified endpoint with a given request body.
   * This function should be used by individual tools to interact with your specific API.
   *
   * @param endpoint The API endpoint to call.
   * @param requestBody The request body to send (type U).
   * @returns A promise that resolves to the API response (type T).
   */
  async performGenericApiCall<T, U>(endpoint: string, requestBody: U): Promise<T> {
    // Implement your API specific logic here. This is a placeholder.
    // You might need to map requestBody (U) to your API's expected format
    // and then call this.makeRequest<T>(endpoint, mappedBody);

    // For example, if your API always expects a 'data' field:
    return this.makeRequest<T>(endpoint, { ...requestBody as Record<string, unknown> });
  }

  // ===== UTILITY METHODS =====

  /**
   * Determines if an error should trigger a retry
   */
  private shouldRetry(error: GenericError): boolean {
    const retryableTypes = [
      ErrorType.API_TIMEOUT,
      ErrorType.API_CONNECTION_ERROR,
      ErrorType.API_RATE_LIMIT,
    ];

    return retryableTypes.includes(error.type);
  }

  /**
   * Delays execution for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generates correlation ID for request tracking
   */
  private generateCorrelationId(): string {
    return `mcp-generic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ===== HEALTH CHECK =====

  /**
   * Performs a generic health check on the API.
   * You should customize this to ping a reliable endpoint of your integrated API.
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    endpoints: Record<string, boolean>;
  }> {
    const startTime = Date.now();
    const endpointResults: Record<string, boolean> = {};

    try {
      // Replace with an actual lightweight endpoint from your integrated API
      // Example: await this.makeRequest('/health', {});
      endpointResults.generic_endpoint_check = true; 
    } catch {
      endpointResults.generic_endpoint_check = false;
    }

    const latency = Date.now() - startTime;
    const healthyEndpoints = Object.values(endpointResults).filter(Boolean).length;
    const totalEndpoints = Object.keys(endpointResults).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyEndpoints === totalEndpoints && totalEndpoints > 0) {
      status = 'healthy';
    } else if (healthyEndpoints > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      latency,
      endpoints: endpointResults,
    };
  }
}

// ===== SINGLETON INSTANCE =====

let apiClientInstance: GenericApiClient | null = null;

/**
 * Gets singleton instance of the generic API client
 */
export function getApiClient(): GenericApiClient {
  if (!apiClientInstance) {
    apiClientInstance = new GenericApiClient();
  }
  return apiClientInstance;
}
