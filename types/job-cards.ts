// ─── API Response Types ──────────────────────────────────────────────────────

export interface JobCardContact {
    id: string;
    phone: string;
    valid: boolean;
    type?: string;
    dnd?: boolean;
}

export interface JobCardCustomer {
    id: string;
    name: string;
    salutation?: string;
    contacts: JobCardContact[];
}

export interface JobCardVehicleModel {
    modelName: string;
    modelCode: string;
}

export interface JobCardColor {
    id?: string;
    colorCode: string;
    url?: string;
}

export interface JobCardVehicle {
    id: string;
    registerNo: string;
    chassisNo: string;
    engineNo?: string;
    batteryNo?: string;
    insuranceExpiryDate?: string;
    dateOfSale?: string;
    mfg?: string;
    mfgDate?: string;
    vehicle: JobCardVehicleModel;
    manufacturer?: { id?: string; name?: string };
    image?: Array<{ url?: string; color?: string; colorCode?: string; code?: string }>;
    color?: JobCardColor;
    customer?: Array<{ id: string; customer: JobCardCustomer }>;
    jobOrder?: any[];
    services?: any[];
    insurance?: any;
    serviceCouponNumber?: string;
}

export interface JobCardMechanic {
    id: string;
    profile: {
        employeeName: string;
        employeeId: string;
    };
}

export interface JobCardBranch {
    id: string;
    name: string;
    lat?: number;
    lon?: number;
    gst?: string;
}

export interface JobCardComplaint {
    id?: string;
    complaint: string;
}

export interface JobCardParts {
    MirrorRH: boolean;
    MirrorLH: boolean;
    Toolkit: boolean;
    FirstAdKit: boolean;
}

export interface JobCardVehicleImage {
    frontView?: string;
    rhsView?: string;
    lhsView?: string;
    rearView?: string;
    topView?: string;
    additionalImages?: string[];
}

// Full Job Card (API response object)
export interface JobCardRecord {
    id: string;
    jobNo: string;
    jobStatus: JobStatus;
    serviceType: string;
    serviceNo?: string;
    couponNo?: string;
    kms: number;
    fuelLevel?: number;
    createdAt: string;
    branch: JobCardBranch;
    customer: JobCardCustomer;
    customerPhone?: string;
    vehicle: JobCardVehicle;
    mechanic?: JobCardMechanic;
    supervisor?: { id: string; name: string };
    complaint?: JobCardComplaint[];
    parts?: JobCardParts;
    vehicleImage?: JobCardVehicleImage;
    accidentalDocuments?: any[];
}

// ─── Status ──────────────────────────────────────────────────────────────────

export type JobStatus =
    | 'Vehicle Received'
    | 'Estimation'
    | 'Estimation Approved'
    | 'Mechanic Allocated'
    | 'Spares Ordered'
    | 'Material Issued'
    | 'Work In Progress'
    | 'Final Inspection'
    | 'Proforma Invoice'
    | 'Invoice'
    | 'PAID'
    | 'Payment Received'
    | 'Gate Pass';

export type TabStatus = 'PENDING' | 'IN PROGRESS' | 'COMPLETED' | 'ALL';

// ─── List API ─────────────────────────────────────────────────────────────────

export interface JobCardFilter {
    model?: string[] | null;
    serviceType?: string[] | null;
    mechanic?: string[];
    registerNo?: string | null;
    serviceKmFrom?: number | null;
    serviceKmTo?: number | null;
    from?: string | null;
    to?: string | null;
    jobStatus?: string[] | null;
}

export interface GetJobCardsPayload {
    page: number;
    size: number;
    filter: JobCardFilter;
    searchString: string;
    status: TabStatus;
    branch: string[];
}

export interface GetJobCardsResponse {
    jobOrder: JobCardRecord[];
    count: number;
}

// ─── Create / Update ──────────────────────────────────────────────────────────

export interface CreateJobCardPayload {
    id?: string;
    branch: string;
    cusId: string;
    dateTime: string;
    selectVehicle: any;
    Vehicle: any[];
    customer: any;
    customerPhone: string;
    kms: number;
    serviceType: string;
    serviceNo?: string;
    couponNo?: string;
    complaint: JobCardComplaint[];
    complaintList: JobCardComplaint[];
    fuelLevel?: number;
    parts: JobCardParts;
    vehicleImage: JobCardVehicleImage;
    accidentalDocuments?: any[];
}

// ─── Service History ──────────────────────────────────────────────────────────

export interface ServiceHistoryItem {
    id: string;
    jobNo: string;
    serviceType: string;
    kms: number;
    createdAt: string;
    branch: { id: string; name: string };
    customer: { id: string; name: string };
    customerPhone: string;
    vehicle: { id: string; registerNo: string };
    mechanic?: { profile: { employeeName: string } };
}

export interface SaleItem {
    jobNo?: string;
    partNumber?: { partNumber: string; partName: string } | null;
    jobCode?: { code: string } | null;
    quantity: number;
    unitRate: number;
    rate: number;
}

export interface InvoiceItem {
    jobOrder: { jobNo: string };
    totalInvoice: number;
    saleItemInvoice: SaleItem[];
}

export interface ServiceHistoryResponse {
    History: ServiceHistoryItem[];
    Invoice: InvoiceItem[];
}

// ─── Filter Screen ────────────────────────────────────────────────────────────

export interface FilterFormState {
    vehicleModel: string[];
    serviceType: string[];
    mechanic: string[];
    jobStatus: string[];
    registerNumber: string;
    serviceKmsFrom: string;
    serviceKmsTo: string;
    startDate: string;
    endDate: string;
}

// ─── Vehicle model option ─────────────────────────────────────────────────────

export interface VehicleModelOption {
    id: string;
    modelName: string;
    modelCode: string;
}

// ─── User (Mechanic) ──────────────────────────────────────────────────────────

export interface MechanicUser {
    id: string;
    status: boolean;
    profile: {
        employeeId: string;
        employeeName: string;
        department: { role: string; departmentType: string[] };
    };
}

// ─── Legacy (UI card – kept for backward compat with existing sections) ───────
export interface JobCard {
    id: string;
    regNo: string;
    customerName: string;
    model: string;
    batteryNo?: string;
    serviceType: string;
    mechanic?: string;
    supervisor?: string;
    serviceNumber?: string;
    kms: number;
    date: string;
    time: string;
    status: string;
    progress: number;
}
