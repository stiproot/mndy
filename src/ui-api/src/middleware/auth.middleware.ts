import { Effect } from "effect";
import { Request, Response, NextFunction } from "express";
import { OktaAuthSvc, AppLayer } from "../svc";
import { UnauthorizedError, ForbiddenError } from "../errors";

export interface AuthContext {
  devMode: boolean;
  fingerprint?: string;
  token?: string;
}

// Effect-based token validation logic
const validateTokenEffect = (
  authHeader: string | undefined,
  fingerprint: string | undefined
): Effect.Effect<
  AuthContext,
  UnauthorizedError | ForbiddenError,
  OktaAuthSvc
> =>
  Effect.gen(function* () {
    const authSvc = yield* OktaAuthSvc;

    // Development auth bypass
    if (authSvc.isDevAuthEnabled()) {
      if (!fingerprint) {
        yield* Effect.logWarning("[DEV AUTH] No fingerprint header found");
        return yield* Effect.fail(
          new UnauthorizedError({
            message: "No fingerprint in dev mode",
            reason: "missing_fingerprint",
          })
        );
      }
      yield* Effect.logInfo(
        `[DEV AUTH] Bypassing Okta validation for fingerprint: ${fingerprint}`
      );
      return { devMode: true, fingerprint };
    }

    // Production Okta validation
    const token = authHeader?.split(" ")[1];

    if (!token) {
      yield* Effect.logWarning("No token found in Authorization header");
      return yield* Effect.fail(
        new UnauthorizedError({
          message: "No access token provided",
          reason: "missing_token",
        })
      );
    }

    yield* authSvc.validateAccessToken(token).pipe(
      Effect.catchAll(() =>
        Effect.fail(
          new ForbiddenError({
            message: "Invalid or expired token",
            reason: "invalid_token",
          })
        )
      )
    );

    return { devMode: false, token };
  });

// Express middleware wrapper
export const validateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const fingerprint = req.headers["x-fingerprint"] as string | undefined;

  Effect.runPromise(
    validateTokenEffect(authHeader, fingerprint).pipe(Effect.provide(AppLayer))
  )
    .then(() => next())
    .catch((error: unknown) => {
      if (error instanceof UnauthorizedError) {
        res.status(401).json({ error: error.message });
        return;
      }
      if (error instanceof ForbiddenError) {
        res.status(403).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    });
};
