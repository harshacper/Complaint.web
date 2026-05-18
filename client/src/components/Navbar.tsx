'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Sun, Moon, Globe, LogOut, LayoutDashboard, User, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLanguage, t } = useLanguage();
  const { user, admin, logout, adminLogout, isUserAuthenticated, isAdminAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => pathname === path;

  const navLinks = [
    { name: t('navHome'), path: '/' },
    { name: t('navSubmit'), path: '/submit' },
    { name: t('navTrack'), path: '/track' },
    { name: t('navAbout'), path: '/about' },
    { name: t('navContact'), path: '/contact' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-200/50 bg-white/70 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/70 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400">
                {t('appName')}
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`relative px-1 py-2 text-sm font-medium transition-colors duration-300 hover:text-indigo-600 dark:hover:text-indigo-400 ${
                  isActive(link.path)
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                )}
              </Link>
            ))}

            {isUserAuthenticated && (
              <Link
                href="/dashboard"
                className={`relative px-1 py-2 text-sm font-medium transition-colors duration-300 hover:text-indigo-600 dark:hover:text-indigo-400 ${
                  isActive('/dashboard')
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {t('navDashboard')}
                {isActive('/dashboard') && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                )}
              </Link>
            )}
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 rounded-xl p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
              title={t('language')}
            >
              <Globe className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">{lang}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-xl p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
              title={t('theme')}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* Auth Buttons */}
            {isAdminAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600/10 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 border border-violet-500/20"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  {t('navAdmin')}
                </Link>
                <button
                  onClick={adminLogout}
                  className="rounded-xl bg-rose-500/10 p-2 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                  title="Admin Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : isUserAuthenticated ? (
              <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full overflow-hidden border border-indigo-500/30">
                    <img
                      src={user?.profile_image || '/default-avatar.png'}
                      alt="User Avatar"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user?.email;
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 max-w-[100px] truncate">
                    {user?.full_name.split(' ')[0]}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="text-zinc-400 hover:text-rose-500 transition-colors"
                  title={t('logout')}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-zinc-700 hover:text-indigo-600 dark:text-zinc-300 dark:hover:text-indigo-400 transition-colors"
                >
                  {t('navLogin')}
                </Link>
                <Link
                  href="/login?register=true"
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/10 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {t('navRegister')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 rounded-xl p-1.5 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span className="text-xs font-bold uppercase">{lang}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="rounded-xl p-1.5 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-xl p-1.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-zinc-200/50 bg-white/95 backdrop-blur-md dark:border-zinc-850 dark:bg-zinc-950/95 transition-all duration-300 px-4 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              onClick={() => setIsOpen(false)}
              className={`rounded-xl px-3 py-2 text-base font-medium transition-colors ${
                isActive(link.path)
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'
                  : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900'
              }`}
            >
              {link.name}
            </Link>
          ))}

          {isUserAuthenticated && (
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className={`rounded-xl px-3 py-2 text-base font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'
                  : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900'
              }`}
            >
              {t('navDashboard')}
            </Link>
          )}

          <div className="mt-2 border-t border-zinc-200/50 pt-3 dark:border-zinc-800">
            {isAdminAuthenticated ? (
              <div className="flex flex-col gap-2">
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t('navAdmin')}
                </Link>
                <button
                  onClick={() => {
                    adminLogout();
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400"
                >
                  <LogOut className="h-4 w-4" />
                  Admin Logout
                </button>
              </div>
            ) : isUserAuthenticated ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="h-8 w-8 rounded-full overflow-hidden border border-indigo-500/30">
                    <img
                      src={user?.profile_image || '/default-avatar.png'}
                      alt="User Avatar"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user?.email;
                      }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {user?.full_name}
                    </span>
                    <span className="text-xs text-zinc-400 truncate max-w-[200px]">
                      {user?.email}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  <LogOut className="h-4 w-4" />
                  {t('logout')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
                >
                  {t('navLogin')}
                </Link>
                <Link
                  href="/login?register=true"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/10"
                >
                  {t('navRegister')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
