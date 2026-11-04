// src/db/queries.ts
import { db } from './index.ts';
import { students, feeTransactions, assessmentRecords } from './schema.ts';
import { desc } from 'drizzle-orm';

export async function getDbStudents() {
  try {
    return await db.select().from(students).orderBy(students.fullName);
  } catch (error) {
    console.error("Database query getDbStudents failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function upsertDbStudent(data: typeof students.$inferInsert) {
  try {
    const result = await db.insert(students)
      .values(data)
      .onConflictDoUpdate({
        target: students.id,
        set: {
          fullName: data.fullName,
          gender: data.gender,
          dob: data.dob,
          birthCertNo: data.birthCertNo,
          nemisUpi: data.nemisUpi,
          grade: data.grade,
          section: data.section,
          house: data.house,
          guardianName: data.guardianName,
          guardianPhone: data.guardianPhone,
          guardianEmail: data.guardianEmail,
          address: data.address,
          totalFees: data.totalFees,
          paidFees: data.paidFees,
          feeBalance: data.feeBalance,
          scholarshipPct: data.scholarshipPct,
          status: data.status,
          regNo: data.regNo,
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database query upsertDbStudent failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function getDbTransactions() {
  try {
    return await db.select().from(feeTransactions).orderBy(desc(feeTransactions.createdAt));
  } catch (error) {
    console.error("Database query getDbTransactions failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function addDbTransaction(data: typeof feeTransactions.$inferInsert) {
  try {
    const result = await db.insert(feeTransactions)
      .values(data)
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database query addDbTransaction failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function getDbAssessments() {
  try {
    return await db.select().from(assessmentRecords).orderBy(desc(assessmentRecords.createdAt));
  } catch (error) {
    console.error("Database query getDbAssessments failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function addDbAssessment(data: typeof assessmentRecords.$inferInsert) {
  try {
    const result = await db.insert(assessmentRecords)
      .values(data)
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database query addDbAssessment failed:", error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}
