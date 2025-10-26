/**
 * Document Subjective Tool
 * Captures patient's subjective information systematically
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for subjective documentation input
export const DocumentSubjectiveSchema = z.object({
  patient_id: z.string().min(1).describe("Unique patient identifier"),
  encounter_id: z.string().min(1).describe("Unique encounter identifier"),
  encounter_datetime: z.string().describe("ISO8601 datetime of encounter"),
  chief_complaint: z.string().min(1).describe("Chief complaint in patient's own words (use quotes)"),
  history_present_illness: z.object({
    opqrst: z.object({
      onset: z.string().describe("When did the symptom start"),
      palliating_provoking: z.string().describe("What makes it better/worse"),
      quality: z.string().describe("Describe the symptom"),
      region: z.string().describe("Location and radiation"),
      severity: z.union([z.number().min(0).max(10), z.string()]).describe("Severity on 0-10 scale or descriptive"),
      time_course: z.string().describe("Pattern and duration")
    }),
    associated_symptoms: z.array(z.string()).describe("Associated symptoms"),
    previous_episodes: z.boolean().describe("Whether patient has had previous episodes"),
    previous_treatments: z.array(z.string()).describe("Previous treatments tried")
  }),
  review_of_systems: z.object({
    constitutional: z.array(z.string()).describe("Constitutional symptoms"),
    cardiovascular: z.array(z.string()).describe("Cardiovascular symptoms"),
    respiratory: z.array(z.string()).describe("Respiratory symptoms"),
    gastrointestinal: z.array(z.string()).describe("GI symptoms"),
    genitourinary: z.array(z.string()).describe("GU symptoms"),
    musculoskeletal: z.array(z.string()).describe("Musculoskeletal symptoms"),
    neurological: z.array(z.string()).describe("Neurological symptoms"),
    psychiatric: z.array(z.string()).describe("Psychiatric symptoms"),
    endocrine: z.array(z.string()).describe("Endocrine symptoms"),
    skin: z.array(z.string()).describe("Skin symptoms"),
    other: z.array(z.string()).describe("Other symptoms")
  }),
  medications_compliance: z.object({
    taking_as_prescribed: z.boolean().describe("Whether taking medications as prescribed"),
    missed_doses: z.string().describe("Description of missed doses"),
    side_effects_reported: z.array(z.string()).describe("Side effects reported by patient")
  }),
  social_history_updates: z.string().describe("Updates to social history"),
  functional_status: z.string().describe("Current functional status")
});

export type DocumentSubjectiveInput = z.infer<typeof DocumentSubjectiveSchema>;

// Subjective documentation output
export interface SubjectiveDocumentationOutput {
  subjective_section: {
    section_id: string;
    narrative: string;
    structured_data: {
      chief_complaint: string;
      history_present_illness: any;
      review_of_systems: any;
      medications_compliance: any;
      social_history: string;
      functional_status: string;
    };
    completeness_score: number; // 0-100%
    missing_elements: string[];
    red_flags_identified: string[];
  };
}

// ===== TOOL REGISTRATION =====

export function registerDocumentSubjectiveTool(server: McpServer): void {
  server.registerTool(
    "document_subjective",
    {
      title: "Document Subjective",
      description: `Captures patient's subjective information systematically following SOAP format.

**Purpose:** Document patient's subjective information in structured format for clinical records.

**Input Parameters:**
- patient_id: Unique patient identifier
- encounter_id: Unique encounter identifier
- encounter_datetime: When encounter occurred
- chief_complaint: Patient's chief complaint in their own words
- history_present_illness: OPQRST format history
- review_of_systems: Systematic review by body system
- medications_compliance: Medication adherence information
- social_history_updates: Updates to social history
- functional_status: Current functional status

**Process:**
1. Record chief complaint in patient's exact words (quoted)
2. Systematically document HPI using OPQRST
3. Capture relevant ROS
4. Document medication adherence
5. Note functional impact

**Output:** Returns formatted subjective section with completeness assessment.`,
      inputSchema: DocumentSubjectiveSchema.shape,
    },
    async (input: DocumentSubjectiveInput): Promise<McpResponse<SubjectiveDocumentationOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(DocumentSubjectiveSchema, input, "document_subjective");

        // 2. Process subjective documentation
        const subjectiveOutput = processSubjectiveDocumentation(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(subjectiveOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in document_subjective tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "document_subjective", 
          userInput: input 
        });
      }
    }
  );
}

// ===== SUBJECTIVE DOCUMENTATION PROCESSING =====

function processSubjectiveDocumentation(input: DocumentSubjectiveInput): SubjectiveDocumentationOutput {
  const sectionId = `subj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Generate narrative
  const narrative = generateSubjectiveNarrative(input);
  
  // Create structured data
  const structuredData = createStructuredData(input);
  
  // Assess completeness
  const completenessAssessment = assessCompleteness(input);
  
  // Identify red flags
  const redFlags = identifyRedFlags(input);
  
  return {
    subjective_section: {
      section_id: sectionId,
      narrative,
      structured_data: structuredData,
      completeness_score: completenessAssessment.score,
      missing_elements: completenessAssessment.missingElements,
      red_flags_identified: redFlags
    }
  };
}

function generateSubjectiveNarrative(input: DocumentSubjectiveInput): string {
  const narrative: string[] = [];
  
  // Chief Complaint
  narrative.push(`Chief Complaint: "${input.chief_complaint}"`);
  narrative.push('');
  
  // History of Present Illness
  narrative.push('History of Present Illness:');
  narrative.push(`The patient reports ${input.history_present_illness.opqrst.onset}.`);
  narrative.push(`The symptom is ${input.history_present_illness.opqrst.quality} and is located ${input.history_present_illness.opqrst.region}.`);
  narrative.push(`Severity is rated as ${input.history_present_illness.opqrst.severity} on a 0-10 scale.`);
  narrative.push(`The symptom is ${input.history_present_illness.opqrst.palliating_provoking}.`);
  narrative.push(`Time course: ${input.history_present_illness.opqrst.time_course}.`);
  
  if (input.history_present_illness.associated_symptoms.length > 0) {
    narrative.push(`Associated symptoms include: ${input.history_present_illness.associated_symptoms.join(', ')}.`);
  }
  
  if (input.history_present_illness.previous_episodes) {
    narrative.push('Patient has had previous episodes of similar symptoms.');
  }
  
  if (input.history_present_illness.previous_treatments.length > 0) {
    narrative.push(`Previous treatments tried: ${input.history_present_illness.previous_treatments.join(', ')}.`);
  }
  
  narrative.push('');
  
  // Review of Systems
  narrative.push('Review of Systems:');
  const rosSections = [
    { name: 'Constitutional', symptoms: input.review_of_systems.constitutional },
    { name: 'Cardiovascular', symptoms: input.review_of_systems.cardiovascular },
    { name: 'Respiratory', symptoms: input.review_of_systems.respiratory },
    { name: 'Gastrointestinal', symptoms: input.review_of_systems.gastrointestinal },
    { name: 'Genitourinary', symptoms: input.review_of_systems.genitourinary },
    { name: 'Musculoskeletal', symptoms: input.review_of_systems.musculoskeletal },
    { name: 'Neurological', symptoms: input.review_of_systems.neurological },
    { name: 'Psychiatric', symptoms: input.review_of_systems.psychiatric },
    { name: 'Endocrine', symptoms: input.review_of_systems.endocrine },
    { name: 'Skin', symptoms: input.review_of_systems.skin },
    { name: 'Other', symptoms: input.review_of_systems.other }
  ];
  
  for (const section of rosSections) {
    if (section.symptoms.length > 0) {
      narrative.push(`${section.name}: ${section.symptoms.join(', ')}.`);
    }
  }
  
  narrative.push('');
  
  // Medications and Compliance
  narrative.push('Medications and Compliance:');
  if (input.medications_compliance.taking_as_prescribed) {
    narrative.push('Patient reports taking medications as prescribed.');
  } else {
    narrative.push('Patient reports not taking medications as prescribed.');
    if (input.medications_compliance.missed_doses) {
      narrative.push(`Missed doses: ${input.medications_compliance.missed_doses}.`);
    }
  }
  
  if (input.medications_compliance.side_effects_reported.length > 0) {
    narrative.push(`Side effects reported: ${input.medications_compliance.side_effects_reported.join(', ')}.`);
  }
  
  narrative.push('');
  
  // Social History and Functional Status
  if (input.social_history_updates) {
    narrative.push(`Social History Updates: ${input.social_history_updates}`);
    narrative.push('');
  }
  
  narrative.push(`Functional Status: ${input.functional_status}`);
  
  return narrative.join('\n');
}

function createStructuredData(input: DocumentSubjectiveInput): {
  chief_complaint: string;
  history_present_illness: any;
  review_of_systems: any;
  medications_compliance: any;
  social_history: string;
  functional_status: string;
} {
  return {
    chief_complaint: input.chief_complaint,
    history_present_illness: input.history_present_illness,
    review_of_systems: input.review_of_systems,
    medications_compliance: input.medications_compliance,
    social_history: input.social_history_updates,
    functional_status: input.functional_status
  };
}

function assessCompleteness(input: DocumentSubjectiveInput): {
  score: number;
  missingElements: string[];
} {
  const missingElements: string[] = [];
  let score = 100;
  
  // Check required elements
  if (!input.chief_complaint || input.chief_complaint.trim().length === 0) {
    missingElements.push('Chief complaint');
    score -= 20;
  }
  
  if (!input.history_present_illness.opqrst.onset || input.history_present_illness.opqrst.onset.trim().length === 0) {
    missingElements.push('Onset of symptoms');
    score -= 10;
  }
  
  if (!input.history_present_illness.opqrst.quality || input.history_present_illness.opqrst.quality.trim().length === 0) {
    missingElements.push('Quality of symptoms');
    score -= 10;
  }
  
  if (!input.history_present_illness.opqrst.severity) {
    missingElements.push('Severity rating');
    score -= 10;
  }
  
  // Check optional but important elements
  if (!input.medications_compliance.taking_as_prescribed && !input.medications_compliance.missed_doses) {
    missingElements.push('Medication compliance details');
    score -= 5;
  }
  
  if (!input.functional_status || input.functional_status.trim().length === 0) {
    missingElements.push('Functional status');
    score -= 5;
  }
  
  // Check review of systems completeness
  const rosSections = [
    'constitutional', 'cardiovascular', 'respiratory', 'gastrointestinal',
    'genitourinary', 'musculoskeletal', 'neurological', 'psychiatric',
    'endocrine', 'skin', 'other'
  ];
  
  let emptyRosSections = 0;
  for (const section of rosSections) {
    const symptoms = input.review_of_systems[section as keyof typeof input.review_of_systems] as string[];
    if (!symptoms || symptoms.length === 0) {
      emptyRosSections++;
    }
  }
  
  if (emptyRosSections > 5) {
    missingElements.push('Comprehensive review of systems');
    score -= 10;
  }
  
  return {
    score: Math.max(0, score),
    missingElements
  };
}

function identifyRedFlags(input: DocumentSubjectiveInput): string[] {
  const redFlags: string[] = [];
  
  // Check for high severity symptoms
  const severity = typeof input.history_present_illness.opqrst.severity === 'number' 
    ? input.history_present_illness.opqrst.severity 
    : 0;
  
  if (severity >= 8) {
    redFlags.push('High severity symptoms (8-10/10)');
  }
  
  // Check for concerning symptoms in ROS
  const concerningSymptoms = [
    'chest pain', 'shortness of breath', 'severe headache', 'loss of consciousness',
    'severe abdominal pain', 'rectal bleeding', 'severe weakness', 'confusion'
  ];
  
  for (const section of Object.values(input.review_of_systems)) {
    if (Array.isArray(section)) {
      for (const symptom of section) {
        if (concerningSymptoms.some(concerning => 
          symptom.toLowerCase().includes(concerning)
        )) {
          redFlags.push(`Concerning symptom reported: ${symptom}`);
        }
      }
    }
  }
  
  // Check for medication non-compliance with serious conditions
  if (!input.medications_compliance.taking_as_prescribed && 
      input.medications_compliance.missed_doses.includes('critical') || 
      input.medications_compliance.missed_doses.includes('life-saving')) {
    redFlags.push('Non-compliance with critical medications');
  }
  
  // Check for functional decline
  if (input.functional_status.toLowerCase().includes('decline') || 
      input.functional_status.toLowerCase().includes('worse') ||
      input.functional_status.toLowerCase().includes('unable')) {
    redFlags.push('Functional decline reported');
  }
  
  return redFlags;
}
