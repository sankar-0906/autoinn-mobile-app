import React, { useState } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity,
    Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, User, Car, Wallet, ShieldCheck, ChevronRight } from 'lucide-react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../src/ToastContext';

type Props = {
    navigation: StackNavigationProp<RootStackParamList, 'ConfirmBooking'>;
    route: RouteProp<RootStackParamList, 'ConfirmBooking'>;
};

const STEPS = [
    { id: 1, label: 'Customer\nData', Icon: User },
    { id: 2, label: 'Vehicle\nData', Icon: Car },
    { id: 3, label: 'Payment\nData', Icon: Wallet },
    { id: 4, label: 'Customer\nAuth', Icon: ShieldCheck },
];

// ── Reusable sub-components ─────────────────────────────────────────────────

const Label = ({ text, required }: { text: string; required?: boolean }) => (
    <Text className="text-sm font-medium text-gray-700 mb-1">
        {required && <Text className="text-red-500">* </Text>}{text}
    </Text>
);

const Field = ({
    label, value, onChange, required, placeholder, keyboardType, editable, multiline,
}: {
    label: string; value: string; onChange?: (v: string) => void;
    required?: boolean; placeholder?: string; keyboardType?: any;
    editable?: boolean; multiline?: boolean;
}) => (
    <View className="mb-4">
        {!!label && <Label text={label} required={required} />}
        <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={placeholder || label}
            keyboardType={keyboardType || 'default'}
            editable={editable !== false}
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            className={`border rounded-lg px-3 bg-white text-sm text-gray-900
                ${editable === false ? 'bg-gray-50 text-gray-500' : ''}
                ${multiline ? 'py-3 min-h-[96px] text-top' : 'h-11'} border-gray-300`}
        />
    </View>
);

const SelectField = ({
    label, value, options, onSelect, required,
}: {
    label: string; value: string; options: string[];
    onSelect: (v: string) => void; required?: boolean;
}) => {
    const [open, setOpen] = useState(false);
    return (
        <View className="mb-4">
            {!!label && <Label text={label} required={required} />}
            <TouchableOpacity onPress={() => setOpen(!open)}
                className="h-11 border border-gray-300 rounded-lg px-3 justify-center bg-white">
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
        </View>
    );
};

const SectionHeader = ({ title }: { title: string }) => (
    <Text className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">{title}</Text>
);

const CurrencyField = ({ label, value, onChange, required, editable }: {
    label: string; value: string; onChange?: (v: string) => void;
    required?: boolean; editable?: boolean;
}) => (
    <View className="mb-4">
        <Label text={label} required={required} />
        <View className="flex-row items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
            <View className="px-3 py-2.5 bg-gray-100 border-r border-gray-300">
                <Text className="text-gray-600 text-sm font-medium">₹</Text>
            </View>
            <TextInput value={value} onChangeText={onChange}
                placeholder="0" keyboardType="decimal-pad"
                editable={editable !== false}
                className="flex-1 h-11 px-3 text-sm text-gray-900" />
        </View>
    </View>
);

// ── Steps ───────────────────────────────────────────────────────────────────

const StepCustomerData = () => {
    const [branch, setBranch] = useState('');
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [fatherName, setFatherName] = useState('');
    const [addr1, setAddr1] = useState('');
    const [addr2, setAddr2] = useState('');
    const [addr3, setAddr3] = useState('');
    const [locality, setLocality] = useState('');
    const [country, setCountry] = useState('India');
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    const [pincode, setPincode] = useState('');
    const [email, setEmail] = useState('');
    const [dob, setDob] = useState('');
    const [age, setAge] = useState('');
    const [nominee, setNominee] = useState('');
    const [salesOfficer, setSalesOfficer] = useState('');
    const [referredBy, setReferredBy] = useState('');
    const [relationship, setRelationship] = useState('');

    return (
        <View>
            <SelectField label="Branch" value={branch} required
                options={['Devanahalli', 'Main Branch']} onSelect={setBranch} />
            <Field label="Phone" value={phone} onChange={setPhone}
                required keyboardType="phone-pad" placeholder="+91 XXXXXXXXXX" />
            <Field label="Customer Name" value={name} onChange={setName} required />
            <Field label="Father's Name" value={fatherName} onChange={setFatherName} required />
            <Field label="Address Line 1" value={addr1} onChange={setAddr1} required />
            <Field label="Address Line 2" value={addr2} onChange={setAddr2} />
            <Field label="Address Line 3" value={addr3} onChange={setAddr3} />
            <Field label="Locality" value={locality} onChange={setLocality} required />
            <SelectField label="Country" value={country} required
                options={['India', 'Other']} onSelect={setCountry} />
            <Field label="State" value={state} onChange={setState} required />
            <Field label="City" value={city} onChange={setCity} required />
            <Field label="Pincode" value={pincode} onChange={setPincode} keyboardType="number-pad" />
            <Field label="Email" value={email} onChange={setEmail} keyboardType="email-address" />
            <Field label="DOB" value={dob} onChange={setDob} required placeholder="DD/MM/YYYY" />
            <Field label="Age" value={age} onChange={setAge} required keyboardType="number-pad" />
            <Field label="Nominee Details" value={nominee} onChange={setNominee} required />
            <SelectField label="Sales Officer" value={salesOfficer} required
                options={['Sano', 'Raj', 'Priya']} onSelect={setSalesOfficer} />
            <SelectField label="Referred By" value={referredBy}
                options={['Walk-in', 'Reference', 'Online']} onSelect={setReferredBy} />
            <SelectField label="Relationship" value={relationship}
                options={['Self', 'Spouse', 'Parent', 'Friend']} onSelect={setRelationship} />

            {/* Quotations / Associated */}
            <View className="border-t border-gray-100 pt-4 mt-2">
                <View className="mb-2">
                    <Text className="text-sm font-semibold text-gray-700">Quotations / Associated</Text>
                    <TouchableOpacity className="mt-1">
                        <Text className="text-teal-600 text-sm font-medium">Link Quotation</Text>
                    </TouchableOpacity>
                </View>
                <TextInput
                    value="QDE/25-26/441 QDE/25-26/2614 QDE/25-26/115"
                    editable={false}
                    className="h-11 border border-gray-200 rounded-lg px-3 justify-center bg-gray-50 text-sm text-gray-500"
                />
            </View>
        </View>
    );
};

const StepVehicleData = () => {
    const [manufacturer, setManufacturer] = useState('');
    const [modelName, setModelName] = useState('');
    const [vehicleColor, setVehicleColor] = useState('');
    const [rto, setRto] = useState('');
    const [exchangeModel, setExchangeModel] = useState('');
    const [exchangePrice, setExchangePrice] = useState('');
    const [onRoadPrice, setOnRoadPrice] = useState('');
    const [tempRegCharges, setTempRegCharges] = useState('');
    const [hypothecation, setHypothecation] = useState('');
    const [numberPlateCharges, setNumberPlateCharges] = useState('');
    const [affidavitAmount, setAffidavitAmount] = useState('');
    const [specialNoCharges, setSpecialNoCharges] = useState('');
    const [onRoadDiscount, setOnRoadDiscount] = useState('');
    const [deliveryDate, setDeliveryDate] = useState('');
    const [finalAmount, setFinalAmount] = useState('');

    return (
        <View>
            <SelectField label="Manufacturer" value={manufacturer} required
                options={['India Yamaha Motors Private Limited']} onSelect={setManufacturer} />
            <SelectField label="Model Name" value={modelName} required
                options={['Model Name']} onSelect={setModelName} />
            <View className="mb-4">
                <Label text="Vehicle Color" required />
                <View className="h-11 border border-gray-200 rounded-lg px-3 justify-center bg-gray-50 mb-2">
                    <Text className="text-sm text-gray-400">{vehicleColor || 'No Vehicle Chosen'}</Text>
                </View>
                <TouchableOpacity
                    className="h-11 px-3 border border-gray-300 rounded-lg justify-center items-center"
                    onPress={() => Alert.alert('Color Picker', 'Vehicle color picker coming soon')}>
                    <Text className="text-sm text-gray-700 font-medium">Select Color</Text>
                </TouchableOpacity>
            </View>
            <SelectField label="RTO" value={rto} required
                options={['Select RTO']} onSelect={setRto} />

            {/* Accessories Table */}
            <View className="border-t border-gray-100 pt-4 mb-4">
                <SectionHeader title="Accessories" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="border border-gray-200 rounded-lg overflow-hidden mb-3">
                    <View style={{ minWidth: 600 }}>
                        <View className="bg-gray-500 flex-row">
                            {['Accessory', 'Qty', 'Discount', 'Before Disc.', 'After Disc.'].map((h) => (
                                <Text key={h} className="text-white text-xs font-semibold px-2 py-2.5 flex-1 text-center">{h}</Text>
                            ))}
                        </View>
                        <View className="px-3 py-10 items-center">
                            <Text className="text-xs text-gray-400">No accessories added</Text>
                        </View>
                    </View>
                </ScrollView>
                <CurrencyField label="Total Discount" value="" editable={false} />
                <CurrencyField label="Accessories Total" value="" editable={false} />
                <CurrencyField label="Total (after Discount)" value="" editable={false} />

                <TouchableOpacity className="bg-gray-200 rounded-lg py-3 items-center mt-2">
                    <Text className="text-gray-700 text-sm font-medium">Add / Modify Accessory</Text>
                </TouchableOpacity>
            </View>

            {/* Exchange Vehicle */}
            <View className="border-t border-gray-100 pt-4 mb-4">
                <SectionHeader title="Exchange Vehicle Information" />
                <Field label="Exchange Model Name" value={exchangeModel} onChange={setExchangeModel} placeholder="Exchange Vehicle" />
                <CurrencyField label="Exchange Price" value={exchangePrice} onChange={setExchangePrice} />
            </View>

            {/* Vehicle Charges */}
            <View className="border-t border-gray-100 pt-4">
                <SectionHeader title="Vehicle Charges" />
                <CurrencyField label="On Road Price" value={onRoadPrice} onChange={setOnRoadPrice} />
                <CurrencyField label="Temp. Registration Charges" value={tempRegCharges} onChange={setTempRegCharges} />
                <CurrencyField label="Hypothecation" value={hypothecation} onChange={setHypothecation} />
                <CurrencyField label="Number Plate Charges" value={numberPlateCharges} onChange={setNumberPlateCharges} />
                <CurrencyField label="Affidavit Amount" value={affidavitAmount} onChange={setAffidavitAmount} />
                <CurrencyField label="Special No. Charges" value={specialNoCharges} onChange={setSpecialNoCharges} />
                <CurrencyField label="On Road Discount" value={onRoadDiscount} onChange={setOnRoadDiscount} />
                <Field label="Expected Delivery Date" value={deliveryDate} onChange={setDeliveryDate} placeholder="DD/MM/YYYY" />
                <CurrencyField label="Final Amount" value={finalAmount} editable={false} />
            </View>
        </View>
    );
};

const StepPaymentData = () => {
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [hypothecation, setHypothecation] = useState('');
    const [loanType, setLoanType] = useState('');
    const [financierName, setFinancierName] = useState('');
    const [financierBranch, setFinancierBranch] = useState('');
    const [remarks, setRemarks] = useState('');
    const [netPrice, setNetPrice] = useState('');

    return (
        <View>
            <SelectField label="Payment Mode" value={paymentMode} required
                options={['Cash', 'Finance']} onSelect={setPaymentMode} />

            {paymentMode === 'Finance' && (
                <View className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-4">
                    <SectionHeader title="Finance Details" />
                    <Field label="Hypothecation" value={hypothecation} onChange={setHypothecation} placeholder="Hypothecation" />
                    <SelectField label="Loan Type" value={loanType}
                        options={['Self', 'Company Assisted']} onSelect={setLoanType} />
                    <SelectField label="Financier Name" value={financierName}
                        options={['HDFC', 'ICICI', 'SBI', 'Bajaj Finance']} onSelect={setFinancierName} />
                    <Field label="Financier Branch" value={financierBranch} onChange={setFinancierBranch} />

                    {loanType === 'Company Assisted' && (
                        <View className="mt-4 border-t border-gray-200 pt-4">
                            <SectionHeader title="Financial Assistance Data" />
                            <CurrencyField label="Down Payment" value="" />
                            <SelectField label="Tenure" value="" options={['1', '2', '3', '6', '12', '24', '36']} onSelect={() => { }} />
                            <CurrencyField label="Loan Amount" value="" />
                            <CurrencyField label="EMI Amount" value="" />
                            <SelectField label="EMI Cost" value="" options={['Day/Qtrly', 'Daily', 'Weekly', 'Monthly', 'Quarterly']} onSelect={() => { }} />
                            <Field label="EMI Start Date" value="" placeholder="DD/MM/YYYY" />
                            <CurrencyField label="Loan Disbursement Amount" value="" />
                            <CurrencyField label="Showroom Finance Charges" value="" />
                        </View>
                    )}
                </View>
            )}

            <Field label="Remarks" value={remarks} onChange={setRemarks}
                placeholder="Enter remarks..." multiline />
            <CurrencyField label="Net Price / Wallet" value={netPrice} onChange={setNetPrice} />
        </View>
    );
};

const StepCustomerAuth = () => (
    <View className="items-center py-16">
        <View className="w-20 h-20 rounded-full bg-teal-50 items-center justify-center mb-4">
            <ShieldCheck size={40} color={COLORS.primary} strokeWidth={1.5} />
        </View>
        <Text className="text-gray-500 text-sm text-center">
            Customer Authentication will be required to complete the booking.
        </Text>
    </View>
);

// ── Main Screen ─────────────────────────────────────────────────────────────

export default function ConfirmBookingScreen({ navigation, route }: Props) {
    const toast = useToast();
    const { customerId, customerName, bookingType } = route.params;
    const [currentStep, setCurrentStep] = useState(1);
    const screenTitle = bookingType === 'advanced' ? 'Advanced Booking' : 'Confirm Booking';

    const steps = bookingType === 'advanced'
        ? STEPS.slice(0, 3)
        : STEPS;

    const handleNext = () => {
        if (currentStep < steps.length) { setCurrentStep(currentStep + 1); }
        else {
            toast.success('Booking saved successfully!');
            navigation.goBack();
        }
    };

    const handleBack = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <StepCustomerData />;
            case 2: return <StepVehicleData />;
            case 3: return <StepPaymentData />;
            case 4: return <StepCustomerAuth />;
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
                        <Text className="text-lg font-bold text-gray-900">{screenTitle}</Text>
                    </View>
                </View>
            </View>

            {/* Customer ID banner (Replicated from CustomerEditScreen) */}
            <View className="bg-white border-b border-gray-100 px-4 py-3">
                <View className="bg-teal-50 rounded-xl px-4 py-3 flex-row items-center">
                    <Text className="text-xs text-gray-500">Customer ID :</Text>
                    <Text className="ml-4 text-sm font-bold text-gray-900">{customerId || 'Not assigned'}</Text>
                </View>
            </View>

            {/* Step indicator */}
            <View className="bg-white border-b border-gray-100 px-4 py-4">
                <View className="flex-row items-center justify-between">
                    {steps.map((step, index) => {
                        const { Icon } = step;
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;
                        return (
                            <React.Fragment key={step.id}>
                                <View className="items-center flex-1">
                                    <View className={`w-10 h-10 rounded-full items-center justify-center mb-1 ${isActive ? 'bg-teal-600' : isCompleted ? 'bg-teal-100' : 'bg-gray-100'
                                        }`}>
                                        <Icon size={18}
                                            color={isActive ? '#fff' : isCompleted ? COLORS.primary : '#9CA3AF'} />
                                    </View>
                                    <Text className={`text-xs text-center ${isActive ? 'text-teal-600 font-semibold' : isCompleted ? 'text-teal-600' : 'text-gray-400'
                                        }`} numberOfLines={2}>{step.label}</Text>
                                    {isActive && <View className="h-0.5 bg-teal-600 rounded mt-2 w-full" />}
                                </View>
                                {index < steps.length - 1 && (
                                    <ChevronRight size={16} color="#D1D5DB" style={{ marginBottom: 16 }} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </View>
            </View>

            {/* Content */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}>
                    <View className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        {renderStep()}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer */}
            <View className="bg-white border-t border-gray-100 px-4 py-4">
                <View className="flex-row gap-3 justify-end">
                    {currentStep > 1 && (
                        <Button title="Back" variant="outline" onPress={handleBack}
                            className="px-6" />
                    )}
                    <Button title="Cancel" variant="outline" onPress={() => navigation.goBack()}
                        className="px-6" />
                    <Button
                        title={currentStep === steps.length ? 'Save & Complete' : 'Next'}
                        onPress={handleNext}
                        className="px-8" />
                </View>
            </View>
        </SafeAreaView>
    );
}
