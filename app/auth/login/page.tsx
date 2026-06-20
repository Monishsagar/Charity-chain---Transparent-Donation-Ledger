import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <Link href="/" className="text-2xl font-bold text-primary hover:text-primary/80">
            CharityChain
          </Link>
        </div>

        {/* Main content */}
        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-xl border border-border shadow-lg p-8">
            <h1 className="text-2xl font-bold mb-2">Sign In</h1>
            <p className="text-muted-foreground mb-6">
              Welcome back to CharityChain
            </p>

            <LoginForm />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>New to CharityChain?{' '}
            <Link href="/auth/register" className="text-primary hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
