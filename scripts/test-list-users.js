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

async function listUsers() {
  console.log('Listing users using auth.admin...');
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.log('List users error:', error);
    } else {
      console.log('Users found:', users.map(u => ({ id: u.id, email: u.email, created_at: u.created_at })));
    }
  } catch (err) {
    console.error('Unexpected error listing users:', err);
  }
}

listUsers();
