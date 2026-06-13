import React from 'react';

export default function StatusBadge({ status }) {
  const getStatusStyles = (statusVal) => {
    const s = statusVal ? statusVal.toLowerCase() : '';
    if (s.includes('unique')) {
      return {
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        dot: 'bg-emerald-500',
        label: 'Unique'
      };
    }
    if (s.includes('exact')) {
      return {
        bg: 'bg-red-50 border-red-200 text-red-700',
        dot: 'bg-red-500 animate-pulse',
        label: 'Exact Duplicate'
      };
    }
    if (s.includes('near')) {
      return {
        bg: 'bg-amber-50 border-amber-200 text-amber-700',
        dot: 'bg-amber-500',
        label: 'Near Duplicate'
      };
    }
    if (s.includes('repeated')) {
      return {
        bg: 'bg-orange-50 border-orange-200 text-orange-700',
        dot: 'bg-orange-500',
        label: 'Repeated Content'
      };
    }
    // Default or processing
    return {
      bg: 'bg-blue-50 border-blue-200 text-blue-700',
      dot: 'bg-blue-500 animate-pulse',
      label: 'Processing'
    };
  };

  const styles = getStatusStyles(status);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold tracking-wider uppercase shadow-xs ${styles.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
      {styles.label}
    </span>
  );
}
