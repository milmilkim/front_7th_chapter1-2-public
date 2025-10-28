# Recurring Events Feature Specification

## Overview

Enable users to create and manage recurring events with daily, weekly, monthly, and yearly repeat patterns.

## Purpose and Value

Currently, users must manually create multiple events for recurring activities. This feature automates the creation of repetitive events, saving time and reducing manual effort.

User value:
- Reduces repetitive data entry for regular meetings, appointments, or tasks
- Ensures consistency across recurring event instances
- Provides flexible repeat patterns matching real-world scenarios

## Scope

In Scope:
- [ ] Select repeat type when creating or editing events
- [ ] Support repeat types: daily, weekly, monthly, yearly
- [ ] Configure repeat interval (e.g., every 2 days, every 3 weeks)
- [ ] Optional end date for recurring series
- [ ] Individual instance editing (modify single occurrence)
- [ ] Bulk deletion (delete current and future occurrences)
- [ ] Handle edge cases: month-end dates, leap year dates
- [ ] Store each occurrence as separate Event with shared repeatId

Out of Scope:
- [ ] Overlap detection for recurring events (explicitly excluded)
- [ ] Complex recurrence patterns (e.g., "every 2nd Tuesday")
- [ ] Multiple weekday selection for weekly repeats
- [ ] Exception dates (skip specific occurrences)
- [ ] Edit entire series at once
- [ ] Edit future occurrences only
- [ ] Single occurrence deletion
- [ ] Series-wide deletion

## Technical Approach

### Affected Files

New Files:
- src/utils/recurringEventUtils.ts - recurring event generation logic

Modified Files:
- src/types.ts - add repeatId field to RepeatInfo interface
- src/App.tsx - uncomment and enable repeat UI controls
- src/hooks/useEventForm.ts - expose repeat setters
- src/hooks/useEventOperations.ts - handle recurring event creation and operations

### Data Structure Changes

Update RepeatInfo interface:

```typescript
interface RepeatInfo {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
  id?: string; // shared identifier for recurring series
}
```

### Key Functions

#### generateRecurringEvents

Purpose: Generate array of event occurrences from repeat configuration

Input:
- baseEvent: EventForm - template event with repeat settings
- maxOccurrences?: number - safety limit (default 1000)

Output:
- Event[] - array of individual event instances with unique IDs and shared repeatId

Logic:
- Start from baseEvent.date
- Generate dates based on repeat.type and repeat.interval
- Stop at repeat.endDate or maxOccurrences
- Handle edge cases:
  - Monthly: day 31 only creates on months with 31 days
  - Yearly: Feb 29 only creates on leap years
- Each event gets unique id, all share repeat.id

Example:
```typescript
// Input
{
  title: "Team Meeting",
  date: "2025-01-15",
  repeat: { type: "weekly", interval: 2, endDate: "2025-03-15" }
}

// Output
[
  { id: "uuid-1", date: "2025-01-15", repeat: { id: "repeat-1", ... } },
  { id: "uuid-2", date: "2025-01-29", repeat: { id: "repeat-1", ... } },
  { id: "uuid-3", date: "2025-02-12", repeat: { id: "repeat-1", ... } },
  { id: "uuid-4", date: "2025-02-26", repeat: { id: "repeat-1", ... } },
  { id: "uuid-5", date: "2025-03-12", repeat: { id: "repeat-1", ... } }
]
```

#### calculateNextDate

Purpose: Calculate next occurrence date based on repeat type

Input:
- currentDate: string (YYYY-MM-DD)
- repeatType: RepeatType
- interval: number

Output:
- string (YYYY-MM-DD) - next occurrence date

Logic:
- daily: add interval days
- weekly: add interval * 7 days
- monthly: add interval months, preserve day (skip if day doesn't exist)
- yearly: add interval years, preserve month and day (skip if date doesn't exist)

#### isValidOccurrenceDate

Purpose: Check if date should be included based on original date constraints

Input:
- originalDate: string - base event date
- candidateDate: string - potential occurrence date
- repeatType: RepeatType

Output:
- boolean - true if occurrence should be created

Logic:
- monthly: return true only if day-of-month matches original
- yearly: return true only if month and day match original
- daily/weekly: always return true

### API Integration

Existing endpoints in server.js will be used:

Create recurring series:
- POST /api/events-list
- Body: { events: Event[] }
- Creates multiple events with shared repeatId

Update single occurrence:
- PUT /api/events/:id
- Body: Event data
- Updates individual event instance

Delete current and future:
- DELETE /api/events-list
- Body: { eventIds: string[] }
- Deletes specified event IDs

### UI Changes

App.tsx modifications:

1. Uncomment repeat type selection UI (lines 441-477)
2. Enable setRepeatType, setRepeatInterval, setRepeatEndDate in useEventForm
3. Add interval input field with number validation (min: 1, max: 99)
4. Add optional end date picker
5. Update save handler to call generateRecurringEvents before POST

Form layout:
```
[ ] Repeat
  When checked:
    Repeat Type: [Dropdown: Daily/Weekly/Monthly/Yearly]
    Interval: [Number input] (e.g., "2" for every 2 days)
    End Date: [Date picker] (optional)
```

## Behavior Scenarios

### Scenario 1: Create Daily Recurring Event

Given: User creates event on 2025-01-15
When: User selects repeat type "daily", interval 3, end date 2025-01-24
Then:
- System generates events for: 2025-01-15, 2025-01-18, 2025-01-21, 2025-01-24
- All events share same repeatId
- POST /api/events-list called with 4 events
- Success notification shown

### Scenario 2: Create Monthly Recurring on Day 31

Given: User creates event on 2025-01-31
When: User selects repeat type "monthly", interval 1, end date 2025-06-30
Then:
- System generates events for: 2025-01-31, 2025-03-31, 2025-05-31
- Skips February (28/29 days), April (30 days), June (30 days)
- Only creates on months with 31 days

### Scenario 3: Create Yearly Recurring on Leap Day

Given: User creates event on 2024-02-29 (leap year)
When: User selects repeat type "yearly", interval 1, end date 2028-03-01
Then:
- System generates events for: 2024-02-29, 2028-02-29
- Skips 2025, 2026, 2027 (non-leap years)
- Only creates on leap years

### Scenario 4: Edit Single Occurrence

Given: Recurring series exists with 5 occurrences
When: User clicks edit on 3rd occurrence, modifies title, saves
Then:
- PUT /api/events/:id called with modified data
- Only that specific occurrence is updated
- Other occurrences remain unchanged
- repeatId remains same

### Scenario 5: Delete Current and Future

Given: Recurring series with 10 occurrences, user selects 5th
When: User clicks delete
Then:
- System identifies all events with same repeatId where date >= selected date
- DELETE /api/events-list called with IDs of occurrences 5-10
- Occurrences 1-4 remain in database
- Calendar updates to show remaining events

### Scenario 6: No End Date (Unlimited)

Given: User creates event with repeat but no end date
When: System generates occurrences
Then:
- Default maximum of 1000 occurrences applied
- Warning shown if limit reached
- User prompted to set end date

### Scenario 7: Create Without Repeat

Given: User creates event without checking repeat checkbox
When: User saves event
Then:
- Single event created via POST /api/events
- repeat.type set to 'none'
- No repeatId assigned

### Scenario 8: Weekly Repeat Interval 2

Given: User creates event on 2025-01-06 (Monday)
When: User selects repeat type "weekly", interval 2, end date 2025-02-17
Then:
- System generates events for: 2025-01-06, 2025-01-20, 2025-02-03, 2025-02-17
- All on Mondays, every 2 weeks

## Error Scenarios

### Error 1: Invalid Interval

Given: User enters interval value
When: Value is 0, negative, or > 99
Then:
- Input validation error shown
- Save button disabled
- Message: "Interval must be between 1 and 99"

### Error 2: End Date Before Start Date

Given: User sets end date
When: End date is before event date
Then:
- Validation error shown
- Save button disabled
- Message: "End date must be after event date"

### Error 3: API Failure on Bulk Create

Given: User creates recurring series with 20 events
When: POST /api/events-list fails (network error, server error)
Then:
- No events created (transaction-like behavior on client)
- Error toast shown: "Failed to create recurring events"
- Form remains open with data intact
- User can retry

### Error 4: Maximum Occurrences Exceeded

Given: User creates daily event without end date
When: Generation would exceed 1000 occurrences
Then:
- Warning dialog shown
- Generated up to 1000 occurrences
- Message: "Maximum 1000 occurrences. Please set an end date for longer series."

## Acceptance Criteria

Implementation Complete When:

- [ ] RepeatInfo interface includes id field in types.ts
- [ ] generateRecurringEvents function implemented in recurringEventUtils.ts
- [ ] calculateNextDate function handles all repeat types correctly
- [ ] isValidOccurrenceDate correctly filters monthly/yearly edge cases
- [ ] UI controls uncommented and functional in App.tsx
- [ ] Interval input accepts 1-99, validates correctly
- [ ] End date picker optional and validates against start date
- [ ] useEventForm exposes repeat setters (setRepeatType, setRepeatInterval, setRepeatEndDate)
- [ ] useEventOperations.saveEvent handles recurring vs single events
- [ ] Single occurrence edit calls PUT /api/events/:id
- [ ] Delete calls DELETE /api/events-list with future event IDs
- [ ] Day 31 monthly repeat only creates on 31-day months
- [ ] Feb 29 yearly repeat only creates on leap years
- [ ] RepeatId shared across all occurrences in series
- [ ] Maximum 1000 occurrences enforced with warning

Test Requirements:

- [ ] Unit: generateRecurringEvents with all repeat types
- [ ] Unit: calculateNextDate for each repeat type and interval
- [ ] Unit: isValidOccurrenceDate for edge cases (day 31, Feb 29)
- [ ] Unit: Interval validation (boundaries: 0, 1, 99, 100)
- [ ] Unit: End date validation
- [ ] Integration: Create daily recurring event (useEventOperations)
- [ ] Integration: Create weekly recurring with interval 2
- [ ] Integration: Create monthly recurring on day 31
- [ ] Integration: Create yearly recurring on Feb 29
- [ ] Integration: Edit single occurrence preserves repeatId
- [ ] Integration: Delete current and future removes correct events
- [ ] Integration: API failure handling on bulk create
- [ ] Integration: Maximum occurrences limit

## Constraints

Technical:
- Maximum 1000 occurrences per series for performance
- Each occurrence stored as separate Event (not dynamic generation)
- RepeatId generated server-side for consistency
- Client-side generation before API call

Performance:
- Bulk create API call (POST /api/events-list) over individual calls
- Generate occurrences synchronously (acceptable for max 1000)
- No pagination needed for occurrence generation

Business Rules:
- Monthly day 31: only create on months with 31 days (no adjustment to day 30)
- Yearly Feb 29: only create on leap years (no adjustment to Feb 28)
- Weekly repeat preserves original day of week
- Delete removes current and all future, not entire series
- Edit modifies single instance only
- No overlap detection for recurring events

Security:
- Validate interval range (1-99) on client and server
- Validate end date >= start date
- Limit maximum occurrences to prevent DOS

Accessibility:
- Repeat checkbox accessible via keyboard
- Select and input fields have proper labels
- Error messages announced to screen readers
- Date pickers keyboard navigable

## Estimated Scope

Development Time: 4-6 hours
- recurringEventUtils.ts implementation: 2 hours
- UI integration and form handling: 1.5 hours
- useEventOperations integration: 1 hour
- Error handling and edge cases: 1 hour
- Manual testing: 0.5 hours

Test Count: 13 unit tests, 8 integration tests

Files Modified: 4
Files Created: 1
