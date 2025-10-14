// src/screens/Settings/NotificationSettingsScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import {
  loadNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermissions,
  sendTestNotification,
  getScheduledNotifications,
  updateSettings,
} from '../../store/slices/notificationSlice';
import { NotificationSettings } from '../../types';

interface TimePickerProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ label, value, onValueChange }) => {
  const [hour, minute] = value.split(':').map(Number);

  const updateTime = (newHour: number, newMinute: number) => {
    const formattedTime = `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
    onValueChange(formattedTime);
  };

  return (
    <View style={styles.timePickerContainer}>
      <Text style={styles.timePickerLabel}>{label}</Text>
      <View style={styles.timePicker}>
        <View style={styles.timeInputContainer}>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => updateTime((hour + 1) % 24, minute)}
          >
            <Ionicons name="chevron-up" size={20} color="#6B7C32" />
          </TouchableOpacity>
          <Text style={styles.timeValue}>{hour.toString().padStart(2, '0')}</Text>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => updateTime((hour - 1 + 24) % 24, minute)}
          >
            <Ionicons name="chevron-down" size={20} color="#6B7C32" />
          </TouchableOpacity>
        </View>
        <Text style={styles.timeSeparator}>:</Text>
        <View style={styles.timeInputContainer}>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => updateTime(hour, (minute + 5) % 60)}
          >
            <Ionicons name="chevron-up" size={20} color="#6B7C32" />
          </TouchableOpacity>
          <Text style={styles.timeValue}>{minute.toString().padStart(2, '0')}</Text>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => updateTime(hour, (minute - 5 + 60) % 60)}
          >
            <Ionicons name="chevron-down" size={20} color="#6B7C32" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const NotificationSettingsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { settings, isLoading, error, permissionsGranted } = useSelector(
    (state: RootState) => state.notification
  );

  const [localSettings, setLocalSettings] = useState<NotificationSettings>(settings);

  useEffect(() => {
    // 初期設定を読み込み
    dispatch(loadNotificationSettings());
    // 権限を要求
    dispatch(requestNotificationPermissions());
  }, [dispatch]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    try {
      await dispatch(saveNotificationSettings(localSettings)).unwrap();
      Alert.alert('保存完了', '通知設定を保存しました');
    } catch (error) {
      Alert.alert('エラー', '設定の保存に失敗しました');
    }
  };

  const handleTestNotification = async () => {
    try {
      await dispatch(sendTestNotification()).unwrap();
      Alert.alert('送信完了', 'テスト通知を送信しました');
    } catch (error) {
      Alert.alert('エラー', 'テスト通知の送信に失敗しました');
    }
  };

  const handleViewScheduled = async () => {
    try {
      await dispatch(getScheduledNotifications());
      // スケジュール済み通知の詳細を表示
      const state = require('../../store').store.getState();
      const scheduledNotifications = state.notification.scheduledNotifications;
      
      if (scheduledNotifications.length === 0) {
        Alert.alert('スケジュール通知', '現在スケジュールされている通知はありません');
      } else {
        const notificationList = scheduledNotifications
          .map((n: any) => `• ${n.content.title}`)
          .join('\n');
        Alert.alert('スケジュール通知', `以下の通知がスケジュールされています:\n\n${notificationList}`);
      }
    } catch (error) {
      Alert.alert('エラー', 'スケジュール通知の取得に失敗しました');
    }
  };

  const updateLocalSettings = (updates: Partial<NotificationSettings>) => {
    setLocalSettings(prev => ({ ...prev, ...updates }));
  };

  if (isLoading && !localSettings.isEnabled) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B7C32" />
          <Text style={styles.loadingText}>設定を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* 基本設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本設定</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>通知を有効にする</Text>
              <Text style={styles.settingDescription}>
                食事関連の通知を送信します
              </Text>
            </View>
            <Switch
              value={localSettings.isEnabled}
              onValueChange={(value) => updateLocalSettings({ isEnabled: value })}
              trackColor={{ false: '#E0E0E0', true: '#6B7C32' }}
              thumbColor={localSettings.isEnabled ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>権限状態</Text>
              <Text style={styles.settingDescription}>
                {permissionsGranted ? '通知権限が許可されています' : '通知権限が拒否されています'}
              </Text>
            </View>
            <Ionicons
              name={permissionsGranted ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={permissionsGranted ? '#28a745' : '#dc3545'}
            />
          </View>
        </View>

        {/* 締切時間設定 */}
        {localSettings.isEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>食事連絡締切時間</Text>
            
            <TimePicker
              label="朝食締切"
              value={localSettings.deadlineBreakfast}
              onValueChange={(value) => updateLocalSettings({ deadlineBreakfast: value })}
            />
            
            <TimePicker
              label="昼食締切"
              value={localSettings.deadlineLunch}
              onValueChange={(value) => updateLocalSettings({ deadlineLunch: value })}
            />
            
            <TimePicker
              label="夕食締切"
              value={localSettings.deadlineDinner}
              onValueChange={(value) => updateLocalSettings({ deadlineDinner: value })}
            />
          </View>
        )}

        {/* 自動通知設定 */}
        {localSettings.isEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>自動通知設定</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>締切リマインダー</Text>
                <Text style={styles.settingDescription}>
                  締切時間前に通知を送信します
                </Text>
              </View>
              <Switch
                value={localSettings.autoNotifyEnabled}
                onValueChange={(value) => updateLocalSettings({ autoNotifyEnabled: value })}
                trackColor={{ false: '#E0E0E0', true: '#6B7C32' }}
                thumbColor={localSettings.autoNotifyEnabled ? '#FFFFFF' : '#F4F3F4'}
              />
            </View>

            {localSettings.autoNotifyEnabled && (
              <View style={styles.timeSelectorContainer}>
                <Text style={styles.settingLabel}>通知タイミング</Text>
                <Text style={styles.settingDescription}>
                  締切の{localSettings.notifyBeforeDeadline}分前に通知
                </Text>
                <View style={styles.timeSelector}>
                  {[15, 30, 60, 120].map((minutes) => (
                    <TouchableOpacity
                      key={minutes}
                      style={[
                        styles.timeOption,
                        localSettings.notifyBeforeDeadline === minutes && styles.timeOptionSelected,
                      ]}
                      onPress={() => updateLocalSettings({ notifyBeforeDeadline: minutes })}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          localSettings.notifyBeforeDeadline === minutes && styles.timeOptionTextSelected,
                        ]}
                      >
                        {minutes}分前
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>食事不要通知</Text>
                <Text style={styles.settingDescription}>
                  「お昼ご飯は不要」通知を送信
                </Text>
              </View>
              <Switch
                value={localSettings.noMealNotificationEnabled}
                onValueChange={(value) => updateLocalSettings({ noMealNotificationEnabled: value })}
                trackColor={{ false: '#E0E0E0', true: '#6B7C32' }}
                thumbColor={localSettings.noMealNotificationEnabled ? '#FFFFFF' : '#F4F3F4'}
              />
            </View>

            {localSettings.noMealNotificationEnabled && (
              <TimePicker
                label="食事不要通知時間"
                value={localSettings.noMealNotificationTime}
                onValueChange={(value) => updateLocalSettings({ noMealNotificationTime: value })}
              />
            )}
          </View>
        )}

        {/* テスト・管理 */}
        {localSettings.isEnabled && permissionsGranted && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>テスト・管理</Text>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleTestNotification}>
              <Ionicons name="notifications-outline" size={24} color="#6B7C32" />
              <Text style={styles.actionButtonText}>テスト通知を送信</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleViewScheduled}>
              <Ionicons name="list-outline" size={24} color="#6B7C32" />
              <Text style={styles.actionButtonText}>スケジュール通知を確認</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 保存ボタン */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>設定を保存</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  timePickerContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  timeInputContainer: {
    alignItems: 'center',
    minWidth: 60,
  },
  timeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 4,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
    minWidth: 40,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 12,
  },
  timeSelectorContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  timeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginBottom: 4,
  },
  timeOptionSelected: {
    backgroundColor: '#6B7C32',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#666',
  },
  timeOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  saveButtonContainer: {
    paddingVertical: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B7C32',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default NotificationSettingsScreen;