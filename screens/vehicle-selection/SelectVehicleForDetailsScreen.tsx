import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    Image,
    ScrollView,
    DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { Search, ChevronRight, Check, ChevronLeft } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { ENDPOINT, getManufacturers, getVehicleModelsByManufacturer } from '../../src/api';

interface Vehicle {
    id: string;
    modelId: string;
    name: string;
    model: string;
    category?: string;
    imageUrl?: string;
    price?: any;
}

const placeholder = require('../../assets/464dc6d161864c69f60b59f4ad74113c00404235.png');

type SelectVehicleForDetailsNavigationProp = StackNavigationProp<RootStackParamList, 'SelectVehicleForDetails'>;
type SelectVehicleForDetailsRouteProp = RouteProp<RootStackParamList, 'SelectVehicleForDetails'>;

export default function SelectVehicleForDetailsScreen({ navigation, route }: { 
    navigation: SelectVehicleForDetailsNavigationProp; 
    route: SelectVehicleForDetailsRouteProp 
}) {
    const [selectedVehicle, setSelectedVehicle] = useState<string>('');
    const [noSelectionError, setNoSelectionError] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [manufacturers, setManufacturers] = useState<Array<{ id: string; name: string }>>([]);
    const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
    const [category, setCategory] = useState<'ALL' | 'SCOOTER' | 'MOTORCYCLE'>('ALL');
    const [models, setModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [openManufacturer, setOpenManufacturer] = useState(false);
    const [openCategory, setOpenCategory] = useState(false);
    const [selectedVehicleData, setSelectedVehicleData] = useState<any>(null);

    // Get the selected model name from route params
    const selectedModelName = route.params?.modelName as string;
    
    // Debug: Log what we received
    console.log('🎯 SelectVehicleForDetails - Received modelName:', selectedModelName);
    console.log('🎯 Route params:', route.params);

    const toggleVehicle = (id: string) => {
        console.log('🚗 toggleVehicle called with ID:', id);
        const newSelection = selectedVehicle === id ? '' : id;
        console.log('🔄 Setting selected vehicle from', selectedVehicle, 'to', newSelection);
        setSelectedVehicle(newSelection);
        setNoSelectionError(false);
    };

    const getAbsoluteImageUrl = (url?: string) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const base = ENDPOINT.endsWith('/') ? ENDPOINT : `${ENDPOINT}/`;
        const relative = url.startsWith('/') ? url.slice(1) : url;
        return `${base}${relative}`;
    };

    const renderVehicleItem = ({ item, index }: { item: any; index: number }) => {
        const hasColors = item.colors && item.colors.length > 0;
        const selectedColorId = selectedVehicle;
        const isSelected = selectedColorId && item.colors.some((color: any) => color.id === selectedColorId);

        console.log(`🎨 Rendering vehicle item [${index}]:`, {
            name: item.name,
            hasColors,
            colorsCount: item.colors?.length || 0,
            selectedColorId,
            isSelected,
            imageUrl: item.imageUrl,
            baseImage: item.baseImage
        });

        const imageSource = item.imageUrl ? { uri: item.imageUrl } : placeholder;

        return (
            <TouchableOpacity
                key={`${item.id}-${index}`}
                onPress={() => toggleVehicle(item.colors[0]?.id)}
                className={`mb-3 rounded-xl border-2 p-4 ${
                    isSelected ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-white'
                }`}
            >
                <View className="flex-row">
                    <View className="w-20 h-20 rounded-lg overflow-hidden mr-3 bg-gray-100">
                        <Image
                            source={imageSource}
                            className="w-full h-full"
                            defaultSource={placeholder}
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="font-bold text-gray-800 text-sm mb-1" numberOfLines={2}>
                            {item.name}
                        </Text>
                        <Text className="text-xs text-gray-500 mb-2">
                            {item.category}
                        </Text>
                        {hasColors && (
                            <View className="flex-row items-center">
                                <View
                                    className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                                    style={{ backgroundColor: item.colors[0]?.code || '#000' }}
                                />
                                <Text className="text-xs text-gray-600">
                                    {item.colors[0]?.name || 'Standard'}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View className="items-center justify-center">
                        {isSelected ? (
                            <View className="w-6 h-6 rounded-full bg-teal-500 items-center justify-center">
                                <Check size={16} color="white" />
                            </View>
                        ) : (
                            <View className="w-6 h-6 rounded-full border-2 border-gray-300" />
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const CustomDropdown = ({
        label,
        value,
        options,
        placeholder,
        open,
        onToggle,
        onSelect,
    }: {
        label: string;
        value: string;
        options: Array<{ label: string; value: string }>;
        placeholder: string;
        open: boolean;
        onToggle: () => void;
        onSelect: (val: string) => void;
    }) => {
        const selectedLabel = options.find((o) => o.value === value)?.label || '';
        const listHeight = Math.min(options.length, 5) * 44 + 8;
        return (
            <View style={{ position: 'relative', zIndex: open ? 50 : 1 }}>
                <Text className="text-sm text-gray-600 mb-1 font-medium">{label}</Text>
                <TouchableOpacity
                    onPress={onToggle}
                    style={{
                        backgroundColor: 'white',
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        height: 44,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Text style={{ color: selectedLabel ? '#111827' : '#9ca3af', fontSize: 12 }} numberOfLines={1}>
                        {selectedLabel || placeholder}
                    </Text>
                    <ChevronRight size={14} color="#9ca3af" style={{ transform: [{ rotate: '90deg' }] }} />
                </TouchableOpacity>
                {open && (
                    <View
                        style={{
                            position: 'absolute',
                            top: 52,
                            left: 0,
                            right: 0,
                            zIndex: 100,
                            elevation: 10,
                        }}
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                    >
                        <ScrollView style={{ maxHeight: 220 }}>
                            {options.map((opt) => (
                                <TouchableOpacity
                                    key={opt.value}
                                    onPress={() => {
                                        onSelect(opt.value);
                                    }}
                                    className={`px-4 py-3 border-b border-gray-50 ${value === opt.value ? 'bg-teal-50' : ''}`}
                                >
                                    <Text className={`text-sm ${value === opt.value ? 'text-teal-700 font-bold' : 'text-gray-700'}`}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
                {open && <View style={{ height: listHeight }} />}
            </View>
        );
    };

    const fetchManufacturers = async () => {
        setLoading(true);
        try {
            const res = await getManufacturers();
            const data = res?.data;
            if (data && data.code === 200 && data.response?.code === 200) {
                const list = data.response.data || [];
                setManufacturers(list.map((m: any) => ({ id: m.id, name: m.name })));
                if (!selectedManufacturer && list.length > 0) {
                    setSelectedManufacturer(list[0].id);
                }
            }
        } catch (e) {
            setManufacturers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchModels = async () => {
        if (!selectedManufacturer) return;
        setLoading(true);
        try {
            const res = await getVehicleModelsByManufacturer(selectedManufacturer, searchQuery);
            const data = res?.data;
            if (data && data.code === 200 && data.response?.code === 200) {
                const list = Array.isArray(data.response.data) ? data.response.data : [];
                // Temporarily include both AVAILABLE and NOTAVAILABLE to test
                const available = list.filter(
                    (model: any) => (model.vehicleStatus === 'AVAILABLE' || model.vehicleStatus === 'NOTAVAILABLE') && Array.isArray(model.price) && model.price.length > 0
                );
                const filtered = category === 'ALL' ? available : available.filter((m: any) => m.category === category);
                console.log('🔍 FetchModels - Total models:', list.length);
                console.log('🔍 FetchModels - Available models:', available.length);
                console.log('🔍 FetchModels - Filtered models:', filtered.length);
                console.log('🔍 FetchModels - Sample available models:', available.slice(0, 3).map((m: any) => ({ 
                    modelCode: m.modelCode, 
                    modelName: m.modelName, 
                    status: m.vehicleStatus,
                    priceCount: m.price?.length || 0
                })));
                
                // Check for Aerox models specifically
                const aeroxModels = available.filter((m: any) => 
                    m.modelName && m.modelName.toLowerCase().includes('aerox')
                );
                console.log('🔍 Aerox models found:', aeroxModels.length);
                console.log('🔍 Aerox models:', aeroxModels.map((m: any) => ({
                    modelCode: m.modelCode,
                    modelName: m.modelName,
                    status: m.vehicleStatus
                })));
                
                setModels(filtered);
            } else {
                setModels([]);
            }
        } catch (e) {
            console.error('🔍 FetchModels error:', e);
            setModels([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManufacturers();
    }, []);

    useEffect(() => {
        fetchModels();
    }, [selectedManufacturer, category]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchModels();
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const vehicles = useMemo(() => {
        const vehicleList: any[] = [];

        console.log('🚗 Processing models:', models.length);
        console.log('🎯 Selected model name filter:', selectedModelName);

        models.forEach((model: any) => {
            const prices = Array.isArray(model.price) ? model.price : [];
            const modelKey = `${model.modelCode} - ${model.modelName}`;

            console.log('📋 Processing model:', modelKey, 'Prices:', prices.length);

            // Filter by selected model name if provided - improved matching logic
            if (selectedModelName && selectedModelName.trim() !== '') {
                console.log('🔍 Filtering by model:', selectedModelName);
                console.log('🔍 Checking against modelKey:', modelKey);
                
                // Try multiple matching approaches
                const matchesByCode = model.modelCode && selectedModelName.toLowerCase().includes(model.modelCode.toLowerCase());
                const matchesByName = model.modelName && selectedModelName.toLowerCase().includes(model.modelName.toLowerCase());
                const matchesByKey = modelKey.toLowerCase().includes(selectedModelName.toLowerCase());
                const reverseMatch = selectedModelName.toLowerCase().includes(modelKey.toLowerCase());
                
                console.log('🔍 Matching results:', {
                    matchesByCode,
                    matchesByName,
                    matchesByKey,
                    reverseMatch
                });
                
                if (!matchesByCode && !matchesByName && !matchesByKey && !reverseMatch) {
                    console.log('⏭️ Skipping model - not matching selected model name');
                    return;
                } else {
                    console.log('✅ Model matches filter!');
                }
            }

            // Create separate vehicle for each price/vehicle combination
            prices.forEach((price: any, index: number) => {
                const imageUrl = price?.colors?.[0]?.imageDetails?.[0]?.url || model?.image?.[0]?.url || model?.image?.url || undefined;

                // Try multiple ways to get color data
                let colorName = 'Standard';
                let colorCode = '#000000';

                // Check all possible locations for color data
                if (price?.colors && Array.isArray(price.colors) && price.colors.length > 0) {
                    const firstColor = price.colors[0];
                    colorName = firstColor?.name || firstColor?.colorName || firstColor?.color || 'Standard';
                    colorCode = firstColor?.code || firstColor?.colorCode || firstColor?.hex || '#000000';
                    
                    // Extract the actual color ID
                    const actualColorId = firstColor?.colorId || firstColor?.id || null;
                    
                    if (actualColorId) {
                        // Create a unique vehicle for this price/vehicle combination
                        const vehicleKey = `${model.modelCode} - ${model.modelName} - ${price.id}`;
                        const vehicle = {
                            modelId: model.id,
                            priceId: price.id,
                            name: modelKey,
                            displayName: `${modelKey} - Variant ${index + 1}`,
                            model: model.modelCode,
                            category: model.category,
                            colors: [{
                                id: actualColorId,
                                name: colorName,
                                code: colorCode,
                                imageUrl,
                                price: price
                            }],
                            baseImage: imageUrl,
                            price: price
                        };

                        vehicleList.push(vehicle);
                        return; // Skip to next price
                    }
                }
                // Fallback for vehicles without color data
                else {
                    const vehicle = {
                        modelId: model.id,
                        priceId: price.id,
                        name: modelKey,
                        displayName: `${modelKey} - Variant ${index + 1}`,
                        model: model.modelCode,
                        category: model.category,
                        colors: [{
                            id: price.id || `price-${index}`,
                            name: 'Standard',
                            code: '#000000',
                            imageUrl,
                            price: price
                        }],
                        baseImage: imageUrl,
                        price: price
                    };
                    vehicleList.push(vehicle);
                }
            });
        });

        console.log('📊 Final vehicle list:', vehicleList.length);
        return vehicleList;
    }, [models, selectedModelName]);

    const handleConfirmSelection = () => {
        if (!selectedVehicle) {
            setNoSelectionError(true);
            return;
        }

        const selectedVehicleObj = vehicles.find(v => 
            v.colors.some((c: any) => c.id === selectedVehicle)
        );

        if (selectedVehicleObj) {
            const selectedColor = selectedVehicleObj.colors.find((c: any) => c.id === selectedVehicle);
            
            // Emit vehicle data for VehicleDetailsScreen to receive
            const vehicleData = {
                model: selectedVehicleObj.model,
                modelName: selectedVehicleObj.name,
                category: selectedVehicleObj.category,
                color: selectedColor?.name || 'Standard',
                colorCode: selectedColor?.code || '#000000',
                price: selectedVehicleObj.price,
                vehicleId: selectedVehicleObj.modelId
            };

            console.log('🚗 Emitting vehicle data:', vehicleData);
            DeviceEventEmitter.emit('vehicleSelected', vehicleData);
            
            // Navigate back
            navigation.goBack();
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white border-b border-gray-200 px-4 py-3">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ChevronLeft size={24} color={COLORS.gray[600]} />
                    </TouchableOpacity>
                    <Text className="text-lg font-semibold text-gray-800">Select Vehicle</Text>
                    <View className="w-6" />
                </View>
            </View>

            <ScrollView className="flex-1 px-4 py-4">
                {/* Search */}
                <View className="mb-4">
                    <Text className="text-sm text-gray-600 mb-1 font-medium">Search Vehicle</Text>
                    <View className="relative">
                        <Search size={20} color={COLORS.gray[400]} style={{ position: 'absolute', left: 12, top: 12 }} />
                        <TextInput
                            className="bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm"
                            placeholder="Search by model name..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={COLORS.gray[400]}
                        />
                    </View>
                </View>

                {/* Filters */}
                <View className="flex-row gap-3 mb-4">
                    <View className="flex-1">
                        <CustomDropdown
                            label="Manufacturer"
                            value={selectedManufacturer}
                            options={manufacturers.map(m => ({ label: m.name, value: m.id }))}
                            placeholder="Select Manufacturer"
                            open={openManufacturer}
                            onToggle={() => {
                                setOpenManufacturer(!openManufacturer);
                                setOpenCategory(false);
                            }}
                            onSelect={(val) => {
                                setSelectedManufacturer(val);
                                setOpenManufacturer(false);
                            }}
                        />
                    </View>
                    <View className="flex-1">
                        <CustomDropdown
                            label="Category"
                            value={category}
                            options={[
                                { label: 'All', value: 'ALL' },
                                { label: 'Scooter', value: 'SCOOTER' },
                                { label: 'Motorcycle', value: 'MOTORCYCLE' },
                            ]}
                            placeholder="Select Category"
                            open={openCategory}
                            onToggle={() => {
                                setOpenCategory(!openCategory);
                                setOpenManufacturer(false);
                            }}
                            onSelect={(val) => {
                                setCategory(val as 'ALL' | 'SCOOTER' | 'MOTORCYCLE');
                                setOpenCategory(false);
                            }}
                        />
                    </View>
                </View>

                {/* Vehicle List */}
                <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-3">
                        Available Vehicles ({vehicles.length})
                    </Text>
                    {loading ? (
                        <View className="items-center py-8">
                            <Text className="text-gray-500">Loading vehicles...</Text>
                        </View>
                    ) : vehicles.length === 0 ? (
                        <View className="items-center py-8">
                            <Text className="text-gray-500">No vehicles found</Text>
                            <Text className="text-gray-400 text-xs mt-2">Debug: models={models.length}, filter="{selectedModelName}"</Text>
                        </View>
                    ) : (
                        <>
                            <Text className="text-xs text-gray-500 mb-2">Debug: Found {vehicles.length} vehicles</Text>
                            <FlatList
                                data={vehicles}
                                renderItem={renderVehicleItem}
                                keyExtractor={(item, index) => `${item.id}-${index}`}
                                scrollEnabled={false}
                            />
                        </>
                    )}
                </View>

                {/* Error Message */}
                {noSelectionError && (
                    <View className="mb-4 p-3 bg-red-50 rounded-lg">
                        <Text className="text-red-600 text-sm">Please select a vehicle</Text>
                    </View>
                )}

                {/* Confirm Button */}
                <Button
                    title="Confirm Selection"
                    onPress={handleConfirmSelection}
                    className="mb-4"
                />
            </ScrollView>
        </SafeAreaView>
    );
}
