# mndy-vis

Platform-agnostic visualization module using D3.js and Vue 3.

## Overview

This module contains D3.js-based chart components exposed via Webpack Module Federation. It can be consumed by multiple host applications (mndy-ui, future UIs, etc.) and supports multiple data platforms (Azure DevOps, GitHub Issues, etc.) through adapters.

## Architecture

- **Federated Module**: Exposes chart components via Module Federation
- **Platform Agnostic**: Uses generic `IWorkItem` interface
- **Adapters**: Transform platform-specific data to generic format

## Development

```bash
# Install dependencies
bun install

# Run standalone dev server (port 8082)
bun run serve

# Build for production
bun run build

# Lint
bun run lint
```

## Usage

### Standalone

Visit http://localhost:8082 to see the chart gallery/demo.

### As Federated Module

```typescript
// In host application
import { defineAsyncComponent } from 'vue';

const ChartComponent = defineAsyncComponent(
  () => import('mndyVis/ChartComponent')
);
```

## Exposed Modules

- `./ChartComponent` - Main chart component
- `./NestedTreeMap` - Grid/treemap visualization
- `./FilterControls` - Chart filtering UI
- `./Adapters` - Platform adapters (AzDo, GitHub)

## Chart Types

- Tidy Tree
- Packed Circle
- Sunburst / Zoomable Sunburst
- Force Directed Tree
- Bubble Chart
- Radial Cluster
- Nested Treemap
- Expandable Tree (Treeviz)
- MLDLC / SDLC (custom)

## Adapters

### AzDoAdapter

Transforms Azure DevOps work items to `IWorkItem`:

```typescript
import { AzDoAdapter } from 'mndyVis/Adapters';

const workItems = azDoUnits.map(unit => AzDoAdapter.toWorkItem(unit));
```

### GitHubAdapter

(Placeholder for GitHub Issues integration)

## Data Model

Charts consume `IWorkItem[]` - a generic interface supporting:
- Hierarchical relationships (parent/children)
- RAG status (red/amber/green)
- Risk metrics
- Platform-agnostic fields
- Custom fields passthrough
