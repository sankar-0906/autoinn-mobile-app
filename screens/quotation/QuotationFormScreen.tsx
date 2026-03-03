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
import { Calendar, Clock, Share2, ChevronLeft, ArrowRight } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { ENDPOINT, getQuotationById } from '../../src/api';
import { Calendar as RNCalendar } from 'react-native-calendars';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../../src/ToastContext';

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
    // viewMode indicates whether the form should be read-only. default to true to preserve current behavior
    const isViewMode = viewMode !== undefined ? !!viewMode : true;

    const [gender, setGender] = useState('male');
    const [testDrive, setTestDrive] = useState('yes');
    const [status, setStatus] = useState(0);
    const [quotation, setQuotation] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [showSchedulePicker, setShowSchedulePicker] = useState(false);
    const [showExpectedPicker, setShowExpectedPicker] = useState(false);
    const [scheduleDateValue, setScheduleDateValue] = useState<Date | null>(null);
    const [expectedDateValue, setExpectedDateValue] = useState<Date | null>(null);
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
        getQuotationById(id)
            .then((res) => {
                const data = res?.data;
                const quotationData = data?.response?.data || null;


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
            })
            .finally(() => { });
    }, [id]);

    const derived = useMemo(() => {
        const branchName =
            quotation?.branch?.name ||
            quotation?.assignedBranch?.name ||
            (Array.isArray(quotation?.branch) ? quotation?.branch?.[0]?.name : undefined) ||
            '-';
        const executiveName =
            quotation?.assignedExecutive?.profile?.employeeName ||
            quotation?.executive?.profile?.employeeName ||
            '-';
        // Match autoinn-fe: quotationPhone || proCustomer.phone || customer.contacts[0].phone
        const customerPhone =
            quotation?.quotationPhone ||
            quotation?.proCustomer?.phone ||
            quotation?.customer?.contacts?.[0]?.phone ||
            '-';
        // Match autoinn-fe: customerName || (customer ? customer.name : proCustomer?.name)
        const rawName =
            quotation?.customerName ||
            (quotation?.customer ? quotation.customer.name : quotation?.proCustomer?.name) ||
            '';
        const customerName = rawName || '-';
        // Match autoinn-fe: locality || (proCustomer ? proCustomer.locality : customer.address?.locality)
        const locality =
            quotation?.locality ||
            (quotation?.proCustomer
                ? quotation.proCustomer.locality
                : quotation?.customer?.address?.locality) ||
            '-';
        const scheduleDate =
            scheduleDateValue ||
            quotation?.scheduleDateAndTime ||
            quotation?.scheduleDate ||
            undefined;
        const scheduleTime = quotation?.scheduleTime || '';
        const customerType = quotation?.customerType || quotation?.customer?.customerType || '-';
        const enquiryType = quotation?.enquiryType || '-';
        const remarks = quotation?.remarks || '';
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

        const fallbackVehicle = Array.isArray(quotation?.vehicle) && quotation.vehicle.length > 0
            ? quotation.vehicle[0]
            : null;

        // vehicle[0].price = the quotation-specific price (showroomPrice, insurance, etc.)
        // vehicle[0].vehicleDetail.price = the master vehicle's price array (multiple variants)
        // For viewing, we need the junction-level price (vehicle[0].price)
        const junctionPrice = fallbackVehicle?.price;
        // Handle both: if price is an array, take the first element; if it's an object, use directly
        const resolvedPrice = Array.isArray(junctionPrice) ? junctionPrice[0] : junctionPrice;

        // Build the VehicleMaster ID from the nested vehicleDetail
        const vehicleMasterId = fallbackVehicle?.vehicleDetail?.id || null;

        const viewVehicleData = selectedVehicle || (fallbackVehicle ? {
            id: vehicleMasterId || fallbackVehicle.id,
            name:
                fallbackVehicle.vehicleDetail?.modelName ||
                fallbackVehicle.vehicleDetail?.modelCode ||
                vehicleName,
            modelName: fallbackVehicle.vehicleDetail?.modelName,
            modelCode: fallbackVehicle.vehicleDetail?.modelCode,
            image: fallbackVehicle.vehicleDetail?.image,
            manufacturer: fallbackVehicle.vehicleDetail?.manufacturer,
            color: fallbackVehicle.color,
            price: resolvedPrice || quotation?.priceDetails,
            insuranceType: fallbackVehicle.insuranceType,
            optionalType: fallbackVehicle.optionalType,
            financer: fallbackVehicle.financer,
            downPayment: fallbackVehicle.downPayment,
            financerTenure: fallbackVehicle.financerTenure,
        } : null);

        return {
            branchName,
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
            createdOn: formatDate(quotation?.createdAt),
            associatedVehicles,
            viewVehicleData,
            viewPaymentDetails: fallbackVehicle?.paymentDetails || (resolvedPrice ? { priceDetails: resolvedPrice } : null),
            viewVehicleId: vehicleMasterId || fallbackVehicle?.id || selectedVehicle?.id || null,
            hasVehicle: !!fallbackVehicle || !!selectedVehicle,
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

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white border-b border-gray-100 px-4 py-4 flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2">
                        <ChevronLeft size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text className="text-gray-900 text-lg font-bold text-xl">Quotations</Text>
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
                                    value={derived.scheduleTime ? (derived.scheduleTime.includes(':') ? derived.scheduleTime.substring(0, 5) : derived.scheduleTime) : formatTime(derived.scheduleDate)}
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
                                    onPress={() =>
                                        navigation.navigate('SelectPrice', {
                                            vehicleId: derived.viewVehicleId!,
                                            vehicleData: derived.viewVehicleData,
                                            returnTo: 'QuotationForm',
                                            quotationId: id,
                                            viewMode: true,
                                            paymentDetails: paymentDetails || derived.viewPaymentDetails,
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


        </SafeAreaView>
    );
}
