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

async function testSignup() {
  const email = `test-user-${Date.now()}@example.com`;
  const password = 'Password123!';
  const fullName = 'Test User';
  const role = 'donor';

  console.log('Testing signup for:', email);
  
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.log('Auth Error:', authError);
      return;
    }

    console.log('Auth Success! User ID:', authData.user ? authData.user.id : 'No user');

    if (authData.user) {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email,
            role,
            full_name: fullName,
          },
        ]);

      if (profileError) {
        console.log('Profile Insert Error:', profileError);
      } else {
        console.log('Profile Insert Success! Data:', data);
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testSignup();
