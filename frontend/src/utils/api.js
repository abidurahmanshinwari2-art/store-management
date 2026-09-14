async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) {
    let message = 'Server error'
    try {
      const body = await res.json()
      message = body.message || body.error || message
    } catch {
      // keep default
    }
    throw new Error(message)
  }
  if (res.status === 204) return null
  return res.json()
}

export function fetchStore() {
  return request('/api/store')
}

export function pushStore(db) {
  return request('/api/store', { method: 'PUT', body: JSON.stringify(db) })
}

export function fetchHealth() {
  return request('/api/health')
}

export function fetchServerSettings() {
  return request('/api/settings')
}

export function pushServerSettings(body) {
  return request('/api/settings', { method: 'PUT', body: JSON.stringify(body) })
}

export function fetchUpdate() {
  return request('/api/update')
}

export function applyUpdate() {
  return request('/api/update/apply', { method: 'POST', body: '{}' })
}

export function fetchLicense() {
  return request('/api/license')
}

export function activateLicense(shopName, key) {
  return request('/api/license', { method: 'POST', body: JSON.stringify({ shopName, key }) })
}
