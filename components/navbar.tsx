'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from '@/lib/auth';
import { getProfile } from '@/lib/api';
import { Profile } from '@/lib/types';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Whether we're on the public landing page
  const isLandingPage = pathname === '/';

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getCurrentUser();
        if (user) {
          try {
            const profileData = await getProfile(user.id);
            setProfile(profileData);
          } catch {
            // User exists in auth but has no profile row — treat as logged out
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [pathname]);

  // On the home page, if user is already signed in, redirect to dashboard
  useEffect(() => {
    if (!loading && profile && isLandingPage) {
      router.replace('/dashboard');
    }
  }, [loading, profile, isLandingPage, router]);

  async function handleSignOut() {
    try {
      await signOut();
      setProfile(null);
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }

  const linkClass = (path: string) => {
    const isActive = pathname === path || pathname.startsWith(path + '/');
    return `text-foreground transition hover:text-primary py-1 ${
      isActive ? 'font-semibold border-b-2 border-primary' : ''
    }`;
  };

  // Show nav links only when the user is logged in
  const showNavLinks = profile !== null;


  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!isLandingPage && (
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground px-2"
            >
              ← Back
            </Button>
          )}
          <Link href={profile ? '/dashboard' : '/'} className="text-2xl font-bold text-primary hover:text-primary/80">
            CharityChain
          </Link>
        </div>
        <div className="flex gap-6 items-center">
          {showNavLinks && (
            <>
              {profile?.role === 'ngo' ? (
                <>
                  <Link href="/dashboard" className={linkClass('/dashboard')}>
                    Dashboard
                  </Link>
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
                  {profile && (
                    <Link href="/dashboard" className={linkClass('/dashboard')}>
                      Dashboard
                    </Link>
                  )}
                </>
              )}
            </>
          )}

          {!loading && (
            profile ? (
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline text-sm text-muted-foreground">
                  {profile.full_name}
                </span>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button asChild variant="default" size="sm">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              </div>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
