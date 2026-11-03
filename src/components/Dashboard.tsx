import React from 'react';
import { useSchool } from '../context/SchoolContext';
import { 
  Users, 
  Award, 
  ReceiptText, 
  UserCheck, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  Sparkles,
  AlertCircle,
  PlusCircle,
  CreditCard,
  UserPlus,
  BookOpen
} from 'lucide-react';
import { Student } from '../types';
import { SchoolEmblem } from './SchoolEmblem';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  onOpenReportCard: (studentId: string) => void;
  onOpenReceipt: (txId: string) => void;
  onOpenEnroll: () => void;
  onOpenPayment: (student?: Student) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenReportCard,
  onOpenReceipt,
  onOpenEnroll,
  onOpenPayment
}) => {
  const { academy, curriculum, students, staff, transactions, reportCards, notices } = useSchool();

  const totalLearners = students.length;
  const reportsList = Object.values(reportCards);
  const averageAcademicScore = reportsList.length > 0
    ? Math.round(reportsList.reduce((acc, r) => acc + (r.averageScore || 0), 0) / reportsList.length)
    : 85;
  
  const totalBilled = students.reduce((acc, s) => acc + (s.totalFees || 0), 0);
  const totalPaid = students.reduce((acc, s) => acc + (s.paidFees || 0), 0);
  const totalBalance = students.reduce((acc, s) => acc + (s.feeBalance || 0), 0);
  const collectionRate = totalBilled > 0 ? Math.min(100, Math.round((totalPaid / totalBilled) * 100)) : 0;

  const activeFacilitators = staff.filter(st => st.status === 'Active').length;

  const starLearner = students[0];
  const starReport = starLearner ? reportCards[starLearner.id] : null;

  const urgentNotice = notices.find(n => n.priority === 'Urgent') || notices[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Executive Clean Administrative Hero Banner - Pure CSS & SVG, No Raster Images */}
      <div className="relative rounded-2xl overflow-hidden shadow-xs border border-emerald-900 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 p-6 sm:p-8 text-white">
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <SchoolEmblem size="lg" />
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-emerald-300">
                  <span>{curriculum}</span>
                  <span aria-hidden="true">·</span>
                  <span>Republic of Kenya</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-white mt-0.5">
                  {academy}
                </h1>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/15 rounded-lg text-xs text-emerald-200 self-start sm:self-auto backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Academic Register · Term 3 Cycle</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl font-light leading-relaxed">
            Nurturing Competencies, Inspiring Excellence. Comprehensive school administration for CBC early years, primary, and junior school (JSS) learners with KNEC assessment alignment.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenEnroll}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Admit New Learner</span>
            </button>
            <button
              onClick={() => onOpenPayment()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white/15 hover:bg-white/25 text-white backdrop-blur-xs transition-colors border border-white/20"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record M-Pesa Payment</span>
            </button>
            <button
              onClick={() => onNavigate('assessments')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white/15 hover:bg-white/25 text-white backdrop-blur-xs transition-colors border border-white/20"
            >
              <Award className="w-4 h-4" />
              <span>CBC Assessment Register</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Enrolled Learners</span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-slate-900">{totalLearners}</span>
            <span className="text-xs text-slate-500 font-medium">Active registrations</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span>Reception through Grade 9 (KJSEA)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Academic Mean Score</span>
            <Award className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-slate-900">{averageAcademicScore}%</span>
            <span className="text-xs text-emerald-700 font-medium">School Average</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span>Term 1, Term 2 & End Term Exams</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Fee Collections</span>
            <ReceiptText className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-slate-900">{collectionRate}%</span>
            <span className="text-xs text-emerald-700 font-medium font-mono">KES {totalPaid.toLocaleString()}</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span>Arrears: KES {totalBalance.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>TSC Facilitators</span>
            <UserCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-slate-900">{activeFacilitators}</span>
            <span className="text-xs text-slate-500 font-medium">Registered staff</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span>Facilitators across departments</span>
          </div>
        </div>
      </div>

      {/* Urgent Notice Banner if available */}
      {urgentNotice && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 uppercase tracking-wide">
                <span>{urgentNotice.category}</span>
                <span aria-hidden="true">·</span>
                <span>{urgentNotice.date}</span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 mt-0.5">{urgentNotice.title}</h2>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{urgentNotice.content}</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('notices')}
            className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-amber-300 text-amber-900 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0"
          >
            Read KNEC Circular
          </button>
        </div>
      )}

      {/* Two-Column Core Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 spans): CBC Learner Spotlight & Academic Performance */}
        <div className="lg:col-span-2 space-y-6">
          {/* Spotlight Card when student exists */}
          {starLearner && starReport ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Featured CBC Exemplary Learner</span>
                  </div>
                  <h2 className="text-lg font-display font-bold text-slate-900 mt-1">
                    {starLearner.fullName}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>NEMIS UPI: {starLearner.nemisUpi}</span>
                    <span aria-hidden="true">·</span>
                    <span>{starLearner.grade}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs font-bold font-mono">
                    <span>Mean Score: {starReport.averageScore}%</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                    Attendance: {starReport.attendancePct}%
                  </div>
                </div>
              </div>

              {/* Learning Areas Highlight */}
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                  Top Learning Areas (Terminal Exam Scores)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {starReport.learningAreas.slice(0, 4).map((area, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900">{area.learningArea}</span>
                        <span className="font-mono font-bold text-emerald-800">{area.totalScore}%</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span>{area.strandsCovered}</span>
                        <span className="font-medium text-slate-600">Mean: {area.totalScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-600">Core CBC Competencies Mastered:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5 text-xs text-slate-700">
                    {starReport.coreCompetencies.slice(0, 4).map((comp, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-[11px] text-slate-700">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {comp.name}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onOpenReportCard(starLearner.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Official Report Card</span>
                </button>
              </div>
            </div>
          ) : (
            /* Clean Empty State when no data has been entered */
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-200">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-slate-900">
                  School CBC Register is Clear & Ready for Live Admissions
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  All previous sample records have been purged. You can now enroll actual learners, register TSC faculty facilitators, issue official KNEC report cards, and record live M-Pesa fee receipts.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={onOpenEnroll}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg transition-colors shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Enroll First Learner</span>
                </button>
                <button
                  onClick={() => onNavigate('staff')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors border border-slate-200"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Add TSC Facilitator</span>
                </button>
                <button
                  onClick={() => onNavigate('notices')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors border border-slate-200"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Publish School Circular</span>
                </button>
              </div>
            </div>
          )}

          {/* Enrolled Learners Directory */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-display font-bold text-slate-900">Enrolled Learners Directory</h2>
                <p className="text-xs text-slate-500">Registered under Kenya NEMIS & CBC Curriculum</p>
              </div>
              {students.length > 0 && (
                <button
                  onClick={() => onNavigate('learners')}
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                >
                  <span>View All Learners</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {students.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {students.map(student => (
                  <div key={student.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/70 px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                        {student.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{student.fullName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span>{student.grade}</span>
                          {student.nemisUpi && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono text-slate-500">UPI: {student.nemisUpi}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-semibold text-slate-800">
                          {student.feeBalance > 0 ? `KES ${student.feeBalance.toLocaleString()}` : 'Cleared'}
                        </div>
                        <div className="text-[11px] text-slate-400">Balance</div>
                      </div>

                      <button
                        onClick={() => onOpenReportCard(student.id)}
                        className="p-2 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="View CBC Report Card"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                No learners enrolled in the directory yet. Click "Admit New Learner" above to add your first student.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Stats & Recent Transactions */}
        <div className="space-y-6">
          {/* Quick Bursar Collections Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-display font-bold text-slate-900">M-Pesa Receipts</h2>
              <button
                onClick={() => onNavigate('bursary')}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
              >
                <span>Full Ledger</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.slice(0, 4).map(tx => (
                  <div key={tx.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">{tx.studentName}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {tx.mpesaRef} · {tx.date}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-800">
                        KES {tx.amount.toLocaleString()}
                      </div>
                      <button
                        onClick={() => onOpenReceipt(tx.id)}
                        className="text-[11px] text-slate-600 hover:text-emerald-800 underline mt-0.5"
                      >
                        Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                No transactions recorded yet. Record fee payments to generate stamped M-Pesa receipts.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
