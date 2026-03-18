import React from 'react';
import { FlatList, View, Text } from 'react-native';
import { JobCardItem } from '../../../components/job-cards/JobCardItem';
import { JobCard } from '../../../types/job-cards';

interface CompletedSectionProps {
    data: JobCard[];
    onItemPress: (id: string) => void;
    loading: boolean;
    onRefresh: () => void;
}

export const CompletedSection: React.FC<CompletedSectionProps> = ({ data, onItemPress, loading, onRefresh }) => {
    return (
        <FlatList
            data={data}
            renderItem={({ item }) => <JobCardItem item={item} onPress={onItemPress} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 16 }}
            refreshing={loading}
            onRefresh={onRefresh}
            ListEmptyComponent={
                <View className="flex-1 items-center justify-center p-10">
                    <Text className="text-gray-500 text-center text-lg">No completed job cards found.</Text>
                </View>
            }
        />
    );
};
