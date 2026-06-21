// scripts/run-sql.js
// Runs fix-rls.sql directly against Supabase using service_role key via the SQL over REST approach

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'bvlewcwakiayzjpswzxy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2bGV3Y3dha2lheXpqcHN3enh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTk1OTA0MiwiZXhwIjoyMDk3NTM1MDQyfQ.qm7LVzyPK24KeaCQCOL5oTjp20TF4m2fveDOvN9bxNE';

const sqlFile = path.join(__dirname, 'fix-rls.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

function runSQL(sqlQuery) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ query: sqlQuery });

    const req = https.request({
      hostname: SUPABASE_URL,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Content-Length': Buffer.byteLength(payload),
        'Prefer': 'return=representation',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Split SQL into individual statements (skip blank lines and comment-only lines)
function splitStatements(sql) {
  // Split on semicolons, handling dollar-quoted blocks
  const stmts = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  
  const lines = sql.split('\n');
  for (const line of lines) {
    // Skip pure comment lines at top level
    if (!inDollarQuote && line.trim().startsWith('--')) {
      current += line + '\n';
      continue;
    }
    
    // Detect $$ dollar quoting
    if (!inDollarQuote && line.includes('$$')) {
      inDollarQuote = true;
      current += line + '\n';
      continue;
    }
    
    if (inDollarQuote) {
      current += line + '\n';
      if (line.includes('$$')) {
        inDollarQuote = false;
      }
      continue;
    }
    
    current += line + '\n';
    
    // End of statement
    if (line.trim().endsWith(';')) {
      const stmt = current.trim();
      if (stmt.replace(/--[^\n]*/g, '').trim().length > 1) {
        stmts.push(stmt);
      }
      current = '';
    }
  }
  
  if (current.trim().replace(/--[^\n]*/g, '').trim().length > 1) {
    stmts.push(current.trim());
  }
  
  return stmts;
}

async function main() {
  console.log('🚀 Running fix-rls.sql against Supabase...\n');
  
  // Try running the entire SQL as one request via the db/query endpoint
  const payload = JSON.stringify({ query: sql });
  
  const result = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SUPABASE_URL,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Content-Length': Buffer.byteLength(payload),
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });

  if (result.status === 200 || result.status === 204) {
    console.log('✅ SQL executed successfully via RPC!');
    return;
  }

  // Fallback: try supabase management API
  const mgmtPayload = JSON.stringify({ 
    query: sql 
  });

  const mgmtResult = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.supabase.com',
      path: `/v1/projects/bvlewcwakiayzjpswzxy/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': Buffer.byteLength(mgmtPayload),
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(mgmtPayload);
    req.end();
  });

  if (mgmtResult.status === 200 || mgmtResult.status === 204) {
    console.log('✅ SQL executed successfully via Management API!');
    return;
  }

  console.log('Management API status:', mgmtResult.status);
  
  // Print out the SQL for manual copy-paste
  console.log('\n' + '='.repeat(70));
  console.log('📋  PASTE THIS INTO SUPABASE SQL EDITOR AND CLICK "RUN":');
  console.log('🔗  https://supabase.com/dashboard/project/bvlewcwakiayzjpswzxy/sql/new');
  console.log('='.repeat(70) + '\n');
  console.log(sql);
}

main().catch(console.error);
