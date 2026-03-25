import { useEffect, useState } from 'react';
import { useBranch } from '../context/branch';

export interface UseBranchAutoFillResult {
  autoFilledBranch: string | null;
  isAutoFilling: boolean;
  error: string | null;
  branchPriority: 'employee' | 'first' | 'nearest' | null;
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
  } = useBranch();

  const [autoFilledBranch, setAutoFilledBranch] = useState<string | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branchPriority, setBranchPriority] = useState<'employee' | 'first' | 'nearest' | null>(null);

  // Sync nearest branch when it's available
  useEffect(() => {
    if (nearestBranch) {
      setAutoFilledBranch(nearestBranch.id);
      setBranchPriority('nearest');
    } else if (selectedBranch) {
      setAutoFilledBranch(selectedBranch.id);
      setBranchPriority(null); // manually selected (or global fallback)
    } else if (employeeBranch) {
      setAutoFilledBranch(employeeBranch.id);
      setBranchPriority('employee');
    } else if (branches.length > 0) {
      setAutoFilledBranch(branches[0].id);
      setBranchPriority('first');
    }
  }, [selectedBranch, nearestBranch, branches, employeeBranch]);

  // Retry auto-fill
  const retryAutoFill = async () => {
    console.log('🔄 useBranchAutoFill - Retrying auto-fill...');
    setIsAutoFilling(true);
    await fetchBranches();
    setIsAutoFilling(false);
  };

  return {
    autoFilledBranch,
    isAutoFilling: isAutoFilling || branchLoading,
    error,
    branchPriority,
    retryAutoFill,
  };
};
