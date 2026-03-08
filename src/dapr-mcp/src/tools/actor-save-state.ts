import { Effect } from "effect";
import { type McpServer, createLogger } from "mcp-core";
import { DaprActorSvc } from "dapr-core";
import type { ActorSaveStateInput } from "../types.js";
import { actorSaveStateSchema } from "../types.js";

const logger = createLogger("dapr_actor_save_state");

/**
 * Effect for saving actor state via method invocation.
 * This is the core business logic, separate from MCP registration.
 */
const saveActorStateEffect = (input: ActorSaveStateInput) =>
  Effect.gen(function* () {
    const actorSvc = yield* DaprActorSvc;

    logger.debug("Invoking actor save method", {
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

    logger.info("Actor state saved successfully", {
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
              message: "State saved successfully",
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
        message: "State saved successfully",
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
 * Register the dapr_actor_save_state tool on the MCP server.
 * This tool invokes a Dapr actor method to save state or data.
 */
export function registerActorSaveStateTool(server: McpServer): void {
  server.registerTool(
    "dapr_actor_save_state",
    {
      title: "Save Dapr Actor State",
      description:
        "Invoke a Dapr actor method to save state or data. Use this to persist information to actors like BrandInsightsActor. The payload will be passed to the actor method for processing.",
      inputSchema: actorSaveStateSchema,
    },
    (args) => {
      const input: ActorSaveStateInput = {
        actorType: args.actorType as string,
        actorId: args.actorId as string,
        method: args.method as string,
        payload: args.payload,
      };

      return Effect.runPromise(
        saveActorStateEffect(input).pipe(Effect.provide(DaprActorSvc.Default))
      );
    }
  );
}
