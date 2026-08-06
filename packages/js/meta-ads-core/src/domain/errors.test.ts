import { describe, expect, it } from "vitest";
import { META_AUTH_ERROR_CODE, isAuthFailure } from "./errors.js";

describe("isAuthFailure", () => {
  it("recognises Meta's OAuth error code", () => {
    expect(isAuthFailure({ code: META_AUTH_ERROR_CODE })).toBe(true);
  });

  it("recognises an expired token from the message alone", () => {
    // The real failure observed in production arrived with NO error code — the SDK did
    // not attach a structured body. Matching on code alone would have missed it, and the
    // generic MetaApiError it fell through to was retried three times for nothing.
    expect(
      isAuthFailure({
        message:
          "Error validating access token: Session has expired on Friday, 27-Mar-26 03:00:00 PDT.",
      }),
    ).toBe(true);
  });

  it("recognises the other OAuth phrasings Meta uses", () => {
    expect(isAuthFailure({ message: "OAuthException: invalid token" })).toBe(true);
    expect(isAuthFailure({ message: "Session is invalid" })).toBe(true);
  });

  it("does not misclassify ordinary API failures as auth problems", () => {
    // These must stay retryable — treating a transient 500 as terminal would be a
    // regression in the opposite direction.
    expect(isAuthFailure({ code: 2, message: "Service temporarily unavailable" })).toBe(
      false,
    );
    expect(isAuthFailure({ code: 17, message: "User request limit reached" })).toBe(false);
    expect(isAuthFailure({ message: "Unsupported get request" })).toBe(false);
  });

  it("handles an empty failure without throwing", () => {
    expect(isAuthFailure({})).toBe(false);
  });
});
