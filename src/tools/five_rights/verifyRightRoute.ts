/**
 * Verify Right Route Tool
 * Confirms correct route of administration
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for route verification input
export const VerifyRightRouteSchema = z.object({
  order_details: z.object({
    ordered_route: z.enum(['oral', 'IV', 'IM', 'SC', 'topical', 'inhaled', 'rectal', 'ophthalmic', 'otic', 'nasal', 'transdermal']).describe("Ordered route of administration"),
    specific_site: z.string().optional().describe("Specific site if applicable")
  }),
  patient_assessment: z.object({
    conscious_level: z.enum(['alert', 'drowsy', 'unconscious']).describe("Patient consciousness level"),
    swallow_ability: z.enum(['normal', 'impaired', 'npo']).describe("Patient swallow ability"),
    iv_access: z.object({
      available: z.boolean().describe("Whether IV access is available"),
      type: z.enum(['peripheral', 'central', 'picc']).optional().describe("Type of IV access"),
      site: z.string().optional().describe("IV access site"),
      patent: z.boolean().describe("Whether IV access is patent")
    }),
    contraindications_for_route: z.array(z.string()).describe("Contraindications for the route")
  }),
  medication_formulation: z.object({
    available_routes: z.array(z.string()).describe("Available routes for this medication"),
    formulation_type: z.enum(['tablet', 'capsule', 'liquid', 'injection', 'cream', 'patch']).describe("Formulation type")
  })
});

export type VerifyRightRouteInput = z.infer<typeof VerifyRightRouteSchema>;

// Route verification output
export interface RouteVerificationOutput {
  verification_result: {
    route_confirmed: boolean;
    route_appropriate_for_patient: boolean;
    route_appropriate_for_formulation: boolean;
    access_available: boolean;
    contraindications: string[];
    alternative_route_needed: {
      required: boolean;
      suggested_route: string;
      requires_order_change: boolean;
    };
    can_proceed: boolean;
  };
}

// ===== TOOL REGISTRATION =====

export function registerVerifyRightRouteTool(server: McpServer): void {
  server.registerTool(
    "verify_right_route",
    {
      title: "Verify Right Route",
      description: `Confirms correct route of administration following the Five Rights protocol.

**Purpose:** Ensure correct route is used for medication administration.

**Input Parameters:**
- order_details: Ordered route and specific site
- patient_assessment: Patient condition and contraindications
- medication_formulation: Available routes and formulation type

**Process:**
1. Verify route matches order
2. Confirm patient can receive via this route
3. Check formulation is appropriate for route
4. Verify IV access if needed
5. Check for contraindications

**Output:** Returns route verification result with safety checks and alternatives.`,
      inputSchema: VerifyRightRouteSchema.shape,
    },
    async (input: VerifyRightRouteInput): Promise<McpResponse<RouteVerificationOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(VerifyRightRouteSchema, input, "verify_right_route");

        // 2. Process route verification
        const verificationOutput = processRouteVerification(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(verificationOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in verify_right_route tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "verify_right_route", 
          userInput: input 
        });
      }
    }
  );
}

// ===== ROUTE VERIFICATION PROCESSING =====

function processRouteVerification(input: VerifyRightRouteInput): RouteVerificationOutput {
  // Check if route is appropriate for patient
  const routeAppropriateForPatient = checkPatientRouteAppropriateness(input);
  
  // Check if route is appropriate for formulation
  const routeAppropriateForFormulation = checkFormulationRouteAppropriateness(input);
  
  // Check if access is available
  const accessAvailable = checkAccessAvailability(input);
  
  // Identify contraindications
  const contraindications = identifyContraindications(input);
  
  // Determine if alternative route is needed
  const alternativeRouteNeeded = determineAlternativeRouteNeeded(input, routeAppropriateForPatient, routeAppropriateForFormulation, accessAvailable);
  
  // Determine if can proceed
  const canProceed = routeAppropriateForPatient && 
                    routeAppropriateForFormulation && 
                    accessAvailable && 
                    contraindications.length === 0;
  
  return {
    verification_result: {
      route_confirmed: canProceed,
      route_appropriate_for_patient: routeAppropriateForPatient,
      route_appropriate_for_formulation: routeAppropriateForFormulation,
      access_available: accessAvailable,
      contraindications,
      alternative_route_needed: alternativeRouteNeeded,
      can_proceed: canProceed
    }
  };
}

function checkPatientRouteAppropriateness(input: VerifyRightRouteInput): boolean {
  const orderedRoute = input.order_details.ordered_route;
  const patientAssessment = input.patient_assessment;
  
  // Check consciousness level
  if (patientAssessment.conscious_level === 'unconscious' && orderedRoute === 'oral') {
    return false; // Cannot give oral medications to unconscious patient
  }
  
  // Check swallow ability
  if (patientAssessment.swallow_ability === 'impaired' && orderedRoute === 'oral') {
    return false; // Cannot give oral medications if swallow is impaired
  }
  
  if (patientAssessment.swallow_ability === 'npo' && orderedRoute === 'oral') {
    return false; // Cannot give oral medications if NPO
  }
  
  // Check IV access for IV medications
  if (orderedRoute === 'IV' && !patientAssessment.iv_access.available) {
    return false; // Cannot give IV medications without IV access
  }
  
  if (orderedRoute === 'IV' && patientAssessment.iv_access.available && !patientAssessment.iv_access.patent) {
    return false; // Cannot give IV medications through non-patent IV
  }
  
  return true;
}

function checkFormulationRouteAppropriateness(input: VerifyRightRouteInput): boolean {
  const orderedRoute = input.order_details.ordered_route;
  const formulationType = input.medication_formulation.formulation_type;
  const availableRoutes = input.medication_formulation.available_routes;
  
  // Check if route is available for this formulation
  if (!availableRoutes.includes(orderedRoute)) {
    return false;
  }
  
  // Check formulation-specific route appropriateness
  switch (formulationType) {
    case 'tablet':
    case 'capsule':
      return orderedRoute === 'oral';
      
    case 'liquid':
      return ['oral', 'IV', 'IM', 'SC'].includes(orderedRoute);
      
    case 'injection':
      return ['IV', 'IM', 'SC'].includes(orderedRoute);
      
    case 'cream':
      return orderedRoute === 'topical';
      
    case 'patch':
      return orderedRoute === 'transdermal';
      
    default:
      return true;
  }
}

function checkAccessAvailability(input: VerifyRightRouteInput): boolean {
  const orderedRoute = input.order_details.ordered_route;
  const ivAccess = input.patient_assessment.iv_access;
  
  // Check IV access for IV medications
  if (orderedRoute === 'IV') {
    return ivAccess.available && ivAccess.patent;
  }
  
  // Check for other route-specific access requirements
  if (orderedRoute === 'IM' || orderedRoute === 'SC') {
    // Check if patient can receive injections
    return input.patient_assessment.conscious_level !== 'unconscious';
  }
  
  if (orderedRoute === 'inhaled') {
    // Check if patient can use inhaler
    return input.patient_assessment.conscious_level === 'alert';
  }
  
  return true;
}

function identifyContraindications(input: VerifyRightRouteInput): string[] {
  const contraindications: string[] = [];
  const orderedRoute = input.order_details.ordered_route;
  const patientAssessment = input.patient_assessment;
  
  // Check patient-specific contraindications
  if (patientAssessment.conscious_level === 'unconscious' && orderedRoute === 'oral') {
    contraindications.push('Patient unconscious - cannot receive oral medications');
  }
  
  if (patientAssessment.swallow_ability === 'impaired' && orderedRoute === 'oral') {
    contraindications.push('Impaired swallow - oral route contraindicated');
  }
  
  if (patientAssessment.swallow_ability === 'npo' && orderedRoute === 'oral') {
    contraindications.push('Patient NPO - oral route contraindicated');
  }
  
  if (orderedRoute === 'IV' && !patientAssessment.iv_access.available) {
    contraindications.push('No IV access available');
  }
  
  if (orderedRoute === 'IV' && patientAssessment.iv_access.available && !patientAssessment.iv_access.patent) {
    contraindications.push('IV access not patent');
  }
  
  // Check for documented contraindications
  for (const contraindication of patientAssessment.contraindications_for_route) {
    if (contraindication.toLowerCase().includes(orderedRoute.toLowerCase())) {
      contraindications.push(contraindication);
    }
  }
  
  return contraindications;
}

function determineAlternativeRouteNeeded(
  input: VerifyRightRouteInput,
  routeAppropriateForPatient: boolean,
  routeAppropriateForFormulation: boolean,
  accessAvailable: boolean
): {
  required: boolean;
  suggested_route: string;
  requires_order_change: boolean;
} {
  const orderedRoute = input.order_details.ordered_route;
  const patientAssessment = input.patient_assessment;
  const formulationType = input.medication_formulation.formulation_type;
  
  // Determine if alternative route is needed
  const alternativeRequired = !routeAppropriateForPatient || !routeAppropriateForFormulation || !accessAvailable;
  
  if (!alternativeRequired) {
    return {
      required: false,
      suggested_route: '',
      requires_order_change: false
    };
  }
  
  // Suggest alternative route based on patient condition and formulation
  let suggestedRoute = '';
  let requiresOrderChange = false;
  
  if (orderedRoute === 'oral' && patientAssessment.swallow_ability === 'impaired') {
    if (formulationType === 'liquid') {
      suggestedRoute = 'IV';
      requiresOrderChange = true;
    } else {
      suggestedRoute = 'IM';
      requiresOrderChange = true;
    }
  }
  
  if (orderedRoute === 'IV' && !patientAssessment.iv_access.available) {
    if (formulationType === 'tablet' || formulationType === 'capsule') {
      suggestedRoute = 'oral';
      requiresOrderChange = true;
    } else {
      suggestedRoute = 'IM';
      requiresOrderChange = true;
    }
  }
  
  if (orderedRoute === 'IM' && patientAssessment.conscious_level === 'unconscious') {
    suggestedRoute = 'IV';
    requiresOrderChange = true;
  }
  
  return {
    required: alternativeRequired,
    suggested_route: suggestedRoute,
    requires_order_change: requiresOrderChange
  };
}
