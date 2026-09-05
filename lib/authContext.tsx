'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from './dataStore';
import { nksLogin, nksFaceLogin } from './nksApiClient';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (roleOrUsername: UserRole | string, password?: string) => Promise<User | null>;
  faceLogin: (payload?: { faceImage?: string; faceVector?: string; targetUserId?: string; account?: string; isTestMode?: boolean }) => Promise<{ success: boolean; user?: User; matchScore?: number; message?: string }>;
  logout: () => Promise<void>;
  canAccess: (feature: 'FINANCE' | 'VOTING' | 'MANAGE_MEMBERS' | 'ADMIN_CORE' | 'SMART_HOME_WRITE' | 'CREATE_TICKET' | 'BOOK_FACILITY') => boolean;
  refreshUser: () => Promise<void>;
  updateUserInfo: (updatedFields: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Update local session state immediately after successful API call
  const updateUserInfo = (updatedFields: Partial<User>) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  // 1. Check Active Session via Server API on Mount (No localStorage used)
  const refreshUser = async () => {
    try {
      const res = await fetch('/api/nks/user', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          return;
        }
      }
    } catch (err) {
      console.warn('API Session check error', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // 2. Login via NKS API (Server sets HTTP-Only Cookie)
  const login = async (roleOrUsername: UserRole | string, password?: string): Promise<User | null> => {
    setIsLoading(true);
    try {
      // Map quick role to standard NKS account if role string is provided
      let usernameToSubmit = roleOrUsername;
      if (roleOrUsername === 'ADMIN') usernameToSubmit = 'nks.manager01@gmail.com';
      else if (roleOrUsername === 'TECHNICIAN') usernameToSubmit = 'nks.manager02@gmail.com';
      else if (roleOrUsername === 'OWNER') usernameToSubmit = 'huuluc04@gmail.com';
      else if (roleOrUsername === 'TENANT') usernameToSubmit = 'nguyenhuunhut1309@gmail.com';

      const nksRes = await nksLogin(usernameToSubmit, password || '12345678');
      if (nksRes.success && nksRes.user) {
        const u = nksRes.user as any as User;
        setCurrentUser(u);
        return u;
      }
    } catch (err) {
      console.error('Login API error', err);
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  // 2.1 Biometric FaceID Login via Server API (Sets HTTP-Only Cookie)
  const faceLogin = async (payload?: { faceImage?: string; faceVector?: string; targetUserId?: string; account?: string; isTestMode?: boolean }) => {
    setIsLoading(true);
    try {
      const res = await nksFaceLogin(payload || {});
      if (res.success && res.user) {
        const u = res.user as any as User;
        setCurrentUser(u);
        return { success: true, user: u, matchScore: res.matchScore, message: res.message };
      }
      return { success: false, message: res.message || 'Nhận diện khuôn mặt không thành công' };
    } catch (err: any) {
      console.error('FaceLogin error', err);
      return { success: false, message: err?.message || 'Lỗi kết nối hệ thống FaceID AI' };
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Logout via Server API (Clears HTTP-Only Cookie)
  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/nks/user/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout API error', err);
    } finally {
      setCurrentUser(null);
      setIsLoading(false);
    }
  };

  // Permission Matrix strictly complying with SRS specifications
  const canAccess = (feature: 'FINANCE' | 'VOTING' | 'MANAGE_MEMBERS' | 'ADMIN_CORE' | 'SMART_HOME_WRITE' | 'CREATE_TICKET' | 'BOOK_FACILITY') => {
    if (!currentUser) return false;

    switch (feature) {
      case 'ADMIN_CORE':
        return currentUser.role === 'ADMIN';
      case 'FINANCE':
        // Only Owner has financial rights according to SRS section 2.3
        return currentUser.role === 'OWNER';
      case 'VOTING':
        // Only Owner has legal voting rights according to SRS section 2.3
        return currentUser.role === 'OWNER';
      case 'MANAGE_MEMBERS':
        // Only Owner has autonomy to add/remove members according to SRS section 2.3
        return currentUser.role === 'OWNER';
      case 'SMART_HOME_WRITE':
        return currentUser.role === 'OWNER' || currentUser.role === 'TENANT';
      case 'CREATE_TICKET':
        return currentUser.role === 'OWNER' || currentUser.role === 'TENANT';
      case 'BOOK_FACILITY':
        return currentUser.role === 'OWNER' || currentUser.role === 'TENANT';
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        faceLogin,
        logout,
        canAccess,
        refreshUser,
        updateUserInfo,
      }}
    >
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
