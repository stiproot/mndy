<template>
  <div class="chat-input-container">
    <q-input
      v-model="messageText"
      outlined
      autogrow
      placeholder="Type a message..."
      class="chat-input"
      :disable="isStreaming"
      @keydown.enter.exact.prevent="handleSend"
      @keydown.meta.enter="handleSend"
      @keydown.ctrl.enter="handleSend"
    >
      <template v-slot:append>
        <q-btn
          round
          flat
          icon="send"
          :disable="!canSend"
          @click="handleSend"
        />
      </template>
    </q-input>
    <div v-if="isStreaming" class="streaming-indicator">
      <q-spinner-dots color="primary" size="24px" />
      <span class="q-ml-sm">Generating response...</span>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { useChatStore } from "@/stores/chat.store";
import { WebSocketService } from "@/services/websocket.service";

export default defineComponent({
  name: "ChatInputComponent",
  setup() {
    const chatStore = useChatStore();
    const { isStreaming, currentConversationId } = storeToRefs(chatStore);

    const messageText = ref("");

    const canSend = computed(() => {
      return messageText.value.trim().length > 0 && !isStreaming.value;
    });

    function handleSend() {
      if (!canSend.value) return;

      const content = messageText.value.trim();
      messageText.value = "";

      // Add user message to store
      chatStore.addUserMessage(content);

      // Send via WebSocket
      WebSocketService.sendChatMessage({
        conversationId: currentConversationId.value || undefined,
        content,
      });
    }

    return {
      messageText,
      isStreaming,
      canSend,
      handleSend,
    };
  },
});
</script>

<style scoped>
.chat-input-container {
  padding: 16px;
  background: #fff;
  border-top: 1px solid #e0e0e0;
}

.chat-input {
  width: 100%;
}

.streaming-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  color: #666;
  font-size: 14px;
}
</style>
