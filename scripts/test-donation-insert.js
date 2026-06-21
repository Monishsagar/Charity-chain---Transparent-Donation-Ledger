const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Supabase URL or Anon Key missing in .env.local!');
  process.exit(1);
}

const supabase = createClient(url, key);

async function testDonationInsert() {
  console.log('Testing client-side donation insert...');
  
  // Get an existing campaign and donor profile
  const { data: campaignData, error: campErr } = await supabase.from('campaigns').select('*').limit(1);
  const { data: profileData, error: profErr } = await supabase.from('profiles').select('*').limit(1);

  if (campErr || profErr) {
    console.error('Error fetching prerequisites:', campErr || profErr);
    return;
  }

  if (!campaignData || campaignData.length === 0 || !profileData || profileData.length === 0) {
    console.log('No campaigns or profiles in DB to test with. Run seed/signup first.');
    return;
  }

  const campaign = campaignData[0];
  const profile = profileData[0];

  console.log(`Campaign: ${campaign.id}, Donor: ${profile.id}`);

  // Try to insert a donation
  const { data, error } = await supabase
    .from('donations')
    .insert([
      {
        campaign_id: campaign.id,
        donor_id: profile.id,
        amount: 500,
        currency: 'INR',
        status: 'completed',
        payment_method: 'upi',
        transaction_id: `TEST-TXN-${Date.now()}`,
        message: 'Test donation',
      }
    ]);

  if (error) {
    console.log('❌ Donation Insert failed! RLS policy is blocking it:', error.message);
  } else {
    console.log('✅ Donation Insert succeeded!', data);
  }
}

testDonationInsert();
