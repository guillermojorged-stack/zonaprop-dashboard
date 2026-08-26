'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase, Propiedad } from '@/lib/supabase';

export default function Home() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [zona, setZona] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [ambientesMin, setAmbientesMin] = useState('');
  const [orden, setOrden] = useState<'recientes' | 'precio-asc' | 'precio-desc'>('recientes');

  const [linkInput, setLinkInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const cargarPropiedades = async () => {
    const { data, error } = await supabase
      .from('propiedades_zonaprop')
      .select('*')
      .eq('activo', true)
      .order('ultima_actualizacion', { ascending: false })
      .limit(500);
    if (!error && data) setPropiedades(data as Propiedad[]);
    setLoading(false);
  };

  useEffect(() => {
    cargarPropiedades();
  }, []);

  const enviarLink = async () => {
    if (!linkInput.trim()) return;
    setEnviando(true);
    setMensaje(null);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMensaje({ tipo: 'error', texto: data.error || 'Ocurrió un error' });
      } else {
        setMensaje({ tipo: 'ok', texto: data.mensaje });
        setLinkInput('');
        setTimeout(cargarPropiedades, 45000);
        setTimeout(cargarPropiedades, 90000);
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo conectar con el servidor' });
    } finally {
      setEnviando(false);
    }
  };

  const filtradas = useMemo(() => {
    let r = propiedades.filter((p) => {
      if (zona && !p.ubicacion?.toLowerCase().includes(zona.toLowerCase())) return false;
      if (precioMax && p.precio && p.precio > Number(precioMax)) return false;
      if (ambientesMin && p.ambientes && p.ambientes < Number(ambientesMin)) return false;
      return true;
    });
    if (orden === 'precio-asc') r = [...r].sort((a, b) => (a.precio ?? 0) - (b.precio ?? 0));
    if (orden === 'precio-desc') r = [...r].sort((a, b) => (b.precio ?? 0) - (a.precio ?? 0));
    return r;
  }, [propiedades, zona, precioMax, ambientesMin, orden]);

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-10 bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold tracking-tight">Propiedades Zonaprop</h1>
          <p className="text-sm text-neutral-500">{filtradas.length} publicaciones activas</p>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 pt-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <label className="text-sm font-medium text-neutral-800">Agregar propiedad desde un link de Zonaprop</label>
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <input
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="https://www.zonaprop.com.ar/propiedades/..."
              className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <button
              onClick={enviarLink}
              disabled={enviando}
              className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium disabled:opacity-50"
            >
              {enviando ? 'Enviando...' : 'Agregar'}
            </button>
          </div>
          {mensaje && (
            <p className={`mt-2 text-sm ${mensaje.tipo === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>
              {mensaje.texto}
            </p>
          )}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap gap-3">
        <input
          placeholder="Zona / barrio"
          value={zona}
          onChange={(e) => setZona(e.target.value)}
          className="px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 w-40"
        />
        <input
          placeholder="Precio máx."
          type="number"
          value={precioMax}
          onChange={(e) => setPrecioMax(e.target.value)}
          className="px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 w-32"
        />
        <input
          placeholder="Ambientes mín."
          type="number"
          value={ambientesMin}
          onChange={(e) => setAmbientesMin(e.target.value)}
          className="px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 w-36"
        />
        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value as typeof orden)}
          className="px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        >
          <option value="recientes">Más recientes</option>
          <option value="precio-asc">Precio: menor a mayor</option>
          <option value="precio-desc">Precio: mayor a menor</option>
        </select>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-12">
        {loading ? (
          <p className="text-neutral-500 text-sm">Cargando...</p>
        ) : filtradas.length === 0 ? (
          <p className="text-neutral-500 text-sm">Sin resultados. Corré el scraper o ajustá los filtros.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtradas.map((p) => (
              
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl overflow-hidden border border-neutral-200 bg-white hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
                  {p.fotos?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.fotos[0]}
                      alt={p.titulo ?? ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">
                      Sin foto
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <p className="font-semibold text-sm">
                    {p.moneda === 'USD' ? 'U$S' : '$'} {p.precio?.toLocaleString('es-AR') ?? '—'}
                  </p>
                  <p className="text-sm text-neutral-700 line-clamp-2">{p.titulo}</p>
                  <p className="text-xs text-neutral-500">{p.ubicacion}</p>
                  <p className="text-xs text-neutral-400">
                    {[p.ambientes && `${p.ambientes} amb.`, p.dormitorios && `${p.dormitorios} dorm.`, p.m2_totales && `${p.m2_totales} m²`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
