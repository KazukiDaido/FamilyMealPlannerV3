import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase設定（実際のプロジェクト用）
const firebaseConfig = {
  apiKey: "AIzaSyDemoKey-ReplaceWithYourActualKey",
  authDomain: "family-meal-planner-v3.firebaseapp.com",
  projectId: "family-meal-planner-v3",
  storageBucket: "family-meal-planner-v3.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// 開発用: ダミー設定が使用されている場合はローカル動作に切り替え
const isDummyConfig = firebaseConfig.apiKey === "AIzaSyDemoKey-ReplaceWithYourActualKey";

// Firebase アプリを初期化
const app = initializeApp(firebaseConfig);

// Firestore を初期化
export const db = getFirestore(app);

// Authentication を初期化
export const auth = getAuth(app);

// ダミー設定の場合はローカル動作フラグをエクスポート
export { isDummyConfig };

// Firebaseエミュレーターは無効化（オフライン動作のため）
// 開発環境でのエミュレーター接続（本番環境では削除）
// if (__DEV__) {
//   try {
//     // Firestore エミュレーターに接続
//     connectFirestoreEmulator(db, 'localhost', 8080);
//     // Auth エミュレーターに接続
//     connectAuthEmulator(auth, 'http://localhost:9099');
//   } catch (error) {
//     // エミュレーターが既に接続されている場合はエラーを無視
//     console.log('Firebase emulators already connected or not available');
//   }
// }

export default app;
