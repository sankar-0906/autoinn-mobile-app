import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// endpoint comes from environment variable (Expo builds will inject any
// EXPO_PUBLIC_* values from .env files).  We fall back to a hard-coded
// development default when nothing is provided.
// const DEFAULT_ENDPOINT = 'https://nandiyamaha.autocloud.in';
const DEFAULT_ENDPOINT = 'https://test.autocloud.in/';

export const ENDPOINT = process.env.EXPO_PUBLIC_ENDPOINT || DEFAULT_ENDPOINT;


const platformApi = axios.create({

  baseURL: ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Create fallback API instance for test server
const fallbackApi = axios.create({
  baseURL: DEFAULT_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to both APIs
const addRequestInterceptor = (apiInstance: any) => {
  apiInstance.interceptors.request.use(async (config: any) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers = config.headers || {};
        config.headers['x-access-token'] = token;

        // Debug: Log token for authorization requests
        if (config.url?.includes('/authorise')) {
          console.log('🔐 Authorization Request - Token present:', !!token);
          console.log('🔐 Authorization Request - Token preview:', token.substring(0, 20) + '...');
        }
      }
    } catch (e) {
      // ignore
    }
    return config;
  });
  return apiInstance;
};

addRequestInterceptor(platformApi);
addRequestInterceptor(fallbackApi);

// Add response interceptor for retry logic and better error handling
platformApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, code } = error;

    // Retry logic for timeouts and 504 errors
    if ((code === 'ECONNABORTED' || error.response?.status === 504) && !config._retry) {
      config._retry = true;
      config._retryCount = config._retryCount || 0;

      if (config._retryCount < 3) {
        config._retryCount += 1;
        console.log(`🔄 Retrying request (attempt ${config._retryCount}/3):`, config.url);

        // Exponential backoff: 1s, 2s, 4s
        const delay = 1000 * Math.pow(2, config._retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

        return platformApi(config);
      }
    }

    return Promise.reject(error);
  }
);

export const login = (phone: string, password: string) => {
  return platformApi.post('/api/user/login', { phone, password });
};

export const getCurrentUser = () => {
  return platformApi.get('/api/user/currentUser');
};

export const getUserCount = () => {
  return platformApi.get('/api/user/count');
};

export const getQuotations = (body: any) => {
  console.log("endpoint : ", ENDPOINT);
  return platformApi.post('/api/quotation/get', body);
};

export const getQuotationById = (id: string) => {
  return platformApi.get(`/api/quotation/${id}`);
};

export const assignQuotationExecutive = (payload: any) => {
  return platformApi.post('/api/quotation/assignExecutive', payload);
};

export const getBranches = () => {
  return platformApi.get('/api/company/branches');
};

export const getUsers = (body: any) => {
  return platformApi.post('/api/user/get', body);
};

export const getManufacturers = () => {
  return platformApi.get('/api/manufacturer');
};

export const getManufacturersByBranch = (branchId: string) => {
  return platformApi.get(`/api/manufacturer/branch/${branchId}`);
};

export const getRtoOptions = () => {
  return platformApi.post('/api/options/get/', {
    module: "rtoes",
    searchString: "",
    column: "code",
    fields: ["area"],
    page: 1,
    size: 20,
  });
};

export const getVehicleModelsByManufacturer = (id: string, searchString?: string) => {
  const qs = searchString ? `?searchString=${encodeURIComponent(searchString)}` : '';
  return platformApi.get(`/api/vehicleMaster/man/${id}${qs}`);
};

export const getVehicleMaster = () => {
  return platformApi.get('/api/vehicleMaster');
};

export const getVehicleMasterById = (id: string) => {
  return platformApi.get(`/api/vehicleMaster/${id}`);
};

export const getFinancers = () => {
  return platformApi.get('/api/financer');
};

export const getFollowUps = (body: any) => {
  return platformApi.post('/api/customer/unique/phone', body);
};

export const getActivityById = (id: string) => {
  return platformApi.get(`/api/activity/${id}`);
};

// Attach Quotation APIs
export const attachQuotations = (quotationIds: string[]) => {
  return platformApi.post('/api/quotation/attach', quotationIds);
};

export const searchQuotations = (searchParams: {
  module: string;
  column: string;
  searchString: string;
  searchColumns?: string[];
  size?: number;
  page?: number;
  except?: any;
  matchType?: string;
  caseSensitive?: boolean;
}) => {
  return platformApi.post('/api/quotation/quotationSearch', searchParams);
};

export const updateCustomerQuotations = (customerId: string, quotationIds: string[]) => {
  return platformApi.put(`/api/customer/${customerId}`, {
    update: "quotation",
    quotation: quotationIds.map(id => ({ id }))
  });
};

export const updateActivity = (id: string, body: any) => {
  return platformApi.put(`/api/activity/${id}`, body);
};

export const createActivity = (data: any) => {
  return platformApi.post('/api/activity/create', data);
};

export const createCallActivity = (data: any) => {
  return platformApi.post('/api/activity/call', data);
};

export const getCustomerById = (id: string) => {
  return platformApi.get(`/api/customer/${id}`);
};

// Customer Details API - Used by CustomerDetailsScreen
export const getCustomerDetails = (id: string) => {
  return platformApi.get(`/api/customer/details/${id}`);
};

// Alternative customer details API (kept for compatibility)
export const getCustomerDetailsById = (id: string) => {
  return platformApi.get(`/api/customer/details/${id}`);
};

export const getCustomerQuotationsByPhone = (phoneNo: string) => {
  return platformApi.get(`/api/customer/phone-no/${phoneNo}`);
};

export const getAccessories = (searchString?: string) => {
  const url = searchString
    ? `/api/partsMaster/accessories?searchString=${searchString}`
    : '/api/partsMaster/accessories';
  return platformApi.get(url);
};

export const getVehicleAccessories = (modelId: string) => {
  return platformApi.get(`/api/partsMaster/Cloudsuit/${modelId}`);
};

// Vehicle specific APIs based on web implementation
export const getVehicleById = (vehicleId: string) => {
  return platformApi.get(`/api/vehicle/${vehicleId}`);
};

export const getVehicleManufacturers = () => {
  return platformApi.get('/api/manufacturer/branch');
};

export const getVehicleModelsByManufacturerId = (manufacturerId: string) => {
  return platformApi.get(`/api/vehicleMaster/manAll/${manufacturerId}`);
};

export const updateVehicle = (vehicleId: string, formData: FormData) => {
  return platformApi.put(`/api/vehicle/${vehicleId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const checkRegistrationNumber = (registerNo: string, vehicleId?: string) => {
  return platformApi.post(`/api/vehicle/checkRegisterNo`, { registerNo, id: vehicleId });
};

export const checkEngineNumber = (engineNo: string, vehicleId?: string) => {
  return platformApi.post(`/api/vehicle/checkEngineNo`, { engineNo, id: vehicleId });
};

export const validateChassisNumber = (chassisNo: string, vehicleId?: string) => {
  return platformApi.post(`/api/vehicle/checkChassisNo`, { chassisNo, id: vehicleId });
};

export const validateEngineNumber = (engineNo: string, vehicleId?: string) => {
  return platformApi.post(`/api/vehicle/checkEngineNo`, { engineNo, id: vehicleId });
};

export const validateRegistrationNumber = (registerNo: string, vehicleId?: string) => {
  return platformApi.post(`/api/vehicle/checkRegisterNo`, { registerNo, id: vehicleId });
};

export const getVehicleColor = (vehicleId: string) => {
  return platformApi.post(`/api/vehicle/get?color=${vehicleId}`);
};

export const getVehicleFiles = (vehicleId: string) => {
  return platformApi.post(`/api/vehicle/get?vehicleFiles=${vehicleId}`);
};

export const getVehicleEReceipt = (vehicleId: string) => {
  return platformApi.post(`/api/vehicle/get?vehicleFiles=${vehicleId}`);
};

export const getVehicleServices = (vehicleId: string) => {
  return platformApi.post(`/api/vehicle/get?vehicleServices=${vehicleId}`);
};

export const getVehicleCustomers = (customerIds: string[]) => {
  return platformApi.post('/api/vehicle/getCustomer', {
    customer: customerIds
  });
};

// Job Order APIs
export const getJobOrderHistory = (vehicleId: string) => {
  return platformApi.post('/api/jobOrder/get', {
    vehicle: vehicleId
  });
};

export const getJobOrderDetails = (jobOrderId: string) => {
  return platformApi.get(`/api/jobOrder/${jobOrderId}`);
};

export const generateQRCode = (data: string) => {
  return platformApi.post('/api/jobOrder/generateQR', { data });
};

export const generateJobOrderPDF = (jobOrderId: string) => {
  return platformApi.get(`/api/jobOrder/generatePDF/${jobOrderId}`);
};

// Insurance APIs
export const getInsuranceTypes = () => {
  return platformApi.get('/api/insurance');
};

export const addInsurance = (insuranceData: any) => {
  return platformApi.post('/api/insurance', insuranceData);
};

export const parseInsurancePDF = (pdfData: FormData) => {
  return platformApi.post('/api/insurance/parse', pdfData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getVehicleInsurance = (vehicleId: string) => {
  return platformApi.get(`/api/vehicle/${vehicleId}`);
};

// Customer Management APIs
export const getCustomersByPhone = (phoneNo: string) => {
  return platformApi.get(`/api/customer/phone-no/${phoneNo}`);
};

export const getCustomerByPhoneNo = (phoneNo: string) => {
  return platformApi.get(`/api/customer/phone-no/${phoneNo}`);
};

export const mergeCustomerData = (customerIds: string[]) => {
  return platformApi.post('/api/customer/merge', { ids: customerIds });
};

export const getCustomerActivities = (customerId: string) => {
  return platformApi.post('/api/activity/customers', { ids: [customerId] });
};

export const addNewCustomer = (customerData: any) => {
  return platformApi.post('/api/customer', customerData);
};

// Follow-up Related APIs
export const getCustomerQuotations = (customerId: string) => {
  return platformApi.get(`/api/quotation/getCus/${customerId}`);
};

export const getCustomerDetailsBasic = (customerId: string) => {
  return platformApi.get(`/api/customer/${customerId}`);
};

export const getCustomerActivitiesList = (body: { ids: string[] }) => {
  return platformApi.post('/api/activity/customers', body);
};

// Market info API
export const fetchMarketInfo = (vehicleId: string) => {
  return platformApi.post('/api/options/get', {
    module: "vehicles",
    column: "modelName",
    searchString: "",
    fields: ["modelName", "modelCode"],
    size: 10
  });
};

// Customer search API - matches web project dropdownSearch
export const searchCustomers = (searchString: string, size: number = 50) => {
  return platformApi.post('/api/options/get', {
    module: "customers",
    column: "phone",
    searchString: searchString,
    fields: ["contacts{phone}"],
    size: size
  });
};

export const deleteBookingAccessory = (accessoryId: string) => {
  return platformApi.delete(`/api/booking/accessory/${accessoryId}`);
};

export const getMergedCustomerData = (body: { ids: string[] }) => {
  return platformApi.post('/api/customer/merge', body);
};

export const getActivitiesByCustomer = (body: { ids: string[]; limit?: number; offset?: number }) => {
  return platformApi.post('/api/activity/customers', body);
};

export const updateCustomer = (customerId: string, customerData: any) => {
  return platformApi.put(`/api/customer/${customerId}`, customerData);
};

export const attachQuotation = (quotationIds: string[]) => {
  return platformApi.post('/api/quotation/attach/', quotationIds);
};

export const createQuotation = (quotationData: FormData) => {
  return platformApi.post('/api/quotation', quotationData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const scheduleFollowUp = (data: {
  fupDateTime: string;
  next?: boolean;
  status?: string;
  last_quotation?: string;
  quotations?: string[];
  phone: string;
  filter?: any;
}) => {
  return platformApi.post('/api/quotation/scheduled', data);
};

// Dropdown data APIs from autoinn-fe
export const getCountries = () => {
  return platformApi.get('/api/csc/country');
};

export const getStates = (countryId: string) => {
  return platformApi.post('/api/csc/states', { id: countryId });
};

export const getCities = (stateId: string) => {
  return platformApi.post('/api/csc/cities', { id: stateId });
};

export const verifyGST = (gst: string) => {
  return platformApi.post('/api/gstVerify', { gst });
};

export const generateCustomerId = () => {
  return platformApi.post('/api/idGenerate/customer');
};

export const getReferredCustomers = (id: string) => {
  return platformApi.get(`api/customer/reffered/${id}`);
};

export const deleteCustomerPhone = (phoneId: string) => {
  return platformApi.delete(`api/customer/phone/${phoneId}`);
};

export const generateQuotationId = (branchId: string) => {
  return platformApi.post('/api/idGenerate/quotation', { branch: branchId });
};

export const placeCloudCall = (data: { phone1: string; phone2: string; customerId: string; type?: string }) => {
  return platformApi.post('/api/cloudCall', data);
};

// Booking APIs
export const generateBookingId = (branchId: string) => {
  // Add cache-busting query so backend is always hit freshly
  return platformApi.post(`/api/idGenerate/booking?_=${Date.now()}`, { branch: branchId });
};

export const generateEReceiptId = (branchId: string) => {
  // Add cache-busting query so backend is always hit freshly
  return platformApi.post(`/api/idGenerate/e-receipt?_=${Date.now()}`, { branch: branchId });
};

export const createBooking = (bookingData: any) => {
  return platformApi.post('/api/booking/create', bookingData);
};

export const updateBooking = (bookingId: string, bookingData: any) => {
  return platformApi.put(`/api/booking/${bookingId}`, bookingData);
};

export const getBookingById = (bookingId: string) => {
  return platformApi.get(`/api/booking/${bookingId}`);
};

export const getBookings = (body: any) => {
  return platformApi.post('/api/booking/get', body);
};

export const updateBookingStatus = (bookingId: string, statusData: any) => {
  return platformApi.put(`/api/booking/updateStatus/${bookingId}`, statusData);
};

export const updateQuotationStatus = (quotationId: string, status: string) => {
  return platformApi.put(`/api/quotation/updateStatus/${quotationId}`, { status });
};

// File Upload APIs - matching web project
export const uploadVehicleFile = (fileData: FormData) => {
  return platformApi.post('/api/upload/vehicle', fileData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteVehicleFile = (deleteData: { delid?: string; type?: string; url: string }) => {
  return platformApi.post('/api/upload/deleteFile', deleteData);
};

export const uploadVehicleInsurance = (fileData: FormData) => {
  return platformApi.post('/api/upload/vehicleInsurance', fileData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Bulk Insurance Upload API - matching web project
export const bulkInsuranceUpload = (insuranceData: { insuranceData: any[] }) => {
  return platformApi.post('/api/insurance/bulk', insuranceData);
};

// Authentication APIs - matching web project
export const authoriseBooking = (bookingId: string, password: string, status: string) => {
  return platformApi.post('/api/booking/authorise', {
    bookingId,
    password,
    status
  });
};

export const generateBookingOTP = (phone: string, bookingData: any) => {
  return platformApi.post('/api/sendSms/sendOtp', {
    phone,
    type: "WhatsApp",
    smsData: bookingData
  });
};

export const verifyBookingOTP = (referenceId: string, passcode: string) => {
  return platformApi.post('/api/sendSms/verifyOtp', {
    referenceId,
    passcode
  });
};

export const sendBookingConfirmationSMS = (phone: string, type: string, smsData: any) => {
  return platformApi.post('/api/sendSms/bookingconfirm', {
    phone,
    type,
    smsData
  });
};

export const generateBookingPDF = (bookingData: any) => {
  return platformApi.post('/api/pdfGenerate/booking', bookingData);
};

export const uploadBookingDocument = (fileData: FormData) => {
  return platformApi.post('/api/upload', fileData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getVehicleLatestPrice = (vehicleId: string) => {
  return platformApi.get(`/api/vehiclePrice/latest/${vehicleId}`);
};

export const getFinancerDetails = (financerId: string) => {
  return platformApi.get(`/api/financer/${financerId}`);
};

export const getRTODetails = (rtoId: string) => {
  return platformApi.get(`/api/rto/${rtoId}`);
};

// Job Order APIs
export const getCustomerJobOrders = (customerId: string) => {
  return platformApi.get(`/api/customer/details/${customerId}`);
};

// Spare Order APIs
export const getCustomerSpareOrders = (customerId: string) => {
  return platformApi.get(`/api/customer/details/${customerId}`);
};

export const getSpareOrderDetails = (spareOrderId: string) => {
  return platformApi.get(`/api/customerSpare/${spareOrderId}`);
};

// Call History APIs
export const getCustomerCallHistory = (customerId: string) => {
  return platformApi.get(`/api/customer/details/${customerId}`);
};

// Number Plate APIs
export const getCustomerNumberPlates = (customerId: string) => {
  return platformApi.get(`/api/customer/details/${customerId}`);
};

export const getNumberPlateDetails = (plateId: string) => {
  return platformApi.get(`/api/numberPlating/${plateId}`);
};

// Payment APIs
export const getCustomerPayments = (customerId: string) => {
  return platformApi.get(`/api/customer/details/${customerId}`);
};

// Authentication APIs
export const generateOTP = (phone: string, bookingId: string, customerName: string, vehicleName: string, salesOfficer: any, branch: any) => {
  return platformApi.post('/api/sendSms/sendOtp', {
    phone,
    type: "SMS",
    smsData: {
      link: "", // Will be populated if needed
      cname: customerName,
      bkid: bookingId,
      vname: vehicleName,
      slex: salesOfficer,
      dlr: branch
    }
  });
};

export const verifyOTP = (referenceId: string, otp: string) => {
  return platformApi.post('/api/sendSms/verifyOtp', {
    referenceId,
    passcode: otp
  });
};

export const authorizeBooking = (bookingId: string, password: string, status: string) => {
  return platformApi.post('/api/booking/authorise', {
    password,
    status,
    bookingId
  });
};

export const generateQuotationPDF = (quotationId: string, withBrochure: boolean = false) => {
  const brochureParam = withBrochure ? '?withBrochure=true' : '';
  return platformApi.get(`/api/quotation/generatePDF/${quotationId}${brochureParam}`);
};

export default platformApi;