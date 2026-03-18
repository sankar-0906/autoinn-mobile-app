/**
 * Reusable Select Field Component
 * Used across booking forms for dropdown selection
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Pressable,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

export interface Option {
    label: string;
    value: string;
}

interface SelectFieldProps {
    placeholder: string;
    value: string;
    options: Option[];
    onSelect: (value: string) => void;
    modalVisible: boolean;
    setModalVisible: (visible: boolean) => void;
    loading?: boolean;
    disabled?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
    placeholder,
    value,
    options,
    onSelect,
    modalVisible,
    setModalVisible,
    loading = false,
    disabled = false,
}) => {
    const selectedOption = options.find(option => option.value === value);

    const handleSelect = (option: Option) => {
        onSelect(option.value);
        setModalVisible(false);
    };

    return (
        <View className="mb-4">
            <TouchableOpacity
                onPress={() => !disabled && setModalVisible(true)}
                className={`mt-1.5 px-3 py-2.5 border rounded-lg flex-row items-center justify-between ${
                    disabled ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-300'
                }`}
                disabled={disabled}
            >
                <Text className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedOption?.label || placeholder}
                </Text>
                <ChevronDown size={18} color={COLORS.gray[400]} />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="bg-white rounded-lg w-11/12 max-h-96">
                        <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                            <Text className="text-lg font-semibold">Select {placeholder}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={20} color={COLORS.gray[600]} />
                            </TouchableOpacity>
                        </View>

                        {loading ? (
                            <View className="p-8 justify-center items-center">
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text className="mt-2 text-gray-600">Loading...</Text>
                            </View>
                        ) : (
                            <ScrollView className="flex-1">
                                {options.map((option, index) => (
                                    <Pressable
                                        key={option.value}
                                        onPress={() => handleSelect(option)}
                                        className={`p-4 border-b border-gray-100 ${
                                            option.value === value ? 'bg-teal-50' : ''
                                        }`}
                                    >
                                        <Text
                                            className={`${
                                                option.value === value
                                                    ? 'text-teal-600 font-semibold'
                                                    : 'text-gray-900'
                                            }`}
                                        >
                                            {option.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};
