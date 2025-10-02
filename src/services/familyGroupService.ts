import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { FamilyGroup, FamilyGroupJoinRequest } from '../types';

class FamilyGroupService {
  // 6桁の家族コードを生成
  static generateFamilyCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 家族グループを作成
  static async createFamilyGroup(
    name: string, 
    createdBy: string, 
    settings?: Partial<FamilyGroup['settings']>
  ): Promise<FamilyGroup> {
    try {
      const familyCode = this.generateFamilyCode();
      
      // 家族コードの重複チェック
      const existingGroup = await this.getFamilyGroupByCode(familyCode);
      if (existingGroup) {
        // 重複している場合は再生成
        return this.createFamilyGroup(name, createdBy, settings);
      }

      const familyGroupData: Omit<FamilyGroup, 'id'> = {
        name,
        familyCode,
        createdBy,
        createdAt: new Date().toISOString(),
        memberCount: 1,
        settings: {
          allowGuestJoin: true,
          requireApproval: false,
          ...settings,
        },
      };

      const docRef = await addDoc(collection(db, 'familyGroups'), {
        ...familyGroupData,
        createdAt: Timestamp.fromDate(new Date()),
      });

      return {
        id: docRef.id,
        ...familyGroupData,
      };
    } catch (error) {
      console.error('家族グループ作成エラー:', error);
      throw new Error('家族グループの作成に失敗しました');
    }
  }

  // 家族コードで家族グループを取得
  static async getFamilyGroupByCode(familyCode: string): Promise<FamilyGroup | null> {
    try {
      const q = query(
        collection(db, 'familyGroups'),
        where('familyCode', '==', familyCode)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        name: data.name,
        familyCode: data.familyCode,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        memberCount: data.memberCount,
        settings: data.settings,
      };
    } catch (error) {
      console.error('家族グループ取得エラー:', error);
      throw new Error('家族グループの取得に失敗しました');
    }
  }

  // 家族グループを取得
  static async getFamilyGroup(groupId: string): Promise<FamilyGroup | null> {
    try {
      const docRef = doc(db, 'familyGroups', groupId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        familyCode: data.familyCode,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        memberCount: data.memberCount,
        settings: data.settings,
      };
    } catch (error) {
      console.error('家族グループ取得エラー:', error);
      throw new Error('家族グループの取得に失敗しました');
    }
  }

  // 家族グループのメンバー数を更新
  static async updateMemberCount(groupId: string, count: number): Promise<void> {
    try {
      const groupRef = doc(db, 'familyGroups', groupId);
      await updateDoc(groupRef, { memberCount: count });
    } catch (error) {
      console.error('メンバー数更新エラー:', error);
      throw new Error('メンバー数の更新に失敗しました');
    }
  }

  // 家族グループ参加リクエストを作成
  static async createJoinRequest(
    familyGroupId: string,
    requesterName: string,
    requesterId: string
  ): Promise<FamilyGroupJoinRequest> {
    try {
      const requestData: Omit<FamilyGroupJoinRequest, 'id'> = {
        familyGroupId,
        requesterName,
        requesterId,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'familyGroupJoinRequests'), {
        ...requestData,
        requestedAt: Timestamp.fromDate(new Date()),
      });

      return {
        id: docRef.id,
        ...requestData,
      };
    } catch (error) {
      console.error('参加リクエスト作成エラー:', error);
      throw new Error('参加リクエストの作成に失敗しました');
    }
  }

  // 家族グループ参加リクエストを取得
  static async getJoinRequests(familyGroupId: string): Promise<FamilyGroupJoinRequest[]> {
    try {
      const q = query(
        collection(db, 'familyGroupJoinRequests'),
        where('familyGroupId', '==', familyGroupId),
        orderBy('requestedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          familyGroupId: data.familyGroupId,
          requesterName: data.requesterName,
          requesterId: data.requesterId,
          status: data.status,
          requestedAt: data.requestedAt?.toDate?.()?.toISOString() || data.requestedAt,
          respondedAt: data.respondedAt?.toDate?.()?.toISOString() || data.respondedAt,
        };
      });
    } catch (error) {
      console.error('参加リクエスト取得エラー:', error);
      throw new Error('参加リクエストの取得に失敗しました');
    }
  }

  // 参加リクエストを承認/拒否
  static async respondToJoinRequest(
    requestId: string,
    status: 'approved' | 'rejected'
  ): Promise<void> {
    try {
      const requestRef = doc(db, 'familyGroupJoinRequests', requestId);
      await updateDoc(requestRef, {
        status,
        respondedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('参加リクエスト応答エラー:', error);
      throw new Error('参加リクエストの応答に失敗しました');
    }
  }

  // 家族グループを削除
  static async deleteFamilyGroup(groupId: string): Promise<void> {
    try {
      const groupRef = doc(db, 'familyGroups', groupId);
      await deleteDoc(groupRef);
    } catch (error) {
      console.error('家族グループ削除エラー:', error);
      throw new Error('家族グループの削除に失敗しました');
    }
  }
}

export default FamilyGroupService;
