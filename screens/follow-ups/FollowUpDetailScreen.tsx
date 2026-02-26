import React, { useMemo, useState } from 'react';
import {
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChevronLeft, Eye, Edit, Phone, Car, User, Smartphone } from 'lucide-react-native';
import { RootStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { getActivitiesByCustomer, getCustomerByPhoneNo, getQuotationByCustomerId } from '../../src/api';
import { ActivityIndicator, Alert } from 'react-native';

type DetailRouteProp = RouteProp<RootStackParamList, 'FollowUpDetail'>;
type DetailNavProp = StackNavigationProp<RootStackParamList, 'FollowUpDetail'>;

type Activity = {
    id: string;
    type: string;
    date: string;
    bookingId: string;
    customerAuth: string;
    vehicle: string;
    colorCode: string;
    supervisor: string;
    employee: string;
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

export default function FollowUpDetailScreen({ navigation, route }: { navigation: DetailNavProp; route: DetailRouteProp }) {
    const { id: phoneNo } = route.params;

    const [loading, setLoading] = useState(true);
    const [customer, setCustomer] = useState<any>(null);
    const [quotations, setQuotations] = useState<any[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);

    const [showAttachModal, setShowAttachModal] = useState(false);
    const [quotationId, setQuotationId] = useState('');

    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customerTab, setCustomerTab] = useState<(typeof CUSTOMER_TABS)[number]['id']>('customer-details');

    const [showActivityModal, setShowActivityModal] = useState(false);
    const [activityMode, setActivityMode] = useState<'view' | 'edit'>('view');
    const [activityTab, setActivityTab] = useState<'details' | 'documents'>('details');

    const [enquiryType, setEnquiryType] = useState<string>('Hot');
    const [followupDate, setFollowupDate] = useState('');
    const [followupTime, setFollowupTime] = useState('');
    const [remarks, setRemarks] = useState('');

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch customers by phone
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

                // 2. Fetch quotations (using the first customer's ID for now, similar to web)
                const quotationRes = await getQuotationByCustomerId(firstCustomer.id);
                const qData = quotationRes.data?.response?.data || [];

                // Transform quotations data safely
                const transformedQuotations = qData.map((q: any) => {
                    const vehicleLabel = q.vehicleMaster?.modelName
                        || (Array.isArray(q.vehicle) && q.vehicle.length > 0
                            ? q.vehicle.map((v: any) => v?.modelName || v?.vehicleDetail?.modelName || v?.vehicle || 'Unknown').join(', ')
                            : q.vehicle && typeof q.vehicle === 'string' ? q.vehicle : 'Unknown');

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

                // 3. Fetch activities for all associated customer IDs
                const activityRes = await getActivitiesByCustomer({
                    ids: customerIds,
                    limit: 15,
                    offset: 0
                });
                const aData = activityRes.data?.response?.data || [];
                setActivities(aData.map((a: any) => ({
                    id: a.id,
                    type: a.activityType || 'Activity',
                    date: a.createdAt ? (new Date(a.createdAt)).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-',
                    bookingId: a.bookingId || '-',
                    customerAuth: a.customerAuthStatus || 'Not verified',
                    vehicle: a.vehicleModel || '-',
                    colorCode: a.colorCode || '-',
                    supervisor: a.supervisor || '-',
                    employee: a.employeeName || '-',
                })));
            } else {
                Alert.alert('Error', 'Customer not found');
            }
        } catch (error) {
            console.error('Error fetching detail data:', error);
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [phoneNo]);

    React.useEffect(() => {
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
                        <View key={q.id} className={`px-3 py-3 flex-row items-center ${index % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                            <Text className="text-xs text-gray-700 w-24">{(new Date(q.createdAt)).toLocaleDateString('en-GB')}</Text>
                            <Text className="text-xs text-teal-600 flex-1">{q.quotationId}</Text>
                            <Text className="text-xs text-gray-800 flex-1" numberOfLines={1}>{q.vehicleMaster?.modelName || '-'}</Text>
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
                <View className="flex-row justify-between">
                    <Button
                        title="Previous"
                        variant="outline"
                        className="h-9 min-w-[100px] border-teal-500"
                        onPress={() => navigation.goBack()}
                    />
                    <Button
                        title="Next"
                        variant="outline"
                        className="h-9 min-w-[100px] border-teal-500"
                        onPress={() => navigation.goBack()}
                    />
                </View>
            </View>

            <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                <View className="bg-white rounded-2xl border border-gray-100 p-6 mb-4 shadow-sm">
                    <View className="flex-row items-center justify-between mb-4">
                        <View>
                            <Text className="text-2xl font-bold text-gray-900 mb-1">{customer.name}</Text>
                            <View className="flex-row items-center">
                                <View className="bg-teal-50 px-2 py-0.5 rounded-md mr-2">
                                    <Text className="text-[10px] font-bold text-teal-700 uppercase">{customer.customerId}</Text>
                                </View>
                                <Text className="text-xs text-gray-500">{customer.customerType}</Text>
                            </View>
                        </View>
                        <View className="w-14 h-14 bg-gray-50 rounded-full items-center justify-center border border-gray-100">
                            <User size={28} color="#94a3b8" />
                        </View>
                    </View>

                    <View className="space-y-2 mb-5">
                        <View className="flex-row items-center">
                            <Smartphone size={14} color="#64748b" className="mr-2" />
                            <Text className="text-sm text-gray-700">{customer.mobile}</Text>
                        </View>
                        <View className="flex-row items-center mt-2">
                            <View className="bg-gray-100 h-1.5 w-1.5 rounded-full mr-2" />
                            <Text className="text-sm text-gray-600">{customer.gender} • {customer.age} • {customer.location}</Text>
                        </View>
                    </View>

                    <View className="border-t border-gray-50 pt-4 flex-row items-center justify-around">
                        <TouchableOpacity
                            onPress={() => setShowCustomerModal(true)}
                            className="flex-row items-center px-4 py-2 bg-gray-50 rounded-xl"
                        >
                            <Eye size={18} color="#475569" />
                            <Text className="ml-2 text-xs font-semibold text-gray-600">View Details</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('CustomerDetails')}
                            className="flex-row items-center px-4 py-2 bg-teal-50 rounded-xl"
                        >
                            <Edit size={18} color="#0d9488" />
                            <Text className="ml-2 text-xs font-semibold text-teal-700">Edit Profile</Text>
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
                                <Text className="text-xs text-gray-800 flex-1" numberOfLines={1}>{vehicleDisplay}</Text>
                                <Text className="text-xs text-gray-800 w-24">{q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-GB') : '-'}</Text>
                                <TouchableOpacity className="w-12 items-center" onPress={() => navigation.navigate('QuotationView', { id: q.id })}>
                                    <Eye size={14} color={COLORS.gray[600]} />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                    <View className="p-3 border-t border-gray-100">
                        <Button title="Attach Quotation" className="w-full" onPress={() => setShowAttachModal(true)} />
                    </View>
                </View>

                <View className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                    <View className="flex-row gap-3">
                        <Button title="Booking" variant="outline" className="flex-1" onPress={() => navigation.navigate('BookingRegister')} />
                        <Button title="Quotation" variant="outline" className="flex-1" onPress={() => navigation.navigate('QuotationForm', { id: phoneNo })} />
                    </View>
                    <View className="flex-row gap-3 mt-3">
                        <Button title="Walk-In" variant="outline" className="flex-1" onPress={() => openActivityModal('edit')} />
                        <Button title="Call" variant="outline" className="flex-1" onPress={() => { }} icon={<Phone size={14} color={COLORS.primary} />} />
                    </View>
                </View>

                <Text className="text-xl font-semibold text-gray-900 text-center mb-3">Activity</Text>
                {activities.map((activity) => (
                    <View key={activity.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
                        <View className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex-row items-center justify-between">
                            <Text className="text-sm font-semibold text-gray-900">{activity.type}</Text>
                            <Text className="text-xs text-gray-500">{activity.date}</Text>
                        </View>
                        <View className="p-4">
                            <View className="flex-row items-start justify-between mb-3">
                                <View>
                                    <Text className="text-xs text-gray-500">Booking ID</Text>
                                    <Text className="text-sm font-medium text-gray-900">{activity.bookingId}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-xs text-red-600 mb-2">next</Text>
                                    <View className="flex-row">
                                        <TouchableOpacity className="mr-3" onPress={() => openActivityModal('view')}>
                                            <Eye size={16} color={COLORS.gray[600]} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => openActivityModal('edit')}>
                                            <Edit size={16} color={COLORS.gray[600]} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <Text className="text-xs text-gray-500 mb-1">Customer Authentication</Text>
                            <Text className="text-sm text-red-600 font-semibold mb-3">{activity.customerAuth}</Text>

                            <View className="bg-gray-50 rounded-xl p-3 mb-3 flex-row">
                                <View className="w-12 h-12 rounded-full bg-white items-center justify-center mr-3">
                                    <Car size={20} color={COLORS.gray[600]} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs text-gray-500">Vehicle</Text>
                                    <Text className="text-xs text-gray-800 mb-1" numberOfLines={2}>{activity.vehicle}</Text>
                                    <Text className="text-xs text-gray-500">Color Code: <Text className="text-gray-900">{activity.colorCode}</Text></Text>
                                    <Text className="text-xs text-gray-500">Supervisor: <Text className="text-gray-900">{activity.supervisor}</Text></Text>
                                </View>
                            </View>

                            <Text className="text-xs text-gray-500">Employee: <Text className="text-gray-900">{activity.employee}</Text></Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <Modal
                visible={showAttachModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowAttachModal(false)}
            >
                <View className="flex-1 bg-black/40 justify-center px-4">
                    <View className="bg-white rounded-xl overflow-hidden">
                        <View className="bg-gray-500 px-4 py-3">
                            <Text className="text-white font-semibold">Attach Quotation</Text>
                        </View>
                        <View className="p-4">
                            <TextInput
                                placeholder="Enter Quotation"
                                value={quotationId}
                                onChangeText={setQuotationId}
                                className="h-12 bg-white border border-gray-200 rounded-xl px-4 text-gray-900"
                            />
                        </View>
                        <View className="flex-row px-4 pb-4">
                            <Button
                                title="Cancel"
                                variant="outline"
                                className="flex-1 mr-2"
                                onPress={() => setShowAttachModal(false)}
                            />
                            <Button
                                title="Attach"
                                className="flex-1 ml-2"
                                onPress={() => {
                                    setShowAttachModal(false);
                                    setQuotationId('');
                                }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

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
                                    {[{ type: 'PDFWITHOUTBROCHURE', id: 'QDB/25-26/115' }, { type: 'PDFWITHBROCHURE', id: 'QDB/25-26/115' }].map((doc, idx) => (
                                        <View key={doc.type} className={`px-3 py-3 flex-row items-center ${idx % 2 ? 'bg-white' : 'bg-gray-50'}`}>
                                            <Text className="text-xs text-gray-800 flex-1" numberOfLines={1}>{doc.type}</Text>
                                            <Text className="text-xs text-gray-700 w-28">{doc.id}</Text>
                                            <Text className="text-xs text-gray-700 w-20">Initiated</Text>
                                            <TouchableOpacity className="w-12 items-center">
                                                <Text className="text-xs text-teal-600 font-semibold">View</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
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
        </SafeAreaView>
    );
}
