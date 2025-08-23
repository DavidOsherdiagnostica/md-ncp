/**
 * Drug Discovery by Name Tool
 * Primary medication search tool for AI agents
 * Transforms SearchByName API into intelligent medication discovery system
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DiscoverDrugByNameSchema, DiscoverDrugByNameInput, McpResponse } from '../../types/mcp.js';
import { getApiClient } from '../../services/israelDrugsApi.js';
import { getResponseFormatter } from '../../services/responseFormatter.js';
import {
  validateToolInput,
  validateDrugName,
  validatePrescriptionPreference,
  validateHealthBasketPreference,
  validatePageIndex,
} from '../../utils/validators.js';
import { classifyError, createComprehensiveErrorResponse } from '../../utils/errorHandler.js';
import { API_BEHAVIOR, MCP_CONFIG } from '../../config/constants.js';

type ValidatedDiscoverDrugByNameInput = DiscoverDrugByNameInput & {
  search_scope: NonNullable<DiscoverDrugByNameInput['search_scope']>;
};

interface PatientGuidance {
  immediate_actions: string[];
  cost_considerations: string[];
  safety_reminders: string[];
  next_steps: string[];
}

// ===== TOOL REGISTRATION =====

export function registerSearchByNameTool(server: McpServer): void {
  server.registerTool(
    'discover_drug_by_name',
    {
      title: 'Medication Discovery by Name',
      description: `Comprehensive medication search tool that finds detailed information about drugs based on their names. This is the primary tool for medication identification and discovery within the Israeli healthcare system.

**Clinical Purpose:** Essential for medication verification, dosage information, pricing, availability, and therapeutic guidance. Provides complete medication profiles including regulatory status, health basket coverage, and safety information.

**Search Capabilities:**
- Exact medication name matching
- Partial name completion with intelligent suggestions
- Brand name and generic name cross-referencing
- Multi-language support (Hebrew and English)

**Patient Access Considerations:**
- has_prescription: Patient has access to prescription medications
- otc_only: Focus on over-the-counter medications only
- either: Show all available options (recommended for comprehensive view)

**Economic Filtering:**
- budget_conscious: Prioritize medications covered by Israeli health basket
- immediate_availability: Focus on medications available without prescription

**Search Scope Options:**
- exact_match: Precise name matching only
- similar_names: Include variations and similar spellings (recommended)
- broad_search: Comprehensive search including related medications

**Output:** Returns ranked medication list with complete clinical information, pricing, availability status, regulatory details, and therapeutic guidance.

**Clinical Context:** This tool should be used when healthcare providers or patients need comprehensive information about specific medications, including verification of prescriptions, checking alternatives, or understanding cost implications.`,
      inputSchema: DiscoverDrugByNameSchema.shape,
    },
    async (input: DiscoverDrugByNameInput) => {
      const startTime = Date.now();

      try {
        // Validate and process input
        const { data: validatedInput, warnings } = validateToolInput(
          DiscoverDrugByNameSchema,
          input,
          'discover_drug_by_name',
        );

        const validatedDrugByNameInput: ValidatedDiscoverDrugByNameInput = validatedInput as ValidatedDiscoverDrugByNameInput;

        // Sanitize and validate drug name
        const sanitizedQuery = validateDrugName(validatedDrugByNameInput.medication_query);

        // Transform MCP preferences to API format
        const apiRequest = {
          val: sanitizedQuery,
          prescription: validatePrescriptionPreference(
            validatedDrugByNameInput.patient_preferences?.prescription_access || 'either',
          ),
          healthServices: validateHealthBasketPreference(
            validatedDrugByNameInput.patient_preferences?.budget_conscious || false,
          ),
          pageIndex: validatePageIndex(1), // Start with first page
          orderBy: determineOrderBy(validatedDrugByNameInput.search_scope),
        };

        // Execute search with intelligent retry logic
        const searchResults = await executeIntelligentSearch(apiRequest, validatedDrugByNameInput);

        // Format response with clinical intelligence
        const formatter = getResponseFormatter();
        const formattedResponse = formatter.formatDrugSearchResponse(
          searchResults.results || [],
          sanitizedQuery,
          {
            prescriptionAccess: validatedDrugByNameInput.patient_preferences?.prescription_access || 'either',
            healthBasketOnly: validatedDrugByNameInput.patient_preferences?.budget_conscious || false,
            pageIndex: 1,
          },
          startTime,
        );

        // Enhance response with search-specific intelligence
        return enhanceSearchResponse(formattedResponse, validatedDrugByNameInput, warnings);
      } catch (error) {
        const classifiedError = classifyError(error, 'discover_drug_by_name');
        return createComprehensiveErrorResponse(classifiedError, undefined, {
          toolName: 'discover_drug_by_name',
          userInput: input,
          attemptNumber: 1,
        });
      }
    },
  );
}

// ===== INTELLIGENT SEARCH EXECUTION =====

async function executeIntelligentSearch(
  baseRequest: any,
  userInput: ValidatedDiscoverDrugByNameInput,
): Promise<any> {
  const apiClient = getApiClient();

  try {
    // Primary search attempt
    const primaryResult = await apiClient.searchByName(baseRequest);

    // If no results and search scope allows, try broader search
    if (
      (!primaryResult.results || primaryResult.results.length === 0) &&
      userInput.search_scope !== 'exact_match'
    ) {
      // console.info('Primary search returned no results, attempting broader search');
      return await executeBroaderSearch(baseRequest, userInput);
    }

    // If too many results, suggest refinement
    if (
      primaryResult.results &&
      primaryResult.results.length > MCP_CONFIG.RESPONSE_LIMITS.MAX_SEARCH_RESULTS
    ) {
      // console.warn(`Search returned ${primaryResult.results.length} results, may need refinement`);
    }

    return primaryResult;
  } catch (error) {
    // console.error('Primary search failed:', error);

    // Attempt recovery with modified parameters if appropriate
    if (userInput.search_scope === 'broad_search') {
      return await attemptRecoverySearch(baseRequest, userInput);
    }

    throw error;
  }
}

async function executeBroaderSearch(
  baseRequest: any,
  userInput: ValidatedDiscoverDrugByNameInput,
): Promise<any> {
  const apiClient = getApiClient();

  // Try with different prescription filter (inverted logic!)
  const broaderRequest = {
    ...baseRequest,
    prescription: !baseRequest.prescription, // Flip the prescription logic
  };

  try {
    const broaderResult = await apiClient.searchByName(broaderRequest);

    if (broaderResult.results && broaderResult.results.length > 0) {
      // console.info(`Broader search found ${broaderResult.results.length} results`);
      return broaderResult;
    }

    // Still no results - try health basket variation
    const healthBasketRequest = {
      ...baseRequest,
      healthServices: !baseRequest.healthServices,
    };

    return await apiClient.searchByName(healthBasketRequest);
  } catch (error) {
    // console.error('Broader search also failed:', error);
    throw error;
  }
}

async function attemptRecoverySearch(
  baseRequest: any,
  userInput: ValidatedDiscoverDrugByNameInput,
): Promise<any> {
  const apiClient = getApiClient();

  // Try with minimal filters for maximum results
  const recoveryRequest = {
    val: baseRequest.val,
    prescription: API_BEHAVIOR.PRESCRIPTION_LOGIC.ALL_DRUGS, // Show all drugs
    healthServices: false, // Don't filter by health basket
    pageIndex: 1,
    orderBy: 0,
  };

  try {
    // console.info('Attempting recovery search with minimal filters');
    return await apiClient.searchByName(recoveryRequest);
  } catch (error) {
    // console.error('Recovery search failed:', error);
    throw error;
  }
}

// ===== HELPER FUNCTIONS =====

function determineOrderBy(searchScope: 'exact_match' | 'similar_names' | 'broad_search'): number {
  switch (searchScope) {
    case 'exact_match':
      return 0; // Default ordering for precise matches
    case 'similar_names':
      return 1; // Alternative ordering for similarity
    case 'broad_search':
      return 5; // Popularity-based ordering
    default:
      return 0;
  }
}

function enhanceSearchResponse(
  baseResponse: any,
  userInput: ValidatedDiscoverDrugByNameInput,
  validationWarnings: string[],
): McpResponse<any> {
  // Add search-specific enhancements
  const enhancedResponse = {
    ...baseResponse,
    data: {
      ...baseResponse.data,
      search_parameters: {
        original_query: userInput.medication_query,
        prescription_access: userInput.patient_preferences?.prescription_access || 'either',
        budget_conscious: userInput.patient_preferences?.budget_conscious || false,
        immediate_availability: userInput.patient_preferences?.immediate_availability || false,
        search_scope: userInput.search_scope || 'similar_names',
      },
      search_intelligence: generateSearchIntelligence(baseResponse.data, userInput),
      patient_guidance: generatePatientGuidance(baseResponse.data, userInput),
    },
  };

  // Add validation warnings if any
  if (validationWarnings.length > 0) {
    enhancedResponse.warnings = [...(enhancedResponse.warnings || []), ...validationWarnings];
  }

  // Enhance next actions based on results
  enhancedResponse.next_suggested_actions = enhanceNextActions(
    baseResponse.next_suggested_actions || [],
    baseResponse.data,
    userInput,
  );

  return enhancedResponse;
}

function generateSearchIntelligence(
  searchData: any,
  userInput: ValidatedDiscoverDrugByNameInput,
): Record<string, unknown> {
  const drugs = searchData.drugs || [];

  return {
    result_analysis: {
      total_found: drugs.length,
      exact_matches: drugs.filter(
        (d: any) =>
          d.hebrewName.toLowerCase().includes(userInput.medication_query.toLowerCase()) ||
          d.englishName.toLowerCase().includes(userInput.medication_query.toLowerCase()),
      ).length,
      prescription_breakdown: {
        prescription_required: drugs.filter((d: any) => d.requiresPrescription).length,
        otc_available: drugs.filter((d: any) => !d.requiresPrescription).length,
      },
      cost_analysis: {
        health_basket_covered: drugs.filter((d: any) => d.inHealthBasket).length,
        full_cost_medications: drugs.filter((d: any) => !d.inHealthBasket).length,
        average_price: calculateAveragePrice(drugs),
      },
      availability_status: {
        active_medications: drugs.filter((d: any) => d.isActive).length,
        discontinued_medications: drugs.filter((d: any) => !d.isActive).length,
      },
    },
    search_effectiveness: assessSearchEffectiveness(drugs, userInput),
    refinement_suggestions: generateRefinementSuggestions(drugs, userInput),
  };
}

function generatePatientGuidance(
  searchData: any,
  userInput: ValidatedDiscoverDrugByNameInput,
): PatientGuidance {
  const drugs = searchData.drugs || [];
  const guidance: PatientGuidance = {
    immediate_actions: [],
    cost_considerations: [],
    safety_reminders: [],
    next_steps: [],
  };

  // Immediate actions based on results
  if (drugs.length === 0) {
    guidance.immediate_actions = [
      'No medications found with the provided name',
      'Verify spelling and try alternative search approaches',
      'Consider searching by medical condition or symptom',
    ];
  } else if (drugs.length === 1) {
    guidance.immediate_actions = [
      'Single medication match found',
      'Verify this is the intended medication with healthcare provider',
      'Review dosage and administration instructions carefully',
    ];
  } else {
    guidance.immediate_actions = [
      `${drugs.length} similar medications found`,
      'Compare options carefully to identify correct medication',
      'Pay attention to dosage strengths and formulations',
    ];
  }

  // Cost considerations
  const basketCovered = drugs.filter((d: any) => d.inHealthBasket).length;
  const totalCost = drugs.filter((d: any) => !d.inHealthBasket).length;

  if (basketCovered > 0 && totalCost > 0) {
    guidance.cost_considerations = [
      `${basketCovered} medications covered by health basket`,
      `${totalCost} medications require full payment`,
      'Consider health basket options for cost savings',
    ];
  } else if (userInput.patient_preferences?.budget_conscious) {
    guidance.cost_considerations = [
      'Budget-conscious search applied',
      'Results prioritize health basket covered medications',
      'Consult pharmacist about generic alternatives',
    ];
  }

  // Safety reminders
  const prescriptionCount = drugs.filter((d: any) => d.requiresPrescription).length;
  const discontinuedCount = drugs.filter((d: any) => !d.isActive).length;

  if (prescriptionCount > 0) {
    guidance.safety_reminders.push('Some medications require prescription and medical supervision');
  }

  if (discontinuedCount > 0) {
    guidance.safety_reminders.push('Some medications in results are discontinued');
  }

  guidance.safety_reminders.push(
    'Always verify medication information with healthcare professionals',
  );

  // Next steps
  if (drugs.length > 0) {
    guidance.next_steps = [
      'Use detailed information tools for specific medications',
      'Compare therapeutic alternatives if multiple options exist',
      'Verify current availability status before obtaining medication',
    ];
  } else {
    guidance.next_steps = [
      'Try alternative search strategies (symptom-based, category-based)',
      'Use name suggestion tools for spelling assistance',
      'Consult healthcare provider for proper medication identification',
    ];
  }

  return guidance;
}

function calculateAveragePrice(drugs: any[]): number | null {
  const pricesWithValues = drugs
    .map((d) => d.maxPrice)
    .filter((price): price is number => price !== null && price > 0);

  if (pricesWithValues.length === 0) return null;

  const total = pricesWithValues.reduce((sum, price) => sum + price, 0);
  return Math.round((total / pricesWithValues.length) * 100) / 100;
}

function assessSearchEffectiveness(
  drugs: any[],
  userInput: ValidatedDiscoverDrugByNameInput,
): 'highly_effective' | 'moderately_effective' | 'low_effectiveness' | 'ineffective' {
  if (drugs.length === 0) return 'ineffective';
  if (drugs.length === 1) return 'highly_effective';
  if (drugs.length <= 5) return 'highly_effective';
  if (drugs.length <= 15) return 'moderately_effective';
  return 'low_effectiveness';
}

function generateRefinementSuggestions(drugs: any[], userInput: ValidatedDiscoverDrugByNameInput): string[] {
  const suggestions: string[] = [];

  if (drugs.length === 0) {
    suggestions.push('Try partial name search using autocomplete tool');
    suggestions.push('Search by therapeutic category or symptom');
    suggestions.push('Verify medication name spelling and language');
  } else if (drugs.length > 20) {
    suggestions.push('Add prescription requirement filter');
    suggestions.push('Filter by health basket coverage');
    suggestions.push('Specify dosage form or administration route');
  }

  const hasMultipleManufacturers = new Set(drugs.map((d: any) => d.manufacturer)).size > 1;
  if (hasMultipleManufacturers) {
    suggestions.push('Consider manufacturer preferences for generic medications');
  }

  const hasPriceVariation =
    drugs.some((d: any) => d.maxPrice !== null) && drugs.some((d: any) => d.maxPrice === null);
  if (hasPriceVariation) {
    suggestions.push('Review pricing information for cost-effective options');
  }

  return suggestions;
}

function enhanceNextActions(
  baseActions: any[],
  searchData: any,
  userInput: ValidatedDiscoverDrugByNameInput,
): any[] {
  const enhancedActions = [...baseActions];
  const drugs = searchData.drugs || [];

  // Add search-specific actions based on results
  if (drugs.length === 0) {
    enhancedActions.unshift({
      tool: 'suggest_drug_names',
      reason: 'Get accurate spelling suggestions for medication name',
      parameters_hint: `partial_name: "${userInput.medication_query}"`,
    });
  }

  if (drugs.length > 1) {
    enhancedActions.push({
      tool: 'explore_generic_alternatives',
      reason: 'Compare therapeutic alternatives and generic options',
      parameters_hint: 'Use active ingredients from search results',
    });
  }

  if (userInput.patient_preferences?.budget_conscious) {
    enhancedActions.push({
      tool: 'analyze_basket_coverage',
      reason: 'Detailed cost analysis for budget planning',
      parameters_hint: 'Include medication names from search results',
    });
  }

  return enhancedActions;
}
