import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';

// 初期状態
interface UserState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,
};

// 非同期アクション: ユーザー一覧取得
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      // 実際のAPI呼び出しの代わりに、ダミーデータを返す
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
      
      const dummyUsers: User[] = [
        {
          id: '1',
          name: '管理者',
          email: 'admin@example.com',
          role: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: '一般ユーザー',
          email: 'user@example.com',
          role: 'member',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      return dummyUsers;
    } catch (error) {
      return rejectWithValue('ユーザーデータの取得に失敗しました');
    }
  }
);

// 非同期アクション: ユーザーログイン
export const loginUser = createAsyncThunk(
  'users/loginUser',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // 実際の認証の代わりに、ダミーログイン
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
      
      if (credentials.email === 'admin@example.com') {
        const user: User = {
          id: '1',
          name: '管理者',
          email: 'admin@example.com',
          role: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return user;
      } else {
        const user: User = {
          id: '2',
          name: '一般ユーザー',
          email: 'user@example.com',
          role: 'member',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return user;
      }
    } catch (error) {
      return rejectWithValue('ログインに失敗しました');
    }
  }
);

// 非同期アクション: ユーザーログアウト
export const logoutUser = createAsyncThunk(
  'users/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // 実際のログアウト処理
      await new Promise(resolve => setTimeout(resolve, 500)); // 0.5秒待機
      return null;
    } catch (error) {
      return rejectWithValue('ログアウトに失敗しました');
    }
  }
);

// 非同期アクション: ユーザー追加
export const addUser = createAsyncThunk(
  'users/addUser',
  async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const newUser: User = {
        ...userData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return newUser;
    } catch (error) {
      return rejectWithValue('ユーザーの追加に失敗しました');
    }
  }
);

// スライス作成
const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // 同期アクション: エラークリア
    clearError: (state) => {
      state.error = null;
    },
    
    // 同期アクション: 現在のユーザー設定
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // ユーザー一覧取得
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.isLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // ユーザーログイン
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.currentUser = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // ユーザーログアウト
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.currentUser = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // ユーザー追加
      .addCase(addUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.users.push(action.payload);
      })
      .addCase(addUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentUser } = userSlice.actions;
export default userSlice.reducer;