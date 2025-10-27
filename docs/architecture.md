# 아키텍처 문서

## 기술 스택

### 프론트엔드
- React 19.1.0
- TypeScript 5.2.2
- Vite 7.0.2
- Material-UI 7.2.0
- Emotion (스타일링)
- Framer Motion (애니메이션)
- Notistack (토스트 알림)

### 개발 도구
- Vitest 3.2.4 (테스트 러너)
- React Testing Library 16.3.0
- MSW 2.10.3 (API 모킹)
- ESLint + Prettier

### 백엔드
- Express 4.19.2 (간단한 API 서버)
- Node.js

## 프로젝트 구조

```
src/
├── hooks/              # 커스텀 훅
│   ├── useCalendarView.ts      # 캘린더 뷰 상태 관리
│   ├── useEventForm.ts         # 일정 폼 상태 관리
│   ├── useEventOperations.ts   # 일정 CRUD
│   ├── useNotifications.ts     # 알림 시스템
│   └── useSearch.ts            # 일정 검색
├── utils/              # 유틸리티 함수
│   ├── dateUtils.ts            # 날짜 관련 함수
│   ├── eventOverlap.ts         # 일정 겹침 감지
│   ├── eventUtils.ts           # 일정 관련 함수
│   ├── notificationUtils.ts    # 알림 유틸리티
│   └── timeValidation.ts       # 시간 검증
├── apis/               # API 호출
│   └── fetchHolidays.ts        # 공휴일 API
├── __tests__/          # 테스트 파일
│   ├── hooks/                  # 훅 테스트
│   ├── unit/                   # 유닛 테스트
│   └── medium.integration.spec.tsx  # 통합 테스트
├── __mocks__/          # MSW 핸들러
├── types.ts            # 타입 정의
├── App.tsx             # 메인 컴포넌트
└── main.tsx            # 엔트리 포인트
```

## 데이터 모델

### Event
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
  notificationTime: number; // 분 단위
}
```

### RepeatInfo
```typescript
interface RepeatInfo {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
}
```

## 아키텍처 패턴

### 상태 관리
- 커스텀 훅 기반 상태 관리 (Context API 없이)
- 각 도메인별 훅 분리
- 단방향 데이터 플로우

### 컴포넌트 구조
- 단일 App 컴포넌트 (모놀리식)
- 향후 리팩토링 필요: 컴포넌트 분리

### 비즈니스 로직 분리
- hooks: 상태 관리 및 사이드 이펙트
- utils: 순수 함수 (테스트 용이)
- apis: 외부 API 호출

## API 엔드포인트

### 일정 관리
- GET /api/events - 일정 목록 조회
- POST /api/events - 일정 생성
- PUT /api/events/:id - 일정 수정
- DELETE /api/events/:id - 일정 삭제

### 공휴일
- 외부 API 호출 (fetchHolidays)

## 테스트 전략

### 테스트 레벨
1. Unit: utils 함수들
2. Integration: hooks (useEventOperations, useNotifications 등)
3. E2E: 전체 워크플로우 (향후)

### 테스트 난이도 분류
- easy: 단순 유틸리티 함수, 기본 훅
- medium: 비즈니스 로직이 있는 훅, 통합 테스트

### 커버리지 목표
- 핵심 비즈니스 로직 100%
- UI 인터랙션 주요 시나리오

## 개발 워크플로우

### 스크립트
- pnpm dev: 개발 서버 + API 서버 동시 실행
- pnpm test: 테스트 실행
- pnpm test:ui: Vitest UI
- pnpm test:coverage: 커버리지 리포트
- pnpm lint: ESLint + TypeScript 체크

### TDD 사이클
1. 실패하는 테스트 작성
2. 최소한의 코드로 테스트 통과
3. 리팩토링
4. 커밋

## 코딩 컨벤션

### 파일명
- 컴포넌트: PascalCase.tsx
- 훅: camelCase.ts (use 접두사)
- 유틸: camelCase.ts
- 테스트: *.spec.ts 또는 *.spec.tsx

### 타입
- 인터페이스 우선 (필요시 type 사용)
- any 금지, unknown 사용
- 명시적 타입 정의

### 함수
- 순수 함수 지향
- 단일 책임 원칙
- 명확한 함수명 (동사 + 명사)

## 의존성 관리

패키지 매니저: pnpm

### 주의사항
- React 19.1.0은 비교적 최신 버전
- Testing Library는 16.3.0으로 React 19 호환
- MUI 7.2.0도 최신 버전

## 향후 개선 사항

1. 컴포넌트 분리 (App.tsx 너무 큼)
2. 상태 관리 라이브러리 도입 검토 (필요시)
3. 반복 일정 기능 구현
4. E2E 테스트 추가
5. 접근성 개선
6. 성능 최적화 (React.memo, useMemo 등)

