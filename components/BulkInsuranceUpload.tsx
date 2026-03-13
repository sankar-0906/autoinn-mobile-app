import React, { useState } from 'react';
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
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import platformApi from '../src/api';
import { COLORS } from '../constants/colors';

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
    vehicleId
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

    // Fetch insurers on component mount (like web version)
    const fetchInsurers = async () => {
        try {
            console.log('Fetching insurers from /api/insurance');
            const response = await platformApi.get('/api/insurance');
            console.log('Insurers response:', response.data);
            
            if (response.data.code === 200) {
                const insurerData = response.data.response?.data || [];
                console.log('Setting insurers:', insurerData);
                setInsurers(insurerData);
                setFilteredInsurers(insurerData);
                
                // Create insurancePair lookup like web version
                const pair: {[key: string]: string} = {};
                for (let item of insurerData) {
                    pair[item.id] = item.name;
                }
                setInsurancePair(pair);
                console.log('Insurance pair created:', pair);
            }
        } catch (error) {
            console.error('Error fetching insurers:', error);
        }
    };

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
            // Fallback to client-side filtering
            const filtered = insurers.filter(insurer =>
                insurer.name.toLowerCase().includes(searchString.toLowerCase())
            );
            setFilteredInsurers(filtered);
        }
    };

    React.useEffect(() => {
        fetchInsurers();
    }, []);

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
                // Check file sizes (max 5MB per file to reduce server load)
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
                    // Match web version tempId format: `${Date.now()}-${file.uid}`
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

                // Parse each document with longer delay between requests to prevent server overload
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

    const parseInsuranceDoc = async (tempId: string, file: DocumentPicker.DocumentPickerAsset, retryCount = 0) => {
        const maxRetries = 3;
        const baseDelay = 2000; // 2 seconds base delay
        
        try {
            // Debug: Check if token is available
            const token = await AsyncStorage.getItem('token');
            console.log('Token available for parsing:', token ? 'YES' : 'NO');
            
            // Create FormData exactly like web version
            const formData = new FormData();
            
            // For React Native, we need to use the file object directly
            // The web version uses: fd.append("file", file);
            formData.append('file', {
                uri: file.uri,
                type: file.mimeType || 'application/pdf',
                name: file.name,
                size: file.size
            } as any);

            console.log('Making API call to /api/insurance/parse');
            console.log('File details:', { 
                name: file.name, 
                size: file.size, 
                type: file.mimeType,
                uri: file.uri
            });
            
            // Add timeout to prevent hanging
            const response = await platformApi.post('/api/insurance/parse', formData, {
                timeout: 45000, // 45 second timeout
            });

            console.log('Parse response status:', response.status);
            console.log('Parse response data:', response.data);

            const parsed = response?.data?.response?.data || response?.data?.data || {};
            let insuranceType = parsed.insuranceType || "1+5"; // Match web version exactly

            setBulkUploads(prev =>
                prev.map(item =>
                    item.tempId === tempId
                        ? {
                            ...item,
                            insurer: parsed.insurerId || item.insurer,
                            policyNumber: parsed.policyNumber || item.policyNumber,
                            //insuranceType: parsed.insuranceType || item.insuranceType, // Match web comment
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
        } catch (error: any) {
            console.error('Failed to parse insurance doc:', error);
            
            // Check if we should retry
            if (retryCount < maxRetries && (
                error.response?.status === 504 || 
                error.code === 'ECONNABORTED' ||
                error.message?.includes('timeout') ||
                !error.response // Network error
            )) {
                const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
                console.log(`Retrying parsing in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
                
                // Update UI to show retry status
                setBulkUploads(prev =>
                    prev.map(item =>
                        item.tempId === tempId 
                            ? { ...item, parsing: true, retryCount: retryCount + 1 } 
                            : item
                    )
                );
                
                // Wait and retry
                setTimeout(() => {
                    parseInsuranceDoc(tempId, file, retryCount + 1);
                }, delay);
                return;
            }
            
            // Handle specific error types
            let errorMessage = 'Could not prefill from document';
            
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                errorMessage = 'Document parsing timed out. The file might be too large or the server is busy. Please try again.';
            } else if (error.response?.status === 504) {
                errorMessage = 'Server is currently busy (504 Gateway Timeout). Please try again in a few moments or fill the details manually.';
            } else if (error.response?.status === 401) {
                errorMessage = 'Authentication error. Please log in again.';
            } else if (error.response?.status === 413) {
                errorMessage = 'File too large. Please try with a smaller file.';
            } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
                errorMessage = 'Network connection error. Please check your internet connection and try again.';
            } else if (!error.response) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            }
            
            Alert.alert('Parsing Error', errorMessage);
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
            !validTo ||
            !file
        ) {
            Alert.alert('Warning', 'Fill all fields for this upload before saving');
            return;
        }

        // Duplicate detection like web version
        const duplicate =
            dataSource.some(
                (row) =>
                    row.insurer === insurer || row.policyNumber === policyNumber
            ) ||
            newData.some(
                (row) =>
                    row.insurance?.id === insurer || row.policyNumber === policyNumber
            );

        if (duplicate) {
            Alert.alert('Warning', 'Duplicate insurer or policy number');
            return;
        }

        // Create data object exactly like web version
        const data = {
            id: "",
            insurer,
            policyNumber,
            insuranceType,
            validFrom: moment(validFrom),
            validTo: moment(validTo),
            pdf: { file: { originFileObj: file } },
            url: null,
        };

        try {
            // Add to formData like web version
            const nextIndex = dataSource.length;
            const newFormData = new FormData();
            
            // For React Native, we need to use the file object format
            newFormData.append(nextIndex.toString(), {
                uri: file.uri,
                type: file.mimeType || 'application/pdf',
                name: file.name,
            } as any);
            
            // Update all state arrays like web version
            setDataSource((prev: any[]) => [...prev, data]);
            setFormDataList((prev: any[]) => [...prev, data]);
            setNewData((prev: any[]) => [...prev, data]);
            setBulkUploads((prev) => prev.filter((row) => row.tempId !== item.tempId));
            
            // Call the onSave callback with the saved insurance data
            if (onSave) {
                onSave([data]);
            }
            
            Alert.alert('Success', 'Insurance saved successfully');
        } catch (error) {
            console.error('Error saving insurance:', error);
            Alert.alert('Error', 'Failed to save insurance');
        }
    };

    const formatDate = (date?: Date) => {
        if (!date) return '';
        // Match web version format: DD-MM-YYYY
        return moment(date).format('DD-MM-YYYY');
    };

    const renderInsuranceItem = (item: BulkInsuranceItem) => (
        <View key={item.tempId} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
            <View className="mb-3">
                <Text className="text-sm font-medium text-gray-700 mb-1">File:</Text>
                <Text className="text-sm text-gray-900">{item.file.name}</Text>
                {item.parsing ? (
                    <Text className="text-sm text-blue-600 mt-1">
                        {item.retryCount ? `Retrying... (Attempt ${item.retryCount}/3)` : 'Prefilling from document...'}
                    </Text>
                ) : !item.insurer && !item.policyNumber && !item.insuranceType && !item.validFrom && !item.validTo ? (
                    <Text className="text-sm text-red-600 mt-1">⚠️ Parsing failed. Tap "Retry Parse" to try again or fill manually.</Text>
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
                        onPress={() => {
                            // Show date picker
                            Alert.alert('Date Picker', 'Date picker to be implemented');
                        }}
                    >
                        <Text className="text-gray-800">{formatDate(item.validFrom) || 'Select Date'}</Text>
                    </TouchableOpacity>
                </View>
                <View className="flex-1 ml-2">
                    <Text className="text-sm font-medium text-gray-700 mb-1">Valid To</Text>
                    <TouchableOpacity
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                        onPress={() => {
                            // Show date picker
                            Alert.alert('Date Picker', 'Date picker to be implemented');
                        }}
                    >
                        <Text className="text-gray-800">{formatDate(item.validTo) || 'Select Date'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row">
                {!item.parsing && (!item.insurer || !item.policyNumber || !item.insuranceType || !item.validFrom || !item.validTo) ? (
                    <>
                        <TouchableOpacity
                            className="flex-1 bg-orange-500 rounded-lg py-2 px-4 mr-2"
                            onPress={() => retryParsing(item.tempId, item.file)}
                        >
                            <Text className="text-white text-center font-medium">Retry Parse</Text>
                        </TouchableOpacity>
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
                        className="bg-blue-600 border border-blue-700 rounded-lg py-3 px-4 mb-2 flex-row items-center justify-center"
                        onPress={handleBulkUpload}
                        style={{ backgroundColor: COLORS.primary }}
                    >
                        <Ionicons name="cloud-upload" size={20} color="white" className="mr-2" />
                        <Text className="text-white font-medium">Upload Bulk Insurance</Text>
                    </TouchableOpacity>
                    
                    <Text className="text-xs text-gray-500 mb-4 text-center">
                        💡 Tip: If server is busy, you can fill details manually after upload
                    </Text>

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
            
            {/* Insurer Selection Modal */}
            <Modal
                visible={showInsurerModal}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <SafeAreaView className="flex-1 bg-gray-50">
                    <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
                        <TouchableOpacity onPress={() => setShowInsurerModal(false)} className="p-2">
                            <Ionicons name="close" size={24} color={COLORS.gray[600]} />
                        </TouchableOpacity>
                        <Text className="text-lg font-semibold text-gray-900">Select Insurer</Text>
                        <View className="w-8" />
                    </View>
                    
                    <View className="p-4">
                        <TextInput
                            className="border border-gray-300 rounded-lg px-3 py-2 mb-4 bg-white"
                            placeholder="Search insurers..."
                            value={insurerSearchText}
                            onChangeText={searchInsurers}
                        />
                        
                        <ScrollView className="flex-1">
                            {filteredInsurers.map((insurer) => (
                                <TouchableOpacity
                                    key={insurer.id}
                                    className="bg-white border border-gray-200 rounded-lg p-3 mb-2"
                                    onPress={() => selectInsurer(insurer)}
                                >
                                    <Text className="text-gray-800 font-medium">{insurer.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
        </Modal>
    );
};

export default BulkInsuranceUpload;
