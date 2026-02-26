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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { Calendar, Clock, Share2, ChevronLeft } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { ENDPOINT, getQuotationById } from '../../src/api';
import { Calendar as RNCalendar } from 'react-native-calendars';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    const { id, selectedVehicle, paymentDetails } = route.params;

    const [gender, setGender] = useState('male');
    const [testDrive, setTestDrive] = useState('yes');
    const [status, setStatus] = useState(0);
    const [quotation, setQuotation] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [showSchedulePicker, setShowSchedulePicker] = useState(false);
    const [showExpectedPicker, setShowExpectedPicker] = useState(false);
    const [scheduleDateValue, setScheduleDateValue] = useState<Date | null>(null);
    const [expectedDateValue, setExpectedDateValue] = useState<Date | null>(null);
    const [pdfLoading, setPdfLoading] = useState(false);

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
        getQuotationById(id)
            .then((res) => {
                const data = res?.data;
                const quotationData = data?.response?.data || null;
                setQuotation(quotationData);
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
            })
            .catch(() => {
                setQuotation(null);
            })
            .finally(() => { });
    }, [id]);

    const derived = useMemo(() => {
        const branchName =
            quotation?.branch?.name ||
            (Array.isArray(quotation?.branch) ? quotation?.branch?.[0]?.name : undefined) ||
            '-';
        const executiveName =
            quotation?.executive?.profile?.employeeName ||
            quotation?.assignedExecutive?.profile?.employeeName ||
            '-';
        const customerPhone =
            quotation?.quotationPhone ||
            quotation?.customer?.contacts?.[0]?.phone ||
            '-';
        const customerName = quotation?.customerName || quotation?.customer?.name || '-';
        const locality =
            quotation?.customer?.address?.locality ||
            quotation?.customer?.locality ||
            '-';
        const scheduleDate =
            scheduleDateValue ||
            quotation?.scheduleDateAndTime ||
            quotation?.scheduleDate ||
            undefined;
        const expectedPurchase = expectedDateValue || quotation?.expectedPurchaseDate || quotation?.expectedDateOfPurchase;
        const leadSource = quotation?.leadSource || '-';
        const vehicleName =
            selectedVehicle?.name ||
            (Array.isArray(quotation?.vehicle) && quotation?.vehicle.length
                ? quotation.vehicle
                    .map((v: any) => v?.vehicleDetail?.modelName || v?.vehicleDetail?.modelCode)
                    .filter(Boolean)
                    .join(', ')
                : 'Select Vehicle');

        const associatedVehiclesRaw =
            quotation?.customer?.purchasedVehicle ||
            quotation?.customer?.vehicle ||
            [];
        const associatedVehicles = Array.isArray(associatedVehiclesRaw)
            ? associatedVehiclesRaw.map((vehicle: any) => ({
                regNo: vehicle?.registerNo || vehicle?.regNo || vehicle?.registrationNo || '-',
                name:
                    vehicle?.vehicle?.vehicleDetail?.modelName ||
                    vehicle?.vehicle?.vehicleDetail?.modelCode ||
                    vehicle?.vehicle?.model?.modelName ||
                    vehicle?.vehicle?.model?.modelCode ||
                    vehicle?.vehicle?.modelName ||
                    vehicle?.vehicle?.modelCode ||
                    vehicle?.vehicleDetail?.modelName ||
                    vehicle?.vehicleDetail?.modelCode ||
                    vehicle?.modelName ||
                    vehicle?.modelCode ||
                    '-',
            }))
            : [];

        const fallbackVehicle = Array.isArray(quotation?.vehicle) ? quotation?.vehicle?.[0] : quotation?.vehicle;
        const viewVehicleData = selectedVehicle || {
            id: fallbackVehicle?.id || fallbackVehicle?.vehicleDetail?.id,
            name:
                fallbackVehicle?.vehicleDetail?.modelName ||
                fallbackVehicle?.vehicleDetail?.modelCode ||
                vehicleName,
            price: fallbackVehicle?.price || fallbackVehicle?.vehicleDetail?.price || quotation?.priceDetails,
        };

        return {
            branchName,
            executiveName,
            customerPhone,
            customerName,
            locality,
            scheduleDate,
            expectedPurchase,
            leadSource,
            vehicleName,
            createdOn: formatDate(quotation?.createdAt),
            associatedVehicles,
            viewVehicleData,
            viewVehicleId: fallbackVehicle?.id || fallbackVehicle?.vehicleDetail?.id || selectedVehicle?.id,
        };
    }, [quotation, selectedVehicle]);

    const onRefresh = () => {
        setRefreshing(true);
        setQuotation(null);
        setGender('male');
        setTestDrive('yes');
        setStatus(0);
        setScheduleDateValue(null);
        setExpectedDateValue(null);
        getQuotationById(id)
            .then((res) => {
                const data = res?.data;
                const quotationData = data?.response?.data || null;
                setQuotation(quotationData);
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
            })
            .finally(() => setRefreshing(false));
    };

    const buildPdfUrl = (withBrochure: boolean) => {
        const qid = quotation?.id || id;
        const base = ENDPOINT.endsWith('/') ? ENDPOINT.slice(0, -1) : ENDPOINT;
        return `${base}/api/quotation/generatePdf/${encodeURIComponent(qid)}${withBrochure ? '?withBrochure=true' : ''}`;
    };

    const normalizePdfUrl = (url?: string | null) => {
        if (!url) return null;
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        const base = ENDPOINT.endsWith('/') ? ENDPOINT.slice(0, -1) : ENDPOINT;
        const path = url.startsWith('/') ? url : `/${url}`;
        return `${base}${path}`;
    };

    const sharePdf = async () => {
        try {
            setPdfLoading(true);
            const token = await AsyncStorage.getItem('token');
            const directUrl = normalizePdfUrl(quotation?.pdfWithBrochure || quotation?.pdfWithOutBrochure);
            const primaryUrl = directUrl || buildPdfUrl(true);
            const fallbackUrl = directUrl ? null : buildPdfUrl(false);
            console.log('[PDF] action: share');
            console.log('[PDF] token:', token ? 'present' : 'missing');
            console.log('[PDF] primaryUrl:', primaryUrl);
            const safeId = String(quotation?.quotationId || id).replace(/[^a-zA-Z0-9_-]/g, '_');
            const fileName = `Quotation_${safeId}_${Date.now()}.pdf`;
            const dirUri = `${FileSystem.documentDirectory}quotations/`;
            await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
            const fileUri = `${dirUri}${fileName}`;
            const headers = token ? { 'x-access-token': token, Accept: 'application/pdf' } : { Accept: 'application/pdf' };
            let result = await FileSystem.downloadAsync(primaryUrl, fileUri, { headers });
            console.log('[PDF] primary result:', result?.status, result?.uri);
            if (result?.status && result.status !== 200 && fallbackUrl) {
                result = await FileSystem.downloadAsync(fallbackUrl, fileUri, { headers });
                console.log('[PDF] fallback result:', result?.status, result?.uri);
            }
            if (!result?.uri) {
                Alert.alert('Error', 'Unable to download PDF');
                return;
            }
            if (result?.status && result.status !== 200) {
                Alert.alert('Error', 'Unable to generate PDF');
                return;
            }
            const canShare = await Sharing.isAvailableAsync();
            if (!canShare) {
                Alert.alert('Share not available', 'Sharing is not available on this device.');
                return;
            }
            await Sharing.shareAsync(result.uri, {
                mimeType: 'application/pdf',
                UTI: 'com.adobe.pdf',
            });
            console.log('[PDF] share complete');
        } catch (e) {
            console.log('[PDF] error:', e);
            Alert.alert('Error', 'Unable to generate PDF.');
        } finally {
            setPdfLoading(false);
        }
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
                <TouchableOpacity
                    onPress={sharePdf}
                    disabled={pdfLoading}
                    className="flex-row items-center px-3 py-2 rounded-lg bg-teal-50 border border-teal-100"
                    activeOpacity={0.7}
                >
                    <Share2 size={16} color={COLORS.primary} />
                    <Text className="ml-2 text-teal-700 font-semibold text-sm">
                        {pdfLoading ? 'Sharing...' : 'PDF'}
                    </Text>
                </TouchableOpacity>
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
                            <TextInput value={derived.branchName} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
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
                                <TextInput value={derived.customerPhone} editable={false} className="flex-1 h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                            </View>
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Customer Name" required />
                            <TextInput value={derived.customerName} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
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
                            <TextInput value={derived.locality} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Schedule Follow-Up Date" required />
                            <View className="relative">
                                <TextInput value={formatDate(derived.scheduleDate)} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 pr-12 text-gray-800" />
                                <TouchableOpacity
                                    onPressIn={() => {
                                        setScheduleDateValue(scheduleDateValue || new Date());
                                        setShowSchedulePicker(true);
                                    }}
                                    className="absolute right-4 top-3.5"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Calendar size={18} color={COLORS.gray[400]} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Schedule Follow-Up Time" required />
                            <View className="relative">
                                <TextInput value={formatTime(derived.scheduleDate)} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 pr-12 text-gray-800" />
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
                            <FormLabel label="Expected Date of Purchase" required />
                            <View className="relative">
                                <TextInput value={formatDate(derived.expectedPurchase)} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 pr-12 text-gray-800" />
                                <TouchableOpacity
                                    onPressIn={() => {
                                        setExpectedDateValue(expectedDateValue || new Date());
                                        setShowExpectedPicker(true);
                                    }}
                                    className="absolute right-4 top-3.5"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Calendar size={18} color={COLORS.gray[400]} />
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

                        <TouchableOpacity
                            onPress={() =>
                                navigation.navigate('SelectPrice', {
                                    vehicleId: derived.viewVehicleId || derived.viewVehicleData?.id || id,
                                    vehicleData: derived.viewVehicleData,
                                    returnTo: 'QuotationForm',
                                    quotationId: id,
                                    viewMode: true,
                                    paymentDetails: paymentDetails || { priceDetails: derived.viewVehicleData?.price },
                                })
                            }
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

                        {(paymentDetails || selectedVehicle?.priceDetails) && (
                            <View className="mt-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
                                <Text className="text-gray-500 text-xs">Price & Payment</Text>
                                <Text className="text-gray-900 text-sm font-semibold mt-1">
                                    {paymentDetails?.paymentType === 'finance' ? 'Finance' : 'Cash'}
                                </Text>
                                <View className="mt-2">
                                    <Text className="text-gray-500 text-xs">Total Amount</Text>
                                    <Text className="text-gray-900 text-sm font-semibold">
                                        ₹ {paymentDetails?.priceDetails?.totalAmount ?? selectedVehicle?.priceDetails?.totalAmount ?? '—'}
                                    </Text>
                                </View>
                                {!!paymentDetails?.priceDetails?.insurance && (
                                    <Text className="text-gray-600 text-xs mt-1">
                                        Insurance: {paymentDetails.priceDetails.insurance}
                                    </Text>
                                )}
                                {!!paymentDetails?.priceDetails?.others?.length && (
                                    <Text className="text-gray-600 text-xs mt-1">
                                        Others: {paymentDetails.priceDetails.others.join(', ')}
                                    </Text>
                                )}
                                {paymentDetails?.paymentType === 'finance' && paymentDetails?.financeDetails && (
                                    <View className="mt-2">
                                        <Text className="text-gray-500 text-xs">Finance Details</Text>
                                        <Text className="text-gray-700 text-xs mt-1">Financer: {paymentDetails.financeDetails.financer || '—'}</Text>
                                        <Text className="text-gray-700 text-xs mt-1">Down Payment: {paymentDetails.financeDetails.downPayment || '—'}</Text>
                                        <Text className="text-gray-700 text-xs mt-1">Tenure: {paymentDetails.financeDetails.tenure || '—'}</Text>
                                        <Text className="text-gray-700 text-xs mt-1">EMI: {paymentDetails.financeDetails.emi || '—'}</Text>
                                    </View>
                                )}
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

                </ScrollView>
            </KeyboardAvoidingView>

            <View className="bg-white border-t border-gray-100 p-4 flex-row gap-3">
                <Button title="Back" variant="outline" className="flex-1" onPress={() => navigation.goBack()} />
                <Button title="Save" className="flex-1 opacity-50" onPress={() => { }} />
            </View>

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


        </SafeAreaView>
    );
}
