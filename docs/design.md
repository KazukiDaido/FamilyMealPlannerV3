# 設計メモ

## 通知機能（実装済み）

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

---

## 個人回答機能（新規）

### データ構造

#### PersonalResponse (新規)
```typescript
interface PersonalResponse {
  id: string;
  familyMemberId: string;
  date: string; // YYYY-MM-DD
  mealType: 'breakfast' | 'lunch' | 'dinner';
  willAttend: boolean; // 参加するか
  respondedAt: string; // ISO timestamp
  deadline: string; // ISO timestamp (回答期限)
}
```

#### MealAttendance (拡張)
```typescript
interface MealAttendance {
  id: string;
  date: string;
  mealType: MealType;
  attendees: string[]; // FamilyMember.id[]
  registeredBy: string; // 誰が登録したか
  responses: PersonalResponse[]; // 各人の回答
  deadline: string; // 回答期限
  isLocked: boolean; // 期限切れかどうか
}
```

#### FamilySlice State (拡張)
```typescript
interface FamilyState {
  members: FamilyMember[];
  mealAttendances: MealAttendance[];
  currentMemberId: string | null; // ログイン中のメンバー
  isLoading: boolean;
  error: string | null;
}
```

### 画面遷移
```
アプリ起動
├── ログイン済み？
│   ├── YES → ホーム画面（個人回答モード）
│   │   ├── 今日の朝食カード
│   │   │   ├── 自分の回答状態
│   │   │   ├── 他の家族の回答状態
│   │   │   └── 回答ボタン（参加/不参加）
│   │   ├── 今日の昼食カード
│   │   └── 今日の夕食カード
│   └── NO → ログイン画面
│       └── 家族メンバー選択
```

### 責務の分離
- **AuthService**: 簡易ログイン管理
- **PersonalResponseScreen**: 個人回答UI
- **FamilySlice**: 回答データの状態管理
- **HomeScreen**: 回答状況の表示

### API設計
```typescript
// FamilySlice Actions
export const submitPersonalResponse = createAsyncThunk<...>
export const updatePersonalResponse = createAsyncThunk<...>
export const fetchTodayMeals = createAsyncThunk<...>
export const loginAsFamilyMember = createAsyncThunk<...>
export const logout = createAsyncThunk<...>
```

### UI設計
- **回答カード**: 大きなタップエリアで直感的
- **状態表示**: アイコンと色で視覚的に
  - 未回答: グレー
  - 参加: 緑
  - 不参加: 赤
- **期限表示**: カウントダウンタイマー
- **他の家族**: アバター形式で表示

### 技術スタック
- **Redux Toolkit**: 状態管理
- **AsyncStorage**: ログイン状態の永続化
- **React Navigation**: 画面遷移
- **Ionicons**: アイコン表示
