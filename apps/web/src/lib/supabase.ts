import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';  // 👈 NEW LINE

export const supabase = createClient<Database>(      // 👈 ADD <Database>
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
