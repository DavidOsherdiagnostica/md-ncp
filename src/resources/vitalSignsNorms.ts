/**
 * Vital Signs Normal Ranges Resource
 * Comprehensive vital signs reference ranges by age, gender, and clinical context
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ResourceMetadata } from "../types/mcp.js";

// Schema for vital signs normal ranges
const VitalSignsRangeSchema = z.object({
  vital_sign: z.string().describe("Name of the vital sign"),
  age_group: z.string().describe("Age group (Newborn, Infant, Child, Adult, Elderly)"),
  gender: z.string().describe("Gender (Male, Female, Both)"),
  normal_range: z.string().describe("Normal range values"),
  units: z.string().describe("Units of measurement"),
  critical_low: z.string().optional().describe("Critical low value"),
  critical_high: z.string().optional().describe("Critical high value"),
  clinical_context: z.string().optional().describe("Clinical context or conditions"),
  notes: z.string().optional().describe("Additional clinical notes")
});

const VitalSignsRangesSchema = z.array(VitalSignsRangeSchema);

// Comprehensive vital signs data
const VITAL_SIGNS_DATA = [
  // Heart Rate (Pulse)
  {
    vital_sign: "Heart Rate",
    age_group: "Newborn",
    gender: "Both",
    normal_range: "100-160",
    units: "bpm",
    critical_low: "<80",
    critical_high: ">200",
    clinical_context: "Resting, awake",
    notes: "Higher during crying, feeding, or activity"
  },
  {
    vital_sign: "Heart Rate",
    age_group: "Infant",
    gender: "Both",
    normal_range: "80-140",
    units: "bpm",
    critical_low: "<70",
    critical_high: ">180",
    clinical_context: "Resting, awake",
    notes: "Decreases with age, higher during sleep"
  },
  {
    vital_sign: "Heart Rate",
    age_group: "Child",
    gender: "Both",
    normal_range: "70-120",
    units: "bpm",
    critical_low: "<60",
    critical_high: ">160",
    clinical_context: "Resting, awake",
    notes: "Athletes may have lower resting rates"
  },
  {
    vital_sign: "Heart Rate",
    age_group: "Adult",
    gender: "Both",
    normal_range: "60-100",
    units: "bpm",
    critical_low: "<40",
    critical_high: ">150",
    clinical_context: "Resting, awake",
    notes: "Athletes: 40-60 bpm, higher in elderly"
  },
  {
    vital_sign: "Heart Rate",
    age_group: "Elderly",
    gender: "Both",
    normal_range: "60-100",
    units: "bpm",
    critical_low: "<40",
    critical_high: ">120",
    clinical_context: "Resting, awake",
    notes: "May be higher due to medications, lower fitness"
  },

  // Blood Pressure
  {
    vital_sign: "Systolic Blood Pressure",
    age_group: "Newborn",
    gender: "Both",
    normal_range: "70-90",
    units: "mmHg",
    critical_low: "<50",
    critical_high: ">120",
    clinical_context: "Resting, awake",
    notes: "Increases with gestational age"
  },
  {
    vital_sign: "Systolic Blood Pressure",
    age_group: "Infant",
    gender: "Both",
    normal_range: "80-110",
    units: "mmHg",
    critical_low: "<60",
    critical_high: ">130",
    clinical_context: "Resting, awake",
    notes: "Increases with age and weight"
  },
  {
    vital_sign: "Systolic Blood Pressure",
    age_group: "Child",
    gender: "Both",
    normal_range: "90-120",
    units: "mmHg",
    critical_low: "<70",
    critical_high: ">140",
    clinical_context: "Resting, awake",
    notes: "Use age-appropriate cuff size"
  },
  {
    vital_sign: "Systolic Blood Pressure",
    age_group: "Adult",
    gender: "Both",
    normal_range: "90-120",
    units: "mmHg",
    critical_low: "<70",
    critical_high: ">180",
    clinical_context: "Resting, awake",
    notes: "Normal: <120, Elevated: 120-129, Stage 1: 130-139, Stage 2: ≥140"
  },
  {
    vital_sign: "Diastolic Blood Pressure",
    age_group: "Adult",
    gender: "Both",
    normal_range: "60-80",
    units: "mmHg",
    critical_low: "<40",
    critical_high: ">110",
    clinical_context: "Resting, awake",
    notes: "Normal: <80, Elevated: <80, Stage 1: 80-89, Stage 2: ≥90"
  },

  // Respiratory Rate
  {
    vital_sign: "Respiratory Rate",
    age_group: "Newborn",
    gender: "Both",
    normal_range: "30-60",
    units: "breaths/min",
    critical_low: "<20",
    critical_high: ">80",
    clinical_context: "Resting, awake",
    notes: "Count for full minute, irregular in newborns"
  },
  {
    vital_sign: "Respiratory Rate",
    age_group: "Infant",
    gender: "Both",
    normal_range: "25-40",
    units: "breaths/min",
    critical_low: "<20",
    critical_high: ">60",
    clinical_context: "Resting, awake",
    notes: "Higher during crying, feeding"
  },
  {
    vital_sign: "Respiratory Rate",
    age_group: "Child",
    gender: "Both",
    normal_range: "20-30",
    units: "breaths/min",
    critical_low: "<15",
    critical_high: ">40",
    clinical_context: "Resting, awake",
    notes: "Count for full minute, may be irregular"
  },
  {
    vital_sign: "Respiratory Rate",
    age_group: "Adult",
    gender: "Both",
    normal_range: "12-20",
    units: "breaths/min",
    critical_low: "<8",
    critical_high: ">30",
    clinical_context: "Resting, awake",
    notes: "Higher in elderly, athletes, anxiety"
  },
  {
    vital_sign: "Respiratory Rate",
    age_group: "Elderly",
    gender: "Both",
    normal_range: "12-20",
    units: "breaths/min",
    critical_low: "<8",
    critical_high: ">25",
    clinical_context: "Resting, awake",
    notes: "May be higher due to chronic conditions"
  },

  // Temperature
  {
    vital_sign: "Temperature",
    age_group: "All",
    gender: "Both",
    normal_range: "97.8-99.1",
    units: "°F",
    critical_low: "<95.0",
    critical_high: ">104.0",
    clinical_context: "Oral, resting",
    notes: "Rectal: +0.5-1.0°F, Axillary: -0.5-1.0°F"
  },
  {
    vital_sign: "Temperature",
    age_group: "All",
    gender: "Both",
    normal_range: "36.5-37.3",
    units: "°C",
    critical_low: "<35.0",
    critical_high: ">40.0",
    clinical_context: "Oral, resting",
    notes: "Rectal: +0.3-0.6°C, Axillary: -0.3-0.6°C"
  },

  // Oxygen Saturation
  {
    vital_sign: "Oxygen Saturation",
    age_group: "All",
    gender: "Both",
    normal_range: "95-100",
    units: "%",
    critical_low: "<90",
    critical_high: ">100",
    clinical_context: "Room air, resting",
    notes: "Lower in COPD patients, higher altitudes"
  },
  {
    vital_sign: "Oxygen Saturation",
    age_group: "Elderly",
    gender: "Both",
    normal_range: "92-100",
    units: "%",
    critical_low: "<88",
    critical_high: ">100",
    clinical_context: "Room air, resting",
    notes: "May be lower due to chronic lung disease"
  },

  // Pain Scale
  {
    vital_sign: "Pain Scale",
    age_group: "Adult",
    gender: "Both",
    normal_range: "0-3",
    units: "0-10 scale",
    critical_low: "0",
    critical_high: ">7",
    clinical_context: "Self-reported",
    notes: "0=No pain, 1-3=Mild, 4-6=Moderate, 7-10=Severe"
  },
  {
    vital_sign: "Pain Scale",
    age_group: "Pediatric",
    gender: "Both",
    normal_range: "0-3",
    units: "0-10 scale",
    critical_low: "0",
    critical_high: ">7",
    clinical_context: "Age-appropriate scale",
    notes: "Use FLACC scale for infants, Wong-Baker for children"
  },

  // Weight and Height (for BMI calculation)
  {
    vital_sign: "BMI (Body Mass Index)",
    age_group: "Adult",
    gender: "Both",
    normal_range: "18.5-24.9",
    units: "kg/m²",
    critical_low: "<16.0",
    critical_high: ">40.0",
    clinical_context: "Calculated",
    notes: "Underweight: <18.5, Normal: 18.5-24.9, Overweight: 25-29.9, Obese: ≥30"
  },
  {
    vital_sign: "BMI (Body Mass Index)",
    age_group: "Elderly",
    gender: "Both",
    normal_range: "22-27",
    units: "kg/m²",
    critical_low: "<18.5",
    critical_high: ">35.0",
    clinical_context: "Calculated",
    notes: "Slightly higher range acceptable in elderly"
  }
];

export function registerVitalSignsNorms(server: McpServer): void {
  const resourceName = "vital_signs_norms";
  const resourceUri = "mcp://md-mcp/vital-signs-norms";

  const resourceConfig: ResourceMetadata = {
    title: "Vital Signs Normal Ranges",
    description: `**Comprehensive Vital Signs Reference Ranges**

This resource provides detailed vital signs normal ranges organized by:
- **Age Groups**: Newborn, Infant, Child, Adult, Elderly
- **Gender Differences**: Male, Female, Both
- **Clinical Context**: Resting, awake, activity levels
- **Critical Values**: Critical low and high values for each vital sign
- **Clinical Notes**: Important considerations for interpretation

**Vital Signs Included:**
- **Heart Rate**: Age-specific ranges with athletic considerations
- **Blood Pressure**: Systolic and diastolic with hypertension staging
- **Respiratory Rate**: Age-specific with clinical context
- **Temperature**: Oral, rectal, axillary with conversion notes
- **Oxygen Saturation**: Room air and supplemental oxygen
- **Pain Scale**: Adult and pediatric scales
- **BMI**: Adult and elderly ranges

**Key Features:**
- Evidence-based reference ranges
- Age and gender-specific values
- Critical value alerts
- Clinical interpretation notes
- Searchable by vital sign, age group, or gender

**Usage Examples:**
- Search for "Heart Rate" to get age-specific ranges
- Filter by "Adult" age group for adult vital signs
- Check critical values for emergency situations
- Compare pediatric vs adult ranges

**Perfect for:** Clinical assessment, vital signs interpretation, emergency care, pediatric care`,
    schema: VitalSignsRangesSchema,
  };

  const resourceFetcher = async (uri: URL) => {
    const query = uri.searchParams.get('query')?.toLowerCase() || '';
    const ageGroup = uri.searchParams.get('age_group')?.toLowerCase() || '';
    const gender = uri.searchParams.get('gender')?.toLowerCase() || '';
    const vitalSign = uri.searchParams.get('vital_sign')?.toLowerCase() || '';

    let filteredData = VITAL_SIGNS_DATA;

    // Apply filters
    if (query) {
      filteredData = filteredData.filter(item =>
        item.vital_sign.toLowerCase().includes(query) ||
        item.age_group.toLowerCase().includes(query) ||
        item.notes?.toLowerCase().includes(query) ||
        item.clinical_context?.toLowerCase().includes(query)
      );
    }

    if (ageGroup) {
      filteredData = filteredData.filter(item =>
        item.age_group.toLowerCase().includes(ageGroup)
      );
    }

    if (gender) {
      filteredData = filteredData.filter(item =>
        item.gender.toLowerCase().includes(gender) ||
        item.gender.toLowerCase() === 'both'
      );
    }

    if (vitalSign) {
      filteredData = filteredData.filter(item =>
        item.vital_sign.toLowerCase().includes(vitalSign)
      );
    }

    // Create a single comprehensive resource with all data
    const allDataText = filteredData.map(item => 
      `**${item.vital_sign}** (${item.age_group} | ${item.gender})
**Normal Range:** ${item.normal_range} ${item.units}
**Critical Values:** ${item.critical_low || 'N/A'} - ${item.critical_high || 'N/A'}
**Clinical Context:** ${item.clinical_context || 'General'}
**Notes:** ${item.notes || 'No additional notes'}
---`
    ).join('\n\n');

    return {
      resources: [{
        uri: `mcp://md-mcp/vital-signs-norms`,
        name: "Vital Signs Normal Ranges",
        description: `Comprehensive vital signs reference ranges database with ${filteredData.length} vital signs`,
        mimeType: 'text/plain',
        size: allDataText.length,
        _meta: { total_vital_signs: filteredData.length, age_groups: [...new Set(filteredData.map(item => item.age_group))] }
      }],
      contents: [{
        uri: `mcp://md-mcp/vital-signs-norms`,
        text: `# Vital Signs Normal Ranges Database\n\n${allDataText}`,
        blob: '',
        _meta: { total_vital_signs: filteredData.length, age_groups: [...new Set(filteredData.map(item => item.age_group))] }
      }]
    };
  };

  server.registerResource(
    resourceName,
    resourceUri,
    resourceConfig,
    resourceFetcher
  );
}
