import { AbstractActor } from "@dapr/dapr";
import type { IBrandInsightsActor, BrandInsightsReport } from "../types/index.js";

/**
 * BrandInsightsActor - Actor for storing and retrieving brand insights reports.
 *
 * Each actor instance is identified by a unique ID (e.g., "brand-acme-2025-03-08").
 * The actor persists its state to the configured Dapr state store.
 */
export class BrandInsightsActor
  extends AbstractActor
  implements IBrandInsightsActor
{
  private static readonly REPORT_KEY = "report";
  private static readonly HISTORY_KEY = "history";
  private static readonly MAX_HISTORY = 10;

  /**
   * Save a brand insights report.
   * Also maintains a history of recent reports.
   */
  async saveReport(report: BrandInsightsReport): Promise<void> {
    const stateManager = this.getStateManager();

    // Get existing history
    const history = await this.getReportHistory();

    // Add current report to history (prepend)
    history.unshift(report);

    // Trim history to max size
    if (history.length > BrandInsightsActor.MAX_HISTORY) {
      history.pop();
    }

    // Save both current report and history
    await stateManager.setState(BrandInsightsActor.REPORT_KEY, report);
    await stateManager.setState(BrandInsightsActor.HISTORY_KEY, history);
    await stateManager.saveState();

    console.log(
      `[BrandInsightsActor:${this.getActorId().getId()}] Report saved at ${report.brand.analyzedAt}`
    );
  }

  /**
   * Get the current/latest report.
   */
  async getReport(): Promise<BrandInsightsReport | null> {
    try {
      const stateManager = this.getStateManager<BrandInsightsReport>();
      const report = await stateManager.getState(BrandInsightsActor.REPORT_KEY);
      return report ?? null;
    } catch (error) {
      // State key doesn't exist yet (new actor)
      if (error instanceof Error && error.message.includes("was not found")) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get the report history.
   */
  async getReportHistory(): Promise<BrandInsightsReport[]> {
    try {
      const stateManager = this.getStateManager<BrandInsightsReport[]>();
      const history = await stateManager.getState(BrandInsightsActor.HISTORY_KEY);
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
    console.log(
      `[BrandInsightsActor] Activated: ${this.getActorId().getId()}`
    );
  }

  /**
   * Called when the actor is deactivated (garbage collected).
   */
  async onDeactivate(): Promise<void> {
    console.log(
      `[BrandInsightsActor] Deactivated: ${this.getActorId().getId()}`
    );
  }
}
