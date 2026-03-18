export interface Branch {
  id: string;
  name: string;
  lat?: number;
  lon?: number;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
}

export interface BranchContextType {
  branches: Branch[];
  selectedBranch: Branch | null;
  nearestBranch: Branch | null;
  employeeBranch: Branch | null;
  isLoading: boolean;
  error: string | null;
  setBranches: (branches: Branch[]) => void;
  setSelectedBranch: (branch: Branch | null) => void;
  fetchBranches: () => Promise<void>;
  getCurrentLocation: () => Promise<{ latitude: number; longitude: number } | null>;
  calculateNearestBranch: (userLat: number, userLon: number) => Branch | null;
}
