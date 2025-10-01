# 設計メモ - 通知機能

## データ構造

### NotificationSettings (新規)
```typescript
interface NotificationSettings {
  isEnabled: boolean;
  breakfastTime: string; // "07:00"
  lunchTime: string;     // "12:00"
  dinnerTime: string;    // "18:00"
  includeFamilyInfo: boolean; // 家族情報を含むか
}
```

### UserState (拡張)
```typescript
interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  notificationSettings: NotificationSettings; // 追加
}
```

## 画面遷移
```
Settings画面
├── 通知設定ボタン → NotificationSettingsScreen
│   ├── 通知ON/OFF
│   ├── 朝食時間設定
│   ├── 昼食時間設定
│   ├── 夕食時間設定
│   └── 家族情報表示ON/OFF
```

## 責務の分離
- **NotificationService**: 通知のスケジュール管理・送信
- **NotificationSettingsScreen**: 通知設定のUI
- **UserSlice**: 通知設定の状態管理
- **App.tsx**: アプリ起動時の通知権限要求

## API設計
```typescript
// NotificationService
class NotificationService {
  static async requestPermissions(): Promise<boolean>
  static async scheduleNotifications(settings: NotificationSettings): Promise<void>
  static async cancelAllNotifications(): Promise<void>
  static async updateNotificationSettings(settings: NotificationSettings): Promise<void>
}
```

## 技術スタック
- **expo-notifications**: ローカル通知
- **@react-native-async-storage/async-storage**: 設定の永続化
- **Redux Toolkit**: 状態管理
