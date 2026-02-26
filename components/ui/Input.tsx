import React from 'react';
import { TextInput, View, Text, TextInputProps } from 'react-native';
import { COLORS } from '../../constants/colors';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    containerStyle = '',
    ...props
}) => {
    return (
        <View className={`mb-4 ${containerStyle}`}>
            {label && (
                <Text className="mb-1 text-sm font-medium text-gray-700">
                    {label}
                </Text>
            )}
            <TextInput
                placeholderTextColor={COLORS.gray[400]}
                className={`h-12 rounded-lg border bg-white px-4 text-slate-900 ${error ? 'border-red-600' : 'border-gray-200'
                    }`}
                {...props}
            />
            {error && (
                <Text className="mt-1 text-xs text-red-600">
                    {error}
                </Text>
            )}
        </View>
    );
};
