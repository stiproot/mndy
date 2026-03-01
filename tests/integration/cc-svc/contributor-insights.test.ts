import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { waitForHealth, config, getTestRepository, consumeSSEStream, sleep } from "./setup.js";

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
    // This test calls Claude API multiple times - needs longer timeout
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
  }, 180000); // 3 minute timeout for full orchestrator flow

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

    // Consume and verify the SSE stream
    const events = await consumeSSEStream(response);

    // Verify event sequence
    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain("start");
    expect(eventTypes).toContain("phase");
    expect(eventTypes).toContain("complete");

    // Verify start event structure
    // Note: SSE data contains the full event object { type, data }
    const startEvent = events.find((e) => e.type === "start");
    expect(startEvent).toBeDefined();
    const startPayload = startEvent?.data as { type: string; data: { owner: string; repo: string; username: string } };
    expect(startPayload.data.owner).toBe(config.testOwner);
    expect(startPayload.data.repo).toBe(config.testRepo);
    expect(startPayload.data.username).toBe(config.testUsername);

    // Verify complete event has full response structure
    // Note: SSE data contains the full event object { type, data }
    const completeEvent = events.find((e) => e.type === "complete");
    expect(completeEvent).toBeDefined();
    const completePayload = completeEvent?.data as { type: string; data: Record<string, unknown> };
    expect(completePayload.data).toHaveProperty("contributor");
    expect(completePayload.data).toHaveProperty("summary");
    expect(completePayload.data).toHaveProperty("insights");
  }, 180000); // 3 minute timeout for full orchestrator flow

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

    // Consume and verify the SSE stream
    const events = await consumeSSEStream(response);

    // Verify we received the complete event sequence
    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain("start");
    expect(eventTypes).toContain("complete");
  }, 180000); // 3 minute timeout for full orchestrator flow

  afterAll(async () => {
    // Allow connections to close gracefully
    await sleep(100);
  });
});
