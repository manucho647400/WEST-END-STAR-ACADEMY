import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import { 
  CreditCard, 
  Search, 
  PlusCircle, 
  Printer, 
  CheckCircle, 
  Clock, 
  ReceiptText, 
  FileCheck,
  Building,
  Smartphone,
  Info
} from 'lucide-react';
import { Transaction, Student } from '../types';

interface BursarModuleProps {
  onOpenReceipt: (txId: string) => void;
  onOpenPaymentModal: (student?: Student) => void;
}

export const BursarModule: React.FC<BursarModuleProps> = ({
  onOpenReceipt,
  onOpenPaymentModal
}) => {
  const { transactions, students } = useSchool();
  const { currentUser } = useAuth();

  if (currentUser?.role === 'teacher') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto my-8 shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto border border-amber-200">
          <Info className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-display font-bold text-slate-900">
            Access Restricted to Bursary & Administration
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Classroom teachers and facilitators do not handle bursaries, fees, or M-Pesa collections. Please use the Teachers Portal for CBC assessments, SBA score entry, and learning area evaluations.
          </p>
        </div>
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('All');

  const totalBilled = students.reduce((acc, s) => acc + (s.totalFees || 0), 0);
  const totalCollected = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalArrears = students.reduce((acc, s) => acc + (s.feeBalance || 0), 0);
  const collectionPct = totalBilled > 0 ? Math.min(100, Math.round((totalCollected / totalBilled) * 100)) : 100;

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.receiptNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.mpesaRef && t.mpesaRef.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.regNo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMethod = selectedMethod === 'All' || t.paymentMethod.includes(selectedMethod);
    return matchesSearch && matchesMethod;
  });

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            Bursary & Fee Collections
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconciliation register for Term 3 CBC School Fees & fee settlements
          </p>
        </div>

        <button
          onClick={() => onOpenPaymentModal()}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Total Invoiced</span>
          <div className="font-mono text-xl font-bold text-slate-900 tabular-nums">
            KES {totalBilled.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active Term 3 Billing</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">M-Pesa Realized</span>
          <div className="font-mono text-xl font-bold text-emerald-800 tabular-nums">
            KES {totalCollected.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">{collectionPct}% clearance</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Outstanding Arrears</span>
          <div className="font-mono text-xl font-bold text-amber-800 tabular-nums">
            KES {totalArrears.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Unpaid balances</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Settlement Receipts</span>
          <div className="font-mono text-xl font-bold text-slate-900 tabular-nums">
            {transactions.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Numbered official vouchers</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student, receipt number, or M-Pesa reference (e.g. QJ68X785K)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            aria-label="Filter transactions by payment method"
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <option value="All">All Payment Channels</option>
            <option value="M-Pesa">M-Pesa</option>
            <option value="Bank">Bank Deposit / Transfer</option>
            <option value="Cash">Cash / Bursary</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Learner & Grade</th>
                <th className="py-3 px-4">Fee Item</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4 text-right">Amount (KES)</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{tx.receiptNo}</td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{tx.date}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{tx.studentName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{tx.grade}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{tx.feeType}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{tx.paymentMethod}</div>
                    {tx.mpesaRef && (
                      <div className="font-mono text-[11px] text-emerald-800 font-semibold">
                        Ref: {tx.mpesaRef}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-right text-emerald-900 tabular-nums">
                    KES {tx.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-right text-slate-600 tabular-nums">
                    KES {tx.balanceRemaining.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onOpenReceipt(tx.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 rounded border border-emerald-300 transition-colors"
                    >
                      <ReceiptText className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500">
            No transactions match the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};
