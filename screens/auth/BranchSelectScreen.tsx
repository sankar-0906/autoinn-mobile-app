import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useBranch } from '../../src/context/branch';
import { updateUserTokenBranches } from '../../src/api';
import { useToast } from '../../src/ToastContext';

type BranchSelectNavigationProp = StackNavigationProp<RootStackParamList, 'BranchSelect'>;

export default function BranchSelectScreen({ navigation }: { navigation: BranchSelectNavigationProp }) {
    const toast = useToast();
    const {
        branches,
        selectedBranches,
        setSelectedBranches,
        employeeBranch,
        nearestBranch,
        fetchBranches,
        isLoading,
    } = useBranch();

    const [localSelected, setLocalSelected] = useState(selectedBranches || []);
    const [initialised, setInitialised] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!branches.length) {
            fetchBranches();
        }
    }, [branches.length, fetchBranches]);

    useEffect(() => {
        if (initialised) return;
        if (selectedBranches?.length) {
            setLocalSelected(selectedBranches);
            setInitialised(true);
            return;
        }
        if (employeeBranch) {
            setLocalSelected([employeeBranch]);
            setInitialised(true);
            return;
        }
        if (nearestBranch) {
            setLocalSelected([nearestBranch]);
            setInitialised(true);
            return;
        }
        if (branches.length) {
            setLocalSelected([branches[0]]);
            setInitialised(true);
        }
    }, [branches, employeeBranch, nearestBranch, selectedBranches, initialised]);

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

    const handleContinue = async () => {
        if (!localSelected.length) {
            toast.error('Please select at least one branch');
            return;
        }
        setSaving(true);
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

            navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
            });
        } catch (err) {
            console.error('Branch selection error:', err);
            toast.error('Unable to set branch. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <View className="px-5 pt-6 pb-4">
                <Text className="text-2xl font-bold text-gray-900">Select Branches</Text>
                <Text className="text-sm text-gray-500 mt-1">
                    Choose one or more branches to view records in Quotations, Follow-Ups, and Job Cards.
                </Text>
            </View>

            <ScrollView className="flex-1 px-5">
                <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Selected Branches</Text>
                    <View className="flex-row flex-wrap">
                        {localSelected.length === 0 ? (
                            <Text className="text-gray-500">No branch selected</Text>
                        ) : (
                            localSelected.map((b) => (
                                <View
                                    key={b.id}
                                    className="mr-2 mb-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200"
                                >
                                    <Text className="text-teal-700 text-sm font-medium">{b.name}</Text>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                <View className="bg-white rounded-2xl border border-gray-200 p-2 mb-6">
                    {isLoading && !branches.length ? (
                        <View className="py-8 items-center">
                            <ActivityIndicator size="small" />
                            <Text className="text-gray-500 mt-2">Loading branches...</Text>
                        </View>
                    ) : (
                        branches.map((b) => {
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
                        })
                    )}
                </View>
            </ScrollView>

            <View className="px-5 pb-6">
                <TouchableOpacity
                    onPress={handleContinue}
                    disabled={saving || localSelected.length === 0}
                    className={`h-12 rounded-xl items-center justify-center ${
                        saving || localSelected.length === 0 ? 'bg-gray-400' : 'bg-teal-700'
                    }`}
                    activeOpacity={0.85}
                >
                    <Text className="text-white font-semibold">
                        {saving ? 'Saving...' : 'Continue'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
