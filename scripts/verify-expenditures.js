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
  console.error('Supabase URL or Service Key missing!');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function verifyAllExpenditures() {
  console.log('Setting all expenditures to verified: true in DB...');
  const { data, error } = await supabase
    .from('expenditures')
    .update({ verified: true })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to update all rows

  if (error) {
    console.error('Update failed:', error.message);
  } else {
    console.log('Update success! Verified all expenditures.');
  }
}

verifyAllExpenditures();
