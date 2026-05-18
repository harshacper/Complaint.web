'use client';

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Mail, Phone, MapPin, Send, HelpCircle, MessageSquare, Award } from 'lucide-react';

export default function ContactUs() {
  const { t } = useLanguage();
  const { apiUrl } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      return toast.error('Please fill in all details!');
    }

    setLoading(true);
    const loadingToast = toast.loading('Sending message securely...');
    try {
      const res = await axios.post(`${apiUrl}/contact`, formData);
      toast.dismiss(loadingToast);

      if (res.data.success) {
        toast.success(res.data.message);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        toast.error('Message failed, try again later.');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || 'Server connection failed, try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow py-16 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-zinc-900 dark:text-white">
            {t('contactTitle')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl mx-auto">
            {t('contactSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Contact Info Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-6 shadow-md space-y-6">
              <h3 className="text-lg font-bold text-zinc-950 dark:text-white">
                {t('contactInfo')}
              </h3>

              <div className="space-y-4">
                {/* Email address */}
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Admin Email</span>
                    <a href="mailto:harshasubhash@gmail.com" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      harshasubhash@gmail.com
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Helpline Phone</span>
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">+91 98765 43210</span>
                  </div>
                </div>

                {/* Office */}
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{t('officeAddress')}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed block">
                      Infantry Road, Shivajinagar, Bengaluru, Karnataka - 560001
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick F.A.Q Cards */}
            <div className="bg-indigo-600/10 dark:bg-indigo-500/[0.03] border border-indigo-500/20 dark:border-indigo-500/10 rounded-3xl p-6 space-y-4">
              <h4 className="text-sm font-extrabold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <HelpCircle className="h-4.5 w-4.5" />
                Platforms F.A.Q
              </h4>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed space-y-2">
                <div>
                  <span className="font-bold text-zinc-700 dark:text-zinc-300 block">Is my identification shared?</span>
                  No, citizen names and emails are strictly restricted to system administrators. Local contractors only inspect coordinates.
                </div>
                <div>
                  <span className="font-bold text-zinc-700 dark:text-zinc-300 block">How long does resolution take?</span>
                  Depending on the emergency tier level (Low, High, Critical), issues resolve between 24 hours to 5 business days.
                </div>
              </div>
            </div>

          </div>

          {/* Right: Contact Form Column (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 shadow-xl space-y-5">
              <h3 className="text-lg font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-500" />
                Submit Direct Enquiry
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    {t('contactFormName')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Harsha Subhash"
                    className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 px-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    {t('email')}
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

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  {t('contactFormSubject')}
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Inquiry / Portal Feedback / Report Vulnerability"
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 px-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  {t('contactFormMsg')}
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Enter details here..."
                  rows={5}
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 px-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/10 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:scale-100"
              >
                <Send className="h-4.5 w-4.5" />
                {loading ? 'Sending message...' : t('contactSend')}
              </button>
            </form>

            {/* Google Maps Mock Container (Stunning visual design) */}
            <div className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-6 shadow-md overflow-hidden relative">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                Administrative Head Office Location Map
              </h4>
              <div className="h-64 rounded-2xl overflow-hidden border border-zinc-250 dark:border-zinc-800 relative bg-zinc-100 dark:bg-zinc-950">
                <iframe
                  title="Administrative HQ Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m17!3m2!1d12.981881!2d77.595152!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae167098c41ec3%3A0x67dbb6ad69c36c0a!2sInfantry%20Rd%2C%20Tasker%20Town%2C%20Shivajinagar%2C%20Bengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: 'grayscale(0.8) contrast(1.1) invert(0)' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="dark:invert dark:hue-rotate-180"
                />
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
