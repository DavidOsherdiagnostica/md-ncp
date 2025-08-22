/**
 * Drug Comparison Prompt Template
 * Provides structured framework for comparing multiple medications
 * Enables AI to perform comprehensive therapeutic comparisons
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CompareTherapeuticOptionsSchema, CompareTherapeuticOptionsInput } from "../types/mcp.js";
import { getApiClient } from "../services/israelDrugsApi.js";
import { validateToolInput } from "../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../utils/errorHandler.js";

// ===== PROMPT REGISTRATION =====

export function registerDrugComparisonPrompt(server: McpServer): void {
  server.registerPrompt(
    "compare_therapeutic_options",
    {
      title: "Comprehensive Drug Comparison Analysis",
      description: `Advanced pharmaceutical comparison framework that enables systematic evaluation of multiple medications across clinical, economic, and safety dimensions. Essential for evidence-based therapeutic decision-making and formulary management.

**Clinical Applications:**
- Therapeutic alternative evaluation for formulary decisions
- Cost-effectiveness analysis for health system optimization
- Safety profile comparison for high-risk populations
- Generic vs brand medication assessment
- Treatment pathway optimization

**Comparison Dimensions:**
- Clinical efficacy and therapeutic equivalence
- Safety profiles and contraindication analysis
- Economic impact and cost-effectiveness
- Patient acceptability and compliance factors
- Health system integration considerations

**Evidence-Based Framework:**
- Regulatory approval status and clinical trial data
- Real-world effectiveness and safety surveillance
- Health technology assessment outcomes
- Professional guideline recommendations
- Patient-reported outcome measures

**Stakeholder Perspectives:**
- Healthcare provider clinical decision support
- Health system formulary and procurement guidance
- Patient education and shared decision-making
- Regulatory compliance and safety monitoring

This prompt generates comprehensive comparison reports that integrate clinical evidence, economic analysis, and practical implementation considerations for optimal therapeutic decision-making.`,
      inputSchema: CompareTherapeuticOptionsSchema
    },
    async (input: CompareTherapeuticOptionsInput) => {
      try {
        // Validate input parameters
        const { data: validatedInput } = validateToolInput(
          CompareTherapeuticOptionsSchema,
          input,
          "compare_therapeutic_options"
        );

        // Generate comprehensive comparison prompt
        return generateDrugComparisonPrompt(validatedInput);

      } catch (error) {
        const classifiedError = classifyError(error, "compare_therapeutic_options");
        return createComprehensiveErrorResponse(classifiedError, undefined, {
          promptName: "compare_therapeutic_options",
          userInput: input
        });
      }
    }
  );
}

// ===== PROMPT GENERATION =====

function generateDrugComparisonPrompt(input: CompareTherapeuticOptionsInput): string {
  const {
    drug_list,
    comparison_criteria,
    clinical_context,
    target_population,
    decision_framework
  } = input;

  let prompt = `# Comprehensive Therapeutic Options Comparison

## Comparison Overview
**Medications Under Review:** ${drug_list.join(", ")}
**Clinical Context:** ${clinical_context || "General therapeutic evaluation"}
**Target Population:** ${target_population || "Adult population"}
**Decision Framework:** ${decision_framework || "Evidence-based clinical decision-making"}

## Analysis Framework

### 1. Clinical Efficacy Assessment
For each medication (${drug_list.join(", ")}), provide:

**Therapeutic Profile:**
- Primary mechanism of action and pharmacological class
- Clinical indications and approved uses
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
- Regulatory approval pathway and timeline
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
- Risk evaluation and mitigation strategies (REMS)
- Healthcare provider training requirements
- Patient education and monitoring responsibilities

**Risk-Benefit Assessment:**
- Therapeutic margin and safety profile
- Risk factors for adverse outcomes
- Benefit-risk ratio in different populations
- Long-term safety considerations
- Emergency management protocols

### 3. Economic Impact Evaluation

**Direct Medical Costs:**
- Medication acquisition costs (wholesale and retail)
- Administration and monitoring costs
- Healthcare utilization impact
- Adverse event management costs
- Total cost of therapy analysis

**Health System Integration:**
- Formulary status and access restrictions
- Prior authorization requirements
- Step therapy protocols
- Health basket inclusion and coverage levels
- Budget impact modeling

**Cost-Effectiveness Analysis:**
- Cost per quality-adjusted life year (QALY)
- Incremental cost-effectiveness ratios
- Budget impact projections
- Health technology assessment outcomes
- Value-based care alignment

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

**Access and Equity:**
- Geographic availability across Israel
- Socioeconomic accessibility factors
- Language and cultural considerations
- Special needs population accommodation
- Healthcare disparities impact

### 5. Implementation Considerations

**Healthcare System Readiness:**
- Provider training and competency requirements
- Infrastructure and equipment needs
- Workflow integration considerations
- Quality assurance protocols
- Performance monitoring systems

**Regulatory and Policy Alignment:**
- Ministry of Health approval status
- Clinical guideline concordance
- Health technology assessment recommendations
- International regulatory harmonization
- Policy implementation timelines

## Comparison Criteria Analysis

${generateComparisonCriteriaSection(comparison_criteria)}

## Decision Matrix Framework

### Weighted Scoring Methodology
Create a comprehensive comparison table with the following structure:

| Criteria | Weight | ${drug_list.map(drug => `${drug} Score`).join(" | ")} | ${drug_list.map(drug => `${drug} Weighted`).join(" | ")} |
|----------|--------|${drug_list.map(() => "----------").join("|")}|${drug_list.map(() => "-----------").join("|")}|
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
2. **Alternative options** for different patient scenarios
3. **Contraindicated combinations** and safety considerations
4. **Monitoring requirements** for each recommended option

### Special Population Considerations
- **Pediatric population:** Age-specific recommendations and safety
- **Geriatric population:** Dose adjustments and monitoring
- **Pregnancy and lactation:** Safety categories and alternatives
- **Comorbid conditions:** Drug interactions and modifications
- **Renal/hepatic impairment:** Dose adjustments and monitoring

### Clinical Decision Support
- **Treatment algorithm** for different clinical scenarios
- **Switching protocols** between therapeutic options
- **Combination therapy considerations**
- **Failure management strategies**
- **Long-term monitoring protocols**

## Implementation Action Plan

### Immediate Actions (0-30 days)
1. **Provider education:** Clinical training and competency development
2. **System preparation:** Infrastructure and workflow optimization
3. **Patient communication:** Education materials and support programs
4. **Quality assurance:** Monitoring and evaluation protocols

### Short-term Goals (1-6 months)
1. **Pilot implementation:** Controlled rollout with selected providers
2. **Performance monitoring:** Clinical and economic outcomes tracking
3. **Feedback integration:** Provider and patient experience optimization
4. **System refinement:** Process improvement and quality enhancement

### Long-term Objectives (6+ months)
1. **Full-scale deployment:** System-wide implementation
2. **Outcome evaluation:** Comprehensive effectiveness assessment
3. **Continuous improvement:** Evidence-based optimization
4. **Policy integration:** Healthcare system policy alignment

## Quality Assurance and Monitoring

### Clinical Monitoring Framework
- **Effectiveness indicators:** Primary and secondary outcome measures
- **Safety surveillance:** Adverse event monitoring and reporting
- **Quality metrics:** Process and outcome quality indicators
- **Patient satisfaction:** Experience and outcome satisfaction measures

### Economic Monitoring System
- **Cost tracking:** Direct and indirect cost measurement
- **Budget impact:** Financial impact assessment and forecasting
- **Value demonstration:** Cost-effectiveness and value-based outcomes
- **Resource utilization:** Healthcare system resource optimization

## Evidence-Based Conclusion

### Summary Recommendations
Provide a concise summary that includes:
1. **Preferred therapeutic option** with strength of recommendation
2. **Alternative choices** with specific use cases
3. **Key safety considerations** and monitoring requirements
4. **Economic implications** and cost-effectiveness assessment
5. **Implementation timeline** and resource requirements

### Future Considerations
- **Emerging evidence:** Pipeline research and development
- **Technology advancement:** New delivery systems and formulations
- **Policy evolution:** Regulatory and reimbursement changes
- **Patient preference trends:** Evolving patient needs and expectations

---

**Clinical Disclaimer:** This comparison is based on available evidence at the time of analysis. Healthcare providers should consult current prescribing information, clinical guidelines, and patient-specific factors when making therapeutic decisions. Regular monitoring and reassessment are essential for optimal patient outcomes.

**Data Sources:** Israeli Ministry of Health Drug Registry, international clinical databases, peer-reviewed literature, and health technology assessment reports.

**Last Updated:** ${new Date().toLocaleDateString('he-IL')}`;

  return prompt;
}

function generateComparisonCriteriaSection(criteria?: any): string {
  if (!criteria) {
    return `**Standard Comparison Criteria Applied:**
- Clinical efficacy and evidence quality
- Safety profile and risk assessment  
- Economic impact and cost-effectiveness
- Patient experience and accessibility
- Implementation feasibility and requirements`;
  }

  let section = "**Customized Comparison Criteria:**\n\n";
  
  if (criteria.efficacy_focus) {
    section += `**Clinical Efficacy Focus:**
- Primary endpoint: ${criteria.efficacy_focus.primary_endpoint || "Standard therapeutic outcomes"}
- Secondary endpoints: ${criteria.efficacy_focus.secondary_endpoints || "Quality of life and functional measures"}
- Time horizon: ${criteria.efficacy_focus.time_horizon || "Standard clinical trial duration"}
- Population specificity: ${criteria.efficacy_focus.population || "General target population"}

`;
  }

  if (criteria.safety_priorities) {
    section += `**Safety Assessment Priorities:**
- High-risk populations: ${criteria.safety_priorities.high_risk_populations || "Elderly, pediatric, pregnant patients"}
- Critical adverse events: ${criteria.safety_priorities.critical_events || "Serious adverse reactions"}
- Monitoring intensity: ${criteria.safety_priorities.monitoring_level || "Standard pharmacovigilance"}
- Risk tolerance: ${criteria.safety_priorities.risk_tolerance || "Conservative safety approach"}

`;
  }

  if (criteria.economic_constraints) {
    section += `**Economic Evaluation Parameters:**
- Budget constraints: ${criteria.economic_constraints.budget_limit || "Standard health system budget"}
- Cost perspective: ${criteria.economic_constraints.perspective || "Healthcare system perspective"}
- Time horizon: ${criteria.economic_constraints.time_horizon || "1-5 year analysis"}
- Threshold values: ${criteria.economic_constraints.thresholds || "Standard cost-effectiveness thresholds"}

`;
  }

  if (criteria.patient_factors) {
    section += `**Patient-Centered Considerations:**
- Quality of life priorities: ${criteria.patient_factors.qol_priorities || "Standard quality of life measures"}
- Convenience factors: ${criteria.patient_factors.convenience || "Dosing frequency and administration ease"}
- Cultural considerations: ${criteria.patient_factors.cultural || "Israeli healthcare cultural factors"}
- Accessibility needs: ${criteria.patient_factors.accessibility || "Standard accessibility requirements"}

`;
  }

  return section;
}

// ===== TYPE DEFINITIONS =====

interface CompareTherapeuticOptionsInput {
  drug_list: string[];
  comparison_criteria?: {
    efficacy_focus?: {
      primary_endpoint?: string;
      secondary_endpoints?: string;
      time_horizon?: string;
      population?: string;
    };
    safety_priorities?: {
      high_risk_populations?: string;
      critical_events?: string;
      monitoring_level?: string;
      risk_tolerance?: string;
    };
    economic_constraints?: {
      budget_limit?: string;
      perspective?: string;
      time_horizon?: string;
      thresholds?: string;
    };
    patient_factors?: {
      qol_priorities?: string;
      convenience?: string;
      cultural?: string;
      accessibility?: string;
    };
  };
  clinical_context?: string;
  target_population?: string;
  decision_framework?: string;
}