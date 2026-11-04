import React, { useState, useEffect, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import { 
  initDriveAuth, 
  signInWithGoogleDrive, 
  signOutGoogleDrive, 
  getDriveAccessToken, 
  getDriveAbout, 
  ensureSchoolArchiveFolder, 
  listDriveFiles, 
  uploadFileToDrive, 
  deleteDriveFile, 
  exportDatabaseBackupToGoogleDrive, 
  exportBroadsheetToGoogleDrive,
  DriveFileItem, 
  DriveUserInfo, 
  DriveStorageQuota 
} from '../services/googleDriveService';
import { GoogleSignInButton } from './GoogleSignInButton';
import { DriveConfirmDialog } from './DriveConfirmDialog';
import { computeCohortRankings, CBC_GRADES } from '../data/initialData';
import { 
  Cloud, 
  FolderCheck, 
  Upload, 
  ExternalLink, 
  Trash2, 
  RefreshCw, 
  FileText, 
  FileSpreadsheet, 
  Database, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  ShieldCheck, 
  LogOut,
  FolderPlus,
  Calendar,
  Layers,
  FileCheck2,
  FileCode,
  File
} from 'lucide-react';

export const GoogleDriveModule: React.FC = () => {
  const { students, staff, transactions, reportCards, exportJSON, academy } = useSchool();
  const { currentUser } = useAuth();

  const [accessToken, setAccessToken] = useState<string | null>(() => getDriveAccessToken());
  const [userInfo, setUserInfo] = useState<DriveUserInfo | null>(null);
  const [quota, setQuota] = useState<DriveStorageQuota | null>(null);
  const [archiveFolderId, setArchiveFolderId] = useState<string | null>(null);

  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; link?: string } | null>(null);

  // Destructive delete state
  const [deleteTarget, setDeleteTarget] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync / Backup state
  const [isBackingUpDb, setIsBackingUpDb] = useState(false);
  const [isBackingUpBroadsheets, setIsBackingUpBroadsheets] = useState(false);

  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (user, token) => {
        setAccessToken(token);
        fetchDriveDetails(token);
      },
      () => {
        setAccessToken(null);
        setUserInfo(null);
        setFiles([]);
        setArchiveFolderId(null);
      }
    );

    if (accessToken) {
      fetchDriveDetails(accessToken);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const fetchDriveDetails = async (token: string) => {
    try {
      setIsLoadingFiles(true);
      const about = await getDriveAbout(token);
      setUserInfo(about.user);
      if (about.quota) setQuota(about.quota);

      const folderId = await ensureSchoolArchiveFolder(token);
      setArchiveFolderId(folderId);

      const fileList = await listDriveFiles({ folderId, token });
      setFiles(fileList);
    } catch (err: any) {
      console.error('Failed to load Google Drive details:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to sync with Google Drive. Please verify your connection.',
      });
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setFeedback(null);
    try {
      const { accessToken: token } = await signInWithGoogleDrive();
      setAccessToken(token);
      await fetchDriveDetails(token);
      setFeedback({
        type: 'success',
        message: 'Successfully connected Google Drive! School archive folder is ready.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to authenticate with Google Drive.',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutGoogleDrive();
      setAccessToken(null);
      setUserInfo(null);
      setFiles([]);
      setArchiveFolderId(null);
      setFeedback({
        type: 'success',
        message: 'Disconnected from Google Drive. In-memory access token has been safely cleared.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error disconnecting from Google Drive.',
      });
    }
  };

  const handleRefresh = async () => {
    if (!accessToken || !archiveFolderId) return;
    setIsLoadingFiles(true);
    try {
      const fileList = await listDriveFiles({ folderId: archiveFolderId, token: accessToken });
      setFiles(fileList);
      setFeedback({
        type: 'success',
        message: 'Refreshed Google Drive files successfully.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to refresh Google Drive files.',
      });
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Explicit confirmation before deleting file per MANDATORY user confirmation requirement
  const confirmDeleteFile = async () => {
    if (!deleteTarget || !accessToken) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(deleteTarget.id, accessToken);
      setFiles(prev => prev.filter(f => f.id !== deleteTarget.id));
      setFeedback({
        type: 'success',
        message: `Deleted "${deleteTarget.name}" from Google Drive archive.`,
      });
      setDeleteTarget(null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete file from Google Drive.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Upload user selected file to school archive folder
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken || !archiveFolderId) return;

    setIsUploading(true);
    setFeedback(null);
    try {
      const uploaded = await uploadFileToDrive({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        content: file,
        folderId: archiveFolderId,
        description: `Uploaded from West End Star Academy Portal by ${currentUser?.name || 'Staff Member'}`,
        token: accessToken,
      });

      setFiles(prev => [uploaded, ...prev]);
      setFeedback({
        type: 'success',
        message: `Successfully uploaded "${file.name}" to Google Drive Archive.`,
        link: uploaded.webViewLink,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to upload document to Google Drive.',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Backup Full School Database JSON to Google Drive
  const handleBackupDatabase = async () => {
    if (!accessToken) return;
    setIsBackingUpDb(true);
    setFeedback(null);
    try {
      const jsonStr = exportJSON();
      const uploaded = await exportDatabaseBackupToGoogleDrive(jsonStr);
      setFiles(prev => [uploaded, ...prev]);
      setFeedback({
        type: 'success',
        message: `Full Institutional Database backup saved to Google Drive! (${students.length} learners, ${staff.length} staff, ${transactions.length} receipts).`,
        link: uploaded.webViewLink,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to backup database to Google Drive.',
      });
    } finally {
      setIsBackingUpDb(false);
    }
  };

  // Export Broadsheets for all Grades to Google Drive
  const handleBackupAllBroadsheets = async () => {
    if (!accessToken) return;
    setIsBackingUpBroadsheets(true);
    setFeedback(null);
    try {
      const cohortRankings = computeCohortRankings(students, reportCards);
      const uploadedFiles: DriveFileItem[] = [];

      // Export overall broadsheet
      const overallFile = await exportBroadsheetToGoogleDrive(cohortRankings, 'All_Grades_Cohort', '2025/2026');
      uploadedFiles.push(overallFile);

      // Export individual grade broadsheets if they have students
      for (const grade of CBC_GRADES) {
        const gradeCohorts = cohortRankings.filter(r => r.student.grade === grade);
        if (gradeCohorts.length > 0) {
          const file = await exportBroadsheetToGoogleDrive(gradeCohorts, grade, '2025/2026');
          uploadedFiles.push(file);
        }
      }

      setFiles(prev => [...uploadedFiles, ...prev]);
      setFeedback({
        type: 'success',
        message: `Successfully exported ${uploadedFiles.length} CBC Broadsheet Merit Matrices to Google Drive Archive.`,
        link: overallFile.webViewLink,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to export broadsheets to Google Drive.',
      });
    } finally {
      setIsBackingUpBroadsheets(false);
    }
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (mimeType: string, name: string) => {
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv') || name.endsWith('.csv')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    if (mimeType.includes('html') || name.endsWith('.html')) {
      return <FileCode className="w-5 h-5 text-blue-600" />;
    }
    if (mimeType.includes('json') || name.endsWith('.json')) {
      return <Database className="w-5 h-5 text-amber-600" />;
    }
    if (mimeType.includes('pdf') || name.endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-rose-600" />;
    }
    return <File className="w-5 h-5 text-slate-500" />;
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '—';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return '—';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDriveQuota = (used?: string, limit?: string) => {
    if (!used || !limit) return null;
    const u = parseInt(used, 10);
    const l = parseInt(limit, 10);
    if (isNaN(u) || isNaN(l) || l === 0) return null;
    const percent = Math.min(100, Math.round((u / l) * 100));
    const usedGb = (u / (1024 * 1024 * 1024)).toFixed(1);
    const totalGb = (l / (1024 * 1024 * 1024)).toFixed(0);
    return { percent, text: `${usedGb} GB of ${totalGb} GB used` };
  };

  const quotaInfo = quota ? formatDriveQuota(quota.usage, quota.limit) : null;

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shadow-xs">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-slate-900">
                  Google Drive CBC Cloud Repository
                </h1>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  Official Workspace Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Securely backup, store, and organize West End Star Academy CBC report cards, broadsheets, schemes of work, and database archives directly in Google Drive.
              </p>
            </div>
          </div>

          {/* Connection action */}
          <div className="shrink-0 flex items-center gap-2">
            {accessToken && userInfo ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-700 font-medium truncate max-w-[160px]">{userInfo.emailAddress}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            ) : (
              <GoogleSignInButton
                onClick={handleSignIn}
                isLoading={isSigningIn}
                text="Sign in with Google"
              />
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            {feedback.link && (
              <a
                href={feedback.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold underline shrink-0 hover:opacity-80"
              >
                <span>Open in Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {!accessToken ? (
        /* Sign-in Callout when not connected */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto border border-blue-200 shadow-sm">
            <Cloud className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">
              Connect Google Drive to West End Star Academy
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Sign in with your Google Account to enable one-click cloud exports, automated CBC learner transcripts backup, broadsheet merit matrices, and digital archives with permission from the app's users.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-lg mx-auto text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-blue-600" />
                <span>CBC Learner Report Cards</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Save printable, official transcript HTML documents directly to your school archive folder.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Merit Broadsheets</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Export terminal examination score matrices (T1, T2, End Term) as standard CSV spreadsheets.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-amber-600" />
                <span>Full Database Cloud Backup</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Safeguard all registered learners, faculty, and M-Pesa receipts against device data loss.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Strict Security Protocol</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Access tokens are stored strictly in-memory and all deletions require explicit user confirmation.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <GoogleSignInButton
              onClick={handleSignIn}
              isLoading={isSigningIn}
              text="Sign in with Google to Connect Drive"
            />
          </div>
        </div>
      ) : (
        /* Connected Dashboard */
        <div className="space-y-6">
          {/* Quick Stats & One-Click Cloud Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Archive Folder Status */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                    <FolderCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Archive Folder</h3>
                    <p className="text-[11px] text-slate-500">West End Star Academy CBC Archive</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Active
                </span>
              </div>

              {quotaInfo && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Google Drive Storage</span>
                    <span>{quotaInfo.text}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${quotaInfo.percent}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
                <span>Stored Archive Files:</span>
                <span className="font-bold text-slate-800">{files.length}</span>
              </div>
            </div>

            {/* Quick Action: Backup Database */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                    <Database className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">Database Cloud Sync</h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Export complete system snapshot ({students.length} learners, {staff.length} staff) to Google Drive as timestamped JSON.
                </p>
              </div>

              <button
                onClick={handleBackupDatabase}
                disabled={isBackingUpDb}
                className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                {isBackingUpDb ? (
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Database className="w-3.5 h-3.5" />
                )}
                <span>{isBackingUpDb ? 'Saving to Drive...' : 'Save Database Backup to Drive'}</span>
              </button>
            </div>

            {/* Quick Action: Export All Broadsheets */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">Merit Broadsheets Export</h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Generate and save cohort merit matrices (Opener, Mid, End Term scores) as CSV spreadsheets to Drive.
                </p>
              </div>

              <button
                onClick={handleBackupAllBroadsheets}
                disabled={isBackingUpBroadsheets}
                className="w-full py-2 px-3 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                {isBackingUpBroadsheets ? (
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                )}
                <span>{isBackingUpBroadsheets ? 'Exporting...' : 'Export Broadsheets to Drive'}</span>
              </button>
            </div>
          </div>

          {/* Drive File Repository & Management */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Header / Search / Upload Bar */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  School Archive Files in Google Drive
                </h2>
                <span className="text-xs text-slate-400">({filteredFiles.length} files)</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Search input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search file name..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 sm:w-56"
                  />
                </div>

                {/* Upload Document Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
                >
                  {isUploading ? (
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
                </button>

                {/* Refresh files */}
                <button
                  onClick={handleRefresh}
                  disabled={isLoadingFiles}
                  title="Refresh files"
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* File Table */}
            {isLoadingFiles ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
                <p className="text-xs">Loading files from Google Drive...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <FolderPlus className="w-10 h-10 text-slate-300 mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">No Archive Files Found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchQuery ? 'No files match your search query.' : 'Use the actions above or save Report Cards / Broadsheets to populate your Google Drive archive.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-4 font-semibold">Document Name</th>
                      <th className="py-2.5 px-3 font-semibold">Type</th>
                      <th className="py-2.5 px-3 font-semibold">Size</th>
                      <th className="py-2.5 px-3 font-semibold">Last Modified</th>
                      <th className="py-2.5 px-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          <div className="flex items-center gap-2.5">
                            {getFileIcon(file.mimeType, file.name)}
                            <div className="min-w-0">
                              <span className="block font-semibold truncate max-w-xs sm:max-w-md" title={file.name}>
                                {file.name}
                              </span>
                              {file.description && (
                                <span className="block text-[10px] text-slate-400 truncate max-w-xs sm:max-w-md">
                                  {file.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-700">
                            {file.name.endsWith('.csv') ? 'CSV Spreadsheet' : file.name.endsWith('.html') ? 'HTML Transcript' : file.name.endsWith('.json') ? 'JSON Backup' : 'Document'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {file.modifiedTime ? new Date(file.modifiedTime).toLocaleString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
                                title="Open in Google Drive"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Drive</span>
                              </a>
                            )}
                            <button
                              onClick={() => setDeleteTarget(file)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Delete from Google Drive (Requires confirmation)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mandatory Destructive Action Confirmation Dialog */}
      <DriveConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete File from Google Drive Archive"
        message="Are you sure you want to permanently delete this document from your Google Drive archive? This action mutates your Drive cloud storage and cannot be undone."
        itemName={deleteTarget?.name}
        confirmLabel="Permanently Delete"
        cancelLabel="Keep File"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={confirmDeleteFile}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
