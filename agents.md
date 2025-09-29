# MCP Server Template - AI Agent Instructions

This document provides essential guidelines for an AI agent tasked with developing a new Model Context Protocol (MCP) server based on this generic template. Adhering to these instructions will ensure consistency, maintainability, and full compliance with the MCP specification.

---

## 1. Project Overview

This is a **generic MCP server template** designed to be the foundation for any MCP server integrating with various APIs. All domain-specific logic from the original project has been removed and replaced with generic placeholders and structures. The goal is to provide a robust, type-safe, and easily extensible framework.

## 2. Core Components and Template Files

The `src/` directory contains the core logic, organized into several key areas:

*   **`src/prompts/`**: Contains `templatePrompt.ts`.
    *   **Purpose:** MCP prompts allow the AI to generate messages or content based on specific inputs.
    *   **Usage:**
        *   Duplicate `templatePrompt.ts` for each new prompt you need to implement.
        *   Update `promptName`, `title`, `description`, and `genericPromptArgsSchema` (using Zod) to define your prompt's interface.
        *   Implement your prompt's logic within the `promptHandler` function to return messages formatted according to the MCP specification (`role`, `content` as a single `ContentBlock`).
*   **`src/tools/`**: Contains `templateTool.ts`.
    *   **Purpose:** MCP tools enable the AI to interact with external APIs or perform specific actions.
    *   **Usage:**
        *   Duplicate `templateTool.ts` for each new tool you need to implement.
        *   Update `title`, `description`, and `GenericToolSchema` (using Zod) to define your tool's input.
        *   Modify the `handler` function to make calls to your external API via `getApiClient()`, process the response, and return it using `getResponseFormatter()`.
*   **`src/resources/`**: Contains `templateResource.ts`.
    *   **Purpose:** MCP resources provide structured data to the AI, which can be static or fetched dynamically.
    *   **Usage:**
        *   Duplicate `templateResource.ts` for each new resource you need to provide.
        *   Update `title`, `description`, and `schema` (using Zod) to define your resource's structure.
        *   Implement the `resourceFetcher` function to retrieve and format your resource data.
*   **`src/config/`**: Contains `appConfig.ts`.
    *   **Purpose:** Centralized configuration for the MCP server and API client settings (e.g., base URLs, timeouts, retry logic).
    *   **Usage:** Customize environment variables and default values in this file as needed for the specific API integration.
*   **`src/services/`**: Contains `apiClient.ts` and `responseFormatter.ts`.
    *   **`apiClient.ts` (`GenericApiClient`):** Handles generic HTTP requests to external APIs with built-in retry logic and error handling.
        *   **Usage:** Tools should use `getApiClient().performGenericApiCall()` to interact with the target API. Customize `performGenericApiCall` or add specific methods if your API requires unique request structures or authentication.
    *   **`responseFormatter.ts` (`GenericResponseFormatterService`):** Standardizes API responses into AI-optimized MCP success responses.
        *   **Usage:** Tools should use `getResponseFormatter().formatGenericToolResponse()` to format their output. Customize the formatting logic as needed for specific data types or AI preferences.
*   **`src/utils/`**: Contains `errorHandler.ts`, `formatters.ts`, and `validators.ts`.
    *   **`errorHandler.ts`:** Provides centralized error classification, recovery information, and comprehensive error response generation.
        *   **Usage:** Tools and prompts should catch errors and use `classifyError` and `createComprehensiveErrorResponse` to generate consistent MCP error responses.
    *   **`validators.ts`:** Offers generic input validation functions using Zod.
        *   **Usage:** Tools should use `validateToolInput` to ensure received arguments conform to their defined Zod schemas.
    *   **`formatters.ts`:** Contains helper functions for creating standardized MCP success and error responses.

## 3. Extending the Server

*   **Registration:**
    *   After creating new prompt, tool, or resource files, remember to **import and register** them in `src/server.ts` (for HTTP mode) and `src/index.ts` (for Stdio mode).
    *   Look for `// TODO: Add your specific tool and prompt registrations here` comments as indicators.

## 4. Key Development Principles for AI Agents

*   **MCP SDK Compliance:** Always refer to the official Anthropic MCP TypeScript SDK documentation (e.g., `https://github.com/modelcontextprotocol/typescript-sdk`) for the exact type definitions, method signatures, and expected data structures. Do not infer types solely from linter errors; prioritize the official documentation.
*   **Type Safety (Zod):** Leverage Zod extensively for defining input schemas for prompts and tools. This ensures robust input validation and clear API contracts.
*   **Relative Paths:** Maintain the use of relative paths for all internal module imports (e.g., `./config/appConfig.js`, `../types/mcp.js`). **Do not use `@` aliases** or modify `tsconfig.json` for path mapping.
*   **Genericity:** When implementing new features, strive for genericity. Avoid hardcoding API-specific details directly into core components. Use the provided services (`apiClient`, `responseFormatter`) as integration points.
*   **Error Handling:** Implement robust error handling in all new tools and prompts, utilizing the centralized `errorHandler.ts` functions.
*   **Testing:** Develop comprehensive unit and integration tests for all new prompts, tools, and resource fetchers.

---

This template provides a solid foundation. By following these guidelines, the AI agent can efficiently and accurately build new MCP servers for diverse API integrations.
