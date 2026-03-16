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
import { Calendar as RNCalendar } from 'react-native-calendars';
import moment from 'moment';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X, ChevronDown, Check, Calendar } from 'lucide-react-native';
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
                        
                        <View className="pt-3 mt-3 border-t border-gray-200">
                            <TouchableOpacity
                                onPress={() => setOpen(false)}
                                className="bg-teal-600 rounded-lg py-3 items-center"
                                activeOpacity={0.8}
                            >
                                <Text className="text-white font-semibold text-sm">OK</Text>
                            </TouchableOpacity>
                        </View>
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

    // Date picker states
    const [showExpectedStartPicker, setShowExpectedStartPicker] = useState(false);
    const [showExpectedEndPicker, setShowExpectedEndPicker] = useState(false);
    const [showIssuedStartPicker, setShowIssuedStartPicker] = useState(false);
    const [showIssuedEndPicker, setShowIssuedEndPicker] = useState(false);
    
    // Calendar date objects
    const [expectedStartDate, setExpectedStartDate] = useState<Date | null>(null);
    const [expectedEndDate, setExpectedEndDate] = useState<Date | null>(null);
    const [issuedStartDate, setIssuedStartDate] = useState<Date | null>(null);
    const [issuedEndDate, setIssuedEndDate] = useState<Date | null>(null);

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

    // Date picker handlers
    const handleExpectedStartDateSelect = (day: any) => {
        const date = new Date(day.dateString);
        setExpectedStartDate(date);
        const formattedDate = moment(date).format('DD/MM/YYYY');
        setFilters((prev) => ({ ...prev, expectedPurchaseStart: formattedDate }));
        setShowExpectedStartPicker(false);
    };

    const handleExpectedEndDateSelect = (day: any) => {
        const date = new Date(day.dateString);
        setExpectedEndDate(date);
        const formattedDate = moment(date).format('DD/MM/YYYY');
        setFilters((prev) => ({ ...prev, expectedPurchaseEnd: formattedDate }));
        setShowExpectedEndPicker(false);
    };

    const handleIssuedStartDateSelect = (day: any) => {
        const date = new Date(day.dateString);
        setIssuedStartDate(date);
        const formattedDate = moment(date).format('DD/MM/YYYY');
        setFilters((prev) => ({ ...prev, quotationIssuedStart: formattedDate }));
        setShowIssuedStartPicker(false);
    };

    const handleIssuedEndDateSelect = (day: any) => {
        const date = new Date(day.dateString);
        setIssuedEndDate(date);
        const formattedDate = moment(date).format('DD/MM/YYYY');
        setFilters((prev) => ({ ...prev, quotationIssuedEnd: formattedDate }));
        setShowIssuedEndPicker(false);
    };

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
                            <TouchableOpacity
                                onPress={() => setShowExpectedStartPicker(true)}
                                className="flex-1 h-12 bg-white border border-gray-200 rounded-xl px-4 flex-row items-center justify-between"
                            >
                                <Text className={filters.expectedPurchaseStart ? 'text-gray-900' : 'text-gray-400'}>
                                    {filters.expectedPurchaseStart || 'Start date'}
                                </Text>
                                <Calendar size={18} color={COLORS.gray[400]} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setShowExpectedEndPicker(true)}
                                className="flex-1 h-12 bg-white border border-gray-200 rounded-xl px-4 flex-row items-center justify-between"
                            >
                                <Text className={filters.expectedPurchaseEnd ? 'text-gray-900' : 'text-gray-400'}>
                                    {filters.expectedPurchaseEnd || 'End date'}
                                </Text>
                                <Calendar size={18} color={COLORS.gray[400]} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Quotation Issued Date (ex: DD/MM/YYYY)" />
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setShowIssuedStartPicker(true)}
                                className="flex-1 h-12 bg-white border border-gray-200 rounded-xl px-4 flex-row items-center justify-between"
                            >
                                <Text className={filters.quotationIssuedStart ? 'text-gray-900' : 'text-gray-400'}>
                                    {filters.quotationIssuedStart || 'Start date'}
                                </Text>
                                <Calendar size={18} color={COLORS.gray[400]} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setShowIssuedEndPicker(true)}
                                className="flex-1 h-12 bg-white border border-gray-200 rounded-xl px-4 flex-row items-center justify-between"
                            >
                                <Text className={filters.quotationIssuedEnd ? 'text-gray-900' : 'text-gray-400'}>
                                    {filters.quotationIssuedEnd || 'End date'}
                                </Text>
                                <Calendar size={18} color={COLORS.gray[400]} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="flex-row gap-3 pt-1">
                        <Button title="Clear" variant="outline" className="flex-1" onPress={handleClear} />
                        <Button title="Search" className="flex-1" onPress={handleSearch} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Calendar Modals */}
            <Modal visible={showExpectedStartPicker} transparent animationType="fade" onRequestClose={() => setShowExpectedStartPicker(false)}>
                <Pressable className="flex-1 bg-black/40 justify-center" onPress={() => setShowExpectedStartPicker(false)}>
                    <Pressable className="mx-4 bg-white rounded-2xl p-3 w-full max-w-sm" onPress={() => {}}>
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-gray-900 font-bold text-lg">Select Expected Purchase Start Date</Text>
                            <TouchableOpacity onPress={() => setShowExpectedStartPicker(false)}>
                                <X size={20} color={COLORS.gray[700]} />
                            </TouchableOpacity>
                        </View>
                        <RNCalendar
                            current={expectedStartDate ? expectedStartDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                            onDayPress={handleExpectedStartDateSelect}
                            theme={{
                                todayTextColor: COLORS.primary,
                                selectedDayBackgroundColor: COLORS.primary,
                                selectedDayTextColor: '#fff',
                                arrowColor: COLORS.primary,
                                textSectionTitleColor: '#6b7280',
                            }}
                            markedDates={
                                expectedStartDate
                                    ? {
                                        [expectedStartDate.toISOString().split('T')[0]]: {
                                            selected: true,
                                            selectedColor: COLORS.primary,
                                        },
                                    }
                                    : undefined
                            }
                        />
                        <View className="flex-row justify-end mt-4">
                            <TouchableOpacity
                                onPress={() => setShowExpectedStartPicker(false)}
                                className="px-4 py-2 rounded-lg bg-teal-600"
                            >
                                <Text className="text-white font-semibold">Done</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal visible={showExpectedEndPicker} transparent animationType="fade" onRequestClose={() => setShowExpectedEndPicker(false)}>
                <Pressable className="flex-1 bg-black/40 justify-center" onPress={() => setShowExpectedEndPicker(false)}>
                    <Pressable className="mx-4 bg-white rounded-2xl p-3 w-full max-w-sm" onPress={() => {}}>
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-gray-900 font-bold text-lg">Select Expected Purchase End Date</Text>
                            <TouchableOpacity onPress={() => setShowExpectedEndPicker(false)}>
                                <X size={20} color={COLORS.gray[700]} />
                            </TouchableOpacity>
                        </View>
                        <RNCalendar
                            current={expectedEndDate ? expectedEndDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                            onDayPress={handleExpectedEndDateSelect}
                            theme={{
                                todayTextColor: COLORS.primary,
                                selectedDayBackgroundColor: COLORS.primary,
                                selectedDayTextColor: '#fff',
                                arrowColor: COLORS.primary,
                                textSectionTitleColor: '#6b7280',
                            }}
                            markedDates={
                                expectedEndDate
                                    ? {
                                        [expectedEndDate.toISOString().split('T')[0]]: {
                                            selected: true,
                                            selectedColor: COLORS.primary,
                                        },
                                    }
                                    : undefined
                            }
                        />
                        <View className="flex-row justify-end mt-4">
                            <TouchableOpacity
                                onPress={() => setShowExpectedEndPicker(false)}
                                className="px-4 py-2 rounded-lg bg-teal-600"
                            >
                                <Text className="text-white font-semibold">Done</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal visible={showIssuedStartPicker} transparent animationType="fade" onRequestClose={() => setShowIssuedStartPicker(false)}>
                <Pressable className="flex-1 bg-black/40 justify-center" onPress={() => setShowIssuedStartPicker(false)}>
                    <Pressable className="mx-4 bg-white rounded-2xl p-3 w-full max-w-sm" onPress={() => {}}>
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-gray-900 font-bold text-lg">Select Quotation Issued Start Date</Text>
                            <TouchableOpacity onPress={() => setShowIssuedStartPicker(false)}>
                                <X size={20} color={COLORS.gray[700]} />
                            </TouchableOpacity>
                        </View>
                        <RNCalendar
                            current={issuedStartDate ? issuedStartDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                            onDayPress={handleIssuedStartDateSelect}
                            theme={{
                                todayTextColor: COLORS.primary,
                                selectedDayBackgroundColor: COLORS.primary,
                                selectedDayTextColor: '#fff',
                                arrowColor: COLORS.primary,
                                textSectionTitleColor: '#6b7280',
                            }}
                            markedDates={
                                issuedStartDate
                                    ? {
                                        [issuedStartDate.toISOString().split('T')[0]]: {
                                            selected: true,
                                            selectedColor: COLORS.primary,
                                        },
                                    }
                                    : undefined
                            }
                        />
                        <View className="flex-row justify-end mt-4">
                            <TouchableOpacity
                                onPress={() => setShowIssuedStartPicker(false)}
                                className="px-4 py-2 rounded-lg bg-teal-600"
                            >
                                <Text className="text-white font-semibold">Done</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal visible={showIssuedEndPicker} transparent animationType="fade" onRequestClose={() => setShowIssuedEndPicker(false)}>
                <Pressable className="flex-1 bg-black/40 justify-center" onPress={() => setShowIssuedEndPicker(false)}>
                    <Pressable className="mx-4 bg-white rounded-2xl p-3 w-full max-w-sm" onPress={() => {}}>
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-gray-900 font-bold text-lg">Select Quotation Issued End Date</Text>
                            <TouchableOpacity onPress={() => setShowIssuedEndPicker(false)}>
                                <X size={20} color={COLORS.gray[700]} />
                            </TouchableOpacity>
                        </View>
                        <RNCalendar
                            current={issuedEndDate ? issuedEndDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                            onDayPress={handleIssuedEndDateSelect}
                            theme={{
                                todayTextColor: COLORS.primary,
                                selectedDayBackgroundColor: COLORS.primary,
                                selectedDayTextColor: '#fff',
                                arrowColor: COLORS.primary,
                                textSectionTitleColor: '#6b7280',
                            }}
                            markedDates={
                                issuedEndDate
                                    ? {
                                        [issuedEndDate.toISOString().split('T')[0]]: {
                                            selected: true,
                                            selectedColor: COLORS.primary,
                                        },
                                    }
                                    : undefined
                            }
                        />
                        <View className="flex-row justify-end mt-4">
                            <TouchableOpacity
                                onPress={() => setShowIssuedEndPicker(false)}
                                className="px-4 py-2 rounded-lg bg-teal-600"
                            >
                                <Text className="text-white font-semibold">Done</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}
