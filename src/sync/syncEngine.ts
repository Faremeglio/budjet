import { LocalRepository } from './localRepository';
import { RemoteRepository } from './remoteRepository';
import { Category, Expense, Settings, SyncStatus } from '../types/models';

export class SyncEngine {
  constructor(
    private local: LocalRepository,
    private remote: RemoteRepository
  ) {}

  async run(workspaceId: string, token: string): Promise<SyncStatus> {
    try {
      const unsynced = await this.local.getUnsynced(workspaceId);
      if (unsynced.length > 0) {
        await this.remote.pushOutbox(token, workspaceId, unsynced);
        await this.local.markOutboxSynced(unsynced.map((x) => x.id));
      }

      const lastSyncedAt = (await this.local.getMeta(`lastSyncedAt:${workspaceId}`))?.value ?? null;
      const pulled = await this.remote.pullChanges(token, workspaceId, lastSyncedAt);
      await this.applyPulled(workspaceId, pulled.expenses, pulled.categories, pulled.settings);
      await this.local.setMeta(`lastSyncedAt:${workspaceId}`, pulled.serverNow);

      return {
        syncing: false,
        lastSyncedAt: pulled.serverNow,
        unsyncedCount: await this.local.countUnsynced(workspaceId),
        lastError: null
      };
    } catch (error) {
      return {
        syncing: false,
        lastSyncedAt: (await this.local.getMeta(`lastSyncedAt:${workspaceId}`))?.value ?? null,
        unsyncedCount: await this.local.countUnsynced(workspaceId),
        lastError: error instanceof Error ? error.message : 'Sync error'
      };
    }
  }

  private async applyPulled(workspaceId: string, expenses: Expense[], categories: Category[], settings: Settings[]) {
    for (const x of expenses) {
      const local = (await this.local.getExpenses(workspaceId)).find((i) => i.id === x.id);
      if (!local || local.updatedAt <= x.updatedAt) {
        await this.local.upsertExpense(x, false);
      }
    }
    for (const x of categories) {
      const local = (await this.local.getCategories(workspaceId)).find((i) => i.id === x.id);
      if (!local || local.updatedAt <= x.updatedAt) {
        await this.local.upsertCategory(x, false);
      }
    }
    for (const x of settings) {
      const local = await this.local.getSettings(workspaceId);
      if (!local || local.updatedAt <= x.updatedAt) {
        await this.local.upsertSettings(x, false);
      }
    }
  }
}
