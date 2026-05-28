import { FileText } from 'lucide-react';

interface TopBarProps {
  manualCount: number;
}

export default function TopBar({ manualCount }: TopBarProps) {
  return (
    <header
      className="flex items-center justify-between px-5 h-12 text-white shrink-0"
      style={{ background: 'var(--bruno-navy)' }}
    >
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold tracking-wide">BRUNO®</span>
        <span className="opacity-40">|</span>
        <span className="text-[13px]" style={{ color: 'var(--bruno-blue-muted)' }}>
          Product manual assistant
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
        <span>{manualCount} manuals indexed</span>
      </div>
    </header>
  );
}
