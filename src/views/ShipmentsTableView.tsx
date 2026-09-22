import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Copy,
  Check,
  MoreVertical,
  Eye,
  Edit2,
  RefreshCw,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Plane,
  Truck,
  Ship,
  Boxes,
} from 'lucide-react';
import { ShipmentRecord, ShipmentStatus, TransportationMethod } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface ShipmentsTableViewProps {
  shipments: ShipmentRecord[];
  onCreateShipment: () => void;
  onViewShipment: (id: string) => void;
  onEditShipment: (shipment: ShipmentRecord) => void;
  onUpdateStatus: (shipment: ShipmentRecord) => void;
  onDeleteShipment: (id: string) => void;
  onOpenCustomerTracking: (code?: string) => void;
  initialSearchQuery?: string;
}

export const ShipmentsTableView: React.FC<ShipmentsTableViewProps> = ({
  shipments,
  onCreateShipment,
  onViewShipment,
  onEditShipment,
  onUpdateStatus,
  onDeleteShipment,
  onOpenCustomerTracking,
  initialSearchQuery = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [transportFilter, setTransportFilter] = useState<string>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filtered shipments
  const filteredShipments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return shipments.filter((s) => {
      // Search matching: exact or partial 11-char tracking code, sender, receiver, product
      const matchesSearch =
        !query ||
        s.trackingCode.toLowerCase().includes(query) ||
        s.sender.name.toLowerCase().includes(query) ||
        s.receiver.name.toLowerCase().includes(query) ||
        s.product.name.toLowerCase().includes(query) ||
        (s.product.description && s.product.description.toLowerCase().includes(query));

      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      const matchesTransport = transportFilter === 'ALL' || s.transportation === transportFilter;

      return matchesSearch && matchesStatus && matchesTransport;
    });
  }, [shipments, searchQuery, statusFilter, transportFilter]);

  // Paginated items
  const paginatedShipments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredShipments.slice(start, start + pageSize);
  }, [filteredShipments, currentPage]);

  const totalPages = Math.ceil(filteredShipments.length / pageSize) || 1;

  const handleCopy = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getTransportIcon = (method: TransportationMethod) => {
    switch (method) {
      case 'Air':
        return <Plane className="w-3.5 h-3.5 text-sky-400" />;
      case 'Sea':
        return <Ship className="w-3.5 h-3.5 text-blue-400" />;
      case 'Road':
        return <Truck className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Boxes className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header section matching image */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">All Shipments</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage, update, and inspect all {shipments.length} shipment records in the database
          </p>
        </div>

        <button
          onClick={onCreateShipment}
          id="shipments-create-btn"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFD600] hover:bg-[#E6C200] active:scale-[0.98] text-black text-xs font-bold shadow-md shadow-[#FFD600]/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create Shipment</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input with 11-char tracking code support */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            id="shipments-search-input"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search tracking code (e.g. 3B8R55K2W9T), sender, receiver, product..."
            className="w-full pl-10 pr-4 py-2 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600] rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#FFD600]" />
            <span className="hidden sm:inline">Status:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] rounded-xl text-xs text-white outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Shipment Created">Shipment Created</option>
            <option value="Processing">Processing</option>
            <option value="In Transit">In Transit</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
          </select>

          <select
            value={transportFilter}
            onChange={(e) => {
              setTransportFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] rounded-xl text-xs text-white outline-none"
          >
            <option value="ALL">All Transport</option>
            <option value="Air">Air Freight</option>
            <option value="Road">Road</option>
            <option value="Sea">Sea</option>
            <option value="Other">Other</option>
          </select>

          {(searchQuery || statusFilter !== 'ALL' || transportFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setTransportFilter('ALL');
                setCurrentPage(1);
              }}
              className="text-xs text-[#FFD600] hover:underline px-2 shrink-0"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Shipments Management Table (Section 10) */}
      <div className="bg-[#12151B] border border-[#23272F] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#171B22] border-b border-[#23272F] text-slate-400 font-semibold select-none">
                <th className="py-3.5 px-4 font-bold text-slate-300">Tracking Code</th>
                <th className="py-3.5 px-3">Sender</th>
                <th className="py-3.5 px-3">Receiver</th>
                <th className="py-3.5 px-3">Product</th>
                <th className="py-3.5 px-2 text-center">Qty</th>
                <th className="py-3.5 px-3">Mode</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Departure</th>
                <th className="py-3.5 px-3">Est. Delivery</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]/50">
              {paginatedShipments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-medium">No matching shipments found</p>
                    <p className="text-xs mt-1">Try adjusting your search terms or filters</p>
                  </td>
                </tr>
              ) : (
                paginatedShipments.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-[#181C24] transition-colors group cursor-pointer"
                    onClick={() => onViewShipment(s.id)}
                  >
                    {/* Full 11-character alphanumeric tracking code */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-code font-bold text-white text-xs group-hover:text-[#FFD600] transition-colors">
                          {s.trackingCode}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(s.trackingCode, e)}
                          className="p-1 text-slate-500 hover:text-white hover:bg-[#232834] rounded transition-colors"
                          title="Copy 11-character tracking code"
                        >
                          {copiedCode === s.trackingCode ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Sender */}
                    <td className="py-3.5 px-3 text-slate-300">
                      <span className="font-medium text-white block">{s.sender.name}</span>
                      <span className="text-[11px] text-slate-500 block truncate max-w-[130px]">
                        {s.sender.address}
                      </span>
                    </td>

                    {/* Receiver */}
                    <td className="py-3.5 px-3 text-slate-300">
                      <span className="font-medium text-white block">{s.receiver.name}</span>
                      <span className="text-[11px] text-slate-500 block truncate max-w-[130px]">
                        {s.receiver.address}
                      </span>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-3 text-slate-200">
                      <span className="font-medium block">{s.product.name}</span>
                      {s.product.description && (
                        <span className="text-[11px] text-slate-500 block truncate max-w-[120px]">
                          {s.product.description}
                        </span>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-2 text-center text-slate-300 font-mono-code font-medium">
                      {s.product.quantity}
                    </td>

                    {/* Transportation mode */}
                    <td className="py-3.5 px-3">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#181C24] border border-[#262C38] text-[11px] text-slate-300 font-medium">
                        {getTransportIcon(s.transportation)}
                        <span>{s.transportation}</span>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="py-3.5 px-3">
                      <StatusBadge status={s.status} size="sm" />
                    </td>

                    {/* Departure Date */}
                    <td className="py-3.5 px-3 text-slate-400 font-mono-code text-[11px]">
                      {formatDate(s.departureDate)}
                    </td>

                    {/* Estimated Delivery */}
                    <td className="py-3.5 px-3 text-slate-400 font-mono-code text-[11px]">
                      {formatDate(s.estimatedDelivery)}
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3.5 px-4 text-right relative">
                      <div className="flex items-center justify-end gap-1">
                        {/* Quick View Details Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewShipment(s.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#232834]"
                          title="View shipment details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Quick Status Update */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(s);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#FFD600] hover:bg-[#232834]"
                          title="Update tracking status"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Dropdown Toggle */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveActionMenuId(
                                activeActionMenuId === s.id ? null : s.id
                              );
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#232834]"
                            aria-label="More actions"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {/* Dropdown Popover */}
                          {activeActionMenuId === s.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1 w-48 bg-[#171B22] border border-[#2B313D] rounded-xl shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 text-left"
                            >
                              <button
                                onClick={() => {
                                  setActiveActionMenuId(null);
                                  onViewShipment(s.id);
                                }}
                                className="w-full px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-[#202530] flex items-center gap-2.5"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                <span>View Details</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveActionMenuId(null);
                                  onEditShipment(s);
                                }}
                                className="w-full px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-[#202530] flex items-center gap-2.5"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>Edit Shipment</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveActionMenuId(null);
                                  onUpdateStatus(s);
                                }}
                                className="w-full px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-[#202530] flex items-center gap-2.5"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-[#FFD600]" />
                                <span>Update Status</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveActionMenuId(null);
                                  onOpenCustomerTracking(s.trackingCode);
                                }}
                                className="w-full px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-[#202530] flex items-center gap-2.5"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                                <span>Test Customer Tracking</span>
                              </button>

                              <div className="my-1 border-t border-[#262C38]" />

                              <button
                                onClick={() => {
                                  setActiveActionMenuId(null);
                                  setConfirmDeleteId(s.id);
                                }}
                                className="w-full px-3.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Record</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination matching image */}
        <div className="bg-[#15181E] border-t border-[#23272F] px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing{' '}
            <span className="font-semibold text-white">
              {filteredShipments.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-white">
              {Math.min(currentPage * pageSize, filteredShipments.length)}
            </span>{' '}
            of <span className="font-semibold text-white">{filteredShipments.length}</span> shipments
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#2B313D] text-slate-400 hover:text-white hover:bg-[#1F2530] disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                  currentPage === pageNum
                    ? 'bg-[#FFD600] text-black font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-[#1F2530]'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#2B313D] text-slate-400 hover:text-white hover:bg-[#1F2530] disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#15181E] border border-rose-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Delete Shipment Record?</h3>
              <p className="text-xs text-slate-400 mt-1">
                This will permanently delete this shipment from the database. The tracking code will be deactivated.
              </p>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#202530] border border-[#2B313D]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteShipment(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
