import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { COLORS } from '../../constants/colors';

interface ButtonProps {
    onPress: () => void;
    title: string;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'outline' | 'danger';
    className?: string;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    onPress,
    title,
    loading = false,
    disabled = false,
    variant = 'primary',
    className = '',
    icon,
}) => {
    const getVariantStyles = () => {
        if (loading || disabled) return 'bg-gray-300';
        switch (variant) {
            case 'outline':
                return 'bg-white border border-teal-600';
            case 'danger':
                return 'bg-red-600';
            default:
                return 'bg-teal-600';
        }
    };

    const getTextStyles = () => {
        if (loading || disabled) return 'text-gray-500';
        switch (variant) {
            case 'outline':
                return 'text-teal-600';
            default:
                return 'text-white';
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            disabled={loading || disabled}
            onPress={onPress}
            className={`h-12 flex-row items-center justify-center rounded-lg px-4 ${getVariantStyles()} ${className}`}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? COLORS.primary : 'white'} />
            ) : (
                <View className="flex-row items-center">
                    {icon && <View className="mr-2">{icon}</View>}
                    <Text className={`font-semibold text-base ${getTextStyles()}`}>
                        {title}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};
