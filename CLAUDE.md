# Solulab - Claude Code Guide

## 🚀 Quick Reference

### Starting Any Task
```bash
cd solulab         # Always work from library root
bun run install:all # If dependencies are missing
```

### Before Marking Complete
```bash
bun run check:fix  # 1. Auto-fix formatting
bun run typecheck  # 2. Must pass (zero errors)
```

### Most Used Commands
```bash
bun run dev        # Start UI (localhost:5173)
bun run demo:run   # Test lab implementations
bun test          # Run unit tests
```

## 🎯 When Working on Tasks

### Creating/Modifying a Lab
✅ **DO:**
```typescript
// File: something.lab.ts
export const lab__feature_name = createSolutionLab({
    // Result schema MUST be an object
    resultSchema: z.object({ value: z.number() }),
    // ... rest of lab
});
```

❌ **DON'T:**
```typescript
export const labFeatureName = ...     // Wrong: camelCase
export const feature_name = ...       // Wrong: missing lab__ prefix
resultSchema: z.number()             // Wrong: not an object
```

### Creating a New Module
```bash
# 1. Create folder matching main export
mkdir src/core/MyFeature    # Folder name = export name

# 2. Create standard files
touch src/core/MyFeature/index.ts           # Public API
touch src/core/MyFeature/index.types.ts     # Types
touch src/core/MyFeature/index.operations.ts # Logic

# 3. Export from parent
# Add to src/core/index.ts:
export { MyFeature } from './MyFeature';
```

### Modifying Existing Code
1. Check imports after moving files (`../` → `../../`)
2. Follow existing patterns in the file
3. Use error handling with fallbacks:
```typescript
try {
    return await database.operation();
} catch (error) {
    console.warn('Operation failed:', error);
    return fallbackValue;
}
```

## ⚠️ Critical Patterns

### Naming Conventions
| Type | Pattern | Example |
|------|---------|---------|
| Lab exports | `lab__snake_case` | `lab__cpu_benchmark` |
| Folders | Match main export | `DiffViewer/` exports `DiffViewer` |
| Lab files | `*.lab.ts` | `performance.lab.ts` |
| Components | `Name/index.tsx` | `Button/index.tsx` |

### Import Patterns
```typescript
// ✅ Correct
import { helper } from './index.operations';  // Internal
import { database } from '@/core/database';    // External
import type React from 'react';               // Type imports

// ❌ Wrong
import { helper } from '../MyModule/index.operations'; // Use @/ for external
```

### Code Standards
- **Indentation**: 4 spaces (enforced)
- **Quotes**: Single only `'text'`
- **Arrays**: `string[]` not `Array<string>`
- **Blocks**: Always use braces `if (x) { ... }`
- **Padding**: Blank lines before returns, after variable declarations

## 📁 Project Structure

```
solulab/                  # Main library
├── src/
│   ├── core/            # Business logic
│   │   ├── database/    # LowDB persistence
│   │   ├── labs/        # Lab framework
│   │   └── types/       # Shared types
│   ├── app/             # React UI (Vite)
│   └── cli/             # CLI tool
└── dist/                # Build output

solulab-demo/            # Demo project
└── labs/                # Example labs
```

## 🔧 Common Workflows

### Debugging Database Issues
```bash
rm -rf .solulab/      # Reset database
bun run demo:run      # Recreate with fresh data
```

### Configuring CLI
```javascript
// solulab.config.js
export default {
    dbPath: '.custom/db.json',    // Custom database location
    labGlobs: ['**/*.lab.js']     // Custom lab file patterns
};
```

## 🚫 Common Mistakes to Avoid

1. **Forgetting lab__ prefix** → Lab won't be discovered
2. **Using primitive result schemas** → Use objects: `z.object({ ... })`
3. **Missing error handling** → Always add try-catch with fallbacks
4. **Wrong import paths after moving files** → Update all imports
5. **Creating unnecessary files** → Prefer editing existing files

## 📋 Pre-Completion Checklist

- [ ] Ran `bun run check:fix`
- [ ] Ran `bun run typecheck` (zero errors)
- [ ] All imports use correct patterns
- [ ] Error handling has fallbacks
- [ ] No new files unless necessary
- [ ] Components exported in parent index.ts
