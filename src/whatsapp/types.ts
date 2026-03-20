export interface WhatsAppTemplateData {
  qtno?: string;
  cname?: string;
  phone?: string;
  vname?: string[];
  slex?: string;
  link?: string;
  linkWithoutBrochure?: string;
  dlr?: string;
  gmLink?: string;
  customerId?: string;
  id?: string;
  assignedBranch?: {
    id: number;
    name: string;
  };
  assignedExecutive?: {
    id: number;
    name: string;
    phone?: string;
  };
  /** Branch coordinates for Google Maps URL */
  branchLat?: number | null;
  branchLon?: number | null;
  branchName?: string;
}

export interface WhatsAppMessageData {
  customerNo: string;
  salesName?: string;
  salesNo?: string;
  companyName?: string;
  quotationId?: string;
  customerName?: string;
  vehicleNames?: string[];
  link?: string;
  /** Branch coordinates for Google Maps URL */
  branchLat?: number | null;
  branchLon?: number | null;
  branchName?: string;
}

export interface WhatsAppApiConfig {
  endpoint: string;
  headers?: Record<string, string>;
}

export interface WhatsAppResponse {
  code: number;
  message?: string;
  data?: any;
}

export interface CompanyInfo {
  code: number;
  data: {
    name: string;
    [key: string]: any;
  };
}
