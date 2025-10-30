import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SnackbarProvider } from 'notistack';
import { describe, it, expect } from 'vitest';

import App from '../../App';
import { server } from '../../setupTests';
import { Event } from '../../types';

const theme = createTheme();

const setup = () => {
  const user = userEvent.setup();

  return {
    ...render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>
          <App />
        </SnackbarProvider>
      </ThemeProvider>
    ),
    user,
  };
};

describe('반복 일정 수정', () => {
  describe('수정 모드 선택 다이얼로그', () => {
    it('반복 일정 수정 시 "해당 일정만 수정하시겠어요?" 다이얼로그가 표시된다', async () => {
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

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [recurringEvent] });
        })
      );

      const { user } = setup();

      await screen.findByText('일정 로딩 완료!');

      await user.click(screen.getByLabelText('Edit event'));

      expect(screen.getByText('해당 일정만 수정하시겠어요?')).toBeInTheDocument();
    });

    it('일반 일정 수정 시 확인 다이얼로그가 표시되지 않는다', async () => {
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
        })
      );

      const { user } = setup();

      await screen.findByText('일정 로딩 완료!');

      await user.click(screen.getByLabelText('Edit event'));

      expect(screen.queryByText('해당 일정만 수정하시겠어요?')).not.toBeInTheDocument();
      expect(screen.getByLabelText('제목')).toHaveValue('일반 회의');
    });
  });

  describe('단일 수정 모드 (예 선택)', () => {
    it('반복 일정에서 "예"를 선택하면 단일 일정으로 변환된다', async () => {
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

      let capturedUpdateRequest: Event | null = null;

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [recurringEvent] });
        }),
        http.put('/api/events/:id', async ({ request }) => {
          const body = (await request.json()) as Event;
          capturedUpdateRequest = body;
          return HttpResponse.json(body);
        })
      );

      const { user } = setup();

      await screen.findByText('일정 로딩 완료!');

      await user.click(screen.getByLabelText('Edit event'));

      expect(screen.getByText('해당 일정만 수정하시겠어요?')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '예' }));

      await user.clear(screen.getByLabelText('제목'));
      await user.type(screen.getByLabelText('제목'), '수정된 회의');

      await user.click(screen.getByTestId('event-submit-button'));

      expect(capturedUpdateRequest).not.toBeNull();
      expect(capturedUpdateRequest?.repeat.type).toBe('none');
      expect(capturedUpdateRequest?.title).toBe('수정된 회의');
    });

    it('단일 일정으로 변환 후 Repeat 아이콘이 사라진다', async () => {
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

      const updatedEvent: Event = {
        ...recurringEvent,
        title: '수정된 회의',
        repeat: { type: 'none', interval: 0 },
      };

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [recurringEvent] });
        }),
        http.put('/api/events/:id', async () => {
          return HttpResponse.json(updatedEvent);
        })
      );

      const { user } = setup();

      await screen.findByText('일정 로딩 완료!');

      const monthView = screen.getByTestId('month-view');
      expect(within(monthView).getByTestId('RepeatIcon')).toBeInTheDocument();

      await user.click(screen.getByLabelText('Edit event'));
      await user.click(screen.getByRole('button', { name: '예' }));

      await user.clear(screen.getByLabelText('제목'));
      await user.type(screen.getByLabelText('제목'), '수정된 회의');

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [updatedEvent] });
        })
      );

      await user.click(screen.getByTestId('event-submit-button'));

      await screen.findByText('일정이 수정되었습니다.');

      expect(within(monthView).queryByTestId('RepeatIcon')).not.toBeInTheDocument();
    });

    it('단일 수정 시 다른 반복 일정 인스턴스는 변경되지 않는다', async () => {
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

      const updatedFirstEvent: Event = {
        ...recurringEvents[0],
        title: '수정된 회의',
        repeat: { type: 'none', interval: 0 },
      };

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: recurringEvents });
        }),
        http.put('/api/events/1', async () => {
          return HttpResponse.json(updatedFirstEvent);
        })
      );

      const { user } = setup();

      await screen.findByText('일정 로딩 완료!');

      const editButtons = screen.getAllByLabelText('Edit event');
      await user.click(editButtons[0]);

      await user.click(screen.getByRole('button', { name: '예' }));

      await user.clear(screen.getByLabelText('제목'));
      await user.type(screen.getByLabelText('제목'), '수정된 회의');

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [updatedFirstEvent, recurringEvents[1]] });
        })
      );

      await user.click(screen.getByTestId('event-submit-button'));

      await screen.findByText('일정이 수정되었습니다.');

      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText('수정된 회의')).toBeInTheDocument();
      expect(eventList.getAllByText('반복 회의')).toHaveLength(1);
    });
  });

  describe('전체 수정 모드 (아니오 선택)', () => {
    it('반복 일정에서 "아니오"를 선택하면 반복 속성이 유지된다', async () => {
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

      let capturedUpdateRequest: Event | null = null;

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [recurringEvent] });
        }),
        http.put('/api/events/:id', async ({ request }) => {
          const body = (await request.json()) as Event;
          capturedUpdateRequest = body;
          return HttpResponse.json(body);
        })
      );

      const { user } = setup();

      await screen.findByText('일정 로딩 완료!');

      await user.click(screen.getByLabelText('Edit event'));

      await user.click(screen.getByRole('button', { name: '아니오' }));

      await user.clear(screen.getByLabelText('제목'));
      await user.type(screen.getByLabelText('제목'), '수정된 반복 회의');

      await user.click(screen.getByTestId('event-submit-button'));

      expect(capturedUpdateRequest).not.toBeNull();
      expect(capturedUpdateRequest?.repeat.type).toBe('daily');
      expect(capturedUpdateRequest?.repeat.id).toBe('repeat-1');
      expect(capturedUpdateRequest?.title).toBe('수정된 반복 회의');
    });

    it('전체 수정 후 Repeat 아이콘이 유지된다', async () => {
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

      const updatedEvent: Event = {
        ...recurringEvent,
        title: '수정된 반복 회의',
      };

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [recurringEvent] });
        }),
        http.put('/api/events/:id', async () => {
          return HttpResponse.json(updatedEvent);
        })
      );

      const { user } = setup();

      await screen.findByText('일정 로딩 완료!');

      const monthView = screen.getByTestId('month-view');
      expect(within(monthView).getByTestId('RepeatIcon')).toBeInTheDocument();

      await user.click(screen.getByLabelText('Edit event'));
      await user.click(screen.getByRole('button', { name: '아니오' }));

      await user.clear(screen.getByLabelText('제목'));
      await user.type(screen.getByLabelText('제목'), '수정된 반복 회의');

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [updatedEvent] });
        })
      );

      await user.click(screen.getByTestId('event-submit-button'));

      await screen.findByText('일정이 수정되었습니다.');

      expect(within(monthView).getByTestId('RepeatIcon')).toBeInTheDocument();
    });

    it('전체 수정 시 동일한 repeat.id를 가진 모든 일정이 업데이트된다', async () => {
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

      const updatedEvents: Event[] = recurringEvents.map((e) => ({
        ...e,
        title: '수정된 반복 회의',
        description: '수정된 설명',
      }));

      let updateCallCount = 0;

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: recurringEvents });
        }),
        http.put('/api/events/:id', async ({ params }) => {
          updateCallCount++;
          const eventId = params.id as string;
          const updated = updatedEvents.find((e) => e.id === eventId);
          return HttpResponse.json(updated);
        })
      );

      const { user } = setup();

      await screen.findByText('일정 로딩 완료!');

      const editButtons = screen.getAllByLabelText('Edit event');
      await user.click(editButtons[0]);

      await user.click(screen.getByRole('button', { name: '아니오' }));

      await user.clear(screen.getByLabelText('제목'));
      await user.type(screen.getByLabelText('제목'), '수정된 반복 회의');
      await user.clear(screen.getByLabelText('설명'));
      await user.type(screen.getByLabelText('설명'), '수정된 설명');

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: updatedEvents });
        })
      );

      await user.click(screen.getByTestId('event-submit-button'));

      await screen.findByText('일정이 수정되었습니다.');

      expect(updateCallCount).toBeGreaterThan(1);

      const eventList = within(screen.getByTestId('event-list'));
      const updatedTitles = eventList.getAllByText('수정된 반복 회의');
      expect(updatedTitles.length).toBeGreaterThan(1);
    })
  })
})

