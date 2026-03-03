import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ChevronRight, Calendar, FileText } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { getQuotationById } from '../src/api';
import { useToast } from '../src/ToastContext';

interface Quotation {
  id: string;
  quotationId: string;
  createdAt: string;
  vehicle?: Array<{
    vehicleDetail: {
      modelName: string;
      modelCode?: string;
    };
  }>;
}

interface AssociatedQuotationsProps {
  quotations: Quotation[];
  onViewQuotation?: (quotation: Quotation) => void;
  loading?: boolean;
}

export default function AssociatedQuotations({
  quotations,
  onViewQuotation,
  loading = false,
}: AssociatedQuotationsProps) {
  const toast = useToast();
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const handleViewQuotation = async (quotation: Quotation) => {
    if (onViewQuotation) {
      onViewQuotation(quotation);
      return;
    }

    setLoadingDetail(true);
    try {
      const response = await getQuotationById(quotation.id);
      if (response.data.code === 200 && response.data.response.code === 200) {
        setSelectedQuotation(response.data.response.data);
      } else {
        toast.error('Failed to load quotation details');
      }
    } catch (error) {
      console.error('Error fetching quotation:', error);
      toast.error('Failed to load quotation details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const getVehicleName = (quotation: Quotation) => {
    if (quotation.vehicle && quotation.vehicle.length > 0) {
      return quotation.vehicle[0].vehicleDetail?.modelName || 'N/A';
    }
    return 'N/A';
  };

  const getVehicleCode = (quotation: Quotation) => {
    if (quotation.vehicle && quotation.vehicle.length > 0) {
      return quotation.vehicle[0].vehicleDetail?.modelCode || 'N/A';
    }
    return 'N/A';
  };

  const renderQuotationItem = ({ item }: { item: Quotation }) => (
    <TouchableOpacity
      onPress={() => handleViewQuotation(item)}
      className="bg-white border border-gray-100 rounded-xl p-4 mb-3 shadow-sm"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 mb-1">
            {item.quotationId}
          </Text>
          <View className="flex-row items-center">
            <Calendar size={14} color={COLORS.gray[400]} />
            <Text className="text-gray-500 text-sm ml-1.5">
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>
        <ChevronRight size={20} color={COLORS.gray[400]} />
      </View>

      <View className="border-t border-gray-50 pt-3">
        <View className="flex-row items-center mb-2">
          <FileText size={14} color={COLORS.gray[400]} />
          <Text className="text-gray-600 text-sm ml-2">Model Code:</Text>
          <Text className="text-gray-900 text-sm font-medium ml-1 flex-1">
            {getVehicleCode(item)}
          </Text>
        </View>
        <View className="flex-row items-center">
          <FileText size={14} color={COLORS.gray[400]} />
          <Text className="text-gray-600 text-sm ml-2">Model Name:</Text>
          <Text className="text-gray-900 text-sm font-medium ml-1 flex-1">
            {getVehicleName(item)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          handleViewQuotation(item);
        }}
        className="mt-3 pt-3 border-t border-gray-50"
      >
        <Text className="text-teal-600 font-semibold text-sm text-center">
          View Quotation Details
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="text-gray-600 mt-2">Loading quotations...</Text>
      </View>
    );
  }

  if (!quotations || quotations.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <FileText size={48} color={COLORS.gray[300]} />
        <Text className="text-gray-500 mt-3 text-center">
          No quotations found for this customer
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="mb-4">
        <Text className="text-gray-700 text-sm font-medium">
          {quotations.length} quotation{quotations.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      <FlatList
        data={quotations}
        renderItem={renderQuotationItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Quotation Detail Modal */}
      {selectedQuotation && (
        <View className="absolute inset-0 bg-black bg-opacity-50 items-center justify-center p-4">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">
                Quotation Details
              </Text>
              <TouchableOpacity onPress={() => setSelectedQuotation(null)}>
                <Text className="text-gray-500 text-xl">×</Text>
              </TouchableOpacity>
            </View>

            {loadingDetail ? (
              <View className="items-center justify-center py-4">
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : (
              <View>
                <View className="mb-3">
                  <Text className="text-gray-600 text-sm">Quotation ID</Text>
                  <Text className="text-gray-900 font-medium">
                    {selectedQuotation.quotationId}
                  </Text>
                </View>
                <View className="mb-3">
                  <Text className="text-gray-600 text-sm">Created On</Text>
                  <Text className="text-gray-900 font-medium">
                    {formatDate(selectedQuotation.createdAt)}
                  </Text>
                </View>
                <View className="mb-3">
                  <Text className="text-gray-600 text-sm">Vehicle</Text>
                  <Text className="text-gray-900 font-medium">
                    {getVehicleName(selectedQuotation)}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setSelectedQuotation(null)}
              className="mt-4 pt-4 border-t border-gray-100"
            >
              <Text className="text-teal-600 font-semibold text-center">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
