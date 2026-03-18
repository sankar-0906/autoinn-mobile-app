import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginApi, getCurrentUser } from '../../api';
import { AuthContextType, UserProfile, RoleAccess } from './types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;
  const isManager = user?.profile?.department?.othersAccess || false;
  const departmentTypes = user?.profile?.department?.departmentType || [];
  const roleAccess = user?.profile?.department?.roleAccess || [];

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('userProfile');
      if (stored) {
        const userProfile = JSON.parse(stored);
        console.log('🔍 Loaded user profile:', userProfile);
        console.log('🔍 Manager status:', userProfile?.profile?.department?.othersAccess);
        console.log('🔍 Department:', userProfile?.profile?.department);
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Login API call
      const loginResp = await loginApi(phone, password);
      const loginData = loginResp?.data;
      
      if (loginData?.code !== 200 || loginData.response?.code !== 200) {
        return false;
      }

      const token = loginData.response.data.token;
      await AsyncStorage.setItem('token', token);

      // Get current user with role data
      const userResp = await getCurrentUser();
      const userData = userResp?.data;
      
      if (userData?.code === 200 && userData.response?.code === 200) {
        const userProfile: UserProfile = userData.response.data;
        
        console.log('🔐 Login - User profile from API:', userProfile);
        console.log('🔐 Login - Manager status from API:', userProfile?.profile?.department?.othersAccess);
        console.log('🔐 Login - Department from API:', userProfile?.profile?.department);
        
        // Store complete user profile with role data
        await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
        await AsyncStorage.setItem('isLoggedIn', 'true');
        await AsyncStorage.setItem('userPhone', phone);
        
        setUser(userProfile);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove(['token', 'userProfile', 'isLoggedIn', 'userPhone']);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated,
    isManager,
    departmentTypes,
    roleAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
