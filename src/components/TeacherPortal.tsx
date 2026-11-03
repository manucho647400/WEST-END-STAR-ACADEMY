import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  Award, 
  Users, 
  CheckCircle, 
  Edit3, 
  Save, 
  FileText, 
  Printer, 
  AlertCircle,
  Calendar,
  BookOpen,
  Sparkles,
  Search,
  RotateCcw
} from 'lucide-react';
import { Student, CBCPerformanceLevel, LearningAreaAssessment, ReportCard, UserRole } from '../types';
import { CBC_GRADES, getLearningAreasForGrade } from '../data/initialData';

interface TeacherPortalProps {
  onOpenReportCard: (studentId: string) => void;
  onOpenAuth?: (role?: UserRole) => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  onOpenReportCard,
  onOpenAuth
}) => {
  const { currentUser } = useAuth();
  const { students, reportCards, saveReportCard, notices } = useSchool();

  if (currentUser?.role !== 'teacher') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto my-8 shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-200">
          <GraduationCap className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-display font-bold text-slate-900">
            Teachers & Facilitators Authentication Required
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Access to classroom SBA marks entry, rubric calculation, and KPSEA/KJSEA clearance is restricted to authorized TSC faculty facilitators.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => onOpenAuth?.('teacher')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Sign In / Create Teacher Account</span>
          </button>
        </div>
      </div>
    );
  }

  const [selectedGrade, setSelectedGrade] = useState(currentUser?.assignedGrade || 'Grade 8 (JSS)');
  const availableSubjects = getLearningAreasForGrade(selectedGrade);
  const [activeSubject, setActiveSubject] = useState(
    currentUser?.learningAreas?.[0] || availableSubjects[0] || 'Maths'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.some(s => s.toLowerCase() === activeSubject.toLowerCase())) {
      setActiveSubject(availableSubjects[0]);
    }
  }, [selectedGrade, availableSubjects, activeSubject]);

  // Filter students by teacher's assigned grade
  const classStudents = students.filter(s => 
    s.grade.toLowerCase().includes(selectedGrade.toLowerCase()) || 
    selectedGrade === 'All'
  );

  const filteredStudents = classStudents.filter(s =>
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nemisUpi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  type ExamField = 
    | 'term1Opener' | 'term1Mid' | 'term1End'
    | 'term2Opener' | 'term2Mid' | 'term2End'
    | 'term3Opener' | 'term3Mid' | 'term3End';

  interface StudentTeacherScores {
    term1Opener: number;
    term1Mid: number;
    term1End: number;
    term2Opener: number;
    term2Mid: number;
    term2End: number;
    term3Opener: number;
    term3Mid: number;
    term3End: number;
    remark: string;
  }

  // Local state for score adjustments per student across 3 terms & 3 exams each
  const [localScores, setLocalScores] = useState<Record<string, StudentTeacherScores>>(() => {
    const map: Record<string, StudentTeacherScores> = {};
    students.forEach(s => {
      const card = reportCards[s.id];
      const area = card?.learningAreas?.find(a => a.learningArea.toLowerCase().includes(activeSubject.toLowerCase()));
      map[s.id] = {
        term1Opener: area?.term1Opener ?? 0,
        term1Mid: area?.term1Mid ?? 0,
        term1End: area?.term1End ?? 0,
        term2Opener: area?.term2Opener ?? 0,
        term2Mid: area?.term2Mid ?? 0,
        term2End: area?.term2End ?? 0,
        term3Opener: area?.term3Opener ?? 0,
        term3Mid: area?.term3Mid ?? 0,
        term3End: area?.term3End ?? 0,
        remark: area?.competencyRemark ?? ''
      };
    });
    return map;
  });

  // Keep localScores synced with reportCards and subject changes
  useEffect(() => {
    const map: Record<string, StudentTeacherScores> = {};
    students.forEach(s => {
      const card = reportCards[s.id];
      const area = card?.learningAreas?.find(a => a.learningArea.toLowerCase().includes(activeSubject.toLowerCase()));
      map[s.id] = {
        term1Opener: area?.term1Opener ?? 0,
        term1Mid: area?.term1Mid ?? 0,
        term1End: area?.term1End ?? 0,
        term2Opener: area?.term2Opener ?? 0,
        term2Mid: area?.term2Mid ?? 0,
        term2End: area?.term2End ?? 0,
        term3Opener: area?.term3Opener ?? 0,
        term3Mid: area?.term3Mid ?? 0,
        term3End: area?.term3End ?? 0,
        remark: area?.competencyRemark ?? ''
      };
    });
    setLocalScores(map);
  }, [activeSubject, students, reportCards]);

  const handleResetClassScoresToZero = () => {
    if (window.confirm(`Reset all exam marks to 00 for ${activeSubject} in ${selectedGrade}?`)) {
      setLocalScores(prev => {
        const updated = { ...prev };
        filteredStudents.forEach(s => {
          updated[s.id] = {
            term1Opener: 0,
            term1Mid: 0,
            term1End: 0,
            term2Opener: 0,
            term2Mid: 0,
            term2End: 0,
            term3Opener: 0,
            term3Mid: 0,
            term3End: 0,
            remark: ''
          };
        });
        return updated;
      });
    }
  };

  const calculateRubric = (total: number): { level: CBCPerformanceLevel; score: number } => {
    if (total >= 80) return { level: 'EE', };
    if (total >= 65) return { level: 'ME',  };
    if (total >= 50) return { level: 'AE',  };
    return { level: 'BE', score: 1 };
  };

  const handleScoreChange = (studentId: string, field: ExamField, val: number) => {
    setLocalScores(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: Math.min(100, Math.max(0, isNaN(val) ? 0 : val))
      }
    }));
  };

  const handleRemarkChange = (studentId: string, remark: string) => {
    setLocalScores(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remark
      }
    }));
  };

  const handleSaveStudentMark = (student: Student) => {
    const s = localScores[student.id] || {
      term1Opener: 0, term1Mid: 0, term1End: 0,
      term2Opener: 0, term2Mid: 0, term2End: 0,
      term3Opener: 0, term3Mid: 0, term3End: 0,
      remark: ''
    };
    const examList = [
      s.term1Opener, s.term1Mid, s.term1End,
      s.term2Opener, s.term2Mid, s.term2End,
      s.term3Opener, s.term3Mid, s.term3End
    ];
    const total = Math.round(examList.reduce((acc, curr) => acc + curr, 0) / examList.length);
    const { level, score } = calculateRubric(total);

    const existingCard = reportCards[student.id];

    let updatedLearningAreas: LearningAreaAssessment[] = [];
    if (existingCard) {
      const areaExists = existingCard.learningAreas.some(a => a.learningArea === activeSubject);
      if (areaExists) {
        updatedLearningAreas = existingCard.learningAreas.map(a => 
          a.learningArea === activeSubject 
            ? { 
                ...a, 
                term1Opener: s.term1Opener,
                term1Mid: s.term1Mid,
                term1End: s.term1End,
                term2Opener: s.term2Opener,
                term2Mid: s.term2Mid,
                term2End: s.term2End,
                term3Opener: s.term3Opener,
                term3Mid: s.term3Mid,
                term3End: s.term3End,
                totalScore: total, 
                performanceLevel: level, 
                rubricScore: score, 
                competencyRemark: s.remark 
              }
            : a
        );
      } else {
        updatedLearningAreas = [
          ...existingCard.learningAreas,
          {
            learningArea: activeSubject,
            facilitator: currentUser?.name || 'Tr. Facilitator',
            term1Opener: s.term1Opener,
            term1Mid: s.term1Mid,
            term1End: s.term1End,
            term2Opener: s.term2Opener,
            term2Mid: s.term2Mid,
            term2End: s.term2End,
            term3Opener: s.term3Opener,
            term3Mid: s.term3Mid,
            term3End: s.term3End,
            totalScore: total,
            performanceLevel: level,
            rubricScore: score,
            strandsCovered: 'Core Syllabus Practical Strands',
            competencyRemark: s.remark
          }
        ];
      }
    } else {
      updatedLearningAreas = [
        {
          learningArea: activeSubject,
          facilitator: currentUser?.name || 'Tr. Facilitator',
          term1Opener: s.term1Opener,
          term1Mid: s.term1Mid,
          term1End: s.term1End,
          term2Opener: s.term2Opener,
          term2Mid: s.term2Mid,
          term2End: s.term2End,
          term3Opener: s.term3Opener,
          term3Mid: s.term3Mid,
          term3End: s.term3End,
          totalScore: total,
          performanceLevel: level,
          rubricScore: score,
          strandsCovered: 'Core Syllabus Practical Strands',
          competencyRemark: s.remark
        }
      ];
    }

    const totalSum = updatedLearningAreas.reduce((a, b) => a + b.totalScore, 0);
    const avg = Math.round((totalSum / updatedLearningAreas.length) * 10) / 10;
    const { level: overallLvl } = calculateRubric(avg);

    const updatedCard: ReportCard = {
      studentId: student.id,
      term: existingCard?.term || 'Term 3, 2026',
      academicYear: existingCard?.academicYear || '2025/2026',
      curriculum: 'Competency Based Curriculum (CBC Kenya)',
      overallPerformanceLevel: overallLvl,
      totalScore: totalSum,
      averageScore: avg,
      classRank: 1,
      totalInClass: classStudents.length,
      attendancePct: student.attendanceRate || 98.0,
      learningAreas: updatedLearningAreas,
      coreCompetencies: existingCard?.coreCompetencies || [
        { name: 'Critical Thinking and Problem Solving', rating: overallLvl, comment: 'Strong analytical logic.' }
      ],
      valuesObserved: existingCard?.valuesObserved || ['Love', 'Integrity', 'Respect'],
      communityServiceLearning: existingCard?.communityServiceLearning || 'Kitchen garden propagation.',
      coCurricularActivities: existingCard?.coCurricularActivities || 'Science & STEM Club.',
      facilitatorRemark: `Certified by ${currentUser?.name || 'Lead Facilitator'} for Term 3.`,
      headTeacherRemark: existingCard?.headTeacherRemark || 'Approved for KNEC KJSEA clearance.',
      issueDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    saveReportCard(student.id, updatedCard);
    setSaveSuccessMsg(`Marks successfully certified & saved for ${student.fullName}`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Teacher Profile Hero */}
      <div className="bg-emerald-950 text-white rounded-2xl p-6 shadow-xs border border-emerald-900 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full border-2 border-emerald-400 bg-emerald-900 text-white flex items-center justify-center font-bold text-lg font-mono shrink-0 shadow-md">
              {(currentUser?.name || 'Tr Facilitator').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                <span>Teachers & Facilitators Portal</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{currentUser?.tscNumber || 'TSC/349102'}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
                {currentUser?.name || 'Tr. Sarah Wanjiku'}
              </h1>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                {currentUser?.department || 'Integrated Sciences & STEM'} · Cohort: {selectedGrade}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-1.5 bg-emerald-900/80 rounded-lg border border-emerald-700/60 text-xs">
              <span className="text-[10px] text-emerald-300 block uppercase">Class Attendance</span>
              <span className="font-mono font-bold text-sm text-white">98.5% Avg</span>
            </div>
            <div className="px-3 py-1.5 bg-emerald-900/80 rounded-lg border border-emerald-700/60 text-xs">
              <span className="text-[10px] text-emerald-300 block uppercase">Enrolled Learners</span>
              <span className="font-mono font-bold text-sm text-white">{classStudents.length} Students</span>
            </div>
          </div>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-700" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Control Strip: Grade & Subject selection */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search learner in class by name or UPI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Cohort / Grade</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
            >
              {CBC_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Teaching Subject</label>
            <select
              value={activeSubject}
              onChange={(e) => setActiveSubject(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
            >
              {availableSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Scoring Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-display font-bold text-slate-900">
              CBC Assessment Register & Score Sheet: {activeSubject}
            </h2>
            <p className="text-xs text-slate-500">
              TERM 1, TERM 2, and  TERM 3 (Opener, Mid Term, and End Term out of 100 each). Certified scores upload directly to learner official report cards.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetClassScoresToZero}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
              title="Reset all student marks in this class to 00"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Marks to 00</span>
            </button>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Assessment Register
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
                <th rowSpan={2} className="py-3 px-4 border-r border-slate-300">Names</th>
                {/* COLUMN 1: TERM 1 */}
                <th colSpan={3} className="py-2 px-2 text-center border-r border-slate-300 bg-emerald-100/70 text-emerald-950 font-bold">
                  TERM 1
                </th>
                {/* COLUMN 2: TERM 2 */}
                <th colSpan={3} className="py-2 px-2 text-center border-r border-slate-300 bg-sky-100/70 text-sky-950 font-bold">
                  TERM 2
                </th>
                {/* COLUMN 3:  TERM 3 EXAM */}
                <th colSpan={3} className="py-2 px-2 text-center border-r border-slate-300 bg-amber-100/70 text-amber-950 font-bold">
                  END TERM EXAM
                </th>
                <th rowSpan={2} className="py-3 px-3 text-center border-r border-slate-300 w-20">Average (100)</th>
                <th rowSpan={2} className="py-3 px-4 min-w-[200px]">Competency Feedback Remark</th>
                <th rowSpan={2} className="py-3 px-4 text-center">Certify & Action</th>
              </tr>
              <tr className="border-b border-slate-300 text-slate-700 text-[10.5px]">
                {/* TERM 1 Subheadings */}
                <th className="py-1.5 px-1.5 text-center bg-emerald-50 text-emerald-900 border-r border-slate-200 font-semibold w-18">
                  Opener Exam (100)
                </th>
                <th className="py-1.5 px-1.5 text-center bg-emerald-50 text-emerald-900 border-r border-slate-200 font-semibold w-18">
                  Mid Term Exam (100)
                </th>
                <th className="py-1.5 px-1.5 text-center bg-emerald-50 text-emerald-900 border-r border-slate-300 font-semibold w-18">
                  End Term Exam (100)
                </th>

                {/* TERM 2 Subheadings */}
                <th className="py-1.5 px-1.5 text-center bg-sky-50 text-sky-900 border-r border-slate-200 font-semibold w-18">
                  Opener Exam (100)
                </th>
                <th className="py-1.5 px-1.5 text-center bg-sky-50 text-sky-900 border-r border-slate-200 font-semibold w-18">
                  Mid Term Exam (100)
                </th>
                <th className="py-1.5 px-1.5 text-center bg-sky-50 text-sky-900 border-r border-slate-300 font-semibold w-18">
                  End Term Exam (100)
                </th>

                {/*  TERM 3  Subheadings */}
                <th className="py-1.5 px-1.5 text-center bg-amber-50 text-amber-900 border-r border-slate-200 font-semibold w-18">
                  Opener Exam (100)
                </th>
                <th className="py-1.5 px-1.5 text-center bg-amber-50 text-amber-900 border-r border-slate-200 font-semibold w-18">
                  Mid Term Exam (100)
                </th>
                <th className="py-1.5 px-1.5 text-center bg-amber-50 text-amber-900 border-r border-slate-300 font-semibold w-18">
                  End Term Exam (100)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map(student => {
                const s = localScores[student.id] || {
                  term1Opener: 0, term1Mid: 0, term1End: 0,
                  term2Opener: 0, term2Mid: 0, term2End: 0,
                  term3Opener: 0, term3Mid: 0, term3End: 0,
                  remark: ''
                };
                const examList = [
                  s.term1Opener, s.term1Mid, s.term1End,
                  s.term2Opener, s.term2Mid, s.term2End,
                  s.term3Opener, s.term3Mid, s.term3End
                ];
                const hasEnteredAny = examList.some(v => v > 0);
                const total = hasEnteredAny && examList.length > 0 
                  ? Math.round(examList.reduce((acc, curr) => acc + curr, 0) / examList.length) 
                  : 0;
                const { level, score } = calculateRubric(total);

                return (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 border-r border-slate-200">
                      <div className="font-bold text-slate-900">{student.fullName}</div>
                      {student.nemisUpi && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          UPI: {student.nemisUpi}
                        </div>
                      )}
                    </td>

                    {/* TERM 1 Inputs */}
                    <td className="py-2 px-1 text-center border-r border-slate-100 bg-emerald-50/20">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={s.term1Opener}
                        onChange={(e) => handleScoreChange(student.id, 'term1Opener', Number(e.target.value))}
                        className="w-14 px-1 py-1 text-center font-mono font-bold bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-emerald-700"
                      />
                    </td>
                    <td className="py-2 px-1 text-center border-r border-slate-100 bg-emerald-50/20">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={s.term1Mid}
                        onChange={(e) => handleScoreChange(student.id, 'term1Mid', Number(e.target.value))}
                        className="w-14 px-1 py-1 text-center font-mono font-bold bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-emerald-700"
                      />
                    </td>
                    <td className="py-2 px-1 text-center border-r border-slate-300 bg-emerald-50/30">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={s.term1End}
                        onChange={(e) => handleScoreChange(student.id, 'term1End', Number(e.target.value))}
                        className="w-14 px-1 py-1 text-center font-mono font-bold bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-emerald-700"
                      />
                    </td>

                    {/* TERM 2 Inputs */}
                    <td className="py-2 px-1 text-center border-r border-slate-100 bg-sky-50/20">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={s.term2Opener}
                        onChange={(e) => handleScoreChange(student.id, 'term2Opener', Number(e.target.value))}
                        className="w-14 px-1 py-1 text-center font-mono font-bold bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-sky-700"
                      />
                    </td>
                    <td className="py-2 px-1 text-center border-r border-slate-100 bg-sky-50/20">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={s.term2Mid}
                        onChange={(e) => handleScoreChange(student.id, 'term2Mid', Number(e.target.value))}
                        className="w-14 px-1 py-1 text-center font-mono font-bold bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-sky-700"
                      />
                    </td>
                    <td className="py-2 px-1 text-center border-r border-slate-300 bg-sky-50/30">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={s.term2End}
                        onChange={(e) => handleScoreChange(student.id, 'term2End', Number(e.target.value))}
                        className="w-14 px-1 py-1 text-center font-mono font-bold bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-sky-700"
                      />
                    </td>

                    {/*  TERM 3 Inputs */}
                    <td className="py-2 px-1 text-center border-r border-slate-100 bg-amber-50/20">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={s.term3Opener}
                        onChange={(e) => handleScoreChange(student.id, 'term3Opener', Number(e.target.value))}
                        className="w-14 px-1 py-1 text-center font-mono font-bold bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-amber-700"
                      />
                    </td>
                    <td className="py-2 px-1 text-center border-r border-slate-100 bg-amber-50/20">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={s.term3Mid}
                        onChange={(e) => handleScoreChange(student.id, 'term3Mid', Number(e.target.value))}
                        className="w-14 px-1 py-1 text-center font-mono font-bold bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-amber-700"
                      />
                    </td>
                    <td className="py-2 px-1 text-center border-r border-slate-300 bg-amber-50/30">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={s.term3End}
                        onChange={(e) => handleScoreChange(student.id, 'term3End', Number(e.target.value))}
                        className="w-14 px-1 py-1 text-center font-mono font-bold bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-amber-700"
                      />
                    </td>

                    {/* Average */}
                    <td className="py-3 px-3 font-mono font-black text-center text-slate-900 text-sm border-r border-slate-200">
                      {total === 0 ? '00%' : `${total}%`}
                    </td>

                    <td className="py-3 px-4 border-r border-slate-200">
                      <input
                        type="text"
                        value={s.remark}
                        onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                        placeholder="Enter teacher competency remark..."
                        className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                      />
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleSaveStudentMark(student)}
                          title="Save & Certify Scores"
                          className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => onOpenReportCard(student.id)}
                          title="View Official Report Card"
                          className="p-1 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500">
            <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-800">No learners enrolled in {selectedGrade} yet.</p>
            <p className="text-slate-400 mt-0.5">Admit learners to begin recording Formative and Summative scores.</p>
          </div>
        )}
      </div>

      {/* KNEC CBA SBA Directives Card for Teachers */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-2">
          <BookOpen className="w-4 h-4" />
          <span>KNEC School-Based Assessment (SBA) Guidelines</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 mt-2">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">1. Practical Assessment Tasks</span>
            <p className="text-[11px] text-slate-500">
              Maintain learners' practical portfolios, project write-ups, and laboratory logs for verification by KNEC quality assurance officers.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">2. 7 Core Competencies Check</span>
            <p className="text-[11px] text-slate-500">
              Ensure regular qualitative notes in Digital Literacy, Critical Thinking, and Communication are captured during class presentations.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">3. Portal Upload Deadline</span>
            <p className="text-[11px] text-slate-500">
              All Grade 6 (KPSEA) and Grade 8 (JSS) SBA raw scores must be signed off by the JSS Lead Teacher by November 10, 2026.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
