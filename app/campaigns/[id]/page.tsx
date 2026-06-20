'use client';

import { useState, useEffect } from 'react';
import { getCampaign, getExpenditures } from '@/lib/api';
import { CampaignWithDetails, Expenditure } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<CampaignWithDetails | null>(null);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const campaignData = await getCampaign(params.id);
        setCampaign(campaignData);
        
        const expendData = await getExpenditures(params.id);
        setExpenditures(expendData);
      } catch (err: any) {
        setError(err.message || 'Failed to load campaign');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <nav className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="text-2xl font-bold text-primary">
              CharityChain
            </Link>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  if (error || !campaign) {
    return (
      <main className="min-h-screen bg-background">
        <nav className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="text-2xl font-bold text-primary">
              CharityChain
            </Link>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-red-600 mb-4">{error || 'Campaign not found'}</p>
          <Button asChild variant="outline">
            <Link href="/campaigns">Back to Campaigns</Link>
          </Button>
        </div>
      </main>
    );
  }

  const progress = (campaign.collected_amount || 0) / campaign.goal_amount * 100;

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary hover:text-primary/80">
            CharityChain
          </Link>
          <div className="flex gap-4">
            <Link href="/campaigns" className="text-foreground hover:text-primary transition">
              Campaigns
            </Link>
            <Link href="/ledger" className="text-foreground hover:text-primary transition">
              Ledger
            </Link>
            <Link href="/ngos" className="text-foreground hover:text-primary transition">
              NGOs
            </Link>
            <Button asChild variant="default" size="sm">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Button asChild variant="outline" size="sm" className="mb-6">
          <Link href="/campaigns">← Back to Campaigns</Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Campaign Info */}
          <div className="lg:col-span-2">
            {campaign.image_url && (
              <div className="w-full h-96 bg-primary/10 rounded-lg overflow-hidden mb-6">
                <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-secondary/20 text-secondary-foreground text-sm rounded-full mb-4">
                {campaign.category}
              </span>
              <h1 className="text-4xl font-bold mb-2">{campaign.title}</h1>
              {campaign.ngo && (
                <Link href={`/ngos/${campaign.ngo.id}`} className="text-primary hover:underline">
                  by {campaign.ngo.name}
                </Link>
              )}
            </div>

            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">About this Campaign</h2>
              <p className="text-foreground leading-relaxed">{campaign.description}</p>
            </div>

            {/* Expenditures */}
            {expenditures.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Impact & Expenditures</h2>
                <div className="space-y-4">
                  {expenditures.map((exp) => (
                    <div key={exp.id} className="border border-border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold">{exp.title}</h3>
                        <span className="text-sm bg-accent/20 text-accent-foreground px-2 py-1 rounded">
                          {exp.verified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{exp.description}</p>
                      <div className="text-sm font-medium">₹{exp.amount.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Donation Card */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-4">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Progress</span>
                  <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-accent h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 mb-6 pb-6 border-b border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Collected</span>
                  <span className="font-bold">₹{(campaign.collected_amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Goal</span>
                  <span className="font-bold">₹{campaign.goal_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-bold text-accent">
                    ₹{Math.max(campaign.goal_amount - (campaign.collected_amount || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <Button className="w-full mb-3">
                Donate Now
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/register">Create Account to Track</Link>
              </Button>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                Sign in to track your donation&apos;s impact
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
