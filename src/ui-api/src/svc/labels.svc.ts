import { Effect } from "effect";
import { Configs } from "../config";
import { LabelError } from "../errors";
import { DaprStateSvc } from "./dapr-state.svc";

// Label type (matching UI types)
export interface ILabel {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
}

export class LabelsSvc extends Effect.Service<LabelsSvc>()("LabelsSvc", {
  effect: DaprStateSvc.pipe(
    Effect.map((stateSvc) => ({
      // Get all labels for a user
      getLabels: (userId: string): Effect.Effect<ILabel[], LabelError> =>
        stateSvc
          .queryState<{ results: Array<{ data: ILabel }> }>(
            Configs.DAPR_LABELS_STATE_STORE_NAME,
            {
              filter: { EQ: { userId } },
              sort: [{ key: "name", order: "ASC" }],
            }
          )
          .pipe(
            Effect.map((resp) => resp.results.map((r) => r.data)),
            Effect.catchTag("DaprStateError", (err) =>
              Effect.fail(
                new LabelError({
                  message: "Failed to get labels",
                  cause: err,
                })
              )
            ),
            Effect.withSpan("LabelsSvc.getLabels", { attributes: { userId } })
          ),

      // Get single label by ID
      getLabel: (labelId: string): Effect.Effect<ILabel | null, LabelError> =>
        stateSvc
          .getState<ILabel>(Configs.DAPR_LABELS_STATE_STORE_NAME, `label:${labelId}`)
          .pipe(
            Effect.catchTag("DaprStateError", () => Effect.succeed(null)),
            Effect.withSpan("LabelsSvc.getLabel", { attributes: { labelId } })
          ),

      // Create a new label
      createLabel: (label: ILabel): Effect.Effect<ILabel, LabelError> =>
        stateSvc
          .saveState<ILabel>(Configs.DAPR_LABELS_STATE_STORE_NAME, [
            { key: `label:${label.id}`, value: label },
          ])
          .pipe(
            Effect.map(() => label),
            Effect.catchTag("DaprStateError", (err) =>
              Effect.fail(
                new LabelError({
                  message: "Failed to create label",
                  labelId: label.id,
                  cause: err,
                })
              )
            ),
            Effect.withSpan("LabelsSvc.createLabel", { attributes: { labelId: label.id } })
          ),

      // Update a label
      updateLabel: (
        labelId: string,
        updates: Partial<Omit<ILabel, "id" | "userId" | "createdAt">>
      ): Effect.Effect<ILabel, LabelError> =>
        stateSvc
          .getState<ILabel>(Configs.DAPR_LABELS_STATE_STORE_NAME, `label:${labelId}`)
          .pipe(
            Effect.flatMap((existingLabel) => {
              const updatedLabel: ILabel = { ...existingLabel, ...updates };
              return stateSvc
                .saveState<ILabel>(Configs.DAPR_LABELS_STATE_STORE_NAME, [
                  { key: `label:${labelId}`, value: updatedLabel },
                ])
                .pipe(Effect.map(() => updatedLabel));
            }),
            Effect.catchTag("DaprStateError", (err) =>
              Effect.fail(
                new LabelError({
                  message: "Failed to update label",
                  labelId,
                  cause: err,
                })
              )
            ),
            Effect.withSpan("LabelsSvc.updateLabel", { attributes: { labelId } })
          ),

      // Delete a label
      deleteLabel: (labelId: string): Effect.Effect<void, LabelError> =>
        stateSvc
          .deleteState(Configs.DAPR_LABELS_STATE_STORE_NAME, `label:${labelId}`)
          .pipe(
            Effect.catchTag("DaprStateError", (err) =>
              Effect.fail(
                new LabelError({
                  message: "Failed to delete label",
                  labelId,
                  cause: err,
                })
              )
            ),
            Effect.withSpan("LabelsSvc.deleteLabel", { attributes: { labelId } })
          ),
    }))
  ),
  dependencies: [DaprStateSvc.Default],
}) {}
