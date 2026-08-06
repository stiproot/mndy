import { StateStoreMetadata } from "../svc/dapr-state.svc";

export const buildStateStoreMetadata = (partitionKey: string): StateStoreMetadata => ({
  metadata: { partitionKey },
});
