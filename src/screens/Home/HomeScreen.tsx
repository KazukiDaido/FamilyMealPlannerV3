import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchFamilyMembers, fetchMealAttendances, registerMealAttendance, saveMealAttendance } from '../../store/slices/familySlice';
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

  const getAttendanceForMeal = (mealType: MealType) => {
    return mealAttendances.find(
      attendance => attendance.date === selectedDate && attendance.mealType === mealType
    );
  };

  const getAttendeeNames = (attendees: string[]) => {
    return attendees.map(id => members.find(member => member.id === id)?.name || '不明').join(', ');
  };

  const handleRegisterAttendance = async (mealType: MealType) => {
    if (!currentMemberId) {
      console.warn('ログイン中のメンバーが見つかりません');
      return;
    }

    try {
      // 回答期限を設定（現在時刻から30分後）
      const deadline = new Date();
      deadline.setMinutes(deadline.getMinutes() + 30);
      
      // 新しい食事参加データを作成
      const newAttendance: MealAttendance = {
        id: `meal_${Date.now()}`,
        date: selectedDate,
        mealType: mealType,
        attendees: [currentMemberId],
        registeredBy: currentMemberId,
        createdAt: new Date().toISOString(),
        deadline: deadline.toISOString(),
        isLocked: false,
        responses: [{
          id: `response_${Date.now()}`,
          familyMemberId: currentMemberId,
          date: selectedDate,
          mealType: mealType,
          willAttend: true,
          respondedAt: new Date().toISOString(),
        }],
      };

      // Firebaseに保存
      await dispatch(saveMealAttendance(newAttendance)).unwrap();
      console.log('食事参加データをFirebaseに保存完了:', newAttendance);
    } catch (error) {
      console.error('食事参加データの保存に失敗:', error);
    }
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
            <Text style={styles.personalResponseButtonText}>個人回答をする</Text>
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
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={() => handleRegisterAttendance(type)}
                >
                  <Ionicons name="add-circle-outline" size={24} color="#6B7C32" />
                </TouchableOpacity>
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