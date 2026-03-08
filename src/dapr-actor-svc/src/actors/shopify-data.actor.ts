import { AbstractActor } from "@dapr/dapr";
import type { IShopifyDataActor, ShopifyRawData } from "../types/index.js";

/**
 * ShopifyDataActor - Actor for storing and retrieving raw Shopify analytics data.
 *
 * Each actor instance is identified by a unique ID following the pattern:
 * "shopify-{brandId}-{startDate}-{endDate}" (e.g., "shopify-default-2025-03-01-2025-03-07")
 *
 * The actor persists its state to the configured Dapr state store.
 */
export class ShopifyDataActor extends AbstractActor implements IShopifyDataActor {
  private static readonly DATA_KEY = "data";
  private static readonly HISTORY_KEY = "history";
  private static readonly MAX_HISTORY = 10;

  /**
   * Save Shopify analytics data.
   * Also maintains a history of recent data collections.
   */
  async saveData(data: ShopifyRawData): Promise<void> {
    const stateManager = this.getStateManager();

    // Get existing history
    const history = await this.getDataHistory();

    // Add current data to history (prepend)
    history.unshift(data);

    // Trim history to max size
    if (history.length > ShopifyDataActor.MAX_HISTORY) {
      history.pop();
    }

    // Save both current data and history
    await stateManager.setState(ShopifyDataActor.DATA_KEY, data);
    await stateManager.setState(ShopifyDataActor.HISTORY_KEY, history);
    await stateManager.saveState();

    console.log(
      `[ShopifyDataActor:${this.getActorId().getId()}] Data saved for ${data.dateRange.startDate} to ${data.dateRange.endDate}`
    );
  }

  /**
   * Get the current/latest data.
   */
  async getData(): Promise<ShopifyRawData | null> {
    try {
      const stateManager = this.getStateManager<ShopifyRawData>();
      const data = await stateManager.getState(ShopifyDataActor.DATA_KEY);
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
  async getDataHistory(): Promise<ShopifyRawData[]> {
    try {
      const stateManager = this.getStateManager<ShopifyRawData[]>();
      const history = await stateManager.getState(ShopifyDataActor.HISTORY_KEY);
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
    console.log(`[ShopifyDataActor] Activated: ${this.getActorId().getId()}`);
  }

  /**
   * Called when the actor is deactivated (garbage collected).
   */
  async onDeactivate(): Promise<void> {
    console.log(`[ShopifyDataActor] Deactivated: ${this.getActorId().getId()}`);
  }
}
