# CharityChain - Transparent Donation Platform

A production-ready Next.js 16 application for tracking donations through the complete impact chain. Built with React 19, TypeScript, Tailwind CSS v4, and Supabase.

## Features

### Core Functionality
- **Donor Dashboard**: Track donations, view impact timeline, and see how funds are being used
- **NGO Dashboard**: Create campaigns, post expenditures, and manage fund utilization
- **Public Ledger**: Immutable record of all completed donations and no delete policy
- **Impact Attribution**: Automatic linking of donations to expenditures with real-world impact metrics
- **Transparent Campaigns**: Browse active campaigns with detailed progress tracking
- **NGO Directory**: Verified non-profits with mission statements and active campaigns

### Technical Features
- Authentication with email + password
- Role-based access control (donor, ngo, admin)
- Complete audit trail with immutable donation records
- RLS (Row Level Security) policies for data protection
- Server Actions for mutation operations
- Real-time data synchronization via Supabase Realtime

## Setup Instructions

### 1. Supabase Configuration

Create a Supabase project and run the schema setup:

```sql
-- Execute the SQL in scripts/setup-database.sql in your Supabase SQL editor
```

Key tables created:
- `profiles` - User accounts with roles
- `ngos` - Non-profit organizations
- `campaigns` - Fundraising campaigns
- `donations` - Donation records (immutable)
- `expenditures` - Fund utilization records
- `impact_attributions` - Links donations to outcomes

### 2. Environment Variables

Create `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-api-key (optional for email)
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run Development Server

```bash
pnpm dev
```

Visit http://localhost:3000

## Project Structure

```
app/
├── page.tsx                 # Landing page
├── auth/
│   ├── login/              # Login page
│   └── register/           # Registration page
├── campaigns/
│   ├── page.tsx            # Campaign listings
│   └── [id]/page.tsx       # Campaign details
├── ngos/
│   ├── page.tsx            # NGO directory
│   └── [id]/page.tsx       # NGO profile
├── ledger/
│   └── page.tsx            # Public donation ledger
├── dashboard/
│   ├── page.tsx            # Main dashboard (donor/ngo)
│   ├── campaigns/          # NGO campaign management
│   └── expenditures/       # Expenditure tracking
└── admin/
    ├── page.tsx            # Admin dashboard
    ├── ngos/               # NGO verification queue
    └── expenditures/       # Expenditure verification

components/
├── auth/                   # Authentication forms
├── dashboard/              # Dashboard components
└── ui/                     # Shadcn UI components

lib/
├── supabase.ts            # Supabase client setup
├── auth.ts                # Authentication utilities
├── api.ts                 # Database operations
└── types.ts               # TypeScript type definitions
```

## Key Implementation Details

### Authentication Flow

1. User registers with email, password, full name, and role (donor/ngo)
2. Supabase creates auth user and profile record
3. JWT token stored in browser session
4. Protected routes check `getCurrentUser()` before rendering

### Donation Tracking

1. Donor navigates to campaigns and selects one to donate
2. Donation record created with status 'pending'
3. After payment confirmation, status changes to 'completed'
4. Campaign `collected_amount` automatically updated
5. Impact attributions created linking donation to expenditures

### NGO Verification

1. NGO completes registration and profile setup
2. Admin reviews NGO in `/admin/ngos` page
3. Upon approval, `verified` flag set to true
4. NGO profile becomes visible in public directory

### Expenditure Verification

1. NGO posts expenditure with title, amount, category, and proof URLs
2. Expenditure record created with `verified = false`
3. Admin reviews in `/admin/expenditures` page
4. Upon approval, marked as verified and visible in public impact chain
5. Automatic impact attribution to relevant donations

## Database Schema Highlights

### Donations Table
- **Immutable**: No UPDATE or DELETE policies
- **Status tracking**: pending → completed → failed
- **Payment methods**: upi, card, bank
- **Indexed**: By campaign_id, donor_id, status for fast queries

### RLS Policies
- Public can read all completed donations
- Donors see only their own donations
- NGOs see donations to their campaigns
- No one can delete donations (audit trail)

## Design System

**Color Palette:**
- **Primary**: Deep Indigo (#5540C1)
- **Accent**: Forest Green (#45B069)
- **Secondary**: Saffron (#BFA12E)
- **Neutrals**: White, grays, black variants

**Typography:**
- Headings & Body: Geist Sans
- Monospace: Geist Mono
- Leading: 1.4-1.6 for readability

**Layout:**
- Mobile-first responsive design
- Flexbox for most layouts, CSS Grid for complex 2D layouts
- Consistent spacing using Tailwind scale

## Deployment

### Vercel Deployment

```bash
# Push to GitHub
git push origin main

# Deploy on Vercel dashboard
# Configure environment variables in Vercel settings
# Set: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
```

### Database Backups

Supabase automatically backs up your data. Enable point-in-time recovery in project settings.

## Sample Data

To seed sample data:

1. Create admin user in Supabase
2. Create verified NGOs via `/dashboard/campaigns`
3. Create campaigns with goals
4. Simulate donations via admin panel
5. Post expenditures from NGO dashboard
6. Verify expenditures as admin

## Future Enhancements

- Real-time notifications via Supabase Realtime
- Payment gateway integration (UPI, card, bank transfer)
- Shareable impact cards with html2canvas
- Impact metrics dashboard with Recharts visualizations
- Email notifications via Resend
- QR code generation for campaign sharing (qrcode)
- Advanced search and filtering
- Donor recognition program

## Support

For issues or questions:
1. Check Supabase documentation
2. Review Next.js 16 App Router guide
3. Consult shadcn/ui component documentation
4. Open GitHub issues

## License

MIT
