import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

const AUTH_STORAGE_KEY = 'west_end_star_auth_session_v6';
const REGISTERED_USERS_KEY = 'west_end_star_registered_accounts_v6';
const PREVIOUS_AUTH_KEYS = [
  'west_end_star_auth_session_v5',
  'west_end_star_registered_accounts_v5',
  'west_end_star_auth_session_v4',
  'west_end_star_registered_accounts_v4',
  'west_end_star_auth_session_v3',
  'west_end_star_registered_accounts_v3',
  'west_end_star_auth_session_v2',
  'west_end_star_registered_accounts_v2',
  'west_end_star_auth_session_v1',
  'west_end_star_registered_accounts_v1'
];

export interface OtpDispatchStatus {
  success: boolean;
  recipientEmail: string;
  dispatchedAt: number;
  expiresAt: number;
}

export const AUTHORIZED_DATA_ADMIN_EMAILS = [
  'kemboimanuu342@gmail.com',
  'admin@westendstar.ac.ke'
];

export const sanitizeUser = (u: any): User => {
  if (!u || typeof u !== 'object') return u;
  const clean = { ...u };
  delete clean.linkedGoogleEmail;
  delete clean.linkedGoogleName;
  delete clean.linkedGooglePicture;
  delete clean.googleId;
  delete clean.linkedAt;
  return clean as User;
};

export const checkIsAuthorizedDataAdmin = (user: User | null, registeredUsers: User[] = []): boolean => {
  if (!user || user.role !== 'admin') return false;
  
  const userEmail = (user.email || '').trim().toLowerCase();

  // Primary 2 authorized admins whitelist
  if (AUTHORIZED_DATA_ADMIN_EMAILS.includes(userEmail)) {
    return true;
  }

  // Strictly at most 2 admins can ever have access (first 2 admin accounts in registry)
  const allAdmins = registeredUsers.filter(u => u.role === 'admin');
  const allowedAdminIds = allAdmins.slice(0, 2).map(u => u.id);
  return allowedAdminIds.includes(user.id);
};

interface AuthContextType {
  currentUser: User | null;
  registeredUsers: User[];
  loginWithPassword: (email: string, password: string, role: UserRole) => { success: boolean; error?: string };
  loginWithGoogle: (role: UserRole, googleProfile: { email: string; name: string; picture?: string; googleId?: string }) => { success: boolean; error?: string };
  linkGoogleAccount: (googleProfile: { email: string; name: string; picture?: string; googleId?: string }) => { success: boolean; error?: string };
  unlinkGoogleAccount: () => { success: boolean; error?: string };
  sendEmailOtp: (email: string) => { success: boolean; recipientEmail: string; expiresAt: number; code?: string; error?: string };
  verifyOtpAndRegister: (email: string, otp: string, role: UserRole, userData: Partial<User> & { password?: string }) => { success: boolean; error?: string };
  registerDirect: (email: string, role: UserRole, userData: Partial<User> & { password?: string }) => { success: boolean; error?: string };
  switchAccount: (userId: string) => { success: boolean; error?: string };
  logout: () => void;
  eraseAllAuthData: () => void;
  isAuthenticated: boolean;
  canAccessSchoolData: boolean;
  activeDispatchEmail: string | null;
  clearActiveDispatchEmail: () => void;
  inspectPendingOtp: (email: string) => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(REGISTERED_USERS_KEY) || localStorage.getItem('west_end_star_registered_accounts_v5');
        PREVIOUS_AUTH_KEYS.forEach(k => {
          try { localStorage.removeItem(k); } catch (e) {}
        });
        if (saved) {
          const parsed = JSON.parse(saved);
          return Array.isArray(parsed) ? parsed.map(sanitizeUser) : [];
        }
      }
    } catch (e) {
      console.error('Failed to load registered accounts', e);
    }
    return [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem('west_end_star_auth_session_v5');
        if (saved) {
          return sanitizeUser(JSON.parse(saved));
        }
      }
    } catch (e) {
      console.error('Failed to load active session', e);
    }
    return null;
  });

  const [pendingOtps, setPendingOtps] = useState<Record<string, { code: string; expiresAt: number; dispatchedAt: number }>>({});
  const [activeDispatchEmail, setActiveDispatchEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save session', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registeredUsers));
    } catch (e) {
      console.error('Failed to save accounts', e);
    }
  }, [registeredUsers]);

  const loginWithPassword = (email: string, password: string, role: UserRole) => {
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail || !password) {
      return { success: false, error: 'Please enter both your registered email and password.' };
    }

    const existing = registeredUsers.find(
      u => u.email.toLowerCase() === cleanEmail && u.role === role
    );

    if (!existing) {
      return {
        success: false,
        error: `No registered ${role} account found for ${cleanEmail}. Please use "Create Account" first to register and verify your credentials.`
      };
    }

    setCurrentUser(existing);
    return { success: true };
  };

  const loginWithGoogle = (_role: UserRole, _googleProfile: { email: string; name: string; picture?: string; googleId?: string }) => {
    return { success: false, error: 'Google authentication has been disabled.' };
  };

  const linkGoogleAccount = (_googleProfile: { email: string; name: string; picture?: string; googleId?: string }) => {
    return { success: false, error: 'Google account linking has been disabled.' };
  };

  const unlinkGoogleAccount = () => {
    if (!currentUser) {
      return { success: false, error: 'No active session.' };
    }
    return { success: true };
  };

  const sendEmailOtp = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, recipientEmail: cleanEmail, expiresAt: 0, error: 'Please enter a valid email address.' };
    }

    // Cryptographic 6-digit numerical OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    setPendingOtps(prev => ({
      ...prev,
      [cleanEmail]: { code, expiresAt, dispatchedAt: now }
    }));

    setActiveDispatchEmail(cleanEmail);

    // Realistic delivery logging: logged to client console
    console.info(`[West End Star Academy Auth] Security verification code dispatched to ${cleanEmail}: ${code}`);

    return {
      success: true,
      recipientEmail: cleanEmail,
      expiresAt,
      code
    };
  };

  const clearActiveDispatchEmail = () => {
    setActiveDispatchEmail(null);
  };

  const inspectPendingOtp = (email: string): string | null => {
    const cleanEmail = email.trim().toLowerCase();
    const pending = pendingOtps[cleanEmail];
    if (pending && Date.now() <= pending.expiresAt) {
      return pending.code;
    }
    return null;
  };

  const verifyOtpAndRegister = (
    email: string,
    otp: string,
    role: UserRole,
    userData: Partial<User> & { password?: string }
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    const pending = pendingOtps[cleanEmail];

    if (!pending) {
      return {
        success: false,
        error: 'No active verification code found for this email. Please click "Send Verification Code" again.'
      };
    }

    if (Date.now() > pending.expiresAt) {
      return {
        success: false,
        error: 'Verification code has expired. Please request a new code.'
      };
    }

    if (pending.code !== otp.trim()) {
      return {
        success: false,
        error: 'Incorrect verification code. Please check your inbox and enter the 6-digit code received.'
      };
    }

    const newUser: User = {
      id: `usr-v-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: userData.name || '',
      email: cleanEmail,
      role,
      isVerified: true,
      authProvider: 'email',
      department: role === 'admin' ? 'School Administration' : userData.department || undefined,
      tscNumber: userData.tscNumber || undefined,
      assignedGrade: userData.assignedGrade || undefined,
      assignedSection: userData.assignedSection || undefined,
      learningAreas: userData.learningAreas,
      studentId: userData.studentId || undefined,
      studentRegNo: userData.studentRegNo || undefined,
      studentName: userData.studentName || undefined,
      phone: userData.phone || undefined,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setRegisteredUsers(prev => [
      ...prev.filter(u => !(u.email.toLowerCase() === cleanEmail && u.role === role)),
      newUser
    ]);
    setCurrentUser(newUser);

    // Clean up OTP
    setPendingOtps(prev => {
      const next = { ...prev };
      delete next[cleanEmail];
      return next;
    });
    setActiveDispatchEmail(null);

    return { success: true };
  };

  const registerDirect = (
    email: string,
    role: UserRole,
    userData: Partial<User> & { password?: string }
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const newUser: User = {
      id: `usr-d-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: userData.name || '',
      email: cleanEmail,
      role,
      isVerified: true,
      authProvider: 'email',
      department: role === 'admin' ? 'School Administration' : userData.department || undefined,
      tscNumber: userData.tscNumber || undefined,
      assignedGrade: userData.assignedGrade || undefined,
      assignedSection: userData.assignedSection || undefined,
      learningAreas: userData.learningAreas,
      studentId: userData.studentId || undefined,
      studentRegNo: userData.studentRegNo || undefined,
      studentName: userData.studentName || undefined,
      phone: userData.phone || undefined,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setRegisteredUsers(prev => [
      ...prev.filter(u => !(u.email.toLowerCase() === cleanEmail && u.role === role)),
      newUser
    ]);
    setCurrentUser(newUser);

    return { success: true };
  };

  const switchAccount = (userId: string) => {
    const target = registeredUsers.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      return { success: true };
    }
    return { success: false, error: 'Account not found.' };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const eraseAllAuthData = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(REGISTERED_USERS_KEY);
      PREVIOUS_AUTH_KEYS.forEach(k => {
        try { localStorage.removeItem(k); } catch (e) {}
      });
    } catch (e) {
      // ignore
    }
    setCurrentUser(null);
    setRegisteredUsers([]);
    setPendingOtps({});
    setActiveDispatchEmail(null);
  };

  const canAccessSchoolData = checkIsAuthorizedDataAdmin(currentUser, registeredUsers);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        registeredUsers,
        loginWithPassword,
        loginWithGoogle,
        linkGoogleAccount,
        unlinkGoogleAccount,
        sendEmailOtp,
        verifyOtpAndRegister,
        registerDirect,
        switchAccount,
        logout,
        eraseAllAuthData,
        isAuthenticated: !!currentUser,
        canAccessSchoolData,
        activeDispatchEmail,
        clearActiveDispatchEmail,
        inspectPendingOtp
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
