'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Clipboard, ShieldAlert, Sparkles, Image as ImageIcon, MapPin, Send, CheckCircle2, Copy } from 'lucide-react';

const categories = [
  'Road Damage',
  'Water Problem',
  'Electricity Issue',
  'Garbage Problem',
  'Internet Fraud',
  'Cyber Crime',
  'Public Safety',
  'Noise Pollution',
  'Police Complaint',
  'Other'
];

export default function SubmitComplaint() {
  const { user, apiUrl } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [successData, setSuccessData] = useState(null); // Holds CMPXXXX details on success

  // Geolocation states
  const [fetchingLoc, setFetchingLoc] = useState(false);
  const [coordinates, setCoordinates] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    complaint_title: '',
    complaint_description: '',
    complaint_category: 'Road Damage',
    complaint_location: '',
    name: '',
    email: '',
    phone_number: '',
    age: '',
    gender: 'Male',
    emergency_level: 'Medium',
    additional_notes: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // GPS Location Fetch and Reverse Geocoding
  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      return toast.error('Geolocation is not supported by your browser.');
    }

    setFetchingLoc(true);
    const geolocateToast = toast.loading('Querying device GPS and satellite positioning...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });

        try {
          // Use OpenStreetMap Nominatim API for reverse geocoding
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                'User-Agent': 'Complainsy-Client-App/1.0'
              }
            }
          );

          toast.dismiss(geolocateToast);

          if (res.data && res.data.display_name) {
            setFormData((prev) => ({
              ...prev,
              complaint_location: res.data.display_name
            }));
            toast.success('Current location fetched and reverse-geocoded successfully!');
          } else {
            setFormData((prev) => ({
              ...prev,
              complaint_location: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
            }));
            toast.success(`Location set to GPS coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          }
        } catch (err) {
          toast.dismiss(geolocateToast);
          setFormData((prev) => ({
            ...prev,
            complaint_location: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
          }));
          toast.success(`Location set to GPS coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } finally {
          setFetchingLoc(false);
        }
      },
      (error) => {
        toast.dismiss(geolocateToast);
        setFetchingLoc(false);
        let errorMsg = 'Failed to retrieve location.';
        if (error.code === 1) errorMsg = 'GPS location permission denied.';
        else if (error.code === 2) errorMsg = 'Position unavailable.';
        else if (error.code === 3) errorMsg = 'GPS request timed out.';
        toast.error(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Prefill details if user is logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.full_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        age: user.age ? user.age.toString() : '',
        gender: user.gender || 'Male',
        complaint_location: user.location || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return toast.error('File size cannot exceed 5MB!');
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // AI-Based Category Suggestion
  const handleAiSuggest = async () => {
    if (!formData.complaint_title && !formData.complaint_description) {
      return toast.error('Please enter a title or description first to run AI analysis!');
    }

    setSuggesting(true);
    const loadingToast = toast.loading('AI analyzing details...');
    try {
      const res = await axios.post(`${apiUrl}/complaints/ai-suggest`, {
        title: formData.complaint_title,
        description: formData.complaint_description
      });
      toast.dismiss(loadingToast);

      if (res.data.success) {
        const suggested = res.data.suggested_category;
        setFormData((prev) => ({ ...prev, complaint_category: suggested }));
        toast.success(`AI suggests category: "${suggested}"!`);
      } else {
        toast.error('AI suggestion failed, choose manually');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Could not connect to AI Suggestion service');
    } finally {
      setSuggesting(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.complaint_title || !formData.complaint_description || !formData.complaint_location || !formData.name || !formData.email) {
      return toast.error('Please fill in all mandatory fields!');
    }

    setLoading(true);
    const submitToast = toast.loading('Submitting your complaint securely...');

    try {
      // Build FormData for multer image upload support
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      if (imageFile) {
        data.append('complaint_image', imageFile);
      }

      // Check if logged in to send authorization header
      const token = localStorage.getItem('complainsy_token');
      const headers = {
        'Content-Type': 'multipart/form-data'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await axios.post(`${apiUrl}/complaints`, data, { headers });
      toast.dismiss(submitToast);

      if (res.data.success) {
        toast.success('Complaint submitted successfully!');
        setSuccessData(res.data.data);
      } else {
        toast.error(res.data.message || 'Submission failed');
      }
    } catch (error) {
      toast.dismiss(submitToast);
      toast.error(error.response?.data?.message || 'Server error, could not submit complaint');
    } finally {
      setLoading(false);
    }
  };

  // Clipboard Copier
  const handleCopyId = () => {
    if (successData?.complaint_id) {
      navigator.clipboard.writeText(successData.complaint_id);
      toast.success('Complaint Tracking ID copied to clipboard!');
    }
  };

  return (
    <div className="flex-grow py-16 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 relative">
      
      {/* Success Modal Panel */}
      <AnimatePresence>
        {successData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20 mb-6">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">
                {t('submitSuccess')}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                Your complaint has been successfully recorded on the secure ledger. Write down or copy the tracking ID below.
              </p>

              {/* Tracking ID Holder */}
              <div className="my-6 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex flex-col items-start">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Complaint ID</span>
                  <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tracking-wider">
                    {successData.complaint_id}
                  </span>
                </div>
                <button
                  onClick={handleCopyId}
                  className="p-2.5 rounded-xl text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-colors"
                  title="Copy Tracking ID"
                >
                  <Copy className="h-5 w-5" />
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/track?id=${successData.complaint_id}`)}
                  className="flex-grow rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 text-sm shadow-md transition-colors"
                >
                  Track Complaint
                </button>
                <button
                  onClick={() => {
                    setSuccessData(null);
                    setFormData({
                      complaint_title: '',
                      complaint_description: '',
                      complaint_category: 'Road Damage',
                      complaint_location: '',
                      name: user?.full_name || '',
                      email: user?.email || '',
                      phone_number: user?.phone_number || '',
                      age: user?.age ? user.age.toString() : '',
                      gender: user?.gender || 'Male',
                      emergency_level: 'Medium',
                      additional_notes: ''
                    });
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-850 dark:bg-zinc-800 px-5 text-sm font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  Submit Another
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-zinc-900 dark:text-white">
            {t('navSubmit')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            Submit local issues. Use our AI-Routing utility for dynamic category selection.
          </p>
        </div>

        {/* Form Card Container */}
        <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 shadow-xl space-y-8">
          
          {/* Section 1: Complaint details */}
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              1. Issue Details
            </h3>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                {t('compTitle')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="complaint_title"
                value={formData.complaint_title}
                onChange={handleChange}
                placeholder="Briefly state the issue (e.g. Major sewage overflow, Broken streetlight)"
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 px-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                {t('compDesc')} <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="complaint_description"
                value={formData.complaint_description}
                onChange={handleChange}
                placeholder="Provide detailed information regarding the problem, including specific landmarks, duration of the issue, and immediate hazards."
                rows={4}
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 px-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors resize-none"
                required
              />
            </div>

            {/* Category and AI Suggestion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  {t('compCat')} <span className="text-rose-500">*</span>
                </label>
                <select
                  name="complaint_category"
                  value={formData.complaint_category}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 px-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors appearance-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={suggesting}
                className="flex items-center justify-center gap-2 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 py-3.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 transition-colors"
              >
                <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                {t('aiSuggestBtn')}
              </button>
            </div>

            {/* Location & Emergency Level Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Location */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    {t('compLoc')} <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleFetchLocation}
                    disabled={fetchingLoc}
                    className="flex items-center gap-1.5 text-[10px] font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-wider hover:opacity-85 disabled:opacity-50 transition-opacity"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {fetchingLoc ? 'Fetching GPS...' : '📍 Use GPS Location'}
                  </button>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                  <input
                    type="text"
                    name="complaint_location"
                    value={formData.complaint_location}
                    onChange={handleChange}
                    placeholder="12th Main Road, Sector 6, HSR Layout"
                    className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 pl-12 pr-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Emergency Severity Level */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  {t('emergencyLevel')}
                </label>
                <select
                  name="emergency_level"
                  value={formData.emergency_level}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 px-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors appearance-none"
                >
                  <option value="Low">Low (Routine municipal task)</option>
                  <option value="Medium">Medium (Affecting residential crossways)</option>
                  <option value="High">High (Serious safety/health hazard)</option>
                  <option value="Critical">Critical (Immediate danger - accidents imminent)</option>
                </select>
              </div>
            </div>

            {/* Dynamic Map Embed */}
            {coordinates && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950 p-1 mt-2 shadow-inner"
              >
                <div className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider px-3 py-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                    🗺️ Plotted Grievance Coordinates: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setCoordinates(null)} 
                    className="text-rose-500 hover:opacity-80 font-extrabold"
                  >
                    Remove Map
                  </button>
                </div>
                <iframe
                  title="Grievance Map Plot"
                  width="100%"
                  height="220"
                  style={{ border: 0, borderRadius: '14px' }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                />
              </motion.div>
            )}

            {/* Upload Complaint Image */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                {t('compImg')}
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl border border-zinc-200/50 bg-zinc-50/50 dark:border-zinc-850 dark:bg-zinc-950/50">
                <label className="flex items-center gap-2 rounded-xl bg-white border border-zinc-250 dark:border-zinc-800 dark:bg-zinc-900 px-4 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 hover:scale-[1.01] transition-all cursor-pointer">
                  <ImageIcon className="h-4.5 w-4.5 text-zinc-500" />
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                
                {imagePreview ? (
                  <div className="relative h-16 w-24 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                    <img src={imagePreview} alt="Upload Preview" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <span className="text-xs text-zinc-400">No photo selected. PNG, JPG up to 5MB.</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Citizen Contact Information */}
          <div className="space-y-5 border-t border-zinc-200/50 dark:border-zinc-900/50 pt-8">
            <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <Clipboard className="h-5 w-5" />
              2. Citizen Information
            </h3>

            {/* Name and Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Name"
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 px-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Email ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 px-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Phone, Age, Gender Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 px-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="23"
                  min="1"
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 px-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 px-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors appearance-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Additional details */}
          <div className="space-y-5 border-t border-zinc-200/50 dark:border-zinc-900/50 pt-8">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                {t('notes')}
              </label>
              <textarea
                name="additional_notes"
                value={formData.additional_notes}
                onChange={handleChange}
                placeholder="Mention any specific reference IDs, or previous complaints made regarding this specific concern."
                rows={3}
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 px-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/10 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:scale-100"
          >
            <Send className="h-5 w-5" />
            {loading ? t('submitting') : 'Submit Complaint'}
          </button>
        </form>
      </div>

    </div>
  );
}
