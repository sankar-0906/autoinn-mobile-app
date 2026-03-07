// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// // endpoint comes from environment variable (Expo builds will inject any
// // EXPO_PUBLIC_* values from .env files).  We fall back to a hard-coded
// // development default when nothing is provided.

// const DEFAULT_ENDPOINT = 'https://test.autocloud.in/';
// // const DEFAULT_ENDPOINT = 'https://nandiyamaha.autocloud.in/';

// export const ENDPOINT = process.env.EXPO_PUBLIC_ENDPOINT || DEFAULT_ENDPOINT;
// const platformApi = axios.create({
//   baseURL: ENDPOINT,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// platformApi.interceptors.request.use(async (config) => {
//   try {
//     const token = await AsyncStorage.getItem('token');
//     if (token) {
//       config.headers = config.headers || {};
//       config.headers['x-access-token'] = token;
//     }
//   } catch (e) {
//     // ignore
//   }
//   return config;
// });

// export const login = (phone: string, password: string) => {
//   return platformApi.post('/api/user/login', { phone, password });
// };

// export const getCurrentUser = () => {
//   return platformApi.get('/api/user/currentUser');
// };

// export const getUserCount = () => {
//   return platformApi.get('/api/user/count');
// };

// export const getQuotations = (body: any) => {
//   return platformApi.post('/api/quotation/get', body);
// };

// export const getQuotationById = (id: string) => {
//   return platformApi.get(`/api/quotation/${id}`);
// };

// export const assignQuotationExecutive = (payload: any) => {
//   return platformApi.post('/api/quotation/assignExecutive', payload);
// };

// export const getBranches = () => {
//   return platformApi.get('/api/company/branches');
// };

// export const getUsers = (body: any) => {
//   return platformApi.post('/api/user/get', body);
// };

// export const getManufacturers = () => {
//   return platformApi.get('/api/manufacturer');
// };

// export const getVehicleModelsByManufacturer = (id: string, searchString?: string) => {
//   const qs = searchString ? `?searchString=${encodeURIComponent(searchString)}` : '';
//   return platformApi.get(`/api/vehicleMaster/man/${id}${qs}`);
// };

// export const getVehicleMaster = () => {
//   return platformApi.get('/api/vehicleMaster');
// };

// export const getVehicleMasterById = (id: string) => {
//   return platformApi.get(`/api/vehicleMaster/${id}`);
// };

// export const getFinancers = () => {
//   return platformApi.get('/api/financer');
// };

// export const getFollowUps = (body: any) => {
//   return platformApi.post('/api/customer/unique/phone', body);
// };

// export const getActivityById = (id: string) => {
//   return platformApi.get(`/api/activity/${id}`);
// };

// // Attach Quotation APIs
// export const attachQuotations = (quotationIds: string[]) => {
//   return platformApi.post('/api/quotation/attach', quotationIds);
// };

// export const searchQuotations = (searchParams: {
//   module: string;
//   column: string;
//   searchString: string;
//   searchColumns?: string[];
//   size?: number;
//   page?: number;
//   except?: any;
//   matchType?: string;
//   caseSensitive?: boolean;
// }) => {
//   return platformApi.post('/api/quotation/quotationSearch', searchParams);
// };

// export const updateCustomerQuotations = (customerId: string, quotationIds: string[]) => {
//   return platformApi.put(`/api/customer/${customerId}`, {
//     update: "quotation",
//     quotation: quotationIds.map(id => ({ id }))
//   });
// };

// export const updateActivity = (id: string, body: any) => {
//   return platformApi.put(`/api/activity/${id}`, body);
// };

// export const getCustomerById = (id: string) => {
//   return platformApi.get(`/api/customer/${id}`);
// };

// export const getCustomerDetails = (id: string) => {
//   return platformApi.get(`/api/customer/details/${id}`);
// };

// export const getQuotationByCustomerId = (customerId: string) => {
//   return platformApi.get(`/api/quotation/customer/${customerId}`);
// };

// export const getCustomerByPhoneNo = (phoneNo: string) => {
//   return platformApi.get(`/api/customer/phone-no/${phoneNo}`);
// };

// export const getCustomerQuotations = (customerId: string) => {
//   return platformApi.get(`/api/quotation/getCus/${customerId}`);
// };

// export const getMergedCustomerData = (body: { ids: string[] }) => {
//   return platformApi.post('/api/customer/merge', body);
// };

// export const getActivitiesByCustomer = (body: { ids: string[]; limit?: number; offset?: number }) => {
//   return platformApi.post('/api/activity/customers', body);
// };

// export const updateCustomer = (customerId: string, customerData: any) => {
//   return platformApi.put(`/api/customer/${customerId}`, customerData);
// };

// export const attachQuotation = (quotationIds: string[]) => {
//   return platformApi.post('/api/quotation/attach/', quotationIds);
// };

// export const createQuotation = (quotationData: FormData) => {
//   return platformApi.post('/api/quotation', quotationData, {
//     headers: { "Content-Type": "multipart/form-data" }
//   });
// };

// export const scheduleFollowUp = (data: {
//   fupDateTime: string;
//   next?: boolean;
//   status?: string;
//   last_quotation?: string;
//   quotations?: string[];
//   phone: string;
//   filter?: any;
// }) => {
//   return platformApi.post('/api/quotation/scheduled', data);
// };

// // Dropdown data APIs from autoinn-fe
// export const getCountries = () => {
//   return platformApi.get('/api/csc/country');
// };

// export const getStates = (countryId: string) => {
//   return platformApi.post('/api/csc/states', { id: countryId });
// };

// export const getCities = (stateId: string) => {
//   return platformApi.post('/api/csc/cities', { id: stateId });
// };

// export const verifyGST = (gst: string) => {
//   return platformApi.post('/api/gstVerify', { gst });
// };

// export const generateCustomerId = () => {
//   return platformApi.post('/api/idGenerate/customer');
// };

// export const getReferredCustomers = (id: string) => {
//   return platformApi.get(`api/customer/reffered/${id}`);
// };

// export const deleteCustomerPhone = (phoneId: string) => {
//   return platformApi.delete(`api/customer/phone/${phoneId}`);
// };

// export const generateQuotationId = (branchId: string) => {
//   return platformApi.post('/api/idGenerate/quotation', { branch: branchId });
// };

// export const placeCloudCall = (data: { phone1: string; phone2: string; customerId: string; type?: string }) => {
//   return platformApi.post('/api/cloudCall', data);
// };

// export default platformApi;

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// endpoint comes from environment variable (Expo builds will inject any
// EXPO_PUBLIC_* values from .env files).  We fall back to a hard-coded
// development default when nothing is provided.

// const DEFAULT_ENDPOINT = 'http://172.22.110.77:4000/';
const DEFAULT_ENDPOINT = 'https://test.autocloud.in/';

// const DEFAULT_ENDPOINT = 'https://nandiyamaha.autocloud.in/';

export const ENDPOINT = process.env.EXPO_PUBLIC_ENDPOINT || DEFAULT_ENDPOINT;
const platformApi = axios.create({
  baseURL: ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
  },
});

platformApi.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['x-access-token'] = token;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

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

export const getCustomerDetails = (id: string) => {
  return platformApi.get(`/api/customer/details/${id}`);
};

export const getQuotationByCustomerId = (customerId: string) => {
  return platformApi.get(`/api/quotation/customer/${customerId}`);
};

export const getCustomerByPhoneNo = (phoneNo: string) => {
  return platformApi.get(`/api/customer/phone-no/${phoneNo}`);
};

export const getCustomerQuotations = (customerId: string) => {
  return platformApi.get(`/api/quotation/getCus/${customerId}`);
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

export default platformApi;