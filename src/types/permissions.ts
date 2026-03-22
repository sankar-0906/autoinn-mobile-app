import { UserPermissions, RoleAccess } from '../context/auth/types';
import { MODULE_CATEGORIES, MOBILE_MODULES } from '../constants/modules';

// Enhanced permission types
export interface PermissionCheck {
  module: string;
  action: keyof UserPermissions;
  hasAccess: boolean;
}

export interface NavigationPermission {
  screenName: string;
  moduleName: string;
  canAccess: boolean;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface ModuleAccessInfo {
  module: string;
  displayName: string;
  category: string;
  permissions: {
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canPrint: boolean;
  };
  isAccessible: boolean;
}

export interface RoleBasedAccessHook {
  // Basic permission checks
  hasAccess: (module: string, action: keyof UserPermissions) => boolean;
  canRead: (module: string) => boolean;
  canCreate: (module: string) => boolean;
  canUpdate: (module: string) => boolean;
  canDelete: (module: string) => boolean;
  canPrint: (module: string) => boolean;
  
  // Module-level access
  canAccessModule: (module: string) => boolean;
  getAccessibleModules: () => string[];
  getModuleAccessInfo: (module: string) => ModuleAccessInfo | null;
  
  // Navigation guards
  canNavigateTo: (screenName: string) => boolean;
  getNavigationPermissions: () => NavigationPermission[];
  
  // Category-level access
  hasCategoryAccess: (category: keyof typeof MODULE_CATEGORIES) => boolean;
  getCategoryModules: (category: keyof typeof MODULE_CATEGORIES) => string[];
  
  // Manager and department info
  isManager: boolean;
  departmentTypes: string[];
  userRole: string;
  
  // Utility methods
  validatePermission: (module: string, action: keyof UserPermissions) => PermissionCheck;
  getAllPermissions: () => PermissionCheck[];
}

export interface ScreenGuardProps {
  children: React.ReactNode;
  module: string;
  action?: keyof UserPermissions;
  fallback?: React.ReactNode;
  requireManager?: boolean;
}

export interface ConditionalComponentProps {
  children: React.ReactNode;
  module: string;
  action: keyof UserPermissions;
  fallback?: React.ReactNode;
  requireManager?: boolean;
}

export interface ProtectedNavigatorProps {
  children: React.ReactNode;
  requiredModule: string;
  action?: keyof UserPermissions;
  fallback?: React.ReactNode;
}

export interface AccessDeniedProps {
  message?: string;
  onBack?: () => void;
  module?: string;
  action?: keyof UserPermissions;
}

// Permission validation result
export interface PermissionValidationResult {
  isValid: boolean;
  module: string;
  action: keyof UserPermissions;
  reason?: string;
  suggestion?: string;
}

// Role access mapping for mobile app
export interface MobileRoleAccess {
  [MOBILE_MODULES.QUOTATIONS]: {
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canPrint: boolean;
  };
  [MOBILE_MODULES.JOB_CARDS]: {
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canPrint: boolean;
  };
  [MOBILE_MODULES.ACCOUNT]: {
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canPrint: boolean;
  };
}

// Permission error types
export enum PermissionErrorType {
  NO_ACCESS = 'NO_ACCESS',
  READ_DENIED = 'READ_DENIED',
  CREATE_DENIED = 'CREATE_DENIED',
  UPDATE_DENIED = 'UPDATE_DENIED',
  DELETE_DENIED = 'DELETE_DENIED',
  PRINT_DENIED = 'PRINT_DENIED',
  MODULE_NOT_FOUND = 'MODULE_NOT_FOUND',
  INVALID_ACTION = 'INVALID_ACTION'
}

export interface PermissionError {
  type: PermissionErrorType;
  module: string;
  action: keyof UserPermissions;
  message: string;
  userRole?: string;
  timestamp: Date;
}
