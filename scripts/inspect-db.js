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
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Supabase URL or Service Role Key missing in .env.local!');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function inspect() {
  console.log('Inspecting DB using Service Role client...');
  try {
    // Check profiles
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(5);
    if (pError) {
      console.log('Profiles table error:', pError.message);
    } else {
      console.log('Profiles count/data:', profiles);
    }

    // Check if we can query pg_catalog or information_schema?
    // Usually not possible over REST API unless exposed via RPC or view.
    // Let's try to query some other tables
    const { data: ngos, error: nError } = await supabase.from('ngos').select('*').limit(5);
    if (nError) {
      console.log('NGOs table error:', nError.message);
    } else {
      console.log('NGOs data:', ngos);
    }

    const { data: campaigns, error: cError } = await supabase.from('campaigns').select('*').limit(5);
    if (cError) {
      console.log('Campaigns table error:', cError.message);
    } else {
      console.log('Campaigns data:', campaigns);
    }

  } catch (err) {
    console.error('Unexpected inspection error:', err);
  }
}

inspect();
