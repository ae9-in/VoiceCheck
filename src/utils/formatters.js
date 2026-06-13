export function formatDuration(seconds) {
  if (seconds === undefined || seconds === null) return '0m 00s';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function formatFileSize(bytes) {
  if (bytes === undefined || bytes === null || bytes === 0) return '0.0 MB';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function formatDateTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  // Formats like "12 Jun 2026, 14:32"
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(',', '');
}
