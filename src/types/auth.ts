export type UserRole = 'admin' | 'hr' | 'bd_executive' | 'bd_tl' | 'bd_manager' | 'bd_director';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  status: 'active' | 'inactive';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
