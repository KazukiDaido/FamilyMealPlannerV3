import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import { StatusBar } from 'expo-status-bar';

// 画面のインポート
import HomeScreen from './src/screens/Home/HomeScreen';
import SettingsScreen from './src/screens/Settings/SettingsScreen';
import ScheduleScreen from './src/screens/Schedule/ScheduleScreen';

// アイコンのインポート
import { HomeIcon, CalendarIcon, SettingsIcon } from './src/components/ui/Icons';

// Firebase認証プロバイダー
import AuthProvider from './src/components/auth/AuthProvider';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthProvider>
          <NavigationContainer>
          <Tab.Navigator
            screenOptions={{
              headerShown: false, // ヘッダーを非表示にしてカスタムヘッダーを使用
              tabBarStyle: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderTopWidth: 0,
                elevation: 0,
                shadowOpacity: 0.1,
                shadowOffset: { width: 0, height: -2 },
                shadowRadius: 8,
                height: 88,
                paddingBottom: 24,
                paddingTop: 8,
              },
              tabBarActiveTintColor: '#6B7C32',
              tabBarInactiveTintColor: '#8A8986',
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '600',
              },
            }}
          >
            <Tab.Screen
              name="Home"
              component={HomeScreen}
              options={{
                title: '連絡',
                tabBarIcon: ({ color, size }) => (
                  <HomeIcon size={size} color={color} />
                ),
              }}
            />
            <Tab.Screen
              name="Schedule"
              component={ScheduleScreen}
              options={{
                title: 'スケジュール',
                tabBarIcon: ({ color, size }) => (
                  <CalendarIcon size={size} color={color} />
                ),
              }}
            />
            <Tab.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                title: '設定',
                tabBarIcon: ({ color, size }) => (
                  <SettingsIcon size={size} color={color} />
                ),
              }}
            />
          </Tab.Navigator>
          </NavigationContainer>
          <StatusBar style="auto" />
        </AuthProvider>
      </PersistGate>
    </Provider>
  );
}
