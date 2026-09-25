import React, { useState, useMemo } from 'react';
import { Donation, Expense, Mahfil } from '../types/database.types';
import {
  formatCurrency,
  formatBengaliDate,
  toBengaliNumber,
  BENGALI_MONTHS,
  getBengaliMonthName,
  getPaymentMethodLabel,
} from '../utils/formatters';
import { exportToCSV, triggerPrint } from '../utils/exportHelpers';
import { Printer, FileDown, FileSpreadsheet, Calendar, Filter } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

interface ReportsPageProps {
  donations: Donation[];
  expenses: Expense[];
  mahfils: Mahfil[];
}

type ReportType = 'monthly' | 'yearly' | 'donations' | 'expenses' | 'mahfil';

export const ReportsPage: React.FC<ReportsPageProps> = ({
  donations,
  expenses,
  mahfils,
}) => {
  const currentDate = new Date();
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [selectedYear, setSelectedYear] = useState<string>(String(currentDate.getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(currentDate.getMonth() + 1).padStart(2, '0')
  );
  const [selectedMahfilId, setSelectedMahfilId] = useState<string>('');

  const availableYears = useMemo(() => {
    const current = new Date().getFullYear();
    const set = new Set<string>([String(current), String(current - 1), String(current + 1)]);
    donations.forEach((d) => set.add(d.date.split('-')[0]));
    expenses.forEach((e) => set.add(e.date.split('-')[0]));
    return Array.from(set).sort().reverse();
  }, [donations, expenses]);

  const monthPrefix = `${selectedYear}-${selectedMonth}`;
  const yearPrefix = `${selectedYear}-`;

  // Filtered dataset according to active report tab
  const reportDonations = useMemo(() => {
    if (reportType === 'monthly') {
      return donations.filter((d) => d.date.startsWith(monthPrefix));
    }
    if (reportType === 'yearly') {
      return donations.filter((d) => d.date.startsWith(yearPrefix));
    }
    if (reportType === 'mahfil' && selectedMahfilId) {
      return donations.filter((d) => d.mahfilId === selectedMahfilId);
    }
    return donations;
  }, [donations, reportType, monthPrefix, yearPrefix, selectedMahfilId]);

  const reportExpenses = useMemo(() => {
    if (reportType === 'monthly') {
      return expenses.filter((e) => e.date.startsWith(monthPrefix));
    }
    if (reportType === 'yearly') {
      return expenses.filter((e) => e.date.startsWith(yearPrefix));
    }
    if (reportType === 'mahfil' && selectedMahfilId) {
      return expenses.filter((e) => e.mahfilId === selectedMahfilId);
    }
    return expenses;
  }, [expenses, reportType, monthPrefix, yearPrefix, selectedMahfilId]);

  const totalIncome = reportDonations.reduce((sum, d) => sum + d.amount, 0);
  const totalExpense = reportExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const currentMahfil = mahfils.find((m) => m.id === selectedMahfilId) || mahfils[0];

  const handleExportCSV = () => {
    if (reportType === 'donations' || reportType === 'monthly' || reportType === 'yearly') {
      const rows = reportDonations.map((d) => ({
        donorName: d.donorName,
        mobileNumber: d.mobileNumber || '-',
        amount: d.amount,
        date: d.date,
        category: d.category,
        paymentMethod: getPaymentMethodLabel(d.paymentMethod),
        notes: d.notes || '-',
      }));
      exportToCSV(`report_${reportType}_donations_${selectedYear}`, rows, [
        { key: 'donorName', label: 'দাতার নাম' },
        { key: 'mobileNumber', label: 'মোবাইল নম্বর' },
        { key: 'amount', label: 'টাকার পরিমাণ (৳)' },
        { key: 'date', label: 'তারিখ' },
        { key: 'category', label: 'খাত' },
        { key: 'paymentMethod', label: 'পরিশোধ মাধ্যম' },
        { key: 'notes', label: 'মন্তব্য' },
      ]);
    } else if (reportType === 'expenses') {
      const rows = reportExpenses.map((e) => ({
        title: e.title,
        recipient: e.recipient,
        amount: e.amount,
        date: e.date,
        category: e.category,
        paymentMethod: getPaymentMethodLabel(e.paymentMethod),
        notes: e.notes || '-',
      }));
      exportToCSV(`report_expenses_${selectedYear}`, rows, [
        { key: 'title', label: 'খরচের বিষয়' },
        { key: 'recipient', label: 'প্রাপক / ভেন্ডর' },
        { key: 'amount', label: 'টাকা (৳)' },
        { key: 'date', label: 'তারিখ' },
        { key: 'category', label: 'খাত' },
        { key: 'paymentMethod', label: 'পরিশোধ মাধ্যম' },
        { key: 'notes', label: 'ভাউচার / নোট' },
      ]);
    } else if (reportType === 'mahfil' && currentMahfil) {
      const rows = [
        ...reportDonations.map((d) => ({
          type: 'হাদিয়া',
          desc: d.donorName,
          amount: d.amount,
          date: d.date,
          category: d.category,
        })),
        ...reportExpenses.map((e) => ({
          type: 'ব্যয়',
          desc: `${e.title} (${e.recipient})`,
          amount: e.amount,
          date: e.date,
          category: e.category,
        })),
      ];
      exportToCSV(`mahfil_report_${currentMahfil.name}`, rows, [
        { key: 'type', label: 'ধরণ' },
        { key: 'desc', label: 'বিবরণ / ব্যক্তি' },
        { key: 'amount', label: 'টাকা (৳)' },
        { key: 'date', label: 'তারিখ' },
        { key: 'category', label: 'খাত' },
      ]);
    }
  };

  const reportTitle = {
    monthly: `মাসিক আর্থিক রিপোর্ট (${getBengaliMonthName(parseInt(selectedMonth, 10))} ${toBengaliNumber(selectedYear)})`,
    yearly: `বাৎসরিক আর্থিক বিবরণী (${toBengaliNumber(selectedYear)} সাল)`,
    donations: `হাদিয়া ও অনুদান বিবরণী`,
    expenses: `খরচ ও ব্যয় বিবরণী`,
    mahfil: currentMahfil ? `মাহফিল রিপোর্ট: ${currentMahfil.name}` : `মাহফিল বিবরণী`,
  }[reportType];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            রিপোর্ট ও আর্থিক বিবরণী
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            মুদ্রণযোগ্য ও রপ্তানিযোগ্য অফিসিয়াল অডিট রিপোর্ট
          </p>
        </div>

        {/* Action Buttons: Print, PDF, CSV */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={triggerPrint}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 text-xs sm:text-sm font-semibold text-stone-800 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4 text-stone-600" />
            <span>প্রিন্ট</span>
          </button>

          <button
            type="button"
            onClick={triggerPrint}
            title="ব্রাউজারের প্রিন্ট ডায়ালগ থেকে 'Save as PDF' নির্বাচন করুন"
            className="inline-flex items-center gap-1.5 h-10 px-3.5 text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            <FileDown className="w-4 h-4 text-emerald-700" />
            <span>PDF ডাউনলোড</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 text-xs sm:text-sm font-semibold text-stone-800 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs Selection (Zero-pill discipline) */}
      <div className="flex items-center gap-1 overflow-x-auto p-1 bg-stone-100 rounded-xl no-print">
        <button
          type="button"
          onClick={() => setReportType('monthly')}
          className={`py-2 px-3.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
            reportType === 'monthly'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          মাসিক রিপোর্ট
        </button>
        <button
          type="button"
          onClick={() => setReportType('yearly')}
          className={`py-2 px-3.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
            reportType === 'yearly'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          বাৎসরিক রিপোর্ট
        </button>
        <button
          type="button"
          onClick={() => setReportType('donations')}
          className={`py-2 px-3.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
            reportType === 'donations'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          হাদিয়া বিবরণী
        </button>
        <button
          type="button"
          onClick={() => setReportType('expenses')}
          className={`py-2 px-3.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
            reportType === 'expenses'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          খরচ বিবরণী
        </button>
        <button
          type="button"
          onClick={() => setReportType('mahfil')}
          className={`py-2 px-3.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
            reportType === 'mahfil'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          মাহফিল রিপোর্ট
        </button>
      </div>

      {/* Filter Row for Reports */}
      <div className="bg-white p-3.5 rounded-xl border border-stone-200/90 shadow-xs flex flex-wrap items-center gap-3 no-print">
        <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          রিপোর্ট পরিমিতি:
        </span>

        {reportType === 'monthly' && (
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 cursor-pointer"
            >
              {BENGALI_MONTHS.map((m, idx) => {
                const val = String(idx + 1).padStart(2, '0');
                return <option key={val} value={val}>{m}</option>;
              })}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="h-9 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>{toBengaliNumber(yr)} সাল</option>
              ))}
            </select>
          </div>
        )}

        {reportType === 'yearly' && (
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="h-9 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 cursor-pointer"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>{toBengaliNumber(yr)} সাল</option>
            ))}
          </select>
        )}

        {reportType === 'mahfil' && (
          <select
            value={selectedMahfilId}
            onChange={(e) => setSelectedMahfilId(e.target.value)}
            className="h-9 px-2.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 cursor-pointer"
          >
            <option value="">-- মাহফিল নির্বাচন করুন --</option>
            {mahfils.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.date})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Printable Sheet View */}
      <div className="bg-white rounded-2xl border border-stone-300 shadow-sm p-6 sm:p-10 print:p-0 print:border-none print:shadow-none space-y-6">
        {/* Printable Letterhead / Organization Banner */}
        <div className="text-center pb-6 border-b-2 border-stone-800">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            আশেকানে গাউছিয়া
          </h1>
          <p className="text-sm font-semibold text-emerald-800 mt-0.5">
            হাদিয়া, মাহফিল ও আয়-ব্যয়ের হিসাব
          </p>
          <p className="text-xs text-stone-500 mt-1">
            অফিসিয়াল আর্থিক নিরীক্ষা ও হিসাব বিবরণী
          </p>
          <div className="mt-3 inline-block px-4 py-1 rounded bg-stone-100 text-stone-800 text-sm font-bold border border-stone-300">
            {reportTitle}
          </div>
        </div>

        {/* 3 Summary Blocks */}
        <div className="grid grid-cols-3 gap-3 text-center border border-stone-200 rounded-xl p-3 bg-stone-50/50">
          <div>
            <span className="text-xs text-stone-500 block">মোট সংগৃহীত হাদিয়া</span>
            <strong className="text-base sm:text-xl font-bold text-emerald-800 block mt-1">
              {formatCurrency(totalIncome)}
            </strong>
          </div>
          <div className="border-x border-stone-200">
            <span className="text-xs text-stone-500 block">মোট অনুমোদিত ব্যয়</span>
            <strong className="text-base sm:text-xl font-bold text-rose-700 block mt-1">
              {formatCurrency(totalExpense)}
            </strong>
          </div>
          <div>
            <span className="text-xs text-stone-500 block">নীট স্থিতি / ব্যালেন্স</span>
            <strong className={`text-base sm:text-xl font-bold block mt-1 ${netBalance >= 0 ? 'text-teal-900' : 'text-rose-800'}`}>
              {formatCurrency(netBalance)}
            </strong>
          </div>
        </div>

        {/* Report Content Table */}
        {reportType === 'donations' || reportType === 'monthly' || reportType === 'yearly' ? (
          <div>
            <h4 className="text-sm font-bold text-stone-800 mb-2">
              হাদিয়া ও দানের বিস্তারিত তালিকা ({toBengaliNumber(reportDonations.length)} টি)
            </h4>
            {reportDonations.length === 0 ? (
              <div className="p-6 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-lg">
                নির্বাচিত মেয়াদের জন্য কোনো হাদিয়া জমা হয়নি।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-stone-200">
                  <thead className="bg-stone-100 font-semibold text-stone-700">
                    <tr>
                      <th className="p-2 border-b">ক্রমিক</th>
                      <th className="p-2 border-b">দানকারীর নাম</th>
                      <th className="p-2 border-b">তারিখ</th>
                      <th className="p-2 border-b">খাত</th>
                      <th className="p-2 border-b">মাধ্যম</th>
                      <th className="p-2 border-b text-right">টাকা (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {reportDonations.map((d, i) => (
                      <tr key={d.id}>
                        <td className="p-2 text-stone-500">{toBengaliNumber(i + 1)}</td>
                        <td className="p-2 font-medium text-stone-900">{d.donorName}</td>
                        <td className="p-2 text-stone-600">{formatBengaliDate(d.date)}</td>
                        <td className="p-2 text-stone-600">{d.category}</td>
                        <td className="p-2 text-stone-600">{getPaymentMethodLabel(d.paymentMethod)}</td>
                        <td className="p-2 text-right font-bold text-emerald-800">{formatCurrency(d.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-stone-50 font-bold border-t border-stone-300">
                    <tr>
                      <td colSpan={5} className="p-2 text-right text-stone-800">মোট হাদিয়া:</td>
                      <td className="p-2 text-right text-emerald-800">{formatCurrency(totalIncome)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        ) : null}

        {/* Expenses Sub-Table */}
        {(reportType === 'expenses' || reportType === 'monthly' || reportType === 'yearly' || reportType === 'mahfil') && (
          <div className="pt-2">
            <h4 className="text-sm font-bold text-stone-800 mb-2">
              খরচের বিস্তারিত ভাউচার তালিকা ({toBengaliNumber(reportExpenses.length)} টি)
            </h4>
            {reportExpenses.length === 0 ? (
              <div className="p-6 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-lg">
                নির্বাচিত মেয়াদের জন্য কোনো খরচের তথ্য নেই।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-stone-200">
                  <thead className="bg-stone-100 font-semibold text-stone-700">
                    <tr>
                      <th className="p-2 border-b">ক্রমিক</th>
                      <th className="p-2 border-b">খরচের বিষয়</th>
                      <th className="p-2 border-b">স্থান / ভেন্ডর / প্রাপক</th>
                      <th className="p-2 border-b">তারিখ</th>
                      <th className="p-2 border-b">খাত</th>
                      <th className="p-2 border-b text-right">টাকা (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {reportExpenses.map((e, i) => (
                      <tr key={e.id}>
                        <td className="p-2 text-stone-500">{toBengaliNumber(i + 1)}</td>
                        <td className="p-2 font-medium text-stone-900">{e.title}</td>
                        <td className="p-2 text-stone-700">{e.recipient}</td>
                        <td className="p-2 text-stone-600">{formatBengaliDate(e.date)}</td>
                        <td className="p-2 text-stone-600">{e.category}</td>
                        <td className="p-2 text-right font-bold text-rose-700">{formatCurrency(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-stone-50 font-bold border-t border-stone-300">
                    <tr>
                      <td colSpan={5} className="p-2 text-right text-stone-800">মোট খরচ:</td>
                      <td className="p-2 text-right text-rose-700">{formatCurrency(totalExpense)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Audit Signatures for Print */}
        <div className="pt-12 sm:pt-16 grid grid-cols-2 gap-8 text-xs text-stone-600 text-center">
          <div className="border-t border-stone-400 pt-2">
            হিসাব প্রস্তুতকারী / ক্যাশিয়ার স্বাক্ষর
          </div>
          <div className="border-t border-stone-400 pt-2">
            সভাপতি / সাধারণ সম্পাদক স্বাক্ষর ও সিল
          </div>
        </div>

        <div className="text-[11px] text-stone-400 text-center pt-4">
          রিপোর্ট প্রকাশের সময়: {new Date().toLocaleDateString('bn-BD', { dateStyle: 'full' })}
        </div>
      </div>
    </div>
  );
};
