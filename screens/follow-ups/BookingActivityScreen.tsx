

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, FlatList, DeviceEventEmitter } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { ENDPOINT } from '../../src/api';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import AttachQuotationModal from '../../components/AttachQuotationModal';
import AccessoryModal from '../../components/AccessoryModal';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton, HeaderWithBack, useBackButton, backNavigationHelpers } from '../../components/ui/BackButton';
import {
    getBranches,
    getUsers,
    getManufacturersByBranch,
    getVehicleModelsByManufacturer,
    getRtoOptions,
    getCountries,
    getStates,
    getCities,
    getReferredCustomers,
    generateCustomerId,
    getVehicleAccessories,
    getCustomerByPhoneNo,
    getCurrentUser,
    generateBookingId,
    generateEReceiptId,
    createBooking,
    updateBooking,
    getQuotationById,
    updateQuotationStatus
} from '../../src/api';
import platformApi from '../../src/api';
import { useToast } from '../../src/ToastContext';
import { StackNavigationProp } from '@react-navigation/stack';

// ─── Custom Modal ────────────────────────────────────────────────────────────
const CustomModal = ({
    visible,
    children,
    onClose,
}: {
    visible: boolean;
    children: React.ReactNode;
    onClose: () => void;
}) => {
    if (!visible) return null;
    return (
        <View className="absolute inset-0 z-50 flex-1">
            <View className="flex-1 bg-black/50 justify-center">
                <View className="bg-white rounded-xl m-4 max-h-96">{children}</View>
            </View>
        </View>
    );
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface Accessory {
    id: string;
    partName: string;
    partNumber: string;
    mrp: number;
    quantity: number;
    discount: number;
    isPercent: boolean;
    priceBeforeDiscount: number;
    priceAfterDiscount: number;
    isSelected: boolean;
    arrayId?: string;
    new?: boolean;
}

type BookingActivityRouteProp = RouteProp<RootStackParamList, 'BookingActivity'>;
type BookingActivityNavigationProp = StackNavigationProp<RootStackParamList, 'BookingActivity'>;

const FormLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
    <Text className="text-sm text-gray-600 mb-1 font-medium">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
    </Text>
);

// ─── Component ───────────────────────────────────────────────────────────────
export default function BookingActivityScreen({
    navigation,
    route,
}: {
    navigation: BookingActivityNavigationProp;
    route: BookingActivityRouteProp;
}) {
    const { isAdvancedBooking = false, isConfirmBooking = false, customerId, customerName, customerPhone } = route.params || {};

    // Safe mode detection - preserves current behavior as default
    const getBookingMode = () => {
        if (isConfirmBooking) return 'ConfirmBooking';
        if (isAdvancedBooking) return 'AdvancedBooking';  
        return 'NormalBooking'; // Default - preserves current behavior
    };

    const bookingMode = getBookingMode();

    const toast = useToast();
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);
    const vehicleSectionRef = useRef<View>(null);

    // Determine the back navigation target based on how we got here
    const getBackNavigationTarget = () => {
        // Always navigate to FollowUpDetail when cancelling
        // Use the available phone number (customerPhone from route params or current phone state)
        const phoneForFollowUp = customerPhone || phone || '';
        
        if (phoneForFollowUp) {
            console.log('🔍 Navigating to FollowUpDetail with phone:', phoneForFollowUp);
            return { screen: 'FollowUpDetail' as const, params: { id: phoneForFollowUp }, useGoBack: false };
        } else {
            // Fallback to FollowUps if no phone number is available
            console.log('🔍 No phone number available, navigating to FollowUps');
            return { screen: 'FollowUps' as const, params: undefined, useGoBack: false };
        }
    };

    // Use the custom back button hook
    useBackButton({
        onBackPress: () => {
            const target = getBackNavigationTarget();
            console.log(`🔍 Closing BookingActivity, navigating to ${target.screen}`);
            
            if (target.useGoBack) {
                navigation.goBack();
            } else if (target.params) {
                navigation.navigate(target.screen, target.params);
            } else {
                navigation.navigate(target.screen);
            }
        },
        showConfirmation: false // Change to true if you want confirmation dialog
    });

    // ── Vehicle-selection protection refs ──────────────────────────────────
    const dataLoadedRef = useRef(false);
    const isVehicleSelectionInProgressRef = useRef(false);
    const hasEverSelectedVehicleRef = useRef(false);
    const processedVehicleRef = useRef<string | null>(null); // Track processed vehicle ID

    // ── Payload-critical field refs (always in sync, no stale-closure risk) ─
    const customerFullNameRef   = useRef(customerName ? String(customerName) : '');
    const phoneRef              = useRef(customerPhone ? String(customerPhone) : '');
    const fatherNameRef         = useRef('');
    const addressRef            = useRef('');
    const address2Ref           = useRef('');
    const address3Ref           = useRef('');
    const localityRef           = useRef('');
    const pincodeRef            = useRef('');
    const countryRef            = useRef('');
    const stateValRef           = useRef('');
    const cityRef               = useRef('');
    const customerGenderRef     = useRef('Male');
    const emailRef              = useRef('');
    const dobRef                = useRef('');
    const ageRef                = useRef('');
    const salesOfficerRef       = useRef('');
    const quotationsRef         = useRef('');
    const remarksRef            = useRef('');
    const expectedDeliveryRef   = useRef('');
    const nomineeRef            = useRef('');
    const nomineeAgeRef         = useRef('');
    const relationshipRef       = useRef('');
    const referredByRef         = useRef<any>(null);
    const paymentModeRef        = useRef('cash');
    const customerDataRef       = useRef<any>(null);
    const customerFetchedRef    = useRef(false); // prevent re-fetching on focus regain

    // ── UI State ───────────────────────────────────────────────────────────
    const [dataLoaded, setDataLoaded]                               = useState(false);
    const [isVehicleSelectionInProgress, setIsVehicleSelectionInProgress] = useState(false);
    const [hasEverSelectedVehicle, setHasEverSelectedVehicle]       = useState(false);
    const [activeTab, setActiveTab]                                 = useState<'customer' | 'vehicle' | 'payment' | 'auth'>('customer');
    const [registeredPhone, setRegisteredPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [authStatus, setAuthStatus] = useState('Pending');

    // ── Customer fields ────────────────────────────────────────────────────
    const [branch, setBranch]                     = useState('');
    const [phone, setPhone]                       = useState(customerPhone ? String(customerPhone) : '');
    const [customerFullName, setCustomerFullName] = useState(customerName ? String(customerName) : '');
    const [fatherName, setFatherName]             = useState('');
    const [address, setAddress]                   = useState('');
    const [address2, setAddress2]                 = useState('');
    const [address3, setAddress3]                 = useState('');
    const [locality, setLocality]                 = useState('');
    const [country, setCountry]                   = useState('');
    const [stateVal, setStateVal]                 = useState('');
    const [city, setCity]                         = useState('');
    const [pincode, setPincode]                   = useState('');
    const [email, setEmail]                       = useState('');
    const [dob, setDob]                           = useState('');
    const [age, setAge]                           = useState('');
    const [referredBy, setReferredBy]             = useState('');
    const [relationship, setRelationship]         = useState('');
    const [nominee, setNominee]                   = useState('');
    const [nomineeAge, setNomineeAge]             = useState('');
    const [salesOfficer, setSalesOfficer]         = useState('');
    const [quotationsAssociated, setQuotationsAssociated] = useState('');
    const [customerGender, setCustomerGender]     = useState('Male');
    const [customerDob, setCustomerDob]           = useState('');
    const [generatedCustomerId, setGeneratedCustomerId] = useState('');
    const [customerData, setCustomerData]         = useState<any>(null);

    const [selectedFinancerId, setSelectedFinancerId]             = useState('');

    // ── Dropdown data ──────────────────────────────────────────────────────
    const [countries, setCountries]               = useState<any[]>([]);
    const [states, setStates]                     = useState<any[]>([]);
    const [cities, setCities]                     = useState<any[]>([]);
    const [rtos, setRtos]                         = useState<any[]>([]);
    const [manufacturers, setManufacturers]       = useState<any[]>([]);
    const [models, setModels]                     = useState<any[]>([]);
    const [colors, setColors]                     = useState<any[]>([]);
    const [salesOfficers, setSalesOfficers]       = useState<any[]>([]);
    const [referredByOptions, setReferredByOptions] = useState<any[]>([]);
    const [relationshipOptions, setRelationshipOptions] = useState<any[]>([]);
    const [branches, setBranches]                 = useState<any[]>([]);
    const [selectedBranchObj, setSelectedBranchObj] = useState<any>(null);
    const [selectedVehicleObj, setSelectedVehicleObj] = useState<any>(null);

    // ── Vehicle fields ─────────────────────────────────────────────────────
    const [manufacturer, setManufacturer] = useState('India Yamaha Motors Private Limited');
    const [model, setModel]               = useState('');
    const currentModelRef = useRef(model);
    const [rto, setRto]                   = useState('');
    const [vehicleColor, setVehicleColor] = useState('');
    const [accessories, setAccessories]   = useState<Accessory[]>([]);
    const [totalDiscount, setTotalDiscount]           = useState('');
    const [accessoriesTotal, setAccessoriesTotal]     = useState('');
    const [accessoriesAfterDiscount, setAccessoriesAfterDiscount] = useState('');
    const [exchangeModel, setExchangeModel]           = useState('');
    const [exchangePrice, setExchangePrice]           = useState('');
    const [onRoadPrice, setOnRoadPrice]               = useState('');
    const [tempRegCharges, setTempRegCharges]         = useState('');
    const [hypothecationCharges, setHypothecationCharges] = useState('');
    const [numberPlateCharges, setNumberPlateCharges] = useState('');
    const [affidavitAmount, setAffidavitAmount]       = useState('');
    const [specialNoCharges, setSpecialNoCharges]     = useState('');
    const [onRoadDiscount, setOnRoadDiscount]         = useState('');
    const [finalAmount, setFinalAmount]               = useState('');
    const [showroomPrice, setShowroomPrice]           = useState('');
    const [insuranceAmount, setInsuranceAmount]       = useState('');
    const [roadTax, setRoadTax]                       = useState('');
    const [warrantyPrice, setWarrantyPrice]           = useState('');
    const [registrationFee, setRegistrationFee]       = useState('');
    const [handlingCharges, setHandlingCharges]       = useState('');
    const [insuranceType, setInsuranceType]           = useState('');
    const [expectedDelivery, setExpectedDelivery]     = useState('');

    // ── Payment fields ─────────────────────────────────────────────────────
    const [paymentMode, setPaymentMode]               = useState('cash');
    const [financer, setFinancer]                     = useState('');
    const [loanType, setLoanType]                     = useState('');
    const [financierBranch, setFinancierBranch]       = useState('');
    const [paymentHypothecation, setPaymentHypothecation] = useState<boolean>(false);
    const [remarks, setRemarks]                       = useState('');
    const [netReceivables, setNetReceivables]         = useState('');
    const [downPayment, setDownPayment]               = useState('');
    const [tenure, setTenure]                         = useState('');
    const [loanAmount, setLoanAmount]                 = useState('');
    const [emiAmount, setEmiAmount]                   = useState('');
    const [emiDay, setEmiDay]                         = useState('');
    const [emiStartDate, setEmiStartDate]             = useState('');
    const [loanDisbursementAmount, setLoanDisbursementAmount] = useState('');
    const [showroomFinanceCharges, setShowroomFinanceCharges] = useState('');

    // ── Modal visibility ───────────────────────────────────────────────────
    const [showBranchModal, setShowBranchModal]                   = useState(false);
    const [showAccessoryModal, setShowAccessoryModal]             = useState(false);
    const [showInsuranceTypeModal, setShowInsuranceTypeModal]     = useState(false);
    const [showCountryModal, setShowCountryModal]                 = useState(false);
    const [showStateModal, setShowStateModal]                     = useState(false);
    const [showCityModal, setShowCityModal]                       = useState(false);
    const [showRtoModal, setShowRtoModal]                         = useState(false);
    const [showManufacturerModal, setShowManufacturerModal]       = useState(false);
    const [showModelModal, setShowModelModal]                     = useState(false);
    const [showColorModal, setShowColorModal]                     = useState(false);
    const [showSalesOfficerModal, setShowSalesOfficerModal]       = useState(false);
    const [showReferredByModal, setShowReferredByModal]           = useState(false);
    const [showRelationshipModal, setShowRelationshipModal]       = useState(false);
    const [showAttachQuotationModal, setShowAttachQuotationModal] = useState(false);
    const [showCalendarModal, setShowCalendarModal]               = useState(false);
    const [showExpectedDeliveryModal, setShowExpectedDeliveryModal] = useState(false);
    const [showLoanTypeModal, setShowLoanTypeModal]               = useState(false);
    const [showTenureModal, setShowTenureModal]                   = useState(false);
    const [showEmiDayModal, setShowEmiDayModal]                   = useState(false);
    const [showFinancerModal, setShowFinancerModal]               = useState(false);
    const [showEmiStartDateModal, setShowEmiStartDateModal]       = useState(false);
    const [financerOptions, setFinancerOptions]                   = useState<any[]>([]);
    const [selectedDate, setSelectedDate]                         = useState(new Date());
    const [dobCalendarStep, setDobCalendarStep]                   = useState<'year' | 'month' | 'day'>('year');
    const [dobPickYear, setDobPickYear]                           = useState(new Date().getFullYear());
    const [dobPickMonth, setDobPickMonth]                         = useState(new Date().getMonth());

    // ── Validation errors ──────────────────────────────────────────────────
    const [nameError, setNameError]               = useState('');
    const [phoneError, setPhoneError]             = useState('');
    const [salesOfficerError, setSalesOfficerError] = useState('');
    const [addressError, setAddressError]         = useState('');
    const [localityError, setLocalityError]       = useState('');
    const [pincodeError, setPincodeError]         = useState('');
    const [modelError, setModelError]             = useState('');

    // ─────────────────────────────────────────────────────────────────────
    // Derived booleans
    // ─────────────────────────────────────────────────────────────────────
    const isExpectedDeliverySelected = Boolean(
        expectedDelivery && expectedDelivery.length > 0 && expectedDelivery !== 'DD/MM/YYYY'
    );
    const isModelSelected = Boolean(model && model.trim() !== '' && model !== 'Select Model Name');

    // ─────────────────────────────────────────────────────────────────────
    // Ref sync helpers — set both state (UI) and ref (payload) atomically
    // ─────────────────────────────────────────────────────────────────────
    const setCustomerFullNameSync = (v: string) => { customerFullNameRef.current = v; setCustomerFullName(v); };
    const setPhoneSync            = (v: string) => { phoneRef.current = v; setPhone(v); };
    const setFatherNameSync       = (v: string) => { fatherNameRef.current = v; setFatherName(v); };
    const setAddressSync          = (v: string) => { addressRef.current = v; setAddress(v); };
    const setAddress2Sync         = (v: string) => { address2Ref.current = v; setAddress2(v); };
    const setAddress3Sync         = (v: string) => { address3Ref.current = v; setAddress3(v); };
    const setLocalitySync         = (v: string) => { localityRef.current = v; setLocality(v); };
    const setPincodeSync          = (v: string) => { pincodeRef.current = v; setPincode(v); };
    const setCountrySync          = (v: string) => { countryRef.current = v; setCountry(v); };
    const setStateValSync         = (v: string) => { stateValRef.current = v; setStateVal(v); };
    const setCitySync             = (v: string) => { cityRef.current = v; setCity(v); };
    const setCustomerGenderSync   = (v: string) => { customerGenderRef.current = v; setCustomerGender(v); };
    const setEmailSync            = (v: string) => { emailRef.current = v; setEmail(v); };
    const setDobSync              = (v: string) => { dobRef.current = v; setDob(v); };
    const setAgeSync              = (v: string) => { ageRef.current = v; setAge(v); };
    const setSalesOfficerSync     = (v: string) => { salesOfficerRef.current = v; setSalesOfficer(v); };
    const setQuotationsSync       = (v: string) => { quotationsRef.current = v; setQuotationsAssociated(v); };
    const setRemarksSync          = (v: string) => { remarksRef.current = v; setRemarks(v); };
    const setExpectedDeliverySync = (v: string) => { expectedDeliveryRef.current = v; setExpectedDelivery(v); };
    const setNomineeSync          = (v: string) => { nomineeRef.current = v; setNominee(v); };
    const setNomineeAgeSync       = (v: string) => { nomineeAgeRef.current = v; setNomineeAge(v); };
    const setRelationshipSync     = (v: string) => { relationshipRef.current = v; setRelationship(v); };
    const setReferredBySync       = (v: any) => { referredByRef.current = v; setReferredBy(v && (v.name || v.display) ? v.name || v.display : v); };
    const setPaymentModeSync      = (v: string) => { paymentModeRef.current = v; setPaymentMode(v); };

    // ─────────────────────────────────────────────────────────────────────
    // Net receivables recalculation
    // ─────────────────────────────────────────────────────────────────────
    useEffect(() => {
        const base = (parseFloat(finalAmount) || 0) - (parseFloat(exchangePrice) || 0);
        let net = 0;
        if (paymentMode === 'cash') {
            net = base;
        } else if (paymentMode === 'finance') {
            net = paymentHypothecation && loanType !== 'Self' ? 0 : base;
        }
        setNetReceivables(net.toString());
    }, [finalAmount, exchangePrice, paymentMode, paymentHypothecation, loanType]);

    // ─────────────────────────────────────────────────────────────────────
    // Vehicle-selection protection ref sync
    // ─────────────────────────────────────────────────────────────────────
    useEffect(() => { dataLoadedRef.current = dataLoaded; }, [dataLoaded]);
    useEffect(() => { isVehicleSelectionInProgressRef.current = isVehicleSelectionInProgress; }, [isVehicleSelectionInProgress]);
    useEffect(() => { hasEverSelectedVehicleRef.current = hasEverSelectedVehicle; }, [hasEverSelectedVehicle]);
    useEffect(() => { currentModelRef.current = model; }, [model]);

    // ─────────────────────────────────────────────────────────────────────
    // Data fetching
    // ─────────────────────────────────────────────────────────────────────
    const fetchCountries = async () => {
        try {
            const response = await getCountries();
            if (response.data.code === 200 && response.data.data) {
                const india = response.data.data.find((c: any) => c.name === 'India');
                if (india) {
                    setCountries([india]);
                    setCountrySync('India');
                    fetchStates(india.id);
                } else {
                    setCountries([{ id: '1', name: 'India' }]);
                    setCountrySync('India');
                    fetchStates('1');
                }
            } else {
                setCountries([{ id: '1', name: 'India' }]);
                setCountrySync('India');
                fetchStates('1');
            }
        } catch {
            setCountries([{ id: '1', name: 'India' }]);
            setCountrySync('India');
            fetchStates('1');
        }
    };

    const fetchStates = async (countryId: string) => {
        try {
            const response = await getStates(countryId);
            setStates(response.data.code === 200 && response.data.data ? response.data.data : []);
        } catch {
            setStates([]);
        }
    };

    const fetchCities = async (stateId: string) => {
        try {
            const response = await getCities(stateId);
            setCities(response.data.code === 200 && response.data.data ? response.data.data : []);
        } catch {
            setCities([]);
        }
    };

    const fetchRtos = async () => {
        const fallback = [
            { id: '1', code: 'KA-01', area: 'Bangalore Central' },
            { id: '2', code: 'KA-02', area: 'Bangalore North' },
            { id: '3', code: 'KA-03', area: 'Bangalore South' },
            { id: '4', code: 'KA-04', area: 'Bangalore East' },
            { id: '5', code: 'KA-05', area: 'Bangalore West' },
        ];
        try {
            const response = await getRtoOptions();
            const data = response.data;
            setRtos(data?.code === 200 && Array.isArray(data.response) ? data.response : fallback);
        } catch {
            setRtos(fallback);
        }
    };

    const fetchManufacturers = async () => {
        const list = [{ id: 'ck8g6k0a249el0880cmkbpizm', name: 'India Yamaha Motors Private Limited' }];
        setManufacturers(list);
        setManufacturer('India Yamaha Motors Private Limited');
        fetchModels('ck8g6k0a249el0880cmkbpizm');
    };

    const fetchModels = async (manufacturerId: string) => {
        const mockModels = [
            { id: '1', modelCode: 'FZ-S FI V4', modelName: 'FZ-S FI V4' },
            { id: '2', modelCode: 'FZ-X', modelName: 'FZ-X' },
            { id: '3', modelCode: 'Ray ZR 125 Fi', modelName: 'Ray ZR 125 Fi' },
            { id: '4', modelCode: 'MT-15', modelName: 'MT-15' },
            { id: '5', modelCode: 'R15 V4', modelName: 'R15 V4' },
        ];
        try {
            const response = await getVehicleModelsByManufacturer(`${manufacturerId}?onlyAvailable=1`);
            const data = response.data;
            let list: any[] = [];
            if (data?.code === 200) {
                list = data.response?.code === 200
                    ? data.response.data || []
                    : Array.isArray(data.response) ? data.response : data.data || [];
            }
            const finalList = list.length > 0 ? list : mockModels;
            setModels(finalList);

            const hasValidModel =
                currentModelRef.current &&
                currentModelRef.current.trim() !== '' &&
                currentModelRef.current !== 'Select Model Name';
            const shouldPreserve =
                dataLoadedRef.current ||
                isVehicleSelectionInProgressRef.current ||
                hasEverSelectedVehicleRef.current ||
                hasValidModel;
            if (!shouldPreserve) setModel('');
        } catch {
            setModels(mockModels);
            const hasValidModel = currentModelRef.current && currentModelRef.current.trim() !== '';
            if (!dataLoadedRef.current && !hasValidModel) setModel('');
        }
    };

    const fetchSalesOfficers = async (branchId: string = '1') => {
        try {
            const response = await getUsers({ branch: branchId, role: 'sales_executive' });
            const users = response.data?.response?.data?.users;
            setSalesOfficers(Array.isArray(users) ? users : []);
        } catch {
            setSalesOfficers([]);
        }
    };

    const fetchReferredByOptions = async (searchString: string = '') => {
        try {
            const column = searchString && !isNaN(Number(searchString)) ? 'phone' : 'name';
            const response = await platformApi.post('/api/options/get/', {
                module: 'customers',
                column,
                searchString,
                fields: ['contacts{phone}'],
                searchColumns: ['contacts'],
                size: 20,
                page: 1,
            });
            if (response.data.code === 200 && response.data.response) {
                const list = Array.isArray(response.data.response) ? response.data.response : response.data.data || [];
                setReferredByOptions(
                    list.map((emp: any) => ({
                        id: emp.id,
                        name: emp.name,
                        phone: emp.contacts?.[0]?.phone || '',
                        display: emp.contacts?.[0]?.phone
                            ? `${emp.contacts[0].phone} - ${emp.name}`
                            : emp.name,
                    }))
                );
            } else {
                setReferredByOptions([]);
            }
        } catch {
            setReferredByOptions([]);
        }
    };

    const fetchFinancerOptions = async () => {
        try {
            const response = await platformApi.get('/api/financer');
            const data = response.data;
            if (data.code === 200) {
                const list = data.response?.code === 200
                    ? data.response.data || []
                    : Array.isArray(data.response) ? data.response : data.data || [];
                setFinancerOptions(list);
            } else {
                setFinancerOptions([]);
            }
        } catch {
            setFinancerOptions([]);
        }
    };

    const fetchRelationshipOptions = async () => {
        setRelationshipOptions([
            { id: '1', name: 'Father' }, { id: '2', name: 'Mother' },
            { id: '3', name: 'Brother' }, { id: '4', name: 'Sister' },
            { id: '5', name: 'Wife' }, { id: '6', name: 'Husband' },
            { id: '7', name: 'Son' }, { id: '8', name: 'Daughter' },
            { id: '9', name: 'Mother-in-law' }, { id: '10', name: 'Father-in-law' },
            { id: '11', name: 'Sister-in-law' }, { id: '12', name: 'Brother-in-law' },
            { id: '13', name: 'Daughter-in-law' },
        ]);
    };

    const fetchBranches = async () => {
        const mockBranches = [
            { id: 'ck8g589vj499008806oh90nmx', name: 'Devanahalli' },
            { id: 'clu835x1h0kh40898ynox6qnr', name: 'Doddaballapur' },
        ];
        try {
            const response = await getBranches();
            if (response.data.code === 200 && response.data.data?.length > 0) {
                const list = response.data.data;
                setBranches(list);
                setBranch(list[0].name);
                setSelectedBranchObj(list[0]);
            } else {
                setBranches(mockBranches);
                setBranch('Devanahalli');
                setSelectedBranchObj(mockBranches[0]);
            }
        } catch {
            setBranches(mockBranches);
            setBranch('Devanahalli');
            setSelectedBranchObj(mockBranches[0]);
        }
    };

    const generateNewCustomerId = async () => {
        try {
            const response = await generateCustomerId();
            if (response.data.code === 200) {
                const id = response.data.response?.data || response.data.data;
                setGeneratedCustomerId(id || 'CNB' + Math.floor(Math.random() * 100000));
            } else {
                setGeneratedCustomerId('CNB' + Math.floor(Math.random() * 100000));
            }
        } catch {
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // Auto-fill — Customer fields from database:
// Phone, Customer Name, Locality, Quotations, Gender, Father Name, Email, 
// Address Lines, Pincode, Country, State, City, Referred By
// ─────────────────────────────────────────────────────────────────────
    const autoFillCustomerFields = (customer: any) => {
        console.log('🔍 autoFillCustomerFields — filling fields');
        console.log('👤 Customer data structure:', JSON.stringify(customer, null, 2));
        
        // Auto-fill summary log
        console.log('🎯 AUTO-FILL SUMMARY - Checking all fields:');
        let fieldsFilled = 0;
        let fieldsSkipped = 0;
        // Use REFS for checks (always fresh, even after restore from route params)
        console.log('📊 Current ref state:', {
            customerFullName: customerFullNameRef.current,
            locality: localityRef.current,
            quotations: quotationsRef.current,
            customerGender: customerGenderRef.current
        });

        // Store customer for payload (DB id, etc.)
        setCustomerData(customer);
        customerDataRef.current = customer;

        // 1. Phone — only set if current phone is empty or same as customer phone
        const contactPhone = customer.contacts?.[0]?.phone;
        console.log('📞 Phone check:', { contactPhone, currentPhone: phoneRef.current });
        if (contactPhone && (!phoneRef.current || phoneRef.current === String(contactPhone))) {
            setPhoneSync(String(contactPhone));
            console.log('✅ Phone set to:', contactPhone);
        }

        // 2. Customer Name — only set if current name is empty or "Unknown"
        console.log('👤 Name check:', { customerName: customer.name, currentName: customerFullNameRef.current });
        if (customer.name && (!customerFullNameRef.current || customerFullNameRef.current === 'Unknown')) {
            setCustomerFullNameSync(String(customer.name));
            console.log('✅ Customer name SET to:', customer.name);
            fieldsFilled++;
        } else {
            console.log('⏭️ Customer name SKIPPED - already filled:', customerFullNameRef.current);
            fieldsSkipped++;
        }

        // 3. Locality — only set if current locality is empty
        console.log('📍 Locality check:', { customerLocality: customer.address?.locality, currentLocality: localityRef.current });
        if (customer.address?.locality && !localityRef.current) {
            setLocalitySync(String(customer.address.locality));
            console.log('✅ Locality SET to:', customer.address.locality);
            fieldsFilled++;
        } else {
            console.log('⏭️ Locality SKIPPED - already filled or missing:', localityRef.current || 'missing in customer data');
            fieldsSkipped++;
        }

        // 4. Associated Quotations — only set if current quotations is empty
        console.log('📄 Quotations check:', { 
            quotationIds: customer.quotation?.map((q: any) => q.quotationId || q.id),
            currentQuotations: quotationsRef.current
        });
        if (customer.quotation?.length > 0 && !quotationsRef.current) {
            // Prefer quotationId (like QDE/24-25/889) over internal ID
            const quotationIds = customer.quotation.map((q: any) => q.quotationId || q.id).join(', ');
            setQuotationsSync(quotationIds);
            console.log('✅ Quotations SET to:', quotationIds);
            fieldsFilled++;
        } else {
            console.log('⏭️ Quotations SKIPPED - already filled or missing:', quotationsRef.current || 'missing in customer data');
            fieldsSkipped++;
        }

        // 5. Gender — only set if current gender is empty or default
        console.log('⚧ Gender check:', { customerGender: customer.gender, currentGender: customerGenderRef.current });
        if (customer.gender && (!customerGenderRef.current || customerGenderRef.current === 'Male')) {
            setCustomerGenderSync(String(customer.gender));
            console.log('✅ Gender set to:', customer.gender);
        }

        // 6. Father Name — only set if current father name is empty
        console.log('👨 Father Name check:', { customerFatherName: customer.fatherName, currentFatherName: fatherNameRef.current });
        if (customer.fatherName && !fatherNameRef.current) {
            setFatherNameSync(String(customer.fatherName));
            console.log('✅ Father Name set to:', customer.fatherName);
        }

        // 7. Email — only set if current email is empty
        console.log('📧 Email check:', { customerEmail: customer.email, currentEmail: emailRef.current });
        if (customer.email && !emailRef.current) {
            setEmailSync(String(customer.email));
            console.log('✅ Email set to:', customer.email);
        }

        // 8. Address Lines — only set if current address lines are empty
        console.log('🏠 Address check:', { 
            customerAddress: customer.address, 
            currentAddr: addressRef.current,
            currentAddr2: address2Ref.current,
            currentAddr3: address3Ref.current
        });
        if (customer.address) {
            if (customer.address.line1 && !addressRef.current) {
                setAddressSync(String(customer.address.line1));
                console.log('✅ Address Line 1 set to:', customer.address.line1);
            }
            if (customer.address.line2 && !address2Ref.current) {
                setAddress2Sync(String(customer.address.line2));
                console.log('✅ Address Line 2 set to:', customer.address.line2);
            }
            if (customer.address.line3 && !address3Ref.current) {
                setAddress3Sync(String(customer.address.line3));
                console.log('✅ Address Line 3 set to:', customer.address.line3);
            }
        }

        // 9. Pincode — only set if current pincode is empty
        console.log('📍 Pincode check:', { customerPincode: customer.address?.pincode, currentPincode: pincodeRef.current });
        if (customer.address?.pincode && !pincodeRef.current) {
            setPincodeSync(String(customer.address.pincode));
            console.log('✅ Pincode set to:', customer.address.pincode);
        }

        // 10. Country — only set if current country is empty
        console.log('🌍 Country check:', { customerCountry: customer.address?.country, currentCountry: countryRef.current });
        if (customer.address?.country?.name && !countryRef.current) {
            setCountrySync(String(customer.address.country.name));
            console.log('✅ Country set to:', customer.address.country.name);
        }

        // 11. State — only set if current state is empty
        console.log('🗺️ State check:', { customerState: customer.address?.state, currentState: stateValRef.current });
        if (customer.address?.state?.name && !stateValRef.current) {
            setStateValSync(String(customer.address.state.name));
            console.log('✅ State set to:', customer.address.state.name);
        }

        // 12. City — only set if current city is empty
        console.log('🏙️ City check:', { customerCity: customer.address?.city, currentCity: cityRef.current });
        if (customer.address?.city?.name && !cityRef.current) {
            setCitySync(String(customer.address.city.name));
            console.log('✅ City set to:', customer.address.city.name);
        }

        // 13. Referred By — only set if current referred by is empty
        console.log('👥 Referred By check:', { customerReferredBy: customer.refferedBy, currentReferredBy: referredByRef.current });
        if (customer.refferedBy && !referredByRef.current) {
            // Handle both object and string formats
            const referredByData = typeof customer.refferedBy === 'object' && customer.refferedBy.id 
                ? customer.refferedBy 
                : { name: String(customer.refferedBy) };
            setReferredBySync(referredByData);
            console.log('✅ Referred By set to:', referredByData);
        }
        
        // Final Auto-fill Summary
        console.log('🎯 AUTO-FILL SUMMARY COMPLETE:');
        console.log(`📊 Fields Filled: ${fieldsFilled}`);
        console.log(`⏭️ Fields Skipped: ${fieldsSkipped}`);
        console.log(`📈 Success Rate: ${fieldsFilled > 0 ? 'SUCCESS' : 'NO DATA FILLED'}`);
        console.log('🔍 Check above logs for individual field details');
    };

    // ─────────────────────────────────────────────────────────────────────
    // fetchCustomerData — accepts phoneNumber param to avoid stale closure
    // ─────────────────────────────────────────────────────────────────────
    const fetchCustomerData = async (phoneNumber?: string) => {
        const phoneToUse = phoneNumber ?? phoneRef.current;
        try {
            console.log('🔍 fetchCustomerData called with:', {
                phoneToUse,
                customerFetchedRef: customerFetchedRef.current,
                customerDataRef: customerDataRef.current,
                phoneNumberParam: phoneNumber
            });

            if (!phoneToUse || String(phoneToUse).length !== 10) return;

            // Prevent re-fetching if customer already loaded (refs are always fresh, unlike state closures)
            if (customerFetchedRef.current && customerDataRef.current) {
                console.log('🔍 fetchCustomerData — skipped, customer already loaded');
                return;
            }

            console.log('🔍 fetchCustomerData — proceeding with fetch for:', phoneToUse);
            
            // Mark as fetched immediately to prevent race conditions
            customerFetchedRef.current = true;

            const customerRes = await getCustomerByPhoneNo(phoneToUse);
            const customers = (customerRes.data?.response?.data?.customers as any[]) || [];
            
            console.log('🔍 Customer API response:', {
                phoneToUse,
                customersFound: customers.length,
                customerData: customers[0] || 'No customer found'
            });

            if (customers.length > 0) {
                const customer = customers[0];
                setGeneratedCustomerId(customer.customerId || customer.id);
                console.log('🔍 Calling autoFillCustomerFields with customer data');
                autoFillCustomerFields(customer);
            } else {
                console.log('🔍 No customer found for phone:', phoneToUse);
                customerFetchedRef.current = true; // mark as fetched even when no customer found
                generateNewCustomerId();
            }
        } catch (error) {
            console.error('❌ fetchCustomerData error:', error);
            customerFetchedRef.current = true; // mark as fetched even on error
            generateNewCustomerId();
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // handlePhoneChange — pass value directly to avoid stale state
    // ─────────────────────────────────────────────────────────────────────
    const handlePhoneChange = (value: string) => {
        
        setPhoneSync(value);
        
        // Only proceed if value is actually different from current ref
        if (value === phoneRef.current) {
            console.log('🔍 handlePhoneChange — same value, skipping');
            return;
        }
        
        // If user is changing to a completely different phone number, reset fetch guard
        if (value.length === 10 && phoneRef.current && value !== phoneRef.current) {
            console.log('🔍 handlePhoneChange — resetting fetch guard for new phone');
            customerFetchedRef.current = false; // Reset for new phone number
        }
        // Only fetch if this is a new phone number and we haven't fetched for it yet
        if (value.length === 10 && value !== phoneRef.current && !customerFetchedRef.current) {
            console.log('🔍 handlePhoneChange — triggering fetch for:', value);
            fetchCustomerData(value);
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // Mount effect
    // ─────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!dataLoaded) {
            fetchCountries();
            fetchRtos();
            fetchManufacturers();
            fetchSalesOfficers('1');
            fetchReferredByOptions();
            fetchRelationshipOptions();
            fetchFinancerOptions();
            fetchBranches();
            generateNewCustomerId();
            setDataLoaded(true);
        }

        // If phone came from route params, fetch immediately — pass directly
        // But ONLY if we haven't already fetched customer data (prevents re-fetch on remount)
        if (customerPhone && String(customerPhone).length === 10 && !customerFetchedRef.current && !customerDataRef.current) {
            console.log('🔍 Mount effect — fetching customer for phone from route params:', customerPhone);
            fetchCustomerData(String(customerPhone));
        } else if (customerPhone && customerFetchedRef.current) {
            console.log('🔍 Mount effect — skipping fetch, customer already loaded for:', customerPhone);
        }
    }, []);

    // Handle customerPhone from route params (for Confirm/Advanced booking auto-fill)
    useEffect(() => {
        if (customerPhone && String(customerPhone).length === 10 && !customerFetchedRef.current && !customerDataRef.current) {
            console.log('🔍 CustomerPhone effect — updating phone state and fetching customer:', customerPhone);
            setPhone(String(customerPhone));
            fetchCustomerData(String(customerPhone));
        } else if (customerPhone && customerFetchedRef.current) {
            console.log('🔍 CustomerPhone effect — customer already loaded for:', customerPhone);
            setPhone(String(customerPhone));
        }
    }, [customerPhone]);

    // Restore saved form data from route params (when returning from vehicle selection)
    useEffect(() => {
        const saved = route.params?.savedFormData;
        if (saved) {
            console.log('🔄 Restoring saved form data from route params');
            if (saved.fatherName)       setFatherNameSync(saved.fatherName);
            if (saved.address)          setAddressSync(saved.address);
            if (saved.address2)         setAddress2Sync(saved.address2);
            if (saved.address3)         setAddress3Sync(saved.address3);
            if (saved.locality)         setLocalitySync(saved.locality);
            if (saved.pincode)          setPincodeSync(saved.pincode);
            if (saved.country)          setCountrySync(saved.country);
            if (saved.stateVal)         setStateValSync(saved.stateVal);
            if (saved.city)             setCitySync(saved.city);
            if (saved.email)            setEmailSync(saved.email);
            if (saved.dob)              setDobSync(saved.dob);
            if (saved.age)              setAgeSync(saved.age);
            if (saved.salesOfficer)     setSalesOfficerSync(saved.salesOfficer);
            if (saved.quotations)       setQuotationsSync(saved.quotations);
            if (saved.remarks)          setRemarksSync(saved.remarks);
            if (saved.customerGender)   setCustomerGenderSync(saved.customerGender);
            if (saved.nominee)          setNomineeSync(saved.nominee);
            if (saved.nomineeAge)       setNomineeAgeSync(saved.nomineeAge);
            if (saved.relationship)     setRelationshipSync(saved.relationship);
            if (saved.referredBy)       setReferredBySync(saved.referredBy);
            if (saved.expectedDelivery) setExpectedDeliverySync(saved.expectedDelivery);
            if (saved.customerFullName) setCustomerFullNameSync(saved.customerFullName);
            // Clear savedFormData from params to prevent re-restoring
            navigation.setParams({ savedFormData: undefined } as any);
        }
    }, []);

    // Default sales officer — use ref to avoid overwriting restored value
    useEffect(() => {
        if (salesOfficers.length > 0 && !salesOfficerRef.current) {
            const def = salesOfficers[0];
            setSalesOfficerSync(def.name || def.profile?.employeeName || '');
        }
    }, [salesOfficers]);

    // Default RTO
    useEffect(() => {
        if (rtos.length > 0 && !rto) {
            const def = rtos[0];
            setRto(def.name || def.rtoName || `${def.code} - ${def.area}`);
        }
    }, [rtos]);

    // Reset active tab to customer on mount to prevent payment tab issue
    useEffect(() => {
        setActiveTab('customer');
    }, []);

    // ─────────────────────────────────────────────────────────────────────
    // Vehicle selection from SelectVehicleForBooking screen
    // ─────────────────────────────────────────────────────────────────────
    useFocusEffect(
        useCallback(() => {
            console.log('🔍 useFocusEffect triggered with params:', {
                hasSelectedVehicle: !!route.params?.selectedVehicle,
                customerFetchedRef: customerFetchedRef.current,
                phoneRef: phoneRef.current,
                vehicleId: route.params?.selectedVehicle?.vehicleId || route.params?.selectedVehicle?.id,
                processedVehicleRef: processedVehicleRef.current
            });
            
            // Only proceed if we have vehicle data AND haven't processed it yet
            if (route.params?.selectedVehicle && !isVehicleSelectionInProgressRef.current) {
                const vehicleData = route.params.selectedVehicle;
                const vehicleId = vehicleData.vehicleId || vehicleData.id;
                
                // Check if we've already processed this specific vehicle
                if (processedVehicleRef.current === vehicleId) {
                    console.log('🔍 useFocusEffect — vehicle already processed:', vehicleId);
                    return;
                }
                
                console.log('🔍 useFocusEffect — processing new vehicle:', vehicleId);
                processedVehicleRef.current = vehicleId;

                setIsVehicleSelectionInProgress(true);
                isVehicleSelectionInProgressRef.current = true;
                setHasEverSelectedVehicle(true);
                hasEverSelectedVehicleRef.current = true;

                setSelectedVehicleObj(vehicleData);
                setVehicleColor(
                    `${vehicleData.name || vehicleData.vehicleName} - ${vehicleData.selectedColor?.name || 'Standard'}`
                );

                if (vehicleData.selectedColor?.price) {
                    const vp = vehicleData.selectedColor.price;
                    setShowroomPrice(vp.showroomPrice?.toString() || '');
                    setRoadTax(vp.roadTax?.toString() || '');
                    setHandlingCharges(vp.handlingCharges?.toString() || '');
                    setRegistrationFee(vp.registrationFee?.toString() || '');
                    setNumberPlateCharges(vp.numberPlate?.toString() || '');
                    setTempRegCharges(vp.tempRegister?.toString() || '');
                    setHypothecationCharges(vp.hp?.toString() || '');
                    setAffidavitAmount(vp.affidavit?.toString() || '');
                    setFinalAmount(vehicleData.finalTotal?.toString() || '');
                }

                if (vehicleData.name) {
                    setModel(vehicleData.name);
                    currentModelRef.current = vehicleData.name;
                }

                setTimeout(() => setIsVehicleSelectionInProgress(false), 2000);

                if (route.params?.scrollToSection === 'vehicle') {
                    navigation.setParams({ selectedVehicle: undefined, scrollToSection: undefined } as any);
                    setTimeout(() => {
                        setActiveTab('vehicle');
                        setTimeout(() => {
                            vehicleSectionRef.current?.measure((x, y, w, h, pageX, pageY) => {
                                scrollViewRef.current?.scrollTo({ y: pageY - 50, animated: true });
                            });
                        }, 100);
                    }, 300);
                } else {
                    navigation.setParams({ selectedVehicle: undefined } as any);
                }
            } else {
                // No vehicle data or already processed, skip
                console.log('🔍 useFocusEffect — no vehicle data or already processed');
            }
        }, [route.params, navigation])
    );

    // ─────────────────────────────────────────────────────────────────────
    // Validation
    // ─────────────────────────────────────────────────────────────────────
    const validateForm = (): 'customer' | 'vehicle' | 'payment' | 'auth' | null => {
        setNameError(''); setPhoneError(''); setSalesOfficerError('');
        setAddressError(''); setLocalityError(''); setPincodeError(''); setModelError('');

        let hasCustomerError = false;

        // Read from state (always up-to-date by the time user reaches Save & Complete)
        const n   = customerFullName.trim();
        const p   = phone.trim();
        const so  = salesOfficer.trim();
        const addr = address.trim();
        const loc  = locality.trim();
        const pin  = pincode.trim();
        const a    = age.trim();
        const g    = customerGender.trim();

        if (!n)   { setNameError('Customer name is required'); hasCustomerError = true; }
        if (!p)   { setPhoneError('Phone number is required'); hasCustomerError = true; }
        else if (p.length !== 10 || !/^\d+$/.test(p)) { setPhoneError('Enter a valid 10-digit phone'); hasCustomerError = true; }
        if (!so)  { setSalesOfficerError('Sales officer is required'); hasCustomerError = true; }
        if (!a)   { toast.error('Age is required'); hasCustomerError = true; }
        if (!g)   { toast.error('Gender is required'); hasCustomerError = true; }
        if (!addr){ setAddressError('Address is required'); hasCustomerError = true; }
        if (!loc) { setLocalityError('Locality is required'); hasCustomerError = true; }
        if (!pin) { setPincodeError('Pincode is required'); hasCustomerError = true; }
        else if (!/^\d{6}$/.test(pin)) { setPincodeError('Enter a valid 6-digit pincode'); hasCustomerError = true; }

        if (hasCustomerError) {
            if (!n)             toast.error('Customer name is required');
            else if (!p)        toast.error('Phone number is required');
            else if (p.length !== 10) toast.error('Enter a valid 10-digit phone');
            else if (!so)       toast.error('Sales officer is required');
            else if (!a)        toast.error('Age is required');
            else if (!g)        toast.error('Gender is required');
            else if (!addr)     toast.error('Address is required');
            else if (!loc)      toast.error('Locality is required');
            else if (!pin)      toast.error('Pincode is required');
            else                toast.error('Enter a valid 6-digit pincode');
            return 'customer';
        }

        if (!model || model.trim() === '' || model === 'Select Model Name') {
            setModelError('Vehicle model is required');
            toast.error('Please select a vehicle model');
            return 'vehicle';
        }

        if (!expectedDelivery || expectedDelivery.trim() === '' || expectedDelivery === 'DD/MM/YYYY') {
            toast.error('Expected Delivery Date is required');
            return 'vehicle';
        }

        const pm = paymentMode;
        if (!pm) { toast.error('Payment mode is required'); return 'payment'; }
        if (pm === 'finance') {
            if (!financer.trim()) { toast.error('Financer name is required'); return 'payment'; }
            if (loanType === 'Company Assisted') {
                if (!downPayment) { toast.error('Down payment is required'); return 'payment'; }
                if (!tenure)      { toast.error('Tenure is required'); return 'payment'; }
                if (!loanAmount)  { toast.error('Loan amount is required'); return 'payment'; }
                if (!emiAmount)   { toast.error('EMI amount is required'); return 'payment'; }
            }
        }

        return null;
    };

    const validateBookingPayload = (payload: any) => {
        const errors: string[] = [];
        ['bookingId', 'eReceiptId', 'bookingStatus', 'customerName', 'customerPhone', 'IDbranch', 'vehicle', 'price']
            .forEach(f => { if (!payload[f]) errors.push(`Missing: ${f}`); });
        if (payload.customer && !payload.customer.id) errors.push('customer.id missing');
        if (payload.vehicle && !payload.vehicle.id) errors.push('vehicle.id missing');
        return { isValid: errors.length === 0, errors };
    };

    // ─────────────────────────────────────────────────────────────────────
    // createBookingPayload — reads exclusively from refs (always fresh)
    // ─────────────────────────────────────────────────────────────────────
    const createBookingPayload = async () => {
        const selectedBranch = selectedBranchObj || branches.find((b: any) => b.name === branch || b.id === branch);
        if (!selectedBranch?.id) {
            toast.error('Please select a valid branch before saving.');
            throw new Error('Missing branch id');
        }
        const branchId = String(selectedBranch.id);

        const [bookingIdRes, eReceiptIdRes] = await Promise.all([
            generateBookingId(branchId),
            generateEReceiptId(branchId),
        ]);
        const baseBookingId  = bookingIdRes.data?.response?.data  || bookingIdRes.data?.data  || 'BK';
        const baseReceiptId  = eReceiptIdRes.data?.response?.data || eReceiptIdRes.data?.data || 'ER';
        const stamp = `${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        const bookingId  = `${baseBookingId}-${stamp}`;
        const eReceiptId = `${baseReceiptId}-${stamp}`;

        // ── Read all values from refs ──
        const snap           = customerDataRef.current;
        const currentName    = customerFullNameRef.current;
        const currentPhone   = phoneRef.current;
        const currentFather  = fatherNameRef.current;
        const currentAddr    = addressRef.current;
        const currentAddr2   = address2Ref.current;
        const currentAddr3   = address3Ref.current;
        const currentLoc     = localityRef.current;
        const currentCountry = countryRef.current;
        const currentState   = stateValRef.current;
        const currentCity    = cityRef.current;
        const currentPin     = pincodeRef.current;
        const currentEmail   = emailRef.current;
        const currentDob     = dobRef.current;
        const currentGender  = customerGenderRef.current;
        const currentSales   = salesOfficerRef.current;
        const currentQuotes  = quotationsRef.current;
        const currentRemarks = remarksRef.current;
        const currentPayMode = paymentModeRef.current;
        const currentNominee = nomineeRef.current;
        const currentNomAge  = nomineeAgeRef.current;
        const currentRelation = relationshipRef.current;
        const currentReferred = referredByRef.current;
        const currentExpDel  = expectedDeliveryRef.current;

        console.log('📦 Payload ref values:', {
            name: currentName, phone: currentPhone, address: currentAddr,
            locality: currentLoc, pincode: currentPin, gender: currentGender,
        });

        const vehicleData = selectedVehicleObj ? {
            id:        selectedVehicleObj.modelId || selectedVehicleObj.vehicleId || selectedVehicleObj.id,
            modelName: selectedVehicleObj.name || selectedVehicleObj.displayName,
            modelCode: selectedVehicleObj.model || selectedVehicleObj.modelCode,
            color: {
                id:       selectedVehicleObj.selectedColor?.price?.colors?.[0]?.colorId ||
                          selectedVehicleObj.selectedColor?.id || null,
                name:     selectedVehicleObj.selectedColor?.name || selectedVehicleObj.selectedColor?.colorName,
                code:     selectedVehicleObj.selectedColor?.code || '#000000',
                imageUrl: selectedVehicleObj.selectedColor?.price?.colors?.[0]?.imageDetails?.[0]?.url ||
                          selectedVehicleObj.selectedColor?.imageUrl || null,
            },
        } : null;

        const normalizedDob = currentDob?.trim() ? (() => {
            if (currentDob.includes('/')) {
                const [dd, mm, yyyy] = currentDob.split('/');
                return `${yyyy}-${mm}-${dd}`;
            }
            return currentDob;
        })() : null;

        const isFinance = currentPayMode === 'finance';
        const normalizedLoanType = isFinance && loanType
            ? (loanType === 'Self' ? 'self' : 'companyAssist')
            : null;

        const loanPayload = {
            hypothecation:          isFinance ? paymentHypothecation : false,
            financerBranch:         isFinance ? financierBranch : '',
            financer:               isFinance && selectedFinancerId ? { id: selectedFinancerId, name: financer } : null,
            downPayment:            isFinance ? (parseFloat(downPayment) || 0) : 0,
            loanAmount:             isFinance ? (parseFloat(loanAmount) || 0) : 0,
            tenure:                 isFinance ? (parseInt(tenure) || 0) : 0,
            emiDate:                isFinance ? (parseInt(emiDay) || 0) : 0,
            emiStartDate:           isFinance && emiStartDate ? (() => {
                if (emiStartDate.includes('/')) {
                    const [dd, mm, yyyy] = emiStartDate.split('/');
                    return `${yyyy}-${mm}-${dd}`;
                }
                return emiStartDate;
            })() : null,
            loanType:               normalizedLoanType,
            emiAmount:              isFinance ? (parseFloat(emiAmount) || 0) : 0,
            disbursementAmount:     isFinance ? (parseFloat(loanDisbursementAmount) || 0) : 0,
            showroomFinanceCharges: isFinance ? (parseFloat(showroomFinanceCharges) || 0) : 0,
        };

        const currentExec = salesOfficers.find(
            e => (e.name || e.profile?.employeeName) === currentSales
        );

        const resolveRto = () => {
            const found = rtos.find((item: any) => {
                const label = `${item.code || item.rtoCode} - ${item.area || item.rtoName}`;
                return label === rto;
            });
            return found
                ? { id: found.id, code: found.code || found.rtoCode, area: found.area || found.rtoName }
                : null;
        };

        const displayCustomerId = generatedCustomerId || snap?.customerId || null;

        const payload: any = {
            // Booking type flags based on mode (matching web app pattern)
            isAdvanceBooking: isConfirmBooking ? false : true,
            bookingId,
            eReceiptId,
            bookingStatus: isConfirmBooking ? 'PENDING' : 'ADVANCE',

            // Customer object — always use ref values for addresses (user may have edited)
            customer: snap ? {
                id:          snap.id,
                customerId:  snap.customerId,
                name:        currentName,
                fatherName:  currentFather || null,
                gender:      currentGender,
                email:       currentEmail || null,
                contacts:    snap.contacts || [],
                dateOfBirth: normalizedDob,
                address: {
                    line1:    currentAddr,
                    line2:    currentAddr2,
                    line3:    currentAddr3,
                    locality: currentLoc,
                    pincode:  currentPin,
                    country:  currentCountry ? { name: currentCountry } : null,
                    state:    currentState   ? { name: currentState }   : null,
                    city:     currentCity    ? { name: currentCity }    : null,
                },
                refferedBy: currentReferred || null,
            } : null,

            customerId:         displayCustomerId,
            customerName:       currentName,
            customerFatherName: currentFather || '',
            customerPhone:      currentPhone,
            customerGender:     currentGender,
            customerLocality:   currentLoc,
            customerCountry:    currentCountry,
            customerState:      currentState,
            customerCity:       currentCity,
            customerPincode:    currentPin,
            customerEmail:      currentEmail,
            customerDob:        normalizedDob,

            IDbranch: branchId,
            branch:   { id: branchId, name: selectedBranch.name || branch },

            nomineeName:  currentNominee,
            nomineeAge:   currentNomAge,
            relationship: currentRelation,

            vehicle:         vehicleData,
            selectedVehicle: vehicleData ? [{
                color: {
                    id:    vehicleData.color?.id,
                    color: vehicleData.color?.name,
                    code:  vehicleData.color?.code,
                    url:   vehicleData.color?.imageUrl,
                },
                vehicleDetail: {
                    id:        vehicleData.id,
                    modelName: vehicleData.modelName,
                    modelCode: vehicleData.modelCode,
                },
            }] : [],

            rto:     resolveRto(),
            rtoCode: rto?.split(' - ')[0] || 'KA-01',
            rtoArea: rto?.split(' - ')[1] || '',

            price: {
                showroomPrice:                parseFloat(showroomPrice)         || 0,
                onRoadPrice:                  parseFloat(onRoadPrice)           || 0,
                onRoadDiscount:               parseFloat(onRoadDiscount)        || 0,
                insuranceAmount:              parseFloat(insuranceAmount)       || 0,
                insuranceType:                insuranceType || 'Comprehensive',
                roadTax:                      parseFloat(roadTax)               || 0,
                handlingCharges:              parseFloat(handlingCharges)       || 0,
                registrationFee:              parseFloat(registrationFee)       || 0,
                numberPlate:                  parseFloat(numberPlateCharges)    || 0,
                tempRegister:                 parseFloat(tempRegCharges)        || 0,
                hp:                           parseFloat(hypothecationCharges)  || 0,
                paymentMode:                  currentPayMode,
                affidavit:                    parseFloat(affidavitAmount)       || 0,
                netRecievables:               parseFloat(netReceivables)        || 0,
                specialNoCharges:             parseFloat(specialNoCharges)      || 0,
                accessoriesTotal:             parseFloat(accessoriesTotal)      || 0,
                accessoriesTotalAfterDiscount: parseFloat(accessoriesAfterDiscount) || 0,
                totalDiscount:                parseFloat(totalDiscount)         || 0,
                finalAmount:                  parseFloat(finalAmount)           || 0,
            },

            exchangeVehicleName:  exchangeModel,
            exchangeVehiclePrice: parseFloat(exchangePrice) || 0,
            exchange: { vehicleModel: exchangeModel, vehiclePrice: parseFloat(exchangePrice) || null },

            accessories: accessories.filter(a => a.isSelected).map(a => ({
                id: a.arrayId || '',
                accessory: { id: a.id, name: a.partName, price: a.mrp },
                discount: a.discount,
                isPercent: a.isPercent,
                quantity: a.quantity,
            })),
            quotation: currentQuotes
                ? currentQuotes.split(', ').map(qId => {
                    const trimmedId = qId.trim();
                    // Convert user-friendly quotation ID back to internal database ID
                    const matchingQuotation = snap?.quotation?.find(
                        (q: any) => q.quotationId === trimmedId
                    );
                    const internalId = matchingQuotation?.id || trimmedId;
                    console.log('📄 Quotation mapping:', trimmedId, '->', internalId);
                    return { id: internalId };
                })
                : [],

            color: { id: vehicleData?.color?.id || null },

            loan:     loanPayload,
            loanData: {
                finName:               isFinance ? financer : null,
                financerBranch:        loanPayload.financerBranch,
                downPayment:           loanPayload.downPayment,
                loanAmount:            loanPayload.loanAmount,
                tenure:                loanPayload.tenure,
                emiDate:               loanPayload.emiDate,
                emiStartDate:          loanPayload.emiStartDate,
                loanType:              loanPayload.loanType,
                emiAmount:             loanPayload.emiAmount,
                disbursementAmount:    loanPayload.disbursementAmount,
                showroomFinanceCharges: loanPayload.showroomFinanceCharges,
            },

            remarks: currentRemarks,
            authentication: { beforeVerification: null, afterVerification: null, digital: null, verifiedAt: null },
            pdf: 'example',
            pdfSigned: 'example',

            executive: currentExec || {
                id: currentSales,
                profile: {
                    employeeName: currentSales,
                    branch: [{ id: branchId, name: selectedBranch.name || branch }],
                },
            },

            authorisedTime: null,
            expectedDeliveryDate: currentExpDel ? (() => {
                if (currentExpDel.includes('/')) {
                    const [dd, mm, yyyy] = currentExpDel.split('/');
                    return `${yyyy}-${mm}-${dd}`;
                }
                return currentExpDel;
            })() : null,
            refferedBy:      currentReferred && currentReferred.id ? { id: currentReferred.id } : null,
            confirmBookingId: null,
            
            // Authentication data for Confirm Booking (matching web app pattern)
            ...(isConfirmBooking && {
                authentication: {
                    verifiedAt: null, // Will be set when customer is verified
                    beforeVerification: null, // Document URLs
                    afterVerification: null, // Document URLs
                    status: 'PENDING_VERIFICATION'
                }
            }),
        };

        // Remove undefined keys
        Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
        
        // Debug: Show booking mode and key payload fields
        console.log(`🎯 Booking Mode: ${bookingMode}`);
        console.log(`📊 Booking Flags: isAdvanceBooking=${payload.isAdvanceBooking}, bookingStatus=${payload.bookingStatus}`);
        console.log('🔐 Authentication:', payload.authentication ? 'Included' : 'Not included');
        console.log('📦 Final payload:', JSON.stringify(payload, null, 2));
        
        return payload;
    };

    // ─────────────────────────────────────────────────────────────────────
    // Save handler
    // ─────────────────────────────────────────────────────────────────────
    const handleSaveComplete = async () => {
        const errorTab = validateForm();
        if (errorTab !== null) { setActiveTab(errorTab); return; }

        toast.warn('Saving booking...');
        try {
            const bookingPayload = await createBookingPayload();
            const validation = validateBookingPayload(bookingPayload);
            if (!validation.isValid) {
                console.error('❌ Payload validation errors:', validation.errors);
                toast.error('Invalid booking data. Please check all required fields.');
                return;
            }

            console.log('📦 Sending booking payload:', JSON.stringify(bookingPayload, null, 2));
            const response = await createBooking(bookingPayload);
            console.log('📦 Booking response:', response);
            console.log('📦 Response data:', response.data);
            console.log('📦 Response status:', response.status);
            
            if (response.data.code === 200) {
                toast.success('Booking saved successfully!');
                console.log('📦 Booking created successfully, updating quotation status...');
                
                // Update quotation status to "BOOKED" after successful booking
                const quotationData = response.data?.response?.data?.quotation?.[0];
                const quotationId = quotationData?.id || quotationData?.quotationId;
                
                if (quotationId) {
                    console.log('📝 Found quotationId:', quotationId);
                    // TODO: Implement status update when backend API is available
                    console.log('⚠️ Status update API not available yet, skipping status update');
                    
                    // Emit event to refresh FollowUps list
                    DeviceEventEmitter.emit('refreshFollowUps');
                    console.log('📡 Emitted refreshFollowUps event');
                } else {
                    console.log('⚠️ No quotation ID found in booking response');
                }
                
                // Reset navigation stack and navigate to Quotations tab after successful booking
                const customerPhone = phoneRef.current || route.params?.customerPhone || response.data?.response?.data?.customerPhone;
                if (customerPhone) {
                    console.log('🔍 Resetting navigation and going to Quotations tab with customerPhone:', customerPhone);
                    
                    setTimeout(() => {
                        if (quotationId) {
                            console.log('🔍 Including QuotationView in navigation stack with quotationId:', quotationId);
                            navigation.reset({
                                index: 2,
                                routes: [
                                    { name: 'Main', state: { routes: [{ name: 'Quotations' }] } },
                                    { name: 'QuotationView', params: { id: quotationId } },
                                    { name: 'Main', state: { routes: [{ name: 'Quotations' }] } }
                                ]
                            });
                        } else {
                            console.log('🔍 No quotation found, using standard navigation to Quotations tab');
                            navigation.reset({
                                index: 0,
                                routes: [
                                    { name: 'Main', state: { routes: [{ name: 'Quotations' }] } }
                                ]
                            });
                        }
                    }, 1500);
                } else {
                    console.log('🔍 No customerPhone found, resetting navigation to Quotations');
                    setTimeout(() => {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Main', state: { routes: [{ name: 'Quotations' }] } }]
                        });
                    }, 1500);
                }
            } else {
                console.error('❌ Booking creation failed:', response);
                console.error('❌ Response data details:', JSON.stringify(response.data, null, 2));
                const err = response.data?.err || response.data;
                console.error('❌ Error object:', err);
                console.error('❌ Error message:', err?.message || err?.err?.message);
                toast.error(err?.message || err?.err?.message || 'Failed to save booking');
            }
        } catch (error: any) {
            console.error('❌ Booking creation error:', error);
            console.error('❌ Error response:', error.response);
            console.error('❌ Error request:', error.request);
            
            if (error.response) {
                console.error('❌ Server response data:', error.response.data);
                toast.error(error.response.data?.message || error.response.data?.err?.message || 'Server error');
            } else if (error.request) {
                toast.error('Network error. Check your connection.');
            } else {
                toast.error(error.message || 'Failed to save booking');
            }
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // Misc handlers
    // ─────────────────────────────────────────────────────────────────────
    const handleClose = () => {
        const target = getBackNavigationTarget();
        console.log(`🔍 Closing BookingActivity, navigating to ${target.screen}`);
        
        if (target.useGoBack) {
            navigation.goBack();
        } else if (target.params) {
            navigation.navigate(target.screen, target.params);
        } else {
            navigation.navigate(target.screen);
        }
    };

    const handleDateSelect = (dateString: string) => {
        const [yyyy, mm, dd] = dateString.split('-');
        setDobSync(`${dd}/${mm}/${yyyy}`);
        const date = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
        const today = new Date();
        let a = today.getFullYear() - date.getFullYear();
        const m = today.getMonth() - date.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < date.getDate())) a--;
        setAgeSync(a.toString());
        setShowCalendarModal(false);
    };

    const handleAttachQuotation = async (selected: string[]) => {
        console.log('🔗 handleAttachQuotation called with:', selected);
        console.log('📊 Current quotationsAssociated before:', quotationsAssociated);
        
        if (selected.length > 0) {
            // Convert internal IDs to quotation IDs using existing customer data or API fallback
            const newQuotationIds = await Promise.all(selected.map(async (id) => {
                // First try to find matching quotation in customer data
                const matchingQuotation = customerData?.quotation?.find(q => q.id === id);
                const quotationId = matchingQuotation?.quotationId;
                
                if (quotationId) {
                    console.log('🔄 Found in customer data - Converting ID:', id, 'to QuotationId:', quotationId);
                    return quotationId;
                } else {
                    // Fallback: fetch quotation details from API
                    try {
                        console.log('🔄 Not found in customer data - Fetching from API for ID:', id);
                        const response = await getQuotationById(id);
                        const quotation = response.data?.data || response.data?.response?.data;
                        const apiQuotationId = quotation?.quotationId;
                        console.log('🔄 API result - Converting ID:', id, 'to QuotationId:', apiQuotationId);
                        return apiQuotationId || id; // Fallback to original ID
                    } catch (error) {
                        console.error(`❌ Failed to fetch quotation ${id}:`, error);
                        return id; // Fallback to original ID
                    }
                }
            }));
            
            console.log('🔄 Converted quotation IDs:', newQuotationIds);
            
            // Combine existing and new quotations
            const existingQuotations = quotationsAssociated ? quotationsAssociated.split(', ').filter(q => q.trim()) : [];
            const allQuotations = [...existingQuotations, ...newQuotationIds];
            
            // Remove duplicates
            const uniqueQuotations = [...new Set(allQuotations)];
            const finalQuotations = uniqueQuotations.join(', ');
            
            console.log('📝 Setting quotations to:', finalQuotations);
            setQuotationsSync(finalQuotations);
            toast.success(`Attached ${selected.length} quotation(s)`);
            
            // Verify the change
            setTimeout(() => {
                console.log('📊 QuotationsAssociated after setting:', quotationsAssociated);
            }, 100);
        } else {
            console.log('❌ No quotations selected');
        }
        setShowAttachQuotationModal(false);
    };

    const handleAccessorySave = (saved: Accessory[]) => {
        setAccessories(saved);
        const before = saved.reduce((s, a) => s + a.priceBeforeDiscount, 0);
        const after  = saved.reduce((s, a) => s + a.priceAfterDiscount, 0);
        setAccessoriesTotal(before.toString());
        setAccessoriesAfterDiscount(after.toString());
    };

    const handleNext = () => {
        if (activeTab === 'customer') {
            setNameError(''); setPhoneError(''); setAddressError('');
            setLocalityError(''); setPincodeError(''); setSalesOfficerError('');
            let err = false;
            if (!customerFullName.trim()) { setNameError('Required'); err = true; }
            if (!phone.trim() || phone.length !== 10) { setPhoneError('Required (10 digits)'); err = true; }
            if (!address.trim()) { setAddressError('Required'); err = true; }
            if (!locality.trim()) { setLocalityError('Required'); err = true; }
            if (!pincode.trim() || pincode.length !== 6) { setPincodeError('Required (6 digits)'); err = true; }
            if (!salesOfficer.trim())     { setSalesOfficerError('Required'); err = true; }
            if (!age.trim())              { toast.error('Age is required'); err = true; }
            if (!customerGender.trim())   { toast.error('Gender is required'); err = true; }
            if (!err) setActiveTab('vehicle');
        } else if (activeTab === 'vehicle') {
            if (!model) { toast.error('Please select a vehicle model'); return; }
            if (!expectedDelivery || expectedDelivery.trim() === '' || expectedDelivery === 'DD/MM/YYYY') { toast.error('Expected Delivery Date is required'); return; }
            setActiveTab('payment');
        } else if (activeTab === 'payment') {
            // For Confirm Booking, go to auth step; for others, stay on payment (final step)
            if (isConfirmBooking) {
                setActiveTab('auth');
            }
        }
    };

    const handleBack = () => {
        if (activeTab === 'payment') {
            setActiveTab('vehicle');
        } else if (activeTab === 'auth') {
            setActiveTab('payment');
        } else if (activeTab === 'vehicle') {
            setActiveTab('customer');
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────
    return (
        <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
            {/* Header */}
            <HeaderWithBack
                title="Booking Register"
                subtitle={
    isConfirmBooking ? "Confirm Booking" : 
    isAdvancedBooking ? "Advanced Booking" : 
    undefined
}
                onBackPress={() => {
                    const target = getBackNavigationTarget();
                    console.log(`🔍 Closing BookingActivity, navigating to ${target.screen}`);
                    
                    if (target.useGoBack) {
                        navigation.goBack();
                    } else if (target.params) {
                        navigation.navigate(target.screen, target.params);
                    } else {
                        navigation.navigate(target.screen);
                    }
                }}
            />

            {/* Booking info card */}
            <View className="mt-2 bg-white rounded-xl border border-gray-100 p-4 mb-2 w-[330px] self-center">
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-gray-500 text-sm">Booking Id:</Text>
                    <Text className="text-teal-600 font-bold text-sm">New</Text>
                </View>
                <View className="flex-row justify-between items-center">
                    <Text className="text-gray-500 text-sm">Customer Id:</Text>
                    <Text className="text-gray-900 text-sm font-medium">{generatedCustomerId || 'Loading...'}</Text>
                </View>
            </View>

            {/* Tabs */}
            <View className="w-[340px] self-center bg-white border-b border-gray-100">
                <View className="flex-row items-center px-4">
                    {(['customer', 'vehicle', 'payment', ...(isConfirmBooking ? ['auth'] : [])] as Array<'customer' | 'vehicle' | 'payment' | 'auth'>).map((tab, idx, arr) => (
                        <React.Fragment key={tab}>
                            <TouchableOpacity
                                onPress={() => setActiveTab(tab)}
                                className={`flex-1 py-3 items-center border-b-2 ${activeTab === tab ? 'border-teal-600' : 'border-transparent'}`}
                            >
                                <Text className={`text-sm font-medium ${activeTab === tab ? 'text-teal-600' : 'text-gray-600'}`}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Text>
                            </TouchableOpacity>
                            {idx < arr.length - 1 && <ChevronRight size={16} color={COLORS.gray[400]} />}
                        </React.Fragment>
                    ))}
                </View>
            </View>

            {/* Content */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                >
                    <View className="bg-white rounded-xl border border-gray-100 p-4">

                        {/* ── CUSTOMER TAB ────────────────────────────────── */}
                        {activeTab === 'customer' && (
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
                                        onChangeText={setCustomerFullNameSync}
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
                                        onChangeText={setFatherNameSync}
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
                                        onChangeText={setLocalitySync}
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
                                        onChangeText={setPincodeSync}
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
                                        onChangeText={setEmailSync}
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
                                            onPress={() => setShowAttachQuotationModal(true)}
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
                        )}

                        {/* ── VEHICLE TAB ──────────────────────────────────── */}
                        {activeTab === 'vehicle' && (
                            <View ref={vehicleSectionRef}>
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
                                    <View className={`h-16 px-3 py-2 rounded-lg flex-row items-center mb-3 ${isModelSelected ? 'bg-white border border-gray-300' : 'bg-gray-200'}`}>
                                        <Text className={`${isModelSelected ? 'text-gray-800' : 'text-gray-500'} flex-1`}>
                                            {vehicleColor || (isModelSelected ? 'Select Vehicle Color' : 'No Vehicle chosen')}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={isModelSelected ? () => navigation.navigate('SelectVehicleForBooking', {
                                            modelName: model,
                                            customerName: route.params?.customerName,
                                            customerId: route.params?.customerId,
                                            customerPhone: route.params?.customerPhone,
                                            savedFormData: {
                                                fatherName: fatherNameRef.current,
                                                address: addressRef.current,
                                                address2: address2Ref.current,
                                                address3: address3Ref.current,
                                                locality: localityRef.current,
                                                pincode: pincodeRef.current,
                                                country: countryRef.current,
                                                stateVal: stateValRef.current,
                                                city: cityRef.current,
                                                email: emailRef.current,
                                                dob: dobRef.current,
                                                age: ageRef.current,
                                                salesOfficer: salesOfficerRef.current,
                                                quotations: quotationsRef.current,
                                                remarks: remarksRef.current,
                                                customerGender: customerGenderRef.current,
                                                nominee: nomineeRef.current,
                                                nomineeAge: nomineeAgeRef.current,
                                                relationship: relationshipRef.current,
                                                referredBy: referredByRef.current,
                                                expectedDelivery: expectedDeliveryRef.current,
                                                customerFullName: customerFullNameRef.current,
                                            },
                                        }) : undefined}
                                        disabled={!isModelSelected}
                                        className={`px-4 py-3 rounded-lg flex-row items-center justify-center ${isModelSelected ? 'bg-teal-600 opacity-100' : 'bg-gray-300 opacity-50'}`}
                                    >
                                        <Text className={`font-medium mr-2 ${isModelSelected ? 'text-white' : 'text-gray-500'}`}>
                                            Select Vehicle Color
                                        </Text>
                                        <ChevronRight size={16} color={isModelSelected ? 'white' : '#6b7280'} />
                                    </TouchableOpacity>
                                </View>

                                {/* Accessories table */}
                                <View className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
                                    <View style={{ height: Math.max(80, Math.min(accessories.length * 50 + 40, 400)) }}>
                                        <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
                                            <ScrollView style={{ minWidth: 550 }} nestedScrollEnabled>
                                                <View className="flex-row bg-gray-50 border-b border-gray-200">
                                                    {['S.No', 'Accessory Name', 'Quantity', 'Discount', 'Price Before', 'Price After'].map((h, i) => (
                                                        <View key={h} style={{ width: i === 1 ? 150 : i === 2 ? 100 : 80 }} className="p-3 border-r border-gray-200">
                                                            <Text className="text-xs font-medium text-gray-700">{h}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                                {accessories.length === 0 ? (
                                                    <View className="flex-row border-b border-gray-100 p-3">
                                                        <Text className="text-sm text-gray-400 italic">No accessories added</Text>
                                                    </View>
                                                ) : accessories.map((acc, idx) => (
                                                    <View key={acc.id} className="flex-row border-b border-gray-100">
                                                        <View style={{ width: 80 }} className="p-3 border-r border-gray-100"><Text className="text-sm text-center">{idx + 1}</Text></View>
                                                        <View style={{ width: 150 }} className="p-3 border-r border-gray-100"><Text className="text-sm">{acc.partName}</Text></View>
                                                        <View style={{ width: 100 }} className="p-3 border-r border-gray-100"><Text className="text-sm text-center">{acc.quantity} @ ₹{acc.mrp}</Text></View>
                                                        <View style={{ width: 80 }} className="p-3 border-r border-gray-100"><Text className="text-sm text-center">{acc.discount}{acc.isPercent ? '%' : '₹'}</Text></View>
                                                        <View style={{ width: 80 }} className="p-3 border-r border-gray-100"><Text className="text-sm text-center">₹{(acc.quantity * acc.mrp).toFixed(2)}</Text></View>
                                                        <View style={{ width: 100 }} className="p-3 border-r border-gray-100"><Text className="text-sm text-center">₹{acc.priceAfterDiscount.toFixed(2)}</Text></View>
                                                    </View>
                                                ))}
                                            </ScrollView>
                                        </ScrollView>
                                    </View>
                                </View>

                                {/* Totals */}
                                <View className="mb-6">
                                    {[
                                        { label: 'Total Discount', value: totalDiscount, setter: setTotalDiscount },
                                        { label: 'Accessories Total', value: accessoriesTotal, setter: setAccessoriesTotal },
                                        { label: 'Accessories Total (after Discount)', value: accessoriesAfterDiscount, setter: setAccessoriesAfterDiscount },
                                    ].map(({ label, value, setter }) => (
                                        <View key={label} className="mb-4">
                                            <FormLabel label={label} />
                                            <View className="flex-row gap-2">
                                                <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
                                                <TextInput
                                                    value={value}
                                                    onChangeText={setter}
                                                    keyboardType="numeric"
                                                    editable={isExpectedDeliverySelected}
                                                    className={`flex-1 h-12 border border-gray-300 rounded-lg px-3 text-gray-800 ${isExpectedDeliverySelected ? 'bg-white' : 'bg-gray-50'}`}
                                                />
                                            </View>
                                        </View>
                                    ))}
                                    <TouchableOpacity
                                        onPress={isExpectedDeliverySelected ? () => setShowAccessoryModal(true) : undefined}
                                        disabled={!isExpectedDeliverySelected}
                                        className={`mt-1 ${isExpectedDeliverySelected ? 'opacity-100' : 'opacity-50'}`}
                                    >
                                        <Text className={`text-sm ${isExpectedDeliverySelected ? 'text-teal-600' : 'text-gray-400'}`}>+Add/View Accessory</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Exchange */}
                                <View className="mb-6 border-t pt-6">
                                    <Text className="text-base font-medium text-gray-700 mb-4">Exchange Vehicle Information</Text>
                                    <View className="mb-4">
                                        <FormLabel label="Exchange Model Name" />
                                        <TextInput value={exchangeModel} onChangeText={setExchangeModel} placeholder="Exchange Vehicle" className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800" />
                                    </View>
                                    <View>
                                        <FormLabel label="Exchange Price" />
                                        <View className="flex-row gap-2">
                                            <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
                                            <TextInput value={exchangePrice} onChangeText={setExchangePrice} keyboardType="numeric" className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800" />
                                        </View>
                                    </View>
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
                        )}

                        {/* ── PAYMENT TAB ──────────────────────────────────── */}
                        {activeTab === 'payment' && (
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
                        )}

                        {/* ── AUTH TAB ──────────────────────────────────── */}
                        {activeTab === 'auth' && (
                            <View>

                                <View className="space-y-8">
                                    {/* Digital Authentication */}
                                    <View>
                                        <Text className="text-base font-medium text-gray-700 mb-4">Digital Authentication</Text>
                                        
                                        <View className="space-y-4">
                                            <View className="mb-4">
                                                <Text className="text-sm text-gray-600 mb-2">Registered Phone Number</Text>
                                                <TextInput
                                                    value={registeredPhone}
                                                    onChangeText={setRegisteredPhone}
                                                    placeholder="Registered Phone Number"
                                                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                                />
                                            </View>

                                            <View className="mb-4">
                                                <TouchableOpacity 
                                                    onPress={() => setAuthStatus('Sent')}
                                                    className="h-12 bg-teal-600 rounded-lg items-center justify-center"
                                                >
                                                    <Text className="text-white font-medium">Generate OTP and Link</Text>
                                                </TouchableOpacity>
                                            </View>

                                            <View className="mb-4">
                                                <Text className="text-sm text-gray-600 mb-2">Enter OTP</Text>
                                                <TextInput
                                                    value={otp}
                                                    onChangeText={setOtp}
                                                    placeholder="Enter OTP"
                                                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                                />
                                            </View>

                                            <View className="mb-4">
                                                <TouchableOpacity 
                                                    onPress={() => setAuthStatus('Verified')}
                                                    className="h-12 bg-teal-600 rounded-lg items-center justify-center"
                                                >
                                                    <Text className="text-white font-medium">Verify</Text>
                                                </TouchableOpacity>
                                            </View>

                                            <View className="flex justify-end">
                                                <View className="flex-row items-center mb-4">
                                                    <Text className="text-sm text-gray-600">Authentication Status: </Text>
                                                    <Text className="text-sm font-medium text-gray-700">{authStatus}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Manual Authentication */}
                                    <View className="border-t border-gray-200 pt-8">
                                        <Text className="text-base font-medium text-gray-700 mb-4">Manual Authentication</Text>
                                        
                                        <View className="space-y-4">
                                            <View className="mb-4">
                                                <Text className="text-sm text-gray-600 mb-2">Download Booking Form</Text>
                                                <TouchableOpacity className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between">
                                                    <View className="flex-row items-center gap-2">
                                                        <Ionicons name="download-outline" size={16} color="#6B7280" />
                                                        <Text className="text-sm text-gray-700">Click to download</Text>
                                                    </View>
                                                    <ChevronRight size={16} color={COLORS.gray[400]} />
                                                </TouchableOpacity>
                                            </View>

                                            <View className="mb-4">
                                                <Text className="text-sm text-gray-600 mb-2">Upload Booking Form</Text>
                                                <TouchableOpacity className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between">
                                                    <View className="flex-row items-center gap-2">
                                                        <Ionicons name="cloud-upload-outline" size={16} color="#6B7280" />
                                                        <Text className="text-sm text-gray-700">Upload Booking Form</Text>
                                                    </View>
                                                    <ChevronRight size={16} color={COLORS.gray[400]} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}
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
                ) : activeTab === 'auth' ? (
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

            {/* ── MODALS ──────────────────────────────────────────────────── */}

            {/* Branch */}
            <CustomModal visible={showBranchModal} onClose={() => setShowBranchModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select Branch</Text></View>
                <ScrollView>{branches.map(b => (<TouchableOpacity key={b.id} onPress={() => { setBranch(b.name); setSelectedBranchObj(b); setShowBranchModal(false); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{b.name}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowBranchModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* Country */}
            <CustomModal visible={showCountryModal} onClose={() => setShowCountryModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select Country</Text></View>
                <ScrollView>{countries.map(c => (<TouchableOpacity key={c.id} onPress={() => { setCountrySync(c.name); setShowCountryModal(false); fetchStates(c.id); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{c.name}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowCountryModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* State */}
            <CustomModal visible={showStateModal} onClose={() => setShowStateModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select State</Text></View>
                <ScrollView>{states.map(s => (<TouchableOpacity key={s.id} onPress={() => { setStateValSync(s.name); setCitySync(''); setShowStateModal(false); fetchCities(s.id); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{s.name}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowStateModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* City */}
            <CustomModal visible={showCityModal} onClose={() => setShowCityModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select City</Text></View>
                <ScrollView>{cities.map(c => (<TouchableOpacity key={c.id} onPress={() => { setCitySync(c.name); setShowCityModal(false); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{c.name}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowCityModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* RTO */}
            <CustomModal visible={showRtoModal} onClose={() => setShowRtoModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select RTO</Text></View>
                <ScrollView>{rtos.map(r => (<TouchableOpacity key={r.id} onPress={() => { setRto(`${r.code} - ${r.area}`); setShowRtoModal(false); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{r.code} - {r.area}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowRtoModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* Manufacturer */}
            <CustomModal visible={showManufacturerModal} onClose={() => setShowManufacturerModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select Manufacturer</Text></View>
                <ScrollView>{manufacturers.map(m => (<TouchableOpacity key={m.id} onPress={() => { setManufacturer(m.name); setShowManufacturerModal(false); fetchModels(m.id); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{m.name}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowManufacturerModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* Model */}
            <CustomModal visible={showModelModal} onClose={() => setShowModelModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select Model</Text></View>
                <ScrollView>{models.map(m => {
                    const display = m.modelCode && m.modelName ? `${m.modelCode} - ${m.modelName}` : m.name || m.code || '';
                    return (
                        <TouchableOpacity key={m.id || m._id} onPress={() => { setModel(display); currentModelRef.current = display; setShowModelModal(false); }} className="p-4 border-b border-gray-100">
                            <Text className="text-gray-800">{display}</Text>
                        </TouchableOpacity>
                    );
                })}</ScrollView>
                <TouchableOpacity onPress={() => setShowModelModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* Sales Officer */}
            <CustomModal visible={showSalesOfficerModal} onClose={() => setShowSalesOfficerModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select Sales Officer</Text></View>
                <ScrollView>{salesOfficers.map(o => (<TouchableOpacity key={o.id} onPress={() => { setSalesOfficerSync(o.name || o.profile?.employeeName || ''); setShowSalesOfficerModal(false); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{o.name || o.profile?.employeeName}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowSalesOfficerModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* Referred By */}
            <Modal visible={showReferredByModal} transparent animationType="fade" onRequestClose={() => setShowReferredByModal(false)}>
                <View className="flex-1 bg-black/40 items-center justify-center px-4">
                    <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '70%' }}>
                        <View className="p-4 border-b border-gray-200">
                            <View className="flex-row justify-between items-center mb-3">
                                <Text className="text-lg font-semibold text-gray-800">Select Referred By</Text>
                                <TouchableOpacity onPress={() => setShowReferredByModal(false)}>
                                    <X size={20} color={COLORS.gray[600]} />
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                placeholder="Search by name or phone..."
                                className="h-11 bg-gray-50 border border-gray-300 rounded-lg px-3 text-gray-800"
                                onChangeText={(text) => fetchReferredByOptions(text)}
                                autoFocus
                            />
                        </View>
                        <ScrollView className="max-h-80">
                            {referredByOptions.length > 0 ? referredByOptions.map(o => (
                                <TouchableOpacity key={o.id} onPress={() => { setReferredBySync(o); setShowReferredByModal(false); }} className="p-4 border-b border-gray-100">
                                    <Text className="text-gray-800 font-medium">{o.display || o.name}</Text>
                                </TouchableOpacity>
                            )) : (
                                <View className="p-6 items-center">
                                    <Text className="text-gray-400 text-sm">Type to search customers...</Text>
                                </View>
                            )}
                        </ScrollView>
                        <TouchableOpacity onPress={() => setShowReferredByModal(false)} className="p-3 border-t border-gray-200">
                            <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Relationship */}
            <CustomModal visible={showRelationshipModal} onClose={() => setShowRelationshipModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select Relationship</Text></View>
                <ScrollView>{relationshipOptions.map(o => (<TouchableOpacity key={o.id} onPress={() => { setRelationshipSync(o.name); setShowRelationshipModal(false); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{o.name}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowRelationshipModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* Insurance Type */}
            <CustomModal visible={showInsuranceTypeModal} onClose={() => setShowInsuranceTypeModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select Insurance Type</Text></View>
                <ScrollView>{['Comprehensive', 'Third Party', 'Zero Dep'].map(t => (<TouchableOpacity key={t} onPress={() => { setInsuranceType(t); setShowInsuranceTypeModal(false); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{t}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowInsuranceTypeModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* Loan Type */}
            <CustomModal visible={showLoanTypeModal} onClose={() => setShowLoanTypeModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select Loan Type</Text></View>
                <ScrollView>{['Self', 'Company Assisted'].map(t => (<TouchableOpacity key={t} onPress={() => { setLoanType(t); setShowLoanTypeModal(false); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{t}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowLoanTypeModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* Tenure */}
            <CustomModal visible={showTenureModal} onClose={() => setShowTenureModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select Tenure</Text></View>
                <ScrollView>{['1','2','3','6','12','24','36','48','60'].map(t => (<TouchableOpacity key={t} onPress={() => { setTenure(t); setShowTenureModal(false); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{t} months</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowTenureModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* EMI Day */}
            <CustomModal visible={showEmiDayModal} onClose={() => setShowEmiDayModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select EMI Day</Text></View>
                <ScrollView>{Array.from({ length: 31 }, (_, i) => i + 1).map(d => (<TouchableOpacity key={d} onPress={() => { setEmiDay(d.toString()); setShowEmiDayModal(false); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{d}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowEmiDayModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* Financer */}
            <Modal visible={showFinancerModal} transparent animationType="fade" onRequestClose={() => setShowFinancerModal(false)}>
                <View className="flex-1 bg-black/40 items-center justify-center px-4">
                    <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '60%' }}>
                        <View className="p-4 border-b border-gray-200">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-lg font-semibold text-gray-800">Select Financier</Text>
                                <TouchableOpacity onPress={() => setShowFinancerModal(false)}>
                                    <X size={20} color={COLORS.gray[600]} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <ScrollView>
                            {financerOptions.length > 0 ? financerOptions.map(o => (
                                <TouchableOpacity key={o.id} onPress={() => { setFinancer(o.name); setSelectedFinancerId(o.id); setShowFinancerModal(false); }} className="p-4 border-b border-gray-100">
                                    <Text className={`text-gray-800 ${selectedFinancerId === o.id ? 'font-bold text-teal-700' : ''}`}>{o.name}</Text>
                                </TouchableOpacity>
                            )) : (
                                <View className="p-6 items-center">
                                    <Text className="text-gray-400 text-sm">No financiers available</Text>
                                </View>
                            )}
                        </ScrollView>
                        <TouchableOpacity onPress={() => setShowFinancerModal(false)} className="p-3 border-t border-gray-200">
                            <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* EMI Start Date Calendar */}
            <Modal visible={showEmiStartDateModal} transparent animationType="fade" onRequestClose={() => setShowEmiStartDateModal(false)}>
                <View className="flex-1 bg-black/40 items-center justify-center px-4">
                    <View className="bg-white rounded-2xl p-4 w-full max-w-md">
                        <Text className="text-gray-900 font-bold mb-3">Select EMI Start Date</Text>
                        <RNCalendar
                            current={emiStartDate ? emiStartDate.split('/').reverse().join('-') : undefined}
                            minDate={new Date().toISOString().split('T')[0]}
                            maxDate={(() => { const d = new Date(); d.setMonth(d.getMonth() + 2); return d.toISOString().split('T')[0]; })()}
                            onDayPress={(day: any) => {
                                const [yyyy, mm, dd] = day.dateString.split('-');
                                setEmiStartDate(`${dd}/${mm}/${yyyy}`);
                                setShowEmiStartDateModal(false);
                            }}
                            theme={{ todayTextColor: COLORS.primary, selectedDayBackgroundColor: COLORS.primary, selectedDayTextColor: '#fff', arrowColor: COLORS.primary }}
                            markedDates={emiStartDate ? { [emiStartDate.split('/').reverse().join('-')]: { selected: true, selectedColor: COLORS.primary } } : undefined}
                        />
                        <View className="flex-row justify-end mt-4">
                            <TouchableOpacity onPress={() => setShowEmiStartDateModal(false)} className="px-4 py-2 rounded-lg bg-teal-600">
                                <Text className="text-white font-semibold">Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Attach Quotation */}
            <AttachQuotationModal visible={showAttachQuotationModal} onClose={() => setShowAttachQuotationModal(false)} onAttach={handleAttachQuotation} />

            {/* Accessory */}
            <AccessoryModal visible={showAccessoryModal} onClose={() => setShowAccessoryModal(false)} onSave={handleAccessorySave} initialAccessories={accessories} />

            {/* DOB Calendar — 3-step: Year → Month → Day */}
            <Modal visible={showCalendarModal} transparent animationType="fade" onRequestClose={() => setShowCalendarModal(false)}>
                <View className="flex-1 bg-black/40 items-center justify-center px-4">
                    <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
                        {/* Header */}
                        <View className="bg-teal-600 px-5 py-4">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-white text-lg font-bold">Select Date of Birth</Text>
                                <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                                    <X size={22} color="white" />
                                </TouchableOpacity>
                            </View>
                            <Text className="text-teal-100 text-sm mt-1">
                                {dobCalendarStep === 'year' ? 'Step 1: Choose Year' : dobCalendarStep === 'month' ? 'Step 2: Choose Month' : 'Step 3: Choose Day'}
                            </Text>
                            {/* Breadcrumb */}
                            <View className="flex-row items-center mt-2">
                                <TouchableOpacity onPress={() => setDobCalendarStep('year')}>
                                    <Text className={`text-sm font-semibold ${dobCalendarStep === 'year' ? 'text-white' : 'text-teal-200'}`}>{dobPickYear}</Text>
                                </TouchableOpacity>
                                {dobCalendarStep !== 'year' && (
                                    <>
                                        <Text className="text-teal-200 mx-1">›</Text>
                                        <TouchableOpacity onPress={() => setDobCalendarStep('month')}>
                                            <Text className={`text-sm font-semibold ${dobCalendarStep === 'month' ? 'text-white' : 'text-teal-200'}`}>
                                                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dobPickMonth]}
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                                {dobCalendarStep === 'day' && (
                                    <>
                                        <Text className="text-teal-200 mx-1">›</Text>
                                        <Text className="text-white text-sm font-semibold">Day</Text>
                                    </>
                                )}
                            </View>
                        </View>

                        <View className="p-4">
                            {/* STEP 1: Year Selection */}
                            {dobCalendarStep === 'year' && (
                                <FlatList
                                    data={Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i)}
                                    keyExtractor={(item) => item.toString()}
                                    numColumns={4}
                                    style={{ maxHeight: 320 }}
                                    showsVerticalScrollIndicator={false}
                                    initialScrollIndex={Math.max(0, new Date().getFullYear() - dobPickYear - 2)}
                                    getItemLayout={(_, index) => ({ length: 52, offset: 52 * index, index })}
                                    renderItem={({ item: year }) => {
                                        const isSelected = year === dobPickYear;
                                        const isFuture = year > new Date().getFullYear();
                                        return (
                                            <TouchableOpacity
                                                disabled={isFuture}
                                                onPress={() => { setDobPickYear(year); setDobCalendarStep('month'); }}
                                                className={`flex-1 m-1 py-3 rounded-xl items-center justify-center ${isSelected ? 'bg-teal-600' : 'bg-gray-50 border border-gray-200'} ${isFuture ? 'opacity-30' : ''}`}
                                            >
                                                <Text className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-700'}`}>{year}</Text>
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                            )}

                            {/* STEP 2: Month Selection */}
                            {dobCalendarStep === 'month' && (
                                <View className="flex-row flex-wrap">
                                    {['January','February','March','April','May','June','July','August','September','October','November','December'].map((monthName, idx) => {
                                        const isSelected = idx === dobPickMonth;
                                        const now = new Date();
                                        const isFuture = dobPickYear === now.getFullYear() && idx > now.getMonth();
                                        return (
                                            <TouchableOpacity
                                                key={monthName}
                                                disabled={isFuture}
                                                onPress={() => { setDobPickMonth(idx); setDobCalendarStep('day'); }}
                                                className={`w-1/3 p-1`}
                                            >
                                                <View className={`py-3 rounded-xl items-center ${isSelected ? 'bg-teal-600' : 'bg-gray-50 border border-gray-200'} ${isFuture ? 'opacity-30' : ''}`}>
                                                    <Text className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-700'}`}>{monthName.slice(0, 3)}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}

                            {/* STEP 3: Day Selection */}
                            {dobCalendarStep === 'day' && (() => {
                                const daysInMonth = new Date(dobPickYear, dobPickMonth + 1, 0).getDate();
                                const firstDayOfWeek = new Date(dobPickYear, dobPickMonth, 1).getDay();
                                const now = new Date();
                                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                                const selectedDobStr = dob && dob.includes('/') ? dob.split('/').reverse().join('-') : '';
                                const daySlots: (number | null)[] = [...Array(firstDayOfWeek).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

                                return (
                                    <View>
                                        {/* Month/Year nav */}
                                        <View className="flex-row justify-between items-center mb-3">
                                            <TouchableOpacity onPress={() => {
                                                if (dobPickMonth === 0) { setDobPickMonth(11); setDobPickYear(dobPickYear - 1); }
                                                else setDobPickMonth(dobPickMonth - 1);
                                            }} className="p-2">
                                                <ChevronLeft size={20} color="#0d9488" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setDobCalendarStep('month')}>
                                                <Text className="text-base font-bold text-teal-700">
                                                    {['January','February','March','April','May','June','July','August','September','October','November','December'][dobPickMonth]} {dobPickYear}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => {
                                                const isCurrentMonth = dobPickYear === now.getFullYear() && dobPickMonth === now.getMonth();
                                                if (!isCurrentMonth) {
                                                    if (dobPickMonth === 11) { setDobPickMonth(0); setDobPickYear(dobPickYear + 1); }
                                                    else setDobPickMonth(dobPickMonth + 1);
                                                }
                                            }} className="p-2">
                                                <ChevronRight size={20} color="#0d9488" />
                                            </TouchableOpacity>
                                        </View>

                                        {/* Weekday headers */}
                                        <View className="flex-row mb-1">
                                            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                                                <View key={d} className="flex-1 items-center py-1">
                                                    <Text className="text-xs font-semibold text-teal-600">{d}</Text>
                                                </View>
                                            ))}
                                        </View>

                                        {/* Day grid */}
                                        <View className="flex-row flex-wrap">
                                            {daySlots.map((day, idx) => {
                                                if (day === null) {
                                                    return <View key={`empty-${idx}`} style={{ width: '14.28%', height: 42 }} />;
                                                }
                                                const dateStr = `${dobPickYear}-${String(dobPickMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                const isFuture = dateStr > todayStr;
                                                const isSelected = dateStr === selectedDobStr;
                                                const isToday = dateStr === todayStr;
                                                return (
                                                    <TouchableOpacity
                                                        key={day}
                                                        disabled={isFuture}
                                                        onPress={() => handleDateSelect(dateStr)}
                                                        style={{ width: '14.28%', height: 42 }}
                                                        className="items-center justify-center"
                                                    >
                                                        <View className={`w-9 h-9 rounded-full items-center justify-center ${isSelected ? 'bg-teal-600' : isToday ? 'border-2 border-teal-500' : ''}`}>
                                                            <Text className={`text-sm ${isSelected ? 'text-white font-bold' : isFuture ? 'text-gray-300' : isToday ? 'text-teal-600 font-bold' : 'text-gray-800'}`}>{day}</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                );
                            })()}
                        </View>

                        {/* Footer */}
                        <View className="flex-row justify-between items-center px-5 py-3 border-t border-gray-100">
                            {dobCalendarStep !== 'year' ? (
                                <TouchableOpacity onPress={() => setDobCalendarStep(dobCalendarStep === 'day' ? 'month' : 'year')} className="px-4 py-2 rounded-lg bg-gray-100">
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

            {/* Expected Delivery Calendar */}
            <Modal visible={showExpectedDeliveryModal} transparent animationType="fade" onRequestClose={() => setShowExpectedDeliveryModal(false)}>
                <View className="flex-1 bg-black/40 items-center justify-center px-4">
                    <View className="bg-white rounded-2xl p-4 w-full max-w-md">
                        <Text className="text-gray-900 font-bold mb-3">Select Expected Delivery Date</Text>
                        <RNCalendar
                            current={expectedDelivery ? expectedDelivery.split('/').reverse().join('-') : undefined}
                            minDate={new Date().toISOString().split('T')[0]}
                            onDayPress={(day: any) => {
                                const [yyyy, mm, dd] = day.dateString.split('-');
                                setExpectedDeliverySync(`${dd}/${mm}/${yyyy}`);
                                setShowExpectedDeliveryModal(false);
                            }}
                            theme={{ todayTextColor: COLORS.primary, selectedDayBackgroundColor: COLORS.primary, selectedDayTextColor: '#fff', arrowColor: COLORS.primary }}
                            markedDates={expectedDelivery ? { [expectedDelivery.split('/').reverse().join('-')]: { selected: true, selectedColor: COLORS.primary } } : undefined}
                        />
                        <View className="flex-row justify-end mt-4">
                            <TouchableOpacity onPress={() => setShowExpectedDeliveryModal(false)} className="px-4 py-2 rounded-lg bg-teal-600">
                                <Text className="text-white font-semibold">Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}