# MCP TypeScript SDK Reference

> Protocol Revision: 2025-06-18 | SDK: `@modelcontextprotocol/sdk` v1.x

## Overview

The Model Context Protocol (MCP) standardizes how applications provide context for LLMs. Think of it like USB-C for AI — a standardized way to connect AI models to data sources and tools.

```bash
npm install @modelcontextprotocol/sdk zod
```

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
```

## Architecture

### Participants

| Participant | Role |
|-------------|------|
| **Host** | Application users interact with (e.g., Claude.ai, IDE). Manages UX and coordinates clients. |
| **Client** | Protocol component within host. Handles 1:1 communication with a server. |
| **Server** | Exposes capabilities (tools, resources, prompts) through standardized interfaces. |

### Server Primitives

| Primitive | Description | Controlled By |
|-----------|-------------|---------------|
| **Tools** | Functions the LLM can call (search, send message, create event) | Model |
| **Resources** | Passive read-only data (documents, databases, calendars) | Application |
| **Prompts** | Pre-built instruction templates ("Plan vacation", "Summarize") | User |

### Client Features

| Feature | Description |
|---------|-------------|
| **Elicitation** | Servers request information from users during interactions |
| **Roots** | Clients specify filesystem directories servers should focus on |
| **Sampling** | Servers request LLM completions through the client |

## Lifecycle

### Initialization

```
Client                     Server
  │                          │
  │── initialize ───────────►│
  │◄── init response ────────│
  │── notifications/initialized ─►│
  │                          │
  │     (operation)          │
```

Client sends `initialize` with protocol version and capabilities. Server responds with its capabilities. Client confirms with `initialized` notification.

### Capability Negotiation

**Client capabilities:** `roots`, `sampling`, `elicitation`
**Server capabilities:** `tools`, `resources`, `prompts`, `logging`, `completions`

Sub-capabilities: `listChanged` (list change notifications), `subscribe` (resource subscriptions)

### Shutdown

- **stdio**: Close input stream, wait for exit, SIGTERM, then SIGKILL
- **HTTP**: Close HTTP connection(s)

## Transports

### stdio

- Server runs as subprocess, reads from stdin, writes to stdout
- Messages delimited by newlines, no embedded newlines allowed
- Server MAY write to stderr for logging, MUST NOT write non-MCP messages to stdout
- **Best for:** local, process-spawned integrations

### Streamable HTTP (Recommended)

Server provides a single endpoint supporting POST and GET:

- **POST**: Client sends JSON-RPC messages. Server returns `application/json` or `text/event-stream` (SSE)
- **GET**: Client opens SSE stream for server-initiated notifications

**Session management:**

- Server assigns `Mcp-Session-Id` header in initialization response
- Client includes this header on all subsequent requests
- Server returns 404 for expired sessions

**Security requirements:**

1. Validate `Origin` header on all connections (DNS rebinding protection)
2. Bind to `localhost` (127.0.0.1) when running locally
3. Implement proper authentication

## Tools

Tools let LLMs call server functions. Model-controlled — LLM decides when to invoke.

### Protocol Messages

| Method | Purpose |
|--------|---------|
| `tools/list` | Discover available tools (paginated) |
| `tools/call` | Execute a tool |
| `notifications/tools/list_changed` | Tools changed notification |

### Tool Definition

```typescript
{
  name: 'get_weather',           // unique identifier
  title: 'Weather Lookup',       // display name
  description: 'Get current weather',
  inputSchema: { /* JSON Schema */ },
  outputSchema: { /* optional */ }
}
```

### Result Content Types

| Type | Description |
|------|-------------|
| `text` | Plain text |
| `image` | Base64 image with mimeType |
| `audio` | Base64 audio with mimeType |
| `resource` | Embedded resource |

### Error Handling

- **Protocol errors**: JSON-RPC error response (unknown tool, invalid args)
- **Execution errors**: Return `isError: true` in result (API failures, business logic)

```typescript
return {
  content: [{ type: 'text', text: `Error: ${err.message}` }],
  isError: true
};
```

## Resources

Resources provide read-only data access. Application-controlled — host decides how to present.

### Protocol Messages

| Method | Purpose |
|--------|---------|
| `resources/list` | List available resources (paginated) |
| `resources/templates/list` | List URI templates |
| `resources/read` | Retrieve resource contents |
| `resources/subscribe` | Subscribe to changes |
| `notifications/resources/updated` | Resource changed notification |

### Resource Definition

```typescript
{
  uri: 'file:///project/src/main.rs',
  name: 'main.rs',
  title: 'Main Source',
  mimeType: 'text/x-rust',
  description: 'Application entry point'
}
```

### URI Templates (RFC 6570)

```typescript
{
  uriTemplate: 'users://{userId}/profile',
  name: 'User Profile',
  mimeType: 'application/json'
}
```

### Common URI Schemes

| Scheme | Usage |
|--------|-------|
| `https://` | Web resources |
| `file://` | Filesystem-like resources |
| `git://` | Version control |
| Custom | Must conform to RFC 3986 |

## Prompts

Pre-built instruction templates. User-controlled — explicit invocation required.

### Protocol Messages

| Method | Purpose |
|--------|---------|
| `prompts/list` | Discover available prompts |
| `prompts/get` | Retrieve prompt with arguments |

### Prompt Definition

```typescript
{
  name: 'code-review',
  title: 'Code Review',
  description: 'Review code for best practices',
  arguments: [
    { name: 'code', type: 'string', required: true }
  ]
}
```

## Client Features

### Elicitation

Servers request user input during interactions:

```typescript
// Server sends elicitation/requestInput
{
  message: 'Confirm booking details:',
  schema: {
    type: 'object',
    properties: {
      confirmBooking: { type: 'boolean' },
      seatPreference: { type: 'string', enum: ['window', 'aisle'] }
    }
  }
}
```

**Privacy:** NEVER request passwords or API keys.

### Roots

Filesystem boundaries for server operations. Coordination mechanism, not security boundary.

```typescript
{ uri: 'file:///project', name: 'Project Root' }
```

### Sampling

Servers request LLM completions through the client:

```typescript
// Server sends sampling/createMessage
{
  messages: [{ role: 'user', content: 'Analyze these options...' }],
  systemPrompt: 'You are a travel expert',
  maxTokens: 1500
}
```

Human-in-the-loop: Users review both requests and responses.

## TypeScript SDK

### Quick Start — Streamable HTTP

```typescript
import crypto from 'crypto';
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const app = express();
app.use(express.json());

const sessions = new Map<string, { server: McpServer; transport: StreamableHTTPServerTransport }>();

function createServer(): McpServer {
  const server = new McpServer({ name: 'my-server', version: '1.0.0' });
  // Register tools, resources, prompts...
  return server;
}

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let session = sessionId ? sessions.get(sessionId) : undefined;

  if (!session) {
    const id = crypto.randomUUID();
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => id });
    await server.connect(transport);
    session = { server, transport };
    sessions.set(id, session);
  }

  await session.transport.handleRequest(req, res);
});

app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string;
  const session = sessionId ? sessions.get(sessionId) : undefined;
  if (session) await session.transport.handleRequest(req, res);
  else res.status(400).send('No session');
});

app.listen(3000);
```

### Quick Start — stdio

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({ name: 'my-server', version: '1.0.0' });
// Register tools, resources, prompts...

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Registering Tools

```typescript
import { z } from 'zod';

server.registerTool(
  'calculate-bmi',
  {
    title: 'BMI Calculator',
    description: 'Calculate Body Mass Index',
    inputSchema: { weightKg: z.number(), heightM: z.number() },
    outputSchema: { bmi: z.number() }
  },
  async ({ weightKg, heightM }) => {
    const bmi = weightKg / (heightM * heightM);
    return {
      content: [{ type: 'text', text: JSON.stringify({ bmi }) }],
      structuredContent: { bmi }
    };
  }
);
```

### Registering Resources

```typescript
server.registerResource(
  'config',
  'config://app',
  { title: 'App Config', mimeType: 'application/json' },
  async (uri) => ({
    contents: [{ uri: uri.href, text: JSON.stringify({ key: 'value' }) }]
  })
);

// Resource template
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

server.registerResource(
  'user-profile',
  new ResourceTemplate('users://{userId}/profile', { list: undefined }),
  { title: 'User Profile', mimeType: 'application/json' },
  async (uri, { userId }) => ({
    contents: [{ uri: uri.href, text: JSON.stringify(await getUser(userId)) }]
  })
);
```

### Registering Prompts

```typescript
server.registerPrompt(
  'review-code',
  {
    title: 'Code Review',
    description: 'Review code for best practices',
    argsSchema: { code: z.string() }
  },
  ({ code }) => ({
    messages: [{
      role: 'user',
      content: { type: 'text', text: `Review this code:\n\n${code}` }
    }]
  })
);
```

### Logging

```typescript
await server.sendLoggingMessage(
  { level: 'info', data: 'Processing request' },
  sessionId
);
```

Levels: `debug`, `info`, `notice`, `warning`, `error`, `critical`, `alert`, `emergency`

### DNS Rebinding Protection

```typescript
import { hostHeaderValidation } from '@modelcontextprotocol/sdk/server/middleware/hostHeaderValidation.js';

app.use(hostHeaderValidation(['localhost', '127.0.0.1']));
```

## Security & Best Practices

### Input Validation

- Validate ALL tool inputs with JSON Schema/Zod
- Sanitize and escape output content
- Never trust client-provided data

### Access Controls

- Implement per-tool permission levels
- Rate limit tool calls
- Log all tool usage for audit

### Transport Security

- Always use HTTPS for remote deployments
- Validate `Origin` header (HTTP transports)
- Bind to `localhost` when running locally

### Error Handling

| Code | Meaning |
|------|---------|
| `-32700` | Parse error |
| `-32600` | Invalid request |
| `-32601` | Method not found |
| `-32602` | Invalid params |
| `-32603` | Internal error |
| `-32002` | Resource not found |

### Production Checklist

- [ ] All tool inputs validated
- [ ] Origin header validation enabled
- [ ] Rate limiting implemented
- [ ] Structured logging enabled
- [ ] Session management configured
- [ ] Health check endpoint available
- [ ] Graceful shutdown handling
- [ ] Timeout policies configured

## SDK Classes

| Class | Import | Use Case |
|-------|--------|----------|
| `McpServer` | `server/mcp.js` | High-level, fast prototyping |
| `Server` | `server/index.js` | Low-level, full protocol control |

Use `Server` for production when you need fine-grained control over request handlers.

## Key Imports Reference

```typescript
// Server classes
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// Transports
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Express integration
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { hostHeaderValidation } from '@modelcontextprotocol/sdk/server/middleware/hostHeaderValidation.js';

// Completions
import { completable } from '@modelcontextprotocol/sdk/server/completable.js';

// Protocol types
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
```
