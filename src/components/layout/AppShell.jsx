import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { X, LayoutDashboard, Mic, Copy, Upload, BarChart2, Settings } from 'lucide-react';

const MOBILE_NAV_ITEMS = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/recordings', label: 'Library', icon: Mic },
  { to: '/duplicates', label: 'Duplicates', icon: Copy },
  { to: '/upload', label: 'Upload', icon: Upload },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function AppShell() {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Desktop Sticky Sidebar */}
      <Sidebar />

      {/* Mobile Drawer (Overlay Navigation) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          {/* Drawer Menu */}
          <div className="absolute inset-y-0 left-0 w-64 bg-white border-r border-outline-variant p-md flex flex-col justify-between transform transition-transform animate-in slide-in-from-left duration-200">
            <div className="space-y-lg">
              <div className="flex items-center justify-between">
                <span className="font-display text-xl font-bold text-primary">VoiceCheck</span>
                <button 
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-full hover:bg-surface-container-high"
                >
                  <X size={18} />
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                {MOBILE_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-md px-md py-sm rounded-full transition-all ${
                          isActive
                            ? 'bg-primary-container text-on-primary-container font-semibold'
                            : 'text-on-surface-variant hover:bg-surface-container-highest'
                        }`
                      }
                    >
                      <Icon size={18} strokeWidth={1.5} />
                      <span className="text-sm">{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
            <div className="text-xs text-on-surface-variant text-center opacity-70">
              v1.0.0 Enterprise Build
            </div>
          </div>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex flex-col min-h-screen">
        {/* Top App Bar Header */}
        <Header onMenuClick={() => setIsMobileDrawerOpen(true)} />

        {/* Content canvas with correct layouts & padding: lg:ml-72 pt-16 pb-20 (to avoid overlapping mobile bottom nav) */}
        <main className="flex-1 lg:ml-72 pt-20 pb-24 lg:pb-8 px-md lg:px-xl max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-sm pb-safe bg-white border-t border-outline-variant shadow-lg h-16">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  isActive
                    ? 'text-primary font-bold scale-105'
                    : 'text-on-surface-variant opacity-70 hover:opacity-100'
                }`
              }
            >
              <Icon size={18} strokeWidth={1.5} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
