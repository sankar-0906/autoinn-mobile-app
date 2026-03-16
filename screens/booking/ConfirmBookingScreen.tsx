import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Modal,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { ChevronLeft } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import AuthenticationData from '../../components/AuthenticationData';

type ConfirmBookingNavigationProp = StackNavigationProp<RootStackParamList, 'ConfirmBooking'>;

interface PhoneNumber {
    number: string;
    type: string;
    validity: string;
    whatsApp: string;
    dnd: string;
}

export default function ConfirmBookingScreen() {
    const route = useRoute();
    const navigation = useNavigation<ConfirmBookingNavigationProp>();
    const { customerId, customerName, phoneNumbers } = route.params as {
        customerId?: string;
        customerName?: string;
        phoneNumbers?: PhoneNumber[];
    };

    const [currentStep, setCurrentStep] = useState(1);
    const [showColorModal, setShowColorModal] = useState(false);
    const [selectedColor, setSelectedColor] = useState<any>(null);
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [registeredPhone, setRegisteredPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [authStatus, setAuthStatus] = useState('Pending');
    
    // Booking data for authentication
    const [bookingData, setBookingData] = useState<any>(null);

    const steps = [
        { id: 1, label: 'Customer Data', icon: 'person-outline' },
        { id: 2, label: 'Vehicle Data', icon: 'car-outline' },
        { id: 3, label: 'Payment Data', icon: 'card-outline' },
        { id: 4, label: 'Customer Authentication', icon: 'shield-checkmark-outline' },
    ];

    // Form states
    const [branch, setBranch] = useState('Devanahalli');
    const [phone, setPhone] = useState(phoneNumbers?.[0]?.number || '');
    const [customerFullName, setCustomerFullName] = useState(customerName || '');
    const [fatherName, setFatherName] = useState('');
    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [locality, setLocality] = useState('');
    const [city, setCity] = useState('');
    const [pincode, setPincode] = useState('');
    const [nomineeName, setNomineeName] = useState('');
    const [nomineeAge, setNomineeAge] = useState('');
    const [relationship, setRelationship] = useState('');
    const [email, setEmail] = useState('');
    const [dob, setDob] = useState('');
    const [referredBy, setReferredBy] = useState('');
    const [quotationsAssociated, setQuotationsAssociated] = useState('');
    const [salesOfficer, setSalesOfficer] = useState('Sano');

    // Address fields
    const [address3, setAddress3] = useState('');
    const [country, setCountry] = useState('');
    const [state, setState] = useState('');

    // Vehicle states
    const [manufacturer, setManufacturer] = useState('India Yamaha Motors Private Limited');
    const [modelName, setModelName] = useState('');
    const [vehicleColor, setVehicleColor] = useState('');
    const [variant, setVariant] = useState('');
    const [chassisNumber, setChassisNumber] = useState('');
    const [engineNumber, setEngineNumber] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [rto, setRto] = useState('');
    const [insuranceType, setInsuranceType] = useState('');
    const [totalDiscount, setTotalDiscount] = useState('');
    const [accessoriesTotal, setAccessoriesTotal] = useState('');
    const [accessoriesTotalAfterDiscount, setAccessoriesTotalAfterDiscount] = useState('');
    const [bookingAmount, setBookingAmount] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [discount, setDiscount] = useState('');
    const [netAmount, setNetAmount] = useState('');

    // Payment data states
    const [hypothecation, setHypothecation] = useState('');
    const [loanType, setLoanType] = useState('');
    const [financierName, setFinancierName] = useState('');
    const [financierBranch, setFinancierBranch] = useState('');
    const [downPayment, setDownPayment] = useState('');
    const [tenure, setTenure] = useState('');
    const [loanAmount, setLoanAmount] = useState('');
    const [emiAmount, setEmiAmount] = useState('');
    const [emiDate, setEmiDate] = useState('');
    const [emiStartDate, setEmiStartDate] = useState('');
    const [loanDisbursementAmount, setLoanDisbursementAmount] = useState('');
    const [showroomFinanceCharges, setShowroomFinanceCharges] = useState('');
    const [remarks, setRemarks] = useState('');
    const [netReceivables, setNetReceivables] = useState('');
    const [tempRegister, setTempRegister] = useState('');

    const handleNext = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        } else {
            // Save and complete
            Alert.alert('Success', 'Booking completed successfully!');
            navigation.goBack();
        }
    };

    const prepareBookingData = () => {
        // Prepare booking data object for authentication component
        const data = {
            id: 'BK123456', // This would come from API
            bookingId: 'BK123456',
            customer: {
                name: customerFullName,
                contacts: [{ phone }],
                address: {
                    line1: address1,
                    line2: address2,
                    line3: address3,
                    city,
                    pincode: pincode,
                },
                fatherName,
                email,
                dateOfBirth: dob,
                gender: 'Male', // Default or from form
                customerId: 'CUST123456',
            },
            customerName: customerFullName,
            customerPhone: phone,
            vehicle: {
                modelName,
                manufacturer: { name: manufacturer },
                id: 'VEH123456',
                price: [{
                    showroomPrice: parseFloat(totalAmount) || 0,
                    roadTax: 0,
                    registrationFee: 0,
                    warrantyPrice: 0,
                }],
            },
            selectedVehicle: [{
                color: {
                    color: selectedColor?.name || vehicleColor,
                    url: '', // Would come from vehicle selection
                },
                vehicleDetail: {
                    expectedDeliveryDate: new Date().toISOString(),
                },
            }],
            price: {
                onRoadPrice: parseFloat(totalAmount) || 0,
                tempRegister: parseFloat(tempRegister) || 0,
                onRoadDiscount: parseFloat(discount) || 0,
                netRecieveables: parseFloat(netAmount) || 0,
                numberPlate: 0,
                specialNoCharges: 0,
                hp: parseFloat(hypothecation) || 0,
                affidavit: 0,
                finalAmount: parseFloat(netAmount) || 0,
                accessoriesTotalDiscount: parseFloat(accessoriesTotal) || 0,
                accessoriesTotalAfterDiscount: parseFloat(accessoriesTotalAfterDiscount) || 0,
                accessoriesTotal: parseFloat(accessoriesTotal) || 0,
                totalDiscount: parseFloat(discount) || 0,
                paymentMode,
                insuranceType,
            },
            accessories: [], // Would be populated from accessories selection
            color: {
                url: '', // Would come from vehicle selection
            },
            loan: {
                loanType,
                financer: { id: 'FIN123' },
                financerBranch: financierBranch,
                downPayment: parseFloat(downPayment) || 0,
                loanAmount: parseFloat(loanAmount) || 0,
                tenure: parseInt(tenure) || 0,
                emiAmount: parseFloat(emiAmount) || 0,
                emiDate: parseInt(emiDate) || 1,
                emiStartDate,
                disbursementAmount: parseFloat(loanDisbursementAmount) || 0,
                showroomFinanceCharges: parseFloat(showroomFinanceCharges) || 0,
                hypothecation,
            },
            branch,
            executive: salesOfficer,
            remarks,
            bookingStatus: 'PENDING',
            authorisedTime: null,
            authentication: {
                beforeVerification: null,
                afterVerification: null,
                verifiedAt: null,
            },
            nomineeName,
            nomineeAge,
            relationship,
            rto: { id: 'RTO123' },
        };
        
        setBookingData(data);
        return data;
    };

    const handleAuthenticationComplete = (result: any) => {
        console.log('Authentication completed:', result);
        // Handle authentication completion
        if (result.success) {
            // Update booking data with authentication results
            if (bookingData) {
                const updatedData = { ...bookingData };
                if (result.status) {
                    updatedData.bookingStatus = result.status;
                }
                if (result.authorisedTime) {
                    updatedData.authorisedTime = result.authorisedTime;
                }
                if (result.digitalVerified) {
                    updatedData.authentication = {
                        ...updatedData.authentication,
                        verifiedAt: result.verifiedTime,
                    };
                }
                setBookingData(updatedData);
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            navigation.goBack();
        }
    };

    const renderStepIndicator = () => (
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Booking Register</Text>
            <View style={styles.stepContainer}>
                {steps.map((step, index) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;
                    return (
                        <View key={step.id} style={styles.stepRow}>
                            <View style={styles.stepColumn}>
                                <View style={[
                                    styles.stepCircle,
                                    isActive ? styles.stepActive : isCompleted ? styles.stepCompleted : styles.stepInactive
                                ]}>
                                    <Ionicons 
                                        name={step.icon as any} 
                                        size={16} 
                                        color="white" 
                                    />
                                </View>
                                <Text style={[
                                    styles.stepLabel,
                                    isActive ? styles.stepLabelActive : isCompleted ? styles.stepLabelCompleted : styles.stepLabelInactive
                                ]}>
                                    {step.label}
                                </Text>
                                {isActive && <View style={styles.stepLineActive} />}
                            </View>
                            {index < steps.length - 1 && (
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={styles.chevron} />
                            )}
                        </View>
                    );
                })}
            </View>
        </View>
    );

    const renderCustomerData = () => (
        <View className="space-y-4">
            <View className="space-y-4">
                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Branch
                    </Text>
                    <TextInput
                        value={branch}
                        onChangeText={setBranch}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        editable={false}
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Phone
                    </Text>
                    <View className="flex-row space-x-3">
                        <TextInput
                            value="+91"
                            className="w-18 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                            editable={false}
                        />
                        <TextInput
                            value={phone}
                            onChangeText={setPhone}
                            className="flex-1 ml-2 px-3 py-2 border border-gray-300 rounded-lg"
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Customer Name
                    </Text>
                    <TextInput
                        value={customerFullName}
                        onChangeText={setCustomerFullName}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Father's Name
                    </Text>
                    <TextInput
                        value={fatherName}
                        onChangeText={setFatherName}
                        placeholder="Father's Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Address Line 1
                    </Text>
                    <TextInput
                        value={address1}
                        onChangeText={setAddress1}
                        placeholder="Address Line 1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Address Line 2
                    </Text>
                    <TextInput
                        value={address2}
                        onChangeText={setAddress2}
                        placeholder="Address Line 2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Address Line 3
                    </Text>
                    <TextInput
                        value={address3}
                        onChangeText={setAddress3}
                        placeholder="Address Line 3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Country
                    </Text>
                    <TextInput
                        value={country}
                        onChangeText={setCountry}
                        placeholder="Country"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> State
                    </Text>
                    <TextInput
                        value={state}
                        onChangeText={setState}
                        placeholder="State"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Locality
                    </Text>
                    <TextInput
                        value={locality}
                        onChangeText={setLocality}
                        placeholder="Locality"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> City
                    </Text>
                    <TextInput
                        value={city}
                        onChangeText={setCity}
                        placeholder="City"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Pincode
                    </Text>
                    <TextInput
                        value={pincode}
                        onChangeText={setPincode}
                        placeholder="Pincode"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        keyboardType="numeric"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Email
                    </Text>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        keyboardType="email-address"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> DOB
                    </Text>
                    <TextInput
                        value={dob}
                        onChangeText={setDob}
                        placeholder="DD/MM/YYYY"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Referred By
                    </Text>
                    <TextInput
                        value={referredBy}
                        onChangeText={setReferredBy}
                        placeholder="Referred By"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Nominee Name
                    </Text>
                    <TextInput
                        value={nomineeName}
                        onChangeText={setNomineeName}
                        placeholder="Nominee Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Nominee Age
                    </Text>
                    <TextInput
                        value={nomineeAge}
                        onChangeText={setNomineeAge}
                        placeholder="Nominee Age"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        keyboardType="numeric"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Relationship
                    </Text>
                    <TextInput
                        value={relationship}
                        onChangeText={setRelationship}
                        placeholder="Relationship"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Sales Officer
                    </Text>
                    <TextInput
                        value={salesOfficer}
                        onChangeText={setSalesOfficer}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        editable={false}
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Referred By
                    </Text>
                    <TextInput
                        value={referredBy}
                        onChangeText={setReferredBy}
                        placeholder="Referred By"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Relationship
                    </Text>
                    <TextInput
                        value={relationship}
                        onChangeText={setRelationship}
                        placeholder="Relationship"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>
            </View>

            <View className="border-t border-gray-200 pt-4 mt-4 mb-6">
                <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-medium text-gray-700">
                        Quotations /Associated
                    </Text>
                    <TouchableOpacity>
                        <Text className="text-sm text-teal-600 font-medium">Link Quotation</Text>
                    </TouchableOpacity>
                </View>
                <TextInput
                    value={quotationsAssociated}
                    onChangeText={setQuotationsAssociated}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    placeholder="No quotations linked"
                    editable={false}
                />
            </View>
        </View>
    );

    const renderVehicleData = () => (
        <View className="space-y-4">
            <View className="space-y-4">
                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Manufacturer
                    </Text>
                    <TextInput
                        value={manufacturer}
                        onChangeText={setManufacturer}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        editable={false}
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Model Name
                    </Text>
                    <TextInput
                        value={modelName}
                        onChangeText={setModelName}
                        placeholder="Select Model Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Vehicle Color
                    </Text>
                    <View className="flex-row space-x-3">
                        <TextInput
                            value={selectedColor ? selectedColor.name : ''}
                            placeholder="No Vehicle Chosen"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                            editable={false}
                        />
                        <TouchableOpacity
                            onPress={() => setShowColorModal(true)}
                            className="px-4 py-2 bg-teal-600 rounded-lg ml-3"
                        >
                            <Text className="text-sm font-medium text-white">Select Color</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Variant
                    </Text>
                    <TextInput
                        value={variant}
                        onChangeText={setVariant}
                        placeholder="Select Variant"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Chassis Number
                    </Text>
                    <TextInput
                        value={chassisNumber}
                        onChangeText={setChassisNumber}
                        placeholder="Chassis Number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Engine Number
                    </Text>
                    <TextInput
                        value={engineNumber}
                        onChangeText={setEngineNumber}
                        placeholder="Engine Number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> RTO
                    </Text>
                    <TextInput
                        value={rto}
                        onChangeText={setRto}
                        placeholder="RTO"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Insurance Type
                    </Text>
                    <TextInput
                        value={insuranceType}
                        onChangeText={setInsuranceType}
                        placeholder="Insurance Type"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Registration Number
                    </Text>
                    <TextInput
                        value={registrationNumber}
                        onChangeText={setRegistrationNumber}
                        placeholder="Registration Number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Booking Amount
                    </Text>
                    <TextInput
                        value={bookingAmount}
                        onChangeText={setBookingAmount}
                        placeholder="Booking Amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        keyboardType="numeric"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Total Amount
                    </Text>
                    <TextInput
                        value={totalAmount}
                        onChangeText={setTotalAmount}
                        placeholder="Total Amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        keyboardType="numeric"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Total Discount
                    </Text>
                    <TextInput
                        value={totalDiscount}
                        onChangeText={setTotalDiscount}
                        placeholder="Total Discount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        keyboardType="numeric"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Accessories Total
                    </Text>
                    <TextInput
                        value={accessoriesTotal}
                        onChangeText={setAccessoriesTotal}
                        placeholder="Accessories Total"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        keyboardType="numeric"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Accessories Total (after Discount)
                    </Text>
                    <TextInput
                        value={accessoriesTotalAfterDiscount}
                        onChangeText={setAccessoriesTotalAfterDiscount}
                        placeholder="Accessories Total (after Discount)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        keyboardType="numeric"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Discount
                    </Text>
                    <TextInput
                        value={discount}
                        onChangeText={setDiscount}
                        placeholder="Discount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        keyboardType="numeric"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Net Amount
                    </Text>
                    <TextInput
                        value={netAmount}
                        onChangeText={setNetAmount}
                        placeholder="Net Amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        keyboardType="numeric"
                    />
                </View>
            </View>
        </View>
    );

    const renderPaymentData = () => (
        <View className="space-y-4">
            <View className="space-y-4">
                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        <Text className="text-red-500">*</Text> Payment Mode
                    </Text>
                    <View className="space-y-3">
                        {['Cash', 'Card', 'UPI', 'Cheque'].map((mode) => (
                            <TouchableOpacity
                                key={mode}
                                onPress={() => setPaymentMode(mode)}
                                className={`mb-2 flex-row items-center p-3 rounded-lg border ${
                                    paymentMode === mode 
                                        ? 'border-teal-600 bg-teal-50' 
                                        : 'border-gray-300 bg-white'
                                }`}
                            >
                                <View className={`w-4 h-4 rounded-full border-2 mr-3 items-center justify-center ${
                                    paymentMode === mode 
                                        ? 'border-teal-600 bg-teal-600' 
                                        : 'border-gray-400'
                                }`}>
                                    {paymentMode === mode && (
                                        <View className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                </View>
                                <Text className={`text-sm font-medium ${
                                    paymentMode === mode ? 'text-teal-700' : 'text-gray-700'
                                }`}>
                                    {mode}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Temporary Registration Charges
                    </Text>
                    <TextInput
                        value={tempRegister}
                        onChangeText={setTempRegister}
                        placeholder="Temporary Registration Charges"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        keyboardType="numeric"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Hypothecation
                    </Text>
                    <TextInput
                        value={hypothecation}
                        onChangeText={setHypothecation}
                        placeholder="Hypothecation"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Loan Type
                    </Text>
                    <TextInput
                        value={loanType}
                        onChangeText={setLoanType}
                        placeholder="Loan Type"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Financier Name
                    </Text>
                    <TextInput
                        value={financierName}
                        onChangeText={setFinancierName}
                        placeholder="Financier Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Financier Branch
                    </Text>
                    <TextInput
                        value={financierBranch}
                        onChangeText={setFinancierBranch}
                        placeholder="Financier Branch"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Down Payment
                    </Text>
                    <TextInput
                        value={downPayment}
                        onChangeText={setDownPayment}
                        placeholder="Down Payment"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        keyboardType="numeric"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Tenure
                    </Text>
                    <TextInput
                        value={tenure}
                        onChangeText={setTenure}
                        placeholder="Tenure (months)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        keyboardType="numeric"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Loan Amount
                    </Text>
                    <TextInput
                        value={loanAmount}
                        onChangeText={setLoanAmount}
                        placeholder="Loan Amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        keyboardType="numeric"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        EMI Amount
                    </Text>
                    <TextInput
                        value={emiAmount}
                        onChangeText={setEmiAmount}
                        placeholder="EMI Amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        keyboardType="numeric"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        EMI Date - Day Only
                    </Text>
                    <TextInput
                        value={emiDate}
                        onChangeText={setEmiDate}
                        placeholder="EMI Date (Day)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        keyboardType="numeric"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        EMI Start Date
                    </Text>
                    <TextInput
                        value={emiStartDate}
                        onChangeText={setEmiStartDate}
                        placeholder="EMI Start Date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Loan Disbursement Amount
                    </Text>
                    <TextInput
                        value={loanDisbursementAmount}
                        onChangeText={setLoanDisbursementAmount}
                        placeholder="Loan Disbursement Amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        keyboardType="numeric"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Showroom Finance Charges
                    </Text>
                    <TextInput
                        value={showroomFinanceCharges}
                        onChangeText={setShowroomFinanceCharges}
                        placeholder="Showroom Finance Charges"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        keyboardType="numeric"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Remarks
                    </Text>
                    <TextInput
                        value={remarks}
                        onChangeText={setRemarks}
                        placeholder="Remarks"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg h-20"
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Net Receivables
                    </Text>
                    <TextInput
                        value={netReceivables}
                        onChangeText={setNetReceivables}
                        placeholder="Net Receivables"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        keyboardType="numeric"
                    />
                </View>
            </View>
        </View>
    );

    const renderCustomerAuthentication = () => {
        // Prepare booking data when entering authentication step
        if (!bookingData) {
            prepareBookingData();
        }
        
        return (
            <AuthenticationData
                data={bookingData || prepareBookingData()}
                onAuthenticationComplete={handleAuthenticationComplete}
                editable={true}
            />
        );
    };

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return renderCustomerData();
            case 2:
                return renderVehicleData();
            case 3:
                return renderPaymentData();
            case 4:
                return renderCustomerAuthentication();
            default:
                return renderCustomerData();
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white border-b border-gray-100 px-4 py-4">
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
                            <ChevronLeft size={22} color={COLORS.gray[900]} />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-lg font-bold text-gray-900">Booking Register</Text>
                            <Text className="text-sm text-gray-500">Confirm Booking</Text>
                        </View>
                    </View>
                </View>
            </View>
            
            {/* Step Indicator */}
            <View className="bg-white border-b border-gray-100 px-4 py-3">
                <View className="flex-row items-center justify-between">
                    {steps.map((step, index) => {
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;
                        return (
                            <View key={step.id} className="flex-1 items-center">
                                <View className="items-center">
                                    <View className={`w-8 h-8 rounded-full items-center justify-center ${
                                        isActive ? 'bg-teal-600' : isCompleted ? 'bg-teal-600' : 'bg-gray-400'
                                    }`}>
                                        <Ionicons 
                                            name={step.icon as any} 
                                            size={16} 
                                            color="white" 
                                        />
                                    </View>
                                    <Text className={`text-xs mt-1 text-center ${
                                        isActive ? 'text-teal-600 font-semibold' : isCompleted ? 'text-teal-600' : 'text-gray-400'
                                    }`}>
                                        {step.label}
                                    </Text>
                                </View>
                                {index < steps.length - 1 && (
                                    <View className={`w-full h-0.5 my-2 ${
                                        currentStep > step.id ? 'bg-teal-600' : 'bg-gray-300'
                                    }`} />
                                )}
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* Form Content */}
            <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                <View className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    {renderCurrentStep()}
                </View>
            </ScrollView>
            
            {/* Bottom Navigation */}
            <View className="bg-white border-t border-gray-100 px-4 py-3">
                <View className="flex-row justify-between">
                    <TouchableOpacity
                        onPress={handleBack}
                        className="px-6 py-3 bg-gray-100 rounded-lg border border-gray-200"
                    >
                        <Text className="text-sm font-semibold text-gray-700">Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleNext}
                        className="px-6 py-3 bg-teal-600 rounded-lg"
                    >
                        <Text className="text-sm font-semibold text-white">
                            {currentStep === 4 ? 'Complete Booking' : 'Next'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Color Modal */}
            <Modal
                visible={showColorModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowColorModal(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black bg-opacity-50 items-center justify-center"
                    activeOpacity={1}
                    onPress={() => setShowColorModal(false)}
                >
                    <View className="bg-white rounded-xl p-6 mx-4 max-w-sm w-full">
                        <Text className="text-lg font-semibold text-gray-900 mb-4 text-center">Select Vehicle Color</Text>
                        <View className="space-y-2 mb-4">
                            {['Black', 'Red', 'Blue', 'White', 'Gray', 'Green'].map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    onPress={() => {
                                        setSelectedColor({ name: color });
                                        setShowColorModal(false);
                                    }}
                                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                    <Text className="text-gray-900 font-medium">{color}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowColorModal(false)}
                            className="p-3 bg-gray-100 rounded-lg"
                        >
                            <Text className="text-gray-700 font-medium text-center">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        backgroundColor: '#4b5563',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: 'white',
        textAlign: 'center',
    },
    stepContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepColumn: {
        alignItems: 'center',
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepActive: {
        backgroundColor: '#14b8a6',
    },
    stepCompleted: {
        backgroundColor: '#14b8a6',
    },
    stepInactive: {
        backgroundColor: '#9ca3af',
    },
    stepLabel: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },
    stepLabelActive: {
        color: '#14b8a6',
        fontWeight: '500',
    },
    stepLabelCompleted: {
        color: '#14b8a6',
    },
    stepLabelInactive: {
        color: '#9ca3af',
    },
    stepLineActive: {
        width: '100%',
        height: 2,
        backgroundColor: '#14b8a6',
        marginTop: 4,
        borderRadius: 1,
    },
    chevron: {
        marginHorizontal: 8,
    },
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    content: {
        maxWidth: 800,
        marginHorizontal: 'auto',
        paddingHorizontal: 16,
        paddingVertical: 24,
    },
    form: {
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        padding: 16,
    },
    formGroup: {
        gap: 16,
    },
    inputGroup: {
        gap: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    required: {
        color: '#ef4444',
    },
    input: {
        width: '100%',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        fontSize: 14,
    },
    phoneContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    countryCode: {
        width: 64,
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        fontSize: 14,
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        fontSize: 14,
    },
    borderTop: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 16,
        marginTop: 16,
    },
    quotationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    linkText: {
        fontSize: 14,
        color: '#14b8a6',
    },
    disabledInput: {
        width: '100%',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        backgroundColor: '#f9fafb',
        fontSize: 14,
    },
    colorContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    colorInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        backgroundColor: '#f9fafb',
        fontSize: 14,
    },
    colorButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        backgroundColor: '#f9fafb',
    },
    buttonText: {
        fontSize: 14,
    },
    paymentOptions: {
        gap: 8,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderRadius: 6,
    },
    paymentOptionActive: {
        borderColor: '#14b8a6',
        backgroundColor: '#f0fdfa',
    },
    paymentOptionInactive: {
        borderColor: '#d1d5db',
    },
    radioCircle: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        marginRight: 12,
    },
    radioActive: {
        borderColor: '#14b8a6',
    },
    radioInactive: {
        borderColor: '#d1d5db',
    },
    radioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#14b8a6',
        alignSelf: 'center',
    },
    paymentText: {
        fontSize: 14,
    },
    textArea: {
        width: '100%',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        fontSize: 14,
        textAlignVertical: 'top',
        minHeight: 80,
    },
    uploadArea: {
        width: '100%',
        paddingHorizontal: 12,
        paddingVertical: 32,
        borderWidth: 2,
        borderColor: '#d1d5db',
        borderRadius: 6,
        backgroundColor: '#f9fafb',
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed',
    },
    uploadText: {
        color: '#9ca3af',
        marginTop: 8,
        fontSize: 14,
    },
    warningBox: {
        backgroundColor: '#fef3c7',
        borderWidth: 1,
        borderColor: '#f59e0b',
        borderRadius: 6,
        padding: 12,
    },
    warningText: {
        fontSize: 14,
        color: '#92400e',
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    buttonRow: {
        // flexDirection: 'row',
        // gap: 8,
    },
    backButton: {
        flex: 1,
        backgroundColor: '#e5e7eb',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        color: '#374151',
        fontWeight: '500',
    },
    nextButton: {
        flex: 1,
        backgroundColor: '#14b8a6',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextButtonText: {
        color: 'white',
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 24,
        marginHorizontal: 16,
        width: '100%',
        maxWidth: 300,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 16,
    },
    colorOptions: {
        gap: 8,
        maxHeight: 200,
    },
    colorOption: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
    },
    colorOptionText: {
        fontSize: 14,
    },
    cancelButton: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#e5e7eb',
        borderRadius: 6,
    },
    cancelButtonText: {
        textAlign: 'center',
        color: '#374151',
    },
});
