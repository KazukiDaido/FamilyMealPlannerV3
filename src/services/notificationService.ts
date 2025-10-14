// src/services/notificationService.ts

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationSettings } from '../types';

// 通知の動作設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private scheduledNotifications: string[] = [];

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // 通知の権限を要求
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('通知の権限が拒否されました');
        return false;
      }

      // Android用の設定
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('meal-reminders', {
          name: '食事リマインダー',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6B7C32',
        });

        await Notifications.setNotificationChannelAsync('deadline-alerts', {
          name: '締切アラート',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D9534F',
        });
      }

      return true;
    } catch (error) {
      console.error('通知権限の要求エラー:', error);
      return false;
    }
  }

  // 既存のスケジュール通知をキャンセル
  async cancelAllScheduledNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications = [];
      console.log('全てのスケジュール通知をキャンセルしました');
    } catch (error) {
      console.error('通知キャンセルエラー:', error);
    }
  }

  // 食事連絡締切リマインダーをスケジュール
  async scheduleMealDeadlineReminders(settings: NotificationSettings): Promise<void> {
    if (!settings.autoNotifyEnabled || !settings.isEnabled) {
      return;
    }

    await this.cancelAllScheduledNotifications();

    const mealTypes = [
      { type: 'breakfast', time: settings.deadlineBreakfast, name: '朝食' },
      { type: 'lunch', time: settings.deadlineLunch, name: '昼食' },
      { type: 'dinner', time: settings.deadlineDinner, name: '夕食' },
    ];

    for (const meal of mealTypes) {
      const reminderTime = this.calculateReminderTime(meal.time, settings.notifyBeforeDeadline);
      if (reminderTime) {
        await this.scheduleDailyNotification({
          id: `meal-reminder-${meal.type}`,
          title: `${meal.name}の連絡締切が近づいています`,
          body: `${settings.notifyBeforeDeadline}分後に${meal.name}の連絡締切です`,
          hour: reminderTime.hour,
          minute: reminderTime.minute,
          channelId: 'meal-reminders',
        });
      }
    }

    // 食事不要通知（昼食のみ）
    if (settings.noMealNotificationEnabled) {
      const noMealTime = this.parseTime(settings.noMealNotificationTime);
      if (noMealTime) {
        await this.scheduleDailyNotification({
          id: 'no-meal-lunch',
          title: 'お昼ご飯は不要となっております',
          body: '本日のお昼ご飯は準備されません',
          hour: noMealTime.hour,
          minute: noMealTime.minute,
          channelId: 'deadline-alerts',
        });
      }
    }

    console.log('食事関連通知をスケジュールしました');
  }

  // 毎日繰り返し通知をスケジュール
  private async scheduleDailyNotification({
    id,
    title,
    body,
    hour,
    minute,
    channelId,
  }: {
    id: string;
    title: string;
    body: string;
    hour: number;
    minute: number;
    channelId: string;
  }): Promise<void> {
    try {
      const trigger: Notifications.DailyTriggerInput = {
        hour,
        minute,
        repeats: true,
      };

      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title,
          body,
          sound: true,
          ...(Platform.OS === 'android' && { channelId }),
        },
        trigger,
      });

      this.scheduledNotifications.push(id);
      console.log(`通知をスケジュールしました: ${id} (${hour}:${minute.toString().padStart(2, '0')})`);
    } catch (error) {
      console.error(`通知スケジュールエラー (${id}):`, error);
    }
  }

  // 時間からリマインダー時間を計算
  private calculateReminderTime(timeString: string, minutesBefore: number): { hour: number; minute: number } | null {
    const time = this.parseTime(timeString);
    if (!time) return null;

    const totalMinutes = time.hour * 60 + time.minute - minutesBefore;
    if (totalMinutes < 0) {
      // 前日になる場合は翌日の同じ時間にする
      const adjustedMinutes = totalMinutes + 24 * 60;
      return {
        hour: Math.floor(adjustedMinutes / 60),
        minute: adjustedMinutes % 60,
      };
    }

    return {
      hour: Math.floor(totalMinutes / 60),
      minute: totalMinutes % 60,
    };
  }

  // 時間文字列を解析 ("HH:MM" -> {hour, minute})
  private parseTime(timeString: string): { hour: number; minute: number } | null {
    const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }

    return { hour, minute };
  }

  // 即座にテスト通知を送信
  async sendTestNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'テスト通知',
          body: '通知機能が正常に動作しています',
          sound: true,
        },
        trigger: null, // 即座に送信
      });
      console.log('テスト通知を送信しました');
    } catch (error) {
      console.error('テスト通知エラー:', error);
    }
  }

  // スケジュール済み通知の一覧を取得
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('スケジュール通知取得エラー:', error);
      return [];
    }
  }
}

export const notificationService = NotificationService.getInstance();