import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import { Database, Download, Upload, Copy, Check, X, Trash2, CheckCircle2, ShieldCheck, ShieldAlert, Cloud, ExternalLink } from 'lucide-react';
import { 
  exportDatabaseBackupToGoogleDrive, 
  getDriveAccessToken, 
  signInWithGoogleDrive 
} from '../services/googleDriveService';

interface DataBackupModalProps {
  onClose: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({ onClose }) => {
  const { exportJSON, importJSON, clearAllData, students, staff, transactions } = useSchool();
  const { eraseAllAuthData, canAccessSchoolData, currentUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [erasedNotice, setErasedNotice] = useState(false);
  const [driveSaving, setDriveSaving] = useState(false);
  const [driveResult, setDriveResult] = useState<{ success: boolean; link?: string; message?: string } | null>(null);

  // Security gate: strictly restricted to the 2 designated Primary Administrators
  if (!canAccessSchoolData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center mx-auto border border-rose-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Restricted Administrative Security Access</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              School data and JSON portability is locked exclusively to the 2 designated Primary Institutional Administrators. Your account does not have data export or restore clearance.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close Dialog
          </button>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    const jsonStr = exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `west_end_star_academy_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportJSON());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = importJSON(importText);
    if (ok) {
      setImportStatus('success');
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setImportStatus('error');
    }
  };

  const handleEraseAllSavedDetails = () => {
    clearAllData();
    eraseAllAuthData();
    setErasedNotice(true);
    setTimeout(() => {
      setErasedNotice(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-display font-bold text-slate-900">
                  School Data & JSON Portability
                </h2>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  <span>2 Admins Only</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Authorized Admin: {currentUser?.email}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {erasedNotice && (
          <div className="my-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-rose-600" />
            <span>All saved details, accounts, and school records have been completely erased!</span>
          </div>
        )}

        <div className="py-4 space-y-4 text-xs">
          {/* Quick counts */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[11px] text-slate-400 block">Learners</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{students.length}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Faculty</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{staff.length}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">M-Pesa Receipts</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{transactions.length}</span>
            </div>
          </div>

          {/* Export section */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
              Export School Backup
            </span>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup (.json)</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <button
                onClick={async () => {
                  setDriveSaving(true);
                  setDriveResult(null);
                  try {
                    let token = getDriveAccessToken();
                    if (!token) {
                      const authRes = await signInWithGoogleDrive();
                      token = authRes.accessToken;
                    }
                    const uploaded = await exportDatabaseBackupToGoogleDrive(exportJSON());
                    setDriveResult({
                      success: true,
                      link: uploaded.webViewLink,
                      message: 'Full Institutional Database Backup saved directly to Google Drive!'
                    });
                  } catch (err: any) {
                    setDriveResult({
                      success: false,
                      message: err.message || 'Failed to save database backup to Google Drive.'
                    });
                  } finally {
                    setDriveSaving(false);
                  }
                }}
                disabled={driveSaving}
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors shadow-xs"
              >
                {driveSaving ? (
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                <span>{driveSaving ? 'Saving to Google Drive...' : 'Save Full Backup to Google Drive'}</span>
              </button>

              {driveResult && (
                <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                  driveResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${driveResult.success ? 'text-emerald-600' : 'text-rose-600'}`} />
                    <span className="text-[11px]">{driveResult.message}</span>
                  </div>
                  {driveResult.link && (
                    <a
                      href={driveResult.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold underline text-blue-700 hover:text-blue-800 text-[11px] shrink-0"
                    >
                      <span>View in Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Import section */}
          <div className="space-y-2 pt-3 border-t border-slate-200">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
              Import School JSON Data
            </span>
            <textarea
              rows={3}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste valid West End Star Academy JSON export here..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
            />
            {importStatus === 'error' && (
              <p className="text-rose-600 text-[11px]">
                Invalid JSON format. Please ensure the JSON contains learners and staff arrays.
              </p>
            )}
            {importStatus === 'success' && (
              <p className="text-emerald-700 text-[11px]">
                School data successfully restored and updated!
              </p>
            )}
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Restore from Pasted JSON</span>
            </button>
          </div>

          {/* Factory Reset & Erase All */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-rose-800 block">Erase All Saved Details</span>
              <span className="text-[11px] text-slate-400">Completely wipe all stored records & auth sessions</span>
            </div>
            <button
              onClick={handleEraseAllSavedDetails}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs text-white bg-rose-700 hover:bg-rose-800 rounded-lg font-semibold transition-colors shadow-xs shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Erase All Saved Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
