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
import { ChevronRight, ChevronLeft, Check, Calculator, X } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { getFinancers } from '../../src/api';

type SelectPaymentNavigationProp = StackNavigationProp<RootStackParamList, 'SelectPayment'>;
type SelectPaymentRouteProp = RouteProp<RootStackParamList, 'SelectPayment'>;

export default function SelectPaymentScreen({ navigation, route }: { navigation: SelectPaymentNavigationProp; route: SelectPaymentRouteProp }) {
    const { vehicleId, priceDetails, vehicleData, returnTo, quotationId, viewMode, paymentDetails } = route.params;

    // Initialize payment type based on existing data (like web logic)
    const getInitialPaymentType = (): 'cash' | 'finance' => {
        console.log('🔍 Debug paymentDetails:', paymentDetails);
        console.log('🔍 paymentDetails.financeDetails:', paymentDetails?.financeDetails);
        console.log('🔍 paymentDetails.financerId:', paymentDetails?.financerId);
        console.log('🔍 paymentDetails.paymentType:', paymentDetails?.paymentType);

        // First check explicit paymentType (like web app priority)
        if (paymentDetails?.paymentType) {
            console.log('✅ Using explicit paymentType:', paymentDetails.paymentType);
            return paymentDetails.paymentType;
        }

        // Check if we're in view mode with existing payment details
        if (viewMode && paymentDetails) {
            console.log('📋 View Mode - Using existing paymentDetails');

            // Check for finance indicators
            if (paymentDetails.financeDetails?.financer || 
                paymentDetails.financerId ||
                (paymentDetails.financerTenure?.data && paymentDetails.financerTenure.data.length > 0) ||
                (paymentDetails.downPayment && paymentDetails.downPayment > 0)) {
                console.log('✅ Detected Finance mode from finance indicators');
                return 'finance';
            }
        }

        // Check if financer exists to determine payment type (PRIORITY - like web)
        if (paymentDetails?.financeDetails?.financer || paymentDetails?.financerId) {
            console.log('✅ Detected Finance mode (financer exists)');
            return 'finance';
        }

        // Check if there's any EMI data indicating finance mode
        if (paymentDetails?.financerTenure?.data && paymentDetails.financerTenure.data.length > 0) {
            console.log('✅ Detected Finance mode (EMI data exists)');
            return 'finance';
        }

        // Check if down payment exists (indicates finance mode)
        if (paymentDetails?.downPayment && paymentDetails.downPayment > 0) {
            console.log('✅ Detected Finance mode (down payment exists)');
            return 'finance';
        }

        // Default to cash
        console.log('⚠️ Defaulting to Cash mode');
        return 'cash';
    };

    const [paymentType, setPaymentType] = useState<'cash' | 'finance'>(getInitialPaymentType());
    const [financer, setFinancer] = useState(() => {
        // Check all possible locations for financer ID
        return paymentDetails?.financeDetails?.financer ||
            paymentDetails?.financerId ||
            '';
    });

    const [downPayment, setDownPayment] = useState(() => {
        // Check all possible locations for down payment
        const dp = paymentDetails?.financeDetails?.downPayment ||
            paymentDetails?.downPayment ||
            '';
        return dp?.toString() || '';
    });

    // EMI table state (like web) - initialize with existing data
    const [emiRows, setEmiRows] = useState<Array<{ id: number; tenure: string; emi: string }>>(() => {
        console.log('📊 Initializing EMI rows from:', paymentDetails);

        // Check all possible locations for EMI data
        const financerTenureData = paymentDetails?.financeDetails?.financerTenure ||
            paymentDetails?.financerTenure;

        if (financerTenureData?.data && financerTenureData.data.length > 0) {
            console.log('✅ Found EMI data:', financerTenureData.data);
            return financerTenureData.data.map((item: any, index: number) => ({
                id: index + 1,
                tenure: item.tenure?.toString() || '',
                emi: item.emi?.toString() || ''
            }));
        }

        // If in view mode and no EMI data, show empty first row
        if (viewMode) {
            console.log('📋 View mode - showing empty EMI row');
            return [{ id: 1, tenure: '', emi: '' }];
        }

        // Default for new finance entries
        return [{ id: 1, tenure: '', emi: '' }];
    });

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

    // EMI management functions (like web)
    const addEmiRow = () => {
        const newRows = [...emiRows, { id: Date.now(), tenure: '', emi: '' }];
        setEmiRows(newRows);
    };

    const updateEmiRow = (id: number, field: 'tenure' | 'emi', value: string) => {
        const updatedRows = emiRows.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        );

        // Add new row if editing last row and both fields have values (like web)
        const lastRow = updatedRows[updatedRows.length - 1];
        if (lastRow.id === id && lastRow.tenure && lastRow.emi) {
            updatedRows.push({ id: Date.now(), tenure: '', emi: '' });
        }

        setEmiRows(updatedRows);
    };

    const removeEmiRow = (id: number) => {
        let updatedRows = emiRows.filter(row => row.id !== id);
        if (updatedRows.length === 0) {
            updatedRows = [{ id: 1, tenure: '', emi: '' }];
        }
        setEmiRows(updatedRows);
    };

    // Get financer tenure data for submission (like web)
    const getFinancerTenureData = () => {
        return {
            data: emiRows
                .filter(row => row.tenure && row.emi)
                .map(({ tenure, emi }) => ({
                    tenure: Number(tenure),
                    emi: Number(emi)
                }))
        };
    };

    const handleSave = () => {
        console.log('💾 Saving payment with type:', paymentType);
        console.log('💾 Selected financer:', financer);
        console.log('💾 Down payment:', downPayment);
        console.log('💾 EMI rows:', emiRows);

        if (!viewMode && paymentType === 'finance') {
            let hasError = false;
            if (!financer) { setFinancerError(true); hasError = true; }
            if (!downPayment.trim()) { setDownPaymentError(true); hasError = true; }
            if (hasError) return;
        }

        // Create paymentDetails object like web app structure
        const paymentDetailsPayload = {
            paymentType: paymentType,
            financerId: paymentType === 'finance' ? financer : null,
            downPayment: paymentType === 'finance' ? Number(downPayment) : null,
            financerTenure: paymentType === 'finance' ? getFinancerTenureData() : { data: [] }
        };

        console.log('💾 Payment details payload (web structure):', paymentDetailsPayload);

        const payload = {
            id: vehicleId,
            name: vehicleData?.name || 'Selected Vehicle',
            paymentDetails: paymentDetailsPayload,  // Use web structure
            priceDetails,
        };

        console.log('💾 Final payload being saved:', payload);

        if (returnTo === 'QuotationForm') {
            navigation.popTo('QuotationForm', {
                id: quotationId ?? 'QDE/25-26/000',
                selectedVehicle: payload,
                paymentDetails: paymentDetailsPayload,  // ✅ Use the correct structure
            });
            return;
        }

        if (returnTo === 'AddQuotation') {
            navigation.popTo('AddQuotation', { 
                selectedVehicle: payload,
                paymentDetails: paymentDetailsPayload  // ✅ Pass paymentDetails for AddQuotation
            });
            return;
        }

        // Default fallback
        navigation.popTo('AddQuotation', { 
            selectedVehicle: payload,
            paymentDetails: paymentDetailsPayload  // ✅ Pass paymentDetails for fallback
        });
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

                                    {/* Table Header */}
                                    <View style={{ flexDirection: 'row', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                                        <View style={{ flex: 0.6 }}>
                                            <Text style={{ color: '#6b7280', fontSize: 12, fontWeight: 'bold' }}>Tenure</Text>
                                        </View>
                                        <View style={{ flex: 1.4 }}>
                                            <Text style={{ color: '#6b7280', fontSize: 12, fontWeight: 'bold', marginLeft: 33 }}>EMI</Text>
                                        </View>
                                        <View style={{ width: 40 }} />
                                    </View>

                                    {/* EMI Rows */}
                                    {emiRows.map((row, index) => (
                                        <View key={row.id} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                            <View style={{ flex: 0.6 }}>
                                                <View style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, height: 40, justifyContent: 'center' }}>
                                                    <TextInput
                                                        value={row.tenure}
                                                        onChangeText={(value) => updateEmiRow(row.id, 'tenure', value)}
                                                        editable={!viewMode}
                                                        keyboardType="numeric"
                                                        maxLength={2}
                                                        style={{ color: '#111827', fontSize: 14 }}
                                                    />
                                                </View>
                                            </View>

                                            <View style={{ flex: 1.4 }}>
                                                <View style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, height: 40, flexDirection: 'row', alignItems: 'center' }}>
                                                    <TextInput
                                                        value={row.emi}
                                                        onChangeText={(value) => updateEmiRow(row.id, 'emi', value)}
                                                        editable={!viewMode}
                                                        keyboardType="numeric"
                                                        maxLength={10}
                                                        style={{ flex: 1, color: '#111827', fontSize: 14 }}
                                                    />
                                                    <Calculator size={16} color="#9ca3af" />
                                                </View>
                                            </View>

                                            <View style={{ width: 40, alignItems: 'center' }}>
                                                {!viewMode && emiRows.length > 1 && (
                                                    <TouchableOpacity
                                                        onPress={() => removeEmiRow(row.id)}
                                                        style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <X size={16} color="#dc2626" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    ))}

                                    {/* Add Row Button */}
                                    {!viewMode && (
                                        <TouchableOpacity
                                            onPress={addEmiRow}
                                            style={{ marginTop: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#f0fdf4', borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0', alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                                        >
                                            <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: '500' }}>+ Add EMI Row</Text>
                                        </TouchableOpacity>
                                    )}
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
