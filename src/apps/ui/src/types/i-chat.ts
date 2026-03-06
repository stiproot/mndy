/**
 * Chat message types for the UI
 */

export interface IChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  labels: string[];
  metadata?: {
    model?: string;
    tokens?: number;
    processingTimeMs?: number;
  };
}

export interface IChatConversation {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  labels: string[];
}

export interface ILabel {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
}

/**
 * WebSocket message types - Inbound (client to server)
 */
export type WsInboundMessageType = 'chat' | 'label' | 'ping';

export interface IWsInboundMessage<T = unknown> {
  type: WsInboundMessageType;
  payload: T;
}

export interface IWsChatPayload {
  conversationId?: string;
  content: string;
}

export interface IWsLabelPayload {
  operation: 'create' | 'update' | 'delete' | 'assign' | 'unassign';
  data: ILabelCreateData | ILabelUpdateData | ILabelDeleteData | ILabelAssignData;
}

export interface ILabelCreateData {
  name: string;
  color: string;
}

export interface ILabelUpdateData {
  id: string;
  name?: string;
  color?: string;
}

export interface ILabelDeleteData {
  id: string;
}

export interface ILabelAssignData {
  messageId: string;
  labelId: string;
}

/**
 * WebSocket message types - Outbound (server to client)
 */
export type WsOutboundMessageType =
  | 'connected'
  | 'status'
  | 'chat_chunk'
  | 'chat_complete'
  | 'chat_error'
  | 'label_update'
  | 'error';

export interface IWsOutboundMessage<T = unknown> {
  type: WsOutboundMessageType;
  data: T;
  timestamp: string;
}

export interface IWsConnectedData {
  userId: string;
}

export interface IWsStatusData {
  status: 'connected' | 'disconnected';
  userId: string;
}

export interface IWsChatChunkData {
  conversationId: string;
  messageId: string;
  content: string;
  done: boolean;
}

export interface IWsChatCompleteData {
  conversationId: string;
  message: IChatMessage;
}

export interface IWsChatErrorData {
  conversationId?: string;
  code: string;
  message: string;
}

export interface IWsLabelUpdateData {
  operation: 'created' | 'updated' | 'deleted' | 'assigned' | 'unassigned';
  label?: ILabel;
  labelId?: string;
  messageId?: string;
}

export interface IWsErrorData {
  code: string;
  message: string;
}
