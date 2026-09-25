import React from 'react';
import {
  LayoutDashboard,
  HeartHandshake,
  Receipt,
  CalendarDays,
  Menu,
} from 'lucide-react';
import { NavItemKey } from './Sidebar';

interface MobileBottomNavProps {
  activeTab: NavItemKey;
  onTabChange: (tab: NavItemKey) => void;
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenMenu,
}) => {
  const isMenuTabActive = ['monthly', 'yearly', 'reports', 'members', 'settings'].includes(activeTab);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 shadow-lg px-2 py-1 safe-area-bottom">
      <div className="flex items-center justify-around">
        <button
          type="button"
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
            activeTab === 'dashboard'
              ? 'text-emerald-800 font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 mb-0.5 ${activeTab === 'dashboard' ? 'text-emerald-800' : 'text-stone-400'}`} />
          <span>ড্যাশবোর্ড</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('donations')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
            activeTab === 'donations'
              ? 'text-emerald-800 font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <HeartHandshake className={`w-5 h-5 mb-0.5 ${activeTab === 'donations' ? 'text-emerald-800' : 'text-stone-400'}`} />
          <span>হাদিয়া</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('expenses')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
            activeTab === 'expenses'
              ? 'text-rose-800 font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Receipt className={`w-5 h-5 mb-0.5 ${activeTab === 'expenses' ? 'text-rose-700' : 'text-stone-400'}`} />
          <span>খরচ</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('mahfil')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
            activeTab === 'mahfil'
              ? 'text-emerald-800 font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <CalendarDays className={`w-5 h-5 mb-0.5 ${activeTab === 'mahfil' ? 'text-emerald-800' : 'text-stone-400'}`} />
          <span>মাহফিল</span>
        </button>

        <button
          type="button"
          onClick={onOpenMenu}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
            isMenuTabActive
              ? 'text-emerald-800 font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Menu className={`w-5 h-5 mb-0.5 ${isMenuTabActive ? 'text-emerald-800' : 'text-stone-400'}`} />
          <span>মেনু</span>
        </button>
      </div>
    </div>
  );
};
