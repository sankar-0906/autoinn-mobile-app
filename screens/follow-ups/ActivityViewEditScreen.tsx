import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Modal,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Calendar, Clock, X, ChevronDown, Eye } from 'lucide-react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { getActivityById, updateActivity, ENDPOINT } from '../../src/api';
import moment from 'moment';

type ActivityViewEditRouteProp = RouteProp<RootStackParamList, 'ActivityViewEdit'>;
type ActivityViewEditNavigationProp = StackNavigationProp<RootStackParamList, 'ActivityViewEdit'>;

const ENQUIRY_TYPES = ['Hot', 'Warm', 'Cold'] as const;
const minuteOptions = [0, 15, 30, 45];

const buildHourOptions = () => {
    return Array.from({ length: 24 }, (_, idx) => idx);
};

export default function ActivityViewEditScreen() {
    const navigation = useNavigation<ActivityViewEditNavigationProp>();
    const route = useRoute<ActivityViewEditRouteProp>();
    const { mode, activityId } = route.params;

    const [loading, setLoading] = useState(true);
    const [activityDetail, setActivityDetail] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');

    // Editable fields
    const [enquiryType, setEnquiryType] = useState('Hot');
    const [followupDate, setFollowupDate] = useState('');
    const [followupTime, setFollowupTime] = useState('');
    const [remarks, setRemarks] = useState('');

    // Form errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    // UI state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
    const [selectedHour, setSelectedHour] = useState<number | null>(null);
    const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
    const timeFieldRef = useRef<View | null>(null);
    const [timeDropdownLayout, setTimeDropdownLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getActivityById(activityId);
            const data = res.data?.response?.data;
            if (data) {
                setActivityDetail(data);
                setEnquiryType(data.enquiryType || 'Hot');
                setRemarks(data.remarks || '');

                if (data.scheduleDateAndTime) {
                    const m = moment.utc(data.scheduleDateAndTime);
                    setFollowupDate(m.format('DD-MM-YYYY'));
                    setFollowupTime(m.format('HH:mm'));
                    setSelectedHour(m.hour());
                    setSelectedMinute(m.minute());
                } else {
                    setFollowupDate(data.scheduleDate || '');
                    setFollowupTime(data.scheduleTime || '');
                    if (data.scheduleTime) {
                        const [h, m] = data.scheduleTime.split(':');
                        setSelectedHour(parseInt(h));
                        setSelectedMinute(parseInt(m));
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching activity:', err);
            Alert.alert('Error', 'Failed to load activity details');
        } finally {
            setLoading(false);
        }
    }, [activityId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!followupDate) newErrors.followupDate = 'Date is required';
        if (!followupTime) newErrors.followupTime = 'Time is required';

        if (followupDate) {
            const selected = moment(followupDate, 'DD-MM-YYYY');
            if (selected.isBefore(moment(), 'day')) {
                newErrors.followupDate = 'Past date not allowed';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            const combinedDateTime = moment(`${followupDate} ${followupTime}`, 'DD-MM-YYYY HH:mm').utc().toISOString();
            const payload = {
                ...activityDetail,
                enquiryType,
                remarks,
                scheduleDate: followupDate,
                scheduleTime: followupTime,
                scheduleDateAndTime: combinedDateTime,
            };

            await updateActivity(activityId, payload);
            Alert.alert('Success', 'Activity updated successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (err) {
            console.error('Error updating activity:', err);
            Alert.alert('Error', 'Failed to update activity');
        }
    };

    const openTimeDropdown = () => {
        if (timeFieldRef.current) {
            timeFieldRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
                setTimeDropdownLayout({ x, y, width, height });
                setTimeDropdownOpen(true);
            });
        }
    };

    const toCalendarDate = (val: string) => {
        if (!val) return '';
        const m = moment(val, 'DD-MM-YYYY');
        return m.isValid() ? m.format('YYYY-MM-DD') : '';
    };

    const FormLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
        <Text className="text-sm text-gray-600 mb-1.5 font-medium">
            {label}
            {required && <Text className="text-red-500"> *</Text>}
        </Text>
    );

    const getAssociatedDocuments = () => {
        if (!activityDetail) return [];
        const docs: any[] = [];
        if (activityDetail.quotation) {
            const q = activityDetail.quotation;
            if (q.pdfWithBrochure) docs.push({ type: 'PDF WITH BROCHURE', id: q.quotationId, status: 'Generated', url: q.pdfWithBrochure });
            if (q.pdfWithOutBrochure) docs.push({ type: 'PDF WITHOUT BROCHURE', id: q.quotationId, status: 'Generated', url: q.pdfWithOutBrochure });
        }
        if (activityDetail.booking) {
            const b = activityDetail.booking;
            if (b.authentication?.beforeVerification) docs.push({ type: 'BEFORE VERIFICATION', id: b.bookingId, status: 'Generated', url: b.authentication.beforeVerification });
            if (b.authentication?.afterVerification) docs.push({ type: 'AFTER VERIFICATION', id: b.bookingId, status: 'Generated', url: b.authentication.afterVerification });
        }
        return docs;
    };

    const handleViewDocument = (url: string) => {
        if (!url) return;
        const absoluteUrl = url.startsWith('http') ? url : (ENDPOINT.endsWith('/') ? ENDPOINT : `${ENDPOINT}/`) + (url.startsWith('/') ? url.slice(1) : url);
        Alert.alert('View Document', `Opening document: ${absoluteUrl}`);
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white border-b border-gray-100 px-4 py-3 flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
                        <ChevronLeft size={22} color={COLORS.gray[900]} />
                    </TouchableOpacity>
                    <Text className="text-gray-900 text-lg font-bold">Activity Editor</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <X size={22} color={COLORS.gray[400]} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                {/* Tabs */}
                <View className="border-b border-gray-200 bg-white flex-row">
                    <TouchableOpacity
                        onPress={() => setActiveTab('details')}
                        className={`px-6 py-3 border-b-2 ${activeTab === 'details' ? 'border-teal-600' : 'border-transparent'}`}
                    >
                        <Text className={`text-sm font-bold ${activeTab === 'details' ? 'text-teal-600' : 'text-gray-600'}`}>Activity Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('documents')}
                        className={`px-6 py-3 border-b-2 ${activeTab === 'documents' ? 'border-teal-600' : 'border-transparent'}`}
                    >
                        <Text className={`text-sm font-bold ${activeTab === 'documents' ? 'text-teal-600' : 'text-gray-600'}`}>Associated Documents</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    {activeTab === 'details' ? (
                        <View className="p-5">
                            {/* Session Info Rows */}
                            <View className="flex-row gap-4 mb-5">
                                <View className="flex-1 bg-white p-3 rounded-xl border border-gray-100">
                                    <Text className="text-[11px] text-gray-500 mb-0.5">Activity Session ID:</Text>
                                    <Text className="text-xs font-bold text-gray-900">{activityDetail?.activityId || '-'}</Text>
                                </View>
                                <View className="flex-1 bg-white p-3 rounded-xl border border-gray-100">
                                    <Text className="text-[11px] text-gray-500 mb-0.5">Session Date:</Text>
                                    <Text className="text-xs font-bold text-gray-900">
                                        {activityDetail?.createdAt ? moment(activityDetail.createdAt).format('DD-MM-YYYY') : '-'}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row gap-4 mb-5">
                                <View className="flex-1 bg-white p-3 rounded-xl border border-gray-100">
                                    <Text className="text-[11px] text-gray-500 mb-0.5">Lead Source / Interaction:</Text>
                                    <Text className="text-xs font-bold text-gray-900">{activityDetail?.interactionType || '-'}</Text>
                                </View>
                                <View className="flex-1 bg-white p-3 rounded-xl border border-gray-100">
                                    <Text className="text-[11px] text-gray-500 mb-0.5">Session Time:</Text>
                                    <Text className="text-xs font-bold text-gray-900">
                                        {activityDetail?.createdAt ? moment(activityDetail.createdAt).format('HH:mm') : '-'}
                                    </Text>
                                </View>
                            </View>

                            {activityDetail?.quotation && (
                                <View className="flex-row gap-4 mb-5">
                                    <View className="flex-1 bg-white p-3 rounded-xl border border-gray-100">
                                        <Text className="text-[11px] text-gray-500 mb-0.5">Quotation ID:</Text>
                                        <Text className="text-xs font-bold text-teal-600">{activityDetail.quotation.quotationId}</Text>
                                    </View>
                                    <View className="flex-1 bg-white p-3 rounded-xl border border-gray-100">
                                        <Text className="text-[11px] text-gray-500 mb-0.5">Vehicles:</Text>
                                        <Text className="text-xs font-bold text-gray-900" numberOfLines={1}>
                                            {activityDetail.quotation.vehicle?.map((v: any) => v.vehicleDetail?.modelName || v.modelName).join(', ') || '-'}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {activityDetail?.booking && (
                                <View className="flex-row gap-4 mb-5">
                                    <View className="flex-1 bg-white p-3 rounded-xl border border-gray-100">
                                        <Text className="text-[11px] text-gray-500 mb-0.5">Booking ID:</Text>
                                        <Text className="text-xs font-bold text-teal-600">{activityDetail.booking.bookingId}</Text>
                                    </View>
                                    <View className="flex-1 bg-white p-3 rounded-xl border border-gray-100">
                                        <Text className="text-[11px] text-gray-500 mb-0.5">Status:</Text>
                                        <Text className="text-xs font-bold text-gray-900">{activityDetail.booking.bookingStatus || '-'}</Text>
                                    </View>
                                </View>
                            )}

                            {/* Enquiry Type Selector */}
                            <View className="mb-5">
                                <FormLabel label="Enquiry Type" />
                                <View className="flex-row gap-2">
                                    {ENQUIRY_TYPES.map(t => (
                                        <TouchableOpacity
                                            key={t}
                                            disabled={mode === 'view'}
                                            onPress={() => setEnquiryType(t)}
                                            className={`flex-1 h-11 rounded-lg items-center justify-center border ${enquiryType === t ? 'bg-teal-600 border-teal-600' : (mode === 'view' ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300')}`}
                                        >
                                            <Text className={enquiryType === t ? 'text-white font-bold' : (mode === 'view' ? 'text-gray-400' : 'text-gray-700 font-medium')}>{t}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Next Followup Date & Time - REQUIRED VERTICAL */}
                            <View className="mb-5">
                                <FormLabel label="Next Follow-up Date" required />
                                {mode === 'edit' ? (
                                    <TouchableOpacity
                                        onPress={() => setShowDatePicker(true)}
                                        className={`h-12 bg-white rounded-xl px-4 flex-row items-center justify-between border ${errors.followupDate ? 'border-red-500' : 'border-gray-200'}`}
                                    >
                                        <Text className={followupDate ? 'text-gray-900' : 'text-gray-400'}>
                                            {followupDate || 'Select Date'}
                                        </Text>
                                        <Calendar size={18} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
                                ) : (
                                    <View className="h-12 rounded-xl px-4 bg-gray-100 border border-gray-200 justify-center">
                                        <Text className="text-gray-900 font-medium">{followupDate || '-'}</Text>
                                    </View>
                                )}
                                {errors.followupDate && <Text className="text-xs text-red-600 mt-1">{errors.followupDate}</Text>}
                            </View>

                            <View className="mb-5">
                                <FormLabel label="Next Follow-up Time" required />
                                {mode === 'edit' ? (
                                    <View ref={timeFieldRef} className="relative">
                                        <TouchableOpacity
                                            onPress={openTimeDropdown}
                                            className={`h-12 bg-white rounded-xl px-4 flex-row items-center justify-between border ${errors.followupTime ? 'border-red-500' : 'border-gray-200'}`}
                                        >
                                            <Text className={followupTime ? 'text-gray-900' : 'text-gray-400'}>
                                                {followupTime || 'Select Time'}
                                            </Text>
                                            <Clock size={18} color={COLORS.gray[400]} />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View className="h-12 rounded-xl px-4 bg-gray-100 border border-gray-200 flex-row items-center justify-between">
                                        <Text className="text-gray-900 font-medium">{followupTime || '-'}</Text>
                                        <Clock size={16} color={COLORS.gray[400]} />
                                    </View>
                                )}
                                {errors.followupTime && <Text className="text-xs text-red-600 mt-1">{errors.followupTime}</Text>}
                            </View>

                            {/* Remarks */}
                            <View className="mb-5">
                                <FormLabel label="Remarks" />
                                <TextInput
                                    multiline
                                    numberOfLines={4}
                                    editable={mode === 'edit'}
                                    value={remarks}
                                    onChangeText={setRemarks}
                                    textAlignVertical="top"
                                    placeholder="Enter remarks here..."
                                    className={`min-h-[100px] rounded-xl px-4 py-3 text-gray-900 border ${mode === 'edit' ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-200'}`}
                                />
                            </View>
                        </View>
                    ) : (
                        <View className="p-4">
                            <View className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm shadow-black/5">
                                <View className="bg-gray-100 px-3 py-3 flex-row border-b border-gray-200">
                                    <Text className="text-[10px] font-bold text-gray-700 flex-1">Document Type</Text>
                                    <Text className="text-[10px] font-bold text-gray-700 w-24">Document ID</Text>
                                    <Text className="text-[10px] font-bold text-gray-700 w-16 text-center">Status</Text>
                                    <Text className="text-[10px] font-bold text-gray-700 w-12 text-center">Action</Text>
                                </View>
                                {getAssociatedDocuments().length > 0 ? (
                                    getAssociatedDocuments().map((doc, idx) => (
                                        <View key={idx} className={`px-3 py-4 flex-row items-center border-b border-gray-50 ${idx % 2 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                            <Text className="text-[10px] text-gray-900 flex-1 font-semibold" numberOfLines={2}>{doc.type}</Text>
                                            <Text className="text-[10px] text-gray-500 w-24">{doc.id}</Text>
                                            <Text className="text-[10px] text-gray-500 w-16 text-center">{doc.status}</Text>
                                            <TouchableOpacity
                                                className="w-12 items-center"
                                                onPress={() => handleViewDocument(doc.url)}
                                            >
                                                <Eye size={16} color={COLORS.primary} />
                                            </TouchableOpacity>
                                        </View>
                                    ))
                                ) : (
                                    <View className="py-12 items-center">
                                        <Text className="text-gray-400 italic text-sm">No documents found</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Bottom Actions */}
            <View className="bg-white border-t border-gray-200 p-4 flex-row justify-end gap-3 shadow-2xl">
                <Button
                    title={mode === 'edit' ? 'Cancel' : 'Close'}
                    variant="outline"
                    onPress={() => navigation.goBack()}
                    className="flex-1"
                />
                {mode === 'edit' && (
                    <Button
                        title="Save"
                        onPress={handleSave}
                        className="flex-[2]"
                    />
                )}
            </View>

            {/* Calendar Modal */}
            <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
                <View className="flex-1 bg-black/50 items-center justify-center px-4">
                    <View className="bg-white rounded-2xl p-4 w-full max-w-sm shadow-2xl">
                        <View className="flex-row items-center justify-between mb-4 border-b border-gray-100 pb-3">
                            <Text className="text-gray-900 font-bold text-lg">Select Date</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <X size={20} color={COLORS.gray[400]} />
                            </TouchableOpacity>
                        </View>
                        <RNCalendar
                            current={toCalendarDate(followupDate) || undefined}
                            minDate={moment().format('YYYY-MM-DD')}
                            onDayPress={(day: any) => {
                                const m = moment(day.dateString);
                                setFollowupDate(m.format('DD-MM-YYYY'));
                                setShowDatePicker(false);
                            }}
                            theme={{
                                todayTextColor: COLORS.primary,
                                selectedDayBackgroundColor: COLORS.primary,
                                selectedDayTextColor: '#fff',
                                arrowColor: COLORS.primary,
                                textDayFontWeight: '500',
                                textMonthFontWeight: 'bold',
                                textDayHeaderFontWeight: '600',
                            }}
                            markedDates={
                                toCalendarDate(followupDate)
                                    ? { [toCalendarDate(followupDate)]: { selected: true, selectedColor: COLORS.primary } }
                                    : undefined
                            }
                        />
                    </View>
                </View>
            </Modal>

            {/* Time Picker Modal */}
            <Modal visible={timeDropdownOpen} transparent animationType="fade" onRequestClose={() => setTimeDropdownOpen(false)}>
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setTimeDropdownOpen(false)}
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}
                >
                    {timeDropdownLayout && (
                        <View
                            style={{
                                position: 'absolute',
                                left: 20,
                                right: 20,
                                top: timeDropdownLayout.y + timeDropdownLayout.height + 8,
                                backgroundColor: 'white',
                                borderRadius: 20,
                                overflow: 'hidden',
                                elevation: 20,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 10 },
                                shadowOpacity: 0.2,
                                shadowRadius: 15,
                            }}
                        >
                            <View className="flex-row">
                                {/* Hours */}
                                <View style={{ flex: 1 }}>
                                    <View className="bg-gray-50 py-2 items-center border-b border-gray-100"><Text className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Hour</Text></View>
                                    <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                                        {buildHourOptions().map((hour) => (
                                            <TouchableOpacity
                                                key={`h-${hour}`}
                                                onPress={() => setSelectedHour(hour)}
                                                className={`px-4 py-3 items-center border-b border-gray-50 ${selectedHour === hour ? 'bg-teal-50' : 'bg-white'}`}
                                            >
                                                <Text className={`text-sm ${selectedHour === hour ? 'text-teal-600 font-bold' : 'text-gray-700'}`}>
                                                    {String(hour).padStart(2, '0')}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                                <View style={{ width: 1, backgroundColor: '#f1f5f9' }} />
                                {/* Minutes */}
                                <View style={{ flex: 1 }}>
                                    <View className="bg-gray-50 py-2 items-center border-b border-gray-100"><Text className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Minute</Text></View>
                                    <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                                        {minuteOptions.map((minute) => (
                                            <TouchableOpacity
                                                key={`m-${minute}`}
                                                onPress={() => setSelectedMinute(minute)}
                                                className={`px-4 py-3 items-center border-b border-gray-50 ${selectedMinute === minute ? 'bg-teal-50' : 'bg-white'}`}
                                            >
                                                <Text className={`text-sm ${selectedMinute === minute ? 'text-teal-600 font-bold' : 'text-gray-700'}`}>
                                                    {String(minute).padStart(2, '0')}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>
                            {/* Confirm button */}
                            <View className="p-3 border-t border-gray-100 bg-white items-end">
                                <TouchableOpacity
                                    onPress={() => {
                                        if (selectedHour === null || selectedMinute === null) return;
                                        setFollowupTime(`${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`);
                                        setTimeDropdownOpen(false);
                                    }}
                                    disabled={selectedHour === null || selectedMinute === null}
                                    className={`px-8 py-2.5 rounded-xl ${selectedHour !== null && selectedMinute !== null ? 'bg-teal-600' : 'bg-gray-200'}`}
                                >
                                    <Text className="text-white font-bold text-sm">Set Time</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}




