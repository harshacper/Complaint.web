'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { Mail, Phone, MapPin, ShieldAlert } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Info */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-indigo-500/10 border border-indigo-500/20 shadow-sm">
                <img src="/logo.png" alt="Complainsy Logo" className="h-full w-full object-cover" />
              </div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400">
                {t('appName')}
              </span>
            </Link>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {t('heroSubtitle').split('.')[0]}. Empowering citizens through transparency and fast action.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/" className="text-sm text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">
                  {t('navHome')}
                </Link>
              </li>
              <li>
                <Link href="/submit" className="text-sm text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">
                  {t('navSubmit')}
                </Link>
              </li>
              <li>
                <Link href="/track" className="text-sm text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">
                  {t('navTrack')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">
                  {t('navAbout')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Technology Details */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4">
              Built With
            </h3>
            <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
              <li>Next.js 16 & React 19</li>
              <li>Tailwind CSS v4</li>
              <li>Node.js & Express.js</li>
              <li>MySQL DB & JWT Secure</li>
              <li>AI-Powered Category Suggest</li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4">
              Get in Touch
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-zinc-400 hover:text-indigo-500" />
                <a href="mailto:harshasubhash@gmail.com" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  harshasubhash@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-zinc-400" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">+91 98765 43210</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-zinc-400 mt-0.5" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Infantry Road, Bengaluru,<br />Karnataka - 560001
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Socials & Copyright */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center md:text-left">
            &copy; {new Date().getFullYear()} Complainsy Portal. All rights reserved. Made with ❤️ by Harsha.
          </p>

          <div className="flex gap-4">
            {/* GitHub custom inline SVG */}
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors" title="GitHub">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </a>
            
            {/* LinkedIn custom inline SVG */}
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-indigo-500 transition-colors" title="LinkedIn">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>

            {/* Twitter/X custom inline SVG */}
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-sky-550 transition-colors" title="Twitter/X">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
              </svg>
            </a>

            {/* Instagram custom inline SVG */}
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-pink-500 transition-colors" title="Instagram">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
