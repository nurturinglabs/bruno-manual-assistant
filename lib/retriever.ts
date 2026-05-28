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
  const { data, error } = await getSupabaseAdmin().rpc('match_bruno_chunks', {
    query_embedding: embedding,
    match_count: count,
    filter_category: category ?? null,
  });

  if (error) throw new Error(`Retriever error: ${error.message}`);
  return (data ?? []) as RetrievedChunk[];
}
