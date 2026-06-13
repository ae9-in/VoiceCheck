import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export default function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  changeText, 
  changeType = 'neutral', 
  progressValue = 50,
  progressColor = 'bg-primary'
}) {
  return (
    <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant flex flex-col gap-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-on-surface-variant font-medium text-xs uppercase tracking-wider">{title}</span>
        {Icon && <Icon className="text-primary-container" size={18} strokeWidth={1.5} />}
      </div>
      
      <div className="flex items-baseline justify-between mt-1">
        <span className="font-display text-3xl font-bold text-on-surface">{value}</span>
        {changeText && (
          <span className={`text-xs font-bold flex items-center gap-0.5 rounded-full px-2 py-0.5 border ${
            changeType === 'up' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : changeType === 'down'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-gray-50 text-gray-600 border-gray-200'
          }`}>
            {changeType === 'up' && <ArrowUp size={12} />}
            {changeType === 'down' && <ArrowDown size={12} />}
            {changeType === 'neutral' && <Minus size={12} />}
            {changeText}
          </span>
        )}
      </div>
      
      <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden mt-1">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${progressColor}`} 
          style={{ width: `${progressValue}%` }}
        />
      </div>
    </div>
  );
}
