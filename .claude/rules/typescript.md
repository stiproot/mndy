---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "src/**/*.vue"
---

# TypeScript Conventions

- ES modules (import/export), not CommonJS
- Destructure imports when possible
- Linting: prettier + eslint (see package.json)
- Run `bun run lint` before committing (bun is the only package manager here)
