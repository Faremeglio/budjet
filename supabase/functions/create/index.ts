import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SALT = Deno.env.get('FAMILY_CODE_SALT') ?? 'dev-salt';
const supabase = createClient(URL, SERVICE_ROLE);
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(length = 8) {
  let code = '';
  for (let i = 0; i < length; i += 1) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return code;
}

async function sha256(text: string) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async () => {
  const code = randomCode();
  const familyCodeHash = await sha256(`${SALT}:${code}`);

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .insert({ family_code_hash: familyCodeHash })
    .select('id')
    .single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

  const token = crypto.randomUUID();
  await supabase.from('workspace_sessions').insert({ token, workspace_id: workspace.id });

  return new Response(JSON.stringify({ workspaceId: workspace.id, token, code }), { headers: { 'content-type': 'application/json' } });
});
