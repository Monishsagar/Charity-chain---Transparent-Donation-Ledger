'use client';

import { useState, useEffect } from 'react';
import { getPublicLedger } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface LedgerEntry {
  id: string;
  amount: number;
  created_at: string;
  donor: { full_name: string } | null;
  campaign: { title: string; ngo: { name: string } | null } | null;
}

export default function LedgerPage() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLedger() {
      try {
        const data = await getPublicLedger();
        setLedger(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load ledger');
      } finally {
        setLoading(false);
      }
    }

    loadLedger();
  }, []);

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
            <Link href="/ledger" className="text-foreground font-medium border-b-2 border-primary">
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

      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Public Donation Ledger</h1>
          <p className="text-muted-foreground max-w-2xl">
            Immutable record of all completed donations ensuring transparency and accountability
          </p>
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
              <p className="text-muted-foreground mb-4">No donations recorded yet</p>
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
                      <th className="px-6 py-4 text-left text-sm font-semibold">NGO</th>
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
                        <td className="px-6 py-4 text-sm">
                          {entry.campaign?.ngo?.name || 'Unknown NGO'}
                        </td>
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
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-accent mb-2">
                ₹{ledger.reduce((sum, e) => sum + e.amount, 0).toLocaleString('en-IN')}
              </div>
              <p className="text-muted-foreground">Total Donations</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {ledger.length}
              </div>
              <p className="text-muted-foreground">Completed Donations</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-secondary mb-2">
                {new Set(ledger.map(e => e.campaign?.ngo?.name)).size}
              </div>
              <p className="text-muted-foreground">NGOs Supported</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
