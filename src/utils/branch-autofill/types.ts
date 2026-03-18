/**
 * Branch auto-fill types
 * Used by Quotations (and any other form that needs branch auto-selection).
 */

export interface BranchAutoFillResult {
    /** ID of the auto-selected branch, or null while loading */
    autoFilledBranchId: string | null;
    /** Human-readable branch name for display */
    autoFilledBranchName: string | null;
    /** Latitude of the resolved branch (for Google Maps link) */
    autoFilledBranchLat: number | null;
    /** Longitude of the resolved branch (for Google Maps link) */
    autoFilledBranchLon: number | null;
    /** Whether auto-fill is still in progress */
    isAutoFilling: boolean;
    /** Error message if auto-fill failed */
    error: string | null;
    /**
     * Which priority level was used:
     *  - 'nearest'  → GPS-based nearest branch (Primary)
     *  - 'employee' → Logged-in employee's assigned branch (Fallback)
     *  - 'first'    → First available branch (Final fallback)
     *  - null       → Not yet determined
     */
    branchPriority: 'nearest' | 'employee' | 'first' | null;
    /** Re-trigger the auto-fill process (e.g. after a permission grant) */
    retryAutoFill: () => Promise<void>;
}
