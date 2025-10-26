/**
 * Verify Right Time Tool
 * Confirms medication timing is appropriate
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for time verification input
export const VerifyRightTimeSchema = z.object({
  order_details: z.object({
    ordered_frequency: z.string().describe("Ordered dosing frequency"),
    scheduled_time: z.string().describe("ISO8601 scheduled administration time"),
    time_critical: z.boolean().describe("Whether medication is time-critical"),
    administration_window: z.object({
      earliest: z.string().describe("ISO8601 earliest administration time"),
      latest: z.string().describe("ISO8601 latest administration time")
    })
  }),
  current_datetime: z.string().describe("ISO8601 current datetime"),
  last_dose: z.object({
    datetime: z.string().describe("ISO8601 datetime of last dose"),
    dose_given: z.string().describe("Dose that was given")
  }),
  patient_factors: z.object({
    fasting_required: z.boolean().describe("Whether fasting is required"),
    fasting_status: z.boolean().describe("Whether patient is currently fasting"),
    meal_timing: z.enum(['before', 'with', 'after']).describe("Meal timing requirement"),
    drug_interactions_timing: z.array(z.string()).describe("Drug interactions affecting timing")
  })
});

export type VerifyRightTimeInput = z.infer<typeof VerifyRightTimeSchema>;

// Time verification output
export interface TimeVerificationOutput {
  verification_result: {
    timing_appropriate: boolean;
    within_window: boolean;
    minimum_interval_met: boolean;
    meal_requirements_met: boolean;
    time_critical_status: {
      is_time_critical: boolean;
      deviation_minutes: number;
      deviation_acceptable: boolean;
    };
    can_proceed: boolean;
    recommended_action: 'give_now' | 'delay_until' | 'contact_prescriber';
    delay_until: string;
  };
}

// ===== TOOL REGISTRATION =====

export function registerVerifyRightTimeTool(server: McpServer): void {
  server.registerTool(
    "verify_right_time",
    {
      title: "Verify Right Time",
      description: `Confirms medication timing is appropriate following the Five Rights protocol.

**Purpose:** Ensure correct timing for medication administration.

**Input Parameters:**
- order_details: Ordered frequency and timing details
- current_datetime: Current time
- last_dose: Information about last dose given
- patient_factors: Patient-specific timing factors

**Process:**
1. Check if within administration window
2. Verify minimum interval from last dose
3. Check meal/fasting requirements
4. Consider drug interaction timing
5. Assess time-critical status

**Output:** Returns timing verification result with recommendations.`,
      inputSchema: VerifyRightTimeSchema.shape,
    },
    async (input: VerifyRightTimeInput): Promise<McpResponse<TimeVerificationOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(VerifyRightTimeSchema, input, "verify_right_time");

        // 2. Process time verification
        const verificationOutput = processTimeVerification(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(verificationOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in verify_right_time tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "verify_right_time", 
          userInput: input 
        });
      }
    }
  );
}

// ===== TIME VERIFICATION PROCESSING =====

function processTimeVerification(input: VerifyRightTimeInput): TimeVerificationOutput {
  const currentTime = new Date(input.current_datetime);
  const scheduledTime = new Date(input.order_details.scheduled_time);
  const earliestTime = new Date(input.order_details.administration_window.earliest);
  const latestTime = new Date(input.order_details.administration_window.latest);
  
  // Check if within administration window
  const withinWindow = currentTime >= earliestTime && currentTime <= latestTime;
  
  // Check minimum interval from last dose
  const minimumIntervalMet = checkMinimumInterval(input);
  
  // Check meal requirements
  const mealRequirementsMet = checkMealRequirements(input);
  
  // Check time-critical status
  const timeCriticalStatus = checkTimeCriticalStatus(input, currentTime, scheduledTime);
  
  // Determine if timing is appropriate
  const timingAppropriate = withinWindow && minimumIntervalMet && mealRequirementsMet;
  
  // Determine recommended action
  const recommendedAction = determineRecommendedAction(input, timingAppropriate, timeCriticalStatus);
  
  // Calculate delay until time if needed
  const delayUntil = calculateDelayUntil(input, recommendedAction);
  
  return {
    verification_result: {
      timing_appropriate: timingAppropriate,
      within_window: withinWindow,
      minimum_interval_met: minimumIntervalMet,
      meal_requirements_met: mealRequirementsMet,
      time_critical_status: timeCriticalStatus,
      can_proceed: timingAppropriate,
      recommended_action: recommendedAction,
      delay_until: delayUntil
    }
  };
}

function checkMinimumInterval(input: VerifyRightTimeInput): boolean {
  const currentTime = new Date(input.current_datetime);
  const lastDoseTime = new Date(input.last_dose.datetime);
  const timeDifference = (currentTime.getTime() - lastDoseTime.getTime()) / (1000 * 60); // minutes
  
  // Calculate minimum interval based on frequency
  const frequency = input.order_details.ordered_frequency.toLowerCase();
  let minimumInterval: number;
  
  if (frequency.includes('every 4 hours') || frequency.includes('q4h')) {
    minimumInterval = 240; // 4 hours
  } else if (frequency.includes('every 6 hours') || frequency.includes('q6h')) {
    minimumInterval = 360; // 6 hours
  } else if (frequency.includes('every 8 hours') || frequency.includes('q8h')) {
    minimumInterval = 480; // 8 hours
  } else if (frequency.includes('every 12 hours') || frequency.includes('q12h')) {
    minimumInterval = 720; // 12 hours
  } else if (frequency.includes('daily') || frequency.includes('qd')) {
    minimumInterval = 1440; // 24 hours
  } else if (frequency.includes('twice daily') || frequency.includes('bid')) {
    minimumInterval = 720; // 12 hours
  } else {
    minimumInterval = 240; // Default 4 hours
  }
  
  return timeDifference >= minimumInterval;
}

function checkMealRequirements(input: VerifyRightTimeInput): boolean {
  const mealTiming = input.patient_factors.meal_timing;
  const fastingRequired = input.patient_factors.fasting_required;
  const fastingStatus = input.patient_factors.fasting_status;
  
  // Check fasting requirements
  if (fastingRequired && !fastingStatus) {
    return false; // Fasting required but patient not fasting
  }
  
  // Check meal timing requirements
  if (mealTiming === 'before' && !fastingStatus) {
    return false; // Should be given before meals but patient not fasting
  }
  
  if (mealTiming === 'with' && fastingStatus) {
    return false; // Should be given with meals but patient is fasting
  }
  
  if (mealTiming === 'after' && fastingStatus) {
    return false; // Should be given after meals but patient is fasting
  }
  
  return true;
}

function checkTimeCriticalStatus(
  input: VerifyRightTimeInput,
  currentTime: Date,
  scheduledTime: Date
): {
  is_time_critical: boolean;
  deviation_minutes: number;
  deviation_acceptable: boolean;
} {
  const isTimeCritical = input.order_details.time_critical;
  const deviationMinutes = Math.abs((currentTime.getTime() - scheduledTime.getTime()) / (1000 * 60));
  
  let deviationAcceptable = true;
  
  if (isTimeCritical) {
    // For time-critical medications, allow 30 minutes deviation
    deviationAcceptable = deviationMinutes <= 30;
  } else {
    // For non-time-critical medications, allow 60 minutes deviation
    deviationAcceptable = deviationMinutes <= 60;
  }
  
  return {
    is_time_critical: isTimeCritical,
    deviation_minutes: deviationMinutes,
    deviation_acceptable: deviationAcceptable
  };
}

function determineRecommendedAction(
  input: VerifyRightTimeInput,
  timingAppropriate: boolean,
  timeCriticalStatus: { is_time_critical: boolean; deviation_minutes: number; deviation_acceptable: boolean; }
): 'give_now' | 'delay_until' | 'contact_prescriber' {
  if (timingAppropriate) {
    return 'give_now';
  }
  
  if (timeCriticalStatus.is_time_critical && !timeCriticalStatus.deviation_acceptable) {
    return 'contact_prescriber';
  }
  
  if (!timingAppropriate && !timeCriticalStatus.is_time_critical) {
    return 'delay_until';
  }
  
  return 'contact_prescriber';
}

function calculateDelayUntil(
  input: VerifyRightTimeInput,
  recommendedAction: 'give_now' | 'delay_until' | 'contact_prescriber'
): string {
  if (recommendedAction === 'give_now') {
    return new Date().toISOString();
  }
  
  if (recommendedAction === 'delay_until') {
    // Calculate next appropriate time
    const currentTime = new Date(input.current_datetime);
    const scheduledTime = new Date(input.order_details.scheduled_time);
    
    // If current time is before scheduled time, use scheduled time
    if (currentTime < scheduledTime) {
      return scheduledTime.toISOString();
    }
    
    // If current time is after scheduled time, calculate next dose time
    const frequency = input.order_details.ordered_frequency.toLowerCase();
    let nextDoseTime: Date;
    
    if (frequency.includes('every 4 hours') || frequency.includes('q4h')) {
      nextDoseTime = new Date(currentTime.getTime() + 4 * 60 * 60 * 1000);
    } else if (frequency.includes('every 6 hours') || frequency.includes('q6h')) {
      nextDoseTime = new Date(currentTime.getTime() + 6 * 60 * 60 * 1000);
    } else if (frequency.includes('every 8 hours') || frequency.includes('q8h')) {
      nextDoseTime = new Date(currentTime.getTime() + 8 * 60 * 60 * 1000);
    } else if (frequency.includes('every 12 hours') || frequency.includes('q12h')) {
      nextDoseTime = new Date(currentTime.getTime() + 12 * 60 * 60 * 1000);
    } else if (frequency.includes('daily') || frequency.includes('qd')) {
      nextDoseTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);
    } else if (frequency.includes('twice daily') || frequency.includes('bid')) {
      nextDoseTime = new Date(currentTime.getTime() + 12 * 60 * 60 * 1000);
    } else {
      nextDoseTime = new Date(currentTime.getTime() + 4 * 60 * 60 * 1000); // Default 4 hours
    }
    
    return nextDoseTime.toISOString();
  }
  
  return new Date().toISOString();
}
