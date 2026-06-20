'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getProfile } from '@/lib/api';
import { Profile, Expenditure } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminExpenditureVerificationPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
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
        if (profileData.role !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setProfile(profileData);
        // Load pending expenditures
        // const data = await getPendingExpenditures();
        // setExpenditures(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load expenditures');
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

  if (!profile) {
    return (
      <main className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Access denied'}</p>
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
      {/* Navigation */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary hover:text-primary/80">
            CharityChain Admin
          </Link>
          <div className="flex gap-4">
            <Link href="/admin" className="text-foreground hover:text-primary transition">
              Dashboard
            </Link>
            <Link href="/admin/ngos" className="text-foreground hover:text-primary transition">
              NGO Verification
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <Button asChild variant="outline" size="sm" className="mb-6">
          <Link href="/admin">← Back to Admin</Link>
        </Button>

        <h1 className="text-4xl font-bold mb-2">Expenditure Verification</h1>
        <p className="text-muted-foreground mb-8">Review and approve expenditure records from NGOs</p>

        {expenditures.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">No pending expenditure verification requests</p>
            <Button asChild variant="outline">
              <Link href="/admin">Go to Dashboard</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {expenditures.map((exp) => (
              <div key={exp.id} className="bg-card border border-border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{exp.title}</h2>
                    <p className="text-muted-foreground">{exp.description}</p>
                  </div>
                  <span className="bg-secondary/20 text-secondary-foreground px-3 py-1 rounded-full text-sm">
                    Pending Review
                  </span>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-6 pb-6 border-b border-border">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Amount</h3>
                    <p className="text-2xl font-bold">₹{exp.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Category</h3>
                    <p>{exp.category}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Proof Documents</h3>
                    <p>{exp.proof_urls.length} documents</p>
                  </div>
                </div>

                {exp.proof_urls.length > 0 && (
                  <div className="mb-6 pb-6 border-b border-border">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">Attached Documents</h3>
                    <div className="flex flex-wrap gap-2">
                      {exp.proof_urls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          Document {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button className="flex-1">Verify & Approve</Button>
                  <Button variant="outline" className="flex-1">Request More Info</Button>
                  <Button variant="outline" className="flex-1 text-red-600 border-red-600">Reject</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
