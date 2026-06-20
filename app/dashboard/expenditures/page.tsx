'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getProfile, getCampaigns, getExpenditures } from '@/lib/api';
import { Profile, CampaignWithDetails, Expenditure } from '@/lib/types';
import { DashboardHeader } from '@/components/dashboard/header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ExpendituresPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const profileData = await getProfile(user.id);
        if (profileData.role !== 'ngo') {
          router.push('/dashboard');
          return;
        }

        setProfile(profileData);

        const campaignData = await getCampaigns();
        const userCampaigns = campaignData.filter(c => c.ngo?.user_id === user.id);
        setCampaigns(userCampaigns);

        if (userCampaigns.length > 0) {
          setSelectedCampaign(userCampaigns[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  useEffect(() => {
    async function loadExpenditures() {
      if (!selectedCampaign) return;

      try {
        const data = await getExpenditures(selectedCampaign);
        setExpenditures(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load expenditures');
      }
    }

    loadExpenditures();
  }, [selectedCampaign]);

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
            <p className="text-red-600 mb-4">Access denied</p>
            <Button asChild variant="outline">
              <Link href="/dashboard">Go to Dashboard</Link>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Expenditure Tracking</h1>
            <p className="text-muted-foreground">Post and track how funds are being spent</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Expenditure'}
          </Button>
        </div>

        {campaigns.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">No campaigns found</p>
            <Button asChild>
              <Link href="/dashboard/campaigns">Create a Campaign</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select Campaign</label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title}
                  </option>
                ))}
              </select>
            </div>

            {showForm && (
              <div className="bg-card border border-border rounded-lg p-6 mb-8">
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Medical Supplies Purchase"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      placeholder="Describe how the funds were used"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Amount (INR)</label>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <select className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                        <option>Supplies</option>
                        <option>Personnel</option>
                        <option>Operations</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Proof URLs (comma-separated)</label>
                    <textarea
                      placeholder="Links to receipts, photos, or documentation"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={2}
                    />
                  </div>

                  <Button className="w-full">Post Expenditure</Button>
                </form>
              </div>
            )}

            {expenditures.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <p className="text-muted-foreground">No expenditures recorded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expenditures.map((exp) => (
                  <div key={exp.id} className="bg-card border border-border rounded-lg p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{exp.title}</h3>
                        <p className="text-muted-foreground text-sm mb-3">{exp.description}</p>
                        <div className="flex gap-4 text-sm">
                          <span className="bg-secondary/20 px-2 py-1 rounded">
                            {exp.category}
                          </span>
                          {exp.verified && (
                            <span className="bg-accent/20 text-accent-foreground px-2 py-1 rounded">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          ₹{exp.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
