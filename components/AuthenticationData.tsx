import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Modal,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import {
    authoriseBooking,
    generateBookingOTP,
    verifyBookingOTP,
    sendBookingConfirmationSMS,
    generateBookingPDF,
    uploadBookingDocument,
    getVehicleLatestPrice,
} from '../src/api';
import FileUpload from './FileUpload';

interface AuthenticationDataProps {
    data: any;
    onAuthenticationComplete: (result: any) => void;
    editable?: boolean;
}

interface Accessory {
    id: string;
    partName: string;
    mrp: number;
    quantity: number;
    discount: number;
    isPercent: boolean;
    accessory?: {
        partName: string;
        mrp: number;
    };
}

interface PriceData {
    onRoadPrice: number;
    tempRegister: number;
    onRoadDiscount: number;
    netRecieveables: number;
    numberPlate: number;
    specialNoCharges: number;
    hypothetication: number;
    affidavit: number;
    finalAmount: number;
    accessoriesTotalDiscount: number;
    accessoriesTotalAfterDiscount: number;
    accessoriesTotal: number;
    totalDiscount: number;
}

const AuthenticationData: React.FC<AuthenticationDataProps> = ({
    data,
    onAuthenticationComplete,
    editable = true
}) => {
    const [bookingStatus, setBookingStatus] = useState('PENDING');
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [authorisedTime, setAuthorisedTime] = useState<string | null>(null);
    const [isAuthorised, setIsAuthorised] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Customer Authentication states
    const [registeredPhone, setRegisteredPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [authStatus, setAuthStatus] = useState('Pending');
    const [verifiedTime, setVerifiedTime] = useState<string | null>(null);
    const [referenceId, setReferenceId] = useState('');
    const [generatedPDF, setGeneratedPDF] = useState(false);
    const [digitalVerified, setDigitalVerified] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // Data states
    const [accessories, setAccessories] = useState<Accessory[]>([]);
    const [latestPrice, setLatestPrice] = useState<any>(null);
    const [vehicleImage, setVehicleImage] = useState('');

    const statusOptions = [
        { key: "ACCEPTED", title: "Accept" },
        { key: "PENDING", title: "Pending" },
        { key: "REJECTED", title: "Reject" },
    ];

    useEffect(() => {
        if (data) {
            initializeData();
        }
    }, [data]);

    const initializeData = async () => {
        // Set basic booking info
        setBookingStatus(data.bookingStatus || 'PENDING');
        setRegisteredPhone(data.customer?.contacts?.[0]?.phone || data.customerPhone || '');
        setAccessories(data.accessories || []);
        setVehicleImage(data.color?.url || '');
        
        // Set authorization state
        if (data.authorisedTime) {
            setAuthorisedTime(formatDateTime(data.authorisedTime));
            setIsAuthorised(data.bookingStatus === 'ACCEPTED' && data.authorisedTime ? false : true);
        }
        
        // Set verification state
        if (data.authentication?.verifiedAt) {
            setVerifiedTime(formatDateTime(data.authentication.verifiedAt));
            setAuthStatus('Verified');
            setDigitalVerified(true);
        }
        
        if (data.authentication?.beforeVerification) {
            setGeneratedPDF(true);
        }
        
        // Fetch latest vehicle price
        if (data.vehicle?.id) {
            try {
                const response = await getVehicleLatestPrice(data.vehicle.id);
                if (response.data?.response?.data?.[0]) {
                    setLatestPrice(response.data.response.data[0]);
                }
            } catch (error) {
                console.error('Error fetching latest vehicle price:', error);
            }
        }
    };

    const formatDateTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
        } catch {
            return dateString;
        }
    };

    const calculatePriceAfterDiscount = (item: Accessory) => {
        const { discount, isPercent, quantity } = item;
        const { mrp } = item.accessory || item;
        const totalPrice = mrp * quantity;
        
        if (isPercent) {
            return totalPrice - (totalPrice * discount) / 100;
        }
        
        return totalPrice - discount;
    };

    const calculateTotals = () => {
        const accessoriesTotalPrice = accessories.reduce(
            (sum, item) => sum + (item.accessory?.mrp || item.mrp) * item.quantity,
            0
        );
        
        const accessoriesTotalDiscount = accessories.reduce((sum, item) => {
            const { discount, isPercent, quantity } = item;
            const mrp = item.accessory?.mrp || item.mrp;
            const totalPrice = mrp * quantity;
            
            if (isPercent) {
                return sum + (totalPrice * discount) / 100;
            }
            return sum + discount;
        }, 0);
        
        const accessoriesTotalAfterDiscount = accessoriesTotalPrice - accessoriesTotalDiscount;
        
        return {
            accessoriesTotalPrice,
            accessoriesTotalDiscount,
            accessoriesTotalAfterDiscount
        };
    };

    const handleAuthorise = async () => {
        if (!password.trim()) {
            setPasswordError('Please enter password');
            return;
        }
        
        setLoading(true);
        setPasswordError('');
        
        try {
            const response = await authoriseBooking(data.id, password, bookingStatus);
            
            if (response.data?.code === 200) {
                const currentTime = formatDateTime(new Date().toISOString());
                setAuthorisedTime(currentTime);
                setIsAuthorised(false);
                
                // Send confirmation SMS if accepted
                if (bookingStatus === 'ACCEPTED') {
                    await sendConfirmationSMS();
                }
                
                onAuthenticationComplete({
                    success: true,
                    status: bookingStatus,
                    authorisedTime: currentTime
                });
                
                Alert.alert('Success', 'Booking Status Updated Successfully');
            } else {
                setPasswordError('Password seems to be wrong!!');
            }
        } catch (error: any) {
            setPasswordError('Authentication failed. Please try again.');
            console.error('Authorization error:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendConfirmationSMS = async () => {
        try {
            const smsData = {
                link: data.authentication?.beforeVerification,
                cname: data.customer?.name || data.customerName,
                slex: data.executive,
                bkid: data.bookingId,
                vname: data.vehicle?.modelName,
                dlr: data.branch,
            };
            
            await sendBookingConfirmationSMS(
                data.customer?.contacts?.[0]?.phone || data.customerPhone,
                smsData
            );
        } catch (error) {
            console.error('Error sending confirmation SMS:', error);
        }
    };

    const handleGenerateOTP = async () => {
        if (!generatedPDF) {
            Alert.alert('Error', 'Please generate booking PDF first');
            return;
        }
        
        setLoading(true);
        
        try {
            const smsData = {
                link: data.authentication?.beforeVerification,
                cname: data.customer?.name || data.customerName,
                slex: data.executive,
                bkid: data.bookingId,
                vname: data.vehicle?.modelName,
                dlr: data.branch,
            };
            
            const response = await generateBookingOTP(registeredPhone, smsData);
            
            if (response.data?.code === 200) {
                setReferenceId(response.data.response.data.referenceId);
                Alert.alert('Success', 'OTP sent to your mobile number');
            } else {
                Alert.alert('Error', response.data?.message || 'Failed to send OTP');
            }
        } catch (error: any) {
            Alert.alert('Error', 'Failed to generate OTP');
            console.error('OTP generation error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp.trim()) {
            Alert.alert('Error', 'Please enter OTP');
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await verifyBookingOTP(referenceId, otp);
            
            if (response.data?.code === 200 && response.data.response.data.isValid) {
                const currentTime = formatDateTime(new Date().toISOString());
                setVerifiedTime(currentTime);
                setAuthStatus('Verified');
                setDigitalVerified(true);
                
                onAuthenticationComplete({
                    success: true,
                    digitalVerified: true,
                    verifiedTime: currentTime
                });
                
                Alert.alert('Success', 'OTP Verified Successfully');
            } else {
                Alert.alert('Error', 'Wrong OTP Code');
            }
        } catch (error: any) {
            Alert.alert('Error', 'OTP verification failed');
            console.error('OTP verification error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        setLoading(true);
        
        try {
            const pdfData = generatePDFData();
            const response = await generateBookingPDF(pdfData);
            
            if (response.data?.code === 200) {
                setGeneratedPDF(true);
                Alert.alert('Success', 'PDF Generated Successfully');
                
                onAuthenticationComplete({
                    success: true,
                    pdfGenerated: true,
                    pdfUrl: response.data.response.data.Location
                });
            } else {
                Alert.alert('Error', 'Failed to generate PDF');
            }
        } catch (error: any) {
            Alert.alert('Error', 'Failed to download PDF');
            console.error('PDF generation error:', error);
        } finally {
            setLoading(false);
        }
    };

    const generatePDFData = () => {
        const totals = calculateTotals();
        const customerObj = data.customer || {};
        const address = customerObj.address || {};
        
        return {
            fileNo: data.id,
            status: authStatus,
            verifiedTime: verifiedTime,
            bookingId: data.bookingId || "-",
            bookingDate: new Date().toLocaleDateString('en-IN'),
            printDate: new Date().toLocaleDateString('en-IN'),
            printTime: new Date().toLocaleTimeString('en-IN'),
            customer: {
                customerId: customerObj.customerId || data.customerId,
                name: customerObj.name || data.customerName || "-",
                gender: customerObj.gender || data.customerGender || "-",
                dob: customerObj.dateOfBirth || data.customerDob ? 
                    new Date(customerObj.dateOfBirth || data.customerDob).toLocaleDateString('en-IN') : "-",
                fatherName: customerObj.fatherName || data.customerFatherName || "-",
                phone: customerObj.contacts?.[0]?.phone || data.customerPhone || "-",
                email: customerObj.email || data.customerEmail || "-",
                address: {
                    line1: address.line1 || data.customerAddress || "-",
                    line2: address.line2 || data.customerLocality || "-",
                    line3: address.line3 || "-",
                    city: address.district?.name || data.customerCity || customerObj.city || "-",
                    pinCode: address.pincode || data.customerPincode || "-",
                },
            },
            nominee: {
                name: data.nomineeName || "-",
                age: data.nomineeAge || "-",
                relationship: data.relationship || "-",
            },
            executive: data.executive,
            vehicle: {
                modelName: data.vehicle?.modelName || "-",
                manufacturerId: data.vehicle?.manufacturer?.id,
                modelColor: data.selectedVehicle?.[0]?.color?.color || "-",
                onRoad: parseFloat(data.price?.onRoadPrice || '0'),
                onRoadDiscount: data.price?.onRoadDiscount || 0,
                netRecieveables: parseFloat(data.price?.netRecieveables || '0'),
                hp: parseFloat(data.price?.hp || '0'),
                numberPlate: parseFloat(data.price?.numberPlate || '0'),
                tr: parseFloat(data.price?.tempRegister || '0'),
                affidavit: parseFloat(data.price?.affidavit || '0'),
                specialNoCharges: parseFloat(data.price?.specialNoCharges || '0'),
                accessories: accessories.length > 0 ? {
                    total: totals.accessoriesTotalPrice,
                    totalDiscount: totals.accessoriesTotalDiscount,
                    totalAfterDiscount: totals.accessoriesTotalAfterDiscount,
                    items: accessories.map(acc => ({
                        name: acc.partName,
                        price: acc.accessory?.mrp || acc.mrp,
                    })),
                } : null,
            },
            branch: data.branch,
            remarks: data.price?.remarks,
        };
    };

    const renderPriceBreakdown = () => {
        const priceRows = [
            { label: "Ex-Showroom Price", value: latestPrice?.showroomPrice ?? data?.vehicle?.price?.[0]?.showroomPrice ?? 0 },
            { label: "Road Tax", value: latestPrice?.roadTax ?? data?.vehicle?.price?.[0]?.roadTax ?? 0 },
            { label: "Registration Fee", value: latestPrice?.registrationFee ?? data?.vehicle?.price?.[0]?.registrationFee ?? 0 },
            { label: "Handling Charges", value: latestPrice?.handlingCharges ?? 0 },
            { label: "Warranty Price", value: latestPrice?.warrantyPrice ?? data?.vehicle?.price?.[0]?.warrantyPrice ?? 0 },
            { label: "Insurance Amount", value: (() => {
                const typeKey = data?.price?.insuranceType;
                if (typeKey && latestPrice && latestPrice[typeKey] !== undefined) {
                    return latestPrice[typeKey];
                }
                if (typeKey && data?.vehicle?.price?.[0]?.[typeKey] !== undefined) {
                    return data.vehicle.price[0][typeKey];
                }
                return 0;
            })() },
        ];
        
        const total = priceRows.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
        
        return (
            <View style={styles.priceTable}>
                {priceRows.map((row, index) => (
                    <View key={index} style={styles.priceRow}>
                        <Text style={styles.priceLabel}>{row.label}</Text>
                        <Text style={styles.priceValue}>₹{Number(row.value).toLocaleString('en-IN')}</Text>
                    </View>
                ))}
                <View style={[styles.priceRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>₹{Number(total).toLocaleString('en-IN')}</Text>
                </View>
            </View>
        );
    };

    const handleFileUploaded = (fileUrl: string) => {
        // Update authentication data with uploaded file
        const currentTime = formatDateTime(new Date().toISOString());
        setVerifiedTime(currentTime);
        setAuthStatus('Verified');
        
        onAuthenticationComplete({
            success: true,
            manualVerified: true,
            verifiedTime: currentTime,
            uploadedFileUrl: fileUrl
        });
        
        Alert.alert('Success', 'Document uploaded and verified successfully');
    };

    const renderAccessoriesTable = () => {
        const totals = calculateTotals();
        
        return (
            <View style={styles.accessoriesTable}>
                <View style={styles.tableHeader}>
                    <Text style={styles.headerCell}>Accessory</Text>
                    <Text style={styles.headerCell}>Qty</Text>
                    <Text style={styles.headerCell}>Discount</Text>
                    <Text style={styles.headerCell}>Price</Text>
                </View>
                {accessories.map((item, index) => (
                    <View key={index} style={styles.tableRow}>
                        <Text style={styles.cell}>{item.partName}</Text>
                        <Text style={styles.cell}>{item.quantity}</Text>
                        <Text style={styles.cell}>
                            {item.isPercent ? `${item.discount}%` : `₹${item.discount}`}
                        </Text>
                        <Text style={styles.cell}>₹{calculatePriceAfterDiscount(item).toLocaleString('en-IN')}</Text>
                    </View>
                ))}
                <View style={[styles.tableRow, styles.totalRow]}>
                    <Text style={styles.totalCell}>TOTAL</Text>
                    <Text style={styles.totalCell}></Text>
                    <Text style={styles.totalCell}>₹{totals.accessoriesTotalDiscount.toLocaleString('en-IN')}</Text>
                    <Text style={styles.totalCell}>₹{totals.accessoriesTotalAfterDiscount.toLocaleString('en-IN')}</Text>
                </View>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
                {/* Booking Authorization Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Booking Authorisation</Text>
                    <Text style={styles.sectionSubtitle}>I hereby authorise the Booking of the Vehicle.</Text>
                    
                    <View style={styles.vehicleInfo}>
                        <Text style={styles.infoLabel}>Vehicle Model: <Text style={styles.infoValue}>{data?.vehicle?.modelName}</Text></Text>
                        <Text style={styles.infoLabel}>Vehicle Manufacturer: <Text style={styles.infoValue}>{data?.vehicle?.manufacturer?.name}</Text></Text>
                    </View>

                    {/* Vehicle Image */}
                    {vehicleImage && (
                        <View style={styles.imageContainer}>
                            <Text style={styles.imageLabel}>Vehicle Image</Text>
                            <Image
                                source={{ uri: vehicleImage }}
                                style={styles.vehicleImage}
                                resizeMode="cover"
                            />
                        </View>
                    )}

                    {/* Accessories Table */}
                    <Text style={styles.subsectionTitle}>Accessories List</Text>
                    {renderAccessoriesTable()}

                    {/* Price Breakdown */}
                    <Text style={styles.subsectionTitle}>Price Breakdown</Text>
                    {renderPriceBreakdown()}

                    {/* Customer Info */}
                    <View style={styles.customerInfo}>
                        <Text style={styles.infoText}>
                            To Customer <Text style={styles.infoValue}>{data?.customer?.name || data?.customerName}</Text> at the Following Prices
                        </Text>
                        <Text style={styles.infoText}>
                            Payment Mode: <Text style={styles.infoValue}>{data?.price?.paymentMode?.toUpperCase()}</Text>
                        </Text>
                    </View>

                    {/* Status Selection */}
                    <View style={styles.statusContainer}>
                        <Text style={styles.label}>Status</Text>
                        <View style={styles.statusOptions}>
                            {statusOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.key}
                                    style={[
                                        styles.statusOption,
                                        bookingStatus === option.key && styles.statusOptionSelected
                                    ]}
                                    onPress={() => setBookingStatus(option.key)}
                                    disabled={!editable}
                                >
                                    <Text style={[
                                        styles.statusOptionText,
                                        bookingStatus === option.key && styles.statusOptionTextSelected
                                    ]}>
                                        {option.title}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Password Input */}
                    {isAuthorised && (
                        <View style={styles.passwordContainer}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={[
                                    styles.passwordInput,
                                    passwordError ? styles.passwordInputError : null
                                ]}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter Password"
                                secureTextEntry
                                editable={editable}
                            />
                            {passwordError ? (
                                <Text style={styles.errorText}>{passwordError}</Text>
                            ) : null}
                        </View>
                    )}

                    {/* Authorize Button */}
                    {isAuthorised && (
                        <TouchableOpacity
                            style={[styles.button, styles.authorizeButton, loading && styles.buttonDisabled]}
                            onPress={handleAuthorise}
                            disabled={!editable || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Authorise</Text>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Authorized Time */}
                    {authorisedTime && (
                        <View style={styles.timeContainer}>
                            <Text style={styles.timeText}>
                                <Text style={styles.timeLabel}>Authorized Time:</Text> {authorisedTime}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Customer Authentication Section */}
                <View style={[styles.section, styles.authSection]}>
                    <Text style={styles.sectionTitle}>Customer Authentication</Text>
                    
                    {/* Digital Authentication */}
                    <View style={styles.subsection}>
                        <Text style={styles.subsectionTitle}>Digital Authentication</Text>
                        
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Registered Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                value={registeredPhone}
                                onChangeText={setRegisteredPhone}
                                placeholder="Registered Phone Number"
                                editable={false}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleGenerateOTP}
                            disabled={!editable || !generatedPDF || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Generate OTP and Link</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Enter OTP</Text>
                            <TextInput
                                style={styles.input}
                                value={otp}
                                onChangeText={setOtp}
                                placeholder="Enter OTP"
                                keyboardType="numeric"
                                editable={editable}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleVerifyOTP}
                            disabled={!editable || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Verify</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.statusDisplay}>
                            <Text style={styles.statusLabel}>Authentication Status: </Text>
                            <Text style={styles.statusValue}>{authStatus}</Text>
                        </View>
                    </View>

                    {/* Manual Authentication */}
                    <View style={[styles.subsection, styles.manualSection]}>
                        <Text style={styles.subsectionTitle}>Manual Authentication</Text>
                        
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.button, styles.secondaryButton, loading && styles.buttonDisabled]}
                                onPress={handleDownloadPDF}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.primary} />
                                ) : (
                                    <View style={styles.buttonContent}>
                                        <Ionicons name="download-outline" size={16} color={COLORS.primary} />
                                        <Text style={[styles.buttonText, styles.secondaryButtonText]}>Download Booking Form</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.uploadSection}>
                            <Text style={styles.label}>Upload Booking Form</Text>
                            <FileUpload
                                onFileUploaded={handleFileUploaded}
                                disabled={!editable}
                                authStatus={authStatus}
                                loading={loading}
                            />
                        </View>
                    </View>

                    {/* Verified Time */}
                    {verifiedTime && (
                        <View style={styles.timeContainer}>
                            <Text style={styles.timeText}>
                                <Text style={styles.timeLabel}>Verified Time:</Text> {verifiedTime}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    content: {
        padding: 16,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    authSection: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 16,
    },
    subsection: {
        marginBottom: 24,
    },
    subsectionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 12,
    },
    manualSection: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 24,
        marginTop: 24,
    },
    vehicleInfo: {
        marginBottom: 16,
    },
    infoLabel: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 4,
    },
    infoValue: {
        fontWeight: '500',
        color: '#1f2937',
    },
    infoText: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 4,
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    imageLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    vehicleImage: {
        width: 200,
        height: 130,
        borderRadius: 8,
    },
    accessoriesTable: {
        marginBottom: 16,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingBottom: 8,
        marginBottom: 8,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerCell: {
        flex: 1,
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    cell: {
        flex: 1,
        fontSize: 12,
        color: '#6b7280',
    },
    totalRow: {
        backgroundColor: '#f9fafb',
        borderTopWidth: 2,
        borderTopColor: '#e5e7eb',
    },
    totalCell: {
        flex: 1,
        fontSize: 12,
        fontWeight: '600',
        color: '#1f2937',
    },
    priceTable: {
        marginBottom: 16,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    priceLabel: {
        flex: 2,
        fontSize: 14,
        color: '#6b7280',
    },
    priceValue: {
        flex: 1,
        fontSize: 14,
        color: '#1f2937',
        textAlign: 'right',
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    totalValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    customerInfo: {
        marginVertical: 16,
        paddingVertical: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    statusContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    statusOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    statusOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        backgroundColor: 'white',
    },
    statusOptionSelected: {
        backgroundColor: '#14b8a6',
        borderColor: '#14b8a6',
    },
    statusOptionText: {
        fontSize: 14,
        color: '#6b7280',
    },
    statusOptionTextSelected: {
        color: 'white',
        fontWeight: '500',
    },
    passwordContainer: {
        marginBottom: 16,
    },
    passwordInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
    },
    passwordInputError: {
        borderColor: '#ef4444',
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    authorizeButton: {
        marginTop: 8,
    },
    secondaryButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    secondaryButtonText: {
        color: COLORS.primary,
    },
    timeContainer: {
        marginTop: 16,
        paddingVertical: 12,
        backgroundColor: '#f0fdf4',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    timeText: {
        fontSize: 14,
        color: '#16a34a',
    },
    timeLabel: {
        fontWeight: '600',
    },
    formGroup: {
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        backgroundColor: '#f9fafb',
    },
    statusDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    statusLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    statusValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1f2937',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    uploadSection: {
        marginTop: 16,
    },
});

export default AuthenticationData;
