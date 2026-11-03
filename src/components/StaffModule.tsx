import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { 
  UserCheck, 
  Search, 
  PlusCircle, 
  Phone, 
  Mail, 
  GraduationCap
} from 'lucide-react';
import { CBC_GRADES } from '../data/initialData';

export const StaffModule: React.FC = () => {
  const { staff, addStaff } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state - department, qualification, and learning areas removed per specifications
  const [fullName, setFullName] = useState('');
  const [tscNumber, setTscNumber] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [role, setRole] = useState('');
  const [assignedGrade, setAssignedGrade] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const filteredStaff = staff.filter(st => {
    return (
      st.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (st.tscNumber && st.tscNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (st.role && st.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
      st.staffNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    addStaff({
      fullName: fullName.trim(),
      tscNumber: tscNumber.trim(),
      gender,
      role: role.trim(),
      assignedGrade: assignedGrade.trim(),
      assignedSection: '',
      email: email.trim(),
      phone: phone.trim(),
      status: 'Active',
      salaryStatus: ''
    });

    setIsAddOpen(false);
    setFullName('');
    setTscNumber('');
    setEmail('');
    setPhone('');
    setRole('');
    setAssignedGrade('');
    setGender('');
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            Teaching Faculty & Staff Register
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Certified by Teachers Service Commission (TSC) & Ministry of Education CBC Directorate
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by staff name, TSC number, or institutional role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map(st => (
          <div
            key={st.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-900 border border-slate-200 shrink-0 flex items-center justify-center font-bold text-xs font-mono">
                    {st.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-sm text-slate-900 leading-snug">
                      {st.fullName}
                    </h2>
                    {st.role && <div className="text-xs text-emerald-800 font-semibold">{st.role}</div>}
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">{st.staffNo}</div>
                  </div>
                </div>

                {st.tscNumber && (
                  <span className="font-mono text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {st.tscNumber}
                  </span>
                )}
              </div>

              {/* Assigned Grade & Cohort */}
              {st.assignedGrade && (
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-800 shrink-0" />
                  <div>
                    <span className="text-[11px] text-slate-400 block">Assigned Grade</span>
                    <span className="font-semibold text-slate-800">
                      {st.assignedGrade}{st.assignedSection ? ` (${st.assignedSection})` : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Footer */}
            {(st.phone || st.email) && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                {st.phone ? (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{st.phone}</span>
                  </div>
                ) : <div />}
                {st.email ? (
                  <div className="flex items-center gap-1 truncate max-w-[150px]">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{st.email}</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">No Staff Members Registered</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Register your school leadership (Headteacher, Deputy Head Teacher, Teachers) and TSC certified CBC facilitators.
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add First Staff Member</span>
          </button>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Register New Staff Member</h2>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateStaff} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name (e.g. TR AMOS LANGAT) *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Tr. Amos Langat"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">TSC Number</label>
                  <input
                    type="text"
                    value={tscNumber}
                    onChange={(e) => setTscNumber(e.target.value)}
                    placeholder="e.g. 558568 or TSC/198421"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Institutional Role - Headteacher, Deputy Head Teacher, Teachers added, Principal/Deputy Principal removed */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Institutional Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-medium"
                  >
                    <option value="">Select Institutional Role</option>
                    <option value="Headteacher">Headteacher</option>
                    <option value="Deputy Head Teacher">Deputy Head Teacher</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Teachers">Teachers</option>
                    <option value="Senior Teacher">Senior Teacher</option>
                    <option value="JSS Lead Teacher">JSS Lead Teacher</option>
                    <option value="CBC Facilitator">CBC Facilitator</option>
                    <option value="Games Master">Games Master</option>
                    <option value="Bursar">Bursar</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Grade</label>
                  <select
                    value={assignedGrade}
                    onChange={(e) => setAssignedGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  >
                    <option value="">Select Assigned Grade</option>
                    {CBC_GRADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 7..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tr.amos@westendstar.ac.ke"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg transition-colors shadow-xs"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
