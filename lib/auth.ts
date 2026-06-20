import { supabase } from './supabase';
import { Profile, UserRole } from './types';

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: UserRole
) {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('No user returned');

  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([
      {
        id: authData.user.id,
        email,
        role,
        full_name: fullName,
      },
    ]);

  if (profileError) throw profileError;

  return authData.user;
}

export async function signIn(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data.user;
}

export async function signOut() {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getCurrentSession() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function resetPassword(email: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`,
  });

  if (error) throw error;
}

export function onAuthStateChange(callback: (user: any) => void) {
  if (!supabase) {
    callback(null);
    return () => {};
  }

  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}
