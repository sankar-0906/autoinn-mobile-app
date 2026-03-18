import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Lock, AlertCircle } from 'lucide-react-native';

interface AccessDeniedScreenProps {
  message?: string;
  onBack?: () => void;
}

export const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({ 
  message = "You don't have permission to access this feature",
  onBack 
}) => {
  return (
    <View className="flex-1 justify-center items-center bg-gray-50 p-6">
      <View className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-sm w-full">
        <View className="items-center mb-6">
          <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4">
            <Lock size={32} color="#DC2626" />
          </View>
          <Text className="text-xl font-semibold text-gray-900 text-center">
            Access Denied
          </Text>
        </View>
        
        <View className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <View className="flex-row items-start">
            <AlertCircle size={16} color="#D97706" className="mt-0.5 mr-2" />
            <Text className="text-sm text-amber-800 flex-1">
              {message}
            </Text>
          </View>
        </View>

        <Text className="text-sm text-gray-600 text-center mb-6">
          Please contact your administrator if you believe this is an error.
        </Text>

        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            className="bg-teal-700 rounded-lg py-3 px-6 items-center"
          >
            <Text className="text-white font-medium">Go Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
