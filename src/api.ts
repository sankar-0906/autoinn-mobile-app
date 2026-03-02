import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// endpoint comes from environment variable (Expo builds will inject any
// EXPO_PUBLIC_* values from .env files).  We fall back to a hard-coded
// development default when nothing is provided.

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

export const getCustomerByPhoneNo = (phone: string) => {
  return platformApi.get(`/api/customer/phone-no/${phone}`);
};

export const getFollowUps = (body: any) => {
  return platformApi.post('/api/customer/unique/phone', body);
};

export const getActivitiesByCustomer = (body: any) => {
  return platformApi.post('/api/activity/customers', body);
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

export const getQuotationByCustomerId = (id: string) => {
  return platformApi.get(`/api/quotation/getCus/${id}`);
};

export const getCustomerById = (id: string) => {
  return platformApi.get(`/api/customer/${id}`);
};

export const getCustomerDetails = (id: string) => {
  return platformApi.get(`/api/customer/details/${id}`);
};

export const getMergedCustomerData = (body: { ids: string[] }) => {
  return platformApi.post('/api/customer/merge', body);
};

export const attachQuotation = (body: any) => {
  return platformApi.post('/api/quotation/attach/', body);
};

export const searchQuotation = (body: any) => {
  return platformApi.post('/api/quotation/quotationSearch', body);
};

export const generateQuotationId = (branchId: string) => {
  return platformApi.post('/api/idGenerate/quotation', { branch: branchId });
};

export const createQuotation = (formData: FormData) => {
  return platformApi.post('/api/quotation', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default platformApi;
