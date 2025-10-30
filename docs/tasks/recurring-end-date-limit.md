# Task: Limit Recurring Event End Date to 2025-12-31

## Goal

Add system constraint to limit recurring event end date to 2025-12-31 maximum and update existing tests to comply with this limit.

## Background

Current implementation allows end dates beyond 2025, but for demo/example purposes, we need to:
- Cap the maximum end date at 2025-12-31
- Update leap year tests to use past dates only (2020-2024 range)
- Ensure all test dates stay within the 2025-12-31 limit

## Changes Required

### 1. Test Updates

File: src/__tests__/unit/recurringEventUtils.spec.ts
- Change all endDate values beyond 2025-12-31 to be within limit
- Update leap year test to use past dates (2020-02-29 to 2024-02-29)
- Keep test logic the same, only adjust date ranges

Examples:
- `endDate: '2026-02-15'` → `endDate: '2025-12-15'`
- `endDate: '2028-11-15'` → `endDate: '2025-11-15'`
- Leap year: `2024-02-29` to `2028-03-01` → `2020-02-29` to `2024-03-01`

### 2. UI Constraint

File: src/App.tsx
- Add max attribute to endDate input field: `max="2025-12-31"`
- Prevents user from selecting dates beyond 2025-12-31 in date picker

### 3. Business Logic Constraint

File: src/utils/recurringEventUtils.ts
- In generateRecurringEvents function:
  - If repeat.endDate > '2025-12-31', cap it to '2025-12-31'
  - Apply this before the main generation loop

### 4. Add Validation Tests

File: src/__tests__/unit/recurringEventUtils.spec.ts
- Add test case: endDate beyond 2025-12-31 is capped to 2025-12-31
- Add test case: endDate exactly 2025-12-31 works normally

## Implementation Order

1. Update existing test dates to be within 2025-12-31 limit
2. Add new validation test cases
3. Run tests (should fail - Red phase)
4. Implement UI max constraint
5. Implement business logic constraint
6. Run tests (should pass - Green phase)

## Acceptance Criteria

- All recurring event tests use dates within 2025-12-31
- Leap year tests use past dates only (2020-2024 range)
- UI date picker cannot select dates beyond 2025-12-31
- System automatically caps endDate to 2025-12-31 if exceeded
- All existing tests pass with updated date ranges
- New validation tests verify the 2025-12-31 cap behavior

