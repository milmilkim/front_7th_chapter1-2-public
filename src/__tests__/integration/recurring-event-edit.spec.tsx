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
    it('반복 일정 수정 시 "해당 일정만 수정하시겠어요?" 다이얼로그가 표시된다', () => {})

    it('일반 일정 수정 시 확인 다이얼로그가 표시되지 않는다', () => {})
  })

  describe('단일 수정 모드 (예 선택)', () => {
    it('반복 일정에서 "예"를 선택하면 단일 일정으로 변환된다', () => {})

    it('단일 일정으로 변환 후 Repeat 아이콘이 사라진다', () => {})

    it('단일 수정 시 다른 반복 일정 인스턴스는 변경되지 않는다', () => {})
  })

  describe('전체 수정 모드 (아니오 선택)', () => {
    it('반복 일정에서 "아니오"를 선택하면 반복 속성이 유지된다', () => {})

    it('전체 수정 후 Repeat 아이콘이 유지된다', () => {})

    it('전체 수정 시 동일한 repeat.id를 가진 모든 일정이 업데이트된다', () => {})
  })
})

