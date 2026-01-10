import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole, AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: Record<string, User> = {
  'admin@demo.com': {
    id: '1',
    email: 'admin@demo.com',
    name: 'John Admin',
    role: 'admin',
    department: 'Administration',
    status: 'active',
  },
  'hr@demo.com': {
    id: '2',
    email: 'hr@demo.com',
    name: 'Sarah HR',
    role: 'hr',
    department: 'Human Resources',
    status: 'active',
  },
  'bd@demo.com': {
    id: '3',
    email: 'bd@demo.com',
    name: 'Mike Sales',
    role: 'bd_manager',
    department: 'Business Development',
    status: 'active',
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  const login = useCallback(async (email: string, _password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = mockUsers[email.toLowerCase()];
    if (user) {
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
      throw new Error('Invalid credentials');
    }
  }, []);

  const logout = useCallback(() => {
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const setUserRole = useCallback((role: UserRole) => {
    if (state.user) {
      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, role } : null,
      }));
    }
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setUserRole }}>
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
