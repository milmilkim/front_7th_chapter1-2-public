# Calendar Event Management Application

TDD-driven calendar application built with React 19 and TypeScript. Users can create, edit, and delete events with weekly/monthly views, search functionality, and notification system.

## Tech Stack

Frontend: React 19.1.0, TypeScript 5.2.2, Vite 7.0.2, Material-UI 7.2.0, Emotion, Framer Motion, Notistack
Testing: Vitest 3.2.4, React Testing Library 16.3.0, MSW 2.10.3
Backend: Express 4.19.2, Node.js
Tools: ESLint, Prettier, pnpm

## Core Features

1. Event CRUD operations with title, date, time, description, location, category
2. Calendar views (week/month) with navigation
3. Real-time search by title, description, location
4. Notification system (1m/10m/1h/2h/1d before event)
5. Overlap detection with warning dialog
6. Holiday display via external API
7. Recurring events (planned)

## Project Structure

```
src/
├── hooks/           # Custom hooks (state management & business logic)
│   ├── useCalendarView.ts      # Calendar view state (week/month, navigation)
│   ├── useEventForm.ts         # Event form state & validation
│   ├── useEventOperations.ts   # Event CRUD
│   ├── useNotifications.ts     # Notification system
│   └── useSearch.ts            # Event search
├── utils/           # Pure utility functions
│   ├── dateUtils.ts            # Date operations (week/month calc, formatting)
│   ├── eventOverlap.ts         # Overlap detection
│   ├── eventUtils.ts           # Event utilities
│   ├── notificationUtils.ts    # Notification utilities
│   └── timeValidation.ts       # Time validation
├── apis/            # External API calls
│   └── fetchHolidays.ts
├── __tests__/       # Test files (unit & integration)
│   ├── hooks/       # Hook tests
│   └── unit/        # Unit tests
├── __mocks__/       # MSW handlers for API mocking
├── types.ts         # Type definitions
├── App.tsx          # Main component (monolithic, needs refactoring)
└── main.tsx         # Entry point
```

## Data Models

```typescript
interface Event {
  id: string;
  title: string;
  date: string;           // YYYY-MM-DD
  startTime: string;      // HH:mm
  endTime: string;        // HH:mm
  description: string;
  location: string;
  category: string;       // '업무' | '개인' | '가족' | '기타'
  repeat: RepeatInfo;
  notificationTime: number; // minutes
}

interface RepeatInfo {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
}

interface EventForm extends Omit<Event, 'id'> {
  id?: string;  // Optional for new events
}
```

## Architecture

State Management: Custom hooks per domain (no Context API), unidirectional data flow
Business Logic: Separated into hooks (state + side effects), utils (pure functions), apis (external calls)
Component: Monolithic App.tsx (needs componentization)

## API Endpoints

- GET /api/events - List all events
- POST /api/events - Create event
- PUT /api/events/:id - Update event
- DELETE /api/events/:id - Delete event
- External holiday API via fetchHolidays

## Development Workflow

Scripts: `pnpm dev` (frontend + backend), `pnpm test` (tests), `pnpm test:ui` (test UI), `pnpm lint`, `pnpm build`

TDD Cycle: Red (failing test) → Green (minimal code) → Refactor (improve)

Tidy First Principle: Separate structural changes (refactoring) from behavioral changes (new features). Never mix in same commit.

## Testing Strategy

Test Levels: Unit (utils pure logic), Integration (hooks with state/API)
Complexity: easy (simple utils/hooks), medium (complex business logic)

React Testing Library: User-centric tests, prefer getByRole > getByLabelText > getByText > getByTestId, use findBy for async, userEvent over fireEvent

API Mocking: MSW handlers in `__mocks__/handlers.ts`, matches real API structure

## Coding Conventions

Files: PascalCase.tsx (components), camelCase.ts (hooks with use prefix, utils), *.spec.ts (tests)
Types: Prefer interface over type, no any (use unknown), explicit typing
Functions: Pure functions, Single Responsibility Principle, verb+noun naming
Commits: Mark structural vs behavioral changes, commit only when tests pass, small frequent commits

## Key Implementations

useEventOperations: CRUD operations (events, saveEvent, deleteEvent), auto-refresh, error handling
useCalendarView: View state (week/month), currentDate, holidays map, navigate (prev/next)
useSearch: Real-time search by title/description/location, filters by current view
useNotifications: Checks every minute, highlights notified events, dismissable
eventOverlap: findOverlappingEvents detects same date/time conflicts, shows warning dialog
useEventForm: Form state management, time validation (start < end), edit mode support

## Setup

Requirements: Node.js 16+, pnpm 8+
Install: `pnpm install`
Run: `pnpm dev` (frontend at :5173, API at :3000)
Test: `pnpm test`

## Known Limitations & Future Improvements

Current: Monolithic App.tsx, recurring events not implemented, no Context API
Planned: Component separation (EventForm, Calendar, EventList), recurring events implementation, state management refactor, accessibility improvements (ARIA, keyboard nav), performance optimization (memo, virtualization)

## Troubleshooting

Test failures: Check `pnpm test:ui`, use `screen.debug()`
Lint errors: Run `pnpm lint`
Build errors: Check TypeScript compilation
Dev server issues: Check port conflicts (5173, 3000), clear .vite cache, reinstall node_modules

## Contributing

Feature workflow: Write spec → Design tests → TDD cycle → Implement → Refactor → Update docs
See agents/ folder for detailed specifications

## Additional Documentation

- docs/architecture.md
- docs/testing-guidelines.md

## AI Assistant Instructions

CRITICAL: AI prompts and agent content rules

MUST follow when generating prompts/agents/AI content:
- Write in English ONLY
- NEVER use bold, emojis, or excessive markup
- Minimize tokens while maintaining clarity
- Use plain text and simple markdown only
- NO decorative formatting

HIGHEST PRIORITY for /agents/ and /docs/ directories.