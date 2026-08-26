import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Propiedad = {
  id: number;
  zonaprop_id: string;
  url: string;
  titulo: string | null;
  descripcion: string | null;
  precio: number | null;
  moneda: string | null;
  expensas: number | null;
  ubicacion: string | null;
  m2_totales: number | null;
  ambientes: number | null;
  dormitorios: number | null;
  banos: number | null;
  inmobiliaria: string | null;
  fotos: string[] | null;
  ultima_actualizacion: string;
};
