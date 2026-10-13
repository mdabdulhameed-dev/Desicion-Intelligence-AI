import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Brain,
  Layers,
  Sparkles,
  LogOut,
  User,
  PlusCircle,
  Upload,
  Cpu
} from 'lucide-react';

export default function Navbar({ onOpenIngest, onOpenNewDecision }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-background/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-accent-cyan p-0.5 shadow-glow group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-surface rounded-[10px] flex items-center justify-center">
                <Brain className="w-5 h-5 text-accent-cyan" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-extrabold text-lg tracking-wider text-white">STRATAGEM</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  AI CORE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5 font-medium">Decision Intelligence Platform</p>
            </div>
          </Link>

          {/* Engine Status indicator */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>TOPSIS & Monte Carlo v1.0</span>
          </div>
        </div>

        {/* Action Controls & User Menu */}
        <div className="flex items-center space-x-3">
          {user && (
            <>
              {onOpenIngest && (
                <button
                  id="btn-nav-ingest"
                  onClick={onOpenIngest}
                  className="hidden sm:inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-accent-cyan" />
                  <span>Ingest Data</span>
                </button>
              )}

              {onOpenNewDecision && (
                <button
                  id="btn-nav-new"
                  onClick={onOpenNewDecision}
                  className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-glow transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>New Decision</span>
                </button>
              )}

              {/* User profile capsule */}
              <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
                <div className="hidden md:block text-right">
                  <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                  <div className="text-[10px] text-slate-400">{user.organization || 'Enterprise'}</div>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-accent-cyan font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>

                <button
                  id="btn-nav-logout"
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {!user && (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-lg shadow-glow"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
