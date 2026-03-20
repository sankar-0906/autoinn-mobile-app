import React, { useState } from 'react';
import {
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ChevronDown, Edit2, Trash2, X } from 'lucide-react-native';
import { SearchableDropdown } from '../../components/ui';
import { Option } from '../../components/ui/SearchableDropdown';
import { COLORS } from '../../constants/colors';
import { HeaderWithBack } from '../../components/ui/BackButton';
import { updateJobCardCustomer } from '../../src/api/job-cards/jobCardApi';
import { addNewCustomer } from '../../src/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Contact {
    id: number;
    phoneNumber: string;
    type: string;
    validity: 'Valid' | 'Invalid';
    dnd: 'Yes' | 'No';
}

// ─── Shared: FormLabel ────────────────────────────────────────────────────────
const FormLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
    <Text className="text-sm text-gray-600 mb-1 font-medium">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
    </Text>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function UpdateCustomerScreen({ navigation, route }: { navigation: any; route: any }) {
    const { customerName: initialName = '', mobileNo = '', customerId = '' } = route.params || {};
    const isCreateMode = !customerId;
    const [saving, setSaving] = useState(false);

    // Form state
    const [salutation, setSalutation] = useState('Mr');
    const [customerName, setCustomerName] = useState(initialName);

    // New contact form
    const [countryCode] = useState('+91');
    const [newPhone, setNewPhone] = useState('');
    const [newType, setNewType] = useState('Primary');
    const [newDnd, setNewDnd] = useState('No');

    // Existing contacts list
    const [contacts, setContacts] = useState<Contact[]>(
        isCreateMode
            ? (mobileNo
                ? [{ id: 1, phoneNumber: mobileNo, type: 'Primary', validity: 'Valid', dnd: 'No' }]
                : [])
            : [
                { id: 1, phoneNumber: mobileNo, type: 'Primary', validity: 'Invalid', dnd: 'No' },
                { id: 2, phoneNumber: '8837432111', type: 'Primary', validity: 'Valid', dnd: 'No' },
            ]
    );

    // Edit state
    const [editingId, setEditingId] = useState<number | null>(null);

    // ── Options ───────────────────────────────────────────────────────────────
    const salutationOptions: Option[] = [
        { label: 'Mr', value: 'Mr' },
        { label: 'Ms', value: 'Ms' },
        { label: 'Mrs', value: 'Mrs' },
        { label: 'Dr', value: 'Dr' },
    ];
    const typeOptions: Option[] = [
        { label: 'Primary', value: 'Primary' },
        { label: 'Secondary', value: 'Secondary' },
        { label: 'Home', value: 'Home' },
        { label: 'Work', value: 'Work' },
    ];
    const dndOptions: Option[] = [
        { label: 'No', value: 'No' },
        { label: 'Yes', value: 'Yes' },
    ];

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleAddContact = () => {
        if (!newPhone.trim()) {
            Alert.alert('Required', 'Please enter a phone number.');
            return;
        }
        if (editingId) {
            setContacts(prev => prev.map(c => c.id === editingId ? {
                ...c,
                phoneNumber: newPhone.trim(),
                type: newType,
                dnd: newDnd as 'Yes' | 'No',
            } : c));
            setEditingId(null);
        } else {
            setContacts(prev => [
                ...prev,
                {
                    id: Date.now(),
                    phoneNumber: newPhone.trim(),
                    type: newType,
                    validity: 'Valid',
                    dnd: newDnd as 'Yes' | 'No',
                },
            ]);
        }
        setNewPhone('');
        setNewType('Primary');
        setNewDnd('No');
    };

    const handleDelete = (id: number) => {
        Alert.alert('Delete Contact', 'Remove this contact number?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => setContacts(prev => prev.filter(c => c.id !== id)),
            },
        ]);
    };

    const handleSave = async () => {
        if (!customerName.trim()) {
            Alert.alert('Required', 'Customer name cannot be empty.');
            return;
        }
        setSaving(true);
        try {
            if (isCreateMode) {
                const payload = {
                    name: customerName.trim(),
                    salutation,
                    contacts: contacts.map(c => ({
                        phone: c.phoneNumber,
                        type: c.type,
                        valid: c.validity === 'Valid',
                        DND: c.dnd === 'Yes',
                    })),
                };
                const res = await addNewCustomer(payload);
                if (res.data?.code === 200 && res.data?.response?.code === 200) {
                    const created = res.data?.response?.data;
                    const createdPhone = created?.contacts?.[0]?.phone || mobileNo || '';
                    Alert.alert('Success', 'Customer added successfully!', [
                        {
                            text: 'OK', onPress: () =>
                                navigation.navigate({
                                    name: 'AddJobCard',
                                    params: {
                                        newlyCreatedCustomer: {
                                            id: created?.id,
                                            name: created?.name,
                                            phone: createdPhone,
                                        },
                                    },
                                    merge: true,
                                })
                        },
                    ]);
                } else {
                    Alert.alert('Error', 'Failed to add customer.');
                }
            } else {
                const payload = {
                    id: customerId,
                    name: customerName.trim(),
                    salutation,
                    contacts: contacts.map(c => ({
                        id: typeof c.id === 'number' && c.id < 1000000 ? '' : String(c.id),
                        phone: c.phoneNumber,
                        type: c.type,
                        valid: c.validity === 'Valid',
                        dnd: c.dnd === 'Yes',
                    })),
                };
                const res = await updateJobCardCustomer(customerId, payload);
                if (res.data?.code === 200 && res.data?.response?.code === 200) {
                    Alert.alert('Success', 'Customer updated successfully!', [
                        { text: 'OK', onPress: () => navigation.goBack() },
                    ]);
                } else {
                    Alert.alert('Error', 'Failed to update customer.');
                }
            }
        } catch (err) {
            console.error('UpdateCustomer error:', err);
            Alert.alert('Error', isCreateMode ? 'Failed to add customer. Please try again.' : 'Failed to update customer. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header – exact VehicleDetails style */}
            <HeaderWithBack
                title={isCreateMode ? 'Add Customer' : 'Customer Details'}
                subtitle={isCreateMode ? 'Create a new customer' : 'Update customer information'}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Card wrapper ─────────────────────────────────────── */}
                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">

                        {/* Section title – exact VehicleDetails style */}
                        <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                            {isCreateMode ? 'Add Customer Details' : 'Update Customer Details'}
                        </Text>

                        {/* ── Salutation + Customer Name (two-column) ──────── */}
                        <View className="flex-row gap-3 mb-4">
                            <View className="w-[25%]">
                                <FormLabel label="Salutation" />
                                <SearchableDropdown
    placeholder="Salutation"
    displayValue={salutationOptions.find(o => o.value === salutation)?.label || ''}
    options={salutationOptions}
    onSelect={(value) => setSalutation(value)}
/>
                            </View>
                            <View className="flex-1">
                                <FormLabel label="Customer Name" required />
                                <TextInput
                                    value={customerName}
                                    onChangeText={setCustomerName}
                                    className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    placeholder="Enter customer name"
                                />
                            </View>
                        </View>

                        {/* ── Contacts Section ───────────────────────────────── */}
                        <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                            Contacts <Text className="text-red-500">*</Text>
                        </Text>

                        {/* Contacts table – horizontal scroll like VehicleDetails */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="mb-4"
                        >
                            <View style={{ minWidth: 480 }} className="border border-gray-200 rounded-lg overflow-hidden">
                                {/* Table header */}
                                <View className="bg-gray-600 flex-row px-3 py-3" style={{ minWidth: 480 }}>
                                    <Text className="text-sm font-medium text-white" style={{ width: 130 }}>Phone Number</Text>
                                    <Text className="text-sm font-medium text-white" style={{ width: 90 }}>Type</Text>
                                    <Text className="text-sm font-medium text-white" style={{ width: 80 }}>Validity</Text>
                                    <Text className="text-sm font-medium text-white" style={{ width: 60 }}>DND</Text>
                                    <Text className="text-sm font-medium text-white text-right" style={{ width: 80 }}>Action</Text>
                                </View>

                                {contacts.length === 0 ? (
                                    <View className="items-center py-10 bg-white" style={{ minWidth: 480 }}>
                                        <Text className="text-sm text-gray-400">No contacts added</Text>
                                    </View>
                                ) : (
                                    contacts.map((contact, index) => (
                                        <View
                                            key={contact.id}
                                            className={`flex-row items-center px-3 py-3 border-b border-gray-50 ${index % 2 === 1 ? 'bg-gray-50' : 'bg-white'
                                                }`}
                                            style={{ minWidth: 480 }}
                                        >
                                            <Text className="text-sm text-gray-800" style={{ width: 130 }}>
                                                {contact.phoneNumber}
                                            </Text>
                                            <Text className="text-sm text-gray-700" style={{ width: 90 }}>
                                                {contact.type}
                                            </Text>
                                            {/* Validity badge */}
                                            <View style={{ width: 80 }}>
                                                <View
                                                    className={`self-start px-2 py-1 rounded ${contact.validity === 'Valid'
                                                        ? 'bg-green-100'
                                                        : 'bg-red-100'
                                                        }`}
                                                >
                                                    <Text
                                                        className={`text-xs font-medium ${contact.validity === 'Valid'
                                                            ? 'text-green-700'
                                                            : 'text-red-700'
                                                            }`}
                                                    >
                                                        {contact.validity}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text className="text-sm text-gray-700" style={{ width: 60 }}>
                                                {contact.dnd}
                                            </Text>
                                            {/* Action buttons */}
                                            <View className="flex-row gap-2 justify-end" style={{ width: 80 }}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setEditingId(contact.id);
                                                        setNewPhone(contact.phoneNumber || '');
                                                        setNewType(contact.type || 'Primary');
                                                        setNewDnd(contact.dnd || 'No');
                                                    }}
                                                    className="p-1.5 bg-blue-50 rounded"
                                                    activeOpacity={0.7}
                                                >
                                                    <Edit2 size={14} color="#3B82F6" />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => handleDelete(contact.id)}
                                                    className="p-1.5 bg-red-50 rounded"
                                                    activeOpacity={0.7}
                                                >
                                                    <Trash2 size={14} color={COLORS.red[600]} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        </ScrollView>

                        {/* ── Add New Contact ─────────────────────────────────── */}
                        <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                            {editingId ? 'Edit Contact' : 'Add New Contact'}
                        </Text>

                        {/* Phone row */}
                        <View className="mb-4">
                            <FormLabel label="Phone" />
                            <View className="flex-row gap-2">
                                {/* Country code – read-only */}
                                <View className="h-12 bg-gray-50 border border-gray-200 rounded-lg px-3 justify-center w-16 items-center">
                                    <Text className="text-gray-700 text-sm font-medium">{countryCode}</Text>
                                </View>
                                {/* Phone number input */}
                                <TextInput
                                    value={newPhone}
                                    onChangeText={setNewPhone}
                                    className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    placeholder="Enter phone number"
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                />
                            </View>
                        </View>

                        {/* Type + DND (two-column) */}
                        <View className="flex-row gap-3 mb-5">
                            <View className="flex-1">
                                <FormLabel label="Type" />
                                <SearchableDropdown
    placeholder="Select Type"
    displayValue={typeOptions.find(o => o.value === newType)?.label || ''}
    options={typeOptions}
    onSelect={(value) => setNewType(value)}
/>
                            </View>
                            <View className="flex-1">
                                <FormLabel label="DND" />
                                <SearchableDropdown
    placeholder="Select DND"
    displayValue={dndOptions.find(o => o.value === newDnd)?.label || ''}
    options={dndOptions}
    onSelect={(value) => setNewDnd(value)}
/>
                            </View>
                        </View>

                        {/* Add Contact button */}
                        <TouchableOpacity
                            onPress={handleAddContact}
                            className="h-11 bg-teal-600 rounded-lg items-center justify-center"
                            activeOpacity={0.8}
                        >
                            <Text className="text-white font-semibold text-sm">
                                {editingId ? 'Update Contact' : '+ Add Contact'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Footer buttons ───────────────────────────────────────── */}
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="flex-1 h-12 border border-gray-300 rounded-lg items-center justify-center"
                            activeOpacity={0.8}
                        >
                            <Text className="text-gray-700 font-semibold">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={saving}
                            className="flex-1 h-12 bg-teal-600 rounded-lg items-center justify-center"
                            activeOpacity={0.8}
                        >
                            {saving
                                ? <ActivityIndicator size="small" color="white" />
                                : <Text className="text-white font-semibold">Save</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
