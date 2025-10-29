# Recurring Events

## Overview

Enable users to create recurring events with daily, weekly, monthly, and yearly patterns through the event form UI.

## Purpose

Users need to create repeating events (meetings, birthdays, anniversaries) without manually adding each occurrence. This feature allows them to set a repeat pattern once and automatically generate all instances.

Problem solved: Reduces manual effort and errors when creating repetitive events.

## Scope

In scope:
- Uncomment and activate recurring event UI fields (App.tsx lines 439-477)
- Generate recurring event instances on form submission
- Handle edge cases: monthly on 31st (only months with 31 days), yearly on Feb 29 (leap years only)
- Skip overlap detection for recurring events
- Submit all instances via existing /api/events-list endpoint

Out of scope:
- Editing recurring events (single instance or series)
- Deleting recurring events (single instance or series)
- Visual indicators for recurring event series
- Modifying existing recurring event logic in hooks/utils

## Technical Approach

Affected files:

Modified:
- src/App.tsx: Uncomment lines 439-477, modify addOrUpdateEvent to handle recurring events
- src/hooks/useEventOperations.ts: Add saveEventList method for batch creation
- src/types.ts: Add optional id field to RepeatInfo interface

New:
- src/utils/recurringEventUtils.ts: Event generation logic

Data structures:

```typescript
// types.ts - Add to RepeatInfo
interface RepeatInfo {
  type: RepeatType;
  interval: number;
  endDate?: string;
  id?: string;  // NEW: Shared ID for recurring series
}

// recurringEventUtils.ts - New exports
function generateRecurringEvents(baseEvent: EventForm, maxOccurrences?: number): Event[]
function calculateNextDate(currentDate: string, repeatType: RepeatType, interval: number): string
function isValidOccurrenceDate(originalDate: string, candidateDate: string, repeatType: RepeatType): boolean
```

Key functions:

generateRecurringEvents(baseEvent: EventForm, maxOccurrences = 1000): Event[]
- Input: Base event with repeat configuration
- Output: Array of event instances with unique IDs, shared repeat.id
- Logic: Generate dates until endDate or maxOccurrences, filter by isValidOccurrenceDate

calculateNextDate(currentDate: string, repeatType: RepeatType, interval: number): string
- Input: Current date string (YYYY-MM-DD), repeat type, interval
- Output: Next date string (YYYY-MM-DD)
- Logic: Add days/weeks/months/years based on type and interval
- Edge: Returns invalid dates (2025-02-31) for isValidOccurrenceDate to filter

isValidOccurrenceDate(originalDate: string, candidateDate: string, repeatType: RepeatType): boolean
- Input: Original event date, candidate occurrence date, repeat type
- Output: true if occurrence should be created
- Logic:
  - daily/weekly: always true
  - monthly: candidate day matches original day AND date is valid
  - yearly: candidate month/day matches original month/day AND date is valid
- Examples:
  - monthly 31st: true for Jan 31, Mar 31, false for Feb 31 (invalid)
  - yearly Feb 29: true for 2024-02-29, false for 2025-02-29 (not leap year)

saveEventList(events: EventForm[]): Promise<void>
- Input: Array of event instances
- Output: Promise
- API: POST /api/events-list with { events: EventForm[] }

## Key Scenarios

Scenario 1: Create daily recurring event
- Given: User fills form with title "Stand-up", date "2025-11-01", repeat type "daily", interval 1, endDate "2025-11-05"
- When: User clicks submit
- Then: 5 events created (Nov 1, 2, 3, 4, 5), all share same repeat.id, no overlap dialog shown

Scenario 2: Create monthly recurring on 31st
- Given: User fills form with date "2025-01-31", repeat type "monthly", interval 1, endDate "2025-06-30"
- When: User clicks submit
- Then: 3 events created (Jan 31, Mar 31, May 31), Feb/Apr/Jun skipped (no 31st day)

Scenario 3: Create yearly recurring on Feb 29
- Given: User fills form with date "2024-02-29", repeat type "yearly", interval 1, endDate "2028-03-01"
- When: User clicks submit
- Then: 2 events created (2024-02-29, 2028-02-29), 2025/2026/2027 skipped (not leap years)

## Acceptance Criteria

Implementation:
- UI fields (repeat type, interval, endDate) are visible when "repeat schedule" checkbox is checked
- Clicking submit with repeat.type !== 'none' generates multiple event instances
- All instances have unique id but share same repeat.id
- Monthly on 31st only creates events in months with 31 days
- Yearly on Feb 29 only creates events in leap years
- Overlap detection is skipped for recurring events (no dialog shown)
- All instances submitted to /api/events-list in single request
- Form resets after successful submission
- Success notification shows after creation

Test requirements:

Integration Tests (user workflows):
- User creates daily recurring event and sees all instances in calendar
- User creates monthly recurring on 31st and only valid months show events
- User creates yearly recurring on Feb 29 and only leap years show events
- User submits recurring event and sees success notification

Hook Tests:
- Hook: useEventOperations
- Scenario: saveEventList creates multiple events via API
- Scenario: Recurring events skip overlap detection

Unit Tests:
- Function: generateRecurringEvents
- Scenarios: Daily, weekly, monthly, yearly patterns with various intervals
- Scenarios: Edge cases (endDate before/equal startDate, invalid dates)
- Function: calculateNextDate
- Scenarios: Date arithmetic for all repeat types
- Function: isValidOccurrenceDate
- Scenarios: Monthly 31st filtering, yearly Feb 29 leap year filtering

## Constraints

Technical limits:
- Maximum 1000 occurrences if no endDate provided
- Requires endDate for UI (no infinite series)
- Cannot edit or delete recurring series (only individual instances via existing delete)
- Recurring events bypass overlap detection entirely

Edge cases:
- endDate before startDate: return empty array
- endDate equals startDate: return single event
- repeat.type 'none': return single event
- Invalid dates (Feb 31, Apr 31): filtered out by isValidOccurrenceDate
- Month/year boundaries: handled by Date object arithmetic

