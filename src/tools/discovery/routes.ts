/**
 * Administration Routes Discovery Tool
 * Enables AI agents to explore medication delivery methods and administration pathways
 * Transforms GetMatanList API into intelligent drug delivery guidance system
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListAdministrationRoutesSchema, ListAdministrationRoutesInput, McpResponse } from "../../types/mcp.js";
import { getApiClient } from "../../services/israelDrugsApi.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { 
  validateToolInput
} from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";
import { CLINICAL_MAPPINGS, MCP_CONFIG } from "../../config/constants.js";

// ===== TOOL REGISTRATION =====

export function registerAdministrationRoutesTool(server: McpServer): void {
  server.registerTool(
    "list_administration_routes",
    {
      title: "Medication Delivery Methods Explorer",
      description: `Comprehensive medication administration pathway tool providing detailed guidance on drug delivery methods, route selection criteria, and clinical administration considerations within the Israeli healthcare system.

**Clinical Purpose:** Essential for route-specific medication selection, patient-appropriate delivery method identification, and clinical administration planning. Critical for patients with specific administration needs, swallowing difficulties, or route-specific therapeutic requirements.

**Administration Route Categories:**
- Oral routes (פומי): tablets, capsules, liquids, sublingual, buccal
- Parenteral routes: intravenous, intramuscular, subcutaneous injections
- Topical applications (עורי): creams, ointments, patches, gels
- Specialized routes: ophthalmic (עיני), otic (אוזני), nasal, rectal
- Inhalation routes: nebulizers, inhalers, respiratory delivery systems
- Mucous membrane routes: vaginal, urethral, sublingual applications

**Route Selection Criteria:**
- patient_population: Pediatric, adult, geriatric considerations
- clinical_setting: Home care, outpatient, hospital, emergency use
- therapeutic_goal: Systemic vs local effect, onset speed, duration
- patient_factors: Swallowing ability, consciousness level, compliance

**Clinical Intelligence Features:**
- Bioavailability and pharmacokinetic implications by route
- Patient suitability assessment for different delivery methods
- Clinical administration complexity and training requirements
- Cost and accessibility considerations for different routes

**Route Filtering Options:**
- complexity_level: Simple self-administration vs complex clinical procedures
- patient_age_group: Age-appropriate administration methods
- setting_requirements: Home vs clinical facility administration
- onset_requirements: Immediate vs delayed therapeutic effect

**Administration Guidance:**
- Proper technique instructions for each route
- Safety considerations and contraindications
- Monitoring requirements during administration
- Patient education and training needs

**Output:** Returns comprehensive administration route guide with clinical suitability assessment, technique guidance, safety considerations, and patient-specific administration recommendations.

**Clinical Context:** This tool supports optimal medication delivery planning, ensures appropriate route selection for patient-specific needs, and provides essential guidance for safe and effective medication administration across diverse clinical scenarios.`,
      inputSchema: ListAdministrationRoutesSchema
    },
    async (input: ListAdministrationRoutesInput) => {
      const startTime = Date.now();
      
      try {
        // Validate and process input
        const { data: validatedInput, warnings } = validateToolInput(
          ListAdministrationRoutesSchema,
          input,
          "list_administration_routes"
        );
        
        // Execute administration routes discovery
        const routesData = await executeAdministrationRoutesDiscovery(validatedInput);
        
        // Format response with clinical administration intelligence
        const formatter = getResponseFormatter();
        const formattedResponse = formatter.formatAdministrationRoutesResponse(
          routesData,
          startTime
        );
        
        // Enhance with administration-specific intelligence
        return enhanceAdministrationRoutesResponse(formattedResponse, validatedInput, warnings);
        
      } catch (error) {
        const classifiedError = classifyError(error, "list_administration_routes");
        return createComprehensiveErrorResponse(classifiedError, undefined, {
          toolName: "list_administration_routes",
          userInput: input,
          attemptNumber: 1
        });
      }
    }
  );
}

// ===== ADMINISTRATION ROUTES DISCOVERY EXECUTION =====

async function executeAdministrationRoutesDiscovery(
  userInput: ListAdministrationRoutesInput
): Promise<any[]> {
  const apiClient = getApiClient();
  
  try {
    console.info("Retrieving complete administration routes classification system");
    
    // Get complete administration routes list
    const routesList = await apiClient.getMatanList();
    
    // Process and enhance the routes data
    const processedRoutesData = await processAdministrationRoutes(routesList, userInput);
    
    return processedRoutesData;
    
  } catch (error) {
    console.error("Administration routes discovery failed:", error);
    
    // Attempt recovery with basic route structure
    return await attemptAdministrationRoutesRecovery(userInput);
  }
}

async function processAdministrationRoutes(
  rawRoutesData: any[],
  userInput: ListAdministrationRoutesInput
): Promise<any[]> {
  let processedData = rawRoutesData;
  
  // Apply complexity level filtering if specified
  if (userInput.complexity_level) {
    processedData = filterByComplexityLevel(processedData, userInput.complexity_level);
  }
  
  // Apply patient age group filtering if specified
  if (userInput.patient_age_group) {
    processedData = filterByAgeGroup(processedData, userInput.patient_age_group);
  }
  
  // Apply setting requirements filtering if specified
  if (userInput.setting_requirements) {
    processedData = filterBySettingRequirements(processedData, userInput.setting_requirements);
  }
  
  // Enhance each route with comprehensive clinical intelligence
  const enhancedData = await Promise.all(
    processedData.map(async (routeItem: any) => {
      const enhancedItem = {
        ...routeItem,
        clinical_profile: await generateClinicalProfile(routeItem),
        administration_guidance: await generateAdministrationGuidance(routeItem),
        patient_suitability: await assessPatientSuitability(routeItem, userInput),
        pharmacokinetic_profile: await generatePharmacokinteicProfile(routeItem),
        safety_considerations: await generateSafetyConsiderations(routeItem),
        training_requirements: await assessTrainingRequirements(routeItem)
      };
      
      return enhancedItem;
    })
  );
  
  // Sort by clinical relevance and usage frequency
  enhancedData.sort((a, b) => {
    const priorityA = getRoutePriority(a.id, a.text);
    const priorityB = getRoutePriority(b.id, b.text);
    return priorityB - priorityA;
  });
  
  return enhancedData;
}

function filterByComplexityLevel(
  routesData: any[],
  complexityLevel: "simple" | "moderate" | "complex" | "all"
): any[] {
  if (complexityLevel === "all") return routesData;
  
  return routesData.filter((route: any) => {
    const routeComplexity = determineRouteComplexity(route.text);
    return routeComplexity === complexityLevel;
  });
}

function filterByAgeGroup(
  routesData: any[],
  ageGroup: "pediatric" | "adult" | "geriatric" | "all"
): any[] {
  if (ageGroup === "all") return routesData;
  
  return routesData.filter((route: any) => {
    const ageSuitability = assessAgeSuitability(route.text);
    return ageSuitability.includes(ageGroup);
  });
}

function filterBySettingRequirements(
  routesData: any[],
  settingRequirement: "home_care" | "outpatient" | "hospital" | "emergency" | "all"
): any[] {
  if (settingRequirement === "all") return routesData;
  
  return routesData.filter((route: any) => {
    const settingSuitability = assessSettingSuitability(route.text);
    return settingSuitability.includes(settingRequirement);
  });
}

async function attemptAdministrationRoutesRecovery(
  userInput: ListAdministrationRoutesInput
): Promise<any[]> {
  console.info("Attempting administration routes recovery with basic structure");
  
  // Provide basic route structure for recovery
  const basicRoutes = [
    { id: 17, text: "פומי", recovery_mode: true },
    { id: 2, text: "עורי", recovery_mode: true },
    { id: 15, text: "עיני", recovery_mode: true },
    { id: 16, text: "אוזני", recovery_mode: true },
    { id: 6, text: "תוך-ורידי", recovery_mode: true },
    { id: 5, text: "תוך-שרירי", recovery_mode: true },
    { id: 18, text: "רקטלי", recovery_mode: true },
    { id: 1, text: "נשימתי", recovery_mode: true }
  ];
  
  return basicRoutes.map(route => ({
    ...route,
    clinical_profile: {
      route_category: getCategoryFromText(route.text),
      complexity_level: determineRouteComplexity(route.text),
      clinical_significance: "standard"
    },
    administration_guidance: [`Basic administration via ${route.text} route`],
    recovery_mode: true
  }));
}

// ===== CLINICAL INTELLIGENCE GENERATION =====

async function generateClinicalProfile(routeItem: any): Promise<Record<string, unknown>> {
  const routeText = routeItem.text;
  const routeId = routeItem.id;
  
  return {
    route_category: getCategoryFromText(routeText),
    anatomical_target: getAnatomicalTarget(routeText),
    therapeutic_scope: getTherapeuticScope(routeText),
    bioavailability_profile: getBioavailabilityProfile(routeText),
    onset_characteristics: getOnsetCharacteristics(routeText),
    duration_profile: getDurationProfile(routeText),
    systemic_vs_local: getSystemicVsLocal(routeText),
    clinical_advantages: getClinicalAdvantages(routeText),
    clinical_limitations: getClinicalLimitations(routeText)
  };
}

async function generateAdministrationGuidance(routeItem: any): Promise<Record<string, unknown>> {
  const routeText = routeItem.text;
  
  return {
    preparation_steps: getPreparationSteps(routeText),
    administration_technique: getAdministrationTechnique(routeText),
    dosing_considerations: getDosingConsiderations(routeText),
    timing_requirements: getTimingRequirements(routeText),
    patient_positioning: getPatientPositioning(routeText),
    post_administration: getPostAdministration(routeText),
    quality_control: getQualityControl(routeText)
  };
}

async function assessPatientSuitability(
  routeItem: any,
  userInput: ListAdministrationRoutesInput
): Promise<Record<string, unknown>> {
  const routeText = routeItem.text;
  
  return {
    age_appropriateness: {
      pediatric: isPediatricAppropriate(routeText),
      adult: isAdultAppropriate(routeText),
      geriatric: isGeriatricAppropriate(routeText)
    },
    physical_requirements: {
      consciousness_level: getConsciousnessRequirements(routeText),
      swallowing_ability: getSwallowingRequirements(routeText),
      manual_dexterity: getManualDexterityRequirements(routeText),
      cognitive_function: getCognitiveRequirements(routeText)
    },
    clinical_conditions: {
      contraindications: getContraindications(routeText),
      precautions: getPrecautions(routeText),
      monitoring_needs: getMonitoringNeeds(routeText)
    },
    accessibility_factors: {
      cost_considerations: getCostConsiderations(routeText),
      availability: getAvailability(routeText),
      insurance_coverage: getInsuranceCoverage(routeText)
    }
  };
}

async function generatePharmacokinteicProfile(routeItem: any): Promise<Record<string, unknown>> {
  const routeText = routeItem.text;
  
  return {
    absorption_characteristics: {
      absorption_rate: getAbsorptionRate(routeText),
      bioavailability: getBioavailability(routeText),
      first_pass_effect: getFirstPassEffect(routeText),
      absorption_variability: getAbsorptionVariability(routeText)
    },
    distribution_factors: {
      systemic_distribution: getSystemicDistribution(routeText),
      tissue_penetration: getTissuePenetration(routeText),
      protein_binding_impact: getProteinBindingImpact(routeText)
    },
    elimination_considerations: {
      metabolism_pathway: getMetabolismPathway(routeText),
      elimination_route: getEliminationRoute(routeText),
      clearance_factors: getClearanceFactors(routeText)
    }
  };
}

async function generateSafetyConsiderations(routeItem: any): Promise<Record<string, unknown>> {
  const routeText = routeItem.text;
  
  return {
    immediate_risks: {
      administration_complications: getAdministrationComplications(routeText),
      allergic_reactions: getAllergicReactionRisks(routeText),
      mechanical_complications: getMechanicalComplications(routeText)
    },
    long_term_considerations: {
      chronic_use_effects: getChronicUseEffects(routeText),
      tissue_damage_risk: getTissueDamageRisk(routeText),
      dependency_potential: getDependencyPotential(routeText)
    },
    special_populations: {
      pregnancy_safety: getPregnancySafety(routeText),
      lactation_considerations: getLactationConsiderations(routeText),
      pediatric_safety: getPediatricSafety(routeText),
      geriatric_safety: getGeriatricSafety(routeText)
    },
    emergency_protocols: {
      adverse_reaction_management: getAdverseReactionManagement(routeText),
      overdose_considerations: getOverdoseConsiderations(routeText),
      contamination_prevention: getContaminationPrevention(routeText)
    }
  };
}

async function assessTrainingRequirements(routeItem: any): Promise<Record<string, unknown>> {
  const routeText = routeItem.text;
  
  return {
    healthcare_provider_training: {
      skill_level_required: getRequiredSkillLevel(routeText),
      certification_needs: getCertificationNeeds(routeText),
      competency_assessment: getCompetencyAssessment(routeText)
    },
    patient_education: {
      self_administration_feasibility: getSelfAdministrationFeasibility(routeText),
      caregiver_training_needs: getCaregiverTrainingNeeds(routeText),
      education_materials: getEducationMaterials(routeText)
    },
    institutional_requirements: {
      facility_capabilities: getFacilityCapabilities(routeText),
      equipment_needs: getEquipmentNeeds(routeText),
      staff_training: getStaffTraining(routeText)
    }
  };
}

// ===== UTILITY FUNCTIONS =====

function determineRouteComplexity(routeText: string): "simple" | "moderate" | "complex" {
  const routeLower = routeText.toLowerCase();
  
  // Simple routes - self-administration possible
  if (["פומי", "עורי", "אוזני", "עיני"].some(route => routeLower.includes(route))) {
    return "simple";
  }
  
  // Complex routes - clinical administration required
  if (["תוך-ורידי", "תוך-שרירי", "תוך-עמוד השדרה"].some(route => routeLower.includes(route))) {
    return "complex";
  }
  
  // Moderate complexity
  return "moderate";
}

function assessAgeSuitability(routeText: string): string[] {
  const suitability: string[] = [];
  const routeLower = routeText.toLowerCase();
  
  // Routes suitable for all ages
  if (["עורי", "עיני", "אוזני"].some(route => routeLower.includes(route))) {
    suitability.push("pediatric", "adult", "geriatric");
  }
  // Oral routes - age dependent
  else if (routeLower.includes("פומי")) {
    suitability.push("adult", "geriatric");
    // Pediatric only if appropriate formulation
  }
  // Injectable routes - typically adult/geriatric
  else if (["תוך-ורידי", "תוך-שרירי"].some(route => routeLower.includes(route))) {
    suitability.push("adult", "geriatric");
  }
  else {
    suitability.push("adult", "geriatric");
  }
  
  return suitability;
}

function assessSettingSuitability(routeText: string): string[] {
  const settings: string[] = [];
  const routeLower = routeText.toLowerCase();
  
  // Home care suitable routes
  if (["פומי", "עורי", "עיני", "אוזני", "רקטלי"].some(route => routeLower.includes(route))) {
    settings.push("home_care", "outpatient");
  }
  
  // Hospital/clinical routes
  if (["תוך-ורידי", "תוך-שרירי"].some(route => routeLower.includes(route))) {
    settings.push("hospital", "outpatient", "emergency");
  }
  
  // Emergency suitable routes
  if (["תוך-ורידי", "תוך-שרירי", "נשימתי"].some(route => routeLower.includes(route))) {
    settings.push("emergency");
  }
  
  // All settings if not specifically restricted
  if (settings.length === 0) {
    settings.push("home_care", "outpatient", "hospital");
  }
  
  return settings;
}

function getCategoryFromText(routeText: string): string {
  const routeLower = routeText.toLowerCase();
  
  if (routeLower.includes("פומי")) return "oral_routes";
  if (routeLower.includes("עורי")) return "topical_routes";
  if (routeLower.includes("עיני")) return "ophthalmic_routes";
  if (routeLower.includes("אוזני")) return "otic_routes";
  if (routeLower.includes("תוך-ורידי")) return "intravenous_routes";
  if (routeLower.includes("תוך-שרירי")) return "intramuscular_routes";
  if (routeLower.includes("נשימתי")) return "inhalation_routes";
  if (routeLower.includes("רקטלי")) return "rectal_routes";
  
  return "specialized_routes";
}

function getAnatomicalTarget(routeText: string): string {
  const routeLower = routeText.toLowerCase();
  
  if (routeLower.includes("פומי")) return "gastrointestinal_tract";
  if (routeLower.includes("עורי")) return "skin_and_subcutaneous_tissue";
  if (routeLower.includes("עיני")) return "ocular_structures";
  if (routeLower.includes("אוזני")) return "auditory_system";
  if (routeLower.includes("תוך-ורידי")) return "vascular_system";
  if (routeLower.includes("תוך-שרירי")) return "muscular_system";
  if (routeLower.includes("נשימתי")) return "respiratory_system";
  if (routeLower.includes("רקטלי")) return "rectal_mucosa";
  
  return "multiple_anatomical_targets";
}

function getTherapeuticScope(routeText: string): string {
  const routeLower = routeText.toLowerCase();
  
  if (["פומי", "תוך-ורידי", "תוך-שרירי"].some(route => routeLower.includes(route))) {
    return "systemic_therapeutic_effect";
  }
  if (["עורי", "עיני", "אוזני"].some(route => routeLower.includes(route))) {
    return "local_therapeutic_effect";
  }
  
  return "variable_therapeutic_scope";
}

function getBioavailabilityProfile(routeText: string): string {
  const routeLower = routeText.toLowerCase();
  
  if (routeLower.includes("תוך-ורידי")) return "100_percent_bioavailability";
  if (routeLower.includes("פומי")) return "variable_bioavailability_first_pass";
  if (routeLower.includes("תוך-שרירי")) return "high_bioavailability_rapid_absorption";
  if (["עורי", "עיני", "אוזני"].some(route => routeLower.includes(route))) {
    return "local_bioavailability_minimal_systemic";
  }
  
  return "route_dependent_bioavailability";
}

function getOnsetCharacteristics(routeText: string): string {
  const routeLower = routeText.toLowerCase();
  
  if (routeLower.includes("תוך-ורידי")) return "immediate_onset_minutes";
  if (routeLower.includes("תוך-שרירי")) return "rapid_onset_15_30_minutes";
  if (routeLower.includes("פומי")) return "gradual_onset_30_120_minutes";
  if (["עורי", "עיני", "אוזני"].some(route => routeLower.includes(route))) {
    return "local_onset_15_60_minutes";
  }
  
  return "variable_onset_characteristics";
}

function getDurationProfile(routeText: string): string {
  const routeLower = routeText.toLowerCase();
  
  if (routeLower.includes("תוך-ורידי")) return "duration_depends_on_infusion_rate";
  if (routeLower.includes("פומי")) return "sustained_duration_4_12_hours";
  if (routeLower.includes("עורי")) return "prolonged_local_duration";
  
  return "medication_dependent_duration";
}

function getSystemicVsLocal(routeText: string): string {
  const routeLower = routeText.toLowerCase();
  
  if (["פומי", "תוך-ורידי", "תוך-שרירי"].some(route => routeLower.includes(route))) {
    return "primarily_systemic_effect";
  }
  if (["עורי", "עיני", "אוזני"].some(route => routeLower.includes(route))) {
    return "primarily_local_effect";
  }
  
  return "mixed_systemic_local_effects";
}

function getClinicalAdvantages(routeText: string): string[] {
  const advantages: string[] = [];
  const routeLower = routeText.toLowerCase();
  
  if (routeLower.includes("פומי")) {
    advantages.push("Patient convenience and compliance");
    advantages.push("Non-invasive administration");
    advantages.push("Cost-effective delivery method");
  }
  
  if (routeLower.includes("תוך-ורידי")) {
    advantages.push("Immediate therapeutic effect");
    advantages.push("Precise dose control");
    advantages.push("Bypass gastrointestinal absorption");
  }
  
  if (routeLower.includes("עורי")) {
    advantages.push("Local therapeutic effect");
    advantages.push("Reduced systemic side effects");
    advantages.push("Patient self-administration possible");
  }
  
  if (advantages.length === 0) {
    advantages.push("Route-specific therapeutic advantages");
  }
  
  return advantages;
}

function getClinicalLimitations(routeText: string): string[] {
  const limitations: string[] = [];
  const routeLower = routeText.toLowerCase();
  
  if (routeLower.includes("פומי")) {
    limitations.push("Variable absorption and bioavailability");
    limitations.push("First-pass hepatic metabolism");
    limitations.push("Requires conscious, cooperative patient");
  }
  
  if (routeLower.includes("תוך-ורידי")) {
    limitations.push("Requires venous access and clinical expertise");
    limitations.push("Risk of infection and complications");
    limitations.push("Higher cost and complexity");
  }
  
  if (routeLower.includes("עורי")) {
    limitations.push("Limited systemic absorption");
    limitations.push("Skin condition may affect absorption");
    limitations.push("Potential for local irritation");
  }
  
  if (limitations.length === 0) {
    limitations.push("Route-specific limitations require consideration");
  }
  
  return limitations;
}

// Additional utility functions with basic implementations
function getPreparationSteps(routeText: string): string[] {
  return [`Prepare medication for ${routeText} administration according to guidelines`];
}

function getAdministrationTechnique(routeText: string): string[] {
  return [`Follow proper ${routeText} administration technique`];
}

function getDosingConsiderations(routeText: string): string[] {
  return [`Consider route-specific dosing for ${routeText} administration`];
}

function getTimingRequirements(routeText: string): string[] {
  return [`Follow timing guidelines for ${routeText} route`];
}

function getPatientPositioning(routeText: string): string[] {
  return [`Position patient appropriately for ${routeText} administration`];
}

function getPostAdministration(routeText: string): string[] {
  return [`Monitor patient after ${routeText} administration`];
}

function getQualityControl(routeText: string): string[] {
  return [`Ensure quality control for ${routeText} administration`];
}

// Simplified implementations for all assessment functions
function isPediatricAppropriate(routeText: string): boolean {
  return !routeText.includes("תוך-ורידי");
}

function isAdultAppropriate(routeText: string): boolean {
  return true;
}

function isGeriatricAppropriate(routeText: string): boolean {
  return true;
}

function getConsciousnessRequirements(routeText: string): string {
  return routeText.includes("פומי") ? "conscious_cooperative" : "varies_by_route";
}

function getSwallowingRequirements(routeText: string): string {
  return routeText.includes("פומי") ? "intact_swallowing_reflex" : "not_applicable";
}

function getManualDexterityRequirements(routeText: string): string {
  return ["עורי", "עיני", "אוזני"].some(route => routeText.includes(route)) ? 
    "basic_manual_dexterity" : "professional_administration";
}

function getCognitiveRequirements(routeText: string): string {
  return routeText.includes("פומי") ? "understanding_of_instructions" : "minimal_cognitive_requirements";
}

function getContraindications(routeText: string): string[] {
  return [`Route-specific contraindications for ${routeText} administration`];
}

function getPrecautions(routeText: string): string[] {
  return [`Standard precautions for ${routeText} route`];
}

function getMonitoringNeeds(routeText: string): string[] {
  return [`Monitor patient during and after ${routeText} administration`];
}

function getCostConsiderations(routeText: string): string {
  return routeText.includes("תוך-ורידי") ? "higher_administration_costs" : "standard_administration_costs";
}

function getAvailability(routeText: string): string {
  return "widely_available_in_israeli_healthcare_system";
}

function getInsuranceCoverage(routeText: string): string {
  return "typically_covered_by_health_insurance";
}

// Pharmacokinetic profile functions
function getAbsorptionRate(routeText: string): string {
  if (routeText.includes("תוך-ורידי")) return "immediate_no_absorption_phase";
  if (routeText.includes("פומי")) return "variable_absorption_rate";
  return "route_dependent_absorption";
}

function getBioavailability(routeText: string): string {
  if (routeText.includes("תוך-ורידי")) return "100_percent";
  if (routeText.includes("פומי")) return "variable_first_pass_dependent";
  return "route_and_medication_dependent";
}

function getFirstPassEffect(routeText: string): string {
  return routeText.includes("פומי") ? "significant_first_pass_metabolism" : "minimal_first_pass_effect";
}

function getAbsorptionVariability(routeText: string): string {
  return routeText.includes("פומי") ? "high_interpatient_variability" : "low_variability";
}

function getSystemicDistribution(routeText: string): string {
  return ["פומי", "תוך-ורידי", "תוך-שרירי"].some(route => routeText.includes(route)) ? 
    "systemic_distribution" : "primarily_local_distribution";
}

function getTissuePenetration(routeText: string): string {
  return "medication_and_route_dependent";
}

function getProteinBindingImpact(routeText: string): string {
  return "standard_protein_binding_considerations";
}

function getMetabolismPathway(routeText: string): string {
  return "medication_specific_metabolism";
}

function getEliminationRoute(routeText: string): string {
  return "primarily_hepatic_and_renal";
}

function getClearanceFactors(routeText: string): string {
  return "age_organ_function_dependent";
}

// Safety consideration functions
function getAdministrationComplications(routeText: string): string[] {
  if (routeText.includes("תוך-ורידי")) return ["Infiltration", "Phlebitis", "Air embolism"];
  if (routeText.includes("עיני")) return ["Corneal irritation", "Increased intraocular pressure"];
  return ["Standard administration complications"];
}

function getAllergicReactionRisks(routeText: string): string {
  return "monitor_for_allergic_reactions_regardless_of_route";
}

function getMechanicalComplications(routeText: string): string[] {
  if (routeText.includes("תוך-ורידי")) return ["Needle displacement", "Catheter occlusion"];
  if (routeText.includes("תוך-שרירי")) return ["Nerve damage", "Hematoma formation"];
  return ["Minimal mechanical complications"];
}

function getChronicUseEffects(routeText: string): string[] {
  if (routeText.includes("עורי")) return ["Skin sensitization", "Local tissue changes"];
  if (routeText.includes("תוך-ורידי")) return ["Venous sclerosis", "Infection risk"];
  return ["Monitor for chronic use effects"];
}

function getTissueDamageRisk(routeText: string): string {
  return routeText.includes("תוך-ורידי") ? "moderate_tissue_damage_risk" : "low_tissue_damage_risk";
}

function getDependencyPotential(routeText: string): string {
  return "medication_dependent_not_route_dependent";
}

function getPregnancySafety(routeText: string): string {
  return "consult_pregnancy_guidelines_for_specific_medications";
}

function getLactationConsiderations(routeText: string): string {
  return "evaluate_lactation_safety_for_specific_medications";
}

function getPediatricSafety(routeText: string): string {
  return routeText.includes("פומי") ? "ensure_age_appropriate_formulation" : "pediatric_specialist_consultation";
}

function getGeriatricSafety(routeText: string): string {
  return "consider_age_related_physiological_changes";
}

function getAdverseReactionManagement(routeText: string): string[] {
  return ["Stop administration immediately", "Assess patient condition", "Initiate appropriate treatment"];
}

function getOverdoseConsiderations(routeText: string): string[] {
  if (routeText.includes("תוך-ורידי")) return ["Cannot retrieve medication", "Supportive care priority"];
  if (routeText.includes("פומי")) return ["Consider gastric lavage if recent", "Activated charcoal if appropriate"];
  return ["Standard overdose management protocols"];
}

function getContaminationPrevention(routeText: string): string[] {
  if (routeText.includes("תוך-ורידי")) return ["Sterile technique", "Single-use equipment"];
  return ["Standard hygiene measures", "Clean technique"];
}

// Training requirement functions
function getRequiredSkillLevel(routeText: string): string {
  if (routeText.includes("תוך-ורידי")) return "advanced_clinical_skills";
  if (routeText.includes("תוך-שרירי")) return "intermediate_clinical_skills";
  if (["פומי", "עורי"].some(route => routeText.includes(route))) return "basic_healthcare_skills";
  return "moderate_clinical_skills";
}

function getCertificationNeeds(routeText: string): string[] {
  if (routeText.includes("תוך-ורידי")) return ["IV therapy certification", "Venipuncture training"];
  if (routeText.includes("תוך-שרירי")) return ["Injection technique certification"];
  return ["Basic medication administration training"];
}

function getCompetencyAssessment(routeText: string): string[] {
  return ["Demonstrate proper technique", "Knowledge of complications", "Emergency response capability"];
}

function getSelfAdministrationFeasibility(routeText: string): string {
  if (["פומי", "עורי", "עיני", "אוזני"].some(route => routeText.includes(route))) {
    return "feasible_with_proper_education";
  }
  return "requires_healthcare_provider_administration";
}

function getCaregiverTrainingNeeds(routeText: string): string[] {
  if (routeText.includes("פומי")) return ["Proper dosing", "Timing of administration", "Side effect recognition"];
  if (routeText.includes("עורי")) return ["Application technique", "Skin preparation", "Monitoring for reactions"];
  return ["Professional administration recommended"];
}

function getEducationMaterials(routeText: string): string[] {
  return ["Written instructions", "Demonstration videos", "Follow-up consultations"];
}

function getFacilityCapabilities(routeText: string): string[] {
  if (routeText.includes("תוך-ורידי")) return ["IV equipment", "Emergency supplies", "Trained nursing staff"];
  return ["Basic medication storage", "Standard medical supplies"];
}

function getEquipmentNeeds(routeText: string): string[] {
  if (routeText.includes("תוך-ורידי")) return ["IV catheters", "Infusion pumps", "Monitoring equipment"];
  if (routeText.includes("עיני")) return ["Eye droppers", "Sterile applicators"];
  return ["Route-specific administration supplies"];
}

function getStaffTraining(routeText: string): string[] {
  return ["Route-specific technique training", "Complication management", "Patient education skills"];
}

function getRoutePriority(routeId: number, routeText: string): number {
  // High priority routes (commonly used)
  if ([17, 2, 15, 16].includes(routeId)) return 5; // Oral, topical, eye, ear
  
  // Medium priority routes (clinical settings)
  if ([6, 5].includes(routeId)) return 3; // IV, IM
  
  // Standard priority
  return 1;
}

// ===== RESPONSE ENHANCEMENT =====

function enhanceAdministrationRoutesResponse(
  baseResponse: any,
  userInput: ListAdministrationRoutesInput,
  validationWarnings: string[]
): McpResponse<any> {
  const enhancedResponse = {
    ...baseResponse,
    data: {
      ...baseResponse.data,
      route_analysis: generateRouteAnalysis(baseResponse.data, userInput),
      clinical_decision_support: generateClinicalDecisionSupport(baseResponse.data),
      administration_strategy: generateAdministrationStrategy(baseResponse.data, userInput)
    }
  };
  
  // Add validation warnings
  if (validationWarnings.length > 0) {
    enhancedResponse.warnings = [...(enhancedResponse.warnings || []), ...validationWarnings];
  }
  
  // Enhance clinical notes
  enhancedResponse.clinical_notes = [
    ...enhancedResponse.clinical_notes,
    ...generateAdministrationRoutesNotes(userInput)
  ];
  
  // Enhance next actions
  enhancedResponse.next_suggested_actions = enhanceAdministrationRoutesNextActions(
    baseResponse.next_suggested_actions || [],
    baseResponse.data,
    userInput
  );
  
  return enhancedResponse;
}

function generateRouteAnalysis(
  routesData: any,
  userInput: ListAdministrationRoutesInput
): Record<string, unknown> {
  const routes = routesData.administration_routes || [];
  
  return {
    scope_analysis: {
      total_routes: routes.length,
      complexity_distribution: analyzeComplexityDistribution(routes),
      setting_distribution: analyzeSettingDistribution(routes),
      age_suitability: analyzeAgeSuitability(routes)
    },
    filtering_results: {
      applied_filters: {
        complexity_level: userInput.complexity_level || "all",
        patient_age_group: userInput.patient_age_group || "all",
        setting_requirements: userInput.setting_requirements || "all",
        onset_requirements: userInput.onset_requirements || "any"
      },
      filter_effectiveness: assessRouteFilterEffectiveness(routes, userInput)
    },
    clinical_utility: assessClinicalUtility(routes)
  };
}

function generateClinicalDecisionSupport(routesData: any): Record<string, string[]> {
  return {
    route_selection_criteria: [
      "Consider patient's clinical condition and consciousness level",
      "Evaluate desired onset and duration of therapeutic effect",
      "Assess patient's ability to self-administer or need for clinical support",
      "Consider cost-effectiveness and resource availability"
    ],
    emergency_considerations: [
      "IV route preferred for emergency situations requiring rapid effect",
      "Sublingual or buccal routes for conscious patients needing rapid absorption",
      "Rectal route for unconscious patients when IV access unavailable",
      "Intramuscular route for vaccines and depot medications"
    ],
    chronic_therapy_optimization: [
      "Oral routes preferred for long-term therapy due to convenience",
      "Topical routes minimize systemic side effects for local conditions",
      "Consider patient compliance and lifestyle factors",
      "Evaluate long-term safety profile of chosen route"
    ],
    special_population_guidance: [
      "Pediatric patients may require alternative formulations and routes",
      "Geriatric patients may need simplified administration methods",
      "Pregnant patients require route-specific safety assessment",
      "Patients with disabilities may need adapted administration techniques"
    ]
  };
}

function generateAdministrationStrategy(
  routesData: any,
  userInput: ListAdministrationRoutesInput
): Record<string, unknown> {
  const routes = routesData.administration_routes || [];
  
  return {
    optimal_route_selection: {
      first_line_routes: identifyFirstLineRoutes(routes, userInput),
      alternative_routes: identifyAlternativeRoutes(routes, userInput),
      last_resort_routes: identifyLastResortRoutes(routes, userInput)
    },
    implementation_planning: {
      resource_requirements: assessResourceRequirements(routes),
      training_priorities: identifyTrainingPriorities(routes),
      quality_assurance: developQualityAssurance(routes)
    },
    monitoring_strategy: {
      immediate_monitoring: getImmediateMonitoring(routes),
      ongoing_assessment: getOngoingAssessment(routes),
      outcome_evaluation: getOutcomeEvaluation(routes)
    }
  };
}

function analyzeComplexityDistribution(routes: any[]): Record<string, number> {
  const distribution = { simple: 0, moderate: 0, complex: 0 };
  
  routes.forEach(route => {
    const complexity = determineRouteComplexity(route.text);
    distribution[complexity]++;
  });
  
  return distribution;
}

function analyzeSettingDistribution(routes: any[]): Record<string, number> {
  const settings = { home_care: 0, outpatient: 0, hospital: 0, emergency: 0 };
  
  routes.forEach(route => {
    const suitableSettings = assessSettingSuitability(route.text);
    suitableSettings.forEach(setting => {
      if (setting in settings) {
        settings[setting as keyof typeof settings]++;
      }
    });
  });
  
  return settings;
}

function analyzeAgeSuitability(routes: any[]): Record<string, number> {
  const ageGroups = { pediatric: 0, adult: 0, geriatric: 0 };
  
  routes.forEach(route => {
    const suitableAges = assessAgeSuitability(route.text);
    suitableAges.forEach(age => {
      if (age in ageGroups) {
        ageGroups[age as keyof typeof ageGroups]++;
      }
    });
  });
  
  return ageGroups;
}

function assessRouteFilterEffectiveness(routes: any[], userInput: ListAdministrationRoutesInput): string {
  const hasFilters = userInput.complexity_level !== "all" || 
                    userInput.patient_age_group !== "all" || 
                    userInput.setting_requirements !== "all";
  
  if (!hasFilters) return "no_filtering_applied";
  
  return routes.length > 20 ? "moderate_filtering" : "effective_filtering";
}

function assessClinicalUtility(routes: any[]): string {
  if (routes.length >= 50) return "comprehensive_administration_options";
  if (routes.length >= 20) return "adequate_administration_coverage";
  return "focused_administration_options";
}

function identifyFirstLineRoutes(routes: any[], userInput: ListAdministrationRoutesInput): string[] {
  // Identify preferred routes based on user criteria
  const preferredRoutes = routes
    .filter(route => {
      const complexity = determineRouteComplexity(route.text);
      return complexity === "simple" || complexity === "moderate";
    })
    .slice(0, 3)
    .map(route => route.text);
  
  return preferredRoutes;
}

function identifyAlternativeRoutes(routes: any[], userInput: ListAdministrationRoutesInput): string[] {
  return routes
    .filter(route => determineRouteComplexity(route.text) !== "complex")
    .slice(3, 6)
    .map(route => route.text);
}

function identifyLastResortRoutes(routes: any[], userInput: ListAdministrationRoutesInput): string[] {
  return routes
    .filter(route => determineRouteComplexity(route.text) === "complex")
    .slice(0, 2)
    .map(route => route.text);
}

function assessResourceRequirements(routes: any[]): Record<string, string> {
  return {
    equipment_needs: "Route-specific administration supplies and monitoring equipment",
    staffing_requirements: "Appropriately trained healthcare personnel for complex routes",
    facility_capabilities: "Clinical setting appropriate for selected administration route"
  };
}

function identifyTrainingPriorities(routes: any[]): string[] {
  return [
    "Basic medication administration safety",
    "Route-specific technique competency",
    "Complication recognition and management",
    "Patient education and support"
  ];
}

function developQualityAssurance(routes: any[]): string[] {
  return [
    "Standardized administration protocols",
    "Regular competency assessment",
    "Adverse event monitoring and reporting",
    "Continuous quality improvement"
  ];
}

function getImmediateMonitoring(routes: any[]): string[] {
  return [
    "Vital signs monitoring during administration",
    "Immediate adverse reaction assessment",
    "Administration technique verification",
    "Patient comfort and tolerance evaluation"
  ];
}

function getOngoingAssessment(routes: any[]): string[] {
  return [
    "Therapeutic response monitoring",
    "Side effect surveillance",
    "Patient compliance evaluation",
    "Route-specific complication assessment"
  ];
}

function getOutcomeEvaluation(routes: any[]): string[] {
  return [
    "Treatment effectiveness assessment",
    "Patient satisfaction with administration method",
    "Quality of life impact evaluation",
    "Long-term safety profile analysis"
  ];
}

function generateAdministrationRoutesNotes(userInput: ListAdministrationRoutesInput): string[] {
  const notes: string[] = [];
  
  notes.push("Administration route selection significantly impacts therapeutic outcomes");
  notes.push("Patient-specific factors must be considered for optimal route choice");
  
  if (userInput.complexity_level) {
    notes.push(`Focused on ${userInput.complexity_level} complexity administration routes`);
  }
  
  if (userInput.patient_age_group) {
    notes.push(`Age-appropriate routes prioritized for ${userInput.patient_age_group} population`);
  }
  
  if (userInput.setting_requirements) {
    notes.push(`Routes suitable for ${userInput.setting_requirements} setting highlighted`);
  }
  
  notes.push("Route selection should align with clinical goals and patient capabilities");
  notes.push("Consider both immediate and long-term implications of route choice");
  
  return notes;
}

function enhanceAdministrationRoutesNextActions(
  baseActions: any[],
  routesData: any,
  userInput: ListAdministrationRoutesInput
): any[] {
  const enhancedActions = [...baseActions];
  
  // Add routes-specific actions
  enhancedActions.push({
    tool: "explore_generic_alternatives",
    reason: "Find medications available in preferred administration routes",
    parameters_hint: "Use administration route IDs from routes exploration"
  });
  
  enhancedActions.push({
    tool: "find_drugs_for_symptom",
    reason: "Cross-reference symptoms with route-appropriate treatments",
    parameters_hint: "Consider administration route when selecting treatments"
  });
  
  if (userInput.patient_age_group && userInput.patient_age_group !== "all") {
    enhancedActions.push({
      tool: "discover_drug_by_name",
      reason: `Find ${userInput.patient_age_group}-appropriate formulations`,
      parameters_hint: "Search for age-specific medication formulations"
    });
  }
  
  enhancedActions.push({
    tool: "explore_therapeutic_categories",
    reason: "Connect administration routes with therapeutic categories",
    parameters_hint: "Analyze route preferences within drug categories"
  });
  
  return enhancedActions;
}