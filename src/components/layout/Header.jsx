import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useRecordingStore } from '../../store/useRecordingStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Menu, Search, Bell, ChevronRight, LogOut } from 'lucide-react';

export default function Header({ onMenuClick }) {
  const { searchQuery, setSearchQuery } = useRecordingStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const getBreadcrumbs = () => {
    const path = location.pathname;
    const crumbs = [{ label: 'Home', to: '/' }];
    
    if (path === '/recordings') {
      crumbs.push({ label: 'Recordings', active: true });
    } else if (path === '/duplicates') {
      crumbs.push({ label: 'Duplicates', active: true });
    } else if (path === '/upload') {
      crumbs.push({ label: 'Upload New', active: true });
    } else if (path === '/reports') {
      crumbs.push({ label: 'Reports', active: true });
    } else if (path === '/settings') {
      crumbs.push({ label: 'Settings', active: true });
    } else if (path.startsWith('/transcripts/')) {
      crumbs.push({ label: 'Recordings', to: '/recordings' });
      crumbs.push({ label: 'Transcript', active: true });
    } else {
      crumbs.push({ label: 'Dashboard', active: true });
    }
    
    return crumbs;
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/recordings') return 'Recordings';
    if (path === '/duplicates') return 'Duplicates Audit';
    if (path === '/upload') return 'Upload Audio';
    if (path === '/reports') return 'Reports';
    if (path === '/settings') return 'Settings';
    if (path.startsWith('/transcripts/')) return 'Transcript Audit';
    return 'Dashboard';
  };

  const crumbs = getBreadcrumbs();
  const showSearch = ['/', '/recordings', '/duplicates'].includes(location.pathname);

  const initials = user && user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'US';

  return (
    <header className="fixed top-0 left-0 w-full z-40 flex flex-col bg-surface border-b border-outline-variant lg:pl-72">
      {/* Thin loading bar decoration from dashboard */}
      <div className="h-[2px] w-full bg-surface-container relative overflow-hidden">
        <div className="absolute h-full bg-primary-container w-1/3 animate-[pulse_2s_infinite]"></div>
      </div>
      
      <div className="h-16 px-md lg:px-xl flex justify-between items-center">
        {/* Left Side: Mobile Menu Toggle & Breadcrumbs */}
        <div className="flex items-center gap-md">
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 text-primary hover:bg-surface-container-high rounded-full transition-colors"
          >
            <Menu size={18} strokeWidth={1.5} />
          </button>
          
          <div className="hidden sm:flex flex-col">
            <nav className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
              {crumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight size={10} />}
                  {crumb.to ? (
                    <Link to={crumb.to} className="hover:text-primary hover:underline">{crumb.label}</Link>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
            <h2 className="font-headline-md text-sm font-bold text-primary">{getPageTitle()}</h2>
          </div>

          {/* Mobile brand title */}
          <span className="sm:hidden font-display font-bold text-primary text-base">VoiceCheck</span>
        </div>

        {/* Middle: Search Input (synchronised with Zustand) */}
        {showSearch && (
          <div className="flex-1 max-w-md mx-md lg:mx-xl">
            <div className="relative w-full">
              <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" 
                size={16} 
                strokeWidth={1.5} 
              />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recordings, candidates..."
                className="w-full bg-surface-container-low border border-outline-variant rounded-full py-1.5 pl-9 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent text-xs outline-none transition-all duration-200 hover:scale-[1.005]"
              />
            </div>
          </div>
        )}

        {/* Right Side: Profile & Notifications */}
        <div className="flex items-center gap-4">
          {/* Notifications Trigger */}
          <button className="relative p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors">
            <Bell size={18} strokeWidth={1.5} />
            <span className="absolute top-1 right-1 bg-error text-white text-[9px] font-bold h-3.5 w-3.5 flex items-center justify-center rounded-full">
              3
            </span>
          </button>
          
          {/* Profile Details & Action */}
          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-bold text-gray-800 leading-tight">{user?.name || 'User'}</span>
              <span className="text-[10px] text-gray-400 font-semibold leading-none">{user?.email || ''}</span>
            </div>
            
            <div 
              className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shadow-2xs"
              title={user?.name || 'User Profile'}
            >
              {initials}
            </div>

            <button
              onClick={() => logout()}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
