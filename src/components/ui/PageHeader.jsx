import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function PageHeader({ title, subtitle, breadcrumbs = [], breadcrumb, actionButton }) {
  let finalCrumbs = breadcrumbs;
  if (breadcrumb && typeof breadcrumb === 'string') {
    finalCrumbs = breadcrumb.split('>').map((s, idx, arr) => {
      const label = s.trim();
      const isLast = idx === arr.length - 1;
      return {
        label,
        to: isLast ? null : (label === 'Home' ? '/' : `/${label.toLowerCase().replace(/\s+/g, '-')}`),
        active: isLast
      };
    });
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="space-y-1">
        {finalCrumbs && finalCrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-on-surface-variant text-xs mb-1">
            {finalCrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight size={12} className="text-outline-variant" />}
                {crumb.to ? (
                  <Link 
                    to={crumb.to} 
                    className="hover:text-primary transition-colors hover:underline"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={crumb.active ? "text-primary font-medium" : ""}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-on-surface leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-on-surface-variant text-sm font-normal">
            {subtitle}
          </p>
        )}
      </div>
      {actionButton && (
        <div className="flex items-center gap-xs">
          {actionButton}
        </div>
      )}
    </div>
  );
}
