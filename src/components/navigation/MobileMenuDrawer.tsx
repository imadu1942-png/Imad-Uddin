import React from 'react';
import { X } from 'lucide-react';
import { navItems, NavItemKey } from './Sidebar';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavItemKey;
  onTabChange: (tab: NavItemKey) => void;
  isPublicGuest?: boolean;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  isPublicGuest = false,
}) => {
  if (!isOpen) return null;

  const visibleItems = isPublicGuest
    ? navItems.filter((i) => i.key !== 'settings')
    : navItems;

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-4/5 max-w-xs bg-stone-900 text-stone-100 h-full p-4 flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div>
            <h2 className="font-bold text-white text-base">নেভিগেশন মেনু</h2>
            <p className="text-xs text-stone-400">আশেকানে গাউছিয়া</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onTabChange(item.key);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors text-left cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
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
      </div>
    </div>
  );
};
