import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { 
  ShieldCheck, 
  GraduationCap, 
  Users, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Phone, 
  X, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserRole } from '../types';
import { CBC_GRADES } from '../data/initialData';
import { SchoolEmblem } from './SchoolEmblem';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'admin'
}) => {
  const { 
    loginWithPassword, 
    registerDirect
  } = useAuth();
  const { students } = useSchool();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  
  // Teacher specific
  const [tscNumber, setTscNumber] = useState('');
  const [assignedGrade, setAssignedGrade] = useState('');
  const [subject, setSubject] = useState('');
  
  // Parent specific
  const [learnerRegNo, setLearnerRegNo] = useState('');
  const [phone, setPhone] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  useEffect(() => {
    setSelectedRole(defaultRole);
  }, [defaultRole]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!email || !password) {
      setAuthError('Please enter both registered email and password.');
      return;
    }

    const res = loginWithPassword(email, password, selectedRole);
    if (res.success) {
      onClose();
    } else {
      setAuthError(res.error || 'Authentication failed. Please check your credentials or create an account.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!fullName.trim() || !email.trim()) {
      setAuthError('Please provide both your official name and email address.');
      return;
    }

    if (!password || password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    if (selectedRole === 'teacher' && !tscNumber.trim()) {
      setAuthError('TSC Number is required for CBC Facilitators.');
      return;
    }

    let parentStudent = undefined;
    if (selectedRole === 'parent' && learnerRegNo) {
      parentStudent = students.find(s => 
        s.regNo.toLowerCase() === learnerRegNo.toLowerCase() ||
        s.nemisUpi.toLowerCase() === learnerRegNo.toLowerCase()
      );
    }

    const res = registerDirect(email, selectedRole, {
      name: fullName.trim(),
      password,
      tscNumber: selectedRole === 'teacher' ? tscNumber : undefined,
      assignedGrade: selectedRole === 'teacher' ? assignedGrade : undefined,
      assignedSection: selectedRole === 'teacher' ? 'Star' : undefined,
      learningAreas: selectedRole === 'teacher' ? [subject] : undefined,
      studentId: parentStudent?.id,
      studentRegNo: parentStudent?.regNo || learnerRegNo,
      studentName: parentStudent?.fullName,
      phone: selectedRole === 'parent' ? phone : undefined
    });

    if (res.success) {
      onClose();
    } else {
      setAuthError(res.error || 'Failed to create account.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative my-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* School Lockup */}
        <div className="text-center pb-4 border-b border-slate-200">
          <SchoolEmblem size="lg" className="mx-auto mb-2" />
          <h2 className="text-lg font-display font-bold text-slate-900 tracking-tight">
            West End Star Academy
          </h2>
          <p className="text-xs text-slate-500">
            Kenya Competency-Based Curriculum (CBC) Unified Gateway
          </p>

          {/* Mode Switcher */}
          <div className="flex items-center justify-center gap-2 mt-3 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setAuthError(null);
              }}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setAuthError(null);
              }}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                mode === 'signup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Portal Gateway Selector */}
        <div className="py-4">
          <span className="block text-xs font-semibold text-slate-700 mb-2">
            Target Portal Gateway:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                selectedRole === 'admin'
                  ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-800/20'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-emerald-800" />
              <div className="text-xs">Admin Portal</div>
              <div className="text-[10px] text-slate-500">Headteacher & Bursar</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('teacher')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                selectedRole === 'teacher'
                  ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-800/20'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <GraduationCap className="w-4 h-4 mx-auto mb-1 text-emerald-800" />
              <div className="text-xs">Teachers Portal</div>
              <div className="text-[10px] text-slate-500">TSC Facilitators</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('parent')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                selectedRole === 'parent'
                  ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-800/20'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Users className="w-4 h-4 mx-auto mb-1 text-emerald-800" />
              <div className="text-xs">Parents Portal</div>
              <div className="text-[10px] text-slate-500">Bursary & M-Pesa</div>
            </button>
          </div>
        </div>

        {authError && (
          <div className="p-3 mb-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {authSuccess && (
          <div className="p-3 mb-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>{authSuccess}</span>
          </div>
        )}

        {/* Step: Login Form */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {selectedRole === 'parent' ? 'Registered Guardian Email' : 'Official Registered Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@westendstar.ac.ke"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Sign In to {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Step: Sign Up Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Official Name *</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Immanuel Kemboi"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. staff@westendstar.ac.ke"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                />
              </div>
            </div>

            {/* Teacher specific */}
            {selectedRole === 'teacher' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">TSC Number *</label>
                  <input
                    type="text"
                    required
                    value={tscNumber}
                    onChange={(e) => setTscNumber(e.target.value)}
                    placeholder="e.g. TSC/558568"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Facilitator Grade</label>
                  <select
                    value={assignedGrade}
                    onChange={(e) => setAssignedGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="">Select Grade</option>
                    {CBC_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Parent specific */}
            {selectedRole === 'parent' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Learner NEMIS UPI</label>
                  <input
                    type="text"
                    value={learnerRegNo}
                    onChange={(e) => setLearnerRegNo(e.target.value)}
                    placeholder="e.g. UPI-2026-001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Guardian Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 7..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Choose Password (Min 6 chars) *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Create & Activate Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
