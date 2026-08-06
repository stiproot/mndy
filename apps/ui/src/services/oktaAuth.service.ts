import { OktaAuth } from '@okta/okta-auth-js';
import { CmdService } from './cmd.service';
import { ITokenExchangeCmd } from '@/types/i-token-exchange-cmd';
import { ITokenExchangeResp } from '@/types/i-token-exchange-resp';
import { ICoreAuthService } from '@/types/i-core-auth-service';
import { IRefreshTokenCmd } from '@/types/i-refresh-token-cmd';
import { StorageService } from './storage.service';
import { ITokenData } from '@/types/i-token-data';
import { ENV_VAR } from './env.service';
import { EnvKeys } from '@/types/env-keys';

const REDIRECT_URI = () => `${window.location.origin}/authorization-code/callback`;
const LOGIN_URI = () => `${window.location.origin}/login`;
const OKTA_CLIENT_ID = () => ENV_VAR(EnvKeys.VUE_APP_OKTA_CLIENT_ID);
const OKTA_ISSUER = () => ENV_VAR(EnvKeys.VUE_APP_OKTA_ISSUER);

export class OktaAuthService implements ICoreAuthService {

  private readonly _authClient: OktaAuth;
  private readonly _cmdService: CmdService = new CmdService();

  constructor() {
    this._authClient = new OktaAuth({
      clientId: OKTA_CLIENT_ID(),
      issuer: OKTA_ISSUER(),
      redirectUri: REDIRECT_URI(),
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      pkce: false,
      responseType: ['code'],
    });
  }

  public isAuthenticated(): boolean {
    const accessToken = StorageService.accessToken();
    if (!accessToken) return false;

    // todo: validate token...

    return true;
  }

  public getVerificationCode(): string {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) throw new Error("No code in URL");
    return code;
  }

  public getStateCode(): string {
    const code = new URLSearchParams(window.location.search).get('state');
    if (!code) throw new Error("No state in URL");
    return code;
  }

  public async exchangeCodeForTokens(code: string, state: string): Promise<ITokenExchangeResp> {
    const { codeVerifier, nonce } = this.getTransactionDataFromStorage(state);
    const data: ITokenExchangeCmd = { code: code, codeVerifier: codeVerifier, nonce: nonce };
    const resp: ITokenExchangeResp = await this._cmdService.publishTokenExchangeCmd(data);
    return resp;
  }

  public async signIn(): Promise<void> {
    console.log('OktaAuthService: signIn()');
    await this.signInWithRedirect();
  }

  private signInWithRedirect = async (): Promise<void> => await this._authClient.signInWithRedirect();

  public logout(): void {
    StorageService.clearUsrData();
    window.location.href = LOGIN_URI();
  }

  public async refreshTokens(): Promise<void> {
    const refreshToken = StorageService.refreshToken()?.raw;

    if (!refreshToken) throw new Error("No refresh token found");

    const cmd: IRefreshTokenCmd = { refreshToken: refreshToken };
    const resp: ITokenData = await this._cmdService.publishRefreshTokenCmd(cmd);

    StorageService.setTokenData(resp);
  }

  private getTransactionDataFromStorage(state: string): any {
    const transactionStorage = localStorage.getItem('okta-shared-transaction-storage');
    if (!transactionStorage) throw new Error("No transaction storage to use.");

    const obj = JSON.parse(transactionStorage);
    const transaction = obj[state]['transaction']
    const codeVerifier = transaction['codeVerifier'];
    const nonce = transaction['nonce'];

    return { codeVerifier: codeVerifier, nonce: nonce };
  }
}