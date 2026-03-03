import React, { useState, useEffect } from 'react';
import {
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { ENDPOINT, getQuotationById } from '../../src/api';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../src/ToastContext';

type QuotationViewRouteProp = RouteProp<RootStackParamList, 'QuotationView'>;
type QuotationViewNavigationProp = StackNavigationProp<RootStackParamList, 'QuotationView'>;

interface QuotationData {
    id: string;
    quotationId: string;
    branch: string;
    customerPhone: string;
    customerName: string;
    gender: string;
    locality: string;
    leadSource: string;
    testDriveTaken: boolean;
    enquiryType: string;
    remarks: string;
    createdOn: string;
    salesExecutive: string;
    customerType: string;
    scheduleDate: string;
    scheduleTime: string;
    expectedDate: string;
    vehicleModel: string;
    vehicleCode: string;
    vehicleId?: string;
    vehicleColor: string;
    vehicleImage: string | null;
    associatedVehicles: AssociatedVehicle[];
    exShowroomPrice: number;
    roadTax: number;
    registrationFee: number;
    handlingCharges: number;
    totalPrice: number;
    paymentType: 'cash' | 'finance';
    financeName?: string;
    downPayment?: number;
    tenure?: number;
    emi?: number;
    insuranceType?: InsuranceCharge[];
    optionalType?: OptionalCharge[];
    insuranceInfo?: string;
    insuranceAmount?: number;
    optionalCharges?: OptionalCharge[];
    tcs?: number;
}

interface AssociatedVehicle {
    regNo: string;
    registrationNo?: string;
    modelName: string;
    vehicleModel: string;
    vehicleName: string;
    id: string;
    dateOfSale?: string;
    engineNo?: string;
    vehicleType?: string;
}

interface InsuranceCharge {
    id: string;
    type: string;
    amount: number;
    name?: string;
    price?: number;
    onRoad?: number;
}

interface OptionalCharge {
    id: string;
    type: string;
    amount: number;
    price?: number;
}

export default function QuotationViewScreen({ navigation, route }: { navigation: QuotationViewNavigationProp; route: QuotationViewRouteProp }) {
    // Guard against missing navigation context
    if (!navigation || !route) {
        return null;
    }

    const { id } = route.params;
    const [quotation, setQuotation] = useState<QuotationData | null>(null);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        fetchQuotationData();
    }, [id]);

    const fetchQuotationData = async () => {
        setLoading(true);
        try {
            const response = await getQuotationById(id);
            const data = response.data?.response?.data;

            if (data) {
                // Extract vehicle information
                // data.vehicle is an array of junction records: { id, vehicleDetail: { id, modelName, ... }, price: {...}, ... }
                const vehicleJunction = Array.isArray(data.vehicle) && data.vehicle.length > 0
                    ? data.vehicle[0]
                    : null;
                // vehicleDetail is the actual VehicleMaster record
                const vehicleDetail = vehicleJunction?.vehicleDetail || {};

                const priceData = vehicleJunction?.price || {};

                const exShowroom = priceData.showroomPrice || priceData.exShowroomPrice || 0;
                const roadTax = priceData.roadTax || 0;
                const regFee = priceData.registrationFee || 0;
                const handling = priceData.handlingCharges || 0;
                const tcs = priceData.tcs || 0;
                const total = exShowroom + roadTax + regFee + handling + tcs;

                const hasInsurance = Array.isArray(vehicleJunction?.insuranceType) && vehicleJunction.insuranceType.length > 0;
                const insType = hasInsurance ? vehicleJunction.insuranceType[0] : null;

                const optionalCharges = Array.isArray(vehicleJunction?.optionalType) ? vehicleJunction.optionalType : [];

                // Get image from vehicleDetail (VehicleMaster) - can be array or object
                const vehicleImage = Array.isArray(vehicleDetail.image)
                    ? vehicleDetail.image[0]?.url
                    : (typeof vehicleDetail.image === 'object' ? vehicleDetail.image?.url : vehicleDetail.image);

                const quotationData: QuotationData = {
                    id: data.id || id,
                    quotationId: data.quotationId || id,
                    branch: data.branch?.name || data.branchName || 'N/A',
                    customerPhone:
                        data.customerPhone ||
                        data.phone ||
                        data.mobile ||
                        data.phoneNumber ||
                        data.customer?.phone ||
                        data.customer?.mobile ||
                        data.customer?.mobileNo ||
                        data.customer?.phoneNumber ||
                        data.customer?.contacts?.[0]?.phone ||
                        data.proCustomer?.phone ||
                        data.proCustomer?.mobile ||
                        data.proCustomer?.mobileNo ||
                        data.proCustomer?.phoneNumber ||
                        data.contact?.phone ||
                        data.contact?.mobile ||
                        data.contactNumber ||
                        'N/A',
                    customerName: data.customerName || data.proCustomer?.name || data.customer?.name || 'N/A',
                    gender: data.customer?.gender || data.proCustomer?.gender || data.gender || 'N/A',
                    locality: data.customer?.locality || data.customer?.location || data.location || data.locality || 'N/A',
                    leadSource: data.leadSource || 'N/A',
                    testDriveTaken: data.testDriveTaken || false,
                    enquiryType: data.enquiryType || 'N/A',
                    remarks: data.remarks || '',
                    createdOn: data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-GB') : 'N/A',
                    salesExecutive: data.salesExecutive?.name || data.executive?.profile?.employeeName || data.salesExecutiveName || 'N/A',
                    customerType:
                        data.customer?.type ||
                        data.proCustomer?.type ||
                        data.customerType ||
                        data.customer?.customerType ||
                        data.proCustomer?.customerType ||
                        data.type ||
                        'N/A',
                    scheduleDate: data.scheduleDate ? new Date(data.scheduleDate).toLocaleDateString('en-GB') : 'N/A',
                    scheduleTime: data.scheduleTime || 'N/A',
                    expectedDate: data.expectedDateOfPurchase ? new Date(data.expectedDateOfPurchase).toLocaleDateString('en-GB') : 'N/A',
                    // Use vehicleDetail (VehicleMaster) for model info, NOT the junction record
                    vehicleModel: vehicleDetail.modelName || vehicleDetail.name || 'N/A',
                    vehicleCode: vehicleDetail.modelCode || vehicleDetail.code || 'N/A',
                    // Use vehicleDetail.id (VehicleMaster ID), NOT vehicleJunction.id (junction ID)
                    vehicleId: vehicleDetail.id || null,
                    vehicleColor: vehicleJunction?.color?.color || (typeof data.color === 'string' ? data.color : data.color?.color) || 'N/A',
                    vehicleImage: vehicleImage || null,
                    associatedVehicles: [], // Will be updated below
                    exShowroomPrice: exShowroom,
                    roadTax: roadTax,
                    registrationFee: regFee,
                    handlingCharges: handling,
                    totalPrice: total,
                    paymentType: vehicleJunction?.financer ? 'finance' : 'cash',
                    financeName: vehicleJunction?.financer?.name || 'N/A',
                    downPayment: vehicleJunction?.downPayment || 0,
                    tenure: vehicleJunction?.financerTenure || 0,
                    emi: data.emi || 0,
                    insuranceInfo: insType?.type || insType?.name || 'Basic Insurance',
                    insuranceAmount: insType?.amount || insType?.price || insType?.onRoad || 0,
                    insuranceType: vehicleJunction?.insuranceType || [],
                    optionalType: vehicleJunction?.optionalType || [],
                    optionalCharges: optionalCharges,
                    tcs: tcs,
                };

                // Extract all vehicles - both from vehicle array and associated vehicles
                const allVehicles: AssociatedVehicle[] = [
                    // Vehicles from the main vehicle array (junction records)
                    ...(Array.isArray(data.vehicle) ? data.vehicle.map((v: any) => ({
                        regNo: v.registrationNo || v.regNo || '-',
                        modelName: v.vehicleDetail?.modelName || v.vehicleDetail?.name || v.modelName || v.vehicleName || '-',
                        vehicleModel: v.vehicleDetail?.modelName || v.vehicleDetail?.name || v.modelName || v.vehicleName || '-',
                        vehicleName: v.vehicleDetail?.modelName || v.vehicleDetail?.name || v.modelName || v.vehicleName || '-',
                        id: v.vehicleDetail?.id || v.id
                    })) : []),
                    // Vehicles from customer.purchasedVehicle (different structure)
                    ...(Array.isArray(data.customer?.purchasedVehicle) ? data.customer.purchasedVehicle.map((v: any) => ({
                        regNo: v.registerNo || v.registrationNo || '-',
                        modelName: v.vehicle?.modelName || v.vehicle?.name || v.modelName || v.vehicleName || '-',
                        vehicleModel: v.vehicle?.modelName || v.vehicle?.name || v.modelName || v.vehicleName || '-',
                        vehicleName: v.vehicle?.modelName || v.vehicle?.name || v.modelName || v.vehicleName || '-',
                        id: v.vehicle?.id || v.id,
                        dateOfSale: v.dateOfSale,
                        engineNo: v.engineNo,
                        vehicleType: v.vehicleType
                    })) : []),
                    // Other associated vehicles
                    ...(Array.isArray(data.associatedVehicles) ? data.associatedVehicles : [])
                ];

                // Update the associated vehicles in the quotation data
                quotationData.associatedVehicles = allVehicles;

                setQuotation(quotationData);
            } else {
                toast.error('Failed to load quotation data');
            }
        } catch (error) {
            console.error('Error fetching quotation:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text className="mt-4 text-gray-500">Loading quotation...</Text>
            </SafeAreaView>
        );
    }

    if (!quotation) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="bg-white border-b border-gray-100 px-4 py-4 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => navigation?.goBack()} className="mr-3">
                            <ChevronLeft size={24} color={COLORS.gray[900]} />
                        </TouchableOpacity>
                        <Text className="text-gray-900 text-lg font-bold">Quotations</Text>
                    </View>
                </View>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-gray-600">No quotation found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const vehicleLabel = `${quotation.vehicleCode} - ${quotation.vehicleModel}`;

    const FormLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
        <Text className="text-sm text-gray-600 mb-1.5 font-medium">
            {label}
            {required && <Text className="text-red-500"> *</Text>}
        </Text>
    );

    const priceBreakdown = [
        { label: 'Ex-Showroom Price', value: `₹ ${quotation.exShowroomPrice?.toLocaleString() || 0}` },
        { label: 'Road Tax', value: `₹ ${quotation.roadTax?.toLocaleString() || 0}` },
        { label: 'Registration Fee', value: `₹ ${quotation.registrationFee?.toLocaleString() || 0}` },
        { label: 'Handling Charges', value: `₹ ${quotation.handlingCharges?.toLocaleString() || 0}` },
        { label: 'Total', value: `₹ ${quotation.totalPrice?.toLocaleString() || 0}`, isTotal: true },
    ];

    const handleViewVehicleDetails = () => {
        const priceDetails: any = {
            exShowroomPrice: quotation.exShowroomPrice,
            handlingCharges: quotation.handlingCharges,
            roadTax: quotation.roadTax,
            registrationFee: quotation.registrationFee,
            tcs: quotation.tcs,
            total: quotation.totalPrice,
            insurance: quotation.insuranceInfo ? [quotation.insuranceInfo] : [],
            others: quotation.optionalCharges?.map((x: any) => x.type) || [],
            insuranceType: quotation.insuranceType,
            optionalCharges: quotation.optionalCharges,
            optionalType: quotation.optionalType,
        };

        quotation.insuranceType?.forEach((ins: InsuranceCharge) => {
            if (ins.type) priceDetails[ins.type] = ins.amount || ins.price || ins.onRoad || 0;
        });
        quotation.optionalType?.forEach((opt: OptionalCharge) => {
            if (opt.type) priceDetails[opt.type] = opt.amount || opt.price || 0;
        });

        if (navigation && quotation) {
            navigation.navigate('SelectPrice', {
                vehicleId: quotation.vehicleId || quotation.vehicleCode,
                vehicleData: {
                    id: quotation.vehicleId || quotation.vehicleCode,
                    name: quotation.vehicleModel,
                    price: priceDetails,
                    color: { color: quotation.vehicleColor }
                },
                returnTo: 'QuotationView',
                quotationId: quotation.id,
                viewMode: true,
                paymentDetails: {
                    priceDetails: priceDetails,
                    paymentType: quotation.paymentType,
                    financeDetails: {
                        financerName: quotation.financeName,
                        downPayment: quotation.downPayment,
                        tenure: quotation.tenure,
                        emi: quotation.emi,
                    }
                }
            });
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white border-b border-gray-100 px-4 py-4 flex-row items-center justify-between z-20">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => navigation?.goBack()} className="mr-3">
                        <ChevronLeft size={24} color={COLORS.gray[900]} />
                    </TouchableOpacity>
                    <Text className="text-gray-900 text-lg font-bold">Quotations</Text>
                </View>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                    <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-gray-500 text-sm">Quotation Id:</Text>
                        <Text className="text-teal-600 font-bold text-sm">{quotation.quotationId}</Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                        <Text className="text-gray-500 text-sm">Created On</Text>
                        <Text className="text-gray-900 text-sm font-medium">{quotation.createdOn}</Text>
                    </View>
                </View>

                <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                    <Text className="text-gray-900 font-bold text-base mb-4 border-b border-gray-50 pb-2">Customer Information</Text>

                    <View className="mb-4">
                        <FormLabel label="Branch" required />
                        <TextInput value={quotation.branch} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                    </View>

                    <View className="mb-4">
                        <FormLabel label="Sales Executive" required />
                        <TextInput value={quotation.salesExecutive} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                    </View>

                    <View className="mb-4">
                        <FormLabel label="Customer Phone" required />
                        <TextInput value={quotation.customerPhone} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                    </View>

                    <View className="mb-4">
                        <FormLabel label="Customer Name" required />
                        <TextInput value={quotation.customerName} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                    </View>

                    <View className="mb-4">
                        <FormLabel label="Gender" required />
                        <View className="flex-row gap-2">
                            <TouchableOpacity
                                disabled
                                className={`flex-1 h-11 rounded-lg items-center justify-center border ${quotation.gender.toLowerCase() === 'male' ? 'bg-teal-600 border-teal-600' : 'bg-gray-100 border-gray-300'}`}
                            >
                                <Text className={quotation.gender.toLowerCase() === 'male' ? 'text-white font-semibold' : 'text-gray-700 font-medium'}>Male</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                disabled
                                className={`flex-1 h-11 rounded-lg items-center justify-center border ${quotation.gender.toLowerCase() === 'female' ? 'bg-teal-600 border-teal-600' : 'bg-gray-100 border-gray-300'}`}
                            >
                                <Text className={quotation.gender.toLowerCase() === 'female' ? 'text-white font-semibold' : 'text-gray-700 font-medium'}>Female</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="mb-4">
                        <FormLabel label="Locality" required />
                        <TextInput value={quotation.locality} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                    </View>

                    <View className="mb-4">
                        <FormLabel label="Customer Type" />
                        <TextInput value={quotation.customerType} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                    </View>
                </View>

                <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                    <Text className="text-gray-900 font-bold text-base mb-4 border-b border-gray-50 pb-2">Deal Terms</Text>

                    <View className="mb-4">
                        <FormLabel label="Schedule Follow-up Date" required />
                        <TextInput value={quotation.scheduleDate} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                    </View>
                    <View className="mb-4">
                        <FormLabel label="Schedule Follow-up Time" required />
                        <TextInput value={quotation.scheduleTime} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                    </View>

                    <View className="mb-4">
                        <FormLabel label="Lead Source" required />
                        <TextInput value={quotation.leadSource} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                    </View>

                    <View className="mb-4">
                        <FormLabel label="Expected Date of Purchase" required />
                        <TextInput value={quotation.expectedDate} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                    </View>

                    <View className="mb-4">
                        <FormLabel label="Enquiry Type" required />
                        <TextInput value={quotation.enquiryType} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                    </View>

                    <View className="mb-4">
                        <FormLabel label="Test Drive Taken" required />
                        <View className="flex-row gap-2">
                            <TouchableOpacity
                                disabled
                                className={`flex-1 h-11 rounded-lg items-center justify-center border ${quotation.testDriveTaken ? 'bg-teal-600 border-teal-600' : 'bg-gray-100 border-gray-300'}`}
                            >
                                <Text className={quotation.testDriveTaken ? 'text-white font-semibold' : 'text-gray-700 font-medium'}>Yes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                disabled
                                className={`flex-1 h-11 rounded-lg items-center justify-center border ${!quotation.testDriveTaken ? 'bg-teal-600 border-teal-600' : 'bg-gray-100 border-gray-300'}`}
                            >
                                <Text className={!quotation.testDriveTaken ? 'text-white font-semibold' : 'text-gray-700 font-medium'}>No</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="mb-2">
                        <FormLabel label="Remarks" />
                        <TextInput
                            value={quotation.remarks}
                            editable={false}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-800 min-h-[80px]"
                        />
                    </View>
                </View>

                <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                    <View className="flex-row items-center justify-between mb-4 border-b border-gray-50 pb-2">
                        <Text className="text-gray-900 font-bold text-base">Vehicle Information</Text>
                    </View>

                    <TouchableOpacity
                        onPress={handleViewVehicleDetails}
                        className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4"
                        activeOpacity={0.7}
                    >
                        <Text className="text-blue-800 font-semibold text-sm">
                            {vehicleLabel}
                        </Text>
                    </TouchableOpacity>

                    <Text className="text-gray-900 font-bold text-base mb-3 border-b border-gray-50 pb-2 mt-2">
                        Associated vehicles
                    </Text>
                    <View className="border border-gray-200 rounded-xl overflow-hidden">
                        <View className="bg-slate-600 px-4 py-3 flex-row">
                            <Text className="text-white text-sm font-bold flex-1">Reg No.</Text>
                            <Text className="text-white text-sm font-bold flex-1">Vehicle</Text>
                        </View>
                        {quotation.associatedVehicles.length === 0 ? (
                            <View className="bg-gray-50 px-4 py-8 items-center">
                                <Text className="text-gray-400 text-sm">No Data</Text>
                            </View>
                        ) : (
                            quotation.associatedVehicles.map((v, idx) => (
                                <View key={idx} className={`px-4 py-3 flex-row justify-between ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                    <Text className="text-gray-700 text-sm flex-1">{v.regNo || v.registrationNo || '-'}</Text>
                                    <Text className="text-gray-700 text-sm flex-1">{v.modelName || v.vehicleModel || v.vehicleName || '-'}</Text>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                    <Text className="text-gray-900 font-bold text-base mb-2">Status Tracker</Text>
                    <View className="border-t border-gray-200 mt-2 pt-6 pb-2">
                        <View className="flex-row justify-around items-center px-2">
                            <View className="items-center">
                                <View className="w-12 h-12 rounded-full border-2 border-teal-600 flex items-center justify-center mb-2 z-10 bg-white">
                                    <View className="w-6 h-6 rounded-full bg-teal-600 items-center justify-center">
                                        <Check size={14} color="#FFF" />
                                    </View>
                                </View>
                                <Text className="text-sm font-medium text-gray-900">Quoted</Text>
                                <Text className="text-[10px] text-gray-500 text-center w-24 leading-snug mt-1">Customer got Quotation</Text>
                            </View>

                            {/* Separator Line */}
                            <View className="absolute top-6 left-[20%] right-[20%] h-[2px] bg-gray-300 -z-10" />

                            <View className="items-center">
                                <View className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center mb-2 z-10 bg-white">
                                    <View className="w-6 h-6 rounded-full bg-gray-300" />
                                </View>
                                <Text className="text-sm font-medium text-gray-700 mt-0.5">Booked</Text>
                                <Text className="text-[10px] text-gray-500 text-center w-24 leading-snug mt-1">Customer Booked the Vehicle</Text>
                            </View>

                            <View className="items-center">
                                <View className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center mb-2 z-10 bg-white">
                                    <View className="w-6 h-6 rounded-full bg-gray-300" />
                                </View>
                                <Text className="text-sm font-medium text-gray-700 mt-0.5">Sold</Text>
                                <Text className="text-[10px] text-gray-500 text-center w-24 leading-snug mt-1">We sold the vehicle</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Fixed Footer */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-lg z-20 flex-row gap-3">
                <Button
                    title="Close"
                    variant="outline"
                    className="flex-1"
                    onPress={() => navigation?.goBack()}
                />
                <Button
                    title="Share on WhatsApp"
                    className="flex-[2]"
                    onPress={handleViewVehicleDetails}
                />
            </View>
        </SafeAreaView>
    );
}
