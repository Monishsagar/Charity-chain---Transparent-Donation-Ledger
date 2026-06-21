'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getProfile, getCampaigns, createCampaign } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Profile, NGO, CampaignWithDetails } from '@/lib/types';
import { DashboardHeader } from '@/components/dashboard/header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NGOCampaignsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ngo, setNgo] = useState<NGO | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_amount: '',
    category: 'health',
  });

  async function loadData() {
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

      // Fetch this NGO's own record
      const { data: ngoData, error: ngoErr } = await supabase
        .from('ngos')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (ngoErr || !ngoData) {
        setError('Your NGO profile could not be found. Please contact support.');
        setLoading(false);
        return;
      }
      setNgo(ngoData);

      // Load this NGO's campaigns
      const campaignData = await getCampaigns(ngoData.id);
      setCampaigns(campaignData);
    } catch (err: any) {
      setError(err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [router]);

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!ngo) {
      setError('NGO profile not found. Cannot create campaign.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      await createCampaign({
        ngo_id: ngo.id,
        title: formData.title,
        description: formData.description,
        goal_amount: parseFloat(formData.goal_amount),
        category: formData.category,
        status: 'active',
      });

      setFormData({ title: '', description: '', goal_amount: '', category: 'health' });
      setShowForm(false);
      setSuccessMsg('Campaign created successfully!');
      // Reload campaigns
      const campaignData = await getCampaigns(ngo.id);
      setCampaigns(campaignData);
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
          <Button onClick={() => { setShowForm(!showForm); setError(''); setSuccessMsg(''); }}>
            {showForm ? 'Cancel' : 'Create Campaign'}
          </Button>
        </div>

        {successMsg && (
          <div className="p-4 mb-6 bg-green-50 text-green-700 rounded-lg border border-green-200">
            {successMsg}
          </div>
        )}

        {showForm && (
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">New Campaign</h2>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Campaign Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Clean Water Initiative"
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
                  placeholder="Describe the campaign goals and impact..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Goal Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.goal_amount}
                    onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    min="1000"
                    placeholder="e.g. 100000"
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
                    <option value="water">Clean Water</option>
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
            <p className="text-muted-foreground mb-4">No campaigns yet. Create your first campaign to start receiving donations!</p>
            <Button onClick={() => setShowForm(true)}>Create Your First Campaign</Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block px-2 py-1 bg-secondary/20 text-secondary-foreground text-xs rounded-full capitalize">
                    {campaign.category}
                  </span>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    campaign.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                  }`}>
                    {campaign.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold mb-2">{campaign.title}</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{campaign.description}</p>

                <div className="space-y-2 mb-4 pb-4 border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span>Goal</span>
                    <span className="font-medium">₹{campaign.goal_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Collected</span>
                    <span className="font-medium text-green-600">₹{(campaign.collected_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-1">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(((campaign.collected_amount || 0) / campaign.goal_amount) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <Button asChild className="w-full" variant="outline" size="sm">
                  <Link href={`/campaigns/${campaign.id}`}>View Public Page</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
