import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastNotification({ message, type = 'success', isOpen, onClose, duration = 3000 }) {
  useEffect(() => {
    if (isOpen && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const typeConfig = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="text-emerald-500" size={18} />
    },
    error: {
      bg: 'bg-red-50 border-red-200 text-red-800',
      icon: <AlertCircle className="text-red-500" size={18} />
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="text-blue-500" size={18} />
    }
  };

  const config = typeConfig[type] || typeConfig.success;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm w-full">
      <div className={`flex items-center gap-3 p-md border rounded-xl shadow-lg bg-white/90 backdrop-blur-md ${config.bg}`}>
        <div className="flex-shrink-0">{config.icon}</div>
        <p className="flex-1 text-sm font-semibold leading-relaxed">{message}</p>
        <button 
          onClick={onClose} 
          className="flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
