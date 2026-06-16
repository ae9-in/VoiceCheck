const TRANSCRIPTION_API_URL = 
  import.meta.env.VITE_TRANSCRIPTION_API_URL || 'http://localhost:8001'

/**
 * Checks if the transcription service is reachable.
 * Returns 3 states:
 *   'online'  — service responded with 200 OK
 *   'unknown' — network error (e.g. CORS/adblock blocked the request) OR
 *               gateway error (502/503/504 = Render free-tier cold start).
 *               We still attempt transcription in both cases.
 *   'offline' — service explicitly returned a 4xx client error (truly down).
 *
 * @returns {Promise<{ status: 'online' | 'offline' | 'unknown', whisperModel?: string,
 *                     embeddingModel?: string }>}
 */
export async function checkTranscriptionHealth() {
  try {
    const res = await fetch(`${TRANSCRIPTION_API_URL}/status`, {
      // 10s timeout — gives Render free-tier enough time to respond during warm-up
      signal: AbortSignal.timeout(10000)
    })
    if (res.ok) {
      const data = await res.json()
      return { status: 'online', ...data }
    }
    // 502 / 503 / 504  →  Render is cold-starting; treat as unknown so we still try
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      return { status: 'unknown' }
    }
    // Any definitive client-side 4xx → service is truly misconfigured / offline
    return { status: 'offline' }
  } catch (err) {
    // TypeError = network failure (adblock ERR_BLOCKED_BY_CLIENT, CORS preflight
    // blocked before a response was received, or AbortError timeout).
    // In all these cases we can't tell if the service is up, so use 'unknown'.
    return { status: 'unknown' }
  }
}


/**
 * Sends an audio file for transcription + embedding generation.
 * @param {File} file
 * @returns {Promise<{
 *   transcript: string,
 *   language: string,
 *   languageName: string,
 *   confidence: number,
 *   duration: number,
 *   wordCount: number,
 *   processingTimeMs: number,
 *   embedding: number[] | null
 * }>}
 */
export async function transcribeAudio(file) {
  const formData = new FormData()
  formData.append('file', file)

  // Render free tier needs time to load Whisper + embedding models on a cold start.
  // 180s gives enough headroom for model loading (~60-90s) + actual transcription.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 180000) // 180s

  try {
    const res = await fetch(`${TRANSCRIPTION_API_URL}/process`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    })
    clearTimeout(timeout)

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}))
      throw new Error(errorBody.error || `Transcription failed (${res.status})`)
    }

    return res.json()

  } catch (err) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      throw new Error(
        'Transcription timed out after 3 minutes. The service may still be loading models — please try again in a moment.'
      )
    }
    throw err
  }
}

/**
 * Generates an embedding for a piece of text (used for the 
 * 20 mock recordings that don't have embeddings yet).
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function embedText(text) {
  const res = await fetch(`${TRANSCRIPTION_API_URL}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error('Embedding generation failed')
  const data = await res.json()
  return data.embedding
}
