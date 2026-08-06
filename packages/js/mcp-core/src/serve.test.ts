import { describe, expect, it } from "vitest";
import { resolveTransport } from "./serve.js";

describe("resolveTransport", () => {
  it("honours an explicit MCP_TRANSPORT", () => {
    expect(resolveTransport({ MCP_TRANSPORT: "stdio" }, true)).toBe("stdio");
    expect(resolveTransport({ MCP_TRANSPORT: "http" }, false)).toBe("http");
  });

  it("accepts casing and whitespace, since this comes from a hand-edited config file", () => {
    expect(resolveTransport({ MCP_TRANSPORT: " STDIO " }, true)).toBe("stdio");
  });

  it("falls back to http on an unrecognised value rather than guessing", () => {
    // Guessing stdio here would be worse than wrong: it would silently take over stdout.
    expect(resolveTransport({ MCP_TRANSPORT: "websocket" }, true)).toBe("http");
  });

  it("infers stdio when launched by a client — no TTY, no port", () => {
    expect(resolveTransport({}, false)).toBe("stdio");
  });

  it("stays on http when a port is configured, even without a TTY", () => {
    // The detached HTTP runner redirects stdin from /dev/null, so non-TTY alone must not
    // be enough to flip a server to stdio and orphan its port.
    expect(resolveTransport({ PORT: "3003" }, false)).toBe("http");
  });

  it("stays on http in an interactive terminal", () => {
    expect(resolveTransport({}, true)).toBe("http");
  });
});
