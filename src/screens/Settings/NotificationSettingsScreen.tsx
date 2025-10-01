import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { updateNotificationSettings } from '../../store/slices/userSlice';
import NotificationService from '../../services/notificationService';
import { NotificationSettings } from '../../types';

interface NotificationSettingsScreenProps {
  navigation: any;
}

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { notificationSettings, isLoading, error } = useSelector((state: RootState) => state.user);
  
  const [settings, setSettings] = useState<NotificationSettings>(
    notificationSettings || {
      isEnabled: true,
      breakfastTime: '07:00',
      lunchTime: '12:00',
      dinnerTime: '18:00',
      includeFamilyInfo: true,
    }
  );
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (notificationSettings) {
      setSettings(notificationSettings);
    }
  }, [notificationSettings]);

  const handleToggleNotification = (value: boolean) => {
    setSettings(prev => ({ ...prev, isEnabled: value }));
  };

  const handleToggleFamilyInfo = (value: boolean) => {
    setSettings(prev => ({ ...prev, includeFamilyInfo: value }));
  };

  const handleTimeChange = (mealType: keyof Pick<NotificationSettings, 'breakfastTime' | 'lunchTime' | 'dinnerTime'>, time: string) => {
    setSettings(prev => ({ ...prev, [mealType]: time }));
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await dispatch(updateNotificationSettings(settings)).unwrap();
      Alert.alert('成功', '通知設定が更新されました！');
    } catch (err: any) {
      Alert.alert('エラー', err.message || '通知設定の更新に失敗しました。');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await NotificationService.sendTestNotification();
      Alert.alert('テスト通知', '2秒後にテスト通知が送信されます');
    } catch (err) {
      Alert.alert('エラー', 'テスト通知の送信に失敗しました');
    }
  };

  const TimeSelector: React.FC<{
    label: string;
    value: string;
    onChange: (time: string) => void;
  }> = ({ label, value, onChange }) => {
    const [hours, minutes] = value.split(':').map(Number);
    
    const updateTime = (newHours: number, newMinutes: number) => {
      const timeString = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
      onChange(timeString);
    };

    return (
      <View style={styles.timeSelector}>
        <Text style={styles.timeLabel}>{label}</Text>
        <View style={styles.timeInputs}>
          <View style={styles.timeInput}>
            <Text style={styles.timeText}>{hours.toString().padStart(2, '0')}</Text>
            <View style={styles.timeButtons}>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => updateTime((hours + 1) % 24, minutes)}
              >
                <Ionicons name="chevron-up" size={16} color="#6B7C32" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => updateTime((hours - 1 + 24) % 24, minutes)}
              >
                <Ionicons name="chevron-down" size={16} color="#6B7C32" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.timeSeparator}>:</Text>
          <View style={styles.timeInput}>
            <Text style={styles.timeText}>{minutes.toString().padStart(2, '0')}</Text>
            <View style={styles.timeButtons}>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => updateTime(hours, (minutes + 15) % 60)}
              >
                <Ionicons name="chevron-up" size={16} color="#6B7C32" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => updateTime(hours, (minutes - 15 + 60) % 60)}
              >
                <Ionicons name="chevron-down" size={16} color="#6B7C32" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>通知設定</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>通知を有効にする</Text>
            <Switch
              value={settings.isEnabled}
              onValueChange={handleToggleNotification}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={settings.isEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        </View>

        {settings.isEnabled && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>通知時間</Text>
              
              <TimeSelector
                label="朝食"
                value={settings.breakfastTime}
                onChange={(time) => handleTimeChange('breakfastTime', time)}
              />
              
              <TimeSelector
                label="昼食"
                value={settings.lunchTime}
                onChange={(time) => handleTimeChange('lunchTime', time)}
              />
              
              <TimeSelector
                label="夕食"
                value={settings.dinnerTime}
                onChange={(time) => handleTimeChange('dinnerTime', time)}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>家族情報を含める</Text>
                  <Text style={styles.settingDescription}>
                    通知に家族メンバーの情報を含めます
                  </Text>
                </View>
                <Switch
                  value={settings.includeFamilyInfo}
                  onValueChange={handleToggleFamilyInfo}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={settings.includeFamilyInfo ? '#f5dd4b' : '#f4f3f4'}
                />
              </View>
            </View>
          </>
        )}

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestNotification}
            disabled={!settings.isEnabled}
          >
            <Ionicons name="notifications-outline" size={20} color="white" />
            <Text style={styles.testButtonText}>テスト通知を送信</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>設定を保存</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
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
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  timeSelector: {
    marginBottom: 20,
  },
  timeLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 10,
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInput: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6B7C32',
    marginBottom: 10,
  },
  timeButtons: {
    flexDirection: 'row',
  },
  timeButton: {
    padding: 8,
    margin: 2,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6B7C32',
    marginHorizontal: 10,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#6B7C32',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default NotificationSettingsScreen;
