import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type LabRole = Database['public']['Enums']['lab_role'];
type LabSection = Database['public']['Enums']['lab_section'];

interface UserRole {
  role: LabRole;
  lab_section: LabSection | null;
  department_id: string | null;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  organization_id: string | null;
  has_completed_tour: boolean;
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
  getDepartmentIds: () => string[];
  canEnterResults: (labSection: LabSection) => boolean;
  canEnterResultsForDepartment: (departmentId: string) => boolean;
  canReviewResults: () => boolean;
  canApproveResults: () => boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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

  const getDepartmentIds = (): string[] => {
    return roles
      .filter(r => r.department_id !== null)
      .map(r => r.department_id as string);
  };

  const canEnterResults = (labSection: LabSection): boolean => {
    if (isAdmin) return true;
    return roles.some(r => r.lab_section === labSection);
  };

  const canEnterResultsForDepartment = (departmentId: string): boolean => {
    if (isAdmin) return true;
    return roles.some(r => r.department_id === departmentId);
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
      .select('role, lab_section, department_id')
      .eq('user_id', userId);

    if (!error && data) {
      setRoles(data as UserRole[]);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
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

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
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
        getDepartmentIds,
        canEnterResults,
        canEnterResultsForDepartment,
        canReviewResults,
        canApproveResults,
        signIn,
        signUp,
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
