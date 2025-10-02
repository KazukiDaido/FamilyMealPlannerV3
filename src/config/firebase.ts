import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase設定（開発用 - 実際のプロジェクトでは環境変数を使用）
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "family-meal-planner-demo.firebaseapp.com",
  projectId: "family-meal-planner-demo",
  storageBucket: "family-meal-planner-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Firebase アプリを初期化
const app = initializeApp(firebaseConfig);

// Firestore を初期化
export const db = getFirestore(app);

// Authentication を初期化
export const auth = getAuth(app);

// 開発環境でのエミュレーター接続（本番環境では削除）
if (__DEV__) {
  try {
    // Firestore エミュレーターに接続
    connectFirestoreEmulator(db, 'localhost', 8080);
    // Auth エミュレーターに接続
    connectAuthEmulator(auth, 'http://localhost:9099');
  } catch (error) {
    // エミュレーターが既に接続されている場合はエラーを無視
    console.log('Firebase emulators already connected or not available');
  }
}

export default app;
