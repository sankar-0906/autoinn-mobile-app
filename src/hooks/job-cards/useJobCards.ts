/**
 * useJobCards hook
 * Handles list API: POST /api/jobOrder/get
 * Mirrors the exact behaviour of the Quotation list screen.
 */

import { useState, useCallback } from 'react';
import { getJobCards } from '../../api/job-cards/jobCardApi';
import type {
    JobCardRecord,
    TabStatus,
    JobCardFilter,
} from '../../../types/job-cards';
import { useAuth } from '../../context';

interface UseJobCardsOptions {
    pageSize?: number;
}

const DEFAULT_FILTER: JobCardFilter = {
    model: null,
    serviceType: null,
    mechanic: [],
    registerNo: null,
    serviceKmFrom: null,
    serviceKmTo: null,
    from: null,
    to: null,
    jobStatus: null,
};

export function useJobCards({ pageSize = 10 }: UseJobCardsOptions = {}) {
    const { user } = useAuth();

    const [data, setData] = useState<JobCardRecord[]>([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState<JobCardFilter>(DEFAULT_FILTER);

    /** Build branch ID array from user profile */
    const getBranchIds = useCallback((): string[] => {
        if (!user?.profile?.branch) return [];
        return user.profile.branch.map((b: any) => b.id);
    }, [user]);

    /** Fetch job cards. Call this whenever tab/page/search/filter changes. */
    const fetchJobCards = useCallback(async (
        status: TabStatus,
        searchString: string,
        currentPage: number,
        activeFilter: JobCardFilter,
    ) => {
        setLoading(true);
        setError(null);
        try {
            const branchIds = getBranchIds();

            // If user is a Mechanic, force mechanic filter to their own ID
            const isMechanic = user?.profile?.department?.role === 'Mechanic';
            const mechanicFilter = isMechanic && user?.profile?.employeeId
                ? [user.profile.employeeId]
                : activeFilter.mechanic || [];

            const payload = {
                page: currentPage,
                size: pageSize,
                filter: {
                    ...activeFilter,
                    mechanic: mechanicFilter,
                },
                searchString,
                status,
                branch: branchIds,
            };

            const res = await getJobCards(payload);
            const { data: resData } = res;

            if (resData?.code === 200 && resData?.response?.code === 200) {
                setData(resData.response.data.jobOrder || []);
                setCount(resData.response.data.count || 0);
            } else {
                setError('Failed to fetch Job Cards');
            }
        } catch (err: any) {
            setError('Failed to fetch Job Cards');
            console.error('useJobCards error:', err);
        } finally {
            setLoading(false);
        }
    }, [getBranchIds, user, pageSize]);

    const resetFilter = useCallback(() => setFilter(DEFAULT_FILTER), []);

    return {
        data,
        count,
        loading,
        error,
        page,
        setPage,
        filter,
        setFilter,
        fetchJobCards,
        resetFilter,
    };
}
