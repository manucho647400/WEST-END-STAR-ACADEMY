import React, { useState, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { 
  Award, 
  Printer, 
  Save, 
  Edit3, 
  Plus,
  GraduationCap,
  Trophy,
  Medal,
  ListOrdered,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  Calendar,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { ReportCard, LearningAreaAssessment, CBCPerformanceLevel } from '../types';
import { 
  DEFAULT_LEARNING_AREAS_JSS, 
  CORE_COMPETENCIES_LIST, 
  CBC_GRADES,
  getLearningAreasForGrade,
  getGradeTierLabel,
  buildLearningAreasForStudent,
  computeCohortRankings,
  CohortRankItem
} from '../data/initialData';
import { SchoolEmblem } from './SchoolEmblem';

interface AssessmentsModuleProps {
  onOpenReportCardModal: (studentId: string) => void;
}

type ExamField = 
  | 'term1Opener' | 'term1Mid' | 'term1End'
  | 'term2Opener' | 'term2Mid' | 'term2End'
  | 'term3Opener' | 'term3Mid' | 'term3End';

export const AssessmentsModule: React.FC<AssessmentsModuleProps> = ({
  onOpenReportCardModal
}) => {
  const { students, reportCards, saveReportCard, resetAssessmentMarksToZero, academy, curriculum } = useSchool();
  const [activeTab, setActiveTab] = useState<'individual' | 'broadsheet'>('individual');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ''
  );
  const [isEditing, setIsEditing] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [broadsheetFilterGrade, setBroadsheetFilterGrade] = useState<string>('All');
  const [broadsheetSearch, setBroadsheetSearch] = useState<string>('');

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const existingReport = selectedStudent ? reportCards[selectedStudent.id] : null;

  // Local state for assessment builder / editor
  const [term, setTerm] = useState('Term 3, 2026');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [learningAreas, setLearningAreas] = useState<LearningAreaAssessment[]>([]);
  const [cslText, setCslText] = useState('');
  const [coCurricularText, setCoCurricularText] = useState('');
  const [facilitatorRemark, setFacilitatorRemark] = useState('');
  const [headTeacherRemark, setHeadTeacherRemark] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const calculateRubric = (total: number): { level: CBCPerformanceLevel; score: number } => {
    if (total >= 80) return { level: 'EE', };
    if (total >= 65) return { level: 'ME', };
    if (total >= 50) return { level: 'AE', };
    return { level: 'BE', score: 1 };
  };

  // Cohort-level ranking: each grade is ranked separately, and Term 1, Term 2, End Term ranked separately
  const cohortRankings = useMemo(() => {
    return computeCohortRankings(students, reportCards);
  }, [students, reportCards]);

  // Selected student's current cohort rankings
  const currentStudentRankInfo = cohortRankings.find(r => r.student.id === selectedStudentId);
  const currentRank = currentStudentRankInfo?.hasTeacherEntry ? currentStudentRankInfo.rankOverall : 0;
  const currentT1Rank = currentStudentRankInfo?.hasT1Entry ? currentStudentRankInfo.rankT1 : 0;
  const currentT2Rank = currentStudentRankInfo?.hasT2Entry ? currentStudentRankInfo.rankT2 : 0;
  const currentEndTermRank = currentStudentRankInfo?.hasT3Entry ? currentStudentRankInfo.rankEndTerm : 0;
  const totalInGrade = currentStudentRankInfo?.totalInGrade || 1;

  // Filtered list for Broadsheet tab
  const filteredBroadsheet = useMemo(() => {
    return cohortRankings.filter(item => {
      const matchGrade = broadsheetFilterGrade === 'All' || item.student.grade.toLowerCase().includes(broadsheetFilterGrade.toLowerCase());
      const matchSearch = item.student.fullName.toLowerCase().includes(broadsheetSearch.toLowerCase()) ||
                          item.student.nemisUpi.toLowerCase().includes(broadsheetSearch.toLowerCase());
      return matchGrade && matchSearch;
    });
  }, [cohortRankings, broadsheetFilterGrade, broadsheetSearch]);

  const handleStartEdit = () => {
    const studentGrade = selectedStudent?.grade || '';
    const baseAreas = buildLearningAreasForStudent(studentGrade, existingReport?.learningAreas || []);
    const mappedAreas = baseAreas.map(a => {
      const t1o = a.term1Opener ?? 0;
      const t1m = a.term1Mid ?? 0;
      const t1e = a.term1End ?? 0;
      const t2o = a.term2Opener ?? 0;
      const t2m = a.term2Mid ?? 0;
      const t2e = a.term2End ?? 0;
      const t3o = a.term3Opener ?? 0;
      const t3m = a.term3Mid ?? 0;
      const t3e = a.term3End ?? 0;
      const scores = [t1o, t1m, t1e, t2o, t2m, t2e, t3o, t3m, t3e];
      const sum = scores.reduce((acc, curr) => acc + curr, 0);
      const avg = sum > 0 ? Math.round(sum / scores.length) : 0;
      const { level, score } = calculateRubric(avg);
      return {
        ...a,
        term1Opener: t1o,
        term1Mid: t1m,
        term1End: t1e,
        term2Opener: t2o,
        term2Mid: t2m,
        term2End: t2e,
        term3Opener: t3o,
        term3Mid: t3m,
        term3End: t3e,
        totalScore: a.totalScore !== undefined ? a.totalScore : avg,
        performanceLevel: a.performanceLevel || level,
        rubricScore: a.rubricScore || score
      };
    });
    setLearningAreas(mappedAreas);

    if (existingReport) {
      setTerm(existingReport.term);
      setAcademicYear(existingReport.academicYear);
      setCslText(existingReport.communityServiceLearning || '');
      setCoCurricularText(existingReport.coCurricularActivities || '');
      setFacilitatorRemark(existingReport.facilitatorRemark || '');
      setHeadTeacherRemark(existingReport.headTeacherRemark || '');
      setSelectedValues(existingReport.valuesObserved || []);
    } else {
      setCslText('');
      setCoCurricularText('');
      setFacilitatorRemark('');
      setHeadTeacherRemark('');
      setSelectedValues([]);
    }
    setIsEditing(true);
  };

  const handleExamScoreChange = (index: number, field: ExamField, val: number) => {
    setLearningAreas(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      const clamped = Math.min(100, Math.max(0, isNaN(val) ? 0 : val));
      item[field] = clamped;

      const scores = [
        item.term1Opener ?? 0,
        item.term1Mid ?? 0,
        item.term1End ?? 0,
        item.term2Opener ?? 0,
        item.term2Mid ?? 0,
        item.term2End ?? 0,
        item.term3Opener ?? 0,
        item.term3Mid ?? 0,
        item.term3End ?? 0
      ];
      const avg = Math.round(scores.reduce((acc, curr) => acc + curr, 0) / scores.length);
      item.totalScore = avg;
      const { level, score } = calculateRubric(avg);
      item.performanceLevel = level;
      item.rubricScore = score;
      updated[index] = item;
      return updated;
    });
  };

  const handleSaveAssessment = () => {
    if (!selectedStudent) return;

    // Calculate overall grand total marks and mean score
    let grandTotal = 0;
    learningAreas.forEach(a => {
      grandTotal += (
        (a.term1Opener ?? 0) + (a.term1Mid ?? 0) + (a.term1End ?? 0) +
        (a.term2Opener ?? 0) + (a.term2Mid ?? 0) + (a.term2End ?? 0) +
        (a.term3Opener ?? 0) + (a.term3Mid ?? 0) + (a.term3End ?? 0)
      );
    });
    const totalExams = learningAreas.length * 9;
    const avgScore = totalExams > 0 ? Math.round((grandTotal / totalExams) * 10) / 10 : 0;
    const { level } = calculateRubric(avgScore);

    const competencies = CORE_COMPETENCIES_LIST.map(name => ({
      name,
      rating: level,
      comment: `Consistently displays ${level} competency mastery in learning and collaboration.`
    }));

    const newCard: ReportCard = {
      studentId: selectedStudent.id,
      term,
      academicYear,
      curriculum: 'Competency Based Curriculum (CBC Kenya)',
      overallPerformanceLevel: level,
      totalScore: grandTotal,
      averageScore: avgScore,
      classRank: currentRank,
      totalInClass: students.length,
      attendancePct: selectedStudent.attendanceRate || 98.0,
      learningAreas,
      coreCompetencies: competencies,
      valuesObserved: selectedValues,
      communityServiceLearning: cslText,
      coCurricularActivities: coCurricularText,
      facilitatorRemark,
      headTeacherRemark,
      issueDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    saveReportCard(selectedStudent.id, newCard);
    setIsEditing(false);
  };

  const handlePrint = () => {
    window.print();
  };

  // Totals calculation for currently displayed learning areas
  const currentAreas = isEditing ? learningAreas : (existingReport?.learningAreas || []);
  const computedTotals = useMemo(() => {
    const t1o = currentAreas.reduce((acc, a) => acc + (a.term1Opener ?? 0), 0);
    const t1m = currentAreas.reduce((acc, a) => acc + (a.term1Mid ?? 0), 0);
    const t1e = currentAreas.reduce((acc, a) => acc + (a.term1End ?? 0), 0);
    const t2o = currentAreas.reduce((acc, a) => acc + (a.term2Opener ?? 0), 0);
    const t2m = currentAreas.reduce((acc, a) => acc + (a.term2Mid ?? 0), 0);
    const t2e = currentAreas.reduce((acc, a) => acc + (a.term2End ?? 0), 0);
    const t3o = currentAreas.reduce((acc, a) => acc + (a.term3Opener ?? 0), 0);
    const t3m = currentAreas.reduce((acc, a) => acc + (a.term3Mid ?? 0), 0);
    const t3e = currentAreas.reduce((acc, a) => acc + (a.term3End ?? 0), 0);

    const t1Total = t1o + t1m + t1e;
    const t2Total = t2o + t2m + t2e;
    const t3Total = t3o + t3m + t3e;
    const grandTotal = t1Total + t2Total + t3Total;
    const totalExams = currentAreas.length * 9;
    const meanScore = (grandTotal > 0 && totalExams > 0) ? Math.round((grandTotal / totalExams) * 10) / 10 : 0;
    const { level, score } = calculateRubric(meanScore);

    return {
      t1o, t1m, t1e, t1Total,
      t2o, t2m, t2e, t2Total,
      t3o, t3m, t3e, t3Total,
      grandTotal,
      maxPossibleMarks: totalExams * ,
      meanScore,
      rubricLevel: grandTotal > 0 ? level : 'BE',
      rubricScore: grandTotal > 0 ? score : 1
    };
  }, [currentAreas]);

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Navigation - Hidden in print */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
            <span>Republic of Kenya</span>
            <span aria-hidden="true">·</span>
            <span>Ministry of Education CBC Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 mt-0.5">
            Competency-Based Assessment (CBC) Register
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            TERM 1, TERM 2 & END TERM EXAM registers with dynamic Class Ranking, Grand Totals, and official printing.
          </p>
        </div>

        {/* View mode switcher & Print button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('individual')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'individual'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Learner Register</span>
            </button>
            <button
              onClick={() => setActiveTab('broadsheet')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'broadsheet'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Class Broadsheet & Ranking</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors"
            title="Print Official Document"
          >
            <Printer className="w-4 h-4 text-emerald-800" />
            <span>Print Register Sheet</span>
          </button>

          {activeTab === 'individual' && selectedStudent && existingReport && !isEditing && (
            <button
              onClick={() => onOpenReportCardModal(selectedStudent.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
            >
              <Award className="w-4 h-4" />
              <span>Print Official Report Card</span>
            </button>
          )}

          {activeTab === 'individual' && (
            !isEditing ? (
              <button
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>{existingReport ? 'Edit Scores' : 'Create Assessment'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAssessment}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Assessment</span>
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* PRINT-ONLY OFFICIAL HEADER */}
      <div className="hidden print:block pb-4 mb-4 border-b-2 border-slate-900 text-slate-950">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SchoolEmblem size="lg" />
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-900">
                Republic of Kenya · Ministry of Education
              </div>
              <h1 className="text-xl font-bold uppercase tracking-tight text-slate-950">
                {academy}
              </h1>
              <div className="text-xs font-medium text-slate-700">
                Official CBC Terminal Assessment Register & Performance Record
              </div>
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="font-mono font-bold text-slate-900">ACADEMIC YEAR: {existingReport?.academicYear || '2025/2026'}</div>
            <div className="text-slate-600">CYCLE: {existingReport?.term || 'Term 3, 2026'}</div>
            <div className="text-[11px] font-bold text-emerald-900 mt-1">
              GRADE RANK: {currentRank === 0 ? '00' : `#${currentRank} OF ${totalInGrade}`} · T1: #{currentT1Rank || '00'} · T2: #{currentT2Rank || '00'} · END TERM: #{currentEndTermRank || '00'}
            </div>
          </div>
        </div>
        {selectedStudent && (
          <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-300 text-xs">
            <div><span className="font-semibold text-slate-600">Learner:</span> <span className="font-bold">{selectedStudent.fullName}</span></div>
            <div><span className="font-semibold text-slate-600">NEMIS UPI:</span> <span className="font-mono font-bold">{selectedStudent.nemisUpi}</span></div>
            <div><span className="font-semibold text-slate-600">Grade / Cohort:</span> <span className="font-bold">{selectedStudent.grade} ({selectedStudent.section})</span></div>
          </div>
        )}
      </div>

      {/* TAB 1: INDIVIDUAL LEARNER REGISTER */}
      {activeTab === 'individual' && (
        <div className="space-y-6">
          {/* Student Selector & KPI Strip - Hidden in print */}
          <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                  Select Enrolled Learner
                </label>
                <select
                  value={selectedStudentId}
                  disabled={students.length === 0}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    setIsEditing(false);
                  }}
                  className="mt-0.5 text-sm font-semibold text-slate-900 bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer disabled:text-slate-400"
                >
                  {students.length > 0 ? (
                    students.map(s => {
                      const r = cohortRankings.find(cr => cr.student.id === s.id);
                      return (
                        <option key={s.id} value={s.id}>
                          #{r?.rankOverall || '-'} {s.fullName} — {s.grade}
                        </option>
                      );
                    })
                  ) : (
                    <option value="">No enrolled learners yet</option>
                  )}
                </select>
              </div>
            </div>

            {selectedStudent && (
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs text-slate-600 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
                {/* Grade Overall Ranking Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-950">
                  <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-[9.5px] text-amber-700 block font-bold uppercase leading-none">Grade Overall Rank</span>
                    <span className="font-mono text-xs font-black text-amber-900">
                      {currentRank === 0 ? '00 (Unranked)' : `Rank #${currentRank}`} <span className="font-normal text-[10px]">of {totalInGrade}</span>
                    </span>
                  </div>
                </div>

                {/* Term 1 Rank */}
                <div className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950">
                  <span className="text-[9.5px] text-emerald-700 block font-bold uppercase leading-none">Term 1 Rank</span>
                  <span className="font-mono text-xs font-bold text-emerald-900">
                    {currentT1Rank === 0 ? '00 (Pending)' : `#${currentT1Rank} of ${totalInGrade}`}
                  </span>
                </div>

                {/* Term 2 Rank */}
                <div className="px-2.5 py-1.5 bg-sky-50 border border-sky-200 rounded-lg text-sky-950">
                  <span className="text-[9.5px] text-sky-700 block font-bold uppercase leading-none">Term 2 Rank</span>
                  <span className="font-mono text-xs font-bold text-sky-900">
                    {currentT2Rank === 0 ? '00 (Pending)' : `#${currentT2Rank} of ${totalInGrade}`}
                  </span>
                </div>

                {/* End Term Rank */}
                <div className="px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-950">
                  <span className="text-[9.5px] text-amber-700 block font-bold uppercase leading-none">End Term Rank</span>
                  <span className="font-mono text-xs font-bold text-amber-900">
                    {currentEndTermRank === 0 ? '00 (Pending)' : `#${currentEndTermRank} of ${totalInGrade}`}
                  </span>
                </div>

                {/* Grand Total */}
                <div>
                  <span className="text-[9.5px] text-slate-400 block font-bold uppercase leading-none">Grand Total</span>
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {computedTotals.grandTotal === 0 ? '00' : computedTotals.grandTotal} <span className="text-[10px] font-normal text-slate-500">/ {computedTotals.maxPossibleMarks}</span>
                  </span>
                </div>

                {/* Mean % */}
                <div>
                  <span className="text-[9.5px] text-slate-400 block font-bold uppercase leading-none">Mean Score</span>
                  <span className="font-mono text-xs font-bold text-emerald-800">
                    {computedTotals.grandTotal === 0 ? '00%' : `${computedTotals.meanScore}%`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Main Content: Either Editor or Viewer */}
          {isEditing ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      Edit Assessment Marks — {selectedStudent?.fullName}
                    </h2>
                    <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                      Rank #{currentRank} of {totalInGrade}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enter individual marks (0-100) for TERM 1, TERM 2, and END TERM EXAM. Subject totals, grand totals, and class ranking update in real time.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Term"
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="Year"
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
              </div>

              {/* Table of Learning Areas for editing with 3 columns x 3 subheadings + Totals Footer */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
                      <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-300">Names</th>
                      <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-300">Learning Area</th>
                      <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-300 w-28">Facilitator</th>
                      
                      {/* COLUMN 1: TERM 1 */}
                      <th colSpan={3} className="py-2 px-2 text-center border-r border-slate-300 bg-emerald-100/70 text-emerald-950 font-bold">
                        TERM 1
                      </th>

                      {/* COLUMN 2: TERM 2 */}
                      <th colSpan={3} className="py-2 px-2 text-center border-r border-slate-300 bg-sky-100/70 text-sky-950 font-bold">
                        TERM 2
                      </th>

                      {/* COLUMN 3: END TERM EXAM */}
                      <th colSpan={3} className="py-2 px-2 text-center border-r border-slate-300 bg-amber-100/70 text-amber-950 font-bold">
                        END TERM EXAM
                      </th>

                      <th rowSpan={2} className="py-2.5 px-2 text-center border-r border-slate-300 w-20">Total (900)</th>
                      <th rowSpan={2} className="py-2.5 px-2 text-center border-r border-slate-300 w-16">Mean %</th>
                      <th rowSpan={2} className="py-2.5 px-3 min-w-[160px]">Strands / Remarks</th>
                    </tr>
                    <tr className="border-b border-slate-300 text-slate-700 text-[10.5px]">
                      {/* TERM 1 Subheadings */}
                      <th className="py-1.5 px-1 text-center bg-emerald-50 text-emerald-900 border-r border-slate-200 w-16 font-semibold">
                        Opener (100)
                      </th>
                      <th className="py-1.5 px-1 text-center bg-emerald-50 text-emerald-900 border-r border-slate-200 w-16 font-semibold">
                        Mid (100)
                      </th>
                      <th className="py-1.5 px-1 text-center bg-emerald-50 text-emerald-900 border-r border-slate-300 w-16 font-semibold">
                        End (100)
                      </th>

                      {/* TERM 2 Subheadings */}
                      <th className="py-1.5 px-1 text-center bg-sky-50 text-sky-900 border-r border-slate-200 w-16 font-semibold">
                        Opener 
                      </th>
                      <th className="py-1.5 px-1 text-center bg-sky-50 text-sky-900 border-r border-slate-200 w-16 font-semibold">
                        Mid 
                      </th>
                      <th className="py-1.5 px-1 text-center bg-sky-50 text-sky-900 border-r border-slate-300 w-16 font-semibold">
                        End 
                      </th>

                      {/* END TERM EXAM Subheadings */}
                      <th className="py-1.5 px-1 text-center bg-amber-50 text-amber-900 border-r border-slate-200 w-16 font-semibold">
                        Opener 
                      </th>
                      <th className="py-1.5 px-1 text-center bg-amber-50 text-amber-900 border-r border-slate-200 w-16 font-semibold">
                        Mid 
                      </th>
                      <th className="py-1.5 px-1 text-center bg-amber-50 text-amber-900 border-r border-slate-300 w-16 font-semibold">
                        End 
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {learningAreas.map((area, idx) => {
                      const subjectTotal = (
                        (area.term1Opener ?? 0) + (area.term1Mid ?? 0) + (area.term1End ?? 0) +
                        (area.term2Opener ?? 0) + (area.term2Mid ?? 0) + (area.term2End ?? 0) +
                        (area.term3Opener ?? 0) + (area.term3Mid ?? 0) + (area.term3End ?? 0)
                      );
                      return (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                            <div>{selectedStudent?.fullName}</div>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-200">
                            {area.learningArea}
                          </td>
                          <td className="py-2.5 px-2 text-slate-600 border-r border-slate-200">
                            <input
                              type="text"
                              value={area.facilitator}
                              onChange={(e) => {
                                const updated = [...learningAreas];
                                updated[idx].facilitator = e.target.value;
                                setLearningAreas(updated);
                              }}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                            />
                          </td>

                          {/* COLUMN 1: TERM 1 Inputs */}
                          <td className="py-2 px-1 text-center border-r border-slate-100 bg-emerald-50/20">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={area.term1Opener ?? 0}
                              onChange={(e) => handleExamScoreChange(idx, 'term1Opener', Number(e.target.value))}
                              className="w-13 px-1 py-1 font-mono font-bold text-center bg-white border border-slate-300 rounded text-xs"
                            />
                          </td>
                          <td className="py-2 px-1 text-center border-r border-slate-100 bg-emerald-50/20">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={area.term1Mid ?? 0}
                              onChange={(e) => handleExamScoreChange(idx, 'term1Mid', Number(e.target.value))}
                              className="w-13 px-1 py-1 font-mono font-bold text-center bg-white border border-slate-300 rounded text-xs"
                            />
                          </td>
                          <td className="py-2 px-1 text-center border-r border-slate-300 bg-emerald-50/30">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={area.term1End ?? 0}
                              onChange={(e) => handleExamScoreChange(idx, 'term1End', Number(e.target.value))}
                              className="w-13 px-1 py-1 font-mono font-bold text-center bg-white border border-slate-300 rounded text-xs"
                            />
                          </td>

                          {/* COLUMN 2: TERM 2 Inputs */}
                          <td className="py-2 px-1 text-center border-r border-slate-100 bg-sky-50/20">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={area.term2Opener ?? 0}
                              onChange={(e) => handleExamScoreChange(idx, 'term2Opener', Number(e.target.value))}
                              className="w-13 px-1 py-1 font-mono font-bold text-center bg-white border border-slate-300 rounded text-xs"
                            />
                          </td>
                          <td className="py-2 px-1 text-center border-r border-slate-100 bg-sky-50/20">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={area.term2Mid ?? 0}
                              onChange={(e) => handleExamScoreChange(idx, 'term2Mid', Number(e.target.value))}
                              className="w-13 px-1 py-1 font-mono font-bold text-center bg-white border border-slate-300 rounded text-xs"
                            />
                          </td>
                          <td className="py-2 px-1 text-center border-r border-slate-300 bg-sky-50/30">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={area.term2End ?? 0}
                              onChange={(e) => handleExamScoreChange(idx, 'term2End', Number(e.target.value))}
                              className="w-13 px-1 py-1 font-mono font-bold text-center bg-white border border-slate-300 rounded text-xs"
                            />
                          </td>

                          {/* COLUMN 3: TERM 3 EXAM Inputs */}
                          <td className="py-2 px-1 text-center border-r border-slate-100 bg-amber-50/20">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={area.term3Opener ?? 0}
                              onChange={(e) => handleExamScoreChange(idx, 'term3Opener', Number(e.target.value))}
                              className="w-13 px-1 py-1 font-mono font-bold text-center bg-white border border-slate-300 rounded text-xs"
                            />
                          </td>
                          <td className="py-2 px-1 text-center border-r border-slate-100 bg-amber-50/20">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={area.term3Mid ?? 0}
                              onChange={(e) => handleExamScoreChange(idx, 'term3Mid', Number(e.target.value))}
                              className="w-13 px-1 py-1 font-mono font-bold text-center bg-white border border-slate-300 rounded text-xs"
                            />
                          </td>
                          <td className="py-2 px-1 text-center border-r border-slate-300 bg-amber-50/30">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={area.term3End ?? 0}
                              onChange={(e) => handleExamScoreChange(idx, 'term3End', Number(e.target.value))}
                              className="w-13 px-1 py-1 font-mono font-bold text-center bg-white border border-slate-300 rounded text-xs"
                            />
                          </td>

                          {/* Subject Total & Mean & Rubric */}
                          <td className="py-2.5 px-2 font-mono font-bold text-slate-800 text-center border-r border-slate-200">
                            {subjectTotal === 0 ? '00' : subjectTotal}
                          </td>
                          <td className="py-2.5 px-2 font-mono font-black text-emerald-950 text-center border-r border-slate-200">
                            {subjectTotal === 0 ? '00%' : `${area.totalScore}%`}
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={area.competencyRemark}
                              onChange={(e) => {
                                const updated = [...learningAreas];
                                updated[idx].competencyRemark = e.target.value;
                                setLearningAreas(updated);
                              }}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* SUMMARY TOTALS FOOTER */}
                  <tfoot className="border-t-2 border-slate-400 bg-slate-100 font-bold text-slate-950 text-[11px]">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 uppercase tracking-wider border-r border-slate-300 font-black">
                        Grand Total Marks & Mean
                      </td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-200 bg-emerald-100/50">{computedTotals.t1o === 0 ? '00' : computedTotals.t1o}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-200 bg-emerald-100/50">{computedTotals.t1m === 0 ? '00' : computedTotals.t1m}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-300 bg-emerald-100/70">{computedTotals.t1e === 0 ? '00' : computedTotals.t1e}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-200 bg-sky-100/50">{computedTotals.t2o === 0 ? '00' : computedTotals.t2o}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-200 bg-sky-100/50">{computedTotals.t2m === 0 ? '00' : computedTotals.t2m}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-300 bg-sky-100/70">{computedTotals.t2e === 0 ? '00' : computedTotals.t2e}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-200 bg-amber-100/50">{computedTotals.t3o === 0 ? '00' : computedTotals.t3o}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-200 bg-amber-100/50">{computedTotals.t3m === 0 ? '00' : computedTotals.t3m}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-300 bg-amber-100/70">{computedTotals.t3e === 0 ? '00' : computedTotals.t3e}</td>
                      
                      <td className="py-2 px-2 text-center font-mono font-black text-slate-950 border-r border-slate-300 bg-slate-200/80">
                        {computedTotals.grandTotal === 0 ? '00' : computedTotals.grandTotal}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-black text-emerald-950 border-r border-slate-300 bg-emerald-100">
                        {computedTotals.grandTotal === 0 ? '00%' : `${computedTotals.meanScore}%`}
                      </td>
                      <td className="py-2 px-3 text-slate-800 text-[10.5px]">
                        Overall Rank: {currentRank === 0 ? <span className="font-mono font-bold text-slate-500">00 (Unranked)</span> : <span className="font-mono font-bold text-emerald-950">#{currentRank} of {totalInGrade}</span>}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Remarks and Co-curricular */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Community Service Learning (CSL) Project
                  </label>
                  <textarea
                    rows={2}
                    value={cslText}
                    onChange={(e) => setCslText(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Co-Curricular & Talent Development
                  </label>
                  <textarea
                    rows={2}
                    value={coCurricularText}
                    onChange={(e) => setCoCurricularText(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Class Facilitator's Comprehensive Remark
                  </label>
                  <textarea
                    rows={2}
                    value={facilitatorRemark}
                    onChange={(e) => setFacilitatorRemark(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Headteacher's Institutional Certification
                  </label>
                  <textarea
                    rows={2}
                    value={headTeacherRemark}
                    onChange={(e) => setHeadTeacherRemark(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          ) : existingReport ? (
            /* Report Card Display View */
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                    <span>{existingReport.term}</span>
                    <span aria-hidden="true">·</span>
                    <span>Academic Year {existingReport.academicYear}</span>
                  </div>
                  <h2 className="text-lg font-display font-bold text-slate-900 mt-0.5">
                    Official CBC Assessment Register
                  </h2>
                  <div className="text-xs text-slate-500">
                    Certified on {existingReport.issueDate} · Grand Total: <span className="font-mono font-bold text-slate-800">{computedTotals.grandTotal}</span> / {computedTotals.maxPossibleMarks} Marks
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center min-w-[90px]">
                    <span className="text-[10px] text-amber-800 font-bold uppercase block">Grade Rank</span>
                    <span className="font-mono text-2xl font-black text-amber-900">#{currentRank === 0 ? '00' : currentRank}</span>
                    <span className="text-[10px] text-amber-700 block font-medium">of {totalInGrade}</span>
                  </div>
                  {/* Mean Score */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center min-w-[90px]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Mean Score</span>
                    <span className="font-mono text-2xl font-bold text-slate-900">{existingReport.averageScore}%</span>
                    <span className="text-[10px] text-slate-400 block font-medium">Out of 100</span>
                  </div>
                </div>
              </div>

              {/* Learning Areas Table with 3 columns x 3 subheadings + Totals Footer */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
                      <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-300">Names</th>
                      <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-300">Learning Area</th>
                      <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-300">Facilitator</th>
                      
                      {/* COLUMN 1: TERM 1 */}
                      <th colSpan={3} className="py-2 px-2 text-center border-r border-slate-300 bg-emerald-100/70 text-emerald-950 font-bold">
                        TERM 1
                      </th>

                      {/* COLUMN 2: TERM 2 */}
                      <th colSpan={3} className="py-2 px-2 text-center border-r border-slate-300 bg-sky-100/70 text-sky-950 font-bold">
                        TERM 2
                      </th>

                      {/* COLUMN 3: TERM 3 EXAM */}
                      <th colSpan={3} className="py-2 px-2 text-center border-r border-slate-300 bg-amber-100/70 text-amber-950 font-bold">
                        END TERM EXAM
                      </th>

                      <th rowSpan={2} className="py-2.5 px-2 text-center border-r border-slate-300 w-20">Total (900)</th>
                      <th rowSpan={2} className="py-2.5 px-2 text-center border-r border-slate-300 w-16">Mean %</th>
                      <th rowSpan={2} className="py-2.5 px-3">Competency Remark</th>
                    </tr>
                    <tr className="border-b border-slate-300 text-slate-700 text-[10.5px]">
                      {/* TERM 1 Subheadings */}
                      <th className="py-1.5 px-2 text-center bg-emerald-50 text-emerald-900 border-r border-slate-200 font-semibold">
                        Opener (100)
                      </th>
                      <th className="py-1.5 px-2 text-center bg-emerald-50 text-emerald-900 border-r border-slate-200 font-semibold">
                        Mid (100)
                      </th>
                      <th className="py-1.5 px-2 text-center bg-emerald-50 text-emerald-900 border-r border-slate-300 font-semibold">
                        End (100)
                      </th>

                      {/* TERM 2 Subheadings */}
                      <th className="py-1.5 px-2 text-center bg-sky-50 text-sky-900 border-r border-slate-200 font-semibold">
                        Opener 
                      </th>
                      <th className="py-1.5 px-2 text-center bg-sky-50 text-sky-900 border-r border-slate-200 font-semibold">
                        Mid 
                      </th>
                      <th className="py-1.5 px-2 text-center bg-sky-50 text-sky-900 border-r border-slate-300 font-semibold">
                        End 
                      </th>

                      {/* TERM 3 EXAM Subheadings */}
                      <th className="py-1.5 px-2 text-center bg-amber-50 text-amber-900 border-r border-slate-200 font-semibold">
                        Opener 
                      </th>
                      <th className="py-1.5 px-2 text-center bg-amber-50 text-amber-900 border-r border-slate-200 font-semibold">
                        Mid 
                      </th>
                      <th className="py-1.5 px-2 text-center bg-amber-50 text-amber-900 border-r border-slate-300 font-semibold">
                        End 
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {existingReport.learningAreas.map((area, idx) => {
                      const subjectTotal = (
                        (area.term1Opener ?? 0) + (area.term1Mid ?? 0) + (area.term1End ?? 0) +
                        (area.term2Opener ?? 0) + (area.term2Mid ?? 0) + (area.term2End ?? 0) +
                        (area.term3Opener ?? 0) + (area.term3Mid ?? 0) + (area.term3End ?? 0)
                      );
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                            <div>{selectedStudent?.fullName}</div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900 border-r border-slate-200">
                            {area.learningArea}
                          </td>
                          <td className="py-3 px-2 text-slate-600 border-r border-slate-200">
                            {area.facilitator}
                          </td>

                          {/* TERM 1 scores */}
                          <td className="py-3 px-2 font-mono text-center text-slate-700 border-r border-slate-100 bg-emerald-50/10">
                            {(area.term1Opener ?? 0) === 0 ? '00' : (area.term1Opener ?? 0)}
                          </td>
                          <td className="py-3 px-2 font-mono text-center text-slate-700 border-r border-slate-100 bg-emerald-50/10">
                            {(area.term1Mid ?? 0) === 0 ? '00' : (area.term1Mid ?? 0)}
                          </td>
                          <td className="py-3 px-2 font-mono text-center text-slate-700 border-r border-slate-300 bg-emerald-50/20">
                            {(area.term1End ?? 0) === 0 ? '00' : (area.term1End ?? 0)}
                          </td>

                          {/* TERM 2 scores */}
                          <td className="py-3 px-2 font-mono text-center text-slate-700 border-r border-slate-100 bg-sky-50/10">
                            {(area.term2Opener ?? 0) === 0 ? '00' : (area.term2Opener ?? 0)}
                          </td>
                          <td className="py-3 px-2 font-mono text-center text-slate-700 border-r border-slate-100 bg-sky-50/10">
                            {(area.term2Mid ?? 0) === 0 ? '00' : (area.term2Mid ?? 0)}
                          </td>
                          <td className="py-3 px-2 font-mono text-center text-slate-700 border-r border-slate-300 bg-sky-50/20">
                            {(area.term2End ?? 0) === 0 ? '00' : (area.term2End ?? 0)}
                          </td>

                          {/*  TERM 3 EXAM scores */}
                          <td className="py-3 px-2 font-mono text-center text-slate-700 border-r border-slate-100 bg-amber-50/10">
                            {(area.term3Opener ?? 0) === 0 ? '00' : (area.term3Opener ?? 0)}
                          </td>
                          <td className="py-3 px-2 font-mono text-center text-slate-700 border-r border-slate-100 bg-amber-50/10">
                            {(area.term3Mid ?? 0) === 0 ? '00' : (area.term3Mid ?? 0)}
                          </td>
                          <td className="py-3 px-2 font-mono text-center text-slate-700 border-r border-slate-300 bg-amber-50/20">
                            {(area.term3End ?? 0) === 0 ? '00' : (area.term3End ?? 0)}
                          </td>

                          {/* Subject Total & Mean & Rubric */}
                          <td className="py-3 px-2 font-mono font-bold text-center text-slate-900 border-r border-slate-200">
                            {subjectTotal === 0 ? '00' : subjectTotal}
                          </td>
                          <td className="py-3 px-2 font-mono font-black text-center text-slate-900 border-r border-slate-200">
                            {subjectTotal === 0 ? '00%' : `${area.totalScore}%`}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {area.competencyRemark}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* SUMMARY TOTALS FOOTER */}
                  <tfoot className="border-t-2 border-slate-400 bg-slate-100 font-bold text-slate-950 text-[11px]">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 uppercase tracking-wider border-r border-slate-300 font-black">
                        Grand Total Marks & Mean
                      </td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-200 bg-emerald-100/50">{computedTotals.t1o === 0 ? '00' : computedTotals.t1o}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-200 bg-emerald-100/50">{computedTotals.t1m === 0 ? '00' : computedTotals.t1m}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-300 bg-emerald-100/70">{computedTotals.t1e === 0 ? '00' : computedTotals.t1e}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-200 bg-sky-100/50">{computedTotals.t2o === 0 ? '00' : computedTotals.t2o}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-200 bg-sky-100/50">{computedTotals.t2m === 0 ? '00' : computedTotals.t2m}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-300 bg-sky-100/70">{computedTotals.t2e === 0 ? '00' : computedTotals.t2e}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-200 bg-amber-100/50">{computedTotals.t3o === 0 ? '00' : computedTotals.t3o}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-200 bg-amber-100/50">{computedTotals.t3m === 0 ? '00' : computedTotals.t3m}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-300 bg-amber-100/70">{computedTotals.t3e === 0 ? '00' : computedTotals.t3e}</td>
                      
                      <td className="py-2 px-2 text-center font-mono font-black text-slate-950 border-r border-slate-300 bg-slate-200/80">
                        {computedTotals.grandTotal === 0 ? '00' : computedTotals.grandTotal}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-black text-emerald-950 border-r border-slate-300 bg-emerald-100">
                        {computedTotals.grandTotal === 0 ? '00%' : `${computedTotals.meanScore}%`}
                      </td>
                      <td className="py-2 px-3 text-slate-800 text-[10.5px]">
                        Overall Rank: {currentRank === 0 ? <span className="font-mono font-bold text-slate-500">00 (Unranked)</span> : <span className="font-mono font-bold text-emerald-950">#{currentRank} of {totalInGrade}</span>}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* 7 Core CBC Competencies Grid */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-3">
                  Assessment of 7 CBC Core Competencies
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {existingReport.coreCompetencies.map((comp, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{comp.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{comp.comment}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Values, CSL and Remarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-800 block mb-1">Community Service Learning (CSL)</span>
                  <p className="text-slate-600">{existingReport.communityServiceLearning}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-800 block mb-1">Co-Curricular & Club Activities</span>
                  <p className="text-slate-600">{existingReport.coCurricularActivities}</p>
                </div>

                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                  <span className="font-semibold text-emerald-950 block mb-1">Facilitator's Remark</span>
                  <p className="text-emerald-900">{existingReport.facilitatorRemark}</p>
                </div>

                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                  <span className="font-semibold text-emerald-950 block mb-1">Headteacher's Certification</span>
                  <p className="text-emerald-900">{existingReport.headTeacherRemark}</p>
                </div>
              </div>

              {/* Print certification signatures section */}
              <div className="hidden print:block pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <div className="font-bold text-slate-900">Class Facilitator Signature:</div>
                  <div className="mt-8 border-b border-slate-500 w-48"></div>
                  <div className="text-[10px] text-slate-500 mt-1">Tr. Sarah Wanjiku (JSS Lead Facilitator)</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900">Headteacher Certification & Seal:</div>
                  <div className="mt-8 border-b border-slate-500 w-48"></div>
                  <div className="text-[10px] text-slate-500 mt-1">Dr. Arthur Kemboi (Ph.D.) - Academic Directorate</div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h2 className="text-base font-bold text-slate-900">No Assessment Record Found</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                No CBC assessment record has been finalized for {selectedStudent?.fullName} yet. Create one now to record Term 1, Term 2, and End Term exam scores.
              </p>
              <button
                onClick={handleStartEdit}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Initialize CBC Assessment Register</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLASS BROADSHEET & MERIT RANKING */}
      {activeTab === 'broadsheet' && (
        <div className="space-y-4">
          {/* Controls: Grade Filter & Search */}
          <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search learner name or NEMIS UPI in merit roster..."
                  value={broadsheetSearch}
                  onChange={(e) => setBroadsheetSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Filter Grade</label>
                <select
                  value={broadsheetFilterGrade}
                  onChange={(e) => setBroadsheetFilterGrade(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                >
                  <option value="All">All Grades ({cohortRankings.length})</option>
                  {CBC_GRADES.map(g => {
                    const count = students.filter(s => s.grade === g).length;
                    return (
                      <option key={g} value={g}>{g} ({count})</option>
                    );
                  })}
                </select>
              </div>

              <div className="pt-4 sm:pt-0 flex items-center gap-2">
                <button
                  onClick={() => {
                    if (window.confirm('Reset all assessment data and rankings on the broadsheet to 00? This clears existing test marks unless re-entered by the teacher.')) {
                      resetAssessmentMarksToZero();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                  title="Reset all broadsheet and ranking entries to 00"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Broadsheet to 00</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Broadsheet</span>
                </button>
              </div>
            </div>
          </div>

          {/* Broadsheet Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-display font-bold text-slate-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-600" />
                  <span>Official Class Merit Ranking & Broadsheet</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Learners ranked dynamically by terminal examination scores across Term 1, Term 2, and End Term Exams within each grade cohort.
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 self-start sm:self-auto">
                {filteredBroadsheet.length} Ranked Learners
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3 text-center w-20">Grade Rank</th>
                    <th className="py-3 px-4">Names</th>
                    <th className="py-3 px-3">Grade / Cohort</th>
                    <th className="py-3 px-3 text-center bg-emerald-50 text-emerald-950">Term 1 (Total & Rank)</th>
                    <th className="py-3 px-3 text-center bg-sky-50 text-sky-950">Term 2 (Total & Rank)</th>
                    <th className="py-3 px-3 text-center bg-amber-50 text-amber-950">End Term (Total & Rank)</th>
                    <th className="py-3 px-3 text-center bg-slate-200 text-slate-950 font-black">Grand Total</th>
                    <th className="py-3 px-3 text-center bg-emerald-100 text-emerald-950 font-black">Mean %</th>
                    <th className="no-print py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBroadsheet.map(item => {
                    const isSelected = item.student.id === selectedStudentId;
                    return (
                      <tr 
                        key={item.student.id} 
                        className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-emerald-50/30' : ''}`}
                      >
                        {/* Rank Badge */}
                        <td className="py-3 px-3 text-center">
                          {!item.hasTeacherEntry || item.rankOverall === 0 ? (
                            <span className="inline-flex items-center justify-center font-mono font-bold text-xs w-7 h-7 rounded-full text-slate-400 bg-slate-100">
                              00
                            </span>
                          ) : (
                            <span className={`inline-flex items-center justify-center font-mono font-black text-xs px-2 py-1 rounded-full ${
                              item.rankOverall === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs' :
                              item.rankOverall === 2 ? 'bg-slate-200 text-slate-800 border border-slate-300' :
                              item.rankOverall === 3 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                              'text-slate-600 bg-slate-50'
                            }`}>
                              {item.rankOverall === 1 ? '🥇 #1' : item.rankOverall === 2 ? '🥈 #2' : item.rankOverall === 3 ? '🥉 #3' : `#${item.rankOverall}`}
                            </span>
                          )}
                        </td>

                        {/* Student Details */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.student.fullName}</div>
                          {item.student.nemisUpi && (
                            <div className="text-[11px] text-slate-500 font-mono">
                              NEMIS UPI: {item.student.nemisUpi}
                            </div>
                          )}
                        </td>

                        {/* Grade */}
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {item.student.grade} ({item.student.section})
                        </td>

                        {/* Term 1 Total & Rank */}
                        <td className="py-3 px-3 font-mono text-center text-slate-700 bg-emerald-50/20">
                          <div className="font-bold">{!item.hasT1Entry || item.t1Sum === 0 ? '00' : item.t1Sum}</div>
                          <div className="text-[10px] text-emerald-800 font-semibold">
                            {item.rankT1 > 0 ? `Rank #${item.rankT1}` : 'Pending'}
                          </div>
                        </td>

                        {/* Term 2 Total & Rank */}
                        <td className="py-3 px-3 font-mono text-center text-slate-700 bg-sky-50/20">
                          <div className="font-bold">{!item.hasT2Entry || item.t2Sum === 0 ? '00' : item.t2Sum}</div>
                          <div className="text-[10px] text-sky-800 font-semibold">
                            {item.rankT2 > 0 ? `Rank #${item.rankT2}` : 'Pending'}
                          </div>
                        </td>

                        {/*  Term 3 Total & Rank */}
                        <td className="py-3 px-3 font-mono text-center text-slate-700 bg-amber-50/20">
                          <div className="font-bold">{!item.hasT3Entry || item.t3Sum === 0 ? '00' : item.t3Sum}</div>
                          <div className="text-[10px] text-amber-800 font-semibold">
                            {item.rankEndTerm > 0 ? `Rank #${item.rankEndTerm}` : 'Pending'}
                          </div>
                        </td>

                        {/* Grand Total */}
                        <td className="py-3 px-3 font-mono font-black text-center text-slate-950 bg-slate-100">
                          {!item.hasTeacherEntry || item.grandTotal === 0 ? '00' : item.grandTotal}
                        </td>

                        {/* Mean Score */}
                        <td className="py-3 px-3 font-mono font-black text-center text-emerald-950 bg-emerald-50">
                          {!item.hasTeacherEntry || item.meanScore === 0 ? '00%' : `${item.meanScore}%`}
                        </td>

                        {/* Actions */}
                        <td className="no-print py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedStudentId(item.student.id);
                                setActiveTab('individual');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                            >
                              View Register
                            </button>
                            <button
                              onClick={() => onOpenReportCardModal(item.student.id)}
                              title="Print Official Report Card"
                              className="p-1 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
