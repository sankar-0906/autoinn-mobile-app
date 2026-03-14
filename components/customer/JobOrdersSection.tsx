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
import { Ionicons } from '@expo/vector-icons';
import {
    Wrench,
    Calendar,
    FileText,
    CheckCircle,
    Clock,
    AlertCircle,
    User,
    Car,
    X,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import moment from 'moment';
import { getCustomerJobOrders, getJobOrderDetails } from '../../src/api';

const { width: screenWidth } = Dimensions.get('window');

interface JobOrder {
    id: string;
    jobNo: string;
    dateTime: string;
    serviceType: string;
    jobStatus: string;
    vehicle?: {
        color?: {
            code: string;
            color: string;
            url?: string;
        };
        chassisNo?: string;
        engineNo?: string;
        registerNo?: string;
        modelName?: string;
    };
}

interface JobOrdersSectionProps {
    customerId: string;
}

const JobOrdersSection: React.FC<JobOrdersSectionProps> = ({ customerId }) => {
    const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedJob, setSelectedJob] = useState<JobOrder | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    const jobStatuses = [
        "Vehicle Received",
        "Estimation",
        "Mechanic Allocated",
        "Work in Progress",
        "Final Inspection",
        "Ready For Delivery",
        "Delivered",
    ];

    const getStatusColor = (status: string) => {
        const statusColors: { [key: string]: string } = {
            "Vehicle Received": "#FF9500",
            "Estimation": "#007AFF",
            "Mechanic Allocated": "#5856D6",
            "Work in Progress": "#34C759",
            "Final Inspection": "#AF52DE",
            "Ready For Delivery": "#5AC8FA",
            "Delivered": "#34C759",
        };
        return statusColors[status] || "#8E8E93";
    };

    const getStatusIcon = (status: string) => {
        const iconMap: { [key: string]: React.ReactNode } = {
            "Vehicle Received": <Clock size={16} color="#fff" />,
            "Estimation": <FileText size={16} color="#fff" />,
            "Mechanic Allocated": <Wrench size={16} color="#fff" />,
            "Work in Progress": <Wrench size={16} color="#fff" />,
            "Final Inspection": <CheckCircle size={16} color="#fff" />,
            "Ready For Delivery": <Car size={16} color="#fff" />,
            "Delivered": <CheckCircle size={16} color="#fff" />,
        };
        return iconMap[status] || <AlertCircle size={16} color="#fff" />;
    };

    const getCurrentStepIndex = (status: string) => {
        if (!status) return -1;
        if (["PAID", "Delivered"].includes(status)) return jobStatuses.length - 1;
        return jobStatuses.findIndex(s => s.toLowerCase() === status.toLowerCase());
    };

    const fetchJobOrders = async () => {
        if (!customerId) return;
        
        setLoading(true);
        try {
            console.log('🔧 Fetching job orders for customer:', customerId);
            const response = await getCustomerJobOrders(customerId);
            
            if (response.data?.code === 200) {
                const customerData = response.data.response?.data || response.data.response;
                // Extract job orders from customer data
                const jobOrderData = customerData?.jobOrder || customerData?.jobOrders || [];
                console.log('✅ Job orders fetched:', jobOrderData.length);
                setJobOrders(jobOrderData);
            } else {
                console.log('⚠️ No job orders found or API error');
                setJobOrders([]);
            }
        } catch (error) {
            console.error('❌ Error fetching job orders:', error);
            setJobOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchJobOrderDetails = async (jobOrderId: string) => {
        setDetailLoading(true);
        try {
            console.log('🔍 Fetching job order details:', jobOrderId);
            const response = await getJobOrderDetails(jobOrderId);
            
            if (response.data?.code === 200) {
                const jobDetails = response.data.response?.data || response.data.response;
                setSelectedJob(jobDetails);
                setShowDetailModal(true);
            }
        } catch (error) {
            console.error('❌ Error fetching job order details:', error);
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        fetchJobOrders();
    }, [customerId]);

    const renderJobOrderCard = (job: JobOrder) => {
        const currentIndex = getCurrentStepIndex(job.jobStatus);
        const statusColor = getStatusColor(job.jobStatus);

        return (
            <TouchableOpacity
                key={job.id}
                className="bg-white rounded-xl shadow-lg mb-4 overflow-hidden"
                onPress={() => fetchJobOrderDetails(job.id)}
                activeOpacity={0.8}
            >
                {/* Header with vehicle image */}
                <View className="bg-gray-50 p-4 border-b border-gray-200">
                    <View className="flex-row">
                        {/* Vehicle Image */}
                        <View className="w-32 h-24 bg-white rounded-lg shadow-sm mr-3">
                            {job.vehicle?.color?.url ? (
                                <Image
                                    source={{ uri: job.vehicle.color.url }}
                                    className="w-full h-full rounded-lg"
                                    resizeMode="cover"
                                />
                            ) : (
                                <View className="w-full h-full rounded-lg bg-gray-200 items-center justify-center">
                                    <Car size={24} color="#9CA3AF" />
                                </View>
                            )}
                        </View>

                        {/* Job Info */}
                        <View className="flex-1">
                            <Text className="text-lg font-bold text-gray-900 mb-1">
                                Job No: {job.jobNo}
                            </Text>
                            <Text className="text-sm text-gray-600 mb-1">
                                {moment(job.dateTime).format('DD-MM-YYYY')}
                            </Text>
                            <Text className="text-sm text-gray-600">
                                Service: {job.serviceType}
                            </Text>
                            {job.vehicle?.color && (
                                <View className="flex-row items-center mt-1">
                                    <View className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: job.vehicle.color.code }} />
                                    <Text className="text-xs text-gray-500">
                                        {job.vehicle.color.code} - {job.vehicle.color.color}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Status and Vehicle Details */}
                <View className="p-4">
                    <View className="flex-row justify-between items-center mb-3">
                        <View className="flex-row items-center">
                            <View
                                className="px-3 py-1 rounded-full flex-row items-center"
                                style={{ backgroundColor: statusColor + '20' }}
                            >
                                <View className="mr-1">
                                    {getStatusIcon(job.jobStatus)}
                                </View>
                                <Text className="text-sm font-medium" style={{ color: statusColor }}>
                                    {job.jobStatus}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Vehicle Details */}
                    <View className="space-y-1">
                        {job.vehicle?.chassisNo && (
                            <Text className="text-sm text-gray-600">
                                Chassis No: <Text className="font-medium">{job.vehicle.chassisNo}</Text>
                            </Text>
                        )}
                        {job.vehicle?.engineNo && (
                            <Text className="text-sm text-gray-600">
                                Engine No: <Text className="font-medium">{job.vehicle.engineNo}</Text>
                            </Text>
                        )}
                        {job.vehicle?.registerNo && (
                            <Text className="text-sm text-gray-600">
                                Register No: <Text className="font-medium">{job.vehicle.registerNo}</Text>
                            </Text>
                        )}
                    </View>
                </View>

                {/* Progress Tracker */}
                <View className="px-4 pb-4">
                    <View className="relative">
                        {/* Background line */}
                        <View className="absolute h-1 bg-gray-200 top-3 left-0 right-0" />
                        
                        {/* Progress line */}
                        <View
                            className="absolute h-1 top-3 left-0"
                            style={{
                                width: `${(currentIndex / (jobStatuses.length - 1)) * 100}%`,
                                backgroundColor: statusColor,
                            }}
                        />

                        {/* Status dots */}
                        <View className="flex-row justify-between relative">
                            {jobStatuses.map((status, index) => {
                                const isActive = index <= currentIndex;
                                return (
                                    <View key={status} className="items-center">
                                        <View
                                            className="w-6 h-6 rounded-full items-center justify-center"
                                            style={{
                                                backgroundColor: isActive ? statusColor : '#E5E7EB',
                                                borderWidth: 2,
                                                borderColor: isActive ? statusColor : '#9CA3AF',
                                            }}
                                        >
                                            {isActive && (
                                                <CheckCircle size={12} color="#fff" />
                                            )}
                                        </View>
                                        <Text className="text-xs text-gray-500 mt-1 text-center w-12">
                                            {status.split(' ')[0]}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderJobOrderDetailModal = () => {
        if (!selectedJob) return null;

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
                            Job Order Details
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
                            {/* Job Header */}
                            <View className="bg-gray-50 rounded-lg p-4 mb-4">
                                <Text className="text-lg font-bold text-gray-900 mb-2">
                                    Job No: {selectedJob.jobNo}
                                </Text>
                                <Text className="text-sm text-gray-600">
                                    Date: {moment(selectedJob.dateTime).format('DD-MM-YYYY HH:mm')}
                                </Text>
                                <Text className="text-sm text-gray-600">
                                    Service: {selectedJob.serviceType}
                                </Text>
                                <View className="flex-row items-center mt-2">
                                    <View
                                        className="px-3 py-1 rounded-full flex-row items-center"
                                        style={{ backgroundColor: getStatusColor(selectedJob.jobStatus) + '20' }}
                                    >
                                        <View className="mr-1">
                                            {getStatusIcon(selectedJob.jobStatus)}
                                        </View>
                                        <Text className="text-sm font-medium" style={{ color: getStatusColor(selectedJob.jobStatus) }}>
                                            {selectedJob.jobStatus}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Vehicle Details */}
                            {selectedJob.vehicle && (
                                <View className="bg-blue-50 rounded-lg p-4 mb-4">
                                    <Text className="text-lg font-semibold text-gray-900 mb-3">
                                        Vehicle Details
                                    </Text>
                                    {selectedJob.vehicle.color?.url && (
                                        <Image
                                            source={{ uri: selectedJob.vehicle.color.url }}
                                            className="w-full h-48 rounded-lg mb-3"
                                            resizeMode="cover"
                                        />
                                    )}
                                    {selectedJob.vehicle.modelName && (
                                        <Text className="text-sm text-gray-700 mb-1">
                                            Model: <Text className="font-medium">{selectedJob.vehicle.modelName}</Text>
                                        </Text>
                                    )}
                                    {selectedJob.vehicle.color && (
                                        <Text className="text-sm text-gray-700 mb-1">
                                            Color: <Text className="font-medium">{selectedJob.vehicle.color.code} - {selectedJob.vehicle.color.color}</Text>
                                        </Text>
                                    )}
                                    {selectedJob.vehicle.chassisNo && (
                                        <Text className="text-sm text-gray-700 mb-1">
                                            Chassis No: <Text className="font-medium">{selectedJob.vehicle.chassisNo}</Text>
                                        </Text>
                                    )}
                                    {selectedJob.vehicle.engineNo && (
                                        <Text className="text-sm text-gray-700 mb-1">
                                            Engine No: <Text className="font-medium">{selectedJob.vehicle.engineNo}</Text>
                                        </Text>
                                    )}
                                    {selectedJob.vehicle.registerNo && (
                                        <Text className="text-sm text-gray-700">
                                            Register No: <Text className="font-medium">{selectedJob.vehicle.registerNo}</Text>
                                        </Text>
                                    )}
                                </View>
                            )}

                            {/* Progress Timeline */}
                            <View className="bg-green-50 rounded-lg p-4">
                                <Text className="text-lg font-semibold text-gray-900 mb-3">
                                    Progress Timeline
                                </Text>
                                <View className="space-y-3">
                                    {jobStatuses.map((status, index) => {
                                        const isActive = index <= getCurrentStepIndex(selectedJob.jobStatus);
                                        const isCompleted = index < getCurrentStepIndex(selectedJob.jobStatus);
                                        return (
                                            <View key={status} className="flex-row items-center">
                                                <View
                                                    className="w-4 h-4 rounded-full mr-3"
                                                    style={{
                                                        backgroundColor: isActive ? getStatusColor(selectedJob.jobStatus) : '#E5E7EB',
                                                    }}
                                                />
                                                <Text
                                                    className={`flex-1 ${isActive ? 'text-gray-900 font-medium' : 'text-gray-400'}`}
                                                >
                                                    {status}
                                                </Text>
                                                {isCompleted && (
                                                    <CheckCircle size={16} color={getStatusColor(selectedJob.jobStatus)} />
                                                )}
                                            </View>
                                        );
                                    })}
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
                    <Text className="text-gray-500 mt-2">Loading job orders...</Text>
                </View>
            ) : jobOrders.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <Wrench size={48} color="#9CA3AF" />
                    <Text className="text-gray-500 mt-3 text-center px-4">
                        No job orders found for this customer
                    </Text>
                </View>
            ) : (
                <ScrollView className="flex-1 px-4 py-2" showsVerticalScrollIndicator={false}>
                    {jobOrders.map(renderJobOrderCard)}
                </ScrollView>
            )}

            {renderJobOrderDetailModal()}
        </View>
    );
};

export default JobOrdersSection;
