const API_BASE = '/api'

export const apiGet = async (path: string) => {
  const response = await fetch(`${API_BASE}${path}`)

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`

    try {
      const payload = await response.json()
      if (payload?.error) {
        message = payload.error
      }
    } catch {
      // Ignore JSON parse failures and surface the HTTP status message.
    }

    throw new Error(message)
  }

  return response.json()
}
