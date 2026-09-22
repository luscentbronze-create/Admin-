import React, { useState, useEffect } from 'react';
import {
  Package,
  User,
  MapPin,
  Mail,
  Phone,
  Truck,
  Calendar,
  Eye,
  CheckCircle2,
  Copy,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Clock,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import {
  ShipmentRecord,
  ShipmentStatus,
  TransportationMethod,
  CustomerVisibilitySettings,
} from '../types';
import { storageService, DEFAULT_VISIBILITY } from '../services/storage';
import { StatusBadge } from '../components/StatusBadge';

interface CreateShipmentViewProps {
  onShipmentCreated: (shipment: ShipmentRecord) => void;
  onViewShipment: (id: string) => void;
  onCancel: () => void;
}

export const CreateShipmentView: React.FC<CreateShipmentViewProps> = ({
  onShipmentCreated,
  onViewShipment,
  onCancel,
}) => {
  // Wizard steps: 1 = Details, 2 = Visibility, 3 = Review & Generate, 4 = Success Screen
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State - Sender
  const [senderName, setSenderName] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');

  // Form State - Receiver
  const [receiverName, setReceiverName] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');

  // Form State - Product
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [quantity, setQuantity] = useState<number>(1);

  // Form State - Transportation & Delivery
  const [transportation, setTransportation] = useState<TransportationMethod>('Air');
  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [departureDate, setDepartureDate] = useState(todayStr);
  const [estimatedDelivery, setEstimatedDelivery] = useState(nextWeekStr);
  const [initialStatus, setInitialStatus] = useState<ShipmentStatus>('Shipment Created');
  const [initialNote, setInitialNote] = useState('Shipment registered in administration portal');

  // Customer Visibility Controls (Section 4)
  const [visibility, setVisibility] = useState<CustomerVisibilitySettings>({ ...DEFAULT_VISIBILITY });

  // Tracking Code State (11-character alphanumeric)
  const [trackingCode, setTrackingCode] = useState<string>('');

  // Auto-generate initial 11-char alphanumeric tracking code on mount
  useEffect(() => {
    if (!trackingCode) {
      setTrackingCode(storageService.getNewUniqueTrackingCode());
    }
  }, []);

  const handleRegenerateCode = () => {
    const newCode = storageService.getNewUniqueTrackingCode();
    setTrackingCode(newCode);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.trackingCode;
      return copy;
    });
  };

  // Creation output
  const [createdRecord, setCreatedRecord] = useState<ShipmentRecord | null>(null);
  const [dbNotice, setDbNotice] = useState<{ isRls: boolean; message: string; success?: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Quick fill sample data helper for instant testing
  const handlePrefillDemo = () => {
    setSenderName('Apex Electronics Global');
    setSenderAddress('45 Silicon Way, San Jose, CA 95134, USA');
    setSenderEmail('logistics@apexelectronics.com');
    setSenderPhone('+1 408 555 0199');

    setReceiverName('Nordic Horizon Retail');
    setReceiverAddress('Hamngatan 15, 111 47 Stockholm, Sweden');
    setReceiverEmail('orders@nordichorizon.se');
    setReceiverPhone('+46 8 123 4567');

    setProductName('Pro Ultra Graphic Tablets');
    setProductDescription('Box of 12 Pen Display Tablets with Stylus Kits');
    setQuantity(12);

    setTransportation('Air');
    setDepartureDate(todayStr);
    setEstimatedDelivery(nextWeekStr);
    setInitialStatus('Shipment Created');
    setInitialNote('Packed and ready for freight pickup');
    setErrors({});
  };

  const validateStep1 = () => {
    const errs: { [key: string]: string } = {};
    if (!senderName.trim()) errs.senderName = 'Sender name is required';
    if (!senderAddress.trim()) errs.senderAddress = 'Sender address is required';
    if (!receiverName.trim()) errs.receiverName = 'Receiver name is required';
    if (!receiverAddress.trim()) errs.receiverAddress = 'Receiver address is required';
    if (!productName.trim()) errs.productName = 'Product name is required';
    if (!quantity || quantity < 1) errs.quantity = 'Quantity must be at least 1';
    if (!departureDate) errs.departureDate = 'Departure date is required';
    if (!estimatedDelivery) errs.estimatedDelivery = 'Estimated delivery date is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextToVisibility = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleGenerateTrackingCode = async () => {
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    const cleanCode = (trackingCode || storageService.getNewUniqueTrackingCode()).trim().toUpperCase();
    if (cleanCode.length !== 11 || !/^[A-Z0-9]{11}$/.test(cleanCode)) {
      setErrors((prev) => ({
        ...prev,
        trackingCode: 'Tracking code must be exactly 11 alphanumeric characters (A-Z, 0-9).',
      }));
      return;
    }

    // Call storage service to generate or assign unique 11-char alphanumeric tracking code and persist
    setIsSubmitting(true);
    const { shipment, dbResult } = await storageService.createShipmentAsync({
      sender: {
        name: senderName.trim(),
        address: senderAddress.trim(),
        email: senderEmail.trim(),
        phone: senderPhone.trim(),
      },
      receiver: {
        name: receiverName.trim(),
        address: receiverAddress.trim(),
        email: receiverEmail.trim(),
        phone: receiverPhone.trim(),
      },
      product: {
        name: productName.trim(),
        description: productDescription.trim(),
        quantity: Number(quantity),
      },
      transportation,
      departureDate,
      estimatedDelivery,
      initialStatus,
      visibility,
      initialNote,
      customTrackingCode: cleanCode,
    });
    setIsSubmitting(false);

    if (dbResult) {
      if (dbResult.isRlsError) {
        setDbNotice({
          isRls: true,
          message: 'Saved locally, but Supabase blocked database insert due to Row Level Security (RLS). Go to Portal Settings to copy and execute the SQL policy fix script.',
        });
      } else if (!dbResult.success) {
        setDbNotice({
          isRls: false,
          message: `Database sync notice: ${dbResult.error}`,
        });
      } else {
        setDbNotice({
          isRls: false,
          success: true,
          message: 'Shipment record successfully saved and synchronized with Supabase database!',
        });
      }
    }

    setCreatedRecord(shipment);
    onShipmentCreated(shipment);
    setCurrentStep(4); // Move directly to Success Screen!
  };

  const handleCopyCode = () => {
    if (createdRecord) {
      navigator.clipboard.writeText(createdRecord.trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleResetForm = () => {
    setSenderName('');
    setSenderAddress('');
    setSenderEmail('');
    setSenderPhone('');
    setReceiverName('');
    setReceiverAddress('');
    setReceiverEmail('');
    setReceiverPhone('');
    setProductName('');
    setProductDescription('');
    setQuantity(1);
    setCreatedRecord(null);
    setCurrentStep(1);
    setErrors({});
  };

  // ----------------------------------------------------
  // SCREEN 5: GENERATE TRACKING CODE SUCCESS SCREEN
  // ----------------------------------------------------
  if (currentStep === 4 && createdRecord) {
    return (
      <div className="max-w-2xl mx-auto py-6 sm:py-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#12151B] border border-[#262C38] rounded-3xl p-6 sm:p-10 shadow-2xl text-center relative overflow-hidden">
          {/* Subtle electric yellow glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#FFD600]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Success Check Badge */}
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Shipment Created Successfully!
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Your shipment record has been securely saved and permanently mapped to its 11-character reference code.
          </p>

          {/* Database Sync Status Notice */}
          {dbNotice && (
            <div
              className={`mt-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 text-left max-w-lg mx-auto ${
                dbNotice.success
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : dbNotice.isRls
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {dbNotice.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              )}
              <div className="space-y-1">
                <span className="font-semibold block">
                  {dbNotice.success ? 'Supabase Sync Confirmed' : dbNotice.isRls ? 'Supabase Policy Notice (RLS Action Required)' : 'Database Notice'}
                </span>
                <p className="text-[11px] opacity-90 leading-relaxed">{dbNotice.message}</p>
              </div>
            </div>
          )}

          {/* Big Prominent Tracking Code Display (Section 5, 7) */}
          <div className="my-8 p-6 sm:p-8 rounded-2xl bg-[#0B0D11] border-2 border-[#FFD600]/40 relative group">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-2">
              Assigned Tracking Code
            </span>
            <div className="text-3xl sm:text-5xl font-black font-mono-code text-[#FFD600] tracking-wider selection:bg-white selection:text-black">
              {createdRecord.trackingCode}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Exact 11-character alphanumeric key (Unique database reference)
            </p>

            {/* Prominent Copy Button */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleCopyCode}
                id="copy-tracking-code-btn"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFD600] hover:bg-[#E6C200] active:scale-95 text-black font-bold text-xs shadow-md shadow-[#FFD600]/20 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 stroke-[2.5]" />
                    <span>Copy Tracking Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-8 max-w-sm mx-auto">
            Share this 11-character code with the customer. They can look up their shipment status on the tracking portal.
          </p>

          {/* Shipment Summary Card */}
          <div className="bg-[#171B22] border border-[#23272F] rounded-2xl p-5 text-left mb-8 space-y-2.5 text-xs">
            <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] border-b border-[#23272F] pb-2">
              Shipment Summary
            </h4>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-500 block text-[11px]">Product</span>
                <span className="font-medium text-white">{createdRecord.product.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Quantity</span>
                <span className="font-medium text-white">{createdRecord.product.quantity} unit(s)</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Route</span>
                <span className="font-medium text-white">
                  {createdRecord.sender.name} → {createdRecord.receiver.name}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Initial Status</span>
                <div className="mt-0.5">
                  <StatusBadge status={createdRecord.status} size="sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Dual Primary Actions (View Shipment vs Create Another) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onViewShipment(createdRecord.id)}
              id="view-created-shipment-btn"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Shipment Record</span>
            </button>

            <button
              onClick={handleResetForm}
              id="create-another-shipment-btn"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1F2530] hover:bg-[#28303E] text-white font-semibold text-xs border border-[#2B3444] transition-all"
            >
              Create Another Shipment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // CREATION WIZARD (Steps 1, 2, 3)
  // ----------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Wizard Header & Steps indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2937] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Create Shipment</h1>
            <button
              type="button"
              onClick={handlePrefillDemo}
              className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFD600]/10 hover:bg-[#FFD600]/20 text-[#FFD600] text-[11px] font-semibold border border-[#FFD600]/20 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>Fill Demo Data</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Fill in the details below to create a new shipment record and generate an 11-character tracking code.
          </p>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs select-none">
          <button
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              currentStep === 1
                ? 'bg-[#FFD600] text-black font-bold shadow-xs'
                : 'bg-[#15181E] text-slate-400 hover:text-white border border-[#262B35]'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Details</span>
          </button>

          <span className="text-slate-600">→</span>

          <button
            onClick={() => {
              if (validateStep1()) setCurrentStep(2);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              currentStep === 2
                ? 'bg-[#FFD600] text-black font-bold shadow-xs'
                : 'bg-[#15181E] text-slate-400 hover:text-white border border-[#262B35]'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Customer Visibility</span>
          </button>

          <span className="text-slate-600">→</span>

          <button
            onClick={() => {
              if (validateStep1()) setCurrentStep(3);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              currentStep === 3
                ? 'bg-[#FFD600] text-black font-bold shadow-xs'
                : 'bg-[#15181E] text-slate-400 hover:text-white border border-[#262B35]'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Review & Generate</span>
          </button>
        </div>
      </div>

      {/* STEP 1: SHIPMENT DETAILS */}
      {currentStep === 1 && (
        <form onSubmit={handleNextToVisibility} className="space-y-6">
          {/* SENDER & RECEIVER SIDE-BY-SIDE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sender Information Card */}
            <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-[#1F2937] pb-3">
                <User className="w-4 h-4 text-[#FFD600]" />
                <h3>Sender Information</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="sender-name">
                  Sender / Client Name <span className="text-[#FFD600]">*</span>
                </label>
                <input
                  id="sender-name"
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. John Smith or Apex Corp"
                  className={`w-full px-3.5 py-2 bg-[#171B22] border rounded-xl text-xs text-white placeholder-slate-600 outline-none transition-all ${
                    errors.senderName ? 'border-rose-500' : 'border-[#2B313D] focus:border-[#FFD600]'
                  }`}
                />
                {errors.senderName && (
                  <p className="text-[11px] text-rose-400 mt-1">{errors.senderName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="sender-address">
                  Origin Address <span className="text-[#FFD600]">*</span>
                </label>
                <input
                  id="sender-address"
                  type="text"
                  required
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                  placeholder="e.g. 123 Main St, Douala, Cameroon"
                  className={`w-full px-3.5 py-2 bg-[#171B22] border rounded-xl text-xs text-white placeholder-slate-600 outline-none transition-all ${
                    errors.senderAddress ? 'border-rose-500' : 'border-[#2B313D] focus:border-[#FFD600]'
                  }`}
                />
                {errors.senderAddress && (
                  <p className="text-[11px] text-rose-400 mt-1">{errors.senderAddress}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="sender-email">
                    Email Address
                  </label>
                  <input
                    id="sender-email"
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3.5 py-2 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] rounded-xl text-xs text-white placeholder-slate-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="sender-phone">
                    Phone Number
                  </label>
                  <input
                    id="sender-phone"
                    type="tel"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="+237 6 12 34 56 78"
                    className="w-full px-3.5 py-2 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] rounded-xl text-xs text-white placeholder-slate-600 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Receiver Information Card */}
            <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-[#1F2937] pb-3">
                <MapPin className="w-4 h-4 text-[#FFD600]" />
                <h3>Receiver Information</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="receiver-name">
                  Receiver Name <span className="text-[#FFD600]">*</span>
                </label>
                <input
                  id="receiver-name"
                  type="text"
                  required
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="e.g. Sarah Johnson"
                  className={`w-full px-3.5 py-2 bg-[#171B22] border rounded-xl text-xs text-white placeholder-slate-600 outline-none transition-all ${
                    errors.receiverName ? 'border-rose-500' : 'border-[#2B313D] focus:border-[#FFD600]'
                  }`}
                />
                {errors.receiverName && (
                  <p className="text-[11px] text-rose-400 mt-1">{errors.receiverName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="receiver-address">
                  Destination Address <span className="text-[#FFD600]">*</span>
                </label>
                <input
                  id="receiver-address"
                  type="text"
                  required
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  placeholder="e.g. 450 Ocean Ave, Paris, France"
                  className={`w-full px-3.5 py-2 bg-[#171B22] border rounded-xl text-xs text-white placeholder-slate-600 outline-none transition-all ${
                    errors.receiverAddress ? 'border-rose-500' : 'border-[#2B313D] focus:border-[#FFD600]'
                  }`}
                />
                {errors.receiverAddress && (
                  <p className="text-[11px] text-rose-400 mt-1">{errors.receiverAddress}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="receiver-email">
                    Email Address
                  </label>
                  <input
                    id="receiver-email"
                    type="email"
                    value={receiverEmail}
                    onChange={(e) => setReceiverEmail(e.target.value)}
                    placeholder="sarah@example.com"
                    className="w-full px-3.5 py-2 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] rounded-xl text-xs text-white placeholder-slate-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="receiver-phone">
                    Phone Number
                  </label>
                  <input
                    id="receiver-phone"
                    type="tel"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    placeholder="+33 6 56 78 54 32"
                    className="w-full px-3.5 py-2 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] rounded-xl text-xs text-white placeholder-slate-600 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PRODUCT INFORMATION */}
          <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-[#1F2937] pb-3">
              <Package className="w-4 h-4 text-[#FFD600]" />
              <h3>Product Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="product-name">
                  Product Name / Title <span className="text-[#FFD600]">*</span>
                </label>
                <input
                  id="product-name"
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Laptop XPS 13"
                  className={`w-full px-3.5 py-2 bg-[#171B22] border rounded-xl text-xs text-white placeholder-slate-600 outline-none ${
                    errors.productName ? 'border-rose-500' : 'border-[#2B313D] focus:border-[#FFD600]'
                  }`}
                />
                {errors.productName && (
                  <p className="text-[11px] text-rose-400 mt-1">{errors.productName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="product-quantity">
                  Quantity <span className="text-[#FFD600]">*</span>
                </label>
                <input
                  id="product-quantity"
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] rounded-xl text-xs text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="product-desc">
                Product Description (Optional)
              </label>
              <textarea
                id="product-desc"
                rows={2}
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Specific model details, serial batches, accessories, fragile warnings..."
                className="w-full px-3.5 py-2 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] rounded-xl text-xs text-white placeholder-slate-600 outline-none resize-none"
              />
            </div>
          </div>

          {/* TRANSPORTATION & DELIVERY */}
          <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-[#1F2937] pb-3">
              <Truck className="w-4 h-4 text-[#FFD600]" />
              <h3>Transportation & Delivery</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="transport-method">
                  Transportation Mode
                </label>
                <select
                  id="transport-method"
                  value={transportation}
                  onChange={(e) => setTransportation(e.target.value as TransportationMethod)}
                  className="w-full px-3.5 py-2 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] rounded-xl text-xs text-white outline-none"
                >
                  <option value="Air">Air Freight</option>
                  <option value="Road">Road Transportation</option>
                  <option value="Sea">Sea Freight</option>
                  <option value="Other">Other / Multimodal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="departure-date">
                  Departure Date <span className="text-[#FFD600]">*</span>
                </label>
                <input
                  id="departure-date"
                  type="date"
                  required
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="estimated-delivery">
                  Estimated Delivery Date <span className="text-[#FFD600]">*</span>
                </label>
                <input
                  id="estimated-delivery"
                  type="date"
                  required
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="initial-status">
                  Initial Status
                </label>
                <select
                  id="initial-status"
                  value={initialStatus}
                  onChange={(e) => setInitialStatus(e.target.value as ShipmentStatus)}
                  className="w-full px-3.5 py-2 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] rounded-xl text-xs text-white outline-none"
                >
                  <option value="Shipment Created">Shipment Created</option>
                  <option value="Processing">Processing</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="initial-note">
                Initial Tracking Event Note
              </label>
              <input
                id="initial-note"
                type="text"
                value={initialNote}
                onChange={(e) => setInitialNote(e.target.value)}
                placeholder="e.g. Registered in system, awaiting dispatch from origin warehouse"
                className="w-full px-3.5 py-2 bg-[#171B22] border border-[#2B313D] focus:border-[#FFD600] rounded-xl text-xs text-white placeholder-slate-600 outline-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1A1E26]"
            >
              Cancel
            </button>

            <button
              type="submit"
              id="next-to-visibility-btn"
              className="px-6 py-2.5 rounded-xl bg-[#FFD600] hover:bg-[#E6C200] active:scale-[0.98] text-black font-bold text-xs shadow-md shadow-[#FFD600]/20 flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Customer Visibility Settings</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: CUSTOMER VISIBILITY SETTINGS (Section 4) */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-[#FFD600]/5 border border-[#FFD600]/20 text-xs text-slate-300 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#FFD600] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white mb-0.5">Customer Visibility Protection</h4>
              <p className="text-slate-400 leading-relaxed">
                Only the exact fields you select below will be exposed on the customer-facing tracking page.
                Any unselected field is strictly stripped and hidden from customer queries.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sender Visibility */}
            <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider border-b border-[#1F2937] pb-2">
                Sender Information
              </h3>
              <div className="space-y-2.5 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={visibility.showSenderName}
                    onChange={(e) =>
                      setVisibility({ ...visibility, showSenderName: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#FFD600] focus:ring-[#FFD600] bg-[#1A1E26] border-[#2E3646] accent-[#FFD600]"
                  />
                  <span>Show sender name</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={visibility.showSenderAddress}
                    onChange={(e) =>
                      setVisibility({ ...visibility, showSenderAddress: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#FFD600] focus:ring-[#FFD600] bg-[#1A1E26] border-[#2E3646] accent-[#FFD600]"
                  />
                  <span>Show sender address</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={visibility.showSenderEmail}
                    onChange={(e) =>
                      setVisibility({ ...visibility, showSenderEmail: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#FFD600] focus:ring-[#FFD600] bg-[#1A1E26] border-[#2E3646] accent-[#FFD600]"
                  />
                  <span>Show sender email</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={visibility.showSenderPhone}
                    onChange={(e) =>
                      setVisibility({ ...visibility, showSenderPhone: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#FFD600] focus:ring-[#FFD600] bg-[#1A1E26] border-[#2E3646] accent-[#FFD600]"
                  />
                  <span>Show sender phone</span>
                </label>
              </div>
            </div>

            {/* Receiver Visibility */}
            <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider border-b border-[#1F2937] pb-2">
                Receiver Information
              </h3>
              <div className="space-y-2.5 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={visibility.showReceiverName}
                    onChange={(e) =>
                      setVisibility({ ...visibility, showReceiverName: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#FFD600] focus:ring-[#FFD600] bg-[#1A1E26] border-[#2E3646] accent-[#FFD600]"
                  />
                  <span>Show receiver name</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={visibility.showReceiverAddress}
                    onChange={(e) =>
                      setVisibility({ ...visibility, showReceiverAddress: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#FFD600] focus:ring-[#FFD600] bg-[#1A1E26] border-[#2E3646] accent-[#FFD600]"
                  />
                  <span>Show receiver address</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={visibility.showReceiverEmail}
                    onChange={(e) =>
                      setVisibility({ ...visibility, showReceiverEmail: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#FFD600] focus:ring-[#FFD600] bg-[#1A1E26] border-[#2E3646] accent-[#FFD600]"
                  />
                  <span>Show receiver email</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={visibility.showReceiverPhone}
                    onChange={(e) =>
                      setVisibility({ ...visibility, showReceiverPhone: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#FFD600] focus:ring-[#FFD600] bg-[#1A1E26] border-[#2E3646] accent-[#FFD600]"
                  />
                  <span>Show receiver phone</span>
                </label>
              </div>
            </div>

            {/* Shipment Details Visibility */}
            <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider border-b border-[#1F2937] pb-2">
                Shipment Information
              </h3>
              <div className="space-y-2.5 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={visibility.showProduct}
                    onChange={(e) =>
                      setVisibility({ ...visibility, showProduct: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#FFD600] focus:ring-[#FFD600] bg-[#1A1E26] border-[#2E3646] accent-[#FFD600]"
                  />
                  <span>Show product name</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={visibility.showProductDescription}
                    onChange={(e) =>
                      setVisibility({ ...visibility, showProductDescription: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#FFD600] focus:ring-[#FFD600] bg-[#1A1E26] border-[#2E3646] accent-[#FFD600]"
                  />
                  <span>Show product description</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={visibility.showQuantity}
                    onChange={(e) =>
                      setVisibility({ ...visibility, showQuantity: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#FFD600] focus:ring-[#FFD600] bg-[#1A1E26] border-[#2E3646] accent-[#FFD600]"
                  />
                  <span>Show quantity</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={visibility.showTransportation}
                    onChange={(e) =>
                      setVisibility({ ...visibility, showTransportation: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#FFD600] focus:ring-[#FFD600] bg-[#1A1E26] border-[#2E3646] accent-[#FFD600]"
                  />
                  <span>Show transportation mode</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={visibility.showDepartureDate}
                    onChange={(e) =>
                      setVisibility({ ...visibility, showDepartureDate: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#FFD600] focus:ring-[#FFD600] bg-[#1A1E26] border-[#2E3646] accent-[#FFD600]"
                  />
                  <span>Show departure date</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={visibility.showEstimatedDelivery}
                    onChange={(e) =>
                      setVisibility({ ...visibility, showEstimatedDelivery: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#FFD600] focus:ring-[#FFD600] bg-[#1A1E26] border-[#2E3646] accent-[#FFD600]"
                  />
                  <span>Show estimated delivery</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={visibility.showTrackingHistory}
                    onChange={(e) =>
                      setVisibility({ ...visibility, showTrackingHistory: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#FFD600] focus:ring-[#FFD600] bg-[#1A1E26] border-[#2E3646] accent-[#FFD600]"
                  />
                  <span>Show tracking history</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1A1E26] flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Details</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              id="next-to-review-btn"
              className="px-6 py-2.5 rounded-xl bg-[#FFD600] hover:bg-[#E6C200] active:scale-[0.98] text-black font-bold text-xs shadow-md shadow-[#FFD600]/20 flex items-center gap-2 cursor-pointer"
            >
              <span>Review & Generate</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & GENERATE TRACKING CODE */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-6 space-y-6">
            <div className="border-b border-[#1F2937] pb-4">
              <h3 className="text-lg font-bold text-white">Review Shipment Configuration</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verify the sender, receiver, cargo details, and customer visibility rules before generating the unique tracking code.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Sender summary */}
              <div className="bg-[#171B22] p-4 rounded-xl space-y-1.5">
                <span className="text-[11px] uppercase tracking-wider text-[#FFD600] font-bold">
                  Sender
                </span>
                <p className="text-sm font-semibold text-white">{senderName}</p>
                <p className="text-slate-400">{senderAddress}</p>
                {senderEmail && <p className="text-slate-500">{senderEmail}</p>}
                {senderPhone && <p className="text-slate-500">{senderPhone}</p>}
              </div>

              {/* Receiver summary */}
              <div className="bg-[#171B22] p-4 rounded-xl space-y-1.5">
                <span className="text-[11px] uppercase tracking-wider text-[#FFD600] font-bold">
                  Receiver
                </span>
                <p className="text-sm font-semibold text-white">{receiverName}</p>
                <p className="text-slate-400">{receiverAddress}</p>
                {receiverEmail && <p className="text-slate-500">{receiverEmail}</p>}
                {receiverPhone && <p className="text-slate-500">{receiverPhone}</p>}
              </div>

              {/* Product summary */}
              <div className="bg-[#171B22] p-4 rounded-xl space-y-1.5">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  Product & Logistics
                </span>
                <p className="text-sm font-semibold text-white">
                  {productName} (Qty: {quantity})
                </p>
                <p className="text-slate-400">Mode: {transportation} Freight</p>
                <p className="text-slate-400">
                  Departing: {departureDate} | Est. Delivery: {estimatedDelivery}
                </p>
              </div>

              {/* Visibility summary */}
              <div className="bg-[#171B22] p-4 rounded-xl space-y-1.5">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  Active Customer Visibility
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {visibility.showSenderName && (
                    <span className="px-2 py-0.5 rounded-md bg-black/40 text-[10px] text-slate-300">
                      Sender Name
                    </span>
                  )}
                  {visibility.showReceiverName && (
                    <span className="px-2 py-0.5 rounded-md bg-black/40 text-[10px] text-slate-300">
                      Receiver Name
                    </span>
                  )}
                  {visibility.showProduct && (
                    <span className="px-2 py-0.5 rounded-md bg-black/40 text-[10px] text-slate-300">
                      Product
                    </span>
                  )}
                  {visibility.showEstimatedDelivery && (
                    <span className="px-2 py-0.5 rounded-md bg-black/40 text-[10px] text-slate-300">
                      ETA
                    </span>
                  )}
                  {visibility.showTrackingHistory && (
                    <span className="px-2 py-0.5 rounded-md bg-black/40 text-[10px] text-slate-300">
                      History
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Prominent Call to Action: Generate Tracking Code (Section 5) */}
            <div className="p-6 rounded-2xl bg-[#0F1115] border-2 border-[#FFD600]/30 space-y-4">
              <div className="text-center">
                <span className="text-[11px] uppercase tracking-widest text-[#FFD600] font-bold block mb-1">
                  11-Character Alphanumeric Tracking Code
                </span>
                <h4 className="text-base font-bold text-white">
                  Assigned Shipment Tracking Reference
                </h4>
                <p className="text-xs text-slate-400 max-w-lg mx-auto mt-1">
                  This unique 11-character alphanumeric code will be permanently registered in the database and provided to the customer.
                </p>
              </div>

              {/* Interactive Code Preview & Regenerate Box */}
              <div className="max-w-md mx-auto p-4 rounded-xl bg-[#171B22] border border-[#2B313D] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex-1 text-center sm:text-left">
                  <div className="text-xs text-slate-500 font-medium">Tracking Code</div>
                  <div className="font-mono-code text-2xl font-black tracking-wider text-[#FFD600]">
                    {trackingCode}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  className="px-3 py-2 rounded-lg bg-[#232834] hover:bg-[#2C3342] text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Generate another 11-character alphanumeric tracking code"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#FFD600]" />
                  <span>Regenerate Code</span>
                </button>
              </div>

              {/* Custom input toggle if admin wants to customize */}
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Custom code (optional)</span>
                  <span className={trackingCode.length === 11 && /^[A-Z0-9]{11}$/.test(trackingCode) ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                    {trackingCode.length}/11 characters
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={11}
                  value={trackingCode}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
                    setTrackingCode(val);
                  }}
                  placeholder="e.g. 3B8R55K2W9T"
                  className="w-full px-3.5 py-2 bg-[#0B0D11] border border-[#2B313D] focus:border-[#FFD600] rounded-xl text-center font-mono-code text-sm font-bold text-white tracking-widest outline-none"
                />
                {errors.trackingCode && (
                  <p className="text-rose-400 text-xs mt-1 text-center">{errors.trackingCode}</p>
                )}
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleGenerateTrackingCode}
                  id="generate-tracking-code-btn"
                  disabled={trackingCode.length !== 11 || !/^[A-Z0-9]{11}$/.test(trackingCode)}
                  className="px-8 py-3.5 rounded-xl bg-[#FFD600] hover:bg-[#E6C200] active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-black font-extrabold text-sm shadow-xl shadow-[#FFD600]/25 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4 stroke-[3]" />
                  <span>Create Shipment & Save to Database</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1A1E26] flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Visibility</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
