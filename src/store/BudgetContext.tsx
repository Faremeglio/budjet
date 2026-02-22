import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { getRate, convertAmount } from '../services/rates';
import { seedWorkspace } from './seed';
import { LocalRepository } from '../sync/localRepository';
import { RemoteRepository } from '../sync/remoteRepository';
import { SyncEngine } from '../sync/syncEngine';
import { Category, CurrencyCode, Expense, Settings, SyncStatus, WorkspaceSession } from '../types/models';
import { nowIso, uid } from '../utils/date';

interface BudgetCtx {
  session: WorkspaceSession | null;
  expenses: Expense[];
  categories: Category[];
  settings: Settings | null;
  loading: boolean;
  rateWarning: string;
  syncStatus: SyncStatus;
  connectWithCode: (code: string) => Promise<void>;
  createFamily: () => Promise<string>;
  logout: () => Promise<void>;
  syncNow: () => Promise<void>;
  upsertExpense: (draft: Omit<Expense, 'workspaceId' | 'createdAt' | 'updatedAt' | 'deletedAt'> & { id?: string }) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  upsertCategory: (draft: Omit<Category, 'workspaceId' | 'createdAt' | 'updatedAt' | 'deletedAt'> & { id?: string }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  saveSettings: (draft: Settings) => Promise<void>;
  convertToDisplay: (amount: number, from: CurrencyCode) => number;
}

const local = new LocalRepository();
const remote = new RemoteRepository();
const syncEngine = new SyncEngine(local, remote);

const Context = createContext<BudgetCtx | null>(null);

export function BudgetProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<WorkspaceSession | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [rateWarning, setRateWarning] = useState('');
  const [rate, setRate] = useState<Awaited<ReturnType<typeof getRate>>['data']>();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ syncing: false, lastSyncedAt: null, unsyncedCount: 0, lastError: null });

  const refresh = async (currentSession = session) => {
    if (!currentSession) return;
    const [exp, cat, cfg] = await Promise.all([
      local.getExpenses(currentSession.workspaceId),
      local.getCategories(currentSession.workspaceId),
      local.getSettings(currentSession.workspaceId)
    ]);
    setExpenses(exp);
    setCategories(cat);
    setSettings(cfg);
    const unsyncedCount = await local.countUnsynced(currentSession.workspaceId);
    const lastSyncedAt = (await local.getMeta(`lastSyncedAt:${currentSession.workspaceId}`))?.value ?? null;
    setSyncStatus((prev) => ({ ...prev, unsyncedCount, lastSyncedAt }));

    if (cfg) {
      const rr = await getRate(cfg.displayCurrency);
      setRate(rr.data);
      setRateWarning(rr.warning ?? '');
    }
  };

  const syncNow = async () => {
    if (!session) return;
    setSyncStatus((s) => ({ ...s, syncing: true, lastError: null }));
    const result = await syncEngine.run(session.workspaceId, session.token);
    setSyncStatus(result);
    await refresh(session);
  };

  useEffect(() => {
    (async () => {
      const saved = await local.getWorkspaceSession();
      if (saved) {
        setSession(saved);
        await seedWorkspace(local, saved.workspaceId);
        await refresh(saved);
        void syncNow();
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const onOnline = () => {
      void syncNow();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [session]);

  const api = useMemo<BudgetCtx>(
    () => ({
      session,
      expenses,
      categories,
      settings,
      loading,
      rateWarning,
      syncStatus,
      connectWithCode: async (code) => {
        const data = await remote.connectByCode(code);
        const next = { workspaceId: data.workspaceId, token: data.token, codePreview: code.slice(-4) };
        await local.saveWorkspaceSession(next.workspaceId, next.token, next.codePreview);
        setSession(next);
        await seedWorkspace(local, next.workspaceId);
        await refresh(next);
        await syncNow();
      },
      createFamily: async () => {
        const data = await remote.createWorkspace();
        const next = { workspaceId: data.workspaceId, token: data.token, codePreview: data.code.slice(-4) };
        await local.saveWorkspaceSession(next.workspaceId, next.token, next.codePreview);
        setSession(next);
        await seedWorkspace(local, next.workspaceId);
        await refresh(next);
        await syncNow();
        return data.code;
      },
      logout: async () => {
        await local.clearWorkspaceSession();
        setSession(null);
        setExpenses([]);
        setCategories([]);
        setSettings(null);
      },
      syncNow,
      upsertExpense: async (draft) => {
        if (!session) return;
        const now = nowIso();
        const existing = draft.id ? expenses.find((e) => e.id === draft.id) : null;
        await local.upsertExpense({
          ...draft,
          id: draft.id ?? uid(),
          workspaceId: session.workspaceId,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          deletedAt: null
        });
        await refresh();
      },
      deleteExpense: async (id) => {
        const current = expenses.find((x) => x.id === id);
        if (!current) return;
        await local.softDeleteExpense(current);
        await refresh();
      },
      upsertCategory: async (draft) => {
        if (!session) return;
        const now = nowIso();
        const existing = draft.id ? categories.find((c) => c.id === draft.id) : null;
        await local.upsertCategory({
          ...draft,
          id: draft.id ?? uid(),
          workspaceId: session.workspaceId,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          deletedAt: null
        });
        await refresh();
      },
      deleteCategory: async (id) => {
        const current = categories.find((x) => x.id === id);
        if (!current) return;
        await local.softDeleteCategory(current);
        await refresh();
      },
      saveSettings: async (draft) => {
        await local.upsertSettings({ ...draft, updatedAt: nowIso(), deletedAt: null });
        await refresh();
      },
      convertToDisplay: (amount, from) => {
        if (!settings) return amount;
        return convertAmount(amount, from, settings.displayCurrency, rate);
      }
    }),
    [session, expenses, categories, settings, loading, rateWarning, syncStatus, rate]
  );

  return <Context.Provider value={api}>{children}</Context.Provider>;
}

export function useBudget() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useBudget must be inside BudgetProvider');
  return ctx;
}
