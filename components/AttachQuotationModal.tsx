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
import { Search, X, Check, Phone, FileText } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { searchQuotations, getQuotationById, getCustomerByPhoneNo, getCustomerQuotations } from '../src/api';
import { useToast } from '../src/ToastContext';

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
  _id?: string; // MongoDB _id field
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
      className={`flex-row p-4 border-b border-gray-100 items-center ${isSelected ? 'bg-teal-50' : 'bg-white'
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
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([]);
  const [selectedQuotations, setSelectedQuotations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [searchMode, setSearchMode] = useState<'quotationId' | 'mobile'>('quotationId');
  const [preventInitialLoad, setPreventInitialLoad] = useState(false);
  const [mobileSearchActive, setMobileSearchActive] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
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
    setSearchMode('quotationId');
    setQuotations([]);
    setFilteredQuotations([]);
    setSelectedQuotations(new Set());
    setLoadedPages(new Set());
    currentPageRef.current = 1;
    totalPagesRef.current = 1;
    hasMoreRef.current = true; // Restore loading capability
    setMobileSearchActive(false);
    
    // Only load initial data if not prevented
    if (!preventInitialLoad) {
      loadPage(1);
    }
    // Reset the flag after using it
    setPreventInitialLoad(false);
  };

  const loadPage = async (page: number) => {
    if (loadedPages.has(page) || !hasMoreRef.current || mobileSearchActive) return;

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
        toast.error('Failed to load quotations');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!hasMoreRef.current || loading || mobileSearchActive) return;
    loadPage(currentPageRef.current + 1);
  };

  // Function to search quotations by mobile number
  const searchByMobileNumber = async (mobileNumber: string) => {
    setSearching(true);
    setMobileSearchActive(true); // Prevent other data loading
    
    try {
      // First, get customer by mobile number
      const customerResponse = await getCustomerByPhoneNo(mobileNumber);
      
      // Check multiple possible response structures
      let customers = [];
      
      if (customerResponse.data.code === 200) {
        if (customerResponse.data.response && customerResponse.data.response.data) {
          if (Array.isArray(customerResponse.data.response.data.customers)) {
            customers = customerResponse.data.response.data.customers;
          } else if (Array.isArray(customerResponse.data.response.data)) {
            customers = customerResponse.data.response.data;
          }
        } else if (Array.isArray(customerResponse.data.data)) {
          customers = customerResponse.data.data;
        } else if (Array.isArray(customerResponse.data.response)) {
          customers = customerResponse.data.response;
        }
      }
      
      if (customers.length > 0) {
        // Use the first customer found
        const customer = customers[0];
        
        // Get customer ID from different possible structures
        const customerId = customer.id || customer.customerId || customer._id;
        
        if (!customerId) {
          setFilteredQuotations([]);
          toast.success('Customer found but no valid ID');
          setMobileSearchActive(false);
          return;
        }
        
        // Then get quotations for this customer
        const quotationsResponse = await getCustomerQuotations(customerId);
        
        let customerQuotations = [];
        
        // Check multiple possible response structures for quotations
        if (quotationsResponse.data.code === 200) {
          if (quotationsResponse.data.response && quotationsResponse.data.response.data) {
            customerQuotations = quotationsResponse.data.response.data;
          } else if (quotationsResponse.data.data) {
            customerQuotations = quotationsResponse.data.data;
          } else if (quotationsResponse.data.response) {
            customerQuotations = Array.isArray(quotationsResponse.data.response) 
              ? quotationsResponse.data.response 
              : [];
          }
        }
        
        if (customerQuotations.length > 0) {
          // Filter out excluded IDs
          const filteredQuotations = customerQuotations.filter((q: Quotation) => {
            const quotationId = q.id || q.quotationId || q._id;
            return quotationId && !excludeIds.includes(quotationId);
          });
          
          // COMPLETELY REPLACE ALL DATA with only mobile search results
          setQuotations([...filteredQuotations]);
          setFilteredQuotations([...filteredQuotations]);
          
          // Clear loaded pages to prevent any further loading
          setLoadedPages(new Set());
          currentPageRef.current = 1;
          totalPagesRef.current = 1;
          hasMoreRef.current = false; // Prevent loadMore from working
          
          toast.success(`Found ${filteredQuotations.length} quotations for this mobile number`);
        } else {
          setQuotations([]);
          setFilteredQuotations([]);
          setLoadedPages(new Set());
          currentPageRef.current = 1;
          totalPagesRef.current = 1;
          hasMoreRef.current = false;
          toast.success('No quotations found for this mobile number');
        }
      } else {
        setFilteredQuotations([]);
        toast.success('No customer found with this mobile number');
      }
    } catch (error) {
      setFilteredQuotations([]);
      toast.error('Failed to search by mobile number');
    } finally {
      setSearching(false);
      setMobileSearchActive(false); // Allow other data loading again
    }
  };

  // Enhanced search with debounce - supports both Quotation ID and Mobile Number
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setSearching(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (!query.trim()) {
        // Reset to show all loaded quotations and reload initial data
        setSearchMode('quotationId');
        setSearching(false);
        setMobileSearchActive(false); // Clear mobile search flag
        setPreventInitialLoad(false); // Allow initial load when clearing search
        resetAndLoad();
        return;
      }

      // Check if the query is exactly 10 digits (mobile number)
      const isMobileNumber = /^\d{10}$/.test(query.trim());
      
      if (isMobileNumber) {
        setSearchMode('mobile');
        setPreventInitialLoad(true); // Prevent initial load during mobile search
        searchByMobileNumber(query.trim());
      } else {
        setSearchMode('quotationId');
        setMobileSearchActive(false); // Clear mobile search flag for ID search
        // Search locally in already loaded quotations - by Quotation ID
        const searchLower = query.toLowerCase().trim();
        const results = quotations.filter(item =>
          item.quotationId?.toLowerCase().includes(searchLower)
        );

        setFilteredQuotations(results);
        setSearching(false);
      }
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
      toast.warn('Please select at least one quotation');
      return;
    }
    onAttach(Array.from(selectedQuotations));
    onClose();
  };

  const renderItem = useCallback(({ item }: { item: Quotation }) => {
    return (
      <QuotationItem
        item={item}
        isSelected={selectedQuotations.has(item.quotationId)}
        onPress={() => toggleQuotationSelection(item.quotationId)}
      />
    );
  }, [selectedQuotations]);

  const keyExtractor = useCallback((item: Quotation) => item.quotationId, []);

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
              placeholder={searchMode === 'mobile' ? "Enter 10-digit Mobile Number..." : "Search by Quotation ID..."}
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor={COLORS.gray[400]}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType={searchMode === 'mobile' ? 'phone-pad' : 'default'}
              maxLength={searchMode === 'mobile' ? 10 : undefined}
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
            <View className="flex-row items-center mt-2">
              {searchMode === 'mobile' ? (
                <Phone size={12} color={COLORS.gray[400]} className="mr-1" />
              ) : (
                <FileText size={12} color={COLORS.gray[400]} className="mr-1" />
              )}
              <Text className="text-xs text-gray-400">
                {searchMode === 'mobile' 
                  ? `Mobile search requires 10 digits (${searchQuery.length}/10)`
                  : `Searching by quotation ID... Found ${filteredQuotations.length} quotations`
                }
              </Text>
            </View>
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
            className={`py-3 rounded-lg items-center ${selectedQuotations.size > 0 ? 'bg-teal-600' : 'bg-gray-300'
              }`}
          >
            <Text className={`font-semibold ${selectedQuotations.size > 0 ? 'text-white' : 'text-gray-500'
              }`}>
              Attach {selectedQuotations.size} Quotation{selectedQuotations.size !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}