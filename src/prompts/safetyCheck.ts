/**
 * Drug Safety Verification Prompt Template
 * Provides comprehensive framework for medication safety assessment
 * Enables AI to perform systematic safety evaluations and risk assessments
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// MCP Prompts can only use string parameters - this is a limitation of the protocol
const safetyCheckArgsSchema = {
  drug_identifier: z.string().describe("Medication name or registration number to assess"),
  patient_age_group: z.string().optional().describe("Patient age group (e.g., 'pediatric', 'adult', 'geriatric')"),
  medical_conditions: z.string().optional().describe("Comma-separated list of medical conditions"),
  current_medications: z.string().optional().describe("Comma-separated list of current medications"),
  allergies: z.string().optional().describe("Comma-separated list of known allergies"),
  safety_concerns: z.string().optional().describe("Specific safety concerns or focus areas"),
  assessment_scope: z.string().optional().describe("Scope of assessment (e.g., 'comprehensive', 'basic', 'focused')"),
  risk_tolerance: z.string().optional().describe("Risk tolerance level (e.g., 'conservative', 'moderate', 'liberal')")
};

type SafetyCheckArgs = {
  drug_identifier: string;
  patient_age_group?: string | undefined;
  medical_conditions?: string | undefined;
  current_medications?: string | undefined;
  allergies?: string | undefined;
  safety_concerns?: string | undefined;
  assessment_scope?: string | undefined;
  risk_tolerance?: string | undefined;
};

// ===== PROMPT REGISTRATION =====

export function registerSafetyCheckPrompt(server: McpServer): void {
  server.registerPrompt(
    "drug_safety_verification",
    {
      title: "Comprehensive Medication Safety Assessment",
      description: `Advanced pharmaceutical safety evaluation framework that enables systematic assessment of medication safety profiles, risk factors, and clinical safety considerations. Essential for evidence-based safety decision-making and risk management.

**Usage:**
- drug_identifier: Medication name or registration number (required)
- patient_age_group: Age category for population-specific assessment (optional)
- medical_conditions: Relevant comorbidities (optional)
- current_medications: Concurrent medications for interaction screening (optional)
- allergies: Known drug allergies or sensitivities (optional)
- safety_concerns: Specific areas of safety focus (optional)
- assessment_scope: Depth of analysis required (optional)
- risk_tolerance: Acceptable risk level for decision-making (optional)

**Safety Assessment Domains:**
- Regulatory safety status and approval history
- Clinical safety profile and adverse event analysis
- Population-specific safety considerations
- Drug interaction and contraindication assessment
- Risk mitigation and monitoring strategies

**Example Usage:**
drug_identifier: "Warfarin 5mg"
patient_age_group: "elderly"
medical_conditions: "atrial fibrillation,diabetes,hypertension"
current_medications: "metformin,amlodipine"
safety_concerns: "bleeding risk,drug interactions"

This prompt generates comprehensive safety assessment reports that integrate regulatory data, clinical evidence, and patient-specific risk factors for optimal medication safety management.`,
      argsSchema: safetyCheckArgsSchema
    },
    async (args, extra) => {
      try {
        const promptContent = generateSafetyCheckPrompt(args);
        
        return {
          messages: [
            {
              role: "user" as const,
              content: {
                type: "text" as const,
                text: promptContent
              }
            }
          ]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to generate safety check prompt: ${errorMessage}`);
      }
    }
  );
}

// ===== PROMPT GENERATION =====

function generateSafetyCheckPrompt(input: SafetyCheckArgs): string {
  const {
    drug_identifier,
    patient_age_group,
    medical_conditions,
    current_medications,
    allergies,
    safety_concerns,
    assessment_scope,
    risk_tolerance
  } = input;

  // Parse comma-separated lists
  const conditionsList = medical_conditions ? medical_conditions.split(',').map(c => c.trim()).filter(c => c.length > 0) : [];
  const medicationsList = current_medications ? current_medications.split(',').map(m => m.trim()).filter(m => m.length > 0) : [];
  const allergiesList = allergies ? allergies.split(',').map(a => a.trim()).filter(a => a.length > 0) : [];
  const concernsList = safety_concerns ? safety_concerns.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];

  let prompt = `# Comprehensive Medication Safety Assessment

## Safety Assessment Overview
**Medication Under Review:** ${drug_identifier}
**Patient Age Group:** ${patient_age_group || "Adult population"}
**Medical Conditions:** ${conditionsList.length > 0 ? conditionsList.join(", ") : "None specified"}
**Current Medications:** ${medicationsList.length > 0 ? medicationsList.join(", ") : "None specified"}
**Known Allergies:** ${allergiesList.length > 0 ? allergiesList.join(", ") : "None specified"}
**Safety Concerns:** ${concernsList.length > 0 ? concernsList.join(", ") : "General safety assessment"}
**Assessment Scope:** ${assessment_scope || "Comprehensive safety evaluation"}
**Risk Tolerance:** ${risk_tolerance || "Standard clinical risk tolerance"}

## Systematic Safety Evaluation Framework

### 1. Regulatory Safety Status Assessment

**Current Regulatory Standing:**
- Israeli Ministry of Health approval status and registration number
- Current marketing authorization status (active/suspended/withdrawn)
- Recent regulatory actions or safety communications
- International regulatory status comparison (FDA, EMA, other authorities)
- Regulatory pathway classification (original/generic/biosimilar)

**Safety Signal History:**
- Historical safety alerts and warnings issued
- Label changes and safety updates timeline
- Post-marketing safety studies required or completed
- Risk evaluation and mitigation strategies (REMS) in place
- Regulatory inspection findings and compliance status

**Quality and Manufacturing Safety:**
- Good Manufacturing Practice (GMP) compliance status
- Recent quality defects or manufacturing issues
- Product recalls or quality alerts history
- Supply chain integrity and authenticity verification
- Batch-to-batch consistency monitoring data

### 2. Clinical Safety Profile Analysis

**Adverse Event Profile Assessment:**
- Common adverse reactions (incidence ≥1%)
  * Mild reactions requiring no intervention
  * Moderate reactions requiring medical attention
  * Severe reactions requiring hospitalization
- Serious adverse events and safety outcomes
  * Life-threatening events and mortality data
  * Permanent disability or significant morbidity
  * Hospitalization or prolonged hospitalization events

**Frequency and Severity Classification:**
- Very common (≥1/10): List all very common adverse reactions
- Common (≥1/100 to <1/10): Categorize by organ system
- Uncommon (≥1/1,000 to <1/100): Focus on clinically significant events
- Rare (≥1/10,000 to <1/1,000): Highlight unexpected serious events
- Very rare (<1/10,000): Document case reports and unique events

**Dose-Response and Temporal Relationships:**
- Dose-dependent adverse reaction patterns
- Time to onset for different adverse events
- Duration of adverse effects and recovery patterns
- Cumulative dose effects and long-term safety
- Withdrawal and discontinuation syndrome potential

### 3. Patient-Specific Risk Assessment

${generatePatientRiskSection(patient_age_group, conditionsList, medicationsList, allergiesList)}

### 4. Drug Interaction and Contraindication Analysis

**Absolute Contraindications:**
- Medical conditions precluding medication use
- Concomitant medications with dangerous interactions
- Genetic factors affecting drug metabolism or response
- Physiological states incompatible with medication use
- Previous severe adverse reactions to medication or class

**Relative Contraindications and Precautions:**
- Medical conditions requiring careful monitoring
- Medications requiring dose adjustment or monitoring
- Patient characteristics increasing risk profile
- Clinical scenarios requiring specialized expertise
- Situations requiring enhanced surveillance

**Drug-Drug Interaction Assessment:**
${medicationsList.length > 0 ? generateInteractionAnalysis(medicationsList) : "No current medications specified for interaction analysis"}

**Drug-Disease Interactions:**
${conditionsList.length > 0 ? generateDiseaseInteractionAnalysis(conditionsList) : "No specific medical conditions specified for analysis"}

### 5. Special Population Safety Considerations

${generateSpecialPopulationSection(patient_age_group)}

### 6. Risk Mitigation and Monitoring Strategy

**Pre-Treatment Safety Measures:**
- Baseline laboratory tests and assessments required
- Patient screening protocols and risk stratification
- Contraindication verification and documentation
- Patient counseling and informed consent process
- Healthcare provider training and competency requirements

**Ongoing Monitoring Protocol:**
- Laboratory monitoring schedule and parameters
- Clinical assessment frequency and key indicators
- Patient-reported outcome monitoring
- Caregiver education and monitoring responsibilities
- Emergency contact and escalation procedures

**Adverse Event Management:**
- Early detection strategies and warning signs
- Immediate management protocols for common adverse events
- Emergency management procedures for serious events
- Dose modification and discontinuation criteria
- Alternative therapy transition protocols

### 7. Safety Communication and Documentation

**Patient Education Requirements:**
- Key safety information for patient understanding
- Warning signs requiring immediate medical attention
- Proper medication use and adherence guidelines
- Lifestyle modifications and safety precautions
- Emergency contact information and procedures

**Healthcare Provider Communication:**
- Critical safety information for prescribers
- Monitoring requirements and frequency
- Drug interaction alerts and contraindications
- Adverse event reporting obligations
- Patient counseling and education responsibilities

**Documentation Requirements:**
- Safety assessment documentation standards
- Adverse event reporting procedures
- Risk mitigation strategy documentation
- Patient monitoring record requirements
- Quality assurance and audit trail maintenance

## Risk-Benefit Analysis Framework

### Safety Risk Assessment
Based on the specified patient characteristics and safety concerns:

${generateRiskAssessment(concernsList, risk_tolerance)}

### Clinical Decision Support Algorithm

\`\`\`
Step 1: Contraindication Assessment
├─ Absolute contraindications present? → STOP, seek alternatives
├─ Relative contraindications? → Enhanced monitoring required
└─ No major contraindications → Proceed to Step 2

Step 2: Risk-Benefit Evaluation  
├─ High risk, high benefit → Intensive monitoring
├─ Low risk, high benefit → Standard monitoring
├─ High risk, low benefit → Consider alternatives
└─ Low risk, low benefit → Patient preference-based

Step 3: Monitoring Strategy Selection
├─ High-risk patient → Intensive monitoring protocol
├─ Moderate-risk patient → Enhanced monitoring protocol
└─ Low-risk patient → Standard monitoring protocol

Step 4: Safety Implementation
├─ Patient education and consent
├─ Monitoring protocol activation
├─ Safety communication established
└─ Documentation completed
\`\`\`

## Safety Action Plan

### Immediate Actions (Pre-Treatment)
1. **Contraindication Verification:** Confirm absence of absolute contraindications
2. **Baseline Assessment:** Complete required safety evaluations
3. **Patient Education:** Comprehensive safety information and consent
4. **Documentation:** Record safety assessment and decision rationale

### Ongoing Safety Management
1. **Monitoring Implementation:** Execute appropriate surveillance protocol
2. **Safety Communication:** Maintain patient-provider safety dialogue
3. **Response Monitoring:** Track effectiveness and safety outcomes
4. **Plan Adjustment:** Modify approach based on patient response

### Emergency Protocols
1. **Recognition:** Early identification of serious adverse events
2. **Management:** Immediate intervention protocols
3. **Reporting:** Adverse event documentation and reporting
4. **Follow-up:** Long-term safety monitoring and care

## Evidence-Based Safety Conclusion

### Safety Recommendation Summary
**Overall Safety Assessment:** [Provide risk-stratified recommendation based on analysis]

**Key Safety Priorities:**
1. Most important safety considerations for this patient
2. Critical monitoring requirements and frequency
3. Essential patient education elements
4. Emergency management preparedness

**Risk Mitigation Strategy:**
- Patient-specific risk factors and mitigation approaches
- Monitoring intensity and parameters
- Safety communication and education plan
- Emergency response and escalation procedures

---

**Safety Disclaimer:** This safety assessment is based on current available evidence and should be integrated with clinical judgment and patient-specific factors. Healthcare providers retain full responsibility for patient safety decisions and should consult current Israeli prescribing information and seek specialist advice when indicated.

**Pharmacovigilance:** Any adverse events should be reported to the Israeli Ministry of Health adverse event reporting system as required by regulations.

**Last Updated:** ${new Date().toLocaleDateString('he-IL')}`;

  return prompt;
}

function generatePatientRiskSection(ageGroup?: string, conditions?: string[], medications?: string[], allergies?: string[]): string {
  let section = "**Patient-Specific Risk Assessment:**\n\n";

  if (ageGroup) {
    section += `**Age-Related Considerations (${ageGroup}):**\n`;
    
    if (ageGroup.toLowerCase().includes("pediatric") || ageGroup.toLowerCase().includes("child")) {
      section += `- Pediatric dosing and safety considerations
- Developmental pharmacology factors
- Age-appropriate formulation safety
- Long-term developmental impact assessment
- Caregiver administration and monitoring capability

`;
    } else if (ageGroup.toLowerCase().includes("geriatric") || ageGroup.toLowerCase().includes("elderly")) {
      section += `- Age-related pharmacokinetic changes
- Polypharmacy interaction potential
- Cognitive and functional impact assessment
- Falls risk and mobility considerations
- Simplified dosing regimen preferences

`;
    } else {
      section += `- Standard adult pharmacology considerations
- Reproductive health and contraception counseling
- Occupational and lifestyle impact assessment
- Long-term safety for chronic use

`;
    }
  }

  if (conditions && conditions.length > 0) {
    section += `**Comorbidity Risk Assessment:**\n`;
    conditions.forEach((condition: string) => {
      section += `- ${condition}: Disease-drug interaction evaluation
  * Pathophysiology impact on drug safety
  * Disease progression considerations
  * Monitoring parameter modifications
  * Alternative therapy availability

`;
    });
  }

  if (medications && medications.length > 0) {
    section += `**Concurrent Medication Analysis:**\n`;
    section += `- Current medications: ${medications.join(", ")}
- Pharmacokinetic interaction screening
- Pharmacodynamic interaction assessment
- Timing optimization strategies
- Monitoring intensification needs

`;
  }

  if (allergies && allergies.length > 0) {
    section += `**Allergy and Hypersensitivity Assessment:**\n`;
    allergies.forEach((allergy: string) => {
      section += `- ${allergy}: Cross-reactivity evaluation
  * Structural similarity analysis
  * Alternative medication selection
  * Emergency preparedness planning
  * Allergy testing recommendations

`;
    });
  }

  return section;
}

function generateInteractionAnalysis(medications: string[]): string {
  let analysis = `**Current Medication Interaction Analysis:**\n`;
  analysis += `- Medications to assess: ${medications.join(", ")}\n`;
  analysis += `- CYP450 enzyme interaction potential\n`;
  analysis += `- P-glycoprotein transporter interactions\n`;
  analysis += `- Pharmacodynamic interaction risks\n`;
  analysis += `- Timing and sequencing optimization\n`;
  analysis += `- Monitoring parameter adjustments\n\n`;
  
  medications.forEach(medication => {
    analysis += `**${medication} Specific Interactions:**\n`;
    analysis += `- Known major drug interactions\n`;
    analysis += `- Moderate interactions requiring monitoring\n`;
    analysis += `- Minor interactions and clinical significance\n`;
    analysis += `- Dose adjustment requirements\n`;
    analysis += `- Alternative timing strategies\n\n`;
  });
  
  return analysis;
}

function generateDiseaseInteractionAnalysis(conditions: string[]): string {
  let analysis = `**Disease-Drug Interaction Assessment:**\n`;
  analysis += `- Conditions to evaluate: ${conditions.join(", ")}\n`;
  analysis += `- Pathophysiology impact on drug safety\n`;
  analysis += `- Disease progression considerations\n`;
  analysis += `- Organ function implications\n`;
  analysis += `- Dose modification requirements\n\n`;
  
  conditions.forEach(condition => {
    analysis += `**${condition} Specific Considerations:**\n`;
    analysis += `- Impact on drug metabolism and clearance\n`;
    analysis += `- Disease-specific contraindications\n`;
    analysis += `- Monitoring parameter modifications\n`;
    analysis += `- Alternative therapy considerations\n`;
    analysis += `- Specialist consultation requirements\n\n`;
  });
  
  return analysis;
}

function generateSpecialPopulationSection(ageGroup?: string): string {
  let section = "**Population-Specific Safety Considerations:**\n\n";
  
  if (ageGroup) {
    if (ageGroup.toLowerCase().includes("pediatric") || ageGroup.toLowerCase().includes("child")) {
      section += `**Pediatric Safety Profile:**
- Age-specific dosing calculations and weight-based dosing
- Developmental pharmacokinetic considerations
- Pediatric-specific adverse event profiles
- Long-term growth and development effects
- Caregiver education and administration training
- Age-appropriate monitoring strategies

`;
    } else if (ageGroup.toLowerCase().includes("geriatric") || ageGroup.toLowerCase().includes("elderly")) {
      section += `**Geriatric Safety Considerations:**
- Age-related pharmacokinetic and pharmacodynamic changes
- Increased sensitivity to adverse effects
- Polypharmacy interaction complexity
- Cognitive impairment impact on adherence
- Falls risk assessment and prevention
- Simplified dosing regimen optimization

`;
    } else {
      section += `**Adult Population Safety:**
- Standard pharmacokinetic considerations
- Reproductive health and pregnancy planning
- Occupational safety and functionality
- Long-term chronic medication safety

`;
    }
  } else {
    section += `**General Population Considerations:**
- Standard adult dosing and monitoring
- Reproductive health considerations
- Occupational and lifestyle factors
- Chronic medication management

`;
  }

  section += `**Pregnancy and Lactation Safety:**
- Pregnancy category classification and teratogenic risk
- Reproductive toxicology data and fertility considerations
- Lactation safety and infant exposure assessment
- Alternative therapy options for pregnant patients
- Contraception counseling and pregnancy planning

**Organ Impairment Considerations:**
- Hepatic impairment dosing and safety modifications
- Renal impairment clearance and dose adjustments
- Cardiac safety in cardiovascular disease patients
- Pulmonary considerations for respiratory conditions
- Neurological safety in CNS disorder patients

`;

  return section;
}

function generateRiskAssessment(concerns: string[], riskTolerance?: string): string {
  let assessment = `**Individualized Risk Assessment:**\n\n`;
  
  if (concerns.length > 0) {
    assessment += `**Specific Safety Concerns Analysis:**\n`;
    concerns.forEach(concern => {
      assessment += `- ${concern}: Detailed risk evaluation and mitigation strategies\n`;
      assessment += `  * Risk probability and clinical significance\n`;
      assessment += `  * Monitoring strategies and warning signs\n`;
      assessment += `  * Prevention and management protocols\n`;
      assessment += `  * Alternative therapy considerations\n\n`;
    });
  }
  
  assessment += `**Risk Tolerance Framework (${riskTolerance || "Standard"}):**\n`;
  
  if (riskTolerance?.toLowerCase() === "conservative") {
    assessment += `- Minimize all potential risks, even low-probability events
- Enhanced monitoring and frequent assessments
- Lower threshold for discontinuation or dose modification
- Preference for proven, well-established therapies
- Intensive patient education and safety communication

`;
  } else if (riskTolerance?.toLowerCase() === "liberal") {
    assessment += `- Accept higher risk for potential therapeutic benefit
- Standard monitoring with targeted assessments
- Higher threshold for therapy modifications
- Consideration of newer or innovative therapies
- Balanced risk-benefit patient counseling

`;
  } else {
    assessment += `- Balanced approach to risk and benefit evaluation
- Evidence-based monitoring and assessment protocols
- Standard thresholds for therapy modifications
- Established therapy preferences with innovative considerations
- Comprehensive patient education and shared decision-making

`;
  }
  
  return assessment;
}