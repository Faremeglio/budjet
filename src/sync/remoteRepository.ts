import { supabase } from '../lib/supabase';
import { Category, Expense, OutboxItem, Settings } from '../types/models';

interface PullResult {
  expenses: Expense[];
  categories: Category[];
  settings: Settings[];
  serverNow: string;
}

export class RemoteRepository {
  async createWorkspace() {
    if (!supabase) throw new Error('Supabase env not configured');
    const { data, error } = await supabase.functions.invoke('create', { body: {} });
    if (error) throw error;
    return data as { workspaceId: string; token: string; code: string };
  }

  async connectByCode(code: string) {
    if (!supabase) throw new Error('Supabase env not configured');
    const { data, error } = await supabase.functions.invoke('connect', { body: { code } });
    if (error) throw error;
    return data as { workspaceId: string; token: string };
  }

  async pushOutbox(token: string, workspaceId: string, items: OutboxItem[]) {
    if (!supabase || items.length === 0) return;
    const { error } = await supabase.functions.invoke('sync', {
      body: { mode: 'push', workspaceId, items },
      headers: { Authorization: `Bearer ${token}` }
    });
    if (error) throw error;
  }

  async pullChanges(token: string, workspaceId: string, lastSyncedAt: string | null) {
    if (!supabase) throw new Error('Supabase env not configured');
    const { data, error } = await supabase.functions.invoke('sync', {
      body: { mode: 'pull', workspaceId, lastSyncedAt },
      headers: { Authorization: `Bearer ${token}` }
    });
    if (error) throw error;
    return data as PullResult;
  }
}
