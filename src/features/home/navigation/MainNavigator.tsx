import { useAppTheme } from '@/core/theme/ThemeContext';
import { getBottomSpace, hp, normalize } from '@/utils/layout';
import { FontAwesome6 } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import BudgetScreen from '../screens/BudgetScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StatisticsScreen from '../screens/StatisticsScreen';

const Tab = createBottomTabNavigator();

const EmptyScreen = () => <View style={{ flex: 1 }} />;

const CustomTabBarButton = ({ children }: any) => {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      style={styles.customButton}
      activeOpacity={0.9}
      onPress={() => router.push('/(protected)/add-transaction')}
    >
      <View
        style={[
          styles.customButtonInner,
          { backgroundColor: colors.tint },
        ]}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
};

export default function MainNavigator() {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none',
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            height: Platform.OS === 'ios' ? hp(11) : hp(9),
            paddingBottom:
              Platform.OS === 'ios' ? getBottomSpace() : hp(1.5),
          },
        ],
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Trang Chủ',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome6
              name="house"
              size={normalize(20)}
              color={color}
              solid={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{
          tabBarLabel: 'Thống kê',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome6
              name="chart-simple"
              size={normalize(20)}
              color={color}
              solid={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="AddTransactionPlaceholder"
        component={EmptyScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: () => (
            <View style={styles.addIconContainer}>
              <FontAwesome6
                name="plus"
                size={normalize(28)}
                color="#fff"
                style={styles.addIconStyle}
              />
            </View>
          ),
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} />
          ),
        }}
        listeners={{
          tabPress: (e) => e.preventDefault(),
        }}
      />

      <Tab.Screen
        name="Budget"
        component={BudgetScreen}
        options={{
          tabBarLabel: 'Ngân sách',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome6
              name="wallet"
              size={normalize(20)}
              color={color}
              solid={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Cài đặt',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome6
              name="gear"
              size={normalize(20)}
              color={color}
              solid={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    elevation: 0,
    paddingTop: hp(1.2),
    paddingHorizontal: normalize(10),
  },
  tabBarLabel: {
    fontSize: normalize(11),
    marginTop: normalize(4),
  },
  customButton: {
    top: normalize(-30),
    alignItems: 'center',
  },
  customButtonInner: {
    width: normalize(64),
    height: normalize(64),
    borderRadius: normalize(32),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  addIconContainer: {
    width: normalize(50),
    height: normalize(50),
  },
  addIconStyle: {
    marginTop: normalize(20),
    marginLeft: normalize(14),
  },
});
