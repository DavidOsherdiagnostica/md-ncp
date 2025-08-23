/**
 * Drug Comparison Prompt Template
 * Provides structured framework for comparing multiple medications
 * Enables AI to perform comprehensive therapeutic comparisons
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// MCP Prompts can only use string parameters - this is a limitation of the protocol
const drugComparisonArgsSchema = {
  drug_list: z.string().describe("Comma-separated list of medications to compare (e.g., 'Paracetamol,Ibuprofen,Aspirin')"),
  clinical_context: z.string().optional().describe("Clinical context or indication (e.g., 'pain management', 'cardiovascular protection')"),
  target_population: z.string().optional().describe("Target patient population (e.g., 'elderly patients', 'pediatric population')"),
  comparison_focus: z.string().optional().describe("Primary focus of comparison (e.g., 'safety', 'efficacy', 'cost-effectiveness')"),
  decision_framework: z.string().optional().describe("Decision-making framework to use (e.g., 'evidence-based', 'cost-conscious')")
};

type DrugComparisonArgs = {
  drug_list: string;
  clinical_context?: string | undefined;
  target_population?: string | undefined;
  comparison_focus?: string | undefined;
  decision_framework?: string | undefined;
};

// ===== PROMPT REGISTRATION =====

export function registerDrugComparisonPrompt(server: McpServer): void {
  server.registerPrompt(
    "compare_therapeutic_options",
    {
      title: "Comprehensive Drug Comparison Analysis",
      description: `Advanced pharmaceutical comparison framework that enables systematic evaluation of multiple medications across clinical, economic, and safety dimensions. Essential for evidence-based therapeutic decision-making and formulary management.

**Usage:**
- drug_list: Comma-separated list of medications (required)
- clinical_context: Clinical indication or context (optional)
- target_population: Specific patient population (optional)
- comparison_focus: Primary comparison criteria (optional)
- decision_framework: Decision-making approach (optional)

**Clinical Applications:**
- Therapeutic alternative evaluation for formulary decisions
- Cost-effectiveness analysis for health system optimization
- Safety profile comparison for high-risk populations
- Generic vs brand medication assessment
- Treatment pathway optimization

**Example Usage:**
drug_list: "Paracetamol,Ibuprofen,Diclofenac"
clinical_context: "Acute pain management"
target_population: "Elderly patients with comorbidities"
comparison_focus: "Safety and efficacy"

This prompt generates comprehensive comparison reports that integrate clinical evidence, economic analysis, and practical implementation considerations for optimal therapeutic decision-making.`,
      argsSchema: drugComparisonArgsSchema
    },
    async (args, extra) => {
      try {
        const promptContent = generateDrugComparisonPrompt(args);
        
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
        throw new Error(`Failed to generate comparison prompt: ${errorMessage}`);
      }
    }
  );
}

// ===== PROMPT GENERATION =====

function generateDrugComparisonPrompt(input: DrugComparisonArgs): string {
  const {
    drug_list,
    clinical_context,
    target_population,
    comparison_focus,
    decision_framework
  } = input;

  // Parse comma-separated drug list
  const drugArray = drug_list.split(',').map(drug => drug.trim()).filter(drug => drug.length > 0);
  
  if (drugArray.length < 2) {
    throw new Error('At least 2 medications are required for comparison');
  }

  let prompt = `# Comprehensive Therapeutic Options Comparison

## Comparison Overview
**Medications Under Review:** ${drugArray.join(", ")}
**Clinical Context:** ${clinical_context || "General therapeutic evaluation"}
**Target Population:** ${target_population || "Adult population"}
**Comparison Focus:** ${comparison_focus || "Comprehensive clinical comparison"}
**Decision Framework:** ${decision_framework || "Evidence-based clinical decision-making"}

## Analysis Framework

### 1. Clinical Efficacy Assessment
For each medication (${drugArray.join(", ")}), provide:

**Therapeutic Profile:**
- Primary mechanism of action and pharmacological class
- Clinical indications and approved uses in Israel
- Evidence quality from clinical trials (Phase I-IV data)
- Therapeutic equivalence classification
- Onset of action and duration of effect

**Effectiveness Metrics:**
- Primary endpoint achievement rates
- Number needed to treat (NNT) when available
- Real-world effectiveness studies
- Comparative effectiveness research findings
- Patient-reported outcome measures

**Clinical Evidence Quality:**
- Israeli Ministry of Health approval status
- Clinical trial methodology and population studied
- Post-marketing surveillance data
- Systematic review and meta-analysis findings
- Professional guideline recommendations and evidence grades

### 2. Safety and Tolerability Analysis

**Adverse Event Profiles:**
- Common adverse reactions (>1% incidence)
- Serious adverse events and safety warnings
- Contraindications and precautions
- Drug interaction potential and clinical significance
- Special population considerations (pediatric, geriatric, pregnancy)

**Safety Monitoring Requirements:**
- Laboratory monitoring needs and frequency
- Clinical surveillance parameters
- Risk evaluation and mitigation strategies
- Healthcare provider training requirements
- Patient education and monitoring responsibilities

**Risk-Benefit Assessment:**
- Therapeutic margin and safety profile
- Risk factors for adverse outcomes
- Benefit-risk ratio in different populations
- Long-term safety considerations
- Emergency management protocols

### 3. Economic Impact Evaluation (Israeli Healthcare System)

**Direct Medical Costs:**
- Medication acquisition costs in Israel (NIS)
- Health basket coverage status and patient copayment
- Administration and monitoring costs
- Healthcare utilization impact
- Adverse event management costs

**Health System Integration:**
- Israeli health basket inclusion and coverage levels
- Prior authorization requirements (if any)
- Pharmacy availability across Israel
- Generic alternatives availability
- Budget impact for Israeli healthcare system

**Cost-Effectiveness Analysis:**
- Cost per treatment success
- Comparative cost analysis within therapeutic class
- Budget impact projections for Israeli health funds
- Value-based care alignment
- Economic burden of disease management

### 4. Patient Experience and Accessibility

**Administration and Compliance:**
- Dosing frequency and complexity
- Route of administration preferences
- Storage and handling requirements
- Patient education needs
- Adherence support programs

**Quality of Life Impact:**
- Functional improvement measures
- Symptom relief and duration
- Daily living impact assessment
- Patient preference studies
- Caregiver burden considerations

**Access and Equity in Israel:**
- Geographic availability across Israeli regions
- Availability in different healthcare settings (community pharmacies, hospitals)
- Language barriers and multilingual support
- Special needs population accommodation
- Healthcare disparities impact

### 5. Implementation Considerations

**Israeli Healthcare System Readiness:**
- Provider training and competency requirements
- Integration with Israeli electronic health records
- Workflow integration considerations
- Quality assurance protocols
- Performance monitoring systems

**Regulatory and Policy Alignment:**
- Israeli Ministry of Health approval status
- Alignment with Israeli clinical guidelines
- Health technology assessment recommendations
- Integration with health fund formularies
- Policy implementation timelines

## Decision Matrix Framework

### Weighted Scoring Methodology
Create a comprehensive comparison table:

| Criteria | Weight | ${drugArray.map(drug => `${drug} Score`).join(" | ")} | ${drugArray.map(drug => `${drug} Weighted`).join(" | ")} |
|----------|--------|${drugArray.map(() => "----------").join("|")}|${drugArray.map(() => "-----------").join("|")}|
| Clinical Efficacy | 30% | | |
| Safety Profile | 25% | | |
| Economic Impact | 20% | | |
| Patient Experience | 15% | | |
| Implementation | 10% | | |
| **Total Score** | **100%** | | |

### Scoring Criteria:
- **5 - Excellent:** Best-in-class performance, gold standard
- **4 - Good:** Above average performance, acceptable choice
- **3 - Adequate:** Meets minimum standards, reasonable option
- **2 - Below Average:** Significant limitations, use with caution
- **1 - Poor:** Major concerns, generally not recommended

## Therapeutic Recommendation Framework

### Primary Recommendation
Based on the comprehensive analysis, provide:

1. **First-line therapy recommendation** with clinical rationale
   - Preferred medication with supporting evidence
   - Dosing recommendations and administration guidance
   - Monitoring requirements and follow-up schedule

2. **Alternative options** for different patient scenarios
   - Second-line choices and specific indications
   - Patient-specific considerations (age, comorbidities, preferences)
   - Switching strategies if first-line fails

3. **Contraindicated combinations** and safety considerations
   - Absolute and relative contraindications
   - Drug-drug interactions to avoid
   - Patient populations requiring special caution

4. **Monitoring requirements** for each recommended option
   - Baseline assessments before treatment initiation
   - Ongoing monitoring parameters and frequency
   - Safety signals requiring immediate attention

### Special Population Considerations in Israel

**Pediatric Population:**
- Age-specific dosing and safety considerations
- Availability of pediatric formulations in Israel
- Pediatric specialist consultation requirements
- Family education and caregiver training needs

**Geriatric Population:**
- Age-related dose adjustments and monitoring
- Polypharmacy considerations in elderly patients
- Falls risk assessment and prevention
- Cognitive function impact evaluation

**Pregnancy and Lactation:**
- Israeli pregnancy safety categories
- Teratogenic risk assessment
- Alternative therapies for pregnant patients
- Breastfeeding compatibility and safety

**Patients with Comorbidities:**
- Renal impairment considerations and dose adjustments
- Hepatic dysfunction impact on drug metabolism
- Cardiovascular disease interactions
- Diabetes and metabolic considerations

## Israeli Healthcare Implementation Strategy

### Phase 1: Preparation (0-3 months)
1. **Stakeholder Engagement:**
   - Health fund formulary committees
   - Primary care physician education
   - Specialist society endorsements
   - Patient advocacy group consultation

2. **System Preparation:**
   - Electronic prescribing system updates
   - Pharmacy inventory and distribution planning
   - Healthcare provider training program development
   - Patient education material creation (Hebrew/Arabic/Russian)

### Phase 2: Pilot Implementation (3-6 months)
1. **Limited Rollout:**
   - Selected healthcare facilities and providers
   - Targeted patient populations
   - Intensive monitoring and feedback collection
   - Rapid cycle improvement implementation

2. **Performance Monitoring:**
   - Clinical effectiveness tracking
   - Safety signal detection
   - Economic impact assessment
   - Provider and patient satisfaction surveys

### Phase 3: Full Implementation (6+ months)
1. **System-wide Deployment:**
   - All relevant healthcare providers and facilities
   - Complete integration with health fund systems
   - Ongoing quality assurance and monitoring
   - Continuous improvement based on real-world evidence

2. **Long-term Optimization:**
   - Outcome evaluation and policy refinement
   - Cost-effectiveness analysis and budget impact
   - International evidence integration
   - Future research priorities identification

## Quality Assurance and Monitoring

### Clinical Monitoring Framework
- **Effectiveness Indicators:** Response rates, time to symptom relief, functional improvement
- **Safety Surveillance:** Adverse event reporting, serious adverse event tracking
- **Quality Metrics:** Prescribing appropriateness, adherence rates, patient satisfaction
- **Comparative Effectiveness:** Real-world evidence generation and analysis

### Economic Monitoring System
- **Budget Impact:** Health fund expenditure tracking and forecasting
- **Cost-effectiveness:** Real-world cost per outcome analysis
- **Value Demonstration:** Patient-reported outcomes and quality of life measures
- **Resource Optimization:** Healthcare utilization efficiency assessment

## Evidence-Based Conclusion

### Summary Recommendations

**Preferred Therapeutic Option:**
- **Primary choice:** [Based on analysis] with strength of recommendation level
- **Clinical rationale:** Evidence-based justification for selection
- **Implementation considerations:** Practical aspects for Israeli healthcare system

**Alternative Therapeutic Options:**
- **Second-line choice:** With specific indications and patient populations
- **Third-line alternatives:** For special circumstances or contraindications
- **Rescue therapy:** For treatment failures or emergent situations

**Key Safety Considerations:**
- **Most important safety signals** requiring attention
- **Monitoring requirements** and frequency recommendations
- **Emergency management protocols** for serious adverse events
- **Patient education priorities** for safe medication use

**Economic Impact Assessment:**
- **Budget implications** for Israeli healthcare system
- **Cost-effectiveness** compared to current standard of care
- **Patient out-of-pocket costs** and financial accessibility
- **Long-term economic benefits** from improved outcomes

### Implementation Timeline and Resource Requirements

**Immediate Actions (Month 1):**
- Regulatory approval verification and documentation
- Health fund formulary submission and review
- Provider education program development
- Patient information materials creation

**Short-term Goals (Months 2-6):**
- Pilot program implementation in selected facilities
- Healthcare provider training and certification
- Electronic systems integration and testing
- Initial outcome and safety monitoring

**Long-term Objectives (6+ months):**
- Full-scale implementation across Israeli healthcare system
- Comprehensive outcome evaluation and evidence generation
- Policy optimization based on real-world experience
- International collaboration and evidence sharing

---

**Clinical Disclaimer:** This comparison is based on available evidence at the time of analysis and Israeli regulatory status. Healthcare providers should consult current Israeli prescribing information, Ministry of Health guidelines, and consider individual patient factors when making therapeutic decisions. Regular monitoring and reassessment are essential for optimal patient outcomes within the Israeli healthcare context.

**Data Sources:** Israeli Ministry of Health Drug Registry, Israeli clinical guidelines, international peer-reviewed literature, health technology assessment reports, and Israeli health fund formulary data.

**Language Note:** This analysis is provided in English. Hebrew and Arabic translations should be made available for Israeli healthcare providers and patients as appropriate.

**Last Updated:** ${new Date().toLocaleDateString('he-IL')} (Israel time)

---

## Specific Analysis for Requested Medications

${generateSpecificAnalysis(drugArray, clinical_context, target_population, comparison_focus)}`;

  return prompt;
}

function generateSpecificAnalysis(drugs: string[], context?: string, population?: string, focus?: string): string {
  let analysis = `### Medication-Specific Analysis\n\n`;
  
  drugs.forEach((drug, index) => {
    analysis += `#### ${index + 1}. ${drug}\n\n`;
    analysis += `**Clinical Profile:**\n`;
    analysis += `- Therapeutic class and mechanism of action\n`;
    analysis += `- Primary indications in Israeli clinical practice\n`;
    analysis += `- Dosage forms available in Israel\n`;
    analysis += `- Health basket coverage status\n`;
    analysis += `- Typical dosing regimens\n\n`;
    
    analysis += `**Safety Considerations:**\n`;
    analysis += `- Common adverse effects (>1% incidence)\n`;
    analysis += `- Serious adverse effects requiring monitoring\n`;
    analysis += `- Contraindications and precautions\n`;
    analysis += `- Drug interactions of clinical significance\n`;
    analysis += `- Special population considerations\n\n`;
    
    analysis += `**Economic Factors:**\n`;
    analysis += `- Average cost in Israel (if available)\n`;
    analysis += `- Health basket coverage level\n`;
    analysis += `- Generic alternatives availability\n`;
    analysis += `- Cost-effectiveness compared to alternatives\n\n`;
    
    if (context) {
      analysis += `**Specific Considerations for ${context}:**\n`;
      analysis += `- Relevance to clinical indication\n`;
      analysis += `- Evidence quality for this indication\n`;
      analysis += `- Israeli guidelines recommendations\n\n`;
    }
    
    if (population) {
      analysis += `**Suitability for ${population}:**\n`;
      analysis += `- Population-specific efficacy data\n`;
      analysis += `- Safety profile in this population\n`;
      analysis += `- Dosing modifications required\n`;
      analysis += `- Monitoring requirements\n\n`;
    }
  });
  
  if (focus) {
    analysis += `### Primary Focus: ${focus}\n\n`;
    analysis += `Based on the requested focus on "${focus}", provide detailed analysis of:\n\n`;
    
    if (focus.toLowerCase().includes('safety')) {
      analysis += `- Comparative safety profiles across all medications\n`;
      analysis += `- Risk stratification by patient factors\n`;
      analysis += `- Safety monitoring protocols\n`;
      analysis += `- Adverse event management strategies\n`;
    } else if (focus.toLowerCase().includes('efficacy')) {
      analysis += `- Head-to-head efficacy comparisons\n`;
      analysis += `- Clinical trial evidence quality\n`;
      analysis += `- Real-world effectiveness data\n`;
      analysis += `- Response rate comparisons\n`;
    } else if (focus.toLowerCase().includes('cost')) {
      analysis += `- Detailed cost analysis for Israeli system\n`;
      analysis += `- Budget impact projections\n`;
      analysis += `- Cost-effectiveness ratios\n`;
      analysis += `- Value-based care considerations\n`;
    } else {
      analysis += `- Detailed analysis focused on: ${focus}\n`;
      analysis += `- Comparative evaluation across medications\n`;
      analysis += `- Clinical decision support for this focus area\n`;
      analysis += `- Implementation recommendations\n`;
    }
  }
  
  return analysis;
}