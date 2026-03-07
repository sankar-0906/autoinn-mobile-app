import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Modal,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { X, Search, Plus, Trash2, Check } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { getAccessories, deleteBookingAccessory } from '../src/api';

interface Accessory {
    id: string;
    partName: string;
    partNumber: string;
    mrp: number;
    quantity: number;
    discount: number;
    isPercent: boolean;
    priceBeforeDiscount: number;
    priceAfterDiscount: number;
    isSelected: boolean;
    arrayId?: string;
    new?: boolean;
}

interface AccessoryModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (accessories: Accessory[]) => void;
    initialAccessories?: Accessory[];
    modelId?: string; // Vehicle model ID for fetching specific accessories
}

const AccessoryModal: React.FC<AccessoryModalProps> = ({
    visible,
    onClose,
    onSave,
    initialAccessories = [],
    modelId
}) => {
    const [accessories, setAccessories] = useState<Accessory[]>(initialAccessories);
    const [availableAccessories, setAvailableAccessories] = useState<Accessory[]>([]);
    const [dropDownList, setDropDownList] = useState<Accessory[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
    let searchTimeout: NodeJS.Timeout;

    const [selectedDropdownItems, setSelectedDropdownItems] = useState<string[]>([]);

    useEffect(() => {
        if (visible) {
            setAccessories(initialAccessories);
            setSelectedRowKeys(initialAccessories.map(acc => acc.id));
            // Don't fetch on open - keep table empty initially
            setAvailableAccessories(initialAccessories);
            setSelectedDropdownItems([]);
            // Clear search when modal opens
            setSearchQuery('');
            setDropDownList([]);
            setLoading(false);
        }
    }, [visible, initialAccessories]);

    const fetchAccessories = async (searchString?: string) => {
        try {
            setLoading(true);
            console.log('🔧 Fetching accessories with search:', searchString);
            const response = await getAccessories(searchString);
            console.log('📄 API Response:', response.data);

            // Handle success response structure like web version
            if (response.data && response.data.response && response.data.response.code === 200) {
                let fetchedAccessories = [];

                // Get data from response.data.response.data (matching web version)
                if (response.data.response.data) {
                    fetchedAccessories = response.data.response.data;
                }

                console.log('📊 Fetched accessories count:', fetchedAccessories.length);

                // Remove duplicates by mainPartNumber (exactly like web version)
                const newArr: any[] = [];
                for (let i = 0; i < fetchedAccessories.length; i++) {
                    const element = fetchedAccessories[i];
                    if (element.mainPartNumber) {
                        if (!newArr.some((item: any) => item.mainPartNumber === element.mainPartNumber)) {
                            newArr.push(element);
                        }
                    } else {
                        newArr.push(element);
                    }
                }

                // Format for dropdown (not table)
                const formattedAccessories = newArr.map((acc: any) => ({
                    ...acc,
                    id: acc.id.toString(),
                    isPercent: false,
                    discount: 0,
                    mrp: acc.mrp || 0,
                    quantity: 1,
                    priceBeforeDiscount: acc.mrp || 0,
                    priceAfterDiscount: acc.mrp || 0,
                    isSelected: false,
                    checked: false,
                    arrayId: "",
                }));

                console.log('✅ Dropdown accessories count:', formattedAccessories.length);
                setDropDownList(formattedAccessories);
            } else {
                console.log('❌ API Error or invalid response structure:', response.data);
                setDropDownList([]);
            }
        } catch (error) {
            console.error('❌ Failed to fetch accessories:', error);
            setDropDownList([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        if (query.trim()) {
            searchTimeout = setTimeout(() => {
                fetchAccessories(query);
            }, 500);
        } else {
            // Clear dropdown when search is empty
            setDropDownList([]);
        }
    };

    const handleAccessorySelect = (accessoryId: string) => {
        const accessory = dropDownList.find(acc => acc.id === accessoryId);
        if (!accessory) return;

        console.log('🔘 Toggling accessory selection:', accessoryId, accessory.partName);

        // Toggle selection in dropdown
        if (selectedDropdownItems.includes(accessoryId)) {
            const newSelection = selectedDropdownItems.filter(id => id !== accessoryId);
            setSelectedDropdownItems(newSelection);
            console.log('❌ Deselected accessory, new count:', newSelection.length);
        } else {
            const newSelection = [...selectedDropdownItems, accessoryId];
            setSelectedDropdownItems(newSelection);
            console.log('✅ Selected accessory, new count:', newSelection.length);
        }
    };

    const addSelectedAccessories = () => {
        console.log('🔧 Adding selected accessories:', selectedDropdownItems);

        // Add all selected dropdown items to table
        const newAccessories: Accessory[] = [];

        for (const accessoryId of selectedDropdownItems) {
            const accessory = dropDownList.find(acc => acc.id === accessoryId);
            if (!accessory) {
                console.log('⚠️ Accessory not found in dropdown:', accessoryId);
                continue;
            }

            // Check if already in table
            if (availableAccessories.some(acc => acc.id === accessoryId)) {
                console.log('⚠️ Accessory already in table:', accessory.partName);
                continue;
            }

            const newAccessory = {
                ...accessory,
                isSelected: true,
            };

            newAccessories.push(newAccessory);
            console.log('✅ Preparing to add:', newAccessory.partName);
        }

        if (newAccessories.length > 0) {
            console.log(`📦 Adding ${newAccessories.length} accessories to table`);
            const updatedAccessories = [...availableAccessories, ...newAccessories];
            setAvailableAccessories(updatedAccessories);
            setSelectedRowKeys([...selectedRowKeys, ...newAccessories.map(acc => acc.id)]);

            console.log('✅ Successfully added accessories to table');
        } else {
            console.log('⚠️ No new accessories to add');
        }

        // Clear search, dropdown, and selection
        setSearchQuery('');
        setDropDownList([]);
        setSelectedDropdownItems([]);
    };

    const updateAccessoryField = (accessoryId: string, field: keyof Accessory, value: any) => {
        console.log(`🔄 Updating ${field} for accessory ${accessoryId} to:`, value);

        const updatedAccessories = availableAccessories.map(acc =>
            acc.id === accessoryId ? { ...acc, [field]: value } : acc
        );

        setAvailableAccessories(updatedAccessories);

        // Log the updated accessory for debugging
        const updatedAccessory = updatedAccessories.find(acc => acc.id === accessoryId);
        if (updatedAccessory) {
            console.log(`✅ Updated ${field}:`, updatedAccessory[field]);
        }
    };

    const handleDeleteAccessory = async (accessory: Accessory) => {
        if (!accessory.new && accessory.arrayId) {
            try {
                await deleteBookingAccessory(accessory.arrayId);
            } catch (error) {
                console.error('Failed to delete accessory:', error);
            }
        }

        setAvailableAccessories(availableAccessories.filter(acc => acc.id !== accessory.id));
        setSelectedRowKeys(selectedRowKeys.filter(id => id !== accessory.id));
    };

    const calculatePriceAfterDiscount = (accessory: Accessory) => {
        const { mrp, discount, isPercent, quantity } = accessory;
        const perUnitPrice = isPercent
            ? mrp - (mrp * discount) / 100
            : mrp - discount;
        return Math.max(0, perUnitPrice * quantity);
    };

    const handleSave = () => {
        console.log('💾 Saving accessories...');
        console.log('📊 Available accessories in table:', availableAccessories.length);
        console.log('📋 Selected row keys:', selectedRowKeys);

        const selectedAccessories = availableAccessories.filter(acc =>
            selectedRowKeys.includes(acc.id)
        );

        console.log('✅ Filtered selected accessories:', selectedAccessories.length);
        selectedAccessories.forEach(acc => {
            console.log(`  - ${acc.partName} (${acc.id})`);
        });

        // Update calculated prices
        const finalAccessories = selectedAccessories.map(acc => ({
            ...acc,
            priceBeforeDiscount: acc.mrp * acc.quantity,
            priceAfterDiscount: calculatePriceAfterDiscount(acc)
        }));

        console.log('💰 Final accessories with calculated prices:', finalAccessories.length);
        onSave(finalAccessories);
        onClose();
    };

    const renderDropdownItem = (accessory: Accessory) => {
        const isSelected = selectedDropdownItems.includes(accessory.id);

        return (
            <TouchableOpacity
                key={accessory.id}
                onPress={() => handleAccessorySelect(accessory.id)}
                className="bg-white border border-gray-200 rounded-lg p-3 mb-2 flex-row items-center justify-between"
            >
                <View className="flex-row items-center flex-1">
                    <View className={`w-4 h-4 rounded border-2 flex items-center justify-center mr-3 ${isSelected
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}>
                        {isSelected && (
                            <Check size={10} color="white" />
                        )}
                    </View>
                    <Text className="font-medium text-gray-900">{accessory.partName} - {accessory.partNumber || 'N/A'}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderAccessoryTable = () => {
        return (
            <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={true}
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 16 }}
            >
                <View style={{ minWidth: 800 }}>
                    {/* Table Header */}
                    <View className="flex-row bg-gray-50 border-b border-gray-200">
                        <View style={{ width: 60 }} className="p-3 border-r border-gray-200">
                            <Text className="text-xs font-medium text-gray-700 text-center">Sl No</Text>
                        </View>
                        <View style={{ width: 200 }} className="p-3 border-r border-gray-200">
                            <Text className="text-xs font-medium text-gray-700">Accessory Name</Text>
                        </View>
                        <View style={{ width: 120 }} className="p-3 border-r border-gray-200">
                            <Text className="text-xs font-medium text-gray-700">Accessory Code</Text>
                        </View>
                        <View style={{ width: 80 }} className="p-3 border-r border-gray-200">
                            <Text className="text-xs font-medium text-gray-700 text-center">Quantity</Text>
                        </View>
                        <View style={{ width: 120 }} className="p-3 border-r border-gray-200">
                            <Text className="text-xs font-medium text-gray-700 text-center">Discount</Text>
                        </View>
                        <View style={{ width: 100 }} className="p-3 border-r border-gray-200">
                            <Text className="text-xs font-medium text-gray-700 text-center">Before Discount</Text>
                        </View>
                        <View style={{ width: 100 }} className="p-3 border-r border-gray-200">
                            <Text className="text-xs font-medium text-gray-700 text-center">After Discount</Text>
                        </View>
                        <View style={{ width: 60 }} className="p-3">
                            <Text className="text-xs font-medium text-gray-700 text-center">Action</Text>
                        </View>
                    </View>

                    {/* Table Rows */}
                    <ScrollView>
                        {availableAccessories.length === 0 ? (
                            <View className="flex-row">
                                <View style={{ width: 60 }} className="p-3 border-r border-gray-100 items-center justify-center">
                                    <Text className="text-sm text-gray-400 text-center">-</Text>
                                </View>
                                <View style={{ width: 200 }} className="p-3 border-r border-gray-100">
                                    <Text className="text-sm text-gray-400 italic">No accessories added. Search above to add accessories.</Text>
                                </View>
                                <View style={{ width: 120 }} className="p-3 border-r border-gray-100">
                                    <Text className="text-sm text-gray-400 text-center">-</Text>
                                </View>
                                <View style={{ width: 80 }} className="p-3 border-r border-gray-100">
                                    <Text className="text-sm text-gray-400 text-center">-</Text>
                                </View>
                                <View style={{ width: 120 }} className="p-3 border-r border-gray-100">
                                    <Text className="text-sm text-gray-400 text-center">-</Text>
                                </View>
                                <View style={{ width: 100 }} className="p-3 border-r border-gray-100">
                                    <Text className="text-sm text-gray-400 text-center">-</Text>
                                </View>
                                <View style={{ width: 100 }} className="p-3 border-r border-gray-100">
                                    <Text className="text-sm text-gray-400 text-center">-</Text>
                                </View>
                                <View style={{ width: 60 }} className="p-3">
                                    <Text className="text-sm text-gray-400 text-center">-</Text>
                                </View>
                            </View>
                        ) : (
                            availableAccessories.map((accessory, index) => {
                                const isSelected = selectedRowKeys.includes(accessory.id);
                                const priceAfterDiscount = calculatePriceAfterDiscount(accessory);

                                return (
                                    <View key={accessory.id} className="flex-row border-b border-gray-100 bg-white items-center">
                                        {/* Sl No */}
                                        <View style={{ width: 60 }} className="p-3 border-r border-gray-100 items-center justify-center">
                                            <Text className="text-sm text-gray-600 text-center">{index + 1}</Text>
                                        </View>

                                        {/* Checkbox + Accessory Name */}
                                        <View style={{ width: 200 }} className="p-3 border-r border-gray-100">
                                            <View className="flex-row items-center">
                                                <TouchableOpacity
                                                    onPress={() => handleAccessorySelect(accessory.id)}
                                                    className="mr-2"
                                                >
                                                    <View className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected
                                                            ? 'bg-blue-500 border-blue-500'
                                                            : 'border-gray-300'
                                                        }`}>
                                                        {isSelected && (
                                                            <Check size={10} color="white" />
                                                        )}
                                                    </View>
                                                </TouchableOpacity>
                                                <Text className="text-sm text-gray-800 flex-1" numberOfLines={1}>{accessory.partName}</Text>
                                            </View>
                                        </View>

                                        {/* Accessory Code */}
                                        <View style={{ width: 120 }} className="p-3 border-r border-gray-100">
                                            <Text className="text-sm text-gray-600" numberOfLines={1}>{accessory.partNumber || 'N/A'}</Text>
                                        </View>

                                        {/* Quantity - FIXED */}
                                        <View style={{ width: 80 }} className="p-2 border-r border-gray-100 items-center justify-center">
                                            <TextInput
                                                value={String(accessory.quantity || 1)}
                                                onChangeText={(text) => updateAccessoryField(accessory.id, 'quantity', parseInt(text) || 1)}
                                                keyboardType="numeric"
                                                style={{
                                                    height: 36,
                                                    width: 70,
                                                    backgroundColor: '#ffffff',
                                                    borderWidth: 1,
                                                    borderColor: '#d1d5db',
                                                    borderRadius: 6,
                                                    fontSize: 14,
                                                    textAlign: 'center',
                                                    color: '#000000',
                                                    fontWeight: '600',
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 6
                                                }}
                                                placeholder="1"
                                                placeholderTextColor="#6b7280"
                                            />
                                        </View>

                                        {/* Discount - FIXED */}
                                        <View style={{ width: 120 }} className="p-2 border-r border-gray-100 items-center justify-center">
                                            <View className="flex-row items-center justify-center">
                                                <TextInput
                                                    value={String(accessory.discount || 0)}
                                                    onChangeText={(text) => updateAccessoryField(accessory.id, 'discount', parseFloat(text) || 0)}
                                                    keyboardType="numeric"
                                                    style={{
                                                        height: 36,
                                                        width: 60,
                                                        backgroundColor: '#ffffff',
                                                        borderWidth: 1,
                                                        borderColor: '#d1d5db',
                                                        borderRadius: 6,
                                                        fontSize: 14,
                                                        textAlign: 'center',
                                                        color: '#000000',
                                                        fontWeight: '600',
                                                        paddingHorizontal: 6,
                                                        paddingVertical: 6
                                                    }}
                                                    placeholder="0"
                                                    placeholderTextColor="#6b7280"
                                                />
                                                <TouchableOpacity
                                                    onPress={() => updateAccessoryField(accessory.id, 'isPercent', !accessory.isPercent)}
                                                    style={{
                                                        marginLeft: 4,
                                                        width: 28,
                                                        height: 36,
                                                        backgroundColor: '#f3f4f6',
                                                        borderWidth: 1,
                                                        borderColor: '#d1d5db',
                                                        borderRadius: 6,
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <Text style={{ fontSize: 12, color: '#374151', fontWeight: '700' }}>
                                                        {accessory.isPercent ? '%' : '₹'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/* Before Discount */}
                                        <View style={{ width: 100 }} className="p-3 border-r border-gray-100 items-center justify-center">
                                            <Text className="text-sm text-gray-800 text-right">
                                                ₹{(accessory.mrp * accessory.quantity).toFixed(2)}
                                            </Text>
                                        </View>

                                        {/* After Discount */}
                                        <View style={{ width: 100 }} className="p-3 border-r border-gray-100 items-center justify-center">
                                            <Text className="text-sm text-green-600 text-right font-medium">
                                                ₹{priceAfterDiscount.toFixed(2)}
                                            </Text>
                                        </View>

                                        {/* Action */}
                                        <View style={{ width: 60 }} className="p-3 items-center justify-center">
                                            <TouchableOpacity
                                                onPress={() => handleDeleteAccessory(accessory)}
                                                className="p-1"
                                            >
                                                <Trash2 size={14} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </ScrollView>
                </View>
            </ScrollView>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
        >
            <View className="flex-1 bg-gray-50">
                {/* Header */}
                <View className="bg-white border-b border-gray-200 px-4 py-3">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-lg font-semibold text-gray-900">Accessories Table</Text>
                        <TouchableOpacity onPress={onClose} className="p-2">
                            <X size={20} color={COLORS.gray[600]} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar */}
                <View className="bg-white px-4 py-3 border-b border-gray-200">
                    <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                        <Search size={16} color={COLORS.gray[400]} />
                        <TextInput
                            placeholder="Search accessories..."
                            value={searchQuery}
                            onChangeText={handleSearch}
                            className="flex-1 ml-2 text-gray-800"
                            placeholderTextColor={COLORS.gray[400]}
                        />
                    </View>

                    {/* Loading Indicator */}
                    {loading && (
                        <View className="mt-3 items-center">
                            <ActivityIndicator size="small" color="#3B82F6" />
                            <Text className="text-gray-500 mt-2 text-sm">Searching...</Text>
                        </View>
                    )}
                </View>

                {/* Table with Dropdown Overlay */}
                <View className="flex-1 relative">
                    {/* Table - Always show table structure */}
                    {renderAccessoryTable()}

                    {/* Dropdown Overlay - Appears over table */}
                    {dropDownList.length > 0 && (
                        <View className="absolute top-0 left-0 right-0 bg-white border border-gray-200 rounded-t-lg shadow-lg z-10">
                            <View className="px-4 py-2 border-b border-gray-200 flex-row items-center justify-between">
                                <Text className="text-sm font-medium text-gray-700">Select Accessory</Text>
                                {selectedDropdownItems.length > 0 ? (
                                    <TouchableOpacity
                                        onPress={addSelectedAccessories}
                                        className="bg-teal-600 px-3 py-1 rounded"
                                    >
                                        <Text className="text-white text-sm font-medium">Add Selected ({selectedDropdownItems.length})</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <Text className="text-gray-400 text-sm">Select items to add</Text>
                                )}
                            </View>
                            <ScrollView className="px-4 py-2" nestedScrollEnabled={true}>
                                {dropDownList.map(renderDropdownItem)}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* Bottom Actions */}
                <View className="bg-white border-t border-gray-200 px-6 py-4">
                    <View className="flex-row gap-4">
                        <TouchableOpacity
                            onPress={onClose}
                            className="flex-1 bg-gray-200 rounded-lg py-3"
                        >
                            <Text className="text-gray-800 font-medium text-center">Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSave}
                            className="flex-1 bg-teal-600 rounded-lg py-3"
                        >
                            <Text className="text-white font-medium text-center">Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default AccessoryModal;