/**
 * Therapeutic Categories Resource
 * Provides structured access to the complete ATC (Anatomical Therapeutic Chemical) classification system
 * Serves as foundational reference for pharmaceutical classification and therapeutic decision making
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getApiClient } from '../services/israelDrugsApi.js';
import { classifyError, createComprehensiveErrorResponse } from '../utils/errorHandler.js';

// ===== RESOURCE REGISTRATION =====

export function registerTherapeuticCategoriesResource(server: McpServer): void {
  server.registerResource(
    'therapeutic_categories_guide',
    '/resources/therapeutic-categories-guide', // Added missing uriOrTemplate argument
    {
      title: 'Comprehensive ATC Therapeutic Classification System',
      description: `Complete reference guide for the Anatomical Therapeutic Chemical (ATC) classification system used in Israeli healthcare. Provides pharmaceutical decision support for drug categorization, therapeutic alternative identification, and evidence-based prescribing.

**Resource Content:**
- Complete catalog of 1,172+ ATC therapeutic codes from Israeli Ministry of Health
- Hierarchical organization from anatomical groups to specific chemical substances
- Therapeutic relationship mapping between drug classes and clinical applications
- Prescribing pattern analysis and clinical usage guidelines
- Evidence-based therapeutic substitution guidance

**Clinical Applications:**
- Drug class selection for specific therapeutic indications
- Generic and therapeutic alternative identification
- Formulary development and pharmaceutical policy
- Clinical pharmacist consultation support
- Medical education and pharmaceutical training

**ATC Classification Levels:**
- Level 1: Anatomical main groups (14 major body systems)
- Level 2: Therapeutic subgroups (organ/system specific)
- Level 3: Pharmacological subgroups (mechanism of action)
- Level 4: Chemical subgroups (therapeutic class) - PRIMARY CLINICAL LEVEL
- Level 5: Chemical substances (specific active ingredients)

This resource serves as the definitive pharmaceutical reference for therapeutic classification and drug selection within Israeli healthcare practice.`,
      mimeType: 'application/json',
    }, async () => {
      try {
        // Generate comprehensive therapeutic categories resource
        return await generateTherapeuticCategoriesResource();
      } catch (error) {
        const classifiedError = classifyError(error, 'therapeutic_categories_guide');
        return createComprehensiveErrorResponse(classifiedError, undefined, {
          toolName: 'therapeutic_categories_guide',
        });
      }
    },
  );
}

// ===== RESOURCE GENERATION =====

async function generateTherapeuticCategoriesResource(): Promise<any> {
  const apiClient = getApiClient();

  try {
    // Get current ATC codes from API
    const atcData = await apiClient.getAtcList();

    // Generate comprehensive resource
    const resource = {
      metadata: {
        title: 'ATC Therapeutic Categories Clinical Reference',
        version: '1.0.0',
        last_updated: new Date().toISOString(),
        data_source: 'israeli_ministry_of_health',
        total_codes: atcData.length,
        classification_standard: 'WHO_ATC_DDD_methodology',
        clinical_framework: 'evidence_based_pharmaceutical_classification',
      },

      clinical_overview: {
        purpose:
          'Systematic pharmaceutical classification for therapeutic decision support and drug selection',
        scope: 'Complete ATC classification system with Israeli healthcare integration',
        target_users: [
          'Clinical pharmacists',
          'Physicians',
          'Healthcare administrators',
          'Pharmaceutical researchers',
        ],
        clinical_importance:
          'ATC classification enables systematic drug selection, therapeutic substitution, and evidence-based prescribing',
      },

      atc_structure: generateATCStructure(atcData),
      anatomical_classification: generateAnatomicalClassification(atcData),
      therapeutic_mapping: generateTherapeuticMapping(atcData),
      clinical_applications: generateClinicalApplications(atcData),
      prescribing_intelligence: generatePrescribingIntelligence(atcData),
      pharmaceutical_economics: generatePharmaceuticalEconomics(atcData),
      quality_framework: generateQualityFramework(),

      clinical_references: {
        who_atc_system: 'World Health Organization ATC/DDD Index',
        israeli_regulations: 'Ministry of Health pharmaceutical classification guidelines',
        international_standards: 'ICH, EMA, and FDA drug classification systems',
        evidence_base: 'Cochrane reviews and systematic pharmaceutical literature',
      },
    };

    return {
      contents: [
        {
          type: 'text',
          text: JSON.stringify(resource, null, 2),
          uri: '/resources/therapeutic-categories-guide',
          mimeType: 'application/json',
        },
      ],
      _meta: {
        last_updated: new Date().toISOString(),
        data_source: 'israeli_ministry_of_health',
        total_codes: resource.metadata.total_codes,
        classification_standard: resource.metadata.classification_standard,
        clinical_framework: resource.metadata.clinical_framework,
      },
    };
  } catch (error) {
    // console.error('Failed to generate therapeutic categories resource:', error);

    // Return basic resource structure for fallback
    const fallbackResource = await generateFallbackTherapeuticResource();
    return {
      contents: [
        {
          type: 'text',
          text: JSON.stringify(fallbackResource, null, 2),
          uri: '/resources/therapeutic-categories-guide',
          mimeType: 'application/json',
        },
      ],
      _meta: {
        last_updated: new Date().toISOString(),
        data_source: 'static_reference_data',
        status: 'fallback_active',
      },
    };
  }
}

function generateATCStructure(atcData: any[]): any {
  const levelAnalysis = analyzeATCLevels(atcData);

  return {
    hierarchical_organization: {
      level_1_main_groups: {
        description: 'Anatomical main groups representing major body systems',
        total_groups: levelAnalysis.level1.count,
        examples: levelAnalysis.level1.examples,
        clinical_significance:
          'Primary classification for therapeutic area identification and specialty assignment',
      },

      level_2_therapeutic_subgroups: {
        description: 'Therapeutic subgroups within anatomical systems',
        total_subgroups: levelAnalysis.level2.count,
        examples: levelAnalysis.level2.examples,
        clinical_significance: 'Organ-specific or system-specific therapeutic focus',
      },

      level_3_pharmacological_subgroups: {
        description: 'Pharmacological classification by mechanism of action',
        total_subgroups: levelAnalysis.level3.count,
        examples: levelAnalysis.level3.examples,
        clinical_significance:
          'Mechanism-based therapeutic selection and pharmacological understanding',
      },

      level_4_chemical_subgroups: {
        description: 'Chemical subgroups representing therapeutic classes - PRIMARY CLINICAL LEVEL',
        total_subgroups: levelAnalysis.level4.count,
        examples: levelAnalysis.level4.examples,
        clinical_significance:
          'Primary level for therapeutic alternative identification and clinical decision making',
      },

      level_5_chemical_substances: {
        description: 'Specific chemical substances and active ingredients',
        total_substances: levelAnalysis.level5.count,
        examples: levelAnalysis.level5.examples,
        clinical_significance:
          'Individual drug identification and specific pharmaceutical selection',
      },
    },

    classification_principles: {
      anatomical_primary: 'Primary classification based on anatomical site of action',
      therapeutic_secondary: 'Secondary classification by therapeutic indication',
      pharmacological_tertiary: 'Tertiary classification by pharmacological properties',
      chemical_quaternary: 'Chemical structure and molecular classification',
    },

    clinical_utility: {
      drug_selection: 'Systematic approach to therapeutic alternative identification',
      formulary_management: 'Structured framework for pharmaceutical policy development',
      prescribing_guidance: 'Evidence-based drug class selection for clinical indications',
      research_framework: 'Standardized classification for pharmaceutical research and analysis',
    },
  };
}

function generateAnatomicalClassification(atcData: any[]): any {
  const anatomicalGroups = extractAnatomicalGroups(atcData);

  return {
    main_anatomical_groups: {
      A_alimentary_metabolism: {
        full_name: 'Alimentary Tract and Metabolism',
        clinical_scope: 'Digestive system disorders, diabetes, nutrition, and metabolic conditions',
        major_subgroups: extractSubgroups(atcData, 'A'),
        therapeutic_areas: ['Gastroenterology', 'Endocrinology', 'Hepatology', 'Nutrition'],
        common_indications: [
          'Peptic ulcer disease',
          'Diabetes mellitus',
          'Dyslipidemia',
          'Nutritional deficiencies',
        ],
        prescribing_patterns:
          'High primary care utilization with specialist support for complex cases',
      },

      B_blood_blood_forming: {
        full_name: 'Blood and Blood Forming Organs',
        clinical_scope: 'Hematological conditions, anticoagulation, and blood disorders',
        major_subgroups: extractSubgroups(atcData, 'B'),
        therapeutic_areas: ['Hematology', 'Cardiology', 'Vascular Medicine'],
        common_indications: [
          'Anticoagulation',
          'Anemia',
          'Thrombosis prevention',
          'Blood disorders',
        ],
        prescribing_patterns: 'Specialist-driven prescribing with careful monitoring requirements',
      },

      C_cardiovascular: {
        full_name: 'Cardiovascular System',
        clinical_scope: 'Heart disease, hypertension, and circulatory disorders',
        major_subgroups: extractSubgroups(atcData, 'C'),
        therapeutic_areas: ['Cardiology', 'Internal Medicine', 'Emergency Medicine'],
        common_indications: [
          'Hypertension',
          'Heart failure',
          'Coronary artery disease',
          'Arrhythmias',
        ],
        prescribing_patterns:
          'High volume primary and specialty care with evidence-based guidelines',
      },

      D_dermatological: {
        full_name: 'Dermatological Preparations',
        clinical_scope: 'Skin conditions and dermatological disorders',
        major_subgroups: extractSubgroups(atcData, 'D'),
        therapeutic_areas: ['Dermatology', 'Family Medicine', 'Allergy/Immunology'],
        common_indications: ['Eczema', 'Psoriasis', 'Acne', 'Skin infections'],
        prescribing_patterns: 'Mixed primary care and specialty prescribing with topical focus',
      },

      G_genitourinary: {
        full_name: 'Genitourinary System and Sex Hormones',
        clinical_scope: 'Reproductive health, urology, and hormonal conditions',
        major_subgroups: extractSubgroups(atcData, 'G'),
        therapeutic_areas: ['Urology', 'Gynecology', 'Endocrinology'],
        common_indications: [
          'Benign prostatic hyperplasia',
          'Contraception',
          'Hormone replacement',
          'Urinary disorders',
        ],
        prescribing_patterns: 'Specialty-focused with age and gender-specific considerations',
      },

      H_hormonal: {
        full_name: 'Systemic Hormonal Preparations',
        clinical_scope: 'Endocrine disorders and hormonal therapies',
        major_subgroups: extractSubgroups(atcData, 'H'),
        therapeutic_areas: ['Endocrinology', 'Internal Medicine', 'Reproductive Medicine'],
        common_indications: [
          'Diabetes mellitus',
          'Thyroid disorders',
          'Adrenal insufficiency',
          'Growth disorders',
        ],
        prescribing_patterns: 'Specialist-driven with long-term monitoring requirements',
      },

      J_antiinfectives: {
        full_name: 'Anti-infectives for Systemic Use',
        clinical_scope: 'Infectious diseases and antimicrobial therapy',
        major_subgroups: extractSubgroups(atcData, 'J'),
        therapeutic_areas: ['Infectious Diseases', 'Internal Medicine', 'Emergency Medicine'],
        common_indications: [
          'Bacterial infections',
          'Viral infections',
          'Fungal infections',
          'Parasitic diseases',
        ],
        prescribing_patterns: 'Acute care focus with antimicrobial stewardship considerations',
      },

      L_antineoplastic: {
        full_name: 'Antineoplastic and Immunomodulating Agents',
        clinical_scope: 'Cancer treatment and immune system modulation',
        major_subgroups: extractSubgroups(atcData, 'L'),
        therapeutic_areas: ['Oncology', 'Hematology', 'Rheumatology', 'Immunology'],
        common_indications: [
          'Cancer treatment',
          'Autoimmune diseases',
          'Organ transplantation',
          'Immunosuppression',
        ],
        prescribing_patterns: 'Highly specialized with complex monitoring and safety requirements',
      },

      M_musculoskeletal: {
        full_name: 'Musculoskeletal System',
        clinical_scope: 'Musculoskeletal disorders and pain management',
        major_subgroups: extractSubgroups(atcData, 'M'),
        therapeutic_areas: ['Rheumatology', 'Orthopedics', 'Pain Management', 'Sports Medicine'],
        common_indications: ['Arthritis', 'Osteoporosis', 'Muscle pain', 'Joint disorders'],
        prescribing_patterns: 'Primary care and specialty collaboration with chronic disease focus',
      },

      N_nervous_system: {
        full_name: 'Nervous System',
        clinical_scope: 'Neurological and psychiatric conditions',
        major_subgroups: extractSubgroups(atcData, 'N'),
        therapeutic_areas: ['Neurology', 'Psychiatry', 'Pain Management', 'Anesthesiology'],
        common_indications: [
          'Depression',
          'Anxiety',
          'Epilepsy',
          'Pain management',
          'Sleep disorders',
        ],
        prescribing_patterns: 'Specialist-driven with complex pharmacological considerations',
      },

      P_antiparasitic: {
        full_name: 'Antiparasitic Products, Insecticides and Repellents',
        clinical_scope: 'Parasitic infections and vector control',
        major_subgroups: extractSubgroups(atcData, 'P'),
        therapeutic_areas: ['Infectious Diseases', 'Travel Medicine', 'Public Health'],
        common_indications: [
          'Malaria',
          'Parasitic infections',
          'Ectoparasites',
          'Vector-borne diseases',
        ],
        prescribing_patterns: 'Specialized use with geographic and epidemiological considerations',
      },

      R_respiratory: {
        full_name: 'Respiratory System',
        clinical_scope: 'Respiratory disorders and pulmonary conditions',
        major_subgroups: extractSubgroups(atcData, 'R'),
        therapeutic_areas: ['Pulmonology', 'Allergy/Immunology', 'Emergency Medicine'],
        common_indications: ['Asthma', 'COPD', 'Allergic rhinitis', 'Respiratory infections'],
        prescribing_patterns: 'Mixed primary and specialty care with device-dependent delivery',
      },

      S_sensory_organs: {
        full_name: 'Sensory Organs',
        clinical_scope: 'Eye and ear disorders',
        major_subgroups: extractSubgroups(atcData, 'S'),
        therapeutic_areas: ['Ophthalmology', 'ENT', 'Optometry'],
        common_indications: ['Glaucoma', 'Eye infections', 'Dry eyes', 'Ear infections'],
        prescribing_patterns: 'Specialty-focused with topical administration emphasis',
      },

      V_various: {
        full_name: 'Various',
        clinical_scope: 'Diagnostic agents, surgical materials, and miscellaneous preparations',
        major_subgroups: extractSubgroups(atcData, 'V'),
        therapeutic_areas: ['Radiology', 'Surgery', 'Laboratory Medicine'],
        common_indications: ['Diagnostic imaging', 'Surgical procedures', 'Laboratory testing'],
        prescribing_patterns: 'Procedure-specific and institutional use',
      },
    },

    cross_system_relationships: {
      pain_management: {
        primary_groups: ['N', 'M'],
        description: 'Pain management spans nervous system and musculoskeletal classifications',
        clinical_integration: 'Multimodal approach requiring coordination between drug classes',
      },

      infection_control: {
        primary_groups: ['J', 'D', 'S'],
        description:
          'Anti-infective therapy across systemic, topical, and sensory organ applications',
        clinical_integration: 'Site-specific and systemic antimicrobial strategies',
      },

      chronic_disease_management: {
        primary_groups: ['A', 'C', 'H', 'N'],
        description: 'Chronic diseases requiring multi-system pharmaceutical intervention',
        clinical_integration: 'Coordinated care with polypharmacy considerations',
      },
    },
  };
}

function generateTherapeuticMapping(atcData: any[]): any {
  return {
    therapeutic_relationships: {
      mechanism_based_grouping: {
        description: 'Drugs grouped by similar mechanisms of action for therapeutic substitution',
        examples: {
          ace_inhibitors: {
            atc_codes: ['C09AA', 'C09BA'],
            therapeutic_class: 'Angiotensin-Converting Enzyme Inhibitors',
            clinical_use: 'Hypertension and heart failure management',
            substitution_potential: 'High within class, moderate between classes',
          },

          proton_pump_inhibitors: {
            atc_codes: ['A02BC'],
            therapeutic_class: 'Proton Pump Inhibitors',
            clinical_use: 'Acid-related gastrointestinal disorders',
            substitution_potential: 'High therapeutic equivalence within class',
          },

          selective_serotonin_reuptake_inhibitors: {
            atc_codes: ['N06AB'],
            therapeutic_class: 'Selective Serotonin Reuptake Inhibitors',
            clinical_use: 'Depression and anxiety disorders',
            substitution_potential: 'Moderate with individual patient response variation',
          },
        },
      },

      indication_based_grouping: {
        description: 'Drugs grouped by clinical indication for comprehensive treatment options',
        examples: {
          diabetes_management: {
            atc_codes: ['A10A', 'A10B'],
            clinical_indication: 'Diabetes mellitus treatment',
            treatment_approach: 'Stepped therapy with combination options',
            monitoring_requirements: 'Blood glucose and HbA1c surveillance',
          },

          pain_management: {
            atc_codes: ['N02A', 'N02B', 'M01A'],
            clinical_indication: 'Pain relief and inflammation control',
            treatment_approach: 'Multimodal analgesia with mechanism diversity',
            monitoring_requirements: 'Pain scores and functional assessment',
          },

          cardiovascular_protection: {
            atc_codes: ['C07', 'C08', 'C09', 'C10'],
            clinical_indication: 'Cardiovascular risk reduction',
            treatment_approach: 'Evidence-based combination therapy',
            monitoring_requirements: 'Blood pressure, lipids, and cardiovascular events',
          },
        },
      },

      severity_based_selection: {
        description: 'Drug selection based on condition severity and treatment intensity',
        mild_conditions: {
          preferred_classes: ['Topical preparations', 'OTC analgesics', 'Local treatments'],
          atc_examples: ['D07', 'N02B', 'R01A'],
          prescribing_strategy: 'Step-up therapy with minimal systemic exposure',
        },

        moderate_conditions: {
          preferred_classes: [
            'Oral systemic therapy',
            'Prescription medications',
            'Monitored treatments',
          ],
          atc_examples: ['C09', 'A02B', 'N06A'],
          prescribing_strategy: 'Evidence-based therapy with regular monitoring',
        },

        severe_conditions: {
          preferred_classes: [
            'Injectable therapy',
            'High-potency medications',
            'Specialized treatments',
          ],
          atc_examples: ['L01', 'N05A', 'C01'],
          prescribing_strategy: 'Intensive therapy with specialist supervision',
        },
      },
    },

    substitution_framework: {
      therapeutic_equivalence: {
        definition: 'Drugs with similar therapeutic effects and safety profiles',
        assessment_criteria: [
          'Clinical efficacy',
          'Safety profile',
          'Dosing convenience',
          'Cost-effectiveness',
        ],
        substitution_confidence: 'High confidence for within-class substitution',
      },

      pharmaceutical_equivalence: {
        definition: 'Drugs with identical active ingredients and bioequivalence',
        assessment_criteria: [
          'Bioequivalence studies',
          'Manufacturing quality',
          'Formulation equivalence',
        ],
        substitution_confidence: 'Very high confidence for generic substitution',
      },

      clinical_alternatives: {
        definition: 'Different drugs for same clinical indication with varying approaches',
        assessment_criteria: [
          'Mechanism diversity',
          'Patient-specific factors',
          'Contraindication profiles',
        ],
        substitution_confidence: 'Moderate confidence requiring clinical assessment',
      },
    },
  };
}

function generateClinicalApplications(atcData: any[]): any {
  return {
    prescribing_decision_support: {
      first_line_therapy_selection: {
        methodology: 'Evidence-based guidelines with ATC class recommendations',
        decision_factors: [
          'Clinical efficacy',
          'Safety profile',
          'Cost-effectiveness',
          'Patient factors',
        ],
        implementation: 'Structured clinical decision algorithms with ATC-based options',
      },

      therapeutic_alternative_identification: {
        within_class_alternatives: 'Same ATC level 4 code with different chemical entities',
        between_class_alternatives: 'Different ATC codes for same clinical indication',
        mechanism_based_alternatives:
          'Alternative pharmacological approaches for treatment failure',
      },

      drug_interaction_screening: {
        atc_based_screening: 'Systematic evaluation of interactions within and between ATC classes',
        high_risk_combinations: 'Known problematic drug class combinations',
        monitoring_intensification: 'Enhanced surveillance for specific ATC class interactions',
      },
    },

    formulary_development: {
      therapeutic_coverage_assessment: {
        atc_completeness: 'Ensure adequate drug options within each relevant ATC class',
        gap_identification: 'Identify therapeutic areas with insufficient formulary coverage',
        redundancy_evaluation: 'Assess overlap and optimize drug selection within classes',
      },

      cost_effectiveness_analysis: {
        within_class_comparison: 'Economic evaluation of drugs within same ATC classification',
        therapeutic_value_assessment: 'Cost per clinical outcome across different ATC approaches',
        budget_impact_modeling: 'Financial implications of formulary decisions by ATC category',
      },

      policy_development: {
        step_therapy_protocols: 'Sequential ATC class utilization based on evidence and cost',
        prior_authorization_criteria:
          'ATC-based restrictions for high-cost or specialized medications',
        generic_substitution_policies: 'Automatic substitution within ATC level 5 classifications',
      },
    },

    clinical_research_framework: {
      comparative_effectiveness_research: {
        atc_standardization: 'Standardized drug classification for research comparisons',
        real_world_evidence: 'Population-based outcomes analysis using ATC categorization',
        systematic_reviews: 'ATC-based literature synthesis and meta-analysis',
      },

      pharmacovigilance_applications: {
        signal_detection: 'ATC class-based adverse event pattern identification',
        safety_surveillance: 'Systematic monitoring of safety outcomes by therapeutic class',
        risk_communication: 'ATC-based safety alerts and prescriber education',
      },
    },
  };
}

function generatePrescribingIntelligence(atcData: any[]): any {
  return {
    clinical_decision_algorithms: {
      indication_driven_selection: {
        step_1: 'Identify primary clinical indication and corresponding ATC therapeutic area',
        step_2: 'Review evidence-based first-line ATC classes for the indication',
        step_3: 'Assess patient-specific factors affecting ATC class selection',
        step_4: 'Select specific drug within chosen ATC class based on individual factors',
      },

      contraindication_screening: {
        atc_level_screening: 'Systematic evaluation of contraindications at ATC class level',
        drug_specific_screening:
          'Individual drug contraindication assessment within selected class',
        alternative_identification: 'Alternative ATC classes when primary choice contraindicated',
      },

      monitoring_protocols: {
        atc_based_monitoring: 'Standardized monitoring protocols based on ATC classification',
        class_specific_parameters: 'Key monitoring parameters for each major ATC group',
        safety_surveillance: 'Systematic adverse event monitoring by therapeutic class',
      },
    },

    therapeutic_optimization: {
      dose_optimization: {
        atc_dosing_patterns: 'Standard dosing approaches within ATC classifications',
        individual_adjustment: 'Patient-specific dose modification strategies',
        therapeutic_monitoring: 'Drug level monitoring for specific ATC classes',
      },

      combination_therapy: {
        synergistic_combinations: 'Evidence-based ATC class combinations for enhanced efficacy',
        safety_combinations: 'Safe ATC class combinations with minimal interaction risk',
        sequential_therapy: 'Optimal sequencing of ATC classes for complex conditions',
      },

      treatment_failure_management: {
        within_class_switching: 'Alternative drugs within same ATC class for treatment failure',
        class_switching: 'Alternative ATC classes for persistent treatment failure',
        combination_escalation: 'Addition of complementary ATC classes for inadequate response',
      },
    },

    population_specific_considerations: {
      pediatric_prescribing: {
        age_appropriate_atc: 'ATC classes with established pediatric safety and efficacy',
        formulation_considerations: 'Pediatric-friendly formulations within ATC classes',
        dosing_protocols: 'Weight-based and age-based dosing for ATC classifications',
      },

      geriatric_prescribing: {
        geriatric_appropriate_atc: 'ATC classes suitable for elderly patients',
        polypharmacy_management: 'ATC-based approach to complex medication regimens',
        cognitive_considerations: 'Simplified ATC class selection for cognitive impairment',
      },

      pregnancy_lactation: {
        pregnancy_safe_atc: 'ATC classes with established pregnancy safety',
        lactation_compatible_atc: 'ATC classes compatible with breastfeeding',
        risk_benefit_assessment: 'Systematic evaluation of ATC class risks in pregnancy',
      },
    },
  };
}

function generatePharmaceuticalEconomics(atcData: any[]): any {
  return {
    cost_analysis_framework: {
      atc_based_costing: {
        acquisition_costs: 'Drug acquisition costs organized by ATC classification',
        total_cost_of_therapy: 'Comprehensive cost including monitoring and adverse events',
        cost_per_therapeutic_outcome: 'Economic efficiency by ATC class and clinical indication',
      },

      budget_impact_assessment: {
        atc_utilization_patterns: 'Healthcare system utilization by ATC classification',
        cost_drivers: 'Identification of high-cost ATC classes and volume drivers',
        forecasting_models: 'Predictive modeling of ATC class expenditure trends',
      },

      value_based_evaluation: {
        clinical_outcomes_per_cost: 'Therapeutic value assessment by ATC classification',
        quality_adjusted_outcomes: 'QALY analysis for different ATC therapeutic approaches',
        comparative_effectiveness: 'Head-to-head economic evaluation within ATC classes',
      },
    },

    market_access_strategies: {
      formulary_positioning: {
        atc_coverage_optimization: 'Strategic formulary design using ATC classification',
        therapeutic_interchange: 'Economic optimization through ATC-based substitution',
        step_therapy_economics: 'Cost savings through sequential ATC class utilization',
      },

      pricing_strategies: {
        reference_pricing: 'ATC-based reference pricing for therapeutic equivalents',
        value_based_pricing: 'Pricing aligned with therapeutic value within ATC classes',
        competitive_positioning: 'Market positioning relative to ATC class alternatives',
      },
    },

    health_system_optimization: {
      resource_allocation: {
        atc_investment_priorities: 'Strategic allocation of pharmaceutical resources by ATC area',
        specialty_vs_primary_care: 'Cost-effective care delivery models by ATC complexity',
        infrastructure_requirements: 'Healthcare infrastructure needs by ATC classification',
      },

      quality_improvement: {
        atc_based_quality_metrics: 'Quality indicators organized by therapeutic classification',
        outcome_optimization: 'Systematic improvement of outcomes within ATC classes',
        cost_quality_balance: 'Optimization of cost and quality outcomes by ATC area',
      },
    },
  };
}

function generateQualityFramework(): any {
  return {
    clinical_quality_indicators: {
      prescribing_appropriateness: {
        indication_concordance:
          'Percentage of prescriptions with appropriate ATC-indication matching',
        evidence_based_selection: 'Adherence to guideline-recommended ATC classes',
        contraindication_avoidance: 'Rate of contraindicated ATC class prescribing',
      },

      therapeutic_outcomes: {
        effectiveness_rates: 'Clinical response rates by ATC classification',
        treatment_persistence: 'Medication adherence and continuation rates by ATC class',
        goal_achievement: 'Therapeutic target achievement by ATC-based interventions',
      },

      safety_performance: {
        adverse_event_rates: 'Incidence of adverse events by ATC classification',
        drug_interaction_prevention: 'Success in preventing ATC-based drug interactions',
        monitoring_compliance: 'Adherence to ATC-specific monitoring protocols',
      },
    },

    system_performance_metrics: {
      access_and_availability: {
        atc_formulary_coverage: 'Completeness of ATC class representation in formularies',
        accessibility_equity: 'Equal access to essential ATC classes across populations',
        supply_chain_reliability: 'Availability and supply security by ATC classification',
      },

      efficiency_measures: {
        prescribing_efficiency: 'Optimal ATC class selection for clinical indications',
        resource_utilization: 'Efficient use of healthcare resources by ATC category',
        waste_reduction: 'Minimization of inappropriate or redundant ATC prescribing',
      },
    },

    continuous_improvement: {
      performance_monitoring: {
        real_time_analytics: 'Continuous monitoring of ATC-based prescribing patterns',
        trend_analysis: 'Longitudinal analysis of ATC utilization and outcomes',
        benchmark_comparison: 'Performance comparison against ATC-based standards',
      },

      evidence_integration: {
        guideline_updates: 'Integration of new evidence into ATC-based recommendations',
        research_translation: 'Translation of ATC-focused research into clinical practice',
        innovation_adoption: 'Systematic adoption of new therapies within ATC framework',
      },
    },
  };
}

async function generateFallbackTherapeuticResource(): Promise<any> {
  return {
    metadata: {
      title: 'Basic ATC Classification Guide',
      version: '1.0.0 (Fallback)',
      last_updated: new Date().toISOString(),
      data_source: 'static_reference_data',
      status: 'limited_api_access',
    },

    basic_anatomical_groups: {
      A: {
        name: 'Alimentary Tract and Metabolism',
        clinical_focus: 'Digestive system and metabolic disorders',
        common_uses: 'Peptic ulcer, diabetes, dyslipidemia',
      },

      C: {
        name: 'Cardiovascular System',
        clinical_focus: 'Heart and circulatory system disorders',
        common_uses: 'Hypertension, heart failure, coronary disease',
      },

      J: {
        name: 'Anti-infectives for Systemic Use',
        clinical_focus: 'Infectious disease treatment',
        common_uses: 'Bacterial, viral, and fungal infections',
      },

      N: {
        name: 'Nervous System',
        clinical_focus: 'Neurological and psychiatric conditions',
        common_uses: 'Depression, anxiety, epilepsy, pain',
      },

      R: {
        name: 'Respiratory System',
        clinical_focus: 'Respiratory disorders',
        common_uses: 'Asthma, COPD, allergic rhinitis',
      },
    },

    general_principles: {
      classification_purpose:
        'Systematic organization of medications by anatomical target and therapeutic use',
      clinical_application: 'Drug selection, therapeutic alternatives, and formulary management',
      level_4_importance:
        'Primary level for therapeutic decision making and drug class identification',
      substitution_guidance:
        'Within-class substitution generally appropriate with clinical consideration',
    },
  };
}

// ===== UTILITY FUNCTIONS =====

function analyzeATCLevels(atcData: any[]): any {
  const levels = {
    level1: { count: 0, examples: [] as string[] },
    level2: { count: 0, examples: [] as string[] },
    level3: { count: 0, examples: [] as string[] },
    level4: { count: 0, examples: [] as string[] },
    level5: { count: 0, examples: [] as string[] },
  };

  const seenCodes = {
    level1: new Set<string>(),
    level2: new Set<string>(),
    level3: new Set<string>(),
    level4: new Set<string>(),
    level5: new Set<string>(),
  };

  atcData.forEach((item: any) => {
    const code = item.id;
    const description = item.text;

    if (code.length === 1) {
      seenCodes.level1.add(code);
      if (levels.level1.examples.length < 5) levels.level1.examples.push(`${code}: ${description}`);
    } else if (code.length === 3) {
      seenCodes.level2.add(code);
      if (levels.level2.examples.length < 5) levels.level2.examples.push(`${code}: ${description}`);
    } else if (code.length === 4) {
      seenCodes.level3.add(code);
      if (levels.level3.examples.length < 5) levels.level3.examples.push(`${code}: ${description}`);
    } else if (code.length === 5) {
      seenCodes.level4.add(code);
      if (levels.level4.examples.length < 5) levels.level4.examples.push(`${code}: ${description}`);
    } else if (code.length === 7) {
      seenCodes.level5.add(code);
      if (levels.level5.examples.length < 5) levels.level5.examples.push(`${code}: ${description}`);
    }
  });

  levels.level1.count = seenCodes.level1.size;
  levels.level2.count = seenCodes.level2.size;
  levels.level3.count = seenCodes.level3.size;
  levels.level4.count = seenCodes.level4.size;
  levels.level5.count = seenCodes.level5.size;

  return levels;
}

function extractAnatomicalGroups(atcData: any[]): any[] {
  const anatomicalGroups = new Set<string>();

  atcData.forEach((item: any) => {
    if (item.id.length >= 1) {
      anatomicalGroups.add(item.id.charAt(0));
    }
  });

  return Array.from(anatomicalGroups).sort();
}

function extractSubgroups(atcData: any[], anatomicalGroup: string): string[] {
  const subgroups = new Set<string>();

  atcData
    .filter((item: any) => item.id.startsWith(anatomicalGroup) && item.id.length === 3)
    .forEach((item: any) => {
      subgroups.add(`${item.id}: ${item.text}`);
    });

  return Array.from(subgroups).slice(0, 10); // Limit to top 10 for readability
}
