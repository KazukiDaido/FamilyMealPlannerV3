import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

// Redux Store
import { store, persistor } from './src/store';

// Screen imports
import HomeScreen from './src/screens/Home/HomeScreen';
import RegisterMealScreen from './src/screens/Home/RegisterMealScreen';
import FamilyScreen from './src/screens/Family/FamilyScreen';
import AddFamilyMemberScreen from './src/screens/Family/AddFamilyMemberScreen';
import EditFamilyMemberScreen from './src/screens/Family/EditFamilyMemberScreen';
import SettingsScreen from './src/screens/Settings/SettingsScreen';
import NotificationSettingsScreen from './src/screens/Settings/NotificationSettingsScreen';

// シンプルな画面コンポーネント
const ScheduleScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>スケジュール</Text>
    <Text style={styles.subtitle}>食事計画機能を追加予定</Text>
  </View>
);

// Settings Stack Navigator
function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    </Stack.Navigator>
  );
}

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack Navigator
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="RegisterMeal" component={RegisterMealScreen} />
    </Stack.Navigator>
  );
}

// Family Stack Navigator
function FamilyStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FamilyMain" component={FamilyScreen} />
      <Stack.Screen name="AddFamilyMember" component={AddFamilyMemberScreen} />
      <Stack.Screen name="EditFamilyMember" component={EditFamilyMemberScreen} />
    </Stack.Navigator>
  );
}

// メインのAppコンポーネント
function AppContent() {
  useEffect(() => {
    // 通知権限の要求と初期設定
    const initializeNotifications = async () => {
      try {
        const NotificationService = (await import('./src/services/notificationService')).default;
        const hasPermission = await NotificationService.requestPermissions();
        if (hasPermission) {
          console.log('通知権限が許可されました');
        } else {
          console.log('通知権限が拒否されました');
        }
      } catch (error) {
        console.error('通知の初期化に失敗:', error);
      }
    };

    initializeNotifications();
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
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
          component={HomeStack}
          options={{
            title: '食事参加',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="restaurant-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Family"
          component={FamilyStack}
          options={{
            title: '家族',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Schedule"
          component={ScheduleScreen}
          options={{
            title: 'スケジュール',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsStack}
          options={{
            title: '設定',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

// Redux Providerでラップしたメインコンポーネント
export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});