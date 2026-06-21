'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getNGOs } from '@/lib/api';
import { NGO } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';

export default function NGOsPage() {
  const router = useRouter();
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadNGOs() {
      try {
        const data = await getNGOs();
        setNgos(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load NGOs');
      } finally {
        setLoading(false);
      }
    }

    loadNGOs();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <Navbar />

      {/* Page Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Verified NGOs</h1>
          <p className="text-muted-foreground max-w-2xl">
            Browse verified non-profit organizations making impact across India
          </p>
        </div>
      </section>

      {/* NGOs Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading NGOs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
            </div>
          ) : ngos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No verified NGOs yet</p>
              <Button asChild variant="outline">
                <Link href="/campaigns">View Campaigns</Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ngos.map((ngo) => (
                <div
                  key={ngo.id}
                  className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition h-full flex flex-col cursor-pointer"
                  onClick={() => router.push(`/ngos/${ngo.id}`)}
                >
                  {ngo.logo_url ? (
                    <div className="w-full h-40 bg-primary/10 flex items-center justify-center p-4">
                      <img src={ngo.logo_url} alt={ngo.name} className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-primary/10 flex items-center justify-center">
                      <div className="text-4xl">🏢</div>
                    </div>
                  )}
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold">{ngo.name}</h3>
                      {ngo.verified && (
                        <span className="inline-block px-2 py-1 bg-accent/20 text-accent-foreground text-xs rounded">
                          Verified
                        </span>
                      )}
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3 flex-1">
                      {ngo.mission}
                    </p>

                    {ngo.website && (
                      <a
                        href={ngo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm mb-4 inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Visit Website →
                      </a>
                    )}

                    <Button className="w-full" size="sm">
                      View Campaigns
                    </Button>
                  </div>
                </div>
              ))}

            </div>
          )}
        </div>
      </section>
    </main>
  );
}
