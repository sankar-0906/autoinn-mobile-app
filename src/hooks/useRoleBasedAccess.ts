import { useMemo } from 'react';
import { useAuth } from '../context/auth/AuthContext';
import { UserPermissions, RoleAccess } from '../context/auth/types';
import { 
  MODULE_CATEGORIES, 
  MOBILE_MODULES, 
  NAVIGATION_MODULES, 
  MODULE_DISPLAY_NAMES,
  MODULE_CATEGORY_MAP 
} from '../constants/modules';
import { 
  RoleBasedAccessHook,
  PermissionCheck,
  NavigationPermission,
  ModuleAccessInfo,
  PermissionValidationResult,
  PermissionErrorType,
  PermissionError
} from '../types/permissions';

export const useRoleBasedAccess = (): RoleBasedAccessHook => {
  const { user, isManager, departmentTypes, roleAccess } = useAuth();

  // Get user's role
  const userRole = user?.profile?.department?.role || 'Unknown';

  // Basic permission check
  const hasAccess = (module: string, action: keyof UserPermissions): boolean => {
    if (!user || !roleAccess) return false;
    
    const moduleAccess = roleAccess.find((access: RoleAccess) => 
      access.subModule === module
    );
    
    return moduleAccess?.access[action] || false;
  };

  // Individual CRUD permission checks
  const canRead = (module: string): boolean => hasAccess(module, 'read');
  const canCreate = (module: string): boolean => hasAccess(module, 'create');
  const canUpdate = (module: string): boolean => hasAccess(module, 'update');
  const canDelete = (module: string): boolean => hasAccess(module, 'delete');
  const canPrint = (module: string): boolean => hasAccess(module, 'print');

  // Module-level access validation
  const canAccessModule = (module: string): boolean => {
    return canRead(module);
  };

  // Get all accessible modules
  const getAccessibleModules = (): string[] => {
    if (!roleAccess) return [];
    return roleAccess
      .filter((access: RoleAccess) => access.access.read)
      .map((access: RoleAccess) => access.subModule);
  };

  // Get detailed module access info
  const getModuleAccessInfo = (module: string): ModuleAccessInfo | null => {
    if (!roleAccess) return null;
    
    const moduleAccess = roleAccess.find((access: RoleAccess) => 
      access.subModule === module
    );
    
    if (!moduleAccess) return null;
    
    return {
      module,
      displayName: MODULE_DISPLAY_NAMES[module] || module,
      category: MODULE_CATEGORY_MAP[module] || 'Unknown',
      permissions: {
        canRead: moduleAccess.access.read,
        canCreate: moduleAccess.access.create,
        canUpdate: moduleAccess.access.update,
        canDelete: moduleAccess.access.delete,
        canPrint: moduleAccess.access.print
      },
      isAccessible: moduleAccess.access.read
    };
  };

  // Navigation permission checks
  const canNavigateTo = (screenName: string): boolean => {
    const moduleName = NAVIGATION_MODULES[screenName as keyof typeof NAVIGATION_MODULES];
    if (!moduleName) return false;
    return canAccessModule(moduleName);
  };

  // Get all navigation permissions
  const getNavigationPermissions = (): NavigationPermission[] => {
    return Object.entries(NAVIGATION_MODULES).map(([screenName, moduleName]) => ({
      screenName,
      moduleName,
      canAccess: canAccessModule(moduleName),
      canRead: canRead(moduleName),
      canCreate: canCreate(moduleName),
      canUpdate: canUpdate(moduleName),
      canDelete: canDelete(moduleName)
    }));
  };

  // Category-level access checks
  const hasCategoryAccess = (category: keyof typeof MODULE_CATEGORIES): boolean => {
    if (!roleAccess) return false;
    
    const categoryKey = MODULE_CATEGORIES[category];
    return roleAccess.some((access: RoleAccess) => 
      access.master === categoryKey && access.access.read
    );
  };

  // Get modules by category
  const getCategoryModules = (category: keyof typeof MODULE_CATEGORIES): string[] => {
    if (!roleAccess) return [];
    
    const categoryKey = MODULE_CATEGORIES[category];
    return roleAccess
      .filter((access: RoleAccess) => 
        access.master === categoryKey && access.access.read
      )
      .map((access: RoleAccess) => access.subModule);
  };

  // Validate permission with detailed result
  const validatePermission = (module: string, action: keyof UserPermissions): PermissionCheck => {
    const hasPermission = hasAccess(module, action);
    
    return {
      module,
      action,
      hasAccess: hasPermission
    };
  };

  // Get all permissions for debugging
  const getAllPermissions = (): PermissionCheck[] => {
    if (!roleAccess) return [];
    
    const allChecks: PermissionCheck[] = [];
    const actions: (keyof UserPermissions)[] = ['read', 'create', 'update', 'delete', 'print'];
    
    roleAccess.forEach((access: RoleAccess) => {
      actions.forEach((action) => {
        allChecks.push({
          module: access.subModule,
          action,
          hasAccess: access.access[action]
        });
      });
    });
    
    return allChecks;
  };

  // Memoized return object
  return useMemo(() => ({
    // Basic permission checks
    hasAccess,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    canPrint,
    
    // Module-level access
    canAccessModule,
    getAccessibleModules,
    getModuleAccessInfo,
    
    // Navigation guards
    canNavigateTo,
    getNavigationPermissions,
    
    // Category-level access
    hasCategoryAccess,
    getCategoryModules,
    
    // Manager and department info
    isManager,
    departmentTypes,
    userRole,
    
    // Utility methods
    validatePermission,
    getAllPermissions
  }), [
    user, 
    isManager, 
    departmentTypes, 
    roleAccess, 
    userRole
  ]);
};

// Permission validation hook for detailed error handling
export const usePermissionValidation = () => {
  const { hasAccess } = useRoleBasedAccess();
  
  const validateWithDetails = (
    module: string, 
    action: keyof UserPermissions
  ): PermissionValidationResult => {
    const hasPermission = hasAccess(module, action);
    
    if (hasPermission) {
      return {
        isValid: true,
        module,
        action
      };
    }
    
    // Determine error type and provide helpful message
    let errorType: PermissionErrorType;
    let reason: string;
    let suggestion: string;
    
    if (!hasAccess(module, 'read')) {
      errorType = PermissionErrorType.NO_ACCESS;
      reason = `You don't have access to the ${module} module`;
      suggestion = 'Contact your administrator to request access';
    } else {
      errorType = PermissionErrorType[`${action.toUpperCase()}_DENIED` as keyof typeof PermissionErrorType];
      reason = `You don't have ${action} permission for ${module}`;
      suggestion = `Request ${action} permission from your administrator`;
    }
    
    return {
      isValid: false,
      module,
      action,
      reason,
      suggestion
    };
  };
  
  return { validateWithDetails };
};
