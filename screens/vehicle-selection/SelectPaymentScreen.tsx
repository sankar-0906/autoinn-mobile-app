import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Modal,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { ChevronRight, ChevronLeft, Check, Calculator } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { getFinancers } from '../../src/api';

type SelectPaymentNavigationProp = StackNavigationProp<RootStackParamList, 'SelectPayment'>;
type SelectPaymentRouteProp = RouteProp<RootStackParamList, 'SelectPayment'>;

export default function SelectPaymentScreen({ navigation, route }: { navigation: SelectPaymentNavigationProp; route: SelectPaymentRouteProp }) {
    const { vehicleId, priceDetails, vehicleData, returnTo, quotationId, viewMode, paymentDetails } = route.params;

    const [paymentType, setPaymentType] = useState<'cash' | 'finance'>(paymentDetails?.paymentType || 'cash');
    const [financer, setFinancer] = useState(paymentDetails?.financeDetails?.financer || '');
    const [downPayment, setDownPayment] = useState(paymentDetails?.financeDetails?.downPayment || '');
    const [tenure, setTenure] = useState(paymentDetails?.financeDetails?.tenure || '');
    const [emi, setEmi] = useState(paymentDetails?.financeDetails?.emi || '');
    const [financers, setFinancers] = useState<Array<{ id: string; name: string }>>([]);
    const [financerModalOpen, setFinancerModalOpen] = useState(false);
    const [financerError, setFinancerError] = useState(false);
    const [downPaymentError, setDownPaymentError] = useState(false);

    useEffect(() => {
        getFinancers()
            .then((res) => {
                const data = res?.data;
                if (data && data.code === 200 && data.response?.code === 200) {
                    const list = data.response.data || [];
                    setFinancers(list.map((f: any) => ({ id: f.id, name: f.name })));
                }
            })
            .catch(() => {
                setFinancers([]);
            });
    }, []);

    const selectedFinancerName =
        financers.find((f) => f.id === financer)?.name || '';

    const handleSave = () => {
        if (!viewMode && paymentType === 'finance') {
            let hasError = false;
            if (!financer) { setFinancerError(true); hasError = true; }
            if (!downPayment.trim()) { setDownPaymentError(true); hasError = true; }
            if (hasError) return;
        }
        const payload = {
            id: vehicleId,
            name: vehicleData?.name || 'Selected Vehicle',
            paymentType,
            priceDetails,
            financeDetails: paymentType === 'finance' ? { financer, downPayment, tenure, emi } : null,
        };
        if (returnTo === 'QuotationForm') {
            navigation.popTo('QuotationForm', {
                id: quotationId ?? 'QDE/25-26/000',
                selectedVehicle: payload,
                paymentDetails: {
                    paymentType,
                    priceDetails,
                    financeDetails: paymentType === 'finance' ? { financer, downPayment, tenure, emi } : null,
                },
            });
            return;
        }

        if (returnTo === 'AddQuotation') {
            navigation.popTo('AddQuotation', { selectedVehicle: payload });
            return;
        }

        // Default fallback
        navigation.popTo('AddQuotation', { selectedVehicle: payload });
    };

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
                    <View style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.4, marginRight: 12 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#6b7280', fontWeight: 'bold', fontSize: 12 }}>1</Text>
                        </View>
                        <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#9ca3af', fontSize: 12 }}>Price</Text>
                    </View>
                    <ChevronRight size={18} color="#d1d5db" />
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>2</Text>
                        </View>
                        <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#3b82f6', fontSize: 12 }}>Payment</Text>
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
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={16} color="white" />
                        </View>
                        <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#22c55e', fontSize: 12 }}>Price</Text>
                    </View>
                    <ChevronRight size={20} color="#d1d5db" />
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>3</Text>
                        </View>
                        <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#3b82f6', fontSize: 12 }}>Payment</Text>
                    </View>
                </View>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView style={{ flex: 1 }}>
                    <View style={{ padding: 16 }}>
                        {/* Payment Type Selection */}
                        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f3f4f6', opacity: viewMode ? 0.6 : 1 }}>
                            <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14, marginBottom: 16 }}>Payment Type</Text>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity
                                    onPress={() => setPaymentType('cash')}
                                    disabled={!!viewMode}
                                    style={{ flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: paymentType === 'cash' ? '#3b82f6' : '#e5e7eb', backgroundColor: paymentType === 'cash' ? '#3b82f6' : 'white' }}
                                >
                                    <Text style={{ fontWeight: 'bold', color: paymentType === 'cash' ? 'white' : '#4b5563' }}>Cash</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setPaymentType('finance')}
                                    disabled={!!viewMode}
                                    style={{ flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: paymentType === 'finance' ? '#3b82f6' : '#e5e7eb', backgroundColor: paymentType === 'finance' ? '#3b82f6' : 'white' }}
                                >
                                    <Text style={{ fontWeight: 'bold', color: paymentType === 'finance' ? 'white' : '#4b5563' }}>Finance</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Finance Details */}
                        {paymentType === 'finance' && (
                            <View style={{ gap: 16, opacity: viewMode ? 0.6 : 1 }}>
                                <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6' }}>
                                    <Text style={{ color: '#374151', fontSize: 12, fontWeight: '500', marginBottom: 6 }}>
                                        Financer Name <Text style={{ color: '#ef4444' }}>*</Text>
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => { setFinancerModalOpen(true); setFinancerError(false); }}
                                        disabled={!!viewMode}
                                        style={{
                                            backgroundColor: 'white',
                                            borderWidth: 1,
                                            borderColor: financerError ? '#dc2626' : '#e5e7eb',
                                            borderRadius: 12,
                                            paddingHorizontal: 16,
                                            height: 48,
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Text style={{ color: selectedFinancerName ? '#111827' : '#9ca3af', fontSize: 14 }}>
                                            {selectedFinancerName || 'Select Financer'}
                                        </Text>
                                    </TouchableOpacity>
                                    {financerError && (
                                        <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>
                                            ⚠ Please select a financer to continue.
                                        </Text>
                                    )}

                                    <Text style={{ color: '#374151', fontSize: 12, fontWeight: '500', marginTop: 16, marginBottom: 6 }}>Down Payment <Text style={{ color: '#ef4444' }}>*</Text></Text>
                                    <View style={{ backgroundColor: 'white', borderWidth: 1, borderColor: downPaymentError ? '#dc2626' : '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, height: 48, justifyContent: 'center' }}>
                                        <TextInput
                                            placeholder="Enter down payment"
                                            value={downPayment}
                                            onChangeText={(v) => { setDownPayment(v); setDownPaymentError(false); }}
                                            editable={!viewMode}
                                            keyboardType="numeric"
                                            style={{ color: '#111827', fontSize: 14 }}
                                        />
                                    </View>
                                    {downPaymentError && (
                                        <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>
                                            ⚠ Down Payment is required.
                                        </Text>
                                    )}
                                </View>

                                <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 32, borderWidth: 1, borderColor: '#f3f4f6' }}>
                                    <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14, marginBottom: 16 }}>Tenure & EMI Details</Text>
                                    <View style={{ flexDirection: 'row', gap: 16 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: '#374151', fontSize: 12, fontWeight: '500', marginBottom: 6 }}>Tenure</Text>
                                            <View style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, height: 48, justifyContent: 'center' }}>
                                                <TextInput
                                                    placeholder="Enter Tenure (Max 60)"
                                                    value={tenure}
                                                    onChangeText={setTenure}
                                                    editable={!viewMode}
                                                    keyboardType="numeric"
                                                    style={{ color: '#111827', fontSize: 14 }}
                                                />
                                            </View>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: '#374151', fontSize: 12, fontWeight: '500', marginBottom: 6 }}>EMI</Text>
                                            <View style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, height: 48, flexDirection: 'row', alignItems: 'center' }}>
                                                <TextInput
                                                    placeholder="Enter EMI"
                                                    value={emi}
                                                    onChangeText={setEmi}
                                                    editable={!viewMode}
                                                    keyboardType="numeric"
                                                    style={{ flex: 1, color: '#111827', fontSize: 14 }}
                                                />
                                                <Calculator size={18} color="#9ca3af" />
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer */}
            <View style={{ backgroundColor: 'white', padding: 16, paddingBottom: 28, borderTopWidth: 1, borderTopColor: '#f3f4f6', flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#0d9488', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                >
                    <ChevronLeft size={16} color="#0d9488" />
                    <Text style={{ color: '#0d9488', fontWeight: 'bold', marginLeft: 4 }}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={!!viewMode}
                    style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: viewMode ? '#d1d5db' : '#0d9488', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Save</Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={!viewMode && financerModalOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setFinancerModalOpen(false)}
            >
                <Pressable
                    onPress={() => setFinancerModalOpen(false)}
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 }}
                >
                    <Pressable
                        onPress={() => { }}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 16,
                            padding: 16,
                            maxHeight: '70%',
                        }}
                    >
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>
                            Select Financer
                        </Text>
                        <ScrollView>
                            {financers.length === 0 ? (
                                <Text style={{ color: '#9ca3af', fontSize: 14 }}>No financers found</Text>
                            ) : (
                                financers.map((f) => (
                                    <TouchableOpacity
                                        key={f.id}
                                        onPress={() => {
                                            setFinancer(f.id);
                                            setFinancerModalOpen(false);
                                        }}
                                        style={{
                                            paddingVertical: 12,
                                            paddingHorizontal: 8,
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#f3f4f6',
                                        }}
                                    >
                                        <Text style={{ color: financer === f.id ? '#0d9488' : '#374151', fontSize: 14 }}>
                                            {f.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}
