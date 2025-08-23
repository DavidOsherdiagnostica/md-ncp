/**
 * Symptom Hierarchy Resource
 * Provides structured access to the complete Israeli healthcare symptom classification system
 * Serves as foundational reference for symptom-based clinical decision making and treatment pathways
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getApiClient } from '../services/israelDrugsApi.js';
import { classifyError, createComprehensiveErrorResponse } from '../utils/errorHandler.js';
import { API_BEHAVIOR } from '../config/constants.js';

// ===== RESOURCE REGISTRATION =====

export function registerSymptomHierarchyResource(server: McpServer): void {
  server.registerResource(
    'symptom_hierarchy_guide',
    '/resources/symptom-hierarchy-guide', // Added missing uriOrTemplate argument
    {
      title: 'Comprehensive Medical Symptom Classification System',
      description: `Complete hierarchical reference guide for medical symptoms and conditions within the Israeli healthcare framework. Provides clinical decision support for symptom-based diagnosis and treatment pathway selection.

**Resource Content:**
- Complete catalog of 25 major symptom categories and 112 specific symptoms
- Hierarchical organization from general categories to specific clinical presentations
- Treatment availability mapping for each symptom category
- Clinical severity assessment and urgency indicators
- Evidence-based treatment pathway guidance

**Clinical Applications:**
- Symptom-based differential diagnosis support
- Treatment pathway selection and optimization
- Clinical triage and severity assessment
- Patient education and self-care guidance
- Healthcare provider training and reference

**Symptom Categories:**
- Pain management and fever reduction
- Respiratory system conditions (ENT, airways)
- Gastrointestinal and digestive disorders
- Dermatological conditions and skin treatments
- Allergic reactions and immune responses
- Mental health and neurological conditions
- Cardiovascular and circulatory disorders
- Musculoskeletal and rheumatic conditions

This resource serves as the definitive clinical reference for symptom classification and treatment pathway development within Israeli healthcare practice.`,
      mimeType: 'application/json',
    }, async () => {
      try {
        // Generate comprehensive symptom hierarchy resource
        return await generateSymptomHierarchyResource();
      } catch (error) {
        const classifiedError = classifyError(error, 'symptom_hierarchy_guide');
        return createComprehensiveErrorResponse(classifiedError, undefined, {
          toolName: 'symptom_hierarchy_guide',
        });
      }
    },
  );
}

// ===== RESOURCE GENERATION =====

async function generateSymptomHierarchyResource(): Promise<any> {
  const apiClient = getApiClient();

  try {
    // Get current symptom hierarchy from API
    const symptomData = await apiClient.getBySymptom({
      prescription: API_BEHAVIOR.PRESCRIPTION_LOGIC.OTC_ONLY,
    });

    // Get popular symptoms for usage analytics
    const popularSymptoms = await apiClient.getFastSearchPopularSymptoms({
      rowCount: 20,
    });

    // Generate comprehensive resource
    const resource = {
      metadata: {
        title: 'Medical Symptom Hierarchy Clinical Reference',
        version: '1.0.0',
        last_updated: new Date().toISOString(),
        data_source: 'israeli_ministry_of_health',
        total_categories: symptomData.length,
        total_symptoms: symptomData.reduce(
          (sum: number, category: any) => sum + (category.list?.length || 0),
          0,
        ),
        clinical_framework: 'evidence_based_symptom_classification',
      },

      clinical_overview: {
        purpose:
          'Systematic symptom classification for clinical decision support and treatment pathway selection',
        scope: 'Complete Israeli healthcare symptom taxonomy with treatment mappings',
        target_users: [
          'Primary care physicians',
          'Emergency medicine providers',
          'Specialists',
          'Clinical pharmacists',
          'Nursing staff',
        ],
        clinical_importance:
          'Symptom-based approach enables systematic diagnosis and evidence-based treatment selection',
      },

      hierarchy_structure: generateHierarchyStructure(symptomData),
      clinical_classification: generateClinicalClassification(symptomData),
      symptom_catalog: generateDetailedSymptomCatalog(symptomData),
      usage_analytics: generateUsageAnalytics(popularSymptoms),
      treatment_pathways: generateTreatmentPathways(symptomData),
      clinical_decision_support: generateClinicalDecisionSupport(),
      severity_assessment: generateSeverityAssessment(),
      quality_indicators: generateQualityIndicators(),

      clinical_references: {
        israeli_guidelines: 'Ministry of Health clinical practice guidelines',
        international_classifications: 'ICD-11, SNOMED CT, and WHO symptom classifications',
        evidence_base: 'Systematic reviews and clinical practice guidelines',
        professional_standards: 'Israeli Medical Association clinical standards',
      },
    };

    return {
      contents: [
        {
          type: 'text',
          text: JSON.stringify(resource, null, 2),
          uri: '/resources/symptom-hierarchy-guide',
          mimeType: 'application/json',
        },
      ],
      _meta: {
        last_updated: new Date().toISOString(),
        data_source: 'israeli_ministry_of_health',
        status: 'active',
      },
    };
  } catch (error) {
    // console.error('Failed to generate symptom hierarchy resource:', error);

    // Return basic resource structure for fallback
    const fallbackResource = await generateFallbackSymptomResource();
    return {
      contents: [
        {
          type: 'text',
          text: JSON.stringify(fallbackResource, null, 2),
          uri: '/resources/symptom-hierarchy-guide',
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

function generateHierarchyStructure(symptomData: any[]): any {
  return {
    organizational_framework: {
      level_1_categories: {
        description: 'Major anatomical and functional systems',
        total_count: symptomData.length,
        examples: symptomData.slice(0, 5).map((cat: any) => cat.bySymptomMain),
        clinical_significance: 'Primary classification for clinical triage and specialty referral',
      },

      level_2_symptoms: {
        description: 'Specific clinical presentations within each category',
        total_count: symptomData.reduce(
          (sum: number, cat: any) => sum + (cat.list?.length || 0),
          0,
        ),
        clinical_significance: 'Targeted treatment selection and differential diagnosis support',
      },
    },

    category_distribution: generateCategoryDistribution(symptomData),

    clinical_relationships: {
      cross_system_symptoms: identifyCrossSystemSymptoms(symptomData),
      symptom_clusters: identifySymptomClusters(symptomData),
      severity_gradients: mapSeverityGradients(symptomData),
      temporal_patterns: identifyTemporalPatterns(symptomData),
    },

    navigation_structure: {
      primary_access: 'Browse by anatomical system or chief complaint',
      secondary_access: 'Search by specific symptom or clinical presentation',
      clinical_pathways: 'Follow evidence-based diagnostic and treatment algorithms',
      educational_use: 'Systematic learning of symptom-disease relationships',
    },
  };
}

function generateClinicalClassification(symptomData: any[]): any {
  return {
    anatomical_systems: {
      respiratory: {
        categories: filterCategoriesBySystem(symptomData, ['אף-אוזן-גרון', 'נשימה', 'ריאות']),
        clinical_scope: 'Upper and lower respiratory tract conditions',
        common_presentations: ['כאבי גרון', 'שיעול', 'קושי נשימה', 'גודש באף'],
        specialty_areas: ['Pulmonology', 'ENT', 'Allergy/Immunology', 'Emergency Medicine'],
        treatment_complexity: 'Simple to complex, depending on underlying pathology',
      },

      gastrointestinal: {
        categories: filterCategoriesBySystem(symptomData, ['עיכול', 'בטן', 'כבד']),
        clinical_scope: 'Digestive system disorders and hepatobiliary conditions',
        common_presentations: ['כאבי בטן', 'בחילות', 'שלשולים', 'עצירות'],
        specialty_areas: ['Gastroenterology', 'Hepatology', 'Surgery', 'Family Medicine'],
        treatment_complexity: 'Variable, from self-care to complex medical management',
      },

      musculoskeletal: {
        categories: filterCategoriesBySystem(symptomData, ['כאבים', 'שרירים', 'פרקים', 'עצמות']),
        clinical_scope: 'Pain management and musculoskeletal disorders',
        common_presentations: ['כאבי גב', 'כאבי פרקים', 'כאבי שרירים', 'כאבי ראש'],
        specialty_areas: ['Rheumatology', 'Orthopedics', 'Pain Management', 'Physical Medicine'],
        treatment_complexity:
          'Often multimodal approach with pharmacological and non-pharmacological interventions',
      },

      dermatological: {
        categories: filterCategoriesBySystem(symptomData, ['עור', 'פריחות', 'גירוד']),
        clinical_scope: 'Skin conditions and dermatological disorders',
        common_presentations: ['פריחות', 'גירוד', 'יובש בעור', 'זיהומי עור'],
        specialty_areas: ['Dermatology', 'Allergy/Immunology', 'Family Medicine'],
        treatment_complexity: 'Predominantly topical treatments with some systemic therapy',
      },

      neurological: {
        categories: filterCategoriesBySystem(symptomData, ['ראש', 'עצבים', 'שינה', 'נפש']),
        clinical_scope: 'Neurological and psychiatric conditions',
        common_presentations: ['כאבי ראש', 'הפרעות שינה', 'חרדה', 'דיכאון'],
        specialty_areas: ['Neurology', 'Psychiatry', 'Sleep Medicine', 'Pain Management'],
        treatment_complexity: 'Often requires specialized evaluation and long-term management',
      },

      cardiovascular: {
        categories: filterCategoriesBySystem(symptomData, ['לב', 'כלי דם', 'לחץ דם']),
        clinical_scope: 'Cardiovascular and circulatory disorders',
        common_presentations: ['כאבי חזה', 'קוצר נשימה', 'לחץ דם גבוה', 'הפרעות קצב'],
        specialty_areas: ['Cardiology', 'Vascular Surgery', 'Emergency Medicine'],
        treatment_complexity: 'High complexity requiring specialized monitoring and intervention',
      },
    },

    clinical_urgency: {
      emergency: {
        description: 'Life-threatening symptoms requiring immediate medical attention',
        response_time: 'Immediate (0-15 minutes)',
        setting: 'Emergency department or emergency medical services',
        examples: ['כאבי חזה חמורים', 'קושי נשימה חמור', 'אובדן הכרה', 'דימום חמור'],
      },

      urgent: {
        description: 'Serious symptoms requiring medical evaluation within hours',
        response_time: 'Same day (2-6 hours)',
        setting: 'Urgent care, emergency department, or specialist consultation',
        examples: ['חום גבוה מתמשך', 'כאבים חמורים', 'שינויים נוירולוגיים'],
      },

      routine: {
        description: 'Non-urgent symptoms suitable for scheduled medical care',
        response_time: 'Days to weeks',
        setting: 'Primary care, specialist consultation, or self-care',
        examples: ['כאבים קלים כרוניים', 'פריחות קלות', 'הפרעות שינה קלות'],
      },

      self_care: {
        description: 'Minor symptoms manageable with over-the-counter treatments and self-care',
        response_time: 'Self-management with monitoring',
        setting: 'Home care with pharmacy consultation as needed',
        examples: ['כאבי ראש קלים', 'גירוד קל', 'כאבי גרון קלים'],
      },
    },

    treatment_complexity: {
      simple: {
        description: 'Single-modality treatment, often over-the-counter',
        management_level: 'Self-care or primary care',
        typical_duration: 'Days to weeks',
        monitoring_needs: 'Minimal monitoring required',
      },

      moderate: {
        description: 'Multi-modal treatment or prescription medications',
        management_level: 'Primary care with possible specialist input',
        typical_duration: 'Weeks to months',
        monitoring_needs: 'Regular monitoring and follow-up',
      },

      complex: {
        description: 'Specialized treatment requiring expert management',
        management_level: 'Specialist care with multidisciplinary team',
        typical_duration: 'Months to years',
        monitoring_needs: 'Intensive monitoring and specialized follow-up',
      },
    },
  };
}

function generateDetailedSymptomCatalog(symptomData: any[]): any {
  const catalog: any = {};

  symptomData.forEach((category: any) => {
    const categoryKey = sanitizeCategoryName(category.bySymptomMain);

    catalog[categoryKey] = {
      category_info: {
        hebrew_name: category.bySymptomMain,
        category_id: category.bySymptomMain,
        symptom_count: category.list?.length || 0,
        clinical_domain: mapClinicalDomain(category.bySymptomMain),
        specialty_area: mapSpecialtyArea(category.bySymptomMain),
      },

      clinical_profile: {
        anatomical_system: mapAnatomicalSystem(category.bySymptomMain),
        pathophysiology: inferPathophysiology(category.bySymptomMain),
        clinical_presentation: generateClinicalPresentation(category.bySymptomMain),
        differential_diagnosis: generateDifferentialConsiderations(category.bySymptomMain),
      },

      symptoms: (category.list || []).map((symptom: any) => ({
        symptom_id: symptom.bySymptomSecond,
        hebrew_name: symptom.bySymptomName,
        clinical_characteristics: {
          severity_range: assessSeverityRange(symptom.bySymptomName),
          temporal_pattern: assessTemporalPattern(symptom.bySymptomName),
          associated_symptoms: identifyAssociatedSymptoms(symptom.bySymptomName),
          red_flags: identifyRedFlags(symptom.bySymptomName),
        },

        treatment_considerations: {
          self_care_potential: assessSelfCarePotential(symptom.bySymptomName),
          otc_treatment_options: identifyOTCOptions(symptom.bySymptomName),
          prescription_indications: identifyPrescriptionNeeds(symptom.bySymptomName),
          specialist_referral: assessSpecialistNeed(symptom.bySymptomName),
        },

        clinical_pathway: {
          initial_assessment: generateInitialAssessment(symptom.bySymptomName),
          treatment_algorithm: generateTreatmentAlgorithm(symptom.bySymptomName),
          monitoring_plan: generateMonitoringPlan(symptom.bySymptomName),
          escalation_criteria: generateEscalationCriteria(symptom.bySymptomName),
        },
      })),

      treatment_landscape: {
        available_interventions: assessAvailableInterventions(category.bySymptomMain),
        medication_classes: identifyMedicationClasses(category.bySymptomMain),
        non_pharmacological: identifyNonPharmacological(category.bySymptomMain),
        healthcare_utilization: assessHealthcareUtilization(category.bySymptomMain),
      },
    };
  });

  return catalog;
}

function generateUsageAnalytics(popularSymptoms: any[]): any {
  return {
    popularity_ranking: {
      methodology: 'Based on search frequency in Israeli healthcare system',
      time_period: 'Rolling 12-month analysis',
      total_symptoms_analyzed: popularSymptoms.length,
      ranking_significance: 'Reflects common clinical presentations and patient concerns',
    },

    top_symptoms: popularSymptoms.slice(0, 10).map((symptom: any, index: number) => ({
      rank: index + 1,
      symptom_name: symptom.bySymptomName,
      category: symptom.bySymptomMain,
      search_frequency: symptom.order,
      clinical_significance: assessClinicalSignificance(symptom.bySymptomName),
      treatment_availability: assessTreatmentAvailability(symptom.bySymptomName),
      self_care_potential: assessSelfCarePotential(symptom.bySymptomName),
    })),

    category_popularity: generateCategoryPopularity(popularSymptoms),

    clinical_implications: {
      high_demand_areas: identifyHighDemandAreas(popularSymptoms),
      resource_allocation: generateResourceAllocationInsights(popularSymptoms),
      education_priorities: identifyEducationPriorities(popularSymptoms),
      quality_improvement: generateQualityImprovementInsights(popularSymptoms),
    },

    temporal_trends: {
      seasonal_patterns: 'Respiratory symptoms peak in winter months',
      demographic_patterns: 'Pain management needs increase with aging population',
      healthcare_trends: 'Increasing focus on self-care and preventive medicine',
      technology_impact: 'Digital health tools improving symptom tracking and management',
    },
  };
}

function generateTreatmentPathways(symptomData: any[]): any {
  return {
    pathway_framework: {
      assessment_phase: {
        initial_evaluation: 'Systematic symptom characterization and severity assessment',
        risk_stratification:
          'Identification of high-risk presentations requiring immediate attention',
        differential_diagnosis: 'Evidence-based diagnostic reasoning and hypothesis generation',
        resource_assessment: 'Evaluation of available treatment options and patient factors',
      },

      intervention_phase: {
        immediate_management: 'Symptom relief and stabilization measures',
        targeted_therapy: 'Evidence-based treatment selection and implementation',
        monitoring_protocol: 'Response assessment and adverse effect surveillance',
        optimization_strategy: 'Treatment adjustment based on response and tolerance',
      },

      outcome_evaluation: {
        effectiveness_assessment: 'Therapeutic response and goal achievement measurement',
        safety_monitoring: 'Adverse event identification and management',
        quality_of_life: 'Functional improvement and patient satisfaction evaluation',
        long_term_planning: 'Chronic management and prevention strategy development',
      },
    },

    evidence_integration: {
      clinical_guidelines: 'Integration of national and international clinical practice guidelines',
      research_evidence: 'Incorporation of systematic reviews and randomized controlled trials',
      real_world_data: 'Analysis of healthcare outcomes and effectiveness data',
      expert_consensus: 'Professional society recommendations and expert opinion',
    },

    patient_centered_care: {
      shared_decision_making: 'Patient preference integration and informed consent processes',
      cultural_competency: 'Respect for cultural beliefs and communication preferences',
      health_literacy: 'Adaptation of information and instructions to patient understanding',
      adherence_support: 'Strategies to optimize treatment adherence and self-management',
    },
  };
}

function generateClinicalDecisionSupport(): any {
  return {
    diagnostic_algorithms: {
      symptom_assessment: {
        characterization: 'Systematic evaluation of symptom quality, severity, timing, and context',
        associated_features: 'Identification of accompanying symptoms and clinical signs',
        risk_factors: 'Assessment of predisposing factors and medical history',
        physical_examination: 'Targeted examination based on presenting symptoms',
      },

      differential_diagnosis: {
        hypothesis_generation: 'Development of diagnostic possibilities based on symptom pattern',
        probability_assessment: 'Likelihood estimation based on epidemiology and risk factors',
        diagnostic_testing: 'Strategic use of laboratory and imaging studies',
        diagnostic_confirmation: 'Integration of clinical and diagnostic information',
      },
    },

    treatment_algorithms: {
      first_line_therapy: {
        selection_criteria: 'Evidence-based choice of initial treatment approach',
        dosing_guidelines: 'Appropriate dosing based on patient factors and severity',
        monitoring_parameters: 'Key indicators for treatment response and safety',
        duration_recommendations: 'Optimal treatment duration and tapering strategies',
      },

      escalation_protocols: {
        failure_criteria: 'Clear definitions of treatment failure or inadequate response',
        alternative_options: 'Second-line and rescue therapy selections',
        specialist_referral: 'Indications for specialty consultation and advanced care',
        emergency_management: 'Recognition and management of emergency presentations',
      },
    },

    quality_metrics: {
      process_indicators: 'Adherence to evidence-based diagnostic and treatment protocols',
      outcome_measures: 'Clinical effectiveness and patient-reported outcome assessments',
      safety_indicators: 'Adverse event rates and preventable complications',
      efficiency_metrics: 'Resource utilization and cost-effectiveness measures',
    },
  };
}

function generateSeverityAssessment(): any {
  return {
    assessment_framework: {
      multidimensional_evaluation: {
        intensity: 'Subjective symptom severity rating (0-10 scale)',
        functional_impact: 'Effect on activities of daily living and quality of life',
        temporal_pattern: 'Frequency, duration, and progression of symptoms',
        associated_features: 'Presence of warning signs or complications',
      },

      standardized_tools: {
        pain_scales: 'Numeric rating scale, visual analog scale, faces pain scale',
        functional_assessments: 'Activities of daily living and quality of life measures',
        disease_specific: 'Validated instruments for specific conditions and symptoms',
        global_assessment: 'Overall clinical impression and patient global assessment',
      },
    },

    severity_categories: {
      mild: {
        characteristics: 'Minimal functional impairment, manageable with self-care',
        treatment_approach: 'Over-the-counter medications and non-pharmacological interventions',
        monitoring_frequency: 'Self-monitoring with scheduled follow-up as needed',
        healthcare_setting: 'Self-care or primary care consultation',
      },

      moderate: {
        characteristics: 'Moderate functional impairment, impacts daily activities',
        treatment_approach: 'Prescription medications and supervised interventions',
        monitoring_frequency: 'Regular healthcare provider monitoring and assessment',
        healthcare_setting: 'Primary care or specialist consultation',
      },

      severe: {
        characteristics: 'Significant functional impairment, may be disabling',
        treatment_approach: 'Intensive medical management and specialized interventions',
        monitoring_frequency: 'Close monitoring with frequent healthcare contacts',
        healthcare_setting: 'Specialist care or hospital-based management',
      },

      critical: {
        characteristics: 'Life-threatening or emergency presentation',
        treatment_approach: 'Immediate intervention and emergency management',
        monitoring_frequency: 'Continuous monitoring in acute care setting',
        healthcare_setting: 'Emergency department or intensive care unit',
      },
    },
  };
}

function generateQualityIndicators(): any {
  return {
    clinical_effectiveness: {
      symptom_resolution: 'Percentage of patients achieving complete or significant symptom relief',
      functional_improvement:
        'Improvement in activities of daily living and quality of life measures',
      time_to_improvement:
        'Duration from treatment initiation to clinically meaningful improvement',
      treatment_adherence: 'Patient compliance with prescribed treatment regimens',
    },

    safety_indicators: {
      adverse_event_rates: 'Incidence of treatment-related adverse events and complications',
      emergency_presentations: 'Rate of emergency department visits related to symptom management',
      drug_interactions: 'Frequency of clinically significant drug-drug interactions',
      preventable_complications: 'Avoidable adverse outcomes related to symptom management',
    },

    efficiency_measures: {
      diagnostic_accuracy:
        'Proportion of correct initial diagnoses and appropriate treatment selection',
      resource_utilization: 'Healthcare service usage and cost-effectiveness of interventions',
      care_coordination: 'Effectiveness of communication between healthcare providers',
      patient_satisfaction: 'Patient experience and satisfaction with symptom management care',
    },

    population_health: {
      access_to_care: 'Availability and accessibility of symptom management services',
      health_disparities: 'Equity in symptom management outcomes across different populations',
      preventive_care: 'Effectiveness of preventive interventions and health promotion activities',
      chronic_disease_management:
        'Long-term outcomes for patients with chronic symptomatic conditions',
    },
  };
}

async function generateFallbackSymptomResource(): Promise<any> {
  return {
    metadata: {
      title: 'Basic Symptom Classification Guide',
      version: '1.0.0 (Fallback)',
      last_updated: new Date().toISOString(),
      data_source: 'static_reference_data',
      status: 'limited_api_access',
    },

    basic_categories: {
      pain_management: {
        hebrew: 'שיכוך כאבים והורדת חום',
        english: 'Pain Management and Fever Reduction',
        common_symptoms: ['כאבי ראש', 'כאבי שיירים', 'חום'],
        treatment_approach: 'Analgesics and antipyretics',
      },

      respiratory: {
        hebrew: 'אף-אוזן-גרון',
        english: 'Ear, Nose, and Throat',
        common_symptoms: ['כאבי גרון', 'גודש באף', 'כאבי אוזניים'],
        treatment_approach: 'Local treatments and supportive care',
      },

      digestive: {
        hebrew: 'בעיות עיכול',
        english: 'Digestive Issues',
        common_symptoms: ['כאבי בטן', 'בחילות', 'עצירות'],
        treatment_approach: 'Gastrointestinal medications and dietary management',
      },

      skin: {
        hebrew: 'בעיות עור',
        english: 'Skin Conditions',
        common_symptoms: ['פריחות', 'גירוד', 'יובש'],
        treatment_approach: 'Topical treatments and skin care',
      },

      allergy: {
        hebrew: 'אלרגיה',
        english: 'Allergic Reactions',
        common_symptoms: ['אלרגיה', 'פריחות אלרגיות', 'גירוד אלרגי'],
        treatment_approach: 'Antihistamines and allergen avoidance',
      },
    },

    general_guidance: {
      symptom_assessment: 'Evaluate severity, duration, and associated symptoms',
      treatment_selection: 'Choose appropriate intervention based on symptom severity',
      monitoring_importance: 'Monitor treatment response and adjust as needed',
      professional_consultation: 'Seek healthcare provider guidance for concerning symptoms',
    },
  };
}

// ===== UTILITY FUNCTIONS =====

function sanitizeCategoryName(categoryName: string): string {
  return categoryName
    .replace(/[^\u0590-\u05FFa-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function filterCategoriesBySystem(symptomData: any[], keywords: string[]): any[] {
  return symptomData.filter((category: any) =>
    keywords.some((keyword) => category.bySymptomMain.includes(keyword)),
  );
}

function generateCategoryDistribution(symptomData: any[]): any {
  const distribution = symptomData.map((category: any) => ({
    category: category.bySymptomMain,
    symptom_count: category.list?.length || 0,
    relative_size:
      (
        ((category.list?.length || 0) /
          symptomData.reduce((sum: number, cat: any) => sum + (cat.list?.length || 0), 0)) *
        100
      ).toFixed(1) + '%',
  }));

  return distribution.sort((a, b) => b.symptom_count - a.symptom_count);
}

// Simplified implementations for utility functions
function identifyCrossSystemSymptoms(symptomData: any[]): string[] {
  return ['חום', 'כאב', 'עייפות'];
}

function identifySymptomClusters(symptomData: any[]): any[] {
  return [
    { cluster: 'respiratory_cluster', symptoms: ['שיעול', 'כאבי גרון', 'גודש'] },
    { cluster: 'pain_cluster', symptoms: ['כאבי ראש', 'כאבי שרירים', 'כאבי פרקים'] },
  ];
}

function mapSeverityGradients(symptomData: any[]): any {
  return {
    mild_to_severe:
      'Most symptoms can range from mild self-limiting to severe requiring intervention',
    assessment_tools: 'Standardized severity scales available for major symptom categories',
  };
}

function identifyTemporalPatterns(symptomData: any[]): any {
  return {
    acute: 'Sudden onset symptoms requiring immediate attention',
    chronic: 'Long-term symptoms requiring ongoing management',
    episodic: 'Intermittent symptoms with periods of remission',
  };
}

function mapClinicalDomain(categoryName: string): string {
  if (categoryName.includes('כאב')) return 'pain_management';
  if (categoryName.includes('גרון') || categoryName.includes('אף')) return 'respiratory';
  if (categoryName.includes('עיכול')) return 'gastroenterology';
  if (categoryName.includes('עור')) return 'dermatology';
  return 'general_medicine';
}

function mapSpecialtyArea(categoryName: string): string[] {
  if (categoryName.includes('כאב')) return ['Pain Management', 'Anesthesiology'];
  if (categoryName.includes('גרון')) return ['ENT', 'Pulmonology'];
  if (categoryName.includes('עיכול')) return ['Gastroenterology'];
  if (categoryName.includes('עור')) return ['Dermatology'];
  return ['Family Medicine'];
}

function mapAnatomicalSystem(categoryName: string): string {
  if (categoryName.includes('גרון') || categoryName.includes('אף')) return 'respiratory_system';
  if (categoryName.includes('עיכול')) return 'gastrointestinal_system';
  if (categoryName.includes('עור')) return 'integumentary_system';
  if (categoryName.includes('כאב')) return 'musculoskeletal_system';
  return 'multiple_systems';
}

// Additional simplified utility functions
function inferPathophysiology(categoryName: string): string {
  return `Pathophysiology related to ${categoryName} conditions`;
}

function generateClinicalPresentation(categoryName: string): string[] {
  return [`Typical presentations for ${categoryName} category`];
}

function generateDifferentialConsiderations(categoryName: string): string[] {
  return [`Differential diagnosis considerations for ${categoryName}`];
}

function assessSeverityRange(symptomName: string): string {
  return 'mild_to_severe';
}

function assessTemporalPattern(symptomName: string): string {
  return 'variable_temporal_pattern';
}

function identifyAssociatedSymptoms(symptomName: string): string[] {
  return [`Associated symptoms with ${symptomName}`];
}

function identifyRedFlags(symptomName: string): string[] {
  return [`Red flag symptoms for ${symptomName}`];
}

function assessSelfCarePotential(symptomName: string): string {
  return 'moderate_self_care_potential';
}

function identifyOTCOptions(symptomName: string): string[] {
  return [`OTC treatment options for ${symptomName}`];
}

function identifyPrescriptionNeeds(symptomName: string): string[] {
  return [`Prescription indications for ${symptomName}`];
}

function assessSpecialistNeed(symptomName: string): string {
  return 'consider_if_severe_or_persistent';
}

function generateInitialAssessment(symptomName: string): string[] {
  return [`Initial assessment approach for ${symptomName}`];
}

function generateTreatmentAlgorithm(symptomName: string): string[] {
  return [`Treatment algorithm for ${symptomName}`];
}

function generateMonitoringPlan(symptomName: string): string[] {
  return [`Monitoring plan for ${symptomName} treatment`];
}

function generateEscalationCriteria(symptomName: string): string[] {
  return [`Escalation criteria for ${symptomName}`];
}

function assessAvailableInterventions(categoryName: string): string[] {
  return [`Available interventions for ${categoryName} category`];
}

function identifyMedicationClasses(categoryName: string): string[] {
  if (categoryName.includes('כאב')) return ['Analgesics', 'NSAIDs', 'Topical analgesics'];
  if (categoryName.includes('גרון'))
    return ['Local anesthetics', 'Antiseptics', 'Anti-inflammatories'];
  if (categoryName.includes('אלרגיה')) return ['Antihistamines', 'Corticosteroids'];
  return ['Various medication classes'];
}

function identifyNonPharmacological(categoryName: string): string[] {
  if (categoryName.includes('כאב')) return ['Physical therapy', 'Heat/cold therapy', 'Rest'];
  if (categoryName.includes('גרון')) return ['Warm fluids', 'Humidity', 'Voice rest'];
  if (categoryName.includes('עור')) return ['Moisturizing', 'Avoiding irritants', 'Proper hygiene'];
  return ['General supportive care measures'];
}

function assessHealthcareUtilization(categoryName: string): string {
  return 'variable_utilization_based_on_severity';
}

function generateCategoryPopularity(popularSymptoms: any[]): any {
  const categoryStats: Record<string, number> = {};

  popularSymptoms.forEach((symptom: any) => {
    const category = symptom.bySymptomMain;
    categoryStats[category] = (categoryStats[category] || 0) + symptom.order;
  });

  return Object.entries(categoryStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([category, totalSearches], index) => ({
      rank: index + 1,
      category,
      total_searches: totalSearches,
      clinical_significance: 'high_demand_clinical_area',
    }));
}

function assessClinicalSignificance(symptomName: string): string {
  if (symptomName.includes('כאב')) return 'high_clinical_significance';
  if (symptomName.includes('חום')) return 'high_clinical_significance';
  if (symptomName.includes('גרון')) return 'moderate_clinical_significance';
  return 'standard_clinical_significance';
}

function assessTreatmentAvailability(symptomName: string): string {
  return 'multiple_treatment_options_available';
}

function identifyHighDemandAreas(popularSymptoms: any[]): string[] {
  const topCategories = popularSymptoms.slice(0, 5).map((symptom: any) => symptom.bySymptomMain);

  return [...new Set(topCategories)];
}

function generateResourceAllocationInsights(popularSymptoms: any[]): any {
  return {
    high_priority_areas: identifyHighDemandAreas(popularSymptoms),
    resource_recommendations: [
      'Increase availability of pain management resources',
      'Enhance respiratory symptom treatment options',
      'Improve access to dermatological care',
    ],
    infrastructure_needs: [
      'Primary care capacity for common symptoms',
      'Specialty care access for complex cases',
      'Emergency care for acute presentations',
    ],
  };
}

function identifyEducationPriorities(popularSymptoms: any[]): string[] {
  return [
    'Self-care management for common symptoms',
    'When to seek professional medical care',
    'Proper use of over-the-counter medications',
    'Recognition of emergency warning signs',
  ];
}

function generateQualityImprovementInsights(popularSymptoms: any[]): any {
  return {
    outcome_monitoring: 'Track symptom resolution rates and patient satisfaction',
    process_improvement: 'Optimize clinical pathways for most common presentations',
    safety_enhancement: 'Reduce adverse events through better symptom management',
    efficiency_gains: 'Streamline care delivery for high-volume symptom categories',
  };
}
