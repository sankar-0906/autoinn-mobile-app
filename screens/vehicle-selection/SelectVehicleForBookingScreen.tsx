import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    Image,
    ScrollView,
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

// Add BookingActivity to navigation types (we'll update this separately)
type SelectVehicleForBookingNavigationProp = StackNavigationProp<RootStackParamList, 'SelectVehicleForBooking'>;
type SelectVehicleForBookingRouteProp = RouteProp<RootStackParamList, 'SelectVehicleForBooking'>;

export default function SelectVehicleForBookingScreen({ navigation, route }: { navigation: SelectVehicleForBookingNavigationProp; route: SelectVehicleForBookingRouteProp }) {
    // This screen is specifically for Booking Register, so we don't need complex params
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
    const [showPriceSection, setShowPriceSection] = useState(false);
    const [selectedVehicleData, setSelectedVehicleData] = useState<any>(null);
    const [selectedInsurance, setSelectedInsurance] = useState<string[]>([]);
    const [selectedOthers, setSelectedOthers] = useState<string[]>([]);
    const [insuranceError, setInsuranceError] = useState(false);
    const viewMode = false; // Always false for booking selection

    // Get the selected model name from route params
    const selectedModelName = route.params?.modelName;

    const toggleVehicle = (id: string) => {
        console.log('� toggleVehicle called with ID:', id);
        console.log('🔍 Current selectedVehicle state:', selectedVehicle);
        console.log('🔍 View mode:', viewMode);

        if (viewMode) {
            console.log('❌ View mode - selection disabled');
            return;
        }

        const newSelection = selectedVehicle === id ? '' : id;
        console.log('🔄 Setting selected vehicle from', selectedVehicle, 'to', newSelection);
        setSelectedVehicle(newSelection);
        setNoSelectionError(false);

        // Log the state change
        setTimeout(() => {
            console.log('✅ After setState - selectedVehicle:', selectedVehicle);
        }, 100);
        
        // Also log the vehicles array to see if the ID exists
        console.log('🔍 Available vehicle color IDs:', vehicles.flatMap(v => v.colors.map((c: any) => c.id)));
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
        console.log(`🔍 Vehicle item structure:`, {
            id: item.id,
            priceId: item.priceId,
            name: item.name,
            hasColors,
            firstColorId: item.colors?.[0]?.id,
            isSelected
        });

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
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isSelected ? '#0d9488' : '#e5e7eb',
                    padding: 16,
                    marginBottom: 16,
                    width: '48%',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: isSelected ? 0.1 : 0,
                    shadowRadius: 2,
                    elevation: isSelected ? 2 : 0,
                }}
                activeOpacity={0.8}
            >
                {/* Vehicle Image */}
                <View style={{ aspectRatio: 16 / 9, backgroundColor: '#f9fafb', borderRadius: 8, marginBottom: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <Image
                        source={item.baseImage ? { uri: getAbsoluteImageUrl(item.baseImage) || '' } : placeholder}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                    />
                </View>

                {/* Model Name */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                    <View style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        borderWidth: 2,
                        borderColor: isSelected ? '#0d9488' : '#d1d5db',
                        backgroundColor: 'white',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 8,
                        marginTop: 2
                    }}>
                        {isSelected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#0d9488' }} />}
                    </View>
                    <Text style={{ flex: 1, color: '#111827', fontWeight: '500', fontSize: 13 }}>{item.name}</Text>
                </View>

                {/* Color Name */}
                {hasColors && (
                    <View style={{ marginBottom: 8 }}>
                        <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500' }}>
                            Color: {item.colors[0]?.name || 'Standard'}
                        </Text>
                    </View>
                )}

                {/* Color Options */}
                {hasColors && (
                    <View style={{ marginTop: 8 }}>
                        {/* Vehicle is selectable by tapping the entire card */}
                        <Text style={{ fontSize: 10, color: '#6b7280', textAlign: 'center' }}>
                            Tap to select this vehicle
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    useEffect(() => {
        // This screen doesn't use view mode, so no need to set initial selection
    }, []);

    const SelectField = ({
        placeholder,
        value,
        options,
        open,
        onToggle,
        onSelect,
    }: {
        placeholder: string;
        value: string;
        options: { label: string; value: string }[];
        open: boolean;
        onToggle: () => void;
        onSelect: (val: string) => void;
    }) => {
        const selectedLabel = options.find((o) => o.value === value)?.label || '';
        const listHeight = Math.min(options.length, 5) * 44 + 8;
        return (
            <View style={{ position: 'relative', zIndex: open ? 50 : 1 }}>
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
                const available = list.filter(
                    (model: any) => model.vehicleStatus === 'AVAILABLE' && Array.isArray(model.price) && model.price.length > 0
                );
                const filtered = category === 'ALL' ? available : available.filter((m: any) => m.category === category);
                setModels(filtered);
            } else {
                setModels([]);
            }
        } catch (e) {
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

            // Filter by selected model name if provided
            if (selectedModelName && !modelKey.includes(selectedModelName)) {
                console.log('⏭️ Skipping model - not matching selected model name');
                return;
            }

            // Create separate vehicle for each price/vehicle combination
            prices.forEach((price: any, index: number) => {
                const imageUrl = price?.colors?.[0]?.imageDetails?.[0]?.url || model?.image?.[0]?.url || model?.image?.url || undefined;

                // Debug: Log the price structure to understand color data
                console.log('🔍 Price data structure:', JSON.stringify(price, null, 2));
                console.log('🔍 Price colors:', price?.colors);
                console.log('🔍 Price colors length:', price?.colors?.length);

                // Try multiple ways to get color data
                let colorName = 'Standard';
                let colorCode = '#000000';

                // Check all possible locations for color data
                console.log('🔍 Checking price object keys:', Object.keys(price || {}));

                // Method 1: price.colors array
                if (price?.colors && Array.isArray(price.colors) && price.colors.length > 0) {
                    const firstColor = price.colors[0];
                    colorName = firstColor?.name || firstColor?.colorName || firstColor?.color || 'Standard';
                    colorCode = firstColor?.code || firstColor?.colorCode || firstColor?.hex || '#000000';
                    console.log('🎨 Found color in price.colors:', colorName, colorCode);
                    
                    // Extract the actual color ID
                    const actualColorId = firstColor?.colorId || firstColor?.id || null;
                    console.log('🎨 Actual color ID found:', actualColorId);
                    
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
                                id: actualColorId, // Use actual color ID, not price ID
                                name: colorName,
                                code: colorCode,
                                imageUrl,
                                price: price
                            }],
                            baseImage: imageUrl,
                            price: price
                        };

                        vehicleList.push(vehicle);
                        console.log('✅ Added vehicle with correct color ID:', actualColorId);
                        return; // Skip to next price
                    }
                }
                // Method 2: price.color object
                else if (price?.color && typeof price.color === 'object') {
                    colorName = price.color?.name || price.color?.colorName || price.color?.color || 'Standard';
                    colorCode = price.color?.code || price.color?.colorCode || price.color?.hex || '#000000';
                    console.log('🎨 Found color in price.color:', colorName, colorCode);
                }
                // Method 3: price.colorName string
                else if (price?.colorName && typeof price.colorName === 'string') {
                    colorName = price.colorName;
                    colorCode = price?.colorCode || price?.hex || '#000000';
                    console.log('🎨 Found colorName in price:', colorName, colorCode);
                }
                // Method 4: price.color string
                else if (price?.color && typeof price.color === 'string') {
                    colorName = price.color;
                    colorCode = price?.colorCode || price?.hex || '#000000';
                    console.log('🎨 Found color string in price:', colorName, colorCode);
                }
                // Method 5: Check model colors
                else if (model?.colors && Array.isArray(model.colors) && model.colors.length > 0) {
                    const firstColor = model.colors[0];
                    colorName = firstColor?.name || firstColor?.colorName || firstColor?.color || 'Standard';
                    colorCode = firstColor?.code || firstColor?.colorCode || firstColor?.hex || '#000000';
                    console.log('🎨 Found color in model.colors:', colorName, colorCode);
                }
                // Method 6: Check if price has any color-related properties
                else {
                    const colorKeys = Object.keys(price || {}).filter(key =>
                        key.toLowerCase().includes('color') ||
                        key.toLowerCase().includes('variant')
                    );
                    console.log('🔍 Found color-related keys:', colorKeys);
                    if (colorKeys.length > 0) {
                        const firstKey = colorKeys[0];
                        const colorValue = price[firstKey];
                        if (typeof colorValue === 'string') {
                            colorName = colorValue;
                        } else if (typeof colorValue === 'object' && colorValue?.name) {
                            colorName = colorValue.name;
                            colorCode = colorValue?.code || colorValue?.hex || '#000000';
                        }
                        console.log('🎨 Found color in', firstKey, ':', colorName, colorCode);
                    }
                }

                // Fallback: Use price.id as color ID only if no actual color ID found
                const fallbackColorId = price?.id || null;
                console.log('⚠️ Using fallback color ID (price.id):', fallbackColorId);
                
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
                        id: fallbackColorId, // Use fallback only as last resort
                        name: colorName,
                        code: colorCode,
                        imageUrl,
                        price: price
                    }],
                    baseImage: imageUrl,
                    price: price
                };

                vehicleList.push(vehicle);
                console.log('⚠️ Added vehicle with fallback color ID:', fallbackColorId);
            });
        });

        console.log('✅ Final vehicle list:', vehicleList.length);
        vehicleList.forEach((vehicle: any) => {
            console.log(`📊 ${vehicle.displayName}: ${vehicle.colors.length} colors`);
        });

        return vehicleList;
    }, [models, selectedModelName]);

    // Price breakdown logic for selected vehicle
    const priceBreakdown = useMemo(() => {
        if (!selectedVehicleData?.price) return [];

        const items = [
            { key: 'showroomPrice', label: 'Ex-Showroom Price' },
            { key: 'roadTax', label: 'Road Tax' },
            { key: 'handlingCharges', label: 'Handling Charges' },
            { key: 'registrationFee', label: 'Registration Fee' },
            { key: 'tcs', label: 'Tcs' },
        ];
        return items
            .map((item) => ({
                ...item,
                amount: Number(selectedVehicleData.price?.[item.key] || 0),
            }))
            .filter((item) => item.amount > 0);
    }, [selectedVehicleData]);

    const baseTotal = priceBreakdown.reduce((sum, item) => sum + item.amount, 0);

    const insuranceOptions = useMemo(() => {
        if (!selectedVehicleData?.price) return [];

        const options = [
            { id: 'insurance1plus5', label: '1+5' },
            { id: 'insurance5plus5', label: '5+5' },
            { id: 'insurance1plus5ZD', label: '1+5 Zero Dep' },
            { id: 'insurance5plus5ZD', label: '5+5 Zero Dep' },
        ];
        return options
            .map((opt) => ({
                ...opt,
                amount: Number(selectedVehicleData.price?.[opt.id] || 0),
            }))
            .filter((opt) => opt.amount > 0);
    }, [selectedVehicleData]);

    const otherOptions = useMemo(() => {
        if (!selectedVehicleData?.price) return [];

        const options = [
            { id: 'warrantyPrice', label: 'Extended Warranty' },
            { id: 'amc', label: 'Amc' },
            { id: 'rsa', label: 'Rsa' },
            { id: 'otherCharges', label: 'Other Charges' },
            { id: 'discount', label: 'Discount' },
        ];
        return options
            .map((opt) => ({
                ...opt,
                amount: Number(selectedVehicleData.price?.[opt.id] || 0),
            }))
            .filter((opt) => opt.amount > 0);
    }, [selectedVehicleData]);

    const totalAmount = baseTotal + insuranceOptions.reduce((sum, opt) => sum + opt.amount, 0) + otherOptions.reduce((sum, opt) => sum + opt.amount, 0);

    // Interactive selection functions
    const toggleInsurance = (id: string) => {
        if (viewMode) return;
        setInsuranceError(false);
        setSelectedInsurance((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleOther = (id: string) => {
        if (viewMode) return;
        setSelectedOthers(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Calculate amounts based on selections
    const insuranceAmount = useMemo(() => {
        return selectedInsurance.reduce((sum, id) => {
            const opt = insuranceOptions.find((o) => o.id === id);
            return opt ? sum + opt.amount : sum;
        }, 0);
    }, [insuranceOptions, selectedInsurance]);

    const othersAmount = useMemo(() => {
        return selectedOthers.reduce((sum, id) => {
            const opt = otherOptions.find((o) => o.id === id);
            if (!opt) return sum;
            return id === 'discount' ? sum - opt.amount : sum + opt.amount;
        }, 0);
    }, [selectedOthers, otherOptions]);

    const totalWithOthers = baseTotal + othersAmount;

    const selectedInsuranceLabels = useMemo(() => {
        return selectedInsurance
            .map((id) => insuranceOptions.find((o) => o.id === id)?.label)
            .filter(Boolean);
    }, [selectedInsurance, insuranceOptions]);

    const cumulativeInsuranceRows = useMemo(() => {
        let running = totalWithOthers;
        const rows: Array<{ label: string; amount: number }> = [];
        selectedInsurance.forEach((id, idx) => {
            const opt = insuranceOptions.find((o) => o.id === id);
            if (!opt) return;
            running += opt.amount;
            const labels = selectedInsuranceLabels.slice(0, idx + 1).join(' + ');
            rows.push({
                label: `Total + ${labels}`,
                amount: running,
            });
        });
        return rows;
    }, [selectedInsurance, insuranceOptions, selectedInsuranceLabels, totalWithOthers]);

    const finalTotal = baseTotal + insuranceAmount + othersAmount;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            {/* Header */}
            <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => {
                    if (showPriceSection) {
                        setShowPriceSection(false);
                        setSelectedVehicleData(null);
                    } else {
                        navigation.goBack();
                    }
                }} style={{ marginRight: 8 }}>
                    <ChevronLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={{ color: '#111827', fontSize: 18, fontWeight: 'bold' }}>
                    {showPriceSection ? 'Price Details' : 'Select Vehicle'}
                </Text>
            </View>

            {/* Progress */}
            <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 16, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: showPriceSection ? '#22c55e' : '#3b82f6', alignItems: 'center', justifyContent: 'center' }}>
                        {showPriceSection ? <Check size={16} color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>1</Text>}
                    </View>
                    <Text style={{ marginLeft: 8, fontWeight: 'bold', color: showPriceSection ? '#22c55e' : '#3b82f6', fontSize: 12 }}>Vehicle</Text>
                </View>
                <ChevronRight size={20} color="#d1d5db" />
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center', opacity: showPriceSection ? 1 : 0.4 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: showPriceSection ? '#3b82f6' : '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>2</Text>
                    </View>
                    <Text style={{ marginLeft: 8, fontWeight: 'bold', color: showPriceSection ? '#3b82f6' : '#9ca3af', fontSize: 12 }}>Price</Text>
                </View>
            </View>

            {!showPriceSection ? (
                // Vehicle Selection Section
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
                                        setCategory(val as 'ALL' | 'SCOOTER' | 'MOTORCYCLE');
                                        setOpenCategory(false);
                                    }}
                                    options={[
                                        { label: 'All Category', value: 'ALL' },
                                        { label: 'Scooter', value: 'SCOOTER' },
                                        { label: 'Motorcycle', value: 'MOTORCYCLE' },
                                    ]}
                                />
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 16, height: 44 }}>
                            <Search size={18} color="#9ca3af" />
                            <TextInput
                                placeholder="Search Vehicles"
                                style={{ flex: 1, marginLeft: 8, color: '#111827', fontSize: 14 }}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                editable={!viewMode}
                            />
                        </View>
                    </View>

                    <FlatList
                        data={vehicles}
                        renderItem={renderVehicleItem}
                        keyExtractor={(item, index) => item.id || item.priceId || `vehicle-${index}`}
                        contentContainerStyle={{ padding: 16 }}
                        numColumns={2}
                        columnWrapperStyle={{ justifyContent: 'space-between' }}
                        extraData={selectedVehicle}
                        ListEmptyComponent={() => (
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                                <Text style={{ color: '#6b7280', fontSize: 16 }}>No vehicles found</Text>
                                <Text style={{ color: '#9ca3af', fontSize: 14, marginTop: 8 }}>
                                    Try adjusting your filters or search
                                </Text>
                            </View>
                        )}
                    />
                    {noSelectionError && (
                        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                            <Text style={{ color: '#dc2626', fontSize: 13, fontWeight: '500' }}>
                                ⚠ Please select a vehicle to continue.
                            </Text>
                        </View>
                    )}

                    {/* Footer */}
                    <View style={{ backgroundColor: 'white', padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#0d9488', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                        >
                            <ChevronLeft size={16} color="#0d9488" />
                            <Text style={{ color: '#0d9488', fontWeight: 'bold', marginLeft: 4 }}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                if (!selectedVehicle) {
                                    setNoSelectionError(true);
                                    return;
                                }

                                // Find the selected color and model data
                                let selectedColorData = null;
                                let selectedModelData = null;

                                for (const model of vehicles) {
                                    const color = model.colors.find((c: any) => c.id === selectedVehicle);
                                    if (color) {
                                        selectedColorData = color;
                                        selectedModelData = model;
                                        break;
                                    }
                                }

                                if (!selectedColorData || !selectedModelData) {
                                    setNoSelectionError(true);
                                    return;
                                }

                                // Show price section in same screen
                                const vehicleDataForReturn = {
                                    ...selectedModelData,
                                    price: selectedColorData.price,
                                    selectedColor: selectedColorData,
                                    vehicleName: `${selectedModelData.name} - ${selectedColorData.name}`,
                                    vehicleId: selectedColorData.id
                                };

                                console.log('🚗 Selected vehicle for booking:', vehicleDataForReturn);

                                // Show price section in same screen
                                setSelectedVehicleData(vehicleDataForReturn);
                                setShowPriceSection(true);
                            }}
                            style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: !selectedVehicle ? '#d1d5db' : '#0d9488', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Select Vehicle</Text>
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                // Price Section
                <>
                    <ScrollView style={{ flex: 1 }}>
                        <View style={{ padding: 16 }}>
                            {/* Vehicle Summary */}
                            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f3f4f6' }}>
                                {selectedVehicleData && (
                                    <View style={{ marginBottom: 16 }}>
                                        {selectedVehicleData.baseImage && (
                                            <View style={{ aspectRatio: 16 / 9, backgroundColor: '#f9fafb', borderRadius: 12, marginBottom: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                <Image
                                                    source={{ uri: getAbsoluteImageUrl(selectedVehicleData.baseImage) || undefined }}
                                                    style={{ width: '100%', height: '100%' }}
                                                    resizeMode="contain"
                                                />
                                            </View>
                                        )}
                                        <View style={{ alignItems: 'center', marginBottom: 12 }}>
                                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', textAlign: 'center' }}>
                                                {selectedVehicleData.name || selectedVehicleData.vehicleName}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                                <View style={{
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: 8,
                                                    backgroundColor: selectedVehicleData.selectedColor?.code || '#000000',
                                                    borderWidth: 1,
                                                    borderColor: '#d1d5db',
                                                    marginRight: 8
                                                }} />
                                                <Text style={{ color: '#6b7280', fontSize: 12, fontWeight: '500' }}>
                                                    {selectedVehicleData.selectedColor?.name || 'Standard'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* Insurance Selection */}
                            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: insuranceError ? '#dc2626' : '#f3f4f6', opacity: viewMode ? 0.6 : 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                    <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14 }}>Insurance Type :</Text>
                                    <Text style={{ color: '#ef4444', marginLeft: 4, fontSize: 14 }}>*</Text>
                                </View>
                                {insuranceOptions.length === 0 && (
                                    <Text style={{ color: '#6b7280', fontSize: 12 }}>No insurance options</Text>
                                )}
                                {insuranceOptions.map(opt => (
                                    <TouchableOpacity
                                        key={opt.id}
                                        onPress={() => toggleInsurance(opt.id)}
                                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
                                    >
                                        <View style={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: 4,
                                            borderWidth: 1,
                                            borderColor: selectedInsurance.includes(opt.id) ? '#0d9488' : '#d1d5db',
                                            backgroundColor: selectedInsurance.includes(opt.id) ? '#0d9488' : 'white',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {selectedInsurance.includes(opt.id) && <Check size={12} color="white" />}
                                        </View>
                                        <Text style={{ marginLeft: 12, color: '#374151', fontSize: 14 }}>{opt.label} - ₹{opt.amount}</Text>
                                    </TouchableOpacity>
                                ))}
                                {insuranceError && (
                                    <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>
                                        ⚠ Please select at least one insurance type to continue.
                                    </Text>
                                )}
                            </View>

                            {/* Others */}
                            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 32, borderWidth: 1, borderColor: '#f3f4f6', opacity: viewMode ? 0.6 : 1 }}>
                                <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14, marginBottom: 16 }}>Others</Text>
                                {otherOptions.length === 0 && (
                                    <Text style={{ color: '#6b7280', fontSize: 12 }}>No additional options</Text>
                                )}
                                {otherOptions.map(opt => (
                                    <TouchableOpacity
                                        key={opt.id}
                                        onPress={() => toggleOther(opt.id)}
                                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
                                    >
                                        <View style={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: 4,
                                            borderWidth: 1,
                                            borderColor: selectedOthers.includes(opt.id) ? '#0d9488' : '#d1d5db',
                                            backgroundColor: selectedOthers.includes(opt.id) ? '#0d9488' : 'white',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {selectedOthers.includes(opt.id) && <Check size={12} color="white" />}
                                        </View>
                                        <Text style={{ marginLeft: 12, color: '#374151', fontSize: 14 }}>
                                            {opt.label} - ₹{opt.amount}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Price Table */}
                            <View style={{ backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#f3f4f6' }}>
                                <View style={{ backgroundColor: '#475569', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>Type</Text>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>Price</Text>
                                </View>
                                {priceBreakdown.map((item, index) => (
                                    <View key={item.label} style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: index % 2 === 1 ? '#f9fafb' : 'white' }}>
                                        <Text style={{ color: '#4b5563', fontSize: 14 }}>{item.label}</Text>
                                        <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14 }}>₹ {item.amount}</Text>
                                    </View>
                                ))}
                                <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f9fafb' }}>
                                    <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14 }}>Total</Text>
                                    <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14 }}>₹ {totalWithOthers}</Text>
                                </View>
                                {cumulativeInsuranceRows.map((row, idx) => (
                                    <View
                                        key={`${row.label}-${idx}`}
                                        style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f9fafb' }}
                                    >
                                        <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14 }}>
                                            {row.label}
                                        </Text>
                                        <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14 }}>
                                            ₹ {row.amount}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Price Section Footer */}
                    <View style={{ backgroundColor: 'white', padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            onPress={() => {
                                setShowPriceSection(false);
                                setSelectedVehicleData(null);
                            }}
                            style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#0d9488', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                        >
                            <ChevronLeft size={16} color="#0d9488" />
                            <Text style={{ color: '#0d9488', fontWeight: 'bold', marginLeft: 4 }}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                if (insuranceOptions.length > 0 && selectedInsurance.length === 0) {
                                    setInsuranceError(true);
                                    return;
                                }
                                // Go back to Booking Register with selected vehicle and price data
                                const vehicleData = {
                                    ...selectedVehicleData,
                                    selectedInsurance,
                                    selectedOthers,
                                    finalTotal
                                };

                                console.log('🚗 Returning vehicle data:', vehicleData);

                                // Navigate back and pass the vehicle data + saved form data
                                navigation.navigate('BookingActivity', {
                                    selectedVehicle: vehicleData,
                                    customerName: route.params?.customerName,
                                    customerId: route.params?.customerId,
                                    customerPhone: route.params?.customerPhone,
                                    savedFormData: route.params?.savedFormData,
                                    scrollToSection: 'vehicle' // Ensure return to Vehicle section
                                } as any);
                            }}
                            style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: '#0d9488', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold', marginRight: 4 }}>Confirm ₹{finalTotal}</Text>
                            <ChevronRight size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}