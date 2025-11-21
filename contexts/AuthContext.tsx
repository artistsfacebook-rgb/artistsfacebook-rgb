
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { User } from '../types';
import { getUser, saveUser } from '../services/storage';

// Default guest user
export const DEFAULT_GUEST: User = {
  id: 'guest',
  name: 'Guest Artist',
  handle: '@guest_art',
  avatar: 'https://picsum.photos/100/100?random=99',
  coverPhoto: 'https://picsum.photos/1200/400?random=888',
  type: 'Artist',
  location: 'India',
  bio: 'Exploring the platform.',
  followers: 0,
  following: 0,
  followingIds: []
};

interface AuthContextType {
  user: User | null;
  session: any | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  guestLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email?: string) => {
    try {
      // Try to get existing profile
      const profile = await getUser(userId);
      
      if (profile) {
        setUser({
            ...DEFAULT_GUEST,
            ...profile,
            id: userId // Ensure ID matches Auth ID
        });
      } else {
        // Create new profile for new user
        const newProfile: User = {
          ...DEFAULT_GUEST,
          id: userId,
          name: email?.split('@')[0] || 'New Artist',
          handle: `@${email?.split('@')[0] || 'artist'}`,
        };
        await saveUser(newProfile);
        setUser(newProfile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            data: { full_name: name }
        }
    });
    
    if (!error && data.user) {
        // Immediately create the user profile row
        const newProfile: User = {
            ...DEFAULT_GUEST,
            id: data.user.id,
            name: name,
            handle: `@${name.replace(/\s/g, '').toLowerCase()}`,
            avatar: `https://ui-avatars.com/api/?name=${name}&background=random`
        };
        await saveUser(newProfile);
        setUser(newProfile);
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const guestLogin = () => {
    setUser(DEFAULT_GUEST);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut, guestLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
