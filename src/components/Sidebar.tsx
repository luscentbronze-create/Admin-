import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  Search,
  Settings,
  LogOut,
  X,
  ExternalLink,
} from 'lucide-react';
import { ActiveTab, AdminUser } from '../types';
import { SwiftShipLogo } from './SwiftShipLogo';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: AdminUser | null;
  onLogout: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onQuickTrack?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'create' as ActiveTab,
      label: 'Create Shipment',
      icon: PlusCircle,
    },
    {
      id: 'shipments' as ActiveTab,
      label: 'Shipments',
      icon: Package,
    },
    {
      id: 'tracking' as ActiveTab,
      label: 'Tracking',
      icon: Search,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleNavClick = (id: ActiveTab) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  const content = (
    <div className="flex flex-col h-full bg-[#0C1017] border-r border-[#1C2330] text-slate-300 select-none">
      {/* Brand Header */}
      <div className="h-20 px-6 flex items-center justify-between border-b border-[#1C2330]/80">
        <SwiftShipLogo />
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1A212D]"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation items */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#FFD600]/15 text-[#FFD600] font-semibold border border-[#FFD600]/25 shadow-sm shadow-[#FFD600]/5'
                  : 'text-slate-400 hover:text-white hover:bg-[#161C26]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#FFD600] stroke-[2.5]' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer / User info */}
      <div className="p-4 border-t border-[#1C2330]/80 bg-[#0A0D14]">
        <button
          onClick={onLogout}
          id="logout-btn"
          className="w-full mb-3 flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>

        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-[#121722] border border-[#1E2636]">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
              alt={currentUser?.name || 'John Admin'}
              className="w-9 h-9 rounded-full object-cover border border-[#2B3547]"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0A0D14]" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {currentUser?.name || 'John Admin'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              Administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden md:block w-64 h-screen sticky top-0 flex-shrink-0 z-30">
        {content}
      </aside>

      {/* Mobile slide-over drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-full shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
