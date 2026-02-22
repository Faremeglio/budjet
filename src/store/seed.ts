import { Category, Settings } from '../types/models';
import { nowIso, todayISO, uid } from '../utils/date';
import { LocalRepository } from '../sync/localRepository';

export async function seedWorkspace(repo: LocalRepository, workspaceId: string) {
  const existingSettings = await repo.getSettings(workspaceId);
  if (existingSettings) return;

  const now = nowIso();
  const categories: Category[] = [
    { id: uid(), workspaceId, createdAt: now, updatedAt: now, deletedAt: null, name: 'Продукты', color: '#22c55e' },
    { id: uid(), workspaceId, createdAt: now, updatedAt: now, deletedAt: null, name: 'Транспорт', color: '#3b82f6' },
    { id: uid(), workspaceId, createdAt: now, updatedAt: now, deletedAt: null, name: 'Дом', color: '#f97316' }
  ];
  for (const c of categories) await repo.upsertCategory(c, false);

  const settings: Settings = {
    id: uid(),
    workspaceId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    baseCurrency: 'RUB',
    favoriteCurrencies: ['RUB', 'USD', 'EUR'],
    displayCurrency: 'RUB'
  };
  await repo.upsertSettings(settings, false);

  await repo.upsertExpense(
    {
      id: uid(),
      workspaceId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      date: todayISO(),
      amount: 1000,
      currency: 'RUB',
      categoryId: categories[0].id,
      note: 'Seed расход'
    },
    false
  );
}
