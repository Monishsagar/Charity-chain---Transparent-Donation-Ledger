'use client';

import { useState, useEffect } from 'react';
import { getPublicLedger, getProfile, getNGOs } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';

interface LedgerEntry {
  id: string;
  amount: number;
  created_at: string;
  donor: { full_name: string } | null;
  campaign: { title: string; ngo_id?: string; ngo: { name: string } | null } | null;
}

export default function LedgerPage() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isNgo, setIsNgo] = useState(false);
  const [ngoName, setNgoName] = useState('');

  useEffect(() => {
    async function loadLedger() {
      try {
        // Check if the current user is an NGO
        const currentUser = await getCurrentUser();
        let ngoId: string | undefined;

        if (currentUser) {
          try {
            const profile = await getProfile(currentUser.id);
            if (profile.role === 'ngo') {
              // Find this user's NGO record
              const allNgos = await getNGOs();
              const myNgo = allNgos.find((n: any) => n.user_id === currentUser.id);
              if (myNgo) {
                ngoId = myNgo.id;
                setIsNgo(true);
                setNgoName(myNgo.name);
              }
            }
          } catch {
            // Not logged in or no profile — show full public ledger
          }
        }

        const data = await getPublicLedger(ngoId);
        setLedger(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load ledger');
      } finally {
        setLoading(false);
      }
    }

    loadLedger();
  }, []);

  const totalAmount = ledger.reduce((sum, e) => sum + e.amount, 0);
  const uniqueNgos = new Set(ledger.map(e => e.campaign?.ngo?.name)).size;

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <Navbar />

      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
        <div className="container mx-auto px-4">
          {isNgo ? (
            <>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-3">
                🏢 {ngoName}
              </div>
              <h1 className="text-4xl font-bold mb-2">Your NGO&apos;s Donation Ledger</h1>
              <p className="text-muted-foreground max-w-2xl">
                Transparent record of all completed donations received by your NGO&apos;s campaigns
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold mb-2">Public Donation Ledger</h1>
              <p className="text-muted-foreground max-w-2xl">
                Immutable record of all completed donations ensuring transparency and accountability
              </p>
            </>
          )}
        </div>
      </section>

      {/* Ledger Table */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading ledger...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
            </div>
          ) : ledger.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {isNgo
                  ? 'No donations have been received by your campaigns yet'
                  : 'No donations recorded yet'}
              </p>
              <Button asChild variant="outline">
                <Link href="/campaigns">Explore Campaigns</Link>
              </Button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Donor</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Campaign</th>
                      {!isNgo && (
                        <th className="px-6 py-4 text-left text-sm font-semibold">NGO</th>
                      )}
                      <th className="px-6 py-4 text-right text-sm font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ledger.map((entry) => (
                      <tr key={entry.id} className="hover:bg-muted/30 transition">
                        <td className="px-6 py-4 text-sm">
                          {new Date(entry.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {entry.donor?.full_name || 'Anonymous'}
                        </td>
                        <td className="px-6 py-4 text-sm max-w-xs truncate">
                          {entry.campaign?.title || 'Unknown Campaign'}
                        </td>
                        {!isNgo && (
                          <td className="px-6 py-4 text-sm">
                            {entry.campaign?.ngo?.name || 'Unknown NGO'}
                          </td>
                        )}
                        <td className="px-6 py-4 text-sm text-right font-semibold text-accent">
                          ₹{entry.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className={`grid gap-6 mt-12 ${isNgo ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-accent mb-2">
                ₹{totalAmount.toLocaleString('en-IN')}
              </div>
              <p className="text-muted-foreground">
                {isNgo ? 'Total Received' : 'Total Donations'}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {ledger.length}
              </div>
              <p className="text-muted-foreground">Completed Donations</p>
            </div>
            {!isNgo && (
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-secondary mb-2">
                  {uniqueNgos}
                </div>
                <p className="text-muted-foreground">NGOs Supported</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
