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

async function seed() {
  console.log('Starting Database Seeding...');

  try {
    // 1. Create NGO User
    const ngoEmail = 'ngo@example.com';
    const password = 'Password123!';
    
    console.log('Creating NGO auth user...');
    const { data: authNgo, error: authNgoError } = await supabase.auth.admin.createUser({
      email: ngoEmail,
      password: password,
      email_confirm: true
    });

    if (authNgoError && !authNgoError.message.includes('already registered')) {
      console.error('Error creating NGO auth user:', authNgoError);
      return;
    }

    // Get user id (either from newly created user or search existing)
    let ngoUserId;
    if (authNgo?.user) {
      ngoUserId = authNgo.user.id;
    } else {
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existingUser = users.find(u => u.email === ngoEmail);
      if (existingUser) {
        ngoUserId = existingUser.id;
      } else {
        console.error('Could not retrieve NGO User ID.');
        return;
      }
    }
    console.log('NGO User ID:', ngoUserId);

    // Create Profile for NGO
    await supabase.from('profiles').upsert({
      id: ngoUserId,
      email: ngoEmail,
      role: 'ngo',
      full_name: 'Health & Education Foundation'
    });

    // 2. Create NGO Record
    console.log('Creating NGO organization details...');
    const { data: ngoData, error: ngoError } = await supabase.from('ngos').upsert({
      user_id: ngoUserId,
      name: 'Health & Education Foundation',
      description: 'Dedicated to providing clean drinking water, high-quality primary education, and emergency disaster relief across rural India.',
      mission: 'To empower underprivileged communities with access to fundamental life resources and sustainable development.',
      website: 'https://healthandedu.org',
      verified: true
    }).select().single();

    if (ngoError) {
      console.error('Error creating NGO record:', ngoError);
      return;
    }
    const ngoId = ngoData.id;
    console.log('NGO ID:', ngoId);

    // 3. Create Campaigns
    console.log('Creating campaigns...');
    
    // Campaign 1
    const { data: campaign1, error: c1Error } = await supabase.from('campaigns').insert({
      ngo_id: ngoId,
      title: 'Clean Water for Rural Clinics',
      description: 'Installing commercial-grade UV water filters and digging tubewells in 15 rural medical clinics to ensure patients have safe drinking water.',
      goal_amount: 1000000.00,
      collected_amount: 750000.00,
      category: 'health',
      status: 'active',
      image_url: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&q=80&w=800'
    }).select().single();

    if (c1Error) console.error('Error campaign 1:', c1Error);

    // Campaign 2
    const { data: campaign2, error: c2Error } = await supabase.from('campaigns').insert({
      ngo_id: ngoId,
      title: 'Smart Classrooms for Village Schools',
      description: 'Equipping 5 village government primary schools with digital projectors, tablets, and localized interactive learning software.',
      goal_amount: 500000.00,
      collected_amount: 150000.00,
      category: 'education',
      status: 'active',
      image_url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=800'
    }).select().single();

    if (c2Error) console.error('Error campaign 2:', c2Error);

    // Campaign 3
    const { data: campaign3, error: c3Error } = await supabase.from('campaigns').insert({
      ngo_id: ngoId,
      title: 'Monsoon Flood Rescue & Aid Kit Drive',
      description: 'Providing immediate food, hygiene products, clean clothes, and primary emergency health kits to 500 families displaced by recent monsoon flooding.',
      goal_amount: 2000000.00,
      collected_amount: 1800000.00,
      category: 'disaster',
      status: 'active',
      image_url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&q=80&w=800'
    }).select().single();

    if (c3Error) console.error('Error campaign 3:', c3Error);

    console.log('Campaigns successfully created!');

    // 4. Create Donor User
    const donorEmail = 'donor@example.com';
    console.log('Creating Donor auth user...');
    const { data: authDonor, error: authDonorError } = await supabase.auth.admin.createUser({
      email: donorEmail,
      password: password,
      email_confirm: true
    });

    if (authDonorError && !authDonorError.message.includes('already registered')) {
      console.error('Error creating donor auth user:', authDonorError);
      return;
    }

    let donorUserId;
    if (authDonor?.user) {
      donorUserId = authDonor.user.id;
    } else {
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existingUser = users.find(u => u.email === donorEmail);
      if (existingUser) {
        donorUserId = existingUser.id;
      }
    }
    console.log('Donor User ID:', donorUserId);

    // Create Profile for Donor
    await supabase.from('profiles').upsert({
      id: donorUserId,
      email: donorEmail,
      role: 'donor',
      full_name: 'John Doe'
    });

    // 5. Create Sample Donations
    console.log('Adding sample donations...');
    if (campaign1 && donorUserId) {
      await supabase.from('donations').insert([
        {
          campaign_id: campaign1.id,
          donor_id: donorUserId,
          amount: 50000.00,
          status: 'completed',
          payment_method: 'upi',
          transaction_id: 'TXN123456789',
          message: 'Happy to support clean water facilities!'
        },
        {
          campaign_id: campaign1.id,
          donor_id: donorUserId,
          amount: 25000.00,
          status: 'completed',
          payment_method: 'card',
          transaction_id: 'TXN987654321',
          message: 'Water is life. Thank you for this initiative.'
        }
      ]);
    }

    if (campaign2 && donorUserId) {
      await supabase.from('donations').insert([
        {
          campaign_id: campaign2.id,
          donor_id: donorUserId,
          amount: 150000.00,
          status: 'completed',
          payment_method: 'bank',
          transaction_id: 'TXN554433221',
          message: 'Hope this helps provide quality education to the children.'
        }
      ]);
    }

    // 6. Create Sample Expenditures (for campaign 1)
    console.log('Adding sample expenditures...');
    if (campaign1) {
      const { data: expenditure, error: expError } = await supabase.from('expenditures').insert({
        campaign_id: campaign1.id,
        title: 'Procured 10 Commercial RO Water Purifiers',
        description: 'Purchased commercial-grade reverse osmosis filters from Aquaguard India for installation at primary village clinics.',
        amount: 250000.00,
        category: 'equipment',
        proof_urls: ['https://example.com/receipt-purifiers.pdf'],
        verified: true
      }).select().single();

      if (expError) {
        console.error('Error creating expenditure:', expError);
      } else {
        // Add impact attribution
        console.log('Adding impact attributions...');
        const { data: donation } = await supabase.from('donations').select('id').eq('campaign_id', campaign1.id).limit(1).single();
        if (donation) {
          await supabase.from('impact_attributions').insert({
            donation_id: donation.id,
            expenditure_id: expenditure.id,
            attributed_amount: 50000.00,
            impact_metric: 'Provided safe drinking water access to roughly 200 patients daily at Clinic #1'
          });
        }
      }
    }

    console.log('\n=======================================');
    console.log('DATABASE SEEDED SUCCESSFULLY!');
    console.log('=======================================');
    console.log('NGO Login:   ngo@example.com  / Password123!');
    console.log('Donor Login: donor@example.com / Password123!');
    console.log('=======================================\n');

  } catch (err) {
    console.error('Seeding crashed with error:', err);
  }
}

seed();
