import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// when running locally we read from a dotenv file named ".env.dev";
// Expo (via @expo/env) will make any variable prefixed with
// EXPO_PUBLIC_ available on `process.env` at build time.
// If the variable is missing we fall back to a hard–coded default.
const DEFAULT_ENDPOINT = 'https://nandiyamaha.autocloud.in/';
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

export const getQuotationByCustomerId = (id: string) => {
  return platformApi.get(`/api/quotation/getCus/${id}`);
};

export const getCustomerById = (id: string) => {
  return platformApi.get(`/api/customer/${id}`);
};

export default platformApi;
