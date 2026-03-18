import React, { useMemo, useState, useEffect } from 'react';
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
    ActivityIndicator,
} from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import moment from 'moment';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X, ChevronDown, Check, Calendar } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import {
    useJobCardFilters,
    ALL_JOB_STATUSES,
    ALL_SERVICE_TYPES,
} from '../../src/hooks/job-cards/useJobCardFilters';

// ─── Types ────────────────────────────────────────────────────────────────────
type Option = { label: string; value: string };

type FilterState = {
    vehicleModel: string[];
    serviceType: string[];
    mechanic: string[];
    jobStatus: string[];
    registerNumber: string;
    serviceKmsFrom: string;
    serviceKmsTo: string;
    startDate: string;
    endDate: string;
};

// ─── FormLabel ────────────────────────────────────────────────────────────────
const FormLabel = ({ text }: { text: string }) => (
    <Text className="text-sm text-gray-600 font-medium mb-1.5">{text}</Text>
);

// ─── MultiSelectField ─────────────────────────────────────────────────────────
function MultiSelectField({
    placeholder,
    values,
    options,
    onChange,
    disabled,
    loading,
}: {
    placeholder: string;
    values: string[];
    options: Option[];
    onChange: (next: string[]) => void;
    disabled?: boolean;
    loading?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const allSelected = options.length > 0 && values.length === options.length;

    const selectedLabels = useMemo(
        () => options.filter(o => values.includes(o.value)).map(o => o.label),
        [options, values]
    );

    const displayValue = useMemo(() => {
        if (loading) return 'Loading...';
        if (!values.length) return placeholder;
        if (values.length === 1) return selectedLabels[0] || placeholder;
        return `${values.length} selected`;
    }, [placeholder, selectedLabels, values.length, loading]);

    const filteredOptions = useMemo(() => {
        if (!searchQuery) return options;
        return options.filter(o => o.label.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [options, searchQuery]);

    const toggleValue = (value: string) => {
        if (values.includes(value)) onChange(values.filter(v => v !== value));
        else onChange([...values, value]);
    };

    const toggleAll = () => {
        if (allSelected) onChange([]);
        else onChange(options.map(o => o.value));
    };

    const handleClose = () => {
        setOpen(false);
        setSearchQuery('');
    };

    return (
        <View>
            <TouchableOpacity
                onPress={() => !disabled && !loading && setOpen(true)}
                className={`h-12 border rounded-xl px-4 flex-row items-center justify-between ${disabled || loading
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-white border-gray-200'
                    }`}
                activeOpacity={0.7}
            >
                {loading ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                    <Text className={values.length && !disabled ? 'text-gray-900' : 'text-gray-400'} numberOfLines={1}>
                        {displayValue}
                    </Text>
                )}
                <ChevronDown size={18} color={COLORS.gray[400]} />
            </TouchableOpacity>

            <Modal visible={open} transparent animationType="fade" onRequestClose={handleClose}>
                <Pressable className="flex-1 bg-black/40 justify-center" onPress={handleClose}>
                    <Pressable className="mx-4 bg-white rounded-2xl p-4 max-h-[70%]" onPress={() => { }}>
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-base font-bold text-gray-900">Select Options</Text>
                            <TouchableOpacity onPress={handleClose}>
                                <X size={20} color={COLORS.gray[700]} />
                            </TouchableOpacity>
                        </View>

                        {/* Search Box */}
                        <View className="mb-3">
                            <TextInput
                                className="h-10 border border-gray-200 rounded-lg px-3 text-sm text-gray-800"
                                placeholder="Search..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                            />
                        </View>

                        {!searchQuery && (
                            <TouchableOpacity onPress={toggleAll} className="flex-row items-center mb-3" activeOpacity={0.7}>
                                <View className={`w-5 h-5 rounded border items-center justify-center ${allSelected ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300'}`}>
                                    {allSelected && <Check size={14} color="white" />}
                                </View>
                                <Text className="ml-2 text-sm text-gray-700">Select All</Text>
                            </TouchableOpacity>
                        )}

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {filteredOptions.map(option => {
                                const selected = values.includes(option.value);
                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        onPress={() => toggleValue(option.value)}
                                        className="flex-row items-center py-2"
                                        activeOpacity={0.7}
                                    >
                                        <View className={`w-5 h-5 rounded border items-center justify-center ${selected ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300'}`}>
                                            {selected && <Check size={14} color="white" />}
                                        </View>
                                        <Text className="ml-2 text-sm text-gray-700" numberOfLines={2}>{option.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                            {filteredOptions.length === 0 && (
                                <Text className="text-gray-400 text-sm text-center py-4">No results found</Text>
                            )}
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

// ─── Calendar Modal ───────────────────────────────────────────────────────────
function CalendarModal({
    visible, title, selectedDate, onSelect, onClose,
}: {
    visible: boolean;
    title: string;
    selectedDate: Date | null;
    onSelect: (day: any) => void;
    onClose: () => void;
}) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable className="flex-1 bg-black/40 justify-center" onPress={onClose}>
                <Pressable className="mx-4 bg-white rounded-2xl p-3" onPress={() => { }}>
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-gray-900 font-bold text-base flex-1 mr-2">{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={20} color={COLORS.gray[700]} />
                        </TouchableOpacity>
                    </View>
                    <RNCalendar
                        current={selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                        onDayPress={onSelect}
                        theme={{
                            todayTextColor: COLORS.primary,
                            selectedDayBackgroundColor: COLORS.primary,
                            selectedDayTextColor: '#fff',
                            arrowColor: COLORS.primary,
                            textSectionTitleColor: '#6b7280',
                        }}
                        markedDates={selectedDate ? {
                            [selectedDate.toISOString().split('T')[0]]: { selected: true, selectedColor: COLORS.primary },
                        } : undefined}
                    />
                    <View className="flex-row justify-end mt-4">
                        <TouchableOpacity onPress={onClose} className="px-4 py-2 rounded-lg bg-teal-600">
                            <Text className="text-white font-semibold">Done</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

// ─── Dropdown + "All" toggle row ──────────────────────────────────────────────
function DropdownWithAll({
    label, placeholder, values, options, allChecked, onChange, onToggleAll, loading,
}: {
    label: string;
    placeholder: string;
    values: string[];
    options: Option[];
    allChecked: boolean;
    onChange: (v: string[]) => void;
    onToggleAll: () => void;
    loading?: boolean;
}) {
    return (
        <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <View className="flex-row items-center justify-between mb-1.5">
                <FormLabel text={label} />
                <TouchableOpacity onPress={onToggleAll} className="flex-row items-center" activeOpacity={0.7}>
                    <View className={`w-4 h-4 rounded border items-center justify-center ${allChecked ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300'}`}>
                        {allChecked && <Check size={10} color="white" />}
                    </View>
                    <Text className="ml-1.5 text-xs text-gray-600">All</Text>
                </TouchableOpacity>
            </View>
            <MultiSelectField
                placeholder={placeholder}
                values={values}
                options={options}
                onChange={onChange}
                disabled={allChecked}
                loading={loading}
            />
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function JobCardFiltersScreen({ navigation }: any) {
    // Fetch real data from APIs
    const { vehicleModels, mechanics, loading: filterLoading } = useJobCardFilters();

    // Build options from real API data
    const vehicleModelOptions: Option[] = useMemo(
        () => vehicleModels.map(m => ({ label: m.modelName, value: m.id })),
        [vehicleModels]
    );

    const mechanicOptions: Option[] = useMemo(
        () => mechanics.map(m => ({ label: m.profile.employeeName, value: m.id })),
        [mechanics]
    );

    // Service types — static (from API report §6)
    const serviceTypeOptions: Option[] = useMemo(
        () => ALL_SERVICE_TYPES.map(s => ({ label: s, value: s })),
        []
    );

    // Job statuses — full list from API report §5
    const jobStatusOptions: Option[] = useMemo(
        () => ALL_JOB_STATUSES.map(s => ({ label: s, value: s })),
        []
    );

    const defaultFilters: FilterState = {
        vehicleModel: [], serviceType: [], mechanic: [], jobStatus: [],
        registerNumber: '', serviceKmsFrom: '', serviceKmsTo: '',
        startDate: '', endDate: '',
    };

    const [filters, setFilters] = useState<FilterState>(defaultFilters);
    const [allModels, setAllModels] = useState(false);
    const [allServiceTypes, setAllServiceTypes] = useState(false);
    const [allMechanics, setAllMechanics] = useState(false);
    const [allJobStatuses, setAllJobStatuses] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [startDateObj, setStartDateObj] = useState<Date | null>(null);
    const [endDateObj, setEndDateObj] = useState<Date | null>(null);

    // Load existing filters on component mount
    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem('jobCardFilters');
                if (!stored) return;
                const parsed = JSON.parse(stored);
                setFilters((prev) => ({
                    ...prev,
                    vehicleModel: parsed?.vehicleModel || [],
                    serviceType: parsed?.serviceType || [],
                    mechanic: parsed?.mechanic || [],
                    jobStatus: parsed?.jobStatus || [],
                    registerNumber: parsed?.registerNumber || '',
                    serviceKmsFrom: parsed?.serviceKmsFrom || '',
                    serviceKmsTo: parsed?.serviceKmsTo || '',
                    startDate: parsed?.startDate || '',
                    endDate: parsed?.endDate || '',
                }));

                // Set "All" toggles based on stored data
                if (parsed?.vehicleModel?.length === vehicleModelOptions.length) {
                    setAllModels(true);
                }
                if (parsed?.serviceType?.length === ALL_SERVICE_TYPES.length) {
                    setAllServiceTypes(true);
                }
                if (parsed?.mechanic?.length === mechanicOptions.length) {
                    setAllMechanics(true);
                }
                if (parsed?.jobStatus?.length === ALL_JOB_STATUSES.length) {
                    setAllJobStatuses(true);
                }

                // Set date objects for calendar
                if (parsed?.startDate) {
                    const dateParts = parsed.startDate.split('/');
                    if (dateParts.length === 3) {
                        const date = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
                        if (!isNaN(date.getTime())) {
                            setStartDateObj(date);
                        }
                    }
                }
                if (parsed?.endDate) {
                    const dateParts = parsed.endDate.split('/');
                    if (dateParts.length === 3) {
                        const date = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
                        if (!isNaN(date.getTime())) {
                            setEndDateObj(date);
                        }
                    }
                }
            } catch (e) {
                // ignore
            }
        })();
    }, [vehicleModelOptions.length, mechanicOptions.length]);

    const handleStartDateSelect = (day: any) => {
        const date = new Date(day.dateString);
        setStartDateObj(date);
        setFilters(prev => ({ ...prev, startDate: moment(date).format('DD/MM/YYYY') }));
        setShowStartPicker(false);
    };

    const handleEndDateSelect = (day: any) => {
        const date = new Date(day.dateString);
        setEndDateObj(date);
        setFilters(prev => ({ ...prev, endDate: moment(date).format('DD/MM/YYYY') }));
        setShowEndPicker(false);
    };

    const handleClear = () => {
        setFilters(defaultFilters);
        setAllModels(false);
        setAllServiceTypes(false);
        setAllMechanics(false);
        setAllJobStatuses(false);
        setStartDateObj(null);
        setEndDateObj(null);
        AsyncStorage.removeItem('jobCardFilters').catch(() => { });
    };

    /**
     * Build the filter payload exactly as per the API report:
     * - Model: array of model IDs (null if all/none)
     * - serviceType: array of strings
     * - mechanic: array of employee IDs
     * - jobStatus: array of strings
     * - registerNo: string
     * - serviceKmFrom / serviceKmTo: numbers
     * - from / to: ISO strings
     */
    const handleSearch = async () => {
        const filter: Record<string, any> = {};

        // Vehicle Model → IDs
        if (allModels) {
            filter.vehicleModel = vehicleModelOptions.map(o => o.value);
        } else if (filters.vehicleModel.length) {
            filter.vehicleModel = filters.vehicleModel;
        }

        // Service Type
        if (allServiceTypes) {
            filter.serviceType = ALL_SERVICE_TYPES;
        } else if (filters.serviceType.length) {
            filter.serviceType = filters.serviceType;
        }

        // Mechanic
        if (allMechanics) {
            filter.mechanic = mechanicOptions.map(o => o.value);
        } else if (filters.mechanic.length) {
            filter.mechanic = filters.mechanic;
        }

        // Job Status
        if (allJobStatuses) {
            filter.jobStatus = ALL_JOB_STATUSES;
        } else if (filters.jobStatus.length) {
            filter.jobStatus = filters.jobStatus;
        }

        if (filters.registerNumber) filter.registerNumber = filters.registerNumber;
        if (filters.serviceKmsFrom) filter.serviceKmsFrom = filters.serviceKmsFrom;
        if (filters.serviceKmsTo) filter.serviceKmsTo = filters.serviceKmsTo;
        if (filters.startDate) filter.startDate = filters.startDate;
        if (filters.endDate) filter.endDate = filters.endDate;

        await AsyncStorage.setItem('jobCardFilters', JSON.stringify(filter));
        navigation.goBack();
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
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
                    {/* Vehicle Model — real API data */}
                    <DropdownWithAll
                        label="Vehicle Model"
                        placeholder="Select Vehicle Model"
                        values={filters.vehicleModel}
                        options={vehicleModelOptions}
                        allChecked={allModels}
                        loading={filterLoading}
                        onChange={v => setFilters(prev => ({ ...prev, vehicleModel: v }))}
                        onToggleAll={() => {
                            setAllModels(!allModels);
                            if (!allModels) setFilters(prev => ({ ...prev, vehicleModel: [] }));
                        }}
                    />

                    {/* Service Type — static (per API spec) */}
                    <DropdownWithAll
                        label="Service Type"
                        placeholder="Select Service Type"
                        values={filters.serviceType}
                        options={serviceTypeOptions}
                        allChecked={allServiceTypes}
                        onChange={v => setFilters(prev => ({ ...prev, serviceType: v }))}
                        onToggleAll={() => {
                            setAllServiceTypes(!allServiceTypes);
                            if (!allServiceTypes) setFilters(prev => ({ ...prev, serviceType: [] }));
                        }}
                    />

                    {/* Mechanic — real API data */}
                    <DropdownWithAll
                        label="Mechanic"
                        placeholder="Select Mechanic"
                        values={filters.mechanic}
                        options={mechanicOptions}
                        allChecked={allMechanics}
                        loading={filterLoading}
                        onChange={v => setFilters(prev => ({ ...prev, mechanic: v }))}
                        onToggleAll={() => {
                            setAllMechanics(!allMechanics);
                            if (!allMechanics) setFilters(prev => ({ ...prev, mechanic: [] }));
                        }}
                    />

                    {/* Job Status — full 13-status list */}
                    <DropdownWithAll
                        label="Job Status"
                        placeholder="Select Job Status"
                        values={filters.jobStatus}
                        options={jobStatusOptions}
                        allChecked={allJobStatuses}
                        onChange={v => setFilters(prev => ({ ...prev, jobStatus: v }))}
                        onToggleAll={() => {
                            setAllJobStatuses(!allJobStatuses);
                            if (!allJobStatuses) setFilters(prev => ({ ...prev, jobStatus: [] }));
                        }}
                    />

                    {/* Register Number */}
                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Register Number" />
                        <TextInput
                            value={filters.registerNumber}
                            onChangeText={v => setFilters(prev => ({ ...prev, registerNumber: v }))}
                            placeholder="Enter the Register Number"
                            className="h-12 bg-white border border-gray-200 rounded-xl px-4 text-gray-900"
                            autoCapitalize="characters"
                        />
                    </View>

                    {/* Service KMs */}
                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Service KMs" />
                        <View className="flex-row items-center gap-3">
                            <TextInput
                                value={filters.serviceKmsFrom}
                                onChangeText={v => setFilters(prev => ({ ...prev, serviceKmsFrom: v }))}
                                placeholder="From"
                                className="flex-1 h-12 bg-white border border-gray-200 rounded-xl px-4 text-gray-900"
                                keyboardType="numeric"
                            />
                            <Text className="text-gray-400 text-sm">to</Text>
                            <TextInput
                                value={filters.serviceKmsTo}
                                onChangeText={v => setFilters(prev => ({ ...prev, serviceKmsTo: v }))}
                                placeholder="To"
                                className="flex-1 h-12 bg-white border border-gray-200 rounded-xl px-4 text-gray-900"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    {/* Job Card Creation Date */}
                    <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                        <FormLabel text="Job Card Creation Date" />
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setShowStartPicker(true)}
                                className="flex-1 h-12 bg-white border border-gray-200 rounded-xl px-4 flex-row items-center justify-between"
                            >
                                <Text className={filters.startDate ? 'text-gray-900' : 'text-gray-400'}>
                                    {filters.startDate || 'Start date'}
                                </Text>
                                <Calendar size={18} color={COLORS.gray[400]} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setShowEndPicker(true)}
                                className="flex-1 h-12 bg-white border border-gray-200 rounded-xl px-4 flex-row items-center justify-between"
                            >
                                <Text className={filters.endDate ? 'text-gray-900' : 'text-gray-400'}>
                                    {filters.endDate || 'End date'}
                                </Text>
                                <Calendar size={18} color={COLORS.gray[400]} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Buttons */}
                    <View className="flex-row gap-3 pt-1">
                        <Button title="Clear" variant="outline" className="flex-1" onPress={handleClear} />
                        <Button title="Search" className="flex-1" onPress={handleSearch} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <CalendarModal
                visible={showStartPicker}
                title="Select Job Card Start Date"
                selectedDate={startDateObj}
                onSelect={handleStartDateSelect}
                onClose={() => setShowStartPicker(false)}
            />
            <CalendarModal
                visible={showEndPicker}
                title="Select Job Card End Date"
                selectedDate={endDateObj}
                onSelect={handleEndDateSelect}
                onClose={() => setShowEndPicker(false)}
            />
        </SafeAreaView>
    );
}
