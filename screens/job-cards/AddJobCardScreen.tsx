import React, { useState, useEffect, useCallback } from 'react';
import {
    Alert,
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
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    X, ChevronDown, ChevronRight, Plus, Trash2,
    Check, FolderOpen, Camera, Download,
} from 'lucide-react-native';
import { SearchableDropdown } from '../../components/ui';
import { Option } from '../../components/ui/SearchableDropdown';
import moment from 'moment';
import { COLORS } from '../../constants/colors';
import { HeaderWithBack } from '../../components/ui/BackButton';
import { useBranchAutoFill } from '../../src/hooks/useBranchAutoFill';
import { useBranch } from '../../src/context/branch';
import { useJobCardVehicleSearch } from '../../src/hooks/job-cards/useJobCardVehicleSearch';
import { createJobCard, updateJobCard, getJobCardServiceHistory, getJobCardPDFUrl } from '../../src/api/job-cards/jobCardApi';
import { ENDPOINT } from '../../src/api';
import { ALL_SERVICE_TYPES } from '../../src/hooks/job-cards/useJobCardFilters';
import type { JobCardComplaint, ServiceHistoryItem, InvoiceItem } from '../../types/job-cards';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Complaint { id: number; text: string; }
type Step1Tab = 'Complaints' | 'Service History' | 'Documents';
type ServiceHistorySubTab = 'Parts Details' | 'Labour Detail';
interface Option { label: string; value: string; }

// ─── FormLabel ────────────────────────────────────────────────────────────────
const FormLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
    <Text className="text-sm text-gray-600 mb-1 font-medium">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
    </Text>
);

// ─── Static Dropdown ──────────────────────────────────────────────────────────
function DropdownField({ placeholder, value, options, onChange, disabled }: {
    placeholder: string; value: string; options: Option[]; onChange: (v: string) => void; disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const selected = options.find(o => o.value === value);

    const filteredOptions = searchQuery
        ? options.filter(o => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : options;

    const handleClose = () => {
        setOpen(false);
        setSearchQuery('');
    };

    return (
        <View>
            <TouchableOpacity
                onPress={() => !disabled && setOpen(true)}
                activeOpacity={0.7}
                className={`h-12 border rounded-lg px-3 flex-row items-center justify-between ${disabled ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
            >
                <Text className={selected && !disabled ? 'text-gray-800 flex-1' : 'text-gray-400 flex-1'} numberOfLines={1}>
                    {selected ? selected.label : placeholder}
                </Text>
                <ChevronDown size={16} color={COLORS.gray[400]} />
            </TouchableOpacity>
            <Modal visible={open} transparent animationType="fade" onRequestClose={handleClose}>
                <Pressable className="flex-1 bg-black/40 justify-center" onPress={handleClose}>
                    <Pressable className="mx-4 bg-white rounded-xl p-4 max-h-[60%]" onPress={() => { }}>
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-base font-bold text-gray-900">Select Option</Text>
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

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {filteredOptions.map(opt => (
                                <TouchableOpacity
                                    key={opt.value}
                                    onPress={() => { onChange(opt.value); handleClose(); }}
                                    className="flex-row items-center py-3 border-b border-gray-50"
                                    activeOpacity={0.7}
                                >
                                    <View className={`w-5 h-5 rounded border items-center justify-center mr-3 ${value === opt.value ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300'}`}>
                                        {value === opt.value && <Check size={12} color="white" />}
                                    </View>
                                    <Text className="text-sm text-gray-800">{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                            {filteredOptions.length === 0 && (
                                <Text className="text-gray-400 text-sm text-center py-4">No results found</Text>
                            )}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

// ─── Read-only field ──────────────────────────────────────────────────────────
function ReadOnlyField({ value }: { value: string }) {
    return (
        <View className="h-12 bg-gray-50 border border-gray-200 rounded-lg px-3 justify-center">
            <Text className="text-gray-800">{value || '-'}</Text>
        </View>
    );
}

// ─── Scrollable Table ─────────────────────────────────────────────────────────
function ScrollableTable({ headers, children, minWidth = 500, emptyText = 'No Data', isEmpty = false }: {
    headers: string[]; children?: React.ReactNode; minWidth?: number; emptyText?: string; isEmpty?: boolean;
}) {
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={true} className="overflow-hidden">
            <View style={{ minWidth }} className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                <View className="bg-gray-600 p-3">
                    <View className="flex-row" style={{ minWidth }}>
                        {headers.map((h, i) => (
                            <Text key={i} className="text-sm font-medium text-white flex-1">{h}</Text>
                        ))}
                    </View>
                </View>
                {isEmpty ? (
                    <View className="p-12 items-center" style={{ minWidth }}>
                        <FolderOpen size={40} color={COLORS.gray[300]} strokeWidth={1} />
                        <Text className="text-sm text-gray-400 mt-2">{emptyText}</Text>
                    </View>
                ) : children}
            </View>
        </ScrollView>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AddJobCardScreen({ navigation, route }: { navigation: any; route: any }) {
    const editJobCard = route?.params?.jobCard || null;
    const isEdit = !!editJobCard;

    const [step, setStep] = useState<0 | 1>(0);
    const [saving, setSaving] = useState(false);

    // ── Branch auto-fill ──────────────────────────────────────────────────────
    const { autoFilledBranch } = useBranchAutoFill();
    const { branches } = useBranch();
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');
    const [selectedBranchName, setSelectedBranchName] = useState<string>('');

    const branchOptions: Option[] = branches.map(b => ({ label: b.name, value: b.id }));

    // Auto-fill branch from GPS hook
    useEffect(() => {
        if (autoFilledBranch && !selectedBranchId) {
            const branch = branches.find(b => b.id === autoFilledBranch);
            if (branch) {
                setSelectedBranchId(branch.id);
                setSelectedBranchName(branch.name);
            }
        }
    }, [autoFilledBranch, branches, selectedBranchId]);

    // ── Vehicle / Customer search hook ────────────────────────────────────────
    const {
        customerOptions,
        vehicleOptions,
        chassisOptions,
        selectedCustomer,
        selectedVehicle,
        loadingCustomers,
        loadingVehicles,
        searchCustomers,
        onSelectCustomer,
        searchVehicles,
        searchByChassis,
        onSelectVehicle,
        onSelectChassis,
        clearAll,
    } = useJobCardVehicleSearch();

    const [mobileDisplay, setMobileDisplay] = useState('');
    const [vehicleDisplay, setVehicleDisplay] = useState('');
    const [chassisDisplay, setChassisDisplay] = useState('');

    // Pre-fill for edit mode
    useEffect(() => {
        if (isEdit && editJobCard) {
            setSelectedBranchId(editJobCard.branch?.id || '');
            setSelectedBranchName(editJobCard.branch?.name || '');
            setMobileDisplay(editJobCard.customerPhone || '');
            setVehicleDisplay(editJobCard.vehicle?.registerNo || '');
            setChassisDisplay(editJobCard.vehicle?.chassisNo || '');
            setKms(String(editJobCard.kms || ''));
            setServiceType(editJobCard.serviceType || '');
            setServiceNumber(editJobCard.serviceNo || '');
            setCouponNumber(editJobCard.couponNo || '');
            if (editJobCard.complaint?.length) {
                setComplaints(editJobCard.complaint.map((c: any, idx: number) => ({
                    id: idx + 1, text: c.complaint,
                })));
            }
            if (editJobCard.parts) {
                setMirrorRH(editJobCard.parts.MirrorRH || false);
                setMirrorLH(editJobCard.parts.MirrorLH || false);
                setToolkit(editJobCard.parts.Toolkit || false);
                setFirstAidKit(editJobCard.parts.FirstAdKit || false);
            }
            setFuelLevel(String(editJobCard.fuelLevel || ''));
        }
    }, [isEdit, editJobCard]);

    // ── Step 1 state ──────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<Step1Tab>('Complaints');
    const [kms, setKms] = useState('');
    const [serviceType, setServiceType] = useState('');
    const [serviceNumber, setServiceNumber] = useState('');
    const [couponNumber, setCouponNumber] = useState('');
    const [complaints, setComplaints] = useState<Complaint[]>([
        { id: 1, text: '' }, { id: 2, text: '' },
    ]);
    const [showOptional, setShowOptional] = useState(false);
    const [mirrorRH, setMirrorRH] = useState(false);
    const [mirrorLH, setMirrorLH] = useState(false);
    const [toolkit, setToolkit] = useState(false);
    const [firstAidKit, setFirstAidKit] = useState(false);
    const [fuelLevel, setFuelLevel] = useState('');

    // ── Service History state ─────────────────────────────────────────────────
    const [historySubTab, setHistorySubTab] = useState<ServiceHistorySubTab>('Parts Details');
    const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
    const [serviceHistory, setServiceHistory] = useState<ServiceHistoryItem[]>([]);
    const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Fetch service history when vehicle is selected and history tab is opened
    const fetchServiceHistory = useCallback(async () => {
        const vehicleId = selectedVehicle?.id || editJobCard?.vehicle?.id;
        if (!vehicleId) return;
        setHistoryLoading(true);
        try {
            const dateTime = editJobCard?.createdAt || new Date().toISOString();
            const res = await getJobCardServiceHistory(vehicleId, dateTime);
            const { data } = res;
            if (data?.code === 200 && data?.response?.code === 200) {
                setServiceHistory(data.response.data.History || []);
                setInvoices(data.response.data.Invoice || []);
            }
        } catch (err) {
            console.error('fetchServiceHistory error:', err);
        } finally {
            setHistoryLoading(false);
        }
    }, [selectedVehicle, editJobCard]);

    useEffect(() => {
        if (activeTab === 'Service History') {
            fetchServiceHistory();
        }
    }, [activeTab, fetchServiceHistory]);

    // ── Service type options ──────────────────────────────────────────────────
    const serviceTypeOptions: Option[] = ALL_SERVICE_TYPES.map(s => ({ label: s, value: s }));

    // Coupon/Service No required for Free, Paid (UW), AMC
    const couponRequired = ['Free', 'Paid (UW)', 'AMC'].includes(serviceType);

    // ── Complaint helpers ─────────────────────────────────────────────────────
    const addComplaint = () => setComplaints(prev => [...prev, { id: prev.length + 1, text: '' }]);
    const removeComplaint = (id: number) => {
        if (complaints.length > 1) setComplaints(prev => prev.filter(c => c.id !== id));
    };
    const updateComplaint = (id: number, text: string) =>
        setComplaints(prev => prev.map(c => c.id === id ? { ...c, text } : c));

    // ── Clear vehicle info ────────────────────────────────────────────────────
    const handleClear = () => {
        setSelectedBranchId('');
        setSelectedBranchName('');
        setMobileDisplay('');
        setVehicleDisplay('');
        setChassisDisplay('');
        clearAll();
    };

    // ── Validate & Save ───────────────────────────────────────────────────────
    const handleNext = async () => {
        if (step === 0) {
            if (!selectedVehicle && !editJobCard) {
                Alert.alert('Required', 'Please select a Vehicle.');
                return;
            }
            setStep(1);
        } else {
            // Validate
            const validComplaints = complaints.filter(c => c.text.trim() !== '');
            if (validComplaints.length === 0) {
                Alert.alert('Required', 'At least one complaint is required.');
                return;
            }
            if (!kms) { Alert.alert('Required', 'Please enter KMs.'); return; }
            if (!serviceType) { Alert.alert('Required', 'Please select a Service Type.'); return; }
            if (couponRequired && !serviceNumber) { Alert.alert('Required', 'Service Number is required for this service type.'); return; }
            if (couponRequired && !couponNumber) { Alert.alert('Required', 'Coupon Number is required for this service type.'); return; }

            setSaving(true);
            try {
                const vehicle = selectedVehicle || editJobCard?.vehicle;
                const customer = selectedCustomer || editJobCard?.customer;

                const payload: any = {
                    branch: selectedBranchId,
                    cusId: customer?.id,
                    dateTime: new Date().toISOString(),
                    selectVehicle: vehicle,
                    Vehicle: vehicle ? [vehicle] : [],
                    customer,
                    customerPhone: mobileDisplay || customer?.contacts?.[0]?.phone || '',
                    kms: Number(kms),
                    serviceType,
                    serviceNo: serviceNumber || undefined,
                    couponNo: couponNumber || undefined,
                    complaintList: complaints.map(c => ({ complaint: c.text, id: '' })),
                    complaint: validComplaints.map(c => ({ complaint: c.text, id: '' })),
                    fuelLevel: fuelLevel ? Number(fuelLevel) : undefined,
                    parts: {
                        MirrorRH: mirrorRH,
                        MirrorLH: mirrorLH,
                        Toolkit: toolkit,
                        FirstAdKit: firstAidKit,
                    },
                    vehicleImage: {},
                    accidentalDocuments: [],
                };

                let res;
                if (isEdit) {
                    res = await updateJobCard(editJobCard.id, { ...payload, id: editJobCard.id });
                } else {
                    res = await createJobCard(payload);
                }

                const { data } = res;
                if (data?.code === 200 && data?.response?.code === 200) {
                    Alert.alert('Success', isEdit ? 'Job Card updated!' : 'Job Card created!', [
                        { text: 'OK', onPress: () => navigation.goBack() },
                    ]);
                } else {
                    Alert.alert('Error', 'Failed to save Job Card. Please try again.');
                }
            } catch (err) {
                console.error('Save job card error:', err);
                Alert.alert('Error', 'Failed to save Job Card. Please try again.');
            } finally {
                setSaving(false);
            }
        }
    };

    // ── Checkbox ──────────────────────────────────────────────────────────────
    const Checkbox = ({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) => (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="flex-row items-center mb-3">
            <View className={`w-5 h-5 rounded border items-center justify-center mr-2 ${checked ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300'}`}>
                {checked && <Check size={12} color="white" />}
            </View>
            <Text className="text-sm text-gray-700">{label}</Text>
        </TouchableOpacity>
    );

    // ────────────────────────────────────────────────────────────────────────
    // STEP 0 – Vehicle Selection
    // ────────────────────────────────────────────────────────────────────────
    const vehicleInfo = selectedVehicle || editJobCard?.vehicle;
    const insuranceDate = vehicleInfo?.insuranceExpiryDate
        ? moment(vehicleInfo.insuranceExpiryDate)
        : null;
    const daysToExpiry = insuranceDate ? insuranceDate.diff(moment(), 'days') : null;
    const insuranceExpiringSoon = daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= 30;

    const renderStep0 = () => (
        <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                {/* Section header + Clear */}
                <View className="flex-row items-center justify-between mb-4 pb-2 border-b border-gray-100">
                    <Text className="text-gray-900 font-bold text-base">Vehicle Information</Text>
                    <TouchableOpacity
                        onPress={handleClear}
                        activeOpacity={0.7}
                        className="flex-row items-center gap-1 px-3 py-1 border border-red-400 rounded-lg"
                    >
                        <X size={13} color="#EF4444" />
                        <Text className="text-red-500 text-xs font-semibold">Clear</Text>
                    </TouchableOpacity>
                </View>

                {/* Branch */}
                <View className="mb-4">
                    <FormLabel label="Branch" required />
                    <DropdownField
                        placeholder="Select Branch"
                        value={selectedBranchId}
                        options={branchOptions}
                        onChange={(v) => {
                            setSelectedBranchId(v);
                            setSelectedBranchName(branchOptions.find(b => b.value === v)?.label || '');
                        }}
                    />
                </View>

                {/* Mobile No — searchable */}
                <View className="mb-4">
                    <FormLabel label="Mobile No." required />
                    <SearchableDropdown
                        placeholder="Search Customer Mobile"
                        displayValue={mobileDisplay}
                        options={customerOptions.map(c => ({
                            label: `${c.name} - ${c.contacts?.[0]?.phone || ''}`,
                            value: c.id,
                        }))}
                        onSearch={searchCustomers}
                        onSelect={(id, label) => {
                            const customer = customerOptions.find(c => c.id === id);
                            if (customer) {
                                onSelectCustomer(customer);
                                setMobileDisplay(customer.contacts?.[0]?.phone || label);
                            }
                        }}
                        loading={loadingCustomers}
                    />
                    {selectedCustomer && (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('UpdateCustomer', {
                                customerId: selectedCustomer.id,
                                customerName: selectedCustomer.name,
                                mobileNo: selectedCustomer.contacts?.[0]?.phone || mobileDisplay,
                            })}
                            className="mt-3 h-11 bg-teal-600 rounded-lg items-center justify-center"
                            activeOpacity={0.8}
                        >
                            <Text className="text-white font-semibold text-sm">Update Customer</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Vehicle No — searchable */}
                <View className="mb-4">
                    <FormLabel label="Vehicle No." required />
                    <SearchableDropdown
                        placeholder="Search Vehicle No."
                        displayValue={vehicleDisplay}
                        options={vehicleOptions.map(v => ({
                            label: v.registerNo,
                            value: v.id,
                        }))}
                        onSearch={searchVehicles}
                        onSelect={async (id, label) => {
                            setVehicleDisplay(label);
                            const vehicle = await onSelectVehicle(id);
                            if (vehicle) {
                                setChassisDisplay(vehicle.chassisNo || '');
                            }
                        }}
                        loading={loadingVehicles}
                    />
                </View>

                {/* Chassis No — searchable, auto-filled after vehicle selection */}
                <View>
                    <FormLabel label="Chassis No." />
                    <SearchableDropdown
                        placeholder="Search Chassis No."
                        displayValue={chassisDisplay}
                        options={chassisOptions.map(v => ({
                            label: v.chassisNo,
                            value: v.id,
                        }))}
                        onSearch={searchByChassis}
                        onSelect={async (id, label) => {
                            setChassisDisplay(label);
                            const vehicle = await onSelectChassis(id);
                            if (vehicle) {
                                setVehicleDisplay(vehicle.registerNo || '');
                            }
                        }}
                        loading={loadingVehicles}
                    />
                </View>
            </View>

            {/* Vehicle Details (shown when vehicle selected) */}
            {vehicleInfo && (
                <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                    <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                        Vehicle Details
                    </Text>

                    {/* Color badge */}
                    {vehicleInfo.color?.colorCode && (
                        <View className="bg-gray-700 self-start px-3 py-1 rounded-lg mb-4">
                            <Text className="text-white text-xs font-semibold">
                                Color Code: {vehicleInfo.color.colorCode}
                            </Text>
                        </View>
                    )}

                    {[
                        { label: 'Model', value: vehicleInfo.vehicle?.modelName },
                        { label: 'Vehicle No', value: vehicleInfo.registerNo },
                        { label: 'Chassis No', value: vehicleInfo.chassisNo },
                        { label: 'Engine No', value: vehicleInfo.engineNo },
                        { label: 'Battery No', value: vehicleInfo.batteryNo },
                    ].map(({ label, value }) => value ? (
                        <View key={label} className="mb-4">
                            <FormLabel label={label} />
                            <ReadOnlyField value={value} />
                        </View>
                    ) : null)}

                    {/* Insurance expiry — red if ≤30 days */}
                    {insuranceDate && (
                        <View className="mb-4">
                            <FormLabel label="Insurance Expiry" />
                            <View className={`h-12 border rounded-lg px-3 justify-center ${insuranceExpiringSoon ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                                <Text className={insuranceExpiringSoon ? 'text-red-600 font-bold' : 'text-gray-800'}>
                                    {insuranceDate.format('DD-MM-YYYY')}
                                    {insuranceExpiringSoon ? `  ⚠️ Expiring in ${daysToExpiry} days` : ''}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            )}

            {/* Footer */}
            <View className="flex-row gap-3">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="flex-1 h-12 border border-gray-300 rounded-lg items-center justify-center"
                    activeOpacity={0.8}
                >
                    <Text className="text-gray-700 font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleNext}
                    className="flex-1 h-12 bg-teal-600 rounded-lg items-center justify-center"
                    activeOpacity={0.8}
                >
                    <Text className="text-white font-semibold">Next</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    // ────────────────────────────────────────────────────────────────────────
    // STEP 1 – Complaints Tab
    // ────────────────────────────────────────────────────────────────────────
    const renderComplaintsTab = () => (
        <View>
            <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                    Service Details
                </Text>

                <View className="mb-4">
                    <FormLabel label="Kms" required />
                    <TextInput
                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                        placeholder="e.g. 2000"
                        value={kms}
                        onChangeText={setKms}
                        keyboardType="numeric"
                    />
                </View>

                <View className="mb-4">
                    <FormLabel label="Service Type" required />
                    <DropdownField
                        placeholder="Select Service Type"
                        value={serviceType}
                        options={serviceTypeOptions}
                        onChange={setServiceType}
                    />
                </View>

                <View className="mb-4">
                    <FormLabel label={`Service Number${couponRequired ? ' *' : ''}`} />
                    <TextInput
                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                        placeholder="Service No."
                        value={serviceNumber}
                        onChangeText={setServiceNumber}
                        maxLength={2}
                        keyboardType="numeric"
                    />
                </View>

                <View>
                    <FormLabel label={`Service Coupon Number${couponRequired ? ' *' : ''}`} />
                    <TextInput
                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                        placeholder="Coupon No."
                        value={couponNumber}
                        onChangeText={setCouponNumber}
                    />
                </View>
            </View>

            {/* Complaints table */}
            <View className="bg-white rounded-xl border border-gray-100 mb-4 overflow-hidden">
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                    <Text className="text-gray-900 font-bold text-base">Complaints</Text>
                    <TouchableOpacity onPress={addComplaint} activeOpacity={0.7} className="p-1">
                        <Plus size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
                <View className="bg-gray-600 px-4 py-2 flex-row">
                    <Text className="text-sm font-medium text-white w-10">No.</Text>
                    <Text className="text-sm font-medium text-white flex-1">Complaint</Text>
                    <Text className="text-sm font-medium text-white w-10 text-right">Del.</Text>
                </View>
                {complaints.map((c, idx) => (
                    <View key={c.id} className={`flex-row px-4 py-3 border-b border-gray-50 ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                        <Text className="text-sm font-medium text-gray-700 w-10 mt-2">{c.id}</Text>
                        <TextInput
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 min-h-[56px]"
                            placeholder="Enter complaint..."
                            value={c.text}
                            onChangeText={(t) => updateComplaint(c.id, t)}
                            multiline
                            textAlignVertical="top"
                        />
                        <TouchableOpacity onPress={() => removeComplaint(c.id)} className="ml-3 mt-2 p-1 w-10 items-end" activeOpacity={0.7}>
                            <Trash2 size={18} color={COLORS.red?.[600] || '#DC2626'} />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            {/* Optional section */}
            <View className="bg-white rounded-xl border border-gray-100 mb-4 overflow-hidden">
                <TouchableOpacity
                    onPress={() => setShowOptional(!showOptional)}
                    className="flex-row items-center justify-between px-4 py-4"
                    activeOpacity={0.7}
                >
                    <Text className="text-gray-900 font-bold text-base">Optional</Text>
                    <ChevronRight
                        size={18}
                        color={COLORS.gray[500]}
                        style={{ transform: [{ rotate: showOptional ? '90deg' : '0deg' }] }}
                    />
                </TouchableOpacity>

                {showOptional && (
                    <View className="border-t border-gray-100 p-4">
                        <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                            Upload Images
                        </Text>
                        <View className="flex-row flex-wrap gap-3 mb-6">
                            {['Front View', 'RHS View', 'Rear View', 'LHS View', 'Top View', 'Additional'].map(label => (
                                <View key={label} className="border border-gray-300 rounded-lg p-3 bg-white w-[48%]">
                                    <View className="w-full h-14 items-center justify-center mb-2">
                                        <Camera size={28} color={COLORS.gray[400]} />
                                    </View>
                                    <Text className="text-xs text-center text-gray-600 mb-2">{label}</Text>
                                    <TouchableOpacity className="w-full py-1 border border-teal-600 rounded items-center">
                                        <Text className="text-xs text-teal-600">+ Upload</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>

                        <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                            Checklist
                        </Text>
                        <View className="flex-row flex-wrap mb-4">
                            <View className="w-1/2"><Checkbox checked={mirrorRH} onPress={() => setMirrorRH(!mirrorRH)} label="Mirror RH" /></View>
                            <View className="w-1/2"><Checkbox checked={mirrorLH} onPress={() => setMirrorLH(!mirrorLH)} label="Mirror LH" /></View>
                            <View className="w-1/2"><Checkbox checked={toolkit} onPress={() => setToolkit(!toolkit)} label="Toolkit" /></View>
                            <View className="w-1/2"><Checkbox checked={firstAidKit} onPress={() => setFirstAidKit(!firstAidKit)} label="First Aid Kit" /></View>
                        </View>

                        <View>
                            <FormLabel label="Fuel Level" />
                            <View className="flex-row items-center border border-gray-300 bg-white rounded-lg px-3 h-12">
                                <TextInput
                                    className="flex-1 text-gray-800 text-sm"
                                    placeholder="Fuel level"
                                    value={fuelLevel}
                                    onChangeText={setFuelLevel}
                                    keyboardType="numeric"
                                />
                                <Text className="text-gray-400 text-sm ml-2">%</Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );

    // ────────────────────────────────────────────────────────────────────────
    // STEP 1 – Service History Tab (real API data)
    // ────────────────────────────────────────────────────────────────────────
    const renderServiceHistoryTab = () => (
        <View>
            {historyLoading && (
                <View className="items-center py-6">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text className="text-gray-500 mt-2">Loading service history...</Text>
                </View>
            )}

            {!historyLoading && serviceHistory.length === 0 && (
                <View className="items-center py-10">
                    <FolderOpen size={40} color={COLORS.gray[300]} strokeWidth={1} />
                    <Text className="text-gray-400 mt-2">No service history found</Text>
                </View>
            )}

            {serviceHistory.map((item) => {
                const invoice = invoices.find(inv => inv.jobOrder?.jobNo === item.jobNo);
                const parts = invoice?.saleItemInvoice?.filter(s => s.partNumber !== null && s.jobCode === null) || [];
                const labour = invoice?.saleItemInvoice?.filter(s => s.jobCode !== null && s.partNumber === null) || [];
                const isExpanded = expandedHistory === item.id;

                return (
                    <View key={item.id} className="bg-white rounded-xl border border-gray-100 mb-3 overflow-hidden">
                        <View className="p-4">
                            <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                                {item.jobNo}
                            </Text>

                            <View className="flex-row flex-wrap">
                                <View className="w-1/2 pr-3">
                                    {[
                                        { label: 'Service Type', value: item.serviceType },
                                        { label: 'Kms', value: String(item.kms || '-') },
                                        { label: 'Job Date', value: item.createdAt ? moment(item.createdAt).format('DD/MM/YYYY') : '-' },
                                        { label: 'Branch', value: item.branch?.name || '-' },
                                        { label: 'Mechanic', value: item.mechanic?.profile?.employeeName || '-' },
                                    ].map(f => (
                                        <View key={f.label} className="mb-3">
                                            <FormLabel label={f.label} />
                                            <ReadOnlyField value={f.value} />
                                        </View>
                                    ))}
                                </View>
                                <View className="w-1/2 pl-3">
                                    {[
                                        { label: 'Customer Name', value: item.customer?.name || '-' },
                                        { label: 'Customer Phone', value: item.customerPhone || '-' },
                                        { label: 'Register No.', value: item.vehicle?.registerNo || '-' },
                                    ].map(f => (
                                        <View key={f.label} className="mb-3">
                                            <FormLabel label={f.label} />
                                            <ReadOnlyField value={f.value} />
                                        </View>
                                    ))}
                                    <TouchableOpacity
                                        className="flex-row items-center gap-2 px-4 py-2 bg-teal-600 rounded-lg self-start mt-1"
                                        activeOpacity={0.8}
                                        onPress={() => Linking.openURL(`${ENDPOINT}${getJobCardPDFUrl(item.id)}`)}
                                    >
                                        <Download size={14} color="white" />
                                        <Text className="text-white text-xs font-semibold">PDF</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {invoice && (
                                <View className="mt-3 pt-3 border-t border-gray-100">
                                    <Text className="text-sm font-bold text-gray-800 text-right">
                                        Total Invoice: ₹{invoice.totalInvoice} /-
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Expand/Collapse */}
                        <TouchableOpacity
                            onPress={() => setExpandedHistory(isExpanded ? null : item.id)}
                            className="flex-row items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100"
                            activeOpacity={0.7}
                        >
                            <Text className="text-sm text-gray-600">Details</Text>
                            <ChevronDown
                                size={16}
                                color={COLORS.gray[400]}
                                style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
                            />
                        </TouchableOpacity>

                        {isExpanded && (
                            <View className="border-t border-gray-100">
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    className="bg-white border-b border-gray-200"
                                    contentContainerStyle={{ paddingHorizontal: 8 }}
                                >
                                    {(['Parts Details', 'Labour Detail'] as ServiceHistorySubTab[]).map(tab => (
                                        <TouchableOpacity
                                            key={tab}
                                            onPress={() => setHistorySubTab(tab)}
                                            className={`px-4 py-4 border-b-2 ${historySubTab === tab ? 'border-teal-600' : 'border-transparent'}`}
                                        >
                                            <Text className={`text-xs font-bold ${historySubTab === tab ? 'text-teal-600' : 'text-gray-600'}`}>
                                                {tab}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <View className="p-3">
                                    {historySubTab === 'Parts Details' ? (
                                        <ScrollableTable
                                            headers={['Part No.', 'Part Name', 'Qty', 'Unit Rate', 'Amount']}
                                            minWidth={500}
                                            isEmpty={parts.length === 0}
                                            emptyText="No Parts"
                                        >
                                            {parts.map((p, i) => (
                                                <View key={i} className={`flex-row px-3 py-2 border-b border-gray-50 ${i % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                                                    <Text className="text-xs text-gray-700 flex-1">{p.partNumber?.partNumber || '-'}</Text>
                                                    <Text className="text-xs text-gray-700 flex-1">{p.partNumber?.partName || '-'}</Text>
                                                    <Text className="text-xs text-gray-700 flex-1">{p.quantity}</Text>
                                                    <Text className="text-xs text-gray-700 flex-1">₹{p.unitRate}</Text>
                                                    <Text className="text-xs text-gray-700 flex-1">₹{p.rate}</Text>
                                                </View>
                                            ))}
                                        </ScrollableTable>
                                    ) : (
                                        <ScrollableTable
                                            headers={['Job Code', 'Qty', 'Unit Rate', 'Amount']}
                                            minWidth={400}
                                            isEmpty={labour.length === 0}
                                            emptyText="No Labour"
                                        >
                                            {labour.map((l, i) => (
                                                <View key={i} className={`flex-row px-3 py-2 border-b border-gray-50 ${i % 2 ? 'bg-gray-50' : 'bg-white'}`}>
                                                    <Text className="text-xs text-gray-700 flex-1">{l.jobCode?.code || '-'}</Text>
                                                    <Text className="text-xs text-gray-700 flex-1">{l.quantity}</Text>
                                                    <Text className="text-xs text-gray-700 flex-1">₹{l.unitRate}</Text>
                                                    <Text className="text-xs text-gray-700 flex-1">₹{l.rate}</Text>
                                                </View>
                                            ))}
                                        </ScrollableTable>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );

    // ────────────────────────────────────────────────────────────────────────
    // STEP 1 – Documents Tab
    // ────────────────────────────────────────────────────────────────────────
    const renderDocumentsTab = () => (
        <View>
            <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                Model Documents
            </Text>
            <View className="mb-6">
                <ScrollableTable headers={['Name', 'Type', 'Actions']} minWidth={400} isEmpty emptyText="No Data" />
            </View>
            <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                Insurance Documents
            </Text>
            <View className="mb-6">
                <ScrollableTable headers={['Insurer', 'Policy No', 'Type', 'Valid From', 'Valid To', 'Actions']} minWidth={700} isEmpty emptyText="No Data" />
            </View>
        </View>
    );

    // ────────────────────────────────────────────────────────────────────────
    // STEP 1 render
    // ────────────────────────────────────────────────────────────────────────
    const renderStep1 = () => (
        <View className="flex-1">
            <View className="bg-white border-b border-gray-200 flex-row w-full">
                {(['Complaints', 'Service History', 'Documents'] as Step1Tab[]).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        className={`flex-1 py-4 border-b-2 items-center justify-center ${activeTab === tab ? 'border-teal-600' : 'border-transparent'}`}
                    >
                        <Text className={`text-xs font-bold ${activeTab === tab ? 'text-teal-600' : 'text-gray-600'}`}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                    {activeTab === 'Complaints' && renderComplaintsTab()}
                    {activeTab === 'Service History' && renderServiceHistoryTab()}
                    {activeTab === 'Documents' && renderDocumentsTab()}
                </View>

                <View className="flex-row gap-3">
                    <TouchableOpacity
                        onPress={() => setStep(0)}
                        className="flex-1 h-12 border border-gray-300 rounded-lg items-center justify-center"
                        activeOpacity={0.8}
                    >
                        <Text className="text-gray-700 font-semibold">Previous</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleNext}
                        disabled={saving}
                        className="flex-1 h-12 bg-teal-600 rounded-lg items-center justify-center"
                        activeOpacity={0.8}
                    >
                        {saving
                            ? <ActivityIndicator size="small" color="white" />
                            : <Text className="text-white font-semibold">{isEdit ? 'Update' : 'Save'}</Text>
                        }
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );

    // ────────────────────────────────────────────────────────────────────────
    // ROOT
    // ────────────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <HeaderWithBack
                title={step === 0 ? (isEdit ? 'Edit Job Order' : 'Add Job Order') : 'Job Order Details'}
                subtitle={step === 0 ? 'Step 1 of 2 – Vehicle' : 'Step 2 of 2 – Complaints & Docs'}
                onBackPress={() => step === 1 ? setStep(0) : navigation.goBack()}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                {step === 0 ? renderStep0() : renderStep1()}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
