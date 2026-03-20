import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform, Text, TouchableOpacity, View, BackHandler, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';

type LocationGateNavigationProp = StackNavigationProp<RootStackParamList, 'LocationGate'>;

type GateStatus = 'checking' | 'permission_denied' | 'ready';

export default function LocationGateScreen({ navigation }: { navigation: LocationGateNavigationProp }) {
  const [status, setStatus] = useState<GateStatus>('checking');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const isCheckingRef = useRef(false);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const waitForServicesEnabled = async (retries: number, delayMs: number) => {
    for (let i = 0; i < retries; i += 1) {
      const enabled = await Location.hasServicesEnabledAsync();
      if (enabled) return true;
      await sleep(delayMs);
    }
    return false;
  };

  const openSettings = async () => {
    await Linking.openSettings();
  };

  const exitApp = () => {
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    }
  };

  const runChecks = async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setStatus('checking');
    try {
      let servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled && Platform.OS === 'android') {
        try {
          await Location.enableNetworkProviderAsync();
        } catch (e) {
          // User canceled or system dialog not available
        }
        servicesEnabled = await waitForServicesEnabled(10, 400);
      }

      if (!servicesEnabled) {
        Alert.alert(
          'Enable Location',
          'Location services are turned off. Please enable location to continue.',
          [
            { text: 'Open Settings', onPress: openSettings },
            Platform.OS === 'android' ? { text: 'Exit', onPress: exitApp, style: 'destructive' } : { text: 'OK' },
          ]
        );
        setStatus('checking');
        return;
      }

      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status === 'granted') {
        setStatus('ready');
        return;
      }

      setCanAskAgain(perm.canAskAgain);
      setStatus('permission_denied');
    } catch (e) {
      setStatus('services_off');
    } finally {
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    runChecks();
  }, []);

  useEffect(() => {
    if (status === 'ready') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [navigation, status]);

  useEffect(() => {
    const handler = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        runChecks();
      }
    };
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-100 items-center justify-center px-6">
      <View className="w-full max-w-md bg-white rounded-xl p-6 border border-gray-100">
        {status === 'checking' && (
          <>
            <Text className="text-lg font-semibold text-gray-900 mb-2">Checking location...</Text>
            <Text className="text-sm text-gray-600">Please wait while we verify location settings.</Text>
          </>
        )}

        {status === 'permission_denied' && (
          <>
            <Text className="text-lg font-semibold text-gray-900 mb-2">Location Permission Needed</Text>
            <Text className="text-sm text-gray-600 mb-4">
              This app needs location permission to continue.
            </Text>
            {canAskAgain ? (
              <TouchableOpacity
                onPress={runChecks}
                className="h-11 rounded-md items-center justify-center bg-teal-700 mb-3"
                activeOpacity={0.85}
              >
                <Text className="text-white font-medium">Grant Permission</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={openSettings}
                className="h-11 rounded-md items-center justify-center bg-teal-700 mb-3"
                activeOpacity={0.85}
              >
                <Text className="text-white font-medium">Open Settings</Text>
              </TouchableOpacity>
            )}
            {Platform.OS === 'android' && (
              <TouchableOpacity
                onPress={exitApp}
                className="h-11 rounded-md items-center justify-center bg-gray-200"
                activeOpacity={0.85}
              >
                <Text className="text-gray-800 font-medium">Exit App</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
