import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, getCurrentUser } from '../../src/api';
import { Eye, EyeOff, Lock, Phone, Check } from 'lucide-react-native';
import { RootStackParamList } from '../../navigation/types';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: { navigation: LoginScreenNavigationProp }) {
    const [showPassword, setShowPassword] = useState(false);
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const saved = await AsyncStorage.getItem('rememberMe');
                if (saved === 'true') {
                    const savedPhone = await AsyncStorage.getItem('rememberPhone');
                    const savedPassword = await AsyncStorage.getItem('rememberPassword');
                    if (savedPhone) setPhone(savedPhone);
                    if (savedPassword) setPassword(savedPassword);
                    setRememberMe(true);
                }
            } catch (e) {
                // ignore
            }
        })();
    }, []);

    const handleLogin = async () => {
        if (!phone || !password) {
            Alert.alert('Error', 'Please enter phone and password');
            return;
        }

        setLoading(true);
        try {
            const resp = await login(phone, password);

            const data = resp?.data;
            if (data && data.code === 200 && data.response && data.response.code === 200) {
                const token = data.response.data.token;
                if (token) {
                    await AsyncStorage.setItem('token', token);
                }

                // fetch current user profile
                try {
                    const me = await getCurrentUser();
                    const meData = me?.data;
                    if (meData && meData.code === 200 && meData.response && meData.response.code === 200) {
                        console.log("User Logged In --");
                        
                        await AsyncStorage.setItem('userProfile', JSON.stringify(meData.response.data));
                    }
                } catch (e) {
                    // ignore profile fetch errors for now 8637432140
                }

                await AsyncStorage.setItem('isLoggedIn', 'true');
                await AsyncStorage.setItem('userPhone', phone);
                if (rememberMe) {
                    await AsyncStorage.setItem('rememberMe', 'true');
                    await AsyncStorage.setItem('rememberPhone', phone);
                    await AsyncStorage.setItem('rememberPassword', password);
                } else {
                    await AsyncStorage.removeItem('rememberMe');
                    await AsyncStorage.removeItem('rememberPhone');
                    await AsyncStorage.removeItem('rememberPassword');
                }

                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Main' }],
                });
            } else {
                const msg = (data && data.response && data.response.message) || 'Invalid credentials';
                Alert.alert('Login Failed', msg);
            }
        } catch (error) {
            console.error('Login error', error);
            Alert.alert('Login Failed', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, justifyContent: 'center' }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="w-full max-w-md self-center bg-white rounded-xl p-7 border border-gray-100 mb-7">
                        <View className="items-center mb-8">
                            <Image
                                source={require('../../assets/d9a893d37378e1ed6bcfab76f3f1ea015f60b287.png')}
                                resizeMode="contain"
                                style={{ width: 240, height: 72 }}
                            />
                        </View>

                        <View>
                            <View className="relative mb-4">
                                <View className="absolute left-3 top-3.5 z-10">
                                    <Phone size={18} color="#0D9488" />
                                </View>
                                <TextInput
                                    placeholder="8637432140"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    className="h-12 bg-blue-50 border border-blue-100 rounded-md pl-10 pr-4 text-gray-900"
                                    placeholderTextColor="#6B7280"
                                />
                            </View>

                            <View className="relative mb-4">
                                <View className="absolute left-3 top-3.5 z-10">
                                    <Lock size={18} color="#0D9488" />
                                </View>
                                <TextInput
                                    placeholder="••••••••"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    className="h-12 bg-blue-50 border border-blue-100 rounded-md pl-10 pr-12 text-gray-900"
                                    placeholderTextColor="#9CA3AF"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-3"
                                    activeOpacity={0.7}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} color="#9CA3AF" />
                                    ) : (
                                        <Eye size={20} color="#9CA3AF" />
                                    )}
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                onPress={async () => {
                                    const next = !rememberMe;
                                    setRememberMe(next);
                                    if (!next) {
                                        await AsyncStorage.removeItem('rememberMe');
                                        await AsyncStorage.removeItem('rememberPhone');
                                        await AsyncStorage.removeItem('rememberPassword');
                                    }
                                }}
                                className="flex-row items-center mb-5"
                                activeOpacity={0.7}
                            >
                                <View
                                    className={`w-4 h-4 rounded border items-center justify-center ${rememberMe ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300'}`}
                                >
                                    {rememberMe && <Check size={12} color="white" />}
                                </View>
                                <Text className="ml-2 text-sm text-gray-700">Remember me</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleLogin}
                                disabled={loading}
                                className={`h-12 rounded-md items-center justify-center ${loading ? 'bg-teal-500' : 'bg-teal-700'}`}
                                activeOpacity={0.85}
                            >
                                <Text className="text-white font-medium text-base">
                                    {loading ? 'Signing In...' : 'Sign In'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
