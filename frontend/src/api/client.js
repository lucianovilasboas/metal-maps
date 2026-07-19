const BASE_URL = '/api/v1';

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ erro: 'Erro desconhecido' }));
    throw new Error(err.erro || err.detail || `Erro ${res.status}`);
  }
  return res.json();
}

export function listarDocumentos() {
  return api('/documentos/');
}

export function detalheDocumento(slug) {
  return api(`/documentos/${slug}/`);
}

export function detalheArtigo(id) {
  return api(`/artigos/${id}/`);
}

export function buscar(query, slug) {
  const params = new URLSearchParams({ q: query })
  if (slug) params.set('slug', slug)
  return api(`/buscar/?${params}`)
}

export function uploadJSON(data) {
  return api('/documentos/upload-json/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function salvarPosicoes(slug, posicoes) {
  return api(`/documentos/${slug}/posicoes/`, {
    method: 'PATCH',
    body: JSON.stringify({ posicoes }),
  });
}
