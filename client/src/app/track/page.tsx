'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Search, MapPin, Calendar, Tag, ShieldCheck, Clock, FileText, AlertTriangle, ChevronRight } from 'lucide-react';

const statusSteps = ['Pending', 'Under Review', 'In Progress', 'Resolved'];

export default function TrackComplaint() {
  const { t } = useLanguage();
  const { apiUrl } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchId, setSearchId] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Check if tracking ID was passed in URL query
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setSearchId(id);
      fetchComplaint(id);
    }
  }, [searchParams]);

  const fetchComplaint = async (id) => {
    if (!id) return;
    setLoading(true);
    setSearched(true);
    const trackingToast = toast.loading('Locating complaint ledger...');

    try {
      const res = await axios.get(`${apiUrl}/complaints/track/${id}`);
      toast.dismiss(trackingToast);

      if (res.data.success) {
        setComplaint(res.data.complaint);
        toast.success('Complaint log found!');
      } else {
        setComplaint(null);
        toast.error('Complaint not found with this ID');
      }
    } catch (err) {
      toast.dismiss(trackingToast);
      setComplaint(null);
      toast.error('Could not locate details. Verify ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchId.trim()) return toast.error('Please enter a Complaint ID!');
    
    // Update URL query parameter
    router.replace(`/track?id=${searchId.toUpperCase().trim()}`);
    fetchComplaint(searchId.toUpperCase().trim());
  };

  // Helper to determine active step index in progress bar
  const getStatusIndex = (status) => {
    if (status === 'Rejected') return -1;
    return statusSteps.indexOf(status);
  };

  return (
    <div className="flex-grow py-16 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-zinc-900 dark:text-white">
            {t('trackTitle')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            {t('trackSubtitle')}
          </p>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearch} className="mb-10 max-w-2xl mx-auto flex gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/75 dark:bg-zinc-900/60 backdrop-blur-sm py-3.5 pl-12 pr-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 font-mono tracking-wider placeholder:font-sans transition-all shadow-md"
            />
          </div>
          <button
            type="submit"
            className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:opacity-95 transition-all"
          >
            {t('trackBtn')}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {loading ? (
            /* Loading State */
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              <span className="text-sm text-zinc-500 dark:text-zinc-400 mt-4">Analyzing global register logs...</span>
            </motion.div>
          ) : complaint ? (
            /* Complaint details card */
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 shadow-xl space-y-8"
            >
              
              {/* Stepper Status Bar (WOW Factor) */}
              <div className="border-b border-zinc-100 dark:border-zinc-850 pb-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-950 px-3 py-1 rounded-xl text-xs font-semibold text-zinc-500 font-mono">
                    ID: {complaint.complaint_id}
                  </div>
                  <span className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wide uppercase ${
                    complaint.complaint_status === 'Resolved'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : complaint.complaint_status === 'Rejected'
                      ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                      : complaint.complaint_status === 'In Progress'
                      ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                      : 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                  }`}>
                    {complaint.complaint_status}
                  </span>
                </div>

                {complaint.complaint_status === 'Rejected' ? (
                  /* Rejected Indicator */
                  <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold">Complaint Rejected:</span> This filing has been archived and will not proceed. Refer to administrative notes below.
                    </div>
                  </div>
                ) : (
                  /* Visual Progress Stepper */
                  <div className="relative mt-8 px-4">
                    <div className="absolute top-2.5 left-0 w-full h-0.5 bg-zinc-200 dark:bg-zinc-800 -z-10" />
                    
                    {/* Animated Fill Bar */}
                    <div
                      className="absolute top-2.5 left-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 -z-10 transition-all duration-700"
                      style={{ width: `${(getStatusIndex(complaint.complaint_status) / (statusSteps.length - 1)) * 100}%` }}
                    />

                    <div className="flex justify-between items-center">
                      {statusSteps.map((step, idx) => {
                        const active = idx <= getStatusIndex(complaint.complaint_status);
                        return (
                          <div key={idx} className="flex flex-col items-center">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${
                              active
                                ? 'bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-400 dark:border-indigo-400'
                                : 'bg-white border-zinc-200 text-zinc-400 dark:bg-zinc-900 dark:border-zinc-800'
                            }`}>
                              {active && <span className="h-2 w-2 rounded-full bg-white" />}
                            </div>
                            <span className={`text-[10px] sm:text-xs mt-2 font-bold tracking-tight transition-colors duration-500 ${
                              active ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'
                            }`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left: General data */}
                <div className="space-y-5">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Title</span>
                    <h3 className="text-xl font-bold text-zinc-950 dark:text-white">
                      {complaint.complaint_title}
                    </h3>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Description</span>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {complaint.complaint_description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
                      <Tag className="h-4.5 w-4.5 text-zinc-400 flex-shrink-0" />
                      <div className="truncate">
                        <span className="text-[9px] font-semibold text-zinc-400 block">Category</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300 text-xs">{complaint.complaint_category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
                      <Calendar className="h-4.5 w-4.5 text-zinc-400 flex-shrink-0" />
                      <div>
                        <span className="text-[9px] font-semibold text-zinc-400 block">Submitted</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300 text-xs">
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
                    <MapPin className="h-4.5 w-4.5 text-zinc-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-[9px] font-semibold text-zinc-400 block">Exact Location</span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 text-xs">{complaint.complaint_location}</span>
                    </div>
                  </div>

                </div>

                {/* Right: Media & Resolution Details */}
                <div className="space-y-6 flex flex-col justify-between">
                  {/* Photo details */}
                  {complaint.complaint_image ? (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Supporting Evidence Photo</span>
                      <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <img
                          src={`http://localhost:5000${complaint.complaint_image}`}
                          alt="Filing Evidence"
                          className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="h-44 flex flex-col items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 gap-2 p-4 text-center">
                      <FileText className="h-8 w-8 text-zinc-300" />
                      <span className="text-xs">No image evidence uploaded with this complaint filing</span>
                    </div>
                  )}

                  {/* Resolution Notes Box */}
                  <div className="p-5 bg-gradient-to-tr from-indigo-500/[0.03] to-violet-500/[0.03] border border-indigo-500/10 dark:border-indigo-400/10 rounded-2xl shadow-sm">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      {t('resolutionDetails')}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {complaint.resolution_details || 'The complaint is currently awaiting processing. Once an administrator reviews and updates the case details, official comments and closure records will appear here.'}
                    </p>
                  </div>

                </div>

              </div>

            </motion.div>
          ) : searched ? (
            /* Not Found State */
            <motion.div
              key="not-found"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-center"
            >
              <AlertTriangle className="h-10 w-10 text-rose-500 mb-4 animate-bounce" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Filing Ledger Not Found</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm">
                No complaint matches the Tracking ID <span className="font-mono font-bold text-rose-500">"{searchId}"</span> in the secure ledger. Please double check the ID.
              </p>
            </motion.div>
          ) : (
            /* Intro / Callout State */
            <motion.div
              key="intro"
              className="text-center p-12 bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl"
            >
              <Clock className="h-10 w-10 text-zinc-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Ready to Track?</h3>
              <p className="text-xs text-zinc-400 mt-2">
                Filing logs contain real-time timestamps, tracking histories, image references, and resolution reports.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
