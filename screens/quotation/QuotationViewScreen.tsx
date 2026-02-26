import React, { useState, useEffect } from 'react';
import {
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { X, ChevronLeft } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { getQuotationById } from '../../src/api';

type QuotationViewRouteProp = RouteProp<RootStackParamList, 'QuotationView'>;
type QuotationViewNavigationProp = StackNavigationProp<RootStackParamList, 'QuotationView'>;

interface QuotationData {
    id: string;
    quotationId: string;
    branch: string;
    customerPhone: string;
    customerName: string;
    vehicleModel: string;
    vehicleCode: string;
    vehicleColor: string;
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
}

export default function QuotationViewScreen({ navigation, route }: { navigation: QuotationViewNavigationProp; route: QuotationViewRouteProp }) {
    const { id } = route.params;
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [vehicleTab, setVehicleTab] = useState<'price' | 'payment'>('price');
    const [quotation, setQuotation] = useState<QuotationData | null>(null);
    const [loading, setLoading] = useState(true);

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
                const vehicleInfo = Array.isArray(data.vehicle) && data.vehicle.length > 0
                    ? data.vehicle[0]
                    : data.vehicleMaster;

                // Calculate total price
                const exShowroom = data.exShowroomPrice || 0;
                const roadTax = data.roadTax || 0;
                const regFee = data.registrationFee || 0;
                const handling = data.handlingCharges || 0;
                const total = exShowroom + roadTax + regFee + handling;

                const quotationData: QuotationData = {
                    id: data.id || id,
                    quotationId: data.quotationId || id,
                    branch: data.branch?.name || data.branchName || 'N/A',
                    customerPhone: data.customerPhone || data.phone || 'N/A',
                    customerName: data.customerName || data.proCustomer?.name || data.customer?.name || 'N/A',
                    vehicleModel: vehicleInfo?.modelName || data.vehicleModel || 'N/A',
                    vehicleCode: vehicleInfo?.modelCode || vehicleInfo?.code || 'N/A',
                    vehicleColor: data.color || vehicleInfo?.color || 'N/A',
                    exShowroomPrice: exShowroom,
                    roadTax: roadTax,
                    registrationFee: regFee,
                    handlingCharges: handling,
                    totalPrice: total,
                    paymentType: data.paymentType === 'finance' ? 'finance' : 'cash',
                    financeName: data.financerName || data.financer?.name || 'N/A',
                    downPayment: data.downPayment || 0,
                    tenure: data.financerTenure || data.tenure || 0,
                    emi: data.emi || 0,
                };

                setQuotation(quotationData);
            } else {
                Alert.alert('Error', 'Failed to load quotation data');
            }
        } catch (error) {
            console.error('Error fetching quotation:', error);
            Alert.alert('Error', 'Failed to load quotation data');
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
                <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-100">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2">
                        <ChevronLeft size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text className="text-gray-900 text-lg font-bold">Quotations</Text>
                </View>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-gray-600">No quotation found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const vehicleLabel = `${quotation.vehicleCode} - ${quotation.vehicleModel}`;
    const priceBreakdown = [
        { label: 'Ex-Showroom Price', value: `₹ ${quotation.exShowroomPrice?.toLocaleString() || 0}` },
        { label: 'Road Tax', value: `₹ ${quotation.roadTax?.toLocaleString() || 0}` },
        { label: 'Registration Fee', value: `₹ ${quotation.registrationFee?.toLocaleString() || 0}` },
        { label: 'Handling Charges', value: `₹ ${quotation.handlingCharges?.toLocaleString() || 0}` },
        { label: 'Total', value: `₹ ${quotation.totalPrice?.toLocaleString() || 0}` },
    ];

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2">
                    <ChevronLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text className="text-gray-900 text-lg font-bold">Quotations</Text>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
                <View className="bg-white rounded-xl border border-gray-100 p-4">
                    <Text className="text-gray-600 text-sm mb-1">Quotation Id</Text>
                    <TextInput
                        value={quotation.quotationId}
                        editable={false}
                        className="h-11 bg-gray-50 border border-gray-200 rounded-lg px-3 text-gray-600"
                    />

                    <View className="mt-4">
                        <Text className="text-gray-600 text-sm mb-1">Branch</Text>
                        <TextInput
                            value={quotation.branch}
                            editable={false}
                            className="h-11 bg-gray-50 border border-gray-200 rounded-lg px-3 text-gray-600"
                        />
                    </View>

                    <View className="mt-4">
                        <Text className="text-gray-600 text-sm mb-1">Customer Phone</Text>
                        <TextInput
                            value={quotation.customerPhone}
                            editable={false}
                            className="h-11 bg-gray-50 border border-gray-200 rounded-lg px-3 text-gray-600"
                        />
                    </View>

                    <View className="mt-4">
                        <Text className="text-gray-600 text-sm mb-1">Customer Name</Text>
                        <TextInput
                            value={quotation.customerName}
                            editable={false}
                            className="h-11 bg-gray-50 border border-gray-200 rounded-lg px-3 text-gray-600"
                        />
                    </View>

                    <View className="mt-4">
                        <Text className="text-gray-600 text-sm mb-1">Vehicle Name</Text>
                        <TouchableOpacity
                            onPress={() => setShowVehicleModal(true)}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-3"
                        >
                            <Text className="text-gray-800 text-xs font-semibold bg-gray-600 text-white px-2 py-1 rounded w-fit">
                                {vehicleLabel}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View className="mt-4">
                        <Text className="text-gray-600 text-sm mb-2">Status</Text>
                        <View className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 mb-4">
                            <Text className="text-teal-700 font-semibold text-sm">Active</Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('FollowUpDetail', { id: quotation.customerPhone })}
                            className="border border-teal-600 rounded-lg px-4 py-3 bg-white"
                        >
                            <Text className="text-teal-600 font-semibold text-sm text-center">Follow-Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <View className="bg-white border-t border-gray-100 px-4 py-3 flex-row justify-between">
                <TouchableOpacity
                    onPress={() => setShowVehicleModal(true)}
                    className="px-6 py-2 bg-gray-200 rounded-lg"
                >
                    <Text className="text-gray-700 font-semibold text-sm">PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="px-6 py-2 border border-gray-300 rounded-lg"
                >
                    <Text className="text-gray-700 font-semibold text-sm">Close</Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={showVehicleModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowVehicleModal(false)}
            >
                <View className="flex-1 bg-black/40 justify-center px-3 py-6">
                    <View className="bg-white rounded-xl overflow-hidden max-h-full">
                        <View className="bg-gray-500 px-4 py-3 flex-row items-center justify-between">
                            <Text className="text-white font-semibold text-base">Select Vehicle</Text>
                            <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                                <X size={18} color="white" />
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row border-b border-gray-200">
                            <TouchableOpacity
                                onPress={() => setVehicleTab('price')}
                                className={`flex-1 px-4 py-3 border-b-2 ${vehicleTab === 'price' ? 'border-teal-600' : 'border-transparent'}`}
                            >
                                <Text className={`text-sm text-center ${vehicleTab === 'price' ? 'text-teal-600 font-semibold' : 'text-gray-600'}`}>Price</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setVehicleTab('payment')}
                                className={`flex-1 px-4 py-3 border-b-2 ${vehicleTab === 'payment' ? 'border-teal-600' : 'border-transparent'}`}
                            >
                                <Text className={`text-sm text-center ${vehicleTab === 'payment' ? 'text-teal-600 font-semibold' : 'text-gray-600'}`}>Payment</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 20 }}>
                            {vehicleTab === 'price' ? (
                                <View>
                                    <View className="aspect-[4/3] bg-gray-100 rounded-lg mb-4 overflow-hidden items-center justify-center">
                                        <Image
                                            source={require('../../assets/464dc6d161864c69f60b59f4ad74113c00404235.png')}
                                            style={{ width: '100%', height: '100%' }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <View className="mb-4">
                                        <Text className="text-gray-600 text-xs">Color</Text>
                                        <Text className="text-gray-900 text-sm font-semibold mt-1">{quotation.vehicleColor}</Text>
                                    </View>
                                    <View className="bg-gray-50 rounded-lg p-3 mb-4">
                                        <Text className="text-gray-600 text-xs">Model</Text>
                                        <Text className="text-gray-900 text-sm font-semibold mt-1">{quotation.vehicleModel} - {quotation.vehicleCode}</Text>
                                    </View>

                                    <View className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <View className="bg-gray-200 px-4 py-2 flex-row justify-between">
                                            <Text className="text-gray-700 font-semibold text-xs">Type</Text>
                                            <Text className="text-gray-700 font-semibold text-xs">Price</Text>
                                        </View>
                                        {priceBreakdown.map((row, idx) => (
                                            <View key={row.label} className={`px-4 py-2 flex-row justify-between ${idx % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                                                <Text className="text-gray-600 text-xs">{row.label}</Text>
                                                <Text className="text-gray-900 text-xs font-semibold">{row.value}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ) : (
                                <View>
                                    <Text className="text-gray-600 text-sm mb-2">Payment Type</Text>
                                    <View className="flex-row gap-3 mb-4">
                                        <View className={`px-4 py-2 border rounded ${quotation.paymentType === 'cash' ? 'border-teal-600 bg-teal-50' : 'border-gray-300 bg-gray-50'}`}>
                                            <Text className={quotation.paymentType === 'cash' ? 'text-teal-700 font-semibold text-sm' : 'text-gray-600 text-sm'}>Cash</Text>
                                        </View>
                                        <View className={`px-4 py-2 border rounded ${quotation.paymentType === 'finance' ? 'border-teal-600 bg-teal-50' : 'border-gray-300 bg-gray-50'}`}>
                                            <Text className={quotation.paymentType === 'finance' ? 'text-teal-700 font-semibold text-sm' : 'text-gray-600 text-sm'}>Finance</Text>
                                        </View>
                                    </View>
                                    <View className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
                                        <Text className="text-gray-600 text-xs">Finance Name</Text>
                                        <Text className="text-gray-900 text-sm mt-1">{quotation.financeName || 'N/A'}</Text>
                                    </View>
                                    <View className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
                                        <Text className="text-gray-600 text-xs">Down Payment</Text>
                                        <Text className="text-gray-900 text-sm mt-1">₹ {quotation.downPayment?.toLocaleString() || '0'}</Text>
                                    </View>
                                    <View className="flex-row gap-3">
                                        <View className="flex-1 bg-white border border-gray-200 rounded-lg p-3">
                                            <Text className="text-gray-600 text-xs">Tenure</Text>
                                            <Text className="text-gray-900 text-sm mt-1">{quotation.tenure ? `${quotation.tenure} months` : 'N/A'}</Text>
                                        </View>
                                        <View className="flex-1 bg-white border border-gray-200 rounded-lg p-3">
                                            <Text className="text-gray-600 text-xs">EMI</Text>
                                            <Text className="text-gray-900 text-sm mt-1">₹ {quotation.emi?.toLocaleString() || '0'}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        <View className="border-t border-gray-100 p-4">
                            <TouchableOpacity
                                onPress={() => setShowVehicleModal(false)}
                                className="px-6 py-2 border border-gray-300 rounded-lg self-end"
                            >
                                <Text className="text-gray-700 font-semibold text-sm">Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
