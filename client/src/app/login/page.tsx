'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Lock, User, Phone, MapPin, Calendar, Users, Eye, EyeOff, Sparkles, KeyRound } from 'lucide-react';

function AuthContent() {
  const { login, register, googleLogin, user, isUserAuthenticated } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode switching (login vs signup)
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
    location: '',
    age: '',
    gender: 'Male'
  });

  // Check query parameter if landing directly on register tab
  useEffect(() => {
    if (searchParams.get('register') === 'true') {
      setIsRegister(true);
    }
  }, [searchParams]);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isUserAuthenticated) {
      router.push('/dashboard');
    }
  }, [isUserAuthenticated, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isRegister) {
      // Validate
      if (!formData.full_name || !formData.email || !formData.password) {
        return toast.error('Full name, email, and password are required!');
      }
      
      const loadingToast = toast.loading('Creating account...');
      const res = await register(formData);
      toast.dismiss(loadingToast);

      if (res.success) {
        toast.success('Registration successful! Welcome to Complainsy.');
        router.push('/dashboard');
      } else {
        toast.error(res.message);
      }
    } else {
      // Login
      if (!formData.email || !formData.password) {
        return toast.error('Email and password are required!');
      }

      const loadingToast = toast.loading('Logging in...');
      const res = await login(formData.email, formData.password);
      toast.dismiss(loadingToast);

      if (res.success) {
        toast.success('Welcome back!');
        router.push('/dashboard');
      } else {
        toast.error(res.message);
      }
    }
  };

  // Google Login Mock
  const handleGoogleLogin = async () => {
    const loadingToast = toast.loading('Connecting to Google...');
    
    // Simulate retrieving Google account profile details
    setTimeout(async () => {
      const mockProfile = {
        email: isRegister ? 'google_new_citizen@gmail.com' : 'user@complainsy.com',
        name: isRegister ? 'Google Citizen User' : 'Harsha Vardhana',
        imageUrl: '/default-avatar.png'
      };

      const res = await googleLogin(mockProfile);
      toast.dismiss(loadingToast);

      if (res.success) {
        toast.success('Authenticated through Google successfully!');
        router.push('/dashboard');
      } else {
        toast.error(res.message);
      }
    }, 1500);
  };

  // Forgot Password Trigger
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) return toast.error('Please enter your email ID');

    const loadingToast = toast.loading('Sending reset link...');
    try {
      // Wait to simulate request
      setTimeout(() => {
        toast.dismiss(loadingToast);
        toast.success('If the email is registered, a password reset link has been dispatched.');
        setForgotPasswordMode(false);
      }, 1500);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Connection failed, try again later');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4 bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden transition-colors duration-300">
      
      {/* Visual Background Blobs */}
      <div className="absolute top-[10%] left-[10%] h-[300px] w-[300px] rounded-full bg-violet-500/10 blur-[80px] -z-10" />
      <div className="absolute bottom-[10%] right-[10%] h-[350px] w-[350px] rounded-full bg-indigo-500/10 blur-[90px] -z-10 animate-pulse" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-white/70 dark:bg-zinc-900/60 backdrop-blur-lg border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 shadow-2xl relative"
      >
        <AnimatePresence mode="wait">
          {forgotPasswordMode ? (
            /* Forgot Password Tab */
            <motion.div
              key="forgot-password"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-500/20 mb-4">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {t('resetPassword')}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                  Enter your email address and we will send you a secure link to reset your account password.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    {t('email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 pl-12 pr-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  Send Reset Link
                </button>

                <button
                  type="button"
                  onClick={() => setForgotPasswordMode(false)}
                  className="w-full text-center text-sm font-semibold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mt-2"
                >
                  Back to Login
                </button>
              </form>
            </motion.div>
          ) : (
            /* Login & Register Tabs */
            <motion.div
              key="auth-forms"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header Title */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-fuchsia-400">
                  {isRegister ? t('authJoinUs') : t('authWelcomeBack')}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                  {isRegister ? 'Provide citizen details to register' : 'Enter credentials to manage complaints'}
                </p>
              </div>

              {/* Tabs Switcher */}
              <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 mb-6">
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    !isRegister
                      ? 'bg-white text-indigo-600 shadow-md dark:bg-zinc-900 dark:text-indigo-400'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {t('navLogin')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isRegister
                      ? 'bg-white text-indigo-600 shadow-md dark:bg-zinc-900 dark:text-indigo-400'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {t('navRegister')}
                </button>
              </div>

              {/* Form Input Container */}
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* 1. Register Fields */}
                <AnimatePresence>
                  {isRegister && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 overflow-hidden"
                    >
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                          {t('fullName')}
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                          <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 pl-12 pr-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                            required={isRegister}
                          />
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                          {t('phone')}
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                          <input
                            type="tel"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                            placeholder="Enter your phone number"
                            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 pl-12 pr-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Age */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                          {t('age')}
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                          <input
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            placeholder="Enter your age"
                            min="1"
                            max="120"
                            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 pl-12 pr-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 2. Common Credentials Fields */}
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    {t('email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email address"
                      className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 pl-12 pr-4 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      {t('password')}
                    </label>
                    {!isRegister && (
                      <button
                        type="button"
                        onClick={() => setForgotPasswordMode(true)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                      >
                        {t('forgotPassword')}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-3.5 pl-12 pr-12 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/10 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  {isRegister ? t('navRegister') : t('navLogin')}
                </button>

                {/* Or Divider */}
                <div className="relative flex items-center justify-center my-6">
                  <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
                  <span className="absolute bg-white dark:bg-zinc-900 px-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {t('orContinueWith')}
                  </span>
                </div>

                {/* Google Auth Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 py-3.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-all active:scale-[0.99]"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24">
                    <g transform="matrix(1, 0, 0, 1, 0, 0)">
                      <path d="M21.35,11.1H12v2.7h5.38C16.88,16.27,14.73,18,12,18c-3.31,0-6-2.69-6-6s2.69-6,6-6c1.47,0,2.83,0.53,3.89,1.42l2.03-2.03C16.21,3.77,14.22,3,12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9c4.75,0,8.87-3.41,8.96-8.3C21,12.18,21.35,11.1,21.35,11.1z" fill="#4285F4" />
                      <path d="M12,21c4.75,0,8.87-3.41,8.96-8.3H12V21z" fill="#34A853" />
                      <path d="M21.35,11.1H12v2.7h5.38C16.88,16.27,14.73,18,12,18V21C21,12.18,21.35,11.1,21.35,11.1z" fill="#FBBC05" />
                      <path d="M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9V3z" fill="#EA4335" />
                    </g>
                  </svg>
                  {t('googleAuth')}
                </button>
              </form>

              {/* Bottom Mode Switch Label */}
              <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-6">
                {isRegister ? t('haveAccount') : t('noAccount')}{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                >
                  {isRegister ? t('navLogin') : t('navRegister')}
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow py-16 px-4 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 min-h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-4" />
        <span className="text-sm font-semibold">Initializing Secure Auth Options...</span>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
