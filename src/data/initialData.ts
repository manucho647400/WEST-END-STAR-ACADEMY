import { SchoolData, Student, ReportCard, CBCPerformanceLevel } from '../types';

export const INITIAL_SCHOOL_DATA: SchoolData = {
  academy: "West End Star Academy",
  curriculum: "Competency Based Curriculum (CBC)",
  exportedAt: new Date().toISOString(),
  enrolledLearnersCount: 0,
  students: [],
  staff: [],
  transactions: [],
  reportCards: {},
  notices: []
};

export const CBC_GRADES = [
  "Reception",
  "PP1 ",
  "PP2 ",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7 ",
  "Grade 8 ",
  "Grade 9 "
];

export const CBC_SECTIONS = ["Star", "Alpha", "Blue", "Gold"];
export const CBC_HOUSES = ["Sirius", "Canopus", "Polaris", "Vega"];

// CBC ASSESSMENT RECORD SUBJECTS BY GRADE TIER
// TIER 1: Reception - PP2
export const LEARNING_AREAS_RECEPTION_PP2 = [
  "Maths",
  "Language",
  "Literature",
  "Environment",
  "Creative Art",
  "Religion"
];

// TIER 2: Grade 1 - Grade 3
export const LEARNING_AREAS_GRADE1_3 = [
  "Maths",
  "English",
  "Literature",
  "Kiswahili",
  "Environment",
  "CRE",
  "Creative Art"
];

// TIER 3: Grade 4 - Grade 6
export const LEARNING_AREAS_GRADE4_6 = [
  "Maths",
  "English",
  "Kiswahili",
  "Science",
  "CRE",
  "Social Studies",
  "Agriculture",
  "Creative Art"
];

// TIER 4: Grade 7 - Grade 9 (Junior Secondary)
export const LEARNING_AREAS_GRADE7_9 = [
  "Maths",
  "English",
  "Kiswahili",
  "Science",
  "Pre Technical",
  "CRE",
  "Social Studies",
  "Agriculture",
  "Creative Art"
];

export const DEFAULT_LEARNING_AREAS_JSS = LEARNING_AREAS_GRADE7_9;

export const ALL_DISTINCT_LEARNING_AREAS = Array.from(new Set([
  ...LEARNING_AREAS_RECEPTION_PP2,
  ...LEARNING_AREAS_GRADE1_3,
  ...LEARNING_AREAS_GRADE4_6,
  ...LEARNING_AREAS_GRADE7_9
]));

export const getLearningAreasForGrade = (grade: string = ''): string[] => {
  const g = (grade || '').toLowerCase();
  if (g.includes('reception') || g.includes('pp1') || g.includes('pp2')) {
    return LEARNING_AREAS_RECEPTION_PP2;
  }
  if (g.includes('grade 1') || g.includes('grade 2') || g.includes('grade 3')) {
    return LEARNING_AREAS_GRADE1_3;
  }
  if (g.includes('grade 4') || g.includes('grade 5') || g.includes('grade 6')) {
    return LEARNING_AREAS_GRADE4_6;
  }
  if (g.includes('grade 7') || g.includes('grade 8') || g.includes('grade 9')) {
    return LEARNING_AREAS_GRADE7_9;
  }
  return LEARNING_AREAS_GRADE7_9;
};

export const getGradeTierLabel = (grade: string = ''): string => {
  const g = (grade || '').toLowerCase();
  if (g.includes('reception') || g.includes('pp1') || g.includes('pp2')) {
    return 'Reception - PP2 Tier (6 Learning Areas)';
  }
  if (g.includes('grade 1') || g.includes('grade 2') || g.includes('grade 3')) {
    return 'Grade 1 - Grade 3 Tier (7 Learning Areas)';
  }
  if (g.includes('grade 4') || g.includes('grade 5') || g.includes('grade 6')) {
    return 'Grade 4 - Grade 6 Tier (8 Learning Areas)';
  }
  if (g.includes('grade 7') || g.includes('grade 8') || g.includes('grade 9')) {
    return 'Grade 7 - Grade 9 Tier (9 Learning Areas)';
  }
  return 'CBC Assessment Record';
};

export const buildLearningAreasForStudent = (
  grade: string = '',
  existingAreas: any[] = []
): any[] => {
  const subjects = getLearningAreasForGrade(grade);
  return subjects.map(subject => {
    const sLower = subject.toLowerCase();
    const existing = existingAreas.find(a => {
      const aLower = (a.learningArea || '').toLowerCase();
      if (aLower === sLower) return true;
      if (sLower === 'maths' && aLower.includes('math')) return true;
      if (sLower === 'english' && aLower.includes('english')) return true;
      if (sLower === 'kiswahili' && aLower.includes('kiswahili')) return true;
      if (sLower === 'science' && aLower.includes('science')) return true;
      if (sLower === 'pre technical' && (aLower.includes('pre-technical') || aLower.includes('pre technical'))) return true;
      if ((sLower === 'cre' || sLower === 'religion') && (aLower.includes('cre') || aLower.includes('religio') || aLower.includes('ire'))) return true;
      if (sLower === 'creative art' && aLower.includes('creative')) return true;
      if (sLower === 'agriculture' && aLower.includes('agri')) return true;
      if (sLower === 'environment' && aLower.includes('environ')) return true;
      if (sLower === 'literature' && aLower.includes('lit')) return true;
      if (sLower === 'language' && aLower.includes('lang')) return true;
      if (sLower === 'social studies' && aLower.includes('social')) return true;
      return false;
    });

    if (existing) {
      return {
        ...existing,
        learningArea: subject
      };
    }

    return {
      learningArea: subject,
      facilitator: '',
      term1Opener: 0,
      term1Mid: 0,
      term1End: 0,
      term2Opener: 0,
      term2Mid: 0,
      term2End: 0,
      term3Opener: 0,
      term3Mid: 0,
      term3End: 0,
      totalScore: 0,
      performanceLevel: 'BE',
      rubricScore: 1,
      strandsCovered: '',
      competencyRemark: ''
    };
  });
};

export const CORE_COMPETENCIES_LIST = [
  "Communication and Collaboration",
  "Critical Thinking and Problem Solving",
  "Imagination and Creativity",
  "Citizenship",
  "Learning to Learn",
  "Self-Efficacy",
  "Digital Literacy"
];

export const CORE_VALUES_LIST = [
  "Love",
  "Responsibility",
  "Respect",
  "Integrity",
  "Peace",
  "Unity",
  "Patriotism",
  "Social Justice"
];

export interface CohortRankItem {
  student: Student;
  // Exam sub-totals
  t1oSum: number;
  t1mSum: number;
  t1eSum: number;
  t1Sum: number;

  t2oSum: number;
  t2mSum: number;
  t2eSum: number;
  t2Sum: number;

  t3oSum: number;
  t3mSum: number;
  t3eSum: number;
  t3Sum: number;

  grandTotal: number;
  totalPossibleMarks: number;
  t1Mean: number;
  t2Mean: number;
  t3Mean: number;
  meanScore: number;
  rubricLevel: CBCPerformanceLevel;
  rubricScore: number;
  hasT1Entry: boolean;
  hasT2Entry: boolean;
  hasT3Entry: boolean;
  hasTeacherEntry: boolean;

  // Granular Exam Rankings within Grade Cohort
  rankT1Opener: number;
  rankT1Mid: number;
  rankT1End: number;
  rankT1: number;       // Term 1 Overall Rank

  rankT2Opener: number;
  rankT2Mid: number;
  rankT2End: number;
  rankT2: number;       // Term 2 Overall Rank

  rankT3Opener: number;
  rankT3Mid: number;
  rankT3End: number;
  rankT3: number;       // Term 3 Overall Rank
  rankEndTerm: number;  // Alias for rankT3

  rankOverall: number;  // Grade Overall Rank
  totalInGrade: number; // Total learners in this grade
}

export const computeCohortRankings = (
  students: Student[],
  reportCards: Record<string, ReportCard>
): CohortRankItem[] => {
  const rawItems: CohortRankItem[] = students.map(s => {
    const card = reportCards[s.id];
    let t1oSum = 0, t1mSum = 0, t1eSum = 0;
    let t2oSum = 0, t2mSum = 0, t2eSum = 0;
    let t3oSum = 0, t3mSum = 0, t3eSum = 0;
    let hasT1Entry = false;
    let hasT2Entry = false;
    let hasT3Entry = false;

    if (card?.learningAreas && card.learningAreas.length > 0) {
      card.learningAreas.forEach(a => {
        const o1 = a.term1Opener || 0;
        const m1 = a.term1Mid || 0;
        const e1 = a.term1End || 0;
        t1oSum += o1;
        t1mSum += m1;
        t1eSum += e1;
        if (o1 > 0 || m1 > 0 || e1 > 0) hasT1Entry = true;

        const o2 = a.term2Opener || 0;
        const m2 = a.term2Mid || 0;
        const e2 = a.term2End || 0;
        t2oSum += o2;
        t2mSum += m2;
        t2eSum += e2;
        if (o2 > 0 || m2 > 0 || e2 > 0) hasT2Entry = true;

        const o3 = a.term3Opener || 0;
        const m3 = a.term3Mid || 0;
        const e3 = a.term3End || 0;
        t3oSum += o3;
        t3mSum += m3;
        t3eSum += e3;
        if (o3 > 0 || m3 > 0 || e3 > 0) hasT3Entry = true;
      });
    }

    const t1Sum = t1oSum + t1mSum + t1eSum;
    const t2Sum = t2oSum + t2mSum + t2eSum;
    const t3Sum = t3oSum + t3mSum + t3eSum;
    const hasTeacherEntry = hasT1Entry || hasT2Entry || hasT3Entry;

    const subjectCount = getLearningAreasForGrade(s.grade).length || 8;
    const totalPossibleMarks = subjectCount * 9 * 100;
    const grandTotal = t1Sum + t2Sum + t3Sum;

    const t1Mean = (hasT1Entry && subjectCount > 0)
      ? Math.round((t1Sum / (subjectCount * 3)) * 10) / 10
      : 0;
    const t2Mean = (hasT2Entry && subjectCount > 0)
      ? Math.round((t2Sum / (subjectCount * 3)) * 10) / 10
      : 0;
    const t3Mean = (hasT3Entry && subjectCount > 0)
      ? Math.round((t3Sum / (subjectCount * 3)) * 10) / 10
      : 0;
    const meanScore = (hasTeacherEntry && subjectCount > 0)
      ? Math.round((grandTotal / (subjectCount * 9)) * 10) / 10
      : 0;

    let rubricLevel: CBCPerformanceLevel = 'BE';
    let rubricScore = 1;
    if (meanScore >= 80) { rubricLevel = 'EE'; rubricScore = 4; }
    else if (meanScore >= 65) { rubricLevel = 'ME'; rubricScore = 3; }
    else if (meanScore >= 50) { rubricLevel = 'AE'; rubricScore = 2; }

    return {
      student: s,
      t1oSum, t1mSum, t1eSum, t1Sum,
      t2oSum, t2mSum, t2eSum, t2Sum,
      t3oSum, t3mSum, t3eSum, t3Sum,
      grandTotal,
      totalPossibleMarks,
      t1Mean,
      t2Mean,
      t3Mean,
      meanScore,
      rubricLevel: hasTeacherEntry ? rubricLevel : 'BE',
      rubricScore: hasTeacherEntry ? rubricScore : 1,
      hasT1Entry,
      hasT2Entry,
      hasT3Entry,
      hasTeacherEntry,
      rankT1Opener: 0,
      rankT1Mid: 0,
      rankT1End: 0,
      rankT1: 0,
      rankT2Opener: 0,
      rankT2Mid: 0,
      rankT2End: 0,
      rankT2: 0,
      rankT3Opener: 0,
      rankT3Mid: 0,
      rankT3End: 0,
      rankT3: 0,
      rankEndTerm: 0,
      rankOverall: 0,
      totalInGrade: 0
    };
  });

  // Group by grade
  const gradeGroups: Record<string, typeof rawItems> = {};
  rawItems.forEach(item => {
    const g = item.student.grade || 'Unassigned';
    if (!gradeGroups[g]) gradeGroups[g] = [];
    gradeGroups[g].push(item);
  });

  // Rank each grade cohort independently for each exam and overall
  Object.values(gradeGroups).forEach(group => {
    const totalInGrade = group.length;
    group.forEach(i => { i.totalInGrade = totalInGrade; });

    // Helper ranker: sorts only learners with scores > 0 in this specific exam and handles ties
    const assignRanks = (
      scoreFn: (i: CohortRankItem) => number,
      setRankFn: (i: CohortRankItem, rank: number) => void
    ) => {
      const eligible = group.filter(i => scoreFn(i) > 0);
      eligible.sort((a, b) => scoreFn(b) - scoreFn(a));

      let currentRank = 1;
      for (let idx = 0; idx < eligible.length; idx++) {
        if (idx > 0 && scoreFn(eligible[idx]) < scoreFn(eligible[idx - 1])) {
          currentRank = idx + 1;
        }
        setRankFn(eligible[idx], currentRank);
      }

      group.forEach(item => {
        if (scoreFn(item) <= 0) {
          setRankFn(item, 0);
        }
      });
    };

    // TERM 1 Opener, Midterm, and End Term separately + Aggregate Term 1
    assignRanks(i => i.t1oSum, (i, r) => { i.rankT1Opener = r; });
    assignRanks(i => i.t1mSum, (i, r) => { i.rankT1Mid = r; });
    assignRanks(i => i.t1eSum, (i, r) => { i.rankT1End = r; });
    assignRanks(i => i.t1Sum, (i, r) => { i.rankT1 = r; });

    // TERM 2 Opener, Midterm, and End Term separately + Aggregate Term 2
    assignRanks(i => i.t2oSum, (i, r) => { i.rankT2Opener = r; });
    assignRanks(i => i.t2mSum, (i, r) => { i.rankT2Mid = r; });
    assignRanks(i => i.t2eSum, (i, r) => { i.rankT2End = r; });
    assignRanks(i => i.t2Sum, (i, r) => { i.rankT2 = r; });

    // TERM 3 / End Term Opener, Midterm, and End Term separately + Aggregate Term 3
    assignRanks(i => i.t3oSum, (i, r) => { i.rankT3Opener = r; });
    assignRanks(i => i.t3mSum, (i, r) => { i.rankT3Mid = r; });
    assignRanks(i => i.t3eSum, (i, r) => { i.rankT3End = r; });
    assignRanks(i => i.t3Sum, (i, r) => {
      i.rankT3 = r;
      i.rankEndTerm = r;
    });

    // Grade Overall Ranking (Grand Total across all terms)
    assignRanks(i => i.grandTotal, (i, r) => { i.rankOverall = r; });
  });

  return rawItems;
};
