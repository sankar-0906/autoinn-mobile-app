import React, { useEffect, useState } from 'react';
import { Text, View, Dimensions, StyleSheet } from 'react-native';
import Animated, {
    FadeInUp,
    FadeOutUp,
    SlideInUp,
    SlideOutUp
} from 'react-native-reanimated';
import { CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react-native';

export type ToastType = 'success' | 'failed' | 'warn';

interface ToastProps {
    message: string;
    type: ToastType;
    onHide: () => void;
}

export const Toast = ({ message, type, onHide }: ToastProps) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            onHide();
        }, 2000);

        return () => clearTimeout(timer);
    }, [onHide]);

    const getStyles = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    text: 'text-green-800',
                    icon: <CheckCircle2 size={20} color="#16a34a" />
                };
            case 'failed':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-800',
                    icon: <AlertCircle size={20} color="#dc2626" />
                };
            case 'warn':
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    text: 'text-yellow-800',
                    icon: <AlertTriangle size={20} color="#ca8a04" />
                };
            default:
                return {
                    bg: 'bg-gray-50',
                    border: 'border-gray-200',
                    text: 'text-gray-800',
                    icon: <AlertCircle size={20} color="#374151" />
                };
        }
    };

    const styles = getStyles();

    if (!visible) return null;

    return (
        <Animated.View
            entering={SlideInUp.duration(400)}
            exiting={FadeOutUp.duration(300)}
            style={baseStyles.container}
        >
            <View className={`flex-row items-center p-4 rounded-xl shadow-lg border ${styles.bg} ${styles.border}`}>
                <View className="mr-3">
                    {styles.icon}
                </View>
                <Text className={`flex-1 font-medium text-sm ${styles.text}`}>
                    {message}
                </Text>
            </View>
        </Animated.View>
    );
};

const baseStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 100,
        left: 20,
        right: 20,
        zIndex: 9999,
    }
});
