import { StorageKeys, StorageService } from "./storage.service";
import { IUsrData } from "@/types/i-usr-data";
import { now } from "@/services/timestamp.service";

export class dataEnricher {

  public static enrichWithUsr(data: any, idName: string | null = null): void {
    const usr = StorageService.item<IUsrData>(StorageKeys.MNDY_USR_DATA_KEY);
    if (!usr) throw new Error("User data not found in storage");

    idName = idName || "userId";

    Object.assign(data, { [idName]: usr.email });
  }

  public static enrichWithCreated(data: any): void {
    Object.assign(data, { "utc_created_timestamp": now() });
  }

  public static enrichWithUpdated(data: any): void {
    Object.assign(data, { "utc_updated_timestamp": now() });
  }
}

