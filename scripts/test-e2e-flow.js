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
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error('Keys missing in .env.local!');
  process.exit(1);
}

const supabaseService = createClient(url, serviceKey);
const supabaseAnon = createClient(url, anonKey);

async function runFlowTest() {
  console.log('--- Testing Full Donation & Expenditure Flow via Client (Anon Key) ---');

  // 1. Get donor and NGO profiles
  const { data: donorProfile } = await supabaseService.from('profiles').select('*').eq('role', 'donor').limit(1);
  const { data: ngoProfile } = await supabaseService.from('profiles').select('*').eq('role', 'ngo').limit(1);
  
  if (!donorProfile || donorProfile.length === 0) {
    console.error('❌ No donor profile found in DB!');
    return;
  }
  if (!ngoProfile || ngoProfile.length === 0) {
    console.error('❌ No NGO profile found in DB!');
    return;
  }

  const donor = donorProfile[0];
  const ngoUser = ngoProfile[0];
  console.log(`Donor: ${donor.full_name} (${donor.id})`);
  console.log(`NGO User: ${ngoUser.full_name} (${ngoUser.id})`);

  // 2. Get NGO record
  const { data: ngoData } = await supabaseService.from('ngos').select('*').eq('user_id', ngoUser.id).single();
  if (!ngoData) {
    console.error('❌ NGO record not found!');
    return;
  }
  console.log(`NGO Record: ${ngoData.name} (${ngoData.id})`);

  // 3. Create a campaign
  const { data: campaign, error: campErr } = await supabaseService
    .from('campaigns')
    .insert([
      {
        ngo_id: ngoData.id,
        title: `Dynamic Test Campaign ${Date.now()}`,
        description: 'Testing full donation and expenditure integration.',
        goal_amount: 50000,
        collected_amount: 0,
        category: 'education',
        status: 'active',
      }
    ])
    .select()
    .single();

  if (campErr) {
    console.error('❌ Campaign creation failed:', campErr.message);
    return;
  }
  console.log(`✅ Campaign created: ${campaign.title} (${campaign.id})`);

  // 4. Client-side donation insert
  console.log('Donating ₹10,000 using Anon client...');
  const { data: donation, error: donErr } = await supabaseAnon
    .from('donations')
    .insert([
      {
        campaign_id: campaign.id,
        donor_id: donor.id,
        amount: 10000,
        currency: 'INR',
        status: 'completed',
        payment_method: 'upi',
        transaction_id: `TXN-${Date.now()}`,
        message: 'Flow test donation',
      }
    ])
    .select();

  if (donErr) {
    console.log('❌ Donation failed (Check if RLS is disabled or has INSERT policy):', donErr.message);
    return;
  }
  console.log('✅ Donation succeeded!');

  // Trigger or API code updates campaign collected_amount
  // Let's verify the updated campaign collected_amount
  const { data: updatedCamp } = await supabaseService.from('campaigns').select('*').eq('id', campaign.id).single();
  console.log(`Campaign collected amount is now: ₹${updatedCamp.collected_amount}`);

  // 5. Client-side expenditure insert
  console.log('Posting ₹4,000 expenditure using Anon client...');
  const { data: expenditure, error: expErr } = await supabaseAnon
    .from('expenditures')
    .insert([
      {
        campaign_id: campaign.id,
        title: 'Books Purchase',
        description: 'Purchased textbooks for primary school students.',
        amount: 4000,
        category: 'Supplies',
        proof_urls: ['https://example.com/receipt.pdf'],
        verified: true,
      }
    ])
    .select();

  if (expErr) {
    console.log('❌ Expenditure failed (Check if RLS is disabled or has INSERT policy):', expErr.message);
    return;
  }
  console.log('✅ Expenditure succeeded!');

  // 6. Read expenditures as Anon client
  console.log('Fetching expenditures as Anon client...');
  const { data: fetchedExp, error: fetchErr } = await supabaseAnon
    .from('expenditures')
    .select('*')
    .eq('campaign_id', campaign.id);

  if (fetchErr) {
    console.log('❌ Fetching expenditures failed:', fetchErr.message);
  } else {
    console.log(`✅ Fetching succeeded! Found ${fetchedExp.length} expenditures:`, fetchedExp);
  }
}

runFlowTest();
