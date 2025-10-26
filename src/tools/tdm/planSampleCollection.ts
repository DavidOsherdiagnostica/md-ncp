/**
 * Plan Sample Collection Tool
 * Generates detailed instructions for TDM blood sample collection
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for sample collection planning input
export const PlanSampleCollectionSchema = z.object({
  patient_id: z.string().min(1).describe("Unique patient identifier"),
  drug_name: z.string().describe("Name of the medication"),
  dosing_regimen: z.object({
    dose: z.string().describe("Dose with units"),
    frequency: z.string().describe("Dosing frequency"),
    route: z.enum(['oral', 'iv_bolus', 'iv_infusion']).describe("Route of administration"),
    infusion_duration: z.number().optional().describe("Infusion duration in minutes (if applicable)"),
    last_dose_datetime: z.string().describe("ISO8601 datetime of last dose"),
    next_dose_datetime: z.string().describe("ISO8601 datetime of next scheduled dose")
  }),
  sample_type_required: z.enum(['trough', 'peak', 'both', 'random']).describe("Type of sample required"),
  steady_state_datetime: z.string().describe("ISO8601 datetime when steady state is reached")
});

export type PlanSampleCollectionInput = z.infer<typeof PlanSampleCollectionSchema>;

// Sample collection plan output
export interface SampleCollectionOutput {
  collection_plan_id: string;
  sample_collection_windows: Array<{
    sample_type: 'trough' | 'peak';
    earliest_time: string;
    optimal_time: string;
    latest_time: string;
    timing_rationale: string;
  }>;
  specimen_requirements: {
    type: 'serum' | 'plasma' | 'whole_blood';
    volume_ml: number;
    collection_tube: string;
    special_handling: string[];
  };
  critical_timing_notes: string[];
  documentation_required: {
    dose_time: boolean;
    collection_time: boolean;
    infusion_duration: boolean;
    concurrent_medications: boolean;
  };
}

// ===== TOOL REGISTRATION =====

export function registerPlanSampleCollectionTool(server: McpServer): void {
  server.registerTool(
    "plan_sample_collection",
    {
      title: "Plan Sample Collection",
      description: `Generates detailed instructions for TDM blood sample collection with optimal timing.

**Purpose:** Provide precise timing and collection instructions for TDM samples.

**Input Parameters:**
- patient_id: Unique patient identifier
- drug_name: Name of the medication
- dosing_regimen: Current dosing details
- sample_type_required: Type of sample needed (trough, peak, both, random)
- steady_state_datetime: When steady state is reached

**Process:**
1. For trough: 0-60 minutes before next dose
2. For peak oral: 1-2 hours post-dose (drug dependent)
3. For peak IV bolus: ≥1 hour post-dose (avoid distribution phase)
4. For peak IV infusion: 30 min after infusion completion
5. Ensure steady state reached (or document reason for early sampling)

**Output:** Returns detailed collection plan with timing windows and specimen requirements.`,
      inputSchema: PlanSampleCollectionSchema.shape,
    },
    async (input: PlanSampleCollectionInput): Promise<McpResponse<SampleCollectionOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(PlanSampleCollectionSchema, input, "plan_sample_collection");

        // 2. Process sample collection planning
        const collectionOutput = processSampleCollectionPlanning(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(collectionOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in plan_sample_collection tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "plan_sample_collection", 
          userInput: input 
        });
      }
    }
  );
}

// ===== SAMPLE COLLECTION PLANNING PROCESSING =====

function processSampleCollectionPlanning(input: PlanSampleCollectionInput): SampleCollectionOutput {
  const collectionPlanId = `scp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Calculate collection windows based on sample type and dosing regimen
  const collectionWindows = calculateCollectionWindows(input);
  
  // Determine specimen requirements based on drug
  const specimenRequirements = determineSpecimenRequirements(input.drug_name);
  
  // Generate critical timing notes
  const criticalTimingNotes = generateCriticalTimingNotes(input);
  
  // Determine documentation requirements
  const documentationRequired = {
    dose_time: true,
    collection_time: true,
    infusion_duration: input.dosing_regimen.route.includes('iv'),
    concurrent_medications: true
  };
  
  return {
    collection_plan_id: collectionPlanId,
    sample_collection_windows: collectionWindows,
    specimen_requirements: specimenRequirements,
    critical_timing_notes: criticalTimingNotes,
    documentation_required: documentationRequired
  };
}

function calculateCollectionWindows(input: PlanSampleCollectionInput): Array<{
  sample_type: 'trough' | 'peak';
  earliest_time: string;
  optimal_time: string;
  latest_time: string;
  timing_rationale: string;
}> {
  const windows: Array<{
    sample_type: 'trough' | 'peak';
    earliest_time: string;
    optimal_time: string;
    latest_time: string;
    timing_rationale: string;
  }> = [];
  
  const lastDoseTime = new Date(input.dosing_regimen.last_dose_datetime);
  const nextDoseTime = new Date(input.dosing_regimen.next_dose_datetime);
  
  // Calculate trough window (0-60 minutes before next dose)
  if (input.sample_type_required === 'trough' || input.sample_type_required === 'both') {
    const troughEarliest = new Date(nextDoseTime.getTime() - 60 * 60 * 1000); // 1 hour before
    const troughOptimal = new Date(nextDoseTime.getTime() - 30 * 60 * 1000); // 30 minutes before
    const troughLatest = new Date(nextDoseTime.getTime() - 5 * 60 * 1000); // 5 minutes before
    
    windows.push({
      sample_type: 'trough',
      earliest_time: troughEarliest.toISOString(),
      optimal_time: troughOptimal.toISOString(),
      latest_time: troughLatest.toISOString(),
      timing_rationale: 'Trough levels should be drawn 0-60 minutes before next dose to measure minimum concentration'
    });
  }
  
  // Calculate peak window based on route
  if (input.sample_type_required === 'peak' || input.sample_type_required === 'both') {
    let peakTiming: { earliest: number; optimal: number; latest: number } = { earliest: 60, optimal: 90, latest: 120 };
    let rationale: string = 'Peak levels typically occur 1-2 hours post-dose';
    
    switch (input.dosing_regimen.route) {
      case 'oral':
        peakTiming = { earliest: 60, optimal: 90, latest: 120 }; // 1-2 hours post-dose
        rationale = 'Oral medications: peak levels typically occur 1-2 hours post-dose';
        break;
      case 'iv_bolus':
        peakTiming = { earliest: 60, optimal: 90, latest: 120 }; // ≥1 hour post-dose
        rationale = 'IV bolus: allow distribution phase to complete (≥1 hour post-dose)';
        break;
      case 'iv_infusion':
        const infusionEndTime = new Date(lastDoseTime.getTime() + (input.dosing_regimen.infusion_duration || 0) * 60 * 1000);
        const peakEarliest = new Date(infusionEndTime.getTime() + 15 * 60 * 1000); // 15 min after infusion
        const peakOptimal = new Date(infusionEndTime.getTime() + 30 * 60 * 1000); // 30 min after infusion
        const peakLatest = new Date(infusionEndTime.getTime() + 60 * 60 * 1000); // 1 hour after infusion
        
        windows.push({
          sample_type: 'peak',
          earliest_time: peakEarliest.toISOString(),
          optimal_time: peakOptimal.toISOString(),
          latest_time: peakLatest.toISOString(),
          timing_rationale: 'IV infusion: peak levels 30 minutes after infusion completion'
        });
        break;
    }
    
    if (input.dosing_regimen.route !== 'iv_infusion') {
      const peakEarliest = new Date(lastDoseTime.getTime() + peakTiming.earliest * 60 * 1000);
      const peakOptimal = new Date(lastDoseTime.getTime() + peakTiming.optimal * 60 * 1000);
      const peakLatest = new Date(lastDoseTime.getTime() + peakTiming.latest * 60 * 1000);
      
      windows.push({
        sample_type: 'peak',
        earliest_time: peakEarliest.toISOString(),
        optimal_time: peakOptimal.toISOString(),
        latest_time: peakLatest.toISOString(),
        timing_rationale: rationale
      });
    }
  }
  
  return windows;
}

function determineSpecimenRequirements(drugName: string): {
  type: 'serum' | 'plasma' | 'whole_blood';
  volume_ml: number;
  collection_tube: string;
  special_handling: string[];
} {
  const drugLower = drugName.toLowerCase();
  
  // Drug-specific specimen requirements
  if (drugLower.includes('vancomycin') || drugLower.includes('gentamicin') || drugLower.includes('tobramycin')) {
    return {
      type: 'serum',
      volume_ml: 2,
      collection_tube: 'Red top (serum separator tube)',
      special_handling: ['Centrifuge within 2 hours', 'Store at 2-8°C if not processed immediately']
    };
  } else if (drugLower.includes('digoxin') || drugLower.includes('phenytoin') || drugLower.includes('lithium')) {
    return {
      type: 'serum',
      volume_ml: 3,
      collection_tube: 'Red top (serum separator tube)',
      special_handling: ['Allow to clot for 30 minutes', 'Centrifuge within 4 hours']
    };
  } else {
    // Default requirements
    return {
      type: 'serum',
      volume_ml: 2,
      collection_tube: 'Red top (serum separator tube)',
      special_handling: ['Standard serum processing']
    };
  }
}

function generateCriticalTimingNotes(input: PlanSampleCollectionInput): string[] {
  const notes: string[] = [];
  
  // Check if steady state has been reached
  const steadyStateTime = new Date(input.steady_state_datetime);
  const now = new Date();
  
  if (now < steadyStateTime) {
    notes.push(`WARNING: Steady state not yet reached. Expected at ${steadyStateTime.toISOString()}`);
    notes.push('Consider delaying sample collection until steady state is achieved');
  }
  
  // Route-specific notes
  if (input.dosing_regimen.route === 'iv_infusion') {
    notes.push('Ensure infusion is completely finished before drawing peak sample');
    notes.push('Document exact time of infusion completion');
  }
  
  if (input.dosing_regimen.route === 'oral') {
    notes.push('Ensure patient has not missed any recent doses');
    notes.push('Document if patient took dose with food (may affect absorption)');
  }
  
  // General critical notes
  notes.push('Document exact time of last dose administration');
  notes.push('Document exact time of sample collection');
  notes.push('Ensure patient is not receiving concurrent medications that may interfere');
  
  return notes;
}
