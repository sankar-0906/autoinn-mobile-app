
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
import FollowUpsScreen from '../screens/follow-ups/FollowUpsScreen';
import BookingRegisterScreen from '../screens/booking/BookingRegisterScreen';
import CustomerDetailsScreen from '../screens/cunstomerNew/CustomerDetailsScreen';
import BookingActivityScreen from '../screens/follow-ups/BookingActivityScreen';
import BookingConfirmActivityScreen from '../screens/follow-ups/BookingConfirmActivityScreen';
import WalkInActivityScreen from '../screens/follow-ups/WalkInActivityScreen';
import CallActivityScreen from '../screens/follow-ups/CallActivityScreen';
import ActivityViewEditScreen from '../screens/follow-ups/ActivityViewEditScreen';
import SelectVehicleForBookingScreen from '../screens/vehicle-selection/SelectVehicleForBookingScreen';
import SelectVehicleForDetailsScreen from '../screens/vehicle-selection/SelectVehicleForDetailsScreen';
import SelectVehicleColorScreen from '../screens/vehicle-selection/SelectVehicleColorScreen';
import VehicleDetailsScreen from '../screens/customer/VehicleDetailsScreen';
import AdvancedBookingScreen from '../screens/booking/AdvancedBookingScreen';
import ConfirmBookingScreen from '../screens/customer/ConfirmBookingScreen';
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
            <Stack.Screen name="BookingRegister" component={BookingRegisterScreen} />
            <Stack.Screen name="CustomerDetails" component={CustomerDetailsScreen} />
            <Stack.Screen name="ConfirmBooking" component={ConfirmBookingScreen} />
            <Stack.Screen name="BookingActivity" component={BookingActivityScreen} />
            <Stack.Screen name="BookingConfirmActivity" component={BookingConfirmActivityScreen} />
            <Stack.Screen name="WalkInActivity" component={WalkInActivityScreen} />
            <Stack.Screen name="CallActivity" component={CallActivityScreen} />
            <Stack.Screen name="ActivityViewEdit" component={ActivityViewEditScreen} />
            <Stack.Screen name="SelectVehicleForBooking" component={SelectVehicleForBookingScreen} />
            <Stack.Screen name="SelectVehicleForDetails" component={SelectVehicleForDetailsScreen} />
            <Stack.Screen name="SelectVehicleColor" component={SelectVehicleColorScreen} />
            <Stack.Screen name="VehicleDetails" component={VehicleDetailsScreen} />
            <Stack.Screen name="AdvancedBooking" component={AdvancedBookingScreen} />
            <Stack.Screen name="FollowUps" component={FollowUpsScreen} />
            <Stack.Screen name="FollowUpDetail" component={FollowUpDetailScreen} />
        </Stack.Navigator>
    );
}