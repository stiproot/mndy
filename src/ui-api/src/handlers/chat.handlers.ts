import { Effect } from "effect";
import { Response, Request } from "express";
import { ChatSvc, LabelsSvc, AppLayer } from "../svc";
import type { IChatMessage, IChatConversation, ILabel } from "../svc";

// Type for authenticated request
interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Helper to get userId from request (supports both auth token and fingerprint)
const getUserId = (req: AuthenticatedRequest): string | null => {
  return req.userId || (req.headers["x-fingerprint"] as string) || null;
};

// ==================== Conversation Handlers ====================

// GET /chat/conversations - List all conversations for user
export const listConversations = (req: AuthenticatedRequest, res: Response): void => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const effect = ChatSvc.pipe(
    Effect.flatMap((chatSvc) => chatSvc.listConversations(userId)),
    Effect.provide(AppLayer)
  );

  Effect.runPromise(effect)
    .then((conversations) => res.json(conversations))
    .catch((error: unknown) => {
      console.error("List conversations error:", error);
      res.status(500).json({ error: "Failed to list conversations" });
    });
};

// GET /chat/conversations/:id - Get a single conversation with messages
export const getConversation = (req: AuthenticatedRequest, res: Response): void => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const conversationId = req.params.id;

  const effect = ChatSvc.pipe(
    Effect.flatMap((chatSvc) =>
      Effect.all({
        conversation: chatSvc.getConversation(conversationId),
        messages: chatSvc.getMessages(conversationId),
      })
    ),
    Effect.provide(AppLayer)
  );

  Effect.runPromise(effect)
    .then(({ conversation, messages }) => {
      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }
      // Verify ownership
      if (conversation.userId !== userId) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      res.json({ conversation, messages });
    })
    .catch((error: unknown) => {
      console.error("Get conversation error:", error);
      res.status(500).json({ error: "Failed to get conversation" });
    });
};

// POST /chat/conversations - Create a new conversation
export const createConversation = (req: AuthenticatedRequest, res: Response): void => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { title } = req.body as { title?: string };

  const conversation: IChatConversation = {
    id: crypto.randomUUID(),
    userId,
    title: title || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messageCount: 0,
    labels: [],
  };

  const effect = ChatSvc.pipe(
    Effect.flatMap((chatSvc) => chatSvc.saveConversation(conversation)),
    Effect.map(() => conversation),
    Effect.provide(AppLayer)
  );

  Effect.runPromise(effect)
    .then((result) => res.status(201).json(result))
    .catch((error: unknown) => {
      console.error("Create conversation error:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    });
};

// ==================== Label Handlers ====================

// GET /chat/labels - List all labels for user
export const listLabels = (req: AuthenticatedRequest, res: Response): void => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const effect = LabelsSvc.pipe(
    Effect.flatMap((labelsSvc) => labelsSvc.getLabels(userId)),
    Effect.provide(AppLayer)
  );

  Effect.runPromise(effect)
    .then((labels) => res.json(labels))
    .catch((error: unknown) => {
      console.error("List labels error:", error);
      res.status(500).json({ error: "Failed to list labels" });
    });
};

// POST /chat/labels - Create a new label
export const createLabel = (req: AuthenticatedRequest, res: Response): void => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { name, color } = req.body as { name: string; color: string };

  if (!name || !color) {
    res.status(400).json({ error: "Name and color are required" });
    return;
  }

  const label: ILabel = {
    id: crypto.randomUUID(),
    name,
    color,
    userId,
    createdAt: new Date().toISOString(),
  };

  const effect = LabelsSvc.pipe(
    Effect.flatMap((labelsSvc) => labelsSvc.createLabel(label)),
    Effect.provide(AppLayer)
  );

  Effect.runPromise(effect)
    .then((result) => res.status(201).json(result))
    .catch((error: unknown) => {
      console.error("Create label error:", error);
      res.status(500).json({ error: "Failed to create label" });
    });
};

// PUT /chat/labels/:id - Update a label
export const updateLabel = (req: AuthenticatedRequest, res: Response): void => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const labelId = req.params.id;
  const { name, color } = req.body as { name?: string; color?: string };

  const effect = LabelsSvc.pipe(
    Effect.flatMap((labelsSvc) =>
      labelsSvc.getLabel(labelId).pipe(
        Effect.flatMap((label) => {
          if (!label) {
            return Effect.fail({ status: 404, message: "Label not found" });
          }
          if (label.userId !== userId) {
            return Effect.fail({ status: 403, message: "Forbidden" });
          }
          return labelsSvc.updateLabel(labelId, { name, color });
        })
      )
    ),
    Effect.provide(AppLayer)
  );

  Effect.runPromise(effect)
    .then((result) => res.json(result))
    .catch((error: unknown) => {
      const err = error as { status?: number; message?: string };
      if (err.status === 404) {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err.status === 403) {
        res.status(403).json({ error: err.message });
        return;
      }
      console.error("Update label error:", error);
      res.status(500).json({ error: "Failed to update label" });
    });
};

// DELETE /chat/labels/:id - Delete a label
export const deleteLabel = (req: AuthenticatedRequest, res: Response): void => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const labelId = req.params.id;

  const effect = LabelsSvc.pipe(
    Effect.flatMap((labelsSvc) =>
      labelsSvc.getLabel(labelId).pipe(
        Effect.flatMap((label) => {
          if (!label) {
            return Effect.fail({ status: 404, message: "Label not found" });
          }
          if (label.userId !== userId) {
            return Effect.fail({ status: 403, message: "Forbidden" });
          }
          return labelsSvc.deleteLabel(labelId);
        })
      )
    ),
    Effect.provide(AppLayer)
  );

  Effect.runPromise(effect)
    .then(() => res.status(204).send())
    .catch((error: unknown) => {
      const err = error as { status?: number; message?: string };
      if (err.status === 404) {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err.status === 403) {
        res.status(403).json({ error: err.message });
        return;
      }
      console.error("Delete label error:", error);
      res.status(500).json({ error: "Failed to delete label" });
    });
};

// ==================== Message Label Handlers ====================

// POST /chat/messages/:messageId/labels - Assign labels to a message
export const assignLabelsToMessage = (req: AuthenticatedRequest, res: Response): void => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const messageId = req.params.messageId;
  const { labelIds, conversationId } = req.body as { labelIds: string[]; conversationId: string };

  if (!Array.isArray(labelIds) || !conversationId) {
    res.status(400).json({ error: "labelIds array and conversationId are required" });
    return;
  }

  const effect = ChatSvc.pipe(
    Effect.flatMap((chatSvc) =>
      chatSvc.getMessages(conversationId).pipe(
        Effect.flatMap((messages) => {
          const messageIndex = messages.findIndex((m) => m.id === messageId);
          if (messageIndex === -1) {
            return Effect.fail({ status: 404, message: "Message not found" });
          }

          const updatedMessages = [...messages];
          updatedMessages[messageIndex] = {
            ...messages[messageIndex],
            labels: labelIds,
          };

          return chatSvc.saveMessages(conversationId, updatedMessages).pipe(
            Effect.map(() => updatedMessages[messageIndex])
          );
        })
      )
    ),
    Effect.provide(AppLayer)
  );

  Effect.runPromise(effect)
    .then((message) => res.json(message))
    .catch((error: unknown) => {
      const err = error as { status?: number; message?: string };
      if (err.status === 404) {
        res.status(404).json({ error: err.message });
        return;
      }
      console.error("Assign labels error:", error);
      res.status(500).json({ error: "Failed to assign labels" });
    });
};

// DELETE /chat/messages/:messageId/labels/:labelId - Remove a label from a message
export const removeLabelFromMessage = (req: AuthenticatedRequest, res: Response): void => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { messageId, labelId } = req.params;
  const { conversationId } = req.query as { conversationId: string };

  if (!conversationId) {
    res.status(400).json({ error: "conversationId query param is required" });
    return;
  }

  const effect = ChatSvc.pipe(
    Effect.flatMap((chatSvc) =>
      chatSvc.getMessages(conversationId).pipe(
        Effect.flatMap((messages) => {
          const messageIndex = messages.findIndex((m) => m.id === messageId);
          if (messageIndex === -1) {
            return Effect.fail({ status: 404, message: "Message not found" });
          }

          const updatedMessages = [...messages];
          updatedMessages[messageIndex] = {
            ...messages[messageIndex],
            labels: messages[messageIndex].labels.filter((l) => l !== labelId),
          };

          return chatSvc.saveMessages(conversationId, updatedMessages).pipe(
            Effect.map(() => updatedMessages[messageIndex])
          );
        })
      )
    ),
    Effect.provide(AppLayer)
  );

  Effect.runPromise(effect)
    .then((message) => res.json(message))
    .catch((error: unknown) => {
      const err = error as { status?: number; message?: string };
      if (err.status === 404) {
        res.status(404).json({ error: err.message });
        return;
      }
      console.error("Remove label error:", error);
      res.status(500).json({ error: "Failed to remove label" });
    });
};
