import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../src/ToastContext';

type BookingActivityRouteProp = RouteProp<RootStackParamList, 'BookingActivity'>;
type BookingActivityNavigationProp = StackNavigationProp<RootStackParamList, 'BookingActivity'>;

const FormLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
    <Text className="text-sm text-gray-600 mb-1 font-medium">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
    </Text>
);

export default function BookingActivityScreen({
    navigation,
    route,
}: {
    navigation: BookingActivityNavigationProp;
    route: BookingActivityRouteProp;
}) {
    const { customerName = 'Customer', customerId = '', customerPhone = '' } = route.params || {};
    const toast = useToast();

    const [activeTab, setActiveTab] = useState<'customer' | 'vehicle' | 'payment'>('customer');
    const [paymentMode, setPaymentMode] = useState('cash');

    // Customer Data
    const [branch, setBranch] = useState('Devanahalli');
    const [phone, setPhone] = useState(customerPhone);
    const [customerFullName, setCustomerFullName] = useState(customerName);
    const [fatherName, setFatherName] = useState('');
    const [address, setAddress] = useState('');
    const [address2, setAddress2] = useState('');
    const [address3, setAddress3] = useState('');
    const [locality, setLocality] = useState('');
    const [country, setCountry] = useState('');
    const [stateVal, setStateVal] = useState('');
    const [city, setCity] = useState('');
    const [pincode, setPincode] = useState('');
    const [email, setEmail] = useState('');
    const [dob, setDob] = useState('');
    const [age, setAge] = useState('');
    const [referredBy, setReferredBy] = useState('');
    const [relationship, setRelationship] = useState('');
    const [nominee, setNominee] = useState('');
    const [salesOfficer, setSalesOfficer] = useState('');

    // Validation errors
    const [nameError, setNameError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [salesOfficerError, setSalesOfficerError] = useState('');
    const [addressError, setAddressError] = useState('');
    const [localityError, setLocalityError] = useState('');
    const [pincodeError, setPincodeError] = useState('');
    const [modelError, setModelError] = useState('');
    const [bookingAmountError, setBookingAmountError] = useState('');

    // Vehicle Data
    const [manufacturer, setManufacturer] = useState('');
    const [model, setModel] = useState('');
    const [rto, setRto] = useState('');
    const [color, setColor] = useState('');
    const [vehicleColor, setVehicleColor] = useState('');
    const [accessories, setAccessories] = useState([] as any[]);
    const [totalDiscount, setTotalDiscount] = useState('');
    const [accessoriesTotal, setAccessoriesTotal] = useState('');
    const [accessoriesAfterDiscount, setAccessoriesAfterDiscount] = useState('');
    const [exchangeModel, setExchangeModel] = useState('');
    const [exchangePrice, setExchangePrice] = useState('');
    const [onRoadPrice, setOnRoadPrice] = useState('');
    const [tempRegCharges, setTempRegCharges] = useState('');
    const [hypothecationCharges, setHypothecationCharges] = useState('');
    const [numberPlateCharges, setNumberPlateCharges] = useState('');
    const [affidavitAmount, setAffidavitAmount] = useState('');
    const [specialNoCharges, setSpecialNoCharges] = useState('');
    const [onRoadDiscount, setOnRoadDiscount] = useState('');
    const [expectedDelivery, setExpectedDelivery] = useState('');
    const [finalAmount, setFinalAmount] = useState('');

    // Payment Data
    const [financer, setFinancer] = useState('');
    const [loanType, setLoanType] = useState('');
    const [financierBranch, setFinancierBranch] = useState('');
    const [paymentHypothecation, setPaymentHypothecation] = useState('');
    const [remarks, setRemarks] = useState('');
    const [netReceivables, setNetReceivables] = useState('');

    const handleClose = () => {
        navigation.goBack();
    };

    const handleNext = () => {
        if (activeTab === 'customer') {
            // reset errors
            setNameError('');
            setPhoneError('');
            setAddressError('');
            setLocalityError('');
            setPincodeError('');
            setSalesOfficerError('');

            let hasError = false;
            if (!customerFullName) {
                setNameError('Required');
                hasError = true;
            }
            if (!phone) {
                setPhoneError('Required');
                hasError = true;
            }
            if (!address) {
                setAddressError('Required');
                hasError = true;
            }
            if (!locality) {
                setLocalityError('Required');
                hasError = true;
            }
            if (!pincode) {
                setPincodeError('Required');
                hasError = true;
            }
            if (!salesOfficer) {
                setSalesOfficerError('Required');
                hasError = true;
            }
            if (hasError) return;

            setActiveTab('vehicle');
        } else if (activeTab === 'vehicle') {
            if (!model) {
                toast.error('Please select a vehicle model');
                return;
            }
            setActiveTab('payment');
        }
    };

    const handleBack = () => {
        if (activeTab === 'payment') {
            setActiveTab('vehicle');
        } else if (activeTab === 'vehicle') {
            setActiveTab('customer');
        }
    };

    const handleSaveComplete = () => {
        toast.success('Booking registered successfully');
        navigation.goBack();
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white border-b border-gray-100 px-4 py-4 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity onPress={handleClose} className="mr-3">
                        <ChevronLeft size={24} color={COLORS.gray[900]} />
                    </TouchableOpacity>
                    <Text className="text-gray-900 text-lg font-bold">Booking Activity</Text>
                </View>
            </View>

            {/* Booking Info (styled like quotation card) */}
            <View className="mt-2 bg-white rounded-xl border border-gray-100 p-4 mb-2 w-[330px] self-center">
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-gray-500 text-sm">Booking Id:</Text>
                    <Text className="text-teal-600 font-bold text-sm">New</Text>
                </View>
                <View className="flex-row justify-between items-center">
                    <Text className="text-gray-500 text-sm">Customer Id:</Text>
                    <Text className="text-gray-900 text-sm font-medium">{customerId}</Text>
                </View>
            </View>

            {/* Tabs */}
            <View className="w-[340px] self-center rounded-l  bg-white border-b border-gray-100">
                <View className="flex-row items-center px-4">
                    {/* Customer Tab */}
                    <TouchableOpacity
                        onPress={() => setActiveTab('customer')}
                        className={`flex-1 py-3 flex-row items-center justify-center gap-2 border-b-2 ${activeTab === 'customer'
                            ? 'border-teal-600'
                            : 'border-transparent'
                            }`}
                    >
                        <Text
                            className={`text-sm font-medium ${activeTab === 'customer'
                                ? 'text-teal-600'
                                : 'text-gray-600'
                                }`}
                        >
                            Customer
                        </Text>
                    </TouchableOpacity>

                    <ChevronRight size={16} color={COLORS.gray[400]} />

                    {/* Vehicle Tab */}
                    <TouchableOpacity
                        onPress={() => setActiveTab('vehicle')}
                        className={`flex-1 py-3 flex-row items-center justify-center gap-2 border-b-2 ${activeTab === 'vehicle'
                            ? 'border-teal-600'
                            : 'border-transparent'
                            }`}
                    >
                        <Text
                            className={`text-sm font-medium ${activeTab === 'vehicle'
                                ? 'text-teal-600'
                                : 'text-gray-600'
                                }`}
                        >
                            Vehicle
                        </Text>
                    </TouchableOpacity>

                    <ChevronRight size={16} color={COLORS.gray[400]} />

                    {/* Payment Tab */}
                    <TouchableOpacity
                        onPress={() => setActiveTab('payment')}
                        className={`flex-1 py-3 flex-row items-center justify-center gap-2 border-b-2 ${activeTab === 'payment'
                            ? 'border-teal-600'
                            : 'border-transparent'
                            }`}
                    >
                        <Text
                            className={`text-sm font-medium ${activeTab === 'payment'
                                ? 'text-teal-600'
                                : 'text-gray-600'
                                }`}
                        >
                            Payment
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                >
                    <View className="bg-white rounded-xl border border-gray-100 p-4">
                        {activeTab === 'customer' && (
                            <View>
                                <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                                    Customer Information
                                </Text>

                                <View className="mb-4">
                                    <FormLabel label="Branch" required />
                                    <TextInput
                                        value={branch}
                                        editable={false}
                                        className="h-12 bg-gray-100 border border-gray-200 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Customer Name" required />
                                    <TextInput
                                        value={customerFullName}
                                        onChangeText={setCustomerFullName}
                                        placeholder="Enter customer name"
                                        className={`h-12 bg-white border rounded-lg px-3 text-gray-800 ${nameError ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {nameError ? <Text className="text-red-500 text-xs mt-1">{nameError}</Text> : null}
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Phone" required />
                                    <View className="flex-row gap-2">
                                        <View className="w-16 h-12 bg-gray-100 border border-gray-200 rounded-lg items-center justify-center">
                                            <Text className="text-gray-700 font-medium">+91</Text>
                                        </View>
                                        <TextInput
                                            value={phone}
                                            onChangeText={setPhone}
                                            placeholder="9876543210"
                                            keyboardType="phone-pad"
                                            className={`flex-1 h-12 bg-white border rounded-lg px-3 text-gray-800 ${phoneError ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {phoneError ? <Text className="text-red-500 text-xs mt-1">{phoneError}</Text> : null}
                                    </View>
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Father's Name" />
                                    <TextInput
                                        value={fatherName}
                                        onChangeText={setFatherName}
                                        placeholder="Enter father's name"
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Address Line 1" required />
                                    <TextInput
                                        value={address}
                                        onChangeText={setAddress}
                                        placeholder="Address Line 1"
                                        className={`h-12 bg-white border rounded-lg px-3 text-gray-800 ${addressError ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {addressError ? <Text className="text-red-500 text-xs mt-1">{addressError}</Text> : null}
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Address Line 2" />
                                    <TextInput
                                        value={address2}
                                        onChangeText={setAddress2}
                                        placeholder="Address Line 2"
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Address Line 3" />
                                    <TextInput
                                        value={address3}
                                        onChangeText={setAddress3}
                                        placeholder="Address Line 3"
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Locality" required />
                                    <TextInput
                                        value={locality}
                                        onChangeText={setLocality}
                                        placeholder="Locality"
                                        className={`h-12 bg-white border rounded-lg px-3 text-gray-800 ${localityError ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {localityError ? <Text className="text-red-500 text-xs mt-1">{localityError}</Text> : null}
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Country" />
                                    <TextInput
                                        value={country}
                                        onChangeText={setCountry}
                                        placeholder="Country"
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="State" />
                                    <TextInput
                                        value={stateVal}
                                        onChangeText={setStateVal}
                                        placeholder="State"
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="City" />
                                    <TextInput
                                        value={city}
                                        onChangeText={setCity}
                                        placeholder="City"
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Pincode" required />
                                    <TextInput
                                        value={pincode}
                                        onChangeText={setPincode}
                                        placeholder="Pincode"
                                        keyboardType="number-pad"
                                        className={`h-12 bg-white border rounded-lg px-3 text-gray-800 ${pincodeError ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {pincodeError ? <Text className="text-red-500 text-xs mt-1">{pincodeError}</Text> : null}
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Email" />
                                    <TextInput
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="Email"
                                        keyboardType="email-address"
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="DOB" />
                                    <TextInput
                                        value={dob}
                                        onChangeText={setDob}
                                        placeholder="DD/MM/YYYY"
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Age" />
                                    <TextInput
                                        value={age}
                                        onChangeText={setAge}
                                        placeholder="Age"
                                        keyboardType="numeric"
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Referred By" />
                                    <TextInput
                                        value={referredBy}
                                        onChangeText={setReferredBy}
                                        placeholder="Referred By"
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Relationship" />
                                    <TextInput
                                        value={relationship}
                                        onChangeText={setRelationship}
                                        placeholder="Relationship"
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Nominee" />
                                    <TextInput
                                        value={nominee}
                                        onChangeText={setNominee}
                                        placeholder="Nominee"
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Sales Officer" required />
                                    <TextInput
                                        value={salesOfficer}
                                        onChangeText={setSalesOfficer}
                                        placeholder="Sales Officer"
                                        className={`h-12 bg-white border rounded-lg px-3 text-gray-800 ${salesOfficerError ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {salesOfficerError ? <Text className="text-red-500 text-xs mt-1">{salesOfficerError}</Text> : null}
                                </View>
                            </View>
                        )}

                        {activeTab === 'vehicle' && (
                            <View>
                                <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                                    Vehicle Information
                                </Text>

                                <View className="mb-4">
                                    <FormLabel label="Manufacturer" required />
                                    <TouchableOpacity
                                        onPress={() => { }}
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 justify-center"
                                    >
                                        <Text className="text-gray-800">India Yamaha Motors</Text>
                                        <ChevronRight size={18} color={COLORS.gray[400]} style={{ position: 'absolute', right: 12, top: 12 }} />
                                    </TouchableOpacity>
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Model Name" required />
                                    <TouchableOpacity
                                        onPress={() => { }}
                                        className={`h-12 bg-white border rounded-lg px-3 justify-center ${modelError ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <Text className="text-gray-800">{model || 'Select Model'}</Text>
                                        <ChevronRight size={18} color={COLORS.gray[400]} style={{ position: 'absolute', right: 12, top: 12 }} />
                                    </TouchableOpacity>
                                    {modelError ? <Text className="text-red-500 text-xs mt-1">{modelError}</Text> : null}
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="RTO" />
                                    <TouchableOpacity
                                        onPress={() => { }}
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 justify-center"
                                    >
                                        <Text className="text-gray-800">{rto || 'Select RTO'}</Text>
                                        <ChevronRight size={18} color={COLORS.gray[400]} style={{ position: 'absolute', right: 12, top: 12 }} />
                                    </TouchableOpacity>
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Vehicle Color" />
                                    <View className="flex-row gap-2 items-center">
                                        <View className="flex-1 h-12 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex-row items-center">
                                            <Text className="text-gray-500">{vehicleColor || 'No Vehicle chosen'}</Text>
                                        </View>
                                        <Button title="Select Vehicle Color" onPress={() => { }} />
                                    </View>
                                </View>

                                {/* Accessories placeholder */}
                                <View className="mb-6 border rounded overflow-hidden">
                                    <View className="w-full py-12 text-center text-gray-400">
                                        <Text className="text-4xl">📦</Text>
                                        <Text>No Data</Text>
                                    </View>
                                </View>

                                {/* Totals row */}
                                <View className="mb-6">
                                    <View className="mb-4">
                                        <FormLabel label="Total Discount" />
                                        <View className="flex-row gap-2">
                                            <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
                                            <TextInput
                                                value={totalDiscount}
                                                onChangeText={setTotalDiscount}
                                                placeholder="Total Discount"
                                                keyboardType="numeric"
                                                className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                            />
                                        </View>
                                    </View>
                                    <View className="mb-4">
                                        <FormLabel label="Accessories Total" />
                                        <View className="flex-row gap-2">
                                            <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
                                            <TextInput
                                                value={accessoriesTotal}
                                                onChangeText={setAccessoriesTotal}
                                                placeholder="Accessories Total"
                                                keyboardType="numeric"
                                                className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                            />
                                        </View>
                                    </View>
                                    <View>
                                        <FormLabel label="Accessories Total (after Discount)" />
                                        <View className="flex-row gap-2">
                                            <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
                                            <TextInput
                                                value={accessoriesAfterDiscount}
                                                onChangeText={setAccessoriesAfterDiscount}
                                                placeholder="Accessories Totals(after Discount)"
                                                keyboardType="numeric"
                                                className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                            />
                                        </View>
                                    </View>
                                    <TouchableOpacity className="mt-2">
                                        <Text className="text-teal-600 text-sm">+Add/View Accessory</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Exchange Vehicle Information */}
                                <View className="mb-6 border-t pt-6">
                                    <Text className="text-base font-medium text-gray-700 mb-4">Exchange Vehicle Information</Text>
                                    <View className="mb-4">
                                        <FormLabel label="Exchange Model Name" />
                                        <TextInput
                                            value={exchangeModel}
                                            onChangeText={setExchangeModel}
                                            placeholder="Exchange Vehicle"
                                            className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                        />
                                    </View>
                                    <View>
                                        <FormLabel label="Exchange Price" />
                                        <View className="flex-row gap-2">
                                            <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
                                            <TextInput
                                                value={exchangePrice}
                                                onChangeText={setExchangePrice}
                                                placeholder="Exchange Price"
                                                keyboardType="numeric"
                                                className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Vehicle Charges */}
                                <View className="mb-6 border-t pt-6">
                                    <Text className="text-base font-medium text-gray-700 mb-4">Vehicle Charges</Text>
                                    <View className="mb-4">
                                        <FormLabel label="On-Road Price" />
                                        <View className="flex-row gap-2">
                                            <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
                                            <TextInput
                                                value={onRoadPrice}
                                                onChangeText={setOnRoadPrice}
                                                placeholder="On-Road Price"
                                                keyboardType="numeric"
                                                className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                            />
                                        </View>
                                    </View>
                                    <View className="mb-4">
                                        <FormLabel label="Temporary Registration Charges" />
                                        <View className="flex-row gap-2">
                                            <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
                                            <TextInput
                                                value={tempRegCharges}
                                                onChangeText={setTempRegCharges}
                                                placeholder="Temporary Registration Charges"
                                                keyboardType="numeric"
                                                className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                            />
                                        </View>
                                    </View>
                                    <View className="mb-4">
                                        <FormLabel label="Hypothecation" />
                                        <View className="flex-row gap-2">
                                            <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
                                            <TextInput
                                                value={hypothecationCharges}
                                                onChangeText={setHypothecationCharges}
                                                placeholder="Hypothecation"
                                                keyboardType="numeric"
                                                className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                            />
                                        </View>
                                    </View>
                                    <View className="mb-4">
                                        <FormLabel label="Number Plate Charges" />
                                        <View className="flex-row gap-2">
                                            <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
                                            <TextInput
                                                value={numberPlateCharges}
                                                onChangeText={setNumberPlateCharges}
                                                placeholder="Number Plate Charges"
                                                keyboardType="numeric"
                                                className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                            />
                                        </View>
                                    </View>
                                    <View className="mb-4">
                                        <FormLabel label="Affidavit Amount" />
                                        <View className="flex-row gap-2">
                                            <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
                                            <TextInput
                                                value={affidavitAmount}
                                                onChangeText={setAffidavitAmount}
                                                placeholder="Affidavit Amount"
                                                keyboardType="numeric"
                                                className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                            />
                                        </View>
                                    </View>
                                    <View className="mb-4">
                                        <FormLabel label="Special No. Charges" />
                                        <View className="flex-row gap-2">
                                            <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
                                            <TextInput
                                                value={specialNoCharges}
                                                onChangeText={setSpecialNoCharges}
                                                placeholder="Special No. Charges"
                                                keyboardType="numeric"
                                                className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                            />
                                        </View>
                                    </View>
                                    <View className="mb-4">
                                        <FormLabel label="On Road Discount" />
                                        <View className="flex-row gap-2">
                                            <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
                                            <TextInput
                                                value={onRoadDiscount}
                                                onChangeText={setOnRoadDiscount}
                                                placeholder="Final Discount (for On-Road)"
                                                keyboardType="numeric"
                                                className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                            />
                                        </View>
                                    </View>
                                    <View className="mb-4">
                                        <FormLabel label="Expected Delivery Date" />
                                        <TextInput
                                            value={expectedDelivery}
                                            onChangeText={setExpectedDelivery}
                                            placeholder="YYYY-MM-DD"
                                            className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                        />
                                    </View>
                                    <View>
                                        <FormLabel label="Final Amount" />
                                        <View className="flex-row gap-2">
                                            <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
                                            <TextInput
                                                value={finalAmount}
                                                editable={false}
                                                placeholder="0"
                                                className="flex-1 h-12 bg-gray-50 border border-gray-300 rounded-lg px-3 text-gray-800"
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        {activeTab === 'payment' && (
                            <View>
                                <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                                    Payment Information
                                </Text>

                                <View className="mb-4">
                                    <FormLabel label="Payment Mode" required />
                                    <View className="h-12 border border-gray-300 rounded-lg overflow-hidden bg-white">
                                        <View className="flex-row">
                                            <TouchableOpacity
                                                onPress={() => setPaymentMode('cash')}
                                                className={`flex-1 h-12 justify-center items-center ${paymentMode === 'cash' ? 'bg-teal-50' : 'bg-white'}`}
                                            >
                                                <Text className={paymentMode === 'cash' ? 'text-teal-700 font-medium' : 'text-gray-600'}>Cash</Text>
                                            </TouchableOpacity>
                                            <View className="w-[1px] bg-gray-300" />
                                            <TouchableOpacity
                                                onPress={() => setPaymentMode('finance')}
                                                className={`flex-1 h-12 justify-center items-center ${paymentMode === 'finance' ? 'bg-teal-50' : 'bg-white'}`}
                                            >
                                                <Text className={paymentMode === 'finance' ? 'text-teal-700 font-medium' : 'text-gray-600'}>Finance</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>

                                {paymentMode === 'finance' && (
                                    <View className="mb-4">
                                        <View className="mb-4">
                                            <FormLabel label="Hypothecation" />
                                            <TextInput
                                                value={paymentHypothecation}
                                                onChangeText={setPaymentHypothecation}
                                                placeholder="Hypothecation"
                                                className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                            />
                                        </View>

                                        <View className="mb-4">
                                            <FormLabel label="Loan Type" />
                                            <TouchableOpacity
                                                onPress={() => { }}
                                                className="h-12 bg-white border border-gray-300 rounded-lg px-3 justify-center"
                                            >
                                                <Text className="text-gray-800">{loanType || 'Loan Type'}</Text>
                                                <ChevronRight size={18} color={COLORS.gray[400]} style={{ position: 'absolute', right: 12, top: 12 }} />
                                            </TouchableOpacity>
                                        </View>

                                        <View className="mb-4">
                                            <FormLabel label="Financier Name" />
                                            <TouchableOpacity
                                                onPress={() => { }}
                                                className="h-12 bg-white border border-gray-300 rounded-lg px-3 justify-center"
                                            >
                                                <Text className="text-gray-800">{financer || 'Financier'}</Text>
                                                <ChevronRight size={18} color={COLORS.gray[400]} style={{ position: 'absolute', right: 12, top: 12 }} />
                                            </TouchableOpacity>
                                        </View>

                                        <View>
                                            <FormLabel label="Financier Branch" />
                                            <TextInput
                                                value={financierBranch}
                                                onChangeText={setFinancierBranch}
                                                placeholder="Financier Branch"
                                                className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                            />
                                        </View>
                                    </View>
                                )}

                                <View className="mb-4">
                                    <FormLabel label="Remarks" />
                                    <TextInput
                                        value={remarks}
                                        onChangeText={setRemarks}
                                        multiline
                                        numberOfLines={4}
                                        textAlignVertical="top"
                                        placeholder="Remarks"
                                        className="h-24 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                                    />
                                </View>

                                <View>
                                    <FormLabel label="Net Receivables" />
                                    <View className="flex-row gap-2">
                                        <View className="h-12 w-12 bg-gray-50 border border-gray-300 rounded-lg items-center justify-center">
                                            <Text className="text-gray-600">₹</Text>
                                        </View>
                                        <TextInput
                                            value={netReceivables}
                                            onChangeText={setNetReceivables}
                                            placeholder="0"
                                            keyboardType="numeric"
                                            className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                        />
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer Buttons */}
            <View className="bg-white border-t border-gray-100 p-4 flex-row gap-3">
                {activeTab === 'customer' ? (
                    <>
                        <Button
                            title="Cancel"
                            variant="outline"
                            className="flex-1"
                            onPress={handleClose}
                        />
                        <Button title="Next" className="flex-1" onPress={handleNext} />
                    </>
                ) : activeTab === 'vehicle' ? (
                    <>
                        <Button
                            title="Back"
                            variant="outline"
                            className="flex-1"
                            onPress={handleBack}
                        />
                        <Button title="Next" className="flex-1" onPress={handleNext} />
                    </>
                ) : (
                    <>
                        <Button
                            title="Back"
                            variant="outline"
                            className="flex-1"
                            onPress={handleBack}
                        />
                        <Button title="Save & Complete" className="flex-1" onPress={handleSaveComplete} />
                    </>
                )}
            </View>

        </SafeAreaView>
    );
}
