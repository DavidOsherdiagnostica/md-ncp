/**
 * Monitor TDM Trends Tool
 * Tracks TDM results over time and identifies patterns
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for TDM trends monitoring input
export const MonitorTdmTrendsSchema = z.object({
  patient_id: z.string().min(1).describe("Unique patient identifier"),
  drug_name: z.string().describe("Name of the medication"),
  tdm_results: z.array(z.object({
    datetime: z.string().describe("ISO8601 datetime of TDM result"),
    concentration: z.number().describe("Measured concentration"),
    dose_at_time: z.string().describe("Dose being taken at time of measurement"),
    clinical_response: z.string().describe("Clinical response observed")
  })).min(2).describe("Array of TDM results (minimum 2 required)"),
  minimum_results: z.number().default(2).describe("Minimum number of results required for trend analysis")
});

export type MonitorTdmTrendsInput = z.infer<typeof MonitorTdmTrendsSchema>;

// TDM trends output
export interface TdmTrendsOutput {
  trend_analysis: {
    direction: 'increasing' | 'decreasing' | 'stable' | 'erratic';
    variability: 'low' | 'moderate' | 'high';
    therapeutic_stability: boolean;
    pattern_concerns: string[];
  };
  dose_response_relationship: {
    linear: boolean;
    predictable: boolean;
    factors_affecting: string[];
  };
  recommendations: {
    monitoring_frequency: string;
    dose_adjustment_strategy: string;
    additional_investigations: string[];
  };
  trend_chart_data: Array<{
    datetime: string;
    concentration: number;
    dose: string;
    therapeutic_range: {
      lower: number;
      upper: number;
    };
  }>;
}

// ===== TOOL REGISTRATION =====

export function registerMonitorTdmTrendsTool(server: McpServer): void {
  server.registerTool(
    "monitor_tdm_trends",
    {
      title: "Monitor TDM Trends",
      description: `Tracks TDM results over time and identifies patterns for clinical decision-making.

**Purpose:** Analyze trends in TDM results to optimize dosing and identify issues.

**Input Parameters:**
- patient_id: Unique patient identifier
- drug_name: Name of the medication
- tdm_results: Array of TDM results with timestamps
- minimum_results: Minimum results needed for analysis (default: 2)

**Process:**
1. Analyze concentration trends over time
2. Assess variability and stability
3. Evaluate dose-response relationship
4. Identify factors affecting drug levels
5. Generate monitoring recommendations

**Output:** Returns trend analysis with recommendations for ongoing monitoring.`,
      inputSchema: MonitorTdmTrendsSchema.shape,
    },
    async (input: MonitorTdmTrendsInput): Promise<McpResponse<TdmTrendsOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(MonitorTdmTrendsSchema, input, "monitor_tdm_trends");

        // 2. Process TDM trends analysis
        const trendsOutput = processTdmTrendsAnalysis({
          ...validatedInput,
          minimum_results: validatedInput.minimum_results || 2
        });

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(trendsOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in monitor_tdm_trends tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "monitor_tdm_trends", 
          userInput: input 
        });
      }
    }
  );
}

// ===== TDM TRENDS ANALYSIS PROCESSING =====

function processTdmTrendsAnalysis(input: MonitorTdmTrendsInput): TdmTrendsOutput {
  // Sort results by datetime
  const sortedResults = input.tdm_results.sort((a, b) => 
    new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );
  
  // Analyze trends
  const trendAnalysis = analyzeTrends(sortedResults);
  
  // Analyze dose-response relationship
  const doseResponseAnalysis = analyzeDoseResponseRelationship(sortedResults);
  
  // Generate recommendations
  const recommendations = generateTrendRecommendations(trendAnalysis, doseResponseAnalysis, input.drug_name);
  
  // Create trend chart data
  const trendChartData = createTrendChartData(sortedResults, input.drug_name);
  
  return {
    trend_analysis: trendAnalysis,
    dose_response_relationship: doseResponseAnalysis,
    recommendations: recommendations,
    trend_chart_data: trendChartData
  };
}

function analyzeTrends(results: Array<{
  datetime: string;
  concentration: number;
  dose_at_time: string;
  clinical_response: string;
}>): {
  direction: 'increasing' | 'decreasing' | 'stable' | 'erratic';
  variability: 'low' | 'moderate' | 'high';
  therapeutic_stability: boolean;
  pattern_concerns: string[];
} {
  const concentrations = results.map(r => r.concentration);
  const patternConcerns: string[] = [];
  
  // Calculate trend direction
  const firstHalf = concentrations.slice(0, Math.ceil(concentrations.length / 2));
  const secondHalf = concentrations.slice(Math.floor(concentrations.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const percentChange = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
  
  let direction: 'increasing' | 'decreasing' | 'stable' | 'erratic';
  if (Math.abs(percentChange) < 10) {
    direction = 'stable';
  } else if (percentChange > 20) {
    direction = 'increasing';
  } else if (percentChange < -20) {
    direction = 'decreasing';
  } else {
    direction = 'erratic';
  }
  
  // Calculate variability (coefficient of variation)
  const mean = concentrations.reduce((a, b) => a + b, 0) / concentrations.length;
  const variance = concentrations.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / concentrations.length;
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = (standardDeviation / mean) * 100;
  
  let variability: 'low' | 'moderate' | 'high';
  if (coefficientOfVariation < 15) {
    variability = 'low';
  } else if (coefficientOfVariation < 30) {
    variability = 'moderate';
  } else {
    variability = 'high';
  }
  
  // Assess therapeutic stability
  const therapeuticStability = direction === 'stable' && variability === 'low';
  
  // Identify pattern concerns
  if (direction === 'increasing' && secondHalfAvg > firstHalfAvg * 1.5) {
    patternConcerns.push('Rapidly increasing drug levels - risk of toxicity');
  }
  
  if (direction === 'decreasing' && secondHalfAvg < firstHalfAvg * 0.5) {
    patternConcerns.push('Rapidly decreasing drug levels - risk of therapeutic failure');
  }
  
  if (variability === 'high') {
    patternConcerns.push('High variability in drug levels - inconsistent dosing or absorption');
  }
  
  if (direction === 'erratic') {
    patternConcerns.push('Erratic drug level pattern - possible non-compliance or drug interactions');
  }
  
  return {
    direction,
    variability,
    therapeutic_stability: therapeuticStability,
    pattern_concerns: patternConcerns
  };
}

function analyzeDoseResponseRelationship(results: Array<{
  datetime: string;
  concentration: number;
  dose_at_time: string;
  clinical_response: string;
}>): {
  linear: boolean;
  predictable: boolean;
  factors_affecting: string[];
} {
  const factorsAffecting: string[] = [];
  
  // Analyze dose-concentration relationship
  const doseConcentrationPairs = results.map(r => {
    const doseParts = r.dose_at_time.split(' ');
    return {
      dose: parseFloat(doseParts[0] || '0') || 0,
      concentration: r.concentration
    };
  });
  
  // Simple linear regression analysis
  const n = doseConcentrationPairs.length;
  const sumX = doseConcentrationPairs.reduce((a, b) => a + b.dose, 0);
  const sumY = doseConcentrationPairs.reduce((a, b) => a + b.concentration, 0);
  const sumXY = doseConcentrationPairs.reduce((a, b) => a + (b.dose * b.concentration), 0);
  const sumXX = doseConcentrationPairs.reduce((a, b) => a + (b.dose * b.dose), 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const correlation = Math.abs(slope) > 0.1; // Simple correlation check
  
  // Assess predictability
  const concentrationChanges = [];
  for (let i = 1; i < results.length; i++) {
    const prevResult = results[i-1];
    const currResult = results[i];
    if (!prevResult || !currResult) continue;
    
    const prevConc = prevResult.concentration;
    const currConc = currResult.concentration;
    const change = ((currConc - prevConc) / prevConc) * 100;
    concentrationChanges.push(Math.abs(change));
  }
  
  const avgChange = concentrationChanges.reduce((a, b) => a + b, 0) / concentrationChanges.length;
  const predictable = avgChange < 25; // Less than 25% average change
  
  // Identify factors affecting drug levels
  if (!correlation) {
    factorsAffecting.push('Non-linear dose-response relationship');
  }
  
  if (!predictable) {
    factorsAffecting.push('Unpredictable drug level changes');
  }
  
  // Check for clinical response correlation
  const responseCorrelation = results.every(r => 
    r.clinical_response === 'adequate' || r.clinical_response === 'good'
  );
  
  if (!responseCorrelation) {
    factorsAffecting.push('Poor correlation between drug levels and clinical response');
  }
  
  return {
    linear: correlation,
    predictable: predictable,
    factors_affecting: factorsAffecting
  };
}

function generateTrendRecommendations(
  trendAnalysis: {
    direction: string;
    variability: string;
    therapeutic_stability: boolean;
    pattern_concerns: string[];
  },
  doseResponseAnalysis: {
    linear: boolean;
    predictable: boolean;
    factors_affecting: string[];
  },
  drugName: string
): {
  monitoring_frequency: string;
  dose_adjustment_strategy: string;
  additional_investigations: string[];
} {
  let monitoringFrequency = 'Weekly';
  let doseAdjustmentStrategy = 'Maintain current dosing';
  const additionalInvestigations: string[] = [];
  
  if (trendAnalysis.therapeutic_stability) {
    monitoringFrequency = 'Every 2 weeks';
    doseAdjustmentStrategy = 'Continue current regimen';
  } else if (trendAnalysis.direction === 'increasing') {
    monitoringFrequency = 'Every 3-5 days';
    doseAdjustmentStrategy = 'Consider dose reduction';
    additionalInvestigations.push('Check for drug interactions');
    additionalInvestigations.push('Assess organ function');
  } else if (trendAnalysis.direction === 'decreasing') {
    monitoringFrequency = 'Every 3-5 days';
    doseAdjustmentStrategy = 'Consider dose increase';
    additionalInvestigations.push('Assess patient compliance');
    additionalInvestigations.push('Check for drug interactions');
  } else if (trendAnalysis.variability === 'high') {
    monitoringFrequency = 'Every 2-3 days';
    doseAdjustmentStrategy = 'Investigate cause of variability';
    additionalInvestigations.push('Assess patient compliance');
    additionalInvestigations.push('Review drug interactions');
    additionalInvestigations.push('Consider therapeutic drug monitoring consultation');
  }
  
  if (!doseResponseAnalysis.linear) {
    additionalInvestigations.push('Consider non-linear pharmacokinetics');
  }
  
  if (!doseResponseAnalysis.predictable) {
    additionalInvestigations.push('Consider therapeutic drug monitoring consultation');
  }
  
  return {
    monitoring_frequency: monitoringFrequency,
    dose_adjustment_strategy: doseAdjustmentStrategy,
    additional_investigations: additionalInvestigations
  };
}

function createTrendChartData(
  results: Array<{
    datetime: string;
    concentration: number;
    dose_at_time: string;
    clinical_response: string;
  }>,
  drugName: string
): Array<{
  datetime: string;
  concentration: number;
  dose: string;
  therapeutic_range: {
    lower: number;
    upper: number;
  };
}> {
  // Get therapeutic range based on drug (simplified)
  const therapeuticRanges: Record<string, { lower: number; upper: number }> = {
    'vancomycin': { lower: 10, upper: 20 },
    'digoxin': { lower: 0.8, upper: 2.0 },
    'phenytoin': { lower: 10, upper: 20 },
    'lithium': { lower: 0.6, upper: 1.2 }
  };
  
  const therapeuticRange = therapeuticRanges[drugName.toLowerCase()] || { lower: 0, upper: 100 };
  
  return results.map(r => ({
    datetime: r.datetime,
    concentration: r.concentration,
    dose: r.dose_at_time,
    therapeutic_range: therapeuticRange
  }));
}
