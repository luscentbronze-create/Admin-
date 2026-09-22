import {
  ShipmentRecord,
  ShipmentStatus,
  TransportationMethod,
  CustomerVisibilitySettings,
  TrackingEvent,
  AdminUser,
} from '../types';
import { supabaseService, DbOpResult } from './supabase';

const STORAGE_KEY_SHIPMENTS = 'swiftship_admin_shipments_v1';
const STORAGE_KEY_AUTH = 'swiftship_admin_auth_v1';
const STORAGE_KEY_SESSION = 'swiftship_admin_session_v1';
const STORAGE_KEY_REMEMBER = 'swiftship_admin_remember_v1';
const STORAGE_KEY_REGISTERED_USERS = 'swiftship_registered_users_v1';

export interface RegisteredAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt: string;
}

type ShipmentSubscriber = (shipments: ShipmentRecord[]) => void;
const subscribers: Set<ShipmentSubscriber> = new Set();

export const DEFAULT_VISIBILITY: CustomerVisibilitySettings = {
  showSenderName: true,
  showSenderAddress: false,
  showSenderEmail: false,
  showSenderPhone: false,
  showReceiverName: true,
  showReceiverAddress: false,
  showReceiverEmail: false,
  showReceiverPhone: false,
  showProduct: true,
  showProductDescription: true,
  showQuantity: true,
  showTransportation: true,
  showDepartureDate: true,
  showEstimatedDelivery: true,
  showTrackingHistory: true,
};

// Generates an exact 11-character alphanumeric tracking code (e.g. 3B8R55K2W9T, 8F2K91M7Q4Z)
// Contains uppercase letters (A-Z) and digits (0-9), exactly 11 characters, and strictly unique
export function generateTrackingCode(existingCodes: Set<string>): string {
  // Alphanumeric character sets: uppercase letters and numbers
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const allChars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

  let attempts = 0;
  while (attempts < 1000) {
    attempts++;
    const chars: string[] = [];

    // Ensure a balanced alphanumeric mix with both letters and numbers
    // 3 guaranteed digits
    for (let i = 0; i < 3; i++) {
      chars.push(digits[Math.floor(Math.random() * digits.length)]);
    }
    // 3 guaranteed letters
    for (let i = 0; i < 3; i++) {
      chars.push(letters[Math.floor(Math.random() * letters.length)]);
    }
    // 5 remaining random alphanumeric characters (total = 11)
    for (let i = 0; i < 5; i++) {
      chars.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }

    // Fisher-Yates shuffle to distribute letters and digits throughout all 11 positions
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = chars[i];
      chars[i] = chars[j];
      chars[j] = temp;
    }

    const result = chars.join('');

    // Must be exactly 11 characters, strictly alphanumeric, and unique
    if (result.length === 11 && /^[A-Z0-9]{11}$/.test(result) && !existingCodes.has(result)) {
      return result;
    }
  }

// Fallback: 11-character alphanumeric string
  const base = (Date.now().toString(36) + Math.random().toString(36).substring(2)).toUpperCase();
  const cleanBase = base.replace(/[^A-Z0-9]/g, '');
  return cleanBase.slice(0, 11).padEnd(11, '8');
}

// Generate valid RFC4122 v4 UUID compatible with PostgreSQL uuid type
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const DEFAULT_ADMIN: AdminUser = {
  id: 'admin_1',
  name: 'John Admin',
  email: 'admin@swiftship.com',
  role: 'Administrator',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

// Database Service for persistent storage
export const storageService = {
  // --- SHIPMENTS ---
  getShipments(): ShipmentRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SHIPMENTS);
      if (!data) {
        return [];
      }
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // Clean out legacy mock shipments if found in localStorage
        const hasLegacyMock = parsed.some(
          (s: any) => s && typeof s.id === 'string' && s.id.startsWith('shp_') && (!s.id.includes('-') || s.id.length < 20)
        );
        if (hasLegacyMock) {
          localStorage.removeItem(STORAGE_KEY_SHIPMENTS);
          return [];
        }
        return parsed;
      }
      return [];
    } catch (e) {
      console.error('Failed to read shipments from localStorage:', e);
      return [];
    }
  },

  // Subscribe to live database updates
  subscribe(callback: ShipmentSubscriber): () => void {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  },

  notifySubscribers(shipments: ShipmentRecord[]): void {
    subscribers.forEach((cb) => {
      try {
        cb(shipments);
      } catch (err) {
        console.error('Subscriber error:', err);
      }
    });
  },

  // Asynchronously synchronize with Supabase database without overwriting unsynced local creations
  async syncWithSupabase(): Promise<ShipmentRecord[]> {
    if (!supabaseService.isConfigured()) {
      return this.getShipments();
    }

    try {
      // Pull real records directly from the database
      const remoteShipments = await supabaseService.fetchAllShipments();
      const localShipments = this.getShipments();

      const remoteIds = new Set(remoteShipments.map((s) => s.id));
      const remoteCodes = new Set(remoteShipments.map((s) => s.trackingCode.toUpperCase()));

      // Identify newly created local shipments that are not yet in Supabase
      const unsynced = localShipments.filter(
        (local) => !remoteIds.has(local.id) && !remoteCodes.has(local.trackingCode.toUpperCase())
      );

      // Attempt to push any unsynced local shipments to Supabase
      if (unsynced.length > 0) {
        for (const pending of unsynced) {
          const res = await supabaseService.insertShipment(pending);
          if (res.success) {
            remoteShipments.unshift(pending);
            remoteIds.add(pending.id);
            remoteCodes.add(pending.trackingCode.toUpperCase());
          }
        }
      }

      // Merge: remote shipments plus any unsynced local shipments so local data is NEVER lost
      const combined = [...remoteShipments];
      for (const p of unsynced) {
        if (!remoteIds.has(p.id) && !remoteCodes.has(p.trackingCode.toUpperCase())) {
          combined.push(p);
        }
      }

      this.saveShipments(combined);
      this.notifySubscribers(combined);
      return combined;
    } catch (err) {
      console.warn('Sync with Supabase encountered issue:', err);
    }
    return this.getShipments();
  },

  // Push all local shipments that have not yet been stored in Supabase
  async pushLocalShipmentsToDatabase(): Promise<{
    total: number;
    synced: number;
    failed: number;
    rlsBlocked: boolean;
    errors: string[];
  }> {
    if (!supabaseService.isConfigured()) {
      return { total: 0, synced: 0, failed: 0, rlsBlocked: false, errors: ['Supabase not configured'] };
    }

    const localShipments = this.getShipments();
    const remoteShipments = await supabaseService.fetchAllShipments();
    const remoteIds = new Set(remoteShipments.map((s) => s.id));
    const remoteCodes = new Set(remoteShipments.map((s) => s.trackingCode.toUpperCase()));

    const missing = localShipments.filter(
      (s) => !remoteIds.has(s.id) && !remoteCodes.has(s.trackingCode.toUpperCase())
    );

    let synced = 0;
    let failed = 0;
    let rlsBlocked = false;
    const errors: string[] = [];

    for (const shipment of missing) {
      const res = await supabaseService.insertShipment(shipment);
      if (res.success) {
        synced++;
      } else {
        failed++;
        if (res.isRlsError) rlsBlocked = true;
        if (res.error && !errors.includes(res.error)) errors.push(res.error);
      }
    }

    return {
      total: missing.length,
      synced,
      failed,
      rlsBlocked,
      errors,
    };
  },

  saveShipments(shipments: ShipmentRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_SHIPMENTS, JSON.stringify(shipments));
    } catch (e) {
      console.error('Failed to save shipments to localStorage:', e);
    }
  },

  getShipmentByTrackingCode(trackingCode: string): ShipmentRecord | undefined {
    const cleanCode = trackingCode.trim().toUpperCase();
    const shipments = this.getShipments();
    return shipments.find((s) => s.trackingCode.toUpperCase() === cleanCode);
  },

  getShipmentById(id: string): ShipmentRecord | undefined {
    const shipments = this.getShipments();
    return shipments.find((s) => s.id === id);
  },

  // Generates a verified unique 11-character alphanumeric code
  getNewUniqueTrackingCode(): string {
    const shipments = this.getShipments();
    const existingCodes = new Set(shipments.map((s) => s.trackingCode.toUpperCase()));
    return generateTrackingCode(existingCodes);
  },

  // Creates a new shipment record, generates an 11-char tracking code, and saves
  createShipment(data: {
    sender: ShipmentRecord['sender'];
    receiver: ShipmentRecord['receiver'];
    product: ShipmentRecord['product'];
    transportation: TransportationMethod;
    departureDate: string;
    estimatedDelivery: string;
    initialStatus?: ShipmentStatus;
    visibility: CustomerVisibilitySettings;
    initialNote?: string;
    customTrackingCode?: string;
  }): { shipment: ShipmentRecord; trackingCode: string } {
    const shipments = this.getShipments();
    const existingCodes = new Set(shipments.map((s) => s.trackingCode.toUpperCase()));
    
    // Determine unique 11-character alphanumeric tracking code
    let trackingCode = '';
    if (data.customTrackingCode) {
      const cleaned = data.customTrackingCode.trim().toUpperCase();
      if (/^[A-Z0-9]{11}$/.test(cleaned) && !existingCodes.has(cleaned)) {
        trackingCode = cleaned;
      }
    }
    if (!trackingCode) {
      trackingCode = generateTrackingCode(existingCodes);
    }
    const now = new Date().toISOString();
    const status: ShipmentStatus = data.initialStatus || 'Shipment Created';

    const initialHistory: TrackingEvent = {
      id: generateUUID(),
      status,
      timestamp: now,
      note: data.initialNote || 'Shipment record created and tracking code registered by administrator',
      location: data.sender.address ? data.sender.address.split(',')[0] : 'Origin Facility',
    };

    const newRecord: ShipmentRecord = {
      id: generateUUID(),
      trackingCode,
      sender: data.sender,
      receiver: data.receiver,
      product: data.product,
      transportation: data.transportation,
      departureDate: data.departureDate,
      estimatedDelivery: data.estimatedDelivery,
      status,
      visibility: data.visibility,
      history: [initialHistory],
      createdAt: now,
      updatedAt: now,
    };

    shipments.unshift(newRecord);
    this.saveShipments(shipments);
    this.notifySubscribers(shipments);

    // Concurrently persist to Supabase if configured
    if (supabaseService.isConfigured()) {
      supabaseService.insertShipment(newRecord).catch((err) => {
        console.warn('Background Supabase insert error:', err);
      });
    }

    return { shipment: newRecord, trackingCode };
  },

  // Async version of createShipment that returns database insert outcome
  async createShipmentAsync(data: {
    sender: ShipmentRecord['sender'];
    receiver: ShipmentRecord['receiver'];
    product: ShipmentRecord['product'];
    transportation: TransportationMethod;
    departureDate: string;
    estimatedDelivery: string;
    initialStatus?: ShipmentStatus;
    visibility: CustomerVisibilitySettings;
    initialNote?: string;
    customTrackingCode?: string;
  }): Promise<{ shipment: ShipmentRecord; trackingCode: string; dbResult?: DbOpResult }> {
    const res = this.createShipment(data);
    let dbResult: DbOpResult | undefined;

    if (supabaseService.isConfigured()) {
      dbResult = await supabaseService.insertShipment(res.shipment);
    }

    return { ...res, dbResult };
  },

  // Updates an existing shipment while strictly maintaining the original tracking code!
  updateShipment(
    id: string,
    updates: Partial<Omit<ShipmentRecord, 'id' | 'trackingCode' | 'createdAt'>>
  ): ShipmentRecord | null {
    const shipments = this.getShipments();
    const index = shipments.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const current = shipments[index];
    const now = new Date().toISOString();

    const updatedRecord: ShipmentRecord = {
      ...current,
      ...updates,
      id: current.id, // Immutable
      trackingCode: current.trackingCode, // Permanent 11-character code is NEVER overwritten
      createdAt: current.createdAt,
      updatedAt: now,
    };

    shipments[index] = updatedRecord;
    this.saveShipments(shipments);
    this.notifySubscribers(shipments);

    // Concurrently persist update to Supabase
    if (supabaseService.isConfigured()) {
      supabaseService.updateShipment(updatedRecord).catch((err) => {
        console.warn('Background Supabase update error:', err);
      });
    }

    return updatedRecord;
  },

  // Updates shipment status and records a permanent history event
  updateShipmentStatus(
    id: string,
    newStatus: ShipmentStatus,
    note?: string,
    location?: string
  ): ShipmentRecord | null {
    const shipments = this.getShipments();
    const index = shipments.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const current = shipments[index];
    const now = new Date().toISOString();

    const newEvent: TrackingEvent = {
      id: generateUUID(),
      status: newStatus,
      timestamp: now,
      note: note || `Status updated to ${newStatus}`,
      location: location || 'Transit Facility',
    };

    const updatedRecord: ShipmentRecord = {
      ...current,
      status: newStatus,
      history: [newEvent, ...current.history],
      updatedAt: now,
    };

    shipments[index] = updatedRecord;
    this.saveShipments(shipments);
    this.notifySubscribers(shipments);

    // Concurrently persist status update and event to Supabase
    if (supabaseService.isConfigured()) {
      supabaseService.updateShipmentStatus(id, newStatus, newEvent).catch((err) => {
        console.warn('Background Supabase status update error:', err);
      });
    }

    return updatedRecord;
  },

  deleteShipment(id: string): boolean {
    const shipments = this.getShipments();
    const filtered = shipments.filter((s) => s.id !== id);
    if (filtered.length === shipments.length) return false;
    this.saveShipments(filtered);
    this.notifySubscribers(filtered);

    // Concurrently delete from Supabase
    if (supabaseService.isConfigured()) {
      supabaseService.deleteShipment(id).catch((err) => {
        console.warn('Background Supabase delete error:', err);
      });
    }

    return true;
  },

  // Reset database back to default initial records
  resetToDefaults(): void {
    localStorage.setItem(STORAGE_KEY_SHIPMENTS, JSON.stringify([]));
    this.notifySubscribers([]);
  },

  // --- CUSTOMER-FACING QUERY (Section 4, 15, 16, 19) ---
  // Retrieves a shipment strictly by exact 11-character tracking code.
  // Filters out any fields that the administrator has marked as hidden!
  getPublicTrackingInfo(trackingCode: string): {
    found: boolean;
    data?: {
      trackingCode: string;
      status: ShipmentStatus;
      updatedAt: string;
      departureDate?: string;
      estimatedDelivery?: string;
      transportation?: TransportationMethod;
      product?: {
        name?: string;
        description?: string;
        quantity?: number;
      };
      sender?: {
        name?: string;
        address?: string;
        email?: string;
        phone?: string;
      };
      receiver?: {
        name?: string;
        address?: string;
        email?: string;
        phone?: string;
      };
      history?: TrackingEvent[];
    };
  } {
    const cleanCode = trackingCode.trim().toUpperCase();
    const shipment = this.getShipmentByTrackingCode(cleanCode);

    if (!shipment) {
      return { found: false };
    }

    const { visibility } = shipment;

    // Apply visibility gates
    const senderData = {
      name: visibility.showSenderName ? shipment.sender.name : undefined,
      address: visibility.showSenderAddress ? shipment.sender.address : undefined,
      email: visibility.showSenderEmail ? shipment.sender.email : undefined,
      phone: visibility.showSenderPhone ? shipment.sender.phone : undefined,
    };

    const receiverData = {
      name: visibility.showReceiverName ? shipment.receiver.name : undefined,
      address: visibility.showReceiverAddress ? shipment.receiver.address : undefined,
      email: visibility.showReceiverEmail ? shipment.receiver.email : undefined,
      phone: visibility.showReceiverPhone ? shipment.receiver.phone : undefined,
    };

    const productData = {
      name: visibility.showProduct ? shipment.product.name : undefined,
      description: visibility.showProductDescription ? shipment.product.description : undefined,
      quantity: visibility.showQuantity ? shipment.product.quantity : undefined,
    };

    return {
      found: true,
      data: {
        trackingCode: shipment.trackingCode,
        status: shipment.status,
        updatedAt: shipment.updatedAt,
        departureDate: visibility.showDepartureDate ? shipment.departureDate : undefined,
        estimatedDelivery: visibility.showEstimatedDelivery ? shipment.estimatedDelivery : undefined,
        transportation: visibility.showTransportation ? shipment.transportation : undefined,
        product: productData,
        sender: senderData,
        receiver: receiverData,
        history: visibility.showTrackingHistory ? shipment.history : undefined,
      },
    };
  },

  // --- AUTHENTICATION SERVICE ---
  getRegisteredUsers(): RegisteredAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_REGISTERED_USERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveRegisteredUsers(users: RegisteredAccount[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save registered users to localStorage:', e);
    }
  },

  getCurrentUser(): AdminUser | null {
    try {
      // 1. Check session storage (active browser session)
      const sessionData = sessionStorage.getItem(STORAGE_KEY_SESSION);
      if (sessionData) {
        if (sessionData === 'LOGGED_OUT') return null;
        return JSON.parse(sessionData);
      }

      // 2. Check persistent storage ONLY if remember-me was actively chosen
      const isRemembered = localStorage.getItem(STORAGE_KEY_REMEMBER) === 'true';
      if (isRemembered) {
        const localData = localStorage.getItem(STORAGE_KEY_AUTH);
        if (localData && localData !== 'LOGGED_OUT') {
          return JSON.parse(localData);
        }
      }

      return null;
    } catch {
      return null;
    }
  },

  async signUp(
    name: string,
    email: string,
    password: string,
    rememberMe = true
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Please enter your full name (minimum 2 characters).' };
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    // Check if email already registered locally
    const existing = this.getRegisteredUsers();
    if (existing.some((u) => u.email.toLowerCase() === cleanEmail) || cleanEmail === DEFAULT_ADMIN.email.toLowerCase()) {
      return { success: false, error: 'An account with this email address already exists. Please sign in.' };
    }

    let createdId = generateUUID();

    // If Supabase is connected, require and verify database account creation
    if (supabaseService.isConfigured()) {
      try {
        const dbResult = await supabaseService.registerAdmin(cleanName, cleanEmail, password);
        if (!dbResult.success) {
          if (dbResult.isRlsError) {
            return {
              success: false,
              error: `Database RLS Policy Error: Supabase blocked inserting into 'admin_users' because Row Level Security (RLS) is enabled without an INSERT policy. In Supabase Dashboard SQL Editor, run the RLS policy script or disable RLS for admin_users.`,
            };
          }
          return {
            success: false,
            error: dbResult.error || 'Failed to create administrator account in Supabase database.',
          };
        } else if (dbResult.user) {
          createdId = dbResult.user.id;
        }
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || 'Database connection error during account creation.',
        };
      }
    }

    const newAccount: RegisteredAccount = {
      id: createdId,
      name: cleanName,
      email: cleanEmail,
      password,
      role: 'Administrator',
      createdAt: new Date().toISOString(),
    };

    existing.push(newAccount);
    this.saveRegisteredUsers(existing);

    const activeUser: AdminUser = {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      role: newAccount.role,
    };

    // Store active session
    sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(activeUser));
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(activeUser));
      localStorage.setItem(STORAGE_KEY_REMEMBER, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
      localStorage.removeItem(STORAGE_KEY_REMEMBER);
    }

    return { success: true, user: activeUser };
  },

  async login(
    email: string,
    password: string,
    rememberMe = true
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid administrator email address.' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const persistSession = (user: AdminUser) => {
      sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEY_REMEMBER, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH);
        localStorage.removeItem(STORAGE_KEY_REMEMBER);
      }
    };

    // 1. Check Supabase admin_users if connected
    if (supabaseService.isConfigured()) {
      const dbResult = await supabaseService.authenticateAdmin(cleanEmail, password);
      if (dbResult.success && dbResult.user) {
        persistSession(dbResult.user);
        return dbResult;
      }
      // If error specifically states wrong password, return it
      if (dbResult.error && dbResult.error.toLowerCase().includes('password')) {
        return dbResult;
      }
    }

    // 2. Check registered accounts
    const registered = this.getRegisteredUsers();
    const localUser = registered.find((u) => u.email.toLowerCase() === cleanEmail);
    if (localUser) {
      if (localUser.password !== password) {
        return {
          success: false,
          error: 'Incorrect password. Please verify your credentials and try again.',
        };
      }

      const user: AdminUser = {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        role: localUser.role,
      };

      persistSession(user);
      return { success: true, user };
    }

    // 3. Default demo administrator credentials
    if (cleanEmail === DEFAULT_ADMIN.email.toLowerCase()) {
      if (password !== 'admin123456') {
        return {
          success: false,
          error: 'Incorrect password for admin@swiftship.com. (Default password: admin123456)',
        };
      }
      const user = { ...DEFAULT_ADMIN };
      persistSession(user);
      return { success: true, user };
    }

    // 4. If account doesn't exist
    return {
      success: false,
      error: 'No account found with this email. Please click "Create Account" above to sign up.',
    };
  },

  logout(): void {
    sessionStorage.removeItem(STORAGE_KEY_SESSION);
    sessionStorage.setItem(STORAGE_KEY_SESSION, 'LOGGED_OUT');
    localStorage.removeItem(STORAGE_KEY_AUTH);
    localStorage.removeItem(STORAGE_KEY_REMEMBER);
  },
};
