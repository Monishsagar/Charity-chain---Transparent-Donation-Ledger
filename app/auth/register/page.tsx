'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RegisterForm } from '@/components/auth/register-form';
import Link from 'next/link';
import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { getProfile } from '@/lib/api';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getCurrentUser();
        if (user) {
          try {
            const profile = await getProfile(user.id);
            if (profile) {
              router.replace('/dashboard');
              return;
            }
          } catch {
            // Profile missing
          }
        }
      } catch {
        // Ignored
      } finally {
        setChecking(false);
      }
    }
    checkAuth();
  }, [router]);

  if (checking) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <Link href="/" className="text-2xl font-bold text-primary hover:text-primary/80">
            CharityChain
          </Link>
        </div>

        {/* Alert banner if redirected due to missing profile */}
        {reason === 'no_profile' && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <strong>Account setup incomplete.</strong> Your previous account was signed out because your profile was not found in the database. Please re-register below to create a fresh account.
          </div>
        )}

        {/* Main content */}
        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-xl border border-border shadow-lg p-8">
            <h1 className="text-2xl font-bold mb-2">Create Account</h1>
            <p className="text-muted-foreground mb-6">
              Join CharityChain to track transparent giving
            </p>

            <RegisterForm />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </main>
    }>
      <RegisterContent />
    </Suspense>
  );
}
