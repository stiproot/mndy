# =============================================================================
# azdo-worker Dockerfile
# Uses uv workspace for dependency management
# Build context: repo root (../)
# =============================================================================

FROM python:3.12-slim AS builder

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy workspace configuration files
COPY pyproject.toml uv.lock ./

# Copy the shared framework (workspace dependency)
COPY src/mndy-framework/ ./src/mndy-framework/

# Copy this worker's source
COPY src/azdo-worker/ ./src/azdo-worker/

# Install dependencies using uv workspace
# --frozen: use exact versions from uv.lock
# --no-editable: install in non-editable mode for production
# --no-dev: skip dev dependencies
RUN uv sync --frozen --no-editable --no-dev --package azdo-worker

# -----------------------------------------------------------------------------
# Production stage
# -----------------------------------------------------------------------------
FROM python:3.12-slim AS final

WORKDIR /app

# Copy the virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy the worker source (needed for uvicorn to find main:app)
COPY src/azdo-worker/src/ ./

# Set PATH to use the virtual environment
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "3"]

# =============================================================================
# LEGACY APPROACH (kept for reference)
# This approach required manually building and copying the framework tarball.
# The uv workspace approach above is preferred as it handles dependencies
# automatically and ensures consistent versions across the workspace.
# =============================================================================
# FROM python:3.12-slim AS requirements
#   WORKDIR /app
#   COPY requirements.txt .
#   RUN pip install -r requirements.txt
#
# FROM requirements AS local-requirements
#   COPY ./pkg/mndy_framework-0.1.0.tar.gz /app/
#   RUN tar -xvf /app/*.tar.gz -C /app/. && \
#     pip install /app/mndy_framework-0.1.0/.
#
# FROM local-requirements AS build
#   COPY src/ .
#
# FROM build AS final
#   EXPOSE 8001
#   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "3"]
