import React, { useCallback, useEffect, useRef } from 'react';
import { BackHandler, Alert, Platform, View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChevronLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';

interface BackButtonProps {
    onPress?: () => void;
    showConfirmation?: boolean;
    confirmationTitle?: string;
    confirmationMessage?: string;
    confirmationText?: string;
    cancelText?: string;
    size?: number;
    color?: string;
    className?: string;
    disabled?: boolean;
}

interface UseBackButtonOptions {
    onBackPress?: () => boolean | void;
    showConfirmation?: boolean;
    confirmationTitle?: string;
    confirmationMessage?: string;
    confirmationText?: string;
    cancelText?: string;
}

// Custom hook for handling back button press
export const useBackButton = (options: UseBackButtonOptions = {}) => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const {
        onBackPress,
        showConfirmation = false,
        confirmationTitle = 'Discard Changes?',
        confirmationMessage = 'You have unsaved changes. Are you sure you want to go back?',
        confirmationText = 'Go Back',
        cancelText = 'Cancel'
    } = options;

    const handleBackPress = useCallback(() => {
        if (showConfirmation && onBackPress) {
            Alert.alert(
                confirmationTitle,
                confirmationMessage,
                [
                    {
                        text: cancelText,
                        style: 'cancel',
                        onPress: () => false
                    },
                    {
                        text: confirmationText,
                        style: 'destructive',
                        onPress: () => {
                            const result = onBackPress();
                            if (result !== false) {
                                navigation.goBack();
                            }
                        }
                    }
                ]
            );
            return true; // Prevent default back behavior
        }

        if (onBackPress) {
            const result = onBackPress();
            if (result === false) {
                return true; // Prevent back navigation
            }
        }

        // Default back behavior
        navigation.goBack();
        return true;
    }, [navigation, onBackPress, showConfirmation, confirmationTitle, confirmationMessage, confirmationText, cancelText]);

    // Handle Android hardware back button
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

        return () => backHandler.remove();
    }, [handleBackPress]);

    return handleBackPress;
};

// Reusable BackButton component
export const BackButton: React.FC<BackButtonProps> = ({
    onPress,
    showConfirmation = false,
    confirmationTitle = 'Discard Changes?',
    confirmationMessage = 'You have unsaved changes. Are you sure you want to go back?',
    confirmationText = 'Go Back',
    cancelText = 'Cancel',
    size = 24,
    color = COLORS.gray[900],
    className = 'mr-3',
    disabled = false
}) => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    const handlePress = useCallback(() => {
        if (disabled) return;

        if (onPress) {
            onPress();
            return;
        }

        if (showConfirmation) {
            Alert.alert(
                confirmationTitle,
                confirmationMessage,
                [
                    {
                        text: cancelText,
                        style: 'cancel'
                    },
                    {
                        text: confirmationText,
                        style: 'destructive',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } else {
            navigation.goBack();
        }
    }, [navigation, onPress, showConfirmation, confirmationTitle, confirmationMessage, confirmationText, cancelText, disabled]);

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={disabled}
            className={className}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <ChevronLeft size={size} color={disabled ? COLORS.gray[400] : color} />
        </TouchableOpacity>
    );
};

// Header with BackButton component
interface HeaderWithBackProps {
    title: string;
    subtitle?: string;
    onBackPress?: () => void;
    showConfirmation?: boolean;
    confirmationTitle?: string;
    confirmationMessage?: string;
    rightComponent?: React.ReactNode;
    backgroundColor?: string;
    textColor?: string;
    subtitleColor?: string;
}

export const HeaderWithBack: React.FC<HeaderWithBackProps> = ({
    title,
    subtitle,
    onBackPress,
    showConfirmation = false,
    confirmationTitle,
    confirmationMessage,
    rightComponent,
    backgroundColor = 'bg-white',
    textColor = 'text-gray-900',
    subtitleColor = 'text-teal-600'
}) => {
    return (
        <View className={`${backgroundColor} border-b border-gray-100 px-4 py-4 flex-row items-center justify-between`}>
            <View className="flex-row items-center flex-1">
                <BackButton
                    onPress={onBackPress}
                    showConfirmation={showConfirmation}
                    confirmationTitle={confirmationTitle}
                    confirmationMessage={confirmationMessage}
                />
                <View className="flex-1">
                    <Text className={`${textColor} text-lg font-bold`}>{title}</Text>
                    {subtitle && (
                        <Text className={`${subtitleColor} text-sm`}>{subtitle}</Text>
                    )}
                </View>
            </View>
            {rightComponent && (
                <View className="ml-3">
                    {rightComponent}
                </View>
            )}
        </View>
    );
};

// Utility functions for common back scenarios
export const backNavigationHelpers = {
    // Navigate back to specific screen
    navigateBackTo: (navigation: StackNavigationProp<RootStackParamList>, screenName: string, params?: any) => {
        navigation.navigate(screenName as keyof RootStackParamList, params);
    },

    // Go back with confirmation for unsaved changes
    goBackWithConfirmation: (
        navigation: StackNavigationProp<RootStackParamList>,
        hasUnsavedChanges: boolean,
        onConfirm?: () => void
    ) => {
        if (hasUnsavedChanges) {
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
                        onPress: () => {
                            if (onConfirm) {
                                onConfirm();
                            }
                            navigation.goBack();
                        }
                    }
                ]
            );
        } else {
            navigation.goBack();
        }
    },

    // Handle back for form screens
    handleFormBack: (
        navigation: StackNavigationProp<RootStackParamList>,
        formData: any,
        originalData: any,
        onConfirm?: () => void
    ) => {
        const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
        backNavigationHelpers.goBackWithConfirmation(navigation, hasChanges, onConfirm);
    }
};

export default BackButton;
