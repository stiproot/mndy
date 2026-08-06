import { getConfig } from "../config/index.js";
import { logger } from "./logger.js";
import type { BrandInsightsResponse } from "../schemas/index.js";

/**
 * MCP JSON-RPC request structure
 */
interface McpRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params: Record<string, unknown>;
}

/**
 * Persist a brand insights report via Dapr MCP
 *
 * This calls the dapr_actor_save_state tool directly via HTTP,
 * bypassing the need for an agent to make the call.
 */
export async function persistBrandInsightsReport(
  report: BrandInsightsResponse,
  actorId: string = "brand-default"
): Promise<boolean> {
  const config = getConfig();

  if (!config.DAPR_MCP_URL) {
    logger.debug("DAPR_MCP_URL not configured, skipping persistence", undefined, "DaprPersistence");
    return false;
  }

  const sessionId = `persist-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  try {
    // Initialize MCP session
    const initRequest: McpRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "cc-svc-persistence",
          version: "1.0.0",
        },
      },
    };

    const initResponse = await fetch(config.DAPR_MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "mcp-session-id": sessionId,
      },
      body: JSON.stringify(initRequest),
    });

    if (!initResponse.ok) {
      logger.warn(
        `Failed to initialize MCP session: ${initResponse.status}`,
        undefined,
        "DaprPersistence"
      );
      return false;
    }

    // Call the save tool
    const saveRequest: McpRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "dapr_actor_save_state",
        arguments: {
          actorType: "BrandInsightsActor",
          actorId,
          method: "saveReport",
          payload: report,
        },
      },
    };

    const saveResponse = await fetch(config.DAPR_MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "mcp-session-id": sessionId,
      },
      body: JSON.stringify(saveRequest),
    });

    if (!saveResponse.ok) {
      logger.warn(
        `Failed to save report: ${saveResponse.status}`,
        undefined,
        "DaprPersistence"
      );
      return false;
    }

    // Parse SSE response to check for errors
    const responseText = await saveResponse.text();
    const jsonMatch = responseText.match(/data: ({.*})/);

    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[1]);
      if (data.result?.isError) {
        logger.warn(
          `Dapr save returned error: ${data.result.content?.[0]?.text}`,
          undefined,
          "DaprPersistence"
        );
        return false;
      }
    }

    logger.info(
      `Brand insights report persisted to actor ${actorId}`,
      undefined,
      "DaprPersistence"
    );
    return true;
  } catch (error) {
    logger.warn(
      `Failed to persist brand insights: ${error instanceof Error ? error.message : "Unknown error"}`,
      undefined,
      "DaprPersistence"
    );
    return false;
  }
}

/**
 * Retrieve a brand insights report from Dapr actor via MCP
 */
export async function getBrandInsightsReport(
  actorId: string
): Promise<BrandInsightsResponse | null> {
  const config = getConfig();

  if (!config.DAPR_MCP_URL) {
    logger.debug("DAPR_MCP_URL not configured, cannot retrieve report", undefined, "DaprPersistence");
    return null;
  }

  const sessionId = `retrieve-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  try {
    // Initialize MCP session
    const initRequest: McpRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "cc-svc-persistence",
          version: "1.0.0",
        },
      },
    };

    const initResponse = await fetch(config.DAPR_MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "mcp-session-id": sessionId,
      },
      body: JSON.stringify(initRequest),
    });

    if (!initResponse.ok) {
      logger.warn(
        `Failed to initialize MCP session: ${initResponse.status}`,
        undefined,
        "DaprPersistence"
      );
      return null;
    }

    // Call the submit_brand_report tool to get the report
    // We use a custom tool call to invoke getReport on the actor
    const getRequest: McpRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "get_brand_report",
        arguments: {
          actorId,
        },
      },
    };

    const getResponse = await fetch(config.DAPR_MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "mcp-session-id": sessionId,
      },
      body: JSON.stringify(getRequest),
    });

    if (!getResponse.ok) {
      logger.warn(
        `Failed to get report: ${getResponse.status}`,
        undefined,
        "DaprPersistence"
      );
      return null;
    }

    // Parse SSE response
    const responseText = await getResponse.text();
    const jsonMatch = responseText.match(/data: ({.*})/);

    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[1]);
      if (data.result?.isError) {
        logger.warn(
          `Dapr get returned error: ${data.result.content?.[0]?.text}`,
          undefined,
          "DaprPersistence"
        );
        return null;
      }

      // Extract the report from the response
      const content = data.result?.content?.[0]?.text;
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed.found && parsed.data) {
          return parsed.data as BrandInsightsResponse;
        }
      }
    }

    return null;
  } catch (error) {
    logger.warn(
      `Failed to retrieve brand insights: ${error instanceof Error ? error.message : "Unknown error"}`,
      undefined,
      "DaprPersistence"
    );
    return null;
  }
}
