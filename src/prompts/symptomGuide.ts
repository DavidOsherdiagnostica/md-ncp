/**
 * Symptom to Treatment Guide Prompt Template
 * Provides structured clinical pathway from symptoms to evidence-based treatments
 * Enables AI to guide comprehensive symptom-based therapeutic decision making
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SymptomToTreatmentWorkflowSchema, SymptomToTreatmentWorkflowInput } from "../types/mcp.js";
import { getApiClient } from "../services/israelDrugsApi.js";
import { validateToolInput } from "../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../utils/errorHandler.js";

// ===== PROMPT REGISTRATION =====

export function registerSymptomGuidePrompt(server: McpServer): void {
  server.registerPrompt(
    "symptom_to_treatment_workflow",
    {
      title: "Evidence-Based Symptom Treatment Pathway",
      description: `Comprehensive clinical decision support framework that guides healthcare providers through systematic symptom assessment and evidence-based treatment selection. Essential for standardized clinical care and optimal therapeutic outcomes.

**Clinical Workflow Applications:**
- Primary care symptom assessment and management
- Emergency department symptom triage and treatment
- Specialty care symptom-focused evaluation
- Telemedicine symptom-based consultation
- Patient self-care guidance and education

**Assessment Framework:**
- Systematic symptom characterization and severity grading
- Differential diagnosis consideration and clinical reasoning
- Evidence-based treatment algorithm development
- Patient-centered care planning and shared decision making
- Quality improvement and clinical outcome optimization

**Treatment Pathway Components:**
- Immediate symptom relief strategies
- Short-term therapeutic interventions
- Long-term management planning
- Prevention and health maintenance
- Complication recognition and management

**Clinical Decision Support:**
- Red flag symptom identification and emergency protocols
- Treatment effectiveness monitoring and optimization
- Patient education and self-management support
- Healthcare system integration and resource utilization
- Quality assurance and continuous improvement

This prompt generates structured treatment pathways that integrate clinical evidence, patient preferences, and healthcare system capabilities for optimal symptom-based care delivery.`,
      inputSchema: SymptomToTreatmentWorkflowSchema
    },
    async (input: SymptomToTreatmentWorkflowInput) => {
      try {
        // Validate input parameters
        const { data: validatedInput } = validateToolInput(
          SymptomToTreatmentWorkflowSchema,
          input,
          "symptom_to_treatment_workflow"
        );

        // Generate comprehensive symptom guide prompt
        return generateSymptomGuidePrompt(validatedInput);

      } catch (error) {
        const classifiedError = classifyError(error, "symptom_to_treatment_workflow");
        return createComprehensiveErrorResponse(classifiedError, undefined, {
          promptName: "symptom_to_treatment_workflow",
          userInput: input
        });
      }
    }
  );
}

// ===== PROMPT GENERATION =====

function generateSymptomGuidePrompt(input: SymptomToTreatmentWorkflowInput): string {
  const {
    presenting_symptoms,
    patient_context,
    severity_assessment,
    treatment_goals,
    resource_constraints
  } = input;

  let prompt = `# Evidence-Based Symptom to Treatment Clinical Pathway

## Clinical Presentation Overview
**Presenting Symptoms:** ${formatSymptoms(presenting_symptoms)}
**Patient Context:** ${formatPatientContext(patient_context)}
**Severity Assessment:** ${severity_assessment || "Standard clinical assessment required"}
**Treatment Goals:** ${formatTreatmentGoals(treatment_goals)}
**Resource Constraints:** ${formatResourceConstraints(resource_constraints)}

## Systematic Clinical Assessment Framework

### 1. Comprehensive Symptom Characterization

**Primary Symptom Analysis:**
For each presenting symptom, provide detailed characterization:

**Symptom Profile Assessment:**
- **Onset and Duration:** Acute (<24 hours), subacute (1-7 days), chronic (>7 days)
- **Severity Grading:** Mild (does not interfere with function), Moderate (interferes with function), Severe (prevents normal activities)
- **Quality and Character:** Descriptive characteristics and patient-reported qualities
- **Location and Distribution:** Anatomical location and radiation patterns
- **Timing and Pattern:** Constant, intermittent, episodic, or progressive patterns

**Associated Symptoms and Context:**
- **Constitutional Symptoms:** Fever, fatigue, weight loss, night sweats
- **Functional Impact:** Activities of daily living, work capacity, quality of life
- **Psychological Impact:** Anxiety, depression, sleep disturbance, coping mechanisms
- **Social and Environmental Factors:** Living situation, support systems, occupational exposures

**Red Flag Symptom Assessment:**
Identify symptoms requiring immediate medical attention:
- **Cardiovascular:** Chest pain, severe dyspnea, syncope, severe hypertension
- **Neurological:** Severe headache, focal neurological deficits, altered consciousness
- **Gastrointestinal:** Severe abdominal pain, hematemesis, melena, signs of obstruction
- **Respiratory:** Severe dyspnea, hemoptysis, respiratory distress
- **Infectious:** High fever with rigors, signs of sepsis, meningeal signs

### 2. Clinical Reasoning and Differential Diagnosis

**Systematic Diagnostic Approach:**
Based on the presenting symptoms, develop a structured differential diagnosis:

**Most Likely Diagnoses (Top 3):**
1. **Primary Diagnosis:** [Most probable cause based on symptom pattern]
   - **Clinical Evidence:** Supporting symptoms and signs
   - **Prevalence:** Population-based likelihood
   - **Risk Factors:** Patient-specific predisposing factors
   - **Diagnostic Certainty:** High/Moderate/Low confidence level

2. **Secondary Diagnosis:** [Alternative likely explanation]
   - **Distinguishing Features:** Key differentiating characteristics
   - **Additional Testing:** Diagnostic studies to confirm/exclude
   - **Treatment Implications:** Therapeutic approach differences

3. **Tertiary Diagnosis:** [Less likely but important consideration]
   - **Clinical Importance:** Why this diagnosis matters
   - **Risk Assessment:** Consequences if missed
   - **Monitoring Strategy:** Surveillance for development

**Must-Not-Miss Diagnoses:**
- **Life-threatening conditions:** Immediate intervention required
- **Time-sensitive diagnoses:** Delayed treatment worsens outcomes
- **Public health concerns:** Infectious or reportable conditions
- **Medicolegal considerations:** High-liability diagnostic scenarios

### 3. Evidence-Based Treatment Algorithm

${generateTreatmentAlgorithm(presenting_symptoms, severity_assessment)}

### 4. Therapeutic Intervention Framework

**Immediate Management (0-24 hours):**

**Symptom Relief Priorities:**
- **Pain Management:** Analgesic selection based on pain type and severity
- **Functional Restoration:** Interventions to restore basic function
- **Safety Measures:** Fall prevention, infection control, monitoring protocols
- **Comfort Care:** Supportive measures for symptom relief

**Acute Intervention Protocol:**
1. **Assessment and Stabilization:** Vital signs, neurological status, comfort level
2. **Symptom-Specific Treatment:** Targeted interventions for presenting symptoms
3. **Monitoring and Response:** Treatment effectiveness and adverse reaction surveillance
4. **Safety Net Instructions:** When to seek additional medical care

**Short-term Management (1-7 days):**

**Therapeutic Optimization:**
- **Treatment Response Evaluation:** Efficacy assessment and dose optimization
- **Side Effect Management:** Adverse reaction monitoring and mitigation
- **Functional Improvement:** Activity modification and gradual progression
- **Patient Education:** Self-management strategies and warning signs

**Medication Management Protocol:**
- **Prescription Medications:** Evidence-based selection and dosing
- **Over-the-Counter Options:** Safe and effective self-care alternatives
- **Non-Pharmacological Interventions:** Lifestyle modifications and supportive care
- **Combination Therapy:** Synergistic treatment approaches

**Long-term Management (>7 days):**

**Chronic Care Strategy:**
- **Disease Modification:** Interventions to alter disease progression
- **Quality of Life Optimization:** Functional improvement and adaptation strategies
- **Complication Prevention:** Screening and prophylactic measures
- **Regular Monitoring:** Surveillance for treatment response and disease progression

### 5. Israeli Healthcare System Integration

**Available Treatment Options in Israel:**
Based on the Israeli Ministry of Health drug registry and healthcare system:

**First-Line Therapeutic Options:**
- **Health Basket Medications:** Covered therapeutic options with minimal patient cost
- **Over-the-Counter Alternatives:** Self-care options available without prescription
- **Healthcare Provider Services:** Available professional interventions and consultations
- **Community Resources:** Support services and rehabilitation programs

**Healthcare Access Strategy:**
- **Primary Care Pathway:** Family physician consultation and management
- **Specialist Referral Criteria:** When to seek specialized care
- **Emergency Care Indications:** Circumstances requiring urgent medical attention
- **Telemedicine Options:** Remote consultation and monitoring capabilities

**Cost-Effective Treatment Selection:**
- **Health Basket Prioritization:** Preferential use of covered medications
- **Generic Medication Options:** Cost-effective therapeutic equivalents
- **Combination Therapy Benefits:** Optimized multi-modal treatment approaches
- **Resource Utilization Optimization:** Efficient use of healthcare services

### 6. Patient-Centered Care Planning

**Shared Decision-Making Framework:**
Involve patients in treatment decisions through:

**Treatment Option Discussion:**
- **Benefits and Risks:** Clear explanation of therapeutic options
- **Patient Preferences:** Individual values and treatment priorities
- **Lifestyle Considerations:** Impact on daily activities and quality of life
- **Cultural Factors:** Respect for cultural beliefs and practices

**Patient Education Strategy:**
- **Condition Understanding:** Disease process and natural history
- **Treatment Rationale:** Why specific treatments are recommended
- **Self-Management Skills:** Patient empowerment and self-efficacy
- **Warning Signs:** When to seek medical attention

**Adherence Support System:**
- **Medication Management:** Dosing schedules and administration techniques
- **Lifestyle Modifications:** Practical implementation strategies
- **Monitoring Requirements:** Patient self-monitoring capabilities
- **Support Network:** Family and caregiver involvement

### 7. Quality Improvement and Monitoring

**Treatment Effectiveness Monitoring:**
Establish clear metrics for treatment success:

**Primary Outcome Measures:**
- **Symptom Resolution:** Complete or significant improvement
- **Functional Restoration:** Return to baseline activities
- **Quality of Life:** Patient-reported outcome improvements
- **Treatment Satisfaction:** Patient acceptance and adherence

**Secondary Outcome Measures:**
- **Healthcare Utilization:** Reduced need for additional medical care
- **Adverse Events:** Treatment-related complications and side effects
- **Cost-Effectiveness:** Resource utilization and economic impact
- **Long-term Outcomes:** Disease progression and complication prevention

**Continuous Quality Improvement:**
- **Outcome Assessment:** Regular evaluation of treatment effectiveness
- **Process Improvement:** Optimization of care delivery workflows
- **Patient Feedback:** Incorporation of patient experience and preferences
- **Evidence Integration:** Updates based on new clinical evidence

## Clinical Decision Support Tools

### Symptom Severity Assessment Scale

**Mild Severity (Score 1-3):**
- Minimal functional impairment
- Self-care management appropriate
- Routine follow-up sufficient
- Patient education and monitoring

**Moderate Severity (Score 4-6):**
- Moderate functional impairment
- Professional medical evaluation required
- Active treatment intervention needed
- Regular monitoring and follow-up

**Severe Severity (Score 7-10):**
- Significant functional impairment
- Urgent medical evaluation required
- Immediate treatment intervention
- Close monitoring and specialist consideration

### Treatment Selection Matrix

| Symptom Severity | First-Line Treatment | Second-Line Options | Specialist Referral |
|------------------|---------------------|--------------------|--------------------|
| Mild | Self-care + OTC | Prescription if needed | Not typically required |
| Moderate | Prescription therapy | Combination treatment | Consider if no improvement |
| Severe | Immediate intervention | Specialist consultation | Often required |

### Emergency Referral Criteria

**Immediate Emergency Care Required:**
- Life-threatening symptoms or vital sign instability
- Severe pain not responsive to standard interventions
- Neurological deficits or altered mental status
- Signs of severe infection or sepsis
- Respiratory distress or cardiovascular compromise

**Urgent Care Within 24 Hours:**
- Moderate to severe symptoms with functional impairment
- Concerning symptom patterns requiring evaluation
- Failed response to initial treatment interventions
- Patient or caregiver concerns about symptom progression

## Treatment Implementation Checklist

### Pre-Treatment Assessment
- [ ] Comprehensive symptom characterization completed
- [ ] Differential diagnosis considerations reviewed
- [ ] Red flag symptoms assessed and addressed
- [ ] Patient context and preferences considered
- [ ] Resource availability and constraints evaluated

### Treatment Initiation
- [ ] Evidence-based treatment selected
- [ ] Patient education provided
- [ ] Monitoring plan established
- [ ] Follow-up schedule arranged
- [ ] Emergency contact information provided

### Ongoing Management
- [ ] Treatment response monitored
- [ ] Side effects assessed and managed
- [ ] Patient adherence evaluated
- [ ] Functional improvement documented
- [ ] Plan modifications made as needed

### Quality Assurance
- [ ] Outcome measures tracked
- [ ] Patient satisfaction assessed
- [ ] Healthcare utilization monitored
- [ ] Cost-effectiveness evaluated
- [ ] Continuous improvement implemented

## Evidence-Based Treatment Recommendation

### Primary Recommendation
Based on the comprehensive assessment, provide:

**Immediate Action Plan:**
1. **Priority Interventions:** Most important immediate treatments
2. **Symptom Monitoring:** Key indicators to track
3. **Safety Measures:** Important precautions and warnings
4. **Follow-up Schedule:** Timeline for reassessment

**Short-term Strategy (1-2 weeks):**
1. **Treatment Optimization:** Dose adjustments and modifications
2. **Response Assessment:** Effectiveness evaluation
3. **Side Effect Management:** Adverse reaction monitoring
4. **Patient Support:** Education and adherence assistance

**Long-term Management (>2 weeks):**
1. **Maintenance Therapy:** Sustained treatment approach
2. **Prevention Strategies:** Complication and recurrence prevention
3. **Quality of Life:** Functional improvement and adaptation
4. **Regular Surveillance:** Ongoing monitoring and optimization

---

**Clinical Disclaimer:** This treatment pathway is based on current evidence and clinical guidelines. Healthcare providers should use clinical judgment and consider individual patient factors when implementing treatment recommendations. Regular reassessment and modification of treatment plans are essential for optimal patient outcomes.

**Evidence Sources:** Israeli Ministry of Health guidelines, international clinical practice guidelines, systematic reviews, and evidence-based medicine databases.

**Last Updated:** ${new Date().toLocaleDateString('he-IL')}`;

  return prompt;
}

function formatSymptoms(symptoms: string | string[]): string {
  if (Array.isArray(symptoms)) {
    return symptoms.join(", ");
  }
  return symptoms || "Symptoms require specification";
}

function formatPatientContext(context?: any): string {
  if (!context) {
    return "Standard patient evaluation";
  }
  
  const contextElements: string[] = [];
  
  if (context.age) {
    contextElements.push(`Age: ${context.age}`);
  }
  
  if (context.gender) {
    contextElements.push(`Gender: ${context.gender}`);
  }
  
  if (context.medical_history) {
    contextElements.push(`History: ${Array.isArray(context.medical_history) ? context.medical_history.join(", ") : context.medical_history}`);
  }
  
  if (context.current_medications) {
    contextElements.push(`Current meds: ${Array.isArray(context.current_medications) ? context.current_medications.join(", ") : context.current_medications}`);
  }
  
  if (context.social_factors) {
    contextElements.push(`Social: ${context.social_factors}`);
  }
  
  return contextElements.length > 0 ? contextElements.join(" | ") : "Standard patient context";
}

function formatTreatmentGoals(goals?: string | string[]): string {
  if (Array.isArray(goals)) {
    return goals.join(", ");
  }
  return goals || "Symptom relief and functional restoration";
}

function formatResourceConstraints(constraints?: any): string {
  if (!constraints) {
    return "Standard healthcare resources available";
  }
  
  const constraintElements: string[] = [];
  
  if (constraints.budget_limitations) {
    constraintElements.push("Budget-conscious treatment selection");
  }
  
  if (constraints.access_limitations) {
    constraintElements.push(`Access constraints: ${constraints.access_limitations}`);
  }
  
  if (constraints.time_constraints) {
    constraintElements.push(`Time limitations: ${constraints.time_constraints}`);
  }
  
  if (constraints.facility_limitations) {
    constraintElements.push(`Facility constraints: ${constraints.facility_limitations}`);
  }
  
  return constraintElements.length > 0 ? constraintElements.join(" | ") : "No significant resource constraints";
}

function generateTreatmentAlgorithm(symptoms: string | string[], severity?: string): string {
  const symptomsArray = Array.isArray(symptoms) ? symptoms : [symptoms];
  const primarySymptom = symptomsArray[0] || "general symptoms";
  
  let algorithm = `**Clinical Treatment Algorithm:**

\`\`\`
Step 1: Severity Assessment
├─ Mild (1-3/10) → Self-care + monitoring
├─ Moderate (4-6/10) → Medical evaluation + treatment
└─ Severe (7-10/10) → Immediate medical attention

Step 2: Symptom-Specific Pathways
`;

  // Generate symptom-specific pathways
  if (primarySymptom.toLowerCase().includes("pain") || primarySymptom.toLowerCase().includes("כאב")) {
    algorithm += `
Pain Management Pathway:
├─ Assess pain type (acute/chronic, nociceptive/neuropathic)
├─ Non-pharmacological interventions (heat/cold, positioning)
├─ Pharmacological options:
│  ├─ Mild: Paracetamol, topical agents
│  ├─ Moderate: NSAIDs, combination therapy
│  └─ Severe: Prescription analgesics, specialist referral
└─ Monitor response and adjust therapy
`;
  }
  
  if (primarySymptom.toLowerCase().includes("fever") || primarySymptom.toLowerCase().includes("חום")) {
    algorithm += `
Fever Management Pathway:
├─ Assess fever source and severity
├─ Symptomatic treatment:
│  ├─ Antipyretics (paracetamol, ibuprofen)
│  ├─ Fluid replacement and rest
│  └─ Environmental cooling measures
├─ Investigate underlying cause if persistent
└─ Monitor for complications and response
`;
  }
  
  if (primarySymptom.toLowerCase().includes("respiratory") || primarySymptom.toLowerCase().includes("cough") || primarySymptom.toLowerCase().includes("throat")) {
    algorithm += `
Respiratory Symptom Pathway:
├─ Assess respiratory status and oxygenation
├─ Symptomatic management:
│  ├─ Throat: Local anesthetics, anti-inflammatories
│  ├─ Cough: Suppressants vs expectorants based on type
│  └─ Congestion: Decongestants, saline irrigation
├─ Consider underlying etiology (viral, bacterial, allergic)
└─ Monitor progression and response to treatment
`;
  }
  
  algorithm += `
Step 3: Treatment Response Assessment
├─ Immediate (0-24 hours): Symptom relief and safety
├─ Short-term (1-7 days): Functional improvement
└─ Long-term (>7 days): Complete resolution and prevention

Step 4: Escalation Criteria
├─ No improvement in 24-48 hours → Reassess and modify
├─ Worsening symptoms → Consider complications
└─ Side effects or intolerance → Alternative therapy
\`\`\``;

  return algorithm;
}

// ===== TYPE DEFINITIONS =====

interface SymptomToTreatmentWorkflowInput {
  presenting_symptoms: string | string[];
  patient_context?: {
    age?: string;
    gender?: string;
    medical_history?: string | string[];
    current_medications?: string | string[];
    social_factors?: string;
  };
  severity_assessment?: string;
  treatment_goals?: string | string[];
  resource_constraints?: {
    budget_limitations?: boolean;
    access_limitations?: string;
    time_constraints?: string;
    facility_limitations?: string;
  };
}