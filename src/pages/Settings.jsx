import React, { useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import ToastNotification from '../components/ui/ToastNotification';
import { User, Shield, Bell, LogOut, Edit, Check, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  // Toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastType, setToastType] = useState('success');

  // Input states
  const [displayName, setDisplayName] = useState('Alexander Sterling');
  const [email, setEmail] = useState('a.sterling@voicecheck.ai');
  const [sampleRate, setSampleRate] = useState('48.0 kHz');
  const [sensitivity, setSensitivity] = useState(70); // 0-100
  const [emailSummaries, setEmailSummaries] = useState(true);
  const [desktopAlerts, setDesktopAlerts] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setIsToastOpen(true);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    showToast('Profile configuration saved successfully.');
  };

  const handleChangePassword = () => {
    showToast('Password reset link sent to your administrator email.');
  };

  const handleSensitivityChange = (e) => {
    setSensitivity(parseInt(e.target.value));
  };

  const handleLogout = () => {
    showToast('Session ended. Logging out...', 'info');
  };

  // Calculate sensitivity color track percentage
  const fillPercentage = sensitivity;

  return (
    <div className="space-y-lg animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      <ToastNotification 
        message={toastMessage} 
        isOpen={isToastOpen} 
        onClose={() => setIsToastOpen(false)} 
        type={toastType}
      />

      {/* Page Header */}
      <PageHeader 
        title="Settings" 
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Settings', active: true }
        ]}
      />

      {/* Bento Grid Layout for Settings */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
        
        {/* Profile Settings */}
        <section className="md:col-span-8 bg-white border border-outline-variant rounded-xl p-lg shadow-xs">
          <div className="flex items-center gap-md mb-lg">
            <User className="text-primary" size={20} strokeWidth={1.5} />
            <h3 className="font-display text-sm lg:text-base font-bold text-on-surface uppercase tracking-wider">Profile Settings</h3>
          </div>
          
          <form onSubmit={handleSaveProfile} className="space-y-md">
            <div className="flex flex-col md:flex-row md:items-center gap-lg py-md border-b border-outline-variant/60">
              <div className="relative w-16 h-16 group flex-shrink-0">
                <img 
                  alt="User Avatar"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXYt1gGwslMLyryM6IuAZmCssUSmYEnbD9CBgzyO61vYqPZKLgtp7OYNmAqydpvXRloMCXOjyYQ9I3v5Q2gmwckqQ76pH4-yFhmIVswl94E69jSlDIIupPb8IgIy13GMQI-LSEGi-W9GuvfZGoM1OJ4-8IoapeptIhCVaHnFFPg07t3AOmMUGL9Tp2UHALbf1qZE2PjwofVeRArYXLHtHjcNJJYXdo1pUmmcdTG31yJoyGo6MZd4oxbnIbNodq8ekmJpY8Nt9HETcX"
                  className="w-full h-full rounded-full object-cover border-2 border-primary"
                />
                <button 
                  type="button" 
                  onClick={() => showToast('Avatar updates are currently restricted by enterprise policies.', 'info')}
                  className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full border-2 border-white hover:scale-105 transition-transform"
                >
                  <Edit size={10} />
                </button>
              </div>
              <div className="flex-1 space-y-1">
                <label className="block text-xs font-semibold text-on-surface-variant">Display Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-md py-2 bg-surface border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-transparent outline-none text-xs font-medium"
                />
              </div>
            </div>

            <div className="space-y-1 py-md border-b border-outline-variant/60">
              <label className="block text-xs font-semibold text-on-surface-variant">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-md py-2 bg-surface border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-transparent outline-none text-xs font-medium"
              />
            </div>

            <div className="flex justify-end pt-sm">
              <button
                type="submit"
                className="px-lg py-2 bg-primary text-on-primary font-semibold text-xs rounded-lg hover:bg-primary/95 transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <Check size={14} />
                Save Preferences
              </button>
            </div>
          </form>
        </section>

        {/* Security Quick Action */}
        <section className="md:col-span-4 bg-primary-container text-on-primary-container border border-primary/50 rounded-xl p-lg flex flex-col justify-between shadow-xs">
          <div className="space-y-sm">
            <div className="flex items-center gap-md mb-xs">
              <Shield size={20} strokeWidth={1.5} />
              <h3 className="font-display text-sm lg:text-base font-bold uppercase tracking-wider">Security Control</h3>
            </div>
            <p className="text-xs opacity-90 leading-relaxed font-medium">
              Maintain credential integrity by periodically regenerating your multi-factor verification keys.
            </p>
          </div>
          <button 
            onClick={handleChangePassword}
            className="mt-lg w-full bg-white text-primary font-bold text-xs py-2.5 rounded-full hover:bg-surface-container-high transition-colors duration-200 active:scale-[0.98]"
          >
            Change Credentials
          </button>
        </section>

        {/* Audio Processing Configuration */}
        <section className="md:col-span-12 lg:col-span-7 bg-white border border-outline-variant rounded-xl p-lg shadow-xs">
          <div className="flex items-center gap-md mb-lg">
            <SettingsIcon className="text-primary" size={20} strokeWidth={1.5} />
            <h3 className="font-display text-sm lg:text-base font-bold text-on-surface uppercase tracking-wider">Audio Verification Core</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant">Audio Processing Rate</label>
              <select 
                value={sampleRate}
                onChange={(e) => setSampleRate(e.target.value)}
                className="w-full px-md py-2 bg-surface border border-outline-variant rounded-lg outline-none text-xs font-semibold focus:ring-1 focus:ring-primary"
              >
                <option value="44.1 kHz">44.1 kHz (CD Standard)</option>
                <option value="48.0 kHz">48.0 kHz (Studio Standard)</option>
                <option value="96.0 kHz">96.0 kHz (High Fidelity)</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant flex justify-between">
                <span>Duplicate Check Sensitivity</span>
                <span className="text-primary font-bold">{sensitivity}%</span>
              </label>
              <input 
                type="range"
                min="0"
                max="100"
                value={sensitivity}
                onChange={handleSensitivityChange}
                style={{
                  background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${fillPercentage}%, #e4e1ee ${fillPercentage}%, #e4e1ee 100%)`
                }}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary border border-outline-variant"
              />
              <div className="flex justify-between text-[9px] text-on-surface-variant font-bold uppercase tracking-wide">
                <span>Relaxed (Low)</span>
                <span>Strict (High)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Notification Preferences */}
        <section className="md:col-span-12 lg:col-span-5 bg-white border border-outline-variant rounded-xl p-lg shadow-xs">
          <div className="flex items-center gap-md mb-lg">
            <Bell className="text-primary" size={20} strokeWidth={1.5} />
            <h3 className="font-display text-sm lg:text-base font-bold text-on-surface uppercase tracking-wider">Notification Rules</h3>
          </div>
          
          <div className="space-y-md text-xs font-semibold">
            {/* Toggle 1 */}
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-on-surface group-hover:text-primary transition-colors">Daily Email Summaries</span>
              <div className="relative inline-flex items-center">
                <input 
                  type="checkbox" 
                  checked={emailSummaries}
                  onChange={() => {
                    setEmailSummaries(!emailSummaries);
                    showToast(`Email notifications ${!emailSummaries ? 'enabled' : 'disabled'}.`);
                  }}
                  className="sr-only peer" 
                />
                <div className="w-10 h-5 bg-surface-container rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </div>
            </label>

            {/* Toggle 2 */}
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-on-surface group-hover:text-primary transition-colors">Real-time Desktop Alerts</span>
              <div className="relative inline-flex items-center">
                <input 
                  type="checkbox" 
                  checked={desktopAlerts}
                  onChange={() => {
                    setDesktopAlerts(!desktopAlerts);
                    showToast(`Desktop alert triggers ${!desktopAlerts ? 'enabled' : 'disabled'}.`);
                  }}
                  className="sr-only peer" 
                />
                <div className="w-10 h-5 bg-surface-container rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </div>
            </label>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="md:col-span-12 mt-xl pt-lg border-t border-outline-variant/60 flex justify-end">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-error font-semibold text-xs hover:bg-error-container/10 px-lg py-2 rounded-full transition-colors border border-transparent hover:border-error-container"
          >
            <LogOut size={14} />
            Terminated Session (Logout)
          </button>
        </section>

      </div>
    </div>
  );
}
