'use client';

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import { ShieldCheck, Cpu, GitBranch, Key, Activity, Heart, BookmarkCheck } from 'lucide-react';

export default function AboutPortal() {
  const { t } = useLanguage();

  const technologies = [
    { name: 'Next.js 16 (App Router)', role: 'Frontend Architecture, SSR Hydration' },
    { name: 'React 19 & Hooks', role: 'Reactive UX State & Bilingual Contexts' },
    { name: 'Tailwind CSS v4', role: 'Bespoke Premium Stylings & Glassmorphism Design' },
    { name: 'Framer Motion', role: 'Dynamic Transition & Floating Mesh Backgrounds' },
    { name: 'Node.js & Express.js', role: 'Restful API Controller Middleware Framework' },
    { name: 'MySQL Relational DB', role: 'Secure citizen and complaint schema ledgers' },
    { name: 'JWT & Bcrypt Hashing', role: 'Role-Based Authentication Security' },
    { name: 'AI Keywords NLP Engine', role: 'Auto Category Classification suggested instantly' }
  ];

  return (
    <div className="flex-grow py-16 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      
      <div className="mx-auto max-w-4xl space-y-12">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-zinc-900 dark:text-white">
            {t('aboutTitle')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            {t('aboutSubtitle')}
          </p>
        </div>

        {/* 1. Mission statement */}
        <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <Heart className="h-5 w-5" />
            {t('missionTitle')}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-350 leading-relaxed">
            {t('missionText')}
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Local administrative complaints historically suffer from delayed dispatch channels, manual category sorting inefficiencies, and lack of status transparency. Complainsy leverages sequential ID tracking ledgers and real-time administrator status pipelines to resolve this gap.
          </p>
        </div>

        {/* 2. Interactive Citizen workflow */}
        <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Citizen Municipal Workflow
          </h3>

          <div className="space-y-4 relative border-l-2 border-indigo-500/20 dark:border-indigo-400/20 pl-6 ml-2">
            
            {[
              { title: 'Secure Login & Profile Setup', desc: 'Citizens register an account providing their location, phone number, and age. Authentication remains secured using Bcrypt credentials hashing.' },
              { title: 'Dynamic Complaint Submission', desc: 'Citizens submit municipal grievances, upload photos, and can invoke our AI Category suggestion to instantly classify the issue. A sequential Tracking ID (CMPXXXX) is generated.' },
              { title: 'Real-Time Tracking & Notifications', desc: 'Citizens view status updates (Pending -> Under Review -> In Progress -> Resolved). Updates dispatch notifications to dashboards and email alerts.' },
              { title: 'Administrative Closure & Resolution', desc: 'System administrators update the status and upload official resolution details, providing a transparent closing ledger.' }
            ].map((step, idx) => (
              <div key={idx} className="relative">
                {/* Stepper Dot marker */}
                <div className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-zinc-900 border-2 border-indigo-500 text-white font-mono text-[8px]" />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                  {idx + 1}. {step.title}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}

          </div>
        </div>

        {/* 3. Security Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-6 shadow-md space-y-3">
            <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Key className="h-4.5 w-4.5" />
              Bcrypt Hashing Security
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              We employ a 12-round salt generation Bcrypt algorithm to hash citizen passwords before database persistence. Plain-text passwords are never logged, ensuring robust safety against database intrusion attempts.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-6 shadow-md space-y-3">
            <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4.5 w-4.5" />
              Role-Based JWT Gatekeepers
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              API routes (profile updates, admin analytics) are barricaded behind JSON Web Token verification filters. Unauthorized users are blocked at the middleware gateway before database processing occurs.
            </p>
          </div>

        </div>

        {/* 4. Tech Stack */}
        <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            {t('techTitle')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {technologies.map((tech, idx) => (
              <div key={idx} className="flex gap-2.5 items-start p-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200/50 dark:border-zinc-850/50">
                <BookmarkCheck className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-bold text-zinc-850 dark:text-white block">{tech.name}</span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">{tech.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
