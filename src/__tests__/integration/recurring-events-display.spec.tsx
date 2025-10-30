import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SnackbarProvider } from 'notistack';
import { describe, it, expect, beforeEach } from 'vitest';

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

describe('반복 일정 표시', () => {
  describe('월간 뷰', () => {
    it('반복 일정에 Repeat 아이콘을 표시한다', async () => {
      const recurringEvent: Event = {
        id: '1',
        title: '일간 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '매일 진행하는 회의',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-10-20' },
        notificationTime: 10,
      };

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [recurringEvent] });
        })
      );

      const { user } = setup();

      // 일정 로딩 완료 대기
      await screen.findByText('일정 로딩 완료!');

      // 월간 뷰로 전환 (기본값이지만 명시적으로)
      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'month-option' }));

      const monthView = screen.getByTestId('month-view');
      const eventBox = within(monthView).getByText('일간 회의').closest('div');

      expect(eventBox).toBeInTheDocument();
      
      // Repeat 아이콘이 표시되는지 확인 (MUI Repeat icon은 data-testid="RepeatIcon"으로 표시됨)
      const repeatIcon = within(eventBox!).getByTestId('RepeatIcon');
      expect(repeatIcon).toBeInTheDocument();
    });

    it('일반 일정에는 Repeat 아이콘을 표시하지 않는다', async () => {
      const normalEvent: Event = {
        id: '1',
        title: '일반 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '한 번만 진행하는 회의',
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

      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'month-option' }));

      const monthView = screen.getByTestId('month-view');
      const eventBox = within(monthView).getByText('일반 회의').closest('div');

      expect(eventBox).toBeInTheDocument();
      
      // Repeat 아이콘이 없는지 확인
      const repeatIcon = within(eventBox!).queryByTestId('RepeatIcon');
      expect(repeatIcon).not.toBeInTheDocument();
    });
  });

  describe('주간 뷰', () => {
    it('반복 일정에 Repeat 아이콘을 표시한다', async () => {
      const recurringEvent: Event = {
        id: '1',
        title: '주간 회의',
        date: '2025-10-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '매주 진행하는 회의',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-10-31' },
        notificationTime: 10,
      };

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [recurringEvent] });
        })
      );

      const { user } = setup();

      await screen.findByText('일정 로딩 완료!');

      // 주간 뷰로 전환
      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      const weekView = screen.getByTestId('week-view');
      const eventBox = within(weekView).getByText('주간 회의').closest('div');

      expect(eventBox).toBeInTheDocument();
      
      // Repeat 아이콘이 표시되는지 확인
      const repeatIcon = within(eventBox!).getByTestId('RepeatIcon');
      expect(repeatIcon).toBeInTheDocument();
    });

    it('일반 일정에는 Repeat 아이콘을 표시하지 않는다', async () => {
      const normalEvent: Event = {
        id: '1',
        title: '일반 회의',
        date: '2025-10-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '한 번만 진행하는 회의',
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

      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      const weekView = screen.getByTestId('week-view');
      const eventBox = within(weekView).getByText('일반 회의').closest('div');

      expect(eventBox).toBeInTheDocument();
      
      // Repeat 아이콘이 없는지 확인
      const repeatIcon = within(eventBox!).queryByTestId('RepeatIcon');
      expect(repeatIcon).not.toBeInTheDocument();
    });
  });

  describe('모든 반복 타입', () => {
    it('일간 반복 일정에 Repeat 아이콘을 표시한다', async () => {
      const dailyEvent: Event = {
        id: '1',
        title: '일간 스탠드업',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '09:30',
        description: '매일 아침 스탠드업',
        location: '온라인',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-10-20' },
        notificationTime: 10,
      };

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [dailyEvent] });
        })
      );

      setup();

      await screen.findByText('일정 로딩 완료!');

      const monthView = screen.getByTestId('month-view');
      const eventBox = within(monthView).getByText('일간 스탠드업').closest('div');
      
      const repeatIcon = within(eventBox!).getByTestId('RepeatIcon');
      expect(repeatIcon).toBeInTheDocument();
    });

    it('주간 반복 일정에 Repeat 아이콘을 표시한다', async () => {
      const weeklyEvent: Event = {
        id: '1',
        title: '주간 리뷰',
        date: '2025-10-15',
        startTime: '14:00',
        endTime: '15:00',
        description: '매주 수요일 리뷰',
        location: '회의실 C',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-11-15' },
        notificationTime: 10,
      };

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [weeklyEvent] });
        })
      );

      setup();

      await screen.findByText('일정 로딩 완료!');

      const monthView = screen.getByTestId('month-view');
      const eventBox = within(monthView).getByText('주간 리뷰').closest('div');
      
      const repeatIcon = within(eventBox!).getByTestId('RepeatIcon');
      expect(repeatIcon).toBeInTheDocument();
    });

    it('월간 반복 일정에 Repeat 아이콘을 표시한다', async () => {
      const monthlyEvent: Event = {
        id: '1',
        title: '월간 보고',
        date: '2025-10-15',
        startTime: '16:00',
        endTime: '17:00',
        description: '매월 15일 보고',
        location: '대회의실',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2026-01-15' },
        notificationTime: 10,
      };

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [monthlyEvent] });
        })
      );

      setup();

      await screen.findByText('일정 로딩 완료!');

      const monthView = screen.getByTestId('month-view');
      const eventBox = within(monthView).getByText('월간 보고').closest('div');
      
      const repeatIcon = within(eventBox!).getByTestId('RepeatIcon');
      expect(repeatIcon).toBeInTheDocument();
    });

    it('연간 반복 일정에 Repeat 아이콘을 표시한다', async () => {
      const yearlyEvent: Event = {
        id: '1',
        title: '생일 파티',
        date: '2025-10-15',
        startTime: '18:00',
        endTime: '20:00',
        description: '매년 생일',
        location: '집',
        category: '개인',
        repeat: { type: 'yearly', interval: 1, endDate: '2030-10-15' },
        notificationTime: 1440,
      };

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [yearlyEvent] });
        })
      );

      setup();

      await screen.findByText('일정 로딩 완료!');

      const monthView = screen.getByTestId('month-view');
      const eventBox = within(monthView).getByText('생일 파티').closest('div');
      
      const repeatIcon = within(eventBox!).getByTestId('RepeatIcon');
      expect(repeatIcon).toBeInTheDocument();
    });
  });
});

