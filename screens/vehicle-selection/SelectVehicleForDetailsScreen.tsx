import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
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
    const [models, setModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
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

        // Use the actual vehicle image from API, not placeholder
        const imageSource = item.baseImage ? { uri: getAbsoluteImageUrl(item.baseImage) || undefined } : undefined;

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
                        {imageSource ? (
                            <Image
                                source={imageSource}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="w-full h-full bg-gray-200 items-center justify-center">
                                <Text className="text-gray-400 text-xs">No Image</Text>
                            </View>
                        )}
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

    const fetchModelsForSelectedModel = async () => {
        if (!selectedModelName) {
            console.log('❌ No model name provided');
            return;
        }
        
        setLoading(true);
        try {
            console.log('🔍 Fetching models for selected model:', selectedModelName);
            
            // Get all manufacturers first to find the right one
            const manufacturersRes = await getManufacturers();
            let allModels: any[] = [];
            
            if (manufacturersRes.data?.code === 200 && manufacturersRes.data.response?.code === 200) {
                const manufacturers = manufacturersRes.data.response.data || [];
                
                // Fetch models from all manufacturers
                for (const manufacturer of manufacturers) {
                    try {
                        const modelsRes = await getVehicleModelsByManufacturer(manufacturer.id, '');
                        if (modelsRes.data?.code === 200 && modelsRes.data.response?.code === 200) {
                            const models = Array.isArray(modelsRes.data.response.data) ? modelsRes.data.response.data : [];
                            allModels = allModels.concat(models);
                        }
                    } catch (error) {
                        console.error('Error fetching models for manufacturer:', manufacturer.name, error);
                    }
                }
            }
            
            console.log('� Total models fetched:', allModels.length);
            
            // Filter models that match the selected model name
            const matchingModels = allModels.filter((model: any) => {
                const modelKey = `${model.modelCode} - ${model.modelName}`;
                const modelNameLower = selectedModelName.toLowerCase();
                const modelKeyLower = modelKey.toLowerCase();
                const modelCodeLower = model.modelCode?.toLowerCase() || '';
                const modelNameLowerField = model.modelName?.toLowerCase() || '';
                
                // More flexible matching for R15 and other models
                // Extract base model name (like "R15" from "B9E200 - R15 V3")
                const baseModelName = selectedModelName.split(' - ')[1]?.toLowerCase() || '';
                const baseModelNameFromKey = modelKey.split(' - ')[1]?.toLowerCase() || '';
                
                console.log('🔍 Model matching:', {
                    selectedModel: selectedModelName,
                    currentModel: modelKey,
                    baseModelName,
                    baseModelNameFromKey,
                    modelCode: model.modelCode,
                    modelName: model.modelName
                });
                
                // Multiple matching strategies
                const matchesByCode = modelCodeLower.includes(baseModelName) || baseModelName.includes(modelCodeLower);
                const matchesByName = modelNameLowerField.includes(baseModelName) || baseModelName.includes(modelNameLowerField);
                const matchesByKey = modelKeyLower.includes(modelNameLower) || modelNameLower.includes(modelKeyLower);
                const matchesByBaseName = baseModelName && baseModelNameFromKey && 
                    (baseModelNameFromKey.includes(baseModelName) || baseModelName.includes(baseModelNameFromKey));
                const matchesByPartial = baseModelName && (
                    modelKeyLower.includes(baseModelName) || 
                    modelNameLowerField.includes(baseModelName) ||
                    modelCodeLower.includes(baseModelName)
                );
                
                const isMatch = matchesByCode || matchesByName || matchesByKey || matchesByBaseName || matchesByPartial;
                
                console.log('🔍 Matching results:', {
                    matchesByCode,
                    matchesByName,
                    matchesByKey,
                    matchesByBaseName,
                    matchesByPartial,
                    isMatch
                });
                
                return isMatch;
            });
            
            console.log('✅ Matching models found:', matchingModels.length);
            console.log('📋 Matching models:', matchingModels.map((m: any) => ({
                modelCode: m.modelCode,
                modelName: m.modelName,
                status: m.vehicleStatus,
                priceCount: m.price?.length || 0
            })));
            
            // If no exact matches found, don't show fallback - keep it empty
            if (matchingModels.length === 0) {
                console.log('⚠️ No exact matches found for model:', selectedModelName);
                setModels([]); // Keep empty to show "No vehicles found"
            } else {
                // Filter to show only available models
                const availableMatchingModels = matchingModels.filter((model: any) => 
                    model.vehicleStatus === 'AVAILABLE' && 
                    Array.isArray(model.price) && 
                    model.price.length > 0
                );
                
                console.log('🔄 Filtered to available models only:', availableMatchingModels.length);
                setModels(availableMatchingModels);
            }
            
        } catch (error) {
            console.error('❌ Error fetching models:', error);
            setModels([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModelsForSelectedModel();
    }, [selectedModelName]);

    const vehicles = useMemo(() => {
        const vehicleList: any[] = [];

        console.log('🚗 Processing models:', models.length);
        console.log('🎯 Selected model name filter:', selectedModelName);

        models.forEach((model: any) => {
            const prices = Array.isArray(model.price) ? model.price : [];
            const modelKey = `${model.modelCode} - ${model.modelName}`;

            console.log('📋 Processing model:', modelKey, 'Prices:', prices.length);

            // Models are already filtered in fetchModelsForSelectedModel, so process all of them
            // Create separate vehicle for each price/vehicle combination
            prices.forEach((price: any, index: number) => {
                // Try multiple image sources from API
                const imageUrl = price?.colors?.[0]?.imageDetails?.[0]?.url || 
                                model?.image?.[0]?.url || 
                                model?.image?.url || 
                                model?.baseImage ||
                                price?.image?.[0]?.url ||
                                price?.image?.url;
                
                console.log('🖼️ Image sources for', modelKey, ':', {
                    priceColorImage: price?.colors?.[0]?.imageDetails?.[0]?.url,
                    modelImage: model?.image?.[0]?.url,
                    modelImageUrl: model?.image?.url,
                    modelBaseImage: model?.baseImage,
                    priceImage: price?.image?.[0]?.url,
                    priceImageUrl: price?.image?.url,
                    finalUrl: imageUrl
                });

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
                    <Text className="text-lg font-semibold text-gray-800">Select Vehicle Color</Text>
                    <View className="w-6" />
                </View>
            </View>

            <ScrollView className="flex-1 px-4 py-4">
                {/* Model Info */}
                <View className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <Text className="text-sm font-medium text-blue-800">Selected Model:</Text>
                    <Text className="text-base font-semibold text-blue-900">{selectedModelName}</Text>
                    {vehicles.length > 0 && vehicles[0].name !== selectedModelName && (
                        <Text className="text-xs text-blue-700 mt-1">Showing similar available models</Text>
                    )}
                </View>

                {/* Vehicle List */}
                <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-3">
                        Available Colors ({vehicles.length})
                    </Text>
                    {loading ? (
                        <View className="items-center py-8">
                            <Text className="text-gray-500">Loading vehicle colors...</Text>
                        </View>
                    ) : vehicles.length === 0 ? (
                        <View className="items-center py-8">
                            <Text className="text-gray-500">No vehicle colors found</Text>
                            <Text className="text-gray-400 text-xs mt-2">Model: "{selectedModelName}"</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={vehicles}
                            renderItem={renderVehicleItem}
                            keyExtractor={(item, index) => `${item.id}-${index}`}
                            scrollEnabled={false}
                        />
                    )}
                </View>

                {/* Error Message */}
                {noSelectionError && (
                    <View className="mb-4 p-3 bg-red-50 rounded-lg">
                        <Text className="text-red-600 text-sm">Please select a vehicle color</Text>
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
