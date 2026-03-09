import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { unstable_batchedUpdates } from 'react-native';
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Alert,
    Modal,
    FlatList,
    Platform,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Calendar, Clock, ChevronLeft, Edit2, Trash2 } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../../constants/colors';
import { Calendar as RNCalendar } from 'react-native-calendars';
import moment from 'moment';
import {
    getCustomerById,
    getCustomerDetails,
    getCountries,
    getStates,
    getCities,
    verifyGST,
    getCustomerQuotations,
    getQuotationByCustomerId,
    searchQuotations,
    updateCustomer
} from '../../src/api';
import { Button } from '../../components/ui/Button';
import { BackButton, HeaderWithBack, useBackButton, backNavigationHelpers } from '../../components/ui/BackButton';
import DateTimePicker from '@react-native-community/datetimepicker';
import BookingConfirmActivityScreen from '../follow-ups/BookingConfirmActivityScreen';
import { useToast } from '../../src/ToastContext';
import { RootStackParamList } from '../../navigation/types';

// Validation regex patterns from autoinn-fe
const alphaNumericNameRegex = /^[A-Za-z0-9 ]+$/;
const optionalEmailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Validation functions from autoinn-fe
const validateAlphaName = (value: string): string | null => {
    if (!value || !value.trim()) {
        return null; // Can be empty (conditional requirement)
    }
    if (!alphaNumericNameRegex.test(value.trim())) {
        return "Enter Valid Name";
    }
    return null;
};

const validateOptionalEmail = (value: string): string | null => {
    if (!value || !value.trim()) {
        return null; // Can be empty (optional field)
    }
    if (!optionalEmailRegex.test(value.trim())) {
        return "Please enter a valid email address";
    }
    return null;
};

type CustomerDetailsRouteProp = RouteProp<any, 'CustomerDetails'>;

const FormLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
    <Text className="text-sm text-gray-700 mb-1.5 font-medium">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
    </Text>
);

interface PhoneNumber {
    number: string;
    type: 'Primary' | 'Alternate';
    validity: 'Valid' | 'Invalid';
    whatsApp: 'Yes' | 'No';
    dnd: 'Yes' | 'No';
}

interface Quotation {
    date: string;
    quotationId: string;
    modelCode: string;
    modelName: string;
}

interface Customer {
    customerId: string;
    customerType: string;
    salutation: string;
    name: string;
    fatherName: string;
    gender: 'Male' | 'Female';
    dob: string;
    email: string;
    gstType: string;
    gstin: string;
    customerGrouping: string;
    phoneNumbers: PhoneNumber[];
    billingAddress: {
        line1: string;
        line2: string;
        line3: string;
        locality: string;
        country: string;
        city: string;
        state: string;
        pincode: string;
    };
    shippingAddress: {
        line1: string;
        line2: string;
        line3: string;
        locality: string;
        country: string;
        city: string;
        state: string;
        pincode: string;
    };
}

const CUSTOMER_TABS = [
    { id: 'customer-details', label: 'Customer Details' },
    { id: 'associated-vehicles', label: 'Associated Vehicles' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'quotations', label: 'Quotations' },
    { id: 'job-orders', label: 'Job Orders' },
    { id: 'spare-orders', label: 'Spare Orders' },
    { id: 'call-history', label: 'Call History' },
    { id: 'number-plates', label: 'Number Plates' },
    { id: 'payments', label: 'Payments' },
] as const;

function CustomerDetailsScreenComponent() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'CustomerDetails'>>();
    const route = useRoute<CustomerDetailsRouteProp>();
    const toast = useToast();
    
    // Create a ref to persist navigation across re-renders
    const navigationRef = useRef(navigation);
    navigationRef.current = navigation;
    
    // Add mount guard to prevent stale instance navigation
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { 
            isMounted.current = false; 
            console.log('💀 CustomerDetailsScreen - Component unmounting:', {
                customerId: route.params?.customerId,
                timestamp: new Date().toISOString()
            });
        };
    }, [route.params?.customerId]);

    // Debug navigation context at component initialization
    console.log('🚀 CustomerDetailsScreen - Component initialization:', {
        hasNavigation: !!navigation,
        hasNavigate: !!(navigation && navigation.navigate),
        navigationType: typeof navigation,
        navigationMethods: navigation ? Object.keys(navigation) : [],
        routeParams: route.params,
        customerId: route.params?.customerId,
        timestamp: new Date().toISOString()
    });

    // Memoize customerId to prevent infinite re-renders
    const customerId = useMemo(() => route.params?.customerId, [route.params?.customerId]);

    // Define safeNavigate BEFORE useBackButton hook - Fix 2
    const safeNavigate = useCallback((screen: keyof RootStackParamList, params?: any) => {
        // Prevent stale instance navigation - Fix 1
        if (!isMounted.current) {
            console.log('🚫 safeNavigate blocked - component unmounted');
            return;
        }
        
        const currentNavigation = navigationRef.current;
        
        console.log('🧭 safeNavigate called:', {
            screen,
            params,
            hasNavigation: !!currentNavigation,
            hasNavigate: !!(currentNavigation && currentNavigation.navigate),
            navigationType: typeof currentNavigation,
            stackTrace: new Error().stack?.split('\n').slice(1, 4).join('\n')
        });

        try {
            if (!currentNavigation) {
                console.error('❌ Navigation context not available');
                return;
            }
            console.log('🧭 Attempting navigation to:', screen, params);
            currentNavigation.navigate(screen, params);
        } catch (error) {
            console.error('❌ Navigation error:', error);
            console.error('❌ Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'No stack trace'
            });
            
            // If it's a navigation context error, wait and retry
            if (error instanceof Error && error.message.includes('navigation context')) {
                console.log('⏳ Navigation context error detected, waiting 100ms to retry...');
                setTimeout(() => {
                    // Check if still mounted before retry
                    if (!isMounted.current) {
                        console.log('🚫 Retry blocked - component unmounted');
                        return;
                    }
                    try {
                        const retryNavigation = navigationRef.current;
                        if (retryNavigation && retryNavigation.navigate) {
                            console.log('🔄 Retrying navigation after delay');
                            retryNavigation.navigate(screen, params);
                        }
                    } catch (retryError) {
                        console.error('❌ Retry navigation failed:', retryError);
                    }
                }, 100);
                return;
            }
            
            // Try direct navigation as fallback
            try {
                if (currentNavigation) {
                    console.log('🔄 Trying fallback navigation');
                    currentNavigation.navigate(screen, params);
                }
            } catch (fallbackError) {
                console.error('❌ Fallback navigation also failed:', fallbackError);
            }
        }
    }, []); // Remove navigation from dependencies since we use ref

    // Determine the back navigation target based on how we got here
    const getBackNavigationTarget = () => {
        // Check if we came from FollowUpDetail by looking at navigation state
        const state = navigation.getState();
        const previousRoute = state?.routes?.[state.index - 1];
        
        if (previousRoute?.name === 'FollowUpDetail') {
            // Go back to FollowUpDetail using goBack() to preserve the exact state
            return { screen: 'FollowUpDetail' as const, useGoBack: true };
        } else if (previousRoute?.name === 'FollowUps') {
            // Go back to FollowUps using goBack()
            return { screen: 'FollowUps' as const, useGoBack: true };
        } else if (previousRoute?.name === 'Main') {
            // Go back to Main using goBack()
            return { screen: 'Main' as const, useGoBack: true };
        } else {
            // Default behavior - go to Main
            return { screen: 'Main' as const, useGoBack: false };
        }
    };

    // Use the custom back button hook after safeNavigate is defined
    useBackButton({
        onBackPress: () => {
            const target = getBackNavigationTarget();
            console.log(`🔍 Closing CustomerDetails, navigating to ${target.screen}`);
            
            if (target.useGoBack) {
                navigation.goBack();
            } else {
                safeNavigate(target.screen as any);
            }
        },
    });

    // Guard for missing customerId
    if (!customerId) {
        console.log('❌ No customerId found');

        // Try to get customerId from other sources
        const customerIdFromParams = route.params?.customerId;
        const customerIdFromState = route.params?.id;
        const customerIdFromQuery = route.params?.customer_id;

        console.log('🔍 Trying alternative sources:', {
            customerIdFromParams,
            customerIdFromState,
            customerIdFromQuery
        });

        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-gray-100">
                <Text className="text-lg text-red-600 text-center px-4">
                    No customer selected. Please navigate to this screen from the customer list.
                </Text>
                <Text className="text-sm text-gray-600 text-center px-4 mt-2">
                    Debug: No route params available
                </Text>
            </SafeAreaView>
        );
    }

    
    const [activeTab, setActiveTab] = useState('customer-details');
    const [loading, setLoading] = useState(true);
    const [loadingQuotations, setLoadingQuotations] = useState(false);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [customerDetails, setCustomerDetails] = useState<any>(null);
    const [quotations, setQuotations] = useState<any[]>([]);
    const [associatedVehicles, setAssociatedVehicles] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [jobOrders, setJobOrders] = useState<any[]>([]);
    const [spareOrders, setSpareOrders] = useState<any[]>([]);
    const [callHistory, setCallHistory] = useState<any[]>([]);
    const [numberPlates, setNumberPlates] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
    const [newPhone, setNewPhone] = useState('');
    const [sameAsBilling, setSameAsBilling] = useState(false);

    // Call Activity states
    const [showFollowUpDatePicker, setShowFollowUpDatePicker] = useState(false);
    const [showDobDatePicker, setShowDobDatePicker] = useState(false);
    const [showDobCalendarModal, setShowDobCalendarModal] = useState(false);
    const [followUpDate, setFollowUpDate] = useState('');
    const [followUpTime, setFollowUpTime] = useState('');
    const [followUpDateError, setFollowUpDateError] = useState('');
    const [enquiryType, setEnquiryType] = useState('Hot');
    const [remarks, setRemarks] = useState('');

    const getVehicleNames = (obj: any): string[] => {
        if (!obj) return [];
        if (typeof obj === 'string') return [obj];
        if (Array.isArray(obj)) {
            return obj.flatMap(item => getVehicleNames(item));
        }

        const name = obj.modelName || obj.vehicleName || obj.vehicleLabel ||
            obj.vehicleMaster?.modelName || obj.vehicleDetail?.modelName ||
            obj.vehicle?.modelName || obj.vehicle?.name;

        if (name) return [name];

        if (obj.vehicle) return getVehicleNames(obj.vehicle);
        if (obj.vehicleDetail) return getVehicleNames(obj.vehicleDetail);
        if (obj.vehicleMaster) return getVehicleNames(obj.vehicleMaster);

        return [];
    };

    // Validation state from autoinn-fe
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [checkAll, setCheckAll] = useState(true);
    const [checkName, setCheckName] = useState(true);
    const [isGstRequired, setIsGstRequired] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Dropdown data state
    const [countries, setCountries] = useState<Array<{ id: string; name: string }>>([]);
    const [states, setStates] = useState<Array<{ id: string; name: string }>>([]);
    const [districts, setDistricts] = useState<Array<{ id: string; name: string }>>([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);

    // Form state
    const [customerType, setCustomerType] = useState('Non-Customer');
    const [salutation, setSalutation] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [fatherName, setFatherName] = useState('');
    const [gender, setGender] = useState('Male');
    const [dob, setDob] = useState('');
    const [email, setEmail] = useState('');
    const [gstTypeValue, setGstTypeValue] = useState('Unregistered');
    const [gstin, setGstin] = useState('');
    const [newPhoneType, setNewPhoneType] = useState<string>('Alternate');
    const [newWhatsApp, setNewWhatsApp] = useState<string>('No');
    const [newDND, setNewDND] = useState<string>('No');
    const [customerGrouping, setCustomerGrouping] = useState('');
    const [displayCustomerId, setDisplayCustomerId] = useState('');
    const [gstName, setGstName] = useState('');
    const [gstStatus, setGstStatus] = useState('');

    // Dropdown layout state for relative positioning
    const [dropdownLayout, setDropdownLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    // Refs for dropdown anchors
    const gstTypeRef = useRef<View>(null);
    const countryRef = useRef<View>(null);
    const stateRef = useRef<View>(null);
    const cityRef = useRef<View>(null);
    const shippingCountryRef = useRef<View>(null);
    const shippingStateRef = useRef<View>(null);
    const shippingCityRef = useRef<View>(null);
    const customerGroupingRef = useRef<View>(null);
    const salutationRef = useRef<View>(null);
    const customerTypeRef = useRef<View>(null);

    // Address state
    const [billingAddress1, setBillingAddress1] = useState('');
    const [billingAddress2, setBillingAddress2] = useState('');
    const [billingAddress3, setBillingAddress3] = useState('');

    const [billingLocality, setBillingLocality] = useState('');
    const [billingCountryId, setBillingCountryId] = useState('');
    const [billingStateId, setBillingStateId] = useState('');
    const [billingDistrictId, setBillingDistrictId] = useState('');
    const [billingPincode, setBillingPincode] = useState('');
    const [shippingAddress1, setShippingAddress1] = useState('');
    const [shippingAddress2, setShippingAddress2] = useState('');
    const [shippingAddress3, setShippingAddress3] = useState('');
    const [shippingLocality, setShippingLocality] = useState('');
    const [shippingCountryId, setShippingCountryId] = useState('');
    const [shippingStateId, setShippingStateId] = useState('');
    const [shippingDistrictId, setShippingDistrictId] = useState('');
    const [shippingPincode, setShippingPincode] = useState('');

    // Dropdown options from autoinn-fe
    const customerTypes = [
        { key: "Customer", title: "Customer" },
        { key: "Non-Customer", title: "Non-Customer" },
        { key: "Non-Individual", title: "Non-Individual" },
    ];

    const salutations = [
        { key: "Mr", title: "Mr" },
        { key: "Mrs", title: "Mrs" },
        { key: "Ms", title: "Ms" },
        { key: "Dr", title: "Dr" },
        { key: "Prof", title: "Prof" },
        { key: "Rev", title: "Rev" },
    ];

    const gstTypes = [
        { key: "Registered", title: "Registered" },
        { key: "Unregistered", title: "Unregistered" },
        { key: "UINHolder", title: "UIN Holder" },
        { key: "Composition", title: "Composition" },
    ];

    const phoneTypes = [
        { key: "Primary", title: "Primary" },
        { key: "Alternate", title: "Alternate" },
        { key: "Office", title: "Office" },
        { key: "Home", title: "Home" },
        { key: "Mobile", title: "Mobile" },
    ];

    const yesNoOptions = [
        { key: "Yes", title: "Yes" },
        { key: "No", title: "No" },
    ];

    const customerGroupingOptions = [
        { key: "Individual", title: "Individual" },
        { key: "Non-Individual", title: "Non-Individual" },
    ];

    // Date picker states
    const [showCustomerGroupingDropdown, setShowCustomerGroupingDropdown] = useState(false);
    const [showSalutationDropdown, setShowSalutationDropdown] = useState(false);
    const [showCustomerTypeDropdown, setShowCustomerTypeDropdown] = useState(false);
    const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
    const [selectedHour, setSelectedHour] = useState<number | null>(null);
    const [selectedMinute, setSelectedMinute] = useState<string | null>(null);

    // Phone number editing states
    const [editingPhoneIndex, setEditingPhoneIndex] = useState<number | null>(null);
    const [showEditPhoneModal, setShowEditPhoneModal] = useState(false);
    const [editPhoneData, setEditPhoneData] = useState({
        number: '',
        type: 'Alternate',
        whatsApp: 'No',
        dnd: 'No'
    });
    const [showPhoneTypeDropdown, setShowPhoneTypeDropdown] = useState(false);
    const [showWhatsAppDropdown, setShowWhatsAppDropdown] = useState(false);
    const [showDNDDropdown, setShowDNDDropdown] = useState(false);

    // GST dropdown state
    const [showGSTTypeDropdown, setShowGSTTypeDropdown] = useState(false);

    // Location dropdown states
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [showStateDropdown, setShowStateDropdown] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [showShippingCountryDropdown, setShowShippingCountryDropdown] = useState(false);
    const [showShippingStateDropdown, setShowShippingStateDropdown] = useState(false);
    const [showShippingCityDropdown, setShowShippingCityDropdown] = useState(false);
    const timeFieldRef = useRef<any>(null);
    const [timeDropdownLayout, setTimeDropdownLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    // Phone number editing handlers
    const handleEditPhone = (index: number) => {
        const phone = phoneNumbers[index];
        setEditPhoneData({
            number: phone?.number || '',
            type: phone?.type || 'Alternate',
            whatsApp: phone?.whatsApp || 'No',
            dnd: phone?.dnd || 'No'
        });
        setEditingPhoneIndex(index);
        setShowEditPhoneModal(true);
    };

    const handlePhoneTypeChange = (index: number | null, type: any) => {
        if (index !== null) {
            // Update edit modal data
            setEditPhoneData(prev => ({ ...prev, type }));
        } else {
            setNewPhoneType(type);
        }
        setShowPhoneTypeDropdown(false);
    };

    const handleWhatsAppChange = (index: number | null, whatsApp: any) => {
        if (index !== null) {
            // Update edit modal data
            setEditPhoneData(prev => ({ ...prev, whatsApp }));
        } else {
            setNewWhatsApp(whatsApp);
        }
        setShowWhatsAppDropdown(false);
    };

    const handleDNDChange = (index: number | null, dnd: any) => {
        if (index !== null) {
            // Update edit modal data
            setEditPhoneData(prev => ({ ...prev, dnd }));
        } else {
            setNewDND(dnd);
        }
        setShowDNDDropdown(false);
    };

    const handleSavePhoneEdit = () => {
        if (editingPhoneIndex !== null) {
            const updatedPhones = [...phoneNumbers];
            updatedPhones[editingPhoneIndex] = {
                ...updatedPhones[editingPhoneIndex],
                ...editPhoneData
            };
            setPhoneNumbers(updatedPhones);
            setShowEditPhoneModal(false);
            setEditingPhoneIndex(null);
        }
    };

    const handleCancelPhoneEdit = () => {
        setShowEditPhoneModal(false);
        setEditingPhoneIndex(null);
        setEditPhoneData({
            number: '',
            type: 'Alternate',
            whatsApp: 'No',
            dnd: 'No'
        });
    };

    const handleDeletePhone = (index: number) => {
        const updatedPhones = phoneNumbers.filter((_, i) => i !== index);
        setPhoneNumbers(updatedPhones);
    };

    // Time options
    const buildHourOptions = () => {
        const hours = [];
        for (let i = 0; i < 24; i++) {
            hours.push(i.toString().padStart(2, '0'));
        }
        return hours;
    };

    const minuteOptions = ['00', '15', '30', '45'];

    const parseDateInput = (value: string) => {
        const parts = value.split(/[\/\-]/).map((p) => p.trim());
        if (parts.length < 3) return null;
        const [dd, mm, yyyy] = parts;
        const day = Number(dd);
        const month = Number(mm);
        const year = Number(yyyy);
        if (!day || !month || !year) return null;
        const date = new Date(year, month - 1, day);
        if (Number.isNaN(date.getTime())) return null;
        return date;
    };

    const isPastDate = (value: string) => {
        const date = parseDateInput(value);
        if (!date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return date < today;
    };

    const openTimeDropdown = () => {
        if (!followUpDate?.trim()) return;
        if (timeFieldRef.current && typeof (timeFieldRef.current as any).measureInWindow === 'function') {
            (timeFieldRef.current as any).measureInWindow((x: number, y: number, width: number, height: number) => {
                setTimeDropdownLayout({ x, y, width, height });
                setTimeDropdownOpen(true);
            });
        } else {
            setTimeDropdownOpen(true);
        }
    };

    // Separate function to fetch quotations with multiple strategies
    const fetchQuotations = async (customerIdentifier: string) => {
        console.log('🔍 fetchQuotations - Starting with identifier:', customerIdentifier);
        setLoadingQuotations(true);

        try {
            // Strategy 1: Try getCustomerQuotations first
            console.log('📋 Strategy 1: Calling getCustomerQuotations with:', customerIdentifier);
            const response1 = await getCustomerQuotations(customerIdentifier);
            console.log('📋 Strategy 1 - Response:', {
                status: response1?.status,
                hasData: !!response1?.data,
                dataKeys: response1?.data ? Object.keys(response1.data) : []
            });

            // Debug the actual response structure
            console.log('🔍 Strategy 1 - Response received successfully');

            let quotationsData = response1.data?.response?.data || response1.data?.data || response1.data;

            // Check if data is in response.response instead of response.response.data
            if (!Array.isArray(quotationsData) && response1.data?.response) {
                console.log('🔍 Trying alternative data extraction - response.response');
                quotationsData = response1.data?.response;
            }

            // Check if data is in response.data directly
            if (!Array.isArray(quotationsData) && Array.isArray(response1.data?.data)) {
                console.log('🔍 Found data in response.data directly');
                quotationsData = response1.data?.data;
            }

            if (Array.isArray(quotationsData) && quotationsData.length > 0) {
                console.log('✅ Strategy 1 succeeded - Found', quotationsData.length, 'quotations');
                if (!isMounted.current) return;
                setQuotations(quotationsData);
                setLoadingQuotations(false);
                return;
            } else if (Array.isArray(quotationsData) && quotationsData.length === 0) {
                console.log('⚠️ Strategy 1 returned empty array - Customer has no quotations');
                // Set empty array but don't try other strategies
                if (!isMounted.current) return;
                setQuotations([]);
                setLoadingQuotations(false);
                return;
            }

            // Strategy 2: Try getQuotationByCustomerId
            console.log('📋 Strategy 2: Calling getQuotationByCustomerId with:', customerIdentifier);
            const response2 = await getQuotationByCustomerId(customerIdentifier);
            console.log('📋 Strategy 2 - Response:', {
                status: response2?.status,
                hasData: !!response2?.data
            });

            quotationsData = response2.data?.response?.data || response2.data?.data || response2.data;

            if (Array.isArray(quotationsData) && quotationsData.length > 0) {
                console.log('✅ Strategy 2 succeeded - Found', quotationsData.length, 'quotations');
                if (!isMounted.current) return;
                setQuotations(quotationsData);
                setLoadingQuotations(false);
                return;
            }

            // Strategy 3: Try searchQuotations
            console.log('📋 Strategy 3: Calling searchQuotations with customerId:', customerIdentifier);
            const response3 = await searchQuotations({
                module: 'customer',
                column: 'customerId',
                searchString: customerIdentifier,
                size: 100,
                page: 1
            });
            console.log('📋 Strategy 3 - Response:', {
                status: response3?.status,
                hasData: !!response3?.data
            });

            quotationsData = response3.data?.response?.data || response3.data?.data || response3.data;

            if (Array.isArray(quotationsData) && quotationsData.length > 0) {
                console.log('✅ Strategy 3 succeeded - Found', quotationsData.length, 'quotations');
                if (!isMounted.current) return;
                setQuotations(quotationsData);
                setLoadingQuotations(false);
                return;
            }

            // Strategy 4: Check if quotations are in the master customer data
            if (customer && customer.quotations) {
                console.log('📋 Strategy 4: Checking master customer quotations');
                const masterQuotations = Array.isArray(customer.quotations) ? customer.quotations : [customer.quotations];
                if (masterQuotations.length > 0) {
                    console.log('✅ Strategy 4 succeeded - Found', masterQuotations.length, 'quotations from master');
                    if (!isMounted.current) return;
                    setQuotations(masterQuotations);
                    setLoadingQuotations(false);
                    return;
                }
            }

            console.log('⚠️ All strategies failed - No quotations found');
            if (!isMounted.current) return;
            setQuotations([]);

        } catch (error) {
            console.error('❌ Error in fetchQuotations:', error);
            if (error.response) {
                console.error('❌ Error response:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                });
            }
            if (!isMounted.current) return;
            setQuotations([]);
        } finally {
            if (!isMounted.current) return;
            setLoadingQuotations(false);
        }
    };

    const fetchCustomerData = async () => {
        console.log('🎯 fetchCustomerData entry - customerId:', customerId);
        if (!customerId) {
            console.log('❌ No customerId found, returning');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log('🌐 Fetching customer details for:', customerId);

            // Fetch detailed customer information
            const detailsResponse = await getCustomerDetails(customerId);
            console.log('📄 Customer details response:', {
                status: detailsResponse?.status,
                hasData: !!detailsResponse?.data
            });

            const detailsData = detailsResponse.data?.response?.data || detailsResponse.data?.data || detailsResponse.data;
            console.log('📊 detailsData structure:', detailsData ? Object.keys(detailsData) : null);

            // Determine which object is the actual customer record
            let masterCustomer = detailsData?.customer || detailsData;

            if (!masterCustomer || (!masterCustomer.id && !masterCustomer.customerId)) {
                // Fallback to getCustomerById if details doesn't have it
                console.log('🔄 Falling back to getCustomerById');
                const customerResponse = await getCustomerById(customerId);
                masterCustomer = customerResponse.data?.response?.data || customerResponse.data?.data || customerResponse.data;
            }

            // Fix 3: Batch state updates to reduce re-renders
            if (!isMounted.current) return;
            unstable_batchedUpdates(() => {
                setCustomerDetails(detailsData);
                setCustomer(masterCustomer);

                // Set associated arrays from the correct source
                setAssociatedVehicles(masterCustomer?.purchasedVehicle || []);
                setBookings(masterCustomer?.booking || []);
                setJobOrders(detailsData?.jobOrders || masterCustomer?.jobOrders || []);
                setSpareOrders(detailsData?.spareOrders || masterCustomer?.spareOrders || []);
                setCallHistory(detailsData?.telecmiCallHistory || detailsData?.callHistory || masterCustomer?.callHistory || []);
                setNumberPlates(detailsData?.numberPlates || masterCustomer?.numberPlates || []);
                setPayments(masterCustomer?.payments || []);
            });

            // Fetch quotations separately (async, outside batch)
            const uuid = masterCustomer?.id || customerId;
            console.log('🆔 UUID for quotations fetch:', uuid);
            await fetchQuotations(uuid);

            // Fix 3: Batch form data updates to reduce re-renders
            if (masterCustomer) {
                console.log('📋 Setting form data for customer:', masterCustomer.name);
                console.log('📊 Master customer data:', JSON.stringify(masterCustomer, null, 2));
                
                // Prepare phone numbers
                let phoneNumbersData: any[] = [];
                if (masterCustomer.contacts && Array.isArray(masterCustomer.contacts)) {
                    phoneNumbersData = masterCustomer.contacts.map((c: any) => ({
                        number: c.phone || c.number || 'N/A',
                        type: c.type || 'Alternate',
                        validity: c.valid ? 'Valid' : 'Invalid',
                        whatsApp: c.WhatsApp ? 'Yes' : 'No',
                        dnd: c.DND ? 'Yes' : 'No'
                    }));
                } else if (masterCustomer.phoneNumbers && Array.isArray(masterCustomer.phoneNumbers)) {
                    phoneNumbersData = masterCustomer.phoneNumbers.map((phone: any) => ({
                        number: phone?.number || phone?.phone || 'N/A',
                        type: phone?.type || 'Alternate',
                        validity: phone?.validity || 'Valid',
                        whatsApp: phone?.whatsApp || phone?.WhatsApp ? 'Yes' : 'No',
                        dnd: phone?.dnd || phone?.DND ? 'Yes' : 'No'
                    }));
                }

                // Prepare addresses
                const bAddr = masterCustomer.address || masterCustomer.billingAddress;
                const sAddr = masterCustomer.shippingAddress;

                if (!isMounted.current) return;
                unstable_batchedUpdates(() => {
                    setCustomerType(masterCustomer.customerType || 'Non-Customer');
                    setSalutation(masterCustomer.salutation || '');
                    setCustomerName(masterCustomer.name || masterCustomer.customerName || '');
                    setFatherName(masterCustomer.fatherName || '');
                    setGender(masterCustomer.gender || 'Male');
                    setDob(masterCustomer.dob || masterCustomer.dateOfBirth || '');
                    setEmail(masterCustomer.email || '');
                    setGstTypeValue(masterCustomer.gstType || masterCustomer.GSTType || 'Unregistered');
                    setGstin(masterCustomer.gstin || masterCustomer.GSTNo || '');
                    setCustomerGrouping(masterCustomer.customerGrouping || '');
                    setDisplayCustomerId(masterCustomer.customerId || masterCustomer.customer_id || masterCustomer.id || '');
                    setPhoneNumbers(phoneNumbersData);

                    // Set billing address
                    if (bAddr) {
                        setBillingAddress1(bAddr.line1 || bAddr.addressLine1 || '');
                        setBillingAddress2(bAddr.line2 || bAddr.addressLine2 || '');
                        setBillingAddress3(bAddr.line3 || bAddr.addressLine3 || '');
                        setBillingLocality(bAddr.locality || '');
                        setBillingCountryId(bAddr.country?.id || bAddr.country || '');
                        setBillingStateId(bAddr.state?.id || bAddr.state || '');
                        setBillingDistrictId(bAddr.district?.id || bAddr.city || '');
                        setBillingPincode(bAddr.pincode || '');
                    }

                    // Set shipping address
                    if (sAddr) {
                        setShippingAddress1(sAddr.line1 || sAddr.addressLine1 || sAddr.shippingline1 || '');
                        setShippingAddress2(sAddr.line2 || sAddr.addressLine2 || sAddr.shippingline2 || '');
                        setShippingAddress3(sAddr.line3 || sAddr.addressLine3 || sAddr.shippingline3 || '');
                        setShippingLocality(sAddr.locality || sAddr.shippinglocality || '');
                        setShippingCountryId(sAddr.country?.id || sAddr.country || sAddr.shippingcountry || '');
                        setShippingStateId(sAddr.state?.id || sAddr.state || sAddr.shippingstate || '');
                        setShippingDistrictId(sAddr.district?.id || sAddr.shippingdistrict || sAddr.city || '');
                        setShippingPincode(sAddr.pincode || sAddr.shippingpincode || '');
                    }
                });
            }

        } catch (error) {
            console.error('❌ Error fetching customer data:', error);

            // Handle specific server errors
            if (error instanceof Error) {
                if (error.message === 'TIMEOUT_FALLBACK') {
                    console.log('⏱️ API timeout - Using mock data immediately');
                    console.log('🔄 Using mock data for demonstration');
                    // Only show toast if navigation context is available
                    try {
                        toast.error('Server response slow. Showing demo data.');
                    } catch (toastError) {
                        console.log('Toast not available, continuing with mock data');
                    }

                    // Set mock data for demonstration when server is down
                    setCustomer({
                        customerId: customerId,
                        customerType: 'Customer',
                        salutation: 'Mr.',
                        name: 'Demo Customer',
                        fatherName: 'Demo Father',
                        gender: 'Male',
                        dob: '01/01/1990',
                        email: 'demo@example.com',
                        gstType: 'Unregistered',
                        gstin: '',
                        customerGrouping: 'Regular',
                        phoneNumbers: [
                            { number: '6361945159', type: 'Primary', validity: 'Valid', whatsApp: 'Yes', dnd: 'No' }
                        ],
                        billingAddress: {
                            line1: '123 Demo Street',
                            line2: 'Demo Area',
                            line3: 'Demo City',
                            locality: 'Demo Locality',
                            country: 'India',
                            city: 'Demo City',
                            state: 'Demo State',
                            pincode: '123456'
                        },
                        shippingAddress: {
                            line1: '123 Demo Street',
                            line2: 'Demo Area',
                            line3: 'Demo City',
                            locality: 'Demo Locality',
                            country: 'India',
                            city: 'Demo City',
                            state: 'Demo State',
                            pincode: '123456'
                        }
                    });

                    // Set mock quotations for demonstration
                    const mockQuotations = [
                        {
                            id: 'Q001',
                            quotationId: 'QTN-2024-001',
                            date: '01/01/2024',
                            modelCode: 'DEMO-001',
                            modelName: 'Demo Vehicle Model 1',
                            createdAt: '2024-01-01T10:00:00Z',
                            vehicle: [{ vehicleDetail: { modelCode: 'DEMO-001', modelName: 'Demo Vehicle Model 1' } }]
                        },
                        {
                            id: 'Q002',
                            quotationId: 'QTN-2024-002',
                            date: '15/01/2024',
                            modelCode: 'DEMO-002',
                            modelName: 'Demo Vehicle Model 2',
                            createdAt: '2024-01-15T14:30:00Z',
                            vehicle: [{ vehicleDetail: { modelCode: 'DEMO-002', modelName: 'Demo Vehicle Model 2' } }]
                        },
                        {
                            id: 'Q003',
                            quotationId: 'QTN-2024-003',
                            date: '30/01/2024',
                            modelCode: 'DEMO-003',
                            modelName: 'Demo Vehicle Model 3',
                            createdAt: '2024-01-30T09:15:00Z',
                            vehicle: [{ vehicleDetail: { modelCode: 'DEMO-003', modelName: 'Demo Vehicle Model 3' } }]
                        }
                    ];

                    console.log('📋 Setting mock quotations:', mockQuotations.length);
                    setQuotations(mockQuotations);
                    setAssociatedVehicles([
                        {
                            id: 'V001',
                            registerNo: 'DEMO-1234',
                            chassisNo: 'DEMO-CHASSIS-001',
                            color: { color: 'Red' },
                            dateOfSale: '2024-01-01',
                            vehicle: { modelCode: 'DEMO-001', modelName: 'Demo Vehicle Model 1' }
                        }
                    ]);
                    setBookings([
                        {
                            id: 'B001',
                            bookingId: 'BK-2024-001',
                            createdAt: '2024-01-01T10:00:00Z',
                            vehicle: { modelName: 'Demo Vehicle Model 1' },
                            bookingStatus: 'CONFIRMED'
                        }
                    ]);

                    // Force a re-render by updating loading state
                    setLoading(false);
                    return; // Skip the empty data setting

                } else if (error.message.includes('504') || error.message.includes('502')) {
                    console.log('🚨 Server error detected - Backend is down');
                    console.log('🔄 Using mock data for demonstration');
                    // Only show toast if navigation context is available
                    try {
                        toast.error('Server is temporarily unavailable. Showing demo data.');
                    } catch (toastError) {
                        console.log('Toast not available, continuing with mock data');
                    }

                    // Set mock data for demonstration when server is down
                    setCustomer({
                        customerId: customerId,
                        customerType: 'Customer',
                        salutation: 'Mr.',
                        name: 'Demo Customer',
                        fatherName: 'Demo Father',
                        gender: 'Male',
                        dob: '01/01/1990',
                        email: 'demo@example.com',
                        gstType: 'Unregistered',
                        gstin: '',
                        customerGrouping: 'Regular',
                        phoneNumbers: [
                            { number: '6361945159', type: 'Primary', validity: 'Valid', whatsApp: 'Yes', dnd: 'No' }
                        ],
                        billingAddress: {
                            line1: '123 Demo Street',
                            line2: 'Demo Area',
                            line3: 'Demo City',
                            locality: 'Demo Locality',
                            country: 'India',
                            city: 'Demo City',
                            state: 'Demo State',
                            pincode: '123456'
                        },
                        shippingAddress: {
                            line1: '123 Demo Street',
                            line2: 'Demo Area',
                            line3: 'Demo City',
                            locality: 'Demo Locality',
                            country: 'India',
                            city: 'Demo City',
                            state: 'Demo State',
                            pincode: '123456'
                        }
                    });

                    // Set mock quotations for demonstration
                    const mockQuotations = [
                        {
                            id: 'Q001',
                            quotationId: 'QTN-2024-001',
                            date: '01/01/2024',
                            modelCode: 'DEMO-001',
                            modelName: 'Demo Vehicle Model 1',
                            createdAt: '2024-01-01T10:00:00Z',
                            vehicle: [{ vehicleDetail: { modelCode: 'DEMO-001', modelName: 'Demo Vehicle Model 1' } }]
                        },
                        {
                            id: 'Q002',
                            quotationId: 'QTN-2024-002',
                            date: '15/01/2024',
                            modelCode: 'DEMO-002',
                            modelName: 'Demo Vehicle Model 2',
                            createdAt: '2024-01-15T14:30:00Z',
                            vehicle: [{ vehicleDetail: { modelCode: 'DEMO-002', modelName: 'Demo Vehicle Model 2' } }]
                        },
                        {
                            id: 'Q003',
                            quotationId: 'QTN-2024-003',
                            date: '30/01/2024',
                            modelCode: 'DEMO-003',
                            modelName: 'Demo Vehicle Model 3',
                            createdAt: '2024-01-30T09:15:00Z',
                            vehicle: [{ vehicleDetail: { modelCode: 'DEMO-003', modelName: 'Demo Vehicle Model 3' } }]
                        }
                    ];

                    console.log('📋 Setting mock quotations:', mockQuotations.length);
                    setQuotations(mockQuotations);
                    setAssociatedVehicles([
                        {
                            id: 'V001',
                            registerNo: 'DEMO-1234',
                            chassisNo: 'DEMO-CHASSIS-001',
                            color: { color: 'Red' },
                            dateOfSale: '2024-01-01',
                            vehicle: { modelCode: 'DEMO-001', modelName: 'Demo Vehicle Model 1' }
                        }
                    ]);
                    setBookings([
                        {
                            id: 'B001',
                            bookingId: 'BK-2024-001',
                            createdAt: '2024-01-01T10:00:00Z',
                            vehicle: { modelName: 'Demo Vehicle Model 1' },
                            bookingStatus: 'CONFIRMED'
                        }
                    ]);

                    // Force a re-render by updating loading state
                    setLoading(false);
                    return; // Skip the empty data setting

                } else if (error.message.includes('404')) {
                    console.log('🔍 Customer not found error');
                    try {
                        toast.error('Customer not found. Please check the customer ID.');
                    } catch (toastError) {
                        console.log('Toast not available');
                    }
                } else if (error.message.includes('401')) {
                    console.log('🔐 Authentication error');
                    try {
                        toast.error('Session expired. Please login again.');
                    } catch (toastError) {
                        console.log('Toast not available');
                    }
                } else {
                    console.log('❓ Unknown error:', error.message);
                    try {
                        toast.error('Failed to load customer data. Please try again.');
                    } catch (toastError) {
                        console.log('Toast not available');
                    }
                }
            }

            // Set default empty data to prevent crashes
            setCustomerDetails(null);
            setQuotations([]);
            setAssociatedVehicles([]);
            setBookings([]);
            setJobOrders([]);
            setSpareOrders([]);
            setCallHistory([]);
            setNumberPlates([]);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomerData();
        fetchCountries();
    }, [customerId]);

    useEffect(() => {
        if (billingCountryId) {
            fetchStates(billingCountryId);
        }
    }, [billingCountryId]);

    useEffect(() => {
        if (billingStateId) {
            fetchDistricts(billingStateId);
        }
    }, [billingStateId]);

    useEffect(() => {
        if (!sameAsBilling && shippingCountryId) {
            fetchStates(shippingCountryId);
        }
    }, [shippingCountryId, sameAsBilling]);

    useEffect(() => {
        if (!sameAsBilling && shippingStateId) {
            fetchDistricts(shippingStateId);
        }
    }, [shippingStateId, sameAsBilling]);

    // Validation functions from autoinn-fe
    const validateField = (fieldName: string, value: string): string | null => {
        switch (fieldName) {
            case 'customerName':
                if (checkName && (!value || !value.trim())) {
                    return "Enter Customer Name";
                }
                return validateAlphaName(value);

            case 'fatherName':
                if (checkAll && (!value || !value.trim())) {
                    return "Enter Father Name";
                }
                return validateAlphaName(value);

            case 'email':
                return validateOptionalEmail(value);

            case 'gstin':
                if (!isGstRequired && (!value || !value.trim())) {
                    return "Enter GST";
                }
                return null;

            case 'customerType':
                if (!value || value === 'Select') {
                    return "Select Customer Type";
                }
                return null;

            case 'salutation':
                if (checkAll && (!value || value === 'Select')) {
                    return "Select Salutation";
                }
                return null;

            case 'gender':
                if (checkAll && (!value || value === 'Select')) {
                    return "Please Select Gender";
                }
                return null;

            case 'dob':
                if (checkAll && (!value || !value.trim())) {
                    return "Enter DOB";
                }
                return null;

            case 'customerGrouping':
                if (checkAll && (!value || value === 'Select')) {
                    return "Select Customer Grouping";
                }
                return null;

            default:
                return null;
        }
    };

    const handleFieldChange = (fieldName: string, value: string) => {
        // Clear error for this field
        setErrors(prev => ({ ...prev, [fieldName]: '' }));

        // Validate field
        const error = validateField(fieldName, value);
        if (error) {
            setErrors(prev => ({ ...prev, [fieldName]: error }));
        }

        // Update field value with formatting from autoinn-fe
        switch (fieldName) {
            case 'customerName':
                const formattedName = formatValue(value, 'allCaps').replace(/[^A-Za-z0-9\s]/g, "");
                setCustomerName(formattedName);
                break;
            case 'fatherName':
                const formattedFatherName = formatValue(value, 'allCaps');
                setFatherName(formattedFatherName);
                break;
            case 'email':
                const formattedEmail = formatValue(value, 'toLowerCase');
                setEmail(formattedEmail);
                break;
            case 'gstin':
                const formattedGST = formatValue(value, 'toUpperCase');
                setGstin(formattedGST);
                // Auto-verify GST when 15 characters are entered
                if (formattedGST.length === 15) {
                    handleGSTVerification();
                }
                break;
            case 'customerType':
                setCustomerType(value);
                break;
            case 'salutation':
                setSalutation(value);
                break;
            case 'gender':
                setGender(value);
                break;
            case 'dob':
                setDob(value);
                break;
            case 'customerGrouping':
                setCustomerGrouping(value);
                break;
            case 'billingAddress1':
                setBillingAddress1(value);
                break;
            case 'billingAddress2':
                setBillingAddress2(value);
                break;
            case 'billingAddress3':
                setBillingAddress3(value);
                break;
            case 'billingLocality':
                setBillingLocality(value);
                break;
            case 'billingCountryId':
                setBillingCountryId(value);
                handleCountryChange(value, 'billing');
                break;
            case 'billingStateId':
                setBillingStateId(value);
                handleStateChange(value, 'billing');
                break;
            case 'billingDistrictId':
                setBillingDistrictId(value);
                break;
            case 'billingPincode':
                setBillingPincode(value);
                break;
            case 'shippingAddress1':
                setShippingAddress1(value);
                break;
            case 'shippingAddress2':
                setShippingAddress2(value);
                break;
            case 'shippingAddress3':
                setShippingAddress3(value);
                break;
            case 'shippingLocality':
                setShippingLocality(value);
                break;
            case 'shippingCountryId':
                setShippingCountryId(value);
                handleCountryChange(value, 'shipping');
                break;
            case 'shippingStateId':
                setShippingStateId(value);
                handleStateChange(value, 'shipping');
                break;
            case 'shippingDistrictId':
                setShippingDistrictId(value);
                break;
            case 'shippingPincode':
                setShippingPincode(value);
                break;
        }
    };

    const handleClose = () => {
        const target = getBackNavigationTarget();
        console.log(`🔍 Closing CustomerDetails, navigating to ${target.screen}`);
        
        if (target.useGoBack) {
            navigation.goBack();
        } else {
            safeNavigate(target.screen as any);
        }
    };

    const handleAddContact = () => {
        if (newPhone.trim()) {
            setPhoneNumbers([
                ...phoneNumbers,
                {
                    number: newPhone,
                    type: newPhoneType as any,
                    validity: 'Valid' as any,
                    whatsApp: newWhatsApp as any,
                    dnd: newDND as any,
                },
            ]);
            setNewPhone('');
            setNewPhoneType('Alternate');
            setNewWhatsApp('No');
            setNewDND('No');
        }
    };

    // Dropdown data fetching functions from autoinn-fe
    const fetchCountries = async () => {
        setLoadingCountries(true);
        try {
            const response = await getCountries();
            const data = response?.data;
            if (data?.code === 200) {
                const indiaOnly = (data.data || []).filter((c: any) =>
                    c.name.toLowerCase() === 'india' || c.id === 'India'
                );
                if (!isMounted.current) return;
                setCountries(indiaOnly);
                if (indiaOnly.length > 0 && !billingCountryId) {
                    setBillingCountryId(indiaOnly[0].id);
                    setShippingCountryId(indiaOnly[0].id);
                    await fetchStates(indiaOnly[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching countries:', error);
        } finally {
            if (!isMounted.current) return;
            setLoadingCountries(false);
        }
    };

    const fetchStates = async (countryId: string) => {
        setLoadingStates(true);
        try {
            const response = await getStates(countryId);
            const data = response?.data;
            if (data?.code === 200) {
                if (!isMounted.current) return;
                setStates(data.data || []);
                setDistricts([]);
            }
        } catch (error) {
            console.error('Error fetching states:', error);
        } finally {
            if (!isMounted.current) return;
            setLoadingStates(false);
        }
    };

    const fetchDistricts = async (stateId: string) => {
        setLoadingDistricts(true);
        try {
            const response = await getCities(stateId);
            const data = response?.data;
            if (data?.code === 200) {
                if (!isMounted.current) return;
                setDistricts(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching districts:', error);
        } finally {
            if (!isMounted.current) return;
            setLoadingDistricts(false);
        }
    };

    const handleCountryChange = async (countryId: string, addressType: 'billing' | 'shipping' = 'billing') => {
        if (addressType === 'billing') {
            setBillingCountryId(countryId);
            setBillingStateId('');
            setBillingDistrictId('');
        } else {
            setShippingCountryId(countryId);
            setShippingStateId('');
            setShippingDistrictId('');
        }
        await fetchStates(countryId);
    };

    const handleStateChange = async (stateId: string, addressType: 'billing' | 'shipping' = 'billing') => {
        if (addressType === 'billing') {
            setBillingStateId(stateId);
            setBillingDistrictId('');
        } else {
            setShippingStateId(stateId);
            setShippingDistrictId('');
        }
        await fetchDistricts(stateId);
    };

    const handleGSTTypeChange = (value: string) => {
        setGstTypeValue(value);
        if (value === 'Unregistered') {
            setIsGstRequired(true);
            setGstin('');
            setGstName('');
            setGstStatus('');
            // Clear GST error
            setErrors(prev => ({ ...prev, gstin: '' }));
        } else {
            setIsGstRequired(false);
        }
    };

    const handleGSTVerification = async () => {
        if (gstin && gstin.trim() && gstin.length === 15) {
            try {
                const response = await verifyGST(gstin.trim());
                const data = response?.data;
                if (data?.code === 200) {
                    setGstName('GST Verified');
                    setGstStatus('Active');
                    setErrors(prev => ({ ...prev, gstin: '' }));
                    if (data?.response?.data?.flag === true) {
                        toast.success('GSTIN is valid and active');
                    } else {
                        toast.error('Invalid GSTIN');
                    }
                } else {
                    setGstName('Invalid GST');
                    setGstStatus('Inactive');
                    setErrors(prev => ({ ...prev, gstin: 'Enter Valid GSTIN' }));
                    toast.error('Invalid GSTIN');
                }
            } catch (error) {
                console.error('Error verifying GST:', error);
                setGstName('Error');
                setGstStatus('');
                setErrors(prev => ({ ...prev, gstin: 'Error verifying GSTIN' }));
                toast.error('Error verifying GSTIN');
            }
        } else if (gstin && gstin.length < 15) {
            setErrors(prev => ({ ...prev, gstin: 'GSTIN must be 15 characters' }));
        }
    };

    const formatValue = (value: string, type: 'toUpperCase' | 'toLowerCase' | 'allCaps'): string => {
        switch (type) {
            case 'toUpperCase':
                return value.toUpperCase();
            case 'toLowerCase':
                return value.toLowerCase();
            case 'allCaps':
                return value.toUpperCase();
            default:
                return value;
        }
    };

    const handleSave = async () => {
        // Save logic here
        // Validate all required fields before saving
        const validationErrors: Record<string, string> = {};

        // Validate required fields based on checkAll and checkName
        if (checkName && (!customerName || !customerName.trim())) {
            validationErrors.customerName = "Enter Customer Name";
        }

        if (checkAll && (!salutation || salutation === 'Select')) {
            validationErrors.salutation = "Select Salutation";
        }

        if (checkAll && (!fatherName || !fatherName.trim())) {
            validationErrors.fatherName = "Enter Father Name";
        }

        if (checkAll && (!gender || gender === 'Select')) {
            validationErrors.gender = "Please Select Gender";
        }

        if (checkAll && (!dob || !dob.trim())) {
            validationErrors.dob = "Enter DOB";
        }

        if (checkAll && (!customerGrouping || customerGrouping === 'Select')) {
            validationErrors.customerGrouping = "Select Customer Grouping";
        }

        // Validate GSTIN if GST type is not "Unregistered"
        if (!isGstRequired && (!gstin || !gstin.trim())) {
            validationErrors.gstin = "Enter GST";
        }

        // Validate email format if provided
        if (email && email.trim()) {
            const emailError = validateOptionalEmail(email);
            if (emailError) {
                validationErrors.email = emailError;
            }
        }

        // Validate name format
        if (customerName && customerName.trim()) {
            const nameError = validateAlphaName(customerName);
            if (nameError) {
                validationErrors.customerName = nameError;
            }
        }

        if (fatherName && fatherName.trim()) {
            const fatherNameError = validateAlphaName(fatherName);
            if (fatherNameError) {
                validationErrors.fatherName = fatherNameError;
            }
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error('Fill the mandatory fields');
            return;
        }

        // If validation passes, save the data
        setIsSaving(true);
        try {
            const customerData = {
                name: customerName,
                fatherName: fatherName,
                gender: gender,
                dob: dob,
                email: email,
                gstType: gstTypeValue,
                gstin: gstin,
                customerType: customerType,
                customerGrouping: customerGrouping,
                salutation: salutation,
                contacts: phoneNumbers,
                billingAddress: {
                    line1: billingAddress1,
                    line2: billingAddress2,
                    line3: billingAddress3,
                    locality: billingLocality,
                    country: billingCountryId,
                    state: billingStateId,
                    city: billingDistrictId,
                    pincode: billingPincode
                },
                shippingAddress: sameAsBilling ? {
                    line1: billingAddress1,
                    line2: billingAddress2,
                    line3: billingAddress3,
                    locality: billingLocality,
                    country: billingCountryId,
                    state: billingStateId,
                    city: billingDistrictId,
                    pincode: billingPincode
                } : {
                    line1: shippingAddress1,
                    line2: shippingAddress2,
                    line3: shippingAddress3,
                    locality: shippingLocality,
                    country: shippingCountryId,
                    state: shippingStateId,
                    city: shippingDistrictId,
                    pincode: shippingPincode
                }
            };

            console.log('🔍 Saving customer data:', JSON.stringify(customerData, null, 2));
            console.log('🆔 Customer ID being updated:', customerId);

            if (customerId) {
                // Update existing customer
                const response = await updateCustomer(customerId, customerData);
                console.log('✅ Update customer response:', response);
                
                // Refresh the customer data after successful update
                await fetchCustomerData();
                
                toast.success('Customer details updated successfully!');
            } else {
                // Create new customer (if needed)
                toast.success('Customer details saved successfully!');
            }
            
            safeNavigate('Main' as any);
        } catch (error) {
            console.error('❌ Error saving customer:', error);
            toast.error('Failed to save customer details. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFollowUpDateChange = (event: any, selectedDate?: Date) => {
        setShowFollowUpDatePicker(false);
        if (selectedDate) {
            const day = selectedDate.getDate().toString().padStart(2, '0');
            const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
            const year = selectedDate.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;
            setFollowUpDate(formattedDate);
            setFollowUpDateError('');
        }
    };

    const handleDobDateChange = (event: any, selectedDate?: Date) => {
        setShowDobDatePicker(false);
        if (selectedDate) {
            const day = selectedDate.getDate().toString().padStart(2, '0');
            const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
            const year = selectedDate.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;
            setDob(formattedDate);
        }
    };

    const handleDobDateSelect = (day: any) => {
        const date = new Date(day.dateString);
        const formattedDate = moment(date).format('DD/MM/YYYY');
        setDob(formattedDate);
        setShowDobCalendarModal(false);
    };

    const renderCustomerDetailsTab = () => {
        // Debug navigation context
        console.log('🔍 renderCustomerDetailsTab - Navigation context check:', {
            hasNavigation: !!navigation,
            hasNavigate: !!(navigation && navigation.navigate),
            navigationType: typeof navigation,
            customerId: customerId,
            loading: loading
        });

        if (loading) {
            return (
                <View className="flex-1 bg-[#f5f5f5] items-center justify-center">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            );
        }

        return (
            <ScrollView className="flex-1 bg-[#f5f5f5] px-4 pb-4">
                {/* Customer ID */}
                {/* <View className="mb-4 mt-2">
                    <FormLabel label="Customer ID" />
                    <View className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2.5">
                        <Text className="text-gray-600 font-medium">{displayCustomerId || 'Loading...'}</Text>
                    </View>
                </View> */}

                <View className="mt-2 bg-white rounded-xl border border-gray-100 p-4 mb-2 w-[330px] self-center">

                    <View className="flex-row">
                        <Text className="text-gray-500 text-sm">Customer Id :  </Text>
                        <Text className="text-gray-900 text-sm font-medium">{displayCustomerId || 'Loading...'}</Text>
                    </View>
                </View>

                {/* Customer Details Section */}
                <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
                    <Text className="text-base font-bold text-gray-800 mb-3">Customer Details</Text>

                    {/* Customer Type */}
                    <View className="mb-3">
                        <FormLabel label="Customer Type" required />
                        <TouchableOpacity
                            ref={customerTypeRef}
                            onPress={() => {
                                customerTypeRef.current?.measureInWindow((x, y, width, height) => {
                                    setDropdownLayout({ x, y, width, height });
                                    setShowCustomerTypeDropdown(true);
                                });
                            }}
                            className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 flex-row justify-between items-center"
                        >
                            <Text className="text-gray-900">{customerType || 'Select Type'}</Text>
                            <ChevronLeft size={20} color="#666" style={{ transform: [{ rotate: '-90deg' }] }} />
                        </TouchableOpacity>
                    </View>

                    {/* Salutation */}
                    <View className="mb-3">
                        <FormLabel label="Salutation" />
                        <TouchableOpacity
                            ref={salutationRef}
                            onPress={() => {
                                salutationRef.current?.measureInWindow((x, y, width, height) => {
                                    setDropdownLayout({ x, y, width, height });
                                    setShowSalutationDropdown(true);
                                });
                            }}
                            className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 flex-row justify-between items-center"
                        >
                            <Text className="text-gray-900">{salutation || 'Select'}</Text>
                            <ChevronLeft size={20} color="#666" style={{ transform: [{ rotate: '-90deg' }] }} />
                        </TouchableOpacity>
                    </View>

                    {/* Customer Name */}
                    <View className="mb-3">
                        <FormLabel label="Customer Name" required={checkName} />
                        <TextInput
                            value={customerName}
                            onChangeText={(value) => handleFieldChange('customerName', value)}
                            className={`bg-white border rounded-lg px-3 py-2.5 text-gray-900 ${errors.customerName ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.customerName && (
                            <Text className="text-red-500 text-xs mt-1">{errors.customerName}</Text>
                        )}
                    </View>

                    {/* Father's Name */}
                    <View className="mb-3">
                        <FormLabel label="Father's Name" required={checkAll} />
                        <TextInput
                            value={fatherName}
                            onChangeText={(value) => handleFieldChange('fatherName', value)}
                            placeholder=""
                            placeholderTextColor="#999"
                            className={`bg-white border rounded-lg px-3 py-2.5 text-gray-900 ${errors.fatherName ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.fatherName && (
                            <Text className="text-red-500 text-xs mt-1">{errors.fatherName}</Text>
                        )}
                    </View>

                    {/* Gender */}
                    <View className="mb-3">
                        <FormLabel label="Gender" />
                        <View className="flex-row items-center gap-4 mt-1">
                            <TouchableOpacity
                                onPress={() => setGender('Male')}
                                className="flex-row items-center gap-2"
                            >
                                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${gender === 'Male' ? 'border-teal-600' : 'border-gray-300'}`}>
                                    {gender === 'Male' && <View className="w-3 h-3 rounded-full bg-teal-600" />}
                                </View>
                                <Text className="text-sm text-gray-700">Male</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setGender('Female')}
                                className="flex-row items-center gap-2"
                            >
                                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${gender === 'Female' ? 'border-teal-600' : 'border-gray-300'}`}>
                                    {gender === 'Female' && <View className="w-3 h-3 rounded-full bg-teal-600" />}
                                </View>
                                <Text className="text-sm text-gray-700">Female</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* DOB */}
                    <View className="mb-3">
                        <FormLabel label="Date of Birth" required/>
                        <View className="flex-row items-center">
                            <TextInput
                                value={dob}
                                onChangeText={setDob}
                                placeholder="DD/MM/YYYY"
                                className="flex-1 h-12 bg-white border border-gray-300 rounded-l-lg px-3 text-gray-800"
                             />
                            <TouchableOpacity
                                onPress={() => setShowDobCalendarModal(true)}
                                className="h-12 bg-teal-600 rounded-r-lg px-4 justify-center"
                            >
                                <Calendar size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Phone Numbers Table */}
                    <View className="mt-2 mb-4">
                        <View className="flex-row items-center mb-1">
                            <Text className="text-red-500 text-sm">* </Text>
                            <FormLabel label="Contacts" />
                        </View>
                        <View className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View className="min-w-[500px]">
                                    {/* Table Header */}
                                    <View className="bg-gray-200 flex-row border-b border-gray-300">
                                        <View className="w-[120px] px-3 py-3">
                                            <Text className="text-gray-700 text-[11px] font-bold">Phone</Text>
                                        </View>
                                        <View className="w-[80px] px-3 py-3">
                                            <Text className="text-gray-700 text-[11px] font-bold">Type</Text>
                                        </View>
                                        <View className="w-[80px] px-3 py-3">
                                            <Text className="text-gray-700 text-[11px] font-bold">WhatsApp</Text>
                                        </View>
                                        <View className="w-[80px] px-3 py-3">
                                            <Text className="text-gray-700 text-[11px] font-bold">DND</Text>
                                        </View>
                                        <View className="w-[80px] px-3 py-3">
                                            <Text className="text-gray-700 text-[11px] font-bold text-center">Action</Text>
                                        </View>
                                    </View>

                                    {/* Table Body */}
                                    {phoneNumbers.length === 0 ? (
                                        <View className="bg-white p-4 items-center border-b border-gray-200">
                                            <Text className="text-gray-400 text-xs">No contacts available</Text>
                                        </View>
                                    ) : phoneNumbers.map((phone, index) => (
                                        <View
                                            key={index}
                                            className={`flex-row border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}
                                        >
                                            <View className="w-[120px] px-3 py-3 flex-row items-center">
                                                <Text className="text-gray-600 text-xs font-medium">{phone?.number || 'N/A'}</Text>
                                            </View>

                                            {/* Phone Type - Plain Text */}
                                            <View className="w-[80px] px-3 py-3 flex-row items-center">
                                                <Text className="text-gray-600 text-xs">{phone?.type || 'Alternate'}</Text>
                                            </View>

                                            {/* WhatsApp - Plain Text */}
                                            <View className="w-[80px] px-3 py-3 flex-row items-center">
                                                <Text className="text-gray-600 text-xs">{phone?.whatsApp || 'No'}</Text>
                                            </View>

                                            {/* DND - Plain Text */}
                                            <View className="w-[80px] px-3 py-3 flex-row items-center">
                                                <Text className="text-gray-600 text-xs">{phone?.dnd || 'No'}</Text>
                                            </View>

                                            <View className="w-[80px] px-3 py-3 flex-row items-center justify-center gap-2">
                                                <TouchableOpacity onPress={() => handleEditPhone(index)}>
                                                    <Edit2 size={16} color="#666" />
                                                </TouchableOpacity>
                                                <View className="w-[1px] h-3 bg-gray-200 mx-1" />
                                                <TouchableOpacity onPress={() => handleDeletePhone(index)}>
                                                    <Trash2 size={16} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    </View>

                    {/* Add Contact Section */}
                    <View className="mt-4 mb-2">
                        <View className="flex-row gap-x-3 mb-4">
                            {/* Phone */}
                            <View className="flex-[1.5]">
                                <FormLabel label="Phone" />
                                <View className="flex-row mt-1.5 border border-gray-300 rounded-lg overflow-hidden bg-white h-[45px]">
                                    <View className="bg-gray-50 px-3 justify-center border-r border-gray-300">
                                        <Text className="text-gray-700 text-sm font-medium">+91</Text>
                                    </View>
                                    <TextInput
                                        value={newPhone}
                                        onChangeText={setNewPhone}
                                        placeholder=""
                                        placeholderTextColor="#999"
                                        keyboardType="phone-pad"
                                        className="ml-1 flex-1 px-3 py-0 text-gray-900 text-sm"
                                        style={{ height: '100%' }}
                                    />
                                </View>
                            </View>

                            {/* Type Dropdown */}
                            <View className="flex-1">
                                <FormLabel label="Type" />
                                <TouchableOpacity
                                    onPress={(event) => {
                                        const target = event.currentTarget as any;
                                        target.measureInWindow((x: number, y: number, width: number, height: number) => {
                                            setDropdownLayout({ x, y, width, height });
                                            setEditingPhoneIndex(null);
                                            setShowPhoneTypeDropdown(true);
                                        });
                                    }}
                                    className="mt-1.5 bg-white border border-gray-300 rounded-lg px-3 flex-row justify-between items-center h-[45px]"
                                >
                                    <Text className="text-gray-600 text-xs">{newPhoneType}</Text>
                                    <ChevronLeft size={16} color="#999" style={{ transform: [{ rotate: '-90deg' }] }} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="flex-row gap-3 mb-5">
                            {/* WhatsApp Dropdown */}
                            <View className="flex-1">
                                <FormLabel label="WhatsApp" />
                                <TouchableOpacity
                                    onPress={(event) => {
                                        const target = event.currentTarget as any;
                                        target.measureInWindow((x: number, y: number, width: number, height: number) => {
                                            setDropdownLayout({ x, y, width, height });
                                            setEditingPhoneIndex(null);
                                            setShowWhatsAppDropdown(true);
                                        });
                                    }}
                                    className="mt-1.5 bg-white border border-gray-300 rounded-lg px-3 flex-row justify-between items-center h-[45px]"
                                >
                                    <Text className="text-gray-600 text-xs">{newWhatsApp}</Text>
                                    <ChevronLeft size={16} color="#999" style={{ transform: [{ rotate: '-90deg' }] }} />
                                </TouchableOpacity>
                            </View>

                            {/* DND Dropdown */}
                            <View className="flex-1">
                                <FormLabel label="DND" />
                                <TouchableOpacity
                                    onPress={(event) => {
                                        const target = event.currentTarget as any;
                                        target.measureInWindow((x: number, y: number, width: number, height: number) => {
                                            setDropdownLayout({ x, y, width, height });
                                            setEditingPhoneIndex(null);
                                            setShowDNDDropdown(true);
                                        });
                                    }}
                                    className="mt-1.5 bg-white border border-gray-300 rounded-lg px-3 flex-row justify-between items-center h-[45px]"
                                >
                                    <Text className="text-gray-600 text-xs">{newDND}</Text>
                                    <ChevronLeft size={16} color="#999" style={{ transform: [{ rotate: '-90deg' }] }} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleAddContact}
                            className="bg-teal-600 rounded-lg py-3 items-center shadow-sm"
                        >
                            <Text className="text-white font-medium text-sm">Add Contact</Text>
                        </TouchableOpacity>
                    </View>

                    {/* WhatsApp Dropdown Modal */}
                    <Modal
                        visible={showWhatsAppDropdown}
                        transparent animationType="fade"
                        onRequestClose={() => setShowWhatsAppDropdown(false)}
                    >
                        <View className="flex-1 bg-black/40 items-center justify-center px-4">
                            <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '60%' }}>
                                <View className="p-4 border-b border-gray-200">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-lg font-semibold text-gray-800">
                                            {editingPhoneIndex !== null && showEditPhoneModal ? 'Edit WhatsApp' : 'Select WhatsApp'}
                                        </Text>
                                        <TouchableOpacity onPress={() => setShowWhatsAppDropdown(false)}>
                                            <X size={20} color={COLORS.gray[600]} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <ScrollView>
                                    {yesNoOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option.key}
                                            className="p-4 border-b border-gray-100"
                                            onPress={() => handleWhatsAppChange(editingPhoneIndex, option.key)}
                                        >
                                            <Text className={`text-gray-800 ${(editingPhoneIndex !== null && showEditPhoneModal ? editPhoneData.whatsApp : (editingPhoneIndex !== null ? phoneNumbers[editingPhoneIndex]?.whatsApp : newWhatsApp)) === option.key ? 'font-bold text-teal-700' : ''}`}>
                                                {option.title}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity onPress={() => setShowWhatsAppDropdown(false)} className="p-3 border-t border-gray-200">
                                    <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* DND Dropdown Modal */}
                    <Modal
                        visible={showDNDDropdown}
                        transparent animationType="fade"
                        onRequestClose={() => setShowDNDDropdown(false)}
                    >
                        <View className="flex-1 bg-black/40 items-center justify-center px-4">
                            <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '60%' }}>
                                <View className="p-4 border-b border-gray-200">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-lg font-semibold text-gray-800">
                                            {editingPhoneIndex !== null && showEditPhoneModal ? 'Edit DND' : 'Select DND'}
                                        </Text>
                                        <TouchableOpacity onPress={() => setShowDNDDropdown(false)}>
                                            <X size={20} color={COLORS.gray[600]} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <ScrollView>
                                    {yesNoOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option.key}
                                            className="p-4 border-b border-gray-100"
                                            onPress={() => handleDNDChange(editingPhoneIndex, option.key)}
                                        >
                                            <Text className={`text-gray-800 ${(editingPhoneIndex !== null && showEditPhoneModal ? editPhoneData.dnd : (editingPhoneIndex !== null ? phoneNumbers[editingPhoneIndex]?.dnd : newDND)) === option.key ? 'font-bold text-teal-700' : ''}`}>
                                                {option.title}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity onPress={() => setShowDNDDropdown(false)} className="p-3 border-t border-gray-200">
                                    <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* Email */}
                    <View className="mb-3">
                        <FormLabel label="Email" />
                        <TextInput
                            value={email}
                            onChangeText={(value) => handleFieldChange('email', value)}
                            keyboardType="email-address"
                            placeholder="Enter email address"
                            placeholderTextColor="#999"
                            className={`bg-white border rounded-lg px-3 py-2.5 text-gray-900 ${errors.email ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.email && (
                            <Text className="text-red-500 text-xs mt-1">{errors.email}</Text>
                        )}
                    </View>

                    {/* GST Type */}
                    <View className="mb-3">
                        <FormLabel label="GST Type" />
                        <TouchableOpacity
                            ref={gstTypeRef}
                            onPress={() => {
                                gstTypeRef.current?.measureInWindow((x, y, width, height) => {
                                    setDropdownLayout({ x, y, width, height });
                                    setShowGSTTypeDropdown(true);
                                });
                            }}
                            className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 flex-row justify-between items-center"
                        >
                            <Text className="text-gray-900">
                                {gstTypeValue || 'Select GST Type'}
                            </Text>
                            <ChevronLeft size={20} color="#666" style={{ transform: [{ rotate: '-90deg' }] }} />
                        </TouchableOpacity>
                    </View>

                    {/* GSTIN */}
                    <View className="mb-3">
                        <FormLabel label="GSTIN" required={!isGstRequired} />
                        {gstTypeValue === 'Unregistered' ? (
                            <View className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2.5">
                                <Text className="text-gray-500">N/A</Text>
                            </View>
                        ) : (
                            <TextInput
                                value={gstin}
                                onChangeText={(value) => handleFieldChange('gstin', value)}
                                placeholder="Enter GSTIN"
                                placeholderTextColor="#999"
                                className={`bg-white border rounded-lg px-3 py-2.5 text-gray-900 ${errors.gstin ? 'border-red-500' : 'border-gray-300'}`}
                            />
                        )}
                        {errors.gstin && (
                            <Text className="text-red-500 text-xs mt-1">{errors.gstin}</Text>
                        )}
                    </View>

                    {/* Edit Phone Modal */}
                    <Modal
                        visible={showEditPhoneModal}
                        transparent animationType="fade"
                        onRequestClose={handleCancelPhoneEdit}
                    >
                        <View className="flex-1 bg-black/40 items-center justify-center px-4">
                            <View className="bg-white rounded-2xl w-full max-w-md">
                                <View className="p-4 border-b border-gray-200">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-lg font-semibold text-gray-800">Edit Contact</Text>
                                        <TouchableOpacity onPress={handleCancelPhoneEdit}>
                                            <X size={20} color={COLORS.gray[600]} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                
                                <View className="p-4">
                                    {/* Phone Number */}
                                    <View className="mb-4">
                                        <FormLabel label="Phone Number" />
                                        <View className="flex-row border border-gray-300 rounded-lg overflow-hidden bg-white h-12">
                                            <View className="bg-gray-50 px-3 justify-center border-r border-gray-300">
                                                <Text className="text-gray-700 text-sm font-medium">+91</Text>
                                            </View>
                                            <TextInput
                                                value={editPhoneData.number}
                                                onChangeText={(value) => setEditPhoneData(prev => ({ ...prev, number: value }))}
                                                placeholder=""
                                                placeholderTextColor="#999"
                                                keyboardType="phone-pad"
                                                className="flex-1 px-3 text-gray-900 text-sm"
                                            />
                                        </View>
                                    </View>

                                    {/* Type Dropdown */}
                                    <View className="mb-4">
                                        <FormLabel label="Type" />
                                        <TouchableOpacity
                                            onPress={() => {
                                                setEditingPhoneIndex(editingPhoneIndex);
                                                setShowPhoneTypeDropdown(true);
                                            }}
                                            className="bg-white border border-gray-300 rounded-lg px-3 flex-row justify-between items-center h-12"
                                        >
                                            <Text className="text-gray-600 text-sm">{editPhoneData.type}</Text>
                                            <ChevronLeft size={16} color="#999" style={{ transform: [{ rotate: '-90deg' }] }} />
                                        </TouchableOpacity>
                                    </View>

                                    {/* WhatsApp Dropdown */}
                                    <View className="mb-4">
                                        <FormLabel label="WhatsApp" />
                                        <TouchableOpacity
                                            onPress={() => {
                                                setEditingPhoneIndex(editingPhoneIndex);
                                                setShowWhatsAppDropdown(true);
                                            }}
                                            className="bg-white border border-gray-300 rounded-lg px-3 flex-row justify-between items-center h-12"
                                        >
                                            <Text className="text-gray-600 text-sm">{editPhoneData.whatsApp}</Text>
                                            <ChevronLeft size={16} color="#999" style={{ transform: [{ rotate: '-90deg' }] }} />
                                        </TouchableOpacity>
                                    </View>

                                    {/* DND Dropdown */}
                                    <View className="mb-4">
                                        <FormLabel label="DND" />
                                        <TouchableOpacity
                                            onPress={() => {
                                                setEditingPhoneIndex(editingPhoneIndex);
                                                setShowDNDDropdown(true);
                                            }}
                                            className="bg-white border border-gray-300 rounded-lg px-3 flex-row justify-between items-center h-12"
                                        >
                                            <Text className="text-gray-600 text-sm">{editPhoneData.dnd}</Text>
                                            <ChevronLeft size={16} color="#999" style={{ transform: [{ rotate: '-90deg' }] }} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View className="flex-row border-t border-gray-200">
                                    <TouchableOpacity 
                                        onPress={handleCancelPhoneEdit}
                                        className="flex-1 p-3 border-r border-gray-200"
                                    >
                                        <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={handleSavePhoneEdit}
                                        className="flex-1 p-3"
                                    >
                                        <Text className="text-center text-teal-600 font-medium">Save</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* Phone Type Dropdown Modal */}
                    <Modal
                        visible={showPhoneTypeDropdown}
                        transparent animationType="fade"
                        onRequestClose={() => setShowPhoneTypeDropdown(false)}
                    >
                        <View className="flex-1 bg-black/40 items-center justify-center px-4">
                            <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '60%' }}>
                                <View className="p-4 border-b border-gray-200">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-lg font-semibold text-gray-800">
                                            {editingPhoneIndex !== null && showEditPhoneModal ? 'Edit Phone Type' : 'Select Phone Type'}
                                        </Text>
                                        <TouchableOpacity onPress={() => setShowPhoneTypeDropdown(false)}>
                                            <X size={20} color={COLORS.gray[600]} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <ScrollView>
                                    {phoneTypes.map((type) => (
                                        <TouchableOpacity
                                            key={type.key}
                                            className="p-4 border-b border-gray-100"
                                            onPress={() => handlePhoneTypeChange(editingPhoneIndex, type.key)}
                                        >
                                            <Text className={`text-gray-800 ${(editingPhoneIndex !== null && showEditPhoneModal ? editPhoneData.type : (editingPhoneIndex !== null ? phoneNumbers[editingPhoneIndex]?.type : newPhoneType)) === type.key ? 'font-bold text-teal-700' : ''}`}>
                                                {type.title}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity onPress={() => setShowPhoneTypeDropdown(false)} className="p-3 border-t border-gray-200">
                                    <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* Customer Grouping */}
                    <View className="mb-3">
                        <FormLabel label="Customer Grouping" required={checkAll} />
                        <TouchableOpacity
                            onPress={() => setShowCustomerGroupingDropdown(true)}
                            className={`bg-white border rounded-lg px-3 py-2.5 flex-row justify-between items-center ${errors.customerGrouping ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <Text className="text-gray-900">
                                {customerGrouping || 'Select Customer Grouping'}
                            </Text>
                            <ChevronLeft size={20} color="#666" style={{ transform: [{ rotate: '-90deg' }] }} />
                        </TouchableOpacity>
                        {errors.customerGrouping && (
                            <Text className="text-red-500 text-xs mt-1">{errors.customerGrouping}</Text>
                        )}
                    </View>

                    {/* Customer Type Dropdown Modal */}
                    <Modal
                        visible={showCustomerTypeDropdown}
                        transparent animationType="fade"
                        onRequestClose={() => setShowCustomerTypeDropdown(false)}
                    >
                        <View className="flex-1 bg-black/40 items-center justify-center px-4">
                            <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '60%' }}>
                                <View className="p-4 border-b border-gray-200">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-lg font-semibold text-gray-800">Select Customer Type</Text>
                                        <TouchableOpacity onPress={() => setShowCustomerTypeDropdown(false)}>
                                            <X size={20} color={COLORS.gray[600]} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <ScrollView>
                                    {customerTypes.map((type) => (
                                        <TouchableOpacity
                                            key={type.key}
                                            className="p-4 border-b border-gray-100"
                                            onPress={() => {
                                                setCustomerType(type.key);
                                                setShowCustomerTypeDropdown(false);
                                            }}
                                        >
                                            <Text className={`text-gray-800 ${customerType === type.key ? 'font-bold text-teal-700' : ''}`}>
                                                {type.title}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity onPress={() => setShowCustomerTypeDropdown(false)} className="p-3 border-t border-gray-200">
                                    <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* Salutation Dropdown Modal */}
                    <Modal
                        visible={showSalutationDropdown}
                        transparent animationType="fade"
                        onRequestClose={() => setShowSalutationDropdown(false)}
                    >
                        <View className="flex-1 bg-black/40 items-center justify-center px-4">
                            <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '60%' }}>
                                <View className="p-4 border-b border-gray-200">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-lg font-semibold text-gray-800">Select Salutation</Text>
                                        <TouchableOpacity onPress={() => setShowSalutationDropdown(false)}>
                                            <X size={20} color={COLORS.gray[600]} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <ScrollView>
                                    {salutations.map((sal) => (
                                        <TouchableOpacity
                                            key={sal.key}
                                            className="p-4 border-b border-gray-100"
                                            onPress={() => {
                                                setSalutation(sal.key);
                                                setShowSalutationDropdown(false);
                                            }}
                                        >
                                            <Text className={`text-gray-800 ${salutation === sal.key ? 'font-bold text-teal-700' : ''}`}>
                                                {sal.title}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity onPress={() => setShowSalutationDropdown(false)} className="p-3 border-t border-gray-200">
                                    <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* Customer Grouping Dropdown Modal */}
                    <Modal
                        visible={showCustomerGroupingDropdown}
                        transparent animationType="fade"
                        onRequestClose={() => setShowCustomerGroupingDropdown(false)}
                    >
                        <View className="flex-1 bg-black/40 items-center justify-center px-4">
                            <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '60%' }}>
                                <View className="p-4 border-b border-gray-200">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-lg font-semibold text-gray-800">Select Customer Grouping</Text>
                                        <TouchableOpacity onPress={() => setShowCustomerGroupingDropdown(false)}>
                                            <X size={20} color={COLORS.gray[600]} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <ScrollView>
                                    {customerGroupingOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option.key}
                                            className="p-4 border-b border-gray-100"
                                            onPress={() => {
                                                setCustomerGrouping(option.key);
                                                setShowCustomerGroupingDropdown(false);
                                                setErrors(prev => ({ ...prev, customerGrouping: '' }));
                                            }}
                                        >
                                            <Text className={`text-gray-800 ${customerGrouping === option.key ? 'font-bold text-teal-700' : ''}`}>
                                                {option.title}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity onPress={() => setShowCustomerGroupingDropdown(false)} className="p-3 border-t border-gray-200">
                                    <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* GST Type Dropdown Modal */}
                    <Modal
                        visible={showGSTTypeDropdown}
                        transparent animationType="fade"
                        onRequestClose={() => setShowGSTTypeDropdown(false)}
                    >
                        <View className="flex-1 bg-black/40 items-center justify-center px-4">
                            <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '60%' }}>
                                <View className="p-4 border-b border-gray-200">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-lg font-semibold text-gray-800">Select GST Type</Text>
                                        <TouchableOpacity onPress={() => setShowGSTTypeDropdown(false)}>
                                            <X size={20} color={COLORS.gray[600]} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <ScrollView>
                                    {gstTypes.map((type) => (
                                        <TouchableOpacity
                                            key={type.key}
                                            className="p-4 border-b border-gray-100"
                                            onPress={() => handleGSTTypeChange(type.key)}
                                        >
                                            <Text className={`text-gray-800 ${gstTypeValue === type.key ? 'font-bold text-teal-700' : ''}`}>
                                                {type.title}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity onPress={() => setShowGSTTypeDropdown(false)} className="p-3 border-t border-gray-200">
                                    <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* Country Dropdown Modal */}
                    <Modal
                        visible={showCountryDropdown || showShippingCountryDropdown}
                        transparent animationType="fade"
                        onRequestClose={() => {
                            setShowCountryDropdown(false);
                            setShowShippingCountryDropdown(false);
                        }}
                    >
                        <View className="flex-1 bg-black/40 items-center justify-center px-4">
                            <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '60%' }}>
                                <View className="p-4 border-b border-gray-200">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-lg font-semibold text-gray-800">Select Country</Text>
                                        <TouchableOpacity onPress={() => {
                                            setShowCountryDropdown(false);
                                            setShowShippingCountryDropdown(false);
                                        }}>
                                            <X size={20} color={COLORS.gray[600]} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <ScrollView>
                                    {countries
                                        .filter(c => c.name.toLowerCase() === 'india' || c.id === 'India')
                                        .map((country) => (
                                            <TouchableOpacity
                                                key={country.id}
                                                className="p-4 border-b border-gray-100"
                                                onPress={() => {
                                                    if (showCountryDropdown) {
                                                        handleCountryChange(country.id, 'billing');
                                                        setShowCountryDropdown(false);
                                                    } else {
                                                        handleCountryChange(country.id, 'shipping');
                                                        setShowShippingCountryDropdown(false);
                                                    }
                                                }}
                                            >
                                                <Text className={`text-gray-800 ${(showCountryDropdown ? billingCountryId : shippingCountryId) === country.id ? 'font-bold text-teal-700' : ''}`}>
                                                    {country.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                </ScrollView>
                                <TouchableOpacity onPress={() => {
                                    setShowCountryDropdown(false);
                                    setShowShippingCountryDropdown(false);
                                }} className="p-3 border-t border-gray-200">
                                    <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* State Dropdown Modal */}
                    <Modal
                        visible={showStateDropdown || showShippingStateDropdown}
                        transparent animationType="fade"
                        onRequestClose={() => {
                            setShowStateDropdown(false);
                            setShowShippingStateDropdown(false);
                        }}
                    >
                        <View className="flex-1 bg-black/40 items-center justify-center px-4">
                            <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '60%' }}>
                                <View className="p-4 border-b border-gray-200">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-lg font-semibold text-gray-800">Select State</Text>
                                        <TouchableOpacity onPress={() => {
                                            setShowStateDropdown(false);
                                            setShowShippingStateDropdown(false);
                                        }}>
                                            <X size={20} color={COLORS.gray[600]} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <ScrollView>
                                    {states.map((state) => (
                                        <TouchableOpacity
                                            key={state.id}
                                            className="p-4 border-b border-gray-100"
                                            onPress={() => {
                                                if (showStateDropdown) {
                                                    handleStateChange(state.id, 'billing');
                                                    setShowStateDropdown(false);
                                                } else {
                                                    handleStateChange(state.id, 'shipping');
                                                    setShowShippingStateDropdown(false);
                                                }
                                            }}
                                        >
                                            <Text className={`text-gray-800 ${(showStateDropdown ? billingStateId : shippingStateId) === state.id ? 'font-bold text-teal-700' : ''}`}>
                                                {state.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity onPress={() => {
                                    setShowStateDropdown(false);
                                    setShowShippingStateDropdown(false);
                                }} className="p-3 border-t border-gray-200">
                                    <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* City Dropdown Modal */}
                    <Modal
                        visible={showCityDropdown || showShippingCityDropdown}
                        transparent animationType="fade"
                        onRequestClose={() => {
                            setShowCityDropdown(false);
                            setShowShippingCityDropdown(false);
                        }}
                    >
                        <View className="flex-1 bg-black/40 items-center justify-center px-4">
                            <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '60%' }}>
                                <View className="p-4 border-b border-gray-200">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-lg font-semibold text-gray-800">Select City</Text>
                                        <TouchableOpacity onPress={() => {
                                            setShowCityDropdown(false);
                                            setShowShippingCityDropdown(false);
                                        }}>
                                            <X size={20} color={COLORS.gray[600]} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <ScrollView>
                                    {districts.map((city) => (
                                        <TouchableOpacity
                                            key={city.id}
                                            className="p-4 border-b border-gray-100"
                                            onPress={() => {
                                                if (showCityDropdown) {
                                                    setBillingDistrictId(city.id);
                                                    setShowCityDropdown(false);
                                                } else {
                                                    setShippingDistrictId(city.id);
                                                    setShowShippingCityDropdown(false);
                                                }
                                            }}
                                        >
                                            <Text className={`text-gray-800 ${(showCityDropdown ? billingDistrictId : shippingDistrictId) === city.id ? 'font-bold text-teal-700' : ''}`}>
                                                {city.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity onPress={() => {
                                    setShowCityDropdown(false);
                                    setShowShippingCityDropdown(false);
                                }} className="p-3 border-t border-gray-200">
                                    <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </View>

                {/* Billing Address Section */}
                <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
                    <Text className="text-base font-bold text-gray-800 mb-3">Billing Address</Text>

                    <View className="mb-3">
                        <FormLabel label="Address Line 1" />
                        <TextInput
                            value={billingAddress1}
                            onChangeText={setBillingAddress1}
                            className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                        />
                    </View>

                    <View className="mb-3">
                        <FormLabel label="Address Line 2" />
                        <TextInput
                            value={billingAddress2}
                            onChangeText={setBillingAddress2}
                            className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                        />
                    </View>

                    <View className="mb-3">
                        <FormLabel label="Address Line 3" />
                        <TextInput
                            value={billingAddress3}
                            onChangeText={setBillingAddress3}
                            className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                        />
                    </View>

                    <View className="mb-3">
                        <FormLabel label="Locality" />
                        <TextInput
                            value={billingLocality}
                            onChangeText={setBillingLocality}
                            className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                        />
                    </View>

                    <View className="mb-3">
                        <FormLabel label="Country" />
                        <TouchableOpacity
                            ref={countryRef}
                            onPress={() => {
                                countryRef.current?.measureInWindow((x, y, width, height) => {
                                    setDropdownLayout({ x, y, width, height });
                                    setShowCountryDropdown(true);
                                });
                            }}
                            className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 flex-row justify-between items-center"
                        >
                            <Text className="text-gray-900">
                                {countries.find(c => c.id === billingCountryId)?.name || billingCountryId || 'Select Country'}
                            </Text>
                            <ChevronLeft size={20} color="#666" style={{ transform: [{ rotate: '-90deg' }] }} />
                        </TouchableOpacity>
                    </View>

                    <View className="mb-3">
                        <FormLabel label="State" />
                        <TouchableOpacity
                            ref={stateRef}
                            onPress={() => {
                                if (billingCountryId) {
                                    stateRef.current?.measureInWindow((x, y, width, height) => {
                                        setDropdownLayout({ x, y, width, height });
                                        setShowStateDropdown(true);
                                    });
                                }
                            }}
                            className={`bg-white border rounded-lg px-3 py-2.5 flex-row justify-between items-center ${!billingCountryId ? 'bg-gray-100 border-gray-200' : 'border-gray-300'}`}
                            disabled={!billingCountryId}
                        >
                            <Text className={`text-gray-900 ${!billingCountryId ? 'text-gray-400' : ''}`}>
                                {states.find(s => s.id === billingStateId)?.name || billingStateId || (billingCountryId ? 'Select State' : 'Select country first')}
                            </Text>
                            <ChevronLeft size={20} color="#666" style={{ transform: [{ rotate: '-90deg' }] }} />
                        </TouchableOpacity>
                    </View>

                    <View className="mb-3">
                        <FormLabel label="City" />
                        <TouchableOpacity
                            ref={cityRef}
                            onPress={() => {
                                if (billingStateId) {
                                    cityRef.current?.measureInWindow((x, y, width, height) => {
                                        setDropdownLayout({ x, y, width, height });
                                        setShowCityDropdown(true);
                                    });
                                }
                            }}
                            className={`bg-white border rounded-lg px-3 py-2.5 flex-row justify-between items-center ${!billingStateId ? 'bg-gray-100 border-gray-200' : 'border-gray-300'}`}
                            disabled={!billingStateId}
                        >
                            <Text className={`text-gray-900 ${!billingStateId ? 'text-gray-400' : ''}`}>
                                {districts.find(d => d.id === billingDistrictId)?.name || billingDistrictId || (billingStateId ? 'Select City' : 'Select state first')}
                            </Text>
                            <ChevronLeft size={20} color="#666" style={{ transform: [{ rotate: '-90deg' }] }} />
                        </TouchableOpacity>
                    </View>

                    <View className="mb-3">
                        <FormLabel label="Pincode" />
                        <TextInput
                            value={billingPincode}
                            onChangeText={setBillingPincode}
                            keyboardType="numeric"
                            className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900"
                        />
                    </View>
                </View>

                {/* Shipping Address Section */}
                <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
                    <Text className="text-base font-bold text-gray-800 mb-3">Shipping Address</Text>

                    <View className="mb-4">
                        <TouchableOpacity
                            onPress={() => setSameAsBilling(!sameAsBilling)}
                            className="flex-row items-center gap-2"
                        >
                            <View className={`w-5 h-5 border-2 rounded items-center justify-center ${sameAsBilling ? 'bg-teal-600 border-teal-600' : 'border-gray-300'}`}>
                                {sameAsBilling && <Text className="text-white text-xs">✓</Text>}
                            </View>
                            <Text className="text-sm text-gray-700">
                                Shipping address same as Billing address
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View className="mb-3">
                        <FormLabel label="Address Line 1" />
                        <TextInput
                            value={sameAsBilling ? billingAddress1 : shippingAddress1}
                            onChangeText={setShippingAddress1}
                            editable={!sameAsBilling}
                            className={`border rounded-lg px-3 py-2.5 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'} text-gray-900`}
                        />
                    </View>

                    <View className="mb-3">
                        <FormLabel label="Address Line 2" />
                        <TextInput
                            value={sameAsBilling ? billingAddress2 : shippingAddress2}
                            onChangeText={setShippingAddress2}
                            editable={!sameAsBilling}
                            className={`border rounded-lg px-3 py-2.5 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'} text-gray-900`}
                        />
                    </View>

                    <View className="mb-3">
                        <FormLabel label="Address Line 3" />
                        <TextInput
                            value={sameAsBilling ? billingAddress3 : shippingAddress3}
                            onChangeText={setShippingAddress3}
                            editable={!sameAsBilling}
                            className={`border rounded-lg px-3 py-2.5 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'} text-gray-900`}
                        />
                    </View>

                    <View className="mb-3">
                        <FormLabel label="Locality" />
                        <TextInput
                            value={sameAsBilling ? billingLocality : shippingLocality}
                            onChangeText={setShippingLocality}
                            editable={!sameAsBilling}
                            className={`border rounded-lg px-3 py-2.5 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'} text-gray-900`}
                        />
                    </View>

                    <View className="mb-3">
                        <FormLabel label="Country" />
                        <TouchableOpacity
                            ref={shippingCountryRef}
                            onPress={() => {
                                if (!sameAsBilling) {
                                    shippingCountryRef.current?.measureInWindow((x, y, width, height) => {
                                        setDropdownLayout({ x, y, width, height });
                                        setShowShippingCountryDropdown(true);
                                    });
                                }
                            }}
                            className={`border rounded-lg px-3 py-2.5 flex-row justify-between items-center ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}
                            disabled={sameAsBilling}
                        >
                            <Text className={`text-gray-900 ${sameAsBilling ? 'text-gray-600' : ''}`}>
                                {sameAsBilling
                                    ? (countries.find(c => c.id === billingCountryId)?.name || billingCountryId || 'India')
                                    : (countries.find(c => c.id === shippingCountryId)?.name || shippingCountryId || 'India')
                                }
                            </Text>
                            {!sameAsBilling && <ChevronLeft size={20} color="#666" style={{ transform: [{ rotate: '-90deg' }] }} />}
                        </TouchableOpacity>
                    </View>

                    <View className="mb-3">
                        <FormLabel label="State" />
                        <TouchableOpacity
                            ref={shippingStateRef}
                            onPress={() => {
                                if (!sameAsBilling && shippingCountryId) {
                                    shippingStateRef.current?.measureInWindow((x, y, width, height) => {
                                        setDropdownLayout({ x, y, width, height });
                                        setShowShippingStateDropdown(true);
                                    });
                                }
                            }}
                            className={`border rounded-lg px-3 py-2.5 flex-row justify-between items-center ${sameAsBilling || !shippingCountryId ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}
                            disabled={sameAsBilling || !shippingCountryId}
                        >
                            <Text className={`text-gray-900 ${sameAsBilling || !shippingCountryId ? 'text-gray-600' : ''}`}>
                                {sameAsBilling
                                    ? (states.find(s => s.id === billingStateId)?.name || billingStateId || 'Tamil Nadu')
                                    : (states.find(s => s.id === shippingStateId)?.name || shippingStateId || 'Tamil Nadu')
                                }
                            </Text>
                            {!sameAsBilling && shippingCountryId && <ChevronLeft size={20} color="#666" style={{ transform: [{ rotate: '-90deg' }] }} />}
                        </TouchableOpacity>
                    </View>

                    <View className="mb-3">
                        <FormLabel label="City" />
                        {!sameAsBilling && shippingStateId ? (
                            <TouchableOpacity
                                ref={shippingCityRef}
                                onPress={() => {
                                    shippingCityRef.current?.measureInWindow((x, y, width, height) => {
                                        setDropdownLayout({ x, y, width, height });
                                        setShowShippingCityDropdown(true);
                                    });
                                }}
                                className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 flex-row justify-between items-center"
                            >
                                <Text className="text-gray-900">
                                    {districts.find(d => d.id === shippingDistrictId)?.name || shippingDistrictId || 'Select City'}
                                </Text>
                                <ChevronLeft size={20} color="#666" style={{ transform: [{ rotate: '-90deg' }] }} />
                            </TouchableOpacity>
                        ) : (
                            <View className={`border rounded-lg px-3 py-2.5 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-gray-50 border-gray-300'}`}>
                                <Text className={`${sameAsBilling ? 'text-gray-600' : 'text-gray-400'}`}>
                                    {sameAsBilling
                                        ? (districts.find(d => d.id === billingDistrictId)?.name || billingDistrictId || 'Select City')
                                        : (shippingStateId ? 'Select City' : 'Select state first')
                                    }
                                </Text>
                            </View>
                        )}
                    </View>

                    <View className="mb-3">
                        <FormLabel label="Pincode" />
                        <TextInput
                            value={sameAsBilling ? billingPincode : shippingPincode}
                            onChangeText={setShippingPincode}
                            editable={!sameAsBilling}
                            keyboardType="numeric"
                            className={`border rounded-lg px-3 py-2.5 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'} text-gray-900`}
                        />
                    </View>
                </View>

                {/* Referred Customers Section */}
                <View className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200">
                    <Text className="text-base font-bold text-gray-800 mb-3">Referred Customers</Text>
                    <TouchableOpacity className="bg-teal-600 rounded-lg py-3 items-center">
                        <Text className="text-white font-medium">No Referred Customers</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };

    const renderQuotationsTab = () => {
        console.log('📊 Rendering Quotations tab - count:', quotations.length);

        try {
            if (loadingQuotations) {
                return (
                    <View className="flex-1 bg-[#f5f5f5] items-center justify-center">
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text className="text-gray-500 mt-2">Loading quotations...</Text>
                    </View>
                );
            }

        return (
                <ScrollView className="flex-1 bg-[#f5f5f5] px-4 pb-4">
                    <View className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-2 shadow-sm">
                        <View className="bg-gray-700 px-3 py-3">
                            <View className="flex-row">
                                <Text className="text-white text-[10px] font-bold flex-1">Date</Text>
                                <Text className="text-white text-[10px] font-bold flex-1">Quotation ID</Text>
                                <Text className="text-white text-[10px] font-bold flex-1">Model Code</Text>
                                <Text className="text-white text-[10px] font-bold flex-1">Model Name</Text>
                                <Text className="text-white text-[10px] font-bold w-12 text-center">Action</Text>
                            </View>
                        </View>
                        {quotations.length === 0 ? (
                            <View className="p-8 items-center bg-white">
                                <Text className="text-gray-400 text-center">No quotations found for this customer</Text>
                                <Text className="text-gray-300 text-xs text-center mt-2">Create a new quotation to get started</Text>
                            </View>
                        ) : quotations.map((quotation, index) => (
                            <View
                                key={quotation.id || index}
                                className={`px-3 py-3 border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                            >
                                <View className="flex-row items-center">
                                    <Text className="text-[10px] text-gray-600 flex-1">
                                        {quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString('en-GB') : (quotation.date || 'N/A')}
                                    </Text>
                                    <Text className="text-[10px] text-teal-600 font-bold flex-1">
                                        {quotation.quotationId || quotation.id || 'N/A'}
                                    </Text>
                                    <Text className="text-[10px] text-gray-800 flex-1">
                                        {quotation.vehicle?.[0]?.vehicleDetail?.modelCode || quotation.modelCode || 'N/A'}
                                    </Text>
                                    <Text className="text-[10px] text-gray-800 flex-1" numberOfLines={1}>
                                        {getVehicleNames(quotation).join(', ') || quotation.modelName || 'N/A'}
                                    </Text>
                                    <TouchableOpacity
                                        className="w-12 items-center"
                                        onPress={() => {
                                            console.log('🔍 Quotation View button pressed:', { quotationId: quotation.id });
                                            safeNavigate('QuotationView' as any, { id: quotation.id });
                                        }}
                                    >
                                        <Text className="text-teal-600 text-[10px] font-medium">View</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            );
        } catch (error) {
            console.error('❌ Error in renderQuotationsTab:', error);
            return (
                <View className="flex-1 bg-[#f5f5f5] items-center justify-center p-4">
                    <Text className="text-red-600 text-center">Error loading quotations tab</Text>
                    <Text className="text-gray-500 text-xs text-center mt-2">Please try again</Text>
                </View>
            );
        }
    };

    const renderAssociatedVehiclesTab = () => {
        return (
            <ScrollView className="flex-1 bg-[#f5f5f5] px-4 pb-4">
                {associatedVehicles.length === 0 ? (
                    <View className="p-8 items-center mt-2">
                        <Text className="text-gray-400">No associated vehicles found</Text>
                    </View>
                ) : associatedVehicles.map((vehicle, index) => (
                    <View key={vehicle.id || index} className="bg-white rounded-lg p-4 mt-3 shadow-sm border border-gray-200">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-base font-bold text-gray-800">
                                {vehicle.vehicle?.modelCode} - {vehicle.vehicle?.modelName}
                            </Text>
                            <View className="bg-teal-50 px-2 py-1 rounded">
                                <Text className="text-teal-600 text-[10px] font-bold">{vehicle.registerNo || 'NOT REGISTERED'}</Text>
                            </View>
                        </View>
                        <View className="space-y-1">
                            <View className="flex-row">
                                <Text className="text-xs text-gray-500 w-24 mb-2">Chassis No:</Text>
                                <Text className="text-xs text-gray-800 font-medium">{vehicle.chassisNo || 'N/A'}</Text>
                            </View>
                            <View className="flex-row">
                                <Text className="text-xs text-gray-500 w-24 mb-2">Color:</Text>
                                <Text className="text-xs text-gray-800 font-medium">{vehicle.color?.color || 'N/A'}</Text>
                            </View>
                            <View className="flex-row">
                                <Text className="text-xs text-gray-500 w-24">Date of Sale:</Text>
                                <Text className="text-xs text-gray-800 font-medium">
                                    {vehicle.dateOfSale ? new Date(vehicle.dateOfSale).toLocaleDateString('en-GB') : 'N/A'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            className="mt-4 border border-teal-600 rounded-lg py-2 items-center"
                            onPress={() => safeNavigate('VehicleDetails' as any, { vehicle })}
                        >
                            <Text className="text-teal-600 text-xs font-bold">View Vehicle Details</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        );
    };

    const renderBookingsTab = () => {
        return (
            <ScrollView className="flex-1 bg-[#f5f5f5] px-4 pb-4">
                {/* Action Buttons */}
                <View className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-2 shadow-sm p-4">
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            className="flex-1 bg-teal-600 rounded-lg py-3 items-center justify-center"
                            onPress={() => {
                                const customerPhone = phoneNumbers && phoneNumbers.length > 0 ? phoneNumbers[0].number : '';
                                safeNavigate('BookingConfirmActivity' as any, { 
                                    customerId, 
                                    customerName, 
                                    customerPhone,
                                    isConfirmBooking: true 
                                });
                            }}
                        >
                            <Text className="text-white font-medium text-sm">Add Confirm Booking</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 bg-teal-600 rounded-lg py-3 items-center justify-center"
                            onPress={() => {
                                const customerPhone = phoneNumbers && phoneNumbers.length > 0 ? phoneNumbers[0].number : '';
                                safeNavigate('BookingActivity' as any, {
                                    customerId,
                                    customerName,
                                    customerPhone,
                                    isAdvancedBooking: true
                                });
                            }}
                        >
                            <Text className="text-white font-medium text-sm">Add Advanced Booking</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bookings List */}
                <View className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-2 shadow-sm">
                    <View className="bg-gray-700 px-3 py-3">
                        <View className="flex-row">
                            <Text className="text-white text-[10px] font-bold flex-1">Date</Text>
                            <Text className="text-white text-[10px] font-bold flex-1">Booking ID</Text>
                            <Text className="text-white text-[10px] font-bold flex-1">Model Name</Text>
                            <Text className="text-white text-[10px] font-bold flex-1">Status</Text>
                        </View>
                    </View>
                    {bookings.length === 0 ? (
                        <View className="p-8 items-center bg-white">
                            <Text className="text-gray-400 text-center">No bookings found for this customer</Text>
                            <Text className="text-gray-300 text-xs text-center mt-2">Create a new booking to get started</Text>
                        </View>
                    ) : bookings.map((booking, index) => (
                        <View key={booking.id || index} className={`px-3 py-3 border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <View className="flex-row items-center">
                                <Text className="text-[10px] text-gray-600 flex-1">
                                    {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-GB') : 'N/A'}
                                </Text>
                                <Text className="text-[10px] text-teal-600 font-bold flex-1">{booking.bookingId || 'N/A'}</Text>
                                <Text className="text-[10px] text-gray-800 flex-1">{booking.vehicle?.modelName || 'N/A'}</Text>
                                <View className="flex-1">
                                    <View className={`px-1.5 py-0.5 rounded self-start ${booking.bookingStatus === 'COMPLETED' ? 'bg-green-100' : 'bg-orange-100'}`}>
                                        <Text className={`text-[8px] font-bold ${booking.bookingStatus === 'COMPLETED' ? 'text-green-600' : 'text-orange-600'}`}>
                                            {booking.bookingStatus || 'PENDING'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        );
    };

    const renderJobOrdersTab = () => {
        return (
            <ScrollView className="flex-1 bg-[#f5f5f5] px-4 pb-4">
                {jobOrders.length === 0 ? (
                    <View className="p-8 items-center mt-2">
                        <Text className="text-gray-400">No job orders found</Text>
                    </View>
                ) : jobOrders.map((job, index) => (
                    <View key={job.id || index} className="bg-white rounded-lg p-4 mt-3 shadow-sm border border-gray-200">
                        <View className="flex-row justify-between mb-3">
                            <View>
                                <Text className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">JOB ORDER ID</Text>
                                <Text className="text-sm font-bold text-teal-600">{job.jobCardId || job.id}</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">DATE</Text>
                                <Text className="text-xs font-medium text-gray-800">
                                    {job.orderDate ? new Date(job.orderDate).toLocaleDateString('en-GB') : 'N/A'}
                                </Text>
                            </View>
                        </View>
                        <View className="border-t border-gray-100 pt-3 flex-row justify-between">
                            <View className="flex-1">
                                <Text className="text-[10px] text-gray-500 font-bold mb-1">VEHICLE</Text>
                                <Text className="text-xs text-gray-800">{job.soldVehicle?.vehicleDetail?.modelName || 'N/A'}</Text>
                                <Text className="text-[10px] text-gray-600">{job.soldVehicle?.registerNo || job.soldVehicle?.chassisNo}</Text>
                            </View>
                            <View className="flex-1 items-end">
                                <Text className="text-[10px] text-gray-500 font-bold mb-1">STATUS</Text>
                                <View className="bg-blue-50 px-2 py-0.5 rounded">
                                    <Text className="text-blue-600 text-[10px] font-bold">{job.status || 'OPEN'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>
        );
    };

    const renderSpareOrdersTab = () => {
        return (
            <ScrollView className="flex-1 bg-[#f5f5f5] px-4 pb-4">
                <View className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-2 shadow-sm">
                    <View className="bg-gray-700 px-3 py-3">
                        <View className="flex-row">
                            <Text className="text-white text-[10px] font-bold flex-1">Date</Text>
                            <Text className="text-white text-[10px] font-bold flex-1">Order No</Text>
                            <Text className="text-white text-[10px] font-bold flex-1">Chassis No</Text>
                            <Text className="text-white text-[10px] font-bold flex-1">Type</Text>
                        </View>
                    </View>
                    {spareOrders.length === 0 ? (
                        <View className="p-8 items-center bg-white">
                            <Text className="text-gray-400">No spare orders found</Text>
                        </View>
                    ) : spareOrders.map((order, index) => (
                        <View key={order.id || index} className={`px-3 py-3 border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <View className="flex-row items-center">
                                <Text className="text-[10px] text-gray-600 flex-1">
                                    {order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB') : 'N/A'}
                                </Text>
                                <Text className="text-[10px] text-teal-600 font-bold flex-1">{order.orderNumber || 'N/A'}</Text>
                                <Text className="text-[10px] text-gray-800 flex-1">{order.soldVehicle?.chassisNo || 'N/A'}</Text>
                                <Text className="text-[10px] text-gray-800 flex-1">{order.orderType || 'N/A'}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        );
    };

    const renderCallHistoryTab = () => {
        return (
            <ScrollView className="flex-1 bg-[#f5f5f5] px-4 pb-4">
                {callHistory.length === 0 ? (
                    <View className="p-8 items-center mt-2">
                        <Text className="text-gray-400">No call history found</Text>
                    </View>
                ) : callHistory.map((call, index) => (
                    <View key={call.id || index} className="bg-white rounded-lg p-3 mt-3 shadow-sm border border-gray-200">
                        <View className="flex-row items-center">
                            <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${call.direction === 'inbound' ? 'bg-green-50' : 'bg-blue-50'}`}>
                                <Clock size={16} color={call.direction === 'inbound' ? '#10b981' : '#3b82f6'} />
                            </View>
                            <View className="flex-1">
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-xs font-bold text-gray-800">{call.user_name || 'System User'}</Text>
                                    <Text className="text-[10px] text-gray-500">
                                        {call.createdAt ? new Date(call.createdAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                                    </Text>
                                </View>
                                <Text className="text-[10px] text-gray-600 mt-1">
                                    {call.direction === 'inbound' ? 'Received from: ' : 'Called to: '}
                                    {call.direction === 'inbound' ? call.from : call.to}
                                </Text>
                                <View className="flex-row items-center mt-1">
                                    <View className={`px-1.5 py-0.5 rounded ${call.status === 'missed' ? 'bg-red-50' : 'bg-green-50'}`}>
                                        <Text className={`text-[8px] font-bold ${call.status === 'missed' ? 'text-red-600' : 'text-green-600'}`}>
                                            {call.status?.toUpperCase() || 'ANSWERED'}
                                        </Text>
                                    </View>
                                    {call.module && (
                                        <Text className="text-[8px] text-gray-400 ml-2 font-medium italic">#{call.module}</Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>
        );
    };

    const renderNumberPlatesTab = () => {
        return (
            <ScrollView className="flex-1 bg-[#f5f5f5] px-4 pb-4">
                <View className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-2 shadow-sm">
                    <View className="bg-gray-700 px-3 py-3">
                        <View className="flex-row">
                            <Text className="text-white text-[10px] font-bold flex-1">App No</Text>
                            <Text className="text-white text-[10px] font-bold flex-1">Registration No</Text>
                            <Text className="text-white text-[10px] font-bold flex-1">Status</Text>
                        </View>
                    </View>
                    {numberPlates.length === 0 ? (
                        <View className="p-8 items-center bg-white">
                            <Text className="text-gray-400">No number plate orders found</Text>
                        </View>
                    ) : numberPlates.map((plate, index) => (
                        <View key={plate.id || index} className={`px-3 py-3 border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <View className="flex-row items-center">
                                <Text className="text-[10px] text-gray-800 font-bold flex-1">{plate.applicationNo || 'N/A'}</Text>
                                <Text className="text-[10px] text-teal-600 font-bold flex-1">{plate.registerNo || 'N/A'}</Text>
                                <View className="flex-1">
                                    <View className={`px-1.5 py-0.5 rounded self-start ${plate.plateOrderStatus === 'RECEIVED' ? 'bg-green-100' : 'bg-orange-100'}`}>
                                        <Text className={`text-[8px] font-bold ${plate.plateOrderStatus === 'RECEIVED' ? 'text-green-600' : 'text-orange-600'}`}>
                                            {plate.plateOrderStatus || 'ORDERED'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        );
    };

    const renderPaymentsTab = () => {
        return (
            <ScrollView className="flex-1 bg-[#f5f5f5] px-4 pb-4">
                <View className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-2 shadow-sm">
                    <View className="bg-gray-700 px-3 py-3">
                        <View className="flex-row">
                            <Text className="text-white text-[10px] font-bold flex-1">Date</Text>
                            <Text className="text-white text-[10px] font-bold flex-1">Booking ID</Text>
                            <Text className="text-white text-[10px] font-bold flex-1">Amount</Text>
                            <Text className="text-white text-[10px] font-bold flex-1">Status</Text>
                        </View>
                    </View>
                    {payments.length === 0 ? (
                        <View className="p-8 items-center bg-white">
                            <Text className="text-gray-400">No payment records found</Text>
                        </View>
                    ) : payments.map((payment, index) => (
                        <View key={payment.id || index} className={`px-3 py-3 border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <View className="flex-row items-center">
                                <Text className="text-[10px] text-gray-600 flex-1">
                                    {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('en-GB') : 'N/A'}
                                </Text>
                                <Text className="text-[10px] text-gray-800 font-medium flex-1">{payment.bookingId || 'N/A'}</Text>
                                <Text className="text-[10px] text-gray-900 font-bold flex-1">₹ {payment.billAmount?.toLocaleString() || payment.amount || '0'}</Text>
                                <View className="flex-1">
                                    <Text className={`text-[10px] font-bold ${payment.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}>
                                        {payment.status || 'PENDING'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        );
    };

    const renderTabContent = () => {
        console.log('🎯 renderTabContent called:', {
            activeTab,
            hasNavigation: !!navigation,
            hasNavigate: !!(navigation && navigation.navigate),
            navigationType: typeof navigation
        });

        switch (activeTab) {
            case 'customer-details':
                return renderCustomerDetailsTab();
            case 'associated-vehicles':
                return renderAssociatedVehiclesTab();
            case 'bookings':
                return renderBookingsTab();
            case 'quotations':
                return renderQuotationsTab();
            case 'job-orders':
                return renderJobOrdersTab();
            case 'spare-orders':
                return renderSpareOrdersTab();
            case 'call-history':
                return renderCallHistoryTab();
            case 'number-plates':
                return renderNumberPlatesTab();
            case 'payments':
                return renderPaymentsTab();
            default:
                return (
                    <View className="flex-1 bg-[#f5f5f5] items-center justify-center p-4">
                        <Text className="text-gray-400 text-center">No data available for {activeTab}</Text>
                    </View>
                );
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#f5f5f5]">
            {/* Header */}
            <HeaderWithBack
                title="Customer Details"
                onBackPress={() => {
                    const target = getBackNavigationTarget();
                    console.log(`🔍 Closing CustomerDetails, navigating to ${target.screen}`);
                    
                    if (target.useGoBack) {
                        navigation.goBack();
                    } else {
                        safeNavigate(target.screen as any);
                    }
                }}
            />

            {/* Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="bg-white border-b border-gray-200"
                contentContainerStyle={{ paddingHorizontal: 8 }}
                style={{ flexGrow: 0 }}
            >
                {CUSTOMER_TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => setActiveTab(tab.id)}
                        className={`px-4 py-4 border-b-2 ${activeTab === tab.id ? 'border-teal-600' : 'border-transparent'}`}
                    >
                        <Text className={`text-xs font-bold ${activeTab === tab.id ? 'text-teal-600' : 'text-gray-600'}`}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Tab Content */}
            {renderTabContent()}

            {/* Follow-up Date Picker */}
            {showFollowUpDatePicker && (
                <DateTimePicker
                    value={new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleFollowUpDateChange}
                />
            )}

            {/* DOB Calendar Modal */}
            <Modal visible={showDobCalendarModal} transparent animationType="fade" onRequestClose={() => setShowDobCalendarModal(false)}>
                <View className="flex-1 bg-black/40 items-center justify-center px-4">
                    <View className="bg-white rounded-2xl p-4 w-full max-w-md">
                        <Text className="text-gray-900 font-bold mb-3">Select Date of Birth</Text>
                        <RNCalendar
                            current={dob ? moment(dob, 'DD/MM/YYYY').format('YYYY-MM-DD') : new Date().toISOString().split('T')[0]}
                            onDayPress={handleDobDateSelect}
                            theme={{
                                todayTextColor: COLORS.primary,
                                selectedDayBackgroundColor: COLORS.primary,
                                selectedDayTextColor: '#fff',
                                arrowColor: COLORS.primary,
                            }}
                            markedDates={
                                dob
                                    ? {
                                        [moment(dob, 'DD/MM/YYYY').format('YYYY-MM-DD')]: {
                                            selected: true,
                                            selectedColor: COLORS.primary,
                                        },
                                    }
                                    : undefined
                            }
                        />
                        <View className="flex-row justify-end mt-4">
                            <TouchableOpacity onPress={() => setShowDobCalendarModal(false)} className="px-4 py-2 rounded-lg bg-teal-600">
                                <Text className="text-white font-semibold">Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Time Picker Modal */}
            <Modal visible={timeDropdownOpen} transparent animationType="fade" onRequestClose={() => setTimeDropdownOpen(false)}>
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setTimeDropdownOpen(false)}
                    style={{ flex: 1, backgroundColor: 'transparent' }}
                >
                    {timeDropdownLayout && (
                        <View
                            style={{
                                position: 'absolute',
                                left: Math.max(16, Math.min(timeDropdownLayout.x, Dimensions.get('window').width - timeDropdownLayout.width - 16)),
                                top: timeDropdownLayout.y + timeDropdownLayout.height + 8,
                                width: Math.min(timeDropdownLayout.width, Dimensions.get('window').width - 32),
                                backgroundColor: 'white',
                                borderWidth: 1,
                                borderColor: '#e5e7eb',
                                borderRadius: 12,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 8,
                                elevation: 10,
                            }}
                        >
                            <View className="flex-row">
                                <ScrollView className="flex-1 max-h-48">
                                    <View className="py-2">
                                        {buildHourOptions().map((hour) => (
                                            <TouchableOpacity
                                                key={hour}
                                                onPress={() => setSelectedHour(parseInt(hour))}
                                                className={`px-4 py-3 ${selectedHour === parseInt(hour) ? 'bg-teal-50' : ''}`}
                                            >
                                                <Text className={`text-sm ${selectedHour === parseInt(hour) ? 'text-teal-700 font-bold' : 'text-gray-700'}`}>
                                                    {hour}:00
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                                <ScrollView className="flex-1 max-h-48 border-l border-gray-200">
                                    <View className="py-2">
                                        {minuteOptions.map((minute) => (
                                            <TouchableOpacity
                                                key={minute}
                                                onPress={() => setSelectedMinute(minute)}
                                                className={`px-4 py-3 ${selectedMinute === minute ? 'bg-teal-50' : ''}`}
                                            >
                                                <Text className={`text-sm ${selectedMinute === minute ? 'text-teal-700 font-bold' : 'text-gray-700'}`}>
                                                    :{minute}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                            <View className="border-t border-gray-200 p-3">
                                <TouchableOpacity
                                    onPress={() => {
                                        if (selectedHour === null || selectedMinute === null) return;
                                        const label = `${String(selectedHour).padStart(2, '0')}:${selectedMinute}`;
                                        setFollowUpTime(label);
                                        setTimeDropdownOpen(false);
                                        setSelectedHour(null);
                                        setSelectedMinute(null);
                                    }}
                                    className="bg-teal-600 rounded-lg py-2 items-center"
                                    style={{ paddingHorizontal: 12 }}
                                >
                                    <Text className="text-white font-medium text-sm">Set Time</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </TouchableOpacity>
            </Modal>

            {/* Footer */}
            <View className="bg-white border-t border-gray-200 p-4 flex-row">
                <Button
                    title="Cancel"
                    variant="outline"
                    className="flex-1 mr-2"
                    onPress={handleClose}
                />
                <Button
                    title={isSaving ? "Saving..." : "Save"}
                    className="flex-1 ml-2"
                    onPress={handleSave}
                    disabled={isSaving}
                />
            </View>
        </SafeAreaView>
    );
}

// Custom comparison function for React.memo
const areEqual = (prevProps: any, nextProps: any) => {
    // If the route params (customerId) haven't changed, don't re-render
    return prevProps?.route?.params?.customerId === nextProps?.route?.params?.customerId;
};

// Wrap with React.memo to prevent unnecessary re-renders
const CustomerDetailsScreen = React.memo(CustomerDetailsScreenComponent, areEqual);

export default CustomerDetailsScreen;