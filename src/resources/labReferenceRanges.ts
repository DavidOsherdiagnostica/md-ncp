/**
 * Lab Reference Ranges Resource
 * Comprehensive laboratory reference ranges by age, gender, and population
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ResourceMetadata } from "../types/mcp.js";

// Schema for lab reference ranges
const LabReferenceRangeSchema = z.object({
  test_name: z.string().describe("Name of the laboratory test"),
  category: z.string().describe("Test category (CBC, Chemistry, etc.)"),
  age_group: z.string().describe("Age group (Adult, Pediatric, Elderly)"),
  gender: z.string().describe("Gender (Male, Female, Both)"),
  normal_range: z.string().describe("Normal reference range"),
  units: z.string().describe("Units of measurement"),
  critical_low: z.string().optional().describe("Critical low value"),
  critical_high: z.string().optional().describe("Critical high value"),
  notes: z.string().optional().describe("Additional clinical notes")
});

const LabReferenceRangesSchema = z.array(LabReferenceRangeSchema);

// Comprehensive lab reference data
const LAB_REFERENCE_DATA = [
  // Complete Blood Count (CBC)
  {
    test_name: "Hemoglobin",
    category: "CBC",
    age_group: "Adult",
    gender: "Male",
    normal_range: "13.8-17.2",
    units: "g/dL",
    critical_low: "<7.0",
    critical_high: ">20.0",
    notes: "Lower in elderly, higher in athletes"
  },
  {
    test_name: "Hemoglobin",
    category: "CBC",
    age_group: "Adult",
    gender: "Female",
    normal_range: "12.1-15.1",
    units: "g/dL",
    critical_low: "<7.0",
    critical_high: ">20.0",
    notes: "Lower during menstruation, pregnancy"
  },
  {
    test_name: "Hemoglobin",
    category: "CBC",
    age_group: "Pediatric",
    gender: "Both",
    normal_range: "10.0-13.0",
    units: "g/dL",
    critical_low: "<7.0",
    critical_high: ">18.0",
    notes: "Age 0-1 years"
  },
  {
    test_name: "White Blood Cell Count",
    category: "CBC",
    age_group: "Adult",
    gender: "Both",
    normal_range: "4.5-11.0",
    units: "K/μL",
    critical_low: "<2.0",
    critical_high: ">30.0",
    notes: "Higher in pregnancy, lower in elderly"
  },
  {
    test_name: "Platelet Count",
    category: "CBC",
    age_group: "Adult",
    gender: "Both",
    normal_range: "150-450",
    units: "K/μL",
    critical_low: "<50",
    critical_high: ">1000",
    notes: "Higher in women, lower in elderly"
  },

  // Basic Metabolic Panel
  {
    test_name: "Sodium",
    category: "Chemistry",
    age_group: "Adult",
    gender: "Both",
    normal_range: "136-145",
    units: "mEq/L",
    critical_low: "<120",
    critical_high: ">160",
    notes: "Stable across age groups"
  },
  {
    test_name: "Potassium",
    category: "Chemistry",
    age_group: "Adult",
    gender: "Both",
    normal_range: "3.5-5.0",
    units: "mEq/L",
    critical_low: "<2.5",
    critical_high: ">6.5",
    notes: "Higher in elderly, affected by medications"
  },
  {
    test_name: "Creatinine",
    category: "Chemistry",
    age_group: "Adult",
    gender: "Male",
    normal_range: "0.7-1.3",
    units: "mg/dL",
    critical_low: "<0.5",
    critical_high: ">4.0",
    notes: "Higher in males, increases with age"
  },
  {
    test_name: "Creatinine",
    category: "Chemistry",
    age_group: "Adult",
    gender: "Female",
    normal_range: "0.6-1.1",
    units: "mg/dL",
    critical_low: "<0.5",
    critical_high: ">4.0",
    notes: "Lower in females due to muscle mass"
  },
  {
    test_name: "BUN (Blood Urea Nitrogen)",
    category: "Chemistry",
    age_group: "Adult",
    gender: "Both",
    normal_range: "7-20",
    units: "mg/dL",
    critical_low: "<5",
    critical_high: ">100",
    notes: "Higher in elderly, affected by hydration"
  },
  {
    test_name: "Glucose (Fasting)",
    category: "Chemistry",
    age_group: "Adult",
    gender: "Both",
    normal_range: "70-100",
    units: "mg/dL",
    critical_low: "<40",
    critical_high: ">400",
    notes: "Higher in elderly, affected by diabetes"
  },

  // Liver Function Tests
  {
    test_name: "ALT (Alanine Aminotransferase)",
    category: "Liver Function",
    age_group: "Adult",
    gender: "Male",
    normal_range: "7-56",
    units: "U/L",
    critical_low: "<5",
    critical_high: ">500",
    notes: "Higher in males, increases with BMI"
  },
  {
    test_name: "ALT (Alanine Aminotransferase)",
    category: "Liver Function",
    age_group: "Adult",
    gender: "Female",
    normal_range: "7-40",
    units: "U/L",
    critical_low: "<5",
    critical_high: ">500",
    notes: "Lower in females, increases with BMI"
  },
  {
    test_name: "AST (Aspartate Aminotransferase)",
    category: "Liver Function",
    age_group: "Adult",
    gender: "Both",
    normal_range: "10-40",
    units: "U/L",
    critical_low: "<5",
    critical_high: ">500",
    notes: "Higher in elderly, affected by alcohol"
  },
  {
    test_name: "Total Bilirubin",
    category: "Liver Function",
    age_group: "Adult",
    gender: "Both",
    normal_range: "0.3-1.2",
    units: "mg/dL",
    critical_low: "<0.1",
    critical_high: ">10.0",
    notes: "Higher in males, increases with age"
  },

  // Lipid Panel
  {
    test_name: "Total Cholesterol",
    category: "Lipid Panel",
    age_group: "Adult",
    gender: "Both",
    normal_range: "<200",
    units: "mg/dL",
    critical_low: "<100",
    critical_high: ">300",
    notes: "Higher in elderly, affected by diet"
  },
  {
    test_name: "LDL Cholesterol",
    category: "Lipid Panel",
    age_group: "Adult",
    gender: "Both",
    normal_range: "<100",
    units: "mg/dL",
    critical_low: "<50",
    critical_high: ">190",
    notes: "Optimal <70 for high-risk patients"
  },
  {
    test_name: "HDL Cholesterol",
    category: "Lipid Panel",
    age_group: "Adult",
    gender: "Male",
    normal_range: ">40",
    units: "mg/dL",
    critical_low: "<20",
    critical_high: ">100",
    notes: "Higher is better, increases with exercise"
  },
  {
    test_name: "HDL Cholesterol",
    category: "Lipid Panel",
    age_group: "Adult",
    gender: "Female",
    normal_range: ">50",
    units: "mg/dL",
    critical_low: "<20",
    critical_high: ">100",
    notes: "Higher in females, decreases with menopause"
  },

  // Thyroid Function
  {
    test_name: "TSH (Thyroid Stimulating Hormone)",
    category: "Thyroid Function",
    age_group: "Adult",
    gender: "Both",
    normal_range: "0.4-4.0",
    units: "mIU/L",
    critical_low: "<0.01",
    critical_high: ">20.0",
    notes: "Higher in elderly, affected by medications"
  },
  {
    test_name: "Free T4",
    category: "Thyroid Function",
    age_group: "Adult",
    gender: "Both",
    normal_range: "0.8-1.8",
    units: "ng/dL",
    critical_low: "<0.3",
    critical_high: ">4.0",
    notes: "Stable across age groups"
  },

  // Coagulation Studies
  {
    test_name: "PT (Prothrombin Time)",
    category: "Coagulation",
    age_group: "Adult",
    gender: "Both",
    normal_range: "11-13",
    units: "seconds",
    critical_low: "<8",
    critical_high: ">20",
    notes: "Higher in elderly, affected by warfarin"
  },
  {
    test_name: "INR (International Normalized Ratio)",
    category: "Coagulation",
    age_group: "Adult",
    gender: "Both",
    normal_range: "0.8-1.1",
    units: "ratio",
    critical_low: "<0.5",
    critical_high: ">5.0",
    notes: "Target 2.0-3.0 for warfarin therapy"
  }
];

export function registerLabReferenceRanges(server: McpServer): void {
  const resourceName = "lab_reference_ranges";
  const resourceUri = "mcp://md-mcp/lab-reference-ranges";

  const resourceConfig: ResourceMetadata = {
    title: "Laboratory Reference Ranges",
    description: `**Comprehensive Laboratory Reference Ranges**

This resource provides detailed laboratory reference ranges organized by:
- **Test Categories**: CBC, Chemistry, Liver Function, Lipid Panel, Thyroid, Coagulation
- **Age Groups**: Adult, Pediatric, Elderly
- **Gender Differences**: Male, Female, Both
- **Critical Values**: Critical low and high values for each test
- **Clinical Notes**: Important considerations for interpretation

**Key Features:**
- Evidence-based reference ranges
- Age and gender-specific values
- Critical value alerts
- Clinical interpretation notes
- Searchable by test name, category, or age group

**Usage Examples:**
- Search for "Hemoglobin" to get age/gender-specific ranges
- Filter by "CBC" category for complete blood count values
- Check critical values for emergency situations
- Compare pediatric vs adult ranges

**Perfect for:** Clinical decision support, result interpretation, quality assurance`,
    schema: LabReferenceRangesSchema,
  };

  const resourceFetcher = async (uri: URL) => {
    const query = uri.searchParams.get('query')?.toLowerCase() || '';
    const category = uri.searchParams.get('category')?.toLowerCase() || '';
    const ageGroup = uri.searchParams.get('age_group')?.toLowerCase() || '';
    const gender = uri.searchParams.get('gender')?.toLowerCase() || '';

    let filteredData = LAB_REFERENCE_DATA;

    // Apply filters
    if (query) {
      filteredData = filteredData.filter(item =>
        item.test_name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.notes?.toLowerCase().includes(query)
      );
    }

    if (category) {
      filteredData = filteredData.filter(item =>
        item.category.toLowerCase().includes(category)
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

    // Create a single comprehensive resource with all data
    const allDataText = filteredData.map(item => 
      `**${item.test_name}** (${item.category})
**Age Group:** ${item.age_group} | **Gender:** ${item.gender}
**Normal Range:** ${item.normal_range} ${item.units}
**Critical Values:** ${item.critical_low || 'N/A'} - ${item.critical_high || 'N/A'}
**Notes:** ${item.notes || 'No additional notes'}
---`
    ).join('\n\n');

    return {
      resources: [{
        uri: `mcp://md-mcp/lab-reference-ranges`,
        name: "Laboratory Reference Ranges",
        description: `Comprehensive laboratory reference ranges database with ${filteredData.length} tests`,
        mimeType: 'text/plain',
        size: allDataText.length,
        _meta: { total_tests: filteredData.length, categories: [...new Set(filteredData.map(item => item.category))] }
      }],
      contents: [{
        uri: `mcp://md-mcp/lab-reference-ranges`,
        text: `# Laboratory Reference Ranges Database\n\n${allDataText}`,
        blob: '',
        _meta: { total_tests: filteredData.length, categories: [...new Set(filteredData.map(item => item.category))] }
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
