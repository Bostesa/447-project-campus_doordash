import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export type UserRole = 'customer' | 'worker' | null;

interface Profile {
  id: string;
  name: string;
  email: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  signInWithGoogle: (redirectPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  // Fetch or create profile for user with timeout
  async function fetchOrCreateProfile(authUser: User): Promise<Profile | null> {
    console.log('[fetchOrCreateProfile] Starting for user:', authUser.id, authUser.email);

    // Create a timeout promise
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.error('[fetchOrCreateProfile] Timeout reached');
        resolve(null);
      }, 5000);
    });

    // Create the actual fetch promise
    const fetchPromise = (async (): Promise<Profile | null> => {
      try {
        // Try to fetch existing profile
        console.log('[fetchOrCreateProfile] Querying profiles table...');
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        console.log('[fetchOrCreateProfile] Query result:', {
          hasData: !!existingProfile,
          data: existingProfile,
          errorCode: fetchError?.code,
          errorMessage: fetchError?.message
        });

        if (existingProfile) {
          console.log('[fetchOrCreateProfile] Found existing profile:', existingProfile);
          return existingProfile as Profile;
        }

        // If no profile exists, create one
        if (fetchError && fetchError.code === 'PGRST116') {
          console.log('[fetchOrCreateProfile] No profile found, creating new one...');
          const newProfile = {
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            role: 'customer' as UserRole, // Default role
            avatar_url: authUser.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString(),
          };
          console.log('[fetchOrCreateProfile] New profile data:', newProfile);

          const { data: createdProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();

          if (insertError) {
            console.error('[fetchOrCreateProfile] Error creating profile:', insertError);
            return null;
          }

          console.log('[fetchOrCreateProfile] Created new profile:', createdProfile);
          return createdProfile as Profile;
        }

        console.error('[fetchOrCreateProfile] Unexpected error fetching profile:', fetchError);
        return null;
      } catch (error) {
        console.error('[fetchOrCreateProfile] Exception:', error);
        return null;
      }
    })();

    // Race between fetch and timeout
    return Promise.race([fetchPromise, timeoutPromise]);
  }

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    let authInitialized = false;

    console.log('[AuthContext] Initializing auth...');
    console.log('[AuthContext] Current URL:', window.location.href);
    console.log('[AuthContext] URL hash:', window.location.hash);

    // Safety timeout - ensure loading is set to false after 8 seconds max
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading && !authInitialized) {
        console.warn('[AuthContext] Safety timeout reached - forcing loading to false');
        setLoading(false);
      }
    }, 8000);

    // Get initial session
    const initAuth = async () => {
      try {
        console.log('[AuthContext] Calling getSession()...');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        console.log('[AuthContext] getSession result:', {
          hasSession: !!initialSession,
          userId: initialSession?.user?.id,
          userEmail: initialSession?.user?.email,
          error: error?.message
        });

        if (!isMounted) {
          console.log('[AuthContext] Component unmounted, aborting');
          return;
        }

        if (initialSession?.user) {
          console.log('[AuthContext] Setting user from session');
          setSession(initialSession);
          setUser(initialSession.user);

          console.log('[AuthContext] Fetching/creating profile...');
          const userProfile = await fetchOrCreateProfile(initialSession.user);
          console.log('[AuthContext] Profile result:', userProfile);

          if (!isMounted) return;

          setProfile(userProfile);
          setRole(userProfile?.role ?? null);
          console.log('[AuthContext] Profile and role set:', { role: userProfile?.role });
        } else {
          console.log('[AuthContext] No session found');
        }

        authInitialized = true;
        console.log('[AuthContext] Setting loading to false');
        setLoading(false);
        clearTimeout(safetyTimeout);
      } catch (err) {
        console.error('[AuthContext] Error initializing auth:', err);
        if (isMounted) {
          authInitialized = true;
          setLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[AuthContext] onAuthStateChange fired!');
        console.log('[AuthContext] Event:', event);
        console.log('[AuthContext] Session:', {
          hasSession: !!newSession,
          userId: newSession?.user?.id,
          userEmail: newSession?.user?.email
        });

        if (!isMounted) {
          console.log('[AuthContext] Component unmounted, aborting');
          return;
        }

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          console.log('[AuthContext] Fetching profile after auth change...');
          const userProfile = await fetchOrCreateProfile(newSession.user);
          console.log('[AuthContext] Profile after auth change:', userProfile);

          if (!isMounted) return;

          setProfile(userProfile);
          setRole(userProfile?.role ?? null);
          console.log('[AuthContext] Updated state with profile, role:', userProfile?.role);
        } else {
          console.log('[AuthContext] No user in session, clearing profile');
          setProfile(null);
          setRole(null);
        }

        authInitialized = true;
        console.log('[AuthContext] Setting loading to false after auth change');
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    );

    return () => {
      console.log('[AuthContext] Cleanup - unsubscribing');
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with Google (UMBC only)
  const signInWithGoogle = async (_redirectPath?: string) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          hd: 'umbc.edu', // Restricts to UMBC accounts only
        },
        // Redirect back to login page - the useEffect there will handle final redirect
        redirectTo: window.location.origin + window.location.pathname,
      },
    });

    if (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    // Get user ID before clearing state
    const userId = user?.id;

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }

    // Clear all localStorage remnants
    localStorage.removeItem('loginState');
    localStorage.removeItem('customerAccounts');

    // Clear user-specific data
    if (userId) {
      localStorage.removeItem(`dormdash_cart_${userId}`);
      localStorage.removeItem(`dormdash_orders_${userId}`);
    }

    // Also clear guest cart if exists
    localStorage.removeItem('dormdash_cart_guest');

    // Clear any remaining auth-related storage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('dormdash_') || key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });

    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  const value = {
    user,
    session,
    profile,
    role,
    loading,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
