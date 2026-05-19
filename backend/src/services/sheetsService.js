const fetch = require('node-fetch');
const cache = require('../middleware/cache');

const DEFAULT_ID = process.env.DEFAULT_SHEET_ID || '13PqSDZ4y3UePTXLc3sLHiGLcsNyLMSf28uwBzeeNAoA';
const DEFAULT_GID = process.env.DEFAULT_SHEET_GID || '0';

function buildCsvUrl(id, gid) {
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`;
}

function cacheKey(id, gid) {
  return `sheet_csv_v2_${id}_${gid}`;
}

async function fetchSheet(id = DEFAULT_ID, gid = DEFAULT_GID, { force = false } = {}) {
  const key = cacheKey(id, gid);

  if (!force) {
    const cached = cache.get(key);
    if (cached) return { text: cached.value, fromCache: true, savedAt: cached.savedAt };
  }

  const url = buildCsvUrl(id, gid);
  const response = await fetch(url, { timeout: 15000 });
  if (!response.ok) {
    const err = new Error(`Google Sheets respondeu HTTP ${response.status}`);
    err.status = 502;
    throw err;
  }
  const text = await response.text();
  cache.set(key, text);
  return { text, fromCache: false, savedAt: Date.now() };
}

function clearCache(id, gid) {
  cache.del(cacheKey(id, gid));
}

function parseSheetUrl(raw = '') {
  raw = raw.trim();
  if (!raw) return null;

  if (/^[a-zA-Z0-9-_]{20,}$/.test(raw)) return { id: raw, gid: DEFAULT_GID };

  try {
    const url = new URL(raw);
    const m = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!m) return null;
    const gidFromQuery = url.searchParams.get('gid');
    const hash = (url.hash || '').replace('#', '');
    const gidFromHash = (hash.match(/(?:^|&)gid=([0-9]+)/) || [])[1];
    return { id: m[1], gid: gidFromQuery || gidFromHash || DEFAULT_GID };
  } catch {
    return null;
  }
}

module.exports = { fetchSheet, clearCache, parseSheetUrl, DEFAULT_ID, DEFAULT_GID };
