import { Effect } from "effect";
import { Request, Response } from "express";
import { OktaAuthSvc, AppLayer } from "../svc";
import { OktaConfig } from "../config";

// Exchange authorization code for tokens
export const processExchangeCodeForTokenCmd = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { code, nonce } = req.body;

  const effect = Effect.gen(function* () {
    yield* Effect.logInfo("Processing exchange cmd.");

    const authSvc = yield* OktaAuthSvc;

    // Exchange code for tokens
    const tokenResponse = yield* authSvc.exchangeCodeForToken(code);

    // Verify tokens
    const idToken = yield* authSvc.validateIdToken(
      tokenResponse.id_token,
      nonce
    );
    const accessToken = yield* authSvc.validateAccessToken(
      tokenResponse.access_token
    );

    const claims = idToken.claims as unknown as {
      email: string;
      name: string;
      title?: string;
    };

    // Save user to state
    yield* authSvc.saveUserToState(claims.email, claims.name, claims.title);

    yield* Effect.logInfo("Processed exchange cmd.");

    return {
      status: "ok",
      tokens: {
        accessToken: {
          raw: tokenResponse.access_token,
          obj: accessToken,
        },
        idToken: {
          raw: tokenResponse.id_token,
          obj: idToken,
        },
        refreshToken: {
          raw: tokenResponse.refresh_token,
        },
      },
      usr: {
        email: claims.email,
        name: claims.name,
      },
    };
  }).pipe(Effect.provide(AppLayer));

  Effect.runPromise(effect)
    .then((result) => res.json(result))
    .catch((error: unknown) => {
      console.error("Token exchange error:", error);
      res.status(500).json({ error: "Token exchange failed" });
    });
};

// Refresh access token
export const processRefreshTokenCmd = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { refreshToken } = req.body;

  const effect = Effect.gen(function* () {
    yield* Effect.logInfo("Processing refresh cmd.");

    const authSvc = yield* OktaAuthSvc;

    // Refresh tokens
    const tokenResponse = yield* authSvc.refreshToken(refreshToken);

    // Verify new tokens
    const idToken = yield* authSvc.validateIdToken(tokenResponse.id_token);
    const accessToken = yield* authSvc.validateAccessToken(
      tokenResponse.access_token
    );

    yield* Effect.logInfo("Processed refresh cmd.");

    return {
      status: "ok",
      accessToken: {
        raw: tokenResponse.access_token,
        obj: accessToken,
      },
      idToken: {
        raw: tokenResponse.id_token,
        obj: idToken,
      },
      refreshToken: {
        raw: tokenResponse.refresh_token,
      },
    };
  }).pipe(Effect.provide(AppLayer));

  Effect.runPromise(effect)
    .then((result) => res.json(result))
    .catch((error: unknown) => {
      console.error("Process refresh token failed:", error);
      res.sendStatus(500);
    });
};

// Development authentication (fingerprint-based)
export const processDevAuthCmd = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { fingerprint } = req.body;

  const effect = Effect.gen(function* () {
    const authSvc = yield* OktaAuthSvc;
    const config = yield* OktaConfig;

    // Check if dev auth is enabled
    if (!config.ignoreAuth) {
      yield* Effect.logError(
        "[DEV AUTH] Attempted to use dev auth endpoint when IGNORE_AUTH is false"
      );
      return yield* Effect.fail({ status: 403, message: "Dev auth not enabled" });
    }

    yield* Effect.logWarning(
      "DEV AUTH MODE ACTIVE - This should NEVER be used in production!"
    );
    yield* Effect.logInfo("[DEV AUTH] Processing dev auth cmd.");

    if (!fingerprint) {
      yield* Effect.logError("[DEV AUTH] No fingerprint provided");
      return yield* Effect.fail({
        status: 400,
        message: "fingerprint required",
      });
    }

    const response = authSvc.generateDevTokens(fingerprint);

    // Save user to state
    yield* authSvc.saveUserToState(
      response.usr.email,
      response.usr.name,
      response.usr.title
    );

    yield* Effect.logInfo("[DEV AUTH] Processed dev auth cmd successfully");

    return {
      status: "ok",
      ...response,
    };
  }).pipe(Effect.provide(AppLayer));

  Effect.runPromise(effect)
    .then((result) => res.json(result))
    .catch((error: { status?: number; message?: string }) => {
      res
        .status(error.status ?? 500)
        .json({ error: error.message ?? "Dev auth failed" });
    });
};
