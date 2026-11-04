import { auth } from '../lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { Student, ReportCard } from '../types';
import { CohortRankItem } from '../data/initialData';

export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

const provider = new GoogleAuthProvider();
GOOGLE_DRIVE_SCOPES.forEach(scope => provider.addScope(scope));

import { 
  getGoogleAccessToken, 
  setGoogleAccessToken, 
  signInWithGoogleWorkspace, 
  signOutGoogleWorkspace 
} from './googleAuthService';

let isSigningIn = false;
const getActiveToken = (token?: string) => token || getGoogleAccessToken();


export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  parents?: string[];
  description?: string;
}

export interface DriveStorageQuota {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
}

export interface DriveUserInfo {
  displayName: string;
  emailAddress: string;
  photoLink?: string;
}

/**
 * Initialize Firebase Auth listener for Google Drive session.
 * Token is kept purely in memory; upon logout, cached token is cleared.
 */
export const initDriveAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    const token = getGoogleAccessToken();
    if (user) {
      if (token) {
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        setGoogleAccessToken(null);
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      setGoogleAccessToken(null);
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger official Google OAuth sign-in with full Google Workspace permissions.
 */
export const signInWithGoogleDrive = async (): Promise<{ user: FirebaseUser; accessToken: string }> => {
  try {
    isSigningIn = true;
    return await signInWithGoogleWorkspace();
  } catch (error: any) {
    console.error('Google Drive Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Sign out from Google session and clear in-memory token.
 */
export const signOutGoogleDrive = async () => {
  await signOutGoogleWorkspace();
};

/**
 * Retrieve current cached in-memory access token.
 */
export const getDriveAccessToken = (): string | null => {
  return getGoogleAccessToken();
};

export const setCachedAccessToken = (token: string | null) => {
  setGoogleAccessToken(token);
};

/**
 * Fetch information about the authenticated user's Google Drive account.
 */
export const getDriveAbout = async (token?: string): Promise<{ user: DriveUserInfo; quota?: DriveStorageQuota }> => {
  const t = getActiveToken(token);
  if (!t) throw new Error('Not authenticated with Google Drive. Please sign in first.');

  const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
    headers: { Authorization: `Bearer ${t}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Google Drive user info (${res.status})`);
  }

  const data = await res.json();
  return {
    user: data.user,
    quota: data.storageQuota,
  };
};

const SCHOOL_ARCHIVE_FOLDER_NAME = 'West End Star Academy CBC Archive';

/**
 * Ensures the designated school cloud archive folder exists in user's Google Drive.
 * Returns the folder ID.
 */
export const ensureSchoolArchiveFolder = async (token?: string): Promise<string> => {
  const t = getActiveToken(token);
  if (!t) throw new Error('Not authenticated with Google Drive.');

  // Check if folder exists
  const query = `mimeType = 'application/vnd.google-apps.folder' and name = '${SCHOOL_ARCHIVE_FOLDER_NAME}' and trashed = false`;
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${t}` },
  });

  if (res.ok) {
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Create the school archive folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${t}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: SCHOOL_ARCHIVE_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Official Kenya CBC academic records, learner report cards, broadsheets, and institutional backups for West End Star Academy.',
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create School Archive folder in Google Drive.');
  }

  const newFolder = await createRes.json();
  return newFolder.id;
};

/**
 * List files in user's Google Drive, optionally filtered by folder or query.
 */
export const listDriveFiles = async (
  options: {
    folderId?: string;
    searchTerm?: string;
    pageSize?: number;
    token?: string;
  } = {}
): Promise<DriveFileItem[]> => {
  const t = getActiveToken(options.token);
  if (!t) throw new Error('Not authenticated with Google Drive.');

  const parts: string[] = ['trashed = false'];
  if (options.folderId) {
    parts.push(`'${options.folderId}' in parents`);
  }
  if (options.searchTerm && options.searchTerm.trim()) {
    parts.push(`name contains '${options.searchTerm.replace(/'/g, "\\'")}'`);
  }

  const q = parts.join(' and ');
  const fields = 'files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,parents,iconLink,description)';
  const pageSize = options.pageSize || 50;

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&orderBy=modifiedTime desc&pageSize=${pageSize}&fields=${fields}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${t}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch files from Google Drive (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
};

/**
 * Upload a file (HTML, CSV, JSON, PDF, Image, etc.) into Google Drive using multipart upload.
 */
export const uploadFileToDrive = async ({
  name,
  mimeType,
  content,
  folderId,
  description,
  token,
}: {
  name: string;
  mimeType: string;
  content: string | Blob;
  folderId?: string;
  description?: string;
  token?: string;
}): Promise<DriveFileItem> => {
  const t = getActiveToken(token);
  if (!t) throw new Error('Not authenticated with Google Drive.');

  const metadata: Record<string, any> = {
    name,
    mimeType,
    description: description || 'Uploaded via West End Star Academy CBC Portal',
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  let contentData: string;
  if (typeof content === 'string') {
    contentData = content;
  } else {
    contentData = await content.text();
  }

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    contentData +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,size,modifiedTime', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${t}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to upload ${name} to Google Drive`);
  }

  return await res.json();
};

/**
 * Delete a file in Google Drive.
 * User confirmation MUST be obtained in UI before calling this method.
 */
export const deleteDriveFile = async (fileId: string, token?: string): Promise<boolean> => {
  const t = getActiveToken(token);
  if (!t) throw new Error('Not authenticated with Google Drive.');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${t}` },
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete file from Google Drive (${res.status})`);
  }

  return true;
};

/**
 * Format and export learner CBC Report Card to Google Drive as an archive HTML document.
 */
export const exportReportCardToGoogleDrive = async (
  student: Student,
  report: ReportCard,
  cohortRankInfo?: CohortRankItem | null,
  academyName = 'West End Star Academy'
): Promise<DriveFileItem> => {
  const folderId = await ensureSchoolArchiveFolder();
  const safeName = student.fullName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeReg = student.regNo.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `ReportCard_${safeReg}_${safeName}_${report.term.replace(/\s+/g, '_')}.html`;

  const rankOverall = cohortRankInfo?.hasTeacherEntry ? cohortRankInfo.rankOverall : (report.classRank || 0);
  const rankT1 = cohortRankInfo?.hasT1Entry ? cohortRankInfo.rankT1 : 0;
  const rankT2 = cohortRankInfo?.hasT2Entry ? cohortRankInfo.rankT2 : 0;
  const rankT3 = cohortRankInfo?.hasT3Entry ? cohortRankInfo.rankT3 : 0;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${student.fullName} - CBC Report Card - ${academyName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #0f172a; line-height: 1.5; background: #fff; }
    .header { text-align: center; border-bottom: 2px solid #0f4a32; padding-bottom: 20px; margin-bottom: 24px; }
    .school-title { font-size: 24px; font-weight: 800; color: #0f4a32; text-transform: uppercase; margin: 0; }
    .badge { display: inline-block; padding: 4px 12px; background: #ecfdf5; color: #065f46; font-size: 11px; font-weight: 700; border-radius: 9999px; margin-top: 8px; border: 1px solid #a7f3d0; }
    .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; }
    .meta-label { color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .meta-value { font-weight: 700; color: #0f172a; margin-top: 2px; }
    .rank-box { background: #0f4a32; color: white; border-radius: 8px; padding: 16px; margin-bottom: 24px; display: flex; justify-content: space-around; text-align: center; }
    .rank-num { font-size: 22px; font-weight: 800; font-family: monospace; }
    .rank-lbl { font-size: 11px; opacity: 0.85; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    th { background: #0f4a32; color: white; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .pill { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; }
    .pill-EE { background: #ecfdf5; color: #065f46; }
    .pill-ME { background: #eff6ff; color: #1e40af; }
    .pill-AE { background: #fffbeb; color: #92400e; }
    .pill-BE { background: #fef2f2; color: #991b1b; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="school-title">${academyName}</h1>
    <div style="font-size: 13px; color: #475569; margin-top: 4px;">Competency Based Curriculum (CBC) Assessment Report</div>
    <div class="badge">Official Learner Performance Transcript</div>
  </div>

  <div class="meta-grid">
    <div><div class="meta-label">Learner Name</div><div class="meta-value">${student.fullName}</div></div>
    <div><div class="meta-label">Admission / Reg No</div><div class="meta-value">${student.regNo}</div></div>
    <div><div class="meta-label">NEMIS UPI</div><div class="meta-value">${student.nemisUpi}</div></div>
    <div><div class="meta-label">Grade & Section</div><div class="meta-value">${student.grade} - Stream ${student.section}</div></div>
    <div><div class="meta-label">Term & Year</div><div class="meta-value">${report.term} (${report.academicYear})</div></div>
    <div><div class="meta-label">Attendance Rate</div><div class="meta-value">${student.attendanceRate}%</div></div>
  </div>

  <div class="rank-box">
    <div>
      <div class="rank-lbl">Term 1 Rank</div>
      <div class="rank-num">${rankT1 > 0 ? '#' + rankT1 : '—'}</div>
    </div>
    <div>
      <div class="rank-lbl">Term 2 Rank</div>
      <div class="rank-num">${rankT2 > 0 ? '#' + rankT2 : '—'}</div>
    </div>
    <div>
      <div class="rank-lbl">Term 3 / End Term</div>
      <div class="rank-num">${rankT3 > 0 ? '#' + rankT3 : '—'}</div>
    </div>
    <div>
      <div class="rank-lbl">Overall Academic Rank</div>
      <div class="rank-num">${rankOverall > 0 ? '#' + rankOverall : '—'}</div>
    </div>
  </div>

  <h3>Learning Area Assessments</h3>
  <table>
    <thead>
      <tr>
        <th>Learning Area</th>
        <th>Facilitator</th>
        <th>T1 (Op/Mid/End)</th>
        <th>T2 (Op/Mid/End)</th>
        <th>T3 (Op/Mid/End)</th>
        <th>Mean %</th>
        <th>CBC Rubric</th>
        <th>Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${report.learningAreas.map(la => `
        <tr>
          <td><strong>${la.learningArea}</strong></td>
          <td>${la.facilitator || '—'}</td>
          <td style="font-family: monospace;">${la.term1Opener ?? '—'}/${la.term1Mid ?? '—'}/${la.term1End ?? '—'}</td>
          <td style="font-family: monospace;">${la.term2Opener ?? '—'}/${la.term2Mid ?? '—'}/${la.term2End ?? '—'}</td>
          <td style="font-family: monospace;">${la.term3Opener ?? '—'}/${la.term3Mid ?? '—'}/${la.term3End ?? '—'}</td>
          <td style="font-family: monospace; font-weight: bold;">${la.totalScore}%</td>
          <td><span class="pill pill-${la.performanceLevel}">${la.performanceLevel}</span></td>
          <td>${la.competencyRemark || 'Satisfactory achievement in CBC competencies.'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
    <strong>Lead Facilitator Remarks:</strong>
    <p style="margin: 6px 0 0; font-style: italic;">${report.facilitatorRemark || report.headTeacherRemark || 'Demonstrates commendable diligence, peer collaboration, and strong CBC core competency development.'}</p>
  </div>

  <div class="footer">
    Archived to Google Drive on ${new Date().toLocaleString()} · ${academyName} Ministry of Education CBC Portal
  </div>
</body>
</html>`;

  return await uploadFileToDrive({
    name: fileName,
    mimeType: 'text/html',
    content: htmlContent,
    folderId,
    description: `Official CBC Learner Report Card for ${student.fullName} (${student.regNo}) - ${report.term}`,
  });
};

/**
 * Export full Class Broadsheet ranking matrix to Google Drive as CSV.
 */
export const exportBroadsheetToGoogleDrive = async (
  cohortRankings: CohortRankItem[],
  gradeLabel: string,
  academicYear: string = '2025/2026'
): Promise<DriveFileItem> => {
  const folderId = await ensureSchoolArchiveFolder();
  const dateStr = new Date().toISOString().split('T')[0];
  const safeGrade = gradeLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Broadsheet_${safeGrade}_${dateStr}.csv`;

  const headers = [
    'Cohort Rank',
    'Learner Name',
    'Admission Reg No',
    'Grade',
    'Stream',
    'NEMIS UPI',
    'T1 Opener',
    'T1 Mid',
    'T1 End',
    'Term 1 Total',
    'Term 1 Rank',
    'T2 Opener',
    'T2 Mid',
    'T2 End',
    'Term 2 Total',
    'Term 2 Rank',
    'T3 Opener',
    'T3 Mid',
    'T3 End',
    'Term 3 Total',
    'Term 3 Rank',
    'Grand Total Marks',
    'Mean Score (%)',
    'Performance Level'
  ];

  const rows = cohortRankings.map(item => [
    item.hasTeacherEntry && item.rankOverall > 0 ? item.rankOverall : 'Pending',
    `"${item.student.fullName}"`,
    item.student.regNo,
    item.student.grade,
    item.student.section,
    item.student.nemisUpi,
    item.t1oSum,
    item.t1mSum,
    item.t1eSum,
    item.t1Sum,
    item.hasT1Entry && item.rankT1 > 0 ? item.rankT1 : '—',
    item.t2oSum,
    item.t2mSum,
    item.t2eSum,
    item.t2Sum,
    item.hasT2Entry && item.rankT2 > 0 ? item.rankT2 : '—',
    item.t3oSum,
    item.t3mSum,
    item.t3eSum,
    item.t3Sum,
    item.hasT3Entry && item.rankT3 > 0 ? item.rankT3 : '—',
    item.grandTotal,
    `${item.meanScore}%`,
    item.rubricLevel
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  return await uploadFileToDrive({
    name: fileName,
    mimeType: 'text/csv',
    content: csvContent,
    folderId,
    description: `Official CBC Broadsheet and Cohort Merit Rankings for ${gradeLabel} (${academicYear})`,
  });
};

/**
 * Backup full school database (JSON) to Google Drive.
 */
export const exportDatabaseBackupToGoogleDrive = async (
  jsonString: string
): Promise<DriveFileItem> => {
  const folderId = await ensureSchoolArchiveFolder();
  const dateStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const fileName = `west_end_star_academy_backup_${dateStr}_${timeStr}.json`;

  return await uploadFileToDrive({
    name: fileName,
    mimeType: 'application/json',
    content: jsonString,
    folderId,
    description: `Full institutional database backup of West End Star Academy created on ${new Date().toLocaleString()}`,
  });
};
