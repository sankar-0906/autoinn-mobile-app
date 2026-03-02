import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Eye } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../../components/ui/Button';
import { COLORS } from '../../constants/colors';

const CUSTOMER_TABS = [
    { id: 'customer-details', label: 'Customer Details' },
    { id: 'associated-vehicles', label: 'Associated Vehicles' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'quotations', label: 'Quotations' },
    { id: 'job-orders', label: 'Job Orders' },
    { id: 'spare-orders', label: 'Spare Orders' },
    { id: 'call-history', label: 'Call History' },
    { id: 'number-plates', label: 'Number Plates' },
    { id: 'payments', label: 'Payments' },
] as const;

export default function CustomerDetailsScreen() {
    const navigation = useNavigation<any>();
    const [customerTab, setCustomerTab] = useState<(typeof CUSTOMER_TABS)[number]['id']>('customer-details');

    const customer = {
        name: 'new dev',
        customerId: 'CNS33355',
        customerType: 'Non Customer',
        gender: 'Female',
        age: '22Y',
        location: 'Dharanapuram',
        mobile: '••••••••95',
        fatherName: 'Ravi',
        email: 'newdev@example.com',
        locality: 'Dharanapuram',
        pincode: '638656',
    };

    const quotations = [
        { id: 'QDE/25-26/441', vehicle: 'FZ FI V3', createdOn: '16/09/2025' },
        { id: 'QDE/25-26/462', vehicle: 'FZ FI V3', createdOn: '17/09/2025' },
        { id: 'QDE/25-26/454', vehicle: 'FZ S FI V4 DLX', createdOn: '06/10/2025' },
    ];

    const renderTabContent = () => {
        if (customerTab === 'customer-details') {
            return (
                <View>
                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
                        <Text className="text-sm text-gray-500 mb-1">Customer Name</Text>
                        <Text className="text-base text-gray-900 font-semibold">{customer.name}</Text>
                    </View>
                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
                        <Text className="text-sm text-gray-500 mb-1">Father Name</Text>
                        <Text className="text-base text-gray-900">{customer.fatherName}</Text>
                    </View>
                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
                        <Text className="text-sm text-gray-500 mb-1">Mobile</Text>
                        <Text className="text-base text-gray-900">+91 {customer.mobile}</Text>
                    </View>
                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
                        <Text className="text-sm text-gray-500 mb-1">Email</Text>
                        <Text className="text-base text-gray-900">{customer.email}</Text>
                    </View>
                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
                        <Text className="text-sm text-gray-500 mb-1">Address</Text>
                        <Text className="text-base text-gray-900">{customer.locality}, {customer.pincode}</Text>
                    </View>
                </View>
            );
        }

        if (customerTab === 'bookings') {
            return (
                <View className="bg-white rounded-xl border border-gray-100 p-4">
                    <Text className="text-gray-900 font-semibold mb-2">Bookings</Text>
                    <Text className="text-sm text-gray-500">No bookings found for this customer</Text>
                </View>
            );
        }

        if (customerTab === 'quotations') {
            return (
                <View className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <View className="bg-gray-100 px-3 py-3 flex-row border-b border-gray-200">
                        <Text className="text-[10px] font-bold text-gray-700 w-24">Date</Text>
                        <Text className="text-[10px] font-bold text-gray-700 flex-1">Quotation ID</Text>
                        <Text className="text-[10px] font-bold text-gray-700 flex-1">Model</Text>
                        <Text className="text-[10px] font-bold text-gray-700 w-14 text-center">Action</Text>
                    </View>
                    {quotations.map((q, index) => (
                        <View key={q.id} className={`px-3 py-3 flex-row items-center border-b border-gray-50 ${index % 2 ? 'bg-gray-50/50' : 'bg-white'}`}>
                            <Text className="text-[10px] text-gray-600 w-24">17/02/2026</Text>
                            <Text className="text-[10px] text-teal-600 font-bold flex-1">{q.id}</Text>
                            <Text className="text-[10px] text-gray-800 flex-1" numberOfLines={1}>{q.vehicle}</Text>
                            <TouchableOpacity
                                className="w-14 items-center"
                                onPress={() => navigation.navigate('QuotationView', { id: q.id })}
                            >
                                <Eye size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            );
        }

        return (
            <View className="bg-white rounded-xl border border-gray-100 p-10">
                <Text className="text-center text-gray-400">No data available</Text>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white border-b border-gray-100 px-4 py-3 flex-row items-center">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
                    <ChevronLeft size={22} color={COLORS.gray[900]} />
                </TouchableOpacity>
                <Text className="text-gray-900 text-lg font-bold">Customer Details</Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="border-b border-gray-200 bg-white"
                style={{ height: 38 }}
                contentContainerStyle={{ paddingHorizontal: 8, alignItems: 'center' }}
            >
                {CUSTOMER_TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => setCustomerTab(tab.id)}
                        className={`px-3 py-1.5 border-b-2 ${customerTab === tab.id ? 'border-teal-600' : 'border-transparent'}`}
                    >
                        <Text className={`text-[11px] font-bold ${customerTab === tab.id ? 'text-teal-600' : 'text-gray-600'}`}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 24 }}>
                {renderTabContent()}
            </ScrollView>

            <View className="bg-white border-t border-gray-100 p-4 flex-row shadow-2xl">
                <Button title="Cancel" variant="outline" className="flex-1 mr-2 px-0" onPress={() => navigation.goBack()} />
                <Button title="Save" className="flex-1 ml-2 px-0" onPress={() => navigation.goBack()} />
            </View>
        </SafeAreaView>
    );
}
