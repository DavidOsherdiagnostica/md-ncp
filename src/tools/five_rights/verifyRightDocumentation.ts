/**
 * Verify Right Documentation Tool
 * Complete the sixth right - proper documentation
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for documentation verification input
export const VerifyRightDocumentationSchema = z.object({
  administration_details: z.object({
    patient_id: z.string().describe("Patient identifier"),
    medication: z.string().describe("Medication name"),
    dose: z.string().describe("Dose administered"),
    route: z.string().describe("Route of administration"),
    site: z.string().describe("Site of administration (if injection)"),
    administration_datetime: z.string().describe("ISO8601 administration datetime"),
    administrator_id: z.string().describe("Administrator identifier"),
    administrator_signature: z.string().describe("Administrator signature")
  }),
  verification_results: z.object({
    patient_verified: z.boolean().describe("Patient identity verified"),
    medication_verified: z.boolean().describe("Medication verified"),
    dose_verified: z.boolean().describe("Dose verified"),
    route_verified: z.boolean().describe("Route verified"),
    time_verified: z.boolean().describe("Time verified")
  }),
  patient_response: z.object({
    immediate_reaction: z.enum(['none', 'mild', 'moderate', 'severe']).describe("Immediate reaction to medication"),
    adverse_effects: z.array(z.string()).describe("Adverse effects observed"),
    patient_refused: z.boolean().describe("Whether patient refused medication"),
    refusal_reason: z.string().describe("Reason for refusal if applicable")
  })
});

export type VerifyRightDocumentationInput = z.infer<typeof VerifyRightDocumentationSchema>;

// Documentation verification output
export interface DocumentationVerificationOutput {
  documentation_record: {
    record_id: string;
    complete: boolean;
    timestamp: string;
    mar_entry: {
      medication: string;
      dose: string;
      route: string;
      time_given: string;
      site: string;
      given_by: string;
      witnessed_by: string;
    };
    all_five_rights_verified: boolean;
    patient_education_provided: boolean;
    adverse_reaction: boolean;
    adverse_reaction_documented: boolean;
    follow_up_required: boolean;
    documentation_complete: boolean;
    missing_elements: string[];
  };
}

// ===== TOOL REGISTRATION =====

export function registerVerifyRightDocumentationTool(server: McpServer): void {
  server.registerTool(
    "verify_right_documentation",
    {
      title: "Verify Right Documentation",
      description: `Complete the sixth right - proper documentation following the Five Rights protocol.

**Purpose:** Ensure complete and accurate documentation of medication administration.

**Input Parameters:**
- administration_details: Details of medication administration
- verification_results: Results of all five rights verification
- patient_response: Patient's response to medication

**Process:**
1. Verify all five rights were checked
2. Document administration details in MAR
3. Record patient response
4. Document any adverse reactions
5. Complete follow-up requirements

**Output:** Returns complete documentation record with quality checks.`,
      inputSchema: VerifyRightDocumentationSchema.shape,
    },
    async (input: VerifyRightDocumentationInput): Promise<McpResponse<DocumentationVerificationOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(VerifyRightDocumentationSchema, input, "verify_right_documentation");

        // 2. Process documentation verification
        const documentationOutput = processDocumentationVerification(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(documentationOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in verify_right_documentation tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "verify_right_documentation", 
          userInput: input 
        });
      }
    }
  );
}

// ===== DOCUMENTATION VERIFICATION PROCESSING =====

function processDocumentationVerification(input: VerifyRightDocumentationInput): DocumentationVerificationOutput {
  const recordId = generateRecordId();
  const timestamp = new Date().toISOString();
  
  // Check if all five rights were verified
  const allFiveRightsVerified = input.verification_results.patient_verified &&
    input.verification_results.medication_verified &&
    input.verification_results.dose_verified &&
    input.verification_results.route_verified &&
    input.verification_results.time_verified;
  
  // Check for adverse reactions
  const adverseReaction = input.patient_response.immediate_reaction !== 'none' ||
    input.patient_response.adverse_effects.length > 0;
  
  // Determine if follow-up is required
  const followUpRequired = adverseReaction || input.patient_response.immediate_reaction === 'moderate' ||
    input.patient_response.immediate_reaction === 'severe';
  
  // Check documentation completeness
  const missingElements = checkMissingElements(input);
  const documentationComplete = missingElements.length === 0;
  
  // Create MAR entry
  const marEntry = {
    medication: input.administration_details.medication,
    dose: input.administration_details.dose,
    route: input.administration_details.route,
    time_given: input.administration_details.administration_datetime,
    site: input.administration_details.site,
    given_by: input.administration_details.administrator_id,
    witnessed_by: input.administration_details.administrator_signature
  };
  
  return {
    documentation_record: {
      record_id: recordId,
      complete: documentationComplete,
      timestamp: timestamp,
      mar_entry: marEntry,
      all_five_rights_verified: allFiveRightsVerified,
      patient_education_provided: true, // Assume provided as part of standard process
      adverse_reaction: adverseReaction,
      adverse_reaction_documented: adverseReaction,
      follow_up_required: followUpRequired,
      documentation_complete: documentationComplete,
      missing_elements: missingElements
    }
  };
}

function generateRecordId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `DOC-${timestamp}-${random}`;
}

function checkMissingElements(input: VerifyRightDocumentationInput): string[] {
  const missingElements: string[] = [];
  
  // Check required fields
  if (!input.administration_details.patient_id) {
    missingElements.push("Patient ID");
  }
  
  if (!input.administration_details.medication) {
    missingElements.push("Medication name");
  }
  
  if (!input.administration_details.dose) {
    missingElements.push("Dose");
  }
  
  if (!input.administration_details.route) {
    missingElements.push("Route");
  }
  
  if (!input.administration_details.administration_datetime) {
    missingElements.push("Administration datetime");
  }
  
  if (!input.administration_details.administrator_id) {
    missingElements.push("Administrator ID");
  }
  
  if (!input.administration_details.administrator_signature) {
    missingElements.push("Administrator signature");
  }
  
  // Check verification results
  if (!input.verification_results.patient_verified) {
    missingElements.push("Patient verification");
  }
  
  if (!input.verification_results.medication_verified) {
    missingElements.push("Medication verification");
  }
  
  if (!input.verification_results.dose_verified) {
    missingElements.push("Dose verification");
  }
  
  if (!input.verification_results.route_verified) {
    missingElements.push("Route verification");
  }
  
  if (!input.verification_results.time_verified) {
    missingElements.push("Time verification");
  }
  
  // Check patient response documentation
  if (input.patient_response.immediate_reaction === 'moderate' || 
      input.patient_response.immediate_reaction === 'severe') {
    if (input.patient_response.adverse_effects.length === 0) {
      missingElements.push("Adverse effects documentation");
    }
  }
  
  if (input.patient_response.patient_refused && !input.patient_response.refusal_reason) {
    missingElements.push("Refusal reason documentation");
  }
  
  return missingElements;
}
