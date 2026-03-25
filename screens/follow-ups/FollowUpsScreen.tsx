import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    Image,
    DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, ChevronRight, ChevronLeft, ChevronDown, Calendar, User, Smartphone } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { getFollowUps } from '../../src/api';
import { ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

interface FollowUp {
    id: string; // phone as unique identifier for this list
    quotationId: string;
    customerName: string;
    vehicle: string;
    mobileNo: string;
    createdOn: string;
    nextFollowupDate: string;
    status: string;
}

const TABS: Array<'Quoted' | 'Booked' | 'Discarded' | 'All'> = ['Quoted', 'Booked', 'Discarded', 'All'];
type FollowUpsNavigationProp = StackNavigationProp<RootStackParamList, 'FollowUps'>;

import { ScreenGuard } from '../../src/components/auth';
import { MOBILE_MODULES } from '../../src/constants/modules';

export default function FollowUpsScreen({ navigation }: { navigation: FollowUpsNavigationProp }) {
    return (
        <ScreenGuard module={MOBILE_MODULES.FOLLOW_UPS} action="read">
            <FollowUpsContent navigation={navigation} />
        </ScreenGuard>
    );
}

function FollowUpsContent({ navigation }: { navigation: FollowUpsNavigationProp }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'Quoted' | 'Booked' | 'Discarded' | 'All'>('Quoted');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showLimitOptions, setShowLimitOptions] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const tabToStatus = (tab: string) => {
        switch (tab) {
            case 'Quoted': return 'ACTIVE';
            case 'Booked': return 'BOOKED';
            case 'Discarded': return 'REJECTED';
            case 'All': return 'ALL';
            default: return 'ACTIVE';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
        } catch (e) {
            return dateString;
        }
    };

    const fetchFollowUps = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                size: itemsPerPage,
                searchString: searchQuery,
                status: tabToStatus(activeTab),
                filter: {}
            };
            const response = await getFollowUps(params);
            if (response.data?.code === 200) {
                const apiData = response.data.response.data;
                const mappedData: FollowUp[] = apiData.customers.map((c: any) => ({
                    id: c.phone,
                    quotationId: c.quotationId || '-',
                    customerName: c.name || 'Unknown',
                    vehicle: c.vehicle || '-',
                    mobileNo: c.phone,
                    createdOn: formatDate(c.createdAt),
                    nextFollowupDate: formatDate(c.scheduleDate || c.scheduleDateAndTime),
                    status: c.quotationStatus || activeTab
                }));
                setFollowUps(mappedData);
                setCount(apiData.count);
            }
        } catch (error) {
            console.error('Error fetching follow-ups:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, searchQuery, activeTab]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeTab, itemsPerPage]);

    useFocusEffect(
        useCallback(() => {
            const params = (navigation as any).getState().routes.find((r: any) => r.name === 'FollowUps')?.params;
            if (params?.activeTab) {
                const tab = params.activeTab.charAt(0).toUpperCase() + params.activeTab.slice(1);
                if (TABS.includes(tab as any)) {
                    setActiveTab(tab as any);
                }
                navigation.setParams({ activeTab: undefined } as any);
            }
            fetchFollowUps();
        }, [fetchFollowUps, navigation])
    );

    // Listen for quotation status updates to refresh FollowUps
    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('refreshFollowUps', () => {
            console.log('📡 Received refreshFollowUps event, refreshing data...');
            fetchFollowUps();
        });

        return () => {
            subscription.remove();
        };
    }, [fetchFollowUps]);

    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('refreshBranches', () => {
            fetchFollowUps();
        });
        return () => {
            subscription.remove();
        };
    }, [fetchFollowUps]);

    const totalPages = Math.max(1, Math.ceil(count / itemsPerPage));

    const paginationWindow = useMemo(() => {
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + 4);
        if (end - start < 4) start = Math.max(1, end - 4);
        return { start, end };
    }, [currentPage, totalPages]);

    const FollowUpCard = React.memo(({ item }: { item: FollowUp }) => (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('FollowUpDetail', { id: item.id })} // item.id is the phone number
            className="bg-white rounded-2xl border border-gray-200 px-4 py-4 mb-3 mx-4"
        >
            <View className="flex-row items-start">
                <Text className="text-teal-600 font-bold text-base">{item.quotationId}</Text>
                <View className="flex-1" />
            </View>

            <View className="h-[1px] bg-gray-100 my-3" />

            <View>
                <View className="flex-row items-center mb-3">
                    <User size={14} color={COLORS.gray[600]} />
                    <Text className="text-gray-700 ml-1.5 font-medium" numberOfLines={1}>
                        {item.customerName}
                    </Text>
                </View>

                <View className="flex-row items-start py-1">
                    <Text className="text-gray-500 text-sm">Vehicle</Text>
                    <Text className="text-gray-900 text-sm font-semibold flex-1 text-right ml-4" numberOfLines={2}>
                        {item.vehicle}
                    </Text>
                </View>

                <View className="flex-row items-center py-1">
                    <View className="flex-row items-center">
                        <Smartphone size={14} color={COLORS.gray[400]} />
                        <Text className="text-gray-500 text-sm ml-1.5">Mobile No</Text>
                    </View>
                    <Text className="text-gray-900 text-sm font-medium flex-1 text-right ml-4">{item.mobileNo}</Text>
                </View>

                <View className="flex-row items-center py-1">
                    <Text className="text-gray-500 text-sm">Created On</Text>
                    <Text className="text-gray-900 text-sm font-medium flex-1 text-right ml-4">{item.createdOn}</Text>
                </View>

                <View className="flex-row items-center py-1">
                    <Text className="text-gray-500 text-sm">Next Follow-up</Text>
                    <View className="flex-row items-center flex-1 justify-end ml-4">
                        <Calendar size={12} color={COLORS.primary} />
                        <Text className="text-teal-700 text-sm ml-1">{item.nextFollowupDate}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    ));

    const renderFollowUpCard = useCallback(
        ({ item }: { item: FollowUp }) => <FollowUpCard item={item} />,
        [navigation]
    );

    const keyExtractor = useCallback((item: FollowUp) => item.id, []);

    const renderPaginationFooter = () => {
        if (count === 0) return null;

        return (
            <View className="mx-4 mt-1 mb-4">
                <View className="flex-row items-center justify-center">
                    <TouchableOpacity
                        onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="w-9 h-9 rounded-md border border-gray-300 bg-gray-100 items-center justify-center mr-2"
                    >
                        <ChevronLeft size={16} color={currentPage === 1 ? '#9CA3AF' : '#6B7280'} />
                    </TouchableOpacity>

                    <View className="flex-row items-center">
                        {Array.from({ length: paginationWindow.end - paginationWindow.start + 1 }, (_, idx) => paginationWindow.start + idx).map((page) => (
                            <TouchableOpacity
                                key={page}
                                onPress={() => setCurrentPage(page)}
                                className={`w-9 h-9 rounded-md mx-1 items-center justify-center border ${page === currentPage ? 'bg-teal-50 border-teal-600' : 'bg-white border-gray-300'}`}
                            >
                                <Text className={`text-sm font-semibold ${page === currentPage ? 'text-teal-700' : 'text-gray-700'}`}>{page}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="w-9 h-9 rounded-md border border-gray-300 bg-gray-100 items-center justify-center ml-2"
                    >
                        <ChevronRight size={16} color={currentPage === totalPages ? '#9CA3AF' : '#6B7280'} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white px-4 pb-4 pt-2 shadow-sm z-20" style={{ elevation: 8 }}>
                <View className="items-center pt-2 pb-5">
                    <Image
                        source={require('../../assets/464dc6d161864c69f60b59f4ad74113c00404235.png')}
                        resizeMode="contain"
                        style={{ width: 160, height: 36 }}
                    />
                </View>
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                        <Text className="text-2xl font-bold text-gray-900 mr-3">
                            Follow-Ups [{count}]
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
                                <View className="absolute top-10 left-0 z-50 bg-white border border-gray-300 rounded-md overflow-hidden shadow-sm" style={{ elevation: 20 }}>
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
                </View>

                <View className="relative mb-4">
                    <View className="flex-row items-center">
                        <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 h-12">
                            <Search size={20} color={COLORS.gray[400]} />
                            <TextInput
                                placeholder="Search Quotations/Phone"
                                className="flex-1 ml-2 text-gray-900"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('FollowUpFilters')}
                            className="ml-3 bg-teal-50 p-3 rounded-xl"
                        >
                            <Filter size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View className="bg-white">
                <FlatList
                    horizontal
                    data={TABS}
                    keyExtractor={(tab) => tab}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
                    renderItem={({ item: tab }) => (
                        <TouchableOpacity
                            onPress={() => setActiveTab(tab)}
                            className={`mr-3 px-6 py-2 rounded-full border ${activeTab === tab ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-200'}`}
                        >
                            <Text className={`text-sm font-bold ${activeTab === tab ? 'text-white' : 'text-gray-600'}`}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center py-20">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={followUps}
                    renderItem={renderFollowUpCard}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={{ paddingVertical: 16 }}
                    initialNumToRender={8}
                    windowSize={7}
                    removeClippedSubviews
                    ListEmptyComponent={
                        <View className="bg-white rounded-lg border border-gray-200 p-8 mx-4">
                            <Text className="text-gray-500 text-center">No follow-ups found</Text>
                        </View>
                    }
                    ListFooterComponent={renderPaginationFooter}
                />
            )}
        </SafeAreaView>
    );
}
