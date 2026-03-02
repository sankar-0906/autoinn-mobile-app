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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChevronLeft, Eye, Edit, Phone, Car, User, Smartphone, CalendarDays, Clock } from 'lucide-react-native';
import { RootStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import AttachQuotationModal from '../../components/AttachQuotationModal';
import { getActivitiesByCustomer, getCustomerByPhoneNo, getQuotationByCustomerId } from '../../src/api';

type DetailRouteProp = RouteProp<RootStackParamList, 'FollowUpDetail'>;
type DetailNavProp = StackNavigationProp<RootStackParamList, 'FollowUpDetail'>;

type Activity = {
    id: string;
    activityId: string;
    type: string;
    date: string;
    bookingId: string;
    customerAuth: string;
    vehicle: string;
    colorCode: string;
    supervisor: string;
    employee: string;
    enquiryType: string;
    remarks: string;
    interactionType: string;
    scheduleDateAndTime: string;
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
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
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

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}-${month}-${year} ${hours}:${minutes}`;
    } catch {
        return '-';
    }
};

export default function FollowUpDetailScreen() {
    const navigation = useNavigation<DetailNavProp>();
    const route = useRoute<DetailRouteProp>();
    const { id: phoneNo } = route.params;

    const [loading, setLoading] = useState(true);
    const [customer, setCustomer] = useState<any>(null);
    const [quotations, setQuotations] = useState<any[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);

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

    // Handler functions
    const openAttachQuotationModal = () => {
        setShowAttachQuotationModal(true);
    };

    const closeAttachQuotationModal = () => {
        setShowAttachQuotationModal(false);
    };

    const handleAttachQuotation = (selectedQuotationIds: string[]) => {
        console.log('Attached quotations:', selectedQuotationIds);
        // Here you can add logic to actually attach the quotations
        // For now, just close the modal
        closeAttachQuotationModal();
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const customerRes = await getCustomerByPhoneNo(phoneNo);
            const customers = customerRes.data?.response?.data?.customers || [];

            if (customers.length > 0) {
                const firstCustomer = customers[0];

                setCustomer({
                    name: firstCustomer.name || 'Unknown',
                    customerId: firstCustomer.id,
                    customerType: firstCustomer.type || 'Non Customer',
                    gender: firstCustomer.gender || '-',
                    age: firstCustomer.age || '-',
                    location: firstCustomer.location || '-',
                    mobile: firstCustomer.phone,
                    fatherName: firstCustomer.fatherName || '-',
                    email: firstCustomer.email || '-',
                    locality: firstCustomer.location || '-',
                    pincode: firstCustomer.pincode || '-',
                });

                const customerIds = customers.map((c: any) => c.id);

                const quotationRes = await getQuotationByCustomerId(firstCustomer.id);
                const qData = quotationRes.data?.response?.data || [];

                const transformedQuotations = qData.map((q: any) => {
                    let vehicleLabel = '-';
                    if (q.vehicle && Array.isArray(q.vehicle) && q.vehicle.length > 0) {
                        vehicleLabel = q.vehicle.map((v: any) =>
                            v?.modelName ||
                            v?.vehicleDetail?.modelName ||
                            v?.vehicle ||
                            'Unknown'
                        ).join(',\n');
                    } else {
                        vehicleLabel = q.vehicleMaster?.modelName || (typeof q.vehicle === 'string' ? q.vehicle : 'Unknown');
                    }

                    return {
                        ...q,
                        vehicleLabel
                    };
                });
                setQuotations(transformedQuotations);

                if (qData.length > 0) {
                    const latest = qData[qData.length - 1];
                    setFollowupDate(latest.scheduleDate || '');
                    setFollowupTime(latest.scheduleTime || '');
                }

                const activityRes = await getActivitiesByCustomer({
                    ids: customerIds,
                    limit: 15,
                    offset: 0
                });

                const aData = activityRes.data?.response?.data || [];

                setActivities(aData.map((a: any) => {
                    // Safely extract values with null checks
                    const createdBy = a.createdBy?.profile?.employeeName || '-';
                    const bookingId = a.booking?.bookingId || '-';
                    const customerAuth = a.customerAuthStatus || 'Not verified';

                    // Handle vehicle data - extract multiple models if available
                    let vehicleModels = [];
                    if (a.quotation?.vehicle && Array.isArray(a.quotation.vehicle)) {
                        vehicleModels = a.quotation.vehicle.map((v: any) =>
                            v?.vehicleDetail?.modelName ||
                            v?.modelName ||
                            v?.vehicle ||
                            'Unknown Model'
                        ).filter(Boolean);
                    } else if (a.quotation?.vehicleMaster?.modelName) {
                        vehicleModels = [a.quotation.vehicleMaster.modelName];
                    } else if (a.vehicleModel) {
                        vehicleModels = [a.vehicleModel];
                    } else if (typeof a.quotation?.vehicle === 'string') {
                        vehicleModels = [a.quotation.vehicle.replace('.', '')];
                    }

                    const vehicleDisplay = vehicleModels.length > 0
                        ? vehicleModels.join(',\n')
                        : '-';

                    const colorCode = a.colorCode || '-';
                    const supervisor = a.supervisor || '-';
                    const enquiryType = a.enquiryType || '-';
                    const remarks = a.remarks || '-';
                    const interactionType = a.interactionType || '-';
                    const scheduleDateAndTime = a.scheduleDateAndTime ? formatDateTime(a.scheduleDateAndTime) : '-';

                    return {
                        id: a.id,
                        activityId: a.activityId || '-',
                        type: a.activityType || 'Activity',
                        date: a.createdAt ? formatDateTime(a.createdAt) : '-',
                        bookingId: bookingId,
                        customerAuth: customerAuth,
                        vehicle: vehicleDisplay,
                        colorCode: colorCode,
                        supervisor: supervisor,
                        employee: createdBy,
                        enquiryType: enquiryType,
                        remarks: remarks,
                        interactionType: interactionType,
                        scheduleDateAndTime: scheduleDateAndTime,
                        quotationId: a.quotation?.quotationId || '-',
                    };
                }));
            } else {
                Alert.alert('Error', 'Customer not found');
            }
        } catch (error) {
            console.error('Error in fetchData:', error);
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [phoneNo]);

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

        if (customerTab === 'bookings') {
            return (
                <View className="bg-white rounded-xl border border-gray-100 p-4">
                    <Text className="text-gray-900 font-semibold mb-2">Bookings</Text>
                    <Text className="text-sm text-gray-500">No bookings found for this customer</Text>
                </View>
            );
        }

        if (customerTab === 'quotations') {
            return (
                <View className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <View className="bg-gray-100 px-3 py-3 flex-row">
                        <Text className="text-xs font-semibold text-gray-700 w-24">Date</Text>
                        <Text className="text-xs font-semibold text-gray-700 flex-1">Quotation ID</Text>
                        <Text className="text-xs font-semibold text-gray-700 flex-1">Model</Text>
                        <Text className="text-xs font-semibold text-gray-700 w-14 text-center">Action</Text>
                    </View>
                    {quotations.map((q, index) => (
                        <View key={q.id || index} className={`px-3 py-3 flex-row items-center ${index % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                            <Text className="text-xs text-gray-700 w-24">{formatDate(q.createdAt)}</Text>
                            <Text className="text-xs text-teal-600 flex-1">{q.quotationId}</Text>
                            <Text className="text-xs text-gray-800 flex-1">{q.vehicleLabel || '-'}</Text>
                            <TouchableOpacity className="w-14 items-center">
                                <Eye size={14} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            );
        }

        return (
            <View className="bg-white rounded-xl border border-gray-100 p-10">
                <Text className="text-center text-gray-400">No data available</Text>
            </View>
        );
    }, [customerTab, customer, quotations]);

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
                </View>
            </View>

            <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                <View className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow">
                    <View className="flex-row items-center justify-center mb-4">
                        <User size={20} color={COLORS.gray[900]} className="mr-2" />
                        <Text className="text-xl font-semibold text-gray-900">
                            {customer.name}
                        </Text>
                    </View>

                    <View className="items-center mb-4">
                        <Text className="text-sm font-semibold text-gray-900">Customer ID: {customer.customerId}</Text>
                        <Text className="text-sm text-gray-600 mt-1">Customer Type: {customer.customerType}</Text>
                        <Text className="text-sm text-gray-600 mt-1">
                            {customer.gender} | {customer.location}
                        </Text>
                    </View>

                    <View className="flex-row justify-center gap-3 border-t border-gray-100 pt-3">
                        <TouchableOpacity
                            onPress={() => setShowCustomerModal(true)}
                            className="flex-row items-center px-4 py-2 bg-gray-50 rounded-lg"
                        >
                            <Eye size={18} color="#475569" />
                            <Text className="ml-2 text-xs font-medium text-gray-600">View Details</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('CustomerEdit', { customerId: customer.customerId })}
                            className="flex-row items-center px-4 py-2 bg-teal-50 rounded-lg"
                        >
                            <Edit size={18} color="#0d9488" />
                            <Text className="ml-2 text-xs font-medium text-teal-700">Edit Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
                    <View className="bg-gray-100 px-3 py-3 flex-row">
                        <Text className="text-xs font-semibold text-gray-700 flex-1">Quotation No</Text>
                        <Text className="text-xs font-semibold text-gray-700 flex-1">Vehicle</Text>
                        <Text className="text-xs font-semibold text-gray-700 w-24">Created On</Text>
                        <Text className="text-xs font-semibold text-gray-700 w-12 text-center">Action</Text>
                    </View>
                    {quotations.map((q, idx) => {
                        const vehicleDisplay = q.vehicleLabel || q.vehicleMaster?.modelName || '-';
                        return (
                            <View key={q.id || idx} className={`px-3 py-3 flex-row items-center ${idx % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                                <Text className="text-xs text-teal-600 flex-1">{q.quotationId || '-'}</Text>
                                <Text className="text-xs text-gray-800 flex-1">{vehicleDisplay}</Text>
                                <Text className="text-xs text-gray-800 w-24">{formatDate(q.createdAt)}</Text>
                                <TouchableOpacity className="w-12 items-center" onPress={() => navigation.navigate('QuotationView', { id: q.id })}>
                                    <Eye size={14} color={COLORS.gray[600]} />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>

                <View className="bg-white rounded-xl border border-gray-200 p-4 mb-4">

                    <View className="gap-3">

                        <Button
                            title="Booking"
                            variant="outline"
                            onPress={() =>
                                navigation.navigate('BookingActivity', {
                                    customerName: customer.name,
                                    customerId: customer.customerId,
                                    customerPhone: phoneNo
                                })
                            }
                        />

                        <Button
                            title="Quotation"
                            variant="outline"
                            onPress={() =>
                                navigation.navigate('FollowUpQuotationForm', {
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
                                    customerId: customer.customerId
                                })
                            }
                        />

                        <Button
                            title="Call"
                            variant="outline"
                            onPress={() =>
                                navigation.navigate('CallActivity', {
                                    customerName: customer.name,
                                    customerId: customer.customerId,
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

                <Text className="text-xl font-semibold text-gray-900 text-center mb-3">Activity</Text>
                {activities && activities.length > 0 ? activities.map((activity) => {
                    if (!activity || typeof activity !== 'object') return null;

                    return <View key={activity.id} className="bg-white rounded-2xl shadow-md overflow-hidden border-0 mb-4">
                        {/* Header */}
                        <View className="bg-white px-4 py-4 flex-row items-center justify-between border-b border-gray-100">
                            <View className="ml-1 flex-1">
                                <Text className="text-gray-800 font-semibold text-base mb-0.5">
                                    {activity.type || 'Activity'}
                                </Text>
                                <Text className="text-gray-500 text-xs">{activity.date || '-'}</Text>
                            </View>

                            <View className={`mr-4 px-3 py-1.5 rounded ${activity.enquiryType === 'Hot' ? 'bg-orange-400' :
                                activity.enquiryType === 'Warm' ? 'bg-yellow-400' :
                                    'bg-blue-400'
                                }`}>
                                <Text className="text-white text-xs font-bold">
                                    {activity.enquiryType || '-'}
                                </Text>
                            </View>
                        </View>

                        {/* Content */}
                        <View className="px-4 py-4 space-y-4 bg-white">
                            {/* Row 1 - Activity ID and Interaction Type */}
                            <View className="ml-2 flex-row gap-4 mb-2">
                                <View className="flex-1">
                                    <Text className="text-gray-600 text-xs font-medium mb-1.5">
                                        Activity ID
                                    </Text>
                                    <Text className="text-gray-800 text-sm font-semibold" numberOfLines={1}>
                                        {activity.activityId || '-'}
                                    </Text>
                                </View>

                                <View className="flex-1">
                                    <Text className="text-gray-600 text-xs font-medium mb-1.5">
                                        Interaction Type
                                    </Text>
                                    <Text className="text-gray-800 text-sm font-semibold" numberOfLines={1}>
                                        {activity.interactionType || '-'}
                                    </Text>
                                </View>
                            </View>

                            {/* Row 2 - Follow-up Date and Time */}
                            <View className="flex-row gap-4 mb-2 mt-4">
                                <View className="flex-1 flex-row items-center gap-2">
                                    <CalendarDays size={14} color="#6b7280" />
                                    <View className="flex-1">
                                        <Text className="text-gray-600 text-xs font-medium mb-1">
                                            Followup Date
                                        </Text>
                                        <Text className="text-gray-800 text-sm font-semibold" numberOfLines={1}>
                                            {activity.scheduleDateAndTime?.split(' ')[0] || '-'}
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
                                            {activity.scheduleDateAndTime?.split(' ')[1] || '-'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Row 3 - Vehicle and Employee */}
                            <View className="flex-row gap-4 mb-2 mt-4">
                                <View className="flex-1 flex-row items-start gap-2">
                                    <Car size={14} color="#6b7280" style={{ marginTop: 2 }} />
                                    <View className="flex-1">
                                        <Text className="text-gray-600 text-xs font-medium mb-1">
                                            Vehicle
                                        </Text>
                                        <Text className="text-gray-800 text-sm font-semibold leading-relaxed">
                                            {activity.vehicle || '-'}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-1 flex-row items-center gap-2">
                                    <View className="w-5 h-5 bg-gray-200 rounded-full items-center justify-center">
                                        <Text className="text-gray-600 text-xs font-bold">
                                            {activity.employee?.charAt(0)?.toUpperCase() || '-'}
                                        </Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-600 text-xs font-medium mb-1">
                                            Employee
                                        </Text>
                                        <Text className="text-gray-800 text-sm font-semibold" numberOfLines={1}>
                                            {activity.employee || '-'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
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
                }) : (
                    <View className="bg-white rounded-xl border border-gray-200 p-8 mb-4">
                        <Text className="text-center text-gray-400">No activities found</Text>
                    </View>
                )}
            </ScrollView>

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
                customerId={customer.customerId}
                excludeIds={quotations.map(q => q.id)}
            />

            {/* Bottom Navigation Buttons */}
            <View className="bg-white border-t border-gray-100 p-4 flex-row gap-3">
                <Button
                    title="Previous"
                    variant="outline"
                    className="flex-1 h-11"
                    onPress={() => navigation.goBack()}
                />
                <Button
                    title="Next"
                    className="flex-1 h-11 bg-teal-600"
                    onPress={() => navigation.goBack()}
                />
            </View>
        </SafeAreaView>
    );
}