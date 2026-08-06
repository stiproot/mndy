/**
 * WebSocket Service for real-time chat communication
 *
 * Handles:
 * - Connection management with authentication
 * - Automatic reconnection with exponential backoff
 * - Message sending and receiving
 * - Event callbacks for Vue components
 */

import { StorageService } from "./storage.service";
import { FingerprintService } from "./fingerprint.service";
import { ENV_VAR } from "./env.service";
import { EnvKeys } from "@/types/env-keys";
import type {
  IWsInboundMessage,
  IWsChatPayload,
  IWsOutboundMessage,
  WsOutboundMessageType,
} from "@/types/i-chat";

type ConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting";
type MessageHandler = (message: IWsOutboundMessage) => void;
type ConnectionHandler = (state: ConnectionState) => void;
type ErrorHandler = (error: Error) => void;

interface WebSocketServiceConfig {
  maxReconnectAttempts: number;
  initialReconnectDelay: number;
  maxReconnectDelay: number;
  heartbeatTimeout: number;
}

const DEFAULT_CONFIG: WebSocketServiceConfig = {
  maxReconnectAttempts: 10,
  initialReconnectDelay: 1000,
  maxReconnectDelay: 30000,
  heartbeatTimeout: 45000, // Server sends heartbeat every 30s
};

class WebSocketServiceClass {
  private ws: WebSocket | null = null;
  private config: WebSocketServiceConfig;
  private connectionState: ConnectionState = "disconnected";
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;

  // Event handlers
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();

  constructor(config: Partial<WebSocketServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get the WebSocket URL with authentication parameters
   */
  private getWebSocketUrl(): string {
    const baseUrl = ENV_VAR(EnvKeys.VUE_APP_UI_API_BASE_URL);
    const wsUrl = baseUrl.replace(/^http/, "ws").replace(/\/ui-api$/, "/ws");

    const params = new URLSearchParams();

    // Add auth token or fingerprint
    const ignoreAuth = ENV_VAR(EnvKeys.VUE_APP_IGNORE_AUTH) === "true";
    if (ignoreAuth) {
      const fingerprint = FingerprintService.getCachedFingerprint();
      if (fingerprint) {
        params.set("fingerprint", fingerprint);
      }
    } else {
      const token = StorageService.accessToken()?.raw;
      if (token) {
        params.set("token", token);
      }
    }

    return `${wsUrl}?${params.toString()}`;
  }

  /**
   * Connect to the WebSocket server
   */
  public async connect(): Promise<void> {
    if (this.connectionState === "connected" || this.connectionState === "connecting") {
      console.log("[WS] Already connected or connecting");
      return;
    }

    // Ensure fingerprint is ready in dev mode
    const ignoreAuth = ENV_VAR(EnvKeys.VUE_APP_IGNORE_AUTH) === "true";
    if (ignoreAuth && !FingerprintService.getCachedFingerprint()) {
      await FingerprintService.getFingerprint();
    }

    this.setConnectionState("connecting");

    try {
      const url = this.getWebSocketUrl();
      console.log("[WS] Connecting to:", url);

      this.ws = new WebSocket(url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error("[WS] Connection error:", error);
      this.setConnectionState("disconnected");
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    console.log("[WS] Disconnecting");

    this.clearReconnectTimeout();
    this.clearHeartbeatTimeout();

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.setConnectionState("disconnected");
    this.reconnectAttempts = 0;
  }

  /**
   * Send a chat message
   */
  public sendChatMessage(payload: IWsChatPayload): boolean {
    return this.send({ type: "chat", payload });
  }

  /**
   * Send a raw message
   */
  public send<T>(message: IWsInboundMessage<T>): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[WS] Cannot send message: not connected");
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("[WS] Send error:", error);
      return false;
    }
  }

  /**
   * Register a message handler
   */
  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Register a connection state handler
   */
  public onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    // Immediately call with current state
    handler(this.connectionState);
    return () => this.connectionHandlers.delete(handler);
  }

  /**
   * Register an error handler
   */
  public onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connectionState === "connected";
  }

  // Private methods

  private handleOpen(): void {
    console.log("[WS] Connected");
    this.setConnectionState("connected");
    this.reconnectAttempts = 0;
    this.resetHeartbeatTimeout();
  }

  private handleClose(event: CloseEvent): void {
    console.log("[WS] Closed:", event.code, event.reason);
    this.clearHeartbeatTimeout();

    if (event.code === 1000) {
      // Normal closure
      this.setConnectionState("disconnected");
    } else {
      // Unexpected closure - try to reconnect
      this.setConnectionState("reconnecting");
      this.scheduleReconnect();
    }
  }

  private handleMessage(event: MessageEvent): void {
    this.resetHeartbeatTimeout();

    try {
      const message = JSON.parse(event.data) as IWsOutboundMessage;
      console.log("[WS] Received:", message.type);

      // Notify handlers
      this.messageHandlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error("[WS] Message handler error:", error);
        }
      });
    } catch (error) {
      console.error("[WS] Failed to parse message:", error);
    }
  }

  private handleError(event: Event): void {
    console.error("[WS] Error:", event);
    const error = new Error("WebSocket error");
    this.errorHandlers.forEach((handler) => handler(error));
  }

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.connectionHandlers.forEach((handler) => handler(state));
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error("[WS] Max reconnect attempts reached");
      this.setConnectionState("disconnected");
      return;
    }

    const delay = Math.min(
      this.config.initialReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.config.maxReconnectDelay
    );

    console.log(`[WS] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private resetHeartbeatTimeout(): void {
    this.clearHeartbeatTimeout();
    this.heartbeatTimeout = setTimeout(() => {
      console.warn("[WS] Heartbeat timeout - connection may be stale");
      // Force reconnect
      if (this.ws) {
        this.ws.close(4000, "Heartbeat timeout");
      }
    }, this.config.heartbeatTimeout);
  }

  private clearHeartbeatTimeout(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }
}

// Export singleton instance
export const WebSocketService = new WebSocketServiceClass();

// Export class for testing
export { WebSocketServiceClass };
