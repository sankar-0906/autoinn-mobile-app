import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { getVehicleMasterById } from '../../src/api';

type SelectPriceNavigationProp = StackNavigationProp<RootStackParamList, 'SelectPrice'>;
type SelectPriceRouteProp = RouteProp<RootStackParamList, 'SelectPrice'>;

export default function SelectPriceScreen({ navigation, route }: { navigation: SelectPriceNavigationProp; route: SelectPriceRouteProp }) {
    const { vehicleId, vehicleData, returnTo, quotationId, viewMode, paymentDetails } = route.params;

    const [selectedInsurance, setSelectedInsurance] = useState<string[]>([]);
    const [selectedOthers, setSelectedOthers] = useState<string[]>([]);
    const [resolvedVehicle, setResolvedVehicle] = useState<any>(null);
    const [insuranceError, setInsuranceError] = useState(false);

    const activeVehicle = resolvedVehicle || vehicleData;
    const price = viewMode ? (paymentDetails?.priceDetails || activeVehicle?.price || {}) : (activeVehicle?.price || {});

    const priceBreakdown = useMemo(() => {
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
                amount: Number(price?.[item.key] || 0),
            }))
            .filter((item) => item.amount > 0);
    }, [price]);

    const baseTotal = priceBreakdown.reduce((sum, item) => sum + item.amount, 0);

    const insuranceOptions = useMemo(() => {
        const options = [
            { id: 'insurance1plus5', label: '1+5' },
            { id: 'insurance5plus5', label: '5+5' },
            { id: 'insurance1plus5ZD', label: '1+5 Zero Dep' },
            { id: 'insurance5plus5ZD', label: '5+5 Zero Dep' },
        ];
        return options
            .map((opt) => ({
                ...opt,
                amount: Number(price?.[opt.id] || 0),
            }))
            .filter((opt) => opt.amount > 0);
    }, [price]);

    const otherOptions = useMemo(() => {
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
                amount: Number(price?.[opt.id] || 0),
            }))
            .filter((opt) => opt.amount > 0);
    }, [price]);

    const insuranceAmount = useMemo(() => {
        return selectedInsurance.reduce((sum, id) => {
            const opt = insuranceOptions.find((o) => o.id === id);
            return opt ? sum + opt.amount : sum;
        }, 0);
    }, [insuranceOptions, selectedInsurance]);

    const toggleInsurance = (id: string) => {
        if (viewMode) return;
        setInsuranceError(false);
        setSelectedInsurance((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const othersAmount = useMemo(() => {
        return selectedOthers.reduce((sum, id) => {
            const opt = otherOptions.find((o) => o.id === id);
            if (!opt) return sum;
            return id === 'discount' ? sum - opt.amount : sum + opt.amount;
        }, 0);
    }, [selectedOthers, otherOptions]);

    const totalAmount = baseTotal + insuranceAmount + othersAmount;

    const selectedInsuranceLabels = useMemo(() => {
        return selectedInsurance
            .map((id) => insuranceOptions.find((o) => o.id === id)?.label)
            .filter(Boolean);
    }, [selectedInsurance, insuranceOptions]);

    const totalWithOthers = baseTotal + othersAmount;
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

    const toggleOther = (id: string) => {
        if (viewMode) return;
        setSelectedOthers(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        if (!viewMode) return;
        const insurance = paymentDetails?.priceDetails?.insurance || [];
        const others = paymentDetails?.priceDetails?.others || [];
        setSelectedInsurance(Array.isArray(insurance) ? insurance : []);
        setSelectedOthers(Array.isArray(others) ? others : []);
    }, [viewMode, paymentDetails]);

    useEffect(() => {
        if (!viewMode || !vehicleId) return;
        getVehicleMasterById(vehicleId)
            .then((res) => {
                const data = res?.data;
                const vehicle = data?.response?.data || data?.data || null;
                setResolvedVehicle(vehicle);
            })
            .catch(() => {
                setResolvedVehicle(null);
            });
    }, [viewMode, vehicleId]);

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
            {viewMode ? (
                <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>1</Text>
                        </View>
                        <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#3b82f6', fontSize: 12 }}>Price</Text>
                    </View>
                    <ChevronRight size={18} color="#d1d5db" />
                    <View style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.4, marginLeft: 12 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#6b7280', fontWeight: 'bold', fontSize: 12 }}>2</Text>
                        </View>
                        <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#9ca3af', fontSize: 12 }}>Payment</Text>
                    </View>
                </View>
            ) : (
                <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 16, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={16} color="white" />
                        </View>
                        <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#22c55e', fontSize: 12 }}>Model</Text>
                    </View>
                    <ChevronRight size={20} color="#d1d5db" />
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>2</Text>
                        </View>
                        <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#3b82f6', fontSize: 12 }}>Price</Text>
                    </View>
                    <ChevronRight size={20} color="#d1d5db" />
                    <View style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.4 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#6b7280', fontWeight: 'bold', fontSize: 12 }}>3</Text>
                        </View>
                        <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#9ca3af', fontSize: 12 }}>Payment</Text>
                    </View>
                </View>
            )}

            <ScrollView style={{ flex: 1 }}>
                <View style={{ padding: 16 }}>
                    {/* Vehicle Summary */}
                    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f3f4f6' }}>
                        <View style={{ aspectRatio: 16 / 9, backgroundColor: '#f9fafb', borderRadius: 12, marginBottom: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            <Image
                                source={
                                    activeVehicle?.imageUrl
                                        ? { uri: activeVehicle.imageUrl }
                                        : activeVehicle?.image?.[0]?.url
                                            ? { uri: activeVehicle.image[0].url }
                                            : require('../../assets/464dc6d161864c69f60b59f4ad74113c00404235.png')
                                }
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="contain"
                            />
                        </View>
                        <View style={{ alignItems: 'center', marginBottom: 12 }}>
                            <Text style={{ color: '#6b7280', fontSize: 12, marginBottom: 4 }}>Color : Cyan Blue</Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#000', borderWidth: 1, borderColor: '#d1d5db' }} />
                                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#9ca3af', borderWidth: 1, borderColor: '#d1d5db' }} />
                            </View>
                        </View>
                        {!viewMode && (
                            <Text style={{ color: '#111827', fontWeight: '500', fontSize: 14, textAlign: 'center' }}>
                                <Text style={{ color: '#6b7280' }}>Model : </Text>
                                {activeVehicle?.name || '-'}
                            </Text>
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
                                style={{ flexDirection: 'row', alignItems: 'center' }}
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
                        if (!viewMode && insuranceOptions.length > 0 && selectedInsurance.length === 0) {
                            setInsuranceError(true);
                            return;
                        }
                        navigation.navigate('SelectPayment', {
                            vehicleId,
                            vehicleData,
                            priceDetails: {
                                totalAmount,
                                baseTotal,
                                insurance: selectedInsurance,
                                insuranceAmount,
                                others: selectedOthers,
                                othersAmount,
                            },
                            returnTo,
                            quotationId,
                            viewMode: !!viewMode,
                            paymentDetails,
                        })
                    }}
                    disabled={!vehicleData}
                    style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: !vehicleData ? '#d1d5db' : '#0d9488', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold', marginRight: 4 }}>Next</Text>
                    <ChevronRight size={16} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
