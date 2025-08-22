/**
 * Input validation utilities for Israel Drugs MCP Server
 * Validates and sanitizes user inputs with clinical context awareness
 */

import { z } from "zod";
import { API_BEHAVIOR, CLINICAL_MAPPINGS } from "../config/constants.js";
import { IsraelDrugsError, ErrorType, ErrorSeverity } from "../types/errors.js";

// ===== BASIC VALIDATION SCHEMAS =====

export const DrugNameSchema = z.string()
  .min(1, "Drug name cannot be empty")
  .max(100, "Drug name too long")
  .regex(/^[\u0590-\u05FFa-zA-Z0-9\s\-\.]+$/, "Drug name contains invalid characters");

export const DrugRegistrationNumberSchema = z.string()
  .regex(/^\d{3}\s\d{2}\s\d{5}\s\d{2}$/, "Invalid drug registration number format");

export const AtcCodeSchema = z.string()
  .regex(/^[A-Z]\d{2}[A-Z]{2}$/, "ATC code must be exactly 4 characters (level 4)")
  .length(API_BEHAVIOR.ATC_CONSTRAINTS.LEVEL_4_LENGTH, "Only ATC level 4 codes are supported");

export const SymptomNameSchema = z.string()
  .min(1, "Symptom name cannot be empty")
  .max(50, "Symptom name too long")
  .regex(/^[\u0590-\u05FFa-zA-Z\s\-]+$/, "Symptom name contains invalid characters");

export const PageIndexSchema = z.number()
  .int("Page index must be an integer")
  .min(API_BEHAVIOR.PAGINATION.FIRST_PAGE, "Page index must start from 1")
  .max(1000, "Page index too high");

// ===== VALIDATION FUNCTIONS =====

/**
 * Validates and normalizes drug name input
 */
export function validateDrugName(input: string): string {
  try {
    const trimmed = input.trim();
    const validated = DrugNameSchema.parse(trimmed);
    
    // Normalize common variations
    return normalizeHebrewText(validated);
  } catch (error) {
    throw new IsraelDrugsError(
      ErrorType.INVALID_INPUT,
      `Invalid drug name: ${input}`,
      {
        severity: ErrorSeverity.LOW,
        suggestions: [
          "Use Hebrew or English characters only",
          "Check for typos in the drug name",
          "Try using 'suggest_drug_names' tool for spelling help"
        ],
        details: { input, error: error instanceof Error ? error.message : String(error) }
      }
    );
  }
}

/**
 * Validates drug registration number format
 */
export function validateDrugRegistrationNumber(input: string): string {
  try {
    const trimmed = input.trim();
    return DrugRegistrationNumberSchema.parse(trimmed);
  } catch (error) {
    throw new IsraelDrugsError(
      ErrorType.INVALID_DRUG_REGISTRATION,
      `Invalid drug registration number format: ${input}`,
      {
        severity: ErrorSeverity.MEDIUM,
        suggestions: [
          "Registration number should be in format: XXX XX XXXXX XX",
          "Use registration numbers from search results",
          "Verify the number from official drug packaging"
        ],
        details: { input, expectedFormat: "XXX XX XXXXX XX" }
      }
    );
  }
}

/**
 * Validates and converts ATC code to level 4 format
 */
export function validateAtcCode(input: string): string {
  const trimmed = input.trim().toUpperCase();
  
  // If it's level 5 (6 chars), convert to level 4
  if (trimmed.length === API_BEHAVIOR.ATC_CONSTRAINTS.LEVEL_5_LENGTH) {
    const level4Code = trimmed.substring(0, API_BEHAVIOR.ATC_CONSTRAINTS.LEVEL_4_LENGTH);
    console.warn(`ATC level 5 code '${trimmed}' converted to level 4: '${level4Code}'`);
    return validateAtcCode(level4Code); // Recursive validation
  }
  
  try {
    return AtcCodeSchema.parse(trimmed);
  } catch (error) {
    throw new IsraelDrugsError(
      ErrorType.INVALID_ATC_CODE,
      `Invalid ATC code: ${input}`,
      {
        severity: ErrorSeverity.MEDIUM,
        suggestions: [
          "Use ATC level 4 codes only (4 characters, e.g., 'N02BE')",
          "Get ATC codes from 'explore_therapeutic_categories' tool",
          "Level 5 codes are automatically converted to level 4"
        ],
        details: { 
          input, 
          expectedFormat: "4 characters (e.g., N02BE)",
          supportedLevel: 4 
        }
      }
    );
  }
}

/**
 * Validates symptom category and name
 */
export function validateSymptomInput(category: string, symptom: string): { category: string; symptom: string } {
  try {
    const validatedCategory = SymptomNameSchema.parse(category.trim());
    const validatedSymptom = SymptomNameSchema.parse(symptom.trim());
    
    return {
      category: normalizeHebrewText(validatedCategory),
      symptom: normalizeHebrewText(validatedSymptom)
    };
  } catch (error) {
    throw new IsraelDrugsError(
      ErrorType.INVALID_SYMPTOM_CATEGORY,
      `Invalid symptom input: ${category} / ${symptom}`,
      {
        severity: ErrorSeverity.LOW,
        suggestions: [
          "Use symptom names from 'browse_available_symptoms' tool",
          "Check Hebrew spelling of symptom names",
          "Ensure category and symptom match the system hierarchy"
        ],
        details: { category, symptom }
      }
    );
  }
}

/**
 * Validates and normalizes page index (API starts from 1)
 */
export function validatePageIndex(input: number): number {
  try {
    return PageIndexSchema.parse(input);
  } catch (error) {
    throw new IsraelDrugsError(
      ErrorType.INVALID_INPUT,
      `Invalid page index: ${input}`,
      {
        severity: ErrorSeverity.LOW,
        suggestions: [
          "Page numbering starts from 1, not 0",
          "Use reasonable page numbers (< 1000)"
        ],
        details: { input, minValue: API_BEHAVIOR.PAGINATION.FIRST_PAGE }
      }
    );
  }
}

/**
 * Validates administration route ID
 */
export function validateAdministrationRoute(routeId: number): number {
  const validRoutes = Object.values(CLINICAL_MAPPINGS.ADMIN_ROUTES);
  
  if (!validRoutes.includes(routeId)) {
    throw new IsraelDrugsError(
      ErrorType.INVALID_INPUT,
      `Invalid administration route ID: ${routeId}`,
      {
        severity: ErrorSeverity.MEDIUM,
        suggestions: [
          "Use route IDs from 'list_administration_routes' tool",
          "Common routes: 17 (oral), 2 (topical), 15 (eye), 16 (ear)"
        ],
        details: { 
          input: routeId, 
          validRoutes: validRoutes,
          commonRoutes: CLINICAL_MAPPINGS.ADMIN_ROUTES 
        }
      }
    );
  }
  
  return routeId;
}

// ===== SANITIZATION FUNCTIONS =====

/**
 * Normalizes Hebrew text for consistent searching
 */
export function normalizeHebrewText(text: string): string {
  return text
    .trim()
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    // Normalize Hebrew characters
    .replace(/ו/g, 'ו')  // Standardize vav
    .replace(/י/g, 'י')  // Standardize yod
    // Remove common suffixes/prefixes that might interfere
    .replace(/^ה/, '')   // Remove definite article 'ה'
    .trim();
}

/**
 * Sanitizes search query for API calls
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .substring(0, 100) // Limit length
    .replace(/[<>\"';&]/g, ''); // Remove potentially harmful characters
}

/**
 * Validates prescription preference and converts to API format
 */
export function validatePrescriptionPreference(preference: "has_prescription" | "otc_only" | "either"): boolean {
  switch (preference) {
    case "otc_only":
      return API_BEHAVIOR.PRESCRIPTION_LOGIC.OTC_ONLY; // true
    case "has_prescription":
    case "either":
    default:
      return API_BEHAVIOR.PRESCRIPTION_LOGIC.ALL_DRUGS; // false
  }
}

/**
 * Validates health basket preference
 */
export function validateHealthBasketPreference(budgetConscious: boolean): boolean {
  return budgetConscious; // Direct mapping - true means health basket only
}

// ===== COMPLEX VALIDATION FUNCTIONS =====

/**
 * Validates complete search criteria and provides suggestions
 */
export function validateSearchCriteria(criteria: {
  query?: string;
  atcCode?: string; 
  administrationRoute?: number;
  prescriptionAccess?: "has_prescription" | "otc_only" | "either";
  healthBasketOnly?: boolean;
}): {
  validatedCriteria: Record<string, unknown>;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  const validatedCriteria: Record<string, unknown> = {};

  // Validate query if provided
  if (criteria.query) {
    validatedCriteria.query = validateDrugName(criteria.query);
  }

  // Validate ATC code if provided
  if (criteria.atcCode) {
    validatedCriteria.atcCode = validateAtcCode(criteria.atcCode);
  }

  // Validate administration route if provided  
  if (criteria.administrationRoute) {
    validatedCriteria.administrationRoute = validateAdministrationRoute(criteria.administrationRoute);
  }

  // Convert prescription preference
  if (criteria.prescriptionAccess) {
    validatedCriteria.prescription = validatePrescriptionPreference(criteria.prescriptionAccess);
  }

  // Set health basket preference
  if (criteria.healthBasketOnly) {
    validatedCriteria.healthServices = validateHealthBasketPreference(criteria.healthBasketOnly);
  }

  // Provide contextual suggestions
  if (!criteria.query && !criteria.atcCode && !criteria.administrationRoute) {
    warnings.push("No specific search criteria provided - results may be very broad");
    suggestions.push("Consider providing drug name, ATC code, or administration route for better results");
  }

  if (criteria.query && criteria.query.length < 3) {
    warnings.push("Very short search query may return too many results");
    suggestions.push("Use 'suggest_drug_names' tool to get more specific names");
  }

  return { validatedCriteria, warnings, suggestions };
}

/**
 * Validates tool input and provides recovery suggestions
 */
export function validateToolInput<T>(
  schema: z.ZodSchema<T>, 
  input: unknown, 
  toolName: string
): { data: T; warnings: string[] } {
  const warnings: string[] = [];
  
  try {
    const data = schema.parse(input);
    return { data, warnings };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('; ');
      
      throw new IsraelDrugsError(
        ErrorType.INVALID_INPUT,
        `Invalid input for ${toolName}: ${details}`,
        {
          severity: ErrorSeverity.MEDIUM,
          suggestions: [
            "Check the required parameters for this tool",
            "Ensure all required fields are provided",
            "Verify data types match the expected schema"
          ],
          details: { 
            tool: toolName, 
            errors: error.errors,
            input 
          }
        }
      );
    }
    
    throw error;
  }
}