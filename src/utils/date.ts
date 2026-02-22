import { PeriodFilter } from '../types/models';

export function nowIso() {
  return new Date().toISOString();
}

export function todayISO() {
  return nowIso().slice(0, 10);
}

export function uid() {
  return crypto.randomUUID();
}

export function formatDateLabel(date: string) {
  return new Date(date).toLocaleDateString('ru-RU', { weekday: 'short', day: '2-digit', month: 'short' });
}

export function monthKey(date: string) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getPeriodRange(filter: PeriodFilter) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const start = new Date(end);

  if (filter === 'week') {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
  } else if (filter === 'month') {
    start.setDate(1);
  } else if (filter === 'year') {
    start.setMonth(0, 1);
  } else {
    start.setDate(start.getDate() - 29);
  }

  start.setHours(0, 0, 0, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}
