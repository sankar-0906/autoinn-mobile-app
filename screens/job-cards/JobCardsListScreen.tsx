import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, Phone, Clipboard, Clock, CheckCircle, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

interface JobCard {
    id: string;
    regNo: string;
    customerName: string;
    model: string;
    serviceType: string;
    date: string;
    time: string;
    status: "Vehicle Received" | "In Progress" | "Completed";
    progress: number;
}

const mockJobCards: JobCard[] = [
    {
        id: "JDE25-26/1053",
        regNo: "KA04JK3463",
        customerName: "Srinivas",
        model: "Alpha Disc",
        serviceType: "Paid (AW)",
        date: "19-02-2026",
        time: "5:14:11 PM",
        status: "Vehicle Received",
        progress: 0,
    },
    {
        id: "JDE25-26/1052",
        regNo: "KA10EH8261",
        customerName: "Guru Prasad",
        model: "Ray ZR 125 Fi Hybrid Disc",
        serviceType: "PDI",
        date: "05-02-2026",
        time: "3:57:42 PM",
        status: "Vehicle Received",
        progress: 0,
    },
];

const TABS = ["Pending", "In Progress", "Completed", "All"];

export default function JobCardsListScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState("Pending");

    const filteredJobCards = mockJobCards.filter((jc) => {
        if (activeTab === "Pending" && jc.status !== "Vehicle Received") return false;
        if (activeTab === "In Progress" && jc.status !== "In Progress") return false;
        if (activeTab === "Completed" && jc.status !== "Completed") return false;

        if (searchQuery) {
            return (
                jc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                jc.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                jc.regNo.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return true;
    });

    const renderJobCardItem = ({ item }: { item: JobCard }) => (
        <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 mx-4">
            <View className="flex-row justify-between items-start mb-3">
                <View>
                    <Text className="text-teal-600 font-bold">{item.id}</Text>
                    <Text className="text-gray-900 font-bold text-lg mt-0.5">{item.regNo}</Text>
                </View>
                <View className="bg-gray-100 px-3 py-1 rounded-full">
                    <Text className="text-gray-600 text-xs font-bold uppercase">{item.status}</Text>
                </View>
            </View>

            <View className="space-y-2 mb-4">
                <View className="flex-row justify-between">
                    <Text className="text-gray-500 text-sm">Customer</Text>
                    <Text className="text-gray-900 font-medium">{item.customerName}</Text>
                </View>
                <View className="flex-row justify-between">
                    <Text className="text-gray-500 text-sm">Model</Text>
                    <Text className="text-gray-900 font-medium">{item.model}</Text>
                </View>
                <View className="flex-row justify-between">
                    <Text className="text-gray-500 text-sm">Service</Text>
                    <Text className="text-gray-900 font-medium">{item.serviceType}</Text>
                </View>
            </View>

            <View className="flex-row justify-between items-center pt-3 border-t border-gray-50">
                <View className="flex-row items-center">
                    <Clock size={14} color={COLORS.gray[400]} />
                    <Text className="text-gray-500 text-xs ml-1">{item.date} {item.time}</Text>
                </View>
                <TouchableOpacity className="bg-teal-50 px-3 py-1.5 rounded-lg flex-row items-center border border-teal-100">
                    <Phone size={14} color={COLORS.primary} />
                    <Text className="text-teal-700 text-xs font-bold ml-1">Call</Text>
                </TouchableOpacity>
            </View>

            {/* Progress */}
            <View className="mt-4 flex-row items-center justify-between px-2">
                {[0, 50, 100].map((p, idx) => (
                    <View key={idx} className="items-center">
                        <View className={`w-3 h-3 rounded-full ${item.progress >= p ? 'bg-teal-600' : 'bg-gray-200'}`} />
                    </View>
                ))}
                <View className="absolute top-1.5 left-4 right-4 h-0.5 bg-gray-100 -z-10" />
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white px-4 pb-4 pt-2 shadow-sm">
                <View className="items-center pt-2 pb-4">
                    <Image
                        source={require('../../assets/464dc6d161864c69f60b59f4ad74113c00404235.png')}
                        resizeMode="contain"
                        style={{ width: 160, height: 36 }}
                    />
                </View>
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-2xl font-bold text-gray-900">Job Cards</Text>
                    <TouchableOpacity className="w-10 h-10 bg-teal-600 rounded-full items-center justify-center">
                        <Plus color="white" size={24} />
                    </TouchableOpacity>
                </View>

                <View className="flex-row items-center bg-gray-100 rounded-xl px-4 h-12">
                    <Search size={20} color={COLORS.gray[400]} />
                    <TextInput
                        placeholder="Search Job Order"
                        className="flex-1 ml-2 text-gray-900"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <View className="bg-white">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            className={`mr-3 px-6 py-2 rounded-full border ${activeTab === tab ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-200'}`}
                        >
                            <Text className={`text-sm font-bold ${activeTab === tab ? 'text-white' : 'text-gray-600'}`}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filteredJobCards}
                renderItem={renderJobCardItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingVertical: 16 }}
            />
        </SafeAreaView>
    );
}
