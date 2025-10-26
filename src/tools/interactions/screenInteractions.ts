/**
 * Screen Interactions Tool
 * Comprehensive interaction screening for medication list
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for interaction screening input
export const ScreenInteractionsSchema = z.object({
  patient_id: z.string().min(1).describe("Unique patient identifier"),
  medications: z.array(z.object({
    drug_name: z.string().describe("Generic drug name"),
    dose: z.string().describe("Dose with units"),
    frequency: z.string().describe("Dosing frequency"),
    route: z.string().describe("Route of administration"),
    start_date: z.string().describe("ISO8601 date when medication started")
  })).min(1).describe("List of medications to screen"),
  patient_conditions: z.array(z.object({
    condition: z.string().describe("ICD-10 code or description"),
    status: z.enum(['active', 'controlled', 'history']).describe("Condition status"),
    severity: z.enum(['mild', 'moderate', 'severe']).describe("Condition severity")
  })).describe("Patient medical conditions"),
  patient_characteristics: z.object({
    age: z.number().describe("Patient age in years"),
    pregnancy_status: z.boolean().describe("Whether patient is pregnant"),
    breastfeeding: z.boolean().describe("Whether patient is breastfeeding"),
    renal_function: z.enum(['normal', 'impaired']).describe("Renal function status"),
    hepatic_function: z.enum(['normal', 'impaired']).describe("Hepatic function status")
  }),
  dietary_supplements: z.array(z.string()).describe("List of dietary supplements"),
  known_allergies: z.array(z.string()).describe("List of known drug allergies")
});

export type ScreenInteractionsInput = z.infer<typeof ScreenInteractionsSchema>;

// Interaction types
export interface DrugInteraction {
  interaction_id: string;
  type: 'drug_drug' | 'drug_condition' | 'drug_food' | 'contraindication';
  severity: 'contraindicated' | 'serious' | 'moderate' | 'minor';
  management_level: 'use_alternative' | 'monitor_closely' | 'adjust_dose' | 'no_action';
  interacting_entities: {
    entity_1: {
      type: 'drug' | 'condition' | 'food';
      name: string;
    };
    entity_2: {
      type: 'drug' | 'condition' | 'food';
      name: string;
    };
  };
  mechanism: string;
  clinical_effects: string[];
  onset: 'rapid' | 'delayed' | 'variable';
  documentation_level: 'established' | 'probable' | 'suspected' | 'theoretical';
  evidence_quality: 'high' | 'moderate' | 'low';
}

// Interaction screening output
export interface InteractionScreeningOutput {
  screening_id: string;
  screening_datetime: string;
  interactions_found: DrugInteraction[];
  summary: {
    total_interactions: number;
    contraindicated_count: number;
    serious_count: number;
    moderate_count: number;
    minor_count: number;
    requires_immediate_action: boolean;
  };
}

// ===== TOOL REGISTRATION =====

export function registerScreenInteractionsTool(server: McpServer): void {
  server.registerTool(
    "screen_interactions",
    {
      title: "Screen Drug Interactions",
      description: `Comprehensive screening for drug-drug, drug-condition, and drug-food interactions.

**Purpose:** Identify potential drug interactions and contraindications for patient safety.

**Input Parameters:**
- patient_id: Unique patient identifier
- medications: List of current medications
- patient_conditions: Patient medical conditions
- patient_characteristics: Demographics and organ function
- dietary_supplements: Supplements being taken
- known_allergies: Known drug allergies

**Process:**
1. Screen for drug-drug interactions (DDI)
2. Screen for drug-condition interactions
3. Screen for drug-food interactions
4. Check contraindications
5. Assess clinical significance

**Output:** Returns detailed interaction analysis with severity levels and management recommendations.`,
      inputSchema: ScreenInteractionsSchema.shape,
    },
    async (input: ScreenInteractionsInput): Promise<McpResponse<InteractionScreeningOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(ScreenInteractionsSchema, input, "screen_interactions");

        // 2. Process interaction screening
        const screeningOutput = processInteractionScreening(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(screeningOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in screen_interactions tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "screen_interactions", 
          userInput: input 
        });
      }
    }
  );
}

// ===== INTERACTION SCREENING PROCESSING =====

function processInteractionScreening(input: ScreenInteractionsInput): InteractionScreeningOutput {
  const screeningId = `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const screeningDatetime = new Date().toISOString();
  
  // Screen for different types of interactions
  const drugDrugInteractions = screenDrugDrugInteractions(input.medications);
  const drugConditionInteractions = screenDrugConditionInteractions(input.medications, input.patient_conditions);
  const drugFoodInteractions = screenDrugFoodInteractions(input.medications, input.dietary_supplements);
  const contraindications = screenContraindications(input.medications, input.patient_conditions, input.patient_characteristics);
  
  // Combine all interactions
  const allInteractions = [
    ...drugDrugInteractions,
    ...drugConditionInteractions,
    ...drugFoodInteractions,
    ...contraindications
  ];
  
  // Generate summary
  const summary = generateInteractionSummary(allInteractions);
  
  return {
    screening_id: screeningId,
    screening_datetime: screeningDatetime,
    interactions_found: allInteractions,
    summary
  };
}

function screenDrugDrugInteractions(medications: Array<{
  drug_name: string;
  dose: string;
  frequency: string;
  route: string;
  start_date: string;
}>): DrugInteraction[] {
  const interactions: DrugInteraction[] = [];
  
  // Known drug-drug interactions database (simplified)
  const knownInteractions = [
    {
      drug1: 'warfarin',
      drug2: 'aspirin',
      severity: 'serious' as const,
      mechanism: 'Increased bleeding risk due to dual antiplatelet/anticoagulant effects',
      effects: ['Increased bleeding risk', 'Bruising', 'Gastrointestinal bleeding']
    },
    {
      drug1: 'digoxin',
      drug2: 'furosemide',
      severity: 'moderate' as const,
      mechanism: 'Furosemide-induced hypokalemia increases digoxin toxicity risk',
      effects: ['Digoxin toxicity', 'Arrhythmias', 'Nausea and vomiting']
    },
    {
      drug1: 'phenytoin',
      drug2: 'warfarin',
      severity: 'moderate' as const,
      mechanism: 'Phenytoin induces warfarin metabolism, decreasing anticoagulant effect',
      effects: ['Decreased warfarin effectiveness', 'Increased thrombosis risk']
    }
  ];
  
  // Check for interactions between medications
  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const med1Data = medications[i];
      const med2Data = medications[j];
      
      if (!med1Data || !med2Data) continue;
      
      const med1 = med1Data.drug_name.toLowerCase();
      const med2 = med2Data.drug_name.toLowerCase();
      
      const interaction = knownInteractions.find(int => 
        (int.drug1 === med1 && int.drug2 === med2) ||
        (int.drug1 === med2 && int.drug2 === med1)
      );
      
      if (interaction) {
        interactions.push({
          interaction_id: `ddi_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: 'drug_drug',
          severity: interaction.severity,
          management_level: interaction.severity === 'serious' ? 'monitor_closely' : 'adjust_dose',
          interacting_entities: {
            entity_1: { type: 'drug', name: med1Data.drug_name },
            entity_2: { type: 'drug', name: med2Data.drug_name }
          },
          mechanism: interaction.mechanism,
          clinical_effects: interaction.effects,
          onset: 'variable',
          documentation_level: 'established',
          evidence_quality: 'high'
        });
      }
    }
  }
  
  return interactions;
}

function screenDrugConditionInteractions(
  medications: Array<{ drug_name: string; dose: string; frequency: string; route: string; start_date: string; }>,
  conditions: Array<{ condition: string; status: string; severity: string; }>
): DrugInteraction[] {
  const interactions: DrugInteraction[] = [];
  
  // Known drug-condition interactions (simplified)
  const knownConditionInteractions = [
    {
      drug: 'metformin',
      condition: 'renal_failure',
      severity: 'contraindicated' as const,
      mechanism: 'Metformin contraindicated in severe renal impairment due to lactic acidosis risk',
      effects: ['Lactic acidosis', 'Renal failure progression']
    },
    {
      drug: 'ace_inhibitor',
      condition: 'pregnancy',
      severity: 'contraindicated' as const,
      mechanism: 'ACE inhibitors contraindicated in pregnancy due to fetal toxicity',
      effects: ['Fetal malformations', 'Neonatal renal failure']
    }
  ];
  
  // Check each medication against patient conditions
  for (const medication of medications) {
    for (const condition of conditions) {
      const drugName = medication.drug_name.toLowerCase();
      const conditionName = condition.condition.toLowerCase();
      
      const interaction = knownConditionInteractions.find(int => 
        int.drug === drugName && conditionName.includes(int.condition)
      );
      
      if (interaction) {
        interactions.push({
          interaction_id: `dci_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: 'drug_condition',
          severity: interaction.severity,
          management_level: interaction.severity === 'contraindicated' ? 'use_alternative' : 'monitor_closely',
          interacting_entities: {
            entity_1: { type: 'drug', name: medication.drug_name },
            entity_2: { type: 'condition', name: condition.condition }
          },
          mechanism: interaction.mechanism,
          clinical_effects: interaction.effects,
          onset: 'delayed',
          documentation_level: 'established',
          evidence_quality: 'high'
        });
      }
    }
  }
  
  return interactions;
}

function screenDrugFoodInteractions(
  medications: Array<{ drug_name: string; dose: string; frequency: string; route: string; start_date: string; }>,
  supplements: string[]
): DrugInteraction[] {
  const interactions: DrugInteraction[] = [];
  
  // Known drug-food interactions (simplified)
  const knownFoodInteractions = [
    {
      drug: 'warfarin',
      food: 'vitamin_k',
      severity: 'moderate' as const,
      mechanism: 'Vitamin K antagonizes warfarin effect',
      effects: ['Decreased anticoagulant effect', 'Increased thrombosis risk']
    },
    {
      drug: 'grapefruit',
      food: 'statins',
      severity: 'moderate' as const,
      mechanism: 'Grapefruit inhibits CYP3A4, increasing statin levels',
      effects: ['Increased statin levels', 'Muscle toxicity risk']
    }
  ];
  
  // Check for food interactions
  for (const medication of medications) {
    for (const supplement of supplements) {
      const drugName = medication.drug_name.toLowerCase();
      const supplementName = supplement.toLowerCase();
      
      const interaction = knownFoodInteractions.find(int => 
        int.drug === drugName && supplementName.includes(int.food)
      );
      
      if (interaction) {
        interactions.push({
          interaction_id: `dfi_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: 'drug_food',
          severity: interaction.severity,
          management_level: 'adjust_dose',
          interacting_entities: {
            entity_1: { type: 'drug', name: medication.drug_name },
            entity_2: { type: 'food', name: supplement }
          },
          mechanism: interaction.mechanism,
          clinical_effects: interaction.effects,
          onset: 'delayed',
          documentation_level: 'established',
          evidence_quality: 'high'
        });
      }
    }
  }
  
  return interactions;
}

function screenContraindications(
  medications: Array<{ drug_name: string; dose: string; frequency: string; route: string; start_date: string; }>,
  conditions: Array<{ condition: string; status: string; severity: string; }>,
  characteristics: { age: number; pregnancy_status: boolean; breastfeeding: boolean; renal_function: string; hepatic_function: string; }
): DrugInteraction[] {
  const interactions: DrugInteraction[] = [];
  
  // Check for contraindications based on patient characteristics
  for (const medication of medications) {
    const drugName = medication.drug_name.toLowerCase();
    
    // Pregnancy contraindications
    if (characteristics.pregnancy_status && 
        (drugName.includes('warfarin') || drugName.includes('ace') || drugName.includes('statins'))) {
      interactions.push({
        interaction_id: `contra_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: 'contraindication',
        severity: 'contraindicated',
        management_level: 'use_alternative',
        interacting_entities: {
          entity_1: { type: 'drug', name: medication.drug_name },
          entity_2: { type: 'condition', name: 'Pregnancy' }
        },
        mechanism: 'Drug contraindicated in pregnancy due to fetal toxicity risk',
        clinical_effects: ['Fetal malformations', 'Pregnancy complications'],
        onset: 'delayed',
        documentation_level: 'established',
        evidence_quality: 'high'
      });
    }
    
    // Renal function contraindications
    if (characteristics.renal_function === 'impaired' && 
        (drugName.includes('metformin') || drugName.includes('nsaid'))) {
      interactions.push({
        interaction_id: `contra_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: 'contraindication',
        severity: 'contraindicated',
        management_level: 'use_alternative',
        interacting_entities: {
          entity_1: { type: 'drug', name: medication.drug_name },
          entity_2: { type: 'condition', name: 'Renal impairment' }
        },
        mechanism: 'Drug contraindicated in renal impairment due to toxicity risk',
        clinical_effects: ['Renal toxicity', 'Drug accumulation'],
        onset: 'delayed',
        documentation_level: 'established',
        evidence_quality: 'high'
      });
    }
  }
  
  return interactions;
}

function generateInteractionSummary(interactions: DrugInteraction[]): {
  total_interactions: number;
  contraindicated_count: number;
  serious_count: number;
  moderate_count: number;
  minor_count: number;
  requires_immediate_action: boolean;
} {
  const summary = {
    total_interactions: interactions.length,
    contraindicated_count: interactions.filter(i => i.severity === 'contraindicated').length,
    serious_count: interactions.filter(i => i.severity === 'serious').length,
    moderate_count: interactions.filter(i => i.severity === 'moderate').length,
    minor_count: interactions.filter(i => i.severity === 'minor').length,
    requires_immediate_action: interactions.some(i => 
      i.severity === 'contraindicated' || 
      (i.severity === 'serious' && i.management_level === 'use_alternative')
    )
  };
  
  return summary;
}
