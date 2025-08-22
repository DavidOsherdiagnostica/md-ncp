/**
 * Drug Safety Verification Prompt Template
 * Provides comprehensive framework for medication safety assessment
 * Enables AI to perform systematic safety evaluations and risk assessments
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DrugSafetyVerificationSchema, DrugSafetyVerificationInput } from "../types/mcp.js";
import { getApiClient } from "../services/israelDrugsApi.js";
import { validateToolInput } from "../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../utils/errorHandler.js";

// ===== PROMPT REGISTRATION =====

export function registerSafetyCheckPrompt(server: McpServer): void {
  server.registerPrompt(
    "drug_safety_verification",
    {
      title: "Comprehensive Medication Safety Assessment",
      description: `Advanced pharmaceutical safety evaluation framework that enables systematic assessment of medication safety profiles, risk factors, and clinical safety considerations. Essential for evidence-based safety decision-making and risk management.

**Safety Assessment Domains:**
- Regulatory safety status and approval history
- Clinical safety profile and adverse event analysis
- Population-specific safety considerations
- Drug interaction and contraindication assessment
- Risk mitigation and monitoring strategies

**Clinical Safety Applications:**
- Pre-prescribing safety verification
- High-risk patient safety assessment
- Medication reconciliation safety checks
- Adverse event investigation and analysis
- Safety monitoring protocol development

**Risk Assessment Framework:**
- Individual patient risk stratification
- Population-level safety surveillance
- Signal detection and safety monitoring
- Risk-benefit analysis and optimization
- Safety communication and education

**Regulatory Compliance:**
- Ministry of Health safety requirements
- International safety standards alignment
- Pharmacovigilance obligations
- Risk evaluation and mitigation strategies
- Safety reporting and documentation

This prompt generates comprehensive safety assessment reports that integrate regulatory data, clinical evidence, and patient-specific risk factors for optimal medication safety management.`,
      inputSchema: DrugSafetyVerificationSchema
    },
    async (input: DrugSafetyVerificationInput) => {
      try {
        // Validate input parameters
        const { data: validatedInput } = validateToolInput(
          DrugSafetyVerificationSchema,
          input,
          "drug_safety_verification"
        );

        // Generate comprehensive safety verification prompt
        return generateSafetyCheckPrompt(validatedInput);

      } catch (error) {
        const classifiedError = classifyError(error, "drug_safety_verification");
        return createComprehensiveErrorResponse(classifiedError, undefined, {
          promptName: "drug_safety_verification",
          userInput: input
        });
      }
    }
  );
}

// ===== PROMPT GENERATION =====

function generateSafetyCheckPrompt(input: DrugSafetyVerificationInput): string {
  const {
    drug_identifier,
    patient_profile,
    safety_concerns,
    assessment_scope,
    risk_tolerance
  } = input;

  let prompt = `# Comprehensive Medication Safety Assessment

## Safety Assessment Overview
**Medication Under Review:** ${formatDrugIdentifier(drug_identifier)}
**Patient Profile:** ${formatPatientProfile(patient_profile)}
**Safety Concerns:** ${safety_concerns?.join(", ") || "General safety assessment"}
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

${generatePatientRiskSection(patient_profile)}

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
- CYP450 enzyme interactions and clinical significance
- Pharmacokinetic interactions affecting absorption, distribution, metabolism, excretion
- Pharmacodynamic interactions with additive or antagonistic effects
- Transporter-mediated interactions affecting drug disposition
- Complex multi-drug interaction scenarios

**Drug-Disease Interactions:**
- Organ system impairment affecting drug safety
- Disease states altering drug metabolism or response
- Pathophysiological changes affecting drug tolerance
- Comorbidity interactions with therapeutic effects
- Disease progression impact on medication safety

### 5. Special Population Safety Considerations

**Pediatric Safety Profile:**
- Age-specific dosing and safety considerations
- Developmental pharmacology and safety implications
- Pediatric clinical trial data and post-marketing experience
- Off-label use safety in children and adolescents
- Long-term developmental and growth effects

**Geriatric Safety Considerations:**
- Age-related pharmacokinetic and pharmacodynamic changes
- Polypharmacy interactions and complexity
- Cognitive impairment and medication management safety
- Falls risk and functional impact assessment
- Age-related organ function decline considerations

**Pregnancy and Lactation Safety:**
- Pregnancy category classification and teratogenic risk
- Reproductive toxicology and fertility considerations
- Lactation safety and infant exposure risk
- Alternative therapy options for pregnant/nursing patients
- Contraception counseling and pregnancy planning

**Organ Impairment Safety:**
- Hepatic impairment dosing and monitoring requirements
- Renal impairment safety and dose adjustments
- Cardiac safety in patients with cardiovascular disease
- Pulmonary safety considerations for respiratory conditions
- Neurological safety in patients with CNS disorders

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

### Quantitative Risk Assessment
**Risk Scoring Matrix:**

| Risk Category | Probability | Severity | Risk Score | Mitigation Priority |
|---------------|-------------|----------|------------|-------------------|
| Common mild AEs | High (>10%) | Low | Moderate | Education/Monitoring |
| Uncommon serious AEs | Low (<1%) | High | Moderate | Close Monitoring |
| Rare severe AEs | Very Low (<0.1%) | Very High | High | Specialized Care |
| Drug interactions | Variable | Variable | Calculated | Case-by-case |

### Benefit Assessment Framework
- **Primary therapeutic benefit:** Disease progression prevention or symptom relief
- **Secondary benefits:** Quality of life improvement and functional enhancement
- **Comparative effectiveness:** Advantage over alternative therapies
- **Patient preference:** Alignment with patient values and goals
- **Healthcare system benefit:** Resource utilization and cost-effectiveness

### Risk-Benefit Ratio Determination
Based on the comprehensive assessment:

1. **Favorable Risk-Benefit:** Benefits clearly outweigh risks
   - Recommend standard use with routine monitoring
   - Patient education focused on adherence and routine safety

2. **Acceptable Risk-Benefit:** Benefits outweigh risks with appropriate monitoring
   - Recommend use with enhanced monitoring protocols
   - Specialized patient education and safety measures

3. **Uncertain Risk-Benefit:** Benefits and risks require careful evaluation
   - Consider alternative therapies or specialized consultation
   - Enhanced monitoring and frequent reassessment

4. **Unfavorable Risk-Benefit:** Risks outweigh benefits
   - Generally not recommended for this patient
   - Seek alternative therapies or specialist consultation

## Safety Decision Support Algorithm

### Clinical Decision Tree
\`\`\`
1. Is the medication absolutely contraindicated?
   → YES: Do not prescribe, seek alternatives
   → NO: Continue assessment

2. Are there relative contraindications or high-risk factors?
   → YES: Evaluate risk mitigation strategies
   → NO: Standard safety monitoring

3. Can identified risks be adequately monitored and managed?
   → YES: Proceed with enhanced monitoring
   → NO: Consider alternative therapies

4. Does the patient understand and accept the risks?
   → YES: Proceed with appropriate safeguards
   → NO: Additional education or alternative consideration

5. Are resources available for appropriate monitoring?
   → YES: Implement monitoring protocol
   → NO: Reconsider appropriateness or setting
\`\`\`

### Monitoring Intensity Classification
- **Minimal Monitoring:** Standard follow-up care
- **Routine Monitoring:** Regular clinical and laboratory surveillance
- **Enhanced Monitoring:** Frequent assessment with specialized parameters
- **Intensive Monitoring:** Close supervision with immediate access to intervention

## Safety Action Plan

### Immediate Actions (Pre-Treatment)
1. **Verification:** Confirm absence of absolute contraindications
2. **Assessment:** Complete baseline safety evaluations
3. **Education:** Provide comprehensive patient safety education
4. **Documentation:** Record safety assessment and informed consent

### Short-term Monitoring (First 30-90 days)
1. **Surveillance:** Implement early detection monitoring protocols
2. **Assessment:** Evaluate initial tolerance and safety signals
3. **Adjustment:** Modify therapy based on initial safety profile
4. **Communication:** Maintain patient-provider safety dialogue

### Long-term Safety Management (Ongoing)
1. **Monitoring:** Continue appropriate surveillance protocols
2. **Reassessment:** Periodic risk-benefit evaluation
3. **Optimization:** Adjust therapy based on safety experience
4. **Documentation:** Maintain comprehensive safety records

## Safety Quality Assurance

### Performance Indicators
- **Safety Monitoring Compliance:** Adherence to monitoring protocols
- **Adverse Event Detection:** Time to identification and management
- **Patient Safety Education:** Effectiveness of safety communication
- **Risk Mitigation Success:** Prevention of preventable adverse events

### Continuous Improvement
- **Safety Data Review:** Regular analysis of safety outcomes
- **Protocol Optimization:** Evidence-based monitoring refinements
- **Education Enhancement:** Improved patient and provider education
- **System Integration:** Healthcare system safety culture development

## Evidence-Based Safety Conclusion

### Safety Recommendation Summary
**Overall Safety Assessment:** [Provide clear safety recommendation]

**Key Safety Considerations:**
1. Primary safety concern requiring attention
2. Monitoring requirements and frequency
3. Patient education priorities
4. Risk mitigation strategies

**Special Precautions:**
- Population-specific considerations
- Drug interaction management
- Emergency management planning
- Follow-up and reassessment schedule

### Safety Monitoring Protocol
**Baseline Requirements:** [Specify pre-treatment assessments]
**Ongoing Monitoring:** [Detail surveillance schedule]
**Alert Criteria:** [Define intervention triggers]
**Emergency Protocols:** [Outline emergency procedures]

---

**Safety Disclaimer:** This safety assessment is based on current available evidence and should be integrated with clinical judgment and patient-specific factors. Healthcare providers retain full responsibility for patient safety decisions and should consult current prescribing information and seek specialist advice when indicated.

**Pharmacovigilance:** Any adverse events should be reported to the Israeli Ministry of Health adverse event reporting system and manufacturer pharmacovigilance departments as required by regulations.

**Last Updated:** ${new Date().toLocaleDateString('he-IL')}`;

  return prompt;
}

function formatDrugIdentifier(identifier: any): string {
  if (typeof identifier === 'string') {
    return identifier;
  }
  
  if (identifier.name) {
    return `${identifier.name}${identifier.registration_number ? ` (Reg: ${identifier.registration_number})` : ''}`;
  }
  
  if (identifier.registration_number) {
    return `Registration Number: ${identifier.registration_number}`;
  }
  
  return "Medication identifier not fully specified";
}

function formatPatientProfile(profile?: any): string {
  if (!profile) {
    return "General patient population";
  }
  
  const profileElements: string[] = [];
  
  if (profile.age_group) {
    profileElements.push(`Age: ${profile.age_group}`);
  }
  
  if (profile.medical_conditions) {
    profileElements.push(`Conditions: ${profile.medical_conditions.join(", ")}`);
  }
  
  if (profile.current_medications) {
    profileElements.push(`Current meds: ${profile.current_medications.join(", ")}`);
  }
  
  if (profile.allergies) {
    profileElements.push(`Allergies: ${profile.allergies.join(", ")}`);
  }
  
  if (profile.organ_function) {
    const organStatus = Object.entries(profile.organ_function)
      .map(([organ, status]) => `${organ}: ${status}`)
      .join(", ");
    profileElements.push(`Organ function: ${organStatus}`);
  }
  
  return profileElements.length > 0 ? profileElements.join(" | ") : "Standard patient profile";
}

function generatePatientRiskSection(profile?: any): string {
  if (!profile) {
    return `**Standard Patient Risk Assessment:**
- Age-related pharmacokinetic considerations
- Standard contraindication and precaution review
- Routine drug interaction screening
- General population safety profile application`;
  }

  let section = "**Patient-Specific Risk Factors:**\n\n";

  if (profile.age_group) {
    section += `**Age-Related Considerations (${profile.age_group}):**\n`;
    
    if (profile.age_group.includes("pediatric") || profile.age_group.includes("child")) {
      section += `- Pediatric dosing and safety considerations
- Developmental pharmacology factors
- Age-appropriate formulation safety
- Long-term developmental impact assessment
- Caregiver administration and monitoring capability

`;
    } else if (profile.age_group.includes("geriatric") || profile.age_group.includes("elderly")) {
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

  if (profile.medical_conditions && profile.medical_conditions.length > 0) {
    section += `**Comorbidity Risk Assessment:**\n`;
    profile.medical_conditions.forEach((condition: string) => {
      section += `- ${condition}: Disease-drug interaction evaluation
  * Pathophysiology impact on drug safety
  * Disease progression considerations
  * Monitoring parameter modifications
  * Alternative therapy availability

`;
    });
  }

  if (profile.current_medications && profile.current_medications.length > 0) {
    section += `**Drug Interaction Risk Analysis:**\n`;
    section += `- Current medication list: ${profile.current_medications.join(", ")}
- Pharmacokinetic interaction potential
- Pharmacodynamic interaction assessment
- Timing and sequencing considerations
- Monitoring parameter intensification needs
- Alternative medication timing strategies

`;
  }

  if (profile.allergies && profile.allergies.length > 0) {
    section += `**Allergy and Hypersensitivity Assessment:**\n`;
    profile.allergies.forEach((allergy: string) => {
      section += `- ${allergy}: Cross-reactivity evaluation
  * Chemical structure similarity analysis
  * Alternative medication selection
  * Emergency preparedness planning
  * Allergy testing recommendations

`;
    });
  }

  if (profile.organ_function) {
    section += `**Organ Function Impact Assessment:**\n`;
    Object.entries(profile.organ_function).forEach(([organ, status]) => {
      section += `- ${organ} function (${status}):
  * Pharmacokinetic parameter adjustments
  * Dose modification requirements
  * Monitoring frequency intensification
  * Contraindication evaluation
  * Alternative therapy considerations

`;
    });
  }

  return section;
}

// ===== TYPE DEFINITIONS =====

interface DrugSafetyVerificationInput {
  drug_identifier: string | {
    name?: string;
    registration_number?: string;
    active_ingredient?: string;
  };
  patient_profile?: {
    age_group?: string;
    medical_conditions?: string[];
    current_medications?: string[];
    allergies?: string[];
    organ_function?: Record<string, string>;
  };
  safety_concerns?: string[];
  assessment_scope?: string;
  risk_tolerance?: string;
}