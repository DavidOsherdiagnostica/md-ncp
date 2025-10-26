# MD MCP - Medical Decision Model Context Protocol Server

## Overview

MD MCP (Medical Decision Model Context Protocol) is a specialized MCP server implementation that provides AI agents with structured tools to implement medical protocols. Unlike traditional MCP servers that connect to data sources, MD MCP implements clinical decision-making protocols as executable tool sets.

## Architecture

This server implements 5 core medical protocols plus resources and prompts:

### 1. Medication Reconciliation (MedRec) Protocol
- **gather_bpmh**: Collect comprehensive medication history from multiple sources
- **compare_medications**: Compare BPMH with admission/transfer orders to identify discrepancies
- **resolve_discrepancy**: Document resolution of identified medication discrepancies

### 2. Therapeutic Drug Monitoring (TDM) Protocol
- **assess_tdm_candidate**: Determine if a medication requires TDM
- **calculate_steady_state**: Calculate when drug reaches steady state for optimal sampling
- **plan_sample_collection**: Generate detailed instructions for blood sample collection
- **interpret_tdm_result**: Analyze TDM result and recommend dose adjustments
- **monitor_tdm_trends**: Track TDM results over time and identify patterns

### 3. Drug Interaction Screening Protocol
- **screen_interactions**: Comprehensive interaction screening for medication list
- **assess_interaction_significance**: Detailed clinical assessment of specific interaction
- **recommend_interaction_management**: Generate evidence-based management recommendations
- **document_interaction_decision**: Record clinical decision regarding interaction management

### 4. SOAP Documentation Protocol
- **document_subjective**: Capture patient's subjective information systematically
- **document_objective**: Record objective clinical findings
- **document_assessment**: Generate clinical assessment and differential diagnosis
- **document_plan**: Create detailed treatment and follow-up plan
- **compile_soap_note**: Compile complete SOAP note from all sections

### 5. Five Rights Medication Administration Protocol
- **verify_right_patient**: Confirm patient identity using two identifiers
- **verify_right_medication**: Confirm correct medication selection
- **verify_right_dose**: Confirm correct dose calculation and measurement
- **verify_right_route**: Confirm correct route of administration
- **verify_right_time**: Confirm medication timing is appropriate
- **verify_right_documentation**: Complete the sixth right - proper documentation

### Cross-Protocol Integration Tools
- **clinical_decision_support**: Integrate multiple protocols for comprehensive decision support
- **audit_trail**: Maintain complete audit trail across all protocols

## Medical Resources

The server provides structured medical reference data:

### 1. Laboratory Reference Ranges
- **Comprehensive lab values** with age/gender-specific ranges
- **Critical values** and clinical significance
- **Units and normal ranges** for all major laboratory tests

### 2. Vital Signs Norms
- **Age-specific vital signs** ranges
- **Gender differences** where applicable
- **Clinical context** for abnormal values

### 3. Clinical Decision Rules
- **Evidence-based clinical rules** for common conditions
- **Scoring systems** and risk stratification
- **Clinical guidelines** and protocols

## Medical Prompts

Structured prompts for clinical workflows:

### 1. Medication Reconciliation Prompt
- **Guides BPMH collection** process
- **Standardized questions** for medication history
- **Verification checklists**

### 2. TDM Analysis Prompt
- **TDM candidate assessment** guidance
- **Sample collection planning** instructions
- **Result interpretation** framework

### 3. SOAP Documentation Prompt
- **Systematic documentation** approach
- **SOAP format guidance** for each section
- **Quality assurance** checklists

### 4. Drug Interaction Prompt
- **Interaction screening** methodology
- **Risk assessment** framework
- **Management recommendations** structure

### 5. Clinical Decision Prompt
- **Multi-protocol integration** guidance
- **Decision support** framework
- **Quality metrics** tracking

## Installation

```bash
npm install -g md-mcp-server
```

## Usage

### Stdio Mode (for direct AI agent integration)
```bash
md-mcp-server
```

### HTTP Mode (for web-based integration)
```bash
md-mcp-server --http
```

## Configuration

The server supports the following configuration options:

- **MEDICAL_PROTOCOLS**: Enable/disable specific protocols
- **CLINICAL_SAFETY**: Configure safety features including clinical validation requirements
- **HIPAA_COMPLIANCE**: Enable HIPAA compliance features
- **AUDIT_ALL_DECISIONS**: Enable comprehensive audit logging

## Security & Compliance

- **HIPAA Compliance**: All patient data encrypted in transit and at rest
- **Clinical Safety**: All recommendations flagged as "AI-assisted, requires clinical validation"
- **Audit Trail**: Complete audit logging for all tool invocations
- **Role-based Access**: Control access to tool groups based on user roles

## Technical Details

- **Built with**: Node.js, TypeScript, Zod for schema validation
- **Protocol**: Model Context Protocol (MCP) by Anthropic
- **Dependencies**: @modelcontextprotocol/sdk, zod
- **Architecture**: Local processing (no external API dependencies)
- **Data Processing**: Structured medical workflows and information organization
- **License**: CC-BY-NC-SA-4.0

## Key Features

- **27 Medical Tools**: Comprehensive clinical protocol implementation
- **5 Medical Prompts**: Structured workflow guidance
- **3 Medical Resources**: Reference data for clinical decision-making
- **Local Processing**: No external API dependencies
- **Clinical Safety**: All outputs require clinical validation
- **Audit Trail**: Complete logging of all tool invocations
- **HIPAA Compliant**: Secure handling of medical information

## Development

```bash
# Clone the repository
git clone https://github.com/DavidOsherdiagnostica/md-mcp
cd md-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test
```

## Contributing

This project implements evidence-based medical protocols. All contributions must maintain clinical accuracy and safety standards.

## Support

For technical support or clinical questions, please contact the development team or consult with pharmacy/medical informatics specialists.

---

## ⚠️ Medical Disclaimer

**IMPORTANT: This software is provided for educational and informational purposes only. It is NOT intended for medical diagnosis, treatment, or clinical decision-making.**

### Key Disclaimers:
- **Always consult qualified healthcare professionals** for medical advice
- **Verify all medication information** with official sources
- **This software is not a substitute** for professional medical judgment
- **The authors assume no responsibility** for medical decisions based on this software
- **All recommendations require clinical validation** before use in patient care
- **Use at your own risk** - this is an educational tool, not a medical device

### Clinical Safety:
- All outputs are flagged as "AI-assisted, requires clinical validation"
- This server implements structured workflows, not medical diagnoses
- Always follow institutional protocols and clinical guidelines
- When in doubt, consult with qualified healthcare professionals

*This server implements AI-assisted clinical protocol tools for educational purposes. All recommendations require clinical validation before use in patient care.*