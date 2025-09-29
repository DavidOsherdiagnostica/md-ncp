import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MCP_SERVER_CONFIG } from "./config/appConfig.js";

// Import generic tool and prompt registrations
import { registerTemplatePrompt } from "./prompts/templatePrompt.js";
import { registerTemplateTool } from "./tools/templateTool.js";
import { registerTemplateResource } from "./resources/templateResource.js";

// Create generic MCP Server
const server = new McpServer({
  name: MCP_SERVER_CONFIG.SERVER_NAME,
  version: MCP_SERVER_CONFIG.SERVER_VERSION
});

// Register generic prompts, tools, and resources
registerTemplatePrompt(server);
registerTemplateTool(server);
registerTemplateResource(server); // Register the generic resource

// TODO: Add your specific tool and prompt registrations here
// import { registerYourCustomTool } from "./tools/yourCustomTool.js";
// registerYourCustomTool(server);

// TODO: Add your specific resource registrations here
// import { registerYourCustomResource } from "./resources/yourCustomResource.js";
// registerYourCustomResource(server);

// Start MCP in stdio mode
const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  // console.log("MCP Server connected in stdio mode."); // Remove for clean JSON output
});
