import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Member, Donation } from '../types/database.types';
import { formatCurrency, toBengaliNumber } from '../utils/formatters';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  HeartHandshake,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { PaginationControls } from '../components/common/PaginationControls';
import { databaseService, MemberFilterOptions } from '../services/databaseService';

interface MembersPageProps {
  members: Member[];
  donations: Donation[];
  onAddMember: () => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (id: string, name: string) => void;
  onRecordDonationForMember: (member: Member) => void;
  canEdit: boolean;
  canDelete: boolean;
  isPublicGuest?: boolean;
}

export const MembersPage: React.FC<MembersPageProps> = ({
  members,
  donations,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onRecordDonationForMember,
  canEdit,
  canDelete,
  isPublicGuest = false,
}) => {
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [pageMembers, setPageMembers] = useState<Member[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [donationTotals, setDonationTotals] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const queryFilters = useMemo((): MemberFilterOptions => {
    return {
      page,
      pageSize,
      search: debouncedSearch || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    };
  }, [page, pageSize, debouncedSearch, statusFilter]);

  const prevMembersLengthRef = useRef(members.length);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await databaseService.getMembersPaginated(queryFilters);
      setPageMembers(result.data);
      setTotalCount(result.totalCount);

      // Fetch donation totals for the 20 visible members
      const memberIds = result.data.map((m) => m.id);
      const phones = result.data.map((m) => m.phone || m.mobileNumber || '').filter(Boolean);
      if (memberIds.length > 0 || phones.length > 0) {
        const totals = await databaseService.getMemberDonationTotals(memberIds, phones);
        setDonationTotals(totals);
      } else {
        setDonationTotals({});
      }
      setError(null);
    } catch (err: any) {
      console.error('Error in loadMembers:', err);
      setError(err?.message || 'ডাটাবেস থেকে সদস্য তালিকা লোড করা যায়নি');
      setPageMembers([]);
      setTotalCount(0);
      setDonationTotals({});
    } finally {
      setIsLoading(false);
    }
  }, [queryFilters]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    if (prevMembersLengthRef.current !== members.length) {
      prevMembersLengthRef.current = members.length;
      loadMembers();
    }
  }, [members, loadMembers]);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            সদস্যবৃন্দ
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            সংগঠনের সম্মানিত সদস্য ও শুভানুধ্যায়ীদের তালিকা
          </p>
        </div>

        {canEdit && !isPublicGuest && (
          <button
            type="button"
            onClick={onAddMember}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন সদস্য নিবন্ধন</span>
          </button>
        )}
      </div>

      {/* Search and Status Filters */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isPublicGuest ? "সদস্যের নাম দিয়ে খুঁজুন..." : "নাম বা মোবাইল দিয়ে খুঁজুন..."}
            className="w-full h-10 pl-9 pr-3 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setPage(1);
            }}
            className={`flex-1 sm:flex-none py-1.5 px-3 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
              statusFilter === 'all'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            সকল ({toBengaliNumber(totalCount)})
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('active');
              setPage(1);
            }}
            className={`flex-1 sm:flex-none py-1.5 px-3 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
              statusFilter === 'active'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            সক্রিয়
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('inactive');
              setPage(1);
            }}
            className={`flex-1 sm:flex-none py-1.5 px-3 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
              statusFilter === 'inactive'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            নিষ্ক্রিয়
          </button>
        </div>
      </div>

      {/* Member Cards Grid Area */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-stone-200/90 p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-3 min-h-[300px]">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <h3 className="text-base font-bold text-stone-800">
            লোড হচ্ছে...
          </h3>
          <p className="text-xs text-stone-500 max-w-md">
            ডাটাবেস থেকে সদস্যদের তথ্য সংগ্রহ করা হচ্ছে
          </p>
        </div>
      ) : error ? (
        <div className="bg-rose-50/90 rounded-xl border border-rose-200 p-8 text-center shadow-xs flex flex-col items-center justify-center space-y-3 min-h-[220px]">
          <AlertTriangle className="w-8 h-8 text-rose-600" />
          <h3 className="text-base font-bold text-rose-900">
            হিসাব লোড করা যাচ্ছে না। আবার চেষ্টা করুন।
          </h3>
          <p className="text-xs text-rose-700 max-w-md leading-relaxed">
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
      ) : pageMembers.length === 0 ? (
        <EmptyState
          title="কোনো সদস্য পাওয়া যায়নি"
          description={
            search || statusFilter !== 'all'
              ? 'আপনার অনুসন্ধান অনুসারে কোনো সদস্যের তথ্য মেলেনি।'
              : 'এখনো সংগঠনের কোনো সদস্য নিবন্ধিত হননি।'
          }
          actionText={canEdit && !search && !isPublicGuest ? '+ নতুন সদস্য নিবন্ধন করুন' : undefined}
          onAction={onAddMember}
          icon={<Users className="w-6 h-6 stroke-1.5" />}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageMembers.map((m) => {
              const totalDonated =
                (donationTotals[m.id] !== undefined ? donationTotals[m.id] : 0) ||
                (m.phone && donationTotals[m.phone] !== undefined ? donationTotals[m.phone] : 0);

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border border-stone-200/90 shadow-xs hover:border-emerald-300 transition-all p-4 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-base text-stone-900 line-clamp-1">
                          {m.name}
                        </h3>
                        {!isPublicGuest && m.notes && (
                          <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                            {m.notes}
                          </p>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border shrink-0 ${
                          m.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-stone-100 text-stone-600 border-stone-200'
                        }`}
                      >
                        {m.status === 'active' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> সক্রিয়
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-stone-400" /> নিষ্ক্রিয়
                          </>
                        )}
                      </span>
                    </div>

                    {/* Contact info - only visible to authenticated Admin/Cashier */}
                    {!isPublicGuest && (
                      <div className="space-y-1.5 mt-3 text-xs text-stone-600">
                        {(m.phone || m.mobileNumber) && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="font-mono">{m.phone || m.mobileNumber}</span>
                          </div>
                        )}
                        {m.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{m.address}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Total Donated by this member */}
                    <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="text-stone-500">মোট হাদিয়া প্রদান:</span>
                      <strong className="text-emerald-800 font-bold">
                        {formatCurrency(totalDonated)}
                      </strong>
                    </div>
                  </div>

                  {/* Actions for Admin / Cashier only */}
                  {canEdit && !isPublicGuest && (
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onRecordDonationForMember(m)}
                        className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors min-h-[40px]"
                      >
                        <HeartHandshake className="w-3.5 h-3.5" />
                        <span>হাদিয়া গ্রহণ</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditMember(m)}
                          title="সম্পাদনা"
                          className="min-h-[40px] p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDeleteMember(m.id, m.name)}
                            title="মুছে ফেলুন"
                            className="min-h-[40px] p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={(newPage) => {
              setPage(newPage);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
};
