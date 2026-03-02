import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { searchQuotations, getQuotationById } from '../src/api';

interface Quotation {
  id: string;
  quotationId: string;
  customerName?: string | null;
  customer?: {
    name?: string;
    id?: string;
  } | string;
  vehicle?: any;
  vehicleMaster?: {
    modelName?: string;
    modelCode?: string;
  };
  createdAt: string;
}

interface AttachQuotationModalProps {
  visible: boolean;
  onClose: () => void;
  onAttach: (selectedQuotations: string[]) => void;
  customerId?: string;
  excludeIds?: string[];
}

// Cache for storing loaded quotations
const quotationCache = new Map<string, Quotation>();

// Memoized quotation item - Shows ONLY Quotation ID
const QuotationItem = React.memo(({
  item,
  isSelected,
  onPress
}: {
  item: Quotation;
  isSelected: boolean;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row p-4 border-b border-gray-100 items-center ${
        isSelected ? 'bg-teal-50' : 'bg-white'
      }`}
    >
      <View className="flex-1">
        <Text className="font-semibold text-gray-900 text-base">
          {item.quotationId}
        </Text>
      </View>
      <View className="w-6 h-6 rounded-full border-2 border-teal-600 items-center justify-center">
        {isSelected && <Check size={16} color={COLORS.primary} />}
      </View>
    </TouchableOpacity>
  );
});

export default function AttachQuotationModal({
  visible,
  onClose,
  onAttach,
  excludeIds = [],
}: AttachQuotationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([]);
  const [selectedQuotations, setSelectedQuotations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const currentPageRef = useRef(1);
  const totalPagesRef = useRef(1);
  const hasMoreRef = useRef(true);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      resetAndLoad();
    }
  }, [visible]);

  const resetAndLoad = () => {
    setSearchQuery('');
    setQuotations([]);
    setFilteredQuotations([]);
    setSelectedQuotations(new Set());
    setLoadedPages(new Set());
    currentPageRef.current = 1;
    totalPagesRef.current = 1;
    hasMoreRef.current = true;
    loadPage(1);
  };

  const loadPage = async (page: number) => {
    if (loadedPages.has(page) || !hasMoreRef.current) return;

    setLoading(page === 1);
    
    try {
      const response = await searchQuotations({
        module: 'quotations',
        column: 'quotationId',
        searchString: '',
        searchColumns: ['quotationId', 'customerName'],
        size: 50,
        page: page,
        except: excludeIds.length > 0 ? excludeIds : null,
        matchType: 'contains',
        caseSensitive: false,
      });

      if (response.data.code === 200 && response.data.response.code === 200) {
        const newQuotations = response.data.response.data;
        const total = response.data.response.total || newQuotations.length * page;
        totalPagesRef.current = Math.ceil(total / 50);
        hasMoreRef.current = page < totalPagesRef.current;

        // Update cache with new quotations
        newQuotations.forEach((q: Quotation) => {
          quotationCache.set(q.id, q);
        });

        // Update state
        setQuotations(prev => {
          const existingIds = new Set(prev.map(q => q.id));
          const uniqueNew = newQuotations.filter((q: Quotation) => !existingIds.has(q.id));
          return [...prev, ...uniqueNew];
        });

        setFilteredQuotations(prev => {
          const existingIds = new Set(prev.map(q => q.id));
          const uniqueNew = newQuotations.filter((q: Quotation) => !existingIds.has(q.id));
          return [...prev, ...uniqueNew];
        });

        setLoadedPages(prev => new Set(prev).add(page));
        currentPageRef.current = page;
      }
    } catch (error) {
      console.error(`Error loading page ${page}:`, error);
      if (page === 1) {
        Alert.alert('Error', 'Failed to load quotations');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!hasMoreRef.current || loading) return;
    loadPage(currentPageRef.current + 1);
  };

  // Optimized search with debounce - ONLY searches Quotation ID
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setSearching(true);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (!query.trim()) {
        // Reset to show all loaded quotations
        setFilteredQuotations(quotations);
        setSearching(false);
        return;
      }
      
      // Search locally in already loaded quotations - ONLY by Quotation ID
      const searchLower = query.toLowerCase().trim();
      const results = quotations.filter(item => 
        item.quotationId?.toLowerCase().includes(searchLower)
      );
      
      setFilteredQuotations(results);
      setSearching(false);
      
      console.log(`🔍 Found ${results.length} local results for "${query}"`);
    }, 300); // 300ms debounce
  }, [quotations]);

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
      Alert.alert('Warning', 'Please select at least one quotation');
      return;
    }
    onAttach(Array.from(selectedQuotations));
    onClose();
  };

  const renderItem = useCallback(({ item }: { item: Quotation }) => (
    <QuotationItem
      item={item}
      isSelected={selectedQuotations.has(item.id)}
      onPress={() => toggleQuotationSelection(item.id)}
    />
  ), [selectedQuotations]);

  const keyExtractor = useCallback((item: Quotation) => item.id, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 60, // Reduced height for single line (ID only)
    offset: 60 * index,
    index,
  }), []);

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
          <View>
            <Text className="text-lg font-bold text-gray-900">
              Select Quotation
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              {quotations.length} loaded • {filteredQuotations.length} shown
            </Text>
          </View>
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
              placeholder="Search by Quotation ID..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor={COLORS.gray[400]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searching ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <X size={20} color={COLORS.gray[400]} />
              </TouchableOpacity>
            )}
          </View>
          {searchQuery.length > 0 && (
            <Text className="text-xs text-gray-400 mt-2">
              Found {filteredQuotations.length} matching quotations
            </Text>
          )}
        </View>

        {/* Content */}
        <View className="flex-1">
          {loading && quotations.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text className="text-gray-600 mt-2">Loading quotations...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredQuotations}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              getItemLayout={getItemLayout}
              maxToRenderPerBatch={20}
              windowSize={10}
              initialNumToRender={15}
              removeClippedSubviews={true}
              onEndReached={loadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                hasMoreRef.current && !searchQuery ? (
                  <View className="py-4 items-center">
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text className="text-xs text-gray-400 mt-2">
                      Loading more...
                    </Text>
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center py-12">
                  <Text className="text-gray-500">
                    {searchQuery ? 'No matching quotations' : 'No quotations available'}
                  </Text>
                  {searchQuery && (
                    <Text className="text-gray-400 text-xs mt-2 text-center px-8">
                      Try a different Quotation ID
                    </Text>
                  )}
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
              {selectedQuotations.size} selected
            </Text>
            <View className="flex-row gap-4">
              <TouchableOpacity 
                onPress={() => setSelectedQuotations(new Set())}
                disabled={selectedQuotations.size === 0}
              >
                <Text className={`text-xs ${selectedQuotations.size > 0 ? 'text-teal-600' : 'text-gray-400'}`}>
                  Clear
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  const allIds = new Set(filteredQuotations.map(q => q.id));
                  setSelectedQuotations(allIds);
                }}
                disabled={filteredQuotations.length === 0}
              >
                <Text className={`text-xs ${filteredQuotations.length > 0 ? 'text-teal-600' : 'text-gray-400'}`}>
                  Select All
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleAttach}
            disabled={selectedQuotations.size === 0}
            className={`py-3 rounded-lg items-center ${
              selectedQuotations.size > 0 ? 'bg-teal-600' : 'bg-gray-300'
            }`}
          >
            <Text className={`font-semibold ${
              selectedQuotations.size > 0 ? 'text-white' : 'text-gray-500'
            }`}>
              Attach {selectedQuotations.size} Quotation{selectedQuotations.size !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}