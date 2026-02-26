import React, { useEffect, useMemo, useState } from 'react';
import {
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X, ChevronDown, Check } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { getUsers, getVehicleMaster } from '../../src/api';

type Option = { label: string; value: string };

type FilterState = {
    model: string[];
    category: string[];
    enquiryType: string[];
    testDriven: string[];
    paymentMode: string[];
    leadSource: string[];
    salesExecutive: string[];
    expectedPurchaseStart: string;
    expectedPurchaseEnd: string;
    quotationIssuedStart: string;
    quotationIssuedEnd: string;
};

const FormLabel = ({ text }: { text: string }) => (
    <Text className="text-sm text-gray-600 font-medium mb-1.5">{text}</Text>
);

function MultiSelectField({
    placeholder,
    values,
    options,
    onChange,
}: {
    placeholder: string;
    values: string[];
    options: Option[];
    onChange: (next: string[]) => void;
}) {
    const [open, setOpen] = useState(false);
    const allSelected = options.length > 0 && values.length === options.length;
    const selectedLabels = useMemo(
        () => options.filter((option) => values.includes(option.value)).map((option) => option.label),
        [options, values]
    );

    const displayValue = useMemo(() => {
        if (!values.length) return placeholder;
        if (values.length === 1) return selectedLabels[0] || placeholder;
        return `${values.length} selected`;
    }, [placeholder, selectedLabels, values.length]);

    const toggleValue = (value: string) => {
        if (values.includes(value)) {
            onChange(values.filter((v) => v !== value));
        } else {
            onChange([...values, value]);
        }
    };

    const toggleAll = () => {
        if (allSelected) {
            onChange([]);
        } else {
            onChange(options.map((option) => option.value));
        }
    };

    return (
        <View>
            <TouchableOpacity
                onPress={() => setOpen(true)}
                className="h-12 bg-white border border-gray-200 rounded-xl px-4 flex-row items-center justify-between"
                activeOpacity={0.7}
            >
                <Text className={values.length ? 'text-gray-900' : 'text-gray-400'} numberOfLines={1}>
                    {displayValue}
                </Text>
                <ChevronDown size={18} color={COLORS.gray[400]} />
            </TouchableOpacity>

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable className="flex-1 bg-black/40 justify-center" onPress={() => setOpen(false)}>
                    <Pressable className="mx-4 bg-white rounded-2xl p-4 max-h-[70%]" onPress={() => {}}>
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-base font-bold text-gray-900">Select Options</Text>
                            <TouchableOpacity onPress={() => setOpen(false)}>
                                <X size={20} color={COLORS.gray[700]} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={toggleAll}
                            className="flex-row items-center mb-3"
                            activeOpacity={0.7}
                        >
                            <View
                                className={`w-5 h-5 rounded border items-center justify-center ${allSelected ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300'}`}
                            >
                                {allSelected && <Check size={14} color="white" />}
                            </View>
                            <Text className="ml-2 text-sm text-gray-700">Select All</Text>
                        </TouchableOpacity>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {options.map((option) => {
                                const selected = values.includes(option.value);
                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        onPress={() => toggleValue(option.value)}
                                        className="flex-row items-center py-2"
                                        activeOpacity={0.7}
                                    >
                                        <View
                                            className={`w-5 h-5 rounded border items-center justify-center ${selected ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300'}`}
                                        >
                                            {selected && <Check size={14} color="white" />}
                                        </View>
                                        <Text className="ml-2 text-sm text-gray-700" numberOfLines={2}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

export default function AdvancedFiltersScreen({ navigation }: any) {
    const defaultFilters: FilterState = {
        model: [],
        category: [],
        enquiryType: [],
        testDriven: [],
        paymentMode: [],
        leadSource: [],
        salesExecutive: [],
        expectedPurchaseStart: '',
        expectedPurchaseEnd: '',
        quotationIssuedStart: '',
        quotationIssuedEnd: '',
    };

    const [filters, setFilters] = useState<FilterState>(defaultFilters);
    const [modelOptions, setModelOptions] = useState<Option[]>([]);
    const [executiveOptions, setExecutiveOptions] = useState<Option[]>([]);

    const enquiryTypes = useMemo<Option[]>(
        () => [
            { label: 'Hot', value: 'Hot' },
            { label: 'Warm', value: 'Warm' },
            { label: 'Cold', value: 'Cold' },
        ],
        []
    );

    const leadSources = useMemo<Option[]>(
        () => [
            { label: 'Walk In', value: 'WALK IN' },
            { label: 'Call Enquiry', value: 'CALL ENQUIRY' },
            { label: 'Referral', value: 'REFERRAL' },
            { label: 'Social Media', value: 'SOCIAL MEDIA' },
            { label: 'SMS', value: 'SMS' },
            { label: 'Newspaper', value: 'NEWSPAPER' },
            { label: 'Television Ad', value: 'TELEVISION AD' },
            { label: 'Leaflet', value: 'LEAFLET' },
        ],
        []
    );

    const categoryOptions = useMemo<Option[]>(
        () => [
            { label: 'Scooter', value: 'SCOOTER' },
            { label: 'Motorcycle', value: 'MOTORCYCLE' },
        ],
        []
    );

    const formatIsoToDisplay = (value: string) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    const parseDateToIso = (value: string) => {
        if (!value) return null;
        const parts = value.split(/[\/\-]/).map((p) => p.trim());
        if (parts.length < 3) return null;
        const [dd, mm, yyyy] = parts;
        const day = Number(dd);
        const month = Number(mm);
        const year = Number(yyyy);
        if (!day || !month || !year) return null;
        const date = new Date(year, month - 1, day);
        if (Number.isNaN(date.getTime())) return null;
        return date.toISOString();
    };

    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem('quotationFilters');
                if (!stored) return;
                const parsed = JSON.parse(stored);
                setFilters((prev) => ({
                    ...prev,
                    model: parsed?.model || [],
                    category: parsed?.category || [],
                    enquiryType: parsed?.enquiryType || [],
                    leadSource: parsed?.leadSource || [],
                    salesExecutive: parsed?.salesExecutive || [],
                    testDriven: parsed?.testDriven || [],
                    paymentMode: parsed?.paymentMode || [],
                    expectedPurchaseStart: parsed?.expectedPurchaseDatefromDate
                        ? formatIsoToDisplay(parsed.expectedPurchaseDatefromDate)
                        : '',
                    expectedPurchaseEnd: parsed?.expectedPurchaseDatetoDate
                        ? formatIsoToDisplay(parsed.expectedPurchaseDatetoDate)
                        : '',
                    quotationIssuedStart: parsed?.fromDate ? formatIsoToDisplay(parsed.fromDate) : '',
                    quotationIssuedEnd: parsed?.toDate ? formatIsoToDisplay(parsed.toDate) : '',
                }));
            } catch (e) {
                // ignore
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await getVehicleMaster();
                const data = res?.data;
                if (data?.code === 200 && data?.response?.code === 200) {
                    const list = Array.isArray(data.response.data) ? data.response.data : [];
                    const options = list.map((model: any) => ({
                        value: model.id,
                        label: `${model.modelName || ''}${model.modelCode ? `-${model.modelCode}` : ''}`.trim(),
                    }));
                    setModelOptions(options);
                }
            } catch (e) {
                setModelOptions([]);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await getUsers({ size: 1000, page: 1 });
                const data = res?.data;
                if (data?.code === 200 && data?.response?.code === 200) {
                    const users = Array.isArray(data.response?.data?.users) ? data.response.data.users : [];
                    const filtered = users
                        .filter((user: any) => {
                            const departmentType = Array.isArray(user?.profile?.department?.departmentType)
                                ? user.profile.department.departmentType
                                : [];
                            const isSales = departmentType.includes('Sales');
                            return isSales && user?.status === true;
                        })
                        .map((user: any) => ({
                            label: user?.profile?.employeeName || 'Executive',
                            value: user.id,
                        }));
                    setExecutiveOptions(filtered);
                }
            } catch (e) {
                setExecutiveOptions([]);
            }
        })();
    }, []);

    const handleClear = () => {
        setFilters(defaultFilters);
        AsyncStorage.removeItem('quotationFilters').catch(() => {});
    };

    const handleSearch = async () => {
        const filter: any = {};

        if (filters.model.length) filter.model = filters.model;
        if (filters.category.length) filter.category = filters.category;
        if (filters.enquiryType.length) filter.enquiryType = filters.enquiryType;
        if (filters.leadSource.length) filter.leadSource = filters.leadSource;
        if (filters.salesExecutive.length) filter.salesExecutive = filters.salesExecutive;

        if (filters.testDriven.length) filter.testDriven = filters.testDriven;
        if (filters.paymentMode.length) filter.paymentMode = filters.paymentMode;

        const expectedFrom = parseDateToIso(filters.expectedPurchaseStart);
        const expectedTo = parseDateToIso(filters.expectedPurchaseEnd);
        if (expectedFrom) filter.expectedPurchaseDatefromDate = expectedFrom;
        if (expectedTo) filter.expectedPurchaseDatetoDate = expectedTo;

        const issuedFrom = parseDateToIso(filters.quotationIssuedStart);
        const issuedTo = parseDateToIso(filters.quotationIssuedEnd);
        if (issuedFrom) filter.fromDate = issuedFrom;
        if (issuedTo) filter.toDate = issuedTo;

        await AsyncStorage.setItem('quotationFilters', JSON.stringify(filter));
        navigation.goBack();
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-white border-b border-gray-100 px-4 py-4 flex-row items-center justify-between">
                <Text className="text-gray-900 text-lg font-bold">Advanced Filters</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <X size={22} color={COLORS.gray[900]} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Vehicle Model" />
                        <MultiSelectField
                            placeholder="Select Vehicle Model"
                            values={filters.model}
                            options={modelOptions}
                            onChange={(values) => setFilters((prev) => ({ ...prev, model: values }))}
                        />
                    </View>

                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Vehicle Category" />
                        <MultiSelectField
                            placeholder="Select Vehicle Category"
                            values={filters.category}
                            options={categoryOptions}
                            onChange={(values) => setFilters((prev) => ({ ...prev, category: values }))}
                        />
                    </View>

                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Enquiry Type" />
                        <MultiSelectField
                            placeholder="Select Enquiry Type"
                            values={filters.enquiryType}
                            options={enquiryTypes}
                            onChange={(values) => setFilters((prev) => ({ ...prev, enquiryType: values }))}
                        />
                    </View>

                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Test Drive Taken" />
                        <MultiSelectField
                            placeholder="Select Test Drive Status"
                            values={filters.testDriven}
                            options={[
                                { label: 'Yes', value: 'TRUE' },
                                { label: 'No', value: 'FALSE' },
                            ]}
                            onChange={(values) => setFilters((prev) => ({ ...prev, testDriven: values }))}
                        />
                    </View>

                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Payment Mode" />
                        <MultiSelectField
                            placeholder="Select Payment Mode"
                            values={filters.paymentMode}
                            options={[
                                { label: 'Cash', value: 'CASH' },
                                { label: 'Finance', value: 'FINANCE' },
                            ]}
                            onChange={(values) => setFilters((prev) => ({ ...prev, paymentMode: values }))}
                        />
                    </View>

                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Lead Source" />
                        <MultiSelectField
                            placeholder="Select Lead Source"
                            values={filters.leadSource}
                            options={leadSources}
                            onChange={(values) => setFilters((prev) => ({ ...prev, leadSource: values }))}
                        />
                    </View>

                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Sales Executive" />
                        <MultiSelectField
                            placeholder="Select Sales Executive"
                            values={filters.salesExecutive}
                            options={executiveOptions}
                            onChange={(values) => setFilters((prev) => ({ ...prev, salesExecutive: values }))}
                        />
                    </View>

                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Expected Purchase Date (ex: DD/MM/YYYY)" />
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
                        <FormLabel text="Quotation Issued Date (ex: DD/MM/YYYY)" />
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
                        <Button title="Clear" variant="outline" className="flex-1" onPress={handleClear} />
                        <Button title="Search" className="flex-1" onPress={handleSearch} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
