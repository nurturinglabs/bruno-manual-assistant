export type Category =
  | 'stair_lift'
  | 'scooter_lift'
  | 'platform_lift'
  | 'home_elevator'
  | null;

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

export interface Source {
  id: number;
  manual_name: string;
  model: string;
  category: string;
  page_number: number;
  section: string;
  excerpt: string;
}

export interface Chunk {
  content: string;
  model: string;
  category: string;
  manual_name: string;
  filename: string;
  page_number: number;
  section: string;
  chunk_index: number;
}

export interface ChunkMetadata {
  model: string;
  category: string;
  manual_name: string;
  filename: string;
}
