# Task: Fix Recurring Checkbox State Management

## Problem

isRepeating and repeatType are managed independently in event form, causing invalid state.

When user checks recurring checkbox:
- Current: isRepeating=true, repeatType='none'
- Server receives invalid state, returns error
- User must manually select repeat type after checking box

## Root Cause

Line 551 in App.tsx uses generic handleChange:
```typescript
<Checkbox
  checked={editingEvent.isRepeating || false}
  onChange={handleChange}
/>
```

Generic handleChange only sets isRepeating boolean, ignores repeatType dependency.

## Solution

Create handleIsRepeatingChange function in useEventForm hook.

Behavior:
- When checked (true):
  - Set isRepeating = true
  - If repeatType is 'none', set repeatType = 'daily'
  - If repeatType already has value ('daily'/'weekly'/'monthly'/'yearly'), keep it

- When unchecked (false):
  - Set isRepeating = false
  - Set repeatType = 'none'

## Files to Modify

1. src/hooks/useEventForm.ts
   - Add handleIsRepeatingChange function
   - Return it from hook

2. src/App.tsx
   - Line 551: Replace handleChange with handleIsRepeatingChange

## Test Cases

1. Check recurring checkbox when repeatType is 'none'
   - Should set isRepeating=true, repeatType='daily'

2. Check recurring checkbox when repeatType is 'weekly'
   - Should set isRepeating=true, repeatType='weekly' (keep existing)

3. Uncheck recurring checkbox
   - Should set isRepeating=false, repeatType='none'

4. Check, then uncheck recurring checkbox
   - Should return to initial state

## Success Criteria

- No server errors when checking recurring checkbox
- State remains consistent: isRepeating=true requires repeatType != 'none'
- All existing tests pass
- New tests cover handler behavior
