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

async function createAdminUser() {
  const email = 'admin@example.com';
  const password = 'Password123!';
  const fullName = 'Admin User';
  const role = 'admin';

  console.log('Creating user via Admin API:', email);
  try {
    const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Confirm email automatically
    });

    if (authError) {
      console.log('Auth Admin Error:', authError);
      return;
    }

    console.log('Auth Admin Success! User ID:', user.id);

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          email,
          role,
          full_name: fullName,
        },
      ]);

    if (profileError) {
      console.log('Profile Insert Error:', profileError);
    } else {
      console.log('Profile Insert Success!');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createAdminUser();
