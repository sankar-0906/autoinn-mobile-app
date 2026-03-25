/**
 * Reusable PDF Download Utility
 * Handles both Quotation and Job Card PDF downloads with save to device and share functionality
 * Extracted from QuotationFormScreen to avoid code duplication
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { ENDPOINT } from '../api';

export interface PDFDownloadOptions {
    id: string;
    documentId: string; // quotationId or jobNo
    documentType: 'Quotation' | 'Job Card';
    apiEndpoint: string; // 'quotation' or 'jobOrder'
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

/**
 * Save PDF to device Downloads folder using StorageAccessFramework
 */
export const savePDFToDevice = async (options: PDFDownloadOptions) => {
    const { id, documentId, documentType, apiEndpoint, onSuccess, onError } = options;

    try {
        // 1. Download PDF to app cache dir first
        const baseUrl = ENDPOINT.replace(/\/$/, '');
        const pdfUrl = apiEndpoint === 'quotation'
            ? `${baseUrl}/api/quotation/generatePdf/${id}?withBrochure=true`
            : `${baseUrl}/api/jobOrder/generatePDF/${id}`;

        // Sanitize: replace '/', spaces and special chars → no sub-directories
        const safeId = documentId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `${documentType}_${safeId}.pdf`;
        const localUri = `${FileSystem.cacheDirectory}${fileName}`;

        onSuccess?.('Downloading PDF…');

        // Auth token required — without it API returns HTML error page, not PDF
        const token = await AsyncStorage.getItem('token');
        const { uri: cachedUri } = await FileSystem.downloadAsync(pdfUrl, localUri, {
            headers: token ? { 'x-access-token': token } : {},
        });

        // 2. Use StorageAccessFramework to write into Downloads
        //    (MediaLibrary.createAssetAsync only supports media files — DCIM — not PDFs)
        const { StorageAccessFramework } = FileSystem;
        const downloadsUri = StorageAccessFramework.getUriForDirectoryInRoot('Download');
        const perms = await StorageAccessFramework.requestDirectoryPermissionsAsync(downloadsUri);

        if (!perms.granted) {
            onError?.('Please grant access to Downloads folder.');
            return;
        }

        // 3. Create file inside user-selected folder
        const destUri = await StorageAccessFramework.createFileAsync(
            perms.directoryUri,
            fileName,
            'application/pdf',
        );

        // 4. Read cached bytes and write to destination
        const base64 = await FileSystem.readAsStringAsync(cachedUri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        await StorageAccessFramework.writeAsStringAsync(destUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
        });

        onSuccess?.(`✅ Saved to Downloads: ${fileName}`);
    } catch (error) {
        console.error('Error saving PDF to device:', error);
        onError?.('Failed to save PDF. Please try again.');
    }
};

/**
 * Share PDF using system share sheet
 */
export const sharePDF = async (options: PDFDownloadOptions) => {
    const { id, documentId, documentType, apiEndpoint, onSuccess, onError } = options;

    try {
        // 1. Download to cache first
        const baseUrl = ENDPOINT.replace(/\/$/, '');
        const pdfUrl = apiEndpoint === 'quotation'
            ? `${baseUrl}/api/quotation/generatePdf/${id}?withBrochure=true`
            : `${baseUrl}/api/jobOrder/generatePDF/${id}`;

        // Sanitize: replace '/', spaces and special chars so they don't create sub-directories
        const safeId = documentId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `${documentType}_${safeId}.pdf`;
        const localUri = `${FileSystem.cacheDirectory}${fileName}`;

        onSuccess?.('Preparing PDF…');

        // Auth token required — without it API returns HTML error page, not PDF
        const token = await AsyncStorage.getItem('token');
        const { uri } = await FileSystem.downloadAsync(pdfUrl, localUri, {
            headers: token ? { 'x-access-token': token } : {},
        });

        // 2. Open system share sheet (Google Drive, email, WA, etc.)
        const canShare = await Sharing.isAvailableAsync();
        if (!canShare) {
            onError?.('Sharing is not available on this device.');
            return;
        }

        await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Share ${documentType} ${documentId}`,
            UTI: 'com.adobe.pdf',        // iOS only, ignored on Android
        });
    } catch (error) {
        console.error('Error sharing PDF:', error);
        onError?.('Failed to share PDF. Please try again.');
    }
};
