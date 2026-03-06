<template>
  <q-page class="chat-view">
    <div class="chat-layout">
      <LabelsSidebarComponent />
      <div class="chat-main">
        <ChatMessagesComponent />
        <ChatInputComponent />
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, onMounted, onUnmounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useChatStore } from "@/stores/chat.store";
import { useLabelsStore } from "@/stores/labels.store";
import { WebSocketService } from "@/services/websocket.service";
import LabelsSidebarComponent from "@/components/chat/LabelsSidebarComponent.vue";
import ChatMessagesComponent from "@/components/chat/ChatMessagesComponent.vue";
import ChatInputComponent from "@/components/chat/ChatInputComponent.vue";

export default defineComponent({
  name: "ChatView",
  components: {
    LabelsSidebarComponent,
    ChatMessagesComponent,
    ChatInputComponent,
  },
  setup() {
    const route = useRoute();
    const chatStore = useChatStore();
    // labelsStore will be used for loading labels from backend
    void useLabelsStore();

    // Handle WebSocket messages
    function handleWsMessage(message) {
      switch (message.type) {
        case "chat_start":
          chatStore.startStreaming(
            message.data.conversationId,
            message.data.messageId
          );
          break;
        case "chat_chunk":
          chatStore.appendStreamChunk({
            conversationId: message.data.conversationId,
            messageId: message.data.messageId,
            content: message.data.content,
          });
          break;
        case "chat_complete":
          chatStore.completeStreaming({
            conversationId: message.data.conversationId,
            message: message.data.message,
          });
          break;
        case "chat_error":
          chatStore.setError(message.data.error);
          break;
      }
    }

    onMounted(async () => {
      // Connect to WebSocket
      await WebSocketService.connect();

      // Register message handler
      const unsubscribe = WebSocketService.onMessage(handleWsMessage);

      // Store cleanup function
      onUnmounted(() => {
        unsubscribe();
      });

      // Load conversation if ID in route
      if (route.params.conversationId) {
        chatStore.setCurrentConversation(route.params.conversationId);
        // TODO: Load messages from backend
      }

      // TODO: Load labels from backend
    });

    // Watch for route changes
    watch(
      () => route.params.conversationId,
      (newId) => {
        if (newId) {
          chatStore.setCurrentConversation(newId);
          // TODO: Load messages from backend
        } else {
          chatStore.setCurrentConversation(null);
        }
      }
    );

    return {};
  },
});
</script>

<style scoped>
.chat-view {
  height: 100%;
}

.chat-layout {
  display: flex;
  height: calc(100vh - 77px); /* Account for header height */
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
</style>
