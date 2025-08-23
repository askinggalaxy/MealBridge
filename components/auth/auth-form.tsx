'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  displayName: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

interface AuthFormProps {
  type: 'login' | 'signup';
}

export function AuthForm({ type }: AuthFormProps) {
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
      displayName: '',
    },
  });

  const handleMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      setMagicLinkSent(true);
      toast.success('Check your email for the login link!');
    }
  };

  const handlePasswordAuth = async (data: AuthFormData) => {
    if (type === 'signup') {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password!,
        options: {
          // Ensure redirect URL is explicitly provided to satisfy Supabase Auth requirements
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            display_name: data.displayName,
          },
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Account created! Please check your email to verify.');
        router.push('/profile/setup');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password!,
      });

      if (error) {
        toast.error(error.message);
      } else {
        router.push('/');
      }
    }
  };

  const onSubmit = async (data: AuthFormData) => {
    setLoading(true);
    
    if (data.password) {
      await handlePasswordAuth(data);
    } else {
      await handleMagicLink(data.email);
    }
    
    setLoading(false);
  };

  if (magicLinkSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            We've sent you a login link. Click the link in your email to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setMagicLinkSent(false)}
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>{type === 'login' ? 'Welcome Back' : 'Join MealBridge'}</CardTitle>
        <CardDescription>
          {type === 'login' 
            ? 'Sign in to your account' 
            : 'Create an account to start sharing food'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {type === 'signup' && (
            <div>
              <Label htmlFor="displayName">Full Name</Label>
              {/* Use a semantic autocomplete token so browsers can assist users reliably */}
              <Input
                id="displayName"
                autoComplete="name"
                {...form.register('displayName')}
                placeholder="Enter your full name"
              />
              {form.formState.errors.displayName && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.displayName.message}
                </p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            {/* Provide stable autocomplete hints to prevent hydration inconsistencies */}
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...form.register('email')}
              placeholder="Enter your email"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password (optional)</Label>
            {/* Use context-appropriate autocomplete for login vs signup */}
            <Input
              id="password"
              type="password"
              autoComplete={type === 'login' ? 'current-password' : 'new-password'}
              {...form.register('password')}
              placeholder="Leave blank for magic link"
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? 'Loading...' : type === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {type === 'login' ? "Don't have an account? " : "Already have an account? "}
            <Link 
              href={type === 'login' ? '/auth/signup' : '/auth/login'}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              {type === 'login' ? 'Sign up' : 'Sign in'}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}