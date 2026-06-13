import React from 'react';

export default function LoadingSpinner({ size = 'md', color = 'text-primary' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex items-center justify-center p-md">
      <div 
        className={`animate-spin rounded-full border-t-transparent border-current ${color} ${sizeClasses[size] || sizeClasses.md}`} 
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}
