import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

import { Event, EventForm } from '../types';
import { generateRecurringEvents } from '../utils/recurringEventUtils';

export const useEventOperations = (editing: boolean, onSave?: () => void) => {
  const [events, setEvents] = useState<Event[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const { events } = await response.json();
      setEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      enqueueSnackbar('이벤트 로딩 실패', { variant: 'error' });
    }
  };

  const saveEvent = async (eventData: Event | EventForm) => {
    try {
      let response;
      if (editing) {
        response = await fetch(`/api/events/${(eventData as Event).id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });
      } else {
        response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to save event');
      }

      await fetchEvents();
      onSave?.();
      enqueueSnackbar(editing ? '일정이 수정되었습니다.' : '일정이 추가되었습니다.', {
        variant: 'success',
      });
    } catch (error) {
      console.error('Error saving event:', error);
      enqueueSnackbar('일정 저장 실패', { variant: 'error' });
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      await fetchEvents();
      enqueueSnackbar('일정이 삭제되었습니다.', { variant: 'info' });
    } catch (error) {
      console.error('Error deleting event:', error);
      enqueueSnackbar('일정 삭제 실패', { variant: 'error' });
    }
  };

  const saveEventList = async (eventList: EventForm[]) => {
    try {
      // 반복 일정이면 이벤트 생성
      const eventsToSave: (Event | EventForm)[] = [];
      for (const eventData of eventList) {
        if (eventData.repeat.type !== 'none') {
          // 반복 일정: generateRecurringEvents로 여러 이벤트 생성
          const recurringEvents = generateRecurringEvents(eventData);
          eventsToSave.push(...recurringEvents);
        } else {
          // 일반 일정: 그대로 추가 (id는 서버에서 생성)
          eventsToSave.push(eventData);
        }
      }

      const response = await fetch('/api/events-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToSave }),
      });

      if (!response.ok) {
        throw new Error('Failed to save event list');
      }

      await fetchEvents();
      onSave?.();
      enqueueSnackbar('반복 일정이 추가되었습니다.', { variant: 'success' });
    } catch (error) {
      console.error('Error saving event list:', error);
      enqueueSnackbar('일정 목록 저장 실패', { variant: 'error' });
    }
  };

  const saveEventSeries = async (eventData: Event) => {
    try {
      if (!eventData.repeat.id) {
        await saveEvent(eventData);
        return;
      }

      const updateData = {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        category: eventData.category,
        notificationTime: eventData.notificationTime,
        repeat: eventData.repeat,
      };

      const response = await fetch(`/api/recurring-events/${eventData.repeat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update recurring events');
      }

      await fetchEvents();
      onSave?.();
      enqueueSnackbar('일정이 수정되었습니다.', { variant: 'success' });
    } catch (error) {
      console.error('Error saving event series:', error);
      enqueueSnackbar('일정 저장 실패', { variant: 'error' });
    }
  };

  const deleteEventSeries = async (repeatId: string) => {
    try {
      const response = await fetch(`/api/recurring-events/${repeatId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete recurring events');
      }

      await fetchEvents();
      enqueueSnackbar('일정이 삭제되었습니다.', { variant: 'info' });
    } catch (error) {
      console.error('Error deleting event series:', error);
      enqueueSnackbar('일정 삭제 실패', { variant: 'error' });
    }
  };

  async function init() {
    await fetchEvents();
    enqueueSnackbar('일정 로딩 완료!', { variant: 'info' });
  }

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    events,
    fetchEvents,
    saveEvent,
    deleteEvent,
    saveEventList,
    saveEventSeries,
    deleteEventSeries,
  };
};
