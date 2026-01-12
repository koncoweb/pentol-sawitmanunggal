import React, { createContext, useContext, useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { getDbClient } from '@/lib/db';

// Define types based on Neon Auth and Database Schema
type User = typeof authClient.$Infer.Session.user;
type Session = typeof authClient.$Infer.Session.session;

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'krani_panen' | 'krani_buah' | 'mandor' | 'asisten' | 'estate_manager' | 'regional_gm';
  divisi_id: string | null;
  gang_id: string | null;
  created_at: string;
  updated_at: string;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session check
    const initSession = async () => {
      try {
        const { data } = await authClient.getSession();
        if (data) {
          setSession(data.session);
          setUser(data.user);
          await loadProfile(data.user.id); // Assuming token is available or needed? 
          // Note: authClient manages the session, but for DB queries we might need the token if using RLS.
          // Better Auth session usually has a token or we can get it.
          // Actually, getDbClient takes authToken. authClient manages cookies/headers usually.
          // For Expo, we might need to extract the token.
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing session:', error);
        setLoading(false);
      }
    };

    initSession();

    // Listen for auth changes (if supported by the client, otherwise we might need polling or manual updates)
    // neon-js/better-auth might not have a subscription listener like Supabase yet?
    // Using a simple polling or relying on router redirects might be needed.
    // For now, we assume initSession covers the start.
    // TODO: Add listener if available.
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const db = await getDbClient(); 
      
      const { rows } = await db.query('SELECT * FROM profiles WHERE id = $1', [userId]);
      
      if (rows.length > 0) {
        setProfile(rows[0] as Profile);
      } else {
        setProfile(null);
      }
      
      await db.end();
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await authClient.signIn.email({
      email,
      password,
    });
    
    if (error) {
      throw error;
    }
    
    if (data) {
       // Refresh state
       const { data: sessionData } = await authClient.getSession();
       if (sessionData) {
         setSession(sessionData.session);
         setUser(sessionData.user);
         await loadProfile(sessionData.user.id);
       }
    }
  };

  const signOut = async () => {
    await authClient.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
