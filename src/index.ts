import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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

// יצירת MCP Server
const server = new McpServer({
  name: "israel-drugs-mcp-server",
  version: "1.0.0"
});

// רישום כל הפרומפטים והכלים
registerDrugComparisonPrompt(server);
registerSymptomGuidePrompt(server);
registerSafetyCheckPrompt(server);

// רישום כלי Discovery
registerTherapeuticCategoriesTool(server);
registerAdministrationRoutesTool(server);
registerSymptomDiscoveryTool(server);

// רישום כלי Info
registerDrugDetailsTool(server);
registerDrugImageTool(server);

// רישום כלי Search
registerAutocompleteTool(server);
registerSearchByNameTool(server);
registerSearchBySymptomTool(server);
registerSearchGenericTool(server);

// הפעלת MCP במצב stdio
const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  // // console.log("MCP Server connected in stdio mode."); // הסרנו את זה כדי למנוע שגיאות JSON
});
