import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBranches } from '../../api';
import { Platform, Alert } from 'react-native';
import { request, PERMISSIONS, RESULTS, check } from 'react-native-permissions';
import Geolocation from '@react-native-community/geolocation';
import { Branch, BranchContextType } from './types';

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

// Haversine formula to calculate distance between two points
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const BranchProvider: React.FC<BranchProviderProps> = ({ children }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [nearestBranch, setNearestBranch] = useState<Branch | null>(null);
  const [employeeBranch, setEmployeeBranch] = useState<Branch | null>(null);
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

  // Get current GPS location
  const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
    console.log('🌍 BranchContext - Starting GPS location request...');
    
    return new Promise((resolve) => {
      // Request location permission
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE 
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      console.log('🔐 BranchContext - Requesting permission:', permission);

      // First check current permission status
      check(permission)
        .then((status) => {
          console.log('📋 BranchContext - Current permission status:', status);
          
          if (status === RESULTS.GRANTED) {
            console.log('✅ BranchContext - Permission already granted, getting GPS location...');
            getGPSLocation(resolve);
          } else {
            console.log('🔓 BranchContext - Permission not granted, requesting...');
            request(permission)
              .then((result) => {
                console.log('� BranchContext - Permission request result:', result);
                
                if (result === RESULTS.GRANTED) {
                  console.log('✅ BranchContext - Permission granted, getting GPS location...');
                  getGPSLocation(resolve);
                } else if (result === RESULTS.DENIED) {
                  console.log('🚫🚫🚫 BranchContext - Location permission DENIED by user');
                  resolve(null);
                } else if (result === RESULTS.BLOCKED) {
                  console.log('🚫🚫🚫 BranchContext - Location permission BLOCKED - go to settings');
                  resolve(null);
                } else {
                  console.log('❓ BranchContext - Permission result unknown:', result);
                  resolve(null);
                }
              })
              .catch((error) => {
                console.error('💥💥💥 BranchContext - PERMISSION REQUEST ERROR:', error);
                resolve(null);
              });
          }
        })
        .catch((error) => {
          console.error('��� BranchContext - PERMISSION CHECK ERROR:', error);
          resolve(null);
        });
    });
  };

  // Helper function to get GPS location
  const getGPSLocation = (resolve: (value: { latitude: number; longitude: number } | null) => void) => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('📍📍📍 BranchContext - GPS LOCATION OBTAINED:', { latitude, longitude });
        console.log('📍 BranchContext - GPS accuracy:', position.coords.accuracy, 'meters');
        resolve({ latitude, longitude });
      },
      (error) => {
        console.error('❌❌❌ BranchContext - GPS ERROR:', error);
        console.error('❌ BranchContext - GPS error code:', error.code);
        console.error('❌ BranchContext - GPS error message:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  // Calculate nearest branch based on user location
  const calculateNearestBranch = (userLat: number, userLon: number, branchList: Branch[]): Branch | null => {
    if (branchList.length === 0) return null;

    let nearest = branchList[0];
    let minDistance = Infinity;

    branchList.forEach((branch) => {
      if (branch.lat && branch.lon) {
        const distance = getDistance(userLat, userLon, branch.lat, branch.lon);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = branch;
        }
      }
    });

    console.log('🎯 BranchContext - Nearest branch calculated:', nearest.name, `Distance: ${minDistance.toFixed(2)}km`);
    return nearest;
  };

  // Calculate and set nearest branch
  const calculateAndSetNearestBranch = async (branchList: Branch[]) => {
    console.log('🎯 BranchContext - Starting nearest branch calculation...');
    console.log('🏢 BranchContext - Available branches:', branchList.length);
    
    if (branchList.length === 0) {
      console.log('❌ BranchContext - No branches available for calculation');
      return;
    }

    console.log('📍 BranchContext - Requesting current GPS location...');
    const location = await getCurrentLocation();
    
    if (location) {
      console.log('✅ BranchContext - Location obtained, calculating nearest branch...');
      console.log('📍 BranchContext - User coordinates:', location);
      
      const nearest = calculateNearestBranch(location.latitude, location.longitude, branchList);
      if (nearest) {
        setNearestBranch(nearest);
        console.log('🎯🎯🎯 BranchContext - NEAREST BRANCH FOUND:', nearest.name);
        console.log('🎯 BranchContext - Nearest branch set successfully');
      } else {
        console.log('❌ BranchContext - Failed to calculate nearest branch');
      }
    } else {
      // Fallback to first branch if GPS fails
      console.log('🚫🚫� BranchContext - GPS FAILED, using first branch as fallback');
      console.log('📍 BranchContext - Fallback branch:', branchList[0].name);
      setNearestBranch(branchList[0]);
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
    fetchBranches();
  }, []);

  // Get employee branch when branches are loaded
  useEffect(() => {
    if (branches.length > 0) {
      getEmployeeBranch();
    }
  }, [branches]);

  // Don't auto-select branch here - let useBranchAutoFill handle the selection logic

  const value: BranchContextType = {
    branches,
    selectedBranch,
    nearestBranch,
    employeeBranch,
    isLoading,
    error,
    setBranches,
    setSelectedBranch,
    fetchBranches,
    getCurrentLocation,
    calculateNearestBranch: (userLat: number, userLon: number) => calculateNearestBranch(userLat, userLon, branches),
  };

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
};

export default BranchProvider;
