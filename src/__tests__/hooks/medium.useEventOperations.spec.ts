import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../../__mocks__/handlersUtils.ts';
import { useEventOperations } from '../../hooks/useEventOperations.ts';
import { server } from '../../setupTests.ts';
import { Event } from '../../types.ts';

const enqueueSnackbarFn = vi.fn();

vi.mock('notistack', async () => {
  const actual = await vi.importActual('notistack');
  return {
    ...actual,
    useSnackbar: () => ({
      enqueueSnackbar: enqueueSnackbarFn,
    }),
  };
});

it('저장되어있는 초기 이벤트 데이터를 적절하게 불러온다', async () => {
  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  expect(result.current.events).toEqual([
    {
      id: '1',
      title: '기존 회의',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    },
  ]);
});

it('정의된 이벤트 정보를 기준으로 적절하게 저장이 된다', async () => {
  setupMockHandlerCreation(); // ? Med: 이걸 왜 써야하는지 물어보자

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  const newEvent: Event = {
    id: '1',
    title: '새 회의',
    date: '2025-10-16',
    startTime: '11:00',
    endTime: '12:00',
    description: '새로운 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };

  await act(async () => {
    await result.current.saveEvent(newEvent);
  });

  expect(result.current.events).toEqual([{ ...newEvent, id: '1' }]);
});

it("새로 정의된 'title', 'endTime' 기준으로 적절하게 일정이 업데이트 된다", async () => {
  setupMockHandlerUpdating();

  const { result } = renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  const updatedEvent: Event = {
    id: '1',
    date: '2025-10-15',
    startTime: '09:00',
    description: '기존 팀 미팅',
    location: '회의실 B',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
    title: '수정된 회의',
    endTime: '11:00',
  };

  await act(async () => {
    await result.current.saveEvent(updatedEvent);
  });

  expect(result.current.events[0]).toEqual(updatedEvent);
});

it('존재하는 이벤트 삭제 시 에러없이 아이템이 삭제된다.', async () => {
  setupMockHandlerDeletion();

  const { result } = renderHook(() => useEventOperations(false));

  await act(async () => {
    await result.current.deleteEvent('1');
  });

  await act(() => Promise.resolve(null));

  expect(result.current.events).toEqual([]);
});

it("이벤트 로딩 실패 시 '이벤트 로딩 실패'라는 텍스트와 함께 에러 토스트가 표시되어야 한다", async () => {
  server.use(
    http.get('/api/events', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('이벤트 로딩 실패', { variant: 'error' });

  server.resetHandlers();
});

it("존재하지 않는 이벤트 수정 시 '일정 저장 실패'라는 토스트가 노출되며 에러 처리가 되어야 한다", async () => {
  const { result } = renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  const nonExistentEvent: Event = {
    id: '999', // 존재하지 않는 ID
    title: '존재하지 않는 이벤트',
    date: '2025-07-20',
    startTime: '09:00',
    endTime: '10:00',
    description: '이 이벤트는 존재하지 않습니다',
    location: '어딘가',
    category: '기타',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };

  await act(async () => {
    await result.current.saveEvent(nonExistentEvent);
  });

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 저장 실패', { variant: 'error' });
});

it("네트워크 오류 시 '일정 삭제 실패'라는 텍스트가 노출되며 이벤트 삭제가 실패해야 한다", async () => {
  server.use(
    http.delete('/api/events/:id', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  await act(async () => {
    await result.current.deleteEvent('1');
  });

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 삭제 실패', { variant: 'error' });

  expect(result.current.events).toHaveLength(1);
});

describe('반복 이벤트 (Recurring Events)', () => {
  describe('반복 이벤트 생성', () => {
    it('daily 반복 이벤트 생성 시 여러 개의 이벤트가 생성되고 POST /api/events-list가 호출된다', async () => {
      // TODO: 테스트 코드 작성 에이전트가 구현
      // Given: baseEvent with daily repeat, interval 3, endDate '2025-01-24'
      // When: saveEvent 호출
      // Then: generateRecurringEvents가 호출되어 여러 이벤트 생성, POST /api/events-list로 bulk create, events 상태 업데이트
    });

    it('weekly 반복 이벤트를 interval 2로 생성하면 올바른 날짜에 이벤트가 생성된다', async () => {
      // TODO: 테스트 코드 작성 에이전트가 구현
      // Given: baseEvent with weekly repeat, interval 2, date '2025-01-06' (Monday), endDate '2025-02-17'
      // When: saveEvent 호출
      // Then: 2주 간격으로 같은 요일에 이벤트 생성 (1/6, 1/20, 2/3, 2/17)
    });

    it('monthly 반복 이벤트를 31일로 생성하면 31일이 있는 달에만 이벤트가 생성된다', async () => {
      // TODO: 테스트 코드 작성 에이전트가 구현
      // Given: baseEvent with monthly repeat, interval 1, date '2025-01-31', endDate '2025-06-30'
      // When: saveEvent 호출
      // Then: 31일이 있는 달에만 이벤트 생성 (1월, 3월, 5월만 포함)
    });

    it('yearly 반복 이벤트를 2월 29일로 생성하면 윤년에만 이벤트가 생성된다', async () => {
      // TODO: 테스트 코드 작성 에이전트가 구현
      // Given: baseEvent with yearly repeat, interval 1, date '2024-02-29', endDate '2028-03-01'
      // When: saveEvent 호출
      // Then: 윤년에만 이벤트 생성 (2024, 2028만 포함)
    });

    it('반복 이벤트 생성 시 모든 이벤트가 동일한 repeatId를 공유한다', async () => {
      // TODO: 테스트 코드 작성 에이전트가 구현
      // Given: baseEvent with any repeat type
      // When: saveEvent 호출
      // Then: 생성된 모든 이벤트의 repeat.id가 동일하고, 각 이벤트의 id는 고유함
    });
  });

  describe('반복 이벤트 수정', () => {
    it('반복 이벤트 시리즈 중 단일 이벤트 수정 시 해당 이벤트만 수정되고 repeatId는 유지된다', async () => {
      // TODO: 테스트 코드 작성 에이전트가 구현
      // Given: 5개의 반복 이벤트가 존재하고, 3번째 이벤트를 수정
      // When: saveEvent로 3번째 이벤트의 title 수정
      // Then: PUT /api/events/:id 호출, 해당 이벤트만 수정, 나머지 이벤트는 변경 없음, repeatId 유지
    });
  });

  describe('반복 이벤트 삭제', () => {
    it('반복 이벤트 시리즈에서 현재 및 이후 이벤트 삭제 시 올바른 이벤트들이 삭제된다', async () => {
      // TODO: 테스트 코드 작성 에이전트가 구현
      // Given: 10개의 반복 이벤트가 존재 (같은 repeatId)
      // When: 5번째 이벤트에서 deleteEvent 호출
      // Then: DELETE /api/events-list 호출, 5번째부터 10번째까지 삭제, 1-4번째 이벤트는 유지
    });
  });

  describe('에러 처리', () => {
    it('반복 이벤트 생성 시 API 실패하면 에러 토스트가 표시되고 이벤트가 생성되지 않는다', async () => {
      // TODO: 테스트 코드 작성 에이전트가 구현
      // Given: POST /api/events-list가 500 에러 반환하도록 MSW 설정
      // When: 반복 이벤트 생성 시도
      // Then: '반복 일정 생성 실패' 토스트 표시, events 상태 변경 없음
    });

    it('최대 발생 횟수를 초과하면 경고 토스트가 표시된다', async () => {
      // TODO: 테스트 코드 작성 에이전트가 구현
      // Given: daily 반복 이벤트, 종료 날짜 없음 (1000개 초과 예상)
      // When: saveEvent 호출
      // Then: 1000개 이벤트만 생성, '최대 1000개 일정까지 생성 가능합니다' 경고 토스트 표시
    });
  });
});
