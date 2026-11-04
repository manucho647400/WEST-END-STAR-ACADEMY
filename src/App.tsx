import React, { useState, useEffect } from 'react';
import { SchoolProvider } from './context/SchoolContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { LearnersModule } from './components/LearnersModule';
import { AssessmentsModule } from './components/AssessmentsModule';
import { BursarModule } from './components/BursarModule';
import { StaffModule } from './components/StaffModule';
import { NoticesModule } from './components/NoticesModule';
import { TeacherPortal } from './components/TeacherPortal';
import { ParentPortal } from './components/ParentPortal';
import { ReportCardModal } from './components/ReportCardModal';
import { ReceiptModal } from './components/ReceiptModal';
import { EnrollLearnerModal } from './components/EnrollLearnerModal';
import { PaymentModal } from './components/PaymentModal';
import { DataBackupModal } from './components/DataBackupModal';
import { AuthModal } from './components/AuthModal';
import { AccountModal } from './components/AccountModal';
import { GoogleDriveModule } from './components/GoogleDriveModule';
import { GmailModule } from './components/GmailModule';
import { ClassroomModule } from './components/ClassroomModule';
import { SchoolEmblem } from './components/SchoolEmblem';
import { Student, UserRole } from './types';
import { 
  ShieldCheck, 
  GraduationCap, 
  Users, 
  LogIn, 
  ArrowRight, 
  Lock, 
  CheckCircle2 
} from 'lucide-react';

function MainApp() {
  const { currentUser, canAccessSchoolData } = useAuth();

  const [activeTab, setActiveTab] = useState(() => {
    if (currentUser?.role === 'teacher') return 'teacher-portal';
    if (currentUser?.role === 'parent') return 'parent-portal';
    return 'dashboard';
  });

  const [activeReportStudentId, setActiveReportStudentId] = useState<string | null>(null);
  const [activeReceiptTxId, setActiveReceiptTxId] = useState<string | null>(null);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState<Student | null>(null);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [authRole, setAuthRole] = useState<UserRole>('admin');

  // Strictly sync tab when user logs in or switches role
  useEffect(() => {
    if (currentUser?.role === 'teacher') {
      if (activeTab === 'dashboard' || activeTab === 'bursary' || activeTab === 'parent-portal') {
        setActiveTab('teacher-portal');
      }
    } else if (currentUser?.role === 'parent') {
      if (activeTab === 'dashboard' || activeTab === 'teacher-portal' || activeTab === 'bursary' || activeTab === 'staff') {
        setActiveTab('parent-portal');
      }
    } else if (currentUser?.role === 'admin') {
      if (activeTab === 'teacher-portal' || activeTab === 'parent-portal') {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser?.role, activeTab]);

  const handleOpenPayment = (student?: Student) => {
    // Teachers do not handle fee collections
    if (currentUser?.role === 'teacher') return;
    setPaymentStudent(student || null);
    setIsPaymentOpen(true);
  };

  const handleEnrollSuccess = () => {
    setActiveTab('learners');
  };

  const handleOpenAuth = (role?: UserRole) => {
    if (role) setAuthRole(role);
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-800 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenEnroll={() => setIsEnrollOpen(true)}
        onOpenBackup={() => {
          if (canAccessSchoolData) setIsBackupOpen(true);
        }}
        onOpenAuth={handleOpenAuth}
        onOpenAccount={() => setIsAccountOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* If user is NOT logged in: Render Unified Authentication Gateway */}
        {!currentUser ? (
          <div className="max-w-4xl mx-auto py-8 sm:py-12 space-y-8">
            <div className="text-center space-y-3">
              <SchoolEmblem size="lg" className="mx-auto" />
              <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Republic of Kenya · Ministry of Education CBC Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
                West End Star Academy Gateway
              </h1>
              <p className="text-sm text-slate-600 max-w-xl mx-auto">
                Authenticate with your official credentials or linked account to enter your designated institutional portal.
              </p>
            </div>

            {/* Portal Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* Admin Gateway */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-emerald-700 transition-colors shadow-xs space-y-4">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Admin Portal</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Institutional governance, NEMIS KPSEA enrollment, bursary distribution, and financial operations.
                    </p>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700">✓</span>
                      <span>Full school roster & CBC enrollment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700">✓</span>
                      <span>M-Pesa & Bursary fee reconciliation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700">✓</span>
                      <span>KNEC circulars & academic notices</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleOpenAuth('admin')}
                    className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </button>
                </div>
              </div>

              {/* Teachers Gateway */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-emerald-700 transition-colors shadow-xs space-y-4">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Teachers Portal</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Classroom SBA marks entry, rubric scoring (EE/ME/AE/BE), and KPSEA/KJSEA performance tracking.
                    </p>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700">✓</span>
                      <span>Term 1, Term 2 & End Term exams grading</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700">✓</span>
                      <span>Learner competency evaluations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700">✓</span>
                      <span>Excludes fee & payment handling</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleOpenAuth('teacher')}
                    className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </button>
                </div>
              </div>

              {/* Parents Gateway */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-emerald-700 transition-colors shadow-xs space-y-4">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Parents Portal</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Exclusive guardian access to official Government/CDF Bursary allocations and M-Pesa fee statements.
                    </p>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700">✓</span>
                      <span>Verified Bursary grant allocations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700">✓</span>
                      <span>Real-time Safaricom M-Pesa ledger</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700">✓</span>
                      <span>Download official certified receipts</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleOpenAuth('parent')}
                    className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* User is authenticated: Render their role's authorized tabs */
          <>
            {currentUser.role === 'admin' && activeTab === 'dashboard' && (
              <Dashboard
                onNavigate={setActiveTab}
                onOpenReportCard={(id) => setActiveReportStudentId(id)}
                onOpenReceipt={(id) => setActiveReceiptTxId(id)}
                onOpenEnroll={() => setIsEnrollOpen(true)}
                onOpenPayment={handleOpenPayment}
              />
            )}

            {currentUser.role === 'teacher' && activeTab === 'teacher-portal' && (
              <TeacherPortal
                onOpenReportCard={(id) => setActiveReportStudentId(id)}
                onOpenAuth={handleOpenAuth}
              />
            )}

            {currentUser.role === 'parent' && activeTab === 'parent-portal' && (
              <ParentPortal
                onOpenReportCard={(id) => setActiveReportStudentId(id)}
                onOpenReceipt={(id) => setActiveReceiptTxId(id)}
                onOpenPayment={handleOpenPayment}
                onOpenAuth={handleOpenAuth}
              />
            )}

            {activeTab === 'learners' && (
              <LearnersModule
                onOpenReportCard={(id) => setActiveReportStudentId(id)}
                onOpenPayment={handleOpenPayment}
                onOpenEnroll={() => setIsEnrollOpen(true)}
              />
            )}

            {activeTab === 'assessments' && (
              <AssessmentsModule
                onOpenReportCardModal={(id) => setActiveReportStudentId(id)}
              />
            )}

            {currentUser.role === 'admin' && activeTab === 'bursary' && (
              <BursarModule
                onOpenReceipt={(id) => setActiveReceiptTxId(id)}
                onOpenPaymentModal={handleOpenPayment}
              />
            )}

            {currentUser.role === 'admin' && activeTab === 'staff' && (
              <StaffModule />
            )}

            {activeTab === 'notices' && (
              <NoticesModule />
            )}

            {activeTab === 'drive' && (
              <GoogleDriveModule />
            )}

            {activeTab === 'gmail' && (
              <GmailModule />
            )}

            {activeTab === 'classroom' && (
              <ClassroomModule />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">West End Star Academy</span>
            <span aria-hidden="true">·</span>
            <span>Competency Based Curriculum (CBC)</span>
            <span aria-hidden="true">·</span>
            <span>Republic of Kenya</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
            {currentUser ? (
              <button onClick={() => setIsAccountOpen(true)} className="hover:text-emerald-800 underline">
                Account Profile ({currentUser.name})
              </button>
            ) : (
              <button onClick={() => handleOpenAuth()} className="hover:text-emerald-800 underline">
                Sign In to Portal
              </button>
            )}
            {canAccessSchoolData && (
              <>
                <span aria-hidden="true">·</span>
                <button onClick={() => setIsBackupOpen(true)} className="hover:text-emerald-800 underline">
                  JSON Backup & Restore
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      {activeReportStudentId && (
        <ReportCardModal
          studentId={activeReportStudentId}
          onClose={() => setActiveReportStudentId(null)}
        />
      )}

      {activeReceiptTxId && (
        <ReceiptModal
          transactionId={activeReceiptTxId}
          onClose={() => setActiveReceiptTxId(null)}
        />
      )}

      {isEnrollOpen && (
        <EnrollLearnerModal
          onClose={() => setIsEnrollOpen(false)}
          onSuccess={handleEnrollSuccess}
        />
      )}

      {isPaymentOpen && (
        <PaymentModal
          initialStudent={paymentStudent}
          onClose={() => {
            setIsPaymentOpen(false);
            setPaymentStudent(null);
          }}
          onReceiptGenerated={(txId) => setActiveReceiptTxId(txId)}
        />
      )}

      {isBackupOpen && canAccessSchoolData && (
        <DataBackupModal
          onClose={() => setIsBackupOpen(false)}
        />
      )}

      {isAuthOpen && (
        <AuthModal
          isOpen={isAuthOpen}
          defaultRole={authRole}
          onClose={() => setIsAuthOpen(false)}
        />
      )}

      {isAccountOpen && (
        <AccountModal
          isOpen={isAccountOpen}
          onClose={() => setIsAccountOpen(false)}
          onOpenLogin={(role) => handleOpenAuth(role)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SchoolProvider>
        <MainApp />
      </SchoolProvider>
    </AuthProvider>
  );
}
