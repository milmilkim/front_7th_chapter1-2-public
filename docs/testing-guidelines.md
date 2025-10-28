# Test Code Writing Guidelines

This document is based on Kent Beck's Test-Driven Development (TDD) principles and React Testing Library best practices.

## Role and Expertise

You write tests as a senior software engineer following Kent Beck's Test-Driven Development (TDD) and Tidy First principles. The goal is to develop precisely following this methodology.

## Core Development Principles

- Always follow the TDD cycle: Red → Green → Refactor
- First write the simplest failing test
- Implement only the minimal code needed to pass the test
- Perform refactoring only after tests pass
- Follow Beck's "Tidy First" approach to separate structural changes from behavioral changes
- Maintain high code quality throughout development

## TDD Methodology Guide

- First write a failing test that defines a small unit of functionality
- Use meaningful test names that describe behavior (e.g., "shouldSumTwoPositiveNumbers")
- Make test failure messages clear and useful
- Write only as much code as needed to pass the test - no more, no less
- Consider whether refactoring is needed when tests pass
- Repeat this cycle for new features

## Tidy First Approach

Separate all changes into two distinct types:

1. STRUCTURAL CHANGES: Rearrange code without changing behavior (rename, extract method, move code)
2. BEHAVIORAL CHANGES: Add or modify actual functionality

- Never mix structural changes and behavioral changes in the same commit
- When both are needed, always perform structural changes first
- Verify that structural changes did not alter behavior by running tests before and after

## Commit Discipline

Commit only when:

1. All tests pass
2. All compiler/linter warnings are resolved
3. Changes represent a single logical unit of work
4. Commit message clearly indicates whether it's a structural or behavioral change

- Use small, frequent commits rather than large, infrequent ones

## Code Quality Standards

- Thoroughly eliminate duplication
- Express intent clearly through names and structure
- Make dependencies explicit
- Keep methods small and focused on single responsibility
- Minimize state and side effects
- Use the simplest solution that works

## Refactoring Guidelines

- Refactor only when tests pass (in the "Green" phase)
- Use established refactoring patterns with appropriate names
- Perform only one refactoring change at a time
- Run tests after each refactoring step
- Prioritize refactoring that removes duplication or improves clarity

## Workflow Example

When approaching a new feature:

1. Write a simple failing test for a small part of the feature
2. Implement only the minimum to make it pass
3. Run tests to confirm passing (Green)
4. Perform necessary structural changes, running tests after each change
5. Commit structural changes separately
6. Add another test for the next small unit of functionality
7. Repeat until feature is complete, committing behavioral changes separately from structural changes

Follow this process precisely, always prioritizing clean, well-tested code over rapid implementation.

Write one test at a time, run it, then improve the structure. Run all tests every time (except long-running tests).

## TypeScript-Specific Guidelines

In TypeScript, consider the following additionally:

- Leverage type safety to catch runtime errors at compile time
- Use generics to create reusable type-safe components
- Avoid any type, use unknown or specific types
- Prefer functional programming style and maintain immutability
- Use Optional Chaining (?.) and Nullish Coalescing (??) to safely access values
- Use type guards to narrow types and increase safety

## React Testing Library Best Practices

### Use ESLint Plugins

Install and use the following ESLint plugins to prevent common mistakes:

- eslint-plugin-testing-library
- eslint-plugin-jest-dom

### Avoid wrapper Variable Name

```typescript
// Avoid
const wrapper = render(<Example prop="1" />)
wrapper.rerender(<Example prop="2" />)

// Recommended
const { rerender } = render(<Example prop="1" />)
rerender(<Example prop="2" />)
```

The name wrapper is an old remnant from enzyme and is unnecessary here. The return value of render is not "wrapping" something but simply a collection of utilities.

### Avoid cleanup

```typescript
// Avoid
import { render, screen, cleanup } from '@testing-library/react'
afterEach(cleanup)

// Recommended
import { render, screen } from '@testing-library/react'
```

cleanup now happens automatically, so you don't need to call it directly.

### Use screen

```typescript
// Avoid
const { getByRole } = render(<Example />)
const errorMessageNode = getByRole('alert')

// Recommended
render(<Example />)
const errorMessageNode = screen.getByRole('alert')
```

Using screen eliminates the need to update destructuring of the render call when adding or removing queries. Just type screen. and editor autocomplete handles the rest.

The only exception is when setting container or baseElement, but this should be avoided.

### Query Priority

Prioritize queries that reflect how users interact with content:

1. Queries accessible to all users
   - getByRole: Can query all elements exposed in the accessibility tree. Using the name option, you can filter returned elements by accessible name. Preferred in most cases.
   - getByLabelText: Use for form fields. Explore how users find elements.
   - getByPlaceholderText: Alternative when label is missing, but not recommended.
   - getByText: Use for div, span, paragraph outside forms.
   - getByDisplayValue: Use to find current value of form elements.

2. Semantic queries
   - getByAltText: Use for elements that support alt text like img, area, input, etc.
   - getByTitle: title attribute is read inconsistently, but can be used.

3. Test ID
   - getByTestId: Use only when you can't match by role or text, or when it doesn't make sense.

### Use \*ByRole Queries

```typescript
// Avoid
// Assuming input has connected label
screen.getByLabelText(/username/i)

// Recommended
// Assuming input has connected label
screen.getByRole('textbox', { name: /username/i })
```

Using getByRole with the name option allows you to write more robust queries while also testing accessibility.

### Use \*AllBy for Multiple Elements

```typescript
// Avoid
screen.getByRole('button')

// Recommended (when multiple buttons exist)
screen.getAllByRole('button')
```

### Avoid Querying with container

```typescript
// Avoid
const { container } = render(<Example />)
const button = container.querySelector('.btn-primary')

// Recommended
render(<Example />)
const button = screen.getByRole('button', { name: /submit/i })
```

Querying container directly does not reflect how users interact with the page.

### Avoid Side Effects in wait\* Functions

```typescript
// Avoid
await waitFor(() => {
  fireEvent.keyDown(input, { key: 'ArrowDown' })
  expect(screen.getAllByRole('listitem')).toHaveLength(3)
})

// Recommended
fireEvent.keyDown(input, { key: 'ArrowDown' })
await waitFor(() => {
  expect(screen.getAllByRole('listitem')).toHaveLength(3)
})
```

waitFor is for cases that require non-deterministic time. Since callbacks can be called multiple times, side effects may execute multiple times. Keep side effects outside waitFor callbacks and use callbacks only for assertions.

### Use get\* Variants as Assertions

```typescript
// Acceptable
screen.getByRole('alert', { name: /error/i })

// More explicit
expect(screen.getByRole('alert', { name: /error/i })).toBeInTheDocument()
```

get* queries throw with useful error messages when elements aren't found, so they work without assertions. However, explicit assertions communicate code intent more clearly.

### Use findBy Instead of waitFor

```typescript
// Avoid
await waitFor(() => {
  expect(screen.getByText('hello')).toBeInTheDocument()
})

// Recommended
expect(await screen.findByText('hello')).toBeInTheDocument()
```

findBy queries combine waitFor and getBy, making them more concise.

### Avoid Incorrect Assertion Combinations

```typescript
// Avoid
expect(screen.queryByRole('button')).toBeInTheDocument()

// Recommended
expect(screen.getByRole('button')).toBeInTheDocument()
```

Or:

```typescript
// Avoid
expect(screen.getByRole('button')).not.toBeInTheDocument()

// Recommended
expect(screen.queryByRole('button')).not.toBeInTheDocument()
```

queryBy returns null when elements don't exist, so use it only to verify non-existence. Use getBy to verify existence.

### Avoid Destructuring Query Return Values

```typescript
// Avoid
const { name } = screen.getByRole('button')

// Recommended
const button = screen.getByRole('button')
expect(button).toHaveAccessibleName('submit')
```

### Ignore Unnecessary act Warnings

While it's correct to fix tests when act warnings occur, Testing Library already uses act where needed, so you rarely need to add it directly.

## Test Structuring

### Given-When-Then Pattern

Use the Given-When-Then pattern to clearly structure tests:

```typescript
test('login form is displayed when user clicks login button', async () => {
  // Given: Set up initial state
  render(<App />)
  
  // When: Perform action
  const loginButton = screen.getByRole('button', { name: /login/i })
  await userEvent.click(loginButton)
  
  // Then: Verify result
  expect(screen.getByRole('form', { name: /login/i })).toBeInTheDocument()
})
```

### Each Test Should Be Independent

Each test should be able to run independently without depending on the execution results of other tests.

### Test Only One Concept

Each test should test only one concept or behavior. If you need to test multiple concepts, separate the tests.

## Testing Asynchronous Code

### Use userEvent

```typescript
// Avoid
import { fireEvent } from '@testing-library/react'
fireEvent.click(button)

// Recommended
import userEvent from '@testing-library/user-event'
await userEvent.click(button)
```

userEvent simulates actual user interactions more accurately than fireEvent.

### Wait for Asynchronous State Changes

```typescript
// Recommended
await waitFor(() => {
  expect(screen.getByText(/loaded/i)).toBeInTheDocument()
})

// Better
expect(await screen.findByText(/loaded/i)).toBeInTheDocument()
```

## Mocks and Stubs

### Use Mocks Only When Necessary

If you can use the real implementation, don't use mocks. Mocks can reduce the reliability of integration tests.

### Write Mocks Clearly

```typescript
// Recommended
const mockOnClick = jest.fn()
render(<Button onClick={mockOnClick}>Click me</Button>)
await userEvent.click(screen.getByRole('button'))
expect(mockOnClick).toHaveBeenCalledTimes(1)
```

### Mock API Calls

Mock external API calls using MSW (Mock Service Worker):

```typescript
import { rest } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  rest.get('/api/user', (req, res, ctx) => {
    return res(ctx.json({ name: 'Test User' }))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

## Accessibility Testing

Naturally verify accessibility while writing tests:

- Querying with role forces use of semantic HTML
- Checking accessible name verifies appropriate labels exist
- Testing keyboard navigation validates support for keyboard users

## Performance Considerations

### Prevent Unnecessary Renders

Consider performance even in tests:

```typescript
// Avoid
test('multiple renders', () => {
  const { rerender } = render(<Component prop="1" />)
  rerender(<Component prop="2" />)
  rerender(<Component prop="3" />)
  // ...
})

// Recommended
test('final state', () => {
  render(<Component prop="3" />)
  // Test only final state
})
```

### Testing Large Datasets

When testing large datasets, use only representative samples.

## Debugging

### Use screen.debug()

```typescript
render(<Example />)
screen.debug() // Print entire DOM
screen.debug(screen.getByRole('button')) // Print specific element only
```

### Use logRoles

```typescript
import { render, logRoles } from '@testing-library/react'

const { container } = render(<Example />)
logRoles(container) // Print all available roles
```

### Use Testing Playground

The browser's Testing Playground extension can help find optimal queries.

## Improve Error Messages

Provide clear error messages when tests fail:

```typescript
// Avoid
expect(result).toBe(true)

// Recommended
expect(result).toBe(true) // User should be logged in
```

Or:

```typescript
expect(result, 'User should be logged in').toBe(true)
```

## Continuous Improvement

- Regularly check test coverage, but don't blindly pursue 100% coverage
- Fix failing tests immediately
- If tests are too complex, it's a signal to refactor production code
- Regularly review and improve test writing practices with team members

Following these guidelines will allow you to write reliable and maintainable test code.

