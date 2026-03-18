/**
 * useJobCardVehicleSearch hook
 * Handles all the vehicle/customer search and selection logic
 * for the AddJobCard screen (Step 1).
 */

import { useState, useCallback } from 'react';
import {
    searchJobCardCustomers,
    searchVehicleByRegNo,
    searchVehicleByChassisNo,
    getVehiclesByCustomer,
    getVehicleByRegisterNo,
    getVehicleByChassis,
} from '../../api/job-cards/jobCardApi';
import type { JobCardCustomer, JobCardVehicle } from '../../../types/job-cards';

export function useJobCardVehicleSearch() {
    const [customerOptions, setCustomerOptions] = useState<JobCardCustomer[]>([]);
    const [vehicleOptions, setVehicleOptions] = useState<JobCardVehicle[]>([]);
    const [chassisOptions, setChassisOptions] = useState<JobCardVehicle[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<JobCardCustomer | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<JobCardVehicle | null>(null);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [loadingVehicles, setLoadingVehicles] = useState(false);

    /** Search customers by phone */
    const searchCustomers = useCallback(async (query: string) => {
        if (!query || query.length < 2) return;
        setLoadingCustomers(true);
        try {
            const res = await searchJobCardCustomers(query);
            if (res.data?.response) {
                setCustomerOptions(res.data.response || []);
            }
        } catch (err) {
            console.error('searchCustomers error:', err);
        } finally {
            setLoadingCustomers(false);
        }
    }, []);

    /** When customer is selected: fetch their vehicles */
    const onSelectCustomer = useCallback(async (customer: JobCardCustomer) => {
        setSelectedCustomer(customer);
        setSelectedVehicle(null);
        setLoadingVehicles(true);
        try {
            const res = await getVehiclesByCustomer(customer.id);
            const { data } = res;
            if (data?.code === 200 && data?.response?.code === 200) {
                const vehicles: JobCardVehicle[] = data.response.data || [];
                setVehicleOptions(vehicles);
                setChassisOptions(vehicles);
            }
        } catch (err) {
            console.error('onSelectCustomer error:', err);
        } finally {
            setLoadingVehicles(false);
        }
    }, []);

    /** Search vehicles by register no text */
    const searchVehicles = useCallback(async (query: string) => {
        if (!query || query.length < 2) return;
        setLoadingVehicles(true);
        try {
            const res = await searchVehicleByRegNo(query);
            if (res.data?.response) {
                setVehicleOptions(res.data.response || []);
            }
        } catch (err) {
            console.error('searchVehicles error:', err);
        } finally {
            setLoadingVehicles(false);
        }
    }, []);

    /** Search by chassis no text */
    const searchByChassis = useCallback(async (query: string) => {
        if (!query || query.length < 2) return;
        try {
            const res = await searchVehicleByChassisNo(query);
            if (res.data?.response) {
                setChassisOptions(res.data.response || []);
            }
        } catch (err) {
            console.error('searchByChassis error:', err);
        }
    }, []);

    /** When vehicle register no is selected: fetch full vehicle details */
    const onSelectVehicle = useCallback(async (vehicleId: string) => {
        setLoadingVehicles(true);
        try {
            const res = await getVehicleByRegisterNo(vehicleId);
            const { data } = res;
            if (data?.code === 200 && data?.response?.code === 200) {
                const vehicle: JobCardVehicle = data.response.data;
                setSelectedVehicle(vehicle);
                // Sync customer if not yet set
                if (!selectedCustomer && vehicle.customer && vehicle.customer.length > 0) {
                    setSelectedCustomer(vehicle.customer[0].customer);
                }
                return vehicle;
            }
        } catch (err) {
            console.error('onSelectVehicle error:', err);
        } finally {
            setLoadingVehicles(false);
        }
        return null;
    }, [selectedCustomer]);

    /** When chassis no is selected: fetch full vehicle details */
    const onSelectChassis = useCallback(async (vehicleId: string) => {
        setLoadingVehicles(true);
        try {
            const res = await getVehicleByChassis(vehicleId);
            const { data } = res;
            if (data?.code === 200 && data?.response?.code === 200) {
                const vehicle: JobCardVehicle = data.response.data;
                setSelectedVehicle(vehicle);
                if (!selectedCustomer && vehicle.customer && vehicle.customer.length > 0) {
                    setSelectedCustomer(vehicle.customer[0].customer);
                }
                return vehicle;
            }
        } catch (err) {
            console.error('onSelectChassis error:', err);
        } finally {
            setLoadingVehicles(false);
        }
        return null;
    }, [selectedCustomer]);

    const clearAll = useCallback(() => {
        setSelectedCustomer(null);
        setSelectedVehicle(null);
        setVehicleOptions([]);
        setChassisOptions([]);
        setCustomerOptions([]);
    }, []);

    return {
        customerOptions,
        vehicleOptions,
        chassisOptions,
        selectedCustomer,
        selectedVehicle,
        loadingCustomers,
        loadingVehicles,
        searchCustomers,
        onSelectCustomer,
        searchVehicles,
        searchByChassis,
        onSelectVehicle,
        onSelectChassis,
        clearAll,
        setSelectedCustomer,
        setSelectedVehicle,
    };
}
