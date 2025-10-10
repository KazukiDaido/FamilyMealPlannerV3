import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchFamilyMembers, fetchMealAttendances, setMealAttendances } from '../../store/slices/familySlice';
import { FamilyMember, MealAttendance, MealType } from '../../types';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    members, 
    mealAttendances, 
    isLoading, 
    currentMemberId,
    isConnected,
    lastSyncTime,
    currentFamilyId
  } = useSelector((state: RootState) => state.family);
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    dispatch(fetchFamilyMembers());
    dispatch(fetchMealAttendances({}));
  }, [dispatch]);

  // 古い食事参加データをクリアする関数
  const clearOldMealData = () => {
    Alert.alert(
      'データクリア',
      '期限切れの食事参加データをクリアしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'クリア',
          style: 'destructive',
          onPress: async () => {
            try {
              // 期限切れのデータをフィルタリング
              const now = new Date();
              const expiredAttendances = mealAttendances.filter(attendance => {
                if (!attendance.deadline) return false;
                return new Date(attendance.deadline) < now;
              });
              
              console.log(`期限切れデータ数: ${expiredAttendances.length}`);
              
              // 期限切れデータを削除（Redux stateから）
              const validAttendances = mealAttendances.filter(attendance => {
                if (!attendance.deadline) return true; // 期限がない場合は保持
                return new Date(attendance.deadline) >= now; // 期限が未来の場合は保持
              });
              
              // Redux stateを更新
              dispatch(setMealAttendances(validAttendances));
              
              // データを再取得してFirebaseと同期
              dispatch(fetchMealAttendances({}));
              
              Alert.alert('完了', `${expiredAttendances.length}件の期限切れデータをクリアしました`);
            } catch (error) {
              console.error('データクリアエラー:', error);
              Alert.alert('エラー', 'データのクリアに失敗しました');
            }
          }
        }
      ]
    );
  };

  const getAttendanceForMeal = (mealType: MealType) => {
    // 今日の日付で、指定された食事タイプの最新の参加データを取得
    const todayAttendances = mealAttendances.filter(
      attendance => attendance.date === selectedDate && attendance.mealType === mealType
    );
    
    if (todayAttendances.length === 0) {
      return null;
    }
    
    // 最新のデータを取得（createdAtでソート）
    return todayAttendances.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  };

  const getAttendeeNames = (attendees: string[]) => {
    return attendees.map(id => members.find(member => member.id === id)?.name || '不明').join(', ');
  };


  const mealTypes: { type: MealType; label: string; icon: string }[] = [
    { type: 'breakfast', label: '朝食', icon: 'sunny-outline' },
    { type: 'lunch', label: '昼食', icon: 'restaurant-outline' },
    { type: 'dinner', label: '夕食', icon: 'moon-outline' },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B7C32" />
        <Text style={styles.loadingText}>データを読み込み中...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>今日の食事参加</Text>
          <View style={styles.syncStatus}>
            <Ionicons 
              name={isConnected ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={isConnected ? "#4CAF50" : "#F44336"} 
            />
            <Text style={[styles.syncStatusText, { color: isConnected ? "#4CAF50" : "#F44336" }]}>
              {isConnected ? "リアルタイム同期中" : "オフライン"}
            </Text>
          </View>
        </View>
        <Text style={styles.dateText}>{selectedDate}</Text>
        {lastSyncTime && (
          <Text style={styles.lastSyncText}>
            最終同期: {new Date(lastSyncTime).toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* 個人回答ボタン */}
      {currentMemberId && (
        <View style={styles.personalResponseSection}>
          <TouchableOpacity 
            style={styles.personalResponseButton}
            onPress={() => navigation.navigate('PersonalResponse')}
          >
            <Ionicons name="person-outline" size={20} color="white" />
            <Text style={styles.personalResponseButtonText}>参加予定を回答</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content}>
        {mealTypes.map(({ type, label, icon }) => {
          const attendance = getAttendanceForMeal(type);
          const attendeeNames = attendance ? getAttendeeNames(attendance.attendees) : '';

          return (
            <View key={type} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Ionicons name={icon as any} size={24} color="#6B7C32" />
                <Text style={styles.mealTitle}>{label}</Text>
              </View>

              {attendance ? (
                <View style={styles.attendanceInfo}>
                  <Text style={styles.attendeeText}>参加者: {attendeeNames}</Text>
                  <Text style={styles.registeredByText}>
                    登録者: {members.find(m => m.id === attendance.registeredBy)?.name || '不明'}
                  </Text>
                </View>
              ) : (
                <View style={styles.noAttendanceInfo}>
                  <Text style={styles.noAttendanceText}>まだ登録されていません</Text>
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.familyButton}
          onPress={() => navigation.navigate('Family')}
        >
          <Ionicons name="people-outline" size={20} color="white" />
          <Text style={styles.familyButtonText}>家族メンバー管理</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.clearDataButton}
          onPress={clearOldMealData}
        >
          <Ionicons name="trash-outline" size={20} color="white" />
          <Text style={styles.clearDataButtonText}>古いデータをクリア</Text>
        </TouchableOpacity>

        {/* デバッグ用ボタン */}
        <TouchableOpacity
          style={[styles.clearDataButton, { backgroundColor: '#FF9500' }]}
          onPress={() => {
            console.log('現在の食事参加データ数:', mealAttendances.length);
            console.log('期限切れデータ数:', mealAttendances.filter(a => a.deadline && new Date(a.deadline) < new Date()).length);
            Alert.alert('デバッグ情報', `食事参加データ: ${mealAttendances.length}件\n期限切れ: ${mealAttendances.filter(a => a.deadline && new Date(a.deadline) < new Date()).length}件`);
          }}
        >
          <Ionicons name="information-circle-outline" size={20} color="white" />
          <Text style={styles.clearDataButtonText}>デバッグ情報</Text>
        </TouchableOpacity>

        {/* 今日のデータをリセット */}
        <TouchableOpacity
          style={[styles.clearDataButton, { backgroundColor: '#FF3B30' }]}
          onPress={() => {
            Alert.alert(
              '今日のデータリセット',
              '今日の食事参加データをすべてリセットしますか？',
              [
                { text: 'キャンセル', style: 'cancel' },
                {
                  text: 'リセット',
                  style: 'destructive',
                  onPress: () => {
                    const today = new Date().toISOString().split('T')[0];
                    const filteredAttendances = mealAttendances.filter(attendance => attendance.date !== today);
                    dispatch(setMealAttendances(filteredAttendances));
                    Alert.alert('完了', '今日の食事参加データをリセットしました');
                  }
                }
              ]
            );
          }}
        >
          <Ionicons name="refresh-outline" size={20} color="white" />
          <Text style={styles.clearDataButtonText}>今日のデータをリセット</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  lastSyncText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  registerButton: {
    padding: 4,
  },
  attendanceInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  attendeeText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  registeredByText: {
    fontSize: 14,
    color: '#666',
  },
  noAttendanceInfo: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
  },
  noAttendanceText: {
    fontSize: 16,
    color: '#856404',
    textAlign: 'center',
  },
  familyButton: {
    backgroundColor: '#6B7C32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  familyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  clearDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 10,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  clearDataButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  personalResponseSection: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  personalResponseButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  personalResponseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default HomeScreen;