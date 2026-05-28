'use client';

import { useEffect, useRef, useState, FormEvent } from 'react';
import { ArrowUp } from 'lucide-react';
import type { Message, Source } from '@/types';
import MessageBubble from './MessageBubble';
import SuggestedQuestions from './SuggestedQuestions';

interface ChatPanelProps {
  messages: Message[];
  isStreaming: boolean;
  onSend: (question: string) => void;
  onSourceClick: (source: Source) => void;
}

export default function ChatPanel({
  messages,
  isStreaming,
  onSend,
  onSourceClick,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = input.trim();
    if (!value || isStreaming) return;
    onSend(value);
    setInput('');
  }

  function handleSuggestion(q: string) {
    if (isStreaming) return;
    onSend(q);
  }

  const showWelcome = messages.length === 0;

  return (
    <section className="flex flex-col flex-1 min-w-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-5 py-5">
        {showWelcome ? (
          <WelcomeCard />
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} onSourceClick={onSourceClick} />
            ))}
          </div>
        )}
      </div>

      <SuggestedQuestions onSelect={handleSuggestion} />


      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 border-t flex items-center gap-2"
        style={{ borderColor: 'var(--border)' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a Bruno product…"
          disabled={isStreaming}
          className="flex-1 px-3.5 py-2 text-[14px] border rounded-full outline-none focus:border-bruno-navy disabled:opacity-60"
          style={{ borderColor: 'var(--border)' }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          aria-label="Send"
          className="w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
          style={{ background: 'var(--bruno-navy)' }}
        >
          <ArrowUp size={16} />
        </button>
      </form>
    </section>
  );
}

function WelcomeCard() {
  return (
    <div className="max-w-2xl mx-auto pt-6 pb-4">
      <h1 className="text-[22px] font-semibold mb-1" style={{ color: 'var(--bruno-navy)' }}>
        Bruno product manual assistant
      </h1>
      <p className="text-[14px] text-muted leading-relaxed">
        Ask a question and I&apos;ll pull the answer straight from the indexed owner manuals,
        with citations to the manual name and page.
      </p>
    </div>
  );
}
