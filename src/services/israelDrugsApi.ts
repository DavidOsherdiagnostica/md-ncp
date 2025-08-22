/**
 * Israel Drugs API Client Service
 * Handles all communication with the Ministry of Health drugs database
 * Implements retry logic, error handling, and response validation
 */

import fetch from 'node-fetch';
import {
  AutocompleteRequest,
  AutocompleteResponse,
  SearchByNameRequest,
  SearchByNameResponse,
  SearchBySymptomRequest,
  SearchBySymptomResponse,
  SearchGenericRequest,
  SearchGenericResponse,
  GetSpecificDrugRequest,
  GetSpecificDrugResponse,
  GetBySymptomRequest,
  GetBySymptomResponse,
  GetFastSearchPopularSymptomsRequest,
  GetFastSearchPopularSymptomsResponse,
  GetAtcListResponse,
  GetPackageListResponse,
  GetMatanListResponse
} from '../types/api.js';
import { IsraelDrugsError, ErrorType, ErrorSeverity } from '../types/errors.js';
import { API_CONFIG, REQUEST_CONFIG, ERROR_CONFIG } from '../config/constants.js';
import { classifyError, logError } from '../utils/errorHandler.js';

// ===== API CLIENT CLASS =====

export class IsraelDrugsApiClient {
  private readonly baseUrl: string;
  private readonly imagesBaseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.imagesBaseUrl = API_CONFIG.IMAGES_BASE_URL;
    this.timeout = REQUEST_CONFIG.TIMEOUT_MS;
    this.maxRetries = REQUEST_CONFIG.RETRY_ATTEMPTS;
    this.retryDelay = REQUEST_CONFIG.RETRY_DELAY_MS;
  }

  // ===== CORE HTTP METHODS =====

  /**
   * Makes a POST request to the API with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    body: Record<string, unknown>,
    attemptNumber = 1
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
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      
      if (!responseText.trim()) {
        throw new IsraelDrugsError(
          ErrorType.API_INVALID_RESPONSE,
          'API returned empty response',
          {
            severity: ErrorSeverity.HIGH,
            correlationId,
            details: { endpoint, body }
          }
        );
      }

      try {
        return JSON.parse(responseText) as T;
      } catch (parseError) {
        throw new IsraelDrugsError(
          ErrorType.API_INVALID_RESPONSE,
          'API returned invalid JSON',
          {
            severity: ErrorSeverity.HIGH,
            correlationId,
            details: { endpoint, body, responseText: responseText.substring(0, 200) }
          }
        );
      }

    } catch (error) {
      const classifiedError = classifyError(error, `${endpoint} - attempt ${attemptNumber}`);
      classifiedError.correlationId = correlationId;

      // Log the error
      logError(classifiedError, `API request to ${endpoint}`);

      // Retry logic for recoverable errors
      if (attemptNumber < this.maxRetries && this.shouldRetry(classifiedError)) {
        console.warn(`Retrying ${endpoint} - attempt ${attemptNumber + 1}/${this.maxRetries}`);
        await this.delay(this.retryDelay * attemptNumber);
        return this.makeRequest<T>(endpoint, body, attemptNumber + 1);
      }

      throw classifiedError;
    }
  }

  /**
   * Makes a GET request for images
   */
  async getImageUrl(imageName: string): Promise<string> {
    if (!imageName || imageName.trim() === '') {
      throw new IsraelDrugsError(
        ErrorType.INVALID_INPUT,
        'Image name cannot be empty',
        {
          severity: ErrorSeverity.LOW,
          suggestions: ['Provide a valid image filename from drug details']
        }
      );
    }

    return `${this.imagesBaseUrl}/${imageName.trim()}`;
  }

  // ===== API ENDPOINT METHODS =====

  /**
   * SearchBoxAutocomplete - Get autocomplete suggestions for drug names
   */
  async searchBoxAutocomplete(request: AutocompleteRequest): Promise<AutocompleteResponse> {
    this.validateAutocompleteRequest(request);
    return this.makeRequest<AutocompleteResponse>(
      API_CONFIG.ENDPOINTS.SEARCH_BOX_AUTOCOMPLETE,
      request
    );
  }

  /**
   * SearchByName - Search drugs by name with filtering options
   */
  async searchByName(request: SearchByNameRequest): Promise<SearchByNameResponse> {
    this.validateSearchByNameRequest(request);
    return this.makeRequest<SearchByNameResponse>(
      API_CONFIG.ENDPOINTS.SEARCH_BY_NAME,
      request
    );
  }

  /**
   * SearchBySymptom - Find drugs for specific symptoms
   */
  async searchBySymptom(request: SearchBySymptomRequest): Promise<SearchBySymptomResponse> {
    this.validateSearchBySymptomRequest(request);
    return this.makeRequest<SearchBySymptomResponse>(
      API_CONFIG.ENDPOINTS.SEARCH_BY_SYMPTOM,
      request
    );
  }

  /**
   * SearchGeneric - Advanced search by ATC codes, routes, packages
   */
  async searchGeneric(request: SearchGenericRequest): Promise<SearchGenericResponse> {
    this.validateSearchGenericRequest(request);
    return this.makeRequest<SearchGenericResponse>(
      API_CONFIG.ENDPOINTS.SEARCH_GENERIC,
      request
    );
  }

  /**
   * GetSpecificDrug - Get comprehensive drug information
   */
  async getSpecificDrug(request: GetSpecificDrugRequest): Promise<GetSpecificDrugResponse> {
    this.validateGetSpecificDrugRequest(request);
    return this.makeRequest<GetSpecificDrugResponse>(
      API_CONFIG.ENDPOINTS.GET_SPECIFIC_DRUG,
      request
    );
  }

  /**
   * GetBySymptom - Get complete symptom hierarchy
   */
  async getBySymptom(request: GetBySymptomRequest): Promise<GetBySymptomResponse> {
    return this.makeRequest<GetBySymptomResponse>(
      API_CONFIG.ENDPOINTS.GET_BY_SYMPTOM,
      request
    );
  }

  /**
   * GetFastSearchPopularSymptoms - Get most popular symptoms
   */
  async getFastSearchPopularSymptoms(
    request: GetFastSearchPopularSymptomsRequest
  ): Promise<GetFastSearchPopularSymptomsResponse> {
    this.validatePopularSymptomsRequest(request);
    return this.makeRequest<GetFastSearchPopularSymptomsResponse>(
      API_CONFIG.ENDPOINTS.GET_FAST_SEARCH_POPULAR_SYMPTOMS,
      request
    );
  }

  /**
   * GetAtcList - Get all ATC therapeutic codes
   */
  async getAtcList(): Promise<GetAtcListResponse> {
    return this.makeRequest<GetAtcListResponse>(
      API_CONFIG.ENDPOINTS.GET_ATC_LIST,
      {}
    );
  }

  /**
   * GetPackageList - Get all package types
   */
  async getPackageList(): Promise<GetPackageListResponse> {
    return this.makeRequest<GetPackageListResponse>(
      API_CONFIG.ENDPOINTS.GET_PACKAGE_LIST,
      {}
    );
  }

  /**
   * GetMatanList - Get all administration routes
   */
  async getMatanList(): Promise<GetMatanListResponse> {
    return this.makeRequest<GetMatanListResponse>(
      API_CONFIG.ENDPOINTS.GET_MATAN_LIST,
      {}
    );
  }

  // ===== VALIDATION METHODS =====

  private validateAutocompleteRequest(request: AutocompleteRequest): void {
    if (!request.val || request.val.trim().length === 0) {
      throw new IsraelDrugsError(
        ErrorType.INVALID_INPUT,
        'Search value cannot be empty',
        {
          severity: ErrorSeverity.LOW,
          suggestions: ['Provide at least one character to search']
        }
      );
    }

    if (request.val.length > 100) {
      throw new IsraelDrugsError(
        ErrorType.INVALID_INPUT,
        'Search value too long',
        {
          severity: ErrorSeverity.LOW,
          suggestions: ['Limit search to 100 characters or less']
        }
      );
    }
  }

  private validateSearchByNameRequest(request: SearchByNameRequest): void {
    if (!request.val || request.val.trim().length === 0) {
      throw new IsraelDrugsError(
        ErrorType.INVALID_INPUT,
        'Drug name cannot be empty',
        {
          severity: ErrorSeverity.MEDIUM,
          suggestions: [
            'Provide a drug name to search for',
            'Use autocomplete to get exact drug names'
          ]
        }
      );
    }

    if (request.pageIndex < 1) {
      throw new IsraelDrugsError(
        ErrorType.INVALID_INPUT,
        'Page index must start from 1',
        {
          severity: ErrorSeverity.LOW,
          suggestions: ['Use pageIndex >= 1 (API uses 1-based indexing)']
        }
      );
    }
  }

  private validateSearchBySymptomRequest(request: SearchBySymptomRequest): void {
    if (!request.primarySymp || !request.secondarySymp) {
      throw new IsraelDrugsError(
        ErrorType.INVALID_SYMPTOM_CATEGORY,
        'Both primary and secondary symptom must be provided',
        {
          severity: ErrorSeverity.MEDIUM,
          suggestions: [
            'Use GetBySymptom to get valid symptom categories',
            'Ensure both primarySymp and secondarySymp are specified'
          ]
        }
      );
    }

    if (request.pageIndex < 1) {
      throw new IsraelDrugsError(
        ErrorType.INVALID_INPUT,
        'Page index must start from 1',
        {
          severity: ErrorSeverity.LOW,
          suggestions: ['Use pageIndex >= 1 (API uses 1-based indexing)']
        }
      );
    }
  }

  private validateSearchGenericRequest(request: SearchGenericRequest): void {
    // Validate ATC code format if provided
    if (request.atcId && request.atcId.length !== 4) {
      throw new IsraelDrugsError(
        ErrorType.INVALID_ATC_CODE,
        'ATC code must be exactly 4 characters (level 4 only)',
        {
          severity: ErrorSeverity.MEDIUM,
          suggestions: [
            'Use 4-character ATC codes only (e.g., "N02BE")',
            'Level 5 codes (6 characters) are not supported',
            'Get valid ATC codes from GetAtcList endpoint'
          ]
        }
      );
    }

    if (request.pageIndex < 1) {
      throw new IsraelDrugsError(
        ErrorType.INVALID_INPUT,
        'Page index must start from 1',
        {
          severity: ErrorSeverity.LOW,
          suggestions: ['Use pageIndex >= 1 (API uses 1-based indexing)']
        }
      );
    }

    // Warn if no search criteria provided
    if (!request.val && !request.atcId && !request.matanId && !request.packageId) {
      throw new IsraelDrugsError(
        ErrorType.INVALID_INPUT,
        'At least one search criterion must be provided',
        {
          severity: ErrorSeverity.MEDIUM,
          suggestions: [
            'Provide at least one of: val, atcId, matanId, or packageId',
            'Use specific criteria to avoid overwhelming results'
          ]
        }
      );
    }
  }

  private validateGetSpecificDrugRequest(request: GetSpecificDrugRequest): void {
    const regNumPattern = /^\d{3}\s\d{2}\s\d{5}\s\d{2}$/;
    
    if (!request.dragRegNum || !regNumPattern.test(request.dragRegNum)) {
      throw new IsraelDrugsError(
        ErrorType.INVALID_DRUG_REGISTRATION,
        'Invalid drug registration number format',
        {
          severity: ErrorSeverity.MEDIUM,
          suggestions: [
            'Use format: XXX XX XXXXX XX (e.g., "020 16 20534 00")',
            'Get registration numbers from search results',
            'Verify the number from official sources'
          ]
        }
      );
    }
  }

  private validatePopularSymptomsRequest(request: GetFastSearchPopularSymptomsRequest): void {
    if (request.rowCount < 1 || request.rowCount > 100) {
      throw new IsraelDrugsError(
        ErrorType.INVALID_INPUT,
        'Row count must be between 1 and 100',
        {
          severity: ErrorSeverity.LOW,
          suggestions: ['Use rowCount between 1 and 100']
        }
      );
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Determines if an error should trigger a retry
   */
  private shouldRetry(error: IsraelDrugsError): boolean {
    const retryableTypes = [
      ErrorType.API_TIMEOUT,
      ErrorType.API_CONNECTION_ERROR,
      ErrorType.API_RATE_LIMIT
    ];
    
    return retryableTypes.includes(error.type);
  }

  /**
   * Delays execution for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generates correlation ID for request tracking
   */
  private generateCorrelationId(): string {
    return `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ===== HEALTH CHECK =====

  /**
   * Performs health check on the API
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    endpoints: Record<string, boolean>;
  }> {
    const startTime = Date.now();
    const endpointResults: Record<string, boolean> = {};

    try {
      // Test basic functionality with ATC list (should be fast and reliable)
      await this.getAtcList();
      endpointResults.atc_list = true;
    } catch {
      endpointResults.atc_list = false;
    }

    try {
      // Test search functionality
      await this.searchByName({
        val: 'test',
        prescription: false,
        healthServices: false,
        pageIndex: 1,
        orderBy: 0
      });
      endpointResults.search = true;
    } catch {
      endpointResults.search = false;
    }

    const latency = Date.now() - startTime;
    const healthyEndpoints = Object.values(endpointResults).filter(Boolean).length;
    const totalEndpoints = Object.keys(endpointResults).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyEndpoints === totalEndpoints) {
      status = 'healthy';
    } else if (healthyEndpoints > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      latency,
      endpoints: endpointResults
    };
  }
}

// ===== SINGLETON INSTANCE =====

let apiClientInstance: IsraelDrugsApiClient | null = null;

/**
 * Gets singleton instance of the API client
 */
export function getApiClient(): IsraelDrugsApiClient {
  if (!apiClientInstance) {
    apiClientInstance = new IsraelDrugsApiClient();
  }
  return apiClientInstance;
}