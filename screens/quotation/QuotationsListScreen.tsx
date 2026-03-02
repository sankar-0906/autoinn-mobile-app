import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Modal,
    Pressable,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, Filter, ChevronRight, ChevronLeft, ChevronDown, User, Calendar, Smartphone, Trash2, X } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import platformApi, { assignQuotationExecutive, ENDPOINT, getBranches, getQuotations, getUsers } from '../../src/api';

interface Quotation {
    id: string;
    displayId: string;
    customerName: string;
    vehicle: string;
    mobileNo: string;
    createdOn: string;
    status: 'active' | 'booked' | 'sold' | 'rejected';
    followupDate: string;
}

const TABS = ['active', 'booked', 'rejected', 'all'];

export default function QuotationsListScreen({ navigation }: { navigation: any }) {
    // Guard against missing navigation context
    if (!navigation) {
        return null;
    }

    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('active');
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showLimitOptions, setShowLimitOptions] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState<string | null>(null);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedExecutive, setSelectedExecutive] = useState('');
    const [branchOptions, setBranchOptions] = useState<Array<{ id: string; name: string }>>([]);
    const [executiveOptions, setExecutiveOptions] = useState<Array<{ id: string; name: string; employeeId?: string }>>([]);
    const [assigning, setAssigning] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingExecutives, setLoadingExecutives] = useState(false);

    const totalPages = Math.max(1, Math.ceil(count / itemsPerPage));

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeTab, itemsPerPage]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedQuotations = useMemo(() => quotations, [quotations]);

    const paginationWindow = useMemo(() => {
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + 4);
        if (end - start < 4) {
            start = Math.max(1, end - 4);
        }
        return { start, end };
    }, [currentPage, totalPages]);

    const tabToStatus = (tab: string) => {
        switch (tab) {
            case 'active':
                return 'ACTIVE';
            case 'booked':
                return 'BOOKED';
            case 'rejected':
                return 'REJECTED';
            case 'all':
                return 'ALL';
            default:
                return 'ALL';
        }
    };

    const normalizeStatus = (status?: string) => {
        const value = (status || '').toUpperCase();
        if (value === 'BOOKED') return 'booked';
        if (value === 'REJECTED') return 'rejected';
        if (value === 'SOLD') return 'sold';
        if (value === 'QUOTED' || value === 'ACTIVE') return 'active';
        return 'active';
    };

    const formatDate = (value?: string) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    const getBranchIds = async () => {
        try {
            const profileRaw = await AsyncStorage.getItem('userProfile');
            if (!profileRaw) return [];
            const profile = JSON.parse(profileRaw);
            const branch = profile?.branch || profile?.profile?.branch || [];
            const normalize = (b: any) => (typeof b === 'string' ? b : b?.id || b?._id);
            if (Array.isArray(branch)) {
                return branch.map(normalize).filter(Boolean);
            }
            const single = normalize(branch);
            return single ? [single] : [];
        } catch (e) {
            return [];
        }
    };

    const mapQuotation = (q: any): Quotation => {
        const vehicleLabel =
            q?.vehicle && Array.isArray(q.vehicle) && q.vehicle.length
                ? q.vehicle
                    .map((v: any) => v?.vehicleDetail?.modelName || v?.vehicleDetail?.modelCode)
                    .filter(Boolean)
                    .join(',\n')
                : '-';

        // Match autoinn-fe: customerName || (customer ? customer.name : proCustomer?.name)
        const customerName =
            q?.customerName ||
            (q?.customer ? q.customer.name : q?.proCustomer?.name) ||
            '-';

        const mobileNo =
            q?.quotationPhone ||
            q?.proCustomer?.phone ||
            q?.customer?.contacts?.[0]?.phone ||
            '-';

        return {
            id: q?.id || q?.quotationId || '-',
            displayId: q?.quotationId || q?.id || '-',
            customerName,
            vehicle: vehicleLabel,
            mobileNo,
            createdOn: formatDate(q?.createdAt),
            status: normalizeStatus(q?.quotationStatus || q?.status),
            followupDate: formatDate(q?.scheduleDateAndTime || q?.scheduleDate),
        };
    };

    const fetchQuotations = async () => {
        setLoading(true);
        try {
            const branchIds = await getBranchIds();
            const storedFiltersRaw = await AsyncStorage.getItem('quotationFilters');
            const storedFilters = storedFiltersRaw ? JSON.parse(storedFiltersRaw) : {};
            const sanitizedFilters: any = { ...storedFilters };
            if (Array.isArray(sanitizedFilters.category)) {
                sanitizedFilters.category = sanitizedFilters.category
                    .map((val: string) => (typeof val === 'string' ? val.toUpperCase() : val))
                    .filter(Boolean);
            }
            if (Array.isArray(sanitizedFilters.model)) {
                const looksLikeId = (val: string) => typeof val === 'string' && val.length >= 20;
                sanitizedFilters.model = sanitizedFilters.model.filter(looksLikeId);
                if (!sanitizedFilters.model.length) delete sanitizedFilters.model;
            }
            const body: any = {
                page: currentPage,
                size: itemsPerPage,
                filter: sanitizedFilters || {},
                status: tabToStatus(activeTab),
                searchString: searchQuery ? searchQuery : undefined,
            };
            if (branchIds.length) body.branch = branchIds;
            const token = await AsyncStorage.getItem('token');
            const res = await getQuotations(body);
            const data = res?.data;
            if (data && data.code === 200 && data.response && data.response.code === 200) {
                const list = data.response.data?.Quotation || [];
                const total = data.response.data?.count ?? list.length;
                setQuotations(list.map(mapQuotation));
                setCount(total);
            } else {
                setQuotations([]);
                setCount(0);
                const msg = data?.response?.message || 'Unable to fetch quotations';
                Alert.alert('Error', msg);
            }
        } catch (e) {
            console.error('Fetch quotations error', e);
            console.error('[Quotations] error response:', (e as any)?.response?.data);
            setQuotations([]);
            setCount(0);
            const status = (e as any)?.response?.status;
            if (status === 401) {
                Alert.alert('Session Expired', 'Please login again.');
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            } else {
                const msg = (e as any)?.response?.data?.response?.message || 'Unable to fetch quotations';
                Alert.alert('Error', msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReassign = (quotationId: string) => {
        setSelectedQuotation(quotationId);
        setSelectedBranch('');
        setSelectedExecutive('');
        setShowReassignModal(true);
    };

    const handleDelete = (quotationId: string) => {
        Alert.alert(
            'Delete Quotation',
            `Delete quotation ${quotationId}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        platformApi
                            .delete(`/api/quotation/${quotationId}`)
                            .then(() => {
                                fetchQuotations();
                            })
                            .catch(() => {
                                Alert.alert('Error', 'Unable to delete quotation');
                            });
                    },
                },
            ]
        );
    };

    const handleOpenQuotation = useCallback(
        (id: string) => navigation.navigate('QuotationForm', { id, viewMode: true }),
        [navigation]
    );

    const QuotationCard = React.memo(
        ({ item, onPress }: { item: Quotation; onPress: (id: string) => void }) => (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => onPress(item.id)}
                className="bg-white rounded-2xl border border-gray-200 px-4 py-4 mb-3 mx-4"
            >
                <View className="flex-row items-start">
                    <View className="flex-1 pr-3">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-teal-600 font-bold text-base">{item.displayId}</Text>
                            {item.followupDate !== '-' && (
                                <View className="items-end mt-4">
                                    <Text className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Followup Date</Text>
                                    <Text className="text-gray-900 font-bold text-sm mt-0.5">{item.followupDate}</Text>
                                </View>
                            )}
                        </View>
                        <View className="flex-row items-center mt-2">
                            <User size={14} color={COLORS.gray[600]} />
                            <Text className="text-gray-700 ml-1.5 font-medium" numberOfLines={1}>
                                {item.customerName}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="h-[1px] bg-gray-100 my-3" />

                <View>
                    <View className="flex-row items-start py-1">
                        <Text className="text-gray-500 text-sm">Vehicle</Text>
                        <Text className="text-gray-900 text-sm font-semibold flex-1 text-right ml-4">
                            {item.vehicle}
                        </Text>
                    </View>
                    <View className="flex-row items-center py-1">
                        <View className="flex-row items-center">
                            <Smartphone size={14} color={COLORS.gray[400]} />
                            <Text className="text-gray-500 text-sm ml-1.5">Mobile</Text>
                        </View>
                        <Text className="text-gray-900 text-sm font-medium flex-1 text-right ml-4">{item.mobileNo}</Text>
                    </View>
                    <View className="flex-row items-center py-1">
                        <View className="flex-row items-center">
                            <Calendar size={14} color={COLORS.gray[400]} />
                            <Text className="text-gray-500 text-sm ml-1.5">Created</Text>
                        </View>
                        <Text className="text-gray-900 text-sm font-medium flex-1 text-right ml-4">{item.createdOn}</Text>
                    </View>
                </View>

                <View className="flex-row gap-2 mt-3 pt-3 border-t border-gray-100">
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            handleReassign(item.id);
                        }}
                        className="flex-1 h-10 rounded-lg border border-teal-600 items-center justify-center"
                        activeOpacity={0.7}
                    >
                        <Text className="text-teal-600 font-semibold text-sm">Reassign</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                        }}
                        className="flex-1 h-10 rounded-lg border border-red-600 flex-row items-center justify-center"
                        activeOpacity={0.7}
                    >
                        <Trash2 size={14} color={COLORS.red[600]} />
                        <Text className="text-red-600 font-semibold text-sm ml-1.5">Delete</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={(e) => {
                        e.stopPropagation();
                        navigation.navigate('QuotationForm', { id: item.id, viewMode: true });
                    }}
                    className="flex-row mt-3 pt-3 border-t border-gray-100 items-center justify-between"
                    activeOpacity={0.7}
                >
                    <Text className="text-teal-600 font-bold text-sm">View Details</Text>
                    <ChevronRight size={18} color={COLORS.primary} />
                </TouchableOpacity>
            </TouchableOpacity >
        )
    );

    const renderQuotationItem = useCallback(
        ({ item }: { item: Quotation }) => <QuotationCard item={item} onPress={handleOpenQuotation} />,
        [handleOpenQuotation]
    );

    const keyExtractor = useCallback(
        (item: Quotation) => (item.id && item.id !== '-' ? item.id : item.displayId),
        []
    );

    const renderPaginationFooter = () => {
        if (count === 0) return null;

        return (
            <View className="mx-4 mt-1 mb-4">
                <View className="flex-row items-center justify-center">
                    <TouchableOpacity
                        onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`w-9 h-9 rounded-md border items-center justify-center mr-2 ${currentPage === 1 ? 'border-gray-300 bg-gray-100' : 'border-gray-300 bg-gray-100'}`}
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
                        className={`w-9 h-9 rounded-md border items-center justify-center ml-2 ${currentPage === totalPages ? 'border-gray-300 bg-gray-100' : 'border-gray-300 bg-gray-100'}`}
                    >
                        <ChevronRight size={16} color={currentPage === totalPages ? '#9CA3AF' : '#6B7280'} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const fetchBranches = async () => {
        setLoadingBranches(true);
        try {
            const res = await getBranches();
            const data = res?.data;
            if (data && data.code === 200 && data.response && data.response.code === 200) {
                const branches = data.response.data || [];
                const mapped = branches.map((b: any) => ({ id: b.id, name: b.name }));
                setBranchOptions(mapped);
                if (!selectedBranch && mapped.length > 0) {
                    setSelectedBranch(mapped[0].id);
                }
            } else {
                setBranchOptions([]);
            }
        } catch (e) {
            setBranchOptions([]);
        } finally {
            setLoadingBranches(false);
        }
    };

    const fetchExecutivesForBranch = async (branchId: string) => {
        setLoadingExecutives(true);
        try {
            const res = await getUsers({ size: 1000, page: 1 });
            const data = res?.data;
            if (data && data.code === 200 && data.response && data.response.code === 200) {
                const users = Array.isArray(data.response?.data?.users)
                    ? data.response.data.users
                    : [];
                const filtered = users
                    .filter((user: any) => {
                        const departmentType = Array.isArray(user?.profile?.department?.departmentType)
                            ? user.profile.department.departmentType
                            : [];
                        const isSales = departmentType.includes('Sales');
                        if (!isSales || user?.status !== true) return false;
                        const branch = user?.profile?.branch;
                        const branches = Array.isArray(branch) ? branch : branch ? [branch] : [];
                        return branches.some((b: any) => (typeof b === 'string' ? b === branchId : b?.id === branchId));
                    })
                    .map((user: any) => ({
                        id: user.id,
                        name: user?.profile?.employeeName || 'Unknown',
                        employeeId: user?.profile?.employeeId,
                    }));
                setExecutiveOptions(filtered);
            } else {
                setExecutiveOptions([]);
            }
        } catch (e) {
            setExecutiveOptions([]);
        } finally {
            setLoadingExecutives(false);
        }
    };

    const handleAssignExecutive = async () => {
        if (!selectedBranch || !selectedExecutive || !selectedQuotation) {
            Alert.alert('Error', 'Please select branch and sales executive');
            return;
        }
        const branchObj = branchOptions.find((b) => b.id === selectedBranch);
        const execObj = executiveOptions.find((e) => e.id === selectedExecutive);
        if (!branchObj || !execObj) {
            Alert.alert('Error', 'Invalid branch or executive');
            return;
        }
        setAssigning(true);
        try {
            await assignQuotationExecutive({
                branch: { id: branchObj.id, name: branchObj.name },
                executive: { id: execObj.id, name: execObj.name },
                quotationId: selectedQuotation,
            });
            setShowReassignModal(false);
            fetchQuotations();
        } catch (e) {
            Alert.alert('Error', 'Unable to assign executive');
        } finally {
            setAssigning(false);
        }
    };

    useEffect(() => {
        if (!showReassignModal) return;
        fetchBranches();
    }, [showReassignModal]);

    useEffect(() => {
        if (!selectedBranch) return;
        fetchExecutivesForBranch(selectedBranch);
    }, [selectedBranch]);

    useEffect(() => {
        fetchQuotations();
    }, [activeTab, currentPage, itemsPerPage, searchQuery]);

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
                            Quotations [{count}]
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
                                    {[10, 20, 50, 100].map((limit) => (
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
                        onPress={() => navigation.navigate('AddQuotation')}
                        className="px-3 h-10 bg-teal-600 rounded-lg items-center justify-center"
                    >
                        <Text className="text-white font-semibold text-sm">+ Add Quotation</Text>
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View className="flex-row items-center">

                    {/* Search Box */}
                    <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 h-12">
                        <Search size={20} color={COLORS.gray[400]} />
                        <TextInput
                            placeholder="Search Quotations/Customers"
                            className="flex-1 ml-2 text-gray-900"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Filter Button Outside */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('AdvancedFilters')}
                        className="ml-3 bg-teal-50 p-3 rounded-xl"
                    >
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

            {/* List */}
            <FlatList
                data={paginatedQuotations}
                renderItem={renderQuotationItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={{ paddingVertical: 16 }}
                refreshing={loading}
                onRefresh={fetchQuotations}
                initialNumToRender={8}
                maxToRenderPerBatch={8}
                windowSize={7}
                removeClippedSubviews
                ListEmptyComponent={
                    <View className="flex-1 items-center justify-center p-10">
                        <Text className="text-gray-500 text-center text-lg">
                            No quotations found matching your criteria.
                        </Text>
                    </View>
                }
                ListFooterComponent={renderPaginationFooter}
            />

            <Modal
                visible={showReassignModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowReassignModal(false)}
            >
                <Pressable
                    onPress={() => setShowReassignModal(false)}
                    className="flex-1 bg-black/35 items-center justify-center px-4"
                >
                    <Pressable
                        onPress={() => { }}
                        className="w-full max-w-md bg-white rounded-2xl p-4"
                    >
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-gray-900 text-lg font-bold">Reassign Executive</Text>
                            <TouchableOpacity onPress={() => setShowReassignModal(false)}>
                                <X size={20} color={COLORS.gray[600]} />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-gray-500 text-sm mb-4">
                            Select the branch and sales executive to reassign {selectedQuotation ?? 'quotation'}.
                        </Text>

                        <View className="mb-4">
                            <Text className="text-sm text-gray-600 font-medium mb-2">Branch</Text>
                            <View className="gap-2">
                                {loadingBranches && (
                                    <Text className="text-gray-500 text-sm">Loading branches...</Text>
                                )}
                                {!loadingBranches && branchOptions.map((branch) => (
                                    <TouchableOpacity
                                        key={branch.id}
                                        className={`px-3 py-2 rounded-lg border ${selectedBranch === branch.id ? 'border-teal-600 bg-teal-50' : 'border-gray-200 bg-white'}`}
                                        onPress={() => {
                                            setSelectedBranch(branch.id);
                                            setSelectedExecutive('');
                                        }}
                                    >
                                        <Text className={selectedBranch === branch.id ? 'text-teal-700 font-semibold' : 'text-gray-700'}>
                                            {branch.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                {!loadingBranches && branchOptions.length === 0 && (
                                    <Text className="text-gray-500 text-sm">No branches found</Text>
                                )}
                            </View>
                        </View>

                        <View className="mb-5">
                            <Text className="text-sm text-gray-600 font-medium mb-2">Sales Executive</Text>
                            <View className="gap-2">
                                {loadingExecutives && (
                                    <Text className="text-gray-500 text-sm">Loading executives...</Text>
                                )}
                                {!loadingExecutives && executiveOptions.map((exec) => (
                                    <TouchableOpacity
                                        key={exec.id}
                                        className={`px-3 py-2 rounded-lg border ${selectedExecutive === exec.id ? 'border-teal-600 bg-teal-50' : 'border-gray-200 bg-white'}`}
                                        onPress={() => setSelectedExecutive(exec.id)}
                                    >
                                        <Text className={selectedExecutive === exec.id ? 'text-teal-700 font-semibold' : 'text-gray-700'}>
                                            {exec.name}{exec.employeeId ? ` (${exec.employeeId})` : ''}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                {!loadingExecutives && executiveOptions.length === 0 && (
                                    <Text className="text-gray-500 text-sm">No executives found</Text>
                                )}
                            </View>
                        </View>

                        <View className="flex-row gap-2">
                            <Button
                                title="Cancel"
                                variant="outline"
                                className="flex-1"
                                onPress={() => setShowReassignModal(false)}
                            />
                            <Button
                                title="Assign Executive"
                                className="flex-1"
                                onPress={handleAssignExecutive}
                                disabled={assigning}
                            />
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}
