import {  IWorkItem, WorkItemState, WorkItemType, RagStatus, Severity } from '../types/IWorkItem';

/**
 * Azure DevOps Unit Interface
 * (Minimal type definition - actual runtime object may have more fields)
 */
interface IAzDoUnit {
  id: string;
  title: string;
  state: string;
  type: string;
  assigned_to?: string;
  changed_date?: string;
  created_date?: string;
  parent_id?: string;
  children?: IAzDoUnit[];
  rag_status?: string;
  severity?: number;
  risk_weight?: number;
  perc_complete?: number;
  tags?: string[];
  ext_url?: string;
  iteration_path?: string;
  area_path?: string;
  description?: string;
  defaulted?: boolean;
  is_blocked?: boolean;
  completed_work?: number | null;
  remaining_work?: number | null;
  original_estimate?: number | null;
  __metadata__?: {
    project_id: string;
  };
}

/**
 * Azure DevOps Adapter
 *
 * Transforms Azure DevOps work items (IUnit) to platform-agnostic IWorkItem format.
 */
export class AzDoAdapter {
  /**
   * Convert Azure DevOps unit to generic work item
   */
  static toWorkItem(unit: IAzDoUnit): IWorkItem {
    return {
      id: unit.id,
      title: unit.title,
      state: this.mapState(unit.state),
      type: this.mapType(unit.type),
      assignedTo: unit.assigned_to,
      createdDate: unit.created_date ? new Date(unit.created_date) : new Date(),
      updatedDate: unit.changed_date ? new Date(unit.changed_date) : new Date(),
      parentId: unit.parent_id,
      children: unit.children?.map(c => this.toWorkItem(c)),
      ragStatus: this.mapRagStatus(unit.rag_status),
      severity: this.mapSeverity(unit.severity),
      riskWeight: unit.risk_weight,
      percentComplete: unit.perc_complete,
      tags: unit.tags,
      externalUrl: unit.ext_url,
      platform: 'azdo',
      customFields: {
        iteration: unit.iteration_path,
        area: unit.area_path,
        description: unit.description,
        defaulted: unit.defaulted,
        isBlocked: unit.is_blocked,
        completedWork: unit.completed_work,
        remainingWork: unit.remaining_work,
        originalEstimate: unit.original_estimate,
        projectId: unit.__metadata__?.project_id,
      },
    };
  }

  /**
   * Convert array of Azure DevOps units to work items
   */
  static toWorkItems(units: IAzDoUnit[]): IWorkItem[] {
    return units.map(u => this.toWorkItem(u));
  }

  /**
   * Map Azure DevOps state to generic state
   */
  private static mapState(azDoState?: string): WorkItemState {
    if (!azDoState) return 'new';

    const stateLower = azDoState.toLowerCase();

    if (stateLower === 'new') return 'new';
    if (stateLower === 'active' || stateLower === 'in progress' || stateLower === 'committed') return 'active';
    if (stateLower === 'resolved' || stateLower === 'done') return 'resolved';
    if (stateLower === 'closed' || stateLower === 'removed') return 'closed';

    // Default fallback
    return 'active';
  }

  /**
   * Map Azure DevOps type to generic type
   */
  private static mapType(azDoType?: string): WorkItemType {
    if (!azDoType) return 'task';

    const typeLower = azDoType.toLowerCase();

    if (typeLower === 'epic') return 'epic';
    if (typeLower === 'feature') return 'feature';
    if (typeLower === 'user story' || typeLower === 'story') return 'story';
    if (typeLower === 'task') return 'task';
    if (typeLower === 'bug') return 'bug';
    if (typeLower === 'issue') return 'issue';

    // Default fallback
    return 'task';
  }

  /**
   * Map RAG status string to canonical value
   */
  private static mapRagStatus(ragStatus?: string): RagStatus {
    if (!ragStatus) return 'gray';

    const statusLower = ragStatus.toLowerCase();

    if (statusLower === 'red') return 'red';
    if (statusLower === 'amber' || statusLower === 'yellow' || statusLower === 'orange') return 'amber';
    if (statusLower === 'green') return 'green';

    return 'gray';
  }

  /**
   * Map numeric severity to canonical severity level
   * Assumes: 1=Critical, 2=High, 3=Medium, 4=Low (AzDO convention)
   */
  private static mapSeverity(severity?: number): Severity {
    if (severity === undefined || severity === null) return 'medium';

    if (severity === 1) return 'critical';
    if (severity === 2) return 'high';
    if (severity === 3) return 'medium';
    if (severity === 4 || severity > 4) return 'low';

    return 'medium';
  }
}
