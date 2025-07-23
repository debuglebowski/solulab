# Solulab Development Roadmap

## Overview

Solulab is a solution laboratory framework for systematically testing and comparing multiple implementations of the same functionality. It provides a type-safe way to define labs, run test cases against different versions, persist results, and visualize comparisons through a web UI.

## Current Status

The core framework is functional with:
- ✅ CLI tool for running labs
- ✅ Basic web UI for viewing results
- ✅ SQLite persistence using LowDB
- ✅ Type-safe lab definitions with Zod
- ✅ Automatic lab discovery
- ✅ Incremental execution (skips already-run combinations)

## Development Phases

### Phase 1: Core Improvements (High Priority)

#### 1.1 CLI - Selective Execution
**Priority**: HIGH  
**Description**: Add ability to run specific labs, versions, or test cases instead of running everything.
- Add command-line flags: `--lab`, `--version`, `--case`
- Support glob patterns for lab selection
- Allow multiple selections (e.g., `--lab "math*" --version "v2"`)
- Implementation: Modify `src/cli/runner/index.ts` to filter discovered labs

#### 1.2 UI - Comparison View
**Priority**: HIGH  
**Description**: Create a dedicated page for comparing results between different versions.
- Side-by-side comparison of version results
- Highlight performance differences
- Show success/failure patterns across test cases
- Route: `/compare/:labId`
- Implementation: New component in `src/app/pages/compare/`

#### 1.3 Testing - Unit Tests for Core Modules
**Priority**: HIGH  
**Description**: Add comprehensive unit tests for core business logic.
- Test lab creation and validation
- Test database operations
- Test result calculation logic
- Test discovery mechanism
- Use Vitest (already configured)
- Target: 80%+ coverage for `src/core/`

#### 1.4 UI - Filtering and Search
**Priority**: HIGH  
**Description**: Add ability to filter and search results in the UI.
- Filter by: lab name, version, test case, status (pass/fail)
- Date range filtering
- Text search across lab names and descriptions
- Persistent filter state in URL params
- Implementation: Add filter components to `src/app/pages/home/`

### Phase 2: Developer Experience (Medium-High Priority)

#### 2.1 CLI - Watch Mode
**Priority**: MEDIUM-HIGH  
**Description**: Automatically re-run labs when source files change.
- Add `--watch` flag to CLI
- Monitor lab files and their dependencies
- Smart re-run: only affected labs
- Clear previous results option
- Implementation: Use Bun's file watcher API

#### 2.2 CLI - Progress Reporting
**Priority**: MEDIUM-HIGH  
**Description**: Show progress bar and ETA for long-running lab executions.
- Progress bar showing current lab/version/case
- ETA based on average execution time
- Option to show detailed output (`--verbose`)
- Spinner for currently executing test
- Implementation: Use `ora` or similar CLI spinner library

#### 2.3 CLI - List Command
**Priority**: MEDIUM  
**Description**: Add command to list available labs without running them.
- `solulab list` - shows all discovered labs
- Show lab names, descriptions, version count, case count
- Option to output as JSON for tooling
- Group by directory or tags (when implemented)
- Implementation: New command in `src/cli/index.ts`

#### 2.4 Error Message Improvements
**Priority**: MEDIUM  
**Description**: Make error messages more helpful with actionable suggestions.
- Add "Did you mean?" suggestions for typos
- Include troubleshooting steps for common errors
- Better stack traces with source maps
- Validation error formatting improvements
- Context-aware error messages

### Phase 3: Advanced Features (Medium Priority)

#### 3.1 Parallel Execution
**Priority**: MEDIUM  
**Description**: Run multiple labs/versions in parallel for faster execution.
- Worker pool for parallel execution
- Configurable concurrency level
- Progress reporting for parallel runs
- Ensure database writes are thread-safe
- Implementation: Use Bun's Worker threads

#### 3.2 UI - Performance Charts
**Priority**: MEDIUM  
**Description**: Visualize performance trends over time with charts.
- Line charts for execution time trends
- Success rate over time
- Comparison charts between versions
- Export charts as images
- Implementation: Use Chart.js or Recharts

#### 3.3 Plugin System
**Priority**: MEDIUM  
**Description**: Allow extending Solulab with custom functionality.
- Hook system for lifecycle events
- Custom reporters (JUnit, TAP, etc.)
- Custom storage backends
- Plugin discovery and loading
- TypeScript plugin API
- Example plugins included

#### 3.4 IDE Integration
**Priority**: LOW-MEDIUM  
**Description**: Improve developer experience in VS Code.
- VS Code extension for Solulab
- Snippets for lab creation
- Run labs from editor
- Inline result display
- Go-to-definition for labs

### Phase 4: Enterprise Features (Low-Medium Priority)

#### 4.1 Remote Storage Support
**Priority**: LOW-MEDIUM  
**Description**: Support for cloud database backends.
- PostgreSQL adapter
- MySQL adapter
- MongoDB adapter
- S3 storage for large results
- Configuration for connection strings

#### 4.2 API Server
**Priority**: LOW  
**Description**: REST/GraphQL API for programmatic access.
- RESTful endpoints for CRUD operations
- GraphQL schema for flexible queries
- Authentication and authorization
- Rate limiting
- OpenAPI documentation

#### 4.3 Webhook Notifications
**Priority**: LOW  
**Description**: Notify external services of lab results.
- Configurable webhooks for events
- Slack/Discord/Teams integration
- Custom payload templates
- Retry logic for failed webhooks
- Event filtering rules

#### 4.4 CI/CD Templates
**Priority**: LOW  
**Description**: Ready-to-use CI/CD configurations.
- GitHub Actions workflows
- GitLab CI templates
- Jenkins pipelines
- CircleCI config
- Performance regression detection

## Backlog (TBD)

### Documentation Improvements
**Status**: TBD - Needs full scope definition
- API reference documentation
- More comprehensive examples
- Video tutorials
- Architecture deep-dive
- Migration guides from other tools
- Best practices guide
- Troubleshooting guide

### Performance & Scalability
**Status**: TBD - Needs performance baseline measurement
- Large dataset handling optimizations
- Memory management for streaming
- Result compression and archival
- Database query optimization
- Caching layer implementation
- Horizontal scaling support
- Result pagination in UI

## Implementation Guidelines

1. **Incremental Delivery**: Each feature should be deliverable independently
2. **Backward Compatibility**: Maintain compatibility with existing lab definitions
3. **Type Safety**: Maintain 100% TypeScript coverage
4. **Testing**: Each new feature must include tests
5. **Documentation**: Update docs with each feature addition
6. **Performance**: Benchmark impact of new features

## Success Metrics

- **Developer Adoption**: Number of labs created
- **Performance**: Lab execution time improvements
- **Reliability**: Test success rate
- **User Satisfaction**: Feature request completion
- **Code Quality**: Test coverage, type coverage

## Contributing

When working on items from this roadmap:
1. Create a feature branch: `feature/phase-X-description`
2. Update this TODO.md to mark items as "IN PROGRESS" or "COMPLETED"
3. Include tests and documentation
4. Submit PR with reference to TODO item number