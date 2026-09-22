import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ShipmentRecord,
  ShipmentStatus,
  TransportationMethod,
  CustomerVisibilitySettings,
  TrackingEvent,
  AdminUser,
} from '../types';
import { DEFAULT_VISIBILITY } from './storage';

// Safe environment variable retrieval
const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return String(import.meta.env[key]).trim();
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return String(process.env[key]).trim();
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    client = null;
  }
}

export const getSupabaseClient = (): SupabaseClient | null => client;

export const isSupabaseConnected = (): boolean => {
  return Boolean(client && supabaseUrl && supabaseAnonKey);
};

export const getSupabaseConfigInfo = () => {
  return {
    isConfigured: isSupabaseConnected(),
    url: supabaseUrl ? supabaseUrl.replace(/(https:\/\/[^.]+).*/, '$1.supabase.co') : null,
    tables: [
      'admin_audit_logs',
      'admin_users',
      'contact_inquiries',
      'shipment_details',
      'shipment_receivers',
      'shipment_senders',
      'shipment_visibilities',
      'shipments',
      'tracking_events',
    ],
  };
};

// Helper to sanitize/pick column values for flexible camelCase / snake_case table definitions
function getVal<T>(row: Record<string, any> | undefined | null, ...keys: string[]): T | undefined {
  if (!row) return undefined;
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null) return row[k] as T;
  }
  return undefined;
}

export interface DbOpResult {
  success: boolean;
  error?: string;
  isRlsError?: boolean;
}

export const SUPABASE_RLS_FIX_SQL = `-- SwiftShip Logistics - Supabase Row-Level Security (RLS) Policy Fix
-- Run this in your Supabase Dashboard -> SQL Editor (New query -> Run)

-- 1. Shipments Table
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for shipments" ON public.shipments;
CREATE POLICY "Allow all for shipments" ON public.shipments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. Shipment Senders Table
ALTER TABLE public.shipment_senders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for shipment_senders" ON public.shipment_senders;
CREATE POLICY "Allow all for shipment_senders" ON public.shipment_senders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 3. Shipment Receivers Table
ALTER TABLE public.shipment_receivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for shipment_receivers" ON public.shipment_receivers;
CREATE POLICY "Allow all for shipment_receivers" ON public.shipment_receivers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. Shipment Details Table
ALTER TABLE public.shipment_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for shipment_details" ON public.shipment_details;
CREATE POLICY "Allow all for shipment_details" ON public.shipment_details FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. Shipment Visibilities Table
ALTER TABLE public.shipment_visibilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for shipment_visibilities" ON public.shipment_visibilities;
CREATE POLICY "Allow all for shipment_visibilities" ON public.shipment_visibilities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 6. Tracking Events Table
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for tracking_events" ON public.tracking_events;
CREATE POLICY "Allow all for tracking_events" ON public.tracking_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 7. Audit Logs Table
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for admin_audit_logs" ON public.admin_audit_logs;
CREATE POLICY "Allow all for admin_audit_logs" ON public.admin_audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 8. Admin Users Table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for admin_users" ON public.admin_users;
CREATE POLICY "Allow all for admin_users" ON public.admin_users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 9. Contact Inquiries Table
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for contact_inquiries" ON public.contact_inquiries;
CREATE POLICY "Allow all for contact_inquiries" ON public.contact_inquiries FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
`;

export const supabaseService = {
  isConfigured(): boolean {
    return isSupabaseConnected();
  },

  getClient(): SupabaseClient | null {
    return client;
  },

  // Test database connection by pinging the shipments table and probing write permissions
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    tableCount?: number;
    canWrite?: boolean;
    isRlsBlocked?: boolean;
    writeMessage?: string;
  }> {
    if (!client) {
      return {
        success: false,
        message: 'Supabase URL or Anon Key is not configured yet in environment settings.',
      };
    }

    try {
      const { error } = await client.from('shipments').select('id').limit(1);
      if (error) {
        // Try fallback table
        const { error: usersError } = await client.from('admin_users').select('id').limit(1);
        if (usersError) {
          return { success: false, message: error.message || usersError.message };
        }
      }

      // Test write permission via audit logs or shipments table to detect RLS blocking
      let canWrite = true;
      let isRlsBlocked = false;
      let writeMessage = 'Database read and write permissions verified.';

      const { error: probeError } = await client.from('admin_audit_logs').insert([
        {
          action: 'RLS_PROBE_CHECK',
          details: 'Automatic permissions validation',
          created_at: new Date().toISOString(),
        },
      ]);

      if (probeError) {
        canWrite = false;
        if (
          probeError.code === '42501' ||
          probeError.message?.toLowerCase().includes('row-level security') ||
          probeError.message?.toLowerCase().includes('policy')
        ) {
          isRlsBlocked = true;
          writeMessage = 'Row-Level Security (RLS) is active and blocking new shipment inserts. Run the SQL policy fix script.';
        } else {
          writeMessage = `Write check notice: ${probeError.message}`;
        }
      } else {
        // Clean up probe
        try {
          await client.from('admin_audit_logs').delete().eq('action', 'RLS_PROBE_CHECK');
        } catch {
          // Non-blocking
        }
      }

      return {
        success: true,
        message: isRlsBlocked
          ? 'Connected to Supabase, but table writes are currently blocked by Row-Level Security (RLS).'
          : 'Successfully connected to Supabase database (Read & Write OK)!',
        tableCount: 9,
        canWrite,
        isRlsBlocked,
        writeMessage,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Error connecting to Supabase',
      };
    }
  },

  // Authenticate administrator against admin_users table and Supabase Auth
  async authenticateAdmin(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    if (!client) {
      return { success: false, error: 'Database client not connected.' };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Try Supabase Auth first (verifies password securely against auth.users)
      let authUserId: string | undefined;
      try {
        const { data: authData, error: authErr } = await client.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });
        if (authData?.user) {
          authUserId = authData.user.id;
        }
      } catch (authEx) {
        // Continue to check admin_users table
      }

      // 2. Query admin_users table
      const { data, error } = await client
        .from('admin_users')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (error) {
        console.warn('Supabase admin lookup notice:', error.message);
      }

      if (data) {
        // Check password if stored in table
        const storedPassword = data.password || data.password_hash;
        if (storedPassword && storedPassword !== password) {
          return { success: false, error: 'Invalid password for this administrator account.' };
        }

        // Update last_login_at timestamp
        try {
          await client
            .from('admin_users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', data.id);
        } catch {
          // Non-blocking
        }

        return {
          success: true,
          user: {
            id: String(data.id || authUserId || `usr_${Date.now()}`),
            name: data.full_name || data.name || cleanEmail.split('@')[0],
            email: data.email || cleanEmail,
            role: data.role || 'Administrator',
            avatar: data.avatar || data.avatar_url,
          },
        };
      }

      // If user was authenticated in Supabase Auth but not in admin_users table yet
      if (authUserId) {
        return {
          success: true,
          user: {
            id: authUserId,
            name: cleanEmail.split('@')[0],
            email: cleanEmail,
            role: 'Administrator',
          },
        };
      }

      return { success: false, error: 'Administrator account not found in database. Please check your credentials or sign up.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Authentication error' };
    }
  },

  // Register new administrator in admin_users table and Supabase Auth
  async registerAdmin(
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: AdminUser; error?: string; isRlsError?: boolean }> {
    if (!client) {
      return { success: false, error: 'Database client not connected.' };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();

      // 1. Register with Supabase Auth (auth.users)
      let authUserId: string | undefined;
      try {
        const { data: authData, error: authError } = await client.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              full_name: cleanName,
            },
          },
        });

        if (authError && !authError.message.includes('already registered')) {
          console.warn('Supabase Auth signUp note:', authError.message);
        }

        if (authData?.user?.id) {
          authUserId = authData.user.id;
        }
      } catch (authEx) {
        console.warn('Supabase Auth signUp exception:', authEx);
      }

      // 2. Check if user already exists in public.admin_users
      const { data: existing } = await client
        .from('admin_users')
        .select('id, email, full_name')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (existing) {
        return {
          success: false,
          error: 'An administrator account with this email already exists in the database. Please switch to Sign In.',
        };
      }

      // 3. Insert into public.admin_users
      // Supports both schemas (with or without password, role, name/full_name)
      const now = new Date().toISOString();
      const insertPayload: Record<string, any> = {
        email: cleanEmail,
        full_name: cleanName,
        name: cleanName,
        password: password,
        role: 'Administrator',
        is_active: true,
        created_at: now,
        last_login_at: now,
      };

      if (authUserId) {
        insertPayload.auth_user_id = authUserId;
      }

      // Attempt insert; if any column is not yet added in database, strip and retry
      let currentPayload = { ...insertPayload };
      let insertResult = await client
        .from('admin_users')
        .insert([currentPayload])
        .select()
        .maybeSingle();

      while (insertResult.error && insertResult.error.code === 'PGRST204') {
        const match = insertResult.error.message.match(/Could not find the '([^']+)' column/);
        if (match && match[1] && currentPayload[match[1]] !== undefined) {
          delete currentPayload[match[1]];
          insertResult = await client
            .from('admin_users')
            .insert([currentPayload])
            .select()
            .maybeSingle();
        } else {
          break;
        }
      }

      const { data, error } = insertResult;

      if (error) {
        console.warn('Supabase admin_users insert error:', error);
        const isRls = error.code === '42501' || error.message?.toLowerCase().includes('row-level security');
        return {
          success: false,
          error: error.message,
          isRlsError: isRls,
        };
      }

      const createdUser = data || currentPayload;
      return {
        success: true,
        user: {
          id: String(createdUser.id || authUserId || `usr_${Date.now()}`),
          name: createdUser.full_name || createdUser.name || cleanName,
          email: createdUser.email || cleanEmail,
          role: createdUser.role || 'Administrator',
        },
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to register account with database.' };
    }
  },

  // Fetch all shipments with all relational data joined
  async fetchAllShipments(): Promise<ShipmentRecord[]> {
    if (!client) return [];

    try {
      // 1. Fetch main shipments
      const { data: shipmentsData, error: sErr } = await client
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });

      if (sErr || !shipmentsData) {
        console.warn('Supabase fetch shipments error:', sErr);
        return [];
      }

      if (shipmentsData.length === 0) {
        return [];
      }

      const shipmentIds = shipmentsData.map((s: any) => s.id);

      // 2. Fetch related data concurrently
      const [
        { data: senders },
        { data: receivers },
        { data: details },
        { data: visibilities },
        { data: events },
      ] = await Promise.all([
        client.from('shipment_senders').select('*').in('shipment_id', shipmentIds),
        client.from('shipment_receivers').select('*').in('shipment_id', shipmentIds),
        client.from('shipment_details').select('*').in('shipment_id', shipmentIds),
        client.from('shipment_visibilities').select('*').in('shipment_id', shipmentIds),
        client.from('tracking_events').select('*').in('shipment_id', shipmentIds).order('event_order', { ascending: true }),
      ]);

      const sendersMap = new Map((senders || []).map((s: any) => [s.shipment_id, s]));
      const receiversMap = new Map((receivers || []).map((r: any) => [r.shipment_id, r]));
      const detailsMap = new Map((details || []).map((d: any) => [d.shipment_id, d]));
      const visibilitiesMap = new Map((visibilities || []).map((v: any) => [v.shipment_id, v]));
      
      const eventsMap = new Map<string, any[]>();
      (events || []).forEach((e: any) => {
        const list = eventsMap.get(e.shipment_id) || [];
        list.push(e);
        eventsMap.set(e.shipment_id, list);
      });

      // 3. Assemble complete ShipmentRecord objects
      const records: ShipmentRecord[] = shipmentsData.map((s: any) => {
        const senderRow = sendersMap.get(s.id);
        const receiverRow = receiversMap.get(s.id);
        const detailRow = detailsMap.get(s.id);
        const visRow = visibilitiesMap.get(s.id);
        const eventRows = eventsMap.get(s.id) || [];

        const visibility: CustomerVisibilitySettings = {
          showSenderName: getVal<boolean>(visRow, 'show_sender_name', 'showSenderName') ?? DEFAULT_VISIBILITY.showSenderName,
          showSenderAddress: getVal<boolean>(visRow, 'show_sender_address', 'showSenderAddress') ?? DEFAULT_VISIBILITY.showSenderAddress,
          showSenderEmail: getVal<boolean>(visRow, 'show_sender_email', 'showSenderEmail') ?? DEFAULT_VISIBILITY.showSenderEmail,
          showSenderPhone: getVal<boolean>(visRow, 'show_sender_phone', 'showSenderPhone') ?? DEFAULT_VISIBILITY.showSenderPhone,

          showReceiverName: getVal<boolean>(visRow, 'show_receiver_name', 'showReceiverName') ?? DEFAULT_VISIBILITY.showReceiverName,
          showReceiverAddress: getVal<boolean>(visRow, 'show_receiver_address', 'showReceiverAddress') ?? DEFAULT_VISIBILITY.showReceiverAddress,
          showReceiverEmail: getVal<boolean>(visRow, 'show_receiver_email', 'showReceiverEmail') ?? DEFAULT_VISIBILITY.showReceiverEmail,
          showReceiverPhone: getVal<boolean>(visRow, 'show_receiver_phone', 'showReceiverPhone') ?? DEFAULT_VISIBILITY.showReceiverPhone,

          showProduct: getVal<boolean>(visRow, 'show_product', 'showProduct') ?? DEFAULT_VISIBILITY.showProduct,
          showProductDescription: getVal<boolean>(visRow, 'show_product_description', 'showProductDescription') ?? DEFAULT_VISIBILITY.showProductDescription,
          showQuantity: getVal<boolean>(visRow, 'show_quantity', 'showQuantity') ?? DEFAULT_VISIBILITY.showQuantity,
          showTransportation: getVal<boolean>(visRow, 'show_transportation', 'showTransportation') ?? DEFAULT_VISIBILITY.showTransportation,
          showDepartureDate: getVal<boolean>(visRow, 'show_departure_date', 'showDepartureDate') ?? DEFAULT_VISIBILITY.showDepartureDate,
          showEstimatedDelivery: getVal<boolean>(visRow, 'show_estimated_delivery', 'showEstimatedDelivery') ?? DEFAULT_VISIBILITY.showEstimatedDelivery,
          showTrackingHistory: getVal<boolean>(visRow, 'show_tracking_history', 'showTrackingHistory') ?? DEFAULT_VISIBILITY.showTrackingHistory,
        };

        const history: TrackingEvent[] = eventRows.map((e: any) => ({
          id: String(e.id),
          status: (e.status as ShipmentStatus) || 'Shipment Created',
          timestamp: e.created_at || (e.date ? `${e.date} ${e.time || ''}`.trim() : new Date().toISOString()),
          note: e.description || e.note || '',
          location: e.location || '',
        }));

        return {
          id: String(s.id),
          trackingCode: getVal<string>(s, 'tracking_code', 'trackingCode') || '',
          status: (s.status as ShipmentStatus) || 'Shipment Created',
          transportation: (getVal<TransportationMethod>(detailRow, 'transportation_method', 'transportation') || 'Road') as TransportationMethod,
          departureDate: getVal<string>(detailRow, 'departure_date', 'departureDate') || getVal<string>(s, 'departure_date', 'departureDate') || '',
          estimatedDelivery: getVal<string>(detailRow, 'estimated_delivery', 'estimatedDelivery') || getVal<string>(s, 'estimated_delivery', 'estimatedDelivery') || '',
          createdAt: getVal<string>(s, 'created_at', 'createdAt') || new Date().toISOString(),
          updatedAt: getVal<string>(s, 'updated_at', 'updatedAt') || new Date().toISOString(),
          sender: {
            name: getVal<string>(senderRow, 'name') || '',
            address: getVal<string>(senderRow, 'address') || '',
            email: getVal<string>(senderRow, 'email') || '',
            phone: getVal<string>(senderRow, 'phone') || '',
          },
          receiver: {
            name: getVal<string>(receiverRow, 'name') || '',
            address: getVal<string>(receiverRow, 'address') || '',
            email: getVal<string>(receiverRow, 'email') || '',
            phone: getVal<string>(receiverRow, 'phone') || '',
          },
          product: {
            name: getVal<string>(detailRow, 'product', 'product_name', 'name') || '',
            description: getVal<string>(detailRow, 'description') || '',
            quantity: Number(getVal<number>(detailRow, 'quantity') || 1),
          },
          visibility,
          history,
        };
      });

      return records;
    } catch (err) {
      console.error('Error fetching shipments from Supabase:', err);
      return [];
    }
  },

  // Create a new shipment and persist across all relevant Supabase tables
  async insertShipment(shipment: ShipmentRecord): Promise<DbOpResult> {
    if (!client) return { success: false, error: 'Database client not connected.' };

    try {
      // 1. Insert into shipments table (attach authenticated user if logged in)
      const { data: authData } = await client.auth.getUser().catch(() => ({ data: { user: null } }));
      const authUid = authData?.user?.id || null;

      const { error: sErr } = await client.from('shipments').insert([
        {
          id: shipment.id,
          tracking_code: shipment.trackingCode,
          status: shipment.status,
          created_by: authUid,
          created_at: shipment.createdAt,
          updated_at: shipment.updatedAt,
        },
      ]);

      if (sErr) {
        console.warn('Failed to insert into shipments:', sErr);
        const isRls =
          sErr.code === '42501' ||
          sErr.message?.toLowerCase().includes('row-level security') ||
          sErr.message?.toLowerCase().includes('policy');
        return {
          success: false,
          error: sErr.message,
          isRlsError: isRls,
        };
      }

      // 2. Insert child records in parallel
      const [senderRes, receiverRes, detailRes, visRes] = await Promise.all([
        client.from('shipment_senders').insert([
          {
            shipment_id: shipment.id,
            name: shipment.sender.name,
            address: shipment.sender.address,
            email: shipment.sender.email,
            phone: shipment.sender.phone,
          },
        ]),
        client.from('shipment_receivers').insert([
          {
            shipment_id: shipment.id,
            name: shipment.receiver.name,
            address: shipment.receiver.address,
            email: shipment.receiver.email,
            phone: shipment.receiver.phone,
          },
        ]),
        client.from('shipment_details').insert([
          {
            shipment_id: shipment.id,
            product: shipment.product.name,
            quantity: shipment.product.quantity,
            transportation_method: shipment.transportation,
            departure_date: shipment.departureDate,
            estimated_delivery: shipment.estimatedDelivery,
            origin: shipment.sender.address,
            destination: shipment.receiver.address,
          },
        ]),
        client.from('shipment_visibilities').insert([
          {
            shipment_id: shipment.id,
            show_sender_name: shipment.visibility.showSenderName,
            show_sender_address: shipment.visibility.showSenderAddress,
            show_sender_email: shipment.visibility.showSenderEmail,
            show_sender_phone: shipment.visibility.showSenderPhone,

            show_receiver_name: shipment.visibility.showReceiverName,
            show_receiver_address: shipment.visibility.showReceiverAddress,
            show_receiver_email: shipment.visibility.showReceiverEmail,
            show_receiver_phone: shipment.visibility.showReceiverPhone,

            show_product: shipment.visibility.showProduct,
            show_quantity: shipment.visibility.showQuantity,
            show_transportation: shipment.visibility.showTransportation,
            show_departure_date: shipment.visibility.showDepartureDate,
            show_estimated_delivery: shipment.visibility.showEstimatedDelivery,
          },
        ]),
      ]);

      for (const res of [senderRes, receiverRes, detailRes, visRes]) {
        if (res.error) {
          console.warn('Child table insert error:', res.error);
          const isRls =
            res.error.code === '42501' ||
            res.error.message?.toLowerCase().includes('row-level security') ||
            res.error.message?.toLowerCase().includes('policy');
          return {
            success: false,
            error: res.error.message,
            isRlsError: isRls,
          };
        }
      }

      // 6. Insert tracking event history
      if (shipment.history && shipment.history.length > 0) {
        const events = shipment.history.map((h, idx) => ({
          id: h.id,
          shipment_id: shipment.id,
          status: h.status,
          date: h.timestamp ? h.timestamp.split('T')[0] : new Date().toISOString().split('T')[0],
          time: h.timestamp ? (h.timestamp.split('T')[1] || '').substring(0, 8) || '00:00:00' : '00:00:00',
          location: h.location || '',
          description: h.note || '',
          event_order: idx + 1,
        }));
        await client.from('tracking_events').insert(events);
      }

      // 7. Record in admin_audit_logs
      try {
        await client.from('admin_audit_logs').insert([
          {
            action: 'CREATE_SHIPMENT',
            details: `Created shipment ${shipment.trackingCode} for ${shipment.product.name}`,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch {
        // Audit log is optional
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error inserting shipment into Supabase:', err);
      return {
        success: false,
        error: err?.message || 'Database insert error',
        isRlsError: err?.message?.toLowerCase().includes('row-level security'),
      };
    }
  },

  // Update shipment status and add a tracking event
  async updateShipmentStatus(
    shipmentId: string,
    newStatus: ShipmentStatus,
    event: TrackingEvent
  ): Promise<boolean> {
    if (!client) return false;

    try {
      const now = new Date().toISOString();

      // Update shipments table
      await client
        .from('shipments')
        .update({ status: newStatus, updated_at: now })
        .eq('id', shipmentId);

      // Add new event into tracking_events
      await client.from('tracking_events').insert([
        {
          id: event.id,
          shipment_id: shipmentId,
          status: event.status,
          timestamp: event.timestamp,
          note: event.note,
          location: event.location,
        },
      ]);

      // Add audit log
      await client.from('admin_audit_logs').insert([
        {
          action: 'UPDATE_STATUS',
          details: `Updated shipment ${shipmentId} status to ${newStatus}`,
          created_at: now,
        },
      ]);

      return true;
    } catch (err) {
      console.error('Error updating status in Supabase:', err);
      return false;
    }
  },

  // Update full shipment fields
  async updateShipment(shipment: ShipmentRecord): Promise<boolean> {
    if (!client) return false;

    try {
      const now = new Date().toISOString();

      // Update main shipment row
      await client
        .from('shipments')
        .update({
          status: shipment.status,
          updated_at: now,
        })
        .eq('id', shipment.id);

      // Update sender
      await client
        .from('shipment_senders')
        .update({
          name: shipment.sender.name,
          address: shipment.sender.address,
          email: shipment.sender.email,
          phone: shipment.sender.phone,
          updated_at: now,
        })
        .eq('shipment_id', shipment.id);

      // Update receiver
      await client
        .from('shipment_receivers')
        .update({
          name: shipment.receiver.name,
          address: shipment.receiver.address,
          email: shipment.receiver.email,
          phone: shipment.receiver.phone,
          updated_at: now,
        })
        .eq('shipment_id', shipment.id);

      // Update product details
      await client
        .from('shipment_details')
        .update({
          product: shipment.product.name,
          quantity: shipment.product.quantity,
          transportation_method: shipment.transportation,
          departure_date: shipment.departureDate,
          estimated_delivery: shipment.estimatedDelivery,
          origin: shipment.sender.address,
          destination: shipment.receiver.address,
          updated_at: now,
        })
        .eq('shipment_id', shipment.id);

      // Update visibility settings
      await client
        .from('shipment_visibilities')
        .update({
          show_sender_name: shipment.visibility.showSenderName,
          show_sender_address: shipment.visibility.showSenderAddress,
          show_sender_email: shipment.visibility.showSenderEmail,
          show_sender_phone: shipment.visibility.showSenderPhone,

          show_receiver_name: shipment.visibility.showReceiverName,
          show_receiver_address: shipment.visibility.showReceiverAddress,
          show_receiver_email: shipment.visibility.showReceiverEmail,
          show_receiver_phone: shipment.visibility.showReceiverPhone,

          show_product: shipment.visibility.showProduct,
          show_quantity: shipment.visibility.showQuantity,
          show_transportation: shipment.visibility.showTransportation,
          show_departure_date: shipment.visibility.showDepartureDate,
          show_estimated_delivery: shipment.visibility.showEstimatedDelivery,
          updated_at: now,
        })
        .eq('shipment_id', shipment.id);

      return true;
    } catch (err) {
      console.error('Error updating shipment in Supabase:', err);
      return false;
    }
  },

  // Delete shipment and cascading related rows
  async deleteShipment(id: string): Promise<boolean> {
    if (!client) return false;

    try {
      await Promise.all([
        client.from('shipment_senders').delete().eq('shipment_id', id),
        client.from('shipment_receivers').delete().eq('shipment_id', id),
        client.from('shipment_details').delete().eq('shipment_id', id),
        client.from('shipment_visibilities').delete().eq('shipment_id', id),
        client.from('tracking_events').delete().eq('shipment_id', id),
      ]);

      await client.from('shipments').delete().eq('id', id);

      await client.from('admin_audit_logs').insert([
        {
          action: 'DELETE_SHIPMENT',
          details: `Deleted shipment record ${id}`,
          created_at: new Date().toISOString(),
        },
      ]);

      return true;
    } catch (err) {
      console.error('Error deleting shipment from Supabase:', err);
      return false;
    }
  },

  // Fetch single shipment by tracking code for customer portal
  async getPublicTracking(trackingCode: string): Promise<ShipmentRecord | null> {
    if (!client) return null;

    try {
      const cleanCode = trackingCode.trim().toUpperCase();
      const { data: shipment, error } = await client
        .from('shipments')
        .select('*')
        .ilike('tracking_code', cleanCode)
        .maybeSingle();

      if (error || !shipment) {
        return null;
      }

      const id = shipment.id;
      const [
        { data: sender },
        { data: receiver },
        { data: detail },
        { data: visibility },
        { data: events },
      ] = await Promise.all([
        client.from('shipment_senders').select('*').eq('shipment_id', id).maybeSingle(),
        client.from('shipment_receivers').select('*').eq('shipment_id', id).maybeSingle(),
        client.from('shipment_details').select('*').eq('shipment_id', id).maybeSingle(),
        client.from('shipment_visibilities').select('*').eq('shipment_id', id).maybeSingle(),
        client.from('tracking_events').select('*').eq('shipment_id', id).order('event_order', { ascending: true }),
      ]);

      const visSettings: CustomerVisibilitySettings = {
        showSenderName: getVal<boolean>(visibility, 'show_sender_name', 'showSenderName') ?? DEFAULT_VISIBILITY.showSenderName,
        showSenderAddress: getVal<boolean>(visibility, 'show_sender_address', 'showSenderAddress') ?? DEFAULT_VISIBILITY.showSenderAddress,
        showSenderEmail: getVal<boolean>(visibility, 'show_sender_email', 'showSenderEmail') ?? DEFAULT_VISIBILITY.showSenderEmail,
        showSenderPhone: getVal<boolean>(visibility, 'show_sender_phone', 'showSenderPhone') ?? DEFAULT_VISIBILITY.showSenderPhone,

        showReceiverName: getVal<boolean>(visibility, 'show_receiver_name', 'showReceiverName') ?? DEFAULT_VISIBILITY.showReceiverName,
        showReceiverAddress: getVal<boolean>(visibility, 'show_receiver_address', 'showReceiverAddress') ?? DEFAULT_VISIBILITY.showReceiverAddress,
        showReceiverEmail: getVal<boolean>(visibility, 'show_receiver_email', 'showReceiverEmail') ?? DEFAULT_VISIBILITY.showReceiverEmail,
        showReceiverPhone: getVal<boolean>(visibility, 'show_receiver_phone', 'showReceiverPhone') ?? DEFAULT_VISIBILITY.showReceiverPhone,

        showProduct: getVal<boolean>(visibility, 'show_product', 'showProduct') ?? DEFAULT_VISIBILITY.showProduct,
        showProductDescription: getVal<boolean>(visibility, 'show_product_description', 'showProductDescription') ?? DEFAULT_VISIBILITY.showProductDescription,
        showQuantity: getVal<boolean>(visibility, 'show_quantity', 'showQuantity') ?? DEFAULT_VISIBILITY.showQuantity,
        showTransportation: getVal<boolean>(visibility, 'show_transportation', 'showTransportation') ?? DEFAULT_VISIBILITY.showTransportation,
        showDepartureDate: getVal<boolean>(visibility, 'show_departure_date', 'showDepartureDate') ?? DEFAULT_VISIBILITY.showDepartureDate,
        showEstimatedDelivery: getVal<boolean>(visibility, 'show_estimated_delivery', 'showEstimatedDelivery') ?? DEFAULT_VISIBILITY.showEstimatedDelivery,
        showTrackingHistory: getVal<boolean>(visibility, 'show_tracking_history', 'showTrackingHistory') ?? DEFAULT_VISIBILITY.showTrackingHistory,
      };

      return {
        id: String(shipment.id),
        trackingCode: getVal<string>(shipment, 'tracking_code', 'trackingCode') || cleanCode,
        status: (shipment.status as ShipmentStatus) || 'Shipment Created',
        transportation: (getVal<TransportationMethod>(detail, 'transportation_method', 'transportation') || 'Road') as TransportationMethod,
        departureDate: getVal<string>(detail, 'departure_date', 'departureDate') || getVal<string>(shipment, 'departure_date', 'departureDate') || '',
        estimatedDelivery: getVal<string>(detail, 'estimated_delivery', 'estimatedDelivery') || getVal<string>(shipment, 'estimated_delivery', 'estimatedDelivery') || '',
        createdAt: getVal<string>(shipment, 'created_at', 'createdAt') || new Date().toISOString(),
        updatedAt: getVal<string>(shipment, 'updated_at', 'updatedAt') || new Date().toISOString(),
        sender: {
          name: getVal<string>(sender, 'name') || '',
          address: getVal<string>(sender, 'address') || '',
          email: getVal<string>(sender, 'email') || '',
          phone: getVal<string>(sender, 'phone') || '',
        },
        receiver: {
          name: getVal<string>(receiver, 'name') || '',
          address: getVal<string>(receiver, 'address') || '',
          email: getVal<string>(receiver, 'email') || '',
          phone: getVal<string>(receiver, 'phone') || '',
        },
        product: {
          name: getVal<string>(detail, 'product', 'product_name', 'name') || '',
          description: getVal<string>(detail, 'description') || '',
          quantity: Number(getVal<number>(detail, 'quantity') || 1),
        },
        visibility: visSettings,
        history: (events || []).map((e: any) => ({
          id: String(e.id),
          status: e.status as ShipmentStatus,
          timestamp: e.created_at || (e.date ? `${e.date} ${e.time || ''}`.trim() : new Date().toISOString()),
          note: e.description || e.note || '',
          location: e.location || '',
        })),
      };
    } catch (err) {
      console.error('Error fetching public tracking from Supabase:', err);
      return null;
    }
  },

  // Seed sample initial shipments into Supabase if the tables are empty
  async seedInitialShipments(shipments: ShipmentRecord[]): Promise<{ count: number }> {
    if (!client) return { count: 0 };

    let inserted = 0;
    for (const shipment of shipments) {
      const res = await this.insertShipment(shipment);
      if (res.success) inserted++;
    }
    return { count: inserted };
  },
};
