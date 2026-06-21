'use client';

import { useState, useEffect, use } from 'react';
import { getNGO, getCampaigns } from '@/lib/api';
import { NGO, CampaignWithDetails } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';

export default function NGODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const [ngo, setNgo] = useState<NGO | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const ngoData = await getNGO(id);
        setNgo(ngoData);
        
        const campaignData = await getCampaigns(id);
        setCampaigns(campaignData);
      } catch (err: any) {
        setError(err.message || 'Failed to load NGO');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  if (error || !ngo) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-red-600 mb-4">{error || 'NGO not found'}</p>
          <Button asChild variant="outline">
            <Link href="/ngos">Back to NGOs</Link>
          </Button>
        </div>
      </main>
    );
  }

  const totalCollected = campaigns.reduce((sum, c) => sum + (c.collected_amount || 0), 0);

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <Navbar />


      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Button asChild variant="outline" size="sm" className="mb-6">
          <Link href="/ngos">← Back to NGOs</Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - NGO Info */}
          <div className="lg:col-span-2">
            {ngo.logo_url && (
              <div className="w-full h-64 bg-primary/10 rounded-lg overflow-hidden mb-6 flex items-center justify-center p-4">
                <img src={ngo.logo_url} alt={ngo.name} className="max-w-full max-h-full object-contain" />
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-4xl font-bold">{ngo.name}</h1>
                <span className="inline-block px-3 py-1 bg-accent/20 text-accent-foreground text-sm rounded-full">
                  Verified
                </span>
              </div>
              {ngo.website && (
                <a href={ngo.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {ngo.website}
                </a>
              )}
            </div>

            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Our Mission</h2>
              <p className="text-foreground leading-relaxed">{ngo.mission}</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">About</h2>
              <p className="text-foreground leading-relaxed">{ngo.description}</p>
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-4">
              <h3 className="text-lg font-bold mb-4">Impact Overview</h3>

              <div className="space-y-4">
                <div className="border-b border-border pb-4">
                  <div className="text-sm text-muted-foreground mb-1">Active Campaigns</div>
                  <div className="text-3xl font-bold text-primary">{campaigns.length}</div>
                </div>

                <div className="border-b border-border pb-4">
                  <div className="text-sm text-muted-foreground mb-1">Total Collected</div>
                  <div className="text-3xl font-bold text-accent">₹{totalCollected.toLocaleString('en-IN')}</div>
                </div>

                <div className="pb-4">
                  <div className="text-sm text-muted-foreground mb-1">Verification Status</div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-accent rounded-full"></span>
                    <span className="font-medium">Verified Organization</span>
                  </div>
                </div>
              </div>

              {ngo.verification_notes && (
                <div className="mt-4 p-4 bg-primary/5 rounded text-sm">
                  <p className="text-muted-foreground">{ngo.verification_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Campaigns Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Active Campaigns</h2>
          {campaigns.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground">No active campaigns at this time</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                  <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition h-full">
                    {campaign.image_url && (
                      <div className="w-full h-40 bg-primary/10 flex items-center justify-center">
                        <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    
                    <div className="p-4">
                      <h3 className="font-bold mb-1 line-clamp-1">{campaign.title}</h3>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{campaign.description}</p>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>₹{(campaign.collected_amount || 0).toLocaleString()}</span>
                          <span className="text-muted-foreground">of ₹{campaign.goal_amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-accent h-2 rounded-full"
                            style={{
                              width: `${Math.min(((campaign.collected_amount || 0) / campaign.goal_amount) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      <Button className="w-full" size="sm">
                        Donate
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
