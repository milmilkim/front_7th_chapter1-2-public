# Architecture Documentation

## Tech Stack

### Frontend
- React 19.1.0
- TypeScript 5.2.2
- Vite 7.0.2
- Material-UI 7.2.0
- Emotion (styling)
- Framer Motion (animation)
- Notistack (toast notifications)

### Development Tools
- Vitest 3.2.4 (test runner)
- React Testing Library 16.3.0
- MSW 2.10.3 (API mocking)
- ESLint + Prettier

### Backend
- Express 4.19.2 (simple API server)
- Node.js

## Project Structure

```
src/
├── hooks/              # Custom hooks
│   ├── useCalendarView.ts      # Calendar view state management
│   ├── useEventForm.ts         # Event form state management
│   ├── useEventOperations.ts   # Event CRUD operations
│   ├── useNotifications.ts     # Notification system
│   └── useSearch.ts            # Event search
├── utils/              # Utility functions
│   ├── dateUtils.ts            # Date-related functions
│   ├── eventOverlap.ts         # Event overlap detection
│   ├── eventUtils.ts           # Event-related functions
│   ├── notificationUtils.ts    # Notification utilities
│   └── timeValidation.ts       # Time validation
├── apis/               # API calls
│   └── fetchHolidays.ts        # Holiday API
├── __tests__/          # Test files
│   ├── hooks/                  # Hook tests
│   ├── unit/                   # Unit tests
│   └── medium.integration.spec.tsx  # Integration tests
├── __mocks__/          # MSW handlers
├── types.ts            # Type definitions
├── App.tsx             # Main component
└── main.tsx            # Entry point
```

## Data Models

### Event
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
  notificationTime: number; // in minutes
}
```

### RepeatInfo
```typescript
interface RepeatInfo {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
}
```

## Architecture Patterns

### State Management
- Custom hook-based state management (without Context API)
- Separate hooks for each domain
- Unidirectional data flow

### Component Structure
- Single App component (monolithic)
- Future refactoring needed: component separation

### Business Logic Separation
- hooks: state management and side effects
- utils: pure functions (easy to test)
- apis: external API calls

## API Endpoints

### Event Management
- GET /api/events - Retrieve event list
- POST /api/events - Create event
- PUT /api/events/:id - Update event
- DELETE /api/events/:id - Delete event

### Holidays
- External API call (fetchHolidays)

## Testing Strategy

### Test Levels
1. Unit: utils functions
2. Integration: hooks (useEventOperations, useNotifications, etc.)
3. E2E: full workflows (future)

### Test Difficulty Classification
- easy: simple utility functions, basic hooks
- medium: hooks with business logic, integration tests

### Coverage Goals
- 100% for core business logic
- Major scenarios for UI interactions

## Development Workflow

### Scripts
- pnpm dev: run dev server + API server simultaneously
- pnpm test: run tests
- pnpm test:ui: Vitest UI
- pnpm test:coverage: coverage report
- pnpm lint: ESLint + TypeScript check

### TDD Cycle
1. Write failing test
2. Write minimal code to pass test
3. Refactor
4. Commit

## Coding Conventions

### File Naming
- Components: PascalCase.tsx
- Hooks: camelCase.ts (use prefix)
- Utils: camelCase.ts
- Tests: *.spec.ts or *.spec.tsx

### Types
- Prefer interfaces (use type when necessary)
- Avoid any, use unknown
- Explicit type definitions

### Functions
- Prefer pure functions
- Single responsibility principle
- Clear function names (verb + noun)

## Dependency Management

Package Manager: pnpm

### Notes
- React 19.1.0 is a relatively recent version
- Testing Library 16.3.0 is compatible with React 19
- MUI 7.2.0 is also the latest version

## Future Improvements

1. Component separation (App.tsx is too large)
2. Consider state management library (if needed)
3. Implement recurring event feature
4. Add E2E tests
5. Accessibility improvements
6. Performance optimization (React.memo, useMemo, etc.)

