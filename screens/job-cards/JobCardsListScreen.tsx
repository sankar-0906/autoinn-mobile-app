import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/colors';
import { PendingSection } from './sections/PendingSection';
import { InProgressSection } from './sections/InProgressSection';
import { CompletedSection } from './sections/CompletedSection';
import { useJobCards } from '../../src/hooks/job-cards/useJobCards';
import type { TabStatus, JobCardRecord, JobCardFilter } from '../../types/job-cards';

const TABS: { label: string; apiStatus: TabStatus }[] = [
    { label: 'Pending', apiStatus: 'PENDING' },
    { label: 'In Progress', apiStatus: 'IN PROGRESS' },
    { label: 'Completed', apiStatus: 'COMPLETED' },
    { label: 'All', apiStatus: 'ALL' },
];

export default function JobCardsListScreen({ navigation }: { navigation: any }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showLimitOptions, setShowLimitOptions] = useState(false);
    const [activeFiltersCount, setActiveFiltersCount] = useState(0);

    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { data, count, loading, fetchJobCards, filter, setFilter, page, setPage } =
        useJobCards({ pageSize: itemsPerPage });

    const currentTabStatus = TABS[activeTabIndex].apiStatus;

    // Function to calculate active filters count
    const getActiveFiltersCount = useCallback((filters: any) => {
        let count = 0;
        if (filters.vehicleModel && filters.vehicleModel.length > 0) count++;
        if (filters.serviceType && filters.serviceType.length > 0) count++;
        if (filters.mechanic && filters.mechanic.length > 0) count++;
        if (filters.jobStatus && filters.jobStatus.length > 0) count++;
        if (filters.registerNumber) count++;
        if (filters.serviceKmsFrom) count++;
        if (filters.serviceKmsTo) count++;
        if (filters.startDate) count++;
        if (filters.endDate) count++;
        return count;
    }, []);

    // Pagination calculations
    const totalPages = useMemo(() => {
        if (searchQuery) {
            return 1; // Disable pagination when searching
        }
        return Math.max(1, Math.ceil(count / itemsPerPage));
    }, [count, itemsPerPage, searchQuery]);

    const paginationWindow = useMemo(() => {
        let start = Math.max(1, page - 2);
        let end = Math.min(totalPages, start + 4);
        if (end - start < 4) {
            start = Math.max(1, end - 4);
        }
        return { start, end };
    }, [page, totalPages]);

    /** Load filters from AsyncStorage (set by filter screen) then fetch */
    const loadAndFetch = useCallback(async (tabStatus: TabStatus, search: string, pg: number) => {
        try {
            const stored = await AsyncStorage.getItem('jobCardFilters');
            let activeFilter: JobCardFilter = {
                model: null,
                serviceType: null,
                mechanic: [],
                registerNo: null,
                serviceKmFrom: null,
                serviceKmTo: null,
                from: null,
                to: null,
                jobStatus: null,
            };

            if (stored) {
                const parsed = JSON.parse(stored);
                activeFilter = {
                    model: parsed.vehicleModel?.length ? parsed.vehicleModel : null,
                    serviceType: parsed.serviceType?.length ? parsed.serviceType : null,
                    mechanic: parsed.mechanic || [],
                    registerNo: parsed.registerNumber || null,
                    serviceKmFrom: parsed.serviceKmsFrom ? Number(parsed.serviceKmsFrom) : null,
                    serviceKmTo: parsed.serviceKmsTo ? Number(parsed.serviceKmsTo) : null,
                    from: parsed.startDate ? new Date(parsed.startDate.split('/').reverse().join('-')).toISOString() : null,
                    to: parsed.endDate ? new Date(parsed.endDate.split('/').reverse().join('-')).toISOString() : null,
                    jobStatus: parsed.jobStatus?.length ? parsed.jobStatus : null,
                };

                // Update active filters count
                setActiveFiltersCount(getActiveFiltersCount(parsed));
            } else {
                setActiveFiltersCount(0);
            }

            setFilter(activeFilter);
            await fetchJobCards(tabStatus, search, pg, activeFilter);
        } catch {
            setActiveFiltersCount(0);
            await fetchJobCards(tabStatus, search, pg, filter);
        }
    }, [fetchJobCards, filter, setFilter, getActiveFiltersCount]);

    // Re-fetch when screen comes into focus (e.g. after returning from filter screen)
    useFocusEffect(
        useCallback(() => {
            loadAndFetch(currentTabStatus, searchQuery, 1);
            setPage(1);
        }, [currentTabStatus])
    );

    // Handle tab switch
    const handleTabChange = (index: number) => {
        setActiveTabIndex(index);
        setPage(1);
        loadAndFetch(TABS[index].apiStatus, searchQuery, 1);
    };

    // Handle search with debounce
    const handleSearch = (text: string) => {
        setSearchQuery(text);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            setPage(1);
            loadAndFetch(currentTabStatus, text, 1);
        }, 500);
    };

    // Handle page size change
    const handlePageSizeChange = (size: number) => {
        setItemsPerPage(size);
        setShowLimitOptions(false);
        setPage(1);
        loadAndFetch(currentTabStatus, searchQuery, 1);
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        loadAndFetch(currentTabStatus, searchQuery, newPage);
    };

    // Reset page if it exceeds total pages
    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    // Handle delete
    const handleDelete = useCallback((deletedId: string) => {
        loadAndFetch(currentTabStatus, searchQuery, page);
    }, [currentTabStatus, searchQuery, page, loadAndFetch]);

    // Handle clear filters
    const handleClearFilters = async () => {
        await AsyncStorage.removeItem('jobCardFilters');
        setActiveFiltersCount(0);
        loadAndFetch(currentTabStatus, searchQuery, 1);
    };

    const renderSection = () => {
        const commonProps = {
            data,
            onItemPress: (id: string) => console.log('View job card:', id),
            onEdit: (item: JobCardRecord) => navigation.navigate('AddJobCard', { jobCard: item }),
            onDelete: handleDelete,
            loading,
            onRefresh: () => loadAndFetch(currentTabStatus, searchQuery, page),
            currentPage: page,
            totalPages,
            onPageChange: handlePageChange,
            searchQuery,
            renderPaginationFooter,
        };

        switch (activeTabIndex) {
            case 0: return <PendingSection {...commonProps} />;
            case 1: return <InProgressSection {...commonProps} />;
            case 2: return <CompletedSection {...commonProps} />;
            case 3: return <PendingSection {...commonProps} />;  // All tab reuses same list
            default: return null;
        }
    };

    // Pagination footer component
    const renderPaginationFooter = () => {
        if (count === 0 || searchQuery) return null;

        return (
            <View className="mx-4 mt-1 mb-4">
                <View className="flex-row items-center justify-center">
                    <TouchableOpacity
                        onPress={() => handlePageChange(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className={`w-9 h-9 rounded-md border items-center justify-center mr-2 ${page === 1 ? 'border-gray-300 bg-gray-100' : 'border-gray-300 bg-gray-100'}`}
                    >
                        <ChevronLeft size={16} color={page === 1 ? '#9CA3AF' : '#6B7280'} />
                    </TouchableOpacity>

                    <View className="flex-row items-center">
                        {Array.from({ length: paginationWindow.end - paginationWindow.start + 1 }, (_, idx) => paginationWindow.start + idx).map((pageNum) => (
                            <TouchableOpacity
                                key={pageNum}
                                onPress={() => handlePageChange(pageNum)}
                                className={`w-9 h-9 rounded-md mx-1 items-center justify-center border ${pageNum === page ? 'bg-teal-50 border-teal-600' : 'bg-white border-gray-300'}`}
                            >
                                <Text className={`text-sm font-semibold ${pageNum === page ? 'text-teal-700' : 'text-gray-700'}`}>{pageNum}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={() => handlePageChange(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className={`w-9 h-9 rounded-md border items-center justify-center ml-2 ${page === totalPages ? 'border-gray-300 bg-gray-100' : 'border-gray-300 bg-gray-100'}`}
                    >
                        <ChevronRight size={16} color={page === totalPages ? '#9CA3AF' : '#6B7280'} />
                    </TouchableOpacity>
                </View>
            </View>
        );
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
                            Job Card [{count}]
                        </Text>
                        {/* Items per page selector */}
                        <View className="relative">
                            <TouchableOpacity
                                onPress={() => setShowLimitOptions(prev => !prev)}
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
                                            onPress={() => handlePageSizeChange(limit)}
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
                        onPress={() => navigation.navigate('AddJobCard')}
                        className="px-4 h-10 bg-teal-600 rounded-lg items-center justify-center"
                    >
                        <Text className="text-white font-semibold text-sm">Add Job Card</Text>
                    </TouchableOpacity>
                </View>

                {/* Search + Filter */}
                <View className="flex-row items-center">
                    <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 h-12">
                        <Search size={20} color={COLORS.gray[400]} />
                        <TextInput
                            placeholder="Search Job Order"
                            className="flex-1 ml-2 text-gray-900"
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => handleSearch('')} className="ml-2 p-1">
                                <X size={16} color={COLORS.gray[400]} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('JobCardFilters')}
                        className="ml-3 bg-teal-50 p-3 rounded-xl relative"
                    >
                        <Filter size={20} color={COLORS.primary} />
                        {activeFiltersCount > 0 && (
                            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                                <Text className="text-white text-[10px] font-bold">{activeFiltersCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {activeFiltersCount > 0 && (
                        <TouchableOpacity
                            onPress={handleClearFilters}
                            className="ml-2 bg-red-50 px-3 py-2 rounded-xl"
                        >
                            <Text className="text-red-600 text-xs font-medium">Clear</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Tabs */}
            <View className="bg-white">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
                >
                    {TABS.map((tab, index) => (
                        <TouchableOpacity
                            key={tab.label}
                            onPress={() => handleTabChange(index)}
                            className={`mr-3 px-6 py-2 rounded-full border ${activeTabIndex === index
                                ? 'bg-teal-600 border-teal-600'
                                : 'bg-white border-gray-200'
                                }`}
                        >
                            <Text
                                className={`text-sm font-bold capitalize ${activeTabIndex === index ? 'text-white' : 'text-gray-600'}`}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Loading overlay */}
            {loading && data.length === 0 && (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text className="text-gray-500 mt-3">Loading job cards...</Text>
                </View>
            )}

            {/* List Content */}
            {(!loading || data.length > 0) && (
                <View className="flex-1">
                    {renderSection()}
                </View>
            )}
        </SafeAreaView>
    );
}
