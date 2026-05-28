'use client';

import { useCallback, useState } from 'react';
import TopBar from '@/components/TopBar';
import ChatPanel from '@/components/ChatPanel';
import SourcesPanel from '@/components/SourcesPanel';
import type { Category, Message, Source } from '@/types';

const MANUAL_COUNT = 17;

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeSources, setActiveSources] = useState<Source[]>([]);
  const [activeSourceId, setActiveSourceId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSourceClick = useCallback((source: Source) => {
    setActiveSourceId(source.id);
  }, []);

  const handleSend = useCallback(
    async (question: string) => {
      if (isStreaming) return;

      const userMessage: Message = { role: 'user', content: question };
      const assistantPlaceholder: Message = { role: 'assistant', content: '' };
      const messagesForApi = [...messages, userMessage];

      setMessages([...messagesForApi, assistantPlaceholder]);
      setActiveSourceId(null);
      setIsStreaming(true);

      let receivedSources: Source[] = [];

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messagesForApi,
            category: activeCategory,
          }),
        });

        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

        const sourcesHeader = res.headers.get('X-Sources');
        if (sourcesHeader) {
          try {
            receivedSources = JSON.parse(decodeURIComponent(sourcesHeader));
            setActiveSources(receivedSources);
          } catch {
            // ignore malformed header
          }
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response stream');
        const decoder = new TextDecoder();
        let buffer = '';
        let assistantContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6);
            if (payload === '[DONE]') continue;
            try {
              const parsed = JSON.parse(payload);
              if (typeof parsed.text === 'string') {
                assistantContent += parsed.text;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = {
                    role: 'assistant',
                    content: assistantContent,
                  };
                  return next;
                });
              } else if (parsed.error) {
                assistantContent += `\n\n[error: ${parsed.error}]`;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = {
                    role: 'assistant',
                    content: assistantContent,
                  };
                  return next;
                });
              }
            } catch {
              // ignore non-JSON SSE frames
            }
          }
        }

        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === 'assistant') {
            next[next.length - 1] = { ...last, sources: receivedSources };
          }
          return next;
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: 'assistant',
            content: `Sorry — I couldn't reach the manuals. (${message})`,
          };
          return next;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [activeCategory, isStreaming, messages],
  );

  return (
    <div className="flex flex-col h-screen">
      <TopBar manualCount={MANUAL_COUNT} />
      <div className="flex flex-1 overflow-hidden">
        <ChatPanel
          messages={messages}
          isStreaming={isStreaming}
          onSend={handleSend}
          onSourceClick={handleSourceClick}
        />
        <SourcesPanel
          sources={activeSources}
          activeSourceId={activeSourceId}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onSourceClick={handleSourceClick}
        />
      </div>
    </div>
  );
}
