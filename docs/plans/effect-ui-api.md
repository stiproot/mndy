# Effect-TS migration: ui-api

Status: Active — migrate the API gateway onto Effect. It COMPILES as of 2026-08-06:
`chat.handlers.ts` was failing `turbo build` on `Effect.fail` with plain objects, now
replaced by tagged errors (`NotFoundError`, `ForbiddenError`). The wider migration —
handlers still call `Effect.runPromise` per request rather than sharing a runtime, and
errors are matched on `_tag` strings at the express boundary — is not done.
Established: 2026-08-06
