import React from 'react';
import { FlatList, View, Text } from 'react-native';
import { JobCardItem } from '../../../components/job-cards/JobCardItem';
import type { JobCardRecord } from '../../../types/job-cards';

interface SectionProps {
    data: JobCardRecord[];
    onItemPress: (id: string) => void;
    onEdit?: (item: JobCardRecord) => void;
    onDelete?: (id: string) => void;
    loading: boolean;
    onRefresh: () => void;
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
    searchQuery?: string;
    renderPaginationFooter?: () => React.ReactNode;
}

export const InProgressSection: React.FC<SectionProps> = ({ data, onItemPress, onEdit, onDelete, loading, onRefresh, renderPaginationFooter }) => (
    <FlatList
        data={data}
        renderItem={({ item }) => (
            <JobCardItem item={item} onPress={onItemPress} onEdit={onEdit} onDelete={onDelete} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 16 }}
        refreshing={loading}
        onRefresh={onRefresh}
        ListEmptyComponent={
            <View className="flex-1 items-center justify-center p-10">
                <Text className="text-gray-500 text-center text-lg">No job cards in progress.</Text>
            </View>
        }
        ListFooterComponent={renderPaginationFooter}
    />
);
