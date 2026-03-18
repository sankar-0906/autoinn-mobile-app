export interface UserPermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  print: boolean;
}

export interface RoleAccess {
  master: string;
  subModule: string;
  id?: string;
  access: UserPermissions;
}

export interface UserProfile {
  id: string;
  phone: string;
  profile?: {
    employeeName?: string;
    employeeId?: string;
    branch?: Array<{
      id: string;
      name: string;
    }>;
    department?: {
      role: string;
      departmentType: string[];
      othersAccess: boolean; // Manager option
      roleAccess?: RoleAccess[];
    };
  };
  status?: boolean;
}

export interface AuthContextType {
  user: UserProfile | null;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  isManager: boolean;
  departmentTypes: string[];
  roleAccess: RoleAccess[];
}

export interface PermissionHookType {
  hasAccess: (module: string, action: keyof UserPermissions) => boolean;
  canRead: (module: string) => boolean;
  canCreate: (module: string) => boolean;
  canUpdate: (module: string) => boolean;
  canDelete: (module: string) => boolean;
  getAccessibleModules: () => string[];
  isManager: boolean;
  departmentTypes: string[];
}
