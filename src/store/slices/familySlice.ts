import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { FamilyMember, MealAttendance, MealType, PersonalResponse, ResponseSettings } from '../../types';
// import SyncService from '../../services/syncService';

interface FamilyState {
  members: FamilyMember[];
  mealAttendances: MealAttendance[];
  currentMemberId: string | null; // ログイン中のメンバー
  responseSettings: ResponseSettings; // 回答設定
  isLoading: boolean;
  error: string | null;
  isConnected: boolean; // ネットワーク接続状態
  lastSyncTime: string | null; // 最後の同期時刻
}

const initialState: FamilyState = {
  members: [],
  mealAttendances: [],
  currentMemberId: null,
  responseSettings: {
    deadlineMinutes: 30,
    defaultNoResponse: 'unanswered',
  },
  isLoading: false,
  error: null,
  isConnected: false,
  lastSyncTime: null,
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

// 非同期アクション: 家族メンバーを取得（Firebase連携）
export const fetchFamilyMembers = createAsyncThunk<FamilyMember[], void, { rejectValue: string }>(
  'family/fetchMembers',
  async (_, { rejectWithValue }) => {
    // Firebase接続を無効化、ローカルデータのみ使用
    console.log('ローカルデータを使用して家族メンバーを取得');
    return dummyMembers;
  }
);

// 非同期アクション: 食事参加を取得（Firebase連携）
export const fetchMealAttendances = createAsyncThunk<MealAttendance[], void, { rejectValue: string }>(
  'family/fetchAttendances',
  async (_, { rejectWithValue }) => {
    try {
      const attendances = await SyncService.syncMealAttendances();
      return attendances;
    } catch (err) {
      // Firebase接続に失敗した場合はダミーデータを使用
      console.warn('Firebase接続に失敗、ダミーデータを使用:', err);
      return dummyAttendances;
    }
  }
);

// 非同期アクション: 食事参加を登録（Firebase連携）
export const registerMealAttendance = createAsyncThunk<
  MealAttendance,
  { date: string; mealType: MealType; attendees: string[]; registeredBy: string },
  { rejectValue: string }
>(
  'family/registerAttendance',
  async (attendanceData, { rejectWithValue }) => {
    try {
      const newAttendance: Omit<MealAttendance, 'id'> = {
        createdAt: new Date().toISOString(),
        ...attendanceData,
      };
      
      // Firebaseに保存
      const attendanceId = await SyncService.saveMealAttendance(newAttendance);
      
      return {
        id: attendanceId,
        ...newAttendance,
      };
    } catch (err) {
      console.error('食事参加登録エラー:', err);
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

// ログインアクション
export const loginAsMember = createAsyncThunk<string, string, { rejectValue: string }>(
  'family/loginAsMember',
  async (memberId, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      return memberId;
    } catch (err) {
      return rejectWithValue('ログインに失敗しました。');
    }
  }
);

// ログアウトアクション
export const logoutMember = createAsyncThunk<void, void, { rejectValue: string }>(
  'family/logoutMember',
  async (_, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      return;
    } catch (err) {
      return rejectWithValue('ログアウトに失敗しました。');
    }
  }
);

// 個人回答の送信
export const submitPersonalResponse = createAsyncThunk<PersonalResponse, Omit<PersonalResponse, 'id' | 'respondedAt'>, { rejectValue: string }>(
  'family/submitPersonalResponse',
  async (responseData, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newResponse: PersonalResponse = {
        id: `pr-${Date.now()}`,
        ...responseData,
        respondedAt: new Date().toISOString(),
      };
      return newResponse;
    } catch (err) {
      return rejectWithValue('回答の送信に失敗しました。');
    }
  }
);

// 回答設定の更新
export const updateResponseSettings = createAsyncThunk<ResponseSettings, ResponseSettings, { rejectValue: string }>(
  'family/updateResponseSettings',
  async (settings, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      return settings;
    } catch (err) {
      return rejectWithValue('設定の更新に失敗しました。');
    }
  }
);

// リアルタイム同期の開始
export const startRealtimeSync = createAsyncThunk<void, void, { rejectValue: string }>(
  'family/startRealtimeSync',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // 家族メンバーのリアルタイム監視
      const unsubscribeMembers = SyncService.subscribeToFamilyMembers((members) => {
        dispatch(setFamilyMembers(members));
      });

      // 食事参加データのリアルタイム監視
      const unsubscribeAttendances = SyncService.subscribeToMealAttendances((attendances) => {
        dispatch(setMealAttendances(attendances));
      });

      // 接続状態を更新
      dispatch(setConnected(true));
      dispatch(setLastSyncTime(new Date().toISOString()));

      // クリーンアップ関数を保存（実際の実装では適切に管理する）
      return { unsubscribeMembers, unsubscribeAttendances };
    } catch (err) {
      console.error('リアルタイム同期開始エラー:', err);
      return rejectWithValue('リアルタイム同期の開始に失敗しました。');
    }
  }
);

const familySlice = createSlice({
  name: 'family',
  initialState,
  reducers: {
    setFamilyMembers: (state, action: PayloadAction<FamilyMember[]>) => {
      state.members = action.payload;
      state.lastSyncTime = new Date().toISOString();
    },
    setMealAttendances: (state, action: PayloadAction<MealAttendance[]>) => {
      state.mealAttendances = action.payload;
      state.lastSyncTime = new Date().toISOString();
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setLastSyncTime: (state, action: PayloadAction<string>) => {
      state.lastSyncTime = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
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
      })
      // loginAsMember
      .addCase(loginAsMember.fulfilled, (state, action: PayloadAction<string>) => {
        state.currentMemberId = action.payload;
      })
      // logoutMember
      .addCase(logoutMember.fulfilled, (state) => {
        state.currentMemberId = null;
      })
      // submitPersonalResponse
      .addCase(submitPersonalResponse.fulfilled, (state, action: PayloadAction<PersonalResponse>) => {
        const { date, mealType, familyMemberId, willAttend } = action.payload;
        
        // 該当する MealAttendance を探す
        let attendance = state.mealAttendances.find(
          att => att.date === date && att.mealType === mealType
        );
        
        // なければ新規作成
        if (!attendance) {
          attendance = {
            id: `ma-${Date.now()}`,
            date,
            mealType,
            attendees: [],
            registeredBy: familyMemberId,
            createdAt: new Date().toISOString(),
            responses: [],
            isLocked: false,
          };
          state.mealAttendances.push(attendance);
        }
        
        // responses配列を初期化（なければ）
        if (!attendance.responses) {
          attendance.responses = [];
        }
        
        // 既存の回答を削除
        attendance.responses = attendance.responses.filter(
          r => r.familyMemberId !== familyMemberId
        );
        
        // 新しい回答を追加
        attendance.responses.push(action.payload);
        
        // attendees を更新
        if (willAttend) {
          if (!attendance.attendees.includes(familyMemberId)) {
            attendance.attendees.push(familyMemberId);
          }
        } else {
          attendance.attendees = attendance.attendees.filter(id => id !== familyMemberId);
        }
      })
      // updateResponseSettings
      .addCase(updateResponseSettings.fulfilled, (state, action: PayloadAction<ResponseSettings>) => {
        state.responseSettings = action.payload;
      });
  },
});

// アクションをエクスポート
export const { 
  setFamilyMembers, 
  setMealAttendances, 
  setConnected, 
  setLastSyncTime, 
  clearError 
} = familySlice.actions;

export default familySlice.reducer;
