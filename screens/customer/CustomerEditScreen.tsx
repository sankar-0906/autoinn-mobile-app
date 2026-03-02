import React, { useState } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity,
    Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Edit2, Trash2 } from 'lucide-react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';

type CustomerEditRouteProp = RouteProp<RootStackParamList, 'CustomerEdit'>;
type CustomerEditNavigationProp = StackNavigationProp<RootStackParamList, 'CustomerEdit'>;

type Contact = {
    id: string;
    phoneNumber: string;
    type: 'Primary' | 'Alternate';
    validity: 'Valid' | 'Invalid';
    whatsapp: 'Yes' | 'No';
    dnd: 'Yes' | 'No';
};

type Quotation = {
    date: string;
    quotationId: string;
    modelCode: string;
    modelName: string;
};

const TABS = [
    { id: 'customer-details', label: 'Customer Details' },
    { id: 'associated-vehicles', label: 'Vehicles' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'quotations', label: 'Quotations' },
    { id: 'job-orders', label: 'Job Orders' },
    { id: 'spare-orders', label: 'Spare Orders' },
    { id: 'call-history', label: 'Call History' },
    { id: 'number-plates', label: 'Number Plates' },
    { id: 'payments', label: 'Payments' },
];

// ── Shared form components ──────────────────────────────────────────────────

const Label = ({ text, required }: { text: string; required?: boolean }) => (
    <Text className="text-sm font-medium text-gray-700 mb-1">
        {required && <Text className="text-red-500">* </Text>}{text}
    </Text>
);

const Field = ({
    label, value, onChange, required, error, placeholder, keyboardType, editable,
}: {
    label: string; value: string; onChange?: (v: string) => void;
    required?: boolean; error?: string; placeholder?: string; keyboardType?: any; editable?: boolean;
}) => (
    <View className="mb-4">
        <Label text={label} required={required} />
        <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={placeholder || label}
            keyboardType={keyboardType || 'default'}
            editable={editable !== false}
            className={`h-11 border rounded-lg px-3 bg-white text-sm text-gray-900 ${editable === false ? 'bg-gray-50 text-gray-500' : ''
                } ${error ? 'border-red-400' : 'border-gray-300'}`}
        />
        {!!error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
    </View>
);

const SelectField = ({
    label, value, options, onSelect, required, error,
}: {
    label: string; value: string; options: string[];
    onSelect: (v: string) => void; required?: boolean; error?: string;
}) => {
    const [open, setOpen] = useState(false);
    return (
        <View className="mb-4">
            <Label text={label} required={required} />
            <TouchableOpacity
                onPress={() => setOpen(!open)}
                className={`h-11 border rounded-lg px-3 justify-center bg-white ${error ? 'border-red-400' : 'border-gray-300'}`}
            >
                <Text className={value ? 'text-sm text-gray-900' : 'text-sm text-gray-400'}>
                    {value || `Select ${label}`}
                </Text>
            </TouchableOpacity>
            {open && (
                <View className="border border-gray-200 rounded-lg bg-white mt-1 shadow-md z-50">
                    {options.map((opt) => (
                        <TouchableOpacity key={opt} onPress={() => { onSelect(opt); setOpen(false); }}
                            className="px-3 py-3 border-b border-gray-50">
                            <Text className={opt === value ? 'text-teal-600 font-semibold text-sm' : 'text-gray-800 text-sm'}>{opt}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            {!!error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
        </View>
    );
};

const RadioGroup = ({
    label, value, options, onChange, required,
}: {
    label: string; value: string; options: string[];
    onChange: (v: string) => void; required?: boolean;
}) => (
    <View className="mb-4">
        <Label text={label} required={required} />
        <View className="flex-row flex-wrap gap-2 mt-1">
            {options.map((opt) => (
                <TouchableOpacity key={opt} onPress={() => onChange(opt)}
                    className="flex-row items-center mr-4">
                    <View className={`w-4 h-4 rounded-full border-2 mr-2 items-center justify-center ${value === opt ? 'border-teal-600' : 'border-gray-400'}`}>
                        {value === opt && <View className="w-2 h-2 rounded-full bg-teal-600" />}
                    </View>
                    <Text className="text-sm text-gray-700">{opt}</Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

const SectionHeader = ({ title }: { title: string }) => (
    <Text className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">{title}</Text>
);

// ── Mini select for the contacts table ─────────────────────────────────────

const MiniSelect = ({ value, options, onSelect }: { value: string; options: string[]; onSelect: (v: string) => void }) => {
    const [open, setOpen] = useState(false);
    return (
        <View>
            <TouchableOpacity onPress={() => setOpen(!open)}
                className="border border-gray-200 rounded px-2 py-1 bg-white min-w-[70px]">
                <Text className="text-xs text-gray-800">{value}</Text>
            </TouchableOpacity>
            {open && (
                <View className="absolute top-8 z-50 bg-white border border-gray-200 rounded shadow-md min-w-[90px]">
                    {options.map((opt) => (
                        <TouchableOpacity key={opt} onPress={() => { onSelect(opt); setOpen(false); }}
                            className="px-2 py-2 border-b border-gray-50">
                            <Text className="text-xs text-gray-800">{opt}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

// ── Empty state ────────────────────────────────────────────────────────────

const EmptyState = ({ message }: { message: string }) => (
    <View className="items-center py-16">
        <Text className="text-gray-400 text-sm">{message}</Text>
    </View>
);

// ── Main Screen ─────────────────────────────────────────────────────────────

// Add debug logging at module level
console.log('CustomerEditScreen module loaded');

export default function CustomerEditScreen({ navigation, route }: { navigation: CustomerEditNavigationProp; route: CustomerEditRouteProp }) {
    // Guard against missing navigation context
    if (!navigation || !route) {
        return null;
    }
    
    console.log('CustomerEditScreen rendering');
    console.log('Route params:', route.params);

    const customerId = route.params?.customerId || '';
    const customerName = route.params?.customerName || '';

    const [activeTab, setActiveTab] = useState('customer-details');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Basic info
    const [customerType, setCustomerType] = useState('Non Customer');
    const [salutation, setSalutation] = useState('');
    const [name, setName] = useState(customerName);
    const [fatherName, setFatherName] = useState('');
    const [gender, setGender] = useState('Male');
    const [dob, setDob] = useState('');
    const [email, setEmail] = useState('');
    const [gstType, setGstType] = useState('Unregistered');
    const [gstin, setGstin] = useState('');
    const [customerGrouping, setCustomerGrouping] = useState('');

    // Contacts table
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [newPhone, setNewPhone] = useState('');
    const [newType, setNewType] = useState<'Primary' | 'Alternate'>('Primary');
    const [newWhatsapp, setNewWhatsapp] = useState<'Yes' | 'No'>('No');
    const [newDnd, setNewDnd] = useState<'Yes' | 'No'>('No');

    // Billing address
    const [billingAddr1, setBillingAddr1] = useState('');
    const [billingAddr2, setBillingAddr2] = useState('');
    const [billingAddr3, setBillingAddr3] = useState('');
    const [billingLocality, setBillingLocality] = useState('');
    const [billingCountry, setBillingCountry] = useState('India');
    const [billingState, setBillingState] = useState('');
    const [billingCity, setBillingCity] = useState('');
    const [billingPincode, setBillingPincode] = useState('');

    // Shipping address
    const [sameAsBilling, setSameAsBilling] = useState(false);
    const [shippingAddr1, setShippingAddr1] = useState('');
    const [shippingAddr2, setShippingAddr2] = useState('');
    const [shippingAddr3, setShippingAddr3] = useState('');
    const [shippingLocality, setShippingLocality] = useState('');
    const [shippingCountry, setShippingCountry] = useState('India');
    const [shippingState, setShippingState] = useState('');
    const [shippingCity, setShippingCity] = useState('');
    const [shippingPincode, setShippingPincode] = useState('');

    const clearError = (key: string) => setErrors((p) => { const n = { ...p }; delete n[key]; return n; });

    const handleAddContact = () => {
        if (!newPhone.trim()) { Alert.alert('Error', 'Please enter a phone number'); return; }
        setContacts([...contacts, {
            id: Date.now().toString(),
            phoneNumber: newPhone.trim(),
            type: newType,
            validity: 'Valid',
            whatsapp: newWhatsapp,
            dnd: newDnd,
        }]);
        setNewPhone('');
        setNewType('Primary');
        setNewWhatsapp('No');
        setNewDnd('No');
    };

    const handleRemoveContact = (id: string) => {
        Alert.alert('Remove Contact', 'Remove this contact?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => setContacts(contacts.filter((c) => c.id !== id)) },
        ]);
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!customerType) e.customerType = 'Required';
        if (!name.trim()) e.name = 'Required';
        if (!billingAddr1.trim()) e.billingAddr1 = 'Required';
        if (!billingLocality.trim()) e.billingLocality = 'Required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) { Alert.alert('Validation Error', 'Please fill all required fields (*).'); return; }
        setSaving(true);
        try {
            await new Promise((r) => setTimeout(r, 800)); // API call placeholder
            Alert.alert('Success', 'Customer updated successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch {
            Alert.alert('Error', 'Failed to save. Please try again.');
        } finally { setSaving(false); }
    };

    // ── Tab content renderers ────────────────────────────────────────────────

    const renderCustomerDetails = () => (
        <View>
            {/* Customer ID banner */}
            <View className="bg-teal-50 rounded-xl px-4 py-3 mb-5 flex-row items-center">
                <Text className="text-xs text-gray-500">Customer ID :</Text>
                <Text className="ml-4 text-sm font-bold text-gray-900">{customerId || 'Not assigned'}</Text>
            </View>

            {/* ── Basic Info Card ── */}
            <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4 shadow-sm">
                <SectionHeader title="Basic Information" />
                <SelectField label="Customer Type" value={customerType} required
                    options={['Non Customer', 'Sales Customer', 'Service Customer']}
                    onSelect={(v) => { setCustomerType(v); clearError('customerType'); }}
                    error={errors.customerType} />

                {/* Salutation + Name vertically */}
                <View className="mb-4">
                    <SelectField label="Salutation" value={salutation} options={['Mr.', 'Mrs.', 'Ms.', 'Dr.']}
                        onSelect={setSalutation} />
                    <Field label="Customer Name" value={name} onChange={(v) => { setName(v); clearError('name'); }}
                        required error={errors.name} />
                </View>

                <Field label="Father's Name" value={fatherName} onChange={setFatherName} placeholder="Father's Name" />

                <RadioGroup label="Gender" value={gender} options={['Male', 'Female']} onChange={setGender} required />
                <Field label="DOB" value={dob} onChange={setDob} placeholder="DD/MM/YYYY" />

                {/* Quotations / Associated (Added as per Figma) */}
                <View className="mt-2 pt-4 border-t border-gray-100">
                    <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-sm font-semibold text-gray-700">Quotations / Associated</Text>
                        <TouchableOpacity>
                            <Text className="text-teal-600 text-sm font-medium">Link Quotation</Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        value="QDE/25-26/441 QDE/25-26/2614 QDE/25-26/115"
                        editable={false}
                        className="h-11 border border-gray-200 rounded-lg px-3 justify-center bg-gray-50 text-xs text-gray-500"
                    />
                </View>
            </View>

            {/* ── Contacts Table Card ── */}
            <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4 shadow-sm">
                <SectionHeader title="* Contacts" />

                {/* Horizontal Scroll for Table */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                    <View style={{ minWidth: 450 }}>
                        {/* Header */}
                        <View className="bg-gray-600 flex-row">
                            <Text className="text-white text-xs font-semibold px-2 py-2.5 flex-1">Phone</Text>
                            <Text className="text-white text-xs font-semibold px-2 py-2.5 w-24">Type</Text>
                            <Text className="text-white text-xs font-semibold px-2 py-2.5 w-20">Valid</Text>
                            <Text className="text-white text-xs font-semibold px-2 py-2.5 w-20">WA</Text>
                            <Text className="text-white text-xs font-semibold px-2 py-2.5 w-16">DND</Text>
                            <Text className="text-white text-xs font-semibold px-2 py-2.5 w-16 text-center">Action</Text>
                        </View>
                        {contacts.length === 0 ? (
                            <View className="px-3 py-6 items-center">
                                <Text className="text-xs text-gray-400">No contacts added</Text>
                            </View>
                        ) : (
                            contacts.map((c, idx) => (
                                <View key={c.id}
                                    className={`flex-row items-center ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                    <Text className="text-xs text-gray-800 px-2 py-3 flex-1" numberOfLines={1}>{c.phoneNumber}</Text>
                                    <Text className="text-xs text-gray-700 px-2 py-3 w-24">{c.type}</Text>
                                    <Text className={`text-xs px-2 py-3 w-20 ${c.validity === 'Valid' ? 'text-green-600' : 'text-red-500'}`}>{c.validity}</Text>
                                    <Text className="text-xs text-gray-700 px-2 py-3 w-20">{c.whatsapp}</Text>
                                    <Text className="text-xs text-gray-700 px-2 py-3 w-16">{c.dnd}</Text>
                                    <View className="flex-row items-center justify-center w-16 gap-2 py-3">
                                        <TouchableOpacity onPress={() => handleRemoveContact(c.id)}>
                                            <Trash2 size={14} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>

                {/* Add contact row (Vertical) */}
                <View className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-4">
                    <Text className="text-sm font-bold text-gray-800 mb-4">Add New Contact</Text>

                    <View className="mb-4">
                        <Text className="text-xs font-medium text-gray-700 mb-1.5">Phone Number</Text>
                        <TextInput value={newPhone} onChangeText={setNewPhone}
                            keyboardType="phone-pad" placeholder="+91 XXXXX XXXXX"
                            className="h-11 border border-gray-300 rounded-lg px-3 bg-white text-sm text-gray-900" />
                    </View>

                    <View className="flex-row gap-3 mb-">
                        <View className="flex-1">
                            <Text className="text-xs font-medium text-gray-700">Type</Text>
                            <SelectField label="" value={newType}
                                options={['Primary', 'Alternate']}
                                onSelect={(v) => setNewType(v as any)} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs font-medium text-gray-700">WhatsApp</Text>
                            <SelectField label="" value={newWhatsapp}
                                options={['Yes', 'No']}
                                onSelect={(v) => setNewWhatsapp(v as any)} />
                        </View>
                    </View>

                    <View className="mb-2">
                        <Text className="text-xs font-medium text-gray-700">DND</Text>
                        <SelectField label="" value={newDnd}
                            options={['Yes', 'No']}
                            onSelect={(v) => setNewDnd(v as any)} />
                    </View>

                    <TouchableOpacity onPress={handleAddContact}
                        className="bg-teal-600 rounded-xl py-3.5 items-center shadow-sm">
                        <Text className="text-white text-sm font-bold">+ Add to Contacts</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Additional Info ── */}
            <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4 shadow-sm">
                <SectionHeader title="Additional Information" />
                <Field label="E-mail" value={email} onChange={setEmail} keyboardType="email-address" placeholder="email@example.com" />
                <SelectField label="GST Type" value={gstType}
                    options={['Unregistered', 'Registered']}
                    onSelect={setGstType} />
                {gstType === 'Registered' && (
                    <Field label="GSTIN" value={gstin} onChange={setGstin} placeholder="GSTIN" />
                )}
                <SelectField label="Customer Grouping" value={customerGrouping}
                    options={['VIP', 'Regular', 'Standard']} onSelect={setCustomerGrouping} />
            </View>

            {/* ── Billing Address ── */}
            <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4 shadow-sm">
                <SectionHeader title="Billing Address" />
                <Field label="Address Line 1" value={billingAddr1}
                    onChange={(v) => { setBillingAddr1(v); clearError('billingAddr1'); }}
                    required error={errors.billingAddr1} />
                <Field label="Address Line 2" value={billingAddr2} onChange={setBillingAddr2} />
                <Field label="Address Line 3" value={billingAddr3} onChange={setBillingAddr3} />
                <Field label="Locality" value={billingLocality}
                    onChange={(v) => { setBillingLocality(v); clearError('billingLocality'); }}
                    required error={errors.billingLocality} />
                <SelectField label="Country" value={billingCountry}
                    options={['India', 'Other']} onSelect={setBillingCountry} required />
                <Field label="State" value={billingState} onChange={setBillingState} required />
                <Field label="City" value={billingCity} onChange={setBillingCity} required />
                <Field label="Pincode" value={billingPincode} onChange={setBillingPincode} keyboardType="number-pad" />
            </View>

            {/* ── Shipping Address ── */}
            <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4 shadow-sm">
                <SectionHeader title="Shipping Address" />
                <TouchableOpacity onPress={() => setSameAsBilling(!sameAsBilling)} className="flex-row items-center mb-4">
                    <View className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${sameAsBilling ? 'bg-teal-600 border-teal-600' : 'border-gray-400 bg-white'}`}>
                        {sameAsBilling && <Text className="text-white text-xs font-bold">✓</Text>}
                    </View>
                    <Text className="text-sm text-gray-700">Same as Billing Address</Text>
                </TouchableOpacity>
                <Field label="Address Line 1" value={sameAsBilling ? billingAddr1 : shippingAddr1}
                    onChange={setShippingAddr1} editable={!sameAsBilling} required />
                <Field label="Address Line 2" value={sameAsBilling ? billingAddr2 : shippingAddr2}
                    onChange={setShippingAddr2} editable={!sameAsBilling} />
                <Field label="Address Line 3" value={sameAsBilling ? billingAddr3 : shippingAddr3}
                    onChange={setShippingAddr3} editable={!sameAsBilling} />
                <Field label="Locality" value={sameAsBilling ? billingLocality : shippingLocality}
                    onChange={setShippingLocality} editable={!sameAsBilling} required />
                <SelectField label="Country" value={sameAsBilling ? billingCountry : shippingCountry}
                    options={['India', 'Other']} onSelect={setShippingCountry} />
                <Field label="State" value={sameAsBilling ? billingState : shippingState}
                    onChange={setShippingState} editable={!sameAsBilling} />
                <Field label="City" value={sameAsBilling ? billingCity : shippingCity}
                    onChange={setShippingCity} editable={!sameAsBilling} />
                <Field label="Pincode" value={sameAsBilling ? billingPincode : shippingPincode}
                    onChange={setShippingPincode} editable={!sameAsBilling} keyboardType="number-pad" />
            </View>

            {/* ── Referred Customers ── */}
            <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4 shadow-sm">
                <SectionHeader title="Referred Customers" />
                <Button title="No Referred Customers" variant="outline" onPress={() => { }} />
            </View>
        </View>
    );

    const renderBookings = () => (
        <View>
            {/* Two booking buttons (Stacked vertically) */}
            <View className="gap-3 mb-6">
                <TouchableOpacity
                    onPress={() => navigation.navigate('ConfirmBooking', {
                        customerId, customerName: name, bookingType: 'confirm',
                    })}
                    className="w-full bg-teal-600 rounded-xl py-4 items-center shadow-sm"
                >
                    <Text className="text-white font-semibold text-sm">Add Confirm Booking</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => navigation.navigate('ConfirmBooking', {
                        customerId, customerName: name, bookingType: 'advanced',
                    })}
                    className="w-full bg-teal-600 rounded-xl py-4 items-center shadow-sm"
                >
                    <Text className="text-white font-semibold text-sm">Add Advanced Booking</Text>
                </TouchableOpacity>
            </View>
            <EmptyState message="No bookings found for this customer" />
        </View>
    );

    const renderQuotations = () => (
        <View className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            {/* Horizontal Scroll for Quotations Table */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ minWidth: 500 }}>
                    {/* Table header */}
                    <View className="bg-gray-600 flex-row">
                        <Text className="text-white text-xs font-semibold px-2 py-3 w-24">Date</Text>
                        <Text className="text-white text-xs font-semibold px-2 py-3 flex-1 min-w-[120px]">Quotation ID</Text>
                        <Text className="text-white text-xs font-semibold px-2 py-3 w-20">Code</Text>
                        <Text className="text-white text-xs font-semibold px-2 py-3 flex-1 min-w-[150px]">Model</Text>
                        <Text className="text-white text-xs font-semibold px-2 py-3 w-20 text-center">Action</Text>
                    </View>
                    <View className="px-3 py-12 items-center">
                        <Text className="text-xs text-gray-400">No quotations found for this customer</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'customer-details': return renderCustomerDetails();
            case 'bookings': return renderBookings();
            case 'quotations': return renderQuotations();
            case 'associated-vehicles': return <EmptyState message="No vehicles found for this customer" />;
            case 'job-orders': return <EmptyState message="No job orders found for this customer" />;
            case 'spare-orders': return <EmptyState message="No spare orders found for this customer" />;
            case 'call-history': return <EmptyState message="No call history found for this customer" />;
            case 'number-plates': return <EmptyState message="No number plates found for this customer" />;
            case 'payments': return <EmptyState message="No payments found for this customer" />;
            default: return null;
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white border-b border-gray-100 px-4 py-4">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
                        <ChevronLeft size={24} color={COLORS.gray[900]} />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-lg font-bold text-gray-900">Edit Customer</Text>
                        {!!customerName && <Text className="text-xs text-gray-500 mt-0.5">{customerName}</Text>}
                    </View>
                </View>
            </View>

            {/* Tabs */}
            <View className="bg-white border-b border-gray-200">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 4 }}>
                    {TABS.map((tab) => (
                        <TouchableOpacity key={tab.id} onPress={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 border-b-2 ${activeTab === tab.id ? 'border-teal-600' : 'border-transparent'}`}>
                            <Text className={`text-sm ${activeTab === tab.id ? 'text-teal-600 font-semibold' : 'text-gray-600'}`}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}>
                    {renderTabContent()}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer — only show Save/Cancel for customer details tab */}
            {activeTab === 'customer-details' && (
                <View className="bg-white border-t border-gray-100 px-4 py-4 flex-row gap-3">
                    <Button title="Cancel" variant="outline" className="flex-1"
                        onPress={() => navigation.goBack()} />
                    <Button title={saving ? 'Saving...' : 'Save'} className="flex-1"
                        onPress={handleSave} disabled={saving} />
                </View>
            )}
        </SafeAreaView>
    );
}
