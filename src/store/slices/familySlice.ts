import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { FamilyMember, MealAttendance, MealType, PersonalResponse, ResponseSettings } from '../../types';
import RealtimeSyncService, { RealtimeMealAttendance, RealtimeFamilyMember } from '../../services/realtimeSyncService';

interface FamilyState {
  members: FamilyMember[];
  mealAttendances: MealAttendance[];
  currentMemberId: string | null; // ログイン中のメンバー
  responseSettings: ResponseSettings; // 回答設定
  isLoading: boolean;
  error: string | null;
  isConnected: boolean; // ネットワーク接続状態
  lastSyncTime: string | null; // 最後の同期時刻
  currentFamilyId: string | null; // 現在の家族グループID
  realtimeListeners: { [key: string]: () => void }; // リアルタイムリスナー
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
  currentFamilyId: null,
  realtimeListeners: {},
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
  async (_, { rejectWithValue, getState }) => {
    try {
      // Firebase接続を無効化、ローカルデータのみ使用
      console.log('ローカルデータを使用して家族メンバーを取得');
      
      // 現在のRedux状態を取得
      const state = getState() as { family: FamilyState };
      const currentMembers = state.family.members;
      
      // 既存のメンバーがいればそれを使用、なければダミーデータを返す
      if (currentMembers.length > 0) {
        console.log('既存の家族メンバーを使用:', currentMembers);
        return currentMembers;
      } else {
        console.log('ダミーデータを使用');
        return dummyMembers;
      }
    } catch (err) {
      console.error('家族メンバー取得エラー:', err);
      return rejectWithValue('家族メンバーの取得に失敗しました。');
    }
  }
);

// 非同期アクション: 食事参加を取得（ローカル動作）
export const fetchMealAttendances = createAsyncThunk<MealAttendance[], void, { rejectValue: string }>(
  'family/fetchAttendances',
  async (_, { rejectWithValue }) => {
    try {
      // ローカル動作: ダミーデータを返す
      console.log('ローカルデータを使用して食事参加を取得');
      return dummyAttendances;
    } catch (err) {
      // エラーの場合もダミーデータを使用
      console.warn('食事参加取得に失敗、ダミーデータを使用:', err);
      return dummyAttendances;
    }
  }
);

// 非同期アクション: 食事参加を登録（ローカル動作）
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
      
      // ローカル動作: IDを生成して返す
      const attendanceId = `att-${Date.now()}`;
      
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
export const startRealtimeSync = createAsyncThunk<void, string, { rejectValue: string }>(
  'family/startRealtimeSync',
  async (familyId, { dispatch, rejectWithValue }) => {
    try {
      console.log('リアルタイム同期開始:', familyId);
      
      // 既存のリスナーをクリーンアップ
      RealtimeSyncService.cleanup();
      
      // 家族メンバーのリアルタイムリスナーを設定
      const membersUnsubscribe = RealtimeSyncService.subscribeToFamilyMembers(
        familyId,
        (members: RealtimeFamilyMember[]) => {
          const familyMembers: FamilyMember[] = members.map(member => ({
            id: member.id,
            name: member.name,
            role: member.role,
            isProxy: member.isProxy
          }));
          dispatch(setFamilyMembers(familyMembers));
        }
      );

      // 食事参加状況のリアルタイムリスナーを設定
      const attendancesUnsubscribe = RealtimeSyncService.subscribeToMealAttendances(
        familyId,
        (attendances: RealtimeMealAttendance[]) => {
          const mealAttendances: MealAttendance[] = attendances.map(attendance => ({
            id: attendance.id,
            date: attendance.date,
            mealType: attendance.mealType,
            attendees: attendance.attendance === 'attending' ? [attendance.memberId] : [],
            registeredBy: attendance.memberId,
            createdAt: attendance.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
            responses: [{
              id: `pr-${attendance.id}`,
              familyMemberId: attendance.memberId,
              date: attendance.date,
              mealType: attendance.mealType,
              willAttend: attendance.attendance === 'attending',
              respondedAt: attendance.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
            }]
          }));
          dispatch(setMealAttendances(mealAttendances));
        }
      );

      // リスナーを保存（関数は直接保存しない）
      dispatch(setRealtimeListeners({
        members: 'active', // 関数の代わりに状態文字列を保存
        attendances: 'active'
      }));

      dispatch(setConnected(true));
      dispatch(setLastSyncTime(new Date().toISOString()));
      dispatch(setCurrentFamilyId(familyId));
      
      console.log('リアルタイム同期開始完了');
    } catch (err) {
      console.error('リアルタイム同期開始エラー:', err);
      return rejectWithValue('リアルタイム同期の開始に失敗しました。');
    }
  }
);

// リアルタイム同期の停止
export const stopRealtimeSync = createAsyncThunk<void, void, { rejectValue: string }>(
  'family/stopRealtimeSync',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      console.log('リアルタイム同期停止');
      
      // リスナーをクリーンアップ
      RealtimeSyncService.cleanup();
      
      dispatch(setConnected(false));
      dispatch(setRealtimeListeners({}));
      
      console.log('リアルタイム同期停止完了');
    } catch (err) {
      console.error('リアルタイム同期停止エラー:', err);
      return rejectWithValue('リアルタイム同期の停止に失敗しました。');
    }
  }
);

// 食事参加状況の送信（リアルタイム）
export const submitRealtimeMealAttendance = createAsyncThunk<
  void,
  { date: string; mealType: MealType; attendance: 'attending' | 'not_attending' | 'pending' },
  { rejectValue: string }
>(
  'family/submitRealtimeMealAttendance',
  async (attendanceData, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { family: FamilyState };
      const { currentMemberId, currentFamilyId } = state.family;
      
      if (!currentMemberId || !currentFamilyId) {
        throw new Error('ログイン情報が見つかりません');
      }

      const member = state.family.members.find(m => m.id === currentMemberId);
      if (!member) {
        throw new Error('メンバー情報が見つかりません');
      }

      const realtimeAttendance: RealtimeMealAttendance = {
        id: `att-${currentFamilyId}-${currentMemberId}-${attendanceData.date}-${attendanceData.mealType}`,
        familyId: currentFamilyId,
        memberId: currentMemberId,
        memberName: member.name,
        date: attendanceData.date,
        mealType: attendanceData.mealType,
        attendance: attendanceData.attendance,
        timestamp: new Date(),
        isProxy: member.isProxy
      };

      await RealtimeSyncService.saveMealAttendance(realtimeAttendance);
      console.log('リアルタイム食事参加状況送信完了:', realtimeAttendance);
    } catch (err) {
      console.error('リアルタイム食事参加状況送信エラー:', err);
      return rejectWithValue('食事参加状況の送信に失敗しました。');
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
    setCurrentFamilyId: (state, action: PayloadAction<string>) => {
      state.currentFamilyId = action.payload;
    },
    setRealtimeListeners: (state, action: PayloadAction<{ [key: string]: () => void }>) => {
      state.realtimeListeners = action.payload;
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
  setCurrentFamilyId,
  setRealtimeListeners,
  clearError 
} = familySlice.actions;

export default familySlice.reducer;
