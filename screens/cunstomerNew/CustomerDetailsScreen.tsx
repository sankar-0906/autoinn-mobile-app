import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    FlatList,
    Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
    ChevronLeft,
    Phone,
    User,
    Mail,
    MapPin,
    Calendar,
    FileText,
    Car,
    Plus,
    X,
    Edit,
    Eye,
    Trash2,
    Edit2,
} from 'lucide-react-native';
import { RootStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { HeaderWithBack, useBackButton } from '../../components/ui/BackButton';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { getCustomerDetails, updateCustomer, getCountries, getStates, getCities, getCustomerQuotations } from '../../src/api';
import JobOrdersSection from '../../components/customer/JobOrdersSection';
import SpareOrdersSection from '../../components/customer/SpareOrdersSection';
import CallHistorySection from '../../components/customer/CallHistorySection';
import NumberPlatesSection from '../../components/customer/NumberPlatesSection';
import PaymentsSection from '../../components/customer/PaymentsSection';

type CustomerDetailsRouteProp = RouteProp<RootStackParamList, 'CustomerDetails'>;
type CustomerDetailsNavProp = StackNavigationProp<RootStackParamList, 'CustomerDetails'>;

interface PhoneNumber {
    id: string;
    number: string;
    type: 'Primary' | 'Alternate' | 'Office' | 'Home' | 'Mobile';
    validity: 'Valid' | 'Invalid';
    whatsapp: 'Yes' | 'No';
    dnd: 'Yes' | 'No';
}

interface Quotation {
    id: string;
    quotationId: string;
    vehicle: string;
    createdOn: string;
    status?: string;
}

interface Booking {
    id: string;
    bookingId: string;
    vehicle: string;
    createdOn: string;
    status?: string;
}

interface Document {
    id: string;
    name: string;
    type: string;
    uploadedOn: string;
}

const CustomerDetailsScreen: React.FC = () => {
    const navigation = useNavigation<CustomerDetailsNavProp>();
    const route = useRoute<CustomerDetailsRouteProp>();
    const { customerId } = route.params || { customerId: 'CNS33355' };
    const insets = useSafeAreaInsets();
    
    const [activeTab, setActiveTab] = useState('customer-details');
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [customerData, setCustomerData] = useState<any>(null);

    // API-based dropdown data state
    const [apiCountries, setApiCountries] = useState<Array<{ id: string; name: string }>>([]);
    const [apiStates, setApiStates] = useState<Array<{ id: string; name: string }>>([]);
    const [apiCities, setApiCities] = useState<Array<{ id: string; name: string }>>([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    // Dropdown layout state
    const [dropdownLayout, setDropdownLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    // Dropdown visibility states
    const [showCustomerTypeDropdown, setShowCustomerTypeDropdown] = useState(false);
    const [showSalutationDropdown, setShowSalutationDropdown] = useState(false);
    const [showGstTypeDropdown, setShowGstTypeDropdown] = useState(false);
    const [showCustomerGroupingDropdown, setShowCustomerGroupingDropdown] = useState(false);
    const [showBillingCountryDropdown, setShowBillingCountryDropdown] = useState(false);
    const [showBillingStateDropdown, setShowBillingStateDropdown] = useState(false);
    const [showBillingCityDropdown, setShowBillingCityDropdown] = useState(false);
    const [showShippingCountryDropdown, setShowShippingCountryDropdown] = useState(false);
    const [showShippingStateDropdown, setShowShippingStateDropdown] = useState(false);
    const [showShippingCityDropdown, setShowShippingCityDropdown] = useState(false);
    const [showPhoneTypeDropdown, setShowPhoneTypeDropdown] = useState(false);
    const [showWhatsAppDropdown, setShowWhatsAppDropdown] = useState(false);
    const [showDndDropdown, setShowDndDropdown] = useState(false);

    // Dropdown refs
    const customerTypeRef = useRef<View>(null);
    const salutationRef = useRef<View>(null);
    const gstTypeRef = useRef<View>(null);
    const customerGroupingRef = useRef<View>(null);
    const billingCountryRef = useRef<View>(null);
    const billingStateRef = useRef<View>(null);
    const billingCityRef = useRef<View>(null);
    const shippingCountryRef = useRef<View>(null);
    const shippingStateRef = useRef<View>(null);
    const shippingCityRef = useRef<View>(null);

    // Static dropdown options
    const customerTypes = [
        { key: "Non-Customer", title: "Non Customer" },
        { key: "Customer", title: "Customer" },
        { key: "Sales Customer", title: "Sales Customer" },
        { key: "Lead", title: "Lead" },
        { key: "Prospect", title: "Prospect" },
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

    const customerGroupings = [
        { key: "Individual", title: "Individual" },
        { key: "Non-Individual", title: "Non-Individual" },
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

    const genders = [
        { key: "Male", title: "Male" },
        { key: "Female", title: "Female" },
        { key: "Other", title: "Other" },
    ];

    // Form state
    const [customerType, setCustomerType] = useState('');
    const [salutation, setSalutation] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [fatherName, setFatherName] = useState('');
    const [gender, setGender] = useState('');
    const [dob, setDob] = useState('');
    const [email, setEmail] = useState('');
    const [gstType, setGstType] = useState('Unregistered');
    const [gstin, setGstin] = useState('');
    const [customerGrouping, setCustomerGrouping] = useState('');
    const [displayCustomerId, setDisplayCustomerId] = useState('');

    // Phone Numbers State
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
    const [newPhone, setNewPhone] = useState('');
    const [newPhoneType, setNewPhoneType] = useState<string>('Alternate');
    const [newWhatsApp, setNewWhatsApp] = useState<string>('No');
    const [newDND, setNewDND] = useState<string>('No');

    // Phone number editing states
    const [editingPhoneIndex, setEditingPhoneIndex] = useState<number | null>(null);
    const [showEditPhoneModal, setShowEditPhoneModal] = useState(false);
    const [editPhoneData, setEditPhoneData] = useState({
        number: '',
        type: 'Alternate' as 'Primary' | 'Alternate' | 'Office' | 'Home' | 'Mobile',
        whatsapp: 'No' as 'Yes' | 'No',
        dnd: 'No' as 'Yes' | 'No'
    });

    // Address State
    const [billingAddress, setBillingAddress] = useState({
        address1: '',
        address2: '',
        address3: '',
        locality: '',
        country: '',
        state: '',
        city: '',
        pincode: ''
    });

    const [shippingAddress, setShippingAddress] = useState({
        address1: '',
        address2: '',
        address3: '',
        locality: '',
        country: '',
        state: '',
        city: '',
        pincode: ''
    });

    const [sameAsBilling, setSameAsBilling] = useState(false);

    // Calendar state for DOB
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [dobCalendarStep, setDobCalendarStep] = useState<'year' | 'month' | 'day'>('year');
    const [dobPickYear, setDobPickYear] = useState(new Date().getFullYear());
    const [dobPickMonth, setDobPickMonth] = useState(new Date().getMonth());

    // Force update state
    const [forceUpdate, setForceUpdate] = useState(0);

    // Dynamic data for other tabs
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [purchasedVehicles, setPurchasedVehicles] = useState<any[]>([]);
    const [documents] = useState<Document[]>([
        {
            id: '1',
            name: 'Driving License',
            type: 'PDF',
            uploadedOn: '15/09/2025'
        },
        {
            id: '2',
            name: 'Aadhaar Card',
            type: 'PDF',
            uploadedOn: '15/09/2025'
        }
    ]);

    const tabs = [
        { id: 'customer-details', label: 'Customer Details' },
        { id: 'associated-vehicles', label: 'Associated Vehicles' },
        { id: 'bookings', label: 'Bookings' },
        { id: 'quotations', label: 'Quotations' },
        { id: 'job-orders', label: 'Job Orders' },
        { id: 'spare-orders', label: 'Spare Orders' },
        { id: 'call-history', label: 'Call History' },
        { id: 'number-plates', label: 'Number Plates' },
        { id: 'payments', label: 'Payments' }
    ];

    // Form label component
    const FormLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
        <Text className="text-sm text-gray-600 mb-1 font-medium">
            {label}
            {required && <Text className="text-red-500"> *</Text>}
        </Text>
    );

    // API fetch functions
    const fetchCountries = async () => {
        setLoadingCountries(true);
        try {
            const response = await getCountries();
            const data = response?.data;
            if (data?.code === 200) {
                const indiaOnly = (data.data || []).filter((c: any) =>
                    c.name.toLowerCase() === 'india' || c.id === 'India'
                );
                setApiCountries(indiaOnly);
                console.log('🌍 Countries fetched:', indiaOnly.length);
            }
        } catch (error) {
            console.error('❌ Error fetching countries:', error);
        } finally {
            setLoadingCountries(false);
        }
    };

    const fetchStates = async (countryId: string) => {
        setLoadingStates(true);
        try {
            const response = await getStates(countryId);
            const data = response?.data;
            if (data?.code === 200) {
                setApiStates(data.data || []);
                setApiCities([]);
                console.log('🗺️ States fetched:', (data.data || []).length);
            }
        } catch (error) {
            console.error('❌ Error fetching states:', error);
        } finally {
            setLoadingStates(false);
        }
    };

    const fetchCities = async (stateId: string) => {
        setLoadingCities(true);
        try {
            const response = await getCities(stateId);
            const data = response?.data;
            if (data?.code === 200) {
                setApiCities(data.data || []);
                console.log('🏙️ Cities fetched:', (data.data || []).length);
            }
        } catch (error) {
            console.error('❌ Error fetching cities:', error);
        } finally {
            setLoadingCities(false);
        }
    };

    // Fetch customer data on component mount
    useEffect(() => {
        const fetchCustomerData = async () => {
            if (!customerId) return;
            
            setLoading(true);
            try {
                console.log('🔍 CustomerDetailsScreen - Fetching customer data for ID:', customerId);
                const response = await getCustomerDetails(customerId);
                
                if (response.data?.code === 200 && response.data?.response?.data) {
                    const responseData = response.data.response.data;
                    const customer = responseData.customer;
                    console.log('✅ CustomerDetailsScreen - Customer data fetched successfully');
                    setCustomerData(customer);
                    
                    // Set display customer ID
                    setDisplayCustomerId(customer.customerId || customer.id || customerId);
                    
                    // Set form fields
                    if (customer.customerType) setCustomerType(customer.customerType);
                    if (customer.salutation) setSalutation(customer.salutation);
                    if (customer.name) setCustomerName(customer.name);
                    if (customer.fatherName) setFatherName(customer.fatherName);
                    if (customer.gender) setGender(customer.gender);
                    if (customer.dateOfBirth) {
                        const date = new Date(customer.dateOfBirth);
                        if (!isNaN(date.getTime())) {
                            const formattedDob = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                            setDob(formattedDob);
                        }
                    }
                    if (customer.email) setEmail(customer.email);
                    if (customer.GSTType) setGstType(customer.GSTType);
                    if (customer.GSTNo) setGstin(customer.GSTNo);
                    if (customer.customerGrouping) setCustomerGrouping(customer.customerGrouping);
                    
                    // Set phone numbers
                    if (customer.contacts && customer.contacts.length > 0) {
                        const mappedPhones = customer.contacts.map((contact: any, index: number) => ({
                            id: contact.id || String(index + 1),
                            number: contact.phone || '',
                            type: contact.type || 'Primary',
                            validity: contact.valid ? 'Valid' : 'Invalid',
                            whatsapp: contact.WhatsApp ? 'Yes' : 'No',
                            dnd: contact.DND ? 'Yes' : 'No'
                        }));
                        setPhoneNumbers(mappedPhones);
                    }
                    
                    // Set billing address
                    if (customer.address) {
                        setBillingAddress({
                            address1: customer.address.line1 || '',
                            address2: customer.address.line2 || '',
                            address3: customer.address.line3 || '',
                            locality: customer.address.locality || '',
                            country: customer.address.country?.id || '',
                            state: customer.address.state?.id || '',
                            city: customer.address.district?.id || '',  // ✅ Fix: Read from district field
                            pincode: customer.address.pincode || ''
                        });
                        
                        // Fetch states and cities if country/state exist
                        if (customer.address.country?.id) {
                            fetchStates(customer.address.country.id);
                        }
                        if (customer.address.state?.id) {
                            fetchCities(customer.address.state.id);
                        }
                    }
                    
                    // Set quotations
                    if (customer.quotation && customer.quotation.length > 0) {
                        const quotationData = customer.quotation.map((quot: any) => ({
                            id: quot.id,
                            quotationId: quot.quotationId,
                            vehicle: quot.vehicle?.[0]?.vehicleDetail?.modelName || 'N/A',
                            modelCode: quot.vehicle?.[0]?.vehicleDetail?.modelCode || 'N/A',
                            createdOn: quot.createdAt ? moment(quot.createdAt).format('DD/MM/YYYY') : 'N/A',
                            status: quot.quotationStatus || 'Active'
                        }));
                        setQuotations(quotationData);
                    }
                    
                    // Set purchased vehicles
                    if (customer.purchasedVehicle && customer.purchasedVehicle.length > 0) {
                        setPurchasedVehicles(customer.purchasedVehicle);
                    }
                    
                    // Set bookings
                    if (customer.booking && customer.booking.length > 0) {
                        const bookingData = customer.booking.map((booking: any) => ({
                            id: booking.id,
                            bookingId: booking.bookingId,
                            vehicle: booking.vehicle?.modelName || 'N/A',
                            createdOn: booking.createdAt ? moment(booking.createdAt).format('DD/MM/YYYY') : 'N/A',
                            status: booking.bookingStatus || 'Pending',
                            color: booking.color,
                            registerNo: booking.registerNo || booking.registrationNumber || 'N/A'
                        }));
                        setBookings(bookingData);
                    }
                    
                    setForceUpdate(prev => prev + 1);
                }
            } catch (error) {
                console.error('❌ CustomerDetailsScreen - Error fetching customer data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomerData();
        fetchCountries();
    }, [customerId]);

    // Handle country change
    const handleCountryChange = async (countryId: string, type: 'billing' | 'shipping') => {
        if (type === 'billing') {
            setBillingAddress(prev => ({ ...prev, country: countryId, state: '', city: '' }));
        } else {
            setShippingAddress(prev => ({ ...prev, country: countryId, state: '', city: '' }));
        }
        await fetchStates(countryId);
    };

    // Handle state change
    const handleStateChange = async (stateId: string, type: 'billing' | 'shipping') => {
        if (type === 'billing') {
            setBillingAddress(prev => ({ ...prev, state: stateId, city: '' }));
        } else {
            setShippingAddress(prev => ({ ...prev, state: stateId, city: '' }));
        }
        await fetchCities(stateId);
    };

    // Handle city change
    const handleCityChange = (cityId: string, type: 'billing' | 'shipping') => {
        if (type === 'billing') {
            setBillingAddress(prev => ({ ...prev, city: cityId }));
        } else {
            setShippingAddress(prev => ({ ...prev, city: cityId }));
        }
    };

    // Handle GST type change
    const handleGstTypeChange = (value: string) => {
        setGstType(value);
        if (value === 'Unregistered') {
            setGstin('');
        }
    };

    // Phone number handlers
    const handleAddPhone = () => {
        if (newPhone.trim()) {
            const newPhoneObj: PhoneNumber = {
                id: Date.now().toString(),
                number: newPhone,
                type: newPhoneType as any,
                validity: 'Valid',
                whatsapp: newWhatsApp as any,
                dnd: newDND as any
            };
            setPhoneNumbers([...phoneNumbers, newPhoneObj]);
            setNewPhone('');
            setNewPhoneType('Alternate');
            setNewWhatsApp('No');
            setNewDND('No');
        }
    };

    const handleEditPhone = (index: number) => {
        const phone = phoneNumbers[index];
        setEditPhoneData({
            number: phone.number,
            type: phone.type,
            whatsapp: phone.whatsapp,
            dnd: phone.dnd
        });
        setEditingPhoneIndex(index);
        setShowEditPhoneModal(true);
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

    const handleDeletePhone = (index: number) => {
        Alert.alert(
            'Delete Phone',
            'Are you sure you want to delete this phone number?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: () => {
                        const updatedPhones = phoneNumbers.filter((_, i) => i !== index);
                        setPhoneNumbers(updatedPhones);
                    }
                }
            ]
        );
    };

    const handlePhoneTypeChange = (type: string) => {
        if (editingPhoneIndex !== null && showEditPhoneModal) {
            setEditPhoneData(prev => ({ ...prev, type: type as any }));
        } else {
            setNewPhoneType(type);
        }
        setShowPhoneTypeDropdown(false);
    };

    const handleWhatsAppChange = (value: string) => {
        if (editingPhoneIndex !== null && showEditPhoneModal) {
            setEditPhoneData(prev => ({ ...prev, whatsapp: value as any }));
        } else {
            setNewWhatsApp(value);
        }
        setShowWhatsAppDropdown(false);
    };

    const handleDndChange = (value: string) => {
        if (editingPhoneIndex !== null && showEditPhoneModal) {
            setEditPhoneData(prev => ({ ...prev, dnd: value as any }));
        } else {
            setNewDND(value);
        }
        setShowDndDropdown(false);
    };

    // DOB handlers
    const handleDobDateChange = (selectedYear: number, selectedMonth: number, selectedDay: number) => {
        const formattedDate = `${String(selectedDay).padStart(2, '0')}/${String(selectedMonth + 1).padStart(2, '0')}/${selectedYear}`;
        setDob(formattedDate);
        setShowCalendarModal(false);
    };

    // Navigation handlers
    const handleBack = () => {
        navigation.goBack();
    };

    const handleCancel = () => {
        Alert.alert(
            'Cancel Changes',
            'Are you sure you want to cancel? All unsaved changes will be lost.',
            [
                { text: 'No', style: 'cancel' },
                { text: 'Yes', onPress: () => setEditing(false) }
            ]
        );
    };

    const handleSave = async () => {
        Alert.alert(
            'Save Changes',
            'Are you sure you want to save the changes?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Save', onPress: () => handleSaveCustomer() }
            ]
        );
    };

    const handleSaveCustomer = async () => {
        if (!customerData) return;
        
        console.log('💾 === SAVING CUSTOMER DATA ===');
        console.log('💾 Customer Type:', customerType);
        console.log('💾 Salutation:', salutation);
        console.log('💾 Customer Name:', customerName);
        console.log('💾 Father Name:', fatherName);
        console.log('💾 Gender:', gender);
        console.log('💾 DOB:', dob);
        console.log('💾 Email:', email);
        console.log('💾 GST Type:', gstType);
        console.log('💾 GSTIN:', gstin);
        console.log('💾 Customer Grouping:', customerGrouping);
        console.log('💾 Billing Address:', billingAddress);
        console.log('💾 Shipping Address:', shippingAddress);
        console.log('💾 Same As Billing:', sameAsBilling);
        console.log('💾 Phone Numbers:', phoneNumbers);
        
        // Debug: Check if state variables have data
        console.log('💾 === STATE VARIABLE DEBUG ===');
        console.log('💾 billingAddress.address1:', billingAddress.address1);
        console.log('💾 billingAddress.city:', billingAddress.city);
        console.log('💾 shippingAddress.address1:', shippingAddress.address1);
        console.log('💾 shippingAddress.city:', shippingAddress.city);
        console.log('💾 sameAsBilling value:', sameAsBilling);
        
        setLoading(true);
        try {
            // Convert DOB to DD/MM/YYYY format (not ISO format)
            let formattedDobForApi = null;
            if (dob && dob !== '') {
                // Keep DD/MM/YYYY format as expected by backend
                formattedDobForApi = dob;
            }
            
            // Prepare address with proper format (backend expects direct IDs to avoid 500 errors)
        const billingAddressObj = {
            line1: billingAddress.address1 || null,
            line2: billingAddress.address2 || null,
            line3: billingAddress.address3 || null,
            locality: billingAddress.locality || null,
            pincode: billingAddress.pincode || null,
            country: billingAddress.country || null,
            state: billingAddress.state || null,
            city: billingAddress.city || null,
            district: billingAddress.city || null  // ✅ Fix: Include district data like shipping address
        };

        // Prepare shipping address with EXACT same format as web app
        const shippingAddressObj = sameAsBilling 
            ? {
                shippingline1: billingAddressObj.line1,
                shippingline2: billingAddressObj.line2,
                shippingline3: billingAddressObj.line3,
                shippinglocality: billingAddressObj.locality,
                shippingpincode: billingAddressObj.pincode,
                shippingcountry: billingAddressObj.country,
                shippingstate: billingAddressObj.state,
                shippingdistrict: billingAddressObj.city
            } 
            : {
                shippingline1: shippingAddress.address1 || null,
                shippingline2: shippingAddress.address2 || null,
                shippingline3: shippingAddress.address3 || null,
                shippinglocality: shippingAddress.locality || null,
                shippingpincode: shippingAddress.pincode || null,
                shippingcountry: shippingAddress.country || null,
                shippingstate: shippingAddress.state || null,
                shippingdistrict: shippingAddress.city || null
            };
        
        const customerDataToSave = {
                name: customerName || '',
                fatherName: fatherName || '',
                gender: gender || 'Male',
                dateOfBirth: formattedDobForApi,
                email: email || null,
                GSTType: gstType || 'Unregistered',
                GSTNo: gstin || null,
                customerType: customerType || 'Non Customer',
                customerGrouping: customerGrouping || null,
                salutation: salutation || 'Mr',
                contacts: phoneNumbers,
                address: billingAddressObj,
                shippingAddress: shippingAddressObj
            };

            console.log('💾 === PAYLOAD TO SAVE ===');
            console.log('💾 Full payload:', JSON.stringify(customerDataToSave, null, 2));
            
            // Detailed shipping address request logs
            console.log('💾 === SHIPPING ADDRESS REQUEST DETAILS ===');
            console.log('💾 Shipping Address Object:', JSON.stringify(shippingAddressObj, null, 2));
            console.log('💾 sameAsBilling Value:', sameAsBilling);
            console.log('💾 Billing Address Source:', JSON.stringify(billingAddressObj, null, 2));

            const response = await updateCustomer(customerData.id, customerDataToSave);
            
            console.log('💾 === API RESPONSE ===');
            console.log('💾 Response status:', response.status);
            console.log('💾 Response data:', response.data);
            
            // Log address details specifically
            const responseData = response.data?.response?.data;
            if (responseData) {
                console.log('💾 === ADDRESS RESPONSE DETAILS ===');
                console.log('💾 Billing Address:', JSON.stringify(responseData.address, null, 2));
                console.log('💾 Shipping Address:', JSON.stringify(responseData.shippingAddress, null, 2));
                
                // Additional shipping address debug info
                console.log('💾 === SHIPPING ADDRESS RESPONSE DEBUG ===');
                console.log('💾 Shipping Address Type:', typeof responseData.shippingAddress);
                console.log('💾 Shipping Address Keys:', responseData.shippingAddress ? Object.keys(responseData.shippingAddress) : 'NULL');
                console.log('💾 Shipping Address Line1:', responseData.shippingAddress?.shippingline1);
                console.log('💾 Shipping Address Country:', responseData.shippingAddress?.shippingcountry);
                console.log('💾 Shipping Address State:', responseData.shippingAddress?.shippingstate);
                console.log('💾 Shipping Address District:', responseData.shippingAddress?.shippingdistrict);
            }
            
            if (response.data?.code === 200) {
                console.log('✅ Customer saved successfully!');
                Alert.alert('Success', 'Customer details saved successfully!');
                setEditing(false);
                
                // Refresh data
                const refreshResponse = await getCustomerDetails(customerId || '');
                if (refreshResponse.data?.code === 200 && refreshResponse.data?.response?.data) {
                    const refreshedCustomer = refreshResponse.data.response.data.customer;
                    setCustomerData(refreshedCustomer);
                    
                    // Update all form state variables with refreshed data
                    if (refreshedCustomer.customerType) setCustomerType(refreshedCustomer.customerType);
                    if (refreshedCustomer.salutation) setSalutation(refreshedCustomer.salutation);
                    if (refreshedCustomer.name) setCustomerName(refreshedCustomer.name);
                    if (refreshedCustomer.fatherName) setFatherName(refreshedCustomer.fatherName);
                    if (refreshedCustomer.gender) setGender(refreshedCustomer.gender);
                    if (refreshedCustomer.dateOfBirth) {
                        const date = new Date(refreshedCustomer.dateOfBirth);
                        if (!isNaN(date.getTime())) {
                            const formattedDob = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                            setDob(formattedDob);
                        }
                    }
                    if (refreshedCustomer.email) setEmail(refreshedCustomer.email);
                    if (refreshedCustomer.gstType) setGstType(refreshedCustomer.gstType);
                    if (refreshedCustomer.gstin) setGstin(refreshedCustomer.gstin);
                    if (refreshedCustomer.customerGrouping) setCustomerGrouping(refreshedCustomer.customerGrouping);
                    
                    // Update billing address
                    if (refreshedCustomer.address) {
                        setBillingAddress({
                            address1: refreshedCustomer.address.line1 || '',
                            address2: refreshedCustomer.address.line2 || '',
                            address3: refreshedCustomer.address.line3 || '',
                            locality: refreshedCustomer.address.locality || '',
                            country: refreshedCustomer.address.country?.id || '',
                            state: refreshedCustomer.address.state?.id || '',
                            city: refreshedCustomer.address.district?.id || '',  // ✅ Fix: Read from district field
                            pincode: refreshedCustomer.address.pincode || ''
                        });
                        
                        // Fetch states and cities if needed
                        if (refreshedCustomer.address.country?.id) {
                            fetchStates(refreshedCustomer.address.country.id);
                        }
                        if (refreshedCustomer.address.state?.id) {
                            fetchCities(refreshedCustomer.address.state.id);
                        }
                    }
                    
                    // Update shipping address
                    if (refreshedCustomer.shippingAddress) {
                        setShippingAddress({
                            address1: refreshedCustomer.shippingAddress.shippingline1 || '',
                            address2: refreshedCustomer.shippingAddress.shippingline2 || '',
                            address3: refreshedCustomer.shippingAddress.shippingline3 || '',
                            locality: refreshedCustomer.shippingAddress.shippinglocality || '',
                            country: refreshedCustomer.shippingAddress.shippingcountry?.id || '',
                            state: refreshedCustomer.shippingAddress.shippingstate?.id || '',
                            city: refreshedCustomer.shippingAddress.shippingdistrict?.id || '',
                            pincode: refreshedCustomer.shippingAddress.shippingpincode || ''
                        });
                    }
                    
                    // Update phone numbers
                    if (refreshedCustomer.contacts && refreshedCustomer.contacts.length > 0) {
                        const mappedPhones = refreshedCustomer.contacts.map((contact: any, index: number) => ({
                            id: contact.id || String(index + 1),
                            number: contact.phone || '',
                            type: contact.type || 'Primary',
                            validity: contact.valid ? 'Valid' : 'Invalid',
                            whatsapp: contact.WhatsApp ? 'Yes' : 'No',
                            dnd: contact.DND ? 'Yes' : 'No'
                        }));
                        setPhoneNumbers(mappedPhones);
                    }
                    
                    console.log('✅ UI refreshed with latest data');
                }
            } else {
                console.log('❌ Save failed:');
                console.log('❌ Response code:', response.data?.code);
                console.log('❌ Response message:', response.data?.msg || response.data?.message);
                console.log('❌ Full error response:', JSON.stringify(response.data, null, 2));
                Alert.alert('Error', `Failed to save customer details: ${response.data?.msg || response.data?.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Error saving customer:', error);
            Alert.alert('Error', 'Failed to save customer details');
        } finally {
            setLoading(false);
        }
    };

    // Render dropdown modal
    const renderDropdownModal = (
        visible: boolean,
        onClose: () => void,
        title: string,
        options: Array<{ key: string; title: string }>,
        onSelect: (option: any) => void,
        selectedKey?: string
    ) => (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 bg-black/40 items-center justify-center px-4">
                <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '70%' }}>
                    <View className="p-4 border-b border-gray-200">
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-lg font-semibold text-gray-800">{title}</Text>
                            <TouchableOpacity onPress={onClose}>
                                <X size={20} color={COLORS.gray[600]} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <ScrollView className="max-h-80">
                        {options.map((option) => (
                            <TouchableOpacity 
                                key={option.key} 
                                onPress={() => {
                                    onSelect(option);
                                    onClose();
                                }} 
                                className="p-4 border-b border-gray-100"
                            >
                                <Text className={`text-gray-800 font-medium ${selectedKey === option.key ? 'text-teal-600 font-bold' : ''}`}>
                                    {option.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity onPress={onClose} className="p-3 border-t border-gray-200">
                        <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    // Render API dropdown modal
    const renderApiDropdownModal = (
        visible: boolean,
        onClose: () => void,
        title: string,
        options: Array<{ id: string; name: string }>,
        onSelect: (option: any) => void,
        selectedId?: string,
        loading?: boolean
    ) => (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 bg-black/40 items-center justify-center px-4">
                <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '70%' }}>
                    <View className="p-4 border-b border-gray-200">
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-lg font-semibold text-gray-800">{title}</Text>
                            <TouchableOpacity onPress={onClose}>
                                <X size={20} color={COLORS.gray[600]} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    {loading ? (
                        <View className="py-8 items-center">
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        </View>
                    ) : (
                        <ScrollView className="max-h-80">
                            {options.length === 0 ? (
                                <View className="p-4 items-center">
                                    <Text className="text-gray-400">No options available</Text>
                                </View>
                            ) : options.map((option) => (
                                <TouchableOpacity 
                                    key={option.id} 
                                    onPress={() => {
                                        onSelect(option);
                                        onClose();
                                    }} 
                                    className="p-4 border-b border-gray-100"
                                >
                                    <Text className={`text-gray-800 font-medium ${selectedId === option.id ? 'text-teal-600 font-bold' : ''}`}>
                                        {option.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                    <TouchableOpacity onPress={onClose} className="p-3 border-t border-gray-200">
                        <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    // Render dropdown trigger
    const renderDropdownTrigger = (
        ref: React.RefObject<View>,
        value: string,
        placeholder: string,
        onPress: () => void,
        error?: boolean
    ) => (
        <TouchableOpacity
            ref={ref}
            onPress={onPress}
            className={`h-12 bg-white border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 flex-row items-center justify-between`}
        >
            <Text className={`flex-1 ${value ? 'text-gray-800' : 'text-gray-400'}`}>
                {value || placeholder}
            </Text>
            <ChevronLeft size={16} color={COLORS.gray[400]} style={{ transform: [{ rotate: '-90deg' }] }} />
        </TouchableOpacity>
    );

    // Render customer details tab
    const renderCustomerDetails = () => (
        <View>
            <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                Customer Information
            </Text>

            {/* Customer Type */}
            <View className="mb-4">
                <FormLabel label="Customer Type" required />
                {renderDropdownTrigger(
                    customerTypeRef,
                    customerType,
                    'Select Type',
                    () => {
                        customerTypeRef.current?.measureInWindow((x, y, width, height) => {
                            setDropdownLayout({ x, y, width, height });
                            setShowCustomerTypeDropdown(true);
                        });
                    }
                )}
            </View>

            {/* Salutation and Name */}
            <View className="mb-4">
                <FormLabel label="Customer Name" required />
                <View className="flex-row gap-2">
                    <View className="w-20">
                        {renderDropdownTrigger(
                            salutationRef,
                            salutation,
                            'Select',
                            () => {
                                salutationRef.current?.measureInWindow((x, y, width, height) => {
                                    setDropdownLayout({ x, y, width, height });
                                    setShowSalutationDropdown(true);
                                });
                            }
                        )}
                    </View>
                    <View className="flex-1">
                        <TextInput
                            value={customerName}
                            onChangeText={setCustomerName}
                            placeholder="Enter customer name"
                            className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                            placeholderTextColor="#999"
                        />
                    </View>
                </View>
            </View>

            {/* Father's Name */}
            <View className="mb-4">
                <FormLabel label="Father's Name" required />
                <TextInput
                    value={fatherName}
                    onChangeText={setFatherName}
                    placeholder="Enter father's name"
                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                    placeholderTextColor="#999"
                />
            </View>

            {/* Gender */}
            <View className="mb-4">
                <FormLabel label="Gender" />
                <View className="flex-row items-center gap-6 mt-2">
                    {genders.map((option) => (
                        <TouchableOpacity
                            key={option.key}
                            onPress={() => setGender(option.key)}
                            className="flex-row items-center gap-2"
                        >
                            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${gender === option.key ? 'border-teal-600' : 'border-gray-300'}`}>
                                {gender === option.key && <View className="w-3 h-3 rounded-full bg-teal-600" />}
                            </View>
                            <Text className="text-sm text-gray-700">{option.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* DOB */}
            <View className="mb-4">
                <FormLabel label="Date of Birth" required />
                <View className="flex-row items-center">
                    <TextInput
                        value={dob}
                        onChangeText={setDob}
                        placeholder="DD/MM/YYYY"
                        className="flex-1 h-12 bg-white border border-gray-300 rounded-l-lg px-3 text-gray-800"
                        placeholderTextColor="#999"
                    />
                    <TouchableOpacity
                        onPress={() => {
                            setDobPickYear(new Date().getFullYear());
                            setDobPickMonth(new Date().getMonth());
                            setDobCalendarStep('year');
                            setShowCalendarModal(true);
                        }}
                        className="h-12 bg-teal-600 rounded-r-lg px-4 justify-center"
                    >
                        <Calendar size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Email */}
            <View className="mb-4">
                <FormLabel label="Email" />
                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter email address"
                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                />
            </View>

            {/* GST Type */}
            <View className="mb-4">
                <FormLabel label="GST Type" />
                {renderDropdownTrigger(
                    gstTypeRef,
                    gstType,
                    'Select',
                    () => {
                        gstTypeRef.current?.measureInWindow((x, y, width, height) => {
                            setDropdownLayout({ x, y, width, height });
                            setShowGstTypeDropdown(true);
                        });
                    }
                )}
            </View>

            {/* GSTIN */}
            <View className="mb-4">
                <FormLabel label="GSTIN" />
                {gstType === 'Unregistered' ? (
                    <View className="h-12 bg-gray-100 border border-gray-300 rounded-lg px-3 justify-center">
                        <Text className="text-gray-500">N/A</Text>
                    </View>
                ) : (
                    <TextInput
                        value={gstin}
                        onChangeText={setGstin}
                        placeholder="Enter GSTIN"
                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                        placeholderTextColor="#999"
                    />
                )}
                {gstType === 'Unregistered' && (
                    <Text className="text-xs text-gray-500 mt-1">
                        GSTIN is only applicable for Registered businesses
                    </Text>
                )}
            </View>

            {/* Customer Grouping */}
            <View className="mb-4">
                <FormLabel label="Customer Grouping" required />
                {renderDropdownTrigger(
                    customerGroupingRef,
                    customerGrouping,
                    'Select',
                    () => {
                        customerGroupingRef.current?.measureInWindow((x, y, width, height) => {
                            setDropdownLayout({ x, y, width, height });
                            setShowCustomerGroupingDropdown(true);
                        });
                    }
                )}
            </View>

            {/* Contact Numbers */}
            <View className="mb-4">
                <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center">
                        <Text className="text-red-500 text-sm">* </Text>
                        <Text className="text-gray-900 font-bold text-base">Contacts</Text>
                    </View>
                </View>

                <View className="border border-gray-200 rounded-lg overflow-hidden">
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                        <View style={{ minWidth: '100%' }}>
                            <View className="bg-gray-600">
                                <View className="flex-row">
                                    <View style={{ width: 120 }} className="p-2">
                                        <Text className="text-white text-xs font-medium">Phone</Text>
                                    </View>
                                    <View style={{ width: 80 }} className="p-2">
                                        <Text className="text-white text-xs font-medium">Type</Text>
                                    </View>
                                    <View style={{ width: 80 }} className="p-2">
                                        <Text className="text-white text-xs font-medium">WhatsApp</Text>
                                    </View>
                                    <View style={{ width: 60 }} className="p-2">
                                        <Text className="text-white text-xs font-medium">DND</Text>
                                    </View>
                                    <View style={{ width: 80 }} className="p-2">
                                        <Text className="text-white text-xs font-medium">Actions</Text>
                                    </View>
                                </View>
                            </View>
                            
                            {phoneNumbers.map((phone, index) => (
                                <View key={phone.id} className={`flex-row ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}>
                                    <View style={{ width: 120 }} className="p-2">
                                        <Text className="text-gray-800 text-sm">{phone.number}</Text>
                                    </View>
                                    <View style={{ width: 80 }} className="p-2">
                                        <Text className="text-gray-800 text-sm">{phone.type}</Text>
                                    </View>
                                    <View style={{ width: 80 }} className="p-2">
                                        <Text className="text-gray-800 text-sm">{phone.whatsapp}</Text>
                                    </View>
                                    <View style={{ width: 60 }} className="p-2">
                                        <Text className="text-gray-800 text-sm">{phone.dnd}</Text>
                                    </View>
                                    <View style={{ width: 80 }} className="p-2">
                                        <View className="flex-row gap-2">
                                            <TouchableOpacity
                                                onPress={() => handleEditPhone(index)}
                                                className="p-1"
                                            >
                                                <Edit2 size={14} color="#0d9488" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => handleDeletePhone(index)}
                                                className="p-1"
                                            >
                                                <Trash2 size={14} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* Add Contact Form */}
                <View className="mt-4 p-4 bg-gray-50 rounded-md">
                    <Text className="text-gray-900 font-semibold mb-3">Add New Contact</Text>

                    <View className="flex-row gap-3">
                        <View className="flex-1">
                            <Text className="text-gray-600 text-xs font-medium mb-1">Phone</Text>
                            <TextInput
                                value={newPhone}
                                onChangeText={setNewPhone}
                                placeholder="Phone Number"
                                className="h-10 bg-white border border-gray-300 rounded-md px-3 text-gray-800 text-sm"
                                placeholderTextColor="#999"
                                keyboardType="phone-pad"
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-600 text-xs font-medium mb-1">Type</Text>
                            {renderDropdownTrigger(
                                null,
                                newPhoneType,
                                'Type',
                                () => {
                                    setEditingPhoneIndex(null);
                                    setShowPhoneTypeDropdown(true);
                                }
                            )}
                        </View>
                    </View>

                    <View className="flex-row gap-3 mt-3">
                        <View className="flex-1">
                            <Text className="text-gray-600 text-xs font-medium mb-1">WhatsApp</Text>
                            {renderDropdownTrigger(
                                null,
                                newWhatsApp,
                                'WA',
                                () => {
                                    setEditingPhoneIndex(null);
                                    setShowWhatsAppDropdown(true);
                                }
                            )}
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-600 text-xs font-medium mb-1">DND</Text>
                            {renderDropdownTrigger(
                                null,
                                newDND,
                                'DND',
                                () => {
                                    setEditingPhoneIndex(null);
                                    setShowDndDropdown(true);
                                }
                            )}
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleAddPhone}
                        className="bg-teal-600 p-2 rounded-md items-center self-center mt-4 w-40"
                    >
                        <Text className="text-white text-sm font-medium">Add Contact</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Address Section */}
            <View>
                <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                    Address Information
                </Text>
                
                <View className="space-y-4">
                    <View className="mb-4">
                        <FormLabel label="Address Line 1" required />
                        <TextInput
                            value={billingAddress.address1}
                            onChangeText={(text) => setBillingAddress({...billingAddress, address1: text})}
                            placeholder="Enter address line 1"
                            className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View className="mb-4">
                        <FormLabel label="Address Line 2" />
                        <TextInput
                            value={billingAddress.address2}
                            onChangeText={(text) => setBillingAddress({...billingAddress, address2: text})}
                            placeholder="Enter address line 2"
                            className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View className="mb-4">
                        <FormLabel label="Address Line 3" />
                        <TextInput
                            value={billingAddress.address3}
                            onChangeText={(text) => setBillingAddress({...billingAddress, address3: text})}
                            placeholder="Enter address line 3"
                            className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View className="mb-4">
                        <FormLabel label="Locality" required />
                        <TextInput
                            value={billingAddress.locality}
                            onChangeText={(text) => setBillingAddress({...billingAddress, locality: text})}
                            placeholder="Enter locality"
                            className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View className="mb-4">
                        <FormLabel label="Country" required />
                        {renderDropdownTrigger(
                            billingCountryRef,
                            apiCountries.find(c => c.id === billingAddress.country)?.name || '',
                            'Select Country',
                            () => {
                                billingCountryRef.current?.measureInWindow((x, y, width, height) => {
                                    setDropdownLayout({ x, y, width, height });
                                    setShowBillingCountryDropdown(true);
                                });
                            }
                        )}
                    </View>

                    <View className="mb-4">
                        <FormLabel label="State" required />
                        {renderDropdownTrigger(
                            billingStateRef,
                            apiStates.find(s => s.id === billingAddress.state)?.name || '',
                            billingAddress.country ? 'Select State' : 'Select country first',
                            () => {
                                if (billingAddress.country) {
                                    billingStateRef.current?.measureInWindow((x, y, width, height) => {
                                        setDropdownLayout({ x, y, width, height });
                                        setShowBillingStateDropdown(true);
                                    });
                                }
                            }
                        )}
                    </View>

                    <View className="mb-4">
                        <FormLabel label="City" required />
                        {renderDropdownTrigger(
                            billingCityRef,
                            apiCities.find(c => c.id === billingAddress.city)?.name || '',
                            billingAddress.state ? 'Select City' : 'Select state first',
                            () => {
                                if (billingAddress.state) {
                                    billingCityRef.current?.measureInWindow((x, y, width, height) => {
                                        setDropdownLayout({ x, y, width, height });
                                        setShowBillingCityDropdown(true);
                                    });
                                }
                            }
                        )}
                    </View>

                    <View className="mb-4">
                        <FormLabel label="Pincode" required />
                        <TextInput
                            value={billingAddress.pincode}
                            onChangeText={(text) => setBillingAddress({...billingAddress, pincode: text})}
                            placeholder="Enter pincode"
                            className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                        />
                    </View>
                </View>
            </View>

            {/* Shipping Address Section */}
            <View className="mt-6">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-gray-900 font-bold text-base pb-2 border-b border-gray-100">
                        Shipping Address
                    </Text>
                    <TouchableOpacity
                        onPress={() => {
                            const newValue = !sameAsBilling;
                            setSameAsBilling(newValue);
                            if (newValue) {
                                // When enabling sameAsBilling, copy billing address to shipping
                                setShippingAddress({
                                    address1: billingAddress.address1,
                                    address2: billingAddress.address2,
                                    address3: billingAddress.address3,
                                    locality: billingAddress.locality,
                                    country: billingAddress.country,
                                    state: billingAddress.state,
                                    city: billingAddress.city,
                                    pincode: billingAddress.pincode
                                });
                            } else {
                                // When disabling sameAsBilling, clear shipping address
                                setShippingAddress({
                                    address1: '',
                                    address2: '',
                                    address3: '',
                                    locality: '',
                                    country: '',
                                    state: '',
                                    city: '',
                                    pincode: ''
                                });
                            }
                        }}
                        className="flex-row items-center gap-2"
                    >
                        <View className={`w-5 h-5 rounded border-2 items-center justify-center ${sameAsBilling ? 'border-teal-600 bg-teal-600' : 'border-gray-300'}`}>
                            {sameAsBilling && <View className="w-2 h-2 rounded-full bg-white" />}
                        </View>
                        <Text className="text-sm text-gray-700">Same as Billing</Text>
                    </TouchableOpacity>
                </View>
                
                <View className="space-y-4">
                    <View className="mb-4">
                        <FormLabel label="Address Line 1" />
                        <TextInput
                            value={sameAsBilling ? billingAddress.address1 : shippingAddress.address1}
                            onChangeText={(text) => setShippingAddress({...shippingAddress, address1: text})}
                            placeholder="Enter address line 1"
                            className={`h-12 border rounded-lg px-3 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'} text-gray-800`}
                            placeholderTextColor="#999"
                            editable={!sameAsBilling}
                        />
                    </View>

                    <View className="mb-4">
                        <FormLabel label="Address Line 2" />
                        <TextInput
                            value={sameAsBilling ? billingAddress.address2 : shippingAddress.address2}
                            onChangeText={(text) => setShippingAddress({...shippingAddress, address2: text})}
                            placeholder="Enter address line 2"
                            className={`h-12 border rounded-lg px-3 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'} text-gray-800`}
                            placeholderTextColor="#999"
                            editable={!sameAsBilling}
                        />
                    </View>

                    <View className="mb-4">
                        <FormLabel label="Address Line 3" />
                        <TextInput
                            value={sameAsBilling ? billingAddress.address3 : shippingAddress.address3}
                            onChangeText={(text) => setShippingAddress({...shippingAddress, address3: text})}
                            placeholder="Enter address line 3"
                            className={`h-12 border rounded-lg px-3 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'} text-gray-800`}
                            placeholderTextColor="#999"
                            editable={!sameAsBilling}
                        />
                    </View>

                    <View className="mb-4">
                        <FormLabel label="Locality" />
                        <TextInput
                            value={sameAsBilling ? billingAddress.locality : shippingAddress.locality}
                            onChangeText={(text) => setShippingAddress({...shippingAddress, locality: text})}
                            placeholder="Enter locality"
                            className={`h-12 border rounded-lg px-3 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'} text-gray-800`}
                            placeholderTextColor="#999"
                            editable={!sameAsBilling}
                        />
                    </View>

                    <View className="mb-4">
                        <FormLabel label="Country" />
                        {sameAsBilling ? (
                            <View className="h-12 bg-gray-100 border border-gray-200 rounded-lg px-3 justify-center">
                                <Text className="text-gray-600">
                                    {apiCountries.find(c => c.id === billingAddress.country)?.name || billingAddress.country || 'India'}
                                </Text>
                            </View>
                        ) : (
                            renderDropdownTrigger(
                                shippingCountryRef,
                                apiCountries.find(c => c.id === shippingAddress.country)?.name || '',
                                'Select Country',
                                () => {
                                    shippingCountryRef.current?.measureInWindow((x, y, width, height) => {
                                        setDropdownLayout({ x, y, width, height });
                                        setShowShippingCountryDropdown(true);
                                    });
                                }
                            )
                        )}
                    </View>

                    <View className="mb-4">
                        <FormLabel label="State" />
                        {sameAsBilling ? (
                            <View className="h-12 bg-gray-100 border border-gray-200 rounded-lg px-3 justify-center">
                                <Text className="text-gray-600">
                                    {apiStates.find(s => s.id === billingAddress.state)?.name || billingAddress.state || 'Tamil Nadu'}
                                </Text>
                            </View>
                        ) : (
                            renderDropdownTrigger(
                                shippingStateRef,
                                apiStates.find(s => s.id === shippingAddress.state)?.name || '',
                                shippingAddress.country ? 'Select State' : 'Select country first',
                                () => {
                                    if (shippingAddress.country) {
                                        shippingStateRef.current?.measureInWindow((x, y, width, height) => {
                                            setDropdownLayout({ x, y, width, height });
                                            setShowShippingStateDropdown(true);
                                        });
                                    }
                                }
                            )
                        )}
                    </View>

                    <View className="mb-4">
                        <FormLabel label="City" />
                        {sameAsBilling ? (
                            <View className="h-12 bg-gray-100 border border-gray-200 rounded-lg px-3 justify-center">
                                <Text className="text-gray-600">
                                    {apiCities.find(c => c.id === billingAddress.city)?.name || billingAddress.city || 'Select City'}
                                </Text>
                            </View>
                        ) : shippingAddress.state ? (
                            renderDropdownTrigger(
                                shippingCityRef,
                                apiCities.find(c => c.id === shippingAddress.city)?.name || '',
                                'Select City',
                                () => {
                                    shippingCityRef.current?.measureInWindow((x, y, width, height) => {
                                        setDropdownLayout({ x, y, width, height });
                                        setShowShippingCityDropdown(true);
                                    });
                                }
                            )
                        ) : (
                            <View className="h-12 bg-gray-100 border border-gray-200 rounded-lg px-3 justify-center">
                                <Text className="text-gray-500">Select state first</Text>
                            </View>
                        )}
                    </View>

                    <View className="mb-4">
                        <FormLabel label="Pincode" />
                        <TextInput
                            value={sameAsBilling ? billingAddress.pincode : shippingAddress.pincode}
                            onChangeText={(text) => setShippingAddress({...shippingAddress, pincode: text})}
                            placeholder="Enter pincode"
                            className={`h-12 border rounded-lg px-3 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'} text-gray-800`}
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                            editable={!sameAsBilling}
                        />
                    </View>
                </View>
            </View>

            {/* Referred Customers Section */}
            <View className="mt-6">
                <Text className="text-gray-900 font-bold text-base mb-3">
                    Referred Customers
                </Text>
                <View className="self-start bg-teal-600 rounded-md px-3 py-1.5">
                    <Text className="text-white text-xs font-medium">No Referred Customer</Text>
                </View>
            </View>

            {/* All Dropdown Modals */}
            
            {/* Customer Type Dropdown */}
            {renderDropdownModal(
                showCustomerTypeDropdown,
                () => setShowCustomerTypeDropdown(false),
                'Select Customer Type',
                customerTypes,
                (option) => setCustomerType(option.key),
                customerType
            )}

            {/* Salutation Dropdown */}
            {renderDropdownModal(
                showSalutationDropdown,
                () => setShowSalutationDropdown(false),
                'Select Salutation',
                salutations,
                (option) => setSalutation(option.key),
                salutation
            )}

            {/* GST Type Dropdown */}
            {renderDropdownModal(
                showGstTypeDropdown,
                () => setShowGstTypeDropdown(false),
                'Select GST Type',
                gstTypes,
                (option) => handleGstTypeChange(option.key),
                gstType
            )}

            {/* Customer Grouping Dropdown */}
            {renderDropdownModal(
                showCustomerGroupingDropdown,
                () => setShowCustomerGroupingDropdown(false),
                'Select Customer Grouping',
                customerGroupings,
                (option) => setCustomerGrouping(option.key),
                customerGrouping
            )}

            {/* Billing Country Dropdown */}
            {renderApiDropdownModal(
                showBillingCountryDropdown,
                () => setShowBillingCountryDropdown(false),
                'Select Country',
                apiCountries,
                (option) => handleCountryChange(option.id, 'billing'),
                billingAddress.country,
                loadingCountries
            )}

            {/* Billing State Dropdown */}
            {renderApiDropdownModal(
                showBillingStateDropdown,
                () => setShowBillingStateDropdown(false),
                'Select State',
                apiStates,
                (option) => handleStateChange(option.id, 'billing'),
                billingAddress.state,
                loadingStates
            )}

            {/* Billing City Dropdown */}
            {renderApiDropdownModal(
                showBillingCityDropdown,
                () => setShowBillingCityDropdown(false),
                'Select City',
                apiCities,
                (option) => handleCityChange(option.id, 'billing'),
                billingAddress.city,
                loadingCities
            )}

            {/* Shipping Country Dropdown */}
            {renderApiDropdownModal(
                showShippingCountryDropdown,
                () => setShowShippingCountryDropdown(false),
                'Select Country',
                apiCountries,
                (option) => handleCountryChange(option.id, 'shipping'),
                shippingAddress.country,
                loadingCountries
            )}

            {/* Shipping State Dropdown */}
            {renderApiDropdownModal(
                showShippingStateDropdown,
                () => setShowShippingStateDropdown(false),
                'Select State',
                apiStates,
                (option) => handleStateChange(option.id, 'shipping'),
                shippingAddress.state,
                loadingStates
            )}

            {/* Shipping City Dropdown */}
            {renderApiDropdownModal(
                showShippingCityDropdown,
                () => setShowShippingCityDropdown(false),
                'Select City',
                apiCities,
                (option) => handleCityChange(option.id, 'shipping'),
                shippingAddress.city,
                loadingCities
            )}

            {/* Phone Type Dropdown */}
            {renderDropdownModal(
                showPhoneTypeDropdown,
                () => setShowPhoneTypeDropdown(false),
                editingPhoneIndex !== null && showEditPhoneModal ? 'Edit Phone Type' : 'Select Phone Type',
                phoneTypes,
                (option) => handlePhoneTypeChange(option.key),
                editingPhoneIndex !== null && showEditPhoneModal ? editPhoneData.type : newPhoneType
            )}

            {/* WhatsApp Dropdown */}
            {renderDropdownModal(
                showWhatsAppDropdown,
                () => setShowWhatsAppDropdown(false),
                editingPhoneIndex !== null && showEditPhoneModal ? 'Edit WhatsApp' : 'Select WhatsApp',
                yesNoOptions,
                (option) => handleWhatsAppChange(option.key),
                editingPhoneIndex !== null && showEditPhoneModal ? editPhoneData.whatsapp : newWhatsApp
            )}

            {/* DND Dropdown */}
            {renderDropdownModal(
                showDndDropdown,
                () => setShowDndDropdown(false),
                editingPhoneIndex !== null && showEditPhoneModal ? 'Edit DND' : 'Select DND',
                yesNoOptions,
                (option) => handleDndChange(option.key),
                editingPhoneIndex !== null && showEditPhoneModal ? editPhoneData.dnd : newDND
            )}

            {/* Edit Phone Modal */}
            <Modal visible={showEditPhoneModal} transparent animationType="fade" onRequestClose={() => setShowEditPhoneModal(false)}>
                <View className="flex-1 bg-black/40 items-center justify-center px-4">
                    <View className="bg-white rounded-2xl w-full max-w-md">
                        <View className="p-4 border-b border-gray-200">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-lg font-semibold text-gray-800">Edit Contact</Text>
                                <TouchableOpacity onPress={() => setShowEditPhoneModal(false)}>
                                    <X size={20} color={COLORS.gray[600]} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        <View className="p-4">
                            {/* Phone Number */}
                            <View className="mb-4">
                                <FormLabel label="Phone Number" />
                                <TextInput
                                    value={editPhoneData.number}
                                    onChangeText={(value) => setEditPhoneData(prev => ({ ...prev, number: value }))}
                                    placeholder="Phone Number"
                                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    placeholderTextColor="#999"
                                    keyboardType="phone-pad"
                                />
                            </View>

                            {/* Type Dropdown */}
                            <View className="mb-4">
                                <FormLabel label="Type" />
                                <TouchableOpacity
                                    onPress={() => {
                                        setEditingPhoneIndex(editingPhoneIndex);
                                        setShowPhoneTypeDropdown(true);
                                    }}
                                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row justify-between items-center"
                                >
                                    <Text className="text-gray-800">{editPhoneData.type}</Text>
                                    <ChevronLeft size={16} color={COLORS.gray[400]} style={{ transform: [{ rotate: '-90deg' }] }} />
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
                                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row justify-between items-center"
                                >
                                    <Text className="text-gray-800">{editPhoneData.whatsapp}</Text>
                                    <ChevronLeft size={16} color={COLORS.gray[400]} style={{ transform: [{ rotate: '-90deg' }] }} />
                                </TouchableOpacity>
                            </View>

                            {/* DND Dropdown */}
                            <View className="mb-4">
                                <FormLabel label="DND" />
                                <TouchableOpacity
                                    onPress={() => {
                                        setEditingPhoneIndex(editingPhoneIndex);
                                        setShowDndDropdown(true);
                                    }}
                                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row justify-between items-center"
                                >
                                    <Text className="text-gray-800">{editPhoneData.dnd}</Text>
                                    <ChevronLeft size={16} color={COLORS.gray[400]} style={{ transform: [{ rotate: '-90deg' }] }} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="flex-row border-t border-gray-200">
                            <TouchableOpacity 
                                onPress={() => setShowEditPhoneModal(false)}
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

            {/* DOB Calendar Modal */}
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
                                const daySlots: (number | null)[] = [...Array(firstDayOfWeek).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

                                return (
                                    <View>
                                        <View className="flex-row mb-2">
                                            {['S','M','T','W','T','F','S'].map((day, idx) => (
                                                <View key={idx} style={{ width: '14.28%' }} className="items-center py-1">
                                                    <Text className="text-xs text-gray-500 font-medium">{day}</Text>
                                                </View>
                                            ))}
                                        </View>
                                        <View className="flex-row flex-wrap">
                                            {daySlots.map((day, idx) => {
                                                if (day === null) {
                                                    return <View key={`empty-${idx}`} style={{ width: '14.28%', height: 42 }} />;
                                                }
                                                const now = new Date();
                                                const isSelected = dob && parseInt(dob.split('/')[0]) === day && parseInt(dob.split('/')[1]) === dobPickMonth + 1 && parseInt(dob.split('/')[2]) === dobPickYear;
                                                const isToday = day === now.getDate() && dobPickMonth === now.getMonth() && dobPickYear === now.getFullYear();
                                                const isFuture = dobPickYear > now.getFullYear() || (dobPickYear === now.getFullYear() && dobPickMonth > now.getMonth()) || (dobPickYear === now.getFullYear() && dobPickMonth === now.getMonth() && day > now.getDate());
                                                
                                                return (
                                                    <TouchableOpacity
                                                        key={day}
                                                        disabled={isFuture}
                                                        onPress={() => handleDobDateChange(dobPickYear, dobPickMonth, day)}
                                                        style={{ width: '14.28%', height: 42 }}
                                                        className="items-center justify-center"
                                                    >
                                                        <View className={`w-9 h-9 rounded-full items-center justify-center ${isSelected ? 'bg-teal-600' : isToday ? 'border-2 border-teal-500' : ''} ${isFuture ? 'opacity-30' : ''}`}>
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
                        <View className="flex-row justify-between items-center px-5 py-3 bg-gray-50 border-t border-gray-100">
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
        </View>
    );

    const renderAssociatedVehicles = () => (
        <View>
            {purchasedVehicles.length === 0 ? (
                <View className="rounded-lg border border-gray-200 p-8 items-center bg-gray-50">
                    <Car size={48} color="#9ca3af" />
                    <Text className="mt-4 text-gray-500 text-center">No vehicles found</Text>
                </View>
            ) : (
                <View className="space-y-2">
                    {purchasedVehicles.map((vehicle, index) => (
                        <View key={vehicle.id || index} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm p-4">
                            {/* Vehicle Details */}
                            <View className="space-y-2 mb-2">
                                <Text className="font-bold text-lg text-gray-900 mb-2">
                                    {vehicle.vehicle?.modelCode} - {vehicle.vehicle?.modelName}
                                </Text>
                                
                                <View className="space-y-1">
                                    <View className="flex-row mb-1">
                                        <Text className="text-gray-600 w-24 text-sm">Reg No:</Text>
                                        <Text className="text-gray-900 font-medium text-sm">{vehicle.registerNo || vehicle.regNo || vehicle.registrationNumber || 'N/A'}</Text>
                                    </View>
                                    <View className="flex-row mb-1">
                                        <Text className="text-gray-600 w-24 text-sm">Chassis No:</Text>
                                        <Text className="text-gray-900 font-medium text-sm">{vehicle.chassisNo || 'N/A'}</Text>
                                    </View>
                                    <View className="flex-row mb-1">
                                        <Text className="text-gray-600 w-24 text-sm">Date of Sale:</Text>
                                        <Text className="text-gray-900 font-medium text-sm">
                                            {vehicle.dateOfSale ? moment(vehicle.dateOfSale).format('DD-MM-YYYY') : 'N/A'}
                                        </Text>
                                    </View>
                                    <View className="flex-row mb-1">
                                        <Text className="text-gray-600 w-24 text-sm">Vehicle color:</Text>
                                        <Text className="text-gray-900 font-medium text-sm">
                                            {vehicle.color?.code} - {vehicle.color?.color || 'N/A'}
                                        </Text>
                                    </View>
                                </View>
                                
                                <TouchableOpacity 
                                    className="mt-3 bg-teal-600 py-2 px-4 rounded-lg items-center"
                                    onPress={() => navigation.navigate('VehicleDetails', { 
                                        vehicle: vehicle, 
                                        mode: 'view' 
                                    })}
                                >
                                    <Text className="text-white font-medium">View Vehicle</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );

    const renderBookings = () => (
        <View>
            {/* Booking Buttons */}
            <View className="flex-row gap-3 mb-4">
                <TouchableOpacity 
                    className="flex-1 h-12 bg-teal-600 rounded-lg items-center justify-center"
                    onPress={() => {
                        const phoneNumber = phoneNumbers.length > 0 && phoneNumbers[0].number !== '• • • • • • • • 95' 
                            ? phoneNumbers[0].number 
                            : null;
                        
                        if (!phoneNumber) {
                            Alert.alert('No Phone Number', 'Customer phone number not available. Please add a phone number first.');
                            return;
                        }
                        
                        navigation.navigate('BookingActivity' as any, {
                            isConfirmBooking: true,
                            customerId: customerId,
                            customerName: customerName,
                            customerPhone: phoneNumber
                        });
                    }}
                >
                    <Text className="text-white text-sm font-medium">Add Confirm Booking</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    className="flex-1 h-12 bg-teal-600 rounded-lg items-center justify-center"
                    onPress={() => {
                        const phoneNumber = phoneNumbers.length > 0 && phoneNumbers[0].number !== '• • • • • • • • 95' 
                            ? phoneNumbers[0].number 
                            : null;
                        
                        if (!phoneNumber) {
                            Alert.alert('No Phone Number', 'Customer phone number not available. Please add a phone number first.');
                            return;
                        }
                        
                        navigation.navigate('BookingActivity' as any, {
                            isAdvancedBooking: true,
                            customerId: customerId,
                            customerName: customerName,
                            customerPhone: phoneNumber
                        });
                    }}
                >
                    <Text className="text-white text-sm font-medium">Add Advanced Booking</Text>
                </TouchableOpacity>
            </View>
            
            {/* Bookings List */}
            {bookings.length === 0 ? (
                <View className="rounded-lg border border-gray-200 p-8 items-center bg-gray-50">
                    <FileText size={48} color="#9ca3af" />
                    <Text className="mt-4 text-gray-500 text-center">No bookings found</Text>
                </View>
            ) : (
                <View className="space-y-2">
                    {bookings.map((booking, index) => (
                        <View key={booking.id || index} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm p-4">
                            {/* Booking Details */}
                            <View className="space-y-2 mb-2">
                                <Text className="font-bold text-lg text-gray-900 mb-2">
                                    {booking.bookingId}
                                </Text>
                                
                                <View className="space-y-1">
                                    <View className="flex-row mb-1">
                                        <Text className="text-gray-600 w-24 text-sm">Vehicle:</Text>
                                        <Text className="text-gray-900 font-medium text-sm">{booking.vehicle || 'N/A'}</Text>
                                    </View>
                                    <View className="flex-row mb-1">
                                        <Text className="text-gray-600 w-24 text-sm">Status:</Text>
                                        <Text className="text-gray-900 font-medium text-sm">{booking.status || 'N/A'}</Text>
                                    </View>
                                    <View className="flex-row mb-1">
                                        <Text className="text-gray-600 w-24 text-sm">Created On:</Text>
                                        <Text className="text-gray-900 font-medium text-sm">
                                            {booking.createdOn ? moment(booking.createdOn).format('DD-MM-YYYY') : 'N/A'}
                                        </Text>
                                    </View>
                                    {booking.color?.color && (
                                        <View className="flex-row mb-1">
                                            <Text className="text-gray-600 w-24 text-sm">Color:</Text>
                                            <Text className="text-gray-900 font-medium text-sm">
                                                {booking.color.code || 'N/A'} - {booking.color.color}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                
                                <TouchableOpacity 
                                    className="mt-3 bg-teal-600 py-2 px-4 rounded-lg items-center"
                                    onPress={() => {
                                        // Navigate to booking details or perform action
                                        console.log('View booking:', booking.bookingId);
                                    }}
                                >
                                    <Text className="text-white font-medium">View Booking</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );

    const renderQuotations = () => (
        <View>
            <View>
                {quotations.length === 0 ? (
                    <View className="rounded-lg border border-gray-200 p-8 items-center bg-gray-50">
                        <FileText size={48} color="#9ca3af" />
                        <Text className="mt-4 text-gray-500 text-center">No quotations found</Text>
                    </View>
                ) : (
                    <View className="space-y-2">
                        {quotations.map((quotation) => (
                            <TouchableOpacity 
                                key={quotation.id} 
                                className="bg-white rounded-lg border border-gray-200 p-4 mb-2"
                                onPress={() => navigation.navigate('QuotationView' as any, { id: quotation.id })}
                            >
                                <View className="flex-row justify-between items-start mb-2">
                                    <View className="flex-1">
                                        <Text className="font-bold text-teal-600">{quotation.quotationId}</Text>
                                        <Text className="text-gray-800 mt-1">{quotation.vehicle}</Text>
                                        {quotation.modelCode && quotation.modelCode !== 'N/A' && (
                                            <Text className="text-sm text-gray-500 mt-1">Model Code: {quotation.modelCode}</Text>
                                        )}
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-sm text-gray-500">{quotation.createdOn}</Text>
                                        <View className="mt-2">
                                            <Text className={`text-xs px-2 py-1 rounded-full ${
                                                quotation.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {quotation.status}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <View className="flex-row justify-between items-center mt-2">
                                    <TouchableOpacity 
                                        className="flex-row items-center"
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            navigation.navigate('QuotationView' as any, { id: quotation.id });
                                        }}
                                    >
                                        <Eye size={16} color="#6b7280" />
                                        <Text className="ml-1 text-sm text-teal-600 font-medium">View Quotation</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );

    const renderContent = () => {
        const id = customerId || 'CNS33355';
        switch (activeTab) {
            case 'customer-details':
                return renderCustomerDetails();
            case 'associated-vehicles':
                return renderAssociatedVehicles();
            case 'bookings':
                return renderBookings();
            case 'quotations':
                return renderQuotations();
            case 'job-orders':
                return <JobOrdersSection customerId={id} />;
            case 'spare-orders':
                return <SpareOrdersSection customerId={id} />;
            case 'call-history':
                return <CallHistorySection customerId={id} />;
            case 'number-plates':
                return <NumberPlatesSection customerId={id} />;
            case 'payments':
                return <PaymentsSection customerId={id} />;
            default:
                return renderCustomerDetails();
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
            {/* Header */}
            <HeaderWithBack
                title="Customer Details"
                onBackPress={handleBack}
            />

            {/* Customer ID Card */}
            <View className="bg-green-50 mt-2 rounded-xl border border-gray-100 p-2 mb-1.5 w-[330px] self-center">
                <View className="flex-row mb-1">
                    <Text className="text-gray-500 text-sm">Customer Id :</Text>
                    <Text className="text-teal-600 font-bold text-sm">    {displayCustomerId || customerId}</Text>
                </View>
            </View>

            {/* Tabs */}
            <View className="bg-white border-b border-gray-100">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row px-4">
                        {tabs.map((tab) => (
                            <TouchableOpacity
                                key={tab.id}
                                onPress={() => setActiveTab(tab.id)}
                                className={`py-3 px-4 border-b-2 ${activeTab === tab.id ? 'border-teal-600' : 'border-transparent'}`}
                            >
                                <Text className={`text-sm font-medium ${activeTab === tab.id ? 'text-teal-600' : 'text-gray-600'}`}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Content */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
                >
                    <View className="bg-white rounded-xl border border-gray-100 p-4">
                        {renderContent()}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Bottom Action Buttons */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        onPress={handleCancel}
                        className="flex-1 h-12 bg-gray-200 rounded-lg items-center justify-center"
                    >
                        <Text className="text-gray-700 font-medium">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleSave}
                        className="flex-1 h-12 bg-teal-600 rounded-lg items-center justify-center"
                    >
                        <Text className="text-white font-medium">Save</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default CustomerDetailsScreen;