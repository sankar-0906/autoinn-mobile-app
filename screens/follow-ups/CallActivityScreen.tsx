import React, { useState, useEffect } from 'react';
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
import { Dimensions } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { ChevronLeft, ChevronRight, Calendar, Clock, X, ChevronDown } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { getCustomerByPhoneNo, placeCloudCall, createCallActivity, getCurrentUser, discardFollowUp } from '../../src/api';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { useToast } from '../../src/ToastContext';
import { TimePickerModal } from '../../components/TimePickerModal';

type CallActivityRouteProp = RouteProp<RootStackParamList, 'CallActivity'>;
type CallActivityNavigationProp = StackNavigationProp<RootStackParamList, 'CallActivity'>;

const ENQUIRY_TYPES = ['Hot', 'Warm', 'Cold'] as const;

const FormLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
    <Text className="text-sm text-gray-600 mb-1 font-medium">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
    </Text>
);

// Custom Modal component (same as BookingActivityScreen)
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

export default function CallActivityScreen({
    navigation,
    route,
}: {
    navigation: CallActivityNavigationProp;
    route: CallActivityRouteProp;
}) {
    const { customerName = 'Customer', customerPhone = '', customerId = '', quotationId = '', selectedVehicle = null } = route.params || {};

    const [phone, setPhone] = useState(customerPhone || '');
    const [phoneOptions, setPhoneOptions] = useState<{ label: string, value: string }[]>(customerPhone ? [{ label: customerPhone, value: customerPhone }] : []);
    const [customerData, setCustomerData] = useState<any>(null);

    const [scheduleDateValue, setScheduleDateValue] = useState<Date | null>(null);
    const [scheduleTimeValue, setScheduleTimeValue] = useState<string>('');
    const [showSchedulePicker, setShowSchedulePicker] = useState(false);

    const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
    const timeFieldRef = React.useRef<View | null>(null);
    const [showPhoneModal, setShowPhoneModal] = useState(false);

    const [enquiryType, setEnquiryType] = useState('Hot');
    const [remarks, setRemarks] = useState('');
    const [showDiscardModal, setShowDiscardModal] = useState(false);
    const [discardReason, setDiscardReason] = useState('');

    // Validation errors
    const [dateError, setDateError] = useState('');
    const [timeError, setTimeError] = useState('');
    const [discardReasonError, setDiscardReasonError] = useState('');
    const [loadingCall, setLoadingCall] = useState(false);
    const [employeePhone, setEmployeePhone] = useState('');
    const toast = useToast();

    const openTimeDropdown = () => {
        if (!scheduleDateValue) return;
        setTimeDropdownOpen(true);
    };

    const handleClose = () => {
        navigation.goBack();
    };

    const handleCreateQuotation = () => {
        navigation.navigate('AddQuotation', { returnToPrevious: true });
    };

    const handleSave = async () => {
        if (!phone) {
            toast.error('Please select a customer number first');
            return;
        }

        if (!scheduleDateValue || !scheduleTimeValue) {
            toast.error('Please select follow-up date and time');
            return;
        }

        try {
            setLoadingCall(true);

            // Get current user info for employee field (like web project)
            const userPhone = await AsyncStorage.getItem('userPhone');
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

            // Format date and time for API
            const formattedDate = scheduleDateValue.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            // Create activity payload
            const activityData = {
                customerId: customerId,
                interactionType: 'Call Follow',
                enquiryType: enquiryType,
                remarks: remarks,
                followUpDate: formattedDate,
                followUpTime: scheduleTimeValue,
                scheduleDateAndTime: `${formattedDate} ${scheduleTimeValue}`,
                phone: phone,
                type: 'CallActivity',
                employee: employeeName,
                employeeName: employeeName,
                phone1: userPhone,
                phone2: phone,
                uniqueId: `CALL_${Date.now()}`,
                activityType: 'CallActivity',
                // Add quotation and vehicle data
                ...(quotationIdToUse && { quotationId: quotationIdToUse }),
                ...(vehicleToUse && { vehicle: vehicleToUse })
            };

            console.log('🔍 Saving call activity:', activityData);

            const activityResponse = await createCallActivity(activityData);

            if (activityResponse.data?.code === 200) {
                console.log('🔍 Call activity saved successfully');

                // Emit event for instant activity update
                const newActivity = {
                    ...activityData,
                    id: activityResponse.data?.response?.data?.id || Date.now().toString(),
                    createdAt: new Date().toISOString(),
                    activityType: 'Call Activity',
                    customerName: customerData?.name || customerName,
                };

                DeviceEventEmitter.emit('activityCreated', {
                    type: 'call',
                    activity: newActivity
                });

                toast.success('Call activity saved successfully');
                navigation.goBack();
            } else {
                toast.error(activityResponse.data?.message || 'Failed to save call activity');
            }
        } catch (error) {
            console.error('Error saving call activity:', error);
            toast.error('Something went wrong while saving the activity');
        } finally {
            setLoadingCall(false);
        }
    };

    const handleCallCustomer = async () => {
        if (!phone) {
            toast.error('Please select a customer number first');
            return;
        }

        const ePhone = await AsyncStorage.getItem('userPhone');
        if (!ePhone) {
            toast.error('Could not find your phone number. Please log in again.');
            return;
        }

        try {
            setLoadingCall(true);

            // First place the cloud call
            const callResponse = await placeCloudCall({
                phone1: ePhone,
                phone2: phone,
                customerId: customerId,
                type: 'CallActivity'
            });

            if (callResponse.data.code === 200) {
                toast.success('Call Initiated: TeleCMI is dialing your phone first.');

                // Also create follow-up activity if date and time are set
                if (scheduleDateValue && scheduleTimeValue) {
                    try {
                        const formattedDate = scheduleDateValue.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        });

                        // Get current user info for employee field (like web project)
                        const userPhone = await AsyncStorage.getItem('userPhone');
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

                        const activityData = {
                            customerId: customerId,
                            interactionType: 'Call Follow',
                            enquiryType: enquiryType,
                            remarks: remarks,
                            followUpDate: formattedDate,
                            followUpTime: scheduleTimeValue,
                            scheduleDateAndTime: `${formattedDate} ${scheduleTimeValue}`,
                            phone: phone,
                            type: 'CallActivity',
                            // Add missing fields from web project
                            employee: employeeName,
                            employeeName: employeeName,
                            phone1: userPhone,
                            phone2: phone,
                            uniqueId: `CALL_${Date.now()}`,
                            activityType: 'CallActivity',
                            // Add quotation and vehicle data
                            ...(quotationIdToUse && { quotationId: quotationIdToUse }),
                            ...(vehicleToUse && { vehicle: vehicleToUse })
                        };

                        console.log('🔍 Creating call follow-up activity:', activityData);

                        const activityResponse = await createCallActivity(activityData);

                        if (activityResponse.data?.code === 200) {
                            console.log('🔍 Call follow-up activity created successfully');

                            // Emit event for instant activity update
                            const newActivity = {
                                ...activityData,
                                id: activityResponse.data?.response?.data?.id || Date.now().toString(),
                                createdAt: new Date().toISOString(),
                                activityType: 'Call Activity',
                                customerName: customerData?.name || customerName,
                            };

                            DeviceEventEmitter.emit('activityCreated', {
                                type: 'call',
                                activity: newActivity
                            });
                        } else {
                            console.warn('⚠️ Failed to create follow-up activity:', activityResponse.data?.message);
                        }
                    } catch (activityError) {
                        console.warn('⚠️ Error creating follow-up activity:', activityError);
                        // Don't show error to user as call was already initiated
                    }
                }

                // Navigate back after a short delay to allow user to see the success message
                setTimeout(() => {
                    navigation.goBack();
                }, 2000);

            } else {
                toast.error(callResponse.data.message || 'Could not initiate bridge call.');
            }
        } catch (error) {
            console.error('Cloud Call Error:', error);
            toast.error('Something went wrong while placing the call.');
        } finally {
            setLoadingCall(false);
        }
    };

    const handleDiscard = async () => {
        setDiscardReasonError('');
        if (!discardReason.trim()) {
            setDiscardReasonError('Required');
            return;
        }

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

    React.useEffect(() => {
        const fetchPhones = async () => {
            if (customerPhone) {
                try {
                    const res = await getCustomerByPhoneNo(customerPhone);
                    const cust = res.data?.response?.data?.customers?.[0];
                    if (cust) {
                        setCustomerData(cust);
                        if (cust.contacts && Array.isArray(cust.contacts)) {
                            const numbers = cust.contacts.map((c: any) => c.phone).filter(Boolean);
                            const uniqueNumbers = [...new Set([customerPhone, ...numbers])];
                            setPhoneOptions(uniqueNumbers.map(ph => ({ label: ph, value: ph })));
                        }
                    }
                } catch { }
            }
        };
        fetchPhones();
    }, [customerPhone]);

    const formatDate = (value?: Date | string): string => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    const formatTime = (value?: Date | string | { time?: string }): string => {
        if (!value) return '';
        if (typeof value === 'object' && 'time' in value) {
            return value.time || '';
        }
        const date = new Date(value as any);
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white border-b border-gray-100 px-4 py-4 flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={handleClose} className="mr-3">
                        <ChevronLeft size={24} color={COLORS.gray[900]} />
                    </TouchableOpacity>
                    <Text className="text-gray-900 text-lg font-bold">Call Activity</Text>
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

                        {/* Phone Number dropdown */}
                        <View className="mb-4">
                            <FormLabel label="Number" required />
                            <TouchableOpacity
                                onPress={() => setShowPhoneModal(true)}
                                disabled={phoneOptions.length === 0}
                                className={`h-12 bg-white border rounded-lg px-3 flex-row items-center justify-between ${phoneOptions.length === 0 ? 'bg-gray-100 border-gray-200' : 'border-gray-300'}`}
                            >
                                <Text className={`flex-1 ${phone ? 'text-gray-800' : 'text-gray-500'}`}>
                                    {phone || 'Select Number'}
                                </Text>
                                <ChevronRight size={16} color={COLORS.gray[400]} />
                            </TouchableOpacity>
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
                                    onPressIn={() => {
                                        setDateError('');
                                        setScheduleDateValue(scheduleDateValue || new Date());
                                        setShowSchedulePicker(true);
                                    }}
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
                            {timeError ? <Text className="text-xs text-red-600 mt-1">{timeError}</Text> : null}
                        </View>

                        {/* Enquiry Type */}
                        <View className="mb-4">
                            <FormLabel label="Enquiry Type" required />
                            <View className="mt-1 flex-row gap-2">
                                {ENQUIRY_TYPES.map((t: string) => (
                                    <TouchableOpacity
                                        key={t}
                                        onPress={() => setEnquiryType(t)}
                                        className={`flex-1 h-11 rounded-lg items-center justify-center border ${enquiryType === t
                                            ? 'bg-teal-600 border-teal-600'
                                            : 'bg-white border-gray-300'
                                            }`}
                                    >
                                        <Text className={`text-sm font-semibold ${enquiryType === t ? 'text-white' : 'text-gray-700'}`}>
                                            {t}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Action buttons */}
                        <View className="mb-4 flex-row justify-between">
                            <Button title="Create Quotation" variant="outline" className="flex-1 mr-2" onPress={handleCreateQuotation} />
                            <Button
                                title={loadingCall ? "Calling..." : "Call Customer"}
                                className="flex-1"
                                disabled={loadingCall}
                                onPress={handleCallCustomer}
                            />
                        </View>

                        {/* Remarks */}
                        <View className="mb-4">
                            <FormLabel label="Remarks" />
                            <TextInput
                                placeholder="Enter call remarks..."
                                value={remarks}
                                onChangeText={setRemarks}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                className="h-24 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                            />
                        </View>

                        {/* Discard Call Link */}
                        <TouchableOpacity onPress={() => setShowDiscardModal(true)} className="mb-4">
                            <Text className="text-teal-600 text-sm font-medium">Discard Call Followup</Text>
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
                <Button title="Save" className="flex-1" onPress={handleSave} />
            </View>

            {/* Discard Modal */}
            <Modal visible={showDiscardModal} transparent animationType="fade" onRequestClose={() => setShowDiscardModal(false)}>
                <View className="flex-1 bg-black/40 justify-center px-4">
                    <View className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                        {/* Modal Header */}
                        <View className="bg-gray-600 px-4 py-3 flex-row items-center justify-between">
                            <Text className="text-white text-base font-bold">Discard Call</Text>
                            <TouchableOpacity onPress={() => setShowDiscardModal(false)} className="p-1 hover:bg-gray-700 rounded">
                                <X size={24} color="white" />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Content */}
                        <View className="p-4 bg-gray-50">
                            <Text className="text-gray-700 text-sm font-medium mb-3">Are you sure you want to discard this call record?</Text>

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

            {/* Schedule Date Modal */}
            <Modal visible={showSchedulePicker} transparent animationType="fade" onRequestClose={() => setShowSchedulePicker(false)}>
                <View className="flex-1 bg-black/40 items-center justify-center px-4">
                    <View className="bg-white rounded-2xl p-4 w-full max-w-md">
                        <Text className="text-gray-900 font-bold mb-3">Select Schedule Date</Text>
                        <RNCalendar
                            current={scheduleDateValue ? scheduleDateValue.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                            minDate={new Date().toISOString().split('T')[0]}
                            onDayPress={(day: any) => {
                                const date = new Date(day.dateString);
                                setScheduleDateValue(date);
                                setShowSchedulePicker(false);
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

            {/* Phone Number Modal */}
            <CustomModal visible={showPhoneModal} onClose={() => setShowPhoneModal(false)}>
                <View className="p-4 border-b border-gray-200">
                    <Text className="text-lg font-semibold">Select Phone Number</Text>
                </View>
                <ScrollView>
                    {phoneOptions.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            onPress={() => {
                                setPhone(option.value);
                                setShowPhoneModal(false);
                            }}
                            className="p-4 border-b border-gray-100"
                        >
                            <Text className={`text-gray-800 ${phone === option.value ? 'font-bold text-teal-600' : ''}`}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <TouchableOpacity onPress={() => setShowPhoneModal(false)} className="p-4 border-t border-gray-200">
                    <Text className="text-center text-gray-600">Cancel</Text>
                </TouchableOpacity>
            </CustomModal>
        </SafeAreaView>
    );
}
