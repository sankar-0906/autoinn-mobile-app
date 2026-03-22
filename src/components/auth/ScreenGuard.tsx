import React from 'react';
import { View, Text } from 'react-native';
import { useRoleBasedAccess } from '../../hooks/useRoleBasedAccess';
import { ScreenGuardProps } from '../../types/permissions';

export const ScreenGuard: React.FC<ScreenGuardProps> = ({
  children,
  module,
  action = 'read',
  fallback,
  requireManager = false
}) => {
  const { hasAccess, isManager, userRole } = useRoleBasedAccess();

  // Check manager requirement
  if (requireManager && !isManager) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <View className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-sm w-full">
          <Text className="text-xl font-semibold text-gray-900 text-center mb-4">
            Access Denied
          </Text>
          <Text className="text-sm text-gray-600 text-center mb-2">
            Manager access required for {module}
          </Text>
          <Text className="text-xs text-gray-500 text-center">
            Current role: {userRole}
          </Text>
          <Text className="text-sm text-gray-600 text-center mt-4">
            Please contact your administrator if you believe this is an error.
          </Text>
        </View>
      </View>
    );
  }

  // Check permission
  if (!hasAccess(module, action)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <View className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-sm w-full">
          <Text className="text-xl font-semibold text-gray-900 text-center mb-4">
            Access Denied
          </Text>
          <Text className="text-sm text-gray-600 text-center mb-2">
            You don't have {action} permission for {module}
          </Text>
          <Text className="text-xs text-gray-500 text-center">
            Current role: {userRole}
          </Text>
          <Text className="text-sm text-gray-600 text-center mt-4">
            Please contact your administrator if you believe this is an error.
          </Text>
        </View>
      </View>
    );
  }

  return <>{children}</>;
};

// Higher-order component for screen protection
export const withScreenGuard = <P extends object>(
  Component: React.ComponentType<P>,
  module: string,
  action: keyof import('../../context/auth/types').UserPermissions = 'read',
  requireManager = false
) => {
  return (props: P) => (
    <ScreenGuard module={module} action={action} requireManager={requireManager}>
      <Component {...props} />
    </ScreenGuard>
  );
};
