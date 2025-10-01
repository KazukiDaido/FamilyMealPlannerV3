import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { FamilyMember, MealAttendance, MealType } from '../../types';

interface FamilyState {
  members: FamilyMember[];
  mealAttendances: MealAttendance[];
  isLoading: boolean;
  error: string | null;
}

const initialState: FamilyState = {
  members: [],
  mealAttendances: [],
  isLoading: false,
  error: null,
};

// ダミーデータ
const dummyMembers: FamilyMember[] = [
  { id: '1', name: 'お父さん', role: 'parent', isProxy: true },
  { id: '2', name: 'お母さん', role: 'parent', isProxy: true },
  { id: '3', name: '太郎', role: 'child', isProxy: false },
  { id: '4', name: '花子', role: 'child', isProxy: false },
];

const dummyAttendances: MealAttendance[] = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    mealType: 'breakfast',
    attendees: ['1', '2', '3'],
    registeredBy: '1',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    date: new Date().toISOString().split('T')[0],
    mealType: 'lunch',
    attendees: ['2', '4'],
    registeredBy: '2',
    createdAt: new Date().toISOString(),
  },
];

// 非同期アクション: 家族メンバーを取得
export const fetchFamilyMembers = createAsyncThunk<FamilyMember[], void, { rejectValue: string }>(
  'family/fetchMembers',
  async (_, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      return dummyMembers;
    } catch (err) {
      return rejectWithValue('家族メンバーの取得に失敗しました。');
    }
  }
);

// 非同期アクション: 食事参加を取得
export const fetchMealAttendances = createAsyncThunk<MealAttendance[], void, { rejectValue: string }>(
  'family/fetchAttendances',
  async (_, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      return dummyAttendances;
    } catch (err) {
      return rejectWithValue('食事参加データの取得に失敗しました。');
    }
  }
);

// 非同期アクション: 食事参加を登録
export const registerMealAttendance = createAsyncThunk<
  MealAttendance,
  { date: string; mealType: MealType; attendees: string[]; registeredBy: string },
  { rejectValue: string }
>(
  'family/registerAttendance',
  async (attendanceData, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newAttendance: MealAttendance = {
        id: Date.now().toString(),
        ...attendanceData,
        createdAt: new Date().toISOString(),
      };
      return newAttendance;
    } catch (err) {
      return rejectWithValue('食事参加の登録に失敗しました。');
    }
  }
);

// 非同期アクション: 家族メンバーを追加
export const addFamilyMember = createAsyncThunk<FamilyMember, Omit<FamilyMember, 'id'>, { rejectValue: string }>(
  'family/addMember',
  async (memberData, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newMember: FamilyMember = {
        id: Date.now().toString(),
        ...memberData,
      };
      return newMember;
    } catch (err) {
      return rejectWithValue('家族メンバーの追加に失敗しました。');
    }
  }
);

// 非同期アクション: 家族メンバーを更新
export const updateFamilyMember = createAsyncThunk<FamilyMember, FamilyMember, { rejectValue: string }>(
  'family/updateMember',
  async (memberData, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      // 実際にはAPIにPUTリクエストを送信
      return memberData;
    } catch (err) {
      return rejectWithValue('家族メンバーの更新に失敗しました。');
    }
  }
);

// 非同期アクション: 家族メンバーを削除
export const deleteFamilyMember = createAsyncThunk<string, string, { rejectValue: string }>(
  'family/deleteMember',
  async (memberId, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      // 実際にはAPIにDELETEリクエストを送信
      return memberId;
    } catch (err) {
      return rejectWithValue('家族メンバーの削除に失敗しました。');
    }
  }
);

const familySlice = createSlice({
  name: 'family',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchFamilyMembers
      .addCase(fetchFamilyMembers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFamilyMembers.fulfilled, (state, action: PayloadAction<FamilyMember[]>) => {
        state.isLoading = false;
        state.members = action.payload;
      })
      .addCase(fetchFamilyMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || '不明なエラー';
      })
      // fetchMealAttendances
      .addCase(fetchMealAttendances.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMealAttendances.fulfilled, (state, action: PayloadAction<MealAttendance[]>) => {
        state.isLoading = false;
        state.mealAttendances = action.payload;
      })
      .addCase(fetchMealAttendances.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || '不明なエラー';
      })
      // registerMealAttendance
      .addCase(registerMealAttendance.fulfilled, (state, action: PayloadAction<MealAttendance>) => {
        // 同じ日付・食事タイプの既存の登録を削除
        state.mealAttendances = state.mealAttendances.filter(
          attendance => !(attendance.date === action.payload.date && attendance.mealType === action.payload.mealType)
        );
        // 新しい登録を追加
        state.mealAttendances.push(action.payload);
      })
          // addFamilyMember
          .addCase(addFamilyMember.fulfilled, (state, action: PayloadAction<FamilyMember>) => {
            state.members.push(action.payload);
          })
          // updateFamilyMember
          .addCase(updateFamilyMember.fulfilled, (state, action: PayloadAction<FamilyMember>) => {
            const index = state.members.findIndex(member => member.id === action.payload.id);
            if (index !== -1) {
              state.members[index] = action.payload;
            }
          })
          // deleteFamilyMember
          .addCase(deleteFamilyMember.fulfilled, (state, action: PayloadAction<string>) => {
            state.members = state.members.filter(member => member.id !== action.payload);
          });
  },
});

export default familySlice.reducer;
