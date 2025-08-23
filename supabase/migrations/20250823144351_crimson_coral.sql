/*
  # MealBridge Database Schema

  1. New Tables
    - `profiles` - User profile information with role-based access
      - `id` (uuid, references auth.users)
      - `display_name` (text)
      - `role` (enum: donor, recipient, ngo, admin)
      - `bio` (text, optional)
      - `location_lat` (numeric)
      - `location_lng` (numeric)
      - `neighborhood` (text)
      - `phone` (text, optional)
      - `reputation_score` (numeric, default 0)
      - `reputation_count` (integer, default 0)
      - `is_verified` (boolean, default false)
      - `is_banned` (boolean, default false)

    - `categories` - Food categories for donations
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text, optional)
      - `icon` (text, optional)

    - `donations` - Food donation listings
      - `id` (uuid, primary key)
      - `donor_id` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `category_id` (uuid, references categories)
      - `quantity` (text)
      - `expiry_date` (date)
      - `pickup_window_start` (timestamptz)
      - `pickup_window_end` (timestamptz)
      - `condition` (enum: sealed, open)
      - `storage_type` (enum: ambient, refrigerated, frozen)
      - `location_lat` (numeric)
      - `location_lng` (numeric)
      - `address_text` (text)
      - `status` (enum: available, reserved, picked_up, canceled, expired)
      - `images` (text array, Supabase storage URLs)
      - `is_hidden` (boolean, default false)

    - `reservations` - Donation reservation requests
      - `id` (uuid, primary key)
      - `donation_id` (uuid, references donations)
      - `recipient_id` (uuid, references profiles)
      - `status` (enum: pending, accepted, declined, completed, canceled)
      - `message` (text, optional)
      - `pickup_time` (timestamptz, optional)

    - `messages` - Chat messages between donors and recipients
      - `id` (uuid, primary key)
      - `donation_id` (uuid, references donations)
      - `sender_id` (uuid, references profiles)
      - `recipient_id` (uuid, references profiles)
      - `content` (text)
      - `is_read` (boolean, default false)

    - `ratings` - Post-pickup ratings and feedback
      - `id` (uuid, primary key)
      - `donation_id` (uuid, references donations)
      - `rater_id` (uuid, references profiles)
      - `rated_id` (uuid, references profiles)
      - `rating` (integer, 1-5)
      - `comment` (text, optional)

    - `notifications` - System notifications
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `type` (text)
      - `title` (text)
      - `message` (text)
      - `data` (jsonb, optional)
      - `is_read` (boolean, default false)
      - `is_email_sent` (boolean, default false)

    - `flags` - Content and user reports
      - `id` (uuid, primary key)
      - `reporter_id` (uuid, references profiles)
      - `target_type` (enum: donation, user)
      - `target_id` (uuid)
      - `reason` (enum: safety, expired, suspect, spam, inappropriate)
      - `description` (text, optional)
      - `status` (enum: pending, reviewed, resolved)
      - `reviewed_by` (uuid, references profiles, optional)

  2. Security
    - Enable RLS on all tables
    - Profiles: Users can read all profiles, update only their own
    - Donations: Public read access, donors can CRUD their own
    - Reservations: Users can read/write their own reservations
    - Messages: Users can read/write messages where they are sender/recipient
    - Ratings: Users can create ratings for completed donations
    - Notifications: Users can read/update only their own
    - Flags: Users can create flags, NGOs/admins can read all

  3. Functions
    - Trigger to create profile on user signup
    - Function to calculate distances using Haversine formula
    - Trigger to update reputation scores after ratings
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('donor', 'recipient', 'ngo', 'admin');
CREATE TYPE donation_status AS ENUM ('available', 'reserved', 'picked_up', 'canceled', 'expired');
CREATE TYPE item_condition AS ENUM ('sealed', 'open');
CREATE TYPE storage_type AS ENUM ('ambient', 'refrigerated', 'frozen');
CREATE TYPE reservation_status AS ENUM ('pending', 'accepted', 'declined', 'completed', 'canceled');
CREATE TYPE flag_target_type AS ENUM ('donation', 'user');
CREATE TYPE flag_reason AS ENUM ('safety', 'expired', 'suspect', 'spam', 'inappropriate');
CREATE TYPE flag_status AS ENUM ('pending', 'reviewed', 'resolved');

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  icon text,
  created_at timestamptz DEFAULT now()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  role user_role DEFAULT 'recipient',
  bio text,
  location_lat numeric,
  location_lng numeric,
  neighborhood text,
  phone text,
  reputation_score numeric DEFAULT 0,
  reputation_count integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  is_banned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category_id uuid REFERENCES categories(id) NOT NULL,
  quantity text NOT NULL,
  expiry_date date NOT NULL,
  pickup_window_start timestamptz NOT NULL,
  pickup_window_end timestamptz NOT NULL,
  condition item_condition DEFAULT 'sealed',
  storage_type storage_type DEFAULT 'ambient',
  location_lat numeric NOT NULL,
  location_lng numeric NOT NULL,
  address_text text NOT NULL,
  status donation_status DEFAULT 'available',
  images text[] DEFAULT '{}',
  is_hidden boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid REFERENCES donations(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status reservation_status DEFAULT 'pending',
  message text,
  pickup_time timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(donation_id, recipient_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid REFERENCES donations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid REFERENCES donations(id) ON DELETE CASCADE NOT NULL,
  rater_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rated_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(donation_id, rater_id, rated_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  is_read boolean DEFAULT false,
  is_email_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Flags table
CREATE TABLE IF NOT EXISTS flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_type flag_target_type NOT NULL,
  target_id uuid NOT NULL,
  reason flag_reason NOT NULL,
  description text,
  status flag_status DEFAULT 'pending',
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are publicly readable"
  ON profiles FOR SELECT
  USING (NOT is_banned);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for categories
CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage categories"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for donations
CREATE POLICY "Donations are publicly readable when not hidden"
  ON donations FOR SELECT
  USING (NOT is_hidden AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = donor_id AND is_banned = true
  ));

CREATE POLICY "Donors can insert their own donations"
  ON donations FOR INSERT
  WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Donors can update their own donations"
  ON donations FOR UPDATE
  USING (auth.uid() = donor_id);

CREATE POLICY "NGOs and admins can hide donations"
  ON donations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('ngo', 'admin')
    )
  );

-- RLS Policies for reservations
CREATE POLICY "Users can read reservations they're involved in"
  ON reservations FOR SELECT
  USING (
    auth.uid() = recipient_id OR 
    auth.uid() = (SELECT donor_id FROM donations WHERE id = donation_id)
  );

CREATE POLICY "Recipients can create reservations"
  ON reservations FOR INSERT
  WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Involved users can update reservations"
  ON reservations FOR UPDATE
  USING (
    auth.uid() = recipient_id OR 
    auth.uid() = (SELECT donor_id FROM donations WHERE id = donation_id)
  );

-- RLS Policies for messages
CREATE POLICY "Users can read messages they're involved in"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages for donations they're involved in"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND (
      auth.uid() = (SELECT donor_id FROM donations WHERE id = donation_id) OR
      EXISTS (SELECT 1 FROM reservations WHERE donation_id = messages.donation_id AND recipient_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- RLS Policies for ratings
CREATE POLICY "Ratings are publicly readable"
  ON ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can create ratings for completed donations"
  ON ratings FOR INSERT
  WITH CHECK (
    auth.uid() = rater_id AND
    EXISTS (
      SELECT 1 FROM reservations r
      JOIN donations d ON r.donation_id = d.id
      WHERE r.donation_id = ratings.donation_id 
      AND r.status = 'completed'
      AND (r.recipient_id = auth.uid() OR d.donor_id = auth.uid())
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can read their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- RLS Policies for flags
CREATE POLICY "Users can create flags"
  ON flags FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "NGOs and admins can read all flags"
  ON flags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('ngo', 'admin')
    )
  );

CREATE POLICY "NGOs and admins can update flags"
  ON flags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('ngo', 'admin')
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'New User'),
    'recipient'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric
)
RETURNS numeric AS $$
DECLARE
  dlat numeric;
  dlng numeric;
  a numeric;
  c numeric;
  r numeric := 6371; -- Earth's radius in kilometers
BEGIN
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2) * sin(dlng/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN r * c;
END;
$$ LANGUAGE plpgsql;

-- Function to update reputation scores
CREATE OR REPLACE FUNCTION update_reputation_score()
RETURNS trigger AS $$
BEGIN
  -- Update the rated user's reputation
  UPDATE profiles
  SET 
    reputation_score = (
      SELECT AVG(rating)::numeric 
      FROM ratings 
      WHERE rated_id = NEW.rated_id
    ),
    reputation_count = (
      SELECT COUNT(*)::integer 
      FROM ratings 
      WHERE rated_id = NEW.rated_id
    )
  WHERE id = NEW.rated_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update reputation after new rating
DROP TRIGGER IF EXISTS on_rating_created ON ratings;
CREATE TRIGGER on_rating_created
  AFTER INSERT ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_reputation_score();

-- Seed categories
INSERT INTO categories (name, description, icon) VALUES
  ('bread', 'Bread, pastries, and baked goods', '🍞'),
  ('dairy', 'Milk, cheese, yogurt, and dairy products', '🥛'),
  ('produce', 'Fresh fruits and vegetables', '🥬'),
  ('canned', 'Canned and preserved foods', '🥫'),
  ('cooked', 'Prepared meals and cooked food', '🍽️'),
  ('baby_food', 'Baby food and infant nutrition', '🍼'),
  ('beverages', 'Drinks, juices, and beverages', '🥤'),
  ('desserts', 'Sweets, cakes, and desserts', '🍰'),
  ('other', 'Other food items', '🍱')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_donations_location ON donations (location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations (status);
CREATE INDEX IF NOT EXISTS idx_donations_expiry ON donations (expiry_date);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations (donor_id);
CREATE INDEX IF NOT EXISTS idx_reservations_donation ON reservations (donation_id);
CREATE INDEX IF NOT EXISTS idx_reservations_recipient ON reservations (recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_donation ON messages (donation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_flags_status ON flags (status);