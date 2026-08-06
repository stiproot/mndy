/**
 * Development Authentication Service
 *
 * WARNING: This service is for development only!
 * Bypasses Okta OAuth and uses browser fingerprinting instead.
 * Should NEVER be used in production environments.
 */

import { ICoreAuthService } from '@/types/i-core-auth-service';
import { ITokenExchangeResp } from '@/types/i-token-exchange-resp';
import { FingerprintService } from './fingerprint.service';
import { StorageService } from './storage.service';
import { ENV_VAR } from './env.service';
import { EnvKeys } from '@/types/env-keys';

const DEFAULT_BASE_URL = () => ENV_VAR(EnvKeys.VUE_APP_UI_API_BASE_URL);
const LOGIN_URI = () => `${window.location.origin}/login`;

export class DevAuthService implements ICoreAuthService {
  private readonly BASE_URL: string;
  private fingerprintPromise: Promise<string>;

  constructor() {
    this.BASE_URL = DEFAULT_BASE_URL();
    console.warn('⚠️  DEV AUTH MODE ACTIVE - Using browser fingerprint instead of Okta');

    // Pre-generate fingerprint immediately to avoid race conditions
    // This ensures the fingerprint is cached before any API requests are made
    this.fingerprintPromise = FingerprintService.getFingerprint();
  }

  public isAuthenticated(): boolean {
    const accessToken = StorageService.accessToken();
    return !!accessToken;
  }

  public async signIn(): Promise<void> {
    console.log('[DEV AUTH] Starting fingerprint-based sign in');

    // Wait for pre-generated fingerprint (already started in constructor)
    const fingerprint = await this.fingerprintPromise;
    const response = await this.callDevAuthEndpoint(fingerprint);

    // Store tokens and user data
    StorageService.item('mndy-token-data-storage', response.tokens);
    StorageService.item('mndy-usr-data-storage', response.usr);

    console.log('[DEV AUTH] Sign in successful, redirecting to app');

    // Redirect to projects page
    window.location.href = `${window.location.origin}/projects`;
  }

  public logout(): void {
    console.log('[DEV AUTH] Logging out');
    StorageService.clearUsrData();
    window.location.href = LOGIN_URI();
  }

  public getVerificationCode(): string {
    // Not used in dev auth mode
    return '';
  }

  public getStateCode(): string {
    // Not used in dev auth mode
    return '';
  }

  public async exchangeCodeForTokens(code: string, state: string): Promise<ITokenExchangeResp> {
    // Not used in dev auth mode - signIn handles authentication directly
    throw new Error('exchangeCodeForTokens is not used in dev auth mode');
  }

  public async refreshTokens(): Promise<void> {
    console.log('[DEV AUTH] Refreshing tokens');

    // Use the pre-generated fingerprint promise
    const fingerprint = await this.fingerprintPromise;
    const response = await this.callDevAuthEndpoint(fingerprint);

    // Update stored tokens
    StorageService.setTokenData(response.tokens);
  }

  private async callDevAuthEndpoint(fingerprint: string): Promise<ITokenExchangeResp> {
    const url = `${this.BASE_URL}/cmd/auth/dev`;
    const req = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      body: JSON.stringify({ fingerprint }),
    };

    const response = await fetch(url, req);
    if (!response.ok) {
      throw new Error(`[DEV AUTH] POST request to ${url} failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      tokens: data.tokens,
      usr: data.usr,
    };
  }
}
