import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { ENDPOINT, getVehicleMasterById, getFinancers, getQuotationById } from '../../src/api';

type SelectPriceNavigationProp = StackNavigationProp<RootStackParamList, 'SelectPrice'>;
type SelectPriceRouteProp = RouteProp<RootStackParamList, 'SelectPrice'>;

export default function SelectPriceScreen({ navigation, route }: { navigation: SelectPriceNavigationProp; route: SelectPriceRouteProp }) {
    const { vehicleId, vehicleData, returnTo, quotationId, viewMode, paymentDetails } = route.params;

    console.log('🔍 SelectPriceScreen - Incoming paymentDetails:', paymentDetails);
    console.log('🔍 SelectPriceScreen - viewMode:', viewMode);

    const [selectedInsurance, setSelectedInsurance] = useState<string[]>([]);
    const [selectedOthers, setSelectedOthers] = useState<string[]>([]);
    const [resolvedVehicle, setResolvedVehicle] = useState<any>(null);
    const [insuranceError, setInsuranceError] = useState(false);
    const [selectedColorIndex, setSelectedColorIndex] = useState(0);
    const [vehicleColors, setVehicleColors] = useState<any[]>([]);

    // Payment mode state (like web) - initialize from existing paymentDetails
    const getInitialPaymentType = (): 'cash' | 'finance' => {
        console.log('🔍 Debug paymentDetails:', paymentDetails);
        console.log('🔍 paymentDetails.financeDetails:', paymentDetails?.financeDetails);
        console.log('🔍 paymentDetails.financerId:', paymentDetails?.financerId);
        console.log('🔍 paymentDetails.paymentType:', paymentDetails?.paymentType);

        // First check explicit paymentType (like web app priority)
        if (paymentDetails?.paymentType) {
            console.log('✅ Using explicit paymentType:', paymentDetails.paymentType);
            return paymentDetails.paymentType;
        }

        // Check if we're in view mode with existing payment details
        if (viewMode && paymentDetails) {
            console.log('📋 View Mode - Using existing paymentDetails');

            // Check for finance indicators
            if (paymentDetails.financeDetails?.financer || 
                paymentDetails.financerId ||
                (paymentDetails.financerTenure?.data && paymentDetails.financerTenure.data.length > 0) ||
                (paymentDetails.downPayment && paymentDetails.downPayment > 0)) {
                console.log('✅ Detected Finance mode from finance indicators');
                return 'finance';
            }
        }

        // Check if financer exists to determine payment type (PRIORITY - like web)
        if (paymentDetails?.financeDetails?.financer || paymentDetails?.financerId) {
            console.log('✅ Detected Finance mode (financer exists)');
            return 'finance';
        }

        // Check if there's any EMI data indicating finance mode
        if (paymentDetails?.financerTenure?.data && paymentDetails.financerTenure.data.length > 0) {
            console.log('✅ Detected Finance mode (EMI data exists)');
            return 'finance';
        }

        // Check if down payment exists (indicates finance mode)
        if (paymentDetails?.downPayment && paymentDetails.downPayment > 0) {
            console.log('✅ Detected Finance mode (down payment exists)');
            return 'finance';
        }

        // NEW: Check if this might be a finance quotation based on context clues
        // Since we're getting priceDetails but no payment structure, we need to determine
        // if this should be finance or cash based on other factors
        if (viewMode && paymentDetails?.priceDetails && !paymentDetails?.paymentType) {
            console.log('🤔 View mode with priceDetails but no paymentType - checking context');
            
            // For now, we'll need to check if there's any way to determine finance mode
            // This is a temporary fix - the real issue is that payment details aren't being passed correctly
            console.log('⚠️ Cannot determine payment type - defaulting to cash (payment details incomplete)');
        }

        // Default to cash
        console.log('⚠️ Defaulting to Cash mode');
        return 'cash';
    };

    const [paymentType, setPaymentType] = useState<'cash' | 'finance'>(getInitialPaymentType());
    const [financerList, setFinancerList] = useState<any[]>([]);
    const [selectedFinancer, setSelectedFinancer] = useState<string>(paymentDetails?.financerId || '');
    const [downPayment, setDownPayment] = useState<string>(paymentDetails?.downPayment?.toString() || '');
    const [emiRows, setEmiRows] = useState<Array<{ id: number; tenure: string; emi: string }>>(() => {
        // Initialize EMI rows from existing data
        if (paymentDetails?.financerTenure?.data) {
            return paymentDetails.financerTenure.data.map((item: any, index: number) => ({
                id: index + 1,
                tenure: item.tenure?.toString() || '',
                emi: item.emi?.toString() || ''
            }));
        }
        return [{ id: 1, tenure: '', emi: '' }];
    });

    const [quotationData, setQuotationData] = useState<any>(null);

    // Fetch quotation data if paymentDetails are incomplete and we have quotationId
    useEffect(() => {
        if (quotationId && viewMode && (!paymentDetails?.paymentType || !paymentDetails?.financerId)) {
            console.log('🔄 Fetching quotation data to get payment details');
            getQuotationById(quotationId)
                .then((res) => {
                    const data = res?.data;
                    const quotation = data?.response?.data || null;
                    
                    if (quotation) {
                        console.log('📄 Quotation data fetched:', quotation);
                        setQuotationData(quotation);
                        
                        // Extract payment details from quotation
                        const vehicle = Array.isArray(quotation.vehicle) && quotation.vehicle.length > 0 
                            ? quotation.vehicle[0] 
                            : null;
                        
                        console.log('🚗 Vehicle from quotation:', vehicle);
                        console.log('🔍 Vehicle payment details:', vehicle?.paymentDetails);
                        console.log('🔍 Vehicle financer:', vehicle?.financer);
                        console.log('🔍 Vehicle downPayment:', vehicle?.downPayment);
                        
                        // Update payment type if we found finance details
                        if (vehicle?.financer || vehicle?.downPayment || vehicle?.paymentDetails?.paymentType) {
                            const detectedPaymentType = vehicle?.paymentDetails?.paymentType || 
                                (vehicle?.financer ? 'finance' : 'cash');
                            console.log('💡 Detected payment type from quotation:', detectedPaymentType);
                            setPaymentType(detectedPaymentType);
                            
                            // Update other fields
                            if (vehicle?.paymentDetails?.financerId || vehicle?.financer) {
                                setSelectedFinancer(vehicle?.paymentDetails?.financerId || vehicle?.financer);
                            }
                            if (vehicle?.paymentDetails?.downPayment || vehicle?.downPayment) {
                                setDownPayment((vehicle?.paymentDetails?.downPayment || vehicle?.downPayment)?.toString() || '');
                            }
                            if (vehicle?.paymentDetails?.financerTenure?.data || vehicle?.financerTenure?.data) {
                                const tenureData = vehicle?.paymentDetails?.financerTenure?.data || vehicle?.financerTenure?.data;
                                if (tenureData && tenureData.length > 0) {
                                    setEmiRows(tenureData.map((item: any, index: number) => ({
                                        id: index + 1,
                                        tenure: item.tenure?.toString() || '',
                                        emi: item.emi?.toString() || ''
                                    })));
                                }
                            }
                        }
                    }
                })
                .catch((err) => {
                    console.error('❌ Failed to fetch quotation:', err);
                });
        }
    }, [quotationId, viewMode, paymentDetails]);

    const activeVehicle = resolvedVehicle || vehicleData;
    // Merge price sources to ensure we have both master prices and quotation-specific overrides/selections
    const price = useMemo(() => {
        // activeVehicle.price can be: a flat object {showroomPrice: ...}, an array [{showroomPrice: ...}], or undefined
        let basePrice = activeVehicle?.price || {};
        if (Array.isArray(basePrice)) {
            basePrice = basePrice[0] || {};
        }
        let detailPrice = paymentDetails?.priceDetails || {};
        if (Array.isArray(detailPrice)) {
            detailPrice = detailPrice[0] || {};
        }
        return { ...basePrice, ...detailPrice };
    }, [activeVehicle, paymentDetails]);

    const priceBreakdown = useMemo(() => {
        const items = [
            { key: 'showroomPrice', label: 'Ex-Showroom Price' },
            { key: 'roadTax', label: 'Road Tax' },
            { key: 'handlingCharges', label: 'Handling Charges' },
            { key: 'registrationFee', label: 'Registration Fee' },
            { key: 'tcs', label: 'Tcs' },
        ];
        return items
            .map((item) => ({
                ...item,
                amount: Number(price?.[item.key] || 0),
            }))
            .filter((item) => item.amount > 0);
    }, [price]);

    const baseTotal = priceBreakdown.reduce((sum, item) => sum + item.amount, 0);

    const insuranceOptions = useMemo(() => {
        const options = [
            { id: 'insurance1plus5', label: '1+5' },
            { id: 'insurance5plus5', label: '5+5' },
            { id: 'insurance1plus5ZD', label: '1+5 Zero Dep' },
            { id: 'insurance5plus5ZD', label: '5+5 Zero Dep' },
        ];
        return options
            .map((opt) => ({
                ...opt,
                amount: Number(price?.[opt.id] || 0),
            }))
            .filter((opt) => viewMode ? (opt.amount > 0 || selectedInsurance.includes(opt.id)) : (opt.amount > 0));
    }, [price, viewMode, selectedInsurance]);

    const otherOptions = useMemo(() => {
        const options = [
            { id: 'warrantyPrice', label: 'Extended Warranty' },
            { id: 'amc', label: 'Amc' },
            { id: 'rsa', label: 'Rsa' },
            { id: 'otherCharges', label: 'Other Charges' },
            { id: 'discount', label: 'Discount' },
        ];
        return options
            .map((opt) => ({
                ...opt,
                amount: Number(price?.[opt.id] || 0),
            }))
            .filter((opt) => viewMode ? (opt.amount > 0 || selectedOthers.includes(opt.id)) : (opt.amount > 0));
    }, [price, viewMode, selectedOthers]);

    const insuranceAmount = useMemo(() => {
        return selectedInsurance.reduce((sum, id) => {
            const opt = insuranceOptions.find((o) => o.id === id);
            return opt ? sum + opt.amount : sum;
        }, 0);
    }, [insuranceOptions, selectedInsurance]);

    const toggleInsurance = (id: string) => {
        if (viewMode) return;
        setInsuranceError(false);
        setSelectedInsurance((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const othersAmount = useMemo(() => {
        return selectedOthers.reduce((sum, id) => {
            const opt = otherOptions.find((o) => o.id === id);
            if (!opt) return sum;
            return id === 'discount' ? sum - opt.amount : sum + opt.amount;
        }, 0);
    }, [selectedOthers, otherOptions]);

    const totalAmount = baseTotal + insuranceAmount + othersAmount;

    const selectedInsuranceLabels = useMemo(() => {
        return selectedInsurance
            .map((id) => insuranceOptions.find((o) => o.id === id)?.label)
            .filter(Boolean);
    }, [selectedInsurance, insuranceOptions]);

    const totalWithOthers = baseTotal + othersAmount;
    const cumulativeInsuranceRows = useMemo(() => {
        let running = totalWithOthers;
        const rows: Array<{ label: string; amount: number }> = [];
        selectedInsurance.forEach((id, idx) => {
            const opt = insuranceOptions.find((o) => o.id === id);
            if (!opt) return;
            running += opt.amount;
            const labels = selectedInsuranceLabels.slice(0, idx + 1).join(' + ');
            rows.push({
                label: `Total + ${labels}`,
                amount: running,
            });
        });
        return rows;
    }, [selectedInsurance, insuranceOptions, selectedInsuranceLabels, totalWithOthers]);

    const toggleOther = (id: string) => {
        if (viewMode) return;
        setSelectedOthers(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        if (!viewMode) return;
        const insurance = paymentDetails?.priceDetails?.insurance || [];
        const others = paymentDetails?.priceDetails?.others || [];
        setSelectedInsurance(Array.isArray(insurance) ? insurance : []);
        setSelectedOthers(Array.isArray(others) ? others : []);
    }, [viewMode, paymentDetails]);

    useEffect(() => {
        console.log('🚀 SelectPriceScreen mounted with params:', route.params);
        console.log('🚀 Vehicle data received:', vehicleData);
        console.log('🚀 Vehicle ID received:', vehicleId);

        // Load financer list (like web)
        loadFinancerList();
    }, []);

    // Load financer list (like web)
    const loadFinancerList = async () => {
        try {
            const result = await getFinancers();
            const data = result?.data;
            if (data?.code === 200) {
                setFinancerList(data.response?.data || []);
                console.log('✅ Financer list loaded:', data.response?.data?.length || 0);
            }
        } catch (error) {
            console.error('❌ Error loading financer list:', error);
        }
    };

    // Initialize payment details from existing data (like web)
    useEffect(() => {
        if (!paymentDetails) return;

        console.log('💳 Initializing payment details:', paymentDetails);

        // Check if explicit payment mode exists first
        if (paymentDetails.paymentType === 'finance') {
            console.log('💳 Setting finance type because paymentType is explicitly finance');
            setPaymentType('finance');
            setSelectedFinancer(paymentDetails.financerId || paymentDetails.financer || '');
            setDownPayment(paymentDetails.downPayment?.toString() || '');

            // Handle financerTenure data
            if (paymentDetails.financerTenure?.data) {
                const populatedRows = paymentDetails.financerTenure.data.map((item: any, index: number) => ({
                    id: index + 1,
                    tenure: item.tenure?.toString() || '',
                    emi: item.emi?.toString() || ''
                }));
                setEmiRows(populatedRows.length > 0 ? populatedRows : [{ id: 1, tenure: '', emi: '' }]);
            }
        } else if (paymentDetails.financerId || paymentDetails.financer) {
            // Finance payment mode
            console.log('💳 Setting finance type because financer exists');
            setPaymentType('finance');
            setSelectedFinancer(paymentDetails.financerId || paymentDetails.financer || '');
            setDownPayment(paymentDetails.downPayment?.toString() || '');

            // Handle financerTenure data
            if (paymentDetails.financerTenure?.data) {
                const populatedRows = paymentDetails.financerTenure.data.map((item: any, index: number) => ({
                    id: index + 1,
                    tenure: item.tenure?.toString() || '',
                    emi: item.emi?.toString() || ''
                }));
                setEmiRows(populatedRows.length > 0 ? populatedRows : [{ id: 1, tenure: '', emi: '' }]);
            }
        } else if (paymentDetails.paymentType === 'cash') {
            // Explicitly cash
            console.log('💳 Setting cash type explicitly');
            setPaymentType('cash');
            setSelectedFinancer('');
            setDownPayment('');
            setEmiRows([{ id: 1, tenure: '', emi: '' }]);
        } else {
            // Cash payment mode fallback
            console.log('💳 Setting cash type because no financer exists and no explicit type');
            setPaymentType('cash');
            setSelectedFinancer('');
            setDownPayment('');
            setEmiRows([{ id: 1, tenure: '', emi: '' }]);
        }
    }, [paymentDetails]);

    useEffect(() => {
        if (!viewMode || !vehicleId) return;
        console.log('🔍 Fetching vehicle master by ID:', vehicleId);
        getVehicleMasterById(vehicleId)
            .then((res) => {
                const data = res?.data;
                const vehicle = data?.response?.data || data?.data || null;
                console.log('✅ Vehicle master fetched:', vehicle?.name || vehicle?.modelName);
                setResolvedVehicle(vehicle);

                // Extract colors from vehicle data (similar to web app)
                if (vehicle) {
                    const extractedColors = extractVehicleColors(vehicle);
                    setVehicleColors(extractedColors);
                }
            })
            .catch((error) => {
                console.error('❌ Error fetching vehicle master:', error);
                setResolvedVehicle(null);
            });
    }, [viewMode, vehicleId]);

    // Extract colors when vehicle data is available
    useEffect(() => {
        console.log('🔍 Active vehicle changed:', activeVehicle?.name || activeVehicle?.modelName);
        console.log('🔍 Current vehicleColors length:', vehicleColors.length);
        if (activeVehicle && vehicleColors.length === 0) {
            console.log('🎨 Extracting colors from active vehicle...');
            const extractedColors = extractVehicleColors(activeVehicle);
            setVehicleColors(extractedColors);
        }
    }, [activeVehicle]);

    // Extract colors from vehicle data (similar to web app approach)
    const extractVehicleColors = (vehicle: any) => {
        const colors: any[] = [];

        console.log('🔍 Extracting colors from vehicle:', vehicle?.name || vehicle?.modelName);
        console.log('🔍 Vehicle price structure:', vehicle?.price);

        // Method 1: From price.colors array (like web app)
        const prices = Array.isArray(vehicle.price) ? vehicle.price : [vehicle.price].filter(Boolean);
        console.log('🔍 Processing prices:', prices.length);

        prices.forEach((price: any, priceIndex: number) => {
            console.log(`🔍 Price ${priceIndex}:`, price);
            if (price.colors && Array.isArray(price.colors)) {
                console.log(`🔍 Found ${price.colors.length} colors in price ${priceIndex}:`, price.colors);
                price.colors.forEach((colorData: any, colorIndex: number) => {
                    console.log(`🎨 Processing color ${colorIndex}:`, colorData);

                    // Extract image URL from various possible structures
                    let imageUrl = '';
                    if (colorData.imageDetails && Array.isArray(colorData.imageDetails) && colorData.imageDetails.length > 0) {
                        imageUrl = colorData.imageDetails[0].url || '';
                    } else if (typeof colorData.url === 'string') {
                        imageUrl = colorData.url;
                    } else if (colorData.url && colorData.url.url) {
                        imageUrl = colorData.url.url;
                    }

                    const color = {
                        id: colorData.id || colorData.colorId || `color-${Math.random()}`,
                        name: colorData.name || colorData.colorName || colorData.color || 'Unknown',
                        code: colorData.code || colorData.colorCode || colorData.hex || '#000000',
                        url: imageUrl || vehicle.baseImage || ''
                    };
                    colors.push(color);
                    console.log('✅ Added color:', color.name, 'URL:', imageUrl);
                });
            } else {
                console.log(`❌ No colors array in price ${priceIndex}`);
            }
        });

        // Method 2: From vehicle.image array
        if (vehicle.image && Array.isArray(vehicle.image)) {
            console.log(`🔍 Found ${vehicle.image.length} images in vehicle.image array`);
            vehicle.image.forEach((imageData: any, index: number) => {
                console.log(`🖼️ Processing image ${index}:`, imageData);

                // Extract image URL from various possible structures
                let imageUrl = imageData.url || '';
                if (imageData.imageDetails && Array.isArray(imageData.imageDetails) && imageData.imageDetails.length > 0) {
                    imageUrl = imageData.imageDetails[0].url || imageUrl;
                }

                const color = {
                    id: imageData.id || imageData.colorId || `image-color-${index}`,
                    name: imageData.name || imageData.colorName || imageData.color || 'Standard',
                    code: imageData.code || imageData.colorCode || imageData.hex || '#000000',
                    url: imageUrl || vehicle.baseImage || ''
                };
                colors.push(color);
                console.log('✅ Added color from image:', color.name, 'URL:', imageUrl);
            });
        } else {
            console.log('❌ No vehicle.image array found');
        }

        // Remove duplicates by name, but prioritize entries with URLs
        const uniqueColors = colors.reduce((acc: any[], color) => {
            const existingIndex = acc.findIndex(c => c.name === color.name);
            if (existingIndex === -1) {
                // First occurrence, add it
                acc.push(color);
            } else {
                // Duplicate exists, replace if current has URL and existing doesn't
                if (!acc[existingIndex].url && color.url) {
                    acc[existingIndex] = color;
                }
            }
            return acc;
        }, []);

        console.log(`🎨 Final colors: ${colors.length} total, ${uniqueColors.length} unique`);
        uniqueColors.forEach((color, index) => {
            console.log(`🎨 Color ${index}: ${color.name} (${color.code})`);
        });

        return uniqueColors;
    };

    // EMI management functions (like web)
    const addEmiRow = () => {
        const newRows = [...emiRows, { id: Date.now(), tenure: '', emi: '' }];
        setEmiRows(newRows);
    };

    const updateEmiRow = (id: number, field: 'tenure' | 'emi', value: string) => {
        const updatedRows = emiRows.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        );

        // Add new row if editing last row and both fields have values
        const lastRow = updatedRows[updatedRows.length - 1];
        if (lastRow.id === id && lastRow.tenure && lastRow.emi) {
            updatedRows.push({ id: Date.now(), tenure: '', emi: '' });
        }

        setEmiRows(updatedRows);
    };

    const removeEmiRow = (id: number) => {
        let updatedRows = emiRows.filter(row => row.id !== id);
        if (updatedRows.length === 0) {
            updatedRows = [{ id: 1, tenure: '', emi: '' }];
        }
        setEmiRows(updatedRows);
    };

    const resetFinanceForm = () => {
        setSelectedFinancer('');
        setDownPayment('');
        setEmiRows([{ id: 1, tenure: '', emi: '' }]);
    };

    const handlePaymentTypeChange = (type: 'cash' | 'finance') => {
        resetFinanceForm();
        setPaymentType(type);
    };

    // Get payment details for submission (like web)
    const getPaymentDetails = () => {
        const financerTenureData = {
            data: emiRows
                .filter(row => row.tenure && row.emi)
                .map(({ tenure, emi }) => ({
                    tenure: Number(tenure),
                    emi: Number(emi)
                }))
        };

        return {
            paymentType: paymentType,
            financerId: paymentType === 'finance' ? selectedFinancer : null,
            downPayment: paymentType === 'finance' ? Number(downPayment) : null,
            financerTenure: paymentType === 'finance' ? financerTenureData : { data: [] },
        };
    };
    const handleColorChange = (index: number) => {
        setSelectedColorIndex(index);
        console.log('🎨 Selected color:', vehicleColors[index]);
    };

    const getAbsoluteImageUrl = (imageInput?: any): string | null => {
        // Handle various image formats: string, array of objects, object with url
        let url: string | undefined;
        if (typeof imageInput === 'string') {
            url = imageInput;
        } else if (Array.isArray(imageInput) && imageInput.length > 0) {
            // Array of image objects like [{url: '...'}, ...]
            const first = imageInput[0];
            url = typeof first === 'string' ? first : first?.url || first?.uri || first?.path;
        } else if (imageInput && typeof imageInput === 'object') {
            url = imageInput.url || imageInput.uri || imageInput.path;
        }
        if (!url || typeof url !== 'string') return null;
        if (url.startsWith('http')) return url;
        const base = ENDPOINT.endsWith('/') ? ENDPOINT : `${ENDPOINT}/`;
        const relative = url.startsWith('/') ? url.slice(1) : url;
        return `${base}${relative}`;
    };

    // Color carousel component with clean slide interface
    const ColorCarousel = () => {
        console.log('🎨 ColorCarousel rendering with vehicleColors:', vehicleColors.length);
        console.log('🎨 VehicleColors data:', vehicleColors);
        console.log('🎨 Selected index:', selectedColorIndex);

        if (vehicleColors.length === 0) {
            console.log('❌ No colors available for carousel');
            return null;
        }

        const nextColor = () => {
            const newIndex = (selectedColorIndex + 1) % vehicleColors.length;
            handleColorChange(newIndex);
        };

        const prevColor = () => {
            const newIndex = selectedColorIndex === 0 ? vehicleColors.length - 1 : selectedColorIndex - 1;
            handleColorChange(newIndex);
        };

        const currentColor = vehicleColors[selectedColorIndex];
        const imageUrl = getAbsoluteImageUrl(currentColor?.url);

        return (
            <View style={{ marginBottom: 16 }}>
                {/* Clean Slide Interface */}
                <View style={{ alignItems: 'center' }}>
                    {/* Vehicle Image */}
                    <View style={{
                        aspectRatio: 16 / 9,
                        backgroundColor: '#f9fafb',
                        borderRadius: 12,
                        marginBottom: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        width: '100%',
                        maxWidth: 320
                    }}>
                        {imageUrl ? (
                            <Image
                                source={{ uri: imageUrl }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
                                <Text style={{ color: '#9ca3af', fontSize: 12 }}>No Image</Text>
                            </View>
                        )}
                    </View>

                    {/* Model Name - Only Once */}
                    <Text style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: '#111827',
                        textAlign: 'center',
                        marginBottom: 8
                    }}>
                        {activeVehicle?.name || activeVehicle?.modelName}
                    </Text>

                    {/* Color Display */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16
                    }}>
                        <View style={{
                            width: 16,
                            height: 16,
                            borderRadius: 8,
                            backgroundColor: currentColor?.code || '#000000',
                            borderWidth: 1,
                            borderColor: '#d1d5db',
                            marginRight: 8
                        }} />
                        <Text style={{
                            fontSize: 14,
                            color: '#6b7280',
                            textAlign: 'center'
                        }}>
                            {currentColor?.name || 'Standard'}
                        </Text>
                    </View>

                    {/* Navigation Arrows */}
                    {vehicleColors.length > 1 && (
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            position: 'relative'
                        }}>
                            {/* Left Arrow */}
                            <TouchableOpacity
                                onPress={prevColor}
                                style={{
                                    position: 'absolute',
                                    left: 20,
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    backgroundColor: '#0d9488',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                activeOpacity={0.8}
                            >
                                <ChevronLeft size={18} color="white" />
                            </TouchableOpacity>

                            {/* Page Indicator */}
                            <Text style={{ fontSize: 12, color: '#6b7280' }}>
                                {selectedColorIndex + 1} / {vehicleColors.length}
                            </Text>

                            {/* Right Arrow */}
                            <TouchableOpacity
                                onPress={nextColor}
                                style={{
                                    position: 'absolute',
                                    right: 20,
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    backgroundColor: '#0d9488',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                activeOpacity={0.8}
                            >
                                <ChevronRight size={18} color="white" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Thumbnail Strip - Only if multiple colors */}
                    {vehicleColors.length > 1 && (
                        <View style={{
                            marginTop: 16,
                            alignItems: 'center',
                            width: '100%'
                        }}>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 2 }}
                            >
                                <View style={{ flexDirection: 'row', gap: 6 }}>
                                    {vehicleColors.map((color, index) => {
                                        const isSelected = index === selectedColorIndex;
                                        const thumbUrl = getAbsoluteImageUrl(color.url);

                                        return (
                                            <TouchableOpacity
                                                key={color.id || index}
                                                onPress={() => handleColorChange(index)}
                                                style={{
                                                    width: 50,
                                                    height: 35,
                                                    borderRadius: 6,
                                                    borderWidth: isSelected ? 2 : 1,
                                                    borderColor: isSelected ? '#0d9488' : '#e5e7eb',
                                                    backgroundColor: 'white',
                                                    overflow: 'hidden',
                                                    opacity: isSelected ? 1 : 0.7
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                {thumbUrl ? (
                                                    <Image
                                                        source={{ uri: thumbUrl }}
                                                        style={{ width: '100%', height: '100%' }}
                                                        resizeMode="cover"
                                                    />
                                                ) : (
                                                    <View style={{ flex: 1, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Text style={{ color: '#9ca3af', fontSize: 8 }}>No img</Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            {/* Header */}
            <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 8 }}>
                    <ChevronLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={{ color: '#111827', fontSize: 18, fontWeight: 'bold' }}>Select Vehicle</Text>
            </View>

            {/* Progress */}
            {viewMode ? (
                <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>1</Text>
                        </View>
                        <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#3b82f6', fontSize: 12 }}>Price</Text>
                    </View>
                    <ChevronRight size={18} color="#d1d5db" />
                    <View style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.4, marginLeft: 12 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#6b7280', fontWeight: 'bold', fontSize: 12 }}>2</Text>
                        </View>
                        <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#9ca3af', fontSize: 12 }}>Payment</Text>
                    </View>
                </View>
            ) : (
                <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingVertical: 16, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={16} color="white" />
                        </View>
                        <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#22c55e', fontSize: 12 }}>Model</Text>
                    </View>
                    <ChevronRight size={20} color="#d1d5db" />
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>2</Text>
                        </View>
                        <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#3b82f6', fontSize: 12 }}>Price</Text>
                    </View>
                    <ChevronRight size={20} color="#d1d5db" />
                    <View style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.4 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#6b7280', fontWeight: 'bold', fontSize: 12 }}>3</Text>
                        </View>
                        <Text style={{ marginLeft: 8, fontWeight: 'bold', color: '#9ca3af', fontSize: 12 }}>Payment</Text>
                    </View>
                </View>
            )}

            <ScrollView style={{ flex: 1 }}>
                <View style={{ padding: 16 }}>
                    {/* Vehicle Summary */}
                    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f3f4f6' }}>
                        {activeVehicle && (
                            <View style={{ marginBottom: 16 }}>
                                {/* Color Carousel - Like Web App */}
                                <ColorCarousel />
                            </View>
                        )}
                        {!viewMode && (
                            <Text style={{ color: '#111827', fontWeight: '500', fontSize: 14, textAlign: 'center' }}>
                                <Text style={{ color: '#6b7280' }}>Model : </Text>
                                {activeVehicle?.name || '-'}
                            </Text>
                        )}
                    </View>

                    {/* Insurance Selection */}
                    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: insuranceError ? '#dc2626' : '#f3f4f6', opacity: viewMode ? 0.6 : 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14 }}>Insurance Type :</Text>
                            <Text style={{ color: '#ef4444', marginLeft: 4, fontSize: 14 }}>*</Text>
                        </View>
                        {insuranceOptions.length === 0 && (
                            <Text style={{ color: '#6b7280', fontSize: 12 }}>No insurance options</Text>
                        )}
                        {insuranceOptions.map(opt => (
                            <TouchableOpacity
                                key={opt.id}
                                onPress={() => toggleInsurance(opt.id)}
                                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
                            >
                                <View style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: 4,
                                    borderWidth: 1,
                                    borderColor: selectedInsurance.includes(opt.id) ? '#0d9488' : '#d1d5db',
                                    backgroundColor: selectedInsurance.includes(opt.id) ? '#0d9488' : 'white',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {selectedInsurance.includes(opt.id) && <Check size={12} color="white" />}
                                </View>
                                <Text style={{ marginLeft: 12, color: '#374151', fontSize: 14 }}>{opt.label} - ₹{opt.amount}</Text>
                            </TouchableOpacity>
                        ))}
                        {insuranceError && (
                            <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>
                                ⚠ Please select at least one insurance type to continue.
                            </Text>
                        )}
                    </View>

                    {/* Others */}
                    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 32, borderWidth: 1, borderColor: '#f3f4f6', opacity: viewMode ? 0.6 : 1 }}>
                        <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14, marginBottom: 16 }}>Others</Text>
                        {otherOptions.length === 0 && (
                            <Text style={{ color: '#6b7280', fontSize: 12 }}>No additional options</Text>
                        )}
                        {otherOptions.map(opt => (
                            <TouchableOpacity
                                key={opt.id}
                                onPress={() => toggleOther(opt.id)}
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                            >
                                <View style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: 4,
                                    borderWidth: 1,
                                    borderColor: selectedOthers.includes(opt.id) ? '#0d9488' : '#d1d5db',
                                    backgroundColor: selectedOthers.includes(opt.id) ? '#0d9488' : 'white',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {selectedOthers.includes(opt.id) && <Check size={12} color="white" />}
                                </View>
                                <Text style={{ marginLeft: 12, color: '#374151', fontSize: 14 }}>
                                    {opt.label} - ₹{opt.amount}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Price Table */}
                    <View style={{ backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#f3f4f6' }}>
                        <View style={{ backgroundColor: '#475569', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>Type</Text>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>Price</Text>
                        </View>
                        {priceBreakdown.map((item, index) => (
                            <View key={item.label} style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: index % 2 === 1 ? '#f9fafb' : 'white' }}>
                                <Text style={{ color: '#4b5563', fontSize: 14 }}>{item.label}</Text>
                                <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14 }}>₹ {item.amount}</Text>
                            </View>
                        ))}
                        <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f9fafb' }}>
                            <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14 }}>Total</Text>
                            <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14 }}>₹ {totalWithOthers}</Text>
                        </View>
                        {cumulativeInsuranceRows.map((row, idx) => (
                            <View
                                key={`${row.label}-${idx}`}
                                style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f9fafb' }}
                            >
                                <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14 }}>
                                    {row.label}
                                </Text>
                                <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 14 }}>
                                    ₹ {row.amount}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={{ backgroundColor: 'white', padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#0d9488', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                >
                    <ChevronLeft size={16} color="#0d9488" />
                    <Text style={{ color: '#0d9488', fontWeight: 'bold', marginLeft: 4 }}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        if (!viewMode && insuranceOptions.length > 0 && selectedInsurance.length === 0) {
                            setInsuranceError(true);
                            return;
                        }

                        // Only get current payment details if NOT in view mode
                        let finalPaymentDetails;
                        if (viewMode) {
                            console.log('📋 View mode - preserving original paymentDetails:', paymentDetails);
                            finalPaymentDetails = paymentDetails;
                        } else {
                            // Get current payment details from this screen (for new entries)
                            finalPaymentDetails = getPaymentDetails();
                            console.log('✏️ Edit mode - using current payment details:', finalPaymentDetails);
                        }

                        console.log('🚀 Navigating to SelectPayment with paymentDetails:', finalPaymentDetails);

                        navigation.navigate('SelectPayment', {
                            vehicleId,
                            vehicleData,
                            priceDetails: {
                                totalAmount,
                                baseTotal,
                                insurance: selectedInsurance,
                                insuranceAmount,
                                others: selectedOthers,
                                othersAmount,
                                breakdown: price, // Send the full price object from vehicle master
                            },
                            returnTo,
                            quotationId,
                            viewMode: !!viewMode,
                            paymentDetails: finalPaymentDetails,
                        })
                    }}
                    disabled={!vehicleData}
                    style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: !vehicleData ? '#d1d5db' : '#0d9488', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold', marginRight: 4 }}>Next</Text>
                    <ChevronRight size={16} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
