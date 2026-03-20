import React, { useEffect, useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    RefreshControl,
    Modal,
    Alert,
    Linking,
    NativeModules,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { Calendar, Clock, Share2, ChevronLeft, ArrowRight, Download, MapPin } from 'lucide-react-native';
import { savePDFToDevice, sharePDF } from '../../src/utils/pdfDownloadUtils';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { ENDPOINT, getQuotationById, generateQuotationPDF } from '../../src/api';
import { buildQuotationTemplateMessage, openWhatsApp, WhatsAppTemplateData } from '../../src/whatsapp';
// shareMessOnWhatsApp.ts was a test file — now removed, logic merged into whatsappApi.ts
import { Calendar as RNCalendar } from 'react-native-calendars';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../../src/ToastContext';
import { useBranch } from '../../src/context/branch';

type QuotationFormRouteProp = RouteProp<RootStackParamList, 'QuotationForm'>;
type QuotationFormNavigationProp = StackNavigationProp<RootStackParamList, 'QuotationForm'>;

const FormLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
    <Text className="text-sm text-gray-600 mb-1.5 font-medium">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
    </Text>
);


const STATUS_STEPS = ['Quoted', 'Booked', 'Sold'];

export default function QuotationFormScreen({ navigation, route }: { navigation: QuotationFormNavigationProp; route: QuotationFormRouteProp }) {
    const { id, selectedVehicle, paymentDetails, viewMode } = route.params;
    const isViewMode = viewMode !== undefined ? !!viewMode : true;

    const { branches } = useBranch(); // All branches with lat/lon from context

    console.log('🚀 QuotationFormScreen - Route params:', {
        id,
        selectedVehicle: selectedVehicle ? {
            id: selectedVehicle.id,
            name: selectedVehicle.name,
            paymentDetails: selectedVehicle.paymentDetails,
            priceDetails: selectedVehicle.priceDetails
        } : null,
        paymentDetails,
        viewMode
    });

    const [gender, setGender] = useState('male');
    const [testDrive, setTestDrive] = useState('yes');
    const [status, setStatus] = useState(0);
    const [quotation, setQuotation] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [showSchedulePicker, setShowSchedulePicker] = useState(false);
    const [showExpectedPicker, setShowExpectedPicker] = useState(false);
    const [scheduleDateValue, setScheduleDateValue] = useState<Date | null>(null);
    const [expectedDateValue, setExpectedDateValue] = useState<Date | null>(null);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [pdfDownloading, setPdfDownloading] = useState(false);
    const toast = useToast();

    const formatDate = (value?: string) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    const formatTime = (value?: string) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const statusIndex = (value?: string) => {
        const v = (value || '').toUpperCase();
        if (v === 'BOOKED') return 1;
        if (v === 'SOLD') return 2;
        return 0;
    };

    useEffect(() => {
        if (!id) return;

        console.log('📋 QuotationFormScreen - selectedVehicle exists:', !!selectedVehicle);
        console.log('📋 QuotationFormScreen - paymentDetails exists:', !!paymentDetails);

        // Always fetch quotation data for customer details, even if we have selectedVehicle
        // This ensures we have all the quotation metadata
        console.log('📋 Fetching quotation data for metadata');
        getQuotationById(id)
            .then((res) => {
                const data = res?.data;
                const quotationData = data?.response?.data || null;

                console.log('📋 Quotation data received:', {
                    hasQuotation: !!quotationData,
                    hasCustomer: !!quotationData?.customer,
                    hasVehicle: !!(quotationData?.vehicle?.length > 0)
                });

                // Log the complete vehicle structure for debugging
                if (quotationData?.vehicle?.length > 0) {
                    console.log('📋 Complete vehicle structure from API:', JSON.stringify(quotationData.vehicle[0], null, 2));
                }

                setQuotation(quotationData);

                // Gender: check quotation-level, then customer, then proCustomer
                const genderRaw = quotationData?.gender || quotationData?.customer?.gender || quotationData?.proCustomer?.gender;
                if (genderRaw) {
                    const g = String(genderRaw).toLowerCase();
                    setGender(g === 'female' ? 'female' : 'male');
                }

                // Test drive: check both possible field names
                const tdRaw = quotationData?.testDriveTaken ?? quotationData?.testDriven;
                if (typeof tdRaw !== 'undefined') {
                    const td = tdRaw === true || tdRaw === 'YES' || tdRaw === 'yes';
                    setTestDrive(td ? 'yes' : 'no');
                }

                setStatus(statusIndex(quotationData?.quotationStatus));
                const scheduleRaw = quotationData?.scheduleDateAndTime || quotationData?.scheduleDate;
                const scheduleDate = scheduleRaw ? new Date(scheduleRaw) : null;
                setScheduleDateValue(scheduleDate && !Number.isNaN(scheduleDate.getTime()) ? scheduleDate : null);
                const expectedRaw = quotationData?.expectedPurchaseDate || quotationData?.expectedDateOfPurchase;
                const expectedDate = expectedRaw ? new Date(expectedRaw) : null;
                setExpectedDateValue(expectedDate && !Number.isNaN(expectedDate.getTime()) ? expectedDate : null);
            })
            .catch((err) => {
                console.error('[QuotationForm] Fetch error:', err);
                setQuotation(null);
                toast.error('Failed to load quotation details');
            });
    }, [id, selectedVehicle, paymentDetails]); // Remove selectedVehicle from dependency array - always fetch

    const derived = useMemo(() => {
        console.log('🎯 Computing derived data with:', {
            hasQuotation: !!quotation,
            hasSelectedVehicle: !!selectedVehicle,
            hasPaymentDetails: !!paymentDetails,
            selectedVehicleId: selectedVehicle?.id,
            paymentDetailsType: paymentDetails?.paymentType
        });

        // Get customer information from quotation data (always available now)
        const branchName = quotation?.branch?.name || quotation?.assignedBranch?.name || '-';
        const branchId = quotation?.branch?.id || quotation?.assignedBranch?.id || null;

        // Debug: see what branch data the API actually returns
        console.log('🔵 [QuotationForm] quotation.branch raw:', JSON.stringify(quotation?.branch));

        // Look up coordinates from BranchContext (reliable source) by branch ID
        const matchedBranch = branchId ? branches.find(b => String(b.id) === String(branchId)) : null;
        const branchLat: number | null = matchedBranch?.lat ?? null;
        const branchLon: number | null = matchedBranch?.lon ?? null;
        const branchMapUrl =
            quotation?.branch?.googleMapUrl ||
            quotation?.assignedBranch?.googleMapUrl ||
            matchedBranch?.googleMapUrl ||
            null;

        console.log(`📍 [QuotationForm] Branch: ${branchName} | lat: ${branchLat} | lon: ${branchLon}`);
        const executiveName = quotation?.assignedExecutive?.profile?.employeeName || quotation?.executive?.profile?.employeeName || '-';
        const customerPhone = quotation?.quotationPhone || quotation?.proCustomer?.phone || quotation?.customer?.contacts?.[0]?.phone || '-';
        const rawName = quotation?.customerName || (quotation?.customer ? quotation.customer.name : quotation?.proCustomer?.name) || '';
        const customerName = rawName || '-';
        const locality = quotation?.locality || (quotation?.proCustomer ? quotation.proCustomer.locality : quotation?.customer?.address?.locality) || '-';
        const scheduleDate = scheduleDateValue || quotation?.scheduleDateAndTime || quotation?.scheduleDate;

        // Extract time from ISO string if it's an ISO format, otherwise use as-is
        let scheduleTime = quotation?.scheduleTime || '';
        if (scheduleTime && scheduleTime.includes('T') && scheduleTime.includes('Z')) {
            // Extract time from ISO string like "2026-03-16T04:04:00.000Z"
            const timeMatch = scheduleTime.match(/T(\d{2}:\d{2}):\d{2}/);
            if (timeMatch) {
                scheduleTime = timeMatch[1];
            }
        } else if (scheduleTime && scheduleTime.includes(':')) {
            // Extract just HH:MM from time string
            const timeMatch = scheduleTime.match(/(\d{2}:\d{2})/);
            if (timeMatch) {
                scheduleTime = timeMatch[1];
            }
        }

        const customerType = quotation?.customerType || quotation?.customer?.customerType || '-';
        const enquiryType = quotation?.enquiryType || '-';
        const remarks = quotation?.remarks || '';
        const expectedPurchase = expectedDateValue || quotation?.expectedPurchaseDate || quotation?.expectedDateOfPurchase;
        const leadSource = quotation?.leadSource || '-';
        const createdOn = formatDate(quotation?.createdAt);

        // Handle vehicle data - prioritize selectedVehicle from navigation
        let viewVehicleData = null;
        let viewPaymentDetails = null;
        let viewVehicleId = null;
        let vehicleName = 'Select Vehicle';
        let hasVehicle = false;
        let associatedVehicles: { regNo: string; name: string }[] = [];

        if (selectedVehicle) {
            // Use selectedVehicle from navigation (this has the finance data)
            console.log('🎯 Using selectedVehicle from navigation for display');
            console.log('🎯 selectedVehicle paymentDetails:', selectedVehicle.paymentDetails);
            console.log('🎯 selectedVehicle priceDetails:', selectedVehicle.priceDetails);

            viewVehicleData = selectedVehicle;

            // Priority: paymentDetails from route params > selectedVehicle.paymentDetails > default
            viewPaymentDetails = paymentDetails || selectedVehicle.paymentDetails || {
                paymentType: 'cash',
                financerId: null,
                downPayment: null,
                financerTenure: { data: [] },
                priceDetails: selectedVehicle.priceDetails || selectedVehicle.price
            };

            viewVehicleId = selectedVehicle.id;
            vehicleName = selectedVehicle.name || selectedVehicle.modelName || 'Selected Vehicle';
            hasVehicle = true;

            console.log('🎯 Final viewPaymentDetails:', viewPaymentDetails);
        } else {
            // Fall back to API data
            console.log('📋 No selectedVehicle, falling back to API data');
            const fallbackVehicle = Array.isArray(quotation?.vehicle) && quotation.vehicle.length > 0
                ? quotation.vehicle[0]
                : null;

            if (fallbackVehicle) {
                console.log('📋 Found fallback vehicle from API');
                console.log('📋 Full fallbackVehicle structure:', JSON.stringify(fallbackVehicle, null, 2));
                console.log('📋 fallbackVehicle.financer:', fallbackVehicle.financer);
                console.log('📋 fallbackVehicle.downPayment:', fallbackVehicle.downPayment);
                console.log('📋 fallbackVehicle.financerTenure:', fallbackVehicle.financerTenure);
                console.log('📋 fallbackVehicle.paymentDetails:', fallbackVehicle.paymentDetails);

                hasVehicle = true;
                vehicleName = fallbackVehicle.vehicleDetail?.modelName || fallbackVehicle.vehicleDetail?.modelCode || 'Vehicle';

                const junctionPrice = fallbackVehicle?.price;
                const resolvedPrice = Array.isArray(junctionPrice) ? junctionPrice[0] : junctionPrice;
                const vehicleMasterId = fallbackVehicle?.vehicleDetail?.id || null;

                // Build payment details from fallback data
                if (fallbackVehicle?.paymentDetails) {
                    viewPaymentDetails = fallbackVehicle.paymentDetails;
                } else if (fallbackVehicle?.financer || fallbackVehicle?.downPayment || fallbackVehicle?.financerTenure) {
                    // Handle stringified financerTenure from API
                    let parsedTenure = { data: [] };
                    if (fallbackVehicle.financerTenure) {
                        try {
                            if (typeof fallbackVehicle.financerTenure === 'string') {
                                parsedTenure = JSON.parse(fallbackVehicle.financerTenure);
                            } else {
                                parsedTenure = fallbackVehicle.financerTenure;
                            }
                        } catch (e) {
                            console.warn(' Failed to parse financerTenure:', fallbackVehicle.financerTenure);
                            parsedTenure = { data: [] };
                        }
                    }

                    viewPaymentDetails = {
                        paymentType: fallbackVehicle.financer ? 'finance' : 'cash',
                        financerId: fallbackVehicle.financer,
                        downPayment: fallbackVehicle.downPayment,
                        financerTenure: parsedTenure,
                        priceDetails: resolvedPrice
                    };
                } else if (resolvedPrice) {
                    viewPaymentDetails = {
                        paymentType: 'cash',
                        financerId: null,
                        downPayment: null,
                        financerTenure: { data: [] },
                        priceDetails: resolvedPrice
                    };
                }

                viewVehicleData = {
                    id: vehicleMasterId || fallbackVehicle.id,
                    name: fallbackVehicle.vehicleDetail?.modelName || fallbackVehicle.vehicleDetail?.modelCode || vehicleName,
                    modelName: fallbackVehicle.vehicleDetail?.modelName,
                    modelCode: fallbackVehicle.vehicleDetail?.modelCode,
                    image: fallbackVehicle.vehicleDetail?.image,
                    manufacturer: fallbackVehicle.vehicleDetail?.manufacturer,
                    color: fallbackVehicle.color,
                    price: resolvedPrice,
                    insuranceType: fallbackVehicle.insuranceType,
                    optionalType: fallbackVehicle.optionalType,
                    financer: fallbackVehicle.financer,
                    downPayment: fallbackVehicle.downPayment,
                    financerTenure: fallbackVehicle.financerTenure,
                    paymentDetails: viewPaymentDetails
                };
                viewVehicleId = vehicleMasterId || fallbackVehicle.id;
            }

            // Handle associated vehicles
            const associatedVehiclesRaw = quotation?.customer?.purchasedVehicle || quotation?.customer?.vehicle || [];
            associatedVehicles = Array.isArray(associatedVehiclesRaw)
                ? associatedVehiclesRaw.map((vehicle: any) => ({
                    regNo: vehicle?.registerNo || vehicle?.regNo || vehicle?.registrationNo || '-',
                    name: vehicle?.vehicle?.vehicleDetail?.modelName || vehicle?.vehicle?.vehicleDetail?.modelCode || '-',
                }))
                : [];
        }

        return {
            branchName,
            branchLat,
            branchLon,
            branchMapUrl,
            executiveName,
            customerPhone,
            customerName,
            locality,
            customerType,
            enquiryType,
            remarks,
            scheduleDate,
            scheduleTime,
            expectedPurchase,
            leadSource,
            vehicleName,
            createdOn,
            associatedVehicles,
            viewVehicleData,
            viewPaymentDetails,
            viewVehicleId,
            hasVehicle,
        };
    }, [quotation, selectedVehicle, paymentDetails, branches]);

    const onRefresh = () => {
        setRefreshing(true);

        // If we have selectedVehicle, we should still refresh the quotation metadata
        // but preserve the selectedVehicle data
        getQuotationById(id)
            .then((res) => {
                const data = res?.data;
                const quotationData = data?.response?.data || null;
                setQuotation(quotationData);

                // Update form fields from quotation data
                if (quotationData?.customer?.gender) {
                    const g = String(quotationData.customer.gender).toLowerCase();
                    setGender(g === 'female' ? 'female' : 'male');
                }
                if (typeof quotationData?.testDriven !== 'undefined') {
                    const td = quotationData.testDriven === true || quotationData.testDriven === 'YES' || quotationData.testDriven === 'yes';
                    setTestDrive(td ? 'yes' : 'no');
                }
                setStatus(statusIndex(quotationData?.quotationStatus));
                const scheduleRaw = quotationData?.scheduleDateAndTime || quotationData?.scheduleDate;
                const scheduleDate = scheduleRaw ? new Date(scheduleRaw) : null;
                setScheduleDateValue(scheduleDate && !Number.isNaN(scheduleDate.getTime()) ? scheduleDate : null);
                const expectedRaw = quotationData?.expectedPurchaseDate || quotationData?.expectedDateOfPurchase;
                const expectedDate = expectedRaw ? new Date(expectedRaw) : null;
                setExpectedDateValue(expectedDate && !Number.isNaN(expectedDate.getTime()) ? expectedDate : null);

                if (selectedVehicle) {
                    toast.success('Refreshed quotation details, vehicle data preserved');
                }
            })
            .catch((err) => {
                console.error('[QuotationForm] Refresh error:', err);
                toast.error('Failed to refresh quotation details');
            })
            .finally(() => setRefreshing(false));
    };

    const handleShareOnWhatsApp = async () => {
        try {
            if (!quotation) {
                toast.error('Quotation data not available');
                return;
            }

            const rawPhone = derived.customerPhone.replace(/\D/g, '');
            const customerPhone = rawPhone && rawPhone !== '-' ? `91${rawPhone}` : '';

            const templateData: WhatsAppTemplateData = {
                qtno: quotation.quotationId || id,
                cname: derived.customerName,
                phone: customerPhone,
                vname: [derived.vehicleName],
                slex: derived.executiveName,
                link: `${ENDPOINT}/api/quotation/generatePdf/${quotation.id}?withBrochure=true`,
                linkWithoutBrochure: `${ENDPOINT}/api/quotation/generatePdf/${quotation.id}`,
                dlr: derived.branchName,
                customerId: quotation.customerId,
                id: quotation.id,
                // Branch coordinates → map URL appended in generateWhatsAppTemplate
                branchLat: derived.branchLat,
                branchLon: derived.branchLon,
                gmLink: derived.branchMapUrl || undefined,
                branchName: derived.branchName !== '-' ? derived.branchName : undefined,
                assignedExecutive: quotation.executive ? {
                    id: quotation.executive.id,
                    name: derived.executiveName,
                    phone: quotation.executive.phone,
                } : undefined,
                assignedBranch: quotation.branch ? {
                    id: quotation.branch.id,
                    name: derived.branchName,
                } : undefined,
            };

            console.log('📤 WhatsApp template payload (all details):', templateData);
            const message = await buildQuotationTemplateMessage(templateData);
            if (!message) {
                toast.error('WhatsApp template not found');
                return;
            }
            console.log('📝 WhatsApp rendered template:', message);

            const opened = await openWhatsApp(customerPhone, message);
            if (opened) {
                toast.success('WhatsApp opened with template');
            } else {
                toast.error('WhatsApp not available');
            }

        } catch (error) {
            console.error('Error sharing on WhatsApp:', error);
            toast.error('Failed to send WhatsApp template. Please try again.');
        }
    };

    // ─── PDF: Save to Device (Downloads folder via SAF) ──────────────────────
    const handleSaveToDevice = async () => {
        setPdfDownloading(true);
        setShowDownloadModal(false);
        
        await savePDFToDevice({
            id,
            documentId: quotation?.quotationId || id,
            documentType: 'Quotation',
            apiEndpoint: 'quotation',
            onSuccess: (message) => toast.success(message),
            onError: (message) => toast.error(message),
        });
        
        setPdfDownloading(false);
    };

    // ─── PDF: Share (Google Drive / email / WhatsApp / etc.) ──────────────────
    const handleSharePDF = async () => {
        setPdfDownloading(true);
        setShowDownloadModal(false);
        
        await sharePDF({
            id,
            documentId: quotation?.quotationId || id,
            documentType: 'Quotation',
            apiEndpoint: 'quotation',
            onSuccess: (message) => toast.success(message),
            onError: (message) => toast.error(message),
        });
        
        setPdfDownloading(false);
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white border-b border-gray-100 px-4 py-4 flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2">
                        <ChevronLeft size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text className="text-gray-900 text-lg font-bold text-xl">Quotations</Text>
                </View>
                <View className="flex-row items-center gap-2">
                    <TouchableOpacity onPress={handleShareOnWhatsApp} className="flex-row items-center px-3 py-2 bg-teal-100 rounded-full">
                        <Share2 size={18} color="#0d9488" />
                        <Text className="text-teal-600 text-sm font-medium ml-2"> WhatsApp</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setShowDownloadModal(true)}
                        disabled={pdfDownloading}
                        className="p-2 bg-blue-100 rounded-full"
                    >
                        <Download size={18} color={pdfDownloading ? '#93c5fd' : '#2563eb'} />
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-gray-500 text-sm">Quotation Id:</Text>
                            <Text className="text-teal-600 font-bold text-sm">{quotation?.quotationId || id}</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                            <Text className="text-gray-500 text-sm">Created On</Text>
                            <Text className="text-gray-900 text-sm font-medium">{derived.createdOn}</Text>
                        </View>
                    </View>

                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <Text className="text-gray-900 font-bold text-base mb-4 border-b border-gray-50 pb-2">Customer Information</Text>

                        <View className="mb-4">
                            <FormLabel label="Branch" required />
                            <TextInput value={derived.branchName} editable={!isViewMode} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />

                            {/* Google Maps link for branch location - hidden but kept for later use */}
                            {/* {derived.branchLat != null && derived.branchLon != null && (
                                <TouchableOpacity
                                    activeOpacity={0.75}
                                    onPress={() =>
                                        Linking.openURL(
                                            `https://www.google.com/maps?q=${derived.branchLat},${derived.branchLon}`,
                                        )
                                    }
                                    style={{
                                        backgroundColor: '#f0fdf4',
                                        borderColor: '#bbf7d0',
                                        borderWidth: 1,
                                        borderRadius: 10,
                                        padding: 10,
                                        marginTop: 8,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}
                                >
                                    <MapPin size={18} color="#ef4444" fill="#ef4444" />
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 11, color: '#15803d', fontWeight: '600' }}>
                                            Google Map
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 11,
                                                color: '#166534',
                                                textDecorationLine: 'underline',
                                            }}
                                            numberOfLines={1}
                                        >
                                            {`https://www.google.com/maps?q=${derived.branchLat},${derived.branchLon}`}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )} */}
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Sales Executive" required />
                            <TextInput value={derived.executiveName} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Customer Phone" required />
                            <View className="flex-row gap-2">
                                <View className="h-12 w-16 bg-gray-100 border border-gray-200 rounded-xl items-center justify-center">
                                    <Text className="text-gray-700">+91</Text>
                                </View>
                                <TextInput value={derived.customerPhone} editable={!isViewMode} className="flex-1 h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                            </View>
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Customer Name" required />
                            <TextInput value={derived.customerName} editable={!isViewMode} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Gender" required />
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    disabled
                                    className={`flex-1 h-11 rounded-lg items-center justify-center border ${gender === 'male' ? 'bg-teal-600 border-teal-600' : 'bg-gray-100 border-gray-300'}`}
                                >
                                    <Text className={gender === 'male' ? 'text-white font-semibold' : 'text-gray-700 font-medium'}>Male</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    disabled
                                    className={`flex-1 h-11 rounded-lg items-center justify-center border ${gender === 'female' ? 'bg-teal-600 border-teal-600' : 'bg-gray-100 border-gray-300'}`}
                                >
                                    <Text className={gender === 'female' ? 'text-white font-semibold' : 'text-gray-700 font-medium'}>Female</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Locality" required />
                            <TextInput value={derived.locality} editable={!isViewMode} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Customer Type" />
                            <TextInput value={derived.customerType} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Schedule Follow-Up Date" required />
                            <View className="relative">
                                <TextInput value={formatDate(derived.scheduleDate)} editable={!isViewMode} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 pr-12 text-gray-800" />
                                <TouchableOpacity
                                    disabled={isViewMode}
                                    onPressIn={() => {
                                        if (isViewMode) return;
                                        setScheduleDateValue(scheduleDateValue || new Date());
                                        setShowSchedulePicker(true);
                                    }}
                                    className="absolute right-4 top-3.5"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Calendar size={18} color={isViewMode ? COLORS.gray[300] : COLORS.gray[400]} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Schedule Follow-Up Time" required />
                            <View className="relative">
                                <TextInput
                                    value={derived.scheduleTime ? (derived.scheduleTime.includes(':') ? derived.scheduleTime.substring(0, 5) : derived.scheduleTime) : (derived.scheduleDate ? derived.scheduleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-')}
                                    editable={!isViewMode}
                                    className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 pr-12 text-gray-800"
                                />
                                <View className="absolute right-4 top-3.5">
                                    <Clock size={18} color={COLORS.gray[400]} />
                                </View>
                            </View>
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Lead Source" required />
                            <TextInput value={derived.leadSource} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Enquiry Type" required />
                            <TextInput value={derived.enquiryType} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Expected Date of Purchase" required />
                            <View className="relative">
                                <TextInput value={formatDate(derived.expectedPurchase)} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 pr-12 text-gray-800" />
                                <TouchableOpacity
                                    disabled={isViewMode}
                                    onPressIn={() => {
                                        if (isViewMode) return;
                                        setExpectedDateValue(expectedDateValue || new Date());
                                        setShowExpectedPicker(true);
                                    }}
                                    className="absolute right-4 top-3.5"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Calendar size={18} color={isViewMode ? COLORS.gray[300] : COLORS.gray[400]} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="mb-2">
                            <FormLabel label="Test Drive Taken" required />
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    disabled
                                    className={`flex-1 h-11 rounded-lg items-center justify-center border ${testDrive === 'yes' ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300'}`}
                                >
                                    <Text className={testDrive === 'yes' ? 'text-white font-semibold' : 'text-gray-700 font-medium'}>Yes</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    disabled
                                    className={`flex-1 h-11 rounded-lg items-center justify-center border ${testDrive === 'no' ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300'}`}
                                >
                                    <Text className={testDrive === 'no' ? 'text-white font-semibold' : 'text-gray-700 font-medium'}>No</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <View className="flex-row items-center justify-between mb-4 border-b border-gray-50 pb-2">
                            <Text className="text-gray-900 font-bold text-base">Vehicle Information</Text>
                        </View>

                        {derived.hasVehicle ? (
                            <>
                                <TouchableOpacity
                                    onPress={() => {
                                        console.log('� QUOTATIONFORM VEHICLE CLICKED!');
                                        console.log('� QUOTATIONFORM VEHICLE CLICKED!');
                                        console.log('� QUOTATIONFORM VEHICLE CLICKED!');

                                        // Use actual customer payment details
                                        const actualPaymentDetails = derived.viewPaymentDetails || {
                                            paymentType: 'cash',
                                            financerId: null,
                                            downPayment: null,
                                            financerTenure: { data: [] },
                                            priceDetails: derived.viewPaymentDetails?.priceDetails
                                        };

                                        console.log('🚀 Using actual payment details:', actualPaymentDetails);

                                        navigation.navigate('SelectPrice', {
                                            vehicleId: derived.viewVehicleId!,
                                            vehicleData: {
                                                ...derived.viewVehicleData,
                                                // Preserve payment details like AddQuotation
                                                paymentDetails: actualPaymentDetails,
                                            },
                                            returnTo: 'QuotationForm',
                                            quotationId: id,
                                            viewMode: true,
                                            paymentDetails: actualPaymentDetails,
                                        });
                                    }}
                                    className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3"
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-blue-800 font-semibold text-sm">
                                        {derived.vehicleName}
                                    </Text>
                                    {selectedVehicle?.id && (
                                        <Text className="text-blue-700 text-xs mt-1">Model ID: {selectedVehicle.id}</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View className="py-6 items-center justify-center bg-gray-50 rounded-xl">
                                <Text className="text-gray-400 text-sm">No vehicle attached to this quotation</Text>
                            </View>
                        )}
                    </View>


                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <Text className="text-gray-900 font-bold text-base mb-3 border-b border-gray-50 pb-2">
                            Associated vehicles
                        </Text>
                        <View className="border border-gray-200 rounded-xl overflow-hidden">
                            <View className="bg-slate-600 px-4 py-3 flex-row">
                                <Text className="text-white text-sm font-bold flex-1">Reg No.</Text>
                                <Text className="text-white text-sm font-bold flex-1">Vehicle</Text>
                            </View>
                            {derived.associatedVehicles.length ? (
                                derived.associatedVehicles.map((vehicle, index) => (
                                    <View
                                        key={`${vehicle.regNo}-${index}`}
                                        className="flex-row px-4 py-3 border-b border-gray-100"
                                    >
                                        <Text className="text-gray-700 text-sm flex-1">{vehicle.regNo}</Text>
                                        <Text className="text-gray-900 text-sm flex-1">{vehicle.name}</Text>
                                    </View>
                                ))
                            ) : (
                                <View className="py-8 items-center justify-center">
                                    <Text className="text-gray-400 text-sm">No Data</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <Text className="text-gray-900 font-bold text-base mb-4 border-b border-gray-50 pb-2">Remarks</Text>
                        <TextInput
                            placeholder="Enter remarks..."
                            value={derived.remarks}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            editable={false}
                            className="min-h-[100px] bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
                        />
                    </View>

                    {/* Status Stepper */}
                    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                        <Text className="text-gray-900 font-bold text-base mb-4 border-b border-gray-50 pb-2">
                            Status
                        </Text>

                        {/* Step indicators */}
                        <View className="flex-row justify-between mb-3 px-2">
                            {STATUS_STEPS.map((label, index) => (
                                <TouchableOpacity key={label} className="items-center flex-1" disabled>
                                    <View
                                        className={`w-4 h-4 rounded-full z-10 ${status >= index ? 'bg-teal-600' : 'bg-gray-200'
                                            }`}
                                    />
                                    <Text
                                        className={`text-xs mt-2 font-bold ${status >= index ? 'text-teal-600' : 'text-gray-400'
                                            }`}
                                    >
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <View className="absolute top-2 left-0 right-0 h-0.5 bg-gray-100 mx-10 -z-10" />
                        </View>

                        {/* Progress bar */}
                        <View className="mx-2 mb-2">
                            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <View
                                    className="h-2 bg-teal-600 rounded-full"
                                    style={{ width: `${(status / 2) * 100}%` }}
                                />
                            </View>
                        </View>

                        <View className="flex-row justify-between mt-2 px-1">
                            <Text className="text-gray-400 text-[10px] flex-1 text-center">
                                Customer got{'\n'}Quotation
                            </Text>
                            <Text className="text-gray-400 text-[10px] flex-1 text-center">
                                Customer Booked{'\n'}the Vehicle
                            </Text>
                            <Text className="text-gray-400 text-[10px] flex-1 text-center">
                                We sold{'\n'}the vehicle
                            </Text>
                        </View>
                    </View>

                    {/* follow-up navigation button */}
                    <View className="mb-4">
                        <TouchableOpacity
                            onPress={() => navigation.navigate('FollowUpDetail', { id: derived.customerPhone })}
                            className="border rounded-lg px-4 py-3 bg-teal-600 border-teal-600 flex-row items-center justify-center"
                        >
                            <ArrowRight size={16} color="white" />
                            <Text className="text-white font-semibold text-sm text-center ml-2">Go to Follow-Up</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            <Modal visible={showSchedulePicker} transparent animationType="fade" onRequestClose={() => setShowSchedulePicker(false)}>
                <View className="flex-1 bg-black/40 items-center justify-center px-4">
                    <View className="bg-white rounded-2xl p-4 w-full max-w-md">
                        <Text className="text-gray-900 font-bold mb-3">Select Schedule Date</Text>
                        <RNCalendar
                            current={scheduleDateValue ? scheduleDateValue.toISOString().split('T')[0] : undefined}
                            minDate={new Date().toISOString().split('T')[0]}
                            onDayPress={(day) => {
                                const date = new Date(day.dateString);
                                setScheduleDateValue(date);
                            }}
                            theme={{
                                todayTextColor: COLORS.primary,
                                selectedDayBackgroundColor: COLORS.primary,
                                selectedDayTextColor: '#fff',
                                arrowColor: COLORS.primary,
                                textSectionTitleColor: '#6b7280',
                            }}
                            markedDates={
                                scheduleDateValue
                                    ? {
                                        [scheduleDateValue.toISOString().split('T')[0]]: {
                                            selected: true,
                                            selectedColor: COLORS.primary,
                                        },
                                    }
                                    : undefined
                            }
                        />
                        <View className="flex-row justify-end mt-4">
                            <TouchableOpacity
                                onPress={() => setShowSchedulePicker(false)}
                                className="px-4 py-2 rounded-lg bg-teal-600"
                            >
                                <Text className="text-white font-semibold">Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showExpectedPicker} transparent animationType="fade" onRequestClose={() => setShowExpectedPicker(false)}>
                <View className="flex-1 bg-black/40 items-center justify-center px-4">
                    <View className="bg-white rounded-2xl p-4 w-full max-w-md">
                        <Text className="text-gray-900 font-bold mb-3">Select Expected Purchase Date</Text>
                        <RNCalendar
                            current={expectedDateValue ? expectedDateValue.toISOString().split('T')[0] : undefined}
                            minDate={new Date().toISOString().split('T')[0]}
                            onDayPress={(day) => {
                                const date = new Date(day.dateString);
                                setExpectedDateValue(date);
                            }}
                            theme={{
                                todayTextColor: COLORS.primary,
                                selectedDayBackgroundColor: COLORS.primary,
                                selectedDayTextColor: '#fff',
                                arrowColor: COLORS.primary,
                                textSectionTitleColor: '#6b7280',
                            }}
                            markedDates={
                                expectedDateValue
                                    ? {
                                        [expectedDateValue.toISOString().split('T')[0]]: {
                                            selected: true,
                                            selectedColor: COLORS.primary,
                                        },
                                    }
                                    : undefined
                            }
                        />
                        <View className="flex-row justify-end mt-4">
                            <TouchableOpacity
                                onPress={() => setShowExpectedPicker(false)}
                                className="px-4 py-2 rounded-lg bg-teal-600"
                            >
                                <Text className="text-white font-semibold">Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>


            {/* ─── PDF Download Options Modal ──────────────────────────────── */}
            <Modal
                visible={showDownloadModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDownloadModal(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowDownloadModal(false)}
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
                >
                    <TouchableOpacity activeOpacity={1}>
                        <View style={{
                            backgroundColor: '#fff',
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            paddingTop: 12,
                            paddingBottom: 36,
                            paddingHorizontal: 20,
                        }}>
                            {/* Handle bar */}
                            <View style={{ width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 }}>
                                Download Quotation PDF
                            </Text>
                            <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
                                {quotation?.quotationId || id}
                            </Text>

                            {/* Save to Device */}
                            <TouchableOpacity
                                onPress={handleSaveToDevice}
                                style={{
                                    flexDirection: 'row', alignItems: 'center',
                                    backgroundColor: '#eff6ff', borderRadius: 14,
                                    padding: 16, marginBottom: 12,
                                }}
                            >
                                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                    <Download size={22} color="#fff" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#1e40af' }}>Save to Device</Text>
                                    <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Download PDF to your phone's storage</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Share — Google Drive / email / etc. */}
                            <TouchableOpacity
                                onPress={handleSharePDF}
                                style={{
                                    flexDirection: 'row', alignItems: 'center',
                                    backgroundColor: '#f0fdf4', borderRadius: 14,
                                    padding: 16, marginBottom: 12,
                                }}
                            >
                                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                                    <Share2 size={22} color="#fff" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#15803d' }}>Share / Save to Drive</Text>
                                    <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Google Drive, email, WhatsApp, and more</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Cancel */}
                            <TouchableOpacity
                                onPress={() => setShowDownloadModal(false)}
                                style={{ alignItems: 'center', paddingVertical: 14, marginTop: 4 }}
                            >
                                <Text style={{ fontSize: 15, color: '#6b7280', fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

        </SafeAreaView>

    );
}
