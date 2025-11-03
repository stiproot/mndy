import { HttpClient } from "./http.client";
import { dataEnricher } from "./enricher.service";

export class QryService {
  private readonly _client = new HttpClient();

  private async post(endpoint: string, qryData: any = {}): Promise<any> {
    try {
      return await this._client.post(endpoint, { qryData });
    } catch (error) {
      console.error(`POST request to ${endpoint} failed:`, error);
      return [];
    }
  }

  public getProjQry(projId: string): Promise<any> {
    return this.post("/qry/data/proj", { projId });
  }

  public getProjsQry(qryData: any): Promise<any> {
    return this.post("/qry/data/projs", qryData);
  }

  public async getProcsQry(data: any): Promise<any> {
    dataEnricher.enrichWithUsr(data);
    return this.post("/qry/data/procs", { userId: data.userId });
  }

  public getStructQry(data: any): Promise<any> {
    const { projId, structType } = data;
    return this.post("/qry/data/struct", { projId, structType });
  }

  public getUnitsQry(data: any): Promise<any> {
    const { projId, unitType } = data;
    return this.post("/qry/data/units", { projId, unitType });
  }

  public getWiDetails(id: string | number): Promise<any> {
    return this.post("/ext/qry/data/wi/details", { qryData: { id } });
  }

  public getAllTeams(): Promise<any> {
    return this.post("/ext/qry/data/teams");
  }

  public getTeamIterations(teamName: string): Promise<any> {
    return this.post("/ext/qry/data/team/iterations", { teamName });
  }

  public getTeamSettings(teamName: string): Promise<any> {
    return this.post("/ext/qry/data/team/settings", { teamName });
  }

  public getTeamFieldValues(teamName: string): Promise<any> {
    return this.post("/ext/qry/data/team/fieldvalues", { teamName });
  }

  public runWiql(ql: string): Promise<any> {
    return this.post("/ext/qry/data/wiql", { ql });
  }
}