# Task: Recurring Event Edit with Mode Selection

## Goal

Implement edit functionality for recurring events with two modes: single instance edit and series edit.

## Background

When user edits a recurring event, they need to choose:
- Edit only this instance (converts to single event)
- Edit entire series (keeps recurring properties)

This is a common pattern in calendar applications to handle recurring event modifications.

## Requirements

### User Flow

When editing a recurring event (repeat.type !== 'none'):
1. System detects event is recurring
2. Show confirmation dialog: "해당 일정만 수정하시겠어요?"
3. User selects mode:
   - "예" (Yes) → Single instance edit mode
   - "아니오" (No) → Series edit mode

### Single Instance Edit Mode (Yes)

When user clicks "예":
- Convert recurring event to single event
- Set repeat.type = 'none'
- Remove repeat icon from display
- Only modify this specific event instance
- Other instances in series remain unchanged

### Series Edit Mode (No)

When user clicks "아니오":
- Keep recurring properties (repeat.type, interval, endDate, id)
- Maintain repeat icon display
- Update all instances in the series with new values
- Shared repeat.id identifies series members

## Changes Required

### 1. UI Changes

File: src/App.tsx

Add confirmation dialog:
- Trigger: When editingEvent has repeat.type !== 'none'
- Display before opening edit form
- Text: "해당 일정만 수정하시겠어요?"
- Buttons: "예" / "아니오"

Dialog state management:
- Store edit mode selection (single or series)
- Pass mode to edit handler

### 2. Edit Logic

File: src/hooks/useEventOperations.ts or src/App.tsx

Single instance edit:
- Remove repeat properties (set type to 'none')
- Update only the selected event
- Use existing saveEvent method

Series edit:
- Keep all repeat properties intact
- Find all events with same repeat.id
- Update all series members with new values (except date/startTime/endTime)
- May need new API method or multiple update calls

### 3. API Considerations

Current API: PUT /api/events/{id}
- Updates single event

For series edit, consider:
- Option A: Multiple PUT calls for each series member
- Option B: New endpoint PUT /api/events/series/{repeatId}
- For now, use Option A (multiple calls) if needed

## Implementation Order

1. Add test cases for edit mode selection
2. Add test cases for single instance edit (conversion to single event)
3. Add test cases for series edit (maintaining repeat properties)
4. Run tests (should fail - Red phase)
5. Implement confirmation dialog UI
6. Implement single instance edit logic
7. Implement series edit logic
8. Run tests (should pass - Green phase)

## Test Scenarios

### Unit Tests

File: src/__tests__/hooks/useEventOperations.spec.ts

Scenarios:
- Edit recurring event in single mode: repeat.type becomes 'none'
- Edit recurring event in series mode: repeat properties preserved
- Edit non-recurring event: no dialog, normal edit flow

### Integration Tests

File: src/__tests__/integration/recurring-event-edit.spec.tsx (new)

Scenarios:
- User edits recurring event, clicks "예", event becomes single
- User edits recurring event, clicks "아니오", series updated
- Repeat icon visibility after single vs series edit
- Form shows correct repeat values based on edit mode

## Acceptance Criteria

UI:
- Confirmation dialog appears when editing recurring event
- Dialog text is "해당 일정만 수정하시겠어요?"
- Dialog has "예" and "아니오" buttons
- Non-recurring events edit normally without dialog

Behavior:
- "예" mode: Event loses repeat properties, icon disappears
- "아니오" mode: Event keeps repeat properties, icon remains
- Single mode: Only selected instance is modified
- Series mode: All series members are updated
- Edit form shows correct initial values based on mode

Tests:
- All unit tests for edit modes pass
- Integration tests verify UI and behavior
- Existing non-recurring edit tests still pass

## Technical Notes

Finding series members:
```typescript
// Given editingEvent with repeat.id
const seriesMembers = events.filter(e => 
  e.repeat.type !== 'none' && 
  e.repeat.id === editingEvent.repeat.id
);
```

Converting to single event:
```typescript
const updatedEvent = {
  ...editingEvent,
  repeat: {
    type: 'none',
    interval: 1
  }
};
```

## Out of Scope

- Editing individual instance dates/times in series mode (all keep original schedule)
- Partial series updates (e.g., "this and future events")
- Undo/redo for series edits
- Conflict detection when editing series

## Questions to Resolve

1. For series edit, which fields should update?
   - Update: title, description, location, category, notificationTime
   - Keep: date, startTime, endTime (each instance keeps its scheduled time)
   - Keep: repeat.type, repeat.interval, repeat.endDate, repeat.id

2. Should series edit allow changing repeat pattern?
   - For MVP: No, keep repeat pattern unchanged
   - Future: Allow pattern changes (requires regeneration)

