import { IWorkItem } from '../types/IWorkItem';

/**
 * GitHub Issues Adapter
 *
 * Placeholder for future GitHub Issues integration.
 * Will transform GitHub Issues to platform-agnostic IWorkItem format.
 */
export class GitHubAdapter {
  /**
   * Convert GitHub issue to generic work item
   * @param issue - GitHub issue object
   * @returns IWorkItem
   */
  static toWorkItem(issue: any): IWorkItem {
    // TODO: Implement when GitHub Issues integration is added
    throw new Error('GitHubAdapter.toWorkItem() not yet implemented');
  }

  /**
   * Convert array of GitHub issues to work items
   */
  static toWorkItems(issues: any[]): IWorkItem[] {
    return issues.map(i => this.toWorkItem(i));
  }
}
