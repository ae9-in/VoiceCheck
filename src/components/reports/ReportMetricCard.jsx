import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function ReportMetricCard({ 
  title, 
  value, 
  icon: IconComponent, 
  color = 'indigo', 
  sublabel, 
  trend 
}) {
  const colorMap = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  };

  const activeColor = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs transition-all hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="text-3xl font-bold text-gray-900 mt-1.5 leading-none">
            {value}
          </div>
          {sublabel && (
            <span className="text-xs text-gray-400 mt-1.5 block">
              {sublabel}
            </span>
          )}
        </div>
        {IconComponent && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${activeColor.bg}`}>
            <IconComponent size={20} className={activeColor.text} />
          </div>
        )}
      </div>

      {trend !== undefined && trend !== null && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
          {trend > 0 ? (
            <TrendingUp className="text-green-500" size={13} />
          ) : trend < 0 ? (
            <TrendingDown className="text-red-500" size={13} />
          ) : (
            <Minus className="text-gray-400" size={13} />
          )}
          <span className={`text-xs font-medium ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-400'
          }`}>
            {Math.abs(trend)}% vs last period
          </span>
        </div>
      )}
    </div>
  );
}
