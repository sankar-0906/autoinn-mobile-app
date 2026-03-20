import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useToast } from '../../src/ToastContext';
import { Search, ChevronRight, Plus, FileText, X, Calendar, ChevronDown, Clock, ChevronLeft, Edit2 } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBranches, getCustomerByPhoneNo, getUsers, createQuotation, generateQuotationId } from '../../src/api';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { TimePickerModal } from '../../components/TimePickerModal';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../src/context/auth/AuthContext';
import { usePermissions } from '../../src/hooks/usePermissions';
import { useBranch } from '../../src/context/branch';
import { AccessDeniedScreen } from '../../src/components/ui/AccessDeniedScreen';

type AddQuotationNavigationProp = StackNavigationProp<RootStackParamList, 'AddQuotation'>;
type AddQuotationRouteProp = RouteProp<RootStackParamList, 'AddQuotation'>;

// Reusable form label
const FormLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
    <Text className="text-sm text-gray-600 mb-1.5 font-medium">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
    </Text>
);

const ErrorText = ({ message }: { message?: string }) =>
    message ? <Text className="text-xs text-red-600 mt-1">⚠ {message}</Text> : null;

// Custom Modal component (same as CallActivityScreen)
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
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/40 justify-center items-center px-4">
                <View className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                    {children}
                </View>
            </View>
        </Modal>
    );
};

// Reusable picker/select field
const SelectField = ({
    placeholder,
    value,
    options,
    onSelect,
    disabled = false,
    error,
    modalVisible,
    setModalVisible,
}: {
    placeholder: string;
    value: string;
    options: { label: string; value: string }[];
    onSelect: (val: string) => void;
    disabled?: boolean;
    error?: string;
    modalVisible: boolean;
    setModalVisible: (visible: boolean) => void;
}) => {
    const selectedLabel = options.find((o) => o.value === value)?.label || '';

    return (
        <>
            <TouchableOpacity
                onPress={() => {
                    if (!disabled) setModalVisible(true);
                }}
                className={`rounded-xl px-4 h-12 flex-row items-center justify-between border ${disabled ? 'bg-gray-100 border-gray-200' : error ? 'bg-white border-red-500' : 'bg-white border-gray-200'}`}
            >
                <Text className={selectedLabel ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedLabel || placeholder}
                </Text>
                <ChevronDown size={18} color={COLORS.gray[400]} />
            </TouchableOpacity>

            <CustomModal visible={modalVisible} onClose={() => setModalVisible(false)}>
                <View className="p-4">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-gray-900 font-bold text-base">{placeholder}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)} className="p-1">
                            <ChevronDown size={20} color="#6b7280" style={{ transform: [{ rotate: '180deg' }] }} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView className="max-h-64">
                        {options.map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                onPress={() => {
                                    onSelect(opt.value);
                                    setModalVisible(false);
                                }}
                                className="py-3 border-b border-gray-50 last:border-b-0"
                            >
                                <Text className="text-gray-900">{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </CustomModal>
        </>
    );
};

// Radio button component
const RadioOption = ({
    label,
    selected,
    onPress,
}: {
    label: string;
    selected: boolean;
    onPress: () => void;
}) => (
    <TouchableOpacity
        onPress={onPress}
        className="flex-row items-center mr-6"
        activeOpacity={0.7}
    >
        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${selected ? 'border-teal-600' : 'border-gray-300'}`}>
            {selected && <View className="w-2.5 h-2.5 rounded-full bg-teal-600" />}
        </View>
        <Text className="text-gray-700 ml-2 text-sm font-medium">{label}</Text>
    </TouchableOpacity>
);

export default function AddQuotationScreen({ navigation, route }: any) {
    const { user } = useAuth();
    const { isManager } = usePermissions(); // Move hook call to top level

    // 🎯 Global Branch Service: GPS nearest → Employee assigned → First available
    const { branches, selectedBranch, nearestBranch, isLoading: branchLoading, error: branchError } = useBranch();
    // Helper functions to match the old interface - prioritize nearestBranch for better UX
    const getBranchId = () => nearestBranch?.id || selectedBranch?.id || null;
    const getBranchName = () => nearestBranch?.name || selectedBranch?.name || '-';

    const initialSelectedVehicle = route.params?.selectedVehicle;

    // Form state
    const [branch, setBranch] = useState('');
    const [salesExecutive, setSalesExecutive] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [gender, setGender] = useState('male');
    const [customerType, setCustomerType] = useState('');
    const [locality, setLocality] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [followUpTime, setFollowUpTime] = useState('12:00');
    const [followUpDateError, setFollowUpDateError] = useState('');
    const [expectedPurchaseDateError, setExpectedPurchaseDateError] = useState('');
    const [leadSource, setLeadSource] = useState('');
    const [expectedPurchaseDate, setExpectedPurchaseDate] = useState('');
    const [testDriveTaken, setTestDriveTaken] = useState('yes');
    const [enquiryType, setEnquiryType] = useState('');
    const [remarks, setRemarks] = useState('');
    const [localityEditable, setLocalityEditable] = useState(false);
    const [foundCustomerId, setFoundCustomerId] = useState<string | null>(null);
    const [lookupStatus, setLookupStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const lastLookupRef = useRef('');

    // Multi-vehicle state (like web app)
    const [selectedVehicles, setSelectedVehicles] = useState<any[]>(() =>
        initialSelectedVehicle ? [initialSelectedVehicle] : []
    );
    const [editingVehicleIndex, setEditingVehicleIndex] = useState<number | null>(null);

    // Associated vehicles state (like web app) - from customer.purchasedVehicle
    const [associatedVehicles, setAssociatedVehicles] = useState<any[]>([]);

    // Branch options from global branch service
    const branchOptions = useMemo(() =>
        branches.map((branch: any) => ({ label: branch.name, value: branch.id }))
        , [branches]);
    const [executiveOptionsList, setExecutiveOptionsList] = useState<Array<{ label: string; value: string }>>([]);
    const [loadingExecutives, setLoadingExecutives] = useState(false);
    const [loadingCustomer, setLoadingCustomer] = useState(false);
    const [pendingExecutive, setPendingExecutive] = useState<{ id?: string; name?: string } | null>(null);
    const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [saving, setSaving] = useState(false);
    const toast = useToast();

    const clearFieldError = (key: string) => setFieldErrors(prev => ({ ...prev, [key]: '' }));

    // Multi-vehicle management functions (like web app)
    const addVehicle = (vehicle: any) => {
        console.log('🚀 Adding vehicle with paymentDetails:', vehicle.paymentDetails);

        const vehicleData = {
            ...vehicle,
            vehicleDetail: { id: vehicle.id, modelName: vehicle.name },
            // Preserve original price structure for colors and images
            originalPrice: vehicle.price, // Store original price with colors
            price: vehicle.priceDetails?.breakdown || {},
            priceDetails: vehicle.priceDetails,
            // Preserve payment details properly - don't override with defaults
            paymentDetails: vehicle.paymentDetails || {
                paymentType: 'cash',
                financerId: null,
                downPayment: null,
                financerTenure: { data: [] },
            },
        };

        console.log('✅ Final vehicleData paymentDetails:', vehicleData.paymentDetails);
        setSelectedVehicles([...selectedVehicles, vehicleData]);
    };

    const removeVehicle = (index: number) => {
        const newVehicles = [...selectedVehicles];
        newVehicles.splice(index, 1);
        setSelectedVehicles(newVehicles);
    };

    const editVehicle = (index: number) => {
        setEditingVehicleIndex(index);
        const vehicle = selectedVehicles[index];
        // Open in VIEW MODE (like web) - read-only with Price → Payment steps
        // Ensure we pass complete vehicle data including original price for colors
        navigation.navigate('SelectPrice', {
            vehicleId: vehicle.vehicleDetail?.id || vehicle.id,
            vehicleData: {
                ...vehicle,
                // Preserve original price structure for colors/image
                price: vehicle.originalPrice || vehicle.price,
                // Keep existing data
                priceDetails: vehicle.priceDetails,
                paymentDetails: vehicle.paymentDetails,
                vehicleDetail: vehicle.vehicleDetail,
            },
            returnTo: 'AddQuotation',
            viewMode: true, // View mode like web
            paymentDetails: vehicle.paymentDetails,
        });
    };

    const editVehicleInEditMode = (index: number) => {
        setEditingVehicleIndex(index);
        const vehicle = selectedVehicles[index];
        // Open in EDIT MODE - full editing capabilities
        // Ensure we pass complete vehicle data including original price for colors
        navigation.navigate('SelectPrice', {
            vehicleId: vehicle.vehicleDetail?.id || vehicle.id,
            vehicleData: {
                ...vehicle,
                // Preserve original price structure for colors/image
                price: vehicle.originalPrice || vehicle.price,
                // Keep existing data
                priceDetails: vehicle.priceDetails,
                paymentDetails: vehicle.paymentDetails,
                vehicleDetail: vehicle.vehicleDetail,
            },
            returnTo: 'AddQuotation',
            viewMode: false, // Edit mode
            paymentDetails: vehicle.paymentDetails,
        });
    };

    const handleVehicleSelectionReturn = (route: any) => {
        const { selectedVehicle: returnedVehicle, vehicleData, paymentDetails: returnedPaymentDetails } = route.params || {};
        console.log('🔄 AddQuotation - Vehicle selection return:', {
            returnedVehicle,
            vehicleData,
            returnedPaymentDetails
        });

        if (returnedVehicle || vehicleData) {
            const vehicle = returnedVehicle || vehicleData;

            // Ensure paymentDetails are properly attached to the vehicle
            const updatedVehicle = {
                ...vehicle,
                paymentDetails: returnedPaymentDetails || vehicle.paymentDetails
            };

            console.log('🚀 AddQuotation - Final vehicle with paymentDetails:', updatedVehicle);

            if (editingVehicleIndex !== null) {
                // Update existing vehicle
                const newVehicles = [...selectedVehicles];
                newVehicles[editingVehicleIndex] = updatedVehicle;
                setSelectedVehicles(newVehicles);
                setEditingVehicleIndex(null);
            } else {
                // Add new vehicle
                addVehicle(updatedVehicle);
            }
        }
    };

    // Handle vehicle selection return from navigation
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            handleVehicleSelectionReturn(route);
        });
        return unsubscribe;
    }, [route.params]);

    const validate = () => {
        const errors: Record<string, string> = {};

        if (!branch) errors.branch = 'Branch is required';
        if (!salesExecutive) errors.salesExecutive = 'Sales Executive is required';
        if (!customerPhone || customerPhone.replace(/\D/g, '').length !== 10) {
            errors.customerPhone = 'Valid 10-digit phone is required';
        }
        if (!customerName.trim()) errors.customerName = 'Customer Name is required';
        if (!locality.trim()) errors.locality = 'Locality is required';
        if (!followUpDate.trim()) {
            errors.followUpDate = 'Follow-Up Date is required';
        } else if (isPastDate(followUpDate)) {
            errors.followUpDate = 'Past follow-up date not allowed';
        }
        if (!followUpTime.trim()) setFollowUpTime('12:00');
        if (!leadSource) errors.leadSource = 'Lead Source is required';
        if (!expectedPurchaseDate.trim()) {
            errors.expectedPurchaseDate = 'Expected Purchase Date is required';
        } else if (isPastDate(expectedPurchaseDate)) {
            errors.expectedPurchaseDate = 'Past purchase date not allowed';
        }
        if (!enquiryType) errors.enquiryType = 'Enquiry Type is required';
        if (selectedVehicles.length === 0) errors.vehicleName = 'Please select at least one vehicle';

        setFieldErrors(errors);

        const errorKeys = Object.keys(errors).filter(k => !!errors[k]);
        if (errorKeys.length > 0) {
            const firstError = errors[errorKeys[0]];
            toast.error(firstError);
            return false;
        }
        return true;
    };

    const leadSources = useMemo(
        () => [
            { label: 'Walk In', value: 'WALK IN' },
            { label: 'Call Enquiry', value: 'CALL ENQUIRY' },
            { label: 'Referral', value: 'REFERRAL' },
            { label: 'Social Media', value: 'SOCIAL MEDIA' },
            { label: 'SMS', value: 'SMS' },
            { label: 'Newspaper', value: 'NEWSPAPER' },
            { label: 'Television Ad', value: 'TELEVISION AD' },
            { label: 'Leaflet', value: 'LEAFLET' },
        ],
        []
    );

    const customerTypes = useMemo(
        () => [
            { label: 'Sales Customer', value: 'Sales Customer' },
            { label: 'Service Customer', value: 'Service Customer' },
            { label: 'Non Customer', value: 'Non Customer' },
        ],
        []
    );

    const enquiryTypes = useMemo(
        () => [
            { label: 'Hot', value: 'Hot' },
            { label: 'Warm', value: 'Warm' },
            { label: 'Cold', value: 'Cold' },
        ],
        []
    );

    const followUpEnabled = !!followUpDate?.trim();
    const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);
    const [showExpectedPicker, setShowExpectedPicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [showExecutiveModal, setShowExecutiveModal] = useState(false);
    const [showCustomerTypeModal, setShowCustomerTypeModal] = useState(false);
    const [showLeadSourceModal, setShowLeadSourceModal] = useState(false);
    const [showEnquiryTypeModal, setShowEnquiryTypeModal] = useState(false);

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

    const buildHourOptions = () => {
        return Array.from({ length: 14 }, (_, idx) => idx + 1);
    };



    const autoSelectExecutive = (execId?: string, execName?: string) => {
        if (execId && executiveOptionsList.some((e) => e.value === execId)) {
            setSalesExecutive(execId);
            return;
        }
        if (execName) {
            const match = executiveOptionsList.find((e) => e.label?.includes(execName));
            if (match) setSalesExecutive(match.value);
        }
    };

    const fetchExecutives = async (branchId: string) => {
        console.log('🎯 AddQuotation - fetchExecutives called with branchId:', branchId);
        if (!branchId) {
            console.log('❌ AddQuotation - No branchId provided');
            return;
        }
        setLoadingExecutives(true);
        try {
            console.log('👤 AddQuotation - isManager:', isManager); // Use component-level isManager

            const res = await getUsers({
                size: 1000,
                page: 1,
                manager: isManager // Use component-level isManager
            });
            console.log('📞 AddQuotation - API call with manager:', isManager);
            const data = res?.data;
            console.log('📊 AddQuotation - API response:', data);

            if (data && data.code === 200 && data.response?.code === 200) {
                const users = Array.isArray(data.response?.data?.users) ? data.response.data.users : [];
                console.log('👥 AddQuotation - Total users fetched:', users.length);

                const filtered = users
                    .filter((user: any) => {
                        const departmentType = Array.isArray(user?.profile?.department?.departmentType)
                            ? user.profile.department.departmentType
                            : [];
                        const isSales = departmentType.includes('Sales');
                        // console.log('🔍 User:', user?.profile?.employeeName, 'Sales:', isSales, 'Status:', user?.status);

                        if (!isSales || user?.status !== true) return false;
                        const br = user?.profile?.branch;
                        const branches = Array.isArray(br) ? br : br ? [br] : [];
                        return branches.some((b: any) => (typeof b === 'string' ? b === branchId : b?.id === branchId));
                    })
                    .map((user: any) => ({
                        label: `${user?.profile?.employeeName || 'Executive'}${user?.profile?.employeeId ? ` (${user.profile.employeeId})` : ''}`,
                        value: user.id,
                    }));

                console.log('✅ AddQuotation - Filtered executives:', filtered);
                console.log('📈 AddQuotation - Executive options count:', filtered.length);
                setExecutiveOptionsList(filtered);

                // Get logged-in user profile to auto-select as sales executive
                try {
                    const loggedInUserId = user?.id; // Use component-level user

                    // Auto-select logic based on manager access
                    if (filtered.length > 0) {
                        if (pendingExecutive?.id) {
                            const match = filtered.find((o: any) => o.value === pendingExecutive.id);
                            if (match) setSalesExecutive(match.value);
                            else setSalesExecutive(filtered[0].value);
                        } else if (pendingExecutive?.name) {
                            const match = filtered.find((o: any) => o.label.includes(pendingExecutive.name!));
                            if (match) setSalesExecutive(match.value);
                            else setSalesExecutive(filtered[0].value);
                        } else if (!salesExecutive) {
                            if (isManager) { // Use component-level isManager
                                // Manager: Auto-select logged-in user if found, otherwise first
                                if (loggedInUserId) {
                                    const loggedInExecutive = filtered.find((o: any) => o.value === loggedInUserId);
                                    if (loggedInExecutive) {
                                        setSalesExecutive(loggedInExecutive.value);
                                        console.log('👨‍💼 Manager - Auto-selected logged-in user:', loggedInExecutive.label);
                                    } else {
                                        setSalesExecutive(filtered[0].value);
                                        console.log('🤷 Manager - Logged-in user not in list, selected first:', filtered[0].label);
                                    }
                                } else {
                                    setSalesExecutive(filtered[0].value);
                                    console.log('🤷 Manager - No logged-in user ID, selected first:', filtered[0].label);
                                }
                            } else {
                                // Non-manager: Auto-select self if found, otherwise first
                                if (loggedInUserId) {
                                    const loggedInExecutive = filtered.find((o: any) => o.value === loggedInUserId);
                                    if (loggedInExecutive) {
                                        setSalesExecutive(loggedInExecutive.value);
                                        console.log('👤 Non-manager - Auto-selected self:', loggedInExecutive.label);
                                    } else {
                                        setSalesExecutive(filtered[0].value);
                                        console.log('🤷 Non-manager - Self not in list, selected first:', filtered[0].label);
                                    }
                                } else {
                                    setSalesExecutive(filtered[0].value);
                                    console.log('🤷 Non-manager - No logged-in user ID, selected first:', filtered[0].label);
                                }
                            }
                        }
                    }
                } catch (profileError) {
                    // Fallback to original logic if profile fetch fails
                    if (filtered.length > 0 && !salesExecutive) {
                        setSalesExecutive(filtered[0].value);
                    }
                }
            } else {
                setExecutiveOptionsList([]);
            }
        } catch (e) {
            console.error('💥 AddQuotation - Error in fetchExecutives:', e);
            setExecutiveOptionsList([]);
        } finally {
            setLoadingExecutives(false);
        }
    };

    const hydrateCustomer = (cust: any) => {
        if (!cust) return;
        setFoundCustomerId(cust.id || null);
        setCustomerName(cust.name || cust.customerName || '');
        const g = String(cust.gender || '').toLowerCase();
        if (g === 'female' || g === 'male') setGender(g);
        const custType = cust.customerType || cust.type;
        if (custType && customerTypes.some((c) => c.value === custType)) {
            setCustomerType(custType);
        } else if (custType) {
            setCustomerType(String(custType));
        } else {
            setCustomerType('Non Customer');
        }
        setLocality(cust.address?.locality || cust.locality || '');
        if (cust.leadSource) setLeadSource(cust.leadSource);

        const vehiclesRaw = cust.purchasedVehicle || cust.vehicle || [];
        const mappedVehicles = Array.isArray(vehiclesRaw) ? vehiclesRaw.map((v: any) => ({
            regNo: v?.registerNo || v?.regNo || v?.registrationNo || '-',
            name: v?.vehicle?.vehicleDetail?.modelName || v?.vehicleDetail?.modelName || v?.modelName || '-',
        })) : [];
        setAssociatedVehicles(mappedVehicles);

        setLocalityEditable(false);

        const execId =
            cust?.executive?.id ||
            cust?.assignedExecutive?.id ||
            cust?.quotation?.[0]?.executive?.id ||
            cust?.quotation?.[0]?.assignedExecutive?.id;
        const execName =
            cust?.executive?.profile?.employeeName ||
            cust?.assignedExecutive?.profile?.employeeName ||
            cust?.quotation?.[0]?.executive?.profile?.employeeName ||
            cust?.quotation?.[0]?.assignedExecutive?.profile?.employeeName;
        setPendingExecutive({ id: execId, name: execName });
        autoSelectExecutive(execId, execName);
    };

    const clearCustomerFields = () => {
        setFoundCustomerId(null);
        setCustomerName('');
        setCustomerType('');
        setLocality('');
        setLeadSource('');
        setGender('male');
        setAssociatedVehicles([]);
    };

    const lookupCustomerByPhone = async (phone: string) => {
        if (phone.length !== 10) return;
        setLoadingCustomer(true);
        try {
            const res = await getCustomerByPhoneNo(phone);
            const data = res?.data;
            const payload = data?.response?.data || data?.data || {};
            const customersRaw =
                payload?.customers ||
                payload?.customer ||
                payload?.data?.customers ||
                payload?.data?.customer ||
                payload;
            const customers = Array.isArray(customersRaw) ? customersRaw : customersRaw ? [customersRaw] : [];
            if (Array.isArray(customers) && customers.length > 0) {
                hydrateCustomer(customers[0]);
                setLookupStatus({ type: 'success', message: 'User found' });
            } else {
                clearCustomerFields();
                setCustomerType('Non Customer');
                setLocalityEditable(true);
                setLookupStatus({ type: 'error', message: 'User not found' });
            }
            if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
            lookupTimerRef.current = setTimeout(() => setLookupStatus(null), 3000);
        } catch (e) {
            clearCustomerFields();
            setCustomerType('Non Customer');
            setLocalityEditable(true);
            const status = (e as any)?.response?.status;
            const apiMessage =
                (e as any)?.response?.data?.response?.message ||
                (e as any)?.response?.data?.message;
            if (status === 404) {
                setLookupStatus({ type: 'error', message: 'User not found' });
            } else if (apiMessage) {
                setLookupStatus({ type: 'error', message: apiMessage });
            } else {
                setLookupStatus({ type: 'error', message: 'Unable to verify user' });
            }
            if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
            lookupTimerRef.current = setTimeout(() => setLookupStatus(null), 3000);
        } finally {
            setLoadingCustomer(false);
        }
    };

    // Auto-fill branch using the global branch service
    useEffect(() => {
        const autoBranchId = getBranchId();
        const autoBranchName = getBranchName();

        if (autoBranchId && !branch && !branchLoading) {
            console.log('🎯 AddQuotation – Auto-filling branch:', autoBranchName, `(${autoBranchId})`);
            setBranch(autoBranchId);
        }
    }, [getBranchId, getBranchName, branch, branchLoading]);

    useEffect(() => {
        console.log('🏢 AddQuotation - Branch changed to:', branch);
        if (!branch) {
            console.log('🚫 AddQuotation - No branch selected, skipping executive fetch');
            return;
        }
        console.log('✅ AddQuotation - Branch selected, fetching executives');
        setSalesExecutive('');
        fetchExecutives(branch);
    }, [branch]);

    useEffect(() => {
        if (!pendingExecutive) return;
        autoSelectExecutive(pendingExecutive.id, pendingExecutive.name);
    }, [executiveOptionsList]);

    useEffect(() => {
        const digits = customerPhone.replace(/\D/g, '');
        if (digits.length === 10) {
            if (lastLookupRef.current !== digits) {
                lastLookupRef.current = digits;
                lookupCustomerByPhone(digits);
            }
        } else {
            setLocalityEditable(false);
            clearCustomerFields();
            lastLookupRef.current = '';
            setLookupStatus(null);
        }
    }, [customerPhone]);

    useEffect(() => {
        if (!followUpDate?.trim()) {
            setFollowUpTime('');
            setExpectedPurchaseDate('');
        }
    }, [followUpDate]);

    useEffect(() => {
        return () => {
            if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
        };
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        setBranch('');
        setSalesExecutive('');
        setCustomerPhone('');
        setCustomerName('');
        setGender('male');
        setCustomerType('');
        setLocality('');
        setFollowUpDate('');
        setFollowUpTime('');
        setFollowUpDateError('');
        setExpectedPurchaseDateError('');
        setLeadSource('');
        setExpectedPurchaseDate('');
        setTestDriveTaken('yes');
        setEnquiryType('');
        setRemarks('');
        setLocalityEditable(false);
        setLookupStatus(null);
        setPendingExecutive(null);
        lastLookupRef.current = '';
        setFieldErrors({});
        setRefreshing(false);
    };

    const STATUS_STEPS = ['Quoted', 'Booked', 'Sold'];
    const currentStatus = 0; // Default to "Quoted"

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white border-b border-gray-100 px-4 py-4 flex-row items-center">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2">
                    <ChevronLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text className="text-gray-900 text-xl font-bold">Add Quotation</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                >
                    {/* Branch & Sales Executive */}
                    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
                        <Text className="text-gray-900 font-bold text-base mb-4 border-b border-gray-50 pb-2">
                            Branch & Executive
                        </Text>

                        <View className="mb-4">
                            <FormLabel label="Branch" required />
                            <SelectField
                                placeholder="Select Branch"
                                value={branch}
                                options={branchOptions}
                                onSelect={(v) => { setBranch(v); clearFieldError('branch'); }}
                                error={fieldErrors.branch}
                                modalVisible={showBranchModal}
                                setModalVisible={setShowBranchModal}
                            />

                        </View>

                        <View>
                            <FormLabel label="Sales Executive" required />

                            <SelectField
                                placeholder="Select Executive"
                                value={salesExecutive}
                                options={executiveOptionsList}
                                onSelect={(v) => { setSalesExecutive(v); clearFieldError('salesExecutive'); }}
                                error={fieldErrors.salesExecutive}
                                modalVisible={showExecutiveModal}
                                setModalVisible={setShowExecutiveModal}
                            />
                            {loadingExecutives && (
                                <Text className="text-xs text-gray-400 mt-1">Loading executives...</Text>
                            )}
                            <ErrorText message={fieldErrors.salesExecutive} />
                        </View>
                    </View>

                    {/* Customer Info */}
                    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
                        <Text className="text-gray-900 font-bold text-base mb-4 border-b border-gray-50 pb-2">
                            Customer Information
                        </Text>

                        {/* Phone */}
                        <View className="mb-4">
                            <FormLabel label="Customer Phone" required />
                            <View className="flex-row gap-2">
                                <View className="bg-gray-100 border border-gray-200 rounded-xl px-3 h-12 items-center justify-center w-16">
                                    <Text className="text-gray-600 font-medium">+91</Text>
                                </View>
                                <TextInput
                                    placeholder="Mobile Number"
                                    value={customerPhone}
                                    onChangeText={(value) => {
                                        const digits = value.replace(/\D/g, '').slice(0, 10);
                                        setCustomerPhone(digits);
                                        clearFieldError('customerPhone');
                                    }}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    className={`flex-1 bg-white rounded-xl px-4 h-12 text-gray-900 border ${fieldErrors.customerPhone ? 'border-red-500' : 'border-gray-200'}`}
                                />
                            </View>
                            {loadingCustomer && (
                                <Text className="text-xs text-gray-400 mt-1">Searching customer...</Text>
                            )}
                            {lookupStatus && !loadingCustomer && (
                                <View
                                    className={`mt-2 px-3 py-2 rounded-lg border ${lookupStatus.type === 'success'
                                        ? 'bg-emerald-50 border-emerald-200'
                                        : 'bg-red-50 border-red-200'
                                        }`}
                                >
                                    <Text
                                        className={`text-xs font-semibold ${lookupStatus.type === 'success' ? 'text-emerald-700' : 'text-red-700'
                                            }`}
                                    >
                                        {lookupStatus.message}
                                    </Text>
                                </View>
                            )}
                            <ErrorText message={fieldErrors.customerPhone} />
                        </View>

                        {/* Name */}
                        <View className="mb-4">
                            <FormLabel label="Customer Name" required />
                            <TextInput
                                placeholder="Customer Name"
                                value={customerName}
                                onChangeText={(v) => { setCustomerName(v); clearFieldError('customerName'); }}
                                className={`bg-white border rounded-xl px-4 h-12 text-gray-900 ${fieldErrors.customerName ? 'border-red-500' : 'border-gray-200'}`}
                            />
                            <ErrorText message={fieldErrors.customerName} />
                        </View>

                        {/* Gender */}
                        <View className="mb-4">
                            <FormLabel label="Gender" required />
                            <View className="flex-row mt-1">
                                <RadioOption
                                    label="Male"
                                    selected={gender === 'male'}
                                    onPress={() => setGender('male')}
                                />
                                <RadioOption
                                    label="Female"
                                    selected={gender === 'female'}
                                    onPress={() => setGender('female')}
                                />
                            </View>
                        </View>

                        {/* Customer Type */}
                        <View className="mb-4">
                            <FormLabel label="Customer Type" />
                            <SelectField
                                placeholder="Customer Type"
                                value={customerType}
                                options={customerTypes}
                                onSelect={setCustomerType}
                                modalVisible={showCustomerTypeModal}
                                setModalVisible={setShowCustomerTypeModal}
                            />
                        </View>

                        {/* Locality */}
                        <View>
                            <FormLabel label="Locality" required />
                            <TextInput
                                placeholder="Locality"
                                value={locality}
                                onChangeText={(v) => { setLocality(v); clearFieldError('locality'); }}
                                editable={localityEditable}
                                className={`border rounded-xl px-4 h-12 text-gray-900 ${localityEditable ? (fieldErrors.locality ? 'bg-white border-red-500' : 'bg-white border-gray-200') : 'bg-gray-100 border-gray-200'}`}
                            />
                            <ErrorText message={fieldErrors.locality} />
                        </View>
                    </View>

                    {/* Schedule & Lead Info */}
                    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
                        <Text className="text-gray-900 font-bold text-base mb-4 border-b border-gray-50 pb-2">
                            Follow-up & Lead Details
                        </Text>

                        {/* Follow-Up Date */}
                        <View className="mb-4">
                            <FormLabel label="Schedule Follow-Up Date" required />
                            <View className="relative">
                                <TextInput
                                    placeholder="DD/MM/YYYY"
                                    value={followUpDate}
                                    onChangeText={(value) => {
                                        setFollowUpDate(value);
                                        setFollowUpDateError('');
                                        clearFieldError('followUpDate');
                                    }}
                                    onBlur={() => {
                                        if (followUpDate && isPastDate(followUpDate)) {
                                            setFollowUpDateError('Past date not allowed');
                                        }
                                    }}
                                    className={`bg-white border rounded-xl px-4 h-12 text-gray-900 pr-12 ${fieldErrors.followUpDate ? 'border-red-500' : 'border-gray-200'}`}
                                />
                                <TouchableOpacity
                                    onPressIn={() => setShowFollowUpPicker(true)}
                                    className="absolute right-4 top-3.5"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Calendar size={18} color={COLORS.gray[400]} />
                                </TouchableOpacity>
                            </View>
                            {!!followUpDateError && (
                                <Text className="text-xs text-red-600 mt-1">{followUpDateError}</Text>
                            )}
                            <ErrorText message={fieldErrors.followUpDate} />
                        </View>

                        {/* Follow-Up Time */}
                        <View className="mb-4">
                            <FormLabel label="Schedule Follow-Up Time" required />
                            <TouchableOpacity
                                onPress={() => {
                                    if (followUpEnabled) {
                                        setShowTimePicker(true);
                                    }
                                }}
                                activeOpacity={0.7}
                                className={`border rounded-xl px-3 h-11 flex-row items-center justify-between ${followUpEnabled ? (fieldErrors.followUpTime ? 'bg-white border-red-500' : 'bg-white border-gray-200') : 'bg-gray-100 border-gray-200'}`}
                            >
                                <Text className={followUpTime ? 'text-gray-900' : 'text-gray-400'}>
                                    {followUpTime || 'Select time'}
                                </Text>
                                <Clock size={18} color={COLORS.gray[400]} />
                            </TouchableOpacity>
                            <ErrorText message={fieldErrors.followUpTime} />
                        </View>

                        {/* Lead Source */}
                        <View className="mb-4">
                            <FormLabel label="Lead Source" required />
                            <SelectField
                                placeholder="Lead Source"
                                value={leadSource}
                                options={leadSources}
                                onSelect={(v) => { setLeadSource(v); clearFieldError('leadSource'); }}
                                error={fieldErrors.leadSource}
                                modalVisible={showLeadSourceModal}
                                setModalVisible={setShowLeadSourceModal}
                            />
                            <ErrorText message={fieldErrors.leadSource} />
                        </View>

                        {/* Expected Date of Purchase */}
                        <View className="mb-4">
                            <FormLabel label="Expected Date of Purchase" required />
                            <View className="relative">
                                <TextInput
                                    placeholder="DD/MM/YYYY"
                                    value={expectedPurchaseDate}
                                    onChangeText={(value) => {
                                        setExpectedPurchaseDate(value);
                                        setExpectedPurchaseDateError('');
                                        clearFieldError('expectedPurchaseDate');
                                    }}
                                    onBlur={() => {
                                        if (expectedPurchaseDate && isPastDate(expectedPurchaseDate)) {
                                            setExpectedPurchaseDateError('Past date not allowed');
                                        }
                                    }}
                                    editable={followUpEnabled}
                                    className={`border rounded-xl px-4 h-12 text-gray-900 pr-12 ${followUpEnabled ? (fieldErrors.expectedPurchaseDate ? 'border-red-500 bg-white' : 'bg-white border-gray-200') : 'bg-gray-100 border-gray-200'}`}
                                />
                                <TouchableOpacity
                                    onPressIn={() => {
                                        if (!followUpEnabled) return;
                                        setShowExpectedPicker(true);
                                    }}
                                    className="absolute right-4 top-3.5"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Calendar size={18} color={COLORS.gray[400]} />
                                </TouchableOpacity>
                            </View>
                            {!!expectedPurchaseDateError && (
                                <Text className="text-xs text-red-600 mt-1">{expectedPurchaseDateError}</Text>
                            )}
                            <ErrorText message={fieldErrors.expectedPurchaseDate} />
                        </View>

                        {/* Test Drive Taken */}
                        <View>
                            <FormLabel label="Test Drive Taken" required />
                            <View className="flex-row mt-1">
                                <RadioOption
                                    label="Yes"
                                    selected={testDriveTaken === 'yes'}
                                    onPress={() => setTestDriveTaken('yes')}
                                />
                                <RadioOption
                                    label="No"
                                    selected={testDriveTaken === 'no'}
                                    onPress={() => setTestDriveTaken('no')}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Vehicle & Enquiry */}
                    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
                        <Text className="text-gray-900 font-bold text-base mb-4 border-b border-gray-50 pb-2">
                            Vehicle & Enquiry
                        </Text>

                        {/* Enquiry Type */}
                        <View className="mb-4">
                            <FormLabel label="Enquiry Type" required />
                            <SelectField
                                placeholder="Enquiry Type"
                                value={enquiryType}
                                options={enquiryTypes}
                                modalVisible={showEnquiryTypeModal}
                                setModalVisible={setShowEnquiryTypeModal}
                                onSelect={(v) => { setEnquiryType(v); clearFieldError('enquiryType'); }}
                                error={fieldErrors.enquiryType}
                            />
                            <ErrorText message={fieldErrors.enquiryType} />
                        </View>

                        {/* Vehicle Name - Multi-vehicle Tag Display */}
                        <View className="mb-4">
                            <FormLabel label="Vehicle Name" required />

                            {/* Vehicle Tags Display (like web app) */}
                            <View className="flex-row flex-wrap gap-2 mb-3">
                                {selectedVehicles.length > 0 ? (
                                    selectedVehicles.map((vehicle, index) => {
                                        // Get the model name from various possible fields
                                        const modelName = vehicle.name ||
                                            vehicle.vehicleDetail?.modelName ||
                                            vehicle.modelName ||
                                            vehicle.model?.modelName ||
                                            `Vehicle ${index + 1}`;

                                        console.log(`🏷️ Tag ${index}:`, { modelName, vehicle });

                                        return (
                                            <View
                                                key={index}
                                                className="bg-teal-50 border border-teal-200 rounded-lg px-3 py-2 flex-row items-center min-w-[120px]"
                                            >
                                                {/* Main tag text - VIEW MODE (like web) */}
                                                <TouchableOpacity
                                                    onPress={() => editVehicle(index)}
                                                    className="flex-1 min-w-[80px]"
                                                >
                                                    <Text
                                                        className="text-teal-800 font-bold text-sm"
                                                        numberOfLines={2}
                                                        ellipsizeMode="tail"
                                                        style={{ minWidth: 80 }}
                                                    >
                                                        {modelName}
                                                    </Text>
                                                </TouchableOpacity>

                                                {/* Edit button - EDIT MODE (like web) */}
                                                <TouchableOpacity
                                                    onPress={() => editVehicleInEditMode(index)}
                                                    className="ml-1 bg-blue-500 rounded-full w-5 h-5 items-center justify-center flex-shrink-0"
                                                >
                                                    <Edit2 size={12} color="white" />
                                                </TouchableOpacity>

                                                {/* Delete button */}
                                                <TouchableOpacity
                                                    onPress={() => removeVehicle(index)}
                                                    className="ml-1 bg-teal-600 rounded-full w-5 h-5 items-center justify-center flex-shrink-0"
                                                >
                                                    <Text className="text-white text-xs leading-none">×</Text>
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })
                                ) : (
                                    <Text className="text-gray-400 text-sm italic">No vehicles selected</Text>
                                )}
                            </View>

                            {/* Instructions */}
                            <View className="mb-3 flex-row gap-4">
                                <View className="flex-row items-center gap-1">
                                    <View className="w-3 h-3 bg-teal-600 rounded-full" />
                                    <Text className="text-xs text-gray-600">Tap to view</Text>
                                </View>
                                <View className="flex-row items-center gap-1">
                                    <View className="w-3 h-3 bg-blue-500 rounded-full" />
                                    <Text className="text-xs text-gray-600">Edit</Text>
                                </View>
                                <View className="flex-row items-center gap-1">
                                    <View className="w-3 h-3 bg-red-500 rounded-full" />
                                    <Text className="text-xs text-gray-600">Remove</Text>
                                </View>
                            </View>

                            {/* Add Vehicle Button */}
                            <TouchableOpacity
                                onPress={() => {
                                    setEditingVehicleIndex(null);
                                    navigation.navigate('SelectModel', { returnTo: 'AddQuotation' });
                                    clearFieldError('vehicleName');
                                }}
                                className={`bg-white border rounded-xl px-4 h-12 flex-row items-center justify-center ${fieldErrors.vehicleName ? 'border-red-500' : 'border-gray-200'}`}
                                activeOpacity={0.7}
                            >
                                <Plus size={16} color={COLORS.primary} />
                                <Text className="text-teal-600 font-bold ml-2">
                                    Add Vehicle
                                </Text>
                            </TouchableOpacity>
                            <ErrorText message={fieldErrors.vehicleName} />
                        </View>

                        {/* Associated Vehicles Table */}
                        <View>
                            <FormLabel label="Associated Vehicles" />
                            <View className="border border-gray-200 rounded-xl overflow-hidden">
                                <View className="bg-slate-600 px-4 py-3 flex-row">
                                    <Text className="text-white text-sm font-bold flex-1">Reg No.</Text>
                                    <Text className="text-white text-sm font-bold flex-1">Vehicle</Text>
                                </View>
                                {associatedVehicles.length > 0 ? (
                                    associatedVehicles.map((vehicle, index) => (
                                        <View key={`${vehicle.regNo || 'assoc'}-${index}`} className="px-4 py-3 flex-row items-center border-t border-gray-50 bg-white">
                                            <Text className="text-gray-600 text-sm flex-1">{vehicle.regNo || '-'}</Text>
                                            <Text className="text-gray-900 text-sm flex-1 font-medium">{vehicle.name || '-'}</Text>
                                            <View className="w-4" />
                                        </View>
                                    ))
                                ) : (
                                    <View className="py-8 items-center justify-center">
                                        <Text className="text-gray-400 text-sm">No Data</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Remarks */}
                    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
                        <FormLabel label="Remarks" />
                        <TextInput
                            placeholder="Enter remarks"
                            value={remarks}
                            onChangeText={setRemarks}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 min-h-[100px]"
                        />
                    </View>

                    {/* Status Stepper */}
                    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                        <Text className="text-gray-900 font-bold text-base mb-4 border-b border-gray-50 pb-2">
                            Status
                        </Text>

                        {/* Step indicators */}
                        <View className="flex-row justify-between mb-3 px-2">
                            {STATUS_STEPS.map((label, index) => (
                                <View key={label} className="items-center flex-1">
                                    <View
                                        className={`w-4 h-4 rounded-full z-10 ${currentStatus >= index ? 'bg-teal-600' : 'bg-gray-200'
                                            }`}
                                    />
                                    <Text
                                        className={`text-xs mt-2 font-bold ${currentStatus >= index ? 'text-teal-600' : 'text-gray-400'
                                            }`}
                                    >
                                        {label}
                                    </Text>
                                </View>
                            ))}
                            <View className="absolute top-2 left-0 right-0 h-0.5 bg-gray-100 mx-10 -z-10" />
                        </View>

                        {/* Progress bar */}
                        <View className="mx-2 mb-2">
                            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <View
                                    className="h-2 bg-teal-600 rounded-full"
                                    style={{ width: `${(currentStatus / 2) * 100}%` }}
                                />
                            </View>
                        </View>

                        <View className="flex-row justify-between mt-2 px-1">
                            <Text className="text-gray-400 text-[10px] flex-1 text-center">
                                Customer got{'\n'}Quotation
                            </Text>
                            <Text className="text-gray-400 text-[10px] flex-1 text-center">
                                Customer Booked{'\n'}the Vehicle
                            </Text>
                            <Text className="text-gray-400 text-[10px] flex-1 text-center">
                                We sold{'\n'}the vehicle
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer Buttons */}
            <View className="bg-white p-4 border-t border-gray-100 flex-row gap-3">
                <Button
                    title="Cancel"
                    variant="outline"
                    className="flex-1"
                    onPress={() => navigation.navigate('Main', { screen: 'Quotations' })}
                />
                <Button
                    title={saving ? "Saving..." : "Save"}
                    className="flex-1"
                    disabled={saving}
                    onPress={async () => {

                        if (!validate()) return;
                        setSaving(true);
                        try {
                            const genRes = await generateQuotationId(branch);
                            const genData = genRes.data;
                            if (genData.code !== 200 || genData.response?.code !== 200) {
                                throw new Error('Failed to generate Quotation ID');
                            }
                            const { QuotationId, id: seqId, customerId } = genData.response.data;

                            const finalFollowUpTime = followUpTime.trim() || '12:00';

                            // Build vehicle array matching autoinn-fe flat format (multi-vehicle support)
                            // autoinn-fe sends: { vehicleDetail: modelId, price: priceObj, paymentDetails: {...}, financer, downPayment, financerTenure }
                            const vehicleArr = selectedVehicles.map((vehicle) => {
                                // Use paymentDetails from SelectPayment (correct structure)
                                const paymentDetails = vehicle.paymentDetails || {};
                                const tenureData = paymentDetails?.financerTenure || { data: [] };

                                const priceObj = {
                                    showroomPrice: Number(vehicle.priceDetails?.breakdown?.showroomPrice || vehicle.priceDetails?.totalAmount || 0),
                                    roadTax: Number(vehicle.priceDetails?.breakdown?.roadTax || 0),
                                    handlingCharges: Number(vehicle.priceDetails?.breakdown?.handlingCharges || 0),
                                    registrationFee: Number(vehicle.priceDetails?.breakdown?.registrationFee || 0),
                                    tcs: Number(vehicle.priceDetails?.breakdown?.tcs || 0),
                                    insuranceVId: null,
                                    totalAmount: Number(vehicle.priceDetails?.totalAmount || 0),
                                    insurance1plus5: Number(vehicle.priceDetails?.breakdown?.insurance1plus5 || 0),
                                    insurance5plus5: Number(vehicle.priceDetails?.breakdown?.insurance5plus5 || 0),
                                    insurance1plus5ZD: Number(vehicle.priceDetails?.breakdown?.insurance1plus5ZD || 0),
                                    insurance5plus5ZD: Number(vehicle.priceDetails?.breakdown?.insurance5plus5ZD || 0),
                                    warrantyPrice: Number(vehicle.priceDetails?.breakdown?.warrantyPrice || 0),
                                    amc: Number(vehicle.priceDetails?.breakdown?.amc || 0),
                                    rsa: Number(vehicle.priceDetails?.breakdown?.rsa || 0),
                                    otherCharges: Number(vehicle.priceDetails?.breakdown?.otherCharges || 0),
                                    discount: Number(vehicle.priceDetails?.breakdown?.discount || 0),
                                };

                                console.log('🚀 Building vehicle with paymentDetails:', paymentDetails);

                                return {
                                    vehicleDetail: { id: String(vehicle.vehicleDetail?.id || vehicle.id), modelName: vehicle.vehicleDetail?.modelName || vehicle.name || '' },
                                    price: priceObj,
                                    paymentDetails: {
                                        paymentType: paymentDetails?.paymentType || 'cash',
                                        financerId: paymentDetails?.financerId || null,
                                        downPayment: paymentDetails?.downPayment || null,
                                        financerTenure: tenureData,
                                    },
                                    financer: paymentDetails?.paymentType === 'finance' ? (paymentDetails?.financerId || null) : null,
                                    downPayment: paymentDetails?.paymentType === 'finance' ? (paymentDetails?.downPayment || null) : null,
                                    financerTenure: paymentDetails?.paymentType === 'finance' ? tenureData : { data: [] },
                                };
                            });

                            // Build quotation matching autoinn-fe structure exactly
                            // autoinn-fe spreads ...provisional (proCustomer data) into the quotation
                            const quotationObj: any = {
                                // ProCustomer fields (spread like ...provisional in autoinn-fe)
                                name: customerName.trim().toUpperCase(),
                                gender: gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase(),
                                locality: locality.trim().toUpperCase(),
                                phone: customerPhone,
                                // Quotation fields
                                quotationId: QuotationId,
                                id: seqId,
                                branch: branch,
                                quotationPhone: customerPhone,
                                customerName: customerName.trim().toUpperCase(),
                                leadSource: leadSource,
                                testDriveTaken: testDriveTaken === 'yes',
                                enquiryType: enquiryType.charAt(0).toUpperCase() + enquiryType.slice(1).toLowerCase(),
                                remarks: remarks,
                                executive: salesExecutive,
                                customerType: customerType || 'Non Customer',
                                scheduleDate: followUpDate.replace(/\//g, '-'),
                                scheduleTime: finalFollowUpTime + ':00',
                                expectedDateOfPurchase: expectedPurchaseDate.replace(/\//g, '-'),
                                vehicle: vehicleArr,
                            };



                            if (lookupStatus?.type === 'success' && foundCustomerId) {
                                quotationObj.customer = foundCustomerId;
                                quotationObj.customerId = null;
                            } else {
                                quotationObj.customer = null;
                                quotationObj.customerId = customerId;
                            }


                            const formData = new FormData();
                            formData.append('finalData', JSON.stringify(quotationObj));

                            const createRes = await createQuotation(formData);

                            if (createRes.data.code === 200 && createRes.data.response?.code === 200) {
                                toast.success('Quotation saved successfully');

                                // Go back to QuotationList page (correct flow)
                                console.log('🚀 Quotation saved, going back to QuotationList');
                                navigation.navigate('Main', { screen: 'Quotations' });
                            } else {
                                const errMsg = createRes.data.response?.message || createRes.data.message || 'Unable to save quotation';
                                toast.error(errMsg);
                            }
                        } catch (err: any) {

                            let errMsg = err.message || 'Something went wrong while saving';
                            if (err.response?.data?.response?.message) errMsg = err.response.data.response.message;
                            else if (err.response?.data?.message) errMsg = err.response.data.message;
                            toast.error(errMsg);
                        } finally {
                            setSaving(false);
                        }
                    }}
                />
            </View>

            <Modal visible={showFollowUpPicker} transparent animationType="fade" onRequestClose={() => setShowFollowUpPicker(false)}>
                <View className="flex-1 bg-black/40 items-center justify-center px-4">
                    <View className="bg-white rounded-2xl p-4 w-full max-w-md">
                        <Text className="text-gray-900 font-bold mb-3">Select Schedule Date</Text>
                        <RNCalendar
                            current={followUpDate ? followUpDate.split('/').reverse().join('-') : undefined}
                            minDate={new Date().toISOString().split('T')[0]}
                            onDayPress={(day) => {
                                const [yyyy, mm, dd] = day.dateString.split('-');
                                setFollowUpDate(`${dd}/${mm}/${yyyy}`);
                                setFollowUpDateError('');
                            }}
                            theme={{
                                todayTextColor: COLORS.primary,
                                selectedDayBackgroundColor: COLORS.primary,
                                selectedDayTextColor: '#fff',
                                arrowColor: COLORS.primary,
                                textSectionTitleColor: '#6b7280',
                            }}
                            markedDates={
                                followUpDate
                                    ? {
                                        [followUpDate.split('/').reverse().join('-')]: {
                                            selected: true,
                                            selectedColor: COLORS.primary,
                                        },
                                    }
                                    : undefined
                            }
                        />
                        <View className="flex-row justify-end mt-4">
                            <TouchableOpacity
                                onPress={() => setShowFollowUpPicker(false)}
                                className="px-4 py-2 rounded-lg bg-teal-600"
                            >
                                <Text className="text-white font-semibold">Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showExpectedPicker} transparent animationType="fade" onRequestClose={() => setShowExpectedPicker(false)}>
                <View className="flex-1 bg-black/40 items-center justify-center px-4">
                    <View className="bg-white rounded-2xl p-4 w-full max-w-md">
                        <Text className="text-gray-900 font-bold mb-3">Select Expected Purchase Date</Text>
                        <RNCalendar
                            current={expectedPurchaseDate ? expectedPurchaseDate.split('/').reverse().join('-') : undefined}
                            minDate={new Date().toISOString().split('T')[0]}
                            onDayPress={(day) => {
                                const [yyyy, mm, dd] = day.dateString.split('-');
                                setExpectedPurchaseDate(`${dd}/${mm}/${yyyy}`);
                                setExpectedPurchaseDateError('');
                            }}
                            theme={{
                                todayTextColor: COLORS.primary,
                                selectedDayBackgroundColor: COLORS.primary,
                                selectedDayTextColor: '#fff',
                                arrowColor: COLORS.primary,
                                textSectionTitleColor: '#6b7280',
                            }}
                            markedDates={
                                expectedPurchaseDate
                                    ? {
                                        [expectedPurchaseDate.split('/').reverse().join('-')]: {
                                            selected: true,
                                            selectedColor: COLORS.primary,
                                        },
                                    }
                                    : undefined
                            }
                        />
                        <View className="flex-row justify-end mt-4">
                            <TouchableOpacity
                                onPress={() => setShowExpectedPicker(false)}
                                className="px-4 py-2 rounded-lg bg-teal-600"
                            >
                                <Text className="text-white font-semibold">Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <TimePickerModal
                visible={showTimePicker}
                onClose={() => setShowTimePicker(false)}
                onSelect={(time: string) => {
                    setFollowUpTime(time);
                    setShowTimePicker(false);
                }}
            />
        </SafeAreaView>
    );
}
