'use client';

import clsx from 'clsx';
import type { Source } from '@/types';

interface SourceCardProps {
  source: Source;
  active: boolean;
  onClick: (source: Source) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  stair_lift: 'Stair lift',
  scooter_lift: 'Scooter lift',
  platform_lift: 'Platform lift',
  home_elevator: 'Home elevator',
};

export default function SourceCard({ source, active, onClick }: SourceCardProps) {
  const categoryLabel = CATEGORY_LABELS[source.category] ?? source.category;

  return (
    <button
      type="button"
      onClick={() => onClick(source)}
      className={clsx(
        'text-left bg-primary border rounded-md p-3 transition-colors',
        active ? 'border-bruno-navy' : 'border-default hover:border-bruno-navy',
      )}
      style={active ? { borderColor: 'var(--bruno-navy)', borderWidth: 1 } : undefined}
    >
      <div className="flex justify-between items-start gap-2 mb-1">
        <div className="text-[12px] font-medium leading-tight">{source.manual_name}</div>
        <span
          className="text-[11px] px-1.5 py-0.5 rounded shrink-0"
          style={{ background: 'var(--bruno-pill-bg)', color: 'var(--bruno-pill-text)' }}
        >
          p. {source.page_number}
        </span>
      </div>

      {source.section && (
        <div className="text-[11px] text-muted mb-1.5 truncate">{source.section}</div>
      )}

      <div
        className="text-[11px] text-muted pl-2"
        style={{ borderLeft: '2px solid var(--bruno-pill-border)', lineHeight: 1.5 }}
      >
        {source.excerpt}
      </div>

      <div
        className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded"
        style={{ background: 'var(--bruno-pill-bg)', color: 'var(--bruno-pill-text)' }}
      >
        {categoryLabel}
      </div>
    </button>
  );
}
