/**
 * MCP-specific types for Israel Drugs Server
 * Designed for AI consumption with clinical context
 */

import { z } from 'zod';

// ===== TOOL INPUT SCHEMAS =====

// Discovery & Search Tool Schemas
export const DiscoverDrugByNameSchema = z.object({
  medication_query: z.string().min(1).describe('Drug name or partial name to search for'),
  patient_preferences: z
    .object({
      prescription_access: z
        .enum(['has_prescription', 'otc_only', 'either'])
        .default('either')
        .describe("Patient's access to prescription medications"),
      budget_conscious: z
        .boolean()
        .default(false)
        .describe('Prioritize medications covered by health basket'),
      immediate_availability: z
        .boolean()
        .default(false)
        .describe('Focus on over-the-counter medications available immediately'),
    })
    .optional(),
  search_scope: z
    .enum(['exact_match', 'similar_names', 'broad_search'])
    .default('similar_names')
    .describe('How broadly to search for matching medications'),
});

export const SuggestDrugNamesSchema = z.object({
  partial_name: z.string().min(1).describe('Partial or potentially misspelled drug name'),
  search_type: z
    .enum(['trade_names', 'active_ingredients', 'both'])
    .default('both')
    .describe('Type of names to suggest - commercial names, active ingredients, or both'),
  max_suggestions: z
    .number()
    .min(1)
    .max(20)
    .default(10)
    .describe('Maximum number of suggestions to return'),
});

export const FindDrugsForSymptomSchema = z.object({
  primary_category: z.string().min(1).describe("Main symptom category (e.g., 'אף-אוזן-גרון')"),
  specific_symptom: z
    .string()
    .min(1)
    .describe("Specific symptom within category (e.g., 'כאבי גרון')"),
  treatment_preferences: z
    .object({
      otc_preferred: z
        .boolean()
        .default(true)
        .describe('Prefer over-the-counter treatments when available'),
      health_basket_only: z
        .boolean()
        .default(false)
        .describe('Only show medications covered by health basket'),
      max_results: z
        .number()
        .min(1)
        .max(50)
        .default(20)
        .describe('Maximum number of treatment options to return'),
    })
    .optional(),
});

export const ExploreGenericAlternativesSchema = z.object({
  search_criteria: z.object({
    active_ingredient: z
      .string()
      .optional()
      .describe('Specific active ingredient to find alternatives for'),
    atc_code: z.string().optional().describe("ATC therapeutic code (level 4 only, e.g., 'N02BE')"),
    administration_route: z
      .string()
      .optional()
      .describe("Preferred route of administration (e.g., 'פומי', 'עורי')"),
    reference_drug_name: z
      .string()
      .optional()
      .describe('Name of reference drug to find alternatives for'),
  }),
  comparison_criteria: z
    .object({
      include_price_comparison: z
        .boolean()
        .default(true)
        .describe('Include price comparison in results'),
      health_basket_priority: z
        .boolean()
        .default(true)
        .describe('Prioritize medications in health basket'),
      same_strength_only: z
        .boolean()
        .default(false)
        .describe('Only show alternatives with same dosage strength'),
    })
    .optional(),
});

// Information Tool Schemas
export const GetComprehensiveDrugInfoSchema = z.object({
  drug_registration_number: z
    .string()
    .min(1)
    .describe('Official drug registration number from search results'),
  info_depth: z
    .enum(['basic', 'detailed', 'comprehensive'])
    .default('detailed')
    .describe('Level of information detail required'),
  include_clinical_data: z
    .boolean()
    .default(true)
    .describe('Include clinical indications and safety information'),
  language_preference: z
    .enum(['hebrew', 'english', 'both'])
    .default('hebrew')
    .describe('Preferred language for clinical information'),
});

export const VerifyDrugVisualIdentitySchema = z.object({
  drug_registration_number: z
    .string()
    .min(1)
    .describe('Drug registration number to get visual identification for'),
  image_purpose: z
    .enum(['identification', 'verification', 'patient_education'])
    .default('identification')
    .describe('Purpose of requesting drug image'),
});

// Discovery Tool Schemas
export const BrowseAvailableSymptomsSchema = z.object({
  category_filter: z.string().optional().describe('Filter symptoms by specific category'),
  include_popularity: z
    .boolean()
    .default(true)
    .describe('Include popularity statistics for symptoms'),
  max_per_category: z
    .number()
    .min(1)
    .max(50)
    .default(20)
    .describe('Maximum symptoms to show per category'),
  include_popular_symptoms: z
    .boolean()
    .default(false)
    .describe('Include popular symptoms context in the response'),
  max_popular_results: z
    .number()
    .min(1)
    .max(50)
    .default(10)
    .describe('Maximum number of popular symptoms to return if included'),
  clinical_priority_order: z
    .boolean()
    .default(false)
    .describe('Order symptom categories by clinical priority'),
});

export const DiscoverPopularSymptomsSchema = z.object({
  max_results: z
    .number()
    .min(1)
    .max(50)
    .default(10)
    .describe('Maximum number of popular symptoms to return'),
  category_focus: z.string().optional().describe('Focus on symptoms from specific category'),
});

export const ExploreTherapeuticCategoriesSchema = z.object({
  level: z
    .enum(['main_groups', 'subgroups', 'all'])
    .default('main_groups')
    .describe('Level of ATC classification to explore'),
  therapeutic_area: z.string().optional().describe('Filter by anatomical system or medical specialty'),
  search_filter: z.string().optional().describe('Filter categories by text search'),
  include_drug_counts: z
    .boolean()
    .default(true)
    .describe('Include number of drugs in each category'),
  include_usage_patterns: z
    .boolean()
    .default(false)
    .describe('Include prescribing frequency and clinical patterns'),
});

export const ListAdministrationRoutesSchema = z.object({
  include_descriptions: z
    .boolean()
    .default(true)
    .describe('Include clinical descriptions for each route'),
  common_only: z.boolean().default(false).describe('Show only commonly used administration routes'),
  complexity_level: z
    .enum(['simple', 'moderate', 'complex', 'all'])
    .default('all')
    .optional()
    .describe('Filter routes by administration complexity'),
  patient_age_group: z
    .enum(['pediatric', 'adult', 'geriatric', 'all'])
    .default('all')
    .optional()
    .describe('Filter routes by suitability for specific age groups'),
  setting_requirements: z
    .enum(['home_care', 'outpatient', 'hospital', 'emergency', 'all'])
    .default('all')
    .optional()
    .describe('Filter routes by required clinical setting'),
  onset_requirements: z
    .enum(['immediate', 'rapid', 'gradual', 'sustained', 'any'])
    .default('any')
    .optional()
    .describe('Filter routes by desired onset of therapeutic effect'),
});

// Prompt Schemas
export const CompareTherapeuticOptionsSchema = z.object({
  drug_list: z
    .array(z.string())
    .min(1)
    .describe('List of drug names or registration numbers to compare'),
  comparison_criteria: z
    .object({
      efficacy_focus: z
        .object({
          primary_endpoint: z.string().optional(),
          secondary_endpoints: z.string().optional(),
          time_horizon: z.string().optional(),
          population: z.string().optional(),
        })
        .optional(),
      safety_priorities: z
        .object({
          high_risk_populations: z.string().optional(),
          critical_events: z.string().optional(),
          monitoring_level: z.string().optional(),
          risk_tolerance: z.string().optional(),
        })
        .optional(),
      economic_constraints: z
        .object({
          budget_limit: z.string().optional(),
          perspective: z.string().optional(),
          time_horizon: z.string().optional(),
          thresholds: z.string().optional(),
        })
        .optional(),
      patient_factors: z
        .object({
          qol_priorities: z.string().optional(),
          convenience: z.string().optional(),
          cultural: z.string().optional(),
          accessibility: z.string().optional(),
        })
        .optional(),
    })
    .passthrough()
    .optional(), // Allow additional properties (moved passthrough before optional)
  clinical_context: z.string().optional().describe('Specific clinical situation for comparison'),
  target_population: z.string().optional().describe('Demographic or patient group for relevance'),
  decision_framework: z.string().optional().describe('Methodology for weighing comparison factors'),
});

export const DrugSafetyVerificationSchema = z.object({
  drug_name: z.string().min(1).describe('Name of the drug to verify safety for'),
  patient_profile: z.object({
    age_group: z.string().optional().describe('Patient\'s age group (e.g., \'pediatric\', \'geriatric\')'),
    known_allergies: z.array(z.string()).default([]).describe('Known patient allergies'),
    current_medications: z.array(z.string()).default([]).describe('Other medications patient is currently taking'),
    medical_conditions: z.array(z.string()).default([]).describe('Pre-existing medical conditions of the patient'),
  }),
  interaction_focus: z.boolean().default(true).describe('Focus on drug-drug interactions'),
});

export const SymptomToTreatmentWorkflowSchema = z.object({
  symptom_description: z.string().min(1).describe('Detailed description of the patient\'s symptoms'),
  patient_age_group: z
    .enum(['pediatric', 'adult', 'geriatric', 'all'])
    .default('all')
    .describe('Patient\'s age group for treatment guidance'),
  severity_level: z
    .enum(['mild', 'moderate', 'severe', 'unknown'])
    .default('unknown')
    .describe('Perceived severity of symptoms'),
  duration: z.string().optional().describe('Duration of symptoms (e.g., \'2 days\', \'1 week\')'),
});

// Clinical Decision Support Schemas
export const CheckDrugAvailabilityStatusSchema = z.object({
  drug_identifier: z.object({
    name: z.string().optional().describe('Drug name to check'),
    registration_number: z.string().optional().describe('Registration number to check'),
  }),
  include_alternatives: z
    .boolean()
    .default(true)
    .describe('Suggest alternatives if drug is discontinued'),
  safety_focus: z.boolean().default(true).describe('Emphasize safety and regulatory information'),
});

export const AnalyzeBasketCoverageSchema = z.object({
  drug_list: z
    .array(z.string())
    .min(1)
    .describe('List of drug names or registration numbers to analyze'),
  analysis_type: z
    .enum(['coverage_only', 'cost_analysis', 'alternatives_included'])
    .default('cost_analysis')
    .describe('Type of basket analysis to perform'),
  patient_context: z
    .object({
      chronic_treatment: z.boolean().default(false).describe('Long-term treatment consideration'),
      budget_constraints: z.boolean().default(false).describe('Budget is a primary concern'),
    })
    .optional(),
});

// ===== TOOL INPUT TYPES =====
export type DiscoverDrugByNameInput = z.infer<typeof DiscoverDrugByNameSchema>;
export type SuggestDrugNamesInput = z.infer<typeof SuggestDrugNamesSchema>;
export type FindDrugsForSymptomInput = z.infer<typeof FindDrugsForSymptomSchema>;
export type ExploreGenericAlternativesInput = z.infer<typeof ExploreGenericAlternativesSchema>;
export type GetComprehensiveDrugInfoInput = z.infer<typeof GetComprehensiveDrugInfoSchema>;
export type VerifyDrugVisualIdentityInput = z.infer<typeof VerifyDrugVisualIdentitySchema>;
export type BrowseAvailableSymptomsInput = z.infer<typeof BrowseAvailableSymptomsSchema>;
export type DiscoverPopularSymptomsInput = z.infer<typeof DiscoverPopularSymptomsSchema>;
export type ExploreTherapeuticCategoriesInput = z.infer<typeof ExploreTherapeuticCategoriesSchema>;
export type ListAdministrationRoutesInput = z.infer<typeof ListAdministrationRoutesSchema>;
export type CheckDrugAvailabilityStatusInput = z.infer<typeof CheckDrugAvailabilityStatusSchema>;
export type AnalyzeBasketCoverageInput = z.infer<typeof AnalyzeBasketCoverageSchema>;

// Prompt Input Types
export type CompareTherapeuticOptionsInput = z.infer<typeof CompareTherapeuticOptionsSchema> & { [key: string]: unknown };
export type DrugSafetyVerificationInput = z.infer<typeof DrugSafetyVerificationSchema> & { [key: string]: unknown };
export type SymptomToTreatmentWorkflowInput = z.infer<typeof SymptomToTreatmentWorkflowSchema> & { [key: string]: unknown };

// Flat schema for prompt input when complex types are not directly supported by PromptArgsRawShape
export const CompareTherapeuticOptionsFlatSchema = z.object({
  json_input: z.string().describe('JSON string representing CompareTherapeuticOptionsInput'),
});
export type CompareTherapeuticOptionsFlatInput = z.infer<typeof CompareTherapeuticOptionsFlatSchema>;

// ===== MCP RESPONSE FORMATS =====

export interface McpSuccessResponse<T> {
  success: true;
  data: T;
  content: Array<
    { type: 'text'; text: string; } |
    { type: 'image'; data: string; mimeType: string; } |
    { type: 'resource'; resource: { uri: string; text: string; mimeType?: string; }; } // Added resource type
  >;
  metadata: {
    total_results: number;
    query_time: string;
    data_source: 'israel_ministry_of_health';
    last_updated: string;
    api_version: string;
    clinical_analysis?: Record<string, unknown>; // Added
    safety_assessment?: Record<string, unknown>; // Added
    regulatory_status?: Record<string, unknown>; // Added
    image_quality_assessment?: string; // Added for drugImage.ts
    verification_complexity?: string; // Added for drugImage.ts
  };
  clinical_notes: string[];
  warnings: string[];
  next_suggested_actions: Array<{
    tool: string;
    reason: string;
    parameters_hint: string;
  }>;
  [key: string]: unknown; // Added index signature
}

export interface McpErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    timestamp: string;
    suggestions: string[];
    clinical_context: string | undefined;
    details: Record<string, unknown> | undefined;
    clinical_safety?: {
      level: 'low' | 'medium' | 'high' | 'critical';
      action_required: string;
      patient_guidance: string;
      provider_notification: boolean;
    }; // Added
    recovery_info?: {
      is_recoverable: boolean;
      strategy: 'retry' | 'alternative' | 'user_action' | 'abort';
      retry_delay_ms?: number;
    }; // Added
  };
  content: Array<
    { type: 'text'; text: string; } |
    { type: 'resource'; resource: { uri: string; text: string; mimeType?: string; }; } // Added resource type for consistency
  >;
  partial_data: unknown | undefined;
  recovery_actions: string[];
  [key: string]: unknown; // Added index signature
}

export type McpResponse<T> = McpSuccessResponse<T> | McpErrorResponse;

// ===== RESOURCE TYPES =====

export interface SymptomHierarchyResource {
  categories: Array<{
    name: string;
    symptoms: Array<{
      id: number;
      name: string;
      popularity_rank: number | null;
      common_treatments: string[];
    }>;
  }>;
  total_categories: number;
  total_symptoms: number;
  last_updated: string;
}

export interface TherapeuticCategoriesResource {
  atc_hierarchy: Array<{
    code: string;
    name: string;
    level: number;
    parent_code: string | null;
    drug_count: number;
    clinical_description: string;
  }>;
  total_codes: number;
  classification_version: string;
}

export interface AdministrationRoutesResource {
  routes: Array<{
    id: number;
    name_hebrew: string;
    name_english: string;
    clinical_description: string;
    common_usage: string[];
    special_considerations: string[];
  }>;
  total_routes: number;
  clinical_guidelines_url: string | null;
}

// ===== PROMPT TYPES =====

// ===== PROCESSED/ENHANCED TYPES FOR MCP =====

export interface ProcessedDrug {
  registrationNumber: string;
  hebrewName: string;
  englishName: string;
  activeIngredients: string[];
  dosageForm: string;
  administrationRoute: string;
  requiresPrescription: boolean;
  inHealthBasket: boolean;
  isActive: boolean;
  discontinuedDate: string | null;
  maxPrice: number | null;
  manufacturer: string;
  images: string[];
  atcCodes: {
    level4: string;
    level5: string;
    description: string;
  }[];
  packages: Array<{
    description: string;
    price: number;
    quantity: string;
  }>;
  clinicalInfo: {
    indications: string;
    warnings: string[];
    brochures: Array<{
      language: string;
      type: string;
      url: string;
    }>;
  };
}

export interface ProcessedSymptom {
  id: number;
  name: string;
  category: string;
  popularity: number | null;
}

export interface ProcessedSearchResult {
  query: string;
  totalResults: number;
  page: number;
  totalPages: number;
  drugs: ProcessedDrug[];
  filters: {
    prescriptionOnly: boolean;
    healthBasketOnly: boolean;
    activeOnly: boolean;
  };
  suggestions: string[];
  warnings: string[];
}
