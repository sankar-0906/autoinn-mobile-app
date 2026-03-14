import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    Modal,
    StyleSheet,
    ActivityIndicator,
    Platform,
    PermissionsAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { uploadBookingDocument } from '../src/api';
import { COLORS } from '../constants/colors';

interface FileUploadProps {
    onFileUploaded: (fileUrl: string) => void;
    disabled?: boolean;
    authStatus?: string;
    loading?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
    onFileUploaded,
    disabled = false,
    authStatus = 'Pending',
    loading = false,
}) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const requestFilePermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                    {
                        title: 'Storage Permission Required',
                        message: 'This app needs access to your storage to upload documents',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    },
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn('Permission error:', err);
                return false;
            }
        }
        return true;
    };

    const handleFileUpload = async () => {
        if (disabled || authStatus === 'Verified' || uploading) {
            return;
        }

        const hasPermission = await requestFilePermission();
        if (!hasPermission) {
            Alert.alert('Permission Required', 'Please grant storage permission to upload files');
            return;
        }

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                ],
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return;
            }

            const file = result.assets[0];
            await uploadFile(file);

        } catch (error) {
            console.error('File picker error:', error);
            Alert.alert('Error', 'Failed to pick file');
        }
    };

    const uploadFile = async (file: any) => {
        setUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            
            // Append file with proper naming
            const fileType = file.name.split('.').pop()?.toLowerCase();
            const fileName = `booking_${Date.now()}.${fileType}`;
            
            formData.append('profile', {
                uri: file.uri,
                type: file.mimeType || `application/${fileType}`,
                name: fileName,
            } as any);
            
            formData.append('master', 'Transaction Master');
            formData.append('module', 'Booking');
            formData.append('id', 'BK123456'); // This would come from booking data

            const response = await uploadBookingDocument(formData);

            if (response.data?.code === 200) {
                const { Location } = response.data.response.data;
                onFileUploaded(Location);
                Alert.alert('Success', 'File uploaded successfully');
            } else {
                Alert.alert('Error', 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'File upload failed');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[
                    styles.uploadButton,
                    (disabled || authStatus === 'Verified' || uploading || loading) && styles.uploadButtonDisabled
                ]}
                onPress={handleFileUpload}
                disabled={disabled || authStatus === 'Verified' || uploading || loading}
            >
                {uploading ? (
                    <View style={styles.uploadingContainer}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                        <Text style={styles.uploadingText}>Uploading...</Text>
                        <Text style={styles.progressText}>{uploadProgress}%</Text>
                    </View>
                ) : (
                    <View style={styles.buttonContent}>
                        <Ionicons name="cloud-upload-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.buttonText}>Upload Booking Form</Text>
                    </View>
                )}
            </TouchableOpacity>
            
            {authStatus === 'Verified' && (
                <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                    <Text style={styles.verifiedText}>Already Verified</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
        backgroundColor: 'white',
    },
    uploadButtonDisabled: {
        opacity: 0.6,
        borderColor: COLORS.gray[300],
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.primary,
    },
    uploadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    uploadingText: {
        fontSize: 14,
        color: COLORS.gray[600],
    },
    progressText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '500',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#f0fdf4',
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    verifiedText: {
        fontSize: 12,
        color: '#16a34a',
        fontWeight: '500',
    },
});

export default FileUpload;
