export const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  folder: import.meta.env.VITE_CLOUDINARY_FOLDER || 'voicecheck/recordings',
  maxFileSizeMB: Number(import.meta.env.VITE_MAX_FILE_SIZE_MB) || 50,
  uploadUrl: `https://api.cloudinary.com/v1_1/${
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  }/auto/upload`,
}

export const ACCEPTED_AUDIO_TYPES = {
  'audio/mpeg': 'MP3',
  'audio/mp3': 'MP3',
  'audio/wav': 'WAV',
  'audio/x-wav': 'WAV',
  'audio/m4a': 'M4A',
  'audio/x-m4a': 'M4A',
  'audio/aac': 'AAC',
}

export const ACCEPTED_EXTENSIONS = '.mp3,.wav,.m4a,.aac,audio/*'
