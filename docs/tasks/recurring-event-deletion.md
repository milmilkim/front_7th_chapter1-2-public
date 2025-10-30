# Task: Recurring Event Deletion with Mode Selection

## Goal

Implement delete functionality for recurring events with two modes: single instance deletion and series deletion.

## Background

When user deletes a recurring event, they need to choose:
- Delete only this instance (removes single occurrence)
- Delete entire series (removes all occurrences)

This follows the same pattern as recurring event edit (App.tsx:728-737).

## Requirements

### User Flow

When deleting a recurring event (repeat.type !== 'none'):
1. System detects event is recurring
2. Show confirmation dialog: "해당 일정만 삭제하시겠어요?"
3. User selects mode:
   - "예" (Yes) → Single instance deletion
   - "아니오" (No) → Series deletion

### Single Instance Deletion (Yes)

When user clicks "예":
- Delete only the specific event instance
- Other instances in series remain unchanged
- Use existing DELETE /api/events/{id} endpoint

### Series Deletion (No)

When user clicks "아니오":
- Delete all instances in the series
- Find all events with same repeat.id
- Delete each instance via DELETE /api/events/{id}
- Show single notification after all deletions complete

### Non-Recurring Events

For events with repeat.type === 'none':
- Delete immediately without showing dialog
- Use existing deleteEvent behavior

## Changes Required

### 1. UI Changes

File: src/App.tsx

Add confirmation dialog (similar to recurring edit dialog at lines 728-737):
- State: isRecurringDeleteDialogOpen, pendingDeleteEvent
- Trigger: When deleting event with repeat.type !== 'none'
- Display before executing deletion
- Text: "해당 일정만 삭제하시겠어요?"
- Buttons: "예" / "아니오"

Dialog structure:
```tsx
<Dialog open={isRecurringDeleteDialogOpen} onClose={() => setIsRecurringDeleteDialogOpen(false)}>
  <DialogTitle>반복 일정 삭제</DialogTitle>
  <DialogContent>
    <DialogContentText>해당 일정만 삭제하시겠어요?</DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => handleRecurringDeleteModeSelect('single')}>예</Button>
    <Button onClick={() => handleRecurringDeleteModeSelect('series')}>아니오</Button>
  </DialogActions>
</Dialog>
```

Update delete button handler (currently at line 675):
- Check if event.repeat.type !== 'none'
- If recurring: show dialog, store event in pendingDeleteEvent
- If not recurring: call deleteEvent(event.id) directly

### 2. Delete Logic

File: src/hooks/useEventOperations.ts

Add deleteEventSeries method:
- Input: event with repeat.id
- Find all events with same repeat.id
- Delete each event via DELETE /api/events/{id}
- Return after all deletions complete

```typescript
const deleteEventSeries = async (repeatId: string) => {
  try {
    const seriesMembers = events.filter(
      (e) => e.repeat.type !== 'none' && e.repeat.id === repeatId
    );

    if (seriesMembers.length === 0) {
      throw new Error('No series members found');
    }

    const deletePromises = seriesMembers.map(async (member) => {
      const response = await fetch(`/api/events/${member.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete event ${member.id}`);
      }
    });

    await Promise.all(deletePromises);
    await fetchEvents();
    enqueueSnackbar('일정이 삭제되었습니다.', { variant: 'info' });
  } catch (error) {
    console.error('Error deleting event series:', error);
    enqueueSnackbar('일정 삭제 실패', { variant: 'error' });
  }
};
```

Export deleteEventSeries from useEventOperations.

File: src/App.tsx

Add handler:
```typescript
const handleRecurringDeleteModeSelect = (mode: 'single' | 'series') => {
  setIsRecurringDeleteDialogOpen(false);

  if (pendingDeleteEvent) {
    if (mode === 'single') {
      deleteEvent(pendingDeleteEvent.id);
    } else {
      deleteEventSeries(pendingDeleteEvent.repeat.id!);
    }
    setPendingDeleteEvent(null);
  }
};
```

Add handleDeleteEvent function:
```typescript
const handleDeleteEvent = (event: Event) => {
  if (event.repeat.type !== 'none') {
    setPendingDeleteEvent(event);
    setIsRecurringDeleteDialogOpen(true);
  } else {
    deleteEvent(event.id);
  }
};
```

Update delete button onClick (line 675):
```tsx
<IconButton aria-label="Delete event" onClick={() => handleDeleteEvent(event)}>
```

### 3. API Considerations

Current API: DELETE /api/events/{id}
- Deletes single event

For series deletion:
- Use multiple DELETE calls for each series member
- No new endpoint needed

## Implementation Order

1. Add test cases for delete mode selection
2. Add test cases for single instance deletion
3. Add test cases for series deletion
4. Run tests (should fail - Red phase)
5. Add deleteEventSeries to useEventOperations
6. Add confirmation dialog UI
7. Add handleDeleteEvent and handleRecurringDeleteModeSelect
8. Update delete button onClick handler
9. Run tests (should pass - Green phase)

## Test Scenarios

### Hook Tests

File: src/__tests__/hooks/useEventOperations.spec.ts

Scenarios:
- deleteEventSeries deletes all events with same repeat.id
- deleteEventSeries shows success notification after deletion
- deleteEventSeries shows error notification on failure
- deleteEvent (existing) still works for single events

### Integration Tests

File: src/__tests__/integration/recurring-event-deletion.spec.tsx (new)

Scenarios:
- Delete recurring event, click "예", only instance deleted
- Delete recurring event, click "아니오", all instances deleted
- Delete non-recurring event, no dialog shown
- Dialog appears with correct text and buttons
- Series members count decreases after deletion

## Acceptance Criteria

UI:
- Confirmation dialog appears when deleting recurring event
- Dialog title is "반복 일정 삭제"
- Dialog text is "해당 일정만 삭제하시겠어요?"
- Dialog has "예" and "아니오" buttons
- Non-recurring events delete without dialog

Behavior:
- "예" mode: Only selected instance is deleted
- "아니오" mode: All series members are deleted
- Success notification shows after deletion
- Event list updates after deletion
- Non-recurring deletion unchanged

Tests:
- Hook tests for deleteEventSeries pass
- Integration tests verify dialog and deletion behavior
- Existing deletion tests still pass

## Technical Notes

Finding series members:
```typescript
const seriesMembers = events.filter(e =>
  e.repeat.type !== 'none' &&
  e.repeat.id === event.repeat.id
);
```

State management:
```typescript
const [isRecurringDeleteDialogOpen, setIsRecurringDeleteDialogOpen] = useState(false);
const [pendingDeleteEvent, setPendingDeleteEvent] = useState<Event | null>(null);
```

## Out of Scope

- Undo/redo for deletions
- Partial series deletion ("this and future events")
- Confirmation for non-recurring event deletion
- Batch deletion of multiple events
- Soft delete (trash/archive)

## Reference

Existing patterns in codebase:
- Recurring edit dialog: App.tsx:728-737
- handleRecurringEditModeSelect: App.tsx:136-154
- saveEventSeries: useEventOperations.ts:107-153
- Current deleteEvent: useEventOperations.ts:57-71
