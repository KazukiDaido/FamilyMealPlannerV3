import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// スライスのインポート
import familyReducer from './slices/familySlice';
import userReducer from './slices/userSlice';

// ルートリデューサー
const rootReducer = combineReducers({
  family: familyReducer,
  user: userReducer,
});

// 永続化設定
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['user'], // ユーザー情報のみ永続化
  // 食事データは毎回最新を取得するため永続化しない
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store設定
export const store = configureStore({
  reducer: persistedReducer,
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
