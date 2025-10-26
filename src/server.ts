import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { MCP_SERVER_CONFIG, SERVER_DESCRIPTION } from "./config/appConfig.js";

// Import our generic tool and prompt registrations

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

// Function to create and configure an MCP server instance
function createServer() {
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

    return server;
}

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Express app setup for HTTP transport
export function setupHttpServer(port: number = 3000) {
    const app = express();
    
    // Add CORS middleware
    app.use(cors({
        origin: '*', // Configure appropriately for production
        exposedHeaders: ['Mcp-Session-Id'],
        allowedHeaders: ['Content-Type', 'mcp-session-id']
    }));
    
    app.use(express.json());

    // Handle POST requests for client-to-server communication
    app.post('/mcp', async (req: express.Request, res: express.Response) => {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        let transport: StreamableHTTPServerTransport;

        if (sessionId && transports[sessionId]) {
            // Reuse existing transport
            transport = transports[sessionId];
        } else if (!sessionId && isInitializeRequest(req.body)) {
            // New initialization request
            transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                onsessioninitialized: (sessionId) => {
                    transports[sessionId] = transport;
                },
                // TODO: Configure allowedHosts appropriately for production or pull from config
                allowedHosts: ['127.0.0.1', 'localhost', `localhost:${port}`]
            });

            // Clean up transport when closed
            transport.onclose = () => {
                if (transport.sessionId) {
                    delete transports[transport.sessionId];
                }
            };

            const server = createServer();
            await server.connect(transport);
        } else {
            res.status(400).json({
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: 'Bad Request: No valid session ID provided'
                },
                id: null
            });
            return;
        }

        await transport.handleRequest(req, res, req.body);
    });

    // Handle GET and DELETE requests with shared logic
    const handleSessionRequest = async (req: express.Request, res: express.Response) => {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        if (!sessionId || !transports[sessionId]) {
            res.status(400).send('Invalid or missing session ID');
            return;
        }
        
        const transport = transports[sessionId];
        await transport.handleRequest(req, res);
    };

    // Handle GET requests for server-to-client notifications via SSE
    app.get('/mcp', handleSessionRequest);

    // Handle DELETE requests for session termination
    app.delete('/mcp', handleSessionRequest);

    return app.listen(port, () => {
        console.log(`MCP HTTP Server listening on port ${port}`);
    });
}

// Setup for stdio transport
export async function setupStdioServer() {
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    return server;
}

// Auto-detect environment and start appropriate server
if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
    const isHttpMode = process.argv.includes('--http');
    if (isHttpMode) {
        const port = parseInt(process.env.PORT || '3000');
        setupHttpServer(port);
    } else {
        setupStdioServer();
    }
}
