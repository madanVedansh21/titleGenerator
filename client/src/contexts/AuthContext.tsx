
import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface User {
  id: number;
  email: string;
  fullName: string | null;
}

interface AuthError {
  message: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token in localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Verify token and get user data
      fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Invalid token');
      })
      .then(userData => {
        setUser(userData);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, fullName })
      });

      const data = await response.json();

      if (!response.ok) {
        const error = { message: data.error || 'Signup failed' };
        toast.error(error.message);
        return { error };
      }

      // Store token and set user
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
      toast.success('Account created successfully!');
      return { error: null };
    } catch (error) {
      const authError = { message: 'An unexpected error occurred' };
      toast.error(authError.message);
      return { error: authError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        const error = { message: data.error || 'Sign in failed' };
        toast.error(error.message);
        return { error };
      }

      // Store token and set user
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
      toast.success('Welcome back!');
      return { error: null };
    } catch (error) {
      const authError = { message: 'An unexpected error occurred' };
      toast.error(authError.message);
      return { error: authError };
    }
  };

  const signInWithGoogle = async () => {
    // Google OAuth not implemented in this migration
    // Returning error to maintain interface compatibility
    const error = { message: 'Google sign-in not available in this version' };
    toast.error(error.message);
    return { error };
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      localStorage.removeItem('auth_token');
      setUser(null);
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('An unexpected error occurred while signing out');
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
