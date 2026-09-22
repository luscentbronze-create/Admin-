import React from 'react';
import { Menu, Plus, Search, ShieldCheck, ExternalLink, LogOut } from 'lucide-react';
import { SwiftShipLogo } from './SwiftShipLogo';

interface NavbarProps {
  onOpenMobileMenu: () => void;
  onCreateShipment: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit?: () => void;
  onOpenCustomerTracking: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileMenu,
  onCreateShipment,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onOpenCustomerTracking,
  onLogout,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit();
    }
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-[#0F1115]/90 backdrop-blur-md border-b border-[#1F2937] px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Mobile brand & menu trigger */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          onClick={onOpenMobileMenu}
          id="mobile-menu-trigger"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#1F2937] focus:outline-none"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <SwiftShipLogo size="sm" showText={false} />
      </div>

      {/* Global quick search */}
      <div className="flex-1 max-w-xl hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            id="global-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by 11-character tracking code, sender, receiver, product..."
            className="w-full pl-10 pr-4 py-2 bg-[#15181E] border border-[#262B35] focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600] rounded-xl text-xs text-white placeholder-slate-500 transition-all outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Customer View Simulator Button */}
        <button
          onClick={onOpenCustomerTracking}
          id="test-customer-view-btn"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-[#15181E] hover:bg-[#1F2937] border border-[#262B35] transition-colors"
          title="Simulate customer tracking experience with real database queries"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#FFD600]" />
          <span className="hidden lg:inline">Customer Tracking</span>
          <span className="lg:hidden">Track</span>
        </button>

        {/* Create Shipment primary action */}
        <button
          onClick={onCreateShipment}
          id="navbar-create-shipment-btn"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFD600] hover:bg-[#E6C200] active:scale-[0.98] text-black text-xs font-bold shadow-md shadow-[#FFD600]/20 transition-all cursor-pointer select-none"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create Shipment</span>
        </button>

        {/* Logout Action */}
        {onLogout && (
          <button
            onClick={onLogout}
            id="navbar-logout-btn"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
            title="Log out of Admin Portal"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
