import { describe, it, expect, beforeAll } from "vitest";
import { waitForHealth, config, getTestRepository } from "./setup.js";

describe("POST /cc-svc/contributor-insights", () => {
  beforeAll(async () => {
    // Wait for cc-svc health endpoint
    await waitForHealth(`${config.ccSvcUrl}/cc-svc/health`);
  });

  it("returns 200 for health check", async () => {
    const response = await fetch(`${config.ccSvcUrl}/cc-svc/health`);
    expect(response.status).toBe(200);
  });

  it("returns 400 for missing required fields", async () => {
    const response = await fetch(
      `${config.ccSvcUrl}/cc-svc/contributor-insights`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );

    expect(response.status).toBe(400);
  });

  it("returns contributor insights for valid request", async () => {
    const response = await fetch(
      `${config.ccSvcUrl}/cc-svc/contributor-insights`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: config.testOwner,
          repo: config.testRepo,
          username: config.testUsername,
        }),
      }
    );

    expect(response.status).toBe(200);

    const data = await response.json();

    // Verify response structure
    expect(data).toHaveProperty("contributor");
    expect(data).toHaveProperty("summary");
    expect(data).toHaveProperty("issueAnalysis");
    expect(data).toHaveProperty("activityTracking");
    expect(data).toHaveProperty("qualityAssessment");
    expect(data).toHaveProperty("insights");
    expect(data).toHaveProperty("metadata");

    // Verify contributor info
    expect(data.contributor.username).toBe(config.testUsername);
    expect(data.contributor.repository).toBe(getTestRepository());
  });

  it("supports SSE streaming via Accept header", async () => {
    const response = await fetch(
      `${config.ccSvcUrl}/cc-svc/contributor-insights`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          owner: config.testOwner,
          repo: config.testRepo,
          username: config.testUsername,
        }),
      }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
  });

  it("supports SSE streaming via query parameter", async () => {
    const response = await fetch(
      `${config.ccSvcUrl}/cc-svc/contributor-insights?stream=true`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: config.testOwner,
          repo: config.testRepo,
          username: config.testUsername,
        }),
      }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
  });
});
