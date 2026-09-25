import React from 'react';
import {
  LayoutDashboard,
  HeartHandshake,
  CalendarDays,
  Receipt,
  CalendarRange,
  BarChart3,
  FileSpreadsheet,
  Users,
  Settings,
  Database,
  CloudOff,
} from 'lucide-react';

export type NavItemKey =
  | 'dashboard'
  | 'donations'
  | 'mahfil'
  | 'expenses'
  | 'monthly'
  | 'yearly'
  | 'reports'
  | 'members'
  | 'settings';

interface SidebarProps {
  activeTab: NavItemKey;
  onTabChange: (tab: NavItemKey) => void;
  isDatabaseConfigured: boolean;
  isPublicGuest?: boolean;
}

export const navItems: { key: NavItemKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'ড্যাশবোর্ড', icon: <LayoutDashboard className="w-5 h-5" /> },
  { key: 'donations', label: 'হাদিয়া / দান', icon: <HeartHandshake className="w-5 h-5" /> },
  { key: 'mahfil', label: 'মাহফিল', icon: <CalendarDays className="w-5 h-5" /> },
  { key: 'expenses', label: 'খরচ সমূহ', icon: <Receipt className="w-5 h-5" /> },
  { key: 'monthly', label: 'মাসিক হিসাব', icon: <CalendarRange className="w-5 h-5" /> },
  { key: 'yearly', label: 'বাৎসরিক হিসাব', icon: <BarChart3 className="w-5 h-5" /> },
  { key: 'reports', label: 'রিপোর্ট ও বিবরণী', icon: <FileSpreadsheet className="w-5 h-5" /> },
  { key: 'members', label: 'সদস্যবৃন্দ', icon: <Users className="w-5 h-5" /> },
  { key: 'settings', label: 'সেটিংস ও ব্যাকআপ', icon: <Settings className="w-5 h-5" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isDatabaseConfigured,
  isPublicGuest = false,
}) => {
  const visibleItems = isPublicGuest
    ? navItems.filter((i) => i.key !== 'settings')
    : navItems;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-stone-900 text-stone-100 min-h-screen border-r border-stone-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            আ
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-wide">
              আশেকানে গাউছিয়া
            </h1>
            <p className="text-xs text-stone-400">
              হাদিয়া, মাহফিল ও আয়-ব্যয়
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onTabChange(item.key)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
                isActive
                  ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/80'
              }`}
            >
              <span className={isActive ? 'text-emerald-300' : 'text-stone-400'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Connection Status */}
      <div className="p-4 border-t border-stone-800 text-xs">
        <div className="flex items-center gap-2">
          {isDatabaseConfigured ? (
            <>
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="text-stone-300">সুপাবেস ডাটাবেস সক্রিয়</span>
            </>
          ) : (
            <>
              <CloudOff className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300">ডাটাবেস সংযোগ বিচ্ছিন্ন</span>
            </>
          )}
        </div>
        <div className="text-[11px] text-stone-500 mt-1">
          সংস্করণ ২.৪ · নিরাপদ ও এনক্রিপ্টেড
        </div>
      </div>
    </aside>
  );
};
