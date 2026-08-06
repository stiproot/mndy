<template>
  <div :class="['chat-message', message.role]">
    <div class="message-avatar">
      <q-avatar size="32px" :color="avatarColor" text-color="white">
        {{ avatarText }}
      </q-avatar>
    </div>
    <div class="message-content">
      <div class="message-header">
        <span class="message-role">{{ roleLabel }}</span>
        <span class="message-time">{{ formattedTime }}</span>
      </div>
      <div class="message-text" v-html="formattedContent"></div>
      <div v-if="message.labels && message.labels.length > 0" class="message-labels">
        <LabelChipComponent
          v-for="labelId in message.labels"
          :key="labelId"
          :labelId="labelId"
          size="sm"
          removable
          @remove="handleRemoveLabel(labelId)"
        />
      </div>
      <div v-if="showAddLabel" class="message-actions">
        <q-btn
          flat
          dense
          size="sm"
          icon="label"
          @click="showLabelMenu = true"
        >
          <q-menu v-model="showLabelMenu">
            <q-list dense style="min-width: 150px">
              <q-item
                v-for="label in availableLabels"
                :key="label.id"
                clickable
                v-close-popup
                @click="handleAddLabel(label.id)"
              >
                <q-item-section avatar>
                  <div
                    class="label-color-dot"
                    :style="{ backgroundColor: label.color }"
                  />
                </q-item-section>
                <q-item-section>{{ label.name }}</q-item-section>
              </q-item>
              <q-separator v-if="availableLabels.length > 0" />
              <q-item clickable v-close-popup @click="$emit('createLabel')">
                <q-item-section avatar>
                  <q-icon name="add" />
                </q-item-section>
                <q-item-section>Create new label</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { useLabelsStore } from "@/stores/labels.store";
import LabelChipComponent from "./LabelChipComponent.vue";

export default defineComponent({
  name: "ChatMessageComponent",
  components: { LabelChipComponent },
  props: {
    message: {
      type: Object,
      required: true,
    },
    showAddLabel: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["addLabel", "removeLabel", "createLabel"],
  setup(props, { emit }) {
    const labelsStore = useLabelsStore();
    const { labels } = storeToRefs(labelsStore);

    const showLabelMenu = ref(false);

    const avatarColor = computed(() => {
      return props.message.role === "user" ? "primary" : "secondary";
    });

    const avatarText = computed(() => {
      return props.message.role === "user" ? "U" : "A";
    });

    const roleLabel = computed(() => {
      return props.message.role === "user" ? "You" : "Assistant";
    });

    const formattedTime = computed(() => {
      const date = new Date(props.message.timestamp);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    });

    const formattedContent = computed(() => {
      // Basic markdown-like formatting
      let content = props.message.content;
      // Escape HTML
      content = content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      // Code blocks
      content = content.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
      // Inline code
      content = content.replace(/`([^`]+)`/g, "<code>$1</code>");
      // Bold
      content = content.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      // Italic
      content = content.replace(/\*([^*]+)\*/g, "<em>$1</em>");
      // Newlines
      content = content.replace(/\n/g, "<br>");
      return content;
    });

    const availableLabels = computed(() => {
      const messageLabels = props.message.labels || [];
      return labels.value.filter((l) => !messageLabels.includes(l.id));
    });

    function handleAddLabel(labelId) {
      emit("addLabel", { messageId: props.message.id, labelId });
    }

    function handleRemoveLabel(labelId) {
      emit("removeLabel", { messageId: props.message.id, labelId });
    }

    return {
      showLabelMenu,
      avatarColor,
      avatarText,
      roleLabel,
      formattedTime,
      formattedContent,
      availableLabels,
      handleAddLabel,
      handleRemoveLabel,
    };
  },
});
</script>

<style scoped>
.chat-message {
  display: flex;
  gap: 12px;
  padding: 16px;
  margin: 8px 0;
}

.chat-message.user {
  background: #f0f7ff;
  border-radius: 12px;
}

.chat-message.assistant {
  background: #f9f9f9;
  border-radius: 12px;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.message-role {
  font-weight: 600;
  font-size: 14px;
}

.message-time {
  font-size: 12px;
  color: #888;
}

.message-text {
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.message-text :deep(code) {
  background: #e8e8e8;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}

.message-text :deep(pre) {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
}

.message-text :deep(pre code) {
  background: transparent;
  padding: 0;
}

.message-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.message-actions {
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.chat-message:hover .message-actions {
  opacity: 1;
}

.label-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
</style>
