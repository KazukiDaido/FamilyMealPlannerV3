import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { FamilyMember, MealAttendance, PersonalResponse } from '../types';

class SyncService {
  // 家族メンバーの同期
  static async syncFamilyMembers(): Promise<FamilyMember[]> {
    try {
      const familyMembersRef = collection(db, 'familyMembers');
      const snapshot = await getDocs(familyMembersRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FamilyMember[];
    } catch (error) {
      console.error('家族メンバー同期エラー:', error);
      console.log('Firebase接続に失敗、ダミーデータを使用');
      
      // ダミーデータを返す
      return [
        { id: '1', name: 'お父さん', role: 'parent', isProxy: true },
        { id: '2', name: 'お母さん', role: 'parent', isProxy: true },
        { id: '3', name: '太郎', role: 'child', isProxy: false },
        { id: '4', name: '花子', role: 'child', isProxy: false },
      ];
    }
  }

  // 家族メンバーのリアルタイム監視
  static subscribeToFamilyMembers(callback: (members: FamilyMember[]) => void): () => void {
    const familyMembersRef = collection(db, 'familyMembers');
    
    return onSnapshot(familyMembersRef, (snapshot) => {
      const members = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FamilyMember[];
      
      callback(members);
    });
  }

  // 食事参加データの同期
  static async syncMealAttendances(): Promise<MealAttendance[]> {
    try {
      const mealAttendancesRef = collection(db, 'mealAttendances');
      const q = query(mealAttendancesRef, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // FirestoreのTimestampをISO文字列に変換
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          deadline: data.deadline?.toDate?.()?.toISOString() || data.deadline,
        } as MealAttendance;
      });
    } catch (error) {
      console.error('食事参加データ同期エラー:', error);
      throw new Error('食事参加データの同期に失敗しました');
    }
  }

  // 食事参加データのリアルタイム監視
  static subscribeToMealAttendances(callback: (attendances: MealAttendance[]) => void): () => void {
    const mealAttendancesRef = collection(db, 'mealAttendances');
    const q = query(mealAttendancesRef, orderBy('date', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const attendances = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          deadline: data.deadline?.toDate?.()?.toISOString() || data.deadline,
        } as MealAttendance;
      });
      
      callback(attendances);
    });
  }

  // 食事参加データを保存
  static async saveMealAttendance(attendance: Omit<MealAttendance, 'id'>): Promise<string> {
    try {
      const docRef = doc(collection(db, 'mealAttendances'));
      
      // Firestore用にデータを変換
      const firestoreData = {
        ...attendance,
        createdAt: Timestamp.fromDate(new Date(attendance.createdAt)),
        deadline: attendance.deadline ? Timestamp.fromDate(new Date(attendance.deadline)) : null,
      };
      
      await setDoc(docRef, firestoreData);
      return docRef.id;
    } catch (error) {
      console.error('食事参加データ保存エラー:', error);
      throw new Error('食事参加データの保存に失敗しました');
    }
  }

  // 個人回答を保存
  static async savePersonalResponse(response: PersonalResponse): Promise<void> {
    try {
      const responseRef = doc(collection(db, 'personalResponses'));
      
      const firestoreData = {
        ...response,
        respondedAt: Timestamp.fromDate(new Date(response.respondedAt)),
      };
      
      await setDoc(responseRef, firestoreData);
    } catch (error) {
      console.error('個人回答保存エラー:', error);
      throw new Error('個人回答の保存に失敗しました');
    }
  }

  // 家族メンバーを追加
  static async addFamilyMember(member: Omit<FamilyMember, 'id'>): Promise<string> {
    try {
      const docRef = doc(collection(db, 'familyMembers'));
      await setDoc(docRef, member);
      return docRef.id;
    } catch (error) {
      console.error('家族メンバー追加エラー:', error);
      throw new Error('家族メンバーの追加に失敗しました');
    }
  }

  // 家族メンバーを更新
  static async updateFamilyMember(memberId: string, updates: Partial<FamilyMember>): Promise<void> {
    try {
      const memberRef = doc(db, 'familyMembers', memberId);
      await updateDoc(memberRef, updates);
    } catch (error) {
      console.error('家族メンバー更新エラー:', error);
      throw new Error('家族メンバーの更新に失敗しました');
    }
  }

  // 家族メンバーを削除
  static async deleteFamilyMember(memberId: string): Promise<void> {
    try {
      const memberRef = doc(db, 'familyMembers', memberId);
      await deleteDoc(memberRef);
    } catch (error) {
      console.error('家族メンバー削除エラー:', error);
      throw new Error('家族メンバーの削除に失敗しました');
    }
  }
}

export default SyncService;
