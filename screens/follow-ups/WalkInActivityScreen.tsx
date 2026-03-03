import React, { useState } from 'react';
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
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { ChevronLeft, ChevronRight, Calendar, Clock, X, ChevronDown } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { Dimensions } from 'react-native';
import { getCustomerByPhoneNo } from '../../src/api';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { useToast } from '../../src/ToastContext';

export const SelectField = ({
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
                            className={`px-4 py-3 border-b border-gray-50 flex-row items-center justify-between ${value === opt.value ? 'bg-teal-50' : ''}`}
                        >
                            <Text className={`text-sm ${value === opt.value ? 'text-teal-700 font-bold' : 'text-gray-700'}`}>
                                {opt.label}
                            </Text>
                            {value === opt.value && (
                                <View className="w-2 h-2 rounded-full bg-teal-600" />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            {open && <View style={{ height: listHeight }} />}
        </View>
    );
};

type WalkInActivityRouteProp = RouteProp<RootStackParamList, 'WalkInActivity'>;
type WalkInActivityNavigationProp = StackNavigationProp<RootStackParamList, 'WalkInActivity'>;

const FormLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
    <Text className="text-sm text-gray-600 mb-1 font-medium">
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
    const { customerId: initialCustomerId = '', customerPhone = '' } = (route.params || {}) as any;
    const [customerName, setCustomerName] = useState((route.params as any)?.customerName || 'Customer');

    const [phone, setPhone] = useState(customerPhone || '');
    const [phoneOptions, setPhoneOptions] = useState<{ label: string, value: string }[]>(
        customerPhone ? [{ label: customerPhone, value: customerPhone }] : []
    );
    const [loadingPhones, setLoadingPhones] = useState(false);

    const [scheduleDateValue, setScheduleDateValue] = useState<Date | null>(null);
    const [scheduleTimeValue, setScheduleTimeValue] = useState<string>('');
    const [showSchedulePicker, setShowSchedulePicker] = useState(false);

    const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
    const [selectedHour, setSelectedHour] = useState<number | null>(null);
    const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
    const timeFieldRef = React.useRef<View | null>(null);
    const [timeDropdownLayout, setTimeDropdownLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    const [enquiryType, setEnquiryType] = useState('Hot');
    const [interactionType, setInteractionType] = useState('Walk- In');
    const [remarks, setRemarks] = useState('');
    const [showDiscardModal, setShowDiscardModal] = useState(false);
    const [discardReason, setDiscardReason] = useState('');

    // Validation errors
    const [dateError, setDateError] = useState('');
    const [timeError, setTimeError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [discardReasonError, setDiscardReasonError] = useState('');
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

    React.useEffect(() => {
        const fetchPhones = async () => {
            if (!customerPhone) return;
            setLoadingPhones(true);
            try {
                const res = await getCustomerByPhoneNo(customerPhone);
                const data = res?.data?.response?.data || res?.data?.data;
                const customers = Array.isArray(data?.customers) ? data.customers :
                    Array.isArray(data?.customer) ? data.customer :
                        data ? [data] : [];

                if (customers.length > 0) {
                    const cust = customers[0];
                    setCustomerName(cust.name || 'Customer');

                    const numbers = new Set<string>();
                    if (cust.phone) numbers.add(cust.phone);
                    if (cust.alternatePhone) numbers.add(cust.alternatePhone);
                    if (cust.whatsappNumber) numbers.add(cust.whatsappNumber);

                    const opts = Array.from(numbers).map(num => ({
                        label: num,
                        value: num
                    }));

                    if (opts.length > 0) {
                        setPhoneOptions(opts);
                        if (!opts.find(o => o.value === phone)) {
                            setPhone(opts[0].value);
                        }
                    }
                }
            } catch (e) {
                console.log('Error fetching customer phone numbers:', e);
            } finally {
                setLoadingPhones(false);
            }
        };
        fetchPhones();
    }, [customerPhone]);

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

    const handleCreate = () => {
        setDateError('');
        setTimeError('');
        setPhoneError('');

        let ok = true;
        if (!phone) { setPhoneError('Required'); ok = false; }
        if (!scheduleDateValue) { setDateError('Required'); ok = false; }
        if (!scheduleTimeValue) { setTimeError('Required'); ok = false; }

        if (!ok) return;

        toast.success('Walk-In activity created successfully');
        navigation.goBack();
    };

    const handleDiscard = () => {
        setDiscardReasonError('');
        if (!discardReason.trim()) {
            setDiscardReasonError('Required');
            return;
        }
        toast.success('Walk-In activity discarded successfully');
        setShowDiscardModal(false);
        navigation.goBack();
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
                                value={customerName}
                                editable={false}
                                className="h-12 bg-gray-100 border border-gray-200 rounded-lg px-3 text-gray-800"
                            />
                        </View>

                        {/* Phone Number dropdown */}
                        <View className="mb-4">
                            <FormLabel label="Number" required />
                            <SelectField
                                placeholder="Select number"
                                value={phone}
                                options={phoneOptions}
                                onSelect={(val) => {
                                    setPhone(val);
                                    setPhoneError('');
                                }}
                                disabled={phoneOptions.length <= 1}
                                error={phoneError}
                            />
                            {loadingPhones && <Text className="text-xs text-gray-400 mt-1">Loading numbers...</Text>}
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
                            <FormLabel label="Enquiry Type" required />
                            <View className="flex-row gap-2">
                                {['Hot', 'Warm', 'Cold'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => setEnquiryType(type)}
                                        className={`flex-1 py-2 rounded-lg border ${enquiryType === type
                                            ? 'bg-teal-600 border-teal-600'
                                            : 'bg-white border-gray-300'
                                            }`}
                                    >
                                        <Text
                                            className={`text-center text-sm font-medium ${enquiryType === type ? 'text-white' : 'text-gray-700'
                                                }`}
                                        >
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Interaction Type */}
                        <View className="mb-4" style={{ zIndex: 50 }}>
                            <FormLabel label="Interaction Type" required />
                            <SelectField
                                placeholder="Select type"
                                value={interactionType}
                                options={[
                                    { label: 'Walk- In', value: 'Walk- In' },
                                    { label: 'Call', value: 'Call' },
                                    { label: 'Message', value: 'Message' },
                                ]}
                                onSelect={(val) => {
                                    setInteractionType(val);
                                }}
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
                                const localDate = new Date(day.timestamp + new Date().getTimezoneOffset() * 60000);
                                setScheduleDateValue(localDate);
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
