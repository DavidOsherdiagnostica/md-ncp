/**
 * Drug Visual Identification Tool
 * Provides medication images for visual verification and patient safety
 * Transforms image URLs into comprehensive visual identification system
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { VerifyDrugVisualIdentitySchema, VerifyDrugVisualIdentityInput, McpResponse } from "../../types/mcp.js";
import { getApiClient } from "../../services/israelDrugsApi.js";
import { 
  validateToolInput, 
  validateDrugRegistrationNumber
} from "../../utils/validators.js";
import { classifyError, createComprehensiveErrorResponse } from "../../utils/errorHandler.js";
import { API_CONFIG } from "../../config/constants.js";

// ===== TOOL REGISTRATION =====

export function registerDrugImageTool(server: McpServer): void {
  server.registerTool(
    "verify_drug_visual_identity",
    {
      title: "Medication Visual Identification",
      description: `Visual identification tool that provides official medication images for verification, patient education, and safety confirmation. Essential for preventing medication errors and ensuring accurate drug identification.

**Clinical Purpose:** Critical for medication safety and error prevention. Enables visual verification of prescribed medications, supports patient education, and helps identify unknown medications. Particularly important for elderly patients, complex medication regimens, and look-alike/sound-alike drug scenarios.

**Image Applications:**
- identification: Verify correct medication before administration
- verification: Confirm medication identity against prescription
- patient_education: Support patient understanding and recognition

**Safety Benefits:**
- Prevents medication mix-ups and dosing errors
- Enables identification of unknown medications
- Supports medication reconciliation processes
- Aids in adherence monitoring and verification

**Visual Information Provided:**
- Official product photography from manufacturer
- Package appearance and identifying features
- Dosage form visual characteristics
- Brand markings and pharmaceutical identifiers

**Quality Assurance:**
- Images sourced from official Ministry of Health database
- Current and accurate visual representations
- Standardized photography for consistent identification
- Regular updates to reflect current packaging

**Clinical Integration:**
- Use in medication reconciliation workflows
- Support for pharmacy dispensing verification
- Patient counseling and education enhancement
- Emergency medication identification assistance

**Output:** Returns comprehensive visual identification package including high-resolution medication images, physical description details, packaging information, and safety verification guidelines.

**Clinical Context:** This tool should be used whenever visual confirmation of medication identity is required for safety, education, or verification purposes. Essential component of comprehensive medication management and error prevention strategies.`,
      inputSchema: VerifyDrugVisualIdentitySchema
    },
    async (input: VerifyDrugVisualIdentityInput) => {
      const startTime = Date.now();
      
      try {
        // Validate and process input
        const { data: validatedInput, warnings } = validateToolInput(
          VerifyDrugVisualIdentitySchema,
          input,
          "verify_drug_visual_identity"
        );
        
        // Validate drug registration number format
        const validatedRegNumber = validateDrugRegistrationNumber(
          validatedInput.drug_registration_number
        );
        
        // Retrieve visual identification information
        const visualInfo = await retrieveVisualIdentificationInfo(
          validatedRegNumber,
          validatedInput
        );
        
        // Create comprehensive visual identification response
        return createVisualIdentificationResponse(
          visualInfo,
          validatedInput,
          warnings,
          startTime
        );
        
      } catch (error) {
        const classifiedError = classifyError(error, "verify_drug_visual_identity");
        return createComprehensiveErrorResponse(classifiedError, undefined, {
          toolName: "verify_drug_visual_identity",
          userInput: input,
          attemptNumber: 1
        });
      }
    }
  );
}

// ===== VISUAL IDENTIFICATION RETRIEVAL =====

async function retrieveVisualIdentificationInfo(
  registrationNumber: string,
  userInput: VerifyDrugVisualIdentityInput
): Promise<VisualIdentificationInfo> {
  const apiClient = getApiClient();
  
  try {
    console.info(`Retrieving visual identification for drug: ${registrationNumber}`);
    
    // Get detailed drug information including images
    const drugDetails = await apiClient.getSpecificDrug({
      dragRegNum: registrationNumber
    });
    
    // Process and validate image information
    const processedVisualInfo = await processVisualInformation(drugDetails, userInput);
    
    return processedVisualInfo;
    
  } catch (error) {
    console.error("Failed to retrieve visual identification:", error);
    
    // Attempt fallback to basic search for image information
    const fallbackInfo = await attemptImageFallback(registrationNumber);
    if (fallbackInfo) {
      console.warn("Using fallback image information");
      return fallbackInfo;
    }
    
    throw error;
  }
}

async function processVisualInformation(
  drugDetails: any,
  userInput: VerifyDrugVisualIdentityInput
): Promise<VisualIdentificationInfo> {
  // Extract and process image information
  const imageUrls = drugDetails.images?.map((img: any) => 
    `${API_CONFIG.IMAGES_BASE_URL}/${img.url}`
  ) || [];
  
  // Generate comprehensive visual identification data
  const visualInfo: VisualIdentificationInfo = {
    registration_number: drugDetails.dragRegNum,
    medication_name: {
      hebrew: drugDetails.dragHebName,
      english: drugDetails.dragEnName
    },
    
    visual_characteristics: {
      dosage_form: drugDetails.dosageForm,
      dosage_form_english: drugDetails.dosageFormEng,
      administration_route: drugDetails.usageFormHeb,
      physical_description: generatePhysicalDescription(drugDetails)
    },
    
    identification_images: await processImageCollection(drugDetails.images || [], userInput),
    
    packaging_information: {
      package_types: drugDetails.packages?.map((pkg: any) => ({
        description: pkg.packageDesc,
        material: pkg.packMaterialDesc,
        quantity: pkg.quantity,
        barcode: pkg.barcode
      })) || [],
      manufacturer: drugDetails.regOwnerName,
      manufacturing_details: drugDetails.manufacturers?.map((mfg: any) => ({
        name: mfg.manufactureName,
        location: mfg.manufactureSite
      })) || []
    },
    
    safety_features: {
      is_discontinued: drugDetails.iscanceled,
      requires_prescription: drugDetails.isPrescription,
      cytotoxic_handling: drugDetails.isCytotoxic,
      special_considerations: generateSafetyConsiderations(drugDetails)
    },
    
    identification_guidance: generateIdentificationGuidance(drugDetails, userInput),
    verification_checklist: generateVerificationChecklist(drugDetails, userInput)
  };
  
  return visualInfo;
}

async function attemptImageFallback(registrationNumber: string): Promise<VisualIdentificationInfo | null> {
  try {
    const apiClient = getApiClient();
    
    // Try to get basic info from search
    const searchResult = await apiClient.searchByName({
      val: registrationNumber,
      prescription: false,
      healthServices: false,
      pageIndex: 1,
      orderBy: 0
    });
    
    if (searchResult.results && searchResult.results.length > 0) {
      const basicInfo = searchResult.results.find(
        (drug: any) => drug.dragRegNum === registrationNumber
      );
      
      if (basicInfo && basicInfo.images && basicInfo.images.length > 0) {
        console.info("Found image information via search fallback");
        return createFallbackVisualInfo(basicInfo);
      }
    }
    
    return null;
    
  } catch (fallbackError) {
    console.error("Image fallback also failed:", fallbackError);
    return null;
  }
}

function createFallbackVisualInfo(basicInfo: any): VisualIdentificationInfo {
  return {
    registration_number: basicInfo.dragRegNum,
    medication_name: {
      hebrew: basicInfo.dragHebName,
      english: basicInfo.dragEnName
    },
    
    visual_characteristics: {
      dosage_form: basicInfo.dosageForm,
      dosage_form_english: basicInfo.dosageFormEng || "Unknown",
      administration_route: basicInfo.usageForm,
      physical_description: `${basicInfo.dosageForm} for ${basicInfo.usageForm} administration`
    },
    
    identification_images: basicInfo.images.map((img: any) => ({
      url: `${API_CONFIG.IMAGES_BASE_URL}/${img.url}`,
      type: "product_image",
      description: "Official product photograph",
      quality: "standard",
      source: "ministry_of_health_database",
      last_updated: "unknown"
    })),
    
    packaging_information: {
      package_types: basicInfo.packages?.map((pkg: string) => ({
        description: pkg,
        material: "Unknown",
        quantity: pkg,
        barcode: basicInfo.barcodes || "Unknown"
      })) || [],
      manufacturer: basicInfo.dragRegOwner,
      manufacturing_details: []
    },
    
    safety_features: {
      is_discontinued: basicInfo.iscanceled,
      requires_prescription: basicInfo.prescription,
      cytotoxic_handling: false,
      special_considerations: []
    },
    
    identification_guidance: [
      "Visual verification using available product images",
      "Compare with actual medication appearance",
      "Note: Limited detailed information available"
    ],
    
    verification_checklist: [
      "Verify medication name matches prescription",
      "Check dosage form and strength",
      "Confirm manufacturer if visible",
      "Note: Seek additional verification if uncertain"
    ],
    
    _fallback_data: true
  };
}

// ===== IMAGE PROCESSING =====

async function processImageCollection(
  images: any[],
  userInput: VerifyDrugVisualIdentityInput
): Promise<ProcessedImage[]> {
  if (!images || images.length === 0) {
    return [{
      url: null,
      type: "no_image_available",
      description: "No visual identification images available for this medication",
      quality: "unavailable",
      source: "ministry_of_health_database",
      last_updated: "N/A",
      usage_guidance: generateNoImageGuidance(userInput.image_purpose)
    }];
  }
  
  return images.map((img: any, index: number) => ({
    url: `${API_CONFIG.IMAGES_BASE_URL}/${img.url}`,
    type: determineImageType(img, index),
    description: generateImageDescription(img, index),
    quality: assessImageQuality(img),
    source: "ministry_of_health_database",
    last_updated: img.updateDate ? new Date(img.updateDate).toISOString() : "unknown",
    usage_guidance: generateImageUsageGuidance(userInput.image_purpose, index)
  }));
}

function determineImageType(img: any, index: number): string {
  // Determine image type based on available information
  if (index === 0) return "primary_product_image";
  if (img.url.includes("package")) return "packaging_image";
  if (img.url.includes("tablet")) return "dosage_form_image";
  return "product_image";
}

function generateImageDescription(img: any, index: number): string {
  const descriptions = [
    "Primary product photograph showing medication appearance",
    "Secondary product view or packaging image",
    "Additional product perspective or detail view"
  ];
  
  return descriptions[index] || "Product identification photograph";
}

function assessImageQuality(img: any): "high" | "standard" | "low" {
  // Simple quality assessment based on available metadata
  // In a real implementation, this could analyze file size, dimensions, etc.
  return "standard";
}

function generateImageUsageGuidance(purpose: string, imageIndex: number): string[] {
  const guidance: string[] = [];
  
  switch (purpose) {
    case "identification":
      guidance.push("Compare this image with the actual medication");
      guidance.push("Look for matching color, shape, and markings");
      if (imageIndex === 0) {
        guidance.push("This is the primary identification image");
      }
      break;
      
    case "verification":
      guidance.push("Use this image to verify medication identity");
      guidance.push("Confirm packaging and product appearance match");
      guidance.push("Check for any discrepancies in appearance");
      break;
      
    case "patient_education":
      guidance.push("Show this image to help patient recognize medication");
      guidance.push("Explain key visual features for identification");
      guidance.push("Emphasize importance of visual verification");
      break;
      
    default:
      guidance.push("Use for visual identification and verification");
  }
  
  return guidance;
}

function generateNoImageGuidance(purpose: string): string[] {
  const guidance: string[] = [];
  
  guidance.push("No visual identification images available for this medication");
  
  switch (purpose) {
    case "identification":
      guidance.push("Use alternative identification methods:");
      guidance.push("- Check medication name and registration number");
      guidance.push("- Verify with pharmacist or healthcare provider");
      guidance.push("- Use package labeling for identification");
      break;
      
    case "verification":
      guidance.push("Alternative verification methods:");
      guidance.push("- Compare prescription details with package label");
      guidance.push("- Verify registration number matches");
      guidance.push("- Consult pharmacist for visual confirmation");
      break;
      
    case "patient_education":
      guidance.push("Patient education alternatives:");
      guidance.push("- Use package labeling for identification");
      guidance.push("- Provide written description of medication");
      guidance.push("- Emphasize importance of reading labels");
      break;
  }
  
  return guidance;
}

// ===== INFORMATION GENERATION =====

function generatePhysicalDescription(drugDetails: any): string {
  const components: string[] = [];
  
  components.push(`Dosage form: ${drugDetails.dosageForm}`);
  
  if (drugDetails.dosageFormEng && drugDetails.dosageFormEng !== drugDetails.dosageForm) {
    components.push(`(${drugDetails.dosageFormEng})`);
  }
  
  components.push(`Administration: ${drugDetails.usageFormHeb}`);
  
  if (drugDetails.activeMetirals && drugDetails.activeMetirals.length > 0) {
    const activeIngredient = drugDetails.activeMetirals[0];
    components.push(`Contains: ${activeIngredient.ingredientsDesc} ${activeIngredient.dosage}`);
  }
  
  return components.join(" | ");
}

function generateSafetyConsiderations(drugDetails: any): string[] {
  const considerations: string[] = [];
  
  if (drugDetails.iscanceled) {
    considerations.push("DISCONTINUED: This medication is no longer available");
    considerations.push("Do not use if found - seek alternative therapy");
  }
  
  if (drugDetails.isCytotoxic) {
    considerations.push("CYTOTOXIC: Special handling and disposal required");
    considerations.push("Healthcare professional administration only");
  }
  
  if (drugDetails.isPrescription) {
    considerations.push("PRESCRIPTION REQUIRED: Use only under medical supervision");
  }
  
  if (drugDetails.isVeterinary) {
    considerations.push("VETERINARY USE: Not for human consumption");
  }
  
  return considerations;
}

function generateIdentificationGuidance(
  drugDetails: any,
  userInput: VerifyDrugVisualIdentityInput
): string[] {
  const guidance: string[] = [];
  
  guidance.push(`Medication Name: ${drugDetails.dragHebName} (${drugDetails.dragEnName})`);
  guidance.push(`Registration Number: ${drugDetails.dragRegNum}`);
  guidance.push(`Manufacturer: ${drugDetails.regOwnerName}`);
  
  if (drugDetails.packages && drugDetails.packages.length > 0) {
    const pkg = drugDetails.packages[0];
    guidance.push(`Package Type: ${pkg.packageDesc}`);
    guidance.push(`Quantity: ${pkg.quantity}`);
    
    if (pkg.barcode) {
      guidance.push(`Barcode: ${pkg.barcode}`);
    }
  }
  
  switch (userInput.image_purpose) {
    case "identification":
      guidance.push("Use these details to confirm medication identity");
      guidance.push("Compare all visible features with actual product");
      break;
      
    case "verification":
      guidance.push("Verify each detail matches your prescription");
      guidance.push("Confirm medication has not been switched");
      break;
      
    case "patient_education":
      guidance.push("Teach patient to recognize these identifying features");
      guidance.push("Emphasize importance of checking before taking");
      break;
  }
  
  return guidance;
}

function generateVerificationChecklist(
  drugDetails: any,
  userInput: VerifyDrugVisualIdentityInput
): string[] {
  const checklist: string[] = [];
  
  // Core verification items
  checklist.push("☐ Medication name matches prescription exactly");
  checklist.push("☐ Dosage form is correct (tablet, capsule, liquid, etc.)");
  checklist.push("☐ Strength/dosage matches prescribed amount");
  checklist.push("☐ Manufacturer name is consistent");
  
  // Visual verification
  if (drugDetails.images && drugDetails.images.length > 0) {
    checklist.push("☐ Physical appearance matches provided images");
    checklist.push("☐ Color and shape correspond to visual reference");
  }
  
  // Package verification
  if (drugDetails.packages && drugDetails.packages.length > 0) {
    checklist.push("☐ Package type and labeling are appropriate");
    checklist.push("☐ Quantity matches expected amount");
    
    const pkg = drugDetails.packages[0];
    if (pkg.barcode) {
      checklist.push("☐ Barcode matches reference if visible");
    }
  }
  
  // Safety verification
  checklist.push("☐ Expiration date is current and readable");
  checklist.push("☐ Package integrity is intact");
  
  if (drugDetails.iscanceled) {
    checklist.push("☐ CRITICAL: Verify this medication is not discontinued");
  }
  
  if (drugDetails.isPrescription) {
    checklist.push("☐ Prescription authorization is current and valid");
  }
  
  // Purpose-specific items
  switch (userInput.image_purpose) {
    case "patient_education":
      checklist.push("☐ Patient can identify medication independently");
      checklist.push("☐ Patient understands visual verification importance");
      break;
      
    case "verification":
      checklist.push("☐ All verification criteria are satisfied");
      checklist.push("☐ No discrepancies noted in comparison");
      break;
  }
  
  return checklist;
}

// ===== RESPONSE CREATION =====

function createVisualIdentificationResponse(
  visualInfo: VisualIdentificationInfo,
  userInput: VerifyDrugVisualIdentityInput,
  validationWarnings: string[],
  startTime: number
): McpResponse<VisualIdentificationInfo> {
  const queryTime = Date.now() - startTime;
  
  const response: McpResponse<VisualIdentificationInfo> = {
    success: true,
    data: visualInfo,
    metadata: {
      total_results: visualInfo.identification_images.length,
      query_time: `${queryTime}ms`,
      data_source: "israel_ministry_of_health",
      last_updated: new Date().toISOString(),
      api_version: "1.0.0",
      image_quality_assessment: assessOverallImageQuality(visualInfo.identification_images),
      verification_complexity: assessVerificationComplexity(visualInfo)
    },
    clinical_notes: generateVisualIdentificationNotes(visualInfo, userInput),
    warnings: generateVisualIdentificationWarnings(visualInfo, validationWarnings),
    next_suggested_actions: generateVisualIdentificationNextActions(visualInfo, userInput)
  };
  
  return response;
}

function assessOverallImageQuality(images: ProcessedImage[]): string {
  if (images.length === 0 || images[0].url === null) {
    return "no_images_available";
  }
  
  const qualityScores = images.map(img => {
    switch (img.quality) {
      case "high": return 3;
      case "standard": return 2;
      case "low": return 1;
      default: return 0;
    }
  });
  
  const averageQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
  
  if (averageQuality >= 2.5) return "high_quality";
  if (averageQuality >= 1.5) return "standard_quality";
  return "limited_quality";
}

function assessVerificationComplexity(visualInfo: VisualIdentificationInfo): string {
  let complexityFactors = 0;
  
  if (visualInfo.safety_features.is_discontinued) complexityFactors++;
  if (visualInfo.safety_features.requires_prescription) complexityFactors++;
  if (visualInfo.safety_features.cytotoxic_handling) complexityFactors++;
  if (visualInfo.identification_images.length === 0) complexityFactors++;
  if (visualInfo._fallback_data) complexityFactors++;
  
  if (complexityFactors >= 3) return "high_complexity";
  if (complexityFactors >= 1) return "moderate_complexity";
  return "standard_verification";
}

function generateVisualIdentificationNotes(
  visualInfo: VisualIdentificationInfo,
  userInput: VerifyDrugVisualIdentityInput
): string[] {
  const notes: string[] = [];
  
  if (visualInfo.identification_images.length === 0 || visualInfo.identification_images[0].url === null) {
    notes.push("No visual identification images available for this medication");
    notes.push("Use alternative identification methods including package labeling");
  } else {
    notes.push("Visual identification images provided from official database");
    notes.push("Compare actual medication appearance with provided images");
  }
  
  if (visualInfo._fallback_data) {
    notes.push("Note: Some detailed information may be limited");
  }
  
  notes.push("Visual identification is crucial for medication safety");
  notes.push("Always verify medication identity before administration");
  notes.push("Contact pharmacist or healthcare provider if uncertain about identification");
  
  if (userInput.image_purpose === "patient_education") {
    notes.push("Use images to educate patients about proper medication identification");
    notes.push("Emphasize importance of visual verification for patient safety");
  }
  
  return notes;
}

function generateVisualIdentificationWarnings(
  visualInfo: VisualIdentificationInfo,
  validationWarnings: string[]
): string[] {
  const warnings = [...validationWarnings];
  
  if (visualInfo.safety_features.is_discontinued) {
    warnings.push("CRITICAL: This medication has been discontinued and should not be used");
  }
  
  if (visualInfo.safety_features.cytotoxic_handling) {
    warnings.push("HAZARDOUS: Cytotoxic medication requires special handling procedures");
  }
  
  if (visualInfo.identification_images.length === 0) {
    warnings.push("No visual identification images available - use alternative verification methods");
  }
  
  if (visualInfo._fallback_data) {
    warnings.push("Limited image information available - verify with additional sources");
  }
  
  warnings.push("Visual identification alone may not be sufficient for complete verification");
  warnings.push("Always verify medication details with authoritative sources");
  
  return warnings;
}

function generateVisualIdentificationNextActions(
  visualInfo: VisualIdentificationInfo,
  userInput: VerifyDrugVisualIdentityInput
): Array<{ tool: string; reason: string; parameters_hint: string }> {
  const actions: Array<{ tool: string; reason: string; parameters_hint: string }> = [];
  
  // Always suggest comprehensive drug info for complete verification
  actions.push({
    tool: "get_comprehensive_drug_info",
    reason: "Get complete medication information for thorough verification",
    parameters_hint: `drug_registration_number: "${visualInfo.registration_number}"`
  });
  
  // Suggest alternatives if discontinued
  if (visualInfo.safety_features.is_discontinued) {
    actions.push({
      tool: "explore_generic_alternatives",
      reason: "Find alternatives for discontinued medication",
      parameters_hint: `reference_drug_name: "${visualInfo.medication_name.hebrew}"`
    });
  }
  
  // Suggest availability check
  actions.push({
    tool: "check_drug_availability_status",
    reason: "Verify current availability and safety status",
    parameters_hint: `drug_identifier: { registration_number: "${visualInfo.registration_number}" }`
  });
  
  // Suggest finding similar medications for education
  if (userInput.image_purpose === "patient_education") {
    actions.push({
      tool: "discover_drug_by_name",
      reason: "Find similar medications for patient education comparison",
      parameters_hint: `medication_query: "${visualInfo.medication_name.hebrew}"`
    });
  }
  
  return actions;
}

// ===== TYPE DEFINITIONS =====

interface VisualIdentificationInfo {
  registration_number: string;
  medication_name: {
    hebrew: string;
    english: string;
  };
  visual_characteristics: {
    dosage_form: string;
    dosage_form_english: string;
    administration_route: string;
    physical_description: string;
  };
  identification_images: ProcessedImage[];
  packaging_information: {
    package_types: Array<{
      description: string;
      material: string;
      quantity: string;
      barcode: string;
    }>;
    manufacturer: string;
    manufacturing_details: Array<{
      name: string;
      location: string;
    }>;
  };
  safety_features: {
    is_discontinued: boolean;
    requires_prescription: boolean;
    cytotoxic_handling: boolean;
    special_considerations: string[];
  };
  identification_guidance: string[];
  verification_checklist: string[];
  _fallback_data?: boolean;
}

interface ProcessedImage {
  url: string | null;
  type: string;
  description: string;
  quality: "high" | "standard" | "low" | "unavailable";
  source: string;
  last_updated: string;
  usage_guidance?: string[];
}