import React, { useState, useEffect } from 'react';
import {
  ShipmentRecord,
  ShipmentStatus,
  ActiveTab,
  AdminUser,
} from './types';
import { storageService } from './services/storage';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { CreateShipmentView } from './views/CreateShipmentView';
import { ShipmentsTableView } from './views/ShipmentsTableView';
import { ShipmentDetailsView } from './views/ShipmentDetailsView';
import { CustomerTrackingView } from './views/CustomerTrackingView';
import { SettingsView } from './views/SettingsView';
import { UpdateStatusModal } from './views/UpdateStatusModal';
import { EditShipmentModal } from './views/EditShipmentModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Auth State (Section 1: Secure authentication / session)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() =>
    storageService.getCurrentUser()
  );

  // Shipments State (Persistent DB)
  const [shipments, setShipments] = useState<ShipmentRecord[]>(() =>
    storageService.getShipments()
  );

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Active Shipment Details View (if not null, shows Details View)
  const [viewingShipmentId, setViewingShipmentId] = useState<string | null>(null);

  // Modals
  const [statusModalShipment, setStatusModalShipment] = useState<ShipmentRecord | null>(null);
  const [editModalShipment, setEditModalShipment] = useState<ShipmentRecord | null>(null);

  // Customer Tracking Simulator Code state
  const [customerTrackingTargetCode, setCustomerTrackingTargetCode] = useState<string>('');
  const [showPublicTrackingFromLogin, setShowPublicTrackingFromLogin] = useState(false);

  // Global Search state
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Subscribe to live database updates and sync with Supabase on mount
  useEffect(() => {
    const unsubscribe = storageService.subscribe((updatedShipments) => {
      setShipments(updatedShipments);
    });

    storageService.syncWithSupabase();

    return () => unsubscribe();
  }, []);

  // Reload shipments from storage
  const reloadShipments = () => {
    setShipments(storageService.getShipments());
    storageService.syncWithSupabase();
  };

  // Auth Handlers
  const handleLogin = (user: AdminUser) => {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name}!`);
  };

  const handleLogout = () => {
    storageService.logout();
    setCurrentUser(null);
    setViewingShipmentId(null);
    setActiveTab('dashboard');
    showToast('Logged out of Admin Portal');
  };

  // Creation Handler
  const handleShipmentCreated = (newShipment: ShipmentRecord) => {
    reloadShipments();
    showToast(`Shipment created with code ${newShipment.trackingCode}!`);
  };

  // Status Update Handler
  const handleSaveStatus = (newStatus: ShipmentStatus, note?: string, location?: string) => {
    if (!statusModalShipment) return;
    const updated = storageService.updateShipmentStatus(
      statusModalShipment.id,
      newStatus,
      note,
      location
    );
    if (updated) {
      reloadShipments();
      showToast(`Status updated to ${newStatus}!`);
    }
  };

  // Edit Shipment Handler
  const handleSaveEdit = (updatedData: Partial<ShipmentRecord>) => {
    if (!editModalShipment) return;
    const updated = storageService.updateShipment(editModalShipment.id, updatedData);
    if (updated) {
      reloadShipments();
      showToast('Shipment updated successfully!');
    }
  };

  // Delete Handler
  const handleDeleteShipment = (id: string) => {
    const success = storageService.deleteShipment(id);
    if (success) {
      reloadShipments();
      if (viewingShipmentId === id) {
        setViewingShipmentId(null);
      }
      showToast('Shipment record deleted.');
    }
  };

  // Navigation Helpers
  const handleNavigateToShipment = (id: string) => {
    setViewingShipmentId(id);
  };

  const handleOpenCustomerTracking = (code?: string) => {
    setCustomerTrackingTargetCode(code || '');
    setActiveTab('tracking');
    setViewingShipmentId(null);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Tracking code ${code} copied to clipboard!`);
  };

  // Global search submission
  const handleGlobalSearchSubmit = () => {
    if (!globalSearchQuery.trim()) return;
    setViewingShipmentId(null);
    setActiveTab('shipments');
  };

  // Reset database to defaults
  const handleResetDatabase = () => {
    storageService.resetToDefaults();
    reloadShipments();
    setViewingShipmentId(null);
    showToast('Database reset to default demo shipments');
  };

  // Unauthenticated Guard (Section 1 & 16: Customers must not access Admin Portal)
  if (!currentUser) {
    if (showPublicTrackingFromLogin) {
      return (
        <CustomerTrackingView
          initialTrackingCode={customerTrackingTargetCode}
          onBackToAdmin={() => setShowPublicTrackingFromLogin(false)}
        />
      );
    }
    return (
      <LoginView
        onLoginSuccess={handleLogin}
        onTrackShipment={() => setShowPublicTrackingFromLogin(true)}
      />
    );
  }

  // Find currently viewing shipment record
  const currentViewingShipment = viewingShipmentId
    ? shipments.find((s) => s.id === viewingShipmentId)
    : null;

  return (
    <div className="min-h-screen bg-[#0B0D11] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-[#FFD600] selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-[#171B22] border border-[#FFD600]/40 text-white rounded-xl shadow-2xl shadow-black/80 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#FFD600]" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Persistent Sidebar (Section 17 & 18) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setViewingShipmentId(null);
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        onQuickTrack={() => handleOpenCustomerTracking()}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          activeTab === 'dashboard' && !currentViewingShipment
            ? 'bg-[#F4F6FA] text-slate-900'
            : 'bg-[#0B0D11] text-slate-100'
        }`}
      >
        {/* Top Navbar (displayed on other views or shipment details) */}
        {(activeTab !== 'dashboard' || currentViewingShipment) && (
          <Navbar
            onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
            onCreateShipment={() => {
              setActiveTab('create');
              setViewingShipmentId(null);
            }}
            searchQuery={globalSearchQuery}
            setSearchQuery={setGlobalSearchQuery}
            onSearchSubmit={handleGlobalSearchSubmit}
            onOpenCustomerTracking={() => handleOpenCustomerTracking()}
            onLogout={handleLogout}
          />
        )}

        {/* Page Container */}
        <main
          className={`flex-1 w-full mx-auto ${
            activeTab === 'dashboard' && !currentViewingShipment
              ? 'px-4 sm:px-8 py-6 max-w-7xl'
              : 'px-4 sm:px-8 py-6 max-w-7xl'
          }`}
        >
          {/* If viewing a single shipment details */}
          {currentViewingShipment ? (
            <ShipmentDetailsView
              shipment={currentViewingShipment}
              onBack={() => setViewingShipmentId(null)}
              onEdit={() => setEditModalShipment(currentViewingShipment)}
              onUpdateStatus={() => setStatusModalShipment(currentViewingShipment)}
              onOpenCustomerTracking={handleOpenCustomerTracking}
            />
          ) : (
            <>
              {/* Tab: Dashboard (Matches reference image) */}
              {activeTab === 'dashboard' && (
                <DashboardView
                  shipments={shipments}
                  onCreateShipment={() => setActiveTab('create')}
                  onViewShipment={handleNavigateToShipment}
                  onSearch={(q) => {
                    setGlobalSearchQuery(q);
                    setActiveTab('shipments');
                  }}
                  onNavigateToShipments={() => setActiveTab('shipments')}
                  onCopyTrackingCode={handleCopyCode}
                  onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
                />
              )}

              {/* Tab: Create Shipment (Section 3, 4, 5, 7) */}
              {activeTab === 'create' && (
                <CreateShipmentView
                  onShipmentCreated={handleShipmentCreated}
                  onViewShipment={handleNavigateToShipment}
                  onCancel={() => setActiveTab('dashboard')}
                />
              )}

              {/* Tab: All Shipments Table (Section 10, 11) */}
              {activeTab === 'shipments' && (
                <ShipmentsTableView
                  shipments={shipments}
                  onCreateShipment={() => setActiveTab('create')}
                  onViewShipment={handleNavigateToShipment}
                  onEditShipment={(s) => setEditModalShipment(s)}
                  onUpdateStatus={(s) => setStatusModalShipment(s)}
                  onDeleteShipment={handleDeleteShipment}
                  onOpenCustomerTracking={handleOpenCustomerTracking}
                  initialSearchQuery={globalSearchQuery}
                />
              )}

              {/* Tab: Customer Tracking Page Simulator (Section 6, 15, 16, 19) */}
              {activeTab === 'tracking' && (
                <CustomerTrackingView
                  initialTrackingCode={customerTrackingTargetCode}
                  onBackToAdmin={() => setActiveTab('dashboard')}
                />
              )}

              {/* Tab: Settings */}
              {activeTab === 'settings' && (
                <SettingsView
                  currentUser={currentUser}
                  onResetDatabase={handleResetDatabase}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* MODAL: Update Status (Section 8, 9) */}
      {statusModalShipment && (
        <UpdateStatusModal
          shipment={statusModalShipment}
          onClose={() => setStatusModalShipment(null)}
          onSave={handleSaveStatus}
        />
      )}

      {/* MODAL: Edit Shipment (Section 13) */}
      {editModalShipment && (
        <EditShipmentModal
          shipment={editModalShipment}
          onClose={() => setEditModalShipment(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
