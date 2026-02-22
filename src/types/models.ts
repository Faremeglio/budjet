export type CurrencyCode = 'USD' | 'EUR' | 'RUB' | 'GBP' | 'KZT' | 'CNY';
export type PeriodFilter = 'week' | 'month' | 'year' | 'last30';

export interface BaseEntity {
  id: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Expense extends BaseEntity {
  date: string;
  amount: number;
  currency: CurrencyCode;
  categoryId: string;
  note?: string;
}

export interface Category extends BaseEntity {
  name: string;
  color: string;
}

export interface Settings extends BaseEntity {
  baseCurrency: CurrencyCode;
  favoriteCurrencies: [CurrencyCode, CurrencyCode, CurrencyCode];
  displayCurrency: CurrencyCode;
}

export interface CurrencyRate {
  base: CurrencyCode;
  rates: Partial<Record<CurrencyCode, number>>;
  updatedAt: string;
}

export type EntityType = 'expense' | 'category' | 'settings';
export type OpType = 'upsert' | 'delete';

export interface OutboxItem {
  id: string;
  workspaceId: string;
  opType: OpType;
  entityType: EntityType;
  entityId: string;
  payload: Expense | Category | Settings;
  createdAt: string;
  syncedAt: string | null;
}

export interface WorkspaceSession {
  workspaceId: string;
  token: string;
  codePreview: string;
}

export interface SyncStatus {
  syncing: boolean;
  lastSyncedAt: string | null;
  unsyncedCount: number;
  lastError: string | null;
}
