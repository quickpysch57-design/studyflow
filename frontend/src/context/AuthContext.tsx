import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  grade?: string;
  school?: string;
  board?: string;
  studyGoals?: string;
  preferredHours?: number;
  preferredTime?: string;
  profile?: {
    avatar?: string;
    bio?: string;
    timezone?: string;
  };
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
    studyReminders?: boolean;
    breakReminders?: boolean;
    pomodoroWork?: number;
    pomodoroBreak?: number;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  grade?: string;
  school?: string;
  board?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    setUser(response.data.user);
  };

  const register = async (data: RegisterData) => {
    const response = await api.post('/api/auth/register', data);
    setUser(response.data.user);
  };

  const logout = async () => {
    await api.post('/api/auth/logout');
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    const response = await api.patch('/api/users/profile', data);
    setUser(response.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}