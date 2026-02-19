export type CurrencyCode = 'USD' | 'EUR' | 'RUB' | 'GBP' | 'KZT' | 'CNY';

export interface Expense {
  id: string;
  createdAt: string;
  date: string;
  amount: number;
  currency: CurrencyCode;
  categoryId: string;
  note?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  archived: boolean;
}

export interface Settings {
  baseCurrency: CurrencyCode;
  favoriteCurrencies: [CurrencyCode, CurrencyCode, CurrencyCode];
  displayCurrency: CurrencyCode;
}

export interface CurrencyRate {
  base: CurrencyCode;
  rates: Partial<Record<CurrencyCode, number>>;
  updatedAt: string;
}

export type PeriodFilter = 'week' | 'month' | 'year' | 'last30';
