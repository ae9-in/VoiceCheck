import React from 'react';

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionText, 
  onAction,
  statusBadge,
  children
}) {
  return (
    <div className="bg-white/70 backdrop-blur-md border border-outline-variant rounded-2xl p-xl flex flex-col items-center text-center shadow-xs relative overflow-hidden animate-in fade-in zoom-in-95 duration-500 max-w-2xl mx-auto">
      {/* Visual Accent Grid */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.03] pointer-events-none">
        <svg className="w-full h-full fill-primary" viewBox="0 0 100 100">
          <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"></path>
          </pattern>
          <rect width="100" height="100" fill="url(#grid-pattern)"></rect>
        </svg>
      </div>

      {/* Graphic Circle */}
      {Icon && (
        <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mb-lg ring-8 ring-surface-container-low transition-transform duration-300 hover:rotate-3">
          <Icon className="text-primary" size={36} strokeWidth={1.5} />
        </div>
      )}

      {/* Text Content */}
      <h2 className="font-headline-md text-xl md:text-2xl font-bold mb-md text-on-surface">
        {title}
      </h2>
      <p className="text-on-surface-variant text-sm md:text-base max-w-lg mb-xl leading-relaxed">
        {description}
      </p>

      {/* Status Badge */}
      {statusBadge && (
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-tertiary-container/10 border border-tertiary-container/30 text-tertiary font-semibold text-xs mb-xl">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary mr-2 animate-pulse"></span>
          {statusBadge}
        </div>
      )}

      {/* Action Button */}
      {actionText && onAction && (
        <button 
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-primary text-on-primary text-sm font-semibold px-lg py-md rounded-full shadow-md hover:shadow-lg hover:bg-primary/95 transition-all duration-200 active:scale-95"
        >
          {actionText}
        </button>
      )}

      {children && <div className="mt-lg w-full">{children}</div>}
    </div>
  );
}
