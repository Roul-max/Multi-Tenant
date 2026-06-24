'use client';

import { useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, Eye, EyeOff, Loader2, Lock, PlayCircle, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  tenant: {
    id: string;
    slug: string;
    name: string;
    plan: 'free' | 'pro';
  };
}

interface LoginFormProps {
  onLogin: (token: string, user: User) => void;
}

const testAccounts = [
  { email: 'admin@acme.test', role: 'Admin', tenant: 'Acme Corporation' },
  { email: 'user@acme.test', role: 'User', tenant: 'Acme Corporation' },
  { email: 'admin@globex.test', role: 'Admin', tenant: 'Globex Corporation' },
  { email: 'user@globex.test', role: 'User', tenant: 'Globex Corporation' },
];

const trustSignals = [
  { icon: ShieldCheck, label: 'Tenant isolated data' },
  { icon: Lock, label: 'Secure JWT sessions' },
  { icon: Users, label: 'Role-aware workspaces' },
];

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const submitLogin = async (loginEmail = email, loginPassword = password) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const loginData = data.data;
      localStorage.setItem('token', loginData.token);
      localStorage.setItem('user', JSON.stringify(loginData.user));
      toast.success(`Welcome back, ${loginData.user.email}`);
      onLogin(loginData.token, loginData.user);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    submitLogin();
  };

  const handleQuickLogin = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('password');
    submitLogin(testEmail, 'password');
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="surface-grid hidden border-r bg-muted/30 px-10 py-10 lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">NotesFlow</p>
              <h1 className="text-2xl font-semibold">Multi-Tenant SaaS Platform</h1>
            </div>
          </div>

          <div className="max-w-2xl animate-in">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm font-medium text-muted-foreground shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Built for secure team workspaces
            </p>
            <h2 className="text-5xl font-semibold leading-tight tracking-normal">
              One notes platform. Many tenants. Clear ownership.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Manage workspace notes with role-based access, tenant isolation, plan limits, and a dashboard that feels ready for real customers.
            </p>
            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              {trustSignals.map((signal) => (
                <div key={signal.label} className="rounded-lg border bg-background p-4 shadow-sm">
                  <signal.icon className="mb-3 h-5 w-5 text-primary" />
                  <p className="text-sm font-medium">{signal.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid max-w-2xl grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-2xl font-semibold">2</p>
              <p className="text-muted-foreground">Demo tenants</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">4</p>
              <p className="text-muted-foreground">Seeded roles</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">100%</p>
              <p className="text-muted-foreground">Tenant scoped</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <Card className="w-full max-w-md animate-in border-muted-foreground/10 shadow-xl">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground lg:hidden">
                  <Building2 className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Demo ready
                </span>
              </div>
              <div>
                <CardTitle className="text-2xl">Sign in to NotesFlow</CardTitle>
                <CardDescription className="mt-2">
                  Use a demo workspace or sign in with seeded credentials.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {error ? (
                <Alert className="border-destructive/30 bg-destructive/10">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <Button
                type="button"
                variant="premium"
                size="lg"
                className="w-full"
                onClick={() => handleQuickLogin('admin@acme.test')}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                Continue with Demo Account
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 font-semibold text-muted-foreground">or use credentials</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@acme.test"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

              <div className="grid gap-2">
                {testAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => handleQuickLogin(account.email)}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span>
                      <span className="block font-medium">{account.email}</span>
                      <span className="text-xs text-muted-foreground">{account.role} in {account.tenant}</span>
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
