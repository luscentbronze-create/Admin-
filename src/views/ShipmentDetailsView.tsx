import React, { useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  Edit,
  RefreshCw,
  ExternalLink,
  Package,
  User,
  MapPin,
  Truck,
  Calendar,
  Eye,
  Clock,
  ShieldCheck,
  History,
  Plane,
  Ship,
  Boxes,
} from 'lucide-react';
import { ShipmentRecord } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface ShipmentDetailsViewProps {
  shipment: ShipmentRecord;
  onBack: () => void;
  onEdit: () => void;
  onUpdateStatus: () => void;
  onOpenCustomerTracking: (code: string) => void;
}

export const ShipmentDetailsView: React.FC<ShipmentDetailsViewProps> = ({
  shipment,
  onBack,
  onEdit,
  onUpdateStatus,
  onOpenCustomerTracking,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'visibility'>('overview');

  const handleCopy = () => {
    navigator.clipboard.writeText(shipment.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getTransportIcon = () => {
    switch (shipment.transportation) {
      case 'Air':
        return <Plane className="w-4 h-4 text-sky-400" />;
      case 'Sea':
        return <Ship className="w-4 h-4 text-blue-400" />;
      case 'Road':
        return <Truck className="w-4 h-4 text-amber-400" />;
      default:
        return <Boxes className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top navigation & action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          id="back-to-shipments-btn"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shipments</span>
        </button>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onOpenCustomerTracking(shipment.trackingCode)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#171B22] hover:bg-[#202632] border border-[#2B313D] text-xs font-semibold text-slate-200 transition-colors"
            title="Preview this exact record in the customer tracking page"
          >
            <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
            <span>Customer View</span>
          </button>

          <button
            onClick={onUpdateStatus}
            id="details-update-status-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFD600] hover:bg-[#E6C200] active:scale-95 text-black text-xs font-bold shadow-md shadow-[#FFD600]/15 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Update Status</span>
          </button>

          <button
            onClick={onEdit}
            id="details-edit-shipment-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E2430] hover:bg-[#272F3E] border border-[#2B3444] text-xs font-semibold text-white transition-colors"
          >
            <Edit className="w-3.5 h-3.5 text-slate-300" />
            <span>Edit</span>
          </button>
        </div>
      </div>

      {/* Hero tracking banner */}
      <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                Tracking Code
              </span>
              <StatusBadge status={shipment.status} size="sm" />
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-black font-mono-code text-[#FFD600] tracking-wide">
                {shipment.trackingCode}
              </h1>
              <button
                onClick={handleCopy}
                className="p-2 rounded-xl bg-[#1A1E26] hover:bg-[#252B36] border border-[#2B313D] text-slate-400 hover:text-white transition-colors"
                title="Copy tracking code"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-1.5 font-mono-code text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Created: {formatDateTime(shipment.createdAt)}</span>
              </div>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5 font-mono-code text-[11px]">
                <span>Last Updated: {formatDateTime(shipment.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Quick Route Card */}
          <div className="bg-[#171B22] border border-[#23272F] rounded-xl p-4 min-w-[260px] text-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
              Logistics Route
            </span>
            <div className="flex items-start gap-2.5">
              <div className="flex flex-col items-center gap-1 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="w-0.5 h-6 bg-slate-700" />
                <span className="w-2 h-2 rounded-full bg-[#FFD600]" />
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="font-semibold text-white">{shipment.sender.name}</p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                    {shipment.sender.address}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-white">{shipment.receiver.name}</p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                    {shipment.receiver.address}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center gap-2 border-t border-[#1F2937] mt-6 pt-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'bg-[#FFD600] text-black font-bold'
                : 'text-slate-400 hover:text-white hover:bg-[#1A1E26]'
            }`}
          >
            Shipment Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-[#FFD600] text-black font-bold'
                : 'text-slate-400 hover:text-white hover:bg-[#1A1E26]'
            }`}
          >
            <span>Tracking History</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
              {shipment.history.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('visibility')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'visibility'
                ? 'bg-[#FFD600] text-black font-bold'
                : 'text-slate-400 hover:text-white hover:bg-[#1A1E26]'
            }`}
          >
            <span>Customer Visibility</span>
            <ShieldCheck className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product & Transportation */}
          <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Package className="w-4 h-4 text-[#FFD600]" />
                <h3>Product Details</h3>
              </div>
              <span className="text-xs font-mono-code font-bold text-[#FFD600]">
                Qty: {shipment.product.quantity}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Product Name</span>
                <span className="font-semibold text-white text-sm">{shipment.product.name}</span>
              </div>

              {shipment.product.description && (
                <div>
                  <span className="text-slate-500 block text-[11px]">Description</span>
                  <p className="text-slate-300 leading-relaxed bg-[#171B22] p-3 rounded-xl border border-[#23272F]">
                    {shipment.product.description}
                  </p>
                </div>
              )}

              {/* Package Specifications: Weight, Length, Width */}
              {(shipment.product.weight || shipment.weight || shipment.product.length || shipment.length || shipment.product.width || shipment.width) && (
                <div className="bg-[#171B22] p-3.5 rounded-xl border border-[#23272F] space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Package Dimensions & Weight
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(shipment.product.weight || shipment.weight) && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">Weight</span>
                        <span className="font-semibold text-emerald-400">{shipment.product.weight || shipment.weight}</span>
                      </div>
                    )}
                    {(shipment.product.length || shipment.length) && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">Length</span>
                        <span className="font-semibold text-white">{shipment.product.length || shipment.length}</span>
                      </div>
                    )}
                    {(shipment.product.width || shipment.width) && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">Width</span>
                        <span className="font-semibold text-white">{shipment.product.width || shipment.width}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-[#171B22] p-3 rounded-xl border border-[#23272F]">
                  <span className="text-slate-500 block text-[11px] mb-1">Transport Mode</span>
                  <div className="flex items-center gap-2 font-semibold text-white">
                    {getTransportIcon()}
                    <span>{shipment.transportation} Freight</span>
                  </div>
                </div>

                <div className="bg-[#171B22] p-3 rounded-xl border border-[#23272F]">
                  <span className="text-slate-500 block text-[11px] mb-1">Departure Date</span>
                  <span className="font-mono-code font-semibold text-white">
                    {formatDate(shipment.departureDate)}
                  </span>
                </div>
              </div>

              <div className="bg-[#171B22] p-3 rounded-xl border border-[#23272F]">
                <span className="text-slate-500 block text-[11px] mb-1">Estimated Delivery</span>
                <span className="font-mono-code font-semibold text-[#FFD600] text-sm">
                  {formatDate(shipment.estimatedDelivery)}
                </span>
              </div>
            </div>
          </div>

          {/* Parties: Sender & Receiver */}
          <div className="space-y-6">
            {/* Sender */}
            <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <User className="w-4 h-4 text-[#FFD600]" />
                  <h3>Sender (Origin)</h3>
                </div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">Shipper</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Name</span>
                <span className="font-semibold text-white">{shipment.sender.name}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Address</span>
                <span className="text-slate-300">{shipment.sender.address}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-500 block text-[11px]">Email</span>
                  <span className="text-slate-300">{shipment.sender.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Phone</span>
                  <span className="text-slate-300">{shipment.sender.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Receiver */}
            <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <MapPin className="w-4 h-4 text-[#FFD600]" />
                  <h3>Receiver (Destination)</h3>
                </div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">Consignee</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Name</span>
                <span className="font-semibold text-white">{shipment.receiver.name}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Address</span>
                <span className="text-slate-300">{shipment.receiver.address}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-500 block text-[11px]">Email</span>
                  <span className="text-slate-300">{shipment.receiver.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Phone</span>
                  <span className="text-slate-300">{shipment.receiver.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: CHRONOLOGICAL TRACKING HISTORY (Section 9) */}
      {activeTab === 'history' && (
        <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-6">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Tracking Events Timeline</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Full chronological ledger of status updates and custody transfers
              </p>
            </div>

            <button
              onClick={onUpdateStatus}
              className="px-3.5 py-1.5 rounded-xl bg-[#FFD600] text-black font-bold text-xs hover:bg-[#E6C200] flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Record New Event</span>
            </button>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#23272F]">
            {shipment.history.map((event, idx) => (
              <div key={event.id} className="relative group">
                {/* Dot */}
                <div
                  className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-[#12151B] ${
                    idx === 0 ? 'bg-[#FFD600] ring-4 ring-[#FFD600]/20' : 'bg-slate-600'
                  }`}
                />

                <div className="bg-[#171B22] border border-[#23272F] rounded-xl p-4 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={event.status} size="sm" />
                      {idx === 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFD600] bg-[#FFD600]/10 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono-code text-slate-400">
                      {formatDateTime(event.timestamp)}
                    </span>
                  </div>

                  {event.note && (
                    <p className="text-xs text-slate-200 font-medium pt-1">{event.note}</p>
                  )}

                  {event.location && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: CUSTOMER VISIBILITY AUDIT (Section 4 & 12) */}
      {activeTab === 'visibility' && (
        <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Active Visibility Gate Controls</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit which specific data fields will be rendered to public customers looking up code {shipment.trackingCode}
              </p>
            </div>
            <button
              onClick={onEdit}
              className="px-3 py-1.5 rounded-xl bg-[#1E2430] hover:bg-[#28303E] text-slate-200 text-xs font-semibold border border-[#2B3444]"
            >
              Modify Controls
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Sender audit */}
            <div className="bg-[#171B22] border border-[#23272F] rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Sender Fields
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Sender Name</span>
                  <span
                    className={`font-semibold ${
                      shipment.visibility.showSenderName ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  >
                    {shipment.visibility.showSenderName ? 'Visible' : 'Hidden'}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Sender Address</span>
                  <span
                    className={`font-semibold ${
                      shipment.visibility.showSenderAddress ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  >
                    {shipment.visibility.showSenderAddress ? 'Visible' : 'Hidden'}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Sender Email</span>
                  <span
                    className={`font-semibold ${
                      shipment.visibility.showSenderEmail ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  >
                    {shipment.visibility.showSenderEmail ? 'Visible' : 'Hidden'}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Sender Phone</span>
                  <span
                    className={`font-semibold ${
                      shipment.visibility.showSenderPhone ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  >
                    {shipment.visibility.showSenderPhone ? 'Visible' : 'Hidden'}
                  </span>
                </li>
              </ul>
            </div>

            {/* Receiver audit */}
            <div className="bg-[#171B22] border border-[#23272F] rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Receiver Fields
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Receiver Name</span>
                  <span
                    className={`font-semibold ${
                      shipment.visibility.showReceiverName ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  >
                    {shipment.visibility.showReceiverName ? 'Visible' : 'Hidden'}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Receiver Address</span>
                  <span
                    className={`font-semibold ${
                      shipment.visibility.showReceiverAddress ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  >
                    {shipment.visibility.showReceiverAddress ? 'Visible' : 'Hidden'}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Receiver Email</span>
                  <span
                    className={`font-semibold ${
                      shipment.visibility.showReceiverEmail ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  >
                    {shipment.visibility.showReceiverEmail ? 'Visible' : 'Hidden'}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Receiver Phone</span>
                  <span
                    className={`font-semibold ${
                      shipment.visibility.showReceiverPhone ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  >
                    {shipment.visibility.showReceiverPhone ? 'Visible' : 'Hidden'}
                  </span>
                </li>
              </ul>
            </div>

            {/* Shipment audit */}
            <div className="bg-[#171B22] border border-[#23272F] rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Shipment Info Fields
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Product Name</span>
                  <span
                    className={`font-semibold ${
                      shipment.visibility.showProduct ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  >
                    {shipment.visibility.showProduct ? 'Visible' : 'Hidden'}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Quantity</span>
                  <span
                    className={`font-semibold ${
                      shipment.visibility.showQuantity ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  >
                    {shipment.visibility.showQuantity ? 'Visible' : 'Hidden'}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Transportation Mode</span>
                  <span
                    className={`font-semibold ${
                      shipment.visibility.showTransportation ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  >
                    {shipment.visibility.showTransportation ? 'Visible' : 'Hidden'}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Estimated Delivery</span>
                  <span
                    className={`font-semibold ${
                      shipment.visibility.showEstimatedDelivery ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  >
                    {shipment.visibility.showEstimatedDelivery ? 'Visible' : 'Hidden'}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Tracking History</span>
                  <span
                    className={`font-semibold ${
                      shipment.visibility.showTrackingHistory ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  >
                    {shipment.visibility.showTrackingHistory ? 'Visible' : 'Hidden'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
