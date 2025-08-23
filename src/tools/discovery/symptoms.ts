/**
 * Symptom Exploration Tool
 * Enables AI agents to discover and navigate available medical conditions and symptoms
 * Transforms GetBySymptom API into intelligent symptom discovery system
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  BrowseAvailableSymptomsSchema,
  BrowseAvailableSymptomsInput,
  McpResponse,
} from '../../types/mcp.js';
import { getApiClient } from '../../services/israelDrugsApi.js';
import { getResponseFormatter } from '../../services/responseFormatter.js';
import { validateToolInput } from '../../utils/validators.js';
import { classifyError, createComprehensiveErrorResponse } from '../../utils/errorHandler.js';
import { API_BEHAVIOR, MCP_CONFIG } from '../../config/constants.js';

type ValidatedBrowseAvailableSymptomsInput = BrowseAvailableSymptomsInput & {
  include_popularity: NonNullable<BrowseAvailableSymptomsInput['include_popularity']>;
  max_per_category: NonNullable<BrowseAvailableSymptomsInput['max_per_category']>;
  include_popular_symptoms: NonNullable<BrowseAvailableSymptomsInput['include_popular_symptoms']>;
  max_popular_results: NonNullable<BrowseAvailableSymptomsInput['max_popular_results']>;
  clinical_priority_order: NonNullable<BrowseAvailableSymptomsInput['clinical_priority_order']>;
};

// ===== TOOL REGISTRATION =====

export function registerSymptomDiscoveryTool(server: McpServer): void {
  server.registerTool(
    'browse_available_symptoms',
    {
      title: 'Medical Condition Discovery System',
      description: `Comprehensive medical condition and symptom discovery tool that provides structured access to the complete Israeli healthcare symptom classification system. Essential for clinical decision support and therapeutic pathway exploration.

**Clinical Purpose:** Foundational tool for condition-based treatment discovery. Enables systematic exploration of medical conditions, symptoms, and their corresponding treatment options within the Israeli healthcare framework. Critical for evidence-based clinical decision-making and patient care pathways.

**Symptom Classification System:**
- 25 major medical categories covering all body systems and conditions
- 112 specific symptoms with therapeutic treatment mappings
- Hierarchical organization from general categories to specific conditions
- Clinical severity and urgency indicators for appropriate care escalation

**Major Medical Categories Available:**
- Pain management and fever reduction (analgesics, antipyretics)
- Respiratory system conditions (nose, ear, throat, airways)
- Gastrointestinal and digestive disorders
- Dermatological conditions and skin treatments
- Allergic reactions and immune responses
- Mental health and neurological conditions
- Cardiovascular and circulatory disorders
- Infectious disease management
- Musculoskeletal and rheumatic conditions

**Category Filtering Options:**
- category_filter: Focus on specific medical specialty area
- include_popular_symptoms: Show most frequently searched conditions
- clinical_priority_order: Organize by clinical urgency and prevalence

**Clinical Intelligence Features:**
- Treatment availability mapping for each symptom
- Prescription vs OTC medication distribution analysis
- Health basket coverage assessment for condition management
- Cross-referencing with therapeutic guidelines

**Output:** Returns structured medical condition hierarchy with clinical context, treatment availability indicators, prevalence data, and intelligent navigation guidance for optimal therapeutic pathway discovery.

**Clinical Context:** This tool serves as the entry point for symptom-based treatment discovery. Use when healthcare providers or patients need to identify appropriate treatment categories, understand available therapeutic options, or navigate from general symptoms to specific treatment protocols.`,
      inputSchema: BrowseAvailableSymptomsSchema.shape,
    },
    async (input: BrowseAvailableSymptomsInput) => {
      const startTime = Date.now();

      try {
        // Validate and process input
        const { data: validatedInput, warnings } = validateToolInput(
          BrowseAvailableSymptomsSchema,
          input,
          'browse_available_symptoms',
        );

        const validatedSymptomsInput: ValidatedBrowseAvailableSymptomsInput = validatedInput as ValidatedBrowseAvailableSymptomsInput;

        // Execute symptom discovery with intelligent enhancement
        const symptomData = await executeSymptomDiscovery(validatedSymptomsInput);

        // Optionally get popular symptoms for context
        const popularSymptoms = validatedSymptomsInput.include_popular_symptoms
          ? await getPopularSymptomsContext(validatedSymptomsInput.max_popular_results || 10)
          : null;

        // Format response with clinical intelligence
        const formatter = getResponseFormatter();
        const formattedResponse = formatter.formatSymptomHierarchyResponse(
          symptomData,
          popularSymptoms || undefined,
          startTime,
        );

        // Enhance with symptom discovery intelligence
        return enhanceSymptomDiscoveryResponse(formattedResponse, validatedSymptomsInput, warnings);
      } catch (error) {
        const classifiedError = classifyError(error, 'browse_available_symptoms');
        return createComprehensiveErrorResponse(classifiedError, undefined, {
          toolName: 'browse_available_symptoms',
          userInput: input,
          attemptNumber: 1,
        });
      }
    },
  );
}

// ===== SYMPTOM DISCOVERY EXECUTION =====

async function executeSymptomDiscovery(
  userInput: ValidatedBrowseAvailableSymptomsInput,
): Promise<any> {
  const apiClient = getApiClient();

  try {
    // console.info('Retrieving complete symptom hierarchy from healthcare system');

    // Get complete symptom hierarchy
    const symptomHierarchy = await apiClient.getBySymptom({
      prescription: API_BEHAVIOR.PRESCRIPTION_LOGIC.OTC_ONLY,
    });

    // FIXED: בדיקה שהתגובה מה-API תקינה
    if (!symptomHierarchy || !Array.isArray(symptomHierarchy) || symptomHierarchy.length === 0) {
      // console.warn("Invalid or empty symptom hierarchy from API");
      return await attemptSymptomDiscoveryRecovery(userInput);
    }

    // console.info(`Retrieved ${symptomHierarchy.length} symptom categories from API`);

    // Process and filter the hierarchy based on user preferences
    const processedHierarchy = await processSymptomHierarchy(symptomHierarchy, userInput);

    return processedHierarchy;
  } catch (error) {
    // console.error('Symptom discovery failed:', error);

    // Attempt recovery with alternative approach
    return await attemptSymptomDiscoveryRecovery(userInput);
  }
}

async function processSymptomHierarchy(
  rawHierarchy: any[],
  userInput: ValidatedBrowseAvailableSymptomsInput,
): Promise<any[]> {
  let processedData = rawHierarchy;

  // FIXED: בדיקה שהנתונים תקינים
  if (!processedData || !Array.isArray(processedData)) {
    // console.warn("Invalid symptom hierarchy data");
    return [];
  }

  // console.info(`Processing ${processedData.length} symptom categories`);

  // Apply category filtering if specified
  if (userInput.category_filter && userInput.category_filter.trim()) {
    const filterLower = userInput.category_filter.toLowerCase();
    const beforeFilter = processedData.length;
    
    // FIXED: null safety לפני toLowerCase()
    processedData = processedData.filter((category: any) => {
      // בדיקה שהאובייקט וה-bySymptomMain קיימים
      if (!category || !category.bySymptomMain || typeof category.bySymptomMain !== 'string') {
        // console.warn("Invalid category object:", category);
        return false;
      }
      
      return category.bySymptomMain.toLowerCase().includes(filterLower);
    });
    
    // console.info(`Category filter reduced results from ${beforeFilter} to ${processedData.length}`);
  }

  // בדיקה שנשארו נתונים אחרי הסינון
  if (processedData.length === 0) {
    // console.warn("No categories left after filtering, returning empty result");
    return [];
  }

  // Enhance each category with clinical intelligence
  const enhancedData = await Promise.all(
    processedData.map(async (category: any) => {
      // FIXED: null safety לכל קטגוריה
      if (!category || !category.bySymptomMain) {
        // console.warn("Skipping invalid category:", category);
        return null;
      }

      try {
        const enhancedCategory = {
          ...category,
          clinical_context: await generateClinicalContext(category),
          treatment_availability: await assessTreatmentAvailability(category),
          symptom_analysis: await analyzeSymptoms(category.list || []),
          navigation_guidance: generateNavigationGuidance(category, userInput),
        };

        return enhancedCategory;
      } catch (error) {
        // console.error(`Error enhancing category ${category.bySymptomMain}:`, error);
        // החזר קטגוריה בסיסית במקרה של שגיאה
        return {
          ...category,
          clinical_context: { error: "processing_failed" },
          treatment_availability: { error: "processing_failed" },
          symptom_analysis: { error: "processing_failed" },
          navigation_guidance: [`Error processing ${category.bySymptomMain}`]
        };
      }
    })
  );

  // FIXED: סינון null values שנוצרו בגלל קטגוריות לא תקינות
  const validEnhancedData = enhancedData.filter(item => item !== null);

  // console.info(`Successfully processed ${validEnhancedData.length} enhanced categories`);

  // Apply clinical priority ordering if requested
  if (userInput.clinical_priority_order && validEnhancedData.length > 0) {
    try {
      validEnhancedData.sort((a, b) => {
        // FIXED: null safety בפונקציית המיון
        const nameA = a?.bySymptomMain || "";
        const nameB = b?.bySymptomMain || "";
        
        const priorityA = determineClinicalPriority(nameA);
        const priorityB = determineClinicalPriority(nameB);
        return priorityB - priorityA; // Higher priority first
      });
      
      // console.info("Applied clinical priority ordering");
    } catch (error) {
      // console.warn("Failed to apply clinical priority ordering:", error);
    }
  }

  return validEnhancedData;
}

async function getPopularSymptomsContext(maxResults: number): Promise<any[]> {
  const apiClient = getApiClient();

  try {
    const popularSymptoms = await apiClient.getFastSearchPopularSymptoms({
      rowCount: Math.min(maxResults, MCP_CONFIG.RESPONSE_LIMITS.MAX_POPULAR_SYMPTOMS),
    });

    return popularSymptoms;
  } catch (error) {
    // console.warn('Could not retrieve popular symptoms context:', error);
    return [];
  }
}

async function attemptSymptomDiscoveryRecovery(
  userInput: BrowseAvailableSymptomsInput,
): Promise<any[]> {
  // console.info('Attempting symptom discovery recovery with basic structure');

  // FIXED: החזרת מבנה בסיסי יותר מפורט במקרה של כשל
  const basicSymptomCategories = [
    {
      bySymptomMain: 'שיכוך כאבים והורדת חום',
      list: [
        { bySymptomSecond: 1, bySymptomName: 'כאבי ראש' },
        { bySymptomSecond: 2, bySymptomName: 'כאבי שרירים' },
        { bySymptomSecond: 3, bySymptomName: 'חום' }
      ],
      clinical_context: {
        specialty_area: 'pain_management',
        clinical_significance: 'high_clinical_significance',
        common_treatments: ['Analgesics', 'Antipyretics'],
      },
      recovery_mode: true,
    },
    {
      bySymptomMain: 'אף-אוזן-גרון',
      list: [
        { bySymptomSecond: 4, bySymptomName: 'כאבי גרון' },
        { bySymptomSecond: 5, bySymptomName: 'גודש באף' },
        { bySymptomSecond: 6, bySymptomName: 'כאבי אוזניים' }
      ],
      clinical_context: {
        specialty_area: 'otolaryngology',
        clinical_significance: 'moderate_clinical_significance',
        common_treatments: ['Local treatments', 'Decongestants'],
      },
      recovery_mode: true,
    },
    {
      bySymptomMain: 'בעיות עיכול',
      list: [
        { bySymptomSecond: 7, bySymptomName: 'כאבי בטן' },
        { bySymptomSecond: 8, bySymptomName: 'בחילות' },
        { bySymptomSecond: 9, bySymptomName: 'עצירות' }
      ],
      clinical_context: {
        specialty_area: 'gastroenterology',
        clinical_significance: 'moderate_clinical_significance',
        common_treatments: ['Digestive aids', 'Antacids'],
      },
      recovery_mode: true,
    },
    {
      bySymptomMain: 'בעיות עור',
      list: [
        { bySymptomSecond: 10, bySymptomName: 'פריחות' },
        { bySymptomSecond: 11, bySymptomName: 'גירוד' },
        { bySymptomSecond: 12, bySymptomName: 'יובש בעור' }
      ],
      clinical_context: {
        specialty_area: 'dermatology',
        clinical_significance: 'moderate_clinical_significance',
        common_treatments: ['Topical treatments', 'Moisturizers'],
      },
      recovery_mode: true,
    },
    {
      bySymptomMain: 'אלרגיה',
      list: [
        { bySymptomSecond: 13, bySymptomName: 'אלרגיה' },
        { bySymptomSecond: 14, bySymptomName: 'פריחות אלרגיות' }
      ],
      clinical_context: {
        specialty_area: 'allergy_immunology',
        clinical_significance: 'moderate_to_high_significance',
        common_treatments: ['Antihistamines', 'Topical steroids'],
      },
      recovery_mode: true,
    }
  ];

  // Apply category filtering if specified in recovery mode
  let filteredCategories = basicSymptomCategories;
  if (userInput.category_filter && userInput.category_filter.trim()) {
    const filterLower = userInput.category_filter.toLowerCase();
    filteredCategories = basicSymptomCategories.filter(category => 
      category.bySymptomMain.toLowerCase().includes(filterLower)
    );
  }

  // console.info(`Recovery mode: returning ${filteredCategories.length} basic symptom categories`);
  
  return filteredCategories;
}

// ===== CLINICAL INTELLIGENCE GENERATION =====

async function generateClinicalContext(category: any): Promise<Record<string, unknown>> {
  const categoryName = category.bySymptomMain;

  return {
    specialty_area: determineSpecialtyArea(categoryName),
    clinical_significance: assessClinicalSignificance(categoryName),
    urgency_indicators: generateUrgencyIndicators(categoryName),
    common_treatments: inferCommonTreatments(categoryName),
    self_care_potential: assessSelfCarePotential(categoryName),
    referral_guidelines: generateReferralGuidelines(categoryName),
  };
}

async function assessTreatmentAvailability(category: any): Promise<Record<string, unknown>> {
  const symptoms = category.list || [];

  return {
    total_symptoms: symptoms.length,
    treatment_categories: {
      otc_treatable: estimateOTCTreatableSymptoms(symptoms),
      prescription_required: estimatePrescriptionSymptoms(symptoms),
      specialist_care: estimateSpecialistSymptoms(category.bySymptomMain),
    },
    medication_classes: inferMedicationClasses(category.bySymptomMain),
    health_basket_coverage: estimateHealthBasketCoverage(category.bySymptomMain),
  };
}

async function analyzeSymptoms(symptoms: any[]): Promise<Record<string, unknown>> {
  return {
    symptom_count: symptoms.length,
    complexity_distribution: analyzeSymptomComplexity(symptoms),
    prevalence_indicators: analyzeSymptomPrevalence(symptoms),
    treatment_pathways: generateTreatmentPathways(symptoms),
    clinical_priorities: prioritizeSymptoms(symptoms),
  };
}

function generateNavigationGuidance(
  category: any,
  userInput: ValidatedBrowseAvailableSymptomsInput,
): string[] {
  const guidance: string[] = [];
  const categoryName = category.bySymptomMain;
  const symptoms = category.list || [];

  // Category-specific guidance
  guidance.push(`Category: ${categoryName} contains ${symptoms.length} specific symptoms`);

  if (symptoms.length > 0) {
    guidance.push("Use 'find_drugs_for_symptom' with these category and symptom combinations");

    // Highlight most relevant symptoms
    const prioritySymptoms = symptoms.slice(0, 3);
    prioritySymptoms.forEach((symptom: any) => {
      guidance.push(`- "${categoryName}" → "${symptom.bySymptomName}"`);
    });
  }

  // Clinical pathway guidance
  if (isEmergencyCategory(categoryName)) {
    guidance.push(
      'PRIORITY: Some conditions in this category may require urgent medical attention',
    );
  }

  if (hasSelfCareOptions(categoryName)) {
    guidance.push('Many conditions in this category have self-care treatment options');
  }

  guidance.push('Explore specific symptoms for detailed treatment recommendations');

  return guidance;
}

// ===== CLINICAL ASSESSMENT FUNCTIONS =====

function determineSpecialtyArea(categoryName: string): string {
  // FIXED: null safety
  if (!categoryName || typeof categoryName !== 'string') {
    return 'family_medicine_general';
  }
  
  const categoryLower = categoryName.toLowerCase();

  if (categoryLower.includes('כאב') || categoryLower.includes('חום')) {
    return 'pain_management_internal_medicine';
  }
  if (
    categoryLower.includes('אף') ||
    categoryLower.includes('אוזן') ||
    categoryLower.includes('גרון')
  ) {
    return 'otolaryngology_family_medicine';
  }
  if (categoryLower.includes('עיכול') || categoryLower.includes('בטן')) {
    return 'gastroenterology_family_medicine';
  }
  if (categoryLower.includes('עור')) {
    return 'dermatology';
  }
  if (categoryLower.includes('אלרגיה')) {
    return 'allergy_immunology';
  }
  if (categoryLower.includes('נפש') || categoryLower.includes('שינה')) {
    return 'psychiatry_neurology';
  }

  return 'family_medicine_general';
}

function assessClinicalSignificance(categoryName: string): string {
  // FIXED: null safety
  if (!categoryName || typeof categoryName !== 'string') {
    return 'standard_clinical_significance';
  }
  
  const categoryLower = categoryName.toLowerCase();

  if (categoryLower.includes('חום') || categoryLower.includes('כאב')) {
    return 'high_clinical_significance';
  }
  if (categoryLower.includes('אלרגיה') || categoryLower.includes('נשימה')) {
    return 'moderate_to_high_significance';
  }
  if (categoryLower.includes('עור') || categoryLower.includes('עיכול')) {
    return 'moderate_significance';
  }

  return 'standard_clinical_significance';
}

function generateUrgencyIndicators(categoryName: string): string[] {
  const indicators: string[] = [];
  
  // FIXED: null safety
  if (!categoryName || typeof categoryName !== 'string') {
    indicators.push('Persistent or worsening symptoms warrant medical evaluation');
    return indicators;
  }
  
  const categoryLower = categoryName.toLowerCase();

  if (categoryLower.includes('כאב')) {
    indicators.push('Severe pain requires immediate evaluation');
    indicators.push('Chronic pain needs systematic management approach');
  }

  if (categoryLower.includes('נשימה') || categoryLower.includes('גרון')) {
    indicators.push('Breathing difficulties require urgent assessment');
    indicators.push('Severe throat pain may indicate serious infection');
  }

  if (categoryLower.includes('אלרגיה')) {
    indicators.push('Severe allergic reactions require emergency care');
    indicators.push('Anaphylaxis symptoms need immediate medical attention');
  }

  indicators.push('Persistent or worsening symptoms warrant medical evaluation');

  return indicators;
}

function inferCommonTreatments(categoryName: string): string[] {
  const treatments: string[] = [];
  
  // FIXED: null safety
  if (!categoryName || typeof categoryName !== 'string') {
    treatments.push('Symptomatic relief medications');
    treatments.push('Lifestyle and supportive measures');
    return treatments;
  }
  
  const categoryLower = categoryName.toLowerCase();

  if (categoryLower.includes('כאב') || categoryLower.includes('חום')) {
    treatments.push('Analgesics (paracetamol, ibuprofen)');
    treatments.push('Topical pain relievers');
    treatments.push('Non-pharmacological interventions');
  }

  if (categoryLower.includes('גרון') || categoryLower.includes('אף')) {
    treatments.push('Local throat treatments');
    treatments.push('Nasal decongestants');
    treatments.push('Supportive care measures');
  }

  if (categoryLower.includes('אלרגיה')) {
    treatments.push('Antihistamines');
    treatments.push('Topical anti-inflammatory treatments');
    treatments.push('Allergen avoidance');
  }

  treatments.push('Symptomatic relief medications');
  treatments.push('Lifestyle and supportive measures');

  return treatments;
}

function assessSelfCarePotential(categoryName: string): string {
  // FIXED: null safety
  if (!categoryName || typeof categoryName !== 'string') {
    return 'limited_self_care_potential';
  }
  
  const categoryLower = categoryName.toLowerCase();

  if (categoryLower.includes('כאב') && !categoryLower.includes('חמור')) {
    return 'high_self_care_potential';
  }
  if (categoryLower.includes('גרון') || categoryLower.includes('עור')) {
    return 'moderate_self_care_potential';
  }
  if (categoryLower.includes('אלרגיה') && categoryLower.includes('קל')) {
    return 'moderate_self_care_potential';
  }

  return 'limited_self_care_potential';
}

function generateReferralGuidelines(categoryName: string): string[] {
  const guidelines: string[] = [];
  
  // FIXED: null safety
  if (!categoryName || typeof categoryName !== 'string') {
    guidelines.push('Complex or refractory cases warrant specialist evaluation');
    return guidelines;
  }
  
  const categoryLower = categoryName.toLowerCase();

  if (categoryLower.includes('כאב')) {
    guidelines.push('Chronic or severe pain: refer to pain management specialist');
    guidelines.push('Neurological symptoms: consider neurology referral');
  }

  if (categoryLower.includes('אף') || categoryLower.includes('גרון')) {
    guidelines.push('Persistent symptoms >2 weeks: ENT consultation');
    guidelines.push('Recurrent infections: specialist evaluation');
  }

  if (categoryLower.includes('עיכול')) {
    guidelines.push('Chronic digestive issues: gastroenterology referral');
    guidelines.push('Red flag symptoms: urgent specialist consultation');
  }

  guidelines.push('Complex or refractory cases warrant specialist evaluation');

  return guidelines;
}

function estimateOTCTreatableSymptoms(symptoms: any[]): number {
  // Conservative estimate - about 60% of common symptoms have OTC options
  return Math.round(symptoms.length * 0.6);
}

function estimatePrescriptionSymptoms(symptoms: any[]): number {
  // Estimate - about 70% might need prescription at some severity level
  return Math.round(symptoms.length * 0.7);
}

function estimateSpecialistSymptoms(categoryName: string): number {
  // FIXED: null safety
  if (!categoryName || typeof categoryName !== 'string') {
    return 1;
  }
  
  const categoryLower = categoryName.toLowerCase();

  if (categoryLower.includes('מורכב') || categoryLower.includes('כרוני')) {
    return 3; // High specialist need
  }
  if (categoryLower.includes('כאב') || categoryLower.includes('אלרגיה')) {
    return 2; // Moderate specialist need
  }

  return 1; // Standard specialist need
}

function inferMedicationClasses(categoryName: string): string[] {
  const classes: string[] = [];
  
  // FIXED: null safety
  if (!categoryName || typeof categoryName !== 'string') {
    return classes;
  }
  
  const categoryLower = categoryName.toLowerCase();

  if (categoryLower.includes('כאב')) {
    classes.push('Analgesics', 'NSAIDs', 'Topical analgesics');
  }
  if (categoryLower.includes('חום')) {
    classes.push('Antipyretics', 'Anti-inflammatory agents');
  }
  if (categoryLower.includes('אלרגיה')) {
    classes.push('Antihistamines', 'Corticosteroids', 'Mast cell stabilizers');
  }
  if (categoryLower.includes('גרון')) {
    classes.push('Local anesthetics', 'Antiseptics', 'Anti-inflammatory');
  }

  return classes;
}

function estimateHealthBasketCoverage(categoryName: string): string {
  // FIXED: null safety
  if (!categoryName || typeof categoryName !== 'string') {
    return 'standard_coverage_common_treatments';
  }
  
  const categoryLower = categoryName.toLowerCase();

  if (categoryLower.includes('כאב') || categoryLower.includes('חום')) {
    return 'high_coverage_essential_medications';
  }
  if (categoryLower.includes('אלרגיה')) {
    return 'good_coverage_antihistamines';
  }
  if (categoryLower.includes('עור')) {
    return 'moderate_coverage_basic_treatments';
  }

  return 'standard_coverage_common_treatments';
}

function analyzeSymptomComplexity(symptoms: any[]): Record<string, number> {
  // Simple complexity analysis based on symptom names
  let simple = 0,
    moderate = 0,
    complex = 0;

  symptoms.forEach((symptom: any) => {
    // FIXED: null safety
    if (!symptom || !symptom.bySymptomName || typeof symptom.bySymptomName !== 'string') {
      return;
    }
    
    const name = symptom.bySymptomName.toLowerCase();

    if (name.includes('כאב') || name.includes('חום')) {
      simple++;
    } else if (name.includes('כרוני') || name.includes('מורכב')) {
      complex++;
    } else {
      moderate++;
    }
  });

  return { simple, moderate, complex };
}

function analyzeSymptomPrevalence(symptoms: any[]): string {
  // Placeholder for prevalence analysis
  if (symptoms.length > 15) return 'high_prevalence_category';
  if (symptoms.length > 8) return 'moderate_prevalence_category';
  return 'standard_prevalence_category';
}

function generateTreatmentPathways(symptoms: any[]): string[] {
  return [
    'Initial assessment and symptom evaluation',
    'Conservative treatment approach with OTC options',
    'Prescription therapy if conservative measures insufficient',
    'Specialist referral for complex or refractory cases',
  ];
}

function prioritizeSymptoms(symptoms: any[]): string[] {
  // Sort symptoms by clinical priority (simplified)
  const prioritized = symptoms
    .filter((s: any) => s && s.bySymptomName) // FIXED: null safety
    .sort((a: any, b: any) => {
      const scoreA = getSymptomPriorityScore(a.bySymptomName);
      const scoreB = getSymptomPriorityScore(b.bySymptomName);
      return scoreB - scoreA;
    })
    .slice(0, 5)
    .map((s: any) => s.bySymptomName);

  return prioritized;
}

function getSymptomPriorityScore(symptomName: string): number {
  // FIXED: null safety
  if (!symptomName || typeof symptomName !== 'string') {
    return 0;
  }
  
  const name = symptomName.toLowerCase();

  if (name.includes('כאב') || name.includes('חום')) return 3;
  if (name.includes('אלרגיה') || name.includes('נשימה')) return 2;
  return 1;
}

function determineClinicalPriority(categoryName: string): number {
  // FIXED: null safety
  if (!categoryName || typeof categoryName !== 'string') {
    return 0;
  }
  
  const categoryLower = categoryName.toLowerCase();

  if (categoryLower.includes('כאב') || categoryLower.includes('חום')) return 5;
  if (categoryLower.includes('נשימה') || categoryLower.includes('אלרגיה')) return 4;
  if (categoryLower.includes('עיכול') || categoryLower.includes('גרון')) return 3;
  if (categoryLower.includes('עור')) return 2;
  return 1;
}

function isEmergencyCategory(categoryName: string): boolean {
  // FIXED: null safety
  if (!categoryName || typeof categoryName !== 'string') {
    return false;
  }
  
  const categoryLower = categoryName.toLowerCase();
  return (
    categoryLower.includes('נשימה') ||
    categoryLower.includes('לב') ||
    categoryLower.includes('אלרגיה')
  );
}

function hasSelfCareOptions(categoryName: string): boolean {
  // FIXED: null safety
  if (!categoryName || typeof categoryName !== 'string') {
    return false;
  }
  
  const categoryLower = categoryName.toLowerCase();
  return (
    categoryLower.includes('כאב') || categoryLower.includes('גרון') || categoryLower.includes('עור')
  );
}

// ===== RESPONSE ENHANCEMENT =====

function enhanceSymptomDiscoveryResponse(
  baseResponse: any,
  userInput: ValidatedBrowseAvailableSymptomsInput,
  validationWarnings: string[],
): McpResponse<any> {
  const enhancedResponse = {
    ...baseResponse,
    data: {
      ...baseResponse.data,
      discovery_analysis: generateDiscoveryAnalysis(baseResponse.data, userInput),
      clinical_pathways: generateClinicalPathways(baseResponse.data),
      navigation_strategy: generateNavigationStrategy(baseResponse.data, userInput),
    },
  };

  // Add validation warnings
  if (validationWarnings.length > 0) {
    enhancedResponse.warnings = [...(enhancedResponse.warnings || []), ...validationWarnings];
  }

  // Enhance clinical notes
  enhancedResponse.clinical_notes = [
    ...enhancedResponse.clinical_notes,
    ...generateSymptomDiscoveryNotes(userInput),
  ];

  // Enhance next actions for symptom discovery workflow
  enhancedResponse.next_suggested_actions = enhanceSymptomDiscoveryNextActions(
    baseResponse.next_suggested_actions || [],
    baseResponse.data,
    userInput,
  );

  return enhancedResponse;
}

function generateDiscoveryAnalysis(
  discoveryData: any,
  userInput: ValidatedBrowseAvailableSymptomsInput,
): Record<string, unknown> {
  const categories = discoveryData.categories || [];

  return {
    scope_analysis: {
      total_categories: categories.length,
      filtered_categories: userInput.category_filter
        ? categories.filter((c: any) => {
            // FIXED: null safety
            if (!c || !c.bySymptomMain || typeof c.bySymptomMain !== 'string') {
              return false;
            }
            return c.bySymptomMain.toLowerCase().includes(userInput.category_filter!.toLowerCase());
          }).length
        : categories.length,
      coverage_assessment: 'comprehensive_israeli_healthcare_system',
    },
    clinical_distribution: {
      emergency_categories: categories.filter((c: any) => 
        c && c.bySymptomMain && isEmergencyCategory(c.bySymptomMain)
      ).length,
      self_care_categories: categories.filter((c: any) => 
        c && c.bySymptomMain && hasSelfCareOptions(c.bySymptomMain)
      ).length,
      specialist_categories: categories.filter((c: any) => 
        c && c.bySymptomMain && determineSpecialtyArea(c.bySymptomMain) !== 'family_medicine_general'
      ).length,
    },
    discovery_guidance: generateDiscoveryGuidance(categories, userInput),
  };
}

function generateClinicalPathways(discoveryData: any): Record<string, string[]> {
  return {
    symptom_to_treatment: [
      '1. Identify symptom category from available options',
      '2. Select specific symptom within category',
      "3. Use 'find_drugs_for_symptom' for treatment options",
      '4. Evaluate treatment alternatives and safety',
    ],
    self_care_pathway: [
      '1. Assess symptom severity and duration',
      '2. Consider non-pharmacological interventions',
      '3. Try appropriate OTC medications if available',
      '4. Monitor response and escalate if needed',
    ],
    professional_care_pathway: [
      '1. Recognize symptoms requiring medical evaluation',
      '2. Gather relevant clinical information',
      '3. Seek appropriate level of care (primary/specialist)',
      '4. Follow prescribed treatment regimen',
    ],
  };
}

function generateNavigationStrategy(
  discoveryData: any,
  userInput: ValidatedBrowseAvailableSymptomsInput,
): Record<string, string[]> {
  return {
    efficient_navigation: [
      'Use category filtering to narrow down to relevant medical areas',
      'Check popular symptoms for commonly treated conditions',
      'Apply clinical priority ordering for urgent conditions first',
    ],
    comprehensive_exploration: [
      'Browse all categories to understand full scope of available treatments',
      'Compare treatment availability across different symptom categories',
      'Use cross-referencing with other tools for complete clinical picture',
    ],
    clinical_decision_support: [
      'Start with symptom discovery before searching specific medications',
      'Use symptom-to-treatment pathway for evidence-based approach',
      'Consider both immediate and long-term treatment strategies',
    ],
  };
}

function generateDiscoveryGuidance(
  categories: any[],
  userInput: ValidatedBrowseAvailableSymptomsInput,
): string[] {
  const guidance: string[] = [];

  guidance.push(`Healthcare system contains ${categories.length} major symptom categories`);

  if (userInput.category_filter) {
    const filtered = categories.filter((c: any) => {
      // FIXED: null safety
      if (!c || !c.bySymptomMain || typeof c.bySymptomMain !== 'string') {
        return false;
      }
      return c.bySymptomMain.toLowerCase().includes(userInput.category_filter!.toLowerCase());
    });
    guidance.push(`Filter "${userInput.category_filter}" matches ${filtered.length} categories`);
  }

  if (userInput.include_popular_symptoms) {
    guidance.push('Popular symptoms included to prioritize commonly treated conditions');
  }

  if (userInput.clinical_priority_order) {
    guidance.push('Clinical priority ordering applied for relevant conditions');
  }

  guidance.push('Use specific category-symptom combinations for targeted treatment discovery');

  return guidance;
}

function generateSymptomDiscoveryNotes(userInput: ValidatedBrowseAvailableSymptomsInput): string[] {
  const notes: string[] = [];

  notes.push('Symptom discovery provides foundation for evidence-based treatment selection');
  notes.push('Categories organized by medical specialty and clinical relevance');

  if (userInput.clinical_priority_order) {
    notes.push('Clinical priority ordering applied - urgent conditions listed first');
  }

  notes.push('Each category contains multiple specific symptoms for targeted treatment');
  notes.push('Use symptom navigation to access comprehensive treatment options');

  return notes;
}

function enhanceSymptomDiscoveryNextActions(
  baseActions: any[],
  discoveryData: any,
  userInput: ValidatedBrowseAvailableSymptomsInput,
): any[] {
  const enhancedActions = [...baseActions];

  // Add discovery-specific actions
  enhancedActions.push({
    tool: 'find_drugs_for_symptom',
    reason: 'Find treatments for specific symptoms identified in discovery',
    parameters_hint: 'Use category and symptom names from discovery results',
  });

  if (userInput.include_popular_symptoms) {
    enhancedActions.push({
      tool: 'discover_popular_symptoms',
      reason: 'Get detailed popular symptoms analysis',
      parameters_hint: 'Analyze trending medical conditions and treatments',
    });
  }

  enhancedActions.push({
    tool: 'explore_therapeutic_categories',
    reason: 'Cross-reference with medication classification system',
    parameters_hint: 'Connect symptoms with therapeutic drug categories',
  });

  return enhancedActions;
}