
export interface IRelation {
    id: string;
    relation_type: string;
}

export interface IMetadata {
    project_id: string;
}

export interface IUnit {
    __metadata__: IMetadata;
    assigned_to: string;
    changed_by: string;
    changed_date: string;
    children: IUnit[];
    completed_work: number | null;
    defaulted: boolean;
    description: string;
    ext_url: string;
    id: string;
    is_blocked: boolean;
    original_estimate: number | null;
    parent_id: string;
    perc_complete: number;
    active_complete: number;
    relations: IRelation[];
    remaining_work: number | null;
    state: string;
    tags: string[];
    title: string;
    type: string;
    risk_weight: number;
    assigned_to_avatar_url: string;
    ac: string;
    utc_target_timestamp: string;
}