# Calendar Event Management Application

TDD-driven calendar application built with React 19 and TypeScript. Users can create, edit, and delete events with weekly/monthly views, search functionality, and notification system.

## Quick Overview

Tech Stack: React 19, TypeScript, Vite, Material-UI, Vitest, MSW
Core Features: Event CRUD, week/month views, search, notifications, overlap detection, holidays

For detailed architecture, tech stack, and coding conventions, see docs/architecture.md

## Core Features

1. Event CRUD operations with title, date, time, description, location, category
2. Calendar views (week/month) with navigation
3. Real-time search by title, description, location
4. Notification system (1m/10m/1h/2h/1d before event)
5. Overlap detection with warning dialog
6. Holiday display via external API
7. Recurring events (planned)

## Development Workflow

Commands: `pnpm dev`, `pnpm test`, `pnpm test:ui`, `pnpm lint`, `pnpm build`

TDD Cycle: Red (failing test) → Green (minimal code) → Refactor (improve)

Tidy First Principle: Separate structural changes (refactoring) from behavioral changes (new features). Never mix in same commit.

For detailed testing strategy and coding conventions, see docs/testing-guidelines.md and docs/architecture.md

## Quick Start

Requirements: Node.js 16+, pnpm 8+

```bash
pnpm install  # Install dependencies
pnpm dev      # Start dev server (frontend:5173, backend:3000)
pnpm test     # Run tests
```

## Known Limitations

Current:
- Monolithic App.tsx component
- Recurring events not fully implemented
- No Context API

Planned:
- Component separation (EventForm, Calendar, EventList)
- Complete recurring events implementation
- Accessibility improvements (ARIA, keyboard navigation)
- Performance optimization (memoization, virtualization)

## Documentation

- docs/architecture.md: Detailed technical architecture, coding conventions
- docs/testing-guidelines.md: Comprehensive testing strategy and patterns
- docs/features/: Feature specifications
- agents/: AI agent specifications for feature development

## Contributing

Workflow: Write spec → Design tests → TDD cycle → Implement → Refactor → Update docs
See agents/ folder for detailed development workflows

## AI Assistant Instructions

CRITICAL: AI prompts and agent content rules

MUST follow when generating prompts/agents/AI content:
- Write in English ONLY
- NEVER use bold, emojis, or excessive markup
- Minimize tokens while maintaining clarity
- Use plain text and simple markdown only
- NO decorative formatting

HIGHEST PRIORITY for /agents/ and /docs/ directories.