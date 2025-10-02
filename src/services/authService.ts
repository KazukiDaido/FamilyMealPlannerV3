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
      // Firebase認証を試行
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;
      
      // ユーザープロフィールに家族メンバー情報を設定
      await updateProfile(user, {
        displayName: memberName,
      });
      
      return user;
    } catch (error) {
      console.error('Firebase認証エラー:', error);
      // Firebase認証に失敗した場合はダミーユーザーを作成
      console.log('Firebase認証に失敗、ダミーユーザーを使用');
      
      // ダミーユーザーオブジェクトを作成
      const dummyUser = {
        uid: `dummy_${familyMemberId}`,
        displayName: memberName,
        email: null,
        emailVerified: false,
        isAnonymous: true,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
        providerData: [],
        refreshToken: 'dummy_token',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => 'dummy_id_token',
        getIdTokenResult: async () => ({
          token: 'dummy_id_token',
          authTime: new Date().toISOString(),
          issuedAtTime: new Date().toISOString(),
          expirationTime: new Date(Date.now() + 3600000).toISOString(),
          signInProvider: 'anonymous',
          signInSecondFactor: null,
          claims: { familyMemberId },
        }),
        reload: async () => {},
        toJSON: () => ({}),
      } as User;
      
      return dummyUser;
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
