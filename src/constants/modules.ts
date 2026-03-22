// Web App Module Constants - Exact match with backend
export const MODULE_CATEGORIES = {
  COMPANYMASTER: 'COMPANYMASTER',
  TRANSACTIONMASTER: 'TRANSACTIONMASTER', 
  PROMOTIONS: 'PROMOTIONS',
  REPORTS: 'REPORTS',
  ACCOUNTS: 'ACCOUNTS'
} as const;

// Company Master Submodules
export const COMPANY_MASTER_MODULES = {
  COMPANY: 'company',
  COMPANY_SETTINGS: 'company_settings',
  DEPARTMENT: 'department',
  EMPLOYEE: 'employee',
  FINANCIER: 'financier',
  INSURANCE: 'insurance',
  SALES_TARGETS: 'sales_targets',
  MANUFACTURER: 'manufacturer',
  HSN_CODE: 'hsn',
  SAC_CODE: 'sac',
  VEHICLE_MASTER: 'vehicle_master',
  VEHICLE_PRICE: 'vehicle_price',
  PMC: 'pmc',
  PARTS_MASTER: 'parts_master',
  JOB_CODE: 'job_code',
  SMS: 'sms',
  SUPPLIER_MASTER: 'supplier_master',
  ID_GENERATOR: 'idgenerator',
  RTO_MASTER: 'rtomaster',
  FRAME_NUMBER: 'frame_number',
  AUTO_CALLER: 'auto_caller',
  RINGTONE: 'ringtone',
  TELECMI: 'telecmi',
  POS_MACHINE_CONFIGURATION: 'POS Machine Configuration',
  SUBDEALER: 'SubDealer'
} as const;

// Transaction Master Submodules  
export const TRANSACTION_MASTER_MODULES = {
  CUSTOMER_DETAILS: 'customer_details',
  QUOTATIONS: 'quotations',
  BOOKING_REGISTER: 'booking_register',
  SALES_REGISTER: 'SALESREGISTER',
  SALES_FEEDBACK_CALL: 'SALESFEEDBACKCALL',
  SERVICE_FEEDBACK_CALL: 'SERVICEFEEDBACKCALL',
  VEHICLES: 'vehicles',
  VEHICLE_PURCHASE_INVOICE: 'vehicle_purchase_invoice',
  PURCHASE_RETURN: 'purchase_return',
  SPARE_PURCHASE_INVOICE: 'purchase_spares_invoice',
  JOB_ORDER: 'job_order',
  ESTIMATE: 'estimate',
  TRANSFER_VEHICLES: 'transfer_vehicles',
  TRANSFER_SPARES: 'transfer_spares',
  TRANSFER_NUMBER_PLATES: 'transfer_Number_Plates',
  NUMBER_PLATE_ORDERING: 'number_plate_ordering',
  INSURANCE_RENEWAL: 'insurance_renewal_reminder',
  MATERIAL_ISSUE: 'material_issue',
  FINAL_INSPECTION: 'final_inspection',
  COUNTER_SALE: 'counter_sale',
  JOB_INVOICE: 'job_invoice',
  PROMOTION: 'promotion',
  REPORT: 'report',
  CASH_PAYMENT: 'Cash Payment',
  POS_MACHINE: 'POS Machine',
  SERVICE_REMINDER: 'service_reminder',
  LEDGER_DETAILS: 'ledger_details',
  LEDGER: 'ledger',
  CUSTOMER_SPARE_ORDER: 'customer_spare_order',
  WHATSAPP_WEB: 'whatsapp_web',
  FOLLOW_UPS: 'follow-ups',
  CALL_LOGS: 'call_logs',
  VEHICLE_SALE_INVOICE: 'VEHICLESALEINVOICE',
  SPARES_ADJUSTMENT: 'Spares_Adjustment'
} as const;

// Promotions Submodules
export const PROMOTIONS_MODULES = {
  GROUPS: 'groups',
  TASKS: 'tasks'
} as const;

// Reports Submodules
export const REPORTS_MODULES = {
  SERVICE_REPORT: 'Service Report',
  DENOMINATION_INVENTORY: 'denomination_inventory',
  SPARES_INVENTORY: 'spares_inventory',
  STOCK_CHECK: 'stock_check',
  VEHICLE_INVENTORY: 'vehicle_inventory'
} as const;

// Accounts Submodules
export const ACCOUNTS_MODULES = {
  CASH_WITHDRAWAL: 'Cash_Withdrawal',
  PAYMENT: 'Payment',
  RECEIPT: 'Receipt'
} as const;

// Mobile App Specific Modules (mapped to web modules)
export const MOBILE_MODULES = {
  // Tab Navigation
  QUOTATIONS: TRANSACTION_MASTER_MODULES.QUOTATIONS,
  JOB_CARDS: TRANSACTION_MASTER_MODULES.JOB_ORDER,
  ACCOUNT: COMPANY_MASTER_MODULES.EMPLOYEE,
  
  // Additional Features
  CUSTOMERS: TRANSACTION_MASTER_MODULES.CUSTOMER_DETAILS,
  BOOKINGS: TRANSACTION_MASTER_MODULES.BOOKING_REGISTER,
  VEHICLES: TRANSACTION_MASTER_MODULES.VEHICLES,
  FOLLOW_UPS: TRANSACTION_MASTER_MODULES.FOLLOW_UPS,
  
  // Reports
  SERVICE_REPORT: REPORTS_MODULES.SERVICE_REPORT,
  VEHICLE_INVENTORY: REPORTS_MODULES.VEHICLE_INVENTORY,
  
  // Accounts
  PAYMENT: ACCOUNTS_MODULES.PAYMENT,
  RECEIPT: ACCOUNTS_MODULES.RECEIPT
} as const;

// Module Display Names for UI
export const MODULE_DISPLAY_NAMES: Record<string, string> = {
  [MOBILE_MODULES.QUOTATIONS]: 'Quotations',
  [MOBILE_MODULES.JOB_CARDS]: 'Job Cards',
  [MOBILE_MODULES.ACCOUNT]: 'Account',
  [MOBILE_MODULES.CUSTOMERS]: 'Customers',
  [MOBILE_MODULES.BOOKINGS]: 'Bookings',
  [MOBILE_MODULES.VEHICLES]: 'Vehicles',
  [MOBILE_MODULES.FOLLOW_UPS]: 'Follow Ups',
  [MOBILE_MODULES.SERVICE_REPORT]: 'Service Reports',
  [MOBILE_MODULES.VEHICLE_INVENTORY]: 'Vehicle Inventory',
  [MOBILE_MODULES.PAYMENT]: 'Payments',
  [MOBILE_MODULES.RECEIPT]: 'Receipts'
};

// Module Category Mapping
export const MODULE_CATEGORY_MAP: Record<string, string> = {
  [MOBILE_MODULES.QUOTATIONS]: MODULE_CATEGORIES.TRANSACTIONMASTER,
  [MOBILE_MODULES.JOB_CARDS]: MODULE_CATEGORIES.TRANSACTIONMASTER,
  [MOBILE_MODULES.ACCOUNT]: MODULE_CATEGORIES.COMPANYMASTER,
  [MOBILE_MODULES.CUSTOMERS]: MODULE_CATEGORIES.TRANSACTIONMASTER,
  [MOBILE_MODULES.BOOKINGS]: MODULE_CATEGORIES.TRANSACTIONMASTER,
  [MOBILE_MODULES.VEHICLES]: MODULE_CATEGORIES.TRANSACTIONMASTER,
  [MOBILE_MODULES.FOLLOW_UPS]: MODULE_CATEGORIES.TRANSACTIONMASTER,
  [MOBILE_MODULES.SERVICE_REPORT]: MODULE_CATEGORIES.REPORTS,
  [MOBILE_MODULES.VEHICLE_INVENTORY]: MODULE_CATEGORIES.REPORTS,
  [MOBILE_MODULES.PAYMENT]: MODULE_CATEGORIES.ACCOUNTS,
  [MOBILE_MODULES.RECEIPT]: MODULE_CATEGORIES.ACCOUNTS
};

// Navigation Module Mapping (for TabNavigator)
export const NAVIGATION_MODULES = {
  Quotations: MOBILE_MODULES.QUOTATIONS,
  JobCards: MOBILE_MODULES.JOB_CARDS,
  Account: MOBILE_MODULES.ACCOUNT
} as const;
