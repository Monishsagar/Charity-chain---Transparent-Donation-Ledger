'use client';

import { useState, useEffect } from 'react';
import { getCampaigns } from '@/lib/api';
import { CampaignWithDetails } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const data = await getCampaigns();
        setCampaigns(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    }

    loadCampaigns();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <Navbar />

      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Active Campaigns</h1>
          <p className="text-muted-foreground max-w-2xl">
            Explore campaigns making real impact across India
          </p>
        </div>
      </section>

      {/* Campaigns Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading campaigns...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No campaigns available yet</p>
              <Button asChild variant="outline">
                <Link href="/">Go to Home</Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                  <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition h-full">
                    {campaign.image_url && (
                      <div className="w-full h-48 bg-primary/10 flex items-center justify-center">
                        <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    
                    <div className="p-6">
                      <div className="mb-2">
                        <span className="inline-block px-3 py-1 bg-secondary/20 text-secondary-foreground text-sm rounded-full">
                          {campaign.category}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2 line-clamp-2">{campaign.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {campaign.description}
                      </p>

                      {/* Progress bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">₹{campaign.collected_amount?.toLocaleString() || '0'}</span>
                          <span className="text-sm text-muted-foreground">of ₹{campaign.goal_amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-accent h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min(((campaign.collected_amount || 0) / campaign.goal_amount) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      <Button className="w-full" size="sm">
                        Donate Now
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
