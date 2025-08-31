/**
 * Response formatting utilities for Israel Drugs MCP Server
 * Transforms API responses into AI-friendly, clinically-contextualized formats
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
import {
  McpSuccessResponse,
  McpErrorResponse,
  ProcessedDrug,
  ProcessedSymptom,
  ProcessedSearchResult,
} from '../types/mcp.js';
import { API_CONFIG, CLINICAL_MAPPINGS, SAFETY_CONFIG } from '../config/constants.js';
import { IsraelDrugsError } from '../types/errors.js';

// ===== CORE FORMATTING FUNCTIONS =====

/**
 * Formats a single drug from search results into AI-friendly format
 */
export function formatDrugResult(drug: DrugSearchResult): ProcessedDrug {
  return {
    registrationNumber: drug.dragRegNum,
    hebrewName: drug.dragHebName,
    englishName: drug.dragEnName,
    activeIngredients: drug.activeComponents.map((comp) => comp.componentName),
    dosageForm: drug.dosageForm,
    administrationRoute: drug.usageForm,
    requiresPrescription: drug.prescription,
    inHealthBasket: drug.health,
    isActive: !drug.iscanceled,
    discontinuedDate: drug.iscanceled ? formatDate(drug.bitulDate) : null,
    maxPrice: parseFloat(drug.customerPrice) || null,
    manufacturer: drug.dragRegOwner,
    images: drug.images.map((img) => `${API_CONFIG.IMAGES_BASE_URL}/${img.url}`),
    atcCodes: [], // Will be populated from detailed drug info if needed
    packages: drug.packages.map((pkg, index) => ({
      description: pkg,
      price: parseFloat(drug.packagesPrices[index] || '0'),
      quantity: pkg,
    })),
    clinicalInfo: {
      indications: drug.indications || 'No indication information available',
      warnings: generateDrugWarnings(drug),
      brochures: [], // Will be populated from detailed drug info
    },
  };
}

/**
 * Formats detailed drug information from GetSpecificDrug
 */
export function formatDetailedDrugInfo(drugDetails: GetSpecificDrugResponse): ProcessedDrug {
  return {
    registrationNumber: drugDetails.dragRegNum,
    hebrewName: drugDetails.dragHebName,
    englishName: drugDetails.dragEnName,
    activeIngredients: drugDetails.activeMetirals.map(
      (ingredient) => `${ingredient.ingredientsDesc} ${ingredient.dosage}`,
    ),
    dosageForm: drugDetails.dosageForm,
    administrationRoute: drugDetails.usageFormHeb,
    requiresPrescription: drugDetails.packages.some(pkg => !pkg.isPrescription),
    inHealthBasket: drugDetails.health,
    isActive: !drugDetails.iscanceled,
    discontinuedDate: drugDetails.iscanceled ? formatDate(drugDetails.bitulDate) : null,
    maxPrice: drugDetails.maxPrice,
    manufacturer: drugDetails.regOwnerName,
    images: drugDetails.images.map((img) => `${API_CONFIG.IMAGES_BASE_URL}/${img.url}`),
    atcCodes: drugDetails.atc.map((atc) => ({
      level4: atc.atc4Code.trim(),
      level5: atc.atc5Code,
      description: atc.atc5Name,
    })),
    packages: drugDetails.packages.map((pkg) => ({
      description: pkg.packageDesc,
      price: pkg.packageMaxPrice,
      quantity: pkg.quantity,
      requiresPrescription: !pkg.isPrescription,
    })),
    clinicalInfo: {
      indications: drugDetails.dragIndication || 'No indication information available',
      warnings: generateDetailedDrugWarnings(drugDetails),
      brochures: drugDetails.brochure.map((brochure) => ({
        language: brochure.lng || 'unknown',
        type: brochure.type,
        url: brochure.url,
      })),
    },
  };
}

/**
 * Formats search results into structured MCP response
 */
export function formatSearchResults(
  results: DrugSearchResult[],
  query: string,
  totalResults: number,
  currentPage: number,
  filters: {
    prescriptionOnly?: boolean;
    healthBasketOnly?: boolean;
    activeOnly?: boolean;
  } = {},
): ProcessedSearchResult {
  const processedDrugs = results.map(formatDrugResult);

  return {
    query,
    totalResults,
    page: currentPage,
    totalPages: Math.ceil(totalResults / 10), // Assuming 10 results per page
    drugs: processedDrugs,
    filters: {
      prescriptionOnly: filters.prescriptionOnly || false,
      healthBasketOnly: filters.healthBasketOnly || false,
      activeOnly: filters.activeOnly !== false, // Default to true
    },
    suggestions: generateSearchSuggestions(processedDrugs, query),
    warnings: generateSearchWarnings(processedDrugs, totalResults),
  };
}

/**
 * Formats symptom hierarchy for AI consumption
 */
export function formatSymptomHierarchy(
  categories: SymptomCategory[],
  popularSymptoms?: PopularSymptom[],
) {
  const popularityMap = new Map<number, number>();
  if (popularSymptoms) {
    popularSymptoms.forEach((symptom) => {
      popularityMap.set(symptom.bySymptomSecond, symptom.order);
    });
  }

  return {
    categories: categories.map((category) => ({
      name: category.bySymptomMain,
      symptoms: category.list.map((symptom) => ({
        id: symptom.bySymptomSecond,
        name: symptom.bySymptomName,
        popularity_rank: popularityMap.get(symptom.bySymptomSecond) || null,
        common_treatments: [], // Could be enhanced with actual treatment data
      })),
    })),
    total_categories: categories.length,
    total_symptoms: categories.reduce((sum, cat) => sum + cat.list.length, 0),
    last_updated: new Date().toISOString(),
  };
}

/**
 * Formats therapeutic categories (ATC codes) for AI
 */
export function formatTherapeuticCategories(atcList: AtcListItem[]) {
  return {
    atc_hierarchy: atcList.map((atc) => ({
      code: atc.id,
      name: atc.text,
      level: 4, // All entries are level 4 based on research
      parent_code: atc.id.substring(0, 3), // First 3 characters for grouping
      drug_count: 0, // Would need additional API call to determine
      clinical_description: generateAtcDescription(atc.id, atc.text),
    })),
    total_codes: atcList.length,
    classification_version: 'ATC 2024',
  };
}

/**
 * Formats administration routes for AI
 */
export function formatAdministrationRoutes(routes: MatanListItem[]) {
  return {
    routes: routes.map((route) => ({
      id: route.id,
      name_hebrew: route.text,
      name_english: getEnglishRouteName(route.text),
      clinical_description: generateRouteDescription(route.text),
      common_usage: getCommonUsage(route.id),
      special_considerations: getSpecialConsiderations(route.id),
    })),
    total_routes: routes.length,
    clinical_guidelines_url: null,
  };
}

// ===== MCP RESPONSE BUILDERS =====

/**
 * Creates standardized MCP success response
 */
export function createMcpSuccessResponse<T>(
  data: T,
  metadata: {
    totalResults?: number;
    queryTime?: number;
    additionalInfo?: Record<string, unknown>;
  } = {},
): McpSuccessResponse<T> {
  const queryTimeMs = metadata.queryTime || 0;

  return {
    success: true,
    data,
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], // Added content field
    metadata: {
      total_results: metadata.totalResults || 0,
      query_time: `${queryTimeMs}ms`,
      data_source: 'israel_ministry_of_health',
      last_updated: new Date().toISOString(),
      api_version: '1.0.0',
      ...metadata.additionalInfo,
    },
    clinical_notes: generateClinicalNotes(data),
    warnings: generateResponseWarnings(data),
    next_suggested_actions: generateNextActions(data),
  };
}

/**
 * Creates standardized MCP error response
 */
export function createMcpErrorResponse(
  error: IsraelDrugsError,
  partialData?: unknown,
): McpErrorResponse {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      severity: error.severity,
      type: error.type,
      timestamp: error.timestamp.toISOString(),
      suggestions: error.suggestions || [],
      clinical_context: error.clinicalContext,
      details: error.details,
    },
    content: [{ type: 'text', text: error.message }], // Added content field
    partial_data: partialData,
    recovery_actions: generateRecoveryActions(error),
  };
}

// ===== HELPER FUNCTIONS =====

/**
 * Formats date strings from API into readable format
 */
function formatDate(dateString: string): string | null {
  if (!dateString || dateString === '01/01/1900') {
    return null; // Default "never" date
  }

  try {
    const dateParts = dateString.split('.');
    if (dateParts.length === 3) {
      const day = dateParts[0]!;
      const month = dateParts[1]!;
      const year = dateParts[2]!;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateString; // Return as-is if split fails
  } catch {
    return dateString; // Return as-is if parsing fails
  }
}

/**
 * Generates clinical warnings for a drug
 */
function generateDrugWarnings(drug: DrugSearchResult): string[] {
  const warnings: string[] = [];

  if (drug.iscanceled) {
    warnings.push(`This medication was discontinued on ${formatDate(drug.bitulDate)}`);
  }

  if (drug.prescription) {
    warnings.push('This medication requires a prescription from a licensed physician');
  }

  if (!drug.health) {
    warnings.push('This medication is not covered by the health basket');
  }

  if (parseFloat(drug.customerPrice) > SAFETY_CONFIG.WARNING_THRESHOLDS.HIGH_PRICE_THRESHOLD) {
    warnings.push('This is a high-cost medication');
  }

  return warnings;
}

/**
 * Generates detailed warnings for comprehensive drug info
 */
function generateDetailedDrugWarnings(drug: GetSpecificDrugResponse): string[] {
  const warnings: string[] = [];

  if (drug.iscanceled) {
    warnings.push(`This medication was discontinued on ${formatDate(drug.bitulDate)}`);
  }

  if (drug.isPrescription) {
    warnings.push('Requires prescription and medical supervision');
  }

  if (drug.isCytotoxic) {
    warnings.push('Cytotoxic medication - requires special handling');
  }

  if (drug.isVeterinary) {
    warnings.push('Veterinary medication - not for human use');
  }

  return warnings;
}

/**
 * Generates search suggestions based on results
 */
function generateSearchSuggestions(drugs: ProcessedDrug[], query: string): string[] {
  const suggestions: string[] = [];

  if (drugs.length === 0) {
    suggestions.push("Try using 'suggest_drug_names' tool for spelling help");
    suggestions.push("Search by symptom using 'find_drugs_for_symptom' tool");
  } else if (drugs.length > 20) {
    suggestions.push('Narrow your search with more specific criteria');
    suggestions.push('Use health basket filter to reduce results');
  }

  // Suggest generic alternatives if brand names found
  const hasGenericPotential = drugs.some((drug) =>
    drug.activeIngredients.some(
      (ingredient) => ingredient.includes('PARACETAMOL') || ingredient.includes('IBUPROFEN'),
    ),
  );

  if (hasGenericPotential) {
    suggestions.push("Use 'explore_generic_alternatives' to find cheaper options");
  }

  return suggestions;
}

/**
 * Generates search warnings based on results
 */
function generateSearchWarnings(drugs: ProcessedDrug[], totalResults: number): string[] {
  const warnings: string[] = [];

  const discontinuedCount = drugs.filter((drug) => !drug.isActive).length;
  if (discontinuedCount > 0) {
    warnings.push(`${discontinuedCount} of ${drugs.length} results are discontinued medications`);
  }

  const prescriptionCount = drugs.filter((drug) => drug.requiresPrescription).length;
  if (prescriptionCount === drugs.length && drugs.length > 0) {
    warnings.push('All results require a prescription');
  }

  if (totalResults > SAFETY_CONFIG.WARNING_THRESHOLDS.MANY_RESULTS_THRESHOLD) {
    warnings.push('Large number of results - consider narrowing search criteria');
  }

  return warnings;
}

/**
 * Generates clinical notes for response data
 */
function generateClinicalNotes(data: unknown): string[] {
  // Generic clinical notes - could be enhanced based on data type
  return [
    'Always verify medication information with healthcare professionals',
    'Check for drug interactions with current medications',
    'Follow prescribed dosage and administration instructions',
  ];
}

/**
 * Generates warnings for response data
 */
function generateResponseWarnings(data: unknown): string[] {
  return [SAFETY_CONFIG.DISCLAIMERS.GENERAL];
}

/**
 * Generates next suggested actions based on response data
 */
function generateNextActions(
  data: unknown,
): Array<{ tool: string; reason: string; parameters_hint: string }> {
  // Basic suggestions - could be enhanced based on data type and content
  return [
    {
      tool: 'get_comprehensive_drug_info',
      reason: 'Get detailed information about specific medications',
      parameters_hint: 'Use registration_number from search results',
    },
    {
      tool: 'explore_generic_alternatives',
      reason: 'Find cost-effective alternatives',
      parameters_hint: 'Use active_ingredient or ATC code from results',
    },
  ];
}

/**
 * Generates recovery actions for errors
 */
function generateRecoveryActions(error: IsraelDrugsError): string[] {
  const actions: string[] = [];

  if (error.isRecoverable()) {
    actions.push('Retry the request with corrected parameters');
    actions.push('Use suggested alternative approaches');
  }

  if (error.suggestions) {
    actions.push(...error.suggestions);
  }

  return actions;
}

/**
 * Generates ATC clinical description
 */
function generateAtcDescription(code: string, name: string): string {
  const firstChar = code.charAt(0);
  const systemMap: Record<string, string> = {
    A: 'Alimentary tract and metabolism',
    B: 'Blood and blood forming organs',
    C: 'Cardiovascular system',
    D: 'Dermatologicals',
    G: 'Genito-urinary system and sex hormones',
    H: 'Systemic hormonal preparations',
    J: 'Anti-infectives for systemic use',
    L: 'Antineoplastic and immunomodulating agents',
    M: 'Musculo-skeletal system',
    N: 'Nervous system',
    P: 'Antiparasitic products',
    R: 'Respiratory system',
    S: 'Sensory organs',
    V: 'Various',
  };

  const systemName = systemMap[firstChar] || 'Unknown system';
  return `${name} - ${systemName}`;
}

/**
 * Gets English name for Hebrew administration route
 */
function getEnglishRouteName(hebrewName: string): string {
  const routeMap: Record<string, string> = {
    פומי: 'Oral',
    עורי: 'Topical',
    עיני: 'Ophthalmic',
    אוזני: 'Otic',
    'תוך-ורידי': 'Intravenous',
    'תוך-שרירי': 'Intramuscular',
    רקטלי: 'Rectal',
  };

  return routeMap[hebrewName] || hebrewName;
}

/**
 * Generates clinical description for administration route
 */
function generateRouteDescription(routeName: string): string {
  const descriptions: Record<string, string> = {
    פומי: 'Administered by mouth, absorbed through digestive system',
    עורי: 'Applied to skin surface for local or systemic effect',
    עיני: 'Applied directly to the eye for local treatment',
    אוזני: 'Applied to the ear for local treatment',
    'תוך-ורידי': 'Injected directly into vein for immediate systemic effect',
    'תוך-שרירי': 'Injected into muscle tissue for systemic absorption',
    רקטלי: 'Administered through rectum, useful when oral route unavailable',
  };

  return descriptions[routeName] || `Administration route: ${routeName}`;
}

/**
 * Gets common usage examples for administration route
 */
function getCommonUsage(routeId: number): string[] {
  const usageMap: Record<number, string[]> = {
    17: ['Tablets', 'Capsules', 'Syrups', 'Solutions'], // Oral
    2: ['Creams', 'Ointments', 'Gels', 'Patches'], // Topical
    15: ['Eye drops', 'Eye ointments'], // Eye
    16: ['Ear drops', 'Ear sprays'], // Ear
    6: ['IV injections', 'IV infusions'], // IV
    5: ['IM injections', 'Vaccines'], // IM
    18: ['Suppositories', 'Enemas'], // Rectal
  };

  return usageMap[routeId] || ['Various formulations'];
}

/**
 * Gets special considerations for administration route
 */
function getSpecialConsiderations(routeId: number): string[] {
  const considerationsMap: Record<number, string[]> = {
    17: ['Consider food interactions', 'Ensure proper swallowing ability'],
    2: ['Check skin integrity', 'Avoid damaged skin areas'],
    15: ['Maintain sterility', 'Check for eye infections'],
    16: ['Ensure ear canal is clear', 'Check for perforated eardrum'],
    6: ['Requires trained healthcare professional', 'Monitor for immediate reactions'],
    5: ['Requires trained healthcare professional', 'Rotate injection sites'],
    18: ['Patient comfort and privacy', 'Contraindicated in some bowel conditions'],
  };

  return considerationsMap[routeId] || ['Follow standard medical protocols'];
}
