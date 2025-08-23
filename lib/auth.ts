import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  return profile;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect('/auth/login');
  }
  return user;
}

export async function requireProfile() {
  const profile = await getProfile();
  if (!profile) {
    redirect('/profile/setup');
  }
  return profile;
}