import "./global.css";
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Debug: Catch AttachQuotationModal errors
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('AttachQuotationModal')) {
    console.log('🐛 AttachQuotationModal Error Caught:', args);
    console.log('🐛 Stack Trace:', new Error().stack);
  }
  originalConsoleError(...args);
};

// React Native error handling
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

// Custom error handler for React Native
const originalErrorHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  if (error.message && error.message.includes('AttachQuotationModal')) {
    console.log('🐛 React Native AttachQuotationModal Error:', error);
    console.log('🐛 Error Stack:', error.stack);
  }
  originalErrorHandler(error, isFatal);
});

import { ToastProvider } from './src/ToastContext';
import { AuthProvider } from './src/context/auth/AuthContext';
import { BranchProvider } from './src/context/branch';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <BranchProvider>
            <ToastProvider>
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </ToastProvider>
          </BranchProvider>
        </AuthProvider>
      </SafeAreaProvider>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
