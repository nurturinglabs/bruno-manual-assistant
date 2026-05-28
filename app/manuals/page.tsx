import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface ManualSummary {
  manual_name: string;
  model: string;
  category: string;
  chunk_count: number;
}

const CATEGORY_ORDER = ['stair_lift', 'scooter_lift', 'platform_lift', 'home_elevator'];
const CATEGORY_LABELS: Record<string, string> = {
  stair_lift: 'Stair lifts',
  scooter_lift: 'Scooter lifts',
  platform_lift: 'Platform lifts',
  home_elevator: 'Home elevators',
};

async function loadManuals(): Promise<ManualSummary[]> {
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

export default async function ManualsPage() {
  const manuals = await loadManuals();
  const totalChunks = manuals.reduce((sum, m) => sum + m.chunk_count, 0);

  const grouped: Record<string, ManualSummary[]> = {};
  for (const m of manuals) {
    if (!grouped[m.category]) grouped[m.category] = [];
    grouped[m.category].push(m);
  }
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => a.model.localeCompare(b.model));
  }

  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]?.length),
    ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header
        className="flex items-center justify-between px-5 h-12 text-white shrink-0"
        style={{ background: 'var(--bruno-navy)' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[13px] hover:opacity-100 opacity-80 transition-opacity"
            style={{ color: 'var(--bruno-blue-muted)' }}
          >
            <ArrowLeft size={14} />
            Back to chat
          </Link>
          <span className="opacity-40">|</span>
          <span className="text-base font-semibold tracking-wide">BRUNO®</span>
          <span className="opacity-40">|</span>
          <span className="text-[13px]" style={{ color: 'var(--bruno-blue-muted)' }}>
            Indexed manuals
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px]"
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: 'var(--bruno-blue-muted)',
          }}
        >
          <FileText size={11} />
          <span>
            {manuals.length} manuals · {totalChunks} chunks
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8 bg-secondary">
        <div className="max-w-4xl mx-auto">
          <h1
            className="text-[22px] font-semibold mb-1"
            style={{ color: 'var(--bruno-navy)' }}
          >
            Indexed product manuals
          </h1>
          <p className="text-[14px] text-muted leading-relaxed mb-6">
            Every answer in the chat is grounded in chunks from these owner manuals.
            Each chunk is embedded with OpenAI <code className="text-[12px]">text-embedding-3-small</code>{' '}
            and stored in Supabase pgvector with page-level metadata.
          </p>

          {orderedCategories.map((category) => (
            <section key={category} className="mb-7">
              <div className="flex items-baseline justify-between mb-2">
                <h2
                  className="text-[11px] uppercase tracking-wider font-semibold"
                  style={{ color: 'var(--bruno-navy)' }}
                >
                  {CATEGORY_LABELS[category] ?? category}
                </h2>
                <span className="text-[11px] text-muted">
                  {grouped[category].length}{' '}
                  {grouped[category].length === 1 ? 'manual' : 'manuals'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {grouped[category].map((m) => (
                  <ManualCard key={`${m.manual_name}-${m.model}`} manual={m} />
                ))}
              </div>
            </section>
          ))}

          {manuals.length === 0 && (
            <div className="text-[14px] text-muted py-12 text-center">
              No manuals indexed yet. Run <code>npm run ingest</code> with PDFs in{' '}
              <code>public/manuals/</code>.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ManualCard({ manual }: { manual: ManualSummary }) {
  return (
    <div
      className="bg-primary border rounded-md p-3 flex items-start gap-3"
      style={{ borderColor: 'var(--border)' }}
    >
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
        style={{ background: 'var(--bruno-pill-bg)', color: 'var(--bruno-navy)' }}
      >
        <FileText size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium leading-snug truncate">
          {manual.manual_name}
        </div>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted">
          <span
            className="px-1.5 py-0.5 rounded font-medium"
            style={{ background: 'var(--bruno-pill-bg)', color: 'var(--bruno-pill-text)' }}
          >
            {manual.model}
          </span>
          <span>·</span>
          <span>
            {manual.chunk_count} {manual.chunk_count === 1 ? 'chunk' : 'chunks'}
          </span>
        </div>
      </div>
    </div>
  );
}
