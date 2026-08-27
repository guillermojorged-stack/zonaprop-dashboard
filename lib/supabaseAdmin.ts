import { createClient } from '@supabase/supabase-js';

// Cliente con permisos completos (service role). Solo se usa del lado del
// servidor (en app/api/*), nunca se importa desde un componente 'use client'.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
