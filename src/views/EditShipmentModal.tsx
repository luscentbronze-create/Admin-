import React, { useState } from 'react';
import {
  X,
  Save,
  Lock,
  Package,
  User,
  MapPin,
  Truck,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  ShipmentRecord,
  ShipmentStatus,
  TransportationMethod,
  CustomerVisibilitySettings,
} from '../types';

interface EditShipmentModalProps {
  shipment: ShipmentRecord;
  onClose: () => void;
  onSave: (updatedData: Partial<ShipmentRecord>) => void;
}

export const EditShipmentModal: React.FC<EditShipmentModalProps> = ({
  shipment,
  onClose,
  onSave,
}) => {
  // Sender
  const [senderName, setSenderName] = useState(shipment.sender.name);
  const [senderAddress, setSenderAddress] = useState(shipment.sender.address);
  const [senderEmail, setSenderEmail] = useState(shipment.sender.email);
  const [senderPhone, setSenderPhone] = useState(shipment.sender.phone);

  // Receiver
  const [receiverName, setReceiverName] = useState(shipment.receiver.name);
  const [receiverAddress, setReceiverAddress] = useState(shipment.receiver.address);
  const [receiverEmail, setReceiverEmail] = useState(shipment.receiver.email);
  const [receiverPhone, setReceiverPhone] = useState(shipment.receiver.phone);

  // Product
  const [productName, setProductName] = useState(shipment.product.name);
  const [productDescription, setProductDescription] = useState(
    shipment.product.description || ''
  );
  const [quantity, setQuantity] = useState(shipment.product.quantity);

  // Logistics
  const [transportation, setTransportation] = useState<TransportationMethod>(
    shipment.transportation
  );
  const [departureDate, setDepartureDate] = useState(shipment.departureDate);
  const [estimatedDelivery, setEstimatedDelivery] = useState(shipment.estimatedDelivery);
  const [status, setStatus] = useState<ShipmentStatus>(shipment.status);

  // Customer Visibility
  const [visibility, setVisibility] = useState<CustomerVisibilitySettings>({
    ...shipment.visibility,
  });

  const [activeTab, setActiveTab] = useState<'info' | 'visibility'>('info');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
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
      status,
      visibility,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#12151B] border border-[#262C38] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header with Locked Tracking Code notice */}
        <div className="px-6 py-4 border-b border-[#1F2937] flex items-center justify-between shrink-0 bg-[#0F1115]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">Edit Shipment</h3>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1A1E26] border border-[#2B313D] text-[11px] font-mono-code text-[#FFD600]">
                <Lock className="w-3 h-3 text-[#FFD600]" />
                <span>{shipment.trackingCode} (Locked)</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Modify shipment details and customer visibility. The 11-character tracking code remains permanently locked.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1C212B]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#1F2937] bg-[#12151B] shrink-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-2 px-2 border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-[#FFD600] text-[#FFD600]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Shipment Information
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('visibility')}
            className={`pb-2 px-2 border-b-2 transition-colors ${
              activeTab === 'visibility'
                ? 'border-[#FFD600] text-[#FFD600]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Customer Visibility Controls
          </button>
        </div>

        {/* Form Body (scrollable) */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === 'info' ? (
            <>
              {/* SENDER & RECEIVER */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sender */}
                <div className="bg-[#171B22] p-4 rounded-xl space-y-3 border border-[#23272F]">
                  <span className="font-bold text-white uppercase text-[11px] block border-b border-[#23272F] pb-1.5">
                    Sender Information
                  </span>
                  <div>
                    <label className="block text-slate-400 mb-1" htmlFor="edit-sender-name">Name</label>
                    <input
                      id="edit-sender-name"
                      type="text"
                      required
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#12151B] border border-[#2B313D] rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1" htmlFor="edit-sender-address">Address</label>
                    <input
                      id="edit-sender-address"
                      type="text"
                      required
                      value={senderAddress}
                      onChange={(e) => setSenderAddress(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#12151B] border border-[#2B313D] rounded-lg text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1" htmlFor="edit-sender-email">Email</label>
                      <input
                        id="edit-sender-email"
                        type="email"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#12151B] border border-[#2B313D] rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1" htmlFor="edit-sender-phone">Phone</label>
                      <input
                        id="edit-sender-phone"
                        type="text"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#12151B] border border-[#2B313D] rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Receiver */}
                <div className="bg-[#171B22] p-4 rounded-xl space-y-3 border border-[#23272F]">
                  <span className="font-bold text-white uppercase text-[11px] block border-b border-[#23272F] pb-1.5">
                    Receiver Information
                  </span>
                  <div>
                    <label className="block text-slate-400 mb-1" htmlFor="edit-receiver-name">Name</label>
                    <input
                      id="edit-receiver-name"
                      type="text"
                      required
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#12151B] border border-[#2B313D] rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1" htmlFor="edit-receiver-address">Address</label>
                    <input
                      id="edit-receiver-address"
                      type="text"
                      required
                      value={receiverAddress}
                      onChange={(e) => setReceiverAddress(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#12151B] border border-[#2B313D] rounded-lg text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1" htmlFor="edit-receiver-email">Email</label>
                      <input
                        id="edit-receiver-email"
                        type="email"
                        value={receiverEmail}
                        onChange={(e) => setReceiverEmail(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#12151B] border border-[#2B313D] rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1" htmlFor="edit-receiver-phone">Phone</label>
                      <input
                        id="edit-receiver-phone"
                        type="text"
                        value={receiverPhone}
                        onChange={(e) => setReceiverPhone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#12151B] border border-[#2B313D] rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PRODUCT & TRANSPORTATION */}
              <div className="bg-[#171B22] p-4 rounded-xl space-y-3 border border-[#23272F]">
                <span className="font-bold text-white uppercase text-[11px] block border-b border-[#23272F] pb-1.5">
                  Cargo & Logistics
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-slate-400 mb-1" htmlFor="edit-product-name">Product Name</label>
                    <input
                      id="edit-product-name"
                      type="text"
                      required
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#12151B] border border-[#2B313D] rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1" htmlFor="edit-product-qty">Quantity</label>
                    <input
                      id="edit-product-qty"
                      type="number"
                      min="1"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 bg-[#12151B] border border-[#2B313D] rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1" htmlFor="edit-product-desc">Description</label>
                  <input
                    id="edit-product-desc"
                    type="text"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#12151B] border border-[#2B313D] rounded-lg text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-400 mb-1" htmlFor="edit-transport-mode">Transport Mode</label>
                    <select
                      id="edit-transport-mode"
                      value={transportation}
                      onChange={(e) => setTransportation(e.target.value as TransportationMethod)}
                      className="w-full px-3 py-1.5 bg-[#12151B] border border-[#2B313D] rounded-lg text-white"
                    >
                      <option value="Air">Air Freight</option>
                      <option value="Road">Road</option>
                      <option value="Sea">Sea</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1" htmlFor="edit-departure-date">Departure Date</label>
                    <input
                      id="edit-departure-date"
                      type="date"
                      required
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#12151B] border border-[#2B313D] rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1" htmlFor="edit-est-delivery">Estimated Delivery</label>
                    <input
                      id="edit-est-delivery"
                      type="date"
                      required
                      value={estimatedDelivery}
                      onChange={(e) => setEstimatedDelivery(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#12151B] border border-[#2B313D] rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* CUSTOMER VISIBILITY CONTROLS IN EDIT */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Sender */}
                <div className="bg-[#171B22] p-4 rounded-xl space-y-2 border border-[#23272F]">
                  <h4 className="font-bold text-white uppercase text-[11px] border-b border-[#23272F] pb-1.5">
                    Sender Info
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibility.showSenderName}
                      onChange={(e) =>
                        setVisibility({ ...visibility, showSenderName: e.target.checked })
                      }
                      className="rounded text-[#FFD600] accent-[#FFD600]"
                    />
                    <span>Show name</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibility.showSenderAddress}
                      onChange={(e) =>
                        setVisibility({ ...visibility, showSenderAddress: e.target.checked })
                      }
                      className="rounded text-[#FFD600] accent-[#FFD600]"
                    />
                    <span>Show address</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibility.showSenderEmail}
                      onChange={(e) =>
                        setVisibility({ ...visibility, showSenderEmail: e.target.checked })
                      }
                      className="rounded text-[#FFD600] accent-[#FFD600]"
                    />
                    <span>Show email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibility.showSenderPhone}
                      onChange={(e) =>
                        setVisibility({ ...visibility, showSenderPhone: e.target.checked })
                      }
                      className="rounded text-[#FFD600] accent-[#FFD600]"
                    />
                    <span>Show phone</span>
                  </label>
                </div>

                {/* Receiver */}
                <div className="bg-[#171B22] p-4 rounded-xl space-y-2 border border-[#23272F]">
                  <h4 className="font-bold text-white uppercase text-[11px] border-b border-[#23272F] pb-1.5">
                    Receiver Info
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibility.showReceiverName}
                      onChange={(e) =>
                        setVisibility({ ...visibility, showReceiverName: e.target.checked })
                      }
                      className="rounded text-[#FFD600] accent-[#FFD600]"
                    />
                    <span>Show name</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibility.showReceiverAddress}
                      onChange={(e) =>
                        setVisibility({ ...visibility, showReceiverAddress: e.target.checked })
                      }
                      className="rounded text-[#FFD600] accent-[#FFD600]"
                    />
                    <span>Show address</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibility.showReceiverEmail}
                      onChange={(e) =>
                        setVisibility({ ...visibility, showReceiverEmail: e.target.checked })
                      }
                      className="rounded text-[#FFD600] accent-[#FFD600]"
                    />
                    <span>Show email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibility.showReceiverPhone}
                      onChange={(e) =>
                        setVisibility({ ...visibility, showReceiverPhone: e.target.checked })
                      }
                      className="rounded text-[#FFD600] accent-[#FFD600]"
                    />
                    <span>Show phone</span>
                  </label>
                </div>

                {/* Shipment Details */}
                <div className="bg-[#171B22] p-4 rounded-xl space-y-2 border border-[#23272F]">
                  <h4 className="font-bold text-white uppercase text-[11px] border-b border-[#23272F] pb-1.5">
                    Shipment Info
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibility.showProduct}
                      onChange={(e) =>
                        setVisibility({ ...visibility, showProduct: e.target.checked })
                      }
                      className="rounded text-[#FFD600] accent-[#FFD600]"
                    />
                    <span>Show product name</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibility.showQuantity}
                      onChange={(e) =>
                        setVisibility({ ...visibility, showQuantity: e.target.checked })
                      }
                      className="rounded text-[#FFD600] accent-[#FFD600]"
                    />
                    <span>Show quantity</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibility.showTransportation}
                      onChange={(e) =>
                        setVisibility({ ...visibility, showTransportation: e.target.checked })
                      }
                      className="rounded text-[#FFD600] accent-[#FFD600]"
                    />
                    <span>Show transport mode</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibility.showEstimatedDelivery}
                      onChange={(e) =>
                        setVisibility({ ...visibility, showEstimatedDelivery: e.target.checked })
                      }
                      className="rounded text-[#FFD600] accent-[#FFD600]"
                    />
                    <span>Show estimated delivery</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibility.showTrackingHistory}
                      onChange={(e) =>
                        setVisibility({ ...visibility, showTrackingHistory: e.target.checked })
                      }
                      className="rounded text-[#FFD600] accent-[#FFD600]"
                    />
                    <span>Show tracking history</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2937]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#FFD600] hover:bg-[#E6C200] text-black font-bold flex items-center gap-1.5 shadow-md shadow-[#FFD600]/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
