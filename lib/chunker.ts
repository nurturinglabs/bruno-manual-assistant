import type { Chunk, ChunkMetadata } from '../types';

const CHUNK_SIZE = 400;
const CHUNK_OVERLAP = 50;
const MIN_CHUNK_WORDS = 50;

const CATEGORY_MAP: Record<string, string> = {
  SRE: 'stair_lift',
  CRE: 'stair_lift',
  VSL: 'scooter_lift',
  ASL: 'scooter_lift',
  PUL: 'scooter_lift',
  VPL: 'platform_lift',
  HE: 'home_elevator',
};

export function parseMetadataFromFilename(filename: string): ChunkMetadata {
  const base = filename.replace(/\.pdf$/i, '');
  const modelRegex = /(SRE|CRE|VSL|ASL|PUL|VPL|HE)[-_ ]?(\d+)/i;
  const m = base.match(modelRegex);

  if (!m) {
    return {
      model: 'UNKNOWN',
      category: 'unknown',
      manual_name: base.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim(),
      filename,
    };
  }

  const prefix = m[1].toUpperCase();
  const number = m[2];
  const model = `${prefix}-${number}`;
  const category = CATEGORY_MAP[prefix] ?? 'unknown';

  const afterModel = base.slice(m.index! + m[0].length);
  const descriptor = afterModel
    .replace(/\d{4}-\d{1,2}-\d{1,2}/g, '')
    .replace(/\d{1,2}-\d{1,2}-\d{2,4}/g, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const manual_name = descriptor ? `${model} ${descriptor}` : model;
  return { model, category, manual_name, filename };
}

interface WordToken {
  word: string;
  page: number;
  isSectionHeading: boolean;
  sectionTitle: string;
}

function detectSectionHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 3 || trimmed.length > 80) return false;
  if (/[.!?,;:]$/.test(trimmed)) return false;
  if (/^[A-Z0-9 \-&/().]+$/.test(trimmed) && /[A-Z]/.test(trimmed)) return true;
  if (/^\d+(\.\d+)*\.?\s+[A-Z]/.test(trimmed)) return true;
  const words = trimmed.split(/\s+/);
  if (words.length >= 2 && words.length <= 8) {
    const cap = words.filter((w) => /^[A-Z]/.test(w)).length;
    if (cap / words.length >= 0.6) return true;
  }
  return false;
}

function parsePages(rawText: string): { page: number; text: string }[] {
  const result: { page: number; text: string }[] = [];
  const regex = /\[\[PAGE:(\d+)\]\]/g;
  let lastIndex = 0;
  let currentPage = 1;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      const text = rawText.slice(lastIndex, match.index);
      if (text.trim()) result.push({ page: currentPage, text });
    }
    currentPage = parseInt(match[1], 10);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < rawText.length) {
    const text = rawText.slice(lastIndex);
    if (text.trim()) result.push({ page: currentPage, text });
  }
  if (result.length === 0 && rawText.trim()) {
    result.push({ page: 1, text: rawText });
  }
  return result;
}

function buildTokens(pages: { page: number; text: string }[]): WordToken[] {
  const tokens: WordToken[] = [];
  let currentSection = '';

  for (const { page, text } of pages) {
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const isHeading = detectSectionHeading(line);
      if (isHeading) currentSection = trimmed;

      const words = trimmed.split(/\s+/);
      for (const w of words) {
        tokens.push({
          word: w,
          page,
          isSectionHeading: isHeading,
          sectionTitle: currentSection,
        });
      }
    }
  }
  return tokens;
}

function findSentenceBoundary(tokens: WordToken[], targetIndex: number): number {
  const lookback = Math.min(80, targetIndex);
  for (let i = targetIndex; i >= targetIndex - lookback && i > 0; i--) {
    const w = tokens[i - 1]?.word;
    if (w && /[.!?]$/.test(w)) return i;
  }
  return targetIndex;
}

export function chunkText(rawText: string, metadata: ChunkMetadata): Chunk[] {
  const pages = parsePages(rawText);
  const tokens = buildTokens(pages);
  if (tokens.length === 0) return [];

  const chunks: Chunk[] = [];
  let i = 0;
  let chunkIndex = 0;

  while (i < tokens.length) {
    const start = i;
    let end = Math.min(start + CHUNK_SIZE, tokens.length);

    if (end < tokens.length) {
      const snapped = findSentenceBoundary(tokens, end);
      if (snapped > start + MIN_CHUNK_WORDS) end = snapped;
    }

    const slice = tokens.slice(start, end);
    if (slice.length === 0) break;

    if (slice.length >= MIN_CHUNK_WORDS) {
      const firstContent = slice.find((t) => !t.isSectionHeading) ?? slice[0];
      const page = firstContent.page;
      const section = firstContent.sectionTitle ?? '';

      let content = slice.map((t) => t.word).join(' ');

      if (
        section &&
        !slice[0].isSectionHeading &&
        !content.toLowerCase().startsWith(section.toLowerCase())
      ) {
        content = `${section}\n\n${content}`;
      }

      chunks.push({
        content,
        model: metadata.model,
        category: metadata.category,
        manual_name: metadata.manual_name,
        filename: metadata.filename,
        page_number: page,
        section,
        chunk_index: chunkIndex++,
      });
    }

    if (end >= tokens.length) break;
    const step = Math.max(1, end - start - CHUNK_OVERLAP);
    i = start + step;
  }

  return chunks;
}
