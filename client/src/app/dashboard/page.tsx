'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { User, ClipboardList, Settings, Bell, Edit3, ShieldAlert, Phone, MapPin, Calendar, Users, Mail, ExternalLink, ShieldCheck } from 'lucide-react';

export default function UserDashboard() {
  const { user, updateProfile, logout, isUserAuthenticated, loading, apiUrl } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('complaints'); // complaints | profile | notifications
  const [complaints, setComplaints] = useState([]);
  const [fetchingComplaints, setFetchingComplaints] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Form state for profile editing
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone_number: '',
    location: '',
    age: '',
    gender: 'Male',
    profile_image: ''
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !isUserAuthenticated) {
      toast.error('Session expired, please sign in.');
      router.push('/login');
    }
  }, [isUserAuthenticated, loading, router]);

  // Load user data into form
  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        phone_number: user.phone_number || '',
        location: user.location || '',
        age: user.age ? user.age.toString() : '',
        gender: user.gender || 'Male',
        profile_image: user.profile_image || ''
      });
    }
  }, [user]);

  // Fetch respective user complaints
  useEffect(() => {
    async function fetchUserComplaints() {
      if (!isUserAuthenticated) return;
      setFetchingComplaints(true);
      try {
        const token = localStorage.getItem('complainsy_token');
        const res = await axios.get(`${apiUrl}/complaints/user`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setComplaints(res.data.complaints);
          
          // Generate realistic notification alerts based on complaints status
          const mockNotifs = [
            { id: 1, text: 'Welcome to the Complainsy family portal. Secure identity verified.', date: 'Just now', type: 'system' }
          ];

          res.data.complaints.forEach((c, idx) => {
            if (c.complaint_status !== 'Pending') {
              mockNotifs.push({
                id: idx + 2,
                text: `Update: Complaint ${c.complaint_id} (${c.complaint_title}) status is now "${c.complaint_status}".`,
                date: new Date(c.updated_at || c.created_at).toLocaleDateString(),
                type: c.complaint_status.toLowerCase()
              });
            }
          });

          setNotifications(mockNotifs);
        }
      } catch (err) {
        console.error('Error fetching complaints:', err.message);
      } finally {
        setFetchingComplaints(false);
      }
    }

    fetchUserComplaints();
  }, [isUserAuthenticated, apiUrl]);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.full_name) return toast.error('Full name is required!');

    const updatingToast = toast.loading('Updating database records...');
    const res = await updateProfile(profileData);
    toast.dismiss(updatingToast);

    if (res.success) {
      toast.success('Your profile has been updated successfully!');
      setActiveTab('complaints');
    } else {
      toast.error(res.message || 'Profile update failed.');
    }
  };

  if (loading || !user) {
    return (
      <div className="flex-grow flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex-grow py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* Citizen Overview Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-3xl flex items-center justify-center bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-650 dark:text-indigo-400 font-extrabold text-2xl uppercase border border-indigo-500/25 shadow-sm shrink-0">
              {user?.full_name ? user.full_name.charAt(0) : 'U'}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white">
                {t('dbWelcome')}{user?.full_name}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-zinc-400">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{user?.email}</span>
                {user?.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{user?.location}</span>}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/submit')}
              className="rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 shadow-md transition-colors"
            >
              Submit Complaint
            </button>
            <button
              onClick={logout}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-950 text-zinc-700 dark:text-zinc-300 text-xs font-bold px-4 py-2.5 transition-colors"
            >
              {t('logout')}
            </button>
          </div>
        </div>

        {/* Dashboard Grid Options */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          
          {/* Left Menu Tabs (Sidebar) */}
          <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-4 shadow-md space-y-2">
            {[
              { id: 'complaints', name: 'My Complaints', icon: ClipboardList },
              { id: 'profile', name: 'Edit Profile', icon: Settings },
              { id: 'notifications', name: `Notifications (${notifications.length})`, icon: Bell }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-950 hover:text-zinc-700 dark:hover:text-zinc-350'
                }`}
              >
                <tab.icon className="h-4.5 w-4.5" />
                {tab.name}
              </button>
            ))}
          </div>

          {/* Right Active Workspace panel */}
          <div className="md:col-span-3 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 shadow-xl">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: SUBMITTED COMPLAINTS */}
              {activeTab === 'complaints' && (
                <motion.div
                  key="complaints"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  className="space-y-6"
                >
                  <div className="border-b border-zinc-100 dark:border-zinc-850 pb-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                      {t('dbHistory')}
                    </h2>
                    <p className="text-xs text-zinc-400">View active filings and tracking status codes.</p>
                  </div>

                  {fetchingComplaints ? (
                    <div className="flex justify-center py-10">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    </div>
                  ) : complaints.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400">
                      <ClipboardList className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                      <p className="text-sm font-semibold">{t('dbNoComplaints')}</p>
                      <button
                        onClick={() => router.push('/submit')}
                        className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                      >
                        Submit one now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {complaints.map((c) => (
                        <div
                          key={c.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-850/50 hover:shadow-md transition-shadow"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold font-mono text-zinc-400 bg-zinc-200 dark:bg-zinc-900 px-2 py-0.5 rounded-lg">
                                {c.complaint_id}
                              </span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                c.complaint_status === 'Resolved'
                                  ? 'text-emerald-500'
                                  : c.complaint_status === 'Rejected'
                                  ? 'text-rose-500'
                                  : 'text-amber-500'
                              }`}>
                                {c.complaint_status}
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-zinc-900 dark:text-white max-w-[400px] truncate">
                              {c.complaint_title}
                            </h4>
                            <p className="text-xs text-zinc-400">
                              Filed on: {new Date(c.created_at).toLocaleDateString()} Category: {c.complaint_category}
                            </p>
                          </div>

                          <button
                            onClick={() => router.push(`/track?id=${c.complaint_id}`)}
                            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            Track status
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 2: EDIT PROFILE */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  className="space-y-6"
                >
                  <div className="border-b border-zinc-100 dark:border-zinc-850 pb-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                      {t('dbEditProfile')}
                    </h2>
                    <p className="text-xs text-zinc-400">Configure personal preferences and contact details.</p>
                  </div>

                  <form onSubmit={handleProfileSubmit} className="space-y-5">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                        {t('fullName')}
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                        <input
                          type="text"
                          name="full_name"
                          value={profileData.full_name}
                          onChange={handleProfileChange}
                          className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 pl-12 pr-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone and Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                          {t('phone')}
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                          <input
                            type="tel"
                            name="phone_number"
                            value={profileData.phone_number}
                            onChange={handleProfileChange}
                            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 pl-12 pr-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                          {t('location')}
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                          <input
                            type="text"
                            name="location"
                            value={profileData.location}
                            onChange={handleProfileChange}
                            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 pl-12 pr-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Age and Gender */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                          {t('age')}
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                          <input
                            type="number"
                            name="age"
                            value={profileData.age}
                            onChange={handleProfileChange}
                            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 pl-12 pr-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                          {t('gender')}
                        </label>
                        <div className="relative">
                          <Users className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                          <select
                            name="gender"
                            value={profileData.gender}
                            onChange={handleProfileChange}
                            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 pl-12 pr-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors appearance-none"
                          >
                            <option value="Male">{t('genderMale')}</option>
                            <option value="Female">{t('genderFemale')}</option>
                            <option value="Other">{t('genderOther')}</option>
                            <option value="Prefer not to say">{t('genderPreferNot')}</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 text-sm shadow-md transition-colors"
                    >
                      Save Profile Changes
                    </button>
                  </form>
                </motion.div>
              )}

              {/* TAB 3: NOTIFICATIONS SECTION */}
              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  className="space-y-6"
                >
                  <div className="border-b border-zinc-100 dark:border-zinc-850 pb-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                      Notifications Alert Center
                    </h2>
                    <p className="text-xs text-zinc-400">Track alerts related to your filings.</p>
                  </div>

                  <div className="space-y-3">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                          n.type === 'resolved'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-400'
                            : n.type === 'rejected'
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-400'
                            : n.type === 'in progress' || n.type === 'under review'
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-400'
                            : 'bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-850 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="flex gap-2.5 items-start">
                          <Bell className="h-4.5 w-4.5 mt-0.5 opacity-80" />
                          <span className="text-xs font-semibold leading-relaxed">{n.text}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 flex-shrink-0">{n.date}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>

      </div>
    </div>
  );
}
