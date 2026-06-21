'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { getCurrentUser } from '@/lib/auth';
import { getProfile, getCampaigns, getNGOs, getDonations } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [stats, setStats] = useState({
    totalCollected: 0,
    activeCampaigns: 0,
    verifiedNgos: 0,
    happyDonors: 0,
  });

  useEffect(() => {
    async function init() {
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
            // Profile missing, treat as guest
          }
        }
      } catch {
        // Ignored
      } finally {
        setCheckingAuth(false);
      }

      // Fetch dynamic stats for guests
      try {
        const [campaigns, ngos, donations] = await Promise.all([
          getCampaigns().catch(() => []),
          getNGOs().catch(() => []),
          getDonations().catch(() => []),
        ]);

        const totalCollected = donations
          .filter((d: any) => d.status === 'completed')
          .reduce((sum: number, d: any) => sum + d.amount, 0);

        const activeCampaigns = campaigns.filter((c: any) => c.status === 'active').length;
        const verifiedNgos = ngos.length;
        const happyDonors = new Set(donations.map((d: any) => d.donor_id)).size;

        setStats({
          totalCollected,
          activeCampaigns,
          verifiedNgos,
          happyDonors,
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    }

    init();
  }, [router]);

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4 text-balance">
            Transparent Giving, Real Impact
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-balance max-w-2xl mx-auto">
            Track your donations through the complete impact chain. See exactly how your contribution creates real-world change.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/auth/register">Start Giving</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/login">Explore Campaigns</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How CharityChain Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="text-2xl">💳</div>
              </div>
              <h3 className="text-xl font-bold mb-2">Donate with Purpose</h3>
              <p className="text-muted-foreground">
                Choose campaigns that align with your values and donate securely through multiple payment methods.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="text-2xl">🔍</div>
              </div>
              <h3 className="text-xl font-bold mb-2">Track Impact</h3>
              <p className="text-muted-foreground">
                Follow your donations through every stage - from campaigns to expenditures to real-world impact.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="text-2xl">📊</div>
              </div>
              <h3 className="text-xl font-bold mb-2">Full Transparency</h3>
              <p className="text-muted-foreground">
                Public ledger of all donations and a immutable record ensures complete accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                ₹{stats.totalCollected.toLocaleString('en-IN')}
              </div>
              <p className="text-muted-foreground">Total Collected</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">
                {stats.activeCampaigns}
              </div>
              <p className="text-muted-foreground">Active Campaigns</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary mb-2">
                {stats.verifiedNgos}
              </div>
              <p className="text-muted-foreground">NGO Partners</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                {stats.happyDonors}
              </div>
              <p className="text-muted-foreground">Happy Donors</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of transparent donors creating real impact
          </p>
          <Button asChild size="lg">
            <Link href="/auth/register">Create Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2026 CharityChain. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
