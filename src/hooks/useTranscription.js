import { useState, useCallback, useEffect } from 'react'
import { 
  transcribeAudio, 
  checkTranscriptionHealth 
} from '../services/transcriptionService'

/**
 * @returns {{
 *   isTranscribing: boolean,
 *   transcriptionError: string | null,
 *   serviceOnline: boolean | null,
 *   runTranscription: (file: File) => Promise<object>
 * }}
 */
export function useTranscription() {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionError, setTranscriptionError] = useState(null)
  const [serviceOnline, setServiceOnline] = useState(null)

  // Check service health once on mount
  useEffect(() => {
    checkTranscriptionHealth().then(result => 
      setServiceOnline(result.status)
    )
  }, [])

  const runTranscription = useCallback(async (file) => {
    setIsTranscribing(true)
    setTranscriptionError(null)

    try {
      const result = await transcribeAudio(file)
      setIsTranscribing(false)
      return result
    } catch (err) {
      setTranscriptionError(err.message)
      setIsTranscribing(false)
      throw err
    }
  }, [])

  return { 
    isTranscribing, transcriptionError, 
    serviceOnline, runTranscription 
  }
}
