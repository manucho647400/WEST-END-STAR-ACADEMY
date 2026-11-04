import React, { useState } from 'react';
import { X, Save, UserCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Student } from '../types';
import { CBC_GRADES, CBC_HOUSES, CBC_SECTIONS } from '../data/initialData';
import { useSchool } from '../context/SchoolContext';

interface EditLearnerModalProps {
  student: Student;
  onClose: () => void;
  onSaved?: (updated: Student) => void;
}

export const EditLearnerModal: React.FC<EditLearnerModalProps> = ({
  student,
  onClose,
  onSaved
}) => {
  const { updateStudent } = useSchool();
  const [formData, setFormData] = useState({
    fullName: student.fullName || '',
    gender: student.gender || 'Male',
    dob: student.dob || '',
    birthCertNo: student.birthCertNo || '',
    nemisUpi: student.nemisUpi || '',
    grade: student.grade || CBC_GRADES[0],
    section: student.section || CBC_SECTIONS[0],
    house: student.house || CBC_HOUSES[0],
    guardianName: student.guardianName || '',
    guardianPhone: student.guardianPhone || '',
    guardianEmail: student.guardianEmail || '',
    address: student.address || '',
    status: student.status || 'Active',
    totalFees: student.totalFees ?? 0,
    paidFees: student.paidFees ?? 0,
    attendanceRate: student.attendanceRate ?? 95,
    healthNotes: student.healthNotes || ''
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const feeBalance = Math.max(0, Number(formData.totalFees) - Number(formData.paidFees));
    const updates: Partial<Student> = {
      ...formData,
      totalFees: Number(formData.totalFees),
      paidFees: Number(formData.paidFees),
      feeBalance,
      attendanceRate: Number(formData.attendanceRate)
    };

    updateStudent(student.id, updates);
    setSavedSuccess(true);
    if (onSaved) {
      onSaved({ ...student, ...updates });
    }
    setTimeout(() => {
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-900 text-emerald-300 rounded-lg border border-emerald-700/60">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-display font-bold text-white">
                  Edit Learner Profile
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-800 text-emerald-200 rounded border border-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Admin Authorized
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Update Ministry of Education NEMIS biodata, academic cohort, guardians & tuition fees
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-900/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="p-10 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Profile Updated Successfully</h3>
            <p className="text-xs text-slate-500">Learner information has been updated in school registry.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Section 1: Academic & Government Identifiers */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-3 pb-1 border-b border-slate-200">
                1. Academic Cohort & Government Identifiers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Learner Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NEMIS UPI
                  </label>
                  <input
                    type="text"
                    value={formData.nemisUpi}
                    onChange={(e) => handleChange('nemisUpi', e.target.value)}
                    placeholder="e.g. UPI-WES-2026-001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Grade / Academic Tier <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => handleChange('grade', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    {CBC_GRADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Class Section / Stream
                  </label>
                  <select
                    value={formData.section}
                    onChange={(e) => handleChange('section', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    {CBC_SECTIONS.map(s => (
                      <option key={s} value={s}>{s} Stream</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    School House
                  </label>
                  <select
                    value={formData.house}
                    onChange={(e) => handleChange('house', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    {CBC_HOUSES.map(h => (
                      <option key={h} value={h}>{h} House</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Enrollment Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="Active">Active</option>
                    <option value="Graduated">Graduated</option>
                    <option value="Transferred">Transferred</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Personal & Civil Biodata */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-3 pb-1 border-b border-slate-200">
                2. Personal & Civil Biodata
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleChange('dob', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Birth Certificate No
                  </label>
                  <input
                    type="text"
                    value={formData.birthCertNo}
                    onChange={(e) => handleChange('birthCertNo', e.target.value)}
                    placeholder="e.g. BCN-789012"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Guardian Details & Residence */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-3 pb-1 border-b border-slate-200">
                3. Guardian Details & Residence
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Primary Guardian Name
                  </label>
                  <input
                    type="text"
                    value={formData.guardianName}
                    onChange={(e) => handleChange('guardianName', e.target.value)}
                    placeholder="Guardian full name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Guardian Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.guardianPhone}
                    onChange={(e) => handleChange('guardianPhone', e.target.value)}
                    placeholder="e.g. 0712 345 678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Guardian Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.guardianEmail}
                    onChange={(e) => handleChange('guardianEmail', e.target.value)}
                    placeholder="guardian@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Residential Address / Estate
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="e.g. Westlands, Nairobi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Fees & Health */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-3 pb-1 border-b border-slate-200">
                4. Fees & Health Notes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Total Tuition (KES)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalFees}
                    onChange={(e) => handleChange('totalFees', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Total Paid Fees (KES)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.paidFees}
                    onChange={(e) => handleChange('paidFees', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Attendance Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.attendanceRate}
                    onChange={(e) => handleChange('attendanceRate', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Medical & Health Notes (Allergies, Dietary, Emergency)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.healthNotes}
                    onChange={(e) => handleChange('healthNotes', e.target.value)}
                    placeholder="e.g. Mild asthmatic, inhaler in infirmary."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
