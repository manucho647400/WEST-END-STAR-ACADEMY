export type CBCPerformanceLevel = 'EE' | 'ME' | 'AE' | 'BE';

export interface Student {
  id: string;
  fullName: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  dob: string;
  birthCertNo: string;
  nemisUpi: string;
  grade: string;
  section: string;
  house: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  address: string;
  totalFees: number;
  paidFees: number;
  feeBalance: number;
  scholarshipPct: number;
  enrollmentDate: string;
  status: 'Active' | 'Graduated' | 'Transferred' | 'Suspended';
  overallPerformanceLevel: CBCPerformanceLevel | '';
  healthNotes?: string;
  regNo: string;
  attendanceRate: number;
  bursaryAmount?: number;
  bursarySource?: string;
  bursaryStatus?: 'Approved' | 'Disbursed' | 'Pending Review' | 'None';
  bursaryRefNo?: string;
  avatarUrl?: string;
}

export interface StaffMember {
  id: string;
  staffNo: string;
  tscNumber: string;
  fullName: string;
  gender: 'Male' | 'Female' | '';
  email: string;
  phone: string;
  role: string;
  department?: string;
  assignedGrade?: string;
  assignedSection?: string;
  learningAreas?: string[];
  qualification?: string;
  joinDate: string;
  status: 'Active' | 'On Leave' | 'Retired';
  salaryStatus?: 'Paid' | 'Pending' | '';
  avatarUrl?: string;
}

export interface Transaction {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  regNo: string;
  nemisUpi: string;
  grade: string;
  amount: number;
  feeType: string;
  paymentMethod: string;
  mpesaRef?: string;
  date: string;
  term: string;
  academicYear: string;
  balanceRemaining: number;
  receivedBy: string;
  notes?: string;
}

export interface LearningAreaAssessment {
  learningArea: string;
  facilitator: string;
  // Term 1 (Each exam out of 100)
  term1Opener?: number;
  term1Mid?: number;
  term1End?: number;
  // Term 2 (Each exam out of 100)
  term2Opener?: number;
  term2Mid?: number;
  term2End?: number;
  // End Term Exam / Term 3 (Each exam out of 100)
  term3Opener?: number;
  term3Mid?: number;
  term3End?: number;
  // Backward compatibility
  formativeScore?: number;
  summativeScore?: number;
  totalScore: number;     // Average / mean score out of 100
  performanceLevel: CBCPerformanceLevel;
  rubricScore: number;    // 1 to 4
  strandsCovered: string;
  competencyRemark: string;
}

export interface CoreCompetency {
  name: string;
  rating: CBCPerformanceLevel;
  comment: string;
}

export interface ReportCard {
  studentId: string;
  term: string;
  academicYear: string;
  curriculum: string;
  overallPerformanceLevel: CBCPerformanceLevel;
  totalScore: number;
  averageScore: number;
  classRank: number;
  totalInClass: number;
  attendancePct: number;
  learningAreas: LearningAreaAssessment[];
  coreCompetencies: CoreCompetency[];
  valuesObserved: string[];
  communityServiceLearning: string;
  coCurricularActivities: string;
  facilitatorRemark: string;
  headTeacherRemark: string;
  issueDate: string;
}

export type UserRole = 'admin' | 'teacher' | 'parent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isVerified: boolean;
  authProvider: 'google' | 'email';
  createdAt?: string;
  // Role specific metadata
  tscNumber?: string;
  assignedGrade?: string;
  assignedSection?: string;
  learningAreas?: string[];
  department?: string;
  // Parent specific
  studentId?: string;
  studentRegNo?: string;
  studentName?: string;
  phone?: string;
}

export interface Notice {
  id: string;
  title: string;
  category: string;
  priority: 'Urgent' | 'High' | 'Normal';
  targetAudience: string;
  date: string;
  author: string;
  content: string;
}

export interface SchoolData {
  academy: string;
  curriculum: string;
  exportedAt: string;
  enrolledLearnersCount: number;
  students: Student[];
  staff: StaffMember[];
  transactions: Transaction[];
  reportCards: Record<string, ReportCard>;
  notices: Notice[];
}
