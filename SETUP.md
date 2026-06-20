# CharityChain Setup Guide

Complete step-by-step guide to get CharityChain running locally and deployed to production.

## Prerequisites

- Node.js 18+ (includes pnpm)
- Supabase account (free tier works)
- Vercel account (for deployment)
- Git

## Part 1: Local Development Setup

### Step 1: Clone and Install

```bash
cd /path/to/v0-project
pnpm install
```

### Step 2: Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in:
   - Project Name: `charitychain`
   - Database Password: (save this)
   - Region: Choose closest to you
4. Wait for project to initialize (2-3 minutes)
5. Go to project settings > API to find:
   - **Project URL**: Copy this to `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key**: Copy this to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Go to Settings > Database > Connection Pooling to find:
   - Copy the **Service Role Key** to `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Setup Database Schema

1. In Supabase, go to SQL Editor
2. Create new query
3. Copy entire contents of `scripts/setup-database.sql`
4. Paste and run
5. Wait for schema creation (tables, RLS policies, indexes)

### Step 4: Create Environment File

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Step 5: Run Development Server

```bash
pnpm dev
```

Open http://localhost:3000

## Part 2: Testing the Application

### Create First Admin

1. Go to http://localhost:3000/auth/register
2. Sign up with:
   - Email: `admin@example.com`
   - Name: `Admin User`
   - Role: Select "NGO" (we'll update role in database)
3. After registration, go to Supabase > profiles table
4. Find your user and change role to `'admin'`

### Create First NGO

1. Sign out and register new account:
   - Email: `ngo@example.com`
   - Name: `Health for All`
   - Role: NGO
2. Dashboard now shows NGO interface

### Create First Campaign

1. As NGO, go to `/dashboard/campaigns`
2. Click "Create Campaign"
3. Fill in:
   - Title: "Emergency Medical Supplies"
   - Description: "Providing medical supplies to rural clinics"
   - Goal Amount: 500000
   - Category: Health
4. Campaign appears in dashboard

### Create First Donor Account

1. Register as donor:
   - Email: `donor@example.com`
   - Name: `John Donor`
   - Role: Donor
2. Dashboard shows donation tracking interface
3. Go to `/campaigns` to see campaigns

### View Public Pages

- Landing page: http://localhost:3000
- Campaigns: http://localhost:3000/campaigns
- NGO Directory: http://localhost:3000/ngos
- Public Ledger: http://localhost:3000/ledger

## Part 3: Populating Sample Data

### Automatic Data Entry

For testing, manually create a few campaigns and donations:

1. **As NGO**: Create 3-5 campaigns with different categories
2. **As Admin**: Verify NGOs in `/admin/ngos`
3. **As Donor**: "Donate" to campaigns (in real app, payment gateway handles this)
4. **As NGO**: Post expenditures for campaigns
5. **As Admin**: Verify expenditures in `/admin/expenditures`

### Database Direct Insert (Advanced)

If you want to seed data directly in Supabase SQL:

```sql
-- Create an NGO
INSERT INTO ngos (user_id, name, description, mission, verified)
VALUES (
  (SELECT id FROM profiles WHERE email = 'ngo@example.com'),
  'Water for Life',
  'Providing clean water to communities',
  'Access to clean drinking water',
  true
);

-- Create a campaign
INSERT INTO campaigns (ngo_id, title, description, goal_amount, category, status)
SELECT id, 'Clean Water Initiative', 'Building wells in rural areas', 1000000, 'water', 'active'
FROM ngos WHERE name = 'Water for Life' LIMIT 1;
```

## Part 4: Production Deployment

### Step 1: Connect to GitHub

1. Push code to GitHub repository
2. In Vercel, click "New Project"
3. Import your GitHub repository
4. Select `v0-project` root directory

### Step 2: Add Environment Variables

In Vercel project settings > Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Step 3: Deploy

1. Click "Deploy"
2. Wait for build (3-5 minutes)
3. Visit your production URL

### Step 4: Production Database

For production, consider:
- Enable backups in Supabase
- Enable RLS policies (already done in setup)
- Monitor rate limits
- Setup database replicas for scaling

## Troubleshooting

### "Supabase connection error"
- Check `NEXT_PUBLIC_SUPABASE_URL` format (must have protocol)
- Verify network connectivity
- Check Supabase project is active

### "Authentication failed"
- Confirm email/password correct
- Check profiles table has user record
- Verify auth policies in RLS

### "No campaigns showing"
- Campaigns must have `status = 'active'`
- Check NGO `verified = true`
- View in Supabase editor to confirm data exists

### "Permission denied" errors
- Review RLS policies in Supabase > Authentication > Policies
- Ensure user has correct role in profiles table
- Check authenticated user ID matches

### Build errors
- Delete `node_modules` and `.next`
- Run `pnpm install` again
- Check Node version is 18+

## Performance Optimization

### Database
- Indexes created on common queries (campaign_id, donor_id, status)
- Use Supabase connection pooling for scalability
- Enable caching headers in deployment

### Frontend
- Code splitting via Next.js App Router
- Image optimization with Next.js Image component
- CSS-in-JS eliminated (pure Tailwind)

### Monitoring
- Enable Vercel Analytics
- Setup Supabase monitoring
- Monitor error rates and performance

## Security Checklist

- [ ] Change database password from default
- [ ] Enable HTTPS for all URLs
- [ ] Review RLS policies are enabled
- [ ] Set strong password requirements
- [ ] Enable 2FA for Supabase account
- [ ] Rotate API keys periodically
- [ ] Monitor for unauthorized access
- [ ] Backup database regularly

## Next Steps

1. **Email Notifications**: Configure Resend with your email domain
2. **Payment Gateway**: Integrate Stripe for real donations
3. **Advanced Analytics**: Add Recharts visualizations
4. **Real-time Updates**: Enable Supabase Realtime subscriptions
5. **QR Codes**: Generate shareable campaign QR codes
6. **Impact Sharing**: Export impact cards as PNG

## Support Resources

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com

## Getting Help

1. Check error messages in browser console (F12)
2. Check Vercel deployment logs
3. Check Supabase project logs
4. Review GitHub issues for similar problems
5. Contact support through respective platforms
