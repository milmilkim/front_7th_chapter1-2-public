import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SnackbarProvider } from 'notistack';
import { describe, it, expect } from 'vitest';

import { setupMockHandlerCreation } from '../../__mocks__/handlersUtils';
import App from '../../App';
import { server } from '../../setupTests';

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
      // TODO: 테스트 구현
    });

    it('일반 일정에는 Repeat 아이콘을 표시하지 않는다', async () => {
      // TODO: 테스트 구현
    });
  });

  describe('주간 뷰', () => {
    it('반복 일정에 Repeat 아이콘을 표시한다', async () => {
      // TODO: 테스트 구현
    });

    it('일반 일정에는 Repeat 아이콘을 표시하지 않는다', async () => {
      // TODO: 테스트 구현
    });
  });

  describe('모든 반복 타입', () => {
    it('일간 반복 일정에 Repeat 아이콘을 표시한다', async () => {
      // TODO: 테스트 구현
    });

    it('주간 반복 일정에 Repeat 아이콘을 표시한다', async () => {
      // TODO: 테스트 구현
    });

    it('월간 반복 일정에 Repeat 아이콘을 표시한다', async () => {
      // TODO: 테스트 구현
    });

    it('연간 반복 일정에 Repeat 아이콘을 표시한다', async () => {
      // TODO: 테스트 구현
    });
  });
});

