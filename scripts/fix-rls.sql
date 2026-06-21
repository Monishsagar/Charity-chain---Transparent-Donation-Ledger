-- CharityChain Database RLS Fixes & Triggers
-- Copy and paste this entire script into your Supabase SQL Editor and click "Run"

-- 1. Allow authenticated users to insert donations
DROP POLICY IF EXISTS "Users can insert own donations" ON donations;
CREATE POLICY "Users can insert own donations" ON donations
  FOR INSERT WITH CHECK (auth.uid() = donor_id);

-- 2. Allow NGO users to insert their own campaigns
DROP POLICY IF EXISTS "NGOs can insert own campaigns" ON campaigns;
CREATE POLICY "NGOs can insert own campaigns" ON campaigns
  FOR INSERT WITH CHECK (
    ngo_id IN (SELECT id FROM ngos WHERE user_id = auth.uid())
  );

-- 3. Allow NGO users to update their own campaigns
DROP POLICY IF EXISTS "NGOs can update own campaigns" ON campaigns;
CREATE POLICY "NGOs can update own campaigns" ON campaigns
  FOR UPDATE USING (
    ngo_id IN (SELECT id FROM ngos WHERE user_id = auth.uid())
  );

-- 4. Allow NGO users to insert expenditures for their campaigns
DROP POLICY IF EXISTS "NGOs can insert own expenditures" ON expenditures;
CREATE POLICY "NGOs can insert own expenditures" ON expenditures
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE ngo_id IN (
        SELECT id FROM ngos WHERE user_id = auth.uid()
      )
    )
  );

-- 5. Trigger to automatically update campaign available_balance when a donation or expenditure changes
--    available_balance = SUM(completed donations) - SUM(expenditures)
CREATE OR REPLACE FUNCTION update_campaign_collected_amount()
RETURNS TRIGGER AS $$
DECLARE
  v_campaign_id UUID;
BEGIN
  -- Determine which campaign to update
  IF (TG_OP = 'DELETE') THEN
    v_campaign_id := OLD.campaign_id;
  ELSE
    v_campaign_id := NEW.campaign_id;
  END IF;

  UPDATE campaigns
  SET collected_amount = GREATEST(
    (
      SELECT COALESCE(SUM(amount), 0)
      FROM donations
      WHERE campaign_id = v_campaign_id AND status = 'completed'
    )
    -
    (
      SELECT COALESCE(SUM(amount), 0)
      FROM expenditures
      WHERE campaign_id = v_campaign_id
    ),
    0
  )
  WHERE id = v_campaign_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger on donations table
DROP TRIGGER IF EXISTS on_donation_change ON donations;
CREATE TRIGGER on_donation_change
AFTER INSERT OR UPDATE OR DELETE ON donations
FOR EACH ROW
EXECUTE FUNCTION update_campaign_collected_amount();

-- Trigger on expenditures table (same function, keeps balance in sync)
DROP TRIGGER IF EXISTS on_expenditure_change ON expenditures;
CREATE TRIGGER on_expenditure_change
AFTER INSERT OR UPDATE OR DELETE ON expenditures
FOR EACH ROW
EXECUTE FUNCTION update_campaign_collected_amount();

-- 6. Allow anyone to read all expenditures (pending or verified)
DROP POLICY IF EXISTS "Anyone can read verified expenditures" ON expenditures;
DROP POLICY IF EXISTS "Anyone can read all expenditures" ON expenditures;
CREATE POLICY "Anyone can read all expenditures" ON expenditures
  FOR SELECT USING (true);

