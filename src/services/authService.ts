import { 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged, 
  User,
  updateProfile 
} from 'firebase/auth';
import { auth } from '../config/firebase';

class AuthService {
  // 匿名ログイン（家族メンバー選択後）
  static async signInAsFamilyMember(familyMemberId: string, memberName: string): Promise<User> {
    try {
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;
      
      // ユーザープロフィールに家族メンバー情報を設定
      await updateProfile(user, {
        displayName: memberName,
      });
      
      // カスタムクレームに家族メンバーIDを設定（実際の実装ではCloud Functionsを使用）
      await user.getIdToken(true); // トークンを更新
      
      return user;
    } catch (error) {
      console.error('ログインエラー:', error);
      throw new Error('ログインに失敗しました');
    }
  }

  // ログアウト
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('ログアウトエラー:', error);
      throw new Error('ログアウトに失敗しました');
    }
  }

  // 認証状態の監視
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  // 現在のユーザーを取得
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // 家族メンバーIDを取得（カスタムクレームから）
  static getFamilyMemberId(user: User): string | null {
    // 実際の実装ではカスタムクレームを使用
    // 今回はdisplayNameから推測
    return user.displayName || null;
  }
}

export default AuthService;
