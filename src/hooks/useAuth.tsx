import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  mustChangePassword: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    let initialized = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setMustChangePassword(!!session?.user?.user_metadata?.must_change_password);
      initialized = true;
      setLoading(false);
    });

    // Fallback: if onAuthStateChange never fires (e.g. no session), stop loading
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!initialized) {
        initialized = true;
        setSession(session);
        setUser(session?.user ?? null);
        setMustChangePassword(!!session?.user?.user_metadata?.must_change_password);
        setLoading(false);
      }
    }).catch(() => {
      if (!initialized) {
        initialized = true;
        setLoading(false);
      }
    });

    const timeout = setTimeout(() => setLoading(false), 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setMustChangePassword(false);
  };

  const changePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      data: { must_change_password: false },
    });
    if (!error) {
      setMustChangePassword(false);
    }
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, mustChangePassword, signIn, signUp, signOut, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
