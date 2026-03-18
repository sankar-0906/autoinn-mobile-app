/**
 * useJobCardFilters hook
 * Fetches Vehicle Models and Mechanics from API for filter dropdowns.
 * Mirrors Quotation AdvancedFiltersScreen pattern.
 */

import { useState, useEffect, useCallback } from 'react';
import { getVehicleMasterForFilter, getAllUsers } from '../../api/job-cards/jobCardApi';
import type { VehicleModelOption, MechanicUser } from '../../../types/job-cards';

// Full list of job statuses (from autoinn-fe, §5 of Report)
export const ALL_JOB_STATUSES = [
    'Vehicle Received',
    'Estimation',
    'Estimation Approved',
    'Mechanic Allocated',
    'Spares Ordered',
    'Material Issued',
    'Work In Progress',
    'Final Inspection',
    'Proforma Invoice',
    'Invoice',
    'PAID',
    'Payment Received',
    'Gate Pass',
];

// Full list of service types (from autoinn-fe)
export const ALL_SERVICE_TYPES = [
    'Free',
    'Extended Warranty',
    'Paid (UW)',
    'Paid (AW)',
    'AMC',
    'Accidental',
    'Minor',
    'PDI',
];

export function useJobCardFilters() {
    const [vehicleModels, setVehicleModels] = useState<VehicleModelOption[]>([]);
    const [mechanics, setMechanics] = useState<MechanicUser[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchFilterData = useCallback(async () => {
        setLoading(true);
        try {
            const [modelsRes, usersRes] = await Promise.all([
                getVehicleMasterForFilter(),
                getAllUsers(),
            ]);

            // Vehicle models
            if (modelsRes.data?.code === 200 && modelsRes.data?.response?.code === 200) {
                setVehicleModels(modelsRes.data.response.data || []);
            }

            // Mechanics: filter by role === 'Mechanic' and status === true
            if (usersRes.data?.code === 200) {
                const allUsers: MechanicUser[] = usersRes.data?.data?.users || [];
                const mechanicUsers = allUsers.filter(
                    u => u.status === true &&
                        u.profile?.department?.role === 'Mechanic'
                );
                setMechanics(mechanicUsers);
            }
        } catch (err) {
            console.error('useJobCardFilters fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFilterData();
    }, [fetchFilterData]);

    return {
        vehicleModels,
        mechanics,
        loading,
        refetch: fetchFilterData,
    };
}
