/**
 * Reusable Searchable Dropdown Component
 * Used across Job Cards module for all dropdown fields with search functionality
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Pressable,
    TextInput,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

export interface Option {
    label: string;
    value: string;
}

interface SearchableDropdownProps {
    placeholder: string;
    displayValue: string;
    options: Option[];
    onSearch: (query: string) => void;
    onSelect: (value: string, label: string) => void;
    loading?: boolean;
    disabled?: boolean;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
    placeholder,
    displayValue,
    options,
    onSearch,
    onSelect,
    loading = false,
    disabled = false,
}) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    const handleSearch = (text: string) => {
        setQuery(text);
        onSearch(text);
    };

    const handleSelect = (value: string, label: string) => {
        onSelect(value, label);
        setOpen(false);
        setQuery('');
    };

    const handleClose = () => {
        setOpen(false);
        setQuery('');
    };

    return (
        <View>
            {/* Dropdown Trigger */}
            <TouchableOpacity
                onPress={() => !disabled && setOpen(true)}
                activeOpacity={0.7}
                className={`h-12 border rounded-lg px-3 flex-row items-center justify-between ${
                    disabled ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                }`}
            >
                <Text 
                    className={`${displayValue ? 'text-gray-800' : 'text-gray-400'} flex-1`} 
                    numberOfLines={1}
                >
                    {displayValue || placeholder}
                </Text>
                {loading ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                    <ChevronDown size={16} color={COLORS.gray[400]} />
                )}
            </TouchableOpacity>

            {/* Dropdown Modal */}
            <Modal 
                visible={open} 
                transparent 
                animationType="fade" 
                onRequestClose={handleClose}
            >
                <Pressable className="flex-1 bg-black/40 justify-center" onPress={handleClose}>
                    <Pressable className="mx-4 bg-white rounded-xl p-4 max-h-[70%]" onPress={() => {}}>
                        {/* Header */}
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-base font-bold text-gray-900">Select Option</Text>
                            <TouchableOpacity onPress={handleClose}>
                                <X size={20} color={COLORS.gray[700]} />
                            </TouchableOpacity>
                        </View>

                        {/* Search Input */}
                        <TextInput
                            className="h-10 border border-gray-300 rounded-lg px-3 mb-3 text-sm text-gray-800"
                            placeholder="Search..."
                            value={query}
                            onChangeText={handleSearch}
                            autoFocus
                        />

                        {/* Loading Indicator */}
                        {loading && (
                            <ActivityIndicator 
                                size="small" 
                                color={COLORS.primary} 
                                style={{ marginVertical: 8 }} 
                            />
                        )}

                        {/* Options List */}
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {options.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    onPress={() => handleSelect(option.value, option.label)}
                                    className="flex-row items-center py-3 border-b border-gray-50"
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-sm text-gray-800">{option.label}</Text>
                                </TouchableOpacity>
                            ))}
                            
                            {/* No Results */}
                            {!loading && options.length === 0 && (
                                <Text className="text-gray-400 text-sm text-center py-4">
                                    No results found
                                </Text>
                            )}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};
