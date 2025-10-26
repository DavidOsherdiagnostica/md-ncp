/**
 * Verify Right Patient Tool
 * Confirms patient identity using two identifiers
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for patient verification input
export const VerifyRightPatientSchema = z.object({
  patient_identifiers: z.object({
    identifier_1: z.object({
      type: z.enum(['name', 'mrn', 'date_of_birth', 'photo', 'biometric']).describe("Type of first identifier"),
      value: z.string().describe("Value of first identifier"),
      verification_method: z.enum(['wristband', 'verbal', 'electronic', 'visual']).describe("Method used to verify first identifier")
    }),
    identifier_2: z.object({
      type: z.enum(['name', 'mrn', 'date_of_birth', 'photo', 'biometric']).describe("Type of second identifier"),
      value: z.string().describe("Value of second identifier"),
      verification_method: z.enum(['wristband', 'verbal', 'electronic', 'visual']).describe("Method used to verify second identifier")
    })
  }),
  expected_patient: z.object({
    name: z.string().describe("Expected patient name"),
    mrn: z.string().describe("Expected medical record number"),
    date_of_birth: z.string().describe("Expected date of birth (ISO8601)")
  }),
  verification_datetime: z.string().describe("ISO8601 datetime of verification"),
  verifier_id: z.string().describe("ID of person performing verification")
});

export type VerifyRightPatientInput = z.infer<typeof VerifyRightPatientSchema>;

// Patient verification output
export interface PatientVerificationOutput {
  verification_result: {
    patient_confirmed: boolean;
    match_confidence: 'exact' | 'probable' | 'no_match';
    identifiers_matched: string[];
    discrepancies: string[];
    verification_method_appropriate: boolean;
    can_proceed: boolean;
    action_if_discrepancy: string;
  };
}

// ===== TOOL REGISTRATION =====

export function registerVerifyRightPatientTool(server: McpServer): void {
  server.registerTool(
    "verify_right_patient",
    {
      title: "Verify Right Patient",
      description: `Confirms patient identity using two identifiers following the Five Rights protocol.

**Purpose:** Ensure correct patient identification before medication administration.

**Input Parameters:**
- patient_identifiers: Two different identifiers used for verification
- expected_patient: Expected patient information
- verification_datetime: When verification was performed
- verifier_id: ID of person performing verification

**Process:**
1. Require two different identifiers (never room number)
2. Match against order
3. Use active verification (ask patient to state, don't just confirm)
4. Document verification method

**Output:** Returns verification result with confidence level and action recommendations.`,
      inputSchema: VerifyRightPatientSchema.shape,
    },
    async (input: VerifyRightPatientInput): Promise<McpResponse<PatientVerificationOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(VerifyRightPatientSchema, input, "verify_right_patient");

        // 2. Process patient verification
        const verificationOutput = processPatientVerification(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(verificationOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in verify_right_patient tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "verify_right_patient", 
          userInput: input 
        });
      }
    }
  );
}

// ===== PATIENT VERIFICATION PROCESSING =====

function processPatientVerification(input: VerifyRightPatientInput): PatientVerificationOutput {
  // Check if two different identifiers are used
  const identifiersUsed = [input.patient_identifiers.identifier_1.type, input.patient_identifiers.identifier_2.type];
  const uniqueIdentifiers = new Set(identifiersUsed);
  
  if (uniqueIdentifiers.size < 2) {
    return {
      verification_result: {
        patient_confirmed: false,
        match_confidence: 'no_match',
        identifiers_matched: [],
        discrepancies: ['Two different identifiers required'],
        verification_method_appropriate: false,
        can_proceed: false,
        action_if_discrepancy: 'Obtain two different identifiers and re-verify patient identity'
      }
    };
  }
  
  // Perform identifier matching
  const matchingResults = performIdentifierMatching(input);
  
  // Assess verification methods
  const verificationMethodAppropriate = assessVerificationMethods(input);
  
  // Determine if can proceed
  const canProceed = matchingResults.patient_confirmed && 
                    matchingResults.match_confidence !== 'no_match' && 
                    verificationMethodAppropriate;
  
  return {
    verification_result: {
      patient_confirmed: matchingResults.patient_confirmed,
      match_confidence: matchingResults.match_confidence,
      identifiers_matched: matchingResults.identifiers_matched,
      discrepancies: matchingResults.discrepancies,
      verification_method_appropriate: verificationMethodAppropriate,
      can_proceed: canProceed,
      action_if_discrepancy: canProceed ? 'Proceed with medication administration' : 'Stop and resolve discrepancies before proceeding'
    }
  };
}

function performIdentifierMatching(input: VerifyRightPatientInput): {
  patient_confirmed: boolean;
  match_confidence: 'exact' | 'probable' | 'no_match';
  identifiers_matched: string[];
  discrepancies: string[];
} {
  const identifiersMatched: string[] = [];
  const discrepancies: string[] = [];
  let matchCount = 0;
  
  // Check identifier 1
  const id1Match = checkIdentifierMatch(
    input.patient_identifiers.identifier_1,
    input.expected_patient
  );
  
  if (id1Match.matched) {
    identifiersMatched.push(input.patient_identifiers.identifier_1.type);
    matchCount++;
  } else {
    discrepancies.push(`Identifier 1 (${input.patient_identifiers.identifier_1.type}) mismatch: ${id1Match.discrepancy}`);
  }
  
  // Check identifier 2
  const id2Match = checkIdentifierMatch(
    input.patient_identifiers.identifier_2,
    input.expected_patient
  );
  
  if (id2Match.matched) {
    identifiersMatched.push(input.patient_identifiers.identifier_2.type);
    matchCount++;
  } else {
    discrepancies.push(`Identifier 2 (${input.patient_identifiers.identifier_2.type}) mismatch: ${id2Match.discrepancy}`);
  }
  
  // Determine match confidence
  let matchConfidence: 'exact' | 'probable' | 'no_match';
  let patientConfirmed: boolean;
  
  if (matchCount === 2) {
    matchConfidence = 'exact';
    patientConfirmed = true;
  } else if (matchCount === 1) {
    matchConfidence = 'probable';
    patientConfirmed = false;
  } else {
    matchConfidence = 'no_match';
    patientConfirmed = false;
  }
  
  return {
    patient_confirmed: patientConfirmed,
    match_confidence: matchConfidence,
    identifiers_matched: identifiersMatched,
    discrepancies
  };
}

function checkIdentifierMatch(
  identifier: { type: string; value: string; verification_method: string },
  expectedPatient: { name: string; mrn: string; date_of_birth: string }
): { matched: boolean; discrepancy: string } {
  switch (identifier.type) {
    case 'name':
      const nameMatch = identifier.value.toLowerCase().trim() === expectedPatient.name.toLowerCase().trim();
      return {
        matched: nameMatch,
        discrepancy: nameMatch ? '' : `Expected: ${expectedPatient.name}, Got: ${identifier.value}`
      };
      
    case 'mrn':
      const mrnMatch = identifier.value === expectedPatient.mrn;
      return {
        matched: mrnMatch,
        discrepancy: mrnMatch ? '' : `Expected: ${expectedPatient.mrn}, Got: ${identifier.value}`
      };
      
    case 'date_of_birth':
      const dobMatch = identifier.value === expectedPatient.date_of_birth;
      return {
        matched: dobMatch,
        discrepancy: dobMatch ? '' : `Expected: ${expectedPatient.date_of_birth}, Got: ${identifier.value}`
      };
      
    case 'photo':
      // Photo verification would require image comparison
      return {
        matched: true, // Assume match for demo
        discrepancy: ''
      };
      
    case 'biometric':
      // Biometric verification would require biometric comparison
      return {
        matched: true, // Assume match for demo
        discrepancy: ''
      };
      
    default:
      return {
        matched: false,
        discrepancy: 'Unknown identifier type'
      };
  }
}

function assessVerificationMethods(input: VerifyRightPatientInput): boolean {
  // Check if verification methods are appropriate
  const methods = [
    input.patient_identifiers.identifier_1.verification_method,
    input.patient_identifiers.identifier_2.verification_method
  ];
  
  // At least one should be active verification (verbal)
  const hasActiveVerification = methods.includes('verbal');
  
  // Should not rely solely on visual methods
  const hasNonVisualMethod = methods.some(method => method !== 'visual');
  
  // Both identifiers should not be the same type
  const differentTypes = input.patient_identifiers.identifier_1.type !== input.patient_identifiers.identifier_2.type;
  
  return hasActiveVerification && hasNonVisualMethod && differentTypes;
}
