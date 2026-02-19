import { DBSchema, openDB } from 'idb';
import { Category, CurrencyRate, Expense, Settings } from '../types/models';

interface BudgetDB extends DBSchema {
  expenses: {
    key: string;
    value: Expense;
    indexes: { 'by-date': string; 'by-category': string };
  };
  categories: {
    key: string;
    value: Category;
  };
  settings: {
    key: string;
    value: Settings;
  };
  rates: {
    key: string;
    value: CurrencyRate;
  };
  meta: {
    key: string;
    value: { key: string; value: string };
  };
}

const DB_NAME = 'family-budget-db';
const DB_VERSION = 1;

export const dbPromise = openDB<BudgetDB>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
    expenseStore.createIndex('by-date', 'date');
    expenseStore.createIndex('by-category', 'categoryId');

    db.createObjectStore('categories', { keyPath: 'id' });
    db.createObjectStore('settings');
    db.createObjectStore('rates');
    db.createObjectStore('meta', { keyPath: 'key' });
  }
});
