/**
 * MCP-specific types for Israel Drugs Server
 * Designed for AI consumption with clinical context
 */

import { z } from "zod";

// ===== TOOL INPUT SCHEMAS =====

// Discovery & Search Tool Schemas
export const DiscoverDrugByNameSchema = z.object({
  medication_query: z.string().min(1).describe("Drug name or partial name to search for"),
  patient_preferences: z.object({
    prescription_access: z.enum(["has_prescription", "otc_only", "either"]).default("either")
      .describe("Patient's access to prescription medications"),
    budget_conscious: z.boolean().default(false)
      .describe("Prioritize medications covered by health basket"),
    immediate_availability: z.boolean().default(false)
      .describe("Focus on over-the-counter medications available immediately")
  }).optional(),
  search_scope: z.enum(["exact_match", "similar_names", "broad_search"]).default("similar_names")
    .describe("How broadly to search for matching medications")
});

export const SuggestDrugNamesSchema = z.object({
  partial_name: z.string().min(1).describe("Partial or potentially misspelled drug name"),
  search_type: z.enum(["trade_names", "active_ingredients", "both"]).default("both")
    .describe("Type of names to suggest - commercial names, active ingredients, or both"),
  max_suggestions: z.number().min(1).max(20).default(10)
    .describe("Maximum number of suggestions to return")
});

export const FindDrugsForSymptomSchema = z.object({
  primary_category: z.string().min(1).describe("Main symptom category (e.g., 'אף-אוזן-גרון')"),
  specific_symptom: z.string().min(1).describe("Specific symptom within category (e.g., 'כאבי גרון')"),
  treatment_preferences: z.object({
    otc_preferred: z.boolean().default(true)
      .describe("Prefer over-the-counter treatments when available"),
    health_basket_only: z.boolean().default(false)
      .describe("Only show medications covered by health basket"),
    max_results: z.number().min(1).max(50).default(20)
      .describe("Maximum number of treatment options to return")
  }).optional()
});

export const ExploreGenericAlternativesSchema = z.object({
  search_criteria: z.object({
    active_ingredient: z.string().optional()
      .describe("Specific active ingredient to find alternatives for"),
    atc_code: z.string().optional()
      .describe("ATC therapeutic code (level 4 only, e.g., 'N02BE')"),
    administration_route: z.string().optional()
      .describe("Preferred route of administration (e.g., 'פומי', 'עורי')"),
    reference_drug_name: z.string().optional()
      .describe("Name of reference drug to find alternatives for")
  }),
  comparison_criteria: z.object({
    include_price_comparison: z.boolean().default(true)
      .describe("Include price comparison in results"),
    health_basket_priority: z.boolean().default(true)
      .describe("Prioritize medications in health basket"),
    same_strength_only: z.boolean().default(false)
      .describe("Only show alternatives with same dosage strength")
  }).optional()
});

// Information Tool Schemas
export const GetComprehensiveDrugInfoSchema = z.object({
  drug_registration_number: z.string().min(1)
    .describe("Official drug registration number from search results"),
  info_depth: z.enum(["basic", "detailed", "comprehensive"]).default("detailed")
    .describe("Level of information detail required"),
  include_clinical_data: z.boolean().default(true)
    .describe("Include clinical indications and safety information"),
  language_preference: z.enum(["hebrew", "english", "both"]).default("hebrew")
    .describe("Preferred language for clinical information")
});

export const VerifyDrugVisualIdentitySchema = z.object({
  drug_registration_number: z.string().min(1)
    .describe("Drug registration number to get visual identification for"),
  image_purpose: z.enum(["identification", "verification", "patient_education"]).default("identification")
    .describe("Purpose of requesting drug image")
});

// Discovery Tool Schemas
export const BrowseAvailableSymptomsSchema = z.object({
  category_filter: z.string().optional()
    .describe("Filter symptoms by specific category"),
  include_popularity: z.boolean().default(true)
    .describe("Include popularity statistics for symptoms"),
  max_per_category: z.number().min(1).max(50).default(20)
    .describe("Maximum symptoms to show per category")
});

export const DiscoverPopularSymptomsSchema = z.object({
  max_results: z.number().min(1).max(50).default(10)
    .describe("Maximum number of popular symptoms to return"),
  category_focus: z.string().optional()
    .describe("Focus on symptoms from specific category")
});

export const ExploreTherapeuticCategoriesSchema = z.object({
  level: z.enum(["main_groups", "subgroups", "all"]).default("main_groups")
    .describe("Level of ATC classification to explore"),
  search_filter: z.string().optional()
    .describe("Filter categories by text search"),
  include_drug_counts: z.boolean().default(true)
    .describe("Include number of drugs in each category")
});

export const ListAdministrationRoutesSchema = z.object({
  include_descriptions: z.boolean().default(true)
    .describe("Include clinical descriptions for each route"),
  common_only: z.boolean().default(false)
    .describe("Show only commonly used administration routes")
});

// Clinical Decision Support Schemas
export const CheckDrugAvailabilityStatusSchema = z.object({
  drug_identifier: z.object({
    name: z.string().optional().describe("Drug name to check"),
    registration_number: z.string().optional().describe("Registration number to check")
  }),
  include_alternatives: z.boolean().default(true)
    .describe("Suggest alternatives if drug is discontinued"),
  safety_focus: z.boolean().default(true)
    .describe("Emphasize safety and regulatory information")
});

export const AnalyzeBasketCoverageSchema = z.object({
  drug_list: z.array(z.string()).min(1)
    .describe("List of drug names or registration numbers to analyze"),
  analysis_type: z.enum(["coverage_only", "cost_analysis", "alternatives_included"]).default("cost_analysis")
    .describe("Type of basket analysis to perform"),
  patient_context: z.object({
    chronic_treatment: z.boolean().default(false).describe("Long-term treatment consideration"),
    budget_constraints: z.boolean().default(false).describe("Budget is a primary concern")
  }).optional()
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

// ===== MCP RESPONSE FORMATS =====

export interface McpSuccessResponse<T> {
  success: true;
  data: T;
  metadata: {
    total_results: number;
    query_time: string;
    data_source: "israel_ministry_of_health";
    last_updated: string;
    api_version: string;
  };
  clinical_notes: string[];
  warnings: string[];
  next_suggested_actions: Array<{
    tool: string;
    reason: string;
    parameters_hint: string;
  }>;
}

export interface McpErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    severity: "low" | "medium" | "high" | "critical";
    type: string;
    timestamp: string;
    suggestions: string[];
    clinical_context: string | undefined;
    details: Record<string, unknown> | undefined;
  };
  partial_data: unknown | undefined;
  recovery_actions: string[];
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

export interface DrugComparisonPromptArgs {
  drug_list: string[];
  comparison_criteria: Array<"efficacy" | "safety" | "cost" | "availability" | "side_effects">;
  patient_context: string | undefined;
  clinical_focus: string | undefined;
}

export interface SymptomGuidePromptArgs {
  symptom_description: string;
  patient_age_group: "pediatric" | "adult" | "geriatric" | "all";
  severity_level: "mild" | "moderate" | "severe" | "unknown";
  duration: string | undefined;
}

export interface SafetyCheckPromptArgs {
  drug_name: string;
  patient_profile: {
    age_group: string | undefined;
    known_allergies: string[];
    current_medications: string[];
    medical_conditions: string[];
  };
  interaction_focus: boolean;
}