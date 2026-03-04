# mndy UI API Gateway

Express.js API gateway providing backend services for the mndy frontend application.

## Features

- **Authentication**: Okta OAuth 2.0 integration with optional development bypass
- **Dapr Integration**: State management and pub/sub messaging via Dapr sidecar
- **Azure DevOps Proxy**: Direct access to Azure DevOps REST API endpoints
- **Query Services**: Project data, processes, structures, and work units
- **Command Services**: Workflow execution, project persistence, and updates

## Quick Start

### Prerequisites

- Node.js 18+ and Bun
- Dapr CLI installed and initialized
- Azure DevOps Personal Access Token (PAT)
- Okta application credentials (optional for dev mode)

### Installation

From the repository root:

```bash
make install-node
```

Or directly:

```bash
cd src/ui-api
bun install
```

### Running

**With Dapr (Recommended):**

```bash
make run-ui-api
```

This starts the service on port 3001 with Dapr sidecar on port 3500.

**Standalone (Development):**

```bash
cd src/ui-api
bun run dev
```

## Configuration

Create a `.env` file based on `.env.template`:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `DAPR_HTTP_PORT` | Dapr sidecar HTTP port | `3500` |
| `OKTA_ISSUER` | Okta authorization server URL | - |
| `OKTA_TOKEN_URI` | Okta token endpoint | - |
| `OKTA_CLIENT_ID` | Okta OAuth client ID | - |
| `OKTA_CLIENT_SECRET` | Okta OAuth client secret | - |
| `REDIRECT_BASE_URL` | Frontend base URL for OAuth callback | - |
| `IGNORE_AUTH` | **DEV ONLY**: Bypass Okta, use fingerprint | `false` |
| `AZDO_API_KEY` | Azure DevOps Personal Access Token | - |
| `AZDO_ORGANIZATION` | Azure DevOps organization name | - |
| `AZDO_PROJECT` | Azure DevOps project name | - |

### Development Authentication Bypass

Set `IGNORE_AUTH=true` to bypass Okta OAuth and use browser fingerprint-based authentication:

```bash
# In .env file
IGNORE_AUTH=true
```

**WARNING**: This should **NEVER** be used in production. It's designed for local development only.

When enabled:
- Authentication uses browser fingerprints instead of Okta tokens
- No Okta configuration required
- Logs show `[DEV AUTH]` prefix
- Frontend must also set `VUE_APP_IGNORE_AUTH=true`

## API Reference

### Authentication Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/ui-api/cmd/auth/token/exchange` | POST | No | Exchange authorization code for tokens (Okta) |
| `/ui-api/cmd/auth/token/refresh` | POST | No | Refresh expired access token (Okta) |
| `/ui-api/cmd/auth/dev` | POST | No | Development fingerprint authentication |

### Command Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/ui-api/cmd/data/workflows` | POST | Yes | Execute workflow commands |
| `/ui-api/cmd/data/persist/proj` | POST | Yes | Persist new project data |
| `/ui-api/cmd/data/update/proj` | PATCH | Yes | Update existing project |
| `/ui-api/cmd/azdo/proxy` | POST | Yes | Proxy commands to Azure DevOps |

### Query Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/ui-api/qry/data/procs` | POST | Yes | Get user processes |
| `/ui-api/qry/data/projs` | POST | Yes | Get all projects |
| `/ui-api/qry/data/proj` | POST | Yes | Get single project |
| `/ui-api/qry/data/struct` | POST | Yes | Get structure data |
| `/ui-api/qry/data/units` | POST | Yes | Get work units |

### Azure DevOps Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/ui-api/ext/qry/data/wiql` | POST | Yes | Run WIQL query |
| `/ui-api/ext/qry/data/wi/details` | POST | Yes | Get work item details |
| `/ui-api/ext/qry/data/teams` | POST | Yes | List teams |
| `/ui-api/ext/qry/data/team/iterations` | POST | Yes | Get team iterations |
| `/ui-api/ext/qry/data/team/settings` | POST | Yes | Get team settings |
| `/ui-api/ext/qry/data/team/fieldvalues` | POST | Yes | Get team field values |

### Health Check

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/healthz` | GET | No | Service health check |

## Architecture

```
src/ui-api/
├── src/
│   ├── index.ts                    # Express app & route definitions
│   └── controllers/
│       ├── cmds/                   # Command handlers
│       │   ├── auth.cmds.ts        # Okta token exchange/refresh
│       │   ├── auth.token.ts       # JWT validation middleware
│       │   ├── auth.data.ts        # Auth configuration
│       │   ├── dev-auth.service.ts # Dev fingerprint auth
│       │   ├── cmds.ts             # Workflow/proxy commands
│       │   └── projs.cmds.ts       # Project commands
│       ├── qrys.ts                 # Query handlers
│       ├── azdo.qrys.ts            # Azure DevOps queries
│       ├── azdo.http-client.ts     # Azure DevOps API client
│       ├── state-manager.ts        # Dapr state operations
│       ├── pubsub-manager.ts       # Dapr pub/sub operations
│       ├── http-client.ts          # Generic HTTP client
│       ├── types.ts                # TypeScript interfaces
│       └── consts.ts               # Constants & enums
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── .env.template                   # Environment template
└── .env                            # Local environment (git ignored)
```

### Key Patterns

- **Middleware Chain**: `express.json()` → `validateToken()` → handler
- **State Storage**: Uses Dapr state stores (`statestore-usrs`, `statestore-projs`, etc.)
- **Pub/Sub**: Publishes commands to worker services via Dapr topics
- **Azure DevOps**: Direct REST API calls with PAT authentication

## Development

### Build

```bash
make build-ui-api
```

Or:

```bash
cd src/ui-api
bun run build
```

Output: `dist/` directory with compiled JavaScript

### Lint

```bash
make lint-node
```

Or:

```bash
cd src/ui-api
bun run lint
```

### TypeScript

```bash
bun run tsc --noEmit
```

## Troubleshooting

### Dapr Connection Errors

**Symptom**: `ECONNREFUSED` errors when calling Dapr

**Solution**:
- Verify Dapr is running: `dapr list`
- Check `DAPR_HTTP_PORT` matches sidecar configuration (default: 3500)
- Restart with: `make run-ui-api`

### Okta Token Validation Failures

**Symptom**: 403 Forbidden on authenticated endpoints

**Solution**:
- Verify `OKTA_ISSUER` and `OKTA_CLIENT_ID` match frontend configuration
- Check token audience is `api://default`
- Ensure frontend is sending `Authorization: Bearer <token>` header
- Use `IGNORE_AUTH=true` for local development bypass

### State Store Not Found

**Symptom**: Dapr errors about missing state stores

**Solution**:
- Check Dapr components are configured in `~/.dapr/components/`
- Verify state store names match constants in `consts.ts`
- Run `dapr init` to reset Dapr components

### Azure DevOps API Errors

**Symptom**: 401 Unauthorized from Azure DevOps endpoints

**Solution**:
- Verify `AZDO_API_KEY` is a valid Personal Access Token
- Check PAT has required scopes (Work Items: Read, Teams: Read)
- Ensure `AZDO_ORGANIZATION` and `AZDO_PROJECT` are correct

### Development Auth Not Working

**Symptom**: Still getting Okta validation errors with `IGNORE_AUTH=true`

**Solution**:
- Verify `.env` file has `IGNORE_AUTH=true` (not `false` or commented)
- Restart the server after changing environment variables
- Check frontend also has `VUE_APP_IGNORE_AUTH=true` in `envconfig.js`
- Look for `[DEV AUTH]` log messages to confirm bypass is active
