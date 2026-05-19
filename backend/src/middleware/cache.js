const TTL = Number(process.env.CACHE_TTL_MS) || 6 * 60 * 60 * 1000;

const store = new Map();

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.savedAt > TTL) {
    store.delete(key);
    return null;
  }
  return entry;
}

function set(key, value) {
  store.set(key, { value, savedAt: Date.now() });
}

function del(key) {
  store.delete(key);
}

module.exports = { get, set, del };
