import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRoleBasedAccess } from '../src/hooks/useRoleBasedAccess';
import { ScreenGuard, ConditionalComponent, ConditionalButton, ConditionalView } from '../src/components/auth';
import { MOBILE_MODULES } from '../src/constants/modules';

// Example screen showing comprehensive role-based access implementation
export const RoleBasedAccessExample: React.FC = () => {
  const {
    hasAccess,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    canAccessModule,
    getModuleAccessInfo,
    isManager,
    userRole,
    getAccessibleModules,
    getAllPermissions
  } = useRoleBasedAccess();

  // Example: Permission checking for different modules
  const canReadQuotations = canRead(MOBILE_MODULES.QUOTATIONS);
  const canCreateQuotations = canCreate(MOBILE_MODULES.QUOTATIONS);
  const canUpdateQuotations = canUpdate(MOBILE_MODULES.QUOTATIONS);
  const canDeleteQuotations = canDelete(MOBILE_MODULES.QUOTATIONS);

  const canReadJobCards = canRead(MOBILE_MODULES.JOB_CARDS);
  const canCreateJobCards = canCreate(MOBILE_MODULES.JOB_CARDS);

  // Get detailed module access info
  const quotationAccess = getModuleAccessInfo(MOBILE_MODULES.QUOTATIONS);
  const jobCardAccess = getModuleAccessInfo(MOBILE_MODULES.JOB_CARDS);

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <View className="bg-white rounded-lg p-4 mb-4">
        <Text className="text-lg font-bold mb-2">User Information</Text>
        <Text className="text-sm text-gray-600">Role: {userRole}</Text>
        <Text className="text-sm text-gray-600">Manager: {isManager ? 'Yes' : 'No'}</Text>
        <Text className="text-sm text-gray-600">
          Accessible Modules: {getAccessibleModules().join(', ')}
        </Text>
      </View>

      {/* Screen Guard Example */}
      <ScreenGuard module={MOBILE_MODULES.QUOTATIONS} action="read">
        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-bold mb-2">Quotations Module</Text>
          
          <ConditionalComponent module={MOBILE_MODULES.QUOTATIONS} action="read">
            <View className="bg-green-50 p-3 rounded mb-2">
              <Text className="text-sm">✅ Can read quotations</Text>
            </View>
          </ConditionalComponent>

          <ConditionalComponent module={MOBILE_MODULES.QUOTATIONS} action="create">
            <View className="bg-blue-50 p-3 rounded mb-2">
              <Text className="text-sm">✅ Can create quotations</Text>
            </View>
          </ConditionalComponent>

          <ConditionalComponent module={MOBILE_MODULES.QUOTATIONS} action="update">
            <View className="bg-yellow-50 p-3 rounded mb-2">
              <Text className="text-sm">✅ Can update quotations</Text>
            </View>
          </ConditionalComponent>

          <ConditionalComponent module={MOBILE_MODULES.QUOTATIONS} action="delete">
            <View className="bg-red-50 p-3 rounded mb-2">
              <Text className="text-sm">✅ Can delete quotations</Text>
            </View>
          </ConditionalComponent>

          {/* Conditional Button Example */}
          <ConditionalButton
            module={MOBILE_MODULES.QUOTATIONS}
            action="create"
            onPress={() => console.log('Create quotation')}
            style="bg-blue-500 p-3 rounded mt-2"
            textStyle="text-white text-center font-medium"
          >
            Create New Quotation
          </ConditionalButton>
        </View>
      </ScreenGuard>

      {/* Job Cards Module Example */}
      <ScreenGuard module={MOBILE_MODULES.JOB_CARDS} action="read">
        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-bold mb-2">Job Cards Module</Text>
          
          <ConditionalView module={MOBILE_MODULES.JOB_CARDS} action="read">
            <View className="bg-green-50 p-3 rounded mb-2">
              <Text className="text-sm">✅ Can read job cards</Text>
            </View>
          </ConditionalView>

          <ConditionalView module={MOBILE_MODULES.JOB_CARDS} action="create">
            <View className="bg-blue-50 p-3 rounded mb-2">
              <Text className="text-sm">✅ Can create job cards</Text>
            </View>
          </ConditionalView>

          <ConditionalButton
            module={MOBILE_MODULES.JOB_CARDS}
            action="create"
            onPress={() => console.log('Create job card')}
            style="bg-teal-500 p-3 rounded mt-2"
            textStyle="text-white text-center font-medium"
          >
            Create New Job Card
          </ConditionalButton>
        </View>
      </ScreenGuard>

      {/* Manager-only Features */}
      <ScreenGuard module={MOBILE_MODULES.ACCOUNT} action="read" requireManager>
        <View className="bg-purple-50 rounded-lg p-4 mb-4">
          <Text className="text-lg font-bold mb-2 text-purple-800">Manager Only Features</Text>
          <Text className="text-sm text-purple-600 mb-2">
            These features require manager access
          </Text>
          <TouchableOpacity className="bg-purple-600 p-3 rounded">
            <Text className="text-white text-center font-medium">
              Access Employee Management
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenGuard>

      {/* Detailed Access Information */}
      <View className="bg-white rounded-lg p-4 mb-4">
        <Text className="text-lg font-bold mb-2">Detailed Access Information</Text>
        
        {quotationAccess && (
          <View className="mb-3">
            <Text className="font-medium">Quotations Access:</Text>
            <Text className="text-xs text-gray-600">
              Read: {quotationAccess.permissions.canRead ? '✅' : '❌'} | 
              Create: {quotationAccess.permissions.canCreate ? '✅' : '❌'} | 
              Update: {quotationAccess.permissions.canUpdate ? '✅' : '❌'} | 
              Delete: {quotationAccess.permissions.canDelete ? '✅' : '❌'}
            </Text>
          </View>
        )}

        {jobCardAccess && (
          <View className="mb-3">
            <Text className="font-medium">Job Cards Access:</Text>
            <Text className="text-xs text-gray-600">
              Read: {jobCardAccess.permissions.canRead ? '✅' : '❌'} | 
              Create: {jobCardAccess.permissions.canCreate ? '✅' : '❌'} | 
              Update: {jobCardAccess.permissions.canUpdate ? '✅' : '❌'} | 
              Delete: {jobCardAccess.permissions.canDelete ? '✅' : '❌'}
            </Text>
          </View>
        )}
      </View>

      {/* All Permissions (Debug) */}
      <View className="bg-gray-100 rounded-lg p-4">
        <Text className="text-sm font-bold mb-2">All Permissions (Debug):</Text>
        {getAllPermissions().map((permission, index) => (
          <Text key={index} className="text-xs text-gray-600">
            {permission.module}.{permission.action}: {permission.hasAccess ? '✅' : '❌'}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};

// Example of how to protect an entire screen
export const ProtectedQuotationScreen = () => {
  return (
    <ScreenGuard module={MOBILE_MODULES.QUOTATIONS} action="read">
      {/* Your existing QuotationsListScreen content */}
      <RoleBasedAccessExample />
    </ScreenGuard>
  );
};

// Example of HOC usage
export const ProtectedJobCardScreen = () => {
  return (
    <ScreenGuard module={MOBILE_MODULES.JOB_CARDS} action="read">
      <View className="flex-1 justify-center items-center">
        <Text>Job Cards Screen - Protected Content</Text>
        
        <ConditionalComponent module={MOBILE_MODULES.JOB_CARDS} action="create">
          <TouchableOpacity className="bg-blue-500 p-4 rounded mt-4">
            <Text className="text-white">Create Job Card</Text>
          </TouchableOpacity>
        </ConditionalComponent>
      </View>
    </ScreenGuard>
  );
};
