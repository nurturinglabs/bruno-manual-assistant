import { getSupabaseAdmin } from './supabase';
import type { Source } from '../types';

export interface RetrievedChunk extends Source {
  similarity: number;
  content: string;
}

export async function retrieveChunks(
  embedding: number[],
  count = 8,
  category?: string | null,
): Promise<RetrievedChunk[]> {
  console.log('[retriever] calling match_bruno_chunks', { count, category });

  const { data, error } = await getSupabaseAdmin().rpc('match_bruno_chunks', {
    query_embedding: embedding,
    match_count: count,
    filter_category: category ?? null,
  });

  console.log('[retriever] result', {
    rowCount: data?.length ?? 0,
    error: error?.message ?? null,
    firstRow: data?.[0]
      ? { model: data[0].model, similarity: data[0].similarity }
      : null,
  });

  if (error) throw error;
  return (data ?? []) as RetrievedChunk[];
}
