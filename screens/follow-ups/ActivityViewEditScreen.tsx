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
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Calendar, Clock, X, Eye } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { getActivityById, updateActivity, ENDPOINT } from '../../src/api';
import moment from 'moment';
import { TimePickerModal } from '../../components/TimePickerModal';

type ActivityViewEditRouteProp = RouteProp<RootStackParamList, 'ActivityViewEdit'>;
type ActivityViewEditNavigationProp = StackNavigationProp<RootStackParamList, 'ActivityViewEdit'>;

const ENQUIRY_TYPES = ['Hot', 'Warm', 'Cold'] as const;

export default function ActivityViewEditScreen() {
    let navigation, route;

    try {
        navigation = useNavigation<ActivityViewEditNavigationProp>();
        route = useRoute<ActivityViewEditRouteProp>();
    } catch (error) {
        console.error('Navigation context not available:', error);
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <Text className="text-red-500 mb-4">Navigation Error</Text>
                <Text className="text-gray-600 text-center px-4">
                    This screen cannot be accessed directly. Please go back and try again.
                </Text>
                <Button
                    title="Go Back"
                    onPress={() => {
                        Alert.alert('Error', 'Navigation not available');
                    }}
                    className="mt-4"
                />
            </SafeAreaView>
        );
    }

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
    const timeFieldRef = useRef<View | null>(null);

    // Add debug state
    const [debugInfo, setDebugInfo] = useState<string>('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            console.log('🔍 Fetching activity data for ID:', activityId);
            const res = await getActivityById(activityId);
            const data = res.data?.response?.data;
            if (data) {
                console.log('🔍 Activity data received:', {
                    hasQuotation: !!data.quotation,
                    hasBooking: !!data.booking,
                    quotationType: data.quotation ? typeof data.quotation : 'none'
                });
                setActivityDetail(data);
                setEnquiryType(data.enquiryType || 'Hot');
                setRemarks(data.remarks || '');

                if (data.scheduleDateAndTime) {
                    const m = moment.utc(data.scheduleDateAndTime);
                    setFollowupDate(m.format('DD-MM-YYYY'));
                    setFollowupTime(m.format('HH:mm'));
                } else {
                    setFollowupDate(data.scheduleDate || '');
                    setFollowupTime(data.scheduleTime || '');
                }
            }
        } catch (err) {
            console.error('❌ Error fetching activity:', err);
            Alert.alert('Error', 'Failed to load activity details');
        } finally {
            setLoading(false);
        }
    }, [activityId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Add debug effect for tab changes
    useEffect(() => {
        console.log('🔍 Active tab changed to:', activeTab);
        if (activeTab === 'documents') {
            console.log('🔍 Documents tab activated, checking data...');
            setDebugInfo('Documents tab loaded');
            
            // Force a re-render to check if error persists
            const timer = setTimeout(() => {
                console.log('🔍 Documents tab still active after 1 second');
            }, 1000);
            
            return () => clearTimeout(timer);
        }
    }, [activeTab]);

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
                scheduleDateAndTime: combinedDateTime
            };
            await updateActivity(activityId, payload);
            Alert.alert('Success', 'Activity updated', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (err) {
            console.error('Error updating activity:', err);
            Alert.alert('Error', 'Failed to update activity');
        }
    };

    const openTimeDropdown = () => {
        setTimeDropdownOpen(true);
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

    const getAssociatedDocuments = useCallback(() => {
        console.log('🔍 getAssociatedDocuments called');
        
        if (!activityDetail) {
            console.log('🔍 No activity detail, returning empty array');
            return [];
        }

        console.log('🔍 activityDetail structure:', JSON.stringify({
            hasQuotation: !!activityDetail.quotation,
            hasBooking: !!activityDetail.booking,
            quotationKeys: activityDetail.quotation ? Object.keys(activityDetail.quotation) : [],
            bookingKeys: activityDetail.booking ? Object.keys(activityDetail.booking) : []
        }));

        const docs = [];

        try {
            // Handle quotations safely
            if (activityDetail.quotation) {
                console.log('🔍 Processing quotations');
                
                const quotations = Array.isArray(activityDetail.quotation)
                    ? activityDetail.quotation
                    : [activityDetail.quotation];
                
                console.log('🔍 Quotations array length:', quotations.length);

                quotations.filter(Boolean).forEach((q, index) => {
                    console.log(`🔍 Processing quotation ${index}:`, {
                        hasPdfWithBrochure: !!q?.pdfWithBrochure,
                        hasPdfWithOutBrochure: !!q?.pdfWithOutBrochure,
                        quotationId: q?.quotationId
                    });
                    
                    if (q?.pdfWithBrochure && typeof q.pdfWithBrochure === 'string') {
                        console.log('🔍 Adding PDF WITH BROCHURE document');
                        docs.push({
                            type: 'PDF WITH BROCHURE',
                            id: q.quotationId || q.id || 'N/A',
                            status: 'Generated',
                            url: q.pdfWithBrochure
                        });
                    }

                    if (q?.pdfWithOutBrochure && typeof q.pdfWithOutBrochure === 'string') {
                        console.log('🔍 Adding PDF WITHOUT BROCHURE document');
                        docs.push({
                            type: 'PDF WITHOUT BROCHURE',
                            id: q.quotationId || q.id || 'N/A',
                            status: 'Generated',
                            url: q.pdfWithOutBrochure
                        });
                    }
                });
            }

            // Handle booking documents safely
            if (activityDetail.booking && typeof activityDetail.booking === 'object') {
                console.log('🔍 Processing booking');
                const booking = activityDetail.booking;

                if (booking.authentication && typeof booking.authentication === 'object') {
                    console.log('🔍 Processing authentication');
                    const auth = booking.authentication;

                    if (auth?.beforeVerification && typeof auth.beforeVerification === 'string') {
                        console.log('🔍 Adding BEFORE VERIFICATION document');
                        docs.push({
                            type: 'BEFORE VERIFICATION',
                            id: booking.bookingId || booking.id || 'N/A',
                            status: 'Generated',
                            url: auth.beforeVerification
                        });
                    }

                    if (auth?.afterVerification && typeof auth.afterVerification === 'string') {
                        console.log('🔍 Adding AFTER VERIFICATION document');
                        docs.push({
                            type: 'AFTER VERIFICATION',
                            id: booking.bookingId || booking.id || 'N/A',
                            status: 'Generated',
                            url: auth.afterVerification
                        });
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error in getAssociatedDocuments:', error);
            console.error('❌ Error details:', error.message);
            console.error('❌ Error stack:', error.stack);
            return [];
        }

        console.log('🔍 Total documents found:', docs.length);
        return docs;
    }, [activityDetail]);

    const handleViewDocument = (url: string) => {
        if (!url) return;
        const absoluteUrl = url.startsWith('http') ? url : (ENDPOINT.endsWith('/') ? ENDPOINT : `${ENDPOINT}/`) + (url.startsWith('/') ? url.slice(1) : url);
        console.log('🔍 Viewing document:', absoluteUrl);
        Alert.alert('View Document', `Opening: ${absoluteUrl}`);
    };

    const handleGoBack = () => navigation.goBack();

    // Add error boundary component
    const DocumentsTabContent = () => {
        console.log('🔍 Rendering DocumentsTabContent');
        
        try {
            const documents = getAssociatedDocuments();
            console.log('🔍 Documents to render:', documents.length);

            return (
                <View className="p-4">
                    {/* Activity Session Information */}
                    <View className="flex-row gap-4 mb-5">
                        <View className="flex-1">
                            <View className="bg-white p-3 rounded-xl border border-gray-100">
                                <Text className="text-[11px] text-gray-500 mb-1">Activity Session ID:</Text>
                                <Text className="text-xs font-bold text-gray-900">{activityDetail?.activityId || '-'}</Text>
                            </View>
                        </View>
                        <View className="flex-1">
                            <View className="bg-white p-3 rounded-xl border border-gray-100">
                                <Text className="text-[11px] text-gray-500 mb-1">Session Date:</Text>
                                <Text className="text-xs font-bold text-gray-900">
                                    {activityDetail?.createdAt ? moment(activityDetail.createdAt).format('DD-MM-YYYY') : '-'}
                                </Text>
                            </View>
                            <View className="bg-white p-3 rounded-xl border border-gray-100 mt-4">
                                <Text className="text-[11px] text-gray-500 mb-1">Session Time:</Text>
                                <Text className="text-xs font-bold text-gray-900">
                                    {activityDetail?.createdAt ? moment(activityDetail.createdAt).format('HH:mm') : '-'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Documents Generated Title */}
                    <Text className="text-sm font-bold text-gray-900 mb-3">Documents Generated:</Text>

                    {/* Documents Generated Table */}
                    <View className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm shadow-black/5">
                        {/* Table Header */}
                        <View className="bg-gray-100 px-3 py-3 flex-row border-b border-gray-200">
                            <Text className="text-[10px] font-bold text-gray-700 flex-1">Document Type</Text>
                            <Text className="text-[10px] font-bold text-gray-700 w-24">Document ID</Text>
                            <Text className="text-[10px] font-bold text-gray-700 w-16 text-center">Status</Text>
                            <Text className="text-[10px] font-bold text-gray-700 w-12 text-center">Action</Text>
                        </View>

                        {/* Documents */}
                        {documents.length > 0 ? (
                            documents.map((doc, idx) => {
                                console.log(`🔍 Rendering document ${idx}:`, doc.type);
                                return (
                                    <View key={idx} className={`px-3 py-4 flex-row items-center border-b border-gray-50 ${idx % 2 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                        <Text className="text-[10px] text-gray-900 flex-1 font-semibold" numberOfLines={2}>
                                            {doc.type || 'Unknown'}
                                        </Text>
                                        <Text className="text-[10px] text-gray-500 w-24">
                                            {doc.id || 'N/A'}
                                        </Text>
                                        <Text className="text-[10px] text-gray-500 w-16 text-center">
                                            {doc.status || 'N/A'}
                                        </Text>
                                        <TouchableOpacity
                                            className="w-12 items-center"
                                            onPress={() => {
                                                console.log('🔍 View document pressed:', doc.url);
                                                if (doc.url) {
                                                    handleViewDocument(doc.url);
                                                }
                                            }}
                                            disabled={!doc.url}
                                        >
                                            <Eye size={16} color={doc.url ? COLORS.primary : COLORS.gray[400]} />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })
                        ) : (
                            <View className="py-12 items-center">
                                <Text className="text-gray-400 italic text-sm">No documents found</Text>
                            </View>
                        )}
                    </View>
                </View>
            );
        } catch (error) {
            console.error('❌ Error in DocumentsTabContent:', error);
            console.error('❌ Error stack:', error.stack);
            return (
                <View className="p-4">
                    <View className="bg-red-100 p-4 rounded-xl">
                        <Text className="text-red-600 font-bold mb-2">Error Loading Documents</Text>
                        <Text className="text-red-500 text-sm">{error.message}</Text>
                    </View>
                </View>
            );
        }
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
                    <TouchableOpacity onPress={handleGoBack} className="mr-3">
                        <ChevronLeft size={22} color={COLORS.gray[900]} />
                    </TouchableOpacity>
                    <Text className="text-gray-900 text-lg font-bold">Activity Editor</Text>
                </View>
                <TouchableOpacity onPress={handleGoBack}>
                    <X size={22} color={COLORS.gray[400]} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                {/* Tabs */}
                <View className="border-b border-gray-200 bg-white flex-row">
                    <TouchableOpacity 
                        onPress={() => {
                            console.log('🔍 Switching to details tab');
                            setActiveTab('details');
                        }} 
                        className={`flex-1 px-6 py-3 border-b-2 ${activeTab === 'details' ? 'border-teal-600' : 'border-transparent'}`}
                    >
                        <Text className={`text-sm font-bold text-center ${activeTab === 'details' ? 'text-teal-600' : 'text-gray-600'}`}>Activity Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => {
                            console.log('🔍 Switching to documents tab');
                            setActiveTab('documents');
                        }} 
                        className={`flex-1 px-6 py-3 border-b-2 ${activeTab === 'documents' ? 'border-teal-600' : 'border-transparent'}`}
                    >
                        <Text className={`text-sm font-bold text-center ${activeTab === 'documents' ? 'text-teal-600' : 'text-gray-600'}`}>Associated Documents</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    key={activeTab} // Force re-render on tab change
                    className="flex-1" 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {activeTab === 'details' ? (
                        <View className="p-5">
                            {/* Session Info */}
                            <View className="flex-row gap-4 mb-5">
                                <View className="flex-1 bg-white p-3 rounded-xl border border-gray-100">
                                    <Text className="text-[11px] text-gray-500 mb-1">Activity Session ID:</Text>
                                    <Text className="text-xs font-bold text-gray-900">{activityDetail?.activityId || '-'}</Text>
                                </View>
                                <View className="flex-1 bg-white p-3 rounded-xl border border-gray-100">
                                    <Text className="text-[11px] text-gray-500 mb-1">Session Date:</Text>
                                    <Text className="text-xs font-bold text-gray-900">
                                        {activityDetail?.createdAt ? moment(activityDetail.createdAt).format('DD-MM-YYYY') : '-'}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row gap-4 mb-5">
                                <View className="flex-1 bg-white p-3 rounded-xl border border-gray-100">
                                    <Text className="text-[11px] text-gray-500 mb-1">Lead Source:</Text>
                                    <Text className="text-xs font-bold text-gray-900">{activityDetail?.interactionType || '-'}</Text>
                                </View>
                                <View className="flex-1 bg-white p-3 rounded-xl border border-gray-100">
                                    <Text className="text-[11px] text-gray-500 mb-1">Session Time:</Text>
                                    <Text className="text-xs font-bold text-gray-900">
                                        {activityDetail?.createdAt ? moment(activityDetail.createdAt).format('HH:mm') : '-'}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row gap-4 mb-5">
                                <View className="flex-1 bg-white p-3 rounded-xl border border-gray-100">
                                    <Text className="text-[11px] text-gray-500 mb-1">Quotation ID:</Text>
                                    <Text className="text-xs font-bold">
                                        {(() => {
                                            const quotations = activityDetail?.quotation;
                                            if (!quotations) return '-';
                                            if (Array.isArray(quotations)) {
                                                return quotations.length > 0 ? quotations.map((q: any) => q.quotationId).join(', ') : '-';
                                            } else {
                                                return quotations.quotationId || '-';
                                            }
                                        })()}
                                    </Text>
                                </View>
                                <View className="flex-1 bg-white p-3 rounded-xl border border-gray-100">
                                    <Text className="text-[11px] text-gray-500 mb-1">Vehicles:</Text>
                                    <Text className="text-xs font-bold text-gray-900">
                                        {(() => {
                                            const quotations = activityDetail?.quotation;
                                            if (!quotations) {
                                                return activityDetail?.vehicleModel || activityDetail?.vehicle || '-';
                                            }

                                            let allVehicles: string[] = [];

                                            if (Array.isArray(quotations)) {
                                                quotations.forEach(q => {
                                                    if (q.vehicle) {
                                                        if (Array.isArray(q.vehicle)) {
                                                            q.vehicle.forEach((v: any) => {
                                                                const modelName = v.vehicleDetail?.modelName || v.modelName;
                                                                if (modelName) allVehicles.push(modelName);
                                                            });
                                                        } else {
                                                            const modelName = q.vehicle.vehicleDetail?.modelName || q.vehicle.modelName;
                                                            if (modelName) allVehicles.push(modelName);
                                                        }
                                                    }
                                                });
                                            } else if (quotations.vehicle) {
                                                if (Array.isArray(quotations.vehicle)) {
                                                    quotations.vehicle.forEach((v: any) => {
                                                        const modelName = v.vehicleDetail?.modelName || v.modelName;
                                                        if (modelName) allVehicles.push(modelName);
                                                    });
                                                } else {
                                                    const modelName = quotations.vehicle.vehicleDetail?.modelName || quotations.vehicle.modelName;
                                                    if (modelName) allVehicles.push(modelName);
                                                }
                                            }

                                            return allVehicles.length > 0 ? allVehicles.join(',\n') : (activityDetail?.vehicleModel || activityDetail?.vehicle || '-');
                                        })()}
                                    </Text>
                                </View>
                            </View>

                            {/* Enquiry Type */}
                            <View className="mb-5">
                                <FormLabel label="Enquiry Type" />
                                <View className="flex-row gap-2">
                                    {ENQUIRY_TYPES.map((t: string) => (
                                        <TouchableOpacity
                                            key={t}
                                            disabled={mode === 'view'}
                                            onPress={() => setEnquiryType(t)}
                                            className={`flex-1 h-11 rounded-lg items-center justify-center border ${enquiryType === t
                                                ? 'bg-teal-600 border-teal-600'
                                                : (mode === 'view' ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300')
                                                }`}
                                        >
                                            <Text className={
                                                enquiryType === t
                                                    ? 'text-white font-bold'
                                                    : (mode === 'view' ? 'text-gray-400' : 'text-gray-700 font-medium')
                                            }>{t}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Date & Time */}
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
                                    placeholder="Enter remarks..."
                                    className={`min-h-[100px] rounded-xl px-4 py-3 text-gray-900 border ${mode === 'edit' ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-200'}`}
                                />
                            </View>
                        </View>
                    ) : (
                        <DocumentsTabContent />
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Bottom Actions */}
            <View className="bg-white border-t border-gray-200 p-4 flex-row justify-end gap-3">
                <Button title={mode === 'edit' ? 'Cancel' : 'Close'} variant="outline" onPress={handleGoBack} className="flex-1" />
                {mode === 'edit' && <Button title="Save" onPress={handleSave} className="flex-[2]" />}
            </View>

            {/* Modals */}
            <Modal visible={showDatePicker} transparent onRequestClose={() => setShowDatePicker(false)}>
                <View className="flex-1 bg-black/50 items-center justify-center px-4">
                    <View className="bg-white rounded-2xl p-4 w-full max-w-sm">
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
                            }}
                            markedDates={toCalendarDate(followupDate) ? { [toCalendarDate(followupDate)]: { selected: true } } : undefined}
                        />
                    </View>
                </View>
            </Modal>

            {timeDropdownOpen && (
                <TimePickerModal
                    visible={timeDropdownOpen}
                    onClose={() => setTimeDropdownOpen(false)}
                    onSelect={(time) => setFollowupTime(time)}
                    anchorRef={timeFieldRef}
                />
            )}
        </SafeAreaView>
    );
}