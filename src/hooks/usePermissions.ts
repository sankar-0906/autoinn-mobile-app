import { useAuth } from '../context/auth/AuthContext';
import { RoleAccess, UserPermissions } from '../context/auth/types';

export const usePermissions = () => {
  const { user, isManager, departmentTypes, roleAccess } = useAuth();

  const hasAccess = (module: string, action: keyof UserPermissions): boolean => {
    if (!user || !roleAccess) return false;
    
    const moduleAccess = roleAccess.find((access: RoleAccess) => access.subModule === module);
    return moduleAccess?.access[action] || false;
  };

  const canRead = (module: string): boolean => hasAccess(module, 'read');
  const canCreate = (module: string): boolean => hasAccess(module, 'create');
  const canUpdate = (module: string): boolean => hasAccess(module, 'update');
  const canDelete = (module: string): boolean => hasAccess(module, 'delete');

  const getAccessibleModules = (): string[] => {
    if (!roleAccess) return [];
    return roleAccess
      .filter((access: RoleAccess) => access.access.read)
      .map((access: RoleAccess) => access.subModule);
  };

  return {
    hasAccess,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    getAccessibleModules,
    isManager,
    departmentTypes,
  };
};
