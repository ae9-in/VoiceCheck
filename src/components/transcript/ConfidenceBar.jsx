import { useState, useEffect } from 'react'
import { Activity } from 'lucide-react'

export default function ConfidenceBar({ score = 0 }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(score * 100);
    }, 150);
    return () => clearTimeout(timer);
  }, [score]);

  const getColors = (val) => {
    if (val >= 0.90) return { text: 'text-green-600', bg: 'bg-green-500', label: 'High confidence' };
    if (val >= 0.70) return { text: 'text-amber-600', bg: 'bg-amber-500', label: 'Medium confidence' };
    return { text: 'text-red-600', bg: 'bg-red-500', label: 'Low confidence — review recommended' };
  };

  const config = getColors(score);

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Activity size={13} className={`mr-1.5 ${config.text}`} />
          <span className="text-xs text-gray-500">Confidence score</span>
        </div>
        <span className={`text-sm font-bold ${config.text}`}>
          {Math.round(score * 100)}%
        </span>
      </div>

      <div className="h-2 bg-gray-100 rounded-full w-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-700 ease-out ${config.bg}`}
          style={{ width: `${width}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
        <span>{config.label}</span>
        <span>{Math.round(score * 100)}% accurate</span>
      </div>
    </div>
  );
}
