import { IUsrData } from '@/types/i-usr-data';
import { ICoreAuthService } from '@/types/i-core-auth-service';
import { StorageService, StorageKeys } from './storage.service';
import { OktaAuthService } from './oktaAuth.service';
import { DevAuthService } from './devAuth.service';
import { IToken } from '@/types/i-token-data';
import { ENV_VAR } from './env.service';
import { EnvKeys } from '@/types/env-keys';

export class AuthService {

  private readonly _core: ICoreAuthService = this.createAuthService();

  private createAuthService(): ICoreAuthService {
    const ignoreAuth = ENV_VAR(EnvKeys.VUE_APP_IGNORE_AUTH) === 'true';

    if (ignoreAuth) {
      console.warn('🔓 IGNORE_AUTH is enabled - using DevAuthService');
      return new DevAuthService();
    }

    return new OktaAuthService();
  }

  public isAuthenticated = (): boolean => this._core.isAuthenticated();

  public signIn = async (): Promise<void> => await this._core.signIn();

  public getUser = (): IUsrData | null => StorageService.usrData();

  public getAccessToken = (): IToken | null => StorageService.accessToken();

  public async login(): Promise<void> {
    const code = this._core.getVerificationCode();
    const state = this._core.getStateCode();
    const tokens = await this._core.exchangeCodeForTokens(code, state);
    StorageService.item(StorageKeys.MNDY_TOKEN_DATA_KEY, tokens.tokens);
    StorageService.item(StorageKeys.MNDY_USR_DATA_KEY, tokens.usr);
  }

  public logout = (): void => this._core.logout();

  public async refreshTokens(): Promise<void> {
    await this._core.refreshTokens();
  }
}
