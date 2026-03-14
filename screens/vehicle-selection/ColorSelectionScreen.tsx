import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    DeviceEventEmitter,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { ChevronLeft, Check } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { ENDPOINT, getVehicleModelsByManufacturer, getManufacturers } from '../../src/api';

interface Color {
    id: string;
    code: string;
    color: string;
    url: string;
}

type ColorSelectionNavigationProp = StackNavigationProp<RootStackParamList, 'ColorSelection'>;
type ColorSelectionRouteProp = RouteProp<RootStackParamList, 'ColorSelection'>;

export default function ColorSelectionScreen({ 
    navigation, 
    route 
}: { 
    navigation: ColorSelectionNavigationProp; 
    route: ColorSelectionRouteProp 
}) {
    const [colors, setColors] = useState<Color[]>([]);
    const [selectedColor, setSelectedColor] = useState<Color | null>(null);
    const [loading, setLoading] = useState(false);
    const [modelName, setModelName] = useState('');
    const [modelId, setModelId] = useState('');

    // Get model info from route params
    const selectedModelName = route.params?.modelName as string;
    const selectedModelId = route.params?.modelId as string;

    useEffect(() => {
        if (selectedModelName) {
            setModelName(selectedModelName);
        }
        if (selectedModelId) {
            setModelId(selectedModelId);
        }
        fetchColorsForModel();
    }, [selectedModelName, selectedModelId]);

    const getAbsoluteImageUrl = (url?: string) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const base = ENDPOINT.endsWith('/') ? ENDPOINT : `${ENDPOINT}/`;
        const relative = url.startsWith('/') ? url.slice(1) : url;
        return `${base}${relative}`;
    };

    const fetchColorsForModel = async () => {
        if (!selectedModelName && !selectedModelId) {
            console.log('❌ No model name or ID provided');
            return;
        }

        setLoading(true);
        try {
            console.log('🔍 Fetching colors for model:', selectedModelName);
            
            // Get all manufacturers first
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
                            // Don't filter by vehicleStatus - include all models to get all colors
                            allModels = allModels.concat(models);
                        }
                    } catch (error) {
                        console.error('Error fetching models for manufacturer:', manufacturer.name, error);
                    }
                }
            }

            // Find the specific model
            let targetModel: any = null;
            
            if (selectedModelId) {
                // Find by ID first
                targetModel = allModels.find((model: any) => model.id === selectedModelId);
            }
            
            if (!targetModel && selectedModelName) {
                // Find by name if ID search failed
                targetModel = allModels.find((model: any) => {
                    const modelKey = `${model.modelCode} - ${model.modelName}`;
                    const modelNameLower = selectedModelName.toLowerCase();
                    const modelKeyLower = modelKey.toLowerCase();
                    
                    return modelKeyLower.includes(modelNameLower) || 
                           modelNameLower.includes(modelKeyLower) ||
                           model.modelCode?.toLowerCase() === modelNameLower ||
                           model.modelName?.toLowerCase() === modelNameLower;
                });
            }

            if (!targetModel) {
                console.log('❌ Model not found:', { selectedModelName, selectedModelId });
                setColors([]);
                return;
            }

            console.log('✅ Found model:', targetModel.modelCode, '-', targetModel.modelName);

            // Extract colors from the model's image array (like web app)
            const extractedColors: Color[] = [];
            const colorSet = new Set(); // Track unique colors
            const images = Array.isArray(targetModel.image) ? targetModel.image : [];

            images.forEach((imageData: any, index: number) => {
                // Extract color information from image array (web app approach)
                const colorCode = imageData.code || imageData.colorCode || imageData.hex || '#000000';
                const colorName = imageData.name || imageData.colorName || imageData.color || 'Unknown';
                
                // Skip if this color name already exists (filter duplicates by name only)
                if (colorSet.has(colorName)) {
                    return;
                }
                
                const color: Color = {
                    id: imageData.id || imageData.colorId || `color-${index}-${Math.random()}`,
                    code: colorCode,
                    color: colorName,
                    url: imageData.url || imageData.imageDetails?.[0]?.url || targetModel.baseImage || ''
                };
                
                colorSet.add(colorName);
                extractedColors.push(color);
            });

            // Also check price.colors as fallback
            const prices = Array.isArray(targetModel.price) ? targetModel.price : [];
            prices.forEach((price: any, index: number) => {
                if (price.colors && Array.isArray(price.colors)) {
                    price.colors.forEach((colorData: any) => {
                        const colorCode = colorData.code || colorData.colorCode || colorData.hex || '#000000';
                        const colorName = colorData.name || colorData.colorName || colorData.color || 'Unknown';
                        
                        // Skip if this color name already exists (filter duplicates by name only)
                        if (colorSet.has(colorName)) {
                            return;
                        }
                        
                        const color: Color = {
                            id: colorData.id || colorData.colorId || `price-color-${index}-${Math.random()}`,
                            code: colorCode,
                            color: colorName,
                            url: colorData.imageDetails?.[0]?.url || 
                                 colorData.url || 
                                 targetModel.baseImage ||
                                 ''
                        };
                        
                        colorSet.add(colorName);
                        extractedColors.push(color);
                    });
                }
            });

            console.log('🎨 Extracted colors:', extractedColors.length);
            console.log('🎨 Color sources:', {
                fromImageArray: images.length,
                fromPriceArray: prices.length,
                totalUnique: extractedColors.length
            });
            setColors(extractedColors);

        } catch (error) {
            console.error('❌ Error fetching colors:', error);
            setColors([]);
        } finally {
            setLoading(false);
        }
    };

    const handleColorSelect = (color: Color) => {
        setSelectedColor(color);
        console.log('🎨 Selected color:', color);
    };

    const handleConfirmSelection = () => {
        if (!selectedColor) {
            return;
        }

        // Emit color selection event
        const colorData = {
            id: selectedColor.id,
            code: selectedColor.code,
            color: selectedColor.color,
            url: selectedColor.url,
            modelName: modelName
        };

        console.log('🚗 Emitting color selection data:', colorData);
        DeviceEventEmitter.emit('colorSelected', colorData);
        
        // Navigate back
        navigation.goBack();
    };

    const renderColorItem = ({ item, index }: { item: Color; index: number }) => {
        const isSelected = selectedColor?.id === item.id;
        const imageUrl = getAbsoluteImageUrl(item.url);

        return (
            <TouchableOpacity
                key={item.id}
                onPress={() => handleColorSelect(item)}
                className={`rounded-lg border-2 overflow-hidden ${
                    isSelected ? 'border-teal-500 bg-teal-50' : 'border-gray-200 bg-white'
                }`}
            >
                {/* Color Image */}
                <View className="h-24 bg-gray-100">
                    {imageUrl ? (
                        <Image
                            source={{ uri: imageUrl }}
                            className="w-full h-full"
                            resizeMode="contain"
                        />
                    ) : (
                        <View className="w-full h-full items-center justify-center bg-gray-200">
                            <Text className="text-gray-400 text-xs">No Image</Text>
                        </View>
                    )}
                </View>

                {/* Color Info */}
                <View className="p-2">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                            <View
                                className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                                style={{ backgroundColor: item.code }}
                            />
                            <View className="flex-1">
                                <Text className="font-semibold text-gray-800 text-xs" numberOfLines={2}>
                                    {item.code} - {item.color}
                                </Text>
                            </View>
                        </View>
                        <View className="w-4 h-4 rounded-full items-center justify-center">
                            {isSelected ? (
                                <View className="w-4 h-4 rounded-full bg-teal-500 items-center justify-center">
                                    <Check size={10} color="white" />
                                </View>
                            ) : (
                                <View className="w-4 h-4 rounded-full border-2 border-gray-300" />
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white border-b border-gray-200 px-4 py-3">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ChevronLeft size={24} color={COLORS.gray[600]} />
                    </TouchableOpacity>
                    <Text className="text-lg font-semibold text-gray-800">Color Selection</Text>
                    <View className="w-6" />
                </View>
            </View>

            <ScrollView className="flex-1 px-4 py-4">
                {/* Model Info */}
                <View className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <Text className="text-sm font-medium text-blue-800">Selected Model:</Text>
                    <Text className="text-base font-semibold text-blue-900">{modelName}</Text>
                </View>

                {/* Colors List */}
                <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-3">
                        Available Colors ({colors.length})
                    </Text>
                    
                    {loading ? (
                        <View className="items-center py-8">
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text className="text-gray-500 mt-2">Loading colors...</Text>
                        </View>
                    ) : colors.length === 0 ? (
                        <View className="items-center py-8">
                            <Text className="text-gray-500">No colors found</Text>
                            <Text className="text-gray-400 text-xs mt-2">Model: "{modelName}"</Text>
                        </View>
                    ) : (
                        <View className="flex-row flex-wrap -mx-2">
                            {colors.map((item, index) => (
                                <View key={item.id} className="w-1/2 px-2 mb-4">
                                    {renderColorItem({ item, index })}
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Confirm Button */}
                <Button
                    title="Confirm Selection"
                    onPress={handleConfirmSelection}
                    disabled={!selectedColor}
                    className="mb-4"
                />
            </ScrollView>
        </SafeAreaView>
    );
}
