// import React, { useState } from 'react';
// import {
//     View,
//     Text,
//     ScrollView,
//     TextInput,
//     TouchableOpacity,
//     Alert,
//     KeyboardAvoidingView,
//     Platform,
//     Modal,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { StackNavigationProp } from '@react-navigation/stack';
// import { RouteProp } from '@react-navigation/native';
// import { RootStackParamList } from '../../navigation/types';
// import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react-native';
// import { COLORS } from '../../constants/colors';
// import { Button } from '../../components/ui/Button';
// import AttachQuotationModal from '../../components/AttachQuotationModal';
// import { 
//     getCountries, 
//     getStates, 
//     getCities, 
//     getUsers,
//     getBranches,
//     generateCustomerId,
//     getCustomerByPhoneNo,
//     getCurrentUser
// } from '../../src/api';
// import platformApi from '../../src/api';
// import { useToast } from '../../src/ToastContext';

// // Custom Modal Component
// const CustomModal = ({ visible, children, onClose }: { visible: boolean; children: React.ReactNode; onClose: () => void }) => {
//     if (!visible) return null;
    
//     return (
//         <View className="absolute inset-0 z-50 flex-1">
//             <View className="flex-1 bg-black/50 justify-center">
//                 <View className="bg-white rounded-xl m-4 max-h-96">
//                     {children}
//                 </View>
//             </View>
//         </View>
//     );
// };

// type BookingActivityRouteProp = RouteProp<RootStackParamList, 'BookingActivity'>;
// type BookingActivityNavigationProp = StackNavigationProp<RootStackParamList, 'BookingActivity'>;

// const FormLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
//     <Text className="text-sm text-gray-600 mb-1 font-medium">
//         {label}
//         {required && <Text className="text-red-500"> *</Text>}
//     </Text>
// );

// export default function BookingActivityScreen({
//     navigation,
//     route,
// }: {
//     navigation: BookingActivityNavigationProp;
//     route: BookingActivityRouteProp;
// }) {
//     // Don't use route params for initial values - start with empty fields
//     const toast = useToast();

//     const [activeTab, setActiveTab] = useState<'customer' | 'vehicle' | 'payment'>('customer');
//     const [paymentMode, setPaymentMode] = useState('cash');

//     // Customer Data - Start with empty values
//     const [branch, setBranch] = useState(''); // Empty, will be set by user selection
//     const [phone, setPhone] = useState(''); // Empty, will be filled by user input
//     const [customerFullName, setCustomerFullName] = useState(''); // Empty, will be filled by auto-fill
//     const [fatherName, setFatherName] = useState('');
//     const [address, setAddress] = useState('');
//     const [address2, setAddress2] = useState('');
//     const [address3, setAddress3] = useState('');
//     const [locality, setLocality] = useState('');
//     const [country, setCountry] = useState(''); // Empty, will be filled by auto-fill
//     const [stateVal, setStateVal] = useState('');
//     const [city, setCity] = useState('');
//     const [pincode, setPincode] = useState('');
//     const [email, setEmail] = useState('');
//     const [dob, setDob] = useState('');
//     const [age, setAge] = useState('');
//     const [referredBy, setReferredBy] = useState('');
//     const [relationship, setRelationship] = useState('');
//     const [nominee, setNominee] = useState('');
//     const [salesOfficer, setSalesOfficer] = useState('');
//     const [quotationsAssociated, setQuotationsAssociated] = useState('');
    
//     // Customer ID
//     const [generatedCustomerId, setGeneratedCustomerId] = useState('');
//     const [customerData, setCustomerData] = useState<any>(null);

//     // Dropdown data
//     const [countries, setCountries] = useState<any[]>([]);
//     const [states, setStates] = useState<any[]>([]);
//     const [cities, setCities] = useState<any[]>([]);
//     const [rtos, setRtos] = useState<any[]>([]);
//     const [manufacturers, setManufacturers] = useState<any[]>([]);
//     const [models, setModels] = useState<any[]>([]);
//     const [colors, setColors] = useState<any[]>([]);
//     const [salesOfficers, setSalesOfficers] = useState<any[]>([]);
//     const [referredByOptions, setReferredByOptions] = useState<any[]>([]);
//     const [relationshipOptions, setRelationshipOptions] = useState<any[]>([]);
//     const [branches, setBranches] = useState<any[]>([]);

//     // Modal states
//     const [showBranchModal, setShowBranchModal] = useState(false);
//     const [showCountryModal, setShowCountryModal] = useState(false);
//     const [showStateModal, setShowStateModal] = useState(false);
//     const [showCityModal, setShowCityModal] = useState(false);
//     const [showRtoModal, setShowRtoModal] = useState(false);
//     const [showManufacturerModal, setShowManufacturerModal] = useState(false);
//     const [showModelModal, setShowModelModal] = useState(false);
//     const [showColorModal, setShowColorModal] = useState(false);
//     const [showSalesOfficerModal, setShowSalesOfficerModal] = useState(false);
//     const [showReferredByModal, setShowReferredByModal] = useState(false);
//     const [showRelationshipModal, setShowRelationshipModal] = useState(false);
//     const [showAttachQuotationModal, setShowAttachQuotationModal] = useState(false);
//     const [showCalendarModal, setShowCalendarModal] = useState(false);
//     const [selectedDate, setSelectedDate] = useState(new Date());

//     // Validation errors
//     const [nameError, setNameError] = useState('');
//     const [phoneError, setPhoneError] = useState('');
//     const [salesOfficerError, setSalesOfficerError] = useState('');
//     const [addressError, setAddressError] = useState('');
//     const [localityError, setLocalityError] = useState('');
//     const [pincodeError, setPincodeError] = useState('');
//     const [modelError, setModelError] = useState('');
//     const [bookingAmountError, setBookingAmountError] = useState('');

//     // Data fetching functions
//     const fetchCountries = async () => {
//         try {
//             const response = await getCountries();
//             if (response.data.code === 200 && response.data.data) {
//                 // Filter to only show India and set it as default
//                 const india = response.data.data.find((country: any) => country.name === 'India');
//                 if (india) {
//                     setCountries([india]);
//                     setCountry('India');
//                     // Fetch states for India
//                     fetchStates(india.id);
//                 } else {
//                     // Fallback to India only
//                     setCountries([{ id: '1', name: 'India' }]);
//                     setCountry('India');
//                     fetchStates('1');
//                 }
//             } else {
//                 // Fallback to India only
//                 setCountries([{ id: '1', name: 'India' }]);
//                 setCountry('India');
//                 fetchStates('1');
//             }
//         } catch (error) {
//             // Fallback to India only
//             setCountries([{ id: '1', name: 'India' }]);
//             setCountry('India');
//             fetchStates('1');
//         }
//     };

//     const fetchStates = async (countryId: string) => {
//         try {
//             const response = await getStates(countryId);
//             if (response.data.code === 200 && response.data.data) {
//                 setStates(response.data.data);
//             } else {
//                 setStates([]);
//             }
//         } catch (error) {
//             toast.error('Failed to load states');
//             setStates([]);
//         }
//     };

//     const fetchCities = async (stateId: string) => {
//         try {
//             const response = await getCities(stateId);
//             if (response.data.code === 200 && response.data.data) {
//                 setCities(response.data.data);
//             } else {
//                 setCities([]);
//             }
//         } catch (error) {
//             toast.error('Failed to load cities');
//             setCities([]);
//         }
//     };

//     const fetchRtos = async () => {
//         try {
//             // Temporarily using mock data
//             const mockRtos = [
//                 { id: '1', name: 'RTO Bangalore' },
//                 { id: '2', name: 'RTO Mumbai' },
//                 { id: '3', name: 'RTO Chennai' },
//             ];
//             setRtos(mockRtos);
            
//             // Uncomment when API is working:
//             // const response = await fetch('https://test.autocloud.in/api/rto/get', {
//             //     method: 'POST',
//             //     headers: { 'Content-Type': 'application/json' },
//             //     body: JSON.stringify({ page: 1, size: 100, searchString: '' })
//             // });
//             // const data = await response.json();
//             // if (data.code === 200) {
//             //     setRtos(data.response.data || []);
//             // } else {
//             //     setRtos([]);
//             // }
//         } catch (error) {
//             console.error('Error fetching RTOs:', error);
//             setRtos([]);
//         }
//     };

//     const fetchManufacturers = async (branchId: string = '1') => {
//         try {
//             // Temporarily using mock data
//             const mockManufacturers = [
//                 { id: '1', name: 'India Yamaha Motors Private Limited' },
//                 { id: '2', name: 'Hero MotoCorp' },
//                 { id: '3', name: 'Honda Motorcycle' },
//             ];
//             setManufacturers(mockManufacturers);
            
//             // Uncomment when API is working:
//             // const response = await fetch(`https://test.autocloud.in/api/manufacturer/branch/${branchId}`);
//             // const data = await response.json();
//             // if (data.code === 200) {
//             //     setManufacturers(data.response.data || []);
//             // } else {
//             //     setManufacturers([]);
//             // }
//         } catch (error) {
//             console.error('Error fetching manufacturers:', error);
//             setManufacturers([]);
//         }
//     };

//     const fetchModels = async (manufacturerId: string) => {
//         try {
//             // Temporarily using mock data
//             const mockModels = [
//                 { id: '1', name: 'FZ-S Fi' },
//                 { id: '2', name: 'MT-15' },
//                 { id: '3', name: 'R15' },
//             ];
//             setModels(mockModels);
            
//             // Uncomment when API is working:
//             // const response = await fetch(`https://test.autocloud.in/api/vehicleMaster/${manufacturerId}`);
//             // const data = await response.json();
//             // if (data.code === 200) {
//             //     setModels(data.response.data || []);
//             // } else {
//             //     setModels([]);
//             // }
//         } catch (error) {
//             console.error('Error fetching models:', error);
//             setModels([]);
//         }
//     };

//     const fetchColors = async () => {
//         try {
//             // Temporarily using mock data
//             const mockColors = [
//                 { id: '1', name: 'Black', code: '#000000' },
//                 { id: '2', name: 'Blue', code: '#0066CC' },
//                 { id: '3', name: 'Red', code: '#CC0000' },
//             ];
//             setColors(mockColors);
            
//             // Uncomment when API is working:
//             // const response = await fetch('https://test.autocloud.in/api/vehicleMaster/get', {
//             //     method: 'POST',
//             //     headers: { 'Content-Type': 'application/json' },
//             //     body: JSON.stringify({ page: 1, size: 100, searchString: '' })
//             // });
//             // const data = await response.json();
//             // if (data.code === 200) {
//             //     const vehicleData = data.response.data || [];
//             //     const uniqueColors = [...new Set(vehicleData.map((v: any) => v.color).filter(Boolean))];
//             //     setColors(uniqueColors.map((color: any, index: number) => ({
//             //         id: index.toString(),
//             //         name: color.name || color,
//             //         code: color.code || '#000000'
//             //     })));
//             // } else {
//             //     setColors([]);
//             // }
//         } catch (error) {
//             console.error('Error fetching colors:', error);
//             setColors([]);
//         }
//     };

//     const fetchSalesOfficers = async (branchId: string = '1') => {
//     console.log('🚀 Starting fetchSalesOfficers with branchId:', branchId);
//     try {
//         // Simplified approach: just use getUsers API like other dropdowns
//         console.log('👥 Calling getUsers for sales_executives...');
//         const response = await getUsers({
//             branch: branchId,
//             role: 'sales_executive'
//         });
        
//         console.log('📄 getUsers response:', response.data);
        
//         // Fix: The users are in response.response.data.users, not response.data.data
//         if (response.data.response && response.data.response.data && response.data.response.data.users) {
//             const salesExecutives = response.data.response.data.users;
//             console.log('📊 Found sales executives:', salesExecutives.length);
//             console.log('👤 Sales executives data:', salesExecutives.map((u: any) => ({ 
//                 id: u.id, 
//                 name: u.name || u.profile?.employeeName 
//             })));
            
//             setSalesOfficers(salesExecutives);
//         } else {
//             console.log('⚠️ No sales executives found, response structure:', response.data);
//             setSalesOfficers([]);
//         }
//     } catch (error) {
//         console.error('❌ Failed to load sales officers:', error);
//         setSalesOfficers([]);
//     }
// };

// const fetchReferredByOptions = async () => {
//     try {
//         // Use the same API as web project: /api/options/get/
//         const response = await platformApi.post('/api/options/get/', {
//             module: "customers",
//             column: "name",
//             searchString: "", // Empty string to get all
//             fields: ["contacts{phone}"],
//             size: 20,
//             page: 1
//         });
        
//         if (response.data.code === 200 && response.data.response) {
//             // Format the same way as web project: phone - name
//             const employees = response.data.response.map((customer: any) => ({
//                 id: customer.id,
//                 name: customer.contacts && customer.contacts[0] 
//                     ? `${customer.contacts[0].phone} - ${customer.name}`
//                     : customer.name
//             }));
//             console.log('✅ Loaded referred by options:', employees.length);
//             setReferredByOptions(employees);
//         } else {
//             console.log('⚠️ No referred by data found');
//             setReferredByOptions([]);
//         }
//     } catch (error) {
//         console.error('Failed to load referred by options:', error);
//         setReferredByOptions([]);
//     }
// };

// const fetchRelationshipOptions = async () => {
//     try {
//         const mockRelationships = [
//             { id: '1', name: 'Father' },
//             { id: '2', name: 'Mother' },
//             { id: '3', name: 'Brother' },
//             { id: '4', name: 'Sister' },
//             { id: '5', name: 'Wife' },
//             { id: '6', name: 'Husband' },
//             { id: '7', name: 'Son' },
//             { id: '8', name: 'Daughter' },
//             { id: '9', name: 'Mother-in-law' },
//             { id: '10', name: 'Father-in-law' },
//             { id: '11', name: 'Sister-in-law' },
//             { id: '12', name: 'Brother-in-law' },
//             { id: '13', name: 'Daughter-in-law' },
//             { id: '14', name: 'Brother-in-law' },
//         ];
//         setRelationshipOptions(mockRelationships);
//     } catch (error) {
//         console.error('Error fetching relationship options:', error);
//     }
// };

// const fetchBranches = async () => {
//     try {
//         console.log('🏢 Fetching branches...');
//         const response = await getBranches();
//         console.log('📄 Branches response:', response.data);
        
//         if (response.data.code === 200 && response.data.data) {
//             const branchesData = response.data.data;
//             console.log('📊 Found branches:', branchesData.length);
//             console.log('🏢 Branches data:', branchesData);
//             setBranches(branchesData);
            
//             // Set default branch to first branch if available
//             if (branchesData.length > 0) {
//                 const defaultBranch = branchesData[0];
//                 console.log('🎯 Setting default branch:', defaultBranch.name);
//                 setBranch(defaultBranch.name);
//             }
//         } else {
//             console.log('⚠️ No branches found, using mock data');
//             // Fallback to mock data if API fails
//             const mockBranches = [
//                 { id: '1', name: 'Devanahalli' },
//                 { id: '2', name: 'Doddaballapura' }
//             ];
//             setBranches(mockBranches);
//             setBranch('Devanahalli'); // Set default
//         }
//     } catch (error) {
//         console.error('❌ Failed to load branches, using mock data:', error);
//         // Fallback to mock data if API fails
//         const mockBranches = [
//             { id: '1', name: 'Devanahalli' },
//             { id: '2', name: 'Doddaballapura' }
//         ];
//         setBranches(mockBranches);
//         setBranch('Devanahalli'); // Set default
//     }
// };

//     // Initialize data on component mount
//     React.useEffect(() => {
//         console.log('🚀 Component mounted - loading only dropdown data, no auto-fill');
        
//         // Only load dropdown data on mount, don't auto-fill any customer fields
//         fetchCountries();
//         fetchRtos();
//         fetchManufacturers('1'); // Default branch ID
//         fetchColors();
//         fetchSalesOfficers('1'); // Default branch ID
//         fetchReferredByOptions();
//         fetchRelationshipOptions();
//         fetchBranches();
        
//         // Generate Customer ID only (don't fetch customer data)
//         generateNewCustomerId();
//     }, []);

//     // Vehicle Data
//     const [manufacturer, setManufacturer] = useState('');
//     const [model, setModel] = useState('');
//     const [rto, setRto] = useState('');
//     const [color, setColor] = useState('');
//     const [vehicleColor, setVehicleColor] = useState('');
//     const [accessories, setAccessories] = useState([] as any[]);
//     const [totalDiscount, setTotalDiscount] = useState('');
//     const [accessoriesTotal, setAccessoriesTotal] = useState('');
//     const [accessoriesAfterDiscount, setAccessoriesAfterDiscount] = useState('');
//     const [exchangeModel, setExchangeModel] = useState('');
//     const [exchangePrice, setExchangePrice] = useState('');
//     const [onRoadPrice, setOnRoadPrice] = useState('');
//     const [tempRegCharges, setTempRegCharges] = useState('');
//     const [hypothecationCharges, setHypothecationCharges] = useState('');
//     const [numberPlateCharges, setNumberPlateCharges] = useState('');
//     const [affidavitAmount, setAffidavitAmount] = useState('');
//     const [specialNoCharges, setSpecialNoCharges] = useState('');
//     const [onRoadDiscount, setOnRoadDiscount] = useState('');
//     const [expectedDelivery, setExpectedDelivery] = useState('');
//     const [finalAmount, setFinalAmount] = useState('');

//     // Payment Data
//     const [financer, setFinancer] = useState('');
//     const [loanType, setLoanType] = useState('');
//     const [financierBranch, setFinancierBranch] = useState('');
//     const [paymentHypothecation, setPaymentHypothecation] = useState('');
//     const [remarks, setRemarks] = useState('');
//     const [netReceivables, setNetReceivables] = useState('');

//     const handleClose = () => {
//         navigation.goBack();
//     };

//     // Handle quotation attachment
//     const handleAttachQuotation = (selectedQuotations: string[]) => {
//         if (selectedQuotations.length > 0) {
//             // The selectedQuotations array contains database IDs, but we need to get the actual quotation IDs
//             // For now, we'll use the selected IDs as quotation IDs since the modal should return quotationId
//             const quotationIds = selectedQuotations.join(', ');
//             setQuotationsAssociated(quotationIds);
//             toast.success(`Attached ${selectedQuotations.length} quotation(s)`);
//         }
//         setShowAttachQuotationModal(false);
//     };

//     const handleLinkQuotationPress = () => {
//         setShowAttachQuotationModal(true);
//     };

//     // Date handling functions
//     const handleDateSelect = (date: Date) => {
//         setSelectedDate(date);
//         const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
//         setDob(formattedDate);
        
//         // Calculate age
//         const today = new Date();
//         const birthDate = new Date(date);
//         let age = today.getFullYear() - birthDate.getFullYear();
//         const monthDiff = today.getMonth() - birthDate.getMonth();
//         if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
//             age--;
//         }
//         setAge(age.toString());
//         setShowCalendarModal(false);
//     };

//     const openCalendar = () => {
//         setShowCalendarModal(true);
//     };

//     // Customer ID Generation function
//     const generateNewCustomerId = async () => {
//         try {
//             console.log('🔍 Generating customer ID...');
//             const response = await generateCustomerId();
//             console.log('📄 Customer ID response:', response.data);
            
//             if (response.data.code === 200) {
//                 // Fix: Handle different response structures
//                 let customerId = '';
//                 if (response.data.response && response.data.response.data) {
//                     customerId = response.data.response.data;
//                 } else if (response.data.data) {
//                     customerId = response.data.data;
//                 } else if (response.data.response && response.data.response.data && response.data.response.data.customerId) {
//                     customerId = response.data.response.data.customerId;
//                 }
                
//                 if (customerId) {
//                     console.log('✅ Generated Customer ID:', customerId);
//                     setGeneratedCustomerId(customerId);
//                 } else {
//                     console.log('❌ Could not extract Customer ID from response');
//                     setGeneratedCustomerId('CNB' + Math.floor(Math.random() * 100000));
//                 }
//             } else {
//                 console.log('❌ Failed to generate customer ID:', response.data);
//                 setGeneratedCustomerId('CNB' + Math.floor(Math.random() * 100000));
//             }
//         } catch (error) {
//             console.error('❌ Error generating customer ID:', error);
//             setGeneratedCustomerId('CNB' + Math.floor(Math.random() * 100000));
//             toast.error('Failed to generate customer ID');
//         }
//     };

//     // Fetch customer data by phone number (like Follow Ups page)
//     const fetchCustomerData = async () => {
//         try {
//             if (phone) {
//                 console.log('🔍 Fetching customer data for phone:', phone);
//                 const customerRes = await getCustomerByPhoneNo(phone);
//                 const customersData = (customerRes.data?.response?.data?.customers as any[]) || [];
                
//                 if (customersData.length > 0) {
//                     const customer = customersData[0];
//                     console.log('✅ Found customer data:', customer);
//                     setCustomerData(customer);
                    
//                     // Use the same logic as Follow Ups page: customerId || id
//                     const displayCustomerId = customer.customerId || customer.id;
//                     console.log('🎯 Setting Customer ID from customer data:', displayCustomerId);
//                     setGeneratedCustomerId(displayCustomerId);
                    
//                     // Auto-fill all customer fields
//                     autoFillCustomerFields(customer);
//                 } else {
//                     console.log('🔄 No customer found, generating new ID...');
//                     generateNewCustomerId();
//                 }
//             }
//         } catch (error) {
//             console.error('❌ Error fetching customer data:', error);
//             generateNewCustomerId();
//         }
//     };

//     // Auto-fill customer fields when existing customer is found
//     const autoFillCustomerFields = (customer: any) => {
//         console.log('🔄 Auto-filling customer fields...');
//         console.log('📋 Full customer data:', JSON.stringify(customer, null, 2));
        
//         // Skip Branch - user will select from dropdown
        
//         // Customer Name
//         if (customer.name) {
//             console.log('👤 Setting Customer Name:', customer.name);
//             setCustomerFullName(customer.name);
//         } else {
//             console.log('❌ Customer Name not found in customer data');
//         }
        
//         // Father's Name
//         if (customer.fatherName) {
//             console.log('👨 Setting Father Name:', customer.fatherName);
//             setFatherName(customer.fatherName);
//         } else {
//             console.log('❌ Father Name not found in customer data');
//         }
        
//         // Address fields
//         if (customer.address) {
//             console.log('🏠 Address data found:', customer.address);
            
//             // Address Line 1
//             if (customer.address.line1) {
//                 console.log('📍 Setting Address Line 1:', customer.address.line1);
//                 setAddress(customer.address.line1);
//             } else {
//                 console.log('❌ Address Line 1 not found');
//             }
            
//             // Address Line 2
//             if (customer.address.line2) {
//                 console.log('📍 Setting Address Line 2:', customer.address.line2);
//                 setAddress2(customer.address.line2);
//             } else {
//                 console.log('❌ Address Line 2 not found');
//             }
            
//             // Address Line 3
//             if (customer.address.line3) {
//                 console.log('📍 Setting Address Line 3:', customer.address.line3);
//                 setAddress3(customer.address.line3);
//             } else {
//                 console.log('❌ Address Line 3 not found');
//             }
            
//             // Locality
//             if (customer.address.locality) {
//                 console.log('🏘️ Setting Locality:', customer.address.locality);
//                 setLocality(customer.address.locality);
//             } else {
//                 console.log('❌ Locality not found');
//             }
            
//             // Pincode
//             if (customer.address.pincode) {
//                 console.log('📮 Setting Pincode:', customer.address.pincode);
//                 setPincode(customer.address.pincode);
//             } else {
//                 console.log('❌ Pincode not found');
//             }
//         } else {
//             console.log('❌ Address data not found in customer data');
//         }
        
//         // Country
//         if (customer.address?.country?.name) {
//             console.log('🌍 Setting Country:', customer.address.country.name);
//             setCountry(customer.address.country.name);
//             // Fetch states for this country
//             if (customer.address.country.id) {
//                 console.log('🔄 Fetching states for country ID:', customer.address.country.id);
//                 fetchStates(customer.address.country.id);
//             }
//         } else {
//             console.log('❌ Country not found in customer data');
//         }
        
//         // State
//         if (customer.address?.state?.name) {
//             console.log('🗺️ Setting State:', customer.address.state.name);
//             setStateVal(customer.address.state.name);
//             // Fetch cities for this state
//             if (customer.address.state.id) {
//                 console.log('🔄 Fetching cities for state ID:', customer.address.state.id);
//                 fetchCities(customer.address.state.id);
//             }
//         } else {
//             console.log('❌ State not found in customer data');
//         }
        
//         // City
//         if (customer.address?.city?.name) {
//             console.log('🏙️ Setting City:', customer.address.city.name);
//             setCity(customer.address.city.name);
//         } else {
//             console.log('❌ City not found in customer data');
//         }
        
//         // DOB
//         if (customer.dateOfBirth) {
//             const dob = new Date(customer.dateOfBirth).toISOString().split('T')[0];
//             console.log('🎂 Setting DOB:', dob);
//             setDob(dob);
//             // Calculate age
//             const today = new Date();
//             const birthDate = new Date(customer.dateOfBirth);
//             let age = today.getFullYear() - birthDate.getFullYear();
//             const monthDiff = today.getMonth() - birthDate.getMonth();
//             if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
//                 age--;
//             }
//             console.log('👶 Setting calculated Age:', age);
//             setAge(age.toString());
//         } else {
//             console.log('❌ DOB not found in customer data');
//         }
        
//         // Quotations Associated
//         if (customer.quotation && customer.quotation.length > 0) {
//             const quotationIds = customer.quotation.map((q: any) => q.quotationId).join(', ');
//             console.log('📄 Setting Quotations Associated:', quotationIds);
//             setQuotationsAssociated(quotationIds);
//         } else {
//             console.log('❌ Quotations not found in customer data');
//         }
        
//         console.log('✅ Customer fields auto-fill process completed');
//     };

//     // Handle phone number change with auto-fill
//     const handlePhoneChange = (phone: string) => {
//         setPhone(phone);
        
//         // Check if phone number is 10 digits, then search for existing customer
//         if (phone.length === 10) {
//             console.log('📞 Phone number is 10 digits, checking for existing customer...');
//             fetchCustomerData();
//         }
//     };

//     const handleNext = () => {
//         if (activeTab === 'customer') {
//             // reset errors
//             setNameError('');
//             setPhoneError('');
//             setAddressError('');
//             setLocalityError('');
//             setPincodeError('');
//             setSalesOfficerError('');

//             let hasError = false;
//             if (!customerFullName) {
//                 setNameError('Required');
//                 hasError = true;
//             }
//             if (!phone) {
//                 setPhoneError('Required');
//                 hasError = true;
//             }
//             if (!address) {
//                 setAddressError('Required');
//                 hasError = true;
//             }
//             if (!locality) {
//                 setLocalityError('Required');
//                 hasError = true;
//             }
//             if (!pincode) {
//                 setPincodeError('Required');
//                 hasError = true;
//             }
//             if (!salesOfficer) {
//                 setSalesOfficerError('Required');
//                 hasError = true;
//             }
//             if (hasError) return;

//             setActiveTab('vehicle');
//         } else if (activeTab === 'vehicle') {
//             if (!model) {
//                 toast.error('Please select a vehicle model');
//                 return;
//             }
//             setActiveTab('payment');
//         }
//     };

//     const handleBack = () => {
//         if (activeTab === 'payment') {
//             setActiveTab('vehicle');
//         } else if (activeTab === 'vehicle') {
//             setActiveTab('customer');
//         }
//     };

//     const handleSaveComplete = () => {
//         toast.success('Booking registered successfully');
//         navigation.goBack();
//     };

//     return (
//         <SafeAreaView className="flex-1 bg-gray-50">
//             {/* Header */}
//             <View className="bg-white border-b border-gray-100 px-4 py-4 flex-row items-center justify-between">
//                 <View className="flex-row items-center flex-1">
//                     <TouchableOpacity onPress={handleClose} className="mr-3">
//                         <ChevronLeft size={24} color={COLORS.gray[900]} />
//                     </TouchableOpacity>
//                     <Text className="text-gray-900 text-lg font-bold">Booking Register</Text>
//                 </View>
//             </View>

//             {/* Booking Info (styled like quotation card) */}
//             <View className="mt-2 bg-white rounded-xl border border-gray-100 p-4 mb-2 w-[330px] self-center">
//                 <View className="flex-row justify-between items-center mb-3">
//                     <Text className="text-gray-500 text-sm">Booking Id:</Text>
//                     <Text className="text-teal-600 font-bold text-sm">New</Text>
//                 </View>
//                 <View className="flex-row justify-between items-center">
//                     <Text className="text-gray-500 text-sm">Customer Id:</Text>
//                     <Text className="text-gray-900 text-sm font-medium">
//                         {(() => {
//                             console.log('🎨 Rendering Customer ID:', { generatedCustomerId });
//                             // Always show the generated Customer ID
//                             return generatedCustomerId || 'Loading...';
//                         })()}
//                     </Text>
//                 </View>
//             </View>

//             {/* Tabs */}
//             <View className="w-[340px] self-center rounded-l  bg-white border-b border-gray-100">
//                 <View className="flex-row items-center px-4">
//                     {/* Customer Tab */}
//                     <TouchableOpacity
//                         onPress={() => setActiveTab('customer')}
//                         className={`flex-1 py-3 flex-row items-center justify-center gap-2 border-b-2 ${activeTab === 'customer'
//                             ? 'border-teal-600'
//                             : 'border-transparent'
//                             }`}
//                     >
//                         <Text
//                             className={`text-sm font-medium ${activeTab === 'customer'
//                                 ? 'text-teal-600'
//                                 : 'text-gray-600'
//                                 }`}
//                         >
//                             Customer
//                         </Text>
//                     </TouchableOpacity>

//                     <ChevronRight size={16} color={COLORS.gray[400]} />

//                     {/* Vehicle Tab */}
//                     <TouchableOpacity
//                         onPress={() => setActiveTab('vehicle')}
//                         className={`flex-1 py-3 flex-row items-center justify-center gap-2 border-b-2 ${activeTab === 'vehicle'
//                             ? 'border-teal-600'
//                             : 'border-transparent'
//                             }`}
//                     >
//                         <Text
//                             className={`text-sm font-medium ${activeTab === 'vehicle'
//                                 ? 'text-teal-600'
//                                 : 'text-gray-600'
//                                 }`}
//                         >
//                             Vehicle
//                         </Text>
//                     </TouchableOpacity>

//                     <ChevronRight size={16} color={COLORS.gray[400]} />

//                     {/* Payment Tab */}
//                     <TouchableOpacity
//                         onPress={() => setActiveTab('payment')}
//                         className={`flex-1 py-3 flex-row items-center justify-center gap-2 border-b-2 ${activeTab === 'payment'
//                             ? 'border-teal-600'
//                             : 'border-transparent'
//                             }`}
//                     >
//                         <Text
//                             className={`text-sm font-medium ${activeTab === 'payment'
//                                 ? 'text-teal-600'
//                                 : 'text-gray-600'
//                                 }`}
//                         >
//                             Payment
//                         </Text>
//                     </TouchableOpacity>
//                 </View>
//             </View>

//             {/* Content */}
//             <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
//                 <ScrollView
//                     className="flex-1"
//                     showsVerticalScrollIndicator={false}
//                     contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
//                 >
//                     <View className="bg-white rounded-xl border border-gray-100 p-4">
//                         {activeTab === 'customer' && (
//                             <View>
//                                 <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
//                                     Customer Information
//                                 </Text>

//                                 <View className="mb-4">
//                                     <FormLabel label="Branch" required />
//                                     <TouchableOpacity
//                                         onPress={() => setShowBranchModal(true)}
//                                         className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
//                                     >
//                                         <Text className="text-gray-800 flex-1">
//                                             {branch || 'Select Branch'}
//                                         </Text>
//                                         <ChevronRight size={16} color={COLORS.gray[400]} />
//                                     </TouchableOpacity>
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="Customer Name" required />
//                                     <TextInput
//                                         value={customerFullName}
//                                         onChangeText={setCustomerFullName}
//                                         placeholder="Enter customer name"
//                                         className={`h-12 bg-white border rounded-lg px-3 text-gray-800 ${nameError ? 'border-red-500' : 'border-gray-300'}`}
//                                     />
//                                     {nameError ? <Text className="text-red-500 text-xs mt-1">{nameError}</Text> : null}
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="Phone" required />
//                                     <View className="flex-row gap-2">
//                                         <View className="w-16 h-12 bg-gray-100 border border-gray-200 rounded-lg items-center justify-center">
//                                             <Text className="text-gray-700 font-medium">+91</Text>
//                                         </View>
//                                         <TextInput
//                                             value={phone}
//                                             onChangeText={handlePhoneChange}
//                                             placeholder="Enter phone number"
//                                             keyboardType="phone-pad"
//                                             className={`flex-1 h-12 bg-white border rounded-lg px-3 text-gray-800 ${phoneError ? 'border-red-500' : 'border-gray-300'}`}
//                                         />
//                                         {phoneError ? <Text className="text-red-500 text-xs mt-1">{phoneError}</Text> : null}
//                                     </View>
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="Father's Name" required/>
//                                     <TextInput
//                                         value={fatherName}
//                                         onChangeText={setFatherName}
//                                         placeholder="Enter father's name"
//                                         className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                     />
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="Address Line 1" required />
//                                     <TextInput
//                                         value={address}
//                                         onChangeText={setAddress}
//                                         placeholder="Address Line 1"
//                                         className={`h-12 bg-white border rounded-lg px-3 text-gray-800 ${addressError ? 'border-red-500' : 'border-gray-300'}`}
//                                     />
//                                     {addressError ? <Text className="text-red-500 text-xs mt-1">{addressError}</Text> : null}
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="Address Line 2" />
//                                     <TextInput
//                                         value={address2}
//                                         onChangeText={setAddress2}
//                                         placeholder="Address Line 2"
//                                         className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                     />
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="Address Line 3" />
//                                     <TextInput
//                                         value={address3}
//                                         onChangeText={setAddress3}
//                                         placeholder="Address Line 3"
//                                         className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                     />
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="Locality" required />
//                                     <TextInput
//                                         value={locality}
//                                         onChangeText={setLocality}
//                                         placeholder="Locality"
//                                         className={`h-12 bg-white border rounded-lg px-3 text-gray-800 ${localityError ? 'border-red-500' : 'border-gray-300'}`}
//                                     />
//                                     {localityError ? <Text className="text-red-500 text-xs mt-1">{localityError}</Text> : null}
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="Country" required />
//                                     <TouchableOpacity 
//                                         onPress={() => setShowCountryModal(true)}
//                                         className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
//                                     >
//                                         <Text className="text-gray-800 flex-1">
//                                             {country || 'Select Country'}
//                                         </Text>
//                                         <ChevronRight size={16} color={COLORS.gray[400]} />
//                                     </TouchableOpacity>
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="State" required />
//                                     <TouchableOpacity 
//                                         onPress={() => setShowStateModal(true)}
//                                         className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
//                                     >
//                                         <Text className="text-gray-800 flex-1">
//                                             {stateVal || 'Select State'}
//                                         </Text>
//                                         <ChevronRight size={16} color={COLORS.gray[400]} />
//                                     </TouchableOpacity>
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="City" required />
//                                     <TouchableOpacity 
//                                         onPress={() => setShowCityModal(true)}
//                                         className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
//                                     >
//                                         <Text className="text-gray-800 flex-1">
//                                             {city || 'Select City'}
//                                         </Text>
//                                         <ChevronRight size={16} color={COLORS.gray[400]} />
//                                     </TouchableOpacity>
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="Pincode" required />
//                                     <TextInput
//                                         value={pincode}
//                                         onChangeText={setPincode}
//                                         placeholder="Pincode"
//                                         keyboardType="number-pad"
//                                         className={`h-12 bg-white border rounded-lg px-3 text-gray-800 ${pincodeError ? 'border-red-500' : 'border-gray-300'}`}
//                                     />
//                                     {pincodeError ? <Text className="text-red-500 text-xs mt-1">{pincodeError}</Text> : null}
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="Email" />
//                                     <TextInput
//                                         value={email}
//                                         onChangeText={setEmail}
//                                         placeholder="Email"
//                                         keyboardType="email-address"
//                                         className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                     />
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="DOB" required/>
//                                     <View className="flex-row items-center">
//                                         <TextInput
//                                             value={dob}
//                                             onChangeText={setDob}
//                                             placeholder="DD/MM/YYYY"
//                                             className="flex-1 h-12 bg-white border border-gray-300 rounded-l-lg px-3 text-gray-800"
//                                         />
//                                         <TouchableOpacity 
//                                             onPress={openCalendar}
//                                             className="h-12 bg-teal-600 rounded-r-lg px-4 justify-center"
//                                         >
//                                             <Calendar size={20} color="white" />
//                                         </TouchableOpacity>
//                                     </View>
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="Age" required/>
//                                     <TextInput
//                                         value={age}
//                                         onChangeText={setAge}
//                                         placeholder="Age"
//                                         keyboardType="numeric"
//                                         className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                     />
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="Referred By" />
//                                     <TouchableOpacity 
//                                         onPress={() => setShowReferredByModal(true)}
//                                         className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
//                                     >
//                                         <Text className="text-gray-800 flex-1">
//                                             {referredBy || 'Select Referred By'}
//                                         </Text>
//                                         <ChevronRight size={16} color={COLORS.gray[400]} />
//                                     </TouchableOpacity>
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="Relationship" required />
//                                     <TouchableOpacity 
//                                         onPress={() => setShowRelationshipModal(true)}
//                                         className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
//                                     >
//                                         <Text className="text-gray-800 flex-1">
//                                             {relationship || 'Select Relationship'}
//                                         </Text>
//                                         <ChevronRight size={16} color={COLORS.gray[400]} />
//                                     </TouchableOpacity>
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="Nominee Details" required/>
//                                     <TextInput
//                                         value={nominee}
//                                         onChangeText={setNominee}
//                                         placeholder="Nominee"
//                                         className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                     />
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="Sales Officer" required />
//                                     <TouchableOpacity 
//                                         onPress={() => setShowSalesOfficerModal(true)}
//                                         className={`h-12 bg-white border rounded-lg px-3 flex-row items-center justify-between ${salesOfficerError ? 'border-red-500' : 'border-gray-300'}`}
//                                     >
//                                         <Text className="text-gray-800 flex-1">
//                                             {salesOfficer || 'Select Sales Officer'}
//                                         </Text>
//                                         <ChevronRight size={16} color={COLORS.gray[400]} />
//                                     </TouchableOpacity>
//                                     {salesOfficerError ? <Text className="text-red-500 text-xs mt-1">{salesOfficerError}</Text> : null}
//                                 </View>

//                                 <View className="mb-4">
//                                     <View className="flex-row items-center justify-between mb-2">
//                                         <FormLabel label="Quotations Associated" />
//                                         <TouchableOpacity 
//                                             onPress={handleLinkQuotationPress}
//                                             className="px-3 py-1 bg-teal-600 rounded-lg"
//                                         >
//                                             <Text className="text-white text-xs font-medium">Link Quotation</Text>
//                                         </TouchableOpacity>
//                                     </View>
//                                     {quotationsAssociated ? (
//                                         <View className="flex-row flex-wrap gap-2 p-3 bg-gray-100 border border-gray-300 rounded-lg min-h-[48px]">
//                                             {quotationsAssociated.split(',').map((quotationId, index) => (
//                                                 <View 
//                                                     key={index}
//                                                     className="px-3 py-1 bg-gray-400 rounded-full"
//                                                 >
//                                                     <Text className="text-white text-sm font-medium">{quotationId.trim()}</Text>
//                                                 </View>
//                                             ))}
//                                         </View>
//                                     ) : (
//                                         <View className="h-12 bg-gray-100 border border-gray-300 rounded-lg px-3 justify-center">
//                                             <Text className="text-gray-500 text-sm">No quotations linked</Text>
//                                         </View>
//                                     )}
//                                 </View>
//                             </View>
//                         )}

//                         {activeTab === 'vehicle' && (
//                             <View>
//                                 <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
//                                     Vehicle Information
//                                 </Text>

//                                 <View className="mb-4">
//                                     <FormLabel label="Manufacturer" required />
//                                     <TouchableOpacity
//                                         onPress={() => setShowManufacturerModal(true)}
//                                         className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
//                                     >
//                                         <Text className="text-gray-800 flex-1">
//                                             {manufacturer || 'Select Manufacturer'}
//                                         </Text>
//                                         <ChevronRight size={16} color={COLORS.gray[400]} />
//                                     </TouchableOpacity>
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="Model Name" required />
//                                     <TouchableOpacity
//                                         onPress={() => setShowModelModal(true)}
//                                         className={`h-12 bg-white border rounded-lg px-3 flex-row items-center justify-between ${modelError ? 'border-red-500' : 'border-gray-300'}`}
//                                     >
//                                         <Text className="text-gray-800 flex-1">
//                                             {model || 'Select Model'}
//                                         </Text>
//                                         <ChevronRight size={16} color={COLORS.gray[400]} />
//                                     </TouchableOpacity>
//                                     {modelError ? <Text className="text-red-500 text-xs mt-1">{modelError}</Text> : null}
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="RTO" required />
//                                     <TouchableOpacity
//                                         onPress={() => setShowRtoModal(true)}
//                                         className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
//                                     >
//                                         <Text className="text-gray-800 flex-1">
//                                             {rto || 'Select RTO'}
//                                         </Text>
//                                         <ChevronRight size={16} color={COLORS.gray[400]} />
//                                     </TouchableOpacity>
//                                 </View>

//                                 <View className="mb-4">
//                                     <FormLabel label="Vehicle Color" />
//                                     <View className="flex-row gap-2 items-center">
//                                         <View className="flex-1 h-12 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex-row items-center">
//                                             <Text className="text-gray-500">{vehicleColor || 'No Vehicle chosen'}</Text>
//                                         </View>
//                                         <Button title="Select Vehicle Color" onPress={() => { }} />
//                                     </View>
//                                 </View>

//                                 {/* Accessories placeholder */}
//                                 <View className="mb-6 border rounded overflow-hidden">
//                                     <View className="w-full py-12 text-center text-gray-400">
//                                         <Text className="text-4xl">📦</Text>
//                                         <Text>No Data</Text>
//                                     </View>
//                                 </View>

//                                 {/* Totals row */}
//                                 <View className="mb-6">
//                                     <View className="mb-4">
//                                         <FormLabel label="Total Discount" />
//                                         <View className="flex-row gap-2">
//                                             <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
//                                             <TextInput
//                                                 value={totalDiscount}
//                                                 onChangeText={setTotalDiscount}
//                                                 placeholder="Total Discount"
//                                                 keyboardType="numeric"
//                                                 className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                             />
//                                         </View>
//                                     </View>
//                                     <View className="mb-4">
//                                         <FormLabel label="Accessories Total" />
//                                         <View className="flex-row gap-2">
//                                             <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
//                                             <TextInput
//                                                 value={accessoriesTotal}
//                                                 onChangeText={setAccessoriesTotal}
//                                                 placeholder="Accessories Total"
//                                                 keyboardType="numeric"
//                                                 className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                             />
//                                         </View>
//                                     </View>
//                                     <View>
//                                         <FormLabel label="Accessories Total (after Discount)" />
//                                         <View className="flex-row gap-2">
//                                             <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
//                                             <TextInput
//                                                 value={accessoriesAfterDiscount}
//                                                 onChangeText={setAccessoriesAfterDiscount}
//                                                 placeholder="Accessories Totals(after Discount)"
//                                                 keyboardType="numeric"
//                                                 className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                             />
//                                         </View>
//                                     </View>
//                                     <TouchableOpacity className="mt-2">
//                                         <Text className="text-teal-600 text-sm">+Add/View Accessory</Text>
//                                     </TouchableOpacity>
//                                 </View>

//                                 {/* Exchange Vehicle Information */}
//                                 <View className="mb-6 border-t pt-6">
//                                     <Text className="text-base font-medium text-gray-700 mb-4">Exchange Vehicle Information</Text>
//                                     <View className="mb-4">
//                                         <FormLabel label="Exchange Model Name" />
//                                         <TextInput
//                                             value={exchangeModel}
//                                             onChangeText={setExchangeModel}
//                                             placeholder="Exchange Vehicle"
//                                             className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                         />
//                                     </View>
//                                     <View>
//                                         <FormLabel label="Exchange Price" />
//                                         <View className="flex-row gap-2">
//                                             <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
//                                             <TextInput
//                                                 value={exchangePrice}
//                                                 onChangeText={setExchangePrice}
//                                                 placeholder="Exchange Price"
//                                                 keyboardType="numeric"
//                                                 className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                             />
//                                         </View>
//                                     </View>
//                                 </View>

//                                 {/* Vehicle Charges */}
//                                 <View className="mb-6 border-t pt-6">
//                                     <Text className="text-base font-medium text-gray-700 mb-4">Vehicle Charges</Text>
//                                     <View className="mb-4">
//                                         <FormLabel label="On-Road Price" />
//                                         <View className="flex-row gap-2">
//                                             <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
//                                             <TextInput
//                                                 value={onRoadPrice}
//                                                 onChangeText={setOnRoadPrice}
//                                                 placeholder="On-Road Price"
//                                                 keyboardType="numeric"
//                                                 className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                             />
//                                         </View>
//                                     </View>
//                                     <View className="mb-4">
//                                         <FormLabel label="Temporary Registration Charges" />
//                                         <View className="flex-row gap-2">
//                                             <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
//                                             <TextInput
//                                                 value={tempRegCharges}
//                                                 onChangeText={setTempRegCharges}
//                                                 placeholder="Temporary Registration Charges"
//                                                 keyboardType="numeric"
//                                                 className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                             />
//                                         </View>
//                                     </View>
//                                     <View className="mb-4">
//                                         <FormLabel label="Hypothecation" />
//                                         <View className="flex-row gap-2">
//                                             <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
//                                             <TextInput
//                                                 value={hypothecationCharges}
//                                                 onChangeText={setHypothecationCharges}
//                                                 placeholder="Hypothecation"
//                                                 keyboardType="numeric"
//                                                 className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                             />
//                                         </View>
//                                     </View>
//                                     <View className="mb-4">
//                                         <FormLabel label="Number Plate Charges" />
//                                         <View className="flex-row gap-2">
//                                             <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
//                                             <TextInput
//                                                 value={numberPlateCharges}
//                                                 onChangeText={setNumberPlateCharges}
//                                                 placeholder="Number Plate Charges"
//                                                 keyboardType="numeric"
//                                                 className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                             />
//                                         </View>
//                                     </View>
//                                     <View className="mb-4">
//                                         <FormLabel label="Affidavit Amount" />
//                                         <View className="flex-row gap-2">
//                                             <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
//                                             <TextInput
//                                                 value={affidavitAmount}
//                                                 onChangeText={setAffidavitAmount}
//                                                 placeholder="Affidavit Amount"
//                                                 keyboardType="numeric"
//                                                 className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                             />
//                                         </View>
//                                     </View>
//                                     <View className="mb-4">
//                                         <FormLabel label="Special No. Charges" />
//                                         <View className="flex-row gap-2">
//                                             <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
//                                             <TextInput
//                                                 value={specialNoCharges}
//                                                 onChangeText={setSpecialNoCharges}
//                                                 placeholder="Special No. Charges"
//                                                 keyboardType="numeric"
//                                                 className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                             />
//                                         </View>
//                                     </View>
//                                     <View className="mb-4">
//                                         <FormLabel label="On Road Discount" />
//                                         <View className="flex-row gap-2">
//                                             <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
//                                             <TextInput
//                                                 value={onRoadDiscount}
//                                                 onChangeText={setOnRoadDiscount}
//                                                 placeholder="Final Discount (for On-Road)"
//                                                 keyboardType="numeric"
//                                                 className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                             />
//                                         </View>
//                                     </View>
//                                     <View className="mb-4">
//                                         <FormLabel label="Expected Delivery Date" />
//                                         <TextInput
//                                             value={expectedDelivery}
//                                             onChangeText={setExpectedDelivery}
//                                             placeholder="YYYY-MM-DD"
//                                             className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                         />
//                                     </View>
//                                     <View>
//                                         <FormLabel label="Final Amount" />
//                                         <View className="flex-row gap-2">
//                                             <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
//                                             <TextInput
//                                                 value={finalAmount}
//                                                 editable={false}
//                                                 placeholder="0"
//                                                 className="flex-1 h-12 bg-gray-50 border border-gray-300 rounded-lg px-3 text-gray-800"
//                                             />
//                                         </View>
//                                     </View>
//                                 </View>
//                             </View>
//                         )}

//                         {activeTab === 'payment' && (
//                             <View>
//                                 <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
//                                     Payment Information
//                                 </Text>

//                                 <View className="mb-4">
//                                     <FormLabel label="Payment Mode" required />
//                                     <View className="h-12 border border-gray-300 rounded-lg overflow-hidden bg-white">
//                                         <View className="flex-row">
//                                             <TouchableOpacity
//                                                 onPress={() => setPaymentMode('cash')}
//                                                 className={`flex-1 h-12 justify-center items-center ${paymentMode === 'cash' ? 'bg-teal-50' : 'bg-white'}`}
//                                             >
//                                                 <Text className={paymentMode === 'cash' ? 'text-teal-700 font-medium' : 'text-gray-600'}>Cash</Text>
//                                             </TouchableOpacity>
//                                             <View className="w-[1px] bg-gray-300" />
//                                             <TouchableOpacity
//                                                 onPress={() => setPaymentMode('finance')}
//                                                 className={`flex-1 h-12 justify-center items-center ${paymentMode === 'finance' ? 'bg-teal-50' : 'bg-white'}`}
//                                             >
//                                                 <Text className={paymentMode === 'finance' ? 'text-teal-700 font-medium' : 'text-gray-600'}>Finance</Text>
//                                             </TouchableOpacity>
//                                         </View>
//                                     </View>
//                                 </View>

//                                 {paymentMode === 'finance' && (
//                                     <View className="mb-4">
//                                         <View className="mb-4">
//                                             <FormLabel label="Hypothecation" />
//                                             <TextInput
//                                                 value={paymentHypothecation}
//                                                 onChangeText={setPaymentHypothecation}
//                                                 placeholder="Hypothecation"
//                                                 className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                             />
//                                         </View>

//                                         <View className="mb-4">
//                                             <FormLabel label="Loan Type" />
//                                             <TouchableOpacity
//                                                 onPress={() => { }}
//                                                 className="h-12 bg-white border border-gray-300 rounded-lg px-3 justify-center"
//                                             >
//                                                 <Text className="text-gray-800">{loanType || 'Loan Type'}</Text>
//                                                 <ChevronRight size={18} color={COLORS.gray[400]} style={{ position: 'absolute', right: 12, top: 12 }} />
//                                             </TouchableOpacity>
//                                         </View>

//                                         <View className="mb-4">
//                                             <FormLabel label="Financier Name" />
//                                             <TouchableOpacity
//                                                 onPress={() => { }}
//                                                 className="h-12 bg-white border border-gray-300 rounded-lg px-3 justify-center"
//                                             >
//                                                 <Text className="text-gray-800">{financer || 'Financier'}</Text>
//                                                 <ChevronRight size={18} color={COLORS.gray[400]} style={{ position: 'absolute', right: 12, top: 12 }} />
//                                             </TouchableOpacity>
//                                         </View>

//                                         <View>
//                                             <FormLabel label="Financier Branch" />
//                                             <TextInput
//                                                 value={financierBranch}
//                                                 onChangeText={setFinancierBranch}
//                                                 placeholder="Financier Branch"
//                                                 className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                             />
//                                         </View>
//                                     </View>
//                                 )}

//                                 <View className="mb-4">
//                                     <FormLabel label="Remarks" />
//                                     <TextInput
//                                         value={remarks}
//                                         onChangeText={setRemarks}
//                                         multiline
//                                         numberOfLines={4}
//                                         textAlignVertical="top"
//                                         placeholder="Remarks"
//                                         className="h-24 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
//                                     />
//                                 </View>

//                                 <View>
//                                     <FormLabel label="Net Receivables" />
//                                     <View className="flex-row gap-2">
//                                         <View className="h-12 w-12 bg-gray-50 border border-gray-300 rounded-lg items-center justify-center">
//                                             <Text className="text-gray-600">₹</Text>
//                                         </View>
//                                         <TextInput
//                                             value={netReceivables}
//                                             onChangeText={setNetReceivables}
//                                             placeholder="0"
//                                             keyboardType="numeric"
//                                             className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
//                                         />
//                                     </View>
//                                 </View>
//                             </View>
//                         )}
//                     </View>
//                 </ScrollView>
//             </KeyboardAvoidingView>

//             {/* Footer Buttons */}
//             <View className="bg-white border-t border-gray-100 p-4 flex-row gap-3">
//                 {activeTab === 'customer' ? (
//                     <>
//                         <Button
//                             title="Cancel"
//                             variant="outline"
//                             className="flex-1"
//                             onPress={handleClose}
//                         />
//                         <Button title="Next" className="flex-1" onPress={handleNext} />
//                     </>
//                 ) : activeTab === 'vehicle' ? (
//                     <>
//                         <Button
//                             title="Back"
//                             variant="outline"
//                             className="flex-1"
//                             onPress={handleBack}
//                         />
//                         <Button title="Next" className="flex-1" onPress={handleNext} />
//                     </>
//                 ) : (
//                     <>
//                         <Button
//                             title="Back"
//                             variant="outline"
//                             className="flex-1"
//                             onPress={handleBack}
//                         />
//                         <Button title="Save & Complete" className="flex-1" onPress={handleSaveComplete} />
//                     </>
//                 )}
//             </View>

//             {/* Dropdown Modals */}
//             {/* Country Modal */}
//             <CustomModal visible={showCountryModal} onClose={() => setShowCountryModal(false)}>
//                 <View className="p-4 border-b border-gray-200">
//                     <Text className="text-lg font-semibold">Select Country</Text>
//                 </View>
//                 <ScrollView>
//                     {countries?.map((country) => (
//                         <TouchableOpacity
//                             key={country.id}
//                             onPress={() => {
//                                 setCountry(country.name);
//                                 setShowCountryModal(false);
//                                 fetchStates(country.id);
//                             }}
//                             className="p-4 border-b border-gray-100"
//                         >
//                             <Text className="text-gray-800">{country.name}</Text>
//                         </TouchableOpacity>
//                     )) || []}
//                 </ScrollView>
//                 <TouchableOpacity onPress={() => setShowCountryModal(false)} className="p-4 border-t border-gray-200">
//                     <Text className="text-center text-gray-600">Cancel</Text>
//                 </TouchableOpacity>
//             </CustomModal>

//             {/* State Modal */}
//             <CustomModal visible={showStateModal} onClose={() => setShowStateModal(false)}>
//                 <View className="p-4 border-b border-gray-200">
//                     <Text className="text-lg font-semibold">Select State</Text>
//                 </View>
//                 <ScrollView>
//                     {states?.map((state) => (
//                         <TouchableOpacity
//                             key={state.id}
//                             onPress={() => {
//                                 setStateVal(state.name);
//                                 setCity(''); // Clear city when state changes
//                                 setShowStateModal(false);
//                                 fetchCities(state.id);
//                             }}
//                             className="p-4 border-b border-gray-100"
//                         >
//                             <Text className="text-gray-800">{state.name}</Text>
//                         </TouchableOpacity>
//                     )) || []}
//                 </ScrollView>
//                 <TouchableOpacity onPress={() => setShowStateModal(false)} className="p-4 border-t border-gray-200">
//                     <Text className="text-center text-gray-600">Cancel</Text>
//                 </TouchableOpacity>
//             </CustomModal>

//             {/* City Modal */}
//             <CustomModal visible={showCityModal} onClose={() => setShowCityModal(false)}>
//                 <View className="p-4 border-b border-gray-200">
//                     <Text className="text-lg font-semibold">Select City</Text>
//                 </View>
//                 <ScrollView>
//                     {cities?.map((city) => (
//                         <TouchableOpacity
//                             key={city.id}
//                             onPress={() => {
//                                 setCity(city.name);
//                                 setShowCityModal(false);
//                             }}
//                             className="p-4 border-b border-gray-100"
//                         >
//                             <Text className="text-gray-800">{city.name}</Text>
//                         </TouchableOpacity>
//                     )) || []}
//                 </ScrollView>
//                 <TouchableOpacity onPress={() => setShowCityModal(false)} className="p-4 border-t border-gray-200">
//                     <Text className="text-center text-gray-600">Cancel</Text>
//                 </TouchableOpacity>
//             </CustomModal>

//             {/* RTO Modal */}
//             <CustomModal visible={showRtoModal} onClose={() => setShowRtoModal(false)}>
//                 <View className="p-4 border-b border-gray-200">
//                     <Text className="text-lg font-semibold">Select RTO</Text>
//                 </View>
//                 <ScrollView>
//                     {rtos?.map((rto) => (
//                         <TouchableOpacity
//                             key={rto.id}
//                             onPress={() => {
//                                 setRto(rto.name);
//                                 setShowRtoModal(false);
//                             }}
//                             className="p-4 border-b border-gray-100"
//                         >
//                             <Text className="text-gray-800">{rto.name}</Text>
//                         </TouchableOpacity>
//                     )) || []}
//                 </ScrollView>
//                 <TouchableOpacity onPress={() => setShowRtoModal(false)} className="p-4 border-t border-gray-200">
//                     <Text className="text-center text-gray-600">Cancel</Text>
//                 </TouchableOpacity>
//             </CustomModal>

//             {/* Manufacturer Modal */}
//             <CustomModal visible={showManufacturerModal} onClose={() => setShowManufacturerModal(false)}>
//                 <View className="p-4 border-b border-gray-200">
//                     <Text className="text-lg font-semibold">Select Manufacturer</Text>
//                 </View>
//                 <ScrollView>
//                     {manufacturers?.map((manufacturer) => (
//                         <TouchableOpacity
//                             key={manufacturer.id}
//                             onPress={() => {
//                                 setManufacturer(manufacturer.name);
//                                 setShowManufacturerModal(false);
//                                 fetchModels(manufacturer.id);
//                             }}
//                             className="p-4 border-b border-gray-100"
//                         >
//                             <Text className="text-gray-800">{manufacturer.name}</Text>
//                         </TouchableOpacity>
//                     )) || []}
//                 </ScrollView>
//                 <TouchableOpacity onPress={() => setShowManufacturerModal(false)} className="p-4 border-t border-gray-200">
//                     <Text className="text-center text-gray-600">Cancel</Text>
//                 </TouchableOpacity>
//             </CustomModal>

//             {/* Model Modal */}
//             <CustomModal visible={showModelModal} onClose={() => setShowModelModal(false)}>
//                 <View className="p-4 border-b border-gray-200">
//                     <Text className="text-lg font-semibold">Select Model</Text>
//                 </View>
//                 <ScrollView>
//                     {models?.map((model) => (
//                         <TouchableOpacity
//                             key={model.id}
//                             onPress={() => {
//                                 setModel(model.name);
//                                 setShowModelModal(false);
//                             }}
//                             className="p-4 border-b border-gray-100"
//                         >
//                             <Text className="text-gray-800">{model.name}</Text>
//                         </TouchableOpacity>
//                     )) || []}
//                 </ScrollView>
//                 <TouchableOpacity onPress={() => setShowModelModal(false)} className="p-4 border-t border-gray-200">
//                     <Text className="text-center text-gray-600">Cancel</Text>
//                 </TouchableOpacity>
//             </CustomModal>

//             {/* Color Modal */}
//             <CustomModal visible={showColorModal} onClose={() => setShowColorModal(false)}>
//                 <View className="p-4 border-b border-gray-200">
//                     <Text className="text-lg font-semibold">Select Color</Text>
//                 </View>
//                 <ScrollView>
//                     {colors?.map((color) => (
//                         <TouchableOpacity
//                             key={color.id}
//                             onPress={() => {
//                                 setVehicleColor(color.name);
//                                 setShowColorModal(false);
//                             }}
//                             className="p-4 border-b border-gray-100 flex-row items-center"
//                         >
//                             <View className="w-6 h-6 rounded-full mr-3" style={{ backgroundColor: color.code }} />
//                             <Text className="text-gray-800">{color.name}</Text>
//                         </TouchableOpacity>
//                     )) || []}
//                 </ScrollView>
//                 <TouchableOpacity onPress={() => setShowColorModal(false)} className="p-4 border-t border-gray-200">
//                     <Text className="text-center text-gray-600">Cancel</Text>
//                 </TouchableOpacity>
//             </CustomModal>

//             {/* Sales Officer Modal */}
//             <CustomModal visible={showSalesOfficerModal} onClose={() => setShowSalesOfficerModal(false)}>
//                 <View className="p-4 border-b border-gray-200">
//                     <Text className="text-lg font-semibold">Select Sales Officer</Text>
//                 </View>
//                 <ScrollView>
//                     {salesOfficers?.map((officer) => (
//                         <TouchableOpacity
//                             key={officer.id}
//                             onPress={() => {
//                                 setSalesOfficer(officer.name || officer.profile?.employeeName);
//                                 setShowSalesOfficerModal(false);
//                             }}
//                             className="p-4 border-b border-gray-100"
//                         >
//                             <Text className="text-gray-800">{officer.name || officer.profile?.employeeName}</Text>
//                         </TouchableOpacity>
//                     )) || []}
//                 </ScrollView>
//                 <TouchableOpacity onPress={() => setShowSalesOfficerModal(false)} className="p-4 border-t border-gray-200">
//                     <Text className="text-center text-gray-600">Cancel</Text>
//                 </TouchableOpacity>
//             </CustomModal>

//             {/* Referred By Modal */}
//             <CustomModal visible={showReferredByModal} onClose={() => setShowReferredByModal(false)}>
//                 <View className="p-4 border-b border-gray-200">
//                     <Text className="text-lg font-semibold">Select Referred By</Text>
//                 </View>
//                 <ScrollView>
//                     {referredByOptions?.map((option) => (
//                         <TouchableOpacity
//                             key={option.id}
//                             onPress={() => {
//                                 setReferredBy(option.name);
//                                 setShowReferredByModal(false);
//                             }}
//                             className="p-4 border-b border-gray-100"
//                         >
//                             <Text className="text-gray-800">{option.name}</Text>
//                         </TouchableOpacity>
//                     )) || []}
//                 </ScrollView>
//                 <TouchableOpacity onPress={() => setShowReferredByModal(false)} className="p-4 border-t border-gray-200">
//                     <Text className="text-center text-gray-600">Cancel</Text>
//                 </TouchableOpacity>
//             </CustomModal>

//             {/* Relationship Modal */}
//             <CustomModal visible={showRelationshipModal} onClose={() => setShowRelationshipModal(false)}>
//                 <View className="p-4 border-b border-gray-200">
//                     <Text className="text-lg font-semibold">Select Relationship</Text>
//                 </View>
//                 <ScrollView>
//                     {relationshipOptions?.map((option) => (
//                         <TouchableOpacity
//                             key={option.id}
//                             onPress={() => {
//                                 setRelationship(option.name);
//                                 setShowRelationshipModal(false);
//                             }}
//                             className="p-4 border-b border-gray-100"
//                         >
//                             <Text className="text-gray-800">{option.name}</Text>
//                         </TouchableOpacity>
//                     )) || []}
//                 </ScrollView>
//                 <TouchableOpacity onPress={() => setShowRelationshipModal(false)} className="p-4 border-t border-gray-200">
//                     <Text className="text-center text-gray-600">Cancel</Text>
//                 </TouchableOpacity>
//             </CustomModal>

//             {/* Attach Quotation Modal */}
//             <AttachQuotationModal
//                 visible={showAttachQuotationModal}
//                 onClose={() => setShowAttachQuotationModal(false)}
//                 onAttach={handleAttachQuotation}
//             />

//             {/* Branch Modal */}
//             <CustomModal visible={showBranchModal} onClose={() => setShowBranchModal(false)}>
//                 <View className="p-4 border-b border-gray-200">
//                     <Text className="text-lg font-semibold">Select Branch</Text>
//                 </View>
//                 <ScrollView>
//                     {branches?.map((branch) => (
//                         <TouchableOpacity
//                             key={branch.id}
//                             onPress={() => {
//                                 setBranch(branch.name);
//                                 setShowBranchModal(false);
//                             }}
//                             className="p-4 border-b border-gray-100"
//                         >
//                             <Text className="text-gray-800">{branch.name}</Text>
//                         </TouchableOpacity>
//                     )) || []}
//                 </ScrollView>
//                 <TouchableOpacity onPress={() => setShowBranchModal(false)} className="p-4 border-t border-gray-200">
//                     <Text className="text-center text-gray-600">Cancel</Text>
//                 </TouchableOpacity>
//             </CustomModal>

//             {/* Calendar Modal for DOB */}
//             <Modal
//                 visible={showCalendarModal}
//                 transparent={true}
//                 animationType="slide"
//                 onRequestClose={() => setShowCalendarModal(false)}
//             >
//                 <View className="flex-1 justify-center items-center bg-black/50">
//                     <View className="bg-white rounded-xl p-6 w-11/12 max-w-sm">
//                         <View className="flex-row justify-between items-center mb-4">
//                             <Text className="text-lg font-semibold text-gray-800">Select Date of Birth</Text>
//                             <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
//                                 <X size={20} color={COLORS.gray[600]} />
//                             </TouchableOpacity>
//                         </View>
                        
//                         {/* Simple Date Selection */}
//                         <View className="space-y-4">
//                             <View>
//                                 <Text className="text-sm text-gray-600 mb-2">Year</Text>
//                                 <TextInput
//                                     value={selectedDate.getFullYear().toString()}
//                                     onChangeText={(text) => {
//                                         const year = parseInt(text) || new Date().getFullYear();
//                                         const newDate = new Date(selectedDate);
//                                         newDate.setFullYear(year);
//                                         setSelectedDate(newDate);
//                                     }}
//                                     keyboardType="numeric"
//                                     className="h-10 border border-gray-300 rounded-lg px-3"
//                                     placeholder="YYYY"
//                                 />
//                             </View>
                            
//                             <View>
//                                 <Text className="text-sm text-gray-600 mb-2">Month</Text>
//                                 <TextInput
//                                     value={(selectedDate.getMonth() + 1).toString()}
//                                     onChangeText={(text) => {
//                                         const month = (parseInt(text) || 1) - 1;
//                                         const newDate = new Date(selectedDate);
//                                         newDate.setMonth(month);
//                                         setSelectedDate(newDate);
//                                     }}
//                                     keyboardType="numeric"
//                                     className="h-10 border border-gray-300 rounded-lg px-3"
//                                     placeholder="MM"
//                                 />
//                             </View>
                            
//                             <View>
//                                 <Text className="text-sm text-gray-600 mb-2">Day</Text>
//                                 <TextInput
//                                     value={selectedDate.getDate().toString()}
//                                     onChangeText={(text) => {
//                                         const day = parseInt(text) || 1;
//                                         const newDate = new Date(selectedDate);
//                                         newDate.setDate(day);
//                                         setSelectedDate(newDate);
//                                     }}
//                                     keyboardType="numeric"
//                                     className="h-10 border border-gray-300 rounded-lg px-3"
//                                     placeholder="DD"
//                                 />
//                             </View>
//                         </View>
                        
//                         <TouchableOpacity 
//                             onPress={() => handleDateSelect(selectedDate)}
//                             className="mt-6 bg-teal-600 rounded-lg py-3"
//                         >
//                             <Text className="text-white text-center font-medium">Confirm</Text>
//                         </TouchableOpacity>
//                     </View>
//                 </View>
//             </Modal>

//         </SafeAreaView>
//     );
// }

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { ENDPOINT } from '../../src/api';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import AttachQuotationModal from '../../components/AttachQuotationModal';
import AccessoryModal from '../../components/AccessoryModal';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    getBranches,
    getUsers,
    getManufacturersByBranch,
    getVehicleModelsByManufacturer,
    getRtoOptions,
    getCountries,
    getStates,
    getCities,
    getReferredCustomers,
    generateCustomerId,
    getVehicleAccessories,
    getCustomerByPhoneNo,
    getCurrentUser,
    generateBookingId,
    generateEReceiptId,
    createBooking,
    updateBooking
} from '../../src/api';
import platformApi from '../../src/api';
import { useToast } from '../../src/ToastContext';
import { StackNavigationProp } from '@react-navigation/stack';

// ─── Custom Modal ────────────────────────────────────────────────────────────
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

// ─── Types ───────────────────────────────────────────────────────────────────
interface Accessory {
    id: string;
    partName: string;
    partNumber: string;
    mrp: number;
    quantity: number;
    discount: number;
    isPercent: boolean;
    priceBeforeDiscount: number;
    priceAfterDiscount: number;
    isSelected: boolean;
    arrayId?: string;
    new?: boolean;
}

type BookingActivityRouteProp = RouteProp<RootStackParamList, 'BookingActivity'>;
type BookingActivityNavigationProp = StackNavigationProp<RootStackParamList, 'BookingActivity'>;

const FormLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
    <Text className="text-sm text-gray-600 mb-1 font-medium">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
    </Text>
);

// ─── Component ───────────────────────────────────────────────────────────────
export default function BookingActivityScreen({
    navigation,
    route,
}: {
    navigation: BookingActivityNavigationProp;
    route: BookingActivityRouteProp;
}) {
    const { isAdvancedBooking, customerId, customerName, customerPhone } = route.params || {};

    const toast = useToast();
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);
    const vehicleSectionRef = useRef<View>(null);

    // ── Vehicle-selection protection refs ──────────────────────────────────
    const dataLoadedRef = useRef(false);
    const isVehicleSelectionInProgressRef = useRef(false);
    const hasEverSelectedVehicleRef = useRef(false);
    const processedVehicleRef = useRef<string | null>(null); // Track processed vehicle ID

    // ── Payload-critical field refs (always in sync, no stale-closure risk) ─
    const customerFullNameRef   = useRef(customerName ? String(customerName) : '');
    const phoneRef              = useRef(customerPhone ? String(customerPhone) : '');
    const fatherNameRef         = useRef('');
    const addressRef            = useRef('');
    const address2Ref           = useRef('');
    const address3Ref           = useRef('');
    const localityRef           = useRef('');
    const pincodeRef            = useRef('');
    const countryRef            = useRef('');
    const stateValRef           = useRef('');
    const cityRef               = useRef('');
    const customerGenderRef     = useRef('Male');
    const emailRef              = useRef('');
    const dobRef                = useRef('');
    const ageRef                = useRef('');
    const salesOfficerRef       = useRef('');
    const quotationsRef         = useRef('');
    const remarksRef            = useRef('');
    const expectedDeliveryRef   = useRef('');
    const nomineeRef            = useRef('');
    const nomineeAgeRef         = useRef('');
    const relationshipRef       = useRef('');
    const referredByRef         = useRef('');
    const paymentModeRef        = useRef('cash');
    const customerDataRef       = useRef<any>(null);
    const customerFetchedRef    = useRef(false); // prevent re-fetching on focus regain

    // ── UI State ───────────────────────────────────────────────────────────
    const [dataLoaded, setDataLoaded]                               = useState(false);
    const [isVehicleSelectionInProgress, setIsVehicleSelectionInProgress] = useState(false);
    const [hasEverSelectedVehicle, setHasEverSelectedVehicle]       = useState(false);
    const [activeTab, setActiveTab]                                 = useState<'customer' | 'vehicle' | 'payment'>('customer');

    // ── Customer fields ────────────────────────────────────────────────────
    const [branch, setBranch]                     = useState('');
    const [phone, setPhone]                       = useState(customerPhone ? String(customerPhone) : '');
    const [customerFullName, setCustomerFullName] = useState(customerName ? String(customerName) : '');
    const [fatherName, setFatherName]             = useState('');
    const [address, setAddress]                   = useState('');
    const [address2, setAddress2]                 = useState('');
    const [address3, setAddress3]                 = useState('');
    const [locality, setLocality]                 = useState('');
    const [country, setCountry]                   = useState('');
    const [stateVal, setStateVal]                 = useState('');
    const [city, setCity]                         = useState('');
    const [pincode, setPincode]                   = useState('');
    const [email, setEmail]                       = useState('');
    const [dob, setDob]                           = useState('');
    const [age, setAge]                           = useState('');
    const [referredBy, setReferredBy]             = useState('');
    const [relationship, setRelationship]         = useState('');
    const [nominee, setNominee]                   = useState('');
    const [nomineeAge, setNomineeAge]             = useState('');
    const [salesOfficer, setSalesOfficer]         = useState('');
    const [quotationsAssociated, setQuotationsAssociated] = useState('');
    const [customerGender, setCustomerGender]     = useState('Male');
    const [customerDob, setCustomerDob]           = useState('');
    const [generatedCustomerId, setGeneratedCustomerId] = useState('');
    const [customerData, setCustomerData]         = useState<any>(null);

    // ── Dropdown data ──────────────────────────────────────────────────────
    const [countries, setCountries]               = useState<any[]>([]);
    const [states, setStates]                     = useState<any[]>([]);
    const [cities, setCities]                     = useState<any[]>([]);
    const [rtos, setRtos]                         = useState<any[]>([]);
    const [manufacturers, setManufacturers]       = useState<any[]>([]);
    const [models, setModels]                     = useState<any[]>([]);
    const [colors, setColors]                     = useState<any[]>([]);
    const [salesOfficers, setSalesOfficers]       = useState<any[]>([]);
    const [referredByOptions, setReferredByOptions] = useState<any[]>([]);
    const [relationshipOptions, setRelationshipOptions] = useState<any[]>([]);
    const [branches, setBranches]                 = useState<any[]>([]);
    const [selectedBranchObj, setSelectedBranchObj] = useState<any>(null);
    const [selectedVehicleObj, setSelectedVehicleObj] = useState<any>(null);

    // ── Vehicle fields ─────────────────────────────────────────────────────
    const [manufacturer, setManufacturer] = useState('India Yamaha Motors Private Limited');
    const [model, setModel]               = useState('');
    const currentModelRef = useRef(model);
    const [rto, setRto]                   = useState('');
    const [vehicleColor, setVehicleColor] = useState('');
    const [accessories, setAccessories]   = useState<Accessory[]>([]);
    const [totalDiscount, setTotalDiscount]           = useState('');
    const [accessoriesTotal, setAccessoriesTotal]     = useState('');
    const [accessoriesAfterDiscount, setAccessoriesAfterDiscount] = useState('');
    const [exchangeModel, setExchangeModel]           = useState('');
    const [exchangePrice, setExchangePrice]           = useState('');
    const [onRoadPrice, setOnRoadPrice]               = useState('');
    const [tempRegCharges, setTempRegCharges]         = useState('');
    const [hypothecationCharges, setHypothecationCharges] = useState('');
    const [numberPlateCharges, setNumberPlateCharges] = useState('');
    const [affidavitAmount, setAffidavitAmount]       = useState('');
    const [specialNoCharges, setSpecialNoCharges]     = useState('');
    const [onRoadDiscount, setOnRoadDiscount]         = useState('');
    const [finalAmount, setFinalAmount]               = useState('');
    const [showroomPrice, setShowroomPrice]           = useState('');
    const [insuranceAmount, setInsuranceAmount]       = useState('');
    const [roadTax, setRoadTax]                       = useState('');
    const [warrantyPrice, setWarrantyPrice]           = useState('');
    const [registrationFee, setRegistrationFee]       = useState('');
    const [handlingCharges, setHandlingCharges]       = useState('');
    const [insuranceType, setInsuranceType]           = useState('');
    const [expectedDelivery, setExpectedDelivery]     = useState('');

    // ── Payment fields ─────────────────────────────────────────────────────
    const [paymentMode, setPaymentMode]               = useState('cash');
    const [financer, setFinancer]                     = useState('');
    const [loanType, setLoanType]                     = useState('');
    const [financierBranch, setFinancierBranch]       = useState('');
    const [paymentHypothecation, setPaymentHypothecation] = useState<boolean>(false);
    const [remarks, setRemarks]                       = useState('');
    const [netReceivables, setNetReceivables]         = useState('');
    const [downPayment, setDownPayment]               = useState('');
    const [tenure, setTenure]                         = useState('');
    const [loanAmount, setLoanAmount]                 = useState('');
    const [emiAmount, setEmiAmount]                   = useState('');
    const [emiDay, setEmiDay]                         = useState('');
    const [emiStartDate, setEmiStartDate]             = useState('');
    const [loanDisbursementAmount, setLoanDisbursementAmount] = useState('');
    const [showroomFinanceCharges, setShowroomFinanceCharges] = useState('');

    // ── Modal visibility ───────────────────────────────────────────────────
    const [showBranchModal, setShowBranchModal]                   = useState(false);
    const [showAccessoryModal, setShowAccessoryModal]             = useState(false);
    const [showInsuranceTypeModal, setShowInsuranceTypeModal]     = useState(false);
    const [showCountryModal, setShowCountryModal]                 = useState(false);
    const [showStateModal, setShowStateModal]                     = useState(false);
    const [showCityModal, setShowCityModal]                       = useState(false);
    const [showRtoModal, setShowRtoModal]                         = useState(false);
    const [showManufacturerModal, setShowManufacturerModal]       = useState(false);
    const [showModelModal, setShowModelModal]                     = useState(false);
    const [showColorModal, setShowColorModal]                     = useState(false);
    const [showSalesOfficerModal, setShowSalesOfficerModal]       = useState(false);
    const [showReferredByModal, setShowReferredByModal]           = useState(false);
    const [showRelationshipModal, setShowRelationshipModal]       = useState(false);
    const [showAttachQuotationModal, setShowAttachQuotationModal] = useState(false);
    const [showCalendarModal, setShowCalendarModal]               = useState(false);
    const [showExpectedDeliveryModal, setShowExpectedDeliveryModal] = useState(false);
    const [showLoanTypeModal, setShowLoanTypeModal]               = useState(false);
    const [showTenureModal, setShowTenureModal]                   = useState(false);
    const [showEmiDayModal, setShowEmiDayModal]                   = useState(false);
    const [selectedDate, setSelectedDate]                         = useState(new Date());

    // ── Validation errors ──────────────────────────────────────────────────
    const [nameError, setNameError]               = useState('');
    const [phoneError, setPhoneError]             = useState('');
    const [salesOfficerError, setSalesOfficerError] = useState('');
    const [addressError, setAddressError]         = useState('');
    const [localityError, setLocalityError]       = useState('');
    const [pincodeError, setPincodeError]         = useState('');
    const [modelError, setModelError]             = useState('');

    // ─────────────────────────────────────────────────────────────────────
    // Derived booleans
    // ─────────────────────────────────────────────────────────────────────
    const isExpectedDeliverySelected = Boolean(
        expectedDelivery && expectedDelivery.length > 0 && expectedDelivery !== 'DD/MM/YYYY'
    );
    const isModelSelected = Boolean(model && model.trim() !== '' && model !== 'Select Model Name');

    // ─────────────────────────────────────────────────────────────────────
    // Ref sync helpers — set both state (UI) and ref (payload) atomically
    // ─────────────────────────────────────────────────────────────────────
    const setCustomerFullNameSync = (v: string) => { customerFullNameRef.current = v; setCustomerFullName(v); };
    const setPhoneSync            = (v: string) => { phoneRef.current = v; setPhone(v); };
    const setFatherNameSync       = (v: string) => { fatherNameRef.current = v; setFatherName(v); };
    const setAddressSync          = (v: string) => { addressRef.current = v; setAddress(v); };
    const setAddress2Sync         = (v: string) => { address2Ref.current = v; setAddress2(v); };
    const setAddress3Sync         = (v: string) => { address3Ref.current = v; setAddress3(v); };
    const setLocalitySync         = (v: string) => { localityRef.current = v; setLocality(v); };
    const setPincodeSync          = (v: string) => { pincodeRef.current = v; setPincode(v); };
    const setCountrySync          = (v: string) => { countryRef.current = v; setCountry(v); };
    const setStateValSync         = (v: string) => { stateValRef.current = v; setStateVal(v); };
    const setCitySync             = (v: string) => { cityRef.current = v; setCity(v); };
    const setCustomerGenderSync   = (v: string) => { customerGenderRef.current = v; setCustomerGender(v); };
    const setEmailSync            = (v: string) => { emailRef.current = v; setEmail(v); };
    const setDobSync              = (v: string) => { dobRef.current = v; setDob(v); };
    const setAgeSync              = (v: string) => { ageRef.current = v; setAge(v); };
    const setSalesOfficerSync     = (v: string) => { salesOfficerRef.current = v; setSalesOfficer(v); };
    const setQuotationsSync       = (v: string) => { quotationsRef.current = v; setQuotationsAssociated(v); };
    const setRemarksSync          = (v: string) => { remarksRef.current = v; setRemarks(v); };
    const setExpectedDeliverySync = (v: string) => { expectedDeliveryRef.current = v; setExpectedDelivery(v); };
    const setNomineeSync          = (v: string) => { nomineeRef.current = v; setNominee(v); };
    const setNomineeAgeSync       = (v: string) => { nomineeAgeRef.current = v; setNomineeAge(v); };
    const setRelationshipSync     = (v: string) => { relationshipRef.current = v; setRelationship(v); };
    const setReferredBySync       = (v: string) => { referredByRef.current = v; setReferredBy(v); };
    const setPaymentModeSync      = (v: string) => { paymentModeRef.current = v; setPaymentMode(v); };

    // ─────────────────────────────────────────────────────────────────────
    // Net receivables recalculation
    // ─────────────────────────────────────────────────────────────────────
    useEffect(() => {
        const base = (parseFloat(finalAmount) || 0) - (parseFloat(exchangePrice) || 0);
        let net = 0;
        if (paymentMode === 'cash') {
            net = base;
        } else if (paymentMode === 'finance') {
            net = paymentHypothecation && loanType !== 'Self' ? 0 : base;
        }
        setNetReceivables(net.toString());
    }, [finalAmount, exchangePrice, paymentMode, paymentHypothecation, loanType]);

    // ─────────────────────────────────────────────────────────────────────
    // Vehicle-selection protection ref sync
    // ─────────────────────────────────────────────────────────────────────
    useEffect(() => { dataLoadedRef.current = dataLoaded; }, [dataLoaded]);
    useEffect(() => { isVehicleSelectionInProgressRef.current = isVehicleSelectionInProgress; }, [isVehicleSelectionInProgress]);
    useEffect(() => { hasEverSelectedVehicleRef.current = hasEverSelectedVehicle; }, [hasEverSelectedVehicle]);
    useEffect(() => { currentModelRef.current = model; }, [model]);

    // ─────────────────────────────────────────────────────────────────────
    // Data fetching
    // ─────────────────────────────────────────────────────────────────────
    const fetchCountries = async () => {
        try {
            const response = await getCountries();
            if (response.data.code === 200 && response.data.data) {
                const india = response.data.data.find((c: any) => c.name === 'India');
                if (india) {
                    setCountries([india]);
                    setCountrySync('India');
                    fetchStates(india.id);
                } else {
                    setCountries([{ id: '1', name: 'India' }]);
                    setCountrySync('India');
                    fetchStates('1');
                }
            } else {
                setCountries([{ id: '1', name: 'India' }]);
                setCountrySync('India');
                fetchStates('1');
            }
        } catch {
            setCountries([{ id: '1', name: 'India' }]);
            setCountrySync('India');
            fetchStates('1');
        }
    };

    const fetchStates = async (countryId: string) => {
        try {
            const response = await getStates(countryId);
            setStates(response.data.code === 200 && response.data.data ? response.data.data : []);
        } catch {
            setStates([]);
        }
    };

    const fetchCities = async (stateId: string) => {
        try {
            const response = await getCities(stateId);
            setCities(response.data.code === 200 && response.data.data ? response.data.data : []);
        } catch {
            setCities([]);
        }
    };

    const fetchRtos = async () => {
        const fallback = [
            { id: '1', code: 'KA-01', area: 'Bangalore Central' },
            { id: '2', code: 'KA-02', area: 'Bangalore North' },
            { id: '3', code: 'KA-03', area: 'Bangalore South' },
            { id: '4', code: 'KA-04', area: 'Bangalore East' },
            { id: '5', code: 'KA-05', area: 'Bangalore West' },
        ];
        try {
            const response = await getRtoOptions();
            const data = response.data;
            setRtos(data?.code === 200 && Array.isArray(data.response) ? data.response : fallback);
        } catch {
            setRtos(fallback);
        }
    };

    const fetchManufacturers = async () => {
        const list = [{ id: 'ck8g6k0a249el0880cmkbpizm', name: 'India Yamaha Motors Private Limited' }];
        setManufacturers(list);
        setManufacturer('India Yamaha Motors Private Limited');
        fetchModels('ck8g6k0a249el0880cmkbpizm');
    };

    const fetchModels = async (manufacturerId: string) => {
        const mockModels = [
            { id: '1', modelCode: 'FZ-S FI V4', modelName: 'FZ-S FI V4' },
            { id: '2', modelCode: 'FZ-X', modelName: 'FZ-X' },
            { id: '3', modelCode: 'Ray ZR 125 Fi', modelName: 'Ray ZR 125 Fi' },
            { id: '4', modelCode: 'MT-15', modelName: 'MT-15' },
            { id: '5', modelCode: 'R15 V4', modelName: 'R15 V4' },
        ];
        try {
            const response = await getVehicleModelsByManufacturer(`${manufacturerId}?onlyAvailable=1`);
            const data = response.data;
            let list: any[] = [];
            if (data?.code === 200) {
                list = data.response?.code === 200
                    ? data.response.data || []
                    : Array.isArray(data.response) ? data.response : data.data || [];
            }
            const finalList = list.length > 0 ? list : mockModels;
            setModels(finalList);

            const hasValidModel =
                currentModelRef.current &&
                currentModelRef.current.trim() !== '' &&
                currentModelRef.current !== 'Select Model Name';
            const shouldPreserve =
                dataLoadedRef.current ||
                isVehicleSelectionInProgressRef.current ||
                hasEverSelectedVehicleRef.current ||
                hasValidModel;
            if (!shouldPreserve) setModel('');
        } catch {
            setModels(mockModels);
            const hasValidModel = currentModelRef.current && currentModelRef.current.trim() !== '';
            if (!dataLoadedRef.current && !hasValidModel) setModel('');
        }
    };

    const fetchSalesOfficers = async (branchId: string = '1') => {
        try {
            const response = await getUsers({ branch: branchId, role: 'sales_executive' });
            const users = response.data?.response?.data?.users;
            setSalesOfficers(Array.isArray(users) ? users : []);
        } catch {
            setSalesOfficers([]);
        }
    };

    const fetchReferredByOptions = async () => {
        try {
            const response = await platformApi.post('/api/options/get/', {
                module: 'customers',
                searchString: '',
                column: 'name',
                fields: ['contacts.phone'],
                page: 1,
                size: 20,
            });
            if (response.data.code === 200 && response.data.data) {
                setReferredByOptions(
                    response.data.data.map((emp: any) => ({
                        id: emp.id,
                        name: emp.contacts?.length > 0
                            ? `${emp.contacts[0].phone} - ${emp.name}`
                            : emp.name,
                    }))
                );
            } else {
                setReferredByOptions([]);
            }
        } catch {
            setReferredByOptions([]);
        }
    };

    const fetchRelationshipOptions = async () => {
        setRelationshipOptions([
            { id: '1', name: 'Father' }, { id: '2', name: 'Mother' },
            { id: '3', name: 'Brother' }, { id: '4', name: 'Sister' },
            { id: '5', name: 'Wife' }, { id: '6', name: 'Husband' },
            { id: '7', name: 'Son' }, { id: '8', name: 'Daughter' },
            { id: '9', name: 'Mother-in-law' }, { id: '10', name: 'Father-in-law' },
            { id: '11', name: 'Sister-in-law' }, { id: '12', name: 'Brother-in-law' },
            { id: '13', name: 'Daughter-in-law' },
        ]);
    };

    const fetchBranches = async () => {
        const mockBranches = [
            { id: 'ck8g589vj499008806oh90nmx', name: 'Devanahalli' },
            { id: 'clu835x1h0kh40898ynox6qnr', name: 'Doddaballapur' },
        ];
        try {
            const response = await getBranches();
            if (response.data.code === 200 && response.data.data?.length > 0) {
                const list = response.data.data;
                setBranches(list);
                setBranch(list[0].name);
                setSelectedBranchObj(list[0]);
            } else {
                setBranches(mockBranches);
                setBranch('Devanahalli');
                setSelectedBranchObj(mockBranches[0]);
            }
        } catch {
            setBranches(mockBranches);
            setBranch('Devanahalli');
            setSelectedBranchObj(mockBranches[0]);
        }
    };

    const generateNewCustomerId = async () => {
        try {
            const response = await generateCustomerId();
            if (response.data.code === 200) {
                const id = response.data.response?.data || response.data.data;
                setGeneratedCustomerId(id || 'CNB' + Math.floor(Math.random() * 100000));
            } else {
                setGeneratedCustomerId('CNB' + Math.floor(Math.random() * 100000));
            }
        } catch {
            setGeneratedCustomerId('CNB' + Math.floor(Math.random() * 100000));
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // Auto-fill — ONLY 5 fields as required:
    // Phone, Customer Name, Locality, Quotations, Gender
    // ─────────────────────────────────────────────────────────────────────
    const autoFillCustomerFields = (customer: any) => {
        console.log('🔍 autoFillCustomerFields — filling 5 fields');

        // Store customer for payload (DB id, etc.)
        setCustomerData(customer);
        customerDataRef.current = customer;

        // 1. Phone — already set by handlePhoneChange, but keep in sync
        const contactPhone = customer.contacts?.[0]?.phone;
        if (contactPhone) setPhoneSync(String(contactPhone));

        // 2. Customer Name
        if (customer.name) setCustomerFullNameSync(String(customer.name));

        // 3. Locality
        if (customer.address?.locality) setLocalitySync(String(customer.address.locality));

        // 4. Associated Quotations
        if (customer.quotation?.length > 0) {
            setQuotationsSync(customer.quotation.map((q: any) => q.id).join(', '));
        }

        // 5. Gender (safe default)
        if (customer.gender) setCustomerGenderSync(String(customer.gender));
    };

    // ─────────────────────────────────────────────────────────────────────
    // fetchCustomerData — accepts phoneNumber param to avoid stale closure
    // ─────────────────────────────────────────────────────────────────────
    const fetchCustomerData = async (phoneNumber?: string) => {
        const phoneToUse = phoneNumber ?? phoneRef.current;
        try {
            console.log('🔍 fetchCustomerData called with:', {
                phoneToUse,
                customerFetchedRef: customerFetchedRef.current,
                customerDataRef: customerDataRef.current,
                phoneNumberParam: phoneNumber
            });

            if (!phoneToUse || String(phoneToUse).length !== 10) return;

            // Prevent re-fetching if customer already loaded (e.g. screen regains focus)
            if (customerFetchedRef.current && customerDataRef.current) {
                console.log('🔍 fetchCustomerData — skipped, customer already loaded');
                return;
            }

            console.log('🔍 fetchCustomerData — proceeding with fetch for:', phoneToUse);
            
            // Mark as fetched immediately to prevent race conditions
            customerFetchedRef.current = true;

            const customerRes = await getCustomerByPhoneNo(phoneToUse);
            const customers = (customerRes.data?.response?.data?.customers as any[]) || [];

            if (customers.length > 0) {
                const customer = customers[0];
                setGeneratedCustomerId(customer.customerId || customer.id);
                autoFillCustomerFields(customer);
            } else {
                customerFetchedRef.current = true; // mark as fetched even when no customer found
                generateNewCustomerId();
            }
        } catch (error) {
            console.error('❌ fetchCustomerData error:', error);
            customerFetchedRef.current = true; // mark as fetched even on error
            generateNewCustomerId();
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // handlePhoneChange — pass value directly to avoid stale state
    // ─────────────────────────────────────────────────────────────────────
    const handlePhoneChange = (value: string) => {
        console.log('🔍 handlePhoneChange called with:', {
            value,
            phoneRef: phoneRef.current,
            customerFetchedRef: customerFetchedRef.current,
            isSameAsCurrent: value === phoneRef.current
        });
        
        setPhoneSync(value);
        
        // Only proceed if value is actually different from current ref
        if (value === phoneRef.current) {
            console.log('🔍 handlePhoneChange — same value, skipping');
            return;
        }
        
        // If user is changing to a completely different phone number, reset fetch guard
        if (value.length === 10 && phoneRef.current && value !== phoneRef.current) {
            console.log('🔍 handlePhoneChange — resetting fetch guard for new phone');
            customerFetchedRef.current = false; // Reset for new phone number
        }
        // Only fetch if this is a new phone number and we haven't fetched for it yet
        if (value.length === 10 && value !== phoneRef.current && !customerFetchedRef.current) {
            console.log('🔍 handlePhoneChange — triggering fetch for:', value);
            fetchCustomerData(value);
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // Mount effect
    // ─────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!dataLoaded) {
            fetchCountries();
            fetchRtos();
            fetchManufacturers();
            fetchSalesOfficers('1');
            fetchReferredByOptions();
            setDataLoaded(true);
        }
        fetchRelationshipOptions();
        fetchBranches();
        generateNewCustomerId();

        // If phone came from route params, fetch immediately — pass directly
        if (customerPhone && String(customerPhone).length === 10) {
            console.log('🔍 Mount effect — fetching customer for phone from route params:', customerPhone);
            customerFetchedRef.current = false; // Reset for initial fetch
            fetchCustomerData(String(customerPhone));
        }
    }, []);

    // Default sales officer
    useEffect(() => {
        if (salesOfficers.length > 0 && !salesOfficer) {
            const def = salesOfficers[0];
            setSalesOfficerSync(def.name || def.profile?.employeeName || '');
        }
    }, [salesOfficers]);

    // Default RTO
    useEffect(() => {
        if (rtos.length > 0 && !rto) {
            const def = rtos[0];
            setRto(def.name || def.rtoName || `${def.code} - ${def.area}`);
        }
    }, [rtos]);

    // ─────────────────────────────────────────────────────────────────────
    // Vehicle selection from SelectVehicleForBooking screen
    // ─────────────────────────────────────────────────────────────────────
    useFocusEffect(
        useCallback(() => {
            console.log('🔍 useFocusEffect triggered with params:', {
                hasSelectedVehicle: !!route.params?.selectedVehicle,
                customerFetchedRef: customerFetchedRef.current,
                phoneRef: phoneRef.current,
                vehicleId: route.params?.selectedVehicle?.vehicleId || route.params?.selectedVehicle?.id,
                processedVehicleRef: processedVehicleRef.current
            });
            
            // Only proceed if we have vehicle data AND haven't processed it yet
            if (route.params?.selectedVehicle && !isVehicleSelectionInProgressRef.current) {
                const vehicleData = route.params.selectedVehicle;
                const vehicleId = vehicleData.vehicleId || vehicleData.id;
                
                // Check if we've already processed this specific vehicle
                if (processedVehicleRef.current === vehicleId) {
                    console.log('🔍 useFocusEffect — vehicle already processed:', vehicleId);
                    return;
                }
                
                console.log('🔍 useFocusEffect — processing new vehicle:', vehicleId);
                processedVehicleRef.current = vehicleId;

                setIsVehicleSelectionInProgress(true);
                isVehicleSelectionInProgressRef.current = true;
                setHasEverSelectedVehicle(true);
                hasEverSelectedVehicleRef.current = true;

                setSelectedVehicleObj(vehicleData);
                setVehicleColor(
                    `${vehicleData.name || vehicleData.vehicleName} - ${vehicleData.selectedColor?.name || 'Standard'}`
                );

                if (vehicleData.selectedColor?.price) {
                    const vp = vehicleData.selectedColor.price;
                    setShowroomPrice(vp.showroomPrice?.toString() || '');
                    setRoadTax(vp.roadTax?.toString() || '');
                    setHandlingCharges(vp.handlingCharges?.toString() || '');
                    setRegistrationFee(vp.registrationFee?.toString() || '');
                    setNumberPlateCharges(vp.numberPlate?.toString() || '');
                    setTempRegCharges(vp.tempRegister?.toString() || '');
                    setHypothecationCharges(vp.hp?.toString() || '');
                    setAffidavitAmount(vp.affidavit?.toString() || '');
                    setFinalAmount(vehicleData.finalTotal?.toString() || '');
                }

                if (vehicleData.name) {
                    setModel(vehicleData.name);
                    currentModelRef.current = vehicleData.name;
                }

                setTimeout(() => setIsVehicleSelectionInProgress(false), 2000);

                if (route.params?.scrollToSection === 'vehicle') {
                    navigation.setParams({ selectedVehicle: undefined, scrollToSection: undefined } as any);
                    setTimeout(() => {
                        setActiveTab('vehicle');
                        setTimeout(() => {
                            vehicleSectionRef.current?.measure((x, y, w, h, pageX, pageY) => {
                                scrollViewRef.current?.scrollTo({ y: pageY - 50, animated: true });
                            });
                        }, 100);
                    }, 300);
                } else {
                    navigation.setParams({ selectedVehicle: undefined } as any);
                }
            } else {
                // No vehicle data or already processed, skip
                console.log('🔍 useFocusEffect — no vehicle data or already processed');
            }
        }, [route.params, navigation])
    );

    // ─────────────────────────────────────────────────────────────────────
    // Validation
    // ─────────────────────────────────────────────────────────────────────
    const validateForm = (): 'customer' | 'vehicle' | 'payment' | null => {
        setNameError(''); setPhoneError(''); setSalesOfficerError('');
        setAddressError(''); setLocalityError(''); setPincodeError(''); setModelError('');

        let hasCustomerError = false;

        // Read from state (always up-to-date by the time user reaches Save & Complete)
        const n   = customerFullName.trim();
        const p   = phone.trim();
        const so  = salesOfficer.trim();
        const addr = address.trim();
        const loc  = locality.trim();
        const pin  = pincode.trim();
        const a    = age.trim();
        const g    = customerGender.trim();

        if (!n)   { setNameError('Customer name is required'); hasCustomerError = true; }
        if (!p)   { setPhoneError('Phone number is required'); hasCustomerError = true; }
        else if (p.length !== 10 || !/^\d+$/.test(p)) { setPhoneError('Enter a valid 10-digit phone'); hasCustomerError = true; }
        if (!so)  { setSalesOfficerError('Sales officer is required'); hasCustomerError = true; }
        if (!a)   { toast.error('Age is required'); hasCustomerError = true; }
        if (!g)   { toast.error('Gender is required'); hasCustomerError = true; }
        if (!addr){ setAddressError('Address is required'); hasCustomerError = true; }
        if (!loc) { setLocalityError('Locality is required'); hasCustomerError = true; }
        if (!pin) { setPincodeError('Pincode is required'); hasCustomerError = true; }
        else if (!/^\d{6}$/.test(pin)) { setPincodeError('Enter a valid 6-digit pincode'); hasCustomerError = true; }

        if (hasCustomerError) {
            if (!n)             toast.error('Customer name is required');
            else if (!p)        toast.error('Phone number is required');
            else if (p.length !== 10) toast.error('Enter a valid 10-digit phone');
            else if (!so)       toast.error('Sales officer is required');
            else if (!a)        toast.error('Age is required');
            else if (!g)        toast.error('Gender is required');
            else if (!addr)     toast.error('Address is required');
            else if (!loc)      toast.error('Locality is required');
            else if (!pin)      toast.error('Pincode is required');
            else                toast.error('Enter a valid 6-digit pincode');
            return 'customer';
        }

        if (!model || model.trim() === '' || model === 'Select Model Name') {
            setModelError('Vehicle model is required');
            toast.error('Please select a vehicle model');
            return 'vehicle';
        }

        const pm = paymentMode;
        if (!pm) { toast.error('Payment mode is required'); return 'payment'; }
        if (pm === 'finance') {
            if (!financer.trim()) { toast.error('Financer name is required'); return 'payment'; }
            if (loanType === 'Company Assisted') {
                if (!downPayment) { toast.error('Down payment is required'); return 'payment'; }
                if (!tenure)      { toast.error('Tenure is required'); return 'payment'; }
                if (!loanAmount)  { toast.error('Loan amount is required'); return 'payment'; }
                if (!emiAmount)   { toast.error('EMI amount is required'); return 'payment'; }
            }
        }

        return null;
    };

    const validateBookingPayload = (payload: any) => {
        const errors: string[] = [];
        ['bookingId', 'eReceiptId', 'bookingStatus', 'customerName', 'customerPhone', 'IDbranch', 'vehicle', 'price']
            .forEach(f => { if (!payload[f]) errors.push(`Missing: ${f}`); });
        if (payload.customer && !payload.customer.id) errors.push('customer.id missing');
        if (payload.vehicle && !payload.vehicle.id) errors.push('vehicle.id missing');
        return { isValid: errors.length === 0, errors };
    };

    // ─────────────────────────────────────────────────────────────────────
    // createBookingPayload — reads exclusively from refs (always fresh)
    // ─────────────────────────────────────────────────────────────────────
    const createBookingPayload = async () => {
        const selectedBranch = selectedBranchObj || branches.find((b: any) => b.name === branch || b.id === branch);
        if (!selectedBranch?.id) {
            toast.error('Please select a valid branch before saving.');
            throw new Error('Missing branch id');
        }
        const branchId = String(selectedBranch.id);

        const [bookingIdRes, eReceiptIdRes] = await Promise.all([
            generateBookingId(branchId),
            generateEReceiptId(branchId),
        ]);
        const baseBookingId  = bookingIdRes.data?.response?.data  || bookingIdRes.data?.data  || 'BK';
        const baseReceiptId  = eReceiptIdRes.data?.response?.data || eReceiptIdRes.data?.data || 'ER';
        const stamp = `${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        const bookingId  = `${baseBookingId}-${stamp}`;
        const eReceiptId = `${baseReceiptId}-${stamp}`;

        // ── Read all values from refs ──
        const snap           = customerDataRef.current;
        const currentName    = customerFullNameRef.current;
        const currentPhone   = phoneRef.current;
        const currentFather  = fatherNameRef.current;
        const currentAddr    = addressRef.current;
        const currentAddr2   = address2Ref.current;
        const currentAddr3   = address3Ref.current;
        const currentLoc     = localityRef.current;
        const currentCountry = countryRef.current;
        const currentState   = stateValRef.current;
        const currentCity    = cityRef.current;
        const currentPin     = pincodeRef.current;
        const currentEmail   = emailRef.current;
        const currentDob     = dobRef.current;
        const currentGender  = customerGenderRef.current;
        const currentSales   = salesOfficerRef.current;
        const currentQuotes  = quotationsRef.current;
        const currentRemarks = remarksRef.current;
        const currentPayMode = paymentModeRef.current;
        const currentNominee = nomineeRef.current;
        const currentNomAge  = nomineeAgeRef.current;
        const currentRelation = relationshipRef.current;
        const currentReferred = referredByRef.current;
        const currentExpDel  = expectedDeliveryRef.current;

        console.log('📦 Payload ref values:', {
            name: currentName, phone: currentPhone, address: currentAddr,
            locality: currentLoc, pincode: currentPin, gender: currentGender,
        });

        const vehicleData = selectedVehicleObj ? {
            id:        selectedVehicleObj.modelId || selectedVehicleObj.vehicleId || selectedVehicleObj.id,
            modelName: selectedVehicleObj.name || selectedVehicleObj.displayName,
            modelCode: selectedVehicleObj.model || selectedVehicleObj.modelCode,
            color: {
                id:       selectedVehicleObj.selectedColor?.price?.colors?.[0]?.colorId ||
                          selectedVehicleObj.selectedColor?.id || null,
                name:     selectedVehicleObj.selectedColor?.name || selectedVehicleObj.selectedColor?.colorName,
                code:     selectedVehicleObj.selectedColor?.code || '#000000',
                imageUrl: selectedVehicleObj.selectedColor?.price?.colors?.[0]?.imageDetails?.[0]?.url ||
                          selectedVehicleObj.selectedColor?.imageUrl || null,
            },
        } : null;

        const normalizedDob = currentDob?.trim() ? currentDob : null;

        const isFinance = currentPayMode === 'finance';
        const normalizedLoanType = isFinance && loanType
            ? (loanType === 'Self' ? 'self' : 'companyAssist')
            : null;

        const loanPayload = {
            hypothecation:          isFinance ? paymentHypothecation : false,
            financerBranch:         isFinance ? financierBranch : '',
            financer:               isFinance && financer ? { id: financer, name: financer } : null,
            downPayment:            isFinance ? (parseFloat(downPayment) || 0) : 0,
            loanAmount:             isFinance ? (parseFloat(loanAmount) || 0) : 0,
            tenure:                 isFinance ? (parseInt(tenure) || 0) : 0,
            emiDate:                isFinance ? (parseInt(emiDay) || 0) : 0,
            emiStartDate:           isFinance ? (emiStartDate || null) : null,
            loanType:               normalizedLoanType,
            emiAmount:              isFinance ? (parseFloat(emiAmount) || 0) : 0,
            disbursementAmount:     isFinance ? (parseFloat(loanDisbursementAmount) || 0) : 0,
            showroomFinanceCharges: isFinance ? (parseFloat(showroomFinanceCharges) || 0) : 0,
        };

        const currentExec = salesOfficers.find(
            e => (e.name || e.profile?.employeeName) === currentSales
        );

        const resolveRto = () => {
            const found = rtos.find((item: any) => {
                const label = `${item.code || item.rtoCode} - ${item.area || item.rtoName}`;
                return label === rto;
            });
            return found
                ? { id: found.id, code: found.code || found.rtoCode, area: found.area || found.rtoName }
                : null;
        };

        const displayCustomerId = generatedCustomerId || snap?.customerId || null;

        const payload: any = {
            isAdvanceBooking: false,
            bookingId,
            eReceiptId,
            bookingStatus: 'PENDING',

            // Customer object — always use ref values for addresses (user may have edited)
            customer: snap ? {
                id:          snap.id,
                customerId:  snap.customerId,
                name:        currentName,
                fatherName:  currentFather || null,
                gender:      currentGender,
                email:       currentEmail || null,
                contacts:    snap.contacts || [],
                dateOfBirth: normalizedDob,
                address: {
                    line1:    currentAddr,
                    line2:    currentAddr2,
                    line3:    currentAddr3,
                    locality: currentLoc,
                    pincode:  currentPin,
                    country:  currentCountry ? { name: currentCountry } : null,
                    state:    currentState   ? { name: currentState }   : null,
                    city:     currentCity    ? { name: currentCity }    : null,
                },
            } : null,

            customerId:         displayCustomerId,
            customerName:       currentName,
            customerFatherName: currentFather || '',
            customerLine2:      currentAddr2,
            customerLine3:      currentAddr3,
            customerPhone:      currentPhone,
            customerGender:     currentGender,
            customerLocality:   currentLoc,
            customerCountry:    currentCountry,
            customerState:      currentState,
            customerCity:       currentCity,
            customerPincode:    currentPin,
            customerEmail:      currentEmail,
            customerDob:        normalizedDob,

            IDbranch: branchId,
            branch:   { id: branchId, name: selectedBranch.name || branch },

            nomineeName:  currentNominee,
            nomineeAge:   currentNomAge,
            relationship: currentRelation,

            vehicle:         vehicleData,
            selectedVehicle: vehicleData ? [{
                color: {
                    id:    vehicleData.color?.id,
                    color: vehicleData.color?.name,
                    code:  vehicleData.color?.code,
                    url:   vehicleData.color?.imageUrl,
                },
                vehicleDetail: {
                    id:        vehicleData.id,
                    modelName: vehicleData.modelName,
                    modelCode: vehicleData.modelCode,
                },
            }] : [],

            rto:     resolveRto(),
            rtoCode: rto?.split(' - ')[0] || 'KA-01',
            rtoArea: rto?.split(' - ')[1] || '',

            price: {
                showroomPrice:                parseFloat(showroomPrice)         || 0,
                onRoadPrice:                  parseFloat(onRoadPrice)           || 0,
                onRoadDiscount:               parseFloat(onRoadDiscount)        || 0,
                insuranceAmount:              parseFloat(insuranceAmount)       || 0,
                insuranceType:                insuranceType || 'Comprehensive',
                roadTax:                      parseFloat(roadTax)               || 0,
                handlingCharges:              parseFloat(handlingCharges)       || 0,
                registrationFee:              parseFloat(registrationFee)       || 0,
                numberPlate:                  parseFloat(numberPlateCharges)    || 0,
                tempRegister:                 parseFloat(tempRegCharges)        || 0,
                hp:                           parseFloat(hypothecationCharges)  || 0,
                paymentMode:                  currentPayMode,
                affidavit:                    parseFloat(affidavitAmount)       || 0,
                netRecievables:               parseFloat(netReceivables)        || 0,
                specialNoCharges:             parseFloat(specialNoCharges)      || 0,
                accessoriesTotal:             parseFloat(accessoriesTotal)      || 0,
                accessoriesTotalAfterDiscount: parseFloat(accessoriesAfterDiscount) || 0,
                totalDiscount:                parseFloat(totalDiscount)         || 0,
                finalAmount:                  parseFloat(finalAmount)           || 0,
            },

            exchangeVehicleName:  exchangeModel,
            exchangeVehiclePrice: parseFloat(exchangePrice) || 0,
            exchange: { vehicleModel: exchangeModel, vehiclePrice: parseFloat(exchangePrice) || null },

            accessories: accessories.filter(a => a.isSelected).map(a => ({
                id: a.arrayId || '',
                accessory: { id: a.id, name: a.partName, price: a.mrp },
                discount: a.discount,
                isPercent: a.isPercent,
                quantity: a.quantity,
            })),
            quotation: currentQuotes
                ? currentQuotes.split(', ').map(id => ({ id: id.trim() }))
                : [],

            color: { id: vehicleData?.color?.id || null },

            loan:     loanPayload,
            loanData: {
                finName:               isFinance ? financer : null,
                financerBranch:        loanPayload.financerBranch,
                downPayment:           loanPayload.downPayment,
                loanAmount:            loanPayload.loanAmount,
                tenure:                loanPayload.tenure,
                emiDate:               loanPayload.emiDate,
                emiStartDate:          loanPayload.emiStartDate,
                loanType:              loanPayload.loanType,
                emiAmount:             loanPayload.emiAmount,
                disbursementAmount:    loanPayload.disbursementAmount,
                showroomFinanceCharges: loanPayload.showroomFinanceCharges,
            },

            remarks: currentRemarks,
            authentication: { beforeVerification: null, afterVerification: null, digital: null, verifiedAt: null },
            pdf: 'example',
            pdfSigned: 'example',

            executive: currentExec || {
                id: currentSales,
                profile: {
                    employeeName: currentSales,
                    branch: [{ id: branchId, name: selectedBranch.name || branch }],
                },
            },

            authorisedTime: null,
            expectedDeliveryDate: currentExpDel ? (() => {
                if (currentExpDel.includes('/')) {
                    const [dd, mm, yyyy] = currentExpDel.split('/');
                    return `${yyyy}-${mm}-${dd}`;
                }
                return currentExpDel;
            })() : null,
            refferedBy:      currentReferred,
            confirmBookingId: null,
        };

        // Remove undefined keys
        Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
        console.log('📦 Final payload:', JSON.stringify(payload, null, 2));
        return payload;
    };

    // ─────────────────────────────────────────────────────────────────────
    // Save handler
    // ─────────────────────────────────────────────────────────────────────
    const handleSaveComplete = async () => {
        const errorTab = validateForm();
        if (errorTab !== null) { setActiveTab(errorTab); return; }

        toast.warn('Saving booking...');
        try {
            const bookingPayload = await createBookingPayload();
            const validation = validateBookingPayload(bookingPayload);
            if (!validation.isValid) {
                console.error('❌ Payload validation errors:', validation.errors);
                toast.error('Invalid booking data. Check all required fields.');
                return;
            }

            const response = await createBooking(bookingPayload);
            if (response.data.code === 200) {
                toast.success('Booking saved successfully!');
                // Navigate to FollowUpDetail with customer phone number
                const customerPhoneNumber = phoneRef.current || route.params?.customerPhone;
                if (customerPhoneNumber) {
                    setTimeout(() => navigation.navigate('FollowUpDetail', { id: customerPhoneNumber }), 1500);
                } else {
                    setTimeout(() => navigation.navigate('FollowUps'), 1500);
                }
            } else {
                const err = response.data;
                if (err?.err?.data?.errors) {
                    err.err.data.errors.forEach((e: any) => console.error('GraphQL error:', e.message));
                }
                toast.error(err?.err?.message || err?.message || 'Failed to save booking');
            }
        } catch (error: any) {
            if (error.response) toast.error(error.response.data?.message || 'Server error');
            else if (error.request) toast.error('Network error. Check your connection.');
            else toast.error(error.message || 'Failed to save booking');
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // Misc handlers
    // ─────────────────────────────────────────────────────────────────────
    const handleClose = () => navigation.goBack();

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        const formatted = date.toISOString().split('T')[0];
        setDobSync(formatted);
        const today = new Date();
        let a = today.getFullYear() - date.getFullYear();
        const m = today.getMonth() - date.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < date.getDate())) a--;
        setAgeSync(a.toString());
        setShowCalendarModal(false);
    };

    const handleAttachQuotation = (selected: string[]) => {
        if (selected.length > 0) {
            setQuotationsSync(selected.join(', '));
            toast.success(`Attached ${selected.length} quotation(s)`);
        }
        setShowAttachQuotationModal(false);
    };

    const handleAccessorySave = (saved: Accessory[]) => {
        setAccessories(saved);
        const before = saved.reduce((s, a) => s + a.priceBeforeDiscount, 0);
        const after  = saved.reduce((s, a) => s + a.priceAfterDiscount, 0);
        setAccessoriesTotal(before.toString());
        setAccessoriesAfterDiscount(after.toString());
    };

    const handleNext = () => {
        if (activeTab === 'customer') {
            setNameError(''); setPhoneError(''); setAddressError('');
            setLocalityError(''); setPincodeError(''); setSalesOfficerError('');
            let err = false;
            if (!customerFullName.trim()) { setNameError('Required'); err = true; }
            if (!phone.trim())            { setPhoneError('Required'); err = true; }
            if (!address.trim())          { setAddressError('Required'); err = true; }
            if (!locality.trim())         { setLocalityError('Required'); err = true; }
            if (!pincode.trim())          { setPincodeError('Required'); err = true; }
            if (!salesOfficer.trim())     { setSalesOfficerError('Required'); err = true; }
            if (!age.trim())              { toast.error('Age is required'); err = true; }
            if (!customerGender.trim())   { toast.error('Gender is required'); err = true; }
            if (!err) setActiveTab('vehicle');
        } else if (activeTab === 'vehicle') {
            if (!model) { toast.error('Please select a vehicle model'); return; }
            setActiveTab('payment');
        }
    };

    const handleBack = () => {
        if (activeTab === 'payment') setActiveTab('vehicle');
        else if (activeTab === 'vehicle') setActiveTab('customer');
    };

    // ─────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────
    return (
        <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
            {/* Header */}
            <View className="bg-white border-b border-gray-100 px-4 py-4 flex-row items-center">
                <TouchableOpacity onPress={handleClose} className="mr-3">
                    <ChevronLeft size={24} color={COLORS.gray[900]} />
                </TouchableOpacity>
                <View>
                    <Text className="text-gray-900 text-lg font-bold">Booking Register</Text>
                    {isAdvancedBooking && <Text className="text-sm text-teal-600">Advanced Booking</Text>}
                </View>
            </View>

            {/* Booking info card */}
            <View className="mt-2 bg-white rounded-xl border border-gray-100 p-4 mb-2 w-[330px] self-center">
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-gray-500 text-sm">Booking Id:</Text>
                    <Text className="text-teal-600 font-bold text-sm">New</Text>
                </View>
                <View className="flex-row justify-between items-center">
                    <Text className="text-gray-500 text-sm">Customer Id:</Text>
                    <Text className="text-gray-900 text-sm font-medium">{generatedCustomerId || 'Loading...'}</Text>
                </View>
            </View>

            {/* Tabs */}
            <View className="w-[340px] self-center bg-white border-b border-gray-100">
                <View className="flex-row items-center px-4">
                    {(['customer', 'vehicle', 'payment'] as const).map((tab, idx, arr) => (
                        <React.Fragment key={tab}>
                            <TouchableOpacity
                                onPress={() => setActiveTab(tab)}
                                className={`flex-1 py-3 items-center border-b-2 ${activeTab === tab ? 'border-teal-600' : 'border-transparent'}`}
                            >
                                <Text className={`text-sm font-medium ${activeTab === tab ? 'text-teal-600' : 'text-gray-600'}`}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Text>
                            </TouchableOpacity>
                            {idx < arr.length - 1 && <ChevronRight size={16} color={COLORS.gray[400]} />}
                        </React.Fragment>
                    ))}
                </View>
            </View>

            {/* Content */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                >
                    <View className="bg-white rounded-xl border border-gray-100 p-4">

                        {/* ── CUSTOMER TAB ────────────────────────────────── */}
                        {activeTab === 'customer' && (
                            <View>
                                <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                                    Customer Information
                                </Text>

                                {/* Branch */}
                                <View className="mb-4">
                                    <FormLabel label="Branch" required />
                                    <TouchableOpacity
                                        onPress={() => setShowBranchModal(true)}
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                                    >
                                        <Text className="text-gray-800 flex-1">{branch || 'Select Branch'}</Text>
                                        <ChevronRight size={16} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
                                </View>

                                {/* Phone */}
                                <View className="mb-4">
                                    <FormLabel label="Phone" required />
                                    <View className="flex-row gap-2">
                                        <View className="w-16 h-12 bg-gray-100 border border-gray-200 rounded-lg items-center justify-center">
                                            <Text className="text-gray-700 font-medium">+91</Text>
                                        </View>
                                        <TextInput
                                            value={phone}
                                            onChangeText={handlePhoneChange}
                                            placeholder="Phone Number"
                                            keyboardType="phone-pad"
                                            maxLength={10}
                                            className={`flex-1 h-12 bg-white border rounded-lg px-3 text-gray-800 ${phoneError ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                    </View>
                                    {phoneError ? <Text className="text-red-500 text-xs mt-1">{phoneError}</Text> : null}
                                </View>

                                {/* Customer Name */}
                                <View className="mb-4">
                                    <FormLabel label="Customer Name" required />
                                    <TextInput
                                        value={customerFullName}
                                        onChangeText={setCustomerFullNameSync}
                                        placeholder="Customer Full Name"
                                        className={`h-12 bg-white border rounded-lg px-3 text-gray-800 ${nameError ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {nameError ? <Text className="text-red-500 text-xs mt-1">{nameError}</Text> : null}
                                </View>

                                {/* Father Name */}
                                <View className="mb-4">
                                    <FormLabel label="Father's Name" required />
                                    <TextInput
                                        value={fatherName}
                                        onChangeText={setFatherNameSync}
                                        placeholder="Enter father's name"
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                {/* Address Line 1 */}
                                <View className="mb-4">
                                    <FormLabel label="Address Line 1" required />
                                    <TextInput
                                        value={address}
                                        onChangeText={setAddressSync}
                                        placeholder="Address Line 1"
                                        className={`h-12 bg-white border rounded-lg px-3 text-gray-800 ${addressError ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {addressError ? <Text className="text-red-500 text-xs mt-1">{addressError}</Text> : null}
                                </View>

                                {/* Address Line 2 */}
                                <View className="mb-4">
                                    <FormLabel label="Address Line 2" />
                                    <TextInput
                                        value={address2}
                                        onChangeText={setAddress2Sync}
                                        placeholder="Address Line 2"
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                {/* Address Line 3 */}
                                <View className="mb-4">
                                    <FormLabel label="Address Line 3" />
                                    <TextInput
                                        value={address3}
                                        onChangeText={setAddress3Sync}
                                        placeholder="Address Line 3"
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                {/* Locality */}
                                <View className="mb-4">
                                    <FormLabel label="Locality" required />
                                    <TextInput
                                        value={locality}
                                        onChangeText={setLocalitySync}
                                        placeholder="Locality"
                                        className={`h-12 bg-white border rounded-lg px-3 text-gray-800 ${localityError ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {localityError ? <Text className="text-red-500 text-xs mt-1">{localityError}</Text> : null}
                                </View>

                                {/* Country */}
                                <View className="mb-4">
                                    <FormLabel label="Country" required />
                                    <TouchableOpacity
                                        onPress={() => setShowCountryModal(true)}
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                                    >
                                        <Text className="text-gray-800 flex-1">{country || 'Select Country'}</Text>
                                        <ChevronRight size={16} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
                                </View>

                                {/* State */}
                                <View className="mb-4">
                                    <FormLabel label="State" required />
                                    <TouchableOpacity
                                        onPress={() => setShowStateModal(true)}
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                                    >
                                        <Text className="text-gray-800 flex-1">{stateVal || 'Select State'}</Text>
                                        <ChevronRight size={16} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
                                </View>

                                {/* City */}
                                <View className="mb-4">
                                    <FormLabel label="City" required />
                                    <TouchableOpacity
                                        onPress={() => setShowCityModal(true)}
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                                    >
                                        <Text className="text-gray-800 flex-1">{city || 'Select City'}</Text>
                                        <ChevronRight size={16} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
                                </View>

                                {/* Pincode */}
                                <View className="mb-4">
                                    <FormLabel label="Pincode" required />
                                    <TextInput
                                        value={pincode}
                                        onChangeText={setPincodeSync}
                                        placeholder="Pincode"
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        className={`h-12 bg-white border rounded-lg px-3 text-gray-800 ${pincodeError ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {pincodeError ? <Text className="text-red-500 text-xs mt-1">{pincodeError}</Text> : null}
                                </View>

                                {/* Email */}
                                <View className="mb-4">
                                    <FormLabel label="Email" />
                                    <TextInput
                                        value={email}
                                        onChangeText={setEmailSync}
                                        placeholder="Email"
                                        keyboardType="email-address"
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                {/* DOB */}
                                <View className="mb-4">
                                    <FormLabel label="DOB" required />
                                    <View className="flex-row items-center">
                                        <TextInput
                                            value={dob}
                                            onChangeText={setDobSync}
                                            placeholder="YYYY-MM-DD"
                                            className="flex-1 h-12 bg-white border border-gray-300 rounded-l-lg px-3 text-gray-800"
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowCalendarModal(true)}
                                            className="h-12 bg-teal-600 rounded-r-lg px-4 justify-center"
                                        >
                                            <Calendar size={20} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Age */}
                                <View className="mb-4">
                                    <FormLabel label="Age" required />
                                    <TextInput
                                        value={age}
                                        onChangeText={setAgeSync}
                                        placeholder="Age"
                                        keyboardType="numeric"
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                {/* Gender */}
                                <View className="mb-4">
                                    <FormLabel label="Gender" required />
                                    <View className="flex-row gap-4 mt-2">
                                        {['Male', 'Female', 'Other'].map(g => (
                                            <TouchableOpacity
                                                key={g}
                                                onPress={() => setCustomerGenderSync(g)}
                                                className={`flex-1 h-12 rounded-lg border flex-row items-center justify-center ${customerGender === g ? 'bg-teal-50 border-teal-600' : 'bg-white border-gray-300'}`}
                                            >
                                                <Text className={customerGender === g ? 'text-teal-700 font-bold' : 'text-gray-600'}>{g}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Nominee Age */}
                                <View className="mb-4">
                                    <FormLabel label="Nominee Age" />
                                    <TextInput
                                        value={nomineeAge}
                                        onChangeText={setNomineeAgeSync}
                                        placeholder="Nominee Age"
                                        keyboardType="numeric"
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                {/* Referred By */}
                                <View className="mb-4">
                                    <FormLabel label="Referred By" />
                                    <TouchableOpacity
                                        onPress={() => setShowReferredByModal(true)}
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                                    >
                                        <Text className="text-gray-800 flex-1">{referredBy || 'Select Referred By'}</Text>
                                        <ChevronRight size={16} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
                                </View>

                                {/* Relationship */}
                                <View className="mb-4">
                                    <FormLabel label="Relationship" required />
                                    <TouchableOpacity
                                        onPress={() => setShowRelationshipModal(true)}
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                                    >
                                        <Text className="text-gray-800 flex-1">{relationship || 'Select Relationship'}</Text>
                                        <ChevronRight size={16} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
                                </View>

                                {/* Nominee */}
                                <View className="mb-4">
                                    <FormLabel label="Nominee Details" required />
                                    <TextInput
                                        value={nominee}
                                        onChangeText={setNomineeSync}
                                        placeholder="Nominee Name"
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                    />
                                </View>

                                {/* Sales Officer */}
                                <View className="mb-4">
                                    <FormLabel label="Sales Officer" required />
                                    <TouchableOpacity
                                        onPress={() => setShowSalesOfficerModal(true)}
                                        className={`h-12 bg-white border rounded-lg px-3 flex-row items-center justify-between ${salesOfficerError ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <Text className="text-gray-800 flex-1">{salesOfficer || 'Select Sales Officer'}</Text>
                                        <ChevronRight size={16} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
                                    {salesOfficerError ? <Text className="text-red-500 text-xs mt-1">{salesOfficerError}</Text> : null}
                                </View>

                                {/* Quotations */}
                                <View className="mb-4">
                                    <View className="flex-row items-center justify-between mb-2">
                                        <FormLabel label="Quotations Associated" />
                                        <TouchableOpacity
                                            onPress={() => setShowAttachQuotationModal(true)}
                                            className="px-3 py-1 bg-teal-600 rounded-lg"
                                        >
                                            <Text className="text-white text-xs font-medium">Link Quotation</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {quotationsAssociated ? (
                                        <View className="flex-row flex-wrap gap-2 p-3 bg-gray-100 border border-gray-300 rounded-lg min-h-[48px]">
                                            {quotationsAssociated.split(',').map((q, i) => (
                                                <View key={i} className="px-3 py-1 bg-gray-400 rounded-full">
                                                    <Text className="text-white text-sm font-medium">{q.trim()}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    ) : (
                                        <View className="h-12 bg-gray-100 border border-gray-300 rounded-lg px-3 justify-center">
                                            <Text className="text-gray-500 text-sm">No quotations linked</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* ── VEHICLE TAB ──────────────────────────────────── */}
                        {activeTab === 'vehicle' && (
                            <View ref={vehicleSectionRef}>
                                <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                                    Vehicle Information
                                </Text>

                                {/* Manufacturer */}
                                <View className="mb-4">
                                    <FormLabel label="Manufacturer" required />
                                    <TouchableOpacity
                                        onPress={() => setShowManufacturerModal(true)}
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                                    >
                                        <Text className="text-gray-800 flex-1">{manufacturer || 'Select Manufacturer'}</Text>
                                        <ChevronRight size={16} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
                                </View>

                                {/* Model */}
                                <View className="mb-4">
                                    <FormLabel label="Model Name" required />
                                    <TouchableOpacity
                                        onPress={() => setShowModelModal(true)}
                                        className={`h-12 bg-white border rounded-lg px-3 flex-row items-center justify-between ${modelError ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <Text className="text-gray-800 flex-1">{model || 'Select Model Name'}</Text>
                                        <ChevronRight size={16} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
                                    {modelError ? <Text className="text-red-500 text-xs mt-1">{modelError}</Text> : null}
                                </View>

                                {/* RTO */}
                                <View className="mb-4">
                                    <FormLabel label="RTO" required />
                                    <TouchableOpacity
                                        onPress={() => setShowRtoModal(true)}
                                        className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between"
                                    >
                                        <Text className="text-gray-800 flex-1">{rto || 'Select RTO'}</Text>
                                        <ChevronRight size={16} color={COLORS.gray[400]} />
                                    </TouchableOpacity>
                                </View>

                                {/* Vehicle Color */}
                                <View className="mb-4">
                                    <FormLabel label="Vehicle Color" />
                                    <Text className="text-sm text-gray-600 mb-2">Selected Vehicle</Text>
                                    <View className={`h-16 px-3 py-2 rounded-lg flex-row items-center mb-3 ${isModelSelected ? 'bg-white border border-gray-300' : 'bg-gray-200'}`}>
                                        <Text className={`${isModelSelected ? 'text-gray-800' : 'text-gray-500'} flex-1`}>
                                            {vehicleColor || (isModelSelected ? 'Select Vehicle Color' : 'No Vehicle chosen')}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={isModelSelected ? () => navigation.navigate('SelectVehicleForBooking', {
                                            modelName: model,
                                            customerName: route.params?.customerName,
                                            customerId: route.params?.customerId,
                                            customerPhone: route.params?.customerPhone,
                                        }) : undefined}
                                        disabled={!isModelSelected}
                                        className={`px-4 py-3 rounded-lg flex-row items-center justify-center ${isModelSelected ? 'bg-teal-600 opacity-100' : 'bg-gray-300 opacity-50'}`}
                                    >
                                        <Text className={`font-medium mr-2 ${isModelSelected ? 'text-white' : 'text-gray-500'}`}>
                                            Select Vehicle Color
                                        </Text>
                                        <ChevronRight size={16} color={isModelSelected ? 'white' : '#6b7280'} />
                                    </TouchableOpacity>
                                </View>

                                {/* Accessories table */}
                                <View className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
                                    <View style={{ height: Math.max(80, Math.min(accessories.length * 50 + 40, 400)) }}>
                                        <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
                                            <ScrollView style={{ minWidth: 550 }} nestedScrollEnabled>
                                                <View className="flex-row bg-gray-50 border-b border-gray-200">
                                                    {['S.No', 'Accessory Name', 'Quantity', 'Discount', 'Price Before', 'Price After'].map((h, i) => (
                                                        <View key={h} style={{ width: i === 1 ? 150 : i === 2 ? 100 : 80 }} className="p-3 border-r border-gray-200">
                                                            <Text className="text-xs font-medium text-gray-700">{h}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                                {accessories.length === 0 ? (
                                                    <View className="flex-row border-b border-gray-100 p-3">
                                                        <Text className="text-sm text-gray-400 italic">No accessories added</Text>
                                                    </View>
                                                ) : accessories.map((acc, idx) => (
                                                    <View key={acc.id} className="flex-row border-b border-gray-100">
                                                        <View style={{ width: 80 }} className="p-3 border-r border-gray-100"><Text className="text-sm text-center">{idx + 1}</Text></View>
                                                        <View style={{ width: 150 }} className="p-3 border-r border-gray-100"><Text className="text-sm">{acc.partName}</Text></View>
                                                        <View style={{ width: 100 }} className="p-3 border-r border-gray-100"><Text className="text-sm text-center">{acc.quantity} @ ₹{acc.mrp}</Text></View>
                                                        <View style={{ width: 80 }} className="p-3 border-r border-gray-100"><Text className="text-sm text-center">{acc.discount}{acc.isPercent ? '%' : '₹'}</Text></View>
                                                        <View style={{ width: 80 }} className="p-3 border-r border-gray-100"><Text className="text-sm text-center">₹{(acc.quantity * acc.mrp).toFixed(2)}</Text></View>
                                                        <View style={{ width: 100 }} className="p-3 border-r border-gray-100"><Text className="text-sm text-center">₹{acc.priceAfterDiscount.toFixed(2)}</Text></View>
                                                    </View>
                                                ))}
                                            </ScrollView>
                                        </ScrollView>
                                    </View>
                                </View>

                                {/* Totals */}
                                <View className="mb-6">
                                    {[
                                        { label: 'Total Discount', value: totalDiscount, setter: setTotalDiscount },
                                        { label: 'Accessories Total', value: accessoriesTotal, setter: setAccessoriesTotal },
                                        { label: 'Accessories Total (after Discount)', value: accessoriesAfterDiscount, setter: setAccessoriesAfterDiscount },
                                    ].map(({ label, value, setter }) => (
                                        <View key={label} className="mb-4">
                                            <FormLabel label={label} />
                                            <View className="flex-row gap-2">
                                                <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
                                                <TextInput
                                                    value={value}
                                                    onChangeText={setter}
                                                    keyboardType="numeric"
                                                    editable={isExpectedDeliverySelected}
                                                    className={`flex-1 h-12 border border-gray-300 rounded-lg px-3 text-gray-800 ${isExpectedDeliverySelected ? 'bg-white' : 'bg-gray-50'}`}
                                                />
                                            </View>
                                        </View>
                                    ))}
                                    <TouchableOpacity
                                        onPress={isExpectedDeliverySelected ? () => setShowAccessoryModal(true) : undefined}
                                        disabled={!isExpectedDeliverySelected}
                                        className={`mt-1 ${isExpectedDeliverySelected ? 'opacity-100' : 'opacity-50'}`}
                                    >
                                        <Text className={`text-sm ${isExpectedDeliverySelected ? 'text-teal-600' : 'text-gray-400'}`}>+Add/View Accessory</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Exchange */}
                                <View className="mb-6 border-t pt-6">
                                    <Text className="text-base font-medium text-gray-700 mb-4">Exchange Vehicle Information</Text>
                                    <View className="mb-4">
                                        <FormLabel label="Exchange Model Name" />
                                        <TextInput value={exchangeModel} onChangeText={setExchangeModel} placeholder="Exchange Vehicle" className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800" />
                                    </View>
                                    <View>
                                        <FormLabel label="Exchange Price" />
                                        <View className="flex-row gap-2">
                                            <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
                                            <TextInput value={exchangePrice} onChangeText={setExchangePrice} keyboardType="numeric" className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800" />
                                        </View>
                                    </View>
                                </View>

                                {/* Vehicle Charges */}
                                <View className="mb-6 border-t pt-6">
                                    <Text className="text-base font-medium text-gray-700 mb-4">Vehicle Charges</Text>
                                    {[
                                        { label: 'Showroom Price', value: showroomPrice, setter: setShowroomPrice },
                                        { label: 'On-Road Price', value: onRoadPrice, setter: setOnRoadPrice },
                                        { label: 'Insurance Amount', value: insuranceAmount, setter: setInsuranceAmount },
                                        { label: 'Road Tax', value: roadTax, setter: setRoadTax },
                                        { label: 'Handling Charges', value: handlingCharges, setter: setHandlingCharges },
                                        { label: 'Registration Fee', value: registrationFee, setter: setRegistrationFee },
                                        { label: 'Warranty Price', value: warrantyPrice, setter: setWarrantyPrice },
                                        { label: 'Temp Registration', value: tempRegCharges, setter: setTempRegCharges },
                                        { label: 'Hypothecation', value: hypothecationCharges, setter: setHypothecationCharges },
                                        { label: 'Number Plate Charges', value: numberPlateCharges, setter: setNumberPlateCharges },
                                        { label: 'Affidavit Amount', value: affidavitAmount, setter: setAffidavitAmount },
                                        { label: 'Special No. Charges', value: specialNoCharges, setter: setSpecialNoCharges },
                                        { label: 'On Road Discount', value: onRoadDiscount, setter: setOnRoadDiscount },
                                    ].map(({ label, value, setter }) => (
                                        <View key={label} className="mb-4">
                                            <FormLabel label={label} />
                                            <View className="flex-row gap-2">
                                                <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
                                                <TextInput value={value} onChangeText={setter} keyboardType="numeric" placeholder="0" className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800" />
                                            </View>
                                        </View>
                                    ))}

                                    {/* Insurance Type */}
                                    <View className="mb-4">
                                        <FormLabel label="Insurance Type" />
                                        <TouchableOpacity onPress={() => setShowInsuranceTypeModal(true)} className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between">
                                            <Text className="text-gray-800 flex-1">{insuranceType || 'Select Insurance Type'}</Text>
                                            <ChevronRight size={16} color={COLORS.gray[400]} />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Expected Delivery Date */}
                                    <View className="mb-4">
                                        <FormLabel label="Expected Delivery Date" />
                                        <View className="flex-row gap-2">
                                            <TextInput
                                                value={expectedDelivery}
                                                onChangeText={setExpectedDeliverySync}
                                                placeholder="DD/MM/YYYY"
                                                className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800"
                                            />
                                            <TouchableOpacity onPress={() => setShowExpectedDeliveryModal(true)} className="h-12 w-12 bg-white border border-gray-300 rounded-lg items-center justify-center">
                                                <Calendar size={20} color="#6b7280" />
                                            </TouchableOpacity>
                                        </View>
                                        {expectedDelivery ? <Text className="text-xs text-green-600 mt-1">✅ Date set: {expectedDelivery}</Text> : null}
                                        <View className="flex-row gap-2 mt-2">
                                            <TouchableOpacity onPress={() => { const d = new Date(Date.now() + 7*86400000); setExpectedDeliverySync(`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`); }} className="px-2 py-1 bg-blue-500 rounded">
                                                <Text className="text-white text-xs">+1 Week</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => { const d = new Date(Date.now() + 30*86400000); setExpectedDeliverySync(`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`); }} className="px-2 py-1 bg-green-500 rounded">
                                                <Text className="text-white text-xs">+1 Month</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Final Amount */}
                                    <View>
                                        <FormLabel label="Final Amount" />
                                        <View className="flex-row gap-2">
                                            <Text className="px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50">₹</Text>
                                            <TextInput value={finalAmount} editable={false} placeholder="0" className="flex-1 h-12 bg-gray-50 border border-gray-300 rounded-lg px-3 text-gray-800" />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* ── PAYMENT TAB ──────────────────────────────────── */}
                        {activeTab === 'payment' && (
                            <View>
                                <Text className="text-gray-900 font-bold text-base mb-4 pb-2 border-b border-gray-100">
                                    Payment Information
                                </Text>

                                {/* Payment Mode */}
                                <View className="mb-4">
                                    <FormLabel label="Payment Mode" required />
                                    <View className="h-12 border border-gray-300 rounded-lg overflow-hidden bg-white flex-row">
                                        {['cash', 'finance'].map((mode, idx) => (
                                            <React.Fragment key={mode}>
                                                {idx > 0 && <View className="w-[1px] bg-gray-300" />}
                                                <TouchableOpacity onPress={() => setPaymentModeSync(mode)} className={`flex-1 h-12 justify-center items-center ${paymentMode === mode ? 'bg-teal-50' : 'bg-white'}`}>
                                                    <Text className={paymentMode === mode ? 'text-teal-700 font-medium' : 'text-gray-600'}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</Text>
                                                </TouchableOpacity>
                                            </React.Fragment>
                                        ))}
                                    </View>
                                </View>

                                {/* Finance fields */}
                                {paymentMode === 'finance' && (
                                    <View className="mb-4">
                                        <View className="mb-4">
                                            <FormLabel label="Hypothecation" required />
                                            <View className="flex-row gap-4 mt-2">
                                                {[true, false].map(val => (
                                                    <TouchableOpacity key={String(val)} onPress={() => setPaymentHypothecation(val)} className={`flex-1 h-12 rounded-lg border items-center justify-center ${paymentHypothecation === val ? 'bg-teal-50 border-teal-600' : 'bg-white border-gray-300'}`}>
                                                        <Text className={paymentHypothecation === val ? 'text-teal-700 font-bold' : 'text-gray-600'}>{val ? 'Yes' : 'No'}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                        <View className="mb-4">
                                            <FormLabel label="Loan Type" />
                                            <TouchableOpacity onPress={() => setShowLoanTypeModal(true)} className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between">
                                                <Text className="text-gray-800 flex-1">{loanType || 'Select Loan Type'}</Text>
                                                <ChevronRight size={16} color={COLORS.gray[400]} />
                                            </TouchableOpacity>
                                        </View>
                                        <View className="mb-4">
                                            <FormLabel label="Financier Name" required />
                                            <TextInput value={financer} onChangeText={setFinancer} placeholder="Financier Name" className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800" />
                                        </View>
                                        <View>
                                            <FormLabel label="Financier Branch" />
                                            <TextInput value={financierBranch} onChangeText={setFinancierBranch} placeholder="Financier Branch" className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800" />
                                        </View>
                                    </View>
                                )}

                                {/* Company Assisted Loan */}
                                {paymentMode === 'finance' && loanType === 'Company Assisted' && (
                                    <View className="border-2 border-gray-300 rounded-lg p-4 mb-4">
                                        <Text className="text-base font-medium text-gray-700 mb-4">Financial Assistance Data</Text>
                                        {[
                                            { label: 'Down Payment', value: downPayment, setter: setDownPayment },
                                            { label: 'Loan Amount', value: loanAmount, setter: setLoanAmount },
                                            { label: 'EMI Amount', value: emiAmount, setter: setEmiAmount },
                                            { label: 'Loan Disbursement Amount', value: loanDisbursementAmount, setter: setLoanDisbursementAmount },
                                            { label: 'Showroom Finance Charges', value: showroomFinanceCharges, setter: setShowroomFinanceCharges },
                                        ].map(({ label, value, setter }) => (
                                            <View key={label} className="mb-4">
                                                <FormLabel label={label} />
                                                <View className="flex-row gap-2">
                                                    <View className="h-12 w-12 bg-gray-50 border border-gray-300 rounded-lg items-center justify-center"><Text className="text-gray-600">₹</Text></View>
                                                    <TextInput value={value} onChangeText={setter} placeholder="0" keyboardType="numeric" className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800" />
                                                </View>
                                            </View>
                                        ))}
                                        <View className="mb-4">
                                            <FormLabel label="Tenure" />
                                            <TouchableOpacity onPress={() => setShowTenureModal(true)} className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between">
                                                <Text className="text-gray-800 flex-1">{tenure || 'Select Tenure'}</Text>
                                                <ChevronRight size={16} color={COLORS.gray[400]} />
                                            </TouchableOpacity>
                                        </View>
                                        <View className="mb-4">
                                            <FormLabel label="EMI Date (Day)" />
                                            <TouchableOpacity onPress={() => setShowEmiDayModal(true)} className="h-12 bg-white border border-gray-300 rounded-lg px-3 flex-row items-center justify-between">
                                                <Text className="text-gray-800 flex-1">{emiDay || 'Select Day'}</Text>
                                                <ChevronRight size={16} color={COLORS.gray[400]} />
                                            </TouchableOpacity>
                                        </View>
                                        <View>
                                            <FormLabel label="EMI Start Date" />
                                            <TextInput value={emiStartDate} onChangeText={setEmiStartDate} placeholder="YYYY-MM-DD" className="h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800" />
                                        </View>
                                    </View>
                                )}

                                {/* Remarks */}
                                <View className="mb-4">
                                    <FormLabel label="Remarks" />
                                    <TextInput value={remarks} onChangeText={setRemarksSync} multiline numberOfLines={4} textAlignVertical="top" placeholder="Remarks" className="h-24 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800" />
                                </View>

                                {/* Net Receivables */}
                                <View>
                                    <FormLabel label="Net Receivables" />
                                    <View className="flex-row gap-2">
                                        <View className="h-12 w-12 bg-gray-50 border border-gray-300 rounded-lg items-center justify-center"><Text className="text-gray-600">₹</Text></View>
                                        <TextInput value={netReceivables} onChangeText={setNetReceivables} placeholder="0" keyboardType="numeric" className="flex-1 h-12 bg-white border border-gray-300 rounded-lg px-3 text-gray-800" />
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer */}
            <View className="bg-white border-t border-gray-100 p-4 flex-row gap-3">
                {activeTab === 'customer' ? (
                    <>
                        <Button title="Cancel" variant="outline" className="flex-1" onPress={handleClose} />
                        <Button title="Next" className="flex-1" onPress={handleNext} />
                    </>
                ) : activeTab === 'vehicle' ? (
                    <>
                        <Button title="Back" variant="outline" className="flex-1" onPress={handleBack} />
                        <Button title="Next" className="flex-1" onPress={handleNext} />
                    </>
                ) : (
                    <>
                        <Button title="Back" variant="outline" className="flex-1" onPress={handleBack} />
                        <Button title="Save & Complete" className="flex-1" onPress={handleSaveComplete} />
                    </>
                )}
            </View>

            {/* ── MODALS ──────────────────────────────────────────────────── */}

            {/* Branch */}
            <CustomModal visible={showBranchModal} onClose={() => setShowBranchModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select Branch</Text></View>
                <ScrollView>{branches.map(b => (<TouchableOpacity key={b.id} onPress={() => { setBranch(b.name); setSelectedBranchObj(b); setShowBranchModal(false); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{b.name}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowBranchModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* Country */}
            <CustomModal visible={showCountryModal} onClose={() => setShowCountryModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select Country</Text></View>
                <ScrollView>{countries.map(c => (<TouchableOpacity key={c.id} onPress={() => { setCountrySync(c.name); setShowCountryModal(false); fetchStates(c.id); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{c.name}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowCountryModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* State */}
            <CustomModal visible={showStateModal} onClose={() => setShowStateModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select State</Text></View>
                <ScrollView>{states.map(s => (<TouchableOpacity key={s.id} onPress={() => { setStateValSync(s.name); setCitySync(''); setShowStateModal(false); fetchCities(s.id); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{s.name}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowStateModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* City */}
            <CustomModal visible={showCityModal} onClose={() => setShowCityModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select City</Text></View>
                <ScrollView>{cities.map(c => (<TouchableOpacity key={c.id} onPress={() => { setCitySync(c.name); setShowCityModal(false); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{c.name}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowCityModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* RTO */}
            <CustomModal visible={showRtoModal} onClose={() => setShowRtoModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select RTO</Text></View>
                <ScrollView>{rtos.map(r => (<TouchableOpacity key={r.id} onPress={() => { setRto(`${r.code} - ${r.area}`); setShowRtoModal(false); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{r.code} - {r.area}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowRtoModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* Manufacturer */}
            <CustomModal visible={showManufacturerModal} onClose={() => setShowManufacturerModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select Manufacturer</Text></View>
                <ScrollView>{manufacturers.map(m => (<TouchableOpacity key={m.id} onPress={() => { setManufacturer(m.name); setShowManufacturerModal(false); fetchModels(m.id); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{m.name}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowManufacturerModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* Model */}
            <CustomModal visible={showModelModal} onClose={() => setShowModelModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select Model</Text></View>
                <ScrollView>{models.map(m => {
                    const display = m.modelCode && m.modelName ? `${m.modelCode} - ${m.modelName}` : m.name || m.code || '';
                    return (
                        <TouchableOpacity key={m.id || m._id} onPress={() => { setModel(display); currentModelRef.current = display; setShowModelModal(false); }} className="p-4 border-b border-gray-100">
                            <Text className="text-gray-800">{display}</Text>
                        </TouchableOpacity>
                    );
                })}</ScrollView>
                <TouchableOpacity onPress={() => setShowModelModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* Sales Officer */}
            <CustomModal visible={showSalesOfficerModal} onClose={() => setShowSalesOfficerModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select Sales Officer</Text></View>
                <ScrollView>{salesOfficers.map(o => (<TouchableOpacity key={o.id} onPress={() => { setSalesOfficerSync(o.name || o.profile?.employeeName || ''); setShowSalesOfficerModal(false); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{o.name || o.profile?.employeeName}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowSalesOfficerModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* Referred By */}
            <CustomModal visible={showReferredByModal} onClose={() => setShowReferredByModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select Referred By</Text></View>
                <ScrollView>{referredByOptions.map(o => (<TouchableOpacity key={o.id} onPress={() => { setReferredBySync(o.name); setShowReferredByModal(false); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{o.name}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowReferredByModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* Relationship */}
            <CustomModal visible={showRelationshipModal} onClose={() => setShowRelationshipModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select Relationship</Text></View>
                <ScrollView>{relationshipOptions.map(o => (<TouchableOpacity key={o.id} onPress={() => { setRelationshipSync(o.name); setShowRelationshipModal(false); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{o.name}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowRelationshipModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* Insurance Type */}
            <CustomModal visible={showInsuranceTypeModal} onClose={() => setShowInsuranceTypeModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select Insurance Type</Text></View>
                <ScrollView>{['Comprehensive', 'Third Party', 'Zero Dep'].map(t => (<TouchableOpacity key={t} onPress={() => { setInsuranceType(t); setShowInsuranceTypeModal(false); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{t}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowInsuranceTypeModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* Loan Type */}
            <CustomModal visible={showLoanTypeModal} onClose={() => setShowLoanTypeModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select Loan Type</Text></View>
                <ScrollView>{['Self', 'Company Assisted'].map(t => (<TouchableOpacity key={t} onPress={() => { setLoanType(t); setShowLoanTypeModal(false); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{t}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowLoanTypeModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* Tenure */}
            <CustomModal visible={showTenureModal} onClose={() => setShowTenureModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select Tenure</Text></View>
                <ScrollView>{['1','2','3','6','12','24','36','48','60'].map(t => (<TouchableOpacity key={t} onPress={() => { setTenure(t); setShowTenureModal(false); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{t} months</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowTenureModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* EMI Day */}
            <CustomModal visible={showEmiDayModal} onClose={() => setShowEmiDayModal(false)}>
                <View className="p-4 border-b border-gray-200"><Text className="text-lg font-semibold">Select EMI Day</Text></View>
                <ScrollView>{Array.from({ length: 31 }, (_, i) => i + 1).map(d => (<TouchableOpacity key={d} onPress={() => { setEmiDay(d.toString()); setShowEmiDayModal(false); }} className="p-4 border-b border-gray-100"><Text className="text-gray-800">{d}</Text></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setShowEmiDayModal(false)} className="p-4 border-t border-gray-200"><Text className="text-center text-gray-600">Cancel</Text></TouchableOpacity>
            </CustomModal>

            {/* Attach Quotation */}
            <AttachQuotationModal visible={showAttachQuotationModal} onClose={() => setShowAttachQuotationModal(false)} onAttach={handleAttachQuotation} />

            {/* Accessory */}
            <AccessoryModal visible={showAccessoryModal} onClose={() => setShowAccessoryModal(false)} onSave={handleAccessorySave} initialAccessories={accessories} />

            {/* DOB Calendar */}
            <Modal visible={showCalendarModal} transparent animationType="slide" onRequestClose={() => setShowCalendarModal(false)}>
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="bg-white rounded-xl p-6 w-11/12 max-w-sm">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-semibold text-gray-800">Select Date of Birth</Text>
                            <TouchableOpacity onPress={() => setShowCalendarModal(false)}><X size={20} color={COLORS.gray[600]} /></TouchableOpacity>
                        </View>
                        <View className="space-y-4">
                            {[
                                { label: 'Year', val: selectedDate.getFullYear().toString(), onChange: (t: string) => { const d = new Date(selectedDate); d.setFullYear(parseInt(t) || new Date().getFullYear()); setSelectedDate(d); }, ph: 'YYYY' },
                                { label: 'Month', val: (selectedDate.getMonth() + 1).toString(), onChange: (t: string) => { const d = new Date(selectedDate); d.setMonth((parseInt(t) || 1) - 1); setSelectedDate(d); }, ph: 'MM' },
                                { label: 'Day', val: selectedDate.getDate().toString(), onChange: (t: string) => { const d = new Date(selectedDate); d.setDate(parseInt(t) || 1); setSelectedDate(d); }, ph: 'DD' },
                            ].map(({ label, val, onChange, ph }) => (
                                <View key={label}>
                                    <Text className="text-sm text-gray-600 mb-2">{label}</Text>
                                    <TextInput value={val} onChangeText={onChange} keyboardType="numeric" placeholder={ph} className="h-10 border border-gray-300 rounded-lg px-3" />
                                </View>
                            ))}
                        </View>
                        <TouchableOpacity onPress={() => handleDateSelect(selectedDate)} className="mt-6 bg-teal-600 rounded-lg py-3">
                            <Text className="text-white text-center font-medium">Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Expected Delivery Calendar */}
            <Modal visible={showExpectedDeliveryModal} transparent animationType="fade" onRequestClose={() => setShowExpectedDeliveryModal(false)}>
                <View className="flex-1 bg-black/40 items-center justify-center px-4">
                    <View className="bg-white rounded-2xl p-4 w-full max-w-md">
                        <Text className="text-gray-900 font-bold mb-3">Select Expected Delivery Date</Text>
                        <RNCalendar
                            current={expectedDelivery ? expectedDelivery.split('/').reverse().join('-') : undefined}
                            minDate={new Date().toISOString().split('T')[0]}
                            onDayPress={(day: any) => {
                                const [yyyy, mm, dd] = day.dateString.split('-');
                                setExpectedDeliverySync(`${dd}/${mm}/${yyyy}`);
                                setShowExpectedDeliveryModal(false);
                            }}
                            theme={{ todayTextColor: COLORS.primary, selectedDayBackgroundColor: COLORS.primary, selectedDayTextColor: '#fff', arrowColor: COLORS.primary }}
                            markedDates={expectedDelivery ? { [expectedDelivery.split('/').reverse().join('-')]: { selected: true, selectedColor: COLORS.primary } } : undefined}
                        />
                        <View className="flex-row justify-end mt-4">
                            <TouchableOpacity onPress={() => setShowExpectedDeliveryModal(false)} className="px-4 py-2 rounded-lg bg-teal-600">
                                <Text className="text-white font-semibold">Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}