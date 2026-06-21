const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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
// We must use the service role key to query pg_policies
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Supabase URL or Service Role Key missing in .env.local!');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function inspectPolicies() {
  console.log('Querying current RLS policies...');
  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies
        WHERE schemaname = 'public';
      `
    });

    if (error) {
      // Fallback: run query using a direct sql execution if rpc not available
      // Let's try raw query using standard postgres if possible, or print the error
      console.log('RPC Error:', error.message);
      
      // Let's check if we can query pg_policies via some other way, or if we can run it using REST API
      const { data: data2, error: error2 } = await supabase.from('pg_policies').select('*').catch(() => ({ data: null, error: { message: 'no table direct access' } }));
      if (error2) {
        console.log('Direct query error:', error2.message);
      } else {
        console.log('Direct query policies:', data2);
      }
      return;
    }

    console.log('Policies:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

inspectPolicies();
