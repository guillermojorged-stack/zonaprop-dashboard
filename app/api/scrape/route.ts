import { NextRequest, NextResponse } from 'next/server';

// Este endpoint corre en el servidor de Vercel (nunca en el navegador del usuario),
// así que el GITHUB_TOKEN nunca queda expuesto públicamente.
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || !url.includes('zonaprop.com')) {
      return NextResponse.json({ error: 'Pegá un link válido de Zonaprop' }, { status: 400 });
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!token || !owner || !repo) {
      return NextResponse.json(
        { error: 'Falta configurar GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO en Vercel' },
        { status: 500 }
      );
    }

    const dispatchUrl = `https://api.github.com/repos/${owner}/${repo}/dispatches`;

    const res = await fetch(dispatchUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        event_type: 'scrape-request',
        client_payload: { url },
      }),
    });

    const detalle = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        { error: `Error de GitHub (status ${res.status}): ${detalle}`, dispatchUrl },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      mensaje: `Scraping iniciado (GitHub respondió ${res.status}), aparecerá en el listado en 1-2 minutos.`,
      debug: { dispatchUrl, status: res.status, owner, repo },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
