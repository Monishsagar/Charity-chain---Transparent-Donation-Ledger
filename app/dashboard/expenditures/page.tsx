'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getProfile, getCampaigns, getExpenditures, createExpenditure } from '@/lib/api';
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
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'Supplies',
    proofUrls: '',
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

  async function handlePostExpenditure(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCampaign) return;
    
    setError('');
    setSuccessMsg('');

    const activeCampaign = campaigns.find(c => c.id === selectedCampaign);
    if (!activeCampaign) {
      setError('Selected campaign not found.');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid expenditure amount.');
      return;
    }

    // Cross-check: Amount must not exceed the currently available balance
    // collected_amount already reflects donations - prior expenditures (via DB trigger + api helper)
    const availableBalance = activeCampaign.collected_amount || 0;
    if (amount > availableBalance) {
      setError(
        `Insufficient funds. The expenditure amount (₹${amount.toLocaleString('en-IN')}) exceeds the available campaign balance (₹${availableBalance.toLocaleString('en-IN')}).`
      );
      return;
    }

    setSubmitting(true);

    try {
      const urlsArray = formData.proofUrls
        .split(',')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      await createExpenditure({
        campaign_id: selectedCampaign,
        title: formData.title,
        description: formData.description,
        amount,
        category: formData.category,
        proof_urls: urlsArray,
        verified: true, // Verified by default for instant feedback
      });

      setSuccessMsg('Expenditure posted successfully! It is now live on the public ledger.');
      setFormData({
        title: '',
        description: '',
        amount: '',
        category: 'Supplies',
        proofUrls: '',
      });
      setShowForm(false);

      // Reload expenditures AND campaigns (to reflect updated available balance)
      const [expendData, campaignData] = await Promise.all([
        getExpenditures(selectedCampaign),
        getCampaigns(),
      ]);
      setExpenditures(expendData);
      const user = await import('@/lib/auth').then(m => m.getCurrentUser());
      if (user) {
        const userCampaigns = campaignData.filter((c: any) => c.ngo?.user_id === user.id);
        setCampaigns(userCampaigns);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to post expenditure');
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

  const selectedCampaignObj = campaigns.find(c => c.id === selectedCampaign);
  const collected = selectedCampaignObj?.collected_amount || 0;

  return (
    <main className="min-h-screen bg-background">
      <DashboardHeader profile={profile} />

      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Expenditure Tracking</h1>
            <p className="text-muted-foreground">Post and track how funds are being spent</p>
          </div>
          <Button onClick={() => { setShowForm(!showForm); setError(''); setSuccessMsg(''); }}>
            {showForm ? 'Cancel' : 'Add Expenditure'}
          </Button>
        </div>

        {successMsg && (
          <div className="p-4 mb-6 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm">
            {successMsg}
          </div>
        )}

        {campaigns.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">No campaigns found</p>
            <Button asChild>
              <Link href="/dashboard/campaigns">Create a Campaign</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium mb-2">Select Campaign</label>
                <select
                  value={selectedCampaign}
                  onChange={(e) => {
                    setSelectedCampaign(e.target.value);
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                >
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCampaignObj && (
                <div className="bg-muted/40 border border-border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold uppercase">Available Balance</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                      ₹{collected.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">After deducting expenditures</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>Goal: ₹{selectedCampaignObj.goal_amount.toLocaleString('en-IN')}</div>
                    <div>Status: <span className="capitalize font-medium text-foreground">{selectedCampaignObj.status}</span></div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
                {error}
              </div>
            )}

            {showForm && (
              <div className="bg-card border border-border rounded-lg p-6 mb-8">
                <form onSubmit={handlePostExpenditure} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Medical Supplies Purchase"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe how the funds were used"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Amount (INR)</label>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0"
                        min="1"
                        max={collected}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                      >
                        <option value="Supplies">Supplies</option>
                        <option value="Personnel">Personnel</option>
                        <option value="Operations">Operations</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Proof URLs (comma-separated)</label>
                    <textarea
                      value={formData.proofUrls}
                      onChange={(e) => setFormData({ ...formData, proofUrls: e.target.value })}
                      placeholder="Links to receipts, photos, or documentation"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                      rows={2}
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? 'Posting...' : 'Post Expenditure'}
                  </Button>
                </form>
              </div>
            )}

            {expenditures.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <p className="text-muted-foreground">No expenditures recorded yet for this campaign.</p>
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
                          <span className={`px-2 py-1 rounded ${
                            exp.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {exp.verified ? 'Verified' : 'Pending Verification'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          ₹{exp.amount.toLocaleString('en-IN')}
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
