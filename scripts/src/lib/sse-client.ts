/**
 * Reusable SSE client for brand insights streaming
 */

export interface SSEEvent {
  type: "start" | "phase" | "text" | "tool" | "error" | "complete" | "done";
  data: unknown;
}

export interface BrandInsightsRequest {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  options?: {
    includeGA4?: boolean;
    includeShopify?: boolean;
    includeMeta?: boolean;
  };
}

export interface SSEClientOptions {
  url: string;
  onEvent?: (event: SSEEvent) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  verbose?: boolean;
}

/**
 * Stream brand insights from cc-svc endpoint
 */
export async function streamBrandInsights(
  request: BrandInsightsRequest,
  options: SSEClientOptions
): Promise<void> {
  const response = await fetch(options.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      let currentEventType: string | null = null;

      for (const line of lines) {
        if (line.startsWith("event:")) {
          currentEventType = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          const dataStr = line.slice(5).trim();
          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);
            const event: SSEEvent = {
              type: currentEventType as SSEEvent["type"],
              data,
            };

            if (options.onEvent) {
              options.onEvent(event);
            }

            // Handle 'done' event - end stream
            if (event.type === "done") {
              if (options.onComplete) {
                options.onComplete();
              }
              return;
            }

            // Handle error event
            if (event.type === "error") {
              const error = new Error(
                (data as { message?: string }).message || "Unknown error"
              );
              if (options.onError) {
                options.onError(error);
              }
              return;
            }
          } catch (parseError) {
            if (options.verbose) {
              console.error("Failed to parse SSE data:", dataStr, parseError);
            }
          }
        }
      }
    }
  } catch (error) {
    if (options.onError) {
      options.onError(error as Error);
    } else {
      throw error;
    }
  } finally {
    reader.releaseLock();
  }
}
