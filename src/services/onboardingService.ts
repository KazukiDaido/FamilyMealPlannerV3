import AsyncStorage from '@react-native-async-storage/async-storage';

class OnboardingService {
  private static readonly HAS_COMPLETED_ONBOARDING_KEY = 'hasCompletedOnboarding';
  private static readonly FAMILY_NAME_KEY = 'familyName';

  // 初回起動かどうかをチェック
  static async isFirstLaunch(): Promise<boolean> {
    try {
      const hasCompleted = await AsyncStorage.getItem(this.HAS_COMPLETED_ONBOARDING_KEY);
      return hasCompleted === null;
    } catch (error) {
      console.error('初回起動チェックエラー:', error);
      return true; // エラーの場合は初回起動として扱う
    }
  }

  // オンボーディング完了フラグを設定
  static async setOnboardingCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.HAS_COMPLETED_ONBOARDING_KEY, 'true');
    } catch (error) {
      console.error('オンボーディング完了フラグ設定エラー:', error);
      throw error;
    }
  }

  // 家族名を保存
  static async setFamilyName(familyName: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.FAMILY_NAME_KEY, familyName);
    } catch (error) {
      console.error('家族名保存エラー:', error);
      throw error;
    }
  }

  // 家族名を取得
  static async getFamilyName(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.FAMILY_NAME_KEY);
    } catch (error) {
      console.error('家族名取得エラー:', error);
      return null;
    }
  }

  // オンボーディングデータをリセット（デバッグ用）
  static async resetOnboarding(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.HAS_COMPLETED_ONBOARDING_KEY);
      await AsyncStorage.removeItem(this.FAMILY_NAME_KEY);
    } catch (error) {
      console.error('オンボーディングリセットエラー:', error);
      throw error;
    }
  }

  // 全オンボーディング関連データをクリア
  static async clearAllOnboardingData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.HAS_COMPLETED_ONBOARDING_KEY,
        this.FAMILY_NAME_KEY,
      ]);
    } catch (error) {
      console.error('オンボーディングデータクリアエラー:', error);
      throw error;
    }
  }
}

export default OnboardingService;
