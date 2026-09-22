export type ShipmentStatus =
  | 'Shipment Created'
  | 'Processing'
  | 'In Transit'
  | 'Out for Delivery'
  | 'Delivered';

export type TransportationMethod = 'Road' | 'Air' | 'Sea' | 'Other';

export interface SenderInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
}

export interface ReceiverInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
}

export interface ProductInfo {
  name: string;
  description: string;
  quantity: number;
  weight?: string;
  length?: string;
  width?: string;
}

export interface CustomerVisibilitySettings {
  // Sender info controls
  showSenderName: boolean;
  showSenderAddress: boolean;
  showSenderEmail: boolean;
  showSenderPhone: boolean;
  
  // Receiver info controls
  showReceiverName: boolean;
  showReceiverAddress: boolean;
  showReceiverEmail: boolean;
  showReceiverPhone: boolean;
  
  // Shipment info controls
  showProduct: boolean;
  showProductDescription: boolean;
  showQuantity: boolean;
  showTransportation: boolean;
  showDepartureDate: boolean;
  showEstimatedDelivery: boolean;
  showTrackingHistory: boolean;
  showWeight?: boolean;
  showDimensions?: boolean;
}

export interface TrackingEvent {
  id: string;
  status: ShipmentStatus;
  timestamp: string;
  note?: string;
  location?: string;
}

export interface ShipmentRecord {
  id: string;
  trackingCode: string; // Exactly 11 characters alphanumeric, e.g. 3B8R55K2W9T, 8F2K91M7Q4Z
  sender: SenderInfo;
  receiver: ReceiverInfo;
  product: ProductInfo;
  transportation: TransportationMethod;
  departureDate: string;
  estimatedDelivery: string;
  status: ShipmentStatus;
  visibility: CustomerVisibilitySettings;
  history: TrackingEvent[];
  createdAt: string;
  updatedAt: string;
  weight?: string;
  length?: string;
  width?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export type ActiveTab = 'dashboard' | 'create' | 'shipments' | 'tracking' | 'settings';
