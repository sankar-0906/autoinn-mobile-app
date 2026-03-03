import React, { useState, useEffect } from 'react';
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    TextInput,
    Alert,
    Modal,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Calendar, ChevronLeft } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';

type CustomerDetailsRouteProp = RouteProp<any, 'CustomerDetails'>;

interface PhoneNumber {
    number: string;
    type: 'Primary' | 'Alternate';
    validity: 'Valid' | 'Invalid';
    whatsApp: 'Yes' | 'No';
    dnd: 'Yes' | 'No';
}

interface Quotation {
    date: string;
    quotationId: string;
    modelCode: string;
    modelName: string;
}

interface Customer {
    customerId: string;
    customerType: string;
    salutation: string;
    name: string;
    fatherName: string;
    gender: 'Male' | 'Female';
    dob: string;
    email: string;
    gstType: string;
    gstin: string;
    customerGrouping: string;
    phoneNumbers: PhoneNumber[];
    billingAddress: {
        line1: string;
        line2: string;
        line3: string;
        locality: string;
        country: string;
        city: string;
        state: string;
        pincode: string;
    };
    shippingAddress: {
        line1: string;
        line2: string;
        line3: string;
        locality: string;
        country: string;
        city: string;
        state: string;
        pincode: string;
    };
}

const CUSTOMER_TABS = [
    { id: 'customer-details', label: 'Customer Details' },
    { id: 'associated-vehicles', label: 'Associated Vehicles' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'quotations', label: 'Quotations' },
    { id: 'job-orders', label: 'Job Orders' },
    { id: 'spare-orders', label: 'Spare Orders' },
    { id: 'call-history', label: 'Call History' },
    { id: 'number-plates', label: 'Number Plates' },
    { id: 'payments', label: 'Payments' },
] as const;

const mockQuotations: Quotation[] = [
    {
        date: '18-09-2025',
        quotationId: 'QDE/25-26/456',
        modelCode: 'BF43000',
        modelName: 'Ray ZR 125 Fi Hybrid Disc',
    },
    {
        date: '06-10-2025',
        quotationId: 'QDE/25-26/443',
        modelCode: 'BF14000',
        modelName: 'FZ S Fi V3.0 DLX',
    },
    {
        date: '05-10-2025',
        quotationId: 'QDE/25-26/435',
        modelCode: 'BF14000',
        modelName: 'FZ S Fi V3.0 DLX',
    },
    {
        date: '05-10-2025',
        quotationId: 'QDE/25-26/424',
        modelCode: 'BF14000',
        modelName: 'FZ S Fi V3.0 DLX',
    },
    {
        date: '07-10-2025',
        quotationId: 'QDE/25-26/434',
        modelCode: 'D79436',
        modelName: 'FZ Fi V3',
    },
    {
        date: '07-10-2025',
        quotationId: 'QDE/25-26/402',
        modelCode: 'BH14000',
        modelName: 'FZ-X',
    },
    {
        date: '18-10-2025',
        quotationId: 'QDE/25-26/488',
        modelCode: 'BK43000',
        modelName: 'Ray ZR 125 Fi Hybrid Disc',
    },
    {
        date: '13-10-2025',
        quotationId: 'QDE/25-26/123',
        modelCode: 'BHU1230',
        modelName: 'MT15 V2',
    },
];

export default function CustomerDetailsScreen() {
    const navigation = useNavigation();
    const route = useRoute<CustomerDetailsRouteProp>();
    const { customerId } = route.params || {};

    const [activeTab, setActiveTab] = useState('customer-details');
    const [loading, setLoading] = useState(true);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
    const [newPhone, setNewPhone] = useState('');
    const [sameAsBilling, setSameAsBilling] = useState(false);

    // Form state
    const [customerType, setCustomerType] = useState('Non-Customer');
    const [salutation, setSalutation] = useState('');
    const [customerName, setCustomerName] = useState('new dev');
    const [fatherName, setFatherName] = useState('');
    const [gender, setGender] = useState('Male');
    const [dob, setDob] = useState('05/05/2003');
    const [email, setEmail] = useState('');
    const [gstType, setGstType] = useState('Unregistered');
    const [gstin, setGstin] = useState('');
    const [customerGrouping, setCustomerGrouping] = useState('');

    // Billing Address
    const [billingAddress1, setBillingAddress1] = useState('S/O  Venkatesh L  MARIYANNAN KOIL');
    const [billingAddress2, setBillingAddress2] = useState('STREET  PUSHAPAVANAM PU  Pudupet PO');
    const [billingAddress3, setBillingAddress3] = useState('');
    const [billingLocality, setBillingLocality] = useState('Chidambram');
    const [billingCountry, setBillingCountry] = useState('India');
    const [billingCity, setBillingCity] = useState('Ariyapakkam');
    const [billingState, setBillingState] = useState('Tamil Nadu');
    const [billingPincode, setBillingPincode] = useState('635702');

    // Shipping Address
    const [shippingAddress1, setShippingAddress1] = useState('');
    const [shippingAddress2, setShippingAddress2] = useState('');
    const [shippingAddress3, setShippingAddress3] = useState('');
    const [shippingLocality, setShippingLocality] = useState('');
    const [shippingCountry, setShippingCountry] = useState('');
    const [shippingCity, setShippingCity] = useState('');
    const [shippingState, setShippingState] = useState('');
    const [shippingPincode, setShippingPincode] = useState('');

    useEffect(() => {
        // Initialize with mock data
        const mockPhoneNumbers: PhoneNumber[] = [
            {
                number: '9043888355',
                type: 'Primary',
                validity: 'Valid',
                whatsApp: 'No',
                dnd: 'No',
            },
            {
                number: '9597123140',
                type: 'Alternate',
                validity: 'Valid',
                whatsApp: 'No',
                dnd: 'No',
            },
        ];

        setPhoneNumbers(mockPhoneNumbers);
        setLoading(false);
    }, []);

    const handleClose = () => {
        navigation.goBack();
    };

    const handleSave = () => {
        // Save logic here
        console.log('Saving customer details...');
        Alert.alert('Success', 'Customer details saved successfully');
        navigation.goBack();
    };

    const handleAddContact = () => {
        if (newPhone.trim()) {
            setPhoneNumbers([
                ...phoneNumbers,
                {
                    number: newPhone,
                    type: 'Alternate',
                    validity: 'Valid',
                    whatsApp: 'No',
                    dnd: 'No',
                },
            ]);
            setNewPhone('');
        }
    };

    const renderCustomerDetailsTab = () => {
        return (
            <ScrollView className="flex-1 px-4 pb-4 w-[340px] ml-3">
                {/* Customer ID */}
                <View className="mb-6">
                    <Text className="bg-green-100 rounded-xl p-3 text-sm font-medium text-gray-700 mb-1">
                        {`Customer ID :   CNB833205`}
                    </Text>
                </View>

                {/* Customer Details Section */}
                <View className="space-y-4">
                    {/* Customer Type */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-2">
                            * Customer Type
                        </Text>
                        <View className="border border-gray-300 rounded-lg px-3 py-2 bg-white">
                            <Text className="text-gray-900">{customerType}</Text>
                        </View>
                    </View>

                    {/* Salutation */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-2">Salutation</Text>
                        <View className="border border-gray-300 rounded-lg px-3 py-2 bg-white">
                            <Text className="text-gray-900">{salutation || 'Select'}</Text>
                        </View>
                    </View>

                    {/* Customer Name */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-2">
                            Customer Name
                        </Text>
                        <TextInput
                            value={customerName}
                            onChangeText={setCustomerName}
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                        />
                    </View>

                    {/* Father's Name */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-2">
                            Father's Name
                        </Text>
                        <TextInput
                            value={fatherName}
                            onChangeText={setFatherName}
                            placeholder="Velmurugan"
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                        />
                    </View>

                    {/* Gender */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-2">Gender</Text>
                        <View className="flex-row items-center gap-4 mt-2">
                            <TouchableOpacity
                                onPress={() => setGender('Male')}
                                className="flex-row items-center gap-2"
                            >
                                <View className={`w-4 h-4 rounded-full border-2 ${gender === 'Male' ? 'border-teal-600 bg-teal-600' : 'border-gray-300'}`}>
                                    {gender === 'Male' && <View className="w-2 h-2 rounded-full bg-white self-center" />}
                                </View>
                                <Text className="text-sm text-gray-700">Male</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setGender('Female')}
                                className="flex-row items-center gap-2"
                            >
                                <View className={`w-4 h-4 rounded-full border-2 ${gender === 'Female' ? 'border-teal-600 bg-teal-600' : 'border-gray-300'}`}>
                                    {gender === 'Female' && <View className="w-2 h-2 rounded-full bg-white self-center" />}
                                </View>
                                <Text className="text-sm text-gray-700">Female</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* DOB */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-2">DOB</Text>
                        <View className="relative">
                            <TextInput
                                value={dob}
                                onChangeText={setDob}
                                placeholder="DD/MM/YYYY"
                                className="border border-gray-300 rounded-lg px-3 py-2 pr-8 bg-white text-gray-900"
                            />
                            <Calendar size={16} color="#9CA3AF" style={{ position: 'absolute', right: 8, top: 12 }} />
                        </View>
                    </View>

                    {/* Phone Numbers Table */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-2">
                            * Contacts
                        </Text>
                        <View className="border border-gray-300 rounded-lg overflow-hidden">
                            <View className="bg-gray-600 px-3 py-2">
                                <Text className="text-white text-xs font-semibold">Phone Number</Text>
                            </View>
                            {phoneNumbers.map((phone, index) => (
                                <View
                                    key={index}
                                    className={`px-3 py-2 border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                >
                                    <Text className="text-xs text-gray-900">{phone.number}</Text>
                                    <Text className="text-xs text-gray-600 mt-1">{phone.type}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Add Contact Section */}
                    <View className="mb-4 space-y-3">
                        {/* Phone and Type in same row */}
                        <View className="flex-row gap-2">
                            <View className="flex-1">
                                <Text className="text-sm font-medium text-gray-700 mb-2">Phone</Text>
                                <TextInput
                                    value={newPhone}
                                    onChangeText={setNewPhone}
                                    placeholder="+91"
                                    className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm font-medium text-gray-700 mb-2">Type</Text>
                                <View className="border border-gray-300 rounded-lg px-3 py-2 bg-white">
                                    <Text className="text-gray-900">Alternate</Text>
                                </View>
                            </View>
                        </View>
                        
                        {/* WhatsApp and DND in same row */}
                        <View className="flex-row gap-2 mt-3">
                            <View className="flex-1">
                                <Text className="text-sm font-medium text-gray-700 mb-2">
                                    WhatsApp
                                </Text>
                                <View className="border border-gray-300 rounded-lg px-3 py-2 bg-white">
                                    <Text className="text-gray-900">No</Text>
                                </View>
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm font-medium text-gray-700 mb-2">DND</Text>
                                <View className="border border-gray-300 rounded-lg px-3 py-2 bg-white">
                                    <Text className="text-gray-900">Not DND</Text>
                                </View>
                            </View>
                        </View>
                        
                        <TouchableOpacity
                            onPress={handleAddContact}
                            className="bg-teal-600 rounded-lg px-4 py-2 items-center justify-center mt-4"
                        >
                            <Text className="text-white font-medium text-sm">Add Contact</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Email */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-2">E-mail</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                        />
                    </View>

                    {/* GST Type */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-2">
                            GST Type
                        </Text>
                        <View className="border border-gray-300 rounded-lg px-3 py-2 bg-white">
                            <Text className="text-gray-900">{gstType}</Text>
                        </View>
                    </View>

                    {/* GSTIN */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-2">
                            GSTIN
                        </Text>
                        <TextInput
                            value={gstin}
                            onChangeText={setGstin}
                            placeholder="GSTIN"
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                        />
                    </View>

                    {/* Customer Grouping */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-2">
                            Customer Grouping
                        </Text>
                        <View className="border border-gray-300 rounded-lg px-3 py-2 bg-white">
                            <Text className="text-gray-900">{customerGrouping || 'Customer Grouping'}</Text>
                        </View>
                    </View>
                </View>

                {/* Billing Address Section */}
                <View className="mt-8 space-y-4">
                    <View className="mb-6">
                        <Text className="text-sm font-medium text-gray-700 mb-3">Billing Address</Text>
                    </View>
                    
                    <View className="mb-4">
                        <Text className="text-sm text-gray-700 mb-2">Address Line 1</Text>
                        <TextInput
                            value={billingAddress1}
                            onChangeText={setBillingAddress1}
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-700 mb-2">
                            Address line 2
                        </Text>
                        <TextInput
                            value={billingAddress2}
                            onChangeText={setBillingAddress2}
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-700 mb-2">Address line 3</Text>
                        <TextInput
                            value={billingAddress3}
                            onChangeText={setBillingAddress3}
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-700 mb-2">Locality</Text>
                        <TextInput
                            value={billingLocality}
                            onChangeText={setBillingLocality}
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-700 mb-2">Country</Text>
                        <View className="border border-gray-300 rounded-lg px-3 py-2 bg-white">
                            <Text className="text-gray-900">{billingCountry}</Text>
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-700 mb-2">State</Text>
                        <View className="border border-gray-300 rounded-lg px-3 py-2 bg-white">
                            <Text className="text-gray-900">{billingState}</Text>
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-700 mb-2">City</Text>
                        <View className="border border-gray-300 rounded-lg px-3 py-2 bg-white">
                            <Text className="text-gray-900">{billingCity}</Text>
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-700 mb-2">Pincode</Text>
                        <TextInput
                            value={billingPincode}
                            onChangeText={setBillingPincode}
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                        />
                    </View>
                </View>

                {/* Shipping Address Section */}
                <View className="mt-8 space-y-4">
                    <View className="mb-6">
                        <Text className="text-sm font-medium text-gray-700 mb-3">Shipping Address</Text>
                    </View>

                    <View className="mb-4">
                        <TouchableOpacity
                            onPress={() => setSameAsBilling(!sameAsBilling)}
                            className="flex-row items-center gap-2"
                        >
                            <View className={`w-4 h-4 rounded border-2 ${sameAsBilling ? 'border-teal-600 bg-teal-600' : 'border-gray-300'}`}>
                                {sameAsBilling && <Text className="text-white text-xs self-center">✓</Text>}
                            </View>
                            <Text className="text-sm text-gray-700">
                                Shipping address same as Billing address
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-700 mb-2">Address Line 1</Text>
                        <TextInput
                            value={sameAsBilling ? billingAddress1 : shippingAddress1}
                            onChangeText={setShippingAddress1}
                            editable={!sameAsBilling}
                            className={`border rounded-lg px-3 py-2 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'} text-gray-900`}
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-700 mb-2">
                            Address line 2
                        </Text>
                        <TextInput
                            value={sameAsBilling ? billingAddress2 : shippingAddress2}
                            onChangeText={setShippingAddress2}
                            editable={!sameAsBilling}
                            className={`border rounded-lg px-3 py-2 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'} text-gray-900`}
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-700 mb-2">Address line 3</Text>
                        <TextInput
                            value={sameAsBilling ? billingAddress3 : shippingAddress3}
                            onChangeText={setShippingAddress3}
                            editable={!sameAsBilling}
                            className={`border rounded-lg px-3 py-2 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'} text-gray-900`}
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-700 mb-2">Locality</Text>
                        <TextInput
                            value={sameAsBilling ? billingLocality : shippingLocality}
                            onChangeText={setShippingLocality}
                            editable={!sameAsBilling}
                            className={`border rounded-lg px-3 py-2 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'} text-gray-900`}
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-700 mb-2">Country</Text>
                        <View className={`border rounded-lg px-3 py-2 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}>
                            <Text className="text-gray-900">{sameAsBilling ? billingCountry : shippingCountry || 'India'}</Text>
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-700 mb-2">State</Text>
                        <View className={`border rounded-lg px-3 py-2 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}>
                            <Text className="text-gray-900">{sameAsBilling ? billingState : shippingState || 'Tamil Nadu'}</Text>
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-700 mb-2">City</Text>
                        <View className={`border rounded-lg px-3 py-2 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'}`}>
                            <Text className="text-gray-900">{sameAsBilling ? billingCity : shippingCity || 'Ariyapakkam'}</Text>
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-700 mb-2">Pincode</Text>
                        <TextInput
                            value={sameAsBilling ? billingPincode : shippingPincode}
                            onChangeText={setShippingPincode}
                            editable={!sameAsBilling}
                            className={`border rounded-lg px-3 py-2 ${sameAsBilling ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'} text-gray-900`}
                        />
                    </View>
                </View>

                {/* Referred Customers Section */}
                <View className="mt-8 space-y-4">
                    <View className="mb-6">
                        <Text className="text-sm font-medium text-gray-700 mb-3">Referred Customers</Text>
                    </View>
                    <TouchableOpacity className="bg-teal-600 rounded-lg px-4 py-2 items-center">
                        <Text className="text-white font-medium">No Referred Customers</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };

    const renderQuotationsTab = () => {
        return (
            <ScrollView className="flex-1 px-4 pb-4">
                <View className="border border-gray-300 rounded-lg overflow-hidden">
                    <View className="bg-gray-600 px-3 py-2">
                        <View className="flex-row">
                            <Text className="text-white text-xs font-bold flex-1">Date</Text>
                            <Text className="text-white text-xs font-bold flex-1">Quotation ID</Text>
                            <Text className="text-white text-xs font-bold flex-1">Model Code</Text>
                            <Text className="text-white text-xs font-bold flex-1">Model Name</Text>
                            <Text className="text-white text-xs font-bold w-16 text-center">Action</Text>
                        </View>
                    </View>
                    {mockQuotations.map((quotation, index) => (
                        <View
                            key={index}
                            className={`px-3 py-2 border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        >
                            <View className="flex-row items-center">
                                <Text className="text-xs text-gray-600 flex-1">{quotation.date}</Text>
                                <Text className="text-xs text-teal-600 font-bold flex-1">{quotation.quotationId}</Text>
                                <Text className="text-xs text-gray-800 flex-1">{quotation.modelCode}</Text>
                                <Text className="text-xs text-gray-800 flex-1" numberOfLines={1}>{quotation.modelName}</Text>
                                <TouchableOpacity className="w-16 items-center">
                                    <Text className="text-teal-600 text-xs font-medium">View</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'customer-details':
                return renderCustomerDetailsTab();
            case 'quotations':
                return renderQuotationsTab();
            default:
                return (
                    <View className="flex-1 items-center justify-center p-4">
                        <Text className="text-gray-400 text-center">No data available for {activeTab}</Text>
                    </View>
                );
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white border-b border-gray-100 px-4 py-3 flex-row items-center">
                <TouchableOpacity onPress={handleClose} className="mr-3">
                    <ChevronLeft size={22} color={COLORS.gray[900]} />
                </TouchableOpacity>
                <Text className="text-gray-900 text-lg font-bold">Customer Details</Text>
            </View>

            {/* Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="bg-white border-b border-gray-200 mb-3"
                contentContainerStyle={{ paddingHorizontal: 8 }}
                style={{ flexGrow: 0 }}
            >
                {CUSTOMER_TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => setActiveTab(tab.id)}
                        className={`px-3 py-5 border-b-2 ${activeTab === tab.id ? 'border-teal-600' : 'border-transparent'
                            }`}
                    >
                        <Text className={`text-xs font-bold ${activeTab === tab.id ? 'text-teal-600' : 'text-gray-600'
                            }`}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            {/* Tab Content */}
            {renderTabContent()}
            {/* Footer */}
            <View className="bg-white border-t border-gray-100 p-4 flex-row">
                <Button
                    title="Cancel"
                    variant="outline"
                    className="flex-1 mr-2"
                    onPress={handleClose}
                />
                <Button
                    title="Save"
                    className="flex-1 ml-2"
                    onPress={handleSave}
                />
            </View>
        </SafeAreaView>
    );
}