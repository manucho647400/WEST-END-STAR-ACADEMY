import React, { createContext, useContext, useState, useEffect } from 'react';
import { SchoolData, Student, StaffMember, Transaction, ReportCard, Notice, CBCPerformanceLevel } from '../types';
import { INITIAL_SCHOOL_DATA } from '../data/initialData';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

const STORAGE_KEY = 'wesa_clean_empty_live_data_v4';
const PREVIOUS_STORAGE_KEYS = [
  'wesa_clean_empty_live_data_v3',
  'wesa_clean_empty_live_data_v2',
  'wesa_clean_empty_live_data_v1',
  'west_end_star_academy_live_empty_v1',
  'west_end_star_academy_cbc_data_v1',
  'west_end_star_school_data_v1'
];

interface SchoolContextType {
  academy: string;
  curriculum: string;
  students: Student[];
  staff: StaffMember[];
  transactions: Transaction[];
  reportCards: Record<string, ReportCard>;
  notices: Notice[];
  addStudent: (data: Partial<Student>) => Student;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addStaff: (data: Partial<StaffMember>) => StaffMember;
  updateStaff: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaff: (id: string) => void;
  addTransaction: (tx: Partial<Transaction>) => Transaction;
  saveReportCard: (studentId: string, card: ReportCard) => void;
  addNotice: (notice: Partial<Notice>) => Notice;
  deleteNotice: (id: string) => void;
  resetAssessmentMarksToZero: () => void;
  resetToDefault: () => void;
  clearAllData: () => void;
  exportJSON: () => string;
  importJSON: (jsonString: string) => boolean;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<SchoolData>(() => {
    try {
      if (typeof window !== 'undefined') {
        PREVIOUS_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...INITIAL_SCHOOL_DATA,
            ...parsed,
            students: parsed.students || [],
            staff: parsed.staff || [],
            transactions: parsed.transactions || [],
            reportCards: parsed.reportCards || {},
            notices: parsed.notices || []
          };
        }
      }
    } catch (e) {
      console.error('Failed to load school data from storage', e);
    }
    return INITIAL_SCHOOL_DATA;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save school data to storage', e);
    }
  }, [data]);

  // Initial sync from Firestore
  useEffect(() => {
    async function syncFromFirestore() {
      try {
        const studentDocs = await getDocs(collection(db, 'students'));
        if (!studentDocs.empty) {
          const loadedStudents: Student[] = [];
          studentDocs.forEach(d => loadedStudents.push(d.data() as Student));
          setData(prev => ({
            ...prev,
            students: loadedStudents,
            enrolledLearnersCount: loadedStudents.length
          }));
        }

        const reportDocs = await getDocs(collection(db, 'reportCards'));
        if (!reportDocs.empty) {
          const loadedReports: Record<string, ReportCard> = {};
          reportDocs.forEach(d => { loadedReports[d.id] = d.data() as ReportCard; });
          setData(prev => ({
            ...prev,
            reportCards: { ...prev.reportCards, ...loadedReports }
          }));
        }

        const txDocs = await getDocs(collection(db, 'transactions'));
        if (!txDocs.empty) {
          const loadedTx: Transaction[] = [];
          txDocs.forEach(d => loadedTx.push(d.data() as Transaction));
          setData(prev => ({
            ...prev,
            transactions: loadedTx
          }));
        }
      } catch (e) {
        console.warn('Firestore initial sync note:', e);
      }
    }
    syncFromFirestore();
  }, []);

  const addStudent = (studentData: Partial<Student>): Student => {
    const nextIndex = data.students.length + 1;
    const year = new Date().getFullYear();
    const regNo = `WESA/CBC/${year}/${String(nextIndex).padStart(3, '0')}`;
    const id = `std-${Date.now()}`;
    const totalFees = studentData.totalFees !== undefined ? studentData.totalFees : 0;
    const paidFees = studentData.paidFees !== undefined ? studentData.paidFees : 0;
    const feeBalance = Math.max(0, totalFees - paidFees);

    const newStudent: Student = {
      id,
      regNo,
      fullName: studentData.fullName || '',
      gender: studentData.gender || '',
      dob: studentData.dob || '',
      birthCertNo: studentData.birthCertNo || '',
      nemisUpi: studentData.nemisUpi || '',
      grade: studentData.grade || '',
      section: studentData.section || '',
      house: studentData.house || '',
      guardianName: studentData.guardianName || '',
      guardianPhone: studentData.guardianPhone || '',
      guardianEmail: studentData.guardianEmail || '',
      address: studentData.address || '',
      totalFees,
      paidFees,
      feeBalance,
      scholarshipPct: studentData.scholarshipPct || 0,
      enrollmentDate: studentData.enrollmentDate || new Date().toISOString().split('T')[0],
      status: studentData.status || 'Active',
      overallPerformanceLevel: studentData.overallPerformanceLevel || '',
      healthNotes: studentData.healthNotes || '',
      attendanceRate: studentData.attendanceRate !== undefined ? studentData.attendanceRate : 0,
      avatarUrl: studentData.avatarUrl || ''
    };

    // Persist to Firestore
    setDoc(doc(db, 'students', id), newStudent).catch(() => {});

    setData(prev => ({
      ...prev,
      enrolledLearnersCount: prev.students.length + 1,
      students: [newStudent, ...prev.students]
    }));

    return newStudent;
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setData(prev => {
      const updatedStudents = prev.students.map(s => {
        if (s.id !== id) return s;
        const totalFees = updates.totalFees !== undefined ? updates.totalFees : s.totalFees;
        const paidFees = updates.paidFees !== undefined ? updates.paidFees : s.paidFees;
        const feeBalance = Math.max(0, totalFees - paidFees);
        const updated = { ...s, ...updates, feeBalance };
        setDoc(doc(db, 'students', id), updated, { merge: true }).catch(() => {});
        return updated;
      });
      return { ...prev, students: updatedStudents };
    });
  };

  const deleteStudent = (id: string) => {
    deleteDoc(doc(db, 'students', id)).catch(() => {});
    setData(prev => ({
      ...prev,
      students: prev.students.filter(s => s.id !== id),
      enrolledLearnersCount: Math.max(0, prev.students.length - 1)
    }));
  };

  const addStaff = (staffData: Partial<StaffMember>): StaffMember => {
    const nextIndex = data.staff.length + 1;
    const staffNo = `WESA/FAC/${String(nextIndex).padStart(3, '0')}`;
    const id = `stf-${Date.now()}`;

    const newStaff: StaffMember = {
      id,
      staffNo,
      tscNumber: staffData.tscNumber || '',
      fullName: staffData.fullName || '',
      gender: staffData.gender || '',
      email: staffData.email || '',
      phone: staffData.phone || '',
      role: staffData.role || '',
      department: staffData.department || '',
      assignedGrade: staffData.assignedGrade || '',
      assignedSection: staffData.assignedSection || '',
      learningAreas: staffData.learningAreas || [],
      qualification: staffData.qualification || '',
      joinDate: staffData.joinDate || new Date().toISOString().split('T')[0],
      status: staffData.status || 'Active',
      salaryStatus: staffData.salaryStatus || '',
      avatarUrl: staffData.avatarUrl || ''
    };

    setData(prev => ({
      ...prev,
      staff: [...prev.staff, newStaff]
    }));

    return newStaff;
  };

  const updateStaff = (id: string, updates: Partial<StaffMember>) => {
    setData(prev => ({
      ...prev,
      staff: prev.staff.map(st => st.id === id ? { ...st, ...updates } : st)
    }));
  };

  const deleteStaff = (id: string) => {
    setData(prev => ({
      ...prev,
      staff: prev.staff.filter(st => st.id !== id)
    }));
  };

  const addTransaction = (txData: Partial<Transaction>): Transaction => {
    const year = new Date().getFullYear();
    const receiptNum = Math.floor(1000 + Math.random() * 9000);
    const receiptNo = `REC/KES/${year}/${receiptNum}`;
    const id = `tx-${Date.now()}`;
    const date = txData.date || new Date().toISOString().split('T')[0];

    const amount = txData.amount || 0;
    const student = data.students.find(s => s.id === txData.studentId);
    
    let balanceRemaining = 0;
    if (student) {
      const newPaid = (student.paidFees || 0) + amount;
      balanceRemaining = Math.max(0, student.totalFees - newPaid);
      updateStudent(student.id, { paidFees: newPaid });
    }

    const newTx: Transaction = {
      id,
      receiptNo,
      studentId: txData.studentId || '',
      studentName: txData.studentName || student?.fullName || '',
      regNo: txData.regNo || student?.regNo || '',
      nemisUpi: txData.nemisUpi || student?.nemisUpi || '',
      grade: txData.grade || student?.grade || '',
      amount,
      feeType: txData.feeType || '',
      paymentMethod: txData.paymentMethod || '',
      mpesaRef: txData.mpesaRef || '',
      date,
      term: txData.term || '',
      academicYear: txData.academicYear || '',
      balanceRemaining,
      receivedBy: txData.receivedBy || '',
      notes: txData.notes || ''
    };

    setDoc(doc(db, 'transactions', id), newTx).catch(() => {});

    setData(prev => ({
      ...prev,
      transactions: [newTx, ...prev.transactions]
    }));

    return newTx;
  };

  const saveReportCard = (studentId: string, card: ReportCard) => {
    setDoc(doc(db, 'reportCards', studentId), card, { merge: true }).catch(() => {});

    setData(prev => {
      const student = prev.students.find(s => s.id === studentId);
      let updatedStudents = prev.students;
      if (student && card.overallPerformanceLevel) {
        updatedStudents = prev.students.map(s => 
          s.id === studentId ? { ...s, overallPerformanceLevel: card.overallPerformanceLevel } : s
        );
      }
      return {
        ...prev,
        students: updatedStudents,
        reportCards: {
          ...prev.reportCards,
          [studentId]: card
        }
      };
    });
  };

  const addNotice = (noticeData: Partial<Notice>): Notice => {
    const newNotice: Notice = {
      id: `not-${Date.now()}`,
      title: noticeData.title || '',
      category: noticeData.category || '',
      priority: noticeData.priority || 'Normal',
      targetAudience: noticeData.targetAudience || '',
      date: noticeData.date || new Date().toISOString().split('T')[0],
      author: noticeData.author || '',
      content: noticeData.content || ''
    };

    setData(prev => ({
      ...prev,
      notices: [newNotice, ...prev.notices]
    }));

    return newNotice;
  };

  const deleteNotice = (id: string) => {
    setData(prev => ({
      ...prev,
      notices: prev.notices.filter(n => n.id !== id)
    }));
  };

  const clearAllData = () => {
    PREVIOUS_STORAGE_KEYS.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // ignore
      }
    });
    const cleanEmpty: SchoolData = {
      ...INITIAL_SCHOOL_DATA,
      students: [],
      staff: [],
      transactions: [],
      reportCards: {},
      notices: []
    };
    setData(cleanEmpty);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanEmpty));
    } catch (e) {
      // ignore
    }
  };

  const resetAssessmentMarksToZero = () => {
    setData(prev => {
      // Clear all report cards so that all entries reset to 00
      return {
        ...prev,
        reportCards: {},
        students: prev.students.map(s => ({
          ...s,
          overallPerformanceLevel: 'BE' as CBCPerformanceLevel
        }))
      };
    });
  };

  const resetToDefault = () => {
    clearAllData();
  };

  const exportJSON = () => {
    const exportObject = {
      ...data,
      enrolledLearnersCount: data.students.length,
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(exportObject, null, 2);
  };

  const importJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.students && Array.isArray(parsed.students)) {
        setData(parsed);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Invalid JSON file', e);
      return false;
    }
  };

  return (
    <SchoolContext.Provider
      value={{
        academy: data.academy,
        curriculum: data.curriculum,
        students: data.students,
        staff: data.staff,
        transactions: data.transactions,
        reportCards: data.reportCards,
        notices: data.notices,
        addStudent,
        updateStudent,
        deleteStudent,
        addStaff,
        updateStaff,
        deleteStaff,
        addTransaction,
        saveReportCard,
        addNotice,
        deleteNotice,
        resetAssessmentMarksToZero,
        resetToDefault,
        clearAllData,
        exportJSON,
        importJSON
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};
