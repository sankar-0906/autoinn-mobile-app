import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Edit, Download, Trash2, Phone, Calendar, Clock, User, ClipboardList } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { JobCard } from '../../types/job-cards';

interface JobCardItemProps {
    item: JobCard;
    onPress: (id: string) => void;
}

export const JobCardItem: React.FC<JobCardItemProps> = ({ item, onPress }) => {
    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onPress(item.id)}
            className="bg-white rounded-2xl border border-gray-200 px-4 py-4 mb-3 mx-4 shadow-sm"
        >
            <View className="flex-row items-start">
                <View className="flex-1 pr-3">
                    <View className="flex-row justify-between items-center">
                        <Text className="text-teal-600 font-bold text-base">{item.id}</Text>
                        <View className="items-end">
                            <Text className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Reg. No</Text>
                            <Text className="text-gray-900 font-bold text-sm">{item.regNo}</Text>
                        </View>
                    </View>

                    <View className="flex-row items-center mt-2">
                        <User size={14} color={COLORS.gray[600]} />
                        <Text className="text-gray-700 ml-1.5 font-medium" numberOfLines={1}>
                            {item.customerName}
                        </Text>
                    </View>
                </View>
            </View>

            <View className="h-[1px] bg-gray-100 my-3" />

            <View className="space-y-1">
                <View className="flex-row items-start py-0.5">
                    <Text className="text-gray-500 text-xs">Model</Text>
                    <Text className="text-gray-900 text-xs font-semibold flex-1 text-right ml-4">
                        {item.model}
                    </Text>
                </View>
                <View className="flex-row items-center py-0.5">
                    <Text className="text-gray-500 text-xs">Service Type</Text>
                    <Text className="text-gray-900 text-xs font-semibold flex-1 text-right ml-4">
                        {item.serviceType}
                    </Text>
                </View>
                <View className="flex-row items-center py-0.5">
                    <Text className="text-gray-500 text-xs">Mechanic / Supervisor</Text>
                    <Text className="text-gray-900 text-xs font-medium flex-1 text-right ml-4">
                        {item.mechanic || '-'} / {item.supervisor || '-'}
                    </Text>
                </View>
                {item.batteryNo && (
                    <View className="flex-row items-center py-0.5">
                        <Text className="text-gray-500 text-xs">Battery No</Text>
                        <Text className="text-gray-900 text-xs font-medium flex-1 text-right ml-4">
                            {item.batteryNo}
                        </Text>
                    </View>
                )}
                <View className="flex-row items-center py-0.5">
                    <View className="flex-row items-center">
                        <Calendar size={12} color={COLORS.gray[400]} />
                        <Text className="text-gray-500 text-xs ml-1">Date/Time</Text>
                    </View>
                    <Text className="text-gray-900 text-xs font-medium flex-1 text-right ml-4">
                        {item.date} | {item.time}
                    </Text>
                </View>
            </View>

            {/* Progress Bar Section */}
            <View className="mt-4 pt-4 border-t border-gray-100">
                <View className="flex-row items-center justify-center">
                    <View className="items-center">
                        <View className={`w-3 h-3 rounded-full ${item.progress >= 0 ? 'bg-teal-600' : 'bg-gray-300'}`} />
                        <Text className="text-[10px] text-gray-500 mt-1">Pending</Text>
                    </View>
                    <View className={`h-0.5 w-12 ${item.progress >= 50 ? 'bg-teal-600' : 'bg-gray-200'}`} />
                    <View className="items-center">
                        <View className={`w-3 h-3 rounded-full ${item.progress >= 50 ? 'bg-teal-600' : 'bg-gray-300'}`} />
                        <Text className="text-[10px] text-gray-500 mt-1 text-center">In Progress</Text>
                    </View>
                    <View className={`h-0.5 w-12 ${item.progress >= 100 ? 'bg-teal-600' : 'bg-gray-200'}`} />
                    <View className="items-center">
                        <View className={`w-3 h-3 rounded-full ${item.progress >= 100 ? 'bg-teal-600' : 'bg-gray-300'}`} />
                        <Text className="text-[10px] text-gray-500 mt-1">Completed</Text>
                    </View>
                </View>
            </View>

            {/* Actions */}
            <View className="flex-row gap-2 mt-4 pt-3 border-t border-gray-100 items-center justify-between">
                <View className="flex-row gap-4">
                    <TouchableOpacity onPress={(e) => e.stopPropagation()}>
                        <Edit size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={(e) => e.stopPropagation()}>
                        <Download size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                    {item.status === "Completed" && (
                        <TouchableOpacity onPress={(e) => e.stopPropagation()}>
                            <Phone size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={(e) => e.stopPropagation()}>
                        <Trash2 size={18} color={COLORS.red[600]} />
                    </TouchableOpacity>
                </View>

                <View className="bg-teal-50 px-3 py-1 rounded-full">
                    <Text className="text-teal-700 text-[10px] font-bold uppercase">{item.status}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};
