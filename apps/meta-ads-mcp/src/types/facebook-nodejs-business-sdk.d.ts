declare module "facebook-nodejs-business-sdk" {
  export class FacebookAdsApi {
    static init(accessToken: string): FacebookAdsApi;
  }

  export class AdAccount {
    constructor(id: string);
    getInsights(
      fields: string[],
      params?: Record<string, unknown>
    ): Promise<InsightResultArray>;
    getCampaigns(
      fields: string[],
      params?: Record<string, unknown>
    ): Promise<Campaign[]>;
  }

  export class Campaign {
    id: string;
    name: string;
    status: string;
    objective: string;
    buying_type?: string;
    daily_budget?: string;
    lifetime_budget?: string;
    created_time?: string;
    updated_time?: string;

    static Fields: {
      id: string;
      name: string;
      status: string;
      objective: string;
      buying_type: string;
      daily_budget: string;
      lifetime_budget: string;
      created_time: string;
      updated_time: string;
    };
  }

  export interface InsightResult {
    account_id?: string;
    account_name?: string;
    campaign_id?: string;
    campaign_name?: string;
    adset_id?: string;
    adset_name?: string;
    ad_id?: string;
    ad_name?: string;
    date_start?: string;
    date_stop?: string;
    impressions?: string;
    clicks?: string;
    spend?: string;
    reach?: string;
    frequency?: string;
    cpc?: string;
    cpm?: string;
    ctr?: string;
    cpp?: string;
    actions?: Array<{ action_type: string; value: string }>;
    action_values?: Array<{ action_type: string; value: string }>;
    cost_per_action_type?: Array<{ action_type: string; value: string }>;
    [key: string]: unknown;
  }

  export interface InsightResultArray extends Array<InsightResult> {
    _paging?: {
      cursors?: {
        after?: string;
        before?: string;
      };
      next?: string;
    };
  }
}
