-- Vector similarity search over indexed Bruno product manual chunks.
--
-- Called from lib/retriever.ts via supabase.rpc('match_bruno_chunks', ...).
-- Uses cosine distance (<=>) against the IVFFlat index on bruno_chunks.embedding.
--
-- Threshold note: 0.15 is intentionally permissive. Embedding cosine similarity
-- for genuinely relevant chunks in this corpus sits around 0.35-0.55, but lower
-- scores often still contain useful context across related product families
-- (e.g. SRE-2010 vs SRE-3050 share procedures). The LLM is constrained to use
-- only these excerpts in app/api/chat/route.ts, so over-fetching is preferred
-- to under-fetching.
--
-- Re-apply: run this entire file in Supabase SQL editor.

create or replace function match_bruno_chunks(
  query_embedding vector(1536),
  match_count     int default 8,
  filter_category text default null
)
returns table (
  id          bigint,
  content     text,
  model       text,
  category    text,
  manual_name text,
  page_number int,
  section     text,
  similarity  float
)
language sql stable
as $$
  select
    id, content, model, category, manual_name, page_number, section,
    1 - (embedding <=> query_embedding) as similarity
  from bruno_chunks
  where
    (filter_category is null or category = filter_category)
    and 1 - (embedding <=> query_embedding) > 0.15
  order by embedding <=> query_embedding
  limit match_count;
$$;
