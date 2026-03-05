import { HttpClient } from "./http.client";
import { dataEnricher } from "./enricher.service";

export class CmdService {
  private readonly _client = new HttpClient();

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

  public async publishAzdoProxyCmd(data: any): Promise<void> {
    dataEnricher.enrichWithUsr(data);
    await this.sendRequest("post", "/cmd/azdo/proxy", data);
  }
}

// Singleton instance for use in stores and other non-component contexts
export const cmdService = new CmdService();
