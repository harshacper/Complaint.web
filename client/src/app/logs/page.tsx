'use client';

import React, { useState, useEffect } from 'react';
import { logger, LogEntry } from '../../utils/logger';
import { AlertCircle, CheckCircle, Info, Trash2, Copy, ArrowLeft, RefreshCw, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'SUCCESS' | 'ERROR' | 'INFO'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load and subscribe to real-time logs
  const loadLogs = () => {
    setLogs(logger.getLogs());
  };

  useEffect(() => {
    loadLogs();

    // Listen for new log events (realtime update)
    if (typeof window !== 'undefined') {
      window.addEventListener('complainsy_log_added', loadLogs);
      return () => {
        window.removeEventListener('complainsy_log_added', loadLogs);
      };
    }
  }, []);

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all diagnostic logs?')) {
      logger.clearLogs();
      toast.success('Logs cleared successfully');
    }
  };

  const handleCopy = () => {
    try {
      const logsText = JSON.stringify(logs, null, 2);
      navigator.clipboard.writeText(logsText);
      toast.success('Copied all logs to clipboard!');
    } catch (err) {
      toast.error('Failed to copy logs');
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'ALL') return true;
    return log.type === filter;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-150 p-4 sm:p-8 flex flex-col font-serif">
      <div className="mx-auto w-full max-w-4xl flex-grow flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div className="flex items-center gap-3">
            <a 
              href="/"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Back to Home"
            >
              <ArrowLeft className="h-5 w-5" />
            </a>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <Terminal className="h-7 w-7 text-indigo-400" />
                Mobile Diagnostic Logs
              </h1>
              <p className="text-xs text-zinc-400 font-sans mt-1">
                Real-time tracking of registration, login, profile operations, and HTTP API status.
              </p>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              disabled={logs.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-300 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Logs
            </button>
            <button
              onClick={handleClear}
              disabled={logs.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 px-4 py-2.5 text-xs font-bold text-rose-400 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Logs
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex gap-1.5 overflow-x-auto bg-zinc-900/60 border border-zinc-800/50 p-1.5 rounded-2xl">
          {(['ALL', 'SUCCESS', 'ERROR', 'INFO'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-xl text-xs font-sans font-bold transition-all shrink-0 ${
                filter === type
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Logs Console Box */}
        <div className="flex-grow rounded-3xl bg-zinc-900/40 border border-zinc-800/50 p-4 min-h-[400px] flex flex-col gap-3 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 gap-3">
              <Terminal className="h-12 w-12 text-zinc-600 animate-pulse" />
              <p className="text-zinc-500 text-sm font-sans">No diagnostic logs found.</p>
              <p className="text-zinc-600 text-xs font-sans max-w-xs">
                Log entries will populate dynamically when you perform actions like submitting forms, registering, or logging in.
              </p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const Icon = log.type === 'SUCCESS' ? CheckCircle : log.type === 'ERROR' ? AlertCircle : Info;
              const colorClass = 
                log.type === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10' :
                log.type === 'ERROR' ? 'text-rose-400 bg-rose-500/5 border-rose-500/10' :
                'text-indigo-400 bg-indigo-500/5 border-indigo-500/10';

              return (
                <div 
                  key={log.id}
                  className={`border rounded-2xl overflow-hidden transition-all duration-200 ${colorClass}`}
                >
                  {/* Summary Bar */}
                  <div 
                    onClick={() => log.details ? setExpandedId(expandedId === log.id ? null : log.id) : null}
                    className={`flex items-start justify-between gap-4 p-4 ${log.details ? 'cursor-pointer hover:bg-white/5' : ''}`}
                  >
                    <div className="flex gap-3">
                      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-white font-serif tracking-wide leading-relaxed">
                          {log.message}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-sans font-bold">
                          {log.timestamp} • ID: {log.id}
                        </span>
                      </div>
                    </div>
                    {log.details && (
                      <span className="text-[10px] uppercase tracking-wider font-sans font-bold text-zinc-500 px-2 py-0.5 bg-zinc-800 rounded">
                        {expandedId === log.id ? 'Hide details' : 'Show details'}
                      </span>
                    )}
                  </div>

                  {/* Expandable JSON details */}
                  {log.details && expandedId === log.id && (
                    <div className="border-t border-zinc-800/60 bg-zinc-950/80 p-4 font-mono text-[11px] leading-relaxed text-zinc-400 overflow-x-auto whitespace-pre">
                      {log.details}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="text-center pb-4 text-[10px] text-zinc-650 font-sans">
          Complainsy Portal Diagnostic Logs Console. Powered by HTML5 LocalStorage.
        </div>
        
      </div>
    </div>
  );
}
