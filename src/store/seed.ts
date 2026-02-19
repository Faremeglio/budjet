import { dbPromise } from './schema';
import { Category, Settings } from '../types/models';
import { todayISO, uid } from '../utils/date';

const starterCategories: Category[] = [
  { id: uid(), name: 'Продукты', color: '#22c55e', archived: false },
  { id: uid(), name: 'Транспорт', color: '#3b82f6', archived: false },
  { id: uid(), name: 'Дом', color: '#f97316', archived: false },
  { id: uid(), name: 'Здоровье', color: '#ef4444', archived: false }
];

const starterSettings: Settings = {
  baseCurrency: 'RUB',
  favoriteCurrencies: ['RUB', 'USD', 'EUR'],
  displayCurrency: 'RUB'
};

export async function initializeDB() {
  const db = await dbPromise;
  const seeded = await db.get('meta', 'seeded');
  if (seeded) return;

  const tx = db.transaction(['categories', 'settings', 'expenses', 'meta'], 'readwrite');

  for (const category of starterCategories) {
    await tx.objectStore('categories').put(category);
  }

  await tx.objectStore('settings').put(starterSettings, 'settings');
  await tx.objectStore('expenses').put({
    id: uid(),
    createdAt: new Date().toISOString(),
    date: todayISO(),
    amount: 1200,
    currency: 'RUB',
    categoryId: starterCategories[0].id,
    note: 'Seed: продукты на неделю'
  });

  await tx.objectStore('meta').put({ key: 'seeded', value: new Date().toISOString() });
  await tx.done;
}
