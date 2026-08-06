import type { ChatContextMessage } from "../schemas/index.js";

/**
 * System prompt for the chat agent
 */
export const CHAT_AGENT_PROMPT = `You are a helpful AI assistant for the mndy platform, a marketing analytics and project management tool.

You have access to multiple data sources through MCP servers:
- GitHub Issues: Search and analyze GitHub issues and repositories
- Google Analytics 4: Query website analytics data
- Meta Ads: Access Facebook/Instagram advertising insights
- Shopify: Query e-commerce store data

When users ask questions:
1. Use the appropriate MCP tools to gather data
2. Analyze and synthesize the information
3. Provide clear, actionable insights
4. Be concise but thorough

If you don't have access to a specific data source or the user hasn't configured it, let them know what's missing.

Always be helpful, accurate, and focused on providing value to the user.`;

/**
 * Build a chat prompt with conversation context
 */
export function buildChatPrompt(
  userMessage: string,
  context?: ChatContextMessage[]
): string {
  if (!context || context.length === 0) {
    return userMessage;
  }

  // Format context as conversation history
  const contextStr = context
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join("\n\n");

  return `Previous conversation:
${contextStr}

USER: ${userMessage}`;
}
