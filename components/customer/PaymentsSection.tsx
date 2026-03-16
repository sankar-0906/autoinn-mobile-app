import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
} from 'react-native';
import {
    CreditCard,
    Calendar,
    DollarSign,
    CheckCircle,
    XCircle,
    Clock,
    X,
    TrendingUp,
    TrendingDown,
    Wallet,
    Smartphone,
    Building,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import moment from 'moment';
import { getCustomerPayments } from '../../src/api';

interface Payment {
    id: string;
    bookingId?: string;
    billAmount: number;
    method: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    createdAt: string;
    transactionId?: string;
    paymentType?: string;
    description?: string;
    customerName?: string;
    customerPhone?: string;
}

interface PaymentsSectionProps {
    customerId: string;
}

const PaymentsSection: React.FC<PaymentsSectionProps> = ({ customerId }) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const getStatusColor = (status: string) => {
        const statusColors: { [key: string]: string } = {
            'SUCCESS': '#10B981',
            'FAILED': '#EF4444',
            'PENDING': '#F59E0B',
            'PROCESSING': '#3B82F6',
            'REFUNDED': '#8B5CF6',
        };
        return statusColors[status] || '#6B7280';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SUCCESS':
                return <CheckCircle size={16} color="#fff" />;
            case 'FAILED':
                return <XCircle size={16} color="#fff" />;
            case 'PENDING':
                return <Clock size={16} color="#fff" />;
            case 'PROCESSING':
                return <Clock size={16} color="#fff" />;
            default:
                return <Clock size={16} color="#fff" />;
        }
    };

    const getPaymentMethodIcon = (method: string) => {
        const methodIcons: { [key: string]: React.ReactNode } = {
            'CASH': <Wallet size={20} color="#6B7280" />,
            'CARD': <CreditCard size={20} color="#6B7280" />,
            'UPI': <Smartphone size={20} color="#6B7280" />,
            'BANK': <Building size={20} color="#6B7280" />,
            'ONLINE': <TrendingUp size={20} color="#6B7280" />,
            'CHEQUE': <CreditCard size={20} color="#6B7280" />,
        };
        return methodIcons[method] || <CreditCard size={20} color="#6B7280" />;
    };

    const getPaymentMethodColor = (method: string) => {
        const methodColors: { [key: string]: string } = {
            'CASH': '#10B981',
            'CARD': '#3B82F6',
            'UPI': '#8B5CF6',
            'BANK': '#F59E0B',
            'ONLINE': '#06B6D4',
            'CHEQUE': '#6B7280',
        };
        return methodColors[method] || '#6B7280';
    };

    const fetchPayments = async () => {
        if (!customerId) return;
        
        setLoading(true);
        try {
            console.log('💳 Fetching payments for customer:', customerId);
            const response = await getCustomerPayments(customerId);
            
            if (response.data?.code === 200) {
                const customerData = response.data.response?.data || response.data.response;
                // Extract payments from customer data
                const paymentData = customerData?.payment || customerData?.payments || [];
                console.log('✅ Payments fetched:', paymentData.length);
                setPayments(paymentData);
            } else {
                console.log('⚠️ No payments found or API error');
                setPayments([]);
            }
        } catch (error) {
            console.error('❌ Error fetching payments:', error);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [customerId]);

    const calculateTotalAmount = (status?: string) => {
        const filteredPayments = status 
            ? payments.filter(p => p.status === status)
            : payments;
        return filteredPayments.reduce((total, payment) => total + payment.billAmount, 0);
    };

    const renderPaymentCard = (payment: Payment) => {
        const statusColor = getStatusColor(payment.status);
        const methodColor = getPaymentMethodColor(payment.method);

        return (
            <TouchableOpacity
                key={payment.id}
                className="bg-white rounded-xl shadow-lg mb-4 overflow-hidden"
                onPress={() => {
                    setSelectedPayment(payment);
                    setShowDetailModal(true);
                }}
                activeOpacity={0.8}
            >
                {/* Header */}
                <View className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 border-b border-gray-200">
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                            <View className="flex-row items-center mb-1">
                                {getPaymentMethodIcon(payment.method)}
                                <Text className="text-lg font-bold text-gray-900 ml-2">
                                    ₹{payment.billAmount.toLocaleString()}
                                </Text>
                            </View>
                            {payment.transactionId && (
                                <Text className="text-sm text-gray-600">
                                    Txn ID: {payment.transactionId}
                                </Text>
                            )}
                        </View>
                        <View
                            className="px-3 py-1 rounded-full flex-row items-center"
                            style={{ backgroundColor: statusColor + '20' }}
                        >
                            <View className="mr-1">
                                {getStatusIcon(payment.status)}
                            </View>
                            <Text className="text-xs font-medium" style={{ color: statusColor }}>
                                {payment.status}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Payment Details */}
                <View className="p-4">
                    {/* Method and Date */}
                    <View className="flex-row justify-between items-center mb-3">
                        <View className="flex-row items-center">
                            <View
                                className="px-2 py-1 rounded"
                                style={{ backgroundColor: methodColor + '20' }}
                            >
                                <Text className="text-xs font-medium" style={{ color: methodColor }}>
                                    {payment.method}
                                </Text>
                            </View>
                        </View>
                        <Text className="text-sm text-gray-500">
                            {moment(payment.createdAt).format('DD-MM-YYYY HH:mm')}
                        </Text>
                    </View>

                    {/* Additional Details */}
                    {payment.bookingId && (
                        <Text className="text-sm text-gray-600 mb-1">
                            Booking ID: <Text className="font-medium">{payment.bookingId}</Text>
                        </Text>
                    )}

                    {payment.description && (
                        <Text className="text-sm text-gray-600 mb-1">
                            Description: <Text className="font-medium">{payment.description}</Text>
                        </Text>
                    )}

                    {payment.paymentType && (
                        <Text className="text-sm text-gray-600 mb-1">
                            Type: <Text className="font-medium">{payment.paymentType}</Text>
                        </Text>
                    )}

                    {/* Customer Info */}
                    {(payment.customerName || payment.customerPhone) && (
                        <View className="bg-gray-50 rounded-lg p-2 mt-2">
                            {payment.customerName && (
                                <Text className="text-xs text-gray-600">
                                    Customer: <Text className="font-medium">{payment.customerName}</Text>
                                </Text>
                            )}
                            {payment.customerPhone && (
                                <Text className="text-xs text-gray-600">
                                    Phone: <Text className="font-medium">{payment.customerPhone}</Text>
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Footer */}
                <View className="bg-gray-50 px-4 py-3 flex-row justify-between items-center">
                    <Text className="text-xs text-gray-500">
                        Payment ID: {payment.id}
                    </Text>
                    <View className="flex-row items-center">
                        <Text className="text-xs text-blue-600 mr-1">View Details</Text>
                        <TrendingUp size={12} color="#2563EB" />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderPaymentDetailModal = () => {
        if (!selectedPayment) return null;

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
                            Payment Details
                        </Text>
                        <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                            <X size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 p-4">
                        {/* Payment Amount */}
                        <View className="bg-green-50 rounded-lg p-4 mb-4">
                            <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-row items-center">
                                    {getPaymentMethodIcon(selectedPayment.method)}
                                    <Text className="text-2xl font-bold text-gray-900 ml-3">
                                        ₹{selectedPayment.billAmount.toLocaleString()}
                                    </Text>
                                </View>
                                <View
                                    className="px-3 py-1 rounded-full flex-row items-center"
                                    style={{ backgroundColor: getStatusColor(selectedPayment.status) + '20' }}
                                >
                                    <View className="mr-1">
                                        {getStatusIcon(selectedPayment.status)}
                                    </View>
                                    <Text className="text-sm font-medium" style={{ color: getStatusColor(selectedPayment.status) }}>
                                        {selectedPayment.status}
                                    </Text>
                                </View>
                            </View>
                            
                            {selectedPayment.transactionId && (
                                <Text className="text-sm text-gray-600">
                                    Transaction ID: <Text className="font-medium">{selectedPayment.transactionId}</Text>
                                </Text>
                            )}
                        </View>

                        {/* Payment Information */}
                        <View className="bg-blue-50 rounded-lg p-4 mb-4">
                            <Text className="text-lg font-semibold text-gray-900 mb-3">
                                Payment Information
                            </Text>
                            
                            <View className="space-y-2">
                                <Text className="text-sm text-gray-700">
                                    Method: <Text className="font-medium">{selectedPayment.method}</Text>
                                </Text>
                                
                                {selectedPayment.paymentType && (
                                    <Text className="text-sm text-gray-700">
                                        Type: <Text className="font-medium">{selectedPayment.paymentType}</Text>
                                    </Text>
                                )}
                                
                                <Text className="text-sm text-gray-700">
                                    Date & Time: <Text className="font-medium">
                                        {moment(selectedPayment.createdAt).format('DD-MM-YYYY HH:mm:ss')}
                                    </Text>
                                </Text>
                                
                                <Text className="text-sm text-gray-700">
                                    Status: <Text className="font-medium" style={{ color: getStatusColor(selectedPayment.status) }}>
                                        {selectedPayment.status}
                                    </Text>
                                </Text>
                            </View>
                        </View>

                        {/* Booking Information */}
                        {selectedPayment.bookingId && (
                            <View className="bg-purple-50 rounded-lg p-4 mb-4">
                                <Text className="text-lg font-semibold text-gray-900 mb-3">
                                    Related Booking
                                </Text>
                                <Text className="text-sm text-gray-700">
                                    Booking ID: <Text className="font-medium">{selectedPayment.bookingId}</Text>
                                </Text>
                            </View>
                        )}

                        {/* Customer Information */}
                        {(selectedPayment.customerName || selectedPayment.customerPhone) && (
                            <View className="bg-gray-50 rounded-lg p-4 mb-4">
                                <Text className="text-lg font-semibold text-gray-900 mb-3">
                                    Customer Information
                                </Text>
                                {selectedPayment.customerName && (
                                    <Text className="text-sm text-gray-700 mb-2">
                                        Name: <Text className="font-medium">{selectedPayment.customerName}</Text>
                                    </Text>
                                )}
                                {selectedPayment.customerPhone && (
                                    <Text className="text-sm text-gray-700">
                                        Phone: <Text className="font-medium">{selectedPayment.customerPhone}</Text>
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Additional Details */}
                        {selectedPayment.description && (
                            <View className="bg-yellow-50 rounded-lg p-4 mb-4">
                                <Text className="text-lg font-semibold text-gray-900 mb-3">
                                    Description
                                </Text>
                                <Text className="text-sm text-gray-700">
                                    {selectedPayment.description}
                                </Text>
                            </View>
                        )}

                        {/* Payment Summary */}
                        <View className="bg-emerald-50 rounded-lg p-4">
                            <Text className="text-lg font-semibold text-gray-900 mb-3">
                                Payment Summary
                            </Text>
                            <View className="space-y-2">
                                <View className="flex-row justify-between">
                                    <Text className="text-sm text-gray-600">Amount Paid:</Text>
                                    <Text className="text-lg font-bold text-green-600">
                                        ₹{selectedPayment.billAmount.toLocaleString()}
                                    </Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-sm text-gray-600">Payment Method:</Text>
                                    <Text className="text-sm font-medium" style={{ color: getPaymentMethodColor(selectedPayment.method) }}>
                                        {selectedPayment.method}
                                    </Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-sm text-gray-600">Payment ID:</Text>
                                    <Text className="text-sm font-medium text-gray-900">
                                        {selectedPayment.id}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        );
    };

    const renderSummaryCards = () => {
        const successAmount = calculateTotalAmount('SUCCESS');
        const pendingAmount = calculateTotalAmount('PENDING');
        const failedAmount = calculateTotalAmount('FAILED');
        const totalAmount = calculateTotalAmount();

        return (
            <View className="px-4 py-2">
                {/* Total Card */}
                <View className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 mb-3">
                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text className="text-white text-sm font-medium mb-1">Total Transactions</Text>
                            <Text className="text-white text-2xl font-bold">₹{totalAmount.toLocaleString()}</Text>
                        </View>
                        <DollarSign size={32} color="#fff" />
                    </View>
                    <Text className="text-white text-xs mt-2 opacity-80">
                        {payments.length} transactions
                    </Text>
                </View>

                {/* Status Cards */}
                <View className="flex-row space-x-3">
                    {/* Success */}
                    <View className="flex-1 bg-green-50 rounded-lg p-3">
                        <CheckCircle size={20} color="#10B981" />
                        <Text className="text-green-800 text-xs font-medium mt-1">Success</Text>
                        <Text className="text-green-600 text-lg font-bold">₹{successAmount.toLocaleString()}</Text>
                    </View>

                    {/* Pending */}
                    <View className="flex-1 bg-yellow-50 rounded-lg p-3">
                        <Clock size={20} color="#F59E0B" />
                        <Text className="text-yellow-800 text-xs font-medium mt-1">Pending</Text>
                        <Text className="text-yellow-600 text-lg font-bold">₹{pendingAmount.toLocaleString()}</Text>
                    </View>

                    {/* Failed */}
                    <View className="flex-1 bg-red-50 rounded-lg p-3">
                        <XCircle size={20} color="#EF4444" />
                        <Text className="text-red-800 text-xs font-medium mt-1">Failed</Text>
                        <Text className="text-red-600 text-lg font-bold">₹{failedAmount.toLocaleString()}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1">
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text className="text-gray-500 mt-2">Loading payments...</Text>
                </View>
            ) : payments.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <CreditCard size={48} color="#9CA3AF" />
                    <Text className="text-gray-500 mt-3 text-center px-4">
                        No payments found for this customer
                    </Text>
                </View>
            ) : (
                <View className="flex-1">
                    {renderSummaryCards()}
                    <ScrollView className="flex-1 px-4 pb-2" showsVerticalScrollIndicator={false}>
                        {payments.map(renderPaymentCard)}
                    </ScrollView>
                </View>
            )}

            {renderPaymentDetailModal()}
        </View>
    );
};

export default PaymentsSection;
