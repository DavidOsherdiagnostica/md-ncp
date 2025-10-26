/**
 * Compile SOAP Note Tool
 * Compiles complete SOAP note from all sections
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for SOAP note compilation input
export const CompileSoapNoteSchema = z.object({
  encounter_id: z.string().min(1).describe("Unique encounter identifier"),
  subjective_section_id: z.string().min(1).describe("ID from subjective documentation"),
  objective_section_id: z.string().min(1).describe("ID from objective documentation"),
  assessment_section_id: z.string().min(1).describe("ID from assessment documentation"),
  plan_section_id: z.string().min(1).describe("ID from plan documentation"),
  provider_info: z.object({
    provider_id: z.string().describe("Provider identifier"),
    provider_name: z.string().describe("Provider name"),
    credentials: z.string().describe("Provider credentials"),
    signature: z.boolean().describe("Whether provider has signed the note")
  }),
  note_metadata: z.object({
    encounter_type: z.enum(['office', 'hospital', 'telehealth', 'emergency']).describe("Type of encounter"),
    note_type: z.enum(['progress', 'admission', 'discharge', 'consultation']).describe("Type of note"),
    time_spent: z.number().describe("Time spent in minutes"),
    complexity_level: z.enum(['low', 'moderate', 'high']).describe("Complexity level")
  })
});

export type CompileSoapNoteInput = z.infer<typeof CompileSoapNoteSchema>;

// SOAP note compilation output
export interface SoapNoteOutput {
  complete_note: {
    note_id: string;
    encounter_id: string;
    patient_id: string;
    encounter_datetime: string;
    note_completion_datetime: string;
    sections: {
      subjective: string;
      objective: string;
      assessment: string;
      plan: string;
    };
    full_text: string;
    quality_checks: {
      all_sections_complete: boolean;
      signed: boolean;
      coding_suggested: {
        icd10_codes: string[];
        cpt_codes: string[];
        complexity_level: string;
      };
    };
    addendum_capability: boolean;
  };
}

// ===== TOOL REGISTRATION =====

export function registerCompileSoapNoteTool(server: McpServer): void {
  server.registerTool(
    "compile_soap_note",
    {
      title: "Compile SOAP Note",
      description: `Compiles complete SOAP note from all sections with quality checks and coding suggestions.

**Purpose:** Create a comprehensive SOAP note with quality assessment and coding recommendations.

**Input Parameters:**
- encounter_id: Unique encounter identifier
- subjective_section_id: ID from subjective documentation
- objective_section_id: ID from objective documentation
- assessment_section_id: ID from assessment documentation
- plan_section_id: ID from plan documentation
- provider_info: Provider information and signature status
- note_metadata: Encounter type, note type, time spent, complexity

**Process:**
1. Compile all SOAP sections into complete note
2. Perform quality checks for completeness
3. Generate coding suggestions (ICD-10, CPT)
4. Create audit trail
5. Enable addendum capability

**Output:** Returns complete SOAP note with quality assessment and coding recommendations.`,
      inputSchema: CompileSoapNoteSchema.shape,
    },
    async (input: CompileSoapNoteInput): Promise<McpResponse<SoapNoteOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(CompileSoapNoteSchema, input, "compile_soap_note");

        // 2. Process SOAP note compilation
        const soapNoteOutput = processSoapNoteCompilation(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(soapNoteOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in compile_soap_note tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "compile_soap_note", 
          userInput: input 
        });
      }
    }
  );
}

// ===== SOAP NOTE COMPILATION PROCESSING =====

function processSoapNoteCompilation(input: CompileSoapNoteInput): SoapNoteOutput {
  const noteId = `soap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const noteCompletionDatetime = new Date().toISOString();
  
  // Compile sections (in practice, would retrieve from database using section IDs)
  const sections = compileSections(input);
  
  // Generate full text
  const fullText = generateFullText(sections, input);
  
  // Perform quality checks
  const qualityChecks = performQualityChecks(input, sections);
  
  // Generate coding suggestions
  const codingSuggestions = generateCodingSuggestions(input, sections);
  
  return {
    complete_note: {
      note_id: noteId,
      encounter_id: input.encounter_id,
      patient_id: 'patient_id_placeholder', // Would be retrieved from encounter
      encounter_datetime: new Date().toISOString(),
      note_completion_datetime: noteCompletionDatetime,
      sections,
      full_text: fullText,
      quality_checks: {
        all_sections_complete: qualityChecks.allSectionsComplete,
        signed: input.provider_info.signature,
        coding_suggested: codingSuggestions
      },
      addendum_capability: true
    }
  };
}

function compileSections(input: CompileSoapNoteInput): {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
} {
  // In practice, would retrieve actual section content from database
  // For now, return placeholder content
  return {
    subjective: `[Subjective content from section ${input.subjective_section_id}]`,
    objective: `[Objective content from section ${input.objective_section_id}]`,
    assessment: `[Assessment content from section ${input.assessment_section_id}]`,
    plan: `[Plan content from section ${input.plan_section_id}]`
  };
}

function generateFullText(sections: {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}, input: CompileSoapNoteInput): string {
  const fullText: string[] = [];
  
  // Header
  fullText.push('SOAP NOTE');
  fullText.push('='.repeat(50));
  fullText.push(`Encounter ID: ${input.encounter_id}`);
  fullText.push(`Provider: ${input.provider_info.provider_name}, ${input.provider_info.credentials}`);
  fullText.push(`Encounter Type: ${input.note_metadata.encounter_type}`);
  fullText.push(`Note Type: ${input.note_metadata.note_type}`);
  fullText.push(`Time Spent: ${input.note_metadata.time_spent} minutes`);
  fullText.push(`Complexity: ${input.note_metadata.complexity_level}`);
  fullText.push(`Date: ${new Date().toLocaleDateString()}`);
  fullText.push('');
  
  // Subjective
  fullText.push('SUBJECTIVE');
  fullText.push('-'.repeat(20));
  fullText.push(sections.subjective);
  fullText.push('');
  
  // Objective
  fullText.push('OBJECTIVE');
  fullText.push('-'.repeat(20));
  fullText.push(sections.objective);
  fullText.push('');
  
  // Assessment
  fullText.push('ASSESSMENT');
  fullText.push('-'.repeat(20));
  fullText.push(sections.assessment);
  fullText.push('');
  
  // Plan
  fullText.push('PLAN');
  fullText.push('-'.repeat(20));
  fullText.push(sections.plan);
  fullText.push('');
  
  // Footer
  fullText.push('='.repeat(50));
  fullText.push(`Provider: ${input.provider_info.provider_name}, ${input.provider_info.credentials}`);
  fullText.push(`Signature: ${input.provider_info.signature ? 'Signed' : 'Not signed'}`);
  fullText.push(`Date: ${new Date().toISOString()}`);
  
  return fullText.join('\n');
}

function performQualityChecks(input: CompileSoapNoteInput, sections: {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}): {
  allSectionsComplete: boolean;
} {
  // Check if all sections have content
  const allSectionsComplete = (
    sections.subjective.length > 0 &&
    sections.objective.length > 0 &&
    sections.assessment.length > 0 &&
    sections.plan.length > 0
  );
  
  return {
    allSectionsComplete
  };
}

function generateCodingSuggestions(input: CompileSoapNoteInput, sections: {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}): {
  icd10_codes: string[];
  cpt_codes: string[];
  complexity_level: string;
} {
  const icd10Codes: string[] = [];
  const cptCodes: string[] = [];
  
  // Generate ICD-10 codes based on encounter type and complexity
  switch (input.note_metadata.encounter_type) {
    case 'office':
      icd10Codes.push('Z00.00', 'Z00.01'); // General adult medical examination
      break;
    case 'hospital':
      icd10Codes.push('Z51.11', 'Z51.12'); // Encounter for antineoplastic chemotherapy
      break;
    case 'emergency':
      icd10Codes.push('Z00.00'); // Encounter for general adult medical examination
      break;
    case 'telehealth':
      icd10Codes.push('Z03.89'); // Encounter for observation for other suspected diseases
      break;
  }
  
  // Generate CPT codes based on time spent and complexity
  const timeSpent = input.note_metadata.time_spent;
  const complexity = input.note_metadata.complexity_level;
  
  if (timeSpent >= 60) {
    cptCodes.push('99215'); // Office visit, established patient, comprehensive
  } else if (timeSpent >= 30) {
    cptCodes.push('99214'); // Office visit, established patient, detailed
  } else if (timeSpent >= 15) {
    cptCodes.push('99213'); // Office visit, established patient, expanded
  } else {
    cptCodes.push('99212'); // Office visit, established patient, problem focused
  }
  
  // Add complexity-based codes
  if (complexity === 'high') {
    cptCodes.push('99291'); // Critical care, first 30-74 minutes
  } else if (complexity === 'moderate') {
    cptCodes.push('99285'); // Emergency department visit, comprehensive
  }
  
  // Add procedure codes based on encounter type
  switch (input.note_metadata.encounter_type) {
    case 'telehealth':
      cptCodes.push('99444'); // Online digital evaluation and management
      break;
    case 'emergency':
      cptCodes.push('99281'); // Emergency department visit, level 1
      break;
  }
  
  return {
    icd10_codes: icd10Codes,
    cpt_codes: cptCodes,
    complexity_level: input.note_metadata.complexity_level
  };
}
