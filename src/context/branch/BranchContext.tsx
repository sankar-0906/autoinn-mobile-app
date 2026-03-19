import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { getBranches } from '../../api';
import { Branch, BranchContextType } from './types';

// Haversine formula
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};

interface BranchProviderProps {
  children: ReactNode;
}


export const BranchProvider: React.FC<BranchProviderProps> = ({ children }) => {
  console.log('🌐 BranchProvider - Provider mounted');
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [employeeBranch, setEmployeeBranch] = useState<Branch | null>(null);
  const [nearestBranch, setNearestBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch branches from API
  const fetchBranches = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🌐 BranchContext - Fetching branches...');
      const res = await getBranches();
      const data = res?.data;

      if (data && data.code === 200 && data.response?.code === 200) {
        const list = data.response.data || [];
        console.log('🏢 BranchContext - Branches loaded:', list.length);

        const branchList: Branch[] = list.map((b: any) => ({
          id: b.id,
          name: b.name,
          lat: b.lat ? Number(b.lat) : null,
          lon: b.lon ? Number(b.lon) : null,
          address: b.address,
          city: b.city,
          state: b.state,
          phone: b.phone,
          email: b.email,
        }));

        setBranches(branchList);
        console.log('✅ BranchContext - Branches set successfully');

        // Don't automatically calculate nearest branch here - let useBranchAutoFill handle it
        console.log('🏢 BranchContext - Branches loaded, waiting for auto-fill hook to process...');
      } else {
        console.error('❌ BranchContext - API error:', data);
        setError('Failed to fetch branches');
      }
    } catch (err) {
      console.error('💥 BranchContext - Error fetching branches:', err);
      setError('Error fetching branches');
    } finally {
      setIsLoading(false);
    }
  };

  // Get employee branch from user profile
  const getEmployeeBranch = async () => {
    try {
      const profileRaw = await AsyncStorage.getItem('userProfile');
      if (profileRaw) {
        const profile = JSON.parse(profileRaw);
        const branchData = profile?.branch || profile?.profile?.branch;

        if (branchData) {
          const normalizeBranchId = (b: any) => (typeof b === 'string' ? b : b?.id || b?._id);
          const profileBranch = Array.isArray(branchData)
            ? normalizeBranchId(branchData[0])
            : normalizeBranchId(branchData);

          const empBranch = branches.find(b => b.id === profileBranch);
          if (empBranch) {
            setEmployeeBranch(empBranch);
            console.log('👤 BranchContext - Employee branch set:', empBranch.name);
          }
        }
      }
    } catch (err) {
      console.error('💥 BranchContext - Error getting employee branch:', err);
    }
  };

  // Initialize on mount
  useEffect(() => {
    console.log('🌐 BranchContext - Initializing, fetching branches...');
    fetchBranches();
  }, []);

  // Get employee branch when branches are loaded
  useEffect(() => {
    console.log('👥 BranchContext - Branches loaded:', branches.length);
    if (branches.length > 0) {
      getEmployeeBranch();
    }
  }, [branches]);

  // Nearest Branch Logic
  const computeNearestBranch = async () => {
    console.log('📍 BranchContext - Computing nearest branch, branches count:', branches.length);
    if (branches.length === 0) return;

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        console.log('📍 BranchContext - Location services disabled, skipping permission prompt');
        setNearestBranch(branches[0]);
        return;
      }

      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        console.log('📍 BranchContext - Location permission not granted, skipping prompt');
        setNearestBranch(branches[0]);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const userLat = location.coords.latitude;
      const userLon = location.coords.longitude;

      let nearest = branches[0];
      let minDistance = -1;

      branches.forEach((branch) => {
        if (branch.lat != null && branch.lon != null) {
          const distance = getDistance(userLat, userLon, branch.lat, branch.lon);
          if (minDistance === -1 || distance < minDistance) {
            minDistance = distance;
            nearest = branch;
          }
        }
      });

      console.log('📍 BranchContext - Nearest branch set:', nearest?.name);
      setNearestBranch(nearest || branches[0]);
    } catch (err) {
      console.error('💥 BranchContext - Error getting nearest branch:', err);
      setNearestBranch(branches[0]);
    }
  };

  useEffect(() => {
    console.log('📍 BranchContext - Nearest branch effect triggered, branches count:', branches.length);
    computeNearestBranch();
  }, [branches]);

  useEffect(() => {
    const onAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        computeNearestBranch();
      }
    };
    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, [branches]);

  const value: BranchContextType = {
    branches,
    selectedBranch,
    employeeBranch,
    nearestBranch,
    isLoading,
    error,
    setBranches,
    setSelectedBranch,
    fetchBranches,
  };

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
};

export default BranchProvider;
