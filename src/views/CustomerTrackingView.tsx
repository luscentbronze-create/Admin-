import React, { useState, useEffect } from 'react';
import {
  Search,
  AlertTriangle,
  Package,
  Calendar,
  Truck,
  User,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Plane,
  Ship,
  Boxes,
} from 'lucide-react';
import { storageService } from '../services/storage';
import { supabaseService } from '../services/supabase';
import { StatusBadge } from '../components/StatusBadge';

interface CustomerTrackingViewProps {
  initialTrackingCode?: string;
  onBackToAdmin?: () => void;
}

export const CustomerTrackingView: React.FC<CustomerTrackingViewProps> = ({
  initialTrackingCode = '',
  onBackToAdmin,
}) => {
  const [inputCode, setInputCode] = useState(initialTrackingCode);
  const [searchedCode, setSearchedCode] = useState(initialTrackingCode);
  const [hasSearched, setHasSearched] = useState(Boolean(initialTrackingCode));
  const [result, setResult] = useState<ReturnType<typeof storageService.getPublicTrackingInfo> | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const performLookup = async (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;

    setIsLoading(true);
    setSearchedCode(clean);
    setHasSearched(true);

    try {
      if (supabaseService.isConfigured()) {
        const remoteShipment = await supabaseService.getPublicTracking(clean);
        if (remoteShipment) {
          const { visibility } = remoteShipment;
          setResult({
            found: true,
            data: {
              trackingCode: remoteShipment.trackingCode,
              status: remoteShipment.status,
              updatedAt: remoteShipment.updatedAt,
              departureDate: visibility.showDepartureDate ? remoteShipment.departureDate : undefined,
              estimatedDelivery: visibility.showEstimatedDelivery ? remoteShipment.estimatedDelivery : undefined,
              transportation: visibility.showTransportation ? remoteShipment.transportation : undefined,
              product: {
                name: visibility.showProduct ? remoteShipment.product.name : undefined,
                description: visibility.showProductDescription ? remoteShipment.product.description : undefined,
                quantity: visibility.showQuantity ? remoteShipment.product.quantity : undefined,
              },
              sender: {
                name: visibility.showSenderName ? remoteShipment.sender.name : undefined,
                address: visibility.showSenderAddress ? remoteShipment.sender.address : undefined,
                email: visibility.showSenderEmail ? remoteShipment.sender.email : undefined,
                phone: visibility.showSenderPhone ? remoteShipment.sender.phone : undefined,
              },
              receiver: {
                name: visibility.showReceiverName ? remoteShipment.receiver.name : undefined,
                address: visibility.showReceiverAddress ? remoteShipment.receiver.address : undefined,
                email: visibility.showReceiverEmail ? remoteShipment.receiver.email : undefined,
                phone: visibility.showReceiverPhone ? remoteShipment.receiver.phone : undefined,
              },
              history: visibility.showTrackingHistory ? remoteShipment.history : undefined,
            },
          });
          setIsLoading(false);
          return;
        }
      }

      // Local fallback lookup
      const data = storageService.getPublicTrackingInfo(clean);
      setResult(data);
    } catch (err) {
      console.warn('Error during tracking lookup:', err);
      const data = storageService.getPublicTrackingInfo(clean);
      setResult(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialTrackingCode) {
      setInputCode(initialTrackingCode);
      performLookup(initialTrackingCode);
    }
  }, [initialTrackingCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(inputCode);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
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

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '';
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

  const getTransportIcon = (method?: string) => {
    switch (method) {
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
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Simulation Banner Notice */}
      <div className="p-4 rounded-2xl bg-[#15181E] border border-[#2B313D] flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-[#FFD600] shrink-0" />
          <span>
            <strong>Customer View Simulation:</strong> Queries database strictly by exact 11-char tracking code. Internal admin data and hidden fields are automatically omitted.
          </span>
        </div>
        {onBackToAdmin && (
          <button
            onClick={onBackToAdmin}
            className="text-xs text-[#FFD600] font-semibold hover:underline shrink-0"
          >
            Return to Dashboard
          </button>
        )}
      </div>

      {/* Lookup Card */}
      <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Track Your Shipment
        </h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Enter your 11-character alphanumeric tracking code (e.g.{' '}
          <button
            type="button"
            onClick={() => {
              const sample = storageService.getShipments()[0]?.trackingCode || '3B8R55K2W9T';
              setInputCode(sample);
              performLookup(sample);
            }}
            className="text-[#FFD600] font-mono-code font-bold hover:underline"
          >
            {storageService.getShipments()[0]?.trackingCode || '3B8R55K2W9T'}
          </button>
          )
        </p>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              required
              maxLength={11}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="e.g. 3B8R55K2W9T"
              className="w-full pl-10 pr-4 py-3 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600] rounded-xl text-sm font-mono-code font-bold text-[#FFD600] uppercase placeholder-slate-600 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-[#FFD600] hover:bg-[#E6C200] active:scale-95 text-black font-bold text-xs rounded-xl shadow-md shadow-[#FFD600]/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Track</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* LOOKUP RESULTS */}
      {hasSearched && !isLoading && (
        <div className="animate-in fade-in duration-200">
          {result?.found && result.data ? (
            /* EXACT MATCH FOUND */
            <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
              {/* Header result */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2937] pb-5">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                    Shipment Tracking
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black font-mono-code text-[#FFD600]">
                    {result.data.trackingCode}
                  </h3>
                </div>

                <div className="sm:text-right">
                  <span className="text-[11px] text-slate-400 block mb-1">Shipment Status</span>
                  <StatusBadge status={result.data.status} size="lg" />
                </div>
              </div>

              {/* Verified Product & Cargo Information (Honors Admin Customer Visibility Controls) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                {result.data.product?.name && (
                  <div className="bg-[#171B22] p-4 rounded-xl border border-[#23272F]">
                    <span className="text-slate-500 block text-[11px] mb-0.5">Product</span>
                    <span className="font-semibold text-white text-sm">
                      {result.data.product.name}
                    </span>
                    {result.data.product.quantity !== undefined && (
                      <span className="text-slate-400 block mt-1">
                        Quantity: {result.data.product.quantity}
                      </span>
                    )}
                    {result.data.product.description && (
                      <span className="text-slate-400 block mt-1 text-[11px]">
                        {result.data.product.description}
                      </span>
                    )}
                  </div>
                )}

                {result.data.transportation && (
                  <div className="bg-[#171B22] p-4 rounded-xl border border-[#23272F]">
                    <span className="text-slate-500 block text-[11px] mb-0.5">
                      Transportation Mode
                    </span>
                    <div className="flex items-center gap-2 font-semibold text-white mt-1">
                      {getTransportIcon(result.data.transportation)}
                      <span>{result.data.transportation} Freight</span>
                    </div>
                  </div>
                )}

                {result.data.estimatedDelivery && (
                  <div className="bg-[#171B22] p-4 rounded-xl border border-[#23272F]">
                    <span className="text-slate-500 block text-[11px] mb-0.5">
                      Estimated Delivery
                    </span>
                    <span className="font-mono-code font-bold text-[#FFD600] text-sm mt-1 block">
                      {formatDate(result.data.estimatedDelivery)}
                    </span>
                  </div>
                )}
              </div>

              {/* Sender & Receiver (Only renders fields permitted by Customer Visibility settings!) */}
              {(result.data.sender?.name || result.data.receiver?.name) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Sender card if permitted */}
                  {result.data.sender && (result.data.sender.name || result.data.sender.address) && (
                    <div className="bg-[#171B22] p-4 rounded-xl border border-[#23272F] space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block">
                        Sender Information
                      </span>
                      {result.data.sender.name && (
                        <p className="font-semibold text-white">{result.data.sender.name}</p>
                      )}
                      {result.data.sender.address && (
                        <p className="text-slate-400 text-[11px]">{result.data.sender.address}</p>
                      )}
                      {result.data.sender.email && (
                        <p className="text-slate-500 text-[11px]">{result.data.sender.email}</p>
                      )}
                      {result.data.sender.phone && (
                        <p className="text-slate-500 text-[11px]">{result.data.sender.phone}</p>
                      )}
                    </div>
                  )}

                  {/* Receiver card if permitted */}
                  {result.data.receiver && (result.data.receiver.name || result.data.receiver.address) && (
                    <div className="bg-[#171B22] p-4 rounded-xl border border-[#23272F] space-y-1">
                      <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block">
                        Receiver Information
                      </span>
                      {result.data.receiver.name && (
                        <p className="font-semibold text-white">{result.data.receiver.name}</p>
                      )}
                      {result.data.receiver.address && (
                        <p className="text-slate-400 text-[11px]">{result.data.receiver.address}</p>
                      )}
                      {result.data.receiver.email && (
                        <p className="text-slate-500 text-[11px]">{result.data.receiver.email}</p>
                      )}
                      {result.data.receiver.phone && (
                        <p className="text-slate-500 text-[11px]">{result.data.receiver.phone}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tracking History (if permitted by admin) */}
              {result.data.history && result.data.history.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
                    Tracking Timeline
                  </h4>
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#23272F]">
                    {result.data.history.map((h, i) => (
                      <div key={h.id} className="relative">
                        <div
                          className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-[#12151B] ${
                            i === 0 ? 'bg-[#FFD600]' : 'bg-slate-600'
                          }`}
                        />
                        <div className="bg-[#171B22] p-3 rounded-xl border border-[#23272F] text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">{h.status}</span>
                            <span className="text-[11px] font-mono-code text-slate-500">
                              {formatDateTime(h.timestamp)}
                            </span>
                          </div>
                          {h.note && <p className="text-slate-300 text-[11px]">{h.note}</p>}
                          {h.location && (
                            <p className="text-slate-500 text-[11px] flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{h.location}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* SECTION 6 & 15: TRACKING CODE NOT FOUND */
            <div className="bg-[#12151B] border border-rose-500/30 rounded-2xl p-8 text-center space-y-3 shadow-xl">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Tracking Code Not Found
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                The tracking code <span className="font-mono-code font-bold text-rose-400">{searchedCode}</span> does not match any shipment record in the system.
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Please verify that the 11-character alphanumeric code was entered correctly, or contact your shipping administrator.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
