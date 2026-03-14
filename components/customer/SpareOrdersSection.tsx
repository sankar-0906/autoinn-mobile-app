import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    Image,
    Dimensions,
} from 'react-native';
import {
    Package,
    Calendar,
    FileText,
    Car,
    X,
    ExternalLink,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import moment from 'moment';
import { getCustomerSpareOrders, getSpareOrderDetails } from '../../src/api';

const { width: screenWidth } = Dimensions.get('window');

interface SpareOrder {
    id: string;
    orderDate: string;
    orderNumber: string;
    orderType: string;
    soldVehicle?: {
        chassisNo?: string;
        registerNo?: string;
        engineNo?: string;
        modelName?: string;
        color?: string;
    };
    status?: string;
    totalAmount?: number;
}

interface SpareOrdersSectionProps {
    customerId: string;
}

const SpareOrdersSection: React.FC<SpareOrdersSectionProps> = ({ customerId }) => {
    const [spareOrders, setSpareOrders] = useState<SpareOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<SpareOrder | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    const getOrderTypeColor = (orderType: string) => {
        const typeColors: { [key: string]: string } = {
            "Sales": "#34C759",
            "Service": "#007AFF",
            "Retail": "#FF9500",
            "Internal": "#8E8E93",
        };
        return typeColors[orderType] || "#8E8E93";
    };

    const getStatusColor = (status?: string) => {
        const statusColors: { [key: string]: string } = {
            "Pending": "#FF9500",
            "Confirmed": "#007AFF",
            "Processing": "#5856D6",
            "Ready": "#5AC8FA",
            "Completed": "#34C759",
            "Cancelled": "#FF3B30",
        };
        return statusColors[status || "Pending"] || "#8E8E93";
    };

    const fetchSpareOrders = async () => {
        if (!customerId) return;
        
        setLoading(true);
        try {
            console.log('📦 Fetching spare orders for customer:', customerId);
            const response = await getCustomerSpareOrders(customerId);
            
            if (response.data?.code === 200) {
                const customerData = response.data.response?.data || response.data.response;
                // Extract spare orders from customer data
                const spareOrderData = customerData?.customerSpare || customerData?.spareOrders || [];
                console.log('✅ Spare orders fetched:', spareOrderData.length);
                setSpareOrders(spareOrderData);
            } else {
                console.log('⚠️ No spare orders found or API error');
                setSpareOrders([]);
            }
        } catch (error) {
            console.error('❌ Error fetching spare orders:', error);
            setSpareOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSpareOrderDetails = async (orderId: string) => {
        setDetailLoading(true);
        try {
            console.log('🔍 Fetching spare order details:', orderId);
            const response = await getSpareOrderDetails(orderId);
            
            if (response.data?.code === 200) {
                const orderDetails = response.data.response?.data || response.data.response;
                setSelectedOrder(orderDetails);
                setShowDetailModal(true);
            }
        } catch (error) {
            console.error('❌ Error fetching spare order details:', error);
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        fetchSpareOrders();
    }, [customerId]);

    const renderSpareOrderCard = (order: SpareOrder) => {
        const orderTypeColor = getOrderTypeColor(order.orderType);
        const statusColor = getStatusColor(order.status);

        return (
            <TouchableOpacity
                key={order.id}
                className="bg-white rounded-xl shadow-lg mb-4 overflow-hidden"
                onPress={() => fetchSpareOrderDetails(order.id)}
                activeOpacity={0.8}
            >
                {/* Header */}
                <View className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                            <Text className="text-lg font-bold text-gray-900 mb-1">
                                {order.orderNumber}
                            </Text>
                            <Text className="text-sm text-gray-600">
                                {moment(order.orderDate).format('DD-MM-YYYY')}
                            </Text>
                        </View>
                        <View className="flex-row items-center space-x-2">
                            <View
                                className="px-3 py-1 rounded-full"
                                style={{ backgroundColor: orderTypeColor + '20' }}
                            >
                                <Text className="text-xs font-medium" style={{ color: orderTypeColor }}>
                                    {order.orderType}
                                </Text>
                            </View>
                            {order.status && (
                                <View
                                    className="px-3 py-1 rounded-full"
                                    style={{ backgroundColor: statusColor + '20' }}
                                >
                                    <Text className="text-xs font-medium" style={{ color: statusColor }}>
                                        {order.status}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Order Details */}
                <View className="p-4">
                    {/* Vehicle Info */}
                    {order.soldVehicle && (
                        <View className="bg-gray-50 rounded-lg p-3 mb-3">
                            <View className="flex-row items-center mb-2">
                                <Car size={16} color="#6B7280" />
                                <Text className="text-sm font-semibold text-gray-700 ml-2">
                                    Vehicle Details
                                </Text>
                            </View>
                            {order.soldVehicle.modelName && (
                                <Text className="text-sm text-gray-600 mb-1">
                                    Model: <Text className="font-medium">{order.soldVehicle.modelName}</Text>
                                </Text>
                            )}
                            {order.soldVehicle.chassisNo && (
                                <Text className="text-sm text-gray-600 mb-1">
                                    Chassis: <Text className="font-medium">{order.soldVehicle.chassisNo}</Text>
                                </Text>
                            )}
                            {order.soldVehicle.registerNo && (
                                <Text className="text-sm text-gray-600 mb-1">
                                    Register: <Text className="font-medium">{order.soldVehicle.registerNo}</Text>
                                </Text>
                            )}
                            {order.soldVehicle.engineNo && (
                                <Text className="text-sm text-gray-600">
                                    Engine: <Text className="font-medium">{order.soldVehicle.engineNo}</Text>
                                </Text>
                            )}
                        </View>
                    )}

                    {/* Total Amount */}
                    {order.totalAmount && (
                        <View className="flex-row justify-between items-center">
                            <Text className="text-sm text-gray-600">Total Amount:</Text>
                            <Text className="text-lg font-bold text-green-600">
                                ₹{order.totalAmount.toLocaleString()}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Footer */}
                <View className="bg-gray-50 px-4 py-3 flex-row justify-between items-center">
                    <Text className="text-xs text-gray-500">
                        Order ID: {order.id}
                    </Text>
                    <View className="flex-row items-center">
                        <Text className="text-xs text-blue-600 mr-1">View Details</Text>
                        <ExternalLink size={12} color="#2563EB" />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderSpareOrderDetailModal = () => {
        if (!selectedOrder) return null;

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
                            Spare Order Details
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
                            {/* Order Header */}
                            <View className="bg-blue-50 rounded-lg p-4 mb-4">
                                <Text className="text-xl font-bold text-gray-900 mb-2">
                                    {selectedOrder.orderNumber}
                                </Text>
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-sm text-gray-600">
                                        Order Date: {moment(selectedOrder.orderDate).format('DD-MM-YYYY')}
                                    </Text>
                                    <View
                                        className="px-3 py-1 rounded-full"
                                        style={{ backgroundColor: getOrderTypeColor(selectedOrder.orderType) + '20' }}
                                    >
                                        <Text className="text-sm font-medium" style={{ color: getOrderTypeColor(selectedOrder.orderType) }}>
                                            {selectedOrder.orderType}
                                        </Text>
                                    </View>
                                </View>
                                {selectedOrder.status && (
                                    <View className="flex-row items-center">
                                        <View
                                            className="px-3 py-1 rounded-full"
                                            style={{ backgroundColor: getStatusColor(selectedOrder.status) + '20' }}
                                        >
                                            <Text className="text-sm font-medium" style={{ color: getStatusColor(selectedOrder.status) }}>
                                                {selectedOrder.status}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* Vehicle Details */}
                            {selectedOrder.soldVehicle && (
                                <View className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <Text className="text-lg font-semibold text-gray-900 mb-3">
                                        Vehicle Information
                                    </Text>
                                    {selectedOrder.soldVehicle.modelName && (
                                        <Text className="text-sm text-gray-700 mb-2">
                                            Model: <Text className="font-medium">{selectedOrder.soldVehicle.modelName}</Text>
                                        </Text>
                                    )}
                                    {selectedOrder.soldVehicle.color && (
                                        <Text className="text-sm text-gray-700 mb-2">
                                            Color: <Text className="font-medium">{selectedOrder.soldVehicle.color}</Text>
                                        </Text>
                                    )}
                                    {selectedOrder.soldVehicle.chassisNo && (
                                        <Text className="text-sm text-gray-700 mb-2">
                                            Chassis Number: <Text className="font-medium">{selectedOrder.soldVehicle.chassisNo}</Text>
                                        </Text>
                                    )}
                                    {selectedOrder.soldVehicle.engineNo && (
                                        <Text className="text-sm text-gray-700 mb-2">
                                            Engine Number: <Text className="font-medium">{selectedOrder.soldVehicle.engineNo}</Text>
                                        </Text>
                                    )}
                                    {selectedOrder.soldVehicle.registerNo && (
                                        <Text className="text-sm text-gray-700">
                                            Registration Number: <Text className="font-medium">{selectedOrder.soldVehicle.registerNo}</Text>
                                        </Text>
                                    )}
                                </View>
                            )}

                            {/* Order Summary */}
                            <View className="bg-green-50 rounded-lg p-4">
                                <Text className="text-lg font-semibold text-gray-900 mb-3">
                                    Order Summary
                                </Text>
                                {selectedOrder.totalAmount && (
                                    <View className="flex-row justify-between items-center mb-2">
                                        <Text className="text-sm text-gray-600">Total Amount:</Text>
                                        <Text className="text-xl font-bold text-green-600">
                                            ₹{selectedOrder.totalAmount.toLocaleString()}
                                        </Text>
                                    </View>
                                )}
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-sm text-gray-600">Order ID:</Text>
                                    <Text className="text-sm font-medium text-gray-900">
                                        {selectedOrder.id}
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
                    <Text className="text-gray-500 mt-2">Loading spare orders...</Text>
                </View>
            ) : spareOrders.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <Package size={48} color="#9CA3AF" />
                    <Text className="text-gray-500 mt-3 text-center px-4">
                        No spare orders found for this customer
                    </Text>
                </View>
            ) : (
                <ScrollView className="flex-1 px-4 py-2" showsVerticalScrollIndicator={false}>
                    {spareOrders.map(renderSpareOrderCard)}
                </ScrollView>
            )}

            {renderSpareOrderDetailModal()}
        </View>
    );
};

export default SpareOrdersSection;
