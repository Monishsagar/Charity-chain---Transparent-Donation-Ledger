'use client';

import { useState, useEffect, use } from 'react';
import { getCampaign, getExpenditures, createDonation, getProfile } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { CampaignWithDetails, Expenditure } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const [campaign, setCampaign] = useState<CampaignWithDetails | null>(null);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Donation states
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showDonationForm, setShowDonationForm] = useState(false);
  // Multi-step donation: 1=amount+message, 2=method, 3=payment details
  const [donationStep, setDonationStep] = useState<1 | 2 | 3>(1);
  const [donationAmount, setDonationAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'bank'>('upi');
  const [donationMessage, setDonationMessage] = useState('');
  const [donating, setDonating] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);

  // UPI fields
  const [upiId, setUpiId] = useState('');
  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  // Net Banking fields
  const [selectedBank, setSelectedBank] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  async function loadData() {
    try {
      const campaignData = await getCampaign(id);
      setCampaign(campaignData);
      
      const expendData = await getExpenditures(id);
      setExpenditures(expendData);

      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        try {
          const profileData = await getProfile(currentUser.id);
          setUserProfile(profileData);
        } catch {
          setUserProfile(null);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  function openDonationForm() {
    setShowDonationForm(true);
    setDonationStep(1);
    setDonationSuccess(false);
    setError('');
    setDonationAmount('');
    setDonationMessage('');
    setPaymentMethod('upi');
    setUpiId('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
    setSelectedBank('');
    setBankAccount('');
    setBankIfsc('');
  }

  function handleStep1Next(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount < 10) {
      setError('Please enter a valid donation amount (min ₹10).');
      return;
    }
    setError('');
    setDonationStep(2);
  }

  function handleStep2Next(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setDonationStep(3);
  }

  async function handleDonate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setError('You must be signed in to make a donation.');
      return;
    }
    // Payment-method specific validation
    if (paymentMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setError('Please enter a valid UPI ID (e.g. name@upi).');
        return;
      }
    } else if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        setError('Please enter a valid 16-digit card number.');
        return;
      }
      if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) {
        setError('Please enter a valid expiry date (MM/YY).');
        return;
      }
      if (cardCvv.length < 3) {
        setError('Please enter a valid CVV.');
        return;
      }
      if (!cardName.trim()) {
        setError('Please enter the cardholder name.');
        return;
      }
    } else if (paymentMethod === 'bank') {
      if (!selectedBank) {
        setError('Please select a bank.');
        return;
      }
      if (!bankAccount.trim() || bankAccount.length < 8) {
        setError('Please enter a valid account number (min 8 digits).');
        return;
      }
      if (!bankIfsc.trim() || bankIfsc.length < 11) {
        setError('Please enter a valid IFSC code (11 characters).');
        return;
      }
    }

    setDonating(true);
    setError('');

    try {
      await createDonation({
        campaign_id: id,
        donor_id: user.id,
        amount: parseFloat(donationAmount),
        currency: 'INR',
        status: 'completed',
        payment_method: paymentMethod,
        transaction_id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        message: donationMessage,
      });

      setDonationSuccess(true);
      setShowDonationForm(false);
      setDonationAmount('');
      setDonationMessage('');

      // Reload campaign (balance) and expenditures
      const [campaignData, expendData] = await Promise.all([
        getCampaign(id),
        getExpenditures(id),
      ]);
      setCampaign(campaignData);
      setExpenditures(expendData);
    } catch (err: any) {
      setError(err.message || 'Failed to complete donation. Ensure database RLS allows inserts.');
    } finally {
      setDonating(false);
    }
  }

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

  if (error && !campaign) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-red-600 mb-4">{error || 'Campaign not found'}</p>
          <Button asChild variant="outline">
            <Link href="/campaigns">Back to Campaigns</Link>
          </Button>
        </div>
      </main>
    );
  }

  const campaignData = campaign!;
  const progress = (campaignData.collected_amount || 0) / campaignData.goal_amount * 100;

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Button asChild variant="outline" size="sm" className="mb-6">
          <Link href="/campaigns">← Back to Campaigns</Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Campaign Info */}
          <div className="lg:col-span-2">
            {campaignData.image_url && (
              <div className="w-full h-96 bg-primary/10 rounded-lg overflow-hidden mb-6">
                <img src={campaignData.image_url} alt={campaignData.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-secondary/20 text-secondary-foreground text-sm rounded-full mb-4">
                {campaignData.category}
              </span>
              <h1 className="text-4xl font-bold mb-2">{campaignData.title}</h1>
              {campaignData.ngo && (
                <Link href={`/ngos/${campaignData.ngo.id}`} className="text-primary hover:underline">
                  by {campaignData.ngo.name}
                </Link>
              )}
            </div>

            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">About this Campaign</h2>
              <p className="text-foreground leading-relaxed">{campaignData.description}</p>
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
                      <div className="text-sm font-medium">₹{exp.amount.toLocaleString('en-IN')}</div>
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
                  <span className="text-muted-foreground">Total Raised</span>
                  <span className="font-bold">₹{(campaignData.collected_amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Goal</span>
                  <span className="font-bold">₹{campaignData.goal_amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Available Balance</span>
                  <span className="font-bold text-accent">
                    ₹{(campaignData.collected_amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Balance reflects donations minus posted expenditures</p>
              </div>

              {donationSuccess && (
                <div className="p-4 mb-4 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm">
                  🎉 Thank you! Your donation was successful and recorded on the transparent ledger.
                </div>
              )}

              {error && !showDonationForm && (
                <div className="p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-xs">
                  {error}
                </div>
              )}

              {user ? (
                userProfile?.role === 'donor' ? (
                  !showDonationForm ? (
                    <Button onClick={openDonationForm} className="w-full mb-3">
                      Donate Now
                    </Button>
                  ) : (
                    <>
                      {/* Step indicator */}
                      <div className="flex items-center gap-1 mb-4">
                        {[1, 2, 3].map((s) => (
                          <div key={s} className="flex-1 flex flex-col items-center gap-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              donationStep === s
                                ? 'bg-primary text-primary-foreground'
                                : donationStep > s
                                ? 'bg-accent text-accent-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {donationStep > s ? '✓' : s}
                            </div>
                            <span className="text-[10px] text-muted-foreground leading-none text-center">
                              {s === 1 ? 'Amount' : s === 2 ? 'Method' : 'Details'}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* ── Step 1: Amount + Message ── */}
                      {donationStep === 1 && (
                        <form onSubmit={handleStep1Next} className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1">
                              Donation Amount (₹)
                            </label>
                            <input
                              type="number"
                              value={donationAmount}
                              onChange={(e) => setDonationAmount(e.target.value)}
                              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="e.g. 5000"
                              min="10"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1">
                              Leave a message (Optional)
                            </label>
                            <textarea
                              value={donationMessage}
                              onChange={(e) => setDonationMessage(e.target.value)}
                              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Well wishes..."
                              rows={2}
                            />
                          </div>
                          {error && <p className="text-xs text-red-600">{error}</p>}
                          <div className="flex gap-2">
                            <Button type="submit" className="flex-1">
                              Next →
                            </Button>
                            <Button
                              type="button"
                              onClick={() => setShowDonationForm(false)}
                              variant="outline"
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      )}

                      {/* ── Step 2: Choose Payment Method ── */}
                      {donationStep === 2 && (
                        <form onSubmit={handleStep2Next} className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-2">
                              Choose Payment Method
                            </label>
                            <div className="space-y-2">
                              {[
                                { value: 'upi', label: 'UPI', icon: '📲', sub: 'GPay, PhonePe, Paytm' },
                                { value: 'card', label: 'Debit / Credit Card', icon: '💳', sub: 'Visa, Mastercard, RuPay' },
                                { value: 'bank', label: 'Net Banking', icon: '🏦', sub: 'All major banks' },
                              ].map(({ value, label, icon, sub }) => (
                                <label
                                  key={value}
                                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                    paymentMethod === value
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border hover:border-primary/40'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="paymentMethod"
                                    value={value}
                                    checked={paymentMethod === value}
                                    onChange={() => setPaymentMethod(value as any)}
                                    className="accent-primary"
                                  />
                                  <span className="text-lg">{icon}</span>
                                  <div>
                                    <div className="text-sm font-semibold">{label}</div>
                                    <div className="text-xs text-muted-foreground">{sub}</div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setDonationStep(1)}
                              className="px-3"
                            >
                              ← Back
                            </Button>
                            <Button type="submit" className="flex-1">
                              Next →
                            </Button>
                          </div>
                        </form>
                      )}

                      {/* ── Step 3: Payment-specific Details ── */}
                      {donationStep === 3 && (
                        <form onSubmit={handleDonate} className="space-y-4">
                          {/* Summary */}
                          <div className="bg-muted/40 rounded-lg p-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Amount</span>
                              <span className="font-bold">₹{parseFloat(donationAmount || '0').toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-muted-foreground">Method</span>
                              <span className="font-semibold capitalize">
                                {paymentMethod === 'upi' ? '📲 UPI' : paymentMethod === 'card' ? '💳 Card' : '🏦 Net Banking'}
                              </span>
                            </div>
                          </div>

                          {/* UPI Fields */}
                          {paymentMethod === 'upi' && (
                            <div>
                              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                UPI ID
                              </label>
                              <input
                                type="text"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="yourname@upi"
                                disabled={donating}
                              />
                              <p className="text-xs text-muted-foreground mt-1">e.g. name@okaxis, number@paytm</p>
                            </div>
                          )}

                          {/* Card Fields */}
                          {paymentMethod === 'card' && (
                            <>
                              <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                  Cardholder Name
                                </label>
                                <input
                                  type="text"
                                  value={cardName}
                                  onChange={(e) => setCardName(e.target.value)}
                                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="Name on card"
                                  disabled={donating}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                  Card Number
                                </label>
                                <input
                                  type="text"
                                  value={cardNumber}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                                    setCardNumber(raw.replace(/(.{4})/g, '$1 ').trim());
                                  }}
                                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest"
                                  placeholder="0000 0000 0000 0000"
                                  maxLength={19}
                                  disabled={donating}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                    Expiry (MM/YY)
                                  </label>
                                  <input
                                    type="text"
                                    value={cardExpiry}
                                    onChange={(e) => {
                                      let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                                      if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
                                      setCardExpiry(v);
                                    }}
                                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="MM/YY"
                                    maxLength={5}
                                    disabled={donating}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                    CVV
                                  </label>
                                  <input
                                    type="password"
                                    value={cardCvv}
                                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="•••"
                                    maxLength={4}
                                    disabled={donating}
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          {/* Net Banking Fields */}
                          {paymentMethod === 'bank' && (
                            <>
                              <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                  Select Bank
                                </label>
                                <select
                                  value={selectedBank}
                                  onChange={(e) => setSelectedBank(e.target.value)}
                                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                  disabled={donating}
                                >
                                  <option value="">— Select your bank —</option>
                                  <option value="sbi">State Bank of India (SBI)</option>
                                  <option value="hdfc">HDFC Bank</option>
                                  <option value="icici">ICICI Bank</option>
                                  <option value="axis">Axis Bank</option>
                                  <option value="kotak">Kotak Mahindra Bank</option>
                                  <option value="pnb">Punjab National Bank (PNB)</option>
                                  <option value="canara">Canara Bank</option>
                                  <option value="bob">Bank of Baroda</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                  Account Number
                                </label>
                                <input
                                  type="text"
                                  value={bankAccount}
                                  onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ''))}
                                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                                  placeholder="Enter account number"
                                  disabled={donating}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                  IFSC Code
                                </label>
                                <input
                                  type="text"
                                  value={bankIfsc}
                                  onChange={(e) => setBankIfsc(e.target.value.toUpperCase().slice(0, 11))}
                                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest"
                                  placeholder="e.g. SBIN0001234"
                                  maxLength={11}
                                  disabled={donating}
                                />
                              </div>
                            </>
                          )}

                          {error && <p className="text-xs text-red-600">{error}</p>}

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => { setDonationStep(2); setError(''); }}
                              disabled={donating}
                              className="px-3"
                            >
                              ← Back
                            </Button>
                            <Button type="submit" disabled={donating} className="flex-1">
                              {donating ? 'Processing...' : '✅ Pay ₹' + parseFloat(donationAmount || '0').toLocaleString('en-IN')}
                            </Button>
                          </div>
                        </form>
                      )}
                    </>
                  )
                ) : (
                  <div className="text-center py-4 bg-muted/30 border border-dashed border-border rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      {userProfile?.role === 'ngo' 
                        ? (campaignData.ngo?.user_id === user.id 
                            ? 'You created this campaign' 
                            : 'Logged in as NGO account')
                        : 'Logged in as Administrator'}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                      Only donor accounts can make donations.
                    </p>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  <Button asChild className="w-full">
                    <Link href="/auth/login">Sign In to Donate</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/auth/register">Create Account to Track</Link>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Sign in to track your donation&apos;s impact
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
