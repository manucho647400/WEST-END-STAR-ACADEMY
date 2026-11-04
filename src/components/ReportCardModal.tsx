import React, { useMemo, useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Printer, X, Award, CheckCircle2, ShieldCheck, Check, Trophy, Cloud, ExternalLink } from 'lucide-react';
import { computeCohortRankings, buildLearningAreasForStudent } from '../data/initialData';
import { SchoolEmblem } from './SchoolEmblem';
import { 
  exportReportCardToGoogleDrive, 
  getDriveAccessToken, 
  signInWithGoogleDrive 
} from '../services/googleDriveService';

interface ReportCardModalProps {
  studentId: string;
  onClose: () => void;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({
  studentId,
  onClose
}) => {
  const { students, reportCards, academy } = useSchool();
  const student = students.find(s => s.id === studentId);
  const report = student ? reportCards[student.id] : null;

  const cohortRankings = useMemo(() => {
    return computeCohortRankings(students, reportCards);
  }, [students, reportCards]);

  const rankInfo = cohortRankings.find(r => r.student.id === studentId);
  const rankOverall = rankInfo?.hasTeacherEntry ? rankInfo.rankOverall : (report?.classRank || 0);
  const rankT1 = rankInfo?.hasT1Entry ? rankInfo.rankT1 : 0;
  const rankT2 = rankInfo?.hasT2Entry ? rankInfo.rankT2 : 0;
  const rankT3 = rankInfo?.hasT3Entry ? rankInfo.rankT3 : 0;
  const rankEndTerm = rankT3;
  const totalInGrade = rankInfo?.totalInGrade || report?.totalInClass || students.length;

  const displayAreas = useMemo(() => {
    if (!student || !report) return [];
    return buildLearningAreasForStudent(student.grade, report.learningAreas || []);
  }, [student, report]);

  if (!student || !report) return null;

  const [driveSaving, setDriveSaving] = useState(false);
  const [driveResult, setDriveResult] = useState<{ success: boolean; link?: string; message?: string } | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveToDrive = async () => {
    setDriveSaving(true);
    setDriveResult(null);
    try {
      let token = getDriveAccessToken();
      if (!token) {
        const authRes = await signInWithGoogleDrive();
        token = authRes.accessToken;
      }
      const uploaded = await exportReportCardToGoogleDrive(student, report, rankInfo, academy);
      setDriveResult({
        success: true,
        link: uploaded.webViewLink,
        message: 'Saved to Google Drive Archive!'
      });
    } catch (err: any) {
      setDriveResult({
        success: false,
        message: err.message || 'Failed to save to Google Drive.'
      });
    } finally {
      setDriveSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Floating Tool Controls - Hidden in print */}
        <div className="no-print bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-emerald-400">Official Document Preview</span>
            <span aria-hidden="true">·</span>
            <span>{student.fullName}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleSaveToDrive}
              disabled={driveSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors shadow-xs"
              title="Upload learner report card directly to your Google Drive archive"
            >
              {driveSaving ? (
                <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Cloud className="w-3.5 h-3.5" />
              )}
              <span>{driveSaving ? 'Saving to Drive...' : 'Save to Google Drive'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report Card</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drive Save Notification Toast */}
        {driveResult && (
          <div className={`no-print px-6 py-2.5 text-xs flex items-center justify-between gap-3 ${
            driveResult.success ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200' : 'bg-rose-50 text-rose-900 border-b border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${driveResult.success ? 'text-emerald-600' : 'text-rose-600'}`} />
              <span>{driveResult.message}</span>
            </div>
            {driveResult.link && (
              <a
                href={driveResult.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold underline text-blue-700 hover:text-blue-800"
              >
                <span>View File in Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Printable Official Document Body */}
        <div className="p-6 sm:p-10 bg-white text-slate-900 space-y-6 print:p-0 print:space-y-4">
          {/* Header Lockup with Coat / Crest */}
          <div className="text-center border-b-2 border-emerald-950 pb-5">
            <div className="flex items-center justify-center gap-4 mb-2">
              <SchoolEmblem size="lg" />
              <div className="text-left sm:text-center">
                <span className="text-[11px] font-bold text-slate-600 tracking-widest uppercase block">
                  Republic of Kenya · Ministry of Education
                </span>
                <h1 className="text-xl sm:text-2xl font-display font-black text-emerald-950 uppercase tracking-tight">
                  {academy}
                </h1>
                <p className="text-xs text-slate-700 italic">
                  "Sapientia et Stella — Wisdom and Excellence in Competency Based Learning"
                </p>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  P.O. Box 333-20200 NaKURU · Tel: +254 700678355 · Email: info@westendstar.ac.ke
                </div>
              </div>
            </div>

            <div className="mt-3 inline-block px-4 py-1 bg-emerald-900 text-white font-bold text-xs uppercase tracking-wider rounded-sm print:bg-emerald-950">
              Official Learner Assessment Report (KNEC Aligned)
            </div>
          </div>

          {/* Learner Biodata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-300 rounded-lg text-xs">
            <div>
              <span className="text-[11px] text-slate-500 uppercase block">Learner Full Name</span>
              <span className="font-bold text-slate-950 text-sm">{student.fullName}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase block">Assessment Level</span>
              <span className="font-semibold text-slate-950">{student.grade}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase block">NEMIS UPI</span>
              <span className="font-mono font-bold text-slate-950">{student.nemisUpi}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase block">Birth Cert No</span>
              <span className="font-mono font-bold text-slate-950">{student.birthCertNo}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 uppercase block">Academic Cohort</span>
              <span className="font-semibold text-slate-900">{student.grade} ({student.section})</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase block">School House</span>
              <span className="font-semibold text-slate-900">{student.house}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase block">Assessment Term</span>
              <span className="font-semibold text-slate-900">{report.term}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase block">Term Attendance</span>
              <span className="font-mono font-semibold text-slate-900">{report.attendancePct}%</span>
            </div>
          </div>

          {/* Performance Overview Banner with separate Term 1, Term 2, End Term, and Grade rankings */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950 text-sm">Official Academic Performance Record</span>
                <span className="text-xs text-emerald-800">· Term 3 Assessment</span>
              </div>
              <div className="font-mono font-bold text-slate-800">
                Mean Score: <span className="text-emerald-950 font-extrabold text-sm">{report.averageScore}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/80 font-mono text-xs">
              <div className="bg-amber-100/90 p-2 rounded border border-amber-300 text-amber-950">
                <span className="text-[10px] uppercase font-bold text-amber-800 block">Grade Overall Rank</span>
                <span className="font-extrabold text-sm">
                  {rankOverall === 0 ? '00 (Unranked)' : `#${rankOverall} of ${totalInGrade}`}
                </span>
              </div>

              <div className="bg-emerald-100/80 p-2 rounded border border-emerald-300 text-emerald-950">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Term 1 Rank</span>
                <span className="font-extrabold text-sm block">
                  {rankT1 === 0 ? '00 (Pending)' : `#${rankT1} of ${totalInGrade}`}
                </span>
                <span className="text-[9.5px] text-emerald-900 block font-medium mt-0.5">
                  Op: {rankInfo?.rankT1Opener ? `#${rankInfo.rankT1Opener}` : '—'} · Mid: {rankInfo?.rankT1Mid ? `#${rankInfo.rankT1Mid}` : '—'} · End: {rankInfo?.rankT1End ? `#${rankInfo.rankT1End}` : '—'}
                </span>
              </div>

              <div className="bg-sky-100/80 p-2 rounded border border-sky-300 text-sky-950">
                <span className="text-[10px] uppercase font-bold text-sky-800 block">Term 2 Rank</span>
                <span className="font-extrabold text-sm block">
                  {rankT2 === 0 ? '00 (Pending)' : `#${rankT2} of ${totalInGrade}`}
                </span>
                <span className="text-[9.5px] text-sky-900 block font-medium mt-0.5">
                  Op: {rankInfo?.rankT2Opener ? `#${rankInfo.rankT2Opener}` : '—'} · Mid: {rankInfo?.rankT2Mid ? `#${rankInfo.rankT2Mid}` : '—'} · End: {rankInfo?.rankT2End ? `#${rankInfo.rankT2End}` : '—'}
                </span>
              </div>

              <div className="bg-amber-100/80 p-2 rounded border border-amber-300 text-amber-950">
                <span className="text-[10px] uppercase font-bold text-amber-800 block">Term 3 / End Term Rank</span>
                <span className="font-extrabold text-sm block">
                  {rankEndTerm === 0 ? '00 (Pending)' : `#${rankEndTerm} of ${totalInGrade}`}
                </span>
                <span className="text-[9.5px] text-amber-900 block font-medium mt-0.5">
                  Op: {rankInfo?.rankT3Opener ? `#${rankInfo.rankT3Opener}` : '—'} · Mid: {rankInfo?.rankT3Mid ? `#${rankInfo.rankT3Mid}` : '—'} · End: {rankInfo?.rankT3End ? `#${rankInfo.rankT3End}` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Learning Areas Table */}
          <div className="border border-slate-300 rounded-lg overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-[10.5px]">
                  <th rowSpan={2} className="py-2 px-2.5 border-r border-slate-300">Names</th>
                  <th rowSpan={2} className="py-2 px-2.5 border-r border-slate-300">Learning Area</th>
                  {/* COLUMN 1: TERM 1 */}
                  <th colSpan={3} className="py-1.5 px-1 text-center border-r border-slate-300 bg-emerald-50 text-emerald-950 font-bold">
                    TERM 1
                  </th>
                  {/* COLUMN 2: TERM 2 */}
                  <th colSpan={3} className="py-1.5 px-1 text-center border-r border-slate-300 bg-sky-50 text-sky-950 font-bold">
                    TERM 2
                  </th>
                  {/* COLUMN 3:  TERM 3 */}
                  <th colSpan={3} className="py-1.5 px-1 text-center border-r border-slate-300 bg-amber-100 text-amber-950 font-bold">
                    END TERM EXAM
                  </th>
                  <th rowSpan={2} className="py-2 px-2 text-center border-r border-slate-300 w-16">Average</th>
                  <th rowSpan={2} className="py-2 px-2.5">Competencies & Remarks</th>
                </tr>
                <tr className="border-b border-slate-300 text-slate-700 text-[10px]">
                  <th className="py-1 px-1 text-center border-r border-slate-200 font-semibold bg-white">Opener (100)</th>
                  <th className="py-1 px-1 text-center border-r border-slate-200 font-semibold bg-white">Mid (100)</th>
                  <th className="py-1 px-1 text-center border-r border-slate-300 font-semibold bg-white">End (100)</th>
                  <th className="py-1 px-1 text-center border-r border-slate-200 font-semibold bg-white">Opener (100)</th>
                  <th className="py-1 px-1 text-center border-r border-slate-200 font-semibold bg-white">Mid (100)</th>
                  <th className="py-1 px-1 text-center border-r border-slate-300 font-semibold bg-white">End (100)</th>
                  <th className="py-1 px-1 text-center border-r border-slate-200 font-semibold bg-white">Opener (100)</th>
                  <th className="py-1 px-1 text-center border-r border-slate-200 font-semibold bg-white">Mid (100)</th>
                  <th className="py-1 px-1 text-center border-r border-slate-300 font-semibold bg-white">End (100)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {displayAreas.map((area, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                    <td className="py-2 px-2.5 font-bold text-slate-950 border-r border-slate-200 whitespace-nowrap">
                      <div>{student.fullName}</div>
                    </td>
                    <td className="py-2 px-2.5 font-semibold text-slate-950 border-r border-slate-200">
                      <div>{area.learningArea}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{area.facilitator}</div>
                    </td>
                    {/* TERM 1 */}
                    <td className="py-2 px-1 font-mono text-center text-slate-800 border-r border-slate-100">
                      {area.term1Opener ?? area.formativeScore ?? 0}
                    </td>
                    <td className="py-2 px-1 font-mono text-center text-slate-800 border-r border-slate-100">
                      {area.term1Mid ?? 0}
                    </td>
                    <td className="py-2 px-1 font-mono text-center text-slate-800 border-r border-slate-300">
                      {area.term1End ?? 0}
                    </td>
                    {/* TERM 2 */}
                    <td className="py-2 px-1 font-mono text-center text-slate-800 border-r border-slate-100">
                      {area.term2Opener ?? 0}
                    </td>
                    <td className="py-2 px-1 font-mono text-center text-slate-800 border-r border-slate-100">
                      {area.term2Mid ?? 0}
                    </td>
                    <td className="py-2 px-1 font-mono text-center text-slate-800 border-r border-slate-300">
                      {area.term2End ?? 0}
                    </td>
                    {/*  TERM 3 */}
                    <td className="py-2 px-1 font-mono text-center text-slate-800 border-r border-slate-100">
                      {area.term3Opener ?? 0}
                    </td>
                    <td className="py-2 px-1 font-mono text-center text-slate-800 border-r border-slate-100">
                      {area.term3Mid ?? 0}
                    </td>
                    <td className="py-2 px-1 font-mono text-center text-slate-800 border-r border-slate-300">
                      {area.term3End ?? area.summativeScore ?? 0}
                    </td>
                    {/* Average */}
                    <td className="py-2 px-2 font-mono font-bold text-center text-slate-950 border-r border-slate-200">
                      {area.totalScore}%
                    </td>
                    <td className="py-2 px-2.5 text-slate-700">
                      <div className="font-medium text-slate-900 text-[10.5px]">{area.strandsCovered}</div>
                      <div className="text-[10.5px] text-slate-600">{area.competencyRemark}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {(() => {
                const t1o = report.learningAreas.reduce((acc, a) => acc + (a.term1Opener ?? a.formativeScore ?? 0), 0);
                const t1m = report.learningAreas.reduce((acc, a) => acc + (a.term1Mid ?? 0), 0);
                const t1e = report.learningAreas.reduce((acc, a) => acc + (a.term1End ?? 0), 0);
                const t2o = report.learningAreas.reduce((acc, a) => acc + (a.term2Opener ?? 0), 0);
                const t2m = report.learningAreas.reduce((acc, a) => acc + (a.term2Mid ?? 0), 0);
                const t2e = report.learningAreas.reduce((acc, a) => acc + (a.term2End ?? 0), 0);
                const t3o = report.learningAreas.reduce((acc, a) => acc + (a.term3Opener ?? 0), 0);
                const t3m = report.learningAreas.reduce((acc, a) => acc + (a.term3Mid ?? 0), 0);
                const t3e = report.learningAreas.reduce((acc, a) => acc + (a.term3End ?? a.summativeScore ?? 0), 0);
                const grandTotal = t1o + t1m + t1e + t2o + t2m + t2e + t3o + t3m + t3e;
                const totalExams = report.learningAreas.length * 9;
                const overallAvg = totalExams > 0 ? Math.round((grandTotal / totalExams) * 10) / 10 : 0;
                return (
                  <tfoot className="border-t-2 border-slate-400 bg-slate-100 font-bold text-slate-950 text-[10.5px]">
                    <tr>
                      <td colSpan={2} className="py-2.5 px-2.5 uppercase tracking-wide border-r border-slate-300 font-black">
                        Total Marks & Mean
                      </td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-200">{t1o}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-200">{t1m}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-300">{t1e}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-200">{t2o}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-200">{t2m}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-300">{t2e}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-200">{t3o}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-200">{t3m}</td>
                      <td className="py-2 px-1 text-center font-mono border-r border-slate-300">{t3e}</td>
                      <td className="py-2 px-2 text-center font-mono text-emerald-950 font-extrabold border-r border-slate-200">
                        {overallAvg}%
                      </td>
                      <td className="py-2 px-2.5 text-slate-800 text-[10.5px]">
                        Grand Total: <span className="font-mono font-extrabold">{grandTotal}</span> / {totalExams * 100} Marks
                      </td>
                    </tr>
                  </tfoot>
                );
              })()}
            </table>
          </div>

          {/* 7 Core CBC Competencies Grid */}
          <div className="border border-slate-300 rounded-lg p-3 bg-white space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              Assessment of Kenya CBC Core Competencies
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {report.coreCompetencies.map((comp, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-slate-50 rounded border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">{comp.name}</span>
                    <p className="text-slate-600 text-[10.5px] mt-0.5">{comp.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Values Observed & CSL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-900 block mb-1">Core Values Observed:</span>
              <div className="flex flex-wrap gap-1 text-[11px]">
                {report.valuesObserved.map((val, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-800 font-medium">
                    {val}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-900 block mb-1">Community Service Learning (CSL):</span>
              <p className="text-slate-700 text-[11px]">{report.communityServiceLearning}</p>
            </div>
          </div>

          {/* Co-Curricular & Club Activities */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="font-bold text-slate-900 block mb-0.5">Co-Curricular & Talent Development:</span>
            <p className="text-slate-700 text-[11px]">{report.coCurricularActivities}</p>
          </div>

          {/* Certification & Signatures with Stamped Seal */}
          <div className="pt-4 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-xs relative">
            <div>
              <span className="font-bold text-slate-900 block">Class Facilitator's Remark:</span>
              <p className="text-slate-700 italic text-[11px] mt-1">{report.facilitatorRemark}</p>
              <div className="mt-6 pt-2 border-t border-slate-400 text-slate-600 text-[11px]">
                Facilitator Signature: <span className="font-semibold text-slate-900">Signed & Verified</span>
              </div>
            </div>

            <div className="relative">
              <span className="font-bold text-slate-900 block">Headteacher's Institutional Certification:</span>
              <p className="text-slate-700 italic text-[11px] mt-1">{report.headTeacherRemark}</p>
              
              {/* Official Stamp Overlay */}
              <div className="mt-2 inline-block border-2 border-emerald-900 text-emerald-950 p-2 rounded-lg text-center font-bold text-[10px] uppercase tracking-wider transform -rotate-1 bg-emerald-50/50">
                ★ WEST END STAR ACADEMY ★<br />
                ACADEMIC DIRECTORATE CERTIFIED<br />
                DATE: {report.issueDate}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-400 text-slate-600 text-[11px]">
                Headteacher: <span className="font-semibold text-slate-900">Certified & Sealed</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-3">
            This is an official assessment record compliant with the Competency-Based Assessment Framework (CBA) of the Kenya National Examinations Council (KNEC).
          </div>
        </div>
      </div>
    </div>
  );
};
