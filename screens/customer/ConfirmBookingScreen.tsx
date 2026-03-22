import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity,
    Alert, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, ChevronRight, Calendar, X } from 'lucide-react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { HeaderWithBack } from '../../components/ui/BackButton';
import { useToast } from '../../src/ToastContext';
import { formatValue } from '../../src/utils/formatUtils';
import * as DocumentPicker from 'expo-document-picker';
import { generateBookingOTP, verifyBookingOTP, generateBookingPDF, uploadBookingDocument } from '../../src/api';
import { DownloadCloud, UploadCloud, FileText } from 'lucide-react-native';

type Props = {
    navigation: StackNavigationProp<RootStackParamList, 'ConfirmBooking'>;
    route: RouteProp<RootStackParamList, 'ConfirmBooking'>;
};

const TAB_KEYS = ['customer', 'vehicle', 'payment', 'auth'] as const;
const TAB_LABELS = ['Customer', 'Vehicle', 'Payment', 'Auth'];

// ── Reusable sub-components ─────────────────────────────────────────────────

const FormLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
    <Text className="text-sm text-gray-600 mb-1 font-medium">
        {required && <Text className="text-red-500">* </Text>}{label}
    </Text>
);

// ── Component ───────────────────────────────────────────────────────────────
export default function ConfirmBookingScreen({
    navigation,
    route,
}: Props) {
    const { customerId, customerName, customerPhone } = route.params || {};
    const toast = useToast();

    // ── UI State ───────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<'customer' | 'vehicle' | 'payment' | 'auth'>('customer');

    // ── Customer fields ────────────────────────────────────────────────────
    const [branch, setBranch] = useState('');
    const [phone, setPhone] = useState(customerPhone ? String(customerPhone) : '');
    const [customerFullName, setCustomerFullName] = useState(customerName ? String(customerName) : '');
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
    const [nomineeAge, setNomineeAge] = useState('');
    const [salesOfficer, setSalesOfficer] = useState('');
    const [quotationsAssociated, setQuotationsAssociated] = useState('');
    const [customerGender, setCustomerGender] = useState('Male');
    const [customerDob, setCustomerDob] = useState('');
    const [generatedCustomerId, setGeneratedCustomerId] = useState('');

    // ── Vehicle fields ─────────────────────────────────────────────────────
    const [manufacturer, setManufacturer] = useState('India Yamaha Motors Private Limited');
    const [model, setModel] = useState('');
    const [rto, setRto] = useState('');
    const [vehicleColor, setVehicleColor] = useState('');
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
    const [finalAmount, setFinalAmount] = useState('');
    const [showroomPrice, setShowroomPrice] = useState('');
    const [insuranceAmount, setInsuranceAmount] = useState('');
    const [roadTax, setRoadTax] = useState('');
    const [warrantyPrice, setWarrantyPrice] = useState('');
    const [registrationFee, setRegistrationFee] = useState('');
    const [handlingCharges, setHandlingCharges] = useState('');
    const [insuranceType, setInsuranceType] = useState('');
    const [expectedDelivery, setExpectedDelivery] = useState('');

    // ── Payment fields ─────────────────────────────────────────────────────
    const [paymentMode, setPaymentMode] = useState('cash');
    const [financer, setFinancer] = useState('');
    const [loanType, setLoanType] = useState('');
    const [financierBranch, setFinancierBranch] = useState('');
    const [paymentHypothecation, setPaymentHypothecation] = useState<boolean>(false);
    const [remarks, setRemarks] = useState('');
    const [netReceivables, setNetReceivables] = useState('');
    const [downPayment, setDownPayment] = useState('');
    const [tenure, setTenure] = useState('');
    const [loanAmount, setLoanAmount] = useState('');
    const [emiAmount, setEmiAmount] = useState('');
    const [emiDay, setEmiDay] = useState('');
    const [emiStartDate, setEmiStartDate] = useState('');
    const [loanDisbursementAmount, setLoanDisbursementAmount] = useState('');
    const [showroomFinanceCharges, setShowroomFinanceCharges] = useState('');

    // ── Dropdown data ──────────────────────────────────────────────────────
    const [countries, setCountries] = useState<any[]>([]);
    const [states, setStates] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [rtos, setRtos] = useState<any[]>([]);
    const [manufacturers, setManufacturers] = useState<any[]>([]);
    const [models, setModels] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);
    const [salesOfficers, setSalesOfficers] = useState<any[]>([]);
    const [referredByOptions, setReferredByOptions] = useState<any[]>([]);
    const [relationshipOptions, setRelationshipOptions] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [financerOptions, setFinancerOptions] = useState<any[]>([]);

    // ── Modal visibility ───────────────────────────────────────────────────
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [showStateModal, setShowStateModal] = useState(false);
    const [showCityModal, setShowCityModal] = useState(false);
    const [showRtoModal, setShowRtoModal] = useState(false);
    const [showManufacturerModal, setShowManufacturerModal] = useState(false);
    const [showModelModal, setShowModelModal] = useState(false);
    const [showColorModal, setShowColorModal] = useState(false);
    const [showSalesOfficerModal, setShowSalesOfficerModal] = useState(false);
    const [showReferredByModal, setShowReferredByModal] = useState(false);
    const [showRelationshipModal, setShowRelationshipModal] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [showExpectedDeliveryModal, setShowExpectedDeliveryModal] = useState(false);
    const [showLoanTypeModal, setShowLoanTypeModal] = useState(false);
    const [showTenureModal, setShowTenureModal] = useState(false);
    const [showEmiDayModal, setShowEmiDayModal] = useState(false);
    const [showFinancerModal, setShowFinancerModal] = useState(false);
    const [showEmiStartDateModal, setShowEmiStartDateModal] = useState(false);

    // ── Auth section state ──────────────────────────────────────────────────
    const [authStatus, setAuthStatus] = useState<'Pending' | 'Verified'>('Pending');
    const [digitalAuthCompleted, setDigitalAuthCompleted] = useState(false);
    const [verifiedTime, setVerifiedTime] = useState<string | null>(null);
    const [otp, setOtp] = useState('');
    const [refId, setRefId] = useState<number>(0);
    const [isGeneratingOtp, setIsGeneratingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [isUploadingPdf, setIsUploadingPdf] = useState(false);
    const [generatedPDF, setGeneratedPDF] = useState('');

    // ── Calendar state ───────────────────────────────────────────────────────
    const [dobCalendarStep, setDobCalendarStep] = useState<'year' | 'month' | 'day'>('year');
    const [dobPickYear, setDobPickYear] = useState(new Date().getFullYear());
    const [dobPickMonth, setDobPickMonth] = useState(new Date().getMonth());

    // ── Validation errors ──────────────────────────────────────────────────
    const [nameError, setNameError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [salesOfficerError, setSalesOfficerError] = useState('');
    const [addressError, setAddressError] = useState('');
    const [localityError, setLocalityError] = useState('');
    const [pincodeError, setPincodeError] = useState('');
    const [modelError, setModelError] = useState('');

    // ── Ref sync helpers ─────────────────────────────────────────────────────
    const setCustomerFullNameSync = (v: string) => { setCustomerFullName(v); };
    const setPhoneSync = (v: string) => { setPhone(v); };
    const setFatherNameSync = (v: string) => { setFatherName(v); };
    const setAddressSync = (v: string) => { setAddress(v); };
    const setAddress2Sync = (v: string) => { setAddress2(v); };
    const setAddress3Sync = (v: string) => { setAddress3(v); };
    const setLocalitySync = (v: string) => { setLocality(v); };
    const setPincodeSync = (v: string) => { setPincode(v); };
    const setCountrySync = (v: string) => { setCountry(v); };
    const setStateValSync = (v: string) => { setStateVal(v); };
    const setCitySync = (v: string) => { setCity(v); };
    const setCustomerGenderSync = (v: string) => { setCustomerGender(v); };
    const setEmailSync = (v: string) => { setEmail(v); };
    const setDobSync = (v: string) => { setDob(v); };
    const setAgeSync = (v: string) => { setAge(v); };
    const setSalesOfficerSync = (v: string) => { setSalesOfficer(v); };
    const setRemarksSync = (v: string) => { setRemarks(v); };
    const setExpectedDeliverySync = (v: string) => { setExpectedDelivery(v); };
    const setNomineeSync = (v: string) => { setNominee(v); };
    const setNomineeAgeSync = (v: string) => { setNomineeAge(v); };
    const setRelationshipSync = (v: string) => { setRelationship(v); };
    const setReferredBySync = (v: any) => { setReferredBy(v && (v.name || v.display) ? v.name || v.display : v); };
    const setPaymentModeSync = (v: string) => { setPaymentMode(v); };

    // ── Handlers ─────────────────────────────────────────────────────────--
    const handlePhoneChange = (text: string) => {
        const formatted = formatValue(text, 'onlyNo');
        const digits = formatted.slice(0, 10);
        setPhoneSync(digits);
    };

    const handleNext = () => {
        if (activeTab === 'customer') {
            setNameError(''); setPhoneError(''); setAddressError('');
            setLocalityError(''); setPincodeError(''); setSalesOfficerError('');
            let err = false;
            if (!customerFullName.trim()) { setNameError('Required'); err = true; }
            if (!phone.trim() || phone.length !== 10) { setPhoneError('Valid phone required'); err = true; }
            if (!address.trim()) { setAddressError('Required'); err = true; }
            if (!locality.trim()) { setLocalityError('Required'); err = true; }
            if (!pincode.trim() || pincode.length !== 6) { setPincodeError('Valid pincode required'); err = true; }
            if (!salesOfficer.trim()) { setSalesOfficerError('Required'); err = true; }
            if (!age.trim()) { toast.error('Age is required'); err = true; }
            if (!customerGender.trim()) { toast.error('Gender is required'); err = true; }
            if (!err) setActiveTab('vehicle');
        } else if (activeTab === 'vehicle') {
            if (!model) { toast.error('Please select a vehicle model'); return; }
            if (!expectedDelivery || expectedDelivery.trim() === '' || expectedDelivery === 'DD/MM/YYYY') { toast.error('Expected Delivery Date is required'); return; }
            setActiveTab('payment');
        } else if (activeTab === 'payment') {
            setActiveTab('auth');
        }
    };

    const handleBack = () => {
        if (activeTab === 'auth') setActiveTab('payment');
        else if (activeTab === 'payment') setActiveTab('vehicle');
        else if (activeTab === 'vehicle') setActiveTab('customer');
    };

    const handleClose = () => {
        navigation.goBack();
    };

    const handleSaveComplete = () => {
        // Handle save and complete logic
        toast.success('Booking completed successfully!');
        navigation.goBack();
    };

    // ── Render Methods ───────────────────────────────────────────────────────

    const renderCustomerSection = () => (
        <View>
            <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                Customer Information
            </Text>

            {/* Branch */}
            <View className="mb-4">
                <FormLabel label="Branch" required />
                <TouchableOpacity
                    onPress={() => setShowBranchModal(true)}
                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                >
                    <Text className="text-gray-800 flex-1">{branch || 'Select Branch'}</Text>
                    <ChevronRight size={16} color={COLORS.gray[400]} />
                </TouchableOpacity>
            </View>

            {/* Phone */}
            <View className="mb-4">
                <FormLabel label="Phone" required />
                <View className="flex-row gap-2">
                    <View className="w-16 h-12 bg-gray-100 border border-gray-200 rounded-lg items-center justify-center">
                        <Text className="text-gray-700 font-medium">+91</Text>
                    </View>
                    <TextInput
                        value={phone}
                        onChangeText={handlePhoneChange}
                        placeholder="Phone Number"
                        keyboardType="phone-pad"
                        maxLength={10}
                        className={`flex-1 h-12 bg-white border rounded-lg px-3 text-gray-800 ${phoneError ? 'border-red-500' : 'border-gray-300'}`}
                    />
                </View>
                {phoneError ? <Text className="text-red-500 text-xs mt-1">{phoneError}</Text> : null}
            </View>

            {/* Customer Name */}
            <View className="mb-4">
                <FormLabel label="Customer Name" required />
                <TextInput
                    value={customerFullName}
                    onChangeText={(v) => {
                        const formatted = formatValue(v, 'allCaps');
                        setCustomerFullNameSync(formatted);
                    }}
                    placeholder="Customer Full Name"
                    className={`h-12 bg-white border rounded-lg px-3 text-gray-800 ${nameError ? 'border-red-500' : 'border-gray-300'}`}
                />
                {nameError ? <Text className="text-red-500 text-xs mt-1">{nameError}</Text> : null}
            </View>

            {/* Father Name */}
            <View className="mb-4">
                <FormLabel label="Father's Name" required />
                <TextInput
                    value={fatherName}
                    onChangeText={(v) => {
                        const formatted = formatValue(v, 'allCaps');
                        setFatherNameSync(formatted);
                    }}
                    placeholder="Enter father's name"
                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                />
            </View>

            {/* Address Line 1 */}
            <View className="mb-4">
                <FormLabel label="Address Line 1" required />
                <TextInput
                    value={address}
                    onChangeText={setAddressSync}
                    placeholder="Address Line 1"
                    className={`h-12 bg-white border rounded-lg px-3 text-gray-800 ${addressError ? 'border-red-500' : 'border-gray-300'}`}
                />
                {addressError ? <Text className="text-red-500 text-xs mt-1">{addressError}</Text> : null}
            </View>

            {/* Address Line 2 */}
            <View className="mb-4">
                <FormLabel label="Address Line 2" />
                <TextInput
                    value={address2}
                    onChangeText={setAddress2Sync}
                    placeholder="Address Line 2"
                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                />
            </View>

            {/* Address Line 3 */}
            <View className="mb-4">
                <FormLabel label="Address Line 3" />
                <TextInput
                    value={address3}
                    onChangeText={setAddress3Sync}
                    placeholder="Address Line 3"
                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                />
            </View>

            {/* Locality */}
            <View className="mb-4">
                <FormLabel label="Locality" required />
                <TextInput
                    value={locality}
                    onChangeText={(v) => {
                        const formatted = formatValue(v, 'allCaps');
                        setLocalitySync(formatted);
                    }}
                    placeholder="Locality"
                    className={`h-12 bg-white border rounded-lg px-3 text-gray-800 ${localityError ? 'border-red-500' : 'border-gray-300'}`}
                />
                {localityError ? <Text className="text-red-500 text-xs mt-1">{localityError}</Text> : null}
            </View>

            {/* Country */}
            <View className="mb-4">
                <FormLabel label="Country" required />
                <TouchableOpacity
                    onPress={() => setShowCountryModal(true)}
                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                >
                    <Text className="text-gray-800 flex-1">{country || 'Select Country'}</Text>
                    <ChevronRight size={16} color={COLORS.gray[400]} />
                </TouchableOpacity>
            </View>

            {/* State */}
            <View className="mb-4">
                <FormLabel label="State" required />
                <TouchableOpacity
                    onPress={() => setShowStateModal(true)}
                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                >
                    <Text className="text-gray-800 flex-1">{stateVal || 'Select State'}</Text>
                    <ChevronRight size={16} color={COLORS.gray[400]} />
                </TouchableOpacity>
            </View>

            {/* City */}
            <View className="mb-4">
                <FormLabel label="City" required />
                <TouchableOpacity
                    onPress={() => setShowCityModal(true)}
                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                >
                    <Text className="text-gray-800 flex-1">{city || 'Select City'}</Text>
                    <ChevronRight size={16} color={COLORS.gray[400]} />
                </TouchableOpacity>
            </View>

            {/* Pincode */}
            <View className="mb-4">
                <FormLabel label="Pincode" required />
                <TextInput
                    value={pincode}
                    onChangeText={(v) => {
                        const formatted = formatValue(v, 'onlyNo');
                        setPincodeSync(formatted);
                    }}
                    placeholder="Pincode"
                    keyboardType="number-pad"
                    maxLength={6}
                    className={`h-12 bg-white border rounded-lg px-3 text-gray-800 ${pincodeError ? 'border-red-500' : 'border-gray-300'}`}
                />
                {pincodeError ? <Text className="text-red-500 text-xs mt-1">{pincodeError}</Text> : null}
            </View>

            {/* Email */}
            <View className="mb-4">
                <FormLabel label="Email" />
                <TextInput
                    value={email}
                    onChangeText={(v) => {
                        const formatted = formatValue(v, 'toLowerCase');
                        setEmailSync(formatted);
                    }}
                    placeholder="Email"
                    keyboardType="email-address"
                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                />
            </View>

            {/* DOB */}
            <View className="mb-4">
                <FormLabel label="DOB" required />
                <View className="flex-row items-center">
                    <TextInput
                        value={dob}
                        onChangeText={setDobSync}
                        placeholder="DD/MM/YYYY"
                        className="flex-1 h-12 bg-white border border-gray-300 rounded-l-lg px-3 text-gray-800"
                    />
                    <TouchableOpacity
                        onPress={() => {
                            if (dob && dob.includes('/')) {
                                const [dd, mm, yyyy] = dob.split('/');
                                setDobPickYear(parseInt(yyyy) || new Date().getFullYear());
                                setDobPickMonth((parseInt(mm) || 1) - 1);
                            } else {
                                setDobPickYear(new Date().getFullYear());
                                setDobPickMonth(new Date().getMonth());
                            }
                            setDobCalendarStep('year');
                            setShowCalendarModal(true);
                        }}
                        className="h-12 bg-teal-600 rounded-r-lg px-4 justify-center"
                    >
                        <Calendar size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Age */}
            <View className="mb-4">
                <FormLabel label="Age" required />
                <TextInput
                    value={age}
                    onChangeText={setAgeSync}
                    placeholder="Age"
                    keyboardType="numeric"
                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                />
            </View>

            {/* Gender */}
            <View className="mb-4">
                <FormLabel label="Gender" required />
                <View className="flex-row gap-4 mt-2">
                    {['Male', 'Female', 'Other'].map(g => (
                        <TouchableOpacity
                            key={g}
                            onPress={() => setCustomerGenderSync(g)}
                            className={`flex-1 h-12 rounded-lg border flex-row items-center justify-center ${customerGender === g ? 'bg-teal-50 border-teal-600' : 'bg-white border-gray-300'}`}
                        >
                            <Text className={customerGender === g ? 'text-teal-700 font-bold' : 'text-gray-600'}>{g}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Nominee Age */}
            <View className="mb-4">
                <FormLabel label="Nominee Age" />
                <TextInput
                    value={nomineeAge}
                    onChangeText={setNomineeAgeSync}
                    placeholder="Nominee Age"
                    keyboardType="numeric"
                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                />
            </View>

            {/* Referred By */}
            <View className="mb-4">
                <FormLabel label="Referred By" />
                <TouchableOpacity
                    onPress={() => setShowReferredByModal(true)}
                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                >
                    <Text className="text-gray-800 flex-1">{referredBy || 'Select Referred By'}</Text>
                    <ChevronRight size={16} color={COLORS.gray[400]} />
                </TouchableOpacity>
            </View>

            {/* Relationship */}
            <View className="mb-4">
                <FormLabel label="Relationship" required />
                <TouchableOpacity
                    onPress={() => setShowRelationshipModal(true)}
                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                >
                    <Text className="text-gray-800 flex-1">{relationship || 'Select Relationship'}</Text>
                    <ChevronRight size={16} color={COLORS.gray[400]} />
                </TouchableOpacity>
            </View>

            {/* Nominee */}
            <View className="mb-4">
                <FormLabel label="Nominee Details" required />
                <TextInput
                    value={nominee}
                    onChangeText={setNomineeSync}
                    placeholder="Nominee Name"
                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                />
            </View>

            {/* Sales Officer */}
            <View className="mb-4">
                <FormLabel label="Sales Officer" required />
                <TouchableOpacity
                    onPress={() => setShowSalesOfficerModal(true)}
                    className={`h-12 bg-white border rounded-lg px-3 flex-row items-center justify-between ${salesOfficerError ? 'border-red-500' : 'border-gray-300'}`}
                >
                    <Text className="text-gray-800 flex-1">{salesOfficer || 'Select Sales Officer'}</Text>
                    <ChevronRight size={16} color={COLORS.gray[400]} />
                </TouchableOpacity>
                {salesOfficerError ? <Text className="text-red-500 text-xs mt-1">{salesOfficerError}</Text> : null}
            </View>

            {/* Quotations */}
            <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2">
                    <FormLabel label="Quotations Associated" />
                    <TouchableOpacity
                        onPress={() => {/* Link Quotation */ }}
                        className="px-3 py-1 bg-teal-600 rounded-lg"
                    >
                        <Text className="text-white text-xs font-medium">Link Quotation</Text>
                    </TouchableOpacity>
                </View>
                {quotationsAssociated ? (
                    <View className="flex-row flex-wrap gap-2 p-3 bg-gray-100 border border-gray-300 rounded-lg min-h-[48px]">
                        {quotationsAssociated.split(',').map((q, i) => (
                            <View key={i} className="px-3 py-1 bg-gray-400 rounded-full">
                                <Text className="text-white text-sm font-medium">{q.trim()}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View className="h-12 bg-gray-100 border border-gray-300 rounded-lg px-3 justify-center">
                        <Text className="text-gray-500 text-sm">No quotations linked</Text>
                    </View>
                )}
            </View>
        </View>
    );

    const renderVehicleSection = () => (
        <View>
            <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                Vehicle Information
            </Text>

            {/* Manufacturer */}
            <View className="mb-4">
                <FormLabel label="Manufacturer" required />
                <TouchableOpacity
                    onPress={() => setShowManufacturerModal(true)}
                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                >
                    <Text className="text-gray-800 flex-1">{manufacturer || 'Select Manufacturer'}</Text>
                    <ChevronRight size={16} color={COLORS.gray[400]} />
                </TouchableOpacity>
            </View>

            {/* Model */}
            <View className="mb-4">
                <FormLabel label="Model Name" required />
                <TouchableOpacity
                    onPress={() => setShowModelModal(true)}
                    className={`h-12 bg-white border rounded-lg px-3 flex-row items-center justify-between ${modelError ? 'border-red-500' : 'border-gray-300'}`}
                >
                    <Text className="text-gray-800 flex-1">{model || 'Select Model Name'}</Text>
                    <ChevronRight size={16} color={COLORS.gray[400]} />
                </TouchableOpacity>
                {modelError ? <Text className="text-red-500 text-xs mt-1">{modelError}</Text> : null}
            </View>

            {/* RTO */}
            <View className="mb-4">
                <FormLabel label="RTO" required />
                <TouchableOpacity
                    onPress={() => setShowRtoModal(true)}
                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                >
                    <Text className="text-gray-800 flex-1">{rto || 'Select RTO'}</Text>
                    <ChevronRight size={16} color={COLORS.gray[400]} />
                </TouchableOpacity>
            </View>

            {/* Vehicle Color */}
            <View className="mb-4">
                <FormLabel label="Vehicle Color" />
                <Text className="text-sm text-gray-600 mb-2">Selected Vehicle</Text>
                <View className={`h-16 px-3 py-2 rounded-lg flex-row items-center mb-3 ${model ? 'bg-white border border-gray-300' : 'bg-gray-200'}`}>
                    <Text className={`${model ? 'text-gray-800' : 'text-gray-500'} flex-1`}>
                        {vehicleColor || (model ? 'Select Vehicle Color' : 'No Vehicle chosen')}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={model ? () => {/* Navigate to vehicle selection */ } : undefined}
                    disabled={!model}
                    className={`px-4 py-3 rounded-lg flex-row items-center justify-center ${model ? 'bg-teal-600 opacity-100' : 'bg-gray-300 opacity-50'}`}
                >
                    <Text className={`font-medium mr-2 ${model ? 'text-white' : 'text-gray-500'}`}>
                        Select Vehicle Color
                    </Text>
                    <ChevronRight size={16} color={model ? 'white' : '#6b7280'} />
                </TouchableOpacity>
            </View>

            {/* Vehicle Charges */}
            <View className="mb-6 border-t pt-6">
                <Text className="text-base font-medium text-gray-700 mb-4">Vehicle Charges</Text>
                {[
                    { label: 'Showroom Price', value: showroomPrice, setter: setShowroomPrice },
                    { label: 'On-Road Price', value: onRoadPrice, setter: setOnRoadPrice },
                    { label: 'Insurance Amount', value: insuranceAmount, setter: setInsuranceAmount },
                    { label: 'Road Tax', value: roadTax, setter: setRoadTax },
                    { label: 'Handling Charges', value: handlingCharges, setter: setHandlingCharges },
                    { label: 'Registration Fee', value: registrationFee, setter: setRegistrationFee },
                    { label: 'Warranty Price', value: warrantyPrice, setter: setWarrantyPrice },
                    { label: 'Temp Registration', value: tempRegCharges, setter: setTempRegCharges },
                    { label: 'Hypothecation', value: hypothecationCharges, setter: setHypothecationCharges },
                    { label: 'Number Plate Charges', value: numberPlateCharges, setter: setNumberPlateCharges },
                    { label: 'Affidavit Amount', value: affidavitAmount, setter: setAffidavitAmount },
                    { label: 'Special No. Charges', value: specialNoCharges, setter: setSpecialNoCharges },
                    { label: 'On Road Discount', value: onRoadDiscount, setter: setOnRoadDiscount },
                ].map(({ label, value, setter }) => (
                    <View key={label} className="mb-4">
                        <FormLabel label={label} />
                        <View className="flex-row gap-2">
                            <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
                            <TextInput value={value} onChangeText={setter} keyboardType="numeric" placeholder="0" className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800" />
                        </View>
                    </View>
                ))}

                {/* Insurance Type */}
                <View className="mb-4">
                    <FormLabel label="Insurance Type" />
                    <TouchableOpacity onPress={() => setShowInsuranceTypeModal(true)} className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between">
                        <Text className="text-gray-800 flex-1">{insuranceType || 'Select Insurance Type'}</Text>
                        <ChevronRight size={16} color={COLORS.gray[400]} />
                    </TouchableOpacity>
                </View>

                {/* Expected Delivery Date */}
                <View className="mb-4">
                    <FormLabel label="Expected Delivery Date" required />
                    <View className="flex-row gap-2">
                        <TextInput
                            value={expectedDelivery}
                            onChangeText={setExpectedDeliverySync}
                            placeholder="DD/MM/YYYY"
                            className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                        />
                        <TouchableOpacity onPress={() => setShowExpectedDeliveryModal(true)} className="h-12 w-12 bg-white border border-gray-300 rounded-lg items-center justify-center">
                            <Calendar size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Final Amount */}
                <View>
                    <FormLabel label="Final Amount" />
                    <View className="flex-row gap-2">
                        <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
                        <TextInput value={finalAmount} editable={false} placeholder="0" className="flex-1 h-12 bg-gray-50 border border-gray-300 rounded-lg px-3 text-gray-800" />
                    </View>
                </View>
            </View>
        </View>
    );

    const renderPaymentSection = () => (
        <View>
            <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                Payment Information
            </Text>

            {/* Payment Mode */}
            <View className="mb-4">
                <FormLabel label="Payment Mode" required />
                <View className="h-12 border border-gray-300 rounded-lg overflow-hidden bg-white flex-row">
                    {['cash', 'finance'].map((mode, idx) => (
                        <React.Fragment key={mode}>
                            {idx > 0 && <View className="w-[1px] bg-gray-300" />}
                            <TouchableOpacity onPress={() => setPaymentModeSync(mode)} className={`flex-1 h-12 justify-center items-center ${paymentMode === mode ? 'bg-teal-50' : 'bg-white'}`}>
                                <Text className={paymentMode === mode ? 'text-teal-700 font-medium' : 'text-gray-600'}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</Text>
                            </TouchableOpacity>
                        </React.Fragment>
                    ))}
                </View>
            </View>

            {/* Finance fields */}
            {paymentMode === 'finance' && (
                <View className="mb-4">
                    <View className="mb-4">
                        <FormLabel label="Hypothecation" required />
                        <View className="flex-row gap-4 mt-2">
                            {[true, false].map(val => (
                                <TouchableOpacity key={String(val)} onPress={() => setPaymentHypothecation(val)} className={`flex-1 h-12 rounded-lg border items-center justify-center ${paymentHypothecation === val ? 'bg-teal-50 border-teal-600' : 'bg-white border-gray-300'}`}>
                                    <Text className={paymentHypothecation === val ? 'text-teal-700 font-bold' : 'text-gray-600'}>{val ? 'Yes' : 'No'}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View className="mb-4">
                        <FormLabel label="Loan Type" />
                        <TouchableOpacity onPress={() => setShowLoanTypeModal(true)} className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between">
                            <Text className="text-gray-800 flex-1">{loanType || 'Select Loan Type'}</Text>
                            <ChevronRight size={16} color={COLORS.gray[400]} />
                        </TouchableOpacity>
                    </View>
                    <View className="mb-4">
                        <FormLabel label="Financier Name" required />
                        <TouchableOpacity onPress={() => setShowFinancerModal(true)} className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between">
                            <Text className="text-gray-800 flex-1">{financer || 'Select Financier'}</Text>
                            <ChevronRight size={16} color={COLORS.gray[400]} />
                        </TouchableOpacity>
                    </View>
                    <View>
                        <FormLabel label="Financier Branch" />
                        <TextInput value={financierBranch} onChangeText={setFinancierBranch} placeholder="Financier Branch" className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800" />
                    </View>
                </View>
            )}

            {/* Company Assisted Loan */}
            {paymentMode === 'finance' && loanType === 'Company Assisted' && (
                <View className="border-2 border-gray-300 rounded-lg p-4 mb-4">
                    <Text className="text-base font-medium text-gray-700 mb-4">Financial Assistance Data</Text>
                    {[
                        { label: 'Down Payment', value: downPayment, setter: setDownPayment },
                        { label: 'Loan Amount', value: loanAmount, setter: setLoanAmount },
                        { label: 'EMI Amount', value: emiAmount, setter: setEmiAmount },
                        { label: 'Loan Disbursement Amount', value: loanDisbursementAmount, setter: setLoanDisbursementAmount },
                        { label: 'Showroom Finance Charges', value: showroomFinanceCharges, setter: setShowroomFinanceCharges },
                    ].map(({ label, value, setter }) => (
                        <View key={label} className="mb-4">
                            <FormLabel label={label} />
                            <View className="flex-row gap-2">
                                <View className="h-12 w-12 bg-gray-50 border border-gray-300 rounded-lg items-center justify-center"><Text className="text-gray-600">₹</Text></View>
                                <TextInput value={value} onChangeText={setter} placeholder="0" keyboardType="numeric" className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800" />
                            </View>
                        </View>
                    ))}
                    <View className="mb-4">
                        <FormLabel label="Tenure" />
                        <TouchableOpacity onPress={() => setShowTenureModal(true)} className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between">
                            <Text className="text-gray-800 flex-1">{tenure || 'Select Tenure'}</Text>
                            <ChevronRight size={16} color={COLORS.gray[400]} />
                        </TouchableOpacity>
                    </View>
                    <View className="mb-4">
                        <FormLabel label="EMI Date (Day)" />
                        <TouchableOpacity onPress={() => setShowEmiDayModal(true)} className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between">
                            <Text className="text-gray-800 flex-1">{emiDay || 'Select Day'}</Text>
                            <ChevronRight size={16} color={COLORS.gray[400]} />
                        </TouchableOpacity>
                    </View>
                    <View>
                        <FormLabel label="EMI Start Date" />
                        <View className="flex-row items-center">
                            <TextInput
                                value={emiStartDate}
                                onChangeText={setEmiStartDate}
                                placeholder="DD/MM/YYYY"
                                className="flex-1 h-12 bg-white border border-gray-300 rounded-l-lg px-3 text-gray-800"
                            />
                            <TouchableOpacity
                                onPress={() => setShowEmiStartDateModal(true)}
                                className="h-12 bg-teal-600 rounded-r-lg px-4 justify-center"
                            >
                                <Calendar size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Remarks */}
            <View className="mb-4">
                <FormLabel label="Remarks" />
                <TextInput value={remarks} onChangeText={setRemarksSync} multiline numberOfLines={4} textAlignVertical="top" placeholder="Remarks" className="h-24 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800" />
            </View>

            {/* Net Receivables */}
            <View>
                <FormLabel label="Net Receivables" />
                <View className="flex-row gap-2">
                    <View className="h-12 w-12 bg-gray-50 border border-gray-300 rounded-lg items-center justify-center"><Text className="text-gray-600">₹</Text></View>
                    <TextInput value={netReceivables} onChangeText={setNetReceivables} placeholder="0" keyboardType="numeric" className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800" />
                </View>
            </View>
        </View>
    );

    const handleGenerateOTP = async () => {
        setIsGeneratingOtp(true);
        try {
            const dataToGenerate = {
                link: generatedPDF || "https://example.com/mock-link",
                cname: customerFullName || "Customer",
                bkid: generatedCustomerId || "BKID",
                vname: model || "Vehicle",
                slex: salesOfficer || "Sales Officer",
                dlr: branch || "Branch",
            };
            const response = await generateBookingOTP(phone, dataToGenerate);
            if (response.data.code === 200) {
                setRefId(response.data.response.data.referenceId);
                toast.success("OTP sent to your mobile number");
            } else {
                toast.error(response.data.message || "Failed to generate OTP");
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Error generating OTP");
        } finally {
            setIsGeneratingOtp(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp) {
            toast.error("Please enter OTP");
            return;
        }
        setIsVerifyingOtp(true);
        try {
            const response = await verifyBookingOTP(refId.toString(), otp);
            if (response.data.code === 200) {
                if (response.data.response.data.isValid) {
                    toast.success("OTP Verified successfully");
                    setAuthStatus("Verified");
                    setDigitalAuthCompleted(true);
                    setVerifiedTime(new Date().toLocaleString());
                } else {
                    toast.error(response.data.message || "Invalid OTP");
                    setDigitalAuthCompleted(false);
                    setAuthStatus("Pending");
                }
            } else {
                toast.error(response.data.message || "Verification Failed");
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Error verifying OTP");
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const handleDownloadPdf = async () => {
        setIsDownloadingPdf(true);
        try {
            const response = await generateBookingPDF({}); // Mock empty payload
            if (response.data.code === 200) {
                const pdfLocation = response.data.response.data.Location;
                toast.success("PDF Downloaded successfully");
                setGeneratedPDF(pdfLocation);
            } else {
                toast.error("Download Failed");
            }
        } catch (error: any) {
            toast.error("Error downloading PDF");
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const handleUploadPdf = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            });
            if (result.canceled) {
                return;
            }

            setIsUploadingPdf(true);
            const file = result.assets[0];
            const formData = new FormData();
            formData.append("profile", {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'application/pdf',
            } as any);
            formData.append("master", "Transaction Master");
            formData.append("module", "Booking");
            formData.append("id", route.params?.customerId || "0");

            const response = await uploadBookingDocument(formData);
            if (response.data.code === 200) {
                toast.success("File Uploaded Successfully");
                setAuthStatus("Verified");
                setVerifiedTime(new Date().toLocaleString());
            } else {
                toast.error("Upload failed");
            }
        } catch (error: any) {
            toast.error("Error uploading file");
        } finally {
            setIsUploadingPdf(false);
        }
    };

    const renderAuthSection = () => (
        <View>
            <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                Customer Authentication
            </Text>

            {/* Digital Authentication */}
            <View className="mb-6">
                <Text className="text-gray-800 font-semibold mb-3 border-b border-gray-100 pb-2">Digital Authentication</Text>

                <View className="mb-4">
                    <FormLabel label="Registered Phone Number" />
                    <View className="flex-row items-center gap-2">
                        <TextInput
                            value={phone}
                            editable={false}
                            className="flex-1 h-12 bg-gray-50 border border-gray-300 rounded-lg px-3 text-gray-500"
                        />
                        <View className="w-32">
                            <Button
                                title={isGeneratingOtp ? "Sending..." : "Generate OTP"}
                                onPress={handleGenerateOTP}
                                disabled={isGeneratingOtp || authStatus === 'Verified'}
                            />
                        </View>
                    </View>
                </View>

                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-gray-600 font-medium">Authentication Status:</Text>
                    <View className={\`px-3 py-1 rounded-full \${authStatus === 'Verified' ? 'bg-green-100' : 'bg-orange-100'}\`}>
                    <Text className={\`text-sm font-semibold \${authStatus === 'Verified' ? 'text-green-700' : 'text-orange-700'}\`}>
                    {authStatus}
                </Text>
            </View>
        </View>

                {
        refId !== 0 && authStatus === 'Pending' && (
            <View className="mb-4">
                <FormLabel label="Enter OTP" />
                <View className="flex-row items-center gap-2">
                    <TextInput
                        value={otp}
                        onChangeText={(text) => setOtp(formatValue(text, 'onlyNo'))}
                        placeholder="Enter OTP"
                        keyboardType="number-pad"
                        className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                    />
                    <View className="w-32">
                        <Button
                            title={isVerifyingOtp ? "Verifying..." : "Verify"}
                            onPress={handleVerifyOTP}
                            disabled={isVerifyingOtp}
                        />
                    </View>
                </View>
            </View>
        )
    }
            </View >

        <View className="h-0.5 bg-gray-100 my-4" />

    {/* Manual Authentication */ }
    <View className="mb-4">
        <Text className="text-gray-800 font-semibold mb-3 border-b border-gray-100 pb-2">Manual Authentication</Text>

        <View className="flex-row gap-4">
            <View className="flex-1">
                <FormLabel label="Download Booking Form" />
                <Button
                    title={isDownloadingPdf ? "Downloading..." : "Download"}
                    variant="outline"
                    onPress={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    icon={<DownloadCloud size={18} color={COLORS.teal[600]} />}
                />
            </View>

            <View className="flex-1">
                <FormLabel label="Upload Booking Form" />
                <Button
                    title={isUploadingPdf ? "Uploading..." : "Upload "}
                    variant="outline"
                    onPress={handleUploadPdf}
                    disabled={isUploadingPdf || authStatus === 'Verified'}
                    icon={<UploadCloud size={18} color={authStatus === 'Verified' ? COLORS.gray[400] : COLORS.teal[600]} />}
                />
            </View>
        </View>
    </View>

    {
        verifiedTime && (
            <View className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <Text className="text-green-800 font-medium text-center">
                    Verified at: {verifiedTime}
                </Text>
            </View>
        )
    }
        </View >
    );

    // ── Calendar Modal (DOB) ─────────────────────────────────────────────────--
    const renderCalendarModal = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const days = Array.from({ length: 31 }, (_, i) => i + 1);
        const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

        return (
            <Modal visible={showCalendarModal} transparent animationType="fade" onRequestClose={() => setShowCalendarModal(false)}>
                <View className="flex-1 bg-black/40 items-center justify-center px-4">
                    <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
                        {/* Header */}
                        <View className="bg-teal-600 px-5 py-4">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-white font-semibold text-lg">Select Date of Birth</Text>
                                <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                                    <X size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                            {/* Breadcrumb */}
                            <View className="flex-row gap-2 mt-3">
                                <TouchableOpacity onPress={() => setDobCalendarStep('year')} className={`px-3 py-1 rounded ${dobCalendarStep === 'year' ? 'bg-white/20' : ''}`}>
                                    <Text className={`text-sm ${dobCalendarStep === 'year' ? 'text-white font-medium' : 'text-white/70'}`}>Year</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setDobCalendarStep('month')} className={`px-3 py-1 rounded ${dobCalendarStep === 'month' ? 'bg-white/20' : ''}`}>
                                    <Text className={`text-sm ${dobCalendarStep === 'month' ? 'text-white font-medium' : 'text-white/70'}`}>Month</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setDobCalendarStep('day')} className={`px-3 py-1 rounded ${dobCalendarStep === 'day' ? 'bg-white/20' : ''}`}>
                                    <Text className={`text-sm ${dobCalendarStep === 'day' ? 'text-white font-medium' : 'text-white/70'}`}>Day</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Content */}
                        <View className="p-5 max-h-80">
                            {dobCalendarStep === 'year' && (
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    <View className="flex-row flex-wrap gap-2">
                                        {years.map(year => (
                                            <TouchableOpacity
                                                key={year}
                                                onPress={() => { setDobPickYear(year); setDobCalendarStep('month'); }}
                                                className={`w-20 h-12 rounded-lg items-center justify-center ${year === dobPickYear ? 'bg-teal-600' : 'bg-gray-100'}`}
                                            >
                                                <Text className={`font-medium ${year === dobPickYear ? 'text-white' : 'text-gray-700'}`}>{year}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            )}
                            {dobCalendarStep === 'month' && (
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    <View className="flex-row flex-wrap gap-2">
                                        {months.map((month, idx) => (
                                            <TouchableOpacity
                                                key={month}
                                                onPress={() => { setDobPickMonth(idx); setDobCalendarStep('day'); }}
                                                className={`w-20 h-12 rounded-lg items-center justify-center ${idx === dobPickMonth ? 'bg-teal-600' : 'bg-gray-100'}`}
                                            >
                                                <Text className={`font-medium ${idx === dobPickMonth ? 'text-white' : 'text-gray-700'}`}>{month}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            )}
                            {dobCalendarStep === 'day' && (
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    <View className="flex-row flex-wrap gap-2">
                                        {days.map(day => (
                                            <TouchableOpacity
                                                key={day}
                                                onPress={() => {
                                                    const selectedDate = `${day.toString().padStart(2, '0')}/${(dobPickMonth + 1).toString().padStart(2, '0')}/${dobPickYear}`;
                                                    setDobSync(selectedDate);
                                                    setShowCalendarModal(false);
                                                    setDobCalendarStep('year');
                                                }}
                                                className={`w-14 h-12 rounded-lg items-center justify-center ${day === 1 ? 'bg-teal-600' : 'bg-gray-100'}`}
                                            >
                                                <Text className={`font-medium ${day === 1 ? 'text-white' : 'text-gray-700'}`}>{day}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            )}
                        </View>

                        {/* Footer */}
                        <View className="bg-gray-50 px-5 py-3 flex-row justify-between">
                            {dobCalendarStep !== 'year' ? (
                                <TouchableOpacity onPress={() => setDobCalendarStep('year')} className="px-3 py-2">
                                    <Text className="text-teal-700 font-semibold">Back</Text>
                                </TouchableOpacity>
                            ) : <View />}
                            <TouchableOpacity onPress={() => setShowCalendarModal(false)} className="px-5 py-2 rounded-lg bg-teal-600">
                                <Text className="text-white font-semibold">Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    // ── Dropdown Modals ─────────────────────────────────────────────────────--
    const renderDropdownModals = () => (
        <View>
            {/* Branch Modal */}
            {showBranchModal && (
                <Modal visible={showBranchModal} transparent animationType="fade" onRequestClose={() => setShowBranchModal(false)}>
                    <View className="flex-1 bg-black/40 items-center justify-center px-4">
                        <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '70%' }}>
                            <View className="p-4 border-b border-gray-200">
                                <View className="flex-row justify-between items-center mb-3">
                                    <Text className="text-lg font-semibold text-gray-800">Select Branch</Text>
                                    <TouchableOpacity onPress={() => setShowBranchModal(false)}>
                                        <X size={20} color={COLORS.gray[600]} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <ScrollView className="max-h-80">
                                {branches.map((branch) => (
                                    <TouchableOpacity key={branch.id} onPress={() => { setBranch(branch.name); setShowBranchModal(false); }} className="p-4 border-b border-gray-100">
                                        <Text className="text-gray-800 font-medium">{branch.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TouchableOpacity onPress={() => setShowBranchModal(false)} className="p-3 border-t border-gray-200">
                                <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

            {/* Country Modal */}
            {showCountryModal && (
                <Modal visible={showCountryModal} transparent animationType="fade" onRequestClose={() => setShowCountryModal(false)}>
                    <View className="flex-1 bg-black/40 items-center justify-center px-4">
                        <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '70%' }}>
                            <View className="p-4 border-b border-gray-200">
                                <View className="flex-row justify-between items-center mb-3">
                                    <Text className="text-lg font-semibold text-gray-800">Select Country</Text>
                                    <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                                        <X size={20} color={COLORS.gray[600]} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <ScrollView className="max-h-80">
                                {countries.map((country) => (
                                    <TouchableOpacity key={country.id} onPress={() => { setCountry(country.name); setShowCountryModal(false); }} className="p-4 border-b border-gray-100">
                                        <Text className="text-gray-800 font-medium">{country.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TouchableOpacity onPress={() => setShowCountryModal(false)} className="p-3 border-t border-gray-200">
                                <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

            {/* State Modal */}
            {showStateModal && (
                <Modal visible={showStateModal} transparent animationType="fade" onRequestClose={() => setShowStateModal(false)}>
                    <View className="flex-1 bg-black/40 items-center justify-center px-4">
                        <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '70%' }}>
                            <View className="p-4 border-b border-gray-200">
                                <View className="flex-row justify-between items-center mb-3">
                                    <Text className="text-lg font-semibold text-gray-800">Select State</Text>
                                    <TouchableOpacity onPress={() => setShowStateModal(false)}>
                                        <X size={20} color={COLORS.gray[600]} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <ScrollView className="max-h-80">
                                {states.map((state) => (
                                    <TouchableOpacity key={state.id} onPress={() => { setStateVal(state.name); setShowStateModal(false); }} className="p-4 border-b border-gray-100">
                                        <Text className="text-gray-800 font-medium">{state.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TouchableOpacity onPress={() => setShowStateModal(false)} className="p-3 border-t border-gray-200">
                                <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

            {/* City Modal */}
            {showCityModal && (
                <Modal visible={showCityModal} transparent animationType="fade" onRequestClose={() => setShowCityModal(false)}>
                    <View className="flex-1 bg-black/40 items-center justify-center px-4">
                        <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '70%' }}>
                            <View className="p-4 border-b border-gray-200">
                                <View className="flex-row justify-between items-center mb-3">
                                    <Text className="text-lg font-semibold text-gray-800">Select City</Text>
                                    <TouchableOpacity onPress={() => setShowCityModal(false)}>
                                        <X size={20} color={COLORS.gray[600]} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <ScrollView className="max-h-80">
                                {cities.map((city) => (
                                    <TouchableOpacity key={city.id} onPress={() => { setCity(city.name); setShowCityModal(false); }} className="p-4 border-b border-gray-100">
                                        <Text className="text-gray-800 font-medium">{city.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TouchableOpacity onPress={() => setShowCityModal(false)} className="p-3 border-t border-gray-200">
                                <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

            {/* Add other modals similarly... */}
        </View>
    );

    // ── Main Render ─────────────────────────────────────────────────────────--
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <HeaderWithBack
                title="Confirm Booking"
                onBackPress={handleClose}
            />

            {/* Customer Id Section */}
            <View className="bg-white border-b border-gray-100 px-4 py-3">
                <View className="rounded-xl border border-gray-100 bg-white px-4 py-3">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-xs text-gray-500">Customer ID</Text>
                        <Text className="text-sm font-semibold text-gray-900">{customerId || '---'}</Text>
                    </View>
                </View>
            </View>

            {/* Tabs */}
            <View className="bg-white border-b border-gray-100">
                <View className="flex-row items-center justify-between px-4 py-3">
                    {TAB_KEYS.map((key, index) => {
                        const isActive = activeTab === key;
                        return (
                            <React.Fragment key={key}>
                                <TouchableOpacity
                                    onPress={() => setActiveTab(key)}
                                    className="items-center px-2"
                                >
                                    <Text className={`text-sm ${isActive ? 'text-teal-700 font-semibold' : 'text-gray-500'}`}>
                                        {TAB_LABELS[index]}
                                    </Text>
                                    <View className={`mt-2 h-0.5 w-14 ${isActive ? 'bg-teal-600' : 'bg-transparent'}`} />
                                </TouchableOpacity>
                                {index < TAB_KEYS.length - 1 && (
                                    <ChevronRight size={16} color="#cbd5e1" />
                                )}
                            </React.Fragment>
                        );
                    })}
                </View>
            </View>

            {/* Content */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <View className="bg-white rounded-xl border border-gray-100 p-4 m-4">
                        {activeTab === 'customer' && renderCustomerSection()}
                        {activeTab === 'vehicle' && renderVehicleSection()}
                        {activeTab === 'payment' && renderPaymentSection()}
                        {activeTab === 'auth' && renderAuthSection()}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer */}
            <View className="bg-white border-t border-gray-100 p-4 flex-row gap-3">
                {activeTab === 'customer' ? (
                    <>
                        <Button title="Cancel" variant="outline" className="flex-1" onPress={handleClose} />
                        <Button title="Next" className="flex-1" onPress={handleNext} />
                    </>
                ) : activeTab === 'vehicle' ? (
                    <>
                        <Button title="Back" variant="outline" className="flex-1" onPress={handleBack} />
                        <Button title="Next" className="flex-1" onPress={handleNext} />
                    </>
                ) : activeTab === 'payment' ? (
                    <>
                        <Button title="Back" variant="outline" className="flex-1" onPress={handleBack} />
                        <Button title="Next" className="flex-1" onPress={handleNext} />
                    </>
                ) : (
                    <>
                        <Button title="Back" variant="outline" className="flex-1" onPress={handleBack} />
                        <Button title="Save & Complete" className="flex-1" onPress={handleSaveComplete} />
                    </>
                )}
            </View>

            {/* Modals */}
            {renderCalendarModal()}
            {renderDropdownModals()}
        </SafeAreaView>
    );
}
