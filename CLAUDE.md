# 🚨 CRITICAL RULES - ALWAYS FOLLOW

1. **ALWAYS run before marking complete**: `bun run typecheck` AND `bun run check`
2. **ZERO tolerance**: Fix ALL TypeScript and lint errors
3. **Folder naming**: Must match export EXACTLY (case-sensitive)
   - `DiffViewer/` exports `DiffViewer`
   - `createSolutionLab/` exports `createSolutionLab`
   - `database/` exports `database` object
4. **NEVER create files unless absolutely necessary** - prefer editing existing files
5. **NEVER create documentation files** unless explicitly requested

# 📁 PROJECT CONTEXT

**Solulab** - Framework for testing multiple solution implementations against test cases.
- Labs contain versions (implementations) and cases (test inputs)
- Results stored in SQLite database
- UI for visualizing results

# 📐 ARCHITECTURE PATTERNS

## Folder Naming Rule
Folders that export ONE main thing must be named EXACTLY as their export (case-sensitive).

## index.*.ts Pattern
Multi-file modules use sibling files:
```
database/
├── index.ts                # Public API exports
├── index.operations.ts     # Internal implementation
├── index.init.ts          # Internal initialization
└── index.types.ts         # Internal types
```

**Import rules**:
- Internal (within module): `import { init } from './index.init'`
- External (from outside): `import { database } from '@/core/database'`

## Module Structure
- `core/` - Business logic (labs, database, types)
- `app/` - React UI
- `cli/` - Command line tool
- `utils/` - Shared utilities

# 🛠️ ESSENTIAL COMMANDS

```bash
bun run typecheck    # Check types (MUST pass)
bun run check        # Lint & format (MUST pass)
bun run check:fix    # Auto-fix issues
bun run dev          # Start UI dev server
bun run build        # Build everything
```

# ⚠️ COMMON PITFALLS

- **After moving files**: Update imports (../ → ../../)
- **Database operations**: Always `await ensureInitialized()` first
- **Lab discovery**: Exports must start with `lab__`
- **New components**: Add export to parent index.ts