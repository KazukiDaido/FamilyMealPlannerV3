// src/types/index.ts

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type FamilyRole = 'parent' | 'child';

export interface FamilyMember {
  id: string;
  name: string;
  role: FamilyRole;
  isProxy: boolean; // 他の人の分を登録できるか
  avatar?: string; // アバター画像のURL
  pin?: string; // 4桁PIN（オプショナル）
}

// 個人回答の型定義
export interface PersonalResponse {
  id: string;
  familyMemberId: string;
  date: string; // YYYY-MM-DD format
  mealType: MealType;
  willAttend: boolean; // true = 参加, false = 不参加
  respondedAt: string; // ISO timestamp
}

// 回答設定の型定義
export interface ResponseSettings {
  deadlineMinutes: 30 | 15 | 60 | 120; // 回答期限（分）
  defaultNoResponse: 'attend' | 'not-attend' | 'unanswered'; // 未回答時の扱い
}

export interface MealAttendance {
  id: string;
  date: string; // YYYY-MM-DD format
  mealType: MealType;
  attendees: string[]; // FamilyMember.id[]
  registeredBy: string; // FamilyMember.id (誰が登録したか)
  createdAt: string; // ISO string
  responses?: PersonalResponse[]; // 各人の回答（オプショナル）
  deadline?: string; // 回答期限 ISO timestamp（オプショナル）
  isLocked?: boolean; // 期限切れフラグ（オプショナル）
}

export interface User {
  id: string;
  name: string;
  email: string;
  familyMemberId?: string; // 関連するFamilyMember.id
}

// 家族グループの型定義
export interface FamilyGroup {
  id: string;
  name: string; // 家族名（例：「田中家」）
  familyCode: string; // 6桁の家族ID
  createdBy: string; // 作成者のUser ID
  createdAt: string; // ISO timestamp
  memberCount: number; // メンバー数
  settings: {
    allowGuestJoin: boolean; // ゲスト参加を許可するか
    requireApproval: boolean; // 参加承認が必要か
  };
}

// 家族グループ参加リクエストの型定義
export interface FamilyGroupJoinRequest {
  id: string;
  familyGroupId: string;
  requesterName: string;
  requesterId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string; // ISO timestamp
  respondedAt?: string; // ISO timestamp
}

// 通知設定の型定義
export interface NotificationSettings {
  isEnabled: boolean;
  // 食事連絡締め切り時間
  deadlineBreakfast: string; // "07:00"
  deadlineLunch: string;     // "12:00"
  deadlineDinner: string;    // "18:00"
  // 自動通知設定
  autoNotifyEnabled: boolean;
  notifyBeforeDeadline: number; // 締切何分前に通知するか（分）
  // 食事不要通知
  noMealNotificationEnabled: boolean;
  noMealNotificationTime: string; // "11:30" (昼食不要通知の時間)
  includeFamilyInfo: boolean;
}