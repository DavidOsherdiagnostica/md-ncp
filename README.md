# 🏥 Israel Drugs MCP Server

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC_BY--NC--SA_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue.svg)](https://modelcontextprotocol.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)

> **Revolutionary Model Context Protocol server providing AI agents with comprehensive access to Israel's complete pharmaceutical database from the Ministry of Health.**

The first MCP server to bridge Israel's healthcare data with AI, enabling Claude and other AI agents to provide evidence-based medication guidance, safety assessments, and therapeutic recommendations using real-time Israeli pharmaceutical data.

---

## 🌟 What Makes This Special

### **The World's First Israeli Pharmaceutical AI Integration**
- **Complete Database Access**: Every medication registered with Israel's Ministry of Health
- **Real-Time Data**: Current pricing, health basket coverage, and availability
- **Clinical Intelligence**: Advanced therapeutic comparison and safety assessment
- **Israeli Context**: Tailored for Israel's healthcare system, regulations, and population

### **Revolutionary Pre-Built Clinical Prompts** 🧠
Unlike basic MCP servers, this includes **3 professional-grade prompt templates** that transform AI into a clinical decision support system:

1. **🔬 `compare_therapeutic_options`** - Comprehensive medication comparison with weighted scoring matrices
2. **⚠️ `drug_safety_verification`** - Complete safety assessment with risk stratification 
3. **🏥 `symptom_to_treatment_workflow`** - Evidence-based symptom-to-treatment pathways

---

## 🚀 Key Features

### **📊 Comprehensive Drug Information**
- **1,172+ therapeutic categories** (ATC classification system)
- **Complete medication profiles** including indications, contraindications, dosing
- **Visual identification** with official product images
- **Health basket status** and pricing information
- **Generic alternatives** and therapeutic equivalents

### **🔍 Advanced Search Capabilities**
- Drug name search (Hebrew/English with fuzzy matching)
- Symptom-based treatment discovery
- Therapeutic category exploration
- Administration route filtering
- Safety and interaction screening

### **🧠 Clinical Intelligence Features**
- **Automated comparison reports** with professional-grade analysis
- **Risk assessment frameworks** for patient safety
- **Treatment pathway optimization** for Israeli healthcare system
- **Evidence-based recommendations** with clinical rationale

### **🇮🇱 Israeli Healthcare Integration**
- Ministry of Health approval status
- Health fund coverage (Clalit, Maccabi, Meuhedet, Leumit)
- Kupat Cholim formulary alignment
- Hebrew/Arabic/Russian patient education materials
- Cultural and religious medication considerations

---

## 📖 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Core Tools](#-core-tools)
- [Clinical Prompts](#-clinical-prompts)
- [Usage Examples](#-usage-examples)
- [Advanced Features](#-advanced-features)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🛠 Installation

### **Prerequisites**
- Node.js 18+
- Claude Desktop app or MCP-compatible client
- Internet connection for real-time data access

### **Option 1: Quick Install (Recommended)**
```bash
# Install globally
npm install -g israel-drugs-mcp-server

# Or use with npx (no installation needed)
npx israel-drugs-mcp-server
```

### **Option 2: Development Setup**
```bash
# Clone repository
git clone https://github.com/DavidOsherDevDev/israel-drugs-mcp-server.git
cd israel-drugs-mcp-server

# Install dependencies
npm install

# Build project
npm run build

# Start server
npm start
```

### **Claude Desktop Configuration**
Add to your Claude Desktop settings (`~/.claude.json` or `%APPDATA%\Claude\claude.json`):

```json
{
  "mcpServers": {
    "israel-drugs": {
      "command": "npx",
      "args": ["israel-drugs-mcp-server"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

---

## 🚀 Quick Start

### **1. Basic Medication Search**
```plaintext
"Find information about Paracetamol for children"
```

### **2. Professional Drug Comparison** 
```plaintext
"Use the therapeutic comparison tool to compare Nurofen vs Advil for children ages 3-5 with headaches"
```

### **3. Safety Assessment**
```plaintext
"Run a safety check for Warfarin in an elderly patient with diabetes and hypertension"
```

### **4. Symptom-Based Treatment**
```plaintext
"What treatments are available for fever and headache in a 35-year-old patient?"
```

---

## 🔧 Core Tools

### **🔍 `discover_drug_by_name`**
**Purpose**: Comprehensive medication search and information retrieval

**Parameters**:
- `medication_query` (required): Drug name or partial name
- `patient_preferences`: Budget, prescription access, availability preferences  
- `search_scope`: Search breadth (exact, similar, broad)

**Use Case**: Primary tool for medication identification and detailed information access.

**Example**: 
```javascript
discover_drug_by_name({
  medication_query: "אדויל לילדים",
  patient_preferences: { budget_conscious: true },
  search_scope: "similar_names"
})
```

### **🏥 `find_drugs_for_symptom`**
**Purpose**: Evidence-based treatment discovery for specific symptoms

**Parameters**:
- `primary_category` (required): Main symptom category
- `specific_symptom` (required): Targeted symptom
- `treatment_preferences`: OTC preference, health basket priority, result limits

**Use Case**: Clinical decision support for symptom-based treatment selection.

### **🔬 `explore_generic_alternatives`**  
**Purpose**: Therapeutic alternatives and generic options discovery

**Parameters**:
- `search_criteria`: Active ingredient, ATC code, administration route, or reference drug
- `comparison_criteria`: Health basket priority, price comparison, strength matching

**Use Case**: Cost-effective prescribing and formulary management.

### **📋 `browse_available_symptoms`**
**Purpose**: Systematic exploration of treatable conditions

**Parameters**:
- `category_filter`: Specific medical specialty
- `include_popular_symptoms`: Show frequently searched conditions
- `clinical_priority_order`: Organize by urgency

**Use Case**: Treatment pathway discovery and clinical education.

### **💊 `get_comprehensive_drug_info`**
**Purpose**: Complete medication monograph with regulatory details

**Parameters**:
- `drug_registration_number` (required): Official registration number
- `info_depth`: Basic, detailed, or comprehensive information level
- `language_preference`: Hebrew, English, or both

**Use Case**: Detailed clinical review and regulatory compliance verification.

### **📸 `verify_drug_visual_identity`**
**Purpose**: Visual medication identification and verification

**Parameters**:
- `drug_registration_number` (required): Drug registration number
- `image_purpose`: Identification, verification, or patient education

**Use Case**: Medication safety and error prevention.

### **📝 `suggest_drug_names`**
**Purpose**: Intelligent spelling correction and name completion

**Parameters**:
- `partial_name` (required): Partial or misspelled drug name
- `search_type`: Trade names, active ingredients, or both
- `max_suggestions`: Number of suggestions to return

**Use Case**: Accurate medication identification with error correction.

### **🗺 `list_administration_routes`**
**Purpose**: Comprehensive administration pathway information

**Parameters**:
- `complexity_level`: Simple, moderate, complex, or all routes
- `patient_age_group`: Age-appropriate administration methods
- `onset_requirements`: Desired therapeutic onset timing

**Use Case**: Route selection optimization and patient-appropriate delivery methods.

### **🧬 `explore_therapeutic_categories`**
**Purpose**: ATC classification system exploration and drug discovery

**Parameters**:
- `level`: Classification depth (main groups, subgroups, all)
- `therapeutic_area`: Medical specialty or anatomical system
- `include_usage_patterns`: Prescribing frequency and clinical patterns

**Use Case**: Systematic therapeutic exploration and formulary development.

---

## 🧠 Clinical Prompts (The Secret Weapon)

### **🔬 `compare_therapeutic_options`**
**The Professional Drug Comparison Engine**

Transform Claude into a clinical pharmacologist with this comprehensive comparison framework.

**Input Parameters**:
- `drug_list` (required): Comma-separated medications
- `clinical_context`: Indication or medical condition
- `target_population`: Patient demographic (e.g., "elderly", "pediatric")
- `comparison_focus`: Primary analysis area (safety, efficacy, cost)
- `decision_framework`: Decision-making approach

**What It Generates**:
- **Weighted Scoring Matrix**: Professional-grade comparison with numerical scores
- **Clinical Efficacy Analysis**: Evidence-based effectiveness evaluation
- **Safety Profile Comparison**: Comprehensive adverse event assessment
- **Economic Impact Analysis**: Israeli healthcare cost considerations
- **Implementation Strategy**: Phase-by-phase rollout plan
- **Evidence-Based Recommendations**: Clinical decision support

**Example Usage**:
```plaintext
Use the therapeutic comparison prompt:
- drug_list: "Nurofen,Advil,Tylenol"
- clinical_context: "pediatric pain management"  
- target_population: "children ages 3-5"
- comparison_focus: "safety and efficacy"
```

**Output Sample**: Complete 15-page clinical analysis with decision matrices, implementation timelines, and evidence-based recommendations.

### **⚠️ `drug_safety_verification`**
**Comprehensive Medication Safety Assessment**

Professional-grade safety evaluation system for medication review.

**Input Parameters**:
- `drug_identifier` (required): Medication name or registration number
- `patient_age_group`: Age category for population-specific assessment
- `medical_conditions`: Relevant comorbidities
- `current_medications`: Concurrent therapy for interaction screening
- `allergies`: Known sensitivities
- `safety_concerns`: Specific focus areas
- `risk_tolerance`: Acceptable risk level

**What It Generates**:
- **Regulatory Safety Status**: Current approval and alert history
- **Clinical Safety Profile**: Complete adverse event analysis
- **Patient-Specific Risk Assessment**: Individualized safety evaluation
- **Drug Interaction Analysis**: Comprehensive interaction screening
- **Monitoring Strategy**: Risk mitigation and surveillance protocols
- **Emergency Management**: Response protocols for adverse events

### **🏥 `symptom_to_treatment_workflow`**
**Evidence-Based Clinical Pathways**

Transform symptom presentation into structured treatment protocols.

**Input Parameters**:
- `presenting_symptoms` (required): Symptom list
- `patient_age`: Age or age group
- `medical_history`: Relevant past medical history
- `severity_assessment`: Symptom severity level
- `treatment_goals`: Desired outcomes
- `resource_constraints`: Budget or access limitations

**What It Generates**:
- **Systematic Clinical Assessment**: Structured symptom characterization
- **Differential Diagnosis**: Evidence-based diagnostic considerations
- **Treatment Algorithm**: Step-by-step therapeutic approach
- **Israeli Healthcare Integration**: System-specific implementation
- **Monitoring Framework**: Outcome assessment and quality measures
- **Patient Education Strategy**: Comprehensive care planning

---

## 💡 Usage Examples

### **Example 1: Basic Medication Lookup**
```plaintext
Human: "What is the health basket status of Symbicort?"

AI Response: Using discover_drug_by_name for "Symbicort"...
Found: SYMBICORT TURBUHALER 160/4.5 MCG
- Health Basket: ✅ Included
- Prescription Required: Yes
- Price: 89.45 NIS
- Manufacturer: AstraZeneca
- Indication: Asthma and COPD maintenance therapy
```

### **Example 2: Professional Drug Comparison**
```plaintext
Human: "Compare Lipitor vs Crestor for a 65-year-old with diabetes using the comparison tool"

AI: Using compare_therapeutic_options...
[Generates complete 12-page clinical analysis including:]

WEIGHTED SCORING MATRIX:
| Criteria | Weight | Lipitor | Crestor | Winner |
|----------|--------|---------|---------|---------|
| Clinical Efficacy | 30% | 4.2 | 4.5 | Crestor |
| Safety Profile | 25% | 4.0 | 4.3 | Crestor |
| Economic Impact | 20% | 3.8 | 3.2 | Lipitor |
| Patient Experience | 15% | 4.1 | 4.0 | Lipitor |
| Implementation | 10% | 4.2 | 3.9 | Lipitor |

FINAL RECOMMENDATION: Crestor (4.18) vs Lipitor (4.02)
Primary choice: Crestor with enhanced monitoring for diabetes interactions
```

### **Example 3: Safety Assessment**
```plaintext
Human: "Safety check for Metformin in elderly patient with kidney disease"

AI: Using drug_safety_verification...
[Generates comprehensive safety analysis:]

🔴 MODERATE RISK IDENTIFIED
- Renal impairment contraindication (eGFR <30)
- Lactic acidosis risk in elderly
- Dose reduction required for eGFR 30-45
- Enhanced monitoring protocol recommended
- Alternative: DPP-4 inhibitors may be safer
```

### **Example 4: Symptom-Based Treatment**
```plaintext
Human: "Treatment options for persistent cough in smoker"

AI: Using symptom_to_treatment_workflow...
[Generates structured treatment pathway:]

IMMEDIATE ASSESSMENT:
- Smoking cessation counseling (Priority 1)
- Chest X-ray evaluation recommended
- Differentiate productive vs dry cough

TREATMENT ALGORITHM:
Step 1: Conservative management (1-2 weeks)
- Dextromethorphan for dry cough
- Guaifenesin for productive cough
- Honey and warm liquids

Step 2: Medical evaluation if persistent
- Clinical examination
- Consider antibiotics if bacterial
- Bronchodilator trial if wheezing

ISRAELI HEALTH SYSTEM:
- Available in health basket: Yes
- Family physician consultation: Recommended
- Pulmonology referral: If >3 weeks persistent
```

---

## 🏗 Advanced Features

### **🤖 AI-Powered Clinical Intelligence**
- **Natural Language Processing**: Understands medical terminology in Hebrew and English
- **Context-Aware Responses**: Maintains clinical context throughout conversations
- **Evidence Integration**: Real-time connection to Israeli regulatory data
- **Population Health Insights**: Israeli-specific epidemiological considerations

### **🔐 Enterprise-Grade Security**
- **Data Privacy**: No patient data stored or transmitted
- **API Rate Limiting**: Respectful usage of Ministry of Health resources  
- **Error Handling**: Graceful degradation and comprehensive error reporting
- **Audit Logging**: Complete interaction history for quality assurance

### **🌐 Multi-Language Support**
- **Hebrew**: Native support for Hebrew drug names and clinical terms
- **English**: International drug names and clinical terminology
- **Arabic**: Basic support for Arabic clinical communication
- **Russian**: Limited support for Russian-speaking population

### **📊 Analytics and Monitoring**
- **Usage Statistics**: Aggregate usage patterns (anonymized)
- **Performance Metrics**: Response times and error rates
- **Clinical Impact**: Treatment recommendation tracking
- **System Health**: Real-time monitoring and alerting

---

## 🛡 Safety and Disclaimers

### **⚠️ Important Medical Disclaimers**

**This MCP server is designed for informational and educational purposes only:**

- ❌ **NOT a substitute for professional medical advice**
- ❌ **NOT for emergency medical situations**
- ❌ **NOT validated for clinical decision-making**
- ✅ **Intended to support healthcare professionals**
- ✅ **Designed for educational and research use**

### **🏥 Clinical Recommendations**

1. **Always consult licensed healthcare providers** for medical decisions
2. **Verify all information** with current Israeli prescribing guidelines
3. **Consider individual patient factors** not captured in databases
4. **Report adverse events** to Israeli Ministry of Health systems
5. **Maintain professional liability insurance** when using in clinical contexts

### **📋 Data Accuracy**

- Information sourced from Israel Ministry of Health official databases
- Data updated regularly but may not reflect real-time changes
- Cross-reference critical information with official sources
- Report data discrepancies to maintain system accuracy

---

## 🤝 Contributing

We welcome contributions to improve Israeli healthcare AI! 

### **How to Contribute**

1. **🍴 Fork the Repository**
   ```bash
   git fork https://github.com/DavidOsherDevDev/israel-drugs-mcp-server.git
   ```

2. **🌿 Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-new-feature
   ```

3. **✨ Make Your Changes**
   - Add new clinical prompts
   - Improve data accuracy
   - Enhance Hebrew/Arabic support
   - Add new therapeutic categories

4. **🧪 Test Thoroughly**
   ```bash
   npm test
   npm run integration-test
   ```

5. **📝 Submit Pull Request**
   - Clear description of changes
   - Clinical rationale for modifications
   - Test cases and validation

### **🎯 Priority Contribution Areas**

- **Clinical Prompts**: Additional specialized prompt templates
- **Hebrew Localization**: Improved Hebrew clinical terminology
- **Safety Features**: Enhanced patient safety checks
- **Data Validation**: Improved accuracy and error detection
- **Performance**: Optimization for large-scale usage

### **📧 Contact & Support**

- **LinkedIn**: [@DavidOsher](https://linkedin.com/in/david-osher)
- **GitHub Issues**: Use repository issue tracker

---

## 📄 License

**Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**

### **✅ You are free to:**
- **Share** — copy and redistribute in any medium or format
- **Adapt** — remix, transform, and build upon the material

### **🔒 Under the following terms:**
- **Attribution** — Give appropriate credit to David Osher and this project
- **NonCommercial** — Not for commercial purposes without explicit permission
- **ShareAlike** — Distribute contributions under same license

### **💼 Commercial Licensing**
For commercial use or enterprise deployment, please contact via LinkedIn or GitHub.

**Full License**: [Creative Commons BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

---

## 🙏 Acknowledgments

### **Data Sources**
- **Israel Ministry of Health**: Official pharmaceutical database
- **Israeli Clinical Guidelines**: Professional medical recommendations

### **Technology**
- **Anthropic**: Model Context Protocol framework
- **Open Source Community**: Development tools and libraries

---

*Made with ❤️ for Israeli Healthcare*  
*Building bridges between AI and medicine, one prescription at a time.*

---

**⚡ Ready to get started?**
**[Get Started Now](#-installation) | [View on GitHub](https://github.com/DavidOsherDevDev/israel-drugs-mcp-server)**

