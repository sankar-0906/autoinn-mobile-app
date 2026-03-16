import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BackButton, HeaderWithBack, useBackButton, backNavigationHelpers } from '../../components/ui/BackButton';
import { Button } from '../../components/ui/Button';
import { ChevronLeft } from 'lucide-react-native';

// Example screen showing proper back button implementation
const ExampleScreen = () => {
    const navigation = useNavigation();
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });
    
    // Original form data for comparison
    const originalData = useRef(formData);
    
    // Check if form has unsaved changes
    const hasUnsavedChanges = () => {
        return JSON.stringify(formData) !== JSON.stringify(originalData.current);
    };
    
    // Handle back press with confirmation for unsaved changes
    const handleBackPress = () => {
        if (hasUnsavedChanges()) {
            Alert.alert(
                'Unsaved Changes',
                'You have unsaved changes. Are you sure you want to go back?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
            return true; // Prevent default back behavior
        }
        navigation.goBack();
        return true;
    };
    
    // Use the custom back button hook
    useBackButton({
        onBackPress: handleBackPress
    });
    
    // Handle save
    const handleSave = () => {
        // Save logic here
        originalData.current = { ...formData };
        Alert.alert('Success', 'Data saved successfully!');
    };
    
    // Handle form field change
    const handleFieldChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header with back button */}
            <HeaderWithBack
                title="Example Form"
                onBackPress={handleBackPress}
                showConfirmation={false} // We handle confirmation manually
            />
            
            {/* Form content */}
            <ScrollView className="flex-1 p-4">
                <View className="bg-white rounded-lg p-4 space-y-4">
                    <Text className="text-lg font-bold text-gray-900 mb-4">
                        Fill in the form below
                    </Text>
                    
                    <View>
                        <Text className="text-sm font-medium text-gray-700 mb-2">Name</Text>
                        <TextInput
                            value={formData.name}
                            onChangeText={(value) => handleFieldChange('name', value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Enter your name"
                        />
                    </View>
                    
                    <View>
                        <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
                        <TextInput
                            value={formData.email}
                            onChangeText={(value) => handleFieldChange('email', value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Enter your email"
                            keyboardType="email-address"
                        />
                    </View>
                    
                    <View>
                        <Text className="text-sm font-medium text-gray-700 mb-2">Phone</Text>
                        <TextInput
                            value={formData.phone}
                            onChangeText={(value) => handleFieldChange('phone', value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Enter your phone"
                            keyboardType="phone-pad"
                        />
                    </View>
                    
                    <View>
                        <Text className="text-sm font-medium text-gray-700 mb-2">Address</Text>
                        <TextInput
                            value={formData.address}
                            onChangeText={(value) => handleFieldChange('address', value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Enter your address"
                            multiline
                            numberOfLines={3}
                        />
                    </View>
                </View>
                
                {/* Action buttons */}
                <View className="flex-row gap-3 mt-6">
                    <Button
                        title="Cancel"
                        variant="outline"
                        className="flex-1"
                        onPress={() => {
                            if (hasUnsavedChanges()) {
                                Alert.alert(
                                    'Unsaved Changes',
                                    'You have unsaved changes. Are you sure you want to cancel?',
                                    [
                                        {
                                            text: 'Keep Editing',
                                            style: 'cancel'
                                        },
                                        {
                                            text: 'Discard Changes',
                                            style: 'destructive',
                                            onPress: () => navigation.goBack()
                                        }
                                    ]
                                );
                            } else {
                                navigation.goBack();
                            }
                        }}
                    />
                    <Button
                        title="Save"
                        className="flex-1"
                        onPress={handleSave}
                    />
                </View>
                
                {/* Instructions */}
                <View className="bg-blue-50 rounded-lg p-4 mt-6">
                    <Text className="text-sm text-blue-800 font-medium mb-2">
                        💡 Back Button Features:
                    </Text>
                    <Text className="text-xs text-blue-700 mb-1">
                        • Hardware back button is handled automatically
                    </Text>
                    <Text className="text-xs text-blue-700 mb-1">
                        • Shows confirmation dialog for unsaved changes
                    </Text>
                    <Text className="text-xs text-blue-700 mb-1">
                        • Consistent styling across all screens
                    </Text>
                    <Text className="text-xs text-blue-700">
                        • Customizable confirmation messages
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ExampleScreen;
