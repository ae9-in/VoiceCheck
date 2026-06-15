import { useState, useCallback } from 'react'
import { 
  uploadAudioToCloudinary, 
  validateAudioFile, 
  computeFileHash,
  getAudioDuration 
} from '../services/cloudinaryService'

/**
 * @returns {{
 *   uploadProgress: number,
 *   isUploading: boolean,
 *   uploadError: string | null,
 *   uploadResult: object | null,
 *   startUpload: (file: File) => Promise<object>,
 *   resetUpload: () => void
 * }}
 */
export function useCloudinaryUpload() {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadResult, setUploadResult] = useState(null)

  const startUpload = useCallback(async (file) => {
    setUploadError(null)
    setUploadResult(null)
    setUploadProgress(0)

    // Validate before doing anything else
    const validation = validateAudioFile(file)
    if (!validation.valid) {
      setUploadError(validation.error)
      throw new Error(validation.error)
    }

    setIsUploading(true)

    try {
      // Run hash computation and Cloudinary upload in parallel
      const [fileHash, durationFromBrowser, cloudinaryResult] = 
        await Promise.all([
          computeFileHash(file),
          getAudioDuration(file).catch(() => null),
          uploadAudioToCloudinary(file, (percent) => {
            setUploadProgress(percent)
          }),
        ])

      const result = {
        ...cloudinaryResult,
        fileHash,
        duration: cloudinaryResult.duration || durationFromBrowser || 0,
        fileSize: file.size,
        fileName: file.name,
        fileFormat: file.name.split('.').pop().toUpperCase(),
      }

      setUploadResult(result)
      setIsUploading(false)
      return result

    } catch (err) {
      setUploadError(err.message || 'Upload failed. Please try again.')
      setIsUploading(false)
      throw err
    }
  }, [])

  const resetUpload = useCallback(() => {
    setUploadProgress(0)
    setIsUploading(false)
    setUploadError(null)
    setUploadResult(null)
  }, [])

  return { 
    uploadProgress, isUploading, uploadError, 
    uploadResult, startUpload, resetUpload 
  }
}
