import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  UserCheck, 
  FileText, 
  CreditCard, 
  Phone, 
  Mail, 
  MapPin, 
  HeartPulse, 
  Award, 
  ChevronRight,
  Trash2,
  Edit,
  GraduationCap
} from 'lucide-react';
import { Student } from '../types';
import { CBC_GRADES, CBC_HOUSES, CBC_SECTIONS } from '../data/initialData';
import { EditLearnerModal } from './EditLearnerModal';

interface LearnersModuleProps {
  onOpenReportCard: (studentId: string) => void;
  onOpenPayment: (student: Student) => void;
  onOpenEnroll: () => void;
}

export const LearnersModule: React.FC<LearnersModuleProps> = ({
  onOpenReportCard,
  onOpenPayment,
  onOpenEnroll
}) => {
  const { students, deleteStudent } = useSchool();
  const { currentUser } = useAuth();
  const isTeacher = currentUser?.role === 'teacher';
  const isAdmin = currentUser?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nemisUpi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.guardianName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGrade = selectedGrade === 'All' || student.grade.includes(selectedGrade);

    return matchesSearch && matchesGrade;
  });

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
            Learner Admission & CBC Register
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered under Ministry of Education NEMIS & KNEC Assessment Portals
          </p>
        </div>

        <button
          onClick={onOpenEnroll}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Enroll New Learner</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by learner name, NEMIS UPI, or guardian..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Grade filter */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            aria-label="Filter learners by Grade"
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <option value="All">All Grades</option>
            {CBC_GRADES.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Learners Count & Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Showing {filteredStudents.length} of {students.length} registered learners</span>
        <span>Curriculum: 2-6-3-3-3 Competency-Based Framework</span>
      </div>

      {/* Learners Directory Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map(student => (
          <div
            key={student.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-emerald-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-900 border border-slate-200 shrink-0 flex items-center justify-center font-bold text-xs font-mono">
                    {student.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-sm text-slate-900 leading-snug">
                      {student.fullName}
                    </h2>
                    <div className="text-xs text-slate-500">
                      {student.grade || 'Unassigned Grade'}{student.section ? ` · ${student.section}` : ''}
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {student.status}
                  </span>
                </div>
              </div>

              {/* Biodata summary */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 text-[11px]">NEMIS UPI:</span>
                  <div className="font-mono font-medium">{student.nemisUpi || '—'}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">House:</span>
                  <div className="font-medium">{student.house || '—'}</div>
                </div>
                {!isTeacher ? (
                  <div>
                    <span className="text-slate-400 text-[11px]">Fee Balance:</span>
                    <div className={`font-mono font-semibold ${student.feeBalance > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                      KES {student.feeBalance.toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-slate-400 text-[11px]">Enrolled Status:</span>
                    <div className="font-semibold text-emerald-800">{student.status}</div>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 text-[11px]">Attendance:</span>
                  <div className="font-mono">{student.attendanceRate > 0 ? `${student.attendanceRate}%` : '—'}</div>
                </div>
              </div>

              {/* Guardian info preview */}
              {(student.guardianName || student.guardianPhone || student.guardianEmail) && (
                <div className="mt-3 bg-slate-50 p-2 rounded-lg text-[11px] text-slate-600 space-y-0.5">
                  {student.guardianName && (
                    <div className="font-semibold text-slate-800">{student.guardianName} (Guardian)</div>
                  )}
                  {student.guardianPhone && (
                    <div className="flex items-center gap-1 text-slate-500">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{student.guardianPhone}</span>
                    </div>
                  )}
                  {student.guardianEmail && (
                    <div className="flex items-center gap-1 text-slate-500 truncate">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{student.guardianEmail}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedStudentForDetails(student)}
                  className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Full Profile
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setEditingStudent(student)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                    title="Edit Learner Profile (Admin Access)"
                  >
                    <Edit className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isTeacher && (
                  <button
                    onClick={() => onOpenPayment(student)}
                    title="Pay Fee via M-Pesa"
                    className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => onOpenReportCard(student.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Report Card</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">No Learners in Register</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            The school database is ready for real admissions. Enroll your first learner to generate their NEMIS UPI and CBC profile.
          </p>
          <button
            onClick={onOpenEnroll}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Enroll First Learner</span>
          </button>
        </div>
      )}

      {/* Learner Profile Drawer / Modal */}
      {selectedStudentForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-900 border border-slate-200 flex items-center justify-center font-bold text-sm font-mono shrink-0">
                  {selectedStudentForDetails.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-slate-900">
                    {selectedStudentForDetails.fullName}
                  </h2>
                  <div className="text-xs text-slate-500">
                    {selectedStudentForDetails.grade}{selectedStudentForDetails.nemisUpi ? ` · UPI: ${selectedStudentForDetails.nemisUpi}` : ''}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentForDetails(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[11px]">Academic Cohort</span>
                  <span className="font-semibold text-slate-800">{selectedStudentForDetails.grade || '—'}</span>
                  <div className="text-slate-500 mt-0.5">Section: {selectedStudentForDetails.section || '—'}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[11px]">School House</span>
                  <span className="font-semibold text-slate-800">{selectedStudentForDetails.house ? `${selectedStudentForDetails.house} House` : '—'}</span>
                  <div className="text-slate-500 mt-0.5">Enrolled: {selectedStudentForDetails.enrollmentDate || '—'}</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="font-semibold text-slate-900">Official Government Identifiers</div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>Birth Certificate No: <span className="font-mono font-medium text-slate-900">{selectedStudentForDetails.birthCertNo || '—'}</span></div>
                  <div>NEMIS UPI: <span className="font-mono font-medium text-slate-900">{selectedStudentForDetails.nemisUpi || '—'}</span></div>
                  <div>Date of Birth: <span className="font-medium text-slate-900">{selectedStudentForDetails.dob || '—'}</span></div>
                  <div>Gender: <span className="font-medium text-slate-900">{selectedStudentForDetails.gender || '—'}</span></div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="font-semibold text-slate-900">Guardian & Residence</div>
                <div className="text-slate-600 space-y-1">
                  <div>Guardian: <span className="font-medium text-slate-900">{selectedStudentForDetails.guardianName || '—'}</span></div>
                  <div>Phone: <span className="font-medium text-slate-900">{selectedStudentForDetails.guardianPhone || '—'}</span></div>
                  <div>Email: <span className="font-medium text-slate-900">{selectedStudentForDetails.guardianEmail || '—'}</span></div>
                  <div>Residence: <span className="font-medium text-slate-900">{selectedStudentForDetails.address || '—'}</span></div>
                </div>
              </div>

              {!isTeacher && (
                <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="font-semibold text-slate-900">Fees & Financial Balance</div>
                  <div className="grid grid-cols-3 gap-2 text-slate-600">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Total Tuition</span>
                      <span className="font-mono font-bold text-slate-900">KES {selectedStudentForDetails.totalFees.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Total Paid</span>
                      <span className="font-mono font-bold text-emerald-700">KES {selectedStudentForDetails.paidFees.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Outstanding</span>
                      <span className={`font-mono font-bold ${selectedStudentForDetails.feeBalance > 0 ? 'text-amber-800' : 'text-slate-900'}`}>
                        KES {selectedStudentForDetails.feeBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedStudentForDetails.healthNotes && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-900">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-700" />
                    <span>Health & Medical Notes</span>
                  </div>
                  <div className="mt-1">{selectedStudentForDetails.healthNotes}</div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  if (confirm(`Remove ${selectedStudentForDetails.fullName} from school database?`)) {
                    deleteStudent(selectedStudentForDetails.id);
                    setSelectedStudentForDetails(null);
                  }
                }}
                className="px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Withdraw Learner</span>
              </button>

              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => {
                      const s = selectedStudentForDetails;
                      setSelectedStudentForDetails(null);
                      setEditingStudent(s);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                )}
                {!isTeacher && (
                  <button
                    onClick={() => {
                      const st = selectedStudentForDetails;
                      setSelectedStudentForDetails(null);
                      onOpenPayment(st);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
                  >
                    Record Fee Payment
                  </button>
                )}
                <button
                  onClick={() => {
                    const id = selectedStudentForDetails.id;
                    setSelectedStudentForDetails(null);
                    onOpenReportCard(id);
                  }}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors"
                >
                  View Report Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Learner Profile Modal (Admin Only) */}
      {editingStudent && (
        <EditLearnerModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSaved={(updated) => {
            if (selectedStudentForDetails?.id === updated.id) {
              setSelectedStudentForDetails(updated);
            }
          }}
        />
      )}
    </div>
  );
};
