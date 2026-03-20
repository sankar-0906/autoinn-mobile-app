import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Modal,
    Pressable,
    ActivityIndicator,
    Image,
    Alert,
    Linking,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon, { ChevronDown, Check, Plus, Trash2, Camera, X, ChevronRight, FolderOpen, Download,
    Check as CheckIcon, Share2,
} from 'lucide-react-native';
import { SearchableDropdown } from '../../components/ui';
import { Option } from '../../components/ui/SearchableDropdown';
import moment from 'moment';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../constants/colors';
import { HeaderWithBack } from '../../components/ui/BackButton';
import { useBranchAutoFill } from '../../src/hooks/useBranchAutoFill';
import { useBranch } from '../../src/context/branch';
import { useJobCardVehicleSearch } from '../../src/hooks/job-cards/useJobCardVehicleSearch';
import { createJobCard, updateJobCard, getJobCardServiceHistory, getJobCardPDFUrl } from '../../src/api/job-cards/jobCardApi';
import { ENDPOINT, uploadJobOrderImage, deleteVehicleFile, getCustomerDetailsBasic } from '../../src/api';
import { ALL_SERVICE_TYPES } from '../../src/hooks/job-cards/useJobCardFilters';
import type { JobCardComplaint, ServiceHistoryItem, InvoiceItem } from '../../types/job-cards';
import { useFocusEffect } from '@react-navigation/native';
import { savePDFToDevice, sharePDF } from '../../src/utils/pdfDownloadUtils';
import { useToast } from '../../src/ToastContext';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Complaint { id: number; text: string; }
type Step1Tab = 'Complaints' | 'Service History' | 'Documents';
type ServiceHistorySubTab = 'Parts Details' | 'Labour Detail';

// ─── FormLabel ────────────────────────────────────────────────────────────────
const FormLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
    <Text className="text-sm text-gray-600 mb-1 font-medium">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
    </Text>
);

// ─── Static Dropdown ──────────────────────────────────────────────────────────
function DropdownField({ placeholder, value, options, onChange, disabled, readOnly }: {
    placeholder: string; value: string; options: Option[]; onChange: (v: string) => void; disabled?: boolean; readOnly?: boolean;
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

    const isDisabled = disabled || readOnly;

    return (
        <View>
            <TouchableOpacity
                onPress={() => !isDisabled && setOpen(true)}
                activeOpacity={0.7}
                className={`h-12 border rounded-lg px-3 flex-row items-center justify-between ${isDisabled ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
            >
                <Text className={selected && !isDisabled ? 'text-gray-800 flex-1' : 'text-gray-400 flex-1'} numberOfLines={1}>
                    {selected ? selected.label : placeholder}
                </Text>
                {!isDisabled && <ChevronDown size={16} color={COLORS.gray[400]} />}
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
    const toast = useToast();

    const [step, setStep] = useState<0 | 1>(0);
    const [saving, setSaving] = useState(false);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [pdfDownloading, setPdfDownloading] = useState(false);
    const [selectedServiceItem, setSelectedServiceItem] = useState<ServiceHistoryItem | null>(null);

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
        fetchCustomers,
        searchCustomers,
        onSelectCustomer,
        searchVehicles,
        searchByChassis,
        onSelectVehicle,
        onSelectChassis,
        clearAll,
        setSelectedCustomer,
        setCustomerOptions,
    } = useJobCardVehicleSearch();

    const [mobileDisplay, setMobileDisplay] = useState('');
    const [mobileSearchQuery, setMobileSearchQuery] = useState('');
    const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
    const [highlightCustomerId, setHighlightCustomerId] = useState<string | undefined>(undefined);
    const [vehicleDisplay, setVehicleDisplay] = useState('');
    const [chassisDisplay, setChassisDisplay] = useState('');

    // Pre-fill for edit mode
    useEffect(() => {
        if (isEdit && editJobCard) {
            setSelectedBranchId(editJobCard.branch?.id || '');
            setSelectedBranchName(editJobCard.branch?.name || '');
            setMobileDisplay(
                editJobCard.customer?.name && editJobCard.customerPhone
                    ? `${editJobCard.customer.name} - ${editJobCard.customerPhone}`
                    : (editJobCard.customerPhone || editJobCard.customer?.name || '')
            );
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
            if (editJobCard.vehicleImage) {
                setJobImages({
                    front: editJobCard.vehicleImage.frontView ? { name: 'front', uri: editJobCard.vehicleImage.frontView, url: editJobCard.vehicleImage.frontView } : null,
                    rhs: editJobCard.vehicleImage.rhsView ? { name: 'rhs', uri: editJobCard.vehicleImage.rhsView, url: editJobCard.vehicleImage.rhsView } : null,
                    rear: editJobCard.vehicleImage.rearView ? { name: 'rear', uri: editJobCard.vehicleImage.rearView, url: editJobCard.vehicleImage.rearView } : null,
                    lhs: editJobCard.vehicleImage.lhsView ? { name: 'lhs', uri: editJobCard.vehicleImage.lhsView, url: editJobCard.vehicleImage.lhsView } : null,
                    top: editJobCard.vehicleImage.topView ? { name: 'top', uri: editJobCard.vehicleImage.topView, url: editJobCard.vehicleImage.topView } : null,
                });
                if (Array.isArray(editJobCard.vehicleImage.additionalImages)) {
                    setAdditionalImages(
                        editJobCard.vehicleImage.additionalImages.map((img: any, idx: number) => ({
                            name: `additional-${idx + 1}`,
                            uri: img.url,
                            url: img.url,
                        }))
                    );
                }
            }
        }
    }, [isEdit, editJobCard]);

    useFocusEffect(
        useCallback(() => {
            const newlyCreated = route?.params?.newlyCreatedCustomer;
            if (!newlyCreated?.id) return;
            (async () => {
                try {
                    const res = await getCustomerDetailsBasic(newlyCreated.id);
                    const data = res?.data?.response?.data || res?.data?.data || res?.data;
                    if (data) {
                        setSelectedCustomer(data);
                        setCustomerOptions(prev => {
                            if (prev.some(c => c.id === data.id)) return prev;
                            return [data, ...prev];
                        });
                        const phone = data?.contacts?.[0]?.phone || newlyCreated.phone || '';
                        setMobileDisplay(`${data.name || ''} - ${phone}`.trim());
                        setHighlightCustomerId(data.id);
                        setMobileDropdownOpen(true);
                    }
                } catch (err) {
                    console.error('Fetch newly created customer error:', err);
                } finally {
                    navigation.setParams({ newlyCreatedCustomer: undefined });
                }
            })();
        }, [route?.params?.newlyCreatedCustomer])
    );

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
    const [uploadingType, setUploadingType] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [jobImages, setJobImages] = useState<Record<string, { name: string; uri: string; url?: string } | null>>({
        front: null,
        rhs: null,
        rear: null,
        lhs: null,
        top: null,
    });
    const [additionalImages, setAdditionalImages] = useState<Array<{ name: string; uri: string; url?: string }>>([]);

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

    // Auto-fetch service history in edit mode when screen loads
    useEffect(() => {
        if (isEdit && editJobCard?.vehicle?.id) {
            fetchServiceHistory();
        }
    }, [isEdit, editJobCard?.vehicle?.id, fetchServiceHistory]);

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
            // In edit mode, allow navigation without validation since data is pre-filled
            if (isEdit) {
                setStep(1);
                return;
            }
            
            // In create mode, validate vehicle selection
            if (!selectedVehicle) {
                Alert.alert('Required', 'Please select a Vehicle.');
                return;
            }
            setStep(1);
        } else {
            // In edit mode, just navigate back or close on final step
            if (isEdit) {
                navigation.goBack();
                return;
            }
            
            // In create mode, validate and save
            const validComplaints = complaints.filter(c => c.text.trim() !== '');
            if (validComplaints.length === 0) {
                Alert.alert('Required', 'At least one complaint is required.');
                return;
            }
            if (!selectedBranchId) {
                Alert.alert('Required', 'Please select a Branch.');
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
                const rawPhone =
                    selectedCustomer?.contacts?.[0]?.phone ||
                    editJobCard?.customerPhone ||
                    customer?.contacts?.[0]?.phone ||
                    '';
                const customerPhone = rawPhone ? String(rawPhone).replace(/\D/g, '') : '';

                const payload: any = {
                    branch: selectedBranchId,
                    cusId: customer?.id,
                    dateTime: new Date().toISOString(),
                    selectVehicle: vehicle,
                    vehicle,
                    Vehicle: vehicle ? [vehicle] : [],
                    customer,
                    customerPhone,
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
                    vehicleImage: {
                        frontView: jobImages.front?.url || jobImages.front?.uri || null,
                        rhsView: jobImages.rhs?.url || jobImages.rhs?.uri || null,
                        lhsView: jobImages.lhs?.url || jobImages.lhs?.uri || null,
                        rearView: jobImages.rear?.url || jobImages.rear?.uri || null,
                        topView: jobImages.top?.url || jobImages.top?.uri || null,
                        additionalImages: additionalImages.map(img => ({
                            url: img.url || img.uri,
                        })),
                    },
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
                        {
                            text: 'OK',
                            onPress: () =>
                                navigation.navigate('Main', {
                                    screen: 'JobCards',
                                    params: { refresh: true, clearSearch: true },
                                }),
                        },
                    ]);
                } else {
                    const serverMsg =
                        data?.response?.message ||
                        data?.message ||
                        data?.msg ||
                        'Failed to save Job Card. Please try again.';
                    Alert.alert('Error', serverMsg);
                }
            } catch (err) {
                console.error('Save job card error:', err);
                const errMsg =
                    (err as any)?.response?.data?.message ||
                    (err as any)?.response?.data?.msg ||
                    (err as any)?.message ||
                    'Failed to save Job Card. Please try again.';
                Alert.alert('Error', errMsg);
            } finally {
                setSaving(false);
            }
        }
    };

    // ── PDF Download Handlers ───────────────────────────────────────────────────
    const handleDownloadPDF = (item: ServiceHistoryItem) => {
        setSelectedServiceItem(item);
        setShowDownloadModal(true);
    };

    const handleSaveToDevice = async () => {
        if (!selectedServiceItem) return;
        
        setPdfDownloading(true);
        setShowDownloadModal(false);
        
        await savePDFToDevice({
            id: selectedServiceItem.id,
            documentId: selectedServiceItem.jobNo,
            documentType: 'Job Card',
            apiEndpoint: 'jobOrder',
            onSuccess: (message) => toast.success(message),
            onError: (message) => toast.error(message),
        });
        
        setPdfDownloading(false);
    };

    const handleSharePDF = async () => {
        if (!selectedServiceItem) return;
        
        setPdfDownloading(true);
        setShowDownloadModal(false);
        
        await sharePDF({
            id: selectedServiceItem.id,
            documentId: selectedServiceItem.jobNo,
            documentType: 'Job Card',
            apiEndpoint: 'jobOrder',
            onSuccess: (message) => toast.success(message),
            onError: (message) => toast.error(message),
        });
        
        setPdfDownloading(false);
    };

    // ── Checkbox ──────────────────────────────────────────────────────────────
    const Checkbox = ({ checked, onPress, label, disabled }: { checked: boolean; onPress: () => void; label: string; disabled?: boolean }) => (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="flex-row items-center mb-3" disabled={disabled}>
            <View className={`w-5 h-5 rounded border items-center justify-center mr-2 ${checked ? 'bg-teal-600 border-teal-600' : disabled ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}>
                {checked && <Check size={12} color="white" />}
            </View>
            <Text className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}</Text>
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

    const getAbsoluteUrl = (url?: string) => {
        if (!url) return null;
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        const base = ENDPOINT.replace(/\/$/, '');
        return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const resolveImageUri = (img?: { url?: string; uri?: string } | null) => {
        if (!img) return null;
        return getAbsoluteUrl(img.url || img.uri || undefined) || img.uri || null;
    };

    const getVehicleImageUrl = (vehicle: any) => {
        const raw =
            vehicle?.color?.url ||
            vehicle?.image?.[0]?.url ||
            vehicle?.vehicle?.image?.[0]?.url;
        return getAbsoluteUrl(raw || undefined);
    };

    const openPreview = (uri: string | null) => {
        if (!uri) return;
        setPreviewImage(uri);
        setPreviewVisible(true);
    };

    const requestCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        return status === 'granted';
    };

    const requestMediaPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return status === 'granted';
    };

    const uploadJobOrderImageToServer = async (type: string, asset: ImagePicker.ImagePickerAsset) => {
        const jobOrderId =
            editJobCard?.id ||
            selectedVehicle?.id ||
            editJobCard?.vehicle?.id ||
            null;
        if (!jobOrderId) {
            Alert.alert('Select Vehicle', 'Please select a vehicle before uploading images.');
            return;
        }

        try {
            setUploadingType(type);
            const formData = new FormData();
            const name = asset.fileName || asset.uri.split('/').pop() || `image-${Date.now()}.jpg`;
            const mimeType = asset.mimeType || 'image/jpeg';

            formData.append('profile', { uri: asset.uri, name, type: mimeType } as any);
            formData.append('master', 'Transaction Master');
            formData.append('module', 'Job Order');
            formData.append('id', String(jobOrderId));
            formData.append('type', type);

            const response = await uploadJobOrderImage(formData);
            const url = response?.data?.response?.data?.Location;
            if (!url) {
                throw new Error('Upload failed');
            }

            const uploaded = { name, uri: url, url };
            if (type === 'additional') {
                setAdditionalImages(prev => [...prev, uploaded]);
            } else {
                setJobImages(prev => ({ ...prev, [type]: uploaded }));
            }
        } catch (err) {
            console.error('Job order image upload error:', err);
            Alert.alert('Upload Failed', 'Unable to upload image. Please try again.');
        } finally {
            setUploadingType(null);
        }
    };

    const pickImage = async (type: string, source: 'camera' | 'gallery') => {
        const allowed = source === 'camera' ? await requestCameraPermission() : await requestMediaPermission();
        if (!allowed) {
            Alert.alert('Permission Required', 'Please allow access to continue.');
            return;
        }

        const result = source === 'camera'
            ? await ImagePicker.launchCameraAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images })
            : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });

        if (result.canceled) return;
        const asset = result.assets?.[0];
        if (!asset) return;
        await uploadJobOrderImageToServer(type, asset);
    };

    const handleUploadPress = (type: string) => {
        Alert.alert('Upload Image', 'Choose a source', [
            { text: 'Camera', onPress: () => pickImage(type, 'camera') },
            { text: 'Gallery', onPress: () => pickImage(type, 'gallery') },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleRemoveImage = async (type: string) => {
        const img = jobImages[type];
        if (!img?.url) {
            setJobImages(prev => ({ ...prev, [type]: null }));
            return;
        }
        try {
            await deleteVehicleFile({ url: img.url });
        } catch (err) {
            console.error('Delete job order image error:', err);
        } finally {
            setJobImages(prev => ({ ...prev, [type]: null }));
        }
    };

    const handleRemoveAdditionalImage = async (index: number, img: { url?: string }) => {
        try {
            if (img?.url) {
                await deleteVehicleFile({ url: img.url });
            }
        } catch (err) {
            console.error('Delete additional image error:', err);
        } finally {
            setAdditionalImages(prev => prev.filter((_, i) => i !== index));
        }
    };

    const formatDateOfSale = (value?: any) => {
        if (!value) return '-';
        let dateString = '';
        if (typeof value === 'string') dateString = value;
        else if (value?.date || value?.$date) dateString = value.date || value.$date;
        else if (value instanceof Date) dateString = value.toISOString();
        if (!dateString) return '-';
        const m = moment(dateString);
        return m.isValid() ? m.format('DD-MM-YYYY') : '-';
    };

    const formatMfg = (value?: any) => {
        if (!value) return '-';
        let dateString = '';
        if (typeof value === 'string') dateString = value;
        else if (value?.date || value?.$date) dateString = value.date || value.$date;
        else if (value instanceof Date) dateString = value.toISOString();
        if (!dateString) return '-';
        const monthYearPattern = /^(0[1-9]|1[0-2])[-/](\d{4})$/;
        if (monthYearPattern.test(dateString)) return dateString.replace('/', '-');
        const m = moment(dateString, ['MM-YYYY', 'MM/YYYY', 'MMM-YYYY', 'MMM YYYY', moment.ISO_8601], true);
        if (m.isValid()) return m.format('MM-YYYY');
        const fallback = moment(dateString);
        return fallback.isValid() ? fallback.format('MM-YYYY') : '-';
    };

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
                        readOnly={isEdit}
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
                        open={mobileDropdownOpen}
                        onOpenChange={(open) => setMobileDropdownOpen(open)}
                        highlightValue={highlightCustomerId}
                        disabled={isEdit}
                        onSearch={(q) => {
                            setMobileSearchQuery(q);
                            searchCustomers(q);
                        }}
                        onOpen={() => {
                            fetchCustomers();
                            setMobileDropdownOpen(true);
                        }}
                        onSelect={(id, label) => {
                            const customer = customerOptions.find(c => c.id === id);
                            if (customer) {
                                onSelectCustomer(customer);
                                setMobileDisplay(label);
                                setMobileSearchQuery('');
                                setHighlightCustomerId(undefined);
                            }
                        }}
                        loading={loadingCustomers}
                        renderEmpty={(close) => {
                            const digits = mobileSearchQuery.replace(/\D/g, '');
                            const canAdd = digits.length >= 10;
                            return (
                                <View>
                                    {!canAdd && (
                                        <Text className="text-gray-400 text-sm text-center py-2">
                                            No results found
                                        </Text>
                                    )}
                                    {canAdd && (
                                        <TouchableOpacity
                                            onPress={() => {
                                                close();
                                                navigation.navigate('UpdateCustomer', {
                                                    mobileNo: digits,
                                                    customerName: '',
                                                    customerId: '',
                                                });
                                            }}
                                            className="mt-2 h-11 bg-teal-600 rounded-lg items-center justify-center"
                                            activeOpacity={0.8}
                                        >
                                            <Text className="text-white font-semibold text-sm">Add Customer</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        }}
                    />
                    {selectedCustomer && (() => {
                        const primaryContact = selectedCustomer.contacts?.[0];
                        const needsUpdate = !selectedCustomer.name || primaryContact?.valid === false;
                        if (!needsUpdate) return null;
                        return (
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
                        );
                    })()}
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
                        disabled={isEdit}
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
                        disabled={isEdit}
                    />
                </View>
            </View>

            {/* Vehicle Details (shown when vehicle selected) */}
            {vehicleInfo && (
                <View className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                    <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                        Vehicle Details
                    </Text>

                    {/* Vehicle Image */}
                    {getVehicleImageUrl(vehicleInfo) && (
                        <View className="items-center mb-4">
                            <Image
                                source={{ uri: getVehicleImageUrl(vehicleInfo) as string }}
                                style={{ width: 160, height: 110, borderRadius: 8 }}
                                resizeMode="contain"
                            />
                        </View>
                    )}

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
                        {
                            label: 'Date of Sale',
                            value: formatDateOfSale(
                                (vehicleInfo as any)?.dateOfSale ?? (vehicleInfo as any)?.vehicle?.dateOfSale
                            ),
                        },
                        {
                            label: 'MFG (MM-YYYY)',
                            value: formatMfg(
                                (vehicleInfo as any)?.mfg ??
                                (vehicleInfo as any)?.mfgDate ??
                                (vehicleInfo as any)?.vehicle?.mfg ??
                                (vehicleInfo as any)?.vehicle?.mfgDate
                            ),
                        },
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
                    <Text className="text-white font-semibold">{step === 0 ? 'Next' : (isEdit ? 'Close' : 'Save')}</Text>
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
                        className={`h-12 border rounded-lg px-3 text-gray-800 ${isEdit ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
                        placeholder="e.g. 2000"
                        value={kms}
                        onChangeText={setKms}
                        keyboardType="numeric"
                        editable={!isEdit}
                    />
                </View>

                <View className="mb-4">
                    <FormLabel label="Service Type" required />
                    <DropdownField
                        placeholder="Select Service Type"
                        value={serviceType}
                        options={serviceTypeOptions}
                        onChange={setServiceType}
                        readOnly={isEdit}
                    />
                </View>

                <View className="mb-4">
                    <FormLabel label={`Service Number${couponRequired ? ' *' : ''}`} />
                    <TextInput
                        className={`h-12 border rounded-lg px-3 text-gray-800 ${isEdit ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
                        placeholder="Service No."
                        value={serviceNumber}
                        onChangeText={setServiceNumber}
                        maxLength={2}
                        keyboardType="numeric"
                        editable={!isEdit}
                    />
                </View>

                <View>
                    <FormLabel label={`Service Coupon Number${couponRequired ? ' *' : ''}`} />
                    <TextInput
                        className={`h-12 border rounded-lg px-3 text-gray-800 ${isEdit ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}
                        placeholder="Coupon No."
                        value={couponNumber}
                        onChangeText={setCouponNumber}
                        editable={!isEdit}
                    />
                </View>
            </View>

            {/* Complaints table */}
            <View className="bg-white rounded-xl border border-gray-100 mb-4 overflow-hidden">
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                    <Text className="text-gray-900 font-bold text-base">Complaints</Text>
                    {!isEdit && (
                        <TouchableOpacity onPress={addComplaint} activeOpacity={0.7} className="p-1">
                            <Plus size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                    )}
                </View>
                <View className="bg-gray-600 px-4 py-2 flex-row">
                    <Text className="text-sm font-medium text-white w-10">No.</Text>
                    <Text className="text-sm font-medium text-white flex-1">Complaint</Text>
                    <Text className="text-sm font-medium text-white w-10 text-right">Del.</Text>
                </View>
                {complaints.map((c, idx) => (
                    <View key={c.id} className={`flex-row px-4 py-3 border-b border-gray-50 ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                        <Text className="text-sm font-medium text-gray-700 w-10 mt-2">{c.id}</Text>
                        {isEdit ? (
                            <View className="flex-1 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 min-h-[56px] justify-center">
                                <Text className="text-sm text-gray-800">{c.text || 'No complaint entered'}</Text>
                            </View>
                        ) : (
                            <TextInput
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 min-h-[56px]"
                                placeholder="Enter complaint..."
                                value={c.text}
                                onChangeText={(t) => updateComplaint(c.id, t)}
                                multiline
                                textAlignVertical="top"
                            />
                        )}
                        {!isEdit && (
                            <TouchableOpacity onPress={() => removeComplaint(c.id)} className="ml-3 mt-2 p-1 w-10 items-end" activeOpacity={0.7}>
                                <Trash2 size={18} color={COLORS.red?.[600] || '#DC2626'} />
                            </TouchableOpacity>
                        )}
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
                            {[
                                { key: 'front', label: 'Front View' },
                                { key: 'rhs', label: 'RHS View' },
                                { key: 'rear', label: 'Rear View' },
                                { key: 'lhs', label: 'LHS View' },
                                { key: 'top', label: 'Top View' },
                                { key: 'additional', label: 'Additional' },
                            ].map(({ key, label }) => {
                                if (key === 'additional') {
                                    return (
                                        <View key={key} className="border border-gray-300 rounded-lg p-3 bg-white w-[48%]">
                                            <Text className="text-xs text-center text-gray-600 mb-2">{label}</Text>
                                            {additionalImages.length > 0 && (
                                                <View className="flex-row flex-wrap gap-2 mb-2">
                                                    {additionalImages.map((img, idx) => {
                                                        const uri = resolveImageUri(img);
                                                        return (
                                                            <View key={`${img.url || img.uri}-${idx}`} className="w-16 h-16 rounded border border-gray-200 overflow-hidden">
                                                                <TouchableOpacity onPress={() => openPreview(uri)} className="flex-1">
                                                                    {uri ? (
                                                                        <Image source={{ uri }} className="w-full h-full" />
                                                                    ) : (
                                                                        <View className="flex-1 items-center justify-center bg-gray-50">
                                                                            <Camera size={16} color={COLORS.gray[400]} />
                                                                        </View>
                                                                    )}
                                                                </TouchableOpacity>
                                                                <TouchableOpacity
                                                                    onPress={() => handleRemoveAdditionalImage(idx, img)}
                                                                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 border border-gray-200"
                                                                    disabled={isEdit}
                                                                >
                                                                    <X size={12} color={isEdit ? COLORS.gray[300] : (COLORS.red?.[600] || '#DC2626')} />
                                                                </TouchableOpacity>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            )}
                                            <TouchableOpacity
                                                className="w-full py-1 border border-teal-600 rounded items-center"
                                                onPress={() => handleUploadPress('additional')}
                                                disabled={uploadingType === 'additional' || isEdit}
                                            >
                                                <Text className="text-xs text-teal-600">
                                                    {uploadingType === 'additional' ? 'Uploading...' : '+ Upload'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                }

                                const uploaded = jobImages[key];
                                const previewUri = resolveImageUri(uploaded);

                                return (
                                    <View key={key} className="border border-gray-300 rounded-lg p-3 bg-white w-[48%]">
                                        {uploaded ? (
                                            <View className="w-full">
                                                <View className="flex-row justify-between items-start mb-2">
                                                    <View className="flex-1 mr-2">
                                                        <Text className="text-xs text-gray-700 font-medium mb-1">{label}</Text>
                                                        <Text className="text-xs text-gray-500" numberOfLines={2}>
                                                            {uploaded.name}
                                                        </Text>
                                                    </View>
                                                    <TouchableOpacity onPress={() => handleRemoveImage(key)} className="p-1" disabled={isEdit}>
                                                        <X size={16} color={isEdit ? COLORS.gray[300] : (COLORS.red?.[600] || '#DC2626')} />
                                                    </TouchableOpacity>
                                                </View>
                                                <View className="w-full h-8 items-center justify-center bg-teal-50 rounded flex-row justify-between px-2">
                                                    <Text className="text-xs text-teal-600">✓ Uploaded</Text>
                                                    <TouchableOpacity
                                                        onPress={() => openPreview(previewUri)}
                                                        className="bg-blue-500 px-2 py-1 rounded"
                                                    >
                                                        <Text className="text-xs text-white font-medium">View</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ) : (
                                            <View className="w-full">
                                                <View className="w-full h-14 items-center justify-center mb-2">
                                                    <Camera size={28} color={COLORS.gray[400]} />
                                                </View>
                                                <Text className="text-xs text-center text-gray-600 mb-2">{label}</Text>
                                                <TouchableOpacity
                                                    className="w-full py-1 border border-teal-600 rounded items-center"
                                                    onPress={() => handleUploadPress(key)}
                                                    disabled={uploadingType === key || isEdit}
                                                >
                                                    <Text className="text-xs text-teal-600">
                                                        {uploadingType === key ? 'Uploading...' : '+ Upload'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>

                        <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                            Checklist
                        </Text>
                        <View className="flex-row flex-wrap mb-4">
                            <View className="w-1/2"><Checkbox checked={mirrorRH} onPress={() => setMirrorRH(!mirrorRH)} label="Mirror RH" disabled={isEdit} /></View>
                            <View className="w-1/2"><Checkbox checked={mirrorLH} onPress={() => setMirrorLH(!mirrorLH)} label="Mirror LH" disabled={isEdit} /></View>
                            <View className="w-1/2"><Checkbox checked={toolkit} onPress={() => setToolkit(!toolkit)} label="Toolkit" disabled={isEdit} /></View>
                            <View className="w-1/2"><Checkbox checked={firstAidKit} onPress={() => setFirstAidKit(!firstAidKit)} label="First Aid Kit" disabled={isEdit} /></View>
                        </View>

                        <View>
                            <FormLabel label="Fuel Level" />
                            <View className="flex-row items-center border border-gray-300 bg-white rounded-lg px-3 h-12">
                                <TextInput
                                    className={`flex-1 text-sm h-12 border rounded-lg px-3 ${isEdit ? 'bg-gray-50 border-gray-200 text-gray-800' : 'bg-white border-gray-300 text-gray-800'}`}
                                    placeholder="Fuel level"
                                    value={fuelLevel}
                                    onChangeText={setFuelLevel}
                                    keyboardType="numeric"
                                    editable={!isEdit}
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
                                        onPress={() => handleDownloadPDF(item)}
                                        disabled={pdfDownloading}
                                    >
                                        <Download size={14} color={pdfDownloading ? '#93c5fd' : 'white'} />
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
                            : <Text className="text-white font-semibold">{isEdit ? 'Close' : 'Save'}</Text>
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
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
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
            <Modal
                visible={previewVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setPreviewVisible(false)}
            >
                <Pressable className="flex-1 bg-black/80 items-center justify-center" onPress={() => setPreviewVisible(false)}>
                    <Pressable className="w-[90%] h-[70%] bg-black rounded-xl overflow-hidden" onPress={() => { }}>
                        {previewImage && (
                            <Image source={{ uri: previewImage }} className="w-full h-full" resizeMode="contain" />
                        )}
                    </Pressable>
                </Pressable>
            </Modal>

            {/* PDF Download Modal */}
            <Modal
                visible={showDownloadModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDownloadModal(false)}
            >
                <Pressable className="flex-1 bg-black/60 items-center justify-center px-6" onPress={() => setShowDownloadModal(false)}>
                    <Pressable className="bg-white rounded-2xl w-full max-w-sm p-6" onPress={() => { }}>
                        <View className="w-12 h-12 bg-teal-100 rounded-full items-center justify-center mx-auto mb-4">
                            <Download size={24} color={COLORS.primary} />
                        </View>
                        <Text className="text-lg font-bold text-gray-900 text-center mb-2">
                            Download Job Card PDF
                        </Text>
                        <Text className="text-sm text-gray-600 text-center mb-6">
                            {selectedServiceItem?.jobNo}
                        </Text>

                        <TouchableOpacity
                            onPress={handleSaveToDevice}
                            disabled={pdfDownloading}
                            className="flex-row items-center gap-3 bg-teal-600 rounded-xl p-4 mb-3"
                        >
                            <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
                                <Download size={20} color="white" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-semibold">Save to Device</Text>
                                <Text className="text-teal-100 text-xs">Download PDF to your phone's storage</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSharePDF}
                            disabled={pdfDownloading}
                            className="flex-row items-center gap-3 bg-blue-600 rounded-xl p-4 mb-4"
                        >
                            <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
                                <Share2 size={20} color="white" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-semibold">Share PDF</Text>
                                <Text className="text-blue-100 text-xs">Share via email, WhatsApp, etc.</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setShowDownloadModal(false)}
                            className="items-center py-2"
                        >
                            <Text className="text-gray-500 text-sm">Cancel</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}
