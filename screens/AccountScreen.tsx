import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { User, LogOut, ChevronRight, Phone, Mail, Building2 } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AccountNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

export default function AccountScreen({ navigation }: { navigation: AccountNavigationProp }) {
    const [loggingOut, setLoggingOut] = useState(false);

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
                            Alert.alert('Error', 'Failed to sign out. Please try again.');
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

            {/* Profile Card */}
            <View className="mx-4 mt-5 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <View className="bg-teal-600 px-5 py-6 flex-row items-center">
                    <View className="w-14 h-14 bg-white/20 rounded-full items-center justify-center">
                        <User color="white" size={28} />
                    </View>
                    <View className="ml-4 flex-1">
                        <Text className="text-white font-bold text-lg">AutoCloud User</Text>
                        <Text className="text-teal-100 text-sm mt-0.5">Dealer Executive</Text>
                    </View>
                </View>

                <View className="px-5 py-4">
                    <View className="flex-row items-center py-3 border-b border-gray-50">
                        <Mail size={16} color={COLORS.gray[400]} />
                        <Text className="text-gray-600 ml-3 text-sm">user@autocloud.in</Text>
                    </View>
                    <View className="flex-row items-center py-3 border-b border-gray-50">
                        <Phone size={16} color={COLORS.gray[400]} />
                        <Text className="text-gray-600 ml-3 text-sm">+91 98765 43210</Text>
                    </View>
                    <View className="flex-row items-center py-3">
                        <Building2 size={16} color={COLORS.gray[400]} />
                        <Text className="text-gray-600 ml-3 text-sm">Devanahalli Branch</Text>
                    </View>
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
            <View className="flex-1 justify-end items-center pb-6">
                <Text className="text-gray-400 text-xs">AutoCloud Mobile v1.0.0</Text>
            </View>
        </SafeAreaView>
    );
}
