import ChatApp from '@/components/ChatApp';
import { loadManuals } from '@/lib/manuals';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const manuals = await loadManuals();
  return <ChatApp manualCount={manuals.length} />;
}
