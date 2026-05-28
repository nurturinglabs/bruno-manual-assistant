import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { WebSocket as WsWebSocket } from 'ws';
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  (globalThis as { WebSocket: unknown }).WebSocket = WsWebSocket;
}

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log('Fetching distinct models...');
  const { data: allRows, error } = await supabase
    .from('bruno_chunks')
    .select('model, manual_name, page_number, section, content, chunk_index')
    .order('id', { ascending: true });

  if (error) {
    console.error('ERROR:', error);
    process.exit(1);
  }

  console.log(`Got ${allRows?.length ?? 0} rows`);
  if (!allRows || allRows.length === 0) return;

  const groups: Record<string, typeof allRows> = {};
  for (const r of allRows) {
    if (!groups[r.model]) groups[r.model] = [];
    groups[r.model].push(r);
  }

  const modelKeys = Object.keys(groups).sort();
  console.log(`Found ${modelKeys.length} models: ${modelKeys.join(', ')}`);
  console.log('');

  for (const model of modelKeys) {
    const rows = groups[model];
    console.log(`\n=== ${model} :: ${rows[0].manual_name} (${rows.length} chunks) ===`);
    const samples = [rows[0], rows[Math.floor(rows.length / 2)], rows[rows.length - 1]];
    for (const r of samples) {
      const preview = r.content.replace(/\s+/g, ' ').slice(0, 280);
      console.log(`\n  [p.${r.page_number}] section="${r.section}"`);
      console.log(`  ${preview}...`);
    }
  }
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
