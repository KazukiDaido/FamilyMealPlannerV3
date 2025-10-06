import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db, isDummyConfig } from '../config/firebase';
import { FamilyMember, MealAttendance } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RealtimeMealAttendance {
  id: string;
  familyId: string;
  memberId: string;
  memberName: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  attendance: 'attending' | 'not_attending' | 'pending';
  timestamp: any;
  isProxy: boolean;
}

export interface RealtimeFamilyMember {
  id: string;
  familyId: string;
  name: string;
  role: 'parent' | 'child';
  isProxy: boolean;
  createdAt: any;
  lastActive: any;
}

class RealtimeSyncService {
  private listeners: { [key: string]: () => void } = {};

  // 食事参加状況の保存
  async saveMealAttendance(attendance: RealtimeMealAttendance): Promise<void> {
    if (isDummyConfig) {
      // ローカルモード: AsyncStorageに保存
      const key = `meal_attendance_${attendance.familyId}_${attendance.memberId}_${attendance.date}_${attendance.mealType}`;
      await AsyncStorage.setItem(key, JSON.stringify(attendance));
      console.log('ローカル保存完了:', attendance);
      return;
    }

    try {
      const docRef = doc(db, 'mealAttendances', attendance.id);
      await setDoc(docRef, {
        ...attendance,
        timestamp: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('Firestore保存完了:', attendance);
    } catch (error) {
      console.error('食事参加状況の保存エラー:', error);
      throw error;
    }
  }

  // 家族メンバーの保存
  async saveFamilyMember(member: RealtimeFamilyMember): Promise<void> {
    if (isDummyConfig) {
      // ローカルモード: AsyncStorageに保存
      const key = `family_member_${member.familyId}_${member.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(member));
      console.log('ローカル保存完了:', member);
      return;
    }

    try {
      const docRef = doc(db, 'familyMembers', member.id);
      await setDoc(docRef, {
        ...member,
        lastActive: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('Firestore保存完了:', member);
    } catch (error) {
      console.error('家族メンバーの保存エラー:', error);
      throw error;
    }
  }

  // 食事参加状況の取得
  async getMealAttendances(familyId: string, date?: string): Promise<RealtimeMealAttendance[]> {
    if (isDummyConfig) {
      // ローカルモード: AsyncStorageから取得
      const keys = await AsyncStorage.getAllKeys();
      const attendanceKeys = keys.filter(key => 
        key.startsWith(`meal_attendance_${familyId}`) && 
        (!date || key.includes(date))
      );
      
      const attendances = await AsyncStorage.multiGet(attendanceKeys);
      return attendances.map(([_, value]) => JSON.parse(value || '{}'));
    }

    try {
      const q = query(
        collection(db, 'mealAttendances'),
        where('familyId', '==', familyId),
        ...(date ? [where('date', '==', date)] : []),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RealtimeMealAttendance[];
    } catch (error) {
      console.error('食事参加状況の取得エラー:', error);
      throw error;
    }
  }

  // 家族メンバーの取得
  async getFamilyMembers(familyId: string): Promise<RealtimeFamilyMember[]> {
    if (isDummyConfig) {
      // ローカルモード: AsyncStorageから取得
      const keys = await AsyncStorage.getAllKeys();
      const memberKeys = keys.filter(key => key.startsWith(`family_member_${familyId}`));
      
      const members = await AsyncStorage.multiGet(memberKeys);
      return members.map(([_, value]) => JSON.parse(value || '{}'));
    }

    try {
      const q = query(
        collection(db, 'familyMembers'),
        where('familyId', '==', familyId),
        orderBy('createdAt', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RealtimeFamilyMember[];
    } catch (error) {
      console.error('家族メンバーの取得エラー:', error);
      throw error;
    }
  }

  // リアルタイムリスナーの設定
  subscribeToMealAttendances(
    familyId: string, 
    callback: (attendances: RealtimeMealAttendance[]) => void,
    date?: string
  ): () => void {
    if (isDummyConfig) {
      // ローカルモード: 定期的なポーリング
      const pollInterval = setInterval(async () => {
        try {
          const attendances = await this.getMealAttendances(familyId, date);
          callback(attendances);
        } catch (error) {
          console.error('ローカルポーリングエラー:', error);
        }
      }, 5000); // 5秒ごとに更新

      const unsubscribe = () => clearInterval(pollInterval);
      this.listeners[`meal_attendances_${familyId}_${date || 'all'}`] = unsubscribe;
      return unsubscribe;
    }

    try {
      const q = query(
        collection(db, 'mealAttendances'),
        where('familyId', '==', familyId),
        ...(date ? [where('date', '==', date)] : []),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const attendances = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as RealtimeMealAttendance[];
        
        callback(attendances);
      }, (error) => {
        console.error('リアルタイムリスナーエラー:', error);
      });

      this.listeners[`meal_attendances_${familyId}_${date || 'all'}`] = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error('リアルタイムリスナー設定エラー:', error);
      return () => {};
    }
  }

  // 家族メンバーのリアルタイムリスナー
  subscribeToFamilyMembers(
    familyId: string, 
    callback: (members: RealtimeFamilyMember[]) => void
  ): () => void {
    if (isDummyConfig) {
      // ローカルモード: 定期的なポーリング
      const pollInterval = setInterval(async () => {
        try {
          const members = await this.getFamilyMembers(familyId);
          callback(members);
        } catch (error) {
          console.error('ローカルポーリングエラー:', error);
        }
      }, 10000); // 10秒ごとに更新

      const unsubscribe = () => clearInterval(pollInterval);
      this.listeners[`family_members_${familyId}`] = unsubscribe;
      return unsubscribe;
    }

    try {
      const q = query(
        collection(db, 'familyMembers'),
        where('familyId', '==', familyId),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const members = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as RealtimeFamilyMember[];
        
        callback(members);
      }, (error) => {
        console.error('リアルタイムリスナーエラー:', error);
      });

      this.listeners[`family_members_${familyId}`] = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error('リアルタイムリスナー設定エラー:', error);
      return () => {};
    }
  }

  // 全リスナーのクリーンアップ
  cleanup(): void {
    Object.values(this.listeners).forEach(unsubscribe => unsubscribe());
    this.listeners = {};
  }

  // データの同期（オフライン→オンライン）
  async syncOfflineData(familyId: string): Promise<void> {
    if (isDummyConfig) return;

    try {
      console.log('オフラインデータの同期開始...');
      
      // ローカルに保存された食事参加状況を同期
      const keys = await AsyncStorage.getAllKeys();
      const attendanceKeys = keys.filter(key => key.startsWith(`meal_attendance_${familyId}`));
      
      for (const key of attendanceKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          const attendance = JSON.parse(value);
          await this.saveMealAttendance(attendance);
        }
      }

      // ローカルに保存された家族メンバーを同期
      const memberKeys = keys.filter(key => key.startsWith(`family_member_${familyId}`));
      
      for (const key of memberKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          const member = JSON.parse(value);
          await this.saveFamilyMember(member);
        }
      }

      console.log('オフラインデータの同期完了');
    } catch (error) {
      console.error('オフラインデータ同期エラー:', error);
      throw error;
    }
  }
}

export default new RealtimeSyncService();

