import { Event, EventForm, RepeatType } from '../types';

function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateRecurringEvents(
  baseEvent: EventForm,
  maxOccurrences: number = 1000
): Event[] {
  const { repeat } = baseEvent;

  // repeat.type이 'none'이면 단일 이벤트만 반환
  if (repeat.type === 'none') {
    const repeatId = generateTempId();
    return [
      {
        ...baseEvent,
        id: generateTempId(),
        repeat: { ...repeat, id: repeatId },
      },
    ];
  }

  // endDate가 없으면 maxOccurrences까지 생성
  if (!repeat.endDate) {
    const repeatId = generateTempId();
    const events: Event[] = [];
    let currentDate = baseEvent.date;

    for (let i = 0; i < maxOccurrences; i++) {
      events.push({
        ...baseEvent,
        id: generateTempId(),
        date: currentDate,
        repeat: { ...repeat, id: repeatId },
      });

      currentDate = calculateNextDate(currentDate, repeat.type, repeat.interval);
    }

    return events;
  }

  // endDate가 2025-12-31을 초과하면 2025-12-31로 제한
  const maxEndDate = '2025-12-31';
  const effectiveEndDate = repeat.endDate > maxEndDate ? maxEndDate : repeat.endDate;

  // endDate가 startDate보다 이전이면 빈 배열 반환
  const startDate = new Date(baseEvent.date);
  const endDate = new Date(effectiveEndDate);

  if (endDate < startDate) {
    return [];
  }

  // 반복 일정 생성
  const repeatId = generateTempId();
  const events: Event[] = [];
  let currentDate = baseEvent.date;
  let count = 0;

  while (count < maxOccurrences) {
    const current = new Date(currentDate);
    if (current > endDate) {
      break;
    }

    // isValidOccurrenceDate로 유효성 검증
    if (isValidOccurrenceDate(baseEvent.date, currentDate, repeat.type)) {
      events.push({
        ...baseEvent,
        id: generateTempId(),
        date: currentDate,
        repeat: { ...repeat, endDate: effectiveEndDate, id: repeatId },
      });
    }

    currentDate = calculateNextDate(currentDate, repeat.type, repeat.interval);
    count++;
  }

  return events;
}

export function calculateNextDate(
  currentDate: string,
  repeatType: RepeatType,
  interval: number
): string {
  // interval이 0 이하면 기본값 1 사용
  const validInterval = interval > 0 ? interval : 1;

  const [year, month, day] = currentDate.split('-').map(Number);

  switch (repeatType) {
    case 'daily': {
      const date = new Date(year, month - 1, day);
      date.setDate(date.getDate() + validInterval);
      const newYear = date.getFullYear();
      const newMonth = String(date.getMonth() + 1).padStart(2, '0');
      const newDay = String(date.getDate()).padStart(2, '0');
      return `${newYear}-${newMonth}-${newDay}`;
    }
    case 'weekly': {
      const date = new Date(year, month - 1, day);
      date.setDate(date.getDate() + validInterval * 7);
      const newYear = date.getFullYear();
      const newMonth = String(date.getMonth() + 1).padStart(2, '0');
      const newDay = String(date.getDate()).padStart(2, '0');
      return `${newYear}-${newMonth}-${newDay}`;
    }
    case 'monthly': {
      // 월만 증가시키고 일은 그대로 유지 (존재하지 않는 날짜도 포함)
      let newYear = year;
      let newMonth = month + validInterval;

      // 월이 12를 넘으면 연도 조정
      while (newMonth > 12) {
        newYear++;
        newMonth -= 12;
      }

      const formattedMonth = String(newMonth).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      return `${newYear}-${formattedMonth}-${formattedDay}`;
    }
    case 'yearly': {
      // 연도만 증가시키고 월/일은 그대로 유지 (존재하지 않는 날짜도 포함)
      const newYear = year + validInterval;
      const formattedMonth = String(month).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      return `${newYear}-${formattedMonth}-${formattedDay}`;
    }
    default:
      return currentDate;
  }
}

export function isValidOccurrenceDate(
  originalDate: string,
  candidateDate: string,
  repeatType: RepeatType
): boolean {
  // daily와 weekly는 항상 true
  if (repeatType === 'daily' || repeatType === 'weekly') {
    return true;
  }

  // 날짜 파싱
  const original = new Date(originalDate);
  const candidate = new Date(candidateDate);

  // 유효하지 않은 날짜 확인
  if (isNaN(original.getTime()) || isNaN(candidate.getTime())) {
    return false;
  }

  // monthly: 같은 일(day)이어야 하고, 날짜가 유효해야 함
  if (repeatType === 'monthly') {
    const originalDay = original.getDate();
    const candidateDay = candidate.getDate();

    // 날짜가 일치하지 않으면 false
    if (originalDay !== candidateDay) {
      return false;
    }

    // 후보 날짜가 유효한지 확인 (예: 2025-02-31은 유효하지 않음)
    const [year, month, day] = candidateDate.split('-').map(Number);
    const testDate = new Date(year, month - 1, day);

    return (
      testDate.getFullYear() === year &&
      testDate.getMonth() === month - 1 &&
      testDate.getDate() === day
    );
  }

  // yearly: 같은 월/일이어야 하고, 날짜가 유효해야 함
  if (repeatType === 'yearly') {
    const originalMonth = original.getMonth();
    const originalDay = original.getDate();
    const candidateMonth = candidate.getMonth();
    const candidateDay = candidate.getDate();

    // 월과 일이 일치하지 않으면 false
    if (originalMonth !== candidateMonth || originalDay !== candidateDay) {
      return false;
    }

    // 후보 날짜가 유효한지 확인 (예: 평년의 2월 29일은 유효하지 않음)
    const [year, month, day] = candidateDate.split('-').map(Number);
    const testDate = new Date(year, month - 1, day);

    return (
      testDate.getFullYear() === year &&
      testDate.getMonth() === month - 1 &&
      testDate.getDate() === day
    );
  }

  return false;
}
