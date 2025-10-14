import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/familySlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingService from '../../services/onboardingService';

interface SettingsScreenProps {
  navigation: any;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { currentMemberId, members } = useSelector((state: RootState) => state.family);
  
  // 現在ログインユーザーの取得
  const getCurrentUser = () => {
    return members.find(member => member.id === currentMemberId);
  };

  const handleNotificationSettings = () => {
    navigation.navigate('NotificationSettings');
  };

  const handleLogout = () => {
    const currentUser = getCurrentUser();
    Alert.alert(
      'ログアウト',
      currentUser 
        ? `${currentUser.name}さんのアカウントからログアウトしますか？`
        : 'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('currentMemberId');
              dispatch(logout());
              Alert.alert('ログアウト完了', 'ログイン画面に戻ります。');
            } catch (error) {
              console.error('ログアウトエラー:', error);
              Alert.alert('エラー', 'ログアウトに失敗しました。');
            }
          },
        },
      ]
    );
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'オンボーディングをリセット',
      '初回起動時のオンボーディングを再度表示するように設定しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: async () => {
            try {
              await OnboardingService.resetOnboarding();
              Alert.alert('完了', 'オンボーディングがリセットされました。アプリを再起動してください。');
            } catch (error) {
              Alert.alert('エラー', 'リセットに失敗しました。');
            }
          },
        },
      ]
    );
  };

  const currentUser = getCurrentUser();

  const settingItems = [
    {
      id: 'current_user',
      title: '現在のユーザー',
      subtitle: currentUser ? `${currentUser.name}${currentUser.isProxy ? ' (代理登録可)' : ''}` : '未ログイン',
      icon: 'person-circle-outline',
      onPress: () => {},
      isInfo: true,
    },
    {
      id: 'logout',
      title: 'ログアウト',
      subtitle: '別のメンバーでログインする',
      icon: 'log-out-outline',
      onPress: handleLogout,
      isEnabled: true,
      isDanger: true,
    },
    {
      id: 'notifications',
      title: '通知設定',
      subtitle: '食事時間のリマインダー',
      icon: 'notifications-outline',
      onPress: handleNotificationSettings,
      isEnabled: true,
    },
    {
      id: 'reset_onboarding',
      title: 'オンボーディングをリセット',
      subtitle: '初回起動画面を再度表示',
      icon: 'refresh-outline',
      onPress: handleResetOnboarding,
      isEnabled: true,
    },
    {
      id: 'profile',
      title: 'プロフィール',
      subtitle: 'ユーザー情報の管理',
      icon: 'person-outline',
      onPress: () => {},
      isEnabled: false,
    },
    {
      id: 'privacy',
      title: 'プライバシー',
      subtitle: 'データの管理と設定',
      icon: 'shield-outline',
      onPress: () => {},
      isEnabled: false,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>設定</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {settingItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.settingItem,
              item.isInfo && styles.settingItemInfo,
              item.isDanger && styles.settingItemDanger,
            ]}
            onPress={item.onPress}
            disabled={!item.isEnabled && !item.isInfo}
          >
            <View style={[
              styles.settingIcon,
              item.isDanger && styles.settingIconDanger,
            ]}>
              <Ionicons 
                name={item.icon} 
                size={24} 
                color={item.isDanger ? '#dc3545' : '#6B7C32'} 
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={[
                styles.settingTitle,
                item.isDanger && styles.settingTitleDanger,
              ]}>
                {item.title}
              </Text>
              <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
            </View>
            {!item.isInfo && (
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={item.isEnabled ? '#6B7C32' : '#ccc'} 
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingItemInfo: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#6B7C32',
  },
  settingItemDanger: {
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  settingIconDanger: {
    backgroundColor: '#ffebee',
  },
  settingTitleDanger: {
    color: '#dc3545',
  },
});
