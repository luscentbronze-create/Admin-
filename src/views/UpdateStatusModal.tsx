import React, { useState } from 'react';
import { X, RefreshCw, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { ShipmentRecord, ShipmentStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface UpdateStatusModalProps {
  shipment: ShipmentRecord;
  onClose: () => void;
  onSave: (newStatus: ShipmentStatus, note?: string, location?: string) => void;
}

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  shipment,
  onClose,
  onSave,
}) => {
  const [newStatus, setNewStatus] = useState<ShipmentStatus>(shipment.status);
  const [note, setNote] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statuses: ShipmentStatus[] = [
    'Shipment Created',
    'Processing',
    'In Transit',
    'Out for Delivery',
    'Delivered',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onSave(newStatus, note.trim() || undefined, location.trim() || undefined);
      setIsSubmitting(false);
      onClose();
    }, 250);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#12151B] border border-[#262C38] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1F2937] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Update Shipment Status
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Change the active status and append a new chronological tracking event
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1C212B]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tracking code & Current status pill */}
          <div className="bg-[#171B22] border border-[#23272F] rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
                Tracking Code
              </span>
              <span className="font-mono-code font-bold text-[#FFD600] text-base">
                {shipment.trackingCode}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                Current Status
              </span>
              <StatusBadge status={shipment.status} size="sm" />
            </div>
          </div>

          {/* New Status selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="new-status-select">
              New Status <span className="text-[#FFD600]">*</span>
            </label>
            <select
              id="new-status-select"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ShipmentStatus)}
              className="w-full px-3.5 py-2.5 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] rounded-xl text-xs font-medium text-white outline-none"
            >
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Event Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="event-note">
              Tracking Event Note (Optional)
            </label>
            <input
              id="event-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Package is out for delivery with courier."
              className="w-full px-3.5 py-2.5 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] rounded-xl text-xs text-white placeholder-slate-600 outline-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="event-location">
              Current Facility / Location (Optional)
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="event-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Paris Charles de Gaulle Distribution Center"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] rounded-xl text-xs text-white placeholder-slate-600 outline-none"
              />
            </div>
          </div>

          {/* Update button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-[#FFD600] hover:bg-[#E6C200] active:scale-[0.99] text-black font-bold text-xs shadow-md shadow-[#FFD600]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-4 h-4 stroke-[2.5]" />
                <span>Update Status</span>
              </>
            )}
          </button>

          {/* Status History preview */}
          <div className="pt-2 border-t border-[#1F2937]">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Status History ({shipment.history.length})
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {shipment.history.map((h) => (
                <div
                  key={h.id}
                  className="p-2.5 rounded-lg bg-[#171B22] border border-[#23272F] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFD600]" />
                      <span className="font-semibold text-white">{h.status}</span>
                    </div>
                    {h.note && <p className="text-[11px] text-slate-400 mt-0.5">{h.note}</p>}
                  </div>
                  <span className="text-[10px] font-mono-code text-slate-500 whitespace-nowrap">
                    {formatDateTime(h.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
