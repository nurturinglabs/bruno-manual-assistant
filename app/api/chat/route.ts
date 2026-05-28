import Anthropic from '@anthropic-ai/sdk';
import { embedQuery } from '@/lib/embeddings';
import { retrieveChunks } from '@/lib/retriever';
import type { Message } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 1024;
const TOP_K = 8;

export async function POST(req: Request) {
  const body = (await req.json()) as {
    messages: Message[];
    category?: string | null;
  };
  const messages = body.messages ?? [];
  const category = body.category ?? null;

  const userMessage = messages[messages.length - 1]?.content?.trim();
  if (!userMessage) {
    console.log('[chat] rejected request — no user message');
    return new Response('Missing user message', { status: 400 });
  }

  console.log('[chat] request', {
    userMessage: userMessage.slice(0, 120),
    category,
    historyTurns: messages.length,
  });

  const queryEmbedding = await embedQuery(userMessage);
  console.log('[chat] embedding ready', { dims: queryEmbedding.length });

  const chunks = await retrieveChunks(queryEmbedding, TOP_K, category);

  console.log('[chat] retrieval summary', {
    chunkCount: chunks.length,
    topModels: chunks.slice(0, 3).map((c) => ({
      model: c.model,
      page: c.page_number,
      sim: c.similarity,
    })),
  });

  const context = chunks.length
    ? chunks
        .map(
          (c, i) =>
            `[SOURCE ${i + 1}: ${c.manual_name}, page ${c.page_number}]\n${c.content}`,
        )
        .join('\n\n---\n\n')
    : '(no manual excerpts matched this question)';

  const systemPrompt = `You are a helpful product assistant for Bruno Independent Living Aids.

Answer the user's question using the manual excerpts below. The excerpts come from owner manuals across several Bruno products (stair lifts, scooter lifts, platform lifts).

Guidelines:
- Read the excerpts carefully. Even if the user asks about a specific model, related models often share procedures — extract the relevant procedure and note which manual it's from.
- Be concise and practical. Use plain numbered steps when describing procedures.
- Always reference which manual and page each piece of information comes from (e.g. "according to the SRE-3050 manual, page 11…").
- Do not invent specifications, weights, or safety information that isn't in the excerpts.
- If the excerpts don't address the question at all, say so briefly and suggest what the user could ask instead.

MANUAL EXCERPTS:
${context}`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const apiMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const stream = await anthropic.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: apiMessages,
  });

  const sourcesHeader = encodeURIComponent(
    JSON.stringify(
      chunks.map((c) => ({
        id: c.id,
        manual_name: c.manual_name,
        model: c.model,
        category: c.category,
        page_number: c.page_number,
        section: c.section ?? '',
        excerpt: c.content.slice(0, 160).replace(/\s+/g, ' ').trim() + '…',
      })),
    ),
  );

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ text: event.delta.text })}\n\n`,
              ),
            );
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'stream error';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Sources': sourcesHeader,
      'Access-Control-Expose-Headers': 'X-Sources',
    },
  });
}
