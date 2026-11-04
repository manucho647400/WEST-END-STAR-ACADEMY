import { getGoogleAccessToken } from './googleAuthService';
import { Student, FeeTransaction } from '../types';

export interface SheetExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  rowCount: number;
}

const getActiveToken = (token?: string): string => {
  const t = token || getGoogleAccessToken();
  if (!t) {
    throw new Error('Not authenticated with Google. Please sign in with your Google account to access Google Sheets.');
  }
  return t;
};

/**
 * Create a new Google Spreadsheet
 */
export const createSpreadsheet = async (title: string, sheetTitle = 'Sheet1', token?: string): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const authToken = getActiveToken(token);
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          properties: {
            title: sheetTitle,
            gridProperties: { rowCount: 100, columnCount: 20 }
          }
        }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to create spreadsheet: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`
  };
};

/**
 * Write values to a sheet range
 */
export const appendOrUpdateSheetValues = async (
  spreadsheetId: string,
  range: string,
  values: (string | number | boolean)[][],
  token?: string
): Promise<void> => {
  const authToken = getActiveToken(token);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to write sheet values: ${response.statusText}`);
  }
};

/**
 * Export full student roster to Google Sheets
 */
export const exportStudentsToGoogleSheets = async (
  students: Student[],
  token?: string
): Promise<SheetExportResult> => {
  const today = new Date().toISOString().split('T')[0];
  const title = `West End Star Academy - CBC Learners Roster (${today})`;
  const { spreadsheetId, spreadsheetUrl } = await createSpreadsheet(title, 'Enrolled Learners', token);

  const headers = [
    'Reg No',
    'Full Name',
    'NEMIS UPI',
    'Grade',
    'Section',
    'Gender',
    'Birth Cert No',
    'Guardian Name',
    'Guardian Phone',
    'Guardian Email',
    'Total Fees (KES)',
    'Paid Fees (KES)',
    'Fee Balance (KES)',
    'Scholarship %',
    'Enrollment Date',
    'Status'
  ];

  const rows = students.map(s => [
    s.regNo || '',
    s.fullName,
    s.nemisUpi,
    s.grade,
    s.section,
    s.gender,
    s.birthCertNo,
    s.guardianName,
    s.guardianPhone,
    s.guardianEmail || '',
    s.totalFees,
    s.paidFees,
    s.feeBalance,
    s.scholarshipPct,
    s.enrollmentDate,
    s.status
  ]);

  const allValues = [headers, ...rows];
  await appendOrUpdateSheetValues(spreadsheetId, 'Enrolled Learners!A1', allValues, token);

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
    rowCount: rows.length
  };
};

/**
 * Export fee transactions ledger to Google Sheets
 */
export const exportTransactionsToGoogleSheets = async (
  transactions: FeeTransaction[],
  token?: string
): Promise<SheetExportResult> => {
  const today = new Date().toISOString().split('T')[0];
  const title = `West End Star Academy - Bursary & M-Pesa Ledger (${today})`;
  const { spreadsheetId, spreadsheetUrl } = await createSpreadsheet(title, 'Fee Ledger', token);

  const headers = [
    'Receipt No',
    'Date',
    'Learner Name',
    'Learner ID',
    'Amount (KES)',
    'Fee Type',
    'Payment Method',
    'M-Pesa Reference',
    'Term',
    'Academic Year',
    'Remaining Balance',
    'Received By'
  ];

  const rows = transactions.map(t => [
    t.receiptNo,
    t.date,
    t.studentName,
    t.studentId,
    t.amount,
    t.feeType,
    t.paymentMethod,
    t.mpesaRef || 'N/A',
    t.term,
    t.academicYear,
    t.balanceRemaining,
    t.receivedBy || 'Bursar Office'
  ]);

  const allValues = [headers, ...rows];
  await appendOrUpdateSheetValues(spreadsheetId, 'Fee Ledger!A1', allValues, token);

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
    rowCount: rows.length
  };
};
