import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// 非同期アクション: ユーザーログイン
export const loginUser = createAsyncThunk<User, { email: string; password: string }, { rejectValue: string }>(
  'user/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (credentials.email === 'test@example.com' && credentials.password === 'password') {
        return { id: 'user1', name: 'テストユーザー', email: 'test@example.com', familyMemberId: '1' };
      } else {
        return rejectWithValue('メールアドレスまたはパスワードが間違っています。');
      }
    } catch (err) {
      return rejectWithValue('ログインに失敗しました。');
    }
  }
);

// 非同期アクション: ユーザーログアウト
export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'user/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    } catch (err) {
      return rejectWithValue('ログアウトに失敗しました。');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // loginUser
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.currentUser = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.currentUser = null;
        state.error = action.payload || '不明なログインエラー';
      })
      // logoutUser
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.currentUser = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || '不明なログアウトエラー';
      });
  },
});

export default userSlice.reducer;