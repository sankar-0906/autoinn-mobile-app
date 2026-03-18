import { Linking, Alert } from 'react-native';
import platformApi from '../api';
import {
  WhatsAppTemplateData,
  WhatsAppMessageData,
  WhatsAppApiConfig,
  WhatsAppResponse,
  CompanyInfo
} from './types';

/**
 * Fetches company information for WhatsApp template
 */
export const getCompanyInfo = async (): Promise<string> => {
  try {
    const response = await platformApi.get('/api/company/getCompany');
    const data: CompanyInfo = response.data;

    if (data.code === 200 && data.data.name) {
      return data.data.name;
    }
    return '';
  } catch (error) {
    console.error('Error fetching company info:', error);
    return '';
  }
};

/**
 * Generates dynamic WhatsApp message template
 */
export const generateWhatsAppTemplate = async (data: WhatsAppMessageData): Promise<string> => {
  try {
    // Fetch company name dynamically
    const companyName = data.companyName || await getCompanyInfo();

    // Line 1 – Enquiry greeting
    const line1 = `Thank you for your enquiry${companyName ? ` with ${companyName}` : ''}.`;

    // Line 2 – Sales executive info
    const line2 = data.salesName && data.salesNo
      ? `You can reach out to our Sales Executive ${data.salesName} - ${data.salesNo}.`
      : 'We will get back to you shortly.';

    // Line 3 – Branch map URL (only if coordinates are available)
    const mapUrl =
      data.branchLat != null && data.branchLon != null
        ? `https://www.google.com/maps?q=${data.branchLat},${data.branchLon}`
        : null;
    const line3 = mapUrl
      ? `Find our ${data.branchName ? data.branchName + ' ' : ''}branch using this map URL: ${mapUrl}`
      : null;

    // Join non-null lines
    return [line1, line2, line3].filter(Boolean).join('\n');

  } catch (error) {
    console.error('Error generating WhatsApp template:', error);
    return 'Thank you for your enquiry. We will get back to you shortly.';
  }
};

/**
 * Opens WhatsApp with pre-filled message
 */
export const openWhatsApp = async (phoneNumber: string, message: string): Promise<boolean> => {
  try {
    // Clean phone number - remove any non-digit characters except +
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');

    // Check if phone number is valid
    if (!cleanPhone || cleanPhone.length < 10) {
      Alert.alert('Error', 'Invalid phone number for WhatsApp');
      return false;
    }

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    console.log('📱 Opening WhatsApp:', whatsappUrl);

    // Check if WhatsApp is installed
    const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);

    if (canOpenWhatsApp) {
      await Linking.openURL(whatsappUrl);
      return true;
    } else {
      Alert.alert(
        'WhatsApp Not Available',
        'WhatsApp is not installed on this device. Please install WhatsApp to share quotations.',
        [{ text: 'OK' }]
      );
      return false;
    }
  } catch (error) {
    console.error('Error opening WhatsApp:', error);
    Alert.alert('Error', 'Unable to open WhatsApp');
    return false;
  }
};

/**
 * Share quotation via WhatsApp with dynamic template
 */
export const shareQuotationViaWhatsApp = async (
  templateData: WhatsAppTemplateData,
  phoneNumber?: string
): Promise<boolean> => {
  try {
    // Use provided phone number or fallback to template data
    const phone = phoneNumber || templateData.phone || '';

    if (!phone) {
      Alert.alert('Error', 'Customer phone number is required');
      return false;
    }

    // Prepare WhatsApp message data
    const messageData: WhatsAppMessageData = {
      customerNo: phone,
      salesName: templateData.assignedExecutive?.name,
      salesNo: templateData.assignedExecutive?.phone,
      companyName: '', // Will be fetched dynamically
      quotationId: templateData.qtno,
      customerName: templateData.cname,
      vehicleNames: Array.isArray(templateData.vname) ? templateData.vname : [templateData.vname || ''],
      link: templateData.link,
      // Branch location for map URL
      branchLat: templateData.branchLat,
      branchLon: templateData.branchLon,
      branchName: templateData.branchName,
    };

    // Generate dynamic message template
    const message = await generateWhatsAppTemplate(messageData);

    // Open WhatsApp with the message
    return await openWhatsApp(phone, message);
  } catch (error) {
    console.error('Error sharing quotation via WhatsApp:', error);
    Alert.alert('Error', 'Failed to share quotation via WhatsApp');
    return false;
  }
};

/**
 * Send WhatsApp message via API (for tracking purposes)
 */
export const sendWhatsAppMessage = async (data: WhatsAppTemplateData): Promise<WhatsAppResponse> => {
  try {
    const response = await platformApi.post('api/sendSms/quotation', {
      ...data,
      type: 'WhatsApp'
    });

    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp message via API:', error);
    throw error;
  }
};

/**
 * Check WhatsApp message status
 */
export const checkWhatsAppStatus = async (messageId: string, whatsAppId: string): Promise<any> => {
  try {
    const response = await platformApi.post('/api/sms/whatsAppMsg/', {
      id: messageId,
      whatsAppId
    });

    return response.data;
  } catch (error) {
    console.error('Error checking WhatsApp status:', error);
    throw error;
  }
};

/**
 * Main function to handle WhatsApp sharing with both direct opening and API tracking
 */
export const handleWhatsAppShare = async (
  templateData: WhatsAppTemplateData,
  phoneNumber?: string
): Promise<{ success: boolean; tracked?: boolean }> => {
  try {
    // First, try to open WhatsApp directly for immediate sharing
    const whatsappOpened = await shareQuotationViaWhatsApp(templateData, phoneNumber);

    if (whatsappOpened) {
      try {
        // Optionally track the message via API
        await sendWhatsAppMessage(templateData);
        return { success: true, tracked: true };
      } catch (trackingError) {
        console.warn('WhatsApp opened but tracking failed:', trackingError);
        return { success: true, tracked: false };
      }
    }

    return { success: false };
  } catch (error) {
    console.error('Error in WhatsApp share flow:', error);
    return { success: false };
  }
};
