// hooks/use-access-control.ts
import { useSession } from 'next-auth/react';
import { AccessType, UserRole } from '@/components/access/access-denied-card';

export function useAccessControl() {
  const { data: session } = useSession();
  
  const userRole = (session?.user?.role as UserRole) || 'guest';
  const isClient = userRole === 'client';
  const isFreelancer = userRole === 'freelancer';
  const isTeam = userRole === 'team';
  const isAdmin = userRole === 'admin';
  const isAuthenticated = !!session;
  
  const checkAccess = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!isAuthenticated) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(userRole);
    }
    
    return userRole === requiredRole;
  };
  
  const getAccessDeniedType = (requiredRole: UserRole | UserRole[]): AccessType => {
    if (!isAuthenticated) return 'authenticated-only';
    
    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(userRole)) {
        if (userRole === 'client') return 'freelancer-only';
        if (userRole === 'freelancer') return 'client-only';
        return 'permission-denied';
      }
    } else if (userRole !== requiredRole) {
      if (requiredRole === 'client') return 'client-only';
      if (requiredRole === 'freelancer') return 'freelancer-only';
      if (requiredRole === 'admin') return 'admin-only';
      if (requiredRole === 'team') return 'team-only';
    }
    
    return 'permission-denied';
  };
  
  return {
    userRole,
    isClient,
    isFreelancer,
    isTeam,
    isAdmin,
    isAuthenticated,
    checkAccess,
    getAccessDeniedType,
  };
}