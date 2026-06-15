import { CLOUDINARY_CONFIG } from '../config/cloudinary'

/**
 * Uploads an audio file to Cloudinary with progress tracking.
 * @param {File} file - the audio file to upload
 * @param {Function} onProgress - callback(percent: number) called during upload
 * @returns {Promise<CloudinaryUploadResult>}
 */
export function uploadAudioToCloudinary(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset)
    formData.append('folder', CLOUDINARY_CONFIG.folder)
    
    // Tag uploads for easy filtering in Cloudinary dashboard
    formData.append('tags', 'voicecheck,audio-recording')
    
    // Add a unique context so we can trace back to our app
    formData.append('context', `app=voicecheck|uploaded_at=${
      new Date().toISOString()
    }`)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', CLOUDINARY_CONFIG.uploadUrl)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100)
        onProgress(percent)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve({
            success: true,
            url: response.secure_url,
            publicId: response.public_id,
            format: response.format,
            resourceType: response.resource_type,
            duration: response.duration || null,        // seconds, audio/video only
            bytes: response.bytes,
            createdAt: response.created_at,
            originalFilename: response.original_filename,
          })
        } catch (e) {
          reject(new Error('Invalid JSON response from Cloudinary'))
        }
      } else {
        let errorMsg = 'Cloudinary upload failed';
        try {
          const errorResponse = JSON.parse(xhr.responseText)
          errorMsg = errorResponse?.error?.message || errorMsg;
        } catch (e) {}
        reject(new Error(errorMsg))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.onabort = () => reject(new Error('Upload cancelled'))

    xhr.send(formData)

    // Note: returning inside executor has no effect on Promise return value,
    // but is preserved here as a conceptual reference.
    return xhr
  })
}

/**
 * Validates a file against accepted formats and size limit
 * before attempting upload.
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateAudioFile(file) {
  const maxBytes = CLOUDINARY_CONFIG.maxFileSizeMB * 1024 * 1024

  const validExtensions = ['.mp3', '.wav', '.m4a', '.aac']
  const fileName = file.name.toLowerCase()
  const hasValidExtension = validExtensions.some(ext => 
    fileName.endsWith(ext)
  )

  if (!hasValidExtension) {
    return { 
      valid: false, 
      error: 'Only MP3, WAV, M4A and AAC files are supported' 
    }
  }

  if (file.size > maxBytes) {
    return { 
      valid: false, 
      error: `File size exceeds the ${CLOUDINARY_CONFIG.maxFileSizeMB}MB limit` 
    }
  }

  if (file.size === 0) {
    return { valid: false, error: 'File appears to be empty or corrupted' }
  }

  return { valid: true }
}

/**
 * Computes SHA-256 hash of a file using the browser's 
 * SubtleCrypto API — used for Level 1 exact duplicate detection.
 * @param {File} file
 * @returns {Promise<string>} hex string hash
 */
export async function computeFileHash(file) {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Reads audio duration client-side using the Web Audio API,
 * as a fallback if Cloudinary doesn't return duration immediately.
 * @param {File} file
 * @returns {Promise<number>} duration in seconds
 */
export function getAudioDuration(file) {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    const url = URL.createObjectURL(file)
    audio.src = url

    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url)
      resolve(audio.duration)
    })

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read audio metadata'))
    })
  })
}
