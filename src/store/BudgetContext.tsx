import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import {
  archiveCategory,
  canDeleteCategory,
  deleteExpense,
  getCategories,
  getExpenses,
  getSettings,
  hardDeleteCategory,
  saveSettings,
  upsertCategory,
  upsertExpense
} from '../services/db';
import { convertAmount, getRate } from '../services/rates';
import { initializeDB } from './seed';
import { Category, CurrencyCode, Expense, Settings } from '../types/models';

interface BudgetCtx {
  expenses: Expense[];
  categories: Category[];
  settings: Settings | null;
  rateWarning: string;
  loading: boolean;
  addOrUpdateExpense: (expense: Expense) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  addOrUpdateCategory: (category: Category) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
  convertToDisplay: (amount: number, from: CurrencyCode) => number;
  refresh: () => Promise<void>;
}

const Context = createContext<BudgetCtx | null>(null);

export function BudgetProvider({ children }: PropsWithChildren) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [rateWarning, setRateWarning] = useState('');
  const [currentRate, setCurrentRate] = useState<Awaited<ReturnType<typeof getRate>>['data']>();

  const refresh = async () => {
    await initializeDB();
    const [exp, cat, cfg] = await Promise.all([getExpenses(), getCategories(), getSettings()]);
    setExpenses(exp.sort((a, b) => (a.date < b.date ? 1 : -1)));
    setCategories(cat.sort((a, b) => (a.archived === b.archived ? 0 : a.archived ? 1 : -1)));
    setSettings(cfg ?? null);

    if (cfg) {
      const rateResult = await getRate(cfg.displayCurrency);
      setCurrentRate(rateResult.data);
      setRateWarning(rateResult.warning ?? '');
    }

    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const api = useMemo<BudgetCtx>(
    () => ({
      expenses,
      categories,
      settings,
      loading,
      rateWarning,
      refresh,
      addOrUpdateExpense: async (expense) => {
        await upsertExpense(expense);
        await refresh();
      },
      removeExpense: async (id) => {
        await deleteExpense(id);
        await refresh();
      },
      addOrUpdateCategory: async (category) => {
        await upsertCategory(category);
        await refresh();
      },
      removeCategory: async (id) => {
        if (await canDeleteCategory(id)) {
          await hardDeleteCategory(id);
        } else {
          await archiveCategory(id);
        }
        await refresh();
      },
      updateSettings: async (newSettings) => {
        await saveSettings(newSettings);
        await refresh();
      },
      convertToDisplay: (amount, from) => {
        const to = settings?.displayCurrency;
        if (!to) return amount;
        return convertAmount(amount, from, to, currentRate);
      }
    }),
    [expenses, categories, settings, loading, rateWarning, currentRate]
  );

  return <Context.Provider value={api}>{children}</Context.Provider>;
}

export function useBudget() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useBudget must be inside provider');
  return ctx;
}
