/**
 * Calculate Steady State Tool
 * Calculates when drug reaches steady state for optimal TDM sampling
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for steady state calculation input
export const CalculateSteadyStateSchema = z.object({
  drug_name: z.string().describe("Name of the medication"),
  drug_half_life: z.number().describe("Drug half-life in hours"),
  dosing_start_datetime: z.string().describe("ISO8601 datetime when dosing started"),
  loading_dose_given: z.boolean().describe("Whether a loading dose was given"),
  patient_factors: z.object({
    renal_impairment: z.enum(['none', 'mild', 'moderate', 'severe', 'esrd']).describe("Level of renal impairment"),
    hepatic_impairment: z.enum(['none', 'mild', 'moderate', 'severe']).describe("Level of hepatic impairment"),
    age_years: z.number().describe("Patient age in years"),
    concurrent_enzyme_inducers: z.array(z.string()).describe("Concurrent enzyme-inducing medications"),
    concurrent_enzyme_inhibitors: z.array(z.string()).describe("Concurrent enzyme-inhibiting medications")
  })
});

export type CalculateSteadyStateInput = z.infer<typeof CalculateSteadyStateSchema>;

// Steady state calculation output
export interface SteadyStateOutput {
  steady_state_datetime: string;
  earliest_sample_datetime: string;
  confidence_level: 'high' | 'medium' | 'low';
  adjustment_factors: Array<{
    factor: string;
    impact: 'increases' | 'decreases' | 'no_effect';
    description: string;
  }>;
  special_considerations: string[];
  recommend_early_monitoring: boolean;
  early_monitoring_reason?: string;
}

// ===== TOOL REGISTRATION =====

export function registerCalculateSteadyStateTool(server: McpServer): void {
  server.registerTool(
    "calculate_steady_state",
    {
      title: "Calculate Steady State",
      description: `Calculates when a drug reaches steady state for optimal TDM sampling timing.

**Purpose:** Determine optimal timing for TDM sample collection based on pharmacokinetics.

**Input Parameters:**
- drug_name: Name of the medication
- drug_half_life: Half-life in hours
- dosing_start_datetime: When dosing started
- loading_dose_given: Whether loading dose was administered
- patient_factors: Patient-specific factors affecting metabolism

**Process:**
1. Calculate 4-5 half-lives from start
2. Adjust for loading dose (may reach earlier)
3. Adjust for organ impairment (may take longer)
4. Consider drug-drug interactions affecting metabolism

**Output:** Returns steady state timing with confidence level and adjustment factors.`,
      inputSchema: CalculateSteadyStateSchema.shape,
    },
    async (input: CalculateSteadyStateInput): Promise<McpResponse<SteadyStateOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(CalculateSteadyStateSchema, input, "calculate_steady_state");

        // 2. Process steady state calculation
        const steadyStateOutput = processSteadyStateCalculation(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(steadyStateOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in calculate_steady_state tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "calculate_steady_state", 
          userInput: input 
        });
      }
    }
  );
}

// ===== STEADY STATE CALCULATION PROCESSING =====

function processSteadyStateCalculation(input: CalculateSteadyStateInput): SteadyStateOutput {
  const startDate = new Date(input.dosing_start_datetime);
  
  // Base calculation: 4-5 half-lives for steady state
  const baseHalfLives = 4.5; // Use 4.5 as a conservative estimate
  const baseSteadyStateHours = input.drug_half_life * baseHalfLives;
  
  // Calculate adjustment factors
  const adjustmentFactors = calculateAdjustmentFactors(input);
  
  // Apply adjustments
  let adjustedHours = baseSteadyStateHours;
  let confidenceLevel: 'high' | 'medium' | 'low' = 'high';
  
  // Loading dose adjustment
  if (input.loading_dose_given) {
    adjustedHours = adjustedHours * 0.7; // Loading dose reduces time to steady state
    adjustmentFactors.push({
      factor: 'Loading dose administered',
      impact: 'decreases',
      description: 'Loading dose reduces time to steady state by approximately 30%'
    });
  }
  
  // Renal impairment adjustment
  if (input.patient_factors.renal_impairment !== 'none') {
    const renalMultiplier = getRenalImpairmentMultiplier(input.patient_factors.renal_impairment);
    adjustedHours = adjustedHours * renalMultiplier;
    confidenceLevel = 'medium';
    adjustmentFactors.push({
      factor: `Renal impairment (${input.patient_factors.renal_impairment})`,
      impact: renalMultiplier > 1 ? 'increases' : 'decreases',
      description: `Renal impairment affects drug elimination, ${renalMultiplier > 1 ? 'increasing' : 'decreasing'} time to steady state`
    });
  }
  
  // Hepatic impairment adjustment
  if (input.patient_factors.hepatic_impairment !== 'none') {
    const hepaticMultiplier = getHepaticImpairmentMultiplier(input.patient_factors.hepatic_impairment);
    adjustedHours = adjustedHours * hepaticMultiplier;
    confidenceLevel = 'medium';
    adjustmentFactors.push({
      factor: `Hepatic impairment (${input.patient_factors.hepatic_impairment})`,
      impact: hepaticMultiplier > 1 ? 'increases' : 'decreases',
      description: `Hepatic impairment affects drug metabolism, ${hepaticMultiplier > 1 ? 'increasing' : 'decreasing'} time to steady state`
    });
  }
  
  // Drug interaction adjustments
  if (input.patient_factors.concurrent_enzyme_inducers.length > 0) {
    adjustedHours = adjustedHours * 0.8; // Enzyme inducers decrease time to steady state
    adjustmentFactors.push({
      factor: 'Concurrent enzyme inducers',
      impact: 'decreases',
      description: 'Enzyme inducers increase drug metabolism, reducing time to steady state'
    });
  }
  
  if (input.patient_factors.concurrent_enzyme_inhibitors.length > 0) {
    adjustedHours = adjustedHours * 1.2; // Enzyme inhibitors increase time to steady state
    adjustmentFactors.push({
      factor: 'Concurrent enzyme inhibitors',
      impact: 'increases',
      description: 'Enzyme inhibitors decrease drug metabolism, increasing time to steady state'
    });
  }
  
  // Age adjustment
  if (input.patient_factors.age_years > 75) {
    adjustedHours = adjustedHours * 1.1; // Elderly patients may have slower metabolism
    adjustmentFactors.push({
      factor: 'Advanced age (>75 years)',
      impact: 'increases',
      description: 'Advanced age may slow drug metabolism and elimination'
    });
  }
  
  // Calculate final datetimes
  const steadyStateDatetime = new Date(startDate.getTime() + adjustedHours * 60 * 60 * 1000).toISOString();
  const earliestSampleDatetime = new Date(startDate.getTime() + (adjustedHours * 0.8) * 60 * 60 * 1000).toISOString();
  
  // Determine if early monitoring is recommended
  const recommendEarlyMonitoring = shouldRecommendEarlyMonitoring(input, adjustedHours);
  
  // Generate special considerations
  const specialConsiderations = generateSpecialConsiderations(input, adjustedHours);
  
  return {
    steady_state_datetime: steadyStateDatetime,
    earliest_sample_datetime: earliestSampleDatetime,
    confidence_level: confidenceLevel,
    adjustment_factors: adjustmentFactors,
    special_considerations: specialConsiderations,
    recommend_early_monitoring: recommendEarlyMonitoring,
    early_monitoring_reason: recommendEarlyMonitoring ? 
      'Patient has risk factors that may affect drug kinetics' : 'No early monitoring required'
  };
}

function calculateAdjustmentFactors(input: CalculateSteadyStateInput): Array<{
  factor: string;
  impact: 'increases' | 'decreases' | 'no_effect';
  description: string;
}> {
  const factors: Array<{
    factor: string;
    impact: 'increases' | 'decreases' | 'no_effect';
    description: string;
  }> = [];
  
  // Add base factor
  factors.push({
    factor: 'Standard pharmacokinetics',
    impact: 'no_effect',
    description: `Base calculation using ${input.drug_half_life} hour half-life`
  });
  
  return factors;
}

function getRenalImpairmentMultiplier(impairment: string): number {
  switch (impairment) {
    case 'mild': return 1.1;
    case 'moderate': return 1.3;
    case 'severe': return 1.6;
    case 'esrd': return 2.0;
    default: return 1.0;
  }
}

function getHepaticImpairmentMultiplier(impairment: string): number {
  switch (impairment) {
    case 'mild': return 1.2;
    case 'moderate': return 1.5;
    case 'severe': return 2.0;
    default: return 1.0;
  }
}

function shouldRecommendEarlyMonitoring(input: CalculateSteadyStateInput, adjustedHours: number): boolean {
  // Recommend early monitoring for high-risk scenarios
  return (
    input.patient_factors.renal_impairment === 'severe' ||
    input.patient_factors.hepatic_impairment === 'severe' ||
    input.patient_factors.age_years > 80 ||
    adjustedHours > 72 // More than 3 days
  );
}

function generateSpecialConsiderations(input: CalculateSteadyStateInput, adjustedHours: number): string[] {
  const considerations: string[] = [];
  
  if (input.patient_factors.renal_impairment !== 'none') {
    considerations.push('Monitor renal function during therapy');
  }
  
  if (input.patient_factors.hepatic_impairment !== 'none') {
    considerations.push('Monitor hepatic function during therapy');
  }
  
  if (input.patient_factors.concurrent_enzyme_inducers.length > 0) {
    considerations.push('Monitor for decreased drug levels due to enzyme induction');
  }
  
  if (input.patient_factors.concurrent_enzyme_inhibitors.length > 0) {
    considerations.push('Monitor for increased drug levels due to enzyme inhibition');
  }
  
  if (adjustedHours > 48) {
    considerations.push('Consider loading dose if not already given');
  }
  
  return considerations;
}
