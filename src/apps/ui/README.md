# mndy UI

Vue 3 + Quasar frontend application for project analytics and Azure DevOps integration.

## Features

- **Project Management**: Create, edit, and visualize project structures
- **Interactive Visualizations**: D3.js charts, treemaps, and expandable trees
- **Azure DevOps Integration**: WIQL queries, work item management, dashboard creation
- **Process Monitoring**: Real-time status tracking for long-running operations
- **Authentication**: Okta OAuth 2.0 with optional development bypass
- **Code Editing**: Built-in CodeMirror editor for configuration files

## Quick Start

### Prerequisites

- Node.js 18+
- Bun package manager
- Running ui-api backend service

### Installation

From the repository root:

```bash
make install-node
```

Or directly:

```bash
cd src/ui
bun install
```

### Running

**Development Server:**

```bash
make serve-ui
```

Or:

```bash
cd src/ui
bun run serve
```

Access at `http://localhost:8080`

## Configuration

### Runtime Configuration

Edit `public/envconfig.js` for runtime environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `VUE_APP_UI_API_BASE_URL` | Backend API endpoint | `http://localhost:3002/ui-api` |
| `VUE_APP_OKTA_CLIENT_ID` | Okta OAuth client ID | - |
| `VUE_APP_OKTA_ISSUER` | Okta authorization server URL | - |
| `VUE_APP_IGNORE_AUTH` | **DEV ONLY**: Bypass Okta, use fingerprint | `false` |

### Development Authentication Bypass

Set `VUE_APP_IGNORE_AUTH=true` to bypass Okta OAuth and use browser fingerprint-based authentication:

```javascript
// In public/envconfig.js
window.envconfig = {
  "VUE_APP_UI_API_BASE_URL": "http://localhost:3002/ui-api",
  "VUE_APP_IGNORE_AUTH": "true"  // Enable dev mode
}
```

**WARNING**: This should **NEVER** be used in production. It is designed for local development only.

When enabled:
- Login uses browser fingerprint instead of Okta redirect
- No Okta configuration required
- Login page shows Development Mode badge
- Backend must also set `IGNORE_AUTH=true`

## Architecture

```
src/ui/
├── public/
│   ├── index.html           # HTML template
│   └── envconfig.js         # Runtime configuration
├── src/
│   ├── main.ts              # Vue app entry point
│   ├── App.vue              # Root component with service injection
│   ├── router/
│   │   └── index.ts         # Route definitions and auth guards
│   ├── views/               # Page components
│   ├── components/          # Reusable UI components
│   ├── services/            # Business logic and API clients
│   ├── stores/              # Pinia state management
│   ├── types/               # TypeScript interfaces
│   └── assets/              # Images, SVGs, styles
├── package.json             # Dependencies
├── vue.config.js            # Vue CLI configuration
└── tsconfig.json            # TypeScript configuration
```

## Development

### Build

Production build:

```bash
make build-ui
```

Or:

```bash
cd src/ui
bun run build
```

Output: `dist/` directory with optimized bundles

### Lint

```bash
make lint-node
```

Or:

```bash
cd src/ui
bun run lint
```

## Troubleshooting

### CORS Errors

**Symptom**: Browser console shows CORS policy errors

**Solution**:
- Verify `VUE_APP_UI_API_BASE_URL` matches actual backend URL
- Ensure ui-api has CORS enabled (it does by default)
- Check backend is running and accessible

### Okta Authentication Fails

**Symptom**: Redirect to Okta fails or returns error

**Solution**:
- Verify `VUE_APP_OKTA_CLIENT_ID` and `VUE_APP_OKTA_ISSUER` match Okta app configuration
- Check Okta redirect URI includes `http://localhost:8080/authorization-code/callback`
- Ensure backend has matching Okta configuration
- Use `VUE_APP_IGNORE_AUTH=true` for local development bypass

### API Connection Errors

**Symptom**: Failed to fetch data from backend

**Solution**:
- Verify ui-api is running (`make run-ui-api`)
- Check `VUE_APP_UI_API_BASE_URL` in `envconfig.js`
- Inspect Network tab in browser DevTools for actual error
- Verify authentication token exists in LocalStorage

### Development Auth Not Working

**Symptom**: Still redirecting to Okta with `VUE_APP_IGNORE_AUTH=true`

**Solution**:
- Verify `envconfig.js` has the setting (not a .env file)
- Hard refresh browser to clear cache
- Check backend also has `IGNORE_AUTH=true` in `.env`
- Look for auth mode messages in browser console
- Login page should show Development Mode badge

## Key Dependencies

- **Vue 3** (3.2.13) - Progressive JavaScript framework
- **Quasar** (2.12.7) - Material Design component framework
- **Pinia** (2.1.6) - State management
- **Vue Router** (4.0.3) - Client-side routing
- **Axios** (1.7.2) - HTTP client
- **@okta/okta-auth-js** (7.7.0) - Okta authentication SDK
- **@fingerprintjs/fingerprintjs** (5.1.0) - Browser fingerprinting
- **D3.js** (7.8.5) - Data visualizations
- **CodeMirror** (6.0.1) - Code editor
- **TypeScript** (5.5.2) - Type safety
