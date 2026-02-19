import { dbPromise } from '../store/schema';
import { Category, Expense, Settings } from '../types/models';

export async function getExpenses() {
  return (await dbPromise).getAll('expenses');
}

export async function upsertExpense(expense: Expense) {
  return (await dbPromise).put('expenses', expense);
}

export async function deleteExpense(id: string) {
  return (await dbPromise).delete('expenses', id);
}

export async function getCategories() {
  return (await dbPromise).getAll('categories');
}

export async function upsertCategory(category: Category) {
  return (await dbPromise).put('categories', category);
}

export async function canDeleteCategory(id: string) {
  const db = await dbPromise;
  const usage = await db.getAllFromIndex('expenses', 'by-category', id);
  return usage.length === 0;
}

export async function archiveCategory(id: string) {
  const db = await dbPromise;
  const category = await db.get('categories', id);
  if (!category) return;
  category.archived = true;
  await db.put('categories', category);
}

export async function hardDeleteCategory(id: string) {
  return (await dbPromise).delete('categories', id);
}

export async function getSettings() {
  return (await dbPromise).get('settings', 'settings');
}

export async function saveSettings(settings: Settings) {
  return (await dbPromise).put('settings', settings, 'settings');
}
