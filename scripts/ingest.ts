import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { WebSocket as WsWebSocket } from 'ws';
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  (globalThis as { WebSocket: unknown }).WebSocket = WsWebSocket;
}

import fs from 'fs';
import pdf from 'pdf-parse';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { chunkText, parseMetadataFromFilename } from '../lib/chunker';

const MANUALS_DIR = path.join(process.cwd(), 'public/manuals');
const BATCH_SIZE = 20;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!url || !serviceRoleKey || !openaiKey) {
  console.error(
    'Missing env vars. Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY.',
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const openai = new OpenAI({ apiKey: openaiKey });

async function embedBatch(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });
  return response.data.map((d) => d.embedding);
}

async function parsePdfWithPageMarkers(buffer: Buffer): Promise<string> {
  let pageCounter = 0;
  const pagerender = async (pageData: any): Promise<string> => {
    pageCounter += 1;
    const pageNumber = pageData.pageNumber ?? pageCounter;
    const textContent = await pageData.getTextContent({
      normalizeWhitespace: false,
      disableCombineTextItems: false,
    });
    let lastY: number | undefined;
    let text = '';
    for (const item of textContent.items as Array<{ str: string; transform: number[] }>) {
      if (lastY === item.transform[5] || lastY === undefined) {
        text += item.str;
      } else {
        text += '\n' + item.str;
      }
      lastY = item.transform[5];
    }
    return `\n[[PAGE:${pageNumber}]]\n${text}`;
  };
  const parsed = await pdf(buffer, { pagerender } as any);
  return parsed.text;
}

async function ingest() {
  if (!fs.existsSync(MANUALS_DIR)) {
    console.error(`Manuals directory not found: ${MANUALS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(MANUALS_DIR).filter((f) => f.toLowerCase().endsWith('.pdf'));
  if (files.length === 0) {
    console.error('No PDFs found in public/manuals/. Drop the manuals in and re-run.');
    process.exit(1);
  }
  console.log(`Found ${files.length} PDFs in ${MANUALS_DIR}`);

  let totalChunks = 0;

  for (const file of files) {
    console.log(`\nProcessing: ${file}`);
    const buffer = fs.readFileSync(path.join(MANUALS_DIR, file));
    const rawText = await parsePdfWithPageMarkers(buffer);
    const metadata = parseMetadataFromFilename(file);
    const chunks = chunkText(rawText, metadata);
    console.log(`  model=${metadata.model} category=${metadata.category} chunks=${chunks.length}`);
    if (chunks.length === 0) {
      console.warn('  (no chunks produced, skipping)');
      continue;
    }

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const embeddings = await embedBatch(batch.map((c) => c.content));
      const rows = batch.map((chunk, j) => ({
        content: chunk.content,
        embedding: embeddings[j],
        model: chunk.model,
        category: chunk.category,
        manual_name: chunk.manual_name,
        filename: chunk.filename,
        page_number: chunk.page_number,
        section: chunk.section,
        chunk_index: chunk.chunk_index,
      }));
      const { error } = await supabase.from('bruno_chunks').insert(rows);
      if (error) {
        console.error(`  insert error: ${error.message}`);
        process.exit(1);
      }
      process.stdout.write('.');
    }
    totalChunks += chunks.length;
    console.log('');
  }

  console.log(`\nIngestion complete. Inserted ${totalChunks} chunks.`);
}

ingest().catch((err) => {
  console.error(err);
  process.exit(1);
});
