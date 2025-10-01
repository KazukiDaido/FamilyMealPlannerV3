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

export interface MealAttendance {
  id: string;
  date: string; // YYYY-MM-DD format
  mealType: MealType;
  attendees: string[]; // FamilyMember.id[]
  registeredBy: string; // FamilyMember.id (誰が登録したか)
  createdAt: string; // ISO string
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