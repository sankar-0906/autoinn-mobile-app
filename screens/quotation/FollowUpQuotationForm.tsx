import React, { useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    RefreshControl,
    Modal,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { Calendar, Clock, ChevronLeft } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { getCustomerByPhoneNo, getCurrentUser } from '../../src/api';
import { useToast } from '../../src/ToastContext';

type FollowUpQuotationFormRouteProp = RouteProp<RootStackParamList, 'FollowUpQuotationForm'>;
type FollowUpQuotationFormNavigationProp = StackNavigationProp<RootStackParamList, 'FollowUpQuotationForm'>;

const FormLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
    <Text className="text-sm text-gray-600 mb-1.5 font-medium">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
    </Text>
);

const STATUS_STEPS = ['Quoted', 'Booked', 'Sold'];

export default function FollowUpQuotationForm({ navigation, route }: { navigation: FollowUpQuotationFormNavigationProp; route: FollowUpQuotationFormRouteProp }) {
    const { customerName: initialCustomerName, customerPhone: initialCustomerPhone, locality: initialLocality, customerType: initialCustomerType, gender: passedGender } = route.params;

    const toast = useToast();

    // editable values
    const [phone, setPhone] = useState(initialCustomerPhone);
    const [name, setName] = useState(initialCustomerName);
    const [locality, setLocality] = useState(initialLocality);
    const [customerType, setCustomerType] = useState(initialCustomerType);
    const [gender, setGender] = useState(passedGender || 'male');
    const [branch, setBranch] = useState('');
    const [executiveName, setExecutiveName] = useState('');
    const [leadSource, setLeadSource] = useState('');
    const [testDrive, setTestDrive] = useState('yes');
    const [status, setStatus] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [showSchedulePicker, setShowSchedulePicker] = useState(false);
    const [showExpectedPicker, setShowExpectedPicker] = useState(false);
    const [scheduleDateValue, setScheduleDateValue] = useState<Date | null>(null);
    const [scheduleTimeValue, setScheduleTimeValue] = useState<string>('');
    const [expectedDateValue, setExpectedDateValue] = useState<Date | null>(null);
    const [remarks, setRemarks] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const formatDate = (value?: Date | string): string => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    const formatTime = (value?: Date | string | { time?: string }): string => {
        if (!value) return '-';
        if (typeof value === 'object' && 'time' in value) {
            return value.time || '-';
        }
        const date = new Date(value as any);
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // fetch customer data if route params didn't provide locality/gender
    React.useEffect(() => {
        const lookup = async () => {
            if (phone && phone.replace(/\D/g, '').length === 10) {
                try {
                    const res = await getCustomerByPhoneNo(phone);
                    const cust = res.data?.response?.data?.customers?.[0];
                    if (cust) {
                        if (cust.name) setName(cust.name);
                        if (cust.location) setLocality(cust.location);
                        if (cust.type) setCustomerType(cust.type);
                        if (cust.gender) setGender(cust.gender);
                    }
                } catch {
                    // ignore
                }
            }
        };
        lookup();
    }, [phone]);

    // pull branch & executive from current user profile if available
    React.useEffect(() => {
        getCurrentUser()
            .then(res => {
                const u = res.data?.response?.data;
                if (u) {
                    if (u.name) setExecutiveName(u.name);
                    const b = u.branch || u.profile?.branch;
                    let name = '';
                    if (Array.isArray(b) && b.length > 0) {
                        name = b[0]?.name || '';
                    } else if (b && b.name) {
                        name = b.name;
                    }
                    if (name) setBranch(name);
                }
            })
            .catch(() => { });
    }, []);

    const validate = () => {
        const errors: Record<string, string> = {};
        if (!branch.trim()) errors.branch = 'Branch is required';
        if (!executiveName.trim()) errors.salesExecutive = 'Sales Executive is required';
        if (!phone || phone.replace(/\D/g, '').length !== 10) errors.customerPhone = 'Valid phone is required';
        if (!name.trim()) errors.customerName = 'Customer Name is required';
        if (!gender) errors.gender = 'Gender is required';
        if (!scheduleDateValue) errors.scheduleDate = 'Schedule date is required';
        if (scheduleDateValue && !scheduleTimeValue) errors.scheduleTime = 'Schedule time required';
        if (!leadSource.trim()) errors.leadSource = 'Lead Source is required';
        if (!expectedDateValue) errors.expectedDate = 'Expected purchase date is required';
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white border-b border-gray-100 px-4 py-4 flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2">
                        <ChevronLeft size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text className="text-gray-900 text-lg font-bold text-xl">Quotation</Text>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <Text className="text-gray-900 font-bold text-base mb-4 border-b border-gray-50 pb-2">Customer Information</Text>

                        <View className="mb-4">
                            <FormLabel label="Branch" required />
                            <TextInput
                                value={branch}
                                onChangeText={(v) => { setBranch(v); setFieldErrors(prev => ({ ...prev, branch: '' })); }}
                                className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800"
                            />
                            {fieldErrors.branch && <Text className="text-xs text-red-600 mt-1">⚠ {fieldErrors.branch}</Text>}
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Sales Executive" required />
                            <TextInput
                                value={executiveName}
                                onChangeText={(v) => { setExecutiveName(v); setFieldErrors(prev => ({ ...prev, salesExecutive: '' })); }}
                                className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800"
                            />
                            {fieldErrors.salesExecutive && <Text className="text-xs text-red-600 mt-1">⚠ {fieldErrors.salesExecutive}</Text>}
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Customer Type" />
                            <TextInput value={customerType || '-'} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Locality" />
                            <TextInput value={locality || '-'} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 text-gray-800" />
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Customer Phone" required />
                            <View className="flex-row gap-2">
                                <View className="h-12 w-16 bg-gray-100 border border-gray-200 rounded-xl items-center justify-center">
                                    <Text className="text-gray-700">+91</Text>
                                </View>
                                <TextInput
                                    value={phone}
                                    onChangeText={(v) => { setPhone(v); setFieldErrors(prev => ({ ...prev, customerPhone: '' })); }}
                                    keyboardType="phone-pad"
                                    className="flex-1 h-12 bg-white border border-gray-300 rounded-xl px-4 text-gray-800"
                                />
                            </View>
                            {fieldErrors.customerPhone && <Text className="text-xs text-red-600 mt-1">⚠ {fieldErrors.customerPhone}</Text>}
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Customer Name" required />
                            <TextInput
                                value={name}
                                onChangeText={(v) => { setName(v); setFieldErrors(prev => ({ ...prev, customerName: '' })); }}
                                className="h-12 bg-white border border-gray-300 rounded-xl px-4 text-gray-800"
                            />
                            {fieldErrors.customerName && <Text className="text-xs text-red-600 mt-1">⚠ {fieldErrors.customerName}</Text>}
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Gender" required />
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    onPress={() => { setGender('male'); setFieldErrors(prev => ({ ...prev, gender: '' })); }}
                                    className={`flex-1 h-11 rounded-lg items-center justify-center border ${gender === 'male' ? 'bg-teal-600 border-teal-600' : 'bg-gray-100 border-gray-300'}`}
                                >
                                    <Text className={gender === 'male' ? 'text-white font-semibold' : 'text-gray-700 font-medium'}>Male</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => { setGender('female'); setFieldErrors(prev => ({ ...prev, gender: '' })); }}
                                    className={`flex-1 h-11 rounded-lg items-center justify-center border ${gender === 'female' ? 'bg-teal-600 border-teal-600' : 'bg-gray-100 border-gray-300'}`}
                                >
                                    <Text className={gender === 'female' ? 'text-white font-semibold' : 'text-gray-700 font-medium'}>Female</Text>
                                </TouchableOpacity>
                            </View>
                            {fieldErrors.gender && <Text className="text-xs text-red-600 mt-1">⚠ {fieldErrors.gender}</Text>}
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Schedule Follow-Up Date" required />
                            <View className="relative">
                                <TextInput value={formatDate(scheduleDateValue || undefined)} editable={false} className="h-12 bg-gray-100 border border-gray-300 rounded-xl px-4 pr-12 text-gray-800" />
                                <TouchableOpacity
                                    onPressIn={() => {
                                        setScheduleDateValue(scheduleDateValue || new Date());
                                        setShowSchedulePicker(true);
                                    }}
                                    className="absolute right-4 top-3.5"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Calendar size={18} color={COLORS.gray[400]} />
                                </TouchableOpacity>
                            </View>
                            {fieldErrors.scheduleDate && <Text className="text-xs text-red-600 mt-1">⚠ {fieldErrors.scheduleDate}</Text>}
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Schedule Follow-Up Time" required />
                            <View className="relative">
                                <TextInput
                                    value={scheduleTimeValue || formatTime(scheduleDateValue || undefined)}
                                    editable={!!scheduleDateValue}
                                    onChangeText={(v) => { setScheduleTimeValue(v); setFieldErrors(prev => ({ ...prev, scheduleTime: '' })); }}
                                    placeholder="HH:MM"
                                    className={`h-12 border border-gray-300 rounded-xl px-4 pr-12 text-gray-800 ${scheduleDateValue ? 'bg-white' : 'bg-gray-100'
                                        }`}
                                />
                                <View className="absolute right-4 top-3.5">
                                    <Clock size={18} color={COLORS.gray[400]} />
                                </View>
                            </View>
                            {!scheduleDateValue && (
                                <Text className="text-xs text-gray-500 mt-1">Set Schedule Follow-Up Date first</Text>
                            )}
                            {fieldErrors.scheduleTime && <Text className="text-xs text-red-600 mt-1">⚠ {fieldErrors.scheduleTime}</Text>}
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Lead Source" required />
                            <TextInput
                                value={leadSource}
                                onChangeText={setLeadSource}
                                className="h-12 bg-white border border-gray-300 rounded-xl px-4 text-gray-800"
                            />
                            {fieldErrors.leadSource && <Text className="text-xs text-red-600 mt-1">⚠ {fieldErrors.leadSource}</Text>}
                        </View>

                        <View className="mb-4">
                            <FormLabel label="Expected Date of Purchase" required />
                            <View className="relative">
                                <TextInput
                                    value={formatDate(expectedDateValue || undefined)}
                                    editable={!!scheduleDateValue}
                                    className={`h-12 border border-gray-300 rounded-xl px-4 pr-12 text-gray-800 ${scheduleDateValue ? 'bg-white' : 'bg-gray-100'
                                        }`}
                                />
                                <TouchableOpacity
                                    disabled={!scheduleDateValue}
                                    onPressIn={() => {
                                        if (!scheduleDateValue) return;
                                        setExpectedDateValue(expectedDateValue || new Date());
                                        setFieldErrors(prev => ({ ...prev, expectedDate: '' }));
                                        setShowExpectedPicker(true);
                                    }}
                                    className="absolute right-4 top-3.5"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Calendar size={18} color={!scheduleDateValue ? COLORS.gray[400] : COLORS.gray[400]} />
                                </TouchableOpacity>
                            </View>
                            {!scheduleDateValue && (
                                <Text className="text-xs text-gray-500 mt-1">Set Schedule Follow-Up Date first</Text>
                            )}
                            {fieldErrors.expectedDate && <Text className="text-xs text-red-600 mt-1">⚠ {fieldErrors.expectedDate}</Text>}
                        </View>

                        <View className="mb-2">
                            <FormLabel label="Test Drive Taken" required />
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    onPress={() => setTestDrive('yes')}
                                    className={`flex-1 h-11 rounded-lg items-center justify-center border ${testDrive === 'yes' ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300'}`}
                                >
                                    <Text className={testDrive === 'yes' ? 'text-white font-semibold' : 'text-gray-700 font-medium'}>Yes</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setTestDrive('no')}
                                    className={`flex-1 h-11 rounded-lg items-center justify-center border ${testDrive === 'no' ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300'}`}
                                >
                                    <Text className={testDrive === 'no' ? 'text-white font-semibold' : 'text-gray-700 font-medium'}>No</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <View className="flex-row items-center justify-between mb-4 border-b border-gray-50 pb-2">
                            <Text className="text-gray-900 font-bold text-base">Vehicle Information</Text>
                        </View>

                        <TouchableOpacity
                            onPress={() =>
                                navigation.navigate('SelectModel', {
                                    returnTo: 'FollowUpQuotationForm',
                                    viewMode: false,
                                    viewVehicleData: null,
                                })
                            }
                            className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3"
                            activeOpacity={0.7}
                        >
                            <Text className="text-blue-800 font-semibold text-sm">Select Vehicle</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                        <Text className="text-gray-900 font-bold text-base mb-4 border-b border-gray-50 pb-2">Status</Text>

                        <View className="flex-row justify-between mb-3 px-2">
                            {STATUS_STEPS.map((label, index) => (
                                <TouchableOpacity key={label} className="items-center flex-1" disabled>
                                    <View
                                        className={`w-4 h-4 rounded-full z-10 ${status >= index ? 'bg-teal-600' : 'bg-gray-200'}`}
                                    />
                                    <Text className={`text-xs mt-2 font-bold ${status >= index ? 'text-teal-600' : 'text-gray-400'}`}>
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <View className="absolute top-2 left-0 right-0 h-0.5 bg-gray-100 mx-10 -z-10" />
                        </View>

                        <View className="mx-2 mb-2">
                            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <View
                                    className="h-2 bg-teal-600 rounded-full"
                                    style={{ width: `${(status / 2) * 100}%` }}
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

            <View className="bg-white border-t border-gray-100 p-4 flex-row gap-3">
                <Button title="Back" variant="outline" className="flex-1" onPress={() => navigation.goBack()} />
                <Button
                    title="Save"
                    className="flex-1"
                    onPress={() => {
                        if (validate()) {
                            toast.success('Form validation passed (save logic not implemented)');
                        }
                    }}
                />
            </View>
            <Modal visible={showSchedulePicker} transparent animationType="fade" onRequestClose={() => setShowSchedulePicker(false)}>
                <View className="flex-1 bg-black/40 items-center justify-center px-4">
                    <View className="bg-white rounded-2xl p-4 w-full max-w-md">
                        <Text className="text-gray-900 font-bold mb-3">Select Schedule Date</Text>
                        <RNCalendar
                            current={scheduleDateValue ? scheduleDateValue.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                            minDate={new Date().toISOString().split('T')[0]}
                            onDayPress={(day) => {
                                const date = new Date(day.dateString);
                                setScheduleDateValue(date);
                                // reset time to default string from date
                                setScheduleTimeValue(formatTime(date));
                                setFieldErrors(prev => ({ ...prev, scheduleDate: '', scheduleTime: '', expectedDate: '' }));
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

            <Modal visible={showExpectedPicker} transparent animationType="fade" onRequestClose={() => setShowExpectedPicker(false)}>
                <View className="flex-1 bg-black/40 items-center justify-center px-4">
                    <View className="bg-white rounded-2xl p-4 w-full max-w-md">
                        <Text className="text-gray-900 font-bold mb-3">Select Expected Purchase Date</Text>
                        <RNCalendar
                            current={expectedDateValue ? expectedDateValue.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                            minDate={new Date().toISOString().split('T')[0]}
                            onDayPress={(day) => {
                                const date = new Date(day.dateString);
                                setExpectedDateValue(date);
                                setShowExpectedPicker(false);
                            }}
                            theme={{
                                todayTextColor: COLORS.primary,
                                selectedDayBackgroundColor: COLORS.primary,
                                selectedDayTextColor: '#fff',
                                arrowColor: COLORS.primary,
                                textSectionTitleColor: '#6b7280',
                            }}
                            markedDates={
                                expectedDateValue
                                    ? {
                                        [expectedDateValue.toISOString().split('T')[0]]: {
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

        </SafeAreaView>
    );
}
