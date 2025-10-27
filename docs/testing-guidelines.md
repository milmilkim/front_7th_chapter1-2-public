# 테스트 코드 작성 가이드라인

이 문서는 Kent Beck의 Test-Driven Development(TDD) 원칙과 React Testing Library 모범 사례를 기반으로 작성되었습니다.

## 역할과 전문성

Kent Beck의 Test-Driven Development(TDD)와 Tidy First 원칙을 따르는 시니어 소프트웨어 엔지니어로서 테스트를 작성합니다. 이 방법론을 정확히 따라 개발을 진행하는 것이 목적입니다.

## 핵심 개발 원칙

- 항상 TDD 사이클을 따릅니다: Red → Green → Refactor
- 먼저 가장 단순한 실패하는 테스트를 작성합니다
- 테스트를 통과시키는 데 필요한 최소한의 코드만 구현합니다
- 테스트가 통과한 후에만 리팩토링을 수행합니다
- Beck의 "Tidy First" 접근법을 따라 구조적 변경과 동작적 변경을 분리합니다
- 개발 전반에 걸쳐 높은 코드 품질을 유지합니다

## TDD 방법론 가이드

- 작은 기능 단위를 정의하는 실패하는 테스트를 먼저 작성합니다
- 동작을 설명하는 의미 있는 테스트 이름을 사용합니다 (예: "shouldSumTwoPositiveNumbers")
- 테스트 실패 메시지를 명확하고 유용하게 만듭니다
- 테스트를 통과시키는 데 필요한 만큼만 코드를 작성합니다 - 더도 말고 덜도 말고
- 테스트가 통과하면 리팩토링이 필요한지 고려합니다
- 새로운 기능을 위해 이 사이클을 반복합니다

## Tidy First 접근법

모든 변경사항을 두 가지 명확한 타입으로 분리합니다:

1. 구조적 변경(STRUCTURAL CHANGES): 동작을 변경하지 않고 코드를 재배치 (이름 변경, 메서드 추출, 코드 이동)
2. 동작적 변경(BEHAVIORAL CHANGES): 실제 기능을 추가하거나 수정

- 구조적 변경과 동작적 변경을 같은 커밋에 절대 섞지 않습니다
- 둘 다 필요할 때는 항상 구조적 변경을 먼저 수행합니다
- 구조적 변경이 동작을 변경하지 않았는지 변경 전후에 테스트를 실행하여 검증합니다

## 커밋 규율

다음의 경우에만 커밋합니다:

1. 모든 테스트가 통과할 때
2. 모든 컴파일러/린터 경고가 해결되었을 때
3. 변경사항이 단일한 논리적 작업 단위를 나타낼 때
4. 커밋 메시지가 구조적 변경인지 동작적 변경인지 명확히 명시할 때

- 크고 드문 커밋보다는 작고 빈번한 커밋을 사용합니다

## 코드 품질 표준

- 중복을 철저히 제거합니다
- 이름과 구조를 통해 의도를 명확히 표현합니다
- 의존성을 명시적으로 만듭니다
- 메서드를 작고 단일 책임에 집중하도록 유지합니다
- 상태와 부작용을 최소화합니다
- 작동 가능한 가장 간단한 솔루션을 사용합니다

## 리팩토링 가이드라인

- 테스트가 통과할 때만 리팩토링합니다 ("Green" 단계에서)
- 적절한 이름을 가진 확립된 리팩토링 패턴을 사용합니다
- 한 번에 하나의 리팩토링 변경만 수행합니다
- 각 리팩토링 단계 후에 테스트를 실행합니다
- 중복을 제거하거나 명확성을 개선하는 리팩토링을 우선합니다

## 워크플로우 예시

새로운 기능에 접근할 때:

1. 기능의 작은 부분에 대한 간단한 실패하는 테스트를 작성합니다
2. 통과시키기 위한 최소한만 구현합니다
3. 테스트를 실행하여 통과를 확인합니다 (Green)
4. 필요한 구조적 변경을 수행하고, 각 변경 후 테스트를 실행합니다
5. 구조적 변경을 별도로 커밋합니다
6. 다음 작은 기능 단위를 위한 또 다른 테스트를 추가합니다
7. 기능이 완료될 때까지 반복하며, 동작적 변경을 구조적 변경과 분리하여 커밋합니다

이 프로세스를 정확히 따르며, 빠른 구현보다 깨끗하고 잘 테스트된 코드를 항상 우선합니다.

한 번에 하나의 테스트만 작성하고, 실행시키고, 그 다음 구조를 개선합니다. 매번 모든 테스트를 실행합니다 (장시간 실행되는 테스트 제외).

## TypeScript 특화 지침

TypeScript에서는 다음 사항을 추가로 고려합니다:

- 타입 안정성을 활용하여 런타임 오류를 컴파일 타임에 잡습니다
- 제네릭을 사용하여 재사용 가능한 타입 안전 컴포넌트를 만듭니다
- any 타입 사용을 피하고 unknown이나 구체적인 타입을 사용합니다
- 함수형 프로그래밍 스타일을 선호하며 불변성을 유지합니다
- Optional Chaining(?.)과 Nullish Coalescing(??)를 활용하여 안전하게 값에 접근합니다
- 타입 가드를 사용하여 타입을 좁히고 안전성을 높입니다

## React Testing Library 모범 사례

### ESLint 플러그인 사용

다음 ESLint 플러그인을 설치하고 사용하여 일반적인 실수를 방지합니다:

- eslint-plugin-testing-library
- eslint-plugin-jest-dom

### wrapper 변수명 사용 금지

```typescript
// 피해야 할 방식
const wrapper = render(<Example prop="1" />)
wrapper.rerender(<Example prop="2" />)

// 권장 방식
const { rerender } = render(<Example prop="1" />)
rerender(<Example prop="2" />)
```

wrapper라는 이름은 enzyme의 오래된 잔재이며 여기서는 필요하지 않습니다. render의 반환값은 무언가를 "감싸는" 것이 아니라 단순히 유틸리티 모음입니다.

### cleanup 사용 금지

```typescript
// 피해야 할 방식
import { render, screen, cleanup } from '@testing-library/react'
afterEach(cleanup)

// 권장 방식
import { render, screen } from '@testing-library/react'
```

cleanup은 이제 자동으로 발생하므로 직접 호출할 필요가 없습니다.

### screen 사용

```typescript
// 피해야 할 방식
const { getByRole } = render(<Example />)
const errorMessageNode = getByRole('alert')

// 권장 방식
render(<Example />)
const errorMessageNode = screen.getByRole('alert')
```

screen을 사용하면 쿼리를 추가하거나 제거할 때 render 호출의 구조 분해를 업데이트할 필요가 없습니다. screen.만 입력하면 에디터의 자동완성이 나머지를 처리합니다.

container나 baseElement를 설정하는 경우에만 예외이지만, 이는 피해야 합니다.

### 쿼리 우선순위

사용자가 콘텐츠와 상호작용하는 방식을 반영하는 쿼리를 우선적으로 사용합니다:

1. 모든 사용자가 접근 가능한 쿼리
   - getByRole: 접근성 트리에 노출된 모든 요소를 쿼리할 수 있습니다. name 옵션을 사용하면 접근 가능한 이름으로 반환된 요소를 필터링할 수 있습니다. 대부분의 경우 선호되는 방식입니다.
   - getByLabelText: 폼 필드에 사용합니다. 사용자가 요소를 찾는 방법을 탐색합니다.
   - getByPlaceholderText: label이 없는 경우 대안이지만 권장되지 않습니다.
   - getByText: 폼 외부의 div, span, 단락에 사용합니다.
   - getByDisplayValue: 폼 요소의 현재 값을 찾을 때 사용합니다.

2. 시맨틱 쿼리
   - getByAltText: img, area, input 등 alt 텍스트를 지원하는 요소에 사용합니다.
   - getByTitle: title 속성이 일관성 없게 읽히지만 사용할 수 있습니다.

3. 테스트 ID
   - getByTestId: role이나 text로 매치할 수 없거나 의미가 없을 때만 사용합니다.

### \*ByRole 쿼리 사용

```typescript
// 피해야 할 방식
// input에 label이 연결되어 있다고 가정
screen.getByLabelText(/username/i)

// 권장 방식
// input에 label이 연결되어 있다고 가정
screen.getByRole('textbox', { name: /username/i })
```

getByRole과 name 옵션을 사용하면 접근성도 테스트하면서 더 견고한 쿼리를 작성할 수 있습니다.

### 여러 요소 쿼리 시 \*AllBy 사용

```typescript
// 피해야 할 방식
screen.getByRole('button')

// 권장 방식 (여러 버튼이 있을 때)
screen.getAllByRole('button')
```

### container를 사용한 쿼리 금지

```typescript
// 피해야 할 방식
const { container } = render(<Example />)
const button = container.querySelector('.btn-primary')

// 권장 방식
render(<Example />)
const button = screen.getByRole('button', { name: /submit/i })
```

container를 직접 쿼리하는 것은 사용자가 페이지와 상호작용하는 방식을 반영하지 않습니다.

### wait\* 함수에서 부작용 실행 금지

```typescript
// 피해야 할 방식
await waitFor(() => {
  fireEvent.keyDown(input, { key: 'ArrowDown' })
  expect(screen.getAllByRole('listitem')).toHaveLength(3)
})

// 권장 방식
fireEvent.keyDown(input, { key: 'ArrowDown' })
await waitFor(() => {
  expect(screen.getAllByRole('listitem')).toHaveLength(3)
})
```

waitFor는 비결정적 시간이 필요한 경우를 위한 것입니다. 콜백이 여러 번 호출될 수 있으므로 부작용이 여러 번 실행될 수 있습니다. 부작용은 waitFor 콜백 외부에 두고 콜백은 단언문만을 위해 사용합니다.

### get\* 변형을 단언문으로 사용

```typescript
// 허용되는 방식
screen.getByRole('alert', { name: /error/i })

// 더 명시적인 방식
expect(screen.getByRole('alert', { name: /error/i })).toBeInTheDocument()
```

get* 쿼리가 요소를 찾지 못하면 유용한 오류 메시지와 함께 throw하므로 단언문 없이도 작동합니다. 하지만 명시적으로 단언하는 것이 코드 의도를 더 명확히 전달합니다.

### waitFor 대신 findBy 사용

```typescript
// 피해야 할 방식
await waitFor(() => {
  expect(screen.getByText('hello')).toBeInTheDocument()
})

// 권장 방식
expect(await screen.findByText('hello')).toBeInTheDocument()
```

findBy 쿼리는 waitFor와 getBy를 결합한 것으로 더 간결합니다.

### 잘못된 단언 조합 사용 금지

```typescript
// 피해야 할 방식
expect(screen.queryByRole('button')).toBeInTheDocument()

// 권장 방식
expect(screen.getByRole('button')).toBeInTheDocument()
```

또는:

```typescript
// 피해야 할 방식
expect(screen.getByRole('button')).not.toBeInTheDocument()

// 권장 방식
expect(screen.queryByRole('button')).not.toBeInTheDocument()
```

queryBy는 요소가 없을 때 null을 반환하므로 존재하지 않음을 확인할 때만 사용합니다. 존재 확인에는 getBy를 사용합니다.

### 쿼리 반환값에서 구조 분해 금지

```typescript
// 피해야 할 방식
const { name } = screen.getByRole('button')

// 권장 방식
const button = screen.getByRole('button')
expect(button).toHaveAccessibleName('submit')
```

### 불필요한 act 경고 무시

act 경고가 발생하면 테스트를 수정하는 것이 맞지만, Testing Library는 이미 필요한 곳에서 act를 사용하므로 직접 추가할 필요가 거의 없습니다.

## 테스트 구조화

### Given-When-Then 패턴

테스트를 명확하게 구조화하기 위해 Given-When-Then 패턴을 사용합니다:

```typescript
test('사용자가 로그인 버튼을 클릭하면 로그인 폼이 표시된다', async () => {
  // Given: 초기 상태 설정
  render(<App />)
  
  // When: 동작 수행
  const loginButton = screen.getByRole('button', { name: /로그인/i })
  await userEvent.click(loginButton)
  
  // Then: 결과 확인
  expect(screen.getByRole('form', { name: /로그인/i })).toBeInTheDocument()
})
```

### 각 테스트는 독립적이어야 함

각 테스트는 다른 테스트의 실행 결과에 의존하지 않고 독립적으로 실행될 수 있어야 합니다.

### 하나의 개념만 테스트

각 테스트는 하나의 개념이나 동작만 테스트해야 합니다. 여러 개념을 테스트해야 한다면 테스트를 분리합니다.

## 비동기 코드 테스트

### userEvent 사용

```typescript
// 피해야 할 방식
import { fireEvent } from '@testing-library/react'
fireEvent.click(button)

// 권장 방식
import userEvent from '@testing-library/user-event'
await userEvent.click(button)
```

userEvent는 fireEvent보다 실제 사용자 상호작용을 더 정확하게 시뮬레이션합니다.

### 비동기 상태 변경 대기

```typescript
// 권장 방식
await waitFor(() => {
  expect(screen.getByText(/loaded/i)).toBeInTheDocument()
})

// 더 나은 방식
expect(await screen.findByText(/loaded/i)).toBeInTheDocument()
```

## Mock과 Stub

### 필요한 경우에만 Mock 사용

실제 구현을 사용할 수 있다면 mock을 사용하지 않습니다. Mock은 통합 테스트의 신뢰도를 낮출 수 있습니다.

### Mock은 명확하게 작성

```typescript
// 권장 방식
const mockOnClick = jest.fn()
render(<Button onClick={mockOnClick}>Click me</Button>)
await userEvent.click(screen.getByRole('button'))
expect(mockOnClick).toHaveBeenCalledTimes(1)
```

### API 호출 Mock

외부 API 호출은 MSW(Mock Service Worker)를 사용하여 mock합니다:

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

## 접근성 테스트

테스트를 작성하면서 자연스럽게 접근성을 검증합니다:

- role을 사용하여 쿼리하면 의미론적 HTML을 사용하도록 강제됩니다
- accessible name을 확인하면 적절한 레이블이 있는지 확인됩니다
- keyboard navigation을 테스트하면 키보드 사용자를 위한 지원을 검증합니다

## 성능 고려사항

### 불필요한 렌더링 방지

테스트에서도 성능을 고려합니다:

```typescript
// 피해야 할 방식
test('multiple renders', () => {
  const { rerender } = render(<Component prop="1" />)
  rerender(<Component prop="2" />)
  rerender(<Component prop="3" />)
  // ...
})

// 권장 방식
test('final state', () => {
  render(<Component prop="3" />)
  // 최종 상태만 테스트
})
```

### 큰 데이터셋 테스트

큰 데이터셋을 테스트할 때는 대표적인 샘플만 사용합니다.

## 디버깅

### screen.debug() 사용

```typescript
render(<Example />)
screen.debug() // 전체 DOM 출력
screen.debug(screen.getByRole('button')) // 특정 요소만 출력
```

### logRoles 사용

```typescript
import { render, logRoles } from '@testing-library/react'

const { container } = render(<Example />)
logRoles(container) // 사용 가능한 모든 role 출력
```

### Testing Playground 사용

브라우저의 Testing Playground 확장 프로그램을 사용하면 최적의 쿼리를 찾을 수 있습니다.

## 에러 메시지 개선

테스트가 실패할 때 명확한 에러 메시지를 제공합니다:

```typescript
// 피해야 할 방식
expect(result).toBe(true)

// 권장 방식
expect(result).toBe(true) // 사용자가 로그인되어야 함
```

또는:

```typescript
expect(result, '사용자가 로그인되어야 함').toBe(true)
```

## 지속적인 개선

- 테스트 커버리지를 정기적으로 확인하지만, 100% 커버리지를 맹목적으로 추구하지 않습니다
- 실패하는 테스트를 발견하면 즉시 수정합니다
- 테스트가 너무 복잡하다면 프로덕션 코드를 리팩토링할 신호입니다
- 팀원들과 테스트 작성 관행을 정기적으로 검토하고 개선합니다

이 가이드라인을 따르면 신뢰할 수 있고 유지보수 가능한 테스트 코드를 작성할 수 있습니다.

