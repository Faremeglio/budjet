import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(URL, SERVICE_ROLE);

async function authWorkspace(req: Request, workspaceId: string) {
  const header = req.headers.get('authorization') ?? '';
  const token = header.replace('Bearer ', '');
  const { data } = await supabase.from('workspace_sessions').select('workspace_id').eq('token', token).single();
  return data?.workspace_id === workspaceId;
}

Deno.serve(async (req) => {
  const body = await req.json();
  const { mode, workspaceId } = body;

  if (!(await authWorkspace(req, workspaceId))) {
    return new Response(JSON.stringify({ error: 'Unauthorized workspace' }), { status: 401 });
  }

  if (mode === 'push') {
    const items = body.items as Array<{ entityType: string; payload: Record<string, unknown> }>;
    for (const item of items) {
      const table = `${item.entityType}s`;
      await supabase.from(table).upsert(item.payload);
    }
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  }

  const lastSyncedAt = body.lastSyncedAt ?? '1970-01-01T00:00:00.000Z';
  const [expenses, categories, settings] = await Promise.all([
    supabase.from('expenses').select('*').eq('workspace_id', workspaceId).gte('updated_at', lastSyncedAt),
    supabase.from('categories').select('*').eq('workspace_id', workspaceId).gte('updated_at', lastSyncedAt),
    supabase.from('settings').select('*').eq('workspace_id', workspaceId).gte('updated_at', lastSyncedAt)
  ]);

  return new Response(
    JSON.stringify({
      expenses: (expenses.data ?? []).map((x) => ({
        id: x.id, workspaceId: x.workspace_id, createdAt: x.created_at, updatedAt: x.updated_at, deletedAt: x.deleted_at,
        date: x.date, amount: Number(x.amount), currency: x.currency, categoryId: x.category_id, note: x.note ?? undefined
      })),
      categories: (categories.data ?? []).map((x) => ({
        id: x.id, workspaceId: x.workspace_id, createdAt: x.created_at, updatedAt: x.updated_at, deletedAt: x.deleted_at,
        name: x.name, color: x.color
      })),
      settings: (settings.data ?? []).map((x) => ({
        id: x.id, workspaceId: x.workspace_id, createdAt: x.created_at, updatedAt: x.updated_at, deletedAt: x.deleted_at,
        baseCurrency: x.base_currency, favoriteCurrencies: x.favorite_currencies, displayCurrency: x.display_currency
      })),
      serverNow: new Date().toISOString()
    }),
    { headers: { 'content-type': 'application/json' } }
  );
});
