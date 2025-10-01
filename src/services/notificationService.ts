import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 通知設定の型定義
export interface NotificationSettings {
  isEnabled: boolean;
  breakfastTime: string; // "07:00"
  lunchTime: string;     // "12:00"
  dinnerTime: string;    // "18:00"
  includeFamilyInfo: boolean;
}

// 通知ハンドラーの設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  // 通知権限の要求
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('meal-reminders', {
        name: '食事リマインダー',
        description: '食事時間の通知',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6B7C32',
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  // 通知のスケジュール設定
  static async scheduleNotifications(settings: NotificationSettings): Promise<void> {
    if (!settings.isEnabled) {
      await this.cancelAllNotifications();
      return;
    }

    // 既存の通知をキャンセル
    await this.cancelAllNotifications();

    const mealTypes = [
      { type: 'breakfast', time: settings.breakfastTime, title: '朝食の時間です' },
      { type: 'lunch', time: settings.lunchTime, title: '昼食の時間です' },
      { type: 'dinner', time: settings.dinnerTime, title: '夕食の時間です' },
    ];

    for (const meal of mealTypes) {
      const [hours, minutes] = meal.time.split(':').map(Number);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: meal.title,
          body: settings.includeFamilyInfo 
            ? '家族の食事参加を確認しましょう' 
            : '食事の準備をしましょう',
          data: { mealType: meal.type },
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });
    }
  }

  // 全ての通知をキャンセル
  static async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // 通知設定の更新
  static async updateNotificationSettings(settings: NotificationSettings): Promise<void> {
    await this.scheduleNotifications(settings);
  }

  // 通知のテスト送信
  static async sendTestNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '通知テスト',
        body: '通知機能が正常に動作しています！',
      },
      trigger: { seconds: 2 },
    });
  }
}

export default NotificationService;
