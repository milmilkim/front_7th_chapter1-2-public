describe('generateRecurringEvents', () => {
  describe('정상 케이스', () => {
    it('daily 반복 타입으로 interval 1일 때 매일 이벤트가 생성된다', () => {});

    it('daily 반복 타입으로 interval 3일 때 3일 간격으로 이벤트가 생성된다', () => {});

    it('weekly 반복 타입으로 interval 1일 때 매주 같은 요일에 이벤트가 생성된다', () => {});

    it('weekly 반복 타입으로 interval 2일 때 2주 간격으로 이벤트가 생성된다', () => {});

    it('monthly 반복 타입으로 interval 1일 때 매월 같은 날짜에 이벤트가 생성된다', () => {});

    it('monthly 반복 타입으로 interval 2일 때 2개월 간격으로 이벤트가 생성된다', () => {});

    it('yearly 반복 타입으로 interval 1일 때 매년 같은 날짜에 이벤트가 생성된다', () => {});

    it('yearly 반복 타입으로 interval 2일 때 2년 간격으로 이벤트가 생성된다', () => {});

    it('생성된 모든 이벤트는 고유한 id를 가진다', () => {});

    it('생성된 모든 이벤트는 동일한 repeat.id를 공유한다', () => {});

    it('endDate까지만 이벤트가 생성된다', () => {});
  });

  describe('에지 케이스', () => {
    it('endDate가 startDate와 같으면 단일 이벤트만 반환한다', () => {});

    it('endDate가 startDate보다 이전이면 빈 배열을 반환한다', () => {});

    it('repeat.type이 none이면 단일 이벤트만 반환한다', () => {});

    it('endDate가 없고 maxOccurrences에 도달하면 생성을 중단한다', () => {});

    it('monthly 31일 반복 시 31일이 없는 달은 건너뛴다', () => {});

    it('yearly 2월 29일 반복 시 윤년이 아닌 해는 건너뛴다', () => {});
  });
});

describe('calculateNextDate', () => {
  describe('정상 케이스', () => {
    it('daily 타입으로 interval 1일 때 다음 날을 반환한다', () => {});

    it('daily 타입으로 interval 3일 때 3일 후를 반환한다', () => {});

    it('weekly 타입으로 interval 1일 때 7일 후를 반환한다', () => {});

    it('weekly 타입으로 interval 2일 때 14일 후를 반환한다', () => {});

    it('monthly 타입으로 interval 1일 때 1개월 후를 반환한다', () => {});

    it('monthly 타입으로 interval 2일 때 2개월 후를 반환한다', () => {});

    it('yearly 타입으로 interval 1일 때 1년 후를 반환한다', () => {});

    it('yearly 타입으로 interval 2일 때 2년 후를 반환한다', () => {});
  });

  describe('경계 케이스', () => {
    it('월 경계를 넘어갈 때 올바른 날짜를 반환한다', () => {});

    it('연도 경계를 넘어갈 때 올바른 날짜를 반환한다', () => {});

    it('monthly에서 존재하지 않는 날짜를 반환할 수 있다', () => {});
  });
});

describe('isValidOccurrenceDate', () => {
  describe('daily 타입', () => {
    it('모든 날짜에 대해 true를 반환한다', () => {});
  });

  describe('weekly 타입', () => {
    it('모든 날짜에 대해 true를 반환한다', () => {});
  });

  describe('monthly 타입', () => {
    it('원본 날짜와 같은 일(day)이면 true를 반환한다', () => {});

    it('원본 날짜와 다른 일(day)이면 false를 반환한다', () => {});

    it('31일 원본이 2월 31일 후보에 대해 false를 반환한다', () => {});

    it('31일 원본이 1월 31일 후보에 대해 true를 반환한다', () => {});

    it('유효하지 않은 날짜 문자열에 대해 false를 반환한다', () => {});
  });

  describe('yearly 타입', () => {
    it('원본과 같은 월, 일이면 true를 반환한다', () => {});

    it('원본과 다른 월이면 false를 반환한다', () => {});

    it('원본과 다른 일이면 false를 반환한다', () => {});

    it('2월 29일 원본이 윤년 2월 29일 후보에 대해 true를 반환한다', () => {});

    it('2월 29일 원본이 평년 2월 29일 후보에 대해 false를 반환한다', () => {});

    it('유효하지 않은 날짜 문자열에 대해 false를 반환한다', () => {});
  });
});
