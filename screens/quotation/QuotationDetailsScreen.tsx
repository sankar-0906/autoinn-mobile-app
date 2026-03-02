import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChevronLeft, Calendar, User, MapPin, Truck, FileText } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

type QuotationDetailsRouteProp = RouteProp<RootStackParamList, 'QuotationDetails'>;
type NavigationProp = StackNavigationProp<RootStackParamList, 'QuotationDetails'>;

export default function QuotationDetailsScreen({ navigation, route }: { navigation: NavigationProp; route: QuotationDetailsRouteProp }) {
    const { id } = route.params;
    const [status, setStatus] = useState(0);

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
                    <ChevronLeft color={COLORS.gray[900]} size={24} />
                </TouchableOpacity>
                <Text className="text-gray-900 text-lg font-bold">Quotation Details</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                    {/* Card 1: ID & Date */}
                    <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-gray-500 font-medium">Quotation ID</Text>
                            <Text className="text-teal-600 font-bold">{id}</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                            <Text className="text-gray-500 font-medium">Created On</Text>
                            <View className="flex-row items-center bg-gray-100 px-3 py-1 rounded-lg">
                                <Calendar size={14} color={COLORS.gray[600]} />
                                <Text className="text-gray-900 ml-2 font-medium">17/02/2026</Text>
                            </View>
                        </View>
                    </View>

                    {/* Card 2: Customer Info */}
                    <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
                        <Text className="text-gray-900 font-bold text-base mb-4 border-b border-gray-50 pb-2">Customer Information</Text>
                        <Input label="Customer Name" value="Rajesh Kumar" editable={false} />
                        <Input label="Mobile Number" value="+91 9876543210" editable={false} />
                        <View className="flex-row items-center mt-2">
                            <View className="flex-1 mr-2">
                                <Text className="text-gray-500 text-xs mb-1">Gender</Text>
                                <View className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <Text className="text-gray-900">Male</Text>
                                </View>
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-500 text-xs mb-1">Type</Text>
                                <View className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <Text className="text-gray-900">New Customer</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Card 3: Vehicle Info */}
                    <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
                        <Text className="text-gray-900 font-bold text-base mb-4 border-b border-gray-50 pb-2">Vehicle Details</Text>
                        <View className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex-row items-center mb-4">
                            <Truck size={20} color={COLORS.blue[700]} />
                            <View className="ml-3">
                                <Text className="text-blue-900 font-bold">Ray ZR 125 Fi Hybrid Disc</Text>
                                <Text className="text-blue-700 text-xs mt-0.5">Model: BKX500</Text>
                            </View>
                        </View>
                        <Input label="Enquiry Type" value="Hot" editable={false} />
                        <Input label="Lead Source" value="Walk-in" editable={false} />
                    </View>

                    {/* Card 4: Status Stepper */}
                    <View className="bg-white rounded-xl p-4 shadow-sm mb-10">
                        <Text className="text-gray-900 font-bold text-base mb-4 border-b border-gray-50 pb-2">Status Timeline</Text>
                        <View className="flex-row justify-between mb-8 px-2">
                            {['Quoted', 'Booked', 'Sold'].map((label, index) => (
                                <View key={label} className="items-center flex-1">
                                    <View className={`w-4 h-4 rounded-full z-10 ${status >= index ? 'bg-teal-600' : 'bg-gray-200'}`} />
                                    <Text className={`text-[10px] mt-2 font-bold ${status >= index ? 'text-teal-600' : 'text-gray-400'}`}>{label}</Text>
                                </View>
                            ))}
                            <View className="absolute top-2 left-0 right-0 h-0.5 bg-gray-100 mx-10 -z-10" />
                            <View
                                className="absolute top-2 left-0 h-0.5 bg-teal-600 mx-10 -z-10"
                                style={{ width: `${(status / 2) * 100}%` }}
                            />
                        </View>

                        <View className="flex-row gap-3">
                            <Button
                                title="PDF"
                                variant="outline"
                                className="flex-1"
                                onPress={() => { }}
                                icon={<FileText size={18} color={COLORS.primary} />}
                            />
                            <Button
                                title="Follow-Up"
                                className="flex-1"
                                onPress={() => navigation.navigate('Main')}
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
