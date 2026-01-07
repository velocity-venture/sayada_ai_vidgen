import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
function createClient(...args: any[]): any {
  // eslint-disable-next-line no-console
  console.warn('Placeholder: createClient is not implemented yet.', args);
  return null;
}

export { createClient };