import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Database, 
  LogIn, 
  LogOut, 
  User as UserIcon,
  CheckCircle2,
  Cloud,
  Mail,
  GraduationCap
} from 'lucide-react';
import { UserRole } from '../types';
import { SchoolEmblem } from './SchoolEmblem';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenEnroll: () => void;
  onOpenBackup: () => void;
  onOpenAuth: (role?: UserRole) => void;
  onOpenAccount: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenEnroll,
  onOpenBackup,
  onOpenAuth,
  onOpenAccount
}) => {
  const { currentUser, logout, canAccessSchoolData } = useAuth();

  const getPortalTitle = (role?: UserRole) => {
    switch (role) {
      case 'admin': return 'Admin Portal';
      case 'teacher': return 'Teachers Portal';
      case 'parent': return 'Parents Portal';
      default: return 'CBC Unified Gateway';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Brand element */}
          <button
            onClick={() => {
              if (currentUser?.role === 'teacher') setActiveTab('teacher-portal');
              else if (currentUser?.role === 'parent') setActiveTab('parent-portal');
              else setActiveTab('dashboard');
            }}
            className="flex items-center gap-3 text-left shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded-lg p-1"
          >
            <SchoolEmblem size="sm" />
            <div className="flex flex-col">
              <span className="font-display font-bold text-base text-slate-900 tracking-tight leading-none group-hover:text-emerald-800 transition-colors whitespace-nowrap">
                West End Star Academy
              </span>
              <span className="text-[11px] font-semibold text-emerald-800 tracking-wider uppercase mt-0.5">
                {getPortalTitle(currentUser?.role)}
              </span>
            </div>
          </button>

          {/* Zone 2: Navigation links based strictly on active authenticated role */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600">
            {currentUser?.role === 'admin' ? (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-xs uppercase tracking-wider font-semibold ${
                    activeTab === 'dashboard'
                      ? 'border-emerald-700 text-emerald-900'
                      : 'border-transparent text-slate-600'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('learners')}
                  className={`hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-xs uppercase tracking-wider font-semibold ${
                    activeTab === 'learners'
                      ? 'border-emerald-700 text-emerald-900'
                      : 'border-transparent text-slate-600'
                  }`}
                >
                  Learners
                </button>
                <button
                  onClick={() => setActiveTab('assessments')}
                  className={`hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-xs uppercase tracking-wider font-semibold ${
                    activeTab === 'assessments'
                      ? 'border-emerald-700 text-emerald-900'
                      : 'border-transparent text-slate-600'
                  }`}
                >
                  CBC Assessments
                </button>
                <button
                  onClick={() => setActiveTab('bursary')}
                  className={`hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-xs uppercase tracking-wider font-semibold ${
                    activeTab === 'bursary'
                      ? 'border-emerald-700 text-emerald-900'
                      : 'border-transparent text-slate-600'
                  }`}
                >
                  Bursary & M-Pesa
                </button>
                <button
                  onClick={() => setActiveTab('staff')}
                  className={`hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-xs uppercase tracking-wider font-semibold ${
                    activeTab === 'staff'
                      ? 'border-emerald-700 text-emerald-900'
                      : 'border-transparent text-slate-600'
                  }`}
                >
                  Faculty & TSC
                </button>
                <button
                  onClick={() => setActiveTab('notices')}
                  className={`hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-xs uppercase tracking-wider font-semibold ${
                    activeTab === 'notices'
                      ? 'border-emerald-700 text-emerald-900'
                      : 'border-transparent text-slate-600'
                  }`}
                >
                  KNEC Circulars
                </button>
                <button
                  onClick={() => setActiveTab('drive')}
                  className={`hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 ${
                    activeTab === 'drive'
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-600'
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5 text-blue-600" />
                  <span>Google Drive</span>
                </button>
                <button
                  onClick={() => setActiveTab('gmail')}
                  className={`hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 ${
                    activeTab === 'gmail'
                      ? 'border-red-600 text-red-700'
                      : 'border-transparent text-slate-600'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-red-600" />
                  <span>Gmail</span>
                </button>
                <button
                  onClick={() => setActiveTab('classroom')}
                  className={`hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 ${
                    activeTab === 'classroom'
                      ? 'border-amber-600 text-amber-700'
                      : 'border-transparent text-slate-600'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Classroom</span>
                </button>
              </>
            ) : currentUser?.role === 'teacher' ? (
              <>
                <button
                  onClick={() => setActiveTab('teacher-portal')}
                  className={`hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-xs uppercase tracking-wider font-semibold ${
                    activeTab === 'teacher-portal'
                      ? 'border-emerald-700 text-emerald-900'
                      : 'border-transparent text-slate-600'
                  }`}
                >
                  My CBC Class & Marks
                </button>
                <button
                  onClick={() => setActiveTab('assessments')}
                  className={`hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-xs uppercase tracking-wider font-semibold ${
                    activeTab === 'assessments'
                      ? 'border-emerald-700 text-emerald-900'
                      : 'border-transparent text-slate-600'
                  }`}
                >
                  Assessment Register
                </button>
                <button
                  onClick={() => setActiveTab('learners')}
                  className={`hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-xs uppercase tracking-wider font-semibold ${
                    activeTab === 'learners'
                      ? 'border-emerald-700 text-emerald-900'
                      : 'border-transparent text-slate-600'
                  }`}
                >
                  Learner Profiles
                </button>
                <button
                  onClick={() => setActiveTab('notices')}
                  className={`hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-xs uppercase tracking-wider font-semibold ${
                    activeTab === 'notices'
                      ? 'border-emerald-700 text-emerald-900'
                      : 'border-transparent text-slate-600'
                  }`}
                >
                  KNEC Directives
                </button>
                <button
                  onClick={() => setActiveTab('drive')}
                  className={`hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 ${
                    activeTab === 'drive'
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-600'
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5 text-blue-600" />
                  <span>Google Drive</span>
                </button>
                <button
                  onClick={() => setActiveTab('classroom')}
                  className={`hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 ${
                    activeTab === 'classroom'
                      ? 'border-amber-600 text-amber-700'
                      : 'border-transparent text-slate-600'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Classroom</span>
                </button>
                <button
                  onClick={() => setActiveTab('gmail')}
                  className={`hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 ${
                    activeTab === 'gmail'
                      ? 'border-red-600 text-red-700'
                      : 'border-transparent text-slate-600'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-red-600" />
                  <span>Gmail</span>
                </button>
              </>
            ) : currentUser?.role === 'parent' ? (
              <>
                <button
                  onClick={() => setActiveTab('parent-portal')}
                  className={`hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-xs uppercase tracking-wider font-semibold ${
                    activeTab === 'parent-portal'
                      ? 'border-emerald-700 text-emerald-900'
                      : 'border-transparent text-slate-600'
                  }`}
                >
                  Bursary & M-Pesa Details
                </button>
                <button
                  onClick={() => setActiveTab('notices')}
                  className={`hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-xs uppercase tracking-wider font-semibold ${
                    activeTab === 'notices'
                      ? 'border-emerald-700 text-emerald-900'
                      : 'border-transparent text-slate-600'
                  }`}
                >
                  School Circulars
                </button>
                <button
                  onClick={() => setActiveTab('drive')}
                  className={`hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 ${
                    activeTab === 'drive'
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-600'
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5 text-blue-600" />
                  <span>Google Drive</span>
                </button>
              </>
            ) : (
              <span className="text-xs text-slate-400 font-medium">
                Official Kenya CBC Gateway · Sign in with linked account to enter
              </span>
            )}
          </nav>

          {/* Zone 3: 1 primary action cluster */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Authenticated user profile button */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAccount}
                  title="Manage Account Profile"
                  className="flex items-center gap-2 py-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-emerald-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block pr-1">
                    <div className="flex items-center gap-1.5">
                      <span className="block text-[11px] font-bold text-slate-900 leading-none truncate max-w-[120px]">
                        {currentUser.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 capitalize">
                      {currentUser.role} Portal
                    </span>
                  </div>
                </button>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onOpenAuth()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg transition-colors shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In / Sign Up</span>
              </button>
            )}

            {/* Google Drive CBC Cloud Button */}
            {currentUser && (
              <button
                onClick={() => setActiveTab('drive')}
                title="Google Drive CBC Cloud Repository"
                className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'drive'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100'
                }`}
              >
                <Cloud className="w-4 h-4" />
                <span className="hidden lg:inline text-xs font-semibold">Drive</span>
              </button>
            )}

            {/* Quick backup button - strictly restricted to the 2 authorized Primary Admins */}
            {canAccessSchoolData && (
              <button
                onClick={onOpenBackup}
                title="School Data & JSON Portability (Admin Access Only)"
                className="p-2 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Database className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile navigation tab strip strictly for authenticated role */}
      {currentUser && (
        <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 bg-slate-100/90 border-t border-slate-200 text-xs gap-3">
          {currentUser.role === 'admin' ? (
            [
              { id: 'dashboard', label: 'Overview' },
              { id: 'learners', label: 'Learners' },
              { id: 'assessments', label: 'Assessments' },
              { id: 'bursary', label: 'Bursary' },
              { id: 'staff', label: 'Faculty' },
              { id: 'notices', label: 'Circulars' },
              { id: 'drive', label: 'Google Drive' },
              { id: 'gmail', label: 'Gmail' },
              { id: 'classroom', label: 'Classroom' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition-colors ${
                  activeTab === item.id ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))
          ) : currentUser.role === 'teacher' ? (
            [
              { id: 'teacher-portal', label: 'My Class' },
              { id: 'assessments', label: 'Assessments' },
              { id: 'learners', label: 'Learners' },
              { id: 'notices', label: 'KNEC Directives' },
              { id: 'drive', label: 'Google Drive' },
              { id: 'classroom', label: 'Classroom' },
              { id: 'gmail', label: 'Gmail' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition-colors ${
                  activeTab === item.id ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))
          ) : (
            [
              { id: 'parent-portal', label: 'Bursary & M-Pesa' },
              { id: 'notices', label: 'Circulars' },
              { id: 'drive', label: 'Google Drive' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition-colors ${
                  activeTab === item.id ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))
          )}
        </div>
      )}
    </header>
  );
};
