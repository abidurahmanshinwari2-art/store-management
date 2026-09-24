const listeners = new Set()

export function pushUpdateNote(message) {
  const text = String(message || '')
  listeners.forEach((fn) => fn(text))
}

export function subscribeUpdateNote(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
