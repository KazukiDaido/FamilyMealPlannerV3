import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// スライスのインポート
import familyReducer from './slices/familySlice';
import userReducer from './slices/userSlice';
import familyGroupReducer from './slices/familyGroupSlice';

// ルートリデューサー
const rootReducer = combineReducers({
  family: familyReducer,
  user: userReducer,
  familyGroup: familyGroupReducer,
});

// 永続化設定
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['user', 'familyGroup'], // ユーザー情報と家族グループ情報を永続化
  // 食事データは毎回最新を取得するため永続化しない
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store設定
export const store = configureStore({
  reducer: persistedReducer, // 永続化を有効化
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// 永続化ストア
export const persistor = persistStore(store);

// 型定義
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
