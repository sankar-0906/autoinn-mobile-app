import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Calendar, Clock, ChevronLeft, Edit2, Trash2 } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { getCustomerById, getCustomerDetails, getCountries, getStates, getCities, verifyGST } from '../../src/api';
import { Button } from '../../components/ui/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useToast } from '../../src/ToastContext';

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

export default function CustomerDetailsScreen() {
    const navigation = useNavigation();
    const route = useRoute<CustomerDetailsRouteProp>();
    const toast = useToast();
    const { customerId } = route.params || {};

    const [activeTab, setActiveTab] = useState('customer-details');
    const [loading, setLoading] = useState(true);
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

    // Validation state from autoinn-fe
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [checkAll, setCheckAll] = useState(true);
    const [checkName, setCheckName] = useState(true);
    const [gstType, setGstType] = useState(true);

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
    const [customerGrouping, setCustomerGrouping] = useState('');
    const [gstName, setGstName] = useState('');
    const [gstStatus, setGstStatus] = useState('');

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
    ];

    const customerGroupingOptions = [
        { key: "Individual", title: "Individual" },
        { key: "Non-Individual", title: "Non-Individual" },
    ];

    // Date picker states
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showCustomerGroupingDropdown, setShowCustomerGroupingDropdown] = useState(false);
    const [followUpDate, setFollowUpDate] = useState('');
    const [followUpTime, setFollowUpTime] = useState('12:00');
    const [followUpDateError, setFollowUpDateError] = useState('');
    const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
    const [selectedHour, setSelectedHour] = useState<number | null>(null);
    const [selectedMinute, setSelectedMinute] = useState<string | null>(null);
    const timeFieldRef = useRef<any>(null);
    const [timeDropdownLayout, setTimeDropdownLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    // Enquiry type
    const [enquiryType, setEnquiryType] = useState('Hot');

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

    const fetchCustomerData = async () => {
        if (!customerId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Fetch detailed customer information which contains almost everything
            const detailsResponse = await getCustomerDetails(customerId);
            const detailsData = detailsResponse.data?.response?.data || detailsResponse.data?.data || detailsResponse.data;
            setCustomerDetails(detailsData);

            const customerData = detailsData?.customer;
            if (!customerData) {
                // Fallback to getCustomerById if details doesn't have it
                const customerResponse = await getCustomerById(customerId);
                const fetchedCustomer = customerResponse.data?.response?.data || customerResponse.data?.data || customerResponse.data;
                setCustomer(fetchedCustomer);
            } else {
                setCustomer(customerData);
            }

            // Map associated data from detailsData
            setAssociatedVehicles(customerData?.purchasedVehicle || []);
            setBookings(customerData?.booking || []);
            setQuotations(customerData?.quotation || []);
            setJobOrders(detailsData?.jobOrders || []);
            setSpareOrders(detailsData?.spareOrders || []);
            setCallHistory(detailsData?.telecmiCallHistory || []);
            setNumberPlates(detailsData?.numberPlates || []);
            setPayments(customerData?.payments || []);

            // Set form data from fetched customer data
            const masterCustomer = customerData || customer;
            if (masterCustomer) {
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

                // Set phone numbers
                if (masterCustomer.contacts && Array.isArray(masterCustomer.contacts)) {
                    setPhoneNumbers(masterCustomer.contacts.map((c: any) => ({
                        number: c.phone || c.number || 'N/A',
                        type: c.type || 'Alternate',
                        validity: c.valid ? 'Valid' : 'Invalid',
                        whatsApp: c.WhatsApp ? 'Yes' : 'No',
                        dnd: c.DND ? 'Yes' : 'No'
                    })));
                } else if (masterCustomer.phoneNumbers && Array.isArray(masterCustomer.phoneNumbers)) {
                    setPhoneNumbers(masterCustomer.phoneNumbers.map((phone: any) => ({
                        number: phone?.number || phone?.phone || 'N/A',
                        type: phone?.type || 'Alternate',
                        validity: phone?.validity || 'Valid',
                        whatsApp: phone?.whatsApp || phone?.WhatsApp ? 'Yes' : 'No',
                        dnd: phone?.dnd || phone?.DND ? 'Yes' : 'No'
                    })));
                } else {
                    setPhoneNumbers([]);
                }

                // Set billing address
                const bAddr = masterCustomer.address || masterCustomer.billingAddress;
                if (bAddr) {
                    setBillingAddress1(bAddr.line1 || bAddr.addressLine1 || '');
                    setBillingAddress2(bAddr.line2 || bAddr.addressLine2 || '');
                    setBillingAddress3(bAddr.line3 || bAddr.addressLine3 || '');
                    setBillingLocality(bAddr.locality || '');
                    setBillingCountryId(bAddr.country?.id || bAddr.country || 'India');
                    setBillingStateId(bAddr.state?.id || bAddr.state || '');
                    setBillingDistrictId(bAddr.district?.id || bAddr.city || '');
                    setBillingPincode(bAddr.pincode || '');
                }

                // Set shipping address
                const sAddr = masterCustomer.shippingAddress;
                if (sAddr) {
                    setShippingAddress1(sAddr.line1 || sAddr.addressLine1 || sAddr.shippingline1 || '');
                    setShippingAddress2(sAddr.line2 || sAddr.addressLine2 || sAddr.shippingline2 || '');
                    setShippingAddress3(sAddr.line3 || sAddr.addressLine3 || sAddr.shippingline3 || '');
                    setShippingLocality(sAddr.locality || sAddr.shippinglocality || '');
                    setShippingCountryId(sAddr.country?.id || sAddr.country || sAddr.shippingcountry || 'India');
                    setShippingStateId(sAddr.state?.id || sAddr.state || sAddr.shippingstate || '');
                    setShippingDistrictId(sAddr.district?.id || sAddr.shippingdistrict || sAddr.city || '');
                    setShippingPincode(sAddr.pincode || sAddr.shippingpincode || '');
                }
            }

        } catch (error) {
            console.error('Error fetching customer data:', error);
            // Alert.alert('Error', 'Failed to load customer data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomerData();
        fetchCountries();
    }, [customerId]);

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
                if (!gstType && (!value || !value.trim())) {
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
        navigation.goBack();
    };

    const handleAddContact = () => {
        if (newPhone.trim()) {
            setPhoneNumbers([
                ...phoneNumbers,
                {
                    number: newPhone,
                    type: 'Alternate',
                    validity: 'Valid',
                    whatsApp: 'No',
                    dnd: 'No',
                },
            ]);
            setNewPhone('');
        }
    };

    // Dropdown data fetching functions from autoinn-fe
    const fetchCountries = async () => {
        setLoadingCountries(true);
        try {
            const response = await getCountries();
            const data = response?.data;
            if (data?.code === 200) {
                setCountries(data.data || []);
                if (data.data && data.data.length > 0) {
                    setBillingCountryId(data.data[0].id);
                    setShippingCountryId(data.data[0].id);
                    await fetchStates(data.data[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching countries:', error);
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
                setStates(data.data || []);
                setDistricts([]);
            }
        } catch (error) {
            console.error('Error fetching states:', error);
        } finally {
            setLoadingStates(false);
        }
    };

    const fetchDistricts = async (stateId: string) => {
        setLoadingDistricts(true);
        try {
            const response = await getCities(stateId);
            const data = response?.data;
            if (data?.code === 200) {
                setDistricts(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching districts:', error);
        } finally {
            setLoadingDistricts(false);
        }
    };

    const handleCountryChange = async (countryId: string, addressType: 'billing' | 'shipping' = 'billing') => {
        if (addressType === 'billing') {
            setBillingStateId('');
            setBillingDistrictId('');
        } else {
            setShippingStateId('');
            setShippingDistrictId('');
        }
        await fetchStates(countryId);
    };

    const handleStateChange = async (stateId: string, addressType: 'billing' | 'shipping' = 'billing') => {
        if (addressType === 'billing') {
            setBillingDistrictId('');
        } else {
            setShippingDistrictId('');
        }
        await fetchDistricts(stateId);
    };

    const handleGSTTypeChange = (value: string) => {
        setGstTypeValue(value);
        if (value === 'Unregistered') {
            setGstType(true);
            setGstin('');
            setGstName('');
            setGstStatus('');
            // Clear GST error
            setErrors(prev => ({ ...prev, gstin: '' }));
        } else {
            setGstType(false);
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

    const handleSave = () => {
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
        if (!gstType && (!gstin || !gstin.trim())) {
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
            toast.error('Please fix the errors before saving.');
            return;
        }

        // If validation passes, save the data
        toast.success('Customer details saved successfully!');
        navigation.goBack();
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const day = selectedDate.getDate().toString().padStart(2, '0');
            const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
            const year = selectedDate.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;

            // Check if it's the DOB field or Follow-Up Date
            setDob(formattedDate);
            setFollowUpDate(formattedDate);
            setFollowUpDateError('');
        }
    };

    const handleTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime) {
            const hours = selectedTime.getHours().toString().padStart(2, '0');
            const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
            setFollowUpTime(`${hours}:${minutes}`);
        }
    };

    const renderCustomerDetailsTab = () => {
        if (loading) {
            return (
                <View className="flex-1 bg-[#f5f5f5] items-center justify-center">
                    <Text className="text-gray-500">Loading customer details...</Text>
                </View>
            );
        }

        return (
            <ScrollView className="flex-1 bg-[#f5f5f5] px-4 pb-4">
                {/* Customer ID */}
                <View className="mb-4 mt-2">
                    <View className="bg-[#e8f5e9] rounded-lg p-3">
                        <Text className="text-sm font-medium text-gray-700">
                            Customer ID : {customer?.customerId || customerId || 'N/A'}
                        </Text>
                    </View>
                </View>

                {/* Customer Details Section */}
                <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
                    <Text className="text-base font-bold text-gray-800 mb-3">Customer Details</Text>

                    {/* Customer Type */}
                    <View className="mb-3">
                        <FormLabel label="Customer Type" required />
                        <View className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5">
                            <Text className="text-gray-900">{customerType}</Text>
                        </View>
                    </View>

                    {/* Salutation */}
                    <View className="mb-3">
                        <FormLabel label="Salutation" />
                        <View className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5">
                            <Text className="text-gray-900">{salutation || 'Select'}</Text>
                        </View>
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
                        <FormLabel label="Date of Birth" />
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 flex-row items-center justify-between"
                        >
                            <Text className="text-gray-900">{dob}</Text>
                            <Calendar size={18} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {/* Phone Numbers Table */}
                    <View className="mt-2 mb-4">
                        <FormLabel label="Contacts" required />
                        <View className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View className="min-w-[650px]">
                                    {/* Table Header */}
                                    <View className="bg-gray-100 flex-row border-b border-gray-200">
                                        <View className="w-[150px] px-4 py-3">
                                            <Text className="text-gray-700 text-xs font-bold">Phone Number</Text>
                                        </View>
                                        <View className="w-[100px] px-4 py-3">
                                            <Text className="text-gray-700 text-xs font-bold">Type</Text>
                                        </View>
                                        <View className="w-[100px] px-4 py-3">
                                            <Text className="text-gray-700 text-xs font-bold">Validity</Text>
                                        </View>
                                        <View className="w-[100px] px-4 py-3">
                                            <Text className="text-gray-700 text-xs font-bold">WhatsApp</Text>
                                        </View>
                                        <View className="w-[100px] px-4 py-3">
                                            <Text className="text-gray-700 text-xs font-bold">DND</Text>
                                        </View>
                                        <View className="w-[100px] px-4 py-3">
                                            <Text className="text-gray-700 text-xs font-bold text-center">Action</Text>
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
                                            <View className="w-[150px] px-4 py-3 flex-row items-center">
                                                <Text className="text-gray-600 text-xs font-medium">{phone?.number || 'N/A'}</Text>
                                            </View>
                                            <View className="w-[100px] px-4 py-3 flex-row items-center">
                                                <Text className="text-gray-600 text-xs">{phone?.type || 'N/A'}</Text>
                                            </View>
                                            <View className="w-[100px] px-4 py-3 flex-row items-center">
                                                <Text className="text-gray-600 text-xs">{phone?.validity || 'N/A'}</Text>
                                            </View>
                                            <View className="w-[100px] px-4 py-3 flex-row items-center">
                                                <Text className="text-gray-600 text-xs">{phone?.whatsApp || 'N/A'}</Text>
                                            </View>
                                            <View className="w-[100px] px-4 py-3 flex-row items-center">
                                                <Text className="text-gray-600 text-xs">{phone?.dnd || 'N/A'}</Text>
                                            </View>
                                            <View className="w-[100px] px-4 py-3 flex-row items-center justify-center gap-4">
                                                <TouchableOpacity onPress={() => console.log('Edit', phone)}>
                                                    <Edit2 size={14} color="#666" />
                                                </TouchableOpacity>
                                                <View className="w-[1px] h-3 bg-gray-300" />
                                                <TouchableOpacity onPress={() => console.log('Delete', phone)}>
                                                    <Trash2 size={14} color="#666" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    </View>

                    {/* Add Contact Section */}
                    <View className="mb-3">
                        <View className="flex-row gap-2 mb-3">
                            <View className="flex-1">
                                <FormLabel label="Phone" />
                                <TextInput
                                    value={newPhone}
                                    onChangeText={setNewPhone}
                                    placeholder="+91"
                                    placeholderTextColor="#999"
                                    keyboardType="phone-pad"
                                    className="mt-2 bg-white border border-gray-300 rounded-lg px-3 py-3 text-gray-900"
                                />
                            </View>
                            <View className="flex-1">
                                <FormLabel label="Type" />
                                <View className="mt-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-3">
                                    <Text className="text-gray-900">Alternate</Text>
                                </View>
                            </View>
                        </View>

                        <View className="flex-row gap-2 mt-2 mb-5">
                            <View className="flex-1">
                                <FormLabel label="WhatsApp" />
                                <View className="mt-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-3">
                                    <Text className="text-gray-900">No</Text>
                                </View>
                            </View>
                            <View className="flex-1">
                                <FormLabel label="DND" />
                                <View className="mt-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-3">
                                    <Text className="text-gray-900">Not DND</Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleAddContact}
                            className="bg-teal-600 rounded-lg py-3 items-center"
                        >
                            <Text className="text-white font-medium text-sm">Add Contact</Text>
                        </TouchableOpacity>
                    </View>

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
                        <View className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5">
                            <Text className="text-gray-900">{gstType}</Text>
                        </View>
                    </View>

                    {/* GSTIN */}
                    <View className="mb-3">
                        <FormLabel label="GSTIN" required={!gstType} />
                        <TextInput
                            value={gstin}
                            onChangeText={(value) => handleFieldChange('gstin', value)}
                            placeholder="Enter GSTIN"
                            placeholderTextColor="#999"
                            className={`bg-white border rounded-lg px-3 py-2.5 text-gray-900 ${errors.gstin ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.gstin && (
                            <Text className="text-red-500 text-xs mt-1">{errors.gstin}</Text>
                        )}
                    </View>

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

                    {/* Customer Grouping Dropdown Modal */}
                    <Modal
                        visible={showCustomerGroupingDropdown}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setShowCustomerGroupingDropdown(false)}
                    >
                        <TouchableOpacity
                            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
                            activeOpacity={1}
                            onPress={() => setShowCustomerGroupingDropdown(false)}
                        >
                            <View className="bg-white rounded-lg m-4 p-4 max-h-80">
                                <View className="flex-row justify-between items-center mb-4">
                                    <Text className="text-lg font-semibold">Customer Grouping</Text>
                                    <TouchableOpacity onPress={() => setShowCustomerGroupingDropdown(false)}>
                                        <X size={20} color="#666" />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView>
                                    {customerGroupingOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option.key}
                                            className="p-3 border-b border-gray-100"
                                            onPress={() => {
                                                setCustomerGrouping(option.key);
                                                setShowCustomerGroupingDropdown(false);
                                                setErrors(prev => ({ ...prev, customerGrouping: '' }));
                                            }}
                                        >
                                            <Text className="text-gray-900">{option.title}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </TouchableOpacity>
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
                        <View className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5">
                            <Text className="text-gray-900">{billingCountryId || 'India'}</Text>
                        </View>
                    </View>

                    <View className="mb-3">
                        <FormLabel label="State" />
                        <View className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5">
                            <Text className="text-gray-900">{billingStateId || 'Tamil Nadu'}</Text>
                        </View>
                    </View>

                    <View className="mb-3">
                        <FormLabel label="City" />
                        <View className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5">
                            <Text className="text-gray-900">
                                {districts.find(d => d.id === billingDistrictId)?.name || 'Select City'}
                            </Text>
                        </View>
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
                        <View className={`border rounded-lg px-3 py-2.5 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-gray-50 border-gray-300'}`}>
                            <Text className="text-gray-900">{sameAsBilling ? billingCountryId : shippingCountryId || 'India'}</Text>
                        </View>
                    </View>

                    <View className="mb-3">
                        <FormLabel label="State" />
                        <View className={`border rounded-lg px-3 py-2.5 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-gray-50 border-gray-300'}`}>
                            <Text className="text-gray-900">{sameAsBilling ? billingStateId : shippingStateId || 'Tamil Nadu'}</Text>
                        </View>
                    </View>

                    <View className="mb-3">
                        <FormLabel label="City" />
                        <View className={`border rounded-lg px-3 py-2.5 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-gray-50 border-gray-300'}`}>
                            <Text className="text-gray-900">{sameAsBilling ? billingDistrictId : shippingDistrictId || 'Ariyapakkam'}</Text>
                        </View>
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
                            <Text className="text-gray-400">No quotations found</Text>
                        </View>
                    ) : quotations.map((quotation, index) => (
                        <View
                            key={quotation.id || index}
                            className={`px-3 py-3 border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        >
                            <View className="flex-row items-center">
                                <Text className="text-[10px] text-gray-600 flex-1">{quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString('en-GB') : (quotation.date || 'N/A')}</Text>
                                <Text className="text-[10px] text-teal-600 font-bold flex-1">{quotation.quotationId || quotation.id || 'N/A'}</Text>
                                <Text className="text-[10px] text-gray-800 flex-1">{quotation.vehicle?.[0]?.vehicleDetail?.modelCode || quotation.modelCode || 'N/A'}</Text>
                                <Text className="text-[10px] text-gray-800 flex-1" numberOfLines={1}>{quotation.vehicle?.[0]?.vehicleDetail?.modelName || quotation.modelName || quotation.vehicleName || 'N/A'}</Text>
                                <TouchableOpacity className="w-12 items-center">
                                    <Text className="text-teal-600 text-[10px] font-medium">View</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        );
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
                                <Text className="text-xs text-gray-500 w-24">Chassis No:</Text>
                                <Text className="text-xs text-gray-800 font-medium">{vehicle.chassisNo || 'N/A'}</Text>
                            </View>
                            <View className="flex-row">
                                <Text className="text-xs text-gray-500 w-24">Color:</Text>
                                <Text className="text-xs text-gray-800 font-medium">{vehicle.color?.color || 'N/A'}</Text>
                            </View>
                            <View className="flex-row">
                                <Text className="text-xs text-gray-500 w-24">Date of Sale:</Text>
                                <Text className="text-xs text-gray-800 font-medium">
                                    {vehicle.dateOfSale ? new Date(vehicle.dateOfSale).toLocaleDateString('en-GB') : 'N/A'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity className="mt-4 border border-teal-600 rounded-lg py-2 items-center">
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
                            <Text className="text-gray-400">No bookings found</Text>
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
            <View className="bg-white border-b border-gray-200 px-4 py-4 flex-row items-center">
                <TouchableOpacity onPress={handleClose} className="mr-3">
                    <ChevronLeft size={22} color="#333" />
                </TouchableOpacity>
                <Text className="text-gray-900 text-lg font-bold">Customer Details</Text>
            </View>

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

            {/* Date Picker Modal */}
            {showDatePicker && (
                <DateTimePicker
                    value={new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                />
            )}

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
                                                onPress={() => setSelectedHour(hour)}
                                                className={`px-4 py-3 ${selectedHour === hour ? 'bg-teal-50' : ''}`}
                                            >
                                                <Text className={`text-sm ${selectedHour === hour ? 'text-teal-700 font-bold' : 'text-gray-700'}`}>
                                                    {String(hour).padStart(2, '0')}:00
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
                                                    :{String(minute).padStart(2, '0')}
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
                                        const label = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
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
                    title="Save"
                    className="flex-1 ml-2"
                    onPress={handleSave}
                />
            </View>
        </SafeAreaView>
    );
}