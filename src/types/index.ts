// src/types/index.ts

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type FamilyRole = 'parent' | 'child';

export interface FamilyMember {
  id: string;
  name: string;
  role: FamilyRole;
  isProxy: boolean; // 他の人の分を登録できるか
  avatar?: string; // アバター画像のURL
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

// 通知設定の型定義
export interface NotificationSettings {
  isEnabled: boolean;
  breakfastTime: string; // "07:00"
  lunchTime: string;     // "12:00"
  dinnerTime: string;    // "18:00"
  includeFamilyInfo: boolean;
}