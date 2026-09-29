import React, { useState, useEffect, useCallback } from 'react';
import { OrgMember, fetchOrgMembersFromGoogleSheet } from '../../services/googleSheetService';
import { isGoogleSheetConfigured, GOOGLE_SHEET_CONFIG } from '../../config/googleSheetConfig';
import { toBengaliNumber } from '../../utils/formatters';
import {
  Users,
  Search,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
  Award,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface OrgMembersSectionProps {
  themeAccentColor?: string;
}

export const OrgMembersSection: React.FC<OrgMembersSectionProps> = ({
  themeAccentColor = '#047857',
}) => {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // If not configured (i.e. placeholder), don't fetch!
    if (!isGoogleSheetConfigured()) {
      setIsConfigured(false);
      setMembers([]);
      setIsLoading(false);
      return;
    }

    setIsConfigured(true);
    const result = await fetchOrgMembersFromGoogleSheet();

    setIsConfigured(result.isConfigured);
    setMembers(result.members);
    setError(result.error);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Client-side search filtering (in-memory)
  const filteredMembers = React.useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase().trim();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.position.toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Section Header Card */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>পাবলিক পরিচালনা পর্ষদ ও দায়িত্বশীলবৃন্দ</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-700" />
              <span>{GOOGLE_SHEET_CONFIG.sectionTitle}</span>
            </h3>
            <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              {GOOGLE_SHEET_CONFIG.sectionSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={loadMembers}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-stone-100 hover:bg-stone-200/80 text-stone-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer border border-stone-200"
              title="তালিকাসমূহ রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-700' : ''}`} />
              <span>রিফ্রেশ</span>
            </button>
          </div>
        </div>

        {/* Search Bar when members are present */}
        {members.length > 0 && !isLoading && (
          <div className="mt-5 pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="সদস্যের নাম বা পদবী দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="text-xs text-stone-500 font-medium shrink-0">
              সর্বমোট <strong className="text-stone-800 font-bold">{toBengaliNumber(filteredMembers.length)}</strong> জন সদস্য
              {searchQuery && ` (${toBengaliNumber(members.length)} জনের মধ্যে)`}
            </div>
          </div>
        )}
      </div>

      {/* 1. Loading State */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-stone-200/90 p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-3 min-h-[300px]">
          <div
            className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: `${themeAccentColor} transparent ${themeAccentColor} ${themeAccentColor}` }}
          />
          <h4 className="text-base font-bold text-stone-800">
            সদস্য তালিকা লোড হচ্ছে...
          </h4>
          <p className="text-xs text-stone-500 max-w-md">
            সংগঠনের সদস্যবৃন্দের নির্ধারিত খতিয়ান সংগ্রহ করা হচ্ছে
          </p>
        </div>
      ) : error ? (
        /* 2. Error State with Retry Button */
        <div className="bg-rose-50/90 rounded-2xl border border-rose-200 p-8 text-center shadow-xs flex flex-col items-center justify-center space-y-3 min-h-[260px]">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xl">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <h4 className="text-base font-bold text-rose-900">
            সদস্য তালিকা লোড করা যাচ্ছে না
          </h4>
          <p className="text-xs text-rose-700 max-w-md leading-relaxed font-mono">
            {error}
          </p>
          <button
            type="button"
            onClick={loadMembers}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>আবার চেষ্টা করুন</span>
          </button>
        </div>
      ) : !isConfigured ? (
        /* 3. Empty State: Not yet configured with real Google Sheet URL */
        <div className="bg-white rounded-2xl border border-stone-200/90 p-8 sm:p-10 text-center shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100 shadow-inner">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h4 className="text-base font-bold text-stone-900">
              সংগঠনের সদস্যবৃন্দের তালিকা বর্তমানে প্রক্রিয়াধীন
            </h4>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              সংগঠনের পরিচালনা পর্ষদ ও দায়িত্বশীল সদস্যবৃন্দের পূর্ণাঙ্গ তালিকা শীঘ্রই প্রকাশিত হবে।
            </p>
          </div>

          {/* Admin Guidance Box */}
          <div className="max-w-lg mx-auto p-4 bg-stone-50 rounded-xl border border-stone-200/80 text-left text-xs text-stone-600 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-stone-800">
              <Info className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>এডমিনদের জন্য নির্দেশনা (Netlify / Google Sheet Setup):</span>
            </div>
            <p className="text-stone-500 leading-relaxed">
              গুগল শিটের ৩টি কলাম (Name | Position | Display Order) রেখে File &gt; Share &gt; <strong>Publish to web</strong> এ যান। Format হিসেবে <strong>Comma-separated values (.csv)</strong> নির্বাচন করে Publish বাটনে ক্লিক করুন। প্রাপ্ত পাবলিশড CSV লিংকটি Netlify ড্যাশবোর্ডে Environment Variable হিসেবে <code className="bg-white px-1.5 py-0.5 rounded border border-stone-300 font-mono text-[11px] text-emerald-800 font-bold">VITE_PUBLIC_ORG_MEMBERS_SHEET_URL</code> এ যুক্ত করুন।
            </p>
          </div>
        </div>
      ) : filteredMembers.length === 0 ? (
        /* 4. Empty State: Configured but no rows */
        <div className="bg-white rounded-2xl border border-stone-200/90 p-10 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-stone-800">
            {searchQuery ? 'অনুসন্ধানের সাথে কোনো সদস্য মেলেনি' : 'বর্তমানে কোনো সদস্যের তথ্য পাওয়া যায়নি'}
          </h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchQuery ? 'ভিন্ন কোনো নাম বা পদবী লিখে পুনরায় চেষ্টা করুন।' : 'সংগঠনের সদস্যবৃন্দের তথ্য শীঘ্রই হালনাগাদ করা হবে।'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center px-3 py-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors font-medium cursor-pointer"
            >
              অনুসন্ধান ক্লিয়ার করুন
            </button>
          )}
        </div>
      ) : (
        /* 5. Loaded Member Cards Display (Mobile-first, Responsive Grid) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredMembers.map((member, index) => {
            const initialChar = member.name.charAt(0) || 'স';
            return (
              <div
                key={`${member.name}-${member.sheetIndex}-${index}`}
                className="bg-white rounded-xl border border-stone-200/90 shadow-xs p-4 sm:p-5 hover:border-emerald-300 hover:shadow-sm transition-all flex items-start gap-3.5 group"
              >
                {/* Avatar Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-base shrink-0 shadow-xs select-none"
                  style={{ backgroundColor: themeAccentColor }}
                >
                  {initialChar}
                </div>

                {/* Member Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <h5 className="font-bold text-stone-900 text-sm sm:text-base truncate group-hover:text-emerald-800 transition-colors">
                      {member.name}
                    </h5>
                  </div>

                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                      <Award className="w-3 h-3 text-emerald-600" />
                      <span>{member.position}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
