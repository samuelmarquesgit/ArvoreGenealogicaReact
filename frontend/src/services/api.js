const BASE = '/api/sheets';

export async function fetchFamilyData({ id, gid, force = false, focusId, branchKey, unified = false }) {
  const params = new URLSearchParams();
  if (id) params.set('id', id);
  if (gid) params.set('gid', gid);
  if (force) params.set('force', 'true');
  if (focusId) params.set('focusId', focusId);
  if (branchKey) params.set('branchKey', branchKey);
  if (unified) params.set('unified', 'true');

  const res = await fetch(`${BASE}/family?${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function parseSheetUrl(url) {
  const res = await fetch(`${BASE}/parse-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'URL inválida');
  }
  return res.json();
}

export async function clearServerCache(id, gid) {
  await fetch(`${BASE}/cache?id=${id}&gid=${gid}`, { method: 'DELETE' });
}
