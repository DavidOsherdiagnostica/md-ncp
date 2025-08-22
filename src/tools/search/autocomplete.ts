/**
 * Drug Name Auto-Completion Tool
 * Helps AI agents verify and correct drug name spelling
 * Transforms SearchBoxAutocomplete API into intelligent name suggestion system
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SuggestDrugNamesSchema, SuggestDrugNamesInput, McpResponse } from "../../types/mcp.js";
import { getApiClient } from "../../services/israelDrugsApi.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput, sanitizeSearchQuery } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";
import { API_BEHAVIOR } from "../../config/constants.js";

// ===== TOOL REGISTRATION =====

export function registerAutocompleteTool(server: McpServer): void {
  server.registerTool(
    "suggest_drug_names",
    {
      title: "Drug Name Suggestions",
      description: `Provides accurate spelling suggestions for drug names when dealing with partial or potentially misspelled medication names. This tool helps ensure precise medication identification by offering corrected spellings and alternative names.

**Clinical Purpose:** Essential for accurate medication identification and patient safety. Helps avoid medication errors due to similar drug names or spelling variations.

**When to Use:**
- User provides partial drug name that needs completion
- Suspected spelling errors in drug names  
- Need to verify exact drug name before prescribing or dispensing
- Exploring name variations (brand vs generic names)

**Search Types:**
- trade_names: Commercial/brand medication names
- active_ingredients: Chemical compound names  
- both: Comprehensive search across all name types (recommended)

**Output:** Returns ranked list of accurate drug names with confidence indicators and name type classifications.

**Clinical Context:** Medication name accuracy is critical for patient safety. This tool should be used whenever there's uncertainty about exact drug spelling or when exploring therapeutic alternatives.`,
      inputSchema: SuggestDrugNamesSchema
    },
    async (input: SuggestDrugNamesInput) => {
      const startTime = Date.now();
      
      try {
        // Validate and sanitize input
        const { data: validatedInput } = validateToolInput(
          SuggestDrugNamesSchema,
          input,
          "suggest_drug_names"
        );
        
        const sanitizedQuery = sanitizeSearchQuery(validatedInput.partial_name);
        
        // Transform MCP request to API format
        const apiRequest = {
          val: sanitizedQuery,
          isSearchTradeName: validatedInput.search_type === "active_ingredients" ? "0" : "1",
          isSearchTradeMarkiv: validatedInput.search_type === "trade_names" ? "0" : "1"
        };
        
        // Call API
        const apiClient = getApiClient();
        const apiResponse = await apiClient.searchBoxAutocomplete(apiRequest);
        
        // Process and format response
        const suggestions = apiResponse.results
          .slice(0, validatedInput.max_suggestions)
          .map((suggestion, index) => ({
            name: suggestion,
            confidence: this.calculateConfidence(suggestion, sanitizedQuery),
            rank: index + 1,
            name_type: this.determineNameType(suggestion, validatedInput.search_type),
            similarity_score: this.calculateSimilarity(suggestion, sanitizedQuery)
          }));
        
        // Create comprehensive response
        const responseData = {
          query: sanitizedQuery,
          search_type: validatedInput.search_type,
          suggestions: suggestions,
          total_suggestions: suggestions.length,
          search_strategy: this.determineSearchStrategy(validatedInput),
          spelling_analysis: this.analyzeSpelling(sanitizedQuery, suggestions),
          clinical_considerations: this.generateClinicalConsiderations(suggestions)
        };
        
        const formatter = getResponseFormatter();
        return this.createAutocompleteResponse(responseData, startTime);
        
      } catch (error) {
        const classifiedError = classifyError(error, "suggest_drug_names");
        return createComprehensiveErrorResponse(classifiedError, undefined, {
          toolName: "suggest_drug_names",
          userInput: input,
          attemptNumber: 1
        });
      }
    }
  );
}

// ===== HELPER METHODS =====

class AutocompleteToolHelper {
  
  /**
   * Calculates confidence score for suggestion based on query similarity
   */
  private calculateConfidence(suggestion: string, query: string): "high" | "medium" | "low" {
    const similarity = this.calculateSimilarity(suggestion, query);
    
    if (similarity > 0.8) return "high";
    if (similarity > 0.5) return "medium";
    return "low";
  }
  
  /**
   * Calculates similarity score between suggestion and query
   */
  private calculateSimilarity(suggestion: string, query: string): number {
    const suggestionLower = suggestion.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Exact prefix match gets highest score
    if (suggestionLower.startsWith(queryLower)) {
      return 0.9 + (queryLower.length / suggestionLower.length) * 0.1;
    }
    
    // Contains query gets medium score
    if (suggestionLower.includes(queryLower)) {
      return 0.6 + (queryLower.length / suggestionLower.length) * 0.3;
    }
    
    // Levenshtein distance for fuzzy matching
    const distance = this.levenshteinDistance(queryLower, suggestionLower);
    const maxLength = Math.max(queryLower.length, suggestionLower.length);
    
    return Math.max(0, 1 - (distance / maxLength));
  }
  
  /**
   * Calculates Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  /**
   * Determines the type of name (trade name vs active ingredient)
   */
  private determineNameType(
    suggestion: string, 
    searchType: "trade_names" | "active_ingredients" | "both"
  ): "trade_name" | "active_ingredient" | "unknown" {
    if (searchType === "trade_names") return "trade_name";
    if (searchType === "active_ingredients") return "active_ingredient";
    
    // Heuristics for mixed search
    const suggestionUpper = suggestion.toUpperCase();
    
    // Active ingredients often have all caps or scientific naming patterns
    if (suggestionUpper === suggestion && suggestion.length > 5) {
      return "active_ingredient";
    }
    
    // Trade names often have mixed case and brand-like patterns
    if (suggestion.match(/^[A-Z][a-z]+/)) {
      return "trade_name";
    }
    
    return "unknown";
  }
  
  /**
   * Determines search strategy based on input parameters
   */
  private determineSearchStrategy(input: SuggestDrugNamesInput): string {
    const queryLength = input.partial_name.length;
    
    if (queryLength < 3) {
      return "broad_prefix_matching";
    } else if (queryLength < 6) {
      return "targeted_similarity_search";
    } else {
      return "precise_completion_search";
    }
  }
  
  /**
   * Analyzes spelling patterns in the query
   */
  private analyzeSpelling(query: string, suggestions: any[]): Record<string, unknown> {
    const hasHebrewChars = /[\u0590-\u05FF]/.test(query);
    const hasEnglishChars = /[a-zA-Z]/.test(query);
    const hasNumbers = /\d/.test(query);
    
    const commonMistakes = this.identifyCommonMistakes(query, suggestions);
    
    return {
      language_detected: hasHebrewChars ? "hebrew" : hasEnglishChars ? "english" : "mixed",
      contains_numbers: hasNumbers,
      query_length: query.length,
      potential_mistakes: commonMistakes,
      spelling_confidence: suggestions.length > 0 ? "suggestions_available" : "no_matches_found"
    };
  }
  
  /**
   * Identifies common spelling mistakes
   */
  private identifyCommonMistakes(query: string, suggestions: any[]): string[] {
    const mistakes: string[] = [];
    
    if (suggestions.length === 0) {
      mistakes.push("no_similar_names_found");
      return mistakes;
    }
    
    const topSuggestion = suggestions[0]?.name || "";
    const queryLower = query.toLowerCase();
    const suggestionLower = topSuggestion.toLowerCase();
    
    // Common Hebrew/English mix-ups
    if (queryLower !== suggestionLower) {
      if (Math.abs(queryLower.length - suggestionLower.length) <= 2) {
        mistakes.push("minor_spelling_variation");
      }
      
      if (queryLower.length < suggestionLower.length * 0.7) {
        mistakes.push("incomplete_name");
      }
      
      if (this.hasTransliterationIssues(queryLower, suggestionLower)) {
        mistakes.push("transliteration_variation");
      }
    }
    
    return mistakes;
  }
  
  /**
   * Checks for transliteration issues between Hebrew and English
   */
  private hasTransliterationIssues(query: string, suggestion: string): boolean {
    const transliterationPairs = [
      ['k', 'c'], ['f', 'ph'], ['i', 'y'], ['ts', 'z']
    ];
    
    return transliterationPairs.some(([a, b]) => 
      (query.includes(a) && suggestion.includes(b)) ||
      (query.includes(b) && suggestion.includes(a))
    );
  }
  
  /**
   * Generates clinical considerations for the suggestions
   */
  private generateClinicalConsiderations(suggestions: any[]): string[] {
    const considerations: string[] = [];
    
    if (suggestions.length === 0) {
      considerations.push("No matching medications found - verify medication name with prescriber");
      considerations.push("Consider searching by therapeutic indication or active ingredient");
      return considerations;
    }
    
    if (suggestions.length === 1) {
      considerations.push("Single exact match found - verify this is the intended medication");
    } else {
      considerations.push("Multiple similar names found - ensure correct medication selection");
    }
    
    // Check for sound-alike medications
    if (suggestions.length > 1) {
      considerations.push("Be aware of look-alike/sound-alike medication names");
      considerations.push("Verify dosage strength and indication match prescription");
    }
    
    considerations.push("Always confirm medication details with authoritative sources");
    
    return considerations;
  }
  
  /**
   * Creates formatted response for autocomplete results
   */
  private createAutocompleteResponse(data: any, startTime: number): McpResponse<any> {
    const queryTime = Date.now() - startTime;
    
    return {
      success: true,
      data,
      metadata: {
        total_results: data.total_suggestions,
        query_time: `${queryTime}ms`,
        data_source: "israel_ministry_of_health",
        last_updated: new Date().toISOString(),
        api_version: "1.0.0"
      },
      clinical_notes: [
        "Medication name accuracy is critical for patient safety",
        "Always verify final medication selection with healthcare provider",
        "Consider both brand and generic name variations"
      ],
      warnings: this.generateAutocompleteWarnings(data),
      next_suggested_actions: this.generateNextActions(data)
    };
  }
  
  /**
   * Generates warnings for autocomplete results
   */
  private generateAutocompleteWarnings(data: any): string[] {
    const warnings: string[] = [];
    
    if (data.total_suggestions === 0) {
      warnings.push("No medication names match your query");
      warnings.push("Verify spelling or try different search terms");
    }
    
    if (data.suggestions.some((s: any) => s.confidence === "low")) {
      warnings.push("Some suggestions have low confidence - verify accuracy");
    }
    
    if (data.spelling_analysis.potential_mistakes.length > 0) {
      warnings.push("Potential spelling issues detected in query");
    }
    
    return warnings;
  }
  
  /**
   * Generates next action suggestions
   */
  private generateNextActions(data: any): Array<{ tool: string; reason: string; parameters_hint: string }> {
    const actions: Array<{ tool: string; reason: string; parameters_hint: string }> = [];
    
    if (data.total_suggestions > 0) {
      // Suggest using exact names for detailed search
      const topSuggestion = data.suggestions[0]?.name;
      if (topSuggestion) {
        actions.push({
          tool: "discover_drug_by_name",
          reason: "Search for detailed information using suggested exact name",
          parameters_hint: `medication_query: "${topSuggestion}"`
        });
      }
      
      // Suggest exploring alternatives
      actions.push({
        tool: "explore_generic_alternatives",
        reason: "Find generic or therapeutic alternatives",
        parameters_hint: "Use active ingredient from suggestions"
      });
    } else {
      // No suggestions found - recommend alternative approaches
      actions.push({
        tool: "find_drugs_for_symptom",
        reason: "Search by medical condition instead of drug name",
        parameters_hint: "Browse available symptoms first"
      });
      
      actions.push({
        tool: "explore_therapeutic_categories",
        reason: "Browse medications by therapeutic category",
        parameters_hint: "Explore ATC classification system"
      });
    }
    
    return actions;
  }
}

// Create helper instance
const helper = new AutocompleteToolHelper();

// Bind helper methods to make them accessible in the tool function
const calculateConfidence = helper['calculateConfidence'].bind(helper);
const calculateSimilarity = helper['calculateSimilarity'].bind(helper);
const determineNameType = helper['determineNameType'].bind(helper);
const determineSearchStrategy = helper['determineSearchStrategy'].bind(helper);
const analyzeSpelling = helper['analyzeSpelling'].bind(helper);
const generateClinicalConsiderations = helper['generateClinicalConsiderations'].bind(helper);
const createAutocompleteResponse = helper['createAutocompleteResponse'].bind(helper);

// Export the helper methods for use in the tool function
export { 
  calculateConfidence as calculateConfidence,
  calculateSimilarity as calculateSimilarity,
  determineNameType as determineNameType,
  determineSearchStrategy as determineSearchStrategy,
  analyzeSpelling as analyzeSpelling,
  generateClinicalConsiderations as generateClinicalConsiderations,
  createAutocompleteResponse as createAutocompleteResponse
};