/**
 * useQuotationBranchAutoFill.ts
 *
 * React hook that wraps getBranchAutoFill() for the Add Quotation screen.
 *
 * Priority chain (same as web autoinn-fe):
 *  1. 🎯 Nearest Branch  – GPS location (high-accuracy, then falls back to network)
 *  2. 👤 Employee Branch – Logged-in employee's assigned branch
 *  3. 📍 First Available – branches[0] as final fallback
 *
 * AppState listener: automatically retries GPS when the user returns to the
 * app from the system permission/settings dialog, so granting permission
 * mid-session is seamlessly handled.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useBranch } from '../../context/branch';
import { getBranchAutoFill } from './getBranchAutoFill';
import type { BranchAutoFillResult } from './types';

export const useQuotationBranchAutoFill = (): BranchAutoFillResult => {
    const { branches, isLoading: branchLoading, fetchBranches } = useBranch();

    const [autoFilledBranchId, setAutoFilledBranchId] = useState<string | null>(null);
    const [autoFilledBranchName, setAutoFilledBranchName] = useState<string | null>(null);
    const [autoFilledBranchLat, setAutoFilledBranchLat] = useState<number | null>(null);
    const [autoFilledBranchLon, setAutoFilledBranchLon] = useState<number | null>(null);
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [branchPriority, setBranchPriority] = useState<'nearest' | 'employee' | 'first' | null>(null);

    // Track whether we've already resolved with GPS so we don't downgrade
    const resolvedWithGPS = useRef(false);
    const appState = useRef<AppStateStatus>(AppState.currentState);

    // -----------------------------------------------------------------------
    // Core auto-fill runner
    // -----------------------------------------------------------------------
    const runAutoFill = useCallback(async (branchList: typeof branches) => {
        if (branchList.length === 0) return;

        setIsAutoFilling(true);
        setError(null);

        try {
            console.log('🎯 useQuotationBranchAutoFill – Starting auto-fill…');

            const outcome = await getBranchAutoFill(branchList);

            if (!outcome) {
                setError('No branches available');
                return;
            }

            // Don't downgrade from GPS → employee if we already have GPS result
            if (resolvedWithGPS.current && outcome.priority !== 'nearest') {
                console.log('⏭️  useQuotationBranchAutoFill – Already have GPS result, skipping downgrade');
                return;
            }

            if (outcome.priority === 'nearest') {
                resolvedWithGPS.current = true;
            }

            setAutoFilledBranchId(outcome.branch.id);
            setAutoFilledBranchName(outcome.branch.name);
            setAutoFilledBranchLat(outcome.branch.lat ?? null);
            setAutoFilledBranchLon(outcome.branch.lon ?? null);
            setBranchPriority(outcome.priority);

            console.log(
                `✅ useQuotationBranchAutoFill – Resolved: ${outcome.branch.name} [${outcome.priority}]`,
            );
        } catch (err) {
            console.error('💥 useQuotationBranchAutoFill – Error:', err);
            setError('Failed to auto-fill branch');

            // Final safety net
            if (branchList.length > 0 && !resolvedWithGPS.current) {
                setAutoFilledBranchId(branchList[0].id);
                setAutoFilledBranchName(branchList[0].name);
                setBranchPriority('first');
            }
        } finally {
            setIsAutoFilling(false);
        }
    }, []);

    // -----------------------------------------------------------------------
    // Trigger when branches become available (initial load)
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (branches.length > 0 && !branchLoading) {
            runAutoFill(branches);
        }
    }, [branches, branchLoading]);

    // -----------------------------------------------------------------------
    // AppState listener: retry GPS when user returns from permission dialog
    // -----------------------------------------------------------------------
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            const wasBackground = appState.current === 'background' || appState.current === 'inactive';
            const comingToForeground = nextState === 'active';

            if (wasBackground && comingToForeground && !resolvedWithGPS.current) {
                console.log('🔁 useQuotationBranchAutoFill – App foregrounded, retrying GPS…');
                if (branches.length > 0) {
                    runAutoFill(branches);
                }
            }
            appState.current = nextState;
        });

        return () => subscription.remove();
    }, [branches, runAutoFill]);

    // -----------------------------------------------------------------------
    // Public retry (e.g. "Retry" button tap)
    // -----------------------------------------------------------------------
    const retryAutoFill = useCallback(async () => {
        console.log('🔄 useQuotationBranchAutoFill – Manual retry…');
        resolvedWithGPS.current = false; // allow re-resolution
        await fetchBranches();
        if (branches.length > 0) {
            await runAutoFill(branches);
        }
    }, [branches, fetchBranches, runAutoFill]);

    return {
        autoFilledBranchId,
        autoFilledBranchName,
        autoFilledBranchLat,
        autoFilledBranchLon,
        isAutoFilling: isAutoFilling || branchLoading,
        error,
        branchPriority,
        retryAutoFill,
    };
};
