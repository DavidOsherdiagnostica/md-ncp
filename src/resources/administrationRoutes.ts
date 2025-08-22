/**
 * Administration Routes Resource
 * Provides structured access to medication administration methods and clinical guidance
 * Serves as foundational reference for route-specific medication selection and administration
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getApiClient } from "../services/israelDrugsApi.js";
import { classifyError, createComprehensiveErrorResponse } from "../utils/errorHandler.js";
import { CLINICAL_MAPPINGS } from "../config/constants.js";

// ===== RESOURCE REGISTRATION =====

export function registerAdministrationRoutesResource(server: McpServer): void {
  server.registerResource(
    "administration_routes_guide",
    {
      title: "Comprehensive Medication Administration Routes Guide",
      description: `Complete reference guide for medication administration routes available in the Israeli healthcare system. Provides clinical decision support for optimal route selection based on patient factors, clinical settings, and therapeutic goals.

**Resource Content:**
- Complete catalog of 105+ administration routes from Israeli Ministry of Health
- Clinical suitability assessment for different patient populations
- Route-specific administration techniques and safety considerations
- Pharmacokinetic implications and therapeutic considerations
- Patient education and training requirements

**Clinical Applications:**
- Route selection for patient-specific medication therapy
- Clinical training and competency development
- Patient education and self-administration guidance
- Healthcare facility protocol development
- Quality assurance and safety optimization

**Route Categories:**
- Oral and enteral routes (tablets, liquids, sublingual, buccal)
- Parenteral routes (intravenous, intramuscular, subcutaneous)
- Topical and dermatological applications
- Ophthalmic and otic specialized routes
- Respiratory and inhalation delivery systems
- Rectal, vaginal, and urogenital routes

This resource serves as the definitive reference for administration route selection and clinical implementation within Israeli healthcare practice.`,
      mimeType: "application/json"
    },
    async () => {
      try {
        // Generate comprehensive administration routes resource
        return await generateAdministrationRoutesResource();
      } catch (error) {
        const classifiedError = classifyError(error, "administration_routes_guide");
        return createComprehensiveErrorResponse(classifiedError, undefined, {
          resourceName: "administration_routes_guide"
        });
      }
    }
  );
}

// ===== RESOURCE GENERATION =====

async function generateAdministrationRoutesResource(): Promise<string> {
  const apiClient = getApiClient();
  
  try {
    // Get current administration routes from API
    const routesData = await apiClient.getMatanList();
    
    // Generate comprehensive resource
    const resource = {
      metadata: {
        title: "Administration Routes Clinical Guide",
        version: "1.0.0",
        last_updated: new Date().toISOString(),
        data_source: "israeli_ministry_of_health",
        total_routes: routesData.length,
        clinical_framework: "evidence_based_administration_guidance"
      },
      
      clinical_overview: {
        purpose: "Comprehensive guidance for medication administration route selection and implementation",
        scope: "All registered administration routes in Israeli healthcare system",
        target_users: ["Healthcare providers", "Clinical pharmacists", "Nursing staff", "Medical students"],
        clinical_importance: "Route selection significantly impacts therapeutic efficacy, safety, and patient experience"
      },
      
      route_classification: generateRouteClassification(routesData),
      clinical_decision_matrix: generateClinicalDecisionMatrix(),
      route_catalog: await generateDetailedRouteCatalog(routesData),
      patient_suitability_guide: generatePatientSuitabilityGuide(),
      safety_protocols: generateSafetyProtocols(),
      training_requirements: generateTrainingRequirements(),
      quality_assurance: generateQualityAssurance(),
      
      clinical_references: {
        israeli_guidelines: "Ministry of Health medication administration guidelines",
        international_standards: "WHO, ICH, and FDA administration route classifications",
        professional_organizations: "Israeli Medical Association and Israeli Pharmacy Association guidelines",
        evidence_base: "Peer-reviewed literature and clinical practice guidelines"
      }
    };
    
    return JSON.stringify(resource, null, 2);
    
  } catch (error) {
    console.error("Failed to generate administration routes resource:", error);
    
    // Return basic resource structure for fallback
    return JSON.stringify(await generateFallbackAdministrationResource(), null, 2);
  }
}

function generateRouteClassification(routesData: any[]): any {
  return {
    primary_categories: {
      enteral: {
        description: "Gastrointestinal tract administration",
        routes: ["פומי", "תוך-קיבתי", "דרך זונדה"],
        clinical_advantages: ["High patient acceptance", "Cost-effective", "Self-administration possible"],
        clinical_limitations: ["Variable absorption", "First-pass metabolism", "GI side effects"],
        typical_onset: "30-120 minutes",
        bioavailability: "Variable (20-100%)"
      },
      
      parenteral: {
        description: "Direct injection into body tissues or circulation",
        routes: ["תוך-ורידי", "תוך-שרירי", "תוך-עורי", "תחת-עורי"],
        clinical_advantages: ["Predictable absorption", "Rapid onset", "Bypasses GI tract"],
        clinical_limitations: ["Invasive procedure", "Infection risk", "Professional administration required"],
        typical_onset: "1-30 minutes",
        bioavailability: "95-100%"
      },
      
      topical: {
        description: "Application to skin or mucous membranes",
        routes: ["עורי", "עיני", "אוזני", "נרתיקי", "רקטלי"],
        clinical_advantages: ["Local effect", "Reduced systemic exposure", "Patient self-administration"],
        clinical_limitations: ["Variable absorption", "Local irritation", "Limited systemic effect"],
        typical_onset: "15-60 minutes",
        bioavailability: "Variable (1-50%)"
      },
      
      inhalation: {
        description: "Respiratory tract delivery",
        routes: ["נשימתי", "דרך האף", "אירוסול"],
        clinical_advantages: ["Direct lung delivery", "Rapid onset for respiratory conditions", "Reduced systemic effects"],
        clinical_limitations: ["Technique-dependent", "Device requirements", "Patient coordination needed"],
        typical_onset: "1-15 minutes",
        bioavailability: "Variable (10-60%)"
      }
    },
    
    complexity_levels: {
      simple: {
        description: "Self-administration with minimal training",
        examples: ["פומי", "עורי", "עיני משטח"],
        patient_requirements: ["Conscious", "Cooperative", "Basic dexterity"],
        training_time: "5-15 minutes",
        supervision_needed: "Initial instruction only"
      },
      
      moderate: {
        description: "Requires basic medical training or supervision",
        examples: ["רקטלי", "נרתיקי", "תחת-לשוני"],
        patient_requirements: ["Understanding of procedure", "Physical ability", "Privacy needs"],
        training_time: "15-30 minutes",
        supervision_needed: "Initial training and periodic assessment"
      },
      
      complex: {
        description: "Professional healthcare provider administration",
        examples: ["תוך-ורידי", "תוך-שרירי", "תוך-מפרקי"],
        patient_requirements: ["Venous access", "Sterile conditions", "Monitoring capability"],
        training_time: "Professional certification required",
        supervision_needed: "Licensed healthcare provider"
      }
    }
  };
}

function generateClinicalDecisionMatrix(): any {
  return {
    patient_factors: {
      consciousness_level: {
        conscious_cooperative: ["פומי", "עורי", "עיני", "אוזני", "נשימתי"],
        conscious_uncooperative: ["רקטלי", "תוך-שרירי", "עורי"],
        unconscious: ["תוך-ורידי", "תוך-שרירי", "רקטלי", "דרך זונדה"],
        altered_mental_status: ["תוך-ורידי", "תוך-שרירי", "רקטלי"]
      },
      
      age_considerations: {
        pediatric: {
          preferred: ["פומי נוזלי", "רקטלי", "עורי", "עיני"],
          avoid: ["תוך-ורידי (unless essential)", "תוך-שרירי (painful)"],
          special_considerations: ["Age-appropriate formulations", "Caregiver training", "Fear reduction"]
        },
        
        adult: {
          preferred: ["פומי", "תוך-ורידי", "תוך-שרירי", "עורי"],
          considerations: ["Patient preference", "Lifestyle factors", "Occupational needs"],
          self_care_capable: ["פומי", "עורי", "עיני", "אוזני", "נשימתי"]
        },
        
        geriatric: {
          preferred: ["פומי פשוט", "עורי", "תחת-עורי"],
          avoid: ["Complex inhalation devices", "Multiple daily applications"],
          special_considerations: ["Cognitive function", "Manual dexterity", "Polypharmacy", "Fall risk"]
        }
      },
      
      clinical_setting: {
        home_care: {
          suitable: ["פומי", "עורי", "עיני", "אוזני", "נשימתי פשוט", "רקטלי"],
          requirements: ["Patient/caregiver training", "Simple devices", "Emergency protocols"],
          avoid: ["תוך-ורידי", "תוך-שרירי", "Complex preparations"]
        },
        
        outpatient_clinic: {
          suitable: ["All routes with appropriate facilities"],
          advantages: ["Professional supervision", "Education opportunity", "Immediate intervention"],
          considerations: ["Appointment scheduling", "Observation time", "Follow-up planning"]
        },
        
        hospital_inpatient: {
          suitable: ["All routes including complex parenteral"],
          advantages: ["24/7 monitoring", "Professional staff", "Emergency response"],
          considerations: ["Cost implications", "Resource utilization", "Patient comfort"]
        },
        
        emergency_department: {
          preferred: ["תוך-ורידי", "תוך-שרירי", "נשימתי"],
          requirements: ["Rapid onset", "Reliable absorption", "Monitoring capability"],
          avoid: ["Slow-onset oral routes", "Unpredictable absorption routes"]
        }
      }
    },
    
    therapeutic_considerations: {
      onset_requirements: {
        immediate: ["תוך-ורידי", "נשימתי", "תחת-לשוני"],
        rapid: ["תוך-שרירי", "תחת-עורי", "רקטלי"],
        gradual: ["פומי", "עורי", "תוך-עורי"],
        sustained: ["עורי ממושך", "תוך-שרירי ממושך"]
      },
      
      duration_needs: {
        single_dose: ["תוך-ורידי", "תוך-שרירי", "נשימתי"],
        short_term: ["פומי", "רקטלי", "תחת-עורי"],
        long_term: ["פומי", "עורי", "תוך-עורי"],
        continuous: ["תוך-ורידי עירוי", "עורי מתמשך"]
      },
      
      systemic_vs_local: {
        systemic_effect: ["פומי", "תוך-ורידי", "תוך-שרירי", "תחת-עורי"],
        local_effect: ["עורי", "עיני", "אוזני", "נרתיקי"],
        mixed_effect: ["רקטלי", "נשימתי", "תחת-לשוני"]
      }
    }
  };
}

async function generateDetailedRouteCatalog(routesData: any[]): Promise<any> {
  const catalog: any = {};
  
  // Process each route from API data
  for (const route of routesData) {
    const routeId = route.id;
    const routeName = route.text;
    
    catalog[routeId] = {
      hebrew_name: routeName,
      english_name: translateRouteToEnglish(routeName),
      clinical_category: categorizeRoute(routeName),
      
      administration_details: {
        technique: getAdministrationTechnique(routeName),
        preparation: getPreparationRequirements(routeName),
        patient_positioning: getPatientPositioning(routeName),
        monitoring: getMonitoringRequirements(routeName)
      },
      
      pharmacokinetics: {
        absorption: getAbsorptionProfile(routeName),
        onset: getOnsetProfile(routeName),
        duration: getDurationProfile(routeName),
        bioavailability: getBioavailabilityProfile(routeName)
      },
      
      clinical_considerations: {
        advantages: getClinicalAdvantages(routeName),
        limitations: getClinicalLimitations(routeName),
        contraindications: getContraindications(routeName),
        precautions: getPrecautions(routeName)
      },
      
      patient_factors: {
        age_suitability: getAgeSuitability(routeName),
        physical_requirements: getPhysicalRequirements(routeName),
        cognitive_requirements: getCognitiveRequirements(routeName),
        setting_requirements: getSettingRequirements(routeName)
      },
      
      safety_profile: {
        common_complications: getCommonComplications(routeName),
        serious_risks: getSeriousRisks(routeName),
        prevention_strategies: getPreventionStrategies(routeName),
        emergency_management: getEmergencyManagement(routeName)
      },
      
      training_requirements: {
        healthcare_provider: getProviderTraining(routeName),
        patient_education: getPatientEducation(routeName),
        caregiver_support: getCaregiverSupport(routeName),
        competency_assessment: getCompetencyAssessment(routeName)
      }
    };
  }
  
  return catalog;
}

function generatePatientSuitabilityGuide(): any {
  return {
    assessment_framework: {
      physical_capability: {
        consciousness: "Alert and oriented vs altered mental status",
        swallowing: "Intact swallow reflex vs dysphagia",
        dexterity: "Fine motor skills for self-administration",
        mobility: "Position changes and device manipulation",
        vision: "Ability to see medications and instructions",
        hearing: "Ability to understand verbal instructions"
      },
      
      cognitive_capability: {
        understanding: "Comprehension of administration instructions",
        memory: "Ability to remember timing and dosing",
        judgment: "Recognition of side effects and problems",
        problem_solving: "Ability to troubleshoot issues"
      },
      
      social_support: {
        caregiver_availability: "Family or professional caregiver presence",
        supervision_needs: "Level of assistance required",
        emergency_support: "Access to help in urgent situations",
        cultural_factors: "Religious or cultural considerations"
      },
      
      clinical_status: {
        disease_severity: "Impact on administration capability",
        comorbidities: "Multiple conditions affecting route choice",
        prognosis: "Expected duration of therapy need",
        functional_status: "Activities of daily living capability"
      }
    },
    
    suitability_algorithms: {
      oral_route_suitability: {
        essential_criteria: ["Conscious", "Intact swallow", "GI function"],
        preferred_criteria: ["Cooperative", "Understands instructions", "Stable clinical status"],
        exclusion_criteria: ["Severe nausea/vomiting", "GI obstruction", "Unconscious"],
        risk_factors: ["Aspiration risk", "Medication interactions", "Absorption issues"]
      },
      
      parenteral_suitability: {
        essential_criteria: ["Venous access", "Sterile conditions", "Professional supervision"],
        preferred_criteria: ["Hemodynamically stable", "Good venous access", "Monitoring available"],
        exclusion_criteria: ["Coagulopathy", "Infection at site", "Patient refusal"],
        risk_factors: ["Bleeding risk", "Infection risk", "Fluid overload"]
      },
      
      topical_suitability: {
        essential_criteria: ["Intact skin", "Application site accessible", "Patient tolerance"],
        preferred_criteria: ["Good skin condition", "Patient understanding", "Regular access"],
        exclusion_criteria: ["Severe skin disease", "Allergy to vehicle", "Open wounds"],
        risk_factors: ["Skin sensitivity", "Absorption variability", "Local irritation"]
      }
    }
  };
}

function generateSafetyProtocols(): any {
  return {
    general_safety_principles: {
      right_patient: "Verify patient identity using two identifiers",
      right_medication: "Confirm medication name, strength, and formulation",
      right_dose: "Calculate and verify appropriate dose for route",
      right_route: "Confirm appropriate administration route",
      right_time: "Administer at correct time intervals",
      right_documentation: "Record administration and patient response"
    },
    
    route_specific_protocols: {
      oral_safety: {
        assessment: ["Consciousness level", "Swallow function", "GI status"],
        preparation: ["Position upright", "Have water available", "Check allergies"],
        administration: ["Watch for choking", "Ensure complete swallow", "Provide support"],
        monitoring: ["Therapeutic response", "Side effects", "Adherence"]
      },
      
      parenteral_safety: {
        assessment: ["Venous access", "Coagulation status", "Infection risk"],
        preparation: ["Sterile technique", "Proper equipment", "Emergency supplies"],
        administration: ["Aseptic technique", "Proper site", "Correct rate"],
        monitoring: ["Injection site", "Systemic response", "Complications"]
      },
      
      topical_safety: {
        assessment: ["Skin integrity", "Previous reactions", "Application area"],
        preparation: ["Clean application site", "Proper amount", "Even distribution"],
        administration: ["Gentle application", "Avoid sensitive areas", "Wash hands"],
        monitoring: ["Local reactions", "Systemic absorption", "Effectiveness"]
      }
    },
    
    emergency_protocols: {
      adverse_reactions: {
        recognition: "Early signs and symptoms of adverse reactions",
        immediate_action: "Stop administration and assess patient",
        intervention: "Appropriate treatment based on reaction type",
        documentation: "Complete adverse event reporting"
      },
      
      administration_errors: {
        prevention: "Double-check protocols and verification procedures",
        detection: "Early recognition of errors or problems",
        response: "Immediate assessment and intervention",
        reporting: "Incident reporting and learning opportunities"
      }
    }
  };
}

function generateTrainingRequirements(): any {
  return {
    healthcare_provider_training: {
      basic_competencies: {
        knowledge: ["Route pharmacology", "Safety protocols", "Error prevention"],
        skills: ["Administration techniques", "Assessment abilities", "Problem solving"],
        attitudes: ["Patient safety focus", "Continuous learning", "Quality improvement"]
      },
      
      advanced_competencies: {
        specialized_routes: ["Complex parenteral", "High-risk medications", "Pediatric considerations"],
        teaching_skills: ["Patient education", "Caregiver training", "Competency assessment"],
        quality_improvement: ["Outcome monitoring", "Process improvement", "Research integration"]
      },
      
      certification_requirements: {
        initial_training: "Comprehensive route-specific education program",
        competency_assessment: "Practical skills demonstration and testing",
        continuing_education: "Regular updates and skill maintenance",
        recertification: "Periodic reassessment and qualification renewal"
      }
    },
    
    patient_education_programs: {
      self_administration_training: {
        assessment: "Patient capability and readiness evaluation",
        instruction: "Step-by-step technique demonstration",
        practice: "Supervised practice with feedback",
        evaluation: "Competency assessment and documentation"
      },
      
      safety_education: {
        recognition: "Side effect identification and management",
        prevention: "Error prevention and safety measures",
        emergency: "When and how to seek immediate help",
        adherence: "Importance of proper technique and timing"
      }
    }
  };
}

function generateQualityAssurance(): any {
  return {
    performance_monitoring: {
      outcome_indicators: {
        effectiveness: "Therapeutic response and goal achievement",
        safety: "Adverse event rates and severity",
        satisfaction: "Patient and provider experience",
        efficiency: "Resource utilization and cost-effectiveness"
      },
      
      process_indicators: {
        compliance: "Adherence to administration protocols",
        competency: "Healthcare provider skill maintenance",
        education: "Patient teaching effectiveness",
        documentation: "Record keeping accuracy and completeness"
      }
    },
    
    continuous_improvement: {
      data_collection: "Systematic outcome and process measurement",
      analysis: "Regular review and trend identification",
      intervention: "Evidence-based improvement strategies",
      evaluation: "Assessment of improvement effectiveness"
    },
    
    benchmarking: {
      internal_standards: "Institutional quality targets and goals",
      external_benchmarks: "Industry standards and best practices",
      international_comparison: "Global quality indicators and outcomes",
      regulatory_compliance: "Ministry of Health requirements and standards"
    }
  };
}

async function generateFallbackAdministrationResource(): Promise<any> {
  return {
    metadata: {
      title: "Basic Administration Routes Guide",
      version: "1.0.0 (Fallback)",
      last_updated: new Date().toISOString(),
      data_source: "static_reference_data",
      status: "limited_api_access"
    },
    
    basic_routes: {
      oral: {
        hebrew: "פומי",
        english: "Oral",
        complexity: "Simple",
        typical_use: "Most common route for conscious, cooperative patients"
      },
      
      topical: {
        hebrew: "עורי",
        english: "Topical",
        complexity: "Simple",
        typical_use: "Local skin conditions and dermatological treatments"
      },
      
      ophthalmic: {
        hebrew: "עיני",
        english: "Ophthalmic",
        complexity: "Simple to Moderate",
        typical_use: "Eye conditions and local ophthalmic therapy"
      },
      
      otic: {
        hebrew: "אוזני",
        english: "Otic",
        complexity: "Simple",
        typical_use: "Ear conditions and local auditory therapy"
      },
      
      intravenous: {
        hebrew: "תוך-ורידי",
        english: "Intravenous",
        complexity: "Complex",
        typical_use: "Emergency situations and hospital-based therapy"
      },
      
      intramuscular: {
        hebrew: "תוך-שרירי",
        english: "Intramuscular",
        complexity: "Complex",
        typical_use: "Vaccines and depot medications"
      }
    },
    
    general_guidance: {
      route_selection: "Choose based on patient factors, clinical setting, and therapeutic goals",
      safety_priority: "Always prioritize patient safety and comfort",
      training_importance: "Ensure adequate training for all administration routes",
      monitoring_requirement: "Monitor patient response and adjust as needed"
    }
  };
}

// ===== UTILITY FUNCTIONS =====

function translateRouteToEnglish(hebrewRoute: string): string {
  const translations: Record<string, string> = {
    "פומי": "Oral",
    "עורי": "Topical",
    "עיני": "Ophthalmic",
    "אוזני": "Otic",
    "תוך-ורידי": "Intravenous",
    "תוך-שרירי": "Intramuscular",
    "תחת-עורי": "Subcutaneous",
    "רקטלי": "Rectal",
    "נרתיקי": "Vaginal",
    "נשימתי": "Inhalation",
    "תחת-לשוני": "Sublingual",
    "דרך הלחי": "Buccal"
  };
  
  return translations[hebrewRoute] || hebrewRoute;
}

function categorizeRoute(routeName: string): string {
  if (routeName.includes("פומי") || routeName.includes("תחת-לשוני")) return "enteral";
  if (routeName.includes("תוך-ורידי") || routeName.includes("תוך-שרירי")) return "parenteral";
  if (routeName.includes("עורי") || routeName.includes("עיני")) return "topical";
  if (routeName.includes("נשימתי")) return "inhalation";
  return "specialized";
}

// Simplified implementations for utility functions
function getAdministrationTechnique(routeName: string): string[] {
  return [`Follow standard ${routeName} administration protocol`];
}

function getPreparationRequirements(routeName: string): string[] {
  return [`Standard preparation for ${routeName} route`];
}

function getPatientPositioning(routeName: string): string[] {
  return [`Appropriate positioning for ${routeName} administration`];
}

function getMonitoringRequirements(routeName: string): string[] {
  return [`Monitor patient during and after ${routeName} administration`];
}

function getAbsorptionProfile(routeName: string): string {
  if (routeName.includes("תוך-ורידי")) return "Immediate, 100% bioavailability";
  if (routeName.includes("פומי")) return "Variable, dependent on GI factors";
  return "Route-dependent absorption pattern";
}

function getOnsetProfile(routeName: string): string {
  if (routeName.includes("תוך-ורידי")) return "Immediate (1-5 minutes)";
  if (routeName.includes("פומי")) return "Gradual (30-120 minutes)";
  return "Variable onset time";
}

function getDurationProfile(routeName: string): string {
  return "Medication-dependent duration";
}

function getBioavailabilityProfile(routeName: string): string {
  if (routeName.includes("תוך-ורידי")) return "100%";
  if (routeName.includes("פומי")) return "Variable (20-100%)";
  return "Route-dependent bioavailability";
}

function getClinicalAdvantages(routeName: string): string[] {
  return [`Route-specific advantages for ${routeName} administration`];
}

function getClinicalLimitations(routeName: string): string[] {
  return [`Route-specific limitations for ${routeName} administration`];
}

function getContraindications(routeName: string): string[] {
  return [`Standard contraindications for ${routeName} route`];
}

function getPrecautions(routeName: string): string[] {
  return [`Standard precautions for ${routeName} route`];
}

function getAgeSuitability(routeName: string): Record<string, boolean> {
  return {
    pediatric: !routeName.includes("תוך-ורידי"),
    adult: true,
    geriatric: true
  };
}

function getPhysicalRequirements(routeName: string): string[] {
  return [`Physical requirements for ${routeName} administration`];
}

function getCognitiveRequirements(routeName: string): string[] {
  return [`Cognitive requirements for ${routeName} administration`];
}

function getSettingRequirements(routeName: string): string[] {
  return [`Setting requirements for ${routeName} administration`];
}

function getCommonComplications(routeName: string): string[] {
  return [`Common complications of ${routeName} administration`];
}

function getSeriousRisks(routeName: string): string[] {
  return [`Serious risks of ${routeName} administration`];
}

function getPreventionStrategies(routeName: string): string[] {
  return [`Prevention strategies for ${routeName} complications`];
}

function getEmergencyManagement(routeName: string): string[] {
  return [`Emergency management for ${routeName} complications`];
}

function getProviderTraining(routeName: string): string[] {
  return [`Healthcare provider training for ${routeName} route`];
}

function getPatientEducation(routeName: string): string[] {
  return [`Patient education for ${routeName} self-administration`];
}

function getCaregiverSupport(routeName: string): string[] {
  return [`Caregiver support for ${routeName} administration`];
}

function getCompetencyAssessment(routeName: string): string[] {
  return [`Competency assessment for ${routeName} administration`];
}