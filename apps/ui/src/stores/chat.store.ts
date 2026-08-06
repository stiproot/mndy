import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type {
  IChatMessage,
  IChatConversation,
  IWsChatChunkData,
  IWsChatCompleteData,
} from "@/types/i-chat";
import { v4 as uuidv4 } from "uuid";

export const useChatStore = defineStore("chat-store", () => {
  // State
  const conversations = ref<IChatConversation[]>([]);
  const currentConversationId = ref<string | null>(null);
  const messages = ref<Map<string, IChatMessage[]>>(new Map());
  const isStreaming = ref(false);
  const streamingMessageId = ref<string | null>(null);
  const streamingContent = ref("");
  const error = ref<string | null>(null);

  // Computed
  const currentConversation = computed(() => {
    if (!currentConversationId.value) return null;
    return conversations.value.find(c => c.id === currentConversationId.value) ?? null;
  });

  const currentMessages = computed(() => {
    if (!currentConversationId.value) return [];
    return messages.value.get(currentConversationId.value) ?? [];
  });

  const hasConversations = computed(() => conversations.value.length > 0);

  // Actions
  function startNewConversation(): string {
    const id = uuidv4();
    const conversation: IChatConversation = {
      id,
      userId: "", // Will be set by backend
      title: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      labels: [],
    };

    conversations.value.unshift(conversation);
    messages.value.set(id, []);
    currentConversationId.value = id;
    error.value = null;

    return id;
  }

  function setCurrentConversation(id: string | null): void {
    currentConversationId.value = id;
    error.value = null;
  }

  function addUserMessage(content: string): IChatMessage {
    const conversationId = currentConversationId.value ?? startNewConversation();

    const message: IChatMessage = {
      id: uuidv4(),
      conversationId,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
      labels: [],
    };

    const conversationMessages = messages.value.get(conversationId) ?? [];
    conversationMessages.push(message);
    messages.value.set(conversationId, conversationMessages);

    // Update conversation
    const conversation = conversations.value.find(c => c.id === conversationId);
    if (conversation) {
      conversation.messageCount++;
      conversation.updatedAt = new Date().toISOString();
    }

    return message;
  }

  function startStreaming(conversationId: string, messageId: string): void {
    isStreaming.value = true;
    streamingMessageId.value = messageId;
    streamingContent.value = "";
    error.value = null;

    // Create placeholder assistant message
    const message: IChatMessage = {
      id: messageId,
      conversationId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      labels: [],
    };

    const conversationMessages = messages.value.get(conversationId) ?? [];
    conversationMessages.push(message);
    messages.value.set(conversationId, conversationMessages);
  }

  function appendStreamChunk(chunk: IWsChatChunkData): void {
    if (!isStreaming.value || chunk.messageId !== streamingMessageId.value) {
      return;
    }

    streamingContent.value += chunk.content;

    // Update the message in place
    const conversationMessages = messages.value.get(chunk.conversationId);
    if (conversationMessages) {
      const message = conversationMessages.find(m => m.id === chunk.messageId);
      if (message) {
        message.content = streamingContent.value;
      }
    }
  }

  function completeStreaming(data: IWsChatCompleteData): void {
    isStreaming.value = false;
    streamingMessageId.value = null;
    streamingContent.value = "";

    // Update the message with final data
    const conversationMessages = messages.value.get(data.conversationId);
    if (conversationMessages) {
      const messageIndex = conversationMessages.findIndex(m => m.id === data.message.id);
      if (messageIndex !== -1) {
        conversationMessages[messageIndex] = data.message;
      }
    }

    // Update conversation
    const conversation = conversations.value.find(c => c.id === data.conversationId);
    if (conversation) {
      conversation.messageCount++;
      conversation.updatedAt = new Date().toISOString();
      // Auto-title from first assistant message if no title
      if (!conversation.title && data.message.content) {
        conversation.title = data.message.content.substring(0, 50) + (data.message.content.length > 50 ? "..." : "");
      }
    }
  }

  function setError(errorMessage: string): void {
    error.value = errorMessage;
    isStreaming.value = false;
    streamingMessageId.value = null;
    streamingContent.value = "";
  }

  function clearError(): void {
    error.value = null;
  }

  function loadConversations(data: IChatConversation[]): void {
    conversations.value = data;
  }

  function loadMessages(conversationId: string, data: IChatMessage[]): void {
    messages.value.set(conversationId, data);
  }

  function updateMessageLabels(messageId: string, labels: string[]): void {
    for (const [, conversationMessages] of messages.value) {
      const message = conversationMessages.find(m => m.id === messageId);
      if (message) {
        message.labels = labels;
        break;
      }
    }
  }

  function reset(): void {
    conversations.value = [];
    currentConversationId.value = null;
    messages.value = new Map();
    isStreaming.value = false;
    streamingMessageId.value = null;
    streamingContent.value = "";
    error.value = null;
  }

  return {
    // State
    conversations,
    currentConversationId,
    messages,
    isStreaming,
    streamingMessageId,
    streamingContent,
    error,

    // Computed
    currentConversation,
    currentMessages,
    hasConversations,

    // Actions
    startNewConversation,
    setCurrentConversation,
    addUserMessage,
    startStreaming,
    appendStreamChunk,
    completeStreaming,
    setError,
    clearError,
    loadConversations,
    loadMessages,
    updateMessageLabels,
    reset,
  };
});
