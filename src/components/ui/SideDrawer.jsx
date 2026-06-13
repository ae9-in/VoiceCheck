import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function SideDrawer({ isOpen, onClose, title, children }) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'visible' : 'invisible pointer-events-none'}`}>
      {/* Overlay backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div 
        className={`fixed right-0 top-0 h-full w-[480px] max-w-full bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
