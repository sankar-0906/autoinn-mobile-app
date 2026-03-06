import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import TabNavigator from './TabNavigator';
import QuotationDetailsScreen from '../screens/quotation/QuotationDetailsScreen';
import SelectModelScreen from '../screens/vehicle-selection/SelectModelScreen';
import SelectPriceScreen from '../screens/vehicle-selection/SelectPriceScreen';
import SelectPaymentScreen from '../screens/vehicle-selection/SelectPaymentScreen';
import AddQuotationScreen from '../screens/quotation/AddQuotationScreen';
import AdvancedFiltersScreen from '../screens/quotation/AdvancedFiltersScreen';
import QuotationFormScreen from '../screens/quotation/QuotationFormScreen';
import QuotationViewScreen from '../screens/quotation/QuotationViewScreen';
import FollowUpDetailScreen from '../screens/follow-ups/FollowUpDetailScreen';
import FollowUpFiltersScreen from '../screens/follow-ups/FollowUpFiltersScreen';
import BookingRegisterScreen from '../screens/booking/BookingRegisterScreen';
import CustomerDetailsScreen from '../screens/customer/CustomerDetailsScreen';
import BookingActivityScreen from '../screens/follow-ups/BookingActivityScreen';
import WalkInActivityScreen from '../screens/follow-ups/WalkInActivityScreen';
import CallActivityScreen from '../screens/follow-ups/CallActivityScreen';

import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="QuotationDetails" component={QuotationDetailsScreen} />
            <Stack.Screen name="QuotationForm" component={QuotationFormScreen} />
            <Stack.Screen name="QuotationView" component={QuotationViewScreen} />
            <Stack.Screen name="SelectModel" component={SelectModelScreen} />
            <Stack.Screen name="SelectPrice" component={SelectPriceScreen} />
            <Stack.Screen name="SelectPayment" component={SelectPaymentScreen} />
            <Stack.Screen name="AddQuotation" component={AddQuotationScreen} />
            <Stack.Screen name="AdvancedFilters" component={AdvancedFiltersScreen} />
            <Stack.Screen name="FollowUpFilters" component={FollowUpFiltersScreen} />
            <Stack.Screen name="FollowUpDetail" component={FollowUpDetailScreen} />
            <Stack.Screen name="BookingRegister" component={BookingRegisterScreen} />
            <Stack.Screen name="CustomerDetails" component={CustomerDetailsScreen} />
            <Stack.Screen name="BookingActivity" component={BookingActivityScreen} />
            <Stack.Screen name="WalkInActivity" component={WalkInActivityScreen} />
            <Stack.Screen name="CallActivity" component={CallActivityScreen} />
        </Stack.Navigator>
    );
}
