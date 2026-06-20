'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getProfile, getDonations, getCampaigns } from '@/lib/api';
import { Profile, Donation, CampaignWithDetails } from '@/lib/types';
import { DashboardHeader } from '@/components/dashboard/header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([]);
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
        setProfile(profileData);

        if (profileData.role === 'donor') {
          const donationData = await getDonations(user.id);
          setDonations(donationData);
        } else if (profileData.role === 'ngo') {
          const campaignData = await getCampaigns();
          const userCampaigns = campaignData.filter(c => c.ngo?.user_id === user.id);
          setCampaigns(userCampaigns);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
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

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Failed to load profile'}</p>
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
      <DashboardHeader profile={profile} />

      <div className="container mx-auto px-4 py-12">
        {profile.role === 'donor' ? (
          // Donor Dashboard
          <>
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Welcome, {profile.full_name}</h1>
              <p className="text-muted-foreground">Track your donations and impact</p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-sm text-muted-foreground mb-1">Total Donated</div>
                <div className="text-3xl font-bold text-primary">
                  ₹{donations.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-sm text-muted-foreground mb-1">Donations</div>
                <div className="text-3xl font-bold text-accent">{donations.length}</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-sm text-muted-foreground mb-1">Completed</div>
                <div className="text-3xl font-bold text-secondary">
                  {donations.filter(d => d.status === 'completed').length}
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-sm text-muted-foreground mb-1">Impact Score</div>
                <div className="text-3xl font-bold text-primary">+{Math.min(donations.length * 10, 100)}</div>
              </div>
            </div>

            {/* Donations List */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Your Donations</h2>
                <Button asChild>
                  <Link href="/campaigns">Donate More</Link>
                </Button>
              </div>

              {donations.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-12 text-center">
                  <p className="text-muted-foreground mb-4">You haven&apos;t made any donations yet</p>
                  <Button asChild>
                    <Link href="/campaigns">Explore Campaigns</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {donations.map((donation) => (
                    <div key={donation.id} className="bg-card border border-border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold">{donation.campaign?.title || 'Unknown Campaign'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(donation.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-accent">₹{donation.amount.toLocaleString()}</div>
                          <span className={`inline-block px-2 py-1 text-xs rounded ${
                            donation.status === 'completed'
                              ? 'bg-accent/20 text-accent-foreground'
                              : donation.status === 'pending'
                              ? 'bg-secondary/20 text-secondary-foreground'
                              : 'bg-red-50 text-red-600'
                          }`}>
                            {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      {donation.message && (
                        <p className="text-sm text-foreground mt-2 italic">&quot;{donation.message}&quot;</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          // NGO Dashboard
          <>
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">NGO Dashboard</h1>
              <p className="text-muted-foreground">Manage your campaigns and track donations</p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-sm text-muted-foreground mb-1">Active Campaigns</div>
                <div className="text-3xl font-bold text-primary">{campaigns.length}</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-sm text-muted-foreground mb-1">Total Collected</div>
                <div className="text-3xl font-bold text-accent">
                  ₹{campaigns.reduce((sum, c) => sum + (c.collected_amount || 0), 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-sm text-muted-foreground mb-1">Donors</div>
                <div className="text-3xl font-bold text-secondary">
                  {new Set(campaigns.flatMap(c => c.donations?.map(d => d.donor_id))).size}
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-sm text-muted-foreground mb-1">Pending Verification</div>
                <div className="text-3xl font-bold text-primary">0</div>
              </div>
            </div>

            {/* Campaigns List */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Your Campaigns</h2>
                <Button asChild>
                  <Link href="/dashboard/campaigns">Create Campaign</Link>
                </Button>
              </div>

              {campaigns.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-12 text-center">
                  <p className="text-muted-foreground mb-4">No campaigns created yet</p>
                  <Button asChild>
                    <Link href="/dashboard/campaigns">Create First Campaign</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="bg-card border border-border rounded-lg overflow-hidden">
                      <div className="p-6">
                        <h3 className="text-lg font-bold mb-2">{campaign.title}</h3>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{campaign.description}</p>

                        <div className="mb-4">
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

                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm" className="flex-1">
                            <Link href={`/campaigns/${campaign.id}`}>View</Link>
                          </Button>
                          <Button asChild size="sm" className="flex-1">
                            <Link href={`/dashboard/campaigns/${campaign.id}`}>Manage</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
