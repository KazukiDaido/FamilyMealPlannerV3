import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { User } from 'firebase/auth';

// Redux Store
import { store, persistor, RootState } from './src/store';

// Screen imports
import HomeScreen from './src/screens/Home/HomeScreen';
import RegisterMealScreen from './src/screens/Home/RegisterMealScreen';
import PersonalResponseScreen from './src/screens/Home/PersonalResponseScreen';
import FamilyMemberLoginScreen from './src/screens/Auth/FamilyMemberLoginScreen';
import FamilyScreen from './src/screens/Family/FamilyScreen';
import AddFamilyMemberScreen from './src/screens/Family/AddFamilyMemberScreen';
import EditFamilyMemberScreen from './src/screens/Family/EditFamilyMemberScreen';
import CreateFamilyGroupScreen from './src/screens/Family/CreateFamilyGroupScreen';
import JoinFamilyGroupScreen from './src/screens/Family/JoinFamilyGroupScreen';
import SettingsScreen from './src/screens/Settings/SettingsScreen';
import NotificationSettingsScreen from './src/screens/Settings/NotificationSettingsScreen';
import ScheduleScreen from './src/screens/Schedule/ScheduleScreen';
import NotificationService from './src/services/notificationService';
import AuthService from './src/services/authService';
import { startRealtimeSync } from './src/store/slices/familySlice';

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

// Auth Stack Navigator
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={FamilyMemberLoginScreen} />
    </Stack.Navigator>
  );
}

// Home Stack Navigator
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="RegisterMeal" component={RegisterMealScreen} />
      <Stack.Screen name="PersonalResponse" component={PersonalResponseScreen} />
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
      <Stack.Screen name="CreateFamilyGroup" component={CreateFamilyGroupScreen} />
      <Stack.Screen name="JoinFamilyGroup" component={JoinFamilyGroupScreen} />
    </Stack.Navigator>
  );
}

// メインのAppコンポーネント
function AppContent() {
  const dispatch = useDispatch();
  const { currentMemberId, isConnected } = useSelector((state: RootState) => state.family);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Firebase認証状態の監視
    const unsubscribeAuth = AuthService.onAuthStateChanged((user) => {
      setFirebaseUser(user);
      setIsInitializing(false);
      
      if (user) {
        // ユーザーがログインしている場合はリアルタイム同期を開始
        dispatch(startRealtimeSync());
      }
    });

    // 通知権限の要求と初期設定
    const initializeNotifications = async () => {
      try {
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

    // クリーンアップ
    return () => {
      unsubscribeAuth();
    };
  }, [dispatch]);

  // 初期化中はローディング画面を表示
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B7C32" />
        <Text style={styles.loadingText}>アプリを初期化中...</Text>
      </View>
    );
  }

  // Firebase認証されていない場合はログイン画面を表示
  if (!firebaseUser) {
    return (
      <NavigationContainer>
        <AuthStack />
        <StatusBar style="auto" />
      </NavigationContainer>
    );
  }

  // 認証済みの場合はメインタブを表示
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
      <AppContent />
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6B7C32',
    fontWeight: '500',
  },
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