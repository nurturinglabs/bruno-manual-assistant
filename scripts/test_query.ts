import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { WebSocket as WsWebSocket } from 'ws';
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  (globalThis as { WebSocket: unknown }).WebSocket = WsWebSocket;
}

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const QUESTIONS = [
  'How do I fold down the rail on a Bruno stair lift?',
  'What are the seat swivel positions on a Bruno stair lift?',
  'How do I load a scooter using the PUL-1100?',
  'What is the tire pressure for the ASL-700?',
  'What is the warranty period on Bruno products?',
  'What is not covered by the Bruno warranty?',
  'How do I charge the battery on a Bruno stair lift?',
  'How do I operate the SRE-3050 stair lift?',
];

async function main() {
  for (const q of QUESTIONS) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Q: ${q}`);
    console.log('='.repeat(80));

    const emb = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: q,
    });
    const queryEmbedding = emb.data[0].embedding;

    const { data, error } = await supabase.rpc('match_bruno_chunks', {
      query_embedding: queryEmbedding,
      match_count: 7,
      filter_category: null,
    });

    if (error) {
      console.error('RPC error:', error);
      continue;
    }

    if (!data || data.length === 0) {
      console.log('  NO MATCHES');
      continue;
    }

    for (const c of data) {
      const preview = c.content.replace(/\s+/g, ' ').slice(0, 180);
      console.log(`\n  sim=${c.similarity.toFixed(3)}  ${c.manual_name} p.${c.page_number}`);
      console.log(`  ${preview}...`);
    }
  }
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
