import React from 'react';
import { useSchool } from '../context/SchoolContext';
import { Printer, X, CheckCircle, ShieldCheck } from 'lucide-react';

import { SchoolEmblem } from './SchoolEmblem';

interface ReceiptModalProps {
  transactionId: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transactionId,
  onClose
}) => {
  const { transactions, academy } = useSchool();
  const tx = transactions.find(t => t.id === transactionId);

  if (!tx) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Floating Tool Controls - Hidden in print */}
        <div className="no-print bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-emerald-400">Official Bursary Voucher</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{tx.receiptNo}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Receipt Body */}
        <div className="p-8 bg-white text-slate-900 space-y-5 print:p-0">
          {/* Header */}
          <div className="text-center border-b-2 border-emerald-950 pb-4">
            <div className="flex items-center justify-center gap-3 mb-1">
              <SchoolEmblem size="md" />
              <div className="text-left">
                <h1 className="text-lg font-display font-black text-emerald-950 uppercase tracking-tight">
                  {academy}
                </h1>
                <p className="text-[11px] text-slate-600">
                  P.O. Box 48291-00100 Nairobi · Bursary Dept: +254 722 889 900
                </p>
              </div>
            </div>

            <div className="mt-2 inline-block px-3 py-0.5 bg-emerald-950 text-white font-bold text-xs uppercase tracking-wider rounded-xs">
              Official Fees Receipt Voucher
            </div>
          </div>

          {/* Receipt Meta */}
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
            <div>
              <span className="text-slate-500 text-[11px] block">Receipt Number</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{tx.receiptNo}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[11px] block">Date Issued</span>
              <span className="font-medium text-slate-900">{tx.date}</span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-baseline justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Received From (Learner):</span>
              <span className="font-bold text-slate-900 text-right">{tx.studentName}</span>
            </div>

            {tx.nemisUpi ? (
              <div className="flex items-baseline justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">NEMIS UPI:</span>
                <span className="font-mono font-semibold text-slate-900 text-right">{tx.nemisUpi}</span>
              </div>
            ) : null}

            <div className="flex items-baseline justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Academic Grade & Term:</span>
              <span className="font-medium text-slate-900 text-right">{tx.grade} · {tx.term}</span>
            </div>

            <div className="flex items-baseline justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Fee Particulars:</span>
              <span className="font-medium text-slate-900 text-right">{tx.feeType}</span>
            </div>

            <div className="flex items-baseline justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Payment Channel:</span>
              <span className="font-medium text-slate-900 text-right">{tx.paymentMethod}</span>
            </div>

            {tx.mpesaRef && (
              <div className="flex items-baseline justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">M-Pesa Reference Code:</span>
                <span className="font-mono font-bold text-emerald-800 text-right">{tx.mpesaRef}</span>
              </div>
            )}
          </div>

          {/* Amount Box */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-900 uppercase block tracking-wider">
                Amount Paid
              </span>
              <div className="font-mono text-2xl font-black text-emerald-950 tabular-nums">
                KES {tx.amount.toLocaleString()}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Balance Remaining</span>
              <span className="font-mono font-bold text-slate-800 text-sm tabular-nums">
                KES {tx.balanceRemaining.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Stamped Seal & Signature */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Received & Authorized By:</span>
              <span className="font-bold text-slate-900">{tx.receivedBy}</span>
              <div className="text-[11px] text-slate-500 mt-0.5">Bursar & Finance Office</div>
            </div>

            {/* Stamp */}
            <div className="border-2 border-emerald-900 text-emerald-950 p-2 rounded text-center font-bold text-[9px] uppercase tracking-wider transform rotate-2">
              WEST END STAR ACADEMY<br />
              ★ BURSARY PAID & VALIDATED ★<br />
              {tx.date}
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-2">
            This receipt is an official computer-generated document under the financial policies of West End Star Academy.
          </div>
        </div>
      </div>
    </div>
  );
};
