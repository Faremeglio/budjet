import { dbPromise } from '../store/schema';
import { CurrencyCode, CurrencyRate } from '../types/models';

const CACHE_HOURS = 12;
const API_BASE = 'https://api.frankfurter.app/latest';

export async function getRate(base: CurrencyCode): Promise<{ data?: CurrencyRate; stale: boolean; warning?: string }> {
  const db = await dbPromise;
  const cached = await db.get('rates', base);
  const now = Date.now();

  if (cached) {
    const ageMs = now - new Date(cached.updatedAt).getTime();
    if (ageMs < CACHE_HOURS * 60 * 60 * 1000) {
      return { data: cached, stale: false };
    }
  }

  try {
    const response = await fetch(`${API_BASE}?from=${base}`);
    if (!response.ok) throw new Error('currency api failed');
    const result = (await response.json()) as { rates: Record<string, number> };
    const data: CurrencyRate = {
      base,
      rates: result.rates as CurrencyRate['rates'],
      updatedAt: new Date().toISOString()
    };
    await db.put('rates', data, base);
    return { data, stale: false };
  } catch {
    if (cached) {
      return { data: cached, stale: true, warning: 'Нет связи с API курсов. Используем последний кэш.' };
    }
    return { stale: true, warning: 'Нет связи с API курсов. Показываем суммы без конвертации.' };
  }
}

export function convertAmount(amount: number, from: CurrencyCode, to: CurrencyCode, rate?: CurrencyRate) {
  if (from === to) return amount;
  if (!rate) return amount;
  if (rate.base !== from) return amount;
  const direct = rate.rates[to];
  return direct ? amount * direct : amount;
}
