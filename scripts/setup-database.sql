-- CharityChain Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('donor', 'ngo', 'admin')),
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can read all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- NGOs table
CREATE TABLE IF NOT EXISTS ngos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  mission TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verification_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE ngos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read verified NGOs" ON ngos;
DROP POLICY IF EXISTS "NGO can read own profile" ON ngos;

CREATE POLICY "Anyone can read verified NGOs" ON ngos
  FOR SELECT USING (verified = true);

CREATE POLICY "NGO can read own profile" ON ngos
  FOR SELECT USING (user_id = auth.uid());

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_amount DECIMAL(12,2) NOT NULL,
  collected_amount DECIMAL(12,2) DEFAULT 0,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'paused')) DEFAULT 'active',
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read active campaigns" ON campaigns;

CREATE POLICY "Anyone can read active campaigns" ON campaigns
  FOR SELECT USING (status = 'active' OR ngo_id IN (SELECT id FROM ngos WHERE user_id = auth.uid()));

-- Donations table (immutable)
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('upi', 'card', 'bank')),
  transaction_id TEXT,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- NO DELETE policy on donations table for audit trail
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read completed donations" ON donations;
DROP POLICY IF EXISTS "Donor can read own donations" ON donations;
DROP POLICY IF EXISTS "NGO can read donations to their campaigns" ON donations;

CREATE POLICY "Anyone can read completed donations" ON donations
  FOR SELECT USING (status = 'completed');

CREATE POLICY "Donor can read own donations" ON donations
  FOR SELECT USING (donor_id = auth.uid());

CREATE POLICY "NGO can read donations to their campaigns" ON donations
  FOR SELECT USING (campaign_id IN (SELECT id FROM campaigns WHERE ngo_id IN (SELECT id FROM ngos WHERE user_id = auth.uid())));

-- Expenditures table
CREATE TABLE IF NOT EXISTS expenditures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category TEXT NOT NULL,
  proof_urls TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE expenditures ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read verified expenditures" ON expenditures;
DROP POLICY IF EXISTS "NGO can read own expenditures" ON expenditures;

CREATE POLICY "Anyone can read verified expenditures" ON expenditures
  FOR SELECT USING (verified = true);

CREATE POLICY "NGO can read own expenditures" ON expenditures
  FOR SELECT USING (campaign_id IN (SELECT id FROM campaigns WHERE ngo_id IN (SELECT id FROM ngos WHERE user_id = auth.uid())));

-- Impact Attributions table
CREATE TABLE IF NOT EXISTS impact_attributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  expenditure_id UUID NOT NULL REFERENCES expenditures(id) ON DELETE CASCADE,
  attributed_amount DECIMAL(12,2) NOT NULL,
  impact_metric TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE impact_attributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read attributions" ON impact_attributions;

CREATE POLICY "Anyone can read attributions" ON impact_attributions
  FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX idx_ngos_user_id ON ngos(user_id);
CREATE INDEX idx_campaigns_ngo_id ON campaigns(ngo_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_donations_campaign_id ON donations(campaign_id);
CREATE INDEX idx_donations_donor_id ON donations(donor_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_expenditures_campaign_id ON expenditures(campaign_id);
CREATE INDEX idx_impact_attributions_donation_id ON impact_attributions(donation_id);
CREATE INDEX idx_impact_attributions_expenditure_id ON impact_attributions(expenditure_id);
