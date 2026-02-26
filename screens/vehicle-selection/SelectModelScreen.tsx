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
import { RootStackParamList } from '../../navigation/types';
import { RouteProp } from '@react-navigation/native';
import { Search, ChevronRight, Check, ChevronLeft } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { getManufacturers, getVehicleModelsByManufacturer } from '../../src/api';

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

type SelectModelNavigationProp = StackNavigationProp<RootStackParamList, 'SelectModel'>;
type SelectModelRouteProp = RouteProp<RootStackParamList, 'SelectModel'>;

export default function SelectModelScreen({ navigation, route }: { navigation: SelectModelNavigationProp; route: SelectModelRouteProp }) {
    const { returnTo, quotationId, viewMode, viewVehicleData, paymentDetails } = route.params ?? {};
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

    const toggleVehicle = (id: string) => {
        if (viewMode) return;
        setSelectedVehicle(prev => prev === id ? '' : id);
        setNoSelectionError(false);
    };

    const renderVehicleItem = ({ item }: { item: Vehicle }) => {
        const isSelected = selectedVehicle === item.id;
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => toggleVehicle(item.id)}
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
            >
                <View style={{ aspectRatio: 16 / 9, backgroundColor: '#f9fafb', borderRadius: 8, marginBottom: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <Image
                        source={item.imageUrl ? { uri: item.imageUrl } : placeholder}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                    />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
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
            </TouchableOpacity>
        );
    };

    useEffect(() => {
        if (viewMode && viewVehicleData?.id) {
            setSelectedVehicle(viewVehicleData.id);
        }
    }, [viewMode, viewVehicleData?.id]);

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

    const vehicles = useMemo<Vehicle[]>(() => {
        const items: Vehicle[] = [];
        models.forEach((model: any) => {
            const prices = Array.isArray(model.price) ? model.price : [];
            prices.forEach((price: any) => {
                const imageUrl =
                    price?.colors?.[0]?.imageDetails?.[0]?.url ||
                    model?.image?.[0]?.url ||
                    model?.image?.url ||
                    undefined;
                items.push({
                    id: price.id,
                    modelId: model.id,
                    name: `${model.modelCode} - ${model.modelName}`,
                    model: model.modelCode,
                    category: model.category,
                    imageUrl,
                    price,
                });
            });
        });
        return items;
    }, [models]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            {/* Header */}
            <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 8 }}>
                    <ChevronLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={{ color: '#111827', fontSize: 18, fontWeight: 'bold' }}>Select Vehicle</Text>
            </View>

            {/* Progress */}
            <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 16, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>1</Text>
                    </View>
                    <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#3b82f6', fontSize: 12 }}>Model</Text>
                </View>
                <ChevronRight size={20} color="#d1d5db" />
                <View style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.4 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#6b7280', fontWeight: 'bold', fontSize: 12 }}>2</Text>
                    </View>
                    <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#9ca3af', fontSize: 12 }}>Price</Text>
                </View>
                <ChevronRight size={20} color="#d1d5db" />
                <View style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.4 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#6b7280', fontWeight: 'bold', fontSize: 12 }}>3</Text>
                    </View>
                    <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#9ca3af', fontSize: 12 }}>Payment</Text>
                </View>
            </View>

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
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                extraData={selectedVehicle}
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
                    onPress={() => {
                        navigation.goBack();
                    }}
                    style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#0d9488', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Text style={{ color: '#0d9488', fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        if (!viewMode && !selectedVehicle) {
                            setNoSelectionError(true);
                            return;
                        }
                        const selected = viewMode ? viewVehicleData : vehicles.find((v) => v.id === selectedVehicle);
                        navigation.navigate('SelectPrice', {
                            vehicleId: selectedVehicle || selected?.id,
                            vehicleData: selected,
                            returnTo,
                            quotationId,
                            viewMode: !!viewMode,
                            paymentDetails,
                        });
                    }}
                    style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: (!viewMode && !selectedVehicle) ? '#d1d5db' : '#0d9488', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Next</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
