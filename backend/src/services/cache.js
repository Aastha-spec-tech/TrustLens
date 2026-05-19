// In-memory cache. Drop-in replaceable with Redis by swapping these methods.
const store = new Map()

export function get(key) {
  const entry = store.get(key)
  if (!entry) return null
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.value
}

export function set(key, value, ttlSeconds = 3600) {
  store.set(key, {
    value,
    expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null,
  })
}

export function del(key) {
  store.delete(key)
}

export function size() {
  return store.size
}
