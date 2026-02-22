import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SALT = Deno.env.get('FAMILY_CODE_SALT') ?? 'dev-salt';
const supabase = createClient(URL, SERVICE_ROLE);

async function sha256(text: string) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const body = await req.json();
  const code = String(body.code ?? '').trim().toUpperCase();
  const familyCodeHash = await sha256(`${SALT}:${code}`);

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('id')
    .eq('family_code_hash', familyCodeHash)
    .single();
  if (error || !workspace) return new Response(JSON.stringify({ error: 'Invalid code' }), { status: 404 });

  const token = crypto.randomUUID();
  await supabase.from('workspace_sessions').insert({ token, workspace_id: workspace.id });

  return new Response(JSON.stringify({ workspaceId: workspace.id, token }), { headers: { 'content-type': 'application/json' } });
});
