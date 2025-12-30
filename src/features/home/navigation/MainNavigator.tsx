import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

// Import screens
import AddTransactionScreen from '../screens/AddTransactionScreen';
import BudgetScreen from '../screens/BudgetScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StatisticsScreen from '../screens/StatisticsScreen';

const Tab = createBottomTabNavigator();

// Custom Tab Bar Button for the center "Add" button
const CustomTabBarButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={styles.customButton}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.customButtonInner}>{children}</View>
  </TouchableOpacity>
);

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Trang Chủ',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{
          tabBarLabel: 'Thống kê',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'bar-chart' : 'bar-chart-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="add"
              size={32}
              color="#fff"
            />
          ),
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />

      <Tab.Screen
        name="Budget"
        component={BudgetScreen}
        options={{
          tabBarLabel: 'Ngân sách',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'wallet' : 'wallet-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Cài đặt',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    height: Platform.OS === 'ios' ? 88 : 70,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  customButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default MainNavigator;