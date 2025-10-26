/**
 * Document Plan Tool
 * Creates detailed treatment and follow-up plan
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for plan documentation input
export const DocumentPlanSchema = z.object({
  encounter_id: z.string().min(1).describe("Unique encounter identifier"),
  assessment_section_id: z.string().min(1).describe("ID from assessment documentation"),
  treatment_plan: z.object({
    medications: z.array(z.object({
      action: z.enum(['continue', 'start', 'modify', 'discontinue']).describe("Action for medication"),
      drug_name: z.string().describe("Drug name"),
      dose: z.string().describe("Dose with units"),
      frequency: z.string().describe("Dosing frequency"),
      route: z.string().describe("Route of administration"),
      duration: z.string().describe("Duration of therapy"),
      indication: z.string().describe("Clinical indication"),
      monitoring_required: z.array(z.string()).describe("Required monitoring parameters")
    })).describe("Medication plan"),
    procedures: z.array(z.object({
      procedure: z.string().describe("Procedure name"),
      timing: z.enum(['immediate', 'urgent', 'routine']).describe("Timing of procedure"),
      indication: z.string().describe("Indication for procedure")
    })).describe("Procedures planned"),
    non_pharmacologic: z.array(z.string()).describe("Non-pharmacologic interventions"),
    lifestyle_modifications: z.array(z.string()).describe("Lifestyle modifications")
  }),
  diagnostic_plan: z.object({
    laboratory_tests: z.array(z.string()).describe("Laboratory tests to order"),
    imaging_studies: z.array(z.string()).describe("Imaging studies to order"),
    consultations: z.array(z.object({
      specialty: z.string().describe("Specialty for consultation"),
      urgency: z.enum(['stat', 'urgent', 'routine']).describe("Urgency of consultation"),
      reason: z.string().describe("Reason for consultation")
    })).describe("Consultations to request")
  }),
  monitoring_plan: z.object({
    parameters: z.array(z.string()).describe("Parameters to monitor"),
    frequency: z.string().describe("Monitoring frequency"),
    duration: z.string().describe("Duration of monitoring"),
    action_triggers: z.array(z.string()).describe("Triggers for action")
  }),
  patient_education: z.object({
    topics_covered: z.array(z.string()).describe("Education topics covered"),
    materials_provided: z.array(z.string()).describe("Educational materials provided"),
    patient_understanding: z.enum(['good', 'fair', 'poor']).describe("Patient understanding level")
  }),
  disposition: z.object({
    location: z.enum(['home', 'admission', 'ICU', 'transfer', 'observation']).describe("Patient disposition"),
    follow_up: z.object({
      provider: z.string().describe("Follow-up provider"),
      timeframe: z.string().describe("Follow-up timeframe"),
      specific_issues: z.array(z.string()).describe("Specific issues to address")
    }).describe("Follow-up plan")
  })
});

export type DocumentPlanInput = z.infer<typeof DocumentPlanSchema>;

// Plan documentation output
export interface PlanDocumentationOutput {
  plan_section: {
    section_id: string;
    narrative: string;
    structured_plan: {
      treatment_plan: any;
      diagnostic_plan: any;
      monitoring_plan: any;
      patient_education: any;
      disposition: any;
    };
    orders_to_place: Array<{
      type: 'medication' | 'procedure' | 'laboratory' | 'imaging' | 'consultation';
      description: string;
      urgency: string;
      details: string;
    }>;
    prescriptions_to_write: Array<{
      drug_name: string;
      dose: string;
      frequency: string;
      route: string;
      duration: string;
      indication: string;
    }>;
    referrals_to_generate: Array<{
      specialty: string;
      urgency: string;
      reason: string;
    }>;
    patient_instructions: string;
    follow_up_schedule: Array<{
      date: string;
      provider: string;
      purpose: string;
    }>;
  };
}

// ===== TOOL REGISTRATION =====

export function registerDocumentPlanTool(server: McpServer): void {
  server.registerTool(
    "document_plan",
    {
      title: "Document Plan",
      description: `Creates detailed treatment and follow-up plan based on assessment.

**Purpose:** Document comprehensive treatment plan with orders, prescriptions, and follow-up.

**Input Parameters:**
- encounter_id: Unique encounter identifier
- assessment_section_id: ID from assessment documentation
- treatment_plan: Medications, procedures, and interventions
- diagnostic_plan: Laboratory tests, imaging, and consultations
- monitoring_plan: Parameters to monitor and frequency
- patient_education: Education provided and understanding
- disposition: Patient disposition and follow-up

**Process:**
1. Create medication plan with dosing and monitoring
2. Plan diagnostic workup
3. Establish monitoring parameters
4. Provide patient education
5. Determine disposition and follow-up

**Output:** Returns formatted plan section with actionable orders and instructions.`,
      inputSchema: DocumentPlanSchema.shape,
    },
    async (input: DocumentPlanInput): Promise<McpResponse<PlanDocumentationOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(DocumentPlanSchema, input, "document_plan");

        // 2. Process plan documentation
        const planOutput = processPlanDocumentation(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(planOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in document_plan tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "document_plan", 
          userInput: input 
        });
      }
    }
  );
}

// ===== PLAN DOCUMENTATION PROCESSING =====

function processPlanDocumentation(input: DocumentPlanInput): PlanDocumentationOutput {
  const sectionId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Generate narrative
  const narrative = generatePlanNarrative(input);
  
  // Create structured plan
  const structuredPlan = createStructuredPlan(input);
  
  // Generate orders to place
  const ordersToPlace = generateOrdersToPlace(input);
  
  // Generate prescriptions
  const prescriptionsToWrite = generatePrescriptions(input);
  
  // Generate referrals
  const referralsToGenerate = generateReferrals(input);
  
  // Generate patient instructions
  const patientInstructions = generatePatientInstructions(input);
  
  // Generate follow-up schedule
  const followUpSchedule = generateFollowUpSchedule(input);
  
  return {
    plan_section: {
      section_id: sectionId,
      narrative,
      structured_plan: structuredPlan,
      orders_to_place: ordersToPlace,
      prescriptions_to_write: prescriptionsToWrite,
      referrals_to_generate: referralsToGenerate,
      patient_instructions: patientInstructions,
      follow_up_schedule: followUpSchedule
    }
  };
}

function generatePlanNarrative(input: DocumentPlanInput): string {
  const narrative: string[] = [];
  
  // Treatment Plan
  narrative.push('Plan:');
  
  // Medications
  if (input.treatment_plan.medications.length > 0) {
    narrative.push('Medications:');
    for (const med of input.treatment_plan.medications) {
      const action = med.action === 'continue' ? 'Continue' : 
                    med.action === 'start' ? 'Start' :
                    med.action === 'modify' ? 'Modify' : 'Discontinue';
      
      narrative.push(`- ${action} ${med.drug_name} ${med.dose} ${med.frequency} ${med.route} for ${med.duration} (${med.indication})`);
      
      if (med.monitoring_required.length > 0) {
        narrative.push(`  Monitor: ${med.monitoring_required.join(', ')}`);
      }
    }
  }
  
  // Procedures
  if (input.treatment_plan.procedures.length > 0) {
    narrative.push('Procedures:');
    for (const proc of input.treatment_plan.procedures) {
      narrative.push(`- ${proc.procedure} (${proc.timing}) - ${proc.indication}`);
    }
  }
  
  // Non-pharmacologic interventions
  if (input.treatment_plan.non_pharmacologic.length > 0) {
    narrative.push('Non-pharmacologic interventions:');
    for (const intervention of input.treatment_plan.non_pharmacologic) {
      narrative.push(`- ${intervention}`);
    }
  }
  
  // Lifestyle modifications
  if (input.treatment_plan.lifestyle_modifications.length > 0) {
    narrative.push('Lifestyle modifications:');
    for (const modification of input.treatment_plan.lifestyle_modifications) {
      narrative.push(`- ${modification}`);
    }
  }
  
  // Diagnostic Plan
  if (input.diagnostic_plan.laboratory_tests.length > 0 || 
      input.diagnostic_plan.imaging_studies.length > 0 || 
      input.diagnostic_plan.consultations.length > 0) {
    narrative.push('');
    narrative.push('Diagnostic Plan:');
    
    if (input.diagnostic_plan.laboratory_tests.length > 0) {
      narrative.push(`Laboratory: ${input.diagnostic_plan.laboratory_tests.join(', ')}`);
    }
    
    if (input.diagnostic_plan.imaging_studies.length > 0) {
      narrative.push(`Imaging: ${input.diagnostic_plan.imaging_studies.join(', ')}`);
    }
    
    for (const consult of input.diagnostic_plan.consultations) {
      narrative.push(`Consultation: ${consult.specialty} (${consult.urgency}) - ${consult.reason}`);
    }
  }
  
  // Monitoring Plan
  if (input.monitoring_plan.parameters.length > 0) {
    narrative.push('');
    narrative.push('Monitoring Plan:');
    narrative.push(`Parameters: ${input.monitoring_plan.parameters.join(', ')}`);
    narrative.push(`Frequency: ${input.monitoring_plan.frequency}`);
    narrative.push(`Duration: ${input.monitoring_plan.duration}`);
    
    if (input.monitoring_plan.action_triggers.length > 0) {
      narrative.push(`Action triggers: ${input.monitoring_plan.action_triggers.join(', ')}`);
    }
  }
  
  // Patient Education
  if (input.patient_education.topics_covered.length > 0) {
    narrative.push('');
    narrative.push('Patient Education:');
    narrative.push(`Topics: ${input.patient_education.topics_covered.join(', ')}`);
    narrative.push(`Understanding: ${input.patient_education.patient_understanding}`);
    
    if (input.patient_education.materials_provided.length > 0) {
      narrative.push(`Materials provided: ${input.patient_education.materials_provided.join(', ')}`);
    }
  }
  
  // Disposition
  narrative.push('');
  narrative.push('Disposition:');
  narrative.push(`Location: ${input.disposition.location}`);
  narrative.push(`Follow-up: ${input.disposition.follow_up.provider} in ${input.disposition.follow_up.timeframe}`);
  
  if (input.disposition.follow_up.specific_issues.length > 0) {
    narrative.push(`Specific issues: ${input.disposition.follow_up.specific_issues.join(', ')}`);
  }
  
  return narrative.join('\n');
}

function createStructuredPlan(input: DocumentPlanInput): {
  treatment_plan: any;
  diagnostic_plan: any;
  monitoring_plan: any;
  patient_education: any;
  disposition: any;
} {
  return {
    treatment_plan: input.treatment_plan,
    diagnostic_plan: input.diagnostic_plan,
    monitoring_plan: input.monitoring_plan,
    patient_education: input.patient_education,
    disposition: input.disposition
  };
}

function generateOrdersToPlace(input: DocumentPlanInput): Array<{
  type: 'medication' | 'procedure' | 'laboratory' | 'imaging' | 'consultation';
  description: string;
  urgency: string;
  details: string;
}> {
  const orders: Array<{
    type: 'medication' | 'procedure' | 'laboratory' | 'imaging' | 'consultation';
    description: string;
    urgency: string;
    details: string;
  }> = [];
  
  // Medication orders
  for (const med of input.treatment_plan.medications) {
    if (med.action === 'start' || med.action === 'modify') {
      orders.push({
        type: 'medication',
        description: `${med.action} ${med.drug_name}`,
        urgency: 'routine',
        details: `${med.dose} ${med.frequency} ${med.route} for ${med.duration}`
      });
    }
  }
  
  // Procedure orders
  for (const proc of input.treatment_plan.procedures) {
    orders.push({
      type: 'procedure',
      description: proc.procedure,
      urgency: proc.timing,
      details: proc.indication
    });
  }
  
  // Laboratory orders
  for (const lab of input.diagnostic_plan.laboratory_tests) {
    orders.push({
      type: 'laboratory',
      description: lab,
      urgency: 'routine',
      details: 'As ordered'
    });
  }
  
  // Imaging orders
  for (const imaging of input.diagnostic_plan.imaging_studies) {
    orders.push({
      type: 'imaging',
      description: imaging,
      urgency: 'routine',
      details: 'As ordered'
    });
  }
  
  // Consultation orders
  for (const consult of input.diagnostic_plan.consultations) {
    orders.push({
      type: 'consultation',
      description: consult.specialty,
      urgency: consult.urgency,
      details: consult.reason
    });
  }
  
  return orders;
}

function generatePrescriptions(input: DocumentPlanInput): Array<{
  drug_name: string;
  dose: string;
  frequency: string;
  route: string;
  duration: string;
  indication: string;
}> {
  const prescriptions: Array<{
    drug_name: string;
    dose: string;
    frequency: string;
    route: string;
    duration: string;
    indication: string;
  }> = [];
  
  for (const med of input.treatment_plan.medications) {
    if (med.action === 'start' || med.action === 'modify') {
      prescriptions.push({
        drug_name: med.drug_name,
        dose: med.dose,
        frequency: med.frequency,
        route: med.route,
        duration: med.duration,
        indication: med.indication
      });
    }
  }
  
  return prescriptions;
}

function generateReferrals(input: DocumentPlanInput): Array<{
  specialty: string;
  urgency: string;
  reason: string;
}> {
  const referrals: Array<{
    specialty: string;
    urgency: string;
    reason: string;
  }> = [];
  
  for (const consult of input.diagnostic_plan.consultations) {
    referrals.push({
      specialty: consult.specialty,
      urgency: consult.urgency,
      reason: consult.reason
    });
  }
  
  return referrals;
}

function generatePatientInstructions(input: DocumentPlanInput): string {
  const instructions: string[] = [];
  
  // Medication instructions
  const newMedications = input.treatment_plan.medications.filter(med => med.action === 'start');
  if (newMedications.length > 0) {
    instructions.push('Medication Instructions:');
    for (const med of newMedications) {
      instructions.push(`- Take ${med.drug_name} ${med.dose} ${med.frequency} ${med.route} for ${med.duration}`);
      instructions.push(`  Reason: ${med.indication}`);
    }
  }
  
  // Lifestyle modifications
  if (input.treatment_plan.lifestyle_modifications.length > 0) {
    instructions.push('Lifestyle Modifications:');
    for (const modification of input.treatment_plan.lifestyle_modifications) {
      instructions.push(`- ${modification}`);
    }
  }
  
  // Monitoring instructions
  if (input.monitoring_plan.parameters.length > 0) {
    instructions.push('Monitoring Instructions:');
    instructions.push(`- Monitor: ${input.monitoring_plan.parameters.join(', ')}`);
    instructions.push(`- Frequency: ${input.monitoring_plan.frequency}`);
    instructions.push(`- Duration: ${input.monitoring_plan.duration}`);
  }
  
  // Follow-up instructions
  instructions.push('Follow-up Instructions:');
  instructions.push(`- Follow-up with: ${input.disposition.follow_up.provider}`);
  instructions.push(`- Timeframe: ${input.disposition.follow_up.timeframe}`);
  
  if (input.disposition.follow_up.specific_issues.length > 0) {
    instructions.push(`- Address: ${input.disposition.follow_up.specific_issues.join(', ')}`);
  }
  
  // Warning signs
  if (input.monitoring_plan.action_triggers.length > 0) {
    instructions.push('Warning Signs (contact provider if these occur):');
    for (const trigger of input.monitoring_plan.action_triggers) {
      instructions.push(`- ${trigger}`);
    }
  }
  
  return instructions.join('\n');
}

function generateFollowUpSchedule(input: DocumentPlanInput): Array<{
  date: string;
  provider: string;
  purpose: string;
}> {
  const schedule: Array<{
    date: string;
    provider: string;
    purpose: string;
  }> = [];
  
  // Calculate follow-up date based on timeframe
  const now = new Date();
  let followUpDate: Date;
  
  if (input.disposition.follow_up.timeframe.includes('week')) {
    const timeframeParts = input.disposition.follow_up.timeframe.split(' ');
    const weeks = parseInt(timeframeParts[0] || '1') || 1;
    followUpDate = new Date(now.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
  } else if (input.disposition.follow_up.timeframe.includes('month')) {
    const timeframeParts = input.disposition.follow_up.timeframe.split(' ');
    const months = parseInt(timeframeParts[0] || '1') || 1;
    followUpDate = new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000);
  } else {
    // Default to 1 week
    followUpDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  
  schedule.push({
    date: followUpDate.toISOString().split('T')[0] || followUpDate.toISOString(),
    provider: input.disposition.follow_up.provider,
    purpose: input.disposition.follow_up.specific_issues.join(', ') || 'Routine follow-up'
  });
  
  return schedule;
}
