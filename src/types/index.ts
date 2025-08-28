export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'client' | 'admin' | 'super_admin';
  admin_color?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  client_id: string;
  client_name: string;
  email: string;
  phone_number: string;
  event_date: string;
  time_slot: string;
  facility: string;
  package: string;
  special_requests?: string;
  status: 'inquiry' | 'confirmed' | 'cleared';
  assigned_admin_id?: string;
  total_spend?: number;
  receipts_uploaded: boolean;
  receipts_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Admin extends User {
  role: 'admin' | 'super_admin';
  admin_color: string;
  conversion_stats?: {
    inquiries_assigned: number;
    confirmed_bookings: number;
    conversion_rate: number;
    avg_response_time: number;
  };
}

export interface CalendarEvent {
  id: string;
  booking_id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  status: 'inquiry' | 'confirmed' | 'cleared';
  admin_name?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'booking_inquiry' | 'booking_confirmed' | 'booking_cleared' | 'assignment';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}