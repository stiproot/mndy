<template>
  <div class="chat-messages" ref="messagesContainer">
    <div v-if="messages.length === 0" class="empty-state">
      <q-icon name="chat" size="64px" color="grey-4" />
      <p class="text-grey-6">Start a conversation</p>
    </div>
    <ChatMessageComponent
      v-for="message in messages"
      :key="message.id"
      :message="message"
      @addLabel="handleAddLabel"
      @removeLabel="handleRemoveLabel"
      @createLabel="showCreateLabelDialog = true"
    />
    <div v-if="isStreaming && streamingContent" class="streaming-message">
      <ChatMessageComponent
        :message="streamingMessage"
        :showAddLabel="false"
      />
    </div>
  </div>

  <q-dialog v-model="showCreateLabelDialog">
    <q-card style="min-width: 300px">
      <q-card-section>
        <div class="text-h6">Create Label</div>
      </q-card-section>
      <q-card-section>
        <q-input
          v-model="newLabelName"
          label="Label name"
          outlined
          dense
        />
        <div class="q-mt-md">
          <div class="text-caption q-mb-sm">Color</div>
          <div class="color-picker">
            <div
              v-for="color in labelColors"
              :key="color"
              :class="['color-option', { selected: newLabelColor === color }]"
              :style="{ backgroundColor: color }"
              @click="newLabelColor = color"
            />
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn
          color="primary"
          label="Create"
          :disable="!newLabelName.trim()"
          @click="handleCreateLabel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent, ref, computed, watch, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { useChatStore } from "@/stores/chat.store";
import { useLabelsStore } from "@/stores/labels.store";
import ChatMessageComponent from "./ChatMessageComponent.vue";

const LABEL_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export default defineComponent({
  name: "ChatMessagesComponent",
  components: { ChatMessageComponent },
  setup() {
    const chatStore = useChatStore();
    const labelsStore = useLabelsStore();

    const { currentMessages, isStreaming, streamingContent, streamingMessageId, currentConversationId } =
      storeToRefs(chatStore);

    const messagesContainer = ref(null);
    const showCreateLabelDialog = ref(false);
    const newLabelName = ref("");
    const newLabelColor = ref(LABEL_COLORS[0]);

    const messages = computed(() => currentMessages.value);

    const streamingMessage = computed(() => ({
      id: streamingMessageId.value || "streaming",
      conversationId: currentConversationId.value || "",
      role: "assistant",
      content: streamingContent.value,
      timestamp: new Date().toISOString(),
      labels: [],
    }));

    function scrollToBottom() {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
      });
    }

    // Auto-scroll when new messages arrive
    watch(
      () => currentMessages.value.length,
      () => scrollToBottom()
    );

    // Auto-scroll when streaming content updates
    watch(
      () => streamingContent.value,
      () => scrollToBottom()
    );

    async function handleAddLabel({ messageId, labelId }) {
      const message = messages.value.find((m) => m.id === messageId);
      if (message) {
        const newLabels = [...message.labels, labelId];
        chatStore.updateMessageLabels(messageId, newLabels);
        // TODO: Persist to backend
      }
    }

    async function handleRemoveLabel({ messageId, labelId }) {
      const message = messages.value.find((m) => m.id === messageId);
      if (message) {
        const newLabels = message.labels.filter((l) => l !== labelId);
        chatStore.updateMessageLabels(messageId, newLabels);
        // TODO: Persist to backend
      }
    }

    function handleCreateLabel() {
      if (!newLabelName.value.trim()) return;

      const label = labelsStore.createLocalLabel(newLabelName.value.trim(), newLabelColor.value);
      labelsStore.addLabel(label);
      // TODO: Persist to backend

      newLabelName.value = "";
      newLabelColor.value = LABEL_COLORS[0];
      showCreateLabelDialog.value = false;
    }

    return {
      messages,
      messagesContainer,
      isStreaming,
      streamingContent,
      streamingMessage,
      showCreateLabelDialog,
      newLabelName,
      newLabelColor,
      labelColors: LABEL_COLORS,
      handleAddLabel,
      handleRemoveLabel,
      handleCreateLabel,
    };
  },
});
</script>

<style scoped>
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.streaming-message {
  opacity: 0.8;
}

.color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.color-option:hover {
  border-color: rgba(0, 0, 0, 0.2);
}

.color-option.selected {
  border-color: #000;
}
</style>
