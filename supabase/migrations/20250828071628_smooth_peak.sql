/*
  # Create Booking System Schema

  1. New Tables
    - `profiles` - User profiles with role-based access
    - `bookings` - Event booking inquiries and confirmations
    - `notifications` - System notifications for users

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Clients can only see their own data
    - Admins can see assigned bookings
    - Super admins have full access

  3. Functions
    - `get_admin_conversion_stats` - Calculate admin performance metrics
    - Triggers for automatic notification creation
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin', 'super_admin')),
  admin_color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  email text NOT NULL,
  phone_number text NOT NULL,
  event_date date NOT NULL,
  time_slot text NOT NULL,
  facility text NOT NULL,
  package text NOT NULL,
  special_requests text,
  status text NOT NULL DEFAULT 'inquiry' CHECK (status IN ('inquiry', 'confirmed', 'cleared')),
  assigned_admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  total_spend decimal(10,2),
  receipts_uploaded boolean DEFAULT false,
  receipts_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('booking_inquiry', 'booking_confirmed', 'booking_cleared', 'assignment')),
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Super admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Bookings policies
CREATE POLICY "Clients can read their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update assigned bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    assigned_admin_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Notifications policies
CREATE POLICY "Users can read their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to calculate admin conversion stats
CREATE OR REPLACE FUNCTION get_admin_conversion_stats()
RETURNS TABLE (
  admin_id uuid,
  admin_name text,
  admin_color text,
  inquiries_assigned bigint,
  confirmed_bookings bigint,
  conversion_rate numeric,
  avg_response_time numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as admin_id,
    p.name as admin_name,
    p.admin_color,
    COUNT(b.id) FILTER (WHERE b.status = 'inquiry') as inquiries_assigned,
    COUNT(b.id) FILTER (WHERE b.status IN ('confirmed', 'cleared')) as confirmed_bookings,
    CASE 
      WHEN COUNT(b.id) > 0 THEN 
        ROUND((COUNT(b.id) FILTER (WHERE b.status IN ('confirmed', 'cleared'))::numeric / COUNT(b.id)::numeric) * 100, 1)
      ELSE 0
    END as conversion_rate,
    COALESCE(AVG(EXTRACT(EPOCH FROM (b.updated_at - b.created_at)) / 3600), 0)::numeric as avg_response_time
  FROM profiles p
  LEFT JOIN bookings b ON p.id = b.assigned_admin_id
  WHERE p.role = 'admin'
  GROUP BY p.id, p.name, p.admin_color;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_admin ON bookings(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_date ON bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);