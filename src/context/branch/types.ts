export interface Branch {
  id: string;
  name: string;
  lat?: number | null;
  lon?: number | null;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
}

export interface BranchContextType {
  branches: Branch[];
  selectedBranches: Branch[];
  selectedBranch: Branch | null;
  employeeBranch: Branch | null;
  nearestBranch: Branch | null;
  isLoading: boolean;
  error: string | null;
  setBranches: (branches: Branch[]) => void;
  setSelectedBranches: (branches: Branch[]) => void;
  setSelectedBranch: (branch: Branch | null) => void;
  fetchBranches: () => Promise<void>;
}
