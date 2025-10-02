import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { FamilyGroup, FamilyGroupJoinRequest } from '../../types';
import FamilyGroupService from '../../services/familyGroupService';

interface FamilyGroupState {
  currentFamilyGroup: FamilyGroup | null;
  joinRequests: FamilyGroupJoinRequest[];
  isLoading: boolean;
  error: string | null;
}

const initialState: FamilyGroupState = {
  currentFamilyGroup: null,
  joinRequests: [],
  isLoading: false,
  error: null,
};

// 非同期アクション: 家族グループを作成
export const createFamilyGroup = createAsyncThunk<
  FamilyGroup,
  { name: string; createdBy: string; settings?: Partial<FamilyGroup['settings']> },
  { rejectValue: string }
>(
  'familyGroup/create',
  async ({ name, createdBy, settings }, { rejectWithValue }) => {
    try {
      const familyGroup = await FamilyGroupService.createFamilyGroup(name, createdBy, settings);
      return familyGroup;
    } catch (error: any) {
      return rejectWithValue(error.message || '家族グループの作成に失敗しました');
    }
  }
);

// 非同期アクション: 家族グループを取得
export const fetchFamilyGroup = createAsyncThunk<
  FamilyGroup | null,
  string,
  { rejectValue: string }
>(
  'familyGroup/fetch',
  async (groupId, { rejectWithValue }) => {
    try {
      const familyGroup = await FamilyGroupService.getFamilyGroup(groupId);
      return familyGroup;
    } catch (error: any) {
      return rejectWithValue(error.message || '家族グループの取得に失敗しました');
    }
  }
);

// 非同期アクション: 家族コードで家族グループを検索
export const searchFamilyGroupByCode = createAsyncThunk<
  FamilyGroup | null,
  string,
  { rejectValue: string }
>(
  'familyGroup/searchByCode',
  async (familyCode, { rejectWithValue }) => {
    try {
      const familyGroup = await FamilyGroupService.getFamilyGroupByCode(familyCode);
      return familyGroup;
    } catch (error: any) {
      return rejectWithValue(error.message || '家族グループの検索に失敗しました');
    }
  }
);

// 非同期アクション: 家族グループ参加リクエストを作成
export const createJoinRequest = createAsyncThunk<
  FamilyGroupJoinRequest,
  { familyGroupId: string; requesterName: string; requesterId: string },
  { rejectValue: string }
>(
  'familyGroup/createJoinRequest',
  async ({ familyGroupId, requesterName, requesterId }, { rejectWithValue }) => {
    try {
      const joinRequest = await FamilyGroupService.createJoinRequest(
        familyGroupId,
        requesterName,
        requesterId
      );
      return joinRequest;
    } catch (error: any) {
      return rejectWithValue(error.message || '参加リクエストの作成に失敗しました');
    }
  }
);

// 非同期アクション: 参加リクエストを取得
export const fetchJoinRequests = createAsyncThunk<
  FamilyGroupJoinRequest[],
  string,
  { rejectValue: string }
>(
  'familyGroup/fetchJoinRequests',
  async (familyGroupId, { rejectWithValue }) => {
    try {
      const joinRequests = await FamilyGroupService.getJoinRequests(familyGroupId);
      return joinRequests;
    } catch (error: any) {
      return rejectWithValue(error.message || '参加リクエストの取得に失敗しました');
    }
  }
);

// 非同期アクション: 参加リクエストに応答
export const respondToJoinRequest = createAsyncThunk<
  void,
  { requestId: string; status: 'approved' | 'rejected' },
  { rejectValue: string }
>(
  'familyGroup/respondToJoinRequest',
  async ({ requestId, status }, { rejectWithValue }) => {
    try {
      await FamilyGroupService.respondToJoinRequest(requestId, status);
    } catch (error: any) {
      return rejectWithValue(error.message || '参加リクエストの応答に失敗しました');
    }
  }
);

// 非同期アクション: メンバー数を更新
export const updateMemberCount = createAsyncThunk<
  void,
  { groupId: string; count: number },
  { rejectValue: string }
>(
  'familyGroup/updateMemberCount',
  async ({ groupId, count }, { rejectWithValue }) => {
    try {
      await FamilyGroupService.updateMemberCount(groupId, count);
    } catch (error: any) {
      return rejectWithValue(error.message || 'メンバー数の更新に失敗しました');
    }
  }
);

const familyGroupSlice = createSlice({
  name: 'familyGroup',
  initialState,
  reducers: {
    setCurrentFamilyGroup: (state, action: PayloadAction<FamilyGroup | null>) => {
      state.currentFamilyGroup = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearJoinRequests: (state) => {
      state.joinRequests = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // createFamilyGroup
      .addCase(createFamilyGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createFamilyGroup.fulfilled, (state, action: PayloadAction<FamilyGroup>) => {
        state.isLoading = false;
        state.currentFamilyGroup = action.payload;
      })
      .addCase(createFamilyGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || '家族グループの作成に失敗しました';
      })
      // fetchFamilyGroup
      .addCase(fetchFamilyGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFamilyGroup.fulfilled, (state, action: PayloadAction<FamilyGroup | null>) => {
        state.isLoading = false;
        if (action.payload) {
          state.currentFamilyGroup = action.payload;
        }
      })
      .addCase(fetchFamilyGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || '家族グループの取得に失敗しました';
      })
      // searchFamilyGroupByCode
      .addCase(searchFamilyGroupByCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchFamilyGroupByCode.fulfilled, (state, action: PayloadAction<FamilyGroup | null>) => {
        state.isLoading = false;
        // 検索結果は一時的なものなので、currentFamilyGroupには設定しない
      })
      .addCase(searchFamilyGroupByCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || '家族グループの検索に失敗しました';
      })
      // createJoinRequest
      .addCase(createJoinRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createJoinRequest.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(createJoinRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || '参加リクエストの作成に失敗しました';
      })
      // fetchJoinRequests
      .addCase(fetchJoinRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJoinRequests.fulfilled, (state, action: PayloadAction<FamilyGroupJoinRequest[]>) => {
        state.isLoading = false;
        state.joinRequests = action.payload;
      })
      .addCase(fetchJoinRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || '参加リクエストの取得に失敗しました';
      })
      // respondToJoinRequest
      .addCase(respondToJoinRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(respondToJoinRequest.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(respondToJoinRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || '参加リクエストの応答に失敗しました';
      })
      // updateMemberCount
      .addCase(updateMemberCount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMemberCount.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updateMemberCount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'メンバー数の更新に失敗しました';
      });
  },
});

// アクションをエクスポート
export const { setCurrentFamilyGroup, clearError, clearJoinRequests } = familyGroupSlice.actions;

export default familyGroupSlice.reducer;
