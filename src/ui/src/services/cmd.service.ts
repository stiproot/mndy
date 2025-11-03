import { HttpClient } from "./http.client";
import { ITokenExchangeCmd } from "@/types/i-token-exchange-cmd";
import { ITokenExchangeResp } from "@/types/i-token-exchange-resp";
import { IRefreshTokenCmd } from "@/types/i-refresh-token-cmd";
import { ITokenData } from "@/types/i-token-data";
import { dataEnricher } from "./enricher.service";
import { IUpdateProjCmd } from "@/types/i-update-proj-cmd";
import { IProc } from "@/types/i-proc";
import { IProj } from "@/types/i-proj";
import { AuthHttpClient } from "./auth-http.client";

export class CmdService {
  private readonly _client = new HttpClient();
  private readonly _authClient = new AuthHttpClient();

  private async sendRequest(
    method: "post" | "patch",
    endpoint: string,
    cmdData: any = {}
  ): Promise<any> {
    try {
      return await this._client[method](endpoint, { cmdData });
    } catch (error) {
      console.error(`${method.toUpperCase()} request to ${endpoint} failed:`, error);
      return method === "post" ? [] : {};
    }
  }

  public async publishPersistProjCmd(data: IProj): Promise<void> {
    dataEnricher.enrichWithUsr(data, "user_id");
    dataEnricher.enrichWithCreated(data);
    await this.sendRequest("post", "/cmd/data/persist/proj", data);
  }

  public async publishUpdateProjCmd(data: IUpdateProjCmd): Promise<void> {
    dataEnricher.enrichWithUsr(data);
    await this.sendRequest("patch", "/cmd/data/update/proj", data);
  }

  public async publishPersistProcsCmd(procs: IProc[]): Promise<void> {
    const data = { procs };
    dataEnricher.enrichWithUsr(data);
    await this.sendRequest("post", "/cmd/data/persist/procs", data);
  }

  public async publishGatherCmd(data: any): Promise<void> {
    dataEnricher.enrichWithUsr(data);
    await this.sendRequest("post", "/cmd/data/gather", data);
  }

  public async publishStructureCmd(data: any): Promise<void> {
    dataEnricher.enrichWithUsr(data);
    await this.sendRequest("post", "/cmd/data/struct", data);
  }

  public async publishAzdoProxyCmd(data: any): Promise<void> {
    dataEnricher.enrichWithUsr(data);
    await this.sendRequest("post", "/cmd/azdo/proxy", data);
  }

  public async publishWorkflowCmd(data: any): Promise<void> {
    dataEnricher.enrichWithUsr(data);
    await this.sendRequest("post", "/cmd/data/workflows", data);
  }

  public async publishTokenExchangeCmd(cmd: ITokenExchangeCmd): Promise<ITokenExchangeResp> {
    return this._authClient.exchangeCodeForTokens(cmd);
  }

  public async publishRefreshTokenCmd(cmd: IRefreshTokenCmd): Promise<ITokenData> {
    return this.sendRequest("post", "/cmd/auth/token/refresh", cmd);
  }
}
