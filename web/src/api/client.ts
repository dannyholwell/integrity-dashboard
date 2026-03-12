const API_BASE = '/api'

const parseApiError = async (response: Response) => {
  let message = `Request failed with status ${response.status}`

  try {
    const payload = await response.json()
    if (payload?.error) {
      message = payload.error
    } else if (payload?.message) {
      message = payload.message
    }
  } catch {
    // Ignore JSON parse failures and surface the HTTP status message.
  }

  throw new Error(message)
}

const apiRequest = async (path: string, init?: RequestInit) => {
  const response = await fetch(`${API_BASE}${path}`, init)

  if (!response.ok) {
    await parseApiError(response)
  }

  return response.json()
}

export const apiGet = async (path: string) => apiRequest(path)

export const apiPostJson = async (path: string, payload: unknown) =>
  apiRequest(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

export const apiDelete = async (path: string) =>
  apiRequest(path, {
    method: 'DELETE',
  })
