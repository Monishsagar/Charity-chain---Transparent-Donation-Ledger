'use client';

import { Profile } from '@/lib/types';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DashboardHeaderProps {
  profile: Profile;
}

export function DashboardHeader({ profile }: DashboardHeaderProps) {
  const router = useRouter();
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

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold text-primary hover:text-primary/80">
            CharityChain
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/dashboard" className="text-foreground hover:text-primary transition">
              Dashboard
            </Link>
            {profile.role === 'ngo' && (
              <>
                <Link href="/dashboard/campaigns" className="text-foreground hover:text-primary transition">
                  Campaigns
                </Link>
                <Link href="/dashboard/expenditures" className="text-foreground hover:text-primary transition">
                  Expenditures
                </Link>
              </>
            )}
            <Link href="/campaigns" className="text-foreground hover:text-primary transition">
              Public
            </Link>
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
