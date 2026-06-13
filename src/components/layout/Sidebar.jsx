import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Mic, Copy, Upload, BarChart2, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/recordings', label: 'Recordings', icon: Mic },
  { to: '/duplicates', label: 'Duplicates', icon: Copy },
  { to: '/upload', label: 'Upload New', icon: Upload },
  { to: '/reports', label: 'Reports', icon: BarChart2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full z-50 pt-lg bg-surface border-r border-outline-variant w-72">
      <div className="px-lg pb-xl flex items-center gap-2">
        <span className="font-display text-3xl font-black tracking-tight text-primary">VoiceCheck</span>
      </div>
      <nav className="flex-1 flex flex-col gap-xs">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-md px-md py-sm mx-sm rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-semibold scale-[0.98]'
                    : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface font-medium'
                }`
              }
            >
              <Icon size={18} strokeWidth={1.5} />
              <span className="text-sm tracking-wide">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      {/* Visual floating wave background ornament */}
      <div className="p-md opacity-[0.03] pointer-events-none mt-auto">
        <svg viewBox="0 0 100 30" className="w-full fill-none stroke-primary stroke-2">
          <path d="M0 15 Q25 0, 50 15 T100 15" strokeLinecap="round" />
        </svg>
      </div>
    </aside>
  );
}
