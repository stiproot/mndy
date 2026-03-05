import { Effect } from "effect";
import OktaJwtVerifier from "@okta/jwt-verifier";
import axios from "axios";
import qs from "qs";
import { OktaConfig, Configs } from "../config";
import { DaprStateSvc, StateItem } from "./dapr-state.svc";
import {
  OktaValidationError,
  OktaTokenExchangeError,
  OktaTokenRefreshError,
  DaprStateError,
} from "../errors";

export interface TokenExchangeResponse {
  id_token: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserData {
  id: string;
  name: string;
  title?: string;
}

export interface DevTokenResponse {
  tokens: {
    accessToken: {
      raw: string;
      obj: {
        sub: string;
        email: string;
        name: string;
        expiresAt: number;
      };
    };
    idToken: {
      raw: string;
      obj: {
        sub: string;
        email: string;
        name: string;
        expiresAt: number;
      };
    };
    refreshToken: {
      raw: string;
      obj: {
        sub: string;
        expiresAt: number;
      };
    };
  };
  usr: {
    email: string;
    name: string;
    title: string;
  };
}

const makeExchangeRequest = (
  tokenUri: string,
  data: string
): Effect.Effect<TokenExchangeResponse, OktaTokenExchangeError> =>
  Effect.tryPromise({
    try: () =>
      axios.request({
        method: "post",
        maxBodyLength: Infinity,
        url: tokenUri,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: data,
      }),
    catch: (error) =>
      new OktaTokenExchangeError({
        message: "Failed to exchange code for token",
        cause: error,
      }),
  }).pipe(Effect.map((response) => response.data as TokenExchangeResponse));

const makeRefreshRequest = (
  tokenUri: string,
  data: string
): Effect.Effect<TokenExchangeResponse, OktaTokenRefreshError> =>
  Effect.tryPromise({
    try: () =>
      axios.request({
        method: "post",
        maxBodyLength: Infinity,
        url: tokenUri,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: data,
      }),
    catch: (error) =>
      new OktaTokenRefreshError({
        message: "Failed to refresh token",
        cause: error,
      }),
  }).pipe(Effect.map((response) => response.data as TokenExchangeResponse));

export class OktaAuthSvc extends Effect.Service<OktaAuthSvc>()("OktaAuthSvc", {
  effect: Effect.gen(function* () {
    const config = yield* OktaConfig;
    const daprStateSvc = yield* DaprStateSvc;

    const oktaJwtVerifier = new OktaJwtVerifier({
      issuer: config.issuer,
      clientId: config.clientId,
    });

    const redirectUri = `${config.redirectBaseUrl}/authorization-code/callback`;

    return {
      isDevAuthEnabled: (): boolean => config.ignoreAuth,

      validateAccessToken: (
        token: string
      ): Effect.Effect<OktaJwtVerifier.Jwt, OktaValidationError> =>
        Effect.tryPromise({
          try: () => oktaJwtVerifier.verifyAccessToken(token, "api://default"),
          catch: (error) =>
            new OktaValidationError({
              message: "Failed to validate access token",
              cause: error,
            }),
        }).pipe(Effect.withSpan("OktaAuthSvc.validateAccessToken")),

      validateIdToken: (
        token: string,
        nonce?: string
      ): Effect.Effect<OktaJwtVerifier.Jwt, OktaValidationError> =>
        Effect.tryPromise({
          try: () => oktaJwtVerifier.verifyIdToken(token, config.clientId, nonce),
          catch: (error) =>
            new OktaValidationError({
              message: "Failed to validate ID token",
              cause: error,
            }),
        }).pipe(Effect.withSpan("OktaAuthSvc.validateIdToken")),

      exchangeCodeForToken: (
        code: string
      ): Effect.Effect<TokenExchangeResponse, OktaTokenExchangeError> => {
        const data = qs.stringify({
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code: code,
          client_secret: config.clientSecret,
          client_id: config.clientId,
        });

        return makeExchangeRequest(config.tokenUri, data).pipe(
          Effect.withSpan("OktaAuthSvc.exchangeCodeForToken")
        );
      },

      refreshToken: (
        refreshToken: string
      ): Effect.Effect<TokenExchangeResponse, OktaTokenRefreshError> => {
        const data = qs.stringify({
          grant_type: "refresh_token",
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: refreshToken,
        });

        return makeRefreshRequest(config.tokenUri, data).pipe(
          Effect.withSpan("OktaAuthSvc.refreshToken")
        );
      },

      saveUserToState: (
        email: string,
        name: string,
        title?: string
      ): Effect.Effect<void, DaprStateError> => {
        const userData: UserData = { id: email, name, title };
        const state: StateItem<UserData>[] = [{ key: email, value: userData }];
        return daprStateSvc.saveState(Configs.DAPR_USRS_STATE_STORE_NAME, state);
      },

      generateDevTokens: (fingerprint: string): DevTokenResponse => {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = now + 86400; // 24 hours

        const accessTokenObj = {
          sub: fingerprint,
          email: `dev-${fingerprint.substring(0, 8)}@local.dev`,
          name: "Dev User",
          aud: "api://default",
          iss: "dev-auth",
          iat: now,
          exp: expiresAt,
          expiresAt: expiresAt,
        };

        const idTokenObj = {
          sub: fingerprint,
          email: `dev-${fingerprint.substring(0, 8)}@local.dev`,
          name: "Dev User",
          aud: "dev-client",
          iss: "dev-auth",
          iat: now,
          exp: expiresAt,
          expiresAt: expiresAt,
        };

        const refreshTokenObj = {
          sub: fingerprint,
          iat: now,
          exp: expiresAt,
          expiresAt: expiresAt,
        };

        const accessTokenRaw = `dev.${Buffer.from(JSON.stringify(accessTokenObj)).toString("base64")}.sig`;
        const idTokenRaw = `dev.${Buffer.from(JSON.stringify(idTokenObj)).toString("base64")}.sig`;
        const refreshTokenRaw = `dev.${Buffer.from(JSON.stringify(refreshTokenObj)).toString("base64")}.sig`;

        return {
          tokens: {
            accessToken: { raw: accessTokenRaw, obj: accessTokenObj },
            idToken: { raw: idTokenRaw, obj: idTokenObj },
            refreshToken: { raw: refreshTokenRaw, obj: refreshTokenObj },
          },
          usr: {
            email: `dev-${fingerprint.substring(0, 8)}@local.dev`,
            name: "Dev User",
            title: "Developer",
          },
        };
      },
    };
  }),
  dependencies: [DaprStateSvc.Default],
}) {}
