/**
 * Response Formatting Service for Israel Drugs MCP Server
 * Orchestrates the transformation of API responses into AI-optimized formats
 * with clinical context and intelligent suggestions
 */

import {
  DrugSearchResult,
  GetSpecificDrugResponse,
  SymptomCategory,
  PopularSymptom,
  AtcListItem,
  MatanListItem,
  PackageListItem,
} from '../types/api.js';
import type {
  McpSuccessResponse,
  ProcessedDrug,
  ProcessedSearchResult,
  SymptomHierarchyResource,
  TherapeuticCategoriesResource,
  AdministrationRoutesResource,
} from '../types/mcp.js'; // Reverted to mcp.js
import {
  formatDrugResult,
  formatDetailedDrugInfo,
  formatSearchResults,
  formatSymptomHierarchy,
  formatTherapeuticCategories,
  formatAdministrationRoutes,
  createMcpSuccessResponse,
} from '../utils/formatters.js';
import { MCP_CONFIG, CLINICAL_MAPPINGS, SAFETY_CONFIG } from '../config/constants.js';

// ===== RESPONSE FORMATTER SERVICE =====

export class ResponseFormatterService {
  // ===== DRUG SEARCH FORMATTING =====

  /**
   * Formats drug search results with intelligent analysis and suggestions
   */
  formatDrugSearchResponse(
    results: DrugSearchResult[],
    query: string,
    filters: {
      prescriptionAccess?: 'has_prescription' | 'otc_only' | 'either';
      healthBasketOnly?: boolean;
      pageIndex?: number;
    } = {},
    queryStartTime?: number,
  ): McpSuccessResponse<ProcessedSearchResult> {
    const startTime = Date.now();

    // Process and analyze results
    const processedResult = formatSearchResults(
      results,
      query,
      this.calculateTotalResults(results),
      filters.pageIndex || 1,
      {
        prescriptionOnly: filters.prescriptionAccess === 'otc_only',
        healthBasketOnly: filters.healthBasketOnly || false,
        activeOnly: true,
      },
    );

    // Generate intelligent clinical notes
    const clinicalNotes = this.generateSearchClinicalNotes(processedResult);

    // Generate contextual warnings
    const warnings = this.generateSearchWarnings(processedResult, filters);

    // Generate next action suggestions
    const nextActions = this.generateSearchNextActions(processedResult, query);

    const queryTime = queryStartTime ? Date.now() - queryStartTime : Date.now() - startTime;

    return createMcpSuccessResponse(processedResult, {
      totalResults: processedResult.totalResults,
      queryTime,
      additionalInfo: {
        search_strategy: this.analyzeSearchStrategy(query, results),
        clinical_relevance: this.assessClinicalRelevance(processedResult.drugs),
        cost_analysis: this.performCostAnalysis(processedResult.drugs),
      },
    });
  }

  /**
   * Formats detailed drug information with comprehensive clinical context
   */
  formatDrugDetailsResponse(
    drugDetails: GetSpecificDrugResponse,
    queryStartTime?: number,
  ): McpSuccessResponse<ProcessedDrug> {
    const startTime = Date.now();

    const processedDrug = formatDetailedDrugInfo(drugDetails);

    // Generate comprehensive clinical analysis
    const clinicalAnalysis = this.generateDrugClinicalAnalysis(processedDrug);

    // Generate safety assessment
    const safetyAssessment = this.generateSafetyAssessment(processedDrug);

    // Generate usage guidance
    const usageGuidance = this.generateUsageGuidance(processedDrug);

    const queryTime = queryStartTime ? Date.now() - queryStartTime : Date.now() - startTime;

    return {
      success: true,
      data: processedDrug,
      content: [{ type: 'text', text: JSON.stringify(processedDrug, null, 2) }], // Added content field
      metadata: {
        total_results: 1,
        query_time: `${queryTime}ms`,
        data_source: 'israel_ministry_of_health',
        last_updated: new Date().toISOString(),
        api_version: '1.0.0',
        clinical_analysis: clinicalAnalysis,
        safety_assessment: safetyAssessment,
        regulatory_status: this.getRegulatoryStatus(drugDetails),
      },
      clinical_notes: [
        ...usageGuidance,
        'Verify current prescribing information with healthcare provider',
        'Check for updates to safety information and contraindications',
      ],
      warnings: this.generateDetailedDrugWarnings(processedDrug),
      next_suggested_actions: this.generateDrugDetailsNextActions(processedDrug),
    };
  }

  // ===== SYMPTOM FORMATTING =====

  /**
   * Formats symptom hierarchy for AI navigation and understanding
   */
  formatSymptomHierarchyResponse(
    categories: SymptomCategory[],
    popularSymptoms?: PopularSymptom[],
    queryStartTime?: number,
  ): McpSuccessResponse<SymptomHierarchyResource> {
    const startTime = Date.now();

    const formattedHierarchy = formatSymptomHierarchy(categories, popularSymptoms);

    // Enhance with clinical intelligence
    const enhancedHierarchy = this.enhanceSymptomHierarchy(formattedHierarchy, popularSymptoms);

    const queryTime = queryStartTime ? Date.now() - queryStartTime : Date.now() - startTime;

    return createMcpSuccessResponse(enhancedHierarchy, {
      totalResults: enhancedHierarchy.total_symptoms,
      queryTime,
      additionalInfo: {
        most_searched: this.getMostSearchedSymptoms(popularSymptoms),
        treatment_availability: this.analyzeSymptomTreatmentAvailability(categories),
        clinical_priority: this.assessSymptomClinicalPriority(categories),
      },
    });
  }

  /**
   * Formats popular symptoms with usage analytics
   */
  formatPopularSymptomsResponse(
    popularSymptoms: PopularSymptom[],
    requestedCount: number,
    queryStartTime?: number,
  ): McpSuccessResponse<PopularSymptom[]> {
    const startTime = Date.now();

    // Sort by popularity and add clinical context
    const enhancedSymptoms = popularSymptoms
      .sort((a, b) => b.order - a.order)
      .slice(0, requestedCount)
      .map((symptom) => ({
        ...symptom,
        clinical_priority: this.getSymptomClinicalPriority(symptom.bySymptomName),
        typical_treatments: this.getTypicalTreatments(symptom.bySymptomName),
        self_care_potential: this.assessSelfCarePotential(symptom.bySymptomName),
      }));

    const queryTime = queryStartTime ? Date.now() - queryStartTime : Date.now() - startTime;

    return createMcpSuccessResponse(enhancedSymptoms, {
      totalResults: enhancedSymptoms.length,
      queryTime,
      additionalInfo: {
        popularity_analysis: this.analyzeSymptomPopularity(popularSymptoms),
        seasonal_trends: this.estimateSeasonalTrends(popularSymptoms),
        treatment_complexity: this.assessTreatmentComplexity(popularSymptoms),
      },
    });
  }

  // ===== REFERENCE DATA FORMATTING =====

  /**
   * Formats therapeutic categories with clinical intelligence
   */
  formatTherapeuticCategoriesResponse(
    atcList: AtcListItem[],
    queryStartTime?: number,
  ): McpSuccessResponse<TherapeuticCategoriesResource> {
    const startTime = Date.now();

    const formattedCategories = formatTherapeuticCategories(atcList);

    // Enhance with clinical insights
    const enhancedCategories = this.enhanceTherapeuticCategories(formattedCategories);

    const queryTime = queryStartTime ? Date.now() - queryStartTime : Date.now() - startTime;

    return createMcpSuccessResponse(enhancedCategories, {
      totalResults: enhancedCategories.total_codes,
      queryTime,
      additionalInfo: {
        therapeutic_areas: this.categorizeTherapeuticAreas(atcList),
        clinical_significance: this.assessClinicalSignificance(atcList),
        prescribing_patterns: this.analyzePrescribingPatterns(atcList),
      },
    });
  }

  /**
   * Formats administration routes with practical guidance
   */
  formatAdministrationRoutesResponse(
    routes: MatanListItem[],
    queryStartTime?: number,
  ): McpSuccessResponse<AdministrationRoutesResource> {
    const startTime = Date.now();

    const formattedRoutes = formatAdministrationRoutes(routes);

    // Enhance with practical clinical guidance
    const enhancedRoutes = this.enhanceAdministrationRoutes(formattedRoutes);

    const queryTime = queryStartTime ? Date.now() - queryStartTime : Date.now() - startTime;

    return createMcpSuccessResponse(enhancedRoutes, {
      totalResults: enhancedRoutes.total_routes,
      queryTime,
      additionalInfo: {
        route_complexity: this.assessRouteComplexity(routes),
        patient_suitability: this.analyzePatientSuitability(routes),
        clinical_preferences: this.getRoutePreferences(routes),
      },
    });
  }

  // ===== HELPER METHODS =====

  private calculateTotalResults(results: DrugSearchResult[]): number {
    if (results.length === 0) {
      return 0;
    }
    const firstResult = results[0];
    if (firstResult && firstResult.results !== undefined) {
      return firstResult.results;
    }
    return results.length;
  }

  private generateSearchClinicalNotes(result: ProcessedSearchResult): string[] {
    const notes: string[] = [];

    if (!result.drugs || result.drugs.length === 0) {
      notes.push('No medications found - consider alternative search strategies');
      notes.push('Verify spelling and try broader search criteria');
    } else {
      const drugs = result.drugs;
      const prescriptionCount = drugs.filter((d) => d.requiresPrescription).length;
      const basketCount = drugs.filter((d) => d.inHealthBasket).length;

      if (prescriptionCount > 0) {
        notes.push(`${prescriptionCount} of ${result.drugs.length} results require prescription`);
      }

      if (basketCount > 0) {
        notes.push(`${basketCount} of ${result.drugs.length} results are covered by health basket`);
      }

      notes.push('Compare active ingredients to identify generic alternatives');
      notes.push('Consider administration route suitability for patient');
    }

    return notes;
  }

  private generateSearchWarnings(
    result: ProcessedSearchResult,
    filters: Record<string, unknown>,
  ): string[] {
    const warnings: string[] = [];

    const discontinuedCount = result.drugs.filter((d) => !d.isActive).length;
    if (discontinuedCount > 0) {
      warnings.push(`${discontinuedCount} discontinued medications in results`);
    }

    if (result.totalResults > MCP_CONFIG.RESPONSE_LIMITS.MAX_SEARCH_RESULTS) {
      warnings.push('Large number of results - consider refining search criteria');
    }

    const highCostCount = result.drugs.filter(
      (d) => d.maxPrice && d.maxPrice > SAFETY_CONFIG.WARNING_THRESHOLDS.HIGH_PRICE_THRESHOLD,
    ).length;

    if (highCostCount > 0) {
      warnings.push(`${highCostCount} high-cost medications in results`);
    }

    return warnings;
  }

  private generateSearchNextActions(
    result: ProcessedSearchResult,
    query: string,
  ): Array<{ tool: string; reason: string; parameters_hint: string }> {
    const actions: Array<{ tool: string; reason: string; parameters_hint: string }> = [];

    if (result.drugs.length === 0) {
      actions.push({
        tool: 'suggest_drug_names',
        reason: 'Get spelling suggestions for drug name',
        parameters_hint: `partial_name: "${query}"`,
      });

      actions.push({
        tool: 'find_drugs_for_symptom',
        reason: 'Search by medical condition instead',
        parameters_hint: 'Browse symptoms first to find appropriate category',
      });
    } else {
      // Add specific drug detail actions
      result.drugs.slice(0, 3).forEach((drug) => {
        actions.push({
          tool: 'get_comprehensive_drug_info',
          reason: `Get detailed information about ${drug.hebrewName}`,
          parameters_hint: `drug_registration_number: "${drug.registrationNumber}"`,
        });
      });

      // Add generic alternatives suggestion
      if (result.drugs.length > 0) {
        const firstDrug = result.drugs[0];
        if (firstDrug && firstDrug.activeIngredients && firstDrug.activeIngredients.length > 0) {
          const firstActiveIngredient = firstDrug.activeIngredients[0];
          if (firstActiveIngredient !== undefined) {
            actions.push({
              tool: 'explore_generic_alternatives',
              reason: 'Find cost-effective alternatives',
              parameters_hint: `active_ingredient: "${firstActiveIngredient}"`,
            });
          }
        }
      }
    }

    return actions;
  }

  private analyzeSearchStrategy(query: string, results: DrugSearchResult[]): string {
    if (results.length === 0) {
      return 'no_results_strategy';
    } else if (results.length === 1) {
      return 'exact_match_strategy';
    } else if (results.length < 10) {
      return 'focused_search_strategy';
    } else {
      return 'broad_search_strategy';
    }
  }

  private assessClinicalRelevance(drugs: ProcessedDrug[]): string {
    const activeCount = drugs.filter((d) => d.isActive).length;
    const prescriptionCount = drugs.filter((d) => d.requiresPrescription).length;

    if (activeCount === 0) return 'no_active_medications';
    if (prescriptionCount === drugs.length) return 'prescription_only';
    if (prescriptionCount === 0) return 'otc_available';
    return 'mixed_availability';
  }

  private performCostAnalysis(drugs: ProcessedDrug[]): Record<string, unknown> {
    const pricesWithValues = drugs
      .map((d) => d.maxPrice)
      .filter((price): price is number => price !== null && price > 0);

    if (pricesWithValues.length === 0) {
      return { analysis: 'no_pricing_data' };
    }

    const minPrice = Math.min(...pricesWithValues);
    const maxPrice = Math.max(...pricesWithValues);
    const avgPrice = pricesWithValues.reduce((a, b) => a + b, 0) / pricesWithValues.length;

    return {
      min_price: minPrice,
      max_price: maxPrice,
      average_price: Math.round(avgPrice * 100) / 100,
      price_range: maxPrice - minPrice,
      cost_category: avgPrice < 50 ? 'low_cost' : avgPrice < 200 ? 'moderate_cost' : 'high_cost',
    };
  }

  private generateDrugClinicalAnalysis(drug: ProcessedDrug): Record<string, unknown> {
    return {
      regulatory_status: drug.isActive ? 'active' : 'discontinued',
      prescription_category: drug.requiresPrescription ? 'prescription_required' : 'otc_available',
      health_basket_status: drug.inHealthBasket ? 'covered' : 'not_covered',
      administration_complexity: this.assessAdministrationComplexity(drug.administrationRoute),
      cost_category: this.categorizeCost(drug.maxPrice),
      clinical_monitoring_required: drug.requiresPrescription,
      alternative_availability: 'requires_search', // Would need additional logic
    };
  }

  private generateSafetyAssessment(drug: ProcessedDrug): Record<string, unknown> {
    const warnings = drug.clinicalInfo.warnings;

    return {
      safety_level:
        warnings.length === 0 ? 'standard' : warnings.length < 3 ? 'caution' : 'high_alert',
      discontinued_status: !drug.isActive,
      prescription_oversight: drug.requiresPrescription,
      monitoring_requirements: warnings.filter((w) => w.includes('monitoring')).length > 0,
      special_populations:
        warnings.filter((w) => w.includes('pregnancy') || w.includes('children')).length > 0,
    };
  }

  private generateUsageGuidance(drug: ProcessedDrug): string[] {
    const guidance: string[] = [];

    if (drug.requiresPrescription) {
      guidance.push('Requires prescription and medical supervision');
      guidance.push('Follow dosing instructions provided by healthcare provider');
    } else {
      guidance.push('Available without prescription for appropriate use');
      guidance.push('Follow package instructions and dosing guidelines');
    }

    if (!drug.inHealthBasket) {
      guidance.push('Not covered by health basket - full cost applies');
    }

    if (!drug.isActive) {
      guidance.push('IMPORTANT: This medication has been discontinued');
      guidance.push('Consult healthcare provider for alternative treatments');
    }

    return guidance;
  }

  private getRegulatoryStatus(drugDetails: GetSpecificDrugResponse): Record<string, unknown> {
    return {
      registration_status: drugDetails.iscanceled ? 'cancelled' : 'active',
      registration_date: new Date(drugDetails.regDate).toISOString(),
      manufacturer: drugDetails.regOwnerName,
      application_type: drugDetails.applicationType,
      cytotoxic: drugDetails.isCytotoxic,
      veterinary: drugDetails.isVeterinary,
    };
  }

  private generateDetailedDrugWarnings(drug: ProcessedDrug): string[] {
    const warnings = [...drug.clinicalInfo.warnings];

    if (!drug.isActive && drug.discontinuedDate) {
      warnings.unshift(`DISCONTINUED: This medication was withdrawn on ${drug.discontinuedDate}`);
    }

    return warnings;
  }

  private generateDrugDetailsNextActions(
    drug: ProcessedDrug,
  ): Array<{ tool: string; reason: string; parameters_hint: string }> {
    const actions: Array<{ tool: string; reason: string; parameters_hint: string }> = [];

    if (drug.activeIngredients.length > 0) {
      const firstActiveIngredient = drug.activeIngredients[0];
      if (firstActiveIngredient !== undefined) {
        actions.push({
          tool: 'explore_generic_alternatives',
          reason: 'Find alternative medications with same active ingredient',
          parameters_hint: `active_ingredient: "${firstActiveIngredient.split(' ')[0]}"`,
        });
      }
    }

    if (drug.atcCodes.length > 0) {
      const firstAtcCode = drug.atcCodes[0];
      if (firstAtcCode !== undefined) {
        actions.push({
          tool: 'explore_generic_alternatives',
          reason: 'Find medications in same therapeutic category',
          parameters_hint: `atc_code: "${firstAtcCode.level4}"`,
        });
      }
    }

    actions.push({
      tool: 'check_drug_availability_status',
      reason: 'Verify current availability and any safety updates',
      parameters_hint: `drug_identifier: { name: "${drug.hebrewName}" }`,
    });

    return actions;
  }

  // Additional helper methods would continue here...
  // (Implementation of enhance methods, analysis methods, etc.)

  private enhanceSymptomHierarchy(hierarchy: any, popularSymptoms?: PopularSymptom[]): any {
    // Implementation for enhancing symptom hierarchy
    return hierarchy;
  }

  private getMostSearchedSymptoms(popularSymptoms?: PopularSymptom[]): string[] {
    return popularSymptoms?.slice(0, 5).map((s) => s.bySymptomName) || [];
  }

  private analyzeSymptomTreatmentAvailability(categories: SymptomCategory[]): string {
    return 'analysis_placeholder';
  }

  private assessSymptomClinicalPriority(categories: SymptomCategory[]): string {
    return 'priority_placeholder';
  }

  private getSymptomClinicalPriority(symptomName: string): string {
    return 'standard';
  }

  private getTypicalTreatments(symptomName: string): string[] {
    return ['consult_healthcare_provider'];
  }

  private assessSelfCarePotential(symptomName: string): string {
    return 'limited';
  }

  private analyzeSymptomPopularity(symptoms: PopularSymptom[]): Record<string, unknown> {
    return { total_searches: symptoms.reduce((sum, s) => sum + s.order, 0) };
  }

  private estimateSeasonalTrends(symptoms: PopularSymptom[]): string {
    return 'year_round';
  }

  private assessTreatmentComplexity(symptoms: PopularSymptom[]): string {
    return 'varied';
  }

  private enhanceTherapeuticCategories(categories: any): any {
    return categories;
  }

  private categorizeTherapeuticAreas(atcList: AtcListItem[]): string[] {
    return ['multiple_systems'];
  }

  private assessClinicalSignificance(atcList: AtcListItem[]): string {
    return 'comprehensive';
  }

  private analyzePrescribingPatterns(atcList: AtcListItem[]): string {
    return 'varied';
  }

  private enhanceAdministrationRoutes(routes: any): any {
    return routes;
  }

  private assessRouteComplexity(routes: MatanListItem[]): string {
    return 'varied';
  }

  private analyzePatientSuitability(routes: MatanListItem[]): string {
    return 'depends_on_condition';
  }

  private getRoutePreferences(routes: MatanListItem[]): string[] {
    return ['oral_preferred_when_possible'];
  }

  private assessAdministrationComplexity(route: string): string {
    const complexRoutes = ['תוך-ורידי', 'תוך-שרירי'];
    return complexRoutes.includes(route) ? 'complex' : 'simple';
  }

  private categorizeCost(price: number | null): string {
    if (!price) return 'unknown';
    if (price < 50) return 'low';
    if (price < 200) return 'moderate';
    return 'high';
  }
}

// ===== SINGLETON INSTANCE =====

let formatterInstance: ResponseFormatterService | null = null;

/**
 * Gets singleton instance of the response formatter
 */
export function getResponseFormatter(): ResponseFormatterService {
  if (!formatterInstance) {
    formatterInstance = new ResponseFormatterService();
  }
  return formatterInstance;
}
