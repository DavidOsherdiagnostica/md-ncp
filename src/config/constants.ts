/**
 * Configuration constants for Israel Drugs MCP Server
 * Based on research analysis and API specifications
 */

// ===== API ENDPOINTS =====
export const API_CONFIG = {
  BASE_URL: process.env.ISRAEL_DRUGS_API_BASE_URL || 'https://israeldrugs.health.gov.il/GovServiceList/IDRServer',
  IMAGES_BASE_URL: process.env.ISRAEL_DRUGS_IMAGES_BASE_URL || 'https://mohpublic.z6.web.core.windows.net/IsraelDrugs',
  
  ENDPOINTS: {
    SEARCH_BOX_AUTOCOMPLETE: '/SearchBoxAutocomplete',
    SEARCH_BY_NAME: '/SearchByName', 
    SEARCH_BY_SYMPTOM: '/SearchBySymptom',
    SEARCH_GENERIC: '/SearchGeneric',
    GET_SPECIFIC_DRUG: '/GetSpecificDrug',
    GET_BY_SYMPTOM: '/GetBySymptom',
    GET_FAST_SEARCH_POPULAR_SYMPTOMS: '/GetFastSearchPopularSymptoms',
    GET_ATC_LIST: '/GetAtcList',
    GET_PACKAGE_LIST: '/GetPackageList',
    GET_MATAN_LIST: '/GetMatanList'
  }
} as const;

// ===== REQUEST CONFIGURATION =====
export const REQUEST_CONFIG = {
  TIMEOUT_MS: parseInt(process.env.API_TIMEOUT_MS || '30000'),
  RETRY_ATTEMPTS: parseInt(process.env.API_RETRY_ATTEMPTS || '3'),
  RETRY_DELAY_MS: parseInt(process.env.API_RETRY_DELAY_MS || '1000'),
  
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Israel-Drugs-MCP-Server/1.0.0'
  }
} as const;

// ===== CACHE CONFIGURATION =====
export const CACHE_CONFIG = {
  ENABLED: process.env.ENABLE_CACHE === 'true',
  TTL_STATIC_HOURS: parseInt(process.env.CACHE_TTL_STATIC_HOURS || '24'),
  TTL_DYNAMIC_MINUTES: parseInt(process.env.CACHE_TTL_DYNAMIC_MINUTES || '30'),
  
  // Cache keys by data type
  KEYS: {
    ATC_LIST: 'atc_list',
    PACKAGE_LIST: 'package_list', 
    MATAN_LIST: 'matan_list',
    SYMPTOM_HIERARCHY: 'symptom_hierarchy',
    DRUG_DETAILS: 'drug_details:',
    SEARCH_RESULTS: 'search_results:'
  }
} as const;

// ===== MCP SERVER CONFIGURATION =====
export const MCP_CONFIG = {
  SERVER_NAME: process.env.SERVER_NAME || 'israel-drugs-mcp-server',
  SERVER_VERSION: process.env.SERVER_VERSION || '1.0.0',
  
  CAPABILITIES: {
    RESOURCES: true,
    TOOLS: true,
    PROMPTS: true,
    LOGGING: true
  },

  RESPONSE_LIMITS: {
    MAX_SEARCH_RESULTS: 50,
    MAX_SUGGESTIONS: 20,
    MAX_SYMPTOMS_PER_CATEGORY: 20,
    MAX_POPULAR_SYMPTOMS: 10
  }
} as const;

// ===== API BEHAVIOR CONSTANTS =====
export const API_BEHAVIOR = {
  // Critical: prescription parameter logic is INVERTED
  PRESCRIPTION_LOGIC: {
    ALL_DRUGS: false,        // prescription=false shows ALL drugs
    OTC_ONLY: true          // prescription=true shows OTC only
  },
  
  // Page indexing starts from 1, not 0
  PAGINATION: {
    FIRST_PAGE: 1,
    DEFAULT_PAGE_SIZE: 10
  },
  
  // ATC codes: only level 4 works in SearchGeneric  
  ATC_CONSTRAINTS: {
    SUPPORTED_LEVEL: 4,      // Only 4-character codes work
    LEVEL_4_LENGTH: 4,       // e.g., "N02BE"
    LEVEL_5_LENGTH: 6        // e.g., "N02BE01" - NOT supported
  },
  
  // Default values for API calls
  DEFAULTS: {
    ORDER_BY: 0,
    HEALTH_SERVICES: false,
    IS_SEARCH_TRADE_NAME: "1",
    IS_SEARCH_TRADE_MARKIV: "1"
  }
} as const;

// ===== CLINICAL MAPPINGS =====
export const CLINICAL_MAPPINGS = {
  // Common administration routes with IDs from GetMatanList
  ADMIN_ROUTES: {
    ORAL: 17,           // פומי
    TOPICAL: 2,         // עורי  
    EYE: 15,           // עיני
    EAR: 16,           // אוזני
    IV: 6,             // תוך-ורידי
    IM: 5,             // תוך-שרירי
    RECTAL: 18         // רקטלי
  },
  
  // Health basket status
  HEALTH_BASKET: {
    COVERED: true,
    NOT_COVERED: false
  },
  
  // Drug status indicators
  DRUG_STATUS: {
    ACTIVE: {
      iscanceled: false,
      bitulDate: "01/01/1900"  // Default "never canceled" date
    },
    CANCELED: {
      iscanceled: true
      // bitulDate will be actual cancellation date
    }
  },
  
  // Prescription requirements
  PRESCRIPTION: {
    REQUIRED: true,
    NOT_REQUIRED: false
  }
} as const;

// ===== ERROR HANDLING =====
export const ERROR_CONFIG = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  VERBOSE_LOGGING: process.env.VERBOSE_LOGGING === 'true',
  
  RETRY_STATUS_CODES: [408, 429, 500, 502, 503, 504],
  PERMANENT_FAILURE_CODES: [400, 401, 403, 404],
  
  DEFAULT_ERROR_MESSAGES: {
    CONNECTION_ERROR: 'Unable to connect to Israel Ministry of Health database',
    TIMEOUT_ERROR: 'Request timed out - the medical database may be busy',
    RATE_LIMIT_ERROR: 'Too many requests - please wait before trying again',
    INVALID_RESPONSE: 'Received unexpected response from medical database',
    NO_RESULTS: 'No medications found matching your criteria',
    DRUG_DISCONTINUED: 'This medication has been discontinued',
    PRESCRIPTION_REQUIRED: 'This medication requires a prescription from a licensed physician'
  }
} as const;

// ===== RATE LIMITING =====
export const RATE_LIMIT_CONFIG = {
  REQUESTS_PER_MINUTE: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60'),
  BURST_SIZE: parseInt(process.env.RATE_LIMIT_BURST_SIZE || '10'),
  
  // Different limits for different endpoint types
  ENDPOINT_LIMITS: {
    SEARCH: 30,           // Search operations
    DETAILS: 60,          // Getting drug details
    LISTS: 10,            // Helper lists (cached)
    AUTOCOMPLETE: 100     // Autocomplete (very frequent)
  }
} as const;

// ===== CLINICAL SAFETY =====
export const SAFETY_CONFIG = {
  // Medical disclaimers and warnings
  DISCLAIMERS: {
    GENERAL: 'This information is from the Israeli Ministry of Health database. Always consult healthcare professionals for medical decisions.',
    PRESCRIPTION: 'Prescription medications require supervision by a licensed physician.',
    DISCONTINUED: 'This medication has been discontinued and may no longer be available.',
    OUTDATED: 'Information may not reflect the most recent updates. Verify with current medical sources.'
  },
  
  // Warning thresholds
  WARNING_THRESHOLDS: {
    OLD_DRUG_YEARS: 10,           // Warn if drug registered >10 years ago with no updates
    HIGH_PRICE_THRESHOLD: 200,     // Warn about expensive medications  
    MANY_RESULTS_THRESHOLD: 100    // Warn when search returns too many results
  },
  
  // Safety checks
  SAFETY_CHECKS: {
    CHECK_DISCONTINUED: true,
    CHECK_PRESCRIPTION_STATUS: true,
    CHECK_HEALTH_BASKET: true,
    VALIDATE_ATC_CODES: true
  }
} as const;

// ===== LOCALIZATION =====
export const LOCALIZATION = {
  DEFAULT_LANGUAGE: 'hebrew',
  SUPPORTED_LANGUAGES: ['hebrew', 'english', 'arabic', 'russian'],
  
  // Common Hebrew terms for English mapping
  HEBREW_TERMS: {
    ORAL: 'פומי',
    TOPICAL: 'עורי', 
    EYE_DROPS: 'עיני',
    EAR_DROPS: 'אוזני',
    PRESCRIPTION: 'מרשם',
    OTC: 'ללא מרשם',
    HEALTH_BASKET: 'סל הבריאות',
    DISCONTINUED: 'מבוטל',
    ACTIVE: 'פעיל'
  }
} as const;

// ===== DEBUG AND DEVELOPMENT =====
export const DEBUG_CONFIG = {
  ENABLED: process.env.DEBUG_MODE === 'true',
  MOCK_RESPONSES: process.env.MOCK_API_RESPONSES === 'true',
  LOG_API_CALLS: process.env.VERBOSE_LOGGING === 'true',
  
  // Development helpers
  SAMPLE_DATA: {
    SAMPLE_DRUG_REG_NUM: '020 16 20534 00',  // Acamol
    SAMPLE_SYMPTOM_CATEGORY: 'אף-אוזן-גרון',
    SAMPLE_SYMPTOM: 'כאבי גרון',
    SAMPLE_ATC_CODE: 'N02BE'
  }
} as const;