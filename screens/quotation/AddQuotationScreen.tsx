import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    Modal,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import {
    Calendar,
    FileText,
    ChevronDown,
    Clock,
    ChevronLeft,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBranches, getCustomerByPhoneNo, getUsers } from '../../src/api';
import { Calendar as RNCalendar } from 'react-native-calendars';

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

// Reusable picker/select field
const SelectField = ({
    placeholder,
    value,
    options,
    onSelect,
    disabled = false,
    error,
}: {
    placeholder: string;
    value: string;
    options: { label: string; value: string }[];
    onSelect: (val: string) => void;
    disabled?: boolean;
    error?: string;
}) => {
    const [open, setOpen] = useState(false);
    const selectedLabel = options.find((o) => o.value === value)?.label || '';
    const listHeight = Math.min(options.length, 5) * 44 + 8;

    return (
        <View style={{ position: 'relative', zIndex: open ? 50 : 1 }}>
            <TouchableOpacity
                onPress={() => {
                    if (!disabled) setOpen(!open);
                }}
                className={`rounded-xl px-4 h-12 flex-row items-center justify-between border ${disabled ? 'bg-gray-100 border-gray-200' : error ? 'bg-white border-red-500' : 'bg-white border-gray-200'}`}
            >
                <Text className={selectedLabel ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedLabel || placeholder}
                </Text>
                <ChevronDown size={18} color={COLORS.gray[400]} />
            </TouchableOpacity>
            {open && (
                <View
                    style={{
                        position: 'absolute',
                        top: 52,
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        elevation: 10,
                    }}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                >
                    {options.map((opt) => (
                        <TouchableOpacity
                            key={opt.value}
                            onPress={() => {
                                onSelect(opt.value);
                                setOpen(false);
                            }}
                            className={`px-4 py-3 border-b border-gray-50 ${value === opt.value ? 'bg-teal-50' : ''}`}
                        >
                            <Text className={`text-sm ${value === opt.value ? 'text-teal-700 font-bold' : 'text-gray-700'}`}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            {open && <View style={{ height: listHeight }} />}
        </View>
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
    const selectedVehicle = route.params?.selectedVehicle;

    // Form state
    const [branch, setBranch] = useState('');
    const [salesExecutive, setSalesExecutive] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [gender, setGender] = useState('male');
    const [customerType, setCustomerType] = useState('');
    const [locality, setLocality] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [followUpTime, setFollowUpTime] = useState('');
    const [followUpDateError, setFollowUpDateError] = useState('');
    const [expectedPurchaseDateError, setExpectedPurchaseDateError] = useState('');
    const [leadSource, setLeadSource] = useState('');
    const [expectedPurchaseDate, setExpectedPurchaseDate] = useState('');
    const [testDriveTaken, setTestDriveTaken] = useState('yes');
    const [enquiryType, setEnquiryType] = useState('');
    const [remarks, setRemarks] = useState('');
    const [localityEditable, setLocalityEditable] = useState(false);
    const [lookupStatus, setLookupStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const lastLookupRef = useRef('');

    const [branchOptions, setBranchOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [executiveOptions, setExecutiveOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingExecutives, setLoadingExecutives] = useState(false);
    const [loadingCustomer, setLoadingCustomer] = useState(false);
    const [pendingExecutive, setPendingExecutive] = useState<{ id?: string; name?: string } | null>(null);
    const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const clearFieldError = (key: string) => setFieldErrors(prev => ({ ...prev, [key]: '' }));

    const validate = () => {
        const errors: Record<string, string> = {};
        if (!branch) errors.branch = 'Branch is required';
        if (!salesExecutive) errors.salesExecutive = 'Sales Executive is required';
        if (!customerPhone || customerPhone.replace(/\D/g, '').length !== 10) errors.customerPhone = 'Valid 10-digit phone is required';
        if (!customerName.trim()) errors.customerName = 'Customer Name is required';
        if (!locality.trim()) errors.locality = 'Locality is required';
        if (!followUpDate.trim()) errors.followUpDate = 'Follow-Up Date is required';
        if (followUpDate.trim() && isPastDate(followUpDate)) errors.followUpDate = 'Past date not allowed';
        if (!followUpTime.trim()) errors.followUpTime = 'Follow-Up Time is required';
        if (!leadSource) errors.leadSource = 'Lead Source is required';
        if (!expectedPurchaseDate.trim()) errors.expectedPurchaseDate = 'Expected Purchase Date is required';
        if (expectedPurchaseDate.trim() && isPastDate(expectedPurchaseDate)) errors.expectedPurchaseDate = 'Past date not allowed';
        if (!enquiryType) errors.enquiryType = 'Enquiry Type is required';
        if (!selectedVehicle) errors.vehicleName = 'Please select a vehicle';
        setFieldErrors(errors);
        return Object.keys(errors).every(k => !errors[k]);
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
    const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
    const [selectedHour, setSelectedHour] = useState<number | null>(null);
    const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
    const timeFieldRef = useRef<View | null>(null);
    const [timeDropdownLayout, setTimeDropdownLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);
    const [showExpectedPicker, setShowExpectedPicker] = useState(false);

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
        const now = new Date();
        const currentHour = now.getHours();
        const start = currentHour === 0 ? 1 : currentHour;
        return Array.from({ length: 23 - start }, (_, idx) => start + idx);
    };

    const minuteOptions = [15, 30, 45];

    const openTimeDropdown = () => {
        if (!followUpEnabled) return;
        if (timeFieldRef.current && typeof (timeFieldRef.current as any).measureInWindow === 'function') {
            (timeFieldRef.current as any).measureInWindow((x: number, y: number, width: number, height: number) => {
                setTimeDropdownLayout({ x, y, width, height });
                setTimeDropdownOpen(true);
            });
        } else {
            setTimeDropdownOpen(true);
        }
    };

    const autoSelectExecutive = (execId?: string, execName?: string) => {
        if (execId && executiveOptions.some((e) => e.value === execId)) {
            setSalesExecutive(execId);
            return;
        }
        if (execName) {
            const match = executiveOptions.find((e) => e.label?.includes(execName));
            if (match) setSalesExecutive(match.value);
        }
    };

    const fetchBranches = async () => {
        setLoadingBranches(true);
        try {
            const res = await getBranches();
            const data = res?.data;
            if (data && data.code === 200 && data.response?.code === 200) {
                const list = data.response.data || [];
                const options = list.map((b: any) => ({ label: b.name, value: b.id }));
                setBranchOptions(options);

                if (!branch && options.length > 0) {
                    const profileRaw = await AsyncStorage.getItem('userProfile');
                    const profile = profileRaw ? JSON.parse(profileRaw) : null;
                    const branchData = profile?.branch || profile?.profile?.branch;
                    const normalizeBranchId = (b: any) => (typeof b === 'string' ? b : b?.id || b?._id);
                    const profileBranch = Array.isArray(branchData)
                        ? normalizeBranchId(branchData[0])
                        : normalizeBranchId(branchData);
                    const initial =
                        options.find((option: { label: string; value: string }) => option.value === profileBranch) ||
                        options[0];
                    setBranch(initial.value);
                }
            } else {
                setBranchOptions([]);
            }
        } catch (e) {
            setBranchOptions([]);
        } finally {
            setLoadingBranches(false);
        }
    };

    const fetchExecutives = async (branchId: string) => {
        if (!branchId) return;
        setLoadingExecutives(true);
        try {
            const res = await getUsers({ size: 1000, page: 1 });
            const data = res?.data;
            if (data && data.code === 200 && data.response?.code === 200) {
                const users = Array.isArray(data.response?.data?.users) ? data.response.data.users : [];
                const filtered = users
                    .filter((user: any) => {
                        const departmentType = Array.isArray(user?.profile?.department?.departmentType)
                            ? user.profile.department.departmentType
                            : [];
                        const isSales = departmentType.includes('Sales');
                        if (!isSales || user?.status !== true) return false;
                        const br = user?.profile?.branch;
                        const branches = Array.isArray(br) ? br : br ? [br] : [];
                        return branches.some((b: any) => (typeof b === 'string' ? b === branchId : b?.id === branchId));
                    })
                    .map((user: any) => ({
                        label: `${user?.profile?.employeeName || 'Executive'}${user?.profile?.employeeId ? ` (${user.profile.employeeId})` : ''}`,
                        value: user.id,
                    }));
                setExecutiveOptions(filtered);
            } else {
                setExecutiveOptions([]);
            }
        } catch (e) {
            setExecutiveOptions([]);
        } finally {
            setLoadingExecutives(false);
        }
    };

    const hydrateCustomer = (cust: any) => {
        if (!cust) return;
        setCustomerName(cust.name || '');
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
        setCustomerName('');
        setCustomerType('');
        setLocality('');
        setLeadSource('');
        setPendingExecutive(null);
        setGender('male');
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

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        if (!branch) return;
        setSalesExecutive('');
        fetchExecutives(branch);
    }, [branch]);

    useEffect(() => {
        if (!pendingExecutive) return;
        autoSelectExecutive(pendingExecutive.id, pendingExecutive.name);
    }, [executiveOptions]);

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
        fetchBranches().finally(() => setRefreshing(false));
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
                            />
                            {loadingBranches && (
                                <Text className="text-xs text-gray-400 mt-1">Loading branches...</Text>
                            )}
                            <ErrorText message={fieldErrors.branch} />
                        </View>

                        <View>
                            <FormLabel label="Sales Executive" required />
                            <SelectField
                                placeholder="Select Executive"
                                value={salesExecutive}
                                options={executiveOptions}
                                onSelect={(v) => { setSalesExecutive(v); clearFieldError('salesExecutive'); }}
                                error={fieldErrors.salesExecutive}
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
                                disabled
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
                            <View ref={timeFieldRef} className="relative" style={{ zIndex: timeDropdownOpen ? 60 : 1 }}>
                                <TouchableOpacity
                                    onPress={() => {
                                        openTimeDropdown();
                                    }}
                                    activeOpacity={0.7}
                                    className={`border rounded-xl px-3 h-11 flex-row items-center justify-between ${followUpEnabled ? (fieldErrors.followUpTime ? 'bg-white border-red-500' : 'bg-white border-gray-200') : 'bg-gray-100 border-gray-200'}`}
                                >
                                    <Text className={followUpTime ? 'text-gray-900' : 'text-gray-400'}>
                                        {followUpTime || 'Select hour'}
                                    </Text>
                                    <Clock size={18} color={COLORS.gray[400]} />
                                </TouchableOpacity>
                            </View>
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
                                onSelect={(v) => { setEnquiryType(v); clearFieldError('enquiryType'); }}
                                error={fieldErrors.enquiryType}
                            />
                            <ErrorText message={fieldErrors.enquiryType} />
                        </View>

                        {/* Vehicle Name */}
                        <View className="mb-4">
                            <FormLabel label="Vehicle Name" required />
                            <TouchableOpacity
                                onPress={() => { navigation.navigate('SelectModel'); clearFieldError('vehicleName'); }}
                                className={`bg-white border rounded-xl px-4 h-12 flex-row items-center justify-center ${fieldErrors.vehicleName ? 'border-red-500' : 'border-gray-200'}`}
                                activeOpacity={0.7}
                            >
                                <FileText size={16} color={COLORS.primary} />
                                <Text className="text-teal-600 font-bold ml-2">
                                    {selectedVehicle ? selectedVehicle.name : 'Select Vehicle'}
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
                                <View className="py-8 items-center justify-center">
                                    <Text className="text-gray-400 text-sm">No Data</Text>
                                </View>
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
                    title="Save"
                    className="flex-1"
                    onPress={() => {
                        if (validate()) {
                            navigation.navigate('Main', { screen: 'Quotations' });
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
                                overflow: 'hidden',
                                elevation: 10,
                            }}
                        >
                            <View style={{ flexDirection: 'row' }}>
                                <ScrollView style={{ maxHeight: 200, flex: 1 }}>
                                    {buildHourOptions()
                                        .filter((hour) => hour <= 22)
                                        .map((hour) => (
                                            <TouchableOpacity
                                                key={`h-${hour}`}
                                                onPress={() => setSelectedHour(hour)}
                                                style={{
                                                    paddingHorizontal: 16,
                                                    paddingVertical: 12,
                                                    borderBottomWidth: 1,
                                                    borderBottomColor: '#f3f4f6',
                                                    backgroundColor: selectedHour === hour ? '#f0fdfa' : 'white',
                                                }}
                                            >
                                                <Text style={{ fontSize: 12, color: selectedHour === hour ? '#0f766e' : '#374151', fontWeight: selectedHour === hour ? '600' : '400' }}>
                                                    {String(hour).padStart(2, '0')}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                </ScrollView>
                                <View style={{ width: 1, backgroundColor: '#e5e7eb' }} />
                                <ScrollView style={{ maxHeight: 200, flex: 1 }}>
                                    {minuteOptions.map((minute) => (
                                        <TouchableOpacity
                                            key={`m-${minute}`}
                                            onPress={() => setSelectedMinute(minute)}
                                            style={{
                                                paddingHorizontal: 16,
                                                paddingVertical: 12,
                                                borderBottomWidth: 1,
                                                borderBottomColor: '#f3f4f6',
                                                backgroundColor: selectedMinute === minute ? '#f0fdfa' : 'white',
                                            }}
                                        >
                                            <Text style={{ fontSize: 12, color: selectedMinute === minute ? '#0f766e' : '#374151', fontWeight: selectedMinute === minute ? '600' : '400' }}>
                                                {String(minute).padStart(2, '0')}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                                <TouchableOpacity
                                    onPress={() => {
                                        if (selectedHour === null || selectedMinute === null) return;
                                        const label = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
                                        setFollowUpTime(label);
                                        setTimeDropdownOpen(false);
                                    }}
                                    style={{
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        borderRadius: 8,
                                        backgroundColor: selectedHour !== null && selectedMinute !== null ? '#0d9488' : '#e5e7eb',
                                    }}
                                    disabled={selectedHour === null || selectedMinute === null}
                                >
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: selectedHour !== null && selectedMinute !== null ? 'white' : '#6b7280' }}>
                                        Select
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}
