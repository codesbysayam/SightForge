'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session, AuthContextType, UserRole, Permission } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and check for existing local sessions
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        // Placeholder check for stored session
        const storedToken = localStorage.getItem('vt_auth_token');
        if (storedToken) {
          // Future Module 2: Verify token with backend
          // Mock successful validation for development verification
          const mockUser: User = {
            id: 'usr-admin-1',
            name: 'Principal Architect',
            email: 'architect@visiontrack.ai',
            role: UserRole.ADMIN,
            permissions: [
              Permission.VIEW_CAMERAS,
              Permission.CONTROL_CAMERAS,
              Permission.MANAGE_ALERTS,
              Permission.MANAGE_USERS,
              Permission.EXPORT_REPORTS,
            ],
            avatarUrl: '/avatars/architect.png',
            createdAt: new Date().toISOString(),
          };
          
          setUser(mockUser);
          setSession({
            id: 'ses-1',
            userId: mockUser.id,
            token: storedToken,
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
            user: mockUser,
          });
        }
      } catch (err: any) {
        setError(err.message || 'Session verification failed');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Future Module 2: Replace with API request to /api/v1/auth/login
      if (email && password) {
        const mockUser: User = {
          id: 'usr-admin-1',
          name: 'Principal Architect',
          email: email,
          role: UserRole.ADMIN,
          permissions: Object.values(Permission),
          avatarUrl: '/avatars/architect.png',
          createdAt: new Date().toISOString(),
        };

        const mockSession: Session = {
          id: 'ses-1',
          userId: mockUser.id,
          token: 'jwt-placeholder-token',
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          user: mockUser,
        };

        localStorage.setItem('vt_auth_token', mockSession.token);
        setUser(mockUser);
        setSession(mockSession);
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Future Module 2: Call logout endpoint if necessary
      localStorage.removeItem('vt_auth_token');
      setUser(null);
      setSession(null);
    } catch (err: any) {
      setError(err.message || 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        hasPermission,
        hasRole,
      }}
    >
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
