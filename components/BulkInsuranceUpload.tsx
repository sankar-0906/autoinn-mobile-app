import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
    PermissionsAndroid,
    Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import axios from 'axios';
import platformApi from '../src/api';
import { bulkInsuranceUpload, uploadVehicleInsurance } from '../src/api';
import { COLORS } from '../constants/colors';

// ─── Custom Modal Component (matching booking activity pattern) ────────────────────────────────────────────────────────────
const CustomModal = ({
    visible,
    children,
    onClose,
}: {
    visible: boolean;
    children: React.ReactNode;
    onClose: () => void;
}) => {
    if (!visible) return null;
    return (
        <View className="absolute inset-0 z-50 flex-1">
            <View className="flex-1 bg-black/50 justify-center">
                <View className="bg-white rounded-xl m-4 max-h-96">{children}</View>
            </View>
        </View>
    );
};

interface BulkInsuranceItem {
    tempId: string;
    file: DocumentPicker.DocumentPickerAsset;
    insurer?: string;
    policyNumber: string;
    insuranceType: string;
    validFrom?: Date;
    validTo?: Date;
    parsing: boolean;
    retryCount?: number;
    savedLocally?: boolean;
    uploaded?: boolean;
    url?: string;
}

interface Insurer {
    id: string;
    name: string;
}

interface BulkInsuranceUploadProps {
    visible: boolean;
    onClose: () => void;
    onSave: (insurances: any[]) => void;
    vehicleId: string;
    chassisNumber?: string;
    existingInsuranceData?: any[]; // Pass existing data to avoid conflicts
}

const insuranceTypes = [
    { label: '1+5', value: '1+5' },
    { label: '5+5', value: '5+5' },
    { label: '1+5 Zero Dep', value: '1+5 Zero Dep' },
    { label: '5+5 Zero Dep', value: '5+5 Zero Dep' }
];

const BulkInsuranceUpload: React.FC<BulkInsuranceUploadProps> = ({
    visible,
    onClose,
    onSave,
    vehicleId,
    chassisNumber,
    existingInsuranceData
}) => {
    const [bulkUploads, setBulkUploads] = useState<BulkInsuranceItem[]>([]);
    const [insurers, setInsurers] = useState<Insurer[]>([]);
    const [filteredInsurers, setFilteredInsurers] = useState<Insurer[]>([]);
    const [insurerSearchText, setInsurerSearchText] = useState('');
    const [showInsurerModal, setShowInsurerModal] = useState(false);
    const [selectedItemTempId, setSelectedItemTempId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [insurancePair, setInsurancePair] = useState<{[key: string]: string}>({});
    const [newData, setNewData] = useState<any[]>([]);
    const [dataSource, setDataSource] = useState<any[]>([]);
    const [formData, setFormData] = useState(new FormData());
    const [formDataList, setFormDataList] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerField, setDatePickerField] = useState<'validFrom' | 'validTo' | null>(null);
    const [selectedItemTempIdForDate, setSelectedItemTempIdForDate] = useState<string>('');

    // Fetch insurers from API (matching web app)
    useEffect(() => {
        const fetchInsurers = async () => {
            try {
                setLoading(true);
                const response = await platformApi.get("/api/insurance");
                
                if (response.data.code === 200) {
                    const { response: apiResponse } = response.data;
                    if (apiResponse.code === 200) {
                        console.log('📋 Insurers data:', apiResponse.data);
                        setInsurers(apiResponse.data);
                        setFilteredInsurers(apiResponse.data);
                        
                        // Create insurance pair mapping like web app
                        const pair: {[key: string]: string} = {};
                        for (const item of apiResponse.data) {
                            if (item.name) { // Only add if name exists
                                pair[item.id] = item.name;
                            }
                        }
                        console.log('🔗 Insurance pair mapping:', pair);
                        setInsurancePair(pair);
                    }
                }
            } catch (error) {
                console.error('Error fetching insurers:', error);
                Alert.alert('Error', 'Failed to fetch insurers');
            } finally {
                setLoading(false);
            }
        };

        if (visible) {
            fetchInsurers();
        }
    }, [visible]);

    // Search insurers (like web version)
    const searchInsurers = async (searchString: string) => {
        setInsurerSearchText(searchString);
        
        if (!searchString.trim()) {
            setFilteredInsurers(insurers);
            return;
        }

        try {
            console.log('Searching insurers with:', searchString);
            const response = await platformApi.post('/api/options/get', {
                module: 'insurances',
                column: 'name',
                searchString: searchString,
                fields: ['name'],
                size: 100,
                searchColumns: ['name']
            });
            
            console.log('Search response:', response.data);
            
            if (response.data.code === 200) {
                const searchResults = response.data.response || [];
                setFilteredInsurers(searchResults);
            }
        } catch (error) {
            console.error('Error searching insurers:', error);
            // Fallback to client-side filtering with null checks
            const filtered = insurers.filter(insurer =>
                insurer.name && insurer.name.toLowerCase().includes(searchString.toLowerCase())
            );
            setFilteredInsurers(filtered);
        }
    };

    const openInsurerModal = (tempId: string) => {
        setSelectedItemTempId(tempId);
        setShowInsurerModal(true);
        setInsurerSearchText('');
        setFilteredInsurers(insurers);
    };

    const selectInsurer = (insurer: Insurer) => {
        updateBulkField(selectedItemTempId, 'insurer', insurer.id);
        setShowInsurerModal(false);
        setSelectedItemTempId('');
    };

    const handleBulkUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf'],
                multiple: true,
                copyToCacheDirectory: true
            });

            if (!result.canceled && result.assets) {
                const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                const oversizedFiles = result.assets.filter(file => file.size && file.size > maxSize);
                
                if (oversizedFiles.length > 0) {
                    Alert.alert(
                        'File Size Error',
                        `The following files are too large (max 5MB):\n${oversizedFiles.map(f => f.name).join('\n')}`
                    );
                    return;
                }

                const newItems: BulkInsuranceItem[] = result.assets.map(file => {
                    const tempId = `${Date.now()}-${file.uri?.split('/').pop() || 'file'}`;
                    return {
                        tempId,
                        file,
                        insurer: undefined,
                        policyNumber: '',
                        insuranceType: '',
                        validFrom: undefined,
                        validTo: undefined,
                        parsing: true
                    };
                });

                setBulkUploads(prev => [...prev, ...newItems]);

                newItems.forEach((item, index) => {
                    setTimeout(() => {
                        parseInsuranceDoc(item.tempId, item.file);
                    }, index * 3000); // 3 second delay between each request
                });
            }
        } catch (error) {
            console.error('Error picking documents:', error);
            Alert.alert('Error', 'Failed to pick documents');
        }
    };

    // Add empty row for manual entry (like web app)
    const addEmptyInsuranceRow = () => {
        const tempId = `manual-${Date.now()}`;
        const emptyItem: BulkInsuranceItem = {
            tempId,
            file: {
                uri: '',
                name: 'Manual Entry',
                size: 0,
                mimeType: 'application/pdf'
            } as DocumentPicker.DocumentPickerAsset,
            insurer: undefined,
            policyNumber: '',
            insuranceType: '',
            validFrom: undefined,
            validTo: undefined,
            parsing: false
        };
        
        setBulkUploads(prev => [...prev, emptyItem]);
    };

    const parseInsuranceDoc = async (tempId: string, file: DocumentPicker.DocumentPickerAsset) => {
        try {
            console.log('🔍 Parsing insurance document:', file.name);
            
            // Create FormData exactly like web version
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                type: file.mimeType || 'application/pdf',
                name: file.name,
                size: file.size
            } as any);

            console.log('📡 Making API call to /api/insurance/parse');
            
            // Use platformApi directly (same as web version)
            const response = await platformApi.post('/api/insurance/parse', formData, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 30000, // 30 second timeout
            });

            console.log('✅ Parse response:', response.data);

            const parsed = response?.data?.response?.data || response?.data?.data || {};
            let insuranceType = parsed.insuranceType || "1+5"; // Match web version exactly

            setBulkUploads(prev =>
                prev.map(item =>
                    item.tempId === tempId
                        ? {
                            ...item,
                            insurer: parsed.insurerId || item.insurer,
                            policyNumber: parsed.policyNumber || item.policyNumber,
                            insuranceType: insuranceType, 
                            validFrom: parsed.validFrom
                                ? moment(parsed.validFrom, "DD/MM/YYYY").toDate()
                                : item.validFrom,
                            validTo: parsed.validTo 
                                ? moment(parsed.validTo, "DD/MM/YYYY").toDate()
                                : item.validTo,
                            parsing: false,
                        }
                        : item
                )
            );
            
            console.log('✅ Successfully parsed document:', file.name);
        } catch (error: any) {
            console.error('❌ Failed to parse insurance doc:', error);
            
            let errorMessage = 'Could not prefill from document';
            
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                errorMessage = 'Document parsing timed out. Please try again or fill details manually.';
            } else if (error.response?.status === 504) {
                errorMessage = 'Server is currently busy (504 Gateway Timeout). Please try again or fill details manually.';
            } else if (error.response?.status === 413) {
                errorMessage = 'File too large. Please try with a smaller file.';
            } else if (error.response?.status === 401) {
                errorMessage = 'Authentication error. Please log in again.';
            } else if (!error.response) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            }
            
            Alert.alert('Parsing Error', errorMessage, [
                { text: 'Fill Manually', style: 'cancel' },
                { 
                    text: 'Retry', 
                    onPress: () => {
                        setBulkUploads(prev =>
                            prev.map(item =>
                                item.tempId === tempId ? { ...item, parsing: true } : item
                            )
                        );
                        setTimeout(() => {
                            parseInsuranceDoc(tempId, file);
                        }, 1000);
                    }
                }
            ]);
            
            setBulkUploads(prev =>
                prev.map(item =>
                    item.tempId === tempId ? { ...item, parsing: false } : item
                )
            );
        }
    };

    const updateBulkField = (tempId: string, key: keyof BulkInsuranceItem, value: any) => {
        setBulkUploads(prev =>
            prev.map(item =>
                item.tempId === tempId ? { ...item, [key]: value } : item
            )
        );
    };

    const retryParsing = (tempId: string, file: DocumentPicker.DocumentPickerAsset) => {
        // Reset parsing state and try again
        setBulkUploads(prev =>
            prev.map(item =>
                item.tempId === tempId ? { ...item, parsing: true } : item
            )
        );
        
        // Retry parsing after a short delay
        setTimeout(() => {
            parseInsuranceDoc(tempId, file);
        }, 500);
    };

    const removeBulkItem = (tempId: string) => {
        setBulkUploads(prev => prev.filter(item => item.tempId !== tempId));
    };

    const saveBulkItem = async (item: BulkInsuranceItem) => {
        const { insurer, policyNumber, insuranceType, validFrom, validTo, file } = item;

        if (item.parsing) {
            Alert.alert('Info', 'Parsing document... please wait');
            return;
        }

        if (
            !insurer ||
            !policyNumber ||
            !insuranceType ||
            !validFrom ||
            !validTo
        ) {
            Alert.alert('Warning', 'Fill all fields for this upload before saving');
            return;
        }

        // Duplicate detection like web version - check against existing data too
        const duplicate =
            dataSource.some(
                (row) =>
                    row.insurer === insurer || row.policyNumber === policyNumber
            ) ||
            newData.some(
                (row) =>
                    row.insurance?.id === insurer || row.policyNumber === policyNumber
            ) ||
            (existingInsuranceData && existingInsuranceData.some(
                (row) =>
                    row.insurer?.id === insurer || row.policyNumber === policyNumber
            ));

        if (duplicate) {
            Alert.alert('Warning', 'Duplicate insurer or policy number');
            return;
        }

        try {
            // Mark as saving locally first
            setBulkUploads(prev =>
                prev.map(row =>
                    row.tempId === item.tempId ? { ...row, savedLocally: true } : row
                )
            );

            let documentUrl = null;

            // Only upload file if it's not a manual entry
            if (file && file.uri && file.name !== 'Manual Entry') {
                // Upload the document using the proper API
                const formData = new FormData();
                formData.append("profile", {
                    uri: file.uri,
                    type: file.mimeType || 'application/pdf',
                    name: file.name,
                    size: file.size
                } as any);
                formData.append("module", "vehicle");
                formData.append("type", "Insurance");
                formData.append("master", "Transaction Master");
                formData.append("id", "");

                const uploadRes = await uploadVehicleInsurance(formData);

                if (uploadRes.data.code === 200) {
                    const uploadedFile = uploadRes.data.response?.data || uploadRes.data.data;
                    documentUrl = uploadedFile?.url || uploadedFile?.Location;
                    
                    if (!documentUrl) {
                        console.error("No document URL in upload response");
                        Alert.alert('Error', 'File uploaded but no URL received');
                        setBulkUploads(prev =>
                            prev.map(row =>
                                row.tempId === item.tempId ? { ...row, savedLocally: false } : row
                            )
                        );
                        return;
                    }
                } else {
                    console.error("Upload failed:", uploadRes.data);
                    Alert.alert('Error', 'Failed to upload file to server');
                    setBulkUploads(prev =>
                        prev.map(row =>
                            row.tempId === item.tempId ? { ...row, savedLocally: false } : row
                        )
                    );
                    return;
                }
            }

            // Create data object exactly like web version
            const data = {
                id: "",
                insurer,
                policyNumber,
                insuranceType,
                validFrom: moment(validFrom).toISOString(),
                validTo: moment(validTo).toISOString(),
                pdf: file && file.uri ? { file: { originFileObj: file } } : null,
                url: documentUrl,
            };
            
            // Update all state arrays like web version
            setDataSource((prev: any[]) => [...prev, data]);
            setFormDataList((prev: any[]) => [...prev, data]);
            setNewData((prev: any[]) => [...prev, data]);
            
            // Mark as uploaded
            setBulkUploads(prev =>
                prev.map(row =>
                    row.tempId === item.tempId 
                        ? { ...row, uploaded: true, url: documentUrl } 
                        : row
                )
            );
            
            Alert.alert('Success', 'Insurance saved successfully');
        } catch (error: any) {
            console.error('Error saving insurance:', error);
            
            let errorMessage = 'Failed to save insurance';
            
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                errorMessage = 'Upload timed out. Please try again.';
            } else if (error.response?.status === 413) {
                errorMessage = 'File too large. Please try with a smaller file.';
            } else if (error.response?.status === 401) {
                errorMessage = 'Authentication error. Please log in again.';
            } else if (error.response?.status >= 500) {
                errorMessage = 'Server error. Please try again later.';
            }
            
            Alert.alert('Error', errorMessage);
            
            // Revert saved status on failure
            setBulkUploads(prev =>
                prev.map(row =>
                    row.tempId === item.tempId ? { ...row, savedLocally: false } : row
                )
            );
        }
    };

    const saveAllBulkItems = async () => {
        // Get only items that are saved locally (like web version)
        const itemsToSave = bulkUploads.filter(item => item.savedLocally && !item.uploaded);
        
        if (itemsToSave.length === 0) {
            Alert.alert("Info", "No documents to save. Click 'Save' on individual documents first.");
            return;
        }

        try {
            setUploading(true);
            
            // Create the insuranceData array exactly like web version
            const insuranceData: any[] = [];
            
            for (const item of itemsToSave) {
                const { insurer, policyNumber, insuranceType, validFrom, validTo, url } = item;
                
                // Add to insurance data array (file already uploaded in saveBulkItem)
                insuranceData.push({
                    id: "",
                    insurer: insurer,
                    policyNumber: policyNumber,
                    insuranceType: insuranceType,
                    chassisNumber: chassisNumber, // Add chassis number for validation
                    validFrom: moment(validFrom).toISOString(),
                    validTo: moment(validTo).toISOString(),
                    pdf: (item.file && item.file.uri && item.file.name !== 'Manual Entry') ? {
                        file: {
                            originFileObj: {
                                uid: item.file.uri
                            }
                        }
                    } : null,
                    url: url || null
                });
            }

            // Save all insurance data to database using bulk API
            if (insuranceData.length > 0) {
                const payload = { insuranceData };
                
                try {
                    const bulkRes = await bulkInsuranceUpload(payload);
                    
                    if (bulkRes.data.code === 200) {
                        // Remove all successfully saved items from bulkUploads
                        const savedTempIds = itemsToSave.map(item => item.tempId);
                        setBulkUploads(prev => prev.filter(item => !savedTempIds.includes(item.tempId)));
                        
                        // Update data arrays
                        setDataSource(prev => [...prev, ...insuranceData]);
                        setNewData(prev => [...prev, ...insuranceData]);
                        setFormDataList(prev => [...prev, ...insuranceData]);
                        
                        Alert.alert("Success", `Successfully uploaded ${insuranceData.length} insurance documents`);
                        
                        // Call onSave callback
                        if (onSave) {
                            onSave(insuranceData);
                        }
                        
                        // Close modal if all items are processed
                        if (bulkUploads.length === insuranceData.length) {
                            onClose();
                        }
                    } else {
                        Alert.alert("Error", "Failed to save insurance documents to database");
                    }
                } catch (bulkErr) {
                    console.error("Bulk API error:", bulkErr);
                    Alert.alert("Error", "Failed to connect to bulk insurance API");
                }
            } else {
                Alert.alert("Error", "No documents were successfully uploaded");
            }
        } catch (error) {
            console.error("Error in bulk upload:", error);
            Alert.alert("Error", "Failed to save insurance documents");
        } finally {
            setUploading(false);
        }
    };

    const formatDate = (date?: Date) => {
        if (!date) return '';
        // Match web version format: DD-MM-YYYY
        return moment(date).format('DD-MM-YYYY');
    };

    const showDatePickerForField = (tempId: string, field: 'validFrom' | 'validTo') => {
        setSelectedItemTempIdForDate(tempId);
        setDatePickerField(field);
        setShowDatePicker(true);
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (event.type === 'dismissed') {
            setShowDatePicker(false);
            setDatePickerField(null);
            setSelectedItemTempIdForDate('');
            return;
        }

        if (selectedDate && datePickerField && selectedItemTempIdForDate) {
            updateBulkField(selectedItemTempIdForDate, datePickerField, selectedDate);
        }
        
        setShowDatePicker(false);
        setDatePickerField(null);
        setSelectedItemTempIdForDate('');
    };

    const renderInsuranceItem = (item: BulkInsuranceItem) => (
        <View key={item.tempId} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
            <View className="mb-3">
                {item.file.name !== 'Manual Entry' ? (
                    <>
                        <Text className="text-sm font-medium text-gray-700 mb-1">File:</Text>
                        <Text className="text-sm text-gray-900">{item.file.name}</Text>
                    </>
                ) : (
                    <Text className="text-sm font-medium text-blue-600 mb-1">Manual Entry</Text>
                )}
                {item.parsing ? (
                    <Text className="text-sm text-blue-600 mt-1">
                        {item.retryCount ? `Retrying... (Attempt ${item.retryCount}/3)` : 'Prefilling from document...'}
                    </Text>
                ) : !item.insurer && !item.policyNumber && !item.insuranceType && !item.validFrom && !item.validTo && item.file.name !== 'Manual Entry' ? (
                    <Text className="text-sm text-orange-600 mt-1">
                        ⚠️ Parsing failed. Server busy. Please fill details manually below.
                    </Text>
                ) : null}
            </View>

            {/* Insurer Selection */}
            <View className="mb-3">
                <Text className="text-sm font-medium text-gray-700 mb-1">Insurer</Text>
                <TouchableOpacity
                    className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                    onPress={() => openInsurerModal(item.tempId)}
                >
                    <Text className="text-gray-800">
                        {insurers.find(i => i.id === item.insurer)?.name || 'Select Insurer'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Policy Number */}
            <View className="mb-3">
                <Text className="text-sm font-medium text-gray-700 mb-1">Policy No</Text>
                <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                    placeholder="Policy No"
                    value={item.policyNumber}
                    onChangeText={(value) => updateBulkField(item.tempId, 'policyNumber', value)}
                />
            </View>

            {/* Insurance Type */}
            <View className="mb-3">
                <Text className="text-sm font-medium text-gray-700 mb-1">Insurance Type</Text>
                <TouchableOpacity
                    className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                    onPress={() => {
                        Alert.alert(
                            'Select Insurance Type',
                            'Choose an insurance type',
                            insuranceTypes.map(type => ({
                                text: type.label,
                                onPress: () => updateBulkField(item.tempId, 'insuranceType', type.value)
                            }))
                        );
                    }}
                >
                    <Text className="text-gray-800">{item.insuranceType}</Text>
                </TouchableOpacity>
            </View>

            {/* Date Fields */}
            <View className="flex-row mb-3">
                <View className="flex-1 mr-2">
                    <Text className="text-sm font-medium text-gray-700 mb-1">Valid From</Text>
                    <TouchableOpacity
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                        onPress={() => showDatePickerForField(item.tempId, 'validFrom')}
                    >
                        <Text className="text-gray-800">{formatDate(item.validFrom) || 'Select Date'}</Text>
                    </TouchableOpacity>
                </View>
                <View className="flex-1 ml-2">
                    <Text className="text-sm font-medium text-gray-700 mb-1">Valid To</Text>
                    <TouchableOpacity
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                        onPress={() => showDatePickerForField(item.tempId, 'validTo')}
                    >
                        <Text className="text-gray-800">{formatDate(item.validTo) || 'Select Date'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row">
                {item.parsing ? (
                    <View className="flex-1 bg-gray-500 rounded-lg py-2 px-4">
                        <Text className="text-white text-center font-medium">Parsing...</Text>
                    </View>
                ) : item.uploaded ? (
                    <>
                        <View className="flex-1 bg-green-500 rounded-lg py-2 px-4 mr-2">
                            <Text className="text-white text-center font-medium">✓ Uploaded</Text>
                        </View>
                        <TouchableOpacity
                            className="flex-1 bg-red-600 rounded-lg py-2 px-4 ml-2"
                            onPress={() => removeBulkItem(item.tempId)}
                            style={{ backgroundColor: COLORS.red[600] }}
                        >
                            <Text className="text-white text-center font-medium">Remove</Text>
                        </TouchableOpacity>
                    </>
                ) : item.savedLocally ? (
                    <>
                        <View className="flex-1 bg-blue-500 rounded-lg py-2 px-4 mr-2">
                            <Text className="text-white text-center font-medium">Ready to Upload</Text>
                        </View>
                        <TouchableOpacity
                            className="flex-1 bg-red-600 rounded-lg py-2 px-4 ml-2"
                            onPress={() => removeBulkItem(item.tempId)}
                            style={{ backgroundColor: COLORS.red[600] }}
                        >
                            <Text className="text-white text-center font-medium">Remove</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity
                            className="flex-1 bg-blue-600 rounded-lg py-2 px-4 mr-2"
                            onPress={() => saveBulkItem(item)}
                            disabled={item.parsing}
                            style={{ backgroundColor: COLORS.primary }}
                        >
                            <Text className="text-white text-center font-medium">Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 bg-red-600 rounded-lg py-2 px-4 ml-2"
                            onPress={() => removeBulkItem(item.tempId)}
                            style={{ backgroundColor: COLORS.red[600] }}
                        >
                            <Text className="text-white text-center font-medium">Remove</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <SafeAreaView className="flex-1 bg-gray-50">
                {/* Header */}
                <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
                    <TouchableOpacity onPress={onClose} className="p-2">
                        <Ionicons name="close" size={24} color={COLORS.gray[600]} />
                    </TouchableOpacity>
                    <Text className="text-lg font-semibold text-gray-900">Upload Bulk Insurance</Text>
                    <View className="w-8" />
                </View>

                <ScrollView className="flex-1 px-4 py-4">
                    {/* Upload Button */}
                    <TouchableOpacity
                        className="bg-blue-600 border border-blue-700 rounded-lg py-3 px-4 mb-4 flex-row items-center justify-center"
                        onPress={handleBulkUpload}
                        style={{ backgroundColor: COLORS.primary }}
                    >
                        <Ionicons name="cloud-upload" size={20} color="white" className="mr-2" />
                        <Text className="text-white font-medium">Upload PDF Files</Text>
                    </TouchableOpacity>
                    
                    {/* Add Manual Entry Button */}
                    <TouchableOpacity
                        className="bg-gray-600 border border-gray-700 rounded-lg py-3 px-4 mb-4 flex-row items-center justify-center"
                        onPress={addEmptyInsuranceRow}
                    >
                        <Ionicons name="add-circle" size={20} color="white" className="mr-2" />
                        <Text className="text-white font-medium">Add Manual Entry</Text>
                    </TouchableOpacity>
                    
                    <Text className="text-xs text-gray-500 mb-4 text-center">
                        Upload PDF files to auto-extract details or add manual entry
                    </Text>

                    {/* Save All Button */}
                    {bulkUploads.some(item => item.savedLocally && !item.uploaded) && (
                        <TouchableOpacity
                            className="bg-green-600 border border-green-700 rounded-lg py-3 px-4 mb-4 flex-row items-center justify-center"
                            onPress={saveAllBulkItems}
                            disabled={uploading}
                            style={{ backgroundColor: uploading ? COLORS.gray[400] : '#16a34a' }}
                        >
                            {uploading ? (
                                <>
                                    <ActivityIndicator size="small" color="white" className="mr-2" />
                                    <Text className="text-white font-medium">Uploading All...</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="cloud-upload" size={20} color="white" className="mr-2" />
                                    <Text className="text-white font-medium">Save All ({bulkUploads.filter(item => item.savedLocally && !item.uploaded).length} items)</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Bulk Upload Items */}
                    {bulkUploads.length > 0 ? (
                        <View>
                            <Text className="text-lg font-semibold text-gray-900 mb-3">
                                Insurance Documents ({bulkUploads.length})
                            </Text>
                            {bulkUploads.map(renderInsuranceItem)}
                        </View>
                    ) : (
                        <View className="flex-1 items-center justify-center py-20">
                            <Ionicons name="document-text" size={64} color={COLORS.gray[400]} />
                            <Text className="text-gray-500 text-center mt-4">
                                No insurance documents uploaded yet.
                            </Text>
                            <Text className="text-gray-400 text-center mt-2">
                                Tap the button above to upload PDF files.
                            </Text>
                        </View>
                    )}
                </ScrollView>

                {loading && (
                    <View className="absolute inset-0 bg-black bg-opacity-50 flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color={COLORS.blue[700]} />
                        <Text className="text-white mt-2">Processing...</Text>
                    </View>
                )}
            
            {/* Insurer Selection Modal - using CustomModal pattern */}
            <CustomModal visible={showInsurerModal} onClose={() => setShowInsurerModal(false)}>
                <View className="p-4 border-b border-gray-200">
                    <Text className="text-lg font-semibold">Select Insurer</Text>
                </View>
                
                {/* Search Input */}
                <View className="p-4 border-b border-gray-200">
                    <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                        placeholder="Search insurers..."
                        value={insurerSearchText}
                        onChangeText={(text) => {
                            setInsurerSearchText(text);
                            // Filter insurers based on search with null checks
                            if (!text.trim()) {
                                setFilteredInsurers(insurers);
                            } else {
                                const filtered = insurers.filter(insurer =>
                                    insurer.name && insurer.name.toLowerCase().includes(text.toLowerCase())
                                );
                                setFilteredInsurers(filtered);
                            }
                        }}
                    />
                </View>
                
                {/* Insurers List */}
                <ScrollView>
                    {filteredInsurers.map(insurer => (
                        <TouchableOpacity 
                            key={insurer.id} 
                            onPress={() => {
                                updateBulkField(selectedItemTempId, 'insurer', insurer.id);
                                setShowInsurerModal(false);
                                setInsurerSearchText('');
                                setFilteredInsurers(insurers);
                            }} 
                            className="p-4 border-b border-gray-100"
                        >
                            <Text className="text-gray-800">{insurer.name || 'Unknown Insurer'}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                
                {/* Cancel Button */}
                <TouchableOpacity 
                    onPress={() => {
                        setShowInsurerModal(false);
                        setInsurerSearchText('');
                        setFilteredInsurers(insurers);
                    }} 
                    className="p-4 border-t border-gray-200"
                >
                    <Text className="text-center text-gray-600">Cancel</Text>
                </TouchableOpacity>
            </CustomModal>
            
            {/* Date Picker Modal */}
            {showDatePicker && (
                <DateTimePicker
                    value={selectedItemTempIdForDate ? 
                        (bulkUploads.find(item => item.tempId === selectedItemTempIdForDate)?.[datePickerField || 'validFrom'] || new Date()) 
                        : new Date()}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    minimumDate={datePickerField === 'validTo' && selectedItemTempIdForDate ? 
                        bulkUploads.find(item => item.tempId === selectedItemTempIdForDate)?.validFrom 
                        : undefined}
                />
            )}
        </SafeAreaView>
        </Modal>
    );
};

export default BulkInsuranceUpload;
