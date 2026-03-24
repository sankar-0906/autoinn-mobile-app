import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Modal,
    Alert,
    KeyboardAvoidingView,
    Platform,
    DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { ChevronLeft, ChevronRight, Calendar, Clock, X, ChevronDown } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { Dimensions } from 'react-native';
import { getCustomerByPhoneNo, getCustomerById, createActivity, getCurrentUser, discardFollowUp } from '../../src/api';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { useToast } from '../../src/ToastContext';
import { TimePickerModal } from '../../components/TimePickerModal';

const ENQUIRY_TYPES = ['Hot', 'Warm', 'Cold'] as const;

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
        <View className="absolute inset-0 z-50 flex-1">
            <View className="flex-1 bg-black/50 justify-center">
                <View className="bg-white rounded-xl m-4 max-h-96">{children}</View>
            </View>
        </View>
    );
};

type WalkInActivityRouteProp = RouteProp<RootStackParamList, 'WalkInActivity'>;
type WalkInActivityNavigationProp = StackNavigationProp<RootStackParamList, 'WalkInActivity'>;

const FormLabel = ({ label, required = false, className = '' }: { label: string; required?: boolean; className?: string }) => (
    <Text className={`text-sm text-gray-600 mb-1 font-medium ${className}`}>
        {label}
        {required && <Text className="text-red-500"> *</Text>}
    </Text>
);

export default function WalkInActivityScreen({
    navigation,
    route,
}: {
    navigation: WalkInActivityNavigationProp;
    route: WalkInActivityRouteProp;
}) {
    const { customerId: initialCustomerId = '', customerPhone = '', quotationId = '', selectedVehicle = null } = (route.params || {}) as any;
    const [customerName, setCustomerName] = useState((route.params as any)?.customerName || 'Customer');
    const [customerData, setCustomerData] = useState<any>(null);

    const [showInteractionModal, setShowInteractionModal] = useState(false);

    const [scheduleDateValue, setScheduleDateValue] = useState<Date | null>(null);
    const [scheduleTimeValue, setScheduleTimeValue] = useState<string>('');
    const [showSchedulePicker, setShowSchedulePicker] = useState(false);

    const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
    const timeFieldRef = React.useRef<View | null>(null);

    const [enquiryType, setEnquiryType] = useState('Hot');
    const [interactionType, setInteractionType] = useState('Walk- In');
    const [remarks, setRemarks] = useState('');
    const [showDiscardModal, setShowDiscardModal] = useState(false);
    const [discardReason, setDiscardReason] = useState('');

    // Validation errors
    const [dateError, setDateError] = useState('');
    const [timeError, setTimeError] = useState('');
    const [discardReasonError, setDiscardReasonError] = useState('');
    const toast = useToast();

    const openTimeDropdown = () => {
        if (!scheduleDateValue) return;
        setTimeDropdownOpen(true);
    };

    React.useEffect(() => {
        const fetchCustomerData = async () => {
            // Try to fetch by customerId first, then by customerPhone as fallback
            let customerData = null;

            try {
                if (initialCustomerId) {
                    console.log('🔍 Fetching customer data by ID:', initialCustomerId);
                    const res = await getCustomerById(initialCustomerId);
                    customerData = res?.data?.response?.data || res?.data?.data;
                    console.log('🔍 Customer data by ID:', customerData);
                } else if (customerPhone) {
                    console.log('🔍 Fetching customer data by phone:', customerPhone);
                    const res = await getCustomerByPhoneNo(customerPhone);
                    const data = res?.data?.response?.data || res?.data?.data;
                    console.log('🔍 API Response:', data);

                    const customers = Array.isArray(data?.customers) ? data.customers :
                        Array.isArray(data?.customer) ? data.customer :
                            data ? [data] : [];

                    if (customers.length > 0) {
                        customerData = customers[0];
                        console.log('🔍 Customer data by phone:', customerData);
                    }
                }

                if (customerData) {
                    setCustomerData(customerData);
                    setCustomerName(customerData.name || 'Customer');
                } else {
                    console.log('🔍 No customer data found');
                    // Use the customerName from route params as fallback
                    setCustomerName((route.params as any)?.customerName || 'Customer');
                }
            } catch (e) {
                console.log('Error fetching customer data:', e);
                // Use the customerName from route params as fallback
                setCustomerName((route.params as any)?.customerName || 'Customer');
            }
        };
        fetchCustomerData();
    }, [initialCustomerId, customerPhone]);

    const formatDate = (value?: Date | string): string => {
        if (!value) return '';
        const date = new Date(value);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handleClose = () => {
        navigation.goBack();
    };

    const handleCreate = async () => {
        setDateError('');
        setTimeError('');

        let ok = true;
        if (!scheduleDateValue) { setDateError('Required'); ok = false; }
        if (!scheduleTimeValue) { setTimeError('Required'); ok = false; }

        if (!ok) return;

        try {
            // Get customer ID from route params or customer data
            const customerId = initialCustomerId || customerData?.id;
            if (!customerId) {
                toast.error('Customer ID not found');
                return;
            }

            // Format date and time for API
            const formattedDate = scheduleDateValue!.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            // Get current user info for employee field (like web project)
            let employeeName = await AsyncStorage.getItem('employeeName');

            // Try to get real employee data from API (web project approach)
            if (!employeeName) {
                try {
                    const userResponse = await getCurrentUser();
                    if (userResponse.data?.code === 200 && userResponse.data?.response?.data) {
                        const userData = userResponse.data.response.data;
                        employeeName = userData.profile?.employeeName ||
                            userData.employeeName ||
                            userData.name ||
                            'Sales Executive';

                        // Cache the employee name for future use
                        if (employeeName) {
                            await AsyncStorage.setItem('employeeName', employeeName);
                        }
                        console.log('🔍 Fetched real employee name from API:', employeeName);
                    }
                } catch (error) {
                    console.warn('⚠️ Failed to fetch current user:', error);
                }
            }

            // Extract quotation and vehicle data from customerData
            let quotationIdToUse = quotationId;
            let vehicleToUse = selectedVehicle;
            let executiveQuotation = null;

            // If no quotationId in params, try to get from customer data
            if (!quotationIdToUse && customerData?.quotation?.length > 0) {
                const latestQuotation = customerData.quotation[customerData.quotation.length - 1];
                quotationIdToUse = latestQuotation.quotationId;
                executiveQuotation = latestQuotation;

                // Extract vehicle from quotation
                if (latestQuotation.vehicle?.length > 0) {
                    vehicleToUse = latestQuotation.vehicle[0];
                }
            }

            // Try to get employee name from quotation executive data
            if (!employeeName && executiveQuotation?.executive) {
                employeeName = executiveQuotation.executive.profile?.employeeName ||
                    executiveQuotation.executive.employeeName ||
                    executiveQuotation.executive.name;
            }

            // Try to get employee name from any quotation
            if (!employeeName && customerData?.quotation?.length > 0) {
                for (const quotation of customerData.quotation) {
                    if (quotation.executive?.profile?.employeeName) {
                        employeeName = quotation.executive.profile.employeeName;
                        break;
                    }
                }
            }

            // Fallback to default if still not found
            if (!employeeName) {
                employeeName = 'Sales Executive';
            }

            // Create activity payload
            const activityData = {
                customerId: customerId,
                interactionType: 'WALK IN',
                enquiryType: enquiryType,
                remarks: remarks,
                followUpDate: formattedDate,
                followUpTime: scheduleTimeValue,
                scheduleDateAndTime: `${formattedDate} ${scheduleTimeValue}`,
                type: 'WalkInActivity',
                // Add missing fields from web project
                employee: employeeName,
                employeeName: employeeName,
                uniqueId: `WALKIN_${Date.now()}`,
                activityType: 'WalkInActivity',
                // Add quotation and vehicle data
                ...(quotationIdToUse && { quotationId: quotationIdToUse }),
                ...(vehicleToUse && { vehicle: vehicleToUse })
            };

            console.log('🔍 Creating walk-in activity:', activityData);

            const response = await createActivity(activityData);

            if (response.data?.code === 200) {
                toast.success('Walk-In activity created successfully');

                // Pass activity data back for instant update
                const newActivity = {
                    ...activityData,
                    id: response.data?.response?.data?.id || Date.now().toString(),
                    createdAt: new Date().toISOString(),
                    activityType: 'WalkIn Activity',
                    // Add any additional fields needed for UI display
                    customerName: customerData?.name || customerName,
                };

                // Emit event for instant activity update
                DeviceEventEmitter.emit('activityCreated', {
                    type: 'walkin',
                    activity: newActivity
                });

                // Navigate back
                navigation.goBack();
            } else {
                toast.error(response.data?.message || 'Failed to create walk-in activity');
            }
        } catch (error) {
            console.error('Error creating walk-in activity:', error);
            toast.error('Something went wrong while creating the activity');
        }
    };

    const handleDiscard = async () => {
        setDiscardReasonError('');
        if (!discardReason.trim()) {
            setDiscardReasonError('Required');
            return;
        }

        const customerId = initialCustomerId || customerData?.id;
        if (!customerId) {
            toast.error('Customer ID not found');
            return;
        }

        try {
            const response = await discardFollowUp(customerId, discardReason);
            if (response.data?.code === 200 && response.data?.response?.code === 200) {
                toast.success('Follow-Up discarded successfully');
                setShowDiscardModal(false);
                // Navigate to Quotations tab in Main navigator
                navigation.navigate('Main', {
                    screen: 'Quotations',
                    params: { activeTab: 'rejected' }
                } as any);
            } else {
                toast.error(response.data?.message || 'Failed to discard follow-up');
            }
        } catch (error) {
            console.error('Error discarding follow-up:', error);
            toast.error('Something went wrong while discarding the follow-up');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white border-b border-gray-100 px-4 py-4 flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={handleClose} className="mr-3">
                        <ChevronLeft size={24} color={COLORS.gray[900]} />
                    </TouchableOpacity>
                    <Text className="text-gray-900 text-lg font-bold">Walk-In Activity</Text>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        {/* Customer Name */}
                        <View className="mb-4">
                            <FormLabel label="Customer Name" required />
                            <TextInput
                                value={customerData?.name || customerName || 'Loading...'}
                                editable={false}
                                className="h-12 bg-gray-100 border border-gray-200 rounded-lg px-3 text-gray-800"
                            />
                        </View>

                        {/* Next Followup Date */}
                        <View className="mb-4">
                            <FormLabel label="Next Followup Date" required />
                            <View className="relative">
                                <TextInput
                                    value={formatDate(scheduleDateValue || undefined)}
                                    editable={false}
                                    placeholder="DD/MM/YYYY"
                                    className={`h-12 bg-white border rounded-xl px-4 pr-12 text-gray-800 ${dateError ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                <TouchableOpacity
                                    onPressIn={() => setShowSchedulePicker(true)}
                                    className="absolute right-4 top-3.5"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Calendar size={18} color={COLORS.gray[400]} />
                                </TouchableOpacity>
                            </View>
                            {dateError ? <Text className="text-red-500 text-xs mt-1">{dateError}</Text> : null}
                        </View>

                        {/* Next Followup Time */}
                        <View className="mb-4" style={{ zIndex: 60 }}>
                            <FormLabel label="Next Followup Time" required />
                            <View ref={timeFieldRef} className="relative" style={{ zIndex: timeDropdownOpen ? 60 : 1 }}>
                                <TouchableOpacity
                                    onPress={() => {
                                        openTimeDropdown();
                                    }}
                                    activeOpacity={0.7}
                                    disabled={!scheduleDateValue}
                                    className={`border rounded-xl px-4 h-12 flex-row items-center justify-between ${scheduleDateValue ? (timeError ? 'bg-white border-red-500' : 'bg-white border-gray-300') : 'bg-gray-100 border-gray-200'}`}
                                >
                                    <Text className={scheduleTimeValue ? 'text-gray-900' : 'text-gray-400'}>
                                        {scheduleTimeValue || 'Select time'}
                                    </Text>
                                    <Clock size={18} color={COLORS.gray[400]} />
                                </TouchableOpacity>
                            </View>
                            {!scheduleDateValue && (
                                <Text className="text-xs text-gray-500 mt-1">Set Schedule Follow-Up Date first</Text>
                            )}
                            {timeError ? <Text className="text-red-500 text-xs mt-1">{timeError}</Text> : null}
                        </View>

                        {/* Enquiry Type */}
                        <View className="mb-4">
                            <FormLabel label="Enquiry Type" required className="mb-2" />
                            <View className="flex-row gap-2">
                                {ENQUIRY_TYPES.map((type: string) => (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => setEnquiryType(type)}
                                        className={`flex-1 h-11 rounded-lg items-center justify-center border ${enquiryType === type
                                            ? 'bg-teal-600 border-teal-600'
                                            : 'bg-white border-gray-300'
                                            }`}
                                    >
                                        <Text className={`text-sm font-semibold ${enquiryType === type ? 'text-white' : 'text-gray-700'}`}>
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Interaction Type */}
                        <View className="mb-4">
                            <FormLabel label="Interaction Type" required />
                            <TextInput
                                value="Walk-In"
                                editable={false}
                                className="h-12 bg-gray-100 border border-gray-200 rounded-lg px-3 text-gray-800"
                            />
                        </View>

                        {/* Remarks */}
                        <View className="mb-4">
                            <FormLabel label="Remarks" />
                            <TextInput
                                placeholder="Enter remarks..."
                                value={remarks}
                                onChangeText={setRemarks}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                className="h-24 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                            />
                        </View>

                        {/* Discard Followup Link */}
                        <TouchableOpacity onPress={() => setShowDiscardModal(true)} className="mb-4">
                            <Text className="text-teal-600 text-sm font-medium">Discard Followup</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Action Buttons */}
            <View className="bg-white border-t border-gray-100 p-4 flex-row gap-3">
                <Button
                    title="Cancel"
                    variant="outline"
                    className="flex-1"
                    onPress={handleClose}
                />
                <Button title="Create" className="flex-1" onPress={handleCreate} />
            </View>

            {/* Discard Modal */}
            <Modal visible={showDiscardModal} transparent animationType="fade" onRequestClose={() => setShowDiscardModal(false)}>
                <View className="flex-1 bg-black/40 justify-center px-4">
                    <View className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                        {/* Modal Header */}
                        <View className="bg-gray-600 px-4 py-3 flex-row items-center justify-between">
                            <Text className="text-white text-base font-bold">Discard Followup</Text>
                            <TouchableOpacity onPress={() => setShowDiscardModal(false)} className="p-1 hover:bg-gray-700 rounded">
                                <X size={24} color="white" />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Content */}
                        <View className="p-4 bg-gray-50">
                            <Text className="text-gray-700 text-sm font-medium mb-3">Are you sure you want to discard this followup?</Text>

                            <View className="mb-4">
                                <FormLabel label="Reason" required />
                                <TextInput
                                    placeholder="Enter reason for discarding..."
                                    value={discardReason}
                                    onChangeText={setDiscardReason}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                    className={`h-24 bg-white border rounded-lg px-3 py-2 text-gray-800 ${discardReasonError ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {discardReasonError ? <Text className="text-red-500 text-xs mt-1">{discardReasonError}</Text> : null}
                            </View>
                        </View>

                        {/* Modal Footer */}
                        <View className="px-4 py-3 flex-row gap-2 border-t border-gray-100 bg-white">
                            <Button
                                title="Cancel"
                                variant="outline"
                                className="flex-1"
                                onPress={() => setShowDiscardModal(false)}
                            />
                            <Button title="Discard" variant="danger" className="flex-1" onPress={handleDiscard} />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Date Picker Modal */}
            <Modal visible={showSchedulePicker} transparent animationType="fade" onRequestClose={() => setShowSchedulePicker(false)}>
                <View className="flex-1 bg-black/40 items-center justify-center px-4">
                    <View className="bg-white rounded-2xl p-4 w-full max-w-md">
                        <Text className="text-gray-900 font-bold mb-3">Select Schedule Date</Text>
                        <RNCalendar
                            current={scheduleDateValue ? scheduleDateValue.toISOString().split('T')[0] : undefined}
                            minDate={new Date().toISOString().split('T')[0]}
                            onDayPress={(day) => {
                                const selectedDate = new Date(day.dateString);
                                setScheduleDateValue(selectedDate);
                                setDateError('');
                            }}
                            theme={{
                                todayTextColor: COLORS.primary,
                                selectedDayBackgroundColor: COLORS.primary,
                                selectedDayTextColor: '#fff',
                                arrowColor: COLORS.primary,
                                textSectionTitleColor: '#6b7280',
                            }}
                            markedDates={
                                scheduleDateValue
                                    ? {
                                        [scheduleDateValue.toISOString().split('T')[0]]: {
                                            selected: true,
                                            selectedColor: COLORS.primary,
                                        },
                                    }
                                    : undefined
                            }
                        />
                        <View className="flex-row justify-end mt-4">
                            <TouchableOpacity
                                onPress={() => setShowSchedulePicker(false)}
                                className="px-4 py-2 rounded-lg bg-teal-600"
                            >
                                <Text className="text-white font-semibold">Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Time Picker Modal */}
            <TimePickerModal
                visible={timeDropdownOpen}
                onClose={() => setTimeDropdownOpen(false)}
                onSelect={(time) => {
                    setScheduleTimeValue(time);
                    setTimeError('');
                }}
            />


            {/* Interaction Type Modal */}
            <CustomModal visible={showInteractionModal} onClose={() => setShowInteractionModal(false)}>
                <View className="p-4 border-b border-gray-200">
                    <Text className="text-lg font-semibold">Select Interaction Type</Text>
                </View>
                <ScrollView>
                    {[
                        { label: 'Walk- In', value: 'Walk- In' },
                        { label: 'Call', value: 'Call' },
                        { label: 'Message', value: 'Message' },
                    ].map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            onPress={() => {
                                setInteractionType(option.value);
                                setShowInteractionModal(false);
                            }}
                            className="p-4 border-b border-gray-100"
                        >
                            <Text className={`text-gray-800 ${interactionType === option.value ? 'font-bold text-teal-600' : ''}`}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <TouchableOpacity onPress={() => setShowInteractionModal(false)} className="p-4 border-t border-gray-200">
                    <Text className="text-center text-gray-600">Cancel</Text>
                </TouchableOpacity>
            </CustomModal>
        </SafeAreaView>
    );
}
