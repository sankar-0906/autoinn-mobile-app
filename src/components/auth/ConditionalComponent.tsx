import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useRoleBasedAccess } from '../../hooks/useRoleBasedAccess';
import { ConditionalComponentProps } from '../../types/permissions';

export const ConditionalComponent: React.FC<ConditionalComponentProps> = ({
  children,
  module,
  action,
  fallback = null,
  requireManager = false
}) => {
  const { hasAccess, isManager } = useRoleBasedAccess();

  // Check manager requirement
  if (requireManager && !isManager) {
    return <>{fallback}</>;
  }

  // Check permission
  if (!hasAccess(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Specialized conditional components for common use cases
export const ConditionalButton: React.FC<{
  children: React.ReactNode;
  module: string;
  action: keyof import('../../context/auth/types').UserPermissions;
  onPress?: () => void;
  style?: any;
  textStyle?: any;
  disabled?: boolean;
  requireManager?: boolean;
}> = ({ 
  children, 
  module, 
  action, 
  onPress, 
  style, 
  textStyle, 
  disabled = false,
  requireManager = false 
}) => {
  const { hasAccess, isManager } = useRoleBasedAccess();

  const hasPermission = !requireManager || isManager;
  const canPerformAction = hasAccess(module, action);

  if (!hasPermission || !canPerformAction) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={style}
      disabled={disabled}
    >
      <Text style={textStyle}>{children}</Text>
    </TouchableOpacity>
  );
};

export const ConditionalView: React.FC<{
  children: React.ReactNode;
  module: string;
  action: keyof import('../../context/auth/types').UserPermissions;
  requireManager?: boolean;
}> = ({ children, module, action, requireManager = false }) => {
  const { hasAccess, isManager } = useRoleBasedAccess();

  const hasPermission = !requireManager || isManager;
  const canPerformAction = hasAccess(module, action);

  if (!hasPermission || !canPerformAction) {
    return null;
  }

  return <>{children}</>;
};
