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

async function runEndToEndTest() {
  console.log('--- Database End-to-End RLS Test ---');
  
  // 1. Get an NGO
  const { data: ngos, error: ngoErr } = await supabaseService.from('ngos').select('*').limit(1);
  if (ngoErr || !ngos || ngos.length === 0) {
    console.error('No NGOs available to test with!', ngoErr);
    return;
  }
  const ngo = ngos[0];
  console.log(`Using NGO: ${ngo.name} (${ngo.id})`);

  // 2. Create a campaign using Service Role (since anon can't insert campaigns without auth session)
  const campaignTitle = `Test Campaign ${Date.now()}`;
  const { data: campaign, error: campErr } = await supabaseService
    .from('campaigns')
    .insert([
      {
        ngo_id: ngo.id,
        title: campaignTitle,
        description: 'Testing RLS policies and donation settling.',
        goal_amount: 100000,
        collected_amount: 0,
        category: 'health',
        status: 'active',
      }
    ])
    .select()
    .single();

  if (campErr) {
    console.error('Failed to create campaign:', campErr.message);
    return;
  }
  console.log(`Created Campaign: ${campaign.title} (${campaign.id})`);

  // 3. Get a donor profile
  const { data: profiles, error: profErr } = await supabaseService.from('profiles').select('*').eq('role', 'donor').limit(1);
  if (profErr || !profiles || profiles.length === 0) {
    console.error('No donor profiles available to test with! Create one via signup first.');
    return;
  }
  const profile = profiles[0];
  console.log(`Using Donor: ${profile.full_name} (${profile.id})`);

  // 4. Try client-side (Anon) insertion of a donation
  console.log('Inserting donation using Anon client...');
  const { data: donation, error: donErr } = await supabaseAnon
    .from('donations')
    .insert([
      {
        campaign_id: campaign.id,
        donor_id: profile.id,
        amount: 2500,
        currency: 'INR',
        status: 'completed',
        payment_method: 'upi',
        transaction_id: `TXN-TEST-${Date.now()}`,
        message: 'E2E testing donation',
      }
    ]);

  if (donErr) {
    console.log('❌ Anon donation insert failed:', donErr.message);
  } else {
    console.log('✅ Anon donation insert succeeded!');
  }
}

runEndToEndTest();
