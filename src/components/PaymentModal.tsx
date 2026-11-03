import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { X, CreditCard, Smartphone, CheckCircle } from 'lucide-react';
import { Student } from '../types';

interface PaymentModalProps {
  initialStudent?: Student | null;
  onClose: () => void;
  onReceiptGenerated: (txId: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  initialStudent,
  onClose,
  onReceiptGenerated
}) => {
  const { students, addTransaction } = useSchool();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudent?.id || students[0]?.id || ''
  );

  const student = students.find(s => s.id === selectedStudentId);

  const [amount, setAmount] = useState<number | ''>(student?.feeBalance || '');
  const [paymentMethod, setPaymentMethod] = useState('M-Pesa');
  const [mpesaRef, setMpesaRef] = useState('');
  const [feeType, setFeeType] = useState('Tuition Term 3');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !amount || Number(amount) <= 0) return;

    const tx = addTransaction({
      studentId: student.id,
      studentName: student.fullName,
      regNo: student.regNo,
      nemisUpi: student.nemisUpi,
      grade: student.grade,
      amount: Number(amount),
      paymentMethod,
      mpesaRef: paymentMethod.includes('M-Pesa') ? mpesaRef.trim() : undefined,
      feeType,
      term: 'Term 3',
      academicYear: '2025/2026',
      notes: notes.trim(),
      receivedBy: ''
    });

    onClose();
    onReceiptGenerated(tx.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-slate-900">
                Record Fee Payment (M-Pesa)
              </h2>
              <p className="text-xs text-slate-500">
                Official West End Star Academy Bursary Settlement
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Enrolled Learner</label>
            {students.length > 0 ? (
              <select
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  const st = students.find(s => s.id === e.target.value);
                  if (st && st.feeBalance > 0) {
                    setAmount(st.feeBalance);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.grade}) — Balance: KES {s.feeBalance.toLocaleString()}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                No learners enrolled in the school register yet. Please enroll a learner first to record school fee payments and generate M-Pesa receipts.
              </div>
            )}
          </div>

          {student && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Current Outstanding Balance</span>
                <span className="font-mono text-base font-bold text-slate-900">
                  KES {student.feeBalance.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">NEMIS UPI</span>
                <span className="font-mono font-medium text-slate-800">{student.nemisUpi}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Amount (KES) *</label>
              <input
                type="number"
                required
                min="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-emerald-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Channel</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="M-Pesa">M-Pesa</option>
                <option value="Bank Deposit / Transfer">Bank Deposit / KCB / Equity</option>
                <option value="Cash / Bursary Cheque">Cash / Bursary Cheque</option>
              </select>
            </div>
          </div>

          {paymentMethod.includes('M-Pesa') && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Safaricom M-Pesa Reference Code *
              </label>
              <input
                type="text"
                required
                value={mpesaRef}
                onChange={(e) => setMpesaRef(e.target.value.toUpperCase())}
                placeholder="e.g. QJ68X785K"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold uppercase text-emerald-800"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Fee Description / Item</label>
            <input
              type="text"
              value={feeType}
              onChange={(e) => setFeeType(e.target.value)}
              placeholder="e.g. Tuition Term 3 or Activity / Assessment Fee"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Official Notes / Remarks</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg shadow-xs"
            >
              Validate & Generate Receipt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
