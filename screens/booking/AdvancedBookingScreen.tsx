import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Modal,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';

type AdvancedBookingNavigationProp = StackNavigationProp<RootStackParamList, 'AdvancedBooking'>;

interface PhoneNumber {
    number: string;
    type: string;
    validity: string;
    whatsApp: string;
    dnd: string;
}

export default function AdvancedBookingScreen() {
    const route = useRoute();
    const navigation = useNavigation<AdvancedBookingNavigationProp>();
    const { customerId, customerName, phoneNumbers } = route.params as {
        customerId?: string;
        customerName?: string;
        phoneNumbers?: PhoneNumber[];
    };

    const [currentStep, setCurrentStep] = useState(1);
    const [showColorModal, setShowColorModal] = useState(false);
    const [showAccessoriesModal, setShowAccessoriesModal] = useState(false);
    const [selectedColor, setSelectedColor] = useState<any>(null);
    const [selectedAccessories, setSelectedAccessories] = useState<any[]>([]);
    const [paymentMode, setPaymentMode] = useState('Cash');

    const steps = [
        { id: 1, label: 'Customer Data', icon: 'person-outline' },
        { id: 2, label: 'Vehicle Data', icon: 'car-outline' },
        { id: 3, label: 'Payment Data', icon: 'card-outline' },
    ];

    // Form states
    const [branch, setBranch] = useState('Devanahalli');
    const [phone, setPhone] = useState(phoneNumbers?.[0]?.number || '');
    const [customerFullName, setCustomerFullName] = useState(customerName || '');
    const [fatherName, setFatherName] = useState('');
    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [locality, setLocality] = useState('');
    const [city, setCity] = useState('');
    const [pincode, setPincode] = useState('');
    const [nomineeName, setNomineeName] = useState('');
    const [salesOfficer, setSalesOfficer] = useState('Sano');
    const [referredBy, setReferredBy] = useState('');
    const [relationship, setRelationship] = useState('');
    const [quotations, setQuotations] = useState('');

    // Vehicle states
    const [manufacturer, setManufacturer] = useState('India Yamaha Motors Private Limited');
    const [modelName, setModelName] = useState('');
    const [vehicleColor, setVehicleColor] = useState('');
    const [variant, setVariant] = useState('');
    const [chassisNumber, setChassisNumber] = useState('');
    const [engineNumber, setEngineNumber] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [bookingAmount, setBookingAmount] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [discount, setDiscount] = useState('');
    const [netAmount, setNetAmount] = useState('');
    const [accessoriesTotal, setAccessoriesTotal] = useState('');
    const [insuranceAmount, setInsuranceAmount] = useState('');
    const [otherCharges, setOtherCharges] = useState('');

    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        } else {
            // Save and complete
            Alert.alert('Success', 'Advanced booking completed successfully!');
            navigation.goBack();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            navigation.goBack();
        }
    };

    const renderStepIndicator = () => (
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Advanced Booking Register</Text>
            <View style={styles.stepContainer}>
                {steps.map((step, index) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;
                    return (
                        <View key={step.id} style={styles.stepRow}>
                            <View style={styles.stepColumn}>
                                <View style={[
                                    styles.stepCircle,
                                    isActive ? styles.stepActive : isCompleted ? styles.stepCompleted : styles.stepInactive
                                ]}>
                                    <Ionicons 
                                        name={step.icon as any} 
                                        size={16} 
                                        color="white" 
                                    />
                                </View>
                                <Text style={[
                                    styles.stepLabel,
                                    isActive ? styles.stepLabelActive : isCompleted ? styles.stepLabelCompleted : styles.stepLabelInactive
                                ]}>
                                    {step.label}
                                </Text>
                                {isActive && <View style={styles.stepLineActive} />}
                            </View>
                            {index < steps.length - 1 && (
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={styles.chevron} />
                            )}
                        </View>
                    );
                })}
            </View>
        </View>
    );

    const renderCustomerData = () => (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.form}>
                    <View style={styles.formGroup}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> Branch
                            </Text>
                            <TextInput
                                value={branch}
                                onChangeText={setBranch}
                                style={styles.input}
                                editable={false}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> Phone
                            </Text>
                            <View style={styles.phoneContainer}>
                                <TextInput
                                    value="+91"
                                    style={styles.countryCode}
                                    editable={false}
                                />
                                <TextInput
                                    value={phone}
                                    onChangeText={setPhone}
                                    style={styles.phoneInput}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> Customer Name
                            </Text>
                            <TextInput
                                value={customerFullName}
                                onChangeText={setCustomerFullName}
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> Father's Name
                            </Text>
                            <TextInput
                                value={fatherName}
                                onChangeText={setFatherName}
                                placeholder="Father's Name"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> Address Line 1
                            </Text>
                            <TextInput
                                value={address1}
                                onChangeText={setAddress1}
                                placeholder="Address Line 1"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Address Line 2
                            </Text>
                            <TextInput
                                value={address2}
                                onChangeText={setAddress2}
                                placeholder="Address Line 2"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> Locality
                            </Text>
                            <TextInput
                                value={locality}
                                onChangeText={setLocality}
                                placeholder="Locality"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> City
                            </Text>
                            <TextInput
                                value={city}
                                onChangeText={setCity}
                                placeholder="City"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> Pincode
                            </Text>
                            <TextInput
                                value={pincode}
                                onChangeText={setPincode}
                                placeholder="Pincode"
                                style={styles.input}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Nominee Name
                            </Text>
                            <TextInput
                                value={nomineeName}
                                onChangeText={setNomineeName}
                                placeholder="Nominee Name"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> Sales Officer
                            </Text>
                            <TextInput
                                value={salesOfficer}
                                onChangeText={setSalesOfficer}
                                style={styles.input}
                                editable={false}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> Referred By
                            </Text>
                            <TextInput
                                value={referredBy}
                                onChangeText={setReferredBy}
                                placeholder="Referred By"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> Relationship
                            </Text>
                            <TextInput
                                value={relationship}
                                onChangeText={setRelationship}
                                placeholder="Relationship"
                                style={styles.input}
                            />
                        </View>
                    </View>

                    <View style={styles.borderTop}>
                        <View style={styles.quotationHeader}>
                            <Text style={styles.label}>
                                Quotations /Associated
                            </Text>
                            <TouchableOpacity>
                                <Text style={styles.linkText}>Link Quotation</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            value={quotations}
                            onChangeText={setQuotations}
                            style={styles.disabledInput}
                            placeholder="No quotations linked"
                            editable={false}
                        />
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    const renderVehicleData = () => (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.form}>
                    <View style={styles.formGroup}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> Manufacturer
                            </Text>
                            <TextInput
                                value={manufacturer}
                                onChangeText={setManufacturer}
                                style={styles.input}
                                editable={false}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> Model Name
                            </Text>
                            <TextInput
                                value={modelName}
                                onChangeText={setModelName}
                                placeholder="Select Model Name"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> Vehicle Color
                            </Text>
                            <View style={styles.colorContainer}>
                                <TextInput
                                    value={selectedColor ? selectedColor.name : ''}
                                    placeholder="No Vehicle Chosen"
                                    style={styles.colorInput}
                                    editable={false}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowColorModal(true)}
                                    style={styles.colorButton}
                                >
                                    <Text style={styles.buttonText}>Select Color</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> Variant
                            </Text>
                            <TextInput
                                value={variant}
                                onChangeText={setVariant}
                                placeholder="Select Variant"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> Chassis Number
                            </Text>
                            <TextInput
                                value={chassisNumber}
                                onChangeText={setChassisNumber}
                                placeholder="Chassis Number"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> Engine Number
                            </Text>
                            <TextInput
                                value={engineNumber}
                                onChangeText={setEngineNumber}
                                placeholder="Engine Number"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Registration Number
                            </Text>
                            <TextInput
                                value={registrationNumber}
                                onChangeText={setRegistrationNumber}
                                placeholder="Registration Number"
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> Booking Amount
                            </Text>
                            <TextInput
                                value={bookingAmount}
                                onChangeText={setBookingAmount}
                                placeholder="Booking Amount"
                                style={styles.input}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> Total Amount
                            </Text>
                            <TextInput
                                value={totalAmount}
                                onChangeText={setTotalAmount}
                                placeholder="Total Amount"
                                style={styles.input}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Discount
                            </Text>
                            <TextInput
                                value={discount}
                                onChangeText={setDiscount}
                                placeholder="Discount"
                                style={styles.input}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> Net Amount
                            </Text>
                            <TextInput
                                value={netAmount}
                                onChangeText={setNetAmount}
                                placeholder="Net Amount"
                                style={styles.input}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Accessories Total
                            </Text>
                            <View style={styles.colorContainer}>
                                <TextInput
                                    value={selectedAccessories.length > 0 ? `${selectedAccessories.length} accessories selected` : ''}
                                    placeholder="No accessories selected"
                                    style={styles.colorInput}
                                    editable={false}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowAccessoriesModal(true)}
                                    style={styles.colorButton}
                                >
                                    <Text style={styles.buttonText}>Select</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Insurance Amount
                            </Text>
                            <TextInput
                                value={insuranceAmount}
                                onChangeText={setInsuranceAmount}
                                placeholder="Insurance Amount"
                                style={styles.input}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Other Charges
                            </Text>
                            <TextInput
                                value={otherCharges}
                                onChangeText={setOtherCharges}
                                placeholder="Other Charges"
                                style={styles.input}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    const renderPaymentData = () => (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.form}>
                    <View style={styles.formGroup}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                <Text style={styles.required}>*</Text> Payment Mode
                            </Text>
                            <View style={styles.paymentOptions}>
                                {['Cash', 'Card', 'UPI', 'Cheque', 'Finance'].map((mode) => (
                                    <TouchableOpacity
                                        key={mode}
                                        onPress={() => setPaymentMode(mode)}
                                        style={[
                                            styles.paymentOption,
                                            paymentMode === mode ? styles.paymentOptionActive : styles.paymentOptionInactive
                                        ]}
                                    >
                                        <View style={[
                                            styles.radioCircle,
                                            paymentMode === mode ? styles.radioActive : styles.radioInactive
                                        ]}>
                                            {paymentMode === mode && (
                                                <View style={styles.radioDot} />
                                            )}
                                        </View>
                                        <Text style={styles.paymentText}>{mode}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {paymentMode === 'Finance' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    <Text style={styles.required}>*</Text> Finance Details
                                </Text>
                                <TextInput
                                    placeholder="Enter finance company details..."
                                    style={styles.textArea}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Payment Details
                            </Text>
                            <TextInput
                                placeholder="Enter payment details..."
                                style={styles.textArea}
                                multiline
                                numberOfLines={4}
                            />
                        </View>

                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                Advanced booking includes accessories and insurance options.
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return renderCustomerData();
            case 2:
                return renderVehicleData();
            case 3:
                return renderPaymentData();
            default:
                return renderCustomerData();
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {renderStepIndicator()}
            {renderCurrentStep()}
            
            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        onPress={handleBack}
                        style={styles.backButton}
                    >
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleNext}
                        style={styles.nextButton}
                    >
                        <Text style={styles.nextButtonText}>
                            {currentStep === 3 ? 'Complete Booking' : 'Next'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Color Modal */}
            <Modal
                visible={showColorModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowColorModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowColorModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Vehicle Color</Text>
                        <View style={styles.colorOptions}>
                            {['Black', 'Red', 'Blue', 'White', 'Gray', 'Green'].map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    onPress={() => {
                                        setSelectedColor({ name: color });
                                        setShowColorModal(false);
                                    }}
                                    style={styles.colorOption}
                                >
                                    <Text style={styles.colorOptionText}>{color}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowColorModal(false)}
                            style={styles.cancelButton}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Accessories Modal */}
            <Modal
                visible={showAccessoriesModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowAccessoriesModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowAccessoriesModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Accessories</Text>
                        <View style={styles.accessoriesOptions}>
                            {[
                                { id: 1, name: 'Helmet', price: 1500 },
                                { id: 2, name: 'Mobile Holder', price: 800 },
                                { id: 3, name: 'Side Box', price: 2500 },
                                { id: 4, name: 'Seat Cover', price: 1200 },
                                { id: 5, name: 'Tank Pad', price: 600 },
                            ].map((accessory) => (
                                <TouchableOpacity
                                    key={accessory.id}
                                    onPress={() => {
                                        const isSelected = selectedAccessories.some(a => a.id === accessory.id);
                                        if (isSelected) {
                                            setSelectedAccessories(selectedAccessories.filter(a => a.id !== accessory.id));
                                        } else {
                                            setSelectedAccessories([...selectedAccessories, accessory]);
                                        }
                                    }}
                                    style={[
                                        styles.accessoryOption,
                                        selectedAccessories.some(a => a.id === accessory.id) ? styles.accessoryOptionSelected : styles.accessoryOptionUnselected
                                    ]}
                                >
                                    <Text style={styles.accessoryName}>{accessory.name}</Text>
                                    <Text style={styles.accessoryPrice}>₹{accessory.price}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowAccessoriesModal(false)}
                            style={styles.doneButton}
                        >
                            <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        backgroundColor: '#4b5563',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: 'white',
        textAlign: 'center',
    },
    stepContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepColumn: {
        alignItems: 'center',
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepActive: {
        backgroundColor: '#14b8a6',
    },
    stepCompleted: {
        backgroundColor: '#14b8a6',
    },
    stepInactive: {
        backgroundColor: '#9ca3af',
    },
    stepLabel: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },
    stepLabelActive: {
        color: '#14b8a6',
        fontWeight: '500',
    },
    stepLabelCompleted: {
        color: '#14b8a6',
    },
    stepLabelInactive: {
        color: '#9ca3af',
    },
    stepLineActive: {
        width: '100%',
        height: 2,
        backgroundColor: '#14b8a6',
        marginTop: 4,
        borderRadius: 1,
    },
    chevron: {
        marginHorizontal: 8,
    },
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    content: {
        maxWidth: 800,
        marginHorizontal: 'auto',
        paddingHorizontal: 16,
        paddingVertical: 24,
    },
    form: {
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        padding: 16,
    },
    formGroup: {
        gap: 16,
    },
    inputGroup: {
        gap: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    required: {
        color: '#ef4444',
    },
    input: {
        width: '100%',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        fontSize: 14,
    },
    phoneContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    countryCode: {
        width: 64,
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        fontSize: 14,
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        fontSize: 14,
    },
    borderTop: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 16,
        marginTop: 16,
    },
    quotationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    linkText: {
        fontSize: 14,
        color: '#14b8a6',
    },
    disabledInput: {
        width: '100%',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        backgroundColor: '#f9fafb',
        fontSize: 14,
    },
    colorContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    colorInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        backgroundColor: '#f9fafb',
        fontSize: 14,
    },
    colorButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        backgroundColor: '#f9fafb',
    },
    buttonText: {
        fontSize: 14,
    },
    paymentOptions: {
        gap: 8,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderRadius: 6,
    },
    paymentOptionActive: {
        borderColor: '#14b8a6',
        backgroundColor: '#f0fdfa',
    },
    paymentOptionInactive: {
        borderColor: '#d1d5db',
    },
    radioCircle: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        marginRight: 12,
    },
    radioActive: {
        borderColor: '#14b8a6',
    },
    radioInactive: {
        borderColor: '#d1d5db',
    },
    radioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#14b8a6',
        alignSelf: 'center',
    },
    paymentText: {
        fontSize: 14,
    },
    textArea: {
        width: '100%',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        fontSize: 14,
        textAlignVertical: 'top',
        minHeight: 80,
    },
    infoBox: {
        backgroundColor: '#dbeafe',
        borderWidth: 1,
        borderColor: '#3b82f6',
        borderRadius: 6,
        padding: 12,
    },
    infoText: {
        fontSize: 14,
        color: '#1e40af',
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    backButton: {
        flex: 1,
        backgroundColor: '#e5e7eb',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        color: '#374151',
        fontWeight: '500',
    },
    nextButton: {
        flex: 1,
        backgroundColor: '#14b8a6',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextButtonText: {
        color: 'white',
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 24,
        marginHorizontal: 16,
        width: '100%',
        maxWidth: 300,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 16,
    },
    colorOptions: {
        gap: 8,
        maxHeight: 200,
    },
    colorOption: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
    },
    colorOptionText: {
        fontSize: 14,
    },
    accessoriesOptions: {
        gap: 8,
        maxHeight: 250,
    },
    accessoryOption: {
        padding: 12,
        borderWidth: 1,
        borderRadius: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    accessoryOptionSelected: {
        borderColor: '#14b8a6',
        backgroundColor: '#f0fdfa',
    },
    accessoryOptionUnselected: {
        borderColor: '#d1d5db',
    },
    accessoryName: {
        fontSize: 14,
    },
    accessoryPrice: {
        fontSize: 14,
        fontWeight: '500',
    },
    cancelButton: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#e5e7eb',
        borderRadius: 6,
    },
    cancelButtonText: {
        textAlign: 'center',
        color: '#374151',
    },
    doneButton: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#14b8a6',
        borderRadius: 6,
    },
    doneButtonText: {
        textAlign: 'center',
        color: 'white',
    },
});
