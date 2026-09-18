import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Patient, Facility, UserRole, DemoCredential } from '../types';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  patient: Patient | null;
  facility: Facility | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { role: string; identifier: string; password?: string; otp?: string }) => Promise<{ success: boolean; message?: string }>;
  quickDemoLogin: (role: UserRole) => Promise<boolean>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  demoCredentials: DemoCredential[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [demoCredentials, setDemoCredentials] = useState<DemoCredential[]>([]);

  const fetchDemoProfiles = async () => {
    try {
      const res = await api.getDemoCredentials();
      if (res.success) {
        setDemoCredentials(res.data);
      }
    } catch (err) {
      console.error('Error fetching demo credentials:', err);
    }
  };

  const refreshSession = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setPatient(null);
      setFacility(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success) {
        setUser(res.user);
        setPatient(res.patient || null);
        setFacility(res.facility || null);
      } else {
        removeAuthToken();
        setUser(null);
      }
    } catch (err) {
      console.error('Session validation error:', err);
      removeAuthToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDemoProfiles();
    refreshSession();
  }, []);

  const login = async (credentials: { role: string; identifier: string; password?: string; otp?: string }) => {
    try {
      const res = await api.login(credentials);
      if (res.success && res.token) {
        setAuthToken(res.token);
        setUser(res.user);
        setPatient(res.patient || null);
        setFacility(res.facility || null);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection error' };
    }
  };

  const quickDemoLogin = async (role: UserRole) => {
    const profile = demoCredentials.find(d => d.role === role);
    if (!profile) return false;

    setIsLoading(true);
    try {
      const res = await api.login({
        role: profile.role,
        identifier: profile.identifier,
        password: 'password123',
        otp: '123456'
      });

      if (res.success && res.token) {
        setAuthToken(res.token);
        setUser(res.user);
        setPatient(res.patient || null);
        setFacility(res.facility || null);
        setIsLoading(false);
        return true;
      }
    } catch (err) {
      console.error('Quick demo login error:', err);
    }
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setPatient(null);
    setFacility(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        patient,
        facility,
        isAuthenticated: !!user,
        isLoading,
        login,
        quickDemoLogin,
        logout,
        refreshSession,
        demoCredentials
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
