import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(url!, serviceKey!);
  const { count, error } = await supabase
    .from('bruno_chunks')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json({
    supabase_url: url,
    has_service_key: !!serviceKey,
    has_anon_key: !!anonKey,
    chunk_count: count,
    error: error?.message ?? null,
  });
}
