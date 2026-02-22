import { dbPromise } from '../store/schema';
import { CurrencyCode, CurrencyRate } from '../types/models';

const CACHE_HOURS = 12;

export async function getRate(base: CurrencyCode): Promise<{ data?: CurrencyRate; warning?: string }> {
  const db = await dbPromise;
  const cached = await db.get('rates', base);
  if (cached && Date.now() - new Date(cached.updatedAt).getTime() < CACHE_HOURS * 3600000) return { data: cached };

  try {
    const response = await fetch(`https://api.frankfurter.app/latest?from=${base}`);
    if (!response.ok) throw new Error('rate fetch failed');
    const data = (await response.json()) as { rates: Record<string, number> };
    const normalized: CurrencyRate = { base, rates: data.rates, updatedAt: new Date().toISOString() };
    await db.put('rates', normalized, base);
    return { data: normalized };
  } catch {
    if (cached) return { data: cached, warning: 'Курсы недоступны, используем кэш.' };
    return { warning: 'Курсы недоступны, показываем без конвертации.' };
  }
}

export function convertAmount(amount: number, from: CurrencyCode, to: CurrencyCode, rate?: CurrencyRate) {
  if (from === to || !rate) return amount;
  if (rate.base !== from) return amount;
  return amount * (rate.rates[to] ?? 1);
}
