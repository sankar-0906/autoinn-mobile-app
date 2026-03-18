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
    status: "Vehicle Received" | "In Progress" | "Completed";
    progress: number;
}
