import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within, act } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../__mocks__/handlersUtils';
import App from '../App';
import { server } from '../setupTests';
import { Event, EventForm } from '../types';

const theme = createTheme();

// ! Hard 여기 제공 안함
const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return {
    ...render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>{element}</SnackbarProvider>
      </ThemeProvider>
    ),
    user,
  };
};

// ! Hard 여기 제공 안함
const saveSchedule = async (
  user: UserEvent,
  form: Omit<Event, 'id' | 'notificationTime' | 'repeat'>
) => {
  const { title, date, startTime, endTime, location, description, category } = form;

  await user.click(screen.getAllByText('일정 추가')[0]);

  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);
  await user.click(screen.getByLabelText('카테고리'));
  await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
  await user.click(screen.getByRole('option', { name: `${category}-option` }));

  await user.click(screen.getByTestId('event-submit-button'));
};

describe('일정 CRUD 및 기본 기능', () => {
  it('입력한 새로운 일정 정보에 맞춰 모든 필드가 이벤트 리스트에 정확히 저장된다.', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('새 회의')).toBeInTheDocument();
    expect(eventList.getByText('2025-10-15')).toBeInTheDocument();
    expect(eventList.getByText('14:00 - 15:00')).toBeInTheDocument();
    expect(eventList.getByText('프로젝트 진행 상황 논의')).toBeInTheDocument();
    expect(eventList.getByText('회의실 A')).toBeInTheDocument();
    expect(eventList.getByText('카테고리: 업무')).toBeInTheDocument();
  });

  it('기존 일정의 세부 정보를 수정하고 변경사항이 정확히 반영된다', async () => {
    const { user } = setup(<App />);

    setupMockHandlerUpdating();

    await user.click(await screen.findByLabelText('Edit event'));

    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '수정된 회의');
    await user.clear(screen.getByLabelText('설명'));
    await user.type(screen.getByLabelText('설명'), '회의 내용 변경');

    await user.click(screen.getByTestId('event-submit-button'));

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('수정된 회의')).toBeInTheDocument();
    expect(eventList.getByText('회의 내용 변경')).toBeInTheDocument();
  });

  it('일정을 삭제하고 더 이상 조회되지 않는지 확인한다', async () => {
    setupMockHandlerDeletion();

    const { user } = setup(<App />);
    const eventList = within(screen.getByTestId('event-list'));
    expect(await eventList.findByText('삭제할 이벤트')).toBeInTheDocument();

    // 삭제 버튼 클릭
    const allDeleteButton = await screen.findAllByLabelText('Delete event');
    await user.click(allDeleteButton[0]);

    expect(eventList.queryByText('삭제할 이벤트')).not.toBeInTheDocument();
  });
});

describe('일정 뷰', () => {
  it('주별 뷰를 선택 후 해당 주에 일정이 없으면, 일정이 표시되지 않는다.', async () => {
    // ! 현재 시스템 시간 2025-10-01
    const { user } = setup(<App />);

    await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'week-option' }));

    // ! 일정 로딩 완료 후 테스트
    await screen.findByText('일정 로딩 완료!');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('주별 뷰 선택 후 해당 일자에 일정이 존재한다면 해당 일정이 정확히 표시된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);
    await saveSchedule(user, {
      title: '이번주 팀 회의',
      date: '2025-10-02',
      startTime: '09:00',
      endTime: '10:00',
      description: '이번주 팀 회의입니다.',
      location: '회의실 A',
      category: '업무',
    });

    await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'week-option' }));

    const weekView = within(screen.getByTestId('week-view'));
    expect(weekView.getByText('이번주 팀 회의')).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 없으면, 일정이 표시되지 않아야 한다.', async () => {
    vi.setSystemTime(new Date('2025-01-01'));

    setup(<App />);

    // ! 일정 로딩 완료 후 테스트
    await screen.findByText('일정 로딩 완료!');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 정확히 표시되는지 확인한다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);
    await saveSchedule(user, {
      title: '이번달 팀 회의',
      date: '2025-10-02',
      startTime: '09:00',
      endTime: '10:00',
      description: '이번달 팀 회의입니다.',
      location: '회의실 A',
      category: '업무',
    });

    const monthView = within(screen.getByTestId('month-view'));
    expect(monthView.getByText('이번달 팀 회의')).toBeInTheDocument();
  });

  it('달력에 1월 1일(신정)이 공휴일로 표시되는지 확인한다', async () => {
    vi.setSystemTime(new Date('2025-01-01'));
    setup(<App />);

    const monthView = screen.getByTestId('month-view');

    // 1월 1일 셀 확인
    const januaryFirstCell = within(monthView).getByText('1').closest('td')!;
    expect(within(januaryFirstCell).getByText('신정')).toBeInTheDocument();
  });
});

describe('검색 기능', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({
          events: [
            {
              id: 1,
              title: '팀 회의',
              date: '2025-10-15',
              startTime: '09:00',
              endTime: '10:00',
              description: '주간 팀 미팅',
              location: '회의실 A',
              category: '업무',
              repeat: { type: 'none', interval: 0 },
              notificationTime: 10,
            },
            {
              id: 2,
              title: '프로젝트 계획',
              date: '2025-10-16',
              startTime: '14:00',
              endTime: '15:00',
              description: '새 프로젝트 계획 수립',
              location: '회의실 B',
              category: '업무',
              repeat: { type: 'none', interval: 0 },
              notificationTime: 10,
            },
          ],
        });
      })
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('검색 결과가 없으면, "검색 결과가 없습니다."가 표시되어야 한다.', async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '존재하지 않는 일정');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it("'팀 회의'를 검색하면 해당 제목을 가진 일정이 리스트에 노출된다", async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '팀 회의');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('팀 회의')).toBeInTheDocument();
  });

  it('검색어를 지우면 모든 일정이 다시 표시되어야 한다', async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '팀 회의');
    await user.clear(searchInput);

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('팀 회의')).toBeInTheDocument();
    expect(eventList.getByText('프로젝트 계획')).toBeInTheDocument();
  });
});

describe('일정 충돌', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it('겹치는 시간에 새 일정을 추가할 때 경고가 표시된다', async () => {
    setupMockHandlerCreation([
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

    const { user } = setup(<App />);

    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '09:30',
      endTime: '10:30',
      description: '설명',
      location: '회의실 A',
      category: '업무',
    });

    expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
    expect(screen.getByText(/다음 일정과 겹칩니다/)).toBeInTheDocument();
    expect(screen.getByText('기존 회의 (2025-10-15 09:00-10:00)')).toBeInTheDocument();
  });

  it('기존 일정의 시간을 수정하여 충돌이 발생하면 경고가 노출된다', async () => {
    setupMockHandlerUpdating();

    const { user } = setup(<App />);

    const editButton = (await screen.findAllByLabelText('Edit event'))[1];
    await user.click(editButton);

    // 시간 수정하여 다른 일정과 충돌 발생
    await user.clear(screen.getByLabelText('시작 시간'));
    await user.type(screen.getByLabelText('시작 시간'), '08:30');
    await user.clear(screen.getByLabelText('종료 시간'));
    await user.type(screen.getByLabelText('종료 시간'), '10:30');

    await user.click(screen.getByTestId('event-submit-button'));

    expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
    expect(screen.getByText(/다음 일정과 겹칩니다/)).toBeInTheDocument();
    expect(screen.getByText('기존 회의 (2025-10-15 09:00-10:00)')).toBeInTheDocument();
  });
});

it('notificationTime을 10으로 하면 지정 시간 10분 전 알람 텍스트가 노출된다', async () => {
  vi.setSystemTime(new Date('2025-10-15 08:49:59'));

  setup(<App />);

  // ! 일정 로딩 완료 후 테스트
  await screen.findByText('일정 로딩 완료!');

  expect(screen.queryByText('10분 후 기존 회의 일정이 시작됩니다.')).not.toBeInTheDocument();

  act(() => {
    vi.advanceTimersByTime(1000);
  });

  expect(screen.getByText('10분 후 기존 회의 일정이 시작됩니다.')).toBeInTheDocument();
});

describe('반복 일정', () => {
  it('daily 반복 일정 생성 시 모든 인스턴스가 캘린더에 표시된다', async () => {
    // Given: API 모킹 및 앱 렌더링
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

    const { user } = setup(<App />);

    // When: 반복 일정 폼 작성 및 제출
    await user.type(screen.getByLabelText('제목'), 'Daily 회의');
    await user.type(screen.getByLabelText('날짜'), '2025-10-01');
    await user.type(screen.getByLabelText('시작 시간'), '09:00');
    await user.type(screen.getByLabelText('종료 시간'), '10:00');
    await user.type(screen.getByLabelText('설명'), '매일 회의');
    await user.type(screen.getByLabelText('위치'), '회의실 A');

    // 반복 설정
    await user.click(screen.getByLabelText('반복 일정'));
    const repeatTypeCombobox = within(screen.getByLabelText('반복 유형')).getByRole('combobox');
    await user.click(repeatTypeCombobox);
    await user.click(screen.getByRole('option', { name: 'daily-option' }));

    await user.type(screen.getByLabelText('반복 종료일'), '2025-10-05');

    await user.click(screen.getByTestId('event-submit-button'));

    // Then: 모든 인스턴스가 표시됨
    const eventList = within(screen.getByTestId('event-list'));
    const events = await eventList.findAllByText('Daily 회의');
    expect(events).toHaveLength(5);

    server.resetHandlers();
  });

  it('weekly 반복 일정 생성 시 지정된 요일에 일정이 표시된다', async () => {
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

    const { user } = setup(<App />);

    await user.type(screen.getByLabelText('제목'), 'Weekly 회의');
    await user.type(screen.getByLabelText('날짜'), '2025-10-06');
    await user.type(screen.getByLabelText('시작 시간'), '09:00');
    await user.type(screen.getByLabelText('종료 시간'), '10:00');
    await user.type(screen.getByLabelText('설명'), '주간 회의');
    await user.type(screen.getByLabelText('위치'), '회의실 A');

    await user.click(screen.getByLabelText('반복 일정'));
    await user.click(screen.getByLabelText('반복 유형'));
    const repeatTypeCombobox = within(screen.getByLabelText('반복 유형')).getByRole('combobox');
    await user.click(repeatTypeCombobox);
    await user.click(screen.getByRole('option', { name: 'weekly-option' }));

    await user.type(screen.getByLabelText('반복 종료일'), '2025-10-27');

    await user.click(screen.getByTestId('event-submit-button'));

    // Then: 매주 월요일에 일정 표시
    const eventList = within(screen.getByTestId('event-list'));
    const events = await eventList.findAllByText('Weekly 회의');
    expect(events).toHaveLength(4);

    server.resetHandlers();
  });

  it('monthly 31일 반복 일정 생성 시 31일이 있는 달에만 일정이 표시된다', async () => {
    // Given: 시스템 시간을 1월로 설정
    vi.setSystemTime(new Date('2025-01-01'));

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

    const { user } = setup(<App />);

    // When: 31일 monthly 반복 일정 생성
    await user.type(screen.getByLabelText('제목'), '월말 회의');
    await user.type(screen.getByLabelText('날짜'), '2025-01-31');
    await user.type(screen.getByLabelText('시작 시간'), '09:00');
    await user.type(screen.getByLabelText('종료 시간'), '10:00');
    await user.type(screen.getByLabelText('설명'), '매월 31일 회의');
    await user.type(screen.getByLabelText('위치'), '회의실 A');

    await user.click(screen.getByLabelText('반복 일정'));
    await user.click(screen.getByLabelText('반복 유형'));
    const repeatTypeCombobox = within(screen.getByLabelText('반복 유형')).getByRole('combobox');
    await user.click(repeatTypeCombobox);
    await user.click(screen.getByRole('option', { name: 'monthly-option' }));

    // 1월 31일 ~ 5월 31일까지 반복 (1월, 3월, 5월은 31일 있음, 2월, 4월은 31일 없음)
    await user.type(screen.getByLabelText('반복 종료일'), '2025-05-31');

    await user.click(screen.getByTestId('event-submit-button'));

    // Then: 31일이 있는 달에만 일정이 표시됨
    // 1월에 월말 회의가 있어야 함
    const eventList = within(screen.getByTestId('event-list'));
    expect(await eventList.findByText('월말 회의')).toBeInTheDocument();

    // 2월로 이동 (31일 없음 - 이벤트 없어야 함)
    await user.click(screen.getByLabelText('Next'));
    expect(eventList.queryByText('월말 회의')).not.toBeInTheDocument();

    // 3월로 이동 (31일 있음 - 이벤트 있어야 함)
    await user.click(screen.getByLabelText('Next'));
    expect(await eventList.findByText('월말 회의')).toBeInTheDocument();

    // 4월로 이동 (31일 없음 - 이벤트 없어야 함)
    await user.click(screen.getByLabelText('Next'));
    expect(eventList.queryByText('월말 회의')).not.toBeInTheDocument();

    // 5월로 이동 (31일 있음 - 이벤트 있어야 함)
    await user.click(screen.getByLabelText('Next'));
    expect(await eventList.findByText('월말 회의')).toBeInTheDocument();

    server.resetHandlers();
  });

  it('yearly 2월 29일 반복 일정 생성 시 윤년에만 일정이 표시된다', async () => {
    // Given: 시스템 시간을 2024년 2월로 설정
    vi.setSystemTime(new Date('2024-02-01'));

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

    const { user } = setup(<App />);

    // When: 2월 29일 yearly 반복 일정 생성
    await user.type(screen.getByLabelText('제목'), '윤년 기념일');
    await user.type(screen.getByLabelText('날짜'), '2024-02-29');
    await user.type(screen.getByLabelText('시작 시간'), '09:00');
    await user.type(screen.getByLabelText('종료 시간'), '10:00');
    await user.type(screen.getByLabelText('설명'), '2월 29일 기념일');
    await user.type(screen.getByLabelText('위치'), '회의실 A');

    await user.click(screen.getByLabelText('반복 일정'));
    await user.click(screen.getByLabelText('반복 유형'));
    const repeatTypeCombobox = within(screen.getByLabelText('반복 유형')).getByRole('combobox');
    await user.click(repeatTypeCombobox);
    await user.click(screen.getByRole('option', { name: 'yearly-option' }));

    // 2024년 ~ 2027년까지 반복 (2024는 윤년, 2025-2027은 평년)
    await user.type(screen.getByLabelText('반복 종료일'), '2027-02-28');

    await user.click(screen.getByTestId('event-submit-button'));

    // Then: 윤년에만 일정이 표시됨
    // 2024년 2월(윤년)에 윤년 기념일이 있어야 함
    const eventList = within(screen.getByTestId('event-list'));
    expect(await eventList.findByText('윤년 기념일')).toBeInTheDocument();

    // 2025년 2월로 이동 (평년 - 이벤트 없어야 함)
    for (let i = 0; i < 12; i++) {
      await user.click(screen.getByLabelText('Next'));
    }
    expect(eventList.queryByText('윤년 기념일')).not.toBeInTheDocument();

    // 2027년 2월로 이동 (평년 - 이벤트 없어야 함)
    for (let i = 0; i < 24; i++) {
      await user.click(screen.getByLabelText('Next'));
    }
    expect(eventList.queryByText('윤년 기념일')).not.toBeInTheDocument();

    server.resetHandlers();
  }, 10000);

  it('반복 일정 생성 후 성공 알림이 표시된다', async () => {
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

    const { user } = setup(<App />);

    // When: 반복 일정 생성
    await user.type(screen.getByLabelText('제목'), 'Daily 회의');
    await user.type(screen.getByLabelText('날짜'), '2025-10-01');
    await user.type(screen.getByLabelText('시작 시간'), '09:00');
    await user.type(screen.getByLabelText('종료 시간'), '10:00');
    await user.type(screen.getByLabelText('설명'), '매일 회의');
    await user.type(screen.getByLabelText('위치'), '회의실 A');

    await user.click(screen.getByLabelText('반복 일정'));
    const repeatTypeCombobox = within(screen.getByLabelText('반복 유형')).getByRole('combobox');
    await user.click(repeatTypeCombobox);
    await user.click(screen.getByRole('option', { name: 'daily-option' }));

    await user.type(screen.getByLabelText('반복 종료일'), '2025-10-05');

    await user.click(screen.getByTestId('event-submit-button'));

    // Then: 성공 알림 표시
    expect(await screen.findByText(/반복 일정이 추가되었습니다/i)).toBeInTheDocument();

    server.resetHandlers();
  });

  it('반복 일정 생성 시 일정 겹침 경고가 표시되지 않는다', async () => {
    // Given: 기존 일정과 겹치는 반복 일정 생성
    const mockEvents: Event[] = [
      {
        id: '1',
        title: '기존 회의',
        date: '2025-10-01',
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

    const { user } = setup(<App />);

    // When: 겹치는 시간에 반복 일정 생성

    await user.type(screen.getByLabelText('제목'), '반복 회의');
    await user.type(screen.getByLabelText('날짜'), '2025-10-01');
    await user.type(screen.getByLabelText('시작 시간'), '09:30');
    await user.type(screen.getByLabelText('종료 시간'), '10:30');
    await user.type(screen.getByLabelText('설명'), '기존 회의와 겹침');
    await user.type(screen.getByLabelText('위치'), '회의실 B');

    await user.click(screen.getByLabelText('반복 일정'));
    await user.click(screen.getByLabelText('반복 유형'));
    const repeatTypeCombobox = within(screen.getByLabelText('반복 유형')).getByRole('combobox');
    await user.click(repeatTypeCombobox);
    await user.click(screen.getByRole('option', { name: 'daily-option' }));

    await user.type(screen.getByLabelText('반복 종료일'), '2025-10-03');

    await user.click(screen.getByTestId('event-submit-button'));

    // Then: 겹침 경고가 표시되지 않음
    await act(() => Promise.resolve(null));
    expect(screen.queryByText('일정 겹침 경고')).not.toBeInTheDocument();
    expect(screen.queryByText(/다음 일정과 겹칩니다/)).not.toBeInTheDocument();

    server.resetHandlers();
  });

  it('반복 일정 삭제 시 확인 다이얼로그가 표시된다', async () => {
    // Given: 반복 일정이 있는 상태
    const mockEvents: Event[] = [
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
        return HttpResponse.json({ events: mockEvents });
      })
    );

    const { user } = setup(<App />);

    // Wait for events to load
    await screen.findByText('일정 로딩 완료!');

    // When: 반복 일정의 삭제 버튼 클릭
    const deleteButtons = screen.getAllByLabelText('Delete event');
    await user.click(deleteButtons[0]);

    // Then: 확인 다이얼로그가 표시됨
    expect(screen.getByText('반복 일정 삭제')).toBeInTheDocument();
    expect(screen.getByText('해당 일정만 삭제하시겠어요?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '예' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '아니오' })).toBeInTheDocument();

    server.resetHandlers();
  });

  it('반복 일정 삭제 다이얼로그에서 "예" 클릭 시 해당 일정만 삭제된다', async () => {
    // Given: 반복 일정 시리즈가 있는 상태
    const mockEvents: Event[] = [
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
      {
        id: '3',
        title: '반복 회의',
        date: '2025-10-17',
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
        return HttpResponse.json({ events: mockEvents });
      }),
      http.delete('/api/events/:id', ({ params }) => {
        const id = params.id as string;
        const index = mockEvents.findIndex((e) => e.id === id);
        if (index !== -1) {
          mockEvents.splice(index, 1);
        }
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { user } = setup(<App />);
    await screen.findByText('일정 로딩 완료!');

    // When: 첫 번째 일정 삭제 시 "예" 클릭 (해당 일정만 삭제)
    const deleteButtons = screen.getAllByLabelText('Delete event');
    await user.click(deleteButtons[0]);

    expect(screen.getByText('해당 일정만 삭제하시겠어요?')).toBeInTheDocument();

    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({ events: mockEvents });
      })
    );

    await user.click(screen.getByRole('button', { name: '예' }));

    // Then: 해당 일정만 삭제되고 나머지는 유지됨
    await act(() => Promise.resolve(null));
    const eventList = within(screen.getByTestId('event-list'));
    const remainingEvents = eventList.getAllByText('반복 회의');
    expect(remainingEvents).toHaveLength(2);

    server.resetHandlers();
  });

  it('반복 일정 삭제 다이얼로그에서 "아니오" 클릭 시 시리즈 전체가 삭제된다', async () => {
    // Given: 반복 일정 시리즈가 있는 상태
    const mockEvents: Event[] = [
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
      {
        id: '3',
        title: '반복 회의',
        date: '2025-10-17',
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
        return HttpResponse.json({ events: mockEvents });
      }),
      http.delete('/api/events/:id', ({ params }) => {
        const id = params.id as string;
        const index = mockEvents.findIndex((e) => e.id === id);
        if (index !== -1) {
          mockEvents.splice(index, 1);
        }
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { user } = setup(<App />);
    await screen.findByText('일정 로딩 완료!');

    // When: 반복 일정 삭제 시 "아니오" 클릭 (시리즈 전체 삭제)
    const deleteButtons = screen.getAllByLabelText('Delete event');
    await user.click(deleteButtons[0]);

    expect(screen.getByText('해당 일정만 삭제하시겠어요?')).toBeInTheDocument();

    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({ events: [] });
      })
    );

    await user.click(screen.getByRole('button', { name: '아니오' }));

    // Then: 시리즈 전체가 삭제됨
    await act(() => Promise.resolve(null));
    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.queryByText('반복 회의')).not.toBeInTheDocument();
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();

    server.resetHandlers();
  });

  it('일반 일정 삭제 시 다이얼로그 없이 바로 삭제된다', async () => {
    // Given: 일반 일정이 있는 상태
    setupMockHandlerDeletion();

    const { user } = setup(<App />);
    await screen.findByText('일정 로딩 완료!');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('삭제할 이벤트')).toBeInTheDocument();

    // When: 일반 일정 삭제 버튼 클릭
    const deleteButton = screen.getByLabelText('Delete event');
    await user.click(deleteButton);

    // Then: 다이얼로그 없이 바로 삭제됨
    expect(screen.queryByText('반복 일정 삭제')).not.toBeInTheDocument();
    expect(screen.queryByText('해당 일정만 삭제하시겠어요?')).not.toBeInTheDocument();

    await act(() => Promise.resolve(null));
    expect(eventList.queryByText('삭제할 이벤트')).not.toBeInTheDocument();
  });

  it('시리즈 삭제 후 이벤트 목록이 업데이트된다', async () => {
    // Given: 여러 반복 일정 시리즈가 있는 상태
    const mockEvents: Event[] = [
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
    ];

    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({ events: mockEvents });
      }),
      http.delete('/api/events/:id', ({ params }) => {
        const id = params.id as string;
        const index = mockEvents.findIndex((e) => e.id === id);
        if (index !== -1) {
          mockEvents.splice(index, 1);
        }
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { user } = setup(<App />);
    await screen.findByText('일정 로딩 완료!');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getAllByText('반복 회의 A')).toHaveLength(2);
    expect(eventList.getByText('반복 회의 B')).toBeInTheDocument();

    // When: 반복 회의 A 시리즈 삭제 ("아니오" 클릭)
    const deleteButtons = screen.getAllByLabelText('Delete event');
    await user.click(deleteButtons[0]);

    expect(screen.getByText('해당 일정만 삭제하시겠어요?')).toBeInTheDocument();

    const remainingEvents = mockEvents.filter((e) => e.repeat.id !== 'repeat-1');
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({ events: remainingEvents });
      })
    );

    await user.click(screen.getByRole('button', { name: '아니오' }));

    // Then: 시리즈 A는 삭제되고 시리즈 B만 남음
    await act(() => Promise.resolve(null));
    expect(eventList.queryByText('반복 회의 A')).not.toBeInTheDocument();
    expect(await eventList.findByText('반복 회의 B')).toBeInTheDocument();

    server.resetHandlers();
  });
});
