import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    Image,
} from 'react-native';
import {
    CreditCard,
    Calendar,
    FileText,
    Car,
    X,
    MapPin,
    CheckCircle,
    Clock,
    ExternalLink,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import moment from 'moment';
import { getCustomerNumberPlates, getNumberPlateDetails } from '../../src/api';

interface NumberPlate {
    id: string;
    createdAt: string;
    applicationNo: string;
    customerName: string;
    modelName: string;
    chassisNo: string;
    registerNo: string;
    Location?: {
        name: string;
        id: string;
    };
    plateOrderStatus: 'ORDERED' | 'DELIVERED' | 'PENDING';
    deliveryDate?: string;
    orderDate?: string;
    remarks?: string;
}

interface NumberPlatesSectionProps {
    customerId: string;
}

const NumberPlatesSection: React.FC<NumberPlatesSectionProps> = ({ customerId }) => {
    const [numberPlates, setNumberPlates] = useState<NumberPlate[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedPlate, setSelectedPlate] = useState<NumberPlate | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    const getStatusColor = (status: string) => {
        const statusColors: { [key: string]: string } = {
            'ORDERED': '#F59E0B',
            'DELIVERED': '#10B981',
            'PENDING': '#6B7280',
            'PROCESSING': '#3B82F6',
            'READY': '#8B5CF6',
        };
        return statusColors[status] || '#6B7280';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'DELIVERED':
                return <CheckCircle size={16} color="#fff" />;
            case 'ORDERED':
                return <Clock size={16} color="#fff" />;
            case 'PENDING':
                return <Clock size={16} color="#fff" />;
            default:
                return <Clock size={16} color="#fff" />;
        }
    };

    const fetchNumberPlates = async () => {
        if (!customerId) return;
        
        setLoading(true);
        try {
            console.log('📍 Fetching number plates for customer:', customerId);
            const response = await getCustomerNumberPlates(customerId);
            
            if (response.data?.code === 200) {
                const customerData = response.data.response?.data || response.data.response;
                // Extract number plates from customer data
                const plateData = customerData?.numberPlating || customerData?.numberPlates || [];
                console.log('✅ Number plates fetched:', plateData.length);
                setNumberPlates(plateData);
            } else {
                console.log('⚠️ No number plates found or API error');
                setNumberPlates([]);
            }
        } catch (error) {
            console.error('❌ Error fetching number plates:', error);
            setNumberPlates([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchNumberPlateDetails = async (plateId: string) => {
        setDetailLoading(true);
        try {
            console.log('🔍 Fetching number plate details:', plateId);
            const response = await getNumberPlateDetails(plateId);
            
            if (response.data?.code === 200) {
                const plateDetails = response.data.response?.data || response.data.response;
                setSelectedPlate(plateDetails);
                setShowDetailModal(true);
            }
        } catch (error) {
            console.error('❌ Error fetching number plate details:', error);
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        fetchNumberPlates();
    }, [customerId]);

    const renderNumberPlateCard = (plate: NumberPlate, index: number) => {
        const statusColor = getStatusColor(plate.plateOrderStatus);

        return (
            <TouchableOpacity
                key={plate.id}
                className="bg-white rounded-xl shadow-lg mb-4 overflow-hidden"
                onPress={() => fetchNumberPlateDetails(plate.id)}
                activeOpacity={0.8}
            >
                {/* Header */}
                <View className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 border-b border-gray-200">
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                            <Text className="text-lg font-bold text-gray-900 mb-1">
                                Application No: {plate.applicationNo}
                            </Text>
                            <Text className="text-sm text-gray-600">
                                S.No: {index + 1}
                            </Text>
                        </View>
                        <View
                            className="px-3 py-1 rounded-full flex-row items-center"
                            style={{ backgroundColor: statusColor + '20' }}
                        >
                            <View className="mr-1">
                                {getStatusIcon(plate.plateOrderStatus)}
                            </View>
                            <Text className="text-xs font-medium" style={{ color: statusColor }}>
                                {plate.plateOrderStatus}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Plate Details */}
                <View className="p-4">
                    {/* Customer Info */}
                    <View className="bg-gray-50 rounded-lg p-3 mb-3">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Customer Information
                        </Text>
                        <Text className="text-sm text-gray-600 mb-1">
                            Name: <Text className="font-medium">{plate.customerName}</Text>
                        </Text>
                        {plate.Location && (
                            <View className="flex-row items-center">
                                <MapPin size={14} color="#6B7280" />
                                <Text className="text-sm text-gray-600 ml-2">
                                    Location: <Text className="font-medium">{plate.Location.name}</Text>
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Vehicle Info */}
                    <View className="bg-blue-50 rounded-lg p-3 mb-3">
                        <View className="flex-row items-center mb-2">
                            <Car size={16} color="#3B82F6" />
                            <Text className="text-sm font-semibold text-gray-700 ml-2">
                                Vehicle Details
                            </Text>
                        </View>
                        <Text className="text-sm text-gray-600 mb-1">
                            Model: <Text className="font-medium">{plate.modelName}</Text>
                        </Text>
                        <Text className="text-sm text-gray-600 mb-1">
                            Chassis: <Text className="font-medium">{plate.chassisNo}</Text>
                        </Text>
                        <Text className="text-sm text-gray-600">
                            Register: <Text className="font-medium">{plate.registerNo}</Text>
                        </Text>
                    </View>

                    {/* Dates */}
                    <View className="flex-row justify-between items-center">
                        <View className="flex-1">
                            <Text className="text-xs text-gray-500">Application Date</Text>
                            <Text className="text-sm font-medium text-gray-900">
                                {moment(plate.createdAt).format('DD-MM-YYYY')}
                            </Text>
                        </View>
                        {plate.deliveryDate && (
                            <View className="flex-1 items-end">
                                <Text className="text-xs text-gray-500">Delivery Date</Text>
                                <Text className="text-sm font-medium text-green-600">
                                    {moment(plate.deliveryDate).format('DD-MM-YYYY')}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Footer */}
                <View className="bg-gray-50 px-4 py-3 flex-row justify-between items-center">
                    <Text className="text-xs text-gray-500">
                        ID: {plate.id}
                    </Text>
                    <View className="flex-row items-center">
                        <Text className="text-xs text-blue-600 mr-1">View Details</Text>
                        <ExternalLink size={12} color="#2563EB" />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderNumberPlateDetailModal = () => {
        if (!selectedPlate) return null;

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
                            Number Plate Details
                        </Text>
                        <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                            <X size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    {detailLoading ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        </View>
                    ) : (
                        <ScrollView className="flex-1 p-4">
                            {/* Application Header */}
                            <View className="bg-orange-50 rounded-lg p-4 mb-4">
                                <Text className="text-xl font-bold text-gray-900 mb-2">
                                    Application No: {selectedPlate.applicationNo}
                                </Text>
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-sm text-gray-600">
                                        Applied on: {moment(selectedPlate.createdAt).format('DD-MM-YYYY')}
                                    </Text>
                                    <View
                                        className="px-3 py-1 rounded-full flex-row items-center"
                                        style={{ backgroundColor: getStatusColor(selectedPlate.plateOrderStatus) + '20' }}
                                    >
                                        <View className="mr-1">
                                            {getStatusIcon(selectedPlate.plateOrderStatus)}
                                        </View>
                                        <Text className="text-sm font-medium" style={{ color: getStatusColor(selectedPlate.plateOrderStatus) }}>
                                            {selectedPlate.plateOrderStatus}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Customer Information */}
                            <View className="bg-gray-50 rounded-lg p-4 mb-4">
                                <Text className="text-lg font-semibold text-gray-900 mb-3">
                                    Customer Information
                                </Text>
                                <Text className="text-sm text-gray-700 mb-2">
                                    Name: <Text className="font-medium">{selectedPlate.customerName}</Text>
                                </Text>
                                {selectedPlate.Location && (
                                    <View className="flex-row items-center">
                                        <MapPin size={16} color="#6B7280" />
                                        <Text className="text-sm text-gray-700 ml-2">
                                            Location: <Text className="font-medium">{selectedPlate.Location.name}</Text>
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Vehicle Details */}
                            <View className="bg-blue-50 rounded-lg p-4 mb-4">
                                <Text className="text-lg font-semibold text-gray-900 mb-3">
                                    Vehicle Details
                                </Text>
                                <Text className="text-sm text-gray-700 mb-2">
                                    Model: <Text className="font-medium">{selectedPlate.modelName}</Text>
                                </Text>
                                <Text className="text-sm text-gray-700 mb-2">
                                    Chassis Number: <Text className="font-medium">{selectedPlate.chassisNo}</Text>
                                </Text>
                                <Text className="text-sm text-gray-700 mb-2">
                                    Registration Number: <Text className="font-medium">{selectedPlate.registerNo}</Text>
                                </Text>
                            </View>

                            {/* Order Timeline */}
                            <View className="bg-green-50 rounded-lg p-4 mb-4">
                                <Text className="text-lg font-semibold text-gray-900 mb-3">
                                    Order Timeline
                                </Text>
                                <View className="space-y-3">
                                    <View className="flex-row items-center">
                                        <View className="w-3 h-3 bg-orange-500 rounded-full mr-3" />
                                        <View className="flex-1">
                                            <Text className="text-sm font-medium text-gray-900">Order Placed</Text>
                                            <Text className="text-xs text-gray-600">
                                                {moment(selectedPlate.createdAt).format('DD-MM-YYYY')}
                                            </Text>
                                        </View>
                                    </View>
                                    {selectedPlate.orderDate && (
                                        <View className="flex-row items-center">
                                            <View className="w-3 h-3 bg-blue-500 rounded-full mr-3" />
                                            <View className="flex-1">
                                                <Text className="text-sm font-medium text-gray-900">Order Confirmed</Text>
                                                <Text className="text-xs text-gray-600">
                                                    {moment(selectedPlate.orderDate).format('DD-MM-YYYY')}
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                    {selectedPlate.deliveryDate && (
                                        <View className="flex-row items-center">
                                            <View className="w-3 h-3 bg-green-500 rounded-full mr-3" />
                                            <View className="flex-1">
                                                <Text className="text-sm font-medium text-gray-900">Delivered</Text>
                                                <Text className="text-xs text-gray-600">
                                                    {moment(selectedPlate.deliveryDate).format('DD-MM-YYYY')}
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Additional Information */}
                            {selectedPlate.remarks && (
                                <View className="bg-yellow-50 rounded-lg p-4">
                                    <Text className="text-lg font-semibold text-gray-900 mb-3">
                                        Remarks
                                    </Text>
                                    <Text className="text-sm text-gray-700">
                                        {selectedPlate.remarks}
                                    </Text>
                                </View>
                            )}

                            {/* Order Summary */}
                            <View className="bg-purple-50 rounded-lg p-4 mt-4">
                                <Text className="text-lg font-semibold text-gray-900 mb-3">
                                    Order Summary
                                </Text>
                                <View className="space-y-2">
                                    <Text className="text-sm text-gray-700">
                                        Application ID: <Text className="font-medium">{selectedPlate.id}</Text>
                                    </Text>
                                    <Text className="text-sm text-gray-700">
                                        Status: <Text className="font-medium" style={{ color: getStatusColor(selectedPlate.plateOrderStatus) }}>
                                            {selectedPlate.plateOrderStatus}
                                        </Text>
                                    </Text>
                                </View>
                            </View>
                        </ScrollView>
                    )}
                </View>
            </Modal>
        );
    };

    return (
        <View className="flex-1">
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text className="text-gray-500 mt-2">Loading number plates...</Text>
                </View>
            ) : numberPlates.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <CreditCard size={48} color="#9CA3AF" />
                    <Text className="text-gray-500 mt-3 text-center px-4">
                        No number plates found for this customer
                    </Text>
                </View>
            ) : (
                <ScrollView className="flex-1 px-4 py-2" showsVerticalScrollIndicator={false}>
                    {numberPlates.map((plate, index) => renderNumberPlateCard(plate, index))}
                </ScrollView>
            )}

            {renderNumberPlateDetailModal()}
        </View>
    );
};

export default NumberPlatesSection;
