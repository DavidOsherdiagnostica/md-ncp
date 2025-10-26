/**
 * Generic Application Configuration Constants for MCP Server
 * This file contains general configuration settings for the MCP server and its components.
 * Customize these values for your specific API integration.
 */

// ===== APPLICATION CONFIGURATION =====
export const APP_CONFIG = {
  VERSION: process.env.APP_VERSION || '1.0.0',
  DEFAULT_DATA_SOURCE: 'local_processing', // Default source for response metadata
} as const;

// ===== PROCESSING CONFIGURATION =====
export const PROCESSING_CONFIG = {
  MAX_PROCESSING_TIME_MS: parseInt(process.env.MAX_PROCESSING_TIME_MS || '5000'), // Max processing time in milliseconds
  ENABLE_DETAILED_LOGGING: process.env.ENABLE_DETAILED_LOGGING === 'true', // Enable detailed processing logs
} as const;

// ===== CACHE CONFIGURATION =====
export const CACHE_CONFIG = {
  ENABLED: process.env.ENABLE_CACHE === 'true', // Enable or disable caching
  TTL_STATIC_HOURS: parseInt(process.env.CACHE_TTL_STATIC_HOURS || '24'), // Time-to-live for static data (hours)
  TTL_DYNAMIC_MINUTES: parseInt(process.env.CACHE_TTL_DYNAMIC_MINUTES || '30'), // Time-to-live for dynamic data (minutes)
} as const;

// ===== MCP SERVER CONFIGURATION =====
export const MCP_SERVER_CONFIG = {
  SERVER_NAME: process.env.MCP_SERVER_NAME || 'md-mcp-server',
  SERVER_VERSION: process.env.MCP_SERVER_VERSION || '1.0.0',

  CAPABILITIES: {
    RESOURCES: true,
    TOOLS: true,
    PROMPTS: true,
    LOGGING: true,
  },

  RESPONSE_LIMITS: {
    MAX_SEARCH_RESULTS: 50, // Max results to return for search-like tools
    MAX_SUGGESTIONS: 20, // Max suggestions for autocomplete-like tools
  },

  // Medical-specific configuration
  MEDICAL_PROTOCOLS: {
    MEDICATION_RECONCILIATION: true,
    THERAPEUTIC_DRUG_MONITORING: true,
    DRUG_INTERACTION_SCREENING: true,
    SOAP_DOCUMENTATION: true,
    FIVE_RIGHTS_ADMINISTRATION: true,
    INTEGRATION_TOOLS: true,
  },

  CLINICAL_SAFETY: {
    REQUIRE_CLINICAL_VALIDATION: true,
    AUDIT_ALL_DECISIONS: true,
    HIPAA_COMPLIANCE: true,
    VERSION_CONTROL: true,
  },
} as const;

// ===== SERVER DESCRIPTION AND METADATA =====
export const SERVER_DESCRIPTION = {
  name: MCP_SERVER_CONFIG.SERVER_NAME,
  version: MCP_SERVER_CONFIG.SERVER_VERSION,
  description: "Medical Decision Model Context Protocol (MCP) server designed for creating structured medical workflows and organizing clinical information. This server provides tools for structuring medical processes, organizing clinical data, and creating standardized medical documentation workflows. The AI model can utilize available knowledge sources including internet access, training data, and connections to medical databases to enhance the structured information provided by these tools.",
  capabilities: MCP_SERVER_CONFIG.CAPABILITIES,
  
  // Detailed server information for MCP clients
  server_info: {
    purpose: "Creating structured medical workflows, organizing clinical information, and providing standardized medical documentation processes. The server enables AI models to structure medical data, create clinical workflows, and organize information using available knowledge sources including internet access, training data, and medical database connections.",
    target_users: ["Healthcare providers", "Clinical pharmacists", "Medical AI agents", "Clinical decision support systems"],
    protocols_implemented: [
      "Medication Reconciliation (WHO High 5s)",
      "Therapeutic Drug Monitoring (TDM)",
      "Drug Interaction Screening",
      "SOAP Documentation",
      "Five Rights Medication Administration",
      "Cross-Protocol Integration"
    ],
    clinical_safety_features: [
      "HIPAA-compliant data handling",
      "Clinical validation requirements",
      "Audit trail for all decisions",
      "Version control for protocol updates",
      "Evidence-based recommendations"
    ],
    tool_categories: {
      medication_reconciliation: {
        description: "WHO High 5s standardized medication reconciliation process",
        tools: ["gather_bpmh", "compare_medications", "resolve_discrepancy"],
        use_cases: ["Hospital admission", "Transfer between units", "Discharge planning"]
      },
      therapeutic_drug_monitoring: {
        description: "Clinical TDM workflow for optimizing drug dosing",
        tools: ["assess_tdm_candidate", "calculate_steady_state", "plan_sample_collection", "interpret_tdm_result", "monitor_tdm_trends"],
        use_cases: ["Vancomycin dosing", "Digoxin monitoring", "Antiepileptic optimization"]
      },
      drug_interaction_screening: {
        description: "Comprehensive drug-drug, drug-condition, and drug-food interaction screening",
        tools: ["screen_interactions", "assess_interaction_significance", "recommend_interaction_management", "document_interaction_decision"],
        use_cases: ["New prescription review", "Medication list validation", "Polypharmacy management"]
      },
      soap_documentation: {
        description: "Structured clinical documentation following SOAP format",
        tools: ["document_subjective", "document_objective", "document_assessment", "document_plan", "compile_soap_note"],
        use_cases: ["Progress notes", "Admission notes", "Discharge summaries", "Consultation reports"]
      },
      five_rights_administration: {
        description: "Implementation of the 5 (or 6) Rights for safe medication administration",
        tools: ["verify_right_patient", "verify_right_medication", "verify_right_dose", "verify_right_route", "verify_right_time", "verify_right_documentation"],
        use_cases: ["Medication administration", "Safety verification", "Nursing protocols"]
      },
      integration_tools: {
        description: "Cross-protocol integration and comprehensive decision support",
        tools: ["clinical_decision_support", "audit_trail"],
        use_cases: ["Multi-protocol workflows", "Quality assurance", "Clinical analytics"]
      }
    },
    compliance_standards: [
      "HIPAA (Health Insurance Portability and Accountability Act)",
      "WHO High 5s Medication Reconciliation",
      "Joint Commission Standards",
      "Evidence-Based Medicine Guidelines"
    ],
    data_security: {
      encryption: "All data encrypted in transit and at rest",
      access_control: "Role-based access control for tool groups",
      audit_logging: "Complete audit trail for all tool invocations",
      phi_minimization: "PHI minimization in tool responses"
    },
    performance_characteristics: {
      response_time: "< 2 seconds for interactive tools",
      batch_processing: "Available for large medication lists",
      caching: "Reference data caching for drug interactions",
      async_processing: "Non-urgent assessments processed asynchronously"
    }
  }
} as const;

// ===== ERROR HANDLING =====
export const ERROR_CONFIG = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'info', // Logging level (e.g., 'info', 'warn', 'error')
  VERBOSE_LOGGING: process.env.VERBOSE_LOGGING === 'true', // Enable verbose logging

  DEFAULT_ERROR_MESSAGES: {
    PROCESSING_ERROR: 'Error occurred during local processing',
    VALIDATION_ERROR: 'Input validation failed',
    TIMEOUT_ERROR: 'Processing timed out',
    NO_RESULTS: 'No results found matching your criteria',
    // Add other generic error messages as needed
  },
} as const;

// ===== PERFORMANCE CONFIGURATION =====
export const PERFORMANCE_CONFIG = {
  MAX_CONCURRENT_PROCESSING: parseInt(process.env.MAX_CONCURRENT_PROCESSING || '10'),
  PROCESSING_TIMEOUT_MS: parseInt(process.env.PROCESSING_TIMEOUT_MS || '30000'),
} as const;

// ===== DEBUG AND DEVELOPMENT =====
export const DEBUG_CONFIG = {
  ENABLED: process.env.DEBUG_MODE === 'true',
  MOCK_RESPONSES: process.env.MOCK_RESPONSES === 'true',
  LOG_PROCESSING_CALLS: process.env.VERBOSE_LOGGING === 'true',

  // No sample data here; implement in individual tools or mock services if needed
} as const;
