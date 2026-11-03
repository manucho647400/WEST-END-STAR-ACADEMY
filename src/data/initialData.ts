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

export const CBC_SECTIONS = 


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
  t1Sum: number;
  t2Sum: number;
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
  rankT1: number;       // Rank in Term 1 within their grade (0 if unranked)
  rankT2: number;       // Rank in Term 2 within their grade (0 if unranked)
  rankEndTerm: number;  // Rank in End Term (Term 3) within their grade (0 if unranked)
  rankOverall: number;  // Overall Rank within their grade (0 if unranked)
  totalInGrade: number; // Total learners in this grade
}

export const computeCohortRankings = (
  students: Student[],
  reportCards: Record<string, ReportCard>
): CohortRankItem[] => {
  const rawItems = students.map(s => {
    const card = reportCards[s.id];
    let t1Sum = 0;
    let t2Sum = 0;
    let t3Sum = 0;
    let hasT1Entry = false;
    let hasT2Entry = false;
    let hasT3Entry = false;

    if (card?.learningAreas && card.learningAreas.length > 0) {
      card.learningAreas.forEach(a => {
        const t1 = (a.term1Opener || 0) + (a.term1Mid || 0) + (a.term1End || 0);
        const t2 = (a.term2Opener || 0) + (a.term2Mid || 0) + (a.term2End || 0);
        const t3 = (a.term3Opener || 0) + (a.term3Mid || 0) + (a.term3End || 0);
        if (t1 > 0) hasT1Entry = true;
        if (t2 > 0) hasT2Entry = true;
        if (t3 > 0) hasT3Entry = true;
        t1Sum += t1;
        t2Sum += t2;
        t3Sum += t3;
      });
    }

    const hasTeacherEntry = hasT1Entry || hasT2Entry || hasT3Entry;
    if (!hasTeacherEntry) {
      t1Sum = 0;
      t2Sum = 0;
      t3Sum = 0;
      hasT1Entry = false;
      hasT2Entry = false;
      hasT3Entry = false;
    }

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
      t1Sum,
      t2Sum,
      t3Sum,
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
      rankT1: 0,
      rankT2: 0,
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

  // Rank each grade cohort independently for Term 1, Term 2, End Term (Term 3), and Overall
  Object.values(gradeGroups).forEach(group => {
    const totalInGrade = group.length;
    group.forEach(i => { i.totalInGrade = totalInGrade; });

    // Term 1 Ranking
    const sortedT1 = [...group].sort((a, b) => {
      if (a.hasT1Entry && !b.hasT1Entry) return -1;
      if (!a.hasT1Entry && b.hasT1Entry) return 1;
      return b.t1Mean - a.t1Mean || b.t1Sum - a.t1Sum;
    });
    let t1Rank = 1;
    sortedT1.forEach(item => {
      item.rankT1 = item.hasT1Entry ? t1Rank++ : 0;
    });

    // Term 2 Ranking
    const sortedT2 = [...group].sort((a, b) => {
      if (a.hasT2Entry && !b.hasT2Entry) return -1;
      if (!a.hasT2Entry && b.hasT2Entry) return 1;
      return b.t2Mean - a.t2Mean || b.t2Sum - a.t2Sum;
    });
    let t2Rank = 1;
    sortedT2.forEach(item => {
      item.rankT2 = item.hasT2Entry ? t2Rank++ : 0;
    });

    // End Term (Term 3) Ranking
    const sortedT3 = [...group].sort((a, b) => {
      if (a.hasT3Entry && !b.hasT3Entry) return -1;
      if (!a.hasT3Entry && b.hasT3Entry) return 1;
      return b.t3Mean - a.t3Mean || b.t3Sum - a.t3Sum;
    });
    let t3Rank = 1;
    sortedT3.forEach(item => {
      item.rankEndTerm = item.hasT3Entry ? t3Rank++ : 0;
    });

    // Overall Ranking
    const sortedOverall = [...group].sort((a, b) => {
      if (a.hasTeacherEntry && !b.hasTeacherEntry) return -1;
      if (!a.hasTeacherEntry && b.hasTeacherEntry) return 1;
      return b.meanScore - a.meanScore || b.grandTotal - a.grandTotal;
    });
    let overallRank = 1;
    sortedOverall.forEach(item => {
      item.rankOverall = item.hasTeacherEntry ? overallRank++ : 0;
    });
  });

  return rawItems;
};
