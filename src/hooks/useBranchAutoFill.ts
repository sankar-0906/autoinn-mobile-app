import { useEffect, useState } from 'react';
import { useBranch } from '../context/branch';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UseBranchAutoFillResult {
  autoFilledBranch: string | null;
  isAutoFilling: boolean;
  error: string | null;
  branchPriority: 'nearest' | 'employee' | 'first' | null;
  retryAutoFill: () => Promise<void>;
}

export const useBranchAutoFill = (): UseBranchAutoFillResult => {
  const {
    branches,
    selectedBranch,
    nearestBranch,
    employeeBranch,
    isLoading: branchLoading,
    fetchBranches,
    getCurrentLocation,
    calculateNearestBranch,
  } = useBranch();

  const [autoFilledBranch, setAutoFilledBranch] = useState<string | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branchPriority, setBranchPriority] = useState<'nearest' | 'employee' | 'first' | null>(null);

  // Auto-fill branch based on priority
  const autoFillBranch = async () => {
    if (branches.length === 0) {
      console.log('🚫 useBranchAutoFill - No branches available');
      return;
    }

    setIsAutoFilling(true);
    setError(null);

    try {
      console.log('🎯 useBranchAutoFill - Starting auto-fill process...');

      // Priority 1: Nearest Branch (GPS-based) - Force GPS request
      console.log('📍 useBranchAutoFill - Getting current GPS location...');
      const location = await getCurrentLocation();
      
      if (location) {
        console.log('✅ useBranchAutoFill - GPS location obtained:', location);
        const calculatedNearest = calculateNearestBranch(location.latitude, location.longitude);
        
        if (calculatedNearest) {
          console.log('🎯 useBranchAutoFill - Nearest branch calculated:', calculatedNearest.name);
          setAutoFilledBranch(calculatedNearest.id);
          setBranchPriority('nearest');
          return;
        }
      } else {
        console.log('❌ useBranchAutoFill - GPS location failed');
      }

      // Priority 2: Employee Branch (from user profile)
      if (employeeBranch) {
        console.log('👤 useBranchAutoFill - Using employee branch:', employeeBranch.name);
        setAutoFilledBranch(employeeBranch.id);
        setBranchPriority('employee');
        return;
      }

      // Priority 3: First Available Branch (fallback)
      console.log('📍 useBranchAutoFill - Using first available branch as fallback:', branches[0].name);
      setAutoFilledBranch(branches[0].id);
      setBranchPriority('first');

    } catch (err) {
      console.error('💥 useBranchAutoFill - Error during auto-fill:', err);
      setError('Failed to auto-fill branch');
      
      // Final fallback
      if (branches.length > 0) {
        setAutoFilledBranch(branches[0].id);
        setBranchPriority('first');
      }
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Retry auto-fill
  const retryAutoFill = async () => {
    console.log('🔄 useBranchAutoFill - Retrying auto-fill...');
    await fetchBranches();
    await autoFillBranch();
  };

  // Auto-fill when branches are loaded or when branch states change
  useEffect(() => {
    if (branches.length > 0 && !branchLoading) {
      autoFillBranch();
    }
  }, [branches, nearestBranch, employeeBranch, branchLoading]);

  // Auto-fill when selected branch changes externally
  useEffect(() => {
    if (selectedBranch) {
      setAutoFilledBranch(selectedBranch.id);
      
      // Determine priority based on which branch matches
      if (nearestBranch?.id === selectedBranch.id) {
        setBranchPriority('nearest');
      } else if (employeeBranch?.id === selectedBranch.id) {
        setBranchPriority('employee');
      } else if (branches[0]?.id === selectedBranch.id) {
        setBranchPriority('first');
      } else {
        setBranchPriority(null); // Manually selected
      }
    }
  }, [selectedBranch, nearestBranch, employeeBranch, branches]);

  return {
    autoFilledBranch,
    isAutoFilling: isAutoFilling || branchLoading,
    error,
    branchPriority,
    retryAutoFill,
  };
};
