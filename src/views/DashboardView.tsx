import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Search,
  Minus,
  Copy,
  Check,
  Menu,
} from 'lucide-react';
import { ShipmentRecord } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface DashboardViewProps {
  shipments: ShipmentRecord[];
  onCreateShipment: () => void;
  onViewShipment: (id: string) => void;
  onSearch: (term: string) => void;
  onNavigateToShipments: () => void;
  onCopyTrackingCode: (code: string) => void;
  onOpenMobileMenu?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  shipments,
  onCreateShipment,
  onViewShipment,
  onSearch,
  onCopyTrackingCode,
  onOpenMobileMenu,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Compute live counts from shipments
  const counts = useMemo(() => {
    const total = shipments.length;
    const created = shipments.filter((s) => s.status === 'Shipment Created').length;
    const processing = shipments.filter((s) => s.status === 'Processing').length;
    const inTransit = shipments.filter((s) => s.status === 'In Transit').length;
    const outForDelivery = shipments.filter((s) => s.status === 'Out for Delivery').length;
    const delivered = shipments.filter((s) => s.status === 'Delivered').length;

    return { total, created, processing, inTransit, outForDelivery, delivered };
  }, [shipments]);

  // Purely live database-driven counts and metrics
  const metricValues = useMemo(() => {
    return {
      total: counts.total,
      created: counts.created,
      inTransit: counts.inTransit,
      delivered: counts.delivered,
    };
  }, [counts]);

  // Donut chart status breakdown directly reflecting database records
  const donutData = useMemo(() => {
    return {
      created: counts.created,
      processing: counts.processing,
      inTransit: counts.inTransit,
      outForDelivery: counts.outForDelivery,
      delivered: counts.delivered,
      total: counts.total,
      totalSum: counts.total,
    };
  }, [counts]);

  // Recent shipments sorted by creation date
  const recentShipments = useMemo(() => {
    return [...shipments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [shipments]);

  // Recently updated shipments sorted by updatedAt
  const recentlyUpdated = useMemo(() => {
    return [...shipments]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4);
  }, [shipments]);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const dateStr = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timeStr = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return `${dateStr} ${timeStr}`;
    } catch {
      return isoString;
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  const handleCopy = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    onCopyTrackingCode(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Donut SVG circumference calculation
  const circumference = 251.327; // 2 * Math.PI * 40
  const hasRecords = donutData.totalSum > 0;
  const cCreated = hasRecords ? (donutData.created / donutData.totalSum) * circumference : 0;
  const cProcessing = hasRecords ? (donutData.processing / donutData.totalSum) * circumference : 0;
  const cInTransit = hasRecords ? (donutData.inTransit / donutData.totalSum) * circumference : 0;
  const cOutForDelivery = hasRecords ? (donutData.outForDelivery / donutData.totalSum) * circumference : 0;
  const cDelivered = hasRecords ? (donutData.delivered / donutData.totalSum) * circumference : 0;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-200/80 transition-colors"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Overview of your shipments and activity.
            </p>
          </div>
        </div>

        {/* Right Search Input and Create Button */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-80 md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="dashboard-search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by tracking code, sender, receiver, product..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 shadow-2xs transition-all"
            />
          </form>

          <button
            onClick={onCreateShipment}
            id="dashboard-header-create-btn"
            className="px-5 py-2.5 rounded-xl bg-[#FFD600] hover:bg-[#F2CA00] active:scale-[0.98] text-slate-900 font-bold text-xs sm:text-sm whitespace-nowrap shadow-xs transition-all cursor-pointer select-none"
          >
            Create Shipment
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Shipments */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Total Shipments</div>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight my-2">
            {metricValues.total}
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 text-xs font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
            <span>Database Records</span>
          </div>
        </div>

        {/* Shipment Created */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Shipment Created</div>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight my-2">
            {metricValues.created}
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/80 text-xs font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Registered</span>
          </div>
        </div>

        {/* In Transit */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">In Transit</div>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight my-2">
            {metricValues.inTransit}
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100/80 text-xs font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
            <span>En Route</span>
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Delivered</div>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight my-2">
            {metricValues.delivered}
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100/80 text-xs font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            <span>Completed</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Row: Shipment Status & Recent Shipments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left: Shipment Status Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Shipment Status</h2>
            <button
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              aria-label="Minimize or toggle section"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
            {/* Donut Gauge Chart */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#F1F5F9"
                  strokeWidth="15"
                  fill="transparent"
                />

                {/* Segment 1: Green (Shipment Created) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#10B981"
                  strokeWidth="15"
                  strokeDasharray={`${cCreated} ${circumference}`}
                  strokeDashoffset="0"
                  fill="transparent"
                  className="transition-all duration-500"
                />

                {/* Segment 2: Blue (Processing) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#3B82F6"
                  strokeWidth="15"
                  strokeDasharray={`${cProcessing} ${circumference}`}
                  strokeDashoffset={`-${cCreated}`}
                  fill="transparent"
                  className="transition-all duration-500"
                />

                {/* Segment 3: Yellow/Amber (In Transit) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#EAB308"
                  strokeWidth="15"
                  strokeDasharray={`${cInTransit} ${circumference}`}
                  strokeDashoffset={`-${cCreated + cProcessing}`}
                  fill="transparent"
                  className="transition-all duration-500"
                />

                {/* Segment 4: Orange (Out for Delivery) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#F97316"
                  strokeWidth="15"
                  strokeDasharray={`${cOutForDelivery} ${circumference}`}
                  strokeDashoffset={`-${cCreated + cProcessing + cInTransit}`}
                  fill="transparent"
                  className="transition-all duration-500"
                />

                {/* Segment 5: Dark Red-Orange (Delivered) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#EA580C"
                  strokeWidth="15"
                  strokeDasharray={`${cDelivered} ${circumference}`}
                  strokeDashoffset={`-${cCreated + cProcessing + cInTransit + cOutForDelivery}`}
                  fill="transparent"
                  className="transition-all duration-500"
                />
              </svg>

              {/* Center Total Count */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">
                  {donutData.total}
                </span>
                <span className="text-xs text-slate-400 font-medium mt-1">Total</span>
              </div>
            </div>

            {/* Status Legend List */}
            <div className="w-full sm:flex-1 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
                  <span className="text-slate-600 font-medium">Shipment Created</span>
                </div>
                <span className="font-semibold text-slate-900">{donutData.created}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shrink-0" />
                  <span className="text-slate-600 font-medium">Processing</span>
                </div>
                <span className="font-semibold text-slate-900">{donutData.processing}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308] shrink-0" />
                  <span className="text-slate-600 font-medium">In Transit</span>
                </div>
                <span className="font-semibold text-slate-900">{donutData.inTransit}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] shrink-0" />
                  <span className="text-slate-600 font-medium">Out for Delivery</span>
                </div>
                <span className="font-semibold text-slate-900">{donutData.outForDelivery}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] shrink-0" />
                  <span className="text-slate-600 font-medium">Delivered</span>
                </div>
                <span className="font-semibold text-slate-900">{donutData.delivered}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Recent Shipments Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Shipments</h2>
            <button
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              aria-label="Minimize or toggle section"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-normal">
                  <th className="pb-3 font-normal">Tracking Code</th>
                  <th className="pb-3 font-normal">Product</th>
                  <th className="pb-3 font-normal">Status</th>
                  <th className="pb-3 font-normal text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentShipments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs sm:text-sm">
                      No shipments found in database.
                    </td>
                  </tr>
                ) : (
                  recentShipments.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => onViewShipment(s.id)}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    >
                      <td className="py-3 font-mono font-medium text-slate-900 group-hover:text-amber-600 transition-colors">
                        <div className="flex items-center gap-1.5">
                          <span>{s.trackingCode}</span>
                          <button
                            onClick={(e) => handleCopy(e, s.trackingCode)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-700 transition-opacity"
                            title="Copy tracking code"
                          >
                            {copiedCode === s.trackingCode ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 text-slate-700 font-normal">{s.product.name}</td>
                      <td className="py-3">
                        <StatusBadge status={s.status} size="sm" variant="light" />
                      </td>
                      <td className="py-3 text-right text-slate-400 text-xs font-normal whitespace-nowrap">
                        {formatDate(s.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Recently Updated Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Recently Updated</h2>
          <button
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
            aria-label="Minimize or toggle section"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-normal">
                <th className="pb-3 font-normal">Tracking Code</th>
                <th className="pb-3 font-normal">Product</th>
                <th className="pb-3 font-normal">Status</th>
                <th className="pb-3 font-normal text-right">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentlyUpdated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-xs sm:text-sm">
                    No shipments found in database.
                  </td>
                </tr>
              ) : (
                recentlyUpdated.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => onViewShipment(s.id)}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  >
                    <td className="py-3 font-mono font-medium text-slate-900 group-hover:text-amber-600 transition-colors">
                      <div className="flex items-center gap-1.5">
                        <span>{s.trackingCode}</span>
                        <button
                          onClick={(e) => handleCopy(e, s.trackingCode)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-700 transition-opacity"
                          title="Copy tracking code"
                        >
                          {copiedCode === s.trackingCode ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 text-slate-700 font-normal">{s.product.name}</td>
                    <td className="py-3">
                      <StatusBadge status={s.status} size="sm" variant="light" />
                    </td>
                    <td className="py-3 text-right text-slate-400 text-xs font-normal whitespace-nowrap">
                      {formatDateTime(s.updatedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
