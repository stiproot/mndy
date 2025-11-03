
export interface IProjSummary {
  root_node_id: string;
  no_of_units: number;
  no_of_active_units: number;
  no_of_complete_units: number;
  no_of_new_units: number;
  risk_impact: number;
  risk_impact_status: string | null;  
  no_of_teams: number;
  perc_complete: number;
  perc_active: number;
  completed_work: number;
  teams: string[];
  assigned_to: string | null;
  assigned_to_avatar_url: string | null;
  utc_target_timestamp: string | null;
}

export interface IProj {
  id: string | null;
  name: string | null;
  tag: string | null;
  utc_created_timestamp: string;
  color: string | null;
  is_pinned: string;
  ql: string | null;
  description: string | null;
  user_id: string;
  summary: IProjSummary | null;
  utc_updated_timestamp: string | null;
}

export interface IWiql {
  name: string;
  ql: string;
}