import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  ReceiptText, 
  AlertCircle, 
  Building, 
  Search, 
  ShieldCheck, 
  FileCheck2, 
  ArrowUpRight, 
  HelpCircle,
  Clock,
  Lock,
  ChevronDown
} from 'lucide-react';
import { Student, Transaction, UserRole } from '../types';

interface ParentPortalProps {
  onOpenReportCard?: (studentId: string) => void;
  onOpenReceipt: (txId: string) => void;
  onOpenPayment: (student: Student) => void;
  onOpenAuth?: (role?: UserRole) => void;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({
  onOpenReceipt,
  onOpenPayment,
  onOpenAuth
}) => {
  const { currentUser } = useAuth();
  const { students, transactions } = useSchool();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [upiSearch, setUpiSearch] = useState('');

  // Authentication check for Parent / Guardian
  if (currentUser?.role !== 'parent') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto my-8 shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-200">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-display font-bold text-slate-900">
            Parents & Guardians Authentication Required
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Please log in with your verified guardian email or Google Account to securely view your learner's official Bursary allocations and M-Pesa fee statements.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => onOpenAuth?.('parent')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sign In / Verify as Guardian</span>
          </button>
        </div>
      </div>
    );
  }

  // Find students linked to this parent (or all students if none matched, or search filter)
  const linkedStudents = students.filter(s => 
    s.id === currentUser?.studentId ||
    s.regNo === currentUser?.studentRegNo ||
    (s.guardianEmail && currentUser?.email && s.guardianEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
    (currentUser?.studentId && s.id === currentUser.studentId)
  );

  // Available students to display
  const effectiveStudentsList = linkedStudents.length > 0 ? linkedStudents : students;

  // Active student
  const activeStudent = 
    effectiveStudentsList.find(s => s.id === selectedStudentId) ||
    (upiSearch.trim() ? students.find(s => 
      s.nemisUpi.toLowerCase().includes(upiSearch.toLowerCase()) ||
      s.regNo.toLowerCase().includes(upiSearch.toLowerCase()) ||
      s.fullName.toLowerCase().includes(upiSearch.toLowerCase())
    ) : null) ||
    effectiveStudentsList[0];

  const studentTransactions = activeStudent 
    ? transactions.filter(t => t.studentId === activeStudent.id || t.regNo === activeStudent.regNo)
    : [];

  // Bursary calculations
  const totalBilled = activeStudent?.totalFees || 0;
  const bursaryAmount = activeStudent?.bursaryAmount ?? (
    activeStudent?.scholarshipPct 
      ? Math.round((totalBilled * activeStudent.scholarshipPct) / 100) 
      : 0
  );
  const bursarySource = activeStudent?.bursarySource || (
    activeStudent?.scholarshipPct ? 'Ministry of Education Capitation & Need-Based Grant' : 'National CDF / County Bursary Scheme'
  );
  const bursaryStatus = activeStudent?.bursaryStatus || (bursaryAmount > 0 ? 'Disbursed' : 'None');
  const bursaryRefNo = activeStudent?.bursaryRefNo || (bursaryAmount > 0 ? `BUR-${activeStudent?.nemisUpi?.replace(/[^a-zA-Z0-9]/g, '') || activeStudent?.id || '2026'}-KE` : 'N/A');

  const totalPaid = activeStudent?.paidFees || 0;
  const netBalance = Math.max(0, totalBilled - bursaryAmount - totalPaid);

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500 shadow-xs max-w-xl mx-auto my-8">
        <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold text-slate-900">No Enrolled Learners or Transactions Yet</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
          The school fee ledger is currently clean. Once a learner is enrolled and fee assessments or bursary allocations are issued, their official Bursary grant status and fee receipts will be displayed here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner - Strictly Bursary & M-Pesa Details */}
      <div className="bg-emerald-950 text-white rounded-2xl p-6 sm:p-7 shadow-xs border border-emerald-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-800/80 text-emerald-200 text-[11px] font-semibold rounded-full uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Parents Portal · Bursary & M-Pesa Statement View</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white">
            Bursary & M-Pesa Financial Ledger
          </h1>
          <p className="text-xs text-emerald-200/80 max-w-xl">
            Real-time reconciliation of official government bursary grants, CDF allocations, and Safaricom M-Pesa fee settlements for your learner.
          </p>
        </div>

        {/* Student Selector / Search */}
        <div className="bg-emerald-900/90 p-3 rounded-xl border border-emerald-800 text-xs w-full md:w-auto shrink-0 space-y-2">
          <span className="text-[11px] font-semibold text-emerald-300 block">Select Enrolled Learner:</span>
          <div className="relative">
            <select
              value={activeStudent?.id || ''}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-emerald-950 text-white border border-emerald-700 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} - {s.grade}
                </option>
              ))}
            </select>
          </div>
          <div className="text-[10px] text-emerald-400">
            NEMIS UPI: <span className="font-mono text-emerald-200">{activeStudent?.nemisUpi || 'Pending'}</span>
          </div>
        </div>
      </div>

      {activeStudent && (
        <>
          {/* Learner Identity & Verification Badge Strip */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-900 border border-slate-200 shrink-0 flex items-center justify-center font-bold text-sm font-mono shadow-inner">
                {activeStudent.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{activeStudent.fullName}</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {activeStudent.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>Class: <strong>{activeStudent.grade} ({activeStudent.section})</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>NEMIS UPI: <strong className="font-mono">{activeStudent.nemisUpi}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>House: <strong>{activeStudent.house}</strong></span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenPayment(activeStudent)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs shrink-0 self-stretch sm:self-auto justify-center"
            >
              <Smartphone className="w-4 h-4" />
              <span>Make M-Pesa Payment</span>
            </button>
          </div>

          {/* Core Financial KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 block text-[11px] font-medium">Term 3 Invoiced Fees</span>
              <div className="font-mono text-xl font-bold text-slate-900 mt-1">
                KES {totalBilled.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Full term CBC tuition assessment</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-emerald-800 block text-[11px] font-semibold">Bursary / Grant Credited</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-200 text-emerald-900 uppercase">
                  {bursaryStatus}
                </span>
              </div>
              <div className="font-mono text-xl font-bold text-emerald-900 mt-1">
                KES {bursaryAmount.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-700 mt-1 block truncate">
                {bursarySource}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 block text-[11px] font-medium">Total Paid via M-Pesa</span>
              <div className="font-mono text-xl font-bold text-slate-800 mt-1">
                KES {totalPaid.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {studentTransactions.length} verified voucher receipts
              </span>
            </div>

            <div className={`p-4 rounded-xl border shadow-xs ${netBalance === 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'}`}>
              <div className="flex items-center justify-between">
                <span className={`block text-[11px] font-semibold ${netBalance === 0 ? 'text-emerald-900' : 'text-amber-900'}`}>
                  Outstanding Balance
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${netBalance === 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-950'}`}>
                  {netBalance === 0 ? 'Fully Cleared' : 'Arrears'}
                </span>
              </div>
              <div className={`font-mono text-xl font-bold mt-1 ${netBalance === 0 ? 'text-emerald-800' : 'text-amber-900'}`}>
                KES {netBalance.toLocaleString()}
              </div>
              <span className={`text-[11px] mt-1 block ${netBalance === 0 ? 'text-emerald-700' : 'text-amber-800'}`}>
                {netBalance === 0 ? 'Account settled for Term 3' : 'Fee balance due'}
              </span>
            </div>
          </div>

          {/* Detailed Bursary Allocation */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-800" />
                <h3 className="text-sm font-display font-bold text-slate-900">
                  Official Bursary & Capitation Details
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-mono text-[10px] font-bold">
                {bursaryRefNo}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500">Bursary Scheme / Category:</span>
                <span className="font-semibold text-slate-900 text-right">{bursarySource}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500">Government Bursary / Capitation Amount:</span>
                <span className="font-mono font-bold text-emerald-800 text-sm">
                  KES {bursaryAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500">Bursary Disbursement Status:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{bursaryStatus === 'Disbursed' ? 'Directly Credited to School Tuition' : bursaryStatus}</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500">NEMIS Ministry Verification:</span>
                <span className="font-mono font-semibold text-slate-800">{activeStudent.nemisUpi} (Verified)</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-[11px] text-emerald-900 space-y-1">
              <div className="font-semibold">Bursary & Capitation Compliance Notice:</div>
              <p className="text-emerald-800 leading-relaxed">
                National Government CDF Bursaries, County Executive allocations, and Ministry capitation credits are reconciled directly by the Bursar's Office against the student's NEMIS profile. Keep your bursary award letter or voucher reference for end-of-term audit clearance.
              </p>
            </div>
          </div>

          {/* Transaction Receipts & History Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-display font-bold text-slate-900">
                  Receipts & Settlement Records
                </h3>
                <p className="text-xs text-slate-500">
                  Official numbered receipts for fee payments and bursary disbursements
                </p>
              </div>

              <span className="text-xs text-slate-500 font-mono">
                Showing {studentTransactions.length} transaction(s)
              </span>
            </div>

            {studentTransactions.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {studentTransactions.map(tx => (
                  <div key={tx.id} className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{tx.receiptNo}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {tx.feeType}
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-emerald-800">
                          {tx.mpesaRef ? `M-Pesa: ${tx.mpesaRef}` : tx.paymentMethod}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3">
                        <span>Date: {tx.date}</span>
                        <span aria-hidden="true">·</span>
                        <span>Term: {tx.term} {tx.academicYear}</span>
                        <span aria-hidden="true">·</span>
                        <span>Received By: {tx.receivedBy}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          KES {tx.amount.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Bal after: KES {tx.balanceRemaining.toLocaleString()}
                        </div>
                      </div>

                      <button
                        onClick={() => onOpenReceipt(tx.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 rounded-lg border border-emerald-300 transition-colors"
                      >
                        <ReceiptText className="w-3.5 h-3.5" />
                        <span>View / Print Receipt</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <ReceiptText className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="font-semibold text-slate-600">No payment receipts issued yet for this learner</div>
                <p className="max-w-xs mx-auto text-slate-400 text-[11px]">
                  When you settle fees, the transaction verification voucher will appear here with printable receipts.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => onOpenPayment(activeStudent)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-medium hover:bg-emerald-900 transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
