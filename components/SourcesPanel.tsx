'use client';

import clsx from 'clsx';
import { Flag } from 'lucide-react';
import type { Category, Source } from '@/types';
import SourceCard from './SourceCard';

interface SourcesPanelProps {
  sources: Source[];
  activeSourceId: number | null;
  activeCategory: Category;
  onCategoryChange: (c: Category) => void;
  onSourceClick: (s: Source) => void;
}

const FILTERS: { label: string; value: Category }[] = [
  { label: 'All', value: null },
  { label: 'Stair lifts', value: 'stair_lift' },
  { label: 'Scooter lifts', value: 'scooter_lift' },
  { label: 'Platform lifts', value: 'platform_lift' },
];

export default function SourcesPanel({
  sources,
  activeSourceId,
  activeCategory,
  onCategoryChange,
  onSourceClick,
}: SourcesPanelProps) {
  return (
    <aside
      className="w-[280px] border-l border-default bg-secondary flex flex-col shrink-0"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="px-4 py-3 border-b border-default" style={{ borderColor: 'var(--border)' }}>
        <div
          className="text-[11px] uppercase tracking-wider font-semibold"
          style={{ color: 'var(--bruno-navy)' }}
        >
          Sources
        </div>
        <div className="text-[11px] text-muted mt-0.5">Matched from indexed manuals</div>
      </div>

      <div className="px-3 pt-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const isActive = activeCategory === f.value;
          return (
            <button
              key={String(f.value)}
              onClick={() => onCategoryChange(f.value)}
              className={clsx(
                'text-[11px] px-2.5 py-1 rounded-full border transition-colors',
                isActive ? 'text-white' : 'text-muted hover:text-bruno-navy',
              )}
              style={
                isActive
                  ? { background: 'var(--bruno-navy)', borderColor: 'var(--bruno-navy)' }
                  : { borderColor: 'var(--border)' }
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="px-3 py-3 flex flex-col gap-2 overflow-y-auto scrollbar-thin flex-1">
        {sources.length === 0 ? (
          <div className="text-[11px] text-muted py-6 text-center">
            Ask a question to see matched excerpts from the manuals.
          </div>
        ) : (
          sources.map((s) => (
            <SourceCard
              key={s.id}
              source={s}
              active={activeSourceId === s.id}
              onClick={onSourceClick}
            />
          ))
        )}
      </div>

      <div
        className="px-4 py-3 border-t border-default flex items-center gap-1.5 text-[11px] text-muted"
        style={{ borderColor: 'var(--border)' }}
      >
        <Flag size={11} />
        <span>Veteran founded · Family owned · Oconomowoc, WI</span>
      </div>
    </aside>
  );
}
