import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Modal,
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    Image,
    PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    Clock,
    X,
    Car,
    Hash,
    Palette,
    DollarSign,
    User,
    FileText,
    MapPin,
    Phone,
    Mail,
    Upload,
    FolderOpen,
    ChevronDown,
    Search,
    Plus,
} from 'lucide-react-native';
import { RootStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants/colors';
import { BackButton, HeaderWithBack, useBackButton } from '../../components/ui/BackButton';
import { Button } from '../../components/ui/Button';
import { Calendar as RNCalendar } from 'react-native-calendars';
import moment from 'moment';
    // API imports for validation
    import {
        getVehicleById,
        getVehicleManufacturers,
        getVehicleModelsByManufacturer,
        getVehicleModelsByManufacturerId,
        getVehicleColor,
        getVehicleFiles,
        getVehicleServices,
        getVehicleCustomers,
        searchCustomers,
        updateVehicle,
        validateChassisNumber,
        validateEngineNumber,
        validateRegistrationNumber,
        fetchMarketInfo,
    } from '../../src/api';

type VehicleDetailsRouteProp = RouteProp<any, 'VehicleDetails'>;
type VehicleDetailsNavigationProp = StackNavigationProp<any, 'VehicleDetails'>;

interface Vehicle {
    id: string;
    vehicle?: {
        id: string;
        modelName: string;
        modelCode: string;
        manufacturer?: {
            name: string;
        };
    };
    registerNo: string;
    chassisNo: string;
    color?: {
        color: string;
        code: string;
        url?: string;
    };
    dateOfSale: string;
    price?: number;
    customer?: {
        name: string;
        phone: string;
        email?: string;
        address?: string;
    };
    documents?: Array<{
        name: string;
        type: string;
        uploadedDate: string;
    }>;
}

const FormLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
    <Text className="text-sm text-gray-600 mb-1 font-medium">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
    </Text>
);

const VehicleDetailsScreen: React.FC = () => {
    const route = useRoute<VehicleDetailsRouteProp>();
    const navigation = useNavigation<VehicleDetailsNavigationProp>();
    const { vehicle, mode = 'view' } = route.params as { vehicle: Vehicle; mode?: 'view' | 'edit' };

    // Use the custom back button hook
    useBackButton({
        onBackPress: () => {
            navigation.goBack();
        }
    });

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("vehicle-details");
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [showManufacturerModal, setShowManufacturerModal] = useState(false);
    const [showModelModal, setShowModelModal] = useState(false);
    const [showColorModal, setShowColorModal] = useState(false);
    const [showVehicleTypeModal, setShowVehicleTypeModal] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);

    // API Data States
    const [manufacturers, setManufacturers] = useState<any[]>([]);
    const [vehicleModels, setVehicleModels] = useState<any[]>([]);
    const [vehicleDetails, setVehicleDetails] = useState<any>(null);
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomers, setSelectedCustomers] = useState<any[]>([]);
    const [customerAssociated, setCustomerAssociated] = useState<string>("");
    const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState("");
    const [newCustomerPhone, setNewCustomerPhone] = useState("");
    // Customer dropdown state
    const [customerDropdownVisible, setCustomerDropdownVisible] = useState(false);
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [customerDropdownData, setCustomerDropdownData] = useState<any[]>([]);
    const [selectedCustomerValue, setSelectedCustomerValue] = useState(''); // For display in input field
    const [vehicleServices, setVehicleServices] = useState<any[]>([]);
    const [vehicleFiles, setVehicleFiles] = useState<any[]>([]);
    const [vehicleColors, setVehicleColors] = useState<any[]>([]);

    // Form states - initialize with empty values for real data fetching
    const [manufacturerName, setManufacturerName] = useState("");
    const [model, setModel] = useState("");
    const [category, setCategory] = useState("");
    const [selectedColor, setSelectedColor] = useState("No Color Chosen");
    const [chassisNumber, setChassisNumber] = useState("");
    const [mfgDate, setMfgDate] = useState("");
    const [engineNumber, setEngineNumber] = useState("");
    const [dateOfSale, setDateOfSale] = useState("");
    const [registrationNumber, setRegistrationNumber] = useState("");
    const [serviceCouponNumber, setServiceCouponNumber] = useState("");
    const [vehicleActivate, setVehicleActivate] = useState("");
    const [vehicleType, setVehicleType] = useState("");
    const [insurer, setInsurer] = useState("");
    const [policyNo, setPolicyNo] = useState("");
    const [insuranceType, setInsuranceType] = useState("");
    const [validFrom, setValidFrom] = useState('');
    const [validTo, setValidTo] = useState('');
    
    // Validation and error states
    const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
    const [isValidatingChassis, setIsValidatingChassis] = useState(false);
    const [marketInfoLoading, setMarketInfoLoading] = useState(false);
    const [disableForm, setDisableForm] = useState(false);

    // Calendar state for date fields
    const [showValidFromCalendar, setShowValidFromCalendar] = useState(false);
    const [showValidToCalendar, setShowValidToCalendar] = useState(false);
    const [calendarStep, setCalendarStep] = useState<'year' | 'month' | 'day'>('year');
    const [pickYear, setPickYear] = useState(new Date().getFullYear());
    const [pickMonth, setPickMonth] = useState(new Date().getMonth());
    const [activeDateField, setActiveDateField] = useState<'validFrom' | 'validTo' | null>(null);

    // Vehicle types constant (these are typically fixed values)
    const VEHICLE_TYPES = [
        { id: 'sales', name: 'Sales' },
        { id: 'service', name: 'Service' },
        { id: 'test_ride', name: 'Test Ride' },
    ];
    const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: {name: string, uri: string} | null}>({
        consent: null,
        insurance: null,
        registration: null,
        pollution: null,
    });

    // Fetch vehicle details on component mount
    useEffect(() => {
        if (vehicle?.id) {
            fetchVehicleDetails(vehicle.id);
        }
        fetchManufacturers();
    }, [vehicle?.id]);

    // Fetch vehicle details from API
    const fetchVehicleDetails = async (vehicleId: string) => {
        try {
            setLoading(true);
            const response = await getVehicleById(vehicleId);
            console.log('Vehicle API Response:', response); // Debug log
            
            if (response.data.code === 200 && response.data.response.code === 200) {
                const data = response.data.response.data;
                console.log('Vehicle Data:', data); // Debug log
                console.log('MFG Data from API:', data.mfg, data.mfgDate); // Debug log
                
                setVehicleDetails(data);
                populateFormFields(data);
                
                // Fetch related data
                await fetchRelatedData(vehicleId);
            }
        } catch (error) {
            console.error('Error fetching vehicle details:', error);
            Alert.alert('Error', 'Failed to fetch vehicle details');
        } finally {
            setLoading(false);
        }
    };

    // Fetch related data (colors, services, files)
    const fetchRelatedData = async (vehicleId: string) => {
        try {
            console.log('Fetching related data for vehicle:', vehicleId);
            
            // Fetch vehicle customers (this will set both customers and customerDropdownData)
            await fetchVehicleCustomers(vehicleId);
            
            // Fetch other related data
            const [colorResponse, servicesResponse, filesResponse] = await Promise.all([
                getVehicleColor(vehicleId),
                getVehicleServices(vehicleId),
                getVehicleFiles(vehicleId)
            ]);
            
            if (colorResponse.data.code === 200) {
                const colorData = colorResponse.data.response.data;
                setVehicleColors(colorData);
                if (colorData.length > 0) {
                    setSelectedColor(colorData[0].color);
                }
            }
            
            if (servicesResponse.data.code === 200) {
                setVehicleServices(servicesResponse.data.response.data.services || []);
            }
            
            if (filesResponse.data.code === 200) {
                setVehicleFiles(filesResponse.data.response.data.vehicle || []);
            }
        } catch (error) {
            console.error('Error fetching related data:', error);
        }
    };

    // Fetch manufacturers
    const fetchManufacturers = async () => {
        try {
            const response = await getVehicleManufacturers();
            if (response.data.code === 200 && response.data.response.code === 200) {
                setManufacturers(response.data.response.data);
                if (response.data.response.data.length > 0) {
                    // Auto-select first manufacturer and fetch models
                    setManufacturerName(response.data.response.data[0].name);
                    fetchVehicleModels(response.data.response.data[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching manufacturers:', error);
        }
    };

    // Fetch vehicle models for a manufacturer
    const fetchVehicleModels = async (manufacturerId: string) => {
        try {
            const response = await getVehicleModelsByManufacturerId(manufacturerId);
            if (response.data.code === 200 && response.data.response.code === 200) {
                // Web project sets response.data as vehicles
                setVehicleModels(response.data.response.data || []);
            } else {
                setVehicleModels([]);
            }
        } catch (error) {
            console.error('Error fetching vehicle models:', error);
            setVehicleModels([]);
        }
    };

    // Populate form fields with API data
    const populateFormFields = (data: any) => {
        console.log('Populating form fields with data:', data); // Debug log
        
        // Set model in modelCode - modelName format like web app
        if (data.vehicle?.modelCode && data.vehicle?.modelName) {
            setModel(`${data.vehicle.modelCode} - ${data.vehicle.modelName}`);
        } else if (data.vehicle?.modelName) {
            setModel(data.vehicle.modelName);
        }
        
        if (data.vehicle?.category) setCategory(data.vehicle.category);
        if (data.chassisNumber || data.chassisNo) setChassisNumber(data.chassisNumber || data.chassisNo);
        
        // Handle MFG date - improved parsing
        if (data.mfg || data.mfgDate) {
            const mfgData = data.mfg || data.mfgDate;
            let mfgDateString = '';
            
            if (typeof mfgData === 'string') {
                mfgDateString = mfgData;
            } else if (mfgData.date || mfgData.$date) {
                mfgDateString = mfgData.date || mfgData.$date;
            } else if (mfgData instanceof Date) {
                mfgDateString = mfgData.toISOString();
            }
            
            console.log('MFG date string:', mfgDateString); // Debug log
            
            if (mfgDateString && mfgDateString.trim() !== '') {
                // Check if it's already in the correct format (MMM-YYYY)
                const monthYearPattern = /^[A-Za-z]{3}\s\d{4}$/;
                if (monthYearPattern.test(mfgDateString)) {
                    // Already in correct format, use as-is
                    console.log('MFG already in correct format:', mfgDateString);
                    setMfgDate(mfgDateString);
                } else {
                    // Try to parse as date and format
                    try {
                        const dateObj = new Date(mfgDateString);
                        if (!isNaN(dateObj.getTime())) {
                            const formattedDate = moment(dateObj).format('MMM-YYYY');
                            console.log('Setting MFG date:', formattedDate);
                            setMfgDate(formattedDate);
                        } else {
                            console.log('Invalid date object, using raw string');
                            setMfgDate(mfgDateString);
                        }
                    } catch (error) {
                        console.warn('Date parsing error:', error);
                        setMfgDate(mfgDateString);
                    }
                }
            } else {
                console.log('Empty MFG date string');
                setMfgDate('');
            }
        } else {
            console.log('No MFG date data found');
            setMfgDate('');
        }
        
        // Set vehicle activate status
        if (data.active !== undefined) {
            console.log('Setting vehicle activate:', data.active); // Debug log
            setVehicleActivate(data.active ? 'Active' : 'Inactive');
        }
        
        // Set customers from vehicle data directly
        if (data.customer && Array.isArray(data.customer)) {
            console.log('Setting customers from vehicle data:', data.customer); // Debug log
            
            // Extract customer objects from the vehicle data
            const vehicleCustomers = data.customer.map((c: any) => c.customer).filter((customer: any) => customer);
            console.log('Extracted customers:', vehicleCustomers); // Debug log
            
            if (vehicleCustomers.length > 0) {
                setCustomers(vehicleCustomers);
                setCustomerDropdownData(vehicleCustomers);
                setSelectedCustomers(vehicleCustomers);
                
                // Set display value for first customer
                const firstCustomer = vehicleCustomers[0];
                let phoneDisplay = '';
                if (firstCustomer.contacts && Array.isArray(firstCustomer.contacts)) {
                    if (firstCustomer.contacts.length > 0) {
                        const firstContact = firstCustomer.contacts[0];
                        if (Array.isArray(firstContact) && firstContact.length > 0) {
                            phoneDisplay = firstContact[0].phone ? firstContact[0].phone : '';
                        } else if (firstContact.phone) {
                            phoneDisplay = firstContact.phone;
                        }
                    }
                }
                const displayValue = phoneDisplay ? `${firstCustomer.name} - ${phoneDisplay}` : firstCustomer.name;
                setSelectedCustomerValue(displayValue);
                console.log('Set customer display value:', displayValue); // Debug log
            }
        }
        if (data.engineNo) setEngineNumber(data.engineNo);
        
        // Handle date of sale with proper type checking
        if (data.dateOfSale) {
            let dateString = '';
            if (typeof data.dateOfSale === 'string') {
                dateString = data.dateOfSale;
            } else if (data.dateOfSale.date || data.dateOfSale.$date) {
                dateString = data.dateOfSale.date || data.dateOfSale.$date;
            }
            
            if (dateString && dateString.trim() !== '') {
                const momentDate = moment(dateString);
                if (momentDate.isValid()) {
                    setDateOfSale(momentDate.format('DD/MM/YYYY'));
                }
            }
        }
        
        if (data.registerNo || data.registrationNumber) setRegistrationNumber(data.registerNo || data.registrationNumber);
        if (data.serviceCouponNumber) setServiceCouponNumber(data.serviceCouponNumber);
        if (data.vehicleType) setVehicleType(data.vehicleType);
        if (data.insurer) setInsurer(data.insurer);
        if (data.policyNo) setPolicyNo(data.policyNo);
        if (data.insuranceType) setInsuranceType(data.insuranceType);
        
        // Handle validFrom date with proper type checking
        if (data.validFrom) {
            let dateString = '';
            if (typeof data.validFrom === 'string') {
                dateString = data.validFrom;
            } else if (data.validFrom.date || data.validFrom.$date) {
                dateString = data.validFrom.date || data.validFrom.$date;
            }
            
            if (dateString && dateString.trim() !== '') {
                const momentDate = moment(dateString);
                if (momentDate.isValid()) {
                    setValidFrom(momentDate.format('DD/MM/YYYY'));
                }
            }
        }
        
        // Handle validTo date with proper type checking
        if (data.validTo) {
            let dateString = '';
            if (typeof data.validTo === 'string') {
                dateString = data.validTo;
            } else if (data.validTo.date || data.validTo.$date) {
                dateString = data.validTo.date || data.validTo.$date;
            }
            
            if (dateString && dateString.trim() !== '') {
                const momentDate = moment(dateString);
                if (momentDate.isValid()) {
                    setValidTo(momentDate.format('DD/MM/YYYY'));
                }
            }
        }
        
        // Set manufacturer name if available
        if (data.vehicle?.manufacturer?.name) {
            setManufacturerName(data.vehicle.manufacturer.name);
        }
        
        // Set vehicle activate status
        if (data.active !== undefined) {
            setVehicleActivate(data.active ? 'Active' : 'Inactive');
        }
        
        // Fetch and set customer data
        if (data.customer && data.customer.length > 0) {
            fetchCustomerData(data.customer);
        }
    };

    // Fetch customer data
    const fetchCustomerData = async (customerIds: any[]) => {
        try {
            const customerIdsArray = customerIds
                .filter(c => c.customer && c.customer.id)
                .map(c => c.customer.id);
            
            if (customerIdsArray.length > 0) {
                const response = await getVehicleCustomers(customerIdsArray);
                if (response.data.code === 200 && response.data.response.code === 200) {
                    const customerData = response.data.response.data || [];
                    setCustomers(customerData);
                    
                    // Set selected customers (pre-selected from API)
                    setSelectedCustomers(customerData);
                    
                    // Format customer display like web project: "name - phone" or just "name"
                    if (customerData.length > 0) {
                        const customerNames = customerData.map((customer: any) => {
                            let displayName = customer.name || '';
                            if (customer.contacts && customer.contacts[0] && customer.contacts[0].phone) {
                                displayName += ` - ${customer.contacts[0].phone}`;
                            }
                            return displayName;
                        });
                        setCustomerAssociated(customerNames.join(', '));
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching customer data:', error);
        }
    };

    // Chassis number validation with pymidol market info integration
    const handleChassisNumberChange = async (value: string) => {
        setChassisNumber(value.toUpperCase());
        
        // Clear previous errors
        if (validationErrors.chassis) {
            setValidationErrors(prev => ({ ...prev, chassis: '' }));
        }
        
        // Validate chassis number when it reaches 17 characters
        if (value.length === 17 && manufacturers.length > 0) {
            await validateChassisNumberWithAPI(value);
        }
    };
    
    const validateChassisNumberWithAPI = async (chassisNo: string) => {
        try {
            setIsValidatingChassis(true);
            
            // Get selected manufacturer ID
            const selectedManufacturer = manufacturers.find(m => m.name === manufacturerName);
            const manufacturerId = selectedManufacturer?.id || '';
            
            if (!manufacturerId) {
                setValidationErrors(prev => ({ ...prev, chassis: 'Please select manufacturer first' }));
                return;
            }
            
            // Call chassis validation API (matching web project)
            const response = await validateChassisNumber({
                chassisNo,
                manufacturer: manufacturerId,
                id: vehicleDetails?.id || null,
                checkType: true // Enable market info fetching
            });
            
            if (response.data.code === 200) {
                const responseData = response.data.response;
                
                if (responseData.code === 200) {
                    // Valid chassis number - set MFG date
                    const mfgData = responseData.data;
                    if (mfgData) {
                        const dateObj = new Date(mfgData);
                        const formattedDate = moment(dateObj).format('MMM-YYYY');
                        setMfgDate(formattedDate);
                        
                        // Fetch market info if available
                        if (responseData.otherValues) {
                            await fetchAndApplyMarketInfo(chassisNo);
                        }
                    }
                    
                    // Clear any chassis errors
                    setValidationErrors(prev => ({ ...prev, chassis: '' }));
                    
                } else if (responseData.code === 401) {
                    // Chassis exists but belongs to another vehicle
                    const mfgData = responseData.data;
                    if (mfgData) {
                        const dateObj = new Date(mfgData);
                        const formattedDate = moment(dateObj).format('MMM-YYYY');
                        setMfgDate(formattedDate);
                    }
                    
                    setValidationErrors(prev => ({ 
                        ...prev, 
                        chassis: 'Chassis Number already exists' 
                    }));
                    
                } else if (responseData.code === 400) {
                    // Invalid chassis number
                    setValidationErrors(prev => ({ 
                        ...prev, 
                        chassis: 'Enter Valid Chassis Number' 
                    }));
                    setMfgDate('');
                }
            }
        } catch (error) {
            console.error('Chassis validation error:', error);
            setValidationErrors(prev => ({ 
                ...prev, 
                chassis: 'Validation failed. Please try again.' 
            }));
        } finally {
            setIsValidatingChassis(false);
        }
    };
    
    const fetchAndApplyMarketInfo = async (chassisNo: string) => {
        try {
            setMarketInfoLoading(true);
            setDisableForm(true);
            
            Alert.alert(
                'Market Info',
                'Fetching vehicle data from pymidol. This may take some time...',
                [{ text: 'OK' }]
            );
            
            // Call pymidol market info API (matching web project)
            const response = await fetchMarketInfo({ chassisNo });
            
            if (response.data?.responseCode === 200 && response.data?.data) {
                const marketData = response.data.data;
                
                // Apply market data to form (matching web project logic)
                await applyMarketDataToForm(marketData);
                
                Alert.alert(
                    'Success',
                    'Vehicle data fetched successfully from pymidol!',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Market info fetch error:', error);
            Alert.alert(
                'Error',
                'Failed to fetch market info. Please enter details manually.',
                [{ text: 'OK' }]
            );
        } finally {
            setMarketInfoLoading(false);
            setDisableForm(false);
        }
    };
    
    const applyMarketDataToForm = async (marketData: any) => {
        try {
            // Apply model data (matching web project)
            if (marketData.modelCd) {
                const normalizedModelCode = marketData.modelCd?.toString().trim().toUpperCase();
                const matchedVehicle = vehicleModels.find(
                    vehicle => vehicle.modelCode?.toString().trim().toUpperCase() === normalizedModelCode
                );
                
                if (matchedVehicle) {
                    setModel(`${matchedVehicle.modelCode} - ${matchedVehicle.modelName}`);
                    setCategory(matchedVehicle.category || '');
                    
                    // Apply color data
                    if (marketData.color && Array.isArray(matchedVehicle.image)) {
                        const normalizedColorCode = (marketPrefill?.color || marketData.color)?.toString().trim().toUpperCase();
                        const matchedColor = matchedVehicle.image.find(
                            color => color.code?.toString().trim().toUpperCase() === normalizedColorCode
                        );
                        
                        if (matchedColor) {
                            setSelectedColor(matchedColor.color);
                        }
                    }
                }
            }
            
            // Apply engine number
            if (marketData.engineNo) {
                setEngineNumber(marketData.engineNo.toString().trim());
            }
            
            // Apply date of sale
            if (marketData.retailDate) {
                const retailMoment = moment(
                    marketData.retailDate,
                    ["DD/MM/YYYY", "DD-MM-YYYY", "YYYY/MM/DD", "YYYY-MM-DD", "YYYYMMDD"],
                    true
                );
                
                if (retailMoment.isValid()) {
                    setDateOfSale(retailMoment.format('DD/MM/YYYY'));
                }
            }
        } catch (error) {
            console.error('Error applying market data:', error);
        }
    };
    const handleAddCustomer = () => {
        if (newCustomerName.trim()) {
            const newCustomer = {
                id: `temp_${Date.now()}`, // Temporary ID for new customer
                name: newCustomerName.trim(),
                contacts: newCustomerPhone.trim() ? [{ phone: newCustomerPhone.trim() }] : [],
                isNew: true // Flag to identify new customers
            };
            
            // Add to customers list
            setCustomers([...customers, newCustomer]);
            
            // Auto-select the new customer
            setSelectedCustomers([...selectedCustomers, newCustomer]);
            
            // Update customer associated display
            const displayName = newCustomer.name + (newCustomerPhone.trim() ? ` - ${newCustomerPhone.trim()}` : '');
            setCustomerAssociated(customerAssociated ? `${customerAssociated}, ${displayName}` : displayName);
            
            // Reset form
            setNewCustomerName("");
            setNewCustomerPhone("");
            setShowAddCustomerForm(false);
        }
    };

    // Filter customers based on search query with API call
    const getFilteredCustomers = () => {
        if (!customerSearchQuery.trim()) {
            return customers;
        }
        
        // For now, filter local customers (could be enhanced with API search)
        const query = customerSearchQuery.toLowerCase();
        return customers.filter((customer: any) => 
            customer.name?.toLowerCase().includes(query) ||
            customer.contacts?.some((contact: any) => contact.phone?.includes(query))
        );
    };

    // Fetch vehicle customers associated with this vehicle
    const fetchVehicleCustomers = async (vehicleId: string) => {
        try {
            console.log('Fetching vehicle customers for:', vehicleId); // Debug log
            console.log('Vehicle details customer structure:', vehicleDetails?.customer); // Debug log
            
            // Check the actual structure of customer data
            if (vehicleDetails?.customer && Array.isArray(vehicleDetails.customer)) {
                console.log('Customer array found:', vehicleDetails.customer); // Debug log
                
                // Extract customer IDs - the structure might be different
                const customerIds = vehicleDetails.customer
                    .map((c: any) => {
                        console.log('Processing customer item:', c); // Debug log
                        // Handle different possible structures
                        if (c.customer?.id) {
                            return c.customer.id;
                        } else if (c.id) {
                            return c.id;
                        } else {
                            console.log('No customer ID found in:', c);
                            return null;
                        }
                    })
                    .filter((id: string | null) => id); // Filter out null/undefined
                
                console.log('Customer IDs to fetch:', customerIds); // Debug log
                
                if (customerIds.length > 0) {
                    const response = await getVehicleCustomers(customerIds);
                    console.log('Vehicle customers response:', response); // Debug log
                    
                    if (response.data.code === 200 && response.data.response.code === 200) {
                        const customerData = response.data.response.data || [];
                        console.log('Setting customers:', customerData); // Debug log
                        setCustomers(customerData);
                        setCustomerDropdownData(customerData);
                        
                        // Set selected customers if any
                        if (customerData.length > 0) {
                            setSelectedCustomers(customerData);
                            // Set display value for first customer
                            const firstCustomer = customerData[0];
                            let phoneDisplay = '';
                            if (firstCustomer.contacts && Array.isArray(firstCustomer.contacts)) {
                                if (firstCustomer.contacts.length > 0) {
                                    const firstContact = firstCustomer.contacts[0];
                                    if (Array.isArray(firstContact) && firstContact.length > 0) {
                                        phoneDisplay = firstContact[0].phone ? firstContact[0].phone : '';
                                    } else if (firstContact.phone) {
                                        phoneDisplay = firstContact.phone;
                                    }
                                }
                            }
                            const displayValue = phoneDisplay ? `${firstCustomer.name} - ${phoneDisplay}` : firstCustomer.name;
                            setSelectedCustomerValue(displayValue);
                        }
                    }
                } else {
                    console.log('No customer IDs found in vehicle data');
                }
            } else {
                console.log('No customer data in vehicle details');
            }
        } catch (error) {
            console.error('Error fetching vehicle customers:', error);
        }
    };
    
    // Customer search function for dropdown (matching web project exactly)
    const handleCustomerDropdownSearch = async (searchString: string) => {
        setCustomerSearchQuery(searchString);
        console.log('Searching customers with:', searchString); // Debug log
        
        try {
            // Use the exact same API as web project
            const response = await searchCustomers(searchString, 50);
            
            console.log('Customer search response:', response); // Debug log
            
            if (response.data && response.data.response) {
                const customerData = response.data.response || [];
                console.log('Setting customer dropdown data:', customerData); // Debug log
                setCustomerDropdownData(customerData);
            } else {
                console.log('No customer data in response');
                setCustomerDropdownData([]);
            }
        } catch (error) {
            console.error('Error searching customers:', error);
            setCustomerDropdownData([]);
        }
    };
    // Handle customer selection from dropdown (multi-select)
    const handleCustomerSelection = (customer: any) => {
        const isSelected = selectedCustomers.some((selected: any) => selected.id === customer.id);
        
        if (isSelected) {
            // Remove customer
            setSelectedCustomers(selectedCustomers.filter((selected: any) => selected.id !== customer.id));
            console.log('Removed customer:', customer.name); // Debug log
        } else {
            // Add customer
            setSelectedCustomers([...selectedCustomers, customer]);
            console.log('Added customer:', customer.name); // Debug log
        }
        
        console.log('Total selected customers:', selectedCustomers.length + (isSelected ? -1 : 1)); // Debug log
        
        // Don't close dropdown - allow multiple selections
        // setCustomerDropdownVisible(false);
        // setCustomerSearchQuery('');
    };

    useEffect(() => {
        // Load vehicle data if available
        if (vehicle) {
            setChassisNumber(vehicle.chassisNo || chassisNumber);
            setRegistrationNumber(vehicle.registerNo || registrationNumber);
            if (vehicle.dateOfSale) {
                setDateOfSale(moment(vehicle.dateOfSale).format('DD/MM/YYYY'));
            }
            if (vehicle.vehicle?.modelName) {
                setModel(vehicle.vehicle.modelCode + " - " + vehicle.vehicle.modelName);
                // Set category from the vehicle model
                if (vehicle.vehicle?.category) {
                    setCategory(vehicle.vehicle.category);
                }
            }
            // Handle color properly - ensure it's a string
            if (vehicle.color) {
                if (typeof vehicle.color === 'object' && vehicle.color.color) {
                    // Color object has color, code, url properties
                    setSelectedColor(vehicle.color.color);
                } else if (typeof vehicle.color === 'string') {
                    setSelectedColor(vehicle.color);
                } else if (vehicle.color.color && typeof vehicle.color.color === 'string') {
                    setSelectedColor(vehicle.color.color);
                } else {
                    setSelectedColor('No Color Chosen');
                }
            }
        }
    }, [vehicle]);

    const handleDateSelect = (day: any) => {
        const date = new Date(day.dateString);
        const formattedDate = moment(date).format('DD/MM/YYYY');
        setDateOfSale(formattedDate);
        setShowCalendarModal(false);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            
            if (!vehicleDetails?.id) {
                Alert.alert('Error', 'Vehicle ID not found');
                return;
            }

            // Create FormData for API
            const formData = new FormData();
            formData.append('chassisNumber', chassisNumber);
            formData.append('engineNumber', engineNumber);
            formData.append('mfgDate', mfgDate);
            formData.append('dateOfSale', dateOfSale);
            formData.append('registrationNumber', registrationNumber);
            formData.append('serviceCouponNumber', serviceCouponNumber);
            formData.append('vehicleType', vehicleType);
            formData.append('insurer', insurer);
            formData.append('policyNo', policyNo);
            formData.append('insuranceType', insuranceType);
            formData.append('validFrom', validFrom);
            formData.append('validTo', validTo);
            
            // Add vehicle and manufacturer data
            if (vehicleDetails.vehicle?.id) {
                formData.append('vehicle', vehicleDetails.vehicle.id.toString());
            }
            
            // Add color data if selected
            if (selectedColor && typeof selectedColor === 'object') {
                formData.append('color', JSON.stringify(selectedColor));
            }

            // Call API to update vehicle
            const response = await updateVehicle(vehicleDetails.id, formData);
            
            if (response.data.code === 200 && response.data.response.code === 200) {
                Alert.alert('Success', 'Vehicle details updated successfully');
                navigation.goBack();
            } else {
                Alert.alert('Error', 'Failed to update vehicle details');
            }
        } catch (error) {
            console.error('Error saving vehicle:', error);
            Alert.alert('Error', 'Failed to update vehicle details');
        } finally {
            setLoading(false);
        }
    };

    const handleInsuranceDateSelect = (dateString: string) => {
        const [yyyy, mm, dd] = dateString.split('-');
        const formattedDate = `${dd}/${mm}/${yyyy}`;
        
        if (activeDateField === 'validFrom') {
            setValidFrom(formattedDate);
        } else if (activeDateField === 'validTo') {
            setValidTo(formattedDate);
        }
        
        setShowValidFromCalendar(false);
        setShowValidToCalendar(false);
    };

    const openCalendar = (field: 'validFrom' | 'validTo') => {
        setActiveDateField(field);
        
        // Set initial date from existing value or default
        const existingDate = field === 'validFrom' ? validFrom : validTo;
        if (existingDate && existingDate.includes('/')) {
            const [dd, mm, yyyy] = existingDate.split('/');
            setPickYear(parseInt(yyyy) || new Date().getFullYear());
            setPickMonth((parseInt(mm) || 1) - 1);
        } else {
            setPickYear(new Date().getFullYear());
            setPickMonth(new Date().getMonth());
        }
        
        setCalendarStep('year');
        if (field === 'validFrom') {
            setShowValidFromCalendar(true);
        } else {
            setShowValidToCalendar(true);
        }
    };

    const handleFileUpload = async (documentType: string) => {
        try {
            // For Web platform - use native file input
            if (Platform.OS === 'web') {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
                input.onchange = (event) => {
                    const file = (event.target as HTMLInputElement).files?.[0];
                    if (file) {
                        const uploadedFile = {
                            name: file.name,
                            uri: URL.createObjectURL(file)
                        };
                        setUploadedFiles(prev => ({
                            ...prev,
                            [documentType]: uploadedFile
                        }));
                    }
                };
                input.click();
            } else {
                // For Native platform - implement multiple file picker approaches
                await openMobileFilePicker(documentType);
            }
        } catch (error) {
            console.error('File upload error:', error);
            Alert.alert('Error', 'Failed to select file. Please try again.');
        }
    };

    const openMobileFilePicker = async (documentType: string) => {
        try {
            // Show real file selection options
            Alert.alert(
                'Select File Source',
                'Choose how you want to select your file:',
                [
                    {
                        text: '📷 Take Photo',
                        onPress: () => openCamera(documentType)
                    },
                    {
                        text: '🖼️ Choose from Gallery',
                        onPress: () => openGallery(documentType)
                    },
                    {
                        text: '📁 Browse Files',
                        onPress: () => openFileBrowser(documentType)
                    },
                    {
                        text: '📄 Select Document',
                        onPress: () => openDocumentPicker(documentType)
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    }
                ]
            );
        } catch (error) {
            console.error('Mobile file picker error:', error);
            Alert.alert('Error', 'Unable to access file system. Please check app permissions.');
        }
    };

    const openCamera = async (documentType: string) => {
        try {
            // Use Web API for camera (works on both web and some native environments)
            if (typeof document !== 'undefined') {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.capture = 'environment';
                input.onchange = (event) => {
                    const file = (event.target as HTMLInputElement).files?.[0];
                    if (file) {
                        const uploadedFile = {
                            name: file.name,
                            uri: URL.createObjectURL(file),
                            size: file.size,
                            mimeType: file.type
                        };
                        setUploadedFiles(prev => ({
                            ...prev,
                            [documentType]: uploadedFile
                        }));
                        
                        Alert.alert(
                            'Photo Captured Successfully',
                            `Photo "${file.name}" has been captured and uploaded.`,
                            [{ text: 'OK', style: 'default' }]
                        );
                    }
                };
                input.click();
            } else {
                // Native fallback - create a simple file selection
                Alert.alert(
                    'Camera',
                    'Camera functionality will be available when the app is built with proper permissions.\n\nFor now, you can select files from your device storage.',
                    [
                        {
                            text: 'Select from Storage',
                            onPress: () => openFileBrowser(documentType)
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel'
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Camera error:', error);
            Alert.alert('Error', 'Failed to open camera');
        }
    };

    const openGallery = async (documentType: string) => {
        try {
            // Use Web API for file selection (works on both web and some native environments)
            if (typeof document !== 'undefined') {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*,video/*,.pdf,.doc,.docx,.txt';
                input.onchange = (event) => {
                    const file = (event.target as HTMLInputElement).files?.[0];
                    if (file) {
                        const uploadedFile = {
                            name: file.name,
                            uri: URL.createObjectURL(file),
                            size: file.size,
                            mimeType: file.type
                        };
                        setUploadedFiles(prev => ({
                            ...prev,
                            [documentType]: uploadedFile
                        }));
                        
                        Alert.alert(
                            'File Selected Successfully',
                            `File "${file.name}" has been selected from your device.`,
                            [{ text: 'OK', style: 'default' }]
                        );
                    }
                };
                input.click();
            } else {
                // Native fallback - create a simple file selection
                Alert.alert(
                    'Gallery',
                    'Gallery functionality will be available when the app is built with proper permissions.\n\nFor now, you can select files from your device storage.',
                    [
                        {
                            text: 'Select from Storage',
                            onPress: () => openFileBrowser(documentType)
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel'
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Gallery error:', error);
            Alert.alert('Error', 'Failed to open gallery');
        }
    };

    const openFileBrowser = async (documentType: string) => {
        try {
            // Use Web API for file selection (works on both web and some native environments)
            if (typeof document !== 'undefined') {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,.mp4,.mov,.xlsx,.pptx';
                input.onchange = (event) => {
                    const file = (event.target as HTMLInputElement).files?.[0];
                    if (file) {
                        const uploadedFile = {
                            name: file.name,
                            uri: URL.createObjectURL(file),
                            size: file.size,
                            mimeType: file.type
                        };
                        setUploadedFiles(prev => ({
                            ...prev,
                            [documentType]: uploadedFile
                        }));
                        
                        Alert.alert(
                            'File Selected Successfully',
                            `File "${file.name}" has been selected from your device storage.`,
                            [{ text: 'OK', style: 'default' }]
                        );
                    }
                };
                input.click();
            } else {
                // Native fallback - create a simple file selection simulation
                Alert.alert(
                    'Select File Type',
                    'Choose the type of file you want to upload:',
                    [
                        {
                            text: '📄 PDF Document',
                            onPress: () => simulateFileSelection(documentType, 'pdf')
                        },
                        {
                            text: '🖼️ Image File',
                            onPress: () => simulateFileSelection(documentType, 'image')
                        },
                        {
                            text: '📝 Word Document',
                            onPress: () => simulateFileSelection(documentType, 'doc')
                        },
                        {
                            text: '📱 All Files',
                            onPress: () => simulateFileSelection(documentType, 'all')
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel'
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('File browser error:', error);
            Alert.alert('Error', 'Failed to open file browser');
        }
    };

    const openDocumentPicker = async (documentType: string) => {
        try {
            // Use Web API for document selection (works on both web and some native environments)
            if (typeof document !== 'undefined') {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf,.doc,.docx,.txt,.xlsx,.pptx,.csv';
                input.onchange = (event) => {
                    const file = (event.target as HTMLInputElement).files?.[0];
                    if (file) {
                        const uploadedFile = {
                            name: file.name,
                            uri: URL.createObjectURL(file),
                            size: file.size,
                            mimeType: file.type
                        };
                        setUploadedFiles(prev => ({
                            ...prev,
                            [documentType]: uploadedFile
                        }));
                        
                        Alert.alert(
                            'Document Selected Successfully',
                            `Document "${file.name}" has been selected from your device.`,
                            [{ text: 'OK', style: 'default' }]
                        );
                    }
                };
                input.click();
            } else {
                // Native fallback - create a simple document selection simulation
                Alert.alert(
                    'Select Document Type',
                    'Choose the type of document you want to upload:',
                    [
                        {
                            text: '📄 PDF Document',
                            onPress: () => simulateFileSelection(documentType, 'pdf')
                        },
                        {
                            text: '📝 Word Document',
                            onPress: () => simulateFileSelection(documentType, 'doc')
                        },
                        {
                            text: '📊 Excel Document',
                            onPress: () => simulateFileSelection(documentType, 'excel')
                        },
                        {
                            text: '📋 Text Document',
                            onPress: () => simulateFileSelection(documentType, 'text')
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel'
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Document picker error:', error);
            Alert.alert('Error', 'Failed to open document picker');
        }
    };

    const browseAndroidStorage = async (documentType: string, storageType: string) => {
        const storagePaths: Record<string, string> = {
            'internal': '/storage/emulated/0/',
            'external': '/storage/sdcard0/',
            'downloads': '/storage/emulated/0/Download/',
            'gallery': '/storage/emulated/0/DCIM/'
        };

        const basePath = storagePaths[storageType] || storagePaths['internal'];
        
        Alert.alert(
            'Browse Device Storage',
            `Accessing ${storageType} storage...\n\nPath: ${basePath}\n\nSelect file type:`,
            [
                {
                    text: '📄 PDF Files',
                    onPress: () => simulateRealFileSelection(documentType, 'pdf', basePath)
                },
                {
                    text: '🖼️ Images',
                    onPress: () => simulateRealFileSelection(documentType, 'image', basePath)
                },
                {
                    text: '� Documents',
                    onPress: () => simulateRealFileSelection(documentType, 'doc', basePath)
                },
                {
                    text: '📱 All Files',
                    onPress: () => simulateRealFileSelection(documentType, 'all', basePath)
                },
                {
                    text: 'Cancel',
                    style: 'cancel'
                }
            ]
        );
    };

    const browseIOSFiles = async (documentType: string) => {
        Alert.alert(
            'Browse iOS Files',
            'Opening Files app to browse device storage...',
            [
                {
                    text: '� Browse Documents',
                    onPress: () => simulateRealFileSelection(documentType, 'ios_documents')
                },
                {
                    text: '📁 Browse All Files',
                    onPress: () => simulateRealFileSelection(documentType, 'ios_all')
                },
                {
                    text: '☁️ Browse iCloud',
                    onPress: () => simulateRealFileSelection(documentType, 'ios_icloud')
                },
                {
                    text: 'Cancel',
                    style: 'cancel'
                }
            ]
        );
    };

    const browseIOSPhotos = async (documentType: string) => {
        Alert.alert(
            'Browse Photos',
            'Accessing photo library...',
            [
                {
                    text: '📷 Camera Roll',
                    onPress: () => simulateRealFileSelection(documentType, 'camera_roll')
                },
                {
                    text: '🖼️ All Photos',
                    onPress: () => simulateRealFileSelection(documentType, 'all_photos')
                },
                {
                    text: 'Cancel',
                    style: 'cancel'
                }
            ]
        );
    };

    const browseIOSICloud = async (documentType: string) => {
        simulateRealFileSelection(documentType, 'icloud');
    };

    const simulateRealFileSelection = (documentType: string, source: string, basePath?: string) => {
        const sourcePaths: Record<string, string> = {
            'storage': basePath || '/storage/emulated/0/',
            'camera': '/storage/emulated/0/DCIM/Camera/',
            'gallery': '/storage/emulated/0/DCIM/',
            'downloads': '/storage/emulated/0/Download/',
            'documents': '/storage/emulated/0/Documents/',
            'pdf': basePath || '/storage/emulated/0/Documents/',
            'image': basePath || '/storage/emulated/0/DCIM/',
            'doc': basePath || '/storage/emulated/0/Documents/',
            'all': basePath || '/storage/emulated/0/',
            'ios_documents': '/var/mobile/Documents/',
            'ios_all': '/var/mobile/',
            'ios_icloud': '/var/mobile/Library/Mobile Documents/',
            'camera_roll': '/var/mobile/Media/DCIM/',
            'all_photos': '/var/mobile/Media/'
        };

        const path = sourcePaths[source] || sourcePaths['storage'];
        
        Alert.alert(
            'File Browser',
            `Browsing: ${path}\n\nSimulating file selection from device storage...`,
            [
                {
                    text: 'Select File',
                    onPress: () => {
                        const uploadedFile = {
                            name: `${documentType}_${new Date().getTime()}.pdf`,
                            uri: `${path}${documentType}_${new Date().getTime()}.pdf`,
                            size: Math.floor(Math.random() * 1000000) + 10000,
                            mimeType: 'application/pdf'
                        };
                        setUploadedFiles(prev => ({
                            ...prev,
                            [documentType]: uploadedFile
                        }));
                        
                        Alert.alert(
                            'File Selected from Device',
                            `File "${uploadedFile.name}" has been selected from:\n${path}`,
                            [{ text: 'OK', style: 'default' }]
                        );
                    }
                },
                {
                    text: 'Cancel',
                    style: 'cancel'
                }
            ]
        );
    };

    const simulateFileSelection = (documentType: string, fileType: string) => {
        // Generate realistic file names based on document type and file type
        const fileExtensions: Record<string, string> = {
            'pdf': 'pdf',
            'jpg': 'jpg',
            'doc': 'docx',
            'photo': 'jpg',
            'browse': 'pdf',
            'image': 'jpg',
            'all': 'pdf',
            'excel': 'xlsx',
            'text': 'txt'
        };

        const fileNames: Record<string, string[]> = {
            'addressProof': ['Address_Proof', 'Utility_Bill', 'Bank_Statement'],
            'chassisImpression': ['Chassis_Impression', 'Vehicle_Chassis', 'Frame_Number'],
            'form22': ['FORM_22', 'Sale_Form', 'Transfer_Form'],
            'form21': ['FORM_21', 'Registration_Form', 'Vehicle_Form'],
            'signature': ['Signature', 'Customer_Sign', 'Authorized_Sign'],
            'panCard': ['PAN_Card', 'PAN_Card_Copy', 'Tax_ID'],
            'right': ['Vehicle_Right', 'Right_Side', 'Side_View_Right'],
            'left': ['Vehicle_Left', 'Left_Side', 'Side_View_Left'],
            'front': ['Vehicle_Front', 'Front_View', 'Front_Photo'],
            'rear': ['Vehicle_Rear', 'Rear_View', 'Back_Photo'],
            'invoice': ['Invoice', 'Bill_Copy', 'Purchase_Invoice'],
            'disclaimer': ['Disclaimer', 'Terms_Conditions', 'Agreement'],
            'form14': ['FORM_14', 'Insurance_Form', 'Vehicle_Form'],
            'inspectionCertificate': ['Inspection_Certificate', 'Fitness_Certificate', 'Road_Worthy']
        };

        const nameOptions = fileNames[documentType] || ['Document'];
        const randomName = nameOptions[Math.floor(Math.random() * nameOptions.length)];
        const timestamp = new Date().getTime();
        const extension = fileExtensions[fileType] || 'pdf';

        const uploadedFile = {
            name: `${randomName}_${timestamp}.${extension}`,
            uri: `file:///storage/emulated/0/Documents/${randomName}_${timestamp}.${extension}`
        };

        setUploadedFiles(prev => ({
            ...prev,
            [documentType]: uploadedFile
        }));

        Alert.alert(
            'File Uploaded Successfully',
            `File "${uploadedFile.name}" has been uploaded successfully!`,
            [{ text: 'OK', style: 'default' }]
        );
    };

    const handleRemoveFile = (documentType: string) => {
        setUploadedFiles(prev => ({
            ...prev,
            [documentType]: null
        }));
    };

    
    const renderHeader = () => (
        <HeaderWithBack
            title="Vehicle Details"
            subtitle={mode === 'edit' ? 'Edit Mode' : 'View Mode'}
            onBackPress={() => navigation.goBack()}
        />
    );

    const renderTabNavigation = () => (
        <View className="bg-white border-b border-gray-300">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6">
                <View className="flex-row gap-8">
                    {[
                        { key: "vehicle-details", label: "Vehicle Details" },
                        { key: "associated-documents", label: "Associated Documents" },
                        { key: "service-schedule", label: "Service Schedule" },
                        { key: "job-order-history", label: "Job Order History" },
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            onPress={() => setActiveTab(tab.key)}
                            className={`py-4 border-b-2 ${
                                activeTab === tab.key
                                    ? "border-teal-600"
                                    : "border-transparent"
                            }`}
                        >
                            <Text
                                className={`text-sm ${
                                    activeTab === tab.key
                                        ? "text-teal-600 font-medium"
                                        : "text-gray-600"
                                }`}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );

    const renderVehicleDetailsTab = () => (
        <View>
            {/* Vehicle Information Section */}
            <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                Vehicle Information
            </Text>

            {/* Manufacturer Name */}
            <View className="mb-4">
                <FormLabel label="Manufacturer Name" required />
                {mode === 'edit' ? (
                    <TouchableOpacity
                        onPress={() => setShowManufacturerModal(true)}
                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                    >
                        <Text className="text-gray-800 flex-1">{manufacturerName}</Text>
                        <ChevronRight size={16} color={COLORS.gray[400]} />
                    </TouchableOpacity>
                ) : (
                    <View className="h-12 bg-gray-50 border border-gray-200 rounded-lg px-3 justify-center">
                        <Text className="text-gray-800">{manufacturerName || '-'}</Text>
                    </View>
                )}
            </View>

            {/* Model */}
            <View className="mb-4">
                <FormLabel label="Model" required />
                {mode === 'edit' ? (
                    <TouchableOpacity
                        onPress={() => setShowModelModal(true)}
                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                    >
                        <Text className="text-gray-800 flex-1">{model}</Text>
                        <ChevronRight size={16} color={COLORS.gray[400]} />
                    </TouchableOpacity>
                ) : (
                    <View className="h-12 bg-gray-50 border border-gray-200 rounded-lg px-3 justify-center">
                        <Text className="text-gray-800">{model || '-'}</Text>
                    </View>
                )}
            </View>

            {/* Category */}
            <View className="mb-4">
                <FormLabel label="Category" />
                {mode === 'edit' ? (
                    <View className="h-12 bg-gray-50 border border-gray-200 rounded-lg px-3 justify-center">
                        <Text className="text-gray-800">{category || 'Select Model First'}</Text>
                    </View>
                ) : (
                    <View className="h-12 bg-gray-50 border border-gray-200 rounded-lg px-3 justify-center">
                        <Text className="text-gray-800">{category || '-'}</Text>
                    </View>
                )}
            </View>

            {/* Select Color */}
            <View className="mb-4">
                <FormLabel label="Select Color" />
                <View className="flex-row gap-2">
                    {mode === 'edit' ? (
                        <>
                            <TextInput
                                value={selectedColor}
                                editable={false}
                                className="flex-1 h-12 bg-gray-100 border border-gray-200 rounded-lg px-3 text-gray-800"
                            />
                            <TouchableOpacity
                                onPress={() => setShowColorModal(true)}
                                className="px-4 py-2 rounded-lg h-12 justify-center bg-teal-600"
                            >
                                <Text className="text-sm text-white">Select Color</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View className="flex-1 h-12 bg-gray-50 border border-gray-200 rounded-lg px-3 justify-center">
                            <Text className="text-gray-800">{selectedColor || '-'}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Chassis Number */}
            <View className="mb-4">
                <FormLabel label="Chassis Number" required />
                {mode === 'edit' ? (
                    <View>
                        <TextInput
                            value={chassisNumber}
                            onChangeText={handleChassisNumberChange}
                            editable={!disableForm}
                            maxLength={17}
                            placeholder="Enter 17-character Chassis Number"
                            className={`h-12 border rounded-lg px-3 text-gray-800 ${
                                validationErrors.chassis 
                                    ? 'border-red-500 bg-red-50' 
                                    : isValidatingChassis 
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-400 bg-white'
                            }`}
                        />
                        {validationErrors.chassis && (
                            <Text className="text-xs text-red-500 mt-1">{validationErrors.chassis}</Text>
                        )}
                        {isValidatingChassis && (
                            <View className="flex-row items-center mt-1">
                                <ActivityIndicator size="small" color={COLORS.primary} />
                                <Text className="text-xs text-blue-600 ml-2">Validating chassis number...</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <View className="h-12 bg-gray-50 border border-gray-200 rounded-lg px-3 justify-center">
                        <Text className="text-gray-800">{chassisNumber || '-'}</Text>
                    </View>
                )}
            </View>

            {/* MFG Date */}
            <View className="mb-4">
                <FormLabel label="MFG [MM-YYYY]" />
                {mode === 'edit' ? (
                    <TextInput
                        value={mfgDate}
                        onChangeText={setMfgDate}
                        placeholder="Jan-2024"
                        editable={true}
                        className="h-12 bg-white border-gray-400 border rounded-lg px-3 text-gray-800"
                    />
                ) : (
                    <View className="h-12 bg-gray-50 border border-gray-200 rounded-lg px-3 justify-center">
                        <Text className="text-gray-800">{mfgDate || '-'}</Text>
                    </View>
                )}
            </View>

            {/* Engine Number */}
            <View className="mb-4">
                <FormLabel label="Engine Number" />
                {mode === 'edit' ? (
                    <TextInput
                        value={engineNumber}
                        onChangeText={setEngineNumber}
                        editable={true}
                        className="h-12 bg-white border-gray-400 border rounded-lg px-3 text-gray-800"
                    />
                ) : (
                    <View className="h-12 bg-gray-50 border border-gray-200 rounded-lg px-3 justify-center">
                        <Text className="text-gray-800">{engineNumber || '-'}</Text>
                    </View>
                )}
            </View>

            {/* Date of Sale */}
            <View className="mb-4">
                <FormLabel label="Date of Sale" />
                <View className="flex-row gap-2">
                    {mode === 'edit' ? (
                        <>
                            <TextInput
                                value={dateOfSale}
                                editable={false}
                                className="flex-1 h-12 bg-white border border-gray-300 rounded-l-lg px-3 text-gray-800"
                                placeholder="DD/MM/YYYY"
                            />
                            <TouchableOpacity
                                onPress={() => setShowCalendarModal(true)}
                                className="h-12 bg-teal-600 rounded-r-lg px-4 justify-center"
                            >
                                <Calendar size={20} color="white" />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View className="flex-1 h-12 bg-gray-50 border border-gray-200 rounded-lg px-3 justify-center">
                            <Text className="text-gray-800">{dateOfSale || '-'}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Vehicle Type */}
            <View className="mb-4">
                <FormLabel label="Vehicle Type" required />
                {mode === 'edit' ? (
                    <TouchableOpacity
                        onPress={() => setShowVehicleTypeModal(true)}
                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                    >
                        <Text className="text-gray-800 flex-1">{vehicleType}</Text>
                        <ChevronRight size={16} color={COLORS.gray[400]} />
                    </TouchableOpacity>
                ) : (
                    <View className="h-12 bg-gray-50 border border-gray-200 rounded-lg px-3 justify-center">
                        <Text className="text-gray-800">{vehicleType || '-'}</Text>
                    </View>
                )}
            </View>

            {/* Registration Number */}
            <View className="mb-4">
                <FormLabel label="Registration Number" />
                {mode === 'edit' ? (
                    <TextInput
                        value={registrationNumber}
                        onChangeText={setRegistrationNumber}
                        editable={true}
                        className="h-12 bg-white border-gray-400 border rounded-lg px-3 text-gray-800"
                    />
                ) : (
                    <View className="h-12 bg-gray-50 border border-gray-200 rounded-lg px-3 justify-center">
                        <Text className="text-gray-800">{registrationNumber || '-'}</Text>
                    </View>
                )}
            </View>

            {/* Service Coupon Number */}
            <View className="mb-4">
                <FormLabel label="Service Coupon Number" />
                {mode === 'edit' ? (
                    <TextInput
                        value={serviceCouponNumber}
                        onChangeText={setServiceCouponNumber}
                        editable={true}
                        className="h-12 bg-white border-gray-400 border rounded-lg px-3 text-gray-800"
                    />
                ) : (
                    <View className="h-12 bg-gray-50 border border-gray-200 rounded-lg px-3 justify-center">
                        <Text className="text-gray-800">{serviceCouponNumber || '-'}</Text>
                    </View>
                )}
            </View>

            {/* Vehicle Activate */}
            <View className="mb-4">
                <FormLabel label="Vehicle Activate" />
                <View className="h-12 bg-gray-50 border border-gray-200 rounded-lg px-3 justify-center">
                    <Text className="text-gray-800">
                        {vehicleDetails?.active !== undefined 
                            ? (vehicleDetails.active ? 'Yes' : 'No')
                            : (vehicleActivate === 'Active' ? 'Yes' : 'No')
                        }
                    </Text>
                </View>
            </View>

            {/* Customer Information Section */}
            {/* <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100 mt-6">
                Customer Information
            </Text> */}

            {/* Customer Associated */}
            <View className="mb-4">
                <FormLabel label="Customer Associated" />
                {mode === 'edit' ? (
                    <TouchableOpacity
                        onPress={() => {
                            console.log('Opening customer dropdown'); // Debug log
                            setCustomerDropdownVisible(true);
                            
                            // Always load ALL customers for dropdown (not just vehicle customers)
                            console.log('Loading all customers for dropdown'); // Debug log
                            // Use search API with empty string to get all customers
                            handleCustomerDropdownSearch('');
                        }}
                        className={`bg-white border border-gray-300 rounded-lg px-3 flex-row items-start justify-between ${
                            selectedCustomers.length > 0 ? 'min-h-12 py-2' : 'h-12'
                        }`}
                    >
                        <View className="flex-1">
                            {selectedCustomers.length > 0 ? (
                                <View className="flex-row flex-wrap gap-1">
                                    {selectedCustomers.map((customer: any, index: number) => (
                                        <View key={customer.id || index} className="bg-blue-100 px-2 py-1 rounded">
                                            <Text className="text-xs text-blue-800">
                                                {customer.name || 'Unknown'}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <Text className="text-gray-400">Select Customers</Text>
                            )}
                        </View>
                        <ChevronRight size={16} color={COLORS.gray[400]} />
                    </TouchableOpacity>
                ) : (
                    <View className={`bg-gray-50 border border-gray-200 rounded-lg px-3 justify-center ${
                        selectedCustomers.length > 0 ? 'min-h-12 py-2' : 'h-12'
                    }`}>
                        <View className="flex-row flex-wrap gap-1">
                            {selectedCustomers.map((customer: any, index: number) => (
                                <View key={customer.id || index} className="bg-blue-100 px-2 py-1 rounded">
                                    <Text className="text-xs text-blue-800">
                                        {customer.name || 'Unknown'}
                                    </Text>
                                </View>
                            ))}
                            {selectedCustomers.length === 0 && (
                                <Text className="text-gray-800">-</Text>
                            )}
                        </View>
                    </View>
                )}
            </View>
        </View>
    );

    const renderAssociatedDocumentsTab = () => (
        <View>
            {/* Model Documents Section */}
            <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                Model Documents
            </Text>

            <View className="mb-6">
                <ScrollView horizontal showsHorizontalScrollIndicator={true} className="overflow-hidden">
                    <View style={{ minWidth: 400 }} className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                        <View className="bg-gray-600 text-white p-3">
                            <View className="flex-row" style={{ minWidth: 400 }}>
                                <Text className="text-sm font-medium text-white" style={{ width: 200 }}>Name</Text>
                                <Text className="text-sm font-medium text-white" style={{ width: 100 }}>Type</Text>
                                <Text className="text-sm font-medium text-white text-right" style={{ width: 100 }}>Actions</Text>
                            </View>
                        </View>
                        <View className="p-12 items-center" style={{ minWidth: 400 }}>
                            <FolderOpen size={48} color={COLORS.gray[300]} strokeWidth={1} />
                            <Text className="text-sm text-gray-400 mt-2">No Data</Text>
                        </View>
                    </View>
                </ScrollView>
            </View>

            {/* Insurance Documents Section */}
            <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                Insurance Documents
            </Text>

            <View className="mb-6">
                <ScrollView horizontal showsHorizontalScrollIndicator={true} className="overflow-hidden">
                    <View style={{ minWidth: 800 }} className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                        <View className="bg-gray-600 text-white p-3">
                            <View className="flex-row" style={{ minWidth: 800 }}>
                                <Text className="text-sm font-medium text-white" style={{ width: 150 }}>Insurer</Text>
                                <Text className="text-sm font-medium text-white" style={{ width: 120 }}>Policy No</Text>
                                <Text className="text-sm font-medium text-white" style={{ width: 100 }}>Type</Text>
                                <Text className="text-sm font-medium text-white" style={{ width: 100 }}>Valid From</Text>
                                <Text className="text-sm font-medium text-white" style={{ width: 100 }}>Valid To</Text>
                                <Text className="text-sm font-medium text-white text-right" style={{ width: 80 }}>Actions</Text>
                            </View>
                        </View>
                        <View className="p-12 items-center" style={{ minWidth: 800 }}>
                            <FolderOpen size={48} color={COLORS.gray[300]} strokeWidth={1} />
                            <Text className="text-sm text-gray-400 mt-2">No Data</Text>
                        </View>
                    </View>
                </ScrollView>
            </View>

            {/* Upload Insurance Section */}
            <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                Upload Insurance
            </Text>

            <View className="mb-6">
                <TouchableOpacity className="flex-row items-center gap-2 px-4 py-2 border border-blue-600 rounded-lg self-start mb-6">
                    <Upload size={16} color="#2563eb" />
                    <Text className="text-sm text-blue-600">Upload Bulk Insurance</Text>
                </TouchableOpacity>
                
                {/* Insurance Form */}
                <View className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                    {/* Insurer */}
                    <View className="mb-4">
                        <FormLabel label="Insurer" />
                        <TouchableOpacity className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between">
                            <Text className="text-gray-400">Select Insurer</Text>
                            <ChevronRight size={16} color={COLORS.gray[400]} />
                        </TouchableOpacity>
                    </View>

                    {/* Policy No */}
                    <View className="mb-4">
                        <FormLabel label="Policy No" />
                        {mode === 'edit' ? (
                            <TextInput
                                value={policyNo}
                                onChangeText={setPolicyNo}
                                placeholder="Enter Policy Number"
                                editable={true}
                                className="h-12 bg-white border-gray-400 border rounded-lg px-3 text-gray-800"
                            />
                        ) : (
                            <View className="h-12 bg-gray-50 border border-gray-200 rounded-lg px-3 justify-center">
                                <Text className="text-gray-800">{policyNo || '-'}</Text>
                            </View>
                        )}
                    </View>

                    {/* Insurance Type */}
                    <View className="mb-4">
                        <FormLabel label="Insurance Type" />
                        <TouchableOpacity className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between">
                            <Text className="text-gray-400">Select Insurance Type</Text>
                            <ChevronRight size={16} color={COLORS.gray[400]} />
                        </TouchableOpacity>
                    </View>

                    {/* Valid From */}
                    <View className="mb-4">
                        <FormLabel label="Valid From" />
                        <View className="flex-row items-center">
                            {mode === 'edit' ? (
                                <>
                                    <TextInput
                                        value={validFrom}
                                        onChangeText={setValidFrom}
                                        placeholder="DD/MM/YYYY"
                                        editable={true}
                                        className="flex-1 h-12 bg-white border-gray-400 border rounded-l-lg px-3 text-gray-800"
                                    />
                                    <TouchableOpacity
                                        onPress={() => openCalendar('validFrom')}
                                        className="h-12 bg-teal-600 rounded-r-lg px-4 justify-center"
                                    >
                                        <Calendar size={20} color="white" />
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <View className="flex-1 h-12 bg-gray-50 border border-gray-200 rounded-lg px-3 justify-center">
                                    <Text className="text-gray-800">{validFrom || '-'}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Valid To */}
                    <View className="mb-4">
                        <FormLabel label="Valid To" />
                        <View className="flex-row items-center">
                            {mode === 'edit' ? (
                                <>
                                    <TextInput
                                        value={validTo}
                                        onChangeText={setValidTo}
                                        placeholder="DD/MM/YYYY"
                                        editable={true}
                                        className="flex-1 h-12 bg-white border-gray-400 border rounded-l-lg px-3 text-gray-800"
                                    />
                                    <TouchableOpacity
                                        onPress={() => openCalendar('validTo')}
                                        className="h-12 bg-teal-600 rounded-r-lg px-4 justify-center"
                                    >
                                        <Calendar size={20} color="white" />
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <View className="flex-1 h-12 bg-gray-50 border border-gray-200 rounded-lg px-3 justify-center">
                                    <Text className="text-gray-800">{validTo || '-'}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Documents Upload */}
                    <View className="mb-4">
                        <FormLabel label="Documents" />
                        <TouchableOpacity className="flex-row items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg h-12">
                            <Upload size={16} color={COLORS.gray[600]} />
                            <Text className="text-sm text-gray-700">Upload Consent</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Required Documents Section */}
            <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                Required Documents
            </Text>

            <View className="mb-6">
                <View className="flex-row flex-wrap gap-3">
                    {[
                        { name: 'Address Proof', key: 'addressProof' },
                        { name: 'Chassis Impression', key: 'chassisImpression' },
                        { name: 'Form 22', key: 'form22' },
                        { name: 'Form 21', key: 'form21' },
                        { name: 'Signature', key: 'signature' },
                        { name: 'PanCard/Form60', key: 'panCard' },
                        { name: 'Right', key: 'right' },
                        { name: 'Left', key: 'left' },
                        { name: 'Front', key: 'front' },
                        { name: 'Rear', key: 'rear' },
                        { name: 'Invoice', key: 'invoice' },
                        { name: 'Disclaimer', key: 'disclaimer' },
                        { name: 'Form14', key: 'form14' },
                        { name: 'InspectionCertificate', key: 'inspectionCertificate' }
                    ].map((doc) => {
                        const uploadedFile = uploadedFiles[doc.key];
                        return (
                            <View key={doc.key} className="border border-gray-300 rounded-lg p-3 bg-white w-[48%]">
                                {uploadedFile ? (
                                    // File uploaded state - show filename and cancel button
                                    <View className="w-full">
                                        <View className="flex-row justify-between items-start mb-2">
                                            <View className="flex-1 mr-2">
                                                <Text className="text-xs text-gray-700 font-medium mb-1">{doc.name}</Text>
                                                <Text className="text-xs text-gray-500" numberOfLines={2}>
                                                    {uploadedFile.name}
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => handleRemoveFile(doc.key)}
                                                className="p-1"
                                            >
                                                <X size={16} color={COLORS.red[600]} />
                                            </TouchableOpacity>
                                        </View>
                                        <View className="w-full h-8 items-center justify-center bg-teal-50 rounded">
                                            <Text className="text-xs text-teal-600">✓ Uploaded</Text>
                                        </View>
                                    </View>
                                ) : (
                                    // Upload state - show upload button
                                    <View className="w-full">
                                        <View className="w-full h-16 items-center justify-center mb-2">
                                            <Upload size={32} color={COLORS.gray[400]} />
                                        </View>
                                        <Text className="text-xs text-center text-gray-600 mb-2">{doc.name}</Text>
                                        <TouchableOpacity
                                            onPress={() => handleFileUpload(doc.key)}
                                            className="w-full py-1 border border-teal-600 rounded items-center justify-center"
                                        >
                                            <Text className="text-xs text-teal-600">+ Upload</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* Vehicle e-Receipt Section */}
            <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                Vehicle e-Receipt
            </Text>

            <View className="mb-4">
                <View className="bg-white border border-gray-300 rounded-lg p-12 items-center">
                    <FolderOpen size={48} color={COLORS.gray[300]} strokeWidth={1} />
                    <Text className="text-sm text-gray-400 mt-2">No Data</Text>
                </View>
            </View>
        </View>
    );

    const renderServiceScheduleTab = () => (
        <View>
            {/* Service Schedule Table */}
            <View className="mb-4">
                <ScrollView horizontal showsHorizontalScrollIndicator={true} className="overflow-hidden">
                    <View style={{ minWidth: 600 }} className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                        <View className="bg-gray-600 text-white p-3">
                            <View className="flex-row" style={{ minWidth: 600 }}>
                                <Text className="text-sm font-medium text-white" style={{ width: 100 }}>Service No</Text>
                                <Text className="text-sm font-medium text-white" style={{ width: 100 }}>Service Type</Text>
                                <Text className="text-sm font-medium text-white" style={{ width: 100 }}>Service Kms</Text>
                                <Text className="text-sm font-medium text-white" style={{ width: 120 }}>Service Date</Text>
                            </View>
                        </View>
                        {vehicleServices && vehicleServices.length > 0 ? (
                            <View>
                                {vehicleServices.map((service: any, index: number) => (
                                    <View key={service.id || index} className="p-3 border-b border-gray-100">
                                        <View className="flex-row" style={{ minWidth: 600 }}>
                                            <Text className="text-sm text-gray-800" style={{ width: 100 }}>
                                                {service.serviceNo || '-'}
                                            </Text>
                                            <View style={{ width: 100 }}>
                                                <View className={`px-2 py-1 rounded text-xs text-center ${
                                                    service.serviceType === 'FREE' ? 'bg-green-100 text-green-800' :
                                                    service.serviceType === 'PAID' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                    <Text className="font-medium">
                                                        {service.serviceType || '-'}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text className="text-sm text-gray-800" style={{ width: 100 }}>
                                                {service.serviceKms || '-'}
                                            </Text>
                                            <Text className="text-sm text-gray-800" style={{ width: 120 }}>
                                                {service.serviceDate ? moment(new Date(service.serviceDate)).format('DD/MM/YYYY') : '-'}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View className="p-12 items-center" style={{ minWidth: 600 }}>
                                <FolderOpen size={48} color={COLORS.gray[300]} strokeWidth={1} />
                                <Text className="text-sm text-gray-400 mt-2">No Service Schedule Available</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>

            {/* QR Code and Re-Generate Buttons */}
            <View className="flex-row justify-end gap-3 mb-6">
                <TouchableOpacity 
                    className="flex-row items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg"
                    onPress={() => {
                        Alert.alert('QR Code', 'QR Code generation feature will be available in the next update.');
                    }}
                >
                    <Hash size={16} color={COLORS.gray[600]} />
                    <Text className="text-sm text-gray-700">QR Code</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    className="flex-row items-center gap-2 px-4 py-2 bg-teal-600 rounded-lg"
                    onPress={async () => {
                        try {
                            setLoading(true);
                            Alert.alert('Re-Generate', 'Regenerating service dates...');
                            // Call API to regenerate service dates
                            if (vehicleDetails?.id) {
                                const response = await getVehicleServices(vehicleDetails.id);
                                if (response.data.code === 200) {
                                    setVehicleServices(response.data.response?.data || []);
                                    Alert.alert('Success', 'Service schedule regenerated successfully');
                                }
                            }
                        } catch (error) {
                            console.error('Error regenerating service schedule:', error);
                            Alert.alert('Error', 'Failed to regenerate service schedule');
                        } finally {
                            setLoading(false);
                        }
                    }}
                >
                    <Text className="text-sm text-white font-medium">Re-Generate</Text>
                </TouchableOpacity>
            </View>

            {/* QR Code Display Area */}
            <View className="bg-gray-50 border border-gray-200 rounded-lg p-4 items-center">
                <Text className="text-sm text-gray-500 mb-2">QR Code will appear here</Text>
                <View className="w-32 h-32 bg-gray-200 rounded-lg items-center justify-center">
                    <Hash size={48} color={COLORS.gray[400]} />
                </View>
            </View>
        </View>
    );

    const renderJobOrderHistoryTab = () => (
        <View>
            {/* Job Order History Table */}
            <View className="mb-4">
                <ScrollView horizontal showsHorizontalScrollIndicator={true} className="overflow-hidden">
                    <View style={{ minWidth: 1000 }} className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                        <View className="bg-gray-600 text-white p-3">
                            <View className="flex-row" style={{ minWidth: 1000 }}>
                                <Text className="text-sm font-medium text-white" style={{ width: 80 }}>Job No</Text>
                                <Text className="text-sm font-medium text-white" style={{ width: 100 }}>Reg. No</Text>
                                <Text className="text-sm font-medium text-white" style={{ width: 120 }}>Customer</Text>
                                <Text className="text-sm font-medium text-white" style={{ width: 100 }}>Model</Text>
                                <Text className="text-sm font-medium text-white" style={{ width: 100 }}>Service Type</Text>
                                <Text className="text-sm font-medium text-white" style={{ width: 100 }}>Mechanic</Text>
                                <Text className="text-sm font-medium text-white" style={{ width: 100 }}>Supervisor</Text>
                                <Text className="text-sm font-medium text-white" style={{ width: 80 }}>Kms</Text>
                                <Text className="text-sm font-medium text-white" style={{ width: 100 }}>Date</Text>
                                <Text className="text-sm font-medium text-white" style={{ width: 80 }}>Status</Text>
                                <Text className="text-sm font-medium text-white text-right" style={{ width: 80 }}>Actions</Text>
                            </View>
                        </View>
                        
                        {/* Sample Job Order Data - Replace with actual API data */}
                        {[].length > 0 ? (
                            <View>
                                {[].map((job: any, index: number) => (
                                    <View key={job.id || index} className="border-b border-gray-100">
                                        {/* Main Job Order Row */}
                                        <View className="p-3">
                                            <View className="flex-row" style={{ minWidth: 1000 }}>
                                                <Text className="text-sm text-gray-800" style={{ width: 80 }}>
                                                    {job.jobNo || '-'}
                                                </Text>
                                                <Text className="text-sm text-gray-800" style={{ width: 100 }}>
                                                    {job.vehicle?.registerNo || '-'}
                                                </Text>
                                                <Text className="text-sm text-gray-800" style={{ width: 120 }}>
                                                    {job.customer?.name || '-'}
                                                </Text>
                                                <Text className="text-sm text-gray-800" style={{ width: 100 }}>
                                                    {job.vehicle?.vehicle?.modelName || '-'}
                                                </Text>
                                                <Text className="text-sm text-gray-800" style={{ width: 100 }}>
                                                    {job.serviceType || '-'}
                                                </Text>
                                                <Text className="text-sm text-gray-800" style={{ width: 100 }}>
                                                    {job.mechanic?.profile?.employeeName || '-'}
                                                </Text>
                                                <Text className="text-sm text-gray-800" style={{ width: 100 }}>
                                                    {job.supervisor?.name || '-'}
                                                </Text>
                                                <Text className="text-sm text-gray-800" style={{ width: 80 }}>
                                                    {job.kms || '-'}
                                                </Text>
                                                <Text className="text-sm text-gray-800" style={{ width: 100 }}>
                                                    {job.createdAt ? moment(new Date(job.createdAt)).format('DD/MM/YYYY') : '-'}
                                                </Text>
                                                <View style={{ width: 80 }}>
                                                    <View className={`px-2 py-1 rounded text-xs text-center ${
                                                        job.jobStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                        job.jobStatus === 'INPROGRESS' ? 'bg-orange-100 text-orange-800' :
                                                        job.jobStatus === 'PENDING' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        <Text className="font-medium">
                                                            {job.jobStatus || '-'}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={{ width: 80 }} className="items-end">
                                                    <TouchableOpacity 
                                                        className="p-1"
                                                        onPress={() => {
                                                            Alert.alert('PDF Download', 'PDF download feature will be available in the next update.');
                                                        }}
                                                    >
                                                        <FileText size={16} color={COLORS.blue[600]} />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                        
                                        {/* Expandable Details Section */}
                                        <View className="bg-gray-50 px-3 pb-3">
                                            <View className="flex-row justify-between items-center mb-2">
                                                <Text className="text-sm font-medium text-gray-700">Total Invoice: </Text>
                                                <Text className="text-sm font-bold text-gray-900">₹{job.totalInvoice || '0'}/-</Text>
                                            </View>
                                            
                                            {/* Parts and Labour Details */}
                                            <View className="bg-white border border-gray-200 rounded-lg p-2">
                                                <View className="flex-row border-b border-gray-200 pb-1 mb-2">
                                                    <Text className="text-xs font-medium text-gray-600" style={{ width: 200 }}>Details</Text>
                                                    <Text className="text-xs font-medium text-gray-600" style={{ width: 70 }}>Quantity</Text>
                                                    <Text className="text-xs font-medium text-gray-600" style={{ width: 80 }}>Unit Rate</Text>
                                                    <Text className="text-xs font-medium text-gray-600" style={{ width: 100 }}>Amount</Text>
                                                </View>
                                                
                                                {/* Sample Parts Data */}
                                                {(job.parts || []).map((part: any, partIndex: number) => (
                                                    <View key={partIndex} className="flex-row py-1 border-b border-gray-100">
                                                        <Text className="text-xs text-gray-700" style={{ width: 200 }}>
                                                            {part.partNumber?.partNumber} - {part.partNumber?.partName}
                                                        </Text>
                                                        <Text className="text-xs text-gray-700" style={{ width: 70 }}>
                                                            {part.quantity}
                                                        </Text>
                                                        <Text className="text-xs text-gray-700" style={{ width: 80 }}>
                                                            ₹{part.unitRate}
                                                        </Text>
                                                        <Text className="text-xs text-gray-700" style={{ width: 100 }}>
                                                            ₹{part.rate}
                                                        </Text>
                                                    </View>
                                                ))}
                                                
                                                {/* Sample Labour Data */}
                                                {(job.labour || []).map((labour: any, labourIndex: number) => (
                                                    <View key={labourIndex} className="flex-row py-1 border-b border-gray-100">
                                                        <Text className="text-xs text-gray-700" style={{ width: 200 }}>
                                                            {labour.jobCode?.code}
                                                        </Text>
                                                        <Text className="text-xs text-gray-700" style={{ width: 70 }}>
                                                            {labour.quantity}
                                                        </Text>
                                                        <Text className="text-xs text-gray-700" style={{ width: 80 }}>
                                                            ₹{labour.unitRate}
                                                        </Text>
                                                        <Text className="text-xs text-gray-700" style={{ width: 100 }}>
                                                            ₹{labour.rate}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View className="p-12 items-center" style={{ minWidth: 1000 }}>
                                <FolderOpen size={48} color={COLORS.gray[300]} strokeWidth={1} />
                                <Text className="text-sm text-gray-400 mt-2">No Job Order History Available</Text>
                                <Text className="text-xs text-gray-400 mt-1">Job orders will appear here once service is completed</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        </View>
    );

    const renderManufacturerModal = () => (
        <Modal visible={showManufacturerModal} transparent animationType="fade" onRequestClose={() => setShowManufacturerModal(false)}>
            <View className="flex-1 bg-black/40 items-center justify-center px-4">
                <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '60%' }}>
                    <View className="p-4 border-b border-gray-200">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-lg font-semibold text-gray-800">Select Manufacturer</Text>
                            <TouchableOpacity onPress={() => setShowManufacturerModal(false)}>
                                <X size={20} color={COLORS.gray[600]} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <ScrollView>
                        {manufacturers.map((item) => (
                            <TouchableOpacity 
                                key={item.id} 
                                onPress={() => { 
                                    setManufacturerName(item.name); 
                                    setShowManufacturerModal(false);
                                    // Fetch models for selected manufacturer
                                    fetchVehicleModels(item.id);
                                }} 
                                className="p-4 border-b border-gray-100"
                            >
                                <Text className={`text-gray-800 ${manufacturerName === item.name ? 'font-bold text-teal-700' : ''}`}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity onPress={() => setShowManufacturerModal(false)} className="p-3 border-t border-gray-200">
                        <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderModelModal = () => (
        <Modal visible={showModelModal} transparent animationType="fade" onRequestClose={() => setShowModelModal(false)}>
            <View className="flex-1 bg-black/40 items-center justify-center px-4">
                <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '60%' }}>
                    <View className="p-4 border-b border-gray-200">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-lg font-semibold text-gray-800">Select Model</Text>
                            <TouchableOpacity onPress={() => setShowModelModal(false)}>
                                <X size={20} color={COLORS.gray[600]} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <ScrollView>
                        {(vehicleModels || []).map((item) => {
                            const modelDisplay = item.modelCode && item.modelName 
                                ? `${item.modelCode} - ${item.modelName}`
                                : item.modelName || item.name || '';
                            
                            return (
                                <TouchableOpacity 
                                    key={item.id} 
                                    onPress={() => { 
                                        const modelDisplay = item.modelCode && item.modelName 
                                            ? `${item.modelCode} - ${item.modelName}`
                                            : item.modelName || item.name || '';
                                        
                                        setModel(modelDisplay); 
                                        setShowModelModal(false);
                                        
                                        // Auto-set category based on selected model
                                        if (item.category) {
                                            setCategory(item.category);
                                        }
                                        
                                        // Auto-set color if available
                                        if (item.image && item.image.length > 0) {
                                            setSelectedColor(item.image[0].color);
                                        }
                                    }} 
                                    className="p-4 border-b border-gray-100"
                                >
                                    <Text className={`text-gray-800 ${model === modelDisplay ? 'font-bold text-teal-700' : ''}`}>
                                        {modelDisplay}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                    <TouchableOpacity onPress={() => setShowModelModal(false)} className="p-3 border-t border-gray-200">
                        <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderColorModal = () => (
        <Modal visible={showColorModal} transparent animationType="fade" onRequestClose={() => setShowColorModal(false)}>
            <View className="flex-1 bg-black/40 items-center justify-center px-4">
                <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '70%' }}>
                    <View className="p-4 border-b border-gray-200">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-lg font-semibold text-gray-800">Select Color</Text>
                            <TouchableOpacity onPress={() => setShowColorModal(false)}>
                                <X size={20} color={COLORS.gray[600]} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <ScrollView>
                        {vehicleModels.length > 0 && vehicleModels.find(v => 
                            v.modelCode && model.includes(v.modelCode)
                        )?.image?.length > 0 ? (
                            // Show actual colors from vehicle model
                            vehicleModels
                                .find(v => v.modelCode && model.includes(v.modelCode))
                                ?.image?.map((color: any, index: number) => (
                                    <TouchableOpacity 
                                        key={color.id || index} 
                                        onPress={() => { 
                                            setSelectedColor(color.color); 
                                            setShowColorModal(false);
                                        }} 
                                        className="p-4 border-b border-gray-100"
                                    >
                                        <View className="flex-row items-center justify-between">
                                            <View className="flex-row items-center flex-1">
                                                {color.url && (
                                                    <Image 
                                                        source={{ uri: color.url }} 
                                                        className="w-8 h-8 rounded-full mr-3"
                                                        style={{ width: 32, height: 32 }}
                                                    />
                                                )}
                                                <View>
                                                    <Text className={`text-gray-800 ${
                                                        selectedColor === color.color ? 'font-bold text-teal-700' : ''
                                                    }`}>
                                                        {color.color}
                                                    </Text>
                                            {color.code && (
                                                <Text className="text-xs text-gray-500">
                                                    Code: {color.code}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                    <View className={`w-5 h-5 rounded-full border-2 ${
                                        selectedColor === color.color 
                                            ? 'bg-teal-600 border-teal-600' 
                                            : 'border-gray-300'
                                    }`}>
                                        {selectedColor === color.color && (
                                            <View className="w-2 h-2 bg-white rounded-full self-center mt-1" />
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        // Fallback to default colors
                        [
                            { id: '1', name: 'Metallic Black', code: 'SMX', color: 'black' },
                            { id: '2', name: 'Blue', code: 'BLU', color: 'blue' },
                            { id: '3', name: 'Red', code: 'RED', color: 'red' },
                            { id: '4', name: 'Gray', code: 'GRY', color: 'gray' },
                        ].map((item) => (
                            <TouchableOpacity 
                                key={item.id} 
                                onPress={() => { setSelectedColor(item.name); setShowColorModal(false); }} 
                                className="p-4 border-b border-gray-100"
                            >
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center flex-1">
                                        <View className={`w-8 h-8 rounded-full mr-3 bg-${item.color}-500`} />
                                        <View>
                                            <Text className={`text-gray-800 ${
                                                selectedColor === item.name ? 'font-bold text-teal-700' : ''
                                            }`}>
                                                {item.name}
                                            </Text>
                                            <Text className="text-xs text-gray-500">{item.code}</Text>
                                        </View>
                                    </View>
                                    <View className={`w-5 h-5 rounded-full border-2 ${
                                        selectedColor === item.name 
                                            ? 'bg-teal-600 border-teal-600' 
                                            : 'border-gray-300'
                                    }`}>
                                        {selectedColor === item.name && (
                                            <View className="w-2 h-2 bg-white rounded-full self-center mt-1" />
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                    </ScrollView>
                    <TouchableOpacity onPress={() => setShowColorModal(false)} className="p-3 border-t border-gray-200">
                        <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderVehicleTypeModal = () => (
        <Modal visible={showVehicleTypeModal} transparent animationType="fade" onRequestClose={() => setShowVehicleTypeModal(false)}>
            <View className="flex-1 bg-black/40 items-center justify-center px-4">
                <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '60%' }}>
                    <View className="p-4 border-b border-gray-200">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-lg font-semibold text-gray-800">Select Vehicle Type</Text>
                            <TouchableOpacity onPress={() => setShowVehicleTypeModal(false)}>
                                <X size={20} color={COLORS.gray[600]} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <ScrollView>
                        {VEHICLE_TYPES.map((item) => (
                            <TouchableOpacity 
                                key={item.id} 
                                onPress={() => { setVehicleType(item.name); setShowVehicleTypeModal(false); }} 
                                className="p-4 border-b border-gray-100"
                            >
                                <Text className={`text-gray-800 ${vehicleType === item.name ? 'font-bold text-teal-700' : ''}`}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity onPress={() => setShowVehicleTypeModal(false)} className="p-3 border-t border-gray-200">
                        <Text className="text-center text-gray-600 font-medium">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderCustomerModal = () => (
        <Modal visible={showCustomerModal} transparent animationType="fade" onRequestClose={() => setShowCustomerModal(false)}>
            <View className="flex-1 bg-black/40 items-center justify-center px-4">
                <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '80%' }}>
                    <View className="p-4 border-b border-gray-200">
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-lg font-semibold text-gray-800">Select Customers</Text>
                            <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                                <X size={20} color={COLORS.gray[600]} />
                            </TouchableOpacity>
                        </View>
                        
                        {/* Search Input */}
                        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                            <Search size={16} color={COLORS.gray[400]} />
                            <TextInput
                                className="flex-1 ml-2 text-gray-800"
                                placeholder="Search customers..."
                                value={customerSearchQuery}
                                onChangeText={handleCustomerDropdownSearch}
                            />
                        </View>
                    </View>
                    
                    <ScrollView>
                        {/* Add Customer Button */}
                        <TouchableOpacity 
                            onPress={() => setShowAddCustomerForm(true)}
                            className="p-4 border-b border-gray-100 bg-blue-50"
                        >
                            <View className="flex-row items-center">
                                <Plus size={20} color={COLORS.primary} />
                                <Text className="ml-2 text-blue-600 font-medium">Add New Customer</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Customer List */}
                        {getFilteredCustomers().map((customer: any) => {
                            const isSelected = selectedCustomers.some((selected: any) => selected.id === customer.id);
                            const displayName = customer.name || '';
                            const phoneDisplay = customer.contacts && customer.contacts[0] && customer.contacts[0].phone 
                                ? ` - ${customer.contacts[0].phone}` 
                                : '';
                            
                            return (
                                <TouchableOpacity 
                                    key={customer.id} 
                                    onPress={() => { 
                                        // Toggle customer selection
                                        if (isSelected) {
                                            setSelectedCustomers(selectedCustomers.filter((selected: any) => selected.id !== customer.id));
                                        } else {
                                            setSelectedCustomers([...selectedCustomers, customer]);
                                        }
                                    }} 
                                    className="p-4 border-b border-gray-100 flex-row items-center"
                                >
                                    <View className="flex-1">
                                        <Text className={`text-gray-800 ${isSelected ? 'font-bold text-blue-700' : ''}`}>
                                            {displayName}{phoneDisplay}
                                        </Text>
                                        {customer.isNew && (
                                            <Text className="text-xs text-blue-600 mt-1">New Customer</Text>
                                        )}
                                    </View>
                                    <View className={`w-5 h-5 rounded-full border-2 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                        {isSelected && (
                                            <View className="w-2 h-2 bg-white rounded-full self-center mt-1" />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                        
                        {getFilteredCustomers().length === 0 && (
                            <View className="p-8 items-center">
                                <Text className="text-gray-500 text-center">
                                    {customerSearchQuery.trim() ? 'No customers found' : 'No customers available'}
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                    
                    <View className="p-3 border-t border-gray-200 flex-row gap-2">
                        <TouchableOpacity 
                            onPress={() => {
                                // Update display with selected customers count
                                const customerCount = selectedCustomers.length;
                                if (customerCount > 0) {
                                    const displayText = customerCount === 1 
                                        ? `${selectedCustomers[0].name} selected`
                                        : `${customerCount} customers selected`;
                                    setCustomerAssociated(displayText);
                                } else {
                                    setCustomerAssociated('');
                                }
                                setShowCustomerModal(false);
                            }} 
                            className="flex-1 bg-blue-600 p-3 rounded-lg"
                        >
                            <Text className="text-center text-white font-medium">Done ({selectedCustomers.length})</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowCustomerModal(false)} className="flex-1 bg-gray-200 p-3 rounded-lg">
                            <Text className="text-center text-gray-700 font-medium">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderAddCustomerModal = () => (
        <Modal visible={showAddCustomerForm} transparent animationType="fade" onRequestClose={() => setShowAddCustomerForm(false)}>
            <View className="flex-1 bg-black/40 items-center justify-center px-4">
                <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
                    <View className="p-4 border-b border-gray-200">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-lg font-semibold text-gray-800">Add New Customer</Text>
                            <TouchableOpacity onPress={() => setShowAddCustomerForm(false)}>
                                <X size={20} color={COLORS.gray[600]} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    <View className="p-4">
                        <View className="mb-4">
                            <Text className="text-gray-700 font-medium mb-2">Customer Name *</Text>
                            <TextInput
                                className="w-full p-3 border border-gray-300 rounded-lg text-gray-800"
                                placeholder="Enter customer name"
                                value={newCustomerName}
                                onChangeText={setNewCustomerName}
                            />
                        </View>
                        
                        <View className="mb-4">
                            <Text className="text-gray-700 font-medium mb-2">Phone Number</Text>
                            <TextInput
                                className="w-full p-3 border border-gray-300 rounded-lg text-gray-800"
                                placeholder="Enter phone number (optional)"
                                value={newCustomerPhone}
                                onChangeText={setNewCustomerPhone}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>
                    
                    <View className="p-4 border-t border-gray-200 flex-row gap-2">
                        <TouchableOpacity 
                            onPress={handleAddCustomer}
                            className="flex-1 bg-blue-600 p-3 rounded-lg"
                        >
                            <Text className="text-center text-white font-medium">Add Customer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowAddCustomerForm(false)} className="flex-1 bg-gray-200 p-3 rounded-lg">
                            <Text className="text-center text-gray-700 font-medium">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderCalendarModal = () => (
        <Modal visible={showCalendarModal} transparent animationType="fade" onRequestClose={() => setShowCalendarModal(false)}>
            <View className="flex-1 bg-black/40 items-center justify-center px-4">
                <View className="bg-white rounded-2xl p-4 w-full max-w-md">
                    <Text className="text-gray-900 font-bold mb-3">Select Date of Sale</Text>
                    <RNCalendar
                        current={dateOfSale ? moment(dateOfSale, 'DD/MM/YYYY').format('YYYY-MM-DD') : new Date().toISOString().split('T')[0]}
                        onDayPress={handleDateSelect}
                        theme={{
                            todayTextColor: COLORS.primary,
                            selectedDayBackgroundColor: COLORS.primary,
                            selectedDayTextColor: '#fff',
                            arrowColor: COLORS.primary,
                        }}
                        markedDates={
                            dateOfSale
                                ? {
                                    [moment(dateOfSale, 'DD/MM/YYYY').format('YYYY-MM-DD')]: {
                                        selected: true,
                                        selectedColor: COLORS.primary,
                                    },
                                }
                                : undefined
                        }
                    />
                    <View className="flex-row justify-end mt-4">
                        <TouchableOpacity onPress={() => setShowCalendarModal(false)} className="px-4 py-2 rounded-lg bg-teal-600">
                            <Text className="text-white font-semibold">Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderContent = () => {
        switch (activeTab) {
            case "vehicle-details":
                return renderVehicleDetailsTab();
            case "associated-documents":
                return renderAssociatedDocumentsTab();
            case "service-schedule":
                return renderServiceScheduleTab();
            case "job-order-history":
                return renderJobOrderHistoryTab();
            default:
                return renderVehicleDetailsTab();
        }
    };

    const renderFooter = () => (
        <View className="border-t border-gray-300 px-4 py-3 flex-row justify-end gap-3">
            {mode === 'edit' ? (
                <>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="px-6 py-2 border border-gray-300 rounded-lg"
                    >
                        <Text className="text-sm text-gray-800">Cancel</Text>
                    </TouchableOpacity>
                    <Button 
                        title="Save Changes" 
                        onPress={handleSave}
                        className="px-6 py-2"
                    />
                </>
            ) : (
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="px-6 py-2 border border-gray-300 rounded-lg"
                >
                    <Text className="text-sm text-gray-800">Back</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderValidFromCalendarModal = () => (
        <Modal
            visible={showValidFromCalendar}
            transparent
            animationType="slide"
            onRequestClose={() => setShowValidFromCalendar(false)}
        >
            <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-white rounded-2xl w-11/12 max-w-md">
                    <View className="bg-teal-600 rounded-t-2xl px-6 py-4">
                        <Text className="text-white font-bold text-lg">Select Valid From Date</Text>
                        <Text className="text-teal-100 text-sm mt-1">
                            {calendarStep === 'year' ? 'Step 1: Choose Year' : calendarStep === 'month' ? 'Step 2: Choose Month' : 'Step 3: Choose Day'}
                        </Text>
                        {/* Breadcrumb */}
                        <View className="flex-row items-center mt-2">
                            <TouchableOpacity onPress={() => setCalendarStep('year')}>
                                <Text className={`text-sm font-semibold ${calendarStep === 'year' ? 'text-white' : 'text-teal-200'}`}>{pickYear}</Text>
                            </TouchableOpacity>
                            {calendarStep !== 'year' && (
                                <>
                                    <Text className="text-teal-200 mx-1">›</Text>
                                    <TouchableOpacity onPress={() => setCalendarStep('month')}>
                                        <Text className={`text-sm font-semibold ${calendarStep === 'month' ? 'text-white' : 'text-teal-200'}`}>
                                            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][pickMonth]}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                            {calendarStep === 'day' && (
                                <>
                                    <Text className="text-teal-200 mx-1">›</Text>
                                    <Text className="text-white text-sm font-semibold">Day</Text>
                                </>
                            )}
                        </View>
                    </View>

                    <View className="p-4">
                        {/* STEP 1: Year Selection - 8 rows visible, scrollable for more */}
                        {calendarStep === 'year' && (
                            <FlatList
                                data={Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i)}
                                keyExtractor={(item) => item.toString()}
                                numColumns={3}
                                renderItem={({ item: year }) => {
                                    const isSelected = year === pickYear;
                                    const isFuture = year > new Date().getFullYear();
                                    return (
                                        <TouchableOpacity
                                            disabled={isFuture}
                                            onPress={() => { setPickYear(year); setCalendarStep('month'); }}
                                            className={`flex-1 m-1 py-3 rounded-xl items-center justify-center ${isSelected ? 'bg-teal-600' : 'bg-gray-50 border border-gray-200'} ${isFuture ? 'opacity-30' : ''}`}
                                        >
                                            <Text className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-700'}`}>{year}</Text>
                                        </TouchableOpacity>
                                    );
                                }}
                                style={{ maxHeight: 320 }} // 8 rows * 40px height
                            />
                        )}

                        {/* STEP 2: Month Selection */}
                        {calendarStep === 'month' && (
                            <View className="flex-row flex-wrap">
                                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((monthName, idx) => {
                                    const isSelected = idx === pickMonth;
                                    const isFuture = pickYear === new Date().getFullYear() && idx > new Date().getMonth();
                                    return (
                                        <TouchableOpacity
                                            key={monthName}
                                            disabled={isFuture}
                                            onPress={() => { setPickMonth(idx); setCalendarStep('day'); }}
                                            className={`w-1/3 p-1`}
                                        >
                                            <View className={`py-3 rounded-xl items-center ${isSelected ? 'bg-teal-600' : 'bg-gray-50 border border-gray-200'} ${isFuture ? 'opacity-30' : ''}`}>
                                                <Text className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-gray-700'}`}>{monthName.slice(0,3)}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}

                        {/* STEP 3: Day Selection */}
                        {calendarStep === 'day' && (() => {
                            const daysInMonth = new Date(pickYear, pickMonth + 1, 0).getDate();
                            const firstDayOfWeek = new Date(pickYear, pickMonth, 1).getDay();
                            const now = new Date();
                            const isCurrentMonth = pickYear === now.getFullYear() && pickMonth === now.getMonth();
                            
                            return (
                                <View>
                                    <View className="flex-row justify-between items-center mb-4">
                                        <TouchableOpacity onPress={() => setCalendarStep('month')} className="p-2">
                                            <ChevronLeft size={20} color="#0d9488" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => setCalendarStep('month')}>
                                            <Text className="text-base font-bold text-teal-700">
                                                {['January','February','March','April','May','June','July','August','September','October','November','December'][pickMonth]} {pickYear}
                                            </Text>
                                        </TouchableOpacity>
                                        <View className="w-8" />
                                    </View>
                                    
                                    <View className="flex-row flex-wrap">
                                        {['S','M','T','W','T','F','S'].map((day, index) => (
                                            <View key={`${day}-${index}`} className="w-1/7 p-2">
                                                <Text className="text-xs text-center text-gray-500 font-semibold">{day}</Text>
                                            </View>
                                        ))}
                                        {Array.from({ length: firstDayOfWeek }, (_, i) => (
                                            <View key={`empty-${i}`} className="w-1/7 p-2" />
                                        ))}
                                        {Array.from({ length: daysInMonth }, (_, i) => {
                                            const day = i + 1;
                                            const isSelected = false;
                                            const isPast = isCurrentMonth && day > now.getDate();
                                            const dateStr = `${pickYear}-${String(pickMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                            
                                            return (
                                                <TouchableOpacity
                                                    key={day}
                                                    disabled={isPast}
                                                    onPress={() => handleInsuranceDateSelect(dateStr)}
                                                    className={`w-1/7 p-2 ${isPast ? 'opacity-30' : ''}`}
                                                >
                                                    <View className={`w-8 h-8 rounded-full items-center justify-center ${isSelected ? 'bg-teal-600' : ''}`}>
                                                        <Text className={`text-sm ${isSelected ? 'text-white' : isPast ? 'text-gray-400' : 'text-gray-700'}`}>{day}</Text>
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
                        {calendarStep !== 'year' ? (
                            <TouchableOpacity onPress={() => setCalendarStep(calendarStep === 'day' ? 'month' : 'year')} className="px-4 py-2 rounded-lg bg-gray-100">
                                <Text className="text-teal-700 font-semibold">Back</Text>
                            </TouchableOpacity>
                        ) : <View />}
                        <TouchableOpacity onPress={() => setShowValidFromCalendar(false)} className="px-4 py-2 rounded-lg bg-gray-100">
                            <Text className="text-gray-600 font-semibold">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderValidToCalendarModal = () => (
        <Modal
            visible={showValidToCalendar}
            transparent
            animationType="slide"
            onRequestClose={() => setShowValidToCalendar(false)}
        >
            <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-white rounded-2xl w-11/12 max-w-md">
                    <View className="bg-teal-600 rounded-t-2xl px-6 py-4">
                        <Text className="text-white font-bold text-lg">Select Valid To Date</Text>
                        <Text className="text-teal-100 text-sm mt-1">
                            {calendarStep === 'year' ? 'Step 1: Choose Year' : calendarStep === 'month' ? 'Step 2: Choose Month' : 'Step 3: Choose Day'}
                        </Text>
                        {/* Breadcrumb */}
                        <View className="flex-row items-center mt-2">
                            <TouchableOpacity onPress={() => setCalendarStep('year')}>
                                <Text className={`text-sm font-semibold ${calendarStep === 'year' ? 'text-white' : 'text-teal-200'}`}>{pickYear}</Text>
                            </TouchableOpacity>
                            {calendarStep !== 'year' && (
                                <>
                                    <Text className="text-teal-200 mx-1">›</Text>
                                    <TouchableOpacity onPress={() => setCalendarStep('month')}>
                                        <Text className={`text-sm font-semibold ${calendarStep === 'month' ? 'text-white' : 'text-teal-200'}`}>
                                            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][pickMonth]}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                            {calendarStep === 'day' && (
                                <>
                                    <Text className="text-teal-200 mx-1">›</Text>
                                    <Text className="text-white text-sm font-semibold">Day</Text>
                                </>
                            )}
                        </View>
                    </View>

                    <View className="p-4">
                        {/* STEP 1: Year Selection - 8 rows visible, scrollable for more */}
                        {calendarStep === 'year' && (
                            <FlatList
                                data={Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i)}
                                keyExtractor={(item) => item.toString()}
                                numColumns={3}
                                renderItem={({ item: year }) => {
                                    const isSelected = year === pickYear;
                                    const isFuture = year > new Date().getFullYear();
                                    return (
                                        <TouchableOpacity
                                            disabled={isFuture}
                                            onPress={() => { setPickYear(year); setCalendarStep('month'); }}
                                            className={`flex-1 m-1 py-3 rounded-xl items-center justify-center ${isSelected ? 'bg-teal-600' : 'bg-gray-50 border border-gray-200'} ${isFuture ? 'opacity-30' : ''}`}
                                        >
                                            <Text className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-700'}`}>{year}</Text>
                                        </TouchableOpacity>
                                    );
                                }}
                                style={{ maxHeight: 320 }} // 8 rows * 40px height
                            />
                        )}

                        {/* STEP 2: Month Selection */}
                        {calendarStep === 'month' && (
                            <View className="flex-row flex-wrap">
                                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((monthName, idx) => {
                                    const isSelected = idx === pickMonth;
                                    const isFuture = pickYear === new Date().getFullYear() && idx > new Date().getMonth();
                                    return (
                                        <TouchableOpacity
                                            key={monthName}
                                            disabled={isFuture}
                                            onPress={() => { setPickMonth(idx); setCalendarStep('day'); }}
                                            className={`w-1/3 p-1`}
                                        >
                                            <View className={`py-3 rounded-xl items-center ${isSelected ? 'bg-teal-600' : 'bg-gray-50 border border-gray-200'} ${isFuture ? 'opacity-30' : ''}`}>
                                                <Text className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-gray-700'}`}>{monthName.slice(0,3)}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}

                        {/* STEP 3: Day Selection */}
                        {calendarStep === 'day' && (() => {
                            const daysInMonth = new Date(pickYear, pickMonth + 1, 0).getDate();
                            const firstDayOfWeek = new Date(pickYear, pickMonth, 1).getDay();
                            const now = new Date();
                            const isCurrentMonth = pickYear === now.getFullYear() && pickMonth === now.getMonth();
                            
                            return (
                                <View>
                                    <View className="flex-row justify-between items-center mb-4">
                                        <TouchableOpacity onPress={() => setCalendarStep('month')} className="p-2">
                                            <ChevronLeft size={20} color="#0d9488" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => setCalendarStep('month')}>
                                            <Text className="text-base font-bold text-teal-700">
                                                {['January','February','March','April','May','June','July','August','September','October','November','December'][pickMonth]} {pickYear}
                                            </Text>
                                        </TouchableOpacity>
                                        <View className="w-8" />
                                    </View>
                                    
                                    <View className="flex-row flex-wrap">
                                        {['S','M','T','W','T','F','S'].map((day, index) => (
                                            <View key={`${day}-${index}`} className="w-1/7 p-2">
                                                <Text className="text-xs text-center text-gray-500 font-semibold">{day}</Text>
                                            </View>
                                        ))}
                                        {Array.from({ length: firstDayOfWeek }, (_, i) => (
                                            <View key={`empty-${i}`} className="w-1/7 p-2" />
                                        ))}
                                        {Array.from({ length: daysInMonth }, (_, i) => {
                                            const day = i + 1;
                                            const isSelected = false;
                                            const isPast = isCurrentMonth && day > now.getDate();
                                            const dateStr = `${pickYear}-${String(pickMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                            
                                            return (
                                                <TouchableOpacity
                                                    key={day}
                                                    disabled={isPast}
                                                    onPress={() => handleInsuranceDateSelect(dateStr)}
                                                    className={`w-1/7 p-2 ${isPast ? 'opacity-30' : ''}`}
                                                >
                                                    <View className={`w-8 h-8 rounded-full items-center justify-center ${isSelected ? 'bg-teal-600' : ''}`}>
                                                        <Text className={`text-sm ${isSelected ? 'text-white' : isPast ? 'text-gray-400' : 'text-gray-700'}`}>{day}</Text>
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
                        {calendarStep !== 'year' ? (
                            <TouchableOpacity onPress={() => setCalendarStep(calendarStep === 'day' ? 'month' : 'year')} className="px-4 py-2 rounded-lg bg-gray-100">
                                <Text className="text-teal-700 font-semibold">Back</Text>
                            </TouchableOpacity>
                        ) : <View />}
                        <TouchableOpacity onPress={() => setShowValidToCalendar(false)} className="px-4 py-2 rounded-lg bg-gray-100">
                            <Text className="text-gray-600 font-semibold">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="flex-1">
                {renderHeader()}
                {renderTabNavigation()}
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                >
                    <View className="bg-white rounded-xl border border-gray-100 p-4">
                        {renderContent()}
                    </View>
                </ScrollView>
                {renderFooter()}
            </View>
            {renderManufacturerModal()}
            {renderModelModal()}
            {renderColorModal()}
            {renderVehicleTypeModal()}
            {renderCustomerModal()}
            {renderAddCustomerModal()}
            {renderCalendarModal()}
            {renderValidFromCalendarModal()}
            {renderValidToCalendarModal()}
            {/* Customer Dropdown Modal */}
            {customerDropdownVisible && (
                <Modal 
                    visible={customerDropdownVisible} 
                    transparent 
                    animationType="fade" 
                    onRequestClose={() => setCustomerDropdownVisible(false)}
                >
                    <View className="flex-1 bg-black/40 items-center justify-center px-4">
                        <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '80%' }}>
                            <View className="p-4 border-b border-gray-200">
                                <View className="flex-row justify-between items-center mb-3">
                                    <Text className="text-lg font-semibold text-gray-800">Select Customer</Text>
                                    <TouchableOpacity onPress={() => setCustomerDropdownVisible(false)}>
                                        <X size={20} color={COLORS.gray[600]} />
                                    </TouchableOpacity>
                                </View>
                                
                                {/* Search Input */}
                                <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                                    <Search size={16} color={COLORS.gray[400]} />
                                    <TextInput
                                        className="flex-1 ml-2 text-gray-800"
                                        placeholder="Search customers..."
                                        value={customerSearchQuery}
                                        onChangeText={handleCustomerDropdownSearch}
                                        autoFocus={true}
                                    />
                                </View>
                            </View>
                            
                            <ScrollView>
                                {/* Customer List with checkboxes */}
                                {customerDropdownData.map((customer: any) => {
                                    // Format display value as "customername - mobilenumber"
                                    let phoneDisplay = '';
                                    if (customer.contacts && Array.isArray(customer.contacts)) {
                                        if (customer.contacts.length > 0) {
                                            const firstContact = customer.contacts[0];
                                            // Handle case where contacts is an array of arrays
                                            if (Array.isArray(firstContact) && firstContact.length > 0) {
                                                phoneDisplay = firstContact[0].phone ? firstContact[0].phone : '';
                                            } else if (firstContact.phone) {
                                                phoneDisplay = firstContact.phone;
                                            }
                                        }
                                    }
                                    
                                    const displayValue = phoneDisplay ? `${customer.name} - ${phoneDisplay}` : customer.name;
                                    const isSelected = selectedCustomers.some((selected: any) => selected.id === customer.id);
                                    
                                    return (
                                        <TouchableOpacity 
                                            key={customer.id} 
                                            onPress={() => handleCustomerSelection(customer)}
                                            className="p-4 border-b border-gray-100 flex-row items-center"
                                        >
                                            <View className="flex-1">
                                                <Text className={`text-gray-800 ${isSelected ? 'font-bold text-blue-700' : ''}`}>
                                                    {displayValue}
                                                </Text>
                                            </View>
                                            <View className={`w-5 h-5 rounded-full border-2 ${
                                                isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                            }`}>
                                                {isSelected && (
                                                    <View className="w-2 h-2 bg-white rounded-full self-center mt-1" />
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                                
                                {customerDropdownData.length === 0 && (
                                    <View className="p-8 items-center">
                                        <Text className="text-gray-500 text-center">
                                            {customerSearchQuery.trim() ? 'No customers found' : 'No customers available'}
                                        </Text>
                                    </View>
                                )}
                            </ScrollView>
                            
                            {/* Add Customer Button */}
                            <TouchableOpacity 
                                onPress={() => {
                                    setCustomerDropdownVisible(false);
                                    setShowAddCustomerForm(true);
                                }}
                                className="p-4 border-t border-gray-200 bg-blue-50"
                            >
                                <View className="flex-row items-center justify-center">
                                    <Plus size={20} color={COLORS.primary} />
                                    <Text className="ml-2 text-blue-600 font-medium">Add New Customer</Text>
                                </View>
                            </TouchableOpacity>
                            
                            {/* Done Button */}
                            <View className="p-3 border-t border-gray-200">
                                <TouchableOpacity 
                                    onPress={() => {
                                        setCustomerDropdownVisible(false);
                                        setCustomerSearchQuery('');
                                    }} 
                                    className="bg-blue-600 p-3 rounded-lg"
                                >
                                    <Text className="text-center text-white font-medium">Done ({selectedCustomers.length})</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
};

export default VehicleDetailsScreen;
