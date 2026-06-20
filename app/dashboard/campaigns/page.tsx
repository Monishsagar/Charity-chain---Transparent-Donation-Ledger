'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getProfile, getCampaigns, createCampaign } from '@/lib/api';
import { Profile, CampaignWithDetails } from '@/lib/types';
import { DashboardHeader } from '@/components/dashboard/header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NGOCampaignsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_amount: '',
    category: 'health',
  });

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
      } catch (err: any) {
        setError(err.message || 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const ngo = await getProfile(user.id).then(p => {
        // Get NGO ID - this would need to be fetched from the ngos table
        // For now, we'll just create with the data
        return null;
      });

      // This would need proper NGO association
      // await createCampaign({
      //   ngo_id: ngo.id,
      //   ...formData,
      //   goal_amount: parseFloat(formData.goal_amount),
      //   status: 'active',
      // });

      setFormData({ title: '', description: '', goal_amount: '', category: 'health' });
      setShowForm(false);
      // Reload campaigns
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  }

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
            <h1 className="text-4xl font-bold mb-2">Campaign Management</h1>
            <p className="text-muted-foreground">Create and manage your fundraising campaigns</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Create Campaign'}
          </Button>
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Campaign Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Goal Amount (INR)</label>
                  <input
                    type="number"
                    value={formData.goal_amount}
                    onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    min="1000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="health">Health</option>
                    <option value="education">Education</option>
                    <option value="disaster">Disaster Relief</option>
                    <option value="environment">Environment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Campaign'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {campaigns.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">No campaigns yet</p>
            <Button onClick={() => setShowForm(true)}>Create Your First Campaign</Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-bold mb-2">{campaign.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{campaign.description}</p>

                <div className="space-y-2 mb-4 pb-4 border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span>Goal</span>
                    <span className="font-medium">₹{campaign.goal_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Collected</span>
                    <span className="font-medium">₹{(campaign.collected_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Donors</span>
                    <span className="font-medium">{campaign.donations?.length || 0}</span>
                  </div>
                </div>

                <Button asChild className="w-full">
                  <Link href={`/campaigns/${campaign.id}`}>View Campaign</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
