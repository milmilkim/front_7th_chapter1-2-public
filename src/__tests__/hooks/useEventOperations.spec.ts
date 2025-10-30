import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../../__mocks__/handlersUtils.ts';
import { useEventOperations } from '../../hooks/useEventOperations.ts';
import { server } from '../../setupTests.ts';
import { Event, EventForm } from '../../types.ts';

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
      // Given: API 모킹 및 초기 상태
      let capturedEventsRequest: EventForm[] | null = null;
      const mockEvents: Event[] = [];

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: mockEvents });
        }),
        http.post('/api/events-list', async ({ request }) => {
          const body = (await request.json()) as { events: EventForm[] };
          capturedEventsRequest = body.events;

          const newEvents = body.events.map((event, index) => ({
            ...event,
            id: String(mockEvents.length + index + 1),
          }));
          mockEvents.push(...newEvents);
          return HttpResponse.json({ events: newEvents }, { status: 201 });
        })
      );

      const { result } = renderHook(() => useEventOperations(false));
      await act(() => Promise.resolve(null));

      const baseEvent: EventForm = {
        title: 'Daily 회의',
        date: '2025-11-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '매일 회의',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-11-05' },
        notificationTime: 10,
      };

      // When: saveEventList 호출
      await act(async () => {
        await result.current.saveEventList([baseEvent]);
      });

      // Then: 여러 이벤트가 생성되고 API가 호출됨
      expect(capturedEventsRequest).not.toBeNull();
      expect(capturedEventsRequest).toHaveLength(5);
      expect(result.current.events).toHaveLength(5);
      expect(result.current.events[0].date).toBe('2025-11-01');
      expect(result.current.events[4].date).toBe('2025-11-05');

      server.resetHandlers();
    });

    it('weekly 반복 이벤트를 interval 2로 생성하면 올바른 날짜에 이벤트가 생성된다', async () => {
      // Given: API 모킹
      const mockEvents: Event[] = [];

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: mockEvents });
        }),
        http.post('/api/events-list', async ({ request }) => {
          const body = (await request.json()) as { events: EventForm[] };
          const newEvents = body.events.map((event, index) => ({
            ...event,
            id: String(mockEvents.length + index + 1),
          }));
          mockEvents.push(...newEvents);
          return HttpResponse.json({ events: newEvents }, { status: 201 });
        })
      );

      const { result } = renderHook(() => useEventOperations(false));
      await act(() => Promise.resolve(null));

      const baseEvent: EventForm = {
        title: '격주 회의',
        date: '2025-11-03',
        startTime: '09:00',
        endTime: '10:00',
        description: '2주마다 회의',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 2, endDate: '2025-12-01' },
        notificationTime: 10,
      };

      // When: saveEventList 호출
      await act(async () => {
        await result.current.saveEventList([baseEvent]);
      });

      // Then: 2주 간격으로 이벤트 생성
      expect(result.current.events).toHaveLength(3);
      expect(result.current.events[0].date).toBe('2025-11-03');
      expect(result.current.events[1].date).toBe('2025-11-17');
      expect(result.current.events[2].date).toBe('2025-12-01');

      server.resetHandlers();
    });

    it('monthly 반복 이벤트를 31일로 생성하면 31일이 있는 달에만 이벤트가 생성된다', async () => {
      // Given: API 모킹
      const mockEvents: Event[] = [];

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: mockEvents });
        }),
        http.post('/api/events-list', async ({ request }) => {
          const body = (await request.json()) as { events: EventForm[] };
          const newEvents = body.events.map((event, index) => ({
            ...event,
            id: String(mockEvents.length + index + 1),
          }));
          mockEvents.push(...newEvents);
          return HttpResponse.json({ events: newEvents }, { status: 201 });
        })
      );

      const { result } = renderHook(() => useEventOperations(false));
      await act(() => Promise.resolve(null));

      const baseEvent: EventForm = {
        title: '월말 회의',
        date: '2025-01-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '매월 31일 회의',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-06-30' },
        notificationTime: 10,
      };

      // When: saveEventList 호출
      await act(async () => {
        await result.current.saveEventList([baseEvent]);
      });

      // Then: 31일이 있는 달에만 이벤트 생성 (1월, 3월, 5월)
      expect(result.current.events).toHaveLength(3);
      expect(result.current.events[0].date).toBe('2025-01-31');
      expect(result.current.events[1].date).toBe('2025-03-31');
      expect(result.current.events[2].date).toBe('2025-05-31');

      server.resetHandlers();
    });

    it('yearly 반복 이벤트를 2월 29일로 생성하면 윤년에만 이벤트가 생성된다', async () => {
      // Given: API 모킹
      const mockEvents: Event[] = [];

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: mockEvents });
        }),
        http.post('/api/events-list', async ({ request }) => {
          const body = (await request.json()) as { events: EventForm[] };
          const newEvents = body.events.map((event, index) => ({
            ...event,
            id: String(mockEvents.length + index + 1),
          }));
          mockEvents.push(...newEvents);
          return HttpResponse.json({ events: newEvents }, { status: 201 });
        })
      );

      const { result } = renderHook(() => useEventOperations(false));
      await act(() => Promise.resolve(null));

      const baseEvent: EventForm = {
        title: '윤년 기념일',
        date: '2020-02-29',
        startTime: '09:00',
        endTime: '10:00',
        description: '2월 29일 기념일',
        location: '회의실 A',
        category: '개인',
        repeat: { type: 'yearly', interval: 1, endDate: '2024-03-01' },
        notificationTime: 10,
      };

      // When: saveEventList 호출
      await act(async () => {
        await result.current.saveEventList([baseEvent]);
      });

      // Then: 윤년에만 이벤트 생성 (2020, 2024)
      expect(result.current.events).toHaveLength(2);
      expect(result.current.events[0].date).toBe('2020-02-29');
      expect(result.current.events[1].date).toBe('2024-02-29');

      server.resetHandlers();
    });

    it('반복 이벤트 생성 시 모든 이벤트가 동일한 repeatId를 공유한다', async () => {
      // Given: API 모킹
      let capturedEvents: Event[] | null = null;

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [] });
        }),
        http.post('/api/events-list', async ({ request }) => {
          const body = (await request.json()) as { events: EventForm[] };
          const newEvents = body.events.map((event, index) => ({
            ...event,
            id: String(index + 1),
          }));
          capturedEvents = newEvents;
          return HttpResponse.json({ events: newEvents }, { status: 201 });
        })
      );

      const { result } = renderHook(() => useEventOperations(false));
      await act(() => Promise.resolve(null));

      const baseEvent: EventForm = {
        title: 'Daily 회의',
        date: '2025-11-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '매일 회의',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-11-05' },
        notificationTime: 10,
      };

      // When: saveEventList 호출
      await act(async () => {
        await result.current.saveEventList([baseEvent]);
      });

      // Then: 모든 이벤트가 동일한 repeat.id 공유
      expect(capturedEvents).not.toBeNull();
      const repeatIds = capturedEvents!.map((e) => e.repeat.id);
      const uniqueRepeatIds = new Set(repeatIds);
      expect(uniqueRepeatIds.size).toBe(1);
      expect(repeatIds[0]).toBeDefined();

      server.resetHandlers();
    });

    it('반복 이벤트 생성 시 일정 겹침 검사를 건너뛴다', async () => {
      // Given: 기존 이벤트와 겹치는 시간에 반복 이벤트 생성
      const mockEvents: Event[] = [
        {
          id: '1',
          title: '기존 회의',
          date: '2025-11-01',
          startTime: '09:00',
          endTime: '10:00',
          description: '기존 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        },
      ];

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: mockEvents });
        }),
        http.post('/api/events-list', async ({ request }) => {
          const body = (await request.json()) as { events: EventForm[] };
          const newEvents = body.events.map((event, index) => ({
            ...event,
            id: String(mockEvents.length + index + 1),
          }));
          mockEvents.push(...newEvents);
          return HttpResponse.json({ events: newEvents }, { status: 201 });
        })
      );

      const { result } = renderHook(() => useEventOperations(false));
      await act(() => Promise.resolve(null));

      const baseEvent: EventForm = {
        title: '반복 회의',
        date: '2025-11-01',
        startTime: '09:30',
        endTime: '10:30',
        description: '기존 회의와 겹침',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-11-03' },
        notificationTime: 10,
      };

      // When: saveEventList 호출 (겹침 검사 없이)
      await act(async () => {
        await result.current.saveEventList([baseEvent]);
      });

      // Then: 겹침 검사 없이 정상 생성
      expect(result.current.events).toHaveLength(4); // 기존 1개 + 새로운 3개
      expect(enqueueSnackbarFn).not.toHaveBeenCalledWith(
        expect.stringContaining('겹침'),
        expect.anything()
      );

      server.resetHandlers();
    });
  });

  describe('에러 처리', () => {
    it('반복 이벤트 생성 시 API 실패하면 에러 토스트가 표시되고 이벤트가 생성되지 않는다', async () => {
      // Given: API 실패 모킹
      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [] });
        }),
        http.post('/api/events-list', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const { result } = renderHook(() => useEventOperations(false));
      await act(() => Promise.resolve(null));

      const baseEvent: EventForm = {
        title: 'Daily 회의',
        date: '2025-11-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '매일 회의',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-11-05' },
        notificationTime: 10,
      };

      // When: saveEventList 호출
      await act(async () => {
        await result.current.saveEventList([baseEvent]);
      });

      // Then: 에러 토스트 표시 및 이벤트 미생성
      expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 목록 저장 실패', {
        variant: 'error',
      });
      expect(result.current.events).toHaveLength(0);

      server.resetHandlers();
    });
  });

  describe('반복 일정 삭제', () => {
    it('deleteEventSeries 호출 시 동일한 repeat.id를 가진 모든 일정이 삭제된다', async () => {
      // Given: 동일한 repeat.id를 가진 반복 일정과 다른 repeat.id를 가진 일정 설정
      const recurringEvents: Event[] = [
        {
          id: '1',
          title: '반복 회의',
          date: '2025-10-15',
          startTime: '09:00',
          endTime: '10:00',
          description: '매일 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-20', id: 'repeat-1' },
          notificationTime: 10,
        },
        {
          id: '2',
          title: '반복 회의',
          date: '2025-10-16',
          startTime: '09:00',
          endTime: '10:00',
          description: '매일 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-20', id: 'repeat-1' },
          notificationTime: 10,
        },
        {
          id: '3',
          title: '반복 회의',
          date: '2025-10-17',
          startTime: '09:00',
          endTime: '10:00',
          description: '매일 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-20', id: 'repeat-1' },
          notificationTime: 10,
        },
        {
          id: '4',
          title: '다른 반복 회의',
          date: '2025-10-15',
          startTime: '14:00',
          endTime: '15:00',
          description: '다른 시리즈',
          location: '회의실 B',
          category: '업무',
          repeat: { type: 'weekly', interval: 1, endDate: '2025-10-29', id: 'repeat-2' },
          notificationTime: 10,
        },
      ];

      const remainingEvents = recurringEvents.filter((e) => e.repeat.id !== 'repeat-1');

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: recurringEvents });
        }),
        http.delete('/api/recurring-events/:repeatId', () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      const { result } = renderHook(() => useEventOperations(false));
      await act(() => Promise.resolve(null));

      // When: deleteEventSeries 호출
      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: remainingEvents });
        })
      );

      await act(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hook = result.current as any;
        if (hook.deleteEventSeries) {
          await hook.deleteEventSeries('repeat-1');
        }
      });

      // Then: repeat.id가 'repeat-1'인 일정만 삭제됨
      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0].id).toBe('4');
      expect(result.current.events[0].repeat.id).toBe('repeat-2');

      server.resetHandlers();
    });

    it('deleteEventSeries 호출 시 다른 repeat.id를 가진 일정은 삭제되지 않는다', async () => {
      // Given: 여러 반복 일정 시리즈 설정
      const recurringEvents: Event[] = [
        {
          id: '1',
          title: '반복 회의 A',
          date: '2025-10-15',
          startTime: '09:00',
          endTime: '10:00',
          description: '시리즈 A',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-17', id: 'repeat-1' },
          notificationTime: 10,
        },
        {
          id: '2',
          title: '반복 회의 A',
          date: '2025-10-16',
          startTime: '09:00',
          endTime: '10:00',
          description: '시리즈 A',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-17', id: 'repeat-1' },
          notificationTime: 10,
        },
        {
          id: '3',
          title: '반복 회의 B',
          date: '2025-10-15',
          startTime: '14:00',
          endTime: '15:00',
          description: '시리즈 B',
          location: '회의실 B',
          category: '업무',
          repeat: { type: 'weekly', interval: 1, endDate: '2025-10-29', id: 'repeat-2' },
          notificationTime: 10,
        },
        {
          id: '4',
          title: '반복 회의 B',
          date: '2025-10-22',
          startTime: '14:00',
          endTime: '15:00',
          description: '시리즈 B',
          location: '회의실 B',
          category: '업무',
          repeat: { type: 'weekly', interval: 1, endDate: '2025-10-29', id: 'repeat-2' },
          notificationTime: 10,
        },
      ];

      const remainingEvents = recurringEvents.filter((e) => e.repeat.id !== 'repeat-1');

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: recurringEvents });
        }),
        http.delete('/api/recurring-events/:repeatId', () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      const { result } = renderHook(() => useEventOperations(false));
      await act(() => Promise.resolve(null));

      // When: repeat-1 시리즈 삭제
      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: remainingEvents });
        })
      );

      await act(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hook = result.current as any;
        if (hook.deleteEventSeries) {
          await hook.deleteEventSeries('repeat-1');
        }
      });

      // Then: repeat-2 시리즈는 그대로 유지됨
      expect(result.current.events).toHaveLength(2);
      expect(result.current.events.every((e) => e.repeat.id === 'repeat-2')).toBe(true);
      expect(result.current.events[0].title).toBe('반복 회의 B');
      expect(result.current.events[1].title).toBe('반복 회의 B');

      server.resetHandlers();
    });

    it('deleteEventSeries 호출 시 성공 알림이 표시된다', async () => {
      // Given: 반복 일정 시리즈 설정
      const recurringEvents: Event[] = [
        {
          id: '1',
          title: '반복 회의',
          date: '2025-10-15',
          startTime: '09:00',
          endTime: '10:00',
          description: '매일 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-17', id: 'repeat-1' },
          notificationTime: 10,
        },
        {
          id: '2',
          title: '반복 회의',
          date: '2025-10-16',
          startTime: '09:00',
          endTime: '10:00',
          description: '매일 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-17', id: 'repeat-1' },
          notificationTime: 10,
        },
      ];

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: recurringEvents });
        }),
        http.delete('/api/recurring-events/:repeatId', () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      const { result } = renderHook(() => useEventOperations(false));
      await act(() => Promise.resolve(null));

      enqueueSnackbarFn.mockClear();

      // When: deleteEventSeries 호출
      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [] });
        })
      );

      await act(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hook = result.current as any;
        if (hook.deleteEventSeries) {
          await hook.deleteEventSeries('repeat-1');
        }
      });

      // Then: 성공 알림 표시
      expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정이 삭제되었습니다.', {
        variant: 'info',
      });

      server.resetHandlers();
    });

    it('deleteEventSeries 호출 시 API 실패하면 에러 알림이 표시된다', async () => {
      // Given: 반복 일정 시리즈 설정
      const recurringEvents: Event[] = [
        {
          id: '1',
          title: '반복 회의',
          date: '2025-10-15',
          startTime: '09:00',
          endTime: '10:00',
          description: '매일 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-17', id: 'repeat-1' },
          notificationTime: 10,
        },
      ];

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: recurringEvents });
        }),
        http.delete('/api/recurring-events/:repeatId', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const { result } = renderHook(() => useEventOperations(false));
      await act(() => Promise.resolve(null));

      enqueueSnackbarFn.mockClear();

      // When: deleteEventSeries 호출 (API 실패)
      await act(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hook = result.current as any;
        if (hook.deleteEventSeries) {
          await hook.deleteEventSeries('repeat-1');
        }
      });

      // Then: 에러 알림 표시
      expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 삭제 실패', { variant: 'error' });

      server.resetHandlers();
    });

    it('일반 일정 삭제 시 기존 deleteEvent 동작이 유지된다', async () => {
      // Given: 일반 일정 설정
      setupMockHandlerDeletion();

      const { result } = renderHook(() => useEventOperations(false));
      await act(() => Promise.resolve(null));

      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0].title).toBe('삭제할 이벤트');

      enqueueSnackbarFn.mockClear();

      // When: deleteEvent 호출
      await act(async () => {
        await result.current.deleteEvent('1');
      });

      // Then: 일정이 삭제되고 성공 알림 표시
      expect(result.current.events).toHaveLength(0);
      expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정이 삭제되었습니다.', {
        variant: 'info',
      });
    });
  });

  describe('반복 일정 수정', () => {
    it('단일 수정 모드로 반복 일정 수정 시 repeat.type이 none으로 변경된다', async () => {
      const recurringEvent: Event = {
        id: '1',
        title: '반복 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '매일 회의',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-10-20', id: 'repeat-1' },
        notificationTime: 10,
      };

      let capturedRequest: Event | null = null;

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [recurringEvent] });
        }),
        http.put('/api/events/:id', async ({ request }) => {
          const body = (await request.json()) as Event;
          capturedRequest = body;
          return HttpResponse.json(body);
        })
      );

      const { result } = renderHook(() => useEventOperations(true));
      await act(() => Promise.resolve(null));

      const updatedEvent: Event = {
        ...recurringEvent,
        title: '수정된 회의',
        repeat: { type: 'none', interval: 0 },
      };

      await act(async () => {
        await result.current.saveEvent(updatedEvent);
      });

      expect(capturedRequest).not.toBeNull();
      expect((capturedRequest as unknown as Event).repeat.type).toBe('none');
    });

    it('단일 수정 모드로 반복 일정 수정 시 다른 반복 일정 인스턴스는 변경되지 않는다', async () => {
      const recurringEvents: Event[] = [
        {
          id: '1',
          title: '반복 회의',
          date: '2025-10-15',
          startTime: '09:00',
          endTime: '10:00',
          description: '매일 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-20', id: 'repeat-1' },
          notificationTime: 10,
        },
        {
          id: '2',
          title: '반복 회의',
          date: '2025-10-16',
          startTime: '09:00',
          endTime: '10:00',
          description: '매일 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-20', id: 'repeat-1' },
          notificationTime: 10,
        },
      ];

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: recurringEvents });
        }),
        http.put('/api/events/:id', async ({ params }) => {
          const id = params.id as string;
          const updated = {
            ...recurringEvents.find((e) => e.id === id)!,
            title: '수정된 회의',
            repeat: { type: 'none', interval: 0 },
          };
          return HttpResponse.json(updated);
        })
      );

      const { result } = renderHook(() => useEventOperations(true));
      await act(() => Promise.resolve(null));

      const updatedEvent: Event = {
        ...recurringEvents[0],
        title: '수정된 회의',
        repeat: { type: 'none', interval: 0 },
      };

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({
            events: [updatedEvent, recurringEvents[1]],
          });
        })
      );

      await act(async () => {
        await result.current.saveEvent(updatedEvent);
      });

      expect(result.current.events).toHaveLength(2);
      expect(result.current.events[0].repeat.type).toBe('none');
      expect(result.current.events[1].repeat.type).toBe('daily');
    });

    it('전체 수정 모드로 반복 일정 수정 시 repeat 속성이 유지된다', async () => {
      const recurringEvent: Event = {
        id: '1',
        title: '반복 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '매일 회의',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-10-20', id: 'repeat-1' },
        notificationTime: 10,
      };

      let capturedRequest: Event | null = null;

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [recurringEvent] });
        }),
        http.put('/api/events/:id', async ({ request }) => {
          const body = (await request.json()) as Event;
          capturedRequest = body;
          return HttpResponse.json(body);
        })
      );

      const { result } = renderHook(() => useEventOperations(true));
      await act(() => Promise.resolve(null));

      const updatedEvent: Event = {
        ...recurringEvent,
        title: '수정된 반복 회의',
      };

      await act(async () => {
        await result.current.saveEvent(updatedEvent);
      });

      expect(capturedRequest).not.toBeNull();
      expect((capturedRequest as unknown as Event).repeat.type).toBe('daily');
      expect((capturedRequest as unknown as Event).repeat.id).toBe('repeat-1');
    });

    it('전체 수정 모드로 반복 일정 수정 시 동일한 repeat.id를 가진 모든 일정이 업데이트된다', async () => {
      const recurringEvents: Event[] = [
        {
          id: '1',
          title: '반복 회의',
          date: '2025-10-15',
          startTime: '09:00',
          endTime: '10:00',
          description: '매일 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-20', id: 'repeat-1' },
          notificationTime: 10,
        },
        {
          id: '2',
          title: '반복 회의',
          date: '2025-10-16',
          startTime: '09:00',
          endTime: '10:00',
          description: '매일 회의',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'daily', interval: 1, endDate: '2025-10-20', id: 'repeat-1' },
          notificationTime: 10,
        },
        {
          id: '3',
          title: '다른 반복 회의',
          date: '2025-10-15',
          startTime: '14:00',
          endTime: '15:00',
          description: '다른 시리즈',
          location: '회의실 B',
          category: '업무',
          repeat: { type: 'weekly', interval: 1, endDate: '2025-10-29', id: 'repeat-2' },
          notificationTime: 10,
        },
      ];

      let updateCalled = false;

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: recurringEvents });
        }),
        http.put('/api/recurring-events/:repeatId', async () => {
          updateCalled = true;
          return HttpResponse.json([]);
        })
      );

      const { result } = renderHook(() => useEventOperations(true));
      await act(() => Promise.resolve(null));

      const updatedEvent: Event = {
        ...recurringEvents[0],
        title: '수정된 반복 회의',
      };

      const updatedEvents = recurringEvents.map((e) =>
        e.repeat.id === 'repeat-1' ? { ...e, title: '수정된 반복 회의' } : e
      );

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: updatedEvents });
        })
      );

      await act(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hook = result.current as any;
        if (hook.saveEventSeries) {
          await hook.saveEventSeries(updatedEvent);
        }
      });

      expect(updateCalled).toBe(true);
      expect(result.current.events.filter((e) => e.title === '수정된 반복 회의')).toHaveLength(2);
      expect(result.current.events.find((e) => e.id === '3')?.title).toBe('다른 반복 회의');
    });

    it('일반 일정 수정 시 기존 동작을 유지한다', async () => {
      const normalEvent: Event = {
        id: '1',
        title: '일반 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '한 번만 진행',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      };

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [normalEvent] });
        }),
        http.put('/api/events/:id', async ({ request }) => {
          const body = (await request.json()) as Event;
          return HttpResponse.json(body);
        })
      );

      const { result } = renderHook(() => useEventOperations(true));
      await act(() => Promise.resolve(null));

      const updatedEvent: Event = {
        ...normalEvent,
        title: '수정된 일반 회의',
      };

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [updatedEvent] });
        })
      );

      await act(async () => {
        await result.current.saveEvent(updatedEvent);
      });

      expect(result.current.events[0].title).toBe('수정된 일반 회의');
      expect(result.current.events[0].repeat.type).toBe('none');
    });
  });
});
