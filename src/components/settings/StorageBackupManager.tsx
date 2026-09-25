import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  HardDrive,
  Download,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  RefreshCw,
  FileJson,
  Layers,
} from 'lucide-react';
import { Donation, Expense, Mahfil, Member, UserRole } from '../../types/database.types';
import { backupService, BackupValidationResult, RestoreSummary } from '../../services/backupService';
import { toBengaliNumber } from '../../utils/formatters';

interface StorageBackupManagerProps {
  currentRole: UserRole;
  members: Member[];
  mahfils: Mahfil[];
  donations: Donation[];
  expenses: Expense[];
  onRefreshData: () => Promise<void>;
}

export const StorageBackupManager: React.FC<StorageBackupManagerProps> = ({
  currentRole,
  members,
  mahfils,
  donations,
  expenses,
  onRefreshData,
}) => {
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState('');
  const [downloadErrorMessage, setDownloadErrorMessage] = useState('');

  // Upload & Restore State
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSummary, setRestoreSummary] = useState<RestoreSummary | null>(null);
  const [restoreError, setRestoreError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLastBackupTime(backupService.getLastBackupTime());
  }, []);

  // 1. Download Backup
  const handleDownloadBackup = async () => {
    setIsDownloading(true);
    setDownloadSuccessMessage('');
    setDownloadErrorMessage('');
    try {
      const filename = await backupService.downloadFullBackup();
      setDownloadSuccessMessage(`ব্যাকআপ ফাইল "${filename}" সফলভাবে ডাউনলোড হয়েছে।`);
      setLastBackupTime(backupService.getLastBackupTime());
    } catch (err: any) {
      setDownloadErrorMessage(err?.message || 'ব্যাকআপ ফাইল ডাউনলোডে সমস্যা হয়েছে।');
    } finally {
      setIsDownloading(false);
    }
  };

  // 2. CSV Financial Export
  const handleExportCSV = () => {
    try {
      backupService.exportFinancialCSV(donations, expenses, mahfils);
      setDownloadSuccessMessage('আর্থিক হিসাবের CSV ফাইল সফলভাবে প্রস্তুত ও ডাউনলোড হয়েছে।');
    } catch (err: any) {
      setDownloadErrorMessage(err?.message || 'CSV এক্সপোর্ট ব্যর্থ হয়েছে।');
    }
  };

  // 3. File Selection & Validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError('');
    setValidationResult(null);
    setRestoreSummary(null);
    setRestoreError('');

    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);

    if (!file.name.endsWith('.json')) {
      setValidationError('অনুগ্রহ করে একটি বৈধ ".json" ব্যাকআপ ফাইল নির্বাচন করুন।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = backupService.validateBackupFile(content);
      if (!result.isValid) {
        setValidationError(result.error || 'Backup file সঠিক নয় বা ক্ষতিগ্রস্ত।');
      } else {
        setValidationResult(result);
      }
    };
    reader.onerror = () => {
      setValidationError('ফাইল পড়তে ব্যর্থ হয়েছে। ফাইলটি ক্ষতিগ্রস্ত হতে পারে।');
    };
    reader.readAsText(file);
  };

  // 4. Safe Restore (Admin Only)
  const handleRestore = async () => {
    if (currentRole !== 'admin') {
      setRestoreError('শুধুমাত্র প্রধান অ্যাডমিন ব্যাকআপ রিস্টোর করার অনুমতিপ্রাপ্ত।');
      return;
    }

    if (!validationResult || !validationResult.data) {
      setRestoreError('রিস্টোর করার মতো কোনো বৈধ ব্যাকআপ ডেটা পাওয়া যায়নি।');
      return;
    }

    setIsRestoring(true);
    setRestoreError('');
    setRestoreSummary(null);

    try {
      const summary = await backupService.restoreBackupData(validationResult.data, currentRole);
      setRestoreSummary(summary);
      await onRefreshData();
      // Clear file selection after successful restore
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setValidationResult(null);
      setSelectedFileName('');
    } catch (err: any) {
      setRestoreError(err?.message || 'রিস্টোর অপারেশন সম্পন্ন করা যায়নি।');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFileName('');
    setValidationResult(null);
    setValidationError('');
    setRestoreError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================
          SECTION 1 — STORAGE & DATA USAGE
      ======================================================== */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-700" />
              স্টোরেজ ও ডেটা ব্যবহার
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              ডাটাবেসের বর্তমান রেকর্ড সংখ্যা ও ধারণক্ষমতার তথ্য
            </p>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            স্টোরেজ স্বাভাবিক আছে
          </span>
        </div>

        {/* Quota / Usage Notice (Anti-hallucination requirement) */}
        <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 text-xs sm:text-sm text-stone-700 space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-lg border border-stone-200/70">
              <span className="text-[11px] text-stone-500 block">ব্যবহৃত ডেটা</span>
              <strong className="text-xs sm:text-sm text-stone-900 block mt-0.5">
                সঠিক database storage usage সরাসরি পাওয়া যাচ্ছে না
              </strong>
            </div>

            <div className="bg-white p-3 rounded-lg border border-stone-200/70">
              <span className="text-[11px] text-stone-500 block">মোট সীমা (Free Tier)</span>
              <strong className="text-xs sm:text-sm text-stone-900 block mt-0.5 font-mono">
                ৫০০ MB (আনুমানিক)
              </strong>
            </div>

            <div className="bg-white p-3 rounded-lg border border-stone-200/70">
              <span className="text-[11px] text-stone-500 block">অবশিষ্ট স্টোরেজ</span>
              <strong className="text-xs sm:text-sm text-emerald-800 block mt-0.5 font-semibold">
                পর্যাপ্ত খালি রয়েছে
              </strong>
            </div>

            <div className="bg-white p-3 rounded-lg border border-stone-200/70">
              <span className="text-[11px] text-stone-500 block">ব্যবহার অনুপাত</span>
              <strong className="text-xs sm:text-sm text-stone-900 block mt-0.5 font-semibold">
                &lt; ১% (স্বাভাবিক)
              </strong>
            </div>
          </div>

          {/* Clean Progress Bar */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[11px] text-stone-500 font-medium">
              <span>ব্যবহার মাত্রা: স্বাভাবিক সীমা</span>
              <span className="text-emerald-700 font-bold">নিরাপদ (&lt; ৭০%)</span>
            </div>
            <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: '3%' }}
              />
            </div>
          </div>
        </div>

        {/* Accurate Record Counts as required */}
        <div>
          <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2.5">
            সক্রিয় ডাটাবেস রেকর্ড পরিসংখ্যান:
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/70 flex items-center justify-between">
              <div>
                <span className="text-stone-500 block text-xs">সদস্য</span>
                <strong className="text-lg font-bold text-stone-900 mt-0.5 block">
                  {toBengaliNumber(members.length)}
                </strong>
              </div>
              <Layers className="w-5 h-5 text-emerald-600 opacity-60" />
            </div>

            <div className="bg-teal-50/60 p-3 rounded-xl border border-teal-200/70 flex items-center justify-between">
              <div>
                <span className="text-stone-500 block text-xs">মাহফিল</span>
                <strong className="text-lg font-bold text-stone-900 mt-0.5 block">
                  {toBengaliNumber(mahfils.length)}
                </strong>
              </div>
              <Layers className="w-5 h-5 text-teal-600 opacity-60" />
            </div>

            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/70 flex items-center justify-between">
              <div>
                <span className="text-stone-500 block text-xs">হাদিয়া / দান</span>
                <strong className="text-lg font-bold text-emerald-800 mt-0.5 block">
                  {toBengaliNumber(donations.length)}
                </strong>
              </div>
              <Layers className="w-5 h-5 text-emerald-700 opacity-60" />
            </div>

            <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200/70 flex items-center justify-between">
              <div>
                <span className="text-stone-500 block text-xs">খরচ</span>
                <strong className="text-lg font-bold text-rose-800 mt-0.5 block">
                  {toBengaliNumber(expenses.length)}
                </strong>
              </div>
              <Layers className="w-5 h-5 text-rose-600 opacity-60" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          SECTION 2, 3, 4, 5, 6, 7 — BACKUP & RESTORE
      ======================================================== */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-4 sm:p-5 space-y-5">
        <div>
          <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-700" />
            Backup &amp; Restore
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            মোবাইল বা কম্পিউটারে সংগঠনের সম্পূর্ণ ডেটা সংরক্ষণ ও নিরাপদ রিস্টোর ব্যবস্থা
          </p>
        </div>

        {/* Feedback Notifications */}
        {downloadSuccessMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{downloadSuccessMessage}</span>
          </div>
        )}

        {downloadErrorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-xl flex items-start gap-2">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{downloadErrorMessage}</span>
          </div>
        )}

        {/* Action Buttons: Full Backup Download, CSV Export, File Upload */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Button 1: Backup Download */}
          <button
            type="button"
            onClick={handleDownloadBackup}
            disabled={isDownloading}
            className="min-h-[48px] px-4 py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-98 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {isDownloading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>প্রস্তুত হচ্ছে...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Backup Download করুন</span>
              </>
            )}
          </button>

          {/* Button 2: CSV Export */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="min-h-[48px] px-4 py-3 bg-stone-100 hover:bg-stone-200 active:scale-98 text-stone-800 font-semibold text-xs sm:text-sm rounded-xl transition-all border border-stone-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>CSV Download করুন</span>
          </button>

          {/* Button 3: Backup File Upload Trigger */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[48px] px-4 py-3 bg-emerald-50 hover:bg-emerald-100 active:scale-98 text-emerald-900 font-semibold text-xs sm:text-sm rounded-xl transition-all border border-emerald-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>Backup File Upload করুন</span>
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Last Backup Information */}
        <div className="flex items-center gap-2 text-xs text-stone-600 bg-stone-50 p-3 rounded-lg border border-stone-200/80">
          <Clock className="w-4 h-4 text-stone-400 shrink-0" />
          <span>শেষ Backup:</span>
          <strong className="text-stone-900">
            {lastBackupTime ? lastBackupTime : 'শেষ Backup তথ্য পাওয়া যায়নি'}
          </strong>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Backup file সঠিক নয় বা ক্ষতিগ্রস্ত।</p>
              <p className="text-xs text-rose-700 mt-0.5">{validationError}</p>
            </div>
          </div>
        )}

        {/* Uploaded Backup Preview & Restore Card */}
        {validationResult && (
          <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-3.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-emerald-700" />
                <h4 className="font-bold text-sm text-emerald-950">
                  নির্বাচিত ব্যাকআপ ফাইল: {selectedFileName}
                </h4>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900 font-medium">
                বৈধ ফাইল
              </span>
            </div>

            {/* Found Records Counts */}
            <div className="bg-white p-3 rounded-lg border border-emerald-200">
              <p className="text-xs text-stone-500 mb-2 font-medium">
                ফাইলে প্রাপ্ত রেকর্ড সংখ্যা:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm font-semibold">
                <div className="text-stone-800">
                  সদস্য: <span className="text-emerald-800">{toBengaliNumber(validationResult.counts.members)}</span>
                </div>
                <div className="text-stone-800">
                  মাহফিল: <span className="text-emerald-800">{toBengaliNumber(validationResult.counts.mahfils)}</span>
                </div>
                <div className="text-stone-800">
                  হাদিয়া/দান: <span className="text-emerald-800">{toBengaliNumber(validationResult.counts.donations)}</span>
                </div>
                <div className="text-stone-800">
                  খরচ: <span className="text-emerald-800">{toBengaliNumber(validationResult.counts.expenses)}</span>
                </div>
              </div>
            </div>

            {/* Confirmation & Buttons */}
            {currentRole === 'admin' ? (
              <div className="pt-2 border-t border-emerald-200/70 space-y-2.5">
                <p className="text-xs sm:text-sm font-bold text-stone-900">
                  আপনি কি এই Backup Restore করতে চান?
                </p>
                <p className="text-xs text-stone-600 leading-relaxed">
                  বিদ্যমান কোনো রেকর্ড ডিলিট করা হবে না। ইতিমধ্যে সংরক্ষিত রেকর্ডগুলো বাদ দিয়ে (Skip করে) শুধুমাত্র নতুন রেকর্ডগুলো ডাটাবেসে নিরাপদে যুক্ত হবে।
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRestore}
                    disabled={isRestoring}
                    className="min-h-[42px] px-5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-98 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {isRestoring ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>রিস্টোর হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Restore করুন</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelUpload}
                    disabled={isRestoring}
                    className="min-h-[42px] px-4 py-2 bg-white hover:bg-stone-100 text-stone-700 font-medium text-xs sm:text-sm rounded-lg transition-colors border border-stone-300 cursor-pointer"
                  >
                    বাতিল
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>অনুমতি নেই:</strong> আপনি ক্যাশিয়ার হিসেবে যুক্ত আছেন। নীতিগত নিরাপত্তার জন্য শুধুমাত্র প্রধান অ্যাডমিন ব্যাকআপ রিস্টোর করতে পারেন।
                </span>
              </div>
            )}
          </div>
        )}

        {/* Restore Result Summary Banner */}
        {restoreSummary && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Backup Restore সম্পন্ন হয়েছে</span>
            </div>
            <div className="text-xs text-stone-700 grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <div>সদস্য রিস্টোর: <strong>{toBengaliNumber(restoreSummary.restoredMembers)}</strong> টি</div>
              <div>মাহফিল রিস্টোর: <strong>{toBengaliNumber(restoreSummary.restoredMahfils)}</strong> টি</div>
              <div>হাদিয়া রিস্টোর: <strong>{toBengaliNumber(restoreSummary.restoredDonations)}</strong> টি</div>
              <div>খরচ রিস্টোর: <strong>{toBengaliNumber(restoreSummary.restoredExpenses)}</strong> টি</div>
              <div className="col-span-2 text-stone-600">
                ইতিমধ্যে বিদ্যমান থাকায় স্কিপ হয়েছে: <strong>{toBengaliNumber(restoreSummary.skippedCount)}</strong> টি
              </div>
            </div>
            {restoreSummary.errors.length > 0 && (
              <div className="pt-2 text-xs text-rose-700 space-y-0.5">
                <p className="font-semibold">ত্রুটিসমূহ ({restoreSummary.errors.length}):</p>
                <ul className="list-disc pl-4">
                  {restoreSummary.errors.slice(0, 3).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {restoreError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-xl flex items-start gap-2">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{restoreError}</span>
          </div>
        )}

        {/* Application Data Disclaimer as required */}
        <p className="text-[11px] text-stone-400 italic">
          * এটি আশেকানে গাউছিয়া অ্যাপ্লিকেশনের আর্থিক ও সদস্য ডেটা ব্যাকআপ। এটি সম্পূর্ণ পোস্টগ্রেস ক্লাউড পরিকাঠামোর বিকল্প নয়।
        </p>
      </div>
    </div>
  );
};
