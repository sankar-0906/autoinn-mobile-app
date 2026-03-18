import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, ChevronDown, X } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { PendingSection } from './sections/PendingSection';
import { InProgressSection } from './sections/InProgressSection';
import { CompletedSection } from './sections/CompletedSection';
import { JobCard } from '../../types/job-cards';

const MOCK_JOB_CARDS: JobCard[] = [
    {
        id: "JDE25-26/1053",
        regNo: "KA04JK3463",
        customerName: "Srinivas",
        model: "Alpha Disc",
        serviceType: "Paid (AW)",
        mechanic: "-",
        supervisor: "-",
        serviceNumber: "-",
        kms: 2000,
        date: "19-02-2026",
        time: "5:14:11 PM",
        status: "Vehicle Received",
        progress: 0,
    },
    {
        id: "JDE25-26/3520",
        regNo: "KA04JKA2508",
        customerName: "Aidan",
        model: "R3",
        serviceType: "Minor",
        mechanic: "Mechanic V",
        supervisor: "Supervisor A",
        serviceNumber: "SRV-2508",
        kms: 65850,
        date: "29-10-2025",
        time: "10:47:51 AM",
        status: "In Progress",
        progress: 50,
    },
    {
        id: "JDE25-26/4559",
        regNo: "KA05Y4893",
        customerName: "Mohan",
        model: "FZ S V2",
        serviceType: "Minor",
        mechanic: "Mechanic P",
        supervisor: "Supervisor D",
        serviceNumber: "SRV-4893",
        kms: 65106,
        date: "15-03-2026",
        time: "9:54:11 AM",
        status: "Completed",
        progress: 100,
    },
];

const TABS = ['Pending', 'In Progress', 'Completed', 'All'];

export default function JobCardsListScreen({ navigation }: { navigation: any }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('Pending');
    const [loading, setLoading] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showLimitOptions, setShowLimitOptions] = useState(false);

    const filteredData = useMemo(() => {
        let data = MOCK_JOB_CARDS;

        // Filter by Tab
        if (activeTab === 'Pending') {
            data = data.filter(item => item.status === 'Vehicle Received');
        } else if (activeTab === 'In Progress') {
            data = data.filter(item => item.status === 'In Progress');
        } else if (activeTab === 'Completed') {
            data = data.filter(item => item.status === 'Completed');
        }

        // Filter by Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            data = data.filter(item =>
                item.id.toLowerCase().includes(query) ||
                item.customerName.toLowerCase().includes(query) ||
                item.regNo.toLowerCase().includes(query)
            );
        }

        return data;
    }, [activeTab, searchQuery]);

    const handleItemPress = (id: string) => {
        // Navigate to job card details (future)
        console.log('Pressed item:', id);
    };

    const renderSection = () => {
        switch (activeTab) {
            case 'Pending':
                return <PendingSection data={filteredData} onItemPress={handleItemPress} loading={loading} onRefresh={() => { }} />;
            case 'In Progress':
                return <InProgressSection data={filteredData} onItemPress={handleItemPress} loading={loading} onRefresh={() => { }} />;
            case 'Completed':
                return <CompletedSection data={filteredData} onItemPress={handleItemPress} loading={loading} onRefresh={() => { }} />;
            case 'All':
                return <PendingSection data={filteredData} onItemPress={handleItemPress} loading={loading} onRefresh={() => { }} />;
            default:
                return null;
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-4 pb-4 pt-2 shadow-sm z-20" style={{ elevation: 8 }}>
                <View className="items-center pt-2 pb-4">
                    <Image
                        source={require('../../assets/464dc6d161864c69f60b59f4ad74113c00404235.png')}
                        resizeMode="contain"
                        style={{ width: 160, height: 36 }}
                    />
                </View>
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                        <Text className="text-[20px] font-bold text-gray-900 mr-3">
                            Job Card [{filteredData.length}]
                        </Text>
                        <View className="relative">
                            <TouchableOpacity
                                onPress={() => setShowLimitOptions((prev) => !prev)}
                                className="h-9 min-w-[55px] px-3 border border-gray-300 rounded-md bg-gray-100 flex-row items-center justify-center"
                            >
                                <Text className="text-sm font-medium text-gray-700 mr-1">{itemsPerPage}</Text>
                                <ChevronDown size={14} color="#6B7280" />
                            </TouchableOpacity>
                            {showLimitOptions && (
                                <View
                                    className="absolute top-10 left-0 z-50 bg-white border border-gray-300 rounded-md overflow-hidden shadow-sm"
                                    style={{ elevation: 20 }}
                                >
                                    {[10, 25, 50, 100].map((limit) => (
                                        <TouchableOpacity
                                            key={limit}
                                            onPress={() => {
                                                setItemsPerPage(limit);
                                                setShowLimitOptions(false);
                                            }}
                                            className={`px-3 py-2 ${itemsPerPage === limit ? 'bg-teal-50' : 'bg-white'}`}
                                        >
                                            <Text className={`text-sm ${itemsPerPage === limit ? 'text-teal-700 font-semibold' : 'text-gray-700'}`}>
                                                {limit}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity
                        className="px-4 h-10 bg-teal-600 rounded-lg items-center justify-center"
                    >
                        <Text className="text-white font-semibold text-sm">Add Job Card</Text>
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View className="flex-row items-center">
                    <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 h-12">
                        <Search size={20} color={COLORS.gray[400]} />
                        <TextInput
                            placeholder="Search Job Order"
                            className="flex-1 ml-2 text-gray-900"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')} className="ml-2 p-1">
                                <X size={16} color={COLORS.gray[400]} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity className="ml-3 bg-teal-50 p-3 rounded-xl">
                        <Filter size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tabs */}
            <View className="bg-white">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
                >
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            className={`mr-3 px-6 py-2 rounded-full border ${activeTab === tab
                                ? 'bg-teal-600 border-teal-600'
                                : 'bg-white border-gray-200'
                                }`}
                        >
                            <Text
                                className={`text-sm font-bold capitalize ${activeTab === tab ? 'text-white' : 'text-gray-600'
                                    }`}
                            >
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* List Content */}
            <View className="flex-1">
                {renderSection()}
            </View>
        </SafeAreaView>
    );
}
