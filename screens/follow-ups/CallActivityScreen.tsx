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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dimensions } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { ChevronLeft, ChevronRight, Calendar, Clock, X, ChevronDown } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { getCustomerByPhoneNo, placeCloudCall } from '../../src/api';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { useToast } from '../../src/ToastContext';

type CallActivityRouteProp = RouteProp<RootStackParamList, 'CallActivity'>;
type CallActivityNavigationProp = StackNavigationProp<RootStackParamList, 'CallActivity'>;

const FormLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
    <Text className="text-sm text-gray-600 mb-1 font-medium">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
    </Text>
);

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
                className={`rounded-lg px-4 h-12 flex-row items-center justify-between border ${disabled ? 'bg-gray-100 border-gray-200' : error ? 'bg-white border-red-500' : 'bg-white border-gray-300'}`}
            >
                <Text className={selectedLabel ? 'text-gray-900' : 'text-gray-500'}>
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
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 220 }}>
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
                    </ScrollView>
                </View>
            )}
            {open && <View style={{ height: listHeight }} />}
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
    const { customerName = 'Customer', customerPhone = '', customerId = '' } = route.params || {};

    const [phone, setPhone] = useState(customerPhone || '');
    const [phoneOptions, setPhoneOptions] = useState<{ label: string, value: string }[]>(customerPhone ? [{ label: customerPhone, value: customerPhone }] : []);
    const [customerData, setCustomerData] = useState<any>(null);

    const [scheduleDateValue, setScheduleDateValue] = useState<Date | null>(null);
    const [scheduleTimeValue, setScheduleTimeValue] = useState<string>('');
    const [showSchedulePicker, setShowSchedulePicker] = useState(false);

    const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
    const [selectedHour, setSelectedHour] = useState<number | null>(null);
    const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
    const timeFieldRef = React.useRef<View | null>(null);
    const [timeDropdownLayout, setTimeDropdownLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

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

    const buildHourOptions = () => {
        const now = new Date();
        const currentHour = now.getHours();
        const start = currentHour === 0 ? 1 : currentHour;
        return Array.from({ length: 23 - start }, (_, idx) => start + idx);
    };

    const minuteOptions = [15, 30, 45];

    const openTimeDropdown = () => {
        if (!scheduleDateValue) return;
        if (timeFieldRef.current && typeof (timeFieldRef.current as any).measureInWindow === 'function') {
            (timeFieldRef.current as any).measureInWindow((x: number, y: number, width: number, height: number) => {
                setTimeDropdownLayout({ x, y, width, height });
                setTimeDropdownOpen(true);
            });
        } else {
            setTimeDropdownOpen(true);
        }
    };

    const handleClose = () => {
        navigation.goBack();
    };

    const handleCreateQuotation = () => {
        navigation.navigate('FollowUpQuotationForm', {
            customerName: customerName || customerData?.name || '',
            customerPhone: phone || customerPhone || customerData?.contacts?.[0]?.phone || '',
            locality: customerData?.address?.locality || customerData?.locality || customerData?.location || '',
            customerType: customerData?.type || '',
            gender: customerData?.gender || 'male'
        });
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
            const response = await placeCloudCall({
                phone1: ePhone,
                phone2: phone,
                customerId: customerId,
                type: 'CallActivity'
            });

            if (response.data.code === 200) {
                toast.success('Call Initiated: TeleCMI is dialing your phone first.');
            } else {
                toast.error(response.data.message || 'Could not initiate bridge call.');
            }
        } catch (error) {
            console.error('Cloud Call Error:', error);
            toast.error('Something went wrong while placing the call.');
        } finally {
            setLoadingCall(false);
        }
    };

    const handleDiscard = () => {
        setDiscardReasonError('');
        if (!discardReason.trim()) {
            setDiscardReasonError('Required');
            return;
        }
        toast.success('Call activity discarded successfully');
        setShowDiscardModal(false);
        navigation.goBack();
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
                                value={customerName}
                                editable={false}
                                className="h-12 bg-gray-100 border border-gray-200 rounded-lg px-3 text-gray-800"
                            />
                        </View>

                        {/* Phone Number dropdown */}
                        <View className="mb-4">
                            <FormLabel label="Number" required />
                            <SelectField
                                placeholder="Select Number"
                                value={phone}
                                options={phoneOptions}
                                onSelect={(val) => setPhone(val)}
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
                            <TextInput
                                value={enquiryType}
                                editable={false}
                                placeholder="Enquiry Type"
                                className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                            />
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
                <Button title="Save" className="flex-1" onPress={handleCallCustomer} />
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

                                        // Format hour based on AM/PM logic matching formatTime
                                        const period = selectedHour < 12 ? 'AM' : 'PM';
                                        const displayH = selectedHour === 0 ? 12 : selectedHour > 12 ? selectedHour - 12 : selectedHour;
                                        const displayM = String(selectedMinute).padStart(2, '0');
                                        const label = `${String(displayH).padStart(2, '0')}:${displayM} ${period}`;

                                        setScheduleTimeValue(label);
                                        setTimeError('');
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
