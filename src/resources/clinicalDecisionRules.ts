/**
 * Clinical Decision Support Rules Resource
 * Evidence-based clinical decision support rules and alerts
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ResourceMetadata } from "../types/mcp.js";

// Schema for clinical decision support rules
const ClinicalRuleSchema = z.object({
  rule_id: z.string().describe("Unique identifier for the rule"),
  rule_name: z.string().describe("Name of the clinical rule"),
  category: z.string().describe("Rule category (Safety, Quality, Protocol)"),
  severity: z.string().describe("Severity level (Critical, High, Medium, Low)"),
  trigger_condition: z.string().describe("Condition that triggers the rule"),
  clinical_action: z.string().describe("Recommended clinical action"),
  evidence_level: z.string().describe("Level of evidence (A, B, C, D)"),
  applicable_population: z.string().describe("Patient population this applies to"),
  contraindications: z.string().optional().describe("Contraindications or exceptions"),
  monitoring_requirements: z.string().optional().describe("Required monitoring"),
  documentation_requirements: z.string().optional().describe("Documentation requirements"),
  references: z.string().optional().describe("Evidence-based references")
});

const ClinicalRulesSchema = z.array(ClinicalRuleSchema);

// Comprehensive clinical decision support rules
const CLINICAL_RULES_DATA = [
  // Safety Rules
  {
    rule_id: "SAFETY_001",
    rule_name: "Acute Kidney Injury Detection",
    category: "Safety",
    severity: "Critical",
    trigger_condition: "Creatinine increase >0.3 mg/dL or >50% from baseline within 48 hours",
    clinical_action: "Immediate nephrology consult, stop nephrotoxic medications, optimize hydration",
    evidence_level: "A",
    applicable_population: "All patients",
    contraindications: "None",
    monitoring_requirements: "Daily creatinine, urine output, fluid balance",
    documentation_requirements: "Document baseline creatinine, trend, and interventions",
    references: "KDIGO 2012 Clinical Practice Guidelines"
  },
  {
    rule_id: "SAFETY_002",
    rule_name: "Hypoglycemia Alert",
    category: "Safety",
    severity: "Critical",
    trigger_condition: "Blood glucose <70 mg/dL or <4.0 mmol/L",
    clinical_action: "Immediate treatment with 15g fast-acting carbohydrate, recheck in 15 minutes",
    evidence_level: "A",
    applicable_population: "Diabetic patients",
    contraindications: "None",
    monitoring_requirements: "Frequent glucose monitoring until stable",
    documentation_requirements: "Document glucose level, treatment given, response",
    references: "ADA 2023 Standards of Care"
  },
  {
    rule_id: "SAFETY_003",
    rule_name: "Severe Hypertension Alert",
    category: "Safety",
    severity: "Critical",
    trigger_condition: "Systolic BP >180 mmHg or Diastolic BP >110 mmHg",
    clinical_action: "Immediate evaluation for hypertensive crisis, consider IV antihypertensive if symptomatic",
    evidence_level: "A",
    applicable_population: "All patients",
    contraindications: "None",
    monitoring_requirements: "Continuous BP monitoring, neurological assessment",
    documentation_requirements: "Document BP readings, symptoms, interventions",
    references: "AHA 2017 Hypertension Guidelines"
  },
  {
    rule_id: "SAFETY_004",
    rule_name: "Sepsis Screening",
    category: "Safety",
    severity: "Critical",
    trigger_condition: "SIRS criteria: Temp >38°C or <36°C, HR >90, RR >20, WBC >12K or <4K",
    clinical_action: "Immediate sepsis protocol: blood cultures, lactate, antibiotics within 1 hour",
    evidence_level: "A",
    applicable_population: "All patients with suspected infection",
    contraindications: "None",
    monitoring_requirements: "Lactate, vital signs, organ function",
    documentation_requirements: "Document SIRS criteria, time to antibiotics, response",
    references: "Surviving Sepsis Campaign 2021"
  },

  // Quality Rules
  {
    rule_id: "QUALITY_001",
    rule_name: "VTE Prophylaxis",
    category: "Quality",
    severity: "High",
    trigger_condition: "Hospitalized patient without contraindications to anticoagulation",
    clinical_action: "Initiate VTE prophylaxis (heparin, enoxaparin, or mechanical)",
    evidence_level: "A",
    applicable_population: "Hospitalized patients",
    contraindications: "Active bleeding, severe thrombocytopenia, recent major surgery",
    monitoring_requirements: "Platelet count, bleeding assessment",
    documentation_requirements: "Document VTE risk assessment and prophylaxis choice",
    references: "ACCP 2012 VTE Prevention Guidelines"
  },
  {
    rule_id: "QUALITY_002",
    rule_name: "Statin Therapy for ASCVD",
    category: "Quality",
    severity: "High",
    trigger_condition: "Patient with ASCVD or high ASCVD risk (10-year risk >7.5%)",
    clinical_action: "Initiate high-intensity statin therapy unless contraindicated",
    evidence_level: "A",
    applicable_population: "Adults with ASCVD or high risk",
    contraindications: "Active liver disease, pregnancy, statin intolerance",
    monitoring_requirements: "LFTs at baseline and 12 weeks, CK if muscle symptoms",
    documentation_requirements: "Document ASCVD risk, statin choice, monitoring plan",
    references: "AHA/ACC 2018 Cholesterol Guidelines"
  },
  {
    rule_id: "QUALITY_003",
    rule_name: "Diabetes Screening",
    category: "Quality",
    severity: "Medium",
    trigger_condition: "Adult with BMI >25 and one additional risk factor",
    clinical_action: "Screen for diabetes with HbA1c or fasting glucose",
    evidence_level: "B",
    applicable_population: "Adults with risk factors",
    contraindications: "None",
    monitoring_requirements: "Annual screening if normal, more frequent if prediabetes",
    documentation_requirements: "Document risk factors, screening results, follow-up plan",
    references: "ADA 2023 Standards of Care"
  },

  // Protocol Rules
  {
    rule_id: "PROTOCOL_001",
    rule_name: "Antibiotic Stewardship",
    category: "Protocol",
    severity: "High",
    trigger_condition: "Antibiotic prescribed for >72 hours without culture results",
    clinical_action: "Review antibiotic necessity, consider de-escalation or discontinuation",
    evidence_level: "A",
    applicable_population: "All patients on antibiotics",
    contraindications: "None",
    monitoring_requirements: "Daily review of antibiotic necessity",
    documentation_requirements: "Document antibiotic indication, duration, and review",
    references: "IDSA 2016 Antimicrobial Stewardship Guidelines"
  },
  {
    rule_id: "PROTOCOL_002",
    rule_name: "Pain Assessment",
    category: "Protocol",
    severity: "Medium",
    trigger_condition: "Patient with pain score >4/10",
    clinical_action: "Assess pain characteristics, consider multimodal analgesia",
    evidence_level: "B",
    applicable_population: "All patients with pain",
    contraindications: "None",
    monitoring_requirements: "Regular pain assessment, medication effectiveness",
    documentation_requirements: "Document pain score, assessment, and treatment plan",
    references: "WHO 2018 Pain Management Guidelines"
  },
  {
    rule_id: "PROTOCOL_003",
    rule_name: "Fall Risk Assessment",
    category: "Protocol",
    severity: "High",
    trigger_condition: "Elderly patient (≥65 years) or patient with fall risk factors",
    clinical_action: "Complete fall risk assessment, implement fall prevention measures",
    evidence_level: "A",
    applicable_population: "Elderly and high-risk patients",
    contraindications: "None",
    monitoring_requirements: "Regular fall risk reassessment",
    documentation_requirements: "Document fall risk factors, prevention measures, education",
    references: "CDC 2015 Fall Prevention Guidelines"
  },

  // Medication Safety Rules
  {
    rule_id: "MED_SAFETY_001",
    rule_name: "Warfarin INR Monitoring",
    category: "Safety",
    severity: "Critical",
    trigger_condition: "Patient on warfarin with INR >4.5 or <1.5",
    clinical_action: "Hold warfarin if INR >4.5, increase dose if INR <1.5, consider vitamin K if bleeding",
    evidence_level: "A",
    applicable_population: "Patients on warfarin",
    contraindications: "None",
    monitoring_requirements: "Frequent INR monitoring, bleeding assessment",
    documentation_requirements: "Document INR trend, dose adjustments, bleeding risk",
    references: "ACCP 2012 Antithrombotic Therapy Guidelines"
  },
  {
    rule_id: "MED_SAFETY_002",
    rule_name: "Digoxin Toxicity",
    category: "Safety",
    severity: "Critical",
    trigger_condition: "Digoxin level >2.0 ng/mL or patient with toxicity symptoms",
    clinical_action: "Hold digoxin, consider digoxin-specific antibody fragments if severe",
    evidence_level: "A",
    applicable_population: "Patients on digoxin",
    contraindications: "None",
    monitoring_requirements: "ECG monitoring, renal function, potassium levels",
    documentation_requirements: "Document digoxin level, symptoms, interventions",
    references: "AHA 2019 Heart Failure Guidelines"
  },
  {
    rule_id: "MED_SAFETY_003",
    rule_name: "Opioid Safety",
    category: "Safety",
    severity: "High",
    trigger_condition: "Patient prescribed opioids for >7 days",
    clinical_action: "Assess for opioid use disorder risk, consider naloxone prescription",
    evidence_level: "B",
    applicable_population: "Patients on chronic opioids",
    contraindications: "None",
    monitoring_requirements: "Regular assessment of opioid use, pain control, side effects",
    documentation_requirements: "Document opioid indication, duration, risk assessment",
    references: "CDC 2016 Opioid Prescribing Guidelines"
  }
];

export function registerClinicalDecisionRules(server: McpServer): void {
  const resourceName = "clinical_decision_rules";
  const resourceUri = "mcp://md-mcp/clinical-decision-rules";

  const resourceConfig: ResourceMetadata = {
    title: "Clinical Decision Support Rules",
    description: `**Evidence-Based Clinical Decision Support Rules**

This resource provides comprehensive clinical decision support rules organized by:
- **Rule Categories**: Safety, Quality, Protocol, Medication Safety
- **Severity Levels**: Critical, High, Medium, Low
- **Evidence Levels**: A (Strong), B (Moderate), C (Weak), D (Expert Opinion)
- **Patient Populations**: All patients, specific age groups, conditions
- **Clinical Actions**: Specific interventions and monitoring requirements

**Rule Categories:**
- **Safety Rules**: Critical alerts for patient safety (AKI, hypoglycemia, sepsis)
- **Quality Rules**: Evidence-based quality measures (VTE prophylaxis, statin therapy)
- **Protocol Rules**: Standardized care protocols (antibiotic stewardship, pain assessment)
- **Medication Safety**: Drug-specific safety rules (warfarin, digoxin, opioids)

**Key Features:**
- Evidence-based recommendations
- Severity-based prioritization
- Population-specific applicability
- Monitoring and documentation requirements
- Contraindications and exceptions
- Clinical references and guidelines

**Usage Examples:**
- Search for "Safety" to get critical safety rules
- Filter by "Critical" severity for immediate attention rules
- Check "Medication Safety" for drug-specific rules
- Review evidence levels for decision confidence

**Perfect for:** Clinical decision support, quality improvement, patient safety, protocol compliance`,
    schema: ClinicalRulesSchema,
  };

  const resourceFetcher = async (uri: URL) => {
    const query = uri.searchParams.get('query')?.toLowerCase() || '';
    const category = uri.searchParams.get('category')?.toLowerCase() || '';
    const severity = uri.searchParams.get('severity')?.toLowerCase() || '';
    const evidenceLevel = uri.searchParams.get('evidence_level')?.toLowerCase() || '';

    let filteredData = CLINICAL_RULES_DATA;

    // Apply filters
    if (query) {
      filteredData = filteredData.filter(item =>
        item.rule_name.toLowerCase().includes(query) ||
        item.trigger_condition.toLowerCase().includes(query) ||
        item.clinical_action.toLowerCase().includes(query) ||
        item.applicable_population.toLowerCase().includes(query)
      );
    }

    if (category) {
      filteredData = filteredData.filter(item =>
        item.category.toLowerCase().includes(category)
      );
    }

    if (severity) {
      filteredData = filteredData.filter(item =>
        item.severity.toLowerCase().includes(severity)
      );
    }

    if (evidenceLevel) {
      filteredData = filteredData.filter(item =>
        item.evidence_level.toLowerCase().includes(evidenceLevel)
      );
    }

    // Create a single comprehensive resource with all data
    const allDataText = filteredData.map(item => 
      `**${item.rule_name}** (${item.category} | ${item.severity} | Evidence: ${item.evidence_level})
**Rule ID:** ${item.rule_id}
**Trigger Condition:** ${item.trigger_condition}
**Clinical Action:** ${item.clinical_action}
**Applicable Population:** ${item.applicable_population}
**Monitoring Requirements:** ${item.monitoring_requirements || 'None specified'}
**Documentation Requirements:** ${item.documentation_requirements || 'None specified'}
**References:** ${item.references || 'None specified'}
---`
    ).join('\n\n');

    return {
      resources: [{
        uri: `mcp://md-mcp/clinical-decision-rules`,
        name: "Clinical Decision Support Rules",
        description: `Comprehensive clinical decision support rules database with ${filteredData.length} rules`,
        mimeType: 'text/plain',
        size: allDataText.length,
        _meta: { total_rules: filteredData.length, categories: [...new Set(filteredData.map(item => item.category))] }
      }],
      contents: [{
        uri: `mcp://md-mcp/clinical-decision-rules`,
        text: `# Clinical Decision Support Rules Database\n\n${allDataText}`,
        blob: '',
        _meta: { total_rules: filteredData.length, categories: [...new Set(filteredData.map(item => item.category))] }
      }]
    };
  };

  server.registerResource(
    resourceName,
    resourceUri,
    resourceConfig,
    resourceFetcher
  );
}
