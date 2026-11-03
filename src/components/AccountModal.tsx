import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  ShieldCheck, 
  GraduationCap, 
  Users, 
  Mail, 
  LogOut, 
  UserCheck, 
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserRole } from '../types';
import { SchoolEmblem } from './SchoolEmblem';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: (role?: UserRole) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin
}) => {
  const { 
    currentUser, 
    registeredUsers, 
    switchAccount, 
    logout 
  } = useAuth();

  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleSwitch = (userId: string) => {
    const res = switchAccount(userId);
    if (res.success) {
      onClose();
    }
  };

  const otherAccounts = registeredUsers.filter(u => u.id !== currentUser.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative my-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-lg shrink-0">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {currentUser.name}
              </h2>
              {currentUser.isVerified && (
                <span className="text-emerald-700 font-semibold text-xs flex items-center gap-0.5" title="Verified Account">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span className="capitalize font-semibold text-slate-700">{currentUser.role} Portal</span>
              <span aria-hidden="true">·</span>
              <span>{currentUser.email}</span>
            </div>
          </div>
        </div>

        {actionMessage && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-start gap-2 ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border border-rose-200 text-rose-900'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Profile Details Card */}
        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Official Account Credentials
          </div>
          <div className="grid grid-cols-2 gap-3 text-slate-700 pt-1">
            <div>
              <span className="text-slate-400 block text-[11px]">Authorized Role</span>
              <span className="font-semibold text-slate-900 capitalize">{currentUser.role}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Primary Email</span>
              <span className="font-mono text-slate-900 truncate block">{currentUser.email}</span>
            </div>
            {currentUser.tscNumber && (
              <div>
                <span className="text-slate-400 block text-[11px]">TSC Number</span>
                <span className="font-mono font-semibold text-slate-900">{currentUser.tscNumber}</span>
              </div>
            )}
            {currentUser.assignedGrade && (
              <div>
                <span className="text-slate-400 block text-[11px]">Assigned Grade / Class</span>
                <span className="font-semibold text-slate-900">{currentUser.assignedGrade}</span>
              </div>
            )}
            {(currentUser.studentName || currentUser.studentRegNo) && (
              <div>
                <span className="text-slate-400 block text-[11px]">Enrolled Learner</span>
                <span className="font-semibold text-slate-900">{currentUser.studentName || currentUser.studentRegNo}</span>
              </div>
            )}
            {currentUser.department && (
              <div>
                <span className="text-slate-400 block text-[11px]">Department</span>
                <span className="font-semibold text-slate-900">{currentUser.department}</span>
              </div>
            )}
          </div>
        </div>



        {/* Switch Account Section */}
        {otherAccounts.length > 0 && (
          <div className="mt-4 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Other Authenticated Accounts on this Device
            </div>
            <div className="space-y-1.5">
              {otherAccounts.map(account => (
                <div
                  key={account.id}
                  className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{account.name}</div>
                    <div className="text-[11px] text-slate-500 capitalize">
                      {account.role} Portal · {account.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSwitch(account.id)}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded font-semibold text-[11px] transition-colors"
                  >
                    Switch
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLogin();
            }}
            className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5"
          >
            <span>Log In with Another Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              logout();
              onClose();
            }}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
