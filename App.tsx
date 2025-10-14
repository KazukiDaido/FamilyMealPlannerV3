import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Redux Store
import { store, persistor, RootState, AppDispatch } from './src/store';
import { loadCurrentFamilyGroup } from './src/store/slices/familyGroupSlice';
import { startRealtimeSync } from './src/store/slices/familySlice';

// Screen imports
import HomeScreen from './src/screens/Home/HomeScreen';
import RegisterMealScreen from './src/screens/Home/RegisterMealScreen';
import PersonalResponseScreen from './src/screens/PersonalResponse/PersonalResponseScreen';
import FamilyMemberLoginScreen from './src/screens/Auth/FamilyMemberLoginScreen';
import FamilyScreen from './src/screens/Family/FamilyScreen';
import AddFamilyMemberScreen from './src/screens/Family/AddFamilyMemberScreen';
import EditFamilyMemberScreen from './src/screens/Family/EditFamilyMemberScreen';
import CreateFamilyGroupScreen from './src/screens/Family/CreateFamilyGroupScreen';
import JoinFamilyGroupScreen from './src/screens/Family/JoinFamilyGroupScreen';
import QRCodeScannerScreen from './src/screens/Family/QRCodeScannerScreen';
import SettingsScreen from './src/screens/Settings/SettingsScreen';
import NotificationSettingsScreen from './src/screens/Settings/NotificationSettingsScreen';
import ScheduleScreen from './src/screens/Schedule/ScheduleScreen';
import OnboardingScreen from './src/screens/Onboarding/OnboardingScreen';
import InitialSetupScreen from './src/screens/Onboarding/InitialSetupScreen';
import FamilyIdInputScreen from './src/screens/Onboarding/FamilyIdInputScreen';
import NotificationService from './src/services/notificationService';
import OnboardingService from './src/services/onboardingService';
// import AuthService from './src/services/authService';
// import { startRealtimeSync } from './src/store/slices/familySlice';

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

// Onboarding Stack Navigator
function OnboardingStack({ onComplete }: { onComplete: () => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="FamilyIdInput">
        {(props) => <FamilyIdInputScreen {...props} onFamilyIdSubmit={onComplete} />}
      </Stack.Screen>
      <Stack.Screen name="InitialSetup">
        {(props) => <InitialSetupScreen {...props} onComplete={onComplete} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Auth Stack Navigator
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={FamilyMemberLoginScreen} />
    </Stack.Navigator>
  );
}

// Main Stack Navigator (Tab Navigator)
function MainStack() {
  return (
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
        name="Schedule"
        component={ScheduleScreen}
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
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
      <Stack.Screen name="QRCodeScanner" component={QRCodeScannerScreen} />
    </Stack.Navigator>
  );
}

// メインのAppコンポーネント
function AppContent() {
  const dispatch = useDispatch();
  const { currentMemberId, isConnected } = useSelector((state: RootState) => state.family);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  // オンボーディング完了を検知するための関数
  const handleOnboardingComplete = async () => {
    console.log('オンボーディング完了処理を開始');
    try {
      // オンボーディング完了フラグを設定
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      console.log('オンボーディング完了フラグを設定しました');
      
      // 状態を更新
      setIsFirstLaunch(false);
      console.log('isFirstLaunchをfalseに設定しました');
    } catch (error) {
      console.error('オンボーディング完了処理エラー:', error);
    }
  };

      useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        
        const initializeApp = async () => {
          try {
            // Firebase認証を有効化
            console.log('Firebase認証を有効化');
            
            // Firebase認証状態の監視
            unsubscribe = onAuthStateChanged(auth, (user) => {
              console.log('Firebase認証状態変更:', user ? 'ログイン済み' : '未ログイン');
              setFirebaseUser(user);
            });

        // 初回起動かどうかをチェック
        const firstLaunch = await OnboardingService.isFirstLaunch();
        setIsFirstLaunch(firstLaunch);

        // ログイン状態を復元
        const savedMemberId = await AsyncStorage.getItem('currentMemberId');
        if (savedMemberId) {
          console.log('保存されたログイン状態を復元:', savedMemberId);
          dispatch({ type: 'family/loginAsMember/fulfilled', payload: savedMemberId });
        } else {
          console.log('保存されたログイン状態なし');
        }

        // 家族グループの初期化
        dispatch(loadCurrentFamilyGroup());

        // リアルタイム同期の開始（家族グループが存在する場合）
        const state = store.getState();
        const currentFamilyGroup = state.familyGroup.currentFamilyGroup;
        if (currentFamilyGroup?.id) {
          console.log('リアルタイム同期を開始:', currentFamilyGroup.id);
          dispatch(startRealtimeSync(currentFamilyGroup.id));
        }

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

        setIsInitializing(false);
      } catch (error) {
        console.error('アプリ初期化エラー:', error);
        setIsInitializing(false);
        setIsFirstLaunch(true); // エラーの場合は初回起動として扱う
      }
    };

    initializeApp();

    // クリーンアップ（Firebase認証の監視を停止）
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [dispatch]);

  // 初期化中はローディング画面を表示
  if (isInitializing || isFirstLaunch === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B7C32" />
        <Text style={styles.loadingText}>アプリを初期化中...</Text>
      </View>
    );
  }

  // 初回起動の場合はオンボーディングを表示
  if (isFirstLaunch) {
    return (
      <NavigationContainer>
        <OnboardingStack onComplete={handleOnboardingComplete} />
        <StatusBar style="auto" />
      </NavigationContainer>
    );
  }

  // Firebase認証されていない場合、またはReduxでログインしていない場合はログイン画面を表示
  if (!firebaseUser && !currentMemberId) {
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
      <MainStack />
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