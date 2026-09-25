function createVolatileStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear() { values.clear() },
    getItem(key) { return values.get(String(key)) ?? null },
    key(index) { return [...values.keys()][index] ?? null },
    removeItem(key) { values.delete(String(key)) },
    setItem(key, value) { values.set(String(key), String(value)) },
  }
}

export function getBrowserStorage(): Storage {
  try {
    if (typeof window !== 'undefined') return window.localStorage
  } catch {
    // Storage can be disabled by browser privacy settings.
  }
  return createVolatileStorage()
}
