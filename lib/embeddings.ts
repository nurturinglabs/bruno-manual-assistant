import OpenAI from 'openai';

const EMBEDDING_MODEL = 'text-embedding-3-small';

let _client: OpenAI | null = null;

function client(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

export async function embedQuery(text: string): Promise<number[]> {
  const response = await client().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const response = await client().embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return response.data.map((d) => d.embedding);
}
