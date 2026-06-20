'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getProfile, getNGOs, getExpenditures } from '@/lib/api';
import { Profile, NGO, Expenditure } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [pendingExpenditures, setPendingExpenditures] = useState<Expenditure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const profileData = await getProfile(user.id);
        if (profileData.role !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setProfile(profileData);
      } catch (err: any) {
        setError(err.message || 'Failed to authenticate');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Access denied'}</p>
            <Button asChild variant="outline">
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary hover:text-primary/80">
            CharityChain Admin
          </Link>
          <div className="flex gap-4">
            <Link href="/admin/ngos" className="text-foreground hover:text-primary transition">
              NGO Verification
            </Link>
            <Link href="/admin/expenditures" className="text-foreground hover:text-primary transition">
              Expenditures
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage platform verification and content moderation</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-1">Pending NGO Verification</div>
            <div className="text-3xl font-bold text-primary">0</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-1">Pending Expenditure Verification</div>
            <div className="text-3xl font-bold text-accent">0</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-1">Verified NGOs</div>
            <div className="text-3xl font-bold text-secondary">0</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-sm text-muted-foreground mb-1">Active Campaigns</div>
            <div className="text-3xl font-bold text-primary">0</div>
          </div>
        </div>

        {/* Verification Queues */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* NGO Verification */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">NGO Verification Queue</h2>
              <Button asChild>
                <Link href="/admin/ngos">View All</Link>
              </Button>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 min-h-64 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p>No pending NGO verification requests</p>
              </div>
            </div>
          </div>

          {/* Expenditure Verification */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Expenditure Verification Queue</h2>
              <Button asChild>
                <Link href="/admin/expenditures">View All</Link>
              </Button>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 min-h-64 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p>No pending expenditure verification</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Platform Activity</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-center py-8">No recent activity</p>
          </div>
        </div>
      </div>
    </main>
  );
}
