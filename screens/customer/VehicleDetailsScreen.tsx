import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    Image,
    KeyboardAvoidingView,
    Platform,
    DeviceEventEmitter,
    StatusBar,
    Linking,
    PermissionsAndroid
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { RouteProp, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    X,
    Search,
    Plus,
    ArrowLeft,
    ChevronDown,
    Clock,
    Check,
    AlertCircle,
    FileText,
    Download,
    Eye,
    Camera,
    Image as ImageIcon,
    Trash2,
    Edit,
    Save,
    Users,
    Phone,
    Mail,
    MapPin,
    Info,
    Upload,
    FolderOpen,
    QrCode as QrCodeIcon,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { COLORS } from '../../constants/colors';
import { BackButton, HeaderWithBack, useBackButton } from '../../components/ui/BackButton';
import { Button } from '../../components/ui/Button';
import BulkInsuranceUpload from '../../components/BulkInsuranceUpload';
import { Calendar as RNCalendar } from 'react-native-calendars';
import moment from 'moment';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import platformApi from '../../src/api';
// API imports for validation
import {
    getVehicleById,
    getVehicleManufacturers,
    getVehicleModelsByManufacturer,
    getVehicleModelsByManufacturerId,
    getVehicleColor,
    getVehicleFiles,
    getVehicleEReceipt,
    getVehicleServices,
    getVehicleCustomers,
    searchCustomers,
    updateVehicle,
    validateChassisNumber,
    validateEngineNumber,
    validateRegistrationNumber,
    fetchMarketInfo,
    getVehicleInsurance,
    getJobOrderHistory,
    getJobOrderDetails,
    addInsurance,
    getInsuranceTypes,
    generateQRCode,
    generateJobOrderPDF,
} from '../../src/api';
import { uploadVehicleFile, deleteVehicleFile } from '../../src/api';

// Document type mapping to match web project database
const DOCUMENT_TYPE_MAPPING: { [key: string]: string } = {
    'address_proof': 'addressproof',
    'chassis_impression': 'chassisimpression',
    'form_22': 'form22',
    'form_21': 'form21',
    'signature': 'signature',
    'pan_card_form60': 'pancard_form60',
    'vehicle_right': 'right',
    'vehicle_left': 'left',
    'vehicle_front': 'front',
    'vehicle_rear': 'rear',
    'sales_invoice': 'invoice',
    'disclaimer': 'disclaimer',
    'form_14': 'form14',
    'inspection_certificate': 'inspectioncertificate',
    'insurance': 'insurance',
    'registration': 'registration',
    'pollution': 'pollution',
    'consent': 'consent'
};

// Reverse mapping for display
const REVERSE_DOCUMENT_MAPPING: { [key: string]: string } = {};
Object.entries(DOCUMENT_TYPE_MAPPING).forEach(([mobile, web]) => {
    REVERSE_DOCUMENT_MAPPING[web] = mobile;
});

type VehicleDetailsRouteProp = RouteProp<RootStackParamList, 'VehicleDetails'>;
type VehicleDetailsNavigationProp = NavigationProp<RootStackParamList, 'VehicleDetails'>;

interface Vehicle {
    id: string;
    vehicle?: {
        id: string;
        modelName: string;
        modelCode: string;
        category?: string;
        manufacturer?: {
            name: string;
        };
    };
    registerNo: string;
    chassisNo: string;
    color?: {
        id?: string;
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
    engineNo?: string;
    vehicleType?: string;
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

    // Handle color selection from SelectVehicleColor screen
    useEffect(() => {
        const unsubscribe = DeviceEventEmitter.addListener('colorSelected', (colorData) => {
            console.log('🎨 VehicleDetails - Received colorSelected event:', colorData);
            if (colorData) {
                // Display color in "(code-colorname)" format
                const colorDisplay = colorData.code && colorData.color
                    ? `(${colorData.code}-${colorData.color})`
                    : colorData.color || colorData.name || 'No Color Chosen';
                console.log('🎨 VehicleDetails - Setting color to:', colorDisplay);
                setSelectedColor(colorDisplay);
                if (colorData.id) {
                    setSelectedColorId(colorData.id);
                }
            } else {
                console.log('🎨 VehicleDetails - No color data received');
            }
        });

        return () => unsubscribe.remove();
    }, []);

    // Handle vehicle selection from SelectVehicleForDetails screen
    useFocusEffect(
        useCallback(() => {
            const unsubscribe = DeviceEventEmitter.addListener('vehicleSelected', (vehicleData) => {
                if (vehicleData) {
                    console.log('Received vehicle data:', vehicleData);

                    // Update form fields with selected vehicle data
                    if (vehicleData.modelName) {
                        setModel(vehicleData.modelName);
                    }
                    if (vehicleData.category) {
                        setCategory(vehicleData.category);
                    }
                    if (vehicleData.color) {
                        setSelectedColor(vehicleData.color);
                    }
                    if (vehicleData.manufacturer) {
                        setManufacturerName(vehicleData.manufacturer);
                    }
                }
            });

            return () => unsubscribe.remove();
        }, [])
    );

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
    const [qrCodeData, setQrCodeData] = useState<string>('');
    const [showQrCode, setShowQrCode] = useState<boolean>(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showBulkInsuranceModal, setShowBulkInsuranceModal] = useState(false);

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
    const [insuranceData, setInsuranceData] = useState<any[]>([]);
    const [jobOrderHistory, setJobOrderHistory] = useState<any[]>([]);
    const [eReceiptUrl, setEReceiptUrl] = useState<string | null>(null);

    // Form states - initialize with empty values for real data fetching
    const [manufacturerName, setManufacturerName] = useState("");
    const [model, setModel] = useState("");
    const [category, setCategory] = useState("");
    const [selectedColor, setSelectedColor] = useState("No Color Chosen");
    const [selectedColorId, setSelectedColorId] = useState("");
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
    const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
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
    const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: { name: string | null, uri: string, url?: string, size?: number, mimeType?: string, type?: string, id?: string } | null }>({
        consent: null,
        insurance: null,
        registration: null,
        pollution: null,
    });
    const [showImageViewer, setShowImageViewer] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Fetch vehicle details on component mount
    useEffect(() => {
        if (vehicle?.id) {
            fetchVehicleDetails(vehicle.id);
        }
        fetchManufacturers();
        loadSavedFiles(); // Load saved files

        // Debug permissions on component mount
        checkPermissions().then(result => {
            console.log('Initial permission check result:', result);
        });
    }, [vehicle?.id]);

    // Fetch vehicle details from API
    // Fetch color from vehicle master when API doesn't return color data
    const fetchColorFromVehicleMaster = async () => {
        try {
            console.log('🎨 Attempting to fetch color from vehicle master...');

            // We need to wait for vehicleDetails to be set first
            if (!vehicleDetails) {
                console.log('🎨 Vehicle details not available yet, will retry later');
                return;
            }

            const vehicleData = vehicleDetails.data || vehicleDetails;
            const manufacturerId = vehicleData.vehicle?.manufacturer?.id;
            const modelName = vehicleData.vehicle?.modelName;

            if (!manufacturerId) {
                console.log('🎨 No manufacturer ID found, cannot fetch colors');
                return;
            }

            console.log('🎨 Fetching models for manufacturer:', manufacturerId);
            const response = await getVehicleModelsByManufacturerId(manufacturerId);

            if (response.data.code === 200) {
                const models = response.data.response.data || [];
                console.log('🎨 Found models:', models.length);

                // Find the matching model
                const model = models.find((m: any) =>
                    m.modelName === modelName ||
                    `${m.modelCode} - ${m.modelName}` === modelName ||
                    m.id === vehicleData.vehicle?.modelId
                );

                if (model) {
                    console.log('🎨 Found matching model:', model.modelName);

                    // Get colors from the model's image array
                    const colors = [];
                    const colorSet = new Set();

                    // Extract colors from image array
                    if (model.image && Array.isArray(model.image)) {
                        model.image.forEach((imageData: any) => {
                            const colorName = imageData.color || imageData.colorName || 'Unknown';
                            const colorCode = imageData.code || imageData.colorCode || '';

                            if (!colorSet.has(colorName)) {
                                colorSet.add(colorName);
                                colors.push({
                                    code: colorCode,
                                    color: colorName,
                                    id: imageData.id || '',
                                    url: imageData.url || ''
                                });
                            }
                        });
                    }

                    if (colors.length > 0) {
                        // For now, set the first available color
                        // In a real implementation, you'd need to determine which color is actually assigned
                        const firstColor = colors[0];
                        const colorDisplay = `(${firstColor.code}-${firstColor.color})`;

                        console.log('🎨 Setting color from vehicle master:', colorDisplay);
                        setSelectedColor(colorDisplay);

                        // Update the colorToSet variable that will be used
                        return colorDisplay;
                    } else {
                        console.log('🎨 No colors found in model data');
                    }
                } else {
                    console.log('🎨 No matching model found for:', modelName);
                }
            } else {
                console.log('🎨 Failed to fetch vehicle models:', response.data);
            }
        } catch (error) {
            console.error('🎨 Error fetching color from vehicle master:', error);
        }

        return 'No Color Chosen';
    };

    const fetchVehicleDetails = async (vehicleId: string) => {
        try {
            setLoading(true);
            console.log('🔍 Fetching vehicle details for:', vehicleId);

            // Check if token exists before making API call
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                Alert.alert('Authentication Error', 'Please login again');
                navigation.navigate('Login');
                return;
            }

            console.log('Token found:', token.substring(0, 20) + '...');

            const response = await getVehicleById(vehicleId);
            console.log('🔍 Full vehicle details response:', JSON.stringify(response.data, null, 2));
            console.log('🔍 Vehicle color field:', response.data.response?.color);
            console.log('🔍 Vehicle color type:', typeof response.data.response?.color);

            if (response.data.code === 200) {
                console.log('🔍 Vehicle color from backend:', response.data.response.color);
                console.log('🔍 Vehicle color type:', typeof response.data.response.color);

                // Set vehicle details first
                setVehicleDetails(response.data.response);

                // Immediately parse and set the color from the response
                const vehicleData = response.data.response.data || response.data.response;
                console.log('🎨 Processing color from response:', {
                    color: vehicleData.color,
                    vehicleColor: vehicleData.vehicleColor,
                    rawResponse: response.data.response
                });

                // Try to extract color from various possible locations
                let colorToSet = 'No Color Chosen';

                // Check for web app format first (color and vehicleColor fields)
                if (vehicleData.color && vehicleData.vehicleColor) {
                    // Format as (code-colorname)
                    colorToSet = `(${vehicleData.color}-${vehicleData.vehicleColor})`;
                    console.log('🎨 Setting color from web format (color+vehicleColor):', colorToSet);
                }
                // Check for object format with code and color
                else if (vehicleData.color && typeof vehicleData.color === 'object') {
                    if (vehicleData.color.code && vehicleData.color.color) {
                        colorToSet = `(${vehicleData.color.code}-${vehicleData.color.color})`;
                        console.log('🎨 Setting color from object with code/color:', colorToSet);
                    } else if (vehicleData.color.color) {
                        colorToSet = vehicleData.color.color;
                        console.log('🎨 Setting color from object with color only:', colorToSet);
                    }
                }
                // Check for string format
                else if (vehicleData.color && typeof vehicleData.color === 'string') {
                    colorToSet = vehicleData.color;
                    console.log('🎨 Setting color from string:', colorToSet);
                }
                // Check for vehicleColor only
                else if (vehicleData.vehicleColor && typeof vehicleData.vehicleColor === 'string') {
                    colorToSet = vehicleData.vehicleColor;
                    console.log('🎨 Setting color from vehicleColor only:', colorToSet);
                }

                // If color is not found, try to fetch it from vehicle master
                if (colorToSet === 'No Color Chosen') {
                    console.log('🎨 Color not found in API response, trying vehicle master...');
                    const masterColor = await fetchColorFromVehicleMaster();
                    colorToSet = masterColor || 'No Color Chosen';
                }

                setSelectedColor(colorToSet);
                if (vehicleData.color && typeof vehicleData.color === 'object' && vehicleData.color.id) {
                    setSelectedColorId(vehicleData.color.id);
                }
                console.log('🎨 Color set immediately after fetch:', colorToSet);

                // Fetch related data
                await fetchRelatedData(vehicleId);
            } else {
                console.error('Vehicle details API error:', response.data);
                Alert.alert('Error', 'Failed to fetch vehicle details');
            }
        } catch (error: any) {
            console.error('Error fetching vehicle details:', error);

            if (error.response?.status === 401) {
                console.error('Authentication failed - 401 error');
                Alert.alert(
                    'Session Expired',
                    'Your session has expired. Please login again.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Login',
                            onPress: () => {
                                AsyncStorage.removeItem('token');
                                navigation.navigate('Login');
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('Error', 'Failed to fetch vehicle details');
            }
        } finally {
            setLoading(false);
        }
    };

    // Populate form fields when vehicleDetails are loaded
    useEffect(() => {
        if (vehicleDetails) {
            console.log('=== VEHICLE DETAILS DATA POPULATION ===');

            // IMPORTANT: The actual data is nested under vehicleDetails.data
            const vehicleData = vehicleDetails.data || vehicleDetails;

            console.log('Raw vehicleData:', vehicleData);

            // MFG Date - this is in vehicleData.mfg
            console.log('MFG DATE:');
            console.log('- vehicleData.mfg:', vehicleData.mfg);
            if (vehicleData.mfg) {
                setMfgDate(vehicleData.mfg);
                console.log('✅ MFG date set to:', vehicleData.mfg);
            } else {
                console.log('❌ MFG date not found');
            }

            // Engine Number - this is in vehicleData.engineNo
            console.log('ENGINE NUMBER:');
            console.log('- vehicleData.engineNo:', vehicleData.engineNo);
            if (vehicleData.engineNo) {
                setEngineNumber(vehicleData.engineNo);
                console.log('✅ Engine number set to:', vehicleData.engineNo);
            } else {
                console.log('❌ Engine number not found');
            }

            // Vehicle Type - this is in vehicleData.vehicleType
            console.log('VEHICLE TYPE:');
            console.log('- vehicleData.vehicleType:', vehicleData.vehicleType);
            if (vehicleData.vehicleType) {
                setVehicleType(vehicleData.vehicleType);
                console.log('✅ Vehicle type set to:', vehicleData.vehicleType);
            } else {
                console.log('❌ Vehicle type not found');
            }

            // COLOR - DON'T OVERRIDE if already set by the direct response handler
            console.log('🎨 COLOR DATA IN POPULATE:');
            console.log('- Current selectedColor:', selectedColor);
            console.log('- vehicleData.color:', vehicleData.color);
            console.log('- vehicleData.vehicleColor:', vehicleData.vehicleColor);

            // Only set color if it's still "No Color Chosen" (meaning it wasn't set by the direct response handler)
            if (selectedColor === 'No Color Chosen') {
                let colorToSet = 'No Color Chosen';

                // Check for web app format first (color and vehicleColor fields)
                if (vehicleData.color && vehicleData.vehicleColor) {
                    colorToSet = `(${vehicleData.color}-${vehicleData.vehicleColor})`;
                    console.log('🎨 Setting color from populate (web format):', colorToSet);
                }
                // Check for object format with code and color
                else if (vehicleData.color && typeof vehicleData.color === 'object') {
                    if (vehicleData.color.code && vehicleData.color.color) {
                        colorToSet = `(${vehicleData.color.code}-${vehicleData.color.color})`;
                        console.log('🎨 Setting color from populate (object with code/color):', colorToSet);
                    } else if (vehicleData.color.color) {
                        colorToSet = vehicleData.color.color;
                        console.log('🎨 Setting color from populate (object with color only):', colorToSet);
                    }
                }
                // Check for string format
                else if (vehicleData.color && typeof vehicleData.color === 'string') {
                    colorToSet = vehicleData.color;
                    console.log('🎨 Setting color from populate (string):', colorToSet);
                }
                // Check for vehicleColor only
                else if (vehicleData.vehicleColor && typeof vehicleData.vehicleColor === 'string') {
                    colorToSet = vehicleData.vehicleColor;
                    console.log('🎨 Setting color from populate (vehicleColor only):', colorToSet);
                }

                if (colorToSet !== 'No Color Chosen') {
                    setSelectedColor(colorToSet);
                    if (vehicleData.color && typeof vehicleData.color === 'object' && vehicleData.color.id) {
                        setSelectedColorId(vehicleData.color.id);
                    }
                    console.log('✅ Color set in populate to:', colorToSet);
                }
            } else {
                console.log('🎨 Color already set to:', selectedColor, '- not overriding');
            }

            // Customer Data - this is in vehicleData.customer
            console.log('CUSTOMER DATA:');
            console.log('- vehicleData.customer:', vehicleData.customer);

            if (vehicleData.customer && vehicleData.customer.length > 0) {
                // Extract customer objects from the vehicle data
                const vehicleCustomers = vehicleData.customer
                    .map((c: any) => c.customer)
                    .filter((customer: any) => customer);

                console.log('Extracted customers:', vehicleCustomers);

                if (vehicleCustomers.length > 0) {
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
                    console.log('✅ Selected customers set successfully');
                }
            } else {
                console.log('❌ Customer data not found');
            }

            console.log('=== END VEHICLE DETAILS POPULATION ===');
        }
    }, [vehicleDetails, selectedColor]); // Add selectedColor to dependencies
    useEffect(() => {
        if (vehicleDetails) {
            console.log('Vehicle details loaded, checking for job orders:', {
                hasJobOrder: !!vehicleDetails.jobOrder,
                jobOrderType: typeof vehicleDetails.jobOrder,
                jobOrderLength: vehicleDetails.jobOrder?.length,
                jobOrderData: vehicleDetails.jobOrder,
                // Check nested structure like web project
                selectVehicleJobOrder: vehicleDetails.selectVehicle?.jobOrder,
                responseJobOrder: vehicleDetails.response?.jobOrder,
                dataJobOrder: vehicleDetails.data?.jobOrder
            });

            // Try different possible structures for job orders
            let jobOrders = null;

            if (vehicleDetails.jobOrder && Array.isArray(vehicleDetails.jobOrder)) {
                jobOrders = vehicleDetails.jobOrder;
                console.log('Found job orders in vehicleDetails.jobOrder');
            } else if (vehicleDetails.selectVehicle?.jobOrder && Array.isArray(vehicleDetails.selectVehicle.jobOrder)) {
                jobOrders = vehicleDetails.selectVehicle.jobOrder;
                console.log('Found job orders in vehicleDetails.selectVehicle.jobOrder');
            } else if (vehicleDetails.response?.jobOrder && Array.isArray(vehicleDetails.response.jobOrder)) {
                jobOrders = vehicleDetails.response.jobOrder;
                console.log('Found job orders in vehicleDetails.response.jobOrder');
            } else if (vehicleDetails.data?.jobOrder && Array.isArray(vehicleDetails.data.jobOrder)) {
                jobOrders = vehicleDetails.data.jobOrder;
                console.log('Found job orders in vehicleDetails.data.jobOrder');
            }

            if (jobOrders) {
                console.log('Extracting job orders:', jobOrders);
                // Fetch detailed information for each job order
                fetchDetailedJobOrders(jobOrders);
            } else {
                console.log('No job orders found in vehicle details, trying API call');
                // Try to fetch job orders separately if not in vehicle details
                if (vehicleDetails.id) {
                    fetchJobOrdersSeparately(vehicleDetails.id);
                }
            }
        }
    }, [vehicleDetails]);

    // Fetch detailed job order information
    const fetchDetailedJobOrders = async (jobOrders: any[]) => {
        try {
            console.log('Fetching detailed information for', jobOrders.length, 'job orders');
            const detailedJobOrders = await Promise.all(
                jobOrders.map(async (job) => {
                    try {
                        const response = await getJobOrderDetails(job.id);
                        console.log('Job order details response for', job.jobNo, ':', response.data);

                        if (response.data.code === 200) {
                            const detailedJob = response.data.response?.data || response.data.response;
                            console.log('Detailed job order for', job.jobNo, ':', detailedJob);
                            return detailedJob;
                        }
                        return job; // Fallback to basic job order if details fetch fails
                    } catch (error) {
                        console.error('Error fetching details for job', job.jobNo, ':', error);
                        return job; // Fallback to basic job order
                    }
                })
            );

            console.log('All detailed job orders:', detailedJobOrders);
            setJobOrderHistory(detailedJobOrders);
        } catch (error) {
            console.error('Error fetching detailed job orders:', error);
            // Fallback to basic job orders
            setJobOrderHistory(jobOrders);
        }
    };

    // Fetch job orders separately if needed
    const fetchJobOrdersSeparately = async (vehicleId: string) => {
        try {
            console.log('Fetching job orders separately for vehicle:', vehicleId);
            const response = await getJobOrderHistory(vehicleId);
            console.log('Job orders API response:', response.data);

            if (response.data.code === 200) {
                const jobOrderData = response.data.response;
                console.log('Job orders data structure:', jobOrderData);

                // Check different possible structures
                if (Array.isArray(jobOrderData)) {
                    setJobOrderHistory(jobOrderData);
                } else if (jobOrderData.data && Array.isArray(jobOrderData.data)) {
                    setJobOrderHistory(jobOrderData.data);
                } else if (jobOrderData.response && Array.isArray(jobOrderData.response)) {
                    setJobOrderHistory(jobOrderData.response);
                } else {
                    console.log('Job orders data structure keys:', Object.keys(jobOrderData));
                    setJobOrderHistory([]);
                }
            }
        } catch (error) {
            console.error('Error fetching job orders separately:', error);
            setJobOrderHistory([]);
        }
    };

    // Fetch related data (colors, services, files, insurance, job orders)
    const fetchRelatedData = async (vehicleId: string) => {
        try {
            console.log('Fetching related data for vehicle:', vehicleId);

            // Fetch vehicle customers (this will set both customers and customerDropdownData)
            await fetchVehicleCustomers(vehicleId);

            // Fetch other related data
            const [colorResponse, servicesResponse, filesResponse, insuranceResponse, jobOrderResponse] = await Promise.all([
                getVehicleColor(vehicleId),
                getVehicleServices(vehicleId),
                getVehicleFiles(vehicleId),
                getVehicleInsurance(vehicleId),
                getJobOrderHistory(vehicleId)
            ]);

            if (colorResponse.data.code === 200) {
                const colorData = colorResponse.data.response.data;
                setVehicleColors(colorData);
                // Do not overwrite the already selected color from the vehicle details
                // if (colorData.length > 0) {
                //     setSelectedColor(colorData[0].color);
                // }
            }

            if (servicesResponse.data.code === 200) {
                const serviceData = servicesResponse.data.response.data;
                console.log('Service API Response:', serviceData); // Debug log
                // Services are nested inside SoldVehicle[0].services
                if (serviceData.SoldVehicle && serviceData.SoldVehicle[0] && serviceData.SoldVehicle[0].services) {
                    setVehicleServices(serviceData.SoldVehicle[0].services);
                } else {
                    setVehicleServices(serviceData.services || serviceData || []);
                }
            }

            if (filesResponse.data.code === 200) {
                const vehicleData = filesResponse.data.response.data;
                const serverFiles = vehicleData.vehicleDocuments || []; // Use vehicleDocuments like web
                setVehicleFiles(serverFiles);

                // Extract e-Receipt URL from the same API response as web project
                const eReceiptUrl = vehicleData.SoldVehicle?.[0]?.eReceipt;
                if (eReceiptUrl) {
                    setEReceiptUrl(eReceiptUrl);
                    console.log('✅ e-Receipt URL found:', eReceiptUrl);
                } else {
                    setEReceiptUrl(null);
                    console.log('❌ No e-Receipt URL found');
                }

                // Populate uploadedFiles state with server files
                const serverUploadedFiles: { [key: string]: any } = {};
                serverFiles.forEach((file: any) => {
                    // Use the exact type from server (web compatibility)
                    const webType = file.type?.toLowerCase();
                    const mobileType = REVERSE_DOCUMENT_MAPPING[webType] || webType;

                    serverUploadedFiles[mobileType] = {
                        uri: file.url,
                        url: file.url,
                        name: file.name,
                        size: file.size,
                        mimeType: file.mimeType || file.type || 'application/octet-stream',
                        type: mobileType,
                        id: file.id, // Store server file ID
                        webType: webType, // Store web type for reference
                    };
                });

                // Merge with existing uploaded files
                setUploadedFiles(prev => ({
                    ...prev,
                    ...serverUploadedFiles
                }));

                console.log('Loaded vehicle documents from server:', serverUploadedFiles);
            }

            if (insuranceResponse.data.code === 200) {
                const vehicleData = insuranceResponse.data.response.data;
                setInsuranceData(vehicleData.insurance || []);
            }

            // Job orders are already included in the main vehicle data
            if (vehicleDetails && vehicleDetails.jobOrder && Array.isArray(vehicleDetails.jobOrder)) {
                console.log('Job Order from vehicle data:', vehicleDetails.jobOrder); // Debug log
                setJobOrderHistory(vehicleDetails.jobOrder);
            } else if (jobOrderResponse.data.code === 200) {
                const jobOrderData = jobOrderResponse.data.response;
                console.log('Job Order API Response:', jobOrderData); // Debug log
                // Job orders might be directly in response or in response.data
                if (jobOrderData.data && Array.isArray(jobOrderData.data)) {
                    setJobOrderHistory(jobOrderData.data);
                } else if (Array.isArray(jobOrderData)) {
                    setJobOrderHistory(jobOrderData);
                } else if (jobOrderData.response && Array.isArray(jobOrderData.response)) {
                    setJobOrderHistory(jobOrderData.response);
                } else {
                    console.log('Job Order data structure:', Object.keys(jobOrderData));
                    setJobOrderHistory([]);
                }
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
            console.log('Fetching vehicle models for manufacturer:', manufacturerId);
            const response = await getVehicleModelsByManufacturerId(manufacturerId);
            console.log('Vehicle models response:', response.data);

            if (response.data.code === 200 && response.data.response.code === 200) {
                // Web project sets response.data as vehicles
                const models = response.data.response.data || [];
                console.log('Setting vehicle models:', models);
                setVehicleModels(models);

                // Debug: Log model structure
                if (models.length > 0) {
                    console.log('Sample model structure:', models[0]);
                    console.log('Available model codes:', models.map((m: any) => ({ id: m.id, code: m.modelCode, name: m.modelName })));
                }
            } else {
                console.log('Failed to fetch models, setting empty array');
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
            console.log('Fetching vehicle customers for:', vehicleId);

            // Get the actual vehicle data from vehicleDetails.data
            const vehicleData = vehicleDetails?.data;
            console.log('Vehicle data for customers:', vehicleData);

            // Check the actual structure of customer data
            if (vehicleData?.customer && Array.isArray(vehicleData.customer)) {
                console.log('Customer array found:', vehicleData.customer);

                // Extract customer IDs
                const customerIds = vehicleData.customer
                    .map((c: any) => {
                        console.log('Processing customer item:', c);
                        if (c.customer?.id) {
                            return c.customer.id;
                        } else if (c.id) {
                            return c.id;
                        }
                        return null;
                    })
                    .filter((id: string | null) => id);

                console.log('Customer IDs to fetch:', customerIds);

                if (customerIds.length > 0) {
                    const response = await getVehicleCustomers(customerIds);
                    console.log('Vehicle customers response:', response);

                    if (response.data.code === 200 && response.data.response.code === 200) {
                        const customerData = response.data.response.data || [];
                        console.log('Setting customers:', customerData);
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
                const modelDisplay = vehicle.vehicle.modelCode + " - " + vehicle.vehicle.modelName;
                setModel(modelDisplay);
                // Set category from the vehicle model or use fallback
                const categoryValue = vehicle.vehicle?.category || getCategoryFromModel(vehicle.vehicle.modelName, vehicle.vehicle.modelCode);
                setCategory(categoryValue);
                console.log('Category set:', categoryValue, 'from vehicle category:', vehicle.vehicle?.category);
            }
            // Handle color properly - ensure it's a string, but don't override if user has already selected a color in this session
            // Only set initial color if it's the first load
            console.log('🎨 VehicleDetails - useEffect checking color:', {
                vehicleColor: vehicle.color,
                currentSelectedColor: selectedColor,
                includesParentheses: selectedColor.includes('('),
                condition: vehicle.color && selectedColor === "No Color Chosen"
            });

            if (vehicle.color && selectedColor === "No Color Chosen") {
                if (typeof vehicle.color === 'object' && vehicle.color.code && vehicle.color.color) {
                    // Color object has code and color properties - format as (code-colorname)
                    const colorDisplay = `(${vehicle.color.code}-${vehicle.color.color})`;
                    console.log('🎨 VehicleDetails - Setting color from object with format:', colorDisplay);
                    setSelectedColor(colorDisplay);
                    if (vehicle.color.id) setSelectedColorId(vehicle.color.id);
                } else if (typeof vehicle.color === 'object' && vehicle.color.color) {
                    // Color object has only color property
                    console.log('🎨 VehicleDetails - Setting color from object:', vehicle.color.color);
                    setSelectedColor(vehicle.color.color);
                    if (vehicle.color.id) setSelectedColorId(vehicle.color.id);
                } else if (typeof vehicle.color === 'string') {
                    console.log('🎨 VehicleDetails - Setting color from string:', vehicle.color);
                    setSelectedColor(vehicle.color);
                } else if (vehicle.color.color && typeof vehicle.color.color === 'string') {
                    console.log('🎨 VehicleDetails - Setting color from nested color:', vehicle.color.color);
                    setSelectedColor(vehicle.color.color);
                    if (vehicle.color.id) setSelectedColorId(vehicle.color.id);
                } else {
                    console.log('🎨 VehicleDetails - Setting default color');
                    setSelectedColor('No Color Chosen');
                }
            } else {
                console.log('🎨 VehicleDetails - NOT overriding color - condition not met');
            }
        }
    }, [vehicle]);

    const extractColorId = (colorString: string) => {
        if (selectedColorId) return selectedColorId;
        if (colorString.includes('(') && colorString.includes(')')) {
            const match = colorString.match(/^\(([^)-]+)-/);
            return match ? match[1].trim() : '';
        }
        return '';
    };

    const extractColorName = (colorString: string) => {
        if (colorString.includes('(') && colorString.includes(')')) {
            const match = colorString.match(/\(([^)-]+)-(.+)\)$/);
            return match ? match[2].trim() : '';
        }
        return colorString;
    };

    const extractColorUrl = (colorString: string) => {
        // In a real implementation, you'd need to map color to URL
        // For now, return empty string as URL is optional
        return '';
    };

    const handleDateSelect = (day: any) => {
        const date = new Date(day.dateString);
        const formattedDate = moment(date).format('DD/MM/YYYY');
        setDateOfSale(formattedDate);
        setShowCalendarModal(false);
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            // Check for vehicle ID in both possible locations
            const vehicleId = vehicleDetails?.id || vehicleDetails?.data?.id;
            if (!vehicleId) {
                console.error('Vehicle ID not found. vehicleDetails:', vehicleDetails);
                Alert.alert('Error', 'Vehicle ID not found');
                return;
            }

            // Create FormData for API - MATCH WEB APP STRUCTURE
            const formData = new FormData();
            formData.append('id', chassisNumber); // Required field like web app

            // Build vehicleData object like web app - exclude customers to prevent association conflicts
            const vehicleObj = vehicleDetails?.data || vehicleDetails;
            const vehicleData = {
                vehicle: vehicleObj?.vehicle?.id || '',
                color: selectedColor && selectedColor !== 'No Color Chosen' ? extractColorId(selectedColor) : '',
                registerNo: registrationNumber,
                vehicleType: vehicleType,
                chassisNo: chassisNumber,
                engineNo: engineNumber,
                serviceCouponNumber: serviceCouponNumber,
                dateOfSale: dateOfSale,
                mfg: mfgDate,
                manufacturer: vehicleObj?.vehicle?.manufacturer?.id || '',
                modelName: vehicleObj?.vehicle?.modelName || '',
                // Add color fields like web app
                vehicleColor: selectedColor && selectedColor !== 'No Color Chosen' ? extractColorName(selectedColor) : '',
                images: selectedColor && selectedColor !== 'No Color Chosen' ? extractColorUrl(selectedColor) : '',
                // Don't include customer field to prevent 400 error
            };

            formData.append('vehicleData', JSON.stringify(vehicleData));
            console.log('🎨 Sending vehicleData object:', vehicleData);

            // Call API to update vehicle
            console.log('🔍 About to call updateVehicle API with color:', selectedColor);

            const response = await updateVehicle(vehicleId, formData);
            console.log('🔍 Update vehicle response:', response.data);

            if (response.data.code === 200 && response.data.response.code === 200) {
                console.log('🔍 Vehicle updated successfully');
                Alert.alert('Success', 'Vehicle details updated successfully');
                navigation.goBack();
            } else {
                console.log('🔍 Update failed:', response.data);
                Alert.alert('Error', 'Failed to update vehicle details');
            }
        } catch (error: any) {
            console.error('Error saving vehicle:', error);

            // Log the full error response
            if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
                console.error('Error response headers:', error.response.headers);

                // Show more detailed error to user
                const errorMessage = error.response.data?.msg ||
                    error.response.data?.message ||
                    'Failed to update vehicle details';
                Alert.alert('Error', errorMessage);
            } else if (error.request) {
                console.error('Error request:', error.request);
                Alert.alert('Error', 'No response from server');
            } else {
                console.error('Error message:', error.message);
                Alert.alert('Error', error.message);
            }
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
            console.log('Starting file upload for:', documentType);

            // Use your improved permission request function
            const hasPermission = await requestStoragePermission();

            if (!hasPermission) {
                console.log('Permission denied');
                Alert.alert(
                    'Permission Required',
                    'Storage permission is needed to upload documents. Please enable it in app settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Open Settings',
                            onPress: () => {
                                if (Platform.OS === 'android') {
                                    Linking.openSettings();
                                } else {
                                    Linking.openURL('app-settings:');
                                }
                            }
                        }
                    ]
                );
                return;
            }

            console.log('Permission granted, showing options');

            // Show file selection options
            Alert.alert(
                'Select File Source',
                'Choose how you want to select your file:',
                [
                    {
                        text: '📷 Camera',
                        onPress: () => openCameraForUpload(documentType)
                    },
                    {
                        text: '🖼️ Gallery',
                        onPress: () => openGalleryForUpload(documentType)
                    },
                    {
                        text: '📄 Documents',
                        onPress: () => openDocumentPickerForUpload(documentType)
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    }
                ]
            );
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

    // Check if permissions are actually granted
    const checkPermissions = async () => {
        if (Platform.OS === 'android') {
            // Android 13+
            if (Platform.Version >= 33) {
                const cameraPerm = await PermissionsAndroid.check(
                    PermissionsAndroid.PERMISSIONS.CAMERA
                );
                const imagesPerm = await PermissionsAndroid.check(
                    PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
                );
                const videoPerm = await PermissionsAndroid.check(
                    PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
                );

                console.log('Camera permission:', cameraPerm);
                console.log('Read media images:', imagesPerm);
                console.log('Read media video:', videoPerm);

                return imagesPerm;
            } else {
                // For older Android
                const readPerm = await PermissionsAndroid.check(
                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
                );
                const writePerm = await PermissionsAndroid.check(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
                );

                console.log('Read storage:', readPerm);
                console.log('Write storage:', writePerm);

                return readPerm && writePerm;
            }
        } else {
            // iOS
            const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
            console.log('iOS media library permission:', status);
            return status === 'granted';
        }
    };

    // Fixed permission request function with debugging
    const requestStoragePermission = async (): Promise<boolean> => {
        try {
            console.log('📱 Requesting storage permission...');
            console.log('Platform:', Platform.OS, 'Version:', Platform.Version);

            if (Platform.OS === 'android') {
                // Android 13+ (API 33+)
                if (Platform.Version >= 33) {
                    console.log('Android 13+ detected, requesting READ_MEDIA_IMAGES/VIDEO');

                    const permissions = [
                        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
                        PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
                    ];

                    // Check current status
                    const checkResults = await Promise.all(
                        permissions.map(async (perm) => {
                            const result = await PermissionsAndroid.check(perm);
                            console.log(`Permission ${perm}:`, result);
                            return result;
                        })
                    );

                    if (checkResults.every(result => result === true)) {
                        console.log('✅ All permissions already granted');
                        return true;
                    }

                    console.log('⚠️ Requesting permissions...');
                    const statuses = await PermissionsAndroid.requestMultiple(permissions);
                    console.log('Permission request results:', statuses);

                    const allGranted = Object.values(statuses).every(
                        status => status === PermissionsAndroid.RESULTS.GRANTED
                    );

                    console.log('All permissions granted:', allGranted);
                    return allGranted;
                }
                // Android 12 and below
                else {
                    console.log('Android 12 or below, requesting READ_EXTERNAL_STORAGE');

                    const checkRead = await PermissionsAndroid.check(
                        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
                    );
                    console.log('Read external storage already granted:', checkRead);

                    if (checkRead) {
                        return true;
                    }

                    const status = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                        {
                            title: 'Storage Permission',
                            message: 'This app needs access to your storage to upload documents.',
                            buttonNeutral: 'Ask Me Later',
                            buttonNegative: 'Cancel',
                            buttonPositive: 'OK',
                        }
                    );

                    console.log('Permission request result:', status);
                    return status === PermissionsAndroid.RESULTS.GRANTED;
                }
            } else {
                // iOS
                console.log('iOS, requesting media library permission');
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                console.log('iOS permission status:', status);
                return status === 'granted';
            }
        } catch (err) {
            console.error('❌ Permission error:', err);
            return false;
        }
    };

    const requestCameraPermission = async () => {
        try {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: 'Camera Permission',
                        message: 'This app needs access to camera to take photos for document uploads.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } else {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                return status === 'granted';
            }
        } catch (err) {
            console.warn('Camera permission error:', err);
            return false;
        }
    };

    // Test function to isolate the issue
    const testDirectUpload = async (documentType: string) => {
        try {
            console.log('🧪 TEST: Direct upload attempt');

            // Try using only expo-image-picker (no manual permission request)
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            console.log('Expo-image-picker permission status:', status);

            if (status !== 'granted') {
                console.log('Permission not granted, trying manual request...');
                const manualResult = await requestStoragePermission();
                console.log('Manual permission result:', manualResult);

                if (!manualResult) {
                    Alert.alert('Permission Denied', 'Cannot proceed without permission');
                    return;
                }
            }

            // Try launching image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
            });

            console.log('Image picker result:', result);

            if (!result.canceled) {
                Alert.alert('Success', 'File selected successfully!');
            }
        } catch (error) {
            console.error('Test error:', error);
            Alert.alert('Error', (error as Error).message);
        }
    };

    // Save file info to AsyncStorage for persistence
    const saveFileToStorage = async (documentType: string, fileInfo: any) => {
        try {
            const storageKey = `uploadedFiles_${vehicle?.id || 'new'}`;
            const existingFiles = await AsyncStorage.getItem(storageKey);
            const files = existingFiles ? JSON.parse(existingFiles) : {};

            files[documentType] = fileInfo;
            await AsyncStorage.setItem(storageKey, JSON.stringify(files));
        } catch (error) {
            console.error('Error saving file to storage:', error);
        }
    };

    // Server-based upload functions matching web project
    const openCameraForUpload = async (documentType: string) => {
        try {
            console.log('Opening camera for server upload:', documentType);

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                quality: 0.8,
                allowsEditing: true,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                await uploadFileToServer(documentType, asset);
            }
        } catch (error) {
            console.error('Camera upload error:', error);
            Alert.alert('Error', 'Failed to capture photo');
        }
    };

    const openGalleryForUpload = async (documentType: string) => {
        try {
            console.log('Opening gallery for server upload:', documentType);

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                quality: 0.8,
                allowsEditing: false,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                await uploadFileToServer(documentType, asset);
            }
        } catch (error) {
            console.error('Gallery upload error:', error);
            Alert.alert('Error', 'Failed to select file from gallery');
        }
    };

    const openDocumentPickerForUpload = async (documentType: string) => {
        try {
            console.log('Opening document picker for server upload:', documentType);

            const result = await DocumentPicker.getDocumentAsync({
                type: ['*/*'],
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                await uploadFileToServer(documentType, asset);
            }
        } catch (error) {
            console.error('Document upload error:', error);
            Alert.alert('Error', 'Failed to select document');
        }
    };

    const uploadFileToServer = async (documentType: string, asset: any) => {
        try {
            console.log('Uploading file to server:', { documentType, asset });

            setLoading(true);

            // Get vehicle ID from route params or vehicleDetails
            const vehicleId = vehicle?.id || vehicleDetails?.data?.id || vehicleDetails?.id;

            if (!vehicleId) {
                throw new Error('Vehicle ID not found');
            }

            // Create FormData matching web project structure
            const formData = new FormData();

            // Append the file
            if (asset.uri) {
                formData.append('profile', {
                    uri: asset.uri,
                    type: asset.mimeType || 'application/octet-stream',
                    name: asset.fileName || `file_${Date.now()}`,
                } as any);
            }

            // Append metadata matching web project
            formData.append('master', 'Transaction Master');
            formData.append('module', 'vehicle');
            formData.append('id', vehicleId);

            // Use web-compatible document type
            const webDocumentType = DOCUMENT_TYPE_MAPPING[documentType] || documentType.toLowerCase();
            formData.append('type', webDocumentType);

            console.log('Uploading with FormData:', {
                master: 'Transaction Master',
                module: 'vehicle',
                id: vehicleId,
                mobileType: documentType,
                webType: webDocumentType,
            });

            // Upload to server using same API as web project
            const response = await uploadVehicleFile(formData);

            console.log('Upload response:', response.data);

            if (response.data.code === 200) {
                const uploadedFile = response.data.response.data;

                console.log('🎯 Upload Success!', {
                    mobileType: documentType,
                    webType: webDocumentType,
                    serverResponse: uploadedFile
                });

                // Update local state with server response
                const fileInfo = {
                    uri: uploadedFile.url,
                    url: uploadedFile.url, // Add url property for consistency
                    name: asset.fileName || `${documentType}_${Date.now()}`,
                    size: asset.fileSize || 0,
                    mimeType: asset.mimeType || 'application/octet-stream',
                    type: documentType,
                    id: uploadedFile.id, // Store server file ID
                    webType: webDocumentType, // Store web type for deletion
                };

                setUploadedFiles(prev => ({
                    ...prev,
                    [documentType]: fileInfo
                }));

                // Also save to AsyncStorage for offline access
                await saveFileToStorage(documentType, fileInfo);

                Alert.alert(
                    'Upload Successful',
                    `${documentType} uploaded successfully!`,
                    [{ text: 'OK', style: 'default' }]
                );
            } else {
                throw new Error(response.data.message || 'Upload failed');
            }
        } catch (error: any) {
            console.error('Server upload error:', error);

            let errorMessage = 'Failed to upload file';

            if (error.response?.data?.msg?.message?.includes('Chassis mismatch!')) {
                errorMessage = 'Incorrect chassis photo. Please upload the correct chassis photo';
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert('Upload Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const deleteFileFromServer = async (documentType: string, fileInfo: any) => {
        try {
            console.log('Deleting file from server:', { documentType, fileInfo });

            setLoading(true);

            // Delete from server using same API as web project
            const deleteData = {
                delid: fileInfo.id,
                type: fileInfo.webType || DOCUMENT_TYPE_MAPPING[documentType] || documentType,
                url: fileInfo.url || fileInfo.uri,
            };

            console.log('Deleting file from server:', { documentType, deleteData });

            const response = await deleteVehicleFile(deleteData);

            if (response.data.code === 200) {
                // Remove from local state
                const newUploadedFiles = { ...uploadedFiles };
                delete newUploadedFiles[documentType];
                setUploadedFiles(newUploadedFiles);

                // Remove from AsyncStorage
                await removeFileFromStorage(documentType);

                Alert.alert(
                    'Delete Successful',
                    `${documentType} deleted successfully!`,
                    [{ text: 'OK', style: 'default' }]
                );
            } else {
                throw new Error('Delete failed');
            }
        } catch (error: any) {
            console.error('Server delete error:', error);
            Alert.alert('Delete Failed', 'Failed to delete file from server');
        } finally {
            setLoading(false);
        }
    };

    // View uploaded file
    const viewFile = async (fileInfo: any) => {
        try {
            console.log('Viewing file:', fileInfo);

            if (fileInfo.mimeType?.startsWith('image/')) {
                // For images, show in modal
                setSelectedImage(fileInfo.uri);
                setShowImageViewer(true);
            } else {
                // For documents, try to open with sharing
                Alert.alert(
                    'Document Details',
                    `Name: ${fileInfo.name}\nSize: ${fileInfo.size ? `${(fileInfo.size / 1024).toFixed(2)} KB` : 'Unknown'}\nType: ${fileInfo.mimeType || 'Unknown'}\n\nWould you like to open this document?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Open Document',
                            onPress: async () => {
                                try {
                                    console.log('Attempting to open document:', fileInfo.uri);

                                    // Check if sharing is available
                                    const isSharingAvailable = await Sharing.isAvailableAsync();

                                    if (isSharingAvailable) {
                                        // Use expo-sharing to open the file
                                        await Sharing.shareAsync(fileInfo.uri, {
                                            mimeType: fileInfo.mimeType,
                                            dialogTitle: `Open ${fileInfo.name}`,
                                            UTI: fileInfo.mimeType,
                                        });
                                    } else {
                                        // Fallback: show file info and manual instructions
                                        Alert.alert(
                                            'File Information',
                                            `File: ${fileInfo.name}\n\nTo open this file:\n1. Use a file manager app\n2. Navigate to app cache folder\n3. Open with compatible app\n\nFile path: ${fileInfo.uri}`,
                                            [{ text: 'OK', style: 'default' }]
                                        );
                                    }
                                } catch (shareError) {
                                    console.error('Error sharing file:', shareError);
                                    Alert.alert(
                                        'Cannot Open File',
                                        'This file type requires a compatible viewer app. Please install a document viewer app and try again.',
                                        [{ text: 'OK', style: 'default' }]
                                    );
                                }
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Error viewing file:', error);
            Alert.alert('Error', 'Unable to open file');
        }
    };
    const loadSavedFiles = async () => {
        try {
            const storageKey = `uploadedFiles_${vehicle?.id || 'new'}`;
            const savedFiles = await AsyncStorage.getItem(storageKey);

            if (savedFiles) {
                setUploadedFiles(JSON.parse(savedFiles));
            }
        } catch (error) {
            console.error('Error loading saved files:', error);
        }
    };

    // Remove file from storage
    const removeFileFromStorage = async (documentType: string) => {
        try {
            const storageKey = `uploadedFiles_${vehicle?.id || 'new'}`;
            const existingFiles = await AsyncStorage.getItem(storageKey);
            const files = existingFiles ? JSON.parse(existingFiles) : {};

            delete files[documentType];
            await AsyncStorage.setItem(storageKey, JSON.stringify(files));
        } catch (error) {
            console.error('Error removing file from storage:', error);
        }
    };

    const openCamera = async (documentType: string) => {
        try {
            const hasPermission = await requestCameraPermission();
            if (!hasPermission) {
                Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: false,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];

                if (asset.uri) {
                    const fileInfo = {
                        uri: asset.uri,
                        name: asset.fileName || `camera_${Date.now()}.jpg`,
                        size: asset.fileSize || 0,
                        mimeType: asset.mimeType || 'image/jpeg',
                        type: 'camera'
                    };

                    setUploadedFiles(prev => ({
                        ...prev,
                        [documentType]: fileInfo
                    }));

                    await saveFileToStorage(documentType, fileInfo);

                    Alert.alert(
                        'Photo Captured Successfully',
                        `Photo "${fileInfo.name}" has been uploaded.`,
                        [{ text: 'OK', style: 'default' }]
                    );
                }
            }
        } catch (error) {
            console.error('Camera error:', error);
            Alert.alert('Error', 'Failed to open camera.');
        }
    };

    const openGallery = async (documentType: string) => {
        try {
            console.log('Opening gallery for:', documentType);

            // Permission already checked in handleFileUpload, so we can proceed directly
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                quality: 0.8,
                allowsEditing: false,
                selectionLimit: 1,
            });

            console.log('Image picker result:', result);

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];

                if (asset.uri) {
                    console.log('Selected asset:', asset);

                    const fileInfo = {
                        uri: asset.uri,
                        name: asset.fileName || `gallery_${Date.now()}.jpg`,
                        size: asset.fileSize || 0,
                        mimeType: asset.mimeType || 'image/jpeg',
                        type: 'gallery'
                    };

                    console.log('File info created:', fileInfo);

                    setUploadedFiles(prev => ({
                        ...prev,
                        [documentType]: fileInfo
                    }));

                    await saveFileToStorage(documentType, fileInfo);

                    Alert.alert(
                        'File Selected Successfully',
                        `File "${fileInfo.name}" has been selected.`,
                        [{ text: 'OK', style: 'default' }]
                    );
                }
            } else {
                console.log('User cancelled or no asset selected');
            }
        } catch (error) {
            console.error('Gallery error:', error);
            Alert.alert('Error', 'Failed to open gallery: ' + (error as Error).message);
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
            console.log('Opening document picker for:', documentType);

            // Permission already checked in handleFileUpload

            // Try expo-document-picker for real documents
            try {
                const result = await DocumentPicker.getDocumentAsync({
                    type: ['*/*'], // Allow all file types
                    copyToCacheDirectory: true,
                    multiple: false,
                });

                console.log('Document picker result:', result);

                if (!result.canceled && result.assets && result.assets[0]) {
                    const asset = result.assets[0];

                    if (asset.uri) {
                        console.log('Selected document asset:', asset);

                        const fileInfo = {
                            uri: asset.uri,
                            name: asset.name || `document_${Date.now()}`,
                            size: asset.size || 0,
                            mimeType: asset.mimeType || 'application/octet-stream',
                            type: 'document'
                        };

                        console.log('Document file info created:', fileInfo);

                        setUploadedFiles(prev => ({
                            ...prev,
                            [documentType]: fileInfo
                        }));

                        await saveFileToStorage(documentType, fileInfo);

                        Alert.alert(
                            'Document Selected Successfully',
                            `Document "${fileInfo.name}" has been selected.`,
                            [{ text: 'OK', style: 'default' }]
                        );
                    }
                } else {
                    console.log('User cancelled document selection');
                }
            } catch (docPickerError) {
                console.log('Document picker failed, falling back to image picker:', docPickerError);

                // Fallback to image picker if document picker fails
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.All,
                    quality: 1.0,
                    allowsEditing: false,
                    selectionLimit: 1,
                });

                console.log('Fallback image picker result:', result);

                if (!result.canceled && result.assets && result.assets[0]) {
                    const asset = result.assets[0];

                    if (asset.uri) {
                        console.log('Selected document asset via image picker:', asset);

                        const fileInfo = {
                            uri: asset.uri,
                            name: asset.fileName || `document_${Date.now()}`,
                            size: asset.fileSize || 0,
                            mimeType: asset.mimeType || 'application/octet-stream',
                            type: 'document'
                        };

                        console.log('Document file info created:', fileInfo);

                        setUploadedFiles(prev => ({
                            ...prev,
                            [documentType]: fileInfo
                        }));

                        await saveFileToStorage(documentType, fileInfo);

                        Alert.alert(
                            'Document Selected Successfully',
                            `Document "${fileInfo.name}" has been selected.`,
                            [{ text: 'OK', style: 'default' }]
                        );
                    }
                } else {
                    console.log('User cancelled document selection or no asset selected');
                }
            }
        } catch (error) {
            console.error('Document picker error:', error);
            Alert.alert('Error', 'Failed to open document picker: ' + (error as Error).message);
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
            'address_proof': ['Address_Proof', 'Utility_Bill', 'Bank_Statement'],
            'chassis_impression': ['Chassis_Impression', 'Vehicle_Chassis', 'Frame_Number'],
            'form_22': ['FORM_22', 'Sale_Form', 'Transfer_Form'],
            'form_21': ['FORM_21', 'Registration_Form', 'Vehicle_Form'],
            'signature': ['Signature', 'Customer_Sign', 'Authorized_Sign'],
            'pan_card_form60': ['PAN_Card', 'PAN_Card_Copy', 'Tax_ID'],
            'vehicle_right': ['Vehicle_Right', 'Right_Side', 'Side_View_Right'],
            'vehicle_left': ['Vehicle_Left', 'Left_Side', 'Side_View_Left'],
            'vehicle_front': ['Vehicle_Front', 'Front_View', 'Front_Photo'],
            'vehicle_rear': ['Vehicle_Rear', 'Rear_View', 'Back_Photo'],
            'sales_invoice': ['Invoice', 'Bill_Copy', 'Purchase_Invoice'],
            'disclaimer': ['Disclaimer', 'Terms_Conditions', 'Agreement'],
            'form_14': ['FORM_14', 'Insurance_Form', 'Vehicle_Form'],
            'inspection_certificate': ['Inspection_Certificate', 'Fitness_Certificate', 'Road_Worthy']
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

    // Helper function to determine category based on model name
    const getCategoryFromModel = (modelName: string, modelCode: string): string => {
        const name = modelName.toLowerCase();
        const code = modelCode.toLowerCase();

        // Determine category based on common patterns
        if (name.includes('scooter') || code.includes('scooter') || name.includes('activa') || name.includes('access') || name.includes('dio')) {
            return 'SCOOTER';
        } else if (name.includes('motorcycle') || name.includes('bike') || name.includes('sport') || name.includes('naked') || name.includes('cruiser') || name.includes('tourer')) {
            return 'MOTORCYCLE';
        } else if (name.includes('yamaha') || name.includes('rx') || name.includes('fz') || name.includes('mt') || name.includes('r15') || name.includes('ray')) {
            return 'MOTORCYCLE';
        } else {
            return 'MOTORCYCLE'; // Default fallback
        }
    };

    const handleRemoveFile = async (documentType: string) => {
        try {
            const fileInfo = uploadedFiles[documentType];

            // If file has server ID, delete from server first
            if (fileInfo?.id) {
                await deleteFileFromServer(documentType, fileInfo);
            } else {
                // Local file only, remove from state and storage
                setUploadedFiles(prev => ({
                    ...prev,
                    [documentType]: null
                }));

                await removeFileFromStorage(documentType);

                Alert.alert(
                    'File Removed',
                    'File has been removed successfully.',
                    [{ text: 'OK', style: 'default' }]
                );
            }
        } catch (error) {
            console.error('Error removing file:', error);
            Alert.alert('Error', 'Failed to remove file.');
        }
    };

    // Handle bulk insurance upload save
    const handleBulkInsuranceSave = (savedInsurances: any[]) => {
        console.log('Bulk insurance saved:', savedInsurances);
        // Don't modify existing insuranceData - only show bulk uploaded items
        // The existing insurance data should remain separate and only be displayed in the existing insurance section
        
        // Refresh insurance data to show updated state
        if (vehicle?.id) {
            fetchRelatedData(vehicle.id);
        }
        setShowBulkInsuranceModal(false);
    };


    const renderHeader = () => (
        <HeaderWithBack
            title="Vehicle Details"
            subtitle={mode === 'edit' ? 'Edit Mode' : 'View Mode'}
        />
    );

    const renderTabNavigation = () => (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="bg-white border-b border-gray-200"
            contentContainerStyle={{ paddingHorizontal: 8 }}
            style={{ flexGrow: 0 }}
        >
            {[
                { key: "vehicle-details", label: "Vehicle Details" },
                { key: "associated-documents", label: "Documents" },
                { key: "service-schedule", label: "Service Schedule" },
                { key: "job-order-history", label: "Job Orders" },
            ].map((tab) => (
                <TouchableOpacity
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    className={`px-4 py-4 border-b-2 ${activeTab === tab.key ? 'border-teal-600' : 'border-transparent'}`}
                >
                    <Text className={`text-xs font-bold ${activeTab === tab.key ? 'text-teal-600' : 'text-gray-600'}`}>
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
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
                                onPress={() => {
                                    console.log('Opening ColorSelection screen from color button');
                                    console.log('🎯 Current model value:', model);
                                    console.log('🎯 Passing modelName:', model);
                                    navigation.navigate('ColorSelection' as any, {
                                        modelName: model
                                    });
                                }}
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
                            className={`h-12 border rounded-lg px-3 text-gray-800 ${validationErrors.chassis
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
                        <Text className="text-gray-800 flex-1">{vehicleType || '-'}</Text>
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
                        className={`bg-white border border-gray-300 rounded-lg px-3 flex-row items-start justify-between ${selectedCustomers.length > 0 ? 'min-h-12 py-2' : 'h-12'
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
                                <Text className="mt-1 text-gray-400">Select Customers</Text>
                            )}
                        </View>
                        <ChevronRight size={16} color={COLORS.gray[400]} />
                    </TouchableOpacity>
                ) : (
                    <View className={`bg-gray-50 border border-gray-200 rounded-lg px-3 justify-center ${selectedCustomers.length > 0 ? 'min-h-12 py-2' : 'h-12'
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
                        {vehicleFiles && vehicleFiles.length > 0 ? (
                            vehicleFiles.map((file, index) => (
                                <View key={index} className="border-b border-gray-100">
                                    <View className="flex-row p-3" style={{ minWidth: 400 }}>
                                        <Text className="text-sm text-gray-800" style={{ width: 200 }}>
                                            {file.name || file.fileName || `File ${index + 1}`}
                                        </Text>
                                        <Text className="text-sm text-gray-600" style={{ width: 100 }}>
                                            {file.type || file.documentType || 'Document'}
                                        </Text>
                                        <View className="flex-row gap-2" style={{ width: 100 }}>
                                            <TouchableOpacity
                                                className="px-2 py-1 bg-blue-500 rounded"
                                                onPress={() => {
                                                    if (file.url) {
                                                        Linking.openURL(file.url);
                                                    } else {
                                                        Alert.alert('Info', 'File URL not available');
                                                    }
                                                }}
                                            >
                                                <Text className="text-xs text-white">View</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                className="px-2 py-1 bg-green-500 rounded"
                                                onPress={() => {
                                                    if (file.url) {
                                                        Linking.openURL(file.url);
                                                    } else {
                                                        Alert.alert('Info', 'Download URL not available');
                                                    }
                                                }}
                                            >
                                                <Text className="text-xs text-white">Download</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View className="p-12 items-center" style={{ minWidth: 400 }}>
                                <FolderOpen size={48} color={COLORS.gray[300]} strokeWidth={1} />
                                <Text className="text-sm text-gray-400 mt-2">No Data</Text>
                            </View>
                        )}
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
                        {insuranceData && insuranceData.length > 0 ? (
                            insuranceData.map((insurance, index) => (
                                <View key={index} className="border-b border-gray-100">
                                    <View className="flex-row p-3" style={{ minWidth: 800 }}>
                                        <Text className="text-sm text-gray-800" style={{ width: 150 }}>
                                            {insurance.insurerName || insurance.insurer || 'N/A'}
                                        </Text>
                                        <Text className="text-sm text-gray-800" style={{ width: 120 }}>
                                            {insurance.policyNumber || insurance.policyNo || 'N/A'}
                                        </Text>
                                        <Text className="text-sm text-gray-600" style={{ width: 100 }}>
                                            {insurance.insuranceType || insurance.type || 'N/A'}
                                        </Text>
                                        <Text className="text-sm text-gray-600" style={{ width: 100 }}>
                                            {insurance.validFrom ? moment(insurance.validFrom).format('DD/MM/YYYY') : 'N/A'}
                                        </Text>
                                        <Text className="text-sm text-gray-600" style={{ width: 100 }}>
                                            {insurance.validTo ? moment(insurance.validTo).format('DD/MM/YYYY') : 'N/A'}
                                        </Text>
                                        <View className="flex-row gap-2" style={{ width: 80 }}>
                                            <TouchableOpacity
                                                className="px-2 py-1 bg-blue-500 rounded"
                                                onPress={() => {
                                                    Alert.alert('Insurance Details', `Insurer: ${insurance.insurerName || 'N/A'}\nPolicy: ${insurance.policyNumber || 'N/A'}\nType: ${insurance.insuranceType || 'N/A'}`);
                                                }}
                                            >
                                                <Text className="text-xs text-white">View</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                className="px-2 py-1 bg-red-500 rounded"
                                                onPress={() => {
                                                    Alert.alert('Remove Insurance', 'Are you sure you want to remove this insurance?', [
                                                        { text: 'Cancel', style: 'cancel' },
                                                        {
                                                            text: 'Remove', style: 'destructive', onPress: () => {
                                                                // TODO: Implement remove insurance API call
                                                                console.log('Remove insurance:', index);
                                                            }
                                                        }
                                                    ]);
                                                }}
                                            >
                                                <Text className="text-xs text-white">Remove</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View className="p-12 items-center" style={{ minWidth: 800 }}>
                                <FolderOpen size={48} color={COLORS.gray[300]} strokeWidth={1} />
                                <Text className="text-sm text-gray-400 mt-2">No Data</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>


            {/* Upload Insurance Section */}
            <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                Upload Insurance
            </Text>

            <View className="mb-6">
                {/* Bulk Insurance Upload Button */}
                <TouchableOpacity
                    className="flex-row items-center justify-center gap-2 bg-blue-600 border border-blue-700 rounded-lg py-3 px-4 mb-6"
                    onPress={() => setShowBulkInsuranceModal(true)}
                    style={{ backgroundColor: COLORS.primary }}
                >
                    <Upload size={20} color="white" />
                    <Text className="text-white font-medium">Upload Bulk Insurance</Text>
                </TouchableOpacity>
            </View>

            {/* Required Documents Section */}
            <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                Required Documents
            </Text>

            <View className="mb-6">
                <View className="flex-row flex-wrap gap-3">
                    {[
                        { name: 'Address Proof', key: 'address_proof' },
                        { name: 'Chassis Impression', key: 'chassis_impression' },
                        { name: 'Form 22', key: 'form_22' },
                        { name: 'Form 21', key: 'form_21' },
                        { name: 'Signature', key: 'signature' },
                        { name: 'PanCard/Form60', key: 'pan_card_form60' },
                        { name: 'Right', key: 'vehicle_right' },
                        { name: 'Left', key: 'vehicle_left' },
                        { name: 'Front', key: 'vehicle_front' },
                        { name: 'Rear', key: 'vehicle_rear' },
                        { name: 'Invoice', key: 'sales_invoice' },
                        { name: 'Disclaimer', key: 'disclaimer' },
                        { name: 'Form14', key: 'form_14' },
                        { name: 'Inspection Certificate', key: 'inspection_certificate' }
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
                                        <View className="w-full h-8 items-center justify-center bg-teal-50 rounded flex-row justify-between px-2">
                                            <Text className="text-xs text-teal-600">✓ Uploaded</Text>
                                            <TouchableOpacity
                                                onPress={() => viewFile(uploadedFile)}
                                                className="bg-blue-500 px-2 py-1 rounded"
                                            >
                                                <Text className="text-xs text-white font-medium">View</Text>
                                            </TouchableOpacity>
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

            <View className="mb-6">
                <View className="bg-white border border-gray-300 rounded-lg p-4">
                    {eReceiptUrl ? (
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                                <Text className="text-sm font-medium text-gray-800 mb-1">e-Receipt Available</Text>
                                <Text className="text-xs text-gray-600">Tap to view the vehicle e-Receipt document</Text>
                            </View>
                            <TouchableOpacity
                                className="px-4 py-2 bg-teal-600 rounded-lg flex-row items-center gap-2"
                                onPress={() => {
                                    Linking.openURL(eReceiptUrl);
                                }}
                            >
                                <Eye size={16} color="white" />
                                <Text className="text-sm text-white font-medium">View e-Receipt</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="flex-row items-center justify-center py-8">
                            <FileText size={48} color={COLORS.gray[300]} strokeWidth={1} />
                            <View className="ml-4">
                                <Text className="text-sm text-gray-500 font-medium">No e-Receipt Available</Text>
                                <Text className="text-xs text-gray-400 mt-1">e-Receipt will be generated when vehicle is sold</Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );

    const renderServiceScheduleTab = () => {
        console.log('Service Schedule Tab - vehicleServices:', vehicleServices); // Debug log
        return (
            <View>
                {/* Service Schedule Table */}
                <View className="mb-4">
                    <ScrollView horizontal showsHorizontalScrollIndicator={true} className="overflow-hidden">
                        <View style={{ minWidth: 600 }} className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                            <View className="bg-gray-600 text-white p-3">
                                <View className="flex-row" style={{ minWidth: 600 }}>
                                    <Text className="text-sm font-medium text-white" style={{ width: 100 }}>Service No</Text>
                                    <Text className="text-sm font-medium text-white" style={{ width: 100 }}>Service Type</Text>
                                    <Text className="text-sm font-medium text-white" style={{ width: 120, marginLeft: 25 }}>Service Kms</Text>
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
                                                    <View className={`px-2 py-1 rounded text-xs text-center ${service.serviceType === 'FREE' ? 'bg-green-100 text-green-800' :
                                                        service.serviceType === 'PAID' ? 'bg-orange-100 text-orange-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        <Text className="font-medium">
                                                            {service.serviceType || '-'}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text className="text-sm text-gray-800" style={{ width: 120, marginLeft: 30 }}>
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
                        className="px-4 py-2 bg-blue-600 rounded-lg"
                        onPress={() => {
                            try {
                                // Generate QR data like web project: simple vehicle info
                                const qrData = `VEHICLE:${vehicleDetails?.vehicle?.modelName || 'N/A'}-REG:${vehicleDetails?.registerNo || 'N/A'}-DATE:${moment().format('DD-MM-YYYY')}`;

                                // Set QR data for React Native QR component
                                setQrCodeData(qrData);
                                setShowQrCode(true);
                                Alert.alert('Success', 'QR Code generated successfully');
                            } catch (error) {
                                console.error('Error generating QR:', error);
                                Alert.alert('Error', 'Failed to generate QR Code');
                            }
                        }}
                    >
                        <Text className="text-white font-medium">QR Code</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-row items-center gap-2 px-4 py-2 bg-teal-600 rounded-lg"
                        onPress={() => {
                            try {
                                // Only regenerate QR code, don't reload service schedule
                                const qrData = `Vehicle: ${vehicleDetails?.registerNo}\nModel: ${vehicleDetails?.vehicle?.modelName}\nChassis: ${vehicleDetails?.chassisNo}\nCustomer: ${selectedCustomers[0]?.name || 'N/A'}\nRefreshed: ${new Date().toLocaleString()}`;
                                setQrCodeData(qrData);
                                setShowQrCode(true);
                                Alert.alert('Success', 'QR Code regenerated successfully');
                            } catch (error) {
                                console.error('Error regenerating QR:', error);
                                Alert.alert('Error', 'Failed to regenerate QR Code');
                            }
                        }}
                    >
                        <Text className="text-sm text-white font-medium">Re-Generate</Text>
                    </TouchableOpacity>
                </View>

                {/* QR Code Display Area */}
                <View className="bg-gray-50 border border-gray-200 rounded-lg p-4 items-center">
                    {showQrCode ? (
                        <View className="items-center">
                            <Text className="text-sm text-gray-600 mb-2 font-medium">QR Code Generated</Text>
                            <View className="w-32 h-32 bg-white rounded-lg items-center justify-center border-2 border-gray-300">
                                <QRCode
                                    value={qrCodeData || 'N/A'}
                                    size={112}
                                    color="black"
                                    backgroundColor="white"
                                />
                            </View>
                            <Text className="text-xs text-gray-500 mt-3 text-center max-w-xs">
                                Vehicle QR Code
                            </Text>
                        </View>
                    ) : (
                        <View className="items-center">
                            <Text className="text-sm text-gray-500 mb-2">QR Code will appear here</Text>
                            <View className="w-32 h-32 bg-gray-200 rounded-lg items-center justify-center">
                                <QrCodeIcon size={48} color={COLORS.gray[400]} />
                            </View>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderJobOrderHistoryTab = () => {
        console.log('Job Order History Tab - jobOrderHistory:', jobOrderHistory); // Debug log
        return (
            <View>
                {/* Job Order History Table */}
                <View className="mb-4">
                    <ScrollView horizontal showsHorizontalScrollIndicator={true} className="overflow-hidden">
                        <View style={{ minWidth: 1300 }} className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                            <View className="bg-gray-600 text-white p-3">
                                <View className="flex-row" style={{ minWidth: 1300 }}>
                                    <Text className="text-xs font-semibold text-white" style={{ width: 100 }}>Job No</Text>
                                    <Text className="text-xs font-semibold text-white" style={{ width: 120 }}>Reg. No</Text>
                                    <Text className="text-xs font-semibold text-white" style={{ width: 120 }}>Customer</Text>
                                    <Text className="text-xs font-semibold text-white" style={{ width: 100 }}>Model</Text>
                                    <Text className="text-xs font-semibold text-white" style={{ width: 100 }}>Service No</Text>
                                    <Text className="text-xs font-semibold text-white" style={{ width: 100 }}>Service Type</Text>
                                    <Text className="text-xs font-semibold text-white" style={{ width: 80 }}>Kms</Text>
                                    <Text className="text-xs font-semibold text-white" style={{ width: 80 }}>Time</Text>
                                    <Text className="text-xs font-semibold text-white" style={{ width: 100 }}>Date</Text>
                                    <Text className="text-xs font-semibold text-white" style={{ width: 100 }}>Mechanic</Text>
                                    <Text className="text-xs font-semibold text-white" style={{ width: 100 }}>Supervisor</Text>
                                    <Text className="text-xs font-semibold text-white" style={{ width: 80 }}>Status</Text>
                                    <Text className="text-xs font-semibold text-white" style={{ width: 100, marginLeft: 20 }}>Total Invoice</Text>
                                    <Text className="text-xs font-semibold text-white" style={{ width: 80 }}>Actions</Text>
                                </View>
                            </View>

                            {/* Job Order Data from API */}
                            {jobOrderHistory && jobOrderHistory.length > 0 ? (
                                <View>
                                    {jobOrderHistory.map((job: any, index: number) => (
                                        <View key={job.id || index} className="border-b border-gray-100">
                                            {/* Main Job Order Row */}
                                            <View className="p-3">
                                                <View className="flex-row" style={{ minWidth: 1300 }}>
                                                    <Text className="text-sm text-gray-800 mb-1" style={{ width: 100 }}>
                                                        {job.jobNo || 'N/A'}
                                                    </Text>
                                                    <Text className="text-sm text-gray-800 mb-1" style={{ width: 120 }}>
                                                        {vehicleDetails?.registerNo || job.vehicle?.registerNo || 'N/A'}
                                                    </Text>
                                                    <Text className="text-sm text-gray-800 mb-1" style={{ width: 120 }}>
                                                        {vehicleDetails?.customer?.[0]?.name || job.customer?.name || 'N/A'}
                                                    </Text>
                                                    <Text className="text-sm text-gray-800 mb-1" style={{ width: 100 }}>
                                                        {vehicleDetails?.vehicle?.modelName || job.vehicle?.modelName || job.vehicle?.vehicle?.modelName || 'N/A'}
                                                    </Text>
                                                    <Text className="text-sm text-gray-800 mb-1" style={{ width: 100 }}>
                                                        {job.serviceNo || 'N/A'}
                                                    </Text>
                                                    <Text className="text-sm text-gray-800 mb-1" style={{ width: 100 }}>
                                                        {job.serviceType || 'N/A'}
                                                    </Text>
                                                    <Text className="text-sm text-gray-800 mb-1" style={{ width: 80 }}>
                                                        {job.kms || 'N/A'}
                                                    </Text>
                                                    <Text className="text-sm text-gray-800 mb-1" style={{ width: 80 }}>
                                                        {job.createdAt ? moment(new Date(job.createdAt)).format('hh:mm A') : 'N/A'}
                                                    </Text>
                                                    <Text className="text-sm text-gray-800 mb-1" style={{ width: 100 }}>
                                                        {job.createdAt ? moment(new Date(job.createdAt)).format('DD/MM/YYYY') : 'N/A'}
                                                    </Text>
                                                    <Text className="text-sm text-gray-800 mb-1" style={{ width: 100 }}>
                                                        {job.mechanic?.profile?.employeeName || job.mechanic?.name || job.mechanic?.employeeName || 'N/A'}
                                                    </Text>
                                                    <Text className="text-sm text-gray-800 mb-1" style={{ width: 100 }}>
                                                        {job.supervisor?.profile?.employeeName || job.supervisor?.name || job.supervisor?.employeeName || 'N/A'}
                                                    </Text>
                                                    <Text className="text-sm text-gray-800 mb-1" style={{ width: 80 }}>
                                                        <Text className={`px-2 py-1 rounded text-xs font-medium ${job.jobStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                                                            job.jobStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                                job.jobStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                                    job.jobStatus === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {job.jobStatus || job.status || 'N/A'}
                                                        </Text>
                                                    </Text>
                                                    <Text className="text-sm text-gray-800 mb-1" style={{ width: 100, marginLeft: 20 }}>
                                                        {job.totalInvoice || job.total || job.netAmount || job.amount || 'N/A'}
                                                    </Text>
                                                    <View className="flex-row gap-2" style={{ width: 80 }}>
                                                        <TouchableOpacity
                                                            className="px-2 py-1 bg-blue-600 rounded"
                                                            onPress={() => {
                                                                const jobDetails = `
Job Number: ${job.jobNo || 'N/A'}
Registration No: ${job.registerNo || job.vehicle?.registerNo || vehicleDetails?.registerNo || 'N/A'}
Customer: ${job.customer?.name || selectedCustomers[0]?.name || 'N/A'}
Model: ${job.vehicle?.modelName || vehicleDetails?.vehicle?.modelName || 'N/A'}
Service No: ${job.serviceNo || 'N/A'}
Service Type: ${job.serviceType || 'N/A'}
Time: ${job.createdAt ? moment(new Date(job.createdAt)).format('hh:mm:ss A') : 'N/A'}
Date: ${job.createdAt ? moment(new Date(job.createdAt)).format('DD/MM/YYYY') : 'N/A'}
Mechanic: ${job.mechanic?.profile?.employeeName || 'N/A'}
Supervisor: ${job.supervisor?.name || 'N/A'}
Status: ${job.jobStatus || 'N/A'}
Total Invoice: ${job.totalAmount || job.totalInvoice || 'N/A'}
Kms: ${job.kms || 'N/A'}
Created: ${job.createdAt ? moment(new Date(job.createdAt)).format('DD/MM/YYYY hh:mm:ss A') : 'N/A'}
`;
                                                                Alert.alert('Complete Job Order Details', jobDetails.trim());
                                                            }}
                                                        >
                                                            <Text className="text-xs text-white">View</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            className="px-2 py-1 bg-red-600 rounded"
                                                            onPress={async () => {
                                                                try {
                                                                    Alert.alert('PDF Download', 'Downloading job order PDF...');
                                                                    // Use the same method as web project
                                                                    const response = await platformApi.get(
                                                                        `/api/jobOrder/generatePDF/${encodeURIComponent(job.id)}`,
                                                                        { responseType: 'blob', timeout: 30000 }
                                                                    );

                                                                    if (response.status === 200) {
                                                                        // Use web project approach for PDF download
                                                                        const blob = new Blob([response.data], { type: 'application/pdf' });

                                                                        // Create object URL for the blob
                                                                        const url = URL.createObjectURL(blob);

                                                                        try {
                                                                            // For React Native, use Sharing with the blob URL
                                                                            if (await Sharing.isAvailableAsync()) {
                                                                                // Convert blob to base64 for sharing
                                                                                const reader = new FileReader();
                                                                                reader.onload = async () => {
                                                                                    const base64Data = reader.result as string;
                                                                                    await Sharing.shareAsync(base64Data, {
                                                                                        mimeType: 'application/pdf',
                                                                                        dialogTitle: 'Download Job Order PDF',
                                                                                        UTI: 'com.adobe.pdf'
                                                                                    });
                                                                                };
                                                                                reader.readAsDataURL(blob);
                                                                                Alert.alert('Success', 'PDF downloaded successfully');
                                                                            } else {
                                                                                Alert.alert('Success', `PDF generated successfully (size: ${Math.round(blob.size / 1024)}KB)`);
                                                                            }
                                                                        } catch (shareError) {
                                                                            console.error('Sharing error:', shareError);
                                                                            Alert.alert('Success', `PDF generated (size: ${Math.round(blob.size / 1024)}KB)`);
                                                                        } finally {
                                                                            // Clean up the object URL
                                                                            URL.revokeObjectURL(url);
                                                                        }
                                                                    } else {
                                                                        Alert.alert('Error', 'Failed to download PDF');
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Error downloading PDF:', error);
                                                                    Alert.alert('Error', 'Failed to download PDF');
                                                                }
                                                            }}
                                                        >
                                                            <Text className="text-xs text-white">PDF</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>

                                                {/* Additional Service Details - Expandable */}
                                                {job.serviceDetails && job.serviceDetails.length > 0 && (
                                                    <View className="mt-2 pt-2 border-t border-gray-200">
                                                        <Text className="text-xs text-gray-600 font-medium mb-1">Service Details:</Text>
                                                        <View className="flex-row flex-wrap gap-2">
                                                            {job.serviceDetails.map((service: any, serviceIndex: number) => (
                                                                <View key={serviceIndex} className="bg-gray-50 px-2 py-1 rounded">
                                                                    <Text className="text-xs text-gray-700">
                                                                        {service.name || service.serviceName || `Service ${serviceIndex + 1}`}
                                                                    </Text>
                                                                </View>
                                                            ))}
                                                        </View>
                                                    </View>
                                                )}
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
        )
    }

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
                        {vehicleModels.length > 0 && (() => {
                            // Extract model code from the model string (format: "ModelCode - ModelName")
                            const modelCodeFromSelection = model.split(' - ')[0]?.trim();
                            const matchedVehicle = vehicleModels.find(v =>
                                v.modelCode && modelCodeFromSelection &&
                                v.modelCode.toString().trim().toUpperCase() === modelCodeFromSelection.toString().trim().toUpperCase()
                            );

                            // console.log('Color modal - Model:', model);
                            // console.log('Color modal - Extracted model code:', modelCodeFromSelection);
                            // console.log('Color modal - Matched vehicle:', matchedVehicle);
                            // console.log('Color modal - Available models:', vehicleModels.map(v => ({ id: v.id, code: v.modelCode, name: v.modelName })));

                            return matchedVehicle && matchedVehicle.image && matchedVehicle.image.length > 0;
                        })() ? (
                            // Show actual colors from vehicle model
                            (() => {
                                const modelCodeFromSelection = model.split(' - ')[0]?.trim();
                                const matchedVehicle = vehicleModels.find(v =>
                                    v.modelCode && modelCodeFromSelection &&
                                    v.modelCode.toString().trim().toUpperCase() === modelCodeFromSelection.toString().trim().toUpperCase()
                                );

                                return matchedVehicle?.image?.map((color: any, index: number) => (
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
                                                    <Text className={`text-gray-800 ${selectedColor === color.color ? 'font-bold text-teal-700' : ''
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
                                            <View className={`w-5 h-5 rounded-full border-2 ${selectedColor === color.color
                                                ? 'bg-teal-600 border-teal-600'
                                                : 'border-gray-300'
                                                }`}>
                                                {selectedColor === color.color && (
                                                    <View className="w-2 h-2 bg-white rounded-full self-center mt-1" />
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ));
                            })()
                        ) : (
                            // Fallback to default colors
                            [
                                { id: '1', name: 'Metallic Black', code: 'SMX', color: 'black' },
                                { id: '2', name: 'Blue', code: 'BLU', color: 'blue' },
                                { id: '3', name: 'Red', code: 'RED', color: 'red' },
                                { id: '4', name: 'Gray', code: 'GRY', color: 'gray' },
                                { id: '5', name: 'White', code: 'WHT', color: 'white' },
                                { id: '6', name: 'Silver', code: 'SLV', color: 'gray' },
                            ].map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => { setSelectedColor(item.name); setShowColorModal(false); }}
                                    className="p-4 border-b border-gray-100"
                                >
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-row items-center flex-1">
                                            <View className={`w-8 h-8 rounded-full mr-3 ${item.color === 'black' ? 'bg-black' :
                                                item.color === 'blue' ? 'bg-blue-500' :
                                                    item.color === 'red' ? 'bg-red-500' :
                                                        item.color === 'gray' ? 'bg-gray-500' :
                                                            item.color === 'white' ? 'bg-white border border-gray-300' :
                                                                'bg-gray-400'
                                                }`} />
                                            <View>
                                                <Text className={`text-gray-800 ${selectedColor === item.name ? 'font-bold text-teal-700' : ''
                                                    }`}>
                                                    {item.name}
                                                </Text>
                                                <Text className="text-xs text-gray-500">{item.code}</Text>
                                            </View>
                                        </View>
                                        <View className={`w-5 h-5 rounded-full border-2 ${selectedColor === item.name
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
        <View className="bg-white border-t border-gray-100 p-4 flex-row gap-3">
            {mode === 'edit' ? (
                <>
                    <Button title="Cancel" variant="outline" className="flex-1" onPress={() => navigation.goBack()} />
                    <Button title="Save Changes" className="flex-1" onPress={handleSave} />
                </>
            ) : null}
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
                                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][pickMonth]}
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
                                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][pickMonth]} {pickYear}
                                            </Text>
                                        </TouchableOpacity>
                                        <View className="w-8" />
                                    </View>

                                    <View className="flex-row flex-wrap">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
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
                                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][pickMonth]}
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
                                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][pickMonth]} {pickYear}
                                            </Text>
                                        </TouchableOpacity>
                                        <View className="w-8" />
                                    </View>

                                    <View className="flex-row flex-wrap">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
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
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
            {renderHeader()}
            {renderTabNavigation()}
            <View className="flex-1">
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
            {/* Image Viewer Modal */}
            <Modal
                visible={showImageViewer}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                    setShowImageViewer(false);
                    setSelectedImage(null);
                }}
            >
                <View className="flex-1 bg-black bg-opacity-90 justify-center items-center">
                    <TouchableOpacity
                        className="absolute top-12 right-6 z-10"
                        onPress={() => {
                            setShowImageViewer(false);
                            setSelectedImage(null);
                        }}
                    >
                        <X size={24} color="white" />
                    </TouchableOpacity>

                    {selectedImage && (
                        <Image
                            source={{ uri: selectedImage }}
                            className="w-full h-full"
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>

            {/* Bulk Insurance Upload Modal */}
            <BulkInsuranceUpload
                visible={showBulkInsuranceModal}
                onClose={() => setShowBulkInsuranceModal(false)}
                onSave={handleBulkInsuranceSave}
                vehicleId={vehicle?.id || ''}
                chassisNumber={chassisNumber}
                existingInsuranceData={insuranceData}
            />
        </SafeAreaView>
    );
};

export default VehicleDetailsScreen;
