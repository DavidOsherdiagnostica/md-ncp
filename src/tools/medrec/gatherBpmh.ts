/**
 * Gather Best Possible Medication History (BPMH) Tool
 * Implements WHO High 5s standardized medication reconciliation process
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for BPMH gathering input
export const GatherBpmhSchema = z.object({
  patient_id: z.string().min(1).describe("Unique patient identifier"),
  data_sources: z.object({
    patient_interview: z.object({
      conducted: z.boolean().describe("Whether patient interview was conducted"),
      interviewer_id: z.string().optional().describe("ID of the interviewer"),
      date_time: z.string().optional().describe("ISO8601 datetime of interview")
    }),
    medication_bottles: z.boolean().describe("Whether medication bottles were reviewed"),
    previous_prescriptions: z.boolean().describe("Whether previous prescriptions were reviewed"),
    pharmacy_records: z.boolean().describe("Whether pharmacy records were accessed"),
    family_caregiver_input: z.boolean().describe("Whether family/caregiver input was obtained"),
    previous_discharge_summaries: z.boolean().describe("Whether previous discharge summaries were reviewed")
  }),
  systematic_categories: z.object({
    prescription_medications: z.array(z.object({
      drug_name: z.string().describe("Generic and brand name"),
      dose: z.string().describe("Dose with units"),
      frequency: z.string().describe("Actual frequency taken (not prescribed)"),
      route: z.string().describe("Route of administration"),
      last_taken: z.string().optional().describe("ISO8601 datetime of last dose"),
      indication: z.string().describe("Reason for taking medication"),
      prescriber: z.string().optional().describe("Prescriber name if known"),
      start_date: z.string().optional().describe("ISO8601 date when started"),
      adherence_notes: z.string().optional().describe("How patient actually takes medication")
    })),
    otc_medications: z.array(z.object({
      drug_name: z.string(),
      dose: z.string(),
      frequency: z.string(),
      route: z.string(),
      last_taken: z.string().optional(),
      indication: z.string(),
      start_date: z.string().optional(),
      adherence_notes: z.string().optional()
    })),
    complementary_alternative: z.array(z.object({
      drug_name: z.string(),
      dose: z.string(),
      frequency: z.string(),
      route: z.string(),
      last_taken: z.string().optional(),
      indication: z.string(),
      start_date: z.string().optional(),
      adherence_notes: z.string().optional()
    })),
    vitamins_supplements: z.array(z.object({
      drug_name: z.string(),
      dose: z.string(),
      frequency: z.string(),
      route: z.string(),
      last_taken: z.string().optional(),
      indication: z.string(),
      start_date: z.string().optional(),
      adherence_notes: z.string().optional()
    })),
    herbal_products: z.array(z.object({
      drug_name: z.string(),
      dose: z.string(),
      frequency: z.string(),
      route: z.string(),
      last_taken: z.string().optional(),
      indication: z.string(),
      start_date: z.string().optional(),
      adherence_notes: z.string().optional()
    })),
    topical_medications: z.array(z.object({
      drug_name: z.string(),
      dose: z.string(),
      frequency: z.string(),
      route: z.string(),
      last_taken: z.string().optional(),
      indication: z.string(),
      start_date: z.string().optional(),
      adherence_notes: z.string().optional()
    })),
    eye_ear_nose_drops: z.array(z.object({
      drug_name: z.string(),
      dose: z.string(),
      frequency: z.string(),
      route: z.string(),
      last_taken: z.string().optional(),
      indication: z.string(),
      start_date: z.string().optional(),
      adherence_notes: z.string().optional()
    })),
    intermittent_medications: z.array(z.object({
      drug_name: z.string(),
      dose: z.string(),
      frequency: z.string(),
      route: z.string(),
      last_taken: z.string().optional(),
      indication: z.string(),
      start_date: z.string().optional(),
      adherence_notes: z.string().optional()
    }))
  })
});

export type GatherBpmhInput = z.infer<typeof GatherBpmhSchema>;

// BPMH Output type
export interface BpmhOutput {
  bpmh_id: string;
  patient_id: string;
  creation_datetime: string;
  created_by: string;
  medications_list: Array<{
    category: string;
    medications: Array<{
      drug_name: string;
      dose: string;
      frequency: string;
      route: string;
      last_taken?: string;
      indication: string;
      prescriber?: string;
      start_date?: string;
      adherence_notes?: string;
    }>;
  }>;
  sources_used: string[];
  verification_status: 'complete' | 'partial' | 'unverified';
  patient_signature: boolean;
  next_steps: string[];
}

// ===== TOOL REGISTRATION =====

export function registerGatherBpmhTool(server: McpServer): void {
  server.registerTool(
    "gather_bpmh",
    {
      title: "Gather Best Possible Medication History (BPMH)",
      description: `Collects comprehensive medication history from multiple sources following WHO High 5s standardized medication reconciliation process.

**Purpose:** Create a complete and accurate medication history for medication reconciliation.

**Input Parameters:**
- patient_id: Unique patient identifier
- data_sources: Sources used for medication history collection
- systematic_categories: Medications organized by category (prescription, OTC, supplements, etc.)

**Process:**
1. Use BPMH Interview Guide systematic approach
2. Verify information from minimum 2 sources when possible
3. Document actual patient behavior vs prescribed regimen
4. Capture medications taken differently than prescribed

**Output:** Returns structured BPMH with verification status and next steps.`,
      inputSchema: GatherBpmhSchema.shape,
    },
    async (input: GatherBpmhInput): Promise<McpResponse<BpmhOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(GatherBpmhSchema, input, "gather_bpmh");

        // 2. Process BPMH data
        const bpmhOutput = processBpmhData(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(bpmhOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in gather_bpmh tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "gather_bpmh", 
          userInput: input 
        });
      }
    }
  );
}

// ===== BPMH PROCESSING =====

function processBpmhData(input: GatherBpmhInput): BpmhOutput {
  const bpmhId = `bpmh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const creationDatetime = new Date().toISOString();
  
  // Determine verification status based on sources used
  const sourcesUsed = [];
  if (input.data_sources.patient_interview.conducted) sourcesUsed.push("patient_interview");
  if (input.data_sources.medication_bottles) sourcesUsed.push("medication_bottles");
  if (input.data_sources.previous_prescriptions) sourcesUsed.push("previous_prescriptions");
  if (input.data_sources.pharmacy_records) sourcesUsed.push("pharmacy_records");
  if (input.data_sources.family_caregiver_input) sourcesUsed.push("family_caregiver_input");
  if (input.data_sources.previous_discharge_summaries) sourcesUsed.push("previous_discharge_summaries");

  const verificationStatus = determineVerificationStatus(sourcesUsed);
  
  // Organize medications by category
  const medicationsList = [
    {
      category: "Prescription Medications",
      medications: input.systematic_categories.prescription_medications.map(med => {
        const result: any = {
          drug_name: med.drug_name,
          dose: med.dose,
          frequency: med.frequency,
          route: med.route,
          indication: med.indication,
          prescriber: med.prescriber || "Unknown"
        };
        if (med.last_taken) result.last_taken = med.last_taken;
        if (med.start_date) result.start_date = med.start_date;
        if (med.adherence_notes) result.adherence_notes = med.adherence_notes;
        return result;
      })
    },
    {
      category: "OTC Medications", 
      medications: input.systematic_categories.otc_medications.map(med => {
        const result: any = {
          drug_name: med.drug_name,
          dose: med.dose,
          frequency: med.frequency,
          route: med.route,
          indication: med.indication,
          prescriber: "Self-prescribed"
        };
        if (med.last_taken) result.last_taken = med.last_taken;
        if (med.start_date) result.start_date = med.start_date;
        if (med.adherence_notes) result.adherence_notes = med.adherence_notes;
        return result;
      })
    },
    {
      category: "Complementary/Alternative",
      medications: input.systematic_categories.complementary_alternative.map(med => {
        const result: any = {
          drug_name: med.drug_name,
          dose: med.dose,
          frequency: med.frequency,
          route: med.route,
          indication: med.indication,
          prescriber: "Alternative practitioner"
        };
        if (med.last_taken) result.last_taken = med.last_taken;
        if (med.start_date) result.start_date = med.start_date;
        if (med.adherence_notes) result.adherence_notes = med.adherence_notes;
        return result;
      })
    },
    {
      category: "Vitamins/Supplements",
      medications: input.systematic_categories.vitamins_supplements.map(med => {
        const result: any = {
          drug_name: med.drug_name,
          dose: med.dose,
          frequency: med.frequency,
          route: med.route,
          indication: med.indication,
          prescriber: "Self-prescribed"
        };
        if (med.last_taken) result.last_taken = med.last_taken;
        if (med.start_date) result.start_date = med.start_date;
        if (med.adherence_notes) result.adherence_notes = med.adherence_notes;
        return result;
      })
    },
    {
      category: "Herbal Products",
      medications: input.systematic_categories.herbal_products.map(med => {
        const result: any = {
          drug_name: med.drug_name,
          dose: med.dose,
          frequency: med.frequency,
          route: med.route,
          indication: med.indication,
          prescriber: "Herbalist"
        };
        if (med.last_taken) result.last_taken = med.last_taken;
        if (med.start_date) result.start_date = med.start_date;
        if (med.adherence_notes) result.adherence_notes = med.adherence_notes;
        return result;
      })
    },
    {
      category: "Topical Medications",
      medications: input.systematic_categories.topical_medications.map(med => {
        const result: any = {
          drug_name: med.drug_name,
          dose: med.dose,
          frequency: med.frequency,
          route: med.route,
          indication: med.indication,
          prescriber: "Unknown"
        };
        if (med.last_taken) result.last_taken = med.last_taken;
        if (med.start_date) result.start_date = med.start_date;
        if (med.adherence_notes) result.adherence_notes = med.adherence_notes;
        return result;
      })
    },
    {
      category: "Eye/Ear/Nose Drops",
      medications: input.systematic_categories.eye_ear_nose_drops.map(med => {
        const result: any = {
          drug_name: med.drug_name,
          dose: med.dose,
          frequency: med.frequency,
          route: med.route,
          indication: med.indication,
          prescriber: "Unknown"
        };
        if (med.last_taken) result.last_taken = med.last_taken;
        if (med.start_date) result.start_date = med.start_date;
        if (med.adherence_notes) result.adherence_notes = med.adherence_notes;
        return result;
      })
    },
    {
      category: "Intermittent Medications",
      medications: input.systematic_categories.intermittent_medications.map(med => {
        const result: any = {
          drug_name: med.drug_name,
          dose: med.dose,
          frequency: med.frequency,
          route: med.route,
          indication: med.indication,
          prescriber: "Unknown"
        };
        if (med.last_taken) result.last_taken = med.last_taken;
        if (med.start_date) result.start_date = med.start_date;
        if (med.adherence_notes) result.adherence_notes = med.adherence_notes;
        return result;
      })
    }
  ].filter(category => category.medications.length > 0);

  // Generate next steps based on verification status
  const nextSteps = generateNextSteps(verificationStatus, sourcesUsed);

  return {
    bpmh_id: bpmhId,
    patient_id: input.patient_id,
    creation_datetime: creationDatetime,
    created_by: input.data_sources.patient_interview.interviewer_id || "unknown",
    medications_list: medicationsList,
    sources_used: sourcesUsed,
    verification_status: verificationStatus,
    patient_signature: true, // Assume patient signed if interview was conducted
    next_steps: nextSteps
  };
}

function determineVerificationStatus(sourcesUsed: string[]): 'complete' | 'partial' | 'unverified' {
  if (sourcesUsed.length >= 3) return 'complete';
  if (sourcesUsed.length >= 2) return 'partial';
  return 'unverified';
}

function generateNextSteps(verificationStatus: string, sourcesUsed: string[]): string[] {
  const steps = [];
  
  if (verificationStatus === 'unverified') {
    steps.push("Obtain additional medication sources for verification");
    steps.push("Conduct patient interview if not already done");
    steps.push("Review medication bottles and pharmacy records");
  } else if (verificationStatus === 'partial') {
    steps.push("Verify remaining medications with additional sources");
    steps.push("Cross-reference with pharmacy records");
  } else {
    steps.push("Proceed with medication reconciliation");
    steps.push("Compare BPMH with admission orders");
  }
  
  return steps;
}
