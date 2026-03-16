import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    Image,
    ScrollView,
    DeviceEventEmitter
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
    baseImage?: string;
    colors?: any[];
}

const placeholder = require('../../assets/464dc6d161864c69f60b59f4ad74113c00404235.png');

// Add navigation types for Vehicle Details
type SelectVehicleColorNavigationProp = StackNavigationProp<RootStackParamList, 'SelectVehicleColor'>;
type SelectVehicleColorRouteProp = RouteProp<RootStackParamList, 'SelectVehicleColor'>;

export default function SelectVehicleColorScreen({ navigation, route }: { navigation: SelectVehicleColorNavigationProp; route: SelectVehicleColorRouteProp }) {
    // This screen is specifically for Vehicle Details color selection
    const [selectedVehicle, setSelectedVehicle] = useState<string>('');
    const [selectedColorData, setSelectedColorData] = useState<any>(null);
    const [noSelectionError, setNoSelectionError] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [manufacturers, setManufacturers] = useState<Array<{ id: string; name: string }>>([]);
    const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
    const [category, setCategory] = useState<'ALL' | 'SCOOTER' | 'MOTORCYCLE'>('ALL');
    const [models, setModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [openManufacturer, setOpenManufacturer] = useState(false);
    const [openCategory, setOpenCategory] = useState(false);

    // Get the selected model name from route params
    const selectedModelName = route.params?.modelName;

    const toggleVehicle = (id: string) => {
        console.log('🎨 toggleVehicle called with ID:', id);
        console.log('🔍 Current selectedVehicle state:', selectedVehicle);

        const newSelection = selectedVehicle === id ? '' : id;
        console.log('🔄 Setting selected vehicle from', selectedVehicle, 'to', newSelection);
        setSelectedVehicle(newSelection);
        setNoSelectionError(false);

        // Find and store the selected color data
        const selectedColor = vehicles.flatMap(v => v.colors).find((c: any) => c.id === newSelection);
        if (selectedColor) {
            setSelectedColorData(selectedColor);
            console.log('🎨 Selected color data:', selectedColor);
        }

        // Log the state change
        setTimeout(() => {
            console.log('✅ After setState - selectedVehicle:', selectedVehicle);
        }, 100);
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

        console.log(`🎨 Rendering vehicle item [${index}]:`, item.name, 'Colors:', item.colors?.length, 'Selected:', selectedColorId);

        return (
            <TouchableOpacity
                onPress={() => {
                    console.log('🔘 Tapped vehicle card:', item.name, 'Colors:', item.colors?.length);
                    // Select the first color of this vehicle
                    if (item.colors && item.colors.length > 0) {
                        const firstColorId = item.colors[0].id;
                        console.log('🎨 Selecting first color:', firstColorId);
                        toggleVehicle(firstColorId);
                    } else {
                        console.log('❌ No colors available for this vehicle');
                    }
                }}
                style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: isSelected ? '#0d9488' : '#f3f4f6',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                }}
                activeOpacity={0.8}
            >
                {/* Vehicle Image */}
                <View style={{ aspectRatio: 16 / 9, backgroundColor: '#f9fafb', borderRadius: 8, marginBottom: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <Image
                        source={item.baseImage ? { uri: getAbsoluteImageUrl(item.baseImage) || '' } : placeholder}
                        style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                        defaultSource={placeholder}
                    />
                </View>

                {/* Vehicle Name */}
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
                    {item.name}
                </Text>

                {/* Color Options */}
                {hasColors && (
                    <View style={{ marginTop: 8 }}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {item.colors.slice(0, 4).map((color: any, colorIndex: number) => {
                                const isColorSelected = selectedVehicle === color.id;
                                return (
                                    <TouchableOpacity
                                        key={color.id || colorIndex}
                                        onPress={() => toggleVehicle(color.id)}
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 16,
                                            backgroundColor: color.color || '#e5e7eb',
                                            borderWidth: 2,
                                            borderColor: isColorSelected ? '#0d9488' : '#f3f4f6',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {isColorSelected && <Check size={16} color="white" />}
                                    </TouchableOpacity>
                                );
                            })}
                            {item.colors.length > 4 && (
                                <View style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: '#f3f4f6',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Text style={{ fontSize: 10, color: '#6b7280' }}>+{item.colors.length - 4}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={{ fontSize: 10, color: '#6b7280', textAlign: 'center', marginTop: 4 }}>
                            {item.colors.length} color{item.colors.length !== 1 ? 's' : ''} available
                        </Text>
                    </View>
                )}

                {!hasColors && (
                    <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 12, color: '#ef4444', textAlign: 'center' }}>
                            No colors available
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    // Fetch manufacturers
    useEffect(() => {
        const fetchManufacturers = async () => {
            try {
                const res = await getManufacturers();
                const data = res?.data;
                if (data && data.code === 200 && data.response?.code === 200) {
                    setManufacturers(data.response.data || []);
                }
            } catch (error) {
                console.error('Error fetching manufacturers:', error);
            }
        };

        fetchManufacturers();
    }, []);

    // Fetch models when manufacturer changes
    useEffect(() => {
        if (!selectedManufacturer) return;
        setLoading(true);
        const fetchModels = async () => {
            try {
                const res = await getVehicleModelsByManufacturer(selectedManufacturer, searchQuery);
                const data = res?.data;
                if (data && data.code === 200 && data.response?.code === 200) {
                    const list = Array.isArray(data.response.data) ? data.response.data : [];
                    const available = list.filter(
                        (model: any) => model.vehicleStatus === 'AVAILABLE' && Array.isArray(model.price) && model.price.length > 0
                    );
                    const filtered = category === 'ALL' ? available : available.filter((m: any) => m.category === category);
                    setModels(filtered);
                }
            } catch (error) {
                console.error('Error fetching models:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchModels();
    }, [selectedManufacturer, category]);

    // Search functionality
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (selectedManufacturer) {
                setLoading(true);
                try {
                    const res = getVehicleModelsByManufacturer(selectedManufacturer, searchQuery);
                    res.then(response => {
                        const data = response?.data;
                        if (data && data.code === 200 && data.response?.code === 200) {
                            const list = Array.isArray(data.response.data) ? data.response.data : [];
                            const available = list.filter(
                                (model: any) => model.vehicleStatus === 'AVAILABLE' && Array.isArray(model.price) && model.price.length > 0
                            );
                            const filtered = category === 'ALL' ? available : available.filter((m: any) => m.category === category);
                            setModels(filtered);
                        }
                    }).catch(error => {
                        console.error('Error searching models:', error);
                    }).finally(() => {
                        setLoading(false);
                    });
                } catch (error) {
                    console.error('Error in search:', error);
                    setLoading(false);
                }
            }
        }, 500);

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

            // Filter by selected model name if provided
            if (selectedModelName && !modelKey.includes(selectedModelName)) {
                console.log('❌ Skipping model - does not match filter');
                return;
            }

            // Create separate vehicle for each price/vehicle combination
            prices.forEach((price: any, index: number) => {
                const imageUrl = price?.colors?.[0]?.imageDetails?.[0]?.url || model?.image?.[0]?.url || model?.image?.url || undefined;

                // Try multiple ways to get color data
                let colorName = 'Standard';
                let colorCode = '#000000';

                // Method 1: price.colors array
                if (price.colors && Array.isArray(price.colors) && price.colors.length > 0) {
                    const firstColor = price.colors[0];
                    colorName = firstColor.color || 'Standard';
                    colorCode = firstColor.code || '#000000';
                }
                // Method 2: model.image array (fallback)
                else if (model.image && Array.isArray(model.image) && model.image.length > 0) {
                    const firstImage = model.image[0];
                    colorName = firstImage.color || 'Standard';
                    colorCode = firstImage.code || '#000000';
                }

                const vehicle: Vehicle = {
                    id: price.id || model.id,
                    modelId: model.id,
                    name: modelKey,
                    model: model.modelName,
                    category: model.category,
                    imageUrl: imageUrl,
                    price: price,
                    baseImage: imageUrl,
                    colors: price.colors || []
                };

                console.log('🎨 Vehicle colors:', vehicle.colors?.length);
                vehicleList.push(vehicle);
            });
        });

        console.log('📊 Final vehicle list:', vehicleList.length);
        return vehicleList;
    }, [models, selectedModelName]);

    const handleSave = () => {
        if (!selectedColorData) {
            setNoSelectionError(true);
            return;
        }

        // Format the color name as "VRC1 - Red" like the web project
        const colorName = selectedColorData.code && selectedColorData.color 
            ? `${selectedColorData.code} - ${selectedColorData.color}`
            : selectedColorData.color || 'No Color Chosen';

        const colorDataToPass = {
            id: selectedColorData.id,
            code: selectedColorData.code,
            color: selectedColorData.color,
            name: colorName,
            url: selectedColorData.url
        };

        console.log('💾 Saving color:', colorName);
        console.log('📤 Emitting color data:', colorDataToPass);

        // Emit the color data for VehicleDetailsScreen to receive
        DeviceEventEmitter.emit('colorSelected', colorDataToPass);
        
        // Navigate back to VehicleDetails
        navigation.goBack();
    };

    // Custom SelectField component
    const SelectField = ({ placeholder, value, open, onToggle, onSelect, options }: any) => (
        <TouchableOpacity onPress={onToggle} style={{
            borderWidth: 1,
            borderColor: '#d1d5db',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: 'white'
        }}>
            <Text style={{ color: value ? '#111827' : '#9ca3af' }}>
                {value ? options.find((opt: any) => opt.value === value)?.label || placeholder : placeholder}
            </Text>
            {open && (
                <View style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 8,
                    marginTop: 4,
                    zIndex: 1000
                }}>
                    {options.map((opt: any) => (
                        <TouchableOpacity
                            key={opt.value}
                            onPress={() => onSelect(opt.value)}
                            style={{ padding: 12 }}
                        >
                            <Text>{opt.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            {/* Header */}
            <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={24} color="#374151" />
                </TouchableOpacity>
                <Text style={{ color: '#111827', fontSize: 18, fontWeight: 'bold' }}>
                    Select Vehicle Color
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Vehicle Selection Section Only */}
            <>
                {/* Filters */}
                <View style={{ padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                        <View style={{ flex: 1 }}>
                            <SelectField
                                placeholder="Select Manufacturer"
                                value={selectedManufacturer}
                                open={openManufacturer}
                                onToggle={() => {
                                    setOpenManufacturer((prev) => !prev);
                                    setOpenCategory(false);
                                }}
                                onSelect={(val) => {
                                    setSelectedManufacturer(val);
                                    setOpenManufacturer(false);
                                }}
                                options={manufacturers.map((m) => ({ label: m.name, value: m.id }))}
                            />
                        </View>
                        <View style={{ width: 125 }}>
                            <SelectField
                                placeholder="All Category"
                                value={category}
                                open={openCategory}
                                onToggle={() => {
                                    setOpenCategory((prev) => !prev);
                                    setOpenManufacturer(false);
                                }}
                                onSelect={(val) => {
                                    setCategory(val as any);
                                    setOpenCategory(false);
                                }}
                                options={[
                                    { label: 'All', value: 'ALL' },
                                    { label: 'Scooter', value: 'SCOOTER' },
                                    { label: 'Motorcycle', value: 'MOTORCYCLE' }
                                ]}
                            />
                        </View>
                    </View>

                    {/* Search */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#f3f4f6',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 8
                    }}>
                        <Search size={16} color="#6b7280" />
                        <TextInput
                            style={{ flex: 1, marginLeft: 8, color: '#111827' }}
                            placeholder="Search vehicles..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Vehicle List */}
                <View style={{ flex: 1, padding: 16 }}>
                    {loading ? (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#6b7280' }}>Loading vehicles...</Text>
                        </View>
                    ) : vehicles.length === 0 ? (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#6b7280' }}>No vehicles found</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={vehicles}
                            renderItem={renderVehicleItem}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 100 }}
                        />
                    )}

                    {noSelectionError && (
                        <View style={{ backgroundColor: '#fef2f2', borderRadius: 8, padding: 12, marginTop: 16 }}>
                            <Text style={{ color: '#dc2626', fontSize: 12 }}>
                                ⚠ Please select a vehicle color to continue.
                            </Text>
                        </View>
                    )}
                </View>

                {/* Save Button */}
                <View style={{ backgroundColor: 'white', padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={!selectedColorData}
                        style={{
                            backgroundColor: selectedColorData ? '#0d9488' : '#d1d5db',
                            paddingVertical: 12,
                            borderRadius: 8
                        }}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                            Save Color Selection
                        </Text>
                    </TouchableOpacity>
                </View>
            </>
        </SafeAreaView>
    );
}
