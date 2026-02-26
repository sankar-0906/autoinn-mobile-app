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
import { ChevronLeft, User, Car, CreditCard, Shield } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';

const STEPS = [
    { id: 1, label: "Customer", icon: User },
    { id: 2, label: "Vehicle", icon: Car },
    { id: 3, label: "Payment", icon: CreditCard },
    { id: 4, label: "Auth", icon: Shield },
];

type BookingRegisterNavigationProp = StackNavigationProp<RootStackParamList, 'BookingRegister'>;

export default function BookingRegisterScreen({ navigation }: { navigation: BookingRegisterNavigationProp }) {
    const [currentStep, setCurrentStep] = useState(1);

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <View className="space-y-4">
                        <Text className="text-gray-900 font-bold text-lg border-b border-gray-50 pb-2 mb-2">Customer Info</Text>
                        <Input label="Branch" value="Devanahalli" editable={false} />
                        <Input label="Customer Name" placeholder="Enter Name" />
                        <Input label="Mobile" placeholder="9876543210" keyboardType="phone-pad" />
                        <Input label="Address" placeholder="Address Line 1" />
                        <Input label="Locality" placeholder="Locality" />
                        <Input label="Pincode" placeholder="Pincode" keyboardType="number-pad" />
                    </View>
                );
            case 2:
                return (
                    <View className="space-y-4">
                        <Text className="text-gray-900 font-bold text-lg border-b border-gray-50 pb-2 mb-2">Vehicle Info</Text>
                        <Input label="Manufacturer" value="India Yamaha Motors" editable={false} />
                        <Input label="Model" placeholder="Select Model" />
                        <Input label="Color" placeholder="Select Color" />
                        <View className="bg-teal-50 p-4 rounded-xl border border-teal-100 flex-row justify-between items-center">
                            <Text className="text-teal-900 font-medium">Accessories</Text>
                            <Text className="text-teal-600 font-bold">Add +</Text>
                        </View>
                    </View>
                );
            case 3:
                return (
                    <View className="space-y-4">
                        <Text className="text-gray-900 font-bold text-lg border-b border-gray-50 pb-2 mb-2">Payment Info</Text>
                        <Input label="Booking Amount" placeholder="₹ 0.00" keyboardType="numeric" />
                        <Input label="Mode" placeholder="Select Mode" />
                        <Input label="Financier" placeholder="Select Financier" />
                    </View>
                );
            case 4:
                return (
                    <View className="space-y-4 items-center py-10">
                        <Shield size={64} color={COLORS.primary} />
                        <Text className="text-gray-900 font-bold text-xl mt-4">Customer Authentication</Text>
                        <Text className="text-gray-500 text-center px-10 mt-2">Please verify the customer identity before completing the booking.</Text>
                        <Button title="Send OTP" className="w-full mt-6" onPress={() => {}} />
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="px-4 py-4 border-b border-gray-100 flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity className="mr-3" onPress={() => navigation.goBack()}>
                        <ChevronLeft size={24} color={COLORS.gray[900]} />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-xl font-bold text-gray-900">Booking Register</Text>
                        <Text className="text-gray-500 text-xs">ID: New | Type: Confirm</Text>
                    </View>
                </View>
            </View>

            {/* Steps Indicator */}
            <View className="px-6 py-4 border-b border-gray-50 flex-row justify-between">
                {STEPS.map((step, index) => (
                    <View key={step.id} className="items-center flex-1">
                        <View className={`w-10 h-10 rounded-full items-center justify-center ${currentStep === step.id ? 'bg-teal-600 shadow-sm' :
                                currentStep > step.id ? 'bg-teal-100' : 'bg-gray-100'
                            }`}>
                            <step.icon size={20} color={currentStep >= step.id ? (currentStep === step.id ? 'white' : COLORS.primary) : COLORS.gray[400]} />
                        </View>
                        <Text className={`text-[10px] mt-1 font-bold ${currentStep === step.id ? 'text-teal-600' : 'text-gray-400'}`}>{step.label}</Text>
                    </View>
                ))}
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1 p-6">
                    {renderStepContent()}
                    <View className="h-20" />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer */}
            <View className="p-4 border-t border-gray-100 flex-row gap-3">
                {currentStep > 1 && (
                    <Button title="Back" variant="outline" className="flex-1" onPress={() => setCurrentStep(currentStep - 1)} />
                )}
                <Button
                    title={currentStep === 4 ? "Complete" : "Next"}
                    className="flex-1"
                    onPress={() => currentStep < 4 ? setCurrentStep(currentStep + 1) : navigation.goBack()}
                />
            </View>
        </SafeAreaView>
    );
}
