// 食事の型定義
export interface Meal {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD形式
  type: 'breakfast' | 'lunch' | 'dinner';
  description?: string;
  ingredients?: string[];
  createdAt: string;
  updatedAt: string;
}

// ユーザーの型定義
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  createdAt: string;
  updatedAt: string;
}

// 家族メンバーの型定義
export interface FamilyMember {
  id: string;
  name: string;
  userId: string;
  role: 'admin' | 'member';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 食事計画の型定義
export interface MealPlan {
  id: string;
  date: string; // YYYY-MM-DD形式
  meals: {
    breakfast?: Meal;
    lunch?: Meal;
    dinner?: Meal;
  };
  createdBy: string; // User ID
  createdAt: string;
  updatedAt: string;
}

// アプリの状態の型定義
export interface AppState {
  meals: Meal[];
  users: User[];
  familyMembers: FamilyMember[];
  mealPlans: MealPlan[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}