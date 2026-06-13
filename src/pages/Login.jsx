import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, Shield } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import ToastNotification from '../components/ui/ToastNotification';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'error' });

  // If already logged in, redirect immediately to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when leaving page
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!email) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    const res = await login(email, password);

    if (res.success) {
      setToast({
        isOpen: true,
        message: 'Successfully logged in!',
        type: 'success'
      });
      // Redirect handled by useEffect
    } else {
      setToast({
        isOpen: true,
        message: res.error || 'Invalid credentials. Please try again.',
        type: 'error'
      });
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden font-sans select-none">
      
      {/* Background Atmosphere Blur Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-30 z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] bg-indigo-600/35 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[400px] h-[400px] bg-emerald-600/25 blur-[100px] rounded-full"></div>
      </div>

      <ToastNotification 
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shadow-md">
            <Shield size={26} />
          </div>
        </div>
        <h2 className="text-3xl font-display font-extrabold text-white tracking-tight leading-none">
          VoiceCheck Portal
        </h2>
        <p className="text-sm text-slate-450 max-w-[280px] mx-auto font-medium leading-relaxed">
          Sign in to access recording compliance diagnostics & analytics.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/60 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-slate-800/80 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFormErrors(prev => ({ ...prev, email: null })); }}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
              {formErrors.email && (
                <p className="text-red-400 text-xs mt-1.5 font-medium flex items-center gap-1">
                  <span>●</span> {formErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFormErrors(prev => ({ ...prev, password: null })); }}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
              {formErrors.password && (
                <p className="text-red-400 text-xs mt-1.5 font-medium flex items-center gap-1">
                  <span>●</span> {formErrors.password}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all focus:outline-none flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Redirect to Signup */}
          <div className="mt-6 border-t border-slate-800/80 pt-6 text-center">
            <span className="text-xs text-slate-500 font-semibold">New to VoiceCheck? </span>
            <Link to="/signup" className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
