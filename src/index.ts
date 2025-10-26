import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MCP_SERVER_CONFIG, SERVER_DESCRIPTION } from "./config/appConfig.js";

// Import generic tool and prompt registrations

// Import MD MCP medical resources
import { registerLabReferenceRanges } from "./resources/labReferenceRanges.js";
import { registerVitalSignsNorms } from "./resources/vitalSignsNorms.js";
import { registerClinicalDecisionRules } from "./resources/clinicalDecisionRules.js";

// Import MD MCP medical prompts
import { registerMedicationReconciliationPrompt } from "./prompts/medicationReconciliationPrompt.js";
import { registerTdmAnalysisPrompt } from "./prompts/tdmAnalysisPrompt.js";
import { registerSoapDocumentationPrompt } from "./prompts/soapDocumentationPrompt.js";
import { registerDrugInteractionPrompt } from "./prompts/drugInteractionPrompt.js";
import { registerClinicalDecisionPrompt } from "./prompts/clinicalDecisionPrompt.js";

// Create generic MCP Server
const server = new McpServer({
  name: SERVER_DESCRIPTION.name,
  version: SERVER_DESCRIPTION.version,
  description: SERVER_DESCRIPTION.description,
  capabilities: SERVER_DESCRIPTION.capabilities
});

// Register generic prompts, tools, and resources

// Register MD MCP medical resources
registerLabReferenceRanges(server);
registerVitalSignsNorms(server);
registerClinicalDecisionRules(server);

// Register MD MCP medical prompts
registerMedicationReconciliationPrompt(server);
registerTdmAnalysisPrompt(server);
registerSoapDocumentationPrompt(server);
registerDrugInteractionPrompt(server);
registerClinicalDecisionPrompt(server);

// Import MD MCP medical protocol tools
// Medication Reconciliation Tools
import { registerGatherBpmhTool } from "./tools/medrec/gatherBpmh.js";
import { registerCompareMedicationsTool } from "./tools/medrec/compareMedications.js";
import { registerResolveDiscrepancyTool } from "./tools/medrec/resolveDiscrepancy.js";

// Therapeutic Drug Monitoring Tools
import { registerAssessTdmCandidateTool } from "./tools/tdm/assessTdmCandidate.js";
import { registerCalculateSteadyStateTool } from "./tools/tdm/calculateSteadyState.js";
import { registerPlanSampleCollectionTool } from "./tools/tdm/planSampleCollection.js";
import { registerInterpretTdmResultTool } from "./tools/tdm/interpretTdmResult.js";
import { registerMonitorTdmTrendsTool } from "./tools/tdm/monitorTdmTrends.js";

// Drug Interaction Screening Tools
import { registerScreenInteractionsTool } from "./tools/interactions/screenInteractions.js";
import { registerAssessInteractionSignificanceTool } from "./tools/interactions/assessInteractionSignificance.js";
import { registerRecommendInteractionManagementTool } from "./tools/interactions/recommendInteractionManagement.js";
import { registerDocumentInteractionDecisionTool } from "./tools/interactions/documentInteractionDecision.js";

// SOAP Documentation Tools
import { registerDocumentSubjectiveTool } from "./tools/soap/documentSubjective.js";
import { registerDocumentObjectiveTool } from "./tools/soap/documentObjective.js";
import { registerDocumentAssessmentTool } from "./tools/soap/documentAssessment.js";
import { registerDocumentPlanTool } from "./tools/soap/documentPlan.js";
import { registerCompileSoapNoteTool } from "./tools/soap/compileSoapNote.js";

// Five Rights Medication Administration Tools
import { registerVerifyRightPatientTool } from "./tools/five_rights/verifyRightPatient.js";
import { registerVerifyRightMedicationTool } from "./tools/five_rights/verifyRightMedication.js";
import { registerVerifyRightDoseTool } from "./tools/five_rights/verifyRightDose.js";
import { registerVerifyRightRouteTool } from "./tools/five_rights/verifyRightRoute.js";
import { registerVerifyRightTimeTool } from "./tools/five_rights/verifyRightTime.js";
import { registerVerifyRightDocumentationTool } from "./tools/five_rights/verifyRightDocumentation.js";

// Integration Tools
import { registerClinicalDecisionSupportTool } from "./tools/integration/clinicalDecisionSupport.js";
import { registerAuditTrailTool } from "./tools/integration/auditTrail.js";

// Register all MD MCP tools
// Medication Reconciliation
registerGatherBpmhTool(server);
registerCompareMedicationsTool(server);
registerResolveDiscrepancyTool(server);

// Therapeutic Drug Monitoring
registerAssessTdmCandidateTool(server);
registerCalculateSteadyStateTool(server);
registerPlanSampleCollectionTool(server);
registerInterpretTdmResultTool(server);
registerMonitorTdmTrendsTool(server);

// Drug Interaction Screening
registerScreenInteractionsTool(server);
registerAssessInteractionSignificanceTool(server);
registerRecommendInteractionManagementTool(server);
registerDocumentInteractionDecisionTool(server);

// SOAP Documentation
registerDocumentSubjectiveTool(server);
registerDocumentObjectiveTool(server);
registerDocumentAssessmentTool(server);
registerDocumentPlanTool(server);
registerCompileSoapNoteTool(server);

// Five Rights Medication Administration
registerVerifyRightPatientTool(server);
registerVerifyRightMedicationTool(server);
registerVerifyRightDoseTool(server);
registerVerifyRightRouteTool(server);
registerVerifyRightTimeTool(server);
registerVerifyRightDocumentationTool(server);

// Integration Tools
registerClinicalDecisionSupportTool(server);
registerAuditTrailTool(server);

// TODO: Add your specific resource registrations here
// import { registerYourCustomResource } from "./resources/yourCustomResource.js";
// registerYourCustomResource(server);

// Start MCP in stdio mode
const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  // console.log("MCP Server connected in stdio mode."); // Remove for clean JSON output
});
