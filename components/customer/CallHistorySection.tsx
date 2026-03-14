import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    Linking,
} from 'react-native';
import {
    Phone,
    PhoneIncoming,
    PhoneOutgoing,
    PhoneMissed,
    Calendar,
    Clock,
    User,
    FileText,
    X,
    Play,
    Pause,
    Volume2,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import moment from 'moment';
import { getCustomerCallHistory } from '../../src/api';

interface CallRecord {
    id: string;
    createdAt: string;
    direction: 'inbound' | 'outbound';
    from: string;
    to: string;
    status: 'answered' | 'missed' | 'failed';
    user_name?: string;
    customer_name?: string;
    hangup_reason?: string;
    module?: string;
    moduleid?: string;
    bucketURL?: string;
    duration?: number;
}

interface CallHistorySectionProps {
    customerId: string;
}

const CallHistorySection: React.FC<CallHistorySectionProps> = ({ customerId }) => {
    const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [playingAudio, setPlayingAudio] = useState<string | null>(null);

    const getCallIcon = (direction: string, status: string) => {
        if (status === 'missed') {
            return direction === 'inbound' ? (
                <PhoneMissed size={20} color="#EF4444" />
            ) : (
                <PhoneMissed size={20} color="#F59E0B" />
            );
        }
        
        return direction === 'inbound' ? (
            <PhoneIncoming size={20} color="#10B981" />
        ) : (
            <PhoneOutgoing size={20} color="#3B82F6" />
        );
    };

    const getCallTypeColor = (direction: string, status: string) => {
        if (status === 'missed') {
            return direction === 'inbound' ? '#EF4444' : '#F59E0B';
        }
        return direction === 'inbound' ? '#10B981' : '#3B82F6';
    };

    const getCallTypeText = (direction: string, status: string) => {
        if (status === 'missed') {
            return direction === 'inbound' ? 'Missed Incoming' : 'Missed Outgoing';
        }
        return direction === 'inbound' ? 'Incoming' : 'Outgoing';
    };

    const formatPhoneNumber = (phone: string) => {
        if (phone.startsWith('91')) {
            return phone.replace('91', '+91 ');
        }
        return phone;
    };

    const getHangupReasonText = (reason?: string) => {
        const reasonMap: { [key: string]: string } = {
            'sent_bye': 'Call ended by customer',
            'recv_bye': 'Call ended by employee',
            'recv_cancel': 'Call unanswered',
            'sent_reject': 'Call rejected by customer',
            'normal': 'Call ended normally',
        };
        return reasonMap[reason || ''] || 'No reason provided';
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const fetchCallHistory = async () => {
        if (!customerId) return;
        
        setLoading(true);
        try {
            console.log('📞 Fetching call history for customer:', customerId);
            const response = await getCustomerCallHistory(customerId);
            
            if (response.data?.code === 200) {
                const customerData = response.data.response?.data || response.data.response;
                // Extract call history from customer data
                const callData = customerData?.callHistory || customerData?.call || [];
                console.log('✅ Call history fetched:', callData.length);
                setCallHistory(callData);
            } else {
                console.log('⚠️ No call history found or API error');
                setCallHistory([]);
            }
        } catch (error) {
            console.error('❌ Error fetching call history:', error);
            setCallHistory([]);
        } finally {
            setLoading(false);
        }
    };

    const handleModuleNavigation = (record: CallRecord) => {
        if (!record.module || record.module === 'null') {
            return;
        }

        const phone = record.direction === 'outbound' 
            ? record.to.slice(2) 
            : record.from.slice(2);

        // Handle different module types
        switch (record.module) {
            case 'jobOrder':
            case 'Job-Order':
                console.log('Navigate to Job Order:', record.moduleid);
                break;
            case 'Booking':
                console.log('Navigate to Booking:', record.moduleid);
                break;
            case 'Customer':
                console.log('Navigate to Customer:', phone);
                break;
            case 'Quotation':
            case 'Follow-Ups':
                console.log('Navigate to Quotation:', record.moduleid);
                break;
            case 'Call-Back':
                console.log('Call Back for missed call from', record.user_name, 'to', record.customer_name);
                break;
            case 'Insurance':
                console.log('Navigate to Insurance:', record.moduleid);
                break;
            case 'Other insurance':
                console.log('Navigate to Other Insurance:', record.moduleid);
                break;
            case 'Service':
                console.log('Navigate to Service:', record.moduleid);
                break;
            default:
                console.log('Unknown module:', record.module);
                break;
        }
    };

    useEffect(() => {
        fetchCallHistory();
    }, [customerId]);

    const renderCallCard = (call: CallRecord) => {
        const callTypeColor = getCallTypeColor(call.direction, call.status);
        const phoneNumber = call.direction === 'inbound' ? call.from : call.to;
        const isIncoming = call.direction === 'inbound';
        const isMissed = call.status === 'missed';

        return (
            <TouchableOpacity
                key={call.id}
                className="bg-white rounded-xl shadow-lg mb-3 overflow-hidden"
                onPress={() => {
                    setSelectedCall(call);
                    setShowDetailModal(true);
                }}
                activeOpacity={0.8}
            >
                <View className="p-4">
                    {/* Header with call type and time */}
                    <View className="flex-row justify-between items-start mb-3">
                        <View className="flex-row items-center flex-1">
                            <View className="mr-3">
                                {getCallIcon(call.direction, call.status)}
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-semibold text-gray-900">
                                    {getCallTypeText(call.direction, call.status)}
                                </Text>
                                <Text className="text-sm text-gray-600">
                                    {formatPhoneNumber(phoneNumber)}
                                </Text>
                            </View>
                        </View>
                        <View className="items-end">
                            <Text className="text-xs text-gray-500">
                                {moment(call.createdAt).format('DD/MM/YYYY')}
                            </Text>
                            <Text className="text-xs text-gray-500">
                                {moment(call.createdAt).format('hh:mm A')}
                            </Text>
                        </View>
                    </View>

                    {/* Call Details */}
                    <View className="space-y-2">
                        {call.user_name && (
                            <View className="flex-row items-center">
                                <User size={14} color="#6B7280" />
                                <Text className="text-sm text-gray-600 ml-2">
                                    Employee: <Text className="font-medium">{call.user_name}</Text>
                                </Text>
                            </View>
                        )}

                        {call.duration && call.status === 'answered' && (
                            <View className="flex-row items-center">
                                <Clock size={14} color="#6B7280" />
                                <Text className="text-sm text-gray-600 ml-2">
                                    Duration: <Text className="font-medium">{formatDuration(call.duration)}</Text>
                                </Text>
                            </View>
                        )}

                        {call.hangup_reason && (
                            <View className="flex-row items-center">
                                <Phone size={14} color="#6B7280" />
                                <Text className="text-sm text-gray-600 ml-2 flex-1">
                                    Reason: <Text className="font-medium">{getHangupReasonText(call.hangup_reason)}</Text>
                                </Text>
                            </View>
                        )}

                        {/* Module Information */}
                        {call.module && call.module !== 'null' && (
                            <TouchableOpacity
                                className="flex-row items-center bg-blue-50 rounded-lg p-2 mt-2"
                                onPress={() => handleModuleNavigation(call)}
                                activeOpacity={0.7}
                            >
                                <FileText size={14} color="#3B82F6" />
                                <Text className="text-sm text-blue-600 ml-2 font-medium">
                                    {call.module}
                                </Text>
                                {call.moduleid && (
                                    <Text className="text-xs text-blue-500 ml-2">
                                        (ID: {call.moduleid})
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}

                        {/* Recording Indicator */}
                        {call.bucketURL && call.status !== 'missed' && (
                            <View className="flex-row items-center bg-green-50 rounded-lg p-2 mt-2">
                                <Volume2 size={14} color="#10B981" />
                                <Text className="text-sm text-green-600 ml-2 font-medium">
                                    Recording Available
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Footer with status indicator */}
                <View 
                    className="h-1"
                    style={{ backgroundColor: callTypeColor + '20' }}
                />
            </TouchableOpacity>
        );
    };

    const renderCallDetailModal = () => {
        if (!selectedCall) return null;

        return (
            <Modal
                visible={showDetailModal}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View className="flex-1 bg-white">
                    {/* Header */}
                    <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                        <Text className="text-xl font-bold text-gray-900">
                            Call Details
                        </Text>
                        <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                            <X size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 p-4">
                        {/* Call Type Header */}
                        <View className="bg-gray-50 rounded-lg p-4 mb-4">
                            <View className="flex-row items-center mb-3">
                                <View className="mr-3">
                                    {getCallIcon(selectedCall.direction, selectedCall.status)}
                                </View>
                                <Text className="text-lg font-semibold text-gray-900">
                                    {getCallTypeText(selectedCall.direction, selectedCall.status)}
                                </Text>
                            </View>
                            
                            <Text className="text-base text-gray-700 mb-1">
                                Phone: <Text className="font-medium">{formatPhoneNumber(
                                    selectedCall.direction === 'inbound' ? selectedCall.from : selectedCall.to
                                )}</Text>
                            </Text>
                            
                            <Text className="text-sm text-gray-600">
                                {moment(selectedCall.createdAt).format('DD/MM/YYYY HH:mm')}
                            </Text>
                        </View>

                        {/* Call Information */}
                        <View className="bg-blue-50 rounded-lg p-4 mb-4">
                            <Text className="text-lg font-semibold text-gray-900 mb-3">
                                Call Information
                            </Text>
                            
                            {selectedCall.user_name && (
                                <Text className="text-sm text-gray-700 mb-2">
                                    Employee: <Text className="font-medium">{selectedCall.user_name}</Text>
                                </Text>
                            )}
                            
                            {selectedCall.duration && selectedCall.status === 'answered' && (
                                <Text className="text-sm text-gray-700 mb-2">
                                    Duration: <Text className="font-medium">{formatDuration(selectedCall.duration)}</Text>
                                </Text>
                            )}
                            
                            {selectedCall.hangup_reason && (
                                <Text className="text-sm text-gray-700 mb-2">
                                    End Reason: <Text className="font-medium">{getHangupReasonText(selectedCall.hangup_reason)}</Text>
                                </Text>
                            )}
                            
                            <Text className="text-sm text-gray-700">
                                Status: <Text className="font-medium capitalize">{selectedCall.status}</Text>
                            </Text>
                        </View>

                        {/* Module Information */}
                        {selectedCall.module && selectedCall.module !== 'null' && (
                            <View className="bg-purple-50 rounded-lg p-4 mb-4">
                                <Text className="text-lg font-semibold text-gray-900 mb-3">
                                    Related Module
                                </Text>
                                <TouchableOpacity
                                    className="bg-purple-100 rounded-lg p-3"
                                    onPress={() => handleModuleNavigation(selectedCall)}
                                >
                                    <Text className="text-purple-700 font-medium text-center">
                                        {selectedCall.module}
                                    </Text>
                                    {selectedCall.moduleid && (
                                        <Text className="text-purple-600 text-xs text-center mt-1">
                                            Module ID: {selectedCall.moduleid}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Audio Recording */}
                        {selectedCall.bucketURL && selectedCall.status !== 'missed' && (
                            <View className="bg-green-50 rounded-lg p-4">
                                <Text className="text-lg font-semibold text-gray-900 mb-3">
                                    Call Recording
                                </Text>
                                <View className="bg-green-100 rounded-lg p-4 items-center">
                                    <Volume2 size={32} color="#10B981" />
                                    <Text className="text-green-700 font-medium mt-2">
                                        Audio Recording Available
                                    </Text>
                                    <TouchableOpacity
                                        className="bg-green-600 rounded-lg px-4 py-2 mt-3 flex-row items-center"
                                        onPress={() => Linking.openURL(selectedCall.bucketURL!)}
                                    >
                                        <Play size={16} color="#fff" />
                                        <Text className="text-white font-medium ml-2">
                                            Play Recording
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        );
    };

    return (
        <View className="flex-1">
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text className="text-gray-500 mt-2">Loading call history...</Text>
                </View>
            ) : callHistory.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <Phone size={48} color="#9CA3AF" />
                    <Text className="text-gray-500 mt-3 text-center px-4">
                        No call history found for this customer
                    </Text>
                </View>
            ) : (
                <ScrollView className="flex-1 px-4 py-2" showsVerticalScrollIndicator={false}>
                    {callHistory.map(renderCallCard)}
                </ScrollView>
            )}

            {renderCallDetailModal()}
        </View>
    );
};

export default CallHistorySection;
