import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, LogOut, Settings, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function SidebarUserIcon() {
  const { user, isAdmin, signIn, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => signIn()}
        title="Admin Sign In"
        className="w-8 h-8 rounded-full border-2 border-dashed border-gray-600 hover:border-orange-500/80 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer group"
      >
        <LogIn className="w-4 h-4 transition-transform group-hover:scale-110" />
      </button>
    );
  }

  const initial = (user.displayName || user.email || 'A').charAt(0).toUpperCase();

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        title={user.email || 'Admin Profile'}
        className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-black font-black text-xs flex items-center justify-center shadow-md shadow-orange-500/30 hover:ring-2 hover:ring-orange-400 transition-all cursor-pointer overflow-hidden border border-white/20"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName || 'Avatar'} className="w-full h-full object-cover" />
        ) : (
          <span>{initial}</span>
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-10 w-48 rounded-xl bg-[#0c0e18] border border-white/15 p-2 shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95">
          <div className="p-2 border-b border-white/10 mb-1">
            <span className="font-bold text-white block truncate">
              {user.displayName || 'Administrator'}
            </span>
            <span className="text-xs text-gray-300 font-mono block truncate">
              {user.email}
            </span>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded mt-1.5 border border-amber-500/20">
                <ShieldCheck className="w-3 h-3" />
                ADMINISTRATOR
              </span>
            )}
          </div>

          {isAdmin && (
            <Link
              to="/settings"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-gray-400" />
              <span>Admin Settings</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              logout();
              setDropdownOpen(false);
            }}
            className="w-full flex items-center gap-2 p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
