# mndy

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/)
[![Dapr](https://img.shields.io/badge/Dapr-1.15+-purple.svg)](https://dapr.io/)

## Overview

**mndy** (Project Metrics) is a comprehensive, data-driven project analytics platform designed for software development teams. It bridges the gap between Azure DevOps and project reporting platforms, enabling teams to make informed decisions through powerful metrics visualization and analysis.

The platform provides a centralized hub for collecting, analyzing, and visualizing project data, helping teams identify bottlenecks, track progress, and optimize resource allocation—all while promoting better team behaviors through data transparency.

## Features

- **Azure DevOps Integration** - Seamless connection to Azure DevOps for work item tracking and project data
- **Real-time Metrics Visualization** - Interactive dashboards built with D3.js and Quasar Framework
- **Behavioral Change Analytics** - Track and improve team behaviors through data-driven insights
- **Flexible Query System** - Custom queries to extract and analyze project data from multiple sources
- **Command-Based Data Processing** - Process, filter, aggregate, and transform data with composable commands
- **Microservices Architecture** - Scalable, distributed system using Dapr for orchestration
- **Multi-Team Support** - Manage metrics across multiple teams and projects
- **Historical Data Analysis** - Track trends over time for better forecasting and estimation

## Architecture

mndy is built on a modern cloud-native microservices architecture using Dapr (Distributed Application Runtime) for service communication, pub/sub messaging, and state management.

### Services

- **UI** (Vue 3 + TypeScript + Quasar) - Frontend application with D3.js visualizations
- **UI API** (Node.js + Express) - API gateway handling queries, commands, and authentication
- **AzDo Worker** (Python + FastAPI) - Azure DevOps data gathering service
- **AzDo Proxy Worker** (Python + FastAPI) - Proxy service for Azure DevOps API
- **Insights Worker** (Python + FastAPI) - Analytics and data processing service
- **Workflows Worker** (Python + FastAPI) - Workflow orchestration service

### Infrastructure

- **Dapr** - Service mesh for inter-service communication
- **MongoDB** - Primary database for state and metrics storage
- **RabbitMQ** - Message broker for pub/sub messaging
- **Docker** - Containerization for all services
- **Zipkin** - Distributed tracing

For detailed architecture diagrams, see [docs/architecture.html](docs/architecture.html).

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Dapr CLI 1.15+
- Azure DevOps Personal Access Token (PAT)
- Okta credentials (for authentication)
- Make (optional, for using Makefile commands)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/stiproot/mndy.git
   cd mndy
   ```

2. **Configure Azure DevOps credentials**

   Create `.env` files for each service based on the `.env.template` files:

   ```bash
   # Example for ui-api
   cp src/ui-api/.env.template src/ui-api/.env
   # Edit the file and add your credentials
   ```

   Required environment variables:
   - `AZDO_ORGANIZATION` - Your Azure DevOps organization name
   - `AZDO_PROJECT` - Your project name
   - `AZDO_API_KEY` or `AZDO_PAT` - Your Personal Access Token

3. **Configure Okta (optional)**

   If using Okta authentication, update the Okta environment variables in `src/ui-api/.env`:
   ```bash
   OKTA_ISSUER=https://your-okta-domain.okta.com/oauth2/default
   OKTA_CLIENT_ID=your-client-id
   OKTA_CLIENT_SECRET=your-client-secret
   ```

### Running

**Full stack with Docker Compose:**

```bash
# Standard architecture (x86)
make docker-compose

# ARM architecture (Apple Silicon)
make docker-compose-arm
```

This starts all services including:
- Dapr placement service
- MongoDB (with replica set)
- RabbitMQ
- Zipkin (tracing)
- All microservices with Dapr sidecars

**Development mode (individual services):**

```bash
# UI development server
make serve-ui

# UI API
make run-ui-api

# Individual workers
make run-azdo-worker
make run-azdoproxy-worker
make run-insights-worker
make run-workflows-worker
```

**Access the application:**
- UI: `http://localhost:8080` (or configured port)
- MongoDB Express: `http://localhost:8081`
- Zipkin: `http://localhost:9411`

## Configuration

### Azure DevOps Setup

1. Generate a Personal Access Token (PAT) in Azure DevOps with the following scopes:
   - Work Items (Read)
   - Project and Team (Read)

2. Configure environment variables in each service's `.env` file:
   ```bash
   AZDO_ORGANIZATION=your-organization
   AZDO_PROJECT=your-project
   AZDO_API_KEY=your-pat-token
   ```

### Okta OAuth Setup

For authentication using Okta:

1. Create an Okta application (Web Application, PKCE-enabled)
2. Configure redirect URIs
3. Update environment variables with Okta credentials

### Service Configuration

Each service has its own `.env.template` file:

- `src/ui-api/.env.template` - UI API configuration
- `src/azdo-worker/.env.template` - Azure DevOps worker
- `src/azdoproxy-worker/.env.template` - AzDo proxy worker
- `src/insights-worker/.env.template` - Insights worker
- `src/workflows-worker/.env.template` - Workflows worker

Copy each template to `.env` and configure with your credentials.

## Project Structure

```
mndy/
├── src/
│   ├── ui/                      # Vue 3 frontend (Quasar + D3.js)
│   ├── ui-api/                  # Express.js API gateway
│   ├── mndy-framework/          # Shared Python framework
│   ├── azdo-worker/             # Azure DevOps data gathering
│   ├── azdoproxy-worker/        # Azure DevOps proxy
│   ├── insights-worker/         # Analytics processing
│   ├── workflows-worker/        # Workflow orchestration
│   └── dapr/                    # Dapr configuration
│       ├── components/          # Pub/sub & state components
│       └── configuration/       # Dapr runtime config
├── docs/                        # Documentation
│   ├── architecture.html        # Architecture diagram
│   └── raw.md                   # Project vision & concepts
├── test/                        # Test harness
├── tools/                       # Utility scripts
├── Makefile                     # Build and run commands
├── docker-compose.yml           # Main compose file
└── README.md                    # This file
```

## Development

### Running Individual Services

**Frontend Development:**

```bash
cd src/ui
npm install
npm run dev
```

**UI API Development:**

```bash
cd src/ui-api
npm install
npm run dev
```

**Python Workers:**

1. Create virtual environment:
   ```bash
   python3.12 -m venv .venv
   source .venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run with Dapr:
   ```bash
   # Example for azdo-worker
   dapr run --app-id azdo-worker \
     --app-port 5001 \
     --dapr-http-port 3500 \
     --resources-path ../dapr/components \
     --config ../dapr/configuration/config.yaml \
     -- python src/main.py
   ```

### Building Services

```bash
# Build UI
make build-ui

# Build UI API
make build-ui-api

# Build Docker images
docker-compose build
```

### Adding New Features

1. Implement feature in appropriate service
2. Update relevant tests
3. Update documentation
4. Submit pull request

## Core Concepts

### Queries

Queries extract data from structured sources like Azure DevOps APIs or databases. They can be customized to suit specific project needs and run against multiple data sources.

### Commands

Commands process and structure data extracted by queries. They perform operations like filtering, sorting, aggregating, and transforming data to derive insights.

### Data Visualization

Built with D3.js, the visualization tools provide charts, graphs, and interactive dashboards that help teams identify trends, patterns, and relationships in project data.

### Behavioral Change

mndy promotes positive team behaviors by:
- **Transparency** - Making metrics visible to all team members
- **Accountability** - Tracking time management and work item progress
- **Data-Driven Decisions** - Replacing guesswork with factual insights
- **Continuous Improvement** - Identifying areas for process optimization

## Documentation

- [Architecture Overview](docs/architecture.html) - System architecture and component interactions
- [Project Vision & Concepts](docs/raw.md) - Detailed vision, benefits, and core concepts
- [Makefile Commands](Makefile) - All available build and run commands

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- Code follows existing style conventions
- All tests pass
- Documentation is updated
- Commit messages are descriptive

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Contact

- **Issues**: [GitHub Issues](https://github.com/stiproot/mndy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/stiproot/mndy/discussions)
- **Author**: Simon Stipcich - [code.stip.si@gmail.com](mailto:code.stip.si@gmail.com)

---

**Built with:**
Vue 3 • TypeScript • Python • FastAPI • Dapr • MongoDB • RabbitMQ • Docker • D3.js • Quasar Framework
