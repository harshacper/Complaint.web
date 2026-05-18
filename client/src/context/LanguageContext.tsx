'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Navbar & Common
    appName: 'Complainsy',
    navHome: 'Home',
    navSubmit: 'Submit Complaint',
    navTrack: 'Track Status',
    navDashboard: 'Dashboard',
    navAbout: 'About',
    navContact: 'Contact Us',
    navAdmin: 'Admin Panel',
    navLogin: 'Login',
    navRegister: 'Sign Up',
    logout: 'Logout',
    language: 'Language',
    theme: 'Theme',
    
    // Home Page
    heroTitle: 'Resolve Public Grievances Safely & Instantly',
    heroSubtitle: 'A premium, AI-powered public complaint management portal with end-to-end tracking, secure authentication, and smart analytics. Empowering citizens for a better tomorrow.',
    btnSubmitNow: 'Submit a Complaint',
    btnTrackNow: 'Track Complaint',
    btnDashboard: 'Go to Dashboard',
    statsTotal: 'Total Complaints',
    statsResolved: 'Resolved Cases',
    statsInProg: 'Under Investigation',
    statsPending: 'Awaiting Review',
    howItWorks: 'How It Works',
    step1Title: '1. Fast Submission',
    step1Desc: 'File a complaint anonymously or with your account, upload images, and get AI-suggested categories instantly.',
    step2Title: '2. Auto Routing',
    step2Desc: 'Our system generates a unique tracking ID and automatically notifies responsible authorities and admins.',
    step3Title: '3. Real-Time Tracking',
    step3Desc: 'Track your complaint status transparently at every stage: Pending, Under Review, In Progress, to Resolved.',
    step4Title: '4. Active Resolution',
    step4Desc: 'Authorities resolve the problem and post updates, immediately triggering email confirmations to you.',
    ctaTitle: 'Ready to bring a positive change in your locality?',
    ctaSubtitle: 'Submit your concern today. Our automated routing system ensures the right municipal authorities get to work immediately.',
    
    // Auth Pages
    authWelcomeBack: 'Welcome Back',
    authJoinUs: 'Create your Account',
    fullName: 'Full Name',
    email: 'Email Address',
    password: 'Password',
    phone: 'Phone Number',
    location: 'Location',
    age: 'Age',
    gender: 'Gender',
    genderMale: 'Male',
    genderFemale: 'Female',
    genderOther: 'Other',
    genderPreferNot: 'Prefer not to say',
    orContinueWith: 'Or continue with',
    googleAuth: 'Google Account',
    forgotPassword: 'Forgot Password?',
    haveAccount: 'Already have an account?',
    noAccount: "Don't have an account yet?",
    resetPassword: 'Reset Password',
    
    // Complaint Submission
    compTitle: 'Complaint Title',
    compDesc: 'Detailed Description',
    compCat: 'Complaint Category',
    compLoc: 'Exact Location / Landmark',
    compImg: 'Upload Supporting Photo',
    emergencyLevel: 'Emergency Severity Level',
    notes: 'Additional Notes / Comments',
    submitSuccess: 'Complaint Registered Successfully!',
    aiSuggestion: 'AI Suggestion',
    aiSuggestBtn: 'Suggest Category via AI',
    submitting: 'Submitting complaint...',
    
    // Tracking
    trackTitle: 'Track Your Complaint',
    trackSubtitle: 'Enter your unique Complaint ID (e.g. CMP1001) to view status updates, timestamps, and resolution details.',
    searchPlaceholder: 'Enter Tracking ID (e.g., CMP1001)',
    trackBtn: 'Search Complaint',
    currentStatus: 'Current Status',
    submittedOn: 'Submitted Date',
    resolutionDetails: 'Official Resolution Notes',
    
    // Dashboard
    dbWelcome: 'Welcome, ',
    dbHistory: 'Your Submitted Complaints',
    dbEditProfile: 'Edit Profile Details',
    dbNoComplaints: 'You have not submitted any complaints yet.',
    
    // Contact
    contactTitle: 'Get In Touch',
    contactSubtitle: 'Have questions or experiencing technical issues? Send a direct message to our system administration team.',
    contactFormName: 'Your Name',
    contactFormSubject: 'Subject',
    contactFormMsg: 'Type your message...',
    contactSend: 'Send Message',
    contactInfo: 'Contact Information',
    adminEmailLabel: 'Admin Email',
    officeAddress: 'Office Address',
    
    // About Page
    aboutTitle: 'About Our Platform',
    aboutSubtitle: 'Modernizing citizen-municipal relations through technology, accountability, and real-time speed.',
    missionTitle: 'Our Mission',
    missionText: 'To create transparent, frictionless, and secure communication channels between citizens and local administrative systems, utilizing AI-classification to maximize speed and administrative throughput.',
    techTitle: 'Technologies Powering Complainsy',
    securityTitle: 'Secure Architecture'
  },
  kn: {
    // Navbar & Common
    appName: 'ಕಂಪ್ಲೈನ್ಸಿ',
    navHome: 'ಮುಖಪುಟ',
    navSubmit: 'ದೂರು ಸಲ್ಲಿಸಿ',
    navTrack: 'ಸ್ಥಿತಿ ಟ್ರ್ಯಾಕ್',
    navDashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    navAbout: 'ನಮ್ಮ ಬಗ್ಗೆ',
    navContact: 'ಸಂಪರ್ಕಿಸಿ',
    navAdmin: 'ನಿರ್ವಾಹಕರು',
    navLogin: 'ಲಾಗಿನ್',
    navRegister: 'ನೋಂದಣಿ',
    logout: 'ನಿರ್ಗಮಿಸಿ',
    language: 'ಭಾಷೆ',
    theme: 'ಥೀಮ್',
    
    // Home Page
    heroTitle: 'ಸಾರ್ವಜನಿಕ ಕುಂದುಕೊರತೆಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಮತ್ತು ತ್ವರಿತವಾಗಿ ಪರಿಹರಿಸಿ',
    heroSubtitle: 'ಅತ್ಯಾಧುನಿಕ, AI-ಚಾಲಿತ ಸಾರ್ವಜನಿಕ ದೂರು ನಿರ್ವಹಣಾ ಪೋರ್ಟಲ್. ಇದು ಸುರಕ್ಷಿತ ದೃಢೀಕರಣ ಮತ್ತು ಸ್ಮಾರ್ಟ್ ವಿಶ್ಲೇಷಣೆಗಳನ್ನು ಒಳಗೊಂಡಿದೆ. ಉತ್ತಮ ನಾಳೆಗಾಗಿ ನಾಗರಿಕರ ಸಬಲೀಕರಣ.',
    btnSubmitNow: 'ದೂರು ಸಲ್ಲಿಸಿ',
    btnTrackNow: 'ದೂರು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    btnDashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ',
    statsTotal: 'ಒಟ್ಟು ದೂರುಗಳು',
    statsResolved: 'ಪರಿಹರಿಸಲಾದ ಪ್ರಕರಣಗಳು',
    statsInProg: 'ತನಿಖೆಯಲ್ಲಿದೆ',
    statsPending: 'ಪರಿಶೀಲನೆಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ',
    howItWorks: 'ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ',
    step1Title: '೧. ವೇಗದ ಸಲ್ಲಿಕೆ',
    step1Desc: 'ಅನಾಮಧೇಯವಾಗಿ ಅಥವಾ ಖಾತೆಯೊಂದಿಗೆ ದೂರು ಸಲ್ಲಿಸಿ, ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಮತ್ತು AI ಆಧಾರಿತ ವರ್ಗ ಸಲಹೆ ಪಡೆಯಿರಿ.',
    step2Title: '೨. ಆಟೋ ರೂಟಿಂಗ್',
    step2Desc: 'ನಮ್ಮ ವ್ಯವಸ್ಥೆಯು ವಿಶಿಷ್ಟ ಟ್ರ್ಯಾಕಿಂಗ್ ID ರಚಿಸುತ್ತದೆ ಮತ್ತು ಸಂಬಂಧಪಟ್ಟ ಅಧಿಕಾರಿಗಳು ಹಾಗೂ ನಿರ್ವಾಹಕರಿಗೆ ಸೂಚಿಸುತ್ತದೆ.',
    step3Title: '೩. ನೈಜ-ಸಮಯದ ಟ್ರ್ಯಾಕಿಂಗ್',
    step3Desc: 'ದೂರಿನ ಸ್ಥಿತಿಯನ್ನು ಪಾರದರ್ಶಕವಾಗಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ: ಬಾಕಿ, ಪರಿಶೀಲನೆಯಲ್ಲಿ, ಪ್ರಗತಿಯಲ್ಲಿ, ಮತ್ತು ಪರಿಹರಿಸಲಾಗಿದೆ.',
    step4Title: '೪. ಸಕ್ರಿಯ ಪರಿಹಾರ',
    step4Desc: 'ಅಧಿಕಾರಿಗಳು ಸಮಸ್ಯೆಯನ್ನು ಪರಿಹರಿಸಿ ಅಪ್‌ಡೇಟ್ ಮಾಡುತ್ತಾರೆ, ತಕ್ಷಣವೇ ನಿಮಗೆ ಇಮೇಲ್ ದೃಢೀಕರಣ ತಲುಪುತ್ತದೆ.',
    ctaTitle: 'ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ಧನಾತ್ಮಕ ಬದಲಾವಣೆ ತರಲು ಸಿದ್ಧರಿದ್ದೀರಾ?',
    ctaSubtitle: 'ಇಂದೇ ನಿಮ್ಮ ಕಳಕಳಿಯನ್ನು ಸಲ್ಲಿಸಿ. ನಮ್ಮ ಸ್ವಯಂಚಾಲಿತ ರೂಟಿಂಗ್ ಸಿಸ್ಟಮ್ ಮುನ್ಸಿಪಲ್ ಅಧಿಕಾರಿಗಳು ತಕ್ಷಣ ಕೆಲಸ ಪ್ರಾರಂಭಿಸುವಂತೆ ನೋಡಿಕೊಳ್ಳುತ್ತದೆ.',
    
    // Auth Pages
    authWelcomeBack: 'ಮರಳಿ ಸ್ವಾಗತ',
    authJoinUs: 'ನಿಮ್ಮ ಖಾತೆಯನ್ನು ರಚಿಸಿ',
    fullName: 'ಪೂರ್ಣ ಹೆಸರು',
    email: 'ಇಮೇಲ್ ವಿಳಾಸ',
    password: 'ಪಾಸ್‌ವರ್ಡ್',
    phone: 'ಫೋನ್ ಸಂಖ್ಯೆ',
    location: 'ಸ್ಥಳ',
    age: 'ವಯಸ್ಸು',
    gender: 'ಲಿಂಗ',
    genderMale: 'ಪುರುಷ',
    genderFemale: 'ಮಹಿಳೆ',
    genderOther: 'ಇತರೆ',
    genderPreferNot: 'ಹೇಳಲು ಇಷ್ಟವಿಲ್ಲ',
    orContinueWith: 'ಅಥವಾ ಇದರೊಂದಿಗೆ ಮುಂದುವರಿಯಿರಿ',
    googleAuth: 'ಗೂಗಲ್ ಖಾತೆ',
    forgotPassword: 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?',
    haveAccount: 'ಈಗಾಗಲೇ ಖಾತೆ ಹೊಂದಿದ್ದೀರಾ?',
    noAccount: 'ಖಾತೆಯನ್ನು ಹೊಂದಿಲ್ಲವೇ?',
    resetPassword: 'ಪಾಸ್‌ವರ್ಡ್ ರಿಸೆಟ್',
    
    // Complaint Submission
    compTitle: 'ದೂರಿನ ಶೀರ್ಷಿಕೆ',
    compDesc: 'ವಿವರವಾದ ವಿವರಣೆ',
    compCat: 'ದೂರು ವರ್ಗ',
    compLoc: 'ನಿಖರವಾದ ಸ್ಥಳ / ಹೆಗ್ಗುರುತು',
    compImg: 'ಬೆಂಬಲಿತ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    emergencyLevel: 'ತುರ್ತು ತೀವ್ರತೆಯ ಮಟ್ಟ',
    notes: 'ಹೆಚ್ಚುವರಿ ಟಿಪ್ಪಣಿಗಳು / ಕಾಮೆಂಟ್‌ಗಳು',
    submitSuccess: 'ದೂರು ಯಶಸ್ವಿಯಾಗಿ ನೋಂದಾಯಿಸಲ್ಪಟ್ಟಿದೆ!',
    aiSuggestion: 'AI ಸಲಹೆ',
    aiSuggestBtn: 'AI ಮೂಲಕ ವರ್ಗ ಸಲಹೆ ಪಡೆಯಿರಿ',
    submitting: 'ದೂರು ಸಲ್ಲಿಕೆಯಾಗುತ್ತಿದೆ...',
    
    // Tracking
    trackTitle: 'ನಿಮ್ಮ ದೂರನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    trackSubtitle: 'ದೂರಿನ ಸ್ಥಿತಿ, ಸಮಯ ಮತ್ತು ಪರಿಹಾರದ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಲು ನಿಮ್ಮ ವಿಶಿಷ್ಟ ದೂರು ID (ಉದಾ: CMP1001) ಅನ್ನು ನಮೂದಿಸಿ.',
    searchPlaceholder: 'ಟ್ರ್ಯಾಕಿಂಗ್ ID ನಮೂದಿಸಿ (ಉದಾ: CMP1001)',
    trackBtn: 'ದೂರು ಹುಡುಕಿ',
    currentStatus: 'ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ',
    submittedOn: 'ಸಲ್ಲಿಸಿದ ದಿನಾಂಕ',
    resolutionDetails: 'ಅಧಿಕೃತ ಪರಿಹಾರದ ಟಿಪ್ಪಣಿಗಳು',
    
    // Dashboard
    dbWelcome: 'ಸ್ವಾಗತ, ',
    dbHistory: 'ನೀವು ಸಲ್ಲಿಸಿದ ದೂರುಗಳು',
    dbEditProfile: 'ಪ್ರೊಫೈಲ್ ವಿವರಗಳನ್ನು ಸಂಪಾದಿಸಿ',
    dbNoComplaints: 'ನೀವು ಇನ್ನೂ ಯಾವುದೇ ದೂರುಗಳನ್ನು ಸಲ್ಲಿಸಿಲ್ಲ.',
    
    // Contact
    contactTitle: 'ಸಂಪರ್ಕದಲ್ಲಿರಿ',
    contactSubtitle: 'ಪ್ರಶ್ನೆಗಳಿವೆಯೇ ಅಥವಾ ತಾಂತ್ರಿಕ ತೊಂದರೆ ಎದುರಿಸುತ್ತಿದ್ದೀರಾ? ಸಿಸ್ಟಮ್ ಆಡಳಿತ ತಂಡಕ್ಕೆ ನೇರ ಸಂದೇಶ ಕಳುಹಿಸಿ.',
    contactFormName: 'ನಿಮ್ಮ ಹೆಸರು',
    contactFormSubject: 'ವಿಷಯ',
    contactFormMsg: 'ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...',
    contactSend: 'ಸಂದೇಶ ಕಳುಹಿಸಿ',
    contactInfo: 'ಸಂಪರ್ಕ ಮಾಹಿತಿ',
    adminEmailLabel: 'ನಿರ್ವಾಹಕರ ಇಮೇಲ್',
    officeAddress: 'ಕಚೇರಿ ವಿಳಾಸ',
    
    // About Page
    aboutTitle: 'ನಮ್ಮ ವೇದಿಕೆಯ ಬಗ್ಗೆ',
    aboutSubtitle: 'ತಂತ್ರಜ್ಞಾನ, ಹೊಣೆಗಾರಿಕೆ ಮತ್ತು ನೈಜ-ಸಮಯದ ವೇಗದ ಮೂಲಕ ನಾಗರಿಕ-ಮುನ್ಸಿಪಲ್ ಸಂಬಂಧಗಳನ್ನು ಆಧುನೀಕರಿಸುವುದು.',
    missionTitle: 'ನಮ್ಮ ಧ್ಯೇಯ',
    missionText: 'AI-ವರ್ಗೀಕರಣವನ್ನು ಬಳಸಿಕೊಂಡು ನಾಗರಿಕರು ಮತ್ತು ಸ್ಥಳೀಯ ಆಡಳಿತ ವ್ಯವಸ್ಥೆಗಳ ನಡುವೆ ಪಾರದರ್ಶಕ, ಸುಲಭ ಮತ್ತು ಸುರಕ್ಷಿತ ಸಂವಹನ ಚಾನಲ್‌ಗಳನ್ನು ನಿರ್ಮಿಸುವುದು.',
    techTitle: 'ಕಂಪ್ಲೈನ್ಸಿ ಪವರ್ ಮಾಡುವ ತಂತ್ರಜ್ಞಾನಗಳು',
    securityTitle: 'ಸುರಕ್ಷಿತ ವಾಸ್ತುಶಿಲ್ಪ'
  }
};

interface LanguageContextType {
  lang: string;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState('en');

  // Load language preference from local storage
  useEffect(() => {
    const savedLang = localStorage.getItem('complainsy_lang');
    if (savedLang === 'en' || savedLang === 'kn') {
      setLang(savedLang);
    }
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'kn' : 'en';
    setLang(nextLang);
    localStorage.setItem('complainsy_lang', nextLang);
  };

  const t = (key: string) => {
    return translations[lang as 'en' | 'kn'][key as keyof typeof translations['en']] || translations['en'][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
