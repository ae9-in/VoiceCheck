const TRANSCRIPTION_API_URL = 
  import.meta.env.VITE_TRANSCRIPTION_API_URL || 'http://localhost:8001'

/**
 * Checks if the transcription service is reachable.
 * @returns {Promise<{ online: boolean, whisperModel?: string, 
 *                      embeddingModel?: string }>}
 */
export async function checkTranscriptionHealth() {
  try {
    const res = await fetch(`${TRANSCRIPTION_API_URL}/health`, {
      signal: AbortSignal.timeout(3000)
    })
    if (!res.ok) return { online: false }
    const data = await res.json()
    return { online: true, ...data }
  } catch {
    return { online: false }
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

  const res = await fetch(`${TRANSCRIPTION_API_URL}/process`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(
      errorBody.error || `Transcription failed (${res.status})`
    )
  }

  return res.json()
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
