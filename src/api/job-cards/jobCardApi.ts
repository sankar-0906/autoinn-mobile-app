/**
 * Job Cards API layer
 * All endpoints as per autoinn-fe web app analysis.
 */

import platformApi from '../../api';
import type {
    GetJobCardsPayload,
    CreateJobCardPayload,
    JobCardFilter,
} from '../../../types/job-cards';

// ── 1. List Job Orders ────────────────────────────────────────────────────────
export const getJobCards = (payload: GetJobCardsPayload) =>
    platformApi.post('/api/jobOrder/get', payload);

// ── 2. Get Single Job Order ───────────────────────────────────────────────────
export const getJobCardById = (id: string) =>
    platformApi.get(`/api/jobOrder/${id}`);

// ── 3. Create Job Order ───────────────────────────────────────────────────────
export const createJobCard = (payload: CreateJobCardPayload) =>
    platformApi.post('/api/jobOrder/', payload);

// ── 4. Update Job Order ───────────────────────────────────────────────────────
export const updateJobCard = (id: string, payload: CreateJobCardPayload) =>
    platformApi.put(`/api/jobOrder/${id}`, payload);

// ── 5. Delete Job Order ───────────────────────────────────────────────────────
export const deleteJobCard = (id: string) =>
    platformApi.delete(`/api/jobOrder/${id}`);

// ── 6. Service History for a Vehicle ─────────────────────────────────────────
export const getJobCardServiceHistory = (vehicleId: string, dateTime: string) =>
    platformApi.post('/api/jobOrder/history', { vehicle: vehicleId, dateTime });

// ── 7. Vehicles by Mobile / Customer ID ──────────────────────────────────────
export const getVehiclesByCustomer = (customerId: string) =>
    platformApi.post('/api/vehicle/getNumberVehicle', { mobileNo: customerId });

// ── 8. Vehicle by Register No (ID) ────────────────────────────────────────────
export const getVehicleByRegisterNo = (vehicleId: string) =>
    platformApi.post('/api/vehicle/getVehicle', { vehicle: vehicleId });

// ── 9. Vehicle by Chassis No ──────────────────────────────────────────────────
export const getVehicleByChassis = (vehicleId: string) =>
    platformApi.post('/api/vehicle/getChassis', { vehicle: vehicleId });

// ── 10a. Customer Search (typeahead by phone) ─────────────────────────────────
export const searchJobCardCustomers = (searchString: string) =>
    platformApi.post('/api/options/get/', {
        module: 'customers',
        column: 'phone',
        searchString,
        fields: ['contacts{phone,id,valid}'],
        searchColumns: ['contacts'],
        size: 100,
        page: 1,
        except: null,
    });

// ── 10b. Vehicle Search (typeahead by register no) ────────────────────────────
export const searchVehicleByRegNo = (searchString: string) =>
    platformApi.post('/api/options/get/', {
        module: 'vehicles',
        column: 'registerNo',
        searchString,
        searchColumns: ['registerNo'],
        size: 100,
        page: 1,
        except: null,
    });

// ── 10c. Chassis Search (typeahead by chassis no) ─────────────────────────────
export const searchVehicleByChassisNo = (searchString: string) =>
    platformApi.post('/api/options/get/', {
        module: 'vehicles',
        column: 'chassisNo',
        searchString,
        searchColumns: ['chassisNo'],
        size: 100,
        page: 1,
        except: null,
    });

// ── 11. Vehicle Models (for filter) ──────────────────────────────────────────
export const getVehicleMasterForFilter = () =>
    platformApi.get('/api/vehicleMaster');

// ── 12. Mechanics List ────────────────────────────────────────────────────────
export const getAllUsers = () =>
    platformApi.get('/api/user');

// ── 13. Generate/Download PDF ─────────────────────────────────────────────────
export const getJobCardPDFUrl = (jobOrderId: string) =>
    `/api/jobOrder/generatePDF/${jobOrderId}`;

// ── 14. Generate PDF URL (S3 upload) ─────────────────────────────────────────
export const generateJobCardPDF = (data: any) =>
    platformApi.post('/api/jobOrder/pdfGenerate', data);

// ── 15. Update Customer ───────────────────────────────────────────────────────
export const updateJobCardCustomer = (customerId: string, payload: any) =>
    platformApi.put(`/api/customer/${customerId}`, payload);

// ── 16. Link Vehicle to Customer ──────────────────────────────────────────────
export const linkVehicleToCustomer = (vehicleId: string, formData: FormData) =>
    platformApi.put(`/api/vehicle/${vehicleId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
