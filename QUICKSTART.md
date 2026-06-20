# CharityChain Quick Start Guide

Get CharityChain running in 5 minutes.

## 1. Setup (2 minutes)

### Create Supabase Project
1. Visit https://supabase.com → New Project
2. Fill in project name, password, region
3. Wait for initialization

### Copy Credentials
In Supabase project:
- Settings → API
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `Anon Key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Settings → Database → Connection Pooling
  - `Service Role Key` → `SUPABASE_SERVICE_ROLE_KEY`

### Create .env.local
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## 2. Database (1 minute)

1. In Supabase, go to SQL Editor
2. Create new query
3. Copy `scripts/setup-database.sql`
4. Paste and run
5. Wait for completion

## 3. Install & Run (2 minutes)

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

## 4. Create Test Accounts

### Admin Account
- Go to `/auth/register`
- Email: `admin@test.com`
- Name: `Admin`
- Role: NGO
- After registration, in Supabase:
  - profiles table → find your user
  - Change role to `'admin'`

### NGO Account
- Register: `ngo@test.com` / Name: `Health Org` / Role: NGO
- Go to `/dashboard/campaigns`
- Create campaign

### Donor Account
- Register: `donor@test.com` / Name: `John` / Role: Donor
- Go to `/dashboard`
- View donation stats

### View Public Pages
- Landing: http://localhost:3000
- Campaigns: http://localhost:3000/campaigns
- NGOs: http://localhost:3000/ngos
- Ledger: http://localhost:3000/ledger

## 5. Deploy (Optional)

```bash
git push origin main  # Push to GitHub
```

- Go to Vercel → Import Repository
- Add environment variables (same 3 keys)
- Deploy

## File Locations

| Page | URL | File |
|------|-----|------|
| Landing | `/` | `app/page.tsx` |
| Login | `/auth/login` | `app/auth/login/page.tsx` |
| Register | `/auth/register` | `app/auth/register/page.tsx` |
| Campaigns | `/campaigns` | `app/campaigns/page.tsx` |
| Campaign Detail | `/campaigns/[id]` | `app/campaigns/[id]/page.tsx` |
| NGO Directory | `/ngos` | `app/ngos/page.tsx` |
| NGO Profile | `/ngos/[id]` | `app/ngos/[id]/page.tsx` |
| Ledger | `/ledger` | `app/ledger/page.tsx` |
| Dashboard | `/dashboard` | `app/dashboard/page.tsx` |
| Campaigns Mgmt | `/dashboard/campaigns` | `app/dashboard/campaigns/page.tsx` |
| Expenditures | `/dashboard/expenditures` | `app/dashboard/expenditures/page.tsx` |
| Admin | `/admin` | `app/admin/page.tsx` |
| Admin NGOs | `/admin/ngos` | `app/admin/ngos/page.tsx` |
| Admin Expenditures | `/admin/expenditures` | `app/admin/expenditures/page.tsx` |

## Key Features Checklist

- [x] User authentication (email + password)
- [x] Role-based access (donor/ngo/admin)
- [x] Campaign listings with progress
- [x] Donation tracking
- [x] Public ledger
- [x] NGO directory
- [x] Donor dashboard
- [x] NGO dashboard
- [x] Admin verification
- [x] Responsive design
- [x] TypeScript support
- [x] Tailwind CSS v4

## Common Commands

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start

# Format code
pnpm format

# Type check
pnpm tsc --noEmit
```

## Troubleshooting

**"Cannot find module '@supabase/supabase-js'"**
- Run: `pnpm install`

**"Supabase connection error"**
- Check `.env.local` has correct URLs
- Verify Supabase project is active

**"Unexpected error in database query"**
- Run SQL schema again in Supabase
- Check RLS policies are enabled

**"Port 3000 already in use"**
- Use different port: `pnpm dev -- -p 3001`

**"Cannot authenticate"**
- Check profiles table has your user
- Verify role is set correctly

## Architecture Overview

```
┌─────────────────────┐
│   Next.js Frontend  │
│  (React 19 + TS)    │
└──────────┬──────────┘
           │
    ┌──────▼──────┐
    │   Supabase  │
    │  (Backend)  │
    │             │
    │ ┌─────────┐ │
    │ │ Auth    │ │
    │ ├─────────┤ │
    │ │Database │ │
    │ ├─────────┤ │
    │ │Storage  │ │
    │ └─────────┘ │
    └─────────────┘
```

## Next Steps

1. Customize colors in `app/globals.css`
2. Add your organization logo
3. Connect payment gateway
4. Setup email notifications
5. Deploy to production

## Documentation

- **README.md** - Full project overview
- **SETUP.md** - Detailed setup guide
- **IMPLEMENTATION.md** - Technical details

---

**You're all set!** Start building with CharityChain.
