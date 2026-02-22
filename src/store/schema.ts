import { DBSchema, openDB } from 'idb';
import { Category, CurrencyRate, Expense, OutboxItem, Settings, WorkspaceSession } from '../types/models';

interface BudgetDB extends DBSchema {
  expenses: { key: string; value: Expense; indexes: { 'by-workspace': string; 'by-updatedAt': string; 'by-date': string } };
  categories: { key: string; value: Category; indexes: { 'by-workspace': string; 'by-updatedAt': string } };
  settings: { key: string; value: Settings; indexes: { 'by-workspace': string; 'by-updatedAt': string } };
  rates: { key: string; value: CurrencyRate };
  outbox: { key: string; value: OutboxItem; indexes: { 'by-workspace': string; 'by-syncedAt': string } };
  meta: { key: string; value: { key: string; value: string } };
  session: { key: string; value: WorkspaceSession };
}

export const dbPromise = openDB<BudgetDB>('family-budget-db', 2, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      const expenses = db.createObjectStore('expenses', { keyPath: 'id' });
      expenses.createIndex('by-workspace', 'workspaceId');
      expenses.createIndex('by-updatedAt', 'updatedAt');
      expenses.createIndex('by-date', 'date');

      const categories = db.createObjectStore('categories', { keyPath: 'id' });
      categories.createIndex('by-workspace', 'workspaceId');
      categories.createIndex('by-updatedAt', 'updatedAt');

      const settings = db.createObjectStore('settings', { keyPath: 'id' });
      settings.createIndex('by-workspace', 'workspaceId');
      settings.createIndex('by-updatedAt', 'updatedAt');

      db.createObjectStore('rates');
      const outbox = db.createObjectStore('outbox', { keyPath: 'id' });
      outbox.createIndex('by-workspace', 'workspaceId');
      outbox.createIndex('by-syncedAt', 'syncedAt');

      db.createObjectStore('meta', { keyPath: 'key' });
      db.createObjectStore('session', { keyPath: 'workspaceId' });
    }
  }
});
