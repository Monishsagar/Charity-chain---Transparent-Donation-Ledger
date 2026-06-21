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

console.log('Connecting to:', url);
const supabase = createClient(url, key);

async function test() {
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
      console.log('\n--- Database Error ---');
      console.log(JSON.stringify(error, null, 2));
      console.log('----------------------\n');
    } else {
      console.log('Successfully queried profiles table. Columns or data:', data);
    }
  } catch (err) {
    console.error('Network or unexpected error:', err);
  }
}

test();
