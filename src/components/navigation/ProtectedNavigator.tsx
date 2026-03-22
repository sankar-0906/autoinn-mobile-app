import React from 'react';
import { View, Text } from 'react-native';
import { useRoleBasedAccess } from '../../hooks/useRoleBasedAccess';
import { ProtectedNavigatorProps } from '../../types/permissions';

export const ProtectedNavigator: React.FC<ProtectedNavigatorProps> = ({
  children,
  requiredModule,
  action = 'read',
  fallback
}) => {
  const { canAccessModule, userRole } = useRoleBasedAccess();

  if (!canAccessModule(requiredModule)) {
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
            You don't have permission to access this module
          </Text>
          <Text className="text-xs text-gray-500 text-center">
            Module: {requiredModule} | Role: {userRole}
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
