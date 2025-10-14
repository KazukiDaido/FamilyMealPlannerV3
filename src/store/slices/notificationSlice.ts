// src/store/slices/notificationSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { NotificationSettings } from '../../types';
import { notificationService } from '../../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = 'notificationSettings';

// デフォルト設定
const defaultSettings: NotificationSettings = {
  isEnabled: true,
  deadlineBreakfast: '07:00',
  deadlineLunch: '12:00',
  deadlineDinner: '18:00',
  autoNotifyEnabled: true,
  notifyBeforeDeadline: 30, // 30分前に通知
  noMealNotificationEnabled: true,
  noMealNotificationTime: '11:30', // 昼食不要通知
  includeFamilyInfo: true,
};

interface NotificationState {
  settings: NotificationSettings;
  isLoading: boolean;
  error: string | null;
  permissionsGranted: boolean;
  scheduledNotifications: any[];
}

const initialState: NotificationState = {
  settings: defaultSettings,
  isLoading: false,
  error: null,
  permissionsGranted: false,
  scheduledNotifications: [],
};

// 設定を保存
export const saveNotificationSettings = createAsyncThunk<
  NotificationSettings,
  Partial<NotificationSettings>,
  { rejectValue: string }
>(
  'notification/saveSettings',
  async (newSettings, { rejectWithValue, getState }) => {
    try {
      const currentState = getState() as { notification: NotificationState };
      const updatedSettings = {
        ...currentState.notification.settings,
        ...newSettings,
      };

      // AsyncStorageに保存
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updatedSettings));
      
      // 通知をスケジュール
      await notificationService.scheduleMealDeadlineReminders(updatedSettings);
      
      console.log('通知設定を保存しました:', updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('通知設定保存エラー:', error);
      return rejectWithValue('通知設定の保存に失敗しました');
    }
  }
);

// 設定を読み込み
export const loadNotificationSettings = createAsyncThunk<
  NotificationSettings,
  void,
  { rejectValue: string }
>(
  'notification/loadSettings',
  async (_, { rejectWithValue }) => {
    try {
      const savedSettings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        console.log('通知設定を読み込みました:', parsedSettings);
        return parsedSettings;
      }
      return defaultSettings;
    } catch (error) {
      console.error('通知設定読み込みエラー:', error);
      return rejectWithValue('通知設定の読み込みに失敗しました');
    }
  }
);

// 通知権限を要求
export const requestNotificationPermissions = createAsyncThunk<
  boolean,
  void,
  { rejectValue: string }
>(
  'notification/requestPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const granted = await notificationService.requestPermissions();
      console.log('通知権限の結果:', granted);
      return granted;
    } catch (error) {
      console.error('通知権限要求エラー:', error);
      return rejectWithValue('通知権限の要求に失敗しました');
    }
  }
);

// テスト通知を送信
export const sendTestNotification = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  'notification/sendTest',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.sendTestNotification();
    } catch (error) {
      console.error('テスト通知エラー:', error);
      return rejectWithValue('テスト通知の送信に失敗しました');
    }
  }
);

// スケジュール済み通知を取得
export const getScheduledNotifications = createAsyncThunk<
  any[],
  void,
  { rejectValue: string }
>(
  'notification/getScheduled',
  async (_, { rejectWithValue }) => {
    try {
      const notifications = await notificationService.getScheduledNotifications();
      console.log('スケジュール済み通知:', notifications);
      return notifications;
    } catch (error) {
      console.error('スケジュール通知取得エラー:', error);
      return rejectWithValue('スケジュール通知の取得に失敗しました');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    resetSettings: (state) => {
      state.settings = defaultSettings;
    },
  },
  extraReducers: (builder) => {
    builder
      // 設定保存
      .addCase(saveNotificationSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveNotificationSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(saveNotificationSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || '設定の保存に失敗しました';
      })
      // 設定読み込み
      .addCase(loadNotificationSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadNotificationSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(loadNotificationSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || '設定の読み込みに失敗しました';
      })
      // 権限要求
      .addCase(requestNotificationPermissions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestNotificationPermissions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.permissionsGranted = action.payload;
      })
      .addCase(requestNotificationPermissions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || '権限の要求に失敗しました';
      })
      // テスト通知
      .addCase(sendTestNotification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendTestNotification.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(sendTestNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'テスト通知の送信に失敗しました';
      })
      // スケジュール通知取得
      .addCase(getScheduledNotifications.fulfilled, (state, action) => {
        state.scheduledNotifications = action.payload;
      });
  },
});

export const { updateSettings, clearError, resetSettings } = notificationSlice.actions;
export default notificationSlice.reducer;
