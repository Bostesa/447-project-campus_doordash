
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;


// create a single variable and export it at top-level. Exporting inside blocks
// (if/else) is invalid syntax for ES modules and causes the transform error.
let _supabase: SupabaseClient | any;

if (!url || !anonKey) {
  // helpful error: prevents module-load crash and makes missing env obvious
  console.error(
    'Supabase environment variables are not set. Ensure react-app/.env.local contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and restart the dev server.'
  );
  // provide a stub that throws when used — surfaces clear runtime errors
  const thrower = () => {
    throw new Error('Supabase client not configured (missing env vars).');
  };
  _supabase = {
    from: thrower,
    auth: { signInWithPassword: thrower },
    // add other used methods as needed to surface clear errors
  } as any as SupabaseClient;
} else {
  // create the real client — createClient will add apikey header for requests
  _supabase = createClient(url, anonKey);
}

export const supabase = _supabase as SupabaseClient;