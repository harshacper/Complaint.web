'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  ShieldAlert, Lock, Mail, Search, Filter, ShieldCheck, Trash2, Edit,
  Download, Users, BarChart3, Settings, LogOut, FileSpreadsheet, Eye
} from 'lucide-react';

const COLORS = ['#6366f1', '#a78bfa', '#f59e0b', '#10b981', '#f43f5e'];

export default function AdminPortal() {
  const { admin, adminLogin, adminLogout, isAdminAuthenticated, apiUrl } = useAuth();
  const { t } = useLanguage();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Active view
  const [activeTab, setActiveTab] = useState('analytics'); // analytics | complaints | users
  const [mounted, setMounted] = useState(false);

  // Complaints & Users states
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loadingGrid, setLoadingGrid] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [emergencyFilter, setEmergencyFilter] = useState('All');

  // Status Update state
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState('Pending');
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Check hydration mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch admin resources on login
  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchAdminData();
    }
  }, [isAdminAuthenticated, searchQuery, categoryFilter, statusFilter, emergencyFilter]);

  const fetchAdminData = async () => {
    setLoadingGrid(true);
    try {
      const adminToken = localStorage.getItem('complainsy_admin_token');
      const headers = { Authorization: `Bearer ${adminToken}` };

      // 1. Fetch complaints with search and filters
      const complaintsRes = await axios.get(`${apiUrl}/admin/complaints`, {
        headers,
        params: {
          search: searchQuery,
          category: categoryFilter,
          status: statusFilter,
          emergency: emergencyFilter
        }
      });

      if (complaintsRes.data.success) {
        setComplaints(complaintsRes.data.complaints);
      }

      // 2. Fetch users
      const usersRes = await axios.get(`${apiUrl}/admin/users`, { headers });
      if (usersRes.data.success) {
        setUsers(usersRes.data.users);
      }

      // 3. Fetch analytics
      const analyticsRes = await axios.get(`${apiUrl}/admin/analytics`, { headers });
      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.analytics);
      }

    } catch (err) {
      console.error('Error fetching administrative details:', err.message);
      toast.error('Session expired, please log in again.');
      adminLogout();
    } finally {
      setLoadingGrid(false);
    }
  };

  // Submit Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return toast.error('Email and password required!');

    setLoggingIn(true);
    const loggingToast = toast.loading('Verifying secure administrative clearance...');
    const res = await adminLogin(loginEmail, loginPassword);
    toast.dismiss(loggingToast);

    if (res.success) {
      toast.success('Access Granted. Administrative privileges enabled.');
    } else {
      toast.error(res.message || 'Verification failed.');
    }
    setLoggingIn(false);
  };

  // Trigger Status Update form
  const openEditPanel = (complaint) => {
    setEditingComplaint(complaint);
    setNewStatus(complaint.complaint_status);
    setResolutionDetails(complaint.resolution_details || '');
  };

  // Save Status updates
  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!editingComplaint) return;

    setUpdatingStatus(true);
    const saveToast = toast.loading('Dispatching updates to ledger and notifier...');

    try {
      const adminToken = localStorage.getItem('complainsy_admin_token');
      const res = await axios.put(
        `${apiUrl}/admin/complaints/${editingComplaint.id}/status`,
        {
          complaint_status: newStatus,
          resolution_details: resolutionDetails
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      toast.dismiss(saveToast);

      if (res.data.success) {
        toast.success(`Complaint status successfully updated to ${newStatus}!`);
        setEditingComplaint(null);
        fetchAdminData(); // Refresh grid
      } else {
        toast.error('Failed to update status.');
      }
    } catch (err) {
      toast.dismiss(saveToast);
      toast.error('Connection failed, status could not be saved.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Delete Complaint record
  const handleDeleteComplaint = async (id) => {
    if (!window.confirm('WARNING: Are you sure you want to permanently delete this complaint filing? This action is irreversible.')) {
      return;
    }

    const deletingToast = toast.loading('Purging filing records from databases...');
    try {
      const adminToken = localStorage.getItem('complainsy_admin_token');
      const res = await axios.delete(`${apiUrl}/admin/complaints/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.dismiss(deletingToast);

      if (res.data.success) {
        toast.success('Filing removed from database ledgers.');
        fetchAdminData(); // Refresh grid
      } else {
        toast.error('Failed to delete complaint.');
      }
    } catch (err) {
      toast.dismiss(deletingToast);
      toast.error('Connection failed, delete aborted.');
    }
  };

  // Generate and Download CSV Report (Highly Premium clientside CSV builder)
  const handleDownloadReport = () => {
    if (complaints.length === 0) {
      return toast.error('No complaints match active criteria to export.');
    }

    // Define CSV headers
    const headers = [
      'Complaint ID', 'Citizen Name', 'Citizen Email', 'Phone Number',
      'Title', 'Description', 'Category', 'Location',
      'Emergency Level', 'Status', 'Resolution Details', 'Created Date'
    ];

    // Map complaint details into CSV formatting escape strings
    const rows = complaints.map(c => [
      c.complaint_id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.email,
      c.phone_number || 'N/A',
      `"${c.complaint_title.replace(/"/g, '""')}"`,
      `"${c.complaint_description.replace(/"/g, '""')}"`,
      c.complaint_category,
      `"${c.complaint_location.replace(/"/g, '""')}"`,
      c.emergency_level,
      c.complaint_status,
      `"${(c.resolution_details || '').replace(/"/g, '""')}"`,
      new Date(c.created_at).toLocaleDateString()
    ]);

    // Build raw CSV string
    const csvContent = 'data:text/csv;charset=utf-8,'
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    // Create anchor link to download file
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `complainsy_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Filing report spreadsheet exported successfully!');
  };

  if (!mounted) return null;

  return (
    <div className="flex-grow py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      
      <AnimatePresence mode="wait">
        {!isAdminAuthenticated ? (
          
          /* ADMIN LOGIN PANEL (preauth) */
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-md mx-auto py-16"
          >
            <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 shadow-2xl relative">
              <div className="text-center mb-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 border border-violet-500/20 mb-4">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Admin Clearance Portal</h2>
                <p className="text-xs text-zinc-400 mt-2">Enter credentials below. Default: admin@complainsy.com (Admin@123456)</p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="admin@complainsy.com"
                      className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 pl-12 pr-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Clearance Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 pl-12 pr-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loggingIn}
                  className="w-full rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 py-3.5 text-sm font-semibold text-white shadow-xl hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  {loggingIn ? 'Authenticating...' : 'Sign in as Admin'}
                </button>
              </form>
            </div>
          </motion.div>

        ) : (

          /* ADMIN ACTIVE VIEW (postauth) */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto space-y-8"
          >
            
            {/* Header Dashboard Profile Banner */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-6 shadow-xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Clearance Level: Admin</span>
                </div>
                <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-1">
                  System Administrative Console
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">Welcome, {admin?.name || 'Administrator'}. Accessing secure databases.</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 shadow-md transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export CSV Report
                </button>
                <button
                  onClick={adminLogout}
                  className="flex items-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-950 text-rose-500 text-xs font-bold px-4 py-2.5 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            </div>

            {/* Main grid panels */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Sidebar Tabs (3 Cols) */}
              <div className="lg:col-span-3 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-4 shadow-md space-y-2">
                {[
                  { id: 'analytics', name: 'Dashboard Analytics', icon: BarChart3 },
                  { id: 'complaints', name: 'Manage Complaints', icon: ShieldAlert },
                  { id: 'users', name: 'Registered Citizens', icon: Users }
                ].map(tab => (
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

              {/* Dynamic Content grid (9 cols) */}
              <div className="lg:col-span-9 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 shadow-xl">
                
                {/* 1. ANALYTICS VIEW */}
                {activeTab === 'analytics' && analytics && (
                  <div className="space-y-8">
                    
                    {/* Counters grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-850/50 rounded-2xl p-5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-zinc-400 block mb-1">Total Complaints Filed</span>
                        <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{analytics.totalComplaints}</span>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-850/50 rounded-2xl p-5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-zinc-400 block mb-1">Registered Citizens</span>
                        <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{analytics.totalUsers}</span>
                      </div>
                    </div>

                    {/* Recharts Plots (WOW aesthetics) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Plot 1: Status Distribution Pie chart */}
                      <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-850/50 rounded-2xl p-5 space-y-4">
                        <h4 className="text-xs font-bold text-zinc-450 uppercase tracking-wider">Complaints by Status</h4>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analytics.statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {analytics.statusData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: '12px', background: '#18181b', color: '#fff', fontSize: '10px' }} />
                              <Legend wrapperStyle={{ fontSize: '10px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Plot 2: Emergency Bar count */}
                      <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-850/50 rounded-2xl p-5 space-y-4">
                        <h4 className="text-xs font-bold text-zinc-450 uppercase tracking-wider">Severity Priority Count</h4>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.emergencyData}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                              <XAxis dataKey="name" stroke="#888888" fontSize={10} />
                              <YAxis stroke="#888888" fontSize={10} />
                              <Tooltip contentStyle={{ borderRadius: '12px', background: '#18181b', color: '#fff', fontSize: '10px' }} />
                              <Bar dataKey="value" fill="#a78bfa" radius={[8, 8, 0, 0]}>
                                {analytics.emergencyData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.name === 'Critical' ? '#f43f5e' : entry.name === 'High' ? '#f59e0b' : '#6366f1'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {/* 2. MANAGE COMPLAINTS TAB */}
                {activeTab === 'complaints' && (
                  <div className="space-y-6">
                    <div className="border-b border-zinc-100 dark:border-zinc-850 pb-4">
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Active Grievance Filings</h2>
                      <p className="text-xs text-zinc-400">Search, filter, update statuses, or purge records securely.</p>
                    </div>

                    {/* Search and Filters grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-850/50">
                      
                      {/* Search */}
                      <div className="relative sm:col-span-2">
                        <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-zinc-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search title, citizen or ID..."
                          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2 pl-10 pr-3 text-xs outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                        />
                      </div>

                      {/* Status filter */}
                      <div>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2 px-3 text-xs outline-none focus:border-indigo-500"
                        >
                          <option value="All">All Statuses</option>
                          <option value="Pending">Pending</option>
                          <option value="Under Review">Under Review</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>

                      {/* Category filter */}
                      <div>
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2 px-3 text-xs outline-none focus:border-indigo-500"
                        >
                          <option value="All">All Categories</option>
                          <option value="Road Damage">Road Damage</option>
                          <option value="Water Problem">Water Problem</option>
                          <option value="Electricity Issue">Electricity Issue</option>
                          <option value="Garbage Problem">Garbage Problem</option>
                          <option value="Internet Fraud">Internet Fraud</option>
                          <option value="Cyber Crime">Cyber Crime</option>
                          <option value="Public Safety">Public Safety</option>
                          <option value="Noise Pollution">Noise Pollution</option>
                          <option value="Police Complaint">Police Complaint</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                    </div>

                    {/* Table grid */}
                    {loadingGrid ? (
                      <div className="flex justify-center py-10">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                      </div>
                    ) : complaints.length === 0 ? (
                      <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400">
                        No filings match active query criteria.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-850 rounded-2xl">
                        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-850 text-left text-xs">
                          <thead className="bg-zinc-50 dark:bg-zinc-950 font-extrabold text-zinc-450 uppercase tracking-wider">
                            <tr>
                              <th className="px-6 py-4">ID</th>
                              <th className="px-6 py-4">Title</th>
                              <th className="px-6 py-4">Citizen</th>
                              <th className="px-6 py-4">Category</th>
                              <th className="px-6 py-4">Severity</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850 bg-white/20 dark:bg-zinc-900/10">
                            {complaints.map(c => (
                              <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                                <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{c.complaint_id}</td>
                                <td className="px-6 py-4 font-bold text-zinc-800 dark:text-white max-w-[150px] truncate">{c.complaint_title}</td>
                                <td className="px-6 py-4">{c.name}</td>
                                <td className="px-6 py-4 text-[10px] font-semibold">{c.complaint_category}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                                    c.emergency_level === 'Critical'
                                      ? 'bg-rose-500/10 text-rose-500'
                                      : c.emergency_level === 'High'
                                      ? 'bg-amber-500/10 text-amber-500'
                                      : 'bg-indigo-500/10 text-indigo-500'
                                  }`}>
                                    {c.emergency_level}
                                  </span>
                                </td>
                                <td className="px-6 py-4 font-bold uppercase text-[9px] tracking-wider">
                                  <span className={
                                    c.complaint_status === 'Resolved'
                                      ? 'text-emerald-500'
                                      : c.complaint_status === 'Rejected'
                                      ? 'text-rose-500'
                                      : c.complaint_status === 'In Progress'
                                      ? 'text-amber-500'
                                      : 'text-indigo-500'
                                  }>
                                    {c.complaint_status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right flex gap-3 justify-end">
                                  <button
                                    onClick={() => openEditPanel(c)}
                                    className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    title="Edit status"
                                  >
                                    <Edit className="h-4.5 w-4.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComplaint(c.id)}
                                    className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors"
                                    title="Delete filing"
                                  >
                                    <Trash2 className="h-4.5 w-4.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                            {/* Status updater sub-panel overlay */}
                    {editingComplaint && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6"
                        >
                          <div className="flex justify-between items-center border-b border-zinc-150 dark:border-zinc-800 pb-4">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                              <ShieldCheck className="h-5.5 w-5.5 text-indigo-500" />
                              Filing Details & Resolution: {editingComplaint.complaint_id}
                            </h3>
                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                              editingComplaint.emergency_level === 'Critical'
                                ? 'bg-rose-500/10 text-rose-500'
                                : editingComplaint.emergency_level === 'High'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-indigo-500/10 text-indigo-500'
                            }`}>
                              {editingComplaint.emergency_level} Severity
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            
                            {/* Left Column: Citizen & Grievance Details */}
                            <div className="space-y-5">
                              <div>
                                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Citizen Information</h4>
                                <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/40 dark:border-zinc-850 rounded-2xl p-4 space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                                  <div className="flex justify-between"><span className="font-semibold">Name:</span> <span>{editingComplaint.name}</span></div>
                                  <div className="flex justify-between"><span className="font-semibold">Email:</span> <span className="font-mono">{editingComplaint.email}</span></div>
                                  <div className="flex justify-between"><span className="font-semibold">Phone:</span> <span>{editingComplaint.phone_number || 'N/A'}</span></div>
                                  <div className="flex justify-between"><span className="font-semibold">Demographics:</span> <span>{editingComplaint.age ? `${editingComplaint.age} yrs` : 'N/A'} / {editingComplaint.gender}</span></div>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Grievance Description</h4>
                                <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/40 dark:border-zinc-850 rounded-2xl p-4 text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed max-h-36 overflow-y-auto">
                                  <span className="font-bold block text-zinc-800 dark:text-white mb-1.5">{editingComplaint.complaint_title}</span>
                                  {editingComplaint.complaint_description}
                                </div>
                              </div>

                              {editingComplaint.complaint_image && (
                                <div>
                                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Evidence Snapshot</h4>
                                  <div className="relative h-28 w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-850">
                                    <img
                                      src={editingComplaint.complaint_image.startsWith('http') ? editingComplaint.complaint_image : `${apiUrl}${editingComplaint.complaint_image}`}
                                      alt="Evidence snapshot"
                                      className="h-full w-full object-cover cursor-pointer hover:scale-105 transition-all"
                                      onClick={() => window.open(editingComplaint.complaint_image.startsWith('http') ? editingComplaint.complaint_image : `${apiUrl}${editingComplaint.complaint_image}`, '_blank')}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Right Column: GPS Location Map & Resolution Status Form */}
                            <div className="space-y-5">
                              {/* Location address and Google Map Plot */}
                              <div>
                                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Grievance Plot Location</h4>
                                <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/40 dark:border-zinc-850 rounded-2xl p-3 text-xs text-zinc-700 dark:text-zinc-350 flex items-start gap-2 mb-3">
                                  <span className="text-base">📍</span>
                                  <span>{editingComplaint.complaint_location}</span>
                                </div>
                                <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-850 bg-zinc-100 dark:bg-zinc-950 h-44 shadow-inner">
                                  <iframe
                                    title="Admin Grievance Plot Map"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(editingComplaint.complaint_location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                                  />
                                </div>
                              </div>

                              {/* Form */}
                              <form onSubmit={handleSaveStatus} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-2">Update Status</label>
                                    <select
                                      value={newStatus}
                                      onChange={(e) => setNewStatus(e.target.value)}
                                      className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-855 bg-white dark:bg-zinc-950/60 py-2.5 px-4 text-xs outline-none focus:border-indigo-500 font-bold"
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="Under Review">Under Review</option>
                                      <option value="In Progress">In Progress</option>
                                      <option value="Resolved">Resolved</option>
                                      <option value="Rejected">Rejected</option>
                                    </select>
                                  </div>
                                  <div className="flex items-end gap-3 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setEditingComplaint(null)}
                                      className="rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-zinc-955 transition-colors"
                                    >
                                      Close
                                    </button>
                                    <button
                                      type="submit"
                                      disabled={updatingStatus}
                                      className="rounded-2xl bg-indigo-650 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 text-xs shadow-md transition-colors disabled:opacity-50"
                                    >
                                      {updatingStatus ? 'Saving...' : 'Save Updates'}
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-2">Resolution Details / Actions Taken</label>
                                  <textarea
                                    value={resolutionDetails}
                                    onChange={(e) => setResolutionDetails(e.target.value)}
                                    placeholder="Detail actions taken (e.g. Sanitation team dispatched to resolve the overflow). Citizens are informed automatically."
                                    rows={3}
                                    className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 py-3.5 px-4 text-xs outline-none focus:border-indigo-500 resize-none leading-relaxed"
                                  />
                                </div>
                              </form>
                            </div>

                          </div>
                        </motion.div>
                      </div>
                    )}              )}

                  </div>
                )}

                {/* 3. REGISTERED CITIZENS TAB */}
                {activeTab === 'users' && (
                  <div className="space-y-6">
                    <div className="border-b border-zinc-100 dark:border-zinc-850 pb-4">
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Registered Citizens Ledger</h2>
                      <p className="text-xs text-zinc-400">Inspect registered users, location settings, and signup logs.</p>
                    </div>

                    {loadingGrid ? (
                      <div className="flex justify-center py-10">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                      </div>
                    ) : users.length === 0 ? (
                      <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400">
                        No registered users found.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-850 rounded-2xl">
                        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-850 text-left text-xs">
                          <thead className="bg-zinc-50 dark:bg-zinc-950 font-extrabold text-zinc-450 uppercase tracking-wider">
                            <tr>
                              <th className="px-6 py-4">Name</th>
                              <th className="px-6 py-4">Email</th>
                              <th className="px-6 py-4">Phone</th>
                              <th className="px-6 py-4">Location</th>
                              <th className="px-6 py-4">Age / Gender</th>
                              <th className="px-6 py-4">Created Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850 bg-white/20 dark:bg-zinc-900/10">
                            {users.map(u => (
                              <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                                <td className="px-6 py-4 font-bold text-zinc-850 dark:text-white flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full overflow-hidden border border-indigo-500/20">
                                    <img
                                      src={u.profile_image}
                                      alt="Avatar"
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        e.target.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + u.email;
                                      }}
                                    />
                                  </div>
                                  {u.full_name}
                                  {u.role === 'admin' && (
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 text-[8px] font-bold">Admin</span>
                                  )}
                                </td>
                                <td className="px-6 py-4">{u.email}</td>
                                <td className="px-6 py-4">{u.phone_number || 'N/A'}</td>
                                <td className="px-6 py-4 max-w-[120px] truncate">{u.location || 'N/A'}</td>
                                <td className="px-6 py-4">{u.age || 'N/A'} yrs / {u.gender}</td>
                                <td className="px-6 py-4">{new Date(u.created_at).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                  </div>
                )}

              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
