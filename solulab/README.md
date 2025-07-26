# Solulab

[![npm version](https://badge.fury.io/js/solulab.svg)](https://badge.fury.io/js/solulab)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A solution laboratory for experimenting with different implementations and test cases.

## Quick Start

### Installation

```bash
# Using npm
npm install -g solulab

# Using bun
bun install -g solulab

# Using yarn
yarn global add solulab
```

### Usage

1. Create a lab file (e.g., `rag.lab.ts`):

```typescript
import { createSolutionLab } from 'solulab';
import { z } from 'zod';

export const lab__rag = createSolutionLab({
  name: 'RAG Implementation',
  description: 'Retrieval-Augmented Generation experiments',

  paramSchema: z.object({
    query: z.string(),
    maxResults: z.number().default(5),
  }),

  resultSchema: z.object({
    answer: z.string(),
    sources: z.array(z.string()),
    confidence: z.number(),
  }),

  versions: [
    {
      name: 'baseline',
      async execute({ query, maxResults }) {
        // Simple implementation
        return {
          answer: 'Paris is the capital of France',
          sources: ['Wikipedia'],
          confidence: 0.95,
        };
      },
    },
    {
      name: 'with embeddings',
      async execute({ query, maxResults }) {
        // Advanced implementation with embeddings
        return {
          answer: 'Paris, the capital of France since 987 AD',
          sources: ['Wikipedia', 'Britannica'],
          confidence: 0.98,
        };
      },
    },
  ],

  cases: [
    {
      name: 'simple question',
      arguments: { query: 'What is the capital of France?' },
    },
    {
      name: 'complex question',
      arguments: { query: 'Why did Rome fall?', maxResults: 10 },
    },
  ],
});
```

2. Run your labs:

```bash
solulab run
```

This will execute all versions against all test cases, creating a matrix of results.

3. View results in the web UI:

```bash
bun run dev
# Open http://localhost:5173
```

## Configuration

Create a `solulab.config.ts` file in your project root:

```typescript
export default {
  dbPath: '.solulab/solulab.json', // Database file location (using LowDB)
  labGlobs: ['**/*.lab.ts'], // Glob patterns for lab files
};
```

## Features

- **Multiple versions** per lab for A/B testing implementations
- **Test cases** defined once, run against all versions
- **Type-safe lab definitions** with Zod schemas
- **Automatic discovery** of lab files
- **Incremental execution** - skips already-run combinations
- **Persistent storage** for historical data (using LowDB)
- **Web UI** for viewing results and comparing runs
- **Side-by-side comparison** with diff viewing
- **Zero-config** developer experience

## Development

This is a unified package that includes:

- Core utilities (createSolutionLab, discoverLabs)
- CLI tool for running cases
- React-based web UI for visualization

### Setup

```bash
bun install
bun run build
```

### Running Tests

```bash
bun test
```

## License

MIT
