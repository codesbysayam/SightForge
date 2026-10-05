'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { ProtectedRouteProps } from '../types/auth';
import { ShieldAlert, Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermissions,
  fallbackUrl = '/',
}) => {
  const { user, isAuthenticated, isLoading, hasRole, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(fallbackUrl);
    }
  }, [isLoading, isAuthenticated, fallbackUrl, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white p-6">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-mono text-sm animate-pulse">VERIFYING CREDENTIALS...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirecting via useEffect
  }

  // Check roles if defined
  if (allowedRoles && allowedRoles.length > 0) {
    const roleAllowed = allowedRoles.some(role => hasRole(role));
    if (!roleAllowed) {
      return <AccessDeniedMessage requiredRole={allowedRoles.join(', ')} />;
    }
  }

  // Check permissions if defined
  if (requiredPermissions && requiredPermissions.length > 0) {
    const permissionsAllowed = requiredPermissions.every(perm => hasPermission(perm));
    if (!permissionsAllowed) {
      return <AccessDeniedMessage requiredPermissions={requiredPermissions.join(', ')} />;
    }
  }

  return <>{children}</>;
};

interface AccessDeniedProps {
  requiredRole?: string;
  requiredPermissions?: string;
}

const AccessDeniedMessage: React.FC<AccessDeniedProps> = ({ requiredRole, requiredPermissions }) => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-8 rounded-xl bg-slate-900 border border-slate-800 text-white shadow-2xl max-w-md mx-auto my-12 animate-fade-in">
      <div className="p-3 bg-red-500/10 rounded-full text-red-500 mb-4 border border-red-500/20">
        <ShieldAlert className="w-10 h-10" />
      </div>
      <h3 className="text-lg font-bold font-sans text-slate-100">Access Denied</h3>
      <p className="text-sm text-slate-400 mt-2 text-center font-sans">
        You do not have the required security credentials to access this system module.
      </p>

      {requiredRole && (
        <div className="mt-4 px-3 py-1.5 rounded bg-slate-950 text-slate-300 font-mono text-xs border border-slate-800 w-full text-center">
          <span className="text-red-400 font-bold">Required Role:</span> {requiredRole}
        </div>
      )}

      {requiredPermissions && (
        <div className="mt-2 px-3 py-1.5 rounded bg-slate-950 text-slate-300 font-mono text-xs border border-slate-800 w-full text-center">
          <span className="text-red-400 font-bold">Required Permissions:</span> {requiredPermissions}
        </div>
      )}

      <button
        onClick={() => router.push('/')}
        className="mt-6 px-4 py-2 w-full bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg text-sm font-sans font-medium text-slate-200 transition-all cursor-pointer"
      >
        Return to Dashboard
      </button>
    </div>
  );
};
export default ProtectedRoute;
