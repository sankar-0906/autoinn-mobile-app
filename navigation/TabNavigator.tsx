import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import QuotationsListScreen from '../screens/quotation/QuotationsListScreen';
import JobCardsListScreen from '../screens/job-cards/JobCardsListScreen';
import AccountScreen from '../screens/account/AccountScreen';
import { FileText, ClipboardList, CircleUserRound } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
// in customer details page -> booking section -> i cant see that 2 buttons .. refer @FigmaDesign
const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.gray[400],
                tabBarStyle: {
                    backgroundColor: COLORS.white,
                    borderTopColor: COLORS.gray[200],
                    height: 72,
                    paddingBottom: 12,
                    paddingTop: 10,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 6,
                    marginBottom: 8
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 2,
                },
                tabBarIcon: ({ color, size }) => {
                    if (route.name === 'Quotations') return <FileText color={color} size={size} />;
                    if (route.name === 'JobCards') return <ClipboardList color={color} size={size} />;
                    if (route.name === 'Account') return <CircleUserRound color={color} size={size} />;
                    return null;
                },
            })}
        >
            <Tab.Screen name="Quotations" component={QuotationsListScreen} options={{ tabBarLabel: 'Quotations' }} />
            <Tab.Screen name="JobCards" component={JobCardsListScreen} options={{ tabBarLabel: 'Job Cards' }} />
            <Tab.Screen name="Account" component={AccountScreen} options={{ tabBarLabel: 'Account' }} />
        </Tab.Navigator>
    );
}
