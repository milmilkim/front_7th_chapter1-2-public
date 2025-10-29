# Architecture

## Tech Stack

Frontend: React 19.1.0, TypeScript 5.2.2, Vite 7.0.2, Material-UI 7.2.0, Emotion, Framer Motion, Notistack
Testing: Vitest 3.2.4, React Testing Library 16.3.0, MSW 2.10.3
Backend: Express 4.19.2, Node.js
Tools: ESLint, Prettier, pnpm

## Project Structure

```
src/
├── hooks/           # State management + business logic
│   ├── useCalendarView.ts
│   ├── useEventForm.ts
│   ├── useEventOperations.ts
│   ├── useNotifications.ts
│   └── useSearch.ts
├── utils/           # Pure functions
│   ├── dateUtils.ts
│   ├── eventOverlap.ts
│   ├── eventUtils.ts
│   ├── notificationUtils.ts
│   └── timeValidation.ts
├── apis/
│   └── fetchHolidays.ts
├── __tests__/
│   ├── hooks/
│   └── unit/
├── __mocks__/       # MSW handlers
├── types.ts
├── App.tsx          # Monolithic component
└── main.tsx
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
  id?: string;
}
```

## Architecture

State Management: Custom hooks per domain (no Context API)
- hooks: State + side effects
- utils: Pure functions
- apis: External calls

Component: Monolithic App.tsx (planned: separate EventForm, Calendar, EventList)

Design: Single Responsibility, hooks depend on utils, testable

## API Endpoints

```
GET    /api/events
POST   /api/events
PUT    /api/events/:id
DELETE /api/events/:id
```

External: fetchHolidays() for holiday data

## Testing

Unit tests: utils/ (pure functions)
Integration tests: hooks/ (with MSW)
See docs/testing-guidelines.md

## Conventions

Files: PascalCase.tsx (components), camelCase.ts (hooks with use prefix, utils), *.spec.ts (tests)

Types: Prefer interface, avoid any, explicit typing

Functions: Pure functions, verb+noun naming, single responsibility

Commits: `type: description` (feat/fix/refactor/test/docs/chore)

