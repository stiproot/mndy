import { AbstractActor } from "@dapr/dapr";
import type { IGA4DataActor, GA4RawData } from "../types/index.js";

/**
 * GA4DataActor - Actor for storing and retrieving raw GA4 analytics data.
 *
 * Each actor instance is identified by a unique ID following the pattern:
 * "ga4-{brandId}-{startDate}-{endDate}" (e.g., "ga4-default-2025-03-01-2025-03-07")
 *
 * The actor persists its state to the configured Dapr state store.
 */
export class GA4DataActor extends AbstractActor implements IGA4DataActor {
  private static readonly DATA_KEY = "data";
  private static readonly HISTORY_KEY = "history";
  private static readonly MAX_HISTORY = 10;

  /**
   * Save GA4 analytics data.
   * Also maintains a history of recent data collections.
   */
  async saveData(data: GA4RawData): Promise<void> {
    const actorId = this.getActorId().getId();
    console.log(`[GA4DataActor:${actorId}] saveData called with:`, JSON.stringify(data, null, 2));

    try {
      const stateManager = this.getStateManager();

      // Get existing history
      const history = await this.getDataHistory();
      console.log(`[GA4DataActor:${actorId}] Current history length: ${history.length}`);

      // Add current data to history (prepend)
      history.unshift(data);

      // Trim history to max size
      if (history.length > GA4DataActor.MAX_HISTORY) {
        history.pop();
      }

      // Save both current data and history
      console.log(`[GA4DataActor:${actorId}] Saving state...`);
      await stateManager.setState(GA4DataActor.DATA_KEY, data);
      await stateManager.setState(GA4DataActor.HISTORY_KEY, history);
      await stateManager.saveState();

      console.log(
        `[GA4DataActor:${actorId}] Data saved for ${data.dateRange.startDate} to ${data.dateRange.endDate}`
      );
    } catch (error) {
      console.error(`[GA4DataActor:${actorId}] Error saving data:`, error);
      throw error;
    }
  }

  /**
   * Get the current/latest data.
   */
  async getData(): Promise<GA4RawData | null> {
    try {
      const stateManager = this.getStateManager<GA4RawData>();
      const data = await stateManager.getState(GA4DataActor.DATA_KEY);
      return data ?? null;
    } catch (error) {
      // State key doesn't exist yet (new actor)
      if (error instanceof Error && error.message.includes("was not found")) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get the data history.
   */
  async getDataHistory(): Promise<GA4RawData[]> {
    try {
      const stateManager = this.getStateManager<GA4RawData[]>();
      const history = await stateManager.getState(GA4DataActor.HISTORY_KEY);
      return history ?? [];
    } catch (error) {
      // State key doesn't exist yet (new actor)
      if (error instanceof Error && error.message.includes("was not found")) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Called when the actor is activated (first request or reactivation).
   */
  async onActivate(): Promise<void> {
    console.log(`[GA4DataActor] Activated: ${this.getActorId().getId()}`);
  }

  /**
   * Called when the actor is deactivated (garbage collected).
   */
  async onDeactivate(): Promise<void> {
    console.log(`[GA4DataActor] Deactivated: ${this.getActorId().getId()}`);
  }
}
