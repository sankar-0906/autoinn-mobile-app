export * from './whatsappApi';
export * from './types';

// Re-export commonly used functions and types for easier importing
export { 
  handleWhatsAppShare,
  shareQuotationViaWhatsApp,
  generateWhatsAppTemplate,
  getCompanyInfo,
  openWhatsApp
} from './whatsappApi';

export type {
  WhatsAppTemplateData,
  WhatsAppMessageData,
  CompanyInfo,
  WhatsAppResponse
} from './types';
