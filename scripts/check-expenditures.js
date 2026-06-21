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

async function checkExpendituresAccess() {
  console.log('Fetching expenditures using Service Role (Bypassing RLS)...');
  const { data: serviceData, error: serviceErr } = await supabaseService.from('expenditures').select('*');
  if (serviceErr) {
    console.error('Service error:', serviceErr.message);
  } else {
    console.log(`Service Role found ${serviceData.length} expenditures:`, serviceData);
  }

  console.log('\nFetching expenditures using Anon Client (Subject to RLS)...');
  const { data: anonData, error: anonErr } = await supabaseAnon.from('expenditures').select('*');
  if (anonErr) {
    console.error('Anon error:', anonErr.message);
  } else {
    console.log(`Anon Client found ${anonData.length} expenditures:`, anonData);
  }
}

checkExpendituresAccess();
