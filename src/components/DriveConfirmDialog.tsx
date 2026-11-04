import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DriveConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DriveConfirmDialog: React.FC<DriveConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  itemName,
  confirmLabel = 'Confirm Delete',
  cancelLabel = 'Cancel',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200 shrink-0">
            {isDestructive ? <Trash2 className="w-6 h-6 text-rose-600" /> : <AlertTriangle className="w-6 h-6 text-amber-600" />}
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">{message}</p>
          {itemName && (
            <div className="mt-3 p-2.5 bg-slate-100 rounded-lg text-xs font-mono text-slate-800 break-all border border-slate-200">
              {itemName}
            </div>
          )}
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
          <strong>Important:</strong> This operation communicates directly with your personal or school Google Drive storage.
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs ${
              isDestructive
                ? 'bg-rose-700 hover:bg-rose-800 disabled:bg-rose-400'
                : 'bg-emerald-800 hover:bg-emerald-900 disabled:bg-emerald-400'
            }`}
          >
            {isLoading && <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />}
            <span>{isLoading ? 'Processing...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
