'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase, Propiedad, Cliente } from '@/lib/supabase';

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

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [nombreCliente, setNombreCliente] = useState('');
  const [creandoCliente, setCreandoCliente] = useState(false);
  const [seleccion, setSeleccion] = useState<Record<number, string>>({});
  const [agregando, setAgregando] = useState<number | null>(null);
  const [confirmado, setConfirmado] = useState<Record<number, boolean>>({});

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

  const cargarClientes = async () => {
    const res = await fetch('/api/clientes');
    const data = await res.json();
    if (data.clientes) setClientes(data.clientes as Cliente[]);
  };

  useEffect(() => {
    cargarPropiedades();
    cargarClientes();
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
        // Reintenta cargar la lista pasado un tiempo, mientras GitHub procesa el scraping
        setTimeout(cargarPropiedades, 45000);
        setTimeout(cargarPropiedades, 90000);
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo conectar con el servidor' });
    } finally {
      setEnviando(false);
    }
  };

  const crearCliente = async () => {
    if (!nombreCliente.trim()) return;
    setCreandoCliente(true);
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreCliente.trim() }),
      });
      const data = await res.json();
      if (data.cliente) {
        setClientes((prev) => [data.cliente, ...prev]);
        setNombreCliente('');
      }
    } finally {
      setCreandoCliente(false);
    }
  };

  const agregarACliente = async (propiedadId: number) => {
    const slug = seleccion[propiedadId];
    if (!slug) return;
    setAgregando(propiedadId);
    try {
      await fetch(`/api/clientes/${slug}/propiedades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propiedad_id: propiedadId }),
      });
      setConfirmado((prev) => ({ ...prev, [propiedadId]: true }));
      setTimeout(() => setConfirmado((prev) => ({ ...prev, [propiedadId]: false })), 2000);
    } finally {
      setAgregando(null);
    }
  };

  const copiarLink = (slug: string) => {
    const url = `${window.location.origin}/c/${slug}`;
    navigator.clipboard.writeText(url);
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

      <section className="max-w-6xl mx-auto px-4 pt-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <label className="text-sm font-medium text-neutral-800">Clientes</label>
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <input
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              placeholder="Nombre del cliente (ej. Juan Pérez)"
              className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <button
              onClick={crearCliente}
              disabled={creandoCliente}
              className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium disabled:opacity-50"
            >
              {creandoCliente ? 'Creando...' : 'Crear cliente'}
            </button>
          </div>
          {clientes.length > 0 && (
            <ul className="mt-3 space-y-1">
              {clientes.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <span>{c.nombre}</span>
                  <button
                    onClick={() => copiarLink(c.slug)}
                    className="text-xs px-2 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                  >
                    Copiar link · /c/{c.slug}
                  </button>
                </li>
              ))}
            </ul>
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
              <div
                key={p.id}
                className="group rounded-xl overflow-hidden border border-neutral-200 bg-white hover:shadow-md transition-shadow"
              >
                <a href={p.url} target="_blank" rel="noopener noreferrer">
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
                </a>
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

                  {clientes.length > 0 && (
                    <div className="pt-2 flex gap-1.5">
                      <select
                        value={seleccion[p.id] || ''}
                        onChange={(e) => setSeleccion((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        className="flex-1 text-xs px-2 py-1.5 rounded-md border border-neutral-300"
                      >
                        <option value="">Asignar a cliente...</option>
                        {clientes.map((c) => (
                          <option key={c.id} value={c.slug}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => agregarACliente(p.id)}
                        disabled={!seleccion[p.id] || agregando === p.id}
                        className="text-xs px-2.5 py-1.5 rounded-md bg-neutral-900 text-white disabled:opacity-40"
                      >
                        {confirmado[p.id] ? '✓' : agregando === p.id ? '...' : 'Agregar'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
