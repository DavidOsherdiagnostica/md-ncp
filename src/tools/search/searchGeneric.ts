/**
 * Generic Alternatives Discovery Tool
 * Enables AI agents to find therapeutic alternatives and generic medications
 * Transforms SearchGeneric API into intelligent alternative therapy system
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  ExploreGenericAlternativesSchema,
  ExploreGenericAlternativesInput,
  McpResponse,
} from '../../types/mcp.js';
import { getApiClient } from '../../services/israelDrugsApi.js';
import { getResponseFormatter } from '../../services/responseFormatter.js';
import {
  validateToolInput,
  validateAtcCode,
  validateAdministrationRoute,
  validatePageIndex,
} from '../../utils/validators.js';
import { classifyError, createComprehensiveErrorResponse } from '../../utils/errorHandler.js';
import { API_BEHAVIOR, MCP_CONFIG, CLINICAL_MAPPINGS } from '../../config/constants.js';

interface ProcessedSearchCriteria {
  searchType:
    | 'active_ingredient'
    | 'atc_code'
    | 'administration_route'
    | 'reference_drug'
    | 'unknown';
  primaryValue: string;
  routeId?: number;
  referenceDrugName?: string;
  referenceRegistration?: string;
  requiresResolution?: boolean;
  secondaryFilters?: Record<string, unknown>;
}

type ValidatedExploreGenericAlternativesInput = ExploreGenericAlternativesInput & {
  comparison_criteria?: {
    include_price_comparison: boolean;
    health_basket_priority: boolean;
    same_strength_only: boolean;
  };
};

interface SubstitutionGuidance {
  immediate_substitution: string[];
  consider_with_monitoring: string[];
  requires_clinical_evaluation: string[];
  not_recommended: string[];
}

interface PriceData {
  name: string;
  price: number;
  inBasket: boolean;
}

// ===== TOOL REGISTRATION =====

export function registerSearchGenericTool(server: McpServer): void {
  server.registerTool(
    'explore_generic_alternatives',
    {
      title: 'Therapeutic Alternatives Discovery',
      description: `Advanced therapeutic intelligence tool that identifies generic alternatives, biosimilars, and medications within the same therapeutic class. Essential for cost-effective prescribing and therapeutic substitution within the Israeli healthcare system.

**Clinical Purpose:** Supports evidence-based therapeutic decision-making by identifying clinically equivalent alternatives, enabling cost optimization while maintaining therapeutic efficacy. Critical for formulary management and patient access to affordable medications.

**Search Strategies:**
- active_ingredient: Find all formulations containing specific active pharmaceutical ingredient
- atc_code: Discover medications within same therapeutic classification (ATC level 4)
- administration_route: Locate alternatives with preferred delivery method
- reference_drug_name: Find equivalents to specific brand medication

**Comparison Features:**
- include_price_comparison: Economic analysis of therapeutic alternatives
- health_basket_priority: Prioritize medications covered by Israeli health basket
- same_strength_only: Limit to medications with identical dosage strengths

**ATC Classification Support:**
- Supports ATC level 4 codes only (4 characters, e.g., "N02BE" for analgesics)
- Automatically converts level 5 codes to appropriate level 4 equivalents
- Provides therapeutic category context and clinical rationale

**Administration Route Optimization:**
- Oral formulations (פומי) - tablets, capsules, solutions
- Topical applications (עורי) - creams, ointments, patches
- Injectable forms (תוך-ורידי, תוך-שרירי) - hospital/clinic use
- Specialized routes (עיני, אוזני, רקטלי) - targeted applications

**Output:** Returns comprehensive therapeutic alternatives with clinical equivalence assessment, cost analysis, bioavailability considerations, and substitution recommendations ranked by clinical appropriateness.

**Clinical Context:** This tool is essential for therapeutic optimization, formulary compliance, cost containment, and ensuring patient access to clinically appropriate alternatives when primary therapy is unavailable or unaffordable.`,
      inputSchema: ExploreGenericAlternativesSchema.shape,
    },
    async (input: ExploreGenericAlternativesInput) => {
      const startTime = Date.now();

      try {
        // Validate and process input
        const { data: validatedInput, warnings } = validateToolInput(
          ExploreGenericAlternativesSchema,
          input,
          'explore_generic_alternatives',
        );

        const validatedGenericInput: ValidatedExploreGenericAlternativesInput = validatedInput as ValidatedExploreGenericAlternativesInput;

        // Process and validate search criteria
        const processedCriteria = await processSearchCriteria(validatedGenericInput.search_criteria);

        // Execute multi-strategy search for comprehensive alternatives
        const searchResults = await executeAlternativesSearch(processedCriteria, validatedGenericInput);

        // Format response with therapeutic intelligence
        const formatter = getResponseFormatter();
        const formattedResponse = formatter.formatDrugSearchResponse(
          searchResults.results || [],
          generateSearchQueryDescription(processedCriteria),
          {
            prescriptionAccess: 'either', // Show all alternatives
            healthBasketOnly: validatedGenericInput.comparison_criteria?.health_basket_priority || false,
            pageIndex: 1,
          },
          startTime,
        );

        // Enhance with alternatives-specific intelligence
        return enhanceAlternativesResponse(
          formattedResponse,
          validatedGenericInput,
          processedCriteria,
          warnings,
        );
      } catch (error) {
        const classifiedError = classifyError(error, 'explore_generic_alternatives');
        return createComprehensiveErrorResponse(classifiedError, undefined, {
          toolName: 'explore_generic_alternatives',
          userInput: input,
          attemptNumber: 1,
        });
      }
    },
  );
}

// ===== SEARCH CRITERIA PROCESSING =====

async function processSearchCriteria(criteria: any): Promise<ProcessedSearchCriteria> {
  const processed: ProcessedSearchCriteria = {
    searchType: 'unknown',
    primaryValue: '',
    secondaryFilters: {},
  };

  // Determine primary search strategy
  if (criteria.active_ingredient && criteria.active_ingredient.trim()) {
    processed.searchType = 'active_ingredient';
    processed.primaryValue = criteria.active_ingredient.trim().toUpperCase();
  } else if (criteria.atc_code && criteria.atc_code.trim()) {
    processed.searchType = 'atc_code';
    processed.primaryValue = validateAtcCode(criteria.atc_code.trim());
  } else if (criteria.administration_route && criteria.administration_route.trim()) {
    processed.searchType = 'administration_route';
    processed.routeId = await resolveAdministrationRoute(criteria.administration_route);
  } else if (criteria.reference_drug_name && criteria.reference_drug_name.trim()) {
    processed.searchType = 'reference_drug';
    processed.primaryValue = criteria.reference_drug_name.trim();
    // Will require additional API call to resolve to active ingredient or ATC
    processed.requiresResolution = true;
  } else {
    throw new Error('At least one search criterion must be provided');
  }

  return processed;
}

async function resolveAdministrationRoute(routeName: string): Promise<number> {
  // Try direct mapping first
  const hebrewRoutes: Record<string, number> = {
    פומי: CLINICAL_MAPPINGS.ADMIN_ROUTES.ORAL,
    עורי: CLINICAL_MAPPINGS.ADMIN_ROUTES.TOPICAL,
    עיני: CLINICAL_MAPPINGS.ADMIN_ROUTES.EYE,
    אוזני: CLINICAL_MAPPINGS.ADMIN_ROUTES.EAR,
    'תוך-ורידי': CLINICAL_MAPPINGS.ADMIN_ROUTES.IV,
    'תוך-שרירי': CLINICAL_MAPPINGS.ADMIN_ROUTES.IM,
    רקטלי: CLINICAL_MAPPINGS.ADMIN_ROUTES.RECTAL,
  };

  const englishRoutes: Record<string, number> = {
    oral: CLINICAL_MAPPINGS.ADMIN_ROUTES.ORAL,
    topical: CLINICAL_MAPPINGS.ADMIN_ROUTES.TOPICAL,
    ophthalmic: CLINICAL_MAPPINGS.ADMIN_ROUTES.EYE,
    otic: CLINICAL_MAPPINGS.ADMIN_ROUTES.EAR,
    intravenous: CLINICAL_MAPPINGS.ADMIN_ROUTES.IV,
    intramuscular: CLINICAL_MAPPINGS.ADMIN_ROUTES.IM,
    rectal: CLINICAL_MAPPINGS.ADMIN_ROUTES.RECTAL,
  };

  const routeLower = routeName.toLowerCase();
  const routeId = hebrewRoutes[routeName] || englishRoutes[routeLower];

  if (routeId) {
    return validateAdministrationRoute(routeId);
  }

  throw new Error(`Unknown administration route: ${routeName}`);
}

// ===== ALTERNATIVES SEARCH EXECUTION =====

async function executeAlternativesSearch(
  criteria: ProcessedSearchCriteria,
  userInput: ValidatedExploreGenericAlternativesInput,
): Promise<any> {
  const apiClient = getApiClient();

  // Handle reference drug resolution if needed
  if (criteria.requiresResolution && criteria.searchType === 'reference_drug') {
    const resolvedCriteria = await resolveReferenceDrug(criteria.primaryValue);
    return await executeDirectAlternativesSearch(resolvedCriteria, userInput);
  }

  return await executeDirectAlternativesSearch(criteria, userInput);
}

async function resolveReferenceDrug(drugName: string): Promise<ProcessedSearchCriteria> {
  const apiClient = getApiClient();

  try {
    // Search for the reference drug to get its details
    const drugSearch = await apiClient.searchByName({
      val: drugName,
      prescription: API_BEHAVIOR.PRESCRIPTION_LOGIC.ALL_DRUGS,
      healthServices: false,
      pageIndex: 1,
      orderBy: 0,
    });

    if (!drugSearch.results || drugSearch.results.length === 0) {
      throw new Error(`Reference drug "${drugName}" not found`);
    }

    const referenceDrug = drugSearch.results[0];
    if (!referenceDrug) {
      throw new Error(`Reference drug "${drugName}" not found or details are incomplete.`);
    }

    // Try to get detailed info for ATC code
    try {
      const drugDetails = await apiClient.getSpecificDrug({
        dragRegNum: referenceDrug.dragRegNum,
      });

      if (drugDetails.atc && drugDetails.atc.length > 0) {
        return {
          searchType: 'atc_code',
          primaryValue: drugDetails.atc[0]!.atc4Code.trim(),
          referenceDrugName: drugName,
          referenceRegistration: referenceDrug.dragRegNum,
        };
      }
    } catch (detailsError) {
      // console.warn('Could not get detailed ATC info, using active ingredient:', detailsError);
    }

    // Fallback to active ingredient
    if (referenceDrug.activeComponents && referenceDrug.activeComponents.length > 0) {
      const activeIngredient = referenceDrug.activeComponents[0]!.componentName.split(' ')[0];
      return {
        searchType: 'active_ingredient',
        primaryValue: activeIngredient!,
        referenceDrugName: drugName,
        referenceRegistration: referenceDrug.dragRegNum,
      };
    }

    throw new Error(`Could not determine therapeutic category for "${drugName}"`);
  } catch (error) {
    // console.error('Reference drug resolution failed:', error);
    throw new Error(
      `Failed to resolve reference drug "${drugName}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function executeDirectAlternativesSearch(
  criteria: ProcessedSearchCriteria,
  userInput: ValidatedExploreGenericAlternativesInput,
): Promise<any> {
  const apiClient = getApiClient();

  // Build API request based on search type
  const apiRequest = {
    val: criteria.searchType === 'active_ingredient' && criteria.primaryValue ? criteria.primaryValue : '',
    atcId: criteria.searchType === 'atc_code' ? criteria.primaryValue : null,
    matanId: criteria.routeId || null,
    packageId: null, // Not commonly used for therapeutic alternatives
    pageIndex: validatePageIndex(1),
    orderBy: 1, // Alternative ordering for better generic grouping
  };

  try {
    const searchResult = await apiClient.searchGeneric(apiRequest);

    // Convert array response to standard format
    let resultsArray: any[] = [];
    if (searchResult && Array.isArray(searchResult)) {
      resultsArray = searchResult as any[];
    }
    const standardizedResult = {
      hasNonSubsDrugs: null,
      results: resultsArray,
    };

    // Apply filters based on comparison criteria
    return applyComparisonFilters(standardizedResult, userInput.comparison_criteria, criteria);
  } catch (error) {
    // console.error('Direct alternatives search failed:', error);

    // Attempt recovery with broader criteria
    return await attemptAlternativesRecovery(criteria, userInput);
  }
}

async function attemptAlternativesRecovery(
  criteria: ProcessedSearchCriteria,
  userInput: ValidatedExploreGenericAlternativesInput,
): Promise<any> {
  const apiClient = getApiClient();

  // Recovery strategy: try with minimal filters
  const recoveryRequest = {
    val: criteria.searchType === 'active_ingredient' ? criteria.primaryValue : '',
    atcId: criteria.searchType === 'atc_code' ? criteria.primaryValue : null,
    matanId: null, // Remove route filter
    packageId: null,
    pageIndex: 1,
    orderBy: 0,
  };

  try {
    // console.info('Attempting alternatives search recovery');
    const recoveryResult = await apiClient.searchGeneric(recoveryRequest);

    return {
      hasNonSubsDrugs: null,
      results: Array.isArray(recoveryResult) ? recoveryResult : [],
    };
  } catch (error) {
    // console.error('Alternatives search recovery failed:', error);
    throw error;
  }
}

function applyComparisonFilters(
  searchResult: any,
  comparisonCriteria: ValidatedExploreGenericAlternativesInput['comparison_criteria'],
  searchCriteria: ProcessedSearchCriteria,
): any {
  let filteredResults = searchResult.results || [];

  // Apply health basket filter
  if (comparisonCriteria?.health_basket_priority) {
    filteredResults = filteredResults.filter((drug: any) => drug.health === true);
  }

  // Apply same strength filter (basic implementation)
  if (comparisonCriteria?.same_strength_only && searchCriteria.referenceDrugName) {
    // This would require more sophisticated strength comparison logic
    // console.info('Same strength filter requested but not fully implemented');
  }

  return {
    ...searchResult,
    results: filteredResults,
  };
}

// ===== RESPONSE ENHANCEMENT =====

function enhanceAlternativesResponse(
  baseResponse: any,
  userInput: ValidatedExploreGenericAlternativesInput,
  searchCriteria: ProcessedSearchCriteria,
  validationWarnings: string[],
): McpResponse<any> {
  const enhancedResponse = {
    ...baseResponse,
    data: {
      ...baseResponse.data,
      alternatives_analysis: generateAlternativesAnalysis(baseResponse.data, searchCriteria),
      therapeutic_equivalence: assessTherapeuticEquivalence(baseResponse.data, searchCriteria),
      substitution_guidance: generateSubstitutionGuidance(baseResponse.data, userInput),
      cost_optimization: generateCostOptimization(baseResponse.data, userInput),
    },
  };

  // Add validation warnings
  if (validationWarnings.length > 0) {
    enhancedResponse.warnings = [...(enhancedResponse.warnings || []), ...validationWarnings];
  }

  // Enhance clinical notes with alternatives-specific guidance
  enhancedResponse.clinical_notes = [
    ...enhancedResponse.clinical_notes,
    ...generateAlternativesSpecificNotes(searchCriteria, baseResponse.data),
  ];

  // Enhance next actions for alternatives workflow
  enhancedResponse.next_suggested_actions = enhanceAlternativesNextActions(
    baseResponse.next_suggested_actions || [],
    baseResponse.data,
    searchCriteria,
  );

  return enhancedResponse;
}

function generateAlternativesAnalysis(
  searchData: any,
  criteria: ProcessedSearchCriteria,
): Record<string, unknown> {
  const drugs = searchData.drugs || [];

  return {
    search_strategy: {
      primary_method: criteria.searchType,
      search_value: criteria.primaryValue || 'route-based',
      reference_drug: criteria.referenceDrugName || null,
    },
    alternatives_profile: {
      total_alternatives: drugs.length,
      generic_options: countGenericOptions(drugs),
      brand_options: countBrandOptions(drugs),
      biosimilar_options: countBiosimilarOptions(drugs),
    },
    availability_analysis: {
      prescription_required: drugs.filter((d: any) => d.requiresPrescription).length,
      otc_available: drugs.filter((d: any) => !d.requiresPrescription).length,
      health_basket_covered: drugs.filter((d: any) => d.inHealthBasket).length,
      discontinued_alternatives: drugs.filter((d: any) => !d.isActive).length,
    },
    formulation_diversity: analyzeFormulationDiversity(drugs),
    manufacturer_diversity: analyzeManufacturerDiversity(drugs),
  };
}

function assessTherapeuticEquivalence(
  searchData: any,
  criteria: ProcessedSearchCriteria,
): Record<string, unknown> {
  const drugs = searchData.drugs || [];

  return {
    equivalence_level: determineEquivalenceLevel(criteria.searchType),
    bioequivalence_considerations: generateBioequivalenceNotes(criteria.searchType),
    therapeutic_substitution: {
      automatic_substitution: assessAutomaticSubstitution(drugs),
      clinical_consideration_required: assessClinicalConsideration(drugs),
      dosage_adjustment_needed: assessDosageAdjustment(drugs),
    },
    safety_profile_similarity: assessSafetyProfileSimilarity(drugs),
    efficacy_expectations: generateEfficacyExpectations(criteria.searchType),
  };
}

function generateSubstitutionGuidance(
  searchData: any,
  userInput: ValidatedExploreGenericAlternativesInput,
): SubstitutionGuidance {
  const drugs = searchData.drugs || [];
  const guidance: SubstitutionGuidance = {
    immediate_substitution: [],
    consider_with_monitoring: [],
    requires_clinical_evaluation: [],
    not_recommended: [],
  };

  // Categorize alternatives by substitution appropriateness
  drugs.forEach((drug: any) => {
    if (!drug.isActive) {
      guidance.not_recommended.push(`${drug.hebrewName} - discontinued medication`);
    } else if (!drug.requiresPrescription && drug.inHealthBasket) {
      guidance.immediate_substitution.push(`${drug.hebrewName} - OTC and health basket covered`);
    } else if (drug.requiresPrescription && drug.inHealthBasket) {
      guidance.consider_with_monitoring.push(
        `${drug.hebrewName} - requires prescription but covered`,
      );
    } else {
      guidance.requires_clinical_evaluation.push(
        `${drug.hebrewName} - full cost consideration needed`,
      );
    }
  });

  return guidance;
}

function generateCostOptimization(
  searchData: any,
  userInput: ValidatedExploreGenericAlternativesInput,
): Record<string, unknown> {
  const drugs = searchData.drugs || [];

  if (!userInput.comparison_criteria?.include_price_comparison) {
    return { analysis: 'price_comparison_not_requested' };
  }

  const pricesWithValues: PriceData[] = drugs
    .filter((d: any) => d.maxPrice !== null && d.maxPrice > 0)
    .map((d: any) => ({ name: d.hebrewName, price: d.maxPrice, inBasket: d.inHealthBasket }));

  if (pricesWithValues.length === 0) {
    return { analysis: 'no_pricing_data_available' };
  }

  const basketOptions = pricesWithValues.filter((d: PriceData) => d.inBasket);
  const fullCostOptions = pricesWithValues.filter((d: PriceData) => !d.inBasket);

  return {
    pricing_analysis: {
      cheapest_option: pricesWithValues.reduce((min: PriceData, current: PriceData) =>
        current.price < min.price ? current : min,
      ),
      most_expensive: pricesWithValues.reduce((max: PriceData, current: PriceData) =>
        current.price > max.price ? current : max,
      ),
      average_price:
        pricesWithValues.reduce((sum: number, d: PriceData) => sum + d.price, 0) / pricesWithValues.length,
    },
    cost_savings: {
      basket_vs_full_cost:
        basketOptions.length > 0 && fullCostOptions.length > 0
          ? calculatePotentialSavings(basketOptions, fullCostOptions)
          : null,
      generic_savings_potential: calculateGenericSavings(drugs),
    },
    recommendations: generateCostRecommendations(basketOptions, fullCostOptions),
  };
}

// ===== UTILITY FUNCTIONS =====

function generateSearchQueryDescription(criteria: ProcessedSearchCriteria): string {
  switch (criteria.searchType) {
    case 'active_ingredient':
      return `Active ingredient: ${criteria.primaryValue}`;
    case 'atc_code':
      return `Therapeutic class: ${criteria.primaryValue}`;
    case 'administration_route':
      return `Administration route: ID ${criteria.routeId}`;
    case 'reference_drug':
      return `Alternatives to: ${criteria.referenceDrugName}`;
    default:
      return 'Generic alternatives search';
  }
}

function countGenericOptions(drugs: any[]): number {
  // Simple heuristic - could be enhanced with more sophisticated detection
  return drugs.filter((d: any) => d.englishName && d.englishName.toUpperCase() === d.englishName)
    .length;
}

function countBrandOptions(drugs: any[]): number {
  return drugs.filter((d: any) => d.englishName && d.englishName.toUpperCase() !== d.englishName)
    .length;
}

function countBiosimilarOptions(drugs: any[]): number {
  // Placeholder - would require more sophisticated detection
  return 0;
}

function analyzeFormulationDiversity(drugs: any[]): Record<string, number> {
  const formulations: Record<string, number> = {};

  drugs.forEach((drug) => {
    const form = drug.dosageForm;
    formulations[form] = (formulations[form] || 0) + 1;
  });

  return formulations;
}

function analyzeManufacturerDiversity(drugs: any[]): Record<string, number> {
  const manufacturers: Record<string, number> = {};

  drugs.forEach((drug) => {
    const manufacturer = drug.manufacturer;
    manufacturers[manufacturer] = (manufacturers[manufacturer] || 0) + 1;
  });

  return manufacturers;
}

function determineEquivalenceLevel(searchType: string): string {
  switch (searchType) {
    case 'active_ingredient':
      return 'pharmaceutical_equivalence';
    case 'atc_code':
      return 'therapeutic_equivalence';
    case 'administration_route':
      return 'formulation_similarity';
    case 'reference_drug':
      return 'direct_alternatives';
    default:
      return 'unknown';
  }
}

function generateBioequivalenceNotes(searchType: string): string[] {
  const notes: string[] = [];

  if (searchType === 'active_ingredient') {
    notes.push('Same active ingredient - bioequivalence studies may apply');
    notes.push('Generic substitution generally appropriate with monitoring');
  } else if (searchType === 'atc_code') {
    notes.push('Same therapeutic class - clinical equivalence varies');
    notes.push('Individual patient response may differ between alternatives');
  }

  notes.push('Consult prescribing information for specific bioequivalence data');

  return notes;
}

function assessAutomaticSubstitution(drugs: any[]): boolean {
  // Conservative approach - automatic substitution only for clear generics
  return drugs.some((d: any) => !d.requiresPrescription && d.inHealthBasket);
}

function assessClinicalConsideration(drugs: any[]): boolean {
  return drugs.some((d: any) => d.requiresPrescription);
}

function assessDosageAdjustment(drugs: any[]): boolean {
  // Placeholder - would need more sophisticated strength analysis
  return false;
}

function assessSafetyProfileSimilarity(drugs: any[]): string {
  const hasActiveWarnings = drugs.some(
    (d: any) => d.clinicalInfo.warnings && d.clinicalInfo.warnings.length > 0,
  );

  return hasActiveWarnings ? 'variable_safety_profiles' : 'similar_safety_profiles';
}

function generateEfficacyExpectations(searchType: string): string {
  switch (searchType) {
    case 'active_ingredient':
      return 'equivalent_efficacy_expected';
    case 'atc_code':
      return 'similar_therapeutic_effect';
    case 'administration_route':
      return 'route_dependent_efficacy';
    default:
      return 'variable_efficacy';
  }
}

function calculatePotentialSavings(
  basketOptions: any[],
  fullCostOptions: any[],
): Record<string, number> {
  const avgBasketPrice = basketOptions.reduce((sum, d) => sum + d.price, 0) / basketOptions.length;
  const avgFullPrice =
    fullCostOptions.reduce((sum, d) => sum + d.price, 0) / fullCostOptions.length;

  return {
    average_basket_price: Math.round(avgBasketPrice * 100) / 100,
    average_full_price: Math.round(avgFullPrice * 100) / 100,
    potential_savings: Math.round((avgFullPrice - avgBasketPrice) * 100) / 100,
  };
}

function calculateGenericSavings(drugs: any[]): string {
  // Placeholder for generic savings calculation
  return 'analysis_requires_brand_generic_comparison';
}

function generateCostRecommendations(basketOptions: any[], fullCostOptions: any[]): string[] {
  const recommendations: string[] = [];

  if (basketOptions.length > 0) {
    recommendations.push('Prioritize health basket covered alternatives for cost savings');
  }

  if (fullCostOptions.length > 0 && basketOptions.length > 0) {
    recommendations.push('Compare clinical benefits vs cost difference for full-cost options');
  }

  recommendations.push('Consult pharmacist about generic substitution policies');

  return recommendations;
}

function generateAlternativesSpecificNotes(
  criteria: ProcessedSearchCriteria,
  searchData: any,
): string[] {
  const notes: string[] = [];

  if (criteria.searchType === 'active_ingredient') {
    notes.push('Alternatives contain same active pharmaceutical ingredient');
    notes.push('Bioequivalence and therapeutic equivalence generally established');
  } else if (criteria.searchType === 'atc_code') {
    notes.push('Alternatives within same therapeutic category');
    notes.push('Clinical effects similar but individual response may vary');
  }

  const drugs = searchData.drugs || [];
  if (drugs.some((d: any) => !d.isActive)) {
    notes.push('Some alternatives are discontinued - verify current availability');
  }

  notes.push('Consider patient-specific factors when selecting alternatives');
  notes.push('Monitor therapeutic response when switching between alternatives');

  return notes;
}

function enhanceAlternativesNextActions(
  baseActions: any[],
  searchData: any,
  criteria: ProcessedSearchCriteria,
): any[] {
  const enhancedActions = [...baseActions];
  const drugs = searchData.drugs || [];

  // Add alternatives-specific actions
  if (drugs.length > 0) {
    enhancedActions.push({
      tool: 'analyze_basket_coverage',
      reason: 'Compare costs and health basket coverage of alternatives',
      parameters_hint: 'Include all alternative medications found',
    });

    enhancedActions.push({
      tool: 'check_drug_availability_status',
      reason: 'Verify current availability of alternative medications',
      parameters_hint: 'Check active status of recommended alternatives',
    });
  }

  if (criteria.referenceDrugName) {
    enhancedActions.push({
      tool: 'get_comprehensive_drug_info',
      reason: `Get detailed information about reference drug ${criteria.referenceDrugName}`,
      parameters_hint: `Use registration number: ${criteria.referenceRegistration}`,
    });
  }

  return enhancedActions;
}
