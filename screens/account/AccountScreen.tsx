import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { User, LogOut, ChevronRight, Phone, Mail, Building2 } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../../src/ToastContext'; // Ensure this is the only useToast import
import { useBranch } from '../../src/context/branch';
import { updateUserTokenBranches } from '../../src/api';
import { useAuth } from '../../src/context/auth/AuthContext';

type AccountNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

export default function AccountScreen({ navigation }: { navigation: AccountNavigationProp }) {
    const [loggingOut, setLoggingOut] = useState(false);
    const [savingBranches, setSavingBranches] = useState(false);
    const toast = useToast(); // Ensure this is the only useToast hook call
    const { user } = useAuth(); // Get user data from auth context
    const {
        branches,
        selectedBranches,
        employeeBranch,
        nearestBranch,
        setSelectedBranches,
        fetchBranches,
        isLoading,
    } = useBranch();
    const [localSelected, setLocalSelected] = useState(selectedBranches || []);

    useEffect(() => {
        if (!branches.length) {
            fetchBranches();
        }
    }, [branches.length, fetchBranches]);

    useEffect(() => {
        if (selectedBranches && selectedBranches.length > 0) {
            setLocalSelected(selectedBranches);
            return;
        }
        if (employeeBranch) {
            setLocalSelected([employeeBranch]);
            return;
        }
        if (nearestBranch) {
            setLocalSelected([nearestBranch]);
            return;
        }
        if (branches.length) {
            setLocalSelected([branches[0]]);
        }
    }, [branches, selectedBranches, employeeBranch, nearestBranch]);

    const selectedIds = useMemo(() => new Set(localSelected.map((b) => b.id)), [localSelected]);

    const toggleBranch = (branch: any) => {
        setLocalSelected((prev) => {
            const exists = prev.some((b) => b.id === branch.id);
            if (exists) {
                return prev.filter((b) => b.id !== branch.id);
            }
            return [...prev, branch];
        });
    };

    const handleSaveBranches = async () => {
        if (!localSelected.length) {
            toast.error('Please select at least one branch');
            return;
        }
        setSavingBranches(true);
        try {
            const branchIds = localSelected.map((b) => b.id);
            const res = await updateUserTokenBranches(branchIds);
            const data = res?.data;
            const token =
                data?.response?.data ||
                data?.data ||
                data?.token ||
                (typeof data === 'string' ? data : null);

            if (!token) {
                throw new Error('Token not returned');
            }

            await AsyncStorage.setItem('token', token);
            setSelectedBranches(localSelected);
            DeviceEventEmitter.emit('refreshFollowUps');
            DeviceEventEmitter.emit('refreshBranches');
            toast.success('Branches updated');
        } catch (error) {
            console.error('Save branches error:', error);
            toast.error('Unable to update branches. Please try again.');
        } finally {
            setSavingBranches(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        setLoggingOut(true);
                        try {
                            await AsyncStorage.removeItem('isLoggedIn');
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (error) {
                            toast.error('Failed to sign out. Please try again.');
                        } finally {
                            setLoggingOut(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-4 pb-4 pt-2 shadow-sm">
                <Text className="text-2xl font-bold text-gray-900">Account</Text>
            </View>

            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

            {/* Profile Card */}
            <View className="mx-4 mt-5 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <View className="bg-teal-600 px-5 py-6 flex-row items-center">
                    <View className="w-14 h-14 bg-white/20 rounded-full items-center justify-center">
                        <User color="white" size={28} />
                    </View>
                    <View className="ml-4 flex-1">
                        <Text className="text-white font-bold text-lg">{user?.profile?.employeeName || 'AutoCloud User'}</Text>
                        <Text className="text-teal-100 text-sm mt-0.5">{user?.profile?.department?.role || 'Dealer Executive'}</Text>
                    </View>
                </View>

                <View className="px-5 py-4">
                    <View className="flex-row items-center py-3 border-b border-gray-50">
                        <Mail size={16} color={COLORS.gray[400]} />
                        <Text className="text-gray-600 ml-3 text-sm">{user?.profile?.employeeId ? `${user.phone}@autocloud.in` : 'autocloudemployee@gmail.com'}</Text>
                    </View>
                    <View className="flex-row items-center py-3 border-b border-gray-50">
                        <Phone size={16} color={COLORS.gray[400]} />
                        <Text className="text-gray-600 ml-3 text-sm">{user?.phone || '+91 98765 43210'}</Text>
                    </View>
                    <View className="flex-row items-center py-3">
                        <Building2 size={16} color={COLORS.gray[400]} />
                        <Text className="text-gray-600 ml-3 text-sm">
                            {localSelected.length
                                ? localSelected.map((b) => b.name).join(', ')
                                : user?.profile?.branch?.map((b) => b.name).join(', ') || 'Select Branch'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Branch Selection */}
            <View className="mx-4 mt-5 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <View className="px-5 py-4 border-b border-gray-50">
                    <Text className="text-base font-bold text-gray-900">Branches</Text>
                    <Text className="text-xs text-gray-500 mt-1">Select at least one branch</Text>
                </View>

                <View className="px-5 pt-3">
                    <View className="flex-row flex-wrap">
                        {localSelected.length === 0 ? (
                            <Text className="text-gray-500 text-sm">No branch selected</Text>
                        ) : (
                            localSelected.map((b) => (
                                <View
                                    key={b.id}
                                    className="mr-2 mb-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200"
                                >
                                    <Text className="text-teal-700 text-xs font-medium">{b.name}</Text>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                <View className="px-3 pb-4">
                    {isLoading && !branches.length ? (
                        <View className="py-6 items-center">
                            <ActivityIndicator size="small" />
                            <Text className="text-gray-500 mt-2 text-xs">Loading branches...</Text>
                        </View>
                    ) : (
                        <ScrollView style={{ maxHeight: 260 }}>
                            {branches.map((b) => {
                                const selected = selectedIds.has(b.id);
                                return (
                                    <TouchableOpacity
                                        key={b.id}
                                        onPress={() => toggleBranch(b)}
                                        activeOpacity={0.8}
                                        className={`flex-row items-center px-3 py-3 rounded-xl mb-2 ${
                                            selected ? 'bg-teal-50 border border-teal-200' : 'bg-gray-50 border border-gray-200'
                                        }`}
                                    >
                                        <View
                                            className={`w-5 h-5 rounded-md border items-center justify-center ${
                                                selected ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300'
                                            }`}
                                        >
                                            {selected && <View className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                        </View>
                                        <Text className="ml-3 text-gray-800 font-medium">{b.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}

                    <TouchableOpacity
                        onPress={handleSaveBranches}
                        disabled={savingBranches || localSelected.length === 0}
                        activeOpacity={0.8}
                        className={`mt-3 h-11 rounded-lg items-center justify-center ${
                            savingBranches || localSelected.length === 0 ? 'bg-gray-400' : 'bg-teal-700'
                        }`}
                    >
                        <Text className="text-white font-semibold">
                            {savingBranches ? 'Saving...' : 'Save Branches'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Sign Out Button */}
            <View className="mx-4 mt-5">
                <TouchableOpacity
                    onPress={handleLogout}
                    disabled={loggingOut}
                    activeOpacity={0.7}
                    className="bg-white rounded-xl border border-red-100 p-4 flex-row items-center justify-between"
                >
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 bg-red-50 rounded-full items-center justify-center">
                            <LogOut size={20} color="#DC2626" />
                        </View>
                        <Text className="text-red-600 font-bold text-base ml-3">
                            {loggingOut ? 'Signing Out...' : 'Sign Out'}
                        </Text>
                    </View>
                    <ChevronRight size={18} color="#DC2626" />
                </TouchableOpacity>
            </View>

            {/* App Version */}
            <View className="items-center pb-6 mt-8">
                <Text className="text-gray-400 text-xs">AutoCloud Mobile v1.0.0</Text>
            </View>
            </ScrollView>
        </SafeAreaView>
    );
}
