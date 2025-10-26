/**
 * Clinical Decision Support Tool
 * Integrate multiple protocols for comprehensive decision support
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for clinical decision support input
export const ClinicalDecisionSupportSchema = z.object({
  patient_id: z.string().describe("Patient identifier"),
  clinical_scenario: z.enum(['new_prescription', 'medication_review', 'admission', 'discharge', 'adverse_event']).describe("Clinical scenario type"),
  active_protocols: z.array(z.enum(['medrec', 'tdm', 'interactions', 'soap', 'five_rights'])).describe("Active protocols to consider"),
  patient_data: z.object({
    demographics: z.object({
      age: z.number().describe("Patient age"),
      sex: z.enum(['M', 'F', 'Other']).describe("Patient sex"),
      weight_kg: z.number().describe("Patient weight in kg"),
      height_cm: z.number().describe("Patient height in cm")
    }),
    current_medications: z.array(z.object({
      drug_name: z.string().describe("Drug name"),
      dose: z.string().describe("Dose"),
      frequency: z.string().describe("Frequency"),
      route: z.string().describe("Route"),
      indication: z.string().describe("Indication"),
      start_date: z.string().describe("Start date")
    })),
    active_conditions: z.array(z.object({
      condition: z.string().describe("Condition name"),
      status: z.enum(['active', 'controlled', 'history']).describe("Condition status"),
      severity: z.enum(['mild', 'moderate', 'severe']).describe("Condition severity")
    })),
    recent_labs: z.array(z.object({
      test_name: z.string().describe("Test name"),
      result: z.string().describe("Test result"),
      reference_range: z.string().describe("Reference range"),
      flag: z.enum(['high', 'low', 'critical', 'normal']).describe("Result flag"),
      datetime: z.string().describe("Test datetime")
    })),
    vital_signs: z.object({
      temperature: z.number().describe("Temperature in Celsius"),
      heart_rate: z.number().describe("Heart rate in bpm"),
      blood_pressure: z.string().describe("Blood pressure"),
      respiratory_rate: z.number().describe("Respiratory rate"),
      oxygen_saturation: z.number().describe("Oxygen saturation")
    })
  })
});

export type ClinicalDecisionSupportInput = z.infer<typeof ClinicalDecisionSupportSchema>;

// Clinical decision support output
export interface ClinicalDecisionSupportOutput {
  integrated_assessment: {
    protocols_activated: string[];
    findings_by_protocol: Record<string, any>;
    cross_protocol_alerts: Array<{
      alert_type: string;
      severity: string;
      description: string;
      affected_protocols: string[];
      recommended_action: string;
    }>;
    prioritized_actions: Array<{
      priority: number;
      urgency: 'immediate' | 'urgent' | 'routine';
      action: string;
      protocol_source: string;
      rationale: string;
    }>;
    comprehensive_plan: string;
  };
}

// ===== TOOL REGISTRATION =====

export function registerClinicalDecisionSupportTool(server: McpServer): void {
  server.registerTool(
    "clinical_decision_support",
    {
      title: "Clinical Decision Support",
      description: `Integrate multiple protocols for comprehensive decision support.

**Purpose:** Provide integrated clinical decision support across multiple medical protocols.

**Input Parameters:**
- patient_id: Patient identifier
- clinical_scenario: Type of clinical scenario
- active_protocols: Protocols to consider
- patient_data: Comprehensive patient data

**Process:**
1. Trigger relevant protocol tools based on scenario
2. Aggregate findings from multiple protocols
3. Identify conflicts or synergies
4. Prioritize recommendations
5. Generate integrated care plan

**Output:** Returns integrated assessment with prioritized actions and comprehensive plan.`,
      inputSchema: ClinicalDecisionSupportSchema.shape,
    },
    async (input: ClinicalDecisionSupportInput): Promise<McpResponse<ClinicalDecisionSupportOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(ClinicalDecisionSupportSchema, input, "clinical_decision_support");

        // 2. Process clinical decision support
        const decisionSupportOutput = processClinicalDecisionSupport(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(decisionSupportOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in clinical_decision_support tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "clinical_decision_support", 
          userInput: input 
        });
      }
    }
  );
}

// ===== CLINICAL DECISION SUPPORT PROCESSING =====

function processClinicalDecisionSupport(input: ClinicalDecisionSupportInput): ClinicalDecisionSupportOutput {
  // Determine which protocols to activate based on scenario
  const protocolsToActivate = determineProtocolsToActivate(input);
  
  // Process each protocol
  const findingsByProtocol = processProtocols(input, protocolsToActivate);
  
  // Identify cross-protocol alerts
  const crossProtocolAlerts = identifyCrossProtocolAlerts(findingsByProtocol);
  
  // Prioritize actions
  const prioritizedActions = prioritizeActions(findingsByProtocol, crossProtocolAlerts);
  
  // Generate comprehensive plan
  const comprehensivePlan = generateComprehensivePlan(findingsByProtocol, prioritizedActions);
  
  return {
    integrated_assessment: {
      protocols_activated: protocolsToActivate,
      findings_by_protocol: findingsByProtocol,
      cross_protocol_alerts: crossProtocolAlerts,
      prioritized_actions: prioritizedActions,
      comprehensive_plan: comprehensivePlan
    }
  };
}

function determineProtocolsToActivate(input: ClinicalDecisionSupportInput): string[] {
  const protocols: string[] = [];
  
  // Always include medication reconciliation for medication-related scenarios
  if (input.clinical_scenario === 'new_prescription' || 
      input.clinical_scenario === 'medication_review' ||
      input.clinical_scenario === 'admission' ||
      input.clinical_scenario === 'discharge') {
    protocols.push('medrec');
  }
  
  // Include interaction screening for medication scenarios
  if (input.clinical_scenario === 'new_prescription' || 
      input.clinical_scenario === 'medication_review' ||
      input.clinical_scenario === 'admission') {
    protocols.push('interactions');
  }
  
  // Include TDM for specific medications
  if (input.patient_data.current_medications.some(med => 
    med.drug_name.toLowerCase().includes('vancomycin') ||
    med.drug_name.toLowerCase().includes('digoxin') ||
    med.drug_name.toLowerCase().includes('lithium') ||
    med.drug_name.toLowerCase().includes('phenytoin'))) {
    protocols.push('tdm');
  }
  
  // Include SOAP documentation for clinical encounters
  if (input.clinical_scenario === 'admission' || 
      input.clinical_scenario === 'discharge' ||
      input.clinical_scenario === 'adverse_event') {
    protocols.push('soap');
  }
  
  // Include five rights for medication administration
  if (input.clinical_scenario === 'new_prescription' || 
      input.clinical_scenario === 'adverse_event') {
    protocols.push('five_rights');
  }
  
  return protocols;
}

function processProtocols(input: ClinicalDecisionSupportInput, protocols: string[]): Record<string, any> {
  const findings: Record<string, any> = {};
  
  for (const protocol of protocols) {
    switch (protocol) {
      case 'medrec':
        findings.medrec = processMedRecProtocol(input);
        break;
      case 'interactions':
        findings.interactions = processInteractionProtocol(input);
        break;
      case 'tdm':
        findings.tdm = processTdmProtocol(input);
        break;
      case 'soap':
        findings.soap = processSoapProtocol(input);
        break;
      case 'five_rights':
        findings.five_rights = processFiveRightsProtocol(input);
        break;
    }
  }
  
  return findings;
}

function processMedRecProtocol(input: ClinicalDecisionSupportInput): any {
  return {
    protocol: 'medrec',
    status: 'active',
    findings: {
      medication_count: input.patient_data.current_medications.length,
      high_risk_medications: input.patient_data.current_medications.filter(med => 
        med.drug_name.toLowerCase().includes('warfarin') ||
        med.drug_name.toLowerCase().includes('digoxin') ||
        med.drug_name.toLowerCase().includes('lithium')
      ),
      adherence_concerns: [],
      reconciliation_required: input.clinical_scenario === 'admission' || input.clinical_scenario === 'discharge'
    },
    recommendations: [
      'Complete medication reconciliation',
      'Verify patient understanding of medications',
      'Check for drug interactions'
    ]
  };
}

function processInteractionProtocol(input: ClinicalDecisionSupportInput): any {
  const interactions = [];
  
  // Check for common drug interactions
  for (let i = 0; i < input.patient_data.current_medications.length; i++) {
    for (let j = i + 1; j < input.patient_data.current_medications.length; j++) {
      const med1 = input.patient_data.current_medications[i];
      const med2 = input.patient_data.current_medications[j];
      
      if (!med1 || !med2) continue;
      
      // Check for known interactions
      if (hasKnownInteraction(med1.drug_name, med2.drug_name)) {
        interactions.push({
          drug1: med1.drug_name,
          drug2: med2.drug_name,
          severity: 'moderate',
          description: 'Potential drug interaction detected'
        });
      }
    }
  }
  
  return {
    protocol: 'interactions',
    status: 'active',
    findings: {
      total_interactions: interactions.length,
      serious_interactions: interactions.filter(i => i.severity === 'serious'),
      moderate_interactions: interactions.filter(i => i.severity === 'moderate'),
      minor_interactions: interactions.filter(i => i.severity === 'minor')
    },
    recommendations: interactions.length > 0 ? [
      'Review drug interactions with prescriber',
      'Consider alternative medications',
      'Monitor for adverse effects'
    ] : ['No significant interactions detected']
  };
}

function processTdmProtocol(input: ClinicalDecisionSupportInput): any {
  const tdmCandidates = input.patient_data.current_medications.filter(med => 
    med.drug_name.toLowerCase().includes('vancomycin') ||
    med.drug_name.toLowerCase().includes('digoxin') ||
    med.drug_name.toLowerCase().includes('lithium') ||
    med.drug_name.toLowerCase().includes('phenytoin')
  );
  
  return {
    protocol: 'tdm',
    status: tdmCandidates.length > 0 ? 'active' : 'inactive',
    findings: {
      tdm_candidates: tdmCandidates,
      monitoring_required: tdmCandidates.length > 0,
      last_levels: [],
      trends: []
    },
    recommendations: tdmCandidates.length > 0 ? [
      'Schedule therapeutic drug monitoring',
      'Check recent levels',
      'Adjust dosing if needed'
    ] : ['No TDM required']
  };
}

function processSoapProtocol(input: ClinicalDecisionSupportInput): any {
  return {
    protocol: 'soap',
    status: 'active',
    findings: {
      documentation_required: true,
      sections_needed: ['subjective', 'objective', 'assessment', 'plan'],
      clinical_summary: generateClinicalSummary(input),
      problem_list: input.patient_data.active_conditions
    },
    recommendations: [
      'Complete SOAP documentation',
      'Update problem list',
      'Document clinical reasoning'
    ]
  };
}

function processFiveRightsProtocol(input: ClinicalDecisionSupportInput): any {
  return {
    protocol: 'five_rights',
    status: 'active',
    findings: {
      administration_safety: 'high',
      verification_required: true,
      high_alert_medications: input.patient_data.current_medications.filter(med => 
        med.drug_name.toLowerCase().includes('insulin') ||
        med.drug_name.toLowerCase().includes('heparin') ||
        med.drug_name.toLowerCase().includes('morphine')
      )
    },
    recommendations: [
      'Verify patient identity',
      'Check medication details',
      'Confirm dose and route',
      'Document administration'
    ]
  };
}

function hasKnownInteraction(drug1: string | undefined, drug2: string | undefined): boolean {
  if (!drug1 || !drug2) return false;
  
  const interactions: [string, string][] = [
    ['warfarin', 'aspirin'],
    ['digoxin', 'furosemide'],
    ['lithium', 'furosemide'],
    ['phenytoin', 'warfarin']
  ];
  
  // After the null check, we know drug1 and drug2 are strings
  const drug1Lower = drug1.toLowerCase();
  const drug2Lower = drug2.toLowerCase();
  
  return interactions.some(([d1, d2]) => 
    (drug1Lower.includes(d1) && drug2Lower.includes(d2)) ||
    (drug1Lower.includes(d2) && drug2Lower.includes(d1))
  );
}

function identifyCrossProtocolAlerts(findings: Record<string, any>): Array<{
  alert_type: string;
  severity: string;
  description: string;
  affected_protocols: string[];
  recommended_action: string;
}> {
  const alerts = [];
  
  // Check for conflicts between protocols
  if (findings.medrec && findings.interactions) {
    const medRecMedications = findings.medrec.findings.medication_count;
    const interactionCount = findings.interactions.findings.total_interactions;
    
    if (medRecMedications > 5 && interactionCount > 0) {
      alerts.push({
        alert_type: 'medication_complexity',
        severity: 'moderate',
        description: 'High medication complexity with potential interactions',
        affected_protocols: ['medrec', 'interactions'],
        recommended_action: 'Consider medication review and simplification'
      });
    }
  }
  
  // Check for TDM requirements
  if (findings.tdm && findings.tdm.status === 'active') {
    alerts.push({
      alert_type: 'tdm_required',
      severity: 'high',
      description: 'Therapeutic drug monitoring required',
      affected_protocols: ['tdm'],
      recommended_action: 'Schedule TDM levels and adjust dosing'
    });
  }
  
  return alerts;
}

function prioritizeActions(findings: Record<string, any>, alerts: any[]): Array<{
  priority: number;
  urgency: 'immediate' | 'urgent' | 'routine';
  action: string;
  protocol_source: string;
  rationale: string;
}> {
  const actions = [];
  
  // High priority actions
  if (alerts.some(alert => alert.severity === 'high')) {
    actions.push({
      priority: 1,
      urgency: 'immediate' as const,
      action: 'Address high-severity alerts',
      protocol_source: 'integration',
      rationale: 'High-severity alerts require immediate attention'
    });
  }
  
  // Medication reconciliation
  if (findings.medrec && findings.medrec.findings.reconciliation_required) {
    actions.push({
      priority: 2,
      urgency: 'urgent' as const,
      action: 'Complete medication reconciliation',
      protocol_source: 'medrec',
      rationale: 'Essential for patient safety'
    });
  }
  
  // Drug interactions
  if (findings.interactions && findings.interactions.findings.total_interactions > 0) {
    actions.push({
      priority: 3,
      urgency: 'urgent' as const,
      action: 'Review and manage drug interactions',
      protocol_source: 'interactions',
      rationale: 'Prevent adverse drug events'
    });
  }
  
  // TDM
  if (findings.tdm && findings.tdm.status === 'active') {
    actions.push({
      priority: 4,
      urgency: 'routine' as const,
      action: 'Schedule therapeutic drug monitoring',
      protocol_source: 'tdm',
      rationale: 'Optimize drug therapy'
    });
  }
  
  // Documentation
  if (findings.soap) {
    actions.push({
      priority: 5,
      urgency: 'routine' as const,
      action: 'Complete SOAP documentation',
      protocol_source: 'soap',
      rationale: 'Maintain clinical records'
    });
  }
  
  return actions;
}

function generateComprehensivePlan(findings: Record<string, any>, actions: any[]): string {
  let plan = "Comprehensive Clinical Care Plan:\n\n";
  
  // Immediate actions
  const immediateActions = actions.filter(a => a.urgency === 'immediate');
  if (immediateActions.length > 0) {
    plan += "IMMEDIATE ACTIONS:\n";
    immediateActions.forEach(action => {
      plan += `- ${action.action}\n`;
    });
    plan += "\n";
  }
  
  // Urgent actions
  const urgentActions = actions.filter(a => a.urgency === 'urgent');
  if (urgentActions.length > 0) {
    plan += "URGENT ACTIONS:\n";
    urgentActions.forEach(action => {
      plan += `- ${action.action}\n`;
    });
    plan += "\n";
  }
  
  // Routine actions
  const routineActions = actions.filter(a => a.urgency === 'routine');
  if (routineActions.length > 0) {
    plan += "ROUTINE ACTIONS:\n";
    routineActions.forEach(action => {
      plan += `- ${action.action}\n`;
    });
    plan += "\n";
  }
  
  // Monitoring plan
  plan += "MONITORING PLAN:\n";
  plan += "- Monitor for adverse drug reactions\n";
  plan += "- Check medication adherence\n";
  plan += "- Review laboratory results\n";
  plan += "- Assess clinical response\n";
  
  return plan;
}

function generateClinicalSummary(input: ClinicalDecisionSupportInput): string {
  const age = input.patient_data.demographics.age;
  const sex = input.patient_data.demographics.sex;
  const conditionCount = input.patient_data.active_conditions.length;
  const medicationCount = input.patient_data.current_medications.length;
  
  return `${age}-year-old ${sex === 'M' ? 'male' : 'female'} with ${conditionCount} active conditions and ${medicationCount} current medications.`;
}
