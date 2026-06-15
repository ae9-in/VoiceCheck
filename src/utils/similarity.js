/**
 * Computes cosine similarity between two equal-length vectors.
 * Assumes both vectors are already normalized (LaBSE output via 
 * sentence-transformers with normalize_embeddings=True is 
 * already unit-length, so this reduces to a dot product — but 
 * computing it generally here is safer if that assumption ever 
 * changes).
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} similarity score between -1 and 1
 */
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0

  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Finds the most similar recording (by transcript embedding) 
 * to a given embedding, among existing recordings.
 * @param {number[]} embedding
 * @param {Array} existingRecordings - must have transcriptEmbedding field
 * @param {number} threshold - default 0.92
 * @returns {{ match: object|null, score: number }}
 */
export function findMostSimilarTranscript(
  embedding, existingRecordings, threshold = 0.92
) {
  let best = null
  let bestScore = 0

  for (const rec of existingRecordings) {
    if (!rec.transcriptEmbedding) continue
    const score = cosineSimilarity(embedding, rec.transcriptEmbedding)
    if (score > bestScore) {
      bestScore = score
      best = rec
    }
  }

  if (best && bestScore >= threshold) {
    return { match: best, score: bestScore }
  }
  return { match: null, score: bestScore }
}
