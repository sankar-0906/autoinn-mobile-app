import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Check, ChevronLeft } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';

type Option = { label: string; value: string };

const FormLabel = ({ text }: { text: string }) => (
    <Text className="text-sm text-gray-600 font-medium mb-1.5">{text}</Text>
);

function SelectField({
    placeholder,
    value,
    options,
    onSelect,
}: {
    placeholder: string;
    value: string;
    options: Option[];
    onSelect: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const selectedLabel = options.find((option) => option.value === value)?.label ?? '';

    return (
        <View>
            <TouchableOpacity
                onPress={() => setOpen((prev) => !prev)}
                className="h-12 bg-white border border-gray-200 rounded-xl px-4 flex-row items-center justify-between"
                activeOpacity={0.7}
            >
                <Text className={selectedLabel ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedLabel || placeholder}
                </Text>
                <ChevronDown size={18} color={COLORS.gray[400]} />
            </TouchableOpacity>
            {open && (
                <View className="mt-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            onPress={() => {
                                onSelect(option.value);
                                setOpen(false);
                            }}
                            className={`px-4 py-3 border-b border-gray-50 ${value === option.value ? 'bg-teal-50' : ''}`}
                        >
                            <Text className={value === option.value ? 'text-teal-700 font-semibold' : 'text-gray-700'}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

function SelectWithAll({
    placeholder,
    value,
    options,
    allSelected,
    onSelect,
    onToggleAll,
}: {
    placeholder: string;
    value: string;
    options: Option[];
    allSelected: boolean;
    onSelect: (value: string) => void;
    onToggleAll: () => void;
}) {
    return (
        <View>
            <SelectField
                placeholder={placeholder}
                value={value}
                options={options}
                onSelect={onSelect}
            />
            <TouchableOpacity
                onPress={onToggleAll}
                className="flex-row items-center"
                style={{ marginTop: 12 }}
                activeOpacity={0.7}
            >
                <View
                    className={`w-5 h-5 rounded border items-center justify-center ${allSelected ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300'}`}
                >
                    {allSelected && <Check size={14} color="white" />}
                </View>
                <Text className="ml-2 text-sm text-gray-600">Select All</Text>
            </TouchableOpacity>
        </View>
    );
}

export default function FollowUpFiltersScreen({ navigation }: any) {
    const defaultFilters = {
        vehicleModel: '',
        vehicleCategory: '',
        enquiryType: '',
        testDrive: '',
        paymentMode: '',
        leadSource: '',
        salesExecutive: '',
        expectedPurchaseStart: '',
        expectedPurchaseEnd: '',
        quotationIssuedStart: '',
        quotationIssuedEnd: '',
    };

    const [filters, setFilters] = useState(defaultFilters);
    const [selectAll, setSelectAll] = useState({
        model: false,
        category: false,
        enquiry: false,
        source: false,
        executive: false,
    });

    const handleClear = () => {
        setFilters(defaultFilters);
        setSelectAll({
            model: false,
            category: false,
            enquiry: false,
            source: false,
            executive: false,
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white border-b border-gray-100 px-4 py-4 flex-row items-center">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
                    <ChevronLeft size={22} color={COLORS.gray[900]} />
                </TouchableOpacity>
                <Text className="text-gray-900 text-lg font-bold">Advanced Filters</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Vehicle Model :" />
                        <SelectWithAll
                            placeholder="Select Vehicle Model"
                            value={filters.vehicleModel}
                            options={[
                                { label: 'Ray ZR 125 Fi Hybrid Disc', value: 'ray-zr' },
                                { label: 'Fascino 125 Fi Hybrid DLX Disc', value: 'fascino' },
                                { label: 'Aerox 155', value: 'aerox' },
                                { label: 'FZ-S V3.0', value: 'fzs' },
                                { label: 'MT-15 V2', value: 'mt15' },
                            ]}
                            allSelected={selectAll.model}
                            onToggleAll={() => setSelectAll((prev) => ({ ...prev, model: !prev.model }))}
                            onSelect={(value) => setFilters((prev) => ({ ...prev, vehicleModel: value }))}
                        />
                    </View>

                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Vehicle Category :" />
                        <SelectWithAll
                            placeholder="Select Vehicle Category"
                            value={filters.vehicleCategory}
                            options={[
                                { label: 'Scooter', value: 'scooter' },
                                { label: 'Motorcycle', value: 'motorcycle' },
                                { label: 'Sports Bike', value: 'sports' },
                            ]}
                            allSelected={selectAll.category}
                            onToggleAll={() => setSelectAll((prev) => ({ ...prev, category: !prev.category }))}
                            onSelect={(value) => setFilters((prev) => ({ ...prev, vehicleCategory: value }))}
                        />
                    </View>

                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Enquiry Type :" />
                        <SelectWithAll
                            placeholder="Select Enquiry Type"
                            value={filters.enquiryType}
                            options={[
                                { label: 'Walk-in', value: 'walk-in' },
                                { label: 'Phone Call', value: 'phone' },
                                { label: 'Online', value: 'online' },
                                { label: 'Referral', value: 'referral' },
                            ]}
                            allSelected={selectAll.enquiry}
                            onToggleAll={() => setSelectAll((prev) => ({ ...prev, enquiry: !prev.enquiry }))}
                            onSelect={(value) => setFilters((prev) => ({ ...prev, enquiryType: value }))}
                        />
                    </View>

                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Test Drive Taken :" />
                        <SelectField
                            placeholder="Select Test Drive Status"
                            value={filters.testDrive}
                            options={[
                                { label: 'Yes', value: 'yes' },
                                { label: 'No', value: 'no' },
                                { label: 'Scheduled', value: 'scheduled' },
                            ]}
                            onSelect={(value) => setFilters((prev) => ({ ...prev, testDrive: value }))}
                        />
                    </View>

                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Payment Mode :" />
                        <SelectField
                            placeholder="Select Payment Mode"
                            value={filters.paymentMode}
                            options={[
                                { label: 'Cash', value: 'cash' },
                                { label: 'Finance', value: 'finance' },
                                { label: 'Exchange', value: 'exchange' },
                            ]}
                            onSelect={(value) => setFilters((prev) => ({ ...prev, paymentMode: value }))}
                        />
                    </View>

                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Lead Source :" />
                        <SelectWithAll
                            placeholder="Select Lead Source"
                            value={filters.leadSource}
                            options={[
                                { label: 'Showroom Visit', value: 'showroom' },
                                { label: 'Website', value: 'website' },
                                { label: 'Referral', value: 'referral' },
                                { label: 'Advertisement', value: 'advertisement' },
                                { label: 'Social Media', value: 'social' },
                            ]}
                            allSelected={selectAll.source}
                            onToggleAll={() => setSelectAll((prev) => ({ ...prev, source: !prev.source }))}
                            onSelect={(value) => setFilters((prev) => ({ ...prev, leadSource: value }))}
                        />
                    </View>

                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Sales Executive :" />
                        <SelectWithAll
                            placeholder="Select Sales Executive"
                            value={filters.salesExecutive}
                            options={[
                                { label: 'Hariharan (ENB038)', value: 'hariharan' },
                                { label: 'Rajesh Kumar', value: 'rajesh' },
                                { label: 'Priya Sharma', value: 'priya' },
                            ]}
                            allSelected={selectAll.executive}
                            onToggleAll={() => setSelectAll((prev) => ({ ...prev, executive: !prev.executive }))}
                            onSelect={(value) => setFilters((prev) => ({ ...prev, salesExecutive: value }))}
                        />
                    </View>

                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Expected Purchase Date : (ex : DD/MM/YYYY)" />
                        <View className="flex-row gap-3">
                            <TextInput
                                placeholder="Start date"
                                value={filters.expectedPurchaseStart}
                                onChangeText={(value) => setFilters((prev) => ({ ...prev, expectedPurchaseStart: value }))}
                                className="flex-1 h-12 bg-white border border-gray-200 rounded-xl px-4 text-gray-900"
                            />
                            <TextInput
                                placeholder="End date"
                                value={filters.expectedPurchaseEnd}
                                onChangeText={(value) => setFilters((prev) => ({ ...prev, expectedPurchaseEnd: value }))}
                                className="flex-1 h-12 bg-white border border-gray-200 rounded-xl px-4 text-gray-900"
                            />
                        </View>
                    </View>

                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Quotation Issued Date : (ex : DD/MM/YYYY)" />
                        <View className="flex-row gap-3">
                            <TextInput
                                placeholder="Start date"
                                value={filters.quotationIssuedStart}
                                onChangeText={(value) => setFilters((prev) => ({ ...prev, quotationIssuedStart: value }))}
                                className="flex-1 h-12 bg-white border border-gray-200 rounded-xl px-4 text-gray-900"
                            />
                            <TextInput
                                placeholder="End date"
                                value={filters.quotationIssuedEnd}
                                onChangeText={(value) => setFilters((prev) => ({ ...prev, quotationIssuedEnd: value }))}
                                className="flex-1 h-12 bg-white border border-gray-200 rounded-xl px-4 text-gray-900"
                            />
                        </View>
                    </View>

                    <View className="flex-row gap-3 pt-1">
                        <Button
                            title="Clear"
                            variant="outline"
                            className="flex-1"
                            onPress={handleClear}
                        />
                        <Button
                            title="Search"
                            className="flex-1"
                            onPress={() => navigation.goBack()}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
