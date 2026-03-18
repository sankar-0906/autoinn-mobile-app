import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, User, Car, CreditCard, X, ChevronDown } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useBranch } from '../../src/context/branch';
import { SelectField } from '../../components/ui/SelectField';

const TABS = ['customer', 'vehicle', 'payment'] as const;

type BookingRegisterNavigationProp = StackNavigationProp<RootStackParamList, 'BookingRegister'>;

// Form Label Component
const FormLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
    <Text className="text-sm text-gray-700 font-medium">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
    </Text>
);

// Text Input Field Component
const TextInputField = ({ label, placeholder, value, onChangeText, required = false, keyboardType = 'default', editable = true, ...props }: any) => (
    <View className="mb-4">
        <FormLabel label={label} required={required} />
        <TextInput
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            editable={editable}
            className="mt-1.5 px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900"
            placeholderTextColor={COLORS.gray[400]}
            {...props}
        />
    </View>
);

// Currency Field Component
const CurrencyField = ({ label, value, onChangeText, placeholder }: any) => (
    <View className="mb-4">
        <FormLabel label={label} />
        <View className="mt-1.5 flex-row border border-gray-300 rounded-lg overflow-hidden">
            <View className="px-3 py-2.5 bg-gray-50 justify-center">
                <Text className="text-gray-600 font-medium">₹</Text>
            </View>
            <TextInput
                placeholder={placeholder || '0'}
                value={value}
                onChangeText={onChangeText}
                keyboardType="numeric"
                className="flex-1 px-3 py-2.5 text-gray-900"
                placeholderTextColor={COLORS.gray[400]}
            />
        </View>
    </View>
);

export default function BookingRegisterScreen({ navigation }: { navigation: BookingRegisterNavigationProp }) {
    console.log('🚀 BookingRegisterScreen - Component mounted');
    
    const [activeTab, setActiveTab] = useState<'customer' | 'vehicle' | 'payment'>('customer');

    // 🎯 Global Branch Service: GPS nearest → First available
    const { branches, selectedBranch, nearestBranch, isLoading: branchLoading, error: branchError } = useBranch();
    // Helper functions to match the old interface
    const getBranchId = () => nearestBranch?.id || branches[0]?.id || null;
    const getBranchName = () => nearestBranch?.name || branches[0]?.name || '-';

    const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Branch options from global branch service
    const branchOptions = useMemo(() =>
        branches.map((branch: any) => ({ label: branch.name, value: branch.id }))
        , [branches]);

    // Customer Data State
    const [customerData, setCustomerData] = useState({
        branch: '',
        phone: '',
        customerName: '',
        fatherName: '',
        addressLine1: '',
        addressLine2: '',
        addressLine3: '',
        locality: '',
        country: 'India',
        state: 'Tamil Nadu',
        city: 'Chennai',
        pincode: '',
        email: '',
        dob: '',
        referredBy: '',
        nomineeDetails: '',
        age: '',
        relationship: '',
        quotations: '',
        salesOfficer: 'Sanu',
    });

    // Vehicle Data State
    const [vehicleData, setVehicleData] = useState({
        manufacturer: 'India Yamaha Motors Private Limited',
        modelName: '',
        rto: '',
        vehicleColor: '',
        totalDiscount: '',
        accessoriesTotal: '',
        accessoriesTotalAfterDiscount: '',
        exchangeModelName: '',
        exchangePrice: '',
        onRoadPrice: '',
        tempRegistration: '',
        hypothecation: '',
        numberPlateCharges: '',
        affidavitAmount: '',
        specialNoCharges: '',
        onRoadDiscount: '',
        expectedDeliveryDate: '',
        finalAmount: '0',
    });

    // Payment Data State
    const [paymentData, setPaymentData] = useState({
        paymentMode: 'Cash',
        hypothecation: '',
        loanType: '',
        financierName: '',
        financierBranch: '',
        remarks: '',
        netReceivables: '',
    });

    const handleNext = () => {
        if (activeTab === 'customer') {
            setActiveTab('vehicle');
        } else if (activeTab === 'vehicle') {
            setActiveTab('payment');
        }
    };

    const handleBack = () => {
        if (activeTab === 'vehicle') {
            setActiveTab('customer');
        } else if (activeTab === 'payment') {
            setActiveTab('vehicle');
        }
    };

    const handleSaveComplete = () => {
        navigation.goBack();
    };

    // Auto-fill branch using the global branch service
    useEffect(() => {
        console.log('🔍 BookingRegister - Branch state:', { customerDataBranch: customerData.branch, branchLoading, selectedBranch, nearestBranch });
        const autoBranchId = getBranchId();
        const autoBranchName = getBranchName();
        
        console.log('🔍 BookingRegister - Auto branch data:', { autoBranchId, autoBranchName });

        if (customerData.branch || branchLoading) return;

        if (nearestBranch?.id) {
            if (fallbackTimerRef.current) {
                clearTimeout(fallbackTimerRef.current);
                fallbackTimerRef.current = null;
            }
            console.log('🎯 BookingRegister – Auto-filling nearest branch:', nearestBranch.name, `(${nearestBranch.id})`);
            setCustomerData(prev => ({ ...prev, branch: nearestBranch.id }));
            return;
        }

        // Wait briefly for nearestBranch; fallback to first branch if it doesn't arrive
        if (!fallbackTimerRef.current && branches.length > 0) {
            fallbackTimerRef.current = setTimeout(() => {
                if (!nearestBranch?.id && !customerData.branch && branches.length > 0) {
                    console.log('⚠️ BookingRegister – Nearest not ready, using first branch:', branches[0].name, `(${branches[0].id})`);
                    setCustomerData(prev => ({ ...prev, branch: branches[0].id }));
                }
                fallbackTimerRef.current = null;
            }, 1200);
        }

        return () => {
            if (fallbackTimerRef.current) {
                clearTimeout(fallbackTimerRef.current);
                fallbackTimerRef.current = null;
            }
        };
    }, [branches, customerData.branch, branchLoading, nearestBranch, selectedBranch, getBranchId, getBranchName]);

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-gray-600 px-4 py-4">
                <View className="flex-row items-center justify-between mb-3">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ChevronLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-white">Booking Register</Text>
                    <View className="w-6" />
                </View>
                <View className="px-1">
                    <Text className="text-gray-200 text-xs">Booking ID: New</Text>
                    <Text className="text-gray-200 text-xs">Customer ID: CNS33555</Text>
                </View>
            </View>

            {/* Tabs */}
            <View className="bg-white border-b border-gray-200 flex-row">
                {(['customer', 'vehicle', 'payment'] as const).map((tab, index) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        className={`flex-1 items-center py-3 border-b-2 ${
                            activeTab === tab ? 'border-teal-600' : 'border-transparent'
                        }`}
                    >
                        <Text className={`text-sm font-medium capitalize ${
                            activeTab === tab ? 'text-teal-600' : 'text-gray-600'
                        }`}>{tab} Data</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1 bg-white p-4" showsVerticalScrollIndicator={false}>
                    {activeTab === 'customer' && <CustomerTab data={customerData} setData={setCustomerData} />}
                    {activeTab === 'vehicle' && <VehicleTab data={vehicleData} setData={setVehicleData} />}
                    {activeTab === 'payment' && <PaymentTab data={paymentData} setData={setPaymentData} />}
                    <View className="h-24" />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer */}
            <View className="bg-white border-t border-gray-200 px-4 py-3 flex-row gap-3">
                {activeTab !== 'customer' && (
                    <Button
                        title="Back"
                        variant="outline"
                        className="flex-1"
                        onPress={handleBack}
                    />
                )}
                <Button
                    title={activeTab === 'payment' ? 'Save & Complete' : 'Next'}
                    className="flex-1"
                    onPress={activeTab === 'payment' ? handleSaveComplete : handleNext}
                />
            </View>
        </SafeAreaView>
    );
}

function CustomerTab({ data, setData }: any) {
    const [showBranchModal, setShowBranchModal] = useState(false);
    
    // Get branch options from global context
    const { branches } = useBranch();
    const branchOptions = useMemo(() =>
        branches.map((branch: any) => ({ label: branch.name, value: branch.id }))
        , [branches]);

    return (
        <View>
            <View className="mb-4">
                <FormLabel label="Branch" required />
                <SelectField
                    placeholder="Select Branch"
                    value={data.branch}
                    options={branchOptions}
                    onSelect={(v) => setData(prev => ({ ...prev, branch: v }))}
                    modalVisible={showBranchModal}
                    setModalVisible={setShowBranchModal}
                />
            </View>
            <TextInputField
                label="Phone"
                placeholder="9876543210"
                value={data.phone}
                onChangeText={(text) => setData({ ...data, phone: text })}
                keyboardType="phone-pad"
                required
            />
            <TextInputField
                label="Customer Name"
                placeholder="Select Customer Name"
                value={data.customerName}
                onChangeText={(text) => setData({ ...data, customerName: text })}
                required
            />
            <TextInputField
                label="Father's Name"
                placeholder="Enter Father's Name"
                value={data.fatherName}
                onChangeText={(text) => setData({ ...data, fatherName: text })}
            />
            <TextInputField
                label="Address Line 1"
                placeholder="Enter Address Line 1"
                value={data.addressLine1}
                onChangeText={(text) => setData({ ...data, addressLine1: text })}
            />
            <TextInputField
                label="Address Line 2"
                placeholder="Enter Address Line 2"
                value={data.addressLine2}
                onChangeText={(text) => setData({ ...data, addressLine2: text })}
            />
            <TextInputField
                label="Address Line 3"
                placeholder="Enter Address Line 3"
                value={data.addressLine3}
                onChangeText={(text) => setData({ ...data, addressLine3: text })}
            />
            <TextInputField
                label="Locality"
                placeholder="Enter Locality"
                value={data.locality}
                onChangeText={(text) => setData({ ...data, locality: text })}
            />
            <SelectField
                label="Country"
                value={data.country}
                onPress={() => {}}
            />
            <SelectField
                label="State"
                value={data.state}
                onPress={() => {}}
            />
            <SelectField
                label="City"
                value={data.city}
                onPress={() => {}}
            />
            <TextInputField
                label="Pincode"
                placeholder="Enter Pincode"
                value={data.pincode}
                onChangeText={(text) => setData({ ...data, pincode: text })}
                keyboardType="number-pad"
            />
            <TextInputField
                label="Email"
                placeholder="Enter Email"
                value={data.email}
                onChangeText={(text) => setData({ ...data, email: text })}
                keyboardType="email-address"
            />
            <TextInputField
                label="DOB"
                placeholder="YYYY-MM-DD"
                value={data.dob}
                onChangeText={(text) => setData({ ...data, dob: text })}
            />
            <SelectField
                label="Referred By"
                value={data.referredBy}
                onPress={() => {}}
            />
            <TextInputField
                label="Nominee Details"
                placeholder="Enter Nominee Details"
                value={data.nomineeDetails}
                onChangeText={(text) => setData({ ...data, nomineeDetails: text })}
            />
            <TextInputField
                label="Age"
                placeholder="Enter Age"
                value={data.age}
                onChangeText={(text) => setData({ ...data, age: text })}
                keyboardType="number-pad"
            />
            <SelectField
                label="Relationship"
                value={data.relationship}
                onPress={() => {}}
            />
            <TextInputField
                label="Quotations Associated"
                placeholder="QDE/25-26/457, QDE/25-26/458"
                value={data.quotations}
                onChangeText={(text) => setData({ ...data, quotations: text })}
                editable={false}
            />
            <SelectField
                label="Sales Officer"
                value={data.salesOfficer}
                onPress={() => {}}
                required
            />
        </View>
    );
}

function VehicleTab({ data, setData }: any) {
    return (
        <View>
            <SelectField
                label="Manufacturer"
                value={data.manufacturer}
                onPress={() => {}}
                required
            />
            <SelectField
                label="Model Name"
                value={data.modelName}
                onPress={() => {}}
                required
            />
            <SelectField
                label="RTO"
                value={data.rto}
                onPress={() => {}}
            />
            <View className="mb-4">
                <FormLabel label="Vehicle Color" />
                <TouchableOpacity className="mt-1.5 px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 flex-row items-center justify-between">
                    <Text className="text-gray-500">No Vehicle chosen</Text>
                    <ChevronDown size={18} color={COLORS.gray[400]} />
                </TouchableOpacity>
            </View>

            {/* Accessories Section */}
            <View className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-sm font-bold text-gray-900">Accessories</Text>
                    <TouchableOpacity className="px-3 py-1 border border-teal-600 rounded">
                        <Text className="text-teal-600 text-xs font-medium">+ Add</Text>
                    </TouchableOpacity>
                </View>
                <Text className="text-xs text-gray-500 text-center py-4">No accessories added</Text>
            </View>

            <CurrencyField
                label="Total Discount"
                value={data.totalDiscount}
                onChangeText={(text) => setData({ ...data, totalDiscount: text })}
            />
            <CurrencyField
                label="Accessories Total"
                value={data.accessoriesTotal}
                onChangeText={(text) => setData({ ...data, accessoriesTotal: text })}
            />
            <CurrencyField
                label="Accessories Total (after Discount)"
                value={data.accessoriesTotalAfterDiscount}
                onChangeText={(text) => setData({ ...data, accessoriesTotalAfterDiscount: text })}
            />

            {/* Exchange Vehicle Information */}
            <View className="mt-6 pt-4 border-t border-gray-200">
                <Text className="text-base font-bold text-gray-900 mb-4">Exchange Vehicle Information</Text>
                <TextInputField
                    label="Exchange Model Name"
                    placeholder="Enter Exchange Vehicle"
                    value={data.exchangeModelName}
                    onChangeText={(text) => setData({ ...data, exchangeModelName: text })}
                />
                <CurrencyField
                    label="Exchange Price"
                    value={data.exchangePrice}
                    onChangeText={(text) => setData({ ...data, exchangePrice: text })}
                />
            </View>

            {/* Vehicle Charges */}
            <View className="mt-6 pt-4 border-t border-gray-200">
                <Text className="text-base font-bold text-gray-900 mb-4">Vehicle Charges</Text>
                <CurrencyField
                    label="On-Road Price"
                    value={data.onRoadPrice}
                    onChangeText={(text) => setData({ ...data, onRoadPrice: text })}
                />
                <CurrencyField
                    label="Temporary Registration Charges"
                    value={data.tempRegistration}
                    onChangeText={(text) => setData({ ...data, tempRegistration: text })}
                />
                <CurrencyField
                    label="Hypothecation"
                    value={data.hypothecation}
                    onChangeText={(text) => setData({ ...data, hypothecation: text })}
                />
                <CurrencyField
                    label="Number Plate Charges"
                    value={data.numberPlateCharges}
                    onChangeText={(text) => setData({ ...data, numberPlateCharges: text })}
                />
                <CurrencyField
                    label="Affidavit Amount"
                    value={data.affidavitAmount}
                    onChangeText={(text) => setData({ ...data, affidavitAmount: text })}
                />
                <CurrencyField
                    label="Special No. Charges"
                    value={data.specialNoCharges}
                    onChangeText={(text) => setData({ ...data, specialNoCharges: text })}
                />
                <CurrencyField
                    label="On Road Discount"
                    value={data.onRoadDiscount}
                    onChangeText={(text) => setData({ ...data, onRoadDiscount: text })}
                />
                <TextInputField
                    label="Expected Delivery Date"
                    placeholder="YYYY-MM-DD"
                    value={data.expectedDeliveryDate}
                    onChangeText={(text) => setData({ ...data, expectedDeliveryDate: text })}
                />
                <CurrencyField
                    label="Final Amount"
                    value={data.finalAmount}
                    onChangeText={(text) => setData({ ...data, finalAmount: text })}
                />
            </View>
        </View>
    );
}

function PaymentTab({ data, setData }: any) {
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    return (
        <View className="pb-10">
            {/* Booking Amount */}
            <CurrencyField
                label="Booking Amount"
                value="0"
                onChangeText={() => {}}
                placeholder="0.00"
            />

            {/* Payment Mode */}
            <View className="mb-4">
                <FormLabel label="Payment Mode" required />
                <TouchableOpacity
                    onPress={() => setShowPaymentModal(true)}
                    className="mt-1.5 px-3 py-3 border border-gray-300 rounded-lg bg-white flex-row items-center justify-between"
                >
                    <Text className="text-base font-medium text-gray-900">{data.paymentMode}</Text>
                    <ChevronDown size={20} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Modal for Payment Mode Selection */}
            <Modal
                visible={showPaymentModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPaymentModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl pb-8">
                        {/* Modal Header */}
                        <View className="px-4 py-5 border-b border-gray-200 flex-row items-center justify-between">
                            <Text className="text-xl font-bold text-gray-900">Payment Mode</Text>
                            <TouchableOpacity 
                                onPress={() => setShowPaymentModal(false)}
                                className="p-1"
                            >
                                <X size={26} color={COLORS.gray[900]} />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Options */}
                        <View className="px-4 py-6 gap-3">
                            {/* Cash Option */}
                            <TouchableOpacity
                                onPress={() => {
                                    setData({ ...data, paymentMode: 'Cash' });
                                    setShowPaymentModal(false);
                                }}
                                className={`p-4 rounded-lg border-2 flex-row items-center ${
                                    data.paymentMode === 'Cash'
                                        ? 'bg-teal-50 border-teal-600'
                                        : 'bg-white border-gray-200'
                                }`}
                            >
                                <View className={`w-6 h-6 rounded-full border-2 mr-4 items-center justify-center ${
                                    data.paymentMode === 'Cash'
                                        ? 'bg-teal-600 border-teal-600'
                                        : 'border-gray-400'
                                }`}>
                                    {data.paymentMode === 'Cash' && (
                                        <View className="w-3 h-3 bg-white rounded-full" />
                                    )}
                                </View>
                                <Text className={`text-lg font-semibold ${
                                    data.paymentMode === 'Cash' ? 'text-teal-600' : 'text-gray-900'
                                }`}>
                                    Cash
                                </Text>
                            </TouchableOpacity>

                            {/* Finance Option */}
                            <TouchableOpacity
                                onPress={() => {
                                    setData({ ...data, paymentMode: 'Finance' });
                                    setShowPaymentModal(false);
                                }}
                                className={`p-4 rounded-lg border-2 flex-row items-center ${
                                    data.paymentMode === 'Finance'
                                        ? 'bg-teal-50 border-teal-600'
                                        : 'bg-white border-gray-200'
                                }`}
                            >
                                <View className={`w-6 h-6 rounded-full border-2 mr-4 items-center justify-center ${
                                    data.paymentMode === 'Finance'
                                        ? 'bg-teal-600 border-teal-600'
                                        : 'border-gray-400'
                                }`}>
                                    {data.paymentMode === 'Finance' && (
                                        <View className="w-3 h-3 bg-white rounded-full" />
                                    )}
                                </View>
                                <Text className={`text-lg font-semibold ${
                                    data.paymentMode === 'Finance' ? 'text-teal-600' : 'text-gray-900'
                                }`}>
                                    Finance
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Finance Fields - Show only when Finance is selected */}
            {data.paymentMode === 'Finance' && (
                <View className="mb-6 pb-4 border-b border-gray-200">
                    <Text className="text-base font-bold text-gray-900 mb-4">Finance Details</Text>

                    {/* Hypothecation */}
                    <View className="mb-4">
                        <FormLabel label="Hypothecation" />
                        <TouchableOpacity className="mt-1.5 px-3 py-2.5 border border-gray-300 rounded-lg bg-white flex-row items-center justify-between">
                            <Text className="text-gray-500">Select Hypothecation</Text>
                            <ChevronDown size={18} color={COLORS.gray[400]} />
                        </TouchableOpacity>
                    </View>

                    {/* Loan Type */}
                    <View className="mb-4">
                        <FormLabel label="Loan Type" />
                        <TouchableOpacity className="mt-1.5 px-3 py-2.5 border border-gray-300 rounded-lg bg-white flex-row items-center justify-between">
                            <Text className="text-gray-500">Select Loan Type</Text>
                            <ChevronDown size={18} color={COLORS.gray[400]} />
                        </TouchableOpacity>
                    </View>

                    {/* Financier Name */}
                    <View className="mb-4">
                        <FormLabel label="Financier Name" />
                        <TouchableOpacity className="mt-1.5 px-3 py-2.5 border border-gray-300 rounded-lg bg-white flex-row items-center justify-between">
                            <Text className="text-gray-500">Select Financier Name</Text>
                            <ChevronDown size={18} color={COLORS.gray[400]} />
                        </TouchableOpacity>
                    </View>

                    {/* Financier Branch */}
                    <View className="mb-4">
                        <FormLabel label="Financier Branch" />
                        <TouchableOpacity className="mt-1.5 px-3 py-2.5 border border-gray-300 rounded-lg bg-white flex-row items-center justify-between">
                            <Text className="text-gray-500">Select Financier Branch</Text>
                            <ChevronDown size={18} color={COLORS.gray[400]} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Remarks */}
            <View className="mb-4">
                <FormLabel label="Remarks" />
                <TextInput
                    placeholder="Enter your remarks here"
                    value={data.remarks}
                    onChangeText={(text) => setData({ ...data, remarks: text })}
                    multiline
                    numberOfLines={4}
                    className="mt-1.5 px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900"
                    placeholderTextColor={COLORS.gray[400]}
                    textAlignVertical="top"
                />
            </View>

            {/* Net Receivables */}
            <CurrencyField
                label="Net Receivables"
                value={data.netReceivables}
                onChangeText={(text) => setData({ ...data, netReceivables: text })}
            />
        </View>
    );
}
