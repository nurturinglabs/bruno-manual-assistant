import { getSupabaseAdmin } from './supabase';

export interface ManualSummary {
  manual_name: string;
  model: string;
  category: string;
  chunk_count: number;
}

export async function loadManuals(): Promise<ManualSummary[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('bruno_chunks')
    .select('manual_name, model, category');

  if (error || !data) return [];

  const map = new Map<string, ManualSummary>();
  for (const row of data) {
    const key = `${row.manual_name}|${row.model}|${row.category}`;
    const existing = map.get(key);
    if (existing) {
      existing.chunk_count += 1;
    } else {
      map.set(key, {
        manual_name: row.manual_name,
        model: row.model,
        category: row.category,
        chunk_count: 1,
      });
    }
  }
  return Array.from(map.values());
}
