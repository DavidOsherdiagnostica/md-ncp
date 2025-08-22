/**
 * Type definitions for Israel Drugs API
 * Based on comprehensive analysis of the Ministry of Health API
 */

// ===== BASE API TYPES =====

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | undefined;
  timestamp: string;
}

// ===== AUTOCOMPLETE TYPES =====

export interface AutocompleteRequest {
  val: string;
  isSearchTradeName: "0" | "1";
  isSearchTradeMarkiv: "0" | "1";
}

export interface AutocompleteResponse {
  results: string[];
}

// ===== SEARCH BY NAME TYPES =====

export interface SearchByNameRequest {
  val: string;
  prescription: boolean;  // Note: Logic is inverted! false = all drugs, true = OTC only
  healthServices: boolean;  // true = health basket only
  pageIndex: number;  // Starts from 1, not 0!
  orderBy: number;
}

export interface DrugSearchResult {
  dbVersiob: string;
  dragRegNum: string;  // Primary key for drug identification
  dragRegDate: string;
  dragHebName: string;
  dragEnName: string;
  dosageForm: string;
  dosageFormEng: string;
  bitulDate: string;
  iscanceled: boolean;
  prescription: boolean;
  usageForm: string;
  usageList: string[];
  activeComponents: Array<{
    componentName: string;
  }>;
  secondarySymptom: string | null;
  packages: string[];
  packagesPrices: string[];
  customerPrice: string;
  singlePrice: string;
  images: Array<{
    url: string;
  }>;
  health: boolean;  // In health basket
  route: string;
  pages: number;
  results: number;
  dragRegOwner: string;
  barcodes: string;
  indications: string;
  activeComponentsDisplayName: string;
  activeComponentsCompareName: string;
}

export interface SearchByNameResponse {
  hasNonSubsDrugs: boolean | null;
  results: DrugSearchResult[];
}

// ===== SEARCH BY SYMPTOM TYPES =====

export interface SearchBySymptomRequest {
  primarySymp: string;
  secondarySymp: string;
  healthServices: boolean;
  pageIndex: number;
  prescription: boolean;  // Same inverted logic as SearchByName
  orderBy: number;
}

export interface SearchBySymptomResponse {
  hasNonSubsDrugs: boolean | null;
  results: DrugSearchResult[];  // Same structure as SearchByName
}

// ===== SEARCH GENERIC TYPES =====

export interface SearchGenericRequest {
  val: string;  // Active ingredient or empty
  matanId: number | null;  // Administration route ID
  packageId: number | null;  // Package type ID
  atcId: string | null;  // ATC code (level 4 only!)
  pageIndex: number;
  orderBy: number;
}

export type SearchGenericResponse = DrugSearchResult[];  // Array directly, not wrapped

// ===== SPECIFIC DRUG TYPES =====

export interface GetSpecificDrugRequest {
  dragRegNum: string;
}

export interface DrugBrochure {
  lng: "עברית" | "אנגלית" | "ערבית" | "רוסית" | null;
  url: string;
  updateDate: number;
  type: "החמרה לעלון" | "עלון לצרכן" | "עלון לרופא";
  display: string;
  updateDateFormat: string;
  creationDateFormat: string;
}

export interface DrugImage {
  url: string;
  updateDate: number;
}

export interface DrugActiveIngredient {
  ingredientsDesc: string;
  dosage: string;
}

export interface DrugManufacturer {
  manufactureName: string;
  manufactureSite: string;
  manufactureComments: string;
}

export interface DrugAtcCode {
  atc4Code: string;  // May contain trailing spaces!
  atc4Name: string;
  atc5Code: string;  // No trailing spaces
  atc5Name: string;
}

export interface DrugPackage {
  isPrescription: boolean;
  packageUpdate: number;
  packageDesc: string;
  packMaterialDesc: string;
  unitPrice: number;  // Number, not string like in search results
  packageMaxPrice: number;  // Number, not string
  quantity: string;
  shelfLife: string;
  unit: string;
  barcode: string;
}

export interface GetSpecificDrugResponse {
  dragRegNum: string;
  dragHebName: string;
  dragEnName: string;
  bitulDate: string;
  isCytotoxic: boolean;
  isVeterinary: boolean;
  applicationType: string;
  brochure: DrugBrochure[];
  brochureUpdate: unknown | null;
  isPrescription: boolean;
  iscanceled: boolean;
  images: DrugImage[];
  usageFormHeb: string;
  usageFormEng: string;
  dosageForm: string;
  dosageFormEng: string;
  dragIndication: string;
  maxPrice: number;  // Number, not string
  health: boolean;
  activeMetirals: DrugActiveIngredient[];  // Note: "activeMetirals" not "activeComponents"
  regOwnerName: string;
  regManufactureName: string;
  regDate: number;  // Timestamp
  regExpDate: number;  // Timestamp
  applicationDate: number;  // Timestamp
  custom: string;
  manufacturers: DrugManufacturer[];
  limitations: string;
  dateOfInclusion: string;
  indicationIncludedInTheBasket: string;
  classEffect: string;
  remarks: string;
  packingLimitation: string;
  registeredIndicationsAtTimeOfInclusion: string;
  frameworkOfInclusion: string;
  useInClalit: string;
  salList: unknown[];
  atc: DrugAtcCode[];
  packages: DrugPackage[];
  videos: unknown[];  // Always empty according to research
}

// ===== SYMPTOM TYPES =====

export interface GetBySymptomRequest {
  prescription: boolean;
}

export interface SymptomItem {
  bySymptomSecond: number;  // Unique ID
  bySymptomName: string;
}

export interface SymptomCategory {
  bySymptomMain: string;
  list: SymptomItem[];
}

export type GetBySymptomResponse = SymptomCategory[];

export interface GetFastSearchPopularSymptomsRequest {
  rowCount: number;
}

export interface PopularSymptom {
  bySymptomMain: string;
  bySymptomSecond: number;
  bySymptomName: string;
  order: number;  // Popularity/search count
}

export type GetFastSearchPopularSymptomsResponse = PopularSymptom[];

// ===== HELPER LIST TYPES =====

export interface AtcListItem {
  id: string;  // ATC code
  text: string;  // Description in English
}

export type GetAtcListResponse = AtcListItem[];

export interface PackageListItem {
  id: number;  // Package type ID
  text: string;  // Package description
}

export type GetPackageListResponse = PackageListItem[];

export interface MatanListItem {
  id: number;  // Administration route ID
  text: string;  // Description in Hebrew
}

export type GetMatanListResponse = MatanListItem[];

// ===== PROCESSED/ENHANCED TYPES FOR MCP =====

export interface ProcessedDrug {
  registrationNumber: string;
  hebrewName: string;
  englishName: string;
  activeIngredients: string[];
  dosageForm: string;
  administrationRoute: string;
  requiresPrescription: boolean;
  inHealthBasket: boolean;
  isActive: boolean;
  discontinuedDate: string | null;
  maxPrice: number | null;
  manufacturer: string;
  images: string[];
  atcCodes: {
    level4: string;
    level5: string;
    description: string;
  }[];
  packages: Array<{
    description: string;
    price: number;
    quantity: string;
  }>;
  clinicalInfo: {
    indications: string;
    warnings: string[];
    brochures: Array<{
      language: string;
      type: string;
      url: string;
    }>;
  };
}

export interface ProcessedSymptom {
  id: number;
  name: string;
  category: string;
  popularity: number | null;
}

export interface ProcessedSearchResult {
  query: string;
  totalResults: number;
  page: number;
  totalPages: number;
  drugs: ProcessedDrug[];
  filters: {
    prescriptionOnly: boolean;
    healthBasketOnly: boolean;
    activeOnly: boolean;
  };
  suggestions: string[];
  warnings: string[];
}