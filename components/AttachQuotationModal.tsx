import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Search, X, Check } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { searchQuotations } from '../src/api';

interface Quotation {
  id: string;
  quotationId: string;
  customerName: string;
  vehicle: Array<{
    vehicleDetail: {
      modelName: string;
      modelCode?: string;
    };
  }>;
  createdAt: string;
}

interface AttachQuotationModalProps {
  visible: boolean;
  onClose: () => void;
  onAttach: (selectedQuotations: string[]) => void;
  customerId?: string;
  excludeIds?: string[];
}

export default function AttachQuotationModal({
  visible,
  onClose,
  onAttach,
  customerId,
  excludeIds = [],
}: AttachQuotationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedQuotations, setSelectedQuotations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setQuotations([]);
      setSelectedQuotations(new Set());
      loadQuotations();
    }
  }, [visible]);

  const loadQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await searchQuotations({
        module: 'quotations',
        column: 'quotationId',
        searchString: '',
        searchColumns: ['quotationId'],
        size: 50,
        page: 1,
        except: excludeIds.length > 0 ? excludeIds : null,
      });
      
      if (response.data.code === 200 && response.data.response.code === 200) {
        setQuotations(response.data.response.data);
      }
    } catch (error) {
      console.error('Error loading quotations:', error);
      Alert.alert('Error', 'Failed to load quotations');
    } finally {
      setLoading(false);
    }
  }, [excludeIds]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadQuotations();
      return;
    }

    setSearching(true);
    try {
      const response = await searchQuotations({
        module: 'quotations',
        column: 'quotationId',
        searchString: query,
        searchColumns: ['quotationId'],
        size: 50,
        page: 1,
        except: excludeIds.length > 0 ? excludeIds : null,
      });
      
      if (response.data.code === 200 && response.data.response.code === 200) {
        setQuotations(response.data.response.data);
      }
    } catch (error) {
      console.error('Error searching quotations:', error);
    } finally {
      setSearching(false);
    }
  }, [loadQuotations, excludeIds]);

  const toggleQuotationSelection = (quotationId: string) => {
    const newSelected = new Set(selectedQuotations);
    if (newSelected.has(quotationId)) {
      newSelected.delete(quotationId);
    } else {
      newSelected.add(quotationId);
    }
    setSelectedQuotations(newSelected);
  };

  const handleAttach = () => {
    if (selectedQuotations.size === 0) {
      Alert.alert('Warning', 'Please select at least one quotation to attach');
      return;
    }

    const selectedIds = Array.from(selectedQuotations);
    onAttach(selectedIds);
    onClose();
  };

  const renderQuotationItem = ({ item }: { item: Quotation }) => {
    const isSelected = selectedQuotations.has(item.id);
    const vehicleName = item.vehicle?.[0]?.vehicleDetail?.modelName || 'N/A';
    
    return (
      <TouchableOpacity
        onPress={() => toggleQuotationSelection(item.id)}
        className={`flex-row p-4 border-b border-gray-100 ${
          isSelected ? 'bg-teal-50' : 'bg-white'
        }`}
      >
        <View className="flex-1">
          <Text className="font-semibold text-gray-900 text-sm">
            {item.quotationId}
          </Text>
          <Text className="text-gray-600 text-xs mt-1">
            Customer: {item.customerName || 'N/A'}
          </Text>
          <Text className="text-gray-600 text-xs">
            Vehicle: {vehicleName}
          </Text>
        </View>
        <View className="w-6 h-6 rounded-full border-2 border-teal-600 items-center justify-center">
          {isSelected && (
            <Check size={16} color={COLORS.primary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-4 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-gray-900">
            Attach Quotation
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={COLORS.gray[600]} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="bg-white px-4 py-3 border-b border-gray-200">
          <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
            <Search size={20} color={COLORS.gray[400]} />
            <TextInput
              className="flex-1 ml-2 text-gray-900"
              placeholder="Search quotations..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor={COLORS.gray[400]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <X size={20} color={COLORS.gray[400]} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        <View className="flex-1">
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text className="text-gray-600 mt-2">Loading quotations...</Text>
            </View>
          ) : (
            <FlatList
              data={quotations}
              renderItem={renderQuotationItem}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center py-8">
                  <Text className="text-gray-500">
                    {searchQuery ? 'No quotations found' : 'No quotations available'}
                  </Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Footer */}
        <View className="bg-white border-t border-gray-200 px-4 py-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-600">
              {selectedQuotations.size} quotation{selectedQuotations.size !== 1 ? 's' : ''} selected
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleAttach}
            disabled={selectedQuotations.size === 0}
            className={`py-3 rounded-lg items-center ${
              selectedQuotations.size > 0
                ? 'bg-teal-600'
                : 'bg-gray-300'
            }`}
          >
            <Text className={`font-semibold ${
              selectedQuotations.size > 0 ? 'text-white' : 'text-gray-500'
            }`}>
              Attach Quotation{selectedQuotations.size !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
