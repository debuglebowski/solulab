# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Solulab is a TypeScript-based solution laboratory framework for systematically testing and comparing multiple implementations of the same functionality. It consists of:
- `solulab/` - Main framework library with CLI and web UI
- `solulab-demo/` - Demo project showcasing usage

## Essential Commands

### Development
```bash
# Install all dependencies (monorepo)
bun run install:all

# Start UI development server
bun run dev

# Run tests with type checking
bun run test

# Type check only
bun run typecheck

# Lint and format check
bun run check

# Fix linting and formatting issues
bun run check:fix

# Build library and UI
bun run build
```

### Demo Project
```bash
# Run labs in demo
bun run demo:run

# Reset demo database
bun run demo:reset
```

### Running Individual Tests
```bash
# In solulab directory
bun test path/to/test.test.ts
bun run test:watch
bun run test:e2e
```

## Critical Patterns and Conventions

### Module Organization
Every multi-file module follows this pattern:
- `index.ts` - Main exports and facade
- `index.types.ts` - Type definitions
- `index.operations.ts` - Business logic
- Feature folders for complex functionality

### Lab Export Naming
**CRITICAL**: Lab exports MUST start with `lab__` prefix in snake_case:
```typescript
export const lab__cpu_usage = createSolutionLab({...})  // ✓ Correct
export const labCpuUsage = createSolutionLab({...})     // ✗ Wrong
export const cpu_usage = createSolutionLab({...})       // ✗ Wrong
```

### Database Pattern
The database uses lazy initialization:
```typescript
// Always ensure initialization before operations
await database.ensureInitialized();
```

### File Naming Conventions
- Lab files: `*.lab.ts` or `*.lab.js`
- Module files: `index.ts` for main exports
- Type files: `index.types.ts`
- Operation files: `index.operations.ts`

### Code Style
- 4-space indentation (enforced by Biome)
- Single quotes for strings
- Semicolons required
- 100-character line limit
- Blank lines required between certain statements (ESLint)

### Path Aliases
Use `@/` for imports from src:
```typescript
import { database } from '@/core/database';
```

## Architecture Overview

### Core Structure
```
solulab/src/
├── core/
│   ├── database/      # SQLite persistence layer
│   ├── labs/          # Lab creation and discovery
│   ├── types/         # Shared type definitions
│   └── utils/         # Utility functions
├── app/               # React web UI
│   ├── components/    # UI components
│   ├── pages/         # Application pages
│   └── lib/api/       # API client
└── cli/              # Command-line interface
    ├── config/        # Configuration handling
    └── runner/        # Lab execution logic
```

### Key Technologies
- Runtime: Bun (modern JavaScript runtime)
- Language: TypeScript with strict mode
- UI: React + Vite + Tailwind CSS
- Database: SQLite via LowDB
- Schema validation: Zod
- Testing: Vitest (E2E) + Bun test (unit)
- Linting: Biome + ESLint
- Building: tsup (lib) + Vite (UI)

## Common Development Tasks

### Adding a New Lab
1. Create a file ending with `.lab.ts`
2. Export lab with `lab__` prefix
3. Use `createSolutionLab` factory
4. Define param and result schemas with Zod
5. Implement versions and test cases

### Running Specific Labs
```bash
cd solulab-demo
bun run solulab run --lab="lab_name"
```

### Debugging Database Issues
The database is stored at `.solulab/solulab.db`. To reset:
```bash
rm -rf .solulab/
```

## Important Notes

- The project uses ES modules throughout
- All database operations are async
- Lab result schemas must be objects (not primitives)
- The UI automatically uses demo database in dev mode
- Type checking is strict - no implicit any allowed
- Always run `check:fix` before committing changes