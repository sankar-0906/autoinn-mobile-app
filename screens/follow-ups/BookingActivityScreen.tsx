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
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import AttachQuotationModal from '../../components/AttachQuotationModal';
import { 
    getCountries, 
    getStates, 
    getCities, 
    getUsers,
    getBranches,
    generateCustomerId,
    getCustomerByPhoneNo,
    getCurrentUser
} from '../../src/api';
import platformApi from '../../src/api';
import { useToast } from '../../src/ToastContext';

// Custom Modal Component
const CustomModal = ({ visible, children, onClose }: { visible: boolean; children: React.ReactNode; onClose: () => void }) => {
    if (!visible) return null;
    
    return (
        <View className="absolute inset-0 z-50 flex-1">
            <View className="flex-1 bg-black/50 justify-center">
                <View className="bg-white rounded-xl m-4 max-h-96">
                    {children}
                </View>
            </View>
        </View>
    );
};

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
    // Don't use route params for initial values - start with empty fields
    const toast = useToast();

    const [activeTab, setActiveTab] = useState<'customer' | 'vehicle' | 'payment'>('customer');
    const [paymentMode, setPaymentMode] = useState('cash');

    // Customer Data - Start with empty values
    const [branch, setBranch] = useState(''); // Empty, will be set by user selection
    const [phone, setPhone] = useState(''); // Empty, will be filled by user input
    const [customerFullName, setCustomerFullName] = useState(''); // Empty, will be filled by auto-fill
    const [fatherName, setFatherName] = useState('');
    const [address, setAddress] = useState('');
    const [address2, setAddress2] = useState('');
    const [address3, setAddress3] = useState('');
    const [locality, setLocality] = useState('');
    const [country, setCountry] = useState(''); // Empty, will be filled by auto-fill
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
    const [quotationsAssociated, setQuotationsAssociated] = useState('');
    
    // Customer ID
    const [generatedCustomerId, setGeneratedCustomerId] = useState('');
    const [customerData, setCustomerData] = useState<any>(null);

    // Dropdown data
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

    // Modal states
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
    const [showAttachQuotationModal, setShowAttachQuotationModal] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Validation errors
    const [nameError, setNameError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [salesOfficerError, setSalesOfficerError] = useState('');
    const [addressError, setAddressError] = useState('');
    const [localityError, setLocalityError] = useState('');
    const [pincodeError, setPincodeError] = useState('');
    const [modelError, setModelError] = useState('');
    const [bookingAmountError, setBookingAmountError] = useState('');

    // Data fetching functions
    const fetchCountries = async () => {
        try {
            const response = await getCountries();
            if (response.data.code === 200 && response.data.data) {
                // Filter to only show India and set it as default
                const india = response.data.data.find((country: any) => country.name === 'India');
                if (india) {
                    setCountries([india]);
                    setCountry('India');
                    // Fetch states for India
                    fetchStates(india.id);
                } else {
                    // Fallback to India only
                    setCountries([{ id: '1', name: 'India' }]);
                    setCountry('India');
                    fetchStates('1');
                }
            } else {
                // Fallback to India only
                setCountries([{ id: '1', name: 'India' }]);
                setCountry('India');
                fetchStates('1');
            }
        } catch (error) {
            // Fallback to India only
            setCountries([{ id: '1', name: 'India' }]);
            setCountry('India');
            fetchStates('1');
        }
    };

    const fetchStates = async (countryId: string) => {
        try {
            const response = await getStates(countryId);
            if (response.data.code === 200 && response.data.data) {
                setStates(response.data.data);
            } else {
                setStates([]);
            }
        } catch (error) {
            toast.error('Failed to load states');
            setStates([]);
        }
    };

    const fetchCities = async (stateId: string) => {
        try {
            const response = await getCities(stateId);
            if (response.data.code === 200 && response.data.data) {
                setCities(response.data.data);
            } else {
                setCities([]);
            }
        } catch (error) {
            toast.error('Failed to load cities');
            setCities([]);
        }
    };

    const fetchRtos = async () => {
        try {
            // Temporarily using mock data
            const mockRtos = [
                { id: '1', name: 'RTO Bangalore' },
                { id: '2', name: 'RTO Mumbai' },
                { id: '3', name: 'RTO Chennai' },
            ];
            setRtos(mockRtos);
            
            // Uncomment when API is working:
            // const response = await fetch('https://test.autocloud.in/api/rto/get', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ page: 1, size: 100, searchString: '' })
            // });
            // const data = await response.json();
            // if (data.code === 200) {
            //     setRtos(data.response.data || []);
            // } else {
            //     setRtos([]);
            // }
        } catch (error) {
            console.error('Error fetching RTOs:', error);
            setRtos([]);
        }
    };

    const fetchManufacturers = async (branchId: string = '1') => {
        try {
            // Temporarily using mock data
            const mockManufacturers = [
                { id: '1', name: 'India Yamaha Motors Private Limited' },
                { id: '2', name: 'Hero MotoCorp' },
                { id: '3', name: 'Honda Motorcycle' },
            ];
            setManufacturers(mockManufacturers);
            
            // Uncomment when API is working:
            // const response = await fetch(`https://test.autocloud.in/api/manufacturer/branch/${branchId}`);
            // const data = await response.json();
            // if (data.code === 200) {
            //     setManufacturers(data.response.data || []);
            // } else {
            //     setManufacturers([]);
            // }
        } catch (error) {
            console.error('Error fetching manufacturers:', error);
            setManufacturers([]);
        }
    };

    const fetchModels = async (manufacturerId: string) => {
        try {
            // Temporarily using mock data
            const mockModels = [
                { id: '1', name: 'FZ-S Fi' },
                { id: '2', name: 'MT-15' },
                { id: '3', name: 'R15' },
            ];
            setModels(mockModels);
            
            // Uncomment when API is working:
            // const response = await fetch(`https://test.autocloud.in/api/vehicleMaster/${manufacturerId}`);
            // const data = await response.json();
            // if (data.code === 200) {
            //     setModels(data.response.data || []);
            // } else {
            //     setModels([]);
            // }
        } catch (error) {
            console.error('Error fetching models:', error);
            setModels([]);
        }
    };

    const fetchColors = async () => {
        try {
            // Temporarily using mock data
            const mockColors = [
                { id: '1', name: 'Black', code: '#000000' },
                { id: '2', name: 'Blue', code: '#0066CC' },
                { id: '3', name: 'Red', code: '#CC0000' },
            ];
            setColors(mockColors);
            
            // Uncomment when API is working:
            // const response = await fetch('https://test.autocloud.in/api/vehicleMaster/get', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ page: 1, size: 100, searchString: '' })
            // });
            // const data = await response.json();
            // if (data.code === 200) {
            //     const vehicleData = data.response.data || [];
            //     const uniqueColors = [...new Set(vehicleData.map((v: any) => v.color).filter(Boolean))];
            //     setColors(uniqueColors.map((color: any, index: number) => ({
            //         id: index.toString(),
            //         name: color.name || color,
            //         code: color.code || '#000000'
            //     })));
            // } else {
            //     setColors([]);
            // }
        } catch (error) {
            console.error('Error fetching colors:', error);
            setColors([]);
        }
    };

    const fetchSalesOfficers = async (branchId: string = '1') => {
    console.log('🚀 Starting fetchSalesOfficers with branchId:', branchId);
    try {
        // Simplified approach: just use getUsers API like other dropdowns
        console.log('👥 Calling getUsers for sales_executives...');
        const response = await getUsers({
            branch: branchId,
            role: 'sales_executive'
        });
        
        console.log('📄 getUsers response:', response.data);
        
        // Fix: The users are in response.response.data.users, not response.data.data
        if (response.data.response && response.data.response.data && response.data.response.data.users) {
            const salesExecutives = response.data.response.data.users;
            console.log('📊 Found sales executives:', salesExecutives.length);
            console.log('👤 Sales executives data:', salesExecutives.map((u: any) => ({ 
                id: u.id, 
                name: u.name || u.profile?.employeeName 
            })));
            
            setSalesOfficers(salesExecutives);
        } else {
            console.log('⚠️ No sales executives found, response structure:', response.data);
            setSalesOfficers([]);
        }
    } catch (error) {
        console.error('❌ Failed to load sales officers:', error);
        setSalesOfficers([]);
    }
};

const fetchReferredByOptions = async () => {
    try {
        // Use the same API as web project: /api/options/get/
        const response = await platformApi.post('/api/options/get/', {
            module: "customers",
            column: "name",
            searchString: "", // Empty string to get all
            fields: ["contacts{phone}"],
            size: 20,
            page: 1
        });
        
        if (response.data.code === 200 && response.data.response) {
            // Format the same way as web project: phone - name
            const employees = response.data.response.map((customer: any) => ({
                id: customer.id,
                name: customer.contacts && customer.contacts[0] 
                    ? `${customer.contacts[0].phone} - ${customer.name}`
                    : customer.name
            }));
            console.log('✅ Loaded referred by options:', employees.length);
            setReferredByOptions(employees);
        } else {
            console.log('⚠️ No referred by data found');
            setReferredByOptions([]);
        }
    } catch (error) {
        console.error('Failed to load referred by options:', error);
        setReferredByOptions([]);
    }
};

const fetchRelationshipOptions = async () => {
    try {
        const mockRelationships = [
            { id: '1', name: 'Father' },
            { id: '2', name: 'Mother' },
            { id: '3', name: 'Brother' },
            { id: '4', name: 'Sister' },
            { id: '5', name: 'Wife' },
            { id: '6', name: 'Husband' },
            { id: '7', name: 'Son' },
            { id: '8', name: 'Daughter' },
            { id: '9', name: 'Mother-in-law' },
            { id: '10', name: 'Father-in-law' },
            { id: '11', name: 'Sister-in-law' },
            { id: '12', name: 'Brother-in-law' },
            { id: '13', name: 'Daughter-in-law' },
            { id: '14', name: 'Brother-in-law' },
        ];
        setRelationshipOptions(mockRelationships);
    } catch (error) {
        console.error('Error fetching relationship options:', error);
    }
};

const fetchBranches = async () => {
    try {
        console.log('🏢 Fetching branches...');
        const response = await getBranches();
        console.log('📄 Branches response:', response.data);
        
        if (response.data.code === 200 && response.data.data) {
            const branchesData = response.data.data;
            console.log('📊 Found branches:', branchesData.length);
            console.log('🏢 Branches data:', branchesData);
            setBranches(branchesData);
            
            // Set default branch to first branch if available
            if (branchesData.length > 0) {
                const defaultBranch = branchesData[0];
                console.log('🎯 Setting default branch:', defaultBranch.name);
                setBranch(defaultBranch.name);
            }
        } else {
            console.log('⚠️ No branches found, using mock data');
            // Fallback to mock data if API fails
            const mockBranches = [
                { id: '1', name: 'Devanahalli' },
                { id: '2', name: 'Doddaballapura' }
            ];
            setBranches(mockBranches);
            setBranch('Devanahalli'); // Set default
        }
    } catch (error) {
        console.error('❌ Failed to load branches, using mock data:', error);
        // Fallback to mock data if API fails
        const mockBranches = [
            { id: '1', name: 'Devanahalli' },
            { id: '2', name: 'Doddaballapura' }
        ];
        setBranches(mockBranches);
        setBranch('Devanahalli'); // Set default
    }
};

    // Initialize data on component mount
    React.useEffect(() => {
        console.log('🚀 Component mounted - loading only dropdown data, no auto-fill');
        
        // Only load dropdown data on mount, don't auto-fill any customer fields
        fetchCountries();
        fetchRtos();
        fetchManufacturers('1'); // Default branch ID
        fetchColors();
        fetchSalesOfficers('1'); // Default branch ID
        fetchReferredByOptions();
        fetchRelationshipOptions();
        fetchBranches();
        
        // Generate Customer ID only (don't fetch customer data)
        generateNewCustomerId();
    }, []);

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

    // Handle quotation attachment
    const handleAttachQuotation = (selectedQuotations: string[]) => {
        if (selectedQuotations.length > 0) {
            // The selectedQuotations array contains database IDs, but we need to get the actual quotation IDs
            // For now, we'll use the selected IDs as quotation IDs since the modal should return quotationId
            const quotationIds = selectedQuotations.join(', ');
            setQuotationsAssociated(quotationIds);
            toast.success(`Attached ${selectedQuotations.length} quotation(s)`);
        }
        setShowAttachQuotationModal(false);
    };

    const handleLinkQuotationPress = () => {
        setShowAttachQuotationModal(true);
    };

    // Date handling functions
    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        setDob(formattedDate);
        
        // Calculate age
        const today = new Date();
        const birthDate = new Date(date);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        setAge(age.toString());
        setShowCalendarModal(false);
    };

    const openCalendar = () => {
        setShowCalendarModal(true);
    };

    // Customer ID Generation function
    const generateNewCustomerId = async () => {
        try {
            console.log('🔍 Generating customer ID...');
            const response = await generateCustomerId();
            console.log('📄 Customer ID response:', response.data);
            
            if (response.data.code === 200) {
                // Fix: Handle different response structures
                let customerId = '';
                if (response.data.response && response.data.response.data) {
                    customerId = response.data.response.data;
                } else if (response.data.data) {
                    customerId = response.data.data;
                } else if (response.data.response && response.data.response.data && response.data.response.data.customerId) {
                    customerId = response.data.response.data.customerId;
                }
                
                if (customerId) {
                    console.log('✅ Generated Customer ID:', customerId);
                    setGeneratedCustomerId(customerId);
                } else {
                    console.log('❌ Could not extract Customer ID from response');
                    setGeneratedCustomerId('CNB' + Math.floor(Math.random() * 100000));
                }
            } else {
                console.log('❌ Failed to generate customer ID:', response.data);
                setGeneratedCustomerId('CNB' + Math.floor(Math.random() * 100000));
            }
        } catch (error) {
            console.error('❌ Error generating customer ID:', error);
            setGeneratedCustomerId('CNB' + Math.floor(Math.random() * 100000));
            toast.error('Failed to generate customer ID');
        }
    };

    // Fetch customer data by phone number (like Follow Ups page)
    const fetchCustomerData = async () => {
        try {
            if (phone) {
                console.log('🔍 Fetching customer data for phone:', phone);
                const customerRes = await getCustomerByPhoneNo(phone);
                const customersData = (customerRes.data?.response?.data?.customers as any[]) || [];
                
                if (customersData.length > 0) {
                    const customer = customersData[0];
                    console.log('✅ Found customer data:', customer);
                    setCustomerData(customer);
                    
                    // Use the same logic as Follow Ups page: customerId || id
                    const displayCustomerId = customer.customerId || customer.id;
                    console.log('🎯 Setting Customer ID from customer data:', displayCustomerId);
                    setGeneratedCustomerId(displayCustomerId);
                    
                    // Auto-fill all customer fields
                    autoFillCustomerFields(customer);
                } else {
                    console.log('🔄 No customer found, generating new ID...');
                    generateNewCustomerId();
                }
            }
        } catch (error) {
            console.error('❌ Error fetching customer data:', error);
            generateNewCustomerId();
        }
    };

    // Auto-fill customer fields when existing customer is found
    const autoFillCustomerFields = (customer: any) => {
        console.log('🔄 Auto-filling customer fields...');
        console.log('📋 Full customer data:', JSON.stringify(customer, null, 2));
        
        // Skip Branch - user will select from dropdown
        
        // Customer Name
        if (customer.name) {
            console.log('👤 Setting Customer Name:', customer.name);
            setCustomerFullName(customer.name);
        } else {
            console.log('❌ Customer Name not found in customer data');
        }
        
        // Father's Name
        if (customer.fatherName) {
            console.log('👨 Setting Father Name:', customer.fatherName);
            setFatherName(customer.fatherName);
        } else {
            console.log('❌ Father Name not found in customer data');
        }
        
        // Address fields
        if (customer.address) {
            console.log('🏠 Address data found:', customer.address);
            
            // Address Line 1
            if (customer.address.line1) {
                console.log('📍 Setting Address Line 1:', customer.address.line1);
                setAddress(customer.address.line1);
            } else {
                console.log('❌ Address Line 1 not found');
            }
            
            // Address Line 2
            if (customer.address.line2) {
                console.log('📍 Setting Address Line 2:', customer.address.line2);
                setAddress2(customer.address.line2);
            } else {
                console.log('❌ Address Line 2 not found');
            }
            
            // Address Line 3
            if (customer.address.line3) {
                console.log('📍 Setting Address Line 3:', customer.address.line3);
                setAddress3(customer.address.line3);
            } else {
                console.log('❌ Address Line 3 not found');
            }
            
            // Locality
            if (customer.address.locality) {
                console.log('🏘️ Setting Locality:', customer.address.locality);
                setLocality(customer.address.locality);
            } else {
                console.log('❌ Locality not found');
            }
            
            // Pincode
            if (customer.address.pincode) {
                console.log('📮 Setting Pincode:', customer.address.pincode);
                setPincode(customer.address.pincode);
            } else {
                console.log('❌ Pincode not found');
            }
        } else {
            console.log('❌ Address data not found in customer data');
        }
        
        // Country
        if (customer.address?.country?.name) {
            console.log('🌍 Setting Country:', customer.address.country.name);
            setCountry(customer.address.country.name);
            // Fetch states for this country
            if (customer.address.country.id) {
                console.log('🔄 Fetching states for country ID:', customer.address.country.id);
                fetchStates(customer.address.country.id);
            }
        } else {
            console.log('❌ Country not found in customer data');
        }
        
        // State
        if (customer.address?.state?.name) {
            console.log('🗺️ Setting State:', customer.address.state.name);
            setStateVal(customer.address.state.name);
            // Fetch cities for this state
            if (customer.address.state.id) {
                console.log('🔄 Fetching cities for state ID:', customer.address.state.id);
                fetchCities(customer.address.state.id);
            }
        } else {
            console.log('❌ State not found in customer data');
        }
        
        // City
        if (customer.address?.city?.name) {
            console.log('🏙️ Setting City:', customer.address.city.name);
            setCity(customer.address.city.name);
        } else {
            console.log('❌ City not found in customer data');
        }
        
        // DOB
        if (customer.dateOfBirth) {
            const dob = new Date(customer.dateOfBirth).toISOString().split('T')[0];
            console.log('🎂 Setting DOB:', dob);
            setDob(dob);
            // Calculate age
            const today = new Date();
            const birthDate = new Date(customer.dateOfBirth);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            console.log('👶 Setting calculated Age:', age);
            setAge(age.toString());
        } else {
            console.log('❌ DOB not found in customer data');
        }
        
        // Quotations Associated
        if (customer.quotation && customer.quotation.length > 0) {
            const quotationIds = customer.quotation.map((q: any) => q.quotationId).join(', ');
            console.log('📄 Setting Quotations Associated:', quotationIds);
            setQuotationsAssociated(quotationIds);
        } else {
            console.log('❌ Quotations not found in customer data');
        }
        
        console.log('✅ Customer fields auto-fill process completed');
    };

    // Handle phone number change with auto-fill
    const handlePhoneChange = (phone: string) => {
        setPhone(phone);
        
        // Check if phone number is 10 digits, then search for existing customer
        if (phone.length === 10) {
            console.log('📞 Phone number is 10 digits, checking for existing customer...');
            fetchCustomerData();
        }
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
                    <Text className="text-gray-900 text-lg font-bold">Booking Register</Text>
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
                    <Text className="text-gray-900 text-sm font-medium">
                        {(() => {
                            console.log('🎨 Rendering Customer ID:', { generatedCustomerId });
                            // Always show the generated Customer ID
                            return generatedCustomerId || 'Loading...';
                        })()}
                    </Text>
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
                                    <TouchableOpacity
                                        onPress={() => setShowBranchModal(true)}
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                                    >
                                        <Text className="text-gray-800 flex-1">
                                            {branch || 'Select Branch'}
                                        </Text>
                                        <ChevronRight size={16} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
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
                                            onChangeText={handlePhoneChange}
                                            placeholder="Enter phone number"
                                            keyboardType="phone-pad"
                                            className={`flex-1 h-12 bg-white border rounded-lg px-3 text-gray-800 ${phoneError ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {phoneError ? <Text className="text-red-500 text-xs mt-1">{phoneError}</Text> : null}
                                    </View>
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Father's Name" required/>
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
                                    <FormLabel label="Country" required />
                                    <TouchableOpacity 
                                        onPress={() => setShowCountryModal(true)}
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                                    >
                                        <Text className="text-gray-800 flex-1">
                                            {country || 'Select Country'}
                                        </Text>
                                        <ChevronRight size={16} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="State" required />
                                    <TouchableOpacity 
                                        onPress={() => setShowStateModal(true)}
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                                    >
                                        <Text className="text-gray-800 flex-1">
                                            {stateVal || 'Select State'}
                                        </Text>
                                        <ChevronRight size={16} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="City" required />
                                    <TouchableOpacity 
                                        onPress={() => setShowCityModal(true)}
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                                    >
                                        <Text className="text-gray-800 flex-1">
                                            {city || 'Select City'}
                                        </Text>
                                        <ChevronRight size={16} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
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
                                    <FormLabel label="DOB" required/>
                                    <View className="flex-row items-center">
                                        <TextInput
                                            value={dob}
                                            onChangeText={setDob}
                                            placeholder="DD/MM/YYYY"
                                            className="flex-1 h-12 bg-white border border-gray-300 rounded-l-lg px-3 text-gray-800"
                                        />
                                        <TouchableOpacity 
                                            onPress={openCalendar}
                                            className="h-12 bg-teal-600 rounded-r-lg px-4 justify-center"
                                        >
                                            <Calendar size={20} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Age" required/>
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
                                    <TouchableOpacity 
                                        onPress={() => setShowReferredByModal(true)}
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                                    >
                                        <Text className="text-gray-800 flex-1">
                                            {referredBy || 'Select Referred By'}
                                        </Text>
                                        <ChevronRight size={16} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Relationship" required />
                                    <TouchableOpacity 
                                        onPress={() => setShowRelationshipModal(true)}
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                                    >
                                        <Text className="text-gray-800 flex-1">
                                            {relationship || 'Select Relationship'}
                                        </Text>
                                        <ChevronRight size={16} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Nominee Details" required/>
                                    <TextInput
                                        value={nominee}
                                        onChangeText={setNominee}
                                        placeholder="Nominee"
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Sales Officer" required />
                                    <TouchableOpacity 
                                        onPress={() => setShowSalesOfficerModal(true)}
                                        className={`h-12 bg-white border rounded-lg px-3 flex-row items-center justify-between ${salesOfficerError ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <Text className="text-gray-800 flex-1">
                                            {salesOfficer || 'Select Sales Officer'}
                                        </Text>
                                        <ChevronRight size={16} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
                                    {salesOfficerError ? <Text className="text-red-500 text-xs mt-1">{salesOfficerError}</Text> : null}
                                </View>

                                <View className="mb-4">
                                    <View className="flex-row items-center justify-between mb-2">
                                        <FormLabel label="Quotations Associated" />
                                        <TouchableOpacity 
                                            onPress={handleLinkQuotationPress}
                                            className="px-3 py-1 bg-teal-600 rounded-lg"
                                        >
                                            <Text className="text-white text-xs font-medium">Link Quotation</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {quotationsAssociated ? (
                                        <View className="flex-row flex-wrap gap-2 p-3 bg-gray-100 border border-gray-300 rounded-lg min-h-[48px]">
                                            {quotationsAssociated.split(',').map((quotationId, index) => (
                                                <View 
                                                    key={index}
                                                    className="px-3 py-1 bg-gray-400 rounded-full"
                                                >
                                                    <Text className="text-white text-sm font-medium">{quotationId.trim()}</Text>
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

                        {activeTab === 'vehicle' && (
                            <View>
                                <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                                    Vehicle Information
                                </Text>

                                <View className="mb-4">
                                    <FormLabel label="Manufacturer" required />
                                    <TouchableOpacity
                                        onPress={() => setShowManufacturerModal(true)}
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                                    >
                                        <Text className="text-gray-800 flex-1">
                                            {manufacturer || 'Select Manufacturer'}
                                        </Text>
                                        <ChevronRight size={16} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="Model Name" required />
                                    <TouchableOpacity
                                        onPress={() => setShowModelModal(true)}
                                        className={`h-12 bg-white border rounded-lg px-3 flex-row items-center justify-between ${modelError ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <Text className="text-gray-800 flex-1">
                                            {model || 'Select Model'}
                                        </Text>
                                        <ChevronRight size={16} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
                                    {modelError ? <Text className="text-red-500 text-xs mt-1">{modelError}</Text> : null}
                                </View>

                                <View className="mb-4">
                                    <FormLabel label="RTO" required />
                                    <TouchableOpacity
                                        onPress={() => setShowRtoModal(true)}
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                                    >
                                        <Text className="text-gray-800 flex-1">
                                            {rto || 'Select RTO'}
                                        </Text>
                                        <ChevronRight size={16} color={COLORS.gray[400]} />
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

            {/* Dropdown Modals */}
            {/* Country Modal */}
            <CustomModal visible={showCountryModal} onClose={() => setShowCountryModal(false)}>
                <View className="p-4 border-b border-gray-200">
                    <Text className="text-lg font-semibold">Select Country</Text>
                </View>
                <ScrollView>
                    {countries?.map((country) => (
                        <TouchableOpacity
                            key={country.id}
                            onPress={() => {
                                setCountry(country.name);
                                setShowCountryModal(false);
                                fetchStates(country.id);
                            }}
                            className="p-4 border-b border-gray-100"
                        >
                            <Text className="text-gray-800">{country.name}</Text>
                        </TouchableOpacity>
                    )) || []}
                </ScrollView>
                <TouchableOpacity onPress={() => setShowCountryModal(false)} className="p-4 border-t border-gray-200">
                    <Text className="text-center text-gray-600">Cancel</Text>
                </TouchableOpacity>
            </CustomModal>

            {/* State Modal */}
            <CustomModal visible={showStateModal} onClose={() => setShowStateModal(false)}>
                <View className="p-4 border-b border-gray-200">
                    <Text className="text-lg font-semibold">Select State</Text>
                </View>
                <ScrollView>
                    {states?.map((state) => (
                        <TouchableOpacity
                            key={state.id}
                            onPress={() => {
                                setStateVal(state.name);
                                setCity(''); // Clear city when state changes
                                setShowStateModal(false);
                                fetchCities(state.id);
                            }}
                            className="p-4 border-b border-gray-100"
                        >
                            <Text className="text-gray-800">{state.name}</Text>
                        </TouchableOpacity>
                    )) || []}
                </ScrollView>
                <TouchableOpacity onPress={() => setShowStateModal(false)} className="p-4 border-t border-gray-200">
                    <Text className="text-center text-gray-600">Cancel</Text>
                </TouchableOpacity>
            </CustomModal>

            {/* City Modal */}
            <CustomModal visible={showCityModal} onClose={() => setShowCityModal(false)}>
                <View className="p-4 border-b border-gray-200">
                    <Text className="text-lg font-semibold">Select City</Text>
                </View>
                <ScrollView>
                    {cities?.map((city) => (
                        <TouchableOpacity
                            key={city.id}
                            onPress={() => {
                                setCity(city.name);
                                setShowCityModal(false);
                            }}
                            className="p-4 border-b border-gray-100"
                        >
                            <Text className="text-gray-800">{city.name}</Text>
                        </TouchableOpacity>
                    )) || []}
                </ScrollView>
                <TouchableOpacity onPress={() => setShowCityModal(false)} className="p-4 border-t border-gray-200">
                    <Text className="text-center text-gray-600">Cancel</Text>
                </TouchableOpacity>
            </CustomModal>

            {/* RTO Modal */}
            <CustomModal visible={showRtoModal} onClose={() => setShowRtoModal(false)}>
                <View className="p-4 border-b border-gray-200">
                    <Text className="text-lg font-semibold">Select RTO</Text>
                </View>
                <ScrollView>
                    {rtos?.map((rto) => (
                        <TouchableOpacity
                            key={rto.id}
                            onPress={() => {
                                setRto(rto.name);
                                setShowRtoModal(false);
                            }}
                            className="p-4 border-b border-gray-100"
                        >
                            <Text className="text-gray-800">{rto.name}</Text>
                        </TouchableOpacity>
                    )) || []}
                </ScrollView>
                <TouchableOpacity onPress={() => setShowRtoModal(false)} className="p-4 border-t border-gray-200">
                    <Text className="text-center text-gray-600">Cancel</Text>
                </TouchableOpacity>
            </CustomModal>

            {/* Manufacturer Modal */}
            <CustomModal visible={showManufacturerModal} onClose={() => setShowManufacturerModal(false)}>
                <View className="p-4 border-b border-gray-200">
                    <Text className="text-lg font-semibold">Select Manufacturer</Text>
                </View>
                <ScrollView>
                    {manufacturers?.map((manufacturer) => (
                        <TouchableOpacity
                            key={manufacturer.id}
                            onPress={() => {
                                setManufacturer(manufacturer.name);
                                setShowManufacturerModal(false);
                                fetchModels(manufacturer.id);
                            }}
                            className="p-4 border-b border-gray-100"
                        >
                            <Text className="text-gray-800">{manufacturer.name}</Text>
                        </TouchableOpacity>
                    )) || []}
                </ScrollView>
                <TouchableOpacity onPress={() => setShowManufacturerModal(false)} className="p-4 border-t border-gray-200">
                    <Text className="text-center text-gray-600">Cancel</Text>
                </TouchableOpacity>
            </CustomModal>

            {/* Model Modal */}
            <CustomModal visible={showModelModal} onClose={() => setShowModelModal(false)}>
                <View className="p-4 border-b border-gray-200">
                    <Text className="text-lg font-semibold">Select Model</Text>
                </View>
                <ScrollView>
                    {models?.map((model) => (
                        <TouchableOpacity
                            key={model.id}
                            onPress={() => {
                                setModel(model.name);
                                setShowModelModal(false);
                            }}
                            className="p-4 border-b border-gray-100"
                        >
                            <Text className="text-gray-800">{model.name}</Text>
                        </TouchableOpacity>
                    )) || []}
                </ScrollView>
                <TouchableOpacity onPress={() => setShowModelModal(false)} className="p-4 border-t border-gray-200">
                    <Text className="text-center text-gray-600">Cancel</Text>
                </TouchableOpacity>
            </CustomModal>

            {/* Color Modal */}
            <CustomModal visible={showColorModal} onClose={() => setShowColorModal(false)}>
                <View className="p-4 border-b border-gray-200">
                    <Text className="text-lg font-semibold">Select Color</Text>
                </View>
                <ScrollView>
                    {colors?.map((color) => (
                        <TouchableOpacity
                            key={color.id}
                            onPress={() => {
                                setVehicleColor(color.name);
                                setShowColorModal(false);
                            }}
                            className="p-4 border-b border-gray-100 flex-row items-center"
                        >
                            <View className="w-6 h-6 rounded-full mr-3" style={{ backgroundColor: color.code }} />
                            <Text className="text-gray-800">{color.name}</Text>
                        </TouchableOpacity>
                    )) || []}
                </ScrollView>
                <TouchableOpacity onPress={() => setShowColorModal(false)} className="p-4 border-t border-gray-200">
                    <Text className="text-center text-gray-600">Cancel</Text>
                </TouchableOpacity>
            </CustomModal>

            {/* Sales Officer Modal */}
            <CustomModal visible={showSalesOfficerModal} onClose={() => setShowSalesOfficerModal(false)}>
                <View className="p-4 border-b border-gray-200">
                    <Text className="text-lg font-semibold">Select Sales Officer</Text>
                </View>
                <ScrollView>
                    {salesOfficers?.map((officer) => (
                        <TouchableOpacity
                            key={officer.id}
                            onPress={() => {
                                setSalesOfficer(officer.name || officer.profile?.employeeName);
                                setShowSalesOfficerModal(false);
                            }}
                            className="p-4 border-b border-gray-100"
                        >
                            <Text className="text-gray-800">{officer.name || officer.profile?.employeeName}</Text>
                        </TouchableOpacity>
                    )) || []}
                </ScrollView>
                <TouchableOpacity onPress={() => setShowSalesOfficerModal(false)} className="p-4 border-t border-gray-200">
                    <Text className="text-center text-gray-600">Cancel</Text>
                </TouchableOpacity>
            </CustomModal>

            {/* Referred By Modal */}
            <CustomModal visible={showReferredByModal} onClose={() => setShowReferredByModal(false)}>
                <View className="p-4 border-b border-gray-200">
                    <Text className="text-lg font-semibold">Select Referred By</Text>
                </View>
                <ScrollView>
                    {referredByOptions?.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            onPress={() => {
                                setReferredBy(option.name);
                                setShowReferredByModal(false);
                            }}
                            className="p-4 border-b border-gray-100"
                        >
                            <Text className="text-gray-800">{option.name}</Text>
                        </TouchableOpacity>
                    )) || []}
                </ScrollView>
                <TouchableOpacity onPress={() => setShowReferredByModal(false)} className="p-4 border-t border-gray-200">
                    <Text className="text-center text-gray-600">Cancel</Text>
                </TouchableOpacity>
            </CustomModal>

            {/* Relationship Modal */}
            <CustomModal visible={showRelationshipModal} onClose={() => setShowRelationshipModal(false)}>
                <View className="p-4 border-b border-gray-200">
                    <Text className="text-lg font-semibold">Select Relationship</Text>
                </View>
                <ScrollView>
                    {relationshipOptions?.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            onPress={() => {
                                setRelationship(option.name);
                                setShowRelationshipModal(false);
                            }}
                            className="p-4 border-b border-gray-100"
                        >
                            <Text className="text-gray-800">{option.name}</Text>
                        </TouchableOpacity>
                    )) || []}
                </ScrollView>
                <TouchableOpacity onPress={() => setShowRelationshipModal(false)} className="p-4 border-t border-gray-200">
                    <Text className="text-center text-gray-600">Cancel</Text>
                </TouchableOpacity>
            </CustomModal>

            {/* Attach Quotation Modal */}
            <AttachQuotationModal
                visible={showAttachQuotationModal}
                onClose={() => setShowAttachQuotationModal(false)}
                onAttach={handleAttachQuotation}
            />

            {/* Branch Modal */}
            <CustomModal visible={showBranchModal} onClose={() => setShowBranchModal(false)}>
                <View className="p-4 border-b border-gray-200">
                    <Text className="text-lg font-semibold">Select Branch</Text>
                </View>
                <ScrollView>
                    {branches?.map((branch) => (
                        <TouchableOpacity
                            key={branch.id}
                            onPress={() => {
                                setBranch(branch.name);
                                setShowBranchModal(false);
                            }}
                            className="p-4 border-b border-gray-100"
                        >
                            <Text className="text-gray-800">{branch.name}</Text>
                        </TouchableOpacity>
                    )) || []}
                </ScrollView>
                <TouchableOpacity onPress={() => setShowBranchModal(false)} className="p-4 border-t border-gray-200">
                    <Text className="text-center text-gray-600">Cancel</Text>
                </TouchableOpacity>
            </CustomModal>

            {/* Calendar Modal for DOB */}
            <Modal
                visible={showCalendarModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowCalendarModal(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="bg-white rounded-xl p-6 w-11/12 max-w-sm">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-semibold text-gray-800">Select Date of Birth</Text>
                            <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                                <X size={20} color={COLORS.gray[600]} />
                            </TouchableOpacity>
                        </View>
                        
                        {/* Simple Date Selection */}
                        <View className="space-y-4">
                            <View>
                                <Text className="text-sm text-gray-600 mb-2">Year</Text>
                                <TextInput
                                    value={selectedDate.getFullYear().toString()}
                                    onChangeText={(text) => {
                                        const year = parseInt(text) || new Date().getFullYear();
                                        const newDate = new Date(selectedDate);
                                        newDate.setFullYear(year);
                                        setSelectedDate(newDate);
                                    }}
                                    keyboardType="numeric"
                                    className="h-10 border border-gray-300 rounded-lg px-3"
                                    placeholder="YYYY"
                                />
                            </View>
                            
                            <View>
                                <Text className="text-sm text-gray-600 mb-2">Month</Text>
                                <TextInput
                                    value={(selectedDate.getMonth() + 1).toString()}
                                    onChangeText={(text) => {
                                        const month = (parseInt(text) || 1) - 1;
                                        const newDate = new Date(selectedDate);
                                        newDate.setMonth(month);
                                        setSelectedDate(newDate);
                                    }}
                                    keyboardType="numeric"
                                    className="h-10 border border-gray-300 rounded-lg px-3"
                                    placeholder="MM"
                                />
                            </View>
                            
                            <View>
                                <Text className="text-sm text-gray-600 mb-2">Day</Text>
                                <TextInput
                                    value={selectedDate.getDate().toString()}
                                    onChangeText={(text) => {
                                        const day = parseInt(text) || 1;
                                        const newDate = new Date(selectedDate);
                                        newDate.setDate(day);
                                        setSelectedDate(newDate);
                                    }}
                                    keyboardType="numeric"
                                    className="h-10 border border-gray-300 rounded-lg px-3"
                                    placeholder="DD"
                                />
                            </View>
                        </View>
                        
                        <TouchableOpacity 
                            onPress={() => handleDateSelect(selectedDate)}
                            className="mt-6 bg-teal-600 rounded-lg py-3"
                        >
                            <Text className="text-white text-center font-medium">Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}
