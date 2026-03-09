import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Alert,
    Platform,
    Dimensions,
    DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
    ChevronLeft,
    Calendar,
    Clock,
    X,
    Eye,
    User,
    Edit,
    Phone,
    CalendarDays,
    Car,
    Mail,
    FileText,
    Hash,
    MessageSquare
} from 'lucide-react-native';
import { RootStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import AttachQuotationModal from '../../components/AttachQuotationModal';
import { getActivitiesByCustomer, getCustomerByPhoneNo, getCustomerQuotations, getMergedCustomerData, getCustomerDetails, updateCustomer, attachQuotation, createQuotation, scheduleFollowUp, getQuotationById } from '../../src/api';
import { useToast } from '../../src/ToastContext';

type DetailRouteProp = RouteProp<RootStackParamList, 'FollowUpDetail'>;
type DetailNavProp = StackNavigationProp<RootStackParamList, 'FollowUpDetail'>;

type Activity = {
    id: string;
    activityId: string;
    sessionId?: string;
    type: string;
    date: string;
    vehicle: any;
    vehicleMaster?: { modelName?: string };
    vehicleInfo?: { modelName?: string };
    enquiryType: string;
    remarks: string;
    interactionType: string;
    scheduleDateAndTime: string;
    followUpDate?: string;
    followUpTime?: string;
    createdAt?: string;
    activityType?: string;
    employee?: string;
    employeeName?: string;
    phone?: string;
    quotationId?: string;
    createdBy?: {
        profile?: {
            employeeName?: string;
        };
    };
    quotation?: {
        quotationId?: string;
        leadSource?: string;
        vehicleLabel?: string;
        vehicleMaster?: { modelName?: string };
        vehicle?: Array<{ vehicleDetail?: { modelName?: string; modelCode?: string } }>;
        sms?: Array<{ phone?: string; smsStatus?: string }>;
        sentStatus?: boolean;
    };
    booking?: {
        bookingId?: string;
        bookingStatus?: string;
        vehicleLabel?: string;
        vehicleMaster?: { modelName?: string };
        vehicle?: { modelName?: string; modelCode?: string };
        color?: { code?: string; url?: string };
        authentication?: { verifiedAt?: string };
        sms?: { phone?: string; smsStatus?: string };
    };
    callId?: string;
    callHistory?: {
        phone2?: string;
        duration?: string;
    };
    sms?: any;
    discardMsg?: string;
};

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

// Safe date formatting function that works in React Native
const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    try {
        // Handle DD/MM/YYYY HH:mm format
        if (dateString.includes('/') && dateString.length === 16) {
            const [datePart] = dateString.split(' ');
            const [day, month, year] = datePart.split('/');
            return `${day}-${month}-${year}`;
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}-${month}-${year}`;
    } catch {
        return '-';
    }
};

const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${day}-${month}-${year} ${hours}:${minutes}`;
    } catch {
        return '-';
    }
};

const formatTime = (dateString: string | undefined) => {
    if (!dateString) return '-';
    try {
        // Handle DD/MM/YYYY HH:mm format
        if (dateString.includes('/') && dateString.length === 16) {
            const [, timePart] = dateString.split(' ');
            return timePart;
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch {
        return '-';
    }
};

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

export default function FollowUpDetailScreen() {
    const navigation = useNavigation<DetailNavProp>();
    const route = useRoute<DetailRouteProp>();
    const { id: phoneNo } = route.params || {};
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [customer, setCustomer] = useState<any>(null);
    const [customers, setCustomers] = useState<any[]>([]);
    const [customerIds, setCustomerIds] = useState<string[]>([]);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [customerDetails, setCustomerDetails] = useState<any>(null);
    const [mergedQuotations, setMergedQuotations] = useState<any[]>([]);
    const [mergedPurchasedVehicle, setMergedPurchasedVehicle] = useState<any[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [followUpDate, setFollowUpDate] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [currentCustomerIndex, setCurrentCustomerIndex] = useState(0);

    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customerTab, setCustomerTab] = useState<(typeof CUSTOMER_TABS)[number]['id']>('customer-details');

    const [showActivityModal, setShowActivityModal] = useState(false);
    const [activityMode, setActivityMode] = useState<'view' | 'edit'>('view');
    const [activityTab, setActivityTab] = useState<'details' | 'documents'>('details');

    const [showAttachQuotationModal, setShowAttachQuotationModal] = useState(false);

    const [enquiryType, setEnquiryType] = useState<string>('Hot');
    const [followupDate, setFollowupDate] = useState('');
    const [followupTime, setFollowupTime] = useState('');
    const [remarks, setRemarks] = useState('');

    // Listen for activity creation events for instant updates
    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('activityCreated', (event) => {
            console.log('🔍 Received activity creation event:', event);

            if (event.activity) {
                // Add the new activity to the existing activities list
                setActivities(prevActivities => {
                    const newActivities = [event.activity, ...prevActivities];
                    console.log('🔍 Activities updated instantly:', newActivities.length);
                    return newActivities;
                });
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    // Handler functions
    const openAttachQuotationModal = () => {
        setShowAttachQuotationModal(true);
    };

    const closeAttachQuotationModal = () => {
        setShowAttachQuotationModal(false);
    };

    const handleAttachQuotation = async (selectedQuotationIds: string[]) => {
        try {
            console.log('Attached quotations:', selectedQuotationIds);

            // Get phone number from one of the quotations if possible to refresh data
            if (selectedQuotationIds.length > 0) {
                const res = await getQuotationById(selectedQuotationIds[0]);
                const quoteData = res.data?.response?.data;
                const contactPhone = quoteData?.customer?.contacts?.find((c: any) => c.type === "Primary")?.phone
                    || quoteData?.customer?.phone;

                await linkQuotation(selectedQuotationIds);

                if (contactPhone && contactPhone !== phoneNo) {
                    // Navigate or refresh with new phone number
                    navigation.setParams({ id: contactPhone });
                } else {
                    await fetchData();
                }
            }

            closeAttachQuotationModal();
        } catch (error) {
            console.error('Error attaching quotation:', error);
            toast.error("Unable to attach quotation");
        }
    };

    // Data fetching functions matching autoinn-fe
    const getCustomersByPhone = async (phoneNo: string) => {
        try {
            const customerRes = await getCustomerByPhoneNo(phoneNo);
            const customersData = (customerRes.data?.response?.data?.customers as any[]) || [];

            setCustomers(customersData);

            if (customersData.length > 0) {
                const allCustomerIds = customersData.map(customer => customer.id);
                setCustomerIds(allCustomerIds);
                setCustomerId(customersData[0].id);

                await getCustomerInfo(customersData[0].id);
                await getMergedInfo(allCustomerIds);
                await getActivityByCustomer(allCustomerIds);
            }
        } catch (error) {
            console.error('Error fetching customers by phone:', error);
            setCustomers([]);
        }
    };

    const handleCustomerChange = async (index: number) => {
        if (customers.length === 0) return;
        setCurrentCustomerIndex(index);
        const selectedCustomer = customers[index];
        setCustomerId(selectedCustomer.id);
        await getCustomerInfo(selectedCustomer.id);
    };

    const getMergedInfo = async (ids: string[]) => {
        try {
            const mergedRes = await getMergedCustomerData({ ids });
            const data = mergedRes.data?.response?.data || {};

            const purchasedVehicle = Array.isArray(data.purchasedVehicle) ? data.purchasedVehicle : [];
            const quotation = Array.isArray(data.quotation) ? data.quotation : [];

            // Filter vehicles based on date logic from autoinn-fe
            const filteredVehicles = purchasedVehicle.filter((vehicle: any) =>
                quotation.every((quo: any) => new Date(vehicle.dateOfSale) < new Date(quo.createdAt))
            );
            setMergedPurchasedVehicle(filteredVehicles);
            setMergedQuotations(quotation);

            if (quotation.length > 0) {
                const latest = quotation[quotation.length - 1];
                setStatus(latest?.quotationStatus || "");
                setFollowUpDate(
                    latest?.scheduleDateAndTime || latest?.scheduleDate || latest?.createdAt || ""
                );
            }
        } catch (error) {
            console.error('Error fetching merged info:', error);
            setMergedPurchasedVehicle([]);
            setMergedQuotations([]);
        }
    };

    const getCustomerInfo = async (custId: string) => {
        try {
            const customerRes = await getCustomerDetails(custId);
            const customerData = customerRes.data?.response?.data;

            if (customerData) {
                setCustomerDetails(customerData);

                // Set basic customer info for display in the swipe card and modals
                const customerInfo = {
                    id: customerData.customerId || customerData.id || custId, // Fallback to the passed ID
                    name: customerData.name || 'Unknown',
                    customerId: customerData.customerId || customerData.id || custId,
                    customerType: customerData.customerType || 'Non Customer',
                    gender: customerData.gender,
                    location: customerData.billingAddress?.locality || customerData.address?.locality || customerData.locality,
                    locality: customerData.billingAddress?.locality || customerData.address?.locality || customerData.locality,
                    address: customerData.billingAddress || customerData.address
                };

                setCustomer(customerInfo);
            } else {
                // Fallback when no customer data is available
                console.log('⚠️ No customer data received, setting fallback info');
                const fallbackCustomer = {
                    id: custId,
                    name: 'Unknown Customer',
                    customerId: custId,
                    customerType: 'Non Customer',
                };
                console.log('👤 Setting fallback customer info:', fallbackCustomer);
                setCustomer(fallbackCustomer);
            }
        } catch (error) {
            console.error('Error fetching customer info:', error);
        }
    };

    const getActivityByCustomer = async (ids: string[], limit = 15, offset = 0) => {
        try {
            const activityRes = await getActivitiesByCustomer({ ids, limit, offset });
            const activityData = activityRes.data?.response?.data || [];
            setActivities(activityData);
        } catch (error) {
            console.error('Error fetching activities:', error);
        }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            await getCustomersByPhone(phoneNo);
        } catch (error) {
            console.error('Error in fetchData:', error);
        } finally {
            setLoading(false);
        }
    }, [phoneNo]);

    // Handler functions from autoinn-fe
    const updateCustomerData = async (customerId: string, customerData: any) => {
        try {
            // Use the customerId parameter for the API call
            const result = await updateCustomer(customerId, customerData);
            const data = result.data;

            // Check if data exists before accessing its properties
            if (!data) {
                console.error('Update customer failed: No data in response', result);
                toast.error("Unable to update customer - No response data");
                return;
            }

            if (data.code === 200) {
                const response = data.response;
                if (response && response.code === 200) {
                    await getCustomerInfo(customerId);
                    toast.success("Customer updated successfully");
                } else {
                    console.error('Update customer failed: Invalid response code', response);
                    toast.error("Unable to update customer");
                }
            } else if (data.code === 500) {
                console.error('Server error during customer update:', data);
                // Handle 500 error gracefully - quotation was attached but customer update failed
                toast.success("Quotation attached successfully, but customer update had issues");
            } else if (data.code === 500 && data.err && data.err.code === 500) {
                toast.error("Customer name already exists");
            } else {
                console.error('Update customer failed: Invalid data code', data);
                toast.error("Unable to update customer");
            }
        } catch (error) {
            console.error('Error on customer update:', error);
            toast.error("Unable to update customer");
        }
    };

    const linkQuotation = async (quotationIds: string[]) => {
        try {
            if (!customerDetails) {
                toast.error("No customer details available");
                return;
            }

            console.log('🔗 Linking quotations:', quotationIds);
            console.log('👤 Customer details:', customerDetails);

            // The actual customer data is nested inside the 'customer' object
            const actualCustomerData = customerDetails.customer || customerDetails;
            console.log('🆔 Customer ID from details:', actualCustomerData.id);

            // Check if customer ID exists
            if (!actualCustomerData.id) {
                console.error('❌ No customer ID found in customerDetails');
                toast.error("Unable to attach quotations - Missing customer ID");
                return;
            }

            // Update customer with attached quotations
            let customer = { ...actualCustomerData };
            let tmpData = quotationIds.map(id => ({ id }));
            customer.quotation = (customer.quotation || []).concat(tmpData);

            if (customer.dateOfBirth) {
                // Format date if needed
                customer.dateOfBirth = customer.dateOfBirth;
            }
            customer.update = "quotation"; // to update Quotation

            // Clean up customer data - only send necessary fields
            const cleanCustomerData = {
                id: customer.id,
                customerId: customer.customerId,
                name: customer.name,
                customerType: customer.customerType,
                gender: customer.gender,
                dateOfBirth: customer.dateOfBirth,
                contacts: customer.contacts,
                address: customer.address,
                quotation: customer.quotation,
                update: customer.update
            };

            console.log('📤 Sending customer update (cleaned):', cleanCustomerData);

            try {
                // First attach quotation
                const attachResult = await attachQuotation(quotationIds);
                console.log('✅ Attach quotation result:', attachResult);
            } catch (attachError) {
                console.error('❌ Attach quotation failed:', attachError);
                // Continue with customer update even if attach fails
            }

            // Then update customer data - FIX: Pass the ID correctly
            // The first parameter should be actualCustomerData.id, not customer
            await updateCustomerData(actualCustomerData.id, cleanCustomerData);

            // Refresh data
            await getCustomersByPhone(phoneNo);
            toast.success("Quotations attached successfully");
        } catch (error) {
            console.error('❌ Error attaching quotations:', error);
            toast.error("Unable to attach quotations");
        }
    };

    const createNewQuotation = async (quotation: any, callBack?: (success: boolean, quotationId?: string) => void) => {
        try {
            const formData = new FormData();
            formData.append("finalData", JSON.stringify(quotation));

            const result = await createQuotation(formData);
            const data = result.data;

            if (data.code === 200) {
                const response = data.response;
                if (response.code === 200) {
                    await fetchData();
                    toast.success("Quotation added successfully");
                    setShowAttachQuotationModal(false);
                    callBack?.(true, response.data.id);
                } else {
                    toast.error("Unable to add new quotation");
                    callBack?.(false);
                }
            } else {
                toast.error("Unable to add quotation");
                callBack?.(false);
            }
        } catch (error) {
            callBack?.(false);
            console.error("Error creating quotation: ", error);
            toast.error("Unable to add quotation");
        }
    };

    const changeFollowUp = async (next = false) => {
        try {
            if (!mergedQuotations.length) return;

            const lastQuotation = mergedQuotations[mergedQuotations.length - 1]?.id;
            const quotations = mergedQuotations.map((data) => data.id);

            const result = await scheduleFollowUp({
                fupDateTime: followUpDate,
                next,
                status,
                last_quotation: lastQuotation,
                quotations,
                phone: phoneNo,
                filter: null
            });

            const data = result.data?.response?.data;
            if (result.data.response.data) {
                navigation.setParams({ id: result.data.response.data.phone });
                toast.success(`Follow-up ${next ? 'next' : 'previous'} fetched successfully!`);
            } else {
                toast.warn(`No ${next ? 'Next' : 'Previous'} Follow-up Exists`);
            }
        } catch (error) {
            toast.error("Unable to fetch follow-up");
            console.error("Error on handleNext: ", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const customerTabContent = useMemo(() => {
        if (!customer) return null;

        if (customerTab === 'customer-details') {
            return (
                <View>
                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
                        <Text className="text-sm text-gray-500 mb-1">Customer Name</Text>
                        <Text className="text-base text-gray-900 font-semibold">{customer.name}</Text>
                    </View>
                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
                        <Text className="text-sm text-gray-500 mb-1">Father Name</Text>
                        <Text className="text-base text-gray-900">{customer.fatherName}</Text>
                    </View>
                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
                        <Text className="text-sm text-gray-500 mb-1">Mobile</Text>
                        <Text className="text-base text-gray-900">+91 {customer.mobile}</Text>
                    </View>
                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
                        <Text className="text-sm text-gray-500 mb-1">Email</Text>
                        <Text className="text-base text-gray-900">{customer.email}</Text>
                    </View>
                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
                        <Text className="text-sm text-gray-500 mb-1">Address</Text>
                        <Text className="text-base text-gray-900">{customer.locality}, {customer.pincode}</Text>
                    </View>
                </View>
            );
        }

        if (customerTab === 'associated-vehicles') {
            return (
                <View>
                    <Text className="text-xl font-semibold text-gray-900 text-center mb-3">Vehicle Info</Text>
                    <View className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <View className="bg-gray-100 px-3 py-3 flex-row">
                        <Text className="text-xs font-semibold text-gray-700 w-24">Date of Sale</Text>
                        <Text className="text-xs font-semibold text-gray-700 flex-1">Vehicle Model</Text>
                        <Text className="text-xs font-semibold text-gray-700 w-20">Reg. No</Text>
                        <Text className="text-xs font-semibold text-gray-700 w-16 text-center">Action</Text>
                    </View>
                    {mergedPurchasedVehicle.length > 0 ? (
                        mergedPurchasedVehicle.map((vehicle, index) => (
                            <View key={vehicle.id || index} className={`px-3 py-3 flex-row items-center ${index % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                                <Text className="text-xs text-gray-700 w-24">{formatDate(vehicle.dateOfSale)}</Text>
                                <Text className="text-xs text-gray-800 flex-1">
                                    {getVehicleNames(vehicle)?.[0] || '-'}
                                </Text>
                                <Text className="text-xs text-gray-700 w-20">
                                    {vehicle.registerNo || vehicle.regNo || vehicle.registrationNo || vehicle.registrationNumber || '-'}
                                </Text>
                                <TouchableOpacity className="w-16 items-center">
                                    <Eye size={14} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <View className="px-3 py-8 items-center">
                            <Text className="text-sm text-gray-500">No purchased vehicles found</Text>
                        </View>
                    )}
                </View>
                </View>
            );
        }

        if (customerTab === 'bookings') {
            const bookings = customerDetails?.booking || [];
            return (
                <View className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <View className="bg-gray-100 px-3 py-3 flex-row">
                        <Text className="text-xs font-semibold text-gray-700 flex-1">Booking ID</Text>
                        <Text className="text-xs font-semibold text-gray-700 w-24">Date</Text>
                        <Text className="text-xs font-semibold text-gray-700 w-20">Status</Text>
                        <Text className="text-xs font-semibold text-gray-700 w-12 text-center">Action</Text>
                    </View>
                    {bookings.length > 0 ? (
                        bookings.map((b: any, index: number) => (
                            <View key={b.id || index} className={`px-3 py-3 flex-row items-center ${index % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                                <Text className="text-xs text-teal-600 flex-1">{b.bookingId}</Text>
                                <Text className="text-xs text-gray-700 w-24">{formatDate(b.createdAt)}</Text>
                                <Text className="text-xs text-gray-700 w-20">{b.bookingStatus}</Text>
                                <TouchableOpacity className="w-12 items-center">
                                    <Eye size={14} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <View className="px-3 py-8 items-center">
                            <Text className="text-sm text-gray-500">No bookings found</Text>
                        </View>
                    )}
                </View>
            );
        }

        if (customerTab === 'job-orders') {
            const jobOrders = customerDetails?.jobOrders || [];
            return (
                <View className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <View className="bg-gray-100 px-3 py-3 flex-row">
                        <Text className="text-xs font-semibold text-gray-700 flex-1">Job No</Text>
                        <Text className="text-xs font-semibold text-gray-700 w-24">Date</Text>
                        <Text className="text-xs font-semibold text-gray-700 w-20">Status</Text>
                    </View>
                    {jobOrders.length > 0 ? (
                        jobOrders.map((j: any, index: number) => (
                            <View key={j.id || index} className={`px-3 py-3 flex-row items-center ${index % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                                <Text className="text-xs text-gray-700 flex-1">{j.jobNo}</Text>
                                <Text className="text-xs text-gray-700 w-24">{formatDate(j.dateTime)}</Text>
                                <Text className="text-xs text-gray-700 w-20">{j.jobStatus}</Text>
                            </View>
                        ))
                    ) : (
                        <View className="px-3 py-8 items-center">
                            <Text className="text-sm text-gray-500">No job orders found</Text>
                        </View>
                    )}
                </View>
            );
        }

        if (customerTab === 'spare-orders') {
            const spareOrders = customerDetails?.spareOrders || [];
            return (
                <View className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <View className="bg-gray-100 px-3 py-3 flex-row">
                        <Text className="text-xs font-semibold text-gray-700 flex-1">Order No</Text>
                        <Text className="text-xs font-semibold text-gray-700 w-24">Date</Text>
                        <Text className="text-xs font-semibold text-gray-700 w-20">Status</Text>
                    </View>
                    {spareOrders.length > 0 ? (
                        spareOrders.map((s: any, index: number) => (
                            <View key={s.id || index} className={`px-3 py-3 flex-row items-center ${index % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                                <Text className="text-xs text-gray-700 flex-1">{s.orderNo}</Text>
                                <Text className="text-xs text-gray-700 w-24">{formatDate(s.createdAt)}</Text>
                                <Text className="text-xs text-gray-700 w-20">{s.status}</Text>
                            </View>
                        ))
                    ) : (
                        <View className="px-3 py-8 items-center">
                            <Text className="text-sm text-gray-500">No spare orders found</Text>
                        </View>
                    )}
                </View>
            );
        }

        if (customerTab === 'payments') {
            const payments = customerDetails?.payments || [];
            return (
                <View className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <View className="bg-gray-100 px-3 py-3 flex-row">
                        <Text className="text-xs font-semibold text-gray-700 flex-1">Receipt No</Text>
                        <Text className="text-xs font-semibold text-gray-700 w-24">Date</Text>
                        <Text className="text-xs font-semibold text-gray-700 w-20">Amount</Text>
                    </View>
                    {payments.length > 0 ? (
                        payments.map((p: any, index: number) => (
                            <View key={p.id || index} className={`px-3 py-3 flex-row items-center ${index % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                                <Text className="text-xs text-gray-700 flex-1">{p.receiptNo}</Text>
                                <Text className="text-xs text-gray-700 w-24">{formatDate(p.createdAt)}</Text>
                                <Text className="text-xs text-gray-700 w-20">{p.amount}</Text>
                            </View>
                        ))
                    ) : (
                        <View className="px-3 py-8 items-center">
                            <Text className="text-sm text-gray-500">No payments found</Text>
                        </View>
                    )}
                </View>
            );
        }

        if (customerTab === 'quotations') {
            console.log('Rendering quotations in FollowUpDetail modal for customer:', customerDetails?.id, (customerDetails?.quotation || []).length);
            return (
                <View className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <View className="bg-gray-100 px-3 py-3 flex-row">
                        <Text className="text-xs font-semibold text-gray-700 w-24">Date</Text>
                        <Text className="text-xs font-semibold text-gray-700 flex-1">Quotation ID</Text>
                        <Text className="text-xs font-semibold text-gray-700 flex-1">Model</Text>
                        <Text className="text-xs font-semibold text-gray-700 w-14 text-center">Action</Text>
                    </View>
                    {(((customerDetails?.quotation || []) as any[])).map((q, index) => (
                        <View key={q.id || index} className={`px-3 py-3 flex-row items-center ${index % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                            <Text className="text-xs text-gray-700 w-24">{formatDate(q.createdAt)}</Text>
                            <Text className="text-xs text-teal-600 flex-1">{q.quotationId}</Text>
                            <Text className="text-xs text-gray-800 flex-1">
                                {getVehicleNames(q).filter(n => n && n !== '-').join(', ') || q.vehicleLabel || '-'}
                            </Text>
                            <TouchableOpacity className="w-14 items-center" onPress={() => navigation.navigate('QuotationView', { id: q.id })}>
                                <Eye size={14} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            );
        }

        if (customerTab === 'call-history') {
            return (
                <View className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <View className="bg-gray-100 px-3 py-3 flex-row">
                        <Text className="text-xs font-semibold text-gray-700 w-20">Date</Text>
                        <Text className="text-xs font-semibold text-gray-700 w-24">Activity</Text>
                        <Text className="text-xs font-semibold text-gray-700 flex-1">Remarks</Text>
                        <Text className="text-xs font-semibold text-gray-700 w-20">Employee</Text>
                    </View>
                    {activities && activities.length > 0 ? (
                        activities.map((activity, index) => (
                            <View key={activity.id || index} className={`px-3 py-3 flex-row items-start ${index % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                                <Text className="text-xs text-gray-700 w-20">{formatDate(activity.createdAt)}</Text>
                                <Text className="text-xs text-gray-800 w-24">{activity.activityType || activity.type || 'Activity'}</Text>
                                <Text className="text-xs text-gray-700 flex-1" numberOfLines={2}>{activity.remarks || '-'}</Text>
                                <Text className="text-xs text-gray-600 w-20">{activity.createdBy?.profile?.employeeName || '-'}</Text>
                            </View>
                        ))
                    ) : (
                        <View className="px-3 py-8 items-center">
                            <Text className="text-sm text-gray-500">No activities found</Text>
                        </View>
                    )}
                </View>
            );
        }

        return (
            <View className="bg-white rounded-xl border border-gray-100 p-10">
                <Text className="text-center text-gray-400">No data available</Text>
            </View>
        );
    }, [customerTab, customer, customerDetails, mergedQuotations, mergedPurchasedVehicle, activities]);

    const openActivityModal = (mode: 'view' | 'edit') => {
        setActivityMode(mode);
        setActivityTab('details');
        setShowActivityModal(true);
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text className="mt-4 text-gray-500">Loading details...</Text>
            </SafeAreaView>
        );
    }

    if (!customer) return null;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white border-b border-gray-100 px-4 py-4">
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
                            <ChevronLeft size={22} color={COLORS.gray[900]} />
                        </TouchableOpacity>
                        <Text className="text-lg font-bold text-gray-900">Follow-Ups</Text>
                    </View>
                    <View className="flex-row gap-2">
                        <TouchableOpacity
                            onPress={() => changeFollowUp(false)}
                            className="px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200"
                        >
                            <Text className="text-xs font-semibold text-gray-700">Previous</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => changeFollowUp(true)}
                            className="px-3 py-1.5 bg-teal-600 rounded-lg"
                        >
                            <Text className="text-xs font-semibold text-white">Next</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                <View className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden shadow">
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / (Dimensions.get('window').width - 32));
                            if (index !== currentCustomerIndex) {
                                handleCustomerChange(index);
                            }
                        }}
                    >
                        {customers.map((c, idx) => (
                            <View key={c.id} style={{ width: Dimensions.get('window').width - 32 }} className="p-4 items-center">
                                <View className="flex-row items-center justify-center mb-4">
                                    <User size={20} color={COLORS.gray[900]} className="mr-2" />
                                    <Text className="ml-2 text-xl font-semibold text-gray-900">
                                        {c.name}
                                    </Text>
                                </View>

                                <View className="items-center mb-2">
                                    <Text className="text-sm font-semibold text-gray-900">Customer ID: {c.customerId || c.id || '-'}</Text>
                                    <Text className="text-sm text-gray-600 mt-1">Customer Type: {c.customerType || c.type || 'Non Customer'}</Text>
                                    <Text className="text-sm text-gray-600 mt-1">
                                        {c.gender || '-'} | {c.location || c.locality || c.address?.locality || c.address?.city || '-'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    {customers.length > 1 && (
                        <View className="flex-row justify-center gap-1.5 mb-3">
                            {customers.map((_, idx) => (
                                <View
                                    key={idx}
                                    className={`h-1.5 rounded-full ${idx === currentCustomerIndex ? 'w-5 bg-teal-600' : 'w-1.5 bg-gray-300'}`}
                                />
                            ))}
                        </View>
                    )}

                    <View className="h-[1px] bg-gray-100 mx-4" />

                    <View className="flex-row justify-center gap-3 p-4">
                        <TouchableOpacity
                            onPress={() => navigation.navigate('CustomerDetails', { customerId: customer.id })}
                            className="flex-row items-center px-4 py-2 bg-gray-50 rounded-lg"
                        >
                            <Eye size={18} color="#475569" />
                            <Text className="ml-2 text-xs font-medium text-gray-600">View Details</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('CustomerDetails', { customerId: customer.id })}
                            className="flex-row items-center px-4 py-2 bg-teal-50 rounded-lg"
                        >
                            <Edit size={18} color="#0d9488" />
                            <Text className="ml-2 text-xs font-medium text-teal-700">Edit Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden shadow">
                    <View className="bg-gray-100 px-3 py-3 flex-row">
                        <Text className="text-xs font-semibold text-gray-700 flex-1">Quotation No</Text>
                        <Text className="text-xs font-semibold text-gray-700 flex-1 mr-3">Vehicle</Text>
                        <Text className="text-xs font-semibold text-gray-700 w-20">Created On</Text>
                        <Text className="text-xs font-semibold text-gray-700 w-12 text-center">Action</Text>
                    </View>
                    <View className={mergedQuotations.length >= 4 ? "max-h-[180px]" : ""}>
                        <ScrollView nestedScrollEnabled={true}>
                            {mergedQuotations.map((q, idx) => {
                                const vehicleNames = getVehicleNames(q).filter(n => n && n !== '-');
                                const vehicleDisplay = vehicleNames.length > 0 ? vehicleNames.join(', ') : (q.vehicleLabel || '-');
                                return (
                                    <View key={q.id || idx} className={`px-3 py-3 flex-row items-center ${idx % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                                        <Text className="text-xs text-teal-600 flex-1">{q.quotationId || '-'}</Text>
                                        <Text className="text-xs text-gray-800 flex-1 mr-3">{vehicleDisplay}</Text>
                                        <Text className="text-xs text-gray-800 w-20">{formatDate(q.createdAt)}</Text>
                                        <TouchableOpacity className="w-12 items-center" onPress={() => navigation.navigate('QuotationView', { id: q.id })}>
                                            <Eye size={14} color={COLORS.gray[600]} />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>

                <View className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                    <View className="gap-3">
                        <Button
                            title="Booking"
                            variant="outline"
                            onPress={() =>
                                navigation.navigate('BookingActivity', {
                                    customerName: customer.name,
                                    customerId: customer.id,
                                    customerPhone: phoneNo
                                })
                            }
                        />
                        <Button
                            title="Quotation"
                            variant="outline"
                            onPress={() =>
                                navigation.navigate('AddQuotation', {
                                    customerName: customer.name,
                                    customerPhone: phoneNo,
                                    locality: customer.locality,
                                    customerType: customer.customerType,
                                    gender: customer.gender
                                })
                            }
                        />
                        <Button
                            title="Walk-In"
                            variant="outline"
                            onPress={() =>
                                navigation.navigate('WalkInActivity', {
                                    customerName: customer.name,
                                    customerId: customer.id
                                })
                            }
                        />
                        <Button
                            title="Call"
                            variant="outline"
                            onPress={() =>
                                navigation.navigate('CallActivity', {
                                    customerName: customer.name,
                                    customerId: customer.id,
                                    customerPhone: phoneNo
                                })
                            }
                            icon={<Phone size={14} color={COLORS.primary} />}
                        />
                    </View>
                    <View className='mt-3'>
                        <Button
                            title='Attach Quotation'
                            onPress={openAttachQuotationModal}
                        />
                    </View>
                </View>

                {mergedPurchasedVehicle.length > 0 && (
                    <View className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
                        <View className="bg-gray-100 px-3 py-3 flex-row items-center justify-between">

                            <View className="flex-row items-center gap-2">
                                <Car size={20} color={COLORS.primary} />
                                <Text className="text-sm font-semibold text-gray-900">Vehicle Info</Text>
                            </View>
                            <View className="flex-row gap-3">
                                <TouchableOpacity 
                                    className="p-2 rounded-lg bg-white/80 border border-gray-300"
                                    onPress={() => navigation.navigate('VehicleDetails', { vehicle: mergedPurchasedVehicle[0] })}
                                >
                                    <Eye size={16} color={COLORS.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    className="p-2 rounded-lg bg-white/80 border border-gray-300"
                                    onPress={() => navigation.navigate('VehicleDetails', { vehicle: mergedPurchasedVehicle[0], mode: 'edit' })}
                                >
                                    <Edit size={16} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View className="flex-row bg-gray-50 px-3 py-2 border-b border-gray-100">
                            <Text className="text-xs font-semibold text-gray-600 flex-1">Date of Sale</Text>
                            <Text className="text-xs font-semibold text-gray-600 flex-1">Vehicle Model</Text>
                            <Text className="text-xs font-semibold text-gray-600 flex-1">Reg. No</Text>
                        </View>
                        {mergedPurchasedVehicle.map((vehicle: any, index: number) => (
                            <View key={vehicle.id || index} className={`px-3 py-3 flex-row items-center ${index % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                                <Text className="text-xs text-gray-700 flex-1">{formatDate(vehicle.dateOfSale)}</Text>
                                <Text className="text-xs text-gray-800 flex-1">
                                    {getVehicleNames(vehicle)?.[0] || '-'}
                                </Text>
                                <Text className="text-xs text-gray-700 flex-1">
                                    {vehicle.registerNo || vehicle.regNo || vehicle.registrationNo || vehicle.registrationNumber || '-'}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                <Text className="text-xl font-semibold text-gray-900 text-center mb-3">Activity</Text>
                <View style={activities && activities.length > 2 ? { height: 750 } : null}>
                    <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                        {activities && activities.length > 0 ? activities.map((activity: Activity) => {
                            if (!activity || typeof activity !== 'object') return null;

                            // Determine activity type label — matching web project's renderTitle logic
                            const activityTypeLabel = activity.booking
                                ? 'Booking Activity'
                                : activity.quotation
                                    ? 'Quotation Activity'
                                    : activity.discardMsg || activity.interactionType === 'Discard'
                                        ? 'Discard Activity'
                                        : activity.interactionType === 'Service Followup WhatsApp Message'
                                            ? 'Service WhatsApp Activity'
                                            : activity.interactionType === 'Service Followup Call' || activity.interactionType === 'Service Followup Message'
                                                ? 'Service Follow-Up Activity'
                                                : activity.interactionType === 'WhatsApp Message'
                                                    ? 'WhatsApp Activity'
                                                    : activity.sms
                                                        ? 'Message Activity'
                                                        : activity.callId || activity.interactionType === 'Call Follow' || activity.interactionType === 'Outgoing Call' || activity.interactionType === 'Incoming Call'
                                                            ? 'Call Activity'
                                                            : activity.interactionType === 'WALK IN'
                                                                ? 'WalkIn Activity'
                                                                : activity.interactionType || activity.type || activity.activityType || 'Activity';

                            // Extract vehicle names based on activity type
                            let activityVehicle = '-';
                            if (activity.booking?.vehicle) {
                                const v = activity.booking.vehicle;
                                activityVehicle = v.modelName ? `${v.modelName}${v.modelCode ? ' - ' + v.modelCode : ''}` : '-';
                            } else if (activity.quotation?.vehicle?.length) {
                                activityVehicle = activity.quotation.vehicle
                                    .map(v => v?.vehicleDetail?.modelName || '')
                                    .filter(Boolean)
                                    .join(', ') || '-';
                            } else {
                                const allVehicleSources = [
                                    activity.vehicle, activity.vehicleMaster, activity.vehicleInfo,
                                    (activity as any).modelName, (activity as any).enquiryVehicle
                                ];
                                const uniqueVehicles = [...new Set(
                                    allVehicleSources.flatMap(src => getVehicleNames(src))
                                        .filter(name => name && name !== '-')
                                )];
                                activityVehicle = uniqueVehicles.length > 0 ? uniqueVehicles.join(', ') : '-';
                            }

                            // Extract phone number based on activity type
                            const activityPhone = activity.booking?.sms?.phone
                                || activity.quotation?.sms?.[0]?.phone
                                || activity.callHistory?.phone2
                                || activity.phone
                                || null;

                            // Extract document IDs
                            const docId = activity.booking?.bookingId
                                || activity.quotation?.quotationId
                                || null;

                            // Extract employee
                            const employeeName = activity.employee || activity.createdBy?.profile?.employeeName || activity.employeeName || '-';

                            return (
                                <View key={activity.id} className="bg-white rounded-2xl shadow-md overflow-hidden border-0 mb-4">
                                    {/* Header */}
                                    <View className="bg-white px-4 py-4 flex-row items-center justify-between border-b border-gray-100">
                                        <View className="ml-1 flex-1">
                                            <Text className="text-gray-800 font-semibold text-base mb-0.5">
                                                {activityTypeLabel}
                                            </Text>
                                            <Text className="text-gray-500 text-xs">{formatDateTime(activity.createdAt || activity.date) || '-'}</Text>
                                        </View>
                                        {activity.enquiryType ? (
                                            <View className={`mr-4 px-3 py-1.5 rounded ${activity.enquiryType === 'Hot' ? 'bg-orange-400' :
                                                activity.enquiryType === 'Warm' ? 'bg-yellow-400' :
                                                    'bg-blue-400'
                                                }`}>
                                                <Text className="text-white text-xs font-bold">
                                                    {activity.enquiryType}
                                                </Text>
                                            </View>
                                        ) : null}
                                    </View>

                                    {/* Content */}
                                    <View className="px-4 py-4 space-y-4 bg-white">
                                        {/* Row 1 - Quotation/Booking ID and Interaction Type */}
                                        <View className="flex-row gap-4 mb-2">
                                            <View className="flex-1 flex-row items-start gap-2">
                                                <Hash size={14} color="#6b7280" style={{ marginTop: 2 }} />
                                                <View className="flex-1">
                                                    <Text className="text-gray-600 text-xs font-medium mb-1.5">
                                                        {activity.booking ? 'Booking ID' : 'Quotation ID'}
                                                    </Text>
                                                    <Text className="text-teal-700 text-sm font-semibold" numberOfLines={1}>
                                                        {activity.quotationId || activity.quotation?.quotationId || activity.booking?.bookingId || '-'}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View className="flex-1 flex-row items-start gap-2">
                                                <MessageSquare size={14} color="#6b7280" style={{ marginTop: 2 }} />
                                                <View className="flex-1">
                                                    <Text className="text-gray-600 text-xs font-medium mb-1.5">
                                                        {activity.quotation ? 'Lead Source' : 'Interaction Type'}
                                                    </Text>
                                                    <Text className="text-gray-800 text-sm font-semibold" numberOfLines={1}>
                                                        {activity.quotation
                                                            ? (activity.quotation.leadSource || activity.interactionType || '-')
                                                            : (activity.interactionType || '-')}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Row 2 - Phone (type-specific) */}
                                        {activityPhone ? (
                                            <View className="flex-row gap-4 mb-2 mt-2">
                                                <View className="flex-1 flex-row items-start gap-2">
                                                    <Phone size={14} color="#6b7280" style={{ marginTop: 2 }} />
                                                    <View className="flex-1">
                                                        <Text className="text-gray-600 text-xs font-medium mb-1">
                                                            Phone No
                                                        </Text>
                                                        <Text className="text-gray-800 text-sm font-semibold" numberOfLines={1}>
                                                            {activityPhone}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View className="flex-1" />
                                            </View>
                                        ) : null}

                                        {/* Booking-specific: Auth & Status */}
                                        {activity.booking ? (
                                            <View className="flex-row gap-4 mb-2 mt-2">
                                                <View className="flex-1">
                                                    <Text className="text-gray-600 text-xs font-medium mb-1">Customer Auth</Text>
                                                    <Text className={`text-sm font-semibold ${activity.booking.authentication?.verifiedAt ? 'text-green-600' : 'text-red-500'}`}>
                                                        {activity.booking.authentication?.verifiedAt ? 'Verified' : 'Not Verified'}
                                                    </Text>
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-gray-600 text-xs font-medium mb-1">Booking Status</Text>
                                                    <Text className="text-gray-800 text-sm font-semibold">
                                                        {activity.booking.bookingStatus || '-'}
                                                    </Text>
                                                </View>
                                            </View>
                                        ) : null}

                                        {/* Call-specific: Duration */}
                                        {activity.callHistory?.duration ? (
                                            <View className="flex-row gap-4 mb-2 mt-2">
                                                <View className="flex-1">
                                                    <Text className="text-gray-600 text-xs font-medium mb-1">Call Duration</Text>
                                                    <Text className="text-gray-800 text-sm font-semibold">{activity.callHistory.duration}</Text>
                                                </View>
                                                <View className="flex-1" />
                                            </View>
                                        ) : null}

                                        {/* Row - Follow-up Date and Time */}
                                        {activity.scheduleDateAndTime ? (
                                            <View className="flex-row gap-4 mb-2 mt-4">
                                                <View className="flex-1 flex-row items-center gap-2">
                                                    <CalendarDays size={14} color="#6b7280" />
                                                    <View className="flex-1">
                                                        <Text className="text-gray-600 text-xs font-medium mb-1">
                                                            Followup Date
                                                        </Text>
                                                        <Text className="text-gray-800 text-sm font-semibold" numberOfLines={1}>
                                                            {formatDate(activity.scheduleDateAndTime) || '-'}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View className="flex-1 flex-row items-center gap-2">
                                                    <Clock size={14} color="#6b7280" />
                                                    <View className="flex-1">
                                                        <Text className="text-gray-600 text-xs font-medium mb-1">
                                                            Followup Time
                                                        </Text>
                                                        <Text className="text-gray-800 text-sm font-semibold" numberOfLines={1}>
                                                            {formatTime(activity.scheduleDateAndTime) || '-'}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        ) : null}

                                        {/* Row - Vehicle and Employee */}
                                        <View className="flex-row gap-4 mb-2 mt-4">
                                            <View className="flex-1 flex-row items-start gap-2">
                                                <Car size={14} color="#6b7280" style={{ marginTop: 2 }} />
                                                <View className="flex-1">
                                                    <Text className="text-gray-600 text-xs font-medium mb-1">
                                                        Vehicle
                                                    </Text>
                                                    <Text className="text-gray-800 text-sm font-semibold leading-relaxed">
                                                        {activityVehicle}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View className="flex-1 flex-row items-center gap-2">
                                                <View className="w-5 h-5 bg-gray-200 rounded-full items-center justify-center">
                                                    <Text className="text-gray-600 text-xs font-bold">
                                                        {employeeName?.charAt(0)?.toUpperCase() || '-'}
                                                    </Text>
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-gray-600 text-xs font-medium mb-1">
                                                        Employee
                                                    </Text>
                                                    <Text className="text-gray-800 text-sm font-semibold" numberOfLines={1}>
                                                        {employeeName}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Remarks */}
                                        {activity.remarks && activity.remarks.length > 0 ? (
                                            <View className="mt-3 bg-gray-50 rounded-lg p-3">
                                                <Text className="text-gray-600 text-xs font-medium mb-1">Remarks</Text>
                                                <Text className="text-gray-800 text-sm" numberOfLines={3}>{activity.remarks}</Text>
                                            </View>
                                        ) : null}

                                    </View>

                                    {/* Footer Buttons */}
                                    <View className="border-t border-gray-100 px-4 py-3 flex-row gap-3 bg-white ">
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('ActivityViewEdit', { mode: 'view', activityId: activity.id || '' })}
                                            className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-lg bg-teal-100"
                                        >
                                            <Eye size={14} color="#6b7280" />
                                            <Text className="text-teal-600 text-sm font-semibold ">View</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('ActivityViewEdit', { mode: 'edit', activityId: activity.id || '' })}
                                            className="flex-1 flex-row items-center justify-center gap-2 bg-teal-600 py-3 rounded-lg"
                                        >
                                            <Edit size={14} color="white" />
                                            <Text className="text-white text-sm font-semibold">Edit</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        }) : (
                            <View className="bg-white rounded-xl border border-gray-200 p-8 mb-4">
                                <Text className="text-center text-gray-400">No activities found</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>

                {/* Customer Details Modal */}
                <Modal
                    visible={showCustomerModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowCustomerModal(false)}
                >
                    <View className="flex-1 bg-black/40 justify-center px-3 py-6">
                        <View className="bg-white rounded-xl overflow-hidden max-h-full">
                            <View className="bg-gray-600 px-4 py-3 flex-row items-center justify-between">
                                <Text className="text-white font-semibold text-base">Customer Details</Text>
                                <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                                    <Text className="text-white text-base font-semibold">Close</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="border-b border-gray-200 bg-white" contentContainerStyle={{ paddingHorizontal: 8 }}>
                                {CUSTOMER_TABS.map((tab) => (
                                    <TouchableOpacity
                                        key={tab.id}
                                        onPress={() => setCustomerTab(tab.id)}
                                        className={`px-3 py-3 border-b-2 ${customerTab === tab.id ? 'border-teal-600' : 'border-transparent'}`}
                                    >
                                        <Text className={`text-xs ${customerTab === tab.id ? 'text-teal-600 font-semibold' : 'text-gray-600'}`}>
                                            {tab.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 24 }}>
                                {customerTabContent}
                            </ScrollView>

                            <View className="bg-gray-50 border-t border-gray-100 p-4 flex-row">
                                <Button title="Cancel" variant="outline" className="flex-1 mr-2" onPress={() => setShowCustomerModal(false)} />
                                <Button title="Save" className="flex-1 ml-2" onPress={() => setShowCustomerModal(false)} />
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Activity Modal */}
                <Modal
                    visible={showActivityModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowActivityModal(false)}
                >
                    <View className="flex-1 bg-black/40 justify-center px-3 py-6">
                        <View className="bg-white rounded-xl overflow-hidden max-h-full">
                            <View className="bg-gray-500 px-4 py-3 flex-row items-center justify-between">
                                <Text className="text-white font-semibold text-base">Activity Editor</Text>
                                <TouchableOpacity onPress={() => setShowActivityModal(false)}>
                                    <Text className="text-white text-base font-semibold">Close</Text>
                                </TouchableOpacity>
                            </View>

                            <View className="border-b border-gray-200 bg-white flex-row">
                                <TouchableOpacity
                                    onPress={() => setActivityTab('details')}
                                    className={`px-4 py-3 border-b-2 ${activityTab === 'details' ? 'border-teal-600' : 'border-transparent'}`}
                                >
                                    <Text className={`text-sm ${activityTab === 'details' ? 'text-teal-600 font-semibold' : 'text-gray-600'}`}>Activity Details</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setActivityTab('documents')}
                                    className={`px-4 py-3 border-b-2 ${activityTab === 'documents' ? 'border-teal-600' : 'border-transparent'}`}
                                >
                                    <Text className={`text-sm ${activityTab === 'documents' ? 'text-teal-600 font-semibold' : 'text-gray-600'}`}>Associated Documents</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 24 }}>
                                {activityTab === 'details' ? (
                                    <View>
                                        <View className="flex-row mb-3">
                                            <View className="flex-1 mr-2">
                                                <Text className="text-xs text-gray-500 mb-1">Activity Session ID</Text>
                                                <Text className="text-sm font-semibold text-gray-900">ACTNY10029</Text>
                                            </View>
                                            <View className="flex-1 ml-2">
                                                <Text className="text-xs text-gray-500 mb-1">Session Date</Text>
                                                <Text className="text-sm font-semibold text-gray-900">17-02-2026</Text>
                                            </View>
                                        </View>

                                        <View className="flex-row mb-3">
                                            <View className="flex-1 mr-2">
                                                <Text className="text-xs text-gray-500 mb-1">Lead Source</Text>
                                                <Text className="text-sm font-semibold text-gray-900">CALL ENQUIRY</Text>
                                            </View>
                                            <View className="flex-1 ml-2">
                                                <Text className="text-xs text-gray-500 mb-1">Session Time</Text>
                                                <Text className="text-sm font-semibold text-gray-900">17:20</Text>
                                            </View>
                                        </View>

                                        <View className="mb-3">
                                            <Text className="text-xs text-gray-500 mb-1">Enquiry Type</Text>
                                            <View className="flex-row">
                                                {(['Hot', 'Warm', 'Cold'] as const).map((type, idx) => (
                                                    <TouchableOpacity
                                                        key={type}
                                                        onPress={() => setEnquiryType(type)}
                                                        className={`h-10 px-4 rounded-lg border items-center justify-center ${idx !== 0 ? 'ml-2' : ''} ${enquiryType === type ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300'}`}
                                                    >
                                                        <Text className={enquiryType === type ? 'text-white font-semibold' : 'text-gray-700'}>{type}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>

                                        <View className="flex-row mb-3">
                                            <View className="flex-1 mr-2">
                                                <Text className="text-xs text-gray-500 mb-1">Next Follow-up Date</Text>
                                                <TextInput
                                                    editable={activityMode === 'edit'}
                                                    value={followupDate}
                                                    onChangeText={setFollowupDate}
                                                    className={`h-11 rounded-lg px-3 text-gray-900 border ${activityMode === 'edit' ? 'bg-white border-gray-300' : 'bg-gray-100 border-gray-200'}`}
                                                />
                                            </View>
                                            <View className="flex-1 ml-2">
                                                <Text className="text-xs text-gray-500 mb-1">Next Follow-up Time</Text>
                                                <TextInput
                                                    editable={activityMode === 'edit'}
                                                    value={followupTime}
                                                    onChangeText={setFollowupTime}
                                                    className={`h-11 rounded-lg px-3 text-gray-900 border ${activityMode === 'edit' ? 'bg-white border-gray-300' : 'bg-gray-100 border-gray-200'}`}
                                                />
                                            </View>
                                        </View>

                                        <View>
                                            <Text className="text-xs text-gray-500 mb-1">Remarks</Text>
                                            <TextInput
                                                editable={activityMode === 'edit'}
                                                multiline
                                                value={remarks}
                                                onChangeText={setRemarks}
                                                textAlignVertical="top"
                                                className={`min-h-[110px] rounded-lg px-3 py-3 text-gray-900 border ${activityMode === 'edit' ? 'bg-white border-gray-300' : 'bg-gray-100 border-gray-200'}`}
                                            />
                                        </View>
                                    </View>
                                ) : (
                                    <View className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                        <View className="bg-gray-100 px-3 py-3 flex-row">
                                            <Text className="text-xs font-semibold text-gray-700 flex-1">Document Type</Text>
                                            <Text className="text-xs font-semibold text-gray-700 w-28">Document ID</Text>
                                            <Text className="text-xs font-semibold text-gray-700 w-20">Status</Text>
                                            <Text className="text-xs font-semibold text-gray-700 w-12 text-center">Action</Text>
                                        </View>
                                        <View className="py-8 items-center">
                                            <Text className="text-gray-400 text-sm">No documents available</Text>
                                        </View>
                                    </View>
                                )}
                            </ScrollView>

                            <View className="border-t border-gray-100 p-4 flex-row">
                                {activityMode === 'edit' ? (
                                    <>
                                        <Button title="Cancel" variant="outline" className="flex-1 mr-2" onPress={() => setShowActivityModal(false)} />
                                        <Button title="Save" className="flex-1 ml-2" onPress={() => setShowActivityModal(false)} />
                                    </>
                                ) : (
                                    <Button title="Close" variant="outline" className="flex-1" onPress={() => setShowActivityModal(false)} />
                                )}
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Attach Quotation Modal */}
                <AttachQuotationModal
                    visible={showAttachQuotationModal}
                    onClose={closeAttachQuotationModal}
                    onAttach={handleAttachQuotation}
                    customerId={customer.id}
                    excludeIds={mergedQuotations.map(q => q.id)}
                />

            </ScrollView>
        </SafeAreaView>
    );
}