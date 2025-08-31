import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

// Import all our tool and prompt registrations
import { registerDrugComparisonPrompt } from "./prompts/drugComparison.js";
import { registerSymptomGuidePrompt } from "./prompts/symptomGuide.js";
import { registerSafetyCheckPrompt } from "./prompts/safetyCheck.js";
import { registerTherapeuticCategoriesTool } from "./tools/discovery/categories.js";
import { registerAdministrationRoutesTool } from "./tools/discovery/routes.js";
import { registerSymptomDiscoveryTool } from "./tools/discovery/symptoms.js";
import { registerDrugDetailsTool } from "./tools/info/drugDetails.js";
import { registerDrugImageTool } from "./tools/info/drugImage.js";
import { registerAutocompleteTool } from "./tools/search/autocomplete.js";
import { registerSearchByNameTool } from "./tools/search/searchByName.js";
import { registerSearchBySymptomTool } from "./tools/search/searchBySymptom.js";
import { registerSearchGenericTool } from "./tools/search/searchGeneric.js";

// Function to create and configure an MCP server instance
function createServer() {
    const server = new McpServer({
        name: "israel-drugs-mcp-server",
        version: "1.0.0"
    });

    // Register all prompts and tools
    registerDrugComparisonPrompt(server);
    registerSymptomGuidePrompt(server);
    registerSafetyCheckPrompt(server);
    registerTherapeuticCategoriesTool(server);
    registerAdministrationRoutesTool(server);
    registerSymptomDiscoveryTool(server);
    registerDrugDetailsTool(server);
    registerDrugImageTool(server);
    registerAutocompleteTool(server);
    registerSearchByNameTool(server);
    registerSearchBySymptomTool(server);
    registerSearchGenericTool(server);

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
                enableDnsRebindingProtection: true,
                allowedHosts: ['127.0.0.1', 'localhost', 'localhost:3000']
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
