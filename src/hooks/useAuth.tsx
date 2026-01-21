import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type LabRole = Database['public']['Enums']['lab_role'];
type LabSection = Database['public']['Enums']['lab_section'];

interface UserRole {
  role: LabRole;
  lab_section: LabSection | null;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  loading: boolean;
  isAdmin: boolean;
  isLabSupervisor: boolean;
  isQaOfficer: boolean;
  isAnalyst: boolean;
  getLabSections: () => LabSection[];
  canEnterResults: (labSection: LabSection) => boolean;
  canReviewResults: () => boolean;
  canApproveResults: () => boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Derived permissions
  const isAdmin = roles.some(r => r.role === 'admin');
  const isLabSupervisor = roles.some(r => r.role === 'lab_supervisor');
  const isQaOfficer = roles.some(r => r.role === 'qa_officer');
  const isAnalyst = roles.some(r => 
    ['wet_chemistry_analyst', 'instrumentation_analyst', 'microbiology_analyst'].includes(r.role)
  );

  const getLabSections = (): LabSection[] => {
    return roles
      .filter(r => r.lab_section !== null)
      .map(r => r.lab_section as LabSection);
  };

  const canEnterResults = (labSection: LabSection): boolean => {
    if (isAdmin) return true;
    return roles.some(r => r.lab_section === labSection);
  };

  const canReviewResults = (): boolean => {
    return isAdmin || isLabSupervisor;
  };

  const canApproveResults = (): boolean => {
    return isAdmin || isQaOfficer;
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  const fetchRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, lab_section')
      .eq('user_id', userId);

    if (!error && data) {
      setRoles(data as UserRole[]);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile/roles fetch with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchRoles(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        loading,
        isAdmin,
        isLabSupervisor,
        isQaOfficer,
        isAnalyst,
        getLabSections,
        canEnterResults,
        canReviewResults,
        canApproveResults,
        signInWithGoogle,
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
