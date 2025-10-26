/**
 * Document Objective Tool
 * Records objective clinical findings
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpResponse, McpSuccessResponse } from "../../types/mcp.js";
import { getResponseFormatter } from "../../services/responseFormatter.js";
import { validateToolInput } from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";

// Define the Zod schema for objective documentation input
export const DocumentObjectiveSchema = z.object({
  encounter_id: z.string().min(1).describe("Unique encounter identifier"),
  vital_signs: z.object({
    datetime: z.string().describe("ISO8601 datetime of vital signs"),
    temperature: z.number().describe("Temperature in °C or °F"),
    heart_rate: z.number().describe("Heart rate in bpm"),
    blood_pressure: z.string().describe("Blood pressure as systolic/diastolic"),
    respiratory_rate: z.number().describe("Respiratory rate in breaths/min"),
    oxygen_saturation: z.number().describe("Oxygen saturation as percentage"),
    oxygen_delivery: z.enum(['room_air', 'nasal_cannula', 'mask', 'ventilator', 'other']).describe("Oxygen delivery method"),
    pain_score: z.number().min(0).max(10).optional().describe("Pain score 0-10"),
    weight: z.number().optional().describe("Weight in kg"),
    bmi: z.number().optional().describe("Body mass index")
  }),
  physical_examination: z.object({
    general_appearance: z.string().describe("General appearance and demeanor"),
    systems_examined: z.object({
      cardiovascular: z.object({
        heart_sounds: z.string().describe("Heart sounds description"),
        murmurs: z.string().describe("Murmurs if present"),
        peripheral_pulses: z.string().describe("Peripheral pulses assessment"),
        edema: z.string().describe("Edema assessment")
      }),
      respiratory: z.object({
        inspection: z.string().describe("Respiratory inspection findings"),
        auscultation: z.string().describe("Lung auscultation findings"),
        percussion: z.string().describe("Percussion findings")
      }),
      other_systems: z.record(z.string()).describe("Other systems examined")
    })
  }),
  laboratory_results: z.array(z.object({
    test_name: z.string().describe("Name of laboratory test"),
    result: z.string().describe("Test result with units"),
    reference_range: z.string().describe("Normal reference range"),
    flag: z.enum(['high', 'low', 'critical', 'normal']).describe("Result flag"),
    datetime: z.string().describe("ISO8601 datetime of test")
  })).describe("Recent laboratory results"),
  imaging_results: z.array(z.object({
    study_type: z.string().describe("Type of imaging study"),
    findings: z.string().describe("Imaging findings"),
    impression: z.string().describe("Radiologist impression"),
    datetime: z.string().describe("ISO8601 datetime of study")
  })).describe("Recent imaging results"),
  other_diagnostic_results: z.array(z.object({
    test_name: z.string().describe("Name of diagnostic test"),
    result: z.string().describe("Test result"),
    datetime: z.string().describe("ISO8601 datetime of test")
  })).describe("Other diagnostic results")
});

export type DocumentObjectiveInput = z.infer<typeof DocumentObjectiveSchema>;

// Objective documentation output
export interface ObjectiveDocumentationOutput {
  objective_section: {
    section_id: string;
    narrative: string;
    structured_data: {
      vital_signs: any;
      physical_examination: any;
      laboratory_results: any[];
      imaging_results: any[];
      other_diagnostic_results: any[];
    };
    abnormal_findings: Array<{
      category: string;
      finding: string;
      severity: 'mild' | 'moderate' | 'severe' | 'critical';
      clinical_significance: string;
    }>;
    critical_values: Array<{
      test_name: string;
      value: string;
      reference_range: string;
      clinical_implication: string;
    }>;
    trends_from_previous: Array<{
      parameter: string;
      previous_value: string;
      current_value: string;
      trend: 'improving' | 'stable' | 'worsening';
    }>;
  };
}

// ===== TOOL REGISTRATION =====

export function registerDocumentObjectiveTool(server: McpServer): void {
  server.registerTool(
    "document_objective",
    {
      title: "Document Objective",
      description: `Records objective clinical findings including vital signs, physical exam, and diagnostic results.

**Purpose:** Document objective clinical findings in structured format for clinical records.

**Input Parameters:**
- encounter_id: Unique encounter identifier
- vital_signs: Current vital signs
- physical_examination: Physical examination findings
- laboratory_results: Recent laboratory results
- imaging_results: Recent imaging studies
- other_diagnostic_results: Other diagnostic tests

**Process:**
1. Document vital signs with normal ranges
2. Record systematic physical examination
3. Include relevant laboratory and imaging results
4. Identify abnormal findings and critical values
5. Note trends from previous visits

**Output:** Returns formatted objective section with abnormal findings and clinical significance.`,
      inputSchema: DocumentObjectiveSchema.shape,
    },
    async (input: DocumentObjectiveInput): Promise<McpResponse<ObjectiveDocumentationOutput>> => {
      const startTime = Date.now();
      const responseFormatter = getResponseFormatter();

      try {
        // 1. Validate input
        const { data: validatedInput } = validateToolInput(DocumentObjectiveSchema, input, "document_objective");

        // 2. Process objective documentation
        const objectiveOutput = processObjectiveDocumentation(validatedInput);

        // 3. Format response
        return responseFormatter.formatGenericToolResponse(objectiveOutput, startTime);

      } catch (error) {
        const classifiedError = classifyError(error, `Error in document_objective tool handler`);
        return createComprehensiveErrorResponse(classifiedError, null, { 
          toolName: "document_objective", 
          userInput: input 
        });
      }
    }
  );
}

// ===== OBJECTIVE DOCUMENTATION PROCESSING =====

function processObjectiveDocumentation(input: DocumentObjectiveInput): ObjectiveDocumentationOutput {
  const sectionId = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Generate narrative
  const narrative = generateObjectiveNarrative(input);
  
  // Create structured data
  const structuredData = createStructuredData(input);
  
  // Identify abnormal findings
  const abnormalFindings = identifyAbnormalFindings(input);
  
  // Identify critical values
  const criticalValues = identifyCriticalValues(input);
  
  // Analyze trends (simplified - would need previous data in practice)
  const trends = analyzeTrends(input);
  
  return {
    objective_section: {
      section_id: sectionId,
      narrative,
      structured_data: structuredData,
      abnormal_findings: abnormalFindings,
      critical_values: criticalValues,
      trends_from_previous: trends
    }
  };
}

function generateObjectiveNarrative(input: DocumentObjectiveInput): string {
  const narrative: string[] = [];
  
  // Vital Signs
  narrative.push('Vital Signs:');
  narrative.push(`Temperature: ${input.vital_signs.temperature}°C`);
  narrative.push(`Heart Rate: ${input.vital_signs.heart_rate} bpm`);
  narrative.push(`Blood Pressure: ${input.vital_signs.blood_pressure} mmHg`);
  narrative.push(`Respiratory Rate: ${input.vital_signs.respiratory_rate} breaths/min`);
  narrative.push(`Oxygen Saturation: ${input.vital_signs.oxygen_saturation}% on ${input.vital_signs.oxygen_delivery}`);
  
  if (input.vital_signs.pain_score !== undefined) {
    narrative.push(`Pain Score: ${input.vital_signs.pain_score}/10`);
  }
  
  if (input.vital_signs.weight !== undefined) {
    narrative.push(`Weight: ${input.vital_signs.weight} kg`);
  }
  
  if (input.vital_signs.bmi !== undefined) {
    narrative.push(`BMI: ${input.vital_signs.bmi}`);
  }
  
  narrative.push('');
  
  // Physical Examination
  narrative.push('Physical Examination:');
  narrative.push(`General: ${input.physical_examination.general_appearance}`);
  
  // Cardiovascular
  narrative.push('Cardiovascular:');
  narrative.push(`Heart sounds: ${input.physical_examination.systems_examined.cardiovascular.heart_sounds}`);
  if (input.physical_examination.systems_examined.cardiovascular.murmurs) {
    narrative.push(`Murmurs: ${input.physical_examination.systems_examined.cardiovascular.murmurs}`);
  }
  narrative.push(`Peripheral pulses: ${input.physical_examination.systems_examined.cardiovascular.peripheral_pulses}`);
  narrative.push(`Edema: ${input.physical_examination.systems_examined.cardiovascular.edema}`);
  
  // Respiratory
  narrative.push('Respiratory:');
  narrative.push(`Inspection: ${input.physical_examination.systems_examined.respiratory.inspection}`);
  narrative.push(`Auscultation: ${input.physical_examination.systems_examined.respiratory.auscultation}`);
  narrative.push(`Percussion: ${input.physical_examination.systems_examined.respiratory.percussion}`);
  
  // Other systems
  for (const [system, findings] of Object.entries(input.physical_examination.systems_examined.other_systems)) {
    narrative.push(`${system}: ${findings}`);
  }
  
  narrative.push('');
  
  // Laboratory Results
  if (input.laboratory_results.length > 0) {
    narrative.push('Laboratory Results:');
    for (const lab of input.laboratory_results) {
      narrative.push(`${lab.test_name}: ${lab.result} (${lab.reference_range}) [${lab.flag}]`);
    }
    narrative.push('');
  }
  
  // Imaging Results
  if (input.imaging_results.length > 0) {
    narrative.push('Imaging Results:');
    for (const imaging of input.imaging_results) {
      narrative.push(`${imaging.study_type}: ${imaging.findings}`);
      narrative.push(`Impression: ${imaging.impression}`);
    }
    narrative.push('');
  }
  
  // Other Diagnostic Results
  if (input.other_diagnostic_results.length > 0) {
    narrative.push('Other Diagnostic Results:');
    for (const test of input.other_diagnostic_results) {
      narrative.push(`${test.test_name}: ${test.result}`);
    }
  }
  
  return narrative.join('\n');
}

function createStructuredData(input: DocumentObjectiveInput): {
  vital_signs: any;
  physical_examination: any;
  laboratory_results: any[];
  imaging_results: any[];
  other_diagnostic_results: any[];
} {
  return {
    vital_signs: input.vital_signs,
    physical_examination: input.physical_examination,
    laboratory_results: input.laboratory_results,
    imaging_results: input.imaging_results,
    other_diagnostic_results: input.other_diagnostic_results
  };
}

function identifyAbnormalFindings(input: DocumentObjectiveInput): Array<{
  category: string;
  finding: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  clinical_significance: string;
}> {
  const abnormalFindings: Array<{
    category: string;
    finding: string;
    severity: 'mild' | 'moderate' | 'severe' | 'critical';
    clinical_significance: string;
  }> = [];
  
  // Check vital signs for abnormalities
  if (input.vital_signs.heart_rate > 100) {
    abnormalFindings.push({
      category: 'Vital Signs',
      finding: `Tachycardia: HR ${input.vital_signs.heart_rate} bpm`,
      severity: input.vital_signs.heart_rate > 120 ? 'moderate' : 'mild',
      clinical_significance: 'May indicate stress, fever, or cardiac issues'
    });
  }
  
  if (input.vital_signs.heart_rate < 60) {
    abnormalFindings.push({
      category: 'Vital Signs',
      finding: `Bradycardia: HR ${input.vital_signs.heart_rate} bpm`,
      severity: input.vital_signs.heart_rate < 50 ? 'moderate' : 'mild',
      clinical_significance: 'May indicate medication effects or cardiac conduction issues'
    });
  }
  
  if (input.vital_signs.oxygen_saturation < 95) {
    abnormalFindings.push({
      category: 'Vital Signs',
      finding: `Low oxygen saturation: ${input.vital_signs.oxygen_saturation}%`,
      severity: input.vital_signs.oxygen_saturation < 90 ? 'severe' : 'moderate',
      clinical_significance: 'May indicate respiratory or cardiac issues'
    });
  }
  
  // Check laboratory results for abnormalities
  for (const lab of input.laboratory_results) {
    if (lab.flag === 'high' || lab.flag === 'low' || lab.flag === 'critical') {
      abnormalFindings.push({
        category: 'Laboratory',
        finding: `${lab.test_name}: ${lab.result} (${lab.flag})`,
        severity: lab.flag === 'critical' ? 'critical' : 'moderate',
        clinical_significance: `Abnormal ${lab.test_name} may indicate underlying pathology`
      });
    }
  }
  
  // Check physical examination for abnormalities
  if (input.physical_examination.systems_examined.cardiovascular.murmurs && 
      input.physical_examination.systems_examined.cardiovascular.murmurs !== 'None') {
    abnormalFindings.push({
      category: 'Physical Examination',
      finding: `Cardiac murmur: ${input.physical_examination.systems_examined.cardiovascular.murmurs}`,
      severity: 'mild',
      clinical_significance: 'May indicate valvular disease or flow abnormalities'
    });
  }
  
  if (input.physical_examination.systems_examined.cardiovascular.edema && 
      input.physical_examination.systems_examined.cardiovascular.edema !== 'None') {
    abnormalFindings.push({
      category: 'Physical Examination',
      finding: `Edema: ${input.physical_examination.systems_examined.cardiovascular.edema}`,
      severity: 'moderate',
      clinical_significance: 'May indicate heart failure, venous insufficiency, or other conditions'
    });
  }
  
  return abnormalFindings;
}

function identifyCriticalValues(input: DocumentObjectiveInput): Array<{
  test_name: string;
  value: string;
  reference_range: string;
  clinical_implication: string;
}> {
  const criticalValues: Array<{
    test_name: string;
    value: string;
    reference_range: string;
    clinical_implication: string;
  }> = [];
  
  // Check laboratory results for critical values
  for (const lab of input.laboratory_results) {
    if (lab.flag === 'critical') {
      criticalValues.push({
        test_name: lab.test_name,
        value: lab.result,
        reference_range: lab.reference_range,
        clinical_implication: `Critical ${lab.test_name} value requires immediate attention`
      });
    }
  }
  
  // Check vital signs for critical values
  if (input.vital_signs.oxygen_saturation < 90) {
    criticalValues.push({
      test_name: 'Oxygen Saturation',
      value: `${input.vital_signs.oxygen_saturation}%`,
      reference_range: '95-100%',
      clinical_implication: 'Critical hypoxemia - immediate oxygen therapy required'
    });
  }
  
  if (input.vital_signs.heart_rate > 150 || input.vital_signs.heart_rate < 40) {
    criticalValues.push({
      test_name: 'Heart Rate',
      value: `${input.vital_signs.heart_rate} bpm`,
      reference_range: '60-100 bpm',
      clinical_implication: 'Critical heart rate - immediate cardiac assessment required'
    });
  }
  
  return criticalValues;
}

function analyzeTrends(input: DocumentObjectiveInput): Array<{
  parameter: string;
  previous_value: string;
  current_value: string;
  trend: 'improving' | 'stable' | 'worsening';
}> {
  // This is a simplified implementation
  // In practice, this would compare with previous visit data
  const trends: Array<{
    parameter: string;
    previous_value: string;
    current_value: string;
    trend: 'improving' | 'stable' | 'worsening';
  }> = [];
  
  // Example trend analysis (would need actual previous data)
  trends.push({
    parameter: 'Heart Rate',
    previous_value: '85 bpm',
    current_value: `${input.vital_signs.heart_rate} bpm`,
    trend: input.vital_signs.heart_rate > 85 ? 'worsening' : 'stable'
  });
  
  return trends;
}
