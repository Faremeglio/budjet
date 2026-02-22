import { dbPromise } from '../store/schema';
import { Category, Expense, OutboxItem, Settings } from '../types/models';
import { nowIso, uid } from '../utils/date';

export class LocalRepository {
  async getWorkspaceSession() {
    const db = await dbPromise;
    const all = await db.getAll('session');
    return all[0] ?? null;
  }

  async saveWorkspaceSession(workspaceId: string, token: string, codePreview: string) {
    const db = await dbPromise;
    await db.clear('session');
    await db.put('session', { workspaceId, token, codePreview });
  }

  async clearWorkspaceSession() {
    const db = await dbPromise;
    await db.clear('session');
  }

  async getExpenses(workspaceId: string) {
    const db = await dbPromise;
    const all = await db.getAllFromIndex('expenses', 'by-workspace', workspaceId);
    return all.filter((e) => !e.deletedAt).sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  async getCategories(workspaceId: string) {
    const db = await dbPromise;
    const all = await db.getAllFromIndex('categories', 'by-workspace', workspaceId);
    return all.filter((c) => !c.deletedAt).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getSettings(workspaceId: string) {
    const db = await dbPromise;
    const all = await db.getAllFromIndex('settings', 'by-workspace', workspaceId);
    return all.find((s) => !s.deletedAt) ?? null;
  }

  async upsertExpense(expense: Expense, enqueue = true) {
    const db = await dbPromise;
    await db.put('expenses', expense);
    if (enqueue) await this.enqueue('upsert', 'expense', expense.id, expense);
  }

  async upsertCategory(category: Category, enqueue = true) {
    const db = await dbPromise;
    await db.put('categories', category);
    if (enqueue) await this.enqueue('upsert', 'category', category.id, category);
  }

  async upsertSettings(settings: Settings, enqueue = true) {
    const db = await dbPromise;
    await db.put('settings', settings);
    if (enqueue) await this.enqueue('upsert', 'settings', settings.id, settings);
  }

  async softDeleteExpense(expense: Expense) {
    await this.upsertExpense({ ...expense, deletedAt: nowIso(), updatedAt: nowIso() }, true);
  }

  async softDeleteCategory(category: Category) {
    await this.upsertCategory({ ...category, deletedAt: nowIso(), updatedAt: nowIso() }, true);
  }

  async enqueue(opType: 'upsert' | 'delete', entityType: OutboxItem['entityType'], entityId: string, payload: OutboxItem['payload']) {
    const db = await dbPromise;
    const item: OutboxItem = {
      id: uid(),
      workspaceId: payload.workspaceId,
      opType,
      entityType,
      entityId,
      payload,
      createdAt: nowIso(),
      syncedAt: null
    };
    await db.put('outbox', item);
  }

  async getUnsynced(workspaceId: string) {
    const db = await dbPromise;
    const items = await db.getAllFromIndex('outbox', 'by-workspace', workspaceId);
    return items.filter((x) => !x.syncedAt).sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
  }

  async markOutboxSynced(ids: string[]) {
    const db = await dbPromise;
    const tx = db.transaction('outbox', 'readwrite');
    for (const id of ids) {
      const item = await tx.store.get(id);
      if (item) await tx.store.put({ ...item, syncedAt: nowIso() });
    }
    await tx.done;
  }

  async countUnsynced(workspaceId: string) {
    return (await this.getUnsynced(workspaceId)).length;
  }

  async getMeta(key: string) {
    return (await dbPromise).get('meta', key);
  }

  async setMeta(key: string, value: string) {
    return (await dbPromise).put('meta', { key, value });
  }
}
