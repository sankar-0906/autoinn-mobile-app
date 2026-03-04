import React, { useState, useEffect } from 'react';
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

type AdvancedBookingNavigationProp = StackNavigationProp<RootStackParamList, 'AdvancedBooking'>;

interface PhoneNumber {
    number: string;
    type: string;
    validity: string;
    whatsApp: string;
    dnd: string;
}

export default function AdvancedBookingScreen() {
    const route = useRoute();
    const navigation = useNavigation<AdvancedBookingNavigationProp>();
    const { customerId, customerName, phoneNumbers } = route.params as {
        customerId?: string;
        customerName?: string;
        phoneNumbers?: PhoneNumber[];
    };

    const [currentStep, setCurrentStep] = useState(1);

    const steps = [
        { id: 1, label: 'Customer Data', icon: 'person-outline' },
        { id: 2, label: 'Vehicle Data', icon: 'car-outline' },
        { id: 3, label: 'Payment Data', icon: 'card-outline' },
    ];

    // Form state
    const [branch, setBranch] = useState('');
    const [phone, setPhone] = useState('');
    const [customerFullName, setCustomerFullName] = useState('');
    const [fatherName, setFatherName] = useState('');
    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [address3, setAddress3] = useState('');
    const [locality, setLocality] = useState('');
    const [country, setCountry] = useState('');
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    const [pincode, setPincode] = useState('');
    const [email, setEmail] = useState('');
    const [dob, setDob] = useState('');
    const [nomineeName, setNomineeName] = useState('');
    const [nomineeAge, setNomineeAge] = useState('');
    const [relationship, setRelationship] = useState('');
    const [referredBy, setReferredBy] = useState('');
    const [salesOfficer, setSalesOfficer] = useState('');
    const [quotations, setQuotations] = useState<any[]>([]);
    const [quotationsAssociated, setQuotationsAssociated] = useState('');
    const [gender, setGender] = useState('');
    
    // Vehicle data
    const [manufacturer, setManufacturer] = useState('');
    const [modelName, setModelName] = useState('');
    const [variant, setVariant] = useState('');
    const [rto, setRto] = useState('');
    const [chassisNumber, setChassisNumber] = useState('');
    const [engineNumber, setEngineNumber] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [selectedColor, setSelectedColor] = useState(null);
    const [accessories, setAccessories] = useState([]);
    const [insuranceType, setInsuranceType] = useState('');
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
    
    // Price calculation fields
    const [totalDiscount, setTotalDiscount] = useState('');
    const [accessoriesTotal, setAccessoriesTotal] = useState('');
    const [accessoriesTotalAfterDiscount, setAccessoriesTotalAfterDiscount] = useState('');
    const [onRoadPrice, setOnRoadPrice] = useState('');
    const [trCharges, setTrCharges] = useState('');
    const [hypothecationCharges, setHypothecationCharges] = useState('');
    const [numberPlateCharges, setNumberPlateCharges] = useState('');
    const [affidavitAmount, setAffidavitAmount] = useState('');
    const [specialNoCharges, setSpecialNoCharges] = useState('');
    const [onRoadDiscount, setOnRoadDiscount] = useState('');
    const [finalAmount, setFinalAmount] = useState('');
    
    // Exchange vehicle fields
    const [exchangeVehicleModel, setExchangeVehicleModel] = useState('');
    const [exchangeVehiclePrice, setExchangeVehiclePrice] = useState('');
    
    // Payment data
    const [paymentMode, setPaymentMode] = useState('');
    const [loanType, setLoanType] = useState('');
    const [financierName, setFinancierName] = useState('');
    const [financierBranch, setFinancierBranch] = useState('');
    const [hypothecation, setHypothecation] = useState(false);
    const [downPayment, setDownPayment] = useState('');
    const [tenure, setTenure] = useState('');
    const [loanAmount, setLoanAmount] = useState('');
    const [emiAmount, setEmiAmount] = useState('');
    const [emiDate, setEmiDate] = useState('');
    const [emiStartDate, setEmiStartDate] = useState('');
    const [loanDisbursement, setLoanDisbursement] = useState('');
    const [showroomFinanceCharges, setShowroomFinanceCharges] = useState('');
    const [remarks, setRemarks] = useState('');
    const [netReceivables, setNetReceivables] = useState('');
    
    // Price data (keeping existing ones)
    const [bookingAmount, setBookingAmount] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [discount, setDiscount] = useState('');
    const [netAmount, setNetAmount] = useState('');
    const [insuranceAmount, setInsuranceAmount] = useState('');
    const [roadTax, setRoadTax] = useState('');
    const [warrantyPrice, setWarrantyPrice] = useState('');
    const [registrationFee, setRegistrationFee] = useState('');
    const [handlingCharges, setHandlingCharges] = useState('');
    const [tempRegister, setTempRegister] = useState('');
    const [hp, setHp] = useState('');

    // Dropdown data
    const [branches, setBranches] = useState<any[]>([]);
    const [countries, setCountries] = useState<any[]>([]);
    const [states, setStates] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [manufacturers, setManufacturers] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);
    const [rtos, setRtos] = useState<any[]>([]);
    const [financiers, setFinanciers] = useState<any[]>([]);
    const [salesOfficers, setSalesOfficers] = useState<any[]>([]);
    const [referredByData, setReferredByData] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [customerAvailable, setCustomerAvailable] = useState(false);
    const [customerDetails, setCustomerDetails] = useState<any>(null);
    const [genderOptions, setGenderOptions] = useState<any[]>([]);
    const [relationshipOptions, setRelationshipOptions] = useState<any[]>([]);
    const [paymentModes, setPaymentModes] = useState<any[]>([]);
    const [loanTypes, setLoanTypes] = useState<any[]>([]);
    const [hypothecationOptions, setHypothecationOptions] = useState<any[]>([]);
    const [emiDates, setEmiDates] = useState<any[]>([]);

    // UI state
    const [loading, setLoading] = useState(false);
    const [showColorModal, setShowColorModal] = useState(false);
    const [showAccessoryModal, setShowAccessoryModal] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [errors, setErrors] = useState({});

    // Data fetching functions
    const fetchCountries = async () => {
        try {
            const mockCountries = [
                { id: '1', name: 'India' },
                { id: '2', name: 'United States' },
                { id: '3', name: 'United Kingdom' },
            ];
            setCountries(mockCountries);
        } catch (error) {
            console.error('Error fetching countries:', error);
        }
    };

    const fetchStates = async (countryId: string) => {
        try {
            const mockStates = [
                { id: '1', name: 'Tamil Nadu' },
                { id: '2', name: 'Karnataka' },
                { id: '3', name: 'Maharashtra' },
            ];
            setStates(mockStates);
        } catch (error) {
            console.error('Error fetching states:', error);
        }
    };

    const fetchCities = async (stateId: string) => {
        try {
            const mockCities = [
                { id: '1', name: 'Chennai' },
                { id: '2', name: 'Bangalore' },
                { id: '3', name: 'Mumbai' },
            ];
            setCities(mockCities);
        } catch (error) {
            console.error('Error fetching cities:', error);
        }
    };

    const fetchBranches = async () => {
        try {
            const mockBranches = [
                { id: '1', name: 'Main Branch' },
                { id: '2', name: 'North Branch' },
                { id: '3', name: 'South Branch' },
            ];
            setBranches(mockBranches);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchManufacturers = async () => {
        try {
            const mockManufacturers = [
                { id: '1', name: 'Maruti Suzuki' },
                { id: '2', name: 'Hyundai' },
                { id: '3', name: 'Tata Motors' },
            ];
            setManufacturers(mockManufacturers);
        } catch (error) {
            console.error('Error fetching manufacturers:', error);
        }
    };

    const fetchModels = async (manufacturerId: string) => {
        try {
            const mockModels = [
                { id: '1', name: 'Swift', modelCode: 'SW001' },
                { id: '2', name: 'i20', modelCode: 'I2001' },
                { id: '3', name: 'Nexon', modelCode: 'NX001' },
            ];
            setModels(mockModels);
        } catch (error) {
            console.error('Error fetching models:', error);
        }
    };

    const fetchFinanciers = async () => {
        try {
            const mockFinanciers = [
                { id: '1', name: 'HDFC Bank' },
                { id: '2', name: 'ICICI Bank' },
                { id: '3', name: 'SBI Bank' },
            ];
            setFinanciers(mockFinanciers);
        } catch (error) {
            console.error('Error fetching financiers:', error);
        }
    };

    const fetchSalesOfficers = async () => {
        try {
            const mockSalesOfficers = [
                { id: '1', name: 'John Doe', profile: { employeeName: 'John Doe' } },
                { id: '2', name: 'Jane Smith', profile: { employeeName: 'Jane Smith' } },
                { id: '3', name: 'Mike Johnson', profile: { employeeName: 'Mike Johnson' } },
            ];
            setSalesOfficers(mockSalesOfficers);
        } catch (error) {
            console.error('Error fetching sales officers:', error);
        }
    };

    const fetchRtos = async () => {
        try {
            const mockRtos = [
                { id: '1', code: 'TN-01', area: 'Chennai' },
                { id: '2', code: 'KA-01', area: 'Bangalore' },
                { id: '3', code: 'MH-01', area: 'Mumbai' },
            ];
            setRtos(mockRtos);
        } catch (error) {
            console.error('Error fetching RTOs:', error);
        }
    };

    // Fetch dropdown options
    const fetchGenderOptions = async () => {
        try {
            const options = [
                { id: 'male', name: 'Male' },
                { id: 'female', name: 'Female' },
                { id: 'other', name: 'Other' },
            ];
            setGenderOptions(options);
        } catch (error) {
            console.error('Error fetching gender options:', error);
        }
    };

    const fetchRelationshipOptions = async () => {
        try {
            const options = [
                { id: 'father', name: 'Father' },
                { id: 'mother', name: 'Mother' },
                { id: 'sister', name: 'Sister' },
                { id: 'brother', name: 'Brother' },
                { id: 'daughter', name: 'Daughter' },
                { id: 'son', name: 'Son' },
                { id: 'wife', name: 'Wife' },
                { id: 'husband', name: 'Husband' },
                { id: 'father-in-law', name: 'Father-in-law' },
                { id: 'mother-in-law', name: 'Mother-in-law' },
                { id: 'daughter-in-law', name: 'Daughter-in-law' },
                { id: 'son-in-law', name: 'Son-in-law' },
                { id: 'sister-in-law', name: 'Sister-in-law' },
                { id: 'brother-in-law', name: 'Brother-in-law' },
            ];
            setRelationshipOptions(options);
        } catch (error) {
            console.error('Error fetching relationship options:', error);
        }
    };

    const fetchPaymentModes = async () => {
        try {
            const options = [
                { id: 'cash', name: 'Cash' },
                { id: 'finance', name: 'Finance' },
            ];
            setPaymentModes(options);
        } catch (error) {
            console.error('Error fetching payment modes:', error);
        }
    };

    const fetchLoanTypes = async () => {
        try {
            const options = [
                { id: 'self', name: 'Self' },
                { id: 'companyAssist', name: 'Company Assist' },
            ];
            setLoanTypes(options);
        } catch (error) {
            console.error('Error fetching loan types:', error);
        }
    };

    const fetchHypothecationOptions = async () => {
        try {
            const options = [
                { id: true, name: 'Yes' },
                { id: false, name: 'No' },
            ];
            setHypothecationOptions(options);
        } catch (error) {
            console.error('Error fetching hypothecation options:', error);
        }
    };

    const fetchEmiDates = async () => {
        try {
            const options = [];
            for (let i = 1; i <= 31; i++) {
                options.push({ id: i, name: i.toString() });
            }
            setEmiDates(options);
        } catch (error) {
            console.error('Error fetching EMI dates:', error);
        }
    };

    const searchCustomer = async (phoneNumber: string) => {
        try {
            if (phoneNumber.length === 10) {
                const mockCustomers = [
                    {
                        id: '1',
                        name: 'Rahul Sharma',
                        contacts: [{ phone: phoneNumber }],
                        address: {
                            line1: '123 Main St',
                            locality: 'Central Area',
                            pincode: '600001',
                            country: { name: 'India' },
                            state: { name: 'Tamil Nadu' },
                            district: { name: 'Chennai' },
                        },
                        fatherName: 'Sharma',
                        email: 'rahul@example.com',
                        dateOfBirth: '1990-01-01',
                        gender: 'Male',
                    },
                ];
                setCustomers(mockCustomers);
                setCustomerAvailable(true);
                setCustomerDetails(mockCustomers[0]);
                // Auto-fill customer data
                setCustomerFullName(mockCustomers[0].name);
                setFatherName(mockCustomers[0].fatherName);
                setAddress1(mockCustomers[0].address.line1);
                setLocality(mockCustomers[0].address.locality);
                setPincode(mockCustomers[0].address.pincode);
                setEmail(mockCustomers[0].email);
                setDob(mockCustomers[0].dateOfBirth);
            }
        } catch (error) {
            console.error('Error searching customer:', error);
        }
    };

    // Initialize data on component mount
    useEffect(() => {
        fetchCountries();
        fetchBranches();
        fetchManufacturers();
        fetchFinanciers();
        fetchSalesOfficers();
        fetchRtos();
        fetchGenderOptions();
        fetchRelationshipOptions();
        fetchPaymentModes();
        fetchLoanTypes();
        fetchHypothecationOptions();
        fetchEmiDates();
        
        // Set default values from route params
        if (customerName) {
            setCustomerFullName(customerName);
        }
        if (phoneNumbers && phoneNumbers.length > 0) {
            setPhone(phoneNumbers[0].number);
        }
    }, [customerName, phoneNumbers]);

    // Fetch states when country changes
    useEffect(() => {
        if (country) {
            fetchStates(country);
        }
    }, [country]);

    // Fetch cities when state changes
    useEffect(() => {
        if (state) {
            fetchCities(state);
        }
    }, [state]);

    // Fetch models when manufacturer changes
    useEffect(() => {
        if (manufacturer) {
            fetchModels(manufacturer);
        }
    }, [manufacturer]);

    // Search customer when phone number is complete
    useEffect(() => {
        if (phone.length === 10) {
            searchCustomer(phone);
        }
    }, [phone]);

    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        } else {
            // Save and complete
            Alert.alert('Success', 'Advanced booking completed successfully!');
            navigation.goBack();
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
            <Text style={styles.headerTitle}>Advanced Booking Register</Text>
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
                            className="w-16 px-2 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                            editable={false}
                        />
                        <TextInput
                            value={phone}
                            onChangeText={setPhone}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
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

            <View className="border-t border-gray-200 pt-4 mt-4">
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

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Accessories Total
                    </Text>
                    <View className="flex-row space-x-3">
                        <TextInput
                            value={selectedAccessories.length > 0 ? `${selectedAccessories.length} accessories selected` : ''}
                            placeholder="No accessories selected"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                            editable={false}
                        />
                        <TouchableOpacity
                            onPress={() => setShowAccessoriesModal(true)}
                            className="px-4 py-2 bg-teal-600 rounded-lg ml-3"
                        >
                            <Text className="text-sm font-medium text-white">Select</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Insurance Amount
                    </Text>
                    <TextInput
                        value={insuranceAmount}
                        onChangeText={setInsuranceAmount}
                        placeholder="Insurance Amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        keyboardType="numeric"
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Other Charges
                    </Text>
                    <TextInput
                        value={otherCharges}
                        onChangeText={setOtherCharges}
                        placeholder="Other Charges"
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
                        {['Cash', 'Card', 'UPI', 'Cheque', 'Finance'].map((mode) => (
                            <TouchableOpacity
                                key={mode}
                                onPress={() => setPaymentMode(mode)}
                                className={`flex-row items-center p-3 rounded-lg border ${
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

                {paymentMode === 'Finance' && (
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                            <Text className="text-red-500">*</Text> Finance Details
                        </Text>
                        <TextInput
                            placeholder="Enter finance company details..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg h-20"
                            multiline
                            numberOfLines={4}
                        />
                    </View>
                )}

                <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">
                        Payment Details
                    </Text>
                    <TextInput
                        placeholder="Enter payment details..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg h-20"
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <View className="mb-4">
                    <View className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <Text className="text-blue-800 text-sm">
                            Advanced booking includes accessories and insurance options.
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return renderCustomerData();
            case 2:
                return renderVehicleData();
            case 3:
                return renderPaymentData();
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
                            <Text className="text-lg font-bold text-gray-900">Add Advanced Booking</Text>
                            <Text className="text-sm text-gray-500">Advanced Booking</Text>
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
                            {currentStep === 3 ? 'Complete Booking' : 'Next'}
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

            {/* Accessories Modal */}
            <Modal
                visible={showAccessoriesModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowAccessoriesModal(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black bg-opacity-50 items-center justify-center"
                    activeOpacity={1}
                    onPress={() => setShowAccessoriesModal(false)}
                >
                    <View className="bg-white rounded-xl p-6 mx-4 max-w-sm w-full max-h-96">
                        <Text className="text-lg font-semibold text-gray-900 mb-4 text-center">Select Accessories</Text>
                        <ScrollView className="flex-1 mb-4">
                            <View className="space-y-2">
                                {[
                                    { id: 1, name: 'Helmet', price: 1500 },
                                    { id: 2, name: 'Mobile Holder', price: 800 },
                                    { id: 3, name: 'Side Box', price: 2500 },
                                    { id: 4, name: 'Seat Cover', price: 1200 },
                                    { id: 5, name: 'Tank Pad', price: 600 },
                                ].map((accessory) => {
                                    const isSelected = selectedAccessories.some(a => a.id === accessory.id);
                                    return (
                                        <TouchableOpacity
                                            key={accessory.id}
                                            onPress={() => {
                                                if (isSelected) {
                                                    setSelectedAccessories(selectedAccessories.filter(a => a.id !== accessory.id));
                                                } else {
                                                    setSelectedAccessories([...selectedAccessories, accessory]);
                                                }
                                            }}
                                            className={`p-3 rounded-lg border flex-row justify-between items-center ${
                                                isSelected ? 'border-teal-600 bg-teal-50' : 'border-gray-200 bg-white'
                                            }`}
                                        >
                                            <Text className={`font-medium ${
                                                isSelected ? 'text-teal-700' : 'text-gray-900'
                                            }`}>
                                                {accessory.name}
                                            </Text>
                                            <Text className={`font-semibold ${
                                                isSelected ? 'text-teal-600' : 'text-gray-700'
                                            }`}>
                                                ₹{accessory.price}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                        <TouchableOpacity
                            onPress={() => setShowAccessoriesModal(false)}
                            className="p-3 bg-teal-600 rounded-lg"
                        >
                            <Text className="text-white font-medium text-center">Done</Text>
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
    infoBox: {
        backgroundColor: '#dbeafe',
        borderWidth: 1,
        borderColor: '#3b82f6',
        borderRadius: 6,
        padding: 12,
    },
    infoText: {
        fontSize: 14,
        color: '#1e40af',
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
        flexDirection: 'row',
        gap: 12,
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
    accessoriesOptions: {
        gap: 8,
        maxHeight: 250,
    },
    accessoryOption: {
        padding: 12,
        borderWidth: 1,
        borderRadius: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    accessoryOptionSelected: {
        borderColor: '#14b8a6',
        backgroundColor: '#f0fdfa',
    },
    accessoryOptionUnselected: {
        borderColor: '#d1d5db',
    },
    accessoryName: {
        fontSize: 14,
    },
    accessoryPrice: {
        fontSize: 14,
        fontWeight: '500',
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
    doneButton: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#14b8a6',
        borderRadius: 6,
    },
    doneButtonText: {
        textAlign: 'center',
        color: 'white',
    },
});
