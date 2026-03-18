# WhatsApp API Module

This module provides WhatsApp integration functionality for the AutoCloud mobile app, specifically designed for sharing quotations with dynamic templates.

## Features

- **Dynamic Template Generation**: Fetches company info and generates personalized WhatsApp messages
- **Direct WhatsApp Integration**: Opens WhatsApp with pre-filled messages
- **API Tracking**: Optionally tracks messages via backend API
- **Error Handling**: Comprehensive error handling with fallbacks
- **TypeScript Support**: Full TypeScript type definitions

## Installation

The module is already integrated into the app. Simply import the functions you need:

```typescript
import { handleWhatsAppShare, WhatsAppTemplateData } from '../../src/whatsapp';
```

## Usage

### Basic WhatsApp Share

```typescript
const templateData: WhatsAppTemplateData = {
  qtno: 'QUO-123',
  cname: 'Customer Name',
  phone: '919876543210',
  vname: ['Vehicle Model'],
  slex: 'Sales Executive Name',
  link: 'https://example.com/pdf',
  dlr: 'Branch Name',
  id: 'quotation-id'
};

const result = await handleWhatsAppShare(templateData);
if (result.success) {
  console.log('WhatsApp opened successfully');
}
```

### Advanced Usage

```typescript
import { 
  generateWhatsAppTemplate,
  openWhatsApp,
  getCompanyInfo,
  sendWhatsAppMessage 
} from '../../src/whatsapp';

// Get company info
const companyName = await getCompanyInfo();

// Generate custom template
const message = await generateWhatsAppTemplate({
  customerNo: '919876543210',
  salesName: 'John Doe',
  salesNo: '+919876543210'
});

// Open WhatsApp directly
await openWhatsApp('919876543210', message);

// Send via API for tracking
await sendWhatsAppMessage(templateData);
```

## API Reference

### Types

#### `WhatsAppTemplateData`
```typescript
interface WhatsAppTemplateData {
  qtno?: string;                    // Quotation ID
  cname?: string;                   // Customer name
  phone?: string;                   // Customer phone
  vname?: string[];                 // Vehicle names
  slex?: string;                    // Sales executive details
  link?: string;                    // PDF link with brochure
  linkWithoutBrochure?: string;     // PDF link without brochure
  dlr?: string;                     // Branch/dealer name
  customerId?: string;             // Customer ID
  id?: string;                      // Quotation ID
  assignedExecutive?: {             // Assigned executive
    id: number;
    name: string;
    phone?: string;
  };
  assignedBranch?: {                // Assigned branch
    id: number;
    name: string;
  };
}
```

#### `WhatsAppMessageData`
```typescript
interface WhatsAppMessageData {
  customerNo: string;              // Customer phone number
  salesName?: string;               // Sales executive name
  salesNo?: string;                 // Sales executive phone
  companyName?: string;             // Company name
  quotationId?: string;             // Quotation ID
  customerName?: string;            // Customer name
  vehicleNames?: string[];          // Vehicle names
  link?: string;                    // PDF link
}
```

### Functions

#### `handleWhatsAppShare(templateData, phoneNumber?)`
Main function for WhatsApp sharing with both direct opening and API tracking.

**Parameters:**
- `templateData: WhatsAppTemplateData` - Quotation data
- `phoneNumber?: string` - Optional phone number override

**Returns:** `Promise<{ success: boolean; tracked?: boolean }>`

#### `generateWhatsAppTemplate(data)`
Generates dynamic WhatsApp message template using company info.

**Parameters:**
- `data: WhatsAppMessageData` - Message data

**Returns:** `Promise<string>`

#### `openWhatsApp(phoneNumber, message)`
Opens WhatsApp with pre-filled message.

**Parameters:**
- `phoneNumber: string` - Target phone number
- `message: string` - Message content

**Returns:** `Promise<boolean>`

#### `getCompanyInfo()`
Fetches company information from API.

**Returns:** `Promise<string>` - Company name

#### `sendWhatsAppMessage(data)`
Sends WhatsApp message via API for tracking.

**Parameters:**
- `data: WhatsAppTemplateData` - Template data

**Returns:** `Promise<WhatsAppResponse>`

## Integration in Quotation Forms

The WhatsApp module is already integrated in:

1. **QuotationFormScreen.tsx** - Enhanced share functionality with dynamic templates
2. **QuotationDetailsScreen.tsx** - Share button in details view

### Example Integration

```typescript
// In your QuotationFormScreen
const handleShareOnWhatsApp = async () => {
  const templateData: WhatsAppTemplateData = {
    qtno: quotation.quotationId,
    cname: derived.customerName,
    phone: customerPhone,
    vname: [derived.vehicleName],
    link: `${ENDPOINT}/api/quotation/generatePdf/${quotation.id}`,
    // ... other fields
  };

  const result = await handleWhatsAppShare(templateData);
  if (result.success) {
    toast.success('WhatsApp opened successfully!');
  }
};
```

## Template Format

The dynamic template follows this format:

```
Thank you for your enquiry{companyName}. {salesExecutiveInfo || fallback}
```

Where:
- `{companyName}` - Dynamically fetched company name
- `{salesExecutiveInfo}` - "You can reach out to our Sales Executive {name} - {phone}"
- `{fallback}` - "We will get back to you shortly."

## Error Handling

The module includes comprehensive error handling:

- **Phone Number Validation**: Checks for valid phone numbers
- **WhatsApp Availability**: Verifies WhatsApp is installed
- **API Failures**: Graceful fallback to manual WhatsApp
- **Network Issues**: User-friendly error messages

## Dependencies

- `react-native` - For Linking and Alert
- `../api` - For platformApi instance
- TypeScript for type safety

## Notes

- Phone numbers should include country code (e.g., 91 for India)
- The module automatically cleans phone numbers
- API tracking is optional and best-effort
- Fallback behavior ensures basic functionality even if APIs fail
