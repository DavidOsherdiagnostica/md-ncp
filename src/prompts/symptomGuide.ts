/**
 * Symptom to Treatment Guide Prompt Template
 * Provides structured clinical pathway from symptoms to evidence-based treatments
 * Enables AI to guide comprehensive symptom-based therapeutic decision making
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// MCP Prompts can only use string parameters - this is a limitation of the protocol
const symptomGuideArgsSchema = {
  presenting_symptoms: z.string().describe("Comma-separated list of presenting symptoms"),
  patient_age: z.string().optional().describe("Patient age or age group"),
  patient_gender: z.string().optional().describe("Patient gender"),
  medical_history: z.string().optional().describe("Comma-separated list of relevant medical history"),
  current_medications: z.string().optional().describe("Comma-separated list of current medications"),
  severity_assessment: z.string().optional().describe("Symptom severity (mild, moderate, severe)"),
  treatment_goals: z.string().optional().describe("Comma-separated list of treatment goals"),
  resource_constraints: z.string().optional().describe("Any resource or access constraints")
};

type SymptomGuideArgs = {
  presenting_symptoms: string;
  patient_age?: string | undefined;
  patient_gender?: string | undefined;
  medical_history?: string | undefined;
  current_medications?: string | undefined;
  severity_assessment?: string | undefined;
  treatment_goals?: string | undefined;
  resource_constraints?: string | undefined;
};

// ===== PROMPT REGISTRATION =====

export function registerSymptomGuidePrompt(server: McpServer): void {
  server.registerPrompt(
    "symptom_to_treatment_workflow",
    {
      title: "Evidence-Based Symptom Treatment Pathway",
      description: `Comprehensive clinical decision support framework that guides healthcare providers through systematic symptom assessment and evidence-based treatment selection. Essential for standardized clinical care and optimal therapeutic outcomes.

**Usage:**
- presenting_symptoms: List of symptoms to address (required)
- patient_age: Age or age category for population-specific recommendations (optional)
- patient_gender: Gender for gender-specific considerations (optional)
- medical_history: Relevant past medical history (optional)
- current_medications: Current medication regimen (optional)
- severity_assessment: Symptom severity level (optional)
- treatment_goals: Desired treatment outcomes (optional)
- resource_constraints: Budget or access limitations (optional)

**Clinical Workflow Applications:**
- Primary care symptom assessment and management
- Emergency department symptom triage and treatment
- Telemedicine symptom-based consultation
- Patient self-care guidance and education

**Example Usage:**
presenting_symptoms: "headache,nausea,fever"
patient_age: "45"
medical_history: "hypertension,diabetes"
severity_assessment: "moderate"
treatment_goals: "rapid symptom relief,return to work"

This prompt generates structured treatment pathways that integrate clinical evidence, patient preferences, and healthcare system capabilities for optimal symptom-based care delivery.`,
      argsSchema: symptomGuideArgsSchema
    },
    async (args, extra) => {
      try {
        const promptContent = generateSymptomGuidePrompt(args);
        
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
        throw new Error(`Failed to generate symptom guide prompt: ${errorMessage}`);
      }
    }
  );
}

// ===== PROMPT GENERATION =====

function generateSymptomGuidePrompt(input: SymptomGuideArgs): string {
  const {
    presenting_symptoms,
    patient_age,
    patient_gender,
    medical_history,
    current_medications,
    severity_assessment,
    treatment_goals,
    resource_constraints
  } = input;

  // Parse comma-separated lists
  const symptomsList = presenting_symptoms.split(',').map(s => s.trim()).filter(s => s.length > 0);
  const historyList = medical_history ? medical_history.split(',').map(h => h.trim()).filter(h => h.length > 0) : [];
  const medicationsList = current_medications ? current_medications.split(',').map(m => m.trim()).filter(m => m.length > 0) : [];
  const goalsList = treatment_goals ? treatment_goals.split(',').map(g => g.trim()).filter(g => g.length > 0) : [];
  const constraintsList = resource_constraints ? resource_constraints.split(',').map(c => c.trim()).filter(c => c.length > 0) : [];

  if (symptomsList.length === 0) {
    throw new Error('At least one presenting symptom is required');
  }

  let prompt = `# Evidence-Based Symptom to Treatment Clinical Pathway

## Clinical Presentation Overview
**Presenting Symptoms:** ${symptomsList.join(", ")}
**Patient Age:** ${patient_age || "Adult"}
**Patient Gender:** ${patient_gender || "Not specified"}
**Medical History:** ${historyList.length > 0 ? historyList.join(", ") : "None specified"}
**Current Medications:** ${medicationsList.length > 0 ? medicationsList.join(", ") : "None specified"}
**Severity Assessment:** ${severity_assessment || "Standard clinical assessment required"}
**Treatment Goals:** ${goalsList.length > 0 ? goalsList.join(", ") : "Symptom relief and functional restoration"}
**Resource Constraints:** ${constraintsList.length > 0 ? constraintsList.join(", ") : "Standard healthcare resources available"}

## Systematic Clinical Assessment Framework

### 1. Comprehensive Symptom Characterization

**Primary Symptom Analysis:**
${generateSymptomAnalysis(symptomsList)}

**Associated Symptoms and Context:**
- **Constitutional Symptoms:** Fever, fatigue, weight loss, night sweats
- **Functional Impact:** Activities of daily living, work capacity, quality of life
- **Psychological Impact:** Anxiety, depression, sleep disturbance, coping mechanisms
- **Social and Environmental Factors:** Living situation, support systems, occupational exposures

**Red Flag Symptom Assessment:**
${generateRedFlagAssessment(symptomsList)}

### 2. Clinical Reasoning and Differential Diagnosis

**Systematic Diagnostic Approach:**
Based on the presenting symptoms (${symptomsList.join(", ")}), develop a structured differential diagnosis:

**Most Likely Diagnoses (Top 3):**
${generateDifferentialDiagnosis(symptomsList, historyList)}

**Must-Not-Miss Diagnoses:**
- **Life-threatening conditions:** Immediate intervention required
- **Time-sensitive diagnoses:** Delayed treatment worsens outcomes
- **Public health concerns:** Infectious or reportable conditions
- **Medicolegal considerations:** High-liability diagnostic scenarios

### 3. Evidence-Based Treatment Algorithm

${generateTreatmentAlgorithm(symptomsList, severity_assessment)}

### 4. Therapeutic Intervention Framework

**Immediate Management (0-24 hours):**

**Symptom Relief Priorities:**
${generateImmediateManagement(symptomsList, severity_assessment)}

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

${generatePatientCenteredPlan(goalsList, patient_age, patient_gender, historyList)}

### 7. Quality Improvement and Monitoring

**Treatment Effectiveness Monitoring:**
Establish clear metrics for treatment success:

**Primary Outcome Measures:**
- **Symptom Resolution:** Complete or significant improvement in ${symptomsList.join(", ")}
- **Functional Restoration:** Return to baseline activities and quality of life
- **Patient-Reported Outcomes:** Satisfaction and symptom relief scores
- **Treatment Adherence:** Compliance with prescribed interventions

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

${generateSeverityScale(symptomsList, severity_assessment)}

### Treatment Selection Matrix

| Symptom Severity | First-Line Treatment | Second-Line Options | Specialist Referral |
|------------------|---------------------|--------------------|--------------------|
| Mild | Self-care + OTC | Prescription if needed | Not typically required |
| Moderate | Prescription therapy | Combination treatment | Consider if no improvement |
| Severe | Immediate intervention | Specialist consultation | Often required |

### Emergency Referral Criteria

**Immediate Emergency Care Required:**
${generateEmergencyCriteria(symptomsList)}

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
Based on the comprehensive assessment of ${symptomsList.join(", ")}, provide:

**Immediate Action Plan:**
${generateActionPlan(symptomsList, severity_assessment, goalsList)}

**Short-term Strategy (1-2 weeks):**
1. **Treatment Optimization:** Dose adjustments and modifications based on response
2. **Response Assessment:** Effectiveness evaluation using objective measures
3. **Side Effect Management:** Proactive monitoring and mitigation strategies
4. **Patient Support:** Education reinforcement and adherence assistance

**Long-term Management (>2 weeks):**
1. **Maintenance Therapy:** Sustained treatment approach for chronic conditions
2. **Prevention Strategies:** Recurrence prevention and health maintenance
3. **Quality of Life:** Functional improvement and lifestyle optimization
4. **Regular Surveillance:** Ongoing monitoring and treatment optimization

## Israeli Healthcare Context Considerations

### Cultural and Language Factors
- **Multilingual Support:** Hebrew, Arabic, Russian, and English patient materials
- **Cultural Sensitivity:** Religious and cultural considerations in treatment planning
- **Family Involvement:** Appropriate family engagement in care decisions
- **Health Literacy:** Educational materials appropriate for diverse populations

### Healthcare System Navigation
- **Health Fund Coordination:** Interaction with Clalit, Maccabi, Meuhedet, and Leumit
- **Referral Processes:** Streamlined specialist and hospital referral systems
- **Documentation Requirements:** Compliance with Israeli medical record standards
- **Quality Metrics:** Alignment with Israeli healthcare quality indicators

---

**Clinical Disclaimer:** This treatment pathway is based on current evidence and Israeli clinical guidelines. Healthcare providers should use clinical judgment and consider individual patient factors when implementing treatment recommendations. Regular reassessment and modification of treatment plans are essential for optimal patient outcomes within the Israeli healthcare context.

**Evidence Sources:** Israeli Ministry of Health guidelines, international clinical practice guidelines, systematic reviews, and evidence-based medicine databases.

**Last Updated:** ${new Date().toLocaleDateString('he-IL')}

---

## Specific Symptom-Based Analysis

${generateSpecificSymptomAnalysis(symptomsList, patient_age, historyList, severity_assessment)}`;

  return prompt;
}

function generateSymptomAnalysis(symptoms: string[]): string {
  let analysis = "";
  
  symptoms.forEach((symptom, index) => {
    analysis += `**${index + 1}. ${symptom}:**\n`;
    analysis += `- **Onset and Duration:** Acute (<24 hours), subacute (1-7 days), chronic (>7 days)\n`;
    analysis += `- **Severity Grading:** Mild (does not interfere with function), Moderate (interferes with function), Severe (prevents normal activities)\n`;
    analysis += `- **Quality and Character:** Descriptive characteristics and patient-reported qualities\n`;
    analysis += `- **Location and Distribution:** Anatomical location and radiation patterns\n`;
    analysis += `- **Timing and Pattern:** Constant, intermittent, episodic, or progressive patterns\n`;
    analysis += `- **Associated Factors:** Triggering factors, relieving factors, and contextual elements\n\n`;
  });
  
  return analysis;
}

function generateRedFlagAssessment(symptoms: string[]): string {
  let assessment = "Identify symptoms requiring immediate medical attention:\n\n";
  
  const emergencySymptoms = {
    "chest pain": "Potential myocardial infarction, pulmonary embolism, aortic dissection",
    "shortness of breath": "Respiratory failure, pulmonary embolism, acute heart failure",
    "severe headache": "Intracranial hemorrhage, meningitis, temporal arteritis",
    "abdominal pain": "Appendicitis, bowel obstruction, perforation, ectopic pregnancy",
    "fever": "Sepsis, meningitis, severe infection requiring immediate attention",
    "neurological symptoms": "Stroke, seizure, increased intracranial pressure"
  };
  
  symptoms.forEach(symptom => {
    const normalizedSymptom = symptom.toLowerCase();
    for (const [key, value] of Object.entries(emergencySymptoms)) {
      if (normalizedSymptom.includes(key)) {
        assessment += `- **${symptom}:** ${value}\n`;
        break;
      }
    }
  });
  
  assessment += `
**General Red Flags:**
- **Cardiovascular:** Chest pain, severe dyspnea, syncope, severe hypertension
- **Neurological:** Severe headache, focal neurological deficits, altered consciousness
- **Gastrointestinal:** Severe abdominal pain, hematemesis, melena, signs of obstruction
- **Respiratory:** Severe dyspnea, hemoptysis, respiratory distress
- **Infectious:** High fever with rigors, signs of sepsis, meningeal signs
- **Constitutional:** Unexplained weight loss, night sweats, severe fatigue`;
  
  return assessment;
}

function generateDifferentialDiagnosis(symptoms: string[], history: string[]): string {
  let diagnosis = "";
  
  // Primary symptom-based differential
  const primarySymptom = symptoms[0];
  diagnosis += `1. **Primary Diagnosis (Most Likely for ${primarySymptom}):**\n`;
  diagnosis += `   - **Clinical Evidence:** Supporting symptoms and signs\n`;
  diagnosis += `   - **Prevalence:** Population-based likelihood\n`;
  diagnosis += `   - **Risk Factors:** Patient-specific predisposing factors\n`;
  diagnosis += `   - **Diagnostic Certainty:** High/Moderate/Low confidence level\n\n`;
  
  diagnosis += `2. **Secondary Diagnosis (Alternative Explanation):**\n`;
  diagnosis += `   - **Distinguishing Features:** Key differentiating characteristics\n`;
  diagnosis += `   - **Additional Testing:** Diagnostic studies to confirm/exclude\n`;
  diagnosis += `   - **Treatment Implications:** Therapeutic approach differences\n\n`;
  
  diagnosis += `3. **Tertiary Diagnosis (Less Likely but Important):**\n`;
  diagnosis += `   - **Clinical Importance:** Why this diagnosis matters\n`;
  diagnosis += `   - **Risk Assessment:** Consequences if missed\n`;
  diagnosis += `   - **Monitoring Strategy:** Surveillance for development\n\n`;
  
  if (history.length > 0) {
    diagnosis += `**Medical History Considerations:**\n`;
    history.forEach(condition => {
      diagnosis += `- ${condition}: Impact on differential diagnosis and treatment selection\n`;
    });
    diagnosis += `\n`;
  }
  
  return diagnosis;
}

function generateTreatmentAlgorithm(symptoms: string[], severity?: string): string {
  const primarySymptom = symptoms[0] || "symptoms";
  
  let algorithm = `**Clinical Treatment Algorithm for ${symptoms.join(", ")}:**\n\n`;
  
  algorithm += `\`\`\`
Step 1: Severity Assessment
├─ Mild (1-3/10) → Self-care + monitoring
├─ Moderate (4-6/10) → Medical evaluation + treatment
└─ Severe (7-10/10) → Immediate medical attention

Step 2: Symptom-Specific Pathways
`;

  // Generate symptom-specific pathways
  symptoms.forEach(symptom => {
    if (symptom.toLowerCase().includes("pain") || symptom.toLowerCase().includes("כאב")) {
      algorithm += `
Pain Management (${symptom}):
├─ Assess pain type (acute/chronic, nociceptive/neuropathic)
├─ Non-pharmacological interventions (heat/cold, positioning)
├─ Pharmacological options:
│  ├─ Mild: Paracetamol, topical agents
│  ├─ Moderate: NSAIDs, combination therapy
│  └─ Severe: Prescription analgesics, specialist referral
└─ Monitor response and adjust therapy
`;
    }
    
    if (symptom.toLowerCase().includes("fever") || symptom.toLowerCase().includes("חום")) {
      algorithm += `
Fever Management (${symptom}):
├─ Assess fever source and severity
├─ Symptomatic treatment:
│  ├─ Antipyretics (paracetamol, ibuprofen)
│  ├─ Fluid replacement and rest
│  └─ Environmental cooling measures
├─ Investigate underlying cause if persistent
└─ Monitor for complications and response
`;
    }
    
    if (symptom.toLowerCase().includes("nausea") || symptom.toLowerCase().includes("headache") || 
        symptom.toLowerCase().includes("dizziness")) {
      algorithm += `
Symptom-Specific Management (${symptom}):
├─ Assess underlying etiology and triggers
├─ Symptomatic relief measures
├─ Lifestyle and environmental modifications
├─ Pharmacological interventions as appropriate
└─ Monitor response and adjust approach
`;
    }
  });

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

function generateImmediateManagement(symptoms: string[], severity?: string): string {
  let management = "";
  
  symptoms.forEach(symptom => {
    management += `**${symptom} Immediate Management:**\n`;
    
    if (symptom.toLowerCase().includes("pain")) {
      management += `- Rapid pain assessment using validated scales
- Immediate comfort measures and positioning
- Analgesic selection based on pain type and severity
- Safety considerations and contraindication screening
- Monitoring for treatment response and adverse effects\n\n`;
    } else if (symptom.toLowerCase().includes("fever")) {
      management += `- Temperature monitoring and documentation
- Symptomatic relief with antipyretics as appropriate
- Hydration assessment and fluid replacement
- Source identification and culture collection if indicated
- Monitoring for signs of serious infection\n\n`;
    } else if (symptom.toLowerCase().includes("nausea")) {
      management += `- Assessment of dehydration and electrolyte status
- Antiemetic therapy selection based on underlying cause
- Dietary modifications and fluid replacement
- Monitoring for complications and effectiveness
- Identification and treatment of underlying conditions\n\n`;
    } else {
      management += `- Comprehensive symptom assessment and characterization
- Immediate comfort and supportive measures
- Targeted interventions based on symptom severity
- Safety monitoring and adverse effect assessment
- Response evaluation and therapy optimization\n\n`;
    }
  });
  
  return management;
}

function generatePatientCenteredPlan(goals: string[], age?: string, gender?: string, history?: string[]): string {
  let plan = `**Shared Decision-Making Framework:**\nInvolve patients in treatment decisions through:\n\n`;
  
  plan += `**Treatment Option Discussion:**\n`;
  plan += `- **Benefits and Risks:** Clear explanation of therapeutic options\n`;
  plan += `- **Patient Preferences:** Individual values and treatment priorities\n`;
  plan += `- **Lifestyle Considerations:** Impact on daily activities and quality of life\n`;
  plan += `- **Cultural Factors:** Respect for cultural beliefs and practices\n\n`;
  
  if (goals.length > 0) {
    plan += `**Patient-Specific Treatment Goals:**\n`;
    goals.forEach(goal => {
      plan += `- ${goal}: Strategies and interventions to achieve this outcome\n`;
    });
    plan += `\n`;
  }
  
  plan += `**Patient Education Strategy:**\n`;
  plan += `- **Condition Understanding:** Disease process and natural history\n`;
  plan += `- **Treatment Rationale:** Why specific treatments are recommended\n`;
  plan += `- **Self-Management Skills:** Patient empowerment and self-efficacy\n`;
  plan += `- **Warning Signs:** When to seek medical attention\n\n`;
  
  if (age || gender || (history && history.length > 0)) {
    plan += `**Individualized Considerations:**\n`;
    
    if (age) {
      plan += `- **Age-Specific Factors:** Treatment modifications for ${age}-year-old patient\n`;
    }
    
    if (gender) {
      plan += `- **Gender Considerations:** ${gender}-specific treatment aspects\n`;
    }
    
    if (history && history.length > 0) {
      plan += `- **Medical History Integration:** Considerations for ${history.join(", ")}\n`;
    }
    plan += `\n`;
  }
  
  plan += `**Adherence Support System:**\n`;
  plan += `- **Medication Management:** Dosing schedules and administration techniques\n`;
  plan += `- **Lifestyle Modifications:** Practical implementation strategies\n`;
  plan += `- **Monitoring Requirements:** Patient self-monitoring capabilities\n`;
  plan += `- **Support Network:** Family and caregiver involvement\n`;
  
  return plan;
}

function generateSeverityScale(symptoms: string[], severity?: string): string {
  let scale = "";
  
  if (severity) {
    scale += `**Current Assessment: ${severity}**\n\n`;
  }
  
  scale += `**Symptom Severity Classification:**\n\n`;
  scale += `**Mild Severity (Score 1-3):**\n`;
  scale += `- Minimal functional impairment for ${symptoms.join(", ")}\n`;
  scale += `- Self-care management appropriate\n`;
  scale += `- Routine follow-up sufficient\n`;
  scale += `- Patient education and monitoring\n\n`;
  
  scale += `**Moderate Severity (Score 4-6):**\n`;
  scale += `- Moderate functional impairment with ${symptoms.join(", ")}\n`;
  scale += `- Professional medical evaluation required\n`;
  scale += `- Active treatment intervention needed\n`;
  scale += `- Regular monitoring and follow-up\n\n`;
  
  scale += `**Severe Severity (Score 7-10):**\n`;
  scale += `- Significant functional impairment from ${symptoms.join(", ")}\n`;
  scale += `- Urgent medical evaluation required\n`;
  scale += `- Immediate treatment intervention\n`;
  scale += `- Close monitoring and specialist consideration\n`;
  
  return scale;
}

function generateEmergencyCriteria(symptoms: string[]): string {
  let criteria = "";
  
  symptoms.forEach(symptom => {
    if (symptom.toLowerCase().includes("chest pain")) {
      criteria += `- Severe chest pain with radiation, diaphoresis, or hemodynamic instability\n`;
    } else if (symptom.toLowerCase().includes("headache")) {
      criteria += `- Sudden severe headache ("thunderclap"), neurological deficits, or altered consciousness\n`;
    } else if (symptom.toLowerCase().includes("abdominal pain")) {
      criteria += `- Severe abdominal pain with peritoneal signs, hemodynamic instability, or gastrointestinal bleeding\n`;
    } else if (symptom.toLowerCase().includes("fever")) {
      criteria += `- High fever (>39°C) with altered mental status, severe rigors, or signs of sepsis\n`;
    } else if (symptom.toLowerCase().includes("shortness of breath")) {
      criteria += `- Severe respiratory distress, oxygen desaturation, or signs of respiratory failure\n`;
    }
  });
  
  criteria += `
**General Emergency Indicators:**
- Life-threatening symptoms or vital sign instability
- Severe symptoms not responsive to standard interventions
- Neurological deficits or altered mental status
- Signs of severe infection or sepsis
- Respiratory distress or cardiovascular compromise
- Severe pain with systemic signs of serious pathology`;
  
  return criteria;
}

function generateActionPlan(symptoms: string[], severity?: string, goals?: string[]): string {
  let plan = `1. **Priority Interventions for ${symptoms.join(", ")}:**\n`;
  
  symptoms.forEach(symptom => {
    plan += `   - ${symptom}: Evidence-based immediate treatment approach\n`;
  });
  
  plan += `\n2. **Symptom Monitoring:** Key indicators to track\n`;
  plan += `   - Objective measures of symptom improvement\n`;
  plan += `   - Functional status and quality of life indicators\n`;
  plan += `   - Treatment response and adherence monitoring\n\n`;
  
  plan += `3. **Safety Measures:** Important precautions and warnings\n`;
  plan += `   - Red flag symptoms requiring immediate attention\n`;
  plan += `   - Medication safety and interaction precautions\n`;
  plan += `   - Activity modifications and lifestyle considerations\n\n`;
  
  plan += `4. **Follow-up Schedule:** Timeline for reassessment\n`;
  if (severity === "severe") {
    plan += `   - Immediate: 24-48 hours\n   - Short-term: 3-7 days\n   - Follow-up: 1-2 weeks\n`;
  } else if (severity === "moderate") {
    plan += `   - Short-term: 3-5 days\n   - Follow-up: 1-2 weeks\n   - Long-term: 1 month\n`;
  } else {
    plan += `   - Follow-up: 1-2 weeks\n   - Long-term: 1 month\n   - As needed: Patient-initiated contact\n`;
  }
  
  if (goals && goals.length > 0) {
    plan += `\n5. **Goal-Oriented Interventions:**\n`;
    goals.forEach(goal => {
      plan += `   - ${goal}: Specific strategies and timeline for achievement\n`;
    });
  }
  
  return plan;
}

function generateSpecificSymptomAnalysis(symptoms: string[], age?: string, history?: string[], severity?: string): string {
  let analysis = `### Detailed Symptom-Specific Analysis\n\n`;
  
  symptoms.forEach((symptom, index) => {
    analysis += `#### ${index + 1}. ${symptom} - Comprehensive Assessment\n\n`;
    
    analysis += `**Clinical Characteristics:**\n`;
    analysis += `- **Pathophysiology:** Underlying mechanisms and disease processes\n`;
    analysis += `- **Epidemiology:** Prevalence and population-specific considerations\n`;
    analysis += `- **Natural History:** Typical course and prognosis\n`;
    analysis += `- **Complications:** Potential adverse outcomes if untreated\n\n`;
    
    analysis += `**Diagnostic Considerations:**\n`;
    analysis += `- **Physical Examination:** Key findings and assessment techniques\n`;
    analysis += `- **Laboratory Studies:** Indicated tests and interpretation\n`;
    analysis += `- **Imaging:** Appropriate modalities and indications\n`;
    analysis += `- **Differential Diagnosis:** Alternative explanations to consider\n\n`;
    
    analysis += `**Treatment Approaches:**\n`;
    analysis += `- **First-Line Therapy:** Evidence-based initial interventions\n`;
    analysis += `- **Second-Line Options:** Alternative treatments if first-line fails\n`;
    analysis += `- **Non-Pharmacological:** Lifestyle, dietary, and behavioral interventions\n`;
    analysis += `- **Combination Therapy:** Synergistic treatment approaches\n\n`;
    
    if (age) {
      analysis += `**Age-Specific Considerations (${age}):**\n`;
      analysis += `- **Treatment Modifications:** Age-appropriate interventions\n`;
      analysis += `- **Safety Considerations:** Age-related precautions\n`;
      analysis += `- **Dosing Adjustments:** Age-specific medication dosing\n`;
      analysis += `- **Monitoring Requirements:** Age-appropriate surveillance\n\n`;
    }
    
    if (history && history.length > 0) {
      analysis += `**Medical History Integration:**\n`;
      history.forEach(condition => {
        analysis += `- **${condition}:** Impact on ${symptom} management and treatment selection\n`;
      });
      analysis += `\n`;
    }
    
    if (severity) {
      analysis += `**Severity-Specific Management (${severity}):**\n`;
      if (severity.toLowerCase() === "severe") {
        analysis += `- **Immediate Intervention:** Urgent treatment protocols\n`;
        analysis += `- **Close Monitoring:** Intensive surveillance requirements\n`;
        analysis += `- **Specialist Consultation:** Early involvement of specialists\n`;
        analysis += `- **Hospital Consideration:** Inpatient vs outpatient management\n\n`;
      } else if (severity.toLowerCase() === "moderate") {
        analysis += `- **Active Treatment:** Prompt therapeutic intervention\n`;
        analysis += `- **Regular Monitoring:** Structured follow-up protocols\n`;
        analysis += `- **Response Assessment:** Objective improvement measures\n`;
        analysis += `- **Escalation Planning:** Criteria for treatment intensification\n\n`;
      } else {
        analysis += `- **Conservative Management:** Watchful waiting with support\n`;
        analysis += `- **Self-Care Emphasis:** Patient education and empowerment\n`;
        analysis += `- **Monitoring Guidance:** When to seek medical attention\n`;
        analysis += `- **Prevention Focus:** Risk factor modification\n\n`;
      }
    }
    
    analysis += `**Israeli Healthcare Context for ${symptom}:**\n`;
    analysis += `- **Health Basket Coverage:** Available covered treatments\n`;
    analysis += `- **Specialist Access:** Referral pathways and waiting times\n`;
    analysis += `- **Community Resources:** Local support and services\n`;
    analysis += `- **Cultural Considerations:** Population-specific factors\n\n`;
  });
  
  analysis += `### Integrated Treatment Strategy\n\n`;
  analysis += `**Multi-Symptom Management:**\n`;
  analysis += `- **Prioritization:** Address most severe or concerning symptoms first\n`;
  analysis += `- **Synergistic Treatments:** Interventions that address multiple symptoms\n`;
  analysis += `- **Drug Interactions:** Avoiding problematic combinations\n`;
  analysis += `- **Patient Burden:** Minimizing treatment complexity and side effects\n\n`;
  
  analysis += `**Monitoring and Follow-up:**\n`;
  analysis += `- **Objective Measures:** Quantifiable improvement indicators\n`;
  analysis += `- **Patient-Reported Outcomes:** Subjective symptom assessments\n`;
  analysis += `- **Functional Status:** Impact on daily activities and quality of life\n`;
  analysis += `- **Treatment Adherence:** Compliance monitoring and support\n\n`;
  
  analysis += `**Quality Assurance:**\n`;
  analysis += `- **Evidence-Based Practice:** Adherence to clinical guidelines\n`;
  analysis += `- **Outcome Tracking:** Documentation of treatment effectiveness\n`;
  analysis += `- **Patient Satisfaction:** Experience and preference assessment\n`;
  analysis += `- **Continuous Improvement:** Protocol refinement based on outcomes\n`;
  
  return analysis;
}