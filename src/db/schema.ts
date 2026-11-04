import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define the 'users' table using Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('facilitator'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'students' table
export const students = pgTable('students', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  gender: text('gender'),
  dob: text('dob'),
  birthCertNo: text('birth_cert_no'),
  nemisUpi: text('nemis_upi'),
  grade: text('grade').notNull(),
  section: text('section'),
  house: text('house'),
  guardianName: text('guardian_name'),
  guardianPhone: text('guardian_phone'),
  guardianEmail: text('guardian_email'),
  address: text('address'),
  totalFees: integer('total_fees').default(0),
  paidFees: integer('paid_fees').default(0),
  feeBalance: integer('fee_balance').default(0),
  scholarshipPct: integer('scholarship_pct').default(0),
  enrollmentDate: text('enrollment_date'),
  status: text('status').default('Active'),
  regNo: text('reg_no'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'feeTransactions' table
export const feeTransactions = pgTable('fee_transactions', {
  id: text('id').primaryKey(),
  receiptNo: text('receipt_no').notNull(),
  studentId: text('student_id').references(() => students.id),
  studentName: text('student_name').notNull(),
  amount: integer('amount').notNull(),
  feeType: text('fee_type').notNull(),
  paymentMethod: text('payment_method').notNull(),
  mpesaRef: text('mpesa_ref'),
  date: text('date').notNull(),
  term: text('term').notNull(),
  academicYear: text('academic_year').notNull(),
  balanceRemaining: integer('balance_remaining').notNull(),
  receivedBy: text('received_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'assessmentRecords' table
export const assessmentRecords = pgTable('assessment_records', {
  id: serial('id').primaryKey(),
  studentId: text('student_id').references(() => students.id),
  term: text('term').notNull(),
  examType: text('exam_type').notNull(),
  learningArea: text('learning_area').notNull(),
  score: integer('score').notNull(),
  performanceLevel: text('performance_level').notNull(),
  academicYear: text('academic_year').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships
export const studentsRelations = relations(students, ({ many }) => ({
  transactions: many(feeTransactions),
  assessments: many(assessmentRecords),
}));

export const feeTransactionsRelations = relations(feeTransactions, ({ one }) => ({
  student: one(students, {
    fields: [feeTransactions.studentId],
    references: [students.id],
  }),
}));

export const assessmentRecordsRelations = relations(assessmentRecords, ({ one }) => ({
  student: one(students, {
    fields: [assessmentRecords.studentId],
    references: [students.id],
  }),
}));
