# Task: Display Recurring Events with Icon

## Goal

Add visual indicator (icon) to distinguish recurring events in calendar view.

## Changes Required

### 1. Icon Display
- Add Repeat icon from MUI Icons to recurring events
- Position: Next to event title in calendar cells
- Condition: Show when event.repeat.type !== 'none'
- Icon: `<Repeat />` from '@mui/icons-material'

### 2. Files to Modify
- src/App.tsx: Add icon to event rendering in calendar view
  - Monthly view: Inside event cells (around line 560-580)
  - Weekly view: Inside event cells (around line 610-630)

### 3. Implementation Details
- Import Repeat icon from MUI
- Add conditional rendering: `{event.repeat.type !== 'none' && <Repeat fontSize="small" />}`
- Style: Small size, inline with title text
- Maintain existing event display logic

## Test Cases

### Integration Tests
1. Recurring event shows Repeat icon in monthly view
2. Recurring event shows Repeat icon in weekly view  
3. Non-recurring event does not show icon
4. Icon appears for all repeat types (daily, weekly, monthly, yearly)

### Visual Verification
- Icon is visible but not intrusive
- Icon aligns with event title
- Icon distinguishes recurring from regular events

## Acceptance Criteria

- [ ] Repeat icon imported from MUI
- [ ] Icon displays only for recurring events (repeat.type !== 'none')
- [ ] Icon appears in both monthly and weekly calendar views
- [ ] Tests verify icon presence/absence based on event type
- [ ] Existing event functionality unchanged

