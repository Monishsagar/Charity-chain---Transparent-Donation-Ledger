'use client';

import { Profile } from '@/lib/types';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

interface DashboardHeaderProps {
  profile: Profile;
}

export function DashboardHeader({ profile }: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.push('/');
    } catch (err) {
      console.error('Sign out failed:', err);
      setSigningOut(false);
    }
  }

  const linkClass = (path: string) => {
    const isActive = pathname === path;
    return `text-foreground transition hover:text-primary ${
      isActive ? 'font-semibold border-b-2 border-primary' : ''
    }`;
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground px-2"
            >
              ← Back
            </Button>
            <Link href="/" className="text-2xl font-bold text-primary hover:text-primary/80">
              CharityChain
            </Link>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/dashboard" className={linkClass('/dashboard')}>
              Dashboard
            </Link>
            {profile.role === 'ngo' ? (
              <>
                <Link href="/dashboard/campaigns" className={linkClass('/dashboard/campaigns')}>
                  Campaigns
                </Link>
                <Link href="/dashboard/expenditures" className={linkClass('/dashboard/expenditures')}>
                  Expenditures
                </Link>
                <Link href="/ledger" className={linkClass('/ledger')}>
                  Ledger
                </Link>
              </>
            ) : (
              <>
                <Link href="/campaigns" className={linkClass('/campaigns')}>
                  Campaigns
                </Link>
                <Link href="/ledger" className={linkClass('/ledger')}>
                  Ledger
                </Link>
                <Link href="/ngos" className={linkClass('/ngos')}>
                  NGOs
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">{profile.full_name}</span>
            <span className="inline-block px-2 py-1 bg-primary/20 text-primary text-xs rounded">
              {profile.role === 'ngo' ? 'NGO' : 'Donor'}
            </span>
          </div>

          <Button
            onClick={handleSignOut}
            disabled={signingOut}
            variant="outline"
            size="sm"
          >
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>
      </div>
    </header>
  );
}
