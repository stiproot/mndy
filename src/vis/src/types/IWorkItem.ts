/**
 * Generic Work Item Interface
 *
 * Platform-agnostic representation of a work item that can be used
 * across Azure DevOps, GitHub Issues, Jira, and other platforms.
 */

export interface IWorkItem {
  // Core fields
  id: string;
  title: string;
  state: WorkItemState;
  type: WorkItemType;
  assignedTo?: string;
  createdDate: Date;
  updatedDate: Date;

  // Hierarchical relationships
  parentId?: string;
  children?: IWorkItem[];

  // Risk/Status indicators
  ragStatus?: RagStatus;
  severity?: Severity;
  riskWeight?: number;
  percentComplete?: number;

  // Metadata
  tags?: string[];
  externalUrl?: string;
  platform: 'azdo' | 'github' | 'jira' | 'other';

  // Custom fields (platform-specific passthrough)
  customFields?: Record<string, any>;
}

/**
 * Generic work item states
 * Platforms should map their states to these canonical values
 */
export type WorkItemState = 'new' | 'active' | 'resolved' | 'closed';

/**
 * Generic work item types
 * Platforms should map their types to these canonical values
 */
export type WorkItemType = 'epic' | 'feature' | 'story' | 'task' | 'bug' | 'issue';

/**
 * RAG (Red/Amber/Green) status indicator
 */
export type RagStatus = 'red' | 'amber' | 'green' | 'gray';

/**
 * Severity levels
 */
export type Severity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Helper type for chart filters
 */
export interface IChartFilters {
  ragStatus?: RagStatus[];
  severity?: Severity[];
  states?: WorkItemState[];
  types?: WorkItemType[];
  tags?: string[];
  assignedTo?: string[];
  riskWeightMin?: number;
  riskWeightMax?: number;
}
