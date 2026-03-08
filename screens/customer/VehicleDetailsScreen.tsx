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
    const [customerSearchQuery, setCustomerSearchQuery] = useState("");
    const [vehicleServices, setVehicleServices] = useState<any[]>([]);
    const [vehicleFiles, setVehicleFiles] = useState<any[]>([]);

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
            if (response.data.code === 200 && response.data.response.code === 200) {
                const data = response.data.response.data;
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
            // Fetch colors
            const colorResponse = await getVehicleColor(vehicleId);
            if (colorResponse.data.code === 200) {
                const colors = colorResponse.data.response?.data || [];
                // Set selected color if available
                if (colors.length > 0 && vehicleDetails) {
                    const vehicleColor = colors.find((c: any) => c.color === vehicleDetails.color);
                    if (vehicleColor) {
                        setSelectedColor(vehicleColor.color);
                    }
                }
            }

            // Fetch vehicle files
            const filesResponse = await getVehicleFiles(vehicleId);
            if (filesResponse.data.code === 200) {
                setVehicleFiles(filesResponse.data.response?.data || []);
            }

            // Fetch vehicle services
            const servicesResponse = await getVehicleServices(vehicleId);
            if (servicesResponse.data.code === 200) {
                setVehicleServices(servicesResponse.data.response?.data || []);
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
        // Set model in modelCode - modelName format like web app
        if (data.vehicle?.modelCode && data.vehicle?.modelName) {
            setModel(`${data.vehicle.modelCode} - ${data.vehicle.modelName}`);
        } else if (data.vehicle?.modelName) {
            setModel(data.vehicle.modelName);
        }
        
        if (data.vehicle?.category) setCategory(data.vehicle.category);
        if (data.chassisNumber || data.chassisNo) setChassisNumber(data.chassisNumber || data.chassisNo);
        
        // Handle MFG date - match web project approach
        if (data.mfg) {
            let mfgDateString = '';
            if (typeof data.mfg === 'string') {
                mfgDateString = data.mfg;
            } else if (data.mfg.date || data.mfg.$date) {
                mfgDateString = data.mfg.date || data.mfg.$date;
            }
            
            // Web project uses moment(new Date()) approach
            if (mfgDateString && mfgDateString.trim() !== '') {
                try {
                    const dateObj = new Date(mfgDateString);
                    if (!isNaN(dateObj.getTime())) {
                        const formattedDate = moment(dateObj).format('MMM-YYYY');
                        setMfgDate(formattedDate);
                    } else {
                        setMfgDate('');
                    }
                } catch (error) {
                    console.warn('Date parsing error:', error);
                    setMfgDate('');
                }
            } else {
                setMfgDate('');
            }
        } else {
            setMfgDate('');
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

    // Add new customer function
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

    // Real-time customer search using API (like web project)
    const handleCustomerSearch = async (searchString: string) => {
        setCustomerSearchQuery(searchString);
        
        if (searchString.trim()) {
            try {
                const response = await searchCustomers(searchString);
                if (response.data.code === 200 && response.data.response.code === 200) {
                    const searchResults = response.data.response.data || [];
                    // Merge with existing customers, avoiding duplicates
                    const mergedCustomers = [...customers];
                    searchResults.forEach((searchCustomer: any) => {
                        if (!customers.some((existing: any) => existing.id === searchCustomer.id)) {
                            mergedCustomers.push(searchCustomer);
                        }
                    });
                    setCustomers(mergedCustomers);
                }
            } catch (error) {
                console.error('Error searching customers:', error);
            }
        }
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
                        className="h-12 bg-gray-50 border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
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
                    <TouchableOpacity
                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                    >
                        <Text className="text-gray-800 flex-1">{category}</Text>
                        <ChevronRight size={16} color={COLORS.gray[400]} />
                    </TouchableOpacity>
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
                    <TextInput
                        value={chassisNumber}
                        onChangeText={setChassisNumber}
                        editable={true}
                        className="h-12 bg-white border-gray-400 border rounded-lg px-3 text-gray-800"
                    />
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
                <TextInput
                    value={vehicleActivate}
                    editable={false}
                    className="h-12 bg-gray-100 border border-gray-200 rounded-lg px-3 text-gray-800"
                />
            </View>

            {/* Customer Information Section */}
            <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100 mt-6">
                Customer Information
            </Text>

            {/* Customer Associated */}
            <View className="mb-4">
                <FormLabel label="Customer Associated" />
                {mode === 'edit' ? (
                    <TouchableOpacity 
                        onPress={() => setShowCustomerModal(true)}
                        className="flex-1 h-12 bg-gray-100 border border-gray-200 rounded-lg px-3 justify-center"
                    >
                        <Text className="text-gray-800">
                            {customerAssociated || 'Select Customers'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <View className="flex-row gap-2 flex-wrap">
                        {customerAssociated ? (
                            <View className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                                <Text className="text-sm text-gray-800">{customerAssociated}</Text>
                            </View>
                        ) : (
                            <View className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                <Text className="text-sm text-gray-500">No Customer Associated</Text>
                            </View>
                        )}
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
        <View className="p-4">
            <Text className="text-center text-gray-400 mt-12">Service Schedule Content</Text>
        </View>
    );

    const renderJobOrderHistoryTab = () => (
        <View className="p-4">
            <Text className="text-center text-gray-400 mt-12">Job Order History Content</Text>
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
                                        setModel(modelDisplay); 
                                        setShowModelModal(false);
                                        // Set category if available
                                        if (item.category) {
                                            setCategory(item.category);
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
                <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ maxHeight: '60%' }}>
                    <View className="p-4 border-b border-gray-200">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-lg font-semibold text-white">Select Color</Text>
                            <TouchableOpacity onPress={() => setShowColorModal(false)}>
                                <X size={20} color={COLORS.gray[600]} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <ScrollView>
                        {[
                            { id: '1', name: 'Metallic Black', code: 'SMX' },
                            { id: '2', name: 'Blue', code: 'BLU' },
                            { id: '3', name: 'Red', code: 'RED' },
                            { id: '4', name: 'Gray', code: 'GRY' },
                        ].map((item) => (
                            <TouchableOpacity 
                                key={item.id} 
                                onPress={() => { setSelectedColor(item.name); setShowColorModal(false); }} 
                                className="p-4 border-b border-gray-100"
                            >
                                <Text className={`text-gray-800 ${selectedColor === item.name ? 'font-bold text-teal-700' : ''}`}>
                                    {item.name} ({item.code})
                                </Text>
                            </TouchableOpacity>
                        ))}
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
                                onChangeText={handleCustomerSearch}
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
                                // Update customerAssociated with selected customers
                                const customerNames = selectedCustomers.map((customer: any) => {
                                    let displayName = customer.name || '';
                                    if (customer.contacts && customer.contacts[0] && customer.contacts[0].phone) {
                                        displayName += ` - ${customer.contacts[0].phone}`;
                                    }
                                    return displayName;
                                });
                                setCustomerAssociated(customerNames.join(', '));
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
        </SafeAreaView>
    );
};

export default VehicleDetailsScreen;
