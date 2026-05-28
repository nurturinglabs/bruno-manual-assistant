'use client';

import { FileText, MessageCircle } from 'lucide-react';
import type { Message, Source } from '@/types';

interface MessageBubbleProps {
  message: Message;
  onSourceClick?: (source: Source) => void;
}

export default function MessageBubble({ message, onSourceClick }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[78%] px-3.5 py-2 text-[14px] leading-relaxed text-white"
          style={{
            background: 'var(--bruno-navy)',
            borderRadius: '16px 16px 4px 16px',
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0"
        style={{ background: 'var(--bruno-navy)' }}
      >
        <MessageCircle size={14} />
      </div>
      <div className="max-w-[78%]">
        <div
          className="bg-secondary border border-default px-3.5 py-2 text-[14px] leading-relaxed whitespace-pre-wrap"
          style={{
            borderColor: 'var(--border)',
            borderRadius: '4px 16px 16px 16px',
          }}
        >
          {message.content || <TypingDots />}
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {message.sources.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSourceClick?.(s)}
                className="ref-pill"
              >
                <FileText size={10} />
                {s.model} p.{s.page_number}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-0.5">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}
