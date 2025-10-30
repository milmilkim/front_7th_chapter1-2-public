import { EventForm } from '../../types';
import {
  generateRecurringEvents,
  calculateNextDate,
  isValidOccurrenceDate,
} from '../../utils/recurringEventUtils';

const createBaseEvent = (overrides?: Partial<EventForm>): EventForm => ({
  title: '테스트 이벤트',
  date: '2025-11-01',
  startTime: '10:00',
  endTime: '11:00',
  description: '설명',
  location: '장소',
  category: '업무',
  repeat: {
    type: 'none',
    interval: 1,
  },
  notificationTime: 10,
  ...overrides,
});

describe('generateRecurringEvents', () => {
  describe('정상 케이스', () => {
    it('daily 반복 타입으로 interval 1일 때 매일 이벤트가 생성된다', () => {
      // Given
      const baseEvent = createBaseEvent({
        date: '2025-11-01',
        repeat: {
          type: 'daily',
          interval: 1,
          endDate: '2025-11-05',
        },
      });

      // When
      const events = generateRecurringEvents(baseEvent);

      // Then
      expect(events).toHaveLength(5);
      expect(events[0].date).toBe('2025-11-01');
      expect(events[1].date).toBe('2025-11-02');
      expect(events[2].date).toBe('2025-11-03');
      expect(events[3].date).toBe('2025-11-04');
      expect(events[4].date).toBe('2025-11-05');
    });

    it('daily 반복 타입으로 interval 3일 때 3일 간격으로 이벤트가 생성된다', () => {
      // Given
      const baseEvent = createBaseEvent({
        date: '2025-11-01',
        repeat: {
          type: 'daily',
          interval: 3,
          endDate: '2025-11-10',
        },
      });

      // When
      const events = generateRecurringEvents(baseEvent);

      // Then
      expect(events).toHaveLength(4);
      expect(events[0].date).toBe('2025-11-01');
      expect(events[1].date).toBe('2025-11-04');
      expect(events[2].date).toBe('2025-11-07');
      expect(events[3].date).toBe('2025-11-10');
    });

    it('weekly 반복 타입으로 interval 1일 때 매주 같은 요일에 이벤트가 생성된다', () => {
      // Given
      const baseEvent = createBaseEvent({
        date: '2025-11-01',
        repeat: {
          type: 'weekly',
          interval: 1,
          endDate: '2025-11-22',
        },
      });

      // When
      const events = generateRecurringEvents(baseEvent);

      // Then
      expect(events).toHaveLength(4);
      expect(events[0].date).toBe('2025-11-01');
      expect(events[1].date).toBe('2025-11-08');
      expect(events[2].date).toBe('2025-11-15');
      expect(events[3].date).toBe('2025-11-22');
    });

    it('weekly 반복 타입으로 interval 2일 때 2주 간격으로 이벤트가 생성된다', () => {
      // Given
      const baseEvent = createBaseEvent({
        date: '2025-11-01',
        repeat: {
          type: 'weekly',
          interval: 2,
          endDate: '2025-11-29',
        },
      });

      // When
      const events = generateRecurringEvents(baseEvent);

      // Then
      expect(events).toHaveLength(3);
      expect(events[0].date).toBe('2025-11-01');
      expect(events[1].date).toBe('2025-11-15');
      expect(events[2].date).toBe('2025-11-29');
    });

    it('monthly 반복 타입으로 interval 1일 때 매월 같은 날짜에 이벤트가 생성된다', () => {
      // Given
      const baseEvent = createBaseEvent({
        date: '2025-09-15',
        repeat: {
          type: 'monthly',
          interval: 1,
          endDate: '2025-12-15',
        },
      });

      // When
      const events = generateRecurringEvents(baseEvent);

      // Then
      expect(events).toHaveLength(4);
      expect(events[0].date).toBe('2025-09-15');
      expect(events[1].date).toBe('2025-10-15');
      expect(events[2].date).toBe('2025-11-15');
      expect(events[3].date).toBe('2025-12-15');
    });

    it('monthly 반복 타입으로 interval 2일 때 2개월 간격으로 이벤트가 생성된다', () => {
      // Given
      const baseEvent = createBaseEvent({
        date: '2025-05-15',
        repeat: {
          type: 'monthly',
          interval: 2,
          endDate: '2025-11-15',
        },
      });

      // When
      const events = generateRecurringEvents(baseEvent);

      // Then
      expect(events).toHaveLength(4);
      expect(events[0].date).toBe('2025-05-15');
      expect(events[1].date).toBe('2025-07-15');
      expect(events[2].date).toBe('2025-09-15');
      expect(events[3].date).toBe('2025-11-15');
    });

    it('yearly 반복 타입으로 interval 1일 때 매년 같은 날짜에 이벤트가 생성된다', () => {
      // Given
      const baseEvent = createBaseEvent({
        date: '2022-11-15',
        repeat: {
          type: 'yearly',
          interval: 1,
          endDate: '2025-11-15',
        },
      });

      // When
      const events = generateRecurringEvents(baseEvent);

      // Then
      expect(events).toHaveLength(4);
      expect(events[0].date).toBe('2022-11-15');
      expect(events[1].date).toBe('2023-11-15');
      expect(events[2].date).toBe('2024-11-15');
      expect(events[3].date).toBe('2025-11-15');
    });

    it('yearly 반복 타입으로 interval 2일 때 2년 간격으로 이벤트가 생성된다', () => {
      // Given
      const baseEvent = createBaseEvent({
        date: '2019-11-15',
        repeat: {
          type: 'yearly',
          interval: 2,
          endDate: '2025-11-15',
        },
      });

      // When
      const events = generateRecurringEvents(baseEvent);

      // Then
      expect(events).toHaveLength(4);
      expect(events[0].date).toBe('2019-11-15');
      expect(events[1].date).toBe('2021-11-15');
      expect(events[2].date).toBe('2023-11-15');
      expect(events[3].date).toBe('2025-11-15');
    });

    it('생성된 모든 이벤트는 고유한 id를 가진다', () => {
      // Given
      const baseEvent = createBaseEvent({
        date: '2025-11-01',
        repeat: {
          type: 'daily',
          interval: 1,
          endDate: '2025-11-05',
        },
      });

      // When
      const events = generateRecurringEvents(baseEvent);

      // Then
      const ids = events.map((e) => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(events.length);
    });

    it('생성된 모든 이벤트는 동일한 repeat.id를 공유한다', () => {
      // Given
      const baseEvent = createBaseEvent({
        date: '2025-11-01',
        repeat: {
          type: 'daily',
          interval: 1,
          endDate: '2025-11-05',
        },
      });

      // When
      const events = generateRecurringEvents(baseEvent);

      // Then
      const repeatIds = events.map((e) => e.repeat.id);
      const uniqueRepeatIds = new Set(repeatIds);
      expect(uniqueRepeatIds.size).toBe(1);
      expect(repeatIds[0]).toBeDefined();
    });

    it('endDate까지만 이벤트가 생성된다', () => {
      // Given
      const baseEvent = createBaseEvent({
        date: '2025-11-01',
        repeat: {
          type: 'daily',
          interval: 1,
          endDate: '2025-11-03',
        },
      });

      // When
      const events = generateRecurringEvents(baseEvent);

      // Then
      expect(events).toHaveLength(3);
      expect(events[events.length - 1].date).toBe('2025-11-03');
    });
  });

  describe('에지 케이스', () => {
    it('endDate가 startDate와 같으면 단일 이벤트만 반환한다', () => {
      // Given
      const baseEvent = createBaseEvent({
        date: '2025-11-01',
        repeat: {
          type: 'daily',
          interval: 1,
          endDate: '2025-11-01',
        },
      });

      // When
      const events = generateRecurringEvents(baseEvent);

      // Then
      expect(events).toHaveLength(1);
      expect(events[0].date).toBe('2025-11-01');
    });

    it('endDate가 startDate보다 이전이면 빈 배열을 반환한다', () => {
      // Given
      const baseEvent = createBaseEvent({
        date: '2025-11-01',
        repeat: {
          type: 'daily',
          interval: 1,
          endDate: '2025-10-31',
        },
      });

      // When
      const events = generateRecurringEvents(baseEvent);

      // Then
      expect(events).toHaveLength(0);
    });

    it('endDate가 없으면 MAX_END_DATE(2025-12-31)까지 이벤트가 생성된다', () => {
      // Given
      const baseEvent = createBaseEvent({
        date: '2025-12-25',
        repeat: {
          type: 'daily',
          interval: 1,
        },
      });

      // When
      const events = generateRecurringEvents(baseEvent);

      // Then
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].date).toBe('2025-12-25');
      expect(events[events.length - 1].date).toBe('2025-12-31');
      expect(events).toHaveLength(7); // 12/25 ~ 12/31 = 7일
      expect(events[0].repeat.endDate).toBe('2025-12-31');
    });

    it('repeat.type이 none이면 단일 이벤트만 반환한다', () => {
      // Given
      const baseEvent = createBaseEvent({
        date: '2025-11-01',
        repeat: {
          type: 'none',
          interval: 1,
        },
      });

      // When
      const events = generateRecurringEvents(baseEvent);

      // Then
      expect(events).toHaveLength(1);
      expect(events[0].date).toBe('2025-11-01');
    });

    it('endDate가 없고 maxOccurrences에 도달하면 생성을 중단한다', () => {
      // Given
      const baseEvent = createBaseEvent({
        date: '2025-11-01',
        repeat: {
          type: 'daily',
          interval: 1,
        },
      });

      // When
      const events = generateRecurringEvents(baseEvent, 5);

      // Then
      expect(events).toHaveLength(5);
    });

    it('monthly 31일 반복 시 31일이 없는 달은 건너뛴다', () => {
      // Given
      const baseEvent = createBaseEvent({
        date: '2025-01-31',
        repeat: {
          type: 'monthly',
          interval: 1,
          endDate: '2025-06-30',
        },
      });

      // When
      const events = generateRecurringEvents(baseEvent);

      // Then
      expect(events).toHaveLength(3);
      expect(events[0].date).toBe('2025-01-31');
      expect(events[1].date).toBe('2025-03-31');
      expect(events[2].date).toBe('2025-05-31');
    });

    it('yearly 2월 29일 반복 시 윤년이 아닌 해는 건너뛴다', () => {
      // Given
      const baseEvent = createBaseEvent({
        date: '2020-02-29',
        repeat: {
          type: 'yearly',
          interval: 1,
          endDate: '2024-03-01',
        },
      });

      // When
      const events = generateRecurringEvents(baseEvent);

      // Then
      expect(events).toHaveLength(2);
      expect(events[0].date).toBe('2020-02-29');
      expect(events[1].date).toBe('2024-02-29');
    });

    it('endDate가 2025-12-31을 초과하면 2025-12-31로 제한된다', () => {
      // Given
      const baseEvent = createBaseEvent({
        date: '2025-11-01',
        repeat: {
          type: 'monthly',
          interval: 1,
          endDate: '2026-03-01',
        },
      });

      // When
      const events = generateRecurringEvents(baseEvent);

      // Then
      expect(events).toHaveLength(2);
      expect(events[0].date).toBe('2025-11-01');
      expect(events[1].date).toBe('2025-12-01');
      expect(events[events.length - 1].date).not.toContain('2026');
    });

    it('endDate가 정확히 2025-12-31이면 정상적으로 동작한다', () => {
      // Given
      const baseEvent = createBaseEvent({
        date: '2025-10-15',
        repeat: {
          type: 'monthly',
          interval: 1,
          endDate: '2025-12-31',
        },
      });

      // When
      const events = generateRecurringEvents(baseEvent);

      // Then
      expect(events).toHaveLength(3);
      expect(events[0].date).toBe('2025-10-15');
      expect(events[1].date).toBe('2025-11-15');
      expect(events[2].date).toBe('2025-12-15');
    });
  });
});

describe('calculateNextDate', () => {
  describe('정상 케이스', () => {
    it('daily 타입으로 interval 1일 때 다음 날을 반환한다', () => {
      // Given
      const currentDate = '2025-11-15';

      // When
      const nextDate = calculateNextDate(currentDate, 'daily', 1);

      // Then
      expect(nextDate).toBe('2025-11-16');
    });

    it('daily 타입으로 interval 3일 때 3일 후를 반환한다', () => {
      // Given
      const currentDate = '2025-11-15';

      // When
      const nextDate = calculateNextDate(currentDate, 'daily', 3);

      // Then
      expect(nextDate).toBe('2025-11-18');
    });

    it('weekly 타입으로 interval 1일 때 7일 후를 반환한다', () => {
      // Given
      const currentDate = '2025-11-15';

      // When
      const nextDate = calculateNextDate(currentDate, 'weekly', 1);

      // Then
      expect(nextDate).toBe('2025-11-22');
    });

    it('weekly 타입으로 interval 2일 때 14일 후를 반환한다', () => {
      // Given
      const currentDate = '2025-11-15';

      // When
      const nextDate = calculateNextDate(currentDate, 'weekly', 2);

      // Then
      expect(nextDate).toBe('2025-11-29');
    });

    it('monthly 타입으로 interval 1일 때 1개월 후를 반환한다', () => {
      // Given
      const currentDate = '2025-11-15';

      // When
      const nextDate = calculateNextDate(currentDate, 'monthly', 1);

      // Then
      expect(nextDate).toBe('2025-12-15');
    });

    it('monthly 타입으로 interval 2일 때 2개월 후를 반환한다', () => {
      // Given
      const currentDate = '2025-11-15';

      // When
      const nextDate = calculateNextDate(currentDate, 'monthly', 2);

      // Then
      expect(nextDate).toBe('2026-01-15');
    });

    it('yearly 타입으로 interval 1일 때 1년 후를 반환한다', () => {
      // Given
      const currentDate = '2025-11-15';

      // When
      const nextDate = calculateNextDate(currentDate, 'yearly', 1);

      // Then
      expect(nextDate).toBe('2026-11-15');
    });

    it('yearly 타입으로 interval 2일 때 2년 후를 반환한다', () => {
      // Given
      const currentDate = '2025-11-15';

      // When
      const nextDate = calculateNextDate(currentDate, 'yearly', 2);

      // Then
      expect(nextDate).toBe('2027-11-15');
    });
  });

  describe('경계 케이스', () => {
    it('월 경계를 넘어갈 때 올바른 날짜를 반환한다', () => {
      // Given
      const currentDate = '2025-11-30';

      // When
      const nextDate = calculateNextDate(currentDate, 'daily', 1);

      // Then
      expect(nextDate).toBe('2025-12-01');
    });

    it('연도 경계를 넘어갈 때 올바른 날짜를 반환한다', () => {
      // Given
      const currentDate = '2024-12-31';

      // When
      const nextDate = calculateNextDate(currentDate, 'daily', 1);

      // Then
      expect(nextDate).toBe('2025-01-01');
    });

    it('monthly에서 존재하지 않는 날짜를 반환할 수 있다', () => {
      // Given
      const currentDate = '2024-01-31';

      // When
      const nextDate = calculateNextDate(currentDate, 'monthly', 1);

      // Then
      expect(nextDate).toBe('2024-02-31');
    });
  });
});

describe('isValidOccurrenceDate', () => {
  describe('daily 타입', () => {
    it('모든 날짜에 대해 true를 반환한다', () => {
      // Given
      const originalDate = '2025-11-15';
      const candidateDate = '2025-11-20';

      // When
      const isValid = isValidOccurrenceDate(originalDate, candidateDate, 'daily');

      // Then
      expect(isValid).toBe(true);
    });
  });

  describe('weekly 타입', () => {
    it('모든 날짜에 대해 true를 반환한다', () => {
      // Given
      const originalDate = '2025-11-15';
      const candidateDate = '2025-11-22';

      // When
      const isValid = isValidOccurrenceDate(originalDate, candidateDate, 'weekly');

      // Then
      expect(isValid).toBe(true);
    });
  });

  describe('monthly 타입', () => {
    it('원본 날짜와 같은 일(day)이면 true를 반환한다', () => {
      // Given
      const originalDate = '2025-11-15';
      const candidateDate = '2025-12-15';

      // When
      const isValid = isValidOccurrenceDate(originalDate, candidateDate, 'monthly');

      // Then
      expect(isValid).toBe(true);
    });

    it('원본 날짜와 다른 일(day)이면 false를 반환한다', () => {
      // Given
      const originalDate = '2025-11-15';
      const candidateDate = '2025-12-16';

      // When
      const isValid = isValidOccurrenceDate(originalDate, candidateDate, 'monthly');

      // Then
      expect(isValid).toBe(false);
    });

    it('31일 원본이 2월 31일 후보에 대해 false를 반환한다', () => {
      // Given
      const originalDate = '2024-01-31';
      const candidateDate = '2024-02-31';

      // When
      const isValid = isValidOccurrenceDate(originalDate, candidateDate, 'monthly');

      // Then
      expect(isValid).toBe(false);
    });

    it('31일 원본이 1월 31일 후보에 대해 true를 반환한다', () => {
      // Given
      const originalDate = '2024-01-31';
      const candidateDate = '2024-03-31';

      // When
      const isValid = isValidOccurrenceDate(originalDate, candidateDate, 'monthly');

      // Then
      expect(isValid).toBe(true);
    });

    it('유효하지 않은 날짜 문자열에 대해 false를 반환한다', () => {
      // Given
      const originalDate = '2025-11-15';
      const candidateDate = 'invalid-date';

      // When
      const isValid = isValidOccurrenceDate(originalDate, candidateDate, 'monthly');

      // Then
      expect(isValid).toBe(false);
    });
  });

  describe('yearly 타입', () => {
    it('원본과 같은 월, 일이면 true를 반환한다', () => {
      // Given
      const originalDate = '2025-11-15';
      const candidateDate = '2026-11-15';

      // When
      const isValid = isValidOccurrenceDate(originalDate, candidateDate, 'yearly');

      // Then
      expect(isValid).toBe(true);
    });

    it('원본과 다른 월이면 false를 반환한다', () => {
      // Given
      const originalDate = '2025-11-15';
      const candidateDate = '2026-12-15';

      // When
      const isValid = isValidOccurrenceDate(originalDate, candidateDate, 'yearly');

      // Then
      expect(isValid).toBe(false);
    });

    it('원본과 다른 일이면 false를 반환한다', () => {
      // Given
      const originalDate = '2025-11-15';
      const candidateDate = '2026-11-16';

      // When
      const isValid = isValidOccurrenceDate(originalDate, candidateDate, 'yearly');

      // Then
      expect(isValid).toBe(false);
    });

    it('2월 29일 원본이 윤년 2월 29일 후보에 대해 true를 반환한다', () => {
      // Given
      const originalDate = '2020-02-29';
      const candidateDate = '2024-02-29';

      // When
      const isValid = isValidOccurrenceDate(originalDate, candidateDate, 'yearly');

      // Then
      expect(isValid).toBe(true);
    });

    it('2월 29일 원본이 평년 2월 29일 후보에 대해 false를 반환한다', () => {
      // Given
      const originalDate = '2020-02-29';
      const candidateDate = '2021-02-29';

      // When
      const isValid = isValidOccurrenceDate(originalDate, candidateDate, 'yearly');

      // Then
      expect(isValid).toBe(false);
    });

    it('유효하지 않은 날짜 문자열에 대해 false를 반환한다', () => {
      // Given
      const originalDate = '2025-11-15';
      const candidateDate = 'invalid-date';

      // When
      const isValid = isValidOccurrenceDate(originalDate, candidateDate, 'yearly');

      // Then
      expect(isValid).toBe(false);
    });
  });
});
