import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Meal } from '../../types';

// 初期状態
interface MealState {
  meals: Meal[];
  isLoading: boolean;
  error: string | null;
}

const initialState: MealState = {
  meals: [],
  isLoading: false,
  error: null,
};

// 非同期アクション: 食事一覧取得
export const fetchMeals = createAsyncThunk(
  'meals/fetchMeals',
  async (_, { rejectWithValue }) => {
    try {
      // 実際のAPI呼び出しの代わりに、ダミーデータを返す
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
      
      const dummyMeals: Meal[] = [
        {
          id: '1',
          name: '朝食セット',
          date: '2024-01-01',
          type: 'breakfast',
          description: 'パンとコーヒーのセット',
          ingredients: ['パン', 'バター', 'コーヒー'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'ランチセット',
          date: '2024-01-01',
          type: 'lunch',
          description: 'サンドイッチとサラダ',
          ingredients: ['パン', 'レタス', 'トマト', 'ハム'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      return dummyMeals;
    } catch (error) {
      return rejectWithValue('食事データの取得に失敗しました');
    }
  }
);

// 非同期アクション: 食事追加
export const addMeal = createAsyncThunk(
  'meals/addMeal',
  async (meal: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      // 実際のAPI呼び出しの代わりに、新しいIDを生成
      const newMeal: Meal = {
        ...meal,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return newMeal;
    } catch (error) {
      return rejectWithValue('食事の追加に失敗しました');
    }
  }
);

// 非同期アクション: 食事更新
export const updateMeal = createAsyncThunk(
  'meals/updateMeal',
  async (meal: Meal, { rejectWithValue }) => {
    try {
      const updatedMeal: Meal = {
        ...meal,
        updatedAt: new Date().toISOString(),
      };
      
      return updatedMeal;
    } catch (error) {
      return rejectWithValue('食事の更新に失敗しました');
    }
  }
);

// 非同期アクション: 食事削除
export const deleteMeal = createAsyncThunk(
  'meals/deleteMeal',
  async (mealId: string, { rejectWithValue }) => {
    try {
      return mealId;
    } catch (error) {
      return rejectWithValue('食事の削除に失敗しました');
    }
  }
);

// スライス作成
const mealSlice = createSlice({
  name: 'meals',
  initialState,
  reducers: {
    // 同期アクション: エラークリア
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 食事一覧取得
      .addCase(fetchMeals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMeals.fulfilled, (state, action: PayloadAction<Meal[]>) => {
        state.isLoading = false;
        state.meals = action.payload;
      })
      .addCase(fetchMeals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // 食事追加
      .addCase(addMeal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addMeal.fulfilled, (state, action: PayloadAction<Meal>) => {
        state.isLoading = false;
        state.meals.push(action.payload);
      })
      .addCase(addMeal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // 食事更新
      .addCase(updateMeal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMeal.fulfilled, (state, action: PayloadAction<Meal>) => {
        state.isLoading = false;
        const index = state.meals.findIndex(meal => meal.id === action.payload.id);
        if (index !== -1) {
          state.meals[index] = action.payload;
        }
      })
      .addCase(updateMeal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // 食事削除
      .addCase(deleteMeal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteMeal.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.meals = state.meals.filter(meal => meal.id !== action.payload);
      })
      .addCase(deleteMeal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = mealSlice.actions;
export default mealSlice.reducer;