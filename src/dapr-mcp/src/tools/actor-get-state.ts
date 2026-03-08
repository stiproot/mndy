import { Effect } from "effect";
import { type McpServer, createLogger } from "mcp-core";
import { DaprActorSvc } from "dapr-core";
import type { ActorGetStateInput } from "../types.js";
import { actorGetStateSchema } from "../types.js";

const logger = createLogger("dapr_actor_get_state");

/**
 * Effect for getting actor state via method invocation.
 * This is the core business logic, separate from MCP registration.
 */
const getActorStateEffect = (input: ActorGetStateInput) =>
  Effect.gen(function* () {
    const actorSvc = yield* DaprActorSvc;

    logger.debug("Invoking actor method", {
      actorType: input.actorType,
      actorId: input.actorId,
      method: input.method,
    });

    const result = yield* actorSvc.invokeMethod(
      input.actorType,
      input.actorId,
      input.method,
      input.payload
    );

    logger.info("Actor method invoked successfully", {
      actorType: input.actorType,
      actorId: input.actorId,
      method: input.method,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              actorType: input.actorType,
              actorId: input.actorId,
              method: input.method,
              result,
            },
            null,
            2
          ),
        },
      ],
      structuredContent: {
        success: true,
        actorType: input.actorType,
        actorId: input.actorId,
        method: input.method,
        result,
      },
    };
  }).pipe(
    Effect.catchTags({
      DaprActorError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Dapr actor error: ${error.message}${error.actorType ? ` (actor: ${error.actorType}/${error.actorId})` : ""}`,
            },
          ],
          isError: true as const,
        }),
      DaprTimeoutError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Actor request timed out after ${error.duration}: ${error.message}`,
            },
          ],
          isError: true as const,
        }),
      DaprConnectionError: (error) =>
        Effect.succeed({
          content: [
            {
              type: "text" as const,
              text: `Dapr connection error: ${error.message} (${error.host}:${error.port})`,
            },
          ],
          isError: true as const,
        }),
    })
  );

/**
 * Register the dapr_actor_get_state tool on the MCP server.
 * This tool invokes a Dapr actor method to retrieve state or data.
 */
export function registerActorGetStateTool(server: McpServer): void {
  server.registerTool(
    "dapr_actor_get_state",
    {
      title: "Get Dapr Actor State",
      description:
        "Invoke a Dapr actor method to retrieve state or data. Use this to get information from actors like BrandInsightsActor. The actor must be registered and running in a Dapr-enabled application.",
      inputSchema: actorGetStateSchema,
    },
    (args) => {
      const input: ActorGetStateInput = {
        actorType: args.actorType as string,
        actorId: args.actorId as string,
        method: args.method as string,
        payload: args.payload,
      };

      return Effect.runPromise(
        getActorStateEffect(input).pipe(Effect.provide(DaprActorSvc.Default))
      );
    }
  );
}
